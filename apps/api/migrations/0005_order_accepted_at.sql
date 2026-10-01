PRAGMA foreign_keys = ON;

-- ============================================================
-- D DEN CORNER
-- Phase 5 - Order Acceptance Timestamp & Revenue Indexes
-- ============================================================

-- Add accepted_at column to orders table
ALTER TABLE orders ADD COLUMN accepted_at TEXT;

-- Backfill accepted_at from order_status_history for all orders that have reached ACCEPTED status
UPDATE orders
SET accepted_at = (
    SELECT created_at
    FROM order_status_history
    WHERE order_id = orders.id
      AND to_status = 'ACCEPTED'
    ORDER BY created_at ASC
    LIMIT 1
)
WHERE status IN ('ACCEPTED', 'PREPARING', 'READY', 'SERVED');

-- Fallback for any accepted order missing explicit 'ACCEPTED' status history record
UPDATE orders
SET accepted_at = created_at
WHERE status IN ('ACCEPTED', 'PREPARING', 'READY', 'SERVED')
  AND accepted_at IS NULL;

-- Create indexes for fast status, accepted_at, and dashboard aggregations
CREATE INDEX idx_orders_accepted_at
    ON orders(accepted_at);

CREATE INDEX idx_orders_status_accepted_at
    ON orders(status, accepted_at);
