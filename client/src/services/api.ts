import { 
  Student, 
  Wallet, 
  Merchant, 
  Transaction, 
  CategoryCapProgress, 
  PaymentPreview, 
  PaymentResult,
  ReconciliationReport,
  WalletTier
} from '../types.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('finpay_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    const err = new Error(errorMsg) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async seedDemo(): Promise<{ message: string; accounts: any[] }> {
    return request('/auth/seed-demo', { method: 'POST' });
  },

  async login(email: string, password = 'Password123!'): Promise<{ token: string; student: Student; wallet: Wallet }> {
    const res = await request<{ token: string; student: Student; wallet: Wallet }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('finpay_token', res.token);
    return res;
  },

  async register(data: { full_name: string; email: string; password: string; tier?: WalletTier; student_id?: string }): Promise<{ token: string; student: Student; wallet: Wallet }> {
    const res = await request<{ token: string; student: Student; wallet: Wallet }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    localStorage.setItem('finpay_token', res.token);
    return res;
  },

  async getMe(): Promise<{ student: Student; wallet: Wallet }> {
    return request('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('finpay_token');
  },

  // Wallet
  async getWallet(): Promise<Wallet> {
    return request('/wallet');
  },

  async topUp(amountRupees: number, idempotencyKey?: string): Promise<{ transaction: Transaction; wallet: Wallet; is_cached?: boolean }> {
    return request('/wallet/topup', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify({ amount_rupees: amountRupees, idempotency_key: idempotencyKey })
    });
  },

  async upgradeTier(tier: WalletTier): Promise<Wallet> {
    return request('/wallet/upgrade-tier', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });
  },

  async getTransactions(): Promise<Transaction[]> {
    return request('/wallet/transactions');
  },

  async getCategoryCaps(): Promise<CategoryCapProgress[]> {
    return request('/wallet/category-caps');
  },

  // Merchants
  async getMerchants(): Promise<Merchant[]> {
    return request('/merchants');
  },

  async getCategories(): Promise<any> {
    return request('/merchants/categories');
  },

  // Payments
  async previewPayment(merchantId: string, amountRupees: number): Promise<PaymentPreview> {
    return request('/payments/preview', {
      method: 'POST',
      body: JSON.stringify({ merchant_id: merchantId, amount_rupees: amountRupees })
    });
  },

  async processPayment(params: {
    merchant_id: string;
    amount_rupees: number;
    idempotency_key: string;
  }): Promise<PaymentResult> {
    return request('/payments/process', {
      method: 'POST',
      headers: { 'Idempotency-Key': params.idempotency_key },
      body: JSON.stringify({
        merchant_id: params.merchant_id,
        amount_rupees: params.amount_rupees,
        idempotency_key: params.idempotency_key
      })
    });
  },

  // Simulation
  async simulateCashback(amountRupees: number, category: string, tier: WalletTier): Promise<any> {
    return request('/payments/simulate', {
      method: 'POST',
      body: JSON.stringify({
        amount_rupees: amountRupees,
        category,
        tier
      })
    });
  },

  // Reconciliation
  async getReconciliationReport(year?: number, month?: number): Promise<ReconciliationReport> {
    const query = new URLSearchParams();
    if (year) query.set('year', year.toString());
    if (month) query.set('month', month.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/reconciliation${qs}`);
  }
};

