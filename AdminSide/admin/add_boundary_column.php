<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "Adding boundary_polygon column to police_stations...\n";
    DB::statement('ALTER TABLE police_stations ADD COLUMN boundary_polygon TEXT NULL');
    echo "✓ Column added successfully!\n";
} catch (\Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "✓ Column already exists!\n";
    } else {
        echo "✗ Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}
