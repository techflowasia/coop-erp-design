// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — ค่าคงที่
//  · หมวดบัญชี : กำหนดหมวดบัญชีหลัก (Account Category) เป็นค่าคงที่ของระบบ
//    ใช้เป็นแกนจัดกลุ่มของ "ผังบัญชี" (Chart of Accounts) และเมนูบัญชีอื่น
//    แต่ละหมวดระบุ: รหัส · ชื่อไทย/อังกฤษ · ประเภทหมวดบัญชี · ลำดับการแสดงผล
//    · สถานะใช้งาน · หมายเหตุ
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก: ประเภทหมวดบัญชี (หมวดหลักของบัญชี) ────────────────────
window.ACCT_CAT_OPTS = {
  type: [
    { v: 'asset',     l: 'สินทรัพย์',    tone: 'primary' },
    { v: 'liability', l: 'หนี้สิน',      tone: 'warning' },
    { v: 'equity',    l: 'ส่วนของทุน',   tone: 'info' },
    { v: 'revenue',   l: 'รายได้',       tone: 'success' },
    { v: 'expense',   l: 'ค่าใช้จ่าย',    tone: 'neutral' },
  ],
};
window.acctCatLabel = (group, value) => {
  const o = (window.ACCT_CAT_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value || '—');
};
window.acctCatTypeTone = (value) => {
  const o = (window.ACCT_CAT_OPTS.type || []).find(x => x.v === value);
  return o ? o.tone : 'neutral';
};

// ─── หมวดบัญชีตั้งต้น (มาตรฐานผังบัญชีสหกรณ์ออมทรัพย์ 5 หมวดหลัก) ──────
window.ACCT_CAT_SEED = [
  {
    id: 'AC-1', code: '1', name: 'สินทรัพย์', en: 'Assets',
    type: 'asset', order: 1, enabled: true,
    note: 'ทรัพยากรที่สหกรณ์ครอบครอง เช่น เงินสด เงินฝากธนาคาร ลูกหนี้เงินให้กู้ ครุภัณฑ์',
  },
  {
    id: 'AC-2', code: '2', name: 'หนี้สิน', en: 'Liabilities',
    type: 'liability', order: 2, enabled: true,
    note: 'ภาระผูกพันที่สหกรณ์ต้องชำระ เช่น เงินรับฝาก เงินกู้ยืม เจ้าหนี้',
  },
  {
    id: 'AC-3', code: '3', name: 'ทุนของสหกรณ์', en: 'Equity',
    type: 'equity', order: 3, enabled: true,
    note: 'ส่วนของสมาชิก เช่น ทุนเรือนหุ้น ทุนสำรอง ทุนสะสมตามข้อบังคับ กำไรสะสม',
  },
  {
    id: 'AC-4', code: '4', name: 'รายได้', en: 'Revenue',
    type: 'revenue', order: 4, enabled: true,
    note: 'รายได้จากการดำเนินงาน เช่น ดอกเบี้ยรับเงินให้กู้ ค่าธรรมเนียม รายได้อื่น',
  },
  {
    id: 'AC-5', code: '5', name: 'ค่าใช้จ่าย', en: 'Expenses',
    type: 'expense', order: 5, enabled: true,
    note: 'ค่าใช้จ่ายในการดำเนินงาน เช่น เงินเดือน ดอกเบี้ยจ่าย ค่าสาธารณูปโภค สวัสดิการ',
  },
];

// จำนวนบัญชีในผังบัญชี (GL) ที่อ้างอิงหมวดนี้อยู่ — แสดงการเรียกใช้งานจริง
window.acctCatUsage = (catName) =>
  (window.GL_ACCOUNTS || []).filter(a => a.cls === catName).length;
