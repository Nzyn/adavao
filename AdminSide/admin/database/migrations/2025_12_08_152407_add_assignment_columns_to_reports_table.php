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
        Schema::table('reports', function (Blueprint $table) {
            // Only add columns if they don't exist (prevents conflicts with earlier migrations)
            if (!Schema::hasColumn('reports', 'assigned_station_id')) {
                $table->unsignedBigInteger('assigned_station_id')->nullable();
                // FK added by earlier migration or may not be needed
            }
            if (!Schema::hasColumn('reports', 'assigned_by')) {
                $table->unsignedBigInteger('assigned_by')->nullable();
                // Skip FK - user_admin table may not exist in all setups
            }
            if (!Schema::hasColumn('reports', 'assigned_at')) {
                $table->timestamp('assigned_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropForeign(['assigned_station_id']);
            $table->dropForeign(['assigned_by']);
            $table->dropColumn(['assigned_station_id', 'assigned_by', 'assigned_at']);
        });
    }
};
