<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if Cybercrime Division already exists
        $exists = DB::table('police_stations')
            ->where('station_name', 'Cybercrime Division')
            ->exists();

        if (!$exists) {
            // Insert Cybercrime Division station
            DB::table('police_stations')->insert([
                'station_name' => 'Cybercrime Division',
                'address' => 'Davao City Police Office - Cybercrime Division',
                'latitude' => 0,
                'longitude' => 0,
                'contact_number' => 'TBD',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            echo "✅ Cybercrime Division has been added to police_stations table\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove Cybercrime Division on rollback
        DB::table('police_stations')
            ->where('station_name', 'Cybercrime Division')
            ->delete();
    }
};
