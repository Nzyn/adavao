<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- Table: roles ---\n";
$roles = \DB::table('roles')->get();
foreach ($roles as $r) {
    // Handling different PK names
    $id = $r->role_id ?? $r->id;
    echo "ID: $id | Name: {$r->role_name}\n";
}

echo "\n--- Table: admin_roles ---\n";
$roles2 = \DB::table('admin_roles')->get();
foreach ($roles2 as $r) {
    $id = $r->role_id ?? $r->id ?? 'Unknown';
    $name = $r->role_name ?? $r->name ?? 'Unknown';
    echo "ID: $id | Name: $name\n";
}
