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
        Schema::table('user_flags', function (Blueprint $table) {
            if (!Schema::hasColumn('user_flags', 'duration_days')) {
                $table->integer('duration_days')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_flags', function (Blueprint $table) {
            if (Schema::hasColumn('user_flags', 'duration_days')) {
                $table->dropColumn('duration_days');
            }
        });
    }
};
