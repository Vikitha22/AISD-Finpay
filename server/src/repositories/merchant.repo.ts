import { DatabaseSync } from 'node:sqlite';
import { Merchant } from '../core/types.js';

export class MerchantRepository {
  constructor(private db: DatabaseSync) {}

  findAll(): Merchant[] {
    return this.db.prepare('SELECT * FROM merchants WHERE is_active = 1 ORDER BY category, business_name').all() as unknown as Merchant[];
  }

  findById(id: string): Merchant | undefined {
    return this.db.prepare('SELECT * FROM merchants WHERE id = ?').get(id) as unknown as Merchant | undefined;
  }

  findByCode(code: string): Merchant | undefined {
    return this.db.prepare('SELECT * FROM merchants WHERE merchant_code = ?').get(code) as unknown as Merchant | undefined;
  }

  create(merchant: Merchant): void {
    const stmt = this.db.prepare(`
      INSERT INTO merchants (id, merchant_code, business_name, category, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      merchant.id,
      merchant.merchant_code,
      merchant.business_name,
      merchant.category,
      merchant.is_active,
      merchant.created_at
    );
  }
}
