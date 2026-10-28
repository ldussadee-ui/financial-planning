import type { ReactNode } from "react";
import {
  AlarmClock, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Banknote, BookOpen, Briefcase, Bus, Calculator, CalendarDays,
  Car, ChartCandlestick, ChartColumn, ChartLine, ChartPie, Check, CircleCheck, CircleHelp, CircleX, CloudSun, Coins,
  CreditCard, Delete, FileText, Gauge, Gem, Gift, HandHeart, HardDriveDownload, House, KeyRound, Landmark, Laptop,
  LayoutDashboard, Layers, Leaf, Lightbulb, Lock, Package, Palette, PartyPopper, PenLine, Pill, Plane, Plus, Repeat,
  Scale, Settings, Shield, ShieldCheck, ShoppingBag, Sparkles, SprayCan, Sprout, Tag, Target, Timer, TrendingUp,
  TriangleAlert, Upload, Download, User, Users, UtensilsCrossed, WalletCards, Wifi, Zap, Wallet, ScrollText, Building2,
  Shapes, Trophy, Sofa, createLucideIcon, type LucideIcon,
} from "lucide-react";
import type { InvestmentCategory, LiabilityTerm, LiquidType, PersonalItemType } from "@/lib/types";

// Lucide's ChartPie leaves a gap in its outline next to the slice, which
// reads as a broken line once the "tint" size fills it. This one is a whole
// circle with the slice marked by two lines inside.
const ClosedChartPie = createLucideIcon("ClosedChartPie", [
  ["circle", { cx: "12", cy: "12", r: "9", key: "circle" }],
  ["path", { d: "M12 3v9h9", key: "slice" }],
]);

// The app's "Pop Sticker" icon set (v0.26.0): a line glyph on a flat colour
// tile with the Bold Pop ink outline and hard shadow. Every concept gets one
// entry here so the same thing never shows two different icons on two
// screens; emoji are no longer used anywhere in the UI.
export type IconTone = "yellow" | "pink" | "teal" | "lav" | "sky";

const ICONS = {
  // page and section titles
  app: [Sprout, "teal"],
  overview: [LayoutDashboard, "yellow"],
  cashflow: [ArrowLeftRight, "pink"],
  recurring: [Repeat, "lav"],
  liquid: [Banknote, "teal"],
  invest: [ChartCandlestick, "pink"],
  personal: [Gem, "sky"],
  liability: [CreditCard, "pink"],
  assetTrend: [ChartLine, "lav"],
  goals: [Target, "yellow"],
  report: [ClosedChartPie, "sky"],
  paymentSummary: [WalletCards, "teal"],
  ratios: [Scale, "lav"],
  insurance: [ShieldCheck, "teal"],
  settings: [Settings, "yellow"],
  assets: [Layers, "teal"],
  // labels, badges and buttons
  income: [ArrowDownLeft, "teal"],
  expense: [ArrowUpRight, "pink"],
  fixed: [Lock, "lav"],
  general: [ShoppingBag, "yellow"],
  saveInvest: [Sprout, "teal"],
  passive: [Leaf, "teal"],
  active: [Zap, "yellow"],
  calendar: [CalendarDays, "sky"],
  card: [CreditCard, "pink"],
  cash: [Banknote, "teal"],
  unknownMethod: [CircleHelp, "sky"],
  add: [Plus, "yellow"],
  typeOwn: [PenLine, "sky"],
  category: [Tag, "yellow"],
  budget: [Gauge, "yellow"],
  monthlyTrend: [ChartColumn, "lav"],
  spendCompare: [Timer, "sky"],
  calculator: [Calculator, "lav"],
  tip: [Lightbulb, "yellow"],
  warning: [TriangleAlert, "pink"],
  pass: [CircleCheck, "teal"],
  fail: [CircleX, "pink"],
  check: [Check, "teal"],
  expiring: [AlarmClock, "sky"],
  beneficiary: [User, "sky"],
  backup: [HardDriveDownload, "sky"],
  exportData: [Upload, "lav"],
  importData: [Download, "teal"],
  empty: [CloudSun, "sky"],
  backspace: [Delete, "sky"],
} satisfies Record<string, [LucideIcon, IconTone]>;

export type IconName = keyof typeof ICONS;

const TONE_VAR: Record<IconTone, string> = {
  yellow: "var(--yellow)", pink: "var(--pink)", teal: "var(--teal)", lav: "var(--lav)", sky: "var(--sky)",
};

const OPEN_GLYPHS = new Set<LucideIcon>([Repeat]);

// "lg" sits beside a page title, "md" at the start of a list row, "sm" in
// front of a label, and "glyph" is the
// bare line icon for places that already have their own coloured background
// (buttons, pass/fail pills). "tint" is that bare icon with its closed
// shapes filled in the tile colour, for white buttons that want a touch of
// colour without a tile (the cashflow shortcuts).
export type IconSize = "lg" | "md" | "sm" | "glyph" | "tint";

// `tone` is one of the palette tones, or any CSS colour for tiles that must
// match a colour used elsewhere (an investment category's chart colour).
function Sticker({ Glyph, tone, size }: { Glyph: LucideIcon; tone: IconTone | string; size: IconSize }) {
  if (size === "glyph") return <Glyph aria-hidden size={15} strokeWidth={2.5} style={{ flexShrink: 0 }} />;
  const bg = TONE_VAR[tone as IconTone] ?? tone;
  // Glyphs made only of open strokes (Repeat's arrows) would fill as stray
  // slivers, so they stay unfilled.
  if (size === "tint") return <Glyph aria-hidden size={15} strokeWidth={2.5} fill={OPEN_GLYPHS.has(Glyph) ? "none" : bg} style={{ flexShrink: 0 }} />;
  return (
    <span aria-hidden className={size === "sm" ? "fp-ic" : `fp-ic fp-ic-${size}`} style={{ ["--ic-tone" as string]: bg }}>
      <Glyph strokeWidth={size === "sm" ? 2.5 : 2.25} />
    </span>
  );
}

export function PopIcon({ name, size = "sm" }: { name: IconName; size?: IconSize }) {
  const [Glyph, tone] = ICONS[name];
  return <Sticker Glyph={Glyph} tone={tone} size={size} />;
}

// An icon in front of a line of text, vertically centred with it.
export function IconLabel({ name, size = "sm", children }: { name: IconName; size?: IconSize; children: ReactNode }) {
  return (
    <span className="fp-ic-label">
      <PopIcon name={name} size={size} />
      <span>{children}</span>
    </span>
  );
}

// Category icons are looked up by the category's (Thai) label — the main
// categories of categoryTree.ts first, then the single-level categories used
// before v0.23.0 that imported files can still carry. Tiles are coloured by
// group: income teal, everyday spending yellow, commitments lavender,
// saving and investing pink. Anything else (a category the owner typed
// in) gets the tag icon. The emoji still stored in each CategoryChip's
// `icon` field is no longer shown.
const CATEGORY_ICONS: Record<string, [LucideIcon, IconTone]> = {
  "รายได้จากงาน": [Briefcase, "teal"], "รายได้จากทรัพย์สิน": [Coins, "teal"],
  "เงินเดือน": [Briefcase, "teal"], "ฟรีแลนซ์": [Laptop, "teal"], "โบนัส": [Gift, "teal"], "ดอกเบี้ย": [Landmark, "teal"],
  "ค่าเช่า": [House, "teal"], "ปันผลหุ้น/DR": [ChartCandlestick, "teal"],
  "อาหาร": [UtensilsCrossed, "yellow"], "ค่าอาหาร": [UtensilsCrossed, "yellow"], "เดินทาง": [Car, "yellow"],
  "ค่าเดินทาง": [Bus, "yellow"], "ท่องเที่ยว": [Plane, "yellow"], "สุขภาพ": [Pill, "yellow"],
  "ดูแลตัวเองและช้อปปิ้ง": [Sparkles, "yellow"], "ช้อปปิ้ง": [ShoppingBag, "yellow"], "งานและการเรียนรู้": [BookOpen, "yellow"],
  "งานอดิเรกและสัตว์เลี้ยง": [Palette, "yellow"], "ท่องเที่ยว/สังสรรค์": [PartyPopper, "yellow"],
  "ของใช้ในบ้าน": [SprayCan, "yellow"], "ทำบุญ": [HandHeart, "yellow"], "อื่นๆ": [Package, "yellow"],
  "บ้าน": [House, "lav"], "ผ่อนบ้าน": [House, "lav"], "ผ่อนรถ": [Car, "lav"], "ค่าเช่าที่พัก": [KeyRound, "lav"],
  "บิลรายเดือน": [FileText, "lav"], "ค่าน้ำค่าไฟ": [Zap, "lav"], "ค่าอินเทอร์เน็ต": [Wifi, "lav"],
  "ประกัน": [Shield, "lav"], "เบี้ยประกัน": [Shield, "lav"], "ครอบครัว": [Users, "lav"],
  "ออมและลงทุน": [TrendingUp, "pink"], "ลงทุน DCA": [TrendingUp, "pink"], "ออมเงิน": [Sprout, "pink"],
};

export function CategoryIcon({ category, size = "sm" }: { category: string; size?: IconSize }) {
  const [Glyph, tone] = CATEGORY_ICONS[category] ?? [Tag, "yellow"];
  return <Sticker Glyph={Glyph} tone={tone} size={size} />;
}

// Row icons for the asset and debt lists: what kind of thing each row is,
// on the tab's own tile colour (investments keep their category's chart
// colour so a row matches its slice in the allocation chart).
const LIQUID_ICONS: Record<LiquidType, LucideIcon> = {
  "เงินสด": Banknote, "บัญชีออมทรัพย์": Landmark, "บัญชีกระแสรายวัน": Wallet, "กองทุนตลาดเงิน": Coins, "อื่นๆ": Package,
};
const INVESTMENT_ICONS: Record<InvestmentCategory, LucideIcon> = {
  FixedIncome: ScrollText, Equity: ChartCandlestick, MutualFund: ChartPie, RealEstate: Building2, Gold: Gem, Alternative: Shapes,
};
const PERSONAL_ICONS: Record<PersonalItemType, LucideIcon> = {
  "รถยนต์": Car, "บ้านอยู่เอง": House, "ของสะสม": Trophy, "เครื่องประดับ": Gem, "เฟอร์นิเจอร์": Sofa, "อื่นๆ": Package,
};
const LIABILITY_ICONS: Record<LiabilityTerm, LucideIcon> = { ShortTerm: CreditCard, LongTerm: Landmark };

export function LiquidIcon({ type, color }: { type: LiquidType; color: string }) {
  return <Sticker Glyph={LIQUID_ICONS[type] ?? Package} tone={color} size="md" />;
}
export function InvestmentIcon({ category, color }: { category: InvestmentCategory; color: string }) {
  return <Sticker Glyph={INVESTMENT_ICONS[category] ?? Shapes} tone={color} size="md" />;
}
export function PersonalIcon({ type, color }: { type: PersonalItemType; color: string }) {
  return <Sticker Glyph={PERSONAL_ICONS[type] ?? Package} tone={color} size="md" />;
}
export function LiabilityIcon({ term, color }: { term: LiabilityTerm; color: string }) {
  return <Sticker Glyph={LIABILITY_ICONS[term] ?? CreditCard} tone={color} size="md" />;
}
