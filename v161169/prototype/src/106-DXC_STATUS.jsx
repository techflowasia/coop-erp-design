// ════════════════════════════════════════════════════════════════════
//  ระบบสวัสดิการ — ขอสินไหมกรณีสมาชิกเสียชีวิต (Death Benefit / Insurance Claim)
//  เงินสินไหม/เงินสงเคราะห์เมื่อสมาชิกถึงแก่กรรม
//    · ตรวจสอบสิทธิ · หักกลบหนี้คงค้าง · แบ่งสัดส่วนผู้รับผลประโยชน์ (รวม 100%)
// ════════════════════════════════════════════════════════════════════

// ─── สถานะคำขอ ────────────────────────────────────────────────────────
window.DXC_STATUS = {
  submitted: { l: 'รออนุมัติ',   pill: 'warn',    step: 1 },
  approved:  { l: 'อนุมัติแล้ว',  pill: 'info',    step: 2 },
  paid:      { l: 'จ่ายแล้ว',     pill: 'ok',      step: 3 },
  rejected:  { l: 'ไม่อนุมัติ',   pill: 'bad',     step: 0 },
};
window.dxcStatus = (v) => window.DXC_STATUS[v] || window.DXC_STATUS.submitted;

// ─── ประเภทสวัสดิการ (แสดง/ซ่อนส่วนข้อมูลตามที่เลือก) ───────────────────
window.DXC_WELFARE_TYPES = [
  { v: 'death', l: 'เงินสงเคราะห์สมาชิกเสียชีวิต' },
];

// ─── สาเหตุการเสียชีวิต ────────────────────────────────────────────────
window.DXC_CAUSES = ['เจ็บป่วย / โรคประจำตัว', 'ชราภาพ', 'อุบัติเหตุ', 'โรคติดเชื้อ', 'อื่น ๆ'];
window.dxcIsAccident = (cause) => (cause || '').indexOf('อุบัติเหตุ') >= 0;

// ─── ความสัมพันธ์กับสมาชิก ─────────────────────────────────────────────
window.DXC_RELATIONS = [
  'คู่สมรส', 'บุตร', 'บิดา', 'มารดา', 'พี่ / น้อง',
  'ผู้รับผลประโยชน์ตามหนังสือแต่งตั้ง', 'ผู้รับมอบอำนาจ', 'อื่น ๆ',
];

// ─── ธนาคาร ────────────────────────────────────────────────────────────
window.DXC_BANKS = [
  { v: 'ktb',   l: 'ธ.กรุงไทย' },
  { v: 'baac',  l: 'ธ.ก.ส.' },
  { v: 'gsb',   l: 'ธ.ออมสิน' },
  { v: 'scb',   l: 'ธ.ไทยพาณิชย์' },
  { v: 'kbank', l: 'ธ.กสิกรไทย' },
  { v: 'bbl',   l: 'ธ.กรุงเทพ' },
];
window.dxcBankLabel = (v) => (window.DXC_BANKS.find(b => b.v === v) || {}).l || (v || '—');

// ─── วิธีรับเงิน ────────────────────────────────────────────────────────
window.DXC_PAY_METHODS = [
  { v: 'transfer', l: 'โอนเข้าบัญชี' },
  { v: 'cheque',   l: 'เช็ค' },
  { v: 'cash',     l: 'เงินสด' },
];
window.dxcPayLabel = (v) => (window.DXC_PAY_METHODS.find(p => p.v === v) || {}).l || (v || '—');

// ─── สถานะเอกสารผู้รับผลประโยชน์ ───────────────────────────────────────
window.DXC_DOCSTATUS = [
  { v: 'complete', l: 'ครบถ้วน',    pill: 'ok' },
  { v: 'partial',  l: 'ไม่ครบถ้วน', pill: 'warn' },
];

// ─── ช่วงเวลา (ปี ทศนิยม) ระหว่างสองวันที่ ──────────────────────────────
window.dxcYearsBetween = (from, to) => {
  if (!from || !to) return 0;
  const a = new Date(from), b = new Date(to);
  return Math.max(0, (b - a) / (365.25 * 86400000));
};
// ป้ายอายุสมาชิก "X ปี Y เดือน"
window.dxcYMLabel = (from, to) => {
  if (!from || !to) return '—';
  const a = new Date(from), b = new Date(to);
  if (b < a) return '—';
  let y = b.getFullYear() - a.getFullYear();
  let m = b.getMonth() - a.getMonth();
  if (b.getDate() < a.getDate()) m -= 1;
  if (m < 0) { y -= 1; m += 12; }
  return `${y} ปี ${m} เดือน`;
};
// อายุ (ปีเต็ม) ณ วันที่กำหนด
window.dxcAgeAt = (birth, at) => {
  if (!birth || !at) return null;
  const a = new Date(birth), b = new Date(at);
  let y = b.getFullYear() - a.getFullYear();
  if (b < new Date(b.getFullYear(), a.getMonth(), a.getDate())) y -= 1;
  return y < 0 ? null : y;
};

// ─── วันเกิดสังเคราะห์ (mock — ทะเบียนสมาชิกไม่มี birthDate) ─────────────
//  สร้างค่าคงที่ต่อสมาชิกเพื่อให้ช่องแสดงข้อมูลจริง (เจ้าหน้าที่แก้ไขได้)
window.dxcSynthBirth = (member) => {
  if (!member) return '';
  if (member.birthDate) return member.birthDate;
  const n = parseInt(String(member.code).replace(/\D/g, '').slice(-4), 10) || 0;
  const join = member.joinDate ? new Date(member.joinDate).getFullYear() : 2000;
  const birthYear = join - 26 - (n % 14);          // อายุเข้าเป็นสมาชิก ~26–40 ปี
  const mm = String((n % 12) + 1).padStart(2, '0');
  const dd = String((n % 27) + 1).padStart(2, '0');
  return `${birthYear}-${mm}-${dd}`;
};

// ─── อัตราเงินสินไหมตามอายุสมาชิก + โบนัสอุบัติเหตุ ──────────────────────
//  ตามระเบียบ: <1 ปี = ไม่มีสิทธิ · 1–5 ปี = 50,000 · >5 ปี = 100,000
window.dxcBenefitRate = (memberYears, cause) => {
  let base = 0, tier = '';
  if (memberYears == null) { return { base: 0, accidentBonus: 0, gross: 0, tier: 'ยังไม่ระบุวันที่เสียชีวิต' }; }
  if (memberYears < 1)       { base = 0;      tier = 'เป็นสมาชิกไม่ถึง 1 ปี'; }
  else if (memberYears <= 5) { base = 50000;  tier = 'เป็นสมาชิก 1–5 ปี'; }
  else                       { base = 100000; tier = 'เป็นสมาชิกมากกว่า 5 ปี'; }
  const accidentBonus = (base > 0 && window.dxcIsAccident(cause)) ? 50000 : 0;
  return { base, accidentBonus, gross: base + accidentBonus, tier };
};

// ─── ตรวจสอบสิทธิรับสินไหม ─────────────────────────────────────────────
window.dxcEligibility = ({ status, memberYears }) => {
  const reasons = [];
  if (memberYears == null) reasons.push('ยังไม่ระบุวันที่เสียชีวิต — ตรวจสอบสิทธิไม่ได้');
  else if (memberYears < 1) reasons.push('อายุสมาชิกไม่ถึงเกณฑ์ที่กำหนด (ต้องเป็นสมาชิกอย่างน้อย 1 ปี)');
  if (status === 'ลาออก' || status === 'พ้นสภาพ' || status === 'ให้ออก')
    reasons.push('สมาชิกพ้นสภาพก่อนวันที่เสียชีวิต');
  return { ok: reasons.length === 0, reasons };
};

// ─── ยอดหักกลบหนี้คงค้าง (mock จากยอดหนี้สมาชิก) ────────────────────────
window.dxcDebtBreakdown = (member) => {
  const principal = member ? Number(member.loans || 0) : 0;
  const interest = Math.round(principal * 0.0125 / 10) * 10;   // ดอกเบี้ยค้างชำระโดยประมาณ
  const penalty = 0;
  return { principal, interest, penalty, total: principal + interest + penalty };
};

// ─── รายละเอียดสัญญาเงินกู้/หุ้น (mock สำหรับป็อปอัป "ดูรายละเอียดหุ้น-หนี้") ─
window.dxcContracts = (member) => {
  if (!member || !Number(member.loans)) return [];
  const total = Number(member.loans);
  const n = Math.max(1, Number(member.loanCount) || 1);
  const rows = [];
  let remain = total;
  for (let i = 0; i < n; i++) {
    const bal = i === n - 1 ? remain : Math.round(total / n / 1000) * 1000;
    remain -= bal;
    rows.push({
      no: `L-${String(member.code).replace(/\D/g, '').slice(-4)}-${String(i + 1).padStart(2, '0')}`,
      type: ['เงินกู้สามัญ', 'เงินกู้ฉุกเฉิน', 'เงินกู้พิเศษ'][i % 3],
      principal: bal,
      interest: Math.round(bal * 0.0125 / 10) * 10,
    });
  }
  return rows;
};

// ─── เลขที่คำขอ ─────────────────────────────────────────────────────────
window.dxcNextNo = (list, year) => {
  const yr = String(year || 2569);
  const head = `SH-${yr}`;
  const nums = (list || []).filter(r => String(r.id).startsWith(head + '-'))
    .map(r => parseInt(String(r.id).split('-')[2], 10) || 0);
  return `${head}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0')}`;
};

// ─── ยอดสุทธิ + หนี้คงเหลือหลังหักกลบ ──────────────────────────────────
window.dxcNet = (gross, debtTotal) => Math.max(0, (gross || 0) - (debtTotal || 0));
window.dxcDebtRemain = (gross, debtTotal) => Math.max(0, (debtTotal || 0) - (gross || 0));

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลตั้งต้น (seed)
// ════════════════════════════════════════════════════════════════════
window.DXC_SEED = [
  {
    id: 'SH-2569-0003', reqDate: '2026-06-18', enteredBy: 'จันทร์เพ็ญ มาลี', welfareType: 'death',
    member: { code: 'M-058247', name: 'นายวีรชัย พิทักษ์ธรรม', citizenId: '5-1099-00021-11-9',
      dept: 'กองการคลัง', memberType: 'สมาชิกถาวร', status: 'เกษียณ', joinDate: '1998-05-12', birthDate: '1958-03-09' },
    death: { date: '2026-06-10', cause: 'ชราภาพ', place: 'โรงพยาบาลนนทบุรี', certNo: 'มบ.6810-0442',
      certDate: '2026-06-12', age: 68, memberYears: 28.08 },
    applicant: { name: 'นางสุนีย์ พิทักษ์ธรรม', relation: 'คู่สมรส', citizenId: '3-1099-00087-23-5',
      phone: '081-234-5678', address: '99/12 ถ.ติวานนท์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
      payMethod: 'transfer', bank: 'ktb', accountNo: '142-0-55821-9', accountName: 'นางสุนีย์ พิทักษ์ธรรม' },
    benefit: { base: 100000, accidentBonus: 0, gross: 100000, tier: 'เป็นสมาชิกมากกว่า 5 ปี' },
    debt: { principal: 0, interest: 0, penalty: 0, total: 0 }, net: 100000,
    beneficiaries: [
      { name: 'นางสุนีย์ พิทักษ์ธรรม', relation: 'คู่สมรส', citizenId: '3-1099-00087-23-5', pct: 50,
        payMethod: 'transfer', bank: 'ktb', accountNo: '142-0-55821-9', docStatus: 'complete' },
      { name: 'นายพิชัย พิทักษ์ธรรม', relation: 'บุตร', citizenId: '1-1099-00521-44-2', pct: 25,
        payMethod: 'transfer', bank: 'scb', accountNo: '405-1-22087-0', docStatus: 'complete' },
      { name: 'นางสาวพิมพ์ใจ พิทักษ์ธรรม', relation: 'บุตร', citizenId: '1-1099-00521-45-0', pct: 25,
        payMethod: 'transfer', bank: 'kbank', accountNo: '018-8-71120-3', docStatus: 'partial' },
    ],
    eligibility: { ok: true, reasons: [], special: false, specialReason: '' },
    attachments: ['ใบมรณบัตร.pdf', 'สำเนาบัตรผู้ยื่นคำขอ.pdf', 'ทะเบียนบ้าน.pdf'],
    approval: { approver: '—', approveDate: '', note: '' },
    status: 'submitted',
  },
  {
    id: 'SH-2569-0002', reqDate: '2026-06-05', enteredBy: 'จันทร์เพ็ญ มาลี', welfareType: 'death',
    member: { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', citizenId: '3-1018-00112-87-4',
      dept: 'กองช่าง', memberType: 'สมาชิกถาวร', status: 'ปฏิบัติงาน', joinDate: '2005-09-15', birthDate: '1972-07-21' },
    death: { date: '2026-05-28', cause: 'อุบัติเหตุ', place: 'ถนนพระราม 6 กรุงเทพฯ', certNo: 'มบ.6805-1189',
      certDate: '2026-05-30', age: 53, memberYears: 20.7 },
    applicant: { name: 'นางกนกวรรณ สุขสวัสดิ์', relation: 'คู่สมรส', citizenId: '3-1018-00230-11-8',
      phone: '089-887-1200', address: '45 ถ.พระราม 6 แขวงพญาไท เขตพญาไท กรุงเทพฯ 10400',
      payMethod: 'transfer', bank: 'baac', accountNo: '020-2-98771-4', accountName: 'นางกนกวรรณ สุขสวัสดิ์' },
    benefit: { base: 100000, accidentBonus: 50000, gross: 150000, tier: 'เป็นสมาชิกมากกว่า 5 ปี' },
    debt: { principal: 820000, interest: 10250, penalty: 0, total: 830250 }, net: 0,
    beneficiaries: [
      { name: 'นางกนกวรรณ สุขสวัสดิ์', relation: 'คู่สมรส', citizenId: '3-1018-00230-11-8', pct: 100,
        payMethod: 'transfer', bank: 'baac', accountNo: '020-2-98771-4', docStatus: 'complete' },
    ],
    eligibility: { ok: true, reasons: [], special: false, specialReason: '' },
    attachments: ['ใบมรณบัตร.pdf', 'บันทึกประจำวันตำรวจ.pdf'],
    approval: { approver: 'สมศักดิ์ ธำรงชัย', approveDate: '2026-06-12', note: 'หนี้คงค้างมากกว่าสิทธิ — หักกลบเต็มจำนวน ยอดรับสุทธิ 0 บาท' },
    status: 'approved',
  },
  {
    id: 'SH-2569-0001', reqDate: '2026-05-20', enteredBy: 'จันทร์เพ็ญ มาลี', welfareType: 'death',
    member: { code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', citizenId: '3-1019-00482-19-2',
      dept: 'กองคลัง สำนักงานปลัด', memberType: 'สมาชิกถาวร', status: 'ปฏิบัติงาน', joinDate: '2015-02-22', birthDate: '1979-11-04' },
    death: { date: '2026-05-10', cause: 'เจ็บป่วย / โรคประจำตัว', place: 'โรงพยาบาลศิริราช', certNo: 'มบ.6805-0071',
      certDate: '2026-05-11', age: 46, memberYears: 11.22 },
    applicant: { name: 'นายสมพงษ์ จันทร์เพ็ญ', relation: 'คู่สมรส', citizenId: '3-1019-00120-55-1',
      phone: '086-554-7781', address: '12/4 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000',
      payMethod: 'cheque', bank: '', accountNo: '', accountName: 'นายสมพงษ์ จันทร์เพ็ญ' },
    benefit: { base: 100000, accidentBonus: 0, gross: 100000, tier: 'เป็นสมาชิกมากกว่า 5 ปี' },
    debt: { principal: 91200, interest: 1140, penalty: 0, total: 92340 }, net: 7660,
    beneficiaries: [
      { name: 'นายสมพงษ์ จันทร์เพ็ญ', relation: 'คู่สมรส', citizenId: '3-1019-00120-55-1', pct: 60,
        payMethod: 'cheque', bank: '', accountNo: '', docStatus: 'complete' },
      { name: 'ด.ช.กิตติพงษ์ จันทร์เพ็ญ', relation: 'บุตร', citizenId: '1-1019-00921-33-7', pct: 40,
        payMethod: 'transfer', bank: 'gsb', accountNo: '020-1-33087-9', docStatus: 'complete' },
    ],
    eligibility: { ok: true, reasons: [], special: false, specialReason: '' },
    attachments: ['ใบมรณบัตร.pdf', 'สำเนาบัตรผู้ยื่นคำขอ.pdf', 'ทะเบียนสมรส.pdf', 'สูติบัตรบุตร.pdf'],
    approval: { approver: 'สมศักดิ์ ธำรงชัย', approveDate: '2026-05-24', note: '' },
    status: 'paid',
  },
];
