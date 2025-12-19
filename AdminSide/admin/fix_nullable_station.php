<?php
/**
 * Fix: Make requested_station_id nullable in report_reassignment_requests table
 * This allows police to select "Return to Admin" option
 */

// Get database credentials from .env file
$envFile = __DIR__ . '/.env';
$env = [];
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }
}

$host = $env['DB_HOST'] ?? 'localhost';
$port = $env['DB_PORT'] ?? '5432';
$dbname = $env['DB_DATABASE'] ?? 'alertdavao';
$user = $env['DB_USERNAME'] ?? 'postgres';
$password = $env['DB_PASSWORD'] ?? '';

echo "=== Making requested_station_id NULLABLE ===\n\n";

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    echo "✓ Connected to database\n\n";
    
    // Make the column nullable
    $pdo->exec("ALTER TABLE report_reassignment_requests ALTER COLUMN requested_station_id DROP NOT NULL");
    echo "✓ Made requested_station_id nullable\n";
    
    // Also drop and recreate the FK without the cascade delete (set null instead)
    try {
        $pdo->exec("ALTER TABLE report_reassignment_requests DROP CONSTRAINT IF EXISTS report_reassignment_requests_requested_station_id_foreign");
        $pdo->exec("
            ALTER TABLE report_reassignment_requests 
            ADD CONSTRAINT report_reassignment_requests_requested_station_id_foreign 
            FOREIGN KEY (requested_station_id) 
            REFERENCES police_stations(station_id) 
            ON DELETE SET NULL
        ");
        echo "✓ Updated foreign key to SET NULL on delete\n";
    } catch (PDOException $e) {
        echo "⚠ FK update: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== DONE ===\n";
    echo "Police can now use 'Return to Admin' option.\n";
    
} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
