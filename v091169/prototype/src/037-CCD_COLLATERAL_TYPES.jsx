// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — เปลี่ยนแปลงรายละเอียดสัญญา
//  ข้อมูลสาธิต: ประเภทหลักประกัน · ข้อมูลสัญญาเดิม · หลักประกัน/ผู้ค้ำเดิม
//  อ้างอิงสมาชิก/สัญญาจาก DN_MEMBERS (data-debt-notice.js)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทหลักประกัน ───────────────────────────────────────────────
window.CCD_COLLATERAL_TYPES = [
  { v: 'person',   l: 'คนค้ำประกัน',   needMember: true  },
  { v: 'share',    l: 'หุ้น',           needMember: false },
  { v: 'deposit',  l: 'เงินฝาก',        needMember: false },
  { v: 'security', l: 'หลักทรัพย์',     needMember: false },
  { v: 'land',     l: 'ที่ดิน',          needMember: false },
  { v: 'other',    l: 'หลักทรัพย์อื่น',  needMember: false },
];
window.ccdCollType = (v) => window.CCD_COLLATERAL_TYPES.find(t => t.v === v) || window.CCD_COLLATERAL_TYPES[0];

// ─── ผู้ทำรายการ (ล็อกอินปัจจุบัน) ───────────────────────────────────
window.CCD_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── ค้นหาสมาชิกสำหรับ MemberSearchModal (รับ criteria object — DS pattern) ──
//  ใช้ร่วมกับ <MemberSearchField source={DN_MEMBERS} searchFn={ccdSearchMembers}>
window.ccdSearchMembers = (criteria) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const c = criteria || {};
  const code = norm(c.code), fn = norm(c.firstName), ln = norm(c.lastName), cid = norm(c.citizenId);
  return (window.DN_MEMBERS || []).filter(m =>
    (!code || norm(m.code).includes(code)) &&
    (!fn   || norm(m.firstName || m.name).includes(fn)) &&
    (!ln   || norm(m.lastName).includes(ln)) &&
    (!cid  || norm(m.citizenId).includes(cid)));
};

// ─── ข้อมูลสัญญาเดิม (เติมฟิลด์ที่หน้าจอต้องใช้) ─────────────────────
//  startDate · approvedAmount · pendingDisburse (ยอดรอเบิก) · lastPaidTerm
window.CCD_CONTRACT_EXTRA = {
  'L-2022-0455': { startDate: '2022-03-14', approvedAmount: 800000, pendingDisburse: 0,     lastPaidTerm: '36/120', purpose: 'ซื้ออาคารพร้อมที่ดิน' },
  'EM-2024-0771':{ startDate: '2024-02-09', approvedAmount: 50000,  pendingDisburse: 0,     lastPaidTerm: '5/12',   purpose: 'ฉุกเฉิน' },
  'L-2021-0332': { startDate: '2021-05-20', approvedAmount: 600000, pendingDisburse: 50000, lastPaidTerm: '41/96',  purpose: 'การศึกษา' },
  'L-2020-0118': { startDate: '2020-08-11', approvedAmount: 900000, pendingDisburse: 0,     lastPaidTerm: '58/144', purpose: 'ซื้ออาคาร' },
};

// ─── ข้อมูลสัญญา (enrich) ───────────────────────────────────────────
window.ccdContractInfo = (debt) => {
  if (!debt) return null;
  const x = window.CCD_CONTRACT_EXTRA[debt.contractNo] || {};
  const approved = x.approvedAmount || (debt.principalRemaining + debt.paidTerms * debt.installment);
  return {
    contractNo: debt.contractNo,
    loanType: debt.type,
    startDate: x.startDate || '2022-01-01',
    approvedAmount: approved,
    pendingDisburse: x.pendingDisburse || 0,
    outstanding: debt.principalRemaining,
    interestArrears: debt.interestDue,
    installment: debt.installment,
    lastPaidTerm: x.lastPaidTerm || `${debt.paidTerms}/${debt.totalTerms}`,
    paidTerms: debt.paidTerms,
    totalTerms: debt.totalTerms,
    purpose: x.purpose || (window.LOAN_PURPOSES ? window.LOAN_PURPOSES[0] : ''),
  };
};

// ─── หลักประกัน / ผู้ค้ำประกันเดิม (ต่อสัญญา) ───────────────────────
//  type · securityNo (เลขหลักทรัพย์/รหัสผู้ค้ำ) · detail · available (ค้ำคงเหลือ) · guaranteed (ค้ำประกัน)
window.CCD_COLLATERAL = {
  'L-2022-0455': [
    { type: 'person',   securityNo: 'M-058243', detail: 'นายอนุชา สุขสวัสดิ์',    available: 350000, guaranteed: 350000 },
    { type: 'person',   securityNo: 'M-058247', detail: 'นางสาวกานต์ ศิริวงศ์',   available: 350000, guaranteed: 350000 },
    { type: 'share',    securityNo: 'SH-22-0455', detail: 'หุ้นสหกรณ์ออมทรัพย์',   available: 185000, guaranteed: 120000 },
  ],
  'L-2021-0332': [
    { type: 'person',   securityNo: 'M-058241', detail: 'นายสมชาย ใจดี รักษ์ออม',  available: 300000, guaranteed: 300000 },
    { type: 'person',   securityNo: 'M-058244', detail: 'นางวิภา จันทร์เพ็ญ',      available: 300000, guaranteed: 300000 },
  ],
  'L-2020-0118': [
    { type: 'person',   securityNo: 'M-058241', detail: 'นายสมชาย ใจดี รักษ์ออม',  available: 400000, guaranteed: 400000 },
    { type: 'person',   securityNo: 'M-058243', detail: 'นายอนุชา สุขสวัสดิ์',      available: 400000, guaranteed: 400000 },
    { type: 'land',     securityNo: 'LD-2563-014', detail: 'โฉนดที่ดิน เลขที่ 14 อ.เมือง', available: 250000, guaranteed: 200000 },
  ],
  'EM-2024-0771': [
    { type: 'share',    securityNo: 'SH-24-0771', detail: 'หุ้นสหกรณ์ออมทรัพย์',   available: 92000, guaranteed: 50000 },
  ],
};
window.ccdCollateral = (contractNo) => (window.CCD_COLLATERAL[contractNo] || []).map(r => ({ ...r }));

// ─── ประวัติการเปลี่ยนแปลงรายละเอียดสัญญา (ต่อสัญญา) ─────────────────
window.CCD_HISTORY = {
  'L-2022-0455': [
    { docNo: 'CC-69-0014', date: '2026-03-12', by: 'จันทร์เพ็ญ มาลี', summary: 'เพิ่มผู้ค้ำประกัน นางสาวกานต์ ศิริวงศ์', field: 'ผู้ค้ำประกัน' },
    { docNo: 'CC-68-0207', date: '2025-09-01', by: 'อนุวัฒน์ ใจดี',   summary: 'ปรับยอดค้ำประกันหุ้นจาก 80,000 เป็น 120,000', field: 'ยอดค้ำประกัน' },
  ],
  'L-2021-0332': [
    { docNo: 'CC-69-0008', date: '2026-02-18', by: 'จันทร์เพ็ญ มาลี', summary: 'ปรับลดวงเงินค้ำประกันเนื่องจากชำระบางส่วน', field: 'ยอดค้ำประกัน' },
  ],
  'L-2020-0118': [
    { docNo: 'CC-68-0151', date: '2025-07-20', by: 'จันทร์เพ็ญ มาลี', summary: 'เพิ่มหลักประกันที่ดิน โฉนดเลขที่ 14', field: 'หลักประกัน' },
  ],
};
window.ccdHistory = (contractNo) => window.CCD_HISTORY[contractNo] || [];

// ─── เลขที่เอกสาร (auto) — CC-{พ.ศ.ย่อ}-{running 4 หลัก} ────────────
window.ccdNextNo = (beYear) => {
  const yy = String(beYear).slice(-2);
  const n = 18 + Math.floor(Math.random() * 3);
  return `CC-${yy}-${String(n).padStart(4, '0')}`;
};
