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
    /**
     * Load barangay data from CSV file (davao_crime_5years.csv)
     * Aggregates total crimes per barangay
     */
    private function loadBarangayDataFromCSV()
    {
        try {
            $csvPath = storage_path('app/davao_crime_5years.csv');
            
            if (!file_exists($csvPath)) {
                \Log::warning('CSV file not found: ' . $csvPath);
                return [];
            }

            $barangayStats = [];
            $handle = fopen($csvPath, 'r');
            
            // Read header
            $header = fgetcsv($handle);
            $headerMap = array_flip($header);
            
            // Identify columns (flexible mapping)
            $idxBarangay = $headerMap['barangay'] ?? $headerMap['Barangay'] ?? 1;
            $idxCount = $headerMap['crime_count'] ?? $headerMap['Count'] ?? 3; // Default to column 3 if named differently
            
            while (($row = fgetcsv($handle)) !== false) {
                // Ensure row has enough columns
                if (count($row) <= $idxBarangay) continue;
                
                $barangay = strtoupper(trim($row[$idxBarangay]));
                
                // Skip invalid rows
                if (empty($barangay) || $barangay === 'BARANGAY') continue;
                
                // Get count (default to 1 if not specified, or parse if present)
                $count = isset($row[$idxCount]) ? (float)$row[$idxCount] : 1;
                
                if (!isset($barangayStats[$barangay])) {
                    $barangayStats[$barangay] = 0;
                }
                $barangayStats[$barangay] += $count;
            }
            
            fclose($handle);
            
            \Log::info('Aggregated stats for ' . count($barangayStats) . ' barangays from CSV');
            
            // Load real population data from 2020 census
            $populationData = $this->loadBarangayPopulations();
            
            $barangays = [];
            foreach ($barangayStats as $name => $total) {
                // Look up real population with fuzzy matching
                $population = $this->findBarangayPopulation($name, $populationData);
                
                $barangays[] = [
                    'name' => $name,
                    'total_crimes' => (int)$total,
                    'population' => $population
                ];
            }
            
            return $barangays;
        } catch (\Exception $e) {
            \Log::error('Error loading barangay data from CSV: ' . $e->getMessage());
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
    
    /**
     * Load barangay population data from JSON file (2020 census)
     */
    private function loadBarangayPopulations()
    {
        $populationFile = storage_path('app/barangay_populations.json');
        
        if (file_exists($populationFile)) {
            $data = json_decode(file_get_contents($populationFile), true);
            if (is_array($data)) {
                \Log::info('Loaded population data for ' . count($data) . ' barangays');
                return $data;
            }
        }
        
        \Log::warning('Population data file not found: ' . $populationFile);
        return [];
    }
    
    /**
     * Find population for a barangay with fuzzy matching
     * Falls back to 5000 (average small barangay) if not found
     */
    private function findBarangayPopulation($barangayName, $populationData)
    {
        $name = strtoupper(trim($barangayName));
        
        // Try exact match first
        if (isset($populationData[$name])) {
            return (int)$populationData[$name];
        }
        
        // Try without BARANGAY prefix
        $shortName = preg_replace('/^BARANGAY\s+/i', '', $name);
        if (isset($populationData[$shortName])) {
            return (int)$populationData[$shortName];
        }
        
        // Try with BARANGAY prefix added
        $withPrefix = 'BARANGAY ' . $name;
        if (isset($populationData[$withPrefix])) {
            return (int)$populationData[$withPrefix];
        }
        
        // Try removing parenthetical suffixes like (POB.) or (BRGY...)
        $cleanName = preg_replace('/\s*\([^)]*\)\s*/', '', $name);
        $cleanName = trim($cleanName);
        if (isset($populationData[$cleanName])) {
            return (int)$populationData[$cleanName];
        }
        
        // Try fuzzy matching
        $bestMatch = null;
        $bestScore = 0;
        foreach ($populationData as $popName => $pop) {
            $normalizedPopName = strtoupper($popName);
            $similarity = 0;
            similar_text($name, $normalizedPopName, $similarity);
            
            if ($similarity > $bestScore && $similarity > 75) {
                $bestScore = $similarity;
                $bestMatch = $pop;
            }
        }
        
        if ($bestMatch !== null) {
            return (int)$bestMatch;
        }
        
        // Fallback: use 5000 (reasonable average for small barangays)
        // This ensures crime rates are calculated more realistically
        \Log::debug("No population found for: $barangayName, using fallback 5000");
        return 5000;
    }
}
