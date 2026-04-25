-- ============================================================
-- 00_reset_legacy.sql
-- Safe cleanup of the first-cut skeleton schema (Long ids, full
-- card_number column) so the new UUID-based design can be applied.
--
-- This block runs ONLY if the old shape is detected; otherwise it
-- is a no-op. Never drops the new tables.
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'transactions'
          AND column_name  = 'card_number'
    ) THEN
        RAISE NOTICE 'Legacy skeleton schema detected — dropping old transactions / rejected_transactions tables.';
        DROP TABLE IF EXISTS rejected_transactions CASCADE;
        DROP TABLE IF EXISTS transactions          CASCADE;
    END IF;
END
$$;
