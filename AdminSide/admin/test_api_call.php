<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\UserController;

$controller = new UserController();

// Simulate a request
$request = new Request([
    'role' => 'police'
]);

// Get first user
$user = User::first();

echo "Testing change role endpoint\n";
echo "User ID: " . $user->id . "\n";
echo "Current Role: " . $user->role . "\n";
echo "\nAttempting to change role to 'police'...\n";

try {
    $response = $controller->changeRole($request, (string)$user->id);
    $data = json_decode($response->getContent(), true);
    
    echo "\nResponse:\n";
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
