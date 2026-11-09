// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ประมาณการดอกเบี้ย (การรับชำระจากสมาชิก)
//  แสดงประมาณการดอกเบี้ยของสมาชิก แยกตามสัญญาเงินกู้
//  ดอกเบี้ยคำนวณตามจำนวนวันจริงถึง "ดอกเบี้ยถึงวันที่"
// ════════════════════════════════════════════════════════════════════

// รหัสรายการรับชำระ (dropdown)
window.INTEREST_TX_CODES = [
  { code: 'PX',  label: 'PX · รับชำระตามปกติ' },
  { code: 'PMP', label: 'PMP · รับชำระบางส่วน' },
  { code: 'LRT', label: 'LRT · ปรับโครงสร้างหนี้' },
];

// จำนวนวันระหว่างสอง ISO date (วันสิ้นสุด − วันเริ่มต้น)
window.daysBetween = (fromIso, toIso) => {
  if (!fromIso || !toIso) return 0;
  const ms = new Date(toIso) - new Date(fromIso);
  return Math.max(0, Math.round(ms / 86400000));
};

// ─── ข้อมูลหนี้/ประมาณการดอกเบี้ย (keyed by member code) ─────────────
//  principal     = เงินต้นคงเหลือก่อนรับชำระ
//  interestFrom  = ดอกเบี้ยตั้งแต่วันที่ (คิดถึง "ดอกเบี้ยถึงวันที่")
//  annualRate    = อัตราดอกเบี้ยต่อปี (%)
//  period        = งวดที่ชำระ (เช่น 42/120)
//  payPrincipal  = เงินต้นที่ชำระงวดนี้
window.INTEREST_ESTIMATE = {
  'M-058241': {
    txCode: 'PX',
    interestToDate: '2026-06-30',
    debts: [
      { contractNo: 'L-2023-0148', loanType: 'กู้สามัญ',  principal: 612500, interestFrom: '2026-05-01', annualRate: 6.25, period: '42/120', payPrincipal: 8200 },
      { contractNo: 'L-2024-0518', loanType: 'กู้สามัญ',  principal: 380000, interestFrom: '2026-05-01', annualRate: 6.25, period: '12/96',  payPrincipal: 5100 },
      { contractNo: 'L-2021-0078', loanType: 'กู้พิเศษ',  principal: 95750,  interestFrom: '2026-05-15', annualRate: 5.75, period: '60/84',  payPrincipal: 2400 },
      { contractNo: 'E-2026-0044', loanType: 'กู้ฉุกเฉิน', principal: 20000,  interestFrom: '2026-05-25', annualRate: 6.50, period: '3/12',   payPrincipal: 1650 },
    ],
  },
  'M-058243': {
    txCode: 'PX',
    interestToDate: '2026-06-30',
    debts: [
      { contractNo: 'L-2024-0518', loanType: 'กู้สามัญ', principal: 420000, interestFrom: '2026-05-01', annualRate: 6.25, period: '24/120', payPrincipal: 4200 },
      { contractNo: 'L-2019-0214', loanType: 'กู้พิเศษ', principal: 56550,  interestFrom: '2026-05-10', annualRate: 5.75, period: '78/84',  payPrincipal: 1900 },
    ],
  },
  'M-058246': {
    txCode: 'PMP',
    interestToDate: '2026-06-30',
    debts: [
      { contractNo: 'E-2026-0051', loanType: 'กู้ฉุกเฉิน', principal: 24500, interestFrom: '2026-05-20', annualRate: 6.50, period: '2/12', payPrincipal: 2000 },
    ],
  },
};

// คำนวณบรรทัดประมาณการของหนี้หนึ่งสัญญา ณ วันที่กำหนด
window.calcInterestRow = (debt, toDate) => {
  const days = window.daysBetween(debt.interestFrom, toDate);
  const interestDue = debt.principal * (debt.annualRate / 100) * (days / 365);
  const totalPay = debt.payPrincipal + interestDue;
  const remainingPrincipal = debt.principal - debt.payPrincipal;
  return { ...debt, days, interestDue, totalPay, remainingPrincipal };
};
