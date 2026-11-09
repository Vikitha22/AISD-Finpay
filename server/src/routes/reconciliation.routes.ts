import { Router, Request, Response } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { ReconciliationService } from '../services/reconciliation.service.js';

export function createReconciliationRouter(db: DatabaseSync): Router {
  const router = Router();
  const reconService = new ReconciliationService(db);

  router.get('/', (req: Request, res: Response) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) - 1 : undefined; // 1-12 to 0-11

      const report = reconService.generateMonthlyReport(year, month);
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

