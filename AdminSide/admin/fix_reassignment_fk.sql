-- ================================================
-- FIX: report_reassignment_requests foreign keys
-- Run this directly on your Render PostgreSQL database
-- ================================================

-- Step 1: Drop the incorrect foreign key constraints
ALTER TABLE report_reassignment_requests 
DROP CONSTRAINT IF EXISTS report_reassignment_requests_requested_by_user_id_foreign;

ALTER TABLE report_reassignment_requests 
DROP CONSTRAINT IF EXISTS report_reassignment_requests_reviewed_by_user_id_foreign;

-- Step 2: Add the correct foreign key constraints pointing to user_admin table
ALTER TABLE report_reassignment_requests 
ADD CONSTRAINT report_reassignment_requests_requested_by_user_id_foreign 
FOREIGN KEY (requested_by_user_id) 
REFERENCES user_admin(id) 
ON DELETE CASCADE;

ALTER TABLE report_reassignment_requests 
ADD CONSTRAINT report_reassignment_requests_reviewed_by_user_id_foreign 
FOREIGN KEY (reviewed_by_user_id) 
REFERENCES user_admin(id) 
ON DELETE SET NULL;

-- Verify the fix
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'report_reassignment_requests' 
AND tc.constraint_type = 'FOREIGN KEY';
