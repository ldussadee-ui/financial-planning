# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioned with [SemVer](https://semver.org/).

## [0.10.3] - 2026-09-04

### Fixed
- The retirement target was computed with two different withdrawal-timing conventions depending on whether a post-retirement return was set. The no-return case correctly took each year's spending at the start of the year; the with-return case discounted as if the first year's money were only needed twelve months after retiring. The two disagreed by a factor of (1 + inflation), so raising the return from 0% to 0.05% made the target jump *up* by around ฿500,000 — earning more can never require saving more. Both branches now take spending at the start of the year, which matches a year-by-year simulation exactly at every rate tested
- The error was zero when the post-retirement return equalled inflation, so the default figure was always right; it grew as the assumption moved away from the default, overstating by up to 2.5% below it and understating by 1.9% at 5% — understating being the more dangerous direction. Targets already saved are recomputed from their stored assumptions when the goal is reopened

## [0.10.2] - 2026-09-04

### Changed
- The assumption comparison table now reads as a table: its column headings are larger, bolder, and in the primary text color instead of whispering above the figures in small grey caps, with a hairline rule tying them to the rows beneath and more room between rows. The headings are no longer uppercased — it does nothing for Thai and only made the English heading longer and shoutier — and the first column is wider, since the value columns only ever hold figures like "฿217,575"

## [0.10.1] - 2026-09-04

### Fixed
- The comparison table's first column was headed just "ผลตอบแทน", which doesn't say which of the form's two returns it varies — and the teaser line that did say so is hidden once the table is open. It now names the assumption in full
- The note under the table described the already-saved amount as "เงินที่ผูกไว้", app jargon for what a reader would call the principal they've saved so far, and didn't mention that a value outside the listed rates can be typed into the field above
- The goal type and priority dropdowns split their row evenly despite the longest goal type ("กองทุนฉุกเฉิน") needing roughly twice the room of the longest priority ("กลาง") — now 2:1

## [0.10.0] - 2026-09-04

### Added
- A retirement planning helper on goals of type "เกษียณ": enter what you expect to spend per month in today's money, how many years the money has to last, an inflation rate, and an assumed return during retirement, and the goal's target amount is worked out for you — inflating the spending to your retirement date, then either summing the still-inflating years or discounting them at the return net of inflation. Everything downstream already worked from the target, so the existing "recommended monthly savings", progress bar, and linked-asset tracking need no change to benefit
- The assumptions are stored on the goal rather than only the number they produce, so reopening it later shows where the target came from and lets you adjust one input without re-entering the rest
- A collapsible comparison of what the target and the required monthly saving become across post-retirement returns from 0–5%, since that single assumption moves the answer by around 40%. Its closed state shows the resulting range, and tapping any row adopts that assumption
- A "คำนวณให้ / ใส่เอง" switch for goals where you already have a target figure from elsewhere. Without an explicit mode, touching any assumption would silently overwrite a hand-typed number; goals created before this release open in "ใส่เอง", which is what they always were

### Changed
- The goal form is reordered by role: the two classification dropdowns pair on one row, the accumulation return moves above the target date (which for a retirement goal is the helper's first input, so nothing sits between them), and the form now ends on the target amount rather than burying it
- "ผลตอบแทนคาดหวัง" is now "ผลตอบแทนช่วงเก็บเงิน", reading as a pair with the new "ผลตอบแทนหลังเกษียณ" — two different rates for two different stretches of time that were easy to confuse under one name

## [0.9.5] - 2026-09-03

### Fixed
- The cashflow cycle card (cycle nav, day-start picker, and 3 shortcut links) was a single flex-wrap row with no grouping, so shortcut labels could wrap unpredictably on mobile — even mid-word. Regrouped into two rows: cycle range + day-start together on top, and the 3 shortcuts below as an equal-width row so all three are always visible with no scrolling; also shortened the shortcut labels (dropped a redundant "Summary" prefix and the trailing arrows, now redundant since the shortcuts already read as tappable pills)

## [0.9.4] - 2026-09-01

### Fixed
- The 0.9.3 fix didn't fully resolve the mobile calculator issue — confirmed by a real device recording showing a tap-highlight on the close button followed by no response. The underlying issue was structural: a modal opened from inside another modal (the amount-entry calculator) was a genuine DOM descendant of the outer one, not just visually layered — the same class of issue already responsible for one clipping bug this project hit before. Modals now render through a React portal straight onto `<body>` instead of nesting in the DOM at the point they're written in the tree, so a nested modal is no longer a descendant of its parent at all. Re-verified every modal interaction (open, close via X/backdrop/drag/Escape, nested focus-trap isolation, focus restoration, calculator confirm) still works correctly

## [0.9.3] - 2026-09-01

### Fixed
- Could not enter cashflow amounts or edit asset values on mobile — two compounding issues in the shared amount-entry calculator: the field that opens it was a `readonly` `<input>`, which mobile Safari/Chrome don't always reliably deliver taps to, so tapping it sometimes did nothing (now a real `<button>`); and once the calculator did open, it immediately focused itself for accessibility (screen reader dialog announcement), which on some mobile browsers nudges the page's scroll position right as a tap is landing — the browser then discards the tap as a drag rather than firing a click, silently eating taps on the "X" close and confirm buttons. Confirmed via a screen recording showing a real tap-highlight on the close button followed by nothing happening. The focus now waits a frame for layout to settle and explicitly opts out of scroll-into-view

## [0.9.2] - 2026-09-01

### Fixed
- Cashflow category colors (Active/Passive/Fixed/General/Savings & Investing) were hard to read against their own group's background tint, and Savings & Investing was visually identical to Active income (same green) even though they're unrelated categories — each class now gets its own distinct hue, verified at 4.5:1+ contrast against its background
- Each cashflow subgroup (Active, Passive, Fixed, General, Savings & Investing) now renders on its own tinted background block instead of all subgroups within a section sharing one uniform card background, making them easier to tell apart at a glance
- Expense entries categorized as "PVD" or "Reinvestment" (or the Thai "กองทุนสำรองเลี้ยงชีพ") were auto-classified as General instead of Savings & Investing, since those weren't in the keyword list the auto-classifier checks — added them, and existing entries are reclassified retroactively on upgrade

## [0.9.1] - 2026-08-31

### Fixed
- Addressed all 16 findings from an accessibility audit (WCAG 2.1/2.2):
  - **Contrast**: the app-wide secondary-text color and two other hardcoded grays (used for the sidebar, language toggle, section headers, ratio card text, and inactive tabs) were below the 4.5:1 minimum — unified to a single darker color (5.3–6.5:1 against every background it appears on)
  - **Touch targets**: sidebar rows, the language toggle, and the floating add buttons were smaller than the recommended 44×44px on mobile — enlarged
  - **Keyboard focus**: no element had a visible focus indicator anywhere in the app — added one globally; the language toggle's DOM position put it after the sidebar in tab order despite sitting visually above it — moved it out of the Dashboard page into the shared layout (now also reachable from every tab, not just the Dashboard); the sidebar and bottom nav landmarks had no distinguishing label for screen readers — added one to each
  - **Semantic structure**: no heading elements existed anywhere, so screen reader users couldn't jump between sections — added a page `<h1>` and card-level `<h2>`s; form fields (asset/goal/etc. modals) had visible label text with no programmatic association — `Field` now renders a native `<label>` wrapping its control; modals weren't announced as dialogs and keyboard focus could tab out into the page behind them — added `role="dialog"`, `aria-modal`, `aria-labelledby`, and a real focus trap (correctly scoped for a modal opened from inside another modal, e.g. the amount field's calculator)
  - **Color-only indicators**: the pass/fail progress bars on the Dashboard relied on color alone to separate the two segments — added a visible divider

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
