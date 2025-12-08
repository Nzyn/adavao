<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\PoliceStation;
use Illuminate\Support\Facades\DB;

echo "=== Testing Change Role Function ===\n\n";

// Check if role column exists
$columnExists = DB::getSchemaBuilder()->hasColumn('users', 'role');
echo "1. Role column exists: " . ($columnExists ? "YES\n" : "NO\n");

// Get a test user
$user = User::first();
if (!$user) {
    echo "2. No users in database!\n";
    exit(1);
}

echo "2. Test user found: " . $user->email . "\n";
echo "   Current role: " . ($user->role ?? 'null') . "\n";
echo "   Current station_id: " . ($user->station_id ?? 'null') . "\n";

// Check police station exists
$station = PoliceStation::first();
echo "3. Police station exists: " . ($station ? "YES (ID: {$station->station_id})" : "NO") . "\n";

// Test updating role
try {
    $user->role = 'police';
    $user->save();
    
    // Reload from DB
    $user->refresh();
    
    echo "4. Updated role to 'police': " . $user->role . "\n";
    echo "   ✅ Change role works!\n";
} catch (\Exception $e) {
    echo "4. ❌ Error updating role: " . $e->getMessage() . "\n";
}

// Test changing back
try {
    $user->role = 'user';
    $user->save();
    
    $user->refresh();
    
    echo "5. Updated role back to 'user': " . $user->role . "\n";
    echo "   ✅ Works both ways!\n";
} catch (\Exception $e) {
    echo "5. ❌ Error updating role: " . $e->getMessage() . "\n";
}
