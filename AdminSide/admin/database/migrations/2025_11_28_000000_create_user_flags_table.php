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
        if (Schema::hasTable('user_flags')) {
            return; // Table already exists, skip
        }

        Schema::create('user_flags', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('reported_by')->nullable();
            $table->enum('violation_type', [
                'false_report',
                'prank_spam',
                'harassment',
                'offensive_content',
                'impersonation',
                'multiple_accounts',
                'system_abuse',
                'inappropriate_media',
                'misleading_info',
                'other'
            ]);
            $table->text('description')->nullable();
            $table->enum('status', ['confirmed', 'appealed', 'dismissed'])->default('confirmed');
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium');
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reported_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('user_id');
            $table->index('reported_by');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_flags');
    }
};
