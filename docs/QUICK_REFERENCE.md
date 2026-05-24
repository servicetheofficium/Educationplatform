# 🚀 Supabase Setup - Quick Reference Guide

## 📁 Files Created

```
knc-language-school/
├── .env.local (updated)                      # Environment variables
├── database.schema.sql                       # Database schema & tables
├── SUPABASE_SETUP.md                         # Step-by-step setup guide
├── DATABASE_SCHEMA.md                        # Schema details & ERD
├── SETUP_SUMMARY.md                          # Complete overview
├── src/
│   ├── supabase.ts                           # Supabase client & types
│   ├── hooks.ts                              # React hooks for data fetching
│   ├── database.operations.ts                # All CRUD operations
│   └── COMPONENT_EXAMPLES.tsx                # React component examples
```

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Supabase Project
```
1. Go to https://supabase.com
2. Click "Sign Up" and create an account
3. Create a new project
4. Wait for initialization (2-3 minutes)
```

### Step 2: Get API Keys
```
1. Open Supabase dashboard
2. Go to Settings → API
3. Copy "Project URL"
4. Copy "Anon public" key
```

### Step 3: Configure Environment
```
Edit .env.local:

VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
```

### Step 4: Create Database Tables
```
1. In Supabase, go to SQL Editor
2. Click "New Query"
3. Copy entire contents of database.schema.sql
4. Paste into editor
5. Click "Run" ✓
```

### Step 5: Install Package
```bash
npm install @supabase/supabase-js
```

## 📊 Database Overview

| Table | Purpose | Records |
|-------|---------|---------|
| users | User auth & profiles | Admin, Students |
| students | Student details | Student data |
| courses | Available courses | Course listings |
| student_courses | Enrollments | Course registrations |

## 🎯 Common Operations

### Fetch All Courses
```typescript
import { useCourses } from './hooks';

const { courses, loading, error } = useCourses();
```

### Get Courses by Language
```typescript
import { useCoursesByLanguage } from './hooks';

const { courses } = useCoursesByLanguage('English');
```

### Enroll Student in Course
```typescript
import { useEnrollStudent } from './hooks';

const { enroll } = useEnrollStudent();
await enroll(studentId, courseId);
```

### Get Student Enrollments
```typescript
import { useStudentEnrollments } from './hooks';

const { enrollments } = useStudentEnrollments(studentId);
```

### Using Database Operations Directly
```typescript
import * as db from './database.operations';

// Get all courses
const courses = await db.getAllCourses();

// Enroll student
const enrollment = await db.enrollStudent(studentId, courseId);

// Get student dashboard
const dashboard = await db.getStudentDashboard(studentId);
```

## 🔐 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Students can only see their own data
- ✅ Courses are publicly viewable
- ✅ Email uniqueness enforced
- ✅ Foreign key constraints active

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY |
| "Relation does not exist" | Run database.schema.sql in Supabase SQL Editor |
| Module not found | Run `npm install @supabase/supabase-js` |
| Cannot see data | Check RLS policies in Supabase |

## 📚 Documentation Files

- **SUPABASE_SETUP.md** - Detailed setup instructions
- **DATABASE_SCHEMA.md** - Schema diagram & column definitions
- **SETUP_SUMMARY.md** - Complete implementation overview
- **COMPONENT_EXAMPLES.tsx** - React component usage examples
- **src/database.operations.ts** - All available functions with docs

## 💡 Pro Tips

1. **Test locally** before deploying to production
2. **Keep .env.local private** - Never commit to git
3. **Use TypeScript types** - Import from `supabase.ts`
4. **Handle errors** - Always check for null/error responses
5. **Test RLS policies** - Verify security before launch

## 🧪 Test Your Setup

Run this in your browser console after setup:

```javascript
import { supabase } from './src/supabase';

// Test connection
const { data, error } = await supabase.from('courses').select('count');
console.log(data, error);  // Should show: [{ count: null }] null
```

## 📞 Need Help?

1. Check **SUPABASE_SETUP.md** for detailed instructions
2. See **COMPONENT_EXAMPLES.tsx** for code samples
3. Review **DATABASE_SCHEMA.md** for table structure
4. Visit [Supabase Docs](https://supabase.com/docs) for official help

## ✨ What's Next?

After setup, you can:
- ✅ Display courses in React components
- ✅ Allow students to enroll in courses
- ✅ Build student dashboard
- ✅ Add admin course management
- ✅ Extend schema with teachers, grades, schedules, etc.

---

**Status**: ✅ Ready to use after running database.schema.sql

**Version**: 1.0 - Language School Edition

**Tables**: 4 (users, students, courses, student_courses)

**Security**: RLS Policies Enabled
