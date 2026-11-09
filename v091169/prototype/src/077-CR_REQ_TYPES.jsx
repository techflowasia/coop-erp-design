// ════════════════════════════════════════════════════════════════════
//  ระบบงานขอสินไหม / งานขอสินไหม
//  บันทึกทะเบียนขอสินไหม (Insurance Claim Registration)
//  ── ทะเบียนกลางของคำขอสินไหม: สมาชิก · การเสียชีวิต · กรมธรรม์ ·
//     ผู้รับผลประโยชน์ · หนี้คงเหลือ · การตัดชำระ · เอกสาร · ประวัติ
//  ใช้ฐานข้อมูลสมาชิกร่วมกับหน้าตรวจสอบสิทธิ (window.CL_MEMBERS)
// ════════════════════════════════════════════════════════════════════

// ─── ค่าคงที่ ─────────────────────────────────────────────────────────
window.CR_REQ_TYPES = [
  { v: 'death',      l: 'เสียชีวิต' },
  { v: 'disability', l: 'ทุพพลภาพถาวร' },
  { v: 'accident',   l: 'อุบัติเหตุ' },
  { v: 'loan',       l: 'ประกันสินเชื่อ', insType: 'ประกันเงินกู้' },
  { v: 'other',      l: 'อื่น ๆ' },
];
window.crReqTypeLabel = (v) => (window.CR_REQ_TYPES.find(t => t.v === v) || {}).l || v;

// สถานะคำขอสินไหม (workflow เต็ม) — เรียงตามลำดับการทำงาน
window.CR_STATUS = {
  draft:     { l: 'ร่างคำขอ',            pill: 'neutral', step: 0 },
  doccheck:  { l: 'รอตรวจสอบเอกสาร',      pill: 'warn',    step: 1 },
  docmiss:   { l: 'เอกสารไม่ครบ',         pill: 'bad',     step: 1 },
  ready:     { l: 'พร้อมส่งบริษัทประกัน',  pill: 'info',    step: 2 },
  sent:      { l: 'ส่งบริษัทประกันแล้ว',   pill: 'info',    step: 3 },
  reviewing: { l: 'อยู่ระหว่างพิจารณา',    pill: 'warn',    step: 4 },
  approved:  { l: 'อนุมัติสินไหม',        pill: 'ok',      step: 5 },
  rejected:  { l: 'ปฏิเสธสินไหม',         pill: 'bad',     step: 5 },
  received:  { l: 'ได้รับเงินสินไหมแล้ว',  pill: 'ok',      step: 6 },
  offset:    { l: 'ตัดชำระหนี้แล้ว',       pill: 'ok',      step: 7 },
  refunded:  { l: 'คืนเงินแล้ว',          pill: 'ok',      step: 8 },
  closed:    { l: 'ปิดรายการ',            pill: 'neutral', step: 9 },
};
window.crStatus = (k) => window.CR_STATUS[k] || { l: k, pill: 'neutral', step: 0 };

window.CR_ORG_UNITS = [
  'ฝ่ายสินเชื่อ', 'ฝ่ายทะเบียนสมาชิก', 'ฝ่ายการเงิน', 'ฝ่ายสวัสดิการ', 'งานประกันสมาชิก',
];

window.CR_RELATIONS = ['คู่สมรส', 'บุตร', 'บิดา', 'มารดา', 'พี่น้อง', 'ทายาทโดยธรรม', 'อื่น ๆ'];

window.CR_BANKS = [
  { v: 'ktb',  l: 'ธ.กรุงไทย' },
  { v: 'baac', l: 'ธ.ก.ส.' },
  { v: 'scb',  l: 'ธ.ไทยพาณิชย์' },
  { v: 'kbank',l: 'ธ.กสิกรไทย' },
  { v: 'bbl',  l: 'ธ.กรุงเทพ' },
  { v: 'gsb',  l: 'ธ.ออมสิน' },
];
window.crBankLabel = (v) => (window.CR_BANKS.find(b => b.v === v) || {}).l || v;

window.CR_DEATH_CAUSES = [
  'เจ็บป่วย / โรคประจำตัว', 'อุบัติเหตุ', 'ชราภาพ', 'โรคติดต่อ', 'อื่น ๆ',
];

// สถานะเอกสารประกอบ
window.CR_DOC_STATUS = {
  none:     { l: 'ยังไม่ได้รับ',  pill: 'neutral' },
  received: { l: 'ได้รับแล้ว',    pill: 'info' },
  review:   { l: 'รอตรวจสอบ',    pill: 'warn' },
  invalid:  { l: 'ไม่ถูกต้อง',    pill: 'bad' },
  complete: { l: 'ครบถ้วน',      pill: 'ok' },
};
window.crDocTag = (k) => window.CR_DOC_STATUS[k] || { l: k, pill: 'neutral' };

// สถานะตรวจสอบผู้รับผลประโยชน์
window.CR_BEN_DOC = {
  pending:  { l: 'รอตรวจสอบ', pill: 'warn' },
  complete: { l: 'ตรวจแล้ว',  pill: 'ok' },
  missing:  { l: 'เอกสารขาด', pill: 'bad' },
};

// เอกสารประกอบมาตรฐาน (แม่แบบตอนสร้างคำขอใหม่)
window.CR_DOC_TEMPLATE = [
  { type: 'แบบฟอร์มทะเบียนขอสินไหมประกัน', required: true },
  { type: 'ใบมรณบัตร', required: true },
  { type: 'สำเนาบัตรประชาชนสมาชิก', required: true },
  { type: 'สำเนาทะเบียนบ้านสมาชิก', required: true },
  { type: 'สำเนาบัตรประชาชนผู้รับผลประโยชน์', required: true },
  { type: 'สำเนาทะเบียนบ้านผู้รับผลประโยชน์', required: false },
  { type: 'สำเนาหน้าบัญชีธนาคาร', required: false },
  { type: 'หนังสือรับรองการเป็นผู้รับผลประโยชน์', required: false },
  { type: 'เอกสารประกอบจากบริษัทประกัน', required: false },
];

// สถานะสัญญาเงินกู้
window.CR_CONTRACT_STATUS = {
  normal:   { l: 'ปกติ',      pill: 'ok' },
  overdue:  { l: 'ค้างชำระ',   pill: 'warn' },
  closed:   { l: 'ปิดสัญญา',   pill: 'neutral' },
  litigate: { l: 'ฟ้องคดี',    pill: 'bad' },
  transfer: { l: 'โอนหนี้',    pill: 'bad' },
};
window.crContractTag = (k) => window.CR_CONTRACT_STATUS[k] || { l: k, pill: 'neutral' };

// ─── ข้อมูลหนี้คงเหลือรายสมาชิก (ดึงจากระบบเงินกู้/ทะเบียนหนี้) ─────────
//  key = รหัสสมาชิก · เฉพาะสัญญาที่ยังมีภาระหนี้คงเหลือ
window.CR_DEBTS = {
  'M-058241': [
    { no: 'LN-2565-004821', type: 'เงินกู้สามัญ',  principal: 284500, interest: 4120, penalty: 0,    status: 'normal' },
    { no: 'LN-2567-011204', type: 'เงินกู้ฉุกเฉิน', principal: 42000,  interest: 315,  penalty: 0,    status: 'normal' },
  ],
  'M-058251': [
    { no: 'LN-2566-008113', type: 'เงินกู้พิเศษ',  principal: 512000, interest: 9840, penalty: 1500, status: 'overdue' },
  ],
  'M-058249': [
    { no: 'LN-2564-002210', type: 'เงินกู้สามัญ',  principal: 96000,  interest: 2100, penalty: 800,  status: 'litigate' },
  ],
  'M-047003': [],
  'M-058244': [
    { no: 'LN-2568-014400', type: 'เงินกู้ฉุกเฉิน', principal: 18500,  interest: 90,   penalty: 0,    status: 'normal' },
  ],
  'M-058243': [
    { no: 'LN-2567-010982', type: 'เงินกู้สามัญ',  principal: 1450000, interest: 21800, penalty: 0,   status: 'normal' },
  ],
};
window.crDebtsOf = (code) => (window.CR_DEBTS[code] || []).map(d => ({ ...d, total: d.principal + d.interest + d.penalty }));

// ─── Helper: อายุ ณ วันที่เสียชีวิต (ปี) ────────────────────────────────
window.crAgeAt = (birth, death) => {
  if (!birth || !death) return null;
  const b = new Date(birth + 'T00:00:00'), d = new Date(death + 'T00:00:00');
  if (isNaN(b) || isNaN(d)) return null;
  let a = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--;
  return a;
};

// ─── Helper: สถานะความคุ้มครองของกรมธรรม์ ณ วันเสียชีวิต ────────────────
window.crCoverageStatus = (policy, deathDate) => {
  if (!policy) return { key: 'nopolicy', l: 'ไม่พบข้อมูลประกัน', pill: 'bad' };
  if (policy.coverageStatus === 'cancelled') return { key: 'cancelled', l: 'กรมธรรม์ถูกยกเลิก', pill: 'bad' };
  if (!deathDate) return { key: 'wait', l: 'รอตรวจสอบข้อมูล', pill: 'warn' };
  const d = new Date(deathDate + 'T00:00:00');
  const s = new Date(policy.startDate + 'T00:00:00');
  const e = new Date(policy.endDate + 'T00:00:00');
  if (d < s) return { key: 'before', l: 'ยังไม่เริ่มคุ้มครอง', pill: 'bad' };
  if (d > e) return { key: 'expired', l: 'พ้นระยะคุ้มครอง', pill: 'bad' };
  return { key: 'covered', l: 'อยู่ในความคุ้มครอง', pill: 'ok' };
};

// ─── Helper: สรุปยอดสินไหม/หนี้/คงเหลือ ─────────────────────────────────
//  actual = ยอดสินไหมที่ได้รับจริง (0 ถ้ายังไม่ได้รับ) · offsetTotal = ยอดตัดชำระรวม
window.crFinance = (actual, offsetTotal) => {
  const a = Number(actual) || 0, o = Number(offsetTotal) || 0;
  const refund = Math.max(0, a - o);
  const shortfall = Math.max(0, o - a);
  let statusKey, statusLabel, tone;
  if (a === 0)          { statusKey = 'pending';  statusLabel = 'ยังไม่ได้รับเงินสินไหม'; tone = 'neutral'; }
  else if (refund > 0)  { statusKey = 'refund';   statusLabel = 'มียอดคงเหลือต้องคืน';    tone = 'ok'; }
  else if (shortfall>0) { statusKey = 'shortfall';statusLabel = 'มียอดขาดต้องติดตาม';     tone = 'bad'; }
  else                  { statusKey = 'even';     statusLabel = 'ตัดชำระครบ ไม่มีเงินคืน'; tone = 'info'; }
  return { actual: a, offsetTotal: o, refund, shortfall, statusKey, statusLabel, tone };
};

// ─── เลขที่คำขอถัดไป ──────────────────────────────────────────────────
window.crNextNo = (list) => {
  const year = 2569;
  const seq = list.reduce((mx, r) => {
    const m = String(r.id || '').match(/CLM-(\d{4})-(\d{4})/);
    return m && Number(m[1]) === year ? Math.max(mx, Number(m[2])) : mx;
  }, 0);
  return `CLM-${year}-${String(seq + 1).padStart(4, '0')}`;
};

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลตั้งต้นทะเบียนคำขอสินไหม (seed) — ครอบคลุมหลายสถานะ
// ════════════════════════════════════════════════════════════════════
window.CR_SEED = [
  {
    id: 'CLM-2569-0031', reqDate: '2026-05-20', sentDate: '2026-05-26', reqType: 'death',
    status: 'received', orgUnit: 'งานประกันสมาชิก', enteredBy: 'จันทร์เพ็ญ มาลี', note: '',
    memberCode: 'M-058241', policyId: 'PL-58241-1',
    death: { date: '2026-04-18', cause: 'เจ็บป่วย / โรคประจำตัว', place: 'โรงพยาบาลกรุงเทพ',
             certNo: 'มบ.6912-0451', certDate: '2026-04-21', issuer: 'สนง.เขตราชเทวี' },
    estimate: 1500000, actual: 1500000,
    beneficiaries: [
      { name: 'นางวิภา ใจดี รักษ์ออม', relation: 'คู่สมรส', citizenId: '3-1019-00822-11-0', phone: '081-234-5678',
        bank: 'ktb', accountNo: '019-1-45521-8', pct: 100, docStatus: 'complete' },
    ],
    debts: [
      { no: 'LN-2565-004821', type: 'เงินกู้สามัญ',  principal: 284500, interest: 4120, penalty: 0, status: 'normal', offset: 288620 },
      { no: 'LN-2567-011204', type: 'เงินกู้ฉุกเฉิน', principal: 42000,  interest: 315,  penalty: 0, status: 'normal', offset: 42315 },
    ],
    docs: [
      { type: 'แบบฟอร์มทะเบียนขอสินไหมประกัน', required: true, status: 'complete', recvDate: '2026-05-20', checker: 'จันทร์เพ็ญ มาลี', file: 'claim-form-0031.pdf', note: '' },
      { type: 'ใบมรณบัตร', required: true, status: 'complete', recvDate: '2026-05-20', checker: 'จันทร์เพ็ญ มาลี', file: 'death-cert.pdf', note: '' },
      { type: 'สำเนาบัตรประชาชนสมาชิก', required: true, status: 'complete', recvDate: '2026-05-20', checker: 'จันทร์เพ็ญ มาลี', file: 'id-member.pdf', note: '' },
      { type: 'สำเนาทะเบียนบ้านสมาชิก', required: true, status: 'complete', recvDate: '2026-05-20', checker: 'จันทร์เพ็ญ มาลี', file: 'house-member.pdf', note: '' },
      { type: 'สำเนาบัตรประชาชนผู้รับผลประโยชน์', required: true, status: 'complete', recvDate: '2026-05-20', checker: 'จันทร์เพ็ญ มาลี', file: 'id-ben.pdf', note: '' },
      { type: 'สำเนาหน้าบัญชีธนาคาร', required: false, status: 'complete', recvDate: '2026-05-20', checker: 'จันทร์เพ็ญ มาลี', file: 'bankbook.pdf', note: '' },
    ],
    history: [
      { date: '2026-05-20', status: 'draft',     detail: 'บันทึกร่างคำขอ',        by: 'จันทร์เพ็ญ มาลี', note: '' },
      { date: '2026-05-22', status: 'ready',     detail: 'ตรวจสอบเอกสารครบถ้วน',   by: 'อนุวัฒน์ ใจดี',  note: '' },
      { date: '2026-05-26', status: 'sent',      detail: 'ส่งเรื่องให้บริษัทประกัน', by: 'อนุวัฒน์ ใจดี',  note: 'ไทยสมุทรประกันชีวิต' },
      { date: '2026-06-24', status: 'approved',  detail: 'บริษัทประกันอนุมัติ',    by: 'ระบบ',           note: 'อนุมัติเต็มวงเงิน' },
      { date: '2026-06-30', status: 'received',  detail: 'ได้รับเงินสินไหม',       by: 'สุภาพร การเงิน', note: '฿1,500,000.00' },
    ],
  },
  {
    id: 'CLM-2569-0034', reqDate: '2026-05-25', sentDate: '', reqType: 'death',
    status: 'docmiss', orgUnit: 'งานประกันสมาชิก', enteredBy: 'อนุวัฒน์ ใจดี', note: 'รอสำเนาบัตร/ทะเบียนบ้านบุตร',
    memberCode: 'M-058251', policyId: 'PL-58251-1',
    death: { date: '2026-05-18', cause: 'เจ็บป่วย / โรคประจำตัว', place: 'ที่พักอาศัย',
             certNo: 'มบ.6912-0588', certDate: '2026-05-20', issuer: 'สนง.เขตบางเขน' },
    estimate: 600000, actual: 0,
    beneficiaries: [
      { name: 'นางสาวพิมพ์ใจ รัตนา', relation: 'บุตร', citizenId: '', phone: '089-771-2200',
        bank: 'scb', accountNo: '', pct: 100, docStatus: 'missing' },
    ],
    debts: [
      { no: 'LN-2566-008113', type: 'เงินกู้พิเศษ', principal: 512000, interest: 9840, penalty: 1500, status: 'overdue', offset: 523340 },
    ],
    docs: [
      { type: 'แบบฟอร์มทะเบียนขอสินไหมประกัน', required: true, status: 'complete', recvDate: '2026-05-25', checker: 'อนุวัฒน์ ใจดี', file: 'claim-form-0034.pdf', note: '' },
      { type: 'ใบมรณบัตร', required: true, status: 'complete', recvDate: '2026-05-25', checker: 'อนุวัฒน์ ใจดี', file: 'death-cert.pdf', note: '' },
      { type: 'สำเนาบัตรประชาชนสมาชิก', required: true, status: 'complete', recvDate: '2026-05-25', checker: 'อนุวัฒน์ ใจดี', file: 'id-member.pdf', note: '' },
      { type: 'สำเนาทะเบียนบ้านสมาชิก', required: true, status: 'received', recvDate: '2026-05-25', checker: '', file: 'house-member.pdf', note: 'รอตรวจสอบ' },
      { type: 'สำเนาบัตรประชาชนผู้รับผลประโยชน์', required: true, status: 'none', recvDate: '', checker: '', file: '', note: 'ยังไม่ได้รับจากบุตร' },
    ],
    history: [
      { date: '2026-05-25', status: 'draft',    detail: 'บันทึกร่างคำขอ',      by: 'อนุวัฒน์ ใจดี', note: '' },
      { date: '2026-05-27', status: 'docmiss',  detail: 'ตรวจสอบเอกสาร — ไม่ครบ', by: 'อนุวัฒน์ ใจดี', note: 'ขาดเอกสารผู้รับผลประโยชน์' },
    ],
  },
  {
    id: 'CLM-2569-0028', reqDate: '2026-02-20', sentDate: '2026-02-24', reqType: 'death',
    status: 'closed', orgUnit: 'งานประกันสมาชิก', enteredBy: 'จันทร์เพ็ญ มาลี', note: '',
    memberCode: 'M-047003', policyId: 'PL-47003-1',
    death: { date: '2026-02-10', cause: 'ชราภาพ', place: 'โรงพยาบาลจุฬาฯ',
             certNo: 'มบ.6902-0122', certDate: '2026-02-12', issuer: 'สนง.เขตปทุมวัน' },
    estimate: 1000000, actual: 1000000,
    beneficiaries: [
      { name: 'นางสมใจ จันทร์ดี', relation: 'คู่สมรส', citizenId: '3-1099-00235-01-1', phone: '086-002-1188',
        bank: 'bbl', accountNo: '145-4-88210-9', pct: 100, docStatus: 'complete' },
    ],
    debts: [],
    docs: [
      { type: 'แบบฟอร์มทะเบียนขอสินไหมประกัน', required: true, status: 'complete', recvDate: '2026-02-18', checker: 'จันทร์เพ็ญ มาลี', file: 'claim-form.pdf', note: '' },
      { type: 'ใบมรณบัตร', required: true, status: 'complete', recvDate: '2026-02-18', checker: 'จันทร์เพ็ญ มาลี', file: 'death-cert.pdf', note: '' },
      { type: 'สำเนาบัตรประชาชนสมาชิก', required: true, status: 'complete', recvDate: '2026-02-18', checker: 'จันทร์เพ็ญ มาลี', file: 'id.pdf', note: '' },
      { type: 'สำเนาบัตรประชาชนผู้รับผลประโยชน์', required: true, status: 'complete', recvDate: '2026-02-18', checker: 'จันทร์เพ็ญ มาลี', file: 'id-ben.pdf', note: '' },
    ],
    history: [
      { date: '2026-02-20', status: 'draft',    detail: 'บันทึกร่างคำขอ',      by: 'จันทร์เพ็ญ มาลี', note: '' },
      { date: '2026-02-24', status: 'sent',     detail: 'ส่งเรื่องให้บริษัทประกัน', by: 'อนุวัฒน์ ใจดี', note: '' },
      { date: '2026-03-30', status: 'approved', detail: 'บริษัทประกันอนุมัติ',   by: 'ระบบ',          note: '' },
      { date: '2026-04-02', status: 'received', detail: 'ได้รับเงินสินไหม',      by: 'สุภาพร การเงิน', note: '฿1,000,000.00' },
      { date: '2026-04-05', status: 'refunded', detail: 'คืนเงินให้ผู้รับผลประโยชน์', by: 'สุภาพร การเงิน', note: 'ไม่มีหนี้ · คืนเต็มจำนวน' },
      { date: '2026-04-08', status: 'closed',   detail: 'ปิดรายการ',            by: 'หัวหน้างานประกัน', note: '' },
    ],
  },
];

// ─── โหลด/บันทึก localStorage ─────────────────────────────────────────
window.crLoad = () => {
  try { const s = localStorage.getItem('claim_register'); if (s) return JSON.parse(s); } catch (e) {}
  return window.CR_SEED.map(r => JSON.parse(JSON.stringify(r)));
};
window.crSave = (list) => { try { localStorage.setItem('claim_register', JSON.stringify(list)); } catch (e) {} };
