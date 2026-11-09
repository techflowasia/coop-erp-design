// ═════════════════════════════════════════════════════════════════
//  ข้อมูล — คืนเงินทดรอง / ส่งใช้เงินทดรอง (Petty / Advance Clearing)
//  ระบบการเงิน › เงินทดรอง
//  ค่าคงที่ · helpers · ทะเบียนรายการคืนตั้งต้น
//  อ้างอิงค่าคงที่ร่วมกับ "ขอยืมเงินทดรอง" (PA_*) เพื่อความสอดคล้อง
// ═════════════════════════════════════════════════════════════════

// ─── สถานะรายการคืน ───────────────────────────────────────────────
window.PR_STATUS = {
  draft:     { l: 'ร่าง', pill: 'neutral' },
  submitted: { l: 'รอตรวจสอบ', pill: 'warn' },
  approved:  { l: 'ตรวจสอบแล้ว', pill: 'info' },
  settled:   { l: 'ปิดรายการแล้ว', pill: 'ok' },
  cancelled: { l: 'ยกเลิก', pill: 'bad' },
};
window.prStatus = (s) => window.PR_STATUS[s] || window.PR_STATUS.draft;

// ─── ผลต่างการคืน (โหมด) ───────────────────────────────────────────
//  refund   = ใช้จริงน้อยกว่ายืม → คืนเงินสหกรณ์
//  claim    = ใช้จริงมากกว่ายืม → เบิกเพิ่ม
//  balanced = ใช้จริงเท่ายอดยืม → ไม่มีการเคลื่อนไหวเงิน
window.PR_MODES = {
  refund:   { l: 'คืนเงินให้สหกรณ์', short: 'คืนเงิน', chip: 'success' },
  claim:    { l: 'เบิกเพิ่มจากสหกรณ์', short: 'เบิกเพิ่ม', chip: 'warning' },
  balanced: { l: 'พอดี ไม่มีคืน/เบิกเพิ่ม', short: 'พอดี', chip: 'info' },
};

// ─── ประเภทเอกสารหลักฐานการใช้จ่าย ─────────────────────────────────
window.PR_DOC_TYPES = [
  'ใบเสร็จรับเงิน', 'ใบกำกับภาษี', 'ใบสำคัญรับเงิน',
  'ใบรับรองแทนใบเสร็จ (บก.111)', 'ใบเบิกค่าใช้จ่ายเดินทาง',
  'รายงานผลการเดินทาง / โครงการ', 'สำเนาสลิปโอนเงิน', 'เอกสารอื่น ๆ',
];

// ─── วันที่ / เลขที่ ────────────────────────────────────────────────
window.prToday = () => new Date().toISOString().slice(0, 10);
window.prBeYear = (d) => (new Date(d || Date.now()).getFullYear()) + 543;

window.prNextNo = (list, be) => {
  const yr = be || window.prBeYear();
  const prefix = `RV-${yr}-`;
  const nums = (list || [])
    .filter(r => String(r.id).startsWith(prefix))
    .map(r => parseInt(String(r.id).slice(prefix.length), 10) || 0);
  const seedMax = 40;
  const next = Math.max(seedMax, ...nums, 0) + 1;
  return prefix + String(next).padStart(6, '0');
};

// ─── ปีบัญชี / งวด (ใช้ helper เดียวกับเมนูยืม) ────────────────────
window.prFiscal = (d) => (window.paFiscal ? window.paFiscal(d) : (() => {
  const dt = new Date(d || Date.now());
  const be = dt.getFullYear() + 543;
  const p = dt.getMonth() + 1;
  return { year: be, period: p, periodLabel: `${String(p).padStart(2, '0')}/${be}`, open: true };
})());

// ─── จำนวนเงินรายการ + สรุปการคืน ─────────────────────────────────
window.prLineAmount = (r) => (Number(r.qty) || 0) * (Number(r.price) || 0);
window.prSummary = (lines, advanceAmount) => {
  const actualTotal = (lines || []).reduce((s, r) => s + window.prLineAmount(r), 0);
  const adv = Number(advanceAmount) || 0;
  const diff = adv - actualTotal;               // + = คืน, - = เบิกเพิ่ม
  const mode = diff > 0.005 ? 'refund' : (diff < -0.005 ? 'claim' : 'balanced');
  return { actualTotal, advanceAmount: adv, diff, absDiff: Math.abs(diff), mode };
};

// ─── รายการยืมที่รอส่งใช้ (clearable advances) ─────────────────────
//  รวมจากทะเบียน "ขอยืมเงินทดรอง" (สถานะ อนุมัติแล้ว/จ่ายเงินแล้ว)
//  + รายการยืมคงค้างตั้งต้น (จ่ายแล้วรอส่งใช้) — ตัดรายการที่คืนแล้วออก
window.PR_OUTSTANDING_SEED = [
  {
    advanceId: 'AV-2569-000112', memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    dept: 'กองช่าง', position: 'นายช่างโยธา ชำนาญงาน',
    supervisor: 'นายประสิทธิ์ วัฒนกิจ (ผอ.กองช่าง)', phone: '081-234-5678', email: 'wirat.t@coop.local',
    typeV: 'travel', purpose: 'เดินทางตรวจงานก่อสร้างสำนักงานสาขา และประสานงานท้องถิ่น',
    project: '', amount: 8500, recordDate: '2026-06-10', dueDate: '2026-06-30',
    paidDate: '2026-06-12', method: 'cash',
    lines: [
      { cat: 'ค่าเดินทาง (พาหนะ/น้ำมัน)', desc: 'ค่าน้ำมันรถยนต์ราชการ', qty: 1, unit: 'รายการ', price: 4500, budget: '5101-01', fund: 'budget' },
      { cat: 'ค่าที่พัก', desc: 'ค่าที่พัก 2 คืน', qty: 2, unit: 'วัน', price: 1200, budget: '5101-01', fund: 'budget' },
      { cat: 'ค่าเบี้ยเลี้ยง / ค่าอาหาร', desc: 'เบี้ยเลี้ยง 4 มื้อ', qty: 4, unit: 'วัน', price: 400, budget: '5101-01', fund: 'budget' },
    ],
  },
  {
    advanceId: 'AV-2569-000101', memberCode: 'M-065980', memberName: 'นางสาวพิมพ์ใจ ธนวัฒน์',
    dept: 'ฝ่ายการเงิน', position: 'เจ้าพนักงานการเงินและบัญชี',
    supervisor: 'นางสาวปรารถนา ทวีทรัพย์ (หน.ฝ่ายการเงิน)', phone: '086-112-3344', email: 'finance3@coop.local',
    typeV: 'meeting', purpose: 'เข้าร่วมประชุมใหญ่สามัญประจำปีชุมนุมสหกรณ์ออมทรัพย์ฯ',
    project: '', amount: 4300, recordDate: '2026-06-28', dueDate: '2026-07-13',
    paidDate: '2026-06-29', method: 'transfer',
    lines: [
      { cat: 'ค่าเดินทาง (พาหนะ/น้ำมัน)', desc: 'ค่าโดยสารรถไฟ ไป-กลับ', qty: 1, unit: 'เที่ยว', price: 1800, budget: '5102-03', fund: 'budget' },
      { cat: 'ค่าเบี้ยเลี้ยง / ค่าอาหาร', desc: 'เบี้ยเลี้ยง 2 วัน', qty: 2, unit: 'วัน', price: 1250, budget: '5102-03', fund: 'budget' },
    ],
  },
];

//  แปลงรายการจากทะเบียนยืม (paLoad) → shape เดียวกับ outstanding
window.prFromAdvance = (a) => {
  const sum = window.paSummary ? window.paSummary(a.lines, a) : { requested: 0 };
  return {
    advanceId: a.id, memberCode: a.memberCode, memberName: a.memberName,
    dept: a.dept, position: a.position, supervisor: a.supervisor,
    phone: a.phone, email: a.email,
    typeV: a.type, purpose: a.purpose, project: a.project,
    amount: sum.requested, recordDate: a.recordDate, dueDate: a.dueDate,
    paidDate: a.receiveDate || a.recordDate, method: a.method,
    lines: (a.lines || []).map(l => ({ ...l })),
  };
};

//  รายการยืมที่ยังรอส่งใช้ (ตัดรายการที่มีการคืนแล้วออก)
window.prClearable = (prList) => {
  const cleared = new Set((prList || [])
    .filter(r => r.status !== 'cancelled')
    .map(r => r.advanceId));
  const map = new Map();
  // 1) จากทะเบียนยืม สถานะ อนุมัติแล้ว/จ่ายเงินแล้ว
  const paList = (window.paLoad ? window.paLoad() : []) || [];
  paList.forEach(a => {
    if (a.status === 'approved' || a.status === 'paid') {
      map.set(a.id, window.prFromAdvance(a));
    }
  });
  // 2) จากรายการคงค้างตั้งต้น
  window.PR_OUTSTANDING_SEED.forEach(o => { if (!map.has(o.advanceId)) map.set(o.advanceId, { ...o, lines: o.lines.map(l => ({ ...l })) }); });
  return [...map.values()]
    .filter(o => !cleared.has(o.advanceId))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
};

window.prTypeLabel = (v) => (window.paType ? window.paType(v).l : v);
window.prTypeShort = (v) => (window.paType ? window.paType(v).short : v);
window.prMethod = (v) => (window.paMethod ? window.paMethod(v) : { v, l: v });

// ─── ทะเบียนรายการคืนตั้งต้น (seed) ────────────────────────────────
window.PR_SEED = [
  {
    id: 'RV-2569-000040', recordDate: '2026-07-07', returnDate: '2026-07-07',
    advanceId: 'AV-2569-000095', advanceType: 'procure', advanceAmount: 15200,
    advanceRecordDate: '2026-06-05', advanceDueDate: '2026-06-25', advancePaidDate: '2026-06-06',
    memberCode: 'M-065980', memberName: 'นางสาวพิมพ์ใจ ธนวัฒน์',
    dept: 'ฝ่ายการเงิน', position: 'เจ้าพนักงานการเงินและบัญชี',
    supervisor: 'นางสาวปรารถนา ทวีทรัพย์ (หน.ฝ่ายการเงิน)', phone: '086-112-3344', email: 'finance3@coop.local',
    purpose: 'จัดซื้อวัสดุอุปกรณ์สำนักงานประจำไตรมาส',
    lines: [
      { cat: 'ค่าวัสดุอุปกรณ์', desc: 'กระดาษถ่ายเอกสาร A4 (40 รีม)', qty: 40, unit: 'รายการ', price: 118, receiptNo: 'IV-6607-221', note: '' },
      { cat: 'ค่าวัสดุอุปกรณ์', desc: 'หมึกพิมพ์ / อุปกรณ์สิ้นเปลือง', qty: 1, unit: 'ชุด', price: 8600, receiptNo: 'IV-6607-238', note: '' },
    ],
    settleMethod: 'cash', settleBank: '', settleAcctNo: '', settleDate: '2026-07-07',
    settlePlace: 'ช่องจ่ายเงิน 1 สำนักงานใหญ่', settleNote: 'คืนเงินสดส่วนที่เหลือ',
    docs: [
      { docType: 'ใบกำกับภาษี', docNo: 'IV-6607-221', docDate: '2026-06-18', fileName: 'inv_paper.pdf', by: 'พิมพ์ใจ ธ.', at: '2026-07-07', note: '', verified: 'ok' },
      { docType: 'ใบเสร็จรับเงิน', docNo: 'IV-6607-238', docDate: '2026-06-20', fileName: 'inv_ink.pdf', by: 'พิมพ์ใจ ธ.', at: '2026-07-07', note: '', verified: 'ok' },
    ],
    status: 'settled', enteredBy: 'นางจันทร์เพ็ญ มาลี', enteredAt: '2026-07-07 09:40',
  },
  {
    id: 'RV-2569-000039', recordDate: '2026-07-02', returnDate: '2026-07-02',
    advanceId: 'AV-2569-000088', advanceType: 'travel', advanceAmount: 6200,
    advanceRecordDate: '2026-06-01', advanceDueDate: '2026-06-20', advancePaidDate: '2026-06-02',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    dept: 'กองช่าง', position: 'นายช่างโยธา ชำนาญงาน',
    supervisor: 'นายประสิทธิ์ วัฒนกิจ (ผอ.กองช่าง)', phone: '081-234-5678', email: 'wirat.t@coop.local',
    purpose: 'เดินทางตรวจสอบพื้นที่ก่อสร้าง จ.ตาก',
    lines: [
      { cat: 'ค่าเดินทาง (พาหนะ/น้ำมัน)', desc: 'ค่าน้ำมันเชื้อเพลิง', qty: 1, unit: 'รายการ', price: 3800, receiptNo: 'PTT-0611', note: '' },
      { cat: 'ค่าที่พัก', desc: 'ค่าที่พัก 2 คืน', qty: 2, unit: 'วัน', price: 1350, receiptNo: 'HTL-0612', note: '' },
    ],
    settleMethod: 'transfer', settleBank: 'ธ.กรุงไทย', settleAcctNo: 'xxx-x-x9902-x', settleDate: '2026-07-05',
    settlePlace: '', settleNote: 'เบิกเพิ่มส่วนที่ใช้จ่ายเกิน',
    docs: [
      { docType: 'ใบเสร็จรับเงิน', docNo: 'PTT-0611', docDate: '2026-06-11', fileName: 'fuel.pdf', by: 'วิรัตน์ ท.', at: '2026-07-02', note: '', verified: 'ok' },
      { docType: 'ใบเสร็จรับเงิน', docNo: 'HTL-0612', docDate: '2026-06-12', fileName: 'hotel.pdf', by: 'วิรัตน์ ท.', at: '2026-07-02', note: '', verified: 'pending' },
    ],
    status: 'submitted', enteredBy: 'นางจันทร์เพ็ญ มาลี', enteredAt: '2026-07-02 15:12',
  },
];

// ─── localStorage store ────────────────────────────────────────────
window.PR_LS_KEY = 'coop.pettyReturn.v1';
window.prLoad = () => {
  try {
    const raw = localStorage.getItem(window.PR_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(window.PR_SEED));
};
window.prSave = (list) => {
  try { localStorage.setItem(window.PR_LS_KEY, JSON.stringify(list)); } catch (e) {}
};

window.PR_USER = 'นางจันทร์เพ็ญ มาลี';
