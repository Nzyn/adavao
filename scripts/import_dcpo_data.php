<?php

/**
 * Import DCPO Historical Crime Data (2,485 records)
 * Maps crimes to barangays with coordinates
 * Prepares data for statistics and crime hotspot visualization
 */

require __DIR__ . '/../AdminSide/admin/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../AdminSide/admin/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n" . str_repeat("=", 70) . "\n";
echo "DCPO Crime Data Import Tool\n";
echo "Importing historical crime data (2021-2025)\n";
echo str_repeat("=", 70) . "\n\n";

// Load CSV data
$csvPath = __DIR__ . '/../AdminSide/admin/storage/app/DCPO_Data.csv';
if (!file_exists($csvPath)) {
    die("❌ Error: DCPO_Data.csv not found at: $csvPath\n");
}

// Load barangay coordinates
$coordinatesPath = __DIR__ . '/../AdminSide/admin/storage/app/barangay_coordinates.json';
if (!file_exists($coordinatesPath)) {
    die("❌ Error: barangay_coordinates.json not found at: $coordinatesPath\n");
}

$coordinatesData = json_decode(file_get_contents($coordinatesPath), true);
$barangayCoords = [];

foreach ($coordinatesData['barangays'] as $brgy) {
    // Normalize barangay name for matching
    $normalized = strtoupper(trim($brgy['name']));
    $barangayCoords[$normalized] = [
        'latitude' => $brgy['latitude'],
        'longitude' => $brgy['longitude']
    ];
}

echo "✅ Loaded coordinates for " . count($barangayCoords) . " barangays\n\n";

// Get any user for historical imports (preferably ID 1 - admin)
$user = DB::table('users')->where('id', 1)->first();

if (!$user) {
    // If no user with ID 1, get the first user
    $user = DB::table('users')->orderBy('id')->first();
}

if (!$user) {
    die("❌ Error: No users found in database. Please create a user first.\n");
}

$userId = $user->id;
echo "✅ Using user ID: $userId for historical imports\n\n";

// Read CSV file
$csv = array_map('str_getcsv', file($csvPath));
$headers = array_shift($csv); // Remove header row

$imported = 0;
$skipped = 0;
$errors = [];

echo "📊 Processing " . count($csv) . " crime records...\n\n";

// Crime type mapping from DCPO to your system
$crimeTypeMap = [
    'THEFT' => 'Theft',
    'ROBBERY' => 'Robbery',
    'BURGLARY' => 'Burglary',
    'CARNAPPING' => 'Carnapping',
    'MURDER' => 'Murder',
    'HOMICIDE' => 'Homicide',
    'PHYSICAL INJURIES' => 'Physical Injury',
    'RAPE' => 'Rape',
    'FRAUD' => 'Fraud',
    'CYBER CRIME' => 'Cybercrime',
    'THREATS' => 'Threats',
    'DOMESTIC VIOLENCE' => 'Domestic Violence',
    'HARASSMENT' => 'Harassment',
    'SEXUAL ASSAULT' => 'Sexual Assault',
];

foreach ($csv as $index => $row) {
    try {
        if (count($row) < 6) {
            $skipped++;
            continue;
        }

        $barangay = strtoupper(trim($row[0]));
        $crimeType = strtoupper(trim($row[1]));
        $year = (int)$row[2];
        $month = (int)$row[3];
        $date = $row[4]; // YYYY-MM-DD format

        // Normalize barangay name (remove PS annotations)
        $barangayClean = preg_replace('/\s*\(.*?\)\s*/', '', $barangay);
        $barangayClean = trim($barangayClean);

        // Map crime type
        $mappedCrimeType = $crimeTypeMap[$crimeType] ?? 'Others';

        // Get coordinates for this barangay
        $coords = $barangayCoords[$barangayClean] ?? null;
        
        if (!$coords) {
            // Try fuzzy matching
            foreach ($barangayCoords as $name => $coord) {
                if (stripos($barangayClean, $name) !== false || stripos($name, $barangayClean) !== false) {
                    $coords = $coord;
                    break;
                }
            }
        }

        // Get or create location record
        $locationId = null;
        
        if ($coords) {
            $location = DB::table('locations')
                ->where('barangay', 'LIKE', "%$barangayClean%")
                ->first();
            
            if (!$location) {
                // Create new location
                $locationId = DB::table('locations')->insertGetId([
                    'barangay' => $barangayClean,
                    'latitude' => $coords['latitude'],
                    'longitude' => $coords['longitude'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $locationId = $location->location_id;
            }
        }

        // Create report title
        $title = "$mappedCrimeType incident in $barangayClean";

        // Insert report
        DB::table('reports')->insert([
            'user_id' => $userId,
            'title' => $title,
            'report_type' => json_encode([$mappedCrimeType]), // JSON field
            'location_id' => $locationId,
            'description' => "Historical DCPO crime record: $mappedCrimeType in $barangayClean",
            'status' => 'resolved', // Historical data marked as resolved
            'is_valid' => 'valid', // Historical DCPO data is pre-validated
            'date_reported' => $date, // Date when the crime was reported
            'created_at' => $date . ' 00:00:00',
            'updated_at' => $date . ' 00:00:00',
        ]);

        $imported++;

        if ($imported % 100 == 0) {
            echo "✓ Imported $imported records...\n";
        }

    } catch (Exception $e) {
        $skipped++;
        $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
        
        if (count($errors) <= 10) { // Only show first 10 errors
            echo "⚠ Error on row " . ($index + 2) . ": " . $e->getMessage() . "\n";
        }
    }
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "Import Complete!\n";
echo str_repeat("=", 70) . "\n";
echo "✅ Successfully imported: $imported records\n";
echo "⚠️  Skipped: $skipped records\n";

if (count($errors) > 10) {
    echo "⚠️  Total errors: " . count($errors) . " (showing first 10)\n";
}

// Show statistics
echo "\n📊 Database Statistics:\n";
echo str_repeat("-", 70) . "\n";

$totalReports = DB::table('reports')->count();
$validReports = DB::table('reports')->where('is_valid', 'valid')->count();
$totalLocations = DB::table('locations')->count();

echo "Total reports in database: $totalReports\n";
echo "Valid reports: $validReports\n";
echo "Total locations: $totalLocations\n";

// Crime type breakdown
echo "\n📈 Crime Type Distribution:\n";
echo str_repeat("-", 70) . "\n";

$crimeStats = DB::table('reports')
    ->select('report_type', DB::raw('COUNT(*) as count'))
    ->groupBy('report_type')
    ->orderBy('count', 'desc')
    ->get();

foreach ($crimeStats as $stat) {
    // Parse JSON to get readable crime type
    $types = json_decode($stat->report_type, true);
    $crimeType = is_array($types) && count($types) > 0 ? $types[0] : 'Unknown';
    $percentage = ($stat->count / $totalReports) * 100;
    printf("%-25s: %5d (%5.1f%%)\n", $crimeType, $stat->count, $percentage);
}

// Top 10 barangays by crime count
echo "\n🗺️  Top 10 Crime Hotspots:\n";
echo str_repeat("-", 70) . "\n";

$hotspots = DB::table('reports')
    ->join('locations', 'reports.location_id', '=', 'locations.location_id')
    ->select('locations.barangay', DB::raw('COUNT(*) as crime_count'))
    ->groupBy('locations.barangay')
    ->orderBy('crime_count', 'desc')
    ->limit(10)
    ->get();

$rank = 1;
foreach ($hotspots as $spot) {
    printf("#%2d %-40s: %4d crimes\n", $rank++, $spot->barangay, $spot->crime_count);
}

echo "\n" . str_repeat("=", 70) . "\n";
echo "✅ Import completed successfully!\n";
echo "📍 Reports are now mapped to barangays with coordinates\n";
echo "📊 Statistics page will now show historical data\n";
echo "🗺️  Crime hotspot map is ready to use\n";
echo str_repeat("=", 70) . "\n\n";
