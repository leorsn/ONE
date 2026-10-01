import test from 'node:test';
import assert from 'node:assert/strict';

import { fallbackPlanForRuntime, isDevelopmentBetaAccess } from '../src/subscription/access.ts';
import { hasPlanFeature, planIncludesRequestedAccess } from '../src/subscription/features.ts';

test('development may use NEVER AI beta access without configured billing', () => {
  assert.equal(fallbackPlanForRuntime(true), 'one_ai');
  assert.equal(isDevelopmentBetaAccess(true, false), true);
  assert.equal(hasPlanFeature('one_ai', 'ask_one'), true);
});

test('preview and production never receive paid access from missing billing configuration', () => {
  assert.equal(fallbackPlanForRuntime(false), 'none');
  assert.equal(isDevelopmentBetaAccess(false, false), false);
  assert.equal(hasPlanFeature('none', 'ask_one'), false);
});

test('configured billing disables development beta labeling and defers access to RevenueCat state', () => {
  assert.equal(isDevelopmentBetaAccess(true, true), false);
  assert.equal(isDevelopmentBetaAccess(false, true), false);
});

test('active entitlement must satisfy the purchased NEVER tier', () => {
  assert.equal(planIncludesRequestedAccess('one', 'one'), true);
  assert.equal(planIncludesRequestedAccess('one_ai', 'one'), true);
  assert.equal(planIncludesRequestedAccess('none', 'one'), false);
  assert.equal(planIncludesRequestedAccess('one_ai', 'one_ai'), true);
  assert.equal(planIncludesRequestedAccess('one', 'one_ai'), false);
  assert.equal(planIncludesRequestedAccess('none', 'one_ai'), false);
});
