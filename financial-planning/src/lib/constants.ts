import type { InvestmentCategory, LiquidType, PersonalItemType, GoalType, LiquidityTier, PolicyType, PropertyKind } from "./types";

export interface CatInfo {
  key: InvestmentCategory;
  label: string;
  color: string;
  liquidity: LiquidityTier;
}

export const CATS: CatInfo[] = [
  { key: "FixedIncome", label: "ตราสารหนี้", color: "#20C58A", liquidity: "สูง" },
  { key: "Equity", label: "หุ้น", color: "#FF5C7A", liquidity: "สูง" },
  { key: "MutualFund", label: "กองทุนรวม", color: "#5AC8FF", liquidity: "สูง" },
  { key: "RealEstate", label: "อสังหาริมทรัพย์", color: "#9B87FF", liquidity: "ต่ำ" },
  { key: "Gold", label: "ทองคำ", color: "#FFD84D", liquidity: "ต่ำ" },
  { key: "Alternative", label: "สินทรัพย์ทางเลือก", color: "#FF9F5A", liquidity: "กลาง" },
];
export const catInfo = (key: InvestmentCategory): CatInfo => CATS.find((c) => c.key === key) || CATS[0];

export const LIQUID_TYPES: LiquidType[] = ["เงินสด", "บัญชีออมทรัพย์", "บัญชีกระแสรายวัน", "กองทุนตลาดเงิน", "อื่นๆ"];
// One flat colour per tab, the way LIQUID_COLOR already works. Investment
// is the exception and keeps a colour per category, because those values
// are the ones the dashboard's allocation chart and the trend bars are
// drawn in — changing them there would change the charts. Nothing else has
// per-row categories worth encoding, since every list is already grouped by
// exactly the thing a per-category colour would repeat.
export const LIQUID_COLOR = "#B6E0FF";
export const PERSONAL_COLOR = "#FFE9A8";
export const LIABILITY_COLOR = "#FFC2CF";

// The two cashflow directions. Shared so the floating button that opens an
// entry sheet and the confirm button inside it cannot drift apart — teal
// means income on this screen, so an expense confirming in teal reads wrong.
export const INCOME_COLOR = "#20C58A";
export const EXPENSE_COLOR = "#FF5C7A";

export const PERSONAL_TYPES: PersonalItemType[] = ["รถยนต์", "บ้านอยู่เอง", "ของสะสม", "เครื่องประดับ", "เฟอร์นิเจอร์", "อื่นๆ"];
export const GOAL_TYPES: GoalType[] = ["เกษียณ", "บ้าน", "การศึกษา", "ท่องเที่ยว", "กองทุนฉุกเฉิน", "อื่นๆ"];
export const POLICY_TYPES: PolicyType[] = ["ชีวิต", "สุขภาพ", "อุบัติเหตุ", "โรคร้ายแรง", "คุ้มครองสินเชื่อ", "บ้านและรถ"];
export const PROPERTY_KINDS: PropertyKind[] = ["อัคคีภัย", "รถยนต์", "อื่นๆ"];

// Emoji stored in each CategoryChip's `icon` field for the main categories
// (see categoryTree.ts), then for the single-level categories used before
// v0.23.0, which imported files from an older app can still carry. Since
// v0.26.0 the UI draws CategoryIcon (components/icons.tsx) from the label
// instead; this only keeps the stored field filled as before.
export const ICON_MAP: Record<string, string> = {
  "รายได้จากงาน": "💼", "รายได้จากทรัพย์สิน": "💰",
  "อาหาร": "🍜", "บ้าน": "🏠", "เดินทาง": "🚗", "ท่องเที่ยว": "✈️", "สุขภาพ": "💊",
  "ดูแลตัวเองและช้อปปิ้ง": "💄", "งานและการเรียนรู้": "📚", "งานอดิเรกและสัตว์เลี้ยง": "🎨",
  "ทำบุญ": "🙏", "อื่นๆ": "📦", "บิลรายเดือน": "📑", "ประกัน": "🛡️", "ครอบครัว": "👵", "ออมและลงทุน": "📈",
  "เงินเดือน": "💼", "ฟรีแลนซ์": "💻", "โบนัส": "🎁", "ปันผลหุ้น/DR": "📈", "ดอกเบี้ย": "🏦", "ค่าเช่า": "🏠",
  "ผ่อนบ้าน": "🏠", "ผ่อนรถ": "🚗", "ค่าเช่าที่พัก": "🔑", "ค่าน้ำค่าไฟ": "💡", "ค่าอินเทอร์เน็ต": "📶",
  "เบี้ยประกัน": "🛡️", "ค่าอาหาร": "🍜", "ค่าเดินทาง": "🚌", "ช้อปปิ้ง": "🛍️", "ท่องเที่ยว/สังสรรค์": "🎉",
  "ของใช้ในบ้าน": "🧻", "ออมเงิน": "🌱", "ลงทุน DCA": "📈",
};

// keywords used to auto-detect fixed (recurring/committed) expenses — everything else defaults to variable
// ("ให้แม่" and "ค่าจ้างทำสวน" are the user's own monthly commitments — money
// to their mother and the gardener — added at their request.)
// "บิลรายเดือน", "ครอบครัว" and "ประกัน" are main categories whose every
// sub-item is a monthly commitment.
export const FIXED_KEYWORDS = ["บิลรายเดือน", "ครอบครัว", "ผ่อน", "ค่าเช่า", "โทรศัพท์", "อินเทอร์เน็ต", "เน็ตบ้าน", "เบี้ยประกัน", "ประกัน", "ค่าเทอม", "สมาชิก", "งวด", "หนี้", "ให้แม่", "ค่าจ้างทำสวน"];

// keywords used to auto-detect saving/investment expenses — checked before FIXED_KEYWORDS
export const INVEST_KEYWORDS = ["ออม", "ลงทุน", "กองทุนรวม", "DCA", "RMF", "SSF", "ประกันสะสมทรัพย์", "บำนาญ", "PVD", "กองทุนสำรองเลี้ยงชีพ", "Reinvestment", "Reinvest"];

// keywords used to auto-detect passive income — everything else defaults to active
export const PASSIVE_KEYWORDS = ["รายได้จากทรัพย์สิน", "ปันผล", "ดอกเบี้ย", "ค่าเช่า", "เช่า", "ลิขสิทธิ์", "royalty", "dividend", "แบ่งปันกำไร", "กำไรจากการขาย", "ค่าตอบแทนกองทุน"];

// keywords for Active income that's still one-off/irregular (bonuses,
// incentives, commissions) — excluded from the hourly-wage estimate so a
// single spike doesn't inflate it
export const IRREGULAR_INCOME_KEYWORDS = ["โบนัส", "bonus", "อินเซนทีฟ", "incentive", "คอมมิชชั่น", "commission"];
