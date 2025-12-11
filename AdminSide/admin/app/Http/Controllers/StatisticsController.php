<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\CrimeForecast;
use App\Models\CrimeAnalytics;

class StatisticsController extends Controller
{
    private $sarimaApiUrl;

    public function __construct() {
        $this->sarimaApiUrl = env('SARIMA_API_URL', 'http://sarima-api:8080');
    }

    /**
     * Check if SARIMA API is running
     */
    private function isSarimaApiRunning()
    {
        try {
            $response = Http::timeout(2)->get("{$this->sarimaApiUrl}/");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Auto-start SARIMA API if not running (development only)
     */
    private function autoStartSarimaApi()
    {
        if ($this->isSarimaApiRunning()) {
            return true;
        }

        // Only auto-start in local development
        if (!app()->environment('local')) {
            return false;
        }

        try {
            // Path to sarima_api/main.py relative to Laravel root (admin)
            // base_path() is .../admin, so we go up one level
            $pythonScript = base_path('../sarima_api/main.py');
            
            if (file_exists($pythonScript)) {
                if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                    // Windows
                    pclose(popen("start /B python \"$pythonScript\"", "r"));
                } else {
                    // Linux/Mac
                    exec("python3 \"$pythonScript\" > /dev/null 2>&1 &");
                }
                
                // Wait a moment for the API to start
                sleep(5);
                return $this->isSarimaApiRunning();
            } else {
                \Log::error("SARIMA script not found at: $pythonScript");
            }
        } catch (\Exception $e) {
            \Log::error('Failed to auto-start SARIMA API: ' . $e->getMessage());
        }

        return false;
    }

    /**
     * Display the statistics page
     */
    public function index()
    {
        // Try to auto-start SARIMA API if in development
        $this->autoStartSarimaApi();
        
        return view('statistics');
    }

    /**
     * Get crime forecast from pre-generated SARIMA CSV file
     * Uses sarima_forecast.csv (12 months forecast from CrimeDAta.csv)
     */

    /**
     * Pre-warm all caches
     */
    public function warmUpCache()
    {
        try {
            \Log::info('Starting cache warm-up...');
            
            // Warm up forecasts for common horizons
            foreach ([6, 12, 18, 24] as $horizon) {
                $this->_getForecast($horizon);
            }
            
            // Warm up crime stats (all time)
            $this->_getCrimeStats(null, null);
            
            // Warm up barangay stats
            $this->_getBarangayStats(null, null);
            
            \Log::info('Cache warm-up completed.');
            return true;
        } catch (\Exception $e) {
            \Log::error('Cache warm-up failed: ' . $e->getMessage());
            return false;
        }
    }

    public function getForecast(Request $request)
    {
        $horizon = $request->input('horizon', 12);
        $crimeType = $request->input('crime_type');

        try {
            // Ensure API is running
            $this->autoStartSarimaApi();
            
            $forecastData = $this->_getForecast($horizon, $crimeType);
            
            return response()->json([
                'status' => 'success',
                'data' => $forecastData,
                'horizon' => $horizon,
                'model' => 'SARIMA(0,1,1)(0,1,1)[12]',
                'source' => 'Live SARIMA API'
            ]);
        } catch (\Exception $e) {
             return response()->json([
                'status' => 'error',
                'message' => 'Failed to load SARIMA forecast data',
                'details' => $e->getMessage()
            ], 503);
        }
    }

    private function _getForecast($horizon, $crimeType = null) 
    {
        // Cache key must include crime type
        $cacheKey = "sarima_forecast_{$horizon}";
        if ($crimeType) {
            $cacheKey .= "_" . md5($crimeType);
        }

        return Cache::remember($cacheKey, 3600, function () use ($horizon, $crimeType) {
            $params = ['horizon' => $horizon];
            if ($crimeType) {
                $params['crime_type'] = $crimeType;
            }

            $response = Http::get("{$this->sarimaApiUrl}/forecast", $params);
            
            if ($response->successful()) {
                return $response->json()['data'];
            }
            
            throw new \Exception('Failed to fetch forecast from API');
        });
    }

    /**
     * Get crime statistics from CSV files
     * Uses CrimeDAta.csv and DCPO_5years_monthly.csv
     * Supports optional month/year filtering
     */
    public function getCrimeStats(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
        
        try {
            $statsData = $this->_getCrimeStats($month, $year);
             return response()->json([
                'status' => 'success',
                'data' => $statsData,
                'filter' => ['month' => $month, 'year' => $year]
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    private function _getCrimeStats($month, $year)
    {
        $cacheKey = 'crime_stats_data_v2' . ($month ? "_$month" : "") . ($year ? "_$year" : "");
            
        return Cache::remember($cacheKey, 3600, function () use ($month, $year) {
            $csvPath = storage_path('app/davao_crime_5years.csv');
            
            if (!file_exists($csvPath)) {
                throw new \Exception('Data file not found at: ' . $csvPath);
            }

            $crimesByType = [];
            $crimesByLocation = [];
            $monthlyStats = [];
            
            $file = fopen($csvPath, 'r');
            $header = fgetcsv($file); 
            $headerMap = array_flip($header);
            $idxDate = $headerMap['date'] ?? 1;
            $idxBarangay = $headerMap['barangay'] ?? 2;
            $idxType = $headerMap['crime_type'] ?? 3;
            $idxCount = $headerMap['crime_count'] ?? 4;

            while (($row = fgetcsv($file)) !== false) {
                if (count($row) < 5) continue;

                $date = $row[$idxDate];
                $barangay = trim($row[$idxBarangay]);
                $type = trim($row[$idxType]);
                $count = floatval($row[$idxCount]);
                
                $rowYear = substr($date, 0, 4);
                $rowMonth = substr($date, 5, 2);

                if ($month && substr($date, 0, 7) !== $month) continue;
                if ($year && $rowYear !== $year) continue;

                if (!isset($crimesByType[$type])) $crimesByType[$type] = 0;
                $crimesByType[$type] += $count;

                if (!isset($crimesByLocation[$barangay])) $crimesByLocation[$barangay] = 0;
                $crimesByLocation[$barangay] += $count;

                $mKey = "$rowYear-$rowMonth";
                if (!isset($monthlyStats[$mKey])) {
                    $monthlyStats[$mKey] = ['year' => intval($rowYear), 'month' => intval($rowMonth), 'count' => 0];
                }
                $monthlyStats[$mKey]['count'] += $count;
            }
            fclose($file);

            $crimeByType = collect($crimesByType)
                ->map(function($c, $t) { return ['type' => $t, 'count' => $c]; })
                ->sortByDesc('count')->values()->take(15);

            $crimeByLocation = collect($crimesByLocation)
                ->map(function($c, $l) { return ['location' => $l, 'count' => $c]; })
                ->sortByDesc('count')->values()->take(10);

            $monthlyStatsFormatted = collect($monthlyStats)->sortBy('year')->sortBy('month')->values();

            $totalCrimes = array_sum($crimesByType);
            $latest = $monthlyStatsFormatted->last();
            $totalThisMonth = $latest['count'] ?? 0;
            
            $percentChange = 0; 
            if ($monthlyStatsFormatted->count() >= 2) {
                $prev = $monthlyStatsFormatted[$monthlyStatsFormatted->count() - 2];
                if ($prev['count'] > 0) {
                    $percentChange = round((($totalThisMonth - $prev['count']) / $prev['count']) * 100, 2);
                }
            }

            return [
                'monthly' => $monthlyStatsFormatted,
                'byType' => $crimeByType,
                'byStatus' => [],
                'byLocation' => $crimeByLocation,
                'overview' => [
                    'total' => $totalCrimes,
                    'thisMonth' => $totalThisMonth,
                    'lastMonth' => 0,
                    'percentChange' => $percentChange
                ]
            ];
        });
    }

    /**
     * Export crime data as CSV with optional filters
     */
    public function exportCrimeData(Request $request)
    {
        $year = $request->input('year');
        $month = $request->input('month');
        $crimeType = $request->input('crime_type');
        
        try {
            // If crime type specified, export from DCPO CSV
            if ($crimeType) {
                return $this->exportDCPOData($crimeType, $year, $month);
            }
            
            // Otherwise export from reports table
            $query = DB::table('reports')->where('is_valid', 'valid');
            
            if ($year) {
                $query->whereYear('created_at', $year);
            }
            if ($month) {
                $query->whereMonth('created_at', $month);
            }
            
            $data = $query->select(
                    DB::raw('YEAR(created_at) as Year'),
                    DB::raw('MONTH(created_at) as Month'),
                    DB::raw('COUNT(*) as Count'),
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m-01") as Date')
                )
                ->groupBy('Year', 'Month', 'Date')
                ->orderBy('Year', 'asc')
                ->orderBy('Month', 'asc')
                ->get();

            $csv = "Year,Month,Count,Date\n";
            foreach ($data as $row) {
                $csv .= "{$row->Year},{$row->Month},{$row->Count},{$row->Date}\n";
            }
            
            $filename = 'CrimeData';
            if ($year) $filename .= "_{$year}";
            if ($month) $filename .= "_M{$month}";
            $filename .= '_' . date('Y-m-d') . '.csv';

            return response($csv)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export crime data',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Export crime-specific data from DCPO CSV
     */



    /**
     * Get barangay-level crime statistics from DCPO_5years_monthly.csv
     * Supports optional month/year filtering
     */
    public function getBarangayCrimeStats(Request $request)
    {
        $month = $request->input('month');
        $year = $request->input('year');
         try {
            $stats = $this->_getBarangayStats($month, $year);
             return response()->json([
                'status' => 'success',
                'data' => $stats['data'],
                'total_barangays' => $stats['total_barangays'],
                'total_crimes' => $stats['total_crimes'],
                'filter' => ['month' => $month, 'year' => $year]
            ]);
        } catch (\Exception $e) {
             return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    private function _getBarangayStats($month, $year) 
    {
         $cacheKey = 'barangay_crime_stats' . ($month ? "_$month" : "") . ($year ? "_$year" : "");
            
         return Cache::remember($cacheKey, 3600, function () use ($month, $year) {
             $csvPath = storage_path('app/davao_crime_5years.csv');
             if (!file_exists($csvPath)) throw new \Exception('Data file not found at: ' . $csvPath);

             $barangayData = [];
             $file = fopen($csvPath, 'r');
             $header = fgetcsv($file); 
             $headerMap = array_flip($header);
             $idxDate = $headerMap['date'] ?? 1;
             $idxBarangay = $headerMap['barangay'] ?? 2;
             $idxCount = $headerMap['crime_count'] ?? 4;

            while (($row = fgetcsv($file)) !== false) {
                if (count($row) < 5) continue;
                
                $date = $row[$idxDate];
                $barangay = trim($row[$idxBarangay]);
                $count = floatval($row[$idxCount]);
                
                $rowYear = substr($date, 0, 4);

                if ($month && substr($date, 0, 7) !== $month) continue;
                if ($year && $rowYear !== $year) continue;
                
                if (!isset($barangayData[$barangay])) $barangayData[$barangay] = 0;
                $barangayData[$barangay] += $count;
            }
            fclose($file);
            
            $result = [];
            foreach ($barangayData as $barangay => $totalCrimes) {
                $result[] = ['barangay' => $barangay, 'total_crimes' => $totalCrimes];
            }
            
            usort($result, function($a, $b) {
                return $b['total_crimes'] - $a['total_crimes'];
            });
            
            return [
                'data' => $result,
                'total_barangays' => count($result),
                'total_crimes' => array_sum($barangayData)
            ];
         });
    }

    /**
     * Clear all statistics caches
     * Useful when CSV files are updated
     */
    public function clearCache()
    {
        try {
            // Clear all statistics-related caches
            Cache::forget('crime_stats_data');
            Cache::forget('barangay_crime_stats');
            
            // Clear all forecast horizon caches (6, 12, 18, 24 months)
            foreach ([6, 12, 18, 24] as $horizon) {
                Cache::forget("sarima_forecast_{$horizon}");
            }
            
            return response()->json([
                'status' => 'success',
                'message' => 'All statistics caches cleared successfully',
                'cleared' => [
                    'crime_stats_data',
                    'barangay_crime_stats',
                    'sarima_forecast_6',
                    'sarima_forecast_12',
                    'sarima_forecast_18',
                    'sarima_forecast_24'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to clear cache',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get historical monthly data for specific crime type
     * Filters DCPO_5years_monthly.csv by offense type
     */
    private function getHistoricalByCrimeType($crimeType)
    {
        $csvPath = storage_path('app/davao_crime_5years.csv');
        $monthlyData = [];
        
        if (!file_exists($csvPath)) {
            return [];
        }
        
        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file);
        $headerMap = array_flip($header);
        $idxDate = $headerMap['date'] ?? 1;
        $idxType = $headerMap['crime_type'] ?? 3;
        $idxCount = $headerMap['crime_count'] ?? 4;
        
        while (($row = fgetcsv($file)) !== false) {
            if (count($row) < 5) continue;
            
            $offense = trim($row[$idxType]);
            
            if (strcasecmp($offense, $crimeType) === 0) {
                $date = $row[$idxDate];
                $yearMonth = substr($date, 0, 7);
                $count = floatval($row[$idxCount]);
                
                if (!isset($monthlyData[$yearMonth])) {
                    $monthlyData[$yearMonth] = 0;
                }
                $monthlyData[$yearMonth] += $count;
            }
        }
        fclose($file);
        
        $result = [];
        foreach ($monthlyData as $yearMonth => $count) {
            list($year, $month) = explode('-', $yearMonth);
            $result[] = [
                'year' => intval($year),
                'month' => intval($month),
                'count' => $count
            ];
        }
        
        usort($result, function($a, $b) {
            if ($a['year'] != $b['year']) return $a['year'] - $b['year'];
            return $a['month'] - $b['month'];
        });
        
        return $result;
    }

    /**
     * Export crime-specific data from Historical CSV
     */
    private function exportDCPOData($crimeType, $year = null, $month = null)
    {
        $csvPath = storage_path('app/davao_crime_5years.csv');
        
        if (!file_exists($csvPath)) {
            return response()->json(['status' => 'error', 'message' => 'Data file not found'], 404);
        }
        
        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file);
        
        // Map headers
        $headerMap = array_flip($header);
        $idxDate = $headerMap['date'] ?? 1;
        $idxType = $headerMap['crime_type'] ?? 3;
        $idxCount = $headerMap['crime_count'] ?? 4;
        
        $data = [];
        while (($row = fgetcsv($file)) !== false) {
            if (count($row) < 5) continue;
            
            $offense = trim($row[$idxType]);
            
            if (strcasecmp($offense, $crimeType) === 0) {
                $date = $row[$idxDate];
                $rowYear = substr($date, 0, 4);
                $rowMonth = substr($date, 5, 2);
                
                if ($year && $rowYear != $year) continue;
                if ($month && $rowMonth != $month) continue;
                
                $data[] = [
                    'year' => $rowYear,
                    'month' => $rowMonth,
                    'count' => floatval($row[$idxCount]),
                    'date' => substr($date, 0, 10)
                ];
            }
        }
        fclose($file);
        
        $csv = "Year,Month,Count,Date,CrimeType\n";
        foreach ($data as $row) {
            $csv .= "{$row['year']},{$row['month']},{$row['count']},{$row['date']},{$crimeType}\n";
        }
        
        $filename = 'CrimeData_' . str_replace(' ', '_', $crimeType);
        if ($year) $filename .= "_{$year}";
        if ($month) $filename .= "_M{$month}";
        $filename .= '_' . date('Y-m-d') . '.csv';
        
        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }
}


