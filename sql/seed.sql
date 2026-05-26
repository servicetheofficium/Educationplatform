-- =============================================================
-- KNC Education Platform — Seed Data
-- Run after setup.sql. Inserts sample courses and admin user.
-- =============================================================

-- ─── SAMPLE COURSES ──────────────────────────────────────────

INSERT INTO courses (name, description, language, level, max_students, duration_weeks, price, image_url)
VALUES
  (
    'General English — Beginner',
    'Start your English journey from scratch. Focus on everyday conversation, basic grammar, and essential vocabulary for daily life.',
    'English', 'beginner', 20, 24, 299.00,
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800'
  ),
  (
    'General English — Intermediate',
    'Build fluency and confidence. Covers business communication, IELTS preparation modules, and advanced reading comprehension.',
    'English', 'intermediate', 20, 24, 349.00,
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800'
  ),
  (
    'Thai Language & Culture — Beginner',
    'Learn Thai tones, basic script, and essential survival phrases. Includes cultural etiquette and visa documentation support.',
    'Thai', 'beginner', 15, 24, 279.00,
    'https://images.unsplash.com/photo-1528642463367-8d7bd31a47e9?auto=format&fit=crop&q=80&w=800'
  ),
  (
    'Thai Language & Culture — Intermediate',
    'Deepen your Thai fluency. Covers reading & writing the full script, business Thai, and cultural immersion excursions.',
    'Thai', 'intermediate', 15, 24, 329.00,
    'https://images.unsplash.com/photo-1528642463367-8d7bd31a47e9?auto=format&fit=crop&q=80&w=800'
  )
ON CONFLICT DO NOTHING;

-- ─── ADMIN USER ──────────────────────────────────────────────
-- IMPORTANT: The admin must be created in Supabase Auth first.
-- Steps:
--   1. Go to Supabase Dashboard → Authentication → Users → Add User
--   2. Create user with your admin email and a strong password
--   3. Copy the generated UUID
--   4. Replace '<ADMIN_AUTH_UUID>' and '<ADMIN_EMAIL>' below, then run:

-- INSERT INTO profiles (id, email, full_name, user_type)
-- VALUES (
--   '<ADMIN_AUTH_UUID>',
--   '<ADMIN_EMAIL>',
--   'Admin User',
--   'admin'
-- )
-- ON CONFLICT (id) DO UPDATE SET user_type = 'admin';

-- ─── QUICK INSERT (if you already have the UUID) ─────────────
-- For project bjxyknsqxdluvuzwssht, uncomment and edit:
--
-- INSERT INTO profiles (id, email, full_name, user_type)
-- VALUES ('54300088-3c15-4eb0-a3dd-4f057342c632', 'adminschool@gmail.com', 'Admin User', 'admin')
-- ON CONFLICT (id) DO UPDATE SET user_type = 'admin';
