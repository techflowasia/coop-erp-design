// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ทะเบียนสัญญาฟ้องคดี (ดำเนินคดี)
//  ข้อมูลสาธิต: สมาชิก/ลูกหนี้ + สัญญาเงินกู้ + Master Data ศาล/ชั้นลูกหนี้
//  + ทะเบียนคดีฟ้อง (รายละเอียดคดี · พิพากษา · บังคับคดี · ลำดับงาน)
// ════════════════════════════════════════════════════════════════════

window.LIT_USER = 'จันทร์เพ็ญ มาลี';

// ─── Master Data ────────────────────────────────────────────────────
// สถานะเรียกเก็บ (Dropdown)
window.LIT_COLLECT_STATUS = [
  'เรียกเก็บปกติ', 'อยู่ระหว่างติดตาม', 'หยุดเรียกเก็บชั่วคราว',
  'ส่งฟ้องดำเนินคดี', 'อยู่ระหว่างบังคับคดี', 'ปิดบัญชี/ชำระครบ',
];
// ชั้นลูกหนี้ (ดึงจากระบบติดตามหนี้ / เจ้าหน้าที่เลือกตามสิทธิ์)
window.LIT_DEBTOR_CLASS = [
  { v: 1, l: 'ชั้น 1 — ปกติ' },
  { v: 2, l: 'ชั้น 2 — ค้างชำระ' },
  { v: 3, l: 'ชั้น 3 — ฟ้องคดี' },
  { v: 4, l: 'ชั้น 4 — บังคับคดี' },
  { v: 5, l: 'ชั้น 5 — สูญ/ตัดหนี้' },
];
// ศาล (Master Data)
window.LIT_COURTS = [
  'ศาลจังหวัดนนทบุรี', 'ศาลแพ่ง', 'ศาลแพ่งกรุงเทพใต้', 'ศาลจังหวัดมีนบุรี',
  'ศาลจังหวัดปทุมธานี', 'ศาลจังหวัดสมุทรปราการ', 'ศาลแขวงนนทบุรี', 'ศาลแรงงานกลาง',
];
// การยึดทรัพย์
window.LIT_SEIZURE_TYPES = [
  'ไม่มีการยึดทรัพย์', 'อยู่ระหว่างดำเนินการ', 'ยึดทรัพย์แล้ว',
  'อยู่ระหว่างขายทอดตลาด', 'ขายทอดตลาดเสร็จสิ้น',
];
// ประเภท/สถานะคำพิพากษา
window.LIT_JUDGMENT_TYPES = [
  'พิพากษาให้ชำระหนี้', 'ศาลยกฟ้อง', 'ประนีประนอมยอมความ',
  'ผ่อนชำระตามคำพิพากษา', 'ส่งเรื่องบังคับคดี', 'จำหน่ายคดีชั่วคราว',
];
// ผู้ดำเนินการบังคับคดี
window.LIT_EXECUTORS = [
  'ฝ่ายกฎหมายสหกรณ์', 'ทนายความภายนอก', 'สำนักงานบังคับคดีจังหวัด',
  'เจ้าหน้าที่ติดตามหนี้',
];
// ทนายความ (Master)
window.LIT_LAWYERS = [
  { name: 'นายอดิศักดิ์ ธรรมรงค์', firm: 'สำนักงานกฎหมายอดิศักดิ์และเพื่อน' },
  { name: 'นางสาวเมธาวี ศรีสุข', firm: 'บจก. ที่ปรึกษากฎหมายเมธาชัย' },
  { name: 'นายกิตติพงษ์ วรรณดี', firm: 'ฝ่ายกฎหมายสหกรณ์' },
];

// สถานะสัญญา (เพื่อแสดง chip + ควบคุมการเลือกฟ้อง)
window.LIT_CONTRACT_STATUS = {
  'ปกติ':        { chip: 'success', selectable: true },
  'ค้างชำระ':    { chip: 'warning', selectable: true },
  'ผิดนัด':      { chip: 'danger',  selectable: true },
  'ฟ้องคดีแล้ว': { chip: 'info',    selectable: false, note: 'อยู่ระหว่างดำเนินคดี' },
  'ปิดคดี':      { chip: 'neutral', selectable: false, note: 'ดำเนินคดีเสร็จสิ้น' },
  'ยกเลิกคดี':   { chip: 'neutral', selectable: true },
};

// ─── ลำดับการดำเนินงานของคดี (template) ─────────────────────────────
window.LIT_WORKFLOW = [
  { id: 'prep',    label: 'เตรียมเอกสาร',         desc: 'รวบรวมสัญญา หลักฐานหนี้ และเอกสารผู้ค้ำ' },
  { id: 'lawyer',  label: 'ส่งทนาย',              desc: 'มอบสำนวนให้ทนายความผู้รับผิดชอบคดี' },
  { id: 'file',    label: 'ยื่นฟ้อง',             desc: 'ยื่นฟ้องต่อศาลที่มีเขตอำนาจ' },
  { id: 'black',   label: 'รับเลขคดีดำ',          desc: 'ศาลรับฟ้องและออกเลขคดีดำ' },
  { id: 'hearing', label: 'นัดพิจารณาคดี',        desc: 'สืบพยาน / ไกล่เกลี่ยตามนัดศาล' },
  { id: 'verdict', label: 'ศาลมีคำพิพากษา',       desc: 'ศาลพิพากษาและอ่านคำพิพากษา' },
  { id: 'red',     label: 'รับเลขคดีแดง',         desc: 'รับสำนวนและเลขคดีแดง' },
  { id: 'enforce', label: 'ดำเนินการบังคับคดี',   desc: 'ตั้งเรื่องบังคับคดี/ยึดทรัพย์' },
  { id: 'close',   label: 'ปิดคดี',               desc: 'ชำระครบ/เสร็จสิ้นการบังคับคดี' },
];

// ─── สมาชิก/ลูกหนี้ + สัญญาเงินกู้ ──────────────────────────────────
window.LIT_MEMBERS = [
  {
    code: '0001234',
    title: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี',
    name: 'นายสมชาย ใจดี',
    citizenId: '1-1011-11111-11-1',
    birthDate: '1981-03-14',
    address: '123/45 หมู่ 7 ตำบลบางใหญ่ อำเภอบางใหญ่ จังหวัดนนทบุรี',
    province: 'นนทบุรี', postal: '11140', mobile: '081-234-5678',
    expireDate: '2023-01-01',          // วันที่พ้นสภาพ (พ้นสภาพแล้ว)
    status: 'พ้นสภาพ',
    contracts: [
      { no: 'LN-66000123', status: 'ปกติ',    amount: 500000, startDate: '2023-01-15',
        perInstallment: 9680, totalTerms: 60, lastTerm: 10, lastPayDate: '2026-11-15',
        remaining: 420000, interestDue: 5250,  interestOver: 0,
        guarantors: [
          { id: 'G-123-1', type: 'person', name: 'นายอนุชา สุขสวัสดิ์', citizenId: '3-1018-00112-87-4', memberCode: 'M-058243', dept: 'กองช่าง', status: 'สมาชิกปกติ', guaranteeAmount: 500000 },
          { id: 'G-123-2', type: 'person', name: 'นางสาวกานต์ ศิริวงศ์', citizenId: '1-1099-00214-33-2', memberCode: 'M-058247', dept: 'กองการศึกษา', status: 'สมาชิกปกติ', guaranteeAmount: 500000 },
        ] },
      { no: 'LN-66000145', status: 'ค้างชำระ', amount: 300000, startDate: '2023-03-20',
        perInstallment: 6450, totalTerms: 48, lastTerm: 5,  lastPayDate: '2026-08-20',
        remaining: 280000, interestDue: 3800,  interestOver: 1200,
        guarantors: [
          { id: 'G-145-1', type: 'person', name: 'นายธีรพงษ์ ขำเพชร', citizenId: '1-2099-00321-66-8', memberCode: 'M-058250', dept: 'สำนักปลัด', status: 'สมาชิกปกติ', guaranteeAmount: 300000 },
          { id: 'S-145-1', type: 'security', assetType: 'ที่ดินพร้อมสิ่งปลูกสร้าง', detail: 'โฉนดเลขที่ 24518 ต.บางใหญ่ อ.บางใหญ่ จ.นนทบุรี', appraisal: 650000 },
        ] },
      { no: 'LN-66000178', status: 'ผิดนัด',   amount: 200000, startDate: '2022-06-10',
        perInstallment: 4200, totalTerms: 36, lastTerm: 2,  lastPayDate: '2025-08-10',
        remaining: 190000, interestDue: 4100,  interestOver: 2500,
        guarantors: [
          { id: 'S-178-1', type: 'security', assetType: 'ที่ดินเปล่า', detail: 'โฉนดเลขที่ 90211 ต.เสาธงหิน อ.บางใหญ่ จ.นนทบุรี', appraisal: 420000 },
        ] },
    ],
  },
  {
    code: '0002871',
    title: 'นางสาว', firstName: 'สุดารัตน์', lastName: 'พงษ์ไพบูลย์',
    name: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    citizenId: '1-1018-00712-90-4',
    birthDate: '1986-09-22',
    address: '88 หมู่ 3 ตำบลบางพูด อำเภอปากเกร็ด จังหวัดนนทบุรี',
    province: 'นนทบุรี', postal: '11120', mobile: '089-771-4520',
    expireDate: '2022-10-31',
    status: 'ลาออก',
    contracts: [
      { no: 'LN-65000088', status: 'ฟ้องคดีแล้ว', amount: 450000, startDate: '2021-05-12',
        perInstallment: 6450, totalTerms: 96, lastTerm: 41, lastPayDate: '2025-07-25',
        remaining: 276400, interestDue: 18920, interestOver: 0,
        guarantors: [
          { id: 'G-088-1', type: 'person', name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1018-00214-55-2', memberCode: 'M-058241', dept: 'กองคลัง', status: 'สมาชิกปกติ', guaranteeAmount: 450000 },
        ] },
      { no: 'LN-67000210', status: 'ผิดนัด',   amount: 120000, startDate: '2024-02-18',
        perInstallment: 3120, totalTerms: 48, lastTerm: 6,  lastPayDate: '2025-12-18',
        remaining: 98600, interestDue: 2480, interestOver: 540,
        guarantors: [] },
    ],
  },
  {
    code: '0003940',
    title: 'นาย', firstName: 'ประเสริฐ', lastName: 'ชูเกียรติ',
    name: 'นายประเสริฐ ชูเกียรติ',
    citizenId: '3-1017-00238-44-1',
    birthDate: '1972-01-08',
    address: '14/9 ถนนติวานนท์ ตำบลตลาดขวัญ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี',
    province: 'นนทบุรี', postal: '11000', mobile: '086-019-3377',
    expireDate: '2024-03-15',
    status: 'เสียชีวิต',
    contracts: [
      { no: 'LN-63000412', status: 'ปิดคดี', amount: 612000, startDate: '2020-03-02',
        perInstallment: 8200, totalTerms: 144, lastTerm: 58, lastPayDate: '2025-03-25',
        remaining: 0, interestDue: 0, interestOver: 0 },
    ],
  },
];

// ─── ค้นหาสมาชิก (รหัส/ชื่อ/นามสกุล/บัตร) ──────────────────────────
window.litSearchMembers = (q) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const n = norm(q);
  if (!n) return window.LIT_MEMBERS;
  return window.LIT_MEMBERS.filter(m =>
    norm(m.code).includes(n) || norm(m.name).includes(n) || norm(m.citizenId).includes(n));
};
window.litMember = (code) => window.LIT_MEMBERS.find(m => m.code === code) || null;

// ─── อายุจากวันเกิด ─────────────────────────────────────────────────
window.litAge = (iso) => {
  if (!iso) return '';
  const b = new Date(iso), now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const md = now.getMonth() - b.getMonth();
  if (md < 0 || (md === 0 && now.getDate() < b.getDate())) a--;
  return a;
};

// ─── เลขคดีดำ/คดีแดง อัตโนมัติ ──────────────────────────────────────
window.litNextCaseNo = (list, prefix, beYear) => {
  const max = (list || []).reduce((mx, r) => {
    const s = r.blackCaseNo || '';
    const m = String(s).match(/(\d+)\/(\d+)$/);
    if (m && m[2] === String(beYear)) return Math.max(mx, parseInt(m[1], 10) || 0);
    return mx;
  }, 1233);
  return `${prefix}${max + 1}/${beYear}`;
};

// ─── ทะเบียนคดีฟ้อง (seed) — key ตามเลขสัญญา ───────────────────────
//  ข้อมูลตัวอย่างของ สมาชิก 0001234 สัญญา LN-66000145 (ตรงกับภาพอ้างอิง)
window.LIT_SEED = [
  {
    id: 'LG-2567-000145',
    memberCode: '0001234', contractNo: 'LN-66000145',
    // A. รายละเอียดงานฟ้องคดี (ข้อมูลทั่วไป)
    receiveDate: '2024-05-21', collectStatus: 'อยู่ระหว่างติดตาม', debtorClass: 3, lastPayment: 10000,
    // B. ข้อมูลการฟ้องคดี
    fileDate: '2023-12-25', court: 'ศาลจังหวัดนนทบุรี', lawyer: 'นายอดิศักดิ์ ธรรมรงค์',
    claimAmount: 450000, blackCaseNo: 'ค.1234/2566',
    seizure: 'อยู่ระหว่างดำเนินการ',
    seizureDetail: 'ตรวจสอบทรัพย์สินแล้ว พบที่ดิน 1 แปลง และที่ดินพร้อมสิ่งปลูกสร้าง 1 หลัง อยู่ระหว่างดำเนินการขออายัดทรัพย์',
    // C. ข้อมูลพิพากษา
    judgmentType: 'พิพากษาให้ชำระหนี้', verdictDate: '2024-02-15', caseReceiveDate: '2024-02-20',
    certFee: 500, redCaseNo: 'ค.789/2567',
    judgmentResult: 'พิพากษาให้จำเลยชำระเงินต้น ดอกเบี้ย และค่าใช้จ่ายทั้งหมดแก่โจทก์ ภายใน 30 วันนับแต่วันที่มีคำพิพากษา',
    // D. หมายเหตุ
    note: 'ลูกหนี้รับปากจะมาชำระภายในเดือนหน้า อยู่ระหว่างเจรจาผ่อนชำระตามคำพิพากษา',
    // E. บังคับคดี
    enforceDate: '2024-03-01', executor: 'ฝ่ายกฎหมายสหกรณ์',
    caseStatus: 'อยู่ระหว่างบังคับคดี',
    // ลำดับงาน — ขั้นตอนที่เสร็จแล้ว
    workflow: {
      prep:    { date: '2023-11-10', by: 'จันทร์เพ็ญ มาลี' },
      lawyer:  { date: '2023-11-28', by: 'จันทร์เพ็ญ มาลี' },
      file:    { date: '2023-12-25', by: 'นายอดิศักดิ์ ธรรมรงค์' },
      black:   { date: '2023-12-25', by: 'ศาลจังหวัดนนทบุรี' },
      hearing: { date: '2024-01-30', by: 'ศาลจังหวัดนนทบุรี' },
      verdict: { date: '2024-02-15', by: 'ศาลจังหวัดนนทบุรี' },
      red:     { date: '2024-02-20', by: 'นายอดิศักดิ์ ธรรมรงค์' },
      enforce: { date: '2024-03-01', by: 'ฝ่ายกฎหมายสหกรณ์' },
    },
    cancelled: null,
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2024-05-21T09:30:00',
  },
];

// ─── โหลด/บันทึก localStorage ───────────────────────────────────────
window.litLoad = () => {
  try {
    const saved = localStorage.getItem('litigation_cases');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.LIT_SEED.map(r => ({ ...r }));
};
window.litSaveLS = (list) => {
  try { localStorage.setItem('litigation_cases', JSON.stringify(list)); } catch (e) {}
};
window.litFindCase = (list, memberCode, contractNo) =>
  (list || []).find(c => c.memberCode === memberCode && c.contractNo === contractNo) || null;

// ─── มูลหนี้รวมที่จะฟ้อง (เงินต้นคงเหลือ + ดอกเบี้ยค้าง + ดอกเบี้ยเกิน) ─
window.litClaimTotal = (c) =>
  c ? (Number(c.remaining) || 0) + (Number(c.interestDue) || 0) + (Number(c.interestOver) || 0) : 0;
// ผู้ค้ำที่เป็นบุคคล / หลักประกัน (แยกประเภท)
window.litPersonGuarantors = (c) => ((c && c.guarantors) || []).filter(g => g.type === 'person');
window.litSecurities = (c) => ((c && c.guarantors) || []).filter(g => g.type === 'security');
