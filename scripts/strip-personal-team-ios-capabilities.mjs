import fs from 'node:fs';
import path from 'node:path';

const iosRoot = path.join(process.cwd(), 'ios');

if (!fs.existsSync(iosRoot)) {
  throw new Error('Expected generated ios/ directory. Run Expo prebuild first.');
}

const entitlementFiles = walk(iosRoot).filter((file) => file.endsWith('.entitlements'));
let changedEntitlements = 0;

for (const file of entitlementFiles) {
  const original = fs.readFileSync(file, 'utf8');
  let next = original;

  next = removePlistKey(next, 'aps-environment');
  next = removePlistKey(next, 'com.apple.security.application-groups');

  if (next !== original) {
    fs.writeFileSync(file, next);
    changedEntitlements += 1;
  }
}

const projectFiles = walk(iosRoot).filter((file) => file.endsWith('project.pbxproj'));
let changedProjects = 0;

for (const file of projectFiles) {
  const original = fs.readFileSync(file, 'utf8');
  let next = original;

  // Xcode records these capabilities under TargetAttributes/SystemCapabilities.
  // Remove only the unsupported Personal Team capabilities from generated projects.
  next = next.replace(/\n\s*com\.apple\.Push\s*=\s*\{\s*enabled\s*=\s*1;\s*\};/g, '');
  next = next.replace(/\n\s*com\.apple\.ApplicationGroups(?:\.iOS)?\s*=\s*\{\s*enabled\s*=\s*1;\s*\};/g, '');

  if (next !== original) {
    fs.writeFileSync(file, next);
    changedProjects += 1;
  }
}

const residual = [];
for (const file of [...entitlementFiles, ...projectFiles]) {
  const text = fs.readFileSync(file, 'utf8');
  if (
    text.includes('aps-environment') ||
    text.includes('com.apple.security.application-groups') ||
    text.includes('com.apple.Push') ||
    text.includes('com.apple.ApplicationGroups')
  ) {
    residual.push(path.relative(process.cwd(), file));
  }
}

if (residual.length) {
  throw new Error(
    `Personal Team capability stripping was incomplete. Remaining capability markers: ${residual.join(', ')}`
  );
}

console.log(
  `Personal Team iOS test config ready: stripped unsupported Push/App Groups from ${changedEntitlements} entitlement file(s) and ${changedProjects} Xcode project(s).`
);

function removePlistKey(contents, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = String.raw`(?:<string>[\s\S]*?<\/string>|<array>[\s\S]*?<\/array>|<true\s*\/?>|<false\s*\/?>|<dict>[\s\S]*?<\/dict>)`;
  const pattern = new RegExp(String.raw`\s*<key>${escaped}<\/key>\s*${value}\s*`, 'g');
  return contents.replace(pattern, '\n');
}

function walk(dir) {
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}
