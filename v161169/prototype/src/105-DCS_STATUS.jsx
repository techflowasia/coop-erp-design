// ════════════════════════════════════════════════════════════════════
//  ระบบสวัสดิการ — งานสมาชิกถึงแก่กรรม / ขอสินไหม / ฌาปนกิจ (TOR 8.3 ขยาย)
// ════════════════════════════════════════════════════════════════════

// ─── สถานะการดำเนินงาน (รอเอกสาร 120 วัน → จ่าย) ─────────────────────
window.DCS_STATUS = {
  notified: { l: 'แจ้งถึงแก่กรรม',   pill: 'info',    step: 1 },
  waiting:  { l: 'รอเอกสาร (120 วัน)', pill: 'warn',   step: 2 },
  review:   { l: 'ตรวจสอบสิทธิ',     pill: 'warn',    step: 3 },
  approved: { l: 'อนุมัติจ่าย',       pill: 'ok',      step: 4 },
  paid:     { l: 'จ่ายแล้ว',          pill: 'ok',      step: 5 },
};
window.dcsStatus = (v) => window.DCS_STATUS[v] || window.DCS_STATUS.notified;

window.DCS_CAUSES = ['ชราภาพ', 'โรคประจำตัว', 'อุบัติเหตุ', 'โรคติดเชื้อ', 'อื่น ๆ'];

// ─── ประเภทผู้เสียชีวิต ───────────────────────────────────────────────
window.DCS_KIND = [
  { v: 'member',  l: 'สมาชิกถึงแก่กรรม' },
  { v: 'spouse',  l: 'คู่สมรสถึงแก่กรรม' },
  { v: 'family',  l: 'ครอบครัวถึงแก่กรรม' },
  { v: 'disaster',l: 'ประสบภัยพิบัติ' },
];

// ─── สวัสดิการ/สินไหมที่เกี่ยวข้อง ────────────────────────────────────
window.DCS_BENEFITS = {
  funeral:  { l: 'ฌาปนกิจสงเคราะห์ (ฌปท.)', base: 600000 },
  welfare:  { l: 'เงินสงเคราะห์สมาชิกเสียชีวิต', base: 50000 },
  insurance:{ l: 'สินไหมประกันชีวิตสัญญาเงินกู้', base: 0 },
};

// ─── ข้อมูลตั้งต้น ────────────────────────────────────────────────────
//  heirs: {name, relation, pct}  · debts: ยอดหนี้คงค้าง
window.DCS_SEED = [
  { id: 'DC-2569-001', kind: 'member', memberCode: 'M-051042', memberName: 'นายบุญส่ง วราพันธ์',
    dept: 'กองช่าง (เกษียณ)', citizenId: '3-1009-00112-45-1', deathDate: '2026-05-12', cause: 'ชราภาพ', age: 71,
    notifyDate: '2026-05-15', docDeadline: '2026-09-09', status: 'review',
    shares: 1024000, debts: 318500, funeral: 600000, welfare: 50000, insurance: 245000,
    houseNo: '99/12 ถ.ติวานนท์ นนทบุรี',
    heirs: [
      { name: 'นางสมพร วราพันธ์', relation: 'คู่สมรส', pct: 50 },
      { name: 'นายวิชัย วราพันธ์', relation: 'บุตร', pct: 25 },
      { name: 'นางสาววิภา วราพันธ์', relation: 'บุตร', pct: 25 },
    ] },
  { id: 'DC-2569-002', kind: 'member', memberCode: 'M-049217', memberName: 'นางมาลี ศรีทอง',
    dept: 'กองคลัง', citizenId: '3-1020-00455-12-3', deathDate: '2026-06-01', cause: 'โรคประจำตัว', age: 58,
    notifyDate: '2026-06-03', docDeadline: '2026-09-28', status: 'waiting',
    shares: 642000, debts: 0, funeral: 600000, welfare: 50000, insurance: 0,
    houseNo: '45 ถ.พระราม 6 กทม.',
    heirs: [
      { name: 'นายประยุทธ ศรีทอง', relation: 'คู่สมรส', pct: 100 },
    ] },
  { id: 'DC-2569-003', kind: 'spouse', memberCode: 'M-058246', memberName: 'นางพรพิมล ทองคำ',
    dept: 'สำนักปลัด', citizenId: '—', deathDate: '2026-06-20', cause: 'อุบัติเหตุ', age: 49,
    notifyDate: '2026-06-22', docDeadline: '2026-10-20', status: 'notified',
    deceasedName: 'นายสุรชัย ทองคำ (คู่สมรส)',
    shares: 0, debts: 0, funeral: 0, welfare: 20000, insurance: 0,
    houseNo: '12/4 ถ.งามวงศ์วาน นนทบุรี', heirs: [] },
  { id: 'DC-2568-088', kind: 'member', memberCode: 'M-047003', memberName: 'นายวีระ จันทร์ดี',
    dept: 'กองสาธารณสุข (เกษียณ)', citizenId: '3-1099-00234-88-0', deathDate: '2026-02-10', cause: 'ชราภาพ', age: 76,
    notifyDate: '2026-02-12', docDeadline: '2026-06-11', status: 'paid',
    shares: 880000, debts: 120000, funeral: 600000, welfare: 50000, insurance: 0,
    houseNo: '7 ถ.ราชวิถี กทม.', payDate: '2026-04-30',
    heirs: [
      { name: 'นางอุบล จันทร์ดี', relation: 'คู่สมรส', pct: 60 },
      { name: 'นายสมหมาย จันทร์ดี', relation: 'บุตร', pct: 40 },
    ] },
];

// ─── helper ──────────────────────────────────────────────────────────
window.dcsKindLabel = (v) => (window.DCS_KIND.find(k => k.v === v) || {}).l || v;
// ยอดสวัสดิการรวมก่อนหักหนี้
window.dcsGross = (r) => (r.funeral || 0) + (r.welfare || 0) + (r.insurance || 0) + (r.shares || 0);
// ยอดสุทธิหลังหักหนี้คงค้าง
window.dcsNet = (r) => Math.max(0, window.dcsGross(r) - (r.debts || 0));
window.dcsNextNo = (list, year) => {
  const yr = String(year || 2569);
  const nums = list.filter(r => String(r.id).startsWith('DC-' + yr)).map(r => parseInt(String(r.id).split('-')[2], 10) || 0);
  return `DC-${yr}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
};
