"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Trash2, Pencil, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import {
  fmt, monthlySavingsNeeded, monthsUntilDate, recommendedMonthlySavings,
  retirementTargetAmount, uid,
} from "@/lib/calc";
import { GOAL_TYPES } from "@/lib/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, GOAL_TYPE_LABEL_EN, LEVEL_LABEL_EN, fillText, translateLabel } from "@/lib/i18n";
import {
  SectionHeader, EmptyState, Field, AddButton, Modal, SegmentedControl,
  cancelButtonStyle, inputStyle, deleteBtn,
} from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { Goal, GoalType, Priority } from "@/lib/types";

const RETIREMENT: GoalType = "เกษียณ";
// Assumptions offered in the comparison table. Deliberately spans "the pot
// stops growing" to "it clearly outpaces inflation", because that span is
// the point the table exists to make.
const COMPARE_RETURNS = [0, 2, 3, 4, 5];

const emptyForm = {
  type: RETIREMENT as GoalType, name: "", target: "", date: "", priority: "กลาง" as Priority,
  expectedReturn: "",
  // Inflation and the post-retirement return start equal, making the real
  // return zero — "save enough to cover N years of spending", which is both
  // easy to explain and a believable first number to be shown.
  monthlySpend: "", retireYears: "25", inflation: "3", postReturn: "3", manual: false,
};

// Bottom-aligned so the two inputs sit on one line even when one label
// wraps and the other doesn't — which "ผลตอบแทนหลังเกษียณ %/ปี" does at
// phone width, and which any label may do once translated.
const pairRowStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "flex-end" };

const helperBoxStyle: CSSProperties = {
  background: "#FAF4FF", border: "1px solid #ECE0F7", borderRadius: 14,
  padding: "12px 13px", display: "flex", flexDirection: "column", gap: 10,
};
const dividerStyle: CSSProperties = { borderTop: "1px dashed #E0D2EF", paddingTop: 10 };
const resultRowStyle: CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10,
};
const resultValueStyle: CSSProperties = {
  fontFamily: "var(--font-prompt), Prompt, sans-serif", fontVariantNumeric: "tabular-nums",
  fontWeight: 600, color: "var(--ink)", fontSize: 13, whiteSpace: "nowrap",
};
const subNoteStyle: CSSProperties = { fontSize: 10.5, color: "var(--ink-soft)", lineHeight: 1.4, marginTop: 1 };
const compareBarStyle: CSSProperties = {
  background: "#fff", border: "1px solid #D9C4EF", borderRadius: 12, padding: "9px 12px",
  display: "flex", flexDirection: "column", gap: 2, cursor: "pointer", width: "100%", textAlign: "left",
};
const compareGrid: CSSProperties = { display: "grid", gridTemplateColumns: "3.4rem 1fr 1fr", gap: 6, alignItems: "center" };

export function GoalsTab() {
  const { lang, t } = useLanguage();
  const goals = useLiveQuery(() => db.goals.toArray(), [], []);
  const investment = useLiveQuery(() => db.investmentAssets.toArray(), [], []);
  const liquid = useLiveQuery(() => db.liquidAssets.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const linkedFor = (goalId: string) =>
    (investment || []).filter((a) => a.goal_id === goalId).reduce((s, a) => s + Number(a.current_value || 0), 0) +
    (liquid || []).filter((a) => a.goal_id === goalId).reduce((s, a) => s + Number(a.current_value || 0), 0);

  const openNew = () => { setForm(emptyForm); setEditingId(null); setCompareOpen(false); setModalOpen(true); };
  const openEdit = (g: Goal) => {
    setForm({
      type: g.type, name: g.name, target: String(g.target), date: g.date, priority: g.priority,
      expectedReturn: g.expectedReturn ? String(g.expectedReturn) : "",
      monthlySpend: g.retireMonthlySpend ? String(g.retireMonthlySpend) : "",
      retireYears: g.retireYears ? String(g.retireYears) : emptyForm.retireYears,
      inflation: g.retireInflation != null ? String(g.retireInflation) : emptyForm.inflation,
      postReturn: g.retirePostReturn != null ? String(g.retirePostReturn) : emptyForm.postReturn,
      // A goal saved before the helper existed has a target that was typed
      // in by hand, so it opens in manual mode — otherwise the helper would
      // take over a number it never produced and overwrite it on save.
      manual: g.targetIsManual ?? g.retireMonthlySpend == null,
    });
    setEditingId(g.id);
    setCompareOpen(false);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const isRetirement = form.type === RETIREMENT;
  const useHelper = isRetirement && !form.manual;
  const monthsToTarget = monthsUntilDate(form.date);
  const editingLinked = editingId ? linkedFor(editingId) : 0;

  const plan = useMemo(
    () => retirementTargetAmount({
      monthlySpend: Number(form.monthlySpend) || 0,
      yearsUntilRetirement: Math.max(0, (monthsToTarget ?? 0) / 12),
      retirementYears: Number(form.retireYears) || 0,
      inflationRate: Number(form.inflation) || 0,
      postRetirementReturn: Number(form.postReturn) || 0,
    }),
    [form.monthlySpend, form.retireYears, form.inflation, form.postReturn, monthsToTarget],
  );

  const helperTarget = Math.round(plan.total);
  const targetToSave = useHelper ? helperTarget : Number(form.target) || 0;

  const submit = () => {
    if (!form.name || !targetToSave) return;
    void db.goals.put({
      id: editingId || uid(), type: form.type, name: form.name,
      target: targetToSave, date: form.date, priority: form.priority,
      expectedReturn: Number(form.expectedReturn || 0),
      // Only retirement goals carry assumptions; anything else would be
      // storing numbers no screen ever reads back.
      ...(isRetirement && {
        retireMonthlySpend: Number(form.monthlySpend) || 0,
        retireYears: Number(form.retireYears) || 0,
        retireInflation: Number(form.inflation) || 0,
        retirePostReturn: Number(form.postReturn) || 0,
        targetIsManual: form.manual,
      }),
    });
    closeModal();
  };
  const remove = (id: string) => void db.goals.delete(id);

  const shortBaht = (n: number) =>
    n >= 1e6 ? `฿${(n / 1e6).toFixed(1)}${t(TR.goals.retireMillionSuffix)}` : fmt(n);

  // Shares the currency symbol and the "million" unit across a range rather
  // than repeating both on each end ("฿14.1–26.2 ล้าน", not
  // "฿14.1 ล้าน–฿26.2 ล้าน").
  const shortBahtRange = (lo: number, hi: number) =>
    lo >= 1e6 && hi >= 1e6
      ? `฿${(lo / 1e6).toFixed(1)}–${(hi / 1e6).toFixed(1)}${t(TR.goals.retireMillionSuffix)}`
      : `${shortBaht(lo)}–${shortBaht(hi)}`;

  // One row per assumption, each carrying what the pot would need to hold
  // and what that works out to per month from here.
  const compareRows = useMemo(() => {
    const rates = COMPARE_RETURNS.includes(Number(form.postReturn))
      ? COMPARE_RETURNS
      : [...COMPARE_RETURNS, Number(form.postReturn) || 0].sort((a, b) => a - b);
    return rates.map((rate) => {
      const total = retirementTargetAmount({
        monthlySpend: Number(form.monthlySpend) || 0,
        yearsUntilRetirement: Math.max(0, (monthsToTarget ?? 0) / 12),
        retirementYears: Number(form.retireYears) || 0,
        inflationRate: Number(form.inflation) || 0,
        postRetirementReturn: rate,
      }).total;
      return {
        rate,
        total,
        monthly: monthlySavingsNeeded(
          Math.round(total), editingLinked, monthsToTarget, Number(form.expectedReturn) || 0,
        ),
      };
    });
  }, [form.monthlySpend, form.retireYears, form.inflation, form.postReturn, form.expectedReturn, monthsToTarget, editingLinked]);

  // Why the total came out where it did. The four cases read differently
  // enough that one generic sentence would be wrong in three of them.
  const totalExplanation = () => {
    const post = Number(form.postReturn) || 0;
    const inflation = Number(form.inflation) || 0;
    if (post === 0) return t(TR.goals.retireWhyNoReturn);
    if (Math.abs(post - inflation) < 1e-9) return fillText(t(TR.goals.retireWhyMatchesInflation), { years: form.retireYears });
    if (post > inflation) return fillText(t(TR.goals.retireWhyBeatsInflation), { rate: post });
    return fillText(t(TR.goals.retireWhyLosesToInflation), { rate: post });
  };

  return (
    <div>
      <SectionHeader title={t(TR.goals.title)} sub={t(TR.goals.subtitle)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.goals.editTitle) : t(TR.goals.addTitle)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {/* Both dropdowns classify the goal rather than measure it, so they
              pair as one row; everything below is a figure. */}
          <div style={pairRowStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Field label={t(TR.goals.goalType)}>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GoalType })} style={{ ...inputStyle, minWidth: 0, width: "100%" }}>
                  {GOAL_TYPES.map((gt) => <option key={gt} value={gt}>{translateLabel(gt, lang, GOAL_TYPE_LABEL_EN)}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Field label={t(TR.goals.priority)}>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })} style={{ ...inputStyle, minWidth: 0, width: "100%" }}>
                  <option value="สูง">{translateLabel("สูง", lang, LEVEL_LABEL_EN)}</option>
                  <option value="กลาง">{translateLabel("กลาง", lang, LEVEL_LABEL_EN)}</option>
                  <option value="ต่ำ">{translateLabel("ต่ำ", lang, LEVEL_LABEL_EN)}</option>
                </select>
              </Field>
            </div>
          </div>

          <Field label={t(TR.goals.goalName)}>
            <input style={{ ...inputStyle, width: "100%" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t(TR.goals.goalNamePlaceholder)} />
          </Field>

          {/* Above the target date because for a retirement goal the date is
              the helper's first input, and nothing should sit between them. */}
          <Field label={t(TR.goals.expectedReturn)}>
            <input type="number" style={{ ...inputStyle, width: "100%" }} value={form.expectedReturn} onChange={(e) => setForm({ ...form, expectedReturn: e.target.value })} placeholder="0" />
          </Field>

          <Field label={t(TR.goals.targetDate)}>
            <input type="date" style={{ ...inputStyle, width: "100%" }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>

          {/* The target amount and, for retirement goals, how it's arrived at.
              Other goal types keep just the field with no surrounding box. */}
          <div style={isRetirement ? helperBoxStyle : { display: "flex", flexDirection: "column", gap: 10 }}>
            {isRetirement && (
              <>
                <h3 style={{ fontFamily: "var(--font-prompt), Prompt, sans-serif", fontSize: 13, fontWeight: 600, color: "#6B4A8F", margin: 0 }}>
                  {t(TR.goals.retireHelperTitle)}
                </h3>
                <SegmentedControl
                  small
                  options={[
                    { value: "auto", label: t(TR.goals.retireModeAuto) },
                    { value: "manual", label: t(TR.goals.retireModeManual) },
                  ]}
                  value={form.manual ? "manual" : "auto"}
                  onChange={(v) => setForm({ ...form, manual: v === "manual" })}
                />
              </>
            )}

            {useHelper && (
              <>
                <div style={pairRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Field label={t(TR.goals.retireMonthlySpend)}>
                      <CalcInput value={form.monthlySpend} onChange={(v) => setForm({ ...form, monthlySpend: v })} placeholder="0" />
                    </Field>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Field label={t(TR.goals.retireYearsField)}>
                      <input type="number" style={{ ...inputStyle, minWidth: 0, width: "100%" }} value={form.retireYears} onChange={(e) => setForm({ ...form, retireYears: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <div style={pairRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Field label={t(TR.goals.retireInflation)}>
                      <input type="number" step="0.5" style={{ ...inputStyle, minWidth: 0, width: "100%" }} value={form.inflation} onChange={(e) => setForm({ ...form, inflation: e.target.value })} />
                    </Field>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Field label={t(TR.goals.retirePostReturn)}>
                      <input type="number" step="0.5" style={{ ...inputStyle, minWidth: 0, width: "100%" }} value={form.postReturn} onChange={(e) => setForm({ ...form, postReturn: e.target.value })} />
                    </Field>
                  </div>
                </div>

                {/* Each row states its own unit and where it came from, so no
                    figure on screen needs outside context to be read right. */}
                <div style={{ ...dividerStyle, display: "flex", flexDirection: "column", gap: 11 }}>
                  <div>
                    <div style={resultRowStyle}>
                      <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{t(TR.goals.retireFirstMonth)}</span>
                      <span style={resultValueStyle}>
                        {fmt(Math.round(plan.monthlyAtRetirement))}
                        <span style={{ fontSize: 10.5, fontWeight: 500, color: "var(--ink-soft)", marginLeft: 2 }}>{t(TR.goals.retirePerMonth)}</span>
                      </span>
                    </div>
                    <div style={subNoteStyle}>
                      {fillText(t(TR.goals.retireFirstMonthFrom), {
                        spend: fmt(Number(form.monthlySpend) || 0),
                        inflation: form.inflation,
                        years: Math.round(Math.max(0, (monthsToTarget ?? 0) / 12)),
                      })}
                    </div>
                  </div>

                  <div style={dividerStyle}>
                    <div style={resultRowStyle}>
                      <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 600 }}>
                        {fillText(t(TR.goals.retireTotalNeeded), { years: form.retireYears })}
                      </span>
                      <span style={{ ...resultValueStyle, fontSize: 16, color: "#6B4A8F" }}>{shortBaht(plan.total)}</span>
                    </div>
                    <div style={{ ...subNoteStyle, color: "#7D68A0" }}>{totalExplanation()}</div>
                  </div>
                </div>

                {/* Closed, this still shows the span of answers — a bare label
                    would give no reason to open it. */}
                <div style={dividerStyle}>
                  <button type="button" style={compareBarStyle} onClick={() => setCompareOpen((v) => !v)} aria-expanded={compareOpen}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: 600, color: "#6B4A8F" }}>
                      {t(TR.goals.retireCompare)}
                      <ChevronDown size={18} style={{ transform: compareOpen ? "rotate(180deg)" : undefined, transition: "transform 0.15s ease", flexShrink: 0 }} />
                    </span>
                    {!compareOpen && (
                      <span style={{ fontSize: 11, color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>
                        {fillText(t(TR.goals.retireCompareTeaser), {
                          lo: compareRows[0].rate,
                          hi: compareRows[compareRows.length - 1].rate,
                          range: shortBahtRange(
                            Math.min(...compareRows.map((r) => r.total)),
                            Math.max(...compareRows.map((r) => r.total)),
                          ),
                        })}
                      </span>
                    )}
                  </button>

                  {compareOpen && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginBottom: 5 }}>
                        {fillText(t(TR.goals.retireCompareNote), { linked: fmt(editingLinked) })}
                      </div>
                      <div style={{ ...compareGrid, fontSize: 9.5, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-soft)", padding: "0 7px 5px" }}>
                        <span>{t(TR.goals.retireCompareReturn)}</span>
                        <span style={{ textAlign: "right" }}>{t(TR.goals.retireCompareNeed)}</span>
                        <span style={{ textAlign: "right" }}>{t(TR.goals.retireComparePerMonth)}</span>
                      </div>
                      {compareRows.map((row) => {
                        const current = row.rate === (Number(form.postReturn) || 0);
                        return (
                          <button
                            key={row.rate}
                            type="button"
                            onClick={() => setForm({ ...form, postReturn: String(row.rate) })}
                            aria-current={current}
                            style={{
                              ...compareGrid, width: "100%", border: "none", padding: "6px 7px", borderRadius: 8,
                              cursor: "pointer", fontSize: 11.5, fontFamily: "inherit", textAlign: "left",
                              background: current ? "#EBDCFA" : "transparent",
                              color: current ? "#6B4A8F" : "var(--ink-soft)",
                            }}
                          >
                            <span>{row.rate}%</span>
                            <span style={{ ...resultValueStyle, fontSize: 11.5, textAlign: "right", color: current ? "#6B4A8F" : "var(--ink)" }}>{shortBaht(row.total)}</span>
                            <span style={{ ...resultValueStyle, fontSize: 11.5, textAlign: "right", color: current ? "#6B4A8F" : "var(--ink)" }}>{row.monthly === null ? "—" : fmt(Math.round(row.monthly))}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Worked out rather than typed, so it stops looking like a field
                at all and joins the figures above it on their right edge. */}
            {useHelper ? (
              <div style={dividerStyle}>
                <div style={resultRowStyle}>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{t(TR.goals.targetAmount)}</span>
                  <span style={{ ...resultValueStyle, fontSize: 15, color: "#6B4A8F" }}>{fmt(helperTarget)}</span>
                </div>
                <div style={{ ...subNoteStyle, color: "#6B4A8F" }}>{t(TR.goals.retireSavedNote)}</div>
              </div>
            ) : (
              <div style={isRetirement ? dividerStyle : undefined}>
                <Field label={t(TR.goals.targetAmount)}>
                  <CalcInput value={form.target} onChange={(v) => setForm({ ...form, target: v })} placeholder="0" />
                </Field>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      <div className="fp-card" style={{ padding: 10 }}>
        {goals && goals.length ? goals.map((g) => {
          const linked = linkedFor(g.id);
          const pct = Math.min(100, (linked / g.target) * 100);
          const monthlyNeeded = recommendedMonthlySavings(g, linked);
          return (
            <div key={g.id} style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => openEdit(g)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14 }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {translateLabel(g.type, lang, GOAL_TYPE_LABEL_EN)} · {t(TR.goals.priorityWord)}{translateLabel(g.priority, lang, LEVEL_LABEL_EN)} {g.date ? `${t(TR.goals.dueDate)} ${g.date}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="fp-num" style={{ fontSize: 12, color: "var(--ink-soft)" }}>{fmt(linked)} / {fmt(g.target)}</span>
                  <span className="fp-num" style={{ fontSize: 13, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                  <span style={{ color: "var(--ink-soft)" }} aria-hidden><Pencil size={12} /></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t(TR.goals.deleteConfirm))) remove(g.id);
                    }}
                    style={deleteBtn}
                    aria-label={t(TR.goals.deleteAria)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ height: 8, background: "#FBF2FF", borderRadius: 999, overflow: "hidden", marginTop: 9 }}>
                <div style={{ width: pct + "%", height: "100%", background: "#D4577E", borderRadius: 999 }} />
              </div>
              {monthlyNeeded !== null ? (
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
                  {t(TR.goals.recommendedSavings)} {fmt(monthlyNeeded)}{t(TR.goals.perMonthToMakeIt)}
                  {g.expectedReturn ? ` ${t(TR.goals.assumedReturn)} ${g.expectedReturn}${t(TR.goals.perYearEstimate)}` : ` ${t(TR.goals.noInvestmentReturn)}`}
                </div>
              ) : !g.date ? (
                <div style={{ fontSize: 12, color: "#D07A4E", marginTop: 6 }}>{t(TR.goals.setDateForAdvice)}</div>
              ) : (
                <div style={{ fontSize: 12, color: "#D07A4E", marginTop: 6 }}>{t(TR.goals.datePassedOrTooClose)}</div>
              )}
            </div>
          );
        }) : <EmptyState text={t(TR.goals.empty)} />}
      </div>

      <AddFab onClick={openNew} />
    </div>
  );
}
