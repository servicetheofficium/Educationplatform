INSERT INTO users (id, email, full_name, user_type, password_hash) 
VALUES ('54300088-3c15-4eb0-a3dd-4f057342c632', 'adminschool@gmail.com', 'Admin User', 'admin', 'placeholder');

-- Verify it was created
SELECT id, email, full_name, user_type FROM users WHERE email = 'adminschool@gmail.com';
