-- Add Google Sign-In support to users table
-- Run this migration to enable Google authentication

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL UNIQUE AFTER email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL AFTER google_id;

-- Add index for faster Google ID lookups
CREATE INDEX IF NOT EXISTS idx_google_id ON users(google_id);

-- Make password nullable for Google users (they don't have passwords)
ALTER TABLE users MODIFY password VARCHAR(255) NULL;

-- Update existing Google users if any
-- UPDATE users SET google_id = NULL WHERE google_id = '';
