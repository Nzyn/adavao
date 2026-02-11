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
        Schema::table('barangays', function (Blueprint $table) {
            $table->text('boundary_polygon')->nullable()->after('longitude');
            $table->string('osm_id', 50)->nullable()->after('boundary_polygon');
            $table->string('ref', 50)->nullable()->after('osm_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barangays', function (Blueprint $table) {
            $table->dropColumn(['boundary_polygon', 'osm_id', 'ref']);
        });
    }
};
