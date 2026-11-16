// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ใบสั่งคืนค่าหุ้น (Share Refund Order)
//  ข้อมูลสาธิต: สมาชิก · ทุนเรือนหุ้น (คงเหลือ/ถอนได้) · รูปแบบการจ่ายคืน
//  · รายการหักชำระหนี้ · รายการหักชำระอื่น · โอนหนี้ให้ผู้ค้ำ + ผู้กู้ร่วม
//  namespace: SR_*  /  fmt จาก data.js
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทเงิน (วิธีจ่ายคืนค่าหุ้น) ─────────────────────────────────
window.SRF_PAY_TYPES = [
  { v: 'transfer', l: 'เงินโอนเข้าบัญชี', needBank: true  },
  { v: 'cash',     l: 'เงินสด',           needBank: false },
  { v: 'cheque',   l: 'เช็คธนาคาร',        needBank: true  },
];
window.srfPayType = (v) => window.SRF_PAY_TYPES.find(p => p.v === v) || window.SRF_PAY_TYPES[0];

// ─── ธนาคาร / สาขา / คู่บัญชี ────────────────────────────────────────
window.SRF_BANKS = [
  'ธนาคารกรุงไทย จำกัด (มหาชน)',
  'ธนาคารออมสิน',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
  'ธนาคารกรุงเทพ จำกัด (มหาชน)',
  'ธนาคารกสิกรไทย จำกัด (มหาชน)',
  'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)',
];
window.SRF_BRANCHES = [
  'สาขานนทบุรี',
  'สาขาศูนย์ราชการเฉลิมพระเกียรติ',
  'สาขาแจ้งวัฒนะ',
  'สาขาหลักสี่',
  'สาขาบางเขน',
  'สาขาสำนักงานใหญ่',
];
window.SRF_COUNTER_ACCTS = [
  'เงินฝากออมทรัพย์ - สมาชิก',
  'เงินฝากประจำ - สมาชิก',
  'เงินสดในมือ',
  'เจ้าหนี้ค่าหุ้นค้างจ่าย',
];

// ─── รหัสรายการหักชำระอื่น (เลือกได้ในแถวเพิ่ม) ──────────────────────
window.SRF_DEDUCT_CODES = [
  { code: 'OT001', detail: 'ค่าธรรมเนียมการถอนหุ้น' },
  { code: 'OT002', detail: 'ค่าอากรแสตมป์' },
  { code: 'OT003', detail: 'ค่าปรับชำระล่าช้า' },
  { code: 'OT004', detail: 'เงินค้างชำระอื่น ๆ' },
];

// ─── สถานะหุ้น (ใช้ตรวจสอบก่อนคืนค่าหุ้น) ───────────────────────────
window.SRF_SHARE_STATUS = {
  'ปกติ':     { pill: 'ok',      allow: true,  warn: false },
  'รอถอน':    { pill: 'info',    allow: true,  warn: false },
  'อายัด':    { pill: 'bad',     allow: false, warn: true  },
  'ปิดบัญชี': { pill: 'neutral', allow: false, warn: true  },
};
window.srfShareStatus = (v) => window.SRF_SHARE_STATUS[v] || window.SRF_SHARE_STATUS['ปกติ'];

// ─── สมาชิก + รายละเอียดหุ้น/หนี้/ผู้รับโอน ──────────────────────────
//  debts[]: ต้นเงิน · ดอกเบี้ยตั้งแต่ · ด/บ ค้าง · ด/บ ใหม่
//           + ยอดชำระตั้งต้น (payPrincipal / payInterest)
//  guarantors[]: โอนหนี้ให้ผู้ค้ำประกัน   coBorrowers[]: โอนหนี้ให้ผู้กู้ร่วม
window.SRF_MEMBERS = [
  {
    code: '012345',
    title: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี',
    name: 'นายสมชาย ใจดี',
    citizenId: '3-1020-00457-12-8',
    dept: 'สำนักงานบริการลูกค้า กสท เขตเหนือ', deptCode: '0301',
    memberStatus: 'ลาออก',
    shareBalance: 250000,        // หุ้นคงเหลือ (บาท)
    withdrawable: 250000,        // ยอดถอนได้ (บาท)
    shareStatus: 'ปกติ',
    voucherDate: '2026-05-16',   // วันที่ใบจ่าย
    withdrawDate: '2026-05-16',  // วันที่ถอนหุ้น
    bank: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
    branch: 'สาขานนทบุรี',
    accountNo: '123-4-56789-0',
    counterAcct: 'เงินฝากออมทรัพย์ - สมาชิก',
    debts: [
      { contractNo: 'CL67000123', loanType: 'เงินกู้สามัญ',
        principal: 120000, interestFrom: '2024-05-01', interestArrears: 3450, interestNew: 900,
        payPrincipal: 120000, payInterest: 3450 },
    ],
    otherDeductions: [
      { code: 'OT001', detail: 'ค่าธรรมเนียมการถอนหุ้น', amount: 0, selected: false },
    ],
    guarantors: [
      { contractNo: 'CL67000124', transferee: 'นางสาววิไลวรรณ ใจดี (ผู้ค้ำ)', startDate: '2026-06-01',
        transferPrincipal: 80000, transferInterestArrears: 2350, payPrincipal: 4000, payInterestArrears: 120 },
    ],
    coBorrowers: [
      { contractNo: 'CL67000125', transferee: 'นายกิตติพงษ์ ใจดี (ผู้กู้ร่วม)', startDate: '2026-06-01',
        transferPrincipal: 50000, transferInterestArrears: 1150, payPrincipal: 2500, payInterestArrears: 80 },
    ],
  },
  {
    code: '018842',
    title: 'นาย', firstName: 'อนุชา', lastName: 'สุขสวัสดิ์',
    name: 'นายอนุชา สุขสวัสดิ์',
    citizenId: '3-1019-00188-04-2',
    dept: 'กองปฏิบัติการโครงข่าย', deptCode: '0302',
    memberStatus: 'ปกติ',
    shareBalance: 486000,
    withdrawable: 486000,
    shareStatus: 'ปกติ',
    voucherDate: '2026-05-16',
    withdrawDate: '2026-05-16',
    bank: 'ธนาคารออมสิน',
    branch: 'สาขาแจ้งวัฒนะ',
    accountNo: '020-1-44552-7',
    counterAcct: 'เงินฝากออมทรัพย์ - สมาชิก',
    debts: [
      { contractNo: 'CL67001188', loanType: 'เงินกู้สามัญ',
        principal: 220000, interestFrom: '2024-04-01', interestArrears: 0, interestNew: 1840,
        payPrincipal: 220000, payInterest: 1840 },
      { contractNo: 'CL66005521', loanType: 'เงินกู้ฉุกเฉิน',
        principal: 35000, interestFrom: '2024-12-01', interestArrears: 420, interestNew: 180,
        payPrincipal: 35000, payInterest: 420 },
    ],
    otherDeductions: [
      { code: 'OT001', detail: 'ค่าธรรมเนียมการถอนหุ้น', amount: 300, selected: true },
    ],
    guarantors: [],
    coBorrowers: [],
  },
  {
    code: '021770',
    title: 'นางสาว', firstName: 'กานต์', lastName: 'ศิริวงศ์',
    name: 'นางสาวกานต์ ศิริวงศ์',
    citizenId: '1-1018-00712-90-4',
    dept: 'สำนักทรัพยากรบุคคล', deptCode: '0501',
    memberStatus: 'ปกติ',
    shareBalance: 312500,
    withdrawable: 312500,
    shareStatus: 'อายัด',         // ทดสอบเงื่อนไข: หุ้นถูกอายัด — ห้ามคืน
    voucherDate: '2026-05-16',
    withdrawDate: '2026-05-16',
    bank: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
    branch: 'สาขาหลักสี่',
    accountNo: '984-2-10034-5',
    counterAcct: 'เงินฝากออมทรัพย์ - สมาชิก',
    debts: [
      { contractNo: 'CL65009921', loanType: 'เงินกู้สามัญ',
        principal: 180000, interestFrom: '2023-07-01', interestArrears: 3400, interestNew: 1280,
        payPrincipal: 0, payInterest: 0 },
    ],
    otherDeductions: [],
    guarantors: [],
    coBorrowers: [],
  },
  {
    code: '024519',
    title: 'นาง', firstName: 'จิราพร', lastName: 'แสงทอง',
    name: 'นางจิราพร แสงทอง',
    citizenId: '3-1016-00591-77-2',
    dept: 'กองบริหารการเงิน', deptCode: '0601',
    memberStatus: 'ปกติ',
    shareBalance: 158000,
    withdrawable: 158000,
    shareStatus: 'ปกติ',
    voucherDate: '2026-05-16',
    withdrawDate: '2026-05-16',
    bank: '',
    branch: '',
    accountNo: '',
    counterAcct: 'เงินสดในมือ',
    debts: [],   // ไม่มีหนี้ — คืนได้เต็มจำนวน
    otherDeductions: [],
    guarantors: [],
    coBorrowers: [],
  },
];

// ─── ค้นหาสมาชิก (รหัส/ชื่อ/นามสกุล/บัตร/หน่วยงาน) ───────────────────
window.srfSearchMembers = (q) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const n = norm(q);
  if (!n) return window.SRF_MEMBERS;
  return window.SRF_MEMBERS.filter(m =>
    norm(m.code).includes(n) ||
    norm(m.name).includes(n) ||
    norm(m.citizenId).includes(n) ||
    norm(m.dept).includes(n));
};
window.srfMember = (code) => window.SRF_MEMBERS.find(m => m.code === code) || null;

// ─── เลขที่ใบสั่งคืนค่าหุ้น (auto) — RS-{พ.ศ.}-{running 6 หลัก} ──────
window.srfNextDocNo = (beYear) => {
  const running = 215; // เดโม: เลขรันถัดไป
  return `RS-${beYear}-${String(running).padStart(6, '0')}`;
};
