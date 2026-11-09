// ════════════════════════════════════════════════════════════════════
//  ระบบงานสวัสดิการสมาชิก — เงินสงเคราะห์สมาชิก
//  หน้าจอเดียว · แสดงกลุ่ม Field ตามประเภทสวัสดิการที่เลือก
//    • กลุ่มเสียชีวิต (death)     → รายละเอียดผู้เสียชีวิต (+ผู้รับเงิน กรณีสมาชิก)
//    • กลุ่มภัยพิบัติ (disaster)  → รายละเอียดภัยพิบัติ + บ้านที่ประสบภัย
//    • กลุ่มทุพพลภาพ (disability) → รายละเอียดทุพพลภาพ
//    • สวัสดิการทั่วไป (general)  → รายละเอียดคำขอทั่วไป
// ════════════════════════════════════════════════════════════════════

// ── สวัสดิการ (Dropdown ระดับบน) → หมวด (cat) คุมการแสดงกลุ่ม Field ───
window.RELIEF_WELFARES = [
  { code: 'DEATH',    cat: 'death',      name: 'เงินสงเคราะห์สมาชิก (กรณีเสียชีวิต)' },
  { code: 'DISASTER', cat: 'disaster',   name: 'สวัสดิการภัยพิบัติ' },
  { code: 'DISAB',    cat: 'disability', name: 'สวัสดิการทุพพลภาพ' },
  { code: 'GENERAL',  cat: 'general',    name: 'สวัสดิการทั่วไป' },
];
window.reliefWelfareName = (code) => {
  const w = window.RELIEF_WELFARES.find(x => x.code === code);
  return w ? w.name : '';
};
window.RELIEF_WELFARE_NAME = 'เงินสงเคราะห์สมาชิก (กรณีเสียชีวิต)';

// ── ประเภทย่อยของแต่ละสวัสดิการ + ฐานสิทธิ ────────────────────────────
//  member:true → คิดสิทธิตามอายุการเป็นสมาชิก (RELIEF_MEMBER_TIERS)
//  byDamage:true → คิดสิทธิตามระดับความเสียหาย (RELIEF_DAMAGE_LEVELS)
//  manual:true → ยอดสิทธิกำหนดโดยผู้ขอ/ผู้อนุมัติ (สวัสดิการทั่วไป)
window.RELIEF_TYPES_BY_WELFARE = {
  DEATH: [
    { code: '4001', label: 'สมาชิกเสียชีวิต', relation: 'สมาชิก',  base: 0,     member: true,  memberDeath: true },
    { code: '4002', label: 'บิดาเสียชีวิต',    relation: 'บิดา',    base: 30000, member: false },
    { code: '4003', label: 'มารดาเสียชีวิต',   relation: 'มารดา',   base: 30000, member: false },
    { code: '4004', label: 'คู่สมรสเสียชีวิต', relation: 'คู่สมรส', base: 30000, member: false },
    { code: '4005', label: 'บุตรเสียชีวิต',    relation: 'บุตร',    base: 20000, member: false, child: true },
  ],
  DISASTER: [
    { code: '2011', label: 'อุทกภัย (เจ้าของบ้าน)', kind: 'อุทกภัย', base: 5000, byDamage: true, ownerOnly: true },
    { code: '2012', label: 'อัคคีภัย',              kind: 'อัคคีภัย', base: 5000, byDamage: true },
    { code: '2013', label: 'วาตภัย',                kind: 'วาตภัย',   base: 5000, byDamage: true },
    { code: '2014', label: 'ภัยพิบัติอื่น ๆ',        kind: 'อื่น ๆ',   base: 5000, byDamage: true, other: true, special: true },
  ],
  DISAB: [
    { code: '5001', label: 'ทุพพลภาพบางส่วน', dtype: 'บางส่วน',  base: 15000, member: false },
    { code: '5002', label: 'ทุพพลภาพถาวร',    dtype: 'ถาวร',     base: 50000, member: false, oneTime: true },
    { code: '5003', label: 'ทุพพลภาพชั่วคราว', dtype: 'ชั่วคราว', base: 10000, member: false, renew: true },
  ],
  GENERAL: [
    { code: '9001', label: 'สวัสดิการช่วยเหลือพิเศษ',  base: 0, manual: true },
    { code: '9002', label: 'สวัสดิการสงเคราะห์อื่น ๆ',  base: 0, manual: true },
    { code: '9003', label: 'สวัสดิการตามมติกรรมการ',    base: 0, manual: true, special: true },
  ],
};
window.RELIEF_TYPES = Object.values(window.RELIEF_TYPES_BY_WELFARE).flat();
window.reliefTypesOf = (welfareCode) => window.RELIEF_TYPES_BY_WELFARE[welfareCode] || [];
window.reliefWelfareOfType = (code) => {
  for (const [w, list] of Object.entries(window.RELIEF_TYPES_BY_WELFARE)) {
    if (list.some(t => t.code === String(code))) return w;
  }
  return 'DEATH';
};
window.reliefType = (code) => window.RELIEF_TYPES.find(t => t.code === String(code)) || null;
window.reliefCatOf = (welfareCode) => {
  const w = window.RELIEF_WELFARES.find(x => x.code === welfareCode);
  return w ? w.cat : 'death';
};
window.reliefCatOfType = (typeCode) => window.reliefCatOf(window.reliefWelfareOfType(typeCode));

// ── Matrix การแสดงกลุ่ม Field ตามหมวด ────────────────────────────────
//  กลุ่มที่แสดงทุกหมวด: req, member, amount, pay, docs, note
window.RELIEF_GROUPS_BY_CAT = {
  death:      ['deceased'],            // + beneficiary เมื่อ memberDeath
  disaster:   ['disaster', 'house'],
  disability: ['disability'],
  general:    ['general'],
};
window.reliefGroups = (typeCode) => {
  const cat = window.reliefCatOfType(typeCode);
  const t = window.reliefType(typeCode) || {};
  const extra = [...(window.RELIEF_GROUPS_BY_CAT[cat] || [])];
  if (cat === 'death' && t.memberDeath) extra.push('beneficiary');
  return ['req', 'member', ...extra, 'amount', 'pay', 'docs', 'note'];
};
window.reliefHasGroup = (typeCode, g) => window.reliefGroups(typeCode).includes(g);

// ── สิทธิกรณีสมาชิกเสียชีวิต — ตามช่วงอายุการเป็นสมาชิก (ปี) ───────────
window.RELIEF_MEMBER_TIERS = [
  { minYears: 0,  amount: 30000,  label: 'น้อยกว่า 5 ปี' },
  { minYears: 5,  amount: 50000,  label: '5 ปีขึ้นไป' },
  { minYears: 10, amount: 80000,  label: '10 ปีขึ้นไป' },
  { minYears: 15, amount: 120000, label: '15 ปีขึ้นไป' },
  { minYears: 20, amount: 200000, label: '20 ปีขึ้นไป' },
];

// ── ระดับความเสียหาย (ภัยพิบัติ) → ฐานสิทธิ ───────────────────────────
window.RELIEF_DAMAGE_LEVELS = [
  { v: 'light',  l: 'เล็กน้อย',          amount: 3000 },
  { v: 'medium', l: 'ปานกลาง',           amount: 5000 },
  { v: 'severe', l: 'รุนแรง',            amount: 10000 },
  { v: 'total',  l: 'เสียหายทั้งหลัง',    amount: 20000 },
];
// ── ระดับทุพพลภาพ ────────────────────────────────────────────────────
window.RELIEF_DISAB_LEVELS = [
  { v: 'partial',  l: 'บางส่วน' },
  { v: 'severe',   l: 'รุนแรง' },
  { v: 'organ',    l: 'สูญเสียอวัยวะ' },
  { v: 'unable',   l: 'ไม่สามารถประกอบอาชีพ' },
];
// ── สถานะที่พักอาศัย (บ้านที่ประสบภัย) ────────────────────────────────
window.RELIEF_RESIDENCE = [
  { v: 'owner',   l: 'เจ้าของบ้าน' },
  { v: 'dweller', l: 'ผู้อยู่อาศัย' },
  { v: 'rent',    l: 'บ้านเช่า' },
  { v: 'other',   l: 'อื่น ๆ' },
];
// ── ความสัมพันธ์ผู้รับเงิน (กรณีสมาชิกเสียชีวิต) ──────────────────────
window.RELIEF_RELATIONS = [
  { v: 'spouse', l: 'คู่สมรส' },
  { v: 'child',  l: 'บุตร' },
  { v: 'father', l: 'บิดา' },
  { v: 'mother', l: 'มารดา' },
  { v: 'heir',   l: 'ทายาทอื่น' },
];

// ── วิธีรับเงิน (CBT / CSH / MON / TRN / ZZZ) ─────────────────────────
window.RELIEF_PAY_BY = [
  { v: 'CBT', l: 'CBT · โอนเข้าบัญชีธนาคาร' },
  { v: 'CSH', l: 'CSH · รับเงินสด' },
  { v: 'MON', l: 'MON · ธนาณัติธรรมดา' },
  { v: 'TRN', l: 'TRN · โอนเข้าเงินฝากสหกรณ์' },
  { v: 'ZZZ', l: 'ZZZ · อื่น ๆ' },
];
window.RELIEF_BANKS = [
  { v: 'ktb',  l: 'ธ.กรุงไทย' },
  { v: 'gsb',  l: 'ธ.ออมสิน' },
  { v: 'bbl',  l: 'ธ.กรุงเทพ' },
  { v: 'scb',  l: 'ธ.ไทยพาณิชย์' },
  { v: 'baac', l: 'ธ.ก.ส.' },
];
window.RELIEF_ACCT_TYPES = [
  { v: 'saving',  l: 'ออมทรัพย์' },
  { v: 'current', l: 'กระแสรายวัน' },
  { v: 'fixed',   l: 'ฝากประจำ' },
];

// ── สถานะคำขอ / สถานะการจ่าย ──────────────────────────────────────────
window.RELIEF_STATUS = [
  { v: 'entered',  step: '0', l: 'ป้อนคำขอ',    pill: 'neutral' },
  { v: 'checked',  step: '1', l: 'ตรวจสอบแล้ว',  pill: 'info' },
  { v: 'approved', step: '2', l: 'อนุมัติแล้ว',   pill: 'warn' },
  { v: 'paid',     step: '3', l: 'จ่ายแล้ว',     pill: 'ok' },
];
window.reliefStatus = (v) => window.RELIEF_STATUS.find(x => x.v === v) || { step: '0', l: v, pill: 'neutral' };

window.reliefLabel = (group, v) => {
  const map = {
    payBy: window.RELIEF_PAY_BY, bank: window.RELIEF_BANKS, acctType: window.RELIEF_ACCT_TYPES,
    damage: window.RELIEF_DAMAGE_LEVELS, disab: window.RELIEF_DISAB_LEVELS,
    residence: window.RELIEF_RESIDENCE, relation: window.RELIEF_RELATIONS,
  };
  const list = map[group] || [];
  const o = list.find(x => (x.v ?? x.value) === String(v));
  return o ? (o.l ?? o.label) : (v || '—');
};

// ── เอกสารแนบที่ควรบังคับ ตามประเภทสวัสดิการ ──────────────────────────
window.RELIEF_DOCS_BY_TYPE = {
  '4001': ['ใบมรณบัตร', 'สำเนาบัตรประชาชน', 'สำเนาทะเบียนบ้าน', 'เอกสารผู้รับผลประโยชน์'],
  '4002': ['ใบมรณบัตร', 'เอกสารแสดงความสัมพันธ์', 'สำเนาบัตรประชาชน'],
  '4003': ['ใบมรณบัตร', 'เอกสารแสดงความสัมพันธ์', 'สำเนาบัตรประชาชน'],
  '4004': ['ใบมรณบัตร', 'ทะเบียนสมรส', 'สำเนาบัตรประชาชน'],
  '4005': ['ใบมรณบัตร', 'สูติบัตร/ทะเบียนบ้าน', 'เอกสารแสดงความสัมพันธ์'],
  '2011': ['หนังสือรับรองภัยพิบัติ', 'ภาพถ่ายความเสียหาย', 'สำเนาทะเบียนบ้าน'],
  '2012': ['หนังสือรับรองเหตุเพลิงไหม้', 'ภาพถ่ายความเสียหาย', 'สำเนาทะเบียนบ้าน'],
  '2013': ['หนังสือรับรองจากหน่วยงานท้องถิ่น', 'ภาพถ่ายความเสียหาย', 'สำเนาทะเบียนบ้าน'],
  '2014': ['หนังสือรับรองภัยพิบัติ', 'ภาพถ่ายความเสียหาย', 'เอกสารประกอบเพิ่มเติม'],
  '5001': ['ใบรับรองแพทย์', 'สำเนาบัตรประชาชน'],
  '5002': ['ใบรับรองแพทย์/เอกสารรับรองความพิการ', 'บัตรคนพิการ (ถ้ามี)', 'สำเนาบัตรประชาชน'],
  '5003': ['ใบรับรองแพทย์', 'สำเนาบัตรประชาชน'],
  '9001': ['เอกสารอ้างอิงประกอบคำขอ'],
  '9002': ['เอกสารอ้างอิงประกอบคำขอ'],
  '9003': ['สำเนามติที่ประชุมคณะกรรมการ'],
};
window.reliefDocTypes = (typeCode) => window.RELIEF_DOCS_BY_TYPE[String(typeCode)] || ['เอกสารประกอบคำขอ'];
window.RELIEF_DOC_STATUS = [
  { v: 'pending', l: 'รอตรวจสอบ', pill: 'warn' },
  { v: 'pass',    l: 'ผ่าน',      pill: 'ok' },
  { v: 'fail',    l: 'ไม่ผ่าน',   pill: 'bad' },
];

// ── ข้อมูลที่อยู่ (จังหวัด → อำเภอ → ตำบล → ไปรษณีย์) แบบย่อ ───────────
window.RELIEF_GEO = {
  'กรุงเทพมหานคร': {
    'เขตจตุจักร':   { 'แขวงลาดยาว': '10900', 'แขวงจตุจักร': '10900', 'แขวงจอมพล': '10900' },
    'เขตบางเขน':    { 'แขวงอนุสาวรีย์': '10220', 'แขวงท่าแร้ง': '10220' },
  },
  'นนทบุรี': {
    'อำเภอเมืองนนทบุรี': { 'ตำบลบางกระสอ': '11000', 'ตำบลตลาดขวัญ': '11000', 'ตำบลสวนใหญ่': '11000' },
    'อำเภอปากเกร็ด':     { 'ตำบลปากเกร็ด': '11120', 'ตำบลบางตลาด': '11120', 'ตำบลคลองเกลือ': '11120' },
  },
  'ปทุมธานี': {
    'อำเภอเมืองปทุมธานี': { 'ตำบลบางปรอก': '12000', 'ตำบลบ้านใหม่': '12000' },
    'อำเภอคลองหลวง':      { 'ตำบลคลองหนึ่ง': '12120', 'ตำบลคลองสอง': '12120' },
  },
  'เชียงใหม่': {
    'อำเภอเมืองเชียงใหม่': { 'ตำบลศรีภูมิ': '50200', 'ตำบลช้างเผือก': '50300', 'ตำบลสุเทพ': '50200' },
    'อำเภอสันทราย':        { 'ตำบลหนองหาร': '50290', 'ตำบลสันทรายหลวง': '50210' },
  },
};
window.reliefProvinces = () => Object.keys(window.RELIEF_GEO);
window.reliefAmphoes = (prov) => Object.keys(window.RELIEF_GEO[prov] || {});
window.reliefTambons = (prov, amp) => Object.keys((window.RELIEF_GEO[prov] || {})[amp] || {});
window.reliefPostal = (prov, amp, tam) => ((window.RELIEF_GEO[prov] || {})[amp] || {})[tam] || '';

// ── อายุการเป็นสมาชิก (ปี ทศนิยม 2 ตำแหน่ง) ──────────────────────────
window.reliefMemberYears = (joinDate) => {
  if (!joinDate) return 0;
  const years = (Date.now() - new Date(joinDate).getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, years);
};
window.reliefShareTerms = (joinDate) => {
  if (!joinDate) return 0;
  const j = new Date(joinDate), n = new Date();
  return Math.max(0, (n.getFullYear() - j.getFullYear()) * 12 + (n.getMonth() - j.getMonth()));
};

// ── ระยะเวลานับจากวันเกิดเหตุถึงวันยื่นคำขอ (วัน) ─────────────────────
window.reliefDaysSince = (eventDate, reqDate) => {
  if (!eventDate || !reqDate) return 0;
  const d = (new Date(reqDate).getTime() - new Date(eventDate).getTime()) / (24 * 3600 * 1000);
  return Math.round(d);
};

// ── คำนวณสิทธิสวัสดิการ ───────────────────────────────────────────────
//  opts: number (อายุสมาชิก, รองรับของเดิม) หรือ { memberYears, damage }
window.reliefAmount = (typeCode, opts) => {
  const t = window.reliefType(typeCode);
  if (!t) return 0;
  const o = (typeof opts === 'number') ? { memberYears: opts } : (opts || {});
  const cfg = window.reliefTypeCfg ? window.reliefTypeCfg(typeCode) : null;
  const cap = (amt) => (cfg && Number(cfg.maxAmount) > 0) ? Math.min(amt, Number(cfg.maxAmount)) : amt;
  if (t.manual) return 0;
  if (t.byDamage) {
    const lv = window.RELIEF_DAMAGE_LEVELS.find(x => x.v === o.damage);
    return cap(lv ? lv.amount : (cfg ? Number(cfg.amount) || t.base : t.base));
  }
  if (!t.member) return cfg ? (Number(cfg.amount) || t.base) : t.base;
  const tier = [...window.RELIEF_MEMBER_TIERS]
    .filter(x => (o.memberYears || 0) >= x.minYears)
    .sort((a, b) => b.minYears - a.minYears)[0];
  return cap(tier ? tier.amount : 0);
};
window.reliefTierLabel = (memberYears) => {
  const tier = [...window.RELIEF_MEMBER_TIERS]
    .filter(x => memberYears >= x.minYears)
    .sort((a, b) => b.minYears - a.minYears)[0];
  return tier ? tier.label : '—';
};

// ── สถานะสมาชิกที่มีสิทธิขอสวัสดิการ ─────────────────────────────────
window.RELIEF_ELIGIBLE_STATUS = ['ปฏิบัติงาน', 'เกษียณ'];
window.reliefMemberEligible = (status) => window.RELIEF_ELIGIBLE_STATUS.includes(status);

// ── ดึงข้อมูลสมาชิก (auto-fill) ───────────────────────────────────────
window.reliefMember = (code) => {
  const base = window.schReqMember ? window.schReqMember(code) : null;
  const m = (window.MEMBERS_LIST || []).find(x => x.code === String(code).trim());
  if (!base || !m) return null;
  return {
    ...base,
    citizenId: m.citizenId,
    status: m.status,
    shareTerms: window.reliefShareTerms(m.joinDate),
    shareValue: m.shares || 0,
  };
};

// ── เลขใบคำขอถัดไป — DS-<ปีพ.ศ.>-<ลำดับ 4 หลัก> ──────────────────────
window.reliefNextDocNo = (list, year) => {
  const yr = String(year || (new Date().getFullYear() + 543));
  const nums = list.filter(r => String(r.id).startsWith('DS-' + yr))
    .map(r => parseInt(String(r.id).split('-')[2], 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `DS-${yr}-${String(next).padStart(4, '0')}`;
};

// ── ประวัติการใช้สิทธิของสมาชิก (mock) ────────────────────────────────
window.reliefUsageHistory = (memberCode) =>
  (window.RELIEF_SEED || []).filter(r => r.memberCode === memberCode);

// ── ข้อมูลตั้งต้น: คำขอที่เคยยื่นเข้ามา ────────────────────────────────
window.RELIEF_SEED = [
  {
    id: 'DS-2569-0001', reqDate: '2026-03-12', enteredBy: 'จันทร์เพ็ญ มาลี',
    welfareCode: 'DEATH', typeCode: '4002', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    trackingNo: 'TRK-690312-01',
    deceasedName: 'นายบุญส่ง รักษ์ออม', deceasedCitizenId: '3-1018-00214-55-2',
    deceasedDeathDate: '2026-03-04', deceasedAge: 78, deceasedCause: 'ชราภาพ',
    over120: false, over120Reason: '', note: 'แนบสำเนาใบมรณบัตรและทะเบียนบ้านครบถ้วน',
    eligible: 30000, requested: 30000,
    payBy: 'CBT', bank: 'ktb', acctType: 'saving', payAccount: '402-1-04821-0', accName: 'นายสมชาย ใจดี รักษ์ออม', branch: 'สำนักงานใหญ่',
    status: 'paid', payDate: '2026-03-20',
  },
  {
    id: 'DS-2569-0002', reqDate: '2026-04-02', enteredBy: 'จันทร์เพ็ญ มาลี',
    welfareCode: 'DEATH', typeCode: '4003', memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์',
    trackingNo: 'TRK-690402-04',
    deceasedName: 'นางพิกุล สุขสวัสดิ์', deceasedCitizenId: '3-1018-00911-12-8',
    deceasedDeathDate: '2026-03-25', deceasedAge: 71, deceasedCause: 'โรคประจำตัว',
    over120: false, over120Reason: '', note: '',
    eligible: 30000, requested: 30000,
    payBy: 'TRN', coopAccount: '101-2-00112-4', coopAcctType: 'ออมทรัพย์', coopAccName: 'นายอนุชา สุขสวัสดิ์',
    status: 'approved', payDate: '',
  },
  {
    id: 'DS-2569-0003', reqDate: '2026-04-21', enteredBy: 'สมหญิง ตั้งใจ',
    welfareCode: 'DEATH', typeCode: '4001', memberCode: 'M-058248', memberName: 'นางสาวศิริพร ใจงาม',
    trackingNo: 'TRK-690421-02',
    deceasedName: 'นางสาวศิริพร ใจงาม', deceasedCitizenId: '1-1019-00541-23-7',
    deceasedDeathDate: '2026-04-10', deceasedAge: 38, deceasedCause: 'อุบัติเหตุ',
    benefName: 'นายเมธา ใจงาม', benefCitizenId: '3-1019-00112-09-5', benefRelation: 'spouse', benefPhone: '081-234-5678',
    over120: false, over120Reason: '', note: 'ทายาทผู้รับผลประโยชน์ยื่นแทน · สมาชิกอายุงาน 7 ปี',
    eligible: 50000, requested: 50000,
    payBy: 'CBT', bank: 'gsb', acctType: 'saving', payAccount: '882-3-04210-7', accName: 'นายเมธา ใจงาม', branch: 'เทศบาล',
    status: 'checked', payDate: '',
  },
  {
    id: 'DS-2569-0004', reqDate: '2026-05-06', enteredBy: 'จันทร์เพ็ญ มาลี',
    welfareCode: 'DISASTER', typeCode: '2011', memberCode: 'M-058244', memberName: 'นางวิภา จันทร์เพ็ญ',
    trackingNo: 'TRK-690506-07',
    disasterDate: '2026-04-28', disasterKind: 'อุทกภัย', damage: 'severe',
    disasterDetail: 'น้ำท่วมขังบ้านพักสูงประมาณ 80 ซม. นาน 5 วัน', certOrg: 'เทศบาลตำบลปากเกร็ด',
    houseRegNo: '1101200345', houseNo: '88/12', moo: '4', soi: '', road: 'แจ้งวัฒนะ',
    province: 'นนทบุรี', amphoe: 'อำเภอปากเกร็ด', tambon: 'ตำบลปากเกร็ด', postal: '11120',
    residence: 'owner', mainHouse: true,
    over120: false, over120Reason: '', note: '',
    eligible: 10000, requested: 10000,
    payBy: 'CSH', cashName: 'นางวิภา จันทร์เพ็ญ', cashCitizenId: '3-1019-00482-19-2', cashPhone: '089-555-1212',
    status: 'entered', payDate: '',
  },
  {
    id: 'DS-2569-0005', reqDate: '2026-05-18', enteredBy: 'จันทร์เพ็ญ มาลี',
    welfareCode: 'DISAB', typeCode: '5001', memberCode: 'M-058245', memberName: 'นายธีรพงษ์ ขำเพชร',
    trackingNo: 'TRK-690518-01',
    disabDate: '2026-04-30', disabType: 'บางส่วน', disabLevel: 'organ',
    disabCause: 'อุบัติเหตุระหว่างปฏิบัติงาน — สูญเสียนิ้วมือขวา 2 นิ้ว',
    hospital: 'โรงพยาบาลนนทบุรี', medCertNo: 'MC-690515-221', medCertDate: '2026-05-15',
    over120: false, over120Reason: '', note: '',
    eligible: 15000, requested: 15000,
    payBy: 'CBT', bank: 'ktb', acctType: 'saving', payAccount: '402-1-05521-0', accName: 'นายธีรพงษ์ ขำเพชร', branch: 'สำนักงานใหญ่',
    status: 'approved', payDate: '',
  },
  {
    id: 'DS-2568-0061', reqDate: '2025-11-24', enteredBy: 'สมหญิง ตั้งใจ',
    welfareCode: 'DEATH', typeCode: '4002', memberCode: 'M-058250', memberName: 'นายพิทักษ์ บุญมาก',
    trackingNo: 'TRK-681124-03',
    deceasedName: 'นายชวน บุญมาก', deceasedCitizenId: '3-1018-00128-31-6',
    deceasedDeathDate: '2025-07-08', deceasedAge: 83, deceasedCause: 'ชราภาพ',
    over120: true, over120Reason: 'ทายาทอยู่ต่างจังหวัด รวบรวมเอกสารล่าช้า — เสนอคณะกรรมการพิจารณาเป็นกรณีพิเศษ',
    note: 'ยื่นเอกสารเกินกำหนด 120 วัน',
    eligible: 30000, requested: 30000,
    payBy: 'MON', moName: 'นายพิทักษ์ บุญมาก', moAddr: '45/2 หมู่ 3 ต.บางตลาด', moProvince: 'นนทบุรี', moPostal: '11120', moNo: 'MO-6811-0098',
    status: 'paid', payDate: '2025-12-05',
  },
];
