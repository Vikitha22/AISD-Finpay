import { DatabaseSync } from 'node:sqlite';
import { CategoryRule, TierMultiplier, MerchantCategory, WalletTier } from '../core/types.js';

export class RuleRepository {
  constructor(private db: DatabaseSync) {}

  getAllCategoryRules(): CategoryRule[] {
    return this.db.prepare('SELECT * FROM category_rules').all() as unknown as CategoryRule[];
  }

  getCategoryRule(category: MerchantCategory): CategoryRule | undefined {
    return this.db.prepare('SELECT * FROM category_rules WHERE category = ?').get(category) as unknown as CategoryRule | undefined;
  }

  getAllTierMultipliers(): TierMultiplier[] {
    return this.db.prepare('SELECT * FROM tier_multipliers').all() as unknown as TierMultiplier[];
  }

  getTierMultiplier(tier: WalletTier): TierMultiplier | undefined {
    return this.db.prepare('SELECT * FROM tier_multipliers WHERE tier = ?').get(tier) as unknown as TierMultiplier | undefined;
  }
}
