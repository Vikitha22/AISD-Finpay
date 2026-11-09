import { Router, Request, Response } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { MerchantRepository } from '../repositories/merchant.repo.js';
import { RuleRepository } from '../repositories/rule.repo.js';
import { BASIC_RATES, BASIC_MONTHLY_CAPS_PAISE, TIER_MULTIPLIERS } from '../core/cashback.js';

export function createMerchantRouter(db: DatabaseSync): Router {
  const router = Router();
  const merchantRepo = new MerchantRepository(db);
  const ruleRepo = new RuleRepository(db);

  router.get('/', (_req: Request, res: Response) => {
    try {
      const merchants = merchantRepo.findAll();
      res.json(merchants);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/categories', (_req: Request, res: Response) => {
    try {
      const rules = ruleRepo.getAllCategoryRules();
      const tiers = ruleRepo.getAllTierMultipliers();
      res.json({
        categories: rules,
        tiers,
        rates_map: BASIC_RATES,
        caps_map_paise: BASIC_MONTHLY_CAPS_PAISE,
        multipliers_map: TIER_MULTIPLIERS
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

