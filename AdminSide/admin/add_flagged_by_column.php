<?php
/**
 * Add 'flagged_by' column to user_flags table
 * This fixes the SQL error: Column not found: 1054 Unknown column 'flagged_by'
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

    // Check if user_flags table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'user_flags'");
    if ($stmt->rowCount() === 0) {
        die("❌ Error: user_flags table does not exist. Run migrate_flags.php first.\n");
    }

    // Check if flagged_by column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM user_flags LIKE 'flagged_by'");
    if ($stmt->rowCount() > 0) {
        echo "⚠️  Column 'flagged_by' already exists in user_flags table.\n";
        echo "✅ No changes needed.\n";
        exit(0);
    }

    // Add flagged_by column
    echo "Adding 'flagged_by' column to user_flags table...\n";
    $pdo->exec("
        ALTER TABLE `user_flags` 
        ADD COLUMN `flagged_by` INT NOT NULL DEFAULT 1 COMMENT 'Admin/Police who flagged the user' 
        AFTER `user_id`
    ");
    echo "✅ Column 'flagged_by' added successfully!\n\n";

    // Also add 'reason' column if it doesn't exist (for compatibility)
    $stmt = $pdo->query("SHOW COLUMNS FROM user_flags LIKE 'reason'");
    if ($stmt->rowCount() === 0) {
        echo "Adding 'reason' column to user_flags table...\n";
        $pdo->exec("
            ALTER TABLE `user_flags` 
            ADD COLUMN `reason` TEXT DEFAULT NULL COMMENT 'Specific reason for this flag' 
            AFTER `violation_type`
        ");
        echo "✅ Column 'reason' added successfully!\n\n";
    }

    // Verify the structure
    echo str_repeat("=", 50) . "\n";
    echo "🔍 Current user_flags table structure:\n\n";
    $stmt = $pdo->query("DESCRIBE user_flags");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($columns as $column) {
        echo "  - {$column['Field']} ({$column['Type']}) {$column['Null']} {$column['Key']}\n";
    }

    echo "\n✅ Migration complete! You can now flag users without errors.\n";
    
} catch (PDOException $e) {
    die("❌ Error: " . $e->getMessage() . "\n");
}
