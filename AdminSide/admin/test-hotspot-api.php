<?php
/**
 * Test script for crime hotspot API
 * 
 * Usage: php test-hotspot-api.php
 */

// Set up Laravel environment
define('LARAVEL_START', microtime(true));

// Load Composer autoloader
require __DIR__ . '/vendor/autoload.php';

// Create application instance
$app = require_once __DIR__ . '/bootstrap/app.php';

// Get the kernel
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Create a test request - must use full route with /admin prefix since routes are prefixed
$request = \Illuminate\Http\Request::create('/admin/api/hotspot-data', 'GET');

// Process request through the application
$response = $kernel->handle($request);

// Output the response
echo "Status Code: " . $response->status() . "\n";
echo "Content Type: " . $response->headers->get('content-type') . "\n";
echo "\n=== Hotspot Data Response ===\n";
echo $response->getContent();
echo "\n";

// Terminate the kernel
$kernel->terminate($request, $response);
?>
