// ════════════════════════════════════════════════════════════════════
//  ข้อมูล — สถานะสมาชิก (Member Status Adjustment)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  ปรับสถานะสมาชิก: ลาออก / ปลดออก / ให้ออก / เสียชีวิต
//  ใช้ฐานข้อมูลสมาชิกร่วมกับเมนู "บันทึกข้อมูลลาออก" (window.RSN_MEMBERS)
//  และการค้นหาสมาชิกรูปแบบกลางของ Design System (window.rsnSearchMembers)
// ════════════════════════════════════════════════════════════════════

// ─── วันทำการ / ผู้ป้อน ─────────────────────────────────────────────
window.msToday = () => (typeof window.RSN_TODAY === 'string' && window.RSN_TODAY) || '2026-06-21';
window.msUser  = () => (typeof window.RSN_USER === 'string' && window.RSN_USER) || 'จันทร์เพ็ญ มาลี';
window.msBeYear = (iso) => new Date(iso || window.msToday()).getFullYear() + 543;

// ─── เลขที่รายการปรับสถานะ (auto) — MST-{พ.ศ.}-{running 6 หลัก} ──────
window.msNextDocNo = (beYear) => {
  const yy = beYear || window.msBeYear();
  const running = 140 + Math.floor(Math.random() * 8);
  return `MST-${yy}-${String(running).padStart(6, '0')}`;
};

// ─── สถานะที่ปรับได้ ────────────────────────────────────────────────
//  effect: 'immediate' = อัปเดตทะเบียนสมาชิกทันที · 'lock' = ล็อกการทำรายการเงินกู้/ค้ำ
window.MS_STATUSES = [
  { v: 'resign',   l: 'ลาออก',    regStatus: 'ลาออก',     icon: 'logout', chip: 'warning', pill: 'warn',    effect: 'lock',
    desc: 'สมาชิกยื่นความประสงค์ขอลาออกจากการเป็นสมาชิกด้วยตนเอง' },
  { v: 'dismiss',  l: 'ปลดออก',   regStatus: 'พ้นสภาพ',   icon: 'unlock', chip: 'danger',  pill: 'bad',     effect: 'lock',
    desc: 'พ้นสภาพสมาชิกตามข้อบังคับ เช่น ขาดคุณสมบัติหรือผิดระเบียบ' },
  { v: 'expel',    l: 'ให้ออก',   regStatus: 'ให้ออก',    icon: 'close',  chip: 'danger',  pill: 'bad',     effect: 'lock',
    desc: 'คณะกรรมการมีมติให้ออกจากการเป็นสมาชิกตามเหตุที่กำหนด' },
  { v: 'deceased', l: 'เสียชีวิต', regStatus: 'เสียชีวิต', icon: 'info',   chip: 'neutral', pill: 'neutral', effect: 'immediate',
    desc: 'บันทึกการเสียชีวิต — ระบบจะอัปเดตสถานะทะเบียนสมาชิกทันที' },
];
window.msStatusDef = (v) => window.MS_STATUSES.find(s => s.v === v) || null;

// ─── ตัวเลือกในฟอร์ม ────────────────────────────────────────────────
window.MS_DISMISS_REASONS = [
  'ขาดคุณสมบัติการเป็นสมาชิก',
  'ค้างชำระหนี้เกินกำหนดตามระเบียบ',
  'ย้าย / พ้นจากหน่วยงานต้นสังกัด',
  'ฝ่าฝืนข้อบังคับ / ระเบียบสหกรณ์',
  'อื่น ๆ',
];
window.MS_EXPEL_REASON_TYPES = [
  'ทุจริตต่อสหกรณ์',
  'กระทำผิดวินัยอย่างร้ายแรง',
  'ก่อความเสียหายต่อสหกรณ์',
  'ฝ่าฝืนข้อบังคับ / ระเบียบซ้ำ',
  'อื่น ๆ',
];
window.MS_DEATH_CAUSES = ['เจ็บป่วย', 'อุบัติเหตุ', 'ชราภาพ', 'อื่น ๆ'];

// ─── โครงสร้างฟิลด์ตามสถานะ ─────────────────────────────────────────
//  type: date | text | textarea | select | file
window.MS_FIELDS = {
  resign: [
    { key: 'submitDate',    label: 'วันที่ยื่น',                type: 'date',     required: true,  w: 170 },
    { key: 'effectiveDate', label: 'วันที่ขอให้มีผล',           type: 'date',     required: true,  w: 170 },
    { key: 'letterNo',      label: 'เลขหนังสือลาออก (ถ้ามี)',  type: 'text',     w: 200, placeholder: 'เช่น ลอ.045/2569', mono: true },
    { key: 'letterFile',    label: 'หนังสือลาออก',              type: 'file',     grow: true, w: 260 },
    { key: 'reason',        label: 'เหตุผลการลาออก',            type: 'textarea', required: true, grow: true, w: 480, rows: 2, placeholder: 'ระบุเหตุผลการขอลาออก' },
  ],
  dismiss: [
    { key: 'reason',        label: 'เหตุผลการพ้นสภาพ',              type: 'select',   required: true, grow: true, w: 300, options: () => window.MS_DISMISS_REASONS, otherWhen: 'อื่น ๆ', otherKey: 'reasonOther', otherLabel: 'ระบุเหตุผล (อื่น ๆ)' },
    { key: 'eventDate',     label: 'วันที่เกิดเหตุ',                 type: 'date',     required: true, w: 170 },
    { key: 'proposedDate',  label: 'วันที่พ้นสภาพที่เสนอ',          type: 'date',     required: true, w: 190 },
    { key: 'regRef',        label: 'ข้อบังคับ / ระเบียบที่อ้างอิง', type: 'text',     required: true, grow: true, w: 300, placeholder: 'เช่น ข้อบังคับ ข้อ 44 (2)' },
    { key: 'proposer',      label: 'ผู้เสนอรายการ',                 type: 'text',     w: 220, placeholder: 'ชื่อ - สกุล ผู้เสนอ' },
    { key: 'proposerDept',  label: 'หน่วยงานผู้เสนอ',               type: 'text',     w: 220, placeholder: 'หน่วยงาน / ฝ่าย' },
    { key: 'detail',        label: 'รายละเอียดเหตุการณ์',           type: 'textarea', grow: true, w: 480, rows: 2, placeholder: 'อธิบายเหตุการณ์โดยสังเขป' },
  ],
  expel: [
    { key: 'reasonType',    label: 'ประเภทเหตุผลการให้ออก', type: 'select',   required: true, grow: true, w: 300, options: () => window.MS_EXPEL_REASON_TYPES, otherWhen: 'อื่น ๆ', otherKey: 'reasonTypeOther', otherLabel: 'ระบุเหตุผล (อื่น ๆ)' },
    { key: 'eventDate',     label: 'วันที่เกิดเหตุ',        type: 'date',     required: true, w: 170 },
    { key: 'noticeNo',      label: 'เลขที่หนังสือแจ้ง',     type: 'text',     w: 200, placeholder: 'เช่น จ.089/2569', mono: true },
    { key: 'noticeDate',    label: 'วันที่แจ้งสมาชิก',      type: 'date',     w: 170 },
    { key: 'regRef',        label: 'ข้อบังคับที่เกี่ยวข้อง', type: 'text',     grow: true, w: 300, placeholder: 'เช่น ข้อบังคับ ข้อ 45' },
    { key: 'reasonDetail',  label: 'รายละเอียดเหตุผล',      type: 'textarea', grow: true, w: 480, rows: 2, placeholder: 'อธิบายเหตุผลการให้ออก' },
  ],
  deceased: [
    { key: 'deathDate',     label: 'วันที่เสียชีวิต',       type: 'date',   required: true, w: 170 },
    { key: 'deathCause',    label: 'สาเหตุการเสียชีวิต',    type: 'select', required: true, w: 200, options: () => window.MS_DEATH_CAUSES, otherWhen: 'อื่น ๆ', otherKey: 'deathCauseOther', otherLabel: 'ระบุสาเหตุ (อื่น ๆ)' },
    { key: 'certNo',        label: 'เลขที่ใบมรณบัตร',       type: 'text',   w: 200, placeholder: 'เช่น มรณ. 1234/2569', mono: true },
    { key: 'certDate',      label: 'วันที่ออกใบมรณบัตร',    type: 'date',   w: 190 },
    { key: 'issuer',        label: 'หน่วยงานที่ออกเอกสาร',  type: 'text',   grow: true, w: 280, placeholder: 'เช่น สำนักทะเบียนอำเภอเมือง' },
  ],
};

// ─── คลังผลการปรับสถานะ (จำลองสถานะระบบหลังบันทึก) ───────────────────
//  key = รหัสสมาชิก → { status, statusLabel, effect, docNo, date, locked }
window.MS_APPLIED = window.MS_APPLIED || {};

//  บันทึก/ปรับสถานะ — mutate สมาชิกให้เห็นผลในเมนูอื่น
window.msApply = (member, statusV, docNo, extra) => {
  const def = window.msStatusDef(statusV);
  if (!member || !def) return;
  const locked = def.effect === 'lock' || def.effect === 'immediate';
  window.MS_APPLIED[member.code] = {
    status: statusV, statusLabel: def.l, regStatus: def.regStatus,
    effect: def.effect, docNo, date: window.msToday(),
    locked, loanLocked: locked, guarLocked: locked,
    ...(extra || {}),
  };
  // อัปเดตทะเบียนสมาชิกทันทีสำหรับกรณีเสียชีวิต
  if (def.effect === 'immediate') {
    member.status = def.regStatus;
    if (extra && extra.deathDate) member.deathDate = extra.deathDate;
  }
  return window.MS_APPLIED[member.code];
};

//  ตรวจว่าสมาชิกถูกล็อกการทำรายการเงินกู้/ค้ำประกันหรือไม่
//  (เมนูเงินกู้ / ค้ำประกัน สามารถเรียกใช้เพื่อกันการทำรายการได้)
window.msIsLoanLocked = (code) => !!(window.MS_APPLIED[code] && window.MS_APPLIED[code].loanLocked);
window.msIsGuarLocked = (code) => !!(window.MS_APPLIED[code] && window.MS_APPLIED[code].guarLocked);
window.msAppliedOf = (code) => window.MS_APPLIED[code] || null;
