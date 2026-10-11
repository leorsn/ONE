import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const catalog = read('../src/subscription/products.ts');
const billing = read('../src/subscription/revenueCat.ts');
const context = read('../src/context/PlanContext.tsx');
const paywall = read('../app/upgrade.tsx');

test('NEVER annual product identifiers and package IDs are mapped to the correct entitlements', () => {
  assert.match(catalog, /oneYearly:\s*\{/);
  assert.match(catalog, /id: 'app\.never\.mobile\.yearly'/);
  assert.match(catalog, /revenueCatPackageId: 'never_yearly'/);
  assert.match(catalog, /oneAiYearly:\s*\{/);
  assert.match(catalog, /id: 'app\.never\.mobile\.ai\.yearly'/);
  assert.match(catalog, /revenueCatPackageId: 'never_ai_yearly'/);
  assert.match(catalog, /priceEUR: 24\.99/);
  assert.match(catalog, /priceEUR: 44\.99/);
});

test('purchase requests select annual package ID and product ID together', () => {
  assert.match(billing, /period === 'year'/);
  assert.match(billing, /subscriptionProducts\.oneAiYearly/);
  assert.match(billing, /subscriptionProducts\.oneYearly/);
  assert.match(billing, /rcPackage\.identifier === product\.revenueCatPackageId/);
  assert.match(billing, /rcPackage\.product\.identifier === product\.id/);
  assert.match(billing, /purchaseRevenueCatPlan\(plan: PaidOnePlan, period: BillingPeriod/);
});

test('paywall displays billing period switch and forwards it into purchase', () => {
  assert.match(context, /purchaseRevenueCatPlan\(nextPlan, period\)/);
  assert.match(paywall, /setBillingPeriod\(period\)/);
  assert.match(paywall, /purchase\(planKey, billingPeriod\)/);
  assert.match(paywall, /annual \? yearlyPrices : localizedPrices/);
});

test('annual paywall offers honest preview-only savings and a premium AI treatment', () => {
  assert.match(paywall, /showPlannedSavings = !billingConfigured/);
  assert.match(paywall, /SAVE 30%/);
  assert.match(paywall, /SAVE 25%/);
  assert.match(paywall, /subscriptionProducts\.oneYearly\.priceEUR \/ 12/);
  assert.match(paywall, /subscriptionProducts\.oneAiYearly\.priceEUR \/ 12/);
  assert.match(paywall, /THE COMPLETE NEVER EXPERIENCE/);
  assert.match(paywall, /featured \? \{ borderWidth: 1, borderColor: p\.chrome \}/);
});
