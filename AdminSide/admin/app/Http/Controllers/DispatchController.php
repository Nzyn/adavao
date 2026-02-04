<?php

namespace App\Http\Controllers;

use App\Models\PatrolDispatch;
use App\Models\Report;
use App\Models\User;
use App\Models\PoliceStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Services\EncryptionService;

class DispatchController extends Controller
{
    /**
     * patrol_dispatches.station_id is NOT NULL, but some reports/officers may not have a station.
     * This resolves a safe station_id for storage/analytics by:
     * 1) report assigned station
     * 2) officer assigned station
     * 3) dispatcher station
     * 4) nearest police station to report coordinates
     * 5) first available police station
     */
    private function resolveDispatchStationId(?int $reportStationId, ?int $officerStationId, ?int $dispatcherStationId, ?float $reportLat, ?float $reportLng): ?int
    {
        $stationId = $reportStationId ?? $officerStationId ?? $dispatcherStationId;
        if ($stationId) return (int) $stationId;

        // Nearest by coordinates
        if ($reportLat !== null && $reportLng !== null) {
            $nearest = DB::selectOne("
                SELECT station_id
                FROM police_stations
                WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                ORDER BY (
                    6371 * acos(
                        cos(radians(?)) * cos(radians(latitude))
                        * cos(radians(longitude) - radians(?))
                        + sin(radians(?)) * sin(radians(latitude))
                    )
                ) ASC
                LIMIT 1
            ", [$reportLat, $reportLng, $reportLat]);

            if ($nearest && isset($nearest->station_id)) {
                return (int) $nearest->station_id;
            }
        }

        // Fallback: any station
        $any = DB::table('police_stations')->orderBy('station_id')->value('station_id');
        return $any ? (int) $any : null;
    }

    /**
     * Display all dispatches
     */
    public function index(Request $request)
    {
        $query = PatrolDispatch::with(['report.user', 'station', 'patrolOfficer', 'dispatcher'])
            ->orderBy('dispatched_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by station
        if ($request->has('station_id')) {
            $query->where('station_id', $request->station_id);
        }

        // Filter by officer
        if ($request->has('officer_id')) {
            $query->where('patrol_officer_id', $request->officer_id);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('dispatched_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('dispatched_at', '<=', $request->date_to);
        }

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                // Search by Report ID or Title
                $q->whereHas('report', function($rq) use ($search) {
                    $rq->where('report_id', 'like', "%$search%")
                       ->orWhere('title', 'like', "%$search%")
                       // Search by Reporter Name
                       ->orWhereHas('user', function($uq) use ($search) {
                           $uq->where('firstname', 'like', "%$search%")
                              ->orWhere('lastname', 'like', "%$search%");
                       });
                })
                // Search by Patrol Officer Name
                ->orWhereHas('patrolOfficer', function($pq) use ($search) {
                    $pq->where('firstname', 'like', "%$search%")
                       ->orWhere('lastname', 'like', "%$search%");
                });
            });
        }

        $dispatches = $query->paginate(20)->withQueryString();

        // 🔓 Decrypt sensitive fields in reports for display
        // Note: Only description, barangay, and reporters_address are encrypted (not title)
        foreach ($dispatches as $dispatch) {
            if ($dispatch->report) {
                $dispatch->report->description = EncryptionService::decrypt($dispatch->report->description);
                if ($dispatch->report->location) {
                    $dispatch->report->location->barangay = EncryptionService::decrypt($dispatch->report->location->barangay);
                    $dispatch->report->location->reporters_address = EncryptionService::decrypt($dispatch->report->location->reporters_address);
                }
            }
        }

        // Get statistics
        $stats = [
            'total' => PatrolDispatch::count(),
            'active' => PatrolDispatch::active()->count(),
            'completed' => PatrolDispatch::completed()->count(),
            'three_minute_compliance' => $this->getThreeMinuteCompliance(),
            'avg_response_time' => $this->getAverageResponseTime(),
        ];

        // Get available officers
                $officers = User::whereRaw("LOWER(COALESCE(user_role::text, role::text, '')) = ?", ['patrol_officer'])
                        ->where('is_on_duty', true)
                        ->get();

        $stations = PoliceStation::all();

        return view('dispatches', compact('dispatches', 'stats', 'officers', 'stations'));
    }

    /**
     * Create new dispatch from report
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'report_id' => 'required|exists:reports,report_id',
                'patrol_officer_id' => 'nullable|exists:users_public,id',
                'notes' => 'nullable|string',
            ]);

            $report = Report::with('location')->findOrFail($request->report_id);

            // Derive station_id (patrol_dispatches.station_id is NOT NULL)
            $officerStationId = null;
            if ($request->filled('patrol_officer_id')) {
                $officerStationId = DB::table('users_public')
                    ->where('id', $request->patrol_officer_id)
                    ->value('assigned_station_id');
            }
            $stationId = $this->resolveDispatchStationId(
                $report->assigned_station_id,
                $officerStationId,
                auth()->user()->station_id ?? null,
                $report->location->latitude ?? null,
                $report->location->longitude ?? null
            );

            if (!$stationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot create dispatch: no police stations exist in the system.'
                ], 400);
            }

            // Check if report already has an active dispatch
            $existingDispatch = PatrolDispatch::where('report_id', $report->report_id)
                ->active()
                ->first();

            if ($existingDispatch) {
                return response()->json([
                    'success' => false,
                    'message' => 'This report already has an active dispatch'
                ], 400);
            }

            $dispatch = PatrolDispatch::create([
                'report_id' => $report->report_id,
                'station_id' => $stationId,
                'patrol_officer_id' => $request->patrol_officer_id,
                'status' => 'pending',
                'dispatched_at' => now(),
                'dispatched_by' => auth()->id(),
                'notes' => $request->notes,
            ]);

            // Send notification to patrol officer
            if ($dispatch->patrol_officer_id) {
                $this->sendDispatchNotification($dispatch);
            }

            Log::info('Dispatch created', [
                'dispatch_id' => $dispatch->dispatch_id,
                'report_id' => $report->report_id,
                'officer_id' => $dispatch->patrol_officer_id,
            ]);

            // Load relationships and decrypt for response
            $dispatch->load(['report.location', 'patrolOfficer']);
            $this->decryptDispatchReport($dispatch);

            return response()->json([
                'success' => true,
                'message' => 'Dispatch created successfully',
                'dispatch' => $dispatch,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create dispatch: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create dispatch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update dispatch status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:accepted,declined,en_route,arrived,completed,cancelled',
                'decline_reason' => 'required_if:status,declined',
                'cancellation_reason' => 'required_if:status,cancelled',
                'validation_notes' => 'nullable|string',
                'is_valid' => 'nullable|boolean',
            ]);

            $dispatch = PatrolDispatch::findOrFail($id);
            $oldStatus = $dispatch->status;
            $dispatch->status = $request->status;

            // Update timestamps based on status
            switch ($request->status) {
                case 'accepted':
                    $dispatch->accepted_at = now();
                    $dispatch->calculateAcceptanceTime();
                    break;

                case 'declined':
                    $dispatch->declined_at = now();
                    $dispatch->decline_reason = $request->decline_reason;
                    break;

                case 'en_route':
                    $dispatch->en_route_at = now();
                    break;

                case 'arrived':
                    $dispatch->arrived_at = now();
                    $dispatch->calculateResponseTime(); // This also calculates 3-minute rule
                    break;

                case 'completed':
                    $dispatch->completed_at = now();
                    $dispatch->calculateCompletionTime();
                    if ($request->has('is_valid')) {
                        $dispatch->is_valid = $request->is_valid;
                        $dispatch->validation_notes = $request->validation_notes;
                        $dispatch->validated_at = now();
                        
                        // Update report validity
                        $report = $dispatch->report;
                        $report->is_valid = $request->is_valid ? 'valid' : 'invalid';
                        $report->save();
                    }
                    break;

                case 'cancelled':
                    $dispatch->cancelled_at = now();
                    $dispatch->cancellation_reason = $request->cancellation_reason;
                    break;
            }

            $dispatch->save();

            Log::info('Dispatch status updated', [
                'dispatch_id' => $dispatch->dispatch_id,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
            ]);

            // Load relationships and decrypt for response
            $dispatch = $dispatch->fresh()->load(['report.location', 'patrolOfficer']);
            $this->decryptDispatchReport($dispatch);

            return response()->json([
                'success' => true,
                'message' => 'Dispatch status updated successfully',
                'dispatch' => $dispatch,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update dispatch status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update dispatch status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign dispatch to patrol officer
     */
    public function assign(Request $request, $id)
    {
        try {
            $request->validate([
                'patrol_officer_id' => 'required|exists:users_public,id',
            ]);

            $dispatch = PatrolDispatch::findOrFail($id);
            $dispatch->patrol_officer_id = $request->patrol_officer_id;
            $dispatch->save();

            // Send notification
            $this->sendDispatchNotification($dispatch);

            return response()->json([
                'success' => true,
                'message' => 'Dispatch assigned successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign dispatch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel dispatch
     */
    public function cancel(Request $request, $id)
    {
        try {
            $request->validate([
                'cancellation_reason' => 'required|string',
            ]);

            $dispatch = PatrolDispatch::findOrFail($id);
            $dispatch->status = 'cancelled';
            $dispatch->cancelled_at = now();
            $dispatch->cancellation_reason = $request->cancellation_reason;
            $dispatch->save();

            return response()->json([
                'success' => true,
                'message' => 'Dispatch cancelled successfully',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel dispatch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get analytics
     */
    public function analytics(Request $request)
    {
        $dateFrom = $request->get('date_from', Carbon::now()->subDays(30));
        $dateTo = $request->get('date_to', Carbon::now());

        $dispatches = PatrolDispatch::whereBetween('dispatched_at', [$dateFrom, $dateTo])->get();

        $analytics = [
            'total_dispatches' => $dispatches->count(),
            'completed' => $dispatches->where('status', 'completed')->count(),
            'three_minute_compliance_rate' => $this->calculateComplianceRate($dispatches),
            'avg_response_time' => $this->calculateAvgResponseTime($dispatches),
            'avg_completion_time' => $this->calculateAvgCompletionTime($dispatches),
            'officer_performance' => $this->getOfficerPerformance($dispatches),
            'hourly_distribution' => $this->getHourlyDistribution($dispatches),
        ];

        return response()->json($analytics);
    }

    /**
     * Get on-duty patrol officers
     */
    public function getOnDutyOfficers()
    {
        // Use raw SQL to join with patrol_locations for better accuracy
        $officers = DB::select("
            SELECT 
                u.id,
                CONCAT(u.firstname, ' ', u.lastname) as name,
                u.push_token,
                ps.station_name,
                pl.latitude,
                pl.longitude,
                pl.updated_at as location_updated_at,
                CASE 
                    WHEN pl.updated_at > NOW() - INTERVAL '10 minutes' THEN true 
                    ELSE false 
                END as has_recent_location
            FROM users_public u
            LEFT JOIN police_stations ps ON u.assigned_station_id = ps.station_id
            LEFT JOIN patrol_locations pl ON u.id = pl.user_id
                        WHERE LOWER(COALESCE(u.user_role::text, u.role::text, '')) = 'patrol_officer'
              AND u.is_on_duty = true
            ORDER BY pl.updated_at DESC NULLS LAST
        ");

        return response()->json(['officers' => $officers]);
    }

    /**
     * Auto dispatch to nearest patrol officer
     */
    public function autoDispatch(Request $request)
    {
        try {
            $request->validate([
                'report_id' => 'required|exists:reports,report_id',
            ]);

            $report = Report::with('location')->findOrFail($request->report_id);

            // Check if report already has an active dispatch
            $existingDispatch = PatrolDispatch::where('report_id', $report->report_id)
                ->active()
                ->first();

            if ($existingDispatch) {
                return response()->json([
                    'success' => false,
                    'message' => 'This report already has an active dispatch'
                ], 400);
            }

            // Get report coordinates
            $reportLat = $report->location->latitude ?? null;
            $reportLng = $report->location->longitude ?? null;

            if (!$reportLat || !$reportLng) {
                return response()->json([
                    'success' => false,
                    'message' => 'Report location coordinates not available'
                ], 400);
            }

                        // Find on-duty patrol officers with recent locations from patrol_locations table
                        // NOTE: Don't require push_token here; we may still want to dispatch/assign.
            $officers = DB::select("
                SELECT 
                    u.id,
                    u.firstname,
                    u.lastname,
                    u.push_token,
                    u.assigned_station_id,
                    pl.latitude,
                    pl.longitude,
                    pl.updated_at as location_updated_at
                FROM users_public u
                JOIN patrol_locations pl ON u.id = pl.user_id
                WHERE LOWER(COALESCE(u.user_role::text, u.role::text, '')) = 'patrol_officer'
                  AND u.is_on_duty = true
                  AND pl.latitude IS NOT NULL
                  AND pl.longitude IS NOT NULL
                  AND pl.updated_at > NOW() - INTERVAL '10 minutes'
                ORDER BY pl.updated_at DESC
            ");

            if (empty($officers)) {
                // Try fallback: find any on-duty officers regardless of location recency
                $officers = DB::select("
                    SELECT 
                        u.id,
                        u.firstname,
                        u.lastname,
                        u.push_token,
                        u.assigned_station_id,
                        pl.latitude,
                        pl.longitude,
                        pl.updated_at as location_updated_at
                    FROM users_public u
                    LEFT JOIN patrol_locations pl ON u.id = pl.user_id
                    WHERE LOWER(COALESCE(u.user_role::text, u.role::text, '')) = 'patrol_officer'
                      AND u.is_on_duty = true
                    ORDER BY pl.updated_at DESC NULLS LAST
                ");
                
                if (empty($officers)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No patrol officers are currently on duty'
                    ], 400);
                }
            }

            // Calculate distance to each officer using Haversine formula
            $nearestOfficer = null;
            $minDistance = PHP_FLOAT_MAX;

            foreach ($officers as $officer) {
                // Skip officers without location
                if (!$officer->latitude || !$officer->longitude) {
                    continue;
                }
                
                $distance = $this->calculateDistance(
                    $reportLat,
                    $reportLng,
                    $officer->latitude,
                    $officer->longitude
                );

                if ($distance < $minDistance) {
                    $minDistance = $distance;
                    $nearestOfficer = $officer;
                }
            }

            // If no officer with location found, just use the first on-duty officer
            if (!$nearestOfficer && !empty($officers)) {
                $nearestOfficer = $officers[0];
                $minDistance = 0; // Unknown distance
            }

            if (!$nearestOfficer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not find a suitable patrol officer'
                ], 400);
            }

            // Derive station_id (patrol_dispatches.station_id is NOT NULL)
            $stationId = $this->resolveDispatchStationId(
                $report->assigned_station_id,
                $nearestOfficer->assigned_station_id ?? null,
                auth()->user()->station_id ?? null,
                $reportLat,
                $reportLng
            );

            if (!$stationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot create dispatch: no police stations exist in the system.'
                ], 400);
            }

            // Create dispatch
            $dispatch = PatrolDispatch::create([
                'report_id' => $report->report_id,
                'station_id' => $stationId,
                'patrol_officer_id' => $nearestOfficer->id,
                'status' => 'pending',
                'dispatched_at' => now(),
                'dispatched_by' => auth()->id(),
                'notes' => $minDistance > 0 
                    ? 'Auto-dispatched to nearest patrol officer (' . round($minDistance, 2) . ' km away)'
                    : 'Auto-dispatched to available patrol officer',
            ]);

            // Send urgent notification with ring and vibrate to ONLY the nearest officer
            $notificationSent = false;
            if (!empty($nearestOfficer->push_token)) {
                $this->sendUrgentDispatchNotification($dispatch, $nearestOfficer, $minDistance);
                $notificationSent = true;
            }

            Log::info('Auto-dispatch created', [
                'dispatch_id' => $dispatch->dispatch_id,
                'report_id' => $report->report_id,
                'officer_id' => $nearestOfficer->id,
                'distance_km' => round($minDistance, 2),
            ]);

            $officerName = ($nearestOfficer->firstname ?? '') . ' ' . ($nearestOfficer->lastname ?? '');

            return response()->json([
                'success' => true,
                'message' => $notificationSent
                    ? 'Patrol dispatched successfully'
                    : 'Dispatch created, but patrol officer has no push token (ask officer to login and allow notifications)',
                'officer_name' => trim($officerName) ?: 'Patrol Officer',
                'distance_km' => round($minDistance, 2),
                'notification_sent' => $notificationSent,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to auto-dispatch: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to dispatch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);

        $latDiff = $lat2 - $lat1;
        $lonDiff = $lon2 - $lon1;

        $a = sin($latDiff / 2) ** 2 + cos($lat1) * cos($lat2) * sin($lonDiff / 2) ** 2;
        $c = 2 * asin(sqrt($a));

        return $earthRadius * $c;
    }

    /**
     * Send urgent dispatch notification with ring and vibrate
     */
    private function sendUrgentDispatchNotification($dispatch, $officer, $distanceKm)
    {
        try {
            if (!$officer->push_token) {
                Log::info('No push token for officer', ['officer_id' => $officer->id]);
                return;
            }

            $report = $dispatch->report;
            $location = $report->location;
            $barangay = $location ? EncryptionService::decrypt($location->barangay) : 'Unknown';
            
            // Prepare Expo push notification with urgent settings
            $message = [
                'to' => $officer->push_token,
                'sound' => [
                    'critical' => true,
                    'name' => 'default',
                    'volume' => 1.0,
                ],
                'title' => '🚨 URGENT: New Dispatch Assigned',
                'body' => "📍 {$report->report_type} reported at {$barangay}. You are {$distanceKm} km away - respond immediately!",
                'data' => [
                    'type' => 'urgent_dispatch',
                    'dispatch_id' => $dispatch->dispatch_id,
                    'report_id' => $report->report_id,
                    'crime_type' => $report->report_type,
                    'location' => $barangay,
                    'urgency' => $report->urgency_score ?? 10,
                    'distance_km' => $distanceKm,
                    'vibrate' => true,
                    'ring' => true,
                ],
                'priority' => 'high',
                'channelId' => 'urgent_dispatch',
                'ttl' => 60, // 60 seconds TTL for urgent notifications
                'expiration' => time() + 60,
                'badge' => 1,
                'mutableContent' => true,
                'categoryId' => 'dispatch_urgent',
            ];

            // Send to Expo Push Notification service
            $response = \Http::post('https://exp.host/--/api/v2/push/send', $message);

            if ($response->successful()) {
                Log::info('Urgent dispatch notification sent', [
                    'dispatch_id' => $dispatch->dispatch_id,
                    'officer_id' => $officer->id,
                    'distance_km' => $distanceKm,
                ]);
            } else {
                Log::error('Failed to send urgent dispatch notification', [
                    'dispatch_id' => $dispatch->dispatch_id,
                    'response' => $response->body(),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error sending urgent dispatch notification: ' . $e->getMessage());
        }
    }

    /**
     * Private helper methods
     */
    private function sendDispatchNotification($dispatch)
    {
        try {
            $officer = $dispatch->patrolOfficer;
            
            if (!$officer || !$officer->push_token) {
                Log::info('No push token for officer', ['officer_id' => $dispatch->patrol_officer_id]);
                return;
            }

            $report = $dispatch->report;
            
            // Prepare Expo push notification
            $message = [
                'to' => $officer->push_token,
                'sound' => 'default',
                'title' => '🚓 New Dispatch',
                'body' => $report->report_type . ' at ' . ($report->location->barangay ?? 'Unknown location'),
                'data' => [
                    'type' => 'dispatch',
                    'dispatch_id' => $dispatch->dispatch_id,
                    'report_id' => $report->report_id,
                    'crime_type' => $report->report_type,
                    'location' => $report->location->barangay ?? 'Unknown',
                    'urgency' => $report->urgency_score ?? 0,
                ],
                'priority' => 'high',
                'channelId' => 'dispatch',
            ];

            // Send to Expo Push Notification service
            $response = \Http::post('https://exp.host/--/api/v2/push/send', $message);

            if ($response->successful()) {
                Log::info('Push notification sent successfully', [
                    'dispatch_id' => $dispatch->dispatch_id,
                    'officer_id' => $officer->id,
                ]);
            } else {
                Log::error('Failed to send push notification', [
                    'dispatch_id' => $dispatch->dispatch_id,
                    'response' => $response->body(),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error sending push notification: ' . $e->getMessage());
        }
    }

    private function getThreeMinuteCompliance()
    {
        $completed = PatrolDispatch::whereNotNull('three_minute_rule_met')->count();
        if ($completed === 0) return 0;

        $met = PatrolDispatch::where('three_minute_rule_met', true)->count();
        return round(($met / $completed) * 100, 1);
    }

    private function getAverageResponseTime()
    {
        $avg = PatrolDispatch::whereNotNull('response_time')->avg('response_time');
        return $avg ? round($avg) : 0;
    }

    private function calculateComplianceRate($dispatches)
    {
        $withRule = $dispatches->whereNotNull('three_minute_rule_met');
        if ($withRule->count() === 0) return 0;

        $met = $withRule->where('three_minute_rule_met', true)->count();
        return round(($met / $withRule->count()) * 100, 1);
    }

    private function calculateAvgResponseTime($dispatches)
    {
        $avg = $dispatches->whereNotNull('response_time')->avg('response_time');
        return $avg ? round($avg) : 0;
    }

    private function calculateAvgCompletionTime($dispatches)
    {
        $avg = $dispatches->whereNotNull('completion_time')->avg('completion_time');
        return $avg ? round($avg) : 0;
    }

    private function getOfficerPerformance($dispatches)
    {
        return $dispatches->groupBy('patrol_officer_id')->map(function ($group) {
            return [
                'officer_id' => $group->first()->patrol_officer_id,
                'officer_name' => $group->first()->patrolOfficer->name ?? 'Unknown',
                'total_dispatches' => $group->count(),
                'completed' => $group->where('status', 'completed')->count(),
                'avg_response_time' => round($group->whereNotNull('response_time')->avg('response_time') ?? 0),
                'three_minute_compliance' => $this->calculateComplianceRate($group),
            ];
        })->values();
    }

    private function getHourlyDistribution($dispatches)
    {
        return $dispatches->groupBy(function ($dispatch) {
            return $dispatch->dispatched_at->format('H');
        })->map(function ($group, $hour) {
            return [
                'hour' => $hour,
                'count' => $group->count(),
            ];
        })->values();
    }

    /**
     * Decrypt sensitive fields in a dispatch's report for display
     * Note: Only description, barangay, and reporters_address are encrypted (not title)
     */
    private function decryptDispatchReport($dispatch)
    {
        if ($dispatch->report) {
            // Only description is encrypted, not title
            $dispatch->report->description = EncryptionService::decrypt($dispatch->report->description);
            if ($dispatch->report->location) {
                $dispatch->report->location->barangay = EncryptionService::decrypt($dispatch->report->location->barangay);
                $dispatch->report->location->reporters_address = EncryptionService::decrypt($dispatch->report->location->reporters_address);
            }
        }
        return $dispatch;
    }
}
