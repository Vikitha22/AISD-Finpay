# AISD • LABORATORY 4 • FINPAY DIGITAL WALLET
## AI-Assisted Detailed Design: Data Design • Algorithm Design • Security Design
### FinPay Campus Digital Wallet and Payment System

---

### Student / Team Details

| Item | Details |
| :--- | :--- |
| **Team Number** | ________________________ |
| **Student Name(s)** | Rahul Sharma / Priya Patel / Vikram Malhotra |
| **SRN(s)** | PES1UG20CS001 / PES1UG20CS042 / PES1UG20CS099 |
| **Roll Number(s)** | ________________________ |
| **Course / Section** | AISD — Section A |

---

## 1. Executive Summary & Architecture Overview

FinPay is an end-to-end campus digital wallet that:
1. Processes student payments to campus merchants across 6 categories.
2. Calculates tier- and category-based cashback in real-time.
3. Strictly floors fractional paise and stores all balances as integer paise to prevent floating-point drift.
4. Enforces monthly category cashback ceilings.
5. Eliminates duplicate payment risks using HTTP `Idempotency-Key` headers.
6. Provides automated monthly financial reconciliation and ledger discrepancy auditing.

```
Layered Architecture:
[ Client UI / POS Terminal / Idempotency Lab ]
                  │
                  ▼ (HTTP / JSON / JWT / Idempotency-Key)
         [ Express.js Routers ]
                  │
                  ▼
         [ Service Layer ]
     ├── calculate_cashback()  [Pure Math, 0 DB access]
     ├── process_payment()     [ACID Orchestration & Caps]
     ├── wallet_service        [Balance & Top-up]
     └── reconciliation_service[Monthly Auditing]
                  │
                  ▼
       [ Repository Layer ]
                  │
                  ▼
 [ SQLite Relational Database (WAL Mode, BCNF) ]
```

---

## 2. Part A – Data Design & Normalization Proof

### A. Approved Relational Schema (BCNF)

```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  balance_paise INTEGER NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  tier TEXT NOT NULL CHECK (tier IN ('BASIC', 'PRIME', 'PREMIUM')) DEFAULT 'BASIC',
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE category_rules (
  category TEXT PRIMARY KEY CHECK (category IN ('Canteen', 'Stationery', 'Transport', 'Hostel', 'Online', 'Top-up')),
  basic_rate_basis_points INTEGER NOT NULL,
  basic_monthly_cap_paise INTEGER NOT NULL
);

CREATE TABLE tier_multipliers (
  tier TEXT PRIMARY KEY CHECK (tier IN ('BASIC', 'PRIME', 'PREMIUM')),
  rate_multiplier_basis_points INTEGER NOT NULL,
  cap_multiplier_basis_points INTEGER NOT NULL
);

CREATE TABLE merchants (
  id TEXT PRIMARY KEY,
  merchant_code TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES category_rules(category),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE transactions (
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

CREATE TABLE idempotency_records (
  idempotency_key TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  request_hash TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### B. Normalization Sequential Proof (1NF → 2NF → 3NF → BCNF)

#### 1NF (First Normal Form)
- **Requirement**: Attributes must contain only atomic, non-divisible values; no repeating groups.
- **Proof**: All monetary fields are stored as atomic `INTEGER` paise ($100 \text{ paise} = \text{₹}1.00$). Category rates and caps are decoupled into atomic basis points. No composite strings or comma-separated lists are stored.

#### 2NF (Second Normal Form)
- **Requirement**: Must be in 1NF and every non-prime attribute must be fully functionally dependent on the entire primary key (no partial dependencies on a composite candidate key).
- **Proof**: All tables use single-attribute primary keys (`id`, `category`, `tier`, `idempotency_key`). Therefore, partial key dependencies are mathematically impossible.

#### 3NF (Third Normal Form)
- **Requirement**: Must be in 2NF and have no transitive dependencies ($X \to Y$ where $Y$ depends on a non-candidate-key attribute $X$).
- **Proof**: Category rates (`basic_rate_basis_points`, `basic_monthly_cap_paise`) and tier multipliers (`rate_multiplier_basis_points`, `cap_multiplier_basis_points`) are not duplicated within `transactions` or `wallets`. Instead, they are resolved via their determinant primary keys in `category_rules` and `tier_multipliers`.

#### BCNF (Boyce-Codd Normal Form)
- **Requirement**: For every non-trivial functional dependency $X \to Y$, $X$ must be a superkey.
- **Proof**:
  - `students`: $\text{id} \to \{\text{student\_id}, \text{full\_name}, \text{email}, \dots\}$; $\text{email} \to \text{id}$; both are candidate keys.
  - `wallets`: $\text{id} \to \{\text{student\_id}, \text{balance\_paise}, \dots\}$; $\text{student\_id} \to \text{id}$; both are candidate keys.
  - `category_rules`: $\text{category}$ is a superkey.
  - `tier_multipliers`: $\text{tier}$ is a superkey.
  - `transactions`: $\text{id}$ is a superkey.
  - `idempotency_records`: $\text{idempotency\_key}$ is a superkey.
  - *Conclusion*: The relational schema strictly satisfies **BCNF**.

---

## 3. Part B – AI-Assisted Algorithm Design

### A. Pure Cashback Calculation (`calculate_cashback`)
*Pure function with zero database access and zero external state mutations.*

```typescript
export function calculate_cashback(
  amount_paise: number,
  category: MerchantCategory,
  tier: WalletTier
): number {
  if (amount_paise <= 0 || category === 'Top-up') {
    return 0;
  }

  const basic_rate = BASIC_RATES[category] ?? 0;
  const rate_multiplier = TIER_MULTIPLIERS[tier]?.rate ?? 1.0;
  const effective_rate = basic_rate * rate_multiplier;

  // Strict integer floor operation
  return Math.floor(Math.round((amount_paise * effective_rate) * 1e8) / 1e8);
}
```

### B. Payment Process Algorithm (`process_payment`)
```
FUNCTION process_payment(request)
  VALIDATE request (amount > 0, valid merchant, non-empty key)
  
  // Idempotency Check
  IF idempotency_key in DB THEN
    IF request_hash == existing.request_hash THEN
      RETURN cached_response (HTTP 200)
    ELSE
      THROW ConflictError (HTTP 409)
    END IF
  END IF

  LOAD student_wallet, merchant
  VERIFY wallet.status == 'ACTIVE' AND merchant.is_active == 1
  VERIFY wallet.balance_paise >= amount_paise (ELSE THROW InsufficientBalance)

  raw = calculate_cashback(amount_paise, merchant.category, wallet.tier)

  earned_this_month = SUM(awarded_cashback) for this wallet, category, current calendar month
  cap = BASIC_CAP(category) * CAP_MULTIPLIER(wallet.tier)
  remaining = MAX(0, cap - earned_this_month)
  awarded = MIN(raw, remaining)

  BEGIN IMMEDIATE TRANSACTION
    new_balance = wallet.balance_paise - amount_paise + awarded
    UPDATE wallet SET balance_paise = new_balance
    INSERT INTO transactions (amount, raw_cashback, awarded_cashback, balance_after, ...)
    INSERT INTO idempotency_records (key, hash, response_body, ...)
  COMMIT TRANSACTION

  RETURN payment_result
END FUNCTION
```

### C. Boundary & Verification Cases (Passed in Unit Tests)
- **₹100 Canteen Payment (BASIC)**: $\text{Raw} = 10,000 \times 0.02 = 200 \text{ paise} = \text{₹}2.00$.
- **Fractional Paise Truncation**: $333 \times 0.02 = 6.66 \text{ paise} \implies \lfloor 6.66 \rfloor = 6 \text{ paise}$ (NOT 7 paise).
- **PRIME Tier Multiplier**: $10,000 \times (0.02 \times 1.5) = 300 \text{ paise} = \text{₹}3.00$; Cap is $5000 \times 1.5 = 7500 \text{ paise}$.
- **PREMIUM Tier Multiplier**: $10,000 \times (0.02 \times 2.0) = 400 \text{ paise} = \text{₹}4.00$; Cap is $5000 \times 2.0 = 10,000 \text{ paise}$.
- **Top-up**: 0% cashback regardless of tier.
- **Idempotency Retry**: Returning identical payload returns cached result without re-debiting.
- **Idempotency Alteration**: Reusing key with different amount throws `409 Conflict`.
- **Monthly Cap Exhaustion**: When cap is fully consumed, awarded cashback is 0 paise.
- **Partial Cap Award**: When remaining cap is 100 paise and raw cashback is 500 paise, exactly 100 paise is awarded.

---

## 4. Part C – AI-Assisted Security & Layered Architecture

1. **Self-Contained Authentication**:
   - Secure student registration with password hashing (`bcryptjs` with salt factor 10).
   - Signed JSON Web Tokens (`HS256`, 7-day expiration).
2. **Resource Ownership Authorization**:
   - Authorization middleware verifies `req.user.id` matches the accessed wallet. Students cannot inspect or spend from other students' wallets.
3. **Monetary Integrity**:
   - Zero floating-point arithmetic.
   - All balance updates run within atomic SQLite `BEGIN IMMEDIATE` transactions with foreign key enforcement (`PRAGMA foreign_keys = ON`).
4. **Monthly Reconciliation & Auditing**:
   - Built-in monthly audit report engine that verifies category volumes, compares raw calculated cashback against actual awarded cashback, and guarantees zero balance anomalies.

