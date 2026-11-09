// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — เครื่องคำนวณใบคำขอกู้ (lrCalc)
//  รับ state ของฟอร์ม → คืนค่าที่คำนวณได้ทั้งหมดตาม "ค่าคงที่ประเภทเงินกู้"
//  (LP_SEED / IR_SEED) ครอบคลุม Flow 15 ขั้นของการขอกู้:
//   เลือกประเภท → ดึงค่าคงที่ → ตรวจคุณสมบัติ → สิทธิ์กู้ → ตรวจยอด
//   → งวด → ดอกเบี้ย/ยอดผ่อน → เงินเดือนคงเหลือ → หลักประกัน
//   → หักกลบ → จ่ายสุทธิ → เอกสาร → อนุมัติ
//  ทุกตัวเลขผูกกับค่าคงที่ของผลิตภัณฑ์ — ไม่มีค่าฮาร์ดโค้ดในหน้าจอ
// ════════════════════════════════════════════════════════════════════

// ─── จำนวนเดือนระหว่างสองวันที่ (วันชนวัน) ───────────────────────────
window.lrMonthsBetween = (fromIso, toIso) => {
  if (!fromIso || !toIso) return 0;
  const a = new Date(fromIso), b = new Date(toIso);
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  // จ-02 — วันปลายเป็นวันสุดท้ายของเดือน และเลขวันต้นมากกว่าจำนวนวันของเดือนปลาย → นับเต็มเดือน
  const lastOfB = new Date(b.getFullYear(), b.getMonth() + 1, 0).getDate();
  const endOfMonthCase = b.getDate() === lastOfB && a.getDate() > lastOfB;
  if (b.getDate() < a.getDate() && !endOfMonthCase) m -= 1;
  return m;
};

// ─── ปัดเศษตามโหมดของค่าคงที่ (up/down/round/none) ───────────────────
window.lrRound = (value, mode, factor) => {
  const f = Number(factor) || 0;
  const v = Number(value) || 0;
  if (!f || mode === 'none') return v;
  const q = v / f;
  const r = mode === 'up' ? Math.ceil(q) : mode === 'down' ? Math.floor(q) : Math.round(q);
  return r * f;
};

// ─── ตรวจว่าวันที่อยู่ในช่วงโครงการของผลิตภัณฑ์ ──────────────────────
window.lrInPackageWindow = (product, iso) => {
  if (!product) return false;
  const d = iso || window.DEPOSIT_WORKING_DATE;
  const s = product.packageStart, e = product.packageEnd;
  if (s && d < s) return false;
  if (e && d > e) return false;
  return true;
};

// ════════════════════════════════════════════════════════════════════
//  เครื่องคำนวณหลัก
// ════════════════════════════════════════════════════════════════════
const r2c = (n) => Math.round((Number(n) || 0) * 100) / 100;
// ─── สัญญาหักกลบ: คำนวณยอดตามจริงจากสัญญา + จัดเก็บรายเดือน + รอบเรียกเก็บ ───
//  ใช้ทั้งตารางหักกลบ · popup รายละเอียด · หักหนี้เก่า · รับสุทธิ · เอกสารพิมพ์
//  รอบเก็บ: ประมวลผลวันที่ 10 → เก็บสิ้นเดือน · ดอกเบี้ยรายวัน = คงเหลือ × อัตรา × วัน / 365
window.lrOffsetRows = (f) => {
  const payDate = String((f && (f.payDate || f.reqDate)) || window.DEPOSIT_WORKING_DATE || '').slice(0, 10);
  const mc = (f && f.monthlyCollect) || [];
  const [y, m, d] = payDate.split('-').map(Number);
  const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const ok = !!(y && m && d);
  const prevEnd = ok ? iso(new Date(y, m - 1, 0)) : '';           // รอบเก็บที่ผ่านมา (สิ้นเดือนก่อน) — รับชำระแล้ว
  const curEnd = ok ? iso(new Date(y, m, 0)) : '';               // รอบเก็บเดือนนี้
  const billIssued = ok && d > (window.LR_COLLECT_PROCESS_DAY || 10); // ประมวลผลเดือนนี้แล้ว → ออกใบเรียกเก็บแล้ว
  const intFrom = ok ? iso(new Date(y, m - 1, 1)) : '';           // คิดดอกเบี้ยถึงสิ้นเดือนก่อนแล้ว (เก็บพร้อมงวด)
  const days = ok ? Math.max(0, Math.round((new Date(payDate) - new Date(intFrom)) / 86400000)) : 0;
  return ((f && f.offsetLoans) || []).map(o => {
    const row = mc.find(r => r.contract === o.contract || String(r.detail || '').indexOf(o.contract) >= 0) || null;
    const remaining = Number(o.remaining) || 0;
    const rate = Number(o.rate) || 0;
    const [paid, total] = String(o.period || '0/0').split('/').map(Number);
    const approved = Number(o.approved) || 0;
    const pendingDraw = Number(o.pendingDraw) || 0;
    const paidAmount = r2c(Math.max(0, approved - pendingDraw - remaining));
    const minAmount = r2c(approved * (Number(o.minPct) || 0) / 100);
    const intAtPayDate = r2c(remaining * rate / 100 * days / 365);
    const intOverdue = r2c(o.intOverdue);
    const billPrincipal = row ? Number(row.payPrincipal) || 0 : 0;
    const billInterest = row ? Number(row.payInterest) || 0 : 0;
    const bill = billIssued && row
      ? { date: curEnd, principal: billPrincipal, interest: billInterest, status: o.sel ? 'cancel' : 'pending' }
      : null;
    const lastPaid = row ? { date: prevEnd, principal: billPrincipal, interest: billInterest } : null;
    const interestReturn = 0;
    return {
      ...o, rate, remaining, approved, pendingDraw,
      paidPeriods: paid || 0, totalPeriods: total || 0,
      paidAmount, paidPct: approved > 0 ? r2c(paidAmount / approved * 100) : 0,
      minAmount, needMore: r2c(Math.max(0, minAmount - paidAmount)),
      needPeriods: Math.max(0, (Number(o.minPeriods) || 0) - (paid || 0)),
      lastIntDate: prevEnd, intDays: days, payDate,
      estPct: rate, estInterest: r2c(remaining * rate / 100 / 12),
      intAtPayDate, intOverdue,
      interestPeriod: intAtPayDate, interestAccrued: intOverdue, interestReturn,
      lastPaid, bill, mcRow: row,
      payoff: r2c(remaining + intAtPayDate + intOverdue - interestReturn),
    };
  });
};
// เงินฝากค้ำ — ค้นบัญชีจากทะเบียนเงินฝาก (ใช้ตรวจยอดภายใน ไม่แสดงยอดให้เจ้าหน้าที่)
window.lrDepositAccount = (accNo) => {
  const k = String(accNo || '').trim();
  if (!k) return null;
  return (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : (window.DEP_TXN_ACCOUNTS_SEED || [])).find(a => a.accNo === k) || null;
};
// บัญชีเป็นของผู้กู้หรือไม่ — เทียบเลขสมาชิก (ตัดอักษร/ศูนย์นำหน้า)
window.lrIsOwnAccount = (acc, member) => {
  const n = (v) => String(Number(String(v || '').replace(/\D/g, '')) || '');
  return !!acc && !!member && n(acc.member) !== '' && n(acc.member) === n(member.code);
};
// ประกันที่ประเภทเงินกู้บังคับ — ประกันชีวิต / ประกันหนีหนี้ ตามยอดกู้ขั้นต่ำ
window.lrRequiredInsurances = (s, amt) => {
  const out = [];
  const a = Number(amt) || 0;
  if (!s) return out;
  if (s.loanInsurance === '1' && a >= (Number(s.loanInsuranceMinAmount) || 0)) out.push({ type: 'ประกันชีวิต', key: 'life' });
  if (s.escapeDebtInsurance === '1' && a >= (Number(s.escapeDebtInsuranceMinAmount) || 0)) out.push({ type: 'ประกันหนีหนี้', key: 'debt' });
  return out;
};
window.lrCalc = (f) => {
  const product = window.lrFindProduct(f.productId);
  const derived = window.lrDeriveFromProduct(product, f.amount, f.reqDate);
  const mem = f.member || {};
  const s0 = (product && product.settings) || {};
  // เงื่อนไขเงินเดือนคงเหลือ — ดึงจากเมนูค่าคงที่ “กำหนดเงินเดือนคงเหลือ” ตามช่วงเลขสมาชิกของผู้กู้
  const srRes = window.lpSalaryRemainResolve ? window.lpSalaryRemainResolve(s0, mem.code) : null;
  const s = srRes ? { ...s0, checkSalaryRemain: srRes.check, salaryRemainType: srRes.type, salaryRemainValue: srRes.value, salaryRemainCap: srRes.cap } : s0;
  const inc = f.income || {};

  // ── ดอกเบี้ยสุทธิ ──
  const baseRate = derived ? derived.rate : 0;
  const rateAdd = Number(f.rateAdd) || 0;
  const rateReduce = Number(f.rateReduce) || 0;
  const netRate = Math.max(0, baseRate + rateAdd - rateReduce);

  // ── อายุสมาชิก / อายุเกิด (เดือน) ──
  const membershipMonths = window.lrMonthsBetween(mem.joinDate, f.reqDate);
  const birthMonths = window.lrMonthsBetween(mem.birthDate, f.reqDate);

  // ── รายรับ ──
  const salary = Number(inc.salary) || 0;
  const otherIncome = Number(inc.other) || 0;
  const incomeTotal = salary + otherIncome;
  const shareCapital = Number(mem.shareCapital) || 0;
  const externalDebt = Number(f.prevDebt) || 0;
  // จัดเก็บรายเดือนของสัญญาที่เลือกหักกลบ → ชำระด้วยการหักกลบแล้ว ไม่เรียกเก็บรายเดือนซ้ำ
  const offsetSelContracts = (f.offsetLoans || []).filter(o => o.sel && o.contract).map(o => o.contract);
  const mcOffset = (d) => !!d && offsetSelContracts.some(c => d.contract === c || String(d.detail || '').indexOf(c) >= 0);
  const oldDebtPay = (f.monthlyCollect || []).filter(d => !mcOffset(d)).reduce((a, d) => a + (d.payPrincipal || 0) + (d.payInterest || 0), 0);

  // ── งวด: เพดานตามตาราง + ไม่เกินเกษียณ ──
  const il = (product && product.installmentLimits) || [];
  const amt = Number(f.amount) || 0;
  // ตารางจำนวนงวดสูงสุด — เลือกแถวตามวงเงิน + อายุผู้กู้ (เดือน) + วัตถุประสงค์ (ถ้ากำหนด)
  const inAmt = (r) => amt >= r.loanFrom && amt <= r.loanTo;
  const inAge = (r) => !mem.birthDate || ((r.ageFrom == null || birthMonths >= Number(r.ageFrom)) && (!Number(r.ageTo) || birthMonths <= Number(r.ageTo)));
  const ilRow = il.find(r => inAmt(r) && inAge(r)) || il.find(inAmt) || il[0] || null;
  const ilAgeOk = !ilRow || inAge(ilRow);
  const maxPeriodsTable = ilRow ? ilRow.maxPeriods : 0;
  const notExceedRetire = ilRow ? !!ilRow.notExceedRetire : false;
  const monthsToRetire = window.lrMonthsBetween(f.reqDate, mem.retireDate);
  const maxPeriodsRetire = monthsToRetire + (Number(s.postRetirePeriods) || 0);
  const periodsCap = notExceedRetire ? Math.min(maxPeriodsTable || 0, Math.max(0, maxPeriodsRetire)) : (maxPeriodsTable || 0);
  const sendable = Math.max(1, Math.min(periodsCap || (f.sendablePeriods || 1), f.sendablePeriods || periodsCap || 1));
  const lastDueDate = window.lrAddMonths(f.receiveDate, sendable);
  const retireOk = !notExceedRetire || !mem.retireDate || lastDueDate <= mem.retireDate;

  // ── ยอดผ่อน / งวด ──
  const inst = window.lrComputeInstallment(amt, netRate, sendable, derived ? derived.repayMode : '2');
  const paymentRounded = window.lrRound(inst.payment, s.roundPayMode, s.roundPayFactor);

  // ── หักล่วงหน้า: วันที่เริ่มเก็บเลื่อนเกินรอบปกติ N งวด → หักต้น+ดอกเบี้ย N งวดไว้ก่อน ──
  const advPeriods = Math.max(0, Number(f.collectSkip) || 0);
  let advPrincipalCalc = 0, advInterestCalc = 0;
  if (advPeriods > 0 && amt > 0) {
    const mr = netRate / 100 / 12;
    const equalPrincipal = (derived ? derived.repayMode : '2') === '1';
    let bal = amt;
    for (let k = 0; k < Math.min(advPeriods, sendable); k++) {
      const it = bal * mr;
      const pr = Math.min(bal, equalPrincipal ? amt / sendable : Math.max(0, paymentRounded - it));
      advInterestCalc += it; advPrincipalCalc += pr; bal -= pr;
    }
    advPrincipalCalc = Math.round(advPrincipalCalc * 100) / 100;
    advInterestCalc = Math.round(advInterestCalc * 100) / 100;
  }

  // ── หลักประกัน — มูลค่าค้ำที่ใช้ได้ (คูณ % การค้ำได้จากค่าคงที่ › มูลค่าหลักประกัน) ──
  const COLL = window.COLL_EDITABLE_FIELDS || {};
  const collApplies = (c, k) => (COLL[c.view && c.view.kind] || []).includes(k);
  const KIND_GROUP = { person: '01', share: '02', deposit: '03', asset: '04', bond: '05' };
  const cvRows = (product && product.collateralValues) || [];
  const cvPct = (kind) => {
    if (!cvRows.length) return 100;
    const r = cvRows.find(x => x.group === KIND_GROUP[kind]);
    return r ? (Number(r.percent) || 0) : null;   // null = ประเภทนี้ไม่อยู่ในค่าคงที่ → ใช้ค้ำไม่ได้
  };
  const collRows = (f.collaterals || []).filter(c => c.type && c.view && c.view.kind);
  const collNotAllowed = collRows.filter(c => cvPct(c.view.kind) === null);
  const collateralTotal = collRows.reduce((a, c) =>
    // หลักทรัพย์ที่สำรวจแล้ว: ค้ำสูงสุดคิดจากผลสำรวจ (สรุปราคาประเมิน × ค้ำประกันสูงสุด %) แล้ว — ไม่คูณ % ซ้ำ
    a + (collApplies(c, 'amount') ? (Number(c.amount) || 0) * ((c.view.kind === 'asset' && c.surveyOk) ? (cvPct('asset') === null ? 0 : 100) : (cvPct(c.view.kind) || 0)) / 100 : 0), 0);
  const personRows = collRows.filter(c => c.view.kind === 'person' && c.ref);
  const assetRows = collRows.filter(c => c.view.kind === 'asset');
  const assetUnsurveyed = assetRows.filter(c => !c.assetId || !c.surveyOk);
  // กำหนดหุ้น/บุคคลค้ำ — จำนวนคนค้ำตามช่วงวงเงิน
  const grRow = ((product && product.guaranteeRules) || []).find(r => amt >= Number(r.loanFrom) && amt <= Number(r.loanTo)) || null;
  const needPersons = grRow ? Number(grRow.count) || 0 : 0;
  const personsOk = personRows.length >= needPersons;
  const personAllowedOk = s.allowPersonGuar !== false || personRows.length === 0;
  // ผู้ค้ำต้องไม่เกษียณก่อนงวดสุดท้าย (checkGuarRetire)
  const guarRetireBad = s.checkGuarRetire ? personRows.filter(c => {
    const g = (window.GUAR_MEMBERS || []).find(x => x.code === c.ref);
    return g && g.retireDate && lastDueDate && g.retireDate < lastDueDate;
  }) : [];

  // ── เงินเดือนคงเหลือขั้นต่ำ (จากค่าคงที่) ──
  // ชนิด 'min' = ร้อยละหรือบาท แล้วแต่จำนวนใดน้อยกว่า (ก-05)
  const salaryRemainMin = s.salaryRemainType === 'percent'
    ? incomeTotal * (Number(s.salaryRemainValue) || 0) / 100
    : s.salaryRemainType === 'min'
      ? Math.min(incomeTotal * (Number(s.salaryRemainValue) || 0) / 100, Number(s.salaryRemainCap) || 0)
      : (Number(s.salaryRemainValue) || 0);

  // ── สิทธิ์การขอกู้ (MIN ของเงื่อนไขที่เกี่ยวข้อง) ──
  const otherDeduct = Number(inc.deduct) || 0;
  const fundDeduct = Number(inc.fund) || 0;
  const breakdown = [];
  breakdown.push({ label: 'เพดานวงเงินผลิตภัณฑ์', value: Number(s.maxLoanAmount) || 0, applies: true });

  // สิทธิการกู้ (TOR 1.1.2) — limitMethod 2 = ตามสิทธิการกู้ (ระเบียบ/ประกาศ)
  if (s.limitMethod === '2') {
    const mode = window.lpRightMode(s, product);
    if (mode === 'matrix') {
      const rows = (product && product.limitRights) || [];
      const row = rows.find(r =>
        membershipMonths >= r.monthFrom && membershipMonths <= r.monthTo &&
        shareCapital >= r.shareFrom && shareCapital <= r.shareTo &&
        salary >= r.salaryFrom && salary <= r.salaryTo) || rows[rows.length - 1];
      if (row) {
        const base = row.multBase === 'shares' ? shareCapital : salary;
        let v = base * (Number(row.mult) || 0);
        if (row.maxAmount) v = Math.min(v, row.maxAmount);
        breakdown.push({
          label: `สิทธิ์ตามสูตร ${row.mult}× ${row.multBase === 'shares' ? 'หุ้น' : 'เงินเดือน'}`,
          value: v, applies: true,
        });
      }
    } else {
      const r = window.lpComputeRight(s, salary, shareCapital);
      if (r) breakdown.push({ label: window.lpRightModeShort(mode), value: r.value, applies: true });
    }
  }
  // ตามหลักประกัน — limitMethod 1
  if (s.limitMethod === '1') {
    breakdown.push({ label: 'ตามมูลค่าหลักประกัน', value: collateralTotal, applies: true });
  }
  // คิดจากเงินเดือนคงเหลือ — limitMethod 4
  if (s.limitMethod === '4') {
    const affordable = Math.max(0, incomeTotal - otherDeduct - fundDeduct - oldDebtPay - externalDebt - salaryRemainMin);
    breakdown.push({ label: 'ตามเงินเดือนคงเหลือ', value: affordable * (sendable || 1), applies: true });
  }
  // ปันผล/เฉลี่ยคืน — limitMethod 6 (ใช้เพดานผลิตภัณฑ์เป็นหลัก)
  // ไม่เกินมูลค่าหุ้น
  if (s.limitNotExceedShares) {
    breakdown.push({ label: 'ไม่เกินมูลค่าหุ้น', value: shareCapital, applies: true });
  }
  // วงเงินกู้สมาชิกใกล้เกษียณ
  const nearRetire = !!s.nearRetireLimitOn && !!mem.retireDate && monthsToRetire <= (Number(s.nearRetireMonths) || 0);
  if (nearRetire) {
    const caps = [Number(s.nearRetireSalaryMult) > 0 ? salary * Number(s.nearRetireSalaryMult) : null,
                  Number(s.nearRetireMaxAmount) > 0 ? Number(s.nearRetireMaxAmount) : null].filter(v => v != null);
    if (caps.length) breakdown.push({ label: `ใกล้เกษียณ (≤ ${s.nearRetireMonths} เดือน)`, value: Math.min(...caps), applies: true });
  }
  // เงื่อนไขลดสิทธิ์ (reduceRules) — ลดตาม % เมื่อมีสัญญาประเภทที่กำหนด
  const exLoans = (f.offsetLoans || []);
  const loanCodeOf = (t) => String(t || '').split(/\s|—/)[0].trim();
  ((product && product.reduceRules) || []).forEach(r => {
    const code = loanCodeOf(r.loanType);
    const pct = Number(r.reducePct || r.percent) || 0;
    if (code && pct && exLoans.some(o => loanCodeOf(o.loanType) === code)) {
      const base = Math.min(...breakdown.filter(b => b.applies).map(b => b.value));
      breakdown.push({ label: `ลดสิทธิ์ ${pct}% (มีสัญญา ${r.loanType})`, value: base * (100 - pct) / 100, applies: true });
    }
  });

  const applicable = breakdown.filter(b => b.applies);
  const entitlement = applicable.length ? Math.min(...applicable.map(b => b.value)) : 0;
  applicable.forEach(b => { b.binding = b.value === entitlement; });

  // ── จำนวนเงินอนุมัติ (ปัดตามการปิดยอดกู้) ──
  const amountApproved = window.lrRound(amt, s.roundLoanMode, s.roundLoanFactor);

  // ── เงินเดือนคงเหลือ (รวมงวดใหม่) ──
  const monthlyBurden = otherDeduct + fundDeduct + oldDebtPay + externalDebt + paymentRounded;
  const salaryRemain = incomeTotal - monthlyBurden;
  const pctRemain = incomeTotal > 0 ? (salaryRemain / incomeTotal) * 100 : 0;
  const salaryRemainOk = !s.checkSalaryRemain || salaryRemain >= salaryRemainMin;

  // ── หักกลบ / รับสุทธิ ──
  const offsetRows = window.lrOffsetRows(f);
  const offsetSel = offsetRows.filter(o => o.sel);
  const offsetPrincipal = r2c(offsetSel.reduce((a, o) => a + o.remaining, 0));
  const offsetTotal = r2c(offsetSel.reduce((a, o) => a + o.payoff, 0));
  const otherDeductTotal = (f.otherDeducts || []).filter(d => d.sel).reduce((a, d) => a + (Number(d.amount) || 0), 0);
  const feeTotal = (f.disburses || []).reduce((a, r) => a + (Number(r.fee) || 0) + (Number(r.service) || 0) + (Number(r.tax) || 0), 0);
  const agentDeduct = Number(f.agentDeduct) || 0;   // หักตัวแทน
  const advPrincipal = advPeriods > 0 ? advPrincipalCalc : (Number(f.advPrincipal) || 0); // ต้นล่วงหน้า
  const advInterest = advPeriods > 0 ? advInterestCalc : (Number(f.advInterest) || 0);    // ดอกเบี้ยล่วงหน้า
  // จัดเก็บรายเดือนที่เลือก "จ่าย" จากเงินกู้ (ยกเว้นแถวที่หักกลบแล้ว)
  const monthlyPayNow = r2c((f.monthlyCollect || []).filter(d => d.pay && !mcOffset(d)).reduce((a, d) => a + (Number(d.payPrincipal) || 0) + (Number(d.payInterest) || 0), 0));
  const oldDebtDeduct = r2c(offsetTotal + monthlyPayNow); // หักหนี้เก่า = หักกลบที่เลือก + จัดเก็บรายเดือนที่เลือกจ่าย
  const netDisburse = Math.max(0, amountApproved - oldDebtDeduct - feeTotal - otherDeductTotal - agentDeduct - advPrincipal - advInterest);

  // ── หลักประกันเพียงพอ ──
  const needCollateral = !!s.needCollateral;
  const collateralOk = !needCollateral || collateralTotal >= amt;

  // ── ตรวจคุณสมบัติ (checklist) ──
  const inWindow = window.lrInPackageWindow(product, f.reqDate) && (product ? product.enabled : false);
  const statusOk = mem.memberStatus === 'ปกติ';
  const minMonths = Number(s.minMembershipMonths) || 0;
  const membershipOk = s.checkMembership === false || membershipMonths >= minMonths;
  const amountOk = amt > 0 && amt <= entitlement && amt <= (Number(s.maxLoanAmount) || 0);
  const noMonthly = !!s.noMonthlyInstallment;

  // ── เงื่อนไขเพิ่มเติมจากค่าคงที่ประเภทเงินกู้ ──
  const ELIG = window.GUAR_MEMBER_TYPE_ELIG || {};
  const eligCode = ELIG[mem.memberType] || (String(mem.memberType || '').indexOf('สมทบ') >= 0 ? 'associate-staff' : 'regular');
  const eligList = s.eligibleMemberTypes || [];
  const eligOk = !eligList.length || eligList.includes(eligCode);
  const isRetired = !!mem.retireDate && !!f.reqDate && mem.retireDate <= f.reqDate;
  const retiredOk = !isRetired || !!s.retiredCanLoan;
  const prodCode = product ? String(product.code) : '';
  const keptLoans = exLoans.filter(o => !o.sel);                       // สัญญาเดิมที่ไม่ได้หักกลบ
  const sameKept = keptLoans.filter(o => loanCodeOf(o.loanType) === prodCode).length;
  const maxContracts = Number(s.maxContracts) || 0;
  const contractsOk = !maxContracts || sameKept + 1 <= maxContracts;
  const minPay = Number(s.minPayment) || 0;
  const minPayOk = noMonthly || !minPay || paymentRounded >= minPay;
  // เงินกู้ที่ต้องหักกลบ — สัญญาประเภทที่กำหนดต้องถูกเลือกหักกลบ
  const mustOffset = ((product && product.offsetLoans) || []).map(r => loanCodeOf(r.loanType || r.code)).filter(Boolean);
  const offsetMissing = keptLoans.filter(o => mustOffset.includes(loanCodeOf(o.loanType)));
  // เงินกู้ที่ห้ามกู้ — มีสัญญาประเภทนี้คงค้างอยู่ (ไม่ได้หักกลบ)
  const banCodes = ((product && product.banLoans) || []).map(r => loanCodeOf(r.loanType || r.code)).filter(Boolean);
  const banHit = keptLoans.filter(o => banCodes.includes(loanCodeOf(o.loanType)));
  // เงื่อนไขห้ามกู้ — สัญญาประเภทที่กำหนดส่งชำระยังไม่ครบงวดขั้นต่ำ
  const paidOf = (o) => Number(String(o.period || '').split('/')[0]) || 0;
  const banRuleHit = ((product && product.banRules) || []).map(r => {
    const code = loanCodeOf(r.loanType);
    const hit = exLoans.find(o => loanCodeOf(o.loanType) === code && paidOf(o) < (Number(r.minPeriods) || 0));
    return hit ? { r, hit } : null;
  }).filter(Boolean);
  // การทำประกันเงินกู้ — บังคับเมื่อยอดกู้ ≥ ขั้นต่ำที่กำหนด
  const insReq = window.lrRequiredInsurances(s, amt);
  const insMissing = insReq.filter(t => !(f.insurances || []).some(r => r.type === t.type && r.company && Number(r.amount) > 0));
  const needIns = insReq.length > 0;
  const insOk = !insMissing.length;
  // เงินฝากค้ำ — ตรวจยอดคงเหลือในบัญชีเงินฝาก (เจ้าหน้าที่ไม่เห็นยอด)
  const depositShort = collRows.filter(c => c.view.kind === 'deposit' && c.ref).map(c => {
    const acc = window.lrDepositAccount(c.ref);
    const amtC = Number(c.amount) || 0;
    if (!acc) return { c, msg: 'ไม่พบบัญชีเงินฝากเลขที่ ' + c.ref };
    if (amtC > (Number(acc.balance) || 0)) return { c, msg: 'บัญชีเงินฝากไม่สามารถค้ำประกันได้ เนื่องจากมียอดเงินคงเหลือไม่เพียงพอต่อการค้ำประกัน' };
    return null;
  }).filter(Boolean);

  const checks = [
    { id: 'product', label: 'ผลิตภัณฑ์เปิดใช้งานและอยู่ในช่วงโครงการ', ok: inWindow,
      detail: inWindow ? '' : 'ผลิตภัณฑ์ปิดใช้งานหรือไม่อยู่ในช่วงวันที่โครงการ' },
    { id: 'status', label: 'สถานะสมาชิกปกติ', ok: statusOk,
      detail: statusOk ? '' : `สมาชิกมีสถานะ “${mem.memberStatus}”` },
    ...(eligList.length ? [{ id: 'elig', label: 'ประเภทสมาชิกมีสิทธิกู้ประเภทนี้', ok: eligOk,
      detail: eligOk ? (mem.memberType || '') : `“${mem.memberType || '—'}” ไม่อยู่ในผู้มีสิทธิกู้` }] : []),
    ...(isRetired ? [{ id: 'retired', label: 'สมาชิกเกษียณกู้ได้', ok: retiredOk,
      detail: retiredOk ? '' : 'ประเภทเงินกู้นี้ไม่อนุญาตให้สมาชิกที่เกษียณแล้วกู้' }] : []),
    ...(maxContracts ? [{ id: 'contracts', label: `จำนวนสัญญาไม่เกิน ${maxContracts} สัญญา`, ok: contractsOk,
      detail: `มีสัญญาประเภทนี้คงเหลือ ${sameKept} + สัญญาใหม่ 1` }] : []),
    ...(mustOffset.length ? [{ id: 'offset', label: 'หักกลบเงินกู้ที่กำหนดครบ', ok: !offsetMissing.length,
      detail: offsetMissing.length ? 'ต้องหักกลบ: ' + offsetMissing.map(o => o.contract).join(', ') : '' }] : []),
    ...(banCodes.length ? [{ id: 'banloan', label: 'ไม่มีเงินกู้ที่ห้ามกู้คงค้าง', ok: !banHit.length,
      detail: banHit.length ? 'มีสัญญา ' + banHit.map(o => o.contract).join(', ') : '' }] : []),
    ...banRuleHit.map(x => ({ id: 'banrule-' + x.r.loanType, label: `สัญญา ${x.r.loanType} ส่งชำระครบ ${x.r.minPeriods} งวด`, ok: false,
      detail: `${x.hit.contract} ส่งแล้ว ${paidOf(x.hit)} งวด` })),
    ...(s.checkMembership === false ? [] : [{ id: 'membership', label: `อายุสมาชิกครบเกณฑ์ (≥ ${minMonths} เดือน)`, ok: membershipOk,
      detail: membershipOk ? `อายุสมาชิก ${membershipMonths} เดือน` : `อายุสมาชิก ${membershipMonths} เดือน ยังไม่ถึงเกณฑ์` }]),
    { id: 'amount', label: 'จำนวนเงินขอกู้ไม่เกินสิทธิ์', ok: amountOk,
      detail: amountOk ? `ขอ ${fmt.money(amt)} / สิทธิ์ ${fmt.money(entitlement)}` : `ขอ ${fmt.money(amt)} เกินสิทธิ์ ${fmt.money(entitlement)}` },
    ...(notExceedRetire ? [{ id: 'retire', label: 'งวดสุดท้ายไม่เกินวันเกษียณ', ok: retireOk,
      detail: retireOk ? `งวดสุดท้าย ${fmt.date(lastDueDate)}` : `งวดสุดท้าย ${fmt.date(lastDueDate)} เกินเกษียณ ${fmt.date(mem.retireDate)}` }] : []),
    ...(s.checkSalaryRemain ? [{ id: 'remain', label: `เงินเดือนคงเหลือ ≥ ขั้นต่ำ (${fmt.money(salaryRemainMin)})`, ok: salaryRemainOk,
      detail: salaryRemainOk ? `คงเหลือ ${fmt.money(salaryRemain)}` : `คงเหลือ ${fmt.money(salaryRemain)} ต่ำกว่าขั้นต่ำ` }] : []),
    ...(needCollateral ? [{ id: 'coll', label: 'หลักประกันเพียงพอ', ok: collateralOk,
      detail: collateralOk ? `ค้ำได้ ${fmt.money(collateralTotal)}` : `ค้ำได้ ${fmt.money(collateralTotal)} ต้องการ ${fmt.money(amt)}` }] : []),
    ...(collNotAllowed.length ? [{ id: 'coll-type', label: 'ประเภทหลักประกันตามค่าคงที่', ok: false,
      detail: 'ไม่กำหนดให้ใช้ค้ำ: ' + [...new Set(collNotAllowed.map(c => c.type))].join(', ') }] : []),
    ...(assetRows.length ? [{ id: 'coll-survey', label: 'หลักทรัพย์ผ่านการสำรวจและสรุปผลแล้ว', ok: !assetUnsurveyed.length,
      detail: assetUnsurveyed.length ? `${assetUnsurveyed.length} รายการยังไม่ได้เลือกหลักทรัพย์ที่สรุปผลสำรวจแล้ว` : '' }] : []),
    ...(!personAllowedOk ? [{ id: 'person-allow', label: 'ใช้บุคคลค้ำประกันได้', ok: false, detail: 'ประเภทเงินกู้นี้ไม่อนุญาตให้ใช้บุคคลค้ำ' }] : []),
    ...(needPersons ? [{ id: 'persons', label: `คนค้ำประกันครบตามเกณฑ์ (≥ ${needPersons} คน)`, ok: personsOk,
      detail: `มี ${personRows.length} คน` }] : []),
    ...(guarRetireBad.length ? [{ id: 'guar-retire', label: 'ผู้ค้ำไม่เกษียณก่อนงวดสุดท้าย', ok: false,
      detail: guarRetireBad.map(c => c.detail || c.ref).join(', ') }] : []),
    ...(il.length ? [{ id: 'il-age', label: 'อายุผู้กู้อยู่ในช่วงตารางจำนวนงวด', ok: ilAgeOk,
      detail: ilAgeOk ? '' : `อายุ ${birthMonths} เดือน เกินช่วงที่กำหนด` }] : []),
    ...(minPay && !noMonthly ? [{ id: 'minpay', label: `ผ่อนชำระต่องวด ≥ ${fmt.money(minPay)}`, ok: minPayOk,
      detail: `งวดละ ${fmt.money(paymentRounded)}` }] : []),
    ...(needIns ? [{ id: 'insurance', label: 'ทำประกันตามที่ประเภทเงินกู้กำหนด (' + insReq.map(t => t.type).join(' + ') + ')', ok: insOk,
      detail: insOk ? '' : 'ต้องระบุบริษัทและจำนวนเงิน: ' + insMissing.map(t => t.type).join(', ') }] : []),
    ...(depositShort.length ? [{ id: 'deposit-balance', label: 'เงินฝากค้ำประกันเพียงพอ', ok: false,
      detail: depositShort.map(x => x.c.ref + ' — ' + x.msg).join(' · ') }] : []),
  ];
  const failed = checks.filter(c => !c.ok);
  const canSubmit = failed.length === 0 && !!product;
  const instantApprove = s.instantApprove === 'yes';

  return {
    product, derived, s,
    baseRate, rateAdd, rateReduce, netRate,
    membershipMonths, birthMonths, monthsToRetire,
    incomeTotal, salary, otherIncome, shareCapital, externalDebt, oldDebtPay,
    maxPeriodsTable, maxPeriodsRetire, notExceedRetire, periodsCap, sendable, lastDueDate, retireOk,
    inst, paymentRounded,
    limitBreakdown: breakdown, entitlement, amountApproved, amountOk,
    salaryRemainMin, monthlyBurden, salaryRemain, pctRemain, salaryRemainOk,
    needCollateral, collateralTotal, collateralOk, cvPct,
    needPersons, personsOk, nearRetire,
    offsetTotal, otherDeductTotal, feeTotal, agentDeduct, netDisburse,
    oldDebtDeduct, monthlyPayNow, depositShort, insReq, mcOffset, advPeriods, advPrincipal, advInterest, offsetRows, offsetPrincipal,
    checks, failed, canSubmit, instantApprove, noMonthly,
  };
};

// ─── สร้างแถวหลักประกันเปล่าตามประเภท (ใช้ตอน "เพิ่มหลักประกัน") ──────
window.lrNewCollateral = (kind, data) => {
  const d = data || {};
  const typeNames = {
    person: 'คนค้ำประกัน', share: 'หุ้นค้ำประกัน', deposit: 'เงินฝากค้ำประกัน',
    asset: 'หลักทรัพย์ค้ำประกัน', bond: 'พันธบัตร',
  };
  const codes = { person: '01', share: '02', deposit: '03', asset: '04', bond: '05' };
  const amount = Number(d.amount) || 0;
  const pct = Number(d.pct) || 100;
  const base = {
    type: typeNames[kind], code: codes[kind], ref: d.ref || '', detail: d.detail || '',
    maxRight: amount, remainRight: amount, amount, pct,
    sharePeriod: Number(d.sharePeriod) || 0, shareAcc: Number(d.shareAcc) || 0, salary: Number(d.salary) || 0,
    view: { kind, typeName: typeNames[kind], rows: [] },
  };
  if (kind === 'person' || kind === 'share' || kind === 'asset' || kind === 'bond') {
    base.view.limit = { max: amount, used: 0, locked: 0, remain: amount, pct: pct.toFixed(2) + '%', ok: amount };
  }
  return base;
};

// ─── แถวประกัน / การจ่ายเงินเปล่า ──────────────────────────────────
window.lrNewInsurance = () => ({
  type: '', company: '', amount: 0, addCap: 0, reduceCap: 0, houseType: '—', capPerHouse: 0, detail: '',
});
// ─── แถวหลักประกันเปล่า — ให้เลือกประเภทในตารางเอง (เหมือนแถวประกัน) ──
window.lrNewBlankCollateral = () => ({
  type: '', code: '', ref: '', detail: '', assetId: '',
  maxRight: 0, remainRight: 0, amount: 0, pct: 100, sharePeriod: 0, shareAcc: 0, salary: 0,
  view: { kind: '', typeName: '', rows: [] },
});
// ─── หลักทรัพย์ที่ใช้ค้ำได้ — ต้องผ่านเมนู “สำรวจหลักทรัพย์” และสรุปผลแล้วเท่านั้น ──
//  ค้ำประกันสูงสุด = สรุปราคาประเมิน × ค้ำประกันสูงสุด (%) · สิทธิค้ำคงเหลือ = ค้ำสูงสุด − ที่ค้ำสัญญาอื่นไปแล้ว
window.lrAssetSurveyInfo = (a) => {
  const num = (s) => Number(String(s == null ? '' : s).replace(/[^0-9.]/g, '')) || 0;
  const r2 = (n) => Math.round(n * 100) / 100;
  const res = ((window.svResultLoad ? window.svResultLoad() : {}) || {})[a.id];
  const src = res || a;
  const summary = num(src.summaryPrice);
  const maxGuarPct = num(src.maxGuarPct);
  const status = res ? (res.svDraft ? 'draft' : 'done') : (summary > 0 ? 'done' : 'none');
  const reason = status === 'draft' ? 'ผลสำรวจยังเป็นแบบร่าง'
    : status === 'none' ? 'ยังไม่สรุปผลสำรวจ'
    : !summary ? 'ยังไม่มีสรุปราคาประเมิน' : '';
  // สิทธิสูงสุด = สรุปราคาประเมิน (คิด % ค้ำประกันสูงสุดไว้แล้วในเมนูบันทึกหลักทรัพย์)
  const maxRight = r2(summary);
  const used = num(a.guarUsed);
  return { ok: !reason, reason, summary, maxGuarPct, maxRight, used, remainRight: Math.max(0, r2(maxRight - used)) };
};
// ─── รหัสรายการหักอื่น ๆ (เจ้าหน้าที่เลือกเพิ่มเองได้) ───────────────
window.LRQ_DEDUCT_CODES = [
  { code: '001', detail: 'เงินเฉลี่ยคืนค้างจ่าย' },
  { code: '002', detail: 'ค่าธรรมเนียมธนาคาร' },
  { code: '003', detail: 'ค่าอากรแสตมป์' },
  { code: '004', detail: 'ค่าเบี้ยประกันชีวิต' },
  { code: '005', detail: 'ค่าธรรมเนียมจดทะเบียนจำนอง' },
  { code: '006', detail: 'ค่าประเมินราคาหลักทรัพย์' },
  { code: '007', detail: 'ค่าปรับชำระล่าช้า' },
  { code: '099', detail: 'อื่น ๆ (ระบุ)' },
];
window.lrNewOtherDeduct = (payer) => ({ sel: true, code: '', detail: '', payer: payer || '', amount: 0, status: 'รออนุมัติ', manual: true });
// ─── ค่าธรรมเนียม/ค่าบริการ/ภาษี ที่ดึงจากตารางการจ่ายเงินกู้ ─────────
window.lrFeeDeductRows = (f) => {
  const ds = (f.disburses || []).filter(r => r.method);
  const methods = [...new Set(ds.map(r => r.method))].join(', ') || '—';
  const sum = (k) => ds.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  return [
    { code: 'FEE', detail: 'ค่าธรรมเนียมการโอน', payer: methods, amount: sum('fee') },
    { code: 'SRV', detail: 'ค่าบริการ', payer: methods, amount: sum('service') },
    { code: 'TAX', detail: 'ภาษี', payer: methods, amount: sum('tax') },
  ];
};
// ─── วันที่เริ่มเก็บ: ตามรอบประมวลผลเก็บเงิน (วันที่ 10) → ออกใบเรียกเก็บสิ้นเดือน ───
//  ทำรายการก่อน/ในวันประมวลผล → เก็บสิ้นเดือนนี้ · เกินรอบแล้ว → เก็บสิ้นเดือนถัดไป
window.LR_COLLECT_PROCESS_DAY = 10;
window.lrCollectSchedule = (txnDate) => {
  if (!txnDate) return null;
  const [y, m, d] = String(txnDate).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const cut = window.LR_COLLECT_PROCESS_DAY;
  const late = d > cut;
  const pm = late ? m + 1 : m;                       // เดือนของรอบที่ใช้
  const py = y + Math.floor((pm - 1) / 12), pmm = ((pm - 1) % 12) + 1;
  const iso = (yy, mm, dd) => `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  const lastDay = new Date(py, pmm, 0).getDate();
  return { late, processDate: iso(py, pmm, cut), billDate: iso(py, pmm, lastDay) };
};
window.lrNewDisburse = () => ({
  method: '', accNo: '', bankFrom: '', branch: '', branchTo: '', postcode: '', payer: '',
  fee: 0, service: 0, tax: 0, net: 0,
});
// ─── เงินกู้พิเศษ: การจ่ายแบ่งเป็นงวด (installment payout) ───────────
//  เงินกู้พิเศษ (ส่วนใหญ่กู้เพื่ออยู่อาศัย) จ่ายเงินกู้ให้แบ่งจ่ายเป็นงวด ๆ
//  disburse แต่ละแถวมี field `installment` = เลขงวด (1,2,…) หรือ 'rest' (งวดที่เหลือ)
window.lrApplySpecialPayout = (form) => {
  form.payoutMode = form.payoutMode || 'จ่ายหลายงวด';
  const d0 = (form.disburses && form.disburses[0]) || window.lrNewDisburse();
  form.disburses = [
    { ...d0, installment: 1 },
    { ...window.lrNewDisburse(), installment: 'rest' },
  ];
  return form;
};
window.lrSpecialInitial = () => window.lrApplySpecialPayout(JSON.parse(JSON.stringify(window.LR_DEMO)));
