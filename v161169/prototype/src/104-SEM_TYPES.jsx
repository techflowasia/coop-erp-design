// ════════════════════════════════════════════════════════════════════
//  ระบบสวัสดิการ — งานอบรม/สัมมนา (8.2) ข้อมูลตั้งต้น
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทโครงการ ───────────────────────────────────────────────────
window.SEM_TYPES = [
  { v: 'seminar',  l: 'สัมมนาสมาชิก' },
  { v: 'training', l: 'อบรมวิชาชีพ' },
  { v: 'study',    l: 'ทัศนศึกษาดูงาน' },
  { v: 'orient',   l: 'ปฐมนิเทศสมาชิกใหม่' },
];
window.semType = (v) => window.SEM_TYPES.find(x => x.v === v) || window.SEM_TYPES[0];

// ─── สถานะโครงการ ────────────────────────────────────────────────────
window.SEM_STATUS = {
  draft:     { l: 'ร่าง',                 pill: 'neutral' },
  open:      { l: 'เปิดรับสมัคร',          pill: 'ok' },
  full:      { l: 'เต็มแล้ว',              pill: 'warn' },
  regclosed: { l: 'ปิดรับสมัคร',           pill: 'info' },
  ongoing:   { l: 'อยู่ระหว่างจัดกิจกรรม',  pill: 'info' },
  closed:    { l: 'เสร็จสิ้น',             pill: 'info' },
  cancelled: { l: 'ยกเลิก',                pill: 'bad' },
};
window.semStatus = (v) => window.SEM_STATUS[v] || window.SEM_STATUS.draft;

// ─── ปีงบประมาณ / รูปแบบโครงการ ───────────────────────────────────────
window.SEM_FISCAL_YEARS = ['2571', '2570', '2569', '2568', '2567'];
window.SEM_FORMATS = [
  { v: 'onsite', l: 'Onsite (ณ สถานที่จัด)' },
  { v: 'online', l: 'Online (ออนไลน์)' },
  { v: 'hybrid', l: 'Hybrid (ผสมผสาน)' },
];

// ─── หน่วยงานผู้จัด / เจ้าหน้าที่ / ผู้อนุมัติ / Template เอกสารเชิญ ─────
window.SEM_ORG_DEPTS = [
  'ฝ่ายสมาชิกสัมพันธ์', 'ฝ่ายสวัสดิการและกิจการสมาชิก', 'ฝ่ายฝึกอบรมและพัฒนา',
  'ฝ่ายประชาสัมพันธ์', 'สำนักผู้จัดการ',
];
window.SEM_OFFICERS = [
  { code: 'EMP-1042', name: 'นางสาวจันทร์เพ็ญ มาลี', dept: 'ฝ่ายสวัสดิการและกิจการสมาชิก', phone: '02-105-4210', email: 'chanpen.m@coop.or.th' },
  { code: 'EMP-1058', name: 'นายสมชาย ใจดี', dept: 'ฝ่ายสมาชิกสัมพันธ์', phone: '02-105-4231', email: 'somchai.j@coop.or.th' },
  { code: 'EMP-1067', name: 'นางสาวปิยะนุช ทองเปลว', dept: 'ฝ่ายฝึกอบรมและพัฒนา', phone: '02-105-4255', email: 'piyanuch.t@coop.or.th' },
  { code: 'EMP-1073', name: 'นายธีรพงษ์ ขำเพชร', dept: 'ฝ่ายฝึกอบรมและพัฒนา', phone: '02-105-4256', email: 'teerapong.k@coop.or.th' },
  { code: 'EMP-1081', name: 'นางพรพิมล ทองคำ', dept: 'ฝ่ายประชาสัมพันธ์', phone: '02-105-4260', email: 'pornpimol.t@coop.or.th' },
  { code: 'EMP-1090', name: 'นายวิรัช เดชะอุดม', dept: 'สำนักผู้จัดการ', phone: '02-105-4200', email: 'wirach.d@coop.or.th' },
];
window.semOfficerByCode = (code) => (window.SEM_OFFICERS || []).find(o => o.code === code) || null;
window.semOfficerOptions = () => (window.SEM_OFFICERS || []).map(o => ({
  value: o.code, label: o.name, sub: `${o.code} · ${o.dept}`,
}));
window.SEM_APPROVERS = [
  'ผู้จัดการสหกรณ์', 'รองผู้จัดการ (สายสมาชิก)', 'ประธานกรรมการดำเนินการ',
];
window.SEM_INVITE_TEMPLATES = [
  { v: 'tmpl-seminar', l: 'หนังสือเชิญสัมมนาสมาชิก' },
  { v: 'tmpl-training', l: 'หนังสือเชิญอบรมวิชาชีพ' },
  { v: 'tmpl-orient', l: 'หนังสือเชิญปฐมนิเทศสมาชิกใหม่' },
];

// ─── helper: คำนวณจำนวนวัน/คืน จากช่วงวันที่ ───────────────────────────
window.semDaysNights = (from, to) => {
  if (!from) return { days: 1, nights: 0 };
  const a = new Date(from), b = new Date(to || from);
  if (isNaN(a) || isNaN(b) || b < a) return { days: 1, nights: 0 };
  const diff = Math.round((b - a) / 86400000);
  return { days: diff + 1, nights: diff };
};

// ─── helper: เรคคอร์ดโครงการเปล่า (ค่าตั้งต้นครบทุกฟิลด์) ───────────────
window.semBlankProject = () => ({
  fiscalYear: '2569', type: 'seminar', title: '', round: '', format: 'onsite',
  objective: '', description: '', allowDepts: [],
  dateFrom: '', startTime: '09:00', dateTo: '', endTime: '16:00',
  days: 1, nights: 0,
  venue: '', province: '', amphoe: '', tambon: '', postcode: '', lat: '', lng: '',
  travelDetail: '', zone: 'เขตกรุงเทพและปริมณฑล',
  orgDept: '', officer: '', officers: [], phone: '', email: '', approver: '',
  capacity: 50, reserve: 5,
  regFrom: '', regFromTime: '08:30', regTo: '', regToTime: '16:30',
  autoClose: true, allowWaiting: true, preventDup: true, preventOverlap: true,
  eligible: 'all', areaNote: '', memberFrom: '', memberTo: '', biennial: false,
  announceNo: '', announceDate: '', inviteTemplate: '',
  fileAnnounce: '', fileAgenda: '',
  status: 'draft', showMobile: true, allowMobileReg: true, sendNotif: true,
  remark: '',
  charter: false, buses: 0,
  expenses: [], budgetCat: '',
  registrants: [], disburse: [],
  createdBy: 'นางสาวจันทร์เพ็ญ มาลี', createdAt: '', updatedBy: '', updatedAt: '',
});

// ─── เงื่อนไขผู้มีสิทธิ์ ───────────────────────────────────────────────
window.SEM_ELIGIBLE = [
  { v: 'all',     l: 'สมาชิกทุกคน' },
  { v: 'dept',    l: 'ตามรหัสสังกัด (เลือกหน่วยงาน)' },
  { v: 'range',   l: 'ตามช่วงเลขสมาชิก' },
  { v: 'newbie',  l: 'สมาชิกใหม่ (≤ 1 ปี)' },
];

// ─── กลุ่มที่มาของผู้ลงทะเบียน (A แอป/CMS · B หน้างาน · C ล่วงหน้า) ─────
window.SEM_SOURCES = {
  A: { l: 'สมัครผ่านแอป / CMS', short: 'A', chip: 'info',    desc: 'สมาชิกลงทะเบียนเองผ่าน Mobile Application หรือ CMS' },
  B: { l: 'ลงทะเบียนหน้างาน',   short: 'B', chip: 'success', desc: 'เจ้าหน้าที่ยืนยันตัวตนด้วยบัตรประชาชน ณ จุดจัดงาน' },
  C: { l: 'ลงทะเบียนล่วงหน้า',  short: 'C', chip: 'primary', desc: 'เจ้าหน้าที่บันทึกรายชื่อล่วงหน้าผ่านระบบหลังบ้าน' },
};
window.semSource = (v) => window.SEM_SOURCES[v] || window.SEM_SOURCES.C;

// ─── รายการรหัสสังกัด (สร้างจากสมาชิกจริงในระบบ) ───────────────────────
window.semDeptOptions = () => {
  const seen = {};
  (window.MEMBERS_LIST || []).forEach(m => { if (m.deptCode && !seen[m.deptCode]) seen[m.deptCode] = m.dept; });
  return Object.entries(seen).map(([code, name]) => ({ code, name })).sort((a, b) => a.code.localeCompare(b.code));
};
window.semDeptName = (code) => (window.semDeptOptions().find(d => d.code === code) || {}).name || code;

// ─── รายการสังกัดสำหรับ Search select (จากค่าคงที่ต้นสังกัด) ───────────
window.semAffilOptions = () => {
  const src = (window.affilLoad ? window.affilLoad() : (window.AFFIL_SEED || [])).filter(d => d.enabled !== false);
  const seen = {}; const out = [];
  src.forEach(d => { if (!seen[d.code]) { seen[d.code] = 1; out.push({ value: d.code, label: `${d.code} · ${d.name}`, sub: d.unit || '' }); } });
  return out.sort((a, b) => a.value.localeCompare(b.value));
};
window.semAffilName = (code) => {
  const rec = window.affilByCode ? window.affilByCode(code) : null;
  return rec ? rec.name : window.semDeptName(code);
};

// ─── หมวดค่าใช้จ่ายของรายการ (รายบุคคล / มูลค่ารวม) ──────────────────
window.SEM_EXPENSE_MODES = [
  { v: 'perhead', l: 'รายบุคคล (× จำนวนผู้เข้าร่วม)' },
  { v: 'total',   l: 'มูลค่ารวม (เหมาจ่าย)' },
];
let _semExpSeq = 0;
window.semBlankExpense = () => ({ key: 'exp-' + (++_semExpSeq) + '-' + Date.now(), desc: '', mode: 'perhead', rate: '', qty: '', amount: '', cat: '' });
window.semExpenseTotal = (e, defQty) => {
  if (!e) return 0;
  if (e.mode === 'total') return Number(e.amount) || 0;
  const qty = e.qty === '' || e.qty == null ? (Number(defQty) || 0) : (Number(e.qty) || 0);
  return (Number(e.rate) || 0) * qty;
};
window.semExpensesTotal = (list, defQty) => (list || []).reduce((s, e) => s + window.semExpenseTotal(e, defQty), 0);

// ─── helper: ตรวจสิทธิ์เข้าร่วมของสมาชิกตามเงื่อนไขโครงการ ──────────────
window.semMemberEligible = (p, m) => {
  if (!p || !m) return { ok: false, reason: 'ไม่พบข้อมูลสมาชิก' };
  const el = p.eligible || 'all';
  if (el === 'dept') {
    const allow = p.allowDepts || [];
    if (allow.length && !allow.includes(m.deptCode))
      return { ok: false, reason: `สังกัด ${m.deptCode} ไม่อยู่ในเงื่อนไขโครงการ` };
  }
  if (el === 'range') {
    const num = parseInt(String(m.code).replace(/\D/g, ''), 10);
    const from = parseInt(String(p.memberFrom || '').replace(/\D/g, ''), 10);
    const to = parseInt(String(p.memberTo || '').replace(/\D/g, ''), 10);
    if (!isNaN(from) && !isNaN(num) && num < from) return { ok: false, reason: 'เลขสมาชิกนอกช่วงที่กำหนด' };
    if (!isNaN(to) && !isNaN(num) && num > to) return { ok: false, reason: 'เลขสมาชิกนอกช่วงที่กำหนด' };
  }
  return { ok: true, reason: 'มีสิทธิ์เข้าร่วมโครงการ' };
};

// ─── helper: ค้นหาสมาชิกจากเลขบัตรประชาชน (เครื่องอ่านบัตร) ─────────────
window.semFindMemberByCitizen = (cid) => {
  const key = String(cid || '').replace(/\D/g, '');
  if (key.length !== 13) return null;
  return (window.MEMBERS_LIST || []).find(m => String(m.citizenId || '').replace(/\D/g, '') === key) || null;
};

// ─── อัตราค่าใช้จ่าย (ค่าคงที่กลาง) ───────────────────────────────────
window.SEM_RATES = {
  transportPerKm: 4,        // ค่าพาหนะตามระยะทาง (บาท/กม.)
  transportCharter: 18000,  // ค่าเหมารถบัส (บาท/คัน)
  busSeats: 45,             // ที่นั่งต่อคันรถบัส
  lodgingPerNight: 1200,    // ค่าที่พัก (บาท/คืน/ห้อง)
  roomCapacity: 2,          // คน/ห้องมาตรฐาน
  mealPerDay: 600,          // ค่าอาหาร (บาท/คน/วัน)
};

// ─── ระยะทางตามเขต (ใช้คำนวณค่าพาหนะตามระยะทาง) ─────────────────────
window.SEM_ZONES = [
  { zone: 'เขตกรุงเทพและปริมณฑล', km: 60 },
  { zone: 'ภาคกลาง',             km: 220 },
  { zone: 'ภาคเหนือ',            km: 580 },
  { zone: 'ภาคตะวันออกเฉียงเหนือ', km: 510 },
  { zone: 'ภาคใต้',              km: 780 },
];

// ─── โครงการตัวอย่าง ─────────────────────────────────────────────────
//  registrants: {code, name, dept, deptCode, status:'confirmed'|'reserve', vip, room, source:'A'|'B'|'C', checkinAt}
window.SEM_SEED = [
  { id: 'SM-2569-001', type: 'seminar', title: 'สัมมนาสมาชิกประจำปี 2569 “ออมเพื่ออนาคต”',
    dateFrom: '2026-08-15', dateTo: '2026-08-16', venue: 'โรงแรมเดอะกรีนเนอรี่ เขาใหญ่ จ.นครราชสีมา',
    zone: 'ภาคตะวันออกเฉียงเหนือ', capacity: 90, reserve: 10, autoClose: true,
    eligible: 'all', allowDepts: [], areaNote: '', regFrom: '2026-06-20', regTo: '2026-07-31',
    nights: 1, days: 2, charter: true, buses: 2, status: 'open',
    registrants: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง', deptCode: '0801', status: 'confirmed', vip: false, room: 'A-101', source: 'A' },
      { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง', deptCode: '0301', status: 'confirmed', vip: false, room: 'A-101', source: 'A' },
      { code: 'M-058246', name: 'นางสาวพรพิมล ทองคำ', dept: 'กองสาธารณสุข', deptCode: '0601', status: 'confirmed', vip: true, room: 'V-201', source: 'C' },
      { code: 'M-058250', name: 'นางอรอนงค์ บุญมาก', dept: 'สำนักปลัด', deptCode: '0101', status: 'confirmed', vip: false, room: 'A-102', source: 'B', checkinAt: '2026-08-15 08:40' },
      { code: 'M-058252', name: 'นางสาวจุฬาลักษณ์ พัฒนกุล', dept: 'กองการศึกษา', deptCode: '0501', status: 'reserve', vip: false, room: '', source: 'A' },
    ] },
  { id: 'SM-2569-002', type: 'training', title: 'อบรมวิชาชีพ “การเงินส่วนบุคคลและการลงทุน”',
    dateFrom: '2026-09-05', dateTo: '2026-09-05', venue: 'ห้องประชุมใหญ่ สำนักงานใหญ่ สอ.กสท.',
    zone: 'เขตกรุงเทพและปริมณฑล', capacity: 50, reserve: 5, autoClose: true,
    eligible: 'dept', allowDepts: ['0801', '0101'], areaNote: '', regFrom: '2026-07-15', regTo: '2026-08-25',
    nights: 0, days: 1, charter: false, buses: 0, status: 'open',
    registrants: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง', deptCode: '0801', status: 'confirmed', vip: false, room: '', source: 'C' },
      { code: 'M-058245', name: 'นายธีรพงษ์ ขำเพชร', dept: 'สำนักปลัด', deptCode: '0101', status: 'confirmed', vip: false, room: '', source: 'A' },
    ] },
  { id: 'SM-2569-003', type: 'orient', title: 'ปฐมนิเทศสมาชิกใหม่ รุ่นที่ 12',
    dateFrom: '2026-07-10', dateTo: '2026-07-10', venue: 'ห้องอบรม ชั้น 3 สำนักงานใหญ่',
    zone: 'เขตกรุงเทพและปริมณฑล', capacity: 40, reserve: 0, autoClose: false,
    eligible: 'newbie', allowDepts: [], areaNote: '', regFrom: '2026-06-01', regTo: '2026-07-05',
    nights: 0, days: 1, charter: false, buses: 0, status: 'closed',
    registrants: [
      { code: 'M-058252', name: 'นางสาวจุฬาลักษณ์ พัฒนกุล', dept: 'กองการศึกษา', deptCode: '0501', status: 'confirmed', vip: false, room: '', source: 'C' },
    ] },
];

// ─── helper: คำนวณค่าใช้จ่ายโครงการ ──────────────────────────────────
window.semCostEstimate = (p) => {
  const r = window.SEM_RATES;
  const confirmed = (p.registrants || []).filter(x => x.status === 'confirmed').length;
  const head = confirmed || p.capacity || 0;
  // ── ถ้ามีรายการค่าใช้จ่ายที่กำหนดเอง ให้ใช้ผลรวมนั้น ──
  if (p.expenses && p.expenses.length) {
    const total = window.semExpensesTotal(p.expenses, head);
    return { head, km: 0, rooms: 0, transport: 0, lodging: 0, meal: 0,
      total, perHead: head ? Math.round(total / head) : 0, fromExpenses: true };
  }
  // ── มิฉะนั้นใช้ประมาณการจากอัตรากลาง (fallback สำหรับข้อมูลเดิม) ──
  // พาหนะ: เหมารถ (ตามจำนวนคัน) หรือ ตามระยะทางรายคน
  const zone = window.SEM_ZONES.find(z => z.zone === p.zone);
  const km = zone ? zone.km : 0;
  const transport = p.charter
    ? (p.buses || Math.ceil(head / r.busSeats)) * r.transportCharter
    : head * km * r.transportPerKm * 2; // ไป-กลับ
  // ที่พัก: ห้อง = ceil(คน/ความจุห้อง) × คืน
  const rooms = p.nights > 0 ? Math.ceil(head / r.roomCapacity) : 0;
  const lodging = rooms * p.nights * r.lodgingPerNight;
  // อาหาร: คน × วัน
  const meal = head * (p.days || 1) * r.mealPerDay;
  return {
    head, km, rooms,
    transport, lodging, meal,
    total: transport + lodging + meal,
    perHead: head ? Math.round((transport + lodging + meal) / head) : 0,
  };
};

// ─── helper: ออกเลขโครงการถัดไป ──────────────────────────────────────
window.semNextNo = (list, year) => {
  const yr = String(year || 2569);
  const nums = list.filter(p => String(p.id).startsWith('SM-' + yr)).map(p => parseInt(String(p.id).split('-')[2], 10) || 0);
  return `SM-${yr}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
};
