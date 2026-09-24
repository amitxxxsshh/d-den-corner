-- ============================================================
-- D DEN CORNER
-- Phase 3 - Ensure only one ACTIVE session per table
-- ============================================================

CREATE UNIQUE INDEX idx_one_active_table_session_per_table
    ON table_sessions(table_id)
    WHERE status = 'ACTIVE';