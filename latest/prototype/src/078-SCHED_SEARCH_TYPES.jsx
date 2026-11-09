// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ตารางการชำระเงิน
//  ข้อมูลตัวอย่าง: รายการจ่ายเงินกู้ (ค้นหาในป๊อปอัพ) + ตัวช่วยคำนวณ
//  ผังการชำระเงิน (amortization) ตามเงื่อนไขที่ผู้ใช้กำหนด
// ════════════════════════════════════════════════════════════════════

// รูปแบบการค้นหา (dropdown ส่วนรายละเอียดผู้กู้)
window.SCHED_SEARCH_TYPES = [
  { value: 'reqNo',      label: 'ระบุเลขที่ใบคำขอ' },
  { value: 'contractNo', label: 'ระบุเลขที่สัญญา' },
  { value: 'memberCode', label: 'ระบุเลขที่สมาชิก' },
];

// แหล่งที่มาของยอดเงินกู้ที่นำมาคำนวณ
window.SCHED_AMOUNT_SOURCES = [
  { value: 'approved',  label: 'ยอดอนุมัติ' },
  { value: 'requested', label: 'ยอดขอกู้' },
  { value: 'balance',   label: 'ยอดคงเหลือ' },
];

// วิธีประมาณการดอกเบี้ย
window.SCHED_INTEREST_METHODS = [
  { value: 'daily',   label: 'คิดเป็นรายวัน' },
  { value: 'monthly', label: 'คิดเป็นรายเดือน' },
];

// แบบการชำระ (โครงสร้างการหักต้น/ดอก)
window.SCHED_PAY_TYPES = [
  { value: 'eqp', label: 'ต้นเท่ากันทุกงวด+ดอก' },
  { value: 'eqi', label: 'คงยอด (ต้น+ดอกเท่ากัน)' },
];

// เงื่อนไขวันชำระ
window.SCHED_DUE_CONDITIONS = [
  { value: 'eom',   label: 'ทุกสิ้นเดือน' },
  { value: 'fixed', label: 'ทุกวันที่กำหนด' },
];

// วิธีการจ่ายเงินกู้ (สำหรับตารางค้นหา)
const _schedPaidBy = ['โอนเข้าบัญชีธนาคาร', 'เงินสด', 'เช็คธนาคาร'];

// ─── ข้อมูลตัวอย่าง: รายการจ่ายเงินกู้ (ค้นหาในป๊อปอัพ) ──────────────
//  ใช้เลือกสัญญา/คำขอ แล้วดึงพารามิเตอร์มาเติมในฟอร์มคำนวณ
window.SCHED_DISBURSEMENTS = [
  {
    reqNo: 'LR-2569-00421', payDate: '2026-01-22', contractNo: 'L-2569-0148',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    unit: '0801 · กลุ่มงานบัญชีและงบประมาณ', loanType: 'กู้สามัญ',
    paidBy: 'โอนเข้าบัญชีธนาคาร', poPayee: 'ปณ.เมืองนนทบุรี', status: 'จ่ายแล้ว',
    approvedAmount: 500000, requestedAmount: 550000, balance: 500000,
    annualRate: 6.25, installments: 10, payType: 'eqp',
    startDate: '2026-01-22', dueCondition: 'eom', dueDay: 30, firstPayMonth: '2026-01',
    interestMethod: 'daily',
  },
  {
    reqNo: 'LR-2569-00388', payDate: '2025-12-15', contractNo: 'L-2568-0291',
    memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    unit: '0801 · กลุ่มงานบัญชีและงบประมาณ', loanType: 'กู้พิเศษ',
    paidBy: 'เช็คธนาคาร', poPayee: '—', status: 'จ่ายแล้ว',
    approvedAmount: 280000, requestedAmount: 300000, balance: 240800,
    annualRate: 5.75, installments: 60, payType: 'eqi',
    startDate: '2025-12-15', dueCondition: 'fixed', dueDay: 25, firstPayMonth: '2026-01',
    interestMethod: 'monthly',
  },
  {
    reqNo: 'LR-2569-00455', payDate: '2026-02-10', contractNo: 'L-2569-0518',
    memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์',
    unit: '0301 · กลุ่มงานโยธา', loanType: 'กู้สามัญ',
    paidBy: 'โอนเข้าบัญชีธนาคาร', poPayee: 'ปณ.บางกรวย', status: 'จ่ายแล้ว',
    approvedAmount: 420000, requestedAmount: 420000, balance: 420000,
    annualRate: 6.25, installments: 24, payType: 'eqp',
    startDate: '2026-02-10', dueCondition: 'eom', dueDay: 30, firstPayMonth: '2026-02',
    interestMethod: 'daily',
  },
  {
    reqNo: 'LR-2569-00460', payDate: '2026-02-18', contractNo: 'E-2569-0044',
    memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ',
    unit: '0601 · กลุ่มงานบริการ', loanType: 'กู้ฉุกเฉิน',
    paidBy: 'เงินสด', poPayee: '—', status: 'รอจ่าย',
    approvedAmount: 30000, requestedAmount: 30000, balance: 30000,
    annualRate: 6.50, installments: 12, payType: 'eqp',
    startDate: '2026-02-18', dueCondition: 'fixed', dueDay: 28, firstPayMonth: '2026-03',
    interestMethod: 'daily',
  },
];

// ค้นหารายการจ่ายเงินกู้ตามเกณฑ์ (เลขสมาชิก / เลขคำขอ / เลขสัญญา)
window.searchSchedDisbursements = (criteria) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const c = {
    memberCode: norm(criteria.memberCode),
    reqNo: norm(criteria.reqNo),
    contractNo: norm(criteria.contractNo),
    name: (criteria.name || '').trim().toLowerCase(),
  };
  const any = Object.values(c).some(Boolean);
  if (!any) return window.SCHED_DISBURSEMENTS;
  return window.SCHED_DISBURSEMENTS.filter((d) => {
    if (c.memberCode && !norm(d.memberCode).includes(c.memberCode)) return false;
    if (c.reqNo && !norm(d.reqNo).includes(c.reqNo)) return false;
    if (c.contractNo && !norm(d.contractNo).includes(c.contractNo)) return false;
    if (c.name && !d.memberName.toLowerCase().includes(c.name)) return false;
    return true;
  });
};

// ─── ตัวช่วยจัดการวันที่ (หลีกเลี่ยงปัญหา timezone — ใช้ตัวเลขล้วน) ───
const _schedLastDay = (y, m1) => new Date(y, m1, 0).getDate(); // m1 = เดือน 1-based
const _schedISO = (y, m1, d) => `${y}-${String(m1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const _schedDaysBetween = (isoA, isoB) => {
  if (!isoA || !isoB) return 0;
  const a = new Date(isoA + 'T00:00:00'), b = new Date(isoB + 'T00:00:00');
  return Math.max(0, Math.round((b - a) / 86400000));
};
window.schedDaysBetween = _schedDaysBetween;

// คำนวณวันชำระของงวดที่ idx (0-based) จากเดือนเริ่มชำระครั้งแรก + เงื่อนไข
window.schedDueDate = (firstPayMonth, dueCondition, dueDay, idx) => {
  if (!firstPayMonth) return '';
  const [fy, fm] = firstPayMonth.split('-').map(Number);
  // เลื่อนไป idx เดือน
  const total = (fy * 12 + (fm - 1)) + idx;
  const y = Math.floor(total / 12);
  const m1 = (total % 12) + 1;
  const lastD = _schedLastDay(y, m1);
  let day;
  if (dueCondition === 'eom') day = lastD;
  else day = Math.min(Number(dueDay) || lastD, lastD);
  return _schedISO(y, m1, day);
};

const _sr2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// ─── คำนวณตารางแผนการชำระเงิน (amortization) ─────────────────────────
//  params: { amount, annualRate, installments, payType, installmentAmount,
//            startDate, firstPayMonth, dueCondition, dueDay, interestMethod }
//  คืนค่า { rows[], totals }
window.calcSchedule = (p) => {
  const amount   = Number(p.amount) || 0;
  const rate     = Number(p.annualRate) || 0;
  const n        = Math.max(1, Math.floor(Number(p.installments) || 0));
  const payType  = p.payType || 'eqp';
  const method   = p.interestMethod || 'daily';
  const rows = [];

  let balance = amount;
  const basePrincipal = _sr2(amount / n);
  const fixedInstallment = Number(p.installmentAmount) || 0;

  let prevDate = p.startDate || window.schedDueDate(p.firstPayMonth, p.dueCondition, p.dueDay, 0);

  for (let i = 0; i < n; i++) {
    const dueDate = window.schedDueDate(p.firstPayMonth, p.dueCondition, p.dueDay, i);
    const days = _schedDaysBetween(prevDate, dueDate);

    // ดอกเบี้ยของงวด
    const interest = method === 'monthly'
      ? _sr2(balance * (rate / 100) / 12)
      : _sr2(balance * (rate / 100) * (days / 365));

    // เงินต้นของงวด
    let payPrincipal;
    if (payType === 'eqi' && fixedInstallment > 0) {
      payPrincipal = _sr2(fixedInstallment - interest);
    } else {
      payPrincipal = basePrincipal;
    }
    // งวดสุดท้าย (หรือเมื่อเหลือน้อยกว่าค่างวด) — ปิดยอดต้นคงเหลือทั้งหมด
    if (i === n - 1 || payPrincipal >= balance) payPrincipal = _sr2(balance);
    if (payPrincipal < 0) payPrincipal = 0;

    const broughtForward = _sr2(balance);
    const remaining = _sr2(balance - payPrincipal);
    const totalPay = _sr2(payPrincipal + interest);

    rows.push({
      seq: i + 1,
      broughtForward,
      dueDate,
      days,
      payPrincipal,
      payInterest: interest,
      totalPay,
      remaining,
    });

    balance = remaining;
    prevDate = dueDate;
    if (balance <= 0) break;
  }

  const totals = rows.reduce((a, r) => ({
    principal: _sr2(a.principal + r.payPrincipal),
    interest: _sr2(a.interest + r.payInterest),
    total: _sr2(a.total + r.totalPay),
  }), { principal: 0, interest: 0, total: 0 });

  return { rows, totals };
};

// ประมาณค่างวดต่อเดือน (สำหรับเติมช่อง "ชำระ/งวด" อัตโนมัติ)
window.schedEstimateInstallment = (p) => {
  const r = window.calcSchedule(p);
  if (!r.rows.length) return 0;
  // ใช้ค่างวดเฉลี่ย (รวมทั้งหมด ÷ จำนวนงวด)
  return _sr2(r.totals.total / r.rows.length);
};
