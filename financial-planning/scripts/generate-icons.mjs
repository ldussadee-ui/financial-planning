// One-off, dependency-free PNG icon generator (rerun any time to change the
// design: `node scripts/generate-icons.mjs`). Writes flat pastel app icons
// using a hand-rolled PNG encoder so no image library is needed as a
// dependency just to produce a handful of placeholder icons.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const LAV = [0xb4, 0xa7, 0xf5];
const PINK = [0xff, 0x9a, 0xa2];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// draws a flat background with a centered circle; circleRadiusFrac is the
// circle's radius as a fraction of size/2 (keep <=0.66 for maskable safe zone)
function renderPng(size, circleRadiusFrac) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * circleRadiusFrac;
  const raw = Buffer.alloc((1 + size * 4) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx + 0.5, y - cy + 0.5);
      const [r8, g8, b8] = d <= r ? PINK : LAV;
      raw[o++] = r8;
      raw[o++] = g8;
      raw[o++] = b8;
      raw[o++] = 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

writeFileSync(path.join(iconsDir, "icon-192.png"), renderPng(192, 0.62));
writeFileSync(path.join(iconsDir, "icon-512.png"), renderPng(512, 0.62));
writeFileSync(path.join(iconsDir, "icon-maskable-512.png"), renderPng(512, 0.5));
writeFileSync(path.join(root, "src", "app", "icon.png"), renderPng(512, 0.62));
writeFileSync(path.join(root, "src", "app", "apple-icon.png"), renderPng(180, 0.62));

console.log("Generated icons in public/icons, src/app/icon.png, src/app/apple-icon.png");
