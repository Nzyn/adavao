<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Migrate station_id to assigned_station_id for all existing reports
     */
    public function up(): void
    {
        // Check if station_id column exists (only exists in upgraded databases, not fresh installs)
        if (!Schema::hasColumn('reports', 'station_id')) {
            \Log::info('Migration: Skipping station_id migration - column does not exist (fresh install)');
            return;
        }

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
