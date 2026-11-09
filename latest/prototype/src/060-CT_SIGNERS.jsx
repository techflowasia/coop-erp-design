// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — บอกเลิกสัญญา (Contract Termination)
//  ข้อมูลสาธิต: ผู้ลงนาม · กรณีบอกเลิก · สถานะรายการ
//  + รายการสัญญาที่ผิดนัดชำระ (worklist) + ผู้ค้ำประกัน + ทะเบียนหนังสือบอกเลิก
// ════════════════════════════════════════════════════════════════════

// ─── ผู้มีอำนาจลงนาม (ผู้ลงนาม → ตำแหน่งอัตโนมัติ) ───────────────────
window.CT_SIGNERS = [
  { name: 'นายประสิทธิ์ คงทอง',        position: 'ผู้จัดการสหกรณ์' },
  { name: 'นางสาวอุไรวรรณ เพชรรัตน์', position: 'รองผู้จัดการ' },
  { name: 'นายสมศักดิ์ ธนวัฒน์',        position: 'ประธานกรรมการดำเนินการ' },
  { name: 'นางพิมพ์ใจ สุวรรณโชติ',     position: 'หัวหน้าฝ่ายติดตามหนี้' },
];

// ─── กรณีบอกเลิกสัญญา (Dropdown) ────────────────────────────────────
//  requiresResolution = ต้องอ้างอิงมติ คสอ. · heir = แสดงข้อมูลทายาท (BR-08)
window.CT_CASES = [
  { code: 'TC01', label: 'ผู้กู้ปฏิบัติงานอยู่',                  requiresResolution: true,  heir: false, active: true },
  { code: 'TC02', label: 'ผู้กู้ลาออก',                          requiresResolution: true,  heir: false, active: true },
  { code: 'TC02B', label: 'ผู้กู้ถูกให้ออก',                      requiresResolution: true,  heir: false, active: true },
  { code: 'TC02C', label: 'ผู้กู้ถูกไล่ออก',                      requiresResolution: true,  heir: false, active: true },
  { code: 'TC03', label: 'ผู้กู้เสียชีวิต',                       requiresResolution: true,  heir: true,  active: true },
  { code: 'TC04', label: 'ผู้กู้ผิดนัดชำระหนี้',                  requiresResolution: false, heir: false, active: true },
  { code: 'TC05', label: 'ผู้กู้ขาดส่งหลายงวด',                  requiresResolution: false, heir: false, active: true },
  { code: 'TC06', label: 'ผู้กู้ไม่ปฏิบัติตามเงื่อนไขสัญญา',      requiresResolution: false, heir: false, active: true },
  { code: 'TC07', label: 'ผู้กู้ผิดเงื่อนไขปรับโครงสร้างหนี้',    requiresResolution: true,  heir: false, active: true },
  { code: 'TC08', label: 'ผู้กู้ถูกให้ออกจากสมาชิกภาพ',          requiresResolution: true,  heir: false, active: true },
  { code: 'TC09', label: 'ผู้กู้ถูกฟ้องร้อง / อยู่ระหว่างดำเนินคดี', requiresResolution: true,  heir: false, active: true },
  { code: 'TC10', label: 'ผู้กู้ขาดคุณสมบัติตามระเบียบ',          requiresResolution: true,  heir: false, active: true },
  { code: 'TC99', label: 'อื่น ๆ',                               requiresResolution: false, heir: false, active: true },
];
window.ctCase = (code) => window.CT_CASES.find(c => c.code === code) || null;

// ─── สถานะรายการบอกเลิกสัญญา (workflow) ─────────────────────────────
window.CT_STATUS = [
  { v: 'draft',     step: 0,  l: 'ร่าง',              pill: 'neutral' },
  { v: 'review',    step: 1,  l: 'รอตรวจสอบ',         pill: 'warn' },
  { v: 'approve',   step: 2,  l: 'รออนุมัติ',          pill: 'warn' },
  { v: 'approved',  step: 3,  l: 'อนุมัติแล้ว',        pill: 'info' },
  { v: 'printed',   step: 4,  l: 'พิมพ์หนังสือแล้ว',   pill: 'info' },
  { v: 'sent',      step: 5,  l: 'ส่งหนังสือแล้ว',     pill: 'info' },
  { v: 'awaiting',  step: 6,  l: 'รอชำระหนี้',         pill: 'warn' },
  { v: 'partial',   step: 7,  l: 'ชำระบางส่วน',       pill: 'warn' },
  { v: 'paid',      step: 8,  l: 'ชำระครบ',           pill: 'ok' },
  { v: 'legal',     step: 9,  l: 'ส่งดำเนินคดี',       pill: 'bad' },
  { v: 'cancelled', step: -1, l: 'ยกเลิก',            pill: 'neutral' },
];
window.ctStatus = (v) => window.CT_STATUS.find(s => s.v === v) || window.CT_STATUS[0];

// ─── สถานะสมาชิก (ใช้ตรวจก่อนพิมพ์) ────────────────────────────────
window.CT_MEMBER_STATUS = {
  'ปกติ':      { pill: 'ok',   warn: false },
  'ลาออก':     { pill: 'warn', warn: true },
  'พ้นสภาพ':   { pill: 'warn', warn: true },
  'เกษียณ':    { pill: 'warn', warn: true },
  'ถูกให้ออก': { pill: 'bad',  warn: true },
  'เสียชีวิต':  { pill: 'bad',  warn: true },
};
// สีป้ายสถานะสมาชิก (ใช้กับผู้ค้ำประกัน/ทายาท) — สมาชิกปกติ / ลาออก / เสียชีวิต ฯลฯ
window.ctMemberStatusPill = (s) => (window.CT_MEMBER_STATUS[s] || { pill: 'neutral' }).pill;

// ─── คำนำหน้าผู้รับหนังสือ / ผู้ค้ำ ──────────────────────────────────
window.CT_PREFIXES = ['', 'ทายาท ', 'ผู้แทน ', 'ผู้รับมอบอำนาจ ', 'ผู้จัดการมรดก '];

// ════════════════════════════════════════════════════════════════════
//  รายการสัญญาที่ผิดนัดชำระ (worklist) — แสดงให้เจ้าหน้าที่เลือกทำรายการ
//  status: 'eligible' = รอบอกเลิก · 'processing' = อยู่ระหว่างทำรายการ
//          'issued' = ออกหนังสือแล้ว (ผูกกับ trackingNo)
//  closed = true → ปิดสัญญาแล้ว ห้ามบอกเลิก (BR-02) — ไม่นำมาแสดงใน worklist
// ════════════════════════════════════════════════════════════════════
window.CT_DEFAULTED = [
  {
    contractNo: 'L-2021-0332', loanType: 'เงินกู้สามัญ', contractDate: '2021-03-18',
    loanAmount: 600000, term: 96,
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    citizenId: '1-1018-00712-90-4', memberStatus: 'ลาออก',
    dept: 'กองการศึกษา', deptCode: '0501', shares: 92000,
    regAddress: '128/4 หมู่ 3 ถ.ติวานนท์ ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120',
    principalRemaining: 276400, interestDue: 18920, penalty: 3400,
    overdueInstallments: 8, installment: 6450, lastPayDate: '2025-07-25',
    dueDate: '2026-03-25', arrears: 55000, restructured: false,
    guarantors: [
      { memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: '', status: 'ปกติ' },
      { memberCode: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ',       dept: 'กองคลัง สำนักงานปลัด', prefix: '', status: 'เสียชีวิต' },
    ],
    status: 'eligible', trackingNo: null,
  },
  {
    contractNo: 'L-2020-0118', loanType: 'เงินกู้พิเศษ', contractDate: '2020-01-22',
    loanAmount: 1000000, term: 144,
    memberCode: 'M-065471', memberName: 'นายประเสริฐ ชูเกียรติ',
    citizenId: '3-1017-00238-44-1', memberStatus: 'เสียชีวิต',
    dept: 'สำนักงานปลัด', deptCode: '0801', shares: 134500,
    regAddress: '55 หมู่ 1 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',
    principalRemaining: 612000, interestDue: 41280, penalty: 8600,
    overdueInstallments: 12, installment: 8200, lastPayDate: '2025-03-25',
    dueDate: '2026-03-25', arrears: 107000, restructured: false,
    heirs: [
      { name: 'นางสาวพิมพ์มาดา ชูเกียรติ', relation: 'บุตร', prefix: 'ทายาท ', dept: '—' },
      { name: 'นายธนกฤต ชูเกียรติ',        relation: 'บุตร', prefix: 'ทายาท ', dept: '—' },
    ],
    guarantors: [
      { memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: '', status: 'ปกติ' },
      { memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',     dept: 'กองช่าง',              prefix: '', status: 'ปกติ' },
    ],
    status: 'eligible', trackingNo: null,
  },
  {
    contractNo: 'L-2022-0455', loanType: 'เงินกู้สามัญ', contractDate: '2022-05-10',
    loanAmount: 700000, term: 120,
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    citizenId: '3-1020-00457-12-8', memberStatus: 'ปกติ',
    dept: 'กองช่าง', deptCode: '0301', shares: 185000,
    regAddress: '90/12 หมู่ 5 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    principalRemaining: 458200, interestDue: 12480, penalty: 1860,
    overdueInstallments: 4, installment: 9680, lastPayDate: '2025-11-25',
    dueDate: '2026-04-25', arrears: 40580, restructured: false,
    guarantors: [
      { memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',  dept: 'กองช่าง',      prefix: '', status: 'ปกติ' },
      { memberCode: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', dept: 'กองการศึกษา', prefix: '', status: 'ลาออก' },
    ],
    status: 'eligible', trackingNo: null,
  },
  {
    contractNo: 'L-2023-0612', loanType: 'เงินกู้ปรับโครงสร้างหนี้', contractDate: '2023-08-02',
    loanAmount: 420000, term: 84,
    memberCode: 'M-063980', memberName: 'นายกิตติพงษ์ มั่นคง',
    citizenId: '3-1015-00821-33-6', memberStatus: 'ปกติ',
    dept: 'กองคลัง', deptCode: '0401', shares: 76000,
    regAddress: '212 หมู่ 8 ต.บางเลน อ.บางใหญ่ จ.นนทบุรี 11140',
    principalRemaining: 318450, interestDue: 9870, penalty: 2240,
    overdueInstallments: 5, installment: 5980, lastPayDate: '2025-10-15',
    dueDate: '2026-03-15', arrears: 31100, restructured: true,
    guarantors: [
      { memberCode: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', dept: 'กองคลัง', prefix: '', status: 'ปกติ' },
    ],
    status: 'processing', trackingNo: null,
  },
  {
    contractNo: 'EM-2024-0771', loanType: 'เงินกู้ฉุกเฉิน', contractDate: '2024-02-14',
    loanAmount: 50000, term: 12,
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    citizenId: '3-1020-00457-12-8', memberStatus: 'ปกติ',
    dept: 'กองช่าง', deptCode: '0301', shares: 185000,
    regAddress: '90/12 หมู่ 5 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    principalRemaining: 18600, interestDue: 540, penalty: 220,
    overdueInstallments: 3, installment: 3120, lastPayDate: '2025-12-25',
    dueDate: '2026-03-25', arrears: 9580, restructured: false,
    guarantors: [],
    status: 'eligible', trackingNo: null,
  },
  {
    contractNo: 'L-2019-0288', loanType: 'เงินกู้สามัญ', contractDate: '2019-06-30',
    loanAmount: 850000, term: 132,
    memberCode: 'M-061205', memberName: 'นางอรพิน เกษมสุข',
    citizenId: '3-1013-00390-58-9', memberStatus: 'เกษียณ',
    dept: 'กองสาธารณสุข', deptCode: '0601', shares: 240000,
    regAddress: '7/3 ซ.ลาดพร้าว 71 แขวงสะพานสอง เขตวังทองหลาง กรุงเทพมหานคร 10310',
    principalRemaining: 504300, interestDue: 27640, penalty: 5180,
    overdueInstallments: 9, installment: 7350, lastPayDate: '2025-06-30',
    dueDate: '2026-02-28', arrears: 72500, restructured: false,
    guarantors: [
      { memberCode: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', dept: 'กองคลัง สำนักงานปลัด', prefix: '', status: 'ปกติ' },
      { memberCode: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', dept: 'กองการศึกษา',        prefix: '', status: 'ลาออก' },
    ],
    status: 'eligible', trackingNo: null,
  },
];

// รวมยอดต่อสัญญา (เงินต้น + ดอกเบี้ยค้าง + ค่าปรับ)
window.ctContractTotal = (d) =>
  (Number(d.principalRemaining) || 0) + (Number(d.interestDue) || 0) + (Number(d.penalty) || 0);

// ค้นหาสัญญาผิดนัดใน worklist
window.ctSearchContracts = (q) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const n = norm(q);
  if (!n) return window.CT_DEFAULTED;
  return window.CT_DEFAULTED.filter(c =>
    norm(c.contractNo).includes(n) ||
    norm(c.memberCode).includes(n) ||
    norm(c.memberName).includes(n) ||
    norm(c.citizenId).includes(n) ||
    norm(c.dept).includes(n));
};
window.ctContract = (no) => window.CT_DEFAULTED.find(c => c.contractNo === no) || null;

// ─── เลขทะเบียนติดตาม/บอกเลิก (auto) — BOL-{พ.ศ.}-{running 6 หลัก} ──
window.ctNextTracking = (list, beYear) => {
  const prefix = `BOL-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n)) return Math.max(mx, n);
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(6, '0');
};

// ─── เลขที่หนังสือ (auto) — ที่ สอ.กสท.(บล) {running}/{พ.ศ.} ────────
window.ctNextDocNo = (list, beYear) => {
  const suffix = `/${beYear}`;
  const max = (list || []).reduce((mx, r) => {
    const s = String(r.docNo || '');
    const m = s.match(/(\d+)\/(\d+)$/);
    if (m && m[2] === String(beYear)) return Math.max(mx, parseInt(m[1], 10) || 0);
    return mx;
  }, 0);
  return `สอ.กสท.(บล) ${String(max + 1).padStart(4, '0')}${suffix}`;
};

// ─── ทะเบียนหนังสือบอกเลิกสัญญา (seed) ──────────────────────────────
window.CT_SEED = [
  {
    id: 'BOL-2569-000001', docNo: 'สอ.กสท.(บล) 0001/2569',
    regDate: '2026-05-12',
    memberCode: 'M-064880', memberName: 'นายสุชาติ พรหมมา',
    citizenId: '3-1014-00277-21-3',
    dept: 'กองช่าง', deptCode: '0301', shares: 58000, memberStatus: 'ลาออก',
    caseCode: 'TC02', caseOther: '',
    collectStartDate: '2026-04-01',
    resolutionNo: 'คสอ. 4/2569', resolutionDate: '2026-04-20',
    useOtherAddress: true,
    regAddress: '11 หมู่ 2 ต.บางรักน้อย อ.เมือง จ.นนทบุรี 11000',
    sendAddress: '402/15 อาคารชุดริเวอร์เพลส ถ.จรัญสนิทวงศ์ แขวงบางอ้อ เขตบางพลัด กรุงเทพมหานคร 10700',
    signer: 'นายประสิทธิ์ คงทอง', signerPosition: 'ผู้จัดการสหกรณ์',
    contracts: [
      { contractNo: 'L-2021-0501', loanType: 'เงินกู้สามัญ', contractDate: '2021-09-01',
        principalRemaining: 214500, interestDue: 11240, penalty: 1980, overdueInstallments: 7,
        guarantors: [
          { contractNo: 'L-2021-0501', memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: '', status: 'ปกติ' },
        ] },
    ],
    heirs: [],
    totalOutstanding: 227720,
    status: 'sent', printCount: 1, printedDate: '2026-05-12', sentDate: '2026-05-14',
    emsNo: 'EI778812345TH', closedDate: null,
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-12T11:05:00',
  },
  {
    id: 'BOL-2569-000002', docNo: 'สอ.กสท.(บล) 0002/2569',
    regDate: '2026-05-28',
    memberCode: 'M-062117', memberName: 'นายเอกชัย วัฒนกุล',
    citizenId: '3-1011-00533-77-1',
    dept: 'กองคลัง', deptCode: '0401', shares: 103000, memberStatus: 'ปกติ',
    caseCode: 'TC05', caseOther: '',
    collectStartDate: '2026-05-01',
    resolutionNo: '', resolutionDate: '',
    useOtherAddress: false,
    regAddress: '78/9 หมู่ 4 ต.ไทรม้า อ.เมือง จ.นนทบุรี 11000',
    sendAddress: '',
    signer: 'นางพิมพ์ใจ สุวรรณโชติ', signerPosition: 'หัวหน้าฝ่ายติดตามหนี้',
    contracts: [
      { contractNo: 'L-2022-0390', loanType: 'เงินกู้สามัญ', contractDate: '2022-02-15',
        principalRemaining: 389700, interestDue: 14820, penalty: 2640, overdueInstallments: 6,
        guarantors: [
          { contractNo: 'L-2022-0390', memberCode: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', dept: 'กองคลัง', prefix: '', status: 'ปกติ' },
          { contractNo: 'L-2022-0390', memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง', prefix: '', status: 'ลาออก' },
        ] },
    ],
    heirs: [],
    totalOutstanding: 407160,
    status: 'draft', printCount: 0, printedDate: null, sentDate: null,
    emsNo: '', closedDate: null,
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-28T09:40:00',
  },
];

// ─── โหลด/บันทึก localStorage ───────────────────────────────────────
window.ctLoad = () => {
  try {
    const saved = localStorage.getItem('contract_terminations');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.CT_SEED.map(r => ({ ...r }));
};
window.ctSaveLS = (list) => {
  try { localStorage.setItem('contract_terminations', JSON.stringify(list)); } catch (e) {}
};

// ─── เนื้อความหนังสือบอกเลิกสัญญา ───────────────────────────────────
window.ctNoticeBody = (rec) => {
  const c = (window.ctCase(rec.caseCode) || {}).label || '';
  const caseTxt = rec.caseCode === 'TC99' ? (rec.caseOther || c) : c;
  return `ด้วยปรากฏว่าท่านในฐานะสมาชิกและผู้กู้ของสหกรณ์ออมทรัพย์ ได้${caseTxt} ` +
    `เป็นเหตุให้ผิดนัดชำระหนี้ตามสัญญาเงินกู้ที่ทำไว้ต่อสหกรณ์ รวมเป็นหนี้คงค้างทั้งสิ้น ` +
    `${fmt.money(rec.totalOutstanding, 2)} บาท (${window.bahtText(rec.totalOutstanding)})`;
};
