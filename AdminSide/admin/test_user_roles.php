<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Simulate being logged in as a police user
$user = \App\Models\UserAdmin::where('email', 'ps2@mailsac.com')->first();

if (!$user) {
    echo "User not found\n";
    exit(1);
}

echo "Testing as user: {$user->email}\n";
echo "User ID: {$user->id}\n";
echo "Station ID: {$user->station_id}\n";

// Check if hasRole method exists
echo "\nChecking hasRole method:\n";
if (method_exists($user, 'hasRole')) {
    echo "✓ hasRole method EXISTS\n";
    try {
        $isPolice = $user->hasRole('police');
        echo "✓ hasRole('police') = " . ($isPolice ? 'true' : 'false') . "\n";
    } catch (\Exception $e) {
        echo "✗ Error calling hasRole: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ hasRole method DOES NOT EXIST\n";
}

// Check role property
echo "\nChecking role property:\n";
if (isset($user->role)) {
    echo "✓ role property = {$user->role}\n";
} else {
    echo "✗ role property NOT SET\n";
}

// Try to get adminRoles
echo "\nChecking adminRoles relationship:\n";
try {
    $roles = $user->adminRoles;
    echo "✓ adminRoles loaded: " . $roles->count() . " roles\n";
    foreach ($roles as $role) {
        echo "  - {$role->role_name}\n";
    }
} catch (\Exception $e) {
    echo "✗ Error loading adminRoles: " . $e->getMessage() . "\n";
}
