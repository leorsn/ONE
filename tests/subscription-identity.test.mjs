import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('RevenueCat identity follows NEVER account login/logout explicitly', async () => {
  const revenueCat = await text('src/subscription/revenueCat.ts');

  assert.match(revenueCat, /Purchases\.logIn\(nextUserId\)/);
  assert.match(revenueCat, /identifiedUserId = nextUserId/);
  assert.match(revenueCat, /Purchases\.logOut\(\)/);
  assert.match(revenueCat, /identifiedUserId = null/);
});

test('purchase and restore results cannot apply after NEVER account identity changes', async () => {
  const context = await text('src/context/PlanContext.tsx');

  assert.match(context, /const purchaseIdentity = userId/);
  assert.match(context, /if \(identityRef\.current !== purchaseIdentity\) return \{ ok: false, cancelled: true \}/);

  const identityChecks = context.match(/identityRef\.current !== purchaseIdentity/g) ?? [];
  assert.ok(identityChecks.length >= 4, 'expected identity checks around both purchase and restore async state application');
});

test('paid access is resolved from active RevenueCat entitlements instead of purchase intent', async () => {
  const revenueCat = await text('src/subscription/revenueCat.ts');

  assert.match(revenueCat, /planFromCustomerInfo\(customerInfo\)/);
  assert.match(revenueCat, /customerInfo\.entitlements\.active\[revenueCatEntitlements\.oneAi\]/);
  assert.match(revenueCat, /customerInfo\.entitlements\.active\[revenueCatEntitlements\.one\]/);
  assert.match(revenueCat, /planIncludesRequestedAccess\(activePlan, plan\)/);
});
