import { MerchantCategory, WalletTier, CashbackCalculationResult } from './types.js';

/**
 * Standard BASIC cashback rates (as decimal fractions).
 * Canteen: 2.0% (0.02)
 * Stationery: 1.0% (0.01)
 * Transport: 3.0% (0.03)
 * Hostel: 0.5% (0.005)
 * Online: 1.0% (0.01)
 * Top-up: 0.0% (0.00)
 */
export const BASIC_RATES: Record<MerchantCategory, number> = {
  'Canteen': 0.02,
  'Stationery': 0.01,
  'Transport': 0.03,
  'Hostel': 0.005,
  'Online': 0.01,
  'Top-up': 0.0
};

/**
 * Standard BASIC monthly caps in integer paise (₹1 = 100 paise).
 * Canteen: ₹50 = 5,000 paise
 * Stationery: ₹20 = 2,000 paise
 * Transport: ₹100 = 10,000 paise
 * Hostel: ₹200 = 20,000 paise
 * Online: ₹30 = 3,000 paise
 * Top-up: ₹0 = 0 paise
 */
export const BASIC_MONTHLY_CAPS_PAISE: Record<MerchantCategory, number> = {
  'Canteen': 5000,
  'Stationery': 2000,
  'Transport': 10000,
  'Hostel': 20000,
  'Online': 3000,
  'Top-up': 0
};

/**
 * Wallet tier multipliers for rate and monthly cap.
 * BASIC: 1.0x
 * PRIME: 1.5x
 * PREMIUM: 2.0x
 */
export const TIER_MULTIPLIERS: Record<WalletTier, { rate: number; cap: number }> = {
  'BASIC': { rate: 1.0, cap: 1.0 },
  'PRIME': { rate: 1.5, cap: 1.5 },
  'PREMIUM': { rate: 2.0, cap: 2.0 }
};

/**
 * Pure calculation function as defined in FinPay DDR (Section B3).
 * Contains NO database access and NO side effects.
 *
 * Algorithm:
 *  1. basic_rate = BASIC_RATE_FOR(category)
 *  2. rate_multiplier = RATE_MULTIPLIER_FOR(tier)
 *  3. effective_rate = basic_rate * rate_multiplier
 *  4. raw_cashback_paise = FLOOR(amount_paise * effective_rate)
 *  5. RETURN raw_cashback_paise
 *
 * @param amount_paise Payment amount in integer paise (e.g. ₹100 = 10000 paise)
 * @param category Merchant category
 * @param tier Student wallet tier
 * @returns Raw cashback in integer paise
 */
export function calculate_cashback(
  amount_paise: number,
  category: MerchantCategory,
  tier: WalletTier
): number {
  if (amount_paise <= 0 || category === 'Top-up') {
    return 0;
  }

  const basic_rate = BASIC_RATES[category] ?? 0;
  const rate_multiplier = TIER_MULTIPLIERS[tier]?.rate ?? 1.0;
  const effective_rate = basic_rate * rate_multiplier;

  // Strict FLOOR operation on fractional paise (e.g. 6.66 -> 6 paise)
  // We use Math.floor(Number((amount_paise * effective_rate).toFixed(8))) to handle IEEE 754 precision safely
  const raw_cashback_paise = Math.floor(Math.round((amount_paise * effective_rate) * 1e8) / 1e8);

  return Math.max(0, raw_cashback_paise);
}

/**
 * Helper to inspect full cashback rate metrics for UI previews and simulation.
 */
export function get_cashback_breakdown(
  amount_paise: number,
  category: MerchantCategory,
  tier: WalletTier
): CashbackCalculationResult {
  const basic_rate = BASIC_RATES[category] ?? 0;
  const rate_multiplier = TIER_MULTIPLIERS[tier]?.rate ?? 1.0;
  const effective_rate = basic_rate * rate_multiplier;
  const raw_cashback_paise = calculate_cashback(amount_paise, category, tier);

  return {
    basic_rate_percent: basic_rate * 100,
    rate_multiplier,
    effective_rate,
    raw_cashback_paise
  };
}

/**
 * Calculates the effective monthly cap for a given category and tier in paise.
 */
export function get_effective_monthly_cap_paise(
  category: MerchantCategory,
  tier: WalletTier
): number {
  const basic_cap = BASIC_MONTHLY_CAPS_PAISE[category] ?? 0;
  const cap_multiplier = TIER_MULTIPLIERS[tier]?.cap ?? 1.0;
  return Math.floor(basic_cap * cap_multiplier);
}

