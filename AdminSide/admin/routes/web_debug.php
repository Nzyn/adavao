<?php

// TEMPORARY DEBUG ROUTE - DELETE AFTER FIXING
Route::get('/debug-env', function () {
    return response()->json([
        'DB_HOST' => env('DB_HOST', 'NOT SET'),
        'DB_PORT' => env('DB_PORT', 'NOT SET'),
        'DB_DATABASE' => env('DB_DATABASE', 'NOT SET'),
        'DB_USERNAME' => env('DB_USERNAME', 'NOT SET'),
        'DB_PASSWORD' => env('DB_PASSWORD') ? 'SET (hidden)' : 'NOT SET',
        'config_username' => config('database.connections.mysql.username'),
        'all_env_keys' => array_keys($_ENV),
    ]);
});
