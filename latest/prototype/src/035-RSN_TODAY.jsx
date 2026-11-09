// ════════════════════════════════════════════════════════════════════
//  ข้อมูล — บันทึกข้อมูลลาออก (Member Resignation)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  สมาชิก + รายละเอียดหุ้น / เงินฝาก / สัญญาเงินกู้ / การค้ำประกัน
//  เพื่อใช้ตรวจสอบภาระผูกพันก่อนอนุมัติการลาออก
// ════════════════════════════════════════════════════════════════════

// ─── วันทำการ / ผู้ป้อน ─────────────────────────────────────────────
window.RSN_TODAY = (typeof window.DEPOSIT_WORKING_DATE === 'string' && window.DEPOSIT_WORKING_DATE) || '2026-06-21';
window.rsnToday = () => window.RSN_TODAY;
window.RSN_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';
window.rsnBeYear = (iso) => new Date(iso || window.RSN_TODAY).getFullYear() + 543;

// ─── เลขที่คำร้องลาออก (auto) — RSG-{พ.ศ.}-{running 6 หลัก} ─────────
window.rsnNextDocNo = (beYear) => {
  const yy = beYear || window.rsnBeYear();
  const running = 87 + Math.floor(Math.random() * 5);
  return `RSG-${yy}-${String(running).padStart(6, '0')}`;
};

// ─── สถานะใบคำร้อง ──────────────────────────────────────────────────
window.RSN_STATUS = [
  { v: 'pending',  l: 'รออนุมัติ',     pill: 'warn' },
  { v: 'approved', l: 'อนุมัติแล้ว',   pill: 'ok' },
  { v: 'rejected', l: 'ไม่อนุมัติ',    pill: 'bad' },
  { v: 'cancelled',l: 'ยกเลิกคำร้อง',  pill: 'neutral' },
];
window.rsnStatus = (v) => window.RSN_STATUS.find(s => s.v === v) || window.RSN_STATUS[0];

// ─── สาเหตุลาออก (จากการเป็นสมาชิก) ─────────────────────────────────
window.RSN_REASONS = [
  { v: 'voluntary', l: 'ลาออกโดยสมัครใจ' },
  { v: 'retire',    l: 'เกษียณอายุ' },
  { v: 'transfer',  l: 'โอน / ย้ายหน่วยงานออกนอกสังกัด' },
  { v: 'death',     l: 'เสียชีวิต' },
  { v: 'dismiss',   l: 'ถูกให้ออก / ไล่ออก' },
  { v: 'other',     l: 'อื่น ๆ' },
];

// ─── สาเหตุลาออกจากงาน (ต้นสังกัด) ──────────────────────────────────
window.RSN_WORK_REASONS = [
  { v: 'none',     l: 'ไม่ระบุ' },
  { v: 'resign',   l: 'ลาออกจากงาน' },
  { v: 'retire',   l: 'เกษียณอายุราชการ' },
  { v: 'transfer', l: 'โอนย้ายหน่วยงาน' },
  { v: 'layoff',   l: 'ถูกเลิกจ้าง / ให้ออก' },
];

// ─── รายชื่อสมาชิก + รายละเอียดภาระผูกพัน ───────────────────────────
//  shares[]    : { type, valuePerShare, units, capital, monthly }
//  deposits[]  : { accNo, type, openDate, balance, status }
//  loans[]     : { contractNo, type, approvedAmount, outstanding, installment, startDate, status, rate, interestDue }
//  guarantees[]: { contractNo, reqNo, debtorCode, debtorName, dept, loanType, outstanding, guarPct, guaranteed, status }
window.RSN_MEMBERS = [
  {
    code: 'M-067012',
    title: 'นาย', firstName: 'วิรัตน์', lastName: 'ทองสุข',
    name: 'นายวิรัตน์ ทองสุข',
    citizenId: '3-1020-00457-12-8',
    dept: 'กองช่าง', deptCode: '0301',
    memberType: 'สมาชิกปกติ', status: 'ปกติ',
    joinDate: '2014-06-01', deathDate: null,
    shares: [
      { type: 'หุ้นสามัญ',  valuePerShare: 10, units: 18500, capital: 185000, monthly: 1000 },
      { type: 'หุ้นสะสมพิเศษ', valuePerShare: 10, units: 4200,  capital: 42000,  monthly: 300 },
    ],
    deposits: [
      { accNo: '001-2-04571', type: 'ออมทรัพย์',        openDate: '2014-07-01', balance: 128450.75, status: 'ใช้งาน' },
      { accNo: '003-1-00892', type: 'ออมทรัพย์พิเศษ',   openDate: '2019-03-12', balance: 540200.00, status: 'ใช้งาน' },
    ],
    loans: [
      { contractNo: 'L-2022-0455', type: 'เงินกู้สามัญ',  approvedAmount: 900000, outstanding: 458200, installment: 9680, startDate: '2022-03-25', status: 'ปกติ', rate: 6.25, interestDue: 0 },
      { contractNo: 'EM-2024-0771', type: 'เงินกู้ฉุกเฉิน', approvedAmount: 50000,  outstanding: 18600,  installment: 3120, startDate: '2024-08-25', status: 'ค้างชำระ', rate: 6.50, interestDue: 403.00 },
    ],
    guarantees: [
      { contractNo: 'ฉฉ้6ู010708', reqNo: '048509', debtorCode: 'M-048509', debtorName: 'นางธัชชนก วสุธนพิเซุ', dept: 'กองคลัง',     loanType: 'เงินกู้ฉุกเฉิน', outstanding: 347000.00,  guarPct: 100.00, guaranteed: 347000.00, status: 'อนุมัติ' },
      { contractNo: 'ส666000624', reqNo: '048509', debtorCode: 'M-048509', debtorName: 'นางธัชชนก วสุธนพิเซุ', dept: 'กองคลัง',     loanType: 'เงินกู้สามัญ', outstanding: 860038.37,  guarPct: 25.00,  guaranteed: 215009.59, status: 'อนุมัติ' },
      { contractNo: 'ส668001275', reqNo: '048511', debtorCode: 'M-048511', debtorName: 'นายมงคล สุจิมงคล', dept: 'กองช่าง',      loanType: 'เงินกู้สามัญ', outstanding: 1387930.00, guarPct: 28.13, guaranteed: 390425.05, status: 'อนุมัติ' },
      { contractNo: 'ส669002745', reqNo: '046299', debtorCode: 'M-046299', debtorName: 'นายสมบัติ โสมภี', dept: 'สำนักงานปลัด',  loanType: 'เงินกู้สามัญ', outstanding: 1493720.00, guarPct: 28.13, guaranteed: 420184.98, status: 'อนุมัติ' },
      { contractNo: 'สจ67000643', reqNo: '048509', debtorCode: 'M-048509', debtorName: 'นางธัชชนก วสุธนพิเซุ', dept: 'กองคลัง',     loanType: 'เงินกู้สามัญ', outstanding: 316299.20,  guarPct: 100.00, guaranteed: 316299.20, status: 'อนุมัติ' },
      { contractNo: 'สฉ63000053', reqNo: '048509', debtorCode: 'M-048509', debtorName: 'นางธัชชนก วสุธนพิเซุ', dept: 'กองคลัง',     loanType: 'เงินกู้ฉุกเฉิน', outstanding: 113303.00,  guarPct: 100.00, guaranteed: 113303.00, status: 'อนุมัติ' },
      { contractNo: 'สจ69005727', reqNo: '048509', debtorCode: 'M-048509', debtorName: 'นางธัชชนก วสุธนพิเซุ', dept: 'กองคลัง',     loanType: 'เงินกู้สามัญ', outstanding: 292370.75,  guarPct: 100.00, guaranteed: 292370.75, status: 'อนุมัติ' },
    ],
  },
  {
    code: 'M-064120',
    title: 'นาง', firstName: 'จิราพร', lastName: 'แสงทอง',
    name: 'นางจิราพร แสงทอง',
    citizenId: '3-1016-00591-77-2',
    dept: 'กองสาธารณสุข', deptCode: '0601',
    memberType: 'สมาชิกปกติ', status: 'ปกติ',
    joinDate: '2018-05-01', deathDate: null,
    shares: [
      { type: 'หุ้นสามัญ', valuePerShare: 10, units: 6400, capital: 64000, monthly: 500 },
    ],
    deposits: [
      { accNo: '001-2-06120', type: 'ออมทรัพย์', openDate: '2018-05-10', balance: 32180.50, status: 'ใช้งาน' },
    ],
    loans: [],
    guarantees: [],
  },
  {
    code: 'M-065471',
    title: 'นาย', firstName: 'ประเสริฐ', lastName: 'ชูเกียรติ',
    name: 'นายประเสริฐ ชูเกียรติ',
    citizenId: '3-1017-00238-44-1',
    dept: 'สำนักงานปลัด', deptCode: '0801',
    memberType: 'สมาชิกปกติ', status: 'เสียชีวิต',
    joinDate: '2011-09-01', deathDate: '2026-05-18',
    shares: [
      { type: 'หุ้นสามัญ', valuePerShare: 10, units: 13450, capital: 134500, monthly: 800 },
    ],
    deposits: [
      { accNo: '001-2-05471', type: 'ออมทรัพย์',      openDate: '2011-10-01', balance: 74900.00, status: 'ใช้งาน' },
      { accNo: '004-1-00231', type: 'ฝากประจำ 12 เดือน', openDate: '2023-01-15', balance: 300000.00, status: 'ใช้งาน' },
    ],
    loans: [
      { contractNo: 'L-2020-0118', type: 'เงินกู้พิเศษ', approvedAmount: 1200000, outstanding: 612000, installment: 8200, startDate: '2020-02-25', status: 'ดำเนินคดี', rate: 7.00, interestDue: 35700.00 },
    ],
    guarantees: [
      { contractNo: 'ส666000455', reqNo: '067012', debtorCode: 'M-067012', debtorName: 'นายวิรัตน์ ทองสุข', dept: 'กองช่าง', loanType: 'เงินกู้สามัญ', outstanding: 229100, guarPct: 100.00, guaranteed: 229100, status: 'อนุมัติ' },
    ],
  },
];

// ─── ค้นหาสมาชิก (popup กลาง — เกณฑ์ รหัส/ชื่อ/นามสกุล/บัตร) ─────────
window.rsnSearchMembers = (c) => {
  c = c || {};
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  return window.RSN_MEMBERS.filter(m => {
    if (c.code && !norm(m.code).includes(norm(c.code))) return false;
    if (c.firstName && !norm(m.firstName).includes(norm(c.firstName))) return false;
    if (c.lastName && !norm(m.lastName).includes(norm(c.lastName))) return false;
    if (c.citizenId && !norm(m.citizenId).includes(norm(c.citizenId))) return false;
    return true;
  });
};

// ─── สรุปยอดต่อสมาชิก (ใช้ในการ์ดสรุป + ตรวจสอบเงื่อนไข) ────────────
window.rsnSummary = (m) => {
  if (!m) return null;
  const shareMonthly = (m.shares || []).reduce((s, r) => s + (Number(r.monthly) || 0), 0);
  const shareCapital = (m.shares || []).reduce((s, r) => s + (Number(r.capital) || 0), 0);
  const shareUnits   = (m.shares || []).reduce((s, r) => s + (Number(r.units) || 0), 0);
  const depositCount = (m.deposits || []).length;
  const depositTotal = (m.deposits || []).reduce((s, r) => s + (Number(r.balance) || 0), 0);
  const loanCount    = (m.loans || []).length;
  const loanOutstanding = (m.loans || []).reduce((s, r) => s + (Number(r.outstanding) || 0), 0);
  const guarCount    = (m.guarantees || []).length;
  const guarTotal    = (m.guarantees || []).reduce((s, r) => s + (Number(r.guaranteed) || 0), 0);
  return {
    shareMonthly, shareCapital, shareUnits,
    depositCount, depositTotal,
    loanCount, loanOutstanding,
    guarCount, guarTotal,
  };
};
