import { Router, Response } from 'express';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import { WalletService } from '../services/wallet.service.js';
import { TransactionRepository } from '../repositories/transaction.repo.js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import { 
  BASIC_MONTHLY_CAPS_PAISE, 
  BASIC_RATES, 
  TIER_MULTIPLIERS,
  get_effective_monthly_cap_paise 
} from '../core/cashback.js';
import { PaymentService } from '../services/payment.service.js';
import { MerchantCategory } from '../core/types.js';

const topUpSchema = z.object({
  amount_paise: z.number().int().positive().optional(),
  amount_rupees: z.number().positive().optional(),
  idempotency_key: z.string().optional()
});

const upgradeSchema = z.object({
  tier: z.enum(['BASIC', 'PRIME', 'PREMIUM'])
});

export function createWalletRouter(db: DatabaseSync): Router {
  const router = Router();
  const walletService = new WalletService(db);
  const txRepo = new TransactionRepository(db);

  router.use(requireAuth);

  // Get current user's wallet
  router.get('/', (req: AuthRequest, res: Response) => {
    try {
      const wallet = walletService.getWallet(req.user!.id);
      res.json({
        ...wallet,
        balance_rupees: wallet.balance_paise / 100
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // Top-up wallet
  router.post('/topup', (req: AuthRequest, res: Response) => {
    try {
      const parsed = topUpSchema.parse(req.body);
      const amountPaise = parsed.amount_paise ?? Math.round((parsed.amount_rupees || 0) * 100);
      if (amountPaise <= 0) {
        return res.status(400).json({ error: 'Valid top-up amount is required' });
      }

      const key = (req.headers['idempotency-key'] as string) || parsed.idempotency_key;
      const result = walletService.topUp(req.user!.id, amountPaise, key);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Upgrade or switch tier
  router.post('/upgrade-tier', (req: AuthRequest, res: Response) => {
    try {
      const parsed = upgradeSchema.parse(req.body);
      const updated = walletService.upgradeTier(req.user!.id, parsed.tier);
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Transaction history
  router.get('/transactions', (req: AuthRequest, res: Response) => {
    try {
      const wallet = walletService.getWallet(req.user!.id);
      const history = walletService.getTransactionHistory(wallet.id, 50);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Monthly category cap progress for dashboard
  router.get('/category-caps', (req: AuthRequest, res: Response) => {
    try {
      const wallet = walletService.getWallet(req.user!.id);
      const { startIso, endIso } = PaymentService.getMonthBounds();
      const categories: MerchantCategory[] = ['Canteen', 'Stationery', 'Transport', 'Hostel', 'Online', 'Top-up'];

      const progress = categories.map((cat) => {
        const basicRate = (BASIC_RATES[cat] ?? 0) * 100;
        const rateMultiplier = TIER_MULTIPLIERS[wallet.tier].rate;
        const effectiveRate = basicRate * rateMultiplier;

        const effectiveCapPaise = get_effective_monthly_cap_paise(cat, wallet.tier);
        const earnedPaise = txRepo.getCashbackEarnedThisMonth(wallet.id, cat, startIso, endIso);
        const remainingPaise = Math.max(0, effectiveCapPaise - earnedPaise);
        const percentUsed = effectiveCapPaise > 0 
          ? Math.min(100, Math.round((earnedPaise / effectiveCapPaise) * 100))
          : 0;

        return {
          category: cat,
          tier: wallet.tier,
          basic_rate_percent: basicRate,
          effective_rate_percent: effectiveRate,
          monthly_cap_paise: effectiveCapPaise,
          monthly_cap_rupees: effectiveCapPaise / 100,
          earned_this_month_paise: earnedPaise,
          earned_this_month_rupees: earnedPaise / 100,
          remaining_cap_paise: remainingPaise,
          remaining_cap_rupees: remainingPaise / 100,
          percent_used: percentUsed
        };
      });

      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

