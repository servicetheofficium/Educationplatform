-- ⚠️ CRITICAL FIX: Create admin user record in users table

-- Step 1: Get the user ID from Supabase Auth
-- Run this query first and copy the ID
SELECT id, email FROM auth.users WHERE email = 'adminschool@gmail.com';

-- Step 2: After getting the ID, replace 'YOUR_USER_ID_HERE' in this query with the actual ID
-- Then run it:
INSERT INTO users (id, email, full_name, user_type, password_hash) 
VALUES ('YOUR_USER_ID_HERE', 'adminschool@gmail.com', 'Admin User', 'admin', 'placeholder');

-- Step 3: Verify the user was created
SELECT id, email, full_name, user_type FROM users WHERE email = 'adminschool@gmail.com';
