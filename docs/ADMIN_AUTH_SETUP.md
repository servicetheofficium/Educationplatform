# 🔐 Admin Authentication System - Setup Guide

## ✅ What's Been Implemented

1. **Authentication Module** (`src/auth.ts`)
   - Login with email/password
   - Logout functionality
   - Create admin users
   - Get current user info

2. **Auth Hook** (`src/useAuth.ts`)
   - Manages authentication state
   - Real-time auth status updates
   - Automatic session check on app load

3. **Login Page** (`src/LoginPage.tsx`)
   - Beautiful, responsive login form
   - Error handling
   - Success feedback
   - Demo credentials helper

4. **Admin Dashboard** (`src/AdminDashboard.tsx`)
   - Admin-only view
   - Course management interface
   - Student statistics
   - Logout functionality

5. **Protected Routes** (Updated `src/App.tsx`)
   - Automatic redirect to login if not authenticated
   - Admin dashboard for authenticated users
   - Public site for non-authenticated users

---

## 🚀 Quick Start

### Step 1: Create an Admin Account

Go to your **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- First, enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create an admin user
INSERT INTO users (email, full_name, user_type)
VALUES ('admin@knc-school.com', 'Admin User', 'admin');
```

### Step 2: Set a Password

In Supabase Dashboard → **Authentication** → **Users**:
1. Find the admin user you just created
2. Click the menu (•••) → "Reset password"
3. Set a password (e.g., `AdminPassword123`)

### Step 3: Test Login

1. Visit `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter credentials:
   - Email: `admin@knc-school.com`
   - Password: (whatever you set)
4. Click "Login to Admin Panel"

---

## 📧 Features

### Login Page
- Email/password authentication
- Real-time error messages
- Loading states
- Success confirmation
- Demo credentials help text

### Admin Dashboard
- Welcome message with user's name
- Statistics dashboard (Courses, Students, Enrollments)
- Course management table
- Quick action cards
- Logout button

### Security
- Only admin users can access admin panel
- Session persists across page refreshes
- Automatic logout on session expiration
- Type-safe authentication

---

## 🔧 How It Works

1. **App loads** → `useAuth()` hook checks if user is logged in
2. **Not authenticated** → Show `LoginPage`
3. **Authenticated as admin** → Show `AdminDashboard`
4. **Authenticated as student** → Access denied (will be added later)
5. **Public users** → Can view public website

---

## 📝 Creating More Admin Users

```sql
INSERT INTO users (email, full_name, user_type)
VALUES ('another-admin@knc-school.com', 'Another Admin', 'admin');
```

Then set password in Supabase Authentication panel.

---

## 🐛 Troubleshooting

**Issue**: "Access denied. Admin users only."
- **Solution**: Make sure user_type is set to 'admin' in the database

**Issue**: "Login failed"
- **Solution**: Check email/password in Supabase Authentication panel

**Issue**: Blank screen after login
- **Solution**: Make sure admin user exists in `users` table with `user_type = 'admin'`

---

## 📚 Next Steps

Future enhancements:
- [ ] Student registration/login
- [ ] Course enrollment management
- [ ] Student dashboard
- [ ] Admin ability to create courses
- [ ] Admin ability to manage students
- [ ] Password reset functionality
- [ ] Two-factor authentication

---

## 📁 New Files Created

```
src/
  ├── auth.ts                    # Authentication functions
  ├── useAuth.ts                 # Authentication hook
  ├── LoginPage.tsx              # Login page component
  └── AdminDashboard.tsx         # Admin dashboard component
```

---

**Ready to test?** Refresh your browser and you should see the login page! 🎉
