// Generates the PWA / apple-touch PNG icons from the hero pixel grid (no image deps).
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const HERO = [
  '....hhhh....', '...hhhhhh...', '...hssssh...', '...sesses...', '...ssssss...', '...kkkkkk...',
  '..ttkkkktt..', '.sttdttdtkk.', '.sttdttdtts.', '.s.bbbbbb.s.', '...pppppp...', '...pp..pp...',
  '...pp..pp...', '...pp..pp...', '..fff..fff..', '............',
];
const PAL = { h: 'a87a4f', s: 'e0b48f', e: '3fa45b', t: '3a4766', d: '2c3650', b: '7a5a3a', p: '232838', f: '4a3a2e', k: '9a6bff' };
const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size) {
  const px = Buffer.alloc(size * size * 3);
  const scale = Math.floor((size * 0.62) / 16);
  const ox = Math.floor((size - 12 * scale) / 2);
  const oy = Math.floor((size - 16 * scale) / 2) + scale;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      // dark background with a subtle violet glow and a ground line
      const dx = (x - size / 2) / size, dy = (y - size * 0.45) / size;
      const g = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2.2);
      let c = [7 + 30 * g, 7 + 14 * g, 11 + 50 * g];
      if (y >= oy + 15 * scale && y < oy + 15 * scale + scale && x > size * 0.2 && x < size * 0.8) c = [60, 60, 85];
      const gx = Math.floor((x - ox) / scale), gy = Math.floor((y - oy) / scale);
      const ch = HERO[gy]?.[gx];
      if (x >= ox && y >= oy && ch && PAL[ch]) c = hex(PAL[ch]);
      px.set(c.map(Math.round), (y * size + x) * 3);
    }
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync('public/apple-touch-icon.png', png(180));
writeFileSync('public/icon-192.png', png(192));
writeFileSync('public/icon-512.png', png(512));
console.log('icons written');
