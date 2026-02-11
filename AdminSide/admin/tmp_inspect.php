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

    // Monthly last 36 months
    $stmt = $pdo->query("SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, COUNT(*) AS count FROM reports WHERE created_at >= DATE_SUB(NOW(), INTERVAL 36 MONTH) GROUP BY year, month ORDER BY year, month");
    $monthly = $stmt->fetchAll();

    // Forecasts
    $stmt = $pdo->prepare("SELECT forecast_date, predicted_count, lower_ci, upper_ci FROM crime_forecasts WHERE location_id = 1 AND forecast_date >= CURDATE() ORDER BY forecast_date LIMIT 60");
    $stmt->execute();
    $forecasts = $stmt->fetchAll();

    // Overall counts
    $total = $pdo->query("SELECT COUNT(*) as c FROM reports")->fetchColumn();
    $thisMonth = $pdo->query("SELECT COUNT(*) FROM reports WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())")->fetchColumn();
    $lastMonth = $pdo->query("SELECT COUNT(*) FROM reports WHERE (YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)))")->fetchColumn();

    echo json_encode([
        'monthly' => $monthly,
        'forecasts' => $forecasts,
        'overview' => [
            'total' => (int)$total,
            'thisMonth' => (int)$thisMonth,
            'lastMonth' => (int)$lastMonth
        ]
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

?>