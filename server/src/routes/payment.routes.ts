import { Router, Response } from 'express';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import { 
  PaymentService, 
  PaymentConflictError, 
  InsufficientBalanceError 
} from '../services/payment.service.js';
import { calculate_cashback, get_cashback_breakdown, get_effective_monthly_cap_paise } from '../core/cashback.js';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware.js';
import { MerchantCategory, WalletTier } from '../core/types.js';

const previewSchema = z.object({
  merchant_id: z.string(),
  amount_paise: z.number().int().positive().optional(),
  amount_rupees: z.number().positive().optional()
});

const processSchema = z.object({
  merchant_id: z.string(),
  amount_paise: z.number().int().positive().optional(),
  amount_rupees: z.number().positive().optional(),
  idempotency_key: z.string().min(1).optional()
});

const simulationSchema = z.object({
  amount_paise: z.number().int().min(0).optional(),
  amount_rupees: z.number().min(0).optional(),
  category: z.enum(['Canteen', 'Stationery', 'Transport', 'Hostel', 'Online', 'Top-up']),
  tier: z.enum(['BASIC', 'PRIME', 'PREMIUM'])
});

export function createPaymentRouter(db: DatabaseSync): Router {
  const router = Router();
  const paymentService = new PaymentService(db);

  // Pure simulation endpoint (open, no DB mutation)
  router.post('/simulate', (req, res) => {
    try {
      const parsed = simulationSchema.parse(req.body);
      const amountPaise = parsed.amount_paise ?? Math.round((parsed.amount_rupees || 0) * 100);
      const breakdown = get_cashback_breakdown(amountPaise, parsed.category, parsed.tier);
      const monthlyCapPaise = get_effective_monthly_cap_paise(parsed.category, parsed.tier);

      res.json({
        amount_paise: amountPaise,
        amount_rupees: amountPaise / 100,
        category: parsed.category,
        tier: parsed.tier,
        ...breakdown,
        raw_cashback_rupees: breakdown.raw_cashback_paise / 100,
        monthly_cap_paise: monthlyCapPaise,
        monthly_cap_rupees: monthlyCapPaise / 100
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Protected payment routes
  router.use(requireAuth);

  // Preview before paying
  router.post('/preview', (req: AuthRequest, res: Response) => {
    try {
      const parsed = previewSchema.parse(req.body);
      const amountPaise = parsed.amount_paise ?? Math.round((parsed.amount_rupees || 0) * 100);
      if (amountPaise <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      const preview = paymentService.previewPayment({
        student_id: req.user!.id,
        merchant_id: parsed.merchant_id,
        amount_paise: amountPaise
      });

      res.json(preview);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Process payment
  router.post('/process', (req: AuthRequest, res: Response) => {
    try {
      const parsed = processSchema.parse(req.body);
      const amountPaise = parsed.amount_paise ?? Math.round((parsed.amount_rupees || 0) * 100);
      if (amountPaise <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      // Read idempotency key from header or body
      const idempotencyKey = (req.headers['idempotency-key'] as string) || parsed.idempotency_key;
      if (!idempotencyKey) {
        return res.status(400).json({ 
          error: 'Missing Idempotency-Key header. Payments require an idempotency key to prevent double debit.' 
        });
      }

      const result = paymentService.processPayment({
        student_id: req.user!.id,
        merchant_id: parsed.merchant_id,
        amount_paise: amountPaise,
        idempotency_key: idempotencyKey
      });

      // If cached from idempotency replay, indicate in header
      if (result.is_cached) {
        res.setHeader('X-Cache-Lookup', 'HIT');
      }

      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      if (error instanceof PaymentConflictError) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof InsufficientBalanceError) {
        return res.status(402).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

