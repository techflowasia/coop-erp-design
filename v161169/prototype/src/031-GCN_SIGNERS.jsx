// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — แจ้งเปลี่ยนผู้ค้ำประกัน
//  ข้อมูลสาธิต: ผู้ลงนาม · สาเหตุที่ติดตาม · สถานะรายการ · สังกัด (ปณ.)
//  + สมาชิก/ลูกหนี้ + สัญญาเงินกู้ + ผู้ค้ำประกันเดิม
//  + ทะเบียนแจ้งเปลี่ยนผู้ค้ำประกัน (seed) + helper
// ════════════════════════════════════════════════════════════════════

// ─── ผู้มีอำนาจลงนาม (ผู้ลงนาม → ตำแหน่งอัตโนมัติ · แก้ไขได้) ─────────
window.GCN_SIGNERS = [
  { name: 'นายมรุต หมุดเพ็ชร',        position: 'ผู้จัดการ' },
  { name: 'นางสาวอุไรวรรณ เพชรรัตน์', position: 'รองผู้จัดการ' },
  { name: 'นายสมศักดิ์ ธนวัฒน์',        position: 'ประธานกรรมการดำเนินการ' },
  { name: 'นางพิมพ์ใจ สุวรรณโชติ',     position: 'หัวหน้าฝ่ายทะเบียนและติดตามหนี้' },
];
// ตำแหน่งให้เลือก (dropdown)
window.GCN_POSITIONS = [
  'ผู้จัดการ', 'รองผู้จัดการ', 'ประธานกรรมการดำเนินการ',
  'รองประธานกรรมการดำเนินการ', 'หัวหน้าฝ่ายทะเบียนและติดตามหนี้', 'ผู้ช่วยผู้จัดการ',
];

// ─── สาเหตุที่ติดตาม (แจ้งเปลี่ยนผู้ค้ำ) ─────────────────────────────
window.GCN_CAUSES = [
  { code: 'G01', label: 'ผู้ค้ำประกันเสียชีวิต',           active: true },
  { code: 'G02', label: 'ผู้ค้ำประกันพ้นสภาพสมาชิก',      active: true },
  { code: 'G03', label: 'ผู้ค้ำประกันลาออก',              active: true },
  { code: 'G04', label: 'ผู้ค้ำประกันมีภาระค้ำเกินเกณฑ์',  active: true },
  { code: 'G05', label: 'ผู้ค้ำประกันขาดคุณสมบัติ',        active: true },
  { code: 'G06', label: 'ผู้กู้ผิดนัดชำระหนี้',            active: true },
  { code: 'G07', label: 'ครบกำหนดต้องเปลี่ยนผู้ค้ำ',      active: true },
  { code: 'G99', label: 'เหตุผลอื่น ๆ',                   active: true },
];
window.gcnCause = (code) => window.GCN_CAUSES.find(c => c.code === code) || null;

// ─── สถานะรายการแจ้งเปลี่ยนผู้ค้ำ ───────────────────────────────────
window.GCN_STATUS = [
  { v: 'draft',    step: 0, l: 'บันทึกแล้ว',              pill: 'neutral' },
  { v: 'printed',  step: 1, l: 'พิมพ์หนังสือแล้ว',        pill: 'info' },
  { v: 'notified', step: 2, l: 'แจ้งสมาชิกแล้ว',          pill: 'info' },
  { v: 'waiting',  step: 3, l: 'รอดำเนินการเปลี่ยนผู้ค้ำ', pill: 'warn' },
  { v: 'done',     step: 4, l: 'ดำเนินการแล้ว',           pill: 'ok' },
  { v: 'cancelled',step: 9, l: 'ยกเลิก',                  pill: 'bad' },
];
window.gcnStatus = (v) => window.GCN_STATUS.find(s => s.v === v) || window.GCN_STATUS[0];

// ─── ประเภทผู้ค้ำประกัน ─────────────────────────────────────────────
window.GCN_GUAR_TYPES = ['ผู้ค้ำปกติ', 'ผู้ค้ำประกันชีวิต'];

// ─── สังกัด / หน่วยต้นสังกัด (ที่ทำการไปรษณีย์) ─────────────────────
window.GCN_DEPTS = [
  { code: '10160', name: 'ปณ.ภาษีเจริญ' },
  { code: '10140', name: 'ปณ.บางแค' },
  { code: '10600', name: 'ปณ.ธนบุรี' },
  { code: '10700', name: 'ปณ.บางกอกน้อย' },
  { code: '11000', name: 'ปณ.นนทบุรี' },
  { code: '10210', name: 'ปณ.หลักสี่' },
  { code: '10900', name: 'ปณ.จตุจักร' },
  { code: '10310', name: 'ปณ.ดินแดง' },
];
window.gcnDeptLabel = (code) => {
  const d = window.GCN_DEPTS.find(x => x.code === code);
  return d ? `${d.code} - ${d.name}` : (code || '');
};

// ─── สมาชิก / ลูกหนี้ + สัญญาเงินกู้ + ผู้ค้ำประกันเดิม ─────────────
//  contracts[]: เลขที่สัญญา · ประเภท · วันที่ทำสัญญา · จำนวนเงินกู้ ·
//               ยอดหนี้คงเหลือ · ผู้ค้ำเดิม (รหัส/ชื่อ/ประเภท/สังกัด)
window.GCN_MEMBERS = [
  {
    code: '050000',
    title: 'นาย', firstName: 'วิวัฒน์', lastName: 'จงรุ่งสำราญ',
    name: 'นายวิวัฒน์ จงรุ่งสำราญ',
    citizenId: '3-1015-00842-55-1',
    deptCode: '10160', unit: '10160 - ปณ.ภาษีเจริญ',
    status: 'ปกติ',
    joinDate: '1900-01-01',   // 01/01/2443 (ข้อมูลสาธิต)
    shares: 187000,
    outstanding: 0,
    contracts: [
      { contractNo: 'ฉล69010708', loanType: 'สามัญ', contractDate: '2026-01-15', amount: 347700.00, remaining: 347700.00,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ',       guarDeptCode: '10160' },
      { contractNo: 'ส666000624', loanType: 'สามัญ', contractDate: '2026-02-01', amount: 1140000.00, remaining: 1140000.00,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ',       guarDeptCode: '10160' },
      { contractNo: 'ส668001275', loanType: 'สามัญ', contractDate: '2026-02-15', amount: 1485600.00, remaining: 1485600.00,
        guarCode: '048511', guarName: 'นายมงคล สุริมงคล',      guarType: 'ผู้ค้ำปกติ',       guarDeptCode: '10160' },
      { contractNo: 'ส669002745', loanType: 'สามัญ', contractDate: '2026-03-01', amount: 1500000.00, remaining: 1500000.00,
        guarCode: '046299', guarName: 'นายสมปัติ โสมภีร์',      guarType: 'ผู้ค้ำประกันชีวิต', guarDeptCode: '10160' },
      { contractNo: 'สง67000643', loanType: 'สามัญ', contractDate: '2026-03-01', amount: 375000.00, remaining: 375000.00,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ',       guarDeptCode: '10160' },
      { contractNo: 'สล63000053', loanType: 'สามัญ', contractDate: '2026-03-15', amount: 148141.50, remaining: 148141.50,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ',       guarDeptCode: '10160' },
      { contractNo: 'สล69ร005727', loanType: 'สามัญ', contractDate: '2026-03-20', amount: 300000.00, remaining: 300000.00,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ',       guarDeptCode: '10160' },
    ],
  },
  {
    code: '051204',
    title: 'นาง', firstName: 'สุนีย์', lastName: 'อภิรักษ์ชัย',
    name: 'นางสุนีย์ อภิรักษ์ชัย',
    citizenId: '3-1018-00551-22-4',
    deptCode: '10140', unit: '10140 - ปณ.บางแค',
    status: 'ปกติ',
    joinDate: '2010-05-01',
    shares: 96500,
    outstanding: 462180.00,
    contracts: [
      { contractNo: 'ส668000912', loanType: 'สามัญ', contractDate: '2026-01-20', amount: 620000.00, remaining: 462180.00,
        guarCode: '049120', guarName: 'นายเกรียงไกร แสงเดือน', guarType: 'ผู้ค้ำปกติ', guarDeptCode: '10140' },
      { contractNo: 'ฉฉ69000318', loanType: 'ฉุกเฉิน', contractDate: '2026-02-10', amount: 50000.00, remaining: 0.00,
        guarCode: '049120', guarName: 'นายเกรียงไกร แสงเดือน', guarType: 'ผู้ค้ำปกติ', guarDeptCode: '10140' },
    ],
  },
  {
    code: '049877',
    title: 'นาย', firstName: 'ธนดล', lastName: 'พัฒนถาวร',
    name: 'นายธนดล พัฒนถาวร',
    citizenId: '3-1016-00913-01-7',
    deptCode: '10600', unit: '10600 - ปณ.ธนบุรี',
    status: 'ปกติ',
    joinDate: '2007-11-01',
    shares: 254300,
    outstanding: 1180450.00,
    contracts: [
      { contractNo: 'ส667001540', loanType: 'สามัญ', contractDate: '2025-12-05', amount: 1350000.00, remaining: 1180450.00,
        guarCode: '050122', guarName: 'นางอรวรรณ ชูวงศ์',   guarType: 'ผู้ค้ำประกันชีวิต', guarDeptCode: '10600' },
      { contractNo: 'สพ66000077', loanType: 'พิเศษ',  contractDate: '2025-10-18', amount: 800000.00, remaining: 0.00,
        guarCode: '050128', guarName: 'นายพิสิษฐ์ กิตติคุณ', guarType: 'ผู้ค้ำปกติ',        guarDeptCode: '10600' },
    ],
  },
];

// ─── ค้นหาสมาชิก (รหัส/ชื่อ/นามสกุล/บัตร/สังกัด) ────────────────────
window.gcnSearchMembers = (c) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  c = c || {};
  const code = norm(c.code), fn = norm(c.firstName), ln = norm(c.lastName),
        cid = norm(c.citizenId), un = norm(c.unit);
  return window.GCN_MEMBERS.filter(m => {
    if (code && !norm(m.code).includes(code)) return false;
    if (fn && !norm(m.firstName).includes(fn) && !norm(m.name).includes(fn)) return false;
    if (ln && !norm(m.lastName).includes(ln) && !norm(m.name).includes(ln)) return false;
    if (cid && !norm(m.citizenId).includes(cid)) return false;
    if (un && !norm(window.gcnDeptLabel(m.deptCode)).includes(un)) return false;
    return true;
  });
};
window.gcnMember = (code) => window.GCN_MEMBERS.find(m => m.code === code) || null;

// ─── เลขทะเบียนติดตาม (auto) — GT-{พ.ศ.}-{running 5 หลัก} ───────────
window.gcnNextTracking = (list, beYear) => {
  const prefix = `GT-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n)) return Math.max(mx, n);
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(5, '0');
};

// ─── รวมยอดของสัญญาที่เลือก ─────────────────────────────────────────
window.gcnSumAmount = (rows) => (rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
window.gcnSumRemaining = (rows) => (rows || []).reduce((s, r) => s + (Number(r.remaining) || 0), 0);

// ─── ทะเบียนแจ้งเปลี่ยนผู้ค้ำประกัน (seed) ──────────────────────────
window.GCN_SEED = [
  {
    id: 'GT-2569-00001', refNo: '', round: 1,
    regDate: '2026-06-18', dueDate: '2026-09-16',
    signer: 'นายมรุต หมุดเพ็ชร', signerPosition: 'ผู้จัดการ',
    causeCode: 'G02', causeDetail: 'พ้นสภาพสมาชิกเมื่อวันที่ 15/06/2569',
    notifyAhead: true,
    memberCode: '050000', memberName: 'นายวิวัฒน์ จงรุ่งสำราญ',
    deptCode: '10160', shares: 187000, outstanding: 0,
    contracts: [
      { contractNo: 'ฉล69010708', loanType: 'สามัญ', contractDate: '2026-01-15', amount: 347700.00, remaining: 347700.00,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ', guarDeptCode: '10160' },
      { contractNo: 'ส666000624', loanType: 'สามัญ', contractDate: '2026-02-01', amount: 1140000.00, remaining: 1140000.00,
        guarCode: '048509', guarName: 'นางรัชชนก วสุระพเชียร', guarType: 'ผู้ค้ำปกติ', guarDeptCode: '10160' },
    ],
    note: 'โปรดจัดหาผู้ค้ำประกันรายใหม่ให้เป็นไปตามระเบียบของสหกรณ์ และนำเอกสารมายื่นภายในวันที่ครบกำหนด',
    totalAmount: 1487700.00, totalRemaining: 1487700.00,
    status: 'printed', statusDate: '2026-06-18', printCount: 1, printedDate: '2026-06-18', attachments: [],
    enteredBy: 'น.ส. สุดารัตน์ จันทร์ดี', enteredAt: '2026-06-18T10:12:00',
  },
  {
    id: 'GT-2569-00002', refNo: 'อ้าง 145/2569', round: 1,
    regDate: '2026-06-25', dueDate: '2026-08-24',
    signer: 'นางพิมพ์ใจ สุวรรณโชติ', signerPosition: 'หัวหน้าฝ่ายทะเบียนและติดตามหนี้',
    causeCode: 'G01', causeDetail: 'ผู้ค้ำประกันถึงแก่กรรมเมื่อ 02/06/2569',
    notifyAhead: false,
    memberCode: '049877', memberName: 'นายธนดล พัฒนถาวร',
    deptCode: '10600', shares: 254300, outstanding: 1180450.00,
    contracts: [
      { contractNo: 'ส667001540', loanType: 'สามัญ', contractDate: '2025-12-05', amount: 1350000.00, remaining: 1180450.00,
        guarCode: '050122', guarName: 'นางอรวรรณ ชูวงศ์', guarType: 'ผู้ค้ำประกันชีวิต', guarDeptCode: '10600' },
    ],
    note: '',
    totalAmount: 1350000.00, totalRemaining: 1180450.00,
    status: 'waiting', statusDate: '2026-06-27', printCount: 1, printedDate: '2026-06-25', attachments: [],
    enteredBy: 'น.ส. สุดารัตน์ จันทร์ดี', enteredAt: '2026-06-25T14:31:00',
  },
];

// ─── โหลด/บันทึก localStorage ───────────────────────────────────────
window.gcnLoad = () => {
  try {
    const saved = localStorage.getItem('guarantor_change_notices');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.GCN_SEED.map(r => ({ ...r }));
};
window.gcnSaveLS = (list) => {
  try { localStorage.setItem('guarantor_change_notices', JSON.stringify(list)); } catch (e) {}
};
