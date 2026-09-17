import fs from 'node:fs';
import path from 'node:path';

const archivePath = process.argv[2] || process.env.NEVER_IOS_ARCHIVE_PATH;

if (!archivePath) {
  console.error('Usage: npm run release:privacy-check -- /path/to/NEVER.xcarchive');
  console.error('Or set NEVER_IOS_ARCHIVE_PATH to the generated iOS .xcarchive directory.');
  process.exit(1);
}

const resolvedArchive = path.resolve(archivePath);
if (!fs.existsSync(resolvedArchive)) {
  console.error(`NEVER iOS privacy manifest check failed: archive does not exist: ${resolvedArchive}`);
  process.exit(1);
}

const stat = fs.statSync(resolvedArchive);
if (!stat.isDirectory()) {
  console.error(`NEVER iOS privacy manifest check failed: expected an .xcarchive directory: ${resolvedArchive}`);
  process.exit(1);
}

const manifests = [];
walk(resolvedArchive, manifests);

if (!manifests.length) {
  console.error('NEVER iOS privacy manifest check failed: no PrivacyInfo.xcprivacy file was found in the archive.');
  console.error('Inspect the generated native project and dependency privacy manifests before TestFlight promotion.');
  process.exit(1);
}

console.log(`NEVER iOS privacy manifest archive check found ${manifests.length} manifest(s):`);
for (const manifest of manifests) {
  console.log(`- ${path.relative(resolvedArchive, manifest)}`);
}
console.log('Presence is verified. Required-Reason API declarations still require manual validation against actual shipped API use and Apple diagnostics.');

function walk(directory, matches) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matches);
      continue;
    }
    if (entry.isFile() && entry.name === 'PrivacyInfo.xcprivacy') matches.push(fullPath);
  }
}
