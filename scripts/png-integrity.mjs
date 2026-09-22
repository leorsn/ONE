import { inflateSync } from 'node:zlib';

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Validate the actual image stream, not just the dimensions in its header.
export function validatePng(buffer) {
  let offset = 8;
  let ended = false;
  const compressed = [];
  const chunks = [];
  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) throw new Error('truncated PNG chunk');
    const size = buffer.readUInt32BE(offset);
    const end = offset + size + 12;
    if (end > buffer.length) throw new Error('truncated PNG data');
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (crc32(buffer.subarray(offset + 4, end - 4)) !== buffer.readUInt32BE(end - 4)) {
      throw new Error(`invalid ${type} checksum`);
    }
    chunks.push(type);
    if (type === 'IDAT') compressed.push(buffer.subarray(offset + 8, end - 4));
    offset = end;
    if (type === 'IEND') { ended = true; break; }
  }
  if (!ended || offset !== buffer.length || !compressed.length || chunks[0] !== 'IHDR') {
    throw new Error('incomplete PNG structure');
  }
  const pixels = inflateSync(Buffer.concat(compressed), { maxOutputLength: 64 * 1024 * 1024 });
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[buffer[25]];
  if (!channels) throw new Error('invalid PNG color type');
  if (buffer[28] === 0) {
    const row = Math.ceil(buffer.readUInt32BE(16) * buffer[24] * channels / 8) + 1;
    if (pixels.length !== row * buffer.readUInt32BE(20)) throw new Error('incomplete PNG pixels');
    for (let start = 0; start < pixels.length; start += row) {
      if (pixels[start] > 4) throw new Error('invalid PNG row filter');
    }
  }
  return chunks;
}
