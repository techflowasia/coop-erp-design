// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ทดสอบการคำนวณปันผล / เฉลี่ยคืน
//  (Per-member dividend & patronage-rebate calculation test tool)
//  ----------------------------------------------------------------
//  เครื่องมือให้เจ้าหน้าที่ "ทดสอบ" การคำนวณปันผล (จากหุ้น) และเฉลี่ยคืน
//  (จากดอกเบี้ยเงินกู้ที่เข้าเงื่อนไข) รายบุคคล ก่อนประมวลผลจริง
//  · ปันผล  = หุ้นที่ใช้คำนวณ × อัตราปันผล / 100
//  · เฉลี่ยคืน = ดอกเบี้ยที่เข้าเงื่อนไข × อัตราเฉลี่ยคืน / 100
//  · รองรับวิธีคำนวณ 2 แบบ: หุ้นสุทธิสิ้นปี (snapshot) และถ่วงอายุหุ้นรายเดือน
//  ตัวเลขทั้งหมดเป็นข้อมูลสาธิต — ใช้ทดสอบ/ตรวจสอบเท่านั้น
// ═════════════════════════════════════════════════════════════════

// ปีปันผล (พ.ศ.) ที่เปิดให้เลือก
window.DCT_YEARS = ['2568', '2567', '2566'];

// ─── ตัวเลือกแหล่งข้อมูลที่นำมาคำนวณ ─────────────────────────────────
window.DCT_CALC_SOURCES = [
  { v: 'yearend',  l: 'คำนวณจากข้อมูลสิ้นปี' },
  { v: 'current',  l: 'คำนวณจากข้อมูลปัจจุบัน' },
  { v: 'monthly',  l: 'คำนวณจากข้อมูลรายเดือน' },
  { v: 'closed',   l: 'คำนวณจากข้อมูลที่ปิดยอดแล้ว' },
  { v: 'sim',      l: 'คำนวณจากข้อมูลจำลอง' },
];

// ─── สถานะสมาชิก ─────────────────────────────────────────────────────
window.DCT_MEMBER_STATUS = [
  { v: 'normal',   l: 'สมาชิกปกติ',     pill: 'ok',      eligible: true  },
  { v: 'resign',   l: 'ลาออก',          pill: 'warn',    eligible: false },
  { v: 'expelled', l: 'พ้นสภาพสมาชิก',  pill: 'bad',     eligible: false },
  { v: 'deceased', l: 'เสียชีวิต',       pill: 'neutral', eligible: true  },
  { v: 'transfer', l: 'โอนย้าย',         pill: 'info',    eligible: true  },
  { v: 'suspend',  l: 'ระงับสิทธิ์',     pill: 'bad',     eligible: false },
];
window.dctStatus = (v) => window.DCT_MEMBER_STATUS.find(s => s.v === v) || window.DCT_MEMBER_STATUS[0];

// ─── สมาชิกสำหรับค้นหา (ใช้กับ MemberSearchModal) ────────────────────
window.DCT_MEMBERS = [
  { code: '00012345', title: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี',
    name: 'นายสมชาย ใจดี', citizenId: '3-1009-00482-31-7',
    deptCurrent: 'สำนักการศึกษา กรุงเทพมหานคร',
    deptYear: 'สำนักการศึกษา กรุงเทพมหานคร',
    dept: 'สำนักการศึกษา กรุงเทพมหานคร', status: 'normal' },
  { code: '00023918', title: 'นางสาว', firstName: 'พรทิพย์', lastName: 'ศรีวงศ์',
    name: 'นางสาวพรทิพย์ ศรีวงศ์', citizenId: '1-3017-00781-09-5',
    deptCurrent: 'สำนักงานเขตบางรัก',
    deptYear: 'สำนักงานเขตปทุมวัน',
    dept: 'สำนักงานเขตบางรัก', status: 'normal' },
  { code: '00031024', title: 'นาย', firstName: 'วีระ', lastName: 'มั่นคง',
    name: 'นายวีระ มั่นคง', citizenId: '3-3101-00219-44-2',
    deptCurrent: 'สำนักการคลัง กรุงเทพมหานคร',
    deptYear: 'สำนักการคลัง กรุงเทพมหานคร',
    dept: 'สำนักการคลัง กรุงเทพมหานคร', status: 'resign', resignDate: '30/09/2568' },
];

// ─── ข้อมูลฐานของสมาชิกแต่ละราย (สำหรับคำนวณสด) ──────────────────────
//  shareBegin   = หุ้นยกมาต้นปี
//  monthlyShare = หุ้นที่ส่งประจำเดือน (เท่ากันทุกเดือน)
//  special      = หุ้นพิเศษ (keyed ด้วยเลขเดือน 1–12)
//  withdraw     = ถอน/ลดหุ้น (keyed ด้วยเลขเดือน)
//  yearEndShare = หุ้นสุทธิสิ้นปีจาก snapshot (วิธี "ข้อมูลสิ้นปี")
//  interest[]   = รายการดอกเบี้ยเงินกู้ที่ชำระจริง (สำหรับเฉลี่ยคืน)
//                 eligible:false = ไม่เข้าเงื่อนไข (ผิดนัด/ตั้งพัก/กลับบัญชี)
window.DCT_DATA = {
  '00012345': {
    '2568': {
      divRate: 4.00, avgRate: 10.00,
      shareBegin: 120000, monthlyShare: 1000,
      special:  { 3: 5000 },
      withdraw: {},
      yearEndShare: 165000,
      interest: [
        { contract: 'สญ.6710045', kind: 'เงินกู้สามัญ',  payDate: '31/01/2568', term: '1/60', principal: 7000, interest: 3100, penalty: 0,   eligible: true,  note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6710045', kind: 'เงินกู้สามัญ',  payDate: '28/02/2568', term: '2/60', principal: 7000, interest: 3050, penalty: 0,   eligible: true,  note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6710045', kind: 'เงินกู้สามัญ',  payDate: '31/03/2568', term: '3/60', principal: 7000, interest: 3000, penalty: 0,   eligible: true,  note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6710045', kind: 'เงินกู้สามัญ',  payDate: '30/04/2568', term: '4/60', principal: 7000, interest: 2950, penalty: 0,   eligible: true,  note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6710045', kind: 'เงินกู้สามัญ',  payDate: '02/06/2568', term: '5/60', principal: 7000, interest: 2900, penalty: 250, eligible: true,  note: 'ชำระล่าช้า (ดอกเบี้ยเข้าเงื่อนไข, ค่าปรับไม่นำมาคิด)' },
        { contract: 'สญ.6710045', kind: 'เงินกู้สามัญ',  payDate: '30/06/2568', term: '6/60', principal: 7000, interest: 3250, penalty: 500, eligible: true,  note: 'ชำระล่าช้า (ดอกเบี้ยเข้าเงื่อนไข, ค่าปรับไม่นำมาคิด)' },
        { contract: 'สญ.6710045', kind: 'ดอกเบี้ยผิดนัด', payDate: '15/07/2568', term: '—',   principal: 0,    interest: 1000, penalty: 0,   eligible: false, note: 'ดอกเบี้ยผิดนัด — ไม่เข้าเงื่อนไขเฉลี่ยคืน' },
      ],
    },
  },
  '00023918': {
    '2568': {
      divRate: 4.00, avgRate: 10.00,
      shareBegin: 84000, monthlyShare: 800,
      special:  { 6: 3000 },
      withdraw: { 10: 2000 },
      yearEndShare: 92800,
      interest: [
        { contract: 'สญ.6611302', kind: 'เงินกู้ฉุกเฉิน', payDate: '20/03/2568', term: '3/12', principal: 4000, interest: 1450, penalty: 0, eligible: true, note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6611302', kind: 'เงินกู้ฉุกเฉิน', payDate: '20/06/2568', term: '6/12', principal: 4000, interest: 1180, penalty: 0, eligible: true, note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6611302', kind: 'เงินกู้ฉุกเฉิน', payDate: '22/09/2568', term: '9/12', principal: 4000, interest: 920,  penalty: 0, eligible: true, note: 'ดอกเบี้ยปกติ' },
      ],
    },
  },
  '00031024': {
    '2568': {
      divRate: 4.00, avgRate: 10.00,
      shareBegin: 210000, monthlyShare: 1500,
      special:  {},
      withdraw: { 9: 223500 },   // ถอนหุ้นทั้งหมดเมื่อลาออก ก.ย.
      yearEndShare: 0,
      resignMonth: 9,
      interest: [
        { contract: 'สญ.6512088', kind: 'เงินกู้สามัญ', payDate: '31/01/2568', term: '12/48', principal: 9000, interest: 2400, penalty: 0, eligible: true, note: 'ดอกเบี้ยปกติ' },
        { contract: 'สญ.6512088', kind: 'เงินกู้สามัญ', payDate: '28/02/2568', term: '13/48', principal: 9000, interest: 2300, penalty: 0, eligible: true, note: 'ดอกเบี้ยปกติ' },
      ],
    },
  },
};

window.DCT_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

// ปีปันผลที่สมาชิกรายนี้มีข้อมูล
window.dctYearsOf = (code) => Object.keys(window.DCT_DATA[code] || {});

// คืนข้อมูลฐานของสมาชิกตามปี
window.dctBase = (code, year) => {
  const byYear = window.DCT_DATA[code];
  if (!byYear) return null;
  return byYear[year] || byYear[Object.keys(byYear)[0]] || null;
};

// ─── คำนวณตารางหุ้นรายเดือน (ถ่วงอายุหุ้น) ───────────────────────────
//  อายุหุ้น: ม.ค.=12 … ธ.ค.=1 (นับเดือนที่ซื้อเป็นเดือนเต็ม)
//  ยอดคำนวณ (ถ่วงอายุ) = ยอดหุ้นคงเหลือสิ้นเดือน × อายุหุ้น / 12
//  ปันผลรายเดือน        = ยอดคำนวณ × อัตราปันผล / 100 / 12
window.dctComputeMonthly = (base, rate) => {
  let balance = base.shareBegin;
  const rows = [];
  let sumMonthly = 0, sumSpecial = 0, sumWithdraw = 0, sumWeighted = 0, sumDiv = 0;
  for (let i = 0; i < 12; i++) {
    const mNo = i + 1;
    const monthly = base.monthlyShare || 0;
    const special = (base.special && base.special[mNo]) || 0;
    const withdraw = (base.withdraw && base.withdraw[mNo]) || 0;
    balance = balance + monthly + special - withdraw;
    const age = 12 - i;
    const weighted = balance * age / 12;
    const div = weighted * (rate / 100) / 12;
    rows.push({ month: window.DCT_MONTHS[i], age, monthly, special, withdraw, balance, weighted, rate, div });
    sumMonthly += monthly; sumSpecial += special; sumWithdraw += withdraw;
    sumWeighted += weighted; sumDiv += div;
  }
  return {
    rows, sumMonthly, sumSpecial, sumWithdraw,
    balanceEnd: balance, sumWeighted, sumDiv,
  };
};

// ─── คำนวณยอดทั้งหมด (ปันผล + เฉลี่ยคืน + สุทธิ) ──────────────────────
//  source: 'yearend' = ใช้หุ้นสุทธิสิ้นปี (snapshot)  → headline
//          อื่น ๆ     = ใช้ฐานถ่วงอายุหุ้นรายเดือน
window.dctCompute = (code, year, opts) => {
  const base = window.dctBase(code, year);
  if (!base) return null;
  const o = opts || {};
  const rate = o.divRate != null ? o.divRate : base.divRate;
  const avgRate = o.avgRate != null ? o.avgRate : base.avgRate;
  const source = o.source || 'yearend';
  const member = (window.DCT_MEMBERS || []).find(m => m.code === code) || {};
  const status = window.dctStatus(o.status || member.status || 'normal');

  const monthly = window.dctComputeMonthly(base, rate);

  // ── ปันผล ──
  const useYearEnd = source === 'yearend' || source === 'closed';
  const netShare = useYearEnd ? base.yearEndShare : monthly.balanceEnd;
  const dividend = useYearEnd ? netShare * rate / 100 : monthly.sumDiv;
  const dividendFull = base.yearEndShare * rate / 100;   // ยอดเต็มวิธีสิ้นปี (อ้างอิง)

  // ── เฉลี่ยคืน ──
  const interest = base.interest || [];
  const interestPaid   = interest.reduce((a, r) => a + (r.interest || 0), 0);
  const interestPenalty= interest.reduce((a, r) => a + (r.penalty || 0), 0);
  const interestExcl   = interest.filter(r => !r.eligible).reduce((a, r) => a + (r.interest || 0), 0);
  const eligibleInterest = interest.filter(r => r.eligible).reduce((a, r) => a + (r.interest || 0), 0);
  const avgReturn = eligibleInterest * avgRate / 100;

  // ── สิทธิ์ ──
  const divEligible = status.eligible && monthly.balanceEnd > 0 && netShare > 0;
  const avgEligible = status.eligible && eligibleInterest > 0;

  // ── รายการหัก ──
  const ded = o.deductions || {};
  const dedArrears = +ded.arrears || 0;
  const dedSeize   = +ded.seize || 0;
  const dedTax     = +ded.tax || 0;
  const dedOther   = +ded.other || 0;
  const dedTotal   = dedArrears + dedSeize + dedTax + dedOther;

  // ── สุทธิ ──
  const divPay = divEligible ? dividend : 0;
  const avgPay = avgEligible ? avgReturn : 0;
  const divNet = Math.max(divPay - 0, 0);                 // หักเฉพาะจากปันผล (สาธิต = แยกรวมท้าย)
  const grossPay = divPay + avgPay;
  const netTotal = grossPay - dedTotal;

  return {
    base, rate, avgRate, source, status, member,
    monthly,
    netShare, dividend, dividendFull,
    interestPaid, interestPenalty, interestExcl, eligibleInterest, avgReturn,
    divEligible, avgEligible,
    dedArrears, dedSeize, dedTax, dedOther, dedTotal,
    divPay, avgPay, grossPay, netTotal,
  };
};

// ─── ค้นหาสมาชิก (รับ criteria object ตาม DS) ────────────────────────
window.dctSearchMembers = (criteria) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const c = criteria || {};
  const code = norm(c.code), fn = norm(c.firstName), ln = norm(c.lastName),
        cid = norm(c.citizenId), un = norm(c.unit);
  return (window.DCT_MEMBERS || []).filter(m =>
    (!code || norm(m.code).includes(code)) &&
    (!fn   || norm(m.firstName || m.name).includes(fn)) &&
    (!ln   || norm(m.lastName || m.name).includes(ln)) &&
    (!cid  || norm(m.citizenId).includes(cid)) &&
    (!un   || norm(m.dept).includes(un)));
};
