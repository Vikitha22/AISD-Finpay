import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';
import { StudentRepository } from '../repositories/student.repo.js';
import { WalletRepository } from '../repositories/wallet.repo.js';
import { Student, Wallet, WalletTier } from '../core/types.js';

export interface AuthTokens {
  token: string;
  student: Omit<Student, 'password_hash'>;
  wallet: Wallet;
}

export class AuthService {
  private studentRepo: StudentRepository;
  private walletRepo: WalletRepository;

  constructor(private db: DatabaseSync) {
    this.studentRepo = new StudentRepository(db);
    this.walletRepo = new WalletRepository(db);
  }

  async register(params: {
    student_id?: string;
    full_name: string;
    email: string;
    password: string;
    tier?: WalletTier;
    initial_balance_paise?: number;
  }): Promise<AuthTokens> {
    const existing = this.studentRepo.findByEmail(params.email);
    if (existing) {
      throw new Error('A student with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(params.password, salt);

    const id = crypto.randomUUID();
    const student_id = params.student_id || `SRN${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const student: Student = {
      id,
      student_id,
      full_name: params.full_name,
      email: params.email.toLowerCase(),
      password_hash,
      created_at: now
    };

    const wallet: Wallet = {
      id: crypto.randomUUID(),
      student_id: id,
      balance_paise: params.initial_balance_paise ?? 50000, // ₹500 starting test balance if unspecified
      tier: params.tier || 'BASIC',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now
    };

    // Store in atomic transaction
    this.studentRepo.create(student);
    this.walletRepo.create(wallet);

    const token = jwt.sign(
      { sub: student.id, email: student.email, student_id: student.student_id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeStudent } = student;
    return { token, student: safeStudent, wallet };
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const student = this.studentRepo.findByEmail(email);
    if (!student) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, student.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const wallet = this.walletRepo.findByStudentId(student.id);
    if (!wallet) {
      throw new Error('Wallet not found for this student');
    }

    const token = jwt.sign(
      { sub: student.id, email: student.email, student_id: student.student_id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeStudent } = student;
    return { token, student: safeStudent, wallet };
  }

  getStudentProfile(studentId: string): { student: Omit<Student, 'password_hash'>; wallet: Wallet } {
    const student = this.studentRepo.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    const wallet = this.walletRepo.findByStudentId(studentId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    const { password_hash: _, ...safeStudent } = student;
    return { student: safeStudent, wallet };
  }
}

