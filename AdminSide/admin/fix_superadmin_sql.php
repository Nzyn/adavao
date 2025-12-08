<?php
// Direct PDO connection to bypass Laravel intricacies for this fix
$host = '127.0.0.1';
$db   = 'alertdavao';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    echo "=== Fixing Super Admin Role (Direct SQL) ===\n\n";
    
    // 1. Get User ID
    $stmt = $pdo->prepare("SELECT id, email FROM user_admin WHERE email = ?");
    $stmt->execute(['alertdavao.ph@gmail.com']);
    $user = $stmt->fetch();
    
    if (!$user) {
        die("User not found.\n");
    }
    
    $userId = $user['id'];
    echo "User ID: $userId\n";
    
    // 2. Get Role IDs
    $stmt = $pdo->query("SELECT role_id, role_name FROM roles");
    $roles = $stmt->fetchAll(PDO::FETCH_KEY_PAIR); // [name => id] (if query was name, id) - actully let's loop
    
    $roleMap = [];
    $stmt = $pdo->query("SELECT role_id, role_name FROM roles");
    while ($row = $stmt->fetch()) {
        $roleMap[$row['role_name']] = $row['role_id'];
    }
    
    $superAdminId = $roleMap['super_admin'] ?? null;
    $adminId = $roleMap['admin'] ?? null;
    
    if (!$superAdminId) die("super_admin role not found\n");
    
    echo "Super Admin Role ID: $superAdminId\n";
    
    // 3. Clear existing roles
    $stmt = $pdo->prepare("DELETE FROM user_admin_roles WHERE user_admin_id = ?");
    $stmt->execute([$userId]);
    echo "Cleared old roles.\n";
    
    // 4. Assign Roles
    $stmt = $pdo->prepare("INSERT INTO user_admin_roles (user_admin_id, role_id) VALUES (?, ?)");
    $stmt->execute([$userId, $superAdminId]);
    echo "Assigned super_admin.\n";
    
    if ($adminId) {
        $stmt->execute([$userId, $adminId]);
        echo "Assigned admin.\n";
    }
    
    // 5. Fix Legacy Column
    $stmt = $pdo->prepare("UPDATE user_admin SET role = 'super_admin' WHERE id = ?");
    $stmt->execute([$userId]);
    echo "Updated legacy role column.\n";
    
    echo "\n✓ SUCCESS: User permissions fixed.\n";
    
} catch (\PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
