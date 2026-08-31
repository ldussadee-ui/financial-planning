# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioned with [SemVer](https://semver.org/).

## [0.9.0] - 2026-08-31

### Added
- Recurring income/expense entries: toggle "Repeat this entry every month" when adding a new entry, pick the day of the month (with the same weekend-shift option as the cycle start day) — the app generates a real cashflow entry automatically each month from then on, catching up on any months missed while the app was closed. A new "Recurring Entries" page (linked from the Cashflow tab) lists all of them with pause/resume, edit, and delete; editing or deleting a recurring entry never changes months already generated. Entries created this way show a "From a recurring entry" badge linking back to their source
- A one-time dismissible notice on the Cashflow tab lists whatever recurring entries were just auto-generated, so new entries never appear silently

### Fixed
- `getCycleRange()` (used for the current cycle everywhere in the app) produced an invalid, inverted date range when the cycle start day was 1 or 2 with weekend-shifting on and the shift crossed into the previous month, and was off by one day for cycle start days of 29–31 in short months (day 30/31 in a 30-day month, day 29–31 in February) — both were edge cases in how the day was clamped and which month the *next* cycle boundary was computed from; cycle start days from 3–28 were never affected

## [0.8.1] - 2026-08-23

### Fixed
- Cashflow tab's selected month stayed on whatever cycle was last viewed instead of returning to the current one after the app had been reopened — as a PWA, the tab is usually suspended rather than fully closed, so its in-memory state survives; the app now resets to the current cycle when it's been hidden for more than 10 minutes, while a brief switch to another app leaves the selected month alone
- Cashflow tab's current-cycle calculation (including the "back to current cycle" button and the ‹ › navigation) could land one full cycle off from the real current one whenever the billing cycle's start day is after the 15th and today has already passed it this month — it anchored on a fixed mid-month reference date instead of today's actual date; cycle navigation now steps from the real current cycle instead

## [0.8.0] - 2026-08-23

### Added
- Risk Protection page (`/dashboard/insurance`): tracks insurance policies (life, health, accident, critical illness, credit life) and checks them against 4 standard-based rules — life coverage gap (10 years of living expenses plus liabilities, net of liquid/investment assets), health coverage (existence check), credit-life coverage vs. remaining long-term debt, and total premiums vs. 15% of annual income
- Alerts for policies expiring within 60 days and policies missing a named beneficiary
- New "🛡️ Risk Protection" card on the Dashboard showing pass/fail count, linking to the full page
- Fully bilingual (TH/EN), consistent with the rest of the app

## [0.7.1] - 2026-08-21

### Fixed
- Pie chart tooltips (expense-by-category on the reports page, investment allocation on the Dashboard) still showed the raw Thai category/investment-category name in English mode — Recharts reads pie labels straight from the data instead of the translated `name` prop used elsewhere; the tooltip formatter now translates the label too

## [0.7.0] - 2026-08-21

### Added
- English language support with a TH/EN switch on the Dashboard — translates every tab (Cashflow, Assets, Goals, Settings, Reports, Payment Summary, Financial Ratios), the calculator, and all shared components. Stored data (categories, asset/goal/liability names) always stays in Thai regardless of display language; only known default labels are translated for display, so switching language never touches saved data or breaks the Thai-keyword auto-classification. Custom text the user typed themselves always shows verbatim
- Dates and month names in charts/tables now switch locale (Thai/English) along with the rest of the UI

### Fixed
- Calendar year is now always Gregorian (ค.ศ.) everywhere, regardless of language — some date displays previously used the Buddhist Era (พ.ศ.)

## [0.6.2] - 2026-08-20

### Fixed
- Calculator popup opened from inside another sheet (editing an asset or cashflow amount) still rendered incomplete after the 0.6.1 fix — the real cause was the drag-to-dismiss `transform` on the outer sheet, which (per CSS spec) turns it into a containing block for any `position:fixed` descendant, clipping the nested calculator to the outer sheet's own box instead of the real viewport. `transform` is now only applied while actively dragging, not at rest

## [0.6.1] - 2026-08-20

### Fixed
- Calculator popup (and other bottom sheets) could render taller than the visible screen on mobile Safari, pushing the top rows off-screen while the address bar was showing — `vh` sizes against the viewport with browser chrome hidden, not the currently-visible one; switched to `dvh` (with a `vh` fallback) so the sheet sizes against what's actually visible

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
