// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — ค่าคงที่
//  · กำหนดโครงสร้างงบประมาณ : ผังต้นไม้หมวดงบประมาณ 3 ระดับ (โครงสร้างเท่านั้น
//    ไม่มีตัวเลข/ปีงบประมาณ) — ใช้เป็นค่าคงที่ให้เมนู "กำหนดงบประมาณ" เรียกใช้
//  · กำหนดงบประมาณ : ตั้งปีงบประมาณ แล้วกรอกตัวเลขแต่ละหมวดตามโครงสร้าง
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก: ประเภทงบประมาณ / ลักษณะรายการ ───────────────────────
window.BUD_OPTS = {
  type: [
    { v: 'operating', l: 'งบดำเนินงาน' },
    { v: 'capital',   l: 'งบลงทุน' },
  ],
  nature: [
    { v: 'expense', l: 'รายจ่าย' },
    { v: 'revenue', l: 'รายรับ' },
  ],
};
window.budLabel = (group, value) => {
  const o = (window.BUD_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value || '—');
};

// ─── ผังบัญชี (General Ledger) สำหรับผูกพันกับหมวดงบประมาณ ───────────
window.GL_ACCOUNTS = [
  { code: '1210', name: 'ครุภัณฑ์สำนักงาน',                 cls: 'สินทรัพย์' },
  { code: '1220', name: 'ครุภัณฑ์คอมพิวเตอร์',              cls: 'สินทรัพย์' },
  { code: '1230', name: 'โปรแกรมคอมพิวเตอร์ (สินทรัพย์ไม่มีตัวตน)', cls: 'สินทรัพย์' },
  { code: '1240', name: 'อาคารและสิ่งปลูกสร้าง',            cls: 'สินทรัพย์' },
  { code: '4100', name: 'ดอกเบี้ยรับเงินให้กู้',             cls: 'รายได้' },
  { code: '4200', name: 'ค่าธรรมเนียมแรกเข้า',              cls: 'รายได้' },
  { code: '4300', name: 'รายได้อื่น',                       cls: 'รายได้' },
  { code: '5101', name: 'เงินเดือนและค่าจ้าง',              cls: 'ค่าใช้จ่าย' },
  { code: '5102', name: 'ค่าล่วงเวลาและเบี้ยเลี้ยง',         cls: 'ค่าใช้จ่าย' },
  { code: '5110', name: 'สวัสดิการและค่ารักษาพยาบาลพนักงาน', cls: 'ค่าใช้จ่าย' },
  { code: '5201', name: 'ค่าน้ำประปาและไฟฟ้า',              cls: 'ค่าใช้จ่าย' },
  { code: '5202', name: 'ค่าโทรศัพท์และอินเทอร์เน็ต',        cls: 'ค่าใช้จ่าย' },
  { code: '5203', name: 'ค่าวัสดุสำนักงาน',                 cls: 'ค่าใช้จ่าย' },
  { code: '5204', name: 'ค่าซ่อมแซมและบำรุงรักษา',          cls: 'ค่าใช้จ่าย' },
  { code: '5301', name: 'ค่าตอบแทนกรรมการดำเนินการ',        cls: 'ค่าใช้จ่าย' },
  { code: '5302', name: 'ค่าใช้จ่ายประชุมใหญ่สามัญ',         cls: 'ค่าใช้จ่าย' },
  { code: '5401', name: 'ทุนการศึกษาบุตรสมาชิก',            cls: 'ค่าใช้จ่าย' },
  { code: '5402', name: 'เงินสงเคราะห์ฌาปนกิจ',             cls: 'ค่าใช้จ่าย' },
  { code: '5403', name: 'เงินช่วยเหลือสมาชิก',              cls: 'ค่าใช้จ่าย' },
];
window.glLabel = (code) => {
  if (!code) return null;
  // อ้างอิงชื่อบัญชีจากค่าคงที่ "ผังบัญชี" (data-coa.js) ก่อน แล้วจึง fallback
  if (window.coaAccountName) { const n = window.coaAccountName(code); if (n) return n; }
  const g = (window.GL_ACCOUNTS || []).find(a => a.code === code);
  return g ? g.name : null;
};

// ─── ค่าตั้งต้นของ "รูปแบบรหัสอัตโนมัติ" ─────────────────────────────
// โครงสร้างแบบลำดับชั้น: ระดับ 1 = 1 หลัก, ระดับ 2 ต่อท้าย 1 หลัก,
// ระดับ 3 ต่อท้าย 2 หลัก  →  ตัวอย่าง  5 / 51 / 5101
window.BUD_CODECFG_DEFAULT = {
  auto: true, separator: '', rootLen: 1, lvl2Append: 1, lvl3Append: 2,
};

// ─── โครงสร้างงบประมาณตั้งต้น (ผังต้นไม้ 3 ระดับ) — โครงสร้างเท่านั้น ─
// ไม่มีตัวเลขงบประมาณ/ปีงบประมาณ — ตัวเลขจะกำหนดที่เมนู "กำหนดงบประมาณ"
window.BUDGET_SEED = [
  {
    id: 'B5', code: '5', name: 'งบดำเนินงาน', type: 'operating', nature: 'expense',
    gl: null, enabled: true, note: 'ค่าใช้จ่ายในการดำเนินงานปกติของสหกรณ์',
    children: [
      {
        id: 'B51', code: '51', name: 'ค่าใช้จ่ายเกี่ยวกับพนักงาน', type: 'operating', nature: 'expense',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B5101', code: '5101', name: 'เงินเดือนและค่าจ้าง',        type: 'operating', nature: 'expense', gl: '520100', enabled: true, note: '', children: [] },
          { id: 'B5102', code: '5102', name: 'ค่าล่วงเวลาและเบี้ยเลี้ยง',    type: 'operating', nature: 'expense', gl: '520110', enabled: true, note: '', children: [] },
          { id: 'B5103', code: '5103', name: 'สวัสดิการและค่ารักษาพยาบาล',   type: 'operating', nature: 'expense', gl: '520120', enabled: true, note: '', children: [] },
        ],
      },
      {
        id: 'B52', code: '52', name: 'ค่าใช้จ่ายสำนักงาน', type: 'operating', nature: 'expense',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B5201', code: '5201', name: 'ค่าสาธารณูปโภค',         type: 'operating', nature: 'expense', gl: '520200', enabled: true, note: 'ค่าน้ำ–ไฟ–โทรศัพท์–อินเทอร์เน็ต', children: [] },
          { id: 'B5202', code: '5202', name: 'ค่าวัสดุสำนักงาน',        type: 'operating', nature: 'expense', gl: '520400', enabled: true, note: '', children: [] },
          { id: 'B5203', code: '5203', name: 'ค่าซ่อมแซมและบำรุงรักษา', type: 'operating', nature: 'expense', gl: '520500', enabled: true, note: '', children: [] },
        ],
      },
      {
        id: 'B53', code: '53', name: 'ค่าใช้จ่ายในการบริหาร', type: 'operating', nature: 'expense',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B5301', code: '5301', name: 'ค่าตอบแทนกรรมการดำเนินการ', type: 'operating', nature: 'expense', gl: '520300', enabled: true, note: '', children: [] },
          { id: 'B5302', code: '5302', name: 'ค่าใช้จ่ายประชุมใหญ่สามัญ',  type: 'operating', nature: 'expense', gl: '520600', enabled: true, note: '', children: [] },
        ],
      },
    ],
  },
  {
    id: 'B6', code: '6', name: 'งบลงทุน', type: 'capital', nature: 'expense',
    gl: null, enabled: true, note: 'รายจ่ายฝ่ายทุน — สินทรัพย์ถาวรและสินทรัพย์ไม่มีตัวตน',
    children: [
      {
        id: 'B61', code: '61', name: 'งบลงทุนเทคโนโลยีสารสนเทศ', type: 'capital', nature: 'expense',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B6101', code: '6101', name: 'ระบบสารสนเทศและซอฟต์แวร์',      type: 'capital', nature: 'expense', gl: '120200', enabled: true, note: 'โครงการพัฒนาระบบ ERP สหกรณ์', children: [] },
          { id: 'B6102', code: '6102', name: 'อุปกรณ์คอมพิวเตอร์และเครือข่าย', type: 'capital', nature: 'expense', gl: '120104', enabled: true, note: '', children: [] },
        ],
      },
      {
        id: 'B62', code: '62', name: 'งบลงทุนครุภัณฑ์และอาคาร', type: 'capital', nature: 'expense',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B6201', code: '6201', name: 'ครุภัณฑ์สำนักงาน',        type: 'capital', nature: 'expense', gl: '120103', enabled: true, note: '', children: [] },
          { id: 'B6202', code: '6202', name: 'ปรับปรุงอาคารสำนักงาน',   type: 'capital', nature: 'expense', gl: '120102', enabled: true, note: '', children: [] },
        ],
      },
    ],
  },
  {
    id: 'B7', code: '7', name: 'งบสวัสดิการสมาชิก', type: 'operating', nature: 'expense',
    gl: null, enabled: true, note: 'สวัสดิการและเงินช่วยเหลือแก่สมาชิก',
    children: [
      {
        id: 'B71', code: '71', name: 'สวัสดิการและเงินช่วยเหลือ', type: 'operating', nature: 'expense',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B7101', code: '7101', name: 'ทุนการศึกษาบุตรสมาชิก',       type: 'operating', nature: 'expense', gl: '530100', enabled: true, note: '', children: [] },
          { id: 'B7102', code: '7102', name: 'เงินสงเคราะห์ฌาปนกิจ',         type: 'operating', nature: 'expense', gl: '530200', enabled: true, note: '', children: [] },
          { id: 'B7103', code: '7103', name: 'เงินช่วยเหลือสมาชิกประสบภัย',  type: 'operating', nature: 'expense', gl: '530300', enabled: true, note: '', children: [] },
        ],
      },
    ],
  },
  {
    id: 'B4', code: '4', name: 'งบประมาณรายรับ', type: 'operating', nature: 'revenue',
    gl: null, enabled: true, note: 'ประมาณการรายรับประจำปี',
    children: [
      {
        id: 'B41', code: '41', name: 'รายได้ดอกเบี้ยและค่าธรรมเนียม', type: 'operating', nature: 'revenue',
        gl: null, enabled: true, note: '',
        children: [
          { id: 'B4101', code: '4101', name: 'ดอกเบี้ยรับเงินให้กู้', type: 'operating', nature: 'revenue', gl: '410100', enabled: true, note: '', children: [] },
          { id: 'B4102', code: '4102', name: 'ค่าธรรมเนียมแรกเข้า',  type: 'operating', nature: 'revenue', gl: '410200', enabled: true, note: '', children: [] },
          { id: 'B4103', code: '4103', name: 'รายได้อื่น',           type: 'operating', nature: 'revenue', gl: '420000', enabled: true, note: '', children: [] },
        ],
      },
    ],
  },
];

// ─── ข้อมูลงบประมาณรายปีตั้งต้น (เมนู "กำหนดงบประมาณ") ─────────────────
// amounts = แผนที่ระหว่าง id ของ "หมวดย่อยระดับ 2" → ตัวเลขงบประมาณของปีนั้น
// (กำหนดงบที่ระดับ 2 — หมวดย่อยระดับ 3 อ้างอิงยอดจากระดับ 2 ไม่กรอกแยก)
window.BUDGET_PLAN_SEED = [
  {
    year: 2568, status: 'active', note: 'งบประมาณที่ประกาศใช้แล้ว',
    createdBy: 'admin', createdDate: '2024-10-12',
    amounts: {
      B51: 5300000, B52: 550000, B53: 980000,
      B61: 1450000, B62: 200000,
      B71: 1180000,
      B41: 9360000,
    },
  },
  {
    year: 2569, status: 'draft', note: 'ร่างงบประมาณประจำปี — รอเสนอที่ประชุมใหญ่',
    createdBy: 'จันทร์เพ็ญ มาลี', createdDate: '2025-09-30',
    amounts: {
      B51: 5660000, B52: 590000, B53: 1050000,
      B61: 1680000, B62: 1020000,
      B71: 1450000,
      B41: 9900000,
    },
  },
];
window.BUD_PLAN_STATUS = {
  draft:  { l: 'ร่าง',       pill: 'warn' },
  active: { l: 'ประกาศใช้',  pill: 'ok' },
  closed: { l: 'ปิดปีงบ',    pill: 'neutral' },
};
