# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioned with [SemVer](https://semver.org/).

## [0.6.0] - 2026-08-20

### Added
- iOS-style UI pass: segmented controls (asset sub-tabs, trend granularity, table row count, expense report granularity) replacing separate chip-button rows; bottom sheet gets a drag handle, blurred backdrop, and drag-to-dismiss; bottom nav bar is translucent/blurred with a filled icon for the active tab
- Colored subgroup headers in the cashflow tab (Active/Passive/Fixed/ทั่วไป/ออมและลงทุน) — label and amount both tinted to the class's color and right-aligned, instead of a plain gray line

### Changed
- Grouped-list look app-wide: card corner radius reduced (22px → 14px), row dividers inset past the icon instead of full-width, and tappable rows show a trailing chevron instead of a pencil icon
- Income/Expense entry badges now distinguish Active vs Passive (two shades of green) and Fixed vs ทั่วไป (two shades of orange), matching each section's own color instead of sharing one shade across income and expense

## [0.5.2] - 2026-08-19

### Fixed
- Asset trend chart legend order (was jumping "Net Worth" to the front) — Recharts' default legend sorting is alphabetical, which ranks the Latin label ahead of the Thai ones regardless of bar order; now matches the bars left-to-right (สินทรัพย์ทั้งหมด/หนี้สินทั้งหมด/Net Worth)

## [0.5.1] - 2026-08-19

### Fixed
- Category chips in the income/expense entry form couldn't be reordered on mobile — they used the HTML5 drag-and-drop API, which never fires on touch; switched to Pointer Events so long-press-and-drag reordering works on phones

### Added
- "ของใช้ในบ้าน" default expense category, added retroactively for existing installs too

## [0.5.0] - 2026-08-19

### Added
- Cashflow tab can now navigate to previous/next billing cycles (‹ › buttons) to view and edit past months' entries, instead of only ever showing the current cycle
- Dashboard cards (goal progress, investment allocation, passive income) are now collapsible accordions, showing just the key stat by default and expanding to full detail on tap — keeps the page shorter on mobile

### Changed
- "อัตราส่วนสภาพคล่องพื้นฐาน" now only fails on the low side (< 3 เท่า) instead of also failing above 6 เท่า — the "too much idle cash" signal is already covered separately by the investment ratio, and the two-sided check could make it read as contradicting "สภาพคล่องต่อความมั่งคั่งสุทธิ" for low-net-worth cases

## [0.4.2] - 2026-08-17

### Changed
- Goal progress rows on the Dashboard now show the % complete next to the saved/target amounts, matching the Goals tab

## [0.4.1] - 2026-08-17

### Changed
- Renamed the "Variable (ผันแปร)" expense class to "ทั่วไป" everywhere it's shown (cashflow tab, reports, entry-modal badge) — plainer, easier-to-understand wording

## [0.4.0] - 2026-08-17

### Added
- Personal financial ratios (the standard 10-ratio CFP-style set: survival, passive income, liquidity, wealth, debt-to-asset, debt service, savings, investment, current ratio) on a new "อัตราส่วนทางการเงิน" page, each with a pass/fail badge against its standard benchmark
- Dashboard summary card (between the asset-allocation chart and the Passive Income card) showing "X จาก 10 ข้อ ผ่านเกณฑ์" with a link through to the full breakdown
- Short actionable advice shown under any ratio that fails its benchmark

## [0.3.1] - 2026-08-17

### Changed
- Raised the mobile type-scale floor app-wide (chart axis labels, row meta text, table headers/cells, item names) — nothing renders below 11px anymore, was as small as 9px in places

## [0.3.0] - 2026-08-17

### Added
- Asset trend chart on a new "แนวโน้ม" tab in Assets: total assets, total liabilities, and net worth as grouped bars per period, switchable between month/quarter/half-year/year
- Daily net-worth snapshots (`netWorthHistory`), recorded automatically whenever an asset or liability changes or the app opens on a new day — the only source of history, since asset rows only ever stored their current value
- Month-by-month comparison table (assets/liabilities/net worth plus the change and % change vs the previous month), with a selectable row count

## [0.2.0] - 2026-08-16

### Added
- Tap-to-edit rows for assets, liabilities, and goals, with a shared Add FAB + modal pattern replacing the old always-visible forms
- Dashboard net-worth drilldowns (expandable rows for liquid/investment/personal/liability totals)
- "ออมและลงทุน" (saving/investment) expense classification, auto-detected from category keywords, alongside Fixed/Variable
- Settings tab: hourly-wage (auto-computed or manual), primary goal picker, cashflow & asset export/import
- Spend-vs-wage and spend-vs-goal comparisons, shown live while entering an expense and on saved rows
- Per-goal expected return and a recommended-monthly-savings figure (future-value-of-annuity math)
- Asset tabs (Liquid/Investment/Personal) grouped by category with per-group subtotals
- "ออมเงิน" / "ลงทุน DCA" default expense categories
- Per-category monthly expense budgets, shown as progress bars on the cashflow tab, the reports page, and a Variable-only alert card on the dashboard
- Monthly category trend chart on the reports page (stacked by category, or isolate one category), shown when viewing by half-year or year
- Calculator-style input for every money field app-wide

### Changed
- Unified color tokens (positive/danger/muted-label), list-row dividers, category icons, and font-weight hierarchy for a cleaner, less busy look
- Selection/accent color changed from pink to teal
- Auto-computed hourly wage now tracks the current billing cycle's Active income live (excluding bonuses/incentives/commissions) instead of a one-time guess
- Tuned first-run sample data for internal consistency (car loan payment now has a matching cashflow entry; the emergency-fund goal is no longer already 100% funded on day one)

### Fixed
- Initial-load redirect moved to an edge-level config redirect instead of a server-rendered page (cut ~700ms off first load)
- Removed an unused font weight to cut two font file downloads
- Dev server launch config now invokes `node.exe` directly instead of `npm.cmd`, which was failing to resolve `node` on PATH in the preview server's spawned process

## [0.1.0] - 2026-08-xx

Initial scaffold: Next.js + PWA app with cashflow tracking, liquid/investment/personal assets, liabilities, and goals, backed by Dexie (IndexedDB).
