import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculate_cashback, 
  get_effective_monthly_cap_paise,
  BASIC_MONTHLY_CAPS_PAISE 
} from '../core/cashback.js';

test('FinPay Cashback Algorithm (Section B4 & B5 Verification)', async (t) => {
  await t.test('Worked example from B4: ₹100 canteen payment, BASIC', () => {
    // ₹100 = 10,000 paise
    // BASIC rate = 2.0% (0.02)
    // Multiplier = 1.0
    // Raw cashback = 10,000 * 0.02 = 200 paise (= ₹2.00)
    const raw = calculate_cashback(10000, 'Canteen', 'BASIC');
    assert.equal(raw, 200, 'Raw cashback should be exactly 200 paise (₹2.00)');
  });

  await t.test('Boundary test B5: Fractional paise must be strictly FLOORED, not rounded', () => {
    // 333 paise payment in Canteen at 2.0%
    // 333 * 0.02 = 6.66 paise
    // FLOOR(6.66) = 6 paise (NOT 7 paise)
    const raw = calculate_cashback(333, 'Canteen', 'BASIC');
    assert.equal(raw, 6, 'Calculated result of 6.66 paise must floor to 6 paise');
  });

  await t.test('Boundary test B5: Fractional paise near 0.99 must floor to integer below', () => {
    // 49 paise at 2.0% = 0.98 paise -> 0
    // 99 paise at 2.0% = 1.98 paise -> 1
    assert.equal(calculate_cashback(49, 'Canteen', 'BASIC'), 0);
    assert.equal(calculate_cashback(99, 'Canteen', 'BASIC'), 1);
  });

  await t.test('Boundary test B5: PRIME tier receives 1.5x rate multiplier', () => {
    // ₹100 = 10,000 paise in Canteen
    // Base 2% * 1.5 = 3%
    // 10,000 * 0.03 = 300 paise (= ₹3.00)
    const rawPrime = calculate_cashback(10000, 'Canteen', 'PRIME');
    assert.equal(rawPrime, 300, 'PRIME tier should earn 300 paise (3%)');

    // Monthly cap check for PRIME:
    // Base cap for Canteen is ₹50 (5000 paise)
    // 5000 * 1.5 = 7500 paise (₹75)
    const capPrime = get_effective_monthly_cap_paise('Canteen', 'PRIME');
    assert.equal(capPrime, 7500, 'PRIME monthly cap should be 7500 paise (₹75)');
  });

  await t.test('Boundary test B5: PREMIUM tier receives 2.0x rate multiplier', () => {
    // ₹100 = 10,000 paise in Canteen
    // Base 2% * 2.0 = 4%
    // 10,000 * 0.04 = 400 paise (= ₹4.00)
    const rawPremium = calculate_cashback(10000, 'Canteen', 'PREMIUM');
    assert.equal(rawPremium, 400, 'PREMIUM tier should earn 400 paise (4%)');

    // Monthly cap check for PREMIUM:
    // Base cap for Canteen is ₹50 (5000 paise)
    // 5000 * 2.0 = 10000 paise (₹100)
    const capPremium = get_effective_monthly_cap_paise('Canteen', 'PREMIUM');
    assert.equal(capPremium, 10000, 'PREMIUM monthly cap should be 10000 paise (₹100)');
  });

  await t.test('Boundary test B5: Top-up category always awards ZERO cashback', () => {
    // ₹500 top-up (50,000 paise) across all tiers
    assert.equal(calculate_cashback(50000, 'Top-up', 'BASIC'), 0);
    assert.equal(calculate_cashback(50000, 'Top-up', 'PRIME'), 0);
    assert.equal(calculate_cashback(50000, 'Top-up', 'PREMIUM'), 0);
  });

  await t.test('All category base rates are accurately calibrated', () => {
    // Test ₹1000 (100,000 paise) payments on BASIC tier:
    // Stationery: 1.0% -> 1000 paise
    // Transport: 3.0% -> 3000 paise
    // Hostel: 0.5% -> 500 paise
    // Online: 1.0% -> 1000 paise
    assert.equal(calculate_cashback(100000, 'Stationery', 'BASIC'), 1000);
    assert.equal(calculate_cashback(100000, 'Transport', 'BASIC'), 3000);
    assert.equal(calculate_cashback(100000, 'Hostel', 'BASIC'), 500);
    assert.equal(calculate_cashback(100000, 'Online', 'BASIC'), 1000);
  });

  await t.test('Zero or negative amounts return 0 paise', () => {
    assert.equal(calculate_cashback(0, 'Canteen', 'BASIC'), 0);
    assert.equal(calculate_cashback(-500, 'Canteen', 'BASIC'), 0);
  });
});

