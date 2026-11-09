import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'finpay-super-secret-campus-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || path.resolve(process.cwd(), 'finpay.db'),
  isTest: process.env.NODE_ENV === 'test'
};

