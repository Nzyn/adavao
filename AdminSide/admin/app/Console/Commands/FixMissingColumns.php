<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixMissingColumns extends Command
{
    protected $signature = 'db:fix-columns';
    protected $description = 'Fix missing database columns';

    public function handle()
    {
        $this->info('Checking and fixing missing columns...');
        
        try {
            // Fix is_read column in messages table
            DB::statement('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE');
            $this->info('✓ is_read column added to messages table');
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'already exists')) {
                $this->info('✓ is_read column already exists');
            } else {
                $this->warn('Could not add is_read column: ' . $e->getMessage());
            }
        }
        
        $this->info('Database fixes complete!');
        return 0;
    }
}
