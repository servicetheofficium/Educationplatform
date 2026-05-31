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

-- ─── DOCUMENT SERVICES ───────────────────────────────────────

INSERT INTO document_services (name, price_display, price_thb, detail, processing_time, note, category, icon_name, sort_order)
VALUES
  ('Immigration Form Completion',       '800 THB',       800,  'per set / per request',            NULL,                          'Submit in person with payment', 'document', 'FileText',   1),
  ('Urgent Document Processing',        '800 THB',       800,  'per request',                       'Within 7 Business Days',      'Submit in person with payment', 'document', 'Zap',        2),
  ('Standard Document Processing',      '500 THB',       500,  'per request',                       'Within 15 Business Days',     'Submit in person with payment', 'document', 'Clock',      3),
  ('Student ID Card',                   '300 THB',       300,  'per card',                          '7 Business Days',             NULL,                            'document', 'CreditCard', 4),
  ('Photo Service',                     '150 THB',       150,  'per 6 photos',                      'Photography service included', NULL,                           'document', 'Camera',     5),
  ('Bank Document Service',             '700 THB',       700,  NULL,                                '7 Business Days',             NULL,                            'document', 'Building2',  6),
  ('Bank Document + Student ID Package','1,000 THB',    1000,  NULL,                                '7 Business Days',             NULL,                            'document', 'Building2',  7),
  ('SIM Card',                          '300 THB',       300,  'for students without Thai number',  'Prices may change without notice', NULL,                       'document', 'Smartphone', 8),
  ('Textbooks',                         '500 THB',       500,  'per book',                          NULL,                          NULL,                            'document', 'BookOpen',   9),
  ('Black & White Copies',              '3 THB / page',    3,  NULL,                                NULL,                          NULL,                            'copy',     'Copy',       10),
  ('Color Copies',                      '10 THB / page',  10,  NULL,                                NULL,                          NULL,                            'copy',     'Copy',       11),
  ('Color Scanning',                    '10 THB / page',  10,  NULL,                                NULL,                          NULL,                            'copy',     'Copy',       12)
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
