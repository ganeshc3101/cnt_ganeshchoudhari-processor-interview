-- ============================================================
-- 05_schema_master.sql
-- Master / reference tables. Natural PKs by convention.
-- ============================================================

CREATE TABLE IF NOT EXISTS card_brands (
    code            VARCHAR(16)   PRIMARY KEY,
    display_name    VARCHAR(64)   NOT NULL,
    first_digit     CHAR(1)       NOT NULL UNIQUE,
    luhn_required   BOOLEAN       NOT NULL DEFAULT true,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS currencies (
    code            CHAR(3)       PRIMARY KEY,
    display_name    VARCHAR(64)   NOT NULL,
    minor_units     SMALLINT      NOT NULL DEFAULT 2,
    is_active       BOOLEAN       NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT currencies_minor_units_chk CHECK (minor_units >= 0 AND minor_units <= 4)
);
