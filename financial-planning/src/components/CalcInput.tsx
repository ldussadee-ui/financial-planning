"use client";

import { useState, type CSSProperties } from "react";
import { Modal, inputStyle } from "@/components/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { TR } from "@/lib/i18n";

type Op = "+" | "-" | "×" | "÷";

function apply(a: number, b: number, op: Op): number {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×") return a * b;
  return b === 0 ? a : a / b;
}
function clean(n: number): number {
  return isFinite(n) ? Math.round(n * 100) / 100 : 0;
}
function fmtNum(n: number): string {
  return n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

// Groups the integer part in thousands for display only — the raw string
// stays in state, so Number() keeps parsing it and the committed value is
// never separator-laden. Deliberately not toLocaleString(): that works on
// numbers and would discard what the user is midway through typing, turning
// "1234." back into "1,234" the instant they press the decimal point and
// dropping the trailing zero from "1.50". Everything after the first "." is
// passed through exactly as typed.
function withSeparators(raw: string): string {
  if (raw === "") return "";
  const negative = raw.startsWith("-");
  const [intPart, ...rest] = (negative ? raw.slice(1) : raw).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (negative ? "-" : "") + grouped + (rest.length ? "." + rest.join("") : "");
}

const keyStyle: CSSProperties = {
  border: "none", borderRadius: 14, padding: "16px 0", fontSize: 18, fontWeight: 600,
  cursor: "pointer", background: "#FFFCFA", color: "var(--ink)",
};
const opKeyStyle: CSSProperties = { ...keyStyle, background: "#F5EFFF", color: "#7A5C9E" };
const muteKeyStyle: CSSProperties = { ...keyStyle, background: "#FFEFE6", color: "#D07A4E" };
const eqKeyStyle: CSSProperties = { ...keyStyle, background: "#D4577E", color: "#fff" };
const confirmButtonStyle: CSSProperties = {
  width: "100%", marginTop: 12, border: "none", borderRadius: 14, padding: "13px 0",
  fontSize: 14.5, fontWeight: 700, cursor: "pointer", background: "#0F6E56", color: "#fff",
};

// Calculator keeps chained state like a physical calculator (not a text
// expression parser): pressing "=" folds the pending operation into the
// display but leaves the keypad open, so the user can keep computing;
// "ตกลง" folds any still-pending operation and commits the value.
function CalcKeypad({ initial, onConfirm }: { initial: string; onConfirm: (value: string) => void }) {
  const { t } = useLanguage();
  const startDisplay = initial !== "" && !isNaN(Number(initial)) ? initial : "0";
  const [display, setDisplay] = useState(startDisplay);
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op | null>(null);
  const [resetNext, setResetNext] = useState(false);

  const pressDigit = (d: string) => {
    if (resetNext) { setDisplay(d === "." ? "0." : d); setResetNext(false); return; }
    if (d === "." && display.includes(".")) return;
    setDisplay(display === "0" && d !== "." ? d : display + d);
  };
  const pressOp = (op: Op) => {
    const current = Number(display);
    if (accumulator === null) setAccumulator(current);
    else if (!resetNext) setAccumulator(clean(apply(accumulator, current, operator as Op)));
    setOperator(op);
    setResetNext(true);
  };
  const pressEquals = () => {
    if (operator === null) return;
    const result = clean(apply(accumulator ?? 0, Number(display), operator));
    setDisplay(String(result));
    setAccumulator(null);
    setOperator(null);
    setResetNext(true);
  };
  const pressClear = () => {
    setDisplay("0"); setAccumulator(null); setOperator(null); setResetNext(false);
  };
  const pressBackspace = () => {
    if (resetNext) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  };
  const confirm = () => {
    if (operator === null) { onConfirm(display); return; }
    onConfirm(String(clean(apply(accumulator ?? 0, Number(display), operator))));
  };

  return (
    <div>
      <div style={{ background: "#FBF7F2", borderRadius: 16, padding: "16px 18px", marginBottom: 12, textAlign: "right" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", height: 16 }}>
          {accumulator !== null && operator ? `${fmtNum(accumulator)} ${operator}` : " "}
        </div>
        <div className="fp-num" style={{ fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>{withSeparators(display)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <button type="button" onClick={pressClear} style={muteKeyStyle}>C</button>
        <button type="button" onClick={pressBackspace} style={muteKeyStyle}>⌫</button>
        <button type="button" onClick={() => pressOp("÷")} style={opKeyStyle}>÷</button>
        <button type="button" onClick={() => pressOp("×")} style={opKeyStyle}>×</button>

        <button type="button" onClick={() => pressDigit("7")} style={keyStyle}>7</button>
        <button type="button" onClick={() => pressDigit("8")} style={keyStyle}>8</button>
        <button type="button" onClick={() => pressDigit("9")} style={keyStyle}>9</button>
        <button type="button" onClick={() => pressOp("-")} style={opKeyStyle}>−</button>

        <button type="button" onClick={() => pressDigit("4")} style={keyStyle}>4</button>
        <button type="button" onClick={() => pressDigit("5")} style={keyStyle}>5</button>
        <button type="button" onClick={() => pressDigit("6")} style={keyStyle}>6</button>
        <button type="button" onClick={() => pressOp("+")} style={opKeyStyle}>+</button>

        <button type="button" onClick={() => pressDigit("1")} style={keyStyle}>1</button>
        <button type="button" onClick={() => pressDigit("2")} style={keyStyle}>2</button>
        <button type="button" onClick={() => pressDigit("3")} style={keyStyle}>3</button>
        <button type="button" onClick={pressEquals} style={eqKeyStyle}>=</button>

        <button type="button" onClick={() => pressDigit("0")} style={{ ...keyStyle, gridColumn: "span 3" }}>0</button>
        <button type="button" onClick={() => pressDigit(".")} style={keyStyle}>.</button>
      </div>
      <button type="button" onClick={confirm} style={confirmButtonStyle}>{t(TR.common.ok)}</button>
    </div>
  );
}

// Tapping opens a calculator popup instead of the native keyboard, so every
// money field in the app enters values the same way (and supports +, -, ×,
// ÷ before committing). This is a <button>, not a readonly <input> — mobile
// Safari/Chrome don't reliably deliver taps to readonly inputs (some
// versions treat them as non-interactive for touch, sometimes eating the
// first tap or not firing it at all), while a real button's tap handling is
// universally reliable.
export function CalcInput({
  value, onChange, placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...inputStyle, cursor: "pointer", textAlign: "left", color: value ? "var(--ink)" : "#c9c1d6" }}
      >
        {value ? withSeparators(value) : placeholder}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t(TR.common.calculatorTitle)}>
        <CalcKeypad initial={value} onConfirm={(v) => { onChange(v); setOpen(false); }} />
      </Modal>
    </>
  );
}
