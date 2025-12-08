<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- user_admin_roles Columns ---\n";
$cols = \DB::select("DESCRIBE user_admin_roles");
foreach ($cols as $c) {
    echo "{$c->Field}\n";
}
