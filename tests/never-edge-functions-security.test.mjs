import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadFunction(name, { authenticated = true, removalWorks = true, updateWorks = true } = {}) {
  const source = readFileSync(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const state = {
    authChecks: 0,
    modelRuns: 0,
    upstreamCalls: 0,
    dataReads: 0,
    rpcCalls: 0,
    deletedUsers: 0,
    deletedItems: 0,
    filters: [],
    files: ['user/photo.png', 'user/nested/document.pdf'],
  };
  let handler;
  const env = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-public-key',
    SUPABASE_SERVICE_ROLE_KEY: 'server-only-test-key',
    OPENAI_API_KEY: 'model-test-key',
  };

  const builder = {
    select() { return this; },
    in(field, values) { state.filters.push([field, values]); return this; },
    eq(field, value) { state.filters.push([field, value]); return this; },
    delete() { state.deletedItems++; return this; },
    update() { return this; },
    then(resolve) { return Promise.resolve({ data: [{ id: 'item-1', title: 'Stored title', raw_input: 'private' }], error: null }).then(resolve); },
    async single() { return { data: { id: 'item-1', title: 'Stored title' }, error: null }; },
    async maybeSingle() { return { data: updateWorks ? { id: 'item-1' } : null, error: null }; },
  };

  const storage = {
    from() {
      return {
        async list(prefix) {
          const children = new Map();
          for (const path of state.files) {
            if (!path.startsWith(`${prefix}/`)) continue;
            const remainder = path.slice(prefix.length + 1);
            const name = remainder.split('/')[0];
            children.set(name, remainder.includes('/') ? { name, id: null } : { name, id: 'file-id' });
          }
          return { data: [...children.values()], error: null };
        },
        async remove(paths) {
          if (removalWorks) state.files = state.files.filter((path) => !paths.includes(path));
          return { error: null };
        },
      };
    },
  };

  const client = {
    auth: {
      async getUser() {
        state.authChecks++;
        return {
          data: { user: authenticated ? { id: 'user' } : null },
          error: authenticated ? null : new Error('expired'),
        };
      },
      admin: { async deleteUser() { state.deletedUsers++; return { error: null }; } },
    },
    from() { state.dataReads++; return builder; },
    storage,
    async rpc() { state.rpcCalls++; return { data: [{ id: 'item-1' }], error: null }; },
  };

  vm.runInNewContext(code, {
    exports: {}, Request, Response,
    console: { error: () => undefined },
    Deno: { env: { get: (name) => env[name] }, serve: (fn) => { handler = fn; } },
    Supabase: { ai: { Session: class { async run() { state.modelRuns++; return [0.1, 0.2]; } } } },
    require: () => ({ createClient: () => client }),
    fetch: async () => {
      state.upstreamCalls++;
      return Response.json({ output_text: JSON.stringify({
        title: 'Stored answer', body: 'It is stored.', sourceIds: ['item-1'], evidence: 'saved',
      }) });
    },
  });

  return {
    state,
    request(method = 'POST', body = '{}', token = 'valid') {
      return handler(new Request(`https://example.test/functions/v1/${name}`, {
        method,
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {},
        ...(method === 'POST' ? { body } : {}),
      }));
    },
  };
}

for (const name of ['semantic-search', 'embed-one-item', 'answer-one-recall', 'interpret-one-capture']) {
  test(`${name}: rejects missing and expired auth without accessing data or spending AI inference`, async () => {
    const missing = loadFunction(name);
    assert.equal((await missing.request('POST', '{}', '')).status, 401);
    assert.equal(missing.state.dataReads, 0);
    assert.equal(missing.state.modelRuns, 0);
    assert.equal(missing.state.upstreamCalls, 0);

    const expired = loadFunction(name, { authenticated: false });
    assert.equal((await expired.request('POST', '{}', 'expired')).status, 401);
    assert.equal(expired.state.authChecks, 1);
    assert.equal(expired.state.dataReads, 0);
    assert.equal(expired.state.modelRuns, 0);
    assert.equal(expired.state.upstreamCalls, 0);
  });

  test(`${name}: rejects unsupported methods`, async () => {
    const fn = loadFunction(name);
    assert.equal((await fn.request('GET')).status, 405);
    assert.equal(fn.state.authChecks, 0);
  });
}

test('semantic-search enforces auth before inference and owner-scoped RPC', async () => {
  const fn = loadFunction('semantic-search');
  const response = await fn.request('POST', JSON.stringify({ query: 'What did I save?' }));
  assert.equal(response.status, 200);
  assert.equal(fn.state.modelRuns, 1);
  assert.equal(fn.state.rpcCalls, 1);
});

test('embed-one-item scopes reads and updates by authenticated owner', async () => {
  const fn = loadFunction('embed-one-item');
  const response = await fn.request('POST', JSON.stringify({ itemId: 'item-1' }));
  assert.equal(response.status, 200);
  assert.equal(fn.state.modelRuns, 1);
  assert.equal(fn.state.filters.filter(([field, value]) => field === 'user_id' && value === 'user').length, 2);
});

test('embed-one-item refuses to claim an update that matched no rows', async () => {
  const fn = loadFunction('embed-one-item', { updateWorks: false });
  const response = await fn.request('POST', JSON.stringify({ itemId: 'item-1' }));
  assert.equal(response.status, 404);
});

test('answer-one-recall requires owner-scoped sources before outbound model use', async () => {
  const fn = loadFunction('answer-one-recall');
  const response = await fn.request('POST', JSON.stringify({ query: 'A question', itemIds: ['item-1'] }));
  assert.equal(response.status, 200);
  assert.equal(fn.state.upstreamCalls, 1);
  assert.ok(fn.state.filters.some(([field, value]) => field === 'user_id' && value === 'user'));
});

test('account deletion removes nested private files and the owning account', async () => {
  const fn = loadFunction('delete-account');
  const response = await fn.request();
  assert.equal(response.status, 200);
  assert.equal(fn.state.files.length, 0);
  assert.equal(fn.state.deletedItems, 1);
  assert.equal(fn.state.deletedUsers, 1);
});

test('account deletion requires a live bearer session and POST', async () => {
  const missing = loadFunction('delete-account');
  assert.equal((await missing.request('POST', '{}', '')).status, 401);
  assert.equal((await missing.request('GET')).status, 405);
  assert.equal(missing.state.deletedUsers, 0);

  const expired = loadFunction('delete-account', { authenticated: false });
  assert.equal((await expired.request('POST', '{}', 'expired')).status, 401);
  assert.equal(expired.state.deletedUsers, 0);
  assert.equal(expired.state.files.length, 2);
});

test('account deletion fails closed when the storage provider reports no actual progress', async () => {
  const fn = loadFunction('delete-account', { removalWorks: false });
  const response = await fn.request();
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'account_deletion_failed' });
  assert.equal(fn.state.deletedUsers, 0);
  assert.equal(fn.state.deletedItems, 0);
});
