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
        Schema::table('report_media', function (Blueprint $table) {
            if (!Schema::hasColumn('report_media', 'is_sensitive')) {
                $table->boolean('is_sensitive')->default(false);
            }
            if (!Schema::hasColumn('report_media', 'moderation_provider')) {
                $table->string('moderation_provider', 50)->nullable();
            }
            if (!Schema::hasColumn('report_media', 'moderation_status')) {
                $table->string('moderation_status', 50)->nullable();
            }
            if (!Schema::hasColumn('report_media', 'moderation_raw')) {
                $table->jsonb('moderation_raw')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_media', function (Blueprint $table) {
            if (Schema::hasColumn('report_media', 'moderation_raw')) {
                $table->dropColumn('moderation_raw');
            }
            if (Schema::hasColumn('report_media', 'moderation_status')) {
                $table->dropColumn('moderation_status');
            }
            if (Schema::hasColumn('report_media', 'moderation_provider')) {
                $table->dropColumn('moderation_provider');
            }
            if (Schema::hasColumn('report_media', 'is_sensitive')) {
                $table->dropColumn('is_sensitive');
            }
        });
    }
};
