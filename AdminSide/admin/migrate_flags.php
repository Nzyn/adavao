<?php
/**
 * Simple User Flags Migration
 * Creates the essential tables for the user flagging system
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

    // Create user_flags table
    echo "Creating user_flags table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `user_flags` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `violation_type` ENUM('false_report', 'prank_spam', 'inappropriate_content', 'harassment', 'impersonation', 'inappropriate_upload', 'suspicious_activity', 'sensitive_info_sharing', 'anonymous_misuse', 'system_abuse') NOT NULL,
          `severity` ENUM('minor', 'moderate', 'major', 'critical') DEFAULT 'minor',
          `description` TEXT,
          `evidence` JSON DEFAULT NULL,
          `reported_by` INT DEFAULT NULL,
          `related_report_id` INT DEFAULT NULL,
          `status` ENUM('pending', 'confirmed', 'dismissed', 'appealed') DEFAULT 'pending',
          `reviewed_by` INT DEFAULT NULL,
          `reviewed_at` DATETIME DEFAULT NULL,
          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (`user_id`),
          INDEX idx_violation_type (`violation_type`),
          INDEX idx_status (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✅ user_flags table created\n";

    // Create user_restrictions table
    echo "Creating user_restrictions table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `user_restrictions` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user_id` INT NOT NULL,
          `restriction_type` ENUM('warning', 'suspended', 'banned') NOT NULL,
          `reason` TEXT,
          `expires_at` DATETIME DEFAULT NULL,
          `can_report` BOOLEAN DEFAULT TRUE,
          `can_comment` BOOLEAN DEFAULT TRUE,
          `can_upload` BOOLEAN DEFAULT TRUE,
          `can_message` BOOLEAN DEFAULT TRUE,
          `is_active` BOOLEAN DEFAULT TRUE,
          `created_by` INT DEFAULT NULL,
          `lifted_by` INT DEFAULT NULL,
          `lifted_at` DATETIME DEFAULT NULL,
          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (`user_id`),
          INDEX idx_is_active (`is_active`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✅ user_restrictions table created\n";

    // Create flag_history table
    echo "Creating flag_history table...\n";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `flag_history` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `flag_id` INT NOT NULL,
          `action` ENUM('created', 'confirmed', 'dismissed', 'appealed', 'appeal_approved', 'appeal_denied') NOT NULL,
          `performed_by` INT DEFAULT NULL,
          `notes` TEXT,
          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_flag_id (`flag_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "✅ flag_history table created\n";

    // Add columns to users table
    echo "\nAdding columns to users table...\n";
    
    $columns = [
        'total_flags' => 'INT DEFAULT 0',
        'false_report_count' => 'INT DEFAULT 0',
        'spam_count' => 'INT DEFAULT 0',
        'harassment_count' => 'INT DEFAULT 0',
        'inappropriate_content_count' => 'INT DEFAULT 0',
        'last_flag_date' => 'DATETIME DEFAULT NULL',
        'restriction_level' => "ENUM('none', 'warning', 'suspended', 'banned') DEFAULT 'none'",
        'trust_score' => 'INT DEFAULT 100'
    ];

    foreach ($columns as $column => $definition) {
        try {
            $pdo->exec("ALTER TABLE `users` ADD COLUMN `$column` $definition");
            echo "✅ Added column: $column\n";
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate column') !== false) {
                echo "⚠️  Column '$column' already exists\n";
            } else {
                echo "❌ Error adding '$column': " . $e->getMessage() . "\n";
            }
        }
    }

    // Verify
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "🔍 Verification:\n";
    
    $tables = ['user_flags', 'user_restrictions', 'flag_history'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->rowCount() > 0;
        echo ($exists ? "✅" : "❌") . " Table '$table' " . ($exists ? "exists" : "MISSING") . "\n";
    }

    echo "\n✅ Migration complete!\n";
    
} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
