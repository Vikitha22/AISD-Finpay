import { DatabaseSync } from 'node:sqlite';
import { Student } from '../core/types.js';

export class StudentRepository {
  constructor(private db: DatabaseSync) {}

  findById(id: string): Student | undefined {
    return this.db.prepare('SELECT * FROM students WHERE id = ?').get(id) as Student | undefined;
  }

  findByEmail(email: string): Student | undefined {
    return this.db.prepare('SELECT * FROM students WHERE email = ?').get(email.toLowerCase()) as Student | undefined;
  }

  findByStudentId(studentId: string): Student | undefined {
    return this.db.prepare('SELECT * FROM students WHERE student_id = ?').get(studentId) as Student | undefined;
  }

  create(student: Student): void {
    const stmt = this.db.prepare(`
      INSERT INTO students (id, student_id, full_name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      student.id,
      student.student_id,
      student.full_name,
      student.email.toLowerCase(),
      student.password_hash,
      student.created_at
    );
  }
}

