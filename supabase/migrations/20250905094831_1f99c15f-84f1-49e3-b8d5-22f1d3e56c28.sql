-- Update existing profiles to use username as full_name when full_name is null
UPDATE profiles 
SET full_name = username 
WHERE full_name IS NULL OR full_name = '';

-- Alternative: Update to use a cleaned up version of the username
UPDATE profiles 
SET full_name = CASE 
  WHEN username IS NOT NULL AND username != '' THEN 
    -- Convert username to a more readable format (remove numbers, capitalize)
    INITCAP(REGEXP_REPLACE(username, '[0-9]+', '', 'g'))
  ELSE 
    'Anonymous User'
END
WHERE full_name IS NULL OR full_name = '';