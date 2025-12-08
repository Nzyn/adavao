<?php
/**
 * Show user_flags table column definitions for debugging
 */
$host = '127.0.0.1';
$port = 3306;
$database = 'alertdavao';
$username = 'root';
$password = '1234';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query("SHOW COLUMNS FROM user_flags");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Current user_flags columns:\n";
    foreach ($cols as $c) {
        echo " - {$c['Field']}: {$c['Type']} (Null={$c['Null']}, Key={$c['Key']})\n";
    }
} catch (PDOException $e) {
    die('Error: ' . $e->getMessage() . "\n");
}
