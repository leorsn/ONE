import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/subscription/products.ts', import.meta.url), 'utf8');
const failures = [];

const expected = {
  group: 'NEVER Membership',
  offering: 'default',
  base: {
    productId: 'app.never.mobile.monthly',
    packageId: 'never_monthly',
    entitlementId: 'never',
    displayName: 'NEVER',
    priceEUR: 2.99,
    trialDays: 7,
    subscriptionLevel: 2
  },
  ai: {
    productId: 'app.never.mobile.ai.monthly',
    packageId: 'never_ai_monthly',
    entitlementId: 'never_ai',
    displayName: 'NEVER AI',
    priceEUR: 4.99,
    trialDays: 0,
    subscriptionLevel: 1
  }
};

const required = [
  ['subscription group', `SUBSCRIPTION_GROUP = '${expected.group}'`],
  ['RevenueCat offering', `REVENUECAT_OFFERING_ID = '${expected.offering}'`],
  ['base entitlement map', `one: '${expected.base.entitlementId}'`],
  ['AI entitlement map', `oneAi: '${expected.ai.entitlementId}'`],
  ['base product id', `id: '${expected.base.productId}'`],
  ['base package id', `revenueCatPackageId: '${expected.base.packageId}'`],
  ['base entitlement', 'entitlementId: revenueCatEntitlements.one'],
  ['base display name', `displayName: '${expected.base.displayName}'`],
  ['base nominal EUR price', `priceEUR: ${expected.base.priceEUR}`],
  ['base trial', `trialDays: ${expected.base.trialDays}`],
  ['base subscription level', `subscriptionLevel: ${expected.base.subscriptionLevel}`],
  ['AI product id', `id: '${expected.ai.productId}'`],
  ['AI package id', `revenueCatPackageId: '${expected.ai.packageId}'`],
  ['AI entitlement', 'entitlementId: revenueCatEntitlements.oneAi'],
  ['AI display name', `displayName: '${expected.ai.displayName}'`],
  ['AI nominal EUR price', `priceEUR: ${expected.ai.priceEUR}`],
  ['AI trial', `trialDays: ${expected.ai.trialDays}`],
  ['AI subscription level', `subscriptionLevel: ${expected.ai.subscriptionLevel}`],
  ['auto renewal', 'autoRenews: true']
];

for (const [label, literal] of required) {
  if (!source.includes(literal)) failures.push(`${label} is missing or differs from the approved Store configuration`);
}

if (expected.ai.subscriptionLevel >= expected.base.subscriptionLevel) {
  failures.push('NEVER AI must be the higher App Store subscription tier (level 1) and NEVER the lower tier (level 2)');
}

const uniqueValues = [
  ['product IDs', [expected.base.productId, expected.ai.productId]],
  ['RevenueCat package IDs', [expected.base.packageId, expected.ai.packageId]],
  ['entitlement IDs', [expected.base.entitlementId, expected.ai.entitlementId]]
];
for (const [label, values] of uniqueValues) {
  if (new Set(values).size !== values.length) failures.push(`${label} must be unique`);
}

for (const legacy of ['app.one.mobile', "one: 'one'", "oneAi: 'one_ai'", "revenueCatPackageId: 'one_monthly'", "revenueCatPackageId: 'one_ai_monthly'"]) {
  if (source.includes(legacy)) failures.push(`legacy Store identifier remains: ${legacy}`);
}

if (failures.length) {
  console.error('NEVER Store subscription contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('NEVER Store subscription contract check passed.');
console.log(`- Group: ${expected.group}`);
console.log(`- NEVER: ${expected.base.productId} · level ${expected.base.subscriptionLevel} · €${expected.base.priceEUR.toFixed(2)} · ${expected.base.trialDays}-day intro trial`);
console.log(`- NEVER AI: ${expected.ai.productId} · level ${expected.ai.subscriptionLevel} · €${expected.ai.priceEUR.toFixed(2)} · no planned trial`);
