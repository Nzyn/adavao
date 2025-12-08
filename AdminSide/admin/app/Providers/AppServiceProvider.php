<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS when behind a proxy (like ngrok)
        if (env('FORCE_HTTPS', false)) {
            \URL::forceScheme('https');
        }

        // Auto-start SARIMA API when Laravel starts (development only)
        if (app()->environment('local')) {
            $this->startSarimaApiAsync();
        }

        // Register observers
        \App\Models\UserAdmin::observe(\App\Observers\UserAdminObserver::class);
    }

    /**
     * Start SARIMA API asynchronously in background
     */
    private function startSarimaApiAsync(): void
    {
        // Check if already running
        try {
            $ch = curl_init('http://localhost:8001/');
            curl_setopt($ch, CURLOPT_TIMEOUT, 2);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_NOBODY, false);
            @curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                return; // Already running
            }
        } catch (\Exception $e) {
            // Not running, continue
        }

        $sarimaDir = base_path('..') . DIRECTORY_SEPARATOR . 'sarima_api';
        
        if (!is_dir($sarimaDir)) {
            return;
        }

        // Start in completely detached background process
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows - use PowerShell script
            $scriptPath = $sarimaDir . DIRECTORY_SEPARATOR . 'start_background.ps1';
            $cmd = "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \"{$scriptPath}\"";
            pclose(popen($cmd, "r"));
        } else {
            // Linux/Mac
            $cmd = "cd \"{$sarimaDir}\" && python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 > /dev/null 2>&1 &";
            exec($cmd);
        }
    }
}
