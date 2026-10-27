# เงินทองของเรา 🌱 — project notes for Claude

A Thai-first personal-finance PWA: Next.js 16 (App Router, Turbopack), Dexie/IndexedDB, Recharts 3. The app lives in `financial-planning/`; read `financial-planning/AGENTS.md` before touching Next.js code — this Next.js version differs from older ones.

## Working with the owner

- **Always reply in Thai**, including technical explanations.
- State your understanding before implementing. When the owner says "บอกก่อน", "อย่าเพิ่งทำ" or asks "ดีมั้ย", give analysis only — no code until they say ทำเลย / โอเค / ลงโค้ดได้เลย.
- For visible UI changes they usually want a mockup first (a published Artifact page), then implementation.
- All user data stays on the device (IndexedDB). Nothing is ever sent to a server.

## Releasing

Every finished change ships as a release:

1. `npm run lint` and `npm run build` in `financial-planning/` must pass.
2. Bump `financial-planning/package.json` — MINOR for a new feature, PATCH for a fix.
3. Add a newest-first entry to `financial-planning/CHANGELOG.md` (Added / Changed / Fixed, written for the owner, explaining why).
4. Commit with a message starting `Release vX.Y.Z: …`, tag `git tag -a vX.Y.Z`, push `main` and the tag.

Pushing `main` deploys automatically to Vercel: https://financial-planning-mu.vercel.app (the Settings page shows the live version).

## Code habits

- One shared function/component per concept so screens can't drift (e.g. `growthPercent`, `cycleRangeAtOffset`, `useBackupStatus`, `shareJson`).
- Dexie schema changes need a new `this.version(n)` in `src/lib/db.ts`; unindexed optional fields need no bump.
- Verify at 375px phone width; remove any test data added to IndexedDB afterwards.
