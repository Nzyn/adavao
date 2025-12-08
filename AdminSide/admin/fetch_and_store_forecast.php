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

$sarimaUrl = 'http://127.0.0.1:8001/forecast?horizon=12';

try {
    $json = file_get_contents($sarimaUrl);
    if ($json === false) {
        throw new Exception('Failed to fetch SARIMA API');
    }
    $resp = json_decode($json, true);
    if (!$resp || !isset($resp['data'])) {
        throw new Exception('Invalid SARIMA response');
    }

    $pdo = new PDO($dsn, $user, $pass, $options);

    $insert = $pdo->prepare("INSERT INTO crime_forecasts (location_id, forecast_date, predicted_count, model_used, confidence_score, lower_ci, upper_ci, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)");

    $now = date('Y-m-d H:i:s');
    foreach ($resp['data'] as $item) {
        $pred = round($item['forecast']);
        $insert->execute([
            1,
            $item['date'],
            $pred,
            'SARIMA(1,1,1)(1,1,1)[12]',
            0.95,
            $item['lower_ci'],
            $item['upper_ci'],
            $now,
            $now
        ]);
    }
    echo "Inserted " . count($resp['data']) . " forecast rows into crime_forecasts\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
