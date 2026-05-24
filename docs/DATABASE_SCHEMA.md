# Database Schema Diagram & Structure

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ password_hash   │
│ full_name       │
│ user_type       │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────┐
│   students      │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ enrollment_date │
│ phone           │
│ address         │
│ language_level  │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:M
         │
         ▼
┌─────────────────────────────┐
│   student_courses           │
├─────────────────────────────┤
│ id (PK)                     │
│ student_id (FK) ────────┐   │
│ course_id (FK) ───────┐ │   │
│ enrollment_date       │ │   │
│ status                │ │   │
│ created_at            │ │   │
│ updated_at            │ │   │
└───────────────────────┼─┼───┘
                        │ │
                        │ │
                 ┌──────┘ │
                 │        └──────┐
                 │               │
         ┌───────▼──────┐   ┌────▼────────┐
         │   students   │   │   courses   │
         └──────────────┘   ├─────────────┤
                            │ id (PK)     │
                            │ name        │
                            │ description │
                            │ language    │
                            │ level       │
                            │ max_students│
                            │ duration_ws │
                            │ price       │
                            │ created_at  │
                            │ updated_at  │
                            └─────────────┘
```

## Column Definitions

### users Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier (primary key) |
| email | VARCHAR(255) | User email address (unique) |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| full_name | VARCHAR(255) | Full name of the user |
| user_type | VARCHAR(50) | 'student' or 'admin' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### students Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier (primary key) |
| user_id | UUID | Foreign key to users table |
| enrollment_date | DATE | Date student enrolled |
| phone | VARCHAR(20) | Student phone number |
| address | TEXT | Student address |
| language_level | VARCHAR(50) | 'beginner', 'intermediate', or 'advanced' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### courses Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier (primary key) |
| name | VARCHAR(255) | Course name |
| description | TEXT | Course description |
| language | VARCHAR(100) | Language taught (e.g., 'English', 'Spanish') |
| level | VARCHAR(50) | 'beginner', 'intermediate', or 'advanced' |
| max_students | INTEGER | Maximum enrollment capacity |
| duration_weeks | INTEGER | Course duration in weeks |
| price | DECIMAL(10, 2) | Course price |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### student_courses Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier (primary key) |
| student_id | UUID | Foreign key to students table |
| course_id | UUID | Foreign key to courses table |
| enrollment_date | DATE | Date of enrollment |
| status | VARCHAR(50) | 'active', 'completed', or 'dropped' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Relationships

1. **users ↔ students** (1:1)
   - Each user can have one student profile
   - Enforced by unique constraint on user_id in students table

2. **students ↔ student_courses** (1:M)
   - One student can have many course enrollments

3. **courses ↔ student_courses** (1:M)
   - One course can have many student enrollments

## Indexes
- `idx_users_email` - On users(email)
- `idx_students_user_id` - On students(user_id)
- `idx_courses_language` - On courses(language)
- `idx_student_courses_student_id` - On student_courses(student_id)
- `idx_student_courses_course_id` - On student_courses(course_id)
- `idx_student_courses_status` - On student_courses(status)

## Row Level Security (RLS)

- **Students Table**: Students can only view/update their own profile
- **Student Courses Table**: Students can only view their own enrollments
- **Courses Table**: All authenticated users can view courses
- **Users Table**: Protected by default (managed by Supabase Auth)

## Constraints
- Email uniqueness in users table
- student_id is unique in students table (1:1 with users)
- Unique combination of (student_id, course_id) in student_courses (prevents duplicate enrollments)
- Foreign key constraints maintain referential integrity
- CHECK constraints validate enum values
