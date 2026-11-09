import { DatabaseSync } from 'node:sqlite';
import { Transaction, MerchantCategory } from '../core/types.js';

export interface MonthlyReconciliationRow {
  category: MerchantCategory;
  transaction_count: number;
  total_amount_paise: number;
  total_raw_cashback_paise: number;
  total_awarded_cashback_paise: number;
}

export class TransactionRepository {
  constructor(private db: DatabaseSync) {}

  create(tx: Transaction): void {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (
        id, wallet_id, merchant_id, category, type, 
        amount_paise, raw_cashback_paise, awarded_cashback_paise, 
        balance_after_paise, status, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      tx.id,
      tx.wallet_id,
      tx.merchant_id,
      tx.category,
      tx.type,
      tx.amount_paise,
      tx.raw_cashback_paise,
      tx.awarded_cashback_paise,
      tx.balance_after_paise,
      tx.status,
      tx.idempotency_key,
      tx.created_at
    );
  }

  findById(id: string): Transaction | undefined {
    return this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Transaction | undefined;
  }

  findByWalletId(walletId: string, limit = 50): Transaction[] {
    return this.db.prepare(`
      SELECT t.*, m.business_name as merchant_name
      FROM transactions t
      LEFT JOIN merchants m ON t.merchant_id = m.id
      WHERE t.wallet_id = ?
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(walletId, limit) as unknown as Transaction[];
  }

  /**
   * Sums the awarded cashback for a student within a specific category for the current month.
   */
  getCashbackEarnedThisMonth(
    walletId: string,
    category: MerchantCategory,
    monthStartIso: string,
    monthEndIso: string
  ): number {
    const row = this.db.prepare(`
      SELECT COALESCE(SUM(awarded_cashback_paise), 0) as total_earned
      FROM transactions
      WHERE wallet_id = ? 
        AND category = ? 
        AND status = 'SUCCESS'
        AND type = 'PAYMENT'
        AND created_at >= ? 
        AND created_at < ?
    `).get(walletId, category, monthStartIso, monthEndIso) as { total_earned: number } | undefined;

    return row ? Number(row.total_earned) : 0;
  }

  /**
   * Aggregates transactions by category for monthly reconciliation.
   */
  getMonthlyReconciliation(monthStartIso: string, monthEndIso: string): MonthlyReconciliationRow[] {
    return this.db.prepare(`
      SELECT 
        category,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount_paise), 0) as total_amount_paise,
        COALESCE(SUM(raw_cashback_paise), 0) as total_raw_cashback_paise,
        COALESCE(SUM(awarded_cashback_paise), 0) as total_awarded_cashback_paise
      FROM transactions
      WHERE status = 'SUCCESS'
        AND created_at >= ?
        AND created_at < ?
      GROUP BY category
      ORDER BY category
    `).all(monthStartIso, monthEndIso) as unknown as MonthlyReconciliationRow[];
  }

  getAll(limit = 100): Transaction[] {
    return this.db.prepare(`
      SELECT t.*, m.business_name as merchant_name
      FROM transactions t
      LEFT JOIN merchants m ON t.merchant_id = m.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(limit) as unknown as Transaction[];
  }
}

