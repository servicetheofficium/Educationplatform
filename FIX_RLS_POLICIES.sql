-- 🔧 FIX FOR ADMIN LOGIN 406 ERROR
-- Run these commands in your Supabase SQL Editor to enable RLS policies for the users table

-- Create policies for users table (users can view their own profile)
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);
