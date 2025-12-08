<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- Testing Eager Loading for User 34 ---\n";
$users = \App\Models\UserAdmin::where('id', 34)->with('policeStation')->get();

foreach ($users as $u) {
    if ($u->relationLoaded('policeStation')) {
        echo "Relation 'policeStation' LOADED.\n";
        echo "Station Name: " . ($u->policeStation ? $u->policeStation->station_name : 'NULL') . "\n";
    } else {
        echo "Relation 'policeStation' NOT LOADED.\n";
    }
}
