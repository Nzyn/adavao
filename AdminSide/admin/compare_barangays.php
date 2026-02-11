<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Read CSV file
$csvPath = 'D:\Codes\alertdavao\alertdavao\LIST OF BARANGAYS 2024.csv';
$csvBarangays = [];

echo "=== Barangay Comparison Tool ===\n\n";

if (($handle = fopen($csvPath, "r")) !== FALSE) {
    // Skip header row
    fgetcsv($handle);
    
    while (($data = fgetcsv($handle)) !== FALSE) {
        // Barangay name is in column index 2 (3rd column)
        if (isset($data[2]) && !empty(trim($data[2]))) {
            $csvBarangays[] = trim($data[2]);
        }
    }
    fclose($handle);
}

echo "Read " . count($csvBarangays) . " barangays from CSV file\n";

// Get all barangays from database
$dbBarangays = DB::table('barangays')
    ->pluck('barangay_name')
    ->toArray();

echo "Found " . count($dbBarangays) . " barangays in database\n\n";

// Function to normalize barangay names
function normalizeName($name) {
    $normalized = strtoupper(trim($name));
    $normalized = str_replace(['BRGY ', 'BARANGAY '], '', $normalized);
    $normalized = str_replace(['(POB)', '(POB.)', 'POB'], '', $normalized);
    return trim($normalized);
}

// Function to check similarity
function areSimilar($name1, $name2, $threshold = 0.85) {
    $norm1 = normalizeName($name1);
    $norm2 = normalizeName($name2);
    
    // Exact match
    if ($norm1 === $norm2) {
        return true;
    }
    
    // Calculate similarity
    similar_text($norm1, $norm2, $percent);
    return ($percent / 100) >= $threshold;
}

// Find unmatched barangays
$unmatched = [];
foreach ($dbBarangays as $dbBrgy) {
    $matched = false;
    foreach ($csvBarangays as $csvBrgy) {
        if (areSimilar($dbBrgy, $csvBrgy)) {
            $matched = true;
            break;
        }
    }
    
    if (!$matched) {
        $unmatched[] = $dbBrgy;
    }
}

if (empty($unmatched)) {
    echo "✓ All database barangays match CSV barangays. No deletions needed.\n";
    exit(0);
}

// Display unmatched barangays
echo count($unmatched) . " barangays in database do NOT match CSV:\n";
echo str_repeat("-", 60) . "\n";
foreach ($unmatched as $i => $brgy) {
    echo ($i + 1) . ". $brgy\n";
}

echo "\n" . str_repeat("=", 60) . "\n";
echo "Do you want to DELETE these barangays from the database? (yes/no): ";
$handle = fopen("php://stdin", "r");
$confirm = trim(fgets($handle));
fclose($handle);

if (strtolower($confirm) === 'yes' || strtolower($confirm) === 'y') {
    $deletedCount = 0;
    foreach ($unmatched as $brgy) {
        $deleted = DB::table('barangays')
            ->where('barangay_name', $brgy)
            ->delete();
        $deletedCount += $deleted;
    }
    
    echo "\nDeleted $deletedCount barangays from database\n";
    echo "✓ Cleanup complete!\n";
} else {
    echo "\nDeletion cancelled.\n";
}
