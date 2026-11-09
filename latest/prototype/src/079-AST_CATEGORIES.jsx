// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ทะเบียนครุภัณฑ์ (Fixed Asset Register)
//  ข้อมูลตั้งต้น: หมวดหมู่ครุภัณฑ์ (ผูกอายุการใช้งาน) · สถานที่ · แผนก
//  · ผู้รับผิดชอบ · ผู้จัดจำหน่าย · สถานะ · ทะเบียนครุภัณฑ์ตัวอย่าง
//  + เครื่องคำนวณค่าเสื่อมราคาแบบเส้นตรง (Straight-line)
// ════════════════════════════════════════════════════════════════════

// ─── หมวดหมู่ครุภัณฑ์ (Master Data) ─────────────────────────────────
//  prefix = คำนำหน้ารหัสครุภัณฑ์ · life = อายุการใช้งานมาตรฐาน (ปี) ผูกไว้
//  เพื่อ Auto-fill · gl = รหัสผังบัญชีสินทรัพย์ถาวรที่เกี่ยวข้อง
window.AST_CATEGORIES = [
  { id: 'it',        prefix: 'IT',  name: 'อุปกรณ์ไอที (คอมพิวเตอร์/อุปกรณ์ต่อพ่วง)', life: 5,  gl: '1210-01' },
  { id: 'office',    prefix: 'OFF', name: 'เครื่องใช้สำนักงาน',                      life: 5,  gl: '1210-02' },
  { id: 'furniture', prefix: 'FUR', name: 'ครุภัณฑ์สำนักงาน / เฟอร์นิเจอร์',         life: 10, gl: '1210-03' },
  { id: 'electric',  prefix: 'ELC', name: 'เครื่องใช้ไฟฟ้า',                         life: 5,  gl: '1210-04' },
  { id: 'vehicle',   prefix: 'VEH', name: 'ยานพาหนะและอุปกรณ์ขนส่ง',                life: 5,  gl: '1220-01' },
  { id: 'building',  prefix: 'BLD', name: 'ส่วนปรับปรุงอาคาร',                       life: 20, gl: '1230-01' },
  // หมวดที่ "ไม่คิดค่าเสื่อมราคา" — วัสดุใช้แล้วหมดไป และซอฟต์แวร์/สิทธิการใช้งาน
  { id: 'consumable', prefix: 'SUP', name: 'วัสดุสิ้นเปลือง / ใช้แล้วหมดไป',          life: 0,  gl: '5210-01', noDep: true, bulk: true },
  { id: 'software',   prefix: 'SW',  name: 'ซอฟต์แวร์ / สิทธิการใช้งาน (Software)',     life: 0,  gl: '1240-01', noDep: true },
];
window.astCat = (id) => window.AST_CATEGORIES.find(c => c.id === id) || null;
window.astCatNoDep = (id) => !!(window.astCat(id) || {}).noDep;
// หมวดแบบนับสต็อกรวม (ใช้แล้วหมดไป) — ขึ้นทะเบียนรวมรายการเดียว (ไม่แยกรหัสต่อชิ้น)
window.astCatBulk = (id) => !!(window.astCat(id) || {}).bulk;

// ─── สถานที่ตั้ง (Master Data) ──────────────────────────────────────
window.AST_LOCATIONS = [
  { v: 'hq',     l: 'สำนักงานใหญ่ — อาคารอำนวยการ' },
  { v: 'hq-2',   l: 'สำนักงานใหญ่ — อาคาร 2 (ฝ่ายสินเชื่อ)' },
  { v: 'br-n',   l: 'สาขาเหนือ — อำเภอเมือง' },
  { v: 'br-s',   l: 'สาขาใต้ — นิคมอุตสาหกรรม' },
  { v: 'store',  l: 'คลังพัสดุกลาง' },
];

// ─── แผนกที่ใช้งาน (Master Data) ────────────────────────────────────
window.AST_DEPARTMENTS = [
  { v: 'it',      l: 'ฝ่ายเทคโนโลยีสารสนเทศ' },
  { v: 'finance', l: 'ฝ่ายการเงินและบัญชี' },
  { v: 'credit',  l: 'ฝ่ายสินเชื่อ' },
  { v: 'member',  l: 'ฝ่ายทะเบียนสมาชิก' },
  { v: 'admin',   l: 'ฝ่ายบริหารทั่วไป' },
  { v: 'manager', l: 'สำนักผู้จัดการ' },
];

// ─── ผู้รับผิดชอบ / ผู้ครอบครอง (ดึงรายชื่อพนักงาน) ────────────────
window.AST_CUSTODIANS = [
  { v: 'E-0102', l: 'นางจันทร์เพ็ญ มาลี',      dept: 'finance' },
  { v: 'E-0118', l: 'นายสุริยา เทพบรรเทิง',    dept: 'it' },
  { v: 'E-0140', l: 'นางสาวสาวิตรี อินทรโชติ',  dept: 'credit' },
  { v: 'E-0155', l: 'นายประสิทธิ์ คงทอง',       dept: 'manager' },
  { v: 'E-0166', l: 'นางสาวพรพิมล ทองคำ',      dept: 'member' },
  { v: 'E-0171', l: 'นายอนุชา สุขสวัสดิ์',       dept: 'admin' },
];

// ─── ผู้จัดจำหน่าย (Vendor Master Data) ─────────────────────────────
window.AST_VENDORS = [
  { v: 'V-001', l: 'บจก. คอมพิวเตอร์ ซิสเต็ม ไอที',      tax: '0105545012341' },
  { v: 'V-002', l: 'บจก. โอเอ ออฟฟิศ ซัพพลาย',          tax: '0105540098765' },
  { v: 'V-003', l: 'หจก. เฟอร์นิเจอร์ ดีไซน์ เซ็นเตอร์',  tax: '0103538001122' },
  { v: 'V-004', l: 'บจก. โตโยต้า ลีสซิ่ง (ประเทศไทย)',   tax: '0105519007788' },
  { v: 'V-005', l: 'บจก. ไทยอิเล็คทรอนิคส์ มาร์ท',       tax: '0105549033445' },
];

// ─── รอบบำรุงรักษาเชิงป้องกัน (PM Cycle) ────────────────────────────
window.AST_PM_CYCLES = [
  { v: '',    l: 'ไม่มีรอบ PM' },
  { v: '3m',  l: 'ทุก 3 เดือน' },
  { v: '6m',  l: 'ทุก 6 เดือน' },
  { v: '12m', l: 'ทุก 12 เดือน' },
  { v: '24m', l: 'ทุก 24 เดือน' },
];
window.astPmCycleLabel = (v) => (window.AST_PM_CYCLES.find(c => c.v === v) || {}).l || 'ไม่มีรอบ PM';

// ─── วิธีคิดค่าเสื่อมราคา ──────────────────────────────────────────
window.AST_DEP_METHODS = [
  { v: 'straight',  l: 'เส้นตรง (Straight-line)' },
  { v: 'declining', l: 'ยอดลดลงทวีคูณ (Declining Balance)' },
  { v: 'none',      l: 'ไม่คิดค่าเสื่อมราคา' },
];
window.astDepMethodLabel = (v) => (window.AST_DEP_METHODS.find(m => m.v === v) || {}).l || 'เส้นตรง (Straight-line)';

// ─── แหล่งงบประมาณจัดซื้อ ───────────────────────────────────────────
window.AST_BUDGETS = [
  { v: '',          l: '— ไม่ระบุ —' },
  { v: 'capital',   l: 'งบลงทุน (ครุภัณฑ์)' },
  { v: 'operation', l: 'งบดำเนินงาน' },
  { v: 'welfare',   l: 'งบสวัสดิการ' },
  { v: 'it-dev',    l: 'งบพัฒนาระบบสารสนเทศ' },
];
window.astBudgetLabel = (v) => (window.AST_BUDGETS.find(b => b.v === v) || {}).l || '— ไม่ระบุ —';

// ─── ประเภทรายการในประวัติครุภัณฑ์ ──────────────────────────────────
window.AST_HISTORY_TYPES = {
  transfer: { l: 'โอนย้าย',   pill: 'info' },
  repair:   { l: 'ซ่อมบำรุง', pill: 'warn' },
  audit:    { l: 'ตรวจนับ',   pill: 'ok' },
  borrow:   { l: 'ยืม–คืน',   pill: 'neutral' },
  dispose:  { l: 'จำหน่าย',   pill: 'bad' },
};
window.AST_HISTORY_ORDER = ['transfer', 'repair', 'audit', 'borrow', 'dispose'];

// ─── สถานะครุภัณฑ์ ──────────────────────────────────────────────────
window.AST_STATUS = {
  in_use:   { l: 'ใช้งานปกติ',        pill: 'ok' },
  repair:   { l: 'ส่งซ่อม / บำรุงรักษา', pill: 'warn' },
  idle:     { l: 'ว่าง / รอจัดสรร',    pill: 'neutral' },
  disposed: { l: 'จำหน่าย / ตัดออก',   pill: 'bad' },
};
window.AST_STATUS_ORDER = ['in_use', 'repair', 'idle', 'disposed'];

// ─── ทะเบียนครุภัณฑ์ตัวอย่าง ────────────────────────────────────────
window.AST_SEED = [
  {
    id: 'IT-2026-001', name: 'คอมพิวเตอร์โน้ตบุ๊กสำหรับงานกราฟิก', category: 'it',
    brand: 'Dell', model: 'Precision 5680', serial: 'CN-0M7K9P-74180', status: 'in_use',
    detail: 'CPU Core i9 / RAM 32GB / SSD 1TB / การ์ดจอ RTX 4070 สำหรับงานออกแบบสื่อประชาสัมพันธ์',
    acquiredDate: '2025-01-15', vendor: 'V-001', poNo: 'PO-2568-0042',
    warrantyStart: '2025-01-15', warrantyEnd: '2028-01-14',
    location: 'hq', room: 'ห้องประชาสัมพันธ์ ชั้น 2', department: 'admin', custodian: 'E-0166',
    cost: 65000, life: 5, salvage: 1, depStart: '2025-01-15',
    vat: 7, budget: 'it-dev', building: 'อาคารอำนวยการ', pmCycle: '12m', serviceProvider: 'V-001', alertDays: 30,
    images: ['notebook-front.jpg', 'serial-label.jpg'], docs: ['ใบรับประกัน-Dell.pdf'],
    taxInvoices: ['ใบกำกับภาษี-PO2568-0042.pdf'], repairDocs: [],
    history: [
      { date: '2025-01-15', type: 'transfer', detail: 'รับเข้าทะเบียน — มอบห้องประชาสัมพันธ์ ชั้น 2', by: 'นายสุริยา เทพบรรเทิง' },
      { date: '2025-12-04', type: 'audit', detail: 'ตรวจนับประจำปี — สภาพปกติ ครบถ้วน', by: 'คณะกรรมการตรวจนับ' },
    ],
  },
  {
    id: 'IT-2026-002', name: 'เครื่องคอมพิวเตอร์แม่ข่าย (Server)', category: 'it',
    brand: 'HPE', model: 'ProLiant DL380 Gen11', serial: 'SGH204X9KK', status: 'in_use',
    detail: 'เซิร์ฟเวอร์ฐานข้อมูลระบบ ERP สหกรณ์ ติดตั้งในห้อง Data Center',
    acquiredDate: '2024-11-02', vendor: 'V-001', poNo: 'PO-2567-0311',
    warrantyStart: '2024-11-02', warrantyEnd: '2027-11-01',
    location: 'hq', room: 'ห้อง Data Center ชั้น 1', department: 'it', custodian: 'E-0118',
    cost: 285000, life: 5, salvage: 1, depStart: '2024-11-02',
    images: ['server-rack.jpg'], docs: ['ใบส่งมอบ-Server.pdf'],
  },
  {
    id: 'OFF-2025-014', name: 'เครื่องถ่ายเอกสารมัลติฟังก์ชัน', category: 'office',
    brand: 'Canon', model: 'imageRUNNER 2630i', serial: 'QCR09182', status: 'repair',
    detail: 'รองรับสแกน/พิมพ์/แฟกซ์ ใช้งานส่วนกลางชั้น 1',
    acquiredDate: '2024-06-20', vendor: 'V-002', poNo: 'PO-2567-0188',
    warrantyStart: '2024-06-20', warrantyEnd: '2026-06-19',
    location: 'hq', room: 'จุดบริการเอกสาร ชั้น 1', department: 'admin', custodian: 'E-0171',
    cost: 78000, life: 5, salvage: 1, depStart: '2024-06-20',
    vat: 7, budget: 'operation', building: 'อาคารอำนวยการ', pmCycle: '6m', serviceProvider: 'V-002', alertDays: 30,
    images: [], docs: ['คู่มือ-iR2630i.pdf'], taxInvoices: [], repairDocs: ['ใบแจ้งซ่อม-Canon-6905.pdf'],
    history: [
      { date: '2024-06-20', type: 'transfer', detail: 'ติดตั้งจุดบริการเอกสาร ชั้น 1', by: 'นายอนุชา สุขสวัสดิ์' },
      { date: '2026-05-18', type: 'repair', detail: 'ส่งซ่อมชุดดรัม — รออะไหล่จากผู้ให้บริการ', by: 'ฝ่ายพัสดุ' },
    ],
  },
  {
    id: 'FUR-2024-052', name: 'ชุดโต๊ะประชุมไม้จริง 12 ที่นั่ง', category: 'furniture',
    brand: 'Modernform', model: 'Conference Oak-12', serial: '—', status: 'in_use',
    detail: 'โต๊ะประชุมพร้อมเก้าอี้ ใช้ในห้องประชุมคณะกรรมการ',
    acquiredDate: '2023-09-12', vendor: 'V-003', poNo: 'PO-2566-0241',
    warrantyStart: '2023-09-12', warrantyEnd: '2025-09-11',
    location: 'hq', room: 'ห้องประชุมคณะกรรมการ ชั้น 3', department: 'manager', custodian: 'E-0155',
    cost: 148000, life: 10, salvage: 1, depStart: '2023-09-12',
    images: ['meeting-table.jpg'], docs: [],
  },
  {
    id: 'VEH-2024-003', name: 'รถยนต์ตู้ส่วนกลาง', category: 'vehicle',
    brand: 'Toyota', model: 'Commuter 3.0', serial: 'MR0FR22G1P0123456', status: 'in_use',
    detail: 'ทะเบียน นข-2456 ใช้รับ-ส่งเอกสารและกิจกรรมสหกรณ์',
    acquiredDate: '2023-03-08', vendor: 'V-004', poNo: 'PO-2566-0067',
    warrantyStart: '2023-03-08', warrantyEnd: '2026-03-07',
    location: 'hq', room: 'โรงจอดรถสำนักงาน', department: 'admin', custodian: 'E-0171',
    cost: 1390000, life: 5, salvage: 1, depStart: '2023-03-08',
    images: ['van-exterior.jpg'], docs: ['เล่มทะเบียนรถ.pdf', 'กรมธรรม์ประกันภัย.pdf'],
  },
  {
    id: 'ELC-2025-008', name: 'เครื่องปรับอากาศ ขนาด 36,000 BTU', category: 'electric',
    brand: 'Daikin', model: 'Inverter FTKM36', serial: 'DKN2025-7782', status: 'idle',
    detail: 'สำรองสำหรับห้องเซิร์ฟเวอร์ ยังไม่ติดตั้ง',
    acquiredDate: '2025-02-28', vendor: 'V-005', poNo: 'PO-2568-0079',
    warrantyStart: '2025-02-28', warrantyEnd: '2030-02-27',
    location: 'store', room: 'คลังพัสดุ ชั้น G', department: 'it', custodian: 'E-0118',
    cost: 42000, life: 5, salvage: 1, depStart: '2025-02-28',
    unit: 'เครื่อง', minQty: 0, received: 1, issued: 0,
    images: [], docs: ['ใบรับประกัน-Daikin.pdf'],
    movements: [
      { id: 'RV-20250228-01', type: 'receive', date: '2025-02-28', qty: 1, doc: 'GR-2568-0079', party: 'V-005', unitCost: 42000, note: 'รับเข้าสำรองห้องเซิร์ฟเวอร์ — ยังไม่ติดตั้ง', by: 'นายสุริยา เทพบรรเทิง' },
    ],
  },
  {
    id: 'SUP-2026-001', name: 'หมึกพิมพ์เลเซอร์ (Toner) สำรองคลัง', category: 'consumable',
    brand: 'HP', model: '26A (CF226A)', serial: '—', status: 'in_use',
    detail: 'หมึกพิมพ์สำหรับเครื่องพิมพ์ส่วนกลาง จัดเก็บที่คลังพัสดุกลางเพื่อจ่ายตามคำขอเบิก',
    acquiredDate: '2026-01-10', vendor: 'V-002', poNo: 'PO-2569-0005',
    warrantyStart: '', warrantyEnd: '',
    location: 'store', room: 'คลังพัสดุ ชั้น G', department: 'admin', custodian: 'E-0171',
    cost: 2900, life: 0, salvage: 0, depStart: '2026-01-10',
    vat: 7, budget: 'operation', building: 'อาคารอำนวยการ', pmCycle: '', serviceProvider: '', alertDays: 30,
    unit: 'กล่อง', minQty: 10, received: 50, issued: 18,
    images: [], docs: [], taxInvoices: ['ใบกำกับภาษี-PO2569-0005.pdf'], repairDocs: [], history: [],
    movements: [
      { id: 'RV-20260110-01', type: 'receive', date: '2026-01-10', qty: 50, doc: 'GR-2569-0011', party: 'V-002', unitCost: 2900, note: 'รับเข้าตามใบสั่งซื้อ PO-2569-0005', by: 'นายอนุชา สุขสวัสดิ์' },
      { id: 'IS-20260204-01', type: 'issue', date: '2026-02-04', qty: 6, dept: 'admin', requester: 'E-0171', purpose: 'เบิกใช้งานสำนักงานกลาง', note: '', by: 'นายอนุชา สุขสวัสดิ์' },
      { id: 'IS-20260320-01', type: 'issue', date: '2026-03-20', qty: 12, dept: 'credit', requester: 'E-0140', purpose: 'เบิกใช้ฝ่ายสินเชื่อ', note: '', by: 'นายอนุชา สุขสวัสดิ์' },
    ],
  },
  {
    id: 'OFF-2026-002', name: 'เก้าอี้สำนักงานเพื่อสุขภาพ', category: 'office',
    brand: 'Ergotrend', model: 'Wofford-01', serial: '—', status: 'in_use',
    detail: 'เก้าอี้สำนักงานล็อตจัดซื้อรวม สำรองไว้ที่คลังเพื่อจ่ายตามคำขอเบิกของหน่วยงาน',
    acquiredDate: '2026-02-01', vendor: 'V-003', poNo: 'PO-2569-0019',
    warrantyStart: '2026-02-01', warrantyEnd: '2028-01-31',
    location: 'store', room: 'คลังพัสดุ ชั้น G', department: 'admin', custodian: 'E-0171',
    cost: 4500, life: 5, salvage: 1, depStart: '2026-02-01',
    vat: 7, budget: 'operation', building: 'อาคารอำนวยการ', pmCycle: '', serviceProvider: '', alertDays: 30,
    unit: 'ตัว', minQty: 4, received: 20, issued: 6,
    images: [], docs: [], taxInvoices: [], repairDocs: [], history: [],
    movements: [
      { id: 'RV-20260201-01', type: 'receive', date: '2026-02-01', qty: 20, doc: 'GR-2569-0024', party: 'V-003', unitCost: 4500, note: 'รับเข้าล็อตจัดซื้อเก้าอี้สำนักงาน', by: 'นายอนุชา สุขสวัสดิ์' },
      { id: 'IS-20260210-01', type: 'issue', date: '2026-02-10', qty: 6, dept: 'finance', requester: 'E-0102', purpose: 'จัดสรรให้ฝ่ายการเงินและบัญชี', note: '', by: 'นายอนุชา สุขสวัสดิ์' },
    ],
  },
];

// ─── โหลด/บันทึก (localStorage) ─────────────────────────────────────
// เติมฟิลด์ใหม่ให้ครบถ้วน (รองรับข้อมูลเก่าใน localStorage)
window.astNormalize = function (a) {
  return {
    vat: 7, budget: '', building: '', pmCycle: '', serviceProvider: '', alertDays: 30,
    depMethod: 'straight', taxInvoices: [], repairDocs: [], history: [],
    // ── สต็อก (รับเข้า/เบิกออก) ──
    unit: 'หน่วย', minQty: 0, received: 1,
    issued: (a.status === 'idle' || a.status === 'disposed') ? 0 : 1,
    movements: [],
    // ── สถานะการขึ้นทะเบียน: ข้อมูลเดิมถือว่าขึ้นทะเบียนแล้ว ──
    registered: true,
    ...a,
  };
};

// ─── รหัสชั่วคราวสำหรับครุภัณฑ์ใหม่ที่รับเข้าแต่ยังไม่ขึ้นทะเบียน ──
//  รูปแบบ NEW-<yyyymmdd>-<run 2 หลัก> — จะถูกแทนที่ด้วยเลขทะเบียนจริงเมื่อขึ้นทะเบียน
window.astPendingId = function (list, dateIso) {
  const ymd = (dateIso || window.astToday()).replace(/-/g, '');
  const head = 'NEW-' + ymd + '-';
  let max = 0;
  (list || []).forEach(a => {
    if (typeof a.id === 'string' && a.id.startsWith(head)) {
      const n = parseInt(a.id.slice(head.length), 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
  });
  return head + String(max + 1).padStart(2, '0');
};
window.astLoad = function () {
  let list = null;
  try { const s = localStorage.getItem('assets'); if (s) list = JSON.parse(s); } catch (e) {}
  if (!list) list = JSON.parse(JSON.stringify(window.AST_SEED));
  return list.map(window.astNormalize);
};
window.astSave = function (list) { try { localStorage.setItem('assets', JSON.stringify(list)); } catch (e) {} };

window.astToday = () => new Date().toISOString().slice(0, 10);

// ─── สร้างรหัสครุภัณฑ์อัตโนมัติ: <PREFIX>-<ปี>-<running 3 หลัก> ──────
window.astNextId = function (list, categoryId, dateIso) {
  const cat = window.astCat(categoryId);
  const prefix = cat ? cat.prefix : 'AST';
  const year = new Date(dateIso || window.astToday()).getFullYear();
  const head = `${prefix}-${year}-`;
  const max = (list || []).reduce((mx, a) => {
    if (typeof a.id === 'string' && a.id.startsWith(head)) {
      const n = parseInt(a.id.slice(head.length), 10);
      if (!isNaN(n)) return Math.max(mx, n);
    }
    return mx;
  }, 0);
  return head + String(max + 1).padStart(3, '0');
};

// ─── เครื่องคำนวณค่าเสื่อมราคาแบบเส้นตรง (Straight-line) ────────────
//  คืนค่า: annual(ต่อปี) · monthly(ต่อเดือน) · accumulated(สะสมถึงปัจจุบัน)
//  · bookValue(มูลค่าตามบัญชี) · pct(% เสื่อมแล้ว) · monthsElapsed · done
window.astDepreciation = function (a, asOfIso) {
  // หมวดที่ไม่คิดค่าเสื่อม (วัสดุใช้แล้วหมดไป / Software)
  if (window.astCatNoDep && window.astCatNoDep(a.category)) {
    const c0 = Number(a.cost) || 0;
    return { annual: 0, monthly: 0, accumulated: 0, bookValue: c0, pct: 0, monthsElapsed: 0, done: true, noDep: true };
  }
  const cost = Number(a.cost) || 0;
  const salvage = Number(a.salvage) || 0;
  const life = Number(a.life) || 0;
  const base = Math.max(0, cost - salvage);
  if (!life || base <= 0) {
    return { annual: 0, monthly: 0, accumulated: 0, bookValue: cost, pct: 0, monthsElapsed: 0, done: false };
  }
  const annual = base / life;
  const monthly = annual / 12;
  const start = new Date(a.depStart || a.acquiredDate || window.astToday());
  const asOf = new Date(asOfIso || window.astToday());
  let months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
  if (asOf.getDate() >= start.getDate()) months += 0; // นับงวดที่เริ่มแล้ว
  months = Math.max(0, months);
  const totalMonths = life * 12;
  const cappedMonths = Math.min(months, totalMonths);
  const accumulated = Math.min(base, monthly * cappedMonths);
  const bookValue = cost - accumulated;
  const pct = base > 0 ? (accumulated / base) * 100 : 0;
  return {
    annual, monthly, accumulated, bookValue,
    pct: Math.min(100, pct), monthsElapsed: months,
    done: cappedMonths >= totalMonths,
  };
};

// ─── สถานะการรับประกัน (ใช้กับ badge ในตาราง/ฟอร์ม) ────────────────
window.astWarranty = function (a, asOfIso) {
  if (!a.warrantyEnd) return { state: 'none', days: null };
  const end = new Date(a.warrantyEnd);
  const asOf = new Date(asOfIso || window.astToday());
  const days = Math.round((end - asOf) / 86400000);
  if (days < 0) return { state: 'expired', days };
  if (days <= 60) return { state: 'soon', days };
  return { state: 'active', days };
};

// ════════════════════════════════════════════════════════════════════
//  สต็อกครุภัณฑ์ — เชื่อมโยง 3 เมนู: ทะเบียน · รับเข้า · เบิกออก
//  received = รับเข้าสะสม · issued = เบิกออกสะสม · onHand = คงเหลือในสต็อก
// ════════════════════════════════════════════════════════════════════
window.AST_MOVE_TYPES = {
  receive: { l: 'รับเข้า', pill: 'ok',   sign: 1,  icon: 'download' },
  issue:   { l: 'เบิกออก', pill: 'info', sign: -1, icon: 'upload' },
};

// จำนวนคงเหลือในสต็อก
window.astOnHand = (a) => Math.max(0, (Number(a.received) || 0) - (Number(a.issued) || 0));

// สถานะสต็อก (สำหรับ pill) — แจ้งเตือนสีแดงเฉพาะรายการที่กำหนดจุดสั่งซื้อ (minQty)
window.astStockState = function (a) {
  const oh = window.astOnHand(a);
  const min = Number(a.minQty) || 0;
  if (oh <= 0) {
    return min > 0
      ? { state: 'out', l: 'หมดสต็อก', pill: 'bad' }
      : { state: 'none', l: 'จ่ายครบแล้ว', pill: 'neutral' };
  }
  if (min > 0 && oh <= min) return { state: 'low', l: 'ใกล้หมด', pill: 'warn' };
  return { state: 'in', l: 'มีในสต็อก', pill: 'ok' };
};

// รวมรายการเคลื่อนไหวจากทุกครุภัณฑ์ (เติม assetId/assetName/unit) เรียงล่าสุดก่อน
window.astMovements = function (assets, type) {
  const rows = [];
  (assets || []).forEach(a => (a.movements || []).forEach(m => {
    if (!type || m.type === type) {
      rows.push({ ...m, assetId: a.id, assetName: a.name, category: a.category, unit: a.unit || 'หน่วย' });
    }
  }));
  rows.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : (x.id < y.id ? 1 : -1)));
  return rows;
};

// เลขที่เอกสารเคลื่อนไหว: RV-/IS- <yyyymmdd>-<run 2 หลัก>
window.astMoveNextId = function (assets, type, dateIso) {
  const prefix = type === 'receive' ? 'RV' : 'IS';
  const ymd = (dateIso || window.astToday()).replace(/-/g, '');
  const head = `${prefix}-${ymd}-`;
  let max = 0;
  (assets || []).forEach(a => (a.movements || []).forEach(m => {
    if (typeof m.id === 'string' && m.id.startsWith(head)) {
      const n = parseInt(m.id.slice(head.length), 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
  }));
  return head + String(max + 1).padStart(2, '0');
};

// ลงรายการเคลื่อนไหว + อัปเดตยอด received/issued ของครุภัณฑ์ที่อ้างถึง
window.astApplyMovement = function (assets, assetId, mv) {
  return assets.map(a => {
    if (a.id !== assetId) return a;
    const next = { ...a, movements: [{ ...mv }, ...(a.movements || [])] };
    if (mv.type === 'receive') next.received = (Number(a.received) || 0) + Number(mv.qty || 0);
    else next.issued = (Number(a.issued) || 0) + Number(mv.qty || 0);
    // แนบไฟล์จากการรับเข้าเข้าสู่ทะเบียนครุภัณฑ์ (รูปภาพ / เอกสารที่เกี่ยวข้อง)
    if (mv.images && mv.images.length) next.images = [...(a.images || []), ...mv.images];
    if (mv.docs && mv.docs.length) next.taxInvoices = [...(a.taxInvoices || []), ...mv.docs];
    return next;
  });
};
