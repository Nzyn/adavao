<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteTestAccounts extends Command
{
    protected $signature = 'cleanup:test-accounts {pattern=dansoypatrol}';
    protected $description = 'Delete test accounts from the database';

    public function handle()
    {
        $pattern = $this->argument('pattern');
        
        $this->info("Deleting test accounts matching: {$pattern}%@mailsac.com");
        
        // Delete from user_admin
        $deletedAdmin = DB::table('user_admin')
            ->where('email', 'LIKE', "{$pattern}%@mailsac.com")
            ->delete();
        
        // Delete from users_public
        $deletedPublic = DB::table('users_public')
            ->where('email', 'LIKE', "{$pattern}%@mailsac.com")
            ->delete();
        
        $this->info("Deleted {$deletedAdmin} accounts from user_admin");
        $this->info("Deleted {$deletedPublic} accounts from users_public");
        
        // Show remaining test accounts
        $remaining = DB::table('user_admin')
            ->where('email', 'LIKE', '%@mailsac.com')
            ->orWhere('email', 'LIKE', '%test%')
            ->get(['id', 'email', 'user_role']);
        
        if ($remaining->count() > 0) {
            $this->warn("\nRemaining test accounts:");
            foreach ($remaining as $account) {
                $this->line("  - ID: {$account->id}, Email: {$account->email}, Role: {$account->user_role}");
            }
        } else {
            $this->info("\n✓ No remaining test accounts found");
        }
        
        return 0;
    }
}
