# Handoff Brief: เครื่องมือวางแผนการเงิน (สำหรับเริ่มโปรเจกต์ใน Claude Code)

## เป้าหมาย
ต่อยอดต้นแบบ (prototype) ที่ทำใน claude.ai ให้เป็น **PWA (Progressive Web App)** ใช้งานบนมือถือได้จริง มีฐานข้อมูลถาวร (ตอนนี้เป็นแค่ React state ในความจำ หายเมื่อรีเฟรช)

## Stack แนะนำ
- Framework: Next.js หรือ Vite + React (ต่อยอดจากโค้ด React เดิมได้ตรงๆ)
- PWA: `next-pwa` (ถ้าใช้ Next.js) หรือ `vite-plugin-pwa` (ถ้าใช้ Vite) — เพิ่ม manifest.json + service worker
- ฐานข้อมูล: เริ่มจาก local storage/IndexedDB (เช่น Dexie.js) สำหรับ MVP ที่ไม่ต้อง sync ข้ามอุปกรณ์ หรือต่อ backend จริง (Supabase/Postgres) ถ้าต้องการ sync
- กราฟ: recharts (ใช้ต่อจากเดิมได้)
- ไอคอน: lucide-react (ใช้ต่อจากเดิมได้)
- ฟอนต์: Prompt (หัวข้อ) + Sarabun (เนื้อหา) จาก Google Fonts

## ไฟล์เริ่มต้น
โค้ดต้นแบบทั้งหมดอยู่ใน `financial-planning-prototype.jsx` (React component เดียว ~900+ บรรทัด) — ใช้เป็นจุดเริ่มต้น แล้วค่อยแตกเป็นหลายไฟล์/component ตามโครงสร้างจริง

---

## Data Schema (สรุปจาก financial-planning-data-schema.md)

หมวดสินทรัพย์แยกเป็น **3 ประเภทอิสระจากกัน**:

### 1. LiquidAsset (สินทรัพย์สภาพคล่อง)
เงินสด/บัญชีออมทรัพย์/บัญชีกระแสรายวัน/กองทุนตลาดเงิน — นับใน Investable Net Worth และ Current Ratio
- fields: id, type (เงินสด/บัญชีออมทรัพย์/บัญชีกระแสรายวัน/กองทุนตลาดเงิน/อื่นๆ), name, current_value, goal_id (nullable)

### 2. InvestmentAsset (สินทรัพย์เพื่อการลงทุน)
- ตารางหลัก: id, category (FixedIncome/Equity/MutualFund/DR/RealEstate/Gold/Alternative), name, current_value, cost_basis, liquidity_tier (สูง/กลาง/ต่ำ), goal_id (nullable)
- ตารางย่อยตามประเภท: Equity/DR/Fund (ticker, issuer_code, underlying_asset, quantity, avg_cost, dividend_yield), RealEstate (property_type, is_rented, monthly_rent_income, linked_liability_id), Gold (gold_form, weight_baht, making_charge), Alternative (asset_symbol, wallet_or_exchange, quantity, concentration_flag)

### 3. PersonalAsset (สินทรัพย์ส่วนตัว)
รถ/บ้านอยู่เอง/ของสะสม — นับเฉพาะ Total Net Worth เท่านั้น ไม่นับ Investable Net Worth ไม่ผูก Goal
- fields: id, item_type, name, current_value, depreciation_rate (nullable), linked_liability_id (nullable)

### Liability (หนี้สิน)
แยก term_type: ShortTerm (≤1 ปี) / LongTerm (>1 ปี)
- fields: id, term_type, liability_type, outstanding_balance, interest_rate, minimum_monthly_payment, remaining_term_months, linked_investment_asset_id (nullable), linked_personal_asset_id (nullable)

### Goal (เป้าหมาย)
- fields: id, goal_type, name, target_amount, target_date, priority
- progress คำนวณจาก LiquidAsset + InvestmentAsset ที่ goal_id ตรงกัน (รวมกัน)

### CashFlowEntry (กระแสเงินสด)
- fields: id, entry_type (Income/Expense), category, amount, date
- **Income**: income_class (Active/Passive) คำนวณอัตโนมัติจาก keyword ในชื่อหมวดหมู่ — ไม่ต้องให้ผู้ใช้เลือกเอง
  - Passive keywords: ปันผล, ดอกเบี้ย, ค่าเช่า, เช่า, ลิขสิทธิ์, royalty, dividend, แบ่งปันกำไร, กำไรจากการขาย, ค่าตอบแทนกองทุน
  - อื่นๆ ที่ไม่ตรง keyword = Active โดยปริยาย
- **Expense**: expense_class (Fixed/Variable) คำนวณอัตโนมัติจาก keyword เช่นกัน
  - Fixed keywords: ผ่อน, ค่าเช่า, ค่าน้ำ, ค่าไฟ, โทรศัพท์, อินเทอร์เน็ต, เน็ตบ้าน, เบี้ยประกัน, ประกัน, ค่าเทอม, สมาชิก, งวด, หนี้
  - อื่นๆ = Variable โดยปริยาย

---

## Logic สำคัญที่ต้องคงไว้

### รอบบัญชี (Cash Flow Cycle)
ผู้ใช้ตั้งวันเริ่มรอบบัญชีเองได้ (1-28 ของทุกเดือน) แทนที่จะยึดตามปฏิทิน 1-สิ้นเดือนเสมอ พร้อมตัวเลือก "ถ้าวันเริ่มตรงเสาร์-อาทิตย์ ให้เลื่อนเป็นวันศุกร์ก่อนหน้า" (ตรวจสอบอัตโนมัติทุกเดือน — เดือนไหนวันที่เลือกตรงวันธรรมดาอยู่แล้วก็ใช้วันเดิม ไม่เลื่อน) เมตริกทั้งหมดในหน้าภาพรวม/กระแสเงินสด คำนวณจากรอบปัจจุบันนี้ ไม่ใช่เดือนปฏิทิน

### สูตรคำนวณหลัก
- Investable Net Worth = สินทรัพย์สภาพคล่อง + สินทรัพย์เพื่อการลงทุน − หนี้สินรวม
- Total Net Worth = สินทรัพย์สภาพคล่อง + สินทรัพย์เพื่อการลงทุน + สินทรัพย์ส่วนตัว − หนี้สินรวม
- Current Ratio = (สินทรัพย์สภาพคล่องทั้งหมด + สินทรัพย์ลงทุนที่ liquidity_tier = สูง) ÷ หนี้สินระยะสั้น
- Passive Income Ratio = รายรับ Passive ÷ รายจ่ายรวม (ในรอบบัญชีปัจจุบัน)

### หมวดหมู่กระแสเงินสด (ปุ่มลัด)
ปุ่มหมวดหมู่รายรับ/รายจ่ายมีไอคอนกำกับ ผู้ใช้กดค้าง (long-press) เพื่อเข้าโหมดแก้ไข ลบได้แม้กระทั่งปุ่มมาตรฐานที่ระบบตั้งไว้แต่แรก และลากจัดเรียงลำดับใหม่ได้ ถ้าผู้ใช้พิมพ์หมวดหมู่เองมีตัวเลือกบันทึกเป็นปุ่มลัดไว้ใช้ครั้งหน้า

---

## Design Language
- โทนสี: พาสเทล เป็นมิตร ไม่เป็นทางการ — ชมพู #FF9AA2, เขียวมิ้นท์ #7FD1C9/#B7E4C7, ลาเวนเดอร์ #B4A7F5, พีช #FFD8A8, ฟ้า #A0CED9/#BFE3F0, เหลือง #FFE29A, ชมพูอ่อน #FFAFCC
- ฟอนต์: Prompt (หัวข้อ, ตัวเลข) + Sarabun (เนื้อหา)
- การ์ดมุมโค้งมน (border-radius ~20-22px), เงาซอฟต์, ปุ่มทรงแคปซูล (pill-shaped)
- ใช้อิโมจิประกอบหัวข้อ/หมวดหมู่เพื่อความเป็นมิตร

## สิ่งที่ยังไม่ได้ทำ (ต่อยอดได้)
- HealthRiskProfile / InsurancePolicy module (ประเมินความเสี่ยงสุขภาพ → ช่องว่างประกัน)
- Tax Planning module (SSF/RMF, ภาษีปันผล DR/หุ้นต่างประเทศ, capital gain crypto)
- Behavioral Check-in, Estate Planning
- ระบบ auth + sync ข้อมูลข้ามอุปกรณ์
- ล็อกแอปด้วย PIN/biometric (ควรทำก่อนเก็บข้อมูลการเงินจริงบนเครื่อง)
