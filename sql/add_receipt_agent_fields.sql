-- Add Agent Information fields to receipts table
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS agent_name TEXT,
  ADD COLUMN IF NOT EXISTS agent_phone TEXT,
  ADD COLUMN IF NOT EXISTS agent_email TEXT,
  ADD COLUMN IF NOT EXISTS agent_nationality TEXT,
  ADD COLUMN IF NOT EXISTS agent_company_register_number TEXT,
  ADD COLUMN IF NOT EXISTS agent_note TEXT;
