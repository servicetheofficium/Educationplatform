-- ⚠️ COMPLETE FIX FOR RLS POLICIES
-- Run this in your Supabase SQL Editor to drop old policies and create new ones

-- First, drop any existing policies on the users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable select for users based on id" ON users;

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access for own user" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Enable update for own user" 
  ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'users';
