<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$id = 34; // The ID mentioned in context
$public = \App\Models\User::find($id);
$admin = \App\Models\UserAdmin::find($id);

echo "Checking ID: $id\n";
echo "Public User: " . ($public ? "FOUND ({$public->email}, role: {$public->role})" : "NOT FOUND") . "\n";
echo "Admin User: " . ($admin ? "FOUND ({$admin->email}, Station: {$admin->station_id})" : "NOT FOUND") . "\n";

if ($public && $admin) {
    echo "COLLISION DETECTED.\n";
}
