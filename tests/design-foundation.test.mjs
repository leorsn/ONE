import test from 'node:test';
import assert from 'node:assert/strict';
import { lightTheme, darkTheme } from '../src/theme/colors.ts';
import { memoryPreview, matchesMemoryCategory } from '../src/ui/memoryPresentation.ts';
import { retrieveLocalOneItems } from '../src/search/retrieve.ts';

function luminance(hex) {
  const values = hex.slice(1).match(/../g).slice(0, 3).map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const [mode, theme] of [['light', lightTheme], ['dark', darkTheme]]) {
  test(`${mode} essential text and action labels maintain readable contrast`, () => {
    for (const foreground of ['text', 'textSecondary', 'textTertiary']) {
      for (const background of ['background', 'surface', 'surfaceElevated']) {
        assert.ok(contrast(theme[foreground], theme[background]) >= 4.5, `${foreground} on ${background}`);
      }
    }
    assert.ok(contrast(theme.onAccent, theme.accent) >= 4.5);
  });
}
const item = { id: 'document', title: 'Travel contract', type: 'document', sourceType: 'manual', tags: [], entities: [], saved: true, completed: false, createdAt: '2026-01-01T12:00:00Z', updatedAt: '2026-01-01T12:00:00Z' };
test('PDF originals are not rendered as broken image thumbnails', () => {
  assert.equal(memoryPreview({ ...item, sourceType: 'scan', localAttachmentUri: 'file:///contract.pdf', localAttachmentMimeType: 'application/pdf' }), undefined);
  assert.equal(memoryPreview({ ...item, sourceType: 'photo', localAttachmentUri: 'file:///photo.jpg', localAttachmentMimeType: 'image/jpeg' }), 'file:///photo.jpg');
  assert.equal(memoryPreview({ ...item, imageUrl: 'javascript:alert(1)' }), undefined);
});
test('document filter finds older results even beyond the default recent limit', () => {
  const notes = Array.from({ length: 40 }, (_, index) => ({ ...item, id: `note-${index}`, title: 'Travel note', type: 'note', updatedAt: '2026-09-20T12:00:00Z' }));
  const filtered = [...notes, item].filter((entry) => matchesMemoryCategory(entry, 'Documents'));
  for (const query of ['', 'Travel']) assert.deepEqual(retrieveLocalOneItems(query, filtered, { limit: 18 }).map(({ item }) => item.id), ['document']);
});
test('link and idea filters retain existing captured URL and note semantics', () => {
  assert.equal(matchesMemoryCategory({ ...item, type: 'note', url: 'https://example.com' }, 'Links'), true);
  assert.equal(matchesMemoryCategory({ ...item, type: 'note' }, 'Ideas'), true);
  assert.equal(matchesMemoryCategory(item, 'All'), true);
});
