import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const easConfig = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');

const expo = appConfig.expo ?? {};
const ios = expo.ios ?? {};
const android = expo.android ?? {};
const plugins = expo.plugins ?? [];

assert(expo.scheme === 'one', 'Expo scheme must remain one');
assert(ios.bundleIdentifier === 'app.one.mobile', 'Unexpected iOS bundle identifier');
assert(android.package === 'app.one.mobile', 'Unexpected Android package identifier');
assert(Array.isArray(ios.associatedDomains) && ios.associatedDomains.length > 0, 'Associated domains are missing');
assert(Array.isArray(android.intentFilters) && android.intentFilters.length > 0, 'Android deep-link intent filters are missing');
assert(android.notification?.icon, 'Android notification icon is missing');
assert(envExample.includes('EXPO_PUBLIC_SUPABASE_URL'), 'Supabase URL example is missing');
assert(envExample.includes('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), 'Supabase publishable key example is missing');
assert(!envExample.includes('SUPABASE_SERVICE_ROLE_KEY='), 'Service-role key must never be documented as a client env');
assert(!envExample.includes('EXPO_PUBLIC_OPENAI'), 'OpenAI secrets must never be public Expo env values');

const requiredPackages = {
  'expo-sharing': '~57.0.18',
  'expo-notifications': '~57.0.18',
  'expo-image-picker': '~57.0.10',
  'expo-file-system': '~57.0.8',
  'expo-ocr-kit': '0.1.4',
  'react-native-purchases': '9.9.3'
};

for (const [name, version] of Object.entries(requiredPackages)) {
  assert(pkg.dependencies?.[name] === version, `${name} must remain pinned at ${version}`);
}

const sharingPlugin = plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-sharing');
assert(sharingPlugin, 'expo-sharing config plugin is missing');
assert(sharingPlugin[1]?.ios?.enabled === true, 'iOS incoming sharing is not enabled');
assert(
  sharingPlugin[1]?.ios?.extensionBundleIdentifier === 'app.one.mobile.ShareExtension',
  'Share Extension bundle identifier is incorrect'
);
assert(
  sharingPlugin[1]?.ios?.appGroupId === 'group.app.one.mobile',
  'Share Extension App Group is incorrect'
);
assert(sharingPlugin[1]?.android?.enabled === true, 'Android incoming sharing is not enabled');

const notificationPlugin = plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-notifications');
assert(notificationPlugin, 'expo-notifications config plugin is missing');
assert(notificationPlugin[1]?.icon === './assets/icon.png', 'Notification icon config drifted');

const imagePickerPlugin = plugins.find((entry) => Array.isArray(entry) && entry[0] === 'expo-image-picker');
assert(imagePickerPlugin, 'expo-image-picker config plugin is missing');
assert(
  typeof imagePickerPlugin[1]?.photosPermission === 'string' && imagePickerPlugin[1].photosPermission.length > 20,
  'Photo permission copy is missing'
);
assert(
  typeof imagePickerPlugin[1]?.cameraPermission === 'string' && imagePickerPlugin[1].cameraPermission.length > 20,
  'Camera permission copy is missing'
);

assert(easConfig.build?.development?.developmentClient === true, 'Development profile must use a development client');
assert(easConfig.build?.development?.distribution === 'internal', 'Development build must use internal distribution');
assert(easConfig.build?.development?.environment === 'development', 'Development profile must use the development EAS environment');
assert(easConfig.build?.preview?.distribution === 'internal', 'Preview build must use internal distribution');
assert(easConfig.build?.preview?.environment === 'preview', 'Preview profile must use the preview EAS environment');
assert(easConfig.build?.preview?.developmentClient !== true, 'Preview profile must not include development client tooling');
assert(easConfig.build?.production?.environment === 'production', 'Production profile must use the production EAS environment');
assert(easConfig.build?.production?.developmentClient !== true, 'Production profile must not include development client tooling');
assert(easConfig.build?.production?.autoIncrement === true, 'Production build numbers must auto-increment');

console.log('Native release configuration verified.');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
