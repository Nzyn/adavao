<?php
$host = '127.0.0.1';
$db   = 'alertdavao';
$user = 'root';
$pass = '1234';
$charset = 'utf8mb4';
$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $stmt = $pdo->query("SELECT * FROM crime_forecasts ORDER BY forecast_date");
    $rows = $stmt->fetchAll();
    $timestamp = date('Ymd_His');
    $backupFile = __DIR__ . DIRECTORY_SEPARATOR . "crime_forecasts_backup_$timestamp.json";
    file_put_contents($backupFile, json_encode($rows, JSON_PRETTY_PRINT));
    echo "Backed up " . count($rows) . " rows to $backupFile\n";

    // Delete all forecasts
    $pdo->exec("TRUNCATE TABLE crime_forecasts");
    echo "Cleared crime_forecasts table\n";

} catch (PDOException $e) {
    echo "DB error: " . $e->getMessage() . "\n";
}
