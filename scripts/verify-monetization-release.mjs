import fs from 'node:fs';

const productsSource = fs.readFileSync(new URL('../src/subscription/products.ts', import.meta.url), 'utf8');
const revenueCatSource = fs.readFileSync(new URL('../src/subscription/revenueCat.ts', import.meta.url), 'utf8');
const failures = [];
const warnings = [];

const requiredLiterals = [
  ["offering id", "REVENUECAT_OFFERING_ID = 'default'"],
  ["base entitlement", "one: 'one'"],
  ["AI entitlement", "oneAi: 'one_ai'"],
  ["base package", "revenueCatPackageId: 'one_monthly'"],
  ["AI package", "revenueCatPackageId: 'one_ai_monthly'"],
  ["base display name", "displayName: 'NEVER'"],
  ["AI display name", "displayName: 'NEVER AI'"]
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
if (!revenueCatSource.includes('if (!apiKey || Platform.OS === \'web\') return false;')) {
  failures.push('RevenueCat must fail closed when no platform SDK key is configured');
}

const scope = process.env.NEVER_RELEASE_SCOPE || 'testflight';
if (scope === 'appstore') {
  if (!process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim()) failures.push('EXPO_PUBLIC_REVENUECAT_IOS_KEY is missing');
  if (/app\.one\.mobile\./.test(productsSource) && process.env.NEVER_ALLOW_LEGACY_IDENTIFIERS !== '1') {
    warnings.push('subscription product IDs still use the legacy app.one.mobile namespace; confirm these exact IDs exist in App Store Connect and RevenueCat before release');
  }
}

if (failures.length) {
  console.error(`NEVER ${scope} monetization check failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  for (const warning of warnings) console.error(`Warning: ${warning}`);
  process.exit(1);
}

console.log(`NEVER ${scope} monetization check passed.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
