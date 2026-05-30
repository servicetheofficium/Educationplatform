-- Add student detail fields to students and applications tables

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS nationality     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS visa_status     VARCHAR(50)
    CHECK (visa_status IN ('processing','visa_changed','first_extension','second_extension','third_extension')),
  ADD COLUMN IF NOT EXISTS duration_months INTEGER;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS nationality     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS visa_status     VARCHAR(50)
    CHECK (visa_status IN ('processing','visa_changed','first_extension','second_extension','third_extension')),
  ADD COLUMN IF NOT EXISTS duration_months INTEGER;
