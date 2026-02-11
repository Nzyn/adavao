<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        // Only run in production environment on app boot
        if (app()->environment('production')) {
            try {
                // Run migrations automatically (handles schema changes through Laravel migration system)
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                Log::info('Auto-Migration: Migrations completed successfully.');
            } catch (\Exception $e) {
                // Non-fatal error, just log it
                Log::warning('Production Startup Error (non-fatal): ' . $e->getMessage());
            }
        }
    }
}
