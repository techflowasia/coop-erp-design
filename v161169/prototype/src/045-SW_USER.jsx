// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ประมาณการถอนหุ้น
//  ข้อมูลสาธิต: สมาชิก · หุ้นคงเหลือ/สถานะหุ้น · สัญญาหนี้ (ต้นเงิน/ดอกเบี้ย)
//  · รายการหักอื่น · ประมาณการโอนหนี้ผู้ค้ำ + ผู้ค้ำร่วม · ธนาคาร/คู่บัญชี
// ════════════════════════════════════════════════════════════════════

// ─── ผู้บันทึก (ล็อกอินปัจจุบัน) ─────────────────────────────────────
window.SW_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── ประเภทการจ่ายเงินคืนหุ้น ────────────────────────────────────────
window.SW_PAY_TYPES = [
  { v: 'cash',     l: 'เงินสด',            needBank: false },
  { v: 'transfer', l: 'โอนเข้าบัญชีธนาคาร', needBank: true  },
  { v: 'cheque',   l: 'เช็ค',              needBank: true  },
];
window.swPayType = (v) => window.SW_PAY_TYPES.find(p => p.v === v) || window.SW_PAY_TYPES[0];

// ─── ธนาคาร / สาขา / คู่บัญชี ────────────────────────────────────────
window.SW_BANKS = [
  'ธนาคารกรุงไทย จำกัด (มหาชน)',
  'ธนาคารออมสิน',
  'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
  'ธนาคารกรุงเทพ จำกัด (มหาชน)',
  'ธนาคารกสิกรไทย จำกัด (มหาชน)',
  'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)',
];
window.SW_BRANCHES = [
  'สาขาศูนย์ราชการเฉลิมพระเกียรติ',
  'สาขาแจ้งวัฒนะ',
  'สาขาหลักสี่',
  'สาขาบางเขน',
  'สาขาสำนักงานใหญ่',
];
window.SW_COUNTER_ACCTS = [
  '210201 — เงินฝากธนาคาร · กระแสรายวัน',
  '210202 — เงินฝากธนาคาร · ออมทรัพย์',
  '110101 — เงินสดในมือ',
  '230401 — เจ้าหนี้ค่าหุ้นค้างจ่าย',
];

// ─── สถานะหุ้น (ใช้ตรวจสอบก่อนถอน) ──────────────────────────────────
window.SW_SHARE_STATUS = {
  'ปกติ':     { pill: 'ok',      allow: true,  warn: false },
  'รอถอน':    { pill: 'info',    allow: true,  warn: false },
  'อายัด':    { pill: 'bad',     allow: false, warn: true  },
  'ปิดบัญชี': { pill: 'neutral', allow: false, warn: true  },
};
window.swShareStatus = (v) => window.SW_SHARE_STATUS[v] || window.SW_SHARE_STATUS['ปกติ'];

// ─── สถานะสมาชิก (ใช้ตรวจสอบก่อนถอนหุ้น) ────────────────────────────
window.SW_MEMBER_STATUS = {
  'ปกติ':      { pill: 'ok',   warn: false },
  'ลาออก':     { pill: 'warn', warn: true  },
  'พ้นสภาพ':   { pill: 'warn', warn: true  },
  'เสียชีวิต': { pill: 'bad',  warn: true  },
};
window.swMemberStatus = (v) => window.SW_MEMBER_STATUS[v] || window.SW_MEMBER_STATUS['ปกติ'];

// ─── สมาชิก + รายละเอียดหุ้น/หนี้สำหรับประมาณการถอนหุ้น ───────────────
//  debts[]: ต้นเงินคงเหลือ · ดอกเบี้ยตั้งแต่ · ด/บ ที่คิดได้ · ด/บ ค้าง
//           + ยอดชำระตั้งต้น (payPrincipal / payInterest)
//  guarTransfer[]: สัญญาที่ต้องโอนหนี้ไปยังผู้ค้ำ (เมื่อหุ้นไม่พอชำระ)
//  coGuarantors[]: ผู้ค้ำประกันร่วม
window.SW_MEMBERS = [
  {
    code: 'M-058241',
    title: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี',
    name: 'นายสมชาย ใจดี',
    citizenId: '3-1020-00457-12-8',
    dept: 'สำนักพัฒนาทุนและองค์กรการเงินชุมชน', deptCode: '0301',
    memberStatus: 'ลาออก',
    joinDate: '2007-06-01',
    shareBalance: 1250000,        // หุ้นคงเหลือ (บาท)
    shareStatus: 'ปกติ',
    voucherDate: '2026-05-24',    // วันที่ใบสำคัญจ่าย
    bank: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
    branch: 'สาขาศูนย์ราชการเฉลิมพระเกียรติ',
    accountNo: '123-4-56789-0',
    counterAcct: '210201 — เงินฝากธนาคาร · กระแสรายวัน',
    debts: [
      { contractNo: 'LN66012345', loanType: 'เงินกู้สามัญ',
        principal: 300000, interestFrom: '2023-01-01', interestCalc: 12345.67, interestArrears: 2345.67,
        payPrincipal: 200000, payInterest: 2345.67 },
      { contractNo: 'LN65004567', loanType: 'เงินกู้พิเศษ',
        principal: 200000, interestFrom: '2023-01-01', interestCalc: 8765.43, interestArrears: 1234.56,
        payPrincipal: 150000, payInterest: 1234.56 },
      { contractNo: 'LN64007890', loanType: 'เงินกู้ฉุกเฉิน',
        principal: 100000, interestFrom: '2023-01-01', interestCalc: 5432.10, interestArrears: 432.10,
        payPrincipal: 100000, payInterest: 432.10 },
    ],
    otherDeductions: [
      { code: 'D001', detail: 'ค่าธรรมเนียมการถอนหุ้น', amount: 500 },
    ],
    guarTransfer: [
      { contractNo: 'LN66012345', memberCode: 'M-009876', name: 'นางสาวเดือนเพ็ญ รักดี', dept: 'กองคลัง',
        transferPrincipal: 100000, transferInterestArrears: 2345.67, payPrincipal: 5000, payInterestArrears: 250 },
    ],
    coGuarantors: [
      { contractNo: 'LN66012345', memberCode: 'M-005432', name: 'นายวิชิต มั่นคง', dept: 'กองแผนงาน',
        transferPrincipal: 50000, transferInterestArrears: 1000, payPrincipal: 2500, payInterestArrears: 125 },
    ],
  },
  {
    code: 'M-058243',
    title: 'นาย', firstName: 'อนุชา', lastName: 'สุขสวัสดิ์',
    name: 'นายอนุชา สุขสวัสดิ์',
    citizenId: '3-1019-00188-04-2',
    dept: 'กองช่าง', deptCode: '0302',
    memberStatus: 'ปกติ',
    joinDate: '2012-03-15',
    shareBalance: 486000,
    shareStatus: 'ปกติ',
    voucherDate: '2026-05-24',
    bank: 'ธนาคารออมสิน',
    branch: 'สาขาแจ้งวัฒนะ',
    accountNo: '020-1-44552-7',
    counterAcct: '210201 — เงินฝากธนาคาร · กระแสรายวัน',
    debts: [
      { contractNo: 'LN67001188', loanType: 'เงินกู้สามัญ',
        principal: 220000, interestFrom: '2024-04-01', interestCalc: 6420.55, interestArrears: 0,
        payPrincipal: 220000, payInterest: 6420.55 },
    ],
    otherDeductions: [
      { code: 'D001', detail: 'ค่าธรรมเนียมการถอนหุ้น', amount: 300 },
    ],
    guarTransfer: [],
    coGuarantors: [],
  },
  {
    code: 'M-058246',
    title: 'นางสาว', firstName: 'กานต์', lastName: 'ศิริวงศ์',
    name: 'นางสาวกานต์ ศิริวงศ์',
    citizenId: '1-1018-00712-90-4',
    dept: 'กองการศึกษา', deptCode: '0501',
    memberStatus: 'ปกติ',
    joinDate: '2015-08-01',
    shareBalance: 312500,
    shareStatus: 'อายัด',         // ทดสอบเงื่อนไข: หุ้นถูกอายัด — ห้ามถอน
    voucherDate: '2026-05-20',
    bank: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
    branch: 'สาขาหลักสี่',
    accountNo: '984-2-10034-5',
    counterAcct: '210201 — เงินฝากธนาคาร · กระแสรายวัน',
    debts: [
      { contractNo: 'LN65009921', loanType: 'เงินกู้สามัญ',
        principal: 180000, interestFrom: '2023-07-01', interestCalc: 9120.00, interestArrears: 3400.00,
        payPrincipal: 0, payInterest: 0 },
    ],
    otherDeductions: [],
    guarTransfer: [],
    coGuarantors: [],
  },
  {
    code: 'M-058250',
    title: 'นาง', firstName: 'จิราพร', lastName: 'แสงทอง',
    name: 'นางจิราพร แสงทอง',
    citizenId: '3-1016-00591-77-2',
    dept: 'กองสาธารณสุข', deptCode: '0601',
    memberStatus: 'ปกติ',
    joinDate: '2019-01-10',
    shareBalance: 158000,
    shareStatus: 'ปกติ',
    voucherDate: '2026-05-24',
    bank: '',
    branch: '',
    accountNo: '',
    counterAcct: '110101 — เงินสดในมือ',
    debts: [],   // ไม่มีหนี้ — ถอนได้เต็มจำนวน
    otherDeductions: [],
    guarTransfer: [],
    coGuarantors: [],
  },
];

// ─── ค้นหาสมาชิก (รหัส/ชื่อ/นามสกุล/บัตร/หน่วยงาน) ───────────────────
window.swSearchMembers = (q) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const n = norm(q);
  if (!n) return window.SW_MEMBERS;
  return window.SW_MEMBERS.filter(m =>
    norm(m.code).includes(n) ||
    norm(m.name).includes(n) ||
    norm(m.citizenId).includes(n) ||
    norm(m.dept).includes(n));
};
window.swMember = (code) => window.SW_MEMBERS.find(m => m.code === code) || null;

// ─── เลขที่ใบประมาณการถอนหุ้น (auto) — WD-{พ.ศ.}-{running 6 หลัก} ─────
window.swNextDocNo = (beYear) => {
  const running = 487; // เดโม: เลขรันถัดไป
  return `WD-${beYear}-${String(running).padStart(6, '0')}`;
};
