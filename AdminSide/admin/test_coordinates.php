<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;

// Load cached coordinates
$cacheFile = storage_path('app/barangay_coordinates.json');
if (file_exists($cacheFile)) {
    $cached = json_decode(file_get_contents($cacheFile), true);
    if (!empty($cached['barangays'])) {
        echo "✓ Loaded " . count($cached['barangays']) . " barangays\n";
        echo "\nSample coordinates:\n";
        foreach (array_slice($cached['barangays'], 0, 5) as $brgy) {
            echo "  {$brgy['name']}: {$brgy['latitude']}, {$brgy['longitude']}\n";
        }
        
        // Check if mapping works
        echo "\nChecking name variations:\n";
        $testNames = [
            'BAGO APLAYA',
            'BAGO APLAYA (POB.)',
            'BUNAWAN',
            'BUNAWAN (POB.)',
        ];
        
        foreach ($testNames as $name) {
            $found = false;
            foreach ($cached['barangays'] as $brgy) {
                if (strpos($name, $brgy['name']) !== false || strpos($brgy['name'], str_replace(' (POB.)', '', $name)) !== false) {
                    echo "  ✓ '$name' → {$brgy['name']} ({$brgy['latitude']}, {$brgy['longitude']})\n";
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                echo "  ⊘ '$name' → Not found\n";
            }
        }
    }
} else {
    echo "❌ Cache file not found: $cacheFile\n";
}
