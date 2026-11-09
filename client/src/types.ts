export type WalletTier = 'BASIC' | 'PRIME' | 'PREMIUM';

export type MerchantCategory = 
  | 'Canteen'
  | 'Stationery'
  | 'Transport'
  | 'Hostel'
  | 'Online'
  | 'Top-up';

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  student_id: string;
  balance_paise: number;
  balance_rupees: number;
  tier: WalletTier;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

export interface Merchant {
  id: string;
  merchant_code: string;
  business_name: string;
  category: MerchantCategory;
  is_active: number;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  merchant_id: string | null;
  merchant_name?: string;
  category: MerchantCategory;
  type: 'PAYMENT' | 'TOPUP' | 'REFUND';
  amount_paise: number;
  raw_cashback_paise: number;
  awarded_cashback_paise: number;
  balance_after_paise: number;
  status: 'SUCCESS' | 'FAILED' | 'REVERSED';
  idempotency_key: string;
  created_at: string;
}

export interface CategoryCapProgress {
  category: MerchantCategory;
  tier: WalletTier;
  basic_rate_percent: number;
  effective_rate_percent: number;
  monthly_cap_paise: number;
  monthly_cap_rupees: number;
  earned_this_month_paise: number;
  earned_this_month_rupees: number;
  remaining_cap_paise: number;
  remaining_cap_rupees: number;
  percent_used: number;
}

export interface PaymentPreview {
  amount_paise: number;
  amount_rupees: number;
  category: MerchantCategory;
  tier: WalletTier;
  wallet_balance_paise: number;
  wallet_balance_rupees: number;
  has_sufficient_balance: boolean;
  basic_rate_percent: number;
  rate_multiplier: number;
  effective_rate_percent: number;
  raw_cashback_paise: number;
  earned_this_month_paise: number;
  monthly_cap_paise: number;
  remaining_cap_paise: number;
  awarded_cashback_paise: number;
  awarded_cashback_rupees: number;
  net_deduction_paise: number;
  net_deduction_rupees: number;
}

export interface PaymentResult {
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
  status: string;
  created_at: string;
  is_cached?: boolean;
}

export interface ReconciliationReport {
  period: {
    year: number;
    month: number;
    start_iso: string;
    end_iso: string;
  };
  summary: {
    total_transactions: number;
    total_payment_volume_paise: number;
    total_payment_volume_rupees: number;
    total_raw_cashback_paise: number;
    total_raw_cashback_rupees: number;
    total_awarded_cashback_paise: number;
    total_awarded_cashback_rupees: number;
    total_saved_by_caps_paise: number;
    total_saved_by_caps_rupees: number;
    system_reconciled: boolean;
  };
  category_breakdown: Array<{
    category: MerchantCategory;
    transaction_count: number;
    volume_paise: number;
    volume_rupees: number;
    raw_cashback_paise: number;
    raw_cashback_rupees: number;
    awarded_cashback_paise: number;
    awarded_cashback_rupees: number;
    cap_savings_paise: number;
    cap_savings_rupees: number;
    basic_cap_paise: number;
  }>;
  recent_transactions: Transaction[];
}

