export type WalletTier = 'BASIC' | 'PRIME' | 'PREMIUM';

export type MerchantCategory = 
  | 'Canteen'
  | 'Stationery'
  | 'Transport'
  | 'Hostel'
  | 'Online'
  | 'Top-up';

export type TransactionType = 'PAYMENT' | 'TOPUP' | 'REFUND';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'REVERSED';
export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export interface Student {
  id: string;
  student_id: string; // e.g. Roll No / SRN
  full_name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  student_id: string;
  balance_paise: number; // integer paise
  tier: WalletTier;
  status: WalletStatus;
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  merchant_code: string;
  business_name: string;
  category: MerchantCategory;
  is_active: number; // 1 or 0
  created_at: string;
}

export interface CategoryRule {
  category: MerchantCategory;
  basic_rate_basis_points: number; // e.g. 200 = 2.0%
  basic_monthly_cap_paise: number; // e.g. 5000 = ₹50
}

export interface TierMultiplier {
  tier: WalletTier;
  rate_multiplier_basis_points: number; // e.g. 100 = 1.0x, 150 = 1.5x, 200 = 2.0x
  cap_multiplier_basis_points: number;  // e.g. 100 = 1.0x, 150 = 1.5x, 200 = 2.0x
}

export interface Transaction {
  id: string;
  wallet_id: string;
  merchant_id: string | null;
  category: MerchantCategory;
  type: TransactionType;
  amount_paise: number;
  raw_cashback_paise: number;
  awarded_cashback_paise: number;
  balance_after_paise: number;
  status: TransactionStatus;
  idempotency_key: string;
  created_at: string;
}

export interface IdempotencyRecord {
  idempotency_key: string;
  student_id: string;
  request_hash: string;
  response_status: number;
  response_body: string;
  created_at: string;
}

export interface CashbackCalculationResult {
  basic_rate_percent: number;
  rate_multiplier: number;
  effective_rate: number;
  raw_cashback_paise: number;
}

export interface PaymentProcessResult {
  transaction_id: string;
  idempotency_key: string;
  wallet_id: string;
  student_id: string;
  merchant_id: string;
  merchant_name: string;
  category: MerchantCategory;
  amount_paise: number;
  amount_rupees: number;
  raw_cashback_paise: number;
  awarded_cashback_paise: number;
  awarded_cashback_rupees: number;
  balance_after_paise: number;
  balance_after_rupees: number;
  earned_this_month_before_paise: number;
  monthly_cap_paise: number;
  remaining_cap_after_paise: number;
  status: TransactionStatus;
  created_at: string;
  is_cached?: boolean;
}

