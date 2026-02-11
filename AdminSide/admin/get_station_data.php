<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get all columns from police_stations
$columns = DB::select("DESCRIBE police_stations");

echo "=== Police Stations Table Columns ===\n";
foreach ($columns as $col) {
    echo "{$col->Field} ({$col->Type})\n";
}

echo "\n=== PS2 Data ===\n";
$ps2 = DB::table('police_stations')->where('station_id', 2)->first();
if ($ps2) {
    foreach ($ps2 as $key => $value) {
        if ($value) {
            $display = is_string($value) && strlen($value) > 200 ? substr($value, 0, 200) . '...' : $value;
            echo "{$key}: {$display}\n";
        }
    }
}

echo "\n=== PS3 Data ===\n";
$ps3 = DB::table('police_stations')->where('station_id', 3)->first();
if ($ps3) {
    foreach ($ps3 as $key => $value) {
        if ($value) {
            $display = is_string($value) && strlen($value) > 200 ? substr($value, 0, 200) . '...' : $value;
            echo "{$key}: {$display}\n";
        }
    }
}
