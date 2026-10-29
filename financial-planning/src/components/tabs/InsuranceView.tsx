"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { POLICY_TYPES, PROPERTY_KINDS } from "@/lib/constants";
import { useInsuranceAnalysis } from "@/hooks/useInsuranceAnalysis";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, POLICY_TYPE_LABEL_EN, PROPERTY_KIND_LABEL_EN, translateLabel, fillText } from "@/lib/i18n";
import {
  SectionHeader, EmptyState, Field, AddButton, Modal, Row, SegmentedControl,
  cancelButtonStyle, formColumnStyle, formActionsStyle, formPairStyle, formPairCellStyle, fullInputStyle,
} from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import { yearlyPremium, type InsuranceCheck, type InsuranceCheckStatus, type LoanCoverage } from "@/lib/insuranceAnalysis";
import type { InsurancePolicy, Liability, PolicyType, PremiumMode, PropertyKind } from "@/lib/types";
import { IconLabel, PopIcon } from "@/components/icons";

const emptyForm = {
  policyType: "ชีวิต" as PolicyType, provider: "", sumAssured: "", annualPremium: "", expiryDate: "", beneficiarySet: false,
  premiumMode: "annual" as PremiumMode, coverageYears: "",
  liabilityIds: [] as string[], earmarkOn: false, debtEarmark: "",
  propertyKind: "อัคคีภัย" as PropertyKind, personalAssetId: "",
};

type Translate = <K extends { th: string; en: string }>(entry: K) => string;

function LoanCoverageRow({ c, t }: { c: LoanCoverage; t: Translate }) {
  const full = c.shortfall <= 0.5;
  const none = c.covered <= 0;
  const pct = c.liability.balance > 0 ? Math.min(100, (c.covered / c.liability.balance) * 100) : 100;
  const badge = full ? t(TR.insurance.loanFull) : none ? t(TR.insurance.loanNone) : fillText(t(TR.insurance.loanShort), { amount: fmt(c.shortfall) });
  const who = c.policies.map((p) => {
    const notes = [(p.liabilityIds || []).length > 1 ? t(TR.insurance.sharedSplit) : "", p.policyType === "ชีวิต" ? t(TR.insurance.heirPays) : ""].filter(Boolean);
    return notes.length ? `${p.provider} (${notes.join(", ")})` : p.provider;
  }).join(", ");
  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0 }}>{c.liability.type}</span>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap", ...(full ? { color: "#0F6E56", background: "#E1F5EE" } : { color: "#A32D2D", background: "#FCEBEB" }) }}>
          {full ? <IconLabel name="pass" size="glyph">{badge}</IconLabel> : badge}
        </span>
      </div>
      <div style={{ height: 8, background: "var(--track)", borderRadius: 99, overflow: "hidden", border: "1.5px solid var(--border)" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: full ? "var(--teal)" : "var(--pink)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: "var(--ink-soft)" }}>
        <span style={{ minWidth: 0 }}>{who || "—"}</span>
        <span className="fp-num" style={{ color: "var(--ink)", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(c.covered)} / {fmt(c.liability.balance)}</span>
      </div>
    </div>
  );
}

// A list of tick boxes rather than a <select multiple>, which phones render
// as an awkward picker. Not wrapped in Field: a <label> around several
// checkboxes would toggle the first one whenever its caption is tapped.
function LoanPicker({ label, hint, liabilities, value, onChange, t }: {
  label: string; hint?: string; liabilities: Liability[]; value: string[]; onChange: (ids: string[]) => void; t: Translate;
}) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      <div style={{ ...fullInputStyle, display: "flex", flexDirection: "column", gap: 8, height: "auto" }}>
        {liabilities.length ? liabilities.map((l) => (
          <label key={l.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={value.includes(l.id)} onChange={() => toggle(l.id)} />
            <span>{fillText(t(TR.insurance.loanOption), { name: l.type, amount: fmt(l.balance) })}</span>
          </label>
        )) : <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{t(TR.insurance.noLoans)}</span>}
      </div>
      {hint && liabilities.length > 0 && <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{hint}</span>}
    </div>
  );
}

function statusBadge(status: InsuranceCheckStatus, t: Translate) {
  if (status === "pass") return { text: t(TR.ratios.pass), icon: "pass" as const, bg: "#E1F5EE", color: "#0F6E56" };
  if (status === "fail") return { text: t(TR.ratios.fail), icon: "fail" as const, bg: "#FCEBEB", color: "#A32D2D" };
  return { text: t(TR.ratios.noData), icon: undefined, bg: "var(--track)", color: "var(--ink-soft)" };
}

function CheckCard({ check, t }: { check: InsuranceCheck; t: Translate }) {
  const badge = statusBadge(check.status, t);
  return (
    <div className="fp-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{check.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{check.formulaLabel}</div>
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: badge.color, background: badge.bg, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
          {badge.icon ? <IconLabel name={badge.icon} size="glyph">{badge.text}</IconLabel> : badge.text}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5, color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 4 }}>
        <span>{check.standardLabel}</span>
        <span className="fp-num" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{check.displayValue}</span>
      </div>
      {check.loans?.map((c) => <LoanCoverageRow key={c.liability.id} c={c} t={t} />)}
      {check.advice && (
        <div style={{ fontSize: 12, color: "#A32D2D", background: "#FCEBEB", borderRadius: 10, padding: "8px 10px", marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <PopIcon name="tip" /><span>{check.advice}</span>
        </div>
      )}
    </div>
  );
}

const checkLabelStyle = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-soft)", cursor: "pointer" } as const;

export function InsuranceView() {
  const { lang, t } = useLanguage();
  const { policies, liabilities, checks, expiringPolicies, noBeneficiaryPolicies, unlinkedCreditLife, loading } = useInsuranceAnalysis(lang);
  const personalAssets = useLiveQuery(() => db.personalAssets.toArray(), [], []);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) return null;

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (p: InsurancePolicy) => {
    setForm({
      policyType: p.policyType, provider: p.provider, sumAssured: String(p.sumAssured),
      annualPremium: String(p.annualPremium), expiryDate: p.expiryDate, beneficiarySet: p.beneficiarySet,
      premiumMode: p.premiumMode ?? "annual", coverageYears: p.coverageYears ? String(p.coverageYears) : "",
      liabilityIds: p.liabilityIds ?? [],
      earmarkOn: p.policyType === "ชีวิต" && (p.liabilityIds ?? []).length > 0,
      debtEarmark: p.debtEarmark ? String(p.debtEarmark) : "",
      propertyKind: p.propertyKind ?? "อัคคีภัย", personalAssetId: p.personalAssetId ?? "",
    });
    setEditingId(p.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.provider || !form.sumAssured) return;
    const isCredit = form.policyType === "คุ้มครองสินเชื่อ";
    const isEarmarked = form.policyType === "ชีวิต" && form.earmarkOn;
    const isProperty = form.policyType === "บ้านและรถ";
    const single = form.premiumMode === "single";
    void db.insurancePolicies.put({
      id: editingId || uid(), policyType: form.policyType, provider: form.provider,
      sumAssured: Number(form.sumAssured), annualPremium: Number(form.annualPremium || 0),
      expiryDate: form.expiryDate, beneficiarySet: isCredit || isProperty ? true : form.beneficiarySet,
      premiumMode: form.premiumMode,
      coverageYears: single && Number(form.coverageYears) > 0 ? Number(form.coverageYears) : undefined,
      liabilityIds: isCredit || isEarmarked ? form.liabilityIds : [],
      debtEarmark: isEarmarked && Number(form.debtEarmark) > 0 ? Number(form.debtEarmark) : undefined,
      propertyKind: isProperty ? form.propertyKind : undefined,
      personalAssetId: isProperty && form.personalAssetId ? form.personalAssetId : undefined,
    });
    closeModal();
  };
  const remove = (id: string) => void db.insurancePolicies.delete(id);

  const isCreditForm = form.policyType === "คุ้มครองสินเชื่อ";
  const isPropertyForm = form.policyType === "บ้านและรถ";
  const loanName = new Map(liabilities.map((l) => [l.id, l.type]));
  const assetName = new Map((personalAssets || []).map((a) => [a.id, a.name]));
  const linkedNames = (p: InsurancePolicy) => {
    if (p.policyType === "บ้านและรถ") return (p.personalAssetId && assetName.get(p.personalAssetId)) || "";
    if (p.policyType === "คุ้มครองสินเชื่อ" || p.policyType === "ชีวิต")
      return (p.liabilityIds || []).map((id) => loanName.get(id)).filter(Boolean).join(", ");
    return "";
  };

  const typeLabel = (p: InsurancePolicy) => {
    const type = translateLabel(p.policyType, lang, POLICY_TYPE_LABEL_EN);
    return p.policyType === "บ้านและรถ" && p.propertyKind ? `${type} (${translateLabel(p.propertyKind, lang, PROPERTY_KIND_LABEL_EN)})` : type;
  };
  const policyLabel = (p: InsurancePolicy) => `${typeLabel(p)} · ${p.provider}`;

  return (
    <div>
      <SectionHeader title={t(TR.insurance.title)} icon="insurance" sub={t(TR.insurance.subtitle)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.insurance.editTitle) : t(TR.insurance.addTitle)}>
        <div style={formColumnStyle}>
          <Field label={t(TR.insurance.policyType)}>
            <select value={form.policyType} onChange={(e) => setForm({ ...form, policyType: e.target.value as PolicyType })} style={fullInputStyle}>
              {POLICY_TYPES.map((pt) => <option key={pt} value={pt}>{translateLabel(pt, lang, POLICY_TYPE_LABEL_EN)}</option>)}
            </select>
          </Field>
          {isCreditForm && (
            <LoanPicker
              label={t(TR.insurance.linkedLoansCredit)} hint={t(TR.insurance.linkedLoansHint)}
              liabilities={liabilities} value={form.liabilityIds} onChange={(ids) => setForm({ ...form, liabilityIds: ids })} t={t}
            />
          )}
          {isPropertyForm && (
            <>
              <Field label={t(TR.insurance.propertyKind)}>
                <SegmentedControl
                  small
                  options={PROPERTY_KINDS.map((k) => ({ value: k, label: translateLabel(k, lang, PROPERTY_KIND_LABEL_EN) }))}
                  value={form.propertyKind}
                  onChange={(v) => setForm({ ...form, propertyKind: v })}
                />
              </Field>
              <Field label={t(TR.insurance.coveredItem)}>
                <select value={form.personalAssetId} onChange={(e) => setForm({ ...form, personalAssetId: e.target.value })} style={fullInputStyle}>
                  <option value="">{t(TR.common.none)}</option>
                  {(personalAssets || []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
              <span style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: -6 }}>{t(TR.insurance.coveredItemHint)}</span>
            </>
          )}
          <Field label={t(TR.insurance.provider)}>
            <input style={fullInputStyle} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder={t(TR.insurance.providerPlaceholder)} />
          </Field>
          <Field label={t(TR.insurance.sumAssured)}><CalcInput value={form.sumAssured} onChange={(v) => setForm({ ...form, sumAssured: v })} placeholder="0" /></Field>
          <Field label={t(TR.insurance.premiumMode)}>
            <SegmentedControl
              small
              options={[
                { value: "annual" as PremiumMode, label: t(TR.insurance.premiumAnnual) },
                { value: "single" as PremiumMode, label: t(TR.insurance.premiumSingle) },
              ]}
              value={form.premiumMode}
              onChange={(v) => setForm({ ...form, premiumMode: v })}
            />
          </Field>
          {form.premiumMode === "single" ? (
            <>
              <div style={formPairStyle}>
                <div style={formPairCellStyle}>
                  <Field label={t(TR.insurance.singlePremium)}><CalcInput value={form.annualPremium} onChange={(v) => setForm({ ...form, annualPremium: v })} placeholder="0" /></Field>
                </div>
                <div style={formPairCellStyle}>
                  <Field label={t(TR.insurance.coverageYears)}><input type="number" inputMode="numeric" style={fullInputStyle} value={form.coverageYears} onChange={(e) => setForm({ ...form, coverageYears: e.target.value })} placeholder="1" /></Field>
                </div>
              </div>
              {Number(form.annualPremium) > 0 && (
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {fillText(t(TR.insurance.singlePremiumNote), { amount: fmt(Number(form.annualPremium) / Math.max(1, Number(form.coverageYears) || 1)) })}
                </span>
              )}
            </>
          ) : (
            <Field label={t(TR.insurance.annualPremium)}><CalcInput value={form.annualPremium} onChange={(v) => setForm({ ...form, annualPremium: v })} placeholder="0" /></Field>
          )}
          <Field label={t(TR.insurance.expiryDate)}><input type="date" style={fullInputStyle} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
          {isCreditForm || isPropertyForm ? (
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{t(isCreditForm ? TR.insurance.lenderBeneficiary : TR.insurance.noBeneficiaryForProperty)}</span>
          ) : (
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={form.beneficiarySet} onChange={(e) => setForm({ ...form, beneficiarySet: e.target.checked })} />
              {t(TR.insurance.beneficiarySet)}
            </label>
          )}
          {form.policyType === "ชีวิต" && (
            <>
              <label style={{ ...checkLabelStyle, color: "var(--ink)", fontWeight: 600 }}>
                <input type="checkbox" checked={form.earmarkOn} onChange={(e) => setForm({ ...form, earmarkOn: e.target.checked })} />
                {t(TR.insurance.earmarkToggle)}
              </label>
              {form.earmarkOn && (
                <>
                  <LoanPicker
                    label={t(TR.insurance.linkedLoansCredit)} hint={t(TR.insurance.linkedLoansHint)}
                    liabilities={liabilities} value={form.liabilityIds} onChange={(ids) => setForm({ ...form, liabilityIds: ids })} t={t}
                  />
                  <Field label={t(TR.insurance.earmarkAmount)}><CalcInput value={form.debtEarmark} onChange={(v) => setForm({ ...form, debtEarmark: v })} placeholder={form.sumAssured || "0"} /></Field>
                  <span style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: -6 }}>{t(TR.insurance.earmarkHint)}</span>
                </>
              )}
            </>
          )}
          <div style={formActionsStyle}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600, marginBottom: 10 }}>{t(TR.insurance.checksTitle)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
        {checks.map((c) => <CheckCard key={c.key} check={c} t={t} />)}
      </div>

      {(expiringPolicies.length > 0 || noBeneficiaryPolicies.length > 0 || unlinkedCreditLife.length > 0) && (
        <div className="fp-card" style={{ padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}><IconLabel name="warning">{t(TR.insurance.alertsTitle)}</IconLabel></div>
          {expiringPolicies.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 }}>
              {t(TR.insurance.expiringWithin)} {expiringPolicies.map(policyLabel).join(", ")}
            </div>
          )}
          {noBeneficiaryPolicies.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 }}>
              {t(TR.insurance.noBeneficiaryList)} {noBeneficiaryPolicies.map(policyLabel).join(", ")}
            </div>
          )}
          {unlinkedCreditLife.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              {t(TR.insurance.unlinkedList)} {unlinkedCreditLife.map((p) => `${p.provider} (${fmt(p.sumAssured)})`).join(", ")}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 600, marginBottom: 10 }}>{t(TR.insurance.policiesTitle)}</div>
      <div className="fp-card" style={{ padding: 10 }}>
        {policies.length ? policies.map((p) => (
          <Row
            key={p.id}
            left={
              <div>
                <div style={{ fontSize: 14 }}>{policyLabel(p)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {p.premiumMode === "single"
                    ? fillText(t(TR.insurance.singlePremiumRow), { amount: fmt(p.annualPremium), years: p.coverageYears || 1 })
                    : `${fmt(yearlyPremium(p))}${t(TR.assets.perYear)}`}
                  {expiringPolicies.includes(p) && <span style={{ color: "#D07A4E" }}> · <IconLabel name="expiring">{t(TR.insurance.expiringSoon)}</IconLabel></span>}
                  {noBeneficiaryPolicies.includes(p) && <span style={{ color: "#D07A4E" }}> · <IconLabel name="beneficiary">{t(TR.insurance.noBeneficiaryBadge)}</IconLabel></span>}
                </div>
                {linkedNames(p) && (
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{fillText(t(TR.insurance.coversLoans), { names: linkedNames(p) })}</div>
                )}
              </div>
            }
            right={fmt(p.sumAssured)}
            onClick={() => openEdit(p)}
            onDelete={() => remove(p.id)}
          />
        )) : <EmptyState text={t(TR.insurance.empty)} />}
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12 }}>
        <Link href="/dashboard/financial-ratios" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          {t(TR.insurance.ratiosFooter)}
        </Link>
      </div>

      <AddFab onClick={openNew} />
    </div>
  );
}
