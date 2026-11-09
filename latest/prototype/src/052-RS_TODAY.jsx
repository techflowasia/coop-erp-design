// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — อายัดหนี้ผู้เกษียณ / เกษียณก่อนกำหนด (6.10)
//  ข้อมูลสาธิต: ทะเบียนผู้เกษียณ · หุ้น-หนี้รายสัญญา · ดอกเบี้ยสะสม · การติดค้ำ
// ════════════════════════════════════════════════════════════════════

window.RS_TODAY = (typeof window.DEPOSIT_WORKING_DATE === 'string' && window.DEPOSIT_WORKING_DATE) || '2026-06-02';
window.RS_USER  = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── ประเภทการเกษียณ ────────────────────────────────────────────────
window.RS_RETIRE_TYPES = [
  { v: 'normal', l: 'เกษียณอายุปกติ' },
  { v: 'early',  l: 'เกษียณก่อนกำหนด' },
];
window.rsRetireType = (v) => window.RS_RETIRE_TYPES.find(t => t.v === v) || { v, l: v };

// ─── กลุ่มผู้เกษียณ (แยกตามสัดส่วนหุ้น-หนี้) ─────────────────────────
window.RS_GROUPS = [
  { v: 'share-only', l: 'มีหุ้นอย่างเดียว (ไม่มีหนี้)', short: 'หุ้นอย่างเดียว', pill: 'info'    },
  { v: 'share-gt',   l: 'มีหุ้นมากกว่าหนี้',          short: 'หุ้น > หนี้',   pill: 'primary' },
  { v: 'debt-gt',    l: 'มีหนี้มากกว่าหุ้น',          short: 'หนี้ > หุ้น',   pill: 'warning' },
];
window.rsGroupMeta = (v) => window.RS_GROUPS.find(g => g.v === v) || { v, l: v, short: v, pill: 'neutral' };

// ─── สถานะการอายัด ─────────────────────────────────────────────────
window.RS_SEIZE_STATUS = [
  { v: 'pending', l: 'รอดำเนินการ', pill: 'neutral' },
  { v: 'notified', l: 'แจ้งต้นสังกัดแล้ว', pill: 'info' },
  { v: 'seized',  l: 'อายัด/หักเงินแล้ว', pill: 'warn' },
  { v: 'done',    l: 'เสร็จสิ้น', pill: 'ok' },
];
window.rsSeizeStatus = (v) => window.RS_SEIZE_STATUS.find(s => s.v === v) || { v, l: v, pill: 'neutral' };

// ─── ช่องทางรับเงิน (เพื่อขอหัก) ────────────────────────────────────
window.RS_PAY_CHANNELS = ['บำเหน็จ', 'บำนาญ', 'บำเหน็จดำรงชีพ', 'เงินกองทุนสำรองเลี้ยงชีพ'];

// ─── คำนวณยอด ───────────────────────────────────────────────────────
window.rsDebtPrincipal = (rec) => (rec.contracts || []).reduce((s, c) => s + (c.principal || 0), 0);
window.rsDebtInterest  = (rec) => (rec.contracts || []).reduce((s, c) => s + (c.interestAccrued || 0), 0);
window.rsDebtTotal     = (rec) => window.rsDebtPrincipal(rec) + window.rsDebtInterest(rec);
window.rsNetShare      = (rec) => (rec.shareTotal || 0) - window.rsDebtTotal(rec);
// จัดกลุ่มอัตโนมัติจากสัดส่วนหุ้น-หนี้
window.rsClassify = (rec) => {
  const debt = window.rsDebtTotal(rec);
  if (debt <= 0) return 'share-only';
  return (rec.shareTotal || 0) >= debt ? 'share-gt' : 'debt-gt';
};

// ─── ทะเบียนผู้เกษียณ (ข้อมูลสาธิต) ─────────────────────────────────
const RS_SEED = [
  {
    id: 'rs1', no: 'RT-2569-0001',
    memberCode: '041220', memberName: 'นายบุญเลิศ ทวีสุข', dept: 'สำนักงานใหญ่ กสท', deptCode: '0100',
    age: 60, retireType: 'normal', retireDate: '2026-09-30',
    shareTotal: 328000, contracts: [],
    seizeStatus: 'pending', payChannel: 'บำเหน็จ',
    guaranteeingOthers: [],
    letters: { continueMembership: false, demand: false, deductRequest: false },
    note: 'ไม่มีภาระหนี้ — คืนค่าหุ้นเมื่อพ้นสภาพ',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-20T09:30:00',
  },
  {
    id: 'rs2', no: 'RT-2569-0002',
    memberCode: '043180', memberName: 'นางประไพ แสงทอง', dept: 'กองคลัง', deptCode: '0300',
    age: 60, retireType: 'normal', retireDate: '2026-09-30',
    shareTotal: 512000,
    contracts: [
      { contractNo: 'ป1-2562-0044', type: 'สามัญ', principal: 168000, interestAccrued: 4200, rate: 6.0 },
      { contractNo: 'ฉ-2566-0210',  type: 'ฉุกเฉิน', principal: 22000, interestAccrued: 480, rate: 6.5 },
    ],
    seizeStatus: 'notified', payChannel: 'บำนาญ',
    guaranteeingOthers: [],
    letters: { continueMembership: true, demand: false, deductRequest: false },
    note: 'หุ้นมากกว่าหนี้ — โอนหุ้นชำระหนี้ได้ครบ',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-18T10:15:00',
  },
  {
    id: 'rs3', no: 'RT-2569-0003',
    memberCode: '039905', memberName: 'นายสมพงษ์ ยิ่งยง', dept: 'ฝ่ายปฏิบัติการภูมิภาค', deptCode: '0500',
    age: 60, retireType: 'normal', retireDate: '2026-09-30',
    shareTotal: 152000,
    contracts: [
      { contractNo: 'ป1-2560-0019', type: 'สามัญ', principal: 540000, interestAccrued: 18900, rate: 6.0 },
      { contractNo: 'ป2-2563-0077', type: 'พิเศษ', principal: 96000, interestAccrued: 3100, rate: 5.5 },
    ],
    seizeStatus: 'seized', payChannel: 'บำเหน็จ',
    guaranteeingOthers: [
      { memberCode: '052110', name: 'นายวิรัตน์ คงทน', contractNo: 'ป1-2564-0231', changed: false },
    ],
    letters: { continueMembership: true, demand: true, deductRequest: true },
    note: 'หนี้มากกว่าหุ้น — แจ้งต้นสังกัดขอหักบำเหน็จ และผู้เกษียณติดค้ำสมาชิกอื่น 1 ราย',
    enteredBy: 'ประภาส ทองสุข', enteredAt: '2026-05-12T14:00:00',
  },
  {
    id: 'rs4', no: 'RT-2569-0004',
    memberCode: '046700', memberName: 'นางสาวจินตนา ผ่องใส', dept: 'ฝ่ายบุคคล', deptCode: '0200',
    age: 55, retireType: 'early', retireDate: '2026-07-31',
    shareTotal: 88000,
    contracts: [
      { contractNo: 'ป1-2561-0122', type: 'สามัญ', principal: 498000, interestAccrued: 22400, rate: 6.0 },
    ],
    seizeStatus: 'pending', payChannel: 'บำเหน็จ',
    guaranteeingOthers: [],
    letters: { continueMembership: false, demand: true, deductRequest: false },
    note: 'เกษียณก่อนกำหนด — หนี้มากกว่าหุ้น',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-25T11:20:00',
  },
  {
    id: 'rs5', no: 'RT-2569-0005',
    memberCode: '040015', memberName: 'นายเกรียงศักดิ์ พูนทรัพย์', dept: 'ฝ่ายวิศวกรรม', deptCode: '0400',
    age: 58, retireType: 'early', retireDate: '2026-08-31',
    shareTotal: 636000,
    contracts: [
      { contractNo: 'ป2-2562-0033', type: 'พิเศษ', principal: 290000, interestAccrued: 9600, rate: 5.5 },
    ],
    seizeStatus: 'done', payChannel: 'บำนาญ',
    guaranteeingOthers: [],
    letters: { continueMembership: true, demand: false, deductRequest: false },
    note: 'หุ้นมากกว่าหนี้ — ประสงค์เป็นสมาชิกต่อ',
    enteredBy: 'ประภาส ทองสุข', enteredAt: '2026-04-30T09:00:00',
  },
  {
    id: 'rs6', no: 'RT-2569-0006',
    memberCode: '044521', memberName: 'นางอัมพร ศรีเรือง', dept: 'กองบัญชี', deptCode: '0310',
    age: 60, retireType: 'normal', retireDate: '2026-09-30',
    shareTotal: 274000, contracts: [],
    seizeStatus: 'pending', payChannel: 'บำเหน็จ',
    guaranteeingOthers: [],
    letters: { continueMembership: false, demand: false, deductRequest: false },
    note: 'มีหุ้นอย่างเดียว',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-22T13:40:00',
  },
  {
    id: 'rs7', no: 'RT-2569-0007',
    memberCode: '038800', memberName: 'นายชาญชัย เรืองศรี', dept: 'ฝ่ายสื่อสารดาวเทียม', deptCode: '0600',
    age: 60, retireType: 'normal', retireDate: '2026-09-30',
    shareTotal: 42000,
    contracts: [
      { contractNo: 'ป1-2559-0008', type: 'สามัญ', principal: 372000, interestAccrued: 16800, rate: 6.0 },
      { contractNo: 'ฉ-2565-0155',  type: 'ฉุกเฉิน', principal: 28000, interestAccrued: 900, rate: 6.5 },
    ],
    seizeStatus: 'notified', payChannel: 'บำเหน็จ',
    guaranteeingOthers: [
      { memberCode: '053221', name: 'นางสาวพรทิพย์ ใจดี', contractNo: 'ป1-2566-0301', changed: false },
      { memberCode: '051009', name: 'นายอนุชา วงศ์ใหญ่', contractNo: 'ฉ-2567-0410', changed: true },
    ],
    letters: { continueMembership: true, demand: true, deductRequest: true },
    note: 'หนี้มากกว่าหุ้นมาก — ผู้เกษียณติดค้ำสมาชิกอื่น 2 ราย ต้องแจ้งเปลี่ยนผู้ค้ำ',
    enteredBy: 'ประภาส ทองสุข', enteredAt: '2026-05-10T15:30:00',
  },
  {
    id: 'rs8', no: 'RT-2569-0008',
    memberCode: '045990', memberName: 'นางเพ็ญศรี มั่นคง', dept: 'ฝ่ายเทคโนโลยีสารสนเทศ', deptCode: '0700',
    age: 60, retireType: 'normal', retireDate: '2026-09-30',
    shareTotal: 548000,
    contracts: [
      { contractNo: 'ป1-2563-0201', type: 'สามัญ', principal: 176000, interestAccrued: 5300, rate: 6.0 },
    ],
    seizeStatus: 'pending', payChannel: 'บำนาญ',
    guaranteeingOthers: [],
    letters: { continueMembership: false, demand: false, deductRequest: false },
    note: 'หุ้นมากกว่าหนี้',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-28T08:50:00',
  },
];
// เติมกลุ่มอัตโนมัติ
RS_SEED.forEach(r => { r.group = window.rsClassify(r); });

// ─── โหลด / บันทึก (localStorage) ───────────────────────────────────
const RS_LS_KEY = 'coop.retireeSeizure.v1';
window.rsLoad = () => {
  try { const raw = localStorage.getItem(RS_LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return RS_SEED;
};
window.rsSaveLS = (list) => { try { localStorage.setItem(RS_LS_KEY, JSON.stringify(list)); } catch (e) {} };
window.rsNextNo = (list) => {
  const nums = (list || []).map(r => { const m = /RT-\d+-(\d+)/.exec(r.no || ''); return m ? Number(m[1]) : 0; });
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `RT-2569-${String(next).padStart(4, '0')}`;
};

// ─── ฟอร์มเปล่า ─────────────────────────────────────────────────────
window.rsBlankForm = () => ({
  age: '', retireType: 'normal', retireDate: '',
  shareTotal: '', contracts: [],
  seizeStatus: 'pending', payChannel: 'บำเหน็จ',
  guaranteeingOthers: [],
  letters: { continueMembership: false, demand: false, deductRequest: false },
  note: '',
});
