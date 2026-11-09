import { DatabaseSync } from 'node:sqlite';
import { Wallet, WalletTier, WalletStatus } from '../core/types.js';

export class WalletRepository {
  constructor(private db: DatabaseSync) {}

  findById(id: string): Wallet | undefined {
    return this.db.prepare('SELECT * FROM wallets WHERE id = ?').get(id) as Wallet | undefined;
  }

  findByStudentId(studentId: string): Wallet | undefined {
    return this.db.prepare('SELECT * FROM wallets WHERE student_id = ?').get(studentId) as Wallet | undefined;
  }

  create(wallet: Wallet): void {
    const stmt = this.db.prepare(`
      INSERT INTO wallets (id, student_id, balance_paise, tier, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      wallet.id,
      wallet.student_id,
      wallet.balance_paise,
      wallet.tier,
      wallet.status,
      wallet.created_at,
      wallet.updated_at
    );
  }

  updateBalance(walletId: string, newBalancePaise: number): void {
    if (newBalancePaise < 0) {
      throw new Error(`Integrity violation: balance_paise cannot be negative (${newBalancePaise})`);
    }
    const stmt = this.db.prepare(`
      UPDATE wallets 
      SET balance_paise = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(newBalancePaise, new Date().toISOString(), walletId);
  }

  updateTier(walletId: string, newTier: WalletTier): void {
    const stmt = this.db.prepare(`
      UPDATE wallets
      SET tier = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(newTier, new Date().toISOString(), walletId);
  }
}

