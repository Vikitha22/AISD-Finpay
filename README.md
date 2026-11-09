# FinPay — Campus Digital Wallet and Payment System
### AISD Laboratory 4 • Full-Stack AI-Assisted Implementation

---

## ⚡ Quick Start

### 1. Run Automated Test Suite
To run all 17 unit and integration tests (pure cashback math, boundary cases, idempotency caching, cap enforcement, and monthly reconciliation):

```bash
npm run test:server
```

### 2. Start Full-Stack Application
To start the backend API server and frontend together:

```bash
# Terminal 1: Backend API (runs on http://localhost:4000)
npm run dev:server

# Terminal 2: Modern React Client (runs on http://localhost:5173)
npm run dev:client
```

*Note: Since the production client bundle is already pre-compiled into `client/dist/`, running `npm run dev:server` alone serves the full application on `http://localhost:4000` directly!*

---

## 👥 Demo Personas (Instant 1-Click Switcher)

| Student Name | Email | Tier | Initial Balance | Rates & Caps |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `rahul@campus.edu` | `BASIC` | ₹2,000.00 | 1.0× multiplier |
| **Priya Patel** | `priya@campus.edu` | `PRIME` | ₹3,500.00 | 1.5× multiplier |
| **Vikram Malhotra** | `vikram@campus.edu` | `PREMIUM` | ₹5,000.00 | 2.0× multiplier |

*Default password for demo accounts:* `Password123!`

---

## 🛠️ Features Included

1. **Student Wallet**:
   - Live balance in ₹ (computed and tracked in integer paise).
   - Instant Top-Up with rule reminder (0% cashback on top-up).
   - Pay Campus Merchant with real-time dynamic cashback preview.
   - Monthly category cashback cap progress bars.
   - Searchable transaction ledger.
2. **Cashback Lab & Rule Book**:
   - Interactive testing laboratory for evaluating `calculate_cashback()`.
   - Verified boundary cases from Section B5 (e.g. 6.66 paise floored to 6 paise).
3. **Campus Merchant POS**:
   - Virtual POS terminal with dynamic QR codes.
4. **Finance Reconciliation Center**:
   - Monthly category breakdown, volume, raw vs awarded cashback, cap savings, and CSV audit export.
5. **Idempotency Lab**:
   - Interactive workbench demonstrating duplicate payment retry caching and 409 Conflict rejection on payload tampering.

