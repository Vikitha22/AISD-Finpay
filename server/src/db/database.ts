import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = customPath || config.dbPath;
  dbInstance = new DatabaseSync(dbPath);

  // Enable foreign key constraints and WAL journal mode
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  initSchema(dbInstance);
  return dbInstance;
}

export function initSchema(db: DatabaseSync) {
  // Read schema.sql
  const schemaPath = path.resolve(process.cwd(), 'server', 'src', 'db', 'schema.sql');
  let schemaSql: string;

  if (fs.existsSync(schemaPath)) {
    schemaSql = fs.readFileSync(schemaPath, 'utf8');
  } else {
    // Fallback if running from within server directory
    const altPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
    schemaSql = fs.readFileSync(altPath, 'utf8');
  }

  db.exec(schemaSql);
  seedInitialRules(db);
}

export function seedInitialRules(db: DatabaseSync) {
  // Seed Category Rules if empty
  const countCat = (db.prepare('SELECT COUNT(*) as count FROM category_rules').get() as { count: number }).count;
  if (countCat === 0) {
    const insertCat = db.prepare(`
      INSERT INTO category_rules (category, basic_rate_basis_points, basic_monthly_cap_paise)
      VALUES (?, ?, ?)
    `);

    // Basis points: 200 = 2%, 100 = 1%, 300 = 3%, 50 = 0.5%, 0 = 0%
    // Caps in paise: ₹50=5000, ₹20=2000, ₹100=10000, ₹200=20000, ₹30=3000, 0=0
    insertCat.run('Canteen', 200, 5000);
    insertCat.run('Stationery', 100, 2000);
    insertCat.run('Transport', 300, 10000);
    insertCat.run('Hostel', 50, 20000);
    insertCat.run('Online', 100, 3000);
    insertCat.run('Top-up', 0, 0);
  }

  // Seed Tier Multipliers if empty
  const countTier = (db.prepare('SELECT COUNT(*) as count FROM tier_multipliers').get() as { count: number }).count;
  if (countTier === 0) {
    const insertTier = db.prepare(`
      INSERT INTO tier_multipliers (tier, rate_multiplier_basis_points, cap_multiplier_basis_points)
      VALUES (?, ?, ?)
    `);

    // Multipliers: 100 = 1.0x, 150 = 1.5x, 200 = 2.0x
    insertTier.run('BASIC', 100, 100);
    insertTier.run('PRIME', 150, 150);
    insertTier.run('PREMIUM', 200, 200);
  }

  // Seed Default Campus Merchants if empty
  const countMerchants = (db.prepare('SELECT COUNT(*) as count FROM merchants').get() as { count: number }).count;
  if (countMerchants === 0) {
    const insertMerchant = db.prepare(`
      INSERT INTO merchants (id, merchant_code, business_name, category, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertMerchant.run('m-canteen-1', 'MERCH_CANTEEN_01', 'Central Campus Food Court', 'Canteen', 1, now);
    insertMerchant.run('m-canteen-2', 'MERCH_CAFE_02', 'North Gate Coffee Bar', 'Canteen', 1, now);
    insertMerchant.run('m-stationery-1', 'MERCH_BOOKS_01', 'University Bookstore & Xerox', 'Stationery', 1, now);
    insertMerchant.run('m-transport-1', 'MERCH_BUS_01', 'Campus Shuttle & Bus Pass', 'Transport', 1, now);
    insertMerchant.run('m-hostel-1', 'MERCH_HOSTEL_01', 'Hostel Mess & Laundry Services', 'Hostel', 1, now);
    insertMerchant.run('m-online-1', 'MERCH_PORTAL_01', 'Campus Cloud & Library Online', 'Online', 1, now);
  }
}

/**
 * Execute a function within a strict IMMEDIATE SQLite transaction.
 * Guarantees serializable isolation and rollback on any error.
 */
export function withTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

export function resetDbForTesting(db: DatabaseSync) {
  db.exec(`
    DELETE FROM idempotency_records;
    DELETE FROM transactions;
    DELETE FROM wallets;
    DELETE FROM students;
  `);
}

