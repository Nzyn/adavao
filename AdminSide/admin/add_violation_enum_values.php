<?php
/**
 * Add missing violation_type enum values to user_flags table
 */

$host = '127.0.0.1';
$port = 3306;
$database = 'alertdavao';
$username = 'root';
$password = '1234';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
        ]
    );

    echo "✅ Connected to database: $database\n\n";

    // Desired enum values (union of existing and frontend options)
    $values = [
        'false_report',
        'prank_spam',
        'inappropriate_content',
        'harassment',
        'impersonation',
        'inappropriate_upload',
        'suspicious_activity',
        'sensitive_info_sharing',
        'anonymous_misuse',
        'system_abuse',
        'offensive_content',
        'multiple_accounts',
        'inappropriate_media',
        'misleading_info',
        'other'
    ];

    $enumList = "'" . implode("','", $values) . "'";

    echo "Altering user_flags.violation_type to include additional values...\n";

    $sql = "ALTER TABLE `user_flags` MODIFY COLUMN `violation_type` ENUM($enumList) NOT NULL";
    $pdo->exec($sql);

    echo "✅ Updated violation_type enum successfully.\n";

    // Show current column definition
    $stmt = $pdo->query("SHOW COLUMNS FROM user_flags LIKE 'violation_type'");
    $col = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Current definition: " . ($col['Type'] ?? 'unknown') . "\n";

    echo "\n✅ Migration complete!\n";

} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
