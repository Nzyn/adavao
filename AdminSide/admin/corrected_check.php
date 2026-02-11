<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CORRECTED Analysis ===\n\n";

// PS2
echo "=== PS2 San Pedro ===\n";
$ps2Total = DB::table('barangays')->where('station_id', 2)->count();
$ps2WithPolygons = DB::table('barangays')
    ->where('station_id', 2)
    ->whereNotNull('boundary_polygon')
    ->where('boundary_polygon', '!=', '')
    ->where('boundary_polygon', '!=', 'NULL')
    ->count();
$ps2Reports = DB::table('reports')->where('assigned_station_id', 2)->count();

echo "Total barangays: {$ps2Total}\n";
echo "With polygons: {$ps2WithPolygons}\n";
echo "Coverage: " . round(($ps2WithPolygons / $ps2Total) * 100, 1) . "%\n";
echo "Reports assigned: {$ps2Reports}\n\n";

// PS3
echo "=== PS3 Talomo ===\n";
$ps3Total = DB::table('barangays')->where('station_id', 3)->count();
$ps3WithPolygons = DB::table('barangays')
    ->where('station_id', 3)
    ->whereNotNull('boundary_polygon')
    ->where('boundary_polygon', '!=', '')
    ->where('boundary_polygon', '!=', 'NULL')
    ->count();
$ps3Reports = DB::table('reports')->where('assigned_station_id', 3)->count();

echo "Total barangays: {$ps3Total}\n";
echo "With polygons: {$ps3WithPolygons}\n";
echo "Coverage: " . round(($ps3WithPolygons / $ps3Total) * 100, 1) . "%\n";
echo "Reports assigned: {$ps3Reports}\n\n";

// List some PS2 barangays with polygons
echo "=== Sample PS2 Barangays with Polygons ===\n";
$ps2Sample = DB::table('barangays')
    ->where('station_id', 2)
    ->whereNotNull('boundary_polygon')
    ->where('boundary_polygon', '!=', '')
    ->limit(10)
    ->get(['barangay_id', 'barangay_name']);

foreach ($ps2Sample as $b) {
    echo "✓ {$b->barangay_name} (ID: {$b->barangay_id})\n";
}

echo "\n=== Why PS2 has 0 reports? ===\n";
echo "PS2 has {$ps2WithPolygons} barangays with polygon data\n";
echo "But 0 reports assigned.\n";
echo "This suggests the auto-assignment script may have had errors,\n";
echo "or the existing reports don't fall within PS2's barangay polygons.\n";
