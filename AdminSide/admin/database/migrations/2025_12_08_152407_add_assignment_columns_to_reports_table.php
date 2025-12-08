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
            $table->unsignedBigInteger('assigned_station_id')->nullable();
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->timestamp('assigned_at')->nullable();
            
            // Foreign keys
            $table->foreign('assigned_station_id')->references('station_id')->on('police_stations')->onDelete('set null');
            $table->foreign('assigned_by')->references('id')->on('user_admin')->onDelete('set null');
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
