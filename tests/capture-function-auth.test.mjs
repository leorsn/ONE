import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../supabase/functions/interpret-one-capture/index.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function runtime(authenticated) {
  let handler; let modelCalls = 0; let userChecks = 0;
  const environment = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_ANON_KEY: 'test-public', OPENAI_API_KEY: 'test-server' };
  vm.runInNewContext(code, {
    exports: {}, Request, Response,
    Deno: { env: { get: (name) => environment[name] }, serve: (value) => { handler = value; } },
    require: () => ({ createClient: () => ({ auth: { getUser: async () => { userChecks++; return { data: { user: authenticated ? { id: 'user' } : null }, error: authenticated ? null : new Error('expired') }; } } }) }),
    fetch: async () => { modelCalls++; return Response.json({ output_text: '{"title":"Test"}' }); }
  });
  return { request: (options) => handler(new Request('https://example.test/capture', options)), calls: () => ({ modelCalls, userChecks }) };
}

test('capture endpoint refuses missing or expired auth before invoking the model', async () => {
  const server = runtime(false);
  assert.equal((await server.request({ method: 'POST', body: '{}' })).status, 401);
  assert.equal((await server.request({ method: 'POST', headers: { Authorization: 'Bearer expired' }, body: '{"text":"private"}' })).status, 401);
  assert.equal(server.calls().modelCalls, 0);
  assert.equal(server.calls().userChecks, 1);
});

test('capture endpoint preserves authorized capture and handles preflight without model work', async () => {
  const server = runtime(true);
  assert.equal((await server.request({ method: 'OPTIONS' })).status, 200);
  assert.equal((await server.request({ method: 'GET' })).status, 405);
  assert.equal(server.calls().modelCalls, 0);
  const response = await server.request({ method: 'POST', headers: { Authorization: 'Bearer valid' }, body: '{"text":"A note"}' });
  assert.equal(response.status, 200);
  assert.equal(server.calls().modelCalls, 1);
});
