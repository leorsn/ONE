import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo ?? {};
const scope = process.env.NEVER_RELEASE_SCOPE || 'testflight';
const failures = [];

const sharing = (config.plugins || []).find((entry) => Array.isArray(entry) && entry[0] === 'expo-sharing');
const sharingConfig = Array.isArray(sharing) ? sharing[1]?.ios : undefined;

const expected = {
  name: 'NEVER',
  slug: 'never-app',
  scheme: 'never',
  iosBundle: 'app.never.mobile',
  androidPackage: 'app.never.mobile',
  shareBundle: 'app.never.mobile.ShareExtension',
  appGroup: 'group.app.never.mobile'
};

const actual = {
  name: config.name,
  slug: config.slug,
  scheme: config.scheme,
  iosBundle: config.ios?.bundleIdentifier,
  androidPackage: config.android?.package,
  shareBundle: sharingConfig?.extensionBundleIdentifier,
  appGroup: sharingConfig?.appGroupId
};

for (const [key, expectedValue] of Object.entries(expected)) {
  if (actual[key] !== expectedValue) {
    failures.push(`${key} must be ${expectedValue} (found ${actual[key] ?? 'missing'})`);
  }
}

const serialized = JSON.stringify(config);
for (const legacy of ['app.one.mobile', 'group.app.one.mobile', '"scheme":"one"', '"slug":"one-app"']) {
  if (serialized.includes(legacy)) failures.push(`legacy active identifier remains in app.json: ${legacy}`);
}

if (failures.length) {
  console.error(`NEVER ${scope} brand/identity check failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NEVER ${scope} brand/identity check passed.`);
console.log(`- bundle: ${expected.iosBundle}`);
console.log(`- scheme: ${expected.scheme}`);
console.log(`- share extension: ${expected.shareBundle}`);
console.log(`- app group: ${expected.appGroup}`);
