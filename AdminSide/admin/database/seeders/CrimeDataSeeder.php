<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Report;
use App\Models\Location;
use App\Models\User;
use App\Models\Barangay;
use App\Models\PoliceStation;
use Carbon\Carbon;

class CrimeDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Absolute path to CSV
        $csvPath = 'c:\Users\miyatot\Desktop\SarryMax-main\data\clean_davao_crime_5years.csv';
        $this->command->info("Reading CSV from: $csvPath");

        if (!file_exists($csvPath)) {
            $this->command->error("CSV file not found at $csvPath");
            return;
        }

        // Disable constraints for clean slate
        Schema::disableForeignKeyConstraints();
        Report::truncate();
        Location::truncate();
        DB::table('report_media')->truncate();
        Schema::enableForeignKeyConstraints();

        $file = fopen($csvPath, 'r');
        $headers = fgetcsv($file); // Skip header

        // Find or create a dummy user
        $user = User::first();
        if (!$user) {
            $user = User::create([
                'firstname' => 'Historical',
                'lastname' => 'Data',
                'email' => 'historical@example.com',
                'password' => bcrypt('password'),
                'role' => 'user', 
                'station_id' => null,
            ]);
        }
        $userId = $user->id;

        $batchCount = 0;
        $totalImported = 0;
        
        // Cache stations
        $stations = PoliceStation::all();

        $this->command->info("Processing CSV data...");

        while (($row = fgetcsv($file)) !== false) {
            try {
                // Ensure row has enough columns
                if (count($row) < 7) continue;

                $date = $row[1];
                $rawBarangayName = trim($row[2]);
                $crimeType = trim($row[3]);
                $count = (int)$row[4];
                $lat = (float)$row[5];
                $lng = (float)$row[6];

                // 1. EXTRACT STATION ID
                $stationId = null;
                $cleanBarangayName = $rawBarangayName;

                if (preg_match('/(?:UNDER\s+(?:PS|ps)\s*(\d+))/i', $rawBarangayName, $matches)) {
                    $stationNumber = $matches[1];
                    
                    // Match by text or ID
                    $station = $stations->filter(function($s) use ($stationNumber) {
                        return str_contains(strtolower($s->station_name), "station $stationNumber") || 
                               str_contains(strtolower($s->station_name), "ps $stationNumber") ||
                               $s->station_id == $stationNumber;
                    })->first();

                    if ($station) {
                        $stationId = $station->station_id;
                    }

                    // Clean name
                    $cleanBarangayName = trim(preg_replace('/\s*\(.*?\)/', '', $rawBarangayName));
                }

                // 2. CREATE/UPDATE BARANGAY
                // Using firstOrCreate/updateOrCreate logic
                if ($cleanBarangayName) {
                    $barangay = Barangay::where('barangay_name', $cleanBarangayName)->first();
                    if ($barangay) {
                        // Update station/coords if needed
                        $needsSave = false;
                        if ($stationId && !$barangay->station_id) {
                            $barangay->station_id = $stationId;
                            $needsSave = true;
                        } elseif ($barangay->station_id && !$stationId) {
                            $stationId = $barangay->station_id; // Inherit from existing
                        }
                        
                        if ($barangay->latitude == 0) {
                            $barangay->latitude = $lat;
                            $barangay->longitude = $lng;
                            $needsSave = true;
                        }

                        if ($needsSave) $barangay->save();
                    } else {
                        // Create new
                        $barangay = Barangay::create([
                            'barangay_name' => $cleanBarangayName,
                            'station_id' => $stationId,
                            'latitude' => $lat,
                            'longitude' => $lng
                        ]);
                    }
                }

                // 3. CREATE REPORTS (Expand Count)
                for ($i = 0; $i < $count; $i++) {
                    $incidentTime = Carbon::parse($date)->addHours(rand(0, 23))->addMinutes(rand(0, 59));
                    
                    $jitterLat = $lat + (rand(-50, 50) / 100000); 
                    $jitterLng = $lng + (rand(-50, 50) / 100000);

                    // Insert Location - Using reporters_address based on debug script
                    $locationId = DB::table('locations')->insertGetId([
                        'latitude' => $jitterLat,
                        'longitude' => $jitterLng,
                        'barangay' => $cleanBarangayName, 
                        'reporters_address' => $cleanBarangayName . ', Davao City',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Insert Report
                    DB::table('reports')->insert([
                        'user_id' => $userId,
                        'location_id' => $locationId,
                        'title' => "$crimeType Incident in $cleanBarangayName",
                        'description' => "Historical record of $crimeType imported from database.",
                        'report_type' => json_encode([$crimeType]), 
                        'date_reported' => $incidentTime,
                        'status' => 'resolved',
                        'is_valid' => 'valid',
                        'is_anonymous' => 0,
                        'assigned_station_id' => $stationId, // Validated or null
                        'created_at' => $incidentTime,
                        'updated_at' => now(),
                    ]);

                    $totalImported++;
                }

                $batchCount++;
                if ($batchCount % 100 == 0) {
                    $this->command->info("Processed $batchCount row(s)... ($totalImported reports)");
                }

            } catch (\Exception $e) {
                $errorMsg = "Row Error: " . $e->getMessage();
                file_put_contents('seeder_log.txt', $errorMsg . PHP_EOL, FILE_APPEND);
                $this->command->error($errorMsg);
                die(); // Stop immediately
            }
        } // End While

        $this->command->info("Done! Total reports imported: $totalImported");
    }
}
