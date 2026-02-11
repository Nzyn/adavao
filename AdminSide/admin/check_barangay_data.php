<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Location;
use App\Models\CrimeReport;

// Check locations with barangay
$totalLocations = Location::count();
$locationsWithBarangay = Location::whereNotNull('barangay')->count();

echo "Total locations: $totalLocations\n";
echo "Locations with barangay: $locationsWithBarangay\n\n";

// Sample barangays
$barangays = Location::whereNotNull('barangay')
    ->select('barangay')
    ->distinct()
    ->orderBy('barangay')
    ->limit(20)
    ->pluck('barangay');

echo "Sample barangays:\n";
foreach ($barangays as $b) {
    echo "  - $b\n";
}

// Check crime reports
$totalReports = CrimeReport::count();
$reportsWithLocation = CrimeReport::whereNotNull('location_id')->count();

echo "\nTotal crime reports: $totalReports\n";
echo "Reports with location: $reportsWithLocation\n";

// Check if barangay_coordinates.json exists
$coordsPath = storage_path('app/barangay_coordinates.json');
echo "\nbarangay_coordinates.json exists: " . (file_exists($coordsPath) ? 'YES' : 'NO') . "\n";
if (file_exists($coordsPath)) {
    $coords = json_decode(file_get_contents($coordsPath), true);
    echo "Coordinates in file: " . count($coords['barangays'] ?? []) . "\n";
}
