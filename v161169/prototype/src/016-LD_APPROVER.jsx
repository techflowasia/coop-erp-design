// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน — การทำงาน: อนุมัติจ่ายสินเชื่อ (LoanDisbursement)
//  ขั้นตอน "สุดท้าย" ของการอนุมัติสินเชื่อ:
//    • ข้อมูลที่วิ่งเข้ามาที่เมนูนี้ = ใบคำขอกู้ที่ผ่าน "อนุมัติสินเชื่อ" แล้ว
//      (approved) → รอเจ้าหน้าที่การเงินอนุมัติ "จ่าย" เงินกู้
//    • เจ้าหน้าที่การเงิน: อนุมัติจ่ายทีละรายการ/หลายรายการ/ทั้งหมด
//    • ไม่อนุมัติจ่าย → ต้องระบุสาเหตุ → Order วิ่งกลับไปยังผู้ทำรายการ
//      (เจ้าหน้าที่ที่บันทึกข้อมูล) เพื่อปรับแก้ไข แล้วเข้ากระบวนการอนุมัติใหม่
//  โครงสร้าง/พฤติกรรมเหมือนหน้า "อนุมัติสินเชื่อ" (LA) — เพิ่มรายละเอียดการจ่าย
// ════════════════════════════════════════════════════════════════════

window.LD_APPROVER = 'เจ้าหน้าที่การเงิน · สุนิสา พงษ์ภักดี';

// ── สถานะการอนุมัติจ่าย ────────────────────────────────────────────
window.LD_STATUS = [
  { v: 'pending',  l: 'รออนุมัติจ่าย',           pill: 'warn' },
  { v: 'approved', l: 'อนุมัติจ่ายแล้ว',          pill: 'ok' },
  { v: 'returned', l: 'ส่งกลับให้แก้ไข',          pill: 'info' },
];
window.ldStatus = (v) => window.LD_STATUS.find(s => s.v === v) || { v, l: v, pill: 'neutral' };

// ── ข้อมูลผลิตภัณฑ์ของใบคำขอ (resolve จาก LP_SEED ถ้ามี) ───────────
window.ldProduct = (rec) => {
  const p = window.lrFindProduct ? window.lrFindProduct(rec.productId) : null;
  return {
    code: (p && p.code) || rec.productCode || '—',
    name: (p && p.name) || rec.productName || '—',
    group: (p && p.group) || rec.group || '',
  };
};

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลตั้งต้น — ใบคำขอกู้ที่ผ่านอนุมัติสินเชื่อแล้ว รออนุมัติจ่าย
//  (loanApprovedBy/loanApprovedDate = ผลจากขั้น "อนุมัติสินเชื่อ")
// ════════════════════════════════════════════════════════════════════
window.LD_SEED = [
  {
    id: 'LR-2569-04812', crmRef: 'CRM-2569-100420',
    memberCode: 'M-058251', memberName: 'นางวิภา จันทร์เพ็ญ', dept: 'กองการศึกษา', salary: 39200,
    productId: 'LP-20', productCode: 'สม.01', productName: 'เงินกู้สามัญปกติ', group: 'เงินกู้สามัญ',
    purposeLabel: 'ค่าใช้จ่ายครอบครัว', amount: 350000, entitlement: 1176000,
    rate: 6.25, periods: 96, payment: 4820, netReceive: 348000,
    fees: 2000, collateralType: 'คนค้ำประกัน', collateralOk: true,
    guarantors: [{ code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม' }, { code: 'M-058246', name: 'นางสาวพรพิมล ทองคำ' }],
    salaryRemain: 19240, pctRemain: 49.08,
    submittedBy: 'สุภาพร ทองใบ', submittedAt: '2026-05-30 09:41', priority: 'normal',
    payMethod: 'transfer', payBank: 'ธ.กรุงไทย', payAccount: '983-1-04821-6', payLot: 'LOT-2569-06-01',
    loanApprovedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', loanApprovedDate: '2026-05-31',
    note: 'ผ่านอนุมัติสินเชื่อแล้ว — ผู้ค้ำมีสิทธิ์ค้ำเพียงพอ พร้อมจ่ายเข้าบัญชี',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿350,000 ไม่เกินสิทธิ์' },
      { label: 'หลักประกัน', ok: true, detail: 'คนค้ำประกัน 2 ราย' },
      { label: 'เอกสารจ่ายเงิน', ok: true, detail: 'เลขบัญชีรับเงินถูกต้อง · อยู่ใน Lot จ่าย' },
    ],
    status: 'pending',
  },
  {
    id: 'LR-2569-04801', crmRef: 'CRM-2569-100388',
    memberCode: 'M-058262', memberName: 'นายกิตติ วัฒนาการ', dept: 'สำนักปลัด', salary: 45800,
    productId: 'LP-30', productCode: 'พศ.02', productName: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', group: 'เงินกู้พิเศษ',
    purposeLabel: 'ที่อยู่อาศัย', amount: 1500000, entitlement: 1800000,
    rate: 5.75, periods: 240, payment: 10520, netReceive: 1494000,
    fees: 6000, collateralType: 'หลักทรัพย์ค้ำประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 25130, pctRemain: 54.87,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-05-29 13:15', priority: 'urgent',
    payMethod: 'cheque', payBank: 'ธ.กรุงเทพ', payAccount: 'เช็ค 0044213', payLot: 'LOT-2569-06-01',
    loanApprovedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', loanApprovedDate: '2026-05-30',
    note: 'จ่ายด้วยเช็คขีดคร่อม — รอเจ้าหน้าที่การเงินอนุมัติจ่าย',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ · อายุงานคงเหลือ 14 ปี' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿1,500,000 ไม่เกินสิทธิ์ ฿1,800,000' },
      { label: 'หลักประกัน', ok: true, detail: 'โฉนดที่ดิน — จดจำนองครบถ้วน' },
      { label: 'เอกสารจ่ายเงิน', ok: true, detail: 'สัญญาเงินกู้ลงนามครบ · เตรียมเช็คแล้ว' },
    ],
    status: 'pending',
  },
  {
    id: 'LR-2569-04798', crmRef: 'CRM-2569-100371',
    memberCode: 'M-058270', memberName: 'นางสาวชนิดา แสงทอง', dept: 'กองสาธารณสุข', salary: 28400,
    productId: 'LP-50', productCode: 'สม.05', productName: 'เงินกู้สามัญเพิ่มสุข (ชำระจากปันผล)', group: 'เงินกู้สามัญ',
    purposeLabel: 'ชำระหนี้/รวมหนี้', amount: 250000, entitlement: 500000,
    rate: 6.00, periods: 60, payment: 4830, netReceive: 168500,
    fees: 1500, collateralType: 'หุ้นค้ำประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 14210, pctRemain: 50.04,
    submittedBy: 'สุภาพร ทองใบ', submittedAt: '2026-05-28 15:52', priority: 'normal',
    payMethod: 'transfer', payBank: 'ธ.กรุงไทย', payAccount: '983-1-05517-2', payLot: 'LOT-2569-06-01',
    loanApprovedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', loanApprovedDate: '2026-05-29',
    note: 'หักกลบหนี้เดิม ฿80,000 — จ่ายสุทธิเข้าบัญชี ฿168,500',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿250,000 ไม่เกินสิทธิ์ ฿500,000' },
      { label: 'หลักประกัน', ok: true, detail: 'หุ้นค้ำประกัน ฿640,000' },
      { label: 'เอกสารจ่ายเงิน', ok: false, detail: 'เลขบัญชีรับเงินยังไม่ได้ยืนยันกับธนาคาร' },
    ],
    status: 'pending',
  },
  {
    id: 'LR-2569-04790', crmRef: 'CRM-2569-100355',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', salary: 48750,
    productId: 'LP-10', productCode: 'ฉฉ.01', productName: 'เงินกู้เพื่อเหตุฉุกเฉิน', group: 'เงินกู้ฉุกเฉิน',
    purposeLabel: 'ค่าใช้จ่ายครอบครัว', amount: 80000, entitlement: 97500,
    rate: 6.50, periods: 12, payment: 6920, netReceive: 80000,
    fees: 0, collateralType: 'ไม่ใช้หลักประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 30110, pctRemain: 61.77,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-05-27 10:08', priority: 'normal',
    payMethod: 'transfer', payBank: 'ธ.กรุงไทย', payAccount: '983-1-04120-9', payLot: 'LOT-2569-05-04',
    loanApprovedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', loanApprovedDate: '2026-05-28',
    note: 'ฉุกเฉินหักโอน — พร้อมจ่ายทันทีที่อนุมัติ',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿80,000 ไม่เกินสิทธิ์ ฿97,500' },
      { label: 'หลักประกัน', ok: true, detail: 'เงินกู้ฉุกเฉินไม่บังคับหลักประกัน' },
      { label: 'เอกสารจ่ายเงิน', ok: true, detail: 'เลขบัญชีรับเงินถูกต้อง · อยู่ใน Lot จ่าย' },
    ],
    status: 'pending',
  },
  {
    id: 'LR-2569-04780', crmRef: 'CRM-2569-100340',
    memberCode: 'M-058255', memberName: 'นายสุรชัย วงศ์ประเสริฐ', dept: 'สำนักปลัด', salary: 31500,
    productId: 'LP-20', productCode: 'สม.01', productName: 'เงินกู้สามัญปกติ', group: 'เงินกู้สามัญ',
    purposeLabel: 'ค่าใช้จ่ายส่วนตัว', amount: 420000, entitlement: 945000,
    rate: 6.25, periods: 96, payment: 5780, netReceive: 418000,
    fees: 2000, collateralType: 'คนค้ำประกัน', collateralOk: true,
    guarantors: [{ code: 'M-058262', name: 'นายกิตติ วัฒนาการ' }],
    salaryRemain: 16220, pctRemain: 51.49,
    submittedBy: 'สุภาพร ทองใบ', submittedAt: '2026-05-25 11:33', priority: 'normal',
    payMethod: 'transfer', payBank: 'ธ.กรุงไทย', payAccount: '983-1-04980-1', payLot: 'LOT-2569-05-04',
    loanApprovedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', loanApprovedDate: '2026-05-26',
    note: 'อนุมัติจ่ายแล้ว โอนเข้าบัญชีเรียบร้อย',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿420,000 ไม่เกินสิทธิ์' },
      { label: 'หลักประกัน', ok: true, detail: 'คนค้ำประกัน 1 ราย' },
      { label: 'เอกสารจ่ายเงิน', ok: true, detail: 'จ่ายครบถ้วน' },
    ],
    status: 'approved', decidedBy: 'เจ้าหน้าที่การเงิน · สุนิสา พงษ์ภักดี', decidedDate: '2026-05-27',
    remark: 'อนุมัติจ่าย — โอนเข้าบัญชีตามรอบ Lot',
  },
  {
    id: 'LR-2569-04775', crmRef: 'CRM-2569-100332',
    memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ', dept: 'กองสาธารณสุข', salary: 21800,
    productId: 'LP-10', productCode: 'ฉฉ.01', productName: 'เงินกู้เพื่อเหตุฉุกเฉิน', group: 'เงินกู้ฉุกเฉิน',
    purposeLabel: 'ค่าใช้จ่ายครอบครัว', amount: 50000, entitlement: 54500,
    rate: 6.50, periods: 12, payment: 4330, netReceive: 50000,
    fees: 0, collateralType: 'ไม่ใช้หลักประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 7100, pctRemain: 32.57,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-05-24 14:47', priority: 'normal',
    payMethod: 'transfer', payBank: 'ธ.กรุงไทย', payAccount: '983-1-04560-3', payLot: 'LOT-2569-05-03',
    loanApprovedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', loanApprovedDate: '2026-05-25',
    note: 'ส่งกลับให้แก้ไขเลขบัญชีรับเงิน',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿50,000 ไม่เกินสิทธิ์' },
      { label: 'หลักประกัน', ok: true, detail: 'ไม่บังคับหลักประกัน' },
      { label: 'เอกสารจ่ายเงิน', ok: false, detail: 'เลขบัญชีรับเงินไม่ตรงกับชื่อสมาชิก' },
    ],
    status: 'returned', decidedBy: 'เจ้าหน้าที่การเงิน · สุนิสา พงษ์ภักดี', decidedDate: '2026-05-25',
    remark: 'เลขบัญชีรับเงินไม่ตรงกับชื่อสมาชิก — ส่งกลับให้ผู้ทำรายการแก้ไขเลขบัญชี แล้วเข้ากระบวนการอนุมัติใหม่',
  },
];

// ── วิธีการจ่าย ─────────────────────────────────────────────────────
window.LD_PAY_METHOD = {
  transfer: { l: 'โอนเข้าบัญชี', icon: 'bank' },
  cheque:   { l: 'จ่ายด้วยเช็ค', icon: 'receipt' },
  cash:     { l: 'เงินสด',       icon: 'money' },
};
window.ldPayMethod = (v) => window.LD_PAY_METHOD[v] || { l: v || '—', icon: 'money' };

// ════════════════════════════════════════════════════════════════════
//  Persistence (localStorage) — เก็บผลการอนุมัติจ่าย
// ════════════════════════════════════════════════════════════════════
const LD_LS_KEY = 'loan_disbursement_state_v1';
window.ldStore = () => {
  try { return JSON.parse(localStorage.getItem(LD_LS_KEY) || '{}'); } catch (e) { return {}; }
};
window.ldLoad = () => {
  const saved = window.ldStore();
  return window.LD_SEED.map(r => saved[r.id] ? { ...r, ...saved[r.id] } : { ...r });
};
window.ldSaveDecision = (id, patch) => {
  const store = window.ldStore();
  store[id] = { ...(store[id] || {}), ...patch };
  try { localStorage.setItem(LD_LS_KEY, JSON.stringify(store)); } catch (e) {}
};

// ── แปลงใบคำขอ → โครงข้อมูลฟอร์มใบคำขอกู้เงิน (สำหรับดูรายละเอียด) ──
window.ldToForm = (rec) => {
  if (window.laReqToForm) return window.laReqToForm(rec);
  return null;
};
