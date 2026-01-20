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
        Schema::table('reports', function (Blueprint $table) {
            // Add urgency_score column if it doesn't exist
            if (!Schema::hasColumn('reports', 'urgency_score')) {
                $table->integer('urgency_score')->default(30)->after('status')->comment('0-100 score for police prioritization');
                // Index for sorting dashboard queries faster
                $table->index(['urgency_score', 'created_at']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            if (Schema::hasColumn('reports', 'urgency_score')) {
                $table->dropColumn('urgency_score');
            }
        });
    }
};
