import fs from 'node:fs';

const app = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const eas = JSON.parse(fs.readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));

const expo = app.expo || {};
const plugins = Array.isArray(expo.plugins) ? expo.plugins : [];

function fail(message) {
  throw new Error(`Native release config invalid: ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function pluginConfig(name) {
  const entry = plugins.find((plugin) =>
    Array.isArray(plugin) ? plugin[0] === name : plugin === name
  );
  return Array.isArray(entry) ? entry[1] : entry ? {} : null;
}

assert(expo.scheme === 'one', 'URL scheme must remain one');
assert(expo.ios?.bundleIdentifier === 'app.one.mobile', 'iOS bundle identifier must remain app.one.mobile');
assert(expo.ios?.supportsTablet === true, 'iPad support must remain enabled');

const sharing = pluginConfig('expo-sharing');
assert(sharing, 'expo-sharing plugin is required');
assert(sharing.ios?.enabled === true, 'iOS Share Extension must be enabled');
assert(
  sharing.ios?.extensionBundleIdentifier === 'app.one.mobile.ShareExtension',
  'Share Extension bundle identifier must remain app.one.mobile.ShareExtension'
);
assert(
  sharing.ios?.appGroupId === 'group.app.one.mobile',
  'Share Extension App Group must remain group.app.one.mobile'
);
assert(sharing.ios?.activationRule?.supportsText === true, 'Share Extension must accept text');
assert((sharing.ios?.activationRule?.supportsImageWithMaxCount || 0) >= 1, 'Share Extension must accept images');
assert((sharing.ios?.activationRule?.supportsFileWithMaxCount || 0) >= 1, 'Share Extension must accept files');

assert(pluginConfig('expo-notifications') !== null, 'expo-notifications plugin is required');
assert(pluginConfig('expo-image-picker') !== null, 'expo-image-picker plugin is required');

const development = eas.build?.development;
assert(development?.developmentClient === true, 'EAS development profile must create a development client');
assert(development?.distribution === 'internal', 'EAS development profile must use internal distribution');
assert(eas.build?.production?.autoIncrement === true, 'Production build numbers must auto-increment');

console.log('Native release configuration verified.');
