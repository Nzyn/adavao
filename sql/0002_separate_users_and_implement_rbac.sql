-- Separation of Users and Admin/Police with RBAC and Authentication Isolation
-- This migration separates the users table into two: users_public (app users) and user_admin (admin/police)
-- Each table can only authenticate with their respective sides

-- First, disable foreign key checks
SET FOREIGN_KEY_CHECKS=0;

-- Create the new users_public table for app users only
CREATE TABLE IF NOT EXISTS `users_public` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `firstname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `verification_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_expires_at` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_flags` int DEFAULT '0',
  `false_report_count` int DEFAULT '0',
  `spam_count` int DEFAULT '0',
  `harassment_count` int DEFAULT '0',
  `inappropriate_content_count` int DEFAULT '0',
  `last_flag_date` datetime DEFAULT NULL,
  `restriction_level` enum('none','warning','suspended','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `trust_score` int DEFAULT '100',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `lockout_until` timestamp NULL DEFAULT NULL,
  `last_failed_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_public_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='App users (UserSide only)';

-- Create the new user_admin table for admin and police officers
CREATE TABLE IF NOT EXISTS `user_admin` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `firstname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `verification_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_expires_at` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_token_expires_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `station_id` bigint unsigned DEFAULT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_flags` int DEFAULT '0',
  `false_report_count` int DEFAULT '0',
  `spam_count` int DEFAULT '0',
  `harassment_count` int DEFAULT '0',
  `inappropriate_content_count` int DEFAULT '0',
  `last_flag_date` datetime DEFAULT NULL,
  `restriction_level` enum('none','warning','suspended','banned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `trust_score` int DEFAULT '100',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `lockout_until` timestamp NULL DEFAULT NULL,
  `last_failed_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_admin_email_unique` (`email`),
  KEY `fk_user_admin_station` (`station_id`),
  CONSTRAINT `fk_user_admin_station` FOREIGN KEY (`station_id`) REFERENCES `police_stations` (`station_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin and Police users (AdminSide only)';

-- Create RBAC table for admin/police users
CREATE TABLE IF NOT EXISTS `admin_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `level` int NOT NULL COMMENT '1=Police Officer, 2=Station Admin, 3=Super Admin',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roles for admin/police users';

-- Create pivot table for admin user roles
CREATE TABLE IF NOT EXISTS `user_admin_roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_admin_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` bigint unsigned,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_admin_roles_unique` (`user_admin_id`, `role_id`),
  KEY `user_admin_roles_user_admin_id_foreign` (`user_admin_id`),
  KEY `user_admin_roles_role_id_foreign` (`role_id`),
  KEY `user_admin_roles_assigned_by_foreign` (`assigned_by`),
  CONSTRAINT `user_admin_roles_user_admin_id_foreign` FOREIGN KEY (`user_admin_id`) REFERENCES `user_admin` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_admin_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_admin_roles_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `user_admin` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RBAC mapping for admin/police users';

-- Create table for admin/police permissions
CREATE TABLE IF NOT EXISTS `admin_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `permission_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'e.g., reports, users, analytics',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Permissions for roles';

-- Create role-permission mapping
CREATE TABLE IF NOT EXISTS `admin_role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint unsigned NOT NULL,
  `permission_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permission_unique` (`role_id`, `permission_id`),
  KEY `role_permissions_permission_id_foreign` (`permission_id`),
  CONSTRAINT `role_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `admin_permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mapping roles to permissions';

-- Create login tracking tables for security isolation
CREATE TABLE IF NOT EXISTS `user_login_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `email` varchar(100) NOT NULL,
  `ip_address` varchar(45),
  `user_agent` text,
  `status` enum('success','failed','locked') DEFAULT 'failed',
  `attempted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_login_attempts_user_id_foreign` (`user_id`),
  CONSTRAINT `user_login_attempts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users_public` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Login attempts for app users';

CREATE TABLE IF NOT EXISTS `admin_login_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_admin_id` bigint unsigned NOT NULL,
  `email` varchar(100) NOT NULL,
  `ip_address` varchar(45),
  `user_agent` text,
  `status` enum('success','failed','locked') DEFAULT 'failed',
  `attempted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_login_attempts_user_admin_id_foreign` (`user_admin_id`),
  CONSTRAINT `admin_login_attempts_user_admin_id_foreign` FOREIGN KEY (`user_admin_id`) REFERENCES `user_admin` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Login attempts for admin/police users';

-- Create audit log for admin actions
CREATE TABLE IF NOT EXISTS `admin_audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_admin_id` bigint unsigned,
  `action` varchar(255) NOT NULL,
  `table_name` varchar(100),
  `record_id` bigint unsigned,
  `old_values` json,
  `new_values` json,
  `ip_address` varchar(45),
  `performed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_audit_log_user_admin_id_foreign` (`user_admin_id`),
  CONSTRAINT `admin_audit_log_user_admin_id_foreign` FOREIGN KEY (`user_admin_id`) REFERENCES `user_admin` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for admin actions';

-- Insert existing admin/police users into user_admin
INSERT IGNORE INTO `user_admin` 
SELECT id, firstname, lastname, contact, email, email_verified_at, verification_token, token_expires_at, 
       reset_token, reset_token_expires_at, password, address, latitude, longitude, station_id, is_verified, 
       created_at, updated_at, total_flags, false_report_count, spam_count, harassment_count, 
       inappropriate_content_count, last_flag_date, restriction_level, trust_score, remember_token, 
       failed_login_attempts, lockout_until, last_failed_login
FROM users 
WHERE role IN ('admin', 'police');

-- Insert existing app users into users_public
INSERT IGNORE INTO `users_public` 
SELECT id, firstname, lastname, contact, email, email_verified_at, verification_token, token_expires_at, 
       reset_token, reset_token_expires_at, password, address, latitude, longitude, is_verified, 
       created_at, updated_at, total_flags, false_report_count, spam_count, harassment_count, 
       inappropriate_content_count, last_flag_date, restriction_level, trust_score, remember_token, 
       failed_login_attempts, lockout_until, last_failed_login
FROM users 
WHERE role = 'user';

-- Seed default roles
INSERT IGNORE INTO `admin_roles` (`role_name`, `description`, `level`) VALUES
  ('police_officer', 'Police officer - can view and manage reports', 1),
  ('station_admin', 'Station administrator - can manage officers and reports', 2),
  ('super_admin', 'Super admin - full system access', 3);

-- Seed default permissions
INSERT IGNORE INTO `admin_permissions` (`permission_name`, `description`, `category`) VALUES
  ('view_reports', 'View crime reports', 'reports'),
  ('create_report', 'Create new report', 'reports'),
  ('update_report', 'Update report details', 'reports'),
  ('delete_report', 'Delete report', 'reports'),
  ('assign_report', 'Assign report to officer', 'reports'),
  ('manage_users', 'Manage user accounts', 'users'),
  ('view_analytics', 'View crime analytics', 'analytics'),
  ('manage_officers', 'Manage police officers', 'officers'),
  ('system_settings', 'Access system settings', 'system'),
  ('view_audit_log', 'View audit logs', 'audit');

-- Assign permissions to police_officer role
INSERT IGNORE INTO `admin_role_permissions` (`role_id`, `permission_id`) 
SELECT r.id, p.id FROM admin_roles r, admin_permissions p 
WHERE r.role_name = 'police_officer' AND p.permission_name IN ('view_reports', 'create_report', 'update_report', 'assign_report');

-- Assign permissions to station_admin role (most permissions except system_settings)
INSERT IGNORE INTO `admin_role_permissions` (`role_id`, `permission_id`) 
SELECT r.id, p.id FROM admin_roles r, admin_permissions p 
WHERE r.role_name = 'station_admin' AND p.permission_name NOT IN ('system_settings');

-- Assign all permissions to super_admin role
INSERT IGNORE INTO `admin_role_permissions` (`role_id`, `permission_id`) 
SELECT r.id, p.id FROM admin_roles r, admin_permissions p 
WHERE r.role_name = 'super_admin';

-- Assign roles to migrated admin/police users
INSERT IGNORE INTO `user_admin_roles` (user_admin_id, role_id)
SELECT ua.id, ar.id 
FROM user_admin ua
JOIN users u ON ua.email = u.email
JOIN admin_roles ar ON 
  CASE 
    WHEN u.role = 'admin' THEN ar.role_name = 'super_admin'
    WHEN u.role = 'police' THEN ar.role_name = 'police_officer'
  END;

-- Add indexes for better performance
CREATE INDEX `idx_user_admin_email` ON `user_admin` (`email`);
CREATE INDEX `idx_user_admin_station_id` ON `user_admin` (`station_id`);
CREATE INDEX `idx_users_public_email` ON `users_public` (`email`);
CREATE INDEX `idx_user_admin_roles_user` ON `user_admin_roles` (`user_admin_id`);
CREATE INDEX `idx_admin_login_attempts_email` ON `admin_login_attempts` (`email`);
CREATE INDEX `idx_user_login_attempts_email` ON `user_login_attempts` (`email`);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
