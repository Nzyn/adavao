<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Check what the query returns
$barangayStats = DB::table('locations')
    ->select('barangay', DB::raw('COUNT(*) as total_crimes'))
    ->whereNotNull('barangay')
    ->where('barangay', '!=', '')
    ->groupBy('barangay')
    ->limit(10)
    ->get();

echo "Found " . $barangayStats->count() . " barangays:\n\n";
foreach ($barangayStats as $stat) {
    echo "  - {$stat->barangay}: {$stat->total_crimes} crimes\n";
}

// Check coordinates
$coordsPath = storage_path('app/barangay_coordinates.json');
if (file_exists($coordsPath)) {
    $coords = json_decode(file_get_contents($coordsPath), true);
    echo "\nCoordinates file has " . count($coords['barangays'] ?? []) . " barangays\n";
}
