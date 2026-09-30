import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSupportedNeverAttachment,
  normalizedSupportedAttachmentMimeType
} from '../src/sharing/attachmentPolicy.ts';

test('NEVER launch attachments include iPhone image formats and PDF', () => {
  for (const mime of [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif',
    'image/tiff',
    'application/pdf'
  ]) {
    assert.equal(isSupportedNeverAttachment(mime), true, mime);
  }
});

test('generic iOS file MIME is inferred only for supported filename extensions', () => {
  assert.equal(normalizedSupportedAttachmentMimeType('application/octet-stream', 'Scan.PDF'), 'application/pdf');
  assert.equal(normalizedSupportedAttachmentMimeType(undefined, 'IMG_0001.HEIC'), 'image/heic');
  assert.equal(normalizedSupportedAttachmentMimeType(undefined, 'notes.docx'), undefined);
});

test('audio, video and Office originals are rejected instead of entering permanent cloud retry', () => {
  for (const mime of [
    'video/mp4',
    'audio/mpeg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]) {
    assert.equal(isSupportedNeverAttachment(mime), false, mime);
  }
});
