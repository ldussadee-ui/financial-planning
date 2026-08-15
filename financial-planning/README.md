# เงินทองของเรา — เครื่องมือวางแผนการเงิน

Next.js (App Router, TypeScript) + PWA ต่อยอดจาก prototype ใน `../docs/prototype/`.

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 (จะ redirect ไปที่ `/dashboard`)

```bash
npm run build   # production build (ตรวจ type + lint ผ่านแล้ว)
npm run start   # รันตัว production build
```

## สถาปัตยกรรม

- **Next.js 16, App Router, Turbopack** (ค่าเริ่มต้นของเวอร์ชันนี้ทั้ง dev และ build)
- **Dexie.js (IndexedDB)** แทน React state เดิม — ข้อมูลอยู่ถาวรในเครื่อง ไม่หายเมื่อรีเฟรช ดู schema ที่ `src/lib/types.ts` และ `src/lib/db.ts`. Seed ข้อมูลตัวอย่างจะรันครั้งแรกที่เปิดแอปเท่านั้น (guard ด้วย settings flag ใน transaction เดียวกัน กันเคส seed ซ้ำตอน React Strict Mode หรือเปิดหลายแท็บพร้อมกัน)
- **PWA**: `src/app/manifest.ts` (ใช้ metadata route ของ Next เอง) + `public/sw.js` (เขียนเอง ไม่ใช้ next-pwa เพราะ next-pwa ผูกกับ webpack config hook เท่านั้น ใน Next 16 ที่ default เป็น Turbopack ทั้ง dev/build ปลั๊กอินจะไม่ทำงานเงียบๆ — service worker แบบ manual นี้ทำ cache-first สำหรับ asset ที่ hash แล้ว และ network-first + fallback เป็น app shell สำหรับหน้าเว็บ พอสำหรับแอปนี้เพราะข้อมูลทั้งหมดอยู่ใน IndexedDB ไม่มี API เรียกอยู่แล้ว)
- **ฟอนต์ Prompt/Sarabun**: โหลดผ่าน `next/font/google` (self-host ตอน build) แทนการโหลดจาก Google Fonts runtime แบบ prototype เดิม — จำเป็นสำหรับให้แอปใช้งาน offline ได้จริง
- **Route ต่อแท็บ** (`/dashboard`, `/cashflow`, `/liquid`, `/investment`, `/personal`, `/liability`, `/goals`) แทนการสลับด้วย `useState` ตัวเดียวเหมือน prototype — ได้ปุ่ม back/forward ของเบราว์เซอร์และ deep link ตามหลักของ Next.js
- **Responsive nav**: sidebar บน desktop, bottom tab bar บนมือถือ (breakpoint 860px) — เป้าหมาย #1 ตาม handoff brief คือใช้งานบนมือถือได้จริง

## โครงสร้างไฟล์หลัก

```
src/
  app/
    (tabs)/<tab>/page.tsx   route ต่อแท็บ, ใช้ shared layout ที่มี Sidebar/BottomNav
    layout.tsx              root layout, ฟอนต์, seeding, SW registration
    manifest.ts             web app manifest
  components/
    tabs/                   7 tab components (พอร์ตจาก prototype เดิม)
    ui.tsx                  shared atoms (SectionHeader, Field, Row, DayPicker, ...)
    Nav.tsx                 Sidebar + BottomNav
    DbInit.tsx / PwaRegister.tsx
  hooks/
    useMetrics.ts           live-query ทุกตารางจาก Dexie + คำนวณ metrics ทั้งหมด
    useSetting.ts           อ่าน/เขียน settings table แบบ reactive
  lib/
    types.ts                data schema (ตรงกับ docs/prototype/financial-planning-data-schema.md)
    db.ts                   Dexie schema + seed
    calc.ts                 date/cycle helpers, classify keywords, formatter
    constants.ts             หมวดหมู่, สี, icon map
scripts/generate-icons.mjs  สร้างไอคอน PWA (flat placeholder, รันซ้ำได้ถ้าจะเปลี่ยนดีไซน์)
```

## ทดสอบแล้ว

ทุกแท็บ, add/delete CRUD, การคงอยู่ของข้อมูลข้าม reload, responsive nav (mobile/desktop), production build + type check + lint ผ่านหมดแล้ว

**ยังไม่ได้ทดสอบ**: การติดตั้ง PWA จริง (`beforeinstallprompt` / "เพิ่มไปยังหน้าจอหลัก") และการทำงาน offline ของ service worker — เบราว์เซอร์พรีวิวที่ใช้ตอน build บล็อกการลงทะเบียน service worker (เป็นข้อจำกัดของ sandbox ไม่ใช่โค้ด — ตัวสคริปต์ถูก fetch ได้ปกติ, content-type ถูกต้อง). ให้ทดสอบบนเบราว์เซอร์จริง (Chrome/Edge บนมือถือหรือ desktop) หลัง deploy หรือรัน `npm run build && npm run start` แล้วเปิดใน Chrome ปกติ — ต้องเป็น HTTPS หรือ localhost เท่านั้น service worker ถึงจะทำงาน

## สิ่งที่ยังไม่ได้ทำ (ต่อยอดได้ตาม handoff brief เดิม)

- HealthRiskProfile / InsurancePolicy module
- Tax Planning module (SSF/RMF, ภาษีปันผล, capital gain)
- Behavioral Check-in, Estate Planning
- ระบบ auth + sync ข้อมูลข้ามอุปกรณ์ (ตอนนี้เก็บใน IndexedDB ของเครื่อง/เบราว์เซอร์เดียวเท่านั้น)
- ล็อกแอปด้วย PIN/biometric — **ควรทำก่อนใช้เก็บข้อมูลการเงินจริง**
