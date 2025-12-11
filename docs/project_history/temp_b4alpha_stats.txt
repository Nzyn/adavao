<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Models\CrimeForecast;
use App\Models\CrimeAnalytics;

class StatisticsController extends Controller
{
    private $sarimaApiUrl = 'http://localhost:8001';

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
            $projectRoot = base_path('..');
            $pythonScript = $projectRoot . DIRECTORY_SEPARATOR . 'start_sarima.py';
            
            if (file_exists($pythonScript)) {
                if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                    // Windows
                    pclose(popen("start /B python \"$pythonScript\"", "r"));
                } else {
                    // Linux/Mac
                    exec("python3 \"$pythonScript\" > /dev/null 2>&1 &");
                }
                
                // Wait a moment for the API to start
                sleep(3);
                return $this->isSarimaApiRunning();
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
     * Get crime forecast from SARIMA API and store in database
     * Only includes VALID reports (as set by police/admin)
     */
    public function getForecast(Request $request)
    {
        $horizon = $request->input('horizon', 12);
        
        try {
            // First, get live data from database (ONLY VALID reports) and train the model
            $liveData = DB::table('reports')
                ->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('COUNT(*) as count')
                )
                ->where('created_at', '>=', DB::raw('DATE_SUB(NOW(), INTERVAL 36 MONTH)'))
                ->where('is_valid', 'valid')  // Only include reports marked as VALID by police/admin
                ->groupBy('year', 'month')
                ->orderBy('year', 'asc')
                ->orderBy('month', 'asc')
                ->get();
            
            // Prepare data for SARIMA training
            $trainingData = $liveData->map(function($row) {
                return [
                    'year' => (int)$row->year,
                    'month' => (int)$row->month,
                    'count' => (int)$row->count
                ];
            })->values()->toArray();
            
            // Train the model with live data
            if (count($trainingData) >= 24) {
                try {
                    $trainResponse = Http::timeout(30)->post("{$this->sarimaApiUrl}/train", [
                        'data' => $trainingData
                    ]);
                    
                    if ($trainResponse->successful()) {
                        \Log::info('SARIMA model trained with ' . count($trainingData) . ' data points');
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to train SARIMA model: ' . $e->getMessage());
                }
            }
            
            // Now get the forecast
            $response = Http::timeout(10)->get("{$this->sarimaApiUrl}/forecast", [
                'horizon' => $horizon
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Store forecasts in database (using location_id = 1 for city-wide)
                if (isset($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $forecast) {
                        CrimeForecast::updateOrCreate(
                            [
                                'location_id' => 1, // City-wide forecast
                                'forecast_date' => $forecast['date']
                            ],
                            [
                                'predicted_count' => round($forecast['forecast']),
                                'model_used' => 'SARIMA(1,1,1)(1,1,1)[12]',
                                'confidence_score' => 0.95,
                                'lower_ci' => $forecast['lower_ci'],
                                'upper_ci' => $forecast['upper_ci']
                            ]
                        );
                    }
                }
                
                return response()->json($data);
            }

            // If API fails, try to get from database
            $savedForecasts = CrimeForecast::where('location_id', 1)
                ->where('forecast_date', '>=', now())
                ->orderBy('forecast_date')
                ->limit($horizon)
                ->get();
            
            if ($savedForecasts->isNotEmpty()) {
                return response()->json([
                    'status' => 'success',
                    'source' => 'database',
                    'horizon' => $savedForecasts->count(),
                    'data' => $savedForecasts->map(function($f) {
                        return [
                            'date' => $f->forecast_date->format('Y-m-d'),
                            'forecast' => (float)$f->predicted_count,
                            'lower_ci' => (float)$f->lower_ci,
                            'upper_ci' => (float)$f->upper_ci
                        ];
                    })
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch forecast from SARIMA API'
            ], 500);
        } catch (\Exception $e) {
            // Try to return saved forecasts from database
            $savedForecasts = CrimeForecast::where('location_id', 1)
                ->where('forecast_date', '>=', now())
                ->orderBy('forecast_date')
                ->limit($horizon)
                ->get();
            
            if ($savedForecasts->isNotEmpty()) {
                return response()->json([
                    'status' => 'success',
                    'source' => 'database',
                    'message' => 'SARIMA API offline, showing cached forecasts',
                    'horizon' => $savedForecasts->count(),
                    'data' => $savedForecasts->map(function($f) {
                        return [
                            'date' => $f->forecast_date->format('Y-m-d'),
                            'forecast' => (float)$f->predicted_count,
                            'lower_ci' => (float)$f->lower_ci,
                            'upper_ci' => (float)$f->upper_ci
                        ];
                    })
                ]);
            }
            
            return response()->json([
                'status' => 'error',
                'message' => 'SARIMA API is not running and no cached forecasts available.',
                'details' => $e->getMessage()
            ], 503);
        }
    }

    /**
     * Get crime statistics from database
     * Note: Stats show all reports, but forecasting only uses VALID reports
     */
    public function getCrimeStats()
    {
        try {
            // Get monthly crime counts from reports table (all reports for context)
            $monthlyStats = DB::table('reports')
                ->select(
                    DB::raw('YEAR(created_at) as year'),
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('COUNT(*) as count')
                )
                ->where('created_at', '>=', DB::raw('DATE_SUB(NOW(), INTERVAL 24 MONTH)'))
                ->groupBy('year', 'month')
                ->orderBy('year', 'asc')
                ->orderBy('month', 'asc')
                ->get();

            // Save to crime_analytics table for each month
            foreach ($monthlyStats as $stat) {
                CrimeAnalytics::updateOrCreate(
                    [
                        'location_id' => 1, // City-wide
                        'year' => $stat->year,
                        'month' => $stat->month
                    ],
                    [
                        'total_reports' => $stat->count,
                        'crime_rate' => 0, // Calculate based on population if needed
                        'last_updated' => now()
                    ]
                );
            }

            // Get crime by type
            $crimeByType = DB::table('reports')
                ->select('report_type as type', DB::raw('COUNT(*) as count'))
                ->where('created_at', '>=', DB::raw('DATE_SUB(NOW(), INTERVAL 12 MONTH)'))
                ->groupBy('report_type')
                ->orderBy('count', 'desc')
                ->get();

            // Get crime by status
            $crimeByStatus = DB::table('reports')
                ->select('status', DB::raw('COUNT(*) as count'))
                ->where('created_at', '>=', DB::raw('DATE_SUB(NOW(), INTERVAL 12 MONTH)'))
                ->groupBy('status')
                ->get();

            // Get crime by location (top 10 barangays)
            $crimeByLocation = DB::table('reports')
                ->join('locations', 'reports.location_id', '=', 'locations.location_id')
                ->select('locations.barangay as location', DB::raw('COUNT(*) as count'))
                ->where('reports.created_at', '>=', DB::raw('DATE_SUB(NOW(), INTERVAL 12 MONTH)'))
                ->groupBy('locations.barangay')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            // Overall statistics
            $totalCrimes = DB::table('reports')->count();
            $totalThisMonth = DB::table('reports')
                ->whereMonth('created_at', date('m'))
                ->whereYear('created_at', date('Y'))
                ->count();
            $totalLastMonth = DB::table('reports')
                ->whereMonth('created_at', date('m', strtotime('-1 month')))
                ->whereYear('created_at', date('Y', strtotime('-1 month')))
                ->count();
            
            $percentChange = $totalLastMonth > 0 
                ? round((($totalThisMonth - $totalLastMonth) / $totalLastMonth) * 100, 2)
                : 0;

            return response()->json([
                'status' => 'success',
                'data' => [
                    'monthly' => $monthlyStats,
                    'byType' => $crimeByType,
                    'byStatus' => $crimeByStatus,
                    'byLocation' => $crimeByLocation,
                    'overview' => [
                        'total' => $totalCrimes,
                        'thisMonth' => $totalThisMonth,
                        'lastMonth' => $totalLastMonth,
                        'percentChange' => $percentChange
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch crime statistics',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export crime data as CSV for SARIMA model
     * Only exports VALID reports
     */
    public function exportCrimeData()
    {
        try {
            $data = DB::table('reports')
                ->where('is_valid', 'valid')
                ->select(
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

            return response($csv)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="CrimeData_' . date('Y-m-d') . '.csv"');
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export crime data',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
