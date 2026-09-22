import fs from 'node:fs';
import path from 'node:path';
import { validatePng } from './png-integrity.mjs';

const root = process.cwd();
const appConfigPath = path.join(root, 'app.json');
const config = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
const expo = config.expo || {};
const failures = [];
const warnings = [];

if (expo.name !== 'NEVER') failures.push(`expo.name must be NEVER (found ${JSON.stringify(expo.name)})`);
if (!expo.ios?.bundleIdentifier) failures.push('ios.bundleIdentifier is missing');
if (!expo.version) failures.push('expo.version is missing');

function inspectPng(iconPath, label) {
  const resolved = path.resolve(root, iconPath);
  if (!fs.existsSync(resolved)) {
    failures.push(`${label} does not exist: ${iconPath}`);
    return;
  }

  if (!/\.png$/i.test(iconPath)) {
    failures.push(`${label} must use a PNG source asset unless an Icon Composer .icon directory is configured: ${iconPath}`);
    return;
  }

  const buffer = fs.readFileSync(resolved);
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(pngSignature) || buffer.toString('ascii', 12, 16) !== 'IHDR') {
    failures.push(`${label} is not a valid PNG file: ${iconPath}`);
    return;
  }

  let chunks;
  try {
    chunks = validatePng(buffer);
  } catch (error) {
    failures.push(`${label} has corrupt PNG image data: ${iconPath} (${error.message})`);
    return;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer[25];

  if (width !== height) failures.push(`${label} must be exactly square (found ${width}x${height})`);
  if (width !== 1024 || height !== 1024) failures.push(`${label} must be 1024x1024 for the NEVER release source asset (found ${width}x${height})`);

  const hasTransparencyChunk = chunks.includes('tRNS');
  if (hasTransparencyChunk) failures.push(`${label} contains a PNG transparency chunk; iOS app icon artwork must fill the square without transparency`);
  if (colorType === 4 || colorType === 6) {
    warnings.push(`${label} uses an alpha-capable PNG color type; visually/export-verify that every pixel is fully opaque before TestFlight`);
  }
}

function inspectIconEntry(icon, label) {
  if (typeof icon !== 'string' || !icon.trim()) {
    failures.push(`${label} must be a non-empty asset path`);
    return;
  }

  if (/\.icon$/i.test(icon)) {
    const resolved = path.resolve(root, icon);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      failures.push(`${label} Icon Composer directory does not exist: ${icon}`);
    } else {
      warnings.push(`${label} uses an Icon Composer directory; validate light/dark/tinted output in a production-like iOS build`);
    }
    return;
  }

  inspectPng(icon, label);
}

const iosIcon = expo.ios?.icon;
if (iosIcon && typeof iosIcon === 'object' && !Array.isArray(iosIcon)) {
  const variants = Object.entries(iosIcon).filter(([, value]) => Boolean(value));
  if (!variants.length) failures.push('ios.icon variants are configured but empty');
  for (const [variant, value] of variants) inspectIconEntry(value, `iOS ${variant} app icon`);
} else {
  const iconPath = iosIcon || expo.icon;
  if (!iconPath) failures.push('No final iOS app icon is configured in app.json (expo.icon or expo.ios.icon)');
  else inspectIconEntry(iconPath, 'iOS app icon');
}

const alternateIconPlugin = expo.plugins?.includes('./plugins/with-never-app-icons');
if (alternateIconPlugin) {
  inspectIconEntry('./assets/icons/never-wordmark.png', 'iOS alternate wordmark app icon');
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
