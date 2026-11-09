import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initSchema, resetDbForTesting } from '../db/database.js';
import { AuthService } from '../services/auth.service.js';
import { WalletService } from '../services/wallet.service.js';
import { 
  PaymentService, 
  PaymentConflictError, 
  InsufficientBalanceError 
} from '../services/payment.service.js';
import { ReconciliationService } from '../services/reconciliation.service.js';

test('FinPay Payment & Idempotency Engine Integration Tests', async (t) => {
  // Use in-memory SQLite for complete isolation in tests
  const db = new DatabaseSync(':memory:');
  initSchema(db);

  const authService = new AuthService(db);
  const walletService = new WalletService(db);
  const paymentService = new PaymentService(db);
  const reconciliationService = new ReconciliationService(db);

  // Setup test student (Rahul / BASIC) with ₹1,000 balance (100,000 paise)
  const { student, wallet } = await authService.register({
    student_id: 'PES1UG20CS101',
    full_name: 'Rahul Sharma',
    email: 'rahul.test@campus.edu',
    password: 'Password123!',
    tier: 'BASIC',
    initial_balance_paise: 100000 // ₹1000
  });

  await t.test('1. Standard payment: ₹100 canteen payment on BASIC tier', () => {
    const result = paymentService.processPayment({
      student_id: student.id,
      merchant_id: 'm-canteen-1',
      amount_paise: 10000, // ₹100
      idempotency_key: 'idem-test-001'
    });

    assert.equal(result.amount_paise, 10000);
    assert.equal(result.raw_cashback_paise, 200, '2% of ₹100 is ₹2 (200 paise)');
    assert.equal(result.awarded_cashback_paise, 200, 'Full ₹2 awarded because cap ₹50 was untouched');
    // Balance was 100,000. Deducted 10,000, credited 200 -> 90,200 paise
    assert.equal(result.balance_after_paise, 90200);

    const updatedWallet = walletService.getWallet(student.id);
    assert.equal(updatedWallet.balance_paise, 90200);
  });

  await t.test('2. Idempotency Guarantee: Retrying with same key returns identical cached result without re-debiting', () => {
    const initialBalance = walletService.getWallet(student.id).balance_paise;

    const retryResult = paymentService.processPayment({
      student_id: student.id,
      merchant_id: 'm-canteen-1',
      amount_paise: 10000,
      idempotency_key: 'idem-test-001' // SAME key
    });

    assert.equal(retryResult.is_cached, true, 'Result should be flagged as cached idempotency response');
    assert.ok(retryResult.transaction_id, 'Cached transaction ID should be present');
    assert.equal(retryResult.balance_after_paise, 90200);

    const currentBalance = walletService.getWallet(student.id).balance_paise;
    assert.equal(currentBalance, initialBalance, 'Wallet balance must NOT be debited twice on retry');
  });

  await t.test('3. Idempotency Conflict: Reusing same key with different amount throws PaymentConflictError', () => {
    assert.throws(
      () => {
        paymentService.processPayment({
          student_id: student.id,
          merchant_id: 'm-canteen-1',
          amount_paise: 15000, // DIFFERENT amount
          idempotency_key: 'idem-test-001' // SAME key
        });
      },
      PaymentConflictError,
      'Reusing idempotency key with modified payload must throw 409 Conflict'
    );
  });

  await t.test('4. Insufficient Balance Check: Rejects payment exceeding wallet balance', () => {
    assert.throws(
      () => {
        paymentService.processPayment({
          student_id: student.id,
          merchant_id: 'm-canteen-1',
          amount_paise: 10000000, // ₹100,000 (exceeds balance)
          idempotency_key: 'idem-test-overdraft'
        });
      },
      InsufficientBalanceError,
      'Should throw InsufficientBalanceError'
    );
  });

  await t.test('5. Monthly Cap Enforcement: Consuming cap stops further cashback awards', () => {
    // Current Canteen earned cashback so far is 200 paise.
    // BASIC Canteen monthly cap is 5000 paise (₹50).
    // Remaining cap = 4800 paise.
    // Let's make a payment that earns exactly 4800 paise:
    // At 2%, amount needed = 4800 / 0.02 = 240,000 paise (₹2400).
    // First, top up student wallet so they have enough balance:
    walletService.topUp(student.id, 500000); // Add ₹5000

    const capFillingPayment = paymentService.processPayment({
      student_id: student.id,
      merchant_id: 'm-canteen-1',
      amount_paise: 240000,
      idempotency_key: 'idem-cap-fill'
    });

    assert.equal(capFillingPayment.awarded_cashback_paise, 4800);

    // Now the monthly cap for Canteen (5000 paise) is 100% EXHAUSTED!
    // Next Canteen payment:
    const paymentAfterCap = paymentService.processPayment({
      student_id: student.id,
      merchant_id: 'm-canteen-1',
      amount_paise: 10000, // ₹100
      idempotency_key: 'idem-cap-exhausted'
    });

    assert.equal(paymentAfterCap.raw_cashback_paise, 200, 'Raw calculation still calculates 200 paise');
    assert.equal(paymentAfterCap.awarded_cashback_paise, 0, 'Awarded cashback MUST be 0 paise when cap is full');
  });

  await t.test('6. Partial Cap Award: When remaining cap < raw cashback, award exactly the remaining cap', async () => {
    // Create new student on Stationery category
    // Stationery BASIC cap is ₹20 (2000 paise), rate is 1%
    const student2 = (await authService.register({
      full_name: 'Priya Patel',
      email: 'priya.test@campus.edu',
      password: 'Password123!',
      tier: 'BASIC',
      initial_balance_paise: 300000 // ₹3000
    })).student;

    // First payment: ₹1900 at 1% = 1900 paise awarded (100 paise cap remaining)
    paymentService.processPayment({
      student_id: student2.id,
      merchant_id: 'm-stationery-1',
      amount_paise: 190000,
      idempotency_key: 'idem-priya-01'
    });

    // Second payment: ₹500 at 1% = raw cashback is 500 paise.
    // But only 100 paise cap remains!
    const partialResult = paymentService.processPayment({
      student_id: student2.id,
      merchant_id: 'm-stationery-1',
      amount_paise: 50000,
      idempotency_key: 'idem-priya-02'
    });

    assert.equal(partialResult.raw_cashback_paise, 500);
    assert.equal(partialResult.awarded_cashback_paise, 100, 'Awarded cashback must truncate to exact remaining cap of 100 paise');
  });

  await t.test('7. Reconciliation Service: Verifies all transaction metrics and audits ledger balance', () => {
    const report = reconciliationService.generateMonthlyReport();

    assert.ok(report.summary.total_transactions > 0);
    assert.ok(report.summary.total_payment_volume_paise > 0);
    assert.equal(report.summary.system_reconciled, true, 'System ledger should be 100% reconciled');
    assert.ok(report.category_breakdown.length > 0);
  });
});
