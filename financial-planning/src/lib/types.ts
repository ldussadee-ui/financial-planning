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
