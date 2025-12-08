<?php
// Simple environment parser
function parseEnv($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value);
        }
    }
    return $env;
}

$env = parseEnv(__DIR__ . '/.env');

echo "--- DATABASE CHECK ---\n";
try {
    $dsn = "mysql:host=" . ($env['DB_HOST'] ?? '127.0.0.1') . ";dbname=" . ($env['DB_DATABASE'] ?? 'alertdavao');
    $pdo = new PDO($dsn, $env['DB_USERNAME'] ?? 'root', $env['DB_PASSWORD'] ?? '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->query("SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 5");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($rows) . " OTP records:\n";
    foreach ($rows as $row) {
        echo "ID: {$row['id']} | Phone: {$row['phone']} | OTP Hash: " . substr($row['otp_hash'], 0, 10) . "... | Purpose: {$row['purpose']} | Created: {$row['created_at']}\n";
    }
} catch (Exception $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}

echo "\n--- TWILIO CONFIG CHECK ---\n";
$sid = $env['TWILIO_SID'] ?? '';
$token = $env['TWILIO_TOKEN'] ?? '';
$from = $env['TWILIO_FROM'] ?? '';

echo "SID: " . ($sid ? "Set (" . substr($sid, 0, 5) . "...)" : "MISSING") . "\n";
echo "Token: " . ($token ? "Set (" . substr($token, 0, 5) . "...)" : "MISSING") . "\n";
echo "From: " . ($from ? "Set ($from)" : "MISSING") . "\n";

if (!empty($rows)) {
    $lastPhone = $rows[0]['phone'];
    echo "\n--- TEST SEND to $lastPhone ---\n";
    
    if ($sid && $token && $from) {
        $url = "https://api.twilio.com/2010-04-01/Accounts/$sid/Messages.json";
        $data = [
            'To' => $lastPhone,
            'From' => $from,
            'Body' => 'Test SMS from Debug Script'
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
        curl_setopt($ch, CURLOPT_USERPWD, "$sid:$token");
        // Disable SSL verification for local debug if needed
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        echo "HTTP Code: $httpCode\n";
        echo "Response: $response\n";
        if ($error) echo "Curl Error: $error\n";
    }
}
