-- Transaction to ensure atomicity
BEGIN;

-- 1. Rename existing table to users_public
ALTER TABLE users RENAME TO users_public;

-- 2. Create user_admin table (Clone structure)
CREATE TABLE user_admin (LIKE users_public INCLUDING ALL);

-- 3. Create user_admin_roles table (Since it was missing)
CREATE TABLE IF NOT EXISTS user_admin_roles (
    id SERIAL PRIMARY KEY,
    user_admin_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_user_admin FOREIGN KEY (user_admin_id) REFERENCES user_admin(id) ON DELETE CASCADE
    -- Note: We assume 'roles' table exists. referencing it:
    -- CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- 4. Move Admin/Police data to user_admin
INSERT INTO user_admin SELECT * FROM users_public WHERE role != 'user';

-- 5. Delete Admin/Police data from users_public
DELETE FROM users_public WHERE role != 'user';

-- 6. Remove 'user' role data from user_admin (Just in case)
DELETE FROM user_admin WHERE role = 'user';


-- 7. Fix Foreign Keys
-- We need to drop constraints pointing to 'users' and re-create them pointing to the correct table.

-- A. Reports -> users_public (Public reporting)
ALTER TABLE reports DROP CONSTRAINT reports_user_id_foreign;
ALTER TABLE reports ADD CONSTRAINT reports_user_id_foreign FOREIGN KEY (user_id) REFERENCES users_public(id) ON DELETE CASCADE;

-- B. Police Officers -> user_admin (Police are admins)
ALTER TABLE police_officers DROP CONSTRAINT police_officers_user_id_foreign;
ALTER TABLE police_officers ADD CONSTRAINT police_officers_user_id_foreign FOREIGN KEY (user_id) REFERENCES user_admin(id) ON DELETE CASCADE;

-- C. Admin Actions -> user_admin
ALTER TABLE admin_actions DROP CONSTRAINT admin_actions_admin_id_foreign;
ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_admin_id_foreign FOREIGN KEY (admin_id) REFERENCES user_admin(id) ON DELETE CASCADE;

-- D. Verifications -> users_public
ALTER TABLE verifications DROP CONSTRAINT verifications_user_id_foreign;
ALTER TABLE verifications ADD CONSTRAINT verifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES users_public(id) ON DELETE CASCADE;

-- E. Notifications -> users_public (Assuming mostly public users receive these for now, or split needed)
-- Based on 'notifications_ibfk_1' name, let's try to drop it safely
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_ibfk_1') THEN 
    ALTER TABLE notifications DROP CONSTRAINT notifications_ibfk_1; 
  END IF; 
  
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_foreign') THEN 
    ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_foreign; 
  END IF;
END $$;

ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES users_public(id) ON DELETE CASCADE;

-- F. User Role -> users_public
ALTER TABLE user_role DROP CONSTRAINT user_role_user_id_foreign;
ALTER TABLE user_role ADD CONSTRAINT user_role_user_id_foreign FOREIGN KEY (user_id) REFERENCES users_public(id) ON DELETE CASCADE;

-- G. Notification Reads -> users_public
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_reads_user_id_foreign') THEN 
    ALTER TABLE notification_reads DROP CONSTRAINT notification_reads_user_id_foreign; 
  END IF; 
END $$;

ALTER TABLE notification_reads ADD CONSTRAINT notification_reads_user_id_foreign FOREIGN KEY (user_id) REFERENCES users_public(id) ON DELETE CASCADE;

COMMIT;
