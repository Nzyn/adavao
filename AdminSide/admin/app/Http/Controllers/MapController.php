<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class MapController extends Controller
{
    public function index()
    {
        return view('view-map');
    }
    
    public function getReports(Request $request)
    {
        try {
            // Generate cache key based on filters and user context
            $cacheKey = 'crime_map_data_' . md5(json_encode([
                'user_id' => auth()->id(),
                'role' => auth()->user()?->role,
                'station_id' => auth()->user()?->station_id,
                'filters' => $request->all()
            ]));
            
            // Cache for 5 minutes (file driver compatible)
            $mapData = Cache::remember($cacheKey, 300, function() use ($request) {
                return $this->fetchReportsData($request);
            });
            
            // Add cache headers for browser caching
            $response = response()->json($mapData);
            
            // Override session middleware cache headers
            $response->headers->set('Cache-Control', 'public, max-age=300');
            $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + 300) . ' GMT');
            $response->headers->remove('Pragma');
            
            return $response;
        } catch (\Throwable $e) {
            \Log::error('MapController getReports Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    private function fetchReportsData(Request $request)
    {
        $query = Report::with(['location', 'user', 'policeStation']);
        
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
        
        // Police users see ONLY their station's reports on map
        if ($isPolice) {
            $userStationId = $user->station_id;
            if ($userStationId) {
                $query->where('reports.assigned_station_id', $userStationId);
                \Log::info('Map: Police user viewing station reports', [
                    'user_id' => $user->id,
                    'station_id' => $userStationId
                ]);
            } else {
                $query->whereRaw('1 = 0'); // Return empty result
            }
        }
        // Admin users see ONLY unassigned reports on map
        elseif ($isAdmin) {
            // Admin sees ALL reports on map
            // previously: $query->whereNull('reports.assigned_station_id');
            \Log::info('Map: Admin viewing all reports', [
                'user_id' => $user->id
            ]);
        }
        else {
            // For other users, show no reports
            $query->whereRaw('1 = 0');
        }
        
        // Apply date filters if provided
        if ($request->has('year') && $request->year != '') {
            $query->whereYear('date_reported', $request->year);
        }
        
        if ($request->has('month') && $request->month != '') {
            $query->whereMonth('date_reported', $request->month);
        }
        
        if ($request->has('day') && $request->day != '') {
            $query->whereDay('date_reported', $request->day);
        }
        
        // Apply date range filter if provided
        if ($request->has('date_from') && $request->date_from != '') {
            $query->whereDate('date_reported', '>=', $request->date_from);
        }
        
        if ($request->has('date_to') && $request->date_to != '') {
            $query->whereDate('date_reported', '<=', $request->date_to);
        }
        
        // Apply status filter
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }
        
        // Apply report type filter
        if ($request->has('report_type') && $request->report_type != '') {
            $query->where('report_type', $request->report_type);
        }
        
        // Apply crime type filter
        if ($request->has('crime_type') && $request->crime_type != '') {
            $query->where('report_type', $request->crime_type);
        }
        
        // Apply barangay filter
        if ($request->has('barangay') && $request->barangay != '') {
            $query->whereHas('location', function($q) use ($request) {
                $q->where('barangay', $request->barangay);
            });
        }
        
        $reports = $query->inRandomOrder()->limit(8000)->get();
        
        // Transform data for map display
        $mapData = $reports->map(function ($report) {
            // Add slight random offset to coordinates (±0.0005 degrees ≈ ±50 meters)
            // This prevents exact overlaps while keeping markers in same general area
            $latOffset = (mt_rand(-50, 50) / 100000); // ±0.0005 degrees
            $lngOffset = (mt_rand(-50, 50) / 100000);
            
            // Safe user name access (handle orphaned reports)
            $reporterName = 'Unknown';
            if ($report->user) {
                $reporterName = ($report->user->firstname ?? '') . ' ' . ($report->user->lastname ?? '');
                $reporterName = trim($reporterName) ?: 'Unknown';
            }
            
            return [
                'id' => $report->report_id,
                'title' => $report->report_type,
                'description' => $report->description,
                'crime_type' => $report->report_type, // Using report_type as crime_type
                'latitude' => $report->location->latitude + $latOffset,
                'longitude' => $report->location->longitude + $lngOffset,
                'location_name' => $report->location->barangay,
                'status' => $report->status,
                'date_reported' => $report->date_reported->timezone('Asia/Manila')->format('Y-m-d H:i:s'),
                'reporter' => $reporterName,
                'station_id' => $report->assigned_station_id,
                'station_name' => $report->policeStation ? $report->policeStation->station_name : 'Unassigned',
                'risk_level' => $this->determineRiskLevel($report),
                'is_cluster' => false,
                'count' => 1
            ];
        });
        
        // Return data array (not response) for caching
        return [
            'reports' => $mapData,
            'total_count' => $reports->count(),
            'stats' => $this->getReportStats($reports),
            'barangays' => $this->getBarangays(),
            'crime_types' => $this->getCrimeTypes()
        ];
    }
    
    private function groupOverlappingCrimes($reports)
    {
        $grouped = [];
        $processed = [];
        
        foreach ($reports as $report) {
            if (in_array($report['id'], $processed)) {
                continue;
            }
            
            // Find all reports at the same location (within 0.00001 degrees - approximately 1 meter)
            // Reduced from 0.0001 to show more individual markers
            $sameLocation = collect($reports)->filter(function($r) use ($report, $processed) {
                return !in_array($r['id'], $processed) &&
                       abs($r['latitude'] - $report['latitude']) < 0.00001 &&
                       abs($r['longitude'] - $report['longitude']) < 0.00001;
            })->values()->toArray();
            
            if (count($sameLocation) > 1) {
                // Multiple crimes at same location
                $grouped[] = [
                    'id' => 'cluster_' . $report['id'],
                    'latitude' => $report['latitude'],
                    'longitude' => $report['longitude'],
                    'location_name' => $report['location_name'],
                    'is_cluster' => true,
                    'count' => count($sameLocation),
                    'crimes' => $sameLocation
                ];
                
                foreach ($sameLocation as $r) {
                    $processed[] = $r['id'];
                }
            } else {
                // Single crime at this location
                $report['is_cluster'] = false;
                $report['count'] = 1;
                $grouped[] = $report;
                $processed[] = $report['id'];
            }
        }
        
        return $grouped;
    }
    
    private function getBarangays()
    {
        // Cache barangays list for 1 hour
        return Cache::remember('barangays_list', 3600, function() {
            $barangays = Location::select('barangay')
                ->distinct()
                ->whereNotNull('barangay')
                ->where('barangay', '!=', '')
                ->orderBy('barangay')
                ->pluck('barangay')
                ->filter(function($barangay) {
                    // Filter out coordinates and encrypted data
                    return !preg_match('/^Lat:|^Lng:|^[a-zA-Z0-9+\/]{20,}/', $barangay);
                })
                ->values()
                ->toArray();
                
            return $barangays;
        });
    }
    
    private function getCrimeTypes()
    {
        // Cache crime types for 1 hour
        return Cache::remember('crime_types_list', 3600, function() {
            return Report::select('report_type')
                ->distinct()
                ->whereNotNull('report_type')
                ->where('report_type', '!=', '')
                ->orderBy('report_type')
                ->pluck('report_type')
                ->toArray();
        });
    }
    
    private function determineRiskLevel($report)
    {
        // Define risk levels based on report type or other criteria
        $highRiskTypes = ['emergency', 'violence', 'accident', 'fire'];
        $mediumRiskTypes = ['theft', 'vandalism', 'suspicious'];
        
        if (in_array(strtolower($report->report_type), $highRiskTypes)) {
            return 'high';
        } elseif (in_array(strtolower($report->report_type), $mediumRiskTypes)) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    private function getReportStats($reports)
    {
        $stats = [
            'high' => 0,
            'medium' => 0,
            'low' => 0
        ];
        
        foreach ($reports as $report) {
            $riskLevel = $this->determineRiskLevel($report);
            $stats[$riskLevel]++;
        }
        
        return $stats;
    }

    /**
     * Get CSV crime data for visualization
     */
    public function getCsvCrimeData()
    {
        try {
            // Cache CSV data for 30 minutes
            $csvData = Cache::remember('csv_crime_data', 1800, function() {
                $csvPath = storage_path('app/CrimeDAta.csv');
                
                if (!file_exists($csvPath)) {
                    return null;
                }

                $csvData = [];
                $handle = fopen($csvPath, 'r');
                
                // Read header
                $header = fgetcsv($handle);
                
                // Read data rows
                while (($row = fgetcsv($handle)) !== false) {
                    if (count($header) === count($row)) {
                        $csvRow = array_combine($header, $row);
                        
                        // Filter for Police Role
                        if (auth()->check() && auth()->user()->role === 'police') {
                            $stationId = auth()->user()->station_id;
                            if ($stationId) {
                                // Lazy load allowed barangays if not already cached (could be optimized)
                                $allowedBarangays = Cache::remember("station_{$stationId}_barangays", 3600, function() use ($stationId) {
                                     try {
                                        return DB::table('barangays')
                                            ->where('station_id', $stationId)
                                            ->pluck('barangay_name')
                                            ->map(function($name) { return strtoupper(trim($name)); })
                                            ->toArray();
                                     } catch (\Exception $e) {
                                         return DB::table('barangays')
                                            ->where('station_id', $stationId)
                                            ->pluck('name')
                                            ->map(function($name) { return strtoupper(trim($name)); })
                                            ->toArray();
                                     }
                                });
                                
                                // Check if row's barangay is in allowed list
                                // Assuming CSV has 'barangay' column
                                $rowBarangay = strtoupper(trim($csvRow['barangay'] ?? $csvRow['Barangay'] ?? ''));
                                if (!in_array($rowBarangay, $allowedBarangays)) {
                                    continue; // Skip this row
                                }
                            }
                        }
                        
                        $csvData[] = $csvRow;
                    }
                }
                
                fclose($handle);
                
                return $csvData;
            });
            
            if ($csvData === null) {
                return response()->json([
                    'error' => 'CSV file not found',
                    'data' => []
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $csvData,
                'count' => count($csvData)
            ])
            ->header('Cache-Control', 'public, max-age=1800')
            ->header('Expires', gmdate('D, d M Y H:i:s', time() + 1800) . ' GMT');
            
        } catch (\Exception $e) {
            \Log::error('Error loading CSV crime data', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to load CSV data',
                'message' => $e->getMessage(),
                'data' => []
            ], 500);
        }
    }
    
    /**
     * Clear map-related caches (for admin use)
     */
    public function clearCache()
    {
        // Clear all caches (file driver doesn't support tags)
        Cache::flush();
        
        return response()->json([
            'success' => true,
            'message' => 'Cache cleared successfully'
        ]);
    }
    
    /**
     * Clear all map-related caches including static data
     */
    public function clearAllMapCache()
    {
        Cache::flush();
        
        return response()->json([
            'success' => true,
            'message' => 'All map caches cleared successfully'
        ]);
    }
}
