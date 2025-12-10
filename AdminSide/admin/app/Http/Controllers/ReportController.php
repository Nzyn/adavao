<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportMedia;
use App\Models\Barangay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    /**
     * Assign a report to the correct police station based on its location
     */
    private function assignReportToStation(Report $report)
    {
        try {
            // Robustly handle report_type as array, JSON string, or comma-separated string
            $types = [];
            $rawType = $report->report_type;
            if (is_array($rawType)) {
                $types = $rawType;
            } elseif (is_string($rawType)) {
                $decoded = json_decode($rawType, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $types = $decoded;
                } else if (!empty($rawType)) {
                    // Fallback: treat as comma-separated string
                    $types = array_map('trim', explode(',', $rawType));
                }
            }

            if (empty($types)) {
                \Log::warning('Report assignment failed: report_type is empty or invalid', [
                    'report_id' => $report->report_id,
                    'rawType' => $rawType
                ]);
            }

            // Normalize to lowercase for comparison
            $types = array_map('strtolower', $types);
            $types = array_map('trim', $types);
            
            // Broadly check for 'cybercrime' keyword in any of the types
            $isCybercrime = false;
            foreach ($types as $type) {
                if (str_contains($type, 'cybercrime') || str_contains($type, 'cyber crime')) {
                    $isCybercrime = true;
                    break;
                }
            }
            
            if ($isCybercrime) {
                $cybercrimeStation = \App\Models\PoliceStation::where('station_name', 'Cybercrime Division')->first();
                if ($cybercrimeStation) {
                    $report->assigned_station_id = $cybercrimeStation->station_id;
                    $report->save();
                    \Log::info('Report assigned to Cybercrime Division', [
                        'report_id' => $report->report_id,
                        'station_id' => $cybercrimeStation->station_id,
                        'types' => $types,
                        'rawType' => $rawType
                    ]);
                    // Do NOT overwrite cybercrime assignment with barangay assignment
                    return;
                } else {
                    \Log::error('Cybercrime Division station not found for assignment', [
                        'report_id' => $report->report_id
                    ]);
                }
            } else {
                if (!$report->location_id || !$report->location) {
                    \Log::warning('Cannot assign report: no location', ['report_id' => $report->report_id]);
                    return;
                }

                $location = $report->location;
                // Validate location has coordinates
                if (!$location->latitude || !$location->longitude) {
                    \Log::warning('Cannot assign report: no coordinates', ['location_id' => $location->location_id]);
                    return;
                }

                $stationId = null;
                $assignmentMethod = 'none';

                // PRIORITY 1: Use explicit barangay_id if provided (from frontend address match)
                if ($location->barangay_id) {
                    $barangay = \App\Models\Barangay::find($location->barangay_id);
                    if ($barangay && $barangay->station_id) {
                        $stationId = $barangay->station_id;
                        $assignmentMethod = 'barangay_id';
                        \Log::info('Report assigned using explicit barangay_id', [
                            'report_id' => $report->report_id,
                            'barangay_id' => $location->barangay_id,
                            'barangay_name' => $barangay->barangay_name
                        ]);
                    }
                }

                // PRIORITY 2: If no explicit ID, use point-in-polygon detection
                if (!$stationId) {
                    $stationId = \App\Models\Report::autoAssignPoliceStation(
                        $location->latitude,
                        $location->longitude
                    );
                    if ($stationId) {
                        $assignmentMethod = 'auto_detect';
                    }
                }

                if ($stationId) {
                    $report->assigned_station_id = $stationId;
                    $report->save();
                    
                    $barangayName = 'Unknown';
                    if ($assignmentMethod === 'barangay_id' && isset($barangay)) {
                        $barangayName = $barangay->barangay_name;
                    } elseif ($assignmentMethod === 'auto_detect') {
                        $detectedBarangay = \App\Helpers\GeoHelper::findBarangayByCoordinates(
                            $location->latitude,
                            $location->longitude
                        );
                        $barangayName = $detectedBarangay ? $detectedBarangay->barangay_name : 'Nearest match';
                    }

                    \Log::info("Report assigned to station ($assignmentMethod)", [
                        'report_id' => $report->report_id,
                        'station_id' => $stationId,
                        'barangay' => $barangayName,
                        'latitude' => $location->latitude,
                        'longitude' => $location->longitude,
                    ]);
                } else {
                    \Log::warning('No barangay found for coordinates', [
                        'report_id' => $report->report_id,
                        'latitude' => $location->latitude,
                        'longitude' => $location->longitude
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Error assigning report to station: ' . $e->getMessage(), [
                'report_id' => $report->report_id
            ]);
        }
    }

    /**
     * Display a listing of the reports
     */
    public function index(Request $request)
    {
        $query = Report::with(['user.verification', 'location', 'media', 'policeStation'])
            ->join('locations', 'reports.location_id', '=', 'locations.location_id');
        
        // Exclude reports without valid coordinates
        $query->whereNotNull('locations.latitude')
              ->whereNotNull('locations.longitude')
              ->where('locations.latitude', '!=', 0)
              ->where('locations.longitude', '!=', 0);
        
        // Filter by status if provided
        if ($request->has('status') && in_array($request->status, ['pending', 'investigating', 'resolved'])) {
            $query->where('reports.status', $request->status);
        }

        // ROLE CHECK: Police role takes precedence over admin
        $user = auth()->user();
        $isAdmin = false;
        $isPolice = false;
        
        if ($user) {
            // Check if hasRole method exists (for UserAdmin with RBAC)
            if (method_exists($user, 'hasRole')) {
                // Check police FIRST (takes precedence)
                $isPolice = $user->hasRole('police');
                // Only check admin if not police
                if (!$isPolice) {
                    $isAdmin = $user->hasRole('admin') || $user->hasRole('super_admin');
                }
            }
            // Fallback to role property if it exists
            elseif (isset($user->role)) {
                $isPolice = $user->role === 'police';
                if (!$isPolice) {
                    $isAdmin = in_array($user->role, ['admin', 'super_admin']);
                }
            }
        }
        
        // Police users see ONLY their station's reports
        if ($isPolice) {
            $userStationId = $user->station_id;
            if ($userStationId) {
                // For police officers: show ONLY reports assigned to their station
                $query->where('reports.assigned_station_id', $userStationId);
                \Log::info('Police user filtering reports', [
                    'user_id' => $user->id,
                    'station_id' => $userStationId
                ]);
            } else {
                // Police user without station assignment - show no reports
                \Log::warning('Police user has no station assignment', [
                    'user_id' => $user->id
                ]);
                $query->whereRaw('1 = 0'); // Return empty result
            }
        }
        // Admin users
        elseif ($isAdmin) {
            $userStationId = $user->station_id;
            
            if ($userStationId) {
                // If admin has a specific station, show only that station (like a police officer)
                $query->where('reports.assigned_station_id', $userStationId);
                \Log::info('Admin (Station specific) viewing reports', [
                    'user_id' => $user->id,
                    'station_id' => $userStationId
                ]);
            } else {
                // If admin has NO station (NULL), show only UNASSIGNED reports
                // As requested: "means that all unassigned station will be viewed by this admin"
                $query->whereNull('reports.assigned_station_id');
                
                \Log::info('Admin (Unassigned/Super) viewing UNASSIGNED reports only', [
                    'user_id' => $user->id
                ]);
            }
        }
        else {
            // For other users, show no reports
            $query->whereRaw('1 = 0');
        }
        
        $reports = $query->select('reports.*')
                         ->orderBy('reports.created_at', 'desc')
                         ->paginate(10);
        
        \Log::info('Reports query result', [
            'total' => $reports->total(),
            'count' => $reports->count(),
            'is_admin' => $isAdmin,
            'is_police' => $isPolice,
            'user_email' => auth()->user() ? auth()->user()->email : 'not logged in'
        ]);
        
        // Decrypt sensitive fields for admin and police roles
        // Decrypt sensitive fields for admin and police roles
        $userRole = null;
        if (auth()->check()) {
            $authUser = auth()->user();
            if (method_exists($authUser, 'hasRole')) {
                if ($authUser->hasRole('super_admin')) $userRole = 'super_admin';
                elseif ($authUser->hasRole('admin')) $userRole = 'admin';
                elseif ($authUser->hasRole('police')) $userRole = 'police';
                else $userRole = $authUser->role;
            } else {
                $userRole = $authUser->role;
            }
        }
        if (\App\Services\EncryptionService::canDecrypt($userRole)) {
            foreach ($reports as $report) {
                // Decrypt report fields
                $fieldsToDecrypt = ['title', 'description'];
                $report = \App\Services\EncryptionService::decryptModelFields($report, $fieldsToDecrypt);
                
                // Decrypt location data if it exists
                if ($report->location) {
                    $locationFieldsToDecrypt = ['barangay', 'reporters_address'];
                    $report->location = \App\Services\EncryptionService::decryptModelFields($report->location, $locationFieldsToDecrypt);
                }
            }
        }
        
        // Legacy CSV Display Removed
        $csvReports = [];
        
        if ($request->wantsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => true,
                'data' => $reports
            ]);
        }

        return view('reports', compact('reports', 'csvReports'));
    }

    /**
     * Update the status of a report
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'status' => 'required|in:pending,investigating,resolved'
            ]);

            $report = Report::findOrFail($id);
            $report->status = $request->status;
            $report->save();

            return response()->json(['success' => true, 'message' => 'Status updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update the validity status of a report (VALID, INVALID, or CHECKING)
     */
    public function updateValidity(Request $request, $id)
    {
        try {
            $request->validate([
                'is_valid' => 'required|in:valid,invalid,checking_for_report_validity'
            ]);

            $report = Report::findOrFail($id);
            $report->is_valid = $request->is_valid;
            $report->save();

            return response()->json(['success' => true, 'message' => 'Report validity status updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update validity status: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Store a new report with automatic station assignment
     */
    public function store(Request $request)
    {
        try {
            // Handle both crime_types (JSON array from frontend) and location creation if needed
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string',
                'description' => 'required|string',
                'crime_types' => 'required|json',  // Accept JSON array of crime types
                'incident_date' => 'required|string',
                'latitude' => 'required|numeric',
                'longitude' => 'required|numeric',
                'reporters_address' => 'nullable|string',
                'barangay' => 'nullable|string',
                'barangay_id' => 'nullable|integer',
                'is_anonymous' => 'boolean',
                'media' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,webm|max:25600', // 25MB
            ]);

            // Create or get the location record
            $location = \App\Models\Location::create([
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'address' => $request->reporters_address ?? '',
                'barangay_id' => $request->barangay_id,
            ]);

            // Encrypt sensitive fields before saving
            $reportData = [
                'user_id' => $request->user_id,
                'title' => \App\Services\EncryptionService::encrypt($request->title),
                'description' => \App\Services\EncryptionService::encrypt($request->description),
                'report_type' => $request->crime_types,  // Store the JSON array directly
                'location_id' => $location->location_id,
                'is_anonymous' => $request->boolean('is_anonymous', false),
                'date_reported' => $request->incident_date,
            ];

            $report = Report::create($reportData);

            // Handle media upload if present (supports multiple files)
            if ($request->hasFile('media')) {
                $files = $request->file('media');
                // Handle both single and multiple files
                if (!is_array($files)) {
                    $files = [$files];
                }
                
                foreach ($files as $file) {
                    $path = $file->store('reports', 'public');
                    
                    // Determine media type extension from file
                    $extension = strtolower($file->getClientOriginalExtension());
                    
                    ReportMedia::create([
                        'report_id' => $report->report_id,
                        'media_url' => $path,
                        'media_type' => $extension,
                    ]);
                }
            }

            // Automatically assign to the correct police station based on location
            $this->assignReportToStation($report);

            // Aggressive failsafe: Always force assignment for cybercrime reports
            $types = [];
            $rawType = $report->report_type;
            \Log::info('Aggressive assignment check', ['report_id' => $report->report_id, 'rawType' => $rawType]);
            if (is_array($rawType)) {
                $types = $rawType;
            } elseif (is_string($rawType)) {
                $decoded = json_decode($rawType, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $types = $decoded;
                } else if (!empty($rawType)) {
                    $types = array_map('trim', explode(',', $rawType));
                }
            }
            $types = array_map('strtolower', $types);
            $isCybercrimeAggressive = false;
            foreach ($types as $type) {
                if (str_contains($type, 'cybercrime') || str_contains($type, 'cyber crime')) {
                    $isCybercrimeAggressive = true;
                    break;
                }
            }
            \Log::info('Aggressive assignment types', ['report_id' => $report->report_id, 'types' => $types, 'is_cyber' => $isCybercrimeAggressive]);
            if ($isCybercrimeAggressive) {
                $cybercrimeStation = \App\Models\PoliceStation::where('station_name', 'Cybercrime Division')->first();
                if ($cybercrimeStation) {
                    $report->assigned_station_id = $cybercrimeStation->station_id;
                    $report->save();
                    \Log::info('Aggressive: Forced assignment to Cybercrime Division', [
                        'report_id' => $report->report_id,
                        'station_id' => $cybercrimeStation->station_id,
                        'types' => $types,
                        'rawType' => $rawType
                    ]);
                } else {
                    \Log::error('Aggressive: Cybercrime Division station not found', ['report_id' => $report->report_id]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Report created and assigned to the appropriate police station',
                'data' => $report->load(['user', 'location']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating report: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the proper URL for a media file
     * Handles both storage disk paths and ensures proper accessibility
     */
    private function getMediaUrl($mediaUrl)
    {
        if (!$mediaUrl) {
            return null;
        }

        // If already a full URL (starts with http), use as is
        if (strpos($mediaUrl, 'http') === 0) {
            return $mediaUrl;
        }

        // Clean up the path - remove leading slashes
        $cleanPath = ltrim($mediaUrl, '/');
        $fileName = basename($cleanPath);
        
        // IMPORTANT: Files are stored in UserSide/evidence by the Node.js backend
        // Check if file exists in the React Native evidence folder
        $userSideEvidencePath = dirname(dirname(dirname(__DIR__))) . '/../../UserSide/evidence/' . $fileName;
        
        if (file_exists($userSideEvidencePath)) {
            // Serve from Node.js backend URL
            // Assuming Node.js backend runs on port 3000
            $nodeBackendUrl = config('app.node_backend_url', 'http://localhost:3000');
            $url = $nodeBackendUrl . '/evidence/' . $fileName;
            
            \Log::debug('Media file found in UserSide', [
                'original' => $mediaUrl,
                'found_at' => $userSideEvidencePath,
                'url' => $url
            ]);
            
            return $url;
        }
        
        // Check various possible paths in storage/app/public (fallback)
        $possiblePaths = [
            $cleanPath,                              // Try original path
            'evidence/' . $fileName,                  // Try in evidence folder
            'reports/' . $fileName,                   // Try in reports folder
            'uploads/images/' . $fileName,            // Try in uploads/images
            'uploads/videos/' . $fileName,            // Try in uploads/videos
        ];
        
        foreach ($possiblePaths as $path) {
            if (Storage::disk('public')->exists($path)) {
                // Construct URL manually
                $url = url('/storage/' . $path);
                \Log::debug('Media file found in storage', [
                    'original' => $mediaUrl,
                    'found_at' => $path,
                    'url' => $url
                ]);
                return $url;
            }
        }
        
        // Log missing file for debugging
        \Log::warning('Media file not found in any location', [
            'original_path' => $mediaUrl,
            'checked_paths' => array_merge([$userSideEvidencePath], $possiblePaths),
            'storage_path' => storage_path('app/public')
        ]);

        // Fallback: construct the URL from Node.js backend
        $nodeBackendUrl = config('app.node_backend_url', 'http://localhost:3000');
        return $nodeBackendUrl . '/evidence/' . $fileName;
    }

    /**
     * Get report details for modal display
     * Now with properly formatted media URLs
     */
    public function getDetails($id)
    {
        try {
            $report = Report::with(['user.verification', 'location', 'media', 'policeStation'])->findOrFail($id);

            // Get authenticated user and role
            $authUser = auth()->user();
            $userRole = null;
            
            if ($authUser) {
                // Determine role robustly
                if (method_exists($authUser, 'hasRole')) {
                    if ($authUser->hasRole('super_admin')) $userRole = 'super_admin';
                    elseif ($authUser->hasRole('admin')) $userRole = 'admin';
                    elseif ($authUser->hasRole('police')) $userRole = 'police';
                    else $userRole = $authUser->role; // Fallback
                } else {
                    $userRole = $authUser->role;
                }
            }
            
            // Log for debugging
            \Log::info('Report details accessed', [
                'report_id' => $id,
                'auth_check' => auth()->check(),
                'user_id' => $authUser ? $authUser->id : null,
                'user_role' => $userRole,
                'can_decrypt' => \App\Services\EncryptionService::canDecrypt($userRole)
            ]);

            // Only police and admin can decrypt sensitive fields
            if (\App\Services\EncryptionService::canDecrypt($userRole)) {
                \Log::info('Decrypting report fields for authorized user', [
                    'report_id' => $id,
                    'user_role' => $userRole
                ]);
                
                // Decrypt sensitive fields in the report
                $fieldsToDecrypt = ['title', 'description'];
                $report = \App\Services\EncryptionService::decryptModelFields($report, $fieldsToDecrypt);
                
                // Decrypt location data if it exists
                if ($report->location) {
                    $locationFieldsToDecrypt = ['barangay', 'reporters_address'];
                    $report->location = \App\Services\EncryptionService::decryptModelFields($report->location, $locationFieldsToDecrypt);
                }
            } else {
                \Log::warning('User not authorized to decrypt report fields', [
                    'report_id' => $id,
                    'user_role' => $userRole
                ]);
            }

            // Transform media URLs to ensure they're properly accessible
            if ($report->media && count($report->media) > 0) {
                foreach ($report->media as $media) {
                    $media->display_url = $this->getMediaUrl($media->media_url);
                    // Log media information for debugging
                    \Log::debug('Media file info', [
                        'media_id' => $media->media_id,
                        'original_url' => $media->media_url,
                        'display_url' => $media->display_url,
                        'exists' => Storage::disk('public')->exists($media->media_url)
                    ]);
                }
            }

            // Parse report_type from JSON string to array for frontend display
            if ($report->report_type && is_string($report->report_type)) {
                $decoded = json_decode($report->report_type, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $report->report_type = $decoded;
                }
            }

            // Get all police stations for map display
            $policeStations = \App\Models\PoliceStation::select('station_id', 'station_name', 'latitude', 'longitude', 'address')
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->get();

            return response()->json([
                'success' => true, 
                'data' => $report,
                'policeStations' => $policeStations
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading report details', [
                'report_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => 'Failed to load report details: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Assign a report to a police station (Admin only)
     */
    public function assignToStation(Request $request, $id)
    {
        try {
            $request->validate([
                'station_id' => 'nullable|exists:police_stations,station_id',
            ]);

            $report = Report::findOrFail($id);
            $report->assigned_station_id = $request->station_id;
            $report->save();

            \Log::info('Report manually assigned to station', [
                'report_id' => $id,
                'station_id' => $request->station_id,
                'assigned_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report successfully assigned to station'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error assigning report to station', [
                'report_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign report: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Request reassignment of a report (Police only)
     */
    public function requestReassignment(Request $request, $id)
    {
        try {
            $request->validate([
                'station_id' => 'nullable|exists:police_stations,station_id',
                'reason' => 'nullable|string|max:500',
            ]);

            $report = Report::findOrFail($id);
            
            // Create reassignment request
            $reassignmentRequest = \App\Models\ReportReassignmentRequest::create([
                'report_id' => $id,
                'requested_by_user_id' => auth()->id(),
                'current_station_id' => $report->assigned_station_id,
                'requested_station_id' => $request->station_id,
                'reason' => $request->reason,
                'status' => 'pending',
            ]);

            \Log::info('Report reassignment requested', [
                'request_id' => $reassignmentRequest->request_id,
                'report_id' => $id,
                'requested_by' => auth()->id(),
                'requested_station_id' => $request->station_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reassignment request submitted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error requesting report reassignment', [
                'report_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all reassignment requests (Admin only)
     */
    public function getReassignmentRequests()
    {
        try {
            $query = \App\Models\ReportReassignmentRequest::with([
                'report',
                'requestedBy',
                'currentStation',
                'requestedStation',
                'reviewedBy'
            ]);

            // If user is police, show only their requests or requests from their station
            if (auth()->user()->role === 'police') {
                $user = auth()->user();
                $query->where(function($q) use ($user) {
                    $q->where('requested_by_user_id', $user->id);
                    // Optionally include requests from their station if they have a station_id
                    if ($user->station_id) {
                        $q->orWhere('current_station_id', $user->station_id);
                    }
                });
            }

            $requests = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $requests
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching reassignment requests', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve or reject a reassignment request (Admin only)
     */
    public function reviewReassignmentRequest(Request $request, $requestId)
    {
        try {
            $request->validate([
                'action' => 'required|in:approve,reject',
            ]);

            $reassignmentRequest = \App\Models\ReportReassignmentRequest::findOrFail($requestId);
            
            if ($reassignmentRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been reviewed'
                ], 400);
            }

            $reassignmentRequest->status = $request->action === 'approve' ? 'approved' : 'rejected';
            $reassignmentRequest->reviewed_by_user_id = auth()->id();
            $reassignmentRequest->reviewed_at = now();
            $reassignmentRequest->save();

            // If approved, update the report's assigned station
            if ($request->action === 'approve') {
                $report = Report::find($reassignmentRequest->report_id);
                if ($report) {
                    $report->assigned_station_id = $reassignmentRequest->requested_station_id;
                    $report->save();
                }
            }

            \Log::info('Reassignment request reviewed', [
                'request_id' => $requestId,
                'action' => $request->action,
                'reviewed_by' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Request ' . ($request->action === 'approve' ? 'approved' : 'rejected') . ' successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error reviewing reassignment request', [
                'request_id' => $requestId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to review request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get report counts for notification polling
     */
    public function getReportCounts()
    {
        try {
            $totalReports = Report::count();
            $unassignedReports = Report::whereNull('assigned_station_id')->count();
            $pendingReports = Report::where('status', 'pending')->count();

            return response()->json([
                'success' => true,
                'total' => $totalReports,
                'unassigned' => $unassignedReports,
                'pending' => $pendingReports
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching report counts', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch report counts'
            ], 500);
        }
    }
}
