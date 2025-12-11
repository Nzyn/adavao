-- Fix otp_codes sequence
CREATE SEQUENCE IF NOT EXISTS otp_codes_id_seq;
SELECT setval('otp_codes_id_seq', COALESCE((SELECT MAX(id) FROM otp_codes), 1));
ALTER TABLE otp_codes ALTER COLUMN id SET DEFAULT nextval('otp_codes_id_seq');
ALTER SEQUENCE otp_codes_id_seq OWNED BY otp_codes.id;

-- Fix user_admin sequence (Since we created it with LIKE, it does NOT copy sequence)
CREATE SEQUENCE IF NOT EXISTS user_admin_id_seq;
SELECT setval('user_admin_id_seq', COALESCE((SELECT MAX(id) FROM user_admin), 1));
ALTER TABLE user_admin ALTER COLUMN id SET DEFAULT nextval('user_admin_id_seq');
ALTER SEQUENCE user_admin_id_seq OWNED BY user_admin.id;

-- Fix users_public sequence (renamed from users, likely missing too)
CREATE SEQUENCE IF NOT EXISTS users_public_id_seq;
SELECT setval('users_public_id_seq', COALESCE((SELECT MAX(id) FROM users_public), 1));
ALTER TABLE users_public ALTER COLUMN id SET DEFAULT nextval('users_public_id_seq');
ALTER SEQUENCE users_public_id_seq OWNED BY users_public.id;
