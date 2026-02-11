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
        if (Schema::hasTable('pending_user_admin_registrations')) {
            return;
        }

        Schema::create('pending_user_admin_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('firstname', 50);
            $table->string('lastname', 50);
            $table->string('contact', 15);
            $table->string('email', 100)->unique();
            $table->string('password', 255);
            $table->string('user_role', 50)->default('police');
            $table->string('verification_token', 100)->unique();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pending_user_admin_registrations');
    }
};
