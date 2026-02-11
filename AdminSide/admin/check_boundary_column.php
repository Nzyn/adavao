<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cols = DB::select('DESCRIBE police_stations');
$hasBoundary = false;

foreach ($cols as $c) {
    if (stripos($c->Field, 'polygon') !== false || stripos($c->Field, 'boundary') !== false) {
        echo "Found: {$c->Field}\n";
        $hasBoundary = true;
    }
}

if (!$hasBoundary) {
    echo "NO boundary/polygon column found in police_stations table\n";
    echo "Need to add boundary_polygon column\n";
}
