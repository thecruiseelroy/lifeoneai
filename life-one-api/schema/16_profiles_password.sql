-- Add password hash to profiles for login. New profiles (from register) set this; existing rows stay NULL (legacy, cannot log in).
ALTER TABLE profiles ADD COLUMN password_hash TEXT;
