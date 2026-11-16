// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — แจ้งให้ชำระหนี้
//  ข้อมูลสาธิต: ผู้ลงนาม · สาเหตุที่ติดตาม · สมาชิกลูกหนี้ค้างชำระ
//  + สัญญา/หนี้ค้าง + ผู้ค้ำประกัน + ทะเบียนหนังสือแจ้งชำระหนี้
// ════════════════════════════════════════════════════════════════════

// ─── ผู้มีอำนาจลงนาม (ผู้ลงนาม → ตำแหน่งอัตโนมัติ) ───────────────────
window.DN_SIGNERS = [
  { name: 'นายประสิทธิ์ คงทอง',        position: 'ผู้จัดการสหกรณ์' },
  { name: 'นางสาวอุไรวรรณ เพชรรัตน์', position: 'รองผู้จัดการ' },
  { name: 'นายสมศักดิ์ ธนวัฒน์',        position: 'ประธานกรรมการดำเนินการ' },
  { name: 'นางพิมพ์ใจ สุวรรณโชติ',     position: 'หัวหน้าฝ่ายติดตามหนี้' },
];

// ─── สาเหตุที่ติดตาม (Dropdown — ผู้ดูแลเพิ่ม/แก้ไข/ปิดใช้งานได้) ─────
window.DN_CAUSES = [
  { code: 'C01', label: 'ค้างชำระเงินกู้',                 active: true },
  { code: 'C02', label: 'ค้างชำระหลายงวด',               active: true },
  { code: 'C03', label: 'ขาดส่งชำระ',                     active: true },
  { code: 'C04', label: 'พ้นสภาพแต่ยังมีหนี้ค้าง',         active: true },
  { code: 'C05', label: 'ลาออกแต่ยังมีหนี้ค้าง',           active: true },
  { code: 'C06', label: 'ถูกให้ออก / ไล่ออก',             active: true },
  { code: 'C07', label: 'ตายและยังมีหนี้ค้าง',            active: true },
  { code: 'C08', label: 'เรียกเก็บจากผู้ค้ำประกัน',        active: true },
  { code: 'C09', label: 'บอกเลิกสัญญา',                   active: true },
  { code: 'C10', label: 'ปรับโครงสร้างหนี้ผิดเงื่อนไข',    active: true },
  { code: 'C11', label: 'หยุดเก็บหนี้ครบกำหนดแล้ว',       active: true },
  { code: 'C12', label: 'เปิดเก็บหนี้ตามคำพิพากษา',       active: true },
  { code: 'C99', label: 'อื่น ๆ',                          active: true },
];
window.dnCause = (code) => window.DN_CAUSES.find(c => c.code === code) || null;

// ─── สถานะรายการติดตาม ──────────────────────────────────────────────
window.DN_STATUS = [
  { v: 'draft',   step: 0, l: 'บันทึกแล้ว — รอพิมพ์', pill: 'neutral' },
  { v: 'printed', step: 1, l: 'พิมพ์หนังสือแล้ว',      pill: 'info' },
  { v: 'closed',  step: 2, l: 'ปิดรายการ (ชำระครบ)',   pill: 'ok' },
  { v: 'cancelled', step: 3, l: 'ยกเลิกหนังสือ',        pill: 'bad' },
];
window.dnStatus = (v) => window.DN_STATUS.find(s => s.v === v) || window.DN_STATUS[0];

// ─── สถานะสมาชิก (ใช้ตรวจก่อนพิมพ์) ────────────────────────────────
window.DN_MEMBER_STATUS = {
  'ปกติ':      { pill: 'ok',      warn: false },
  'ลาออก':     { pill: 'warn',    warn: true },
  'พ้นสภาพ':   { pill: 'warn',    warn: true },
  'ถูกให้ออก': { pill: 'bad',     warn: true },
  'เสียชีวิต':  { pill: 'bad',     warn: true },
};

// ─── ค่ากำหนดวันครบกำหนด (BR-04) ────────────────────────────────────
window.DN_DUE_PRESETS = [30, 60, 90];

// ─── สมาชิกลูกหนี้ค้างชำระ (ค้นหาด้วยเลขสมาชิก/ชื่อ) ────────────────
//  debts[]: ยอดค้างชำระแยกตามสัญญา + breakdown (เงินต้น/ดอกเบี้ย/ค่าปรับ)
//  guarantors[]: ผู้ค้ำประกันต่อสัญญา (ดึงเข้าตารางสำเนาเรียนอัตโนมัติ)
window.DN_MEMBERS = [
  {
    code: 'M-067012',
    title: 'นาย', firstName: 'วิรัตน์', lastName: 'ทองสุข',
    name: 'นายวิรัตน์ ทองสุข',
    citizenId: '3-1020-00457-12-8',
    dept: 'กองช่าง', deptCode: '0301',
    memberType: 'สมาชิกปกติ',
    status: 'ปกติ',
    joinDate: '2014-06-01',
    shares: 185000,        // ทุนเรือนหุ้น
    debts: [
      { type: 'เงินกู้สามัญ', contractNo: 'L-2022-0455', status: 'ผิดนัดชำระ',
        principalRemaining: 458200, interestDue: 12480, penalty: 1860,
        overdueInstallments: 4, installment: 9680, totalTerms: 120, paidTerms: 36,
        lastPayDate: '2025-11-25', dueDate: '2026-04-25', arrears: 40580,
        guarantors: [
          { memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',  dept: 'กองช่าง',        prefix: '' },
          { memberCode: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', dept: 'กองการศึกษา',   prefix: '' },
        ] },
      { type: 'เงินกู้ฉุกเฉิน', contractNo: 'EM-2024-0771', status: 'ค้างชำระ',
        principalRemaining: 18600, interestDue: 540, penalty: 220,
        overdueInstallments: 3, installment: 3120, totalTerms: 12, paidTerms: 5,
        lastPayDate: '2025-12-25', dueDate: '2026-03-25', arrears: 9580,
        guarantors: [
          { memberCode: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', dept: 'กองคลัง', prefix: '' },
        ] },
      { type: 'เงินกู้พิเศษ', contractNo: 'SP-2021-0144', status: 'ผิดนัดชำระ',
        principalRemaining: 372000, interestDue: 9240, penalty: 1500,
        overdueInstallments: 5, installment: 7600, totalTerms: 120, paidTerms: 42,
        lastPayDate: '2025-10-25', dueDate: '2026-03-25', arrears: 38000,
        guarantors: [
          { memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง', prefix: '' },
        ] },
      { type: 'กู้หุ้น', contractNo: 'SH-2023-0210', status: 'ปกติ',
        principalRemaining: 96000, interestDue: 0, penalty: 0,
        overdueInstallments: 0, installment: 4200, totalTerms: 36, paidTerms: 13,
        lastPayDate: '2026-05-25', dueDate: '2026-06-25', arrears: 0,
        guarantors: [] },
    ],
  },
  {
    code: 'M-066238',
    title: 'นางสาว', firstName: 'สุดารัตน์', lastName: 'พงษ์ไพบูลย์',
    name: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    citizenId: '1-1018-00712-90-4',
    dept: 'กองการศึกษา', deptCode: '0501',
    memberType: 'สมาชิกปกติ',
    status: 'ลาออก',
    joinDate: '2016-02-15',
    shares: 92000,
    debts: [
      { type: 'เงินกู้สามัญ', contractNo: 'L-2021-0332', status: 'บอกเลิกสัญญา',
        principalRemaining: 276400, interestDue: 18920, penalty: 3400,
        overdueInstallments: 8, installment: 6450, totalTerms: 96, paidTerms: 41,
        lastPayDate: '2025-07-25', dueDate: '2026-03-25', arrears: 55000,
        guarantors: [
          { memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: '' },
          { memberCode: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ',       dept: 'กองคลัง สำนักงานปลัด', prefix: '' },
        ] },
    ],
  },
  {
    code: 'M-065471',
    title: 'นาย', firstName: 'ประเสริฐ', lastName: 'ชูเกียรติ',
    name: 'นายประเสริฐ ชูเกียรติ',
    citizenId: '3-1017-00238-44-1',
    dept: 'สำนักงานปลัด', deptCode: '0801',
    memberType: 'สมาชิกปกติ',
    status: 'เสียชีวิต',
    joinDate: '2011-09-01',
    shares: 134500,
    debts: [
      { type: 'เงินกู้พิเศษ', contractNo: 'L-2020-0118', status: 'ดำเนินคดี',
        principalRemaining: 612000, interestDue: 41280, penalty: 8600,
        overdueInstallments: 12, installment: 8200, totalTerms: 144, paidTerms: 58,
        lastPayDate: '2025-03-25', dueDate: '2026-03-25', arrears: 107000,
        guarantors: [
          { memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: 'ทายาท ' },
          { memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',     dept: 'กองช่าง',              prefix: '' },
        ] },
    ],
  },
  {
    code: 'M-064120',
    title: 'นาง', firstName: 'จิราพร', lastName: 'แสงทอง',
    name: 'นางจิราพร แสงทอง',
    citizenId: '3-1016-00591-77-2',
    dept: 'กองสาธารณสุข', deptCode: '0601',
    memberType: 'สมาชิกปกติ',
    status: 'ปกติ',
    joinDate: '2018-05-01',
    shares: 64000,
    debts: [],   // ไม่มีหนี้ค้าง — ใช้ทดสอบเงื่อนไข "ไม่พบรายการหนี้ค้างชำระ"
  },
];

// ─── ค้นหาสมาชิกสำหรับ popup (รหัส/ชื่อ/นามสกุล/บัตร/หน่วยงาน) ───────
window.dnSearchMembers = (q) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const n = norm(q);
  if (!n) return window.DN_MEMBERS;
  return window.DN_MEMBERS.filter(m =>
    norm(m.code).includes(n) ||
    norm(m.name).includes(n) ||
    norm(m.citizenId).includes(n) ||
    norm(m.dept).includes(n));
};
window.dnMember = (code) => window.DN_MEMBERS.find(m => m.code === code) || null;

// รวมยอดต่อสัญญา (เงินต้น + ดอกเบี้ยค้าง + ค่าปรับ)
window.dnContractTotal = (d) =>
  (Number(d.principalRemaining) || 0) + (Number(d.interestDue) || 0) + (Number(d.penalty) || 0);

// ─── เลขทะเบียนติดตาม (auto) — TRK-{พ.ศ.}-{running 6 หลัก} ──────────
window.dnNextTracking = (list, beYear) => {
  const prefix = `TRK-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n)) return Math.max(mx, n);
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(6, '0');
};

// ─── เลขที่หนังสือ (auto) — ที่ สอ.กสท. {running}/{พ.ศ.} ────────────
window.dnNextDocNo = (list, beYear) => {
  const suffix = `/${beYear}`;
  const max = (list || []).reduce((mx, r) => {
    const s = String(r.seizeNo || '');
    const m = s.match(/(\d+)\/(\d+)$/);
    if (m && m[2] === String(beYear)) return Math.max(mx, parseInt(m[1], 10) || 0);
    return mx;
  }, 0);
  return `สอ.กสท. ${String(max + 1).padStart(4, '0')}${suffix}`;
};

// ─── ทะเบียนหนังสือแจ้งชำระหนี้ (seed) ──────────────────────────────
window.DN_SEED = [
  {
    id: 'TRK-2569-000001', seizeNo: 'สอ.กสท. 0001/2569', round: 1,
    regDate: '2026-05-08', dueDate: '2026-06-07',
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    dept: 'กองการศึกษา', deptCode: '0501', shares: 92000, memberStatus: 'ลาออก',
    causeCode: 'C05', causeOther: '', occurredDate: '2026-01-31',
    signer: 'นายประสิทธิ์ คงทอง', signerPosition: 'ผู้จัดการสหกรณ์',
    debts: [
      { type: 'เงินกู้สามัญ', contractNo: 'L-2021-0332', status: 'บอกเลิกสัญญา',
        principalRemaining: 276400, interestDue: 18920, penalty: 3400,
        overdueInstallments: 8, dueDate: '2026-03-25', arrears: 55000 },
    ],
    guarantors: [
      { contractNo: 'L-2021-0332', memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: '' },
      { contractNo: 'L-2021-0332', memberCode: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ',       dept: 'กองคลัง สำนักงานปลัด', prefix: '' },
    ],
    totalOutstanding: 298720,
    status: 'printed', printCount: 1, printedDate: '2026-05-08', closedDate: null,
    emsNo: 'EH123456789TH',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-08T10:24:00',
  },
  {
    id: 'TRK-2569-000002', seizeNo: 'สอ.กสท. 0002/2569', round: 2,
    regDate: '2026-05-15', dueDate: '2026-07-14',
    memberCode: 'M-065471', memberName: 'นายประเสริฐ ชูเกียรติ',
    dept: 'สำนักงานปลัด', deptCode: '0801', shares: 134500, memberStatus: 'เสียชีวิต',
    causeCode: 'C07', causeOther: '', occurredDate: '2026-02-18',
    signer: 'นายสมศักดิ์ ธนวัฒน์', signerPosition: 'ประธานกรรมการดำเนินการ',
    debts: [
      { type: 'เงินกู้พิเศษ', contractNo: 'L-2020-0118', status: 'ดำเนินคดี',
        principalRemaining: 612000, interestDue: 41280, penalty: 8600,
        overdueInstallments: 12, dueDate: '2026-03-25', arrears: 107000 },
    ],
    guarantors: [
      { contractNo: 'L-2020-0118', memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: 'ทายาท ' },
      { contractNo: 'L-2020-0118', memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',     dept: 'กองช่าง',              prefix: '' },
    ],
    totalOutstanding: 661880,
    status: 'printed', printCount: 2, printedDate: '2026-05-20', closedDate: null,
    emsNo: '', enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-15T14:02:00',
  },
  {
    id: 'TRK-2569-000003', seizeNo: 'สอ.กสท. 0003/2569', round: 1,
    regDate: '2026-06-02', dueDate: '2026-07-02',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    dept: 'กองช่าง', deptCode: '0301', shares: 185000, memberStatus: 'ปกติ',
    causeCode: 'C02', causeOther: '', occurredDate: '2026-04-25',
    signer: 'นายประสิทธิ์ คงทอง', signerPosition: 'ผู้จัดการสหกรณ์',
    debts: [
      { type: 'เงินกู้สามัญ', contractNo: 'L-2022-0455', status: 'ผิดนัดชำระ',
        principalRemaining: 458200, interestDue: 12480, penalty: 1860,
        overdueInstallments: 4, dueDate: '2026-04-25', arrears: 40580 },
    ],
    guarantors: [
      { contractNo: 'L-2022-0455', memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',  dept: 'กองช่าง',      prefix: '' },
      { contractNo: 'L-2022-0455', memberCode: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', dept: 'กองการศึกษา', prefix: '' },
    ],
    totalOutstanding: 472540,
    status: 'draft', printCount: 0, printedDate: null, closedDate: null,
    emsNo: '', enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-06-02T09:10:00',
  },
];

// ─── โหลด/บันทึก localStorage ───────────────────────────────────────
window.dnLoad = () => {
  try {
    const saved = localStorage.getItem('debt_notices');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.DN_SEED.map(r => ({ ...r }));
};
window.dnSaveLS = (list) => {
  try { localStorage.setItem('debt_notices', JSON.stringify(list)); } catch (e) {}
};

// ─── ข้อความแจ้งเตือนให้ชำระหนี้ (เนื้อความหนังสือ) ──────────────────
window.dnNoticeBody = (rec) => {
  const cause = (window.dnCause(rec.causeCode) || {}).label || '';
  const causeTxt = rec.causeCode === 'C99' ? (rec.causeOther || cause) : cause;
  return `ตามที่ท่านเป็นสมาชิกและมีภาระหนี้กับสหกรณ์ออมทรัพย์ ปรากฏว่าท่าน${causeTxt} ` +
    `รวมเป็นเงินที่ค้างชำระทั้งสิ้น ${fmt.money(rec.totalOutstanding, 2)} บาท ` +
    `(${window.bahtText(rec.totalOutstanding)}) นั้น`;
};
