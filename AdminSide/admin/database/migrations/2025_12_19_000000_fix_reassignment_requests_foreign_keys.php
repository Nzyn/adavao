<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix report_reassignment_requests foreign keys.
 * The original migration incorrectly referenced 'users' table,
 * but admin/police users are stored in 'user_admin' table.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First check if the table exists
        if (!Schema::hasTable('report_reassignment_requests')) {
            // If table doesn't exist, create it with correct FKs
            Schema::create('report_reassignment_requests', function (Blueprint $table) {
                $table->id('request_id');
                $table->unsignedBigInteger('report_id');
                $table->unsignedBigInteger('requested_by_user_id');
                $table->unsignedBigInteger('current_station_id')->nullable();
                $table->unsignedBigInteger('requested_station_id');
                $table->string('reason', 500)->nullable();
                $table->string('status')->default('pending');
                $table->unsignedBigInteger('reviewed_by_user_id')->nullable();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();

                // Foreign keys - referencing user_admin instead of users
                $table->foreign('report_id')->references('report_id')->on('reports')->onDelete('cascade');
                $table->foreign('requested_by_user_id')->references('id')->on('user_admin')->onDelete('cascade');
                $table->foreign('current_station_id')->references('station_id')->on('police_stations')->onDelete('set null');
                $table->foreign('requested_station_id')->references('station_id')->on('police_stations')->onDelete('cascade');
                $table->foreign('reviewed_by_user_id')->references('id')->on('user_admin')->onDelete('set null');
            });
            return;
        }

        // Table exists - try to fix the foreign keys
        Schema::disableForeignKeyConstraints();
        
        Schema::table('report_reassignment_requests', function (Blueprint $table) {
            // Try to drop existing foreign keys (they may not exist in all setups)
            try {
                $table->dropForeign(['requested_by_user_id']);
            } catch (\Exception $e) {
                // FK may not exist, continue
            }
            
            try {
                $table->dropForeign(['reviewed_by_user_id']);
            } catch (\Exception $e) {
                // FK may not exist, continue
            }
        });
        
        Schema::table('report_reassignment_requests', function (Blueprint $table) {
            // Add correct foreign keys to user_admin table
            $table->foreign('requested_by_user_id')
                ->references('id')
                ->on('user_admin')
                ->onDelete('cascade');
                
            $table->foreign('reviewed_by_user_id')
                ->references('id')
                ->on('user_admin')
                ->onDelete('set null');
        });
        
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        
        Schema::table('report_reassignment_requests', function (Blueprint $table) {
            try {
                $table->dropForeign(['requested_by_user_id']);
            } catch (\Exception $e) {
                // FK may not exist
            }
            
            try {
                $table->dropForeign(['reviewed_by_user_id']);
            } catch (\Exception $e) {
                // FK may not exist
            }
        });
        
        // Note: We don't restore the old incorrect FKs
        
        Schema::enableForeignKeyConstraints();
    }
};
