import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, themes } from '../src/theme/editions.ts';
import { wallpaperId, initialWallpaperState, wallpaperTransition as step } from '../src/theme/wallpaperTransition.ts';

const ready = (state, id) => step(state, { type: 'ready', id });
const select = (state, id) => step(state, { type: 'select', id });
const finish = state => step(state, { type: 'finished', revision: state.revision });

test('cold wallpaper requests keep the existing opaque layer until native load and fade complete', () => {
  let state = initialWallpaperState(resolveTheme('system', 'light'));
  state = select(state, 'monolith');
  assert.equal(state.active, 'basic-light'); assert.equal(state.incoming, null);
  state = ready(state, 'orbit'); // another preload finishes first
  assert.equal(state.incoming, null);
  state = ready(state, 'monolith');
  assert.equal(state.active, 'basic-light'); assert.equal(state.incoming, 'monolith');
  state = finish(state);
  assert.equal(state.active, 'monolith'); assert.equal(state.incoming, null);
});

test('rapid selections keep current fade continuous, skip intermediate requests and ignore stale completions', () => {
  let state = initialWallpaperState(resolveTheme('system', 'light'));
  for (const id of Object.keys(themes)) state = ready(state, id);
  state = select(state, 'monolith');
  const oldRevision = state.revision;
  state = select(state, 'orbit');
  state = select(state, 'archive');
  assert.equal(state.active, 'basic-light'); assert.equal(state.incoming, 'monolith');
  state = finish(state);
  assert.equal(state.active, 'monolith'); assert.equal(state.incoming, 'archive');
  assert.equal(step(state, { type: 'finished', revision: oldRevision }), state);
  state = select(state, 'basic-dark');
  state = finish(state);
  assert.equal(state.active, 'archive'); assert.equal(state.incoming, 'basic-dark');
  state = finish(state);
  assert.equal(state.active, 'basic-dark'); assert.equal(state.incoming, null);
});

test('failed or obsolete loads never remove the current wallpaper', () => {
  let state = initialWallpaperState(resolveTheme('system', 'dark'));
  state = select(state, 'orbit');
  state = step(state, { type: 'failed', id: 'orbit' });
  assert.equal(state.active, 'basic-dark'); assert.equal(state.incoming, null);
  state = select(state, 'archive');
  state = ready(state, 'orbit');
  assert.equal(state.incoming, null);
  state = ready(state, 'archive');
  state = finish(state);
  assert.equal(state.active, 'archive');
});

test('repeated acceptance sequence uses ready layers and always returns System to Basic', () => {
  let state = initialWallpaperState(resolveTheme('system', 'light'));
  for (const id of Object.keys(themes)) state = ready(state, id);
  const sequence = ['basic-dark', 'basic-light', 'monolith', 'orbit', 'archive', 'basic-light', 'monolith', 'basic-dark'];
  for (let repetition = 0; repetition < 20; repetition++) for (const id of sequence) {
    state = select(state, id);
    if (state.incoming) state = finish(state);
    assert.equal(state.active, id); assert.equal(state.incoming, null);
    assert.equal(state.ready.length, 8);
  }
  assert.equal(wallpaperId(resolveTheme('system', 'light')), 'basic-light');
  assert.equal(wallpaperId(resolveTheme('system', 'dark')), 'basic-dark');
  assert.equal(wallpaperId(themes.monolith), 'monolith');
  assert.equal(wallpaperId(themes.platinum), 'platinum');
});
