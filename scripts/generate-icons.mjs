/**
 * Membuat ikon PWA (PNG) tanpa dependensi eksternal.
 * Encoder PNG ditulis manual memakai zlib bawaan Node (RGBA 8-bit, tanpa interlace).
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

/* ------------------------------------------------------------------ encoder */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePNG(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // color type: RGBA
  header[10] = 0; // compression
  header[11] = 0; // filter
  header[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (none)
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------- gambar */

const TOP_GOLD = [255, 231, 168];
const BOTTOM_GOLD = [200, 143, 30];
const BORDER = [90, 56, 14];
const GLYPH = [58, 31, 20];

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Titik di dalam rounded-rect (koordinat 0..1). */
function inRoundedRect(x, y, radius) {
  const r = radius;
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  return Math.hypot(x - cx, y - cy) <= r;
}

/** Titik di dalam cincin (ring) ber-stroke. */
function onRing(x, y, centerX, centerY, radius, width) {
  const d = Math.hypot(x - centerX, y - centerY);
  return Math.abs(d - radius) <= width / 2;
}

/** Titik di dalam garis tebal dari (x1,y1) ke (x2,y2). */
function onBar(x, y, x1, y1, x2, y2, width) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const t = clamp01(((x - x1) * vx + (y - y1) * vy) / (vx * vx + vy * vy));
  const px = x1 + t * vx;
  const py = y1 + t * vy;
  return Math.hypot(x - px, y - py) <= width / 2;
}

/** Glyph "%" (dua cincin + garis miring). */
function glyphHit(u, v) {
  return (
    onRing(u, v, 0.33, 0.32, 0.098, 0.058) ||
    onRing(u, v, 0.67, 0.68, 0.098, 0.058) ||
    onBar(u, v, 0.745, 0.255, 0.255, 0.745, 0.058)
  );
}

/** Warna untuk satu titik sample: [r, g, b, alpha 0..1]. */
function sample(x, y, { maskable }) {
  const cornerRadius = maskable ? 0 : 0.22;
  if (cornerRadius > 0 && !inRoundedRect(x, y, cornerRadius)) return [0, 0, 0, 0];

  const borderWidth = maskable ? 0 : 0.03;
  if (!maskable && !inRoundedRect(x, y, cornerRadius - borderWidth)) {
    return [...BORDER, 1]; // bingkai coklat tua
  }

  // gradasi vertikal emas
  let color = mix(TOP_GOLD, BOTTOM_GOLD, clamp01((y - 0.08) / 0.9));

  // kilau dari kiri atas
  const highlight = clamp01(1 - Math.hypot(x - 0.2, y - 0.12) / 0.75);
  color = mix(color, [255, 255, 255], 0.4 * Math.pow(highlight, 1.7));

  // bayangan bawah
  color = mix(color, [116, 74, 14], 0.3 * clamp01((y - 0.62) / 0.42));

  // glyph persen dengan efek emboss (ikon maskable diperkecil ke safe zone)
  const glyphScale = maskable ? 1 / 0.72 : 1;
  const u = (x - 0.5) / glyphScale + 0.5;
  const v = (y - 0.5) / glyphScale + 0.5;

  if (glyphHit(u, v)) {
    color = mix(color, GLYPH, 0.93);
  } else if (glyphHit(u - 0.014, v + 0.014)) {
    color = mix(color, [255, 255, 255], 0.32);
  }

  return [...color, 1];
}

function render(size, options) {
  const rgba = Buffer.alloc(size * size * 4);
  const ss = 3; // supersampling 3x3 untuk tepi halus
  const samples = ss * ss;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const px = (x + (sx + 0.5) / ss) / size;
          const py = (y + (sy + 0.5) / ss) / size;
          const [cr, cg, cb, ca] = sample(px, py, options);
          r += cr * ca;
          g += cg * ca;
          b += cb * ca;
          a += ca;
        }
      }

      const alpha = a / samples;
      const index = (y * size + x) * 4;
      rgba[index] = alpha > 0 ? Math.round(r / a) : 0;
      rgba[index + 1] = alpha > 0 ? Math.round(g / a) : 0;
      rgba[index + 2] = alpha > 0 ? Math.round(b / a) : 0;
      rgba[index + 3] = Math.round(alpha * 255);
    }
  }

  return encodePNG(size, size, rgba);
}

/* --------------------------------------------------------------------- main */

const targets = [
  { path: 'public/icons/icon-192.png', size: 192, options: { maskable: false } },
  { path: 'public/icons/icon-512.png', size: 512, options: { maskable: false } },
  { path: 'public/icons/icon-maskable-512.png', size: 512, options: { maskable: true } },
  { path: 'public/icons/apple-touch-icon-180.png', size: 180, options: { maskable: false } },
  { path: 'public/favicon-64.png', size: 64, options: { maskable: false } },
];

for (const target of targets) {
  const filePath = resolve(ROOT, target.path);
  mkdirSync(dirname(filePath), { recursive: true });
  const png = render(target.size, target.options);
  writeFileSync(filePath, png);
  console.log(`OK ${target.path} (${target.size}x${target.size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log('Selesai membuat ikon PWA.');

