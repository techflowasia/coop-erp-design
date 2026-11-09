// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: อนุมัติสินเชื่อ (LoanApproval)
//  ข้อมูลของเมนูนี้ = "ใบคำขอกู้เงิน" ที่เจ้าหน้าที่ทำรายการแล้วและ
//  ส่งเข้ามารออนุมัติ (สถานะ 'waitapprove' = รออนุมัติ) เท่านั้น
//  ทุกรายการอ้างอิงกับคิวใบคำขอกู้ window.LR_CRM_QUEUE (data-loanreq.js)
//  และใช้ชุดสถานะเดียวกับใบคำขอกู้ window.LR_CRM_STATUS
//    · อนุมัติ            → approved (อนุมัติ รอจ่ายเงิน)
//    · ไม่อนุมัติ/ส่งกลับแก้ → rejected (ไม่อนุมัติ — ส่งกลับให้แก้ไข)
//    · ปิดการทำงาน        → returned (ส่งคืนคำขอ)
//  เมื่อพิจารณาแล้วรายการจะหลุดออกจากเมนูนี้ (เหลือเฉพาะ "รออนุมัติ")
// ════════════════════════════════════════════════════════════════════

window.LA_APPROVER = 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์';

// ── สถานะ — ใช้ชุดเดียวกับใบคำขอกู้เงิน (LR_CRM_STATUS) ─────────────
//  ตั้งชื่อเฉพาะของงานอนุมัติสินเชื่อ (laReqStatus) เพื่อไม่ชนกับ
//  laStatus ของงานนิติกรรม (data-legal-act.js)
window.LA_REQ_STATUS_KEYS = ['waitapprove', 'special', 'approved', 'rejected', 'returned'];
window.LA_REQ_STATUS = () => {
  const S = window.LR_CRM_STATUS || {};
  return window.LA_REQ_STATUS_KEYS.map(v => ({ v, l: (S[v] || {}).label || v, pill: (S[v] || {}).pill || 'neutral' }));
};
window.laReqStatus = (v) => {
  const s = (window.LR_CRM_STATUS || {})[v];
  return s ? { v, l: s.label, pill: s.pill } : { v, l: v, pill: 'neutral' };
};

// ── ข้อมูลผลิตภัณฑ์ของใบคำขอ (resolve จาก LP_SEED ถ้ามี) ───────────
window.laReqProduct = (rec) => {
  const p = window.lrFindProduct ? window.lrFindProduct(rec.productId) : null;
  return {
    code: (p && p.code) || rec.productCode || '—',
    name: (p && p.name) || rec.productName || '—',
    group: (p && p.group) || rec.group || '',
  };
};

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลตั้งต้น — ใบคำขอกู้ที่ "รออนุมัติ" (ตรงกับ LR_CRM_QUEUE)
//  id = เลขที่ใบคำขอ (reqNo) · crmRef = เลขคำขอ CRM ของรายการเดียวกัน
// ════════════════════════════════════════════════════════════════════
window.LA_REQ_SEED = [
  {
    id: 'LR-2569-04834', crmRef: 'CRM-2569-100479',
    memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง', salary: 52400,
    productId: 'LP-30', productCode: 'พศ.02', productName: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', group: 'เงินกู้พิเศษ',
    purposeLabel: 'ที่อยู่อาศัย', amount: 1800000, entitlement: 2000000,
    rate: 5.75, periods: 240, payment: 12640, netReceive: 1793500,
    collateralType: 'หลักทรัพย์ค้ำประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 28110, pctRemain: 53.65,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-06-02 11:05', priority: 'urgent',
    note: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย — ตรวจหลักทรัพย์แล้ว มูลค่าจำนอง ฿2,400,000',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ · อายุงานคงเหลือ 12 ปี' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿1,800,000 ไม่เกินสิทธิ์ ฿2,000,000' },
      { label: 'หลักประกัน', ok: true, detail: 'โฉนดที่ดิน — ราคาจำนอง ฿2,400,000 (LTV 75%)' },
      { label: 'เงินเดือนคงเหลือ', ok: true, detail: '฿28,110 (53.65%) ≥ ขั้นต่ำ' },
    ],
    status: 'waitapprove',
  },
  {
    id: 'LR-2569-04833', crmRef: 'CRM-2569-100471',
    memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ', dept: 'กองสาธารณสุข', salary: 21800,
    productId: 'LP-10', productCode: 'ฉฉ.01', productName: 'เงินกู้เพื่อเหตุฉุกเฉิน', group: 'เงินกู้ฉุกเฉิน',
    purposeLabel: 'ค่าใช้จ่ายครอบครัว', amount: 45000, entitlement: 43600,
    rate: 6.50, periods: 12, payment: 3900, netReceive: 45000,
    collateralType: 'ไม่ใช้หลักประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 6900, pctRemain: 31.65,
    submittedBy: 'สุภาพร ทองใบ', submittedAt: '2026-06-01 16:48', priority: 'normal',
    specialReason: 'ยอดขอเกินสิทธิ์วงเงิน ฿1,400 และเงินเดือนคงเหลือต่ำกว่าเกณฑ์ — ขอใช้อำนาจผู้จัดการอนุมัติกรณีพิเศษ',
    specialBy: 'สุภาพร ทองใบ', specialAt: '2026-06-01 17:02',
    note: 'ฉุกเฉินเงินสด — สมาชิกสมทบ ยอดขอเกินสิทธิ์วงเงินเล็กน้อย โปรดพิจารณา',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกสมทบ (พนักงาน) · อายุสมาชิก 2 ปี 10 เดือน' },
      { label: 'สิทธิ์วงเงิน', ok: false, detail: 'ขอ ฿45,000 เกินสิทธิ์ ฿43,600 (เกิน ฿1,400)' },
      { label: 'หลักประกัน', ok: true, detail: 'เงินกู้ฉุกเฉินไม่บังคับหลักประกัน' },
      { label: 'เงินเดือนคงเหลือ', ok: false, detail: '฿6,900 (31.65%) ต่ำกว่าขั้นต่ำ 40%' },
    ],
    status: 'special',
  },
  {
    id: 'LR-2569-04832', crmRef: 'CRM-2569-100468',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', salary: 48750,
    productId: 'LP-30', productCode: 'พศ.02', productName: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', group: 'เงินกู้พิเศษ',
    purposeLabel: 'ที่อยู่อาศัย', amount: 2200000, entitlement: 2000000,
    rate: 5.75, periods: 240, payment: 15450, netReceive: 2193500,
    collateralType: 'หลักทรัพย์ค้ำประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 20400, pctRemain: 41.85,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-06-01 15:20', priority: 'normal',
    specialReason: 'วงเงินขอกู้เกินสิทธิ์ของผลิตภัณฑ์ ฿200,000 — หลักทรัพย์ค้ำประกันเพียงพอ ขอให้คณะกรรมการพิจารณากรณีพิเศษ',
    specialBy: 'มนตรี ศรีสุข', specialAt: '2026-06-01 15:20',
    note: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย — ขอเกินวงเงินสิทธิ์',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ · อายุงานคงเหลือ 15 ปี 3 เดือน' },
      { label: 'สิทธิ์วงเงิน', ok: false, detail: 'ขอ ฿2,200,000 เกินสิทธิ์ ฿2,000,000 (เกิน ฿200,000)' },
      { label: 'หลักประกัน', ok: true, detail: 'โฉนดที่ดิน — ราคาจำนอง ฿3,150,000 (LTV 70%)' },
      { label: 'เงินเดือนคงเหลือ', ok: true, detail: '฿20,400 (41.85%) ≥ ขั้นต่ำ' },
    ],
    status: 'special',
  },
  {
    id: 'LR-2569-04830', crmRef: 'CRM-2569-100460',
    memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง', salary: 52400,
    productId: 'LP-20', productCode: 'สม.01', productName: 'เงินกู้สามัญปกติ', group: 'เงินกู้สามัญ',
    purposeLabel: 'ชำระหนี้/รวมหนี้', amount: 800000, entitlement: 1572000,
    rate: 6.25, periods: 120, payment: 8980, netReceive: 797500,
    collateralType: 'คนค้ำประกัน', collateralOk: false,
    guarantors: [{ code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม' }],
    salaryRemain: 22530, pctRemain: 43.00,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-06-01 11:35', priority: 'normal',
    specialReason: 'คนค้ำประกันไม่ครบตามเกณฑ์ (มี 1 ราย ต้องการ 2 ราย) — ผู้กู้มีหุ้นและเงินฝากค้ำประกันส่วนที่ขาด',
    specialBy: 'มนตรี ศรีสุข', specialAt: '2026-06-01 11:35',
    note: 'สามัญปกติเพื่อรวมหนี้ — ขออนุโลมเงื่อนไขผู้ค้ำประกัน',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ · อายุงานคงเหลือ 12 ปี' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿800,000 ไม่เกินสิทธิ์ ฿1,572,000' },
      { label: 'หลักประกัน', ok: false, detail: 'คนค้ำประกัน 1 ราย — เกณฑ์กำหนด 2 ราย สำหรับวงเงิน > ฿500,000' },
      { label: 'เงินเดือนคงเหลือ', ok: true, detail: '฿22,530 (43.00%) ≥ ขั้นต่ำ' },
    ],
    status: 'special',
  },
  {
    id: 'LR-2569-04835', crmRef: 'CRM-2569-100476',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', salary: 48750,
    productId: 'LP-20', productCode: 'สม.01', productName: 'เงินกู้สามัญปกติ', group: 'เงินกู้สามัญ',
    purposeLabel: 'ชำระหนี้/รวมหนี้', amount: 350000, entitlement: 1462500,
    rate: 6.25, periods: 84, payment: 5160, netReceive: 348500,
    collateralType: 'คนค้ำประกัน', collateralOk: true,
    guarantors: [{ code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์' }],
    salaryRemain: 30690, pctRemain: 62.95,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-06-02 10:22', priority: 'normal',
    note: 'ขอกู้สามัญเพื่อรวมหนี้ — เอกสารครบ ผ่านการตรวจคุณสมบัติเบื้องต้น',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ · อายุงานคงเหลือ 15 ปี 3 เดือน' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿350,000 ไม่เกินสิทธิ์ ฿1,462,500' },
      { label: 'หลักประกัน', ok: true, detail: 'คนค้ำประกัน 1 ราย — ค้ำครบยอดกู้' },
      { label: 'เงินเดือนคงเหลือ', ok: true, detail: '฿30,690 (62.95%) ≥ ขั้นต่ำ' },
    ],
    status: 'waitapprove',
  },
  {
    id: 'LR-2569-04836', crmRef: 'CRM-2569-100465',
    memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง', salary: 52400,
    productId: 'LP-50', productCode: 'สม.05', productName: 'เงินกู้สามัญเพิ่มสุข (ชำระจากปันผล)', group: 'เงินกู้สามัญ',
    purposeLabel: 'ค่าใช้จ่ายครอบครัว', amount: 300000, entitlement: 600000,
    rate: 6.00, periods: 60, payment: 5800, netReceive: 298500,
    collateralType: 'หุ้นค้ำประกัน', collateralOk: true,
    guarantors: [],
    salaryRemain: 21710, pctRemain: 41.43,
    submittedBy: 'มนตรี ศรีสุข', submittedAt: '2026-06-01 15:12', priority: 'normal',
    note: 'สามัญเพิ่มสุข ชำระจากปันผล — ค้ำด้วยทุนเรือนหุ้นของผู้กู้',
    checks: [
      { label: 'คุณสมบัติสมาชิก', ok: true, detail: 'สมาชิกปกติ' },
      { label: 'สิทธิ์วงเงิน', ok: true, detail: 'ขอ ฿300,000 ไม่เกินสิทธิ์ ฿600,000' },
      { label: 'หลักประกัน', ok: true, detail: 'หุ้นค้ำประกัน ฿1,240,000' },
      { label: 'เงินเดือนคงเหลือ', ok: true, detail: '฿21,710 (41.43%) ≥ ขั้นต่ำ' },
    ],
    status: 'waitapprove',
  },
];

// ════════════════════════════════════════════════════════════════════
//  Persistence (localStorage) — เก็บผลการพิจารณา
//  laLoad() คืนเฉพาะรายการที่ยัง "รออนุมัติ" — รายการที่พิจารณาแล้ว
//  จะออกจากเมนูนี้ไปยังขั้นถัดไป (การเงิน › อนุมัติจ่ายสินเชื่อ)
// ════════════════════════════════════════════════════════════════════
const LA_LS_KEY = 'loan_approvals_state_v2';
window.laReqStore = () => {
  try { return JSON.parse(localStorage.getItem(LA_LS_KEY) || '{}'); } catch (e) { return {}; }
};
window.laReqLoad = () => {
  const saved = window.laReqStore();
  return window.LA_REQ_SEED
    .map(r => saved[r.id] ? { ...r, ...saved[r.id] } : { ...r })
    .filter(r => r.status === 'waitapprove' || r.status === 'special');
};
window.laReqSaveDecision = (id, patch) => {
  const store = window.laReqStore();
  store[id] = { ...(store[id] || {}), ...patch };
  try { localStorage.setItem(LA_LS_KEY, JSON.stringify(store)); } catch (e) {}
};

// ── รายการที่อนุมัติแล้ว → ส่งต่อเมนู "กำหนด Lot จ่ายเงินกู้" ──
window.laApprovedForLot = () => {
  const saved = window.laReqStore();
  return window.LA_REQ_SEED
    .filter(r => saved[r.id] && saved[r.id].status === 'approved')
    .map(r => {
      const x = { ...r, ...saved[r.id] };
      const p = window.laReqProduct(x);
      return { reqNo: x.id, name: x.memberName, dept: x.dept, amount: Number(x.amount) || 0,
               enteredBy: x.submittedBy || '', typeCode: String(p.code || ''), projectId: x.projectId || window.LOT_TYPE_PROJECT[x.productId] || '', payMethod: x.payMethod || 'transfer',
               bankIdx: 0, account: x.account || '', lot: x.payLot || 'pending', fromApproval: true };
    });
};
window.laReqSetLot = (ids, lot) => ids.forEach(id => window.laReqSaveDecision(id, { payLot: lot }));

// ── แปลงใบคำขออนุมัติ → โครงข้อมูลฟอร์มใบคำขอกู้เงิน (สำหรับดูรายละเอียด) ──
//  ใช้ LR_DEMO เป็นฐาน แล้วทับด้วยข้อมูลของใบคำขอรายการนั้น เพื่อให้
//  หน้ารายละเอียดแสดงผลเหมือนหน้าจอ "ใบคำขอกู้เงิน" ทุกส่วน
window.laReqToForm = (rec) => {
  const base = JSON.parse(JSON.stringify(window.LR_DEMO));
  const g = (window.GUAR_MEMBERS || []).find(m => m.code === rec.memberCode);
  const product = window.lrFindProduct ? window.lrFindProduct(rec.productId) : null;
  const reqDate = (rec.submittedAt || '').slice(0, 10) || base.reqDate;

  base.reqNo = rec.id;
  base.crmRef = rec.crmRef;
  base.productId = rec.productId;
  base.amount = rec.amount;
  base.prevDebt = 0;
  base.reqDate = reqDate;
  base.payDate = reqDate;
  base.receiveDate = reqDate;
  base.sendablePeriods = rec.periods || base.sendablePeriods;

  // วัตถุประสงค์ — จับคู่จาก label ถ้าตรงกับตัวเลือก
  const purposeOpt = (window.LP_OPTS && window.LP_OPTS.loanPurpose || []).find(o => o.l === rec.purposeLabel);
  if (purposeOpt) base.purpose = purposeOpt.v;

  base.member = {
    ...base.member,
    code: rec.memberCode, name: rec.memberName, unit: rec.dept,
    salary: rec.salary,
    ...(g ? {
      birthDate: g.birthDate, retireDate: g.retireDate, joinDate: g.joinDate,
      shareCapital: g.share ? g.share.capital : base.member.shareCapital,
    } : {}),
  };
  base.income = { ...base.income, salary: rec.salary };

  const cap = product ? (product.settings && product.settings.maxLoanAmount) : rec.entitlement;
  base.entitlement = rec.entitlement || Math.min(cap || rec.entitlement, (rec.salary || 0) * 60);
  return base;
};
