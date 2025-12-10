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
        // Only run this if column exists and needs changing
        if (Schema::hasTable('reports') && Schema::hasColumn('reports', 'report_type')) {
            // For PostgreSQL compatibility, skip the JSON_VALID check
            // Just change the column type - PostgreSQL will handle JSON validation
            Schema::table('reports', function (Blueprint $table) {
                // Change report_type from string to JSON to support multiple crime types
                $table->json('report_type')->change();
            });
        }
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
