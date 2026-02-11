<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "--- Current UserAdmin Role Assignments ---\n\n";
$users = \App\Models\UserAdmin::with('adminRoles')->get();

foreach ($users as $u) {
    echo "ID: {$u->id} | Email: {$u->email}\n";
    if ($u->adminRoles->count() > 0) {
        foreach ($u->adminRoles as $role) {
            echo "  → Role: {$role->role_name}\n";
        }
    } else {
        echo "  → NO ROLES ASSIGNED\n";
    }
    echo "\n";
}
