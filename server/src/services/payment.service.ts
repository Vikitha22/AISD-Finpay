import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { WalletRepository } from '../repositories/wallet.repo.js';
import { MerchantRepository } from '../repositories/merchant.repo.js';
import { TransactionRepository } from '../repositories/transaction.repo.js';
import { IdempotencyRepository } from '../repositories/idempotency.repo.js';
import { 
  calculate_cashback, 
  get_effective_monthly_cap_paise, 
  get_cashback_breakdown 
} from '../core/cashback.js';
import { withTransaction } from '../db/database.js';
import { PaymentProcessResult, MerchantCategory, WalletTier } from '../core/types.js';

export interface PaymentRequest {
  student_id: string;
  merchant_id: string;
  amount_paise: number;
  idempotency_key: string;
}

export class PaymentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentConflictError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class PaymentService {
  private walletRepo: WalletRepository;
  private merchantRepo: MerchantRepository;
  private txRepo: TransactionRepository;
  private idempotencyRepo: IdempotencyRepository;

  constructor(private db: DatabaseSync) {
    this.walletRepo = new WalletRepository(db);
    this.merchantRepo = new MerchantRepository(db);
    this.txRepo = new TransactionRepository(db);
    this.idempotencyRepo = new IdempotencyRepository(db);
  }

  /**
   * Returns current calendar month start and end ISO bounds.
   */
  static getMonthBounds(date = new Date()): { startIso: string; endIso: string } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));
    return {
      startIso: start.toISOString(),
      endIso: end.toISOString()
    };
  }

  /**
   * Preview cashback and cap calculations before making a payment.
   */
  previewPayment(params: {
    student_id: string;
    merchant_id: string;
    amount_paise: number;
  }) {
    const wallet = this.walletRepo.findByStudentId(params.student_id);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const merchant = this.merchantRepo.findById(params.merchant_id);
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    const { startIso, endIso } = PaymentService.getMonthBounds();
    const earned_this_month = this.txRepo.getCashbackEarnedThisMonth(
      wallet.id,
      merchant.category,
      startIso,
      endIso
    );

    const breakdown = get_cashback_breakdown(params.amount_paise, merchant.category, wallet.tier);
    const cap = get_effective_monthly_cap_paise(merchant.category, wallet.tier);
    const remaining_cap = Math.max(0, cap - earned_this_month);
    const awarded = Math.min(breakdown.raw_cashback_paise, remaining_cap);

    return {
      amount_paise: params.amount_paise,
      amount_rupees: params.amount_paise / 100,
      category: merchant.category,
      tier: wallet.tier,
      wallet_balance_paise: wallet.balance_paise,
      wallet_balance_rupees: wallet.balance_paise / 100,
      has_sufficient_balance: wallet.balance_paise >= params.amount_paise,
      basic_rate_percent: breakdown.basic_rate_percent,
      rate_multiplier: breakdown.rate_multiplier,
      effective_rate_percent: breakdown.effective_rate * 100,
      raw_cashback_paise: breakdown.raw_cashback_paise,
      earned_this_month_paise: earned_this_month,
      monthly_cap_paise: cap,
      remaining_cap_paise: remaining_cap,
      awarded_cashback_paise: awarded,
      awarded_cashback_rupees: awarded / 100,
      net_deduction_paise: params.amount_paise - awarded,
      net_deduction_rupees: (params.amount_paise - awarded) / 100
    };
  }

  /**
   * Orchestrates the payment processing algorithm according to FinPay DDR Section B3.
   */
  processPayment(request: PaymentRequest): PaymentProcessResult {
    // 1. VALIDATE request
    if (!request.idempotency_key || request.idempotency_key.trim() === '') {
      throw new Error('Idempotency key is required');
    }
    if (!request.amount_paise || request.amount_paise <= 0 || !Number.isInteger(request.amount_paise)) {
      throw new Error('Amount must be a positive integer in paise');
    }

    const payloadHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        student_id: request.student_id,
        merchant_id: request.merchant_id,
        amount_paise: request.amount_paise
      }))
      .digest('hex');

    // 2. CHECK IDEMPOTENCY KEY
    const existing = this.idempotencyRepo.get(request.idempotency_key);
    if (existing) {
      if (existing.request_hash !== payloadHash) {
        throw new PaymentConflictError('Conflict: Idempotency key was previously used with a different payment request');
      }
      const cached = JSON.parse(existing.response_body) as PaymentProcessResult;
      return { ...cached, is_cached: true };
    }

    // 3. LOAD wallet, merchant and applicable cashback rule
    const wallet = this.walletRepo.findByStudentId(request.student_id);
    if (!wallet) {
      throw new Error('Wallet not found for student');
    }
    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Wallet is ${wallet.status}. Payments are suspended.`);
    }

    const merchant = this.merchantRepo.findById(request.merchant_id);
    if (!merchant) {
      throw new Error('Invalid merchant specified');
    }
    if (!merchant.is_active) {
      throw new Error('Merchant is currently inactive');
    }

    // 4. VERIFY payment under approved wallet rules
    if (wallet.balance_paise < request.amount_paise) {
      throw new InsufficientBalanceError(
        `Insufficient balance: wallet has ₹${(wallet.balance_paise / 100).toFixed(2)}, required ₹${(request.amount_paise / 100).toFixed(2)}`
      );
    }

    // 5. CALCULATE raw cashback (Pure function)
    const raw = calculate_cashback(request.amount_paise, merchant.category, wallet.tier);

    // 6. CALCULATE monthly cap and awarded cashback
    const { startIso, endIso } = PaymentService.getMonthBounds();
    const earned_this_month = this.txRepo.getCashbackEarnedThisMonth(
      wallet.id,
      merchant.category,
      startIso,
      endIso
    );

    const cap = get_effective_monthly_cap_paise(merchant.category, wallet.tier);
    const remaining = Math.max(0, cap - earned_this_month);
    const awarded = Math.min(raw, remaining);

    // 7. ATOMIC TRANSACTION: update wallet, write transaction, save idempotency
    return withTransaction(this.db, () => {
      // Re-fetch or verify current balance under transaction lock
      const currentWallet = this.walletRepo.findById(wallet.id);
      if (!currentWallet || currentWallet.balance_paise < request.amount_paise) {
        throw new InsufficientBalanceError('Insufficient balance during transaction execution');
      }

      const balance_after = currentWallet.balance_paise - request.amount_paise + awarded;
      this.walletRepo.updateBalance(currentWallet.id, balance_after);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      this.txRepo.create({
        id: txId,
        wallet_id: currentWallet.id,
        merchant_id: merchant.id,
        category: merchant.category,
        type: 'PAYMENT',
        amount_paise: request.amount_paise,
        raw_cashback_paise: raw,
        awarded_cashback_paise: awarded,
        balance_after_paise: balance_after,
        status: 'SUCCESS',
        idempotency_key: request.idempotency_key,
        created_at: now
      });

      const result: PaymentProcessResult = {
        transaction_id: txId,
        idempotency_key: request.idempotency_key,
        wallet_id: currentWallet.id,
        student_id: request.student_id,
        merchant_id: merchant.id,
        merchant_name: merchant.business_name,
        category: merchant.category,
        amount_paise: request.amount_paise,
        amount_rupees: request.amount_paise / 100,
        raw_cashback_paise: raw,
        awarded_cashback_paise: awarded,
        awarded_cashback_rupees: awarded / 100,
        balance_after_paise: balance_after,
        balance_after_rupees: balance_after / 100,
        earned_this_month_before_paise: earned_this_month,
        monthly_cap_paise: cap,
        remaining_cap_after_paise: Math.max(0, remaining - awarded),
        status: 'SUCCESS',
        created_at: now
      };

      this.idempotencyRepo.create({
        idempotency_key: request.idempotency_key,
        student_id: request.student_id,
        request_hash: payloadHash,
        response_status: 200,
        response_body: JSON.stringify(result),
        created_at: now
      });

      return result;
    });
  }
}

