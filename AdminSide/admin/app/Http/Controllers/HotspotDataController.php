<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HotspotDataController extends Controller
{
    /**
     * Get comprehensive hotspot data with yearly crime rates
     * GET /api/hotspot-data
     * 
     * Returns all barangays with:
     * - Yearly crime statistics (2020-2024)
     * - Population data
     * - Crime rates per 1,000 people
     * - Coordinates for mapping
     * - Risk levels (High > 8, Medium 4-7, Low < 4)
     */
    public function getHotspotData(Request $request)
    {
        try {
            \Log::info('getHotspotData called');
            
            // Get current year or use latest available
            $currentYear = intval($request->input('year', date('Y')));
            
            // Load the hardcoded barangay data from CSV
            $barangayData = $this->loadBarangayDataFromCSV();
            
            \Log::info('Loaded ' . count($barangayData) . ' barangays from CSV');
            
            if (empty($barangayData)) {
                \Log::warning('No barangay data loaded from CSV');
                return response()->json([
                    'barangays' => [],
                    'total_barangays' => 0,
                    'highest_crime_rate' => 0,
                    'message' => 'No barangay data available'
                ]);
            }

            // Filter for Police Role: Only show assigned barangays
            if (auth()->check() && auth()->user()->role === 'police') {
                $stationId = auth()->user()->station_id;
                if ($stationId) {
                    \Log::info("Filtering hotspot data for police station: $stationId");
                    
                    // Get allowed barangays for this station
                    // Try 'barangay_name' first, fallback to 'name' or 'barangay'
                    $allowedBarangays = [];
                    try {
                        $allowedBarangays = DB::table('barangays')
                            ->where('station_id', $stationId)
                            ->pluck('barangay_name')
                            ->map(function($name) { return strtoupper(trim($name)); })
                            ->toArray();
                    } catch (\Exception $e) {
                        try {
                            $allowedBarangays = DB::table('barangays')
                                ->where('station_id', $stationId)
                                ->pluck('name') // fallback
                                ->map(function($name) { return strtoupper(trim($name)); })
                                ->toArray();
                        } catch (\Exception $e2) {
                            \Log::error("Failed to fetch allowed barangays for filtering: " . $e2->getMessage());
                        }
                    }

                    if (!empty($allowedBarangays)) {
                        $barangayData = array_filter($barangayData, function($item) use ($allowedBarangays) {
                            return in_array(strtoupper(trim($item['name'])), $allowedBarangays);
                        });
                        // Re-index array
                        $barangayData = array_values($barangayData);
                        \Log::info("Filtered to " . count($barangayData) . " barangays for station $stationId");
                    } else {
                        \Log::warning("No allowed barangays found for station $stationId, showing empty result");
                        $barangayData = [];
                    }
                }
            }
            
            // Get all barangay locations with coordinates
            $barangayCoordinates = $this->getBarangayCoordinates();
            
            // Process each barangay
             $hotspotData = [];
             $matchedCount = 0;
             $unmatchedCount = 0;
             
             foreach ($barangayData as $barangay) {
                 $name = trim($barangay['name'] ?? 'Unknown');
                 $totalCrimes = intval($barangay['total_crimes'] ?? 0);
                 $population = intval($barangay['population'] ?? 50000);
                 
                 // Prevent division by zero
                 if ($population <= 0) {
                     $population = 50000;
                 }
                 
                 // Crime Rate Formula: (Total Incidents / Population) × 1000
                 $crimeRate = ($totalCrimes / $population) * 1000;
                
                // Get coordinates with fuzzy matching
                $coordinates = $this->findBarangayCoordinates($name, $barangayCoordinates);
                
                if ($coordinates) {
                    $lat = $coordinates[0];
                    $lng = $coordinates[1];
                    $matchedCount++;
                } else {
                    // Use Davao City center as fallback
                    $lat = 7.1907;
                    $lng = 125.4553;
                    $unmatchedCount++;
                    \Log::debug("No coordinates found for barangay: $name");
                }
                
                // Determine risk level
                $riskLevel = 'low';
                if ($crimeRate > 8) {
                    $riskLevel = 'high';
                } elseif ($crimeRate >= 4) {
                    $riskLevel = 'medium';
                }
                
                $hotspotData[] = [
                    'name' => $name,
                    'incidents' => $totalCrimes,
                    'population' => $population,
                    'crime_rate' => round($crimeRate, 2),
                    'risk_level' => $riskLevel,
                    'latitude' => $lat,
                    'longitude' => $lng
                ];
            }
            
            // Sort by crime rate descending (highest risk first)
            usort($hotspotData, function($a, $b) {
                return $b['crime_rate'] <=> $a['crime_rate'];
            });
            
            \Log::info("Hotspot data processed: {$matchedCount} matched, {$unmatchedCount} unmatched barangays");
            
            return response()->json([
                'barangays' => $hotspotData,
                'total_barangays' => count($hotspotData),
                'matched_coordinates' => $matchedCount,
                'unmatched_coordinates' => $unmatchedCount,
                'highest_crime_rate' => !empty($hotspotData) ? $hotspotData[0]['crime_rate'] : 0,
                'risk_thresholds' => [
                    'high' => 'Greater than 8 per 1,000',
                    'medium' => '4 to 7 per 1,000',
                    'low' => 'Less than 4 per 1,000'
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getHotspotData: ' . $e->getMessage() . '\n' . $e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to load hotspot data',
                'message' => $e->getMessage(),
                'barangays' => []
            ], 500);
        }
    }
    
    /**
     * Load barangay data from database
     * Contains barangay names, total crimes, and population
     */
    private function loadBarangayDataFromCSV()
    {
        try {
            // Query the database for crime statistics by barangay
            $barangayStats = DB::table('locations')
                ->select('barangay', DB::raw('COUNT(*) as total_crimes'))
                ->whereNotNull('barangay')
                ->where('barangay', '!=', '')
                ->groupBy('barangay')
                ->get();
            
            \Log::info('Loaded ' . $barangayStats->count() . ' barangays from database');
            
            $barangays = [];
            foreach ($barangayStats as $stat) {
                // Use default population of 50,000 for all barangays
                // In production, this should come from actual census data
                $population = 50000;
                
                $barangays[] = [
                    'name' => trim($stat->barangay),
                    'total_crimes' => (int)$stat->total_crimes,
                    'population' => $population
                ];
            }
            
            \Log::info('Processed ' . count($barangays) . ' barangays with crime data');
            
            return $barangays;
        } catch (\Exception $e) {
            \Log::error('Error loading barangay data from database: ' . $e->getMessage());
            return [];
        }
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
                
                \Log::info('Loaded ' . count($cached['barangays']) . ' barangay coordinates with variations');
                
                return $coords;
            }
        }
        
        \Log::warning('barangay_coordinates.json not found or empty at: ' . $cacheFile);
        
        // Fallback: Use Davao City center for unmatched barangays
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
}
