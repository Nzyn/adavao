<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Barangay Table Structure ===\n";
$cols = DB::select('DESCRIBE barangays');
foreach ($cols as $c) {
    echo "{$c->Field} ({$c->Type})\n";
}

echo "\n=== Sample Barangays with Polygons ===\n";
$barangays = DB::table('barangays')
    ->whereNotNull('boundary_polygon')
    ->limit(5)
    ->get(['barangay_id', 'barangay_name', 'station_id']);

foreach ($barangays as $b) {
    echo "ID: {$b->barangay_id} | Name: {$b->barangay_name} | Station: {$b->station_id}\n";
}

echo "\n=== Barangays assigned to PS2 (station_id=2) ===\n";
$ps2Barangays = DB::table('barangays')->where('station_id', 2)->count();
echo "Count: {$ps2Barangays}\n";

echo "\n=== Barangays assigned to PS3 (station_id=3) ===\n";
$ps3Barangays = DB::table('barangays')->where('station_id', 3)->count();
echo "Count: {$ps3Barangays}\n";
