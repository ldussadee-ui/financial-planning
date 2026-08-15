import React, { useState, useMemo, useEffect, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  LayoutDashboard, Wallet, TrendingUp, CreditCard, Target,
  Plus, Trash2, Car, Sparkles, PiggyBank,
} from "lucide-react";

/* ---------------------------------- tokens --------------------------------- */
const FONT_LINK_ID = "fp-fonts";

const CATS = [
  { key: "FixedIncome", label: "ตราสารหนี้", color: "#B7E4C7", liquidity: "สูง" },
  { key: "Equity", label: "หุ้น", color: "#FFB5A7", liquidity: "กลาง" },
  { key: "MutualFund", label: "กองทุนรวม", color: "#A0CED9", liquidity: "สูง" },
  { key: "DR", label: "DR", color: "#FFD8A8", liquidity: "กลาง" },
  { key: "RealEstate", label: "อสังหาริมทรัพย์", color: "#C9B8FF", liquidity: "ต่ำ" },
  { key: "Gold", label: "ทองคำ", color: "#FFE29A", liquidity: "ต่ำ" },
  { key: "Alternative", label: "สินทรัพย์ทางเลือก", color: "#FFAFCC", liquidity: "กลาง" },
];
const catInfo = (key) => CATS.find((c) => c.key === key) || CATS[0];

const LIQUID_TYPES = ["เงินสด", "บัญชีออมทรัพย์", "บัญชีกระแสรายวัน", "กองทุนตลาดเงิน", "อื่นๆ"];
const LIQUID_COLOR = "#BFE3F0";

const PERSONAL_TYPES = ["รถยนต์", "บ้านอยู่เอง", "ของสะสม", "เครื่องประดับ", "เฟอร์นิเจอร์", "อื่นๆ"];
const GOAL_TYPES = ["เกษียณ", "บ้าน", "การศึกษา", "ท่องเที่ยว", "กองทุนฉุกเฉิน", "อื่นๆ"];

const ICON_MAP = {
  "เงินเดือน": "💼", "ฟรีแลนซ์": "💻", "โบนัส": "🎁", "ปันผลหุ้น/DR": "📈", "ดอกเบี้ย": "🏦", "ค่าเช่า": "🏠",
  "ผ่อนบ้าน": "🏠", "ผ่อนรถ": "🚗", "ค่าเช่าที่พัก": "🔑", "ค่าน้ำค่าไฟ": "💡", "ค่าอินเทอร์เน็ต": "📶",
  "เบี้ยประกัน": "🛡️", "ค่าอาหาร": "🍜", "ค่าเดินทาง": "🚌", "ช้อปปิ้ง": "🛍️", "ท่องเที่ยว/สังสรรค์": "🎉",
};
const DEFAULT_INCOME_LABELS = ["เงินเดือน", "ฟรีแลนซ์", "โบนัส", "ปันผลหุ้น/DR", "ดอกเบี้ย", "ค่าเช่า"];
const DEFAULT_EXPENSE_LABELS = ["ผ่อนบ้าน", "ผ่อนรถ", "ค่าเช่าที่พัก", "ค่าน้ำค่าไฟ", "ค่าอินเทอร์เน็ต", "เบี้ยประกัน", "ค่าอาหาร", "ค่าเดินทาง", "ช้อปปิ้ง", "ท่องเที่ยว/สังสรรค์"];
const makeCat = (label) => ({ id: uid(), label, icon: ICON_MAP[label] || "🏷️" });

// keywords used to auto-detect fixed (recurring/committed) expenses — everything else defaults to variable
const FIXED_KEYWORDS = ["ผ่อน", "ค่าเช่า", "ค่าน้ำ", "ค่าไฟ", "โทรศัพท์", "อินเทอร์เน็ต", "เน็ตบ้าน", "เบี้ยประกัน", "ประกัน", "ค่าเทอม", "สมาชิก", "งวด", "หนี้"];
const classifyExpense = (category) => {
  const t = (category || "").toLowerCase();
  return FIXED_KEYWORDS.some((k) => t.includes(k.toLowerCase())) ? "Fixed" : "Variable";
};

// keywords used to auto-detect passive income — everything else defaults to active
const PASSIVE_KEYWORDS = ["ปันผล", "ดอกเบี้ย", "ค่าเช่า", "เช่า", "ลิขสิทธิ์", "royalty", "dividend", "แบ่งปันกำไร", "กำไรจากการขาย", "ค่าตอบแทนกองทุน"];
const classifyIncome = (category) => {
  const t = (category || "").toLowerCase();
  return PASSIVE_KEYWORDS.some((k) => t.includes(k.toLowerCase())) ? "Passive" : "Active";
};

const fmt = (n) =>
  "฿" + Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });
const uid = () => Math.random().toString(36).slice(2, 10);

/* ------------------------------- date / cycle helpers ------------------------------ */
const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const isoToday = () => isoDate(new Date());
const isoDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); };
const fmtDateShort = (iso) => {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
function adjustForWeekend(date, shiftWeekend) {
  if (!shiftWeekend) return date;
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  if (day === 6) { const d = new Date(date); d.setDate(d.getDate() - 1); return d; }
  if (day === 0) { const d = new Date(date); d.setDate(d.getDate() - 2); return d; }
  return date;
}
function computeAdjustedStart(year, month, cycleStartDay, shiftWeekend) {
  return adjustForWeekend(new Date(year, month, cycleStartDay), shiftWeekend);
}
function getCycleRange(cycleStartDay, shiftWeekend, ref = new Date()) {
  const candidateStart = computeAdjustedStart(ref.getFullYear(), ref.getMonth(), cycleStartDay, shiftWeekend);
  let start = candidateStart;
  if (ref < candidateStart) {
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
    start = computeAdjustedStart(prevMonth.getFullYear(), prevMonth.getMonth(), cycleStartDay, shiftWeekend);
  }
  const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  const nextStart = computeAdjustedStart(nextMonth.getFullYear(), nextMonth.getMonth(), cycleStartDay, shiftWeekend);
  const end = new Date(nextStart);
  end.setDate(end.getDate() - 1);
  return { start, end };
}
function inRange(iso, range) {
  if (!iso) return true;
  const d = new Date(iso + "T00:00:00");
  return d >= range.start && d <= range.end;
}
function fmtRange(range) {
  const s = range.start.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  const e = range.end.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

/* --------------------------------- seed data -------------------------------- */
const seedInvestment = [
  { id: uid(), category: "DR", name: "TSLA80X (DR)", current_value: 85000, cost_basis: 70000, liquidity: "กลาง", goal_id: "g1" },
  { id: uid(), category: "MutualFund", name: "กองทุน SSF ตราสารทุน", current_value: 120000, cost_basis: 100000, liquidity: "สูง", goal_id: "g2" },
  { id: uid(), category: "Equity", name: "หุ้นไทย - ธนาคาร", current_value: 60000, cost_basis: 55000, liquidity: "กลาง", goal_id: "" },
  { id: uid(), category: "Gold", name: "ทองคำแท่ง 5 บาท", current_value: 175000, cost_basis: 150000, liquidity: "ต่ำ", goal_id: "" },
  { id: uid(), category: "FixedIncome", name: "กองทุนตราสารหนี้ระยะสั้น", current_value: 90000, cost_basis: 90000, liquidity: "สูง", goal_id: "g3" },
];
const seedLiquid = [
  { id: uid(), type: "บัญชีออมทรัพย์", name: "บัญชีออมทรัพย์สำรอง", current_value: 60000, goal_id: "g3" },
  { id: uid(), type: "เงินสด", name: "เงินสดติดตัว/ที่บ้าน", current_value: 5000, goal_id: "" },
];
const seedPersonal = [
  { id: uid(), item_type: "รถยนต์", name: "รถยนต์ส่วนตัว", current_value: 450000, liability_id: "l2" },
  { id: uid(), item_type: "บ้านอยู่เอง", name: "บ้านที่อยู่อาศัย", current_value: 2200000, liability_id: "l1" },
];
const seedLiabilities = [
  { id: "l1", term: "LongTerm", type: "สินเชื่อบ้าน", balance: 1500000, rate: 4.2, monthly: 12000, months: 180 },
  { id: "l2", term: "LongTerm", type: "สินเชื่อรถยนต์", balance: 220000, rate: 3.5, monthly: 8500, months: 30 },
  { id: "l3", term: "ShortTerm", type: "บัตรเครดิต", balance: 15000, rate: 18, monthly: 3000, months: 5 },
];
const seedGoals = [
  { id: "g1", type: "ท่องเที่ยว", name: "ทริปญี่ปุ่น", target: 100000, date: "2027-03-01", priority: "กลาง" },
  { id: "g2", type: "เกษียณ", name: "กองทุนเกษียณอายุ", target: 5000000, date: "2050-01-01", priority: "สูง" },
  { id: "g3", type: "กองทุนฉุกเฉิน", name: "เงินสำรองฉุกเฉิน 6 เดือน", target: 150000, date: "2026-12-01", priority: "สูง" },
];
const mkExpense = (category, amount, daysAgo = 0) => ({ id: uid(), type: "Expense", category, amount, date: isoDaysAgo(daysAgo), expense_class: classifyExpense(category) });
const mkIncome = (category, amount, daysAgo = 0) => ({ id: uid(), type: "Income", category, amount, date: isoDaysAgo(daysAgo), incomeClass: classifyIncome(category) });
const seedCashflow = [
  mkIncome("เงินเดือน", 55000, 3),
  mkIncome("ปันผลหุ้น/DR", 3200, 1),
  mkExpense("ผ่อนบ้าน", 12000, 5),
  mkExpense("ค่าน้ำค่าไฟ", 2200, 4),
  mkExpense("ค่าอินเทอร์เน็ต", 590, 2),
  mkExpense("ค่าอาหาร", 9000, 1),
  mkExpense("ช้อปปิ้ง", 6500, 0),
];

/* ---------------------------------- shell ----------------------------------- */
const NAV = [
  { key: "dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { key: "cashflow", label: "กระแสเงินสด", icon: Wallet },
  { key: "liquid", label: "สินทรัพย์สภาพคล่อง", icon: PiggyBank },
  { key: "investment", label: "สินทรัพย์เพื่อการลงทุน", icon: TrendingUp },
  { key: "personal", label: "สินทรัพย์ส่วนตัว", icon: Car },
  { key: "liability", label: "หนี้สิน", icon: CreditCard },
  { key: "goals", label: "เป้าหมาย", icon: Target },
];

export default function App() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  const [tab, setTab] = useState("dashboard");
  const [investment, setInvestment] = useState(seedInvestment);
  const [liquid, setLiquid] = useState(seedLiquid);
  const [personal, setPersonal] = useState(seedPersonal);
  const [liabilities, setLiabilities] = useState(seedLiabilities);
  const [goals, setGoals] = useState(seedGoals);
  const [cashflow, setCashflow] = useState(seedCashflow);
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [shiftWeekend, setShiftWeekend] = useState(false);
  const cycleRange = useMemo(() => getCycleRange(cycleStartDay, shiftWeekend), [cycleStartDay, shiftWeekend]);

  const metrics = useMemo(() => {
    const totalLiquid = liquid.reduce((s, a) => s + Number(a.current_value || 0), 0);
    const totalInvestment = investment.reduce((s, a) => s + Number(a.current_value || 0), 0);
    const totalPersonal = personal.reduce((s, a) => s + Number(a.current_value || 0), 0);
    const liabShort = liabilities.filter((l) => l.term === "ShortTerm").reduce((s, l) => s + Number(l.balance || 0), 0);
    const liabLong = liabilities.filter((l) => l.term === "LongTerm").reduce((s, l) => s + Number(l.balance || 0), 0);
    const totalLiab = liabShort + liabLong;
    const investableNetWorth = totalLiquid + totalInvestment - totalLiab;
    const totalNetWorth = totalLiquid + totalInvestment + totalPersonal - totalLiab;
    const investmentLiquidHigh = investment.filter((a) => a.liquidity === "สูง").reduce((s, a) => s + Number(a.current_value || 0), 0);
    const liquidHigh = totalLiquid + investmentLiquidHigh;
    const currentRatio = liabShort > 0 ? liquidHigh / liabShort : null;

    const cycleCF = cashflow.filter((c) => inRange(c.date, cycleRange));
    const incomeActive = cycleCF.filter((c) => c.type === "Income" && c.incomeClass === "Active").reduce((s, c) => s + Number(c.amount || 0), 0);
    const incomePassive = cycleCF.filter((c) => c.type === "Income" && c.incomeClass === "Passive").reduce((s, c) => s + Number(c.amount || 0), 0);
    const expenses = cycleCF.filter((c) => c.type === "Expense");
    const expenseFixed = expenses.filter((c) => c.expense_class === "Fixed").reduce((s, c) => s + Number(c.amount || 0), 0);
    const expenseVariable = expenses.filter((c) => c.expense_class !== "Fixed").reduce((s, c) => s + Number(c.amount || 0), 0);
    const expense = expenseFixed + expenseVariable;
    const passiveRatio = expense > 0 ? incomePassive / expense : null;
    const savings = incomeActive + incomePassive - expense;

    const byCat = CATS.map((c) => ({
      name: c.label,
      key: c.key,
      value: investment.filter((a) => a.category === c.key).reduce((s, a) => s + Number(a.current_value || 0), 0),
      color: c.color,
    })).filter((c) => c.value > 0);

    return {
      totalLiquid, totalInvestment, totalPersonal, liabShort, liabLong, totalLiab,
      investableNetWorth, totalNetWorth, liquidHigh, currentRatio,
      incomeActive, incomePassive, expense, expenseFixed, expenseVariable,
      passiveRatio, savings, byCat,
    };
  }, [investment, liquid, personal, liabilities, cashflow, cycleRange]);

  return (
    <div style={{ fontFamily: "'Sarabun', sans-serif", background: "var(--bg)", color: "var(--ink)", minHeight: "100%" }}>
      <style>{`
        :root {
          --bg: #FFF8F1; --panel: #FFFFFF; --ink: #4A4458; --ink-soft: #A79FB5;
          --pink: #FF9AA2; --teal: #7FD1C9; --lav: #B4A7F5; --peach: #FFD8A8; --mint: #B7E4C7;
          --line: #F2E9E1; --danger: #FF8C7A;
        }
        .fp-display { font-family: 'Prompt', sans-serif; }
        .fp-num { font-family: 'Prompt', sans-serif; font-variant-numeric: tabular-nums; }
        .fp-card { background: var(--panel); border-radius: 22px; box-shadow: 0 6px 20px rgba(180,150,180,0.10); }
        .fp-chip {
          background: linear-gradient(135deg, #FFE3EC, #E4E1FF); color: #8B6FB0;
          border-radius: 999px; font-family: 'Prompt', sans-serif; font-size: 12px; font-weight: 600;
          padding: 9px 16px; display: inline-flex; align-items: center; gap: 6px;
        }
        .fp-navbtn { transition: all .15s ease; border-radius: 16px; }
        .fp-row { border-radius: 16px; transition: background .15s ease; }
        .fp-row:hover { background: #FFF8F1; }
        input, select { font-family: 'Sarabun', sans-serif; }
        ::placeholder { color: #C9C1D6; }
        button { font-family: 'Sarabun', sans-serif; }
        @keyframes fp-wiggle { 0% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.6deg); } 100% { transform: rotate(-1.6deg); } }
        .fp-wiggle { animation: fp-wiggle 0.16s ease-in-out infinite; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100%" }}>
        {/* sidebar */}
        <div style={{ width: 236, background: "linear-gradient(180deg, #FFE8EF 0%, #EDE7FF 100%)", flexShrink: 0, padding: "24px 16px" }}>
          <div style={{ padding: "0 8px 24px 8px" }}>
            <div className="fp-display" style={{ fontSize: 21, fontWeight: 700, color: "#7A5C9E" }}>เงินทองของเรา 🌱</div>
            <div style={{ fontSize: 11.5, color: "#9C8FB5", marginTop: 3 }}>เพื่อนช่วยวางแผนการเงิน</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = tab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setTab(n.key)}
                  className="fp-navbtn"
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    border: "none", cursor: "pointer", textAlign: "left",
                    background: active ? "#FFFFFF" : "transparent",
                    color: active ? "#7A5C9E" : "#8B7FA0", fontSize: 13.5, fontWeight: active ? 600 : 400,
                    boxShadow: active ? "0 4px 12px rgba(180,150,180,0.18)" : "none",
                  }}
                >
                  <Icon size={16} strokeWidth={2} />
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* main */}
        <div style={{ flex: 1, padding: "32px 42px", maxWidth: 1000 }}>
          {tab === "dashboard" && <Dashboard metrics={metrics} goals={goals} investment={investment} liquid={liquid} cycleRange={cycleRange} />}
          {tab === "cashflow" && (
            <CashflowTab
              cashflow={cashflow} setCashflow={setCashflow} metrics={metrics}
              cycleStartDay={cycleStartDay} setCycleStartDay={setCycleStartDay}
              shiftWeekend={shiftWeekend} setShiftWeekend={setShiftWeekend}
              cycleRange={cycleRange}
            />
          )}
          {tab === "liquid" && <LiquidTab liquid={liquid} setLiquid={setLiquid} goals={goals} />}
          {tab === "investment" && <InvestmentTab investment={investment} setInvestment={setInvestment} goals={goals} />}
          {tab === "personal" && <PersonalTab personal={personal} setPersonal={setPersonal} liabilities={liabilities} />}
          {tab === "liability" && <LiabilityTab liabilities={liabilities} setLiabilities={setLiabilities} />}
          {tab === "goals" && <GoalsTab goals={goals} setGoals={setGoals} investment={investment} liquid={liquid} />}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- shared bits ------------------------------- */
function SectionHeader({ title, sub, chip }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
      <div>
        <div className="fp-display" style={{ fontSize: 26, fontWeight: 700, color: "#6B5490" }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 5 }}>{sub}</div>}
      </div>
      {chip && <div className="fp-chip"><Sparkles size={13} /> {chip}</div>}
    </div>
  );
}

function StatRow({ label, value, big }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0" }}>
      <span style={{ fontSize: big ? 14 : 13, color: "var(--ink-soft)" }}>{label}</span>
      <span className="fp-num" style={{ fontSize: big ? 18 : 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ padding: "28px 20px", fontSize: 13, color: "var(--ink-soft)" }}>{text} 🌤️</div>;
}

/* ---------------------------------- dashboard --------------------------------- */
function Dashboard({ metrics, goals, investment, liquid, cycleRange }) {
  return (
    <div>
      <SectionHeader title="ภาพรวมการเงิน ☺️" sub={`สรุปสถานะสินทรัพย์ หนี้สิน และกระแสเงินสด · รอบปัจจุบัน ${fmtRange(cycleRange)}`} chip="ทดลองใช้งาน" />

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18 }}>
        <div className="fp-card" style={{ padding: 26 }}>
          <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 8 }}>💗 มูลค่าสุทธิ</div>
          <StatRow label="สินทรัพย์สภาพคล่อง" value={fmt(metrics.totalLiquid)} />
          <StatRow label="สินทรัพย์เพื่อการลงทุน" value={fmt(metrics.totalInvestment)} />
          <StatRow label="สินทรัพย์ส่วนตัว (ไม่ก่อรายได้)" value={fmt(metrics.totalPersonal)} />
          <StatRow label="หนี้สินรวม" value={"− " + fmt(metrics.totalLiab)} />
          <div style={{ borderTop: "2px dashed var(--line)", marginTop: 8, paddingTop: 10 }}>
            <StatRow label="Net Worth รวมทั้งหมด" value={fmt(metrics.totalNetWorth)} big />
            <StatRow label="Investable Net Worth" value={fmt(metrics.investableNetWorth)} big />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 10 }}>
            * แบบย่อสำหรับต้นแบบ: Investable Net Worth = สินทรัพย์สภาพคล่อง + สินทรัพย์ลงทุน − หนี้สินรวม
          </div>
        </div>

        <div className="fp-card" style={{ padding: 26 }}>
          <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 8 }}>🥧 สัดส่วนสินทรัพย์เพื่อการลงทุน</div>
          {metrics.byCat.length ? (
            <div style={{ height: 190, display: "flex", alignItems: "center" }}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={metrics.byCat} dataKey="value" nameKey="name" innerRadius={40} outerRadius={72} paddingAngle={4} cornerRadius={6}>
                    {metrics.byCat.map((c) => <Cell key={c.key} fill={c.color} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, fontSize: 12.5 }}>
                {metrics.byCat.map((c) => (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 5, background: c.color, display: "inline-block" }} />
                    <span style={{ color: "var(--ink-soft)" }}>{c.name}</span>
                    <span className="fp-num" style={{ marginLeft: "auto", fontWeight: 600 }}>
                      {((c.value / metrics.totalInvestment) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyState text="ยังไม่มีสินทรัพย์เพื่อการลงทุน" />}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        <div className="fp-card" style={{ padding: 26 }}>
          <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 8 }}>🌿 รายรับ Passive</div>
          <div className="fp-display" style={{ fontSize: 32, fontWeight: 700, color: "#5FBDAE" }}>
            {metrics.passiveRatio === null ? "—" : (metrics.passiveRatio * 100).toFixed(1) + "%"}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3, marginBottom: 6 }}>ของรายจ่ายรวมในรอบนี้ มาจาก Passive Income</div>
          <StatRow label="รายได้ Active" value={fmt(metrics.incomeActive)} />
          <StatRow label="รายได้ Passive" value={fmt(metrics.incomePassive)} />
          <StatRow label="รายจ่ายประจำ (คงที่)" value={fmt(metrics.expenseFixed)} />
          <StatRow label="รายจ่ายผันแปร" value={fmt(metrics.expenseVariable)} />
          <StatRow label="เงินคงเหลือในรอบนี้" value={fmt(metrics.savings)} big />
        </div>

        <div className="fp-card" style={{ padding: 26 }}>
          <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 8 }}>☔ สภาพคล่องระยะสั้น</div>
          <div className="fp-display" style={{ fontSize: 32, fontWeight: 700, color: metrics.currentRatio === null ? "var(--ink-soft)" : metrics.currentRatio >= 1 ? "#5FBDAE" : "#FF8C7A" }}>
            {metrics.currentRatio === null ? "—" : metrics.currentRatio.toFixed(2) + "x"}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3, marginBottom: 6 }}>สินทรัพย์สภาพคล่องสูง ÷ หนี้สินระยะสั้น</div>
          <StatRow label="สินทรัพย์สภาพคล่องสูง" value={fmt(metrics.liquidHigh)} />
          <StatRow label="หนี้สินระยะสั้น" value={fmt(metrics.liabShort)} />
          <StatRow label="หนี้สินระยะยาว" value={fmt(metrics.liabLong)} />
        </div>
      </div>

      <div className="fp-card" style={{ padding: 26, marginTop: 18 }}>
        <div style={{ fontSize: 13, color: "#B08FD1", fontWeight: 600, marginBottom: 16 }}>🎯 ความคืบหน้าเป้าหมาย</div>
        {goals.length ? goals.map((g) => {
          const linked =
            investment.filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0) +
            liquid.filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0);
          const pct = Math.min(100, (linked / g.target) * 100);
          return (
            <div key={g.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>{g.name} <span style={{ color: "var(--ink-soft)", fontSize: 11.5 }}>({g.type})</span></span>
                <span className="fp-num">{fmt(linked)} / {fmt(g.target)}</span>
              </div>
              <div style={{ height: 10, background: "#FBF2FF", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #FFB5A7, #B4A7F5)", borderRadius: 999 }} />
              </div>
            </div>
          );
        }) : <EmptyState text="ยังไม่มีเป้าหมาย" />}
      </div>
    </div>
  );
}

/* --------------------------------- cash flow ---------------------------------- */
function CashflowTab({ cashflow, setCashflow, metrics, cycleStartDay, setCycleStartDay, shiftWeekend, setShiftWeekend, cycleRange }) {
  const [form, setForm] = useState({ type: "Income", category: "", amount: "", date: isoToday() });
  const [customMode, setCustomMode] = useState(false);
  const [saveShortcut, setSaveShortcut] = useState(true);
  const [incomeCats, setIncomeCats] = useState(() => DEFAULT_INCOME_LABELS.map(makeCat));
  const [expenseCats, setExpenseCats] = useState(() => DEFAULT_EXPENSE_LABELS.map(makeCat));
  const [editing, setEditing] = useState(false);

  const pressTimer = useRef(null);
  const longPressFired = useRef(false);
  const dragFrom = useRef(null);

  const preview = form.type === "Expense" ? classifyExpense(form.category) : classifyIncome(form.category);
  const cats = form.type === "Income" ? incomeCats : expenseCats;
  const setCats = form.type === "Income" ? setIncomeCats : setExpenseCats;

  const pickType = (type) => { setForm({ type, category: "", amount: form.amount, date: form.date }); setCustomMode(false); setEditing(false); };
  const pickCategory = (label) => { setCustomMode(false); setForm({ ...form, category: label }); };

  const startPress = () => {
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setEditing(true);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 550);
  };
  const cancelPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };
  const handleChipClick = (label) => {
    if (longPressFired.current) { longPressFired.current = false; return; }
    if (editing) return;
    pickCategory(label);
  };
  const removeCat = (id, label) => {
    setCats(cats.filter((c) => c.id !== id));
    if (form.category === label) setForm({ ...form, category: "" });
  };
  const onDragStart = (e, idx) => { dragFrom.current = idx; };
  const onDrop = (e, idx) => {
    e.preventDefault();
    const from = dragFrom.current;
    if (from === null || from === idx) return;
    const next = [...cats];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setCats(next);
    dragFrom.current = null;
  };

  const add = () => {
    if (!form.category || !form.amount) return;
    const entry = { id: uid(), type: form.type, category: form.category, amount: Number(form.amount), date: form.date || isoToday() };
    if (form.type === "Income") entry.incomeClass = classifyIncome(form.category);
    else entry.expense_class = classifyExpense(form.category);
    setCashflow([...cashflow, entry]);
    if (customMode && saveShortcut) {
      const exists = cats.some((c) => c.label === form.category);
      if (!exists) setCats([...cats, makeCat(form.category)]);
    }
    setForm({ ...form, category: "", amount: "" });
    setCustomMode(false);
  };
  const remove = (id) => setCashflow(cashflow.filter((c) => c.id !== id));

  const cycleCF = cashflow.filter((c) => inRange(c.date, cycleRange));
  const income = cycleCF.filter((c) => c.type === "Income");
  const fixedExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class === "Fixed");
  const varExp = cycleCF.filter((c) => c.type === "Expense" && c.expense_class !== "Fixed");

  return (
    <div>
      <SectionHeader title="กระแสเงินสด 💸" sub="รายรับแยก Active/Passive และรายจ่ายแยกประจำ/ผันแปรให้อัตโนมัติ" />

      <div className="fp-card" style={{ padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink-soft)" }}>
        <span>🗓️ รอบบัญชีปัจจุบัน: <b style={{ color: "var(--ink)" }}>{fmtRange(cycleRange)}</b></span>
        <DayPicker value={cycleStartDay} onChange={setCycleStartDay} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={shiftWeekend} onChange={(e) => setShiftWeekend(e.target.checked)} />
          ถ้าวันเริ่มตรงเสาร์-อาทิตย์ เลื่อนเป็นวันศุกร์ก่อนหน้า
        </label>
      </div>

      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ประเภท">
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => pickType("Income")} style={typeToggleStyle(form.type === "Income", "#7FD1C9")}>💰 รายรับ</button>
            <button type="button" onClick={() => pickType("Expense")} style={typeToggleStyle(form.type === "Expense", "#FF9AA2")}>🧾 รายจ่าย</button>
          </div>
        </Field>

        <Field label="หมวดหมู่" wide>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 480 }}>
            {cats.map((c, idx) => (
              <div
                key={c.id}
                className={editing ? "fp-wiggle" : ""}
                style={{ position: "relative", display: "inline-block" }}
                draggable={editing}
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, idx)}
              >
                <button
                  type="button"
                  onMouseDown={startPress} onMouseUp={cancelPress} onMouseLeave={cancelPress}
                  onTouchStart={startPress} onTouchEnd={cancelPress}
                  onClick={() => handleChipClick(c.label)}
                  style={chipStyle(!customMode && !editing && form.category === c.label)}
                >
                  <span style={{ marginRight: 5 }}>{c.icon}</span>{c.label}
                </button>
                {editing && (
                  <button type="button" onClick={() => removeCat(c.id, c.label)} title="ลบปุ่มนี้" style={chipDeleteBadge}>×</button>
                )}
              </div>
            ))}
            {!editing && (
              <button type="button" onClick={() => { setCustomMode(true); setForm({ ...form, category: "" }); setSaveShortcut(true); }} style={chipStyle(customMode)}>
                ✍️ พิมพ์เอง
              </button>
            )}
            {editing && (
              <button type="button" onClick={() => setEditing(false)} style={doneButtonStyle}>✓ เสร็จสิ้น</button>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 6 }}>
            {editing ? "ลากเพื่อจัดเรียงใหม่ · แตะ × เพื่อลบปุ่ม" : "กดค้างที่ปุ่มเพื่อจัดเรียงหรือลบ"}
          </div>
          {customMode && (
            <div style={{ marginTop: 8 }}>
              <input
                autoFocus
                style={{ ...inputStyle, width: "100%" }}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="พิมพ์หมวดหมู่ของคุณเอง"
              />
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={saveShortcut} onChange={(e) => setSaveShortcut(e.target.checked)} />
                บันทึกเป็นปุ่มลัดไว้ใช้ครั้งหน้า
              </label>
            </div>
          )}
        </Field>

        <Field label="จำนวน"><input type="number" style={inputStyle} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
        <Field label="วันที่"><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        {form.category && (
          <span style={badgeStyle(form.type, preview)}>{badgeLabel(form.type, preview)}</span>
        )}
        <AddButton onClick={add} />
      </div>

      <Group title={`รายรับ Active — ${fmt(metrics.incomeActive)}`} tint="#EFFBF6">
        {income.filter((c) => c.incomeClass === "Active").map((c) => <Row key={c.id} left={c.category} right={fmt(c.amount)} date={c.date} onDelete={() => remove(c.id)} />)}
      </Group>
      <Group title={`รายรับ Passive — ${fmt(metrics.incomePassive)}`} tint="#FFF8E8">
        {income.filter((c) => c.incomeClass === "Passive").map((c) => <Row key={c.id} left={c.category} right={fmt(c.amount)} date={c.date} onDelete={() => remove(c.id)} />)}
      </Group>
      <Group title={`🔒 รายจ่ายประจำ (คงที่) — ${fmt(metrics.expenseFixed)}`} tint="#EAF5FC">
        {fixedExp.map((c) => <Row key={c.id} left={c.category} right={fmt(c.amount)} date={c.date} onDelete={() => remove(c.id)} />)}
      </Group>
      <Group title={`🎈 รายจ่ายผันแปร — ${fmt(metrics.expenseVariable)}`} tint="#FFEFE6">
        {varExp.map((c) => <Row key={c.id} left={c.category} right={fmt(c.amount)} date={c.date} onDelete={() => remove(c.id)} />)}
      </Group>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>
        * แสดงเฉพาะรายการในรอบบัญชีปัจจุบันด้านบน · รายจ่ายแยกประจำ/ผันแปรจากคำในหมวดหมู่ รายรับแยก Active/Passive อัตโนมัติเช่นกัน
      </div>
    </div>
  );
}

function chipStyle(active) {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? "linear-gradient(135deg, #FFB5A7, #B4A7F5)" : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 500, cursor: "pointer",
  };
}
const chipDeleteBadge = {
  position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: 999,
  background: "#FF9AA2", color: "#fff", border: "2px solid #FFF8F1", fontSize: 11, lineHeight: "14px",
  textAlign: "center", padding: 0, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
};
const doneButtonStyle = {
  background: "linear-gradient(135deg, #7FD1C9, #B4A7F5)", color: "#fff", border: "none",
  borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
function typeToggleStyle(active, color) {
  return {
    border: active ? "none" : "1px solid var(--line)",
    background: active ? color : "#FFFCFA",
    color: active ? "#fff" : "var(--ink-soft)",
    borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", height: 36,
  };
}
function badgeLabel(type, cls) {
  if (type === "Expense") return cls === "Fixed" ? "🔒 ตรวจพบว่าเป็นรายจ่ายประจำ" : "🎈 ตรวจพบว่าเป็นรายจ่ายผันแปร";
  return cls === "Passive" ? "🌿 ตรวจพบว่าเป็นรายรับ Passive" : "💪 ตรวจพบว่าเป็นรายรับ Active";
}
function badgeStyle(type, cls) {
  const isSoft = (type === "Expense" && cls === "Fixed") || (type === "Income" && cls === "Passive");
  return {
    fontSize: 11.5, fontWeight: 600, padding: "6px 12px", borderRadius: 999, height: 20,
    background: isSoft ? "#DDEFFB" : "#FFE3D6",
    color: isSoft ? "#4E93B5" : "#D07A4E",
  };
}

/* --------------------------------- liquid assets -------------------------------- */
function LiquidTab({ liquid, setLiquid, goals }) {
  const [form, setForm] = useState({ type: "บัญชีออมทรัพย์", name: "", current_value: "", goal_id: "" });
  const add = () => {
    if (!form.name || !form.current_value) return;
    setLiquid([...liquid, { id: uid(), ...form, current_value: Number(form.current_value) }]);
    setForm({ ...form, name: "", current_value: "" });
  };
  const remove = (id) => setLiquid(liquid.filter((a) => a.id !== id));

  return (
    <div>
      <SectionHeader title="สินทรัพย์สภาพคล่อง 🐷" sub="เงินสด บัญชีออมทรัพย์ และเงินที่พร้อมใช้ได้ทันที — แยกจากสินทรัพย์เพื่อการลงทุน" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ประเภท">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
            {LIQUID_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="ชื่อรายการ"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น บัญชีออมทรัพย์สำรอง" /></Field>
        <Field label="จำนวนเงิน"><input type="number" style={inputStyle} value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} placeholder="0" /></Field>
        <Field label="ผูกเป้าหมาย">
          <select value={form.goal_id} onChange={(e) => setForm({ ...form, goal_id: e.target.value })} style={inputStyle}>
            <option value="">— ไม่ระบุ —</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        <AddButton onClick={add} />
      </div>
      <div className="fp-card" style={{ padding: 10 }}>
        {liquid.length ? liquid.map((a) => (
          <div key={a.id} className="fp-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: LIQUID_COLOR, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{a.type} {a.goal_id ? "· " + (goals.find((g) => g.id === a.goal_id)?.name || "") : ""}</div>
            </div>
            <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(a.current_value)}</span>
            <button onClick={() => remove(a.id)} style={deleteBtn}><Trash2 size={14} /></button>
          </div>
        )) : <EmptyState text="ยังไม่มีสินทรัพย์สภาพคล่อง" />}
      </div>
    </div>
  );
}

/* ------------------------------ investment assets ------------------------------ */
function InvestmentTab({ investment, setInvestment, goals }) {
  const [form, setForm] = useState({ category: "Equity", name: "", current_value: "", cost_basis: "", liquidity: "กลาง", goal_id: "" });
  const add = () => {
    if (!form.name || !form.current_value) return;
    setInvestment([...investment, { id: uid(), ...form, current_value: Number(form.current_value), cost_basis: Number(form.cost_basis || 0) }]);
    setForm({ ...form, name: "", current_value: "", cost_basis: "" });
  };
  const remove = (id) => setInvestment(investment.filter((a) => a.id !== id));

  return (
    <div>
      <SectionHeader title="สินทรัพย์เพื่อการลงทุน 📈" sub="กองทุนรวม หุ้น DR อสังหาริมทรัพย์ ทองคำ และสินทรัพย์ทางเลือก" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ประเภท">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, liquidity: catInfo(e.target.value).liquidity })} style={inputStyle}>
            {CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="ชื่อสินทรัพย์"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น TSLA80X" /></Field>
        <Field label="มูลค่าปัจจุบัน"><input type="number" style={inputStyle} value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} placeholder="0" /></Field>
        <Field label="ต้นทุน"><input type="number" style={inputStyle} value={form.cost_basis} onChange={(e) => setForm({ ...form, cost_basis: e.target.value })} placeholder="0" /></Field>
        <Field label="สภาพคล่อง">
          <select value={form.liquidity} onChange={(e) => setForm({ ...form, liquidity: e.target.value })} style={inputStyle}>
            <option>สูง</option><option>กลาง</option><option>ต่ำ</option>
          </select>
        </Field>
        <Field label="ผูกเป้าหมาย">
          <select value={form.goal_id} onChange={(e) => setForm({ ...form, goal_id: e.target.value })} style={inputStyle}>
            <option value="">— ไม่ระบุ —</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        <AddButton onClick={add} />
      </div>

      <div className="fp-card" style={{ padding: 10 }}>
        {investment.length ? investment.map((a) => (
          <div key={a.id} className="fp-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: catInfo(a.category).color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{catInfo(a.category).label} · สภาพคล่อง{a.liquidity} {a.goal_id ? "· " + (goals.find((g) => g.id === a.goal_id)?.name || "") : ""}</div>
            </div>
            <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(a.current_value)}</span>
            <button onClick={() => remove(a.id)} style={deleteBtn}><Trash2 size={14} /></button>
          </div>
        )) : <EmptyState text="ยังไม่มีสินทรัพย์เพื่อการลงทุน" />}
      </div>
    </div>
  );
}

/* -------------------------------- personal assets ------------------------------- */
function PersonalTab({ personal, setPersonal, liabilities }) {
  const [form, setForm] = useState({ item_type: "รถยนต์", name: "", current_value: "", liability_id: "" });
  const add = () => {
    if (!form.name || !form.current_value) return;
    setPersonal([...personal, { id: uid(), ...form, current_value: Number(form.current_value) }]);
    setForm({ ...form, name: "", current_value: "" });
  };
  const remove = (id) => setPersonal(personal.filter((a) => a.id !== id));

  return (
    <div>
      <SectionHeader title="สินทรัพย์ส่วนตัว 🚗" sub="ทรัพย์สินที่ใช้งาน ไม่ก่อให้เกิดรายได้ — นับใน Total Net Worth เท่านั้น" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ประเภท">
          <select value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })} style={inputStyle}>
            {PERSONAL_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="ชื่อ"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Honda City" /></Field>
        <Field label="มูลค่าปัจจุบัน"><input type="number" style={inputStyle} value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} placeholder="0" /></Field>
        <Field label="หนี้สินที่ผูกอยู่">
          <select value={form.liability_id} onChange={(e) => setForm({ ...form, liability_id: e.target.value })} style={inputStyle}>
            <option value="">— ไม่มี —</option>
            {liabilities.map((l) => <option key={l.id} value={l.id}>{l.type}</option>)}
          </select>
        </Field>
        <AddButton onClick={add} />
      </div>
      <div className="fp-card" style={{ padding: 10 }}>
        {personal.length ? personal.map((a) => (
          <div key={a.id} className="fp-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5 }}>{a.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{a.item_type}{a.liability_id ? " · ผูกกับ " + (liabilities.find((l) => l.id === a.liability_id)?.type || "") : ""}</div>
            </div>
            <span className="fp-num" style={{ fontSize: 14, fontWeight: 600 }}>{fmt(a.current_value)}</span>
            <button onClick={() => remove(a.id)} style={deleteBtn}><Trash2 size={14} /></button>
          </div>
        )) : <EmptyState text="ยังไม่มีสินทรัพย์ส่วนตัว" />}
      </div>
    </div>
  );
}

/* ----------------------------------- liabilities --------------------------------- */
function LiabilityTab({ liabilities, setLiabilities }) {
  const [form, setForm] = useState({ term: "LongTerm", type: "", balance: "", rate: "", monthly: "", months: "" });
  const add = () => {
    if (!form.type || !form.balance) return;
    setLiabilities([...liabilities, { id: uid(), ...form, balance: Number(form.balance), rate: Number(form.rate || 0), monthly: Number(form.monthly || 0), months: Number(form.months || 0) }]);
    setForm({ ...form, type: "", balance: "", rate: "", monthly: "", months: "" });
  };
  const remove = (id) => setLiabilities(liabilities.filter((l) => l.id !== id));
  const short = liabilities.filter((l) => l.term === "ShortTerm");
  const long = liabilities.filter((l) => l.term === "LongTerm");

  return (
    <div>
      <SectionHeader title="หนี้สิน 💳" sub="แยกหนี้สินระยะสั้น (≤ 1 ปี) และระยะยาว (> 1 ปี)" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ระยะ">
          <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} style={inputStyle}>
            <option value="ShortTerm">ระยะสั้น</option>
            <option value="LongTerm">ระยะยาว</option>
          </select>
        </Field>
        <Field label="ประเภทหนี้"><input style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="เช่น บัตรเครดิต" /></Field>
        <Field label="ยอดคงเหลือ"><input type="number" style={inputStyle} value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} placeholder="0" /></Field>
        <Field label="ดอกเบี้ย %/ปี"><input type="number" style={inputStyle} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="0" /></Field>
        <Field label="ค่างวด/เดือน"><input type="number" style={inputStyle} value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} placeholder="0" /></Field>
        <AddButton onClick={add} />
      </div>
      <Group title={`หนี้สินระยะสั้น — ${fmt(short.reduce((s, l) => s + l.balance, 0))}`} tint="#FFEFEA">
        {short.map((l) => <Row key={l.id} left={`${l.type} · ${l.rate}%/ปี`} right={fmt(l.balance)} onDelete={() => remove(l.id)} />)}
      </Group>
      <Group title={`หนี้สินระยะยาว — ${fmt(long.reduce((s, l) => s + l.balance, 0))}`} tint="#EFFBF6">
        {long.map((l) => <Row key={l.id} left={`${l.type} · ${l.rate}%/ปี`} right={fmt(l.balance)} onDelete={() => remove(l.id)} />)}
      </Group>
    </div>
  );
}

/* ------------------------------------- goals -------------------------------------- */
function GoalsTab({ goals, setGoals, investment, liquid }) {
  const [form, setForm] = useState({ type: "เกษียณ", name: "", target: "", date: "", priority: "กลาง" });
  const add = () => {
    if (!form.name || !form.target) return;
    setGoals([...goals, { id: uid(), ...form, target: Number(form.target) }]);
    setForm({ ...form, name: "", target: "", date: "" });
  };
  const remove = (id) => setGoals(goals.filter((g) => g.id !== id));

  return (
    <div>
      <SectionHeader title="เป้าหมายทางการเงิน 🎯" sub="ผูกเป้าหมายกับสินทรัพย์เพื่อการลงทุนในแท็บก่อนหน้า" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ประเภทเป้าหมาย">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>
            {GOAL_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="ชื่อเป้าหมาย"><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น กองทุนเกษียณ" /></Field>
        <Field label="เป้าหมาย (บาท)"><input type="number" style={inputStyle} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="0" /></Field>
        <Field label="วันที่เป้าหมาย"><input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="ความสำคัญ">
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
            <option>สูง</option><option>กลาง</option><option>ต่ำ</option>
          </select>
        </Field>
        <AddButton onClick={add} />
      </div>
      <div className="fp-card" style={{ padding: 10 }}>
        {goals.length ? goals.map((g) => {
          const linked =
            investment.filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0) +
            liquid.filter((a) => a.goal_id === g.id).reduce((s, a) => s + Number(a.current_value || 0), 0);
          const pct = Math.min(100, (linked / g.target) * 100);
          return (
            <div key={g.id} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5 }}>{g.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{g.type} · ความสำคัญ{g.priority} {g.date ? "· ครบกำหนด " + g.date : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="fp-num" style={{ fontSize: 13, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                  <button onClick={() => remove(g.id)} style={deleteBtn}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ height: 8, background: "#FBF2FF", borderRadius: 999, overflow: "hidden", marginTop: 9 }}>
                <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, #FFB5A7, #B4A7F5)", borderRadius: 999 }} />
              </div>
            </div>
          );
        }) : <EmptyState text="ยังไม่มีเป้าหมาย" />}
      </div>
    </div>
  );
}

function DayPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={dayPickerButtonStyle}>
        🗓️ เริ่มวันที่ {value}
      </button>
      {open && (
        <div style={dayPickerPopoverStyle}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8, fontWeight: 600 }}>เลือกวันเริ่มรอบบัญชี</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <button
                key={d} type="button"
                onClick={() => { onChange(d); setOpen(false); }}
                style={dayCellStyle(d === value)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
const dayPickerButtonStyle = {
  border: "1px solid var(--line)", background: "#FFFCFA", color: "var(--ink)",
  borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
const dayPickerPopoverStyle = {
  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30,
  background: "#fff", borderRadius: 18, boxShadow: "0 10px 30px rgba(180,150,180,0.25)",
  padding: 14, width: 220,
};
function dayCellStyle(active) {
  return {
    width: 26, height: 26, borderRadius: 8, border: "none", fontSize: 11.5, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: active ? "linear-gradient(135deg, #FFB5A7, #B4A7F5)" : "#FBF7F2",
    color: active ? "#fff" : "var(--ink-soft)", fontWeight: active ? 700 : 400,
  };
}

/* ---------------------------------- ui atoms ------------------------------------ */
const inputStyle = {
  border: "1px solid var(--line)", borderRadius: 12, padding: "8px 12px",
  fontSize: 13, background: "#FFFCFA", color: "var(--ink)", minWidth: 130,
};
const deleteBtn = { border: "none", background: "transparent", color: "var(--ink-soft)", cursor: "pointer", padding: 4, borderRadius: 8 };

function Field({ label, wide, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: wide ? 480 : undefined }}>
      <label style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}
function AddButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #FFB5A7, #B4A7F5)", color: "#fff",
      border: "none", borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", height: 36,
    }}>
      <Plus size={14} /> เพิ่ม
    </button>
  );
}
function Group({ title, tint, children }) {
  const items = React.Children.toArray(children);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12.5, color: "#8B7FA0", marginBottom: 7, fontWeight: 600 }}>{title}</div>
      <div className="fp-card" style={{ padding: 8, background: items.length ? tint : "#FAF6F1" }}>
        {items.length ? items : <EmptyState text="ยังไม่มีรายการ" />}
      </div>
    </div>
  );
}
function Row({ left, right, date, onDelete }) {
  return (
    <div className="fp-row" style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8 }}>
      <span style={{ fontSize: 13 }}>{left}</span>
      {date && <span style={{ fontSize: 10.5, color: "var(--ink-soft)", background: "#F5EFFF", padding: "2px 8px", borderRadius: 999 }}>{fmtDateShort(date)}</span>}
      <span style={{ flex: 1 }} />
      <span className="fp-num" style={{ fontSize: 13.5, fontWeight: 600 }}>{right}</span>
      <button onClick={onDelete} style={{ ...deleteBtn, marginLeft: 6 }}><Trash2 size={13} /></button>
    </div>
  );
}
