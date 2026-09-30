import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo ?? {};
const scope = process.env.NEVER_RELEASE_SCOPE || 'testflight';
const strict = scope === 'appstore';
const failures = [];
const warnings = [];

if (config.name !== 'NEVER') failures.push(`expo.name must be NEVER (found ${config.name ?? 'missing'})`);

const scheme = config.scheme;
const iosBundle = config.ios?.bundleIdentifier;
const androidPackage = config.android?.package;
const sharing = (config.plugins || []).find((entry) => Array.isArray(entry) && entry[0] === 'expo-sharing');
const sharingConfig = Array.isArray(sharing) ? sharing[1]?.ios : undefined;
const shareBundle = sharingConfig?.extensionBundleIdentifier;
const appGroup = sharingConfig?.appGroupId;

const legacy = [
  ['scheme', scheme, 'one'],
  ['iOS bundle identifier', iosBundle, 'app.one.mobile'],
  ['Android package', androidPackage, 'app.one.mobile'],
  ['Share Extension bundle identifier', shareBundle, 'app.one.mobile.ShareExtension'],
  ['App Group', appGroup, 'group.app.one.mobile']
].filter(([, value, legacyValue]) => value === legacyValue);

if (legacy.length) {
  const message = `legacy ONE identifiers still active: ${legacy.map(([label, value]) => `${label}=${value}`).join(', ')}`;
  if (strict && process.env.NEVER_ALLOW_LEGACY_IDENTIFIERS !== '1') failures.push(message);
  else warnings.push(message);
}

if (strict && scheme !== 'never' && process.env.NEVER_ALLOW_LEGACY_IDENTIFIERS !== '1') {
  failures.push('App Store release requires an explicit deep-link scheme decision; expected scheme=never or set NEVER_ALLOW_LEGACY_IDENTIFIERS=1 after intentionally retaining the legacy scheme.');
}

if (failures.length) {
  console.error(`NEVER ${scope} brand/identity check failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  for (const warning of warnings) console.error(`Warning: ${warning}`);
  process.exit(1);
}

console.log(`NEVER ${scope} brand/identity check passed.`);
for (const warning of warnings) console.warn(`Warning: ${warning}`);
