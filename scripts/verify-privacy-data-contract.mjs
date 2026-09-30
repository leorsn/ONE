import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const revenueCat = fs.readFileSync(new URL('../src/subscription/revenueCat.ts', import.meta.url), 'utf8');
const acceptance = fs.readFileSync(new URL('../src/native/acceptance.ts', import.meta.url), 'utf8');
const inventory = fs.readFileSync(new URL('../docs/APP_STORE_PRIVACY_DATA_INVENTORY.md', import.meta.url), 'utf8');

const failures = [];
const allDependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {})
};

const reviewRequiredDependencies = [
  'expo-tracking-transparency',
  '@sentry/react-native',
  '@react-native-firebase/analytics',
  '@react-native-google-mobile-ads',
  'react-native-google-mobile-ads',
  'mixpanel-react-native',
  '@amplitude/analytics-react-native',
  'posthog-react-native',
  '@segment/analytics-react-native',
  'react-native-appsflyer',
  'react-native-adjust',
  'react-native-branch',
  'react-native-fbsdk-next'
];

for (const dependency of reviewRequiredDependencies) {
  if (dependency in allDependencies) {
    failures.push(`${dependency} is present; App Store privacy inventory and tracking/diagnostics disclosures require explicit review before release`);
  }
}

const revenueCatRiskPatterns = [
  ['RevenueCat device identifier collection', /collectDeviceIdentifiers\s*\(/],
  ['RevenueCat advertising identifier attribute', /\$idfa|advertisingIdentifier/i],
  ['RevenueCat email customer attribute', /setEmail\s*\(|\$email/],
  ['RevenueCat display-name customer attribute', /setDisplayName\s*\(|\$displayName/]
];
for (const [label, pattern] of revenueCatRiskPatterns) {
  if (pattern.test(revenueCat)) failures.push(`${label} is enabled; update the privacy inventory before release`);
}

if (!/Purchases\.logIn\(nextUserId\)/.test(revenueCat)) {
  failures.push('RevenueCat custom App User ID login is missing; privacy contract assumes purchase history is linked to NEVER User ID');
}

if (!/if \(!__DEV__\) return;/.test(acceptance)) {
  failures.push('native acceptance diagnostics are no longer development-only; review Diagnostics/Usage Data disclosures');
}
if (!/AsyncStorage/.test(acceptance)) {
  failures.push('native acceptance diagnostics storage behavior changed unexpectedly');
}

const requiredInventorySections = [
  'Contact Info → Email Address',
  'User Content → Other User Content',
  'User Content → Photos or Videos',
  'Purchases → Purchase History',
  'Identifiers → User ID',
  'Search History',
  'Tracking / ATT conclusion',
  'Supabase',
  'RevenueCat',
  'OpenAI API'
];
for (const section of requiredInventorySections) {
  if (!inventory.includes(section)) failures.push(`privacy inventory is missing required section: ${section}`);
}

if (!inventory.includes('**Repository-based answer: No.**')) {
  failures.push('tracking conclusion changed or is missing; review App Store privacy answers');
}

if (failures.length) {
  console.error('NEVER privacy data contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('NEVER privacy data contract check passed.');
console.log('- no known ads/attribution/general analytics/crash SDK dependency was introduced');
console.log('- RevenueCat remains custom-user-ID based without device/contact attribute collection in app code');
console.log('- production native acceptance diagnostics remain disabled');
console.log('- App Store privacy inventory contains the required launch data categories and processor sections');
