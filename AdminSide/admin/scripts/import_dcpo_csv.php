<?php
/**
 * Script to import DCPO_Data.csv crime records into reports database
 * and assign them to police stations based on barangay
 */

require __DIR__ . '/../../vendor/autoload.php';

$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Report;
use App\Models\Location;
use App\Models\User;

echo "📊 Starting DCPO CSV Data Import\n";
echo str_repeat("=", 70) . "\n\n";

// CSV file path
$csvPath = storage_path('app/DCPO_Data.csv');

if (!file_exists($csvPath)) {
    die("❌ Error: DCPO_Data.csv not found at: $csvPath\n");
}

echo "✅ Found CSV file\n";

// Get or create a system user for historical data
$systemUser = User::where('email', 'system@alertdavao.ph')->first();
if (!$systemUser) {
    echo "⚠️  Creating system user for historical data...\n";
    $systemUser = User::create([
        'firstname' => 'System',
        'lastname' => 'Historical Data',
        'username' => 'system_dcpo',
        'email' => 'system@alertdavao.ph',
        'password' => bcrypt('system_password_' . uniqid()),
        'role' => 'user',
        'phone_number' => '0000000000',
        'sex' => 'Other'
    ]);
    echo "✅ System user created (ID: {$systemUser->id})\n";
}

// Get barangay to station mappings
echo "\n📍 Loading barangay assignments...\n";
$barangays = DB::table('barangays')->get();
$barangayMap = [];
foreach ($barangays as $brgy) {
    $key = strtoupper(trim($brgy->barangay_name ?? ''));
    $barangayMap[$key] = [
        'id' => $brgy->id,
        'station_id' => $brgy->station_id,
        'latitude' => $brgy->latitude ?? 7.0731,
        'longitude' => $brgy->longitude ?? 125.6128
    ];
}
echo "✅ Loaded " . count($barangayMap) . " barangays\n";

// Open CSV file
$file = fopen($csvPath, 'r');
$headers = fgetcsv($file); // BARANGAY,CRIME_TYPE,YEAR,MONTH,DATE,YEAR_MONTH

echo "\n🔄 Processing CSV records...\n";
$imported = 0;
$assigned = 0;
$unassigned = 0;
$errors = 0;
$limit = 1000; // Import first 1000 records

while (($row = fgetcsv($file)) !== false && $imported < $limit) {
    try {
        if (count($row) < 5) continue;
        
        $barangay = trim($row[0]);
        $crimeType = trim($row[1]);
        $year = $row[2];
        $month = $row[3];
        $date = $row[4];
        
        // Clean barangay name (remove station info in parentheses)
        $barangay = preg_replace('/\s*\(.*?\)\s*/', '', $barangay);
        $barangay = strtoupper(trim($barangay));
        
        // Find matching barangay
        $barangayData = $barangayMap[$barangay] ?? null;
        $stationId = $barangayData['station_id'] ?? null;
        
        // Create location
        $location = Location::create([
            'latitude' => $barangayData['latitude'] ?? 7.0731,
            'longitude' => $barangayData['longitude'] ?? 125.6128,
            'barangay' => $barangay,
            'reporters_address' => 'DCPO Historical Data',
            'street_address' => $barangay
        ]);
        
        // Create report
        $report = Report::create([
            'user_id' => $systemUser->id,
            'location_id' => $location->location_id,
            'title' => $crimeType . ' - ' . $barangay,
            'description' => "Historical crime data from DCPO CSV. Crime Type: $crimeType, Year: $year, Month: $month",
            'report_type' => json_encode([$crimeType]),
            'date_reported' => $date,
            'created_at' => $date,
            'updated_at' => $date,
            'status' => 'recorded',
            'is_valid' => 'valid',
            'assigned_station_id' => $stationId
        ]);
        
        $imported++;
        if ($stationId) {
            $assigned++;
        } else {
            $unassigned++;
        }
        
        if ($imported % 100 == 0) {
            echo "  ✓ Processed $imported records...\n";
        }
        
    } catch (Exception $e) {
        $errors++;
        if ($errors <= 10) {
            echo "  ⚠️  Error on row $imported: " . $e->getMessage() . "\n";
        }
    }
}

fclose($file);

echo "\n" . str_repeat("=", 70) . "\n";
echo "📊 Import Complete!\n";
echo str_repeat("=", 70) . "\n";
echo "✅ Total imported:    $imported\n";
echo "🔵 Assigned to PS2/3: $assigned\n";
echo "🟡 Unassigned:        $unassigned\n";
echo "❌ Errors:            $errors\n";
echo "\n";

// Show station breakdown
echo "📈 Station Breakdown:\n";
$stationCounts = DB::table('reports')
    ->join('police_stations', 'reports.assigned_station_id', '=', 'police_stations.station_id')
    ->select('police_stations.station_name', DB::raw('COUNT(*) as count'))
    ->whereNotNull('reports.assigned_station_id')
    ->groupBy('police_stations.station_id', 'police_stations.station_name')
    ->orderBy('count', 'desc')
    ->get();

foreach ($stationCounts as $station) {
    echo "  • {$station->station_name}: {$station->count}\n";
}

$unassignedCount = DB::table('reports')->whereNull('assigned_station_id')->count();
echo "  • Unassigned: $unassignedCount\n";

echo "\n✅ Done!\n";
