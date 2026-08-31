"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { POLICY_TYPES } from "@/lib/constants";
import { useInsuranceAnalysis } from "@/hooks/useInsuranceAnalysis";
import { useLanguage } from "@/hooks/useLanguage";
import { TR, POLICY_TYPE_LABEL_EN, translateLabel } from "@/lib/i18n";
import {
  SectionHeader, EmptyState, Field, AddButton, Modal, Row,
  cancelButtonStyle, inputStyle,
} from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import { AddFab } from "@/components/AddFab";
import type { InsuranceCheck, InsuranceCheckStatus } from "@/lib/insuranceAnalysis";
import type { InsurancePolicy, PolicyType } from "@/lib/types";

const emptyForm = {
  policyType: "ชีวิต" as PolicyType, provider: "", sumAssured: "", annualPremium: "", expiryDate: "", beneficiarySet: false,
};

function statusBadge(status: InsuranceCheckStatus, t: <K extends { th: string; en: string }>(entry: K) => string) {
  if (status === "pass") return { text: t(TR.ratios.pass), bg: "#E1F5EE", color: "#0F6E56" };
  if (status === "fail") return { text: t(TR.ratios.fail), bg: "#FCEBEB", color: "#A32D2D" };
  return { text: t(TR.ratios.noData), bg: "#F5F3EE", color: "var(--ink-soft)" };
}

function CheckCard({ check, t }: { check: InsuranceCheck; t: <K extends { th: string; en: string }>(entry: K) => string }) {
  const badge = statusBadge(check.status, t);
  return (
    <div className="fp-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{check.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>{check.formulaLabel}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
          {badge.text}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12.5, color: "var(--ink-soft)", borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 4 }}>
        <span>{check.standardLabel}</span>
        <span className="fp-num" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{check.displayValue}</span>
      </div>
      {check.advice && (
        <div style={{ fontSize: 12, color: "#A32D2D", background: "#FCEBEB", borderRadius: 10, padding: "8px 10px", marginTop: 8 }}>
          💡 {check.advice}
        </div>
      )}
    </div>
  );
}

export function InsuranceView() {
  const { lang, t } = useLanguage();
  const { policies, checks, expiringPolicies, noBeneficiaryPolicies, loading } = useInsuranceAnalysis(lang);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) return null;

  const openNew = () => { setForm(emptyForm); setEditingId(null); setModalOpen(true); };
  const openEdit = (p: InsurancePolicy) => {
    setForm({
      policyType: p.policyType, provider: p.provider, sumAssured: String(p.sumAssured),
      annualPremium: String(p.annualPremium), expiryDate: p.expiryDate, beneficiarySet: p.beneficiarySet,
    });
    setEditingId(p.id);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const submit = () => {
    if (!form.provider || !form.sumAssured) return;
    void db.insurancePolicies.put({
      id: editingId || uid(), policyType: form.policyType, provider: form.provider,
      sumAssured: Number(form.sumAssured), annualPremium: Number(form.annualPremium || 0),
      expiryDate: form.expiryDate, beneficiarySet: form.beneficiarySet,
    });
    closeModal();
  };
  const remove = (id: string) => void db.insurancePolicies.delete(id);

  const policyLabel = (p: InsurancePolicy) => `${translateLabel(p.policyType, lang, POLICY_TYPE_LABEL_EN)} · ${p.provider}`;

  return (
    <div>
      <Link
        href="/dashboard"
        aria-label={t(TR.ratios.backToOverview)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%",
          background: "#F5EFFF", color: "#7A5C9E", marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} />
      </Link>
      <SectionHeader title={t(TR.insurance.title)} sub={t(TR.insurance.subtitle)} />

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? t(TR.insurance.editTitle) : t(TR.insurance.addTitle)}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label={t(TR.insurance.policyType)}>
            <select value={form.policyType} onChange={(e) => setForm({ ...form, policyType: e.target.value as PolicyType })} style={inputStyle}>
              {POLICY_TYPES.map((pt) => <option key={pt} value={pt}>{translateLabel(pt, lang, POLICY_TYPE_LABEL_EN)}</option>)}
            </select>
          </Field>
          <Field label={t(TR.insurance.provider)}>
            <input style={inputStyle} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder={t(TR.insurance.providerPlaceholder)} />
          </Field>
          <Field label={t(TR.insurance.sumAssured)}><CalcInput value={form.sumAssured} onChange={(v) => setForm({ ...form, sumAssured: v })} placeholder="0" /></Field>
          <Field label={t(TR.insurance.annualPremium)}><CalcInput value={form.annualPremium} onChange={(v) => setForm({ ...form, annualPremium: v })} placeholder="0" /></Field>
          <Field label={t(TR.insurance.expiryDate)}><input type="date" style={inputStyle} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-soft)", cursor: "pointer" }}>
            <input type="checkbox" checked={form.beneficiarySet} onChange={(e) => setForm({ ...form, beneficiarySet: e.target.checked })} />
            {t(TR.insurance.beneficiarySet)}
          </label>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={closeModal} style={cancelButtonStyle}>{t(TR.common.cancel)}</button>
            <AddButton onClick={submit} label={editingId ? t(TR.common.saveEdit) : t(TR.common.add)} />
          </div>
        </div>
      </Modal>

      <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 10 }}>{t(TR.insurance.checksTitle)}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
        {checks.map((c) => <CheckCard key={c.key} check={c} t={t} />)}
      </div>

      {(expiringPolicies.length > 0 || noBeneficiaryPolicies.length > 0) && (
        <div className="fp-card" style={{ padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t(TR.insurance.alertsTitle)}</div>
          {expiringPolicies.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 }}>
              {t(TR.insurance.expiringWithin)} {expiringPolicies.map(policyLabel).join(", ")}
            </div>
          )}
          {noBeneficiaryPolicies.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
              {t(TR.insurance.noBeneficiaryList)} {noBeneficiaryPolicies.map(policyLabel).join(", ")}
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 13, color: "#645878", fontWeight: 600, marginBottom: 10 }}>{t(TR.insurance.policiesTitle)}</div>
      <div className="fp-card" style={{ padding: 10 }}>
        {policies.length ? policies.map((p) => (
          <Row
            key={p.id}
            left={
              <div>
                <div style={{ fontSize: 14 }}>{policyLabel(p)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {fmt(p.annualPremium)}{t(TR.assets.perYear)}
                  {expiringPolicies.includes(p) && <span style={{ color: "#D07A4E" }}> · ⏰ {t(TR.insurance.expiringSoon)}</span>}
                  {!p.beneficiarySet && <span style={{ color: "#D07A4E" }}> · 👤 {t(TR.insurance.noBeneficiaryBadge)}</span>}
                </div>
              </div>
            }
            right={fmt(p.sumAssured)}
            onClick={() => openEdit(p)}
            onDelete={() => remove(p.id)}
          />
        )) : <EmptyState text={t(TR.insurance.empty)} />}
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12 }}>
        <Link href="/dashboard/financial-ratios" style={{ color: "#7A5C9E", fontWeight: 600, textDecoration: "none" }}>
          {t(TR.insurance.ratiosFooter)}
        </Link>
      </div>

      <AddFab onClick={openNew} />
    </div>
  );
}
