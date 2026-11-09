// ════════════════════════════════════════════════════════════════════
//  ระบบงานสวัสดิการสมาชิก — คำขอทุนสวัสดิการทุนการศึกษา
//  ทะเบียนคำขอ + แบบฟอร์มสร้างคำขอของสมาชิก
// ════════════════════════════════════════════════════════════════════

// ── ตัวเลือก (Dropdown) ──────────────────────────────────────────────
window.SCHREQ_OPTS = {
  titlePrefix: [
    { v: 'ด.ช.', l: 'ด.ช.' },
    { v: 'ด.ญ.', l: 'ด.ญ.' },
    { v: 'นาย',  l: 'นาย' },
    { v: 'น.ส.', l: 'น.ส.' },
  ],
  payBy: [
    { v: 'coop',     l: 'โอนเข้าเงินฝากสหกรณ์' },
    { v: 'bank',     l: 'โอนเข้าบัญชีธนาคาร' },
    { v: 'cash',     l: 'รับเงินสด' },
    { v: 'postal',   l: 'ธนาณัติ (ไปรษณีย์)' },
  ],
  status: [
    { v: 'pending',  l: 'รอคัดเลือก',   pill: 'neutral' },
    { v: 'selected', l: 'รออนุมัติ',    pill: 'warn' },
    { v: 'approved', l: 'อนุมัติแล้ว',   pill: 'info' },
    { v: 'paid',     l: 'จ่ายแล้ว',     pill: 'ok' },
    { v: 'rejected', l: 'ไม่อนุมัติ',    pill: 'bad' },
  ],
};

// บัญชีงบประมาณตั้งต้นสำหรับทุนการศึกษา (ใช้เป็นค่าเริ่มต้นใน Popup ตัดงบ)
window.SCHREQ_DEFAULT_BUDGET = '5310 · ทุนการศึกษาบุตรสมาชิก';

// เลขที่ใบสำคัญจ่ายเงินทุนการศึกษา (running) — PVS-<ปีพ.ศ.>-<ลำดับ 4 หลัก>
window.schReqPayVoucherNo = (list, year) => {
  const yr = String(year || 2569);
  const used = (list || []).map(r => r.payVoucherNo).filter(Boolean);
  const nums = used.filter(v => String(v).startsWith('PVS-' + yr)).map(v => parseInt(String(v).split('-')[2], 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PVS-${yr}-${String(next).padStart(4, '0')}`;
};

window.schReqLabel = (group, v) => {
  const o = (window.SCHREQ_OPTS[group] || []).find(x => x.v === String(v));
  return o ? o.l : v;
};
window.schReqStatus = (v) => (window.SCHREQ_OPTS.status.find(x => x.v === v) || { l: v, pill: 'neutral' });

// ── ฐานเงินเดือนของสมาชิก (สำหรับดึงข้อมูลอัตโนมัติในแบบฟอร์ม) ─────────
window.SCHREQ_SALARY = {
  'M-058241': 48750, 'M-058242': 28400, 'M-058243': 52400, 'M-058244': 24600,
  'M-058245': 61200, 'M-058246': 21800, 'M-058247': 58900, 'M-058248': 26300,
  'M-058249': 44100, 'M-058250': 31200, 'M-058251': 23900, 'M-058252': 35600,
};

// ── ดึงข้อมูลสมาชิกจากเลขสมาชิก (auto-fill) ───────────────────────────
window.schReqMember = (code) => {
  const m = (window.MEMBERS_LIST || []).find(x => x.code === String(code).trim());
  if (!m) return null;
  const lastName = m.name.replace(/^(นาย|นาง|นางสาว)\s*/, '').trim().split(/\s+/).slice(-1)[0] || '';
  return {
    code: m.code, name: m.name, dept: m.dept, deptCode: m.deptCode,
    joinDate: m.joinDate, salary: window.SCHREQ_SALARY[m.code] || m.monthly * 4 || 0,
    lastName,
  };
};

// ── อายุสมาชิก (ปี ทศนิยม 2 ตำแหน่ง) ──────────────────────────────────
window.schReqMemberAge = (joinDate) => {
  if (!joinDate) return 0;
  const start = new Date(joinDate);
  const now = new Date();
  const years = (now - start) / (365.25 * 24 * 3600 * 1000);
  return Math.max(0, years);
};

// ── อายุบุตร (ปีเต็ม) จากวันเกิด ──────────────────────────────────────
window.schReqAge = (birthDate, asOf) => {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b)) return null;
  const now = asOf ? new Date(asOf) : new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return Math.max(0, age);
};
window.schReqAgeLabel = (birthDate, asOf) => {
  const a = window.schReqAge(birthDate, asOf);
  return a == null ? '' : a + ' ปี';
};

// ── ตรวจสิทธิการขอทุน (ปีเว้นปี) ──────────────────────────────────────
//  • สมาชิก: ขอได้ปีเว้นปี — หากเคยขอใน "ปีก่อนหน้า" จะขอปีนี้ไม่ได้
//  • บุตร: ขอได้ปีละครั้ง และปีเว้นปี — ตรวจข้ามผู้ขอด้วยเลขบัตรประชาชน
//          (เช่น บิดาและมารดาเป็นสมาชิกทั้งคู่ ใช้สิทธิบุตรคนเดียวกันได้คนเดียว)
//  คืนค่า { ok, reasons:[], memberBlocked, childBlocked }
window.schReqEligibility = (list, opts) => {
  const o = opts || {};
  const yr = Number(o.year) || 0;
  const prev = yr - 1;
  const cid = (o.childCitizenId || '').trim();
  const reasons = [];
  const others = (list || []).filter(r => r.id !== o.excludeId);

  // ── สมาชิก ──
  const memberThisYr = others.find(r => r.memberCode === o.memberCode && Number(r.schoolYear) === yr);
  const memberPrevYr = others.find(r => r.memberCode === o.memberCode && Number(r.schoolYear) === prev);
  let memberBlocked = false;
  if (memberPrevYr) {
    memberBlocked = true;
    reasons.push(`สมาชิกเคยขอทุนในปีงบประมาณ ${prev} แล้ว — ขอได้ปีเว้นปี (ปีถัดไปที่ขอได้คือ ${prev + 2})`);
  }

  // ── บุตร (ตามเลขบัตรประชาชน ข้ามผู้ขอ) ──
  let childBlocked = false;
  if (cid) {
    const childThisYr = others.find(r => (r.childCitizenId || '').trim() === cid && Number(r.schoolYear) === yr);
    const childPrevYr = others.find(r => (r.childCitizenId || '').trim() === cid && Number(r.schoolYear) === prev);
    if (childThisYr) {
      childBlocked = true;
      reasons.push(`บุตรรายนี้ได้ยื่นคำขอในปี ${yr} แล้ว (${childThisYr.memberName}) — ขอได้ปีละครั้ง`);
    } else if (childPrevYr) {
      childBlocked = true;
      reasons.push(`บุตรรายนี้เคยรับทุนในปี ${prev} (${childPrevYr.memberName}) — ขอได้ปีเว้นปี (ปีถัดไปที่ขอได้คือ ${prev + 2})`);
    }
  }

  return { ok: !memberBlocked && !childBlocked, reasons, memberBlocked, childBlocked };
};

// ── คำนวณจำนวนเงินทุน จากเมนูกำหนดจำนวนทุนการศึกษา (ระดับชั้น+ประเภท+ปี) ─
window.schReqAmount = (year, scholarType, eduLevel) => {
  let quota = null;
  try {
    const saved = localStorage.getItem('scholarship_quota');
    quota = saved ? JSON.parse(saved) : null;
  } catch (e) {}
  if (!quota) quota = window.SCH_SEED || [];
  // ม.ปลาย (3) และ ปวช. (4) ถือเป็นระดับชั้นเดียวกัน — เทียบค่าทุนร่วมกัน
  const eduKey = String(eduLevel) === '4' ? '3' : String(eduLevel);
  const row = quota.find(r =>
    String(r.year) === String(year) &&
    String(r.scholarType) === String(scholarType) &&
    (String(r.eduLevel) === '4' ? '3' : String(r.eduLevel)) === eduKey);
  return row ? Number(row.amountEach) || 0 : 0;
};

// ── เกณฑ์การพิจารณาผลการเรียนบุตร (จากเมนูกำหนดจำนวนทุนการศึกษา) ───────
//  คืนค่า { minGpa, minPercent } ตาม ปี/ประเภททุน/ระดับชั้น (0 = ไม่กำหนด)
window.schReqCriteria = (year, scholarType, eduLevel) => {
  let quota = null;
  try { const s = localStorage.getItem('scholarship_quota'); quota = s ? JSON.parse(s) : null; } catch (e) {}
  if (!quota) quota = window.SCH_SEED || [];
  const eduKey = String(eduLevel) === '4' ? '3' : String(eduLevel);
  const row = quota.find(r =>
    String(r.year) === String(year) &&
    String(r.scholarType) === String(scholarType) &&
    (String(r.eduLevel) === '4' ? '3' : String(r.eduLevel)) === eduKey);
  return {
    minGpa: row ? Number(row.minGpa) || 0 : 0,
    minPercent: row ? Number(row.minPercent) || 0 : 0,
  };
};

// ── บัญชีรับเงินของสมาชิก (สำหรับ stamp/ค้นหาเลขบัญชี) ────────────────
//  coop = เงินฝากสหกรณ์ · bank = บัญชีธนาคาร — รายการแรก = บัญชีหลัก
window.memberAccounts = (code, kind) => {
  const d = String(code || '').replace(/\D/g, '').slice(-5) || '00000';
  if (kind === 'coop') return [
    { accNo: `101-2-${d}-9`, type: 'ออมทรัพย์',        label: 'เงินฝากออมทรัพย์ (สหกรณ์)' },
    { accNo: `102-5-${d}-1`, type: 'ออมทรัพย์พิเศษ',   label: 'ออมทรัพย์พิเศษ (สหกรณ์)' },
  ];
  if (kind === 'bank') return [
    { accNo: `402-1-${d}-0`, type: 'ธ.กรุงไทย',  label: 'ธนาคารกรุงไทย · สาขาสำนักงานใหญ่' },
    { accNo: `882-3-${d}-7`, type: 'ธ.ออมสิน',   label: 'ธนาคารออมสิน · สาขาเทศบาล' },
  ];
  return [];
};
window.memberPrimaryAccount = (code, kind) => {
  const a = window.memberAccounts(code, kind);
  return a[0] ? a[0].accNo : '';
};

// ── ข้อมูลตั้งต้น (Mock) — ครอบคลุมทุกสถานะ เพื่อเดินกระบวนการได้ครบ ───
//  สถานะ: pending(รอคัดเลือก) → selected(รออนุมัติ) → approved(รอจ่าย) → paid(จ่ายแล้ว)
//  • pending 2569 → ป้อนเข้าเมนู "ประมวลผลคัดเลือก" (มีทั้งผ่าน/เกรดไม่ผ่าน/ยื่นซ้ำ/ส่งกลับ)
//  • selected  → ป้อนเข้าเมนู "อนุมัติคำขอทุนการศึกษา"
//  • approved  → ป้อนเข้าเมนู "อนุมัติจ่ายเงินทุนการศึกษา" (การเงิน) พร้อมบัญชีงบประมาณ
//  • paid      → ประวัติการจ่าย (มีเลขใบสำคัญจ่าย PVS-)
window.SCHREQ_SEED = [
  // ════ รอคัดเลือก (pending) — สำหรับเมนูประมวลผลคัดเลือก ════
  { id: 'WS-2569-0010', reqDate: '2026-05-12', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '2',
    childTitle: 'ด.ช.', childFirst: 'ปุณณ์', childLast: 'รักษ์ออม',
    childCitizenId: '1-1019-05521-10-1', childBirth: '2012-05-09',
    childrenStudying: 2, gpa: 3.30, percent: 82.5, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58241-9', moneyOrder: '', amount: 2500, status: 'pending' },
  { id: 'WS-2569-0011', reqDate: '2026-05-12', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    schoolYear: 2569, seq: 2, scholarType: '1', eduLevel: '6',
    childTitle: 'น.ส.', childFirst: 'ปริยา', childLast: 'รักษ์ออม',
    childCitizenId: '1-1019-01284-55-1', childBirth: '2004-03-12',
    childrenStudying: 2, gpa: 3.10, percent: 77.5, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58241-9', moneyOrder: '', amount: 5000, status: 'pending' },
  { id: 'WS-2569-0012', reqDate: '2026-05-13', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058242', memberName: 'นางสาวกานต์ ศิริวงศ์',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '2',
    childTitle: 'ด.ญ.', childFirst: 'ปัณณิกา', childLast: 'ศิริวงศ์',
    childCitizenId: '1-1099-06214-22-3', childBirth: '2011-09-18',
    childrenStudying: 1, gpa: 2.80, percent: 70.0, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58242-9', moneyOrder: '', amount: 2500, status: 'pending' },
  { id: 'WS-2569-0013', reqDate: '2026-05-14', enteredBy: 'สมหญิง ตั้งใจ',
    memberCode: 'M-058250', memberName: 'นางอรอนงค์ บุญมาก',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '3',
    childTitle: 'นาย', childFirst: 'กิตติภพ', childLast: 'บุญมาก',
    childCitizenId: '1-1018-07721-19-2', childBirth: '2008-01-27',
    childrenStudying: 2, gpa: 2.20, percent: 55.0, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58250-9', moneyOrder: '', amount: 3000, status: 'pending' },
  { id: 'WS-2569-0014', reqDate: '2026-05-14', enteredBy: 'สมหญิง ตั้งใจ',
    memberCode: 'M-058251', memberName: 'นายภาคภูมิ รัตนา',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '2',
    childTitle: 'ด.ญ.', childFirst: 'ปาลิตา', childLast: 'รัตนา',
    childCitizenId: '1-1098-08211-87-4', childBirth: '2011-12-02',
    childrenStudying: 1, gpa: 2.60, percent: 65.0, coefficient: 1.00,
    payBy: 'cash', payAccount: '', moneyOrder: '', amount: 2500, status: 'pending' },
  { id: 'WS-2569-0015', reqDate: '2026-05-15', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058247', memberName: 'นายวีรชัย พิทักษ์ธรรม',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '6',
    childTitle: 'น.ส.', childFirst: 'ธิดารัตน์', childLast: 'พิทักษ์ธรรม',
    childCitizenId: '1-1099-00021-45-9', childBirth: '2003-10-21',
    childrenStudying: 1, gpa: 3.30, percent: 82.5, coefficient: 1.00,
    payBy: 'bank', payAccount: '402-1-58247-0', moneyOrder: '', amount: 5000,
    status: 'pending', returnedForReselect: true,
    rejectReason: 'เอกสารรับรองผลการเรียนไม่ครบ — ส่งกลับให้คัดเลือกใหม่' },

  // ════ รออนุมัติ (selected) — สำหรับเมนูอนุมัติคำขอทุนการศึกษา ════
  { id: 'WS-2569-0006', reqDate: '2026-05-04', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058245', memberName: 'นายธีรพงษ์ ขำเพชร',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '6',
    childTitle: 'น.ส.', childFirst: 'พิมพ์ชนก', childLast: 'ขำเพชร',
    childCitizenId: '1-2099-00321-45-1', childBirth: '2003-06-14',
    childrenStudying: 1, gpa: 3.40, percent: 85.0, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58245-9', moneyOrder: '', amount: 5000, status: 'selected' },
  { id: 'WS-2569-0007', reqDate: '2026-05-05', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058248', memberName: 'นางสาวศิริพร ใจงาม',
    schoolYear: 2569, seq: 1, scholarType: '2', eduLevel: '3',
    childTitle: 'นาย', childFirst: 'ธนวัฒน์', childLast: 'ใจงาม',
    childCitizenId: '1-1019-05410-23-7', childBirth: '2008-08-30',
    childrenStudying: 1, gpa: 3.60, percent: 90.0, coefficient: 1.00,
    payBy: 'bank', payAccount: '402-1-58248-0', moneyOrder: '', amount: 4000, status: 'selected' },
  { id: 'WS-2569-0008', reqDate: '2026-05-06', enteredBy: 'สมหญิง ตั้งใจ',
    memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '2',
    childTitle: 'ด.ญ.', childFirst: 'ธัญชนก', childLast: 'สุขสวัสดิ์',
    childCitizenId: '1-1018-02841-33-7', childBirth: '2011-07-08',
    childrenStudying: 2, gpa: 2.90, percent: 72.5, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58243-9', moneyOrder: '', amount: 2500, status: 'selected' },

  // ════ อนุมัติแล้ว รอจ่าย (approved) — สำหรับเมนูอนุมัติจ่ายเงิน (การเงิน) ════
  { id: 'WS-2569-0004', reqDate: '2026-04-28', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058249', memberName: 'นายสุรชัย วงศ์ประเสริฐ',
    schoolYear: 2569, seq: 1, scholarType: '2', eduLevel: '6',
    childTitle: 'น.ส.', childFirst: 'ณิชา', childLast: 'วงศ์ประเสริฐ',
    childCitizenId: '1-1019-00112-88-3', childBirth: '2003-02-15',
    childrenStudying: 1, gpa: 3.70, percent: 92.5, coefficient: 1.00,
    payBy: 'bank', payAccount: '402-1-58249-0', moneyOrder: '', amount: 8000, status: 'approved',
    approvedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', approvedDate: '2026-05-20',
    budgetCat: '', budgetLabel: '5311 · ทุนเรียนดีบุตรสมาชิก', budgetGL: '5311' },
  { id: 'WS-2569-0005', reqDate: '2026-04-29', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '1',
    childTitle: 'ด.ช.', childFirst: 'ปกรณ์', childLast: 'ทองคำ',
    childCitizenId: '1-1018-00928-44-1', childBirth: '2015-04-19',
    childrenStudying: 1, gpa: 3.00, percent: 75.0, coefficient: 1.00,
    payBy: 'cash', payAccount: '', moneyOrder: '', amount: 2000, status: 'approved',
    approvedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', approvedDate: '2026-05-20',
    budgetCat: '', budgetLabel: '5310 · ทุนการศึกษาบุตรสมาชิก', budgetGL: '5310' },

  // ════ จ่ายแล้ว (paid) — ประวัติ ════
  { id: 'WS-2569-0002', reqDate: '2026-04-22', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058244', memberName: 'นางวิภา จันทร์เพ็ญ',
    schoolYear: 2569, seq: 1, scholarType: '1', eduLevel: '1',
    childTitle: 'ด.ช.', childFirst: 'ภูริช', childLast: 'จันทร์เพ็ญ',
    childCitizenId: '1-1019-03928-11-2', childBirth: '2017-11-20',
    childrenStudying: 2, gpa: 3.00, percent: 75.0, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58244-1', moneyOrder: '', amount: 2000, status: 'paid',
    approvedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', approvedDate: '2026-05-06',
    budgetCat: '', budgetLabel: '5310 · ทุนการศึกษาบุตรสมาชิก', budgetGL: '5310',
    payVoucherNo: 'PVS-2569-0001', payDate: '2026-05-10', paidBy: 'นางจันทร์เพ็ญ มาลี' },

  // ════ ปีก่อน (2568) — ประวัติการจ่าย ════
  { id: 'WS-2568-0042', reqDate: '2025-05-14', enteredBy: 'จันทร์เพ็ญ มาลี',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    schoolYear: 2568, seq: 1, scholarType: '1', eduLevel: '6',
    childTitle: 'น.ส.', childFirst: 'ปริยากร', childLast: 'รักษ์ออม',
    childCitizenId: '1-1019-01284-55-1', childBirth: '2004-03-12',
    childrenStudying: 2, gpa: 3.55, percent: 88.75, coefficient: 1.00,
    payBy: 'coop', payAccount: '101-2-58241-9', moneyOrder: '', amount: 5000, status: 'paid',
    approvedBy: 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์', approvedDate: '2025-05-18',
    budgetCat: '', budgetLabel: '5310 · ทุนการศึกษาบุตรสมาชิก', budgetGL: '5310',
    payVoucherNo: 'PVS-2568-0050', payDate: '2025-05-20', paidBy: 'นางจันทร์เพ็ญ มาลี' },
];

// ── โหลด/รีซีดข้อมูลใบคำขอ (version-gated) ─────────────────────────────
//  เมื่อ SCHREQ_SEED_VERSION เปลี่ยน จะรีเซ็ตข้อมูล mock ใหม่ให้เดินครบกระบวนการ
window.SCHREQ_SEED_VERSION = 'mock-2569-v2';
window.schReqSeedFresh = () => window.SCHREQ_SEED.map(r => ({ ...r }));
window.schReqLoadStore = () => {
  try {
    const ver = localStorage.getItem('scholarship_requests_version');
    const s = localStorage.getItem('scholarship_requests');
    if (s && ver === window.SCHREQ_SEED_VERSION) return JSON.parse(s);
  } catch (e) {}
  const fresh = window.schReqSeedFresh();
  try {
    localStorage.setItem('scholarship_requests', JSON.stringify(fresh));
    localStorage.setItem('scholarship_requests_version', window.SCHREQ_SEED_VERSION);
  } catch (e) {}
  return fresh;
};
