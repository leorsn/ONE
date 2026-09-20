import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('native acceptance diagnostics are development-only in distributed builds', async () => {
  const diagnostics = await text('app/dev-native.tsx');
  assert.match(diagnostics, /if \(!__DEV__\) return <Redirect href="\/\(tabs\)" \/>/);
  assert.match(diagnostics, /if \(!__DEV__\) return;/);
});

test('privacy surface reads release legal URLs from public environment configuration', async () => {
  const privacy = await text('app/settings/privacy.tsx');
  assert.match(privacy, /EXPO_PUBLIC_PRIVACY_POLICY_URL/);
  assert.match(privacy, /EXPO_PUBLIC_SUPPORT_URL/);
  assert.match(privacy, /EXPO_PUBLIC_TERMS_URL/);
  assert.doesNotMatch(privacy, /example\.com|localhost|127\.0\.0\.1/i);
});

test('subscription paywall exposes Privacy Policy and Terms of Use from release URLs', async () => {
  const upgrade = await text('app/upgrade.tsx');
  assert.match(upgrade, /EXPO_PUBLIC_PRIVACY_POLICY_URL/);
  assert.match(upgrade, /EXPO_PUBLIC_TERMS_URL/);
  assert.match(upgrade, />Terms of Use</);
  assert.match(upgrade, />Privacy Policy</);
});

test('subscription surfaces use RevenueCat storefront price and introductory-offer truth', async () => {
  const revenueCat = await text('src/subscription/revenueCat.ts');
  const planContext = await text('src/context/PlanContext.tsx');
  const upgrade = await text('app/upgrade.tsx');
  const settings = await text('src/screens/SettingsV5.tsx');

  assert.match(revenueCat, /rcPackage\?\.product\.priceString\?\.trim\(\)/);
  assert.match(revenueCat, /rcPackage\?\.product\.introPrice/);
  assert.match(revenueCat, /getRevenueCatStorefront/);
  assert.match(planContext, /getRevenueCatStorefront/);
  assert.match(planContext, /introOffers/);
  assert.match(planContext, /localizedPrices/);
  assert.match(upgrade, /storefrontPrice\(localizedPrices\.one, billingConfigured/);
  assert.match(upgrade, /storefrontPrice\(localizedPrices\.one_ai, billingConfigured/);
  assert.match(upgrade, /storefrontOffer\(\s*introOffers\.one/);
  assert.match(upgrade, /storefrontOffer\(\s*introOffers\.one_ai/);
  assert.match(upgrade, /if \(!introOffer\) return `Monthly subscription/);
  assert.match(upgrade, /if \(introOffer\.price === 0\)/);
  assert.match(upgrade, /Apple determines introductory-offer eligibility at purchase time/);
  assert.doesNotMatch(upgrade, /7-day free trial for eligible new subscribers/);
  assert.match(settings, /membershipValue\(plan, localizedPrices, billingConfigured\)/);
  assert.match(settings, /billingConfigured \? 'Active · App Store'/);
});

test('subscription purchase buttons fail closed when the current RevenueCat offering does not expose the plan', async () => {
  const upgrade = await text('app/upgrade.tsx');
  assert.match(upgrade, /const availableInStorefront = Boolean\(localizedPrices\[planKey\]\)/);
  assert.match(upgrade, /const purchaseReady = billingConfigured && availableInStorefront/);
  assert.match(upgrade, /const canPurchase = purchaseReady && !purchasing/);
  assert.match(upgrade, /disabled=\{!canPurchase\}/);
  assert.match(upgrade, /Unavailable in App Store/);
});

test('subscription purchase loading is scoped to the selected NEVER plan', async () => {
  const upgrade = await text('app/upgrade.tsx');
  assert.match(upgrade, /useState<PurchasePlan \| null>\(null\)/);
  assert.match(upgrade, /const isThisPlanPurchasing = purchasing && purchasingPlan === planKey/);
  assert.match(upgrade, /setPurchasingPlan\(planKey\)/);
  assert.match(upgrade, /setPurchasingPlan\(null\)/);
  assert.match(upgrade, /purchasing && !purchasingPlan/);
});

test('account deletion warns active subscribers and still permits immediate deletion', async () => {
  const settings = await text('src/screens/SettingsV5.tsx');
  assert.match(settings, /const hasStoreSubscription = billingConfigured && plan !== 'none'/);
  assert.match(settings, /https:\/\/apps\.apple\.com\/account\/subscriptions/);
  assert.match(settings, /Subscription continues after deletion/);
  assert.match(settings, /Manage Subscription/);
  assert.match(settings, /Delete Anyway/);
  assert.match(settings, /confirmPermanentDelete/);
});

test('saved originals remain actionable from memory detail', async () => {
  const detail = await text('app/item/[id].tsx');
  assert.match(detail, /const sourceUri = currentItem\.localAttachmentUri \|\| currentItem\.imageUrl \|\| currentItem\.attachmentUrl/);
  assert.match(detail, /if \(sourceIsImage\) \{\s*setSourceExpanded/);
  assert.match(detail, /Sharing\.isAvailableAsync\(\)/);
  assert.match(detail, /Sharing\.shareAsync\(sourceUri/);
  assert.match(detail, /accessibilityLabel=.*Open original file/);
});

test('App Store release environment requires both billing and Terms configuration', async () => {
  const releaseEnv = await text('scripts/verify-release-env.mjs');
  assert.match(releaseEnv, /required\.push\('EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'EXPO_PUBLIC_TERMS_URL'\)/);
});

test('manual NEVER release gates remain exposed without running production-only checks in normal CI', async () => {
  const pkg = JSON.parse(await text('package.json'));
  assert.equal(pkg.scripts['release:env-check'], 'node scripts/verify-release-env.mjs');
  assert.equal(pkg.scripts['release:asset-check'], 'node scripts/verify-store-assets.mjs');
  assert.equal(pkg.scripts['release:privacy-check'], 'node scripts/verify-ios-privacy-manifests.mjs');
  assert.match(pkg.scripts['release:script-check'], /verify-ios-privacy-manifests\.mjs/);
  assert.doesNotMatch(pkg.scripts.quality, /release:env-check|release:asset-check|release:privacy-check/);
});

test('EAS distribution profiles keep development tooling out of preview and production', async () => {
  const eas = JSON.parse(await text('eas.json'));
  const development = eas.build?.development;
  const preview = eas.build?.preview;
  const production = eas.build?.production;

  assert.equal(development?.developmentClient, true);
  assert.equal(development?.distribution, 'internal');
  assert.equal(development?.environment, 'development');

  assert.equal(preview?.environment, 'preview');
  assert.equal(preview?.distribution, 'internal');
  assert.notEqual(preview?.developmentClient, true);
  assert.notEqual(preview?.extends, 'development');

  assert.equal(production?.environment, 'production');
  assert.equal(production?.autoIncrement, true);
  assert.notEqual(production?.developmentClient, true);
  assert.notEqual(production?.distribution, 'internal');
  assert.notEqual(production?.extends, 'development');
});

test('consumer display name stays NEVER while technical V1 identifiers remain stable', async () => {
  const config = JSON.parse(await text('app.json'));
  assert.equal(config.expo.name, 'NEVER');
  assert.equal(config.expo.scheme, 'one');
  assert.equal(config.expo.orientation, 'default');
  assert.equal(config.expo.ios.bundleIdentifier, 'app.one.mobile');
  assert.equal(config.expo.ios.supportsTablet, true);
  assert.notEqual(config.expo.ios.requireFullScreen, true);
});