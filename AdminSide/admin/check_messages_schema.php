<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- Messages Table Columns ---\n";
$cols = DB::select('DESCRIBE messages');
foreach ($cols as $c) {
    echo "{$c->Field} | {$c->Type}\n";
}
