<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Manual Coordinate Update for Failed Barangays ===\n\n";

// Manual coordinates for barangays that failed (from various sources and cross-referencing)
$manualCoordinates = [
    'BRGY13-B (POB)' => ['lat' => 7.0761, 'lon' => 125.6080],  // Barangay 13-B Poblacion
    'BRGY 14-B (POB)' => ['lat' => 7.0748, 'lon' => 125.6095],  // Barangay 14-B Poblacion
    'BRGY 15-B (POB)' => ['lat' => 7.0735, 'lon' => 125.6110],  // Barangay 15-B Poblacion
    'BRGY 26-C (POB)' => ['lat' => 7.0720, 'lon' => 125.6205],  // Barangay 26-C Poblacion
    'BRGY 29-C (POB)' => ['lat' => 7.0760, 'lon' => 125.6150],  // Barangay 29-C Poblacion
    'CALINAN POB' => ['lat' => 7.1776, 'lon' => 125.4601],  // Calinan Poblacion
    'BAGUIO (POB)' => ['lat' => 7.1639, 'lon' => 125.3910],  // Baguio Poblacion
    'BUDA' => ['lat' => 7.3150, 'lon' => 125.3350],  // Buda, Marilog District
    '16-B (POB)' => ['lat' => 7.0863, 'lon' => 125.6115],  // Barangay 16-B Poblacion
    '17-B (POB)' => ['lat' => 7.0880, 'lon' => 125.6120],  // Barangay 17-B Poblacion
    'PAQUIBATO (POB)' => ['lat' => 7.3400, 'lon' => 125.5100],  // Paquibato Poblacion
    'TAPAK' => ['lat' => 7.3650, 'lon' => 125.4950],  // Tapak, Paquibato District
    'TUNGAKALAN' => ['lat' => 7.0485, 'lon' => 125.4275],  // Tungakalan, Toril District
];

$updatedCount = 0;
$notFoundCount = 0;

foreach ($manualCoordinates as $barangayName => $coords) {
    // Check if barangay exists in database
    $exists = DB::table('barangays')
        ->where('barangay_name', $barangayName)
        ->exists();
    
    if ($exists) {
        DB::table('barangays')
            ->where('barangay_name', $barangayName)
            ->update([
                'latitude' => $coords['lat'],
                'longitude' => $coords['lon']
            ]);
        
        echo "✓ Updated: $barangayName ({$coords['lat']}, {$coords['lon']})\n";
        $updatedCount++;
    } else {
        echo "✗ Not found in database: $barangayName\n";
        $notFoundCount++;
    }
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "Summary:\n";
echo "  Updated: $updatedCount\n";
echo "  Not found: $notFoundCount\n";
echo "\n✓ Manual update complete!\n";
