<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Deleting user: ps3@mailsac.com\n\n";

$user = DB::table('users_public')->where('email', 'ps3@mailsac.com')->first();

if ($user) {
    $role = $user->role ?? 'not set';
    echo "Found user:\n";
    echo "  ID: {$user->id}\n";
    echo "  Email: {$user->email}\n";
    echo "  Name: {$user->firstname} {$user->lastname}\n";
    echo "  Role: {$role}\n\n";
    
    DB::table('users_public')->where('email', 'ps3@mailsac.com')->delete();
    echo "✓ User deleted successfully!\n";
} else {
    echo "⚠ User not found\n";
}
