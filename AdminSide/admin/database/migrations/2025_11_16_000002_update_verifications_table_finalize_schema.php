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
            // Ensure all required columns exist with correct properties
            if (!Schema::hasColumn('verifications', 'id_picture')) {
                $table->string('id_picture', 255)->nullable()->after('status')->comment('Path to upload ID picture');
            }
            
            if (!Schema::hasColumn('verifications', 'id_selfie')) {
                $table->string('id_selfie', 255)->nullable()->after('id_picture')->comment('Path to uploaded selfie with ID');
            }
            
            if (!Schema::hasColumn('verifications', 'billing_document')) {
                $table->string('billing_document', 255)->nullable()->after('id_selfie')->comment('Path to uploaded proof of billing');
            }
            
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
            // We generally don't want to drop these columns in a down migration
            // as they contain important data
        });
    }
};