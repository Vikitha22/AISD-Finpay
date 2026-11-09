import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createAuthRouter } from './routes/auth.routes.js';
import { createWalletRouter } from './routes/wallet.routes.js';
import { createMerchantRouter } from './routes/merchant.routes.js';
import { createPaymentRouter } from './routes/payment.routes.js';
import { createReconciliationRouter } from './routes/reconciliation.routes.js';

export function createApp(db: DatabaseSync) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'FinPay API', timestamp: new Date().toISOString() });
  });

  // Mount API Routers
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/wallet', createWalletRouter(db));
  app.use('/api/merchants', createMerchantRouter(db));
  app.use('/api/payments', createPaymentRouter(db));
  app.use('/api/reconciliation', createReconciliationRouter(db));

  // Serve static client build if present
  const clientDist = path.resolve(process.cwd(), '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}

