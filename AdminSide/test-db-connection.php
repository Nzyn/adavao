<?php

echo "Testing MySQL PDO Connection...\n";
echo "================================\n\n";

try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=alertdavao', 'root', '1234');
    echo "✓ SUCCESS: Database connection established!\n";
    echo "✓ PDO MySQL driver is working correctly.\n";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT VERSION() as version");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "\nMySQL Version: " . $result['version'] . "\n";
    
} catch (PDOException $e) {
    echo "✗ FAILED: " . $e->getMessage() . "\n";
    echo "\nPossible issues:\n";
    echo "1. MySQL service is not running\n";
    echo "2. Database 'alertdavao' doesn't exist\n";
    echo "3. Incorrect credentials in .env file\n";
    echo "4. pdo_mysql extension not enabled\n";
}

echo "\n================================\n";
