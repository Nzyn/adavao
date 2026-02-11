<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== PS3 User Role Check ===\n\n";

$user = \App\Models\UserAdmin::where('email', 'ps3@mailsac.com')->first();

if ($user) {
    echo "User: {$user->email}\n";
    echo "Station ID: {$user->station_id}\n\n";
    
    // Check roles
    echo "Roles:\n";
    $roles = $user->adminRoles;
    foreach ($roles as $role) {
        echo "  - {$role->role_name}\n";
    }
    
    echo "\n";
    
    // Test hasRole method
    if (method_exists($user, 'hasRole')) {
        echo "hasRole('police'): " . ($user->hasRole('police') ? 'TRUE' : 'FALSE') . "\n";
        echo "hasRole('admin'): " . ($user->hasRole('admin') ? 'TRUE' : 'FALSE') . "\n";
        echo "hasRole('super_admin'): " . ($user->hasRole('super_admin') ? 'TRUE' : 'FALSE') . "\n";
    }
    
    echo "\n=== Issue ===\n";
    echo "If user has BOTH 'admin' and 'police' roles,\n";
    echo "the dashboard should prioritize 'police' role.\n";
    echo "Check DashboardController to ensure police role takes precedence.\n";
}
