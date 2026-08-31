import Dexie, { type EntityTable } from "dexie";
import { ICON_MAP, DEFAULT_INCOME_LABELS, DEFAULT_EXPENSE_LABELS } from "./constants";
import { classifyExpense, classifyIncome, isoDaysAgo, uid } from "./calc";
import type {
  LiquidAsset,
  InvestmentAsset,
  PersonalAsset,
  Liability,
  Goal,
  CashFlowEntry,
  CategoryChip,
  SettingEntry,
  PaymentMethod,
  Budget,
  NetWorthSnapshot,
  InsurancePolicy,
  RecurringEntry,
} from "./types";

export const CASH_METHOD_NAME = "เงินสด";

class FinancialPlanningDB extends Dexie {
  liquidAssets!: EntityTable<LiquidAsset, "id">;
  investmentAssets!: EntityTable<InvestmentAsset, "id">;
  personalAssets!: EntityTable<PersonalAsset, "id">;
  liabilities!: EntityTable<Liability, "id">;
  goals!: EntityTable<Goal, "id">;
  cashflow!: EntityTable<CashFlowEntry, "id">;
  categories!: EntityTable<CategoryChip, "id">;
  settings!: EntityTable<SettingEntry, "key">;
  paymentMethods!: EntityTable<PaymentMethod, "id">;
  budgets!: EntityTable<Budget, "category">;
  netWorthHistory!: EntityTable<NetWorthSnapshot, "date">;
  insurancePolicies!: EntityTable<InsurancePolicy, "id">;
  recurringEntries!: EntityTable<RecurringEntry, "id">;

  constructor() {
    super("financial-planning-db");
    this.version(1).stores({
      liquidAssets: "id, goal_id",
      investmentAssets: "id, goal_id, category",
      personalAssets: "id, liability_id",
      liabilities: "id, term",
      goals: "id",
      cashflow: "id, date, type",
      categories: "id, entryType, order",
      settings: "key",
    });

    // Fixed/Variable and Active/Passive are auto-classified from the
    // category text, so a keyword rule change (e.g. ค่าน้ำ/ค่าไฟ moving from
    // Fixed to Variable) should apply retroactively — re-derive both fields
    // for every existing entry rather than leaving old rows stuck with
    // whatever classifyExpense/classifyIncome returned at insert time.
    this.version(2)
      .stores({
        liquidAssets: "id, goal_id",
        investmentAssets: "id, goal_id, category",
        personalAssets: "id, liability_id",
        liabilities: "id, term",
        goals: "id",
        cashflow: "id, date, type",
        categories: "id, entryType, order",
        settings: "key",
      })
      .upgrade(async (tx) => {
        await tx
          .table<CashFlowEntry, string>("cashflow")
          .toCollection()
          .modify((entry) => {
            if (entry.type === "Expense") entry.expense_class = classifyExpense(entry.category);
            else entry.incomeClass = classifyIncome(entry.category);
          });
      });

    // Adds payment methods (cash + user-added credit cards) so expense
    // entries can record which one they were paid with. Existing databases
    // get a default "เงินสด" row here since seedIfEmpty() only runs once,
    // on a brand-new database.
    //
    // Version jumps from 2 to 100 (not 3): Turbopack's Fast Refresh can
    // re-run this constructor many times across a long dev session without
    // cleanly closing the previous connection, and some of those runs
    // silently bumped the browser's actual stored IndexedDB version well
    // past what this file ever declared (observed as high as 30). Dexie
    // can't open a database at a version *lower* than what's already
    // stored — it fails silently, so `paymentMethods` never got created
    // and every query against it threw "Cannot read properties of
    // undefined (reading 'toArray')". Jumping to 100 gives enough headroom
    // to always exceed that drift and land the missing store correctly.
    this.version(100)
      .stores({
        liquidAssets: "id, goal_id",
        investmentAssets: "id, goal_id, category",
        personalAssets: "id, liability_id",
        liabilities: "id, term",
        goals: "id",
        cashflow: "id, date, type",
        categories: "id, entryType, order",
        settings: "key",
        paymentMethods: "id, kind",
      })
      .upgrade(async (tx) => {
        await tx.table<PaymentMethod, string>("paymentMethods").add({ id: uid(), name: CASH_METHOD_NAME, kind: "เงินสด" });
      });

    // "DR" is no longer a separate investment category — it's folded into
    // "Equity" (หุ้น), so existing rows saved under "DR" are reclassified
    // rather than left to silently fall back to the wrong category.
    this.version(101)
      .stores({
        liquidAssets: "id, goal_id",
        investmentAssets: "id, goal_id, category",
        personalAssets: "id, liability_id",
        liabilities: "id, term",
        goals: "id",
        cashflow: "id, date, type",
        categories: "id, entryType, order",
        settings: "key",
        paymentMethods: "id, kind",
      })
      .upgrade(async (tx) => {
        await tx
          .table<InvestmentAsset, string>("investmentAssets")
          .toCollection()
          .modify((asset) => {
            if ((asset.category as string) === "DR") asset.category = "Equity";
          });
      });

    // Adds "ออมเงิน"/"ลงทุน DCA" expense category chips retroactively so
    // existing installs get them without a data reset (fresh installs get
    // them from DEFAULT_EXPENSE_LABELS via seedIfEmpty already).
    this.version(102)
      .stores({
        liquidAssets: "id, goal_id",
        investmentAssets: "id, goal_id, category",
        personalAssets: "id, liability_id",
        liabilities: "id, term",
        goals: "id",
        cashflow: "id, date, type",
        categories: "id, entryType, order",
        settings: "key",
        paymentMethods: "id, kind",
      })
      .upgrade(async (tx) => {
        const table = tx.table<CategoryChip, string>("categories");
        const existing = await table.where("entryType").equals("Expense").toArray();
        const existingLabels = new Set(existing.map((c) => c.label));
        const maxOrder = existing.reduce((m, c) => Math.max(m, c.order), -1);
        const toAdd: CategoryChip[] = ["ออมเงิน", "ลงทุน DCA"]
          .filter((label) => !existingLabels.has(label))
          .map((label, i) => ({ id: uid(), entryType: "Expense", label, icon: ICON_MAP[label] || "🏷️", order: maxOrder + 1 + i }));
        if (toAdd.length) await table.bulkAdd(toAdd);
      });

    // Per-category monthly spending budgets, set in Settings and shown as
    // progress bars in the cashflow/reports/dashboard views.
    this.version(103).stores({
      liquidAssets: "id, goal_id",
      investmentAssets: "id, goal_id, category",
      personalAssets: "id, liability_id",
      liabilities: "id, term",
      goals: "id",
      cashflow: "id, date, type",
      categories: "id, entryType, order",
      settings: "key",
      paymentMethods: "id, kind",
      budgets: "category",
    });

    // Daily net-worth snapshots (total liquid/investment/personal/liability),
    // recorded automatically whenever an asset or liability changes or the
    // app is opened on a new day. Powers the asset trend charts/table —
    // there's no way to backfill history from before this version, since
    // asset rows only ever stored their current value.
    this.version(104).stores({
      liquidAssets: "id, goal_id",
      investmentAssets: "id, goal_id, category",
      personalAssets: "id, liability_id",
      liabilities: "id, term",
      goals: "id",
      cashflow: "id, date, type",
      categories: "id, entryType, order",
      settings: "key",
      paymentMethods: "id, kind",
      budgets: "category",
      netWorthHistory: "date",
    });

    // Adds "ของใช้ในบ้าน" expense category chip retroactively so existing
    // installs get it without a data reset (fresh installs get it from
    // DEFAULT_EXPENSE_LABELS via seedIfEmpty already).
    this.version(105)
      .stores({
        liquidAssets: "id, goal_id",
        investmentAssets: "id, goal_id, category",
        personalAssets: "id, liability_id",
        liabilities: "id, term",
        goals: "id",
        cashflow: "id, date, type",
        categories: "id, entryType, order",
        settings: "key",
        paymentMethods: "id, kind",
        budgets: "category",
        netWorthHistory: "date",
      })
      .upgrade(async (tx) => {
        const table = tx.table<CategoryChip, string>("categories");
        const existing = await table.where("entryType").equals("Expense").toArray();
        if (existing.some((c) => c.label === "ของใช้ในบ้าน")) return;
        const maxOrder = existing.reduce((m, c) => Math.max(m, c.order), -1);
        await table.add({ id: uid(), entryType: "Expense", label: "ของใช้ในบ้าน", icon: ICON_MAP["ของใช้ในบ้าน"], order: maxOrder + 1 });
      });

    // Insurance policies for the risk-protection page (life/health/
    // accident/critical-illness/credit-life gap checks).
    this.version(106).stores({
      liquidAssets: "id, goal_id",
      investmentAssets: "id, goal_id, category",
      personalAssets: "id, liability_id",
      liabilities: "id, term",
      goals: "id",
      cashflow: "id, date, type",
      categories: "id, entryType, order",
      settings: "key",
      paymentMethods: "id, kind",
      budgets: "category",
      netWorthHistory: "date",
      insurancePolicies: "id, policyType",
    });

    // Recurring income/expense templates (e.g. salary, rent) that
    // auto-generate a real cashflow entry each month — see lib/recurring.ts.
    this.version(107).stores({
      liquidAssets: "id, goal_id",
      investmentAssets: "id, goal_id, category",
      personalAssets: "id, liability_id",
      liabilities: "id, term",
      goals: "id",
      cashflow: "id, date, type",
      categories: "id, entryType, order",
      settings: "key",
      paymentMethods: "id, kind",
      budgets: "category",
      netWorthHistory: "date",
      insurancePolicies: "id, policyType",
      recurringEntries: "id, type",
    });

    // INVEST_KEYWORDS gained "PVD"/"กองทุนสำรองเลี้ยงชีพ"/"Reinvestment" —
    // existing expense entries typed under those names were classified
    // before the rule existed, so re-derive expense_class for all of them
    // rather than leaving old rows stuck as "ทั่วไป" (General).
    this.version(108)
      .stores({
        liquidAssets: "id, goal_id",
        investmentAssets: "id, goal_id, category",
        personalAssets: "id, liability_id",
        liabilities: "id, term",
        goals: "id",
        cashflow: "id, date, type",
        categories: "id, entryType, order",
        settings: "key",
        paymentMethods: "id, kind",
        budgets: "category",
        netWorthHistory: "date",
        insurancePolicies: "id, policyType",
        recurringEntries: "id, type",
      })
      .upgrade(async (tx) => {
        await tx
          .table<CashFlowEntry, string>("cashflow")
          .where("type")
          .equals("Expense")
          .modify((entry) => {
            entry.expense_class = classifyExpense(entry.category);
          });
      });
  }
}

export const db = new FinancialPlanningDB();

const makeCat = (entryType: CategoryChip["entryType"], label: string, order: number): CategoryChip => ({
  id: uid(),
  entryType,
  label,
  icon: ICON_MAP[label] || "🏷️",
  order,
});

const mkExpense = (category: string, amount: number, daysAgo = 0): CashFlowEntry => ({
  id: uid(),
  type: "Expense",
  category,
  amount,
  date: isoDaysAgo(daysAgo),
  expense_class: classifyExpense(category),
});
const mkIncome = (category: string, amount: number, daysAgo = 0): CashFlowEntry => ({
  id: uid(),
  type: "Income",
  category,
  amount,
  date: isoDaysAgo(daysAgo),
  incomeClass: classifyIncome(category),
});

// Populates the database with sample data on first run only, so a fresh
// install isn't a blank slate. Guarded by a settings flag, re-checked
// *inside* the transaction: React Strict Mode (and multiple tabs) can call
// this concurrently, and Dexie serializes readwrite transactions that share
// a table, so the second caller re-reads "seeded" after the first commits
// and bails out instead of double-inserting everything.
export async function seedIfEmpty() {
  const g1 = uid();
  const g2 = uid();
  const g3 = uid();
  const l1 = uid();
  const l2 = uid();

  await db.transaction(
    "rw",
    [db.liquidAssets, db.investmentAssets, db.personalAssets, db.liabilities, db.goals, db.cashflow, db.categories, db.settings, db.paymentMethods],
    async () => {
      const seeded = await db.settings.get("seeded");
      if (seeded) return;

      await db.goals.bulkAdd([
        { id: g1, type: "ท่องเที่ยว", name: "ทริปญี่ปุ่น", target: 100000, date: "2027-03-01", priority: "กลาง" },
        { id: g2, type: "เกษียณ", name: "กองทุนเกษียณอายุ", target: 5000000, date: "2050-01-01", priority: "สูง" },
        { id: g3, type: "กองทุนฉุกเฉิน", name: "เงินสำรองฉุกเฉิน 6 เดือน", target: 250000, date: "2026-12-01", priority: "สูง" },
      ]);

      await db.liabilities.bulkAdd([
        { id: l1, term: "LongTerm", type: "สินเชื่อบ้าน", balance: 1500000, rate: 4.2, monthly: 12000 },
        { id: l2, term: "LongTerm", type: "สินเชื่อรถยนต์", balance: 220000, rate: 3.5, monthly: 8500 },
        { id: uid(), term: "ShortTerm", type: "บัตรเครดิต", balance: 15000, rate: 18, monthly: 3000 },
      ]);

      await db.investmentAssets.bulkAdd([
        { id: uid(), category: "Equity", name: "TSLA80X (DR)", current_value: 85000, liquidity: "กลาง", goal_id: g1 },
        { id: uid(), category: "MutualFund", name: "กองทุน SSF ตราสารทุน", current_value: 120000, liquidity: "สูง", goal_id: g2 },
        { id: uid(), category: "Equity", name: "หุ้นไทย - ธนาคาร", current_value: 60000, liquidity: "กลาง", goal_id: null },
        { id: uid(), category: "Gold", name: "ทองคำแท่ง 5 บาท", current_value: 175000, liquidity: "ต่ำ", goal_id: null },
        { id: uid(), category: "FixedIncome", name: "กองทุนตราสารหนี้ระยะสั้น", current_value: 90000, liquidity: "สูง", goal_id: g3 },
      ]);

      await db.liquidAssets.bulkAdd([
        { id: uid(), type: "บัญชีออมทรัพย์", name: "บัญชีออมทรัพย์สำรอง", current_value: 60000, goal_id: g3 },
        { id: uid(), type: "เงินสด", name: "เงินสดติดตัว/ที่บ้าน", current_value: 5000, goal_id: null },
      ]);

      await db.personalAssets.bulkAdd([
        { id: uid(), item_type: "รถยนต์", name: "รถยนต์ส่วนตัว", current_value: 450000, liability_id: l2 },
        { id: uid(), item_type: "บ้านอยู่เอง", name: "บ้านที่อยู่อาศัย", current_value: 2200000, liability_id: l1 },
      ]);

      await db.cashflow.bulkAdd([
        mkIncome("เงินเดือน", 55000, 3),
        mkIncome("ปันผลหุ้น/DR", 3200, 1),
        mkExpense("ผ่อนบ้าน", 12000, 5),
        mkExpense("ผ่อนรถ", 8500, 6),
        mkExpense("ค่าน้ำค่าไฟ", 2200, 4),
        mkExpense("ค่าอินเทอร์เน็ต", 590, 2),
        mkExpense("ค่าอาหาร", 9000, 1),
        mkExpense("ช้อปปิ้ง", 6500, 0),
      ]);

      await db.categories.bulkAdd([
        ...DEFAULT_INCOME_LABELS.map((label, i) => makeCat("Income", label, i)),
        ...DEFAULT_EXPENSE_LABELS.map((label, i) => makeCat("Expense", label, i)),
      ]);

      await db.paymentMethods.add({ id: uid(), name: CASH_METHOD_NAME, kind: "เงินสด" });

      await db.settings.bulkPut([
        { key: "seeded", value: true },
        { key: "cycleStartDay", value: 1 },
        { key: "shiftWeekend", value: false },
      ]);
    }
  );
}
