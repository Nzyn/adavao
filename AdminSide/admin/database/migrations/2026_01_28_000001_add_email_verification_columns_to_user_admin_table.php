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
        if (!Schema::hasTable('user_admin')) {
            return;
        }

        Schema::table('user_admin', function (Blueprint $table) {
            if (!Schema::hasColumn('user_admin', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable();
            }
            if (!Schema::hasColumn('user_admin', 'verification_token')) {
                $table->string('verification_token', 100)->nullable();
            }
            if (!Schema::hasColumn('user_admin', 'token_expires_at')) {
                $table->timestamp('token_expires_at')->nullable();
            }
            if (!Schema::hasColumn('user_admin', 'reset_token')) {
                $table->string('reset_token', 100)->nullable();
            }
            if (!Schema::hasColumn('user_admin', 'reset_token_expires_at')) {
                $table->timestamp('reset_token_expires_at')->nullable();
            }
            if (!Schema::hasColumn('user_admin', 'remember_token')) {
                $table->rememberToken();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('user_admin')) {
            return;
        }

        Schema::table('user_admin', function (Blueprint $table) {
            if (Schema::hasColumn('user_admin', 'email_verified_at')) {
                $table->dropColumn('email_verified_at');
            }
            if (Schema::hasColumn('user_admin', 'verification_token')) {
                $table->dropColumn('verification_token');
            }
            if (Schema::hasColumn('user_admin', 'token_expires_at')) {
                $table->dropColumn('token_expires_at');
            }
            if (Schema::hasColumn('user_admin', 'reset_token')) {
                $table->dropColumn('reset_token');
            }
            if (Schema::hasColumn('user_admin', 'reset_token_expires_at')) {
                $table->dropColumn('reset_token_expires_at');
            }
            if (Schema::hasColumn('user_admin', 'remember_token')) {
                $table->dropColumn('remember_token');
            }
        });
    }
};
