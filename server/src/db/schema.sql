-- FinPay Relational BCNF Schema
-- AISD Laboratory 4 Detailed Design Record (DDR)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  balance_paise INTEGER NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  tier TEXT NOT NULL CHECK (tier IN ('BASIC', 'PRIME', 'PREMIUM')) DEFAULT 'BASIC',
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS category_rules (
  category TEXT PRIMARY KEY CHECK (category IN ('Canteen', 'Stationery', 'Transport', 'Hostel', 'Online', 'Top-up')),
  basic_rate_basis_points INTEGER NOT NULL,
  basic_monthly_cap_paise INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tier_multipliers (
  tier TEXT PRIMARY KEY CHECK (tier IN ('BASIC', 'PRIME', 'PREMIUM')),
  rate_multiplier_basis_points INTEGER NOT NULL,
  cap_multiplier_basis_points INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY,
  merchant_code TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES category_rules(category),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  merchant_id TEXT REFERENCES merchants(id),
  category TEXT NOT NULL REFERENCES category_rules(category),
  type TEXT NOT NULL CHECK (type IN ('PAYMENT', 'TOPUP', 'REFUND')),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  raw_cashback_paise INTEGER NOT NULL DEFAULT 0 CHECK (raw_cashback_paise >= 0),
  awarded_cashback_paise INTEGER NOT NULL DEFAULT 0 CHECK (awarded_cashback_paise >= 0),
  balance_after_paise INTEGER NOT NULL CHECK (balance_after_paise >= 0),
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'REVERSED')) DEFAULT 'SUCCESS',
  idempotency_key TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  idempotency_key TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Indices for rapid queries, monthly reconciliation, and ledger lookups
CREATE INDEX IF NOT EXISTS idx_wallets_student ON wallets(student_id);
CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_tx_merchant ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_tx_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_tx_idempotency ON transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idem_student ON idempotency_records(student_id);

