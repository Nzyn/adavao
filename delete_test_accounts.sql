-- Delete test patrol accounts created during testing
-- Run this in your Render PostgreSQL database

-- Delete from user_admin table
DELETE FROM user_admin 
WHERE email LIKE 'dansoypatrol%@mailsac.com';

-- Delete from users_public table (if any were created there)
DELETE FROM users_public 
WHERE email LIKE 'dansoypatrol%@mailsac.com';

-- Verify deletion
SELECT id, email, user_role FROM user_admin WHERE email LIKE '%dansoy%';
SELECT id, email FROM users_public WHERE email LIKE '%dansoy%';
