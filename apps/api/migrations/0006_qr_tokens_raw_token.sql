-- ============================================================
-- D DEN CORNER
-- Add raw_token column to qr_tokens
-- Allows staff to view and copy the table's permanent ordering URL
-- while preserving token_hash for lookup and verification.
-- ============================================================

ALTER TABLE qr_tokens ADD COLUMN raw_token TEXT;
