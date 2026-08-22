import type { Metrics } from "@/hooks/useMetrics";
import type { Language } from "./i18n";

export type RatioStatus = "pass" | "fail" | "nodata";
export type RatioUnit = "x" | "%";

export interface FinancialRatio {
  key: string;
  name: string;
  formulaLabel: string;
  standardLabel: string;
  unit: RatioUnit;
  value: number | null;
  status: RatioStatus;
}

type Text = { th: string; en: string };
const pick = (t: Text, lang: Language) => (lang === "en" ? t.en : t.th);

function ratio(
  key: string, name: Text, formulaLabel: Text, standardLabel: Text, unit: RatioUnit,
  numerator: number, denominator: number, passTest: (v: number) => boolean, lang: Language
): FinancialRatio {
  const n = pick(name, lang);
  const f = pick(formulaLabel, lang);
  const s = pick(standardLabel, lang);
  if (denominator <= 0) return { key, name: n, formulaLabel: f, standardLabel: s, unit, value: null, status: "nodata" };
  const raw = numerator / denominator;
  const value = unit === "%" ? raw * 100 : raw;
  return { key, name: n, formulaLabel: f, standardLabel: s, unit, value, status: passTest(value) ? "pass" : "fail" };
}

// The standard set of 10 personal financial ratios (as taught in Thai CFP
// material), computed from data the app already tracks. "ค่าใช้จ่ายรวม"
// here excludes the Invest expense class on purpose — money being saved or
// invested isn't a living cost, and counting it would make aggressive
// savers look like they're barely surviving.
export function computeFinancialRatios(metrics: Metrics, debtServicePerMonth: number, lang: Language = "th"): FinancialRatio[] {
  const livingExpense = metrics.expenseFixed + metrics.expenseVariable;
  const totalIncome = metrics.incomeActive + metrics.incomePassive;
  const totalAssets = metrics.totalLiquid + metrics.totalInvestment + metrics.totalPersonal;
  const netWorth = metrics.totalNetWorth;

  return [
    ratio("survival",
      { th: "อัตราส่วนความอยู่รอด", en: "Survival Ratio" },
      { th: "รายได้ (Active + Passive) ÷ ค่าใช้จ่ายรวม", en: "Income (Active + Passive) ÷ Total Expenses" },
      { th: "≥ 1 เท่า", en: "≥ 1x" }, "x",
      totalIncome, livingExpense, (v) => v >= 1, lang),
    ratio("passiveIncome",
      { th: "Passive Income Ratio", en: "Passive Income Ratio" },
      { th: "รายได้จากสินทรัพย์ ÷ ค่าใช้จ่ายรวม", en: "Passive Income ÷ Total Expenses" },
      { th: "≥ 1 เท่า", en: "≥ 1x" }, "x",
      metrics.incomePassive, livingExpense, (v) => v >= 1, lang),
    ratio("basicLiquidity",
      { th: "อัตราส่วนสภาพคล่องพื้นฐาน", en: "Basic Liquidity Ratio" },
      { th: "สินทรัพย์สภาพคล่อง ÷ ค่าใช้จ่ายต่อเดือน", en: "Liquid Assets ÷ Monthly Expenses" },
      { th: "≥ 3 เท่า (แนะนำ 3–6 เท่า)", en: "≥ 3x (recommended 3–6x)" }, "x",
      metrics.totalLiquid, livingExpense, (v) => v >= 3, lang),
    ratio("liquidityToNetWorth",
      { th: "สภาพคล่องต่อความมั่งคั่งสุทธิ", en: "Liquidity to Net Worth" },
      { th: "สินทรัพย์สภาพคล่อง ÷ ความมั่งคั่งสุทธิ", en: "Liquid Assets ÷ Net Worth" },
      { th: "≥ 15%", en: "≥ 15%" }, "%",
      metrics.totalLiquid, netWorth, (v) => v >= 15, lang),
    ratio("wealth",
      { th: "อัตราส่วนความมั่งคั่ง", en: "Wealth Ratio" },
      { th: "ความมั่งคั่งสุทธิ ÷ สินทรัพย์รวม", en: "Net Worth ÷ Total Assets" },
      { th: "≥ 50%", en: "≥ 50%" }, "%",
      netWorth, totalAssets, (v) => v >= 50, lang),
    ratio("debtToAsset",
      { th: "หนี้สินต่อสินทรัพย์", en: "Debt to Asset" },
      { th: "หนี้สินรวม ÷ สินทรัพย์รวม", en: "Total Liabilities ÷ Total Assets" },
      { th: "ไม่เกิน 50%", en: "≤ 50%" }, "%",
      metrics.totalLiab, totalAssets, (v) => v < 50, lang),
    ratio("debtService",
      { th: "การชำระหนี้สินจากรายได้", en: "Debt Service Ratio" },
      { th: "ค่างวดหนี้สินต่อเดือน ÷ รายได้รวมต่อเดือน", en: "Monthly Debt Payments ÷ Monthly Income" },
      { th: "ไม่เกิน 35–45%", en: "≤ 35–45%" }, "%",
      debtServicePerMonth, totalIncome, (v) => v <= 45, lang),
    ratio("savings",
      { th: "อัตราส่วนการออม", en: "Savings Ratio" },
      { th: "เงินออมต่อเดือน ÷ รายได้รวมต่อเดือน", en: "Monthly Savings ÷ Monthly Income" },
      { th: "≥ 10%", en: "≥ 10%" }, "%",
      metrics.savings, totalIncome, (v) => v >= 10, lang),
    ratio("investment",
      { th: "อัตราส่วนการลงทุน", en: "Investment Ratio" },
      { th: "สินทรัพย์เพื่อการลงทุน ÷ ความมั่งคั่งสุทธิ", en: "Investment Assets ÷ Net Worth" },
      { th: "≥ 50%", en: "≥ 50%" }, "%",
      metrics.totalInvestment, netWorth, (v) => v >= 50, lang),
    ratio("currentRatio",
      { th: "อัตราส่วนสภาพคล่อง (ระยะสั้น)", en: "Current Ratio (Short-term)" },
      { th: "สินทรัพย์สภาพคล่อง ÷ หนี้สินระยะสั้น", en: "Liquid Assets ÷ Short-term Liabilities" },
      { th: "≥ 50%", en: "≥ 50%" }, "%",
      metrics.totalLiquid, metrics.liabShort, (v) => v >= 50, lang),
  ];
}

const ADVICE: Record<string, Text> = {
  survival: { th: "รายได้ยังไม่พอค่าใช้จ่าย ลองหารายได้เพิ่มหรือลดค่าใช้จ่ายที่ไม่จำเป็น", en: "Income doesn't cover expenses yet — try increasing income or cutting unnecessary spending" },
  passiveIncome: { th: "รายได้แบบ Passive ยังน้อย ลองสร้างสินทรัพย์ที่สร้างรายได้ เช่น เงินปันผล ดอกเบี้ย หรือค่าเช่า", en: "Passive income is still low — try building income-generating assets like dividends, interest, or rental income" },
  basicLiquidity: { th: "เงินสำรองสภาพคล่องยังน้อยไป ควรมีสำรองให้พอใช้จ่าย 3–6 เดือน", en: "Liquid reserves are too low — aim for enough to cover 3–6 months of expenses" },
  liquidityToNetWorth: { th: "สัดส่วนเงินสด/เงินฝากต่อความมั่งคั่งสุทธิยังต่ำ ลองเพิ่มเงินสำรองสภาพคล่อง", en: "Cash/deposits relative to net worth is still low — try building up liquid reserves" },
  wealth: { th: "หนี้สินยังสูงเทียบกับสินทรัพย์ที่มี ควรเร่งลดหนี้หรือเพิ่มสินทรัพย์", en: "Liabilities are still high relative to assets — focus on paying down debt or growing assets" },
  debtToAsset: { th: "สัดส่วนหนี้สินสูงเกินไป ควรวางแผนลดหนี้สินก่อนก่อหนี้เพิ่ม", en: "Debt-to-asset ratio is too high — plan to reduce debt before taking on more" },
  debtService: { th: "ภาระผ่อนหนี้ต่อเดือนสูงเกินไปเทียบกับรายได้ เสี่ยงสภาพคล่องขาดมือ ควรลดหนี้หรือรีไฟแนนซ์", en: "Monthly debt payments are too high relative to income, risking a cash crunch — consider reducing debt or refinancing" },
  savings: { th: "ออมเงินต่อเดือนน้อยกว่ามาตรฐาน ลองเพิ่มสัดส่วนการออมอย่างน้อย 10% ของรายได้", en: "Monthly savings are below the standard — try saving at least 10% of income" },
  investment: { th: "สินทรัพย์เพื่อการลงทุนยังน้อยเทียบกับความมั่งคั่งสุทธิ ลองจัดสรรเงินไปลงทุนเพิ่ม", en: "Investment assets are still low relative to net worth — try allocating more toward investing" },
  currentRatio: { th: "สินทรัพย์สภาพคล่องไม่พอรองรับหนี้สินระยะสั้น ควรเพิ่มเงินสดสำรองหรือลดหนี้ระยะสั้น", en: "Liquid assets aren't enough to cover short-term liabilities — build up cash reserves or reduce short-term debt" },
};

// Short, actionable advice shown only under a failing ratio card.
// Basic liquidity only fails on the low side (< 3x) — it no longer flags
// "too much" cash as a failure, since that signal is already covered by
// the investment ratio, and treating both as hard failures at once could
// make this ratio and liquidityToNetWorth read as contradicting each
// other (plenty of liquidity relative to a still-small net worth doesn't
// mean too much relative to spending, and vice versa).
export function getRatioAdvice(r: FinancialRatio, lang: Language = "th"): string | null {
  if (r.status !== "fail" || r.value === null) return null;
  const t = ADVICE[r.key];
  return t ? pick(t, lang) : null;
}
