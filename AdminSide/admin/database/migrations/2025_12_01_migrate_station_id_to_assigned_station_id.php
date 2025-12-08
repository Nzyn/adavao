<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Migrate station_id to assigned_station_id for all existing reports
     */
    public function up(): void
    {
        // Copy station_id to assigned_station_id for reports where assigned_station_id is NULL
        DB::statement('
            UPDATE reports 
            SET assigned_station_id = station_id 
            WHERE assigned_station_id IS NULL 
            AND station_id IS NOT NULL
        ');
        
        \Log::info('Migration: Copied station_id to assigned_station_id for existing reports');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't reverse this migration as it would cause data loss
        \Log::warning('Migration rollback: station_id to assigned_station_id migration cannot be reversed');
    }
};
