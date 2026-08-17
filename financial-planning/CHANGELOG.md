# Changelog

All notable changes to this project are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versioned with [SemVer](https://semver.org/).

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
