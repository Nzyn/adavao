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
            // Add id_picture column if it doesn't exist
            if (!Schema::hasColumn('verifications', 'id_picture')) {
                $table->string('id_picture', 255)->nullable()->after('status')->comment('Path to upload ID picture');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            if (Schema::hasColumn('verifications', 'id_picture')) {
                $table->dropColumn('id_picture');
            }
        });
    }
};