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
        Schema::dropIfExists('flag_history');
        Schema::dropIfExists('notification_reads');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreating them if needed for rollback, though structure is lost.
        // Assuming simple structure for rollback sanity, or leaving empty for destructive.
        // Best practice: leave empty or basic recreation if critical.
        // Given these are dead tables, rollback is unlikely to be needed.
    }
};
