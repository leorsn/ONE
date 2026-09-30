import fs from 'node:fs';

const eas = JSON.parse(fs.readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
const failures = [];
const production = eas.build?.production;
const submit = eas.submit?.production;

if (!production || typeof production !== 'object') {
  failures.push('eas.json must define build.production');
} else {
  if (production.environment !== 'production') failures.push('build.production.environment must be production');
  if (production.developmentClient === true) failures.push('build.production must not enable developmentClient');
  if (production.distribution === 'internal') failures.push('build.production must not use internal distribution');
  if (production.autoIncrement !== true) failures.push('build.production.autoIncrement must remain enabled');
}

if (!submit || typeof submit !== 'object') failures.push('eas.json must define submit.production');
if (eas.cli?.appVersionSource !== 'remote') failures.push('cli.appVersionSource must remain remote for release build-number management');

const previewProfiles = ['development', 'development-simulator', 'preview', 'partner-preview'];
for (const name of previewProfiles) {
  if (!eas.build?.[name]) failures.push(`eas.json is missing expected non-production profile ${name}`);
}

if (failures.length) {
  console.error('NEVER EAS production configuration check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('NEVER EAS production configuration check passed.');
console.log('- production environment selected');
console.log('- production is not a development/internal-distribution build');
console.log('- remote app version source + autoIncrement enabled');
console.log('- production submit profile exists');
