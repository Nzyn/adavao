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
        Schema::disableForeignKeyConstraints();

        // 1. Add station_id to users_public if missing
        if (Schema::hasTable('users_public')) {
            Schema::table('users_public', function (Blueprint $table) {
                if (!Schema::hasColumn('users_public', 'station_id')) {
                    $table->unsignedBigInteger('station_id')->nullable()->after('longitude');
                }
            });
            
            // Add FK for station_id
            Schema::table('users_public', function (Blueprint $table) {
                try {
                    $table->foreign('station_id')->references('station_id')->on('police_stations')->onDelete('set null');
                } catch (\Exception $e) {}
            });
        }

        // Helper closure to fix FKs pointing to users_public
        $fixUserFk = function ($tableName, $columnName = 'user_id') {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($columnName) {
                    // Try to drop existing foreign key (heuristic: try column array)
                    try { $table->dropForeign([$columnName]); } catch (\Exception $e) {}
                });

                Schema::table($tableName, function (Blueprint $table) use ($columnName) {
                    // Add correct foreign key
                    try {
                        $table->foreign($columnName)->references('id')->on('users_public')->onDelete('cascade');
                    } catch (\Exception $e) {}
                });
            }
        };

        // 2. Fix FKs for related tables
        $fixUserFk('reports', 'user_id');
        $fixUserFk('verifications', 'user_id');
        $fixUserFk('notifications', 'user_id');
        $fixUserFk('user_flags', 'user_id');
        $fixUserFk('user_restrictions', 'user_id');
        
        // 3. Fix user_flags reported_by if it exists (pointing to users_public? or user_admin?)
        // Assuming reported_by was dropped or points to admin. Leaving as is if handled by previous migrations.
        // But user_flags.user_id is definitely citizen.

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way repair migration
    }
};
