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
            // Add id_selfie column if it doesn't exist
            if (!Schema::hasColumn('verifications', 'id_selfie')) {
                $table->string('id_selfie', 255)->nullable()->after('status')->comment('Path to uploaded selfie with ID');
            }
            
            // Add billing_document column if it doesn't exist
            if (!Schema::hasColumn('verifications', 'billing_document')) {
                $table->string('billing_document', 255)->nullable()->after('id_selfie')->comment('Path to uploaded proof of billing');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            if (Schema::hasColumn('verifications', 'id_selfie')) {
                $table->dropColumn('id_selfie');
            }
            if (Schema::hasColumn('verifications', 'billing_document')) {
                $table->dropColumn('billing_document');
            }
        });
    }
};
