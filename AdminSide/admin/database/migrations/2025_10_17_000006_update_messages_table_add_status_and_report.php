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
        Schema::table('messages', function (Blueprint $table) {
            // Add report_id column if it doesn't exist
            if (!Schema::hasColumn('messages', 'report_id')) {
                $table->unsignedBigInteger('report_id')->nullable()->after('receiver_id');
                
                // Add foreign key
                $table->foreign('report_id')->references('report_id')->on('reports')->onDelete('set null');
            }
            
            // Add status column if it doesn't exist
            if (!Schema::hasColumn('messages', 'status')) {
                $table->boolean('status')->default(false)->after('message')->comment('True if the recipient has read the message');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'report_id')) {
                $table->dropForeign(['report_id']);
                $table->dropColumn('report_id');
            }
            
            if (Schema::hasColumn('messages', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
