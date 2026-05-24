```
╔════════════════════════════════════════════════════════════════════════╗
║                    KNC LANGUAGE SCHOOL - APP STRUCTURE                 ║
╚════════════════════════════════════════════════════════════════════════╝

USER VISITS WEBSITE
        │
        ├─────────────────────────────────────────┐
        │                                         │
        ↓                                         ↓
   URL = /                                   URL = /admin
   (any path without /admin)                 (admin login path)
        │                                         │
        ├─────────────────────────────────────┐   │
        │ Detected by main.tsx                │   │
        │ Route Detection Logic               │   │
        └──────────────┬──────────────────────┘   │
                       ↓                          ↓
              ┌───────────────────┐    ┌──────────────────┐
              │  App.tsx          │    │  AdminArea.tsx   │
              │  (Landing Page)   │    │  (Admin Router)  │
              └───────────────────┘    └──────────────────┘
                      │                        │
    ┌─────────────────┼─────────────────┐     │
    ↓                 ↓                 ↓     │
[Navbar]        [Courses]        [Features]  │
[About]         [Contact]         [CTA]      │
"Admin" Link ────────────────────────────→   │
                                             ↓
                                    Is User Authenticated?
                                      /              \
                                    Yes              No
                                    /                 \
                                   ↓                   ↓
                        ┌─────────────────┐  ┌──────────────┐
                        │ AdminDashboard  │  │ LoginPage    │
                        ├─────────────────┤  ├──────────────┤
                        │ • Manage Courses│  │ • Email field│
                        │ • View Students │  │ • Password   │
                        │ • Statistics    │  │ • Submit btn │
                        │ • Logout        │  │ • Back Home  │
                        └─────────────────┘  └──────────────┘
                            │                        │
                            │ Logout                 │ Back to Home
                            │                        │
                            └────────────┬───────────┘
                                        ↓
                                  Landing Page (/)


╔═══════════════════════════════════════════════════════════════════════╗
║                            NAVIGATION FLOWS                            ║
╚═══════════════════════════════════════════════════════════════════════╝

PUBLIC USER FLOW:
─────────────────
    [Landing Page]
         ↓ Browse
    View Courses & About
         ↓ Click Admin
    [Admin Login Page]
         ↓ Click Back
    [Landing Page]
    

ADMIN USER FLOW:
────────────────
    [Landing Page]
         ↓ Click Admin
    [Admin Login Page]
         ↓ Enter Credentials
    [Admin Dashboard]
         ↓ Manage & View
    Courses & Students
         ↓ Logout
    [Landing Page]


╔═══════════════════════════════════════════════════════════════════════╗
║                           FILE ORGANIZATION                            ║
╚═══════════════════════════════════════════════════════════════════════╝

src/
│
├── main.tsx ◄── ROUTE DETECTION
│   ├─ if /admin → show AdminArea
│   └─ else → show App
│
├── App.tsx ◄── PUBLIC LANDING PAGE
│   ├─ Navbar (with Admin link)
│   ├─ Hero Section
│   ├─ Courses Display
│   ├─ Features Section
│   ├─ About Section
│   └─ Contact Section
│
├── AdminArea.tsx ◄── ADMIN ROUTER (NEW FILE)
│   ├─ Check Authentication
│   ├─ Show LoginPage if not auth
│   └─ Show AdminDashboard if auth
│
├── LoginPage.tsx ◄── ADMIN LOGIN
│   ├─ Email Input
│   ├─ Password Input
│   └─ Back to Home Button
│
├── AdminDashboard.tsx ◄── ADMIN DASHBOARD
│   ├─ Dashboard Header
│   ├─ Course Management
│   ├─ Statistics
│   └─ Logout Button
│
├── auth.ts ◄── AUTH FUNCTIONS
│   ├─ login()
│   ├─ logout()
│   ├─ getCurrentUser()
│   └─ createAdminUser()
│
└── useAuth.ts ◄── AUTH STATE HOOK
    ├─ useAuth() hook
    └─ Auth state management


╔═══════════════════════════════════════════════════════════════════════╗
║                          ROUTE TABLE                                   ║
╚═══════════════════════════════════════════════════════════════════════╝

URL                          Component           Auth Required   Display
────────────────────────────────────────────────────────────────────────
/                            App                 No              Landing
/admin                       LoginPage           No              Login Form
/admin (when logged in)      AdminDashboard      Yes             Dashboard
/courses                     App                 No              Landing
/about                       App                 No              Landing
/contact                     App                 No              Landing
/any-other-path              App                 No              Landing


╔═══════════════════════════════════════════════════════════════════════╗
║                        COMPONENT HIERARCHY                             ║
╚═══════════════════════════════════════════════════════════════════════╝

index.html
    │
    └─ React Root (id="root")
            │
            ├─ main.tsx (Route Detection)
            │
            ├─ App (for /) ─────────┬─ Navbar
            │                       ├─ Hero
            │                       ├─ Courses
            │                       ├─ Features
            │                       ├─ About
            │                       └─ Contact
            │
            └─ AdminArea (for /admin)
                        │
                        ├─ LoginPage ───┬─ Back Button
                        │               ├─ Email Input
                        │               └─ Password Input
                        │
                        └─ AdminDashboard ─┬─ Header
                                          ├─ Stats
                                          ├─ Courses Table
                                          └─ Logout


╔═══════════════════════════════════════════════════════════════════════╗
║                          DATA FLOW                                     ║
╚═══════════════════════════════════════════════════════════════════════╝

LOGIN FLOW:
───────────
User enters credentials
        ↓
        ├─ auth.ts: login()
        │   └─ Call Supabase Auth
        │       └─ Validate credentials
        │       └─ Get JWT token
        │
        └─ Get user profile
           └─ Query users table
           └─ Check user_type = 'admin'
           └─ Store in auth state

AUTHENTICATED STATE:
────────────────────
useAuth hook
    │
    ├─ Check Supabase session
    ├─ Fetch user from database
    ├─ Set isAuthenticated = true
    └─ Return user data

LOGOUT FLOW:
────────────
User clicks logout
        ↓
        └─ auth.ts: logout()
           └─ Call supabase.auth.signOut()
           └─ Clear session
           └─ Clear user state
           └─ Redirect to home
```

---

## Key Points

✅ **Complete Separation**
- Landing Page (/) - Always accessible
- Admin Area (/admin) - Only for authenticated admins

✅ **Route Detection**
- main.tsx checks URL
- Renders correct component
- Simple and maintainable

✅ **Auth Flow**
- Supabase handles authentication
- useAuth hook manages state
- Database RLS protects data

✅ **Easy to Extend**
- Add /student route
- Add /signup route
- Keep landing page unchanged
