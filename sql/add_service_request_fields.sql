-- Add nationality and passport_number to service_requests

ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS nationality     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
