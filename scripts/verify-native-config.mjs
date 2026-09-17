import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const easConfig = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const supabaseClient = fs.readFileSync(path.join(root, 'src/supabase/client.ts'), 'utf8');

const expo = appConfig.expo ?? {};
const ios = expo.ios ?? {};
const android = expo.android ?? {};
const plugins = expo.plugins ?? [];

assert(expo.name === 'NEVER', 'Expo display name must be NEVER');
assert(expo.scheme === 'one', 'Expo scheme must remain one');
assert(ios.bundleIdentifier === 'app.one.mobile', 'Unexpected iOS bundle identifier');
assert(ios.supportsTablet === true, 'iPad support must remain enabled');
assert(android.package === 'app.one.mobile', 'Unexpected Android package identifier');
assert(envExample.includes('EXPO_PUBLIC_SUPABASE_URL'), 'Supabase URL example is missing');
assert(envExample.includes('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'), 'Supabase publishable key example is missing');
assert(envExample.includes('EXPO_PUBLIC_PRIVACY_POLICY_URL'), 'Privacy policy URL example is missing');
assert(envExample.includes('EXPO_PUBLIC_TERMS_URL'), 'Terms URL example is missing');
assert(envExample.includes('EXPO_PUBLIC_SUPPORT_URL'), 'Support URL example is missing');
assert(!envExample.includes('SUPABASE_SERVICE_ROLE_KEY='), 'Service-role key must never be documented as a client env');
assert(!envExample.includes('EXPO_PUBLIC_OPENAI'), 'OpenAI secrets must never be public Expo env values');

const expectedAuthCallback = `${expo.scheme}://auth/callback`;
const expectedPasswordReset = `${expo.scheme}://auth/reset-password`;
assert(
  supabaseClient.includes(`ONE_AUTH_CALLBACK_URL = '${expectedAuthCallback}'`),
  `Auth callback must remain ${expectedAuthCallback}`
);
assert(
  supabaseClient.includes(`ONE_PASSWORD_RESET_URL = '${expectedPasswordReset}'`),
  `Password reset callback must remain ${expectedPasswordReset}`
);

const requiredPackages = {
  'expo-sharing': '~57.0.18',
  'expo-notifications': '~57.0.17',
  'expo-image-picker': '~57.0.16',
  'expo-file-system': '~57.0.6',
  'expo-ocr-kit': '0.1.4',
  'react-native-purchases': '10.9.0'
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
assert(sharingPlugin[1]?.ios?.activationRule?.supportsText === true, 'Share Extension must accept text');
assert((sharingPlugin[1]?.ios?.activationRule?.supportsImageWithMaxCount || 0) >= 1, 'Share Extension must accept images');
assert((sharingPlugin[1]?.ios?.activationRule?.supportsFileWithMaxCount || 0) >= 1, 'Share Extension must accept files');
assert(sharingPlugin[1]?.android?.enabled === true, 'Android incoming sharing is not enabled');

const notificationsPlugin = plugins.find(
  (entry) => entry === 'expo-notifications' || (Array.isArray(entry) && entry[0] === 'expo-notifications')
);
assert(notificationsPlugin, 'expo-notifications config plugin is missing');

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
assert(imagePickerPlugin[1].photosPermission.includes('NEVER'), 'Photo permission copy must use NEVER branding');
assert(imagePickerPlugin[1].cameraPermission.includes('NEVER'), 'Camera permission copy must use NEVER branding');

assert(easConfig.build?.development?.developmentClient === true, 'Development profile must use a development client');
assert(easConfig.build?.development?.distribution === 'internal', 'Development build must use internal distribution');
assert(easConfig.build?.development?.environment === 'development', 'Development profile must use the development EAS environment');
assert(easConfig.build?.['development-simulator']?.extends === 'development', 'Simulator profile must extend development');
assert(easConfig.build?.['development-simulator']?.ios?.simulator === true, 'Simulator profile must remain simulator-only');
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
