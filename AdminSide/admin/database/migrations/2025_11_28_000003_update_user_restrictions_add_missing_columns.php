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
        if (Schema::hasTable('user_restrictions')) {
            Schema::table('user_restrictions', function (Blueprint $table) {
                // Add missing columns if they don't exist
                if (!Schema::hasColumn('user_restrictions', 'restricted_by')) {
                    $table->unsignedBigInteger('restricted_by')->nullable()->after('reason');
                }
                if (!Schema::hasColumn('user_restrictions', 'expires_at')) {
                    $table->timestamp('expires_at')->nullable()->after('restricted_by');
                }
                if (!Schema::hasColumn('user_restrictions', 'can_report')) {
                    $table->boolean('can_report')->default(true)->after('expires_at');
                }
                if (!Schema::hasColumn('user_restrictions', 'can_message')) {
                    $table->boolean('can_message')->default(true)->after('can_report');
                }
                if (!Schema::hasColumn('user_restrictions', 'lifted_by')) {
                    $table->unsignedBigInteger('lifted_by')->nullable()->after('is_active');
                }
                if (!Schema::hasColumn('user_restrictions', 'lifted_at')) {
                    $table->timestamp('lifted_at')->nullable()->after('lifted_by');
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
        if (Schema::hasTable('user_restrictions')) {
            Schema::table('user_restrictions', function (Blueprint $table) {
                // Drop foreign keys
                try {
                    $table->dropForeign(['restricted_by']);
                } catch (\Exception $e) {
                    // Ignore if doesn't exist
                }
                
                try {
                    $table->dropForeign(['lifted_by']);
                } catch (\Exception $e) {
                    // Ignore if doesn't exist
                }
            });

            Schema::table('user_restrictions', function (Blueprint $table) {
                // Drop columns
                if (Schema::hasColumn('user_restrictions', 'restricted_by')) {
                    $table->dropColumn('restricted_by');
                }
                if (Schema::hasColumn('user_restrictions', 'expires_at')) {
                    $table->dropColumn('expires_at');
                }
                if (Schema::hasColumn('user_restrictions', 'can_report')) {
                    $table->dropColumn('can_report');
                }
                if (Schema::hasColumn('user_restrictions', 'can_message')) {
                    $table->dropColumn('can_message');
                }
                if (Schema::hasColumn('user_restrictions', 'lifted_by')) {
                    $table->dropColumn('lifted_by');
                }
                if (Schema::hasColumn('user_restrictions', 'lifted_at')) {
                    $table->dropColumn('lifted_at');
                }
            });
        }
    }
};
