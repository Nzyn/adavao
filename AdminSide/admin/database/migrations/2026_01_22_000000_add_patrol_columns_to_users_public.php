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
        Schema::table('users_public', function (Blueprint $table) {
            // Check if column exists before adding it to avoid errors
            if (!Schema::hasColumn('users_public', 'user_role')) {
                $table->string('user_role')->default('user')->after('phone_number');
            }
            if (!Schema::hasColumn('users_public', 'is_on_duty')) {
                $table->boolean('is_on_duty')->default(false)->after('user_role');
            }
            if (!Schema::hasColumn('users_public', 'push_token')) {
                $table->text('push_token')->nullable()->after('is_on_duty');
            }
            if (!Schema::hasColumn('users_public', 'assigned_station_id')) {
                $table->unsignedBigInteger('assigned_station_id')->nullable()->after('push_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_public', function (Blueprint $table) {
            if (Schema::hasColumn('users_public', 'user_role')) {
                $table->dropColumn('user_role');
            }
            if (Schema::hasColumn('users_public', 'is_on_duty')) {
                $table->dropColumn('is_on_duty');
            }
            if (Schema::hasColumn('users_public', 'push_token')) {
                $table->dropColumn('push_token');
            }
            if (Schema::hasColumn('users_public', 'assigned_station_id')) {
                $table->dropColumn('assigned_station_id');
            }
        });
    }
};
