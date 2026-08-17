import type { Metrics } from "@/hooks/useMetrics";

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

function ratio(
  key: string, name: string, formulaLabel: string, standardLabel: string, unit: RatioUnit,
  numerator: number, denominator: number, passTest: (v: number) => boolean
): FinancialRatio {
  if (denominator <= 0) return { key, name, formulaLabel, standardLabel, unit, value: null, status: "nodata" };
  const raw = numerator / denominator;
  const value = unit === "%" ? raw * 100 : raw;
  return { key, name, formulaLabel, standardLabel, unit, value, status: passTest(value) ? "pass" : "fail" };
}

// The standard set of 10 personal financial ratios (as taught in Thai CFP
// material), computed from data the app already tracks. "ค่าใช้จ่ายรวม"
// here excludes the Invest expense class on purpose — money being saved or
// invested isn't a living cost, and counting it would make aggressive
// savers look like they're barely surviving.
export function computeFinancialRatios(metrics: Metrics, debtServicePerMonth: number): FinancialRatio[] {
  const livingExpense = metrics.expenseFixed + metrics.expenseVariable;
  const totalIncome = metrics.incomeActive + metrics.incomePassive;
  const totalAssets = metrics.totalLiquid + metrics.totalInvestment + metrics.totalPersonal;
  const netWorth = metrics.totalNetWorth;

  return [
    ratio("survival", "อัตราส่วนความอยู่รอด", "รายได้ (Active + Passive) ÷ ค่าใช้จ่ายรวม", "≥ 1 เท่า", "x",
      totalIncome, livingExpense, (v) => v >= 1),
    ratio("passiveIncome", "Passive Income Ratio", "รายได้จากสินทรัพย์ ÷ ค่าใช้จ่ายรวม", "≥ 1 เท่า", "x",
      metrics.incomePassive, livingExpense, (v) => v >= 1),
    ratio("basicLiquidity", "อัตราส่วนสภาพคล่องพื้นฐาน", "สินทรัพย์สภาพคล่อง ÷ ค่าใช้จ่ายต่อเดือน", "3–6 เท่า", "x",
      metrics.totalLiquid, livingExpense, (v) => v >= 3 && v <= 6),
    ratio("liquidityToNetWorth", "สภาพคล่องต่อความมั่งคั่งสุทธิ", "สินทรัพย์สภาพคล่อง ÷ ความมั่งคั่งสุทธิ", "≥ 15%", "%",
      metrics.totalLiquid, netWorth, (v) => v >= 15),
    ratio("wealth", "อัตราส่วนความมั่งคั่ง", "ความมั่งคั่งสุทธิ ÷ สินทรัพย์รวม", "≥ 50%", "%",
      netWorth, totalAssets, (v) => v >= 50),
    ratio("debtToAsset", "หนี้สินต่อสินทรัพย์", "หนี้สินรวม ÷ สินทรัพย์รวม", "ไม่เกิน 50%", "%",
      metrics.totalLiab, totalAssets, (v) => v < 50),
    ratio("debtService", "การชำระหนี้สินจากรายได้", "ค่างวดหนี้สินต่อเดือน ÷ รายได้รวมต่อเดือน", "ไม่เกิน 35–45%", "%",
      debtServicePerMonth, totalIncome, (v) => v <= 45),
    ratio("savings", "อัตราส่วนการออม", "เงินออมต่อเดือน ÷ รายได้รวมต่อเดือน", "≥ 10%", "%",
      metrics.savings, totalIncome, (v) => v >= 10),
    ratio("investment", "อัตราส่วนการลงทุน", "สินทรัพย์เพื่อการลงทุน ÷ ความมั่งคั่งสุทธิ", "≥ 50%", "%",
      metrics.totalInvestment, netWorth, (v) => v >= 50),
    ratio("currentRatio", "อัตราส่วนสภาพคล่อง (ระยะสั้น)", "สินทรัพย์สภาพคล่อง ÷ หนี้สินระยะสั้น", "≥ 50%", "%",
      metrics.totalLiquid, metrics.liabShort, (v) => v >= 50),
  ];
}

// Short, actionable advice shown only under a failing ratio card. Basic
// liquidity is the one two-sided range (3–6x), so it needs to explain
// which direction the number missed by.
export function getRatioAdvice(r: FinancialRatio): string | null {
  if (r.status !== "fail" || r.value === null) return null;
  switch (r.key) {
    case "survival":
      return "รายได้ยังไม่พอค่าใช้จ่าย ลองหารายได้เพิ่มหรือลดค่าใช้จ่ายที่ไม่จำเป็น";
    case "passiveIncome":
      return "รายได้แบบ Passive ยังน้อย ลองสร้างสินทรัพย์ที่สร้างรายได้ เช่น เงินปันผล ดอกเบี้ย หรือค่าเช่า";
    case "basicLiquidity":
      return r.value < 3
        ? "เงินสำรองสภาพคล่องยังน้อยไป ควรมีสำรองให้พอใช้จ่าย 3–6 เดือน"
        : "มีเงินสดสำรองเยอะเกินความจำเป็น ลองนำส่วนเกินไปลงทุนเพื่อผลตอบแทนที่ดีขึ้น";
    case "liquidityToNetWorth":
      return "สัดส่วนเงินสด/เงินฝากต่อความมั่งคั่งสุทธิยังต่ำ ลองเพิ่มเงินสำรองสภาพคล่อง";
    case "wealth":
      return "หนี้สินยังสูงเทียบกับสินทรัพย์ที่มี ควรเร่งลดหนี้หรือเพิ่มสินทรัพย์";
    case "debtToAsset":
      return "สัดส่วนหนี้สินสูงเกินไป ควรวางแผนลดหนี้สินก่อนก่อหนี้เพิ่ม";
    case "debtService":
      return "ภาระผ่อนหนี้ต่อเดือนสูงเกินไปเทียบกับรายได้ เสี่ยงสภาพคล่องขาดมือ ควรลดหนี้หรือรีไฟแนนซ์";
    case "savings":
      return "ออมเงินต่อเดือนน้อยกว่ามาตรฐาน ลองเพิ่มสัดส่วนการออมอย่างน้อย 10% ของรายได้";
    case "investment":
      return "สินทรัพย์เพื่อการลงทุนยังน้อยเทียบกับความมั่งคั่งสุทธิ ลองจัดสรรเงินไปลงทุนเพิ่ม";
    case "currentRatio":
      return "สินทรัพย์สภาพคล่องไม่พอรองรับหนี้สินระยะสั้น ควรเพิ่มเงินสดสำรองหรือลดหนี้ระยะสั้น";
    default:
      return null;
  }
}
