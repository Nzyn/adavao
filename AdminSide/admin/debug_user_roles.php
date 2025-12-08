<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- UserAdmin Records ---\n";
$users = \App\Models\UserAdmin::with('adminRoles')->get();

echo "Total Users: " . $users->count() . "\n";

foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->firstname} {$u->lastname} | Email: {$u->email}\n";
    if ($u->adminRoles->count() > 0) {
        foreach ($u->adminRoles as $role) {
            echo "  - Role: {$role->role_name} (ID: {$role->role_id})\n";
        }
    } else {
        echo "  - NO ROLES ASSIGNED\n";
    }
    echo "------------------------\n";
}

echo "\n--- All Roles Available ---\n";
$roles = \App\Models\AdminRole::all();
foreach ($roles as $r) {
    echo "ID: {$r->role_id} | Name: {$r->role_name}\n";
}
