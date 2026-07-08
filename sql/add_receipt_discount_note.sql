-- Add Agent Discount and Note fields to receipts table
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS agent_discount NUMERIC,
  ADD COLUMN IF NOT EXISTS receipt_note TEXT;
