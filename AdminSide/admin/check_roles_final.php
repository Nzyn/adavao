<?php
// Direct PDO connection check
$host = '127.0.0.1';
$db   = 'alertdavao';
$user = 'root';
$pass = '1234';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
try {
    $pdo = new PDO($dsn, $user, $pass);
    
    $userId = 28;
    
    echo "=== Verification for User ID $userId ===\n";
    
    $stmt = $pdo->prepare("
        SELECT r.role_name, r.role_id 
        FROM user_admin_roles uar
        JOIN roles r ON uar.role_id = r.role_id
        WHERE uar.user_admin_id = ?
    ");
    $stmt->execute([$userId]);
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($roles) > 0) {
        echo "Roles found:\n";
        foreach ($roles as $r) {
            echo "- {$r['role_name']} (ID: {$r['role_id']})\n";
        }
    } else {
        echo "NO ROLES FOUND!\n";
    }
    
} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage();
}
