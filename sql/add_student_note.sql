-- Add admin note field to students table

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS note TEXT;
