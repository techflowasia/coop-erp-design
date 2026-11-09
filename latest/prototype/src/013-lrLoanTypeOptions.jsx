// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: ใบคำขอกู้เงิน (สร้างคำขอกู้)
//  เชื่อมโยงค่าคงที่ของระบบสินเชื่อทั้งหมด:
//   • ประเภทเงินกู้ (ผลิตภัณฑ์) ............ window.LP_SEED      (data-loantype.js)
//   • ตัวเลือก/ป้ายค่าคงที่ ................ window.LP_OPTS      (data-loantype.js)
//   • อัตราดอกเบี้ยเงินกู้ ................. window.IR_SEED      (data-intrate.js)
//   • วงเงินกู้กลุ่ม / วงเงินค้ำประกัน ...... LP settings อ้างถึง
//  เมื่อเลือก "ประเภทเงินกู้" ระบบจะดึงค่าคงที่ของผลิตภัณฑ์นั้นมาเติม
//  อัตโนมัติ: สิทธิวงเงิน · อัตราดอกเบี้ย · รูปแบบดอกเบี้ย · วิธีคำนวณงวด
//  · งวดสูงสุด · การบังคับทำประกัน · เงื่อนไขหลักประกัน ฯลฯ
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก "ประเภทเงินกู้" — ดึงเฉพาะผลิตภัณฑ์ที่เปิดใช้งานจากค่าคงที่ ──
//  อ่านค่าคงที่ที่บันทึกจริงจากเมนูค่าคงที่ (localStorage) — ไม่ใช่ข้อมูลตั้งต้น
const _lrCache = {};
const lrLive = (key, loader, seed) => {
  let raw = null;
  try { raw = localStorage.getItem(key); } catch (e) {}
  const c = _lrCache[key];
  if (c && c.raw === raw) return c.list;
  const list = loader ? loader() : (seed || []);
  _lrCache[key] = { raw, list };
  return list;
};
window.lrProducts = () => lrLive('loan_types', window.lpLoadAll, window.LP_SEED);
window.lrRateTables = () => lrLive('int_rates', window.irLoadAll, window.IR_SEED);

window.lrLoanTypeOptions = () =>
  window.lrProducts()
    .filter(p => p.enabled)
    .map(p => ({ v: p.id, l: `${p.code} — ${p.name}`, code: p.code, name: p.name }));

window.lrFindProduct = (id) => window.lrProducts().find(p => p.id === id) || null;

// ─── ค้นหาอัตราดอกเบี้ยจากค่าคงที่ (IR_SEED) ตามตาราง/วงเงิน/วันที่ ──────
//  คืนค่า { rate, code, name, effectiveDate, useAdjust } หรือ null
window.lrRateFor = (rateTable, amount, asOf) => {
  const ir = window.lrRateTables().find(r => r.code === rateTable && r.enabled !== false)
    || window.lrRateTables().find(r => r.code === rateTable);
  if (!ir || !(ir.rates || []).length) return null;
  const amt = Number(amount) || 0;
  const today = asOf || window.DEPOSIT_WORKING_DATE;
  // เลือกแถวที่ครอบคลุมวงเงิน และ effectiveDate ≤ วันนี้ (เอาวันล่าสุด)
  const candidates = ir.rates
    .filter(rt => amt >= rt.loanFrom && amt <= rt.loanTo && rt.effectiveDate <= today)
    .sort((a, b) => (a.effectiveDate < b.effectiveDate ? 1 : -1));
  const row = candidates[0] || ir.rates[0];
  if (!row) return null;
  return { rate: row.rate, code: ir.code, name: ir.name, effectiveDate: row.effectiveDate, useAdjust: row.useAdjust };
};

// ─── จำนวนงวดสูงสุดตามค่าคงที่ (installmentLimits ของผลิตภัณฑ์) ───────
window.lrMaxPeriodsFor = (product, amount) => {
  const rows = (product && product.installmentLimits) || [];
  const amt = Number(amount) || 0;
  const hit = rows.find(r => amt >= r.loanFrom && amt <= r.loanTo) || rows[0];
  return hit ? hit.maxPeriods : 0;
};

// ─── อัตราดอกเบี้ยของผลิตภัณฑ์ (แท็บดอกเบี้ย › ประเภทเงินกู้) ─────────
//  อัตรา = อัตราพื้นฐาน + เพิ่ม/ลด ตามเงินกู้ + เพิ่ม/ลด ตามช่วงเวลา (ไม่ต่ำกว่า 0)
//   • อัตราพื้นฐาน = อัตราจาก “ตารางอัตราที่ใช้” (ตามยอดเงินกู้/วันที่)
//       – แถวตามช่วงเวลาแบบ “คงที่” → ใช้อัตราของแถวแทน
//       – แถวตามเงินกู้แบบ “คงที่” → ใช้อัตราของแถวแทน (มีผลเหนือแถวตามช่วงเวลา)
//   • แถวตามเงินกู้ — ยอดทั้งก้อนใช้อัตราของช่วงที่ยอดตกอยู่
//       ยอดที่ใช้เทียบ = ยอดอนุมัติ (ณ วันขอกู้ ยอดคงเหลือ = ยอดอนุมัติ)
//   • แถวตามช่วงเวลา — ใช้แถวที่ครอบคลุมงวด/เดือนที่ระบุ (ใบคำขอ = งวดที่ 1)
window.lrProductRate = (product, amount, tableRate, month) => {
  const num = (v) => { const n = Number(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; };
  const amt = num(amount);
  const m = month || 1;
  const timeRow = ((product && product.interestTiers) || []).find(r =>
    m >= num(r.monthFrom) && m <= (num(r.monthTo) || Infinity)) || null;
  const amtRow = ((product && product.amountInterestTiers) || []).find(r =>
    amt >= num(r.amountFrom) && amt <= (num(r.amountTo) || Infinity)) || null;
  let base = num(tableRate), baseFrom = 'table';
  if (timeRow && timeRow.form === 'fixed') { base = num(timeRow.rate != null && timeRow.rate !== '' ? timeRow.rate : timeRow.fixedRate); baseFrom = 'time'; }
  if (amtRow && amtRow.form === 'fixed') { base = num(amtRow.rate); baseFrom = 'amount'; }
  const amountAdjust = amtRow ? num(amtRow.adjust) : 0;
  const timeAdjust = timeRow ? num(timeRow.adjust) : 0;
  const rate = Math.max(0, Math.round((base + amountAdjust + timeAdjust) * 10000) / 10000);
  return { rate, base, baseFrom, amountAdjust, timeAdjust, amountRow: amtRow, timeRow };
};

// ─── สรุปค่าที่ "ดึงจากค่าคงที่" เมื่อเลือกประเภทเงินกู้ ──────────────
//  ใช้แสดงผลและคำนวณงวด/ดอกเบี้ย — ทุกค่าผูกกับ window.LP_SEED / IR_SEED
window.lrDeriveFromProduct = (product, amount, asOf) => {
  if (!product) return null;
  const s = product.settings || {};
  const rateInfo = window.lrRateFor(s.rateTable, amount, asOf);
  const rateCalc = window.lrProductRate(product, amount, rateInfo ? rateInfo.rate : 0, 1);
  return {
    productCode: product.code,
    productName: product.name,
    maxLoanAmount: s.maxLoanAmount || 0,
    limitGroup: s.limitGroup,
    limitGroupLabel: window.lpLabel ? window.lpLabel('limitGroup', s.limitGroup) : s.limitGroup,
    rateTable: s.rateTable,
    rate: rateCalc.rate,
    tableRate: rateInfo ? rateInfo.rate : 0,
    rateParts: rateCalc,
    rateEffective: rateInfo ? rateInfo.effectiveDate : null,
    interestRateForm: s.interestRateForm,
    interestRateFormLabel: window.lpLabel ? window.lpLabel('interestRateForm', s.interestRateForm) : s.interestRateForm,
    repayMode: s.repayMode,
    repayModeLabel: window.lpLabel ? window.lpLabel('repayMode', s.repayMode) : s.repayMode,
    periodCalc: s.periodCalc,
    periodCalcLabel: window.lpLabel ? window.lpLabel('periodCalc', s.periodCalc) : s.periodCalc,
    defaultPayType: s.defaultPayType,
    maxPeriods: window.lrMaxPeriodsFor(product, amount),
    needCollateral: !!s.needCollateral,
    allowPersonGuar: !!s.allowPersonGuar,
    loanInsurance: s.loanInsurance,
    loanInsuranceLabel: window.lpLabel ? window.lpLabel('loanInsurance', s.loanInsurance) : s.loanInsurance,
    checkSalaryRemain: !!s.checkSalaryRemain,
    salaryRemainValue: s.salaryRemainValue || 0,
    guarLimitGroup: s.guarLimitGroup,
    guarLimitGroupLabel: window.lpLabel ? window.lpLabel('guarLimitGroup', s.guarLimitGroup) : s.guarLimitGroup,
    defaultPurpose: s.defaultPurpose,
  };
};

// ─── คำนวณงวดผ่อน/ดอกเบี้ยงวดแรก ตามรูปแบบการชำระของผลิตภัณฑ์ ──────
//  repayMode '1' = ต้นเท่ากันทุกงวด + ดอกตามคงเหลือ
//  repayMode '2'/'3' = ยอดผ่อนเท่ากันทุกงวด (annuity)
window.lrComputeInstallment = (amount, ratePct, periods, repayMode) => {
  const P = Number(amount) || 0;
  const n = Number(periods) || 0;
  const r = (Number(ratePct) || 0) / 100 / 12;
  if (!P || !n) return { payment: 0, principal: 0, interest: 0 };
  const interest1 = P * r;
  if (repayMode === '1') {
    const principal = P / n;
    return { payment: principal + interest1, principal, interest: interest1 };
  }
  // annuity
  const pay = r > 0 ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
  return { payment: pay, principal: pay - interest1, interest: interest1 };
};

// ─── บวกจำนวนเดือนเข้ากับวันที่ ISO → วันครบกำหนด ───────────────────
window.lrAddMonths = (iso, months) => {
  const d = new Date(iso || window.DEPOSIT_WORKING_DATE);
  d.setMonth(d.getMonth() + (Number(months) || 0));
  return d.toISOString().slice(0, 10);
};

// ─── สร้างตารางผ่อนชำระ (amortization) สำหรับการพิมพ์ ────────────────
//  คืน { rows, totals } — แต่ละ row: { n, date, balance, total, interest, principal, rate, days }
window.lrBuildSchedule = (amount, ratePct, periods, startIso) => {
  const P = Number(amount) || 0;
  const n = Math.max(1, Number(periods) || 0);
  const rAnnual = (Number(ratePct) || 0) / 100;
  const m = rAnnual / 12;
  const pay = m > 0 ? (P * m) / (1 - Math.pow(1 + m, -n)) : P / n;
  const rows = [];
  let bal = P;
  let prev = new Date(startIso || window.DEPOSIT_WORKING_DATE);
  let sumInt = 0, sumPrin = 0, sumPay = 0;
  for (let i = 1; i <= n; i++) {
    const cur = new Date(prev); cur.setMonth(cur.getMonth() + 1);
    const days = Math.max(1, Math.round((cur - prev) / 86400000));
    let interest = bal * rAnnual * days / 365;
    let principal = pay - interest;
    if (i === n || principal > bal) principal = bal;
    const total = principal + interest;
    bal = Math.max(0, bal - principal);
    rows.push({ n: i, date: cur.toISOString().slice(0, 10), balance: bal, total, interest, principal, rate: Number(ratePct) || 0, days });
    sumInt += interest; sumPrin += principal; sumPay += total;
    prev = cur;
  }
  return { rows, totals: { interest: sumInt, principal: sumPrin, total: sumPay } };
};

// ─── เลขที่ใบขอกู้ (running) — LR-<พ.ศ.>-<5 หลัก> ────────────────────
window._lrReqSeq = 4821;
window.lrNextReqNo = () => {
  const be = new Date(window.DEPOSIT_WORKING_DATE || Date.now()).getFullYear() + 543;
  window._lrReqSeq += 1;
  return `LR-${be}-${String(window._lrReqSeq).padStart(5, '0')}`;
};

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลสาธิต — คำขอกู้ตั้งต้น (ตรงกับตัวอย่างหน้าจอ)
// ════════════════════════════════════════════════════════════════════
window.LR_DEMO = {
  // ── ข้อมูลคำขอกู้ ──
  reqNo: 'LR-2569-04821',
  productId: 'LP-20',          // เงินกู้สามัญปกติ (เชื่อมกับ LP_SEED)
  reqDate: '2026-06-02',
  payDate: '2026-06-09',
  receiveDate: '2026-06-09',
  amount: 200000,
  purpose: 'debt',             // เชื่อมกับ LP_OPTS.loanPurpose
  prevDebt: 0,

  // ── ข้อมูลสมาชิก ──
  member: {
    code: 'M-058241',
    name: 'นายสมชาย ใจดี รักษ์ออม',
    unit: '0801 · กลุ่มงานบัญชีและงบประมาณ',
    phone: '081-234-5678',
    memberStatus: 'ปกติ',
    maritalStatus: 'สมรส (ชาย-หญิง)',
    spouse: 'นางมาลี ใจดี รักษ์ออม',
    birthDate: '1981-03-14',
    retireDate: '2041-09-30',
    joinDate: '2008-06-01',
    shareCapital: 789000,
    salary: 48750,
    otherIncome: 2000,
  },

  // ── สิทธิการกู้ / การชำระ (เริ่มต้น — บางค่าจะถูกคำนวณซ้ำตามค่าคงที่) ──
  entitlement: 1462500,        // สิทธิวงเงินของสมาชิกรายนี้ (60×เงินเดือน, ≤ เพดานผลิตภัณฑ์)
  rateAdd: 0,
  rateReduce: 0,
  interestCert: false,
  certPurposeDetail: '',      // รายละเอียดวัตถุประสงค์สำหรับหนังสือรับรองดอกเบี้ย
  payMethod: '0',              // คำนวณงวดปกติ (LP_OPTS.periodCalc)
  paySource: 'salary',
  sendablePeriods: 157,        // จำกัดตามอายุงานคงเหลือถึงเกษียณ

  // ── รายรับ-รายจ่าย ──
  income: { salary: 48750, other: 2000, deduct: 18030, fund: 0, remain: 32720, reduceRemainOn: true, reduceRemainPct: 0, checkRemain: true },
  payType: 'principal',        // ประเภทส่ง (คงต้น/คงยอด)

  // ── ยอดค้างลูกหนี้ตัวแทน (ยอดติดลบ) — แสดงใน popup "หักตัวแทน" ──
  agentArrears: [
    { period: '2569/01', amount: 10500 },
  ],

  // ── ประกัน ──
  insurances: [
    { type: 'ประกันชีวิต', company: 'ทิพยประกันชีวิต จำกัด (มหาชน)', amount: 200000, addCap: 0, reduceCap: 0, houseType: '—', capPerHouse: 0, detail: 'คุ้มครองตลอดอายุสัญญา' },
  ],

  // ── การจ่ายเงินกู้ ──
  disburses: [
    { method: 'โอนเงินฝากสหกรณ์', accNo: '001-2-58241-0', bankFrom: 'ธ.กรุงไทย', branch: 'สาขาแจ้งวัฒนะ', branchTo: 'สาขาแจ้งวัฒนะ', postcode: '11120', payer: 'มนตรี ศรีสุข', fee: 0, service: 0, tax: 0, net: 200000 },
  ],

  // ── หลักประกัน ──
  //  view = ข้อมูลที่แสดงในป๊อปอัป "ดูรายการหลักประกัน" (แยกตามประเภท)
  collaterals: [
    {
      type: 'คนค้ำประกัน', code: '01', ref: 'M-058243', detail: 'นายอนุชา สุขสวัสดิ์',
      maxRight: 200000, remainRight: 200000, amount: 200000, pct: 100, sharePeriod: 157, shareAcc: 650000, salary: 25000,
      view: {
        kind: 'person', typeName: 'คนค้ำประกัน',
        dates: [
          { label: 'วันเกิด',       date: '14/03/2519', years: '47.27' },
          { label: 'วันเกษียณ',     date: '01/10/2582', years: '16.30' },
          { label: 'วันเป็นสมาชิก', date: '05/06/2549', years: '17.04' },
          { label: 'วันเข้าทำงาน',  date: '01/04/2545', years: '24.21' },
        ],
        limit: { max: 200000, used: 0, locked: 0, remain: 200000, pct: '100.00%', ok: 200000 },
        rows: [
          { contract: 'ส6.66-004619', fname: 'อนุชา', lname: 'สุขสวัสดิ์', remain: 0, pct: '100.00%', guarAmt: 0 },
        ],
      },
    },
    {
      type: 'หุ้นค้ำประกัน', code: '02', ref: '567890', detail: 'ทุนเรือนหุ้นของผู้กู้',
      maxRight: 200000, remainRight: 200000, amount: 200000, pct: 100, sharePeriod: 157, shareAcc: 650000, salary: 25000,
      view: {
        kind: 'share', typeName: 'หุ้นค้ำประกัน',
        limit: { max: 200000, used: 0, locked: 0, remain: 200000, pct: '100.00%', ok: 200000 },
        rows: [
          { contract: 'ส6.66-004619', fname: 'อนุชา', lname: 'สุขสวัสดิ์', remain: 0, pct: '100.00%', guarAmt: 0 },
        ],
      },
    },
    {
      type: 'เงินฝากค้ำประกัน', code: '03', ref: '002-5-58241-7', detail: 'ออมทรัพย์พิเศษ · สมชาย ใจดี (ผู้กู้)',
      maxRight: 0, remainRight: 0, amount: 20000, pct: 10, amountManual: true,
      view: {
        kind: 'deposit', typeName: 'เงินฝากค้ำประกัน',
        rows: [
          { accNo: '002-5-58241-7', accName: 'สมชาย ใจดี', memberNo: '58241', memberName: 'สมชาย ใจดี', depType: 'ออมทรัพย์พิเศษ' },
        ],
      },
    },
    {
      type: 'หลักทรัพย์ค้ำประกัน', code: '04', ref: '654321', detail: 'โฉนดที่ดินนายอนุชา สุขสวัสดิ์',
      maxRight: 200000, remainRight: 200000, amount: 200000, pct: 100, sharePeriod: 157, shareAcc: 650000, salary: 25000,
      view: {
        kind: 'asset', typeName: 'หลักทรัพย์ค้ำประกัน',
        rows: [
          { reg: '654321', assetNo: 'AA12345', assetType: 'โฉนด', memberNo: '058243', memberName: 'นายอนุชา สุขสวัสดิ์', loanType: 'กู้สามัญ', mortgagePrice: 240000 },
        ],
      },
    },
    {
      type: 'พันธบัตร', code: '05', ref: '1234567890', detail: 'พันธบัตรรัฐบาลนายอนุชา สุขสวัสดิ์',
      maxRight: 200000, remainRight: 200000, amount: 200000, pct: 100, sharePeriod: 157, shareAcc: 650000, salary: 25000,
      view: {
        kind: 'bond', typeName: 'พันธบัตรค้ำประกัน',
        rows: [
          { bondNo: '0123456789', ownerName: 'นายอนุชา สุขสวัสดิ์', memberNo: '058243', memberName: 'นายอนุชา สุขสวัสดิ์', bondType: 'พันธบัตรรัฐบาล' },
        ],
      },
    },
  ],

  // ── จัดเก็บรายเดือน (หนี้เดิม/การหักชำระ) ──
  monthlyCollect: [
    { detail: 'ค่าหุ้น',                               payPrincipal: 2500,   payInterest: 0,      remaining: 789000 },
    { contract: 'ส6.66-004619', detail: 'ส6.66-004619 · สามัญปกติ',           payPrincipal: 500,    payInterest: 187.50, remaining: 30000 },
    { contract: 'ส6.66-004812', detail: 'ส6.66-004812 · พิเศษเพื่อที่อยู่อาศัย', payPrincipal: 988,    payInterest: 755.10, remaining: 181224 },
  ],

  // ── รายการหักกลบ — ข้อมูลตั้งต้นจากสัญญา (ยอดดอกเบี้ย/การเรียกเก็บคำนวณใน lrOffsetRows) ──
  offsetLoans: [
    { sel: true,  contract: 'ส6.66-004619', loanType: '20 — สามัญปกติ', rate: 7.5,
      approved: 60000, pendingDraw: 0, remaining: 30000, period: '60/120', intOverdue: 0,
      minPeriods: 6, minPct: 0 },
    { sel: false, contract: 'ส6.66-004812', loanType: '30 — เงินกู้พิเศษเพื่อที่อยู่อาศัย', rate: 5.0,
      approved: 200000, pendingDraw: 0, remaining: 181224, period: '19/120', intOverdue: 0,
      minPeriods: 12, minPct: 10 },
  ],

  // ── รายการหักอื่น ๆ ──
  otherDeducts: [
    { sel: true, code: '001', detail: 'เงินเฉลี่ยคืนค้างจ่าย', payer: 'นายสมชาย ใจดี', amount: 0, status: 'รออนุมัติ', manual: true },
  ],

  // ── เอกสารแนบ / รายละเอียดอื่น ──
  cmsCode: 'CMS-2569-018244',
  recordedBy: 'มนตรี ศรีสุข',
  recordDate: '2026-06-02',
  files: [
    { name: 'ใบคำขอกู้เงิน.pdf', size: '245.6 KB' },
  ],

  // ── ใบรายละเอียดสมาชิก (เอกสารพิมพ์แยก) — ประวัติ/สถานะครบตามรูปแบบเอกสารต้นฉบับ ──
  detailReport: {
    amlo: { status: 'ไม่เป็นบุคคลที่ถูกกำหนด', risk: 'ต่ำ' },
    statusNotes: [
      'ประกันชีวิต, F20 ส่งหนังสือโอนสิทธิ สธ766009103 วันที่เริ่มสัญญา 7 ธันวาคม 2566, F22 ยินยอมให้หักหนี้ สัญญา R ยินยอมให้หักหนี้สัญญา R',
      'ประกันชีวิตกลุ่ม มีผลวันที่ 23/03/2566, F35 เคยมีหนี้ สช/ส7 ก่อน 02/06/2568 สธ766009103,',
    ],
    share: { stopDate: '2026-03-26', accruedInterest: 66966.50 },
    loanContracts: [
      {
        contract: 'ส7.66-009103 (I)', tag: 'ประกันชีวิต (I) MTI', payType: 'คงยอด', contractDate: '2023-12-07',
        loanAmount: 2243298.77, rate: 5.25, payPerTerm: 15900, termsPaid: 32, totalTerms: 236,
        remainingCredit: 0, remaining: 2101225.53, lastPayDate: '2026-07-31', lastDbDate: '2026-07-31', lastCollectDate: '2026-07-31', overdueDbTerms: 0,
        guarantors: [
          { code: '047501', name: 'นายรัฐพงศ์ พราหมณ์โชติ', dept: '10605-ปณ.บางกอกใหญ่' },
          { code: '049869', name: 'นายมงคล สมัครเกษตรกรณ์', dept: '10600-ปณ.สำเหร่' },
          { code: '051390', name: 'น.ส.สรัญญา บำเหน็จพันธุ์ (ประกันชีวิต)', dept: '10209-ศป.หลักสี่' },
          { code: '054720', name: 'นายชลทิศ ศิริรวง', dept: '10600-ปณ.สำเหร่' },
          { code: '054932', name: 'นางทัณฑิกา ยมจินดา (ประกันชีวิต)', dept: '21000-ปจ.ระยอง' },
          { code: '059757', name: 'นางอมรรัตน์ ณ ถลาง', dept: '43000-ปจ.หนองคาย' },
        ],
        transferred: true,
      },
      {
        contract: 'ฉฉ.69-006319', tag: '', payType: 'คงต้น', contractDate: '2026-02-25',
        loanAmount: 250000, rate: 5.25, payPerTerm: 700, termsPaid: 2, totalTerms: 12,
        remainingCredit: 0, remaining: 248059.60, lastPayDate: '2026-07-31', lastDbDate: '2026-07-31', lastCollectDate: '2026-07-31', overdueDbTerms: 0,
        guarantors: [
          { code: '053125', name: 'นายปิยะภูมิ วงศ์เอกอักษร (ประกันชีวิต)', dept: '10600-ปณ.สำเหร่' },
        ],
        transferred: false,
      },
    ],
    transferCoGuarantors: [
      { contract: 'ส7.64-002839 (ป3IRJT)', name: 'น.ส.รฐาอร แทนศิริ', memberCode: '012457', dept: 'สนง.ไปรษณีย์นครหลวง 3 (07369)' },
      { contract: 'ส7.64-002839 (IRJT)', name: 'น.ส.อมรรัตน์ ทองมีสิทธิ์ (ลาออกจากงาน)', memberCode: '018832', dept: 'พ้นจากการปฏิบัติงาน (00555)' },
    ],
    paymentReceipts: [
      { receiptDate: '2554-05-30', paidDate: '2554-05-30', contract: 'สม.54-007472 (I)', rate: 6.50, docNo: '54018845', txnType: 'หักกลบ', amount: 127800.00, principal: 127800.00, interest: 0, remaining: 0 },
      { receiptDate: '2555-04-02', paidDate: '2555-04-02', contract: 'สม.54-011192 (I)', rate: 6.50, docNo: 'PX55013738', txnType: 'หักกลบ', amount: 165029.50, principal: 165000.00, interest: 29.50, remaining: 0 },
      { receiptDate: '2555-08-06', paidDate: '2555-08-06', contract: 'ส1.55-006655 (I)', rate: 6.50, docNo: 'PX55023547', txnType: 'หักกลบ', amount: 193372.25, principal: 193200.00, interest: 172.25, remaining: 0 },
      { receiptDate: '2557-05-16', paidDate: '2557-05-16', contract: 'ส6.57-003250 (I)', rate: 6.50, docNo: 'PX57016410', txnType: 'หักกลบ', amount: 549900.00, principal: 549900.00, interest: 0, remaining: 0 },
      { receiptDate: '2560-05-08', paidDate: '2560-05-08', contract: 'ฉฆ.60-007961', rate: 5.75, docNo: 'PX60032810', txnType: 'หักกลบ', amount: 154570.50, principal: 154400.00, interest: 170.50, remaining: 0 },
      { receiptDate: '2562-03-06', paidDate: '2562-03-06', contract: 'พค.61-000085', rate: 5.50, docNo: 'PX62011999', txnType: 'ชำระ', amount: 913000.00, principal: 912312.00, interest: 688.00, remaining: 688.00 },
      { receiptDate: '2564-11-04', paidDate: '2564-11-04', contract: 'ส7.59-017608 (IRJ)', rate: 5.50, docNo: 'PX64042705', txnType: 'ชำระ', amount: 399314.61, principal: 399134.11, interest: 180.50, remaining: 0 },
      { receiptDate: '2565-11-15', paidDate: '2565-11-15', contract: 'ส6.65-001143 (MD)', rate: 5.50, docNo: 'PX65035946', txnType: 'หักกลบ', amount: 1115800.25, principal: 1115800.25, interest: 0, remaining: 0 },
      { receiptDate: '2566-12-07', paidDate: '2566-12-07', contract: 'ส6.66-001894 (D)', rate: 5.50, docNo: 'PX66053363', txnType: 'หักกลบ', amount: 1161507.25, principal: 1160458.00, interest: 1049.25, remaining: 0 },
      { receiptDate: '2567-03-12', paidDate: '2567-03-12', contract: 'ฉฉ.67-001315', rate: 5.50, docNo: 'PX67019326', txnType: 'หักกลบ', amount: 224000.00, principal: 224000.00, interest: 0, remaining: 0 },
      { receiptDate: '2569-03-04', paidDate: '2569-03-04', contract: 'ส7.66-009103 (I)', rate: 5.25, docNo: 'PX69021538', txnType: 'ชำระ', amount: 752.75, principal: 0, interest: 752.75, remaining: 2128886.94 },
      { receiptDate: '2569-04-29', paidDate: '2569-04-29', contract: 'ฉฉ.69-006319', rate: 5.25, docNo: 'PX69031161', txnType: 'ชำระ', amount: 530.25, principal: 530.25, interest: 0, remaining: 248759.60 },
    ],
    balanceAdjustments: [
      { adjustDate: '2560-04-24', contract: 'ส7.59-008675 (I)', docNo: 'AJ60003362', txnType: 'เบี้ยประกัน', insurer: 'บริษัท ไทยประกันชีวิต จำกัด (มหาชน)', adjustPrincipal: 6513.00, adjustInterest: 0.12, remaining: 874928.37, interestOverdue: 0.12 },
      { adjustDate: '2567-08-07', contract: 'ส7.66-009103 (I)', docNo: 'AJ67013476', txnType: 'เบี้ยประกัน', insurer: 'บริษัท เมืองไทยประกันชีวิต จำกัด (มหาชน)', adjustPrincipal: 11911.41, adjustInterest: 0, remaining: 2217727.18, interestOverdue: 0 },
      { adjustDate: '2569-07-31', contract: 'ส7.66-009103 (I)', docNo: 'AJ69012989', txnType: 'เบี้ยประกัน', insurer: 'บริษัท เมืองไทยประกันชีวิต จำกัด (มหาชน)', adjustPrincipal: 10349.83, adjustInterest: 0, remaining: 2101225.53, interestOverdue: 0 },
    ],
    shareChanges: [
      { changeDate: '2566-01-09', period: 142, capital: 71000, before: 'ส่งหุ้นงวดละ 500.00', after: 'ส่งหุ้นงวดละ 600.00' },
      { changeDate: '2569-03-26', period: 181, capital: 94400, before: 'ส่งหุ้นงวดละ 600.00', after: 'งดส่งหุ้นรายเดือน' },
    ],
    debtCollectionChanges: [
      { changeDate: '2563-04-09', contract: 'ส6.62-008611 (D)', before: 'คงยอด งวดละ 8,300.00', after: 'งดส่งต้น', extraPerYear: 0, note: 'อช.63/02/2563 (26/03/2563) ผ่อนผัน 04/2563-06/2563 มาตรการ' },
      { changeDate: '2568-04-09', contract: 'ส7.66-009103 (I)', before: 'คงยอด งวดละ 15,700.00', after: 'งดส่งต้น', extraPerYear: 0, note: 'บริหารจัดการหนี้ พักหนี้ตั้งแต่ 256804 ถึง 256808 ยอดส่ง/เดือน = 1' },
      { changeDate: '2568-09-10', contract: 'ส7.66-009103 (I)', before: 'งดส่งต้น งวดละ 15,700.00', after: 'คงยอด งวดละ 15,900.00', extraPerYear: 0, note: 'ครบกำหนดพักชำระหนี้ เพิ่มยอดส่ง เป็น 15,900.00' },
    ],
    partialReceiptReturns: [
      { receiptDate: '2557-12-31', returnDate: '2558-01-09', item: 'ส6.57-008337 (I)', principal: 800.00, interest: 6.75, note: 'เงินไม่พอหักชำระ ยังปฏิบัติหน้าที่อยู่' },
      { receiptDate: '2561-07-31', returnDate: '2561-08-10', item: 'ส7.59-008675 (I)', principal: 12.65, interest: 0, note: 'เงินไม่พอหักชำระ ยังปฏิบัติหน้าที่อยู่' },
      { receiptDate: '2569-06-30', returnDate: '2569-07-10', item: 'ฉฉ.69-006319', principal: 700.00, interest: 0, note: 'เงินไม่พอหักชำระ ยังปฏิบัติหน้าที่อยู่' },
    ],
    fireInsurance: [
      { contract: 'พค.61-000085', regDate: '2561-08-08', coverDate: '2561-08-01', expireDate: '2562-08-01', insuredAmount: 339360, premium: 507.21, policyNo: 'T00106185923-0021', endorsementNo: '256108' },
    ],
  },
};

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มเปล่า — "สร้างคำขอด้วยตนเอง" ต้องเลือกสมาชิกก่อน แล้วเลือก
//  ประเภทเงินกู้ จึงจะดึงข้อมูลทะเบียนสมาชิก + คำนวณภาระหนี้ให้อัตโนมัติ
//  (ต่างจาก LR_DEMO ที่เป็นข้อมูลสาธิตเติมไว้ล่วงหน้าทั้งหมด)
// ════════════════════════════════════════════════════════════════════
window.LR_BLANK = {
  reqNo: '', productId: '', reqDate: '', payDate: '', receiveDate: '',
  amount: 0, purpose: '', prevDebt: 0,
  member: {
    code: '', name: '', unit: '', phone: '', memberStatus: 'ปกติ',
    maritalStatus: '', spouse: '', birthDate: '', retireDate: '', joinDate: '',
    shareCapital: 0, salary: 0, otherIncome: 0,
  },
  entitlement: 0, rateAdd: 0, rateReduce: 0, interestCert: false, certPurposeDetail: '',
  payMethod: '0', paySource: 'salary', sendablePeriods: 0,
  income: { salary: 0, other: 0, deduct: 0, fund: 0, remain: 0, reduceRemainOn: false, reduceRemainPct: 0, checkRemain: true },
  payType: 'principal',
  agentArrears: [],
  insurances: [],
  disburses: [],
  collaterals: [],
  monthlyCollect: [],
  offsetLoans: [],
  otherDeducts: [],
  cmsCode: '', recordedBy: '', recordDate: '',
  files: [],
  detailReport: {
    amlo: { status: '-', risk: '-' }, statusNotes: [], share: {}, loanContracts: [], transferCoGuarantors: [],
    paymentReceipts: [], balanceAdjustments: [], shareChanges: [], debtCollectionChanges: [], partialReceiptReturns: [], fireInsurance: [],
  },
};
// ─── สร้างฟอร์มเปล่าใหม่ (เลขที่ใบขอกู้ + วันที่ทำการ) ────────────────
window.lrNewBlankForm = () => {
  const base = JSON.parse(JSON.stringify(window.LR_BLANK));
  const today = window.DEPOSIT_WORKING_DATE;
  base.reqDate = today; base.payDate = today; base.receiveDate = today;
  base.recordDate = today;
  return base;
};
// ─── เติมข้อมูลสมาชิกจากทะเบียนสมาชิก (GUAR_MEMBERS) เมื่อเลือกสมาชิก ──
window.lrApplyMemberToForm = (base, picked) => {
  const g = (window.GUAR_MEMBERS || []).find(m => m.code === picked.code);
  const member = {
    ...base.member,
    code: picked.code,
    name: g ? g.name : picked.name,
    unit: g ? g.unit : (picked.dept || picked.department || base.member.unit),
    memberStatus: 'ปกติ',
    maritalStatus: g ? g.maritalStatus : base.member.maritalStatus,
    spouse: g ? g.spouse : base.member.spouse,
    birthDate: g ? g.birthDate : base.member.birthDate,
    retireDate: g ? g.retireDate : base.member.retireDate,
    joinDate: g ? g.joinDate : base.member.joinDate,
    shareCapital: g && g.share ? g.share.capital : base.member.shareCapital,
    salary: g ? g.salary : base.member.salary,
  };
  // หนี้เดิม/รายการหักกลบของสมาชิก — ดึงมาให้เมื่อเลือกสมาชิก (ยังว่างอยู่)
  const demo = window.LR_DEMO || {};
  const offsetLoans = (base.offsetLoans && base.offsetLoans.length)
    ? base.offsetLoans
    : JSON.parse(JSON.stringify(demo.offsetLoans || []));
  const monthlyCollect = (base.monthlyCollect && base.monthlyCollect.length)
    ? base.monthlyCollect
    : JSON.parse(JSON.stringify(demo.monthlyCollect || []));
  return { ...base, member, offsetLoans, monthlyCollect, income: { ...base.income, salary: member.salary } };
};

// ── ตัวเลือกย่อยของหน้าจอนี้ ──────────────────────────────────────
window.LR_MARITAL = [
  { v: 'โสด', l: 'โสด' },
  { v: 'สมรส (ชาย-หญิง)', l: 'สมรส (ชาย-หญิง)' },
  { v: 'สมรส (ชาย-ชาย)', l: 'สมรส (ชาย-ชาย)' },
  { v: 'สมรส (หญิง-หญิง)', l: 'สมรส (หญิง-หญิง)' },
  { v: 'สมรสไม่จดทะเบียน', l: 'สมรสไม่จดทะเบียน' },
  { v: 'หม้าย', l: 'หม้าย' },
  { v: 'หย่าร้าง', l: 'หย่าร้าง' },
  { v: 'แยกกันอยู่', l: 'แยกกันอยู่' },
];
// การชำระ (วิธีคำนวณงวด) — เลือกได้ในหน้าใบคำขอกู้
window.LR_PAY_METHODS = [
  { v: '0', l: 'คำนวณงวดปกติ' },
  { v: '1', l: 'กำหนดงวดเอง' },
  { v: '2', l: 'ยืดงวด' },
  { v: '3', l: 'งดต้นงดดอกเบี้ย' },
  { v: 'MIN', l: 'ผ่อนชำระขั้นต่ำ' },
];
// ประเภทส่ง (รูปแบบการชำระคืน)
window.LR_PAY_TYPES = [
  { v: 'principal', l: 'คงต้น' },
  { v: 'balance', l: 'คงยอด' },
  { v: 'balanceStep', l: 'คงยอดขั้นบันได' },
];
// วิธีการจ่ายเงินกู้
window.LR_DISBURSE_METHODS = [
  'โอนเงินฝากสหกรณ์', 'โอนเงินฝากธนาคาร', 'เงินสด',
  'ธนาณัติออนไลน์', 'แคชเชียร์เช็ค', 'เช็ค', 'ตั๋วแลกเงิน',
];
// ประเภทประกัน
window.LR_INSURANCE_TYPES = ['ประกันชีวิต', 'ประกันหนีหนี้', 'ประกันอัคคีภัย'];
window.LR_MEMBER_STATUS = [
  { v: 'ปกติ', l: 'ปกติ' }, { v: 'ลาออก', l: 'ลาออก' }, { v: 'พ้นสภาพ', l: 'พ้นสภาพ' },
];
window.LR_PAY_SOURCE = [
  { v: 'salary', l: 'เงินเดือน' }, { v: 'dividend', l: 'เงินปันผล/เฉลี่ยคืน' }, { v: 'self', l: 'ชำระเอง' },
];

// ─── ประวัติการเปลี่ยนแปลงเงินเดือน (seed) ───────────────────────────
window.MEMBER_SALARY_HISTORY = {
  'M-058241': [
    { old: 46200, new: 48750, date: '2025-10-01', actor: 'ประภาส ทองสุข' },
    { old: 43800, new: 46200, date: '2024-10-01', actor: 'ประภาส ทองสุข' },
  ],
};
window.lrSalaryHistory = (code) => (window.MEMBER_SALARY_HISTORY[code] || []);

// ─── อัปเดตเงินเดือนสมาชิก — มีผลข้ามไปยังทะเบียนสมาชิกด้วย ──────────
//  อัปเดตทั้ง: GUAR_MEMBERS · MEMBER_DATA (ทะเบียนสมาชิก) · ประวัติ
window.lrUpdateMemberSalary = (code, oldS, newS, date, actor) => {
  const g = (window.GUAR_MEMBERS || []).find(m => m.code === code);
  if (g) g.salary = newS;
  if (window.MEMBER_DATA && window.MEMBER_DATA.member && window.MEMBER_DATA.member.code === code) {
    window.MEMBER_DATA.member.salary = newS;
  }
  (window.MEMBER_SALARY_HISTORY[code] = window.MEMBER_SALARY_HISTORY[code] || [])
    .unshift({ old: oldS, new: newS, date, actor });
  return true;
};

// ════════════════════════════════════════════════════════════════════
//  คิวคำขอกู้จากระบบ CRM ของสหกรณ์
//  สมาชิกยื่นคำขอผ่าน CRM → ส่งเข้าโปรแกรมสหกรณ์ → เจ้าหน้าที่ "ดึงรายการ"
//  มาทำรายการขอกู้ (เปิดหน้าสร้างใบคำขอกู้พร้อมข้อมูลที่เติมไว้ล่วงหน้า)
// ════════════════════════════════════════════════════════════════════
window.LR_CRM_QUEUE = [
  { crmNo: 'CRM-2569-100482', sentAt: '2026-06-02 09:14', channel: 'CRM',
    memberCode: 'M-058241', productId: 'LP-20', amount: 200000, purpose: 'debt', status: 'pending',
    note: 'ขอกู้สามัญเพื่อรวมหนี้ — แนบสลิปเงินเดือนครบ' },
  { crmNo: 'CRM-2569-100488', sentAt: '2026-06-03 10:42', channel: 'CRM',
    memberCode: 'M-058241', productId: 'LP-30', amount: 1500000, purpose: 'house', status: 'pending',
    note: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย — ใช้โฉนดที่ผ่านการสำรวจแล้วค้ำประกัน' },
  { crmNo: 'CRM-2569-100484', sentAt: '2026-06-02 14:15', channel: 'แอปสมาชิก',
    memberCode: 'M-058243', productId: 'LP-30', amount: 900000, purpose: 'house', status: 'draft',
    reqNo: 'LR-2569-04837', draftDocs: ['สำเนาโฉนดที่ดิน', 'ผลสำรวจหลักทรัพย์'],
    note: 'บันทึกแบบร่างไว้ รอผลสรุปการสำรวจหลักทรัพย์' },
  { crmNo: 'CRM-2569-100486', sentAt: '2026-06-03 08:20', channel: 'แอปสมาชิก',
    memberCode: 'M-058243', productId: 'LP-10', amount: 30000, purpose: 'family', status: 'pending',
    note: 'ฉุกเฉินเงินสด — ยังไม่ได้สร้างใบคำขอ' },
  { crmNo: 'CRM-2569-100479', sentAt: '2026-06-02 08:51', channel: 'แอปสมาชิก',
    memberCode: 'M-058243', productId: 'LP-30', amount: 1800000, purpose: 'house', status: 'waitapprove',
    reqNo: 'LR-2569-04834', note: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย — ตรวจหลักทรัพย์แล้ว ส่งให้ผู้อนุมัติ (เร่งด่วน)' },
  { crmNo: 'CRM-2569-100476', sentAt: '2026-06-02 08:05', channel: 'CRM',
    memberCode: 'M-058241', productId: 'LP-20', amount: 350000, purpose: 'debt', status: 'waitapprove',
    reqNo: 'LR-2569-04835', note: 'สามัญปกติเพื่อรวมหนี้ — เอกสารครบ ส่งให้ผู้อนุมัติแล้ว' },
  { crmNo: 'CRM-2569-100471', sentAt: '2026-06-01 16:32', channel: 'CRM',
    memberCode: 'M-058246', productId: 'LP-10', amount: 45000, purpose: 'family', status: 'special',
    reqNo: 'LR-2569-04833', specialReason: 'ยอดขอเกินสิทธิ์วงเงิน ฿1,400 และเงินเดือนคงเหลือต่ำกว่าเกณฑ์ — ขอใช้อำนาจผู้จัดการอนุมัติกรณีพิเศษ',
    specialBy: 'สุภาพร ทองใบ', specialAt: '2026-06-01 17:02',
    note: 'ฉุกเฉินเงินสด — สมาชิกสมทบ ส่งเข้าพิจารณาอนุมัติกรณีพิเศษ' },
  { crmNo: 'CRM-2569-100468', sentAt: '2026-06-01 13:44', channel: 'แอปสมาชิก',
    memberCode: 'M-058241', productId: 'LP-30', amount: 2200000, purpose: 'house', status: 'special',
    reqNo: 'LR-2569-04832', specialReason: 'วงเงินขอกู้เกินสิทธิ์ของผลิตภัณฑ์ ฿200,000 — หลักทรัพย์ค้ำประกันเพียงพอ ขอให้คณะกรรมการพิจารณากรณีพิเศษ',
    specialBy: 'มนตรี ศรีสุข', specialAt: '2026-06-01 15:20',
    note: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย — ขอเกินวงเงินสิทธิ์' },
  { crmNo: 'CRM-2569-100460', sentAt: '2026-06-01 09:58', channel: 'CRM',
    memberCode: 'M-058243', productId: 'LP-20', amount: 800000, purpose: 'debt', status: 'special',
    reqNo: 'LR-2569-04830', specialReason: 'คนค้ำประกันไม่ครบตามเกณฑ์ (มี 1 ราย ต้องการ 2 ราย) — ผู้กู้มีหุ้นและเงินฝากค้ำประกันส่วนที่ขาด',
    specialBy: 'มนตรี ศรีสุข', specialAt: '2026-06-01 11:35',
    note: 'สามัญปกติเพื่อรวมหนี้ — ขออนุโลมเงื่อนไขผู้ค้ำประกัน' },
  { crmNo: 'CRM-2569-100465', sentAt: '2026-06-01 14:05', channel: 'LINE OA',
    memberCode: 'M-058243', productId: 'LP-50', amount: 300000, purpose: 'family', status: 'waitapprove',
    reqNo: 'LR-2569-04836', note: 'สามัญเพิ่มสุข (ชำระจากปันผล) — ส่งให้หัวหน้าอนุมัติแล้ว' },
  { crmNo: 'CRM-2569-100461', sentAt: '2026-06-01 10:47', channel: 'CRM',
    memberCode: 'M-058246', productId: 'LP-20', amount: 250000, purpose: 'debt', status: 'draft',
    reqNo: 'LR-2569-04831', draftDocs: ['หนังสือรับรองเงินเดือน / สลิปเงินเดือน', 'สำเนาบัญชีเงินฝากธนาคาร'],
    note: 'บันทึกแบบร่างไว้ รอตรวจข้อมูลก่อนส่งอนุมัติ' },
  { crmNo: 'CRM-2569-100455', sentAt: '2026-05-31 15:08', channel: 'แอปสมาชิก',
    memberCode: 'M-058241', productId: 'LP-20', amount: 180000, purpose: 'family', status: 'docreq',
    reqNo: 'LR-2569-04829', draftDocs: ['สำเนาทะเบียนสมรส', 'สำเนาบัญชีเงินฝากธนาคาร'],
    note: 'แจ้งขอเอกสารเพิ่มเติม 2 รายการ รอสมาชิกนำส่ง' },
  { crmNo: 'CRM-2569-100458', sentAt: '2026-05-31 11:20', channel: 'CRM',
    memberCode: 'M-058241', productId: 'LP-20', amount: 500000, purpose: 'biz', status: 'paid',
    reqNo: 'LR-2569-04820', payAt: '2026-06-01', payBy: 'ฝ่ายการเงิน',
    note: 'การเงินอนุมัติจ่ายเงินแล้ว → ใบคำขอ LR-2569-04820' },
  { crmNo: 'CRM-2569-100452', sentAt: '2026-05-30 09:35', channel: 'CRM',
    memberCode: 'M-058246', productId: 'LP-30', amount: 1250000, purpose: 'house', status: 'rejected',
    reqNo: 'LR-2569-04826', rejectNote: 'หลักประกันไม่เพียงพอ ให้เพิ่มผู้ค้ำประกัน 1 ราย',
    rejectBy: 'นายอภิชาติ วงศ์สกุล (หัวหน้าฝ่ายสินเชื่อ)', rejectAt: '2026-05-31 13:12',
    note: 'หัวหน้าไม่อนุมัติ — ส่งกลับให้ผู้ทำรายการปรับแก้ไข' },
  { crmNo: 'CRM-2569-100448', sentAt: '2026-05-29 13:52', channel: 'CRM',
    memberCode: 'M-058243', productId: 'LP-20', amount: 320000, purpose: 'debt', status: 'approved',
    reqNo: 'LR-2569-04822', approveBy: 'นายอภิชาติ วงศ์สกุล', approveAt: '2026-05-30 10:05',
    note: 'หัวหน้าอนุมัติแล้ว รอการเงินอนุมัติจ่ายเงิน' },
];

// ─── สถานะใบคำขอกู้ (วงจรงาน) ───────────────────────────────────────
//  รอสร้างคำขอ (รับจาก API ของ CRM) → แบบร่าง / ขอเอกสารเพิ่มเติม
//  → รออนุมัติ → (ไม่อนุมัติ = หัวหน้าตีกลับให้แก้) / อนุมัติ รอจ่ายเงิน
//  → จ่ายเงินแล้ว ; ส่งคืนคำขอ = เจ้าหน้าที่ปิดจบเรื่อง
window.LR_CRM_STATUS = {
  pending:  { label: 'รอสร้างคำขอ',      pill: 'warn',    desc: 'รับข้อมูลจาก API ที่ CRM ส่งเรื่องเข้ามา ยังไม่ได้สร้างคำขอ' },
  draft:    { label: 'แบบร่าง',           pill: 'neutral', desc: 'บันทึกแบบร่างไว้ ยังไม่ส่งอนุมัติ' },
  docreq:   { label: 'ขอเอกสารเพิ่มเติม', pill: 'warn',    desc: 'แจ้งสมาชิกส่งเอกสารเพิ่ม รอเอกสารครบ' },
  waitapprove: { label: 'รออนุมัติ',      pill: 'info',    desc: 'สร้างรายการแล้ว รอให้หัวหน้าอนุมัติ' },
  special:  { label: 'รออนุมัติกรณีพิเศษ', pill: 'warn', desc: 'คำขอนอกเกณฑ์ปกติ — ส่งเข้าพิจารณาอนุมัติกรณีพิเศษ รอผู้มีอำนาจพิจารณา' },
  rejected: { label: 'ไม่อนุมัติ',        pill: 'bad',     desc: 'หัวหน้าส่งกลับให้ผู้ทำรายการปรับแก้ไข' },
  approved: { label: 'อนุมัติ รอจ่ายเงิน', pill: 'info',   desc: 'หัวหน้าอนุมัติแล้ว รอการเงินอนุมัติจ่ายเงิน' },
  paid:     { label: 'จ่ายเงินแล้ว',      pill: 'ok',      desc: 'การเงินอนุมัติจ่ายเงินคำขอแล้ว' },
  returned: { label: 'ส่งคืนคำขอ',        pill: 'bad',     desc: 'เจ้าหน้าที่ปิดจบเรื่องโดยส่งคืนคำขอ' },
};
window.LR_STATUS_ORDER = ['pending','draft','docreq','waitapprove','special','rejected','approved','paid','returned'];

// ─── สร้างข้อมูลฟอร์มสร้างใบคำขอกู้จากรายการ CRM (เติมล่วงหน้า) ───────
window.lrFromCrm = (req) => {
  const base = JSON.parse(JSON.stringify(window.LR_DEMO));
  const g = (window.GUAR_MEMBERS || []).find(m => m.code === req.memberCode);
  const product = window.lrFindProduct(req.productId);
  const today = window.DEPOSIT_WORKING_DATE;
  const payDate = window.lrAddMonths(today, 0);

  base.reqNo = req.crmNo;          // เลขที่ใบขอกู้ = เลขคำขอ CRM (เลขเดียวกัน)
  base.crmRef = req.crmNo;
  base.crmChannel = req.channel;
  base.productId = req.productId;
  base.amount = req.amount;
  base.purpose = req.purpose;
  base.reqDate = today;
  base.payDate = payDate;
  base.receiveDate = payDate;

  if (g) {
    base.member = {
      ...base.member,
      code: g.code, name: g.name, unit: g.unit, phone: base.member.phone,
      memberStatus: 'ปกติ',
      birthDate: g.birthDate, retireDate: g.retireDate, joinDate: g.joinDate,
      shareCapital: g.share ? g.share.capital : base.member.shareCapital,
      salary: g.salary || base.member.salary,
    };
    base.income = { ...base.income, salary: g.salary || base.income.salary };
    // สิทธิวงเงินโดยประมาณ = 60 เท่าเงินเดือน (ไม่เกินเพดานผลิตภัณฑ์)
    const cap = product ? product.settings.maxLoanAmount : base.entitlement;
    base.entitlement = Math.min(cap, (g.salary || 0) * 60 || base.entitlement);
  }
  return base;
};
