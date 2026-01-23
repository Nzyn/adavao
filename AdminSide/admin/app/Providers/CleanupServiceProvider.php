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

                // 2. Delete all test accounts automatically on deployment
                $deletedAdmin = DB::table('user_admin')
                    ->where('email', 'LIKE', '%@mailsac.com')
                    ->orWhere('email', 'LIKE', '%test%')
                    ->orWhere('email', 'LIKE', 'dansoy%')
                    ->delete();
                
                $deletedPublic = DB::table('users_public')
                    ->where('email', 'LIKE', '%@mailsac.com')
                    ->orWhere('email', 'LIKE', '%test%')
                    ->orWhere('email', 'LIKE', 'dansoy%')
                    ->delete();
                
                if ($deletedAdmin > 0 || $deletedPublic > 0) {
                    Log::info("Auto-Cleanup: Deleted {$deletedAdmin} test accounts from user_admin and {$deletedPublic} from users_public");
                }
            } catch (\Exception $e) {
                // Non-fatal error, just log it
                Log::warning('Production Startup Error (non-fatal): ' . $e->getMessage());
            }
        }
    }
}
