<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PS2 Barangay Polygon Check ===\n\n";

$ps2Barangays = DB::table('barangays')
    ->where('station_id', 2)
    ->get(['barangay_id', 'barangay_name', 'boundary_polygon']);

$withPolygon = 0;
$withoutPolygon = 0;

foreach ($ps2Barangays as $b) {
    if ($b->boundary_polygon) {
        $withPolygon++;
        echo "✓ {$b->barangay_name} (ID: {$b->barangay_id}) - HAS polygon\n";
    } else {
        $withoutPolygon++;
        echo "✗ {$b->barangay_name} (ID: {$b->barangay_id}) - NO polygon\n";
    }
}

echo "\n=== Summary ===\n";
echo "Total PS2 barangays: " . $ps2Barangays->count() . "\n";
echo "With polygons: {$withPolygon}\n";
echo "Without polygons: {$withoutPolygon}\n";

if ($withPolygon == 0) {
    echo "\n⚠️  WARNING: No PS2 barangays have polygon data!\n";
    echo "This is why no reports are being assigned to PS2.\n";
}
