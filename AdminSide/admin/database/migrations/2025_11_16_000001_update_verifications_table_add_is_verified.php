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
        Schema::table('verifications', function (Blueprint $table) {
            // Add is_verified column if it doesn't exist
            if (!Schema::hasColumn('verifications', 'is_verified')) {
                $table->boolean('is_verified')->default(false)->after('billing_document')->comment('True if verification is approved');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            if (Schema::hasColumn('verifications', 'is_verified')) {
                $table->dropColumn('is_verified');
            }
        });
    }
};