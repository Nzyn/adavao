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
        \Log::info('MapController: Fetching reports with filters', $request->all());
        
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
        
        // Log the final query for debugging
        \Log::info('Map Query SQL', [
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);
        
        $reports = $query->inRandomOrder()->limit(8000)->get();
        
        \Log::info('Map Query Result Count: ' . $reports->count());
        
        // Transform data for map display
        $mapData = $reports->map(function ($report) {
            // Validate essential data
            if (!$report->location || !$report->date_reported) {
                return null;
            }
            
            // Filter out coordinates that are in water (Davao Gulf)
            if ($this->isInWater($report->location->latitude, $report->location->longitude)) {
                return null;
            }

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
            
            try {
                $dateFormatted = $report->date_reported->timezone('Asia/Manila')->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                // Fallback if date is invalid but not null
                $dateFormatted = date('Y-m-d H:i:s');
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
                'date_reported' => $dateFormatted,
                'reporter' => $reporterName,
                'station_id' => $report->assigned_station_id,
                'station_name' => $report->policeStation ? $report->policeStation->station_name : 'Unassigned',
                'risk_level' => $this->determineRiskLevel($report),
                'is_cluster' => false,
                'count' => 1
            ];
        })->filter(); // Remove nulls from skipped reports
        
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
                ->whereNotNull('barangay')
                // ->where('barangay', '!=', '') // Removed due to JSON type incompatibility
                ->orderBy('barangay')
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
            $types = Report::query()
                ->selectRaw('DISTINCT CAST(report_type AS TEXT) as report_type')
                ->whereNotNull('report_type')
                ->pluck('report_type')
                ->toArray();
            
            // Clean up JSON quotes if present (e.g. "Theft" -> Theft)
            $types = array_map(function($type) {
                return trim($type, '"');
            }, $types);
            
            // Sort in PHP
            sort($types);
            return $types;
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
            // Cache CSV data for 30 minutes (limited to 500 records)
            $csvData = Cache::remember('csv_crime_data_v6', 1800, function() {
                $csvPath = storage_path('app/davao_crime_5years.csv');
                
                if (!file_exists($csvPath)) {
                    return null;
                }

                $csvData = [];
                // Load coordinates map
                $coordinatesMap = $this->getBarangayCoordinates();
                
                $handle = fopen($csvPath, 'r');
                
                // Read header
                // Read header
                $header = fgetcsv($handle);
                
                // Clean headers (remove BOM, spaces)
                if ($header) {
                     $header = array_map(function($h) {
                         return trim(str_replace("\xEF\xBB\xBF", '', $h));
                     }, $header);
                }
                
                $headerMap = array_flip($header);
                \Log::info('CSV Header Map:', $headerMap);
                
                // Determine indices
                $idxDate = $headerMap['date'] ?? 0;
                $idxBarangay = $headerMap['barangay'] ?? 1;
                $idxType = $headerMap['crime_type'] ?? 2;
                $idxCount = $headerMap['crime_count'] ?? 3;
                // Add indices for coordinates
                $idxLat = $headerMap['latitude'] ?? 5;
                $idxLng = $headerMap['longitude'] ?? 6;
                
                \Log::info("CSV Indices: Date=$idxDate, Brgy=$idxBarangay, Type=$idxType, Lat=$idxLat, Lng=$idxLng");
                
                // Read data rows
                while (($row = fgetcsv($handle)) !== false) {
                    if (count($row) > max($idxDate, $idxBarangay, $idxType)) {
                        $barangayName = strtoupper(trim($row[$idxBarangay]));
                        
                        // Construct standardized row
                        $csvRow = [
                            'date' => $row[$idxDate],
                            'barangay' => $barangayName,
                            'crime_type' => trim($row[$idxType]),
                            'crime_count' => isset($row[$idxCount]) ? $row[$idxCount] : 1
                        ];
                        
                        // 1. Try to get coordinates directly from CSV
                        if (isset($row[$idxLat]) && isset($row[$idxLng]) && is_numeric($row[$idxLat]) && is_numeric($row[$idxLng])) {
                            $csvRow['lat'] = (float)$row[$idxLat];
                            $csvRow['lng'] = (float)$row[$idxLng];
                        } 
                        // 2. Fallback to lookup
                        else {
                            $coords = $this->findBarangayCoordinates($barangayName, $coordinatesMap);
                            if ($coords) {
                                $csvRow['lat'] = $coords[0] + (mt_rand(-50, 50) / 100000); // Add jitter
                                $csvRow['lng'] = $coords[1] + (mt_rand(-50, 50) / 100000);
                            }
                        }
                        
                        // 3. Skip if NO coordinates found at all (to prevent "Invalid LatLng" error)
                        if (!isset($csvRow['lat']) || !isset($csvRow['lng'])) {
                             continue;
                        }
                        
                        // Filter for Police Role
                        if (auth()->check() && auth()->user()->role === 'police') {
                            $stationId = auth()->user()->station_id;
                            if ($stationId) {
                                // Lazy load allowed barangays if not already cached
                                $allowedBarangays = Cache::remember("station_{$stationId}_barangays", 3600, function() use ($stationId) {
                                     try {
                                        return DB::table('barangays')
                                            ->where('station_id', $stationId)
                                            ->pluck('barangay_name')
                                            ->map(function($name) { return strtoupper(trim($name)); })
                                            ->toArray();
                                     } catch (\Exception $e) {
                                         return [];
                                     }
                                });
                                
                                if (!in_array($csvRow['barangay'], $allowedBarangays)) {
                                    continue; // Skip this row
                                }
                            }
                        }
                        
                        // Filter out coordinates that are in water (Davao Gulf)
                        if ($this->isInWater($csvRow['lat'], $csvRow['lng'])) {
                            continue; // Skip water coordinates
                        }
                        
                        $csvData[] = $csvRow;
                    }
                }
                
                fclose($handle);
                
                // Limit to 500 records for performance
                if (count($csvData) > 500) {
                    $csvData = array_slice($csvData, 0, 500);
                }
                
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
    /**
     * Get barangay coordinates from cached JSON file
     */
    private function getBarangayCoordinates()
    {
        $cacheFile = storage_path('app/barangay_coordinates.json');
        
        if (file_exists($cacheFile)) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if (!empty($cached['barangays'])) {
                $coords = [];
                
                foreach ($cached['barangays'] as $brgy) {
                    $simpleName = trim($brgy['name']);
                    $lat = $brgy['latitude'];
                    $lng = $brgy['longitude'];
                    
                    // Normalize the name for better matching
                    $normalizedName = $this->normalizeBarangayName($simpleName);
                    
                    // Add entry for multiple name variations
                    $coords[$simpleName] = [$lat, $lng];
                    $coords[strtoupper($simpleName)] = [$lat, $lng];
                    $coords[$normalizedName] = [$lat, $lng];
                    
                    // Add common suffixes
                    $coords[$simpleName . ' (POB.)'] = [$lat, $lng];
                    $coords[$simpleName . ' PROPER'] = [$lat, $lng];
                    
                    // Handle special barangay name patterns
                    if (preg_match('/^(\d+)-([A-Z])/', $simpleName, $matches)) {
                        // Handle numbered barangays like "19-B", "76-A BUCANA"
                        $coords["BARANGAY $simpleName"] = [$lat, $lng];
                    }
                    
                    // Remove parenthetical info for matching
                    if (preg_match('/^([^(]+)/', $simpleName, $matches)) {
                        $baseName = trim($matches[1]);
                        $coords[$baseName] = [$lat, $lng];
                    }
                }
                
                return $coords;
            }
        }
        
        return [];
    }
    
    /**
     * Find coordinates for a barangay with fuzzy matching
     */
    private function findBarangayCoordinates($barangayName, $coordinatesMap)
    {
        // Try exact match first
        if (isset($coordinatesMap[$barangayName])) {
            return $coordinatesMap[$barangayName];
        }
        
        // Try uppercase
        $upperName = strtoupper($barangayName);
        if (isset($coordinatesMap[$upperName])) {
            return $coordinatesMap[$upperName];
        }
        
        // Try normalized name
        $normalizedName = $this->normalizeBarangayName($barangayName);
        if (isset($coordinatesMap[$normalizedName])) {
            return $coordinatesMap[$normalizedName];
        }
        
        // Try fuzzy matching - find best match
        $bestMatch = null;
        $bestScore = 0;
        
        foreach ($coordinatesMap as $coordName => $coords) {
            $normalizedCoordName = $this->normalizeBarangayName($coordName);
            
            // Calculate similarity
            $similarity = 0;
            similar_text($normalizedName, $normalizedCoordName, $similarity);
            
            if ($similarity > $bestScore && $similarity > 80) { // 80% similarity threshold
                $bestScore = $similarity;
                $bestMatch = $coords;
            }
        }
        
        return $bestMatch;
    }
    
    /**
     * Normalize barangay name for better matching
     */
    private function normalizeBarangayName($name)
    {
        $name = strtoupper(trim($name));
        
        // Remove common suffixes and patterns
        $name = preg_replace('/\s*\(POB\.\)\s*/i', '', $name);
        $name = preg_replace('/\s*\(BRGY.*?\)\s*/i', '', $name);
        $name = preg_replace('/\s*PROPER\s*/i', '', $name);
        
        // Normalize numbered barangays
        $name = preg_replace('/^BARANGAY\s+/', '', $name);
        
        return trim($name);
    }
    
    /**
     * Check if coordinates are in water (Davao Gulf or other water bodies)
     * Uses simplified polygon/bounds check for Davao City area
     */
    private function isInWater($lat, $lng)
    {
        // Early exit if coordinates are clearly on land (west/inland side of Davao)
        if ($lng < 125.45) {
            return false; // Definitely on land (western Davao)
        }
        
        // Simplified water boundaries for Davao Gulf
        // The gulf is generally east of longitude 125.55-125.65 depending on latitude
        
        // Main Davao Gulf area (simplified polygon check)
        // If longitude is very far east AND within typical water areas
        if ($lng > 125.65) {
            return true; // Far east - definitely water
        }
        
        // Coastal zone check - varies by latitude
        // Northern Davao coast (around Samal Island area)
        if ($lat >= 7.05 && $lat <= 7.35 && $lng > 125.55) {
            // This is the Samal Island / Pakiputan Strait area
            // Allow specific ranges for Samal
            if ($lat >= 7.10 && $lat <= 7.15 && $lng >= 125.60 && $lng <= 125.70) {
                return false; // Samal Island
            }
            if ($lng > 125.62) {
                return true; // Water east of coast
            }
        }
        
        // Central Davao coast (main city coastline)
        if ($lat >= 6.95 && $lat < 7.05 && $lng > 125.58) {
            return true; // Water off main city coast
        }
        
        // Southern coast (Toril/Daliao area)  
        if ($lat >= 6.85 && $lat < 6.95 && $lng > 125.55) {
            return true; // Water off southern coast
        }
        
        // Very southern area (towards Sta. Cruz)
        if ($lat < 6.85 && $lng > 125.52) {
            return true; // Water
        }
        
        // Additional water check - if outside typical city bounds
        if ($lat < 6.80 || $lat > 7.50) {
            return true; // Way outside city - likely water or invalid
        }
        
        return false; // Default: on land
    }
}
