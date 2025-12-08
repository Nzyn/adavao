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
        // Check if table exists before modifying
        if (Schema::hasTable('user_flags')) {
            Schema::table('user_flags', function (Blueprint $table) {
                // Add missing columns if they don't exist
                if (!Schema::hasColumn('user_flags', 'reported_by')) {
                    $table->unsignedBigInteger('reported_by')->nullable()->after('user_id');
                }
                if (!Schema::hasColumn('user_flags', 'severity')) {
                    $table->enum('severity', ['low', 'medium', 'high'])->default('medium')->after('description');
                }
                if (!Schema::hasColumn('user_flags', 'reviewed_by')) {
                    $table->unsignedBigInteger('reviewed_by')->nullable()->after('status');
                }
                if (!Schema::hasColumn('user_flags', 'reviewed_at')) {
                    $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
                }
            });

            // Foreign keys are optional - skip if they cause issues
            // The columns are in place for future use
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('user_flags')) {
            Schema::table('user_flags', function (Blueprint $table) {
                // Drop foreign keys
                try {
                    $table->dropForeign(['reported_by']);
                } catch (\Exception $e) {
                    // Ignore if doesn't exist
                }
                
                try {
                    $table->dropForeign(['reviewed_by']);
                } catch (\Exception $e) {
                    // Ignore if doesn't exist
                }
            });

            Schema::table('user_flags', function (Blueprint $table) {
                // Drop columns
                if (Schema::hasColumn('user_flags', 'reported_by')) {
                    $table->dropColumn('reported_by');
                }
                if (Schema::hasColumn('user_flags', 'severity')) {
                    $table->dropColumn('severity');
                }
                if (Schema::hasColumn('user_flags', 'reviewed_by')) {
                    $table->dropColumn('reviewed_by');
                }
                if (Schema::hasColumn('user_flags', 'reviewed_at')) {
                    $table->dropColumn('reviewed_at');
                }
            });
        }
    }
};
