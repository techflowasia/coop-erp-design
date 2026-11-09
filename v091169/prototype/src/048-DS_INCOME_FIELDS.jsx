// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ใบคำขอพักชำระหนี้
//  ข้อมูลสาธิต: รายการเงินได้/เงินหัก · รูปแบบการพักชำระ · สถานะ
//  ข้อมูลสัญญาเพิ่มเติม (ยอดอนุมัติ/ยอดรอเบิก) · ทะเบียนคำขอ
//  ใช้สมาชิก/สัญญาจาก DN_MEMBERS (data-debt-notice.js)
// ════════════════════════════════════════════════════════════════════

// ─── รายการเงินได้ (income) — ตามแบบฟอร์มคำขอ ───────────────────────
window.DS_INCOME_FIELDS = [
  { k: 'salary',        l: 'เงินเดือน' },
  { k: 'childAllow',    l: 'ค่าช่วยเหลือบุตร' },
  { k: 'overtime',      l: 'ค่าล่วงเวลา',                 hl: true },
  { k: 'healthAllow',   l: 'เงินบำรุงสุขภาพ' },
  { k: 'costOfLiving',  l: 'ค่าครองชีพ' },
  { k: 'subsistence',   l: 'เงินยังชีพ' },
  { k: 'housingPriv',   l: 'เงินเบิกค่าบ้านพักเอกชน',     hl: true },
  { k: 'profSpecial',   l: 'เงินเพิ่มพิเศษวิชาชีพเฉพาะ' },
  { k: 'shiftSpecial',  l: 'เงินเพิ่มพิเศษเป็นกะ' },
  { k: 'hazardPay',     l: 'เงินเสี่ยงภัยอันตราย' },
];

// ─── รายการเงินหัก (deductions) — ตามแบบฟอร์มคำขอ ──────────────────
window.DS_DEDUCT_FIELDS = [
  { k: 'incomeTax',     l: 'ภาษีเงินได้' },
  { k: 'providentFund', l: 'กองทุนสำรองเลี้ยงชีพ' },
  { k: 'mcInterest',    l: 'ดอกเบี้ยเงินกู้ซื้อจักรยานยนต์' },
  { k: 'mcPrincipal',   l: 'เงินหักเงินกู้ซื้อจักรยานยนต์' },
  { k: 'judgmentDebt',  l: 'หนี้ตามคำพิพากษา' },
  { k: 'funeralFund',   l: 'ฌปท.' },
  { k: 'coopShareLoan', l: 'ค่าหุ้นและเงินกู้สหกรณ์', note: '*ไม่รวมสัญญาพักหนี้' },
  { k: 'housingGsb',    l: 'กู้การเคหะ/ธ.ออมสิน' },
  { k: 'necessityLoan', l: 'กู้กรณีจำเป็น' },
];

// ─── รูปแบบการพักชำระ (ชำระแบบ) ─────────────────────────────────────
window.DS_PAY_MODES = [
  { v: 'hold-principal',  l: 'คงต้น',          code: '-11',
    desc: 'พักชำระเงินต้น คงชำระดอกเบี้ยตามปกติ' },
  { v: 'waive-principal', l: 'งดต้น',          code: '-12',
    desc: 'งดชำระเงินต้น ผ่อนเฉพาะดอกเบี้ยค้างเป็นงวด' },
  { v: 'hold-all',        l: 'พักทั้งจำนวน',    code: '-13',
    desc: 'พักชำระทั้งเงินต้นและดอกเบี้ยตลอดช่วงพักชำระ' },
];
window.dsPayMode = (v) => window.DS_PAY_MODES.find(m => m.v === v) || window.DS_PAY_MODES[0];

// ─── รูปแบบการชำระคืน (อ้างอิงสัญญาเดิม — อ่านอย่างเดียว) ─────────────
//  มีเพียง คงต้น / คงยอด และยึดตามสัญญาเงินกู้เดิม ผู้ใช้แก้ไขไม่ได้
window.DS_REPAY_TYPES = [
  { v: 'คงต้น', l: 'คงต้น', code: '1',
    desc: 'ตัดเงินต้นเท่ากันทุกงวด ดอกเบี้ยลดลงตามเงินต้นคงเหลือ' },
  { v: 'คงยอด', l: 'คงยอด', code: '2',
    desc: 'ยอดชำระต่องวดคงที่ (เงินต้น + ดอกเบี้ยรวมเท่ากันทุกงวด)' },
];
window.dsRepayType = (v) => window.DS_REPAY_TYPES.find(m => m.v === v) || window.DS_REPAY_TYPES[1];
// derive รูปแบบการชำระคืนจากเลขที่สัญญาแบบคงที่ (เดโม — ยึดจากสัญญาเดิม)
window.dsDeriveRepayType = (contractNo) => {
  const digits = String(contractNo || '').replace(/[^0-9]/g, '');
  const sum = digits.split('').reduce((s, c) => s + Number(c), 0);
  return sum % 2 === 0 ? 'คงยอด' : 'คงต้น';
};

// ─── จำนวนเดือนพักชำระ ──────────────────────────────────────────────
window.DS_MONTH_OPTIONS = [3, 6, 9, 12, 24];

// ─── สถานะคำขอ ──────────────────────────────────────────────────────
window.DS_STATUS = [
  { v: 'recorded',  l: 'บันทึกแล้ว',  pill: 'info' },
  { v: 'effective', l: 'มีผลแล้ว',     pill: 'ok' },
  { v: 'cancelled', l: 'ยกเลิก',       pill: 'neutral' },
];
window.dsStatus = (v) => window.DS_STATUS.find(s => s.v === v) || window.DS_STATUS[0];

// ─── ข้อมูลสัญญาเพิ่มเติม (ยอดอนุมัติ / ยอดรอเบิก) ต่อเลขสัญญา ──────
//  ยอดคงเหลือ = principalRemaining, ดอกเบี้ยค้าง = interestDue (จาก DN debt)
window.DS_CONTRACT_EXTRA = {
  'L-2022-0455': { approved: 500000, pendingDisburse: 0 },
  'EM-2024-0771': { approved: 30000,  pendingDisburse: 0 },
  'L-2021-0332': { approved: 350000, pendingDisburse: 0 },
  'L-2020-0118': { approved: 800000, pendingDisburse: 0 },
};
window.dsContractInfo = (d) => {
  if (!d) return null;
  const extra = window.DS_CONTRACT_EXTRA[d.contractNo] || {};
  const remaining = Number(d.principalRemaining) || 0;
  return {
    contractNo: d.contractNo,
    loanType: d.type,
    lastTerm: Number(d.paidTerms) || 0,
    totalTerms: Number(d.totalTerms) || 0,
    installment: Number(d.installment) || 0,
    approved: extra.approved != null ? extra.approved : Math.ceil(remaining / 10000) * 10000,
    pendingDisburse: extra.pendingDisburse != null ? extra.pendingDisburse : 0,
    remaining,
    interestDue: Number(d.interestDue) || 0,
    status: d.status || '',
    repayType: extra.repayType || d.repayType || window.dsDeriveRepayType(d.contractNo),
  };
};

// ─── ข้อมูลเงินได้/เงินหักของสมาชิก (ดึงอัตโนมัติเมื่อเลือกสมาชิก) ───
//  ค่าตั้งต้นต่อสมาชิก — แก้ไขเพิ่มได้ในแบบฟอร์ม
window.DS_MEMBER_PAYROLL = {
  'M-067012': {
    income:  { salary: 35000, childAllow: 1200, overtime: 1500, healthAllow: 600,
               costOfLiving: 1000, subsistence: 800, housingPriv: 700, profSpecial: 1000,
               shiftSpecial: 500, hazardPay: 300 },
    deduct:  { incomeTax: 2500, providentFund: 3000, mcInterest: 1200, mcPrincipal: 2000,
               judgmentDebt: 0, funeralFund: 800, coopShareLoan: 4500, housingGsb: 1500,
               necessityLoan: 0 },
    updatedDate: '2026-06-15',
  },
  'M-066238': {
    income:  { salary: 28600, childAllow: 0, overtime: 0, healthAllow: 0,
               costOfLiving: 1000, subsistence: 0, housingPriv: 0, profSpecial: 0,
               shiftSpecial: 0, hazardPay: 0 },
    deduct:  { incomeTax: 1450, providentFund: 2200, mcInterest: 0, mcPrincipal: 0,
               judgmentDebt: 0, funeralFund: 800, coopShareLoan: 6400, housingGsb: 0,
               necessityLoan: 1800 },
    updatedDate: '2026-05-30',
  },
  'M-065471': {
    income:  { salary: 41200, childAllow: 0, overtime: 800, healthAllow: 0,
               costOfLiving: 1000, subsistence: 0, housingPriv: 0, profSpecial: 2200,
               shiftSpecial: 0, hazardPay: 0 },
    deduct:  { incomeTax: 3100, providentFund: 3600, mcInterest: 0, mcPrincipal: 0,
               judgmentDebt: 5200, funeralFund: 800, coopShareLoan: 8200, housingGsb: 2400,
               necessityLoan: 0 },
    updatedDate: '2026-06-03',
  },
};
window.dsMemberPayroll = (code) => {
  const p = window.DS_MEMBER_PAYROLL[code];
  const blankInc = {}, blankDed = {};
  window.DS_INCOME_FIELDS.forEach(f => blankInc[f.k] = 0);
  window.DS_DEDUCT_FIELDS.forEach(f => blankDed[f.k] = 0);
  if (!p) return { income: blankInc, deduct: blankDed, updatedDate: null };
  return {
    income: { ...blankInc, ...p.income },
    deduct: { ...blankDed, ...p.deduct },
    updatedDate: p.updatedDate || null,
  };
};

// ─── ผลรวม + รายได้คำนวณ ────────────────────────────────────────────
window.dsSumIncome = (inc) => window.DS_INCOME_FIELDS.reduce((s, f) => s + (Number(inc[f.k]) || 0), 0);
window.dsSumDeduct = (ded) => window.DS_DEDUCT_FIELDS.reduce((s, f) => s + (Number(ded[f.k]) || 0), 0);

// ─── ผู้บันทึก (ล็อกอินปัจจุบัน) ─────────────────────────────────────
window.DS_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── เลขที่คำขอ (auto) — PMT-{พ.ศ.}-{running 6 หลัก} ────────────────
window.dsNextNo = (list, beYear) => {
  const prefix = `PMT-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n) && n > mx) return n;
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(6, '0');
};

// ─── สร้างตารางการชำระหนี้แบบแจกแจงทีละงวด ──────────────────
//  คืน N แถว (N = จำนวนเดือน) — แต่ละแถวครอบ 1 งวด (from → from+1)
//   • ชำระต่องวด = perInstallment (เท่ากันทุกงวด)
//   • ผ่อนดอกเบี้ยค้าง = ดอกเบี้ยค้างรวม ÷ N (เศษไปลงงวดสุดท้าย)
//  ยอดรวมคอลัมน์ “ผ่อนดอกเบี้ยค้าง” = ดอกเบี้ยค้างรวมพอดี (สอดคล้องกับหน้าจอ)
window.dsBuildSchedule = ({ lastTerm, months, perInstallment, interestDue, date }) => {
  const N = Number(months) || 0;
  if (!(N > 0)) return [];
  const per = Number(perInstallment) || 0;
  const totalInt = Number(interestDue) || 0;
  const perInt = Math.round(totalInt / N);
  const start = (Number(lastTerm) || 0) + 1;
  const rows = [];
  for (let i = 0; i < N; i++) {
    const from = start + i;
    // งวดสุดท้ายรับเศษเพื่อให้ยอดรวมตรงกับดอกเบี้ยค้างรวม
    const interestInstallment = i === N - 1 ? (totalInt - perInt * (N - 1)) : perInt;
    rows.push({ from, to: from + 1, perInstallment: per, interestInstallment, enteredDate: date });
  }
  return rows;
};

// ─── เดือนไทย (ตัวเลือก ตั้งแต่เดือน) ────────────────────────────────
window.DS_TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
//  คืนตัวเลือกเดือน 18 เดือนนับจากเดือนปัจจุบัน → [{ v:'2026-06', l:'มิถุนายน 2569' }]
window.dsMonthOptions = (fromIso) => {
  const base = fromIso ? new Date(fromIso) : new Date();
  const out = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ v, l: `${window.DS_TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}` });
  }
  return out;
};
window.dsMonthLabel = (v) => {
  if (!v) return '—';
  const [y, m] = String(v).split('-').map(Number);
  if (!y || !m) return v;
  return `${window.DS_TH_MONTHS[m - 1]} ${y + 543}`;
};

// ─── ข้อมูลสาธิต (ทะเบียนคำขอพักชำระหนี้) ──────────────────────────
window.DS_SEED = [
  {
    id: 'PMT-2569-000001', recordDate: '2026-06-15',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    dept: 'กองช่าง', deptCode: '0301',
    contractNo: 'L-2022-0455', loanType: 'เงินกู้สามัญ',
    lastTerm: 36, approved: 500000, pendingDisburse: 0, remaining: 320000, interestDue: 12350,
    income: window.DS_MEMBER_PAYROLL['M-067012'].income,
    deduct: window.DS_MEMBER_PAYROLL['M-067012'].deduct,
    months: 6, startMonth: '2026-06', payMode: 'waive-principal',
    perInstallment: 3500, payTerms: 6,
    note: 'พักชำระต้นเงิน 6 เดือน คงชำระดอกเบี้ยตามปกติ',
    schedule: window.dsBuildSchedule({ lastTerm: 36, months: 6, perInstallment: 3500, interestDue: 12350, date: '2026-06-15' }),
    status: 'recorded',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-06-15T11:18:00',
  },
  {
    id: 'PMT-2569-000002', recordDate: '2026-05-22',
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    dept: 'กองการศึกษา', deptCode: '0501',
    contractNo: 'L-2021-0332', loanType: 'เงินกู้สามัญ',
    lastTerm: 41, approved: 350000, pendingDisburse: 0, remaining: 276400, interestDue: 18920,
    income: window.DS_MEMBER_PAYROLL['M-066238'].income,
    deduct: window.DS_MEMBER_PAYROLL['M-066238'].deduct,
    months: 12, startMonth: '2026-06', payMode: 'hold-all',
    perInstallment: 0, payTerms: 12,
    note: 'สมาชิกลาออกจากราชการ — พักชำระทั้งจำนวน 12 เดือน ระหว่างจัดทำหนังสือรับสภาพหนี้',
    schedule: window.dsBuildSchedule({ lastTerm: 41, months: 12, perInstallment: 1577, interestDue: 18920, date: '2026-05-22' }),
    status: 'effective',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-22T09:42:00',
  },
];

// ─── โหลด / บันทึก localStorage ─────────────────────────────────────
window.dsLoad = () => {
  try {
    const saved = localStorage.getItem('debt_suspensions');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.DS_SEED.map(r => ({ ...r }));
};
window.dsSaveLS = (list) => {
  try { localStorage.setItem('debt_suspensions', JSON.stringify(list)); } catch (e) {}
};

// ════════════════════════════════════════════════════════════════════
//  ส่วนขยาย: สัญญา R · หลักประกันบกพร่อง · เชื่อมโยงโครงการ
// ════════════════════════════════════════════════════════════════════

// ─── สัญญา R (ผู้ค้ำรับโอนหนี้แปลงมาเป็นของตน) — ต่อสมาชิก ──────────
//  พักชำระได้ทันที ไม่ต้องคำนวณ · พักได้ทุกสัญญาที่เป็น R
window.DS_R_CONTRACTS = {
  'M-067012': [
    { type: 'สัญญารับโอนผู้ค้ำ (R)', contractNo: 'R-2023-0098', status: 'ปกติ', kind: 'R',
      principalRemaining: 142000, interestDue: 0, penalty: 0,
      overdueInstallments: 0, installment: 3200, totalTerms: 60, paidTerms: 18 },
  ],
  'M-065471': [
    { type: 'สัญญารับโอนผู้ค้ำ (R)', contractNo: 'R-2022-0041', status: 'ปกติ', kind: 'R',
      principalRemaining: 88000, interestDue: 0, penalty: 0,
      overdueInstallments: 0, installment: 2500, totalTerms: 48, paidTerms: 22 },
    { type: 'สัญญารับโอนผู้ค้ำ (R)', contractNo: 'R-2024-0203', status: 'ปกติ', kind: 'R',
      principalRemaining: 56000, interestDue: 0, penalty: 0,
      overdueInstallments: 0, installment: 1800, totalTerms: 36, paidTerms: 6 },
  ],
};

// ─── หลักประกันบกพร่อง (ผู้ค้ำลาออก/ถูกให้ออก/เสียชีวิต) ต่อเลขสัญญา ──
//  ต้องทำรายการให้เรียบร้อยก่อนพักชำระ
window.DS_COLLATERAL_DEFECTS = {
  'L-2021-0332': { guarantor: 'นางวิภา จันทร์เพ็ญ (M-058244)', reason: 'ผู้ค้ำลาออกจากราชการ',
    action: 'รับโอนเลขสัญญาผู้ค้ำ หรือโอนหนี้กลับผู้กู้ก่อน' },
  'SP-2021-0144': { guarantor: 'นายอนุชา สุขสวัสดิ์ (M-058243)', reason: 'ผู้ค้ำถูกให้ออก/ไล่ออก',
    action: 'จัดหาผู้ค้ำรายใหม่ก่อนพักชำระ' },
};

// ─── รวมสัญญาปกติ + สัญญา R ของสมาชิก (ใช้ใน dropdown ใบคำขอ) ───────
window.dsMemberContracts = (m) => {
  if (!m) return [];
  const debts = (m.debts || []).map(d => ({ ...d, kind: /^R-/.test(d.contractNo || '') ? 'R' : 'normal' }));
  const rs = (window.DS_R_CONTRACTS[m.code] || []).map(d => ({ ...d, kind: 'R' }));
  return [...debts, ...rs];
};
window.dsIsRContract = (c) => !!c && (c.kind === 'R' || /^R-/.test((c.contractNo) || ''));
window.dsCollateralDefect = (contractNo) => window.DS_COLLATERAL_DEFECTS[contractNo] || null;

// ─── เคยใช้สิทธิโครงการนี้กับสัญญานี้แล้วหรือไม่ (1 ครั้ง/สัญญา) ─────
window.dsContractUsedProject = (list, contractNo, projectId) =>
  (list || []).some(r => r.contractNo === contractNo && r.projectId === projectId && r.status !== 'cancelled');
