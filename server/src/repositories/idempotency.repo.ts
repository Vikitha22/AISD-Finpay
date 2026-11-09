import { DatabaseSync } from 'node:sqlite';
import { IdempotencyRecord } from '../core/types.js';

export class IdempotencyRepository {
  constructor(private db: DatabaseSync) {}

  get(key: string): IdempotencyRecord | undefined {
    return this.db.prepare('SELECT * FROM idempotency_records WHERE idempotency_key = ?').get(key) as IdempotencyRecord | undefined;
  }

  create(record: IdempotencyRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO idempotency_records (
        idempotency_key, student_id, request_hash, response_status, response_body, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.idempotency_key,
      record.student_id,
      record.request_hash,
      record.response_status,
      record.response_body,
      record.created_at
    );
  }
}

