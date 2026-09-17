import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appConfigPath = path.join(root, 'app.json');
const config = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
const expo = config.expo || {};
const failures = [];
const warnings = [];

if (expo.name !== 'NEVER') failures.push(`expo.name must be NEVER (found ${JSON.stringify(expo.name)})`);
if (!expo.ios?.bundleIdentifier) failures.push('ios.bundleIdentifier is missing');
if (!expo.version) failures.push('expo.version is missing');

const iconPath = expo.ios?.icon || expo.icon;
if (!iconPath) {
  failures.push('No final iOS app icon is configured in app.json (expo.icon or expo.ios.icon)');
} else {
  const resolved = path.resolve(root, iconPath);
  if (!fs.existsSync(resolved)) failures.push(`Configured app icon does not exist: ${iconPath}`);
  if (!/\.png$/i.test(iconPath)) warnings.push('Use a PNG source asset for the App Store icon pipeline');
}

const splashImage = expo.splash?.image;
if (!splashImage) {
  warnings.push('No explicit launch/splash image is configured; visually verify the native launch experience before TestFlight');
} else if (!fs.existsSync(path.resolve(root, splashImage))) {
  failures.push(`Configured splash image does not exist: ${splashImage}`);
}

if (failures.length) {
  console.error('NEVER store asset check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error('Warnings:');
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log('NEVER store asset check passed.');
for (const warning of warnings) console.warn(`Warning: ${warning}`);
