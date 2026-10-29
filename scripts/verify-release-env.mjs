const releaseScope = process.env.NEVER_RELEASE_SCOPE || 'testflight';
// Fail closed if stale EAS environments still target the retired ONE backend.
// Update this only as part of an explicitly reviewed Supabase migration.
const expectedSupabaseHost = 'nywfoprcwbnsxybdqpma.supabase.co';

const required = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_PRIVACY_POLICY_URL',
  'EXPO_PUBLIC_SUPPORT_URL'
];

if (releaseScope === 'appstore' || process.env.NEVER_REQUIRE_BILLING === '1') {
  required.push('EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'EXPO_PUBLIC_TERMS_URL');
}

const failures = [];
const warnings = [];

const billingRelease = releaseScope === 'appstore' || process.env.NEVER_REQUIRE_BILLING === '1';
const iosRevenueCatKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim();
if (billingRelease && iosRevenueCatKey && !iosRevenueCatKey.startsWith('appl_')) {
  failures.push('App Store/TestFlight billing requires an appl_ RevenueCat iOS key; test_ keys are development-only');
}

for (const name of required) {
  const value = process.env[name]?.trim();
  if (!value) {
    failures.push(`${name} is missing`);
    continue;
  }
  if (/YOUR_|PLACEHOLDER|CHANGEME|example\.com/i.test(value)) {
    failures.push(`${name} still contains a placeholder value`);
  }
}

for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_PRIVACY_POLICY_URL', 'EXPO_PUBLIC_SUPPORT_URL', 'EXPO_PUBLIC_TERMS_URL']) {
  const value = process.env[name]?.trim();
  if (!value) continue;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') failures.push(`${name} must use https`);
  } catch {
    failures.push(`${name} is not a valid URL`);
  }
}

const configuredSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
if (configuredSupabaseUrl) {
  try {
    const url = new URL(configuredSupabaseUrl);
    if (url.protocol === 'https:' &&
        (url.hostname !== expectedSupabaseHost || url.pathname !== '/' || url.search || url.hash || url.username || url.password || url.port)) {
      failures.push(`EXPO_PUBLIC_SUPABASE_URL must target the dedicated NEVER project (${expectedSupabaseHost}); check EAS environment overrides`);
    }
  } catch {
    // The general URL validation above already reports malformed values.
  }
}

if (releaseScope !== 'appstore' && !process.env.EXPO_PUBLIC_TERMS_URL?.trim()) {
  warnings.push('EXPO_PUBLIC_TERMS_URL is not configured');
}

if (releaseScope !== 'appstore' && !process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim()) {
  warnings.push('RevenueCat iOS key is absent; paid App Store access must remain disabled for this build');
}

if (failures.length) {
  console.error(`NEVER ${releaseScope} environment check failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error('Warnings:');
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log(`NEVER ${releaseScope} environment check passed.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
