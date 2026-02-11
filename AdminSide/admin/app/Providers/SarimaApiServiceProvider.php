<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Artisan;

class SarimaApiServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Auto-start SARIMA API when running in local environment
        if (app()->environment('local') && php_sapi_name() === 'cli-server') {
            $this->startSarimaApi();
        }
    }

    /**
     * Start SARIMA API server in background
     */
    private function startSarimaApi(): void
    {
        try {
            // Check if already running
            $response = @file_get_contents('http://localhost:8001/', false, stream_context_create([
                'http' => ['timeout' => 1]
            ]));
            
            if ($response !== false) {
                \Log::info('SARIMA API is already running on port 8001');
                return;
            }
        } catch (\Exception $e) {
            // API not running, start it
        }

        $sarimaPath = base_path('../../for adminside sarima/sarima_api');
        
        if (!is_dir($sarimaPath)) {
            \Log::warning('SARIMA API directory not found at: ' . $sarimaPath);
            return;
        }

        try {
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Windows - start in background
                $command = "cd /d \"$sarimaPath\" && start /B uvicorn main:app --host 0.0.0.0 --port 8001 > sarima.log 2>&1";
                pclose(popen($command, "r"));
                
                echo "\n";
                echo "╔════════════════════════════════════════════════════════════════╗\n";
                echo "║  🚀 SARIMA API Starting...                                     ║\n";
                echo "║  📊 Forecast endpoint: http://localhost:8001                   ║\n";
                echo "║  ⏳ Waiting for API to initialize...                          ║\n";
                echo "╚════════════════════════════════════════════════════════════════╝\n";
                echo "\n";
                
                // Wait for API to start
                sleep(3);
                
                // Verify it started
                $response = @file_get_contents('http://localhost:8001/', false, stream_context_create([
                    'http' => ['timeout' => 2]
                ]));
                
                if ($response !== false) {
                    echo "✅ SARIMA API started successfully!\n\n";
                    \Log::info('SARIMA API started successfully on port 8001');
                } else {
                    echo "⚠️  SARIMA API may still be starting...\n\n";
                }
            } else {
                // Linux/Mac
                $command = "cd \"$sarimaPath\" && uvicorn main:app --host 0.0.0.0 --port 8001 > sarima.log 2>&1 &";
                exec($command);
                
                echo "\n✅ SARIMA API started on port 8001\n\n";
                \Log::info('SARIMA API started on port 8001');
                
                sleep(2);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to start SARIMA API: ' . $e->getMessage());
            echo "\n⚠️  Warning: Could not auto-start SARIMA API\n";
            echo "Error: " . $e->getMessage() . "\n\n";
        }
    }
}
