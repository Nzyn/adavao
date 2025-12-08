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
        Schema::table('users', function (Blueprint $table) {
            // Add columns if they don't exist
            if (!Schema::hasColumn('users', 'total_flags')) {
                $table->integer('total_flags')->default(0);
            }
            if (!Schema::hasColumn('users', 'restriction_level')) {
                $table->enum('restriction_level', ['none', 'warning', 'suspended', 'banned'])->default('none');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'total_flags')) {
                $table->dropColumn('total_flags');
            }
            if (Schema::hasColumn('users', 'restriction_level')) {
                $table->dropColumn('restriction_level');
            }
        });
    }
};
