<?php
/**
 * Run User Flags Migration
 * Execute this script to create the user flags system tables
 * 
 * Usage: php run_user_flags_migration.php
 */

// Database configuration
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
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    echo "✅ Connected to database: $database\n\n";
    
    // Read SQL file
    $sqlFile = __DIR__ . '/../../sql/user_flags_system.sql';
    
    if (!file_exists($sqlFile)) {
        // Try alternative path
        $sqlFile = 'D:/Codes/alertdavao/alertdavao/sql/user_flags_system.sql';
    }
    
    if (!file_exists($sqlFile)) {
        die("❌ SQL file not found at: $sqlFile\n");
    }
    
    $sql = file_get_contents($sqlFile);
    echo "📄 Loaded SQL file: $sqlFile\n\n";
    
    // Split SQL statements
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => !empty($s) && !preg_match('/^(--|\/\*)/', trim($s))
    );
    
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($statements as $statement) {
        if (empty(trim($statement))) continue;
        
        try {
            $pdo->exec($statement);
            $successCount++;
            
            // Extract table/column name for display
            if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✅ Created table: {$matches[1]}\n";
            } elseif (preg_match('/ALTER TABLE.*?`?(\w+)`?.*?ADD.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✅ Added column {$matches[2]} to table {$matches[1]}\n";
            } elseif (preg_match('/CREATE.*?TRIGGER.*?`?(\w+)`?/i', $statement, $matches)) {
                echo "✅ Created trigger: {$matches[1]}\n";
            } elseif (preg_match('/INSERT INTO/i', $statement)) {
                echo "✅ Inserted data\n";
            } else {
                echo "✅ Executed statement\n";
            }
        } catch (PDOException $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') !== false || 
                strpos($e->getMessage(), 'Duplicate') !== false) {
                echo "⚠️  Skipped (already exists)\n";
            } else {
                echo "❌ Error: " . $e->getMessage() . "\n";
                $errorCount++;
            }
        }
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "📊 Migration Summary:\n";
    echo "   ✅ Successful: $successCount\n";
    echo "   ❌ Errors: $errorCount\n";
    echo str_repeat("=", 50) . "\n";
    
    // Verify tables exist
    echo "\n🔍 Verifying tables...\n";
    $tables = ['user_flags', 'user_restrictions', 'flag_history'];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' NOT found\n";
        }
    }
    
    // Check columns added to users table
    echo "\n🔍 Verifying users table columns...\n";
    $columns = ['total_flags', 'restriction_level', 'false_report_count', 'spam_count'];
    
    foreach ($columns as $column) {
        $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE '$column'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Column 'users.$column' exists\n";
        } else {
            echo "❌ Column 'users.$column' NOT found\n";
        }
    }
    
    echo "\n✅ Migration complete!\n";
    
} catch (PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n");
}
