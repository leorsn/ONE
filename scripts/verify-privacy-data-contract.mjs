import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const appJson = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
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

const privacyManifest = appJson.expo?.ios?.privacyManifests;
if (!privacyManifest || typeof privacyManifest !== 'object') {
  failures.push('app.json must declare ios.privacyManifests for the production app target');
} else {
  if (privacyManifest.NSPrivacyTracking !== false) {
    failures.push('NSPrivacyTracking must remain false unless the tracking disclosure and ATT implementation are deliberately changed');
  }
  if (Array.isArray(privacyManifest.NSPrivacyTrackingDomains) && privacyManifest.NSPrivacyTrackingDomains.length > 0) {
    failures.push('tracking domains are configured while NEVER launch privacy contract declares no tracking');
  }

  const entries = Array.isArray(privacyManifest.NSPrivacyCollectedDataTypes)
    ? privacyManifest.NSPrivacyCollectedDataTypes
    : [];
  const byType = new Map(entries.map((entry) => [entry?.NSPrivacyCollectedDataType, entry]));
  const requiredTypes = [
    'NSPrivacyCollectedDataTypeEmailAddress',
    'NSPrivacyCollectedDataTypeOtherUserContent',
    'NSPrivacyCollectedDataTypePhotosorVideos',
    'NSPrivacyCollectedDataTypePurchaseHistory',
    'NSPrivacyCollectedDataTypeUserID',
    'NSPrivacyCollectedDataTypeSearchHistory'
  ];

  for (const type of requiredTypes) {
    const entry = byType.get(type);
    if (!entry) {
      failures.push(`iOS privacy manifest is missing collected data type ${type}`);
      continue;
    }
    if (entry.NSPrivacyCollectedDataTypeLinked !== true) {
      failures.push(`${type} must remain declared as linked to the user for the current account-backed architecture`);
    }
    if (entry.NSPrivacyCollectedDataTypeTracking !== false) {
      failures.push(`${type} must remain non-tracking unless the privacy contract is deliberately revised`);
    }
    if (!Array.isArray(entry.NSPrivacyCollectedDataTypePurposes) || !entry.NSPrivacyCollectedDataTypePurposes.includes('NSPrivacyCollectedDataTypePurposeAppFunctionality')) {
      failures.push(`${type} must include App Functionality as a collection purpose`);
    }
  }

  for (const type of ['NSPrivacyCollectedDataTypePurchaseHistory', 'NSPrivacyCollectedDataTypeUserID']) {
    const purposes = byType.get(type)?.NSPrivacyCollectedDataTypePurposes ?? [];
    if (!purposes.includes('NSPrivacyCollectedDataTypePurposeAnalytics')) {
      failures.push(`${type} must include Analytics while RevenueCat standard dashboard/customer-history behavior is part of the launch configuration`);
    }
  }
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
console.log('- app.json iOS privacy manifest matches the launch data inventory and declares tracking=false');
console.log('- App Store privacy inventory contains the required launch data categories and processor sections');
