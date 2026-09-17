import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('NEVER account deletion removes attachments, items and the authenticated user', async () => {
  const client = await text('src/supabase/account.ts');
  const edge = await text('supabase/functions/delete-account/index.ts');
  const schema = await text('supabase/one_schema.sql');
  const cloud = await text('supabase/one_cloud_foundation.sql');
  const attachments = await text('src/supabase/attachments.ts');

  assert.match(client, /supabase\.functions\.invoke\('delete-account'/);
  assert.match(edge, /await deleteUserAttachments\(admin, userId\)/);
  assert.match(edge, /\.from\('items'\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\('user_id', userId\)/);
  assert.match(edge, /admin\.auth\.admin\.deleteUser\(userId\)/);
  assert.match(edge, /\.from\(BUCKET\)[\s\S]*?\.list\(userId/);
  assert.match(edge, /\.remove\(paths\)/);

  assert.match(schema, /user_id uuid not null references auth\.users\(id\) on delete cascade/);
  assert.match(cloud, /user_id uuid primary key references auth\.users\(id\) on delete cascade/);
  assert.match(attachments, /const path = `\$\{userId\}\/\$\{cleanName\}`/);
});
