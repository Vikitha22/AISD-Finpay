import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { WalletRepository } from '../repositories/wallet.repo.js';
import { TransactionRepository } from '../repositories/transaction.repo.js';
import { IdempotencyRepository } from '../repositories/idempotency.repo.js';
import { withTransaction } from '../db/database.js';
import { Wallet, WalletTier, Transaction } from '../core/types.js';

export class WalletService {
  private walletRepo: WalletRepository;
  private txRepo: TransactionRepository;
  private idempotencyRepo: IdempotencyRepository;

  constructor(private db: DatabaseSync) {
    this.walletRepo = new WalletRepository(db);
    this.txRepo = new TransactionRepository(db);
    this.idempotencyRepo = new IdempotencyRepository(db);
  }

  getWallet(studentId: string): Wallet {
    const wallet = this.walletRepo.findByStudentId(studentId);
    if (!wallet) {
      throw new Error('Wallet not found for student');
    }
    return wallet;
  }

  topUp(studentId: string, amountPaise: number, idempotencyKey?: string): {
    transaction: Transaction;
    wallet: Wallet;
    is_cached?: boolean;
  } {
    if (amountPaise <= 0) {
      throw new Error('Top-up amount must be greater than zero');
    }

    const key = idempotencyKey || `topup-${crypto.randomUUID()}`;
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify({ studentId, amountPaise })).digest('hex');

    // Check idempotency
    const existingKey = this.idempotencyRepo.get(key);
    if (existingKey) {
      if (existingKey.request_hash !== payloadHash) {
        throw new Error('Conflict: Idempotency key already used with different payload');
      }
      const cached = JSON.parse(existingKey.response_body);
      return { ...cached, is_cached: true };
    }

    const wallet = this.getWallet(studentId);
    if (wallet.status !== 'ACTIVE') {
      throw new Error(`Cannot top up wallet in status: ${wallet.status}`);
    }

    return withTransaction(this.db, () => {
      const newBalance = wallet.balance_paise + amountPaise;
      this.walletRepo.updateBalance(wallet.id, newBalance);

      const txId = crypto.randomUUID();
      const now = new Date().toISOString();

      const tx: Transaction = {
        id: txId,
        wallet_id: wallet.id,
        merchant_id: null,
        category: 'Top-up',
        type: 'TOPUP',
        amount_paise: amountPaise,
        raw_cashback_paise: 0,
        awarded_cashback_paise: 0, // Top-up explicitly gives 0 cashback
        balance_after_paise: newBalance,
        status: 'SUCCESS',
        idempotency_key: key,
        created_at: now
      };

      this.txRepo.create(tx);

      const updatedWallet: Wallet = {
        ...wallet,
        balance_paise: newBalance,
        updated_at: now
      };

      const result = { transaction: tx, wallet: updatedWallet };

      this.idempotencyRepo.create({
        idempotency_key: key,
        student_id: studentId,
        request_hash: payloadHash,
        response_status: 200,
        response_body: JSON.stringify(result),
        created_at: now
      });

      return result;
    });
  }

  upgradeTier(studentId: string, newTier: WalletTier): Wallet {
    const wallet = this.getWallet(studentId);
    this.walletRepo.updateTier(wallet.id, newTier);
    return { ...wallet, tier: newTier, updated_at: new Date().toISOString() };
  }

  getTransactionHistory(walletId: string, limit = 50): Transaction[] {
    return this.txRepo.findByWalletId(walletId, limit);
  }
}

