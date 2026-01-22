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
        // Only run cleanup in production environment on first boot
        if (app()->environment('production')) {
            try {
                // Delete duplicate users that cause unique constraint violations
                $deleted = DB::table('users_public')
                    ->where('email', 'dansoypatrol@mailsac.com')
                    ->delete();
                
                if ($deleted > 0) {
                    Log::info('Cleanup: Deleted duplicate user dansoypatrol@mailsac.com');
                }
            } catch (\Exception $e) {
                // Non-fatal error, just log it
                Log::warning('Cleanup error (non-fatal): ' . $e->getMessage());
            }
        }
    }
}
