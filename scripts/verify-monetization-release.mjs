import fs from 'node:fs';

const productsSource = fs.readFileSync(new URL('../src/subscription/products.ts', import.meta.url), 'utf8');
const revenueCatSource = fs.readFileSync(new URL('../src/subscription/revenueCat.ts', import.meta.url), 'utf8');
const failures = [];

const requiredLiterals = [
  ['offering id', "REVENUECAT_OFFERING_ID = 'default'"],
  ['base entitlement', "one: 'never'"],
  ['AI entitlement', "oneAi: 'never_ai'"],
  ['base product', "id: 'app.never.mobile.monthly'"],
  ['AI product', "id: 'app.never.mobile.ai.monthly'"],
  ['base package', "revenueCatPackageId: 'never_monthly'"],
  ['AI package', "revenueCatPackageId: 'never_ai_monthly'"],
  ['base display name', "displayName: 'NEVER'"],
  ['AI display name', "displayName: 'NEVER AI'"]
];

for (const [label, literal] of requiredLiterals) {
  if (!productsSource.includes(literal)) failures.push(`${label} is missing or changed unexpectedly`);
}

if (!revenueCatSource.includes("if (customerInfo.entitlements.active[revenueCatEntitlements.oneAi]) return 'one_ai';")) {
  failures.push('NEVER AI entitlement must take precedence over the base entitlement');
}
if (!revenueCatSource.includes("if (customerInfo.entitlements.active[revenueCatEntitlements.one]) return 'one';")) {
  failures.push('base NEVER entitlement resolution is missing');
}
if (!revenueCatSource.includes("if (!apiKey || Platform.OS === 'web') return false;")) {
  failures.push('RevenueCat must fail closed when no platform SDK key is configured');
}

for (const legacy of ['app.one.mobile', "one: 'one'", "oneAi: 'one_ai'", "revenueCatPackageId: 'one_monthly'", "revenueCatPackageId: 'one_ai_monthly'"]) {
  if (productsSource.includes(legacy)) failures.push(`legacy monetization identifier remains: ${legacy}`);
}

const scope = process.env.NEVER_RELEASE_SCOPE || 'testflight';
const requireBilling = scope === 'appstore' || process.env.NEVER_REQUIRE_BILLING === '1';

if (requireBilling && !process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim()) {
  failures.push('EXPO_PUBLIC_REVENUECAT_IOS_KEY is missing for a billing-enabled release');
}

if (failures.length) {
  console.error(`NEVER ${scope} monetization check failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NEVER ${scope} monetization check passed.`);
