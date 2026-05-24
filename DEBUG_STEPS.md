# Debug Admin Login Issue

## Step 1: Check Supabase Auth
Go to your **Supabase Dashboard** → **Authentication** → **Users**

**Verify:**
- [ ] Does user `adminschool@gmail.com` exist?
- [ ] Is the email confirmed/verified?
- [ ] Can you see the user in the list?

## Step 2: Check Custom Users Table
Go to **SQL Editor** and run this query:

```sql
SELECT id, email, full_name, user_type FROM users WHERE email = 'adminschool@gmail.com';
```

**Expected result:**
- Email: adminschool@gmail.com
- user_type: admin
- id: (should match the auth user ID)

If no rows returned → **User doesn't exist in users table** (this is the problem!)

## Step 3: Create Admin User (if missing)
If the user doesn't exist in the users table, run this in SQL Editor:

```sql
-- First, get the user ID from Supabase Auth
SELECT id, email FROM auth.users WHERE email = 'adminschool@gmail.com';
```

Then copy the ID and run:

```sql
-- Replace UUID_HERE with the actual ID from previous query
INSERT INTO users (id, email, full_name, user_type) 
VALUES ('UUID_HERE', 'adminschool@gmail.com', 'Admin User', 'admin');
```

## Step 4: Check Browser Console
1. Open your app
2. Press F12 to open Developer Console
3. Look for any error messages (red text)
4. Share the exact error message you see
