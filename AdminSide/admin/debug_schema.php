<?php

use Illuminate\Support\Facades\Schema;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "BARANGAYS:\n";
foreach(Schema::getColumnListing('barangays') as $c) { echo " - $c\n"; }

echo "LOCATIONS:\n";
foreach(Schema::getColumnListing('locations') as $c) { echo " - $c\n"; }

echo "\nREPORTS:\n";
foreach(Schema::getColumnListing('reports') as $c) { echo " - $c\n"; }
