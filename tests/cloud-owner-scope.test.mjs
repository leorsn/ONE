import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const load = (file) => readFile(new URL('../' + file, import.meta.url), 'utf8');

test('cloud item reads explicitly filter by active user in addition to Supabase RLS', async () => {
  const source = await load('src/supabase/items.ts');
  assert.match(source, /pullCloudItems\(userId: string\)/);
  assert.match(source, /\.select\(CLOUD_SELECT\)\s*\.eq\('user_id', userId\)/);
});

test('deletion is scoped to both item ID and owner ID', async () => {
  const source = await load('src/supabase/items.ts');
  assert.match(source, /deleteCloudItem\(id: string, userId: string\)/);
  assert.match(source, /\.delete\(\)\.eq\('id', id\)\.eq\('user_id', userId\)/);
});

test('item sync passes the signed-in identity through reads and deletes', async () => {
  const source = await load('src/context/ItemsContext.tsx');
  assert.match(source, /pullCloudItems\(syncUserId\)/);
  assert.match(source, /deleteCloudItem\(tombstone\.id, syncUserId\)/);
  assert.match(source, /deleteCloudItem\(id, userId\)/);
});
