-- ============================================================
-- 06_seed_master.sql
-- Idempotent master-data seeds.
-- ON CONFLICT DO NOTHING — existing rows are left untouched.
-- ============================================================

INSERT INTO card_brands (code, display_name, first_digit, luhn_required, is_active) VALUES
    ('AMEX',       'American Express', '3', true, true),
    ('VISA',       'Visa',             '4', true, true),
    ('MASTERCARD', 'Mastercard',       '5', true, true),
    ('DISCOVER',   'Discover',         '6', true, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO currencies (code, display_name, minor_units, is_active) VALUES
    ('USD', 'US Dollar',              2, true),
    ('EUR', 'Euro',                   2, true),
    ('GBP', 'British Pound Sterling', 2, true),
    ('CAD', 'Canadian Dollar',        2, true),
    ('INR', 'Indian Rupee',           2, true)
ON CONFLICT (code) DO NOTHING;
