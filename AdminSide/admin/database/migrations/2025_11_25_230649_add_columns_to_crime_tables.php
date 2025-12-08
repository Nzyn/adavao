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
        // Add columns to crime_forecasts table
        Schema::table('crime_forecasts', function (Blueprint $table) {
            $table->float('lower_ci')->nullable()->after('confidence_score');
            $table->float('upper_ci')->nullable()->after('lower_ci');
        });

        // Add columns to crime_analytics table
        Schema::table('crime_analytics', function (Blueprint $table) {
            $table->integer('year')->nullable()->after('location_id');
            $table->integer('month')->nullable()->after('year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crime_forecasts', function (Blueprint $table) {
            $table->dropColumn(['lower_ci', 'upper_ci']);
        });

        Schema::table('crime_analytics', function (Blueprint $table) {
            $table->dropColumn(['year', 'month']);
        });
    }
};
