<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Notification;

class ExpireUserFlags extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'expire:user-flags';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and automatically expire user flags that have passed their expiry date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired user flags...');
        
        try {
            // Find all active flags that have expired
            $expiredFlags = DB::table('user_flags')
                ->where('status', 'confirmed')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->get();
            
            $expiredCount = 0;
            
            foreach ($expiredFlags as $flag) {
                // Mark flag as expired
                DB::table('user_flags')
                    ->where('id', $flag->id)
                    ->update([
                        'status' => 'expired',
                        'updated_at' => now()
                    ]);
                
                // Deactivate restrictions for this flag
                DB::table('user_restrictions')
                    ->where('user_id', $flag->user_id)
                    ->where('is_active', true)
                    ->whereNotNull('expires_at')
                    ->where('expires_at', '<=', now())
                    ->update([
                        'is_active' => false,
                        'lifted_at' => now(),
                        'updated_at' => now()
                    ]);
                
                // Count remaining active flags for this user
                $remainingFlags = DB::table('user_flags')
                    ->where('user_id', $flag->user_id)
                    ->where('status', 'confirmed')
                    ->where(function($query) {
                        $query->whereNull('expires_at')
                              ->orWhere('expires_at', '>', now());
                    })
                    ->count();
                
                // Update user record in users_public table
                DB::table('users_public')
                    ->where('id', $flag->user_id)
                    ->update([
                        'total_flags' => $remainingFlags,
                        'restriction_level' => $remainingFlags > 0 ? 'warning' : 'none',
                        'updated_at' => now()
                    ]);
                
                // Create notification to inform user their flag has expired
                Notification::create([
                    'user_id' => $flag->user_id,
                    'type' => 'flag_expired',
                    'message' => 'Good news! Your account restriction has expired. You can now submit reports and access all features normally.',
                    'data' => [
                        'flag_id' => $flag->id,
                        'violation_type' => $flag->violation_type,
                        'expired_at' => now()->toIso8601String(),
                        'remaining_flags' => $remainingFlags,
                    ]
                ]);
                
                $expiredCount++;
                
                Log::info('Flag expired automatically', [
                    'flag_id' => $flag->id,
                    'user_id' => $flag->user_id,
                    'remaining_flags' => $remainingFlags
                ]);
                
                $this->line("  - Expired flag #{$flag->id} for user #{$flag->user_id}");
            }
            
            $this->info("Expired {$expiredCount} flag(s) successfully.");
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            Log::error('Error in ExpireUserFlags command', ['error' => $e->getMessage()]);
            $this->error('An error occurred: ' . $e->getMessage());
            
            return Command::FAILURE;
        }
    }
}
