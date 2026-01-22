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
                // 1. Run migrations automatically (Fixes the missing user_role column)
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                Log::info('Auto-Migration: Migrations completed successfully.');

                // 2. Delete duplicate users that cause unique constraint violations
                $deleted = DB::table('users_public')
                    ->where('email', 'dansoypatrol@mailsac.com')
                    ->delete();
                
                if ($deleted > 0) {
                    Log::info('Cleanup: Deleted duplicate user dansoypatrol@mailsac.com');
                }
            } catch (\Exception $e) {
                // Non-fatal error, just log it
                Log::warning('Production Startup Error (non-fatal): ' . $e->getMessage());
            }
        }
    }
}
