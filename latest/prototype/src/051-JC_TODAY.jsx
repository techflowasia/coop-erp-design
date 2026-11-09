// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — เรียกเก็บหนี้ตามคำพิพากษาตามยอม (6.8)
//  ข้อมูลสาธิต: ทะเบียนลูกหนี้ตามคำพิพากษา · ตารางงวดชำระ · กลุ่มสัญญา
// ════════════════════════════════════════════════════════════════════

window.JC_TODAY = (typeof window.DEPOSIT_WORKING_DATE === 'string' && window.DEPOSIT_WORKING_DATE) || '2026-06-10';
window.JC_USER  = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── กลุ่มสัญญาตามช่วงเวลาปรับโครงสร้างเทียบคำพิพากษาตามยอม ───────────
window.JC_GROUPS = [
  { v: 'before', l: 'ปรับโครงสร้างหนี้ก่อนพิพากษาตามยอม', short: 'ก่อนพิพากษา', pill: 'info' },
  { v: 'per',    l: 'ปรับโครงสร้างหนี้ตามพิพากษาตามยอม',  short: 'ตามพิพากษา', pill: 'primary' },
  { v: 'after',  l: 'ปรับโครงสร้างหนี้หลังพิพากษาตามยอม', short: 'หลังพิพากษา', pill: 'warning' },
];
window.jcGroup = (v) => window.JC_GROUPS.find(g => g.v === v) || { v, l: v, short: v, pill: 'neutral' };

// ─── สถานะการเรียกเก็บ ──────────────────────────────────────────────
window.JC_STATUS = [
  { v: 'normal',  l: 'ชำระปกติ',   pill: 'ok'      },
  { v: 'overdue', l: 'ผิดนัดชำระ', pill: 'bad'     },
  { v: 'closed',  l: 'ชำระครบแล้ว', pill: 'neutral' },
];
window.jcStatus = (v) => window.JC_STATUS.find(s => s.v === v) || { v, l: v, pill: 'neutral' };

// ─── ศาล / สำนักงานบังคับคดี (datalist) ─────────────────────────────
window.JC_COURTS = [
  'ศาลแพ่ง', 'ศาลแพ่งกรุงเทพใต้', 'ศาลแพ่งธนบุรี', 'ศาลจังหวัดนนทบุรี',
  'ศาลจังหวัดสมุทรปราการ', 'ศาลแรงงานกลาง', 'ศาลจังหวัดปทุมธานี',
];

// ─── สร้างตารางงวดชำระตามคำพิพากษา ──────────────────────────────────
//  startIso = งวดแรก · perTerm = ค่างวด · n = จำนวนงวด · paidTerms = จ่ายแล้วกี่งวด
function jcMakeSchedule(startIso, perTerm, n, paidTerms) {
  const rows = [];
  const [y, m] = startIso.split('-').map(Number);
  for (let i = 0; i < n; i++) {
    const dt = new Date(y, (m - 1) + i, 10);
    const dueIso = dt.toISOString().slice(0, 10);
    const paid = i < paidTerms;
    rows.push({
      term: i + 1,
      dueDate: dueIso,
      amount: perTerm,
      paid,
      paidDate: paid ? dueIso : null,
    });
  }
  return rows;
}

// ─── นับจำนวนงวดที่ผิดนัด (ครบกำหนดแล้วแต่ยังไม่จ่าย) ────────────────
window.jcOverdueTerms = (rec, todayIso) => {
  const today = todayIso || window.JC_TODAY;
  return (rec.schedule || []).filter(r => !r.paid && r.dueDate <= today).length;
};
window.jcNextDue = (rec) => {
  const next = (rec.schedule || []).find(r => !r.paid);
  return next ? next.dueDate : null;
};
window.jcRemaining = (rec) =>
  Math.max(0, (rec.judgmentAmount || 0) - (rec.paidAmount || 0));

// ─── ทะเบียนลูกหนี้ตามคำพิพากษาตามยอม (ข้อมูลสาธิต) ─────────────────
const JC_SEED = [
  {
    id: 'jc1', no: 'JC-2569-0001', group: 'per',
    memberCode: '060044', memberName: 'นายอำนวย สุขเจริญ', dept: 'สำนักงานใหญ่ กสท',
    role: 'ผู้กู้', contractNo: 'ป1-2563-0118',
    blackCaseNo: 'ผบ 4412/2566', redCaseNo: 'ผบ 2210/2567', court: 'ศาลแพ่ง',
    judgmentDate: '2024-09-24',
    judgmentAmount: 685000, paidAmount: 178000, installmentAmount: 8500,
    adjusted: true,
    relatedParties: [
      { name: 'นางสมหญิง แก้วมณี', role: 'ผู้ค้ำประกัน', dept: 'กองคลัง' },
      { name: 'นายสุรชัย ทองอยู่', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายปฏิบัติการ' },
    ],
    schedule: jcMakeSchedule('2024-11', 8500, 80, 20),
    note: 'ทำสัญญาประนีประนอมยอมความในชั้นศาล ชำระเดือนละ 8,500 บาท',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2024-10-05T09:20:00',
  },
  {
    id: 'jc2', no: 'JC-2569-0002', group: 'before',
    memberCode: '058210', memberName: 'นางมาลี ศรีสุข', dept: 'ฝ่ายสื่อสารดาวเทียม',
    role: 'ผู้กู้', contractNo: 'ป1-2562-0087',
    blackCaseNo: 'ผบ 3980/2566', redCaseNo: 'ผบ 1985/2567', court: 'ศาลแพ่งกรุงเทพใต้',
    judgmentDate: '2024-07-15',
    judgmentAmount: 420000, paidAmount: 96000, installmentAmount: 6000,
    adjusted: true,
    relatedParties: [
      { name: 'นายวิชัย ตั้งใจ', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายสื่อสารดาวเทียม' },
    ],
    schedule: jcMakeSchedule('2024-09', 6000, 70, 13),
    note: 'ปรับโครงสร้างหนี้ก่อนฟ้อง — ผิดนัดจึงส่งฟ้องและทำยอมในภายหลัง',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2024-08-02T14:10:00',
  },
  {
    id: 'jc3', no: 'JC-2569-0003', group: 'after',
    memberCode: '055913', memberName: 'นายประสงค์ ใจมั่น', dept: 'กองพัสดุ',
    role: 'ผู้กู้', contractNo: 'ป2-2561-0043',
    blackCaseNo: 'ผบ 2871/2565', redCaseNo: 'ผบ 1544/2566', court: 'ศาลจังหวัดนนทบุรี',
    judgmentDate: '2023-05-30',
    judgmentAmount: 910000, paidAmount: 143000, installmentAmount: 11000,
    adjusted: false,
    relatedParties: [
      { name: 'นางสาวปิยะดา คงมั่น', role: 'ผู้ค้ำประกัน', dept: 'กองพัสดุ' },
      { name: 'นายเอกชัย พูนผล', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายบุคคล' },
    ],
    schedule: jcMakeSchedule('2023-07', 11000, 84, 13),
    note: 'ปรับโครงสร้างหลังพิพากษา — ผิดนัดต่อเนื่อง อยู่ระหว่างพิจารณาบังคับคดี',
    enteredBy: 'ประภาส ทองสุข', enteredAt: '2023-06-12T10:45:00',
  },
  {
    id: 'jc4', no: 'JC-2569-0004', group: 'per',
    memberCode: '061725', memberName: 'นางสาวกนกวรรณ อินทร์แก้ว', dept: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    role: 'ผู้กู้', contractNo: 'ป1-2564-0201',
    blackCaseNo: 'ผบ 5120/2567', redCaseNo: 'ผบ 2688/2567', court: 'ศาลแพ่งธนบุรี',
    judgmentDate: '2024-11-18',
    judgmentAmount: 350000, paidAmount: 84000, installmentAmount: 7000,
    adjusted: true,
    relatedParties: [
      { name: 'นายธนา รุ่งเรือง', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายเทคโนโลยีสารสนเทศ' },
    ],
    schedule: jcMakeSchedule('2025-01', 7000, 50, 12),
    note: 'ชำระตามยอมสม่ำเสมอ',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2024-12-01T11:00:00',
  },
  {
    id: 'jc5', no: 'JC-2569-0005', group: 'before',
    memberCode: '049880', memberName: 'นายสมบัติ เพียรงาน', dept: 'ฝ่ายไปรษณีย์เขต',
    role: 'ผู้กู้', contractNo: 'ป1-2560-0033',
    blackCaseNo: 'ผบ 1120/2565', redCaseNo: 'ผบ 780/2566', court: 'ศาลจังหวัดสมุทรปราการ',
    judgmentDate: '2023-03-12',
    judgmentAmount: 1250000, paidAmount: 512000, installmentAmount: 14500,
    adjusted: true,
    relatedParties: [
      { name: 'นางอรทัย เพียรงาน', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายไปรษณีย์เขต' },
      { name: 'นายมานพ สีทา', role: 'ผู้ค้ำประกัน', dept: 'กองคลัง' },
    ],
    schedule: jcMakeSchedule('2023-05', 14500, 96, 35),
    note: 'ยอดสูง ผ่อนระยะยาว — ชำระสม่ำเสมอ',
    enteredBy: 'ประภาส ทองสุข', enteredAt: '2023-04-01T09:15:00',
  },
  {
    id: 'jc6', no: 'JC-2569-0006', group: 'after',
    memberCode: '062040', memberName: 'นายชูเกียรติ วัฒนา', dept: 'ฝ่ายวิศวกรรม',
    role: 'ผู้กู้', contractNo: 'ป2-2563-0155',
    blackCaseNo: 'ผบ 4455/2566', redCaseNo: 'ผบ 2301/2567', court: 'ศาลแรงงานกลาง',
    judgmentDate: '2024-08-08',
    judgmentAmount: 560000, paidAmount: 40000, installmentAmount: 8000,
    adjusted: false,
    relatedParties: [
      { name: 'นางเบญจมาศ วัฒนา', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายวิศวกรรม' },
    ],
    schedule: jcMakeSchedule('2024-10', 8000, 70, 5),
    note: 'ผิดนัดหลายงวด — เสนอพิจารณาบังคับคดี',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2024-09-05T13:30:00',
  },
  {
    id: 'jc7', no: 'JC-2569-0007', group: 'per',
    memberCode: '057330', memberName: 'นางวันเพ็ญ ชื่นบาน', dept: 'กองบัญชี',
    role: 'ผู้กู้', contractNo: 'ป1-2562-0110',
    blackCaseNo: 'ผบ 3011/2566', redCaseNo: 'ผบ 1622/2567', court: 'ศาลจังหวัดปทุมธานี',
    judgmentDate: '2024-06-20',
    judgmentAmount: 300000, paidAmount: 300000, installmentAmount: 6500,
    adjusted: true,
    relatedParties: [
      { name: 'นายกิตติ ชื่นบาน', role: 'ผู้ค้ำประกัน', dept: 'กองบัญชี' },
    ],
    schedule: jcMakeSchedule('2024-08', 6500, 47, 47),
    note: 'ชำระครบตามคำพิพากษาแล้ว',
    enteredBy: 'ประภาส ทองสุข', enteredAt: '2024-07-01T10:00:00',
  },
  {
    id: 'jc8', no: 'JC-2569-0008', group: 'before',
    memberCode: '063510', memberName: 'นายอดิศักดิ์ พรหมมา', dept: 'ฝ่ายปฏิบัติการภูมิภาค',
    role: 'ผู้กู้', contractNo: 'ป1-2564-0288',
    blackCaseNo: 'ผบ 5220/2567', redCaseNo: 'ผบ 2740/2567', court: 'ศาลจังหวัดสมุทรปราการ',
    judgmentDate: '2024-10-02',
    judgmentAmount: 480000, paidAmount: 27000, installmentAmount: 9000,
    adjusted: false,
    relatedParties: [
      { name: 'นางสาวรัตนา แซ่ลิ้ม', role: 'ผู้ค้ำประกัน', dept: 'ฝ่ายปฏิบัติการภูมิภาค' },
    ],
    schedule: jcMakeSchedule('2024-12', 9000, 60, 3),
    note: 'ผิดนัดตั้งแต่งวดต้น — ติดตามเร่งด่วน',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2024-11-01T15:20:00',
  },
];

// ─── สถานะคำนวณจากตารางงวด ─────────────────────────────────────────
function jcComputeStatus(rec) {
  if (window.jcRemaining(rec) <= 0) return 'closed';
  return window.jcOverdueTerms(rec) > 0 ? 'overdue' : 'normal';
}
// เติม status ให้ทุกเรคคอร์ด
JC_SEED.forEach(r => { r.status = jcComputeStatus(r); });

// ─── โหลด / บันทึก (localStorage) ───────────────────────────────────
const JC_LS_KEY = 'coop.judgmentCollection.v1';
window.jcLoad = () => {
  try {
    const raw = localStorage.getItem(JC_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JC_SEED;
};
window.jcSaveLS = (list) => {
  try { localStorage.setItem(JC_LS_KEY, JSON.stringify(list)); } catch (e) {}
};
window.jcNextNo = (list) => {
  const yr = 2569;
  const nums = (list || []).map(r => {
    const m = /JC-\d+-(\d+)/.exec(r.no || '');
    return m ? Number(m[1]) : 0;
  });
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `JC-${yr}-${String(next).padStart(4, '0')}`;
};

// ─── ฟอร์มเปล่า ─────────────────────────────────────────────────────
window.jcBlankForm = () => ({
  group: 'per', role: 'ผู้กู้', contractNo: '',
  blackCaseNo: '', redCaseNo: '', court: '', judgmentDate: '',
  judgmentAmount: '', paidAmount: '', installmentAmount: '',
  adjusted: false, relatedParties: [], schedule: [], note: '',
});
