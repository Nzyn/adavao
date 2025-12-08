<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Location;
use Illuminate\Support\Facades\DB;

echo "--- COORDINATE ANALYSIS ---\n";

$minLat = Location::min('latitude');
$maxLat = Location::max('latitude');
$minLng = Location::min('longitude');
$maxLng = Location::max('longitude');

echo "Latitude Range: $minLat to $maxLat\n";
echo "Longitude Range: $minLng to $maxLng\n";

// Expected Davao: Lat 6.9-7.6, Lng 125.2-125.7
// Check for outliers
$outliers = Location::where('latitude', '<', 6.9)
    ->orWhere('latitude', '>', 7.8) // slightly loose
    ->orWhere('longitude', '<', 125.0)
    ->orWhere('longitude', '>', 126.0)
    ->count();

echo "Potential Outliers (outside Davao box): $outliers\n";

if ($outliers > 0) {
    echo "Sample Outliers:\n";
    $bad = Location::where('latitude', '<', 6.9)
    ->orWhere('latitude', '>', 7.8)
    ->orWhere('longitude', '<', 125.0)
    ->orWhere('longitude', '>', 126.0)
    ->limit(5)
    ->get();
    
    foreach ($bad as $b) {
        echo "ID: {$b->location_id} -> Lat: {$b->latitude}, Lng: {$b->longitude} ({$b->barangay})\n";
    }
}

echo "\n--- EASTERNMOST SAMPLES (Likely Water/Samal) ---\n";
$eastern = Location::orderBy('longitude', 'desc')->limit(5)->get();
foreach ($eastern as $s) {
    echo "{$s->barangay}: Lat {$s->latitude}, Lng {$s->longitude}\n";
}
