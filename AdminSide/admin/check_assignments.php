<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Reports by Station ===\n\n";

$breakdown = DB::table('reports')
    ->select('assigned_station_id', DB::raw('COUNT(*) as count'))
    ->groupBy('assigned_station_id')
    ->orderBy('assigned_station_id')
    ->get();

foreach ($breakdown as $row) {
    if ($row->assigned_station_id) {
        $station = DB::table('police_stations')
            ->where('station_id', $row->assigned_station_id)
            ->first();
        echo "Station {$row->assigned_station_id} - {$station->station_name}: {$row->count} reports\n";
    } else {
        echo "Unassigned: {$row->count} reports\n";
    }
}

echo "\n=== PS2 Specifically ===\n";
$ps2Count = DB::table('reports')->where('assigned_station_id', 2)->count();
echo "PS2 has {$ps2Count} assigned reports\n";

echo "\n=== PS3 Specifically ===\n";
$ps3Count = DB::table('reports')->where('assigned_station_id', 3)->count();
echo "PS3 has {$ps3Count} assigned reports\n";
