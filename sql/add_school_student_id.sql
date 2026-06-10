-- Add school-assigned student ID to students and applications tables
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS school_student_id VARCHAR(20) UNIQUE;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS school_student_id VARCHAR(20) UNIQUE;
