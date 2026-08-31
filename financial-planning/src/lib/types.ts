// Data schema ported from docs/prototype/financial-planning-data-schema.md

export type LiquidType = "เงินสด" | "บัญชีออมทรัพย์" | "บัญชีกระแสรายวัน" | "กองทุนตลาดเงิน" | "อื่นๆ";

export interface LiquidAsset {
  id: string;
  type: LiquidType;
  name: string;
  current_value: number;
  goal_id: string | null;
}

export type InvestmentCategory =
  | "FixedIncome"
  | "Equity"
  | "MutualFund"
  | "RealEstate"
  | "Gold"
  | "Alternative";

export type LiquidityTier = "สูง" | "กลาง" | "ต่ำ";

export interface InvestmentAsset {
  id: string;
  category: InvestmentCategory;
  name: string;
  current_value: number;
  liquidity: LiquidityTier;
  goal_id: string | null;
}

export type PersonalItemType = "รถยนต์" | "บ้านอยู่เอง" | "ของสะสม" | "เครื่องประดับ" | "เฟอร์นิเจอร์" | "อื่นๆ";

export interface PersonalAsset {
  id: string;
  item_type: PersonalItemType;
  name: string;
  current_value: number;
  liability_id: string | null;
}

export type LiabilityTerm = "ShortTerm" | "LongTerm";

export interface Liability {
  id: string;
  term: LiabilityTerm;
  type: string;
  balance: number;
  rate: number;
  monthly: number;
}

export type GoalType = "เกษียณ" | "บ้าน" | "การศึกษา" | "ท่องเที่ยว" | "กองทุนฉุกเฉิน" | "อื่นๆ";
export type Priority = "สูง" | "กลาง" | "ต่ำ";

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  target: number;
  date: string;
  priority: Priority;
  expectedReturn?: number;
}

export type CashFlowType = "Income" | "Expense";
export type IncomeClass = "Active" | "Passive";
export type ExpenseClass = "Fixed" | "Variable" | "Invest";

export interface CashFlowEntry {
  id: string;
  type: CashFlowType;
  category: string;
  amount: number;
  date: string;
  incomeClass?: IncomeClass;
  expense_class?: ExpenseClass;
  payment_method_id?: string | null;
  owner?: string | null;
  recurringId?: string;
}

// A template for a recurring income/expense — the actual dated CashFlowEntry
// rows are generated from it (see lib/recurring.ts), not stored here.
export interface RecurringEntry {
  id: string;
  type: CashFlowType;
  category: string;
  amount: number;
  dayOfMonth: number;
  shiftWeekend: boolean;
  payment_method_id?: string | null;
  active: boolean;
  // "YYYY-MM" of the most recent month this rule has already accounted for
  // (an entry was generated for it, or it was deliberately skipped because
  // the day had already passed when the rule was created) — generation
  // resumes from the month after this one.
  lastGeneratedYearMonth: string;
}

export interface CategoryChip {
  id: string;
  entryType: CashFlowType;
  label: string;
  icon: string;
  order: number;
}

export type PaymentMethodKind = "เงินสด" | "บัตรเครดิต";

export interface PaymentMethod {
  id: string;
  name: string;
  kind: PaymentMethodKind;
}

export interface SettingEntry {
  key: string;
  value: unknown;
}

export interface Budget {
  category: string;
  amount: number;
}

export interface NetWorthSnapshot {
  date: string;
  totalLiquid: number;
  totalInvestment: number;
  totalPersonal: number;
  totalLiab: number;
}

export type PolicyType = "ชีวิต" | "สุขภาพ" | "อุบัติเหตุ" | "โรคร้ายแรง" | "คุ้มครองสินเชื่อ";

export interface InsurancePolicy {
  id: string;
  policyType: PolicyType;
  provider: string;
  sumAssured: number;
  annualPremium: number;
  expiryDate: string; // "" if not tracked
  beneficiarySet: boolean;
}
