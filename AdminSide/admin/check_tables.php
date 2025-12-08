<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tables = ['roles', 'admin_roles'];
foreach ($tables as $t) {
    try {
        $count = \DB::table($t)->count();
        echo "Table '$t' EXISTS. Count: $count\n";
    } catch (\Exception $e) {
        echo "Table '$t' DOES NOT EXIST.\n";
    }
}
