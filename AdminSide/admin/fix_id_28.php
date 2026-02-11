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
    
    echo "=== Force Fixing User ID 28 ===\n\n";
    
    // 1. Target ID 28 specifically (from user debug output)
    $userId = 28;
    
    // get available roles
    $stmt = $pdo->query("SELECT role_id, role_name FROM roles");
    $roles = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $superAdminId = array_search('super_admin', $roles);
    $adminId = array_search('admin', $roles);
    
    if (!$superAdminId) die("super_admin role not found\n");
    
    // 3. Clear existing roles
    $stmt = $pdo->prepare("DELETE FROM user_admin_roles WHERE user_admin_id = ?");
    $stmt->execute([$userId]);
    echo "Cleared old roles for ID 28.\n";
    
    // 4. Assign Roles
    $stmt = $pdo->prepare("INSERT INTO user_admin_roles (user_admin_id, role_id) VALUES (?, ?)");
    $stmt->execute([$userId, $superAdminId]); // key is ID, value is name? wait fetchAll KEY PAIR is ID => NAME if selected that way
    // Ah, fetchAll(PDO::FETCH_KEY_PAIR) requires 2 columns. first col is key.
    // Query selected role_id, role_name. So KEY is ID, Value is Name.
    // So $roles = [1 => 'admin', 2 => 'super_admin']
    // So array_search('super_admin', $roles) returns the ID (key). Correct.
    
    echo "Assigned super_admin (ID: $superAdminId).\n";
    
    if ($adminId) {
        $stmt->execute([$userId, $adminId]);
        echo "Assigned admin (ID: $adminId).\n";
    }
    
    // 5. Fix Legacy Column
    $stmt = $pdo->prepare("UPDATE user_admin SET role = 'super_admin' WHERE id = ?");
    $stmt->execute([$userId]);
    echo "Updated legacy role column to 'super_admin'.\n";
    
    echo "\n✓ SUCCESS: User ID 28 FIXED.\n";
    
} catch (\PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
