// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ลงรายวัน (Daily Journal / Voucher)
//  Voucher บัญชีประจำวันแบบเดบิต/เครดิต — บันทึก ตรวจสอบ ส่งอนุมัติ
//  และผ่านรายการไปบัญชีแยกประเภท
//  เลขที่เอกสาร: <PFX>-YYMM-XXXX (ปี พ.ศ. 2 หลัก)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทรายการ (Voucher type) ────────────────────────────────────
window.JV_TYPES = [
  { v: 'RV',  l: 'ใบสำคัญรับ',          desc: 'รายการรับ / ใบสำคัญรับ',     tone: 'primary' },
  { v: 'PV',  l: 'ใบสำคัญจ่าย',          desc: 'รายการจ่าย / ใบสำคัญจ่าย',    tone: 'info' },
  { v: 'JV',  l: 'รายการทั่วไป',          desc: 'รายการบัญชีทั่วไป / ปรับปรุง', tone: 'neutral' },
];
window.jvTypeLabel = (v) => (window.JV_TYPES.find(t => t.v === v) || {}).l || v;
window.jvTypeTone  = (v) => (window.JV_TYPES.find(t => t.v === v) || {}).tone || 'neutral';

// ─── ประเภทเงิน (Money type) ─────────────────────────────────────────
window.JV_MTYPES = [
  { v: 'CSH', l: 'เงินสด',        desc: 'รายการเงินสด' },
  { v: 'TRN', l: 'โอนเงิน',       desc: 'รายการโอนเงิน / ธนาคาร' },
  { v: 'ADJ', l: 'ปรับปรุงบัญชี', desc: 'รายการปรับปรุงบัญชี' },
];
window.jvMtypeLabel = (v) => (window.JV_MTYPES.find(t => t.v === v) || {}).l || v;

// ─── สถานะเอกสาร ─────────────────────────────────────────────────────
window.JV_STATUS = {
  draft:   { l: 'ร่าง',           pill: 'neutral', step: 0 },
  pending: { l: 'รออนุมัติ',      pill: 'warn',    step: 1 },
  posted:  { l: 'ผ่านรายการแล้ว', pill: 'ok',      step: 2 },
  cancelled: { l: 'ยกเลิกแล้ว',    pill: 'bad',     step: 3 },
};
window.JV_STATUS_ORDER = ['draft', 'pending', 'posted', 'cancelled'];

// ─── หน่วยงาน / สาขา ────────────────────────────────────────────────
window.JV_BRANCHES = [
  'สำนักงานใหญ่',
  'สาขาหลักสี่',
  'สาขาแจ้งวัฒนะ',
  'สาขาภูมิภาค — เชียงใหม่',
];

// บัญชีเงินสด (ใช้คำนวณสรุปเงินสดประจำวัน)
window.JV_CASH_ACCT = '110101';
// เงินสดยกมาต้นวัน (จำลอง — ยอดยกไปของวันก่อนหน้า)
window.JV_CASH_OPENING = 250000;

// ─── เลขที่เอกสารอัตโนมัติ: <PFX>-YYMM-XXXX ─────────────────────────
window.jvNextNo = (list, dateIso, vtype) => {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const pfx = vtype || 'JV';
  const head = `${pfx}-${yy}${mm}-`;
  const used = (list || []).filter(v => String(v.id).startsWith(head))
    .map(v => parseInt(String(v.id).slice(head.length), 10) || 0);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return head + String(next).padStart(4, '0');
};

// ─── โหลด / บันทึก (localStorage) ───────────────────────────────────
window.jvLoad = function () {
  let list = null;
  try { const s = localStorage.getItem('journal_vouchers'); if (s) list = JSON.parse(s); } catch (e) {}
  if (!list) return JSON.parse(JSON.stringify(window.JV_SEED || []));
  return list;
};
window.jvSave = function (list) { try { localStorage.setItem('journal_vouchers', JSON.stringify(list)); } catch (e) {} };

// ─── รวมยอด DR/CR + ส่วนต่าง ────────────────────────────────────────
window.jvTotals = function (lines) {
  const t = (lines || []).reduce((a, ln) => {
    a.dr += Number(ln.dr || 0); a.cr += Number(ln.cr || 0); return a;
  }, { dr: 0, cr: 0 });
  t.diff = t.dr - t.cr;
  t.balanced = Math.abs(t.diff) < 0.005 && (t.dr > 0 || t.cr > 0);
  return t;
};

// ─── ตรวจสอบความถูกต้องก่อนผ่านรายการ ───────────────────────────────
//  คืน { ok, errors[], warnings[] }
window.jvValidate = function (v) {
  const errors = [], warnings = [];
  const lines = (v.lines || []).filter(ln => ln.acct || Number(ln.dr) || Number(ln.cr));
  if (!String(v.desc || '').trim()) errors.push('ต้องระบุรายละเอียดรายการ');
  if (lines.length < 2) errors.push('ต้องมีรายการบัญชีอย่างน้อย 2 บรรทัด');

  const validCode = (c) => !!(window.coaAccountName && window.coaAccountName(String(c)));
  lines.forEach((ln, i) => {
    const no = i + 1;
    const dr = Number(ln.dr || 0), cr = Number(ln.cr || 0);
    if (!ln.acct) errors.push(`บรรทัดที่ ${no}: ยังไม่เลือกรหัสบัญชี`);
    else if (!validCode(ln.acct)) errors.push(`บรรทัดที่ ${no}: รหัสบัญชี ${ln.acct} ไม่มีในผังบัญชี`);
    if (dr > 0 && cr > 0) errors.push(`บรรทัดที่ ${no}: กรอกได้เฉพาะเดบิตหรือเครดิตอย่างใดอย่างหนึ่ง`);
    if (dr === 0 && cr === 0) warnings.push(`บรรทัดที่ ${no}: ยังไม่ได้กรอกจำนวนเงิน`);
    if (dr < 0 || cr < 0) errors.push(`บรรทัดที่ ${no}: ห้ามกรอกยอดติดลบ`);
  });

  const t = window.jvTotals(lines);
  if (!t.balanced && lines.length) errors.push(`เดบิตและเครดิตไม่สมดุล — ส่วนต่าง ${window.fmt.money(Math.abs(t.diff))} บาท`);
  if (t.dr === 0 || t.cr === 0) warnings.push('ยอดเดบิตหรือเครดิตยังเป็น 0 — รายการไม่สมบูรณ์');

  return { ok: errors.length === 0, errors, warnings };
};

// ─── ข้อมูลตัวอย่าง (วันที่ทำการปัจจุบัน 13 มิ.ย. 2569) ──────────────
//  v: { id, vtype, mtype, docDate, createdBy, branch, ref, desc, note,
//       status, lines:[{ acct, name, desc, ref, dr, cr }] }
window.JV_SEED = [
  {
    id: 'RV-6906-0001', vtype: 'RV', mtype: 'CSH', docDate: '2026-06-13',
    createdBy: 'นางจันทร์เพ็ญ มาลี', branch: 'สำนักงานใหญ่', ref: 'RC-690613-021',
    desc: 'รับชำระค่าหุ้นและเงินกู้สามัญเป็นเงินสด', note: '', status: 'posted',
    lines: [
      { acct: '110101', desc: 'รับเงินสดเคาน์เตอร์', ref: '', dr: 1250000, cr: 0 },
      { acct: '310000', desc: 'ค่าหุ้นรายเดือน', ref: 'หุ้น', dr: 0, cr: 450000 },
      { acct: '110202', desc: 'ชำระต้นเงินกู้สามัญ', ref: 'M-058241', dr: 0, cr: 800000 },
    ],
  },
  {
    id: 'RV-6906-0002', vtype: 'RV', mtype: 'CSH', docDate: '2026-06-13',
    createdBy: 'นางจันทร์เพ็ญ มาลี', branch: 'สำนักงานใหญ่', ref: 'RC-690613-044',
    desc: 'รับดอกเบี้ยเงินกู้เป็นเงินสด', note: '', status: 'posted',
    lines: [
      { acct: '110101', desc: 'รับเงินสด', ref: '', dr: 92400, cr: 0 },
      { acct: '410100', desc: 'ดอกเบี้ยรับเงินให้กู้', ref: '', dr: 0, cr: 92400 },
    ],
  },
  {
    id: 'PV-6906-0001', vtype: 'PV', mtype: 'TRN', docDate: '2026-06-13',
    createdBy: 'นายเกรียงไกร พูนผล', branch: 'สำนักงานใหญ่', ref: 'PV-6906-0044',
    desc: 'จ่ายเงินเดือนพนักงานประจำเดือนมิถุนายน ผ่านธนาคาร', note: 'โอนเข้าบัญชีพนักงาน 32 ราย', status: 'posted',
    lines: [
      { acct: '520100', desc: 'เงินเดือนและค่าจ้าง', ref: '', dr: 685000, cr: 0 },
      { acct: '110111', desc: 'โอนจ่ายผ่าน ธ.กรุงไทย', ref: '', dr: 0, cr: 685000 },
    ],
  },
  {
    id: 'PV-6906-0002', vtype: 'PV', mtype: 'CSH', docDate: '2026-06-13',
    createdBy: 'นายเกรียงไกร พูนผล', branch: 'สำนักงานใหญ่', ref: '',
    desc: 'จ่ายค่าตอบแทนกรรมการดำเนินการ (เบี้ยประชุม) เป็นเงินสด', note: '', status: 'posted',
    lines: [
      { acct: '520300', desc: 'ค่าตอบแทนกรรมการดำเนินการ', ref: '', dr: 54000, cr: 0 },
      { acct: '110101', desc: 'จ่ายเงินสด', ref: '', dr: 0, cr: 54000 },
    ],
  },
  {
    id: 'JV-6906-0001', vtype: 'JV', mtype: 'ADJ', docDate: '2026-06-13',
    createdBy: 'นายเกรียงไกร พูนผล', branch: 'สำนักงานใหญ่', ref: '',
    desc: 'ปรับปรุงดอกเบี้ยค้างรับเงินให้กู้ ณ สิ้นเดือน', note: 'รายการปรับปรุงประจำเดือน', status: 'pending',
    lines: [
      { acct: '110300', desc: 'ดอกเบี้ยค้างรับ', ref: '', dr: 145000, cr: 0 },
      { acct: '410100', desc: 'ดอกเบี้ยรับเงินให้กู้', ref: '', dr: 0, cr: 145000 },
    ],
  },
  {
    id: 'PV-6906-0003', vtype: 'PV', mtype: 'CSH', docDate: '2026-06-13',
    createdBy: 'นางจันทร์เพ็ญ มาลี', branch: 'สำนักงานใหญ่', ref: '',
    desc: 'จ่ายค่าน้ำประปาและค่าไฟฟ้าประจำเดือนเป็นเงินสด', note: '', status: 'draft',
    lines: [
      { acct: '520201', desc: 'ค่าน้ำประปาและไฟฟ้า', ref: '', dr: 38500, cr: 0 },
      { acct: '110101', desc: 'จ่ายเงินสด', ref: '', dr: 0, cr: 38500 },
    ],
  },
  {
    id: 'RV-6906-0044', vtype: 'RV', mtype: 'TRN', docDate: '2026-06-12',
    createdBy: 'นางจันทร์เพ็ญ มาลี', branch: 'สำนักงานใหญ่', ref: 'RC-690612-088',
    desc: 'รับเงินรับฝากออมทรัพย์โอนผ่านธนาคาร', note: '', status: 'posted',
    lines: [
      { acct: '110111', desc: 'รับโอนเข้า ธ.กรุงไทย', ref: '', dr: 2380000, cr: 0 },
      { acct: '210101', desc: 'เงินรับฝากออมทรัพย์', ref: '', dr: 0, cr: 2380000 },
    ],
  },
];
