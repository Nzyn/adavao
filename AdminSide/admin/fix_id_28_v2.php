<?php
// Direct PDO connection WITH CORRECT CREDENTIALS
$host = '127.0.0.1';
$db   = 'alertdavao';
$user = 'root';
$pass = '1234'; // FROM .ENV file
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    echo "=== Force Fixing User ID 28 (Safe Mode) ===\n\n";
    
    $userId = 28;
    
    // get available roles
    $stmt = $pdo->query("SELECT role_id, role_name FROM roles");
    $roles = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $superAdminId = array_search('super_admin', $roles);
    $adminId = array_search('admin', $roles);
    
    if (!$superAdminId) die("super_admin role not found\n");
    
    // Instead of DELETE which triggers constraints, use INSERT IGNORE to ensure rows exist
    
    // 1. Assign super_admin
    $stmt = $pdo->prepare("INSERT IGNORE INTO user_admin_roles (user_admin_id, role_id, assigned_at) VALUES (?, ?, NOW())");
    $stmt->execute([$userId, $superAdminId]);
    echo "Ensured super_admin role (ID: $superAdminId).\n";
    
    // 2. Assign admin
    if ($adminId) {
        $stmt->execute([$userId, $adminId]);
        echo "Ensured admin role (ID: $adminId).\n";
    }
    
    // 3. Fix Legacy Column
    $stmt = $pdo->prepare("UPDATE user_admin SET role = 'super_admin' WHERE id = ?");
    $stmt->execute([$userId]);
    echo "Updated legacy role column to 'super_admin'.\n";
    
    echo "\n✓ SUCCESS: User roles restored safely.\n";
    
} catch (\PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
