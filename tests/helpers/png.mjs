import { deflateSync } from 'node:zlib';
import { crc32 } from '../../scripts/png-integrity.mjs';
function chunk(type, data) {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([size, body, crc]);
}
export function validPng(width = 1024, height = 1024, colorType = 2, transparency = false) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = colorType;
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header),
    ...(transparency ? [chunk('tRNS', Buffer.alloc(6))] : []),
    chunk('IDAT', deflateSync(Buffer.alloc((width * channels + 1) * height))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
