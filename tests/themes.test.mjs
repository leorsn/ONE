import test from 'node:test';
import assert from 'node:assert/strict';
import { themeIds, themes, resolveTheme, parseThemePreference, materialStyle } from '../src/theme/editions.ts';
import { lightTheme } from '../src/theme/colors.ts';
import { loadThemePreference, createThemeWriter, THEME_STORAGE_KEY } from '../src/theme/preference.ts';

function luminance(hex) {
  const [r, g, b] = hex.slice(1, 7).match(/../g).map((v) => { const x = parseInt(v, 16) / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a); return (hi + 0.05) / (lo + 0.05); }

test('all six selections resolve independently of OS appearance', () => {
  assert.equal(themeIds.length, 6);
  for (const id of themeIds) for (const os of ['light', 'dark']) assert.equal(resolveTheme(id, os), themes[id]);
  assert.deepEqual(themes.platinum.colors, lightTheme);
});
test('System follows changes in OS appearance without changing stored preference', () => {
  assert.equal(resolveTheme('system', 'light').id, 'platinum');
  assert.equal(resolveTheme('system', 'dark').id, 'monolith');
  assert.equal(resolveTheme('system', 'light').id, 'platinum');
});
test('missing/corrupt preference defaults to Platinum and legacy settings migrate', () => {
  for (const value of [null, undefined, '', 'blue', '{}', 1, [], '__proto__']) assert.equal(parseThemePreference(value), 'platinum');
  assert.equal(parseThemePreference('light'), 'platinum');
  assert.equal(parseThemePreference('dark'), 'monolith');
  assert.equal(parseThemePreference('system'), 'system');
});
for (const id of themeIds) test(`${id} has complete semantic tokens and readable text`, () => {
  const t = themes[id];
  for (const key of Object.keys(lightTheme)) assert.match(t[key], /^#[0-9a-f]{6}([0-9a-f]{2})?$/i, key);
  for (const foreground of ['text', 'textSecondary', 'textTertiary']) for (const background of ['background', 'surface', 'surfaceElevated']) {
    assert.ok(contrast(t[foreground], t[background]) >= 4.5, `${id}: ${foreground} on ${background}`);
  }
  assert.ok(contrast(t.onAccent, t.accent) >= 4.5);
  for (const role of ['card', 'input', 'navigation', 'modal']) {
    const style = materialStyle(t, role);
    assert.ok(style.backgroundColor && style.borderColor);
    assert.ok(Number.isFinite(style.borderRadius));
    assert.equal(typeof t.materials[role].glass, 'boolean');
  }
});
test('editions differ in materials and geometry, not only color', () => {
  assert.equal(themes.archive.materials.card.shadow.shadowOpacity, 0);
  assert.equal(themes.archive.materials.input.glass, false);
  assert.equal(themes.tactile.effects.texture, true);
  assert.equal(themes.tactile.materials.navigation.glass, false);
  assert.equal(themes.aurora.materials.navigation.glass, true);
  assert.equal(themes.orbit.radius.icon, 999);
  assert.equal(new Set(themeIds.map((id) => themes[id].radius.card)).size, 6);
});
test('each preference persists and reloads using the existing device key', async () => {
  const data = new Map();
  const store = { getItem: async (key) => data.get(key) ?? null, setItem: async (key, value) => { data.set(key, value); } };
  const write = createThemeWriter(store);
  assert.equal(await loadThemePreference(store), 'platinum');
  for (const id of [...themeIds, 'system']) {
    await write(id);
    assert.equal(data.get(THEME_STORAGE_KEY), id);
    assert.equal(await loadThemePreference(store), id);
  }
});
test('storage read failure has a safe local default', async () => {
  assert.equal(await loadThemePreference({ getItem: async () => { throw Error('offline storage'); } }), 'platinum');
});
test('queued writes preserve selection order and recover after failure', async () => {
  const writes = []; let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const writer = createThemeWriter({ setItem: async (_key, value) => { writes.push(value); if (value === 'orbit') { await gate; throw Error('disk'); } } });
  const first = writer('orbit');
  const rejection = assert.rejects(first, /disk/);
  const second = writer('archive');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(writes, ['orbit']);
  release(); await rejection; await second;
  assert.deepEqual(writes, ['orbit', 'archive']);
});
