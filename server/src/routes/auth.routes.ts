import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { DatabaseSync } from 'node:sqlite';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware.js';

const registerSchema = z.object({
  student_id: z.string().optional(),
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  tier: z.enum(['BASIC', 'PRIME', 'PREMIUM']).optional(),
  initial_balance_paise: z.number().int().min(0).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export function createAuthRouter(db: DatabaseSync): Router {
  const router = Router();
  const authService = new AuthService(db);

  router.post('/register', async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const result = await authService.register(parsed);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.login(parsed.email, parsed.password);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(401).json({ error: error.message });
    }
  });

  router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
    try {
      const profile = authService.getStudentProfile(req.user!.id);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  // Seed demo personas for instant one-click testing
  router.post('/seed-demo', async (_req: Request, res: Response) => {
    const demoAccounts = [
      {
        student_id: 'PES1UG20CS001',
        full_name: 'Rahul Sharma',
        email: 'rahul@campus.edu',
        password: 'Password123!',
        tier: 'BASIC' as const,
        initial_balance_paise: 200000 // ₹2,000
      },
      {
        student_id: 'PES1UG20CS042',
        full_name: 'Priya Patel',
        email: 'priya@campus.edu',
        password: 'Password123!',
        tier: 'PRIME' as const,
        initial_balance_paise: 350000 // ₹3,500
      },
      {
        student_id: 'PES1UG20CS099',
        full_name: 'Vikram Malhotra',
        email: 'vikram@campus.edu',
        password: 'Password123!',
        tier: 'PREMIUM' as const,
        initial_balance_paise: 500000 // ₹5,000
      }
    ];

    const results = [];
    for (const acc of demoAccounts) {
      try {
        const res = await authService.register(acc);
        results.push({ email: acc.email, tier: acc.tier, full_name: acc.full_name, token: res.token });
      } catch (err) {
        // Account may already exist, login instead
        try {
          const res = await authService.login(acc.email, acc.password);
          results.push({ email: acc.email, tier: acc.tier, full_name: acc.full_name, token: res.token });
        } catch {
          // ignore
        }
      }
    }

    res.json({ message: 'Demo accounts ready', accounts: results });
  });

  return router;
}

