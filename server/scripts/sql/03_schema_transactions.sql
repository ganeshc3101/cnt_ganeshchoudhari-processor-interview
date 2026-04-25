-- ============================================================
-- 03_schema_transactions.sql
-- Upload batches + accepted transactions + rejected transactions.
-- Card number stored ONLY as first4 + last4. Full PAN is never persisted.
-- Amount is NUMERIC(19,4) and MAY be negative (reversals / chargebacks).
-- ============================================================

-- Self-heal: earlier builds of this file created currency as CHAR(3),
-- which Postgres stores as bpchar and Hibernate rejects against VARCHAR(3).
-- Upgrade the column type in place if needed.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'transactions'
          AND column_name = 'currency' AND udt_name = 'bpchar'
    ) THEN
        ALTER TABLE transactions         ALTER COLUMN currency TYPE VARCHAR(3);
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rejected_transactions'
          AND column_name = 'currency' AND udt_name = 'bpchar'
    ) THEN
        ALTER TABLE rejected_transactions ALTER COLUMN currency TYPE VARCHAR(3);
    END IF;
END
$$;

-- ---------- transaction_batches ----------
CREATE TABLE IF NOT EXISTS transaction_batches (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    source          VARCHAR(16)    NOT NULL,
    file_name       VARCHAR(255),
    file_format     VARCHAR(16),
    file_size_bytes BIGINT,
    checksum        VARCHAR(128),
    total_rows      INTEGER        NOT NULL DEFAULT 0,
    accepted_rows   INTEGER        NOT NULL DEFAULT 0,
    rejected_rows   INTEGER        NOT NULL DEFAULT 0,
    status          VARCHAR(16)    NOT NULL DEFAULT 'PROCESSING',
    processed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_by      UUID,
    updated_by      UUID,
    version         BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT tb_source_chk       CHECK (source IN ('BATCH','MANUAL')),
    CONSTRAINT tb_status_chk       CHECK (status IN ('PROCESSING','COMPLETED','FAILED')),
    CONSTRAINT tb_file_format_chk  CHECK (file_format IS NULL OR file_format IN ('CSV','JSON','XML')),
    CONSTRAINT tb_rows_nonneg_chk  CHECK (total_rows >= 0 AND accepted_rows >= 0 AND rejected_rows >= 0),
    CONSTRAINT fk_tb_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tb_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tb_created_at ON transaction_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tb_created_by ON transaction_batches (created_by);
CREATE INDEX IF NOT EXISTS idx_tb_status     ON transaction_batches (status);
CREATE INDEX IF NOT EXISTS idx_tb_source     ON transaction_batches (source);

-- ---------- transactions (accepted) ----------
CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id            UUID,
    source              VARCHAR(16)     NOT NULL,
    card_first4         VARCHAR(4)      NOT NULL,
    card_last4          VARCHAR(4)      NOT NULL,
    card_brand          VARCHAR(16)     NOT NULL,
    cardholder_name     VARCHAR(120),
    amount              NUMERIC(19, 4)  NOT NULL,
    currency            VARCHAR(3)      NOT NULL DEFAULT 'USD',
    occurred_at         TIMESTAMPTZ     NOT NULL,
    external_reference  VARCHAR(64),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by          UUID,
    updated_by          UUID,
    version             BIGINT          NOT NULL DEFAULT 0,
    CONSTRAINT tx_source_chk     CHECK (source IN ('BATCH','MANUAL')),
    CONSTRAINT tx_card_brand_chk CHECK (card_brand IN ('VISA','MASTERCARD','AMEX','DISCOVER')),
    CONSTRAINT tx_first4_fmt_chk CHECK (card_first4 ~ '^[0-9]{4}$'),
    CONSTRAINT tx_last4_fmt_chk  CHECK (card_last4  ~ '^[0-9]{4}$'),
    CONSTRAINT fk_tx_batch       FOREIGN KEY (batch_id)   REFERENCES transaction_batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_tx_created_by  FOREIGN KEY (created_by) REFERENCES users(id)               ON DELETE SET NULL,
    CONSTRAINT fk_tx_updated_by  FOREIGN KEY (updated_by) REFERENCES users(id)               ON DELETE SET NULL
);

-- Dashboard / pagination / filter indexes.
CREATE INDEX IF NOT EXISTS idx_tx_occurred_at   ON transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_card_brand    ON transactions (card_brand);
CREATE INDEX IF NOT EXISTS idx_tx_batch_id      ON transactions (batch_id);
CREATE INDEX IF NOT EXISTS idx_tx_source        ON transactions (source);
CREATE INDEX IF NOT EXISTS idx_tx_created_by    ON transactions (created_by, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_created_at    ON transactions (created_at DESC);
-- Supports "daily accepted volume" aggregation without a full scan.
-- date_trunc(text, timestamptz) is not IMMUTABLE (session-TZ-dependent);
-- casting via `AT TIME ZONE 'UTC'` yields a plain timestamp, which is.
CREATE INDEX IF NOT EXISTS idx_tx_occurred_day
    ON transactions ((date_trunc('day', occurred_at AT TIME ZONE 'UTC')));

-- ---------- rejected_transactions ----------
CREATE TABLE IF NOT EXISTS rejected_transactions (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                UUID,
    source                  VARCHAR(16)     NOT NULL,
    row_number              INTEGER,
    card_first4             VARCHAR(4),
    card_last4              VARCHAR(4),
    cardholder_name         VARCHAR(120),
    amount                  NUMERIC(19, 4),
    currency                VARCHAR(3),
    occurred_at             TIMESTAMPTZ,
    external_reference      VARCHAR(64),
    reason_code             VARCHAR(32)     NOT NULL,
    reason_message          TEXT,
    raw_payload             JSONB,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by              UUID,
    CONSTRAINT rt_source_chk       CHECK (source IN ('BATCH','MANUAL')),
    CONSTRAINT rt_reason_code_chk  CHECK (reason_code IN (
        'INVALID_CARD_BRAND',
        'LUHN_FAIL',
        'MISSING_FIELD',
        'INVALID_AMOUNT',
        'INVALID_TIMESTAMP',
        'DUPLICATE',
        'PARSE_ERROR',
        'OTHER'
    )),
    CONSTRAINT rt_first4_fmt_chk CHECK (card_first4 IS NULL OR card_first4 ~ '^[0-9]{4}$'),
    CONSTRAINT rt_last4_fmt_chk  CHECK (card_last4  IS NULL OR card_last4  ~ '^[0-9]{4}$'),
    CONSTRAINT fk_rt_batch       FOREIGN KEY (batch_id)   REFERENCES transaction_batches(id) ON DELETE SET NULL,
    CONSTRAINT fk_rt_created_by  FOREIGN KEY (created_by) REFERENCES users(id)               ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_rt_created_at   ON rejected_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rt_batch_id     ON rejected_transactions (batch_id);
CREATE INDEX IF NOT EXISTS idx_rt_reason_code  ON rejected_transactions (reason_code);
CREATE INDEX IF NOT EXISTS idx_rt_occurred_at  ON rejected_transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_rt_source       ON rejected_transactions (source);
