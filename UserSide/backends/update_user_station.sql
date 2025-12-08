-- Update user 10 to be assigned to station 40 (Cybercrime Division)
UPDATE users SET station_id = 40 WHERE id = 10;

-- Verify the update
SELECT id, firstname, lastname, email, station_id FROM users WHERE id = 10;
