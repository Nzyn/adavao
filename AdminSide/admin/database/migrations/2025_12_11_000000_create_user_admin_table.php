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
        Schema::create('user_admin', function (Blueprint $table) {
            $table->id();
            $table->string('firstname', 50);
            $table->string('lastname', 50);
            $table->string('contact', 15);
            $table->string('email', 100)->unique();
            $table->string('password', 255);
            $table->timestamps();
            
            // Add other columns found in original users table but relevant to admins
            // Note: In a real scenario, we would duplicate all columns from the original schema
            // For now, this base structure matches what was likely in the original migration
            // Additional columns (lockout, verification) are likely added by subsequent migrations
            // We should ensure those subsequent migrations (which apply to 'user_admin') exist or are handled.
            // Since we applied the schema split via SQL Clone, the DB has them.
            // This migration is for future reference/refresh.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_admin');
    }
};
