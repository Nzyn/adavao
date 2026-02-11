<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('users_public') && !Schema::hasColumn('users_public', 'role')) {
            Schema::table('users_public', function (Blueprint $table) {
                $table->string('role')->default('user')->after('station_id');
            });
            
            // Backfill existing
            DB::table('users_public')->update(['role' => 'user']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users_public') && Schema::hasColumn('users_public', 'role')) {
            Schema::table('users_public', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
