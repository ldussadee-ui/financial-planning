import type { Table } from "dexie";
import { classifyExpense, classifyIncome, uid } from "./calc";
import { ICON_MAP } from "./constants";
import type { Budget, CashFlowEntry, CashFlowType, CategoryChip, RecurringEntry } from "./types";

// The main categories every list, chart and budget is grouped by. Each one
// holds #sub-items: an entry carries at most one, so a category's sub-totals
// always add up to its total. Fixed / General / Savings is still derived
// from the main category's name (see FIXED_KEYWORDS and friends), so every
// entry in a category lands in the same group.
export interface MainCategory {
  type: CashFlowType;
  label: string;
  subs: string[];
}

export const CATEGORY_TREE: MainCategory[] = [
  { type: "Income", label: "รายได้จากงาน", subs: ["เงินเดือน", "ฟรีแลนซ์", "โบนัส"] },
  { type: "Income", label: "รายได้จากทรัพย์สิน", subs: ["ปันผลหุ้น/DR", "ค่าเช่า", "ดอกเบี้ย"] },
  { type: "Expense", label: "อาหาร", subs: ["มื้อหลัก", "ของกินเล่น"] },
  { type: "Expense", label: "บ้าน", subs: ["ของใช้ในบ้าน", "ทำความสะอาด+บำรุง", "ค่าส่งของ"] },
  { type: "Expense", label: "เดินทาง", subs: ["ค่าเดินทาง", "เกี่ยวกับรถ"] },
  { type: "Expense", label: "ท่องเที่ยว", subs: ["ที่พัก", "ค่าเดินทาง", "ค่ากิน", "ค่าเข้าชม"] },
  { type: "Expense", label: "สุขภาพ", subs: ["รักษาพยาบาล", "ยา", "สุขภาพ"] },
  { type: "Expense", label: "ดูแลตัวเองและช้อปปิ้ง", subs: ["เสื้อผ้า", "เครื่องสำอาง", "ทำผม", "สุขอนามัย", "ช้อปปิ้ง"] },
  { type: "Expense", label: "งานและการเรียนรู้", subs: ["ทำงาน", "หนังสือ"] },
  { type: "Expense", label: "งานอดิเรกและสัตว์เลี้ยง", subs: ["งานอดิเรก", "สัตว์เลี้ยง"] },
  { type: "Expense", label: "ทำบุญ", subs: ["ทำบุญ"] },
  { type: "Expense", label: "อื่นๆ", subs: ["ภาษี"] },
  { type: "Expense", label: "บิลรายเดือน", subs: ["ค่าโทรศัพท์", "ค่าน้ำค่าไฟ", "ค่าอินเทอร์เน็ต", "ChatGPT", "iCloud", "TrueVisions", "ค่าจ้างทำสวน"] },
  { type: "Expense", label: "ประกัน", subs: ["เบี้ยประกัน", "ประกันสังคม"] },
  { type: "Expense", label: "ครอบครัว", subs: ["ให้แม่"] },
  { type: "Expense", label: "ออมและลงทุน", subs: ["DCA", "PVD", "RMF", "Reinvestment", "ออมเงิน"] },
];

// Where each category used before v0.23.0 now lives. Keys go through
// cleanLabel() and are compared without case, so "Reinvestment " and
// "ืทำบุญ" (a stray vowel typed in front) still find their place.
const LEGACY: Record<CashFlowType, Record<string, [string, string | null]>> = {
  Income: {
    "เงินเดือน": ["รายได้จากงาน", "เงินเดือน"],
    "ฟรีแลนซ์": ["รายได้จากงาน", "ฟรีแลนซ์"],
    "โบนัส": ["รายได้จากงาน", "โบนัส"],
    "ปันผลหุ้น/dr": ["รายได้จากทรัพย์สิน", "ปันผลหุ้น/DR"],
    "ค่าเช่า": ["รายได้จากทรัพย์สิน", "ค่าเช่า"],
    "ดอกเบี้ย": ["รายได้จากทรัพย์สิน", "ดอกเบี้ย"],
  },
  Expense: {
    "ค่าอาหาร": ["อาหาร", "มื้อหลัก"],
    "ของกินเล่น": ["อาหาร", "ของกินเล่น"],
    "ของกินเล่น/เครื่องดื่ม": ["อาหาร", "ของกินเล่น"],
    "ของใช้ในบ้าน": ["บ้าน", "ของใช้ในบ้าน"],
    "ทำความสะอาด+บำรุง": ["บ้าน", "ทำความสะอาด+บำรุง"],
    "ค่าส่งของ": ["บ้าน", "ค่าส่งของ"],
    "ค่าเดินทาง": ["เดินทาง", "ค่าเดินทาง"],
    "เกี่ยวกับรถ": ["เดินทาง", "เกี่ยวกับรถ"],
    "ท่องเที่ยว/สังสรรค์": ["ท่องเที่ยว", null],
    "รักษาพยาบาล ตรวจสุขภาพ": ["สุขภาพ", "รักษาพยาบาล"],
    "ยา": ["สุขภาพ", "ยา"],
    "สุขภาพ": ["สุขภาพ", "สุขภาพ"],
    "เสื้อผ้า": ["ดูแลตัวเองและช้อปปิ้ง", "เสื้อผ้า"],
    "เครื่องสำอาง": ["ดูแลตัวเองและช้อปปิ้ง", "เครื่องสำอาง"],
    "เครื่องสำอางค์": ["ดูแลตัวเองและช้อปปิ้ง", "เครื่องสำอาง"],
    "ทำผม": ["ดูแลตัวเองและช้อปปิ้ง", "ทำผม"],
    "สุขอนามัย": ["ดูแลตัวเองและช้อปปิ้ง", "สุขอนามัย"],
    "ช้อปปิ้ง": ["ดูแลตัวเองและช้อปปิ้ง", "ช้อปปิ้ง"],
    "ทำงาน": ["งานและการเรียนรู้", "ทำงาน"],
    "หนังสือ": ["งานและการเรียนรู้", "หนังสือ"],
    "งานอดิเรก": ["งานอดิเรกและสัตว์เลี้ยง", "งานอดิเรก"],
    "สัตว์เลี้ยง": ["งานอดิเรกและสัตว์เลี้ยง", "สัตว์เลี้ยง"],
    "ทำบุญ": ["ทำบุญ", "ทำบุญ"],
    "ภาษี": ["อื่นๆ", "ภาษี"],
    "ค่าโทรศัพท์": ["บิลรายเดือน", "ค่าโทรศัพท์"],
    "ค่าน้ำค่าไฟ": ["บิลรายเดือน", "ค่าน้ำค่าไฟ"],
    "ค่าอินเทอร์เน็ต": ["บิลรายเดือน", "ค่าอินเทอร์เน็ต"],
    "ค่าจ้างทำสวน": ["บิลรายเดือน", "ค่าจ้างทำสวน"],
    "subscribe chatgpt": ["บิลรายเดือน", "ChatGPT"],
    "subscribe icloud": ["บิลรายเดือน", "iCloud"],
    "subscribe truevision": ["บิลรายเดือน", "TrueVisions"],
    "subscribe truevisions": ["บิลรายเดือน", "TrueVisions"],
    "เบี้ยประกัน": ["ประกัน", "เบี้ยประกัน"],
    "ประกันสังคม": ["ประกัน", "ประกันสังคม"],
    "ให้แม่": ["ครอบครัว", "ให้แม่"],
    "ลงทุน dca": ["ออมและลงทุน", "DCA"],
    "pvd": ["ออมและลงทุน", "PVD"],
    "rmf": ["ออมและลงทุน", "RMF"],
    "reinvestment": ["ออมและลงทุน", "Reinvestment"],
    "ออมเงิน": ["ออมและลงทุน", "ออมเงิน"],
  },
};

// Trims and collapses spaces, and drops Thai vowel or tone marks typed
// before any consonant — they can't start a word, so they're always a slip.
export function cleanLabel(label: string): string {
  return (label || "").replace(/\s+/g, " ").trim().replace(/^[ัิ-ฺ็-๎]+/, "");
}

export function mainCategory(type: CashFlowType, label: string): MainCategory | undefined {
  return CATEGORY_TREE.find((c) => c.type === type && c.label === label);
}

// Where an entry recorded under a pre-v0.23.0 category belongs now. A name
// the table doesn't know (a category someone made up themselves) stays a
// main category of its own, cleaned up, so nothing is hidden.
export function mapLegacyCategory(type: CashFlowType, label: string): { category: string; sub: string | null } {
  const clean = cleanLabel(label);
  const hit = LEGACY[type][clean.toLowerCase()];
  if (hit) return { category: hit[0], sub: hit[1] };
  const subscription = type === "Expense" ? /^subscribe\s+(.+)$/i.exec(clean) : null;
  if (subscription) return { category: "บิลรายเดือน", sub: subscription[1] };
  return { category: clean, sub: null };
}

// Puts an entry from before sub-items existed into its new place. Entries
// that already carry a `sub` key were written by v0.23.0 or later and are
// returned as they are.
export function upgradeEntry<T extends Pick<CashFlowEntry, "type" | "category" | "sub" | "incomeClass" | "expense_class">>(entry: T): T {
  if (entry.sub !== undefined) return entry;
  const { category, sub } = mapLegacyCategory(entry.type, entry.category);
  return entry.type === "Expense"
    ? { ...entry, category, sub, expense_class: classifyExpense(category) }
    : { ...entry, category, sub, incomeClass: classifyIncome(category) };
}

export function defaultCategoryChips(): CategoryChip[] {
  return (["Income", "Expense"] as const).flatMap((type) =>
    CATEGORY_TREE.filter((c) => c.type === type).map((c, i) => ({
      id: uid(), entryType: type, label: c.label, icon: ICON_MAP[c.label], order: i, subs: [...c.subs],
    }))
  );
}

interface CategoryTables {
  cashflow: Table<CashFlowEntry, string>;
  categories: Table<CategoryChip, string>;
  budgets: Table<Budget, string>;
  recurringEntries: Table<RecurringEntry, string>;
}

// Moves a database from the old one-level categories to main categories
// with #sub-items. Run once by the Dexie upgrade, and again after restoring
// a backup made before v0.23.0, so an old file can't bring the old list back.
export async function consolidateCategories(t: CategoryTables): Promise<void> {
  await t.cashflow.toCollection().modify((entry) => {
    Object.assign(entry, upgradeEntry(entry));
  });
  await t.recurringEntries.toCollection().modify((rule) => {
    if (rule.sub !== undefined) return;
    const { category, sub } = mapLegacyCategory(rule.type, rule.category);
    rule.category = category;
    rule.sub = sub;
  });

  // Budgets were per old category; a main category's budget is the sum of
  // the ones folded into it.
  const budgets = await t.budgets.toArray();
  const merged = new Map<string, number>();
  for (const b of budgets) {
    const { category } = mapLegacyCategory("Expense", b.category);
    merged.set(category, (merged.get(category) || 0) + Number(b.amount || 0));
  }
  await t.budgets.clear();
  await t.budgets.bulkPut(Array.from(merged, ([category, amount]) => ({ category, amount })));

  // Shortcut buttons: every main category, then any old button whose name
  // isn't in the table, kept as a main category of its own.
  const oldChips = await t.categories.toArray();
  const chips = defaultCategoryChips();
  for (const old of [...oldChips].sort((a, b) => a.order - b.order)) {
    if (old.subs) continue;
    const { category } = mapLegacyCategory(old.entryType, old.label);
    if (chips.some((c) => c.entryType === old.entryType && c.label === category)) continue;
    const order = chips.filter((c) => c.entryType === old.entryType).length;
    chips.push({ id: old.id, entryType: old.entryType, label: category, icon: old.icon, order, subs: [] });
  }
  await t.categories.clear();
  await t.categories.bulkAdd(chips);
}
