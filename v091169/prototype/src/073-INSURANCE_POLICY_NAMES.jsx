// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — บันทึกเบี้ยประกัน
//  ข้อมูลตัวอย่าง: รายการกรมธรรม์/เบี้ยประกันของสมาชิก + ตัวช่วยคำนวณ
// ════════════════════════════════════════════════════════════════════

// รายชื่อ/ประเภทกรมธรรม์ที่สหกรณ์รับบันทึกเบี้ยประกัน
window.INSURANCE_POLICY_NAMES = [
  'ประกันชีวิตคุ้มครองสินเชื่อ (กลุ่ม)',
  'ประกันชีวิตคุ้มครองสินเชื่อ (รายเดี่ยว)',
  'ประกันอัคคีภัยหลักทรัพย์ค้ำประกัน',
  'ประกันอุบัติเหตุส่วนบุคคล (PA)',
  'ประกันสินเชื่อเพื่อที่อยู่อาศัย',
];

// บริษัทประกัน/สมาคมที่นำส่งเบี้ย
window.INSURANCE_COMPANIES = [
  'บมจ. ไทยสมุทรประกันชีวิต',
  'บมจ. กรุงเทพประกันภัย',
  'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์',
];

// วิธีชำระเบี้ยของสมาชิก
window.INSURANCE_PAY_METHODS = [
  { value: 'collect', label: 'หักเรียกเก็บประจำเดือน' },
  { value: 'cash',    label: 'เงินสด' },
  { value: 'transfer',label: 'โอนเงิน' },
  { value: 'deduct',  label: 'หักจากเงินกู้หรือทบต้น' },
];

// สัญญาเงินกู้ของสมาชิก (ใช้ผูกกับ "อ้างอิงสัญญา") — ดึงจากข้อมูลประมาณการดอกเบี้ย
window.memberLoanContracts = (code) => {
  const est = (window.INTEREST_ESTIMATE || {})[code];
  if (!est) return [];
  return (est.debts || []).map((d) => ({
    contractNo: d.contractNo,
    loanType: d.loanType,
    principal: d.principal,
    startDate: d.interestFrom,
    period: d.period,
  }));
};

// ─── ตัวเลขรันนิ่งของเลขที่กรมธรรม์ / เลขที่เอกสาร ───────────────────
window._insPolicySeq = 184;
window.nextInsurancePolicyNo = () => {
  const be = new Date(window.DEPOSIT_WORKING_DATE || Date.now()).getFullYear() + 543;
  window._insPolicySeq += 1;
  return `INS-${be}-${String(window._insPolicySeq).padStart(5, '0')}`;
};

// ─── ตัวช่วยคำนวณค่าเบี้ยประกัน ──────────────────────────────────────
//  vatAmount   = เบี้ยประกัน × VAT%
//  total       = เบี้ยประกัน + อากรแสตมป์ + VAT
//  discountAmt = total × ส่วนลด%
//  memberPay   = total − ส่วนลด
//  coordAmt    = total × ค่าประสานงาน%
//  netToCompany= total − ค่าประสานงาน
const _r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
window.calcInsurance = (f) => {
  const premium  = Number(f.premium)  || 0;
  const stamp    = Number(f.stamp)    || 0;
  const vatPct   = Number(f.vatPct)   || 0;
  const discPct  = Number(f.discountPct) || 0;
  const coordPct = Number(f.coordPct) || 0;

  const vatAmount    = _r2(premium * vatPct / 100);
  const total        = _r2(premium + stamp + vatAmount);
  const discountAmt  = _r2(total * discPct / 100);
  const memberPay    = _r2(total - discountAmt);
  const coordAmt     = _r2(total * coordPct / 100);
  const netToCompany = _r2(total - coordAmt);

  return { premium, stamp, vatPct, vatAmount, total, discPct, discountAmt, memberPay, coordPct, coordAmt, netToCompany };
};

// ─── ข้อมูลตัวอย่าง: เบี้ยประกันของสมาชิก (keyed by member code) ──────
window.INSURANCE_SEED = {
  'M-058241': [
    {
      id: 'INSREC-00001',
      policyNo: 'INS-2569-00181',
      contractRef: 'L-2023-0148',
      policyName: 'ประกันชีวิตคุ้มครองสินเชื่อ (กลุ่ม)',
      company: 'บมจ. ไทยสมุทรประกันชีวิต',
      entryDate: '2026-05-02',
      startDate: '2026-05-01',
      expireDate: '2027-04-30',
      premium: 18500, stamp: 92.5, vatPct: 7,
      discountPct: 5, coordPct: 12,
      payMethod: 'collect',
      by: 'จันทร์เพ็ญ มาลี', ts: '2026-05-02 10:24:11',
    },
    {
      id: 'INSREC-00002',
      policyNo: 'INS-2568-00163',
      contractRef: 'L-2021-0078',
      policyName: 'ประกันอัคคีภัยหลักทรัพย์ค้ำประกัน',
      company: 'บมจ. กรุงเทพประกันภัย',
      entryDate: '2025-08-14',
      startDate: '2025-08-15',
      expireDate: '2026-08-14',
      premium: 4200, stamp: 21, vatPct: 7,
      discountPct: 0, coordPct: 10,
      payMethod: 'cash',
      by: 'อนุชา พงษ์ไพบูลย์', ts: '2025-08-14 14:02:38',
    },
  ],
  'M-058242': [
    {
      id: 'INSREC-00003',
      policyNo: 'INS-2569-00177',
      contractRef: 'L-2024-0518',
      policyName: 'ประกันชีวิตคุ้มครองสินเชื่อ (รายเดี่ยว)',
      company: 'บมจ. ไทยสมุทรประกันชีวิต',
      entryDate: '2026-04-21',
      startDate: '2026-04-20',
      expireDate: '2027-04-19',
      premium: 12750, stamp: 63.75, vatPct: 7,
      discountPct: 10, coordPct: 12,
      payMethod: 'collect',
      by: 'จันทร์เพ็ญ มาลี', ts: '2026-04-21 09:11:02',
    },
  ],
};

// uid สำหรับรายการเบี้ยประกันที่เพิ่มใหม่
window._insUidSeq = 1000;
window.nextInsuranceUid = () => 'INSREC-' + String(++window._insUidSeq);
