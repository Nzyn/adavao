<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check if 'status' column exists in reports table
$cols = DB::select('DESCRIBE reports');
$hasStatus = false;
foreach ($cols as $c) {
    if ($c->Field === 'status') {
        $hasStatus = true;
        echo "Found 'status' column\n";
    }
}

if (!$hasStatus) {
    echo "ERROR: 'status' column not found in reports table\n";
    echo "Available columns:\n";
    foreach ($cols as $c) {
        echo "  - {$c->Field}\n";
    }
}
