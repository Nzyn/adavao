-- Backfill user_admin_roles based on existing role string column
-- Assuming role_id 1 = admin, 2 = police (based on 'roles' table inspection)

-- clear existing just in case (though should be empty)
TRUNCATE TABLE user_admin_roles RESTART IDENTITY;

-- Insert Admins
INSERT INTO user_admin_roles (user_admin_id, role_id, created_at, updated_at)
SELECT id, (SELECT role_id FROM roles WHERE role_name = 'admin' ORDER BY role_id ASC LIMIT 1), NOW(), NOW()
FROM user_admin
WHERE role = 'admin';

-- Insert Police
INSERT INTO user_admin_roles (user_admin_id, role_id, created_at, updated_at)
SELECT id, (SELECT role_id FROM roles WHERE role_name = 'police' ORDER BY role_id ASC LIMIT 1), NOW(), NOW()
FROM user_admin
WHERE role = 'police';

-- Verify
SELECT count(*) as roles_assigned FROM user_admin_roles;
