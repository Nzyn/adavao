<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- Reports Table Schema ---\n";
$cols = DB::select('DESCRIBE reports');
foreach ($cols as $c) {
    echo "{$c->Field} | {$c->Type} | {$c->Null} | {$c->Key}\n";
}
