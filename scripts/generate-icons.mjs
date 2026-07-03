/**
 * PWA アイコンをプレースホルダーとして生成するスクリプト。
 * 外部依存なし（Node 標準の zlib で PNG をエンコードする）。
 *
 * 使い方: npm run icons
 * 出力: public/icons/icon-192.png, icon-512.png, icon-512-maskable.png,
 *       public/apple-touch-icon.png
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- PNG エンコーダ（8bit RGBA・フィルタなし） ----

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 簡易ペイント ----

function canvas(size) {
  return { size, data: Buffer.alloc(size * size * 4) };
}

function fillRect(c, x, y, w, h, [r, g, b, a = 255]) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(c.size, Math.round(x + w));
  const y1 = Math.min(c.size, Math.round(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (py * c.size + px) * 4;
      c.data[i] = r;
      c.data[i + 1] = g;
      c.data[i + 2] = b;
      c.data[i + 3] = a;
    }
  }
}

function fillCircle(c, cx, cy, radius, color) {
  for (let py = Math.floor(cy - radius); py <= cy + radius; py++) {
    for (let px = Math.floor(cx - radius); px <= cx + radius; px++) {
      if ((px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2) {
        fillRect(c, px, py, 1, 1, color);
      }
    }
  }
}

// ---- アイコンのデザイン（ゲーム内プレースホルダーと同じ配色） ----

const BG = [26, 28, 44]; // #1a1c2c
const PLATFORM = [56, 183, 100]; // #38b764
const PLAYER = [65, 166, 246]; // #41a6f6
const COIN = [255, 205, 117]; // #ffcd75

function drawIcon(size) {
  const c = canvas(size);
  const u = size / 128; // 128 を基準にスケール
  fillRect(c, 0, 0, size, size, BG);
  fillRect(c, 24 * u, 88 * u, 80 * u, 14 * u, PLATFORM); // 足場
  fillRect(c, 40 * u, 58 * u, 22 * u, 30 * u, PLAYER); // プレイヤー
  fillCircle(c, 86 * u, 48 * u, 11 * u, COIN); // コイン
  return encodePng(size, size, c.data);
}

mkdirSync(join(root, 'public/icons'), { recursive: true });
writeFileSync(join(root, 'public/icons/icon-192.png'), drawIcon(192));
writeFileSync(join(root, 'public/icons/icon-512.png'), drawIcon(512));
writeFileSync(join(root, 'public/icons/icon-512-maskable.png'), drawIcon(512));
writeFileSync(join(root, 'public/apple-touch-icon.png'), drawIcon(180));
console.log('PWA アイコンを public/ に生成しました');
