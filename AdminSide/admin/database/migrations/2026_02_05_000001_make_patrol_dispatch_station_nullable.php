<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('patrol_dispatches')) {
            return;
        }

        // Drop FK first so we can alter nullability safely.
        Schema::table('patrol_dispatches', function (Blueprint $table) {
            try {
                $table->dropForeign(['station_id']);
            } catch (\Throwable $e) {
                // Ignore if foreign key doesn't exist / already dropped.
            }
        });

        // Make station_id nullable (Postgres-safe).
        DB::statement("ALTER TABLE patrol_dispatches ALTER COLUMN station_id DROP NOT NULL");

        // Re-add FK with SET NULL since column is now nullable.
        Schema::table('patrol_dispatches', function (Blueprint $table) {
            $table->foreign('station_id')
                ->references('station_id')
                ->on('police_stations')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('patrol_dispatches')) {
            return;
        }

        // Drop FK, backfill nulls if possible, then enforce NOT NULL.
        Schema::table('patrol_dispatches', function (Blueprint $table) {
            try {
                $table->dropForeign(['station_id']);
            } catch (\Throwable $e) {
                // Ignore
            }
        });

        // If there are NULL station_id rows, try to backfill with the first station.
        $fallbackStationId = DB::table('police_stations')->orderBy('station_id')->value('station_id');
        if ($fallbackStationId) {
            DB::table('patrol_dispatches')->whereNull('station_id')->update(['station_id' => $fallbackStationId]);
        }

        DB::statement("ALTER TABLE patrol_dispatches ALTER COLUMN station_id SET NOT NULL");

        // Restore original FK behavior (cascade) to match initial schema.
        Schema::table('patrol_dispatches', function (Blueprint $table) {
            $table->foreign('station_id')
                ->references('station_id')
                ->on('police_stations')
                ->onDelete('cascade');
        });
    }
};
