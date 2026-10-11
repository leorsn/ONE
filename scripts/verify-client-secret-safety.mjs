import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const scanRoots = ['app', 'src'];
const scanFiles = ['app.config.js', 'app.json', 'eas.json', 'package.json'];
const failures = [];

const forbiddenSourcePatterns = [
  { label: 'Supabase service-role environment variable', pattern: /SUPABASE_SERVICE_ROLE_KEY/g },
  { label: 'Supabase secret key', pattern: /sb_secret_[A-Za-z0-9_-]+/g },
  { label: 'OpenAI server API key reference', pattern: /OPENAI_API_KEY/g },
  { label: 'private key material', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

for (const root of scanRoots) {
  await scanDirectory(root);
}
for (const file of scanFiles) {
  await scanFile(file);
}

for (const [name, rawValue] of Object.entries(process.env)) {
  if (!name.startsWith('EXPO_PUBLIC_')) continue;
  const value = String(rawValue || '').trim();
  if (!value) continue;

  if (/(?:SERVICE_ROLE|SECRET|PRIVATE_KEY|OPENAI_API_KEY|ADMIN_KEY|SERVER_KEY)/i.test(name)) {
    failures.push(`${name} looks like a server-only credential but is prefixed EXPO_PUBLIC_`);
  }
  if (/\bsb_secret_[A-Za-z0-9_-]+\b/.test(value)) {
    failures.push(`${name} contains a Supabase secret key`);
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(value)) {
    failures.push(`${name} contains private key material`);
  }
}

const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if (publishableKey) {
  const jwtRole = decodeJwtRole(publishableKey);
  if (jwtRole === 'service_role') {
    failures.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is a service_role JWT and must never ship to the client');
  }
  if (publishableKey.startsWith('sb_secret_')) {
    failures.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is a Supabase secret key, not a publishable key');
  }
}

if (failures.length) {
  console.error('NEVER client secret safety check failed:');
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('NEVER client secret safety check passed.');

async function scanDirectory(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await scanDirectory(path);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!['.js', '.mjs', '.cjs', '.ts', '.tsx', '.json'].includes(extname(entry.name))) continue;
    await scanFile(path);
  }
}

async function scanFile(path) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch {
    return;
  }

  for (const { label, pattern } of forbiddenSourcePatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) failures.push(`${path} contains ${label}`);
  }
}

function decodeJwtRole(value) {
  const parts = value.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof decoded?.role === 'string' ? decoded.role : undefined;
  } catch {
    return undefined;
  }
}
