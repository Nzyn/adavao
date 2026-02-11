<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== REPORT ASSIGNMENT BREAKDOWN ===\n\n";

$stations = DB::table('reports')
    ->join('police_stations', 'reports.assigned_station_id', '=', 'police_stations.station_id')
    ->select('police_stations.station_name', 'police_stations.station_id', DB::raw('COUNT(*) as report_count'))
    ->groupBy('police_stations.station_id', 'police_stations.station_name')
    ->orderBy('report_count', 'DESC')
    ->get();

foreach ($stations as $station) {
    printf("%-40s | Station ID: %2d | Reports: %4d\n", $station->station_name, $station->station_id, $station->report_count);
}

echo "\nTotal Assigned: " . $stations->sum('report_count') . "\n";

$unassigned = DB::table('reports')->whereNull('assigned_station_id')->count();
echo "Unassigned: " . $unassigned . "\n";
