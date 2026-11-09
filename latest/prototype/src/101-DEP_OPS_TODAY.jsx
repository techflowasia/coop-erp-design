// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ชุดข้อมูลส่วนงานเพิ่มเติม
//  โอนระหว่างบัญชี · คำนวณ/จ่าย/ค้างจ่ายดอกเบี้ย · Auto Passbook ·
//  หนังสือรับรองภาษี · นำเข้ารายการฝาก · Export File ธนาคาร
// ════════════════════════════════════════════════════════════════════

window.DEP_OPS_TODAY = '2026-06-14';
window.DEP_OPS_USER = 'จันทร์เพ็ญ มาลี';

// ─── ดอกเบี้ย: ตัวช่วยคำนวณ ──────────────────────────────────────────
window.depDaysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
// อัตราภาษีหัก ณ ที่จ่าย: ฝากประจำ 15% · อื่น ๆ 0%
window.depTaxRate = (typeCode) => (typeCode === 'F12' || typeCode === 'F24') ? 0.15 : 0;
// คำนวณดอกเบี้ยค้างของบัญชี ณ วันที่ asOf (ตั้งแต่ lastIntDate)
window.depAccrued = function (acc, asOf) {
  const from = acc.lastIntDate || '2025-12-31';
  const days = window.depDaysBetween(from, asOf || window.DEP_OPS_TODAY);
  const gross = acc.balance * (acc.rate / 100) * days / 365;
  const taxRate = window.depTaxRate(acc.typeCode);
  const tax = gross * taxRate;
  return { from, days, gross, tax, net: gross - tax, taxRate };
};

// ─── 1) ประวัติการคำนวณดอกเบี้ย (batch) ──────────────────────────────
//  status: calculated (คำนวณแล้ว รอจ่าย) | posted (จ่ายเข้าบัญชีแล้ว)
window.DEP_INT_RUN_SEED = [
  { id: 'INT-2568-02', period: 'ครึ่งปีหลัง 2568', scope: 'ทุกประเภท', calcDate: '2025-12-31',
    fromDate: '2025-07-01', toDate: '2025-12-31', accounts: 6, gross: 18420.55, tax: 1162.50, net: 17258.05,
    status: 'posted', postDate: '2025-12-31', by: 'ประภาส ทองสุข' },
  { id: 'INT-2569-01', period: 'ครึ่งปีแรก 2569', scope: 'ออมทรัพย์ + ออมทรัพย์พิเศษ', calcDate: '2026-06-14',
    fromDate: '2026-01-01', toDate: '2026-06-30', accounts: 5, gross: 9870.20, tax: 0, net: 9870.20,
    status: 'calculated', postDate: '', by: 'จันทร์เพ็ญ มาลี' },
];

// ─── 2) หนังสือรับรองภาษีหัก ณ ที่จ่าย (ดอกเบี้ยเงินฝาก) ─────────────
//  status: issued (ออกแล้ว) | draft (ร่าง)
window.DEP_TAX_CERT_SEED = [
  { id: 'WHT-2568-0007', taxYear: 2568, member: '58241', name: 'สมชาย ใจดี', accNo: '003-1-58241-4',
    type: 'ฝากประจำ 12 เดือน', interestPaid: 15500.00, taxRate: 0.15, taxWithheld: 2325.00,
    payDate: '2025-01-15', issuedDate: '2025-01-20', status: 'issued', certNo: 'ภงด.2569/0007' },
  { id: 'WHT-2568-0008', taxYear: 2568, member: '60112', name: 'วิภาวดี รังสิต', accNo: '003-1-60112-1',
    type: 'ฝากประจำ 12 เดือน', interestPaid: 9300.00, taxRate: 0.15, taxWithheld: 1395.00,
    payDate: '2025-03-20', issuedDate: '2025-03-25', status: 'issued', certNo: 'ภงด.2569/0008' },
  { id: 'WHT-2569-0001', taxYear: 2569, member: '57003', name: 'ธีรพงษ์ มากมี', accNo: '003-1-57003-2',
    type: 'ฝากประจำ 12 เดือน', interestPaid: 12400.00, taxRate: 0.15, taxWithheld: 1860.00,
    payDate: '2026-02-11', issuedDate: '', status: 'draft', certNo: '' },
];

// ─── 3) นำเข้ารายการฝาก (batch import) — แถวจากไฟล์หักเงินเดือน/ตัวแทน ─
//  match: matched (พบบัญชี) | unmatched (ไม่พบบัญชี/รหัสผิด)
window.DEP_IMPORT_SAMPLE = {
  fileName: 'PAYROLL_DEP_2569-06.csv', channel: 'หักเงินเดือน', period: '2569/06',
  rows: [
    { line: 1, member: '58241', accNo: '001-2-58241-0', name: 'สมชาย ใจดี',        amount: 2000, match: 'matched' },
    { line: 2, member: '58241', accNo: '002-5-58241-7', name: 'สมชาย ใจดี',        amount: 5000, match: 'matched' },
    { line: 3, member: '60112', accNo: '002-5-60112-3', name: 'วิภาวดี รังสิต',     amount: 3000, match: 'matched' },
    { line: 4, member: '57003', accNo: '001-2-57003-9', name: 'ธีรพงษ์ มากมี',      amount: 1500, match: 'matched' },
    { line: 5, member: '61580', accNo: '004-9-61580-1', name: 'ปาริชาติ สุขสวัสดิ์', amount: 1000, match: 'matched' },
    { line: 6, member: '62880', accNo: '001-2-62880-0', name: 'อรอุมา เพชรรัตน์',   amount: 2500, match: 'unmatched' },
    { line: 7, member: '69001', accNo: '001-2-69001-5', name: 'กิตติ (ไม่พบสมาชิก)', amount: 1800, match: 'unmatched' },
  ],
};

// ─── 4) Export File ธนาคาร (จ่ายดอกเบี้ย/ถอนโอนเข้าบัญชีสมาชิก) ───────
//  status: draft | generated | uploaded | completed
window.DEP_BANKFILE_SEED = [
  { id: 'DBF-2569-0006', purpose: 'โอนดอกเบี้ยเงินฝาก', transferType: 'KTB iPay Direct', bankId: 'BA-01',
    transferDate: '2026-06-13', createdBy: 'จันทร์เพ็ญ มาลี', status: 'generated',
    items: [
      { name: 'สมชาย ใจดี', member: '58241', bank: 'ธ.กรุงไทย', acctNo: '9821440217', amount: 3120.40 },
      { name: 'วิภาวดี รังสิต', member: '60112', bank: 'ธ.ออมสิน', acctNo: '0206711882', amount: 2410.00 },
    ] },
  { id: 'DBF-2569-0005', purpose: 'โอนเงินถอนเข้าบัญชีสมาชิก', transferType: 'KTB iPay Direct', bankId: 'BA-01',
    transferDate: '2026-06-05', createdBy: 'จันทร์เพ็ญ มาลี', status: 'completed',
    items: [
      { name: 'สมชาย ใจดี', member: '58241', bank: 'ธ.กรุงไทย', acctNo: '9821440217', amount: 15000.00 },
    ] },
];

// แถวรอโอน (pending) — ดึงมาสร้าง Export File ได้
window.DEP_BANKFILE_PENDING = [
  { id: 'DPP-01', name: 'สมชาย ใจดี',        member: '58241', bank: 'ธ.กรุงไทย', acctNo: '9821440217', amount: 3120.40, purpose: 'ดอกเบี้ยเงินฝาก' },
  { id: 'DPP-02', name: 'วิภาวดี รังสิต',     member: '60112', bank: 'ธ.ออมสิน',  acctNo: '0206711882', amount: 2410.00, purpose: 'ดอกเบี้ยเงินฝาก' },
  { id: 'DPP-03', name: 'ธีรพงษ์ มากมี',      member: '57003', bank: 'ธ.กสิกรไทย', acctNo: '0442900175', amount: 8400.00, purpose: 'ถอนโอนเข้าบัญชี' },
  { id: 'DPP-04', name: 'ปาริชาติ สุขสวัสดิ์', member: '61580', bank: 'ธ.กรุงเทพ',  acctNo: '2340778899', amount: 12050.00, purpose: 'ถอนปิดบัญชี' },
];

window.DEP_BANKFILE_STATUS = {
  draft:     { l: 'ร่าง',         pill: 'neutral' },
  generated: { l: 'สร้างไฟล์แล้ว', pill: 'info' },
  uploaded:  { l: 'อัปโหลดแล้ว',   pill: 'warn' },
  completed: { l: 'โอนสำเร็จ',     pill: 'ok' },
};

// ─── 5) Auto Passbook — คิวบรรทัดรอพิมพ์ (ต่อบัญชี) ──────────────────
//  สร้างจาก ledger จริง + ตัวอย่างยกมา
window.DEP_PASSBOOK_QUEUE_SEED = [
  { accNo: '001-2-58241-0', member: '58241', name: 'สมชาย ใจดี', type: 'ออมทรัพย์', lastLine: 12,
    pending: [
      { date: '2026-06-13', desc: 'หักเงินเดือน', wd: 0, dp: 2000, bal: 344850.50 },
      { date: '2026-06-14', desc: 'ดอกเบี้ย',     wd: 0, dp: 1287.40, bal: 346137.90 },
    ] },
  { accNo: '002-5-60112-3', member: '60112', name: 'วิภาวดี รังสิต', type: 'ออมทรัพย์พิเศษ', lastLine: 8,
    pending: [
      { date: '2026-06-13', desc: 'หักเงินเดือน', wd: 0, dp: 3000, bal: 161200.00 },
    ] },
  { accNo: '001-2-57003-9', member: '57003', name: 'ธีรพงษ์ มากมี', type: 'ออมทรัพย์', lastLine: 20,
    pending: [
      { date: '2026-06-13', desc: 'หักเงินเดือน', wd: 0, dp: 1500, bal: 90900.25 },
      { date: '2026-06-14', desc: 'ถอนเงินสด',   wd: 8400, dp: 0, bal: 82500.25 },
    ] },
];

// ─── localStorage helpers ────────────────────────────────────────────
window.depIntLoad = function () {
  try { const s = localStorage.getItem('dep_int_runs'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.DEP_INT_RUN_SEED));
};
window.depIntSave = function (l) { try { localStorage.setItem('dep_int_runs', JSON.stringify(l)); } catch (e) {} };

window.depTaxLoad = function () {
  try { const s = localStorage.getItem('dep_tax_certs_v2'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.DEP_TAX_CERT_SEED));
};
window.depTaxSave = function (l) { try { localStorage.setItem('dep_tax_certs_v2', JSON.stringify(l)); } catch (e) {} };

window.depBankFileLoad = function () {
  try { const s = localStorage.getItem('dep_bank_files'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.DEP_BANKFILE_SEED));
};
window.depBankFileSave = function (l) { try { localStorage.setItem('dep_bank_files', JSON.stringify(l)); } catch (e) {} };
