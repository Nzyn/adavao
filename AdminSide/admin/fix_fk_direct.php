<?php
/**
 * Direct database fix script
 * Run this to fix the foreign key constraints on report_reassignment_requests table
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

echo "=== Fixing report_reassignment_requests Foreign Keys ===\n\n";
echo "Connecting to: $host:$port/$dbname\n\n";

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    
    echo "✓ Connected to database successfully!\n\n";
    
    // Step 1: Drop incorrect foreign key constraints
    echo "Step 1: Dropping incorrect foreign key constraints...\n";
    
    try {
        $pdo->exec("ALTER TABLE report_reassignment_requests DROP CONSTRAINT IF EXISTS report_reassignment_requests_requested_by_user_id_foreign");
        echo "  ✓ Dropped requested_by_user_id constraint\n";
    } catch (PDOException $e) {
        echo "  ⚠ requested_by_user_id constraint: " . $e->getMessage() . "\n";
    }
    
    try {
        $pdo->exec("ALTER TABLE report_reassignment_requests DROP CONSTRAINT IF EXISTS report_reassignment_requests_reviewed_by_user_id_foreign");
        echo "  ✓ Dropped reviewed_by_user_id constraint\n";
    } catch (PDOException $e) {
        echo "  ⚠ reviewed_by_user_id constraint: " . $e->getMessage() . "\n";
    }
    
    echo "\n";
    
    // Step 2: Add correct foreign key constraints
    echo "Step 2: Adding correct foreign key constraints (pointing to user_admin)...\n";
    
    try {
        $pdo->exec("
            ALTER TABLE report_reassignment_requests 
            ADD CONSTRAINT report_reassignment_requests_requested_by_user_id_foreign 
            FOREIGN KEY (requested_by_user_id) 
            REFERENCES user_admin(id) 
            ON DELETE CASCADE
        ");
        echo "  ✓ Added requested_by_user_id -> user_admin(id) constraint\n";
    } catch (PDOException $e) {
        echo "  ✗ Failed to add requested_by_user_id constraint: " . $e->getMessage() . "\n";
    }
    
    try {
        $pdo->exec("
            ALTER TABLE report_reassignment_requests 
            ADD CONSTRAINT report_reassignment_requests_reviewed_by_user_id_foreign 
            FOREIGN KEY (reviewed_by_user_id) 
            REFERENCES user_admin(id) 
            ON DELETE SET NULL
        ");
        echo "  ✓ Added reviewed_by_user_id -> user_admin(id) constraint\n";
    } catch (PDOException $e) {
        echo "  ✗ Failed to add reviewed_by_user_id constraint: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== FIX COMPLETE ===\n";
    echo "The foreign keys now point to user_admin table instead of users_public.\n";
    echo "Report reassignment should now work correctly.\n";
    
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
