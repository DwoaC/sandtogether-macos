// SandTogether by Kamil Padula — generates the Workshop preview PNG (512x512)
// Pure Node: manual PNG encoding via zlib. Placeholder art — replace with a
// real screenshot for a nicer Workshop page.
'use strict';
const fs = require('fs');
const zlib = require('zlib');

const W = 512, H = 512;
const px = new Uint8Array(W * H * 4);

const set = (x, y, r, g, b) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
};
const rect = (x0, y0, w, h, r, g, b) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, r, g, b); };

// sky gradient (dark teal -> deep blue)
for (let y = 0; y < H; y++) {
  const k = y / H;
  for (let x = 0; x < W; x++) set(x, y, 8 + 14 * k, 12 + 20 * k, 24 + 34 * k);
}
// sun
for (let y = -40; y <= 40; y++) for (let x = -40; x <= 40; x++)
  if (x * x + y * y <= 1600) set(400 + x, 90 + y, 255, 180, 84);
// dunes (two layers)
for (let x = 0; x < W; x++) {
  const d1 = 330 + 40 * Math.sin(x / 70) + 18 * Math.sin(x / 23);
  for (let y = Math.floor(d1); y < H; y++) set(x, y, 194, 158, 96);
  const d2 = 400 + 30 * Math.sin(x / 50 + 2) + 10 * Math.sin(x / 17);
  for (let y = Math.floor(d2); y < H; y++) set(x, y, 158, 122, 66);
}
// sand grain noise on dunes
let seed = 12345;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let i = 0; i < 26000; i++) {
  const x = Math.floor(rnd() * W), y = 320 + Math.floor(rnd() * (H - 320));
  const j = (y * W + x) * 4;
  if (px[j + 3]) { const v = Math.floor(rnd() * 28) - 14; px[j] += v; px[j + 1] += v; px[j + 2] += v; }
}
// two pixel players (host orange, friend blue) with heads + shovels
const player = (x, y, r, g, b) => {
  rect(x, y, 22, 40, r, g, b);                 // body
  rect(x + 3, y - 16, 16, 16, 240, 205, 170);  // head
  rect(x - 10, y + 8, 10, 5, 120, 120, 130);   // shovel arm
  rect(x - 14, y + 2, 5, 16, 90, 90, 100);     // shovel blade
};
player(200, 300, 255, 140, 60);
player(290, 310, 79, 195, 247);
// dug tunnel between them
for (let x = 222; x < 290; x++) { const y0 = 348 + Math.floor(6 * Math.sin(x / 9)); rect(x, y0, 1, 26, 30, 24, 20); }
// "ST" block letters, top-left
const B = (x, y) => rect(64 + x * 10, 48 + y * 10, 9, 9, 255, 180, 84);
[[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[2,3],[0,4],[1,4],[2,4]].forEach(([x,y]) => B(x, y));       // S
[[4,0],[5,0],[6,0],[5,1],[5,2],[5,3],[5,4]].forEach(([x,y]) => B(x, y));                               // T

// --- PNG encode ---
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; px.subarray(y * W * 4, (y + 1) * W * 4).forEach((v, i) => raw[y * (W * 4 + 1) + 1 + i] = v); }
const crcTable = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const out = process.argv[2] || 'preview.png';
fs.writeFileSync(out, png);
console.log('preview written:', out, png.length, 'bytes');
