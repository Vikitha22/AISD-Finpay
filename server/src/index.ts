import { config } from './config.js';
import { getDb } from './db/database.js';
import { createApp } from './app.js';
import { AuthService } from './services/auth.service.js';

async function bootstrap() {
  const db = getDb();
  const app = createApp(db);

  // Seed default demo students if none exist
  const countStudents = (db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number }).count;
  if (countStudents === 0) {
    const authService = new AuthService(db);
    console.log('⚡ Initializing FinPay demo students...');
    await authService.register({
      student_id: 'PES1UG20CS001',
      full_name: 'Rahul Sharma',
      email: 'rahul@campus.edu',
      password: 'Password123!',
      tier: 'BASIC',
      initial_balance_paise: 200000 // ₹2,000
    });

    await authService.register({
      student_id: 'PES1UG20CS042',
      full_name: 'Priya Patel',
      email: 'priya@campus.edu',
      password: 'Password123!',
      tier: 'PRIME',
      initial_balance_paise: 350000 // ₹3,500
    });

    await authService.register({
      student_id: 'PES1UG20CS099',
      full_name: 'Vikram Malhotra',
      email: 'vikram@campus.edu',
      password: 'Password123!',
      tier: 'PREMIUM',
      initial_balance_paise: 500000 // ₹5,000
    });
    console.log('✅ Demo students created (Rahul/BASIC, Priya/PRIME, Vikram/PREMIUM)');
  }

  app.listen(config.port, () => {
    console.log(`🚀 FinPay Server running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});

