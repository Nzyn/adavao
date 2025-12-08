<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- Police Stations ---\n";
$stations = \App\Models\PoliceStation::all();
foreach ($stations as $s) {
    echo "ID: {$s->station_id} | Name: {$s->station_name}\n";
}

echo "\n--- Updating User 34 ---\n";
$user = \App\Models\UserAdmin::find(34);
if (!$user) {
    die("User 34 not found.\n");
}

echo "Current Station: " . ($user->station_id ?? 'NULL') . "\n";

// Find a different station
$newStationId = ($user->station_id == 1) ? 2 : 1; // Swap between 1 and 2
$newStation = \App\Models\PoliceStation::where('station_id', $newStationId)->first();

if (!$newStation) {
    die("Station $newStationId not found (cannot swap).\n");
}

echo "Assigning to Station: {$newStation->station_id} ({$newStation->station_name})\n";

$user->station_id = $newStation->station_id;
$user->save();

// Re-fetch to confirm persistence
$userFresh = \App\Models\UserAdmin::find(34);
echo "New Station (from DB): " . ($userFresh->station_id ?? 'NULL') . "\n";

if ($userFresh->station_id == $newStation->station_id) {
    echo "SUCCESS: Database update persisted.\n";
} else {
    echo "FAILURE: Database update did not persist.\n";
}
