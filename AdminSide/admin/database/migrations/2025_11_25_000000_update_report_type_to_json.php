<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip this migration for fresh installs (PostgreSQL compatibility)
        // This migration is only needed when migrating existing MySQL data
        // For fresh installs, the reports table will be created with json type from the start
        if (!Schema::hasTable('reports')) {
            return;
        }
        
        // Only run if there's existing data that needs migration
        $hasData = \DB::table('reports')->exists();
        if (!$hasData) {
            return;
        }
        
        // This migration is for existing MySQL databases only
        // Skip for PostgreSQL fresh installs
        return;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            // Revert back to string type
            $table->string('report_type')->change();
        });
    }
};
