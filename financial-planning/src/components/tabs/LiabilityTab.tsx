"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { fmt, uid } from "@/lib/calc";
import { SectionHeader, Field, AddButton, Group, Row, inputStyle } from "@/components/ui";
import { CalcInput } from "@/components/CalcInput";
import type { LiabilityTerm } from "@/lib/types";

export function LiabilityTab() {
  const liabilities = useLiveQuery(() => db.liabilities.toArray(), [], []);
  const [form, setForm] = useState({ term: "LongTerm" as LiabilityTerm, type: "", balance: "", rate: "", monthly: "", months: "" });

  const add = () => {
    if (!form.type || !form.balance) return;
    void db.liabilities.add({
      id: uid(), term: form.term, type: form.type,
      balance: Number(form.balance), rate: Number(form.rate || 0),
      monthly: Number(form.monthly || 0), months: Number(form.months || 0),
    });
    setForm({ ...form, type: "", balance: "", rate: "", monthly: "", months: "" });
  };
  const remove = (id: string) => void db.liabilities.delete(id);

  const short = (liabilities || []).filter((l) => l.term === "ShortTerm");
  const long = (liabilities || []).filter((l) => l.term === "LongTerm");

  return (
    <div>
      <SectionHeader title="หนี้สิน 💳" sub="แยกหนี้สินระยะสั้น (≤ 1 ปี) และระยะยาว (> 1 ปี)" />
      <div className="fp-card" style={{ padding: 22, marginBottom: 22, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <Field label="ระยะ">
          <select value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value as LiabilityTerm })} style={inputStyle}>
            <option value="ShortTerm">ระยะสั้น</option>
            <option value="LongTerm">ระยะยาว</option>
          </select>
        </Field>
        <Field label="ประเภทหนี้"><input style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="เช่น บัตรเครดิต" /></Field>
        <Field label="ยอดคงเหลือ"><CalcInput value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} placeholder="0" /></Field>
        <Field label="ดอกเบี้ย %/ปี"><input type="number" style={inputStyle} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="0" /></Field>
        <Field label="ค่างวด/เดือน"><CalcInput value={form.monthly} onChange={(v) => setForm({ ...form, monthly: v })} placeholder="0" /></Field>
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
