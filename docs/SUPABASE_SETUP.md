# Supabase Setup Guide for KNC Language School

## Overview
This project uses **Supabase** as the backend database for managing students and courses in the language school.

## Quick Start

### 1. Create a Supabase Account and Project
- Go to [supabase.com](https://supabase.com)
- Sign up and create a new project
- Choose your region (preferably closest to your users)
- Wait for the project to initialize

### 2. Get Your Credentials
- In the Supabase dashboard, go to **Settings** > **API**
- Copy your:
  - **Project URL** (e.g., `https://YOUR_PROJECT.supabase.co`)
  - **Anon Public Key** (for client-side access)

### 3. Configure Environment Variables
Update `.env.local` with your Supabase credentials:
```
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 4. Create Database Tables
- In the Supabase dashboard, go to **SQL Editor**
- Create a new query
- Copy and paste the contents of `database.schema.sql`
- Execute the query

Or run migrations directly:
```bash
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres < database.schema.sql
```

### 5. Install Dependencies
```bash
npm install @supabase/supabase-js
```

## Database Schema

### Tables Overview

#### **users**
- Stores authentication and user profile information
- Columns: id, email, password_hash, full_name, user_type, created_at, updated_at

#### **students**
- Extends user data with student-specific information
- Columns: id, user_id, enrollment_date, phone, address, language_level, created_at, updated_at

#### **courses**
- Stores available courses offered by the school
- Columns: id, name, description, language, level, max_students, duration_weeks, price, created_at, updated_at

#### **student_courses**
- Junction table for student enrollments
- Columns: id, student_id, course_id, enrollment_date, status, created_at, updated_at
- Status can be: 'active', 'completed', 'dropped'

## Using Supabase in the Application

### Import and Initialize
```typescript
import { supabase } from './supabase';
```

### Example: Fetch All Courses
```typescript
const { data, error } = await supabase
  .from('courses')
  .select('*');
```

### Example: Enroll a Student in a Course
```typescript
const { data, error } = await supabase
  .from('student_courses')
  .insert([
    {
      student_id: 'UUID',
      course_id: 'UUID',
      status: 'active'
    }
  ]);
```

### Example: Get Student Enrollments
```typescript
const { data, error } = await supabase
  .from('student_courses')
  .select(`
    *,
    courses(*)
  `)
  .eq('student_id', 'UUID');
```

## Row Level Security (RLS)
The schema includes RLS policies for security:
- Students can only view/update their own profile
- Students can only see their own enrollments
- Courses are publicly viewable
- Admin operations should be handled server-side with admin privileges

## Best Practices

1. **Always handle errors** in your queries
2. **Use TypeScript types** from `supabase.ts` for type safety
3. **Create indexes** for frequently queried columns (already done in schema)
4. **Test RLS policies** before deploying to production
5. **Use Supabase Auth** for user authentication

## Troubleshooting

### "Invalid credentials" error
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Ensure they match your Supabase project

### "Relation does not exist" error
- Run `database.schema.sql` in the Supabase SQL Editor
- Verify all tables were created successfully

### RLS Policy Issues
- Check the Supabase dashboard > Auth > Users to verify users exist
- Review RLS policies in Settings > Auth

## Next Steps

- Set up Supabase Auth for user authentication
- Create API endpoints for admin operations
- Build React components to interact with the database
- Add more tables as needed (teachers, lessons, grades, etc.)

## Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
