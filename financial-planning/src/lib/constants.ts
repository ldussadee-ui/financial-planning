import type { InvestmentCategory, LiquidType, PersonalItemType, GoalType, LiquidityTier, PolicyType } from "./types";

export interface CatInfo {
  key: InvestmentCategory;
  label: string;
  color: string;
  liquidity: LiquidityTier;
}

export const CATS: CatInfo[] = [
  { key: "FixedIncome", label: "ตราสารหนี้", color: "#B7E4C7", liquidity: "สูง" },
  { key: "Equity", label: "หุ้น", color: "#FFB5A7", liquidity: "สูง" },
  { key: "MutualFund", label: "กองทุนรวม", color: "#A0CED9", liquidity: "สูง" },
  { key: "RealEstate", label: "อสังหาริมทรัพย์", color: "#C9B8FF", liquidity: "ต่ำ" },
  { key: "Gold", label: "ทองคำ", color: "#FFE29A", liquidity: "ต่ำ" },
  { key: "Alternative", label: "สินทรัพย์ทางเลือก", color: "#FFAFCC", liquidity: "กลาง" },
];
export const catInfo = (key: InvestmentCategory): CatInfo => CATS.find((c) => c.key === key) || CATS[0];

export const LIQUID_TYPES: LiquidType[] = ["เงินสด", "บัญชีออมทรัพย์", "บัญชีกระแสรายวัน", "กองทุนตลาดเงิน", "อื่นๆ"];
export const LIQUID_COLOR = "#BFE3F0";

export const PERSONAL_TYPES: PersonalItemType[] = ["รถยนต์", "บ้านอยู่เอง", "ของสะสม", "เครื่องประดับ", "เฟอร์นิเจอร์", "อื่นๆ"];
export const GOAL_TYPES: GoalType[] = ["เกษียณ", "บ้าน", "การศึกษา", "ท่องเที่ยว", "กองทุนฉุกเฉิน", "อื่นๆ"];
export const POLICY_TYPES: PolicyType[] = ["ชีวิต", "สุขภาพ", "อุบัติเหตุ", "โรคร้ายแรง", "คุ้มครองสินเชื่อ"];

export const ICON_MAP: Record<string, string> = {
  "เงินเดือน": "💼", "ฟรีแลนซ์": "💻", "โบนัส": "🎁", "ปันผลหุ้น/DR": "📈", "ดอกเบี้ย": "🏦", "ค่าเช่า": "🏠",
  "ผ่อนบ้าน": "🏠", "ผ่อนรถ": "🚗", "ค่าเช่าที่พัก": "🔑", "ค่าน้ำค่าไฟ": "💡", "ค่าอินเทอร์เน็ต": "📶",
  "เบี้ยประกัน": "🛡️", "ค่าอาหาร": "🍜", "ค่าเดินทาง": "🚌", "ช้อปปิ้ง": "🛍️", "ท่องเที่ยว/สังสรรค์": "🎉",
  "ของใช้ในบ้าน": "🧻", "ออมเงิน": "🌱", "ลงทุน DCA": "📈",
};
export const DEFAULT_INCOME_LABELS = ["เงินเดือน", "ฟรีแลนซ์", "โบนัส", "ปันผลหุ้น/DR", "ดอกเบี้ย", "ค่าเช่า"];
export const DEFAULT_EXPENSE_LABELS = ["ผ่อนบ้าน", "ผ่อนรถ", "ค่าเช่าที่พัก", "ค่าน้ำค่าไฟ", "ค่าอินเทอร์เน็ต", "เบี้ยประกัน", "ค่าอาหาร", "ค่าเดินทาง", "ช้อปปิ้ง", "ท่องเที่ยว/สังสรรค์", "ของใช้ในบ้าน", "ออมเงิน", "ลงทุน DCA"];

// keywords used to auto-detect fixed (recurring/committed) expenses — everything else defaults to variable
export const FIXED_KEYWORDS = ["ผ่อน", "ค่าเช่า", "โทรศัพท์", "อินเทอร์เน็ต", "เน็ตบ้าน", "เบี้ยประกัน", "ประกัน", "ค่าเทอม", "สมาชิก", "งวด", "หนี้"];

// keywords used to auto-detect saving/investment expenses — checked before FIXED_KEYWORDS
export const INVEST_KEYWORDS = ["ออม", "ลงทุน", "กองทุนรวม", "DCA", "RMF", "SSF", "ประกันสะสมทรัพย์", "บำนาญ"];

// keywords used to auto-detect passive income — everything else defaults to active
export const PASSIVE_KEYWORDS = ["ปันผล", "ดอกเบี้ย", "ค่าเช่า", "เช่า", "ลิขสิทธิ์", "royalty", "dividend", "แบ่งปันกำไร", "กำไรจากการขาย", "ค่าตอบแทนกองทุน"];

// keywords for Active income that's still one-off/irregular (bonuses,
// incentives, commissions) — excluded from the hourly-wage estimate so a
// single spike doesn't inflate it
export const IRREGULAR_INCOME_KEYWORDS = ["โบนัส", "bonus", "อินเซนทีฟ", "incentive", "คอมมิชชั่น", "commission"];
