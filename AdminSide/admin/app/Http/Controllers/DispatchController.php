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

class DispatchController extends Controller
{
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

        // Get statistics
        $stats = [
            'total' => PatrolDispatch::count(),
            'active' => PatrolDispatch::active()->count(),
            'completed' => PatrolDispatch::completed()->count(),
            'three_minute_compliance' => $this->getThreeMinuteCompliance(),
            'avg_response_time' => $this->getAverageResponseTime(),
        ];

        // Get available officers
        $officers = User::where('user_role', 'patrol_officer')
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

            $report = Report::findOrFail($request->report_id);

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
                'station_id' => $report->assigned_station_id,
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

            return response()->json([
                'success' => true,
                'message' => 'Dispatch created successfully',
                'dispatch' => $dispatch->load(['report', 'patrolOfficer']),
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

            return response()->json([
                'success' => true,
                'message' => 'Dispatch status updated successfully',
                'dispatch' => $dispatch->fresh()->load(['report', 'patrolOfficer']),
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
        $officers = User::where('user_role', 'patrol_officer')
            ->where('is_on_duty', true)
            ->with('station:station_id,station_name')
            ->get()
            ->map(function($officer) {
                return [
                    'id' => $officer->id,
                    'name' => $officer->name,
                    'station_name' => $officer->station->station_name ?? null,
                ];
            });

        return response()->json(['officers' => $officers]);
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
}
