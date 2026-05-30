-- Add visa change date and visa last date to students and applications

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS visa_change_date DATE,
  ADD COLUMN IF NOT EXISTS visa_last_date   DATE;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS visa_change_date DATE,
  ADD COLUMN IF NOT EXISTS visa_last_date   DATE;
