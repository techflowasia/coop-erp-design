// ═════════════════════════════════════════════════════════════════
//  ข้อมูล — ขอยืมเงินทดรอง (Petty / Advance Loan Request)
//  ระบบการเงิน › เงินทดรอง
//  ค่าคงที่ · helpers · ทะเบียนคำขอตั้งต้น · ข้อมูลผู้ขอ (อ้าง DN_MEMBERS)
// ═════════════════════════════════════════════════════════════════

// ─── ประเภทเงินทดรอง ────────────────────────────────────────────────
window.PA_TYPES = [
  { v: 'travel',  l: 'เดินทางปฏิบัติงาน', short: 'เดินทาง', needProject: false },
  { v: 'meeting', l: 'ประชุม / อบรม / สัมมนา', short: 'ประชุม', needProject: false },
  { v: 'procure', l: 'จัดซื้อจัดจ้าง', short: 'จัดซื้อ', needProject: false },
  { v: 'project', l: 'ดำเนินโครงการ / กิจกรรม', short: 'โครงการ', needProject: true },
];
window.paType = (v) => window.PA_TYPES.find(t => t.v === v) || window.PA_TYPES[0];

// ─── หมวดค่าใช้จ่าย (ค่าคงที่ — กำหนดได้ที่เมนู “ค่าคงที่ › หมวดค่าใช้จ่าย”) ──
window.PA_CAT_GROUPS = ['ค่าเดินทาง', 'ค่าตอบแทน', 'ค่าวัสดุ / ครุภัณฑ์', 'ค่าใช้สอย', 'อื่น ๆ'];

window.PA_CAT_SEED = [
  { id: 'C01', code: 'EXP-TRV', name: 'ค่าเดินทาง (พาหนะ/น้ำมัน)', group: 'ค่าเดินทาง', unit: 'เที่ยว', enabled: true },
  { id: 'C02', code: 'EXP-ACM', name: 'ค่าที่พัก', group: 'ค่าเดินทาง', unit: 'วัน', enabled: true },
  { id: 'C03', code: 'EXP-PER', name: 'ค่าเบี้ยเลี้ยง / ค่าอาหาร', group: 'ค่าเดินทาง', unit: 'วัน', enabled: true },
  { id: 'C04', code: 'EXP-SPK', name: 'ค่าตอบแทนวิทยากร', group: 'ค่าตอบแทน', unit: 'คน', enabled: true },
  { id: 'C05', code: 'EXP-MAT', name: 'ค่าวัสดุอุปกรณ์', group: 'ค่าวัสดุ / ครุภัณฑ์', unit: 'รายการ', enabled: true },
  { id: 'C06', code: 'EXP-RNT', name: 'ค่าเช่าสถานที่ / อุปกรณ์', group: 'ค่าใช้สอย', unit: 'ครั้ง', enabled: true },
  { id: 'C07', code: 'EXP-SVC', name: 'ค่าจ้างเหมาบริการ', group: 'ค่าใช้สอย', unit: 'รายการ', enabled: true },
  { id: 'C08', code: 'EXP-MSC', name: 'ค่าใช้จ่ายเบ็ดเตล็ด', group: 'อื่น ๆ', unit: 'รายการ', enabled: true },
];

window.PA_CAT_LS_KEY = 'coop.pettyAdvance.cats.v1';
window.paCatLoad = () => {
  try { const s = localStorage.getItem(window.PA_CAT_LS_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return window.PA_CAT_SEED.map(r => ({ ...r }));
};
window.paCatSave = (list) => { try { localStorage.setItem(window.PA_CAT_LS_KEY, JSON.stringify(list)); } catch (e) {} };
window.paActiveCats = () => window.paCatLoad().filter(c => c.enabled).map(c => c.name);
window.paCat = (name) => window.paCatLoad().find(c => c.name === name) || null;

// สำเนารายชื่อ (เผื่อโค้ดส่วนอื่นอ้างอิงแบบเดิม) — ตัวจริงคือ paActiveCats()
window.PA_EXP_CATS = window.PA_CAT_SEED.map(c => c.name);

// ─── หน่วยนับ ──────────────────────────────────────────────────────
window.PA_UNITS = ['คน', 'วัน', 'ครั้ง', 'รายการ', 'เที่ยว', 'คน-วัน', 'เดือน', 'ชุด'];

// ─── แหล่งเงิน ─────────────────────────────────────────────────────
window.PA_FUND_SRC = [
  { v: 'budget',  l: 'งบประมาณประจำปี' },
  { v: 'project', l: 'เงินโครงการ' },
  { v: 'other',   l: 'เงินอื่น ๆ' },
];

// ─── รหัสงบประมาณ (พร้อมยอดคงเหลือ) ─────────────────────────────────
window.PA_BUDGETS = [
  { code: '5101-01', name: 'ค่าใช้จ่ายในการเดินทาง', remaining: 380000 },
  { code: '5102-03', name: 'ค่าฝึกอบรมและสัมมนา', remaining: 620500 },
  { code: '5103-02', name: 'ค่าวัสดุสำนักงาน', remaining: 145200 },
  { code: '5104-05', name: 'ค่าใช้สอยโครงการสมาชิกสัมพันธ์', remaining: 910000 },
  { code: '5105-01', name: 'ค่าจ้างเหมาบริการ', remaining: 268000 },
];
window.paBudget = (code) => window.PA_BUDGETS.find(b => b.code === code) || null;

// ─── ศูนย์ต้นทุน ───────────────────────────────────────────────────
window.PA_COST_CENTERS = [
  { code: 'CC-01', name: 'สำนักงานใหญ่' },
  { code: 'CC-02', name: 'ฝ่ายสินเชื่อ' },
  { code: 'CC-03', name: 'ฝ่ายการเงิน' },
  { code: 'CC-04', name: 'ฝ่ายสมาชิกสัมพันธ์' },
  { code: 'CC-05', name: 'สาขาย่อย' },
];

// ─── วิธีรับเงิน ───────────────────────────────────────────────────
window.PA_METHODS = [
  { v: 'cash',     l: 'เงินสด' },
  { v: 'cheque',   l: 'เช็ค' },
  { v: 'transfer', l: 'โอนเข้าบัญชี' },
];
window.paMethod = (v) => window.PA_METHODS.find(m => m.v === v) || window.PA_METHODS[0];

window.PA_BANKS = [
  'ธ.กรุงไทย', 'ธ.กสิกรไทย', 'ธ.ไทยพาณิชย์', 'ธ.กรุงเทพ', 'ธ.ออมสิน', 'ธ.เพื่อการเกษตรฯ (ธ.ก.ส.)',
];

// ─── ประเภทเอกสารแนบ ────────────────────────────────────────────────
window.PA_DOC_TYPES = [
  'หนังสืออนุมัติโครงการ', 'กำหนดการประชุม / อบรม', 'หนังสือเชิญ',
  'ใบเสนอราคา', 'ประมาณการค่าใช้จ่าย', 'คำสั่งเดินทาง',
  'เอกสารอนุมัติจากผู้บังคับบัญชา', 'เอกสารอื่น ๆ',
];

// ─── สถานะคำขอ ─────────────────────────────────────────────────────
window.PA_STATUS = {
  draft:     { l: 'ร่าง', pill: 'neutral' },
  submitted: { l: 'รออนุมัติ', pill: 'warn' },
  approved:  { l: 'อนุมัติแล้ว', pill: 'info' },
  paid:      { l: 'จ่ายเงินแล้ว', pill: 'ok' },
  cancelled: { l: 'ยกเลิก', pill: 'bad' },
};
window.paStatus = (s) => window.PA_STATUS[s] || window.PA_STATUS.draft;

// ─── ข้อมูลผู้ขอเพิ่มเติม (enrich DN_MEMBERS) ──────────────────────
//  เติม ตำแหน่ง · ผู้บังคับบัญชา · เบอร์/อีเมล · ยอดทดรองคงค้าง
window.PA_MEMBER_EXTRA = {
  'M-067012': { position: 'นายช่างโยธา ชำนาญงาน', supervisor: 'นายประสิทธิ์ วัฒนกิจ (ผอ.กองช่าง)',
    phone: '081-234-5678', email: 'wirat.t@coop.local',
    openAdvances: [
      { id: 'AV-2569-000112', type: 'เดินทาง', amount: 8500, dueDate: '2026-06-30', overdue: true },
    ] },
  'M-066238': { position: 'นักวิชาการศึกษา ปฏิบัติการ', supervisor: 'นางสมหญิง เกษมสุข (ผอ.กองการศึกษา)',
    phone: '089-876-5432', email: 'sudarat.p@coop.local', openAdvances: [] },
  'M-065980': { position: 'เจ้าพนักงานการเงินและบัญชี', supervisor: 'นางสาวปรารถนา ทวีทรัพย์ (หน.ฝ่ายการเงิน)',
    phone: '086-112-3344', email: 'finance3@coop.local',
    openAdvances: [
      { id: 'AV-2569-000098', type: 'จัดซื้อ', amount: 15200, dueDate: '2026-07-20', overdue: false },
      { id: 'AV-2569-000101', type: 'ประชุม', amount: 4300, dueDate: '2026-07-05', overdue: false },
    ] },
};
window.paMemberInfo = (m) => {
  if (!m) return null;
  const x = window.PA_MEMBER_EXTRA[m.code] || {};
  const open = x.openAdvances || [];
  return {
    code: m.code, name: m.name, citizenId: m.citizenId,
    dept: m.dept, deptCode: m.deptCode,
    position: x.position || 'พนักงานสหกรณ์',
    supervisor: x.supervisor || '—',
    phone: x.phone || '', email: x.email || '',
    openAdvances: open,
    openCount: open.length,
    openTotal: open.reduce((s, a) => s + Number(a.amount || 0), 0),
    hasOverdue: open.some(a => a.overdue),
  };
};

// ─── วันที่ / เลขที่ / จัดเก็บ ──────────────────────────────────────
window.paToday = () => new Date().toISOString().slice(0, 10);
window.paBeYear = (d) => (new Date(d || Date.now()).getFullYear()) + 543;

window.paNextNo = (list, be) => {
  const yr = be || window.paBeYear();
  const prefix = `AV-${yr}-`;
  const nums = (list || [])
    .filter(r => String(r.id).startsWith(prefix))
    .map(r => parseInt(String(r.id).slice(prefix.length), 10) || 0);
  const seedMax = 120; // ให้ต่อจากเลขในทะเบียนตั้งต้น
  const next = Math.max(seedMax, ...nums, 0) + 1;
  return prefix + String(next).padStart(6, '0');
};

// ─── งวด/ปีบัญชี (อ้างจากวันที่ทำรายการ) ────────────────────────────
window.paFiscal = (d) => {
  const dt = new Date(d || Date.now());
  const be = dt.getFullYear() + 543;
  const period = dt.getMonth() + 1; // งวด = เดือน
  return { year: be, period, periodLabel: `${String(period).padStart(2, '0')}/${be}`, open: true };
};

// ─── คำนวณจำนวนเงินรายการ + สรุปยอด ─────────────────────────────────
window.paLineAmount = (r) => (Number(r.qty) || 0) * (Number(r.price) || 0);
window.paSummary = (lines, opts) => {
  const o = opts || {};
  const subtotal = (lines || []).reduce((s, r) => s + window.paLineAmount(r), 0);
  const vat = o.vat ? Math.round(subtotal * 0.07 * 100) / 100 : 0;
  const wht = o.wht ? Math.round(subtotal * 0.03 * 100) / 100 : 0;
  const requested = subtotal; // ยอดที่ขอยืม = ผลรวมประมาณการ (ค่าเริ่มต้น)
  return { subtotal, vat, wht, requested };
};

// ─── ทะเบียนคำขอตั้งต้น (seed) ──────────────────────────────────────
window.PA_SEED = [
  {
    id: 'AV-2569-000120', recordDate: '2026-07-08', type: 'meeting',
    refDoc: 'ที่ สอ. 118/2569', refDate: '2026-07-01',
    memberCode: 'M-065980', memberName: 'นางสาวพิมพ์ใจ ธนวัฒน์',
    dept: 'ฝ่ายการเงิน', position: 'เจ้าพนักงานการเงินและบัญชี',
    purpose: 'เข้าร่วมอบรมหลักสูตร “การบริหารความเสี่ยงสหกรณ์ออมทรัพย์” จัดโดยชุมนุมสหกรณ์ฯ',
    project: '', useStart: '2026-07-21', useEnd: '2026-07-23', dueDate: '2026-08-07',
    place: 'โรงแรมเซ็นทารา จ.เชียงใหม่',
    lines: [
      { cat: 'ค่าเดินทาง (พาหนะ/น้ำมัน)', desc: 'ตั๋วเครื่องบินไป-กลับ กรุงเทพฯ–เชียงใหม่', qty: 1, unit: 'เที่ยว', price: 4200, budget: '5102-03', fund: 'budget', cc: 'CC-03', note: '' },
      { cat: 'ค่าที่พัก', desc: 'ค่าที่พัก 2 คืน', qty: 2, unit: 'วัน', price: 1500, budget: '5102-03', fund: 'budget', cc: 'CC-03', note: '' },
      { cat: 'ค่าเบี้ยเลี้ยง / ค่าอาหาร', desc: 'เบี้ยเลี้ยง 3 วัน', qty: 3, unit: 'วัน', price: 320, budget: '5102-03', fund: 'budget', cc: 'CC-03', note: '' },
    ],
    method: 'transfer', bank: 'ธ.กรุงไทย', acctNo: 'xxx-x-x4821-x', acctName: 'นางสาวพิมพ์ใจ ธนวัฒน์',
    receiveDate: '2026-07-18', payNote: '',
    docs: [
      { docType: 'หนังสือเชิญ', docNo: 'ชสอ. 442/2569', docDate: '2026-06-25', fileName: 'invite_ricm.pdf', by: 'พิมพ์ใจ ธ.', at: '2026-07-08', note: '', verified: 'ok' },
      { docType: 'กำหนดการประชุม / อบรม', docNo: '-', docDate: '2026-06-25', fileName: 'agenda.pdf', by: 'พิมพ์ใจ ธ.', at: '2026-07-08', note: '', verified: 'pending' },
    ],
    vat: false, wht: false,
    status: 'submitted', enteredBy: 'นางสาวพิมพ์ใจ ธนวัฒน์', enteredAt: '2026-07-08 10:22',
  },
  {
    id: 'AV-2569-000118', recordDate: '2026-07-04', type: 'travel',
    refDoc: 'คำสั่งเดินทาง 66/2569', refDate: '2026-07-02',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    dept: 'กองช่าง', position: 'นายช่างโยธา ชำนาญงาน',
    purpose: 'ออกสำรวจพื้นที่ก่อสร้างสำนักงานสาขา และประสานงานหน่วยงานท้องถิ่น',
    project: '', useStart: '2026-07-10', useEnd: '2026-07-12', dueDate: '2026-07-27',
    place: 'อ.แม่สอด จ.ตาก',
    lines: [
      { cat: 'ค่าเดินทาง (พาหนะ/น้ำมัน)', desc: 'ค่าน้ำมันรถยนต์ราชการ', qty: 1, unit: 'รายการ', price: 3200, budget: '5101-01', fund: 'budget', cc: 'CC-01', note: '' },
      { cat: 'ค่าที่พัก', desc: 'ค่าที่พัก 2 คืน', qty: 2, unit: 'วัน', price: 1200, budget: '5101-01', fund: 'budget', cc: 'CC-01', note: '' },
    ],
    method: 'cash', bank: '', acctNo: '', acctName: '',
    receiveDate: '2026-07-09', place2: 'ช่องจ่ายเงิน 2 สำนักงานใหญ่', payNote: '',
    docs: [
      { docType: 'คำสั่งเดินทาง', docNo: '66/2569', docDate: '2026-07-02', fileName: 'travel_order66.pdf', by: 'วิรัตน์ ท.', at: '2026-07-04', note: '', verified: 'ok' },
    ],
    vat: false, wht: false,
    status: 'approved', enteredBy: 'นายวิรัตน์ ทองสุข', enteredAt: '2026-07-04 14:05',
  },
];

// ─── localStorage store ────────────────────────────────────────────
window.PA_LS_KEY = 'coop.pettyAdvance.v1';
window.paLoad = () => {
  try {
    const raw = localStorage.getItem(window.PA_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(window.PA_SEED));
};
window.paSave = (list) => {
  try { localStorage.setItem(window.PA_LS_KEY, JSON.stringify(list)); } catch (e) {}
};

window.PA_USER = 'นางจันทร์เพ็ญ มาลี';
