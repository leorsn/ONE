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
  assert.equal(themes.platinum.accent, '#252B31');
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
  for (const role of ['card', 'hero', 'input', 'navigation', 'modal']) {
    const style = materialStyle(t, role);
    assert.ok(style.backgroundColor && style.borderColor);
    assert.ok(Number.isFinite(style.borderRadius));
    assert.equal(typeof t.materials[role].glass, 'boolean');
  }
});
test('six worlds retain one control geometry and preserve stored identities', () => {
  assert.deepEqual(themeIds.map(id => themes[id].name), ['Platinum', 'Monolith', 'Archive', 'Aurora', 'Canyon', 'Tidal']);
  for (const id of themeIds) {
    assert.deepEqual(themes[id].radius, themes.platinum.radius);
    assert.deepEqual(themes[id].spacing, themes.platinum.spacing);
  }
  assert.equal(themes.archive.mode, 'light');
  assert.equal(themes.monolith.mode, 'dark');
  assert.equal(parseThemePreference('canyon'), 'tactile');
  assert.equal(parseThemePreference('tidal'), 'orbit');
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

test('Reduce Transparency makes every glass role opaque, including form fields', async () => {
  const { resolveMaterialAppearance } = await import('../src/theme/editions.ts');
  for (const theme of Object.values(themes)) for (const role of ['card', 'hero', 'input', 'navigation', 'modal']) {
    const result = resolveMaterialAppearance(theme, role, { reduceTransparency: true, nativeGlass: true });
    assert.equal(result.useGlass, false);
    assert.match(result.style.backgroundColor, /^#[0-9a-f]{6}$/i);
    assert.ok(contrast(theme.text, result.style.backgroundColor) >= 4.5);
  }
});
test('native glass is consistent across worlds and disabled on unavailable platforms', async () => {
  const { resolveMaterialAppearance } = await import('../src/theme/editions.ts');
  for (const theme of Object.values(themes)) {
    const fallback = resolveMaterialAppearance(theme, 'input', { reduceTransparency: false, nativeGlass: false });
    assert.equal(fallback.useGlass, false);
    const native = resolveMaterialAppearance(theme, 'navigation', { reduceTransparency: false, nativeGlass: true });
    assert.equal(native.useGlass, true);
  }
  const orbit = resolveMaterialAppearance(themes.orbit, 'input', { reduceTransparency: false, nativeGlass: true });
  const monolith = resolveMaterialAppearance(themes.monolith, 'input', { reduceTransparency: false, nativeGlass: true });
  assert.notEqual(orbit.tint, monolith.tint);
});
test('input focus retains edition geometry and changes its visible boundary', async () => {
  const { resolveMaterialAppearance } = await import('../src/theme/editions.ts');
  for (const theme of Object.values(themes)) {
    const result = resolveMaterialAppearance(theme, 'input', { reduceTransparency: false, focused: true });
    assert.equal(result.style.borderColor, theme.chrome + '80');
    assert.equal(result.style.borderRadius, theme.materials.input.radius);
  }
});

function composite(hex, backdrop) {
  const alpha = hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1;
  return '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * alpha + backdrop * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
test('material text remains readable over both artwork luminance extremes', () => {
  for (const theme of Object.values(themes)) for (const material of Object.values(theme.materials)) {
    for (const backdrop of [0, 255]) for (const foreground of ['text', 'textSecondary', 'textTertiary']) {
      assert.ok(contrast(theme[foreground], composite(material.color, backdrop)) >= 4.5, `${theme.id} ${foreground}`);
    }
  }
});

test('native glass avoids stacking the fallback fill and reduced transparency restores it', async () => {
  const { resolveMaterialAppearance } = await import('../src/theme/editions.ts');
  for (const theme of Object.values(themes)) for (const role of ['input', 'navigation']) {
    const native = resolveMaterialAppearance(theme, role, { reduceTransparency: false, nativeGlass: true });
    const fallback = resolveMaterialAppearance(theme, role, { reduceTransparency: false, nativeGlass: false });
    const reduced = resolveMaterialAppearance(theme, role, { reduceTransparency: true, nativeGlass: true });
    assert.ok(parseInt(native.style.backgroundColor.slice(7), 16) < 64);
    assert.ok(parseInt(fallback.style.backgroundColor.slice(7), 16) > 160);
    assert.equal(reduced.style.backgroundColor.length, 7);
    assert.equal(reduced.useGlass, false);
  }
});
