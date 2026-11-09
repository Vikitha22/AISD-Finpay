import { DatabaseSync } from 'node:sqlite';
import { TransactionRepository, MonthlyReconciliationRow } from '../repositories/transaction.repo.js';
import { BASIC_MONTHLY_CAPS_PAISE } from '../core/cashback.js';
import { MerchantCategory } from '../core/types.js';

export interface ReconciliationReport {
  period: {
    year: number;
    month: number;
    start_iso: string;
    end_iso: string;
  };
  summary: {
    total_transactions: number;
    total_payment_volume_paise: number;
    total_payment_volume_rupees: number;
    total_raw_cashback_paise: number;
    total_raw_cashback_rupees: number;
    total_awarded_cashback_paise: number;
    total_awarded_cashback_rupees: number;
    total_saved_by_caps_paise: number;
    total_saved_by_caps_rupees: number;
    system_reconciled: boolean;
  };
  category_breakdown: Array<{
    category: MerchantCategory;
    transaction_count: number;
    volume_paise: number;
    volume_rupees: number;
    raw_cashback_paise: number;
    raw_cashback_rupees: number;
    awarded_cashback_paise: number;
    awarded_cashback_rupees: number;
    cap_savings_paise: number;
    cap_savings_rupees: number;
    basic_cap_paise: number;
  }>;
  recent_transactions: any[];
}

export class ReconciliationService {
  private txRepo: TransactionRepository;

  constructor(private db: DatabaseSync) {
    this.txRepo = new TransactionRepository(db);
  }

  generateMonthlyReport(year?: number, month?: number): ReconciliationReport {
    const now = new Date();
    const targetYear = year ?? now.getUTCFullYear();
    const targetMonth = month !== undefined ? month : now.getUTCMonth(); // 0-indexed

    const start = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(targetYear, targetMonth + 1, 1, 0, 0, 0, 0));

    const rows: MonthlyReconciliationRow[] = this.txRepo.getMonthlyReconciliation(
      start.toISOString(),
      end.toISOString()
    );

    let total_transactions = 0;
    let total_volume_paise = 0;
    let total_raw_paise = 0;
    let total_awarded_paise = 0;

    const category_breakdown = rows.map((r) => {
      const count = Number(r.transaction_count);
      const volume = Number(r.total_amount_paise);
      const raw = Number(r.total_raw_cashback_paise);
      const awarded = Number(r.total_awarded_cashback_paise);
      const savings = Math.max(0, raw - awarded);

      total_transactions += count;
      total_volume_paise += volume;
      total_raw_paise += raw;
      total_awarded_paise += awarded;

      return {
        category: r.category,
        transaction_count: count,
        volume_paise: volume,
        volume_rupees: volume / 100,
        raw_cashback_paise: raw,
        raw_cashback_rupees: raw / 100,
        awarded_cashback_paise: awarded,
        awarded_cashback_rupees: awarded / 100,
        cap_savings_paise: savings,
        cap_savings_rupees: savings / 100,
        basic_cap_paise: BASIC_MONTHLY_CAPS_PAISE[r.category] ?? 0
      };
    });

    const recent_transactions = this.txRepo.getAll(25);

    // Ledger audit check: verify every transaction row has awarded <= raw
    const anomalyCheck = this.db.prepare(`
      SELECT COUNT(*) as anomaly_count
      FROM transactions
      WHERE awarded_cashback_paise > raw_cashback_paise
        AND status = 'SUCCESS'
        AND created_at >= ?
        AND created_at < ?
    `).get(start.toISOString(), end.toISOString()) as { anomaly_count: number } | undefined;

    const isReconciled = (anomalyCheck?.anomaly_count ?? 0) === 0;

    return {
      period: {
        year: targetYear,
        month: targetMonth + 1,
        start_iso: start.toISOString(),
        end_iso: end.toISOString()
      },
      summary: {
        total_transactions,
        total_payment_volume_paise: total_volume_paise,
        total_payment_volume_rupees: total_volume_paise / 100,
        total_raw_cashback_paise: total_raw_paise,
        total_raw_cashback_rupees: total_raw_paise / 100,
        total_awarded_cashback_paise: total_awarded_paise,
        total_awarded_cashback_rupees: total_awarded_paise / 100,
        total_saved_by_caps_paise: total_raw_paise - total_awarded_paise,
        total_saved_by_caps_rupees: (total_raw_paise - total_awarded_paise) / 100,
        system_reconciled: isReconciled
      },
      category_breakdown,
      recent_transactions
    };
  }
}

