<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PS3 Talomo Analysis ===\n\n";

// PS3 basic info
$ps3 = DB::table('police_stations')->where('station_id', 3)->first();
echo "Station: {$ps3->station_name}\n";
echo "Station ID: {$ps3->station_id}\n\n";

// Barangay coverage
$totalBarangays = DB::table('barangays')->where('station_id', 3)->count();
$withPolygons = DB::table('barangays')
    ->where('station_id', 3)
    ->whereNotNull('boundary_polygon')
    ->count();

echo "=== Barangay Coverage ===\n";
echo "Total barangays: {$totalBarangays}\n";
echo "With polygons: {$withPolygons}\n";
echo "Without polygons: " . ($totalBarangays - $withPolygons) . "\n";
if ($totalBarangays > 0) {
    echo "Coverage: " . round(($withPolygons / $totalBarangays) * 100, 1) . "%\n";
}
echo "\n";

// Reports assigned
$assignedReports = DB::table('reports')->where('assigned_station_id', 3)->count();
echo "=== Reports ===\n";
echo "Reports assigned to PS3: {$assignedReports}\n\n";

// List barangays with polygons
echo "=== PS3 Barangays WITH Polygons ===\n";
$ps3BarangaysWithPolygons = DB::table('barangays')
    ->where('station_id', 3)
    ->whereNotNull('boundary_polygon')
    ->get(['barangay_id', 'barangay_name']);

foreach ($ps3BarangaysWithPolygons as $b) {
    echo "✓ {$b->barangay_name} (ID: {$b->barangay_id})\n";
}

echo "\n=== Summary ===\n";
echo "PS3 has {$withPolygons} out of {$totalBarangays} barangays with polygon data\n";
echo "PS3 has {$assignedReports} reports assigned\n";
