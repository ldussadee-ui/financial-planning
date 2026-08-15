# Data Schema: เครื่องมือวางแผนการเงิน (Financial Planning Tool)

> เอกสารนี้เป็นร่างเวอร์ชันแรก ออกแบบให้ขยายเพิ่ม field/entity ได้ภายหลังโดยไม่กระทบโครงสร้างเดิม

---

## 1. User (ผู้ใช้งาน)

| Field | Type | หมายเหตุ |
|---|---|---|
| user_id | UUID (PK) | |
| birth_date | Date | ใช้คำนวณอายุแบบ dynamic |
| marital_status | Enum | โสด/สมรส/หย่า/หม้าย |
| dependents_count | Integer | จำนวนผู้พึ่งพิง |
| occupation | String | |
| income_type | Enum | ประจำ/ฟรีแลนซ์/ธุรกิจส่วนตัว |
| created_at | Timestamp | |

---

## 2. RiskProfile (ความเสี่ยงด้านการลงทุน)

| Field | Type | หมายเหตุ |
|---|---|---|
| risk_profile_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| questionnaire_score | Integer | คะแนนรวมจากแบบสอบถาม |
| risk_category | Enum | Conservative / Moderate / Aggressive |
| assessed_at | Timestamp | ทำใหม่ได้เป็นระยะ → เก็บ history |

---

## 3. HealthRiskProfile (พฤติกรรม/ความเสี่ยงสุขภาพ)

| Field | Type | หมายเหตุ |
|---|---|---|
| health_profile_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| smoking | Boolean | |
| alcohol_frequency | Enum | ไม่ดื่ม/นานๆครั้ง/บ่อย |
| exercise_frequency | Enum | ไม่ออกกำลังกาย/1-2 ครั้ง/สัปดาห์/สม่ำเสมอ |
| avg_sleep_hours | Decimal | |
| occupation_risk_level | Enum | ต่ำ/ปานกลาง/สูง (งานเสี่ยงอุบัติเหตุ) |
| has_chronic_condition | Boolean | flag เท่านั้น ไม่เก็บรายละเอียดโรค |
| family_history_flag | Boolean | flag เท่านั้น |
| health_risk_score | Integer (computed) | ใช้ประเมิน insurance gap |

---

## 4. InsurancePolicy (กรมธรรม์ที่มีอยู่)

| Field | Type | หมายเหตุ |
|---|---|---|
| policy_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| policy_type | Enum | ชีวิต/สุขภาพ/อุบัติเหตุ/โรคร้ายแรง |
| sum_assured | Decimal | ทุนประกัน |
| annual_premium | Decimal | |
| provider | String | |
| beneficiary_set | Boolean | เชื่อมกับ Estate Planning check |
| expiry_date | Date | |

---

## 5. Goal (เป้าหมายทางการเงิน)

| Field | Type | หมายเหตุ |
|---|---|---|
| goal_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| goal_type | Enum | เกษียณ/บ้าน/การศึกษา/ท่องเที่ยว/Insurance Gap/Emergency Fund/อื่นๆ |
| target_amount | Decimal | |
| target_date | Date | |
| priority | Enum | สูง/กลาง/ต่ำ |
| current_progress | Decimal (computed) | คำนวณจาก InvestmentAsset ที่ tag ไว้กับ goal นี้ |
| required_monthly_saving | Decimal (computed) | reverse-engineered จาก target + timeline + expected return |

---

## 6. CashFlowEntry (รายรับ-รายจ่าย)

| Field | Type | หมายเหตุ |
|---|---|---|
| entry_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| entry_type | Enum | Income / Expense |
| income_class | Enum (nullable) | Active / Passive — ใช้เมื่อ entry_type = Income |
| category | String | เงินเดือน, ปันผล, ค่าเช่า, ค่าใช้จ่ายจำเป็น, ค่าใช้จ่ายไม่จำเป็น ฯลฯ |
| amount | Decimal | |
| frequency | Enum | รายเดือน/รายปี/ครั้งเดียว |
| linked_investment_asset_id | UUID (FK → InvestmentAsset, nullable) | เช่น ปันผลจาก asset ตัวไหน, ค่าเช่าจากอสังหาฯ ตัวไหน |

---

## 7. InvestmentAsset (สินทรัพย์เพื่อการลงทุน)

หมวดนี้คือสินทรัพย์ที่ถือไว้เพื่อสร้างผลตอบแทน/กระแสเงินสด นับรวมใน **Investable Net Worth** และใช้คำนวณ Financial Independence / Goal Progress

### 7.1 InvestmentAsset (ตารางหลัก)

| Field | Type | หมายเหตุ |
|---|---|---|
| asset_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| asset_category | Enum | FixedIncome / Equity / MutualFund / DR / RealEstate / Gold / Alternative |
| name | String | |
| current_value | Decimal | |
| cost_basis | Decimal | ใช้คำนวณ unrealized gain/loss และภาษี |
| liquidity_tier | Enum | สูง(เงินสด/กองทุน)/กลาง(หุ้น/DR)/ต่ำ(อสังหาฯ/ทองแท่ง) |
| goal_id | UUID (FK → Goal, nullable) | ผูกสินทรัพย์กับเป้าหมาย |
| updated_at | Timestamp | |

### 7.2 InvestmentAssetDetail_Equity_DR_Fund

| Field | Type | หมายเหตุ |
|---|---|---|
| asset_id | UUID (FK → InvestmentAsset) | |
| ticker_symbol | String | |
| issuer_code | String (nullable) | เฉพาะ DR — เช่น Yuanta, InnovestX |
| underlying_asset | String (nullable) | เฉพาะ DR |
| quantity | Decimal | |
| avg_cost_per_unit | Decimal | |
| dividend_yield | Decimal (nullable) | |

### 7.3 InvestmentAssetDetail_RealEstate

| Field | Type | หมายเหตุ |
|---|---|---|
| asset_id | UUID (FK → InvestmentAsset) | |
| property_type | Enum | ที่ดิน/คอนโด/บ้าน/อาคารพาณิชย์ |
| is_rented | Boolean | true → รายได้เชื่อมกับ CashFlowEntry (Passive) |
| monthly_rent_income | Decimal (nullable) | |
| appraised_value | Decimal | |
| linked_liability_id | UUID (FK → Liability, nullable) | สินเชื่อที่ผูกกับทรัพย์นี้ |

### 7.4 InvestmentAssetDetail_Gold

| Field | Type | หมายเหตุ |
|---|---|---|
| asset_id | UUID (FK → InvestmentAsset) | |
| gold_form | Enum | ทองแท่ง/ทองรูปพรรณ/Gold ETF/Gold Futures |
| weight_baht | Decimal (nullable) | เฉพาะทองแท่ง/รูปพรรณ |
| making_charge | Decimal (nullable) | ค่ากำเหน็จ เฉพาะทองรูปพรรณ |

### 7.5 InvestmentAssetDetail_Alternative (Crypto ฯลฯ)

| Field | Type | หมายเหตุ |
|---|---|---|
| asset_id | UUID (FK → InvestmentAsset) | |
| asset_symbol | String | เช่น BTC, ETH |
| wallet_or_exchange | String | |
| quantity | Decimal | |
| concentration_flag | Boolean (computed) | true ถ้าสัดส่วนเกิน threshold ที่ตั้งไว้ |

---

## 8. PersonalAsset (สินทรัพย์ส่วนตัวที่ไม่ก่อให้เกิดรายได้)

หมวดนี้แยกออกจาก InvestmentAsset โดยสิ้นเชิง — เป็นสินทรัพย์ที่ถือไว้เพื่อใช้งาน/ครอบครอง ไม่ได้ถือเพื่อผลตอบแทน นับรวมเฉพาะใน **Total Net Worth** เท่านั้น **ไม่นับ** ใน Investable Net Worth และไม่ใช้คำนวณ Goal Progress หรือ FI

| Field | Type | หมายเหตุ |
|---|---|---|
| personal_asset_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| item_type | Enum | รถยนต์/บ้านอยู่เอง/ของสะสม/เครื่องประดับ/เฟอร์นิเจอร์/อื่นๆ |
| current_value | Decimal | |
| depreciation_rate | Decimal (nullable) | เฉพาะรถยนต์ |
| liquidity_tier | Enum | ต่ำมาก (ค่าคงที่สำหรับหมวดนี้) |
| linked_liability_id | UUID (FK → Liability, nullable) | เช่น ผ่อนรถ |
| updated_at | Timestamp | |

---

## 9. Liability (หนี้สิน)

| Field | Type | หมายเหตุ |
|---|---|---|
| liability_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| term_type | Enum | ShortTerm (≤1 ปี) / LongTerm (>1 ปี) |
| liability_type | String | บัตรเครดิต, สินเชื่อบ้าน, สินเชื่อรถ, กยศ. ฯลฯ |
| outstanding_balance | Decimal | |
| interest_rate | Decimal | ต่อปี |
| minimum_monthly_payment | Decimal | |
| remaining_term_months | Integer | |
| linked_investment_asset_id | UUID (FK → InvestmentAsset, nullable) | เช่น สินเชื่อบ้านที่ปล่อยเช่า |
| linked_personal_asset_id | UUID (FK → PersonalAsset, nullable) | เช่น สินเชื่อรถที่ใช้เอง |

---

## 10. PortfolioSnapshot (ภาพรวมรายเดือน — สำหรับ tracking/กราฟย้อนหลัง)

| Field | Type | หมายเหตุ |
|---|---|---|
| snapshot_id | UUID (PK) | |
| user_id | UUID (FK → User) | |
| snapshot_date | Date | |
| investable_net_worth | Decimal | SUM(InvestmentAsset.current_value) — ใช้คำนวณ FI progress |
| personal_assets_value | Decimal | SUM(PersonalAsset.current_value) |
| total_net_worth | Decimal (computed) | investable_net_worth + personal_assets_value - total_liabilities |
| total_liabilities_short | Decimal | |
| total_liabilities_long | Decimal | |
| passive_income_ratio | Decimal | Passive Income ÷ รายจ่ายรวม |
| current_ratio | Decimal | สินทรัพย์สภาพคล่องสูง ÷ หนี้สินระยะสั้น |

---

## ความสัมพันธ์หลัก (Relationships Overview)

```
User (1) ──< RiskProfile
User (1) ──< HealthRiskProfile
User (1) ──< InsurancePolicy
User (1) ──< Goal
User (1) ──< CashFlowEntry
User (1) ──< InvestmentAsset ──< InvestmentAssetDetail_* (ตามประเภท)
User (1) ──< PersonalAsset
User (1) ──< Liability
User (1) ──< PortfolioSnapshot

InvestmentAsset ──> Goal (nullable, many-to-one)
InvestmentAsset ──> Liability (nullable, ผ่าน linked_liability_id ใน RealEstate detail)
PersonalAsset ──> Liability (nullable, ผ่าน linked_personal_asset_id)
CashFlowEntry ──> InvestmentAsset (nullable, ผ่าน linked_investment_asset_id)
```

---

## หมายเหตุสำหรับการขยายภายหลัง

จุดที่ออกแบบเผื่อไว้แล้วสำหรับเพิ่มเติมในอนาคตโดยไม่กระทบโครงสร้างเดิม:
- เพิ่ม asset_category ใหม่ใน InvestmentAsset → เพิ่ม Enum value + ตาราง InvestmentAssetDetail_ ใหม่ได้ทันที
- เพิ่ม item_type ใหม่ใน PersonalAsset → เพิ่ม Enum value ได้โดยตรง ไม่กระทบ InvestmentAsset
- เพิ่มฟีเจอร์ Tax Planning → เพิ่มตาราง TaxLot ผูกกับ InvestmentAsset ผ่าน cost_basis ที่มีอยู่แล้ว
- เพิ่ม Behavioral Check-in → เพิ่มตาราง BehaviorCheckIn ผูกกับ RiskProfile
- เพิ่ม Estate Planning เต็มรูปแบบ → ขยายจาก beneficiary_set (Boolean) เป็นตาราง Beneficiary แยก
