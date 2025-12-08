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
            // Add assigned_station_id if it doesn't exist
            if (!Schema::hasColumn('reports', 'assigned_station_id')) {
                $table->unsignedBigInteger('assigned_station_id')->nullable()->after('location_id')->comment('Station assigned to handle the report');
                
                // Add foreign key
                $table->foreign('assigned_station_id')->references('station_id')->on('police_stations')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            if (Schema::hasColumn('reports', 'assigned_station_id')) {
                $table->dropForeign(['assigned_station_id']);
                $table->dropColumn('assigned_station_id');
            }
        });
    }
};
