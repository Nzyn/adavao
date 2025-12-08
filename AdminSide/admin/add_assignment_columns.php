<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Adding assignment columns to reports table...\n";

try {
    // Check if columns already exist
    $cols = DB::select('DESCRIBE reports');
    $hasAssignedStation = false;
    foreach ($cols as $c) {
        if ($c->Field === 'assigned_station_id') {
            $hasAssignedStation = true;
            break;
        }
    }
    
    if ($hasAssignedStation) {
        echo "Columns already exist!\n";
        exit(0);
    }
    
    // Add columns
    DB::statement('ALTER TABLE reports ADD COLUMN assigned_station_id BIGINT UNSIGNED NULL');
    echo "✓ Added assigned_station_id\n";
    
    DB::statement('ALTER TABLE reports ADD COLUMN assigned_by BIGINT UNSIGNED NULL');
    echo "✓ Added assigned_by\n";
    
    DB::statement('ALTER TABLE reports ADD COLUMN assigned_at TIMESTAMP NULL');
    echo "✓ Added assigned_at\n";
    
    // Add foreign keys
    DB::statement('ALTER TABLE reports ADD FOREIGN KEY (assigned_station_id) REFERENCES police_stations(station_id) ON DELETE SET NULL');
    echo "✓ Added FK for assigned_station_id\n";
    
    DB::statement('ALTER TABLE reports ADD FOREIGN KEY (assigned_by) REFERENCES user_admin(id) ON DELETE SET NULL');
    echo "✓ Added FK for assigned_by\n";
    
    echo "\nSUCCESS: All columns added!\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
