// Dependency-free PNG icon generator: `node scripts/generate-icons.mjs`
// rewrites every app icon from the geometry below, so change the design here
// and rerun rather than editing the PNGs.
//
// The logo is a gold baht sign on money green, inside the faint ring of a
// coin. Nothing in it is more than circles, straight segments and half-circle
// arcs, and each of those has an exact distance function — so instead of an
// image library, every pixel is shaded from its distance to each shape. A
// stroke with round caps and joins is exactly "within half the stroke width
// of the path", and a distance also gives each edge its anti-aliasing: the
// shape covers a pixel in proportion to how far inside it the pixel centre is.
//
// Drawn in a 512×512 space (the same numbers as the SVG in the logo mockup):
//   background  diagonal gradient #1B8E74 → #0A5242
//   ring        circle r=186, 10 wide, #FFD166 at 28%
//   shadow      the ฿ again, offset by (6, 10), #073A2E at 45%
//   ฿           #FFD166, scaled 1.75 about the centre, stroke 31.5 wide
// Nothing reaches more than 191 from the centre, inside the circle of radius
// 205 (40%) that Android keeps when it crops a maskable icon, so one drawing
// serves every icon.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BG_FROM = hex("#1B8E74");
const BG_TO = hex("#0A5242");
const GOLD = hex("#FFD166");
const SHADOW = hex("#073A2E");

const DESIGN = 512;
const CENTRE = 256;
const RING_RADIUS = 186;
const RING_HALF_WIDTH = 5;
const GLYPH_SCALE = 1.75;
const GLYPH_HALF_WIDTH = 9 * GLYPH_SCALE; // an 18-wide stroke before scaling
const SHADOW_OFFSET = [6, 10];

// The ฿ as the path it is stroked along, in its own units, centred on 0,0:
// a B (stem, two bowls) with the baht's vertical line through it.
const GLYPH_SEGMENTS = [
  [-34, -58, -34, 58], // stem
  [-34, -58, 0, -58],  // top of the upper bowl
  [0, -2, -34, -2],    // waist
  [4, -2, 0, -2],      // the lower bowl starts a little further out
  [4, 58, -34, 58],    // bottom
  [-2, -80, -2, 80],   // the baht line
];
// Right-hand half circles, [cx, cy, r]: the curve of each bowl.
const GLYPH_ARCS = [
  [0, -30, 28],
  [4, 28, 30],
];

function distToSegment(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// For a point left of the centre, the nearest point on a right-hand half
// circle is one of its two ends; otherwise it is straight out from the
// centre.
function distToRightArc(px, py, [cx, cy, r]) {
  if (px >= cx) return Math.abs(Math.hypot(px - cx, py - cy) - r);
  return Math.min(Math.hypot(px - cx, py - (cy - r)), Math.hypot(px - cx, py - (cy + r)));
}

// Distance in design units from (x, y) to the glyph's path, with the glyph
// centred at (ox, oy).
function distToGlyph(x, y, ox, oy) {
  const px = (x - ox) / GLYPH_SCALE;
  const py = (y - oy) / GLYPH_SCALE;
  let d = Infinity;
  for (const s of GLYPH_SEGMENTS) d = Math.min(d, distToSegment(px, py, s));
  for (const a of GLYPH_ARCS) d = Math.min(d, distToRightArc(px, py, a));
  return d * GLYPH_SCALE;
}

// How much of a pixel `unit` design units wide a shape covers, given how
// far inside its edge the pixel centre is (negative = outside).
const coverage = (inside, unit) => Math.max(0, Math.min(1, inside / unit + 0.5));

function paint(rgb, color, alpha) {
  for (let i = 0; i < 3; i++) rgb[i] += (color[i] - rgb[i]) * alpha;
}

// Signed distance to a rounded square filling the design (negative inside).
function roundedSquareDist(x, y, radius) {
  const qx = Math.abs(x - CENTRE) - (CENTRE - radius);
  const qy = Math.abs(y - CENTRE) - (CENTRE - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

// cornerRadius > 0 makes the corners transparent — for the browser-tab icon,
// which is shown as drawn. Home-screen icons stay square: iOS and Android cut
// their own shape out of them.
function renderPng(size, cornerRadius = 0) {
  const unit = DESIGN / size;
  const raw = Buffer.alloc((1 + size * 4) * size);
  let o = 0;
  for (let py = 0; py < size; py++) {
    raw[o++] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5) * unit;
      const y = (py + 0.5) * unit;
      const t = Math.max(0, Math.min(1, (x + y) / (2 * DESIGN)));
      const rgb = BG_FROM.map((c, i) => c + (BG_TO[i] - c) * t);
      paint(rgb, GOLD, 0.28 * coverage(RING_HALF_WIDTH - Math.abs(Math.hypot(x - CENTRE, y - CENTRE) - RING_RADIUS), unit));
      const shadow = distToGlyph(x, y, CENTRE + SHADOW_OFFSET[0], CENTRE + SHADOW_OFFSET[1]);
      paint(rgb, SHADOW, 0.45 * coverage(GLYPH_HALF_WIDTH - shadow, unit));
      paint(rgb, GOLD, coverage(GLYPH_HALF_WIDTH - distToGlyph(x, y, CENTRE, CENTRE), unit));
      const alpha = cornerRadius ? coverage(-roundedSquareDist(x, y, cornerRadius), unit) : 1;
      raw[o++] = Math.round(rgb[0]);
      raw[o++] = Math.round(rgb[1]);
      raw[o++] = Math.round(rgb[2]);
      raw[o++] = Math.round(alpha * 255);
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

const iconsDir = path.join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

writeFileSync(path.join(iconsDir, "icon-192.png"), renderPng(192));
writeFileSync(path.join(iconsDir, "icon-512.png"), renderPng(512));
writeFileSync(path.join(iconsDir, "icon-maskable-512.png"), renderPng(512));
// 3px of rounding on a 16px tab icon, as in the mockup.
writeFileSync(path.join(root, "src", "app", "icon.png"), renderPng(512, 96));
writeFileSync(path.join(root, "src", "app", "apple-icon.png"), renderPng(180));

console.log("Generated icons in public/icons, src/app/icon.png, src/app/apple-icon.png");
