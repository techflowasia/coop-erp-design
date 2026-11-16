// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ควบคุมเงินกู้ (Loan Control)
//  ข้อมูลสาธิต: ฟิลด์ควบคุมต่อสัญญา (เลขที่บัญชี · อายัดเรียกเก็บ ·
//  อายัดยอดเงิน · สถานะวงเงิน · สถานะสัญญา · หลักประกัน) + ประวัติ
//  อ้างอิงสมาชิก/สัญญาจาก DN_MEMBERS (data-debt-notice.js)
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือกสถานะ ──────────────────────────────────────────────────
window.LC_CREDIT_STATUS = [
  { v: 'ปกติ',            pill: 'ok'   },
  { v: 'อายัดวงเงิน',      pill: 'bad'  },
  { v: 'ระงับชั่วคราว',    pill: 'warn' },
];
window.LC_CONTRACT_STATUS = [
  { v: 'ปกติ',       pill: 'ok'      },
  { v: 'พักชำระ',    pill: 'warn'    },
  { v: 'ดำเนินคดี',  pill: 'bad'     },
  { v: 'ปิดสัญญา',   pill: 'neutral' },
];
window.lcCreditPill   = (v) => (window.LC_CREDIT_STATUS.find(s => s.v === v)   || {}).pill || 'neutral';
window.lcContractPill = (v) => (window.LC_CONTRACT_STATUS.find(s => s.v === v) || {}).pill || 'neutral';

// ─── ข้อมูลควบคุมเพิ่มเติมต่อสัญญา (เติมฟิลด์ที่หน้าจอต้องใช้) ──────────
//  accountNo · startDate · lastInterestCalc · withdrawable · seizureCollection
//  · seizureAmount · creditStatus · contractStatus · collateral · smsPhone
window.LC_CONTROL_EXTRA = {
  'L-2022-0455': {
    accountNo: '040-1-52573-2', startDate: '2019-02-07', lastInterestCalc: '2020-01-08',
    withdrawable: -146982.25, seizureCollection: 1000, seizureAmount: 150000,
    creditStatus: 'อายัดวงเงิน', contractStatus: 'ปิดสัญญา',
    collateral: '048509 : นาง ธัชชนก วสุธนพิเชียร (ประกันชีวิต)', smsPhone: '061-939-5989',
    approvedAmount: 150000,
  },
  'EM-2024-0771': {
    accountNo: '040-1-88120-9', startDate: '2024-02-09', lastInterestCalc: '2026-05-25',
    withdrawable: 31400, seizureCollection: 0, seizureAmount: 0,
    creditStatus: 'ปกติ', contractStatus: 'ปกติ',
    collateral: 'SH-24-0771 : หุ้นสหกรณ์ออมทรัพย์', smsPhone: '089-114-2260',
  },
  'SP-2021-0144': {
    accountNo: '040-1-33902-5', startDate: '2021-08-02', lastInterestCalc: '2025-10-25',
    withdrawable: -12500, seizureCollection: 2500, seizureAmount: 0,
    creditStatus: 'ระงับชั่วคราว', contractStatus: 'พักชำระ',
    collateral: 'M-058243 : นายอนุชา สุขสวัสดิ์ (บุคคลค้ำ)', smsPhone: '061-939-5989',
  },
  'SH-2023-0210': {
    accountNo: '040-1-71054-8', startDate: '2023-04-11', lastInterestCalc: '2026-05-25',
    withdrawable: 8200, seizureCollection: 0, seizureAmount: 0,
    creditStatus: 'ปกติ', contractStatus: 'ปกติ',
    collateral: 'SH-23-0210 : หุ้นสหกรณ์ออมทรัพย์', smsPhone: '061-939-5989',
  },
  'L-2021-0332': {
    accountNo: '040-1-29477-1', startDate: '2021-05-20', lastInterestCalc: '2025-07-25',
    withdrawable: -55000, seizureCollection: 6450, seizureAmount: 100000,
    creditStatus: 'อายัดวงเงิน', contractStatus: 'ดำเนินคดี',
    collateral: 'M-058241 : นายสมชาย ใจดี รักษ์ออม (บุคคลค้ำ)', smsPhone: '086-552-0091',
  },
  'L-2020-0118': {
    accountNo: '040-1-10238-4', startDate: '2020-08-11', lastInterestCalc: '2025-03-25',
    withdrawable: -107000, seizureCollection: 8200, seizureAmount: 250000,
    creditStatus: 'อายัดวงเงิน', contractStatus: 'ดำเนินคดี',
    collateral: 'LD-2563-014 : โฉนดที่ดิน เลขที่ 14 อ.เมือง', smsPhone: '081-770-3345',
  },
};

// ─── ข้อมูลควบคุมเงินกู้ (enrich) — รวม debt + LC_CONTROL_EXTRA ──────────
window.lcControlInfo = (debt) => {
  if (!debt) return null;
  const x = window.LC_CONTROL_EXTRA[debt.contractNo] || {};
  const approved = x.approvedAmount || (debt.principalRemaining + debt.paidTerms * debt.installment);
  return {
    contractNo: debt.contractNo,
    loanType: debt.type,
    accountNo: x.accountNo || '—',
    startDate: x.startDate || '2022-01-01',
    lastInterestCalc: x.lastInterestCalc || debt.lastPayDate || '—',
    approvedAmount: approved,
    outstanding: debt.principalRemaining || 0,
    interestArrears: debt.interestDue || 0,
    monthlyPayment: debt.installment || 0,
    withdrawable: x.withdrawable != null ? x.withdrawable : 0,
    seizureCollection: x.seizureCollection || 0,
    seizureAmount: x.seizureAmount || 0,
    creditStatus: x.creditStatus || 'ปกติ',
    contractStatus: x.contractStatus || 'ปกติ',
    collateral: x.collateral || '—',
    smsPhone: x.smsPhone || '—',
  };
};

// ─── ผู้ทำรายการ (ล็อกอินปัจจุบัน) ───────────────────────────────────
window.LC_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'มนตรี ศรีสุข';

// ─── ประวัติการเปลี่ยนแปลง (ต่อสัญญา) ────────────────────────────────
//  date · action(รายการ) · change(ค่าที่เปลี่ยน) · reason(เหตุผล) · by
window.LC_HISTORY = {
  'L-2022-0455': [
    { date: '2020-01-15 10:42', action: 'สถานะสัญญา', change: 'ปกติ → ปิดสัญญา', reason: 'ครบอายุวงเงิน 01/2563 ปิดสัญญาตามระเบียบ', by: 'มนตรี ศรีสุข' },
    { date: '2020-01-08 09:15', action: 'อายัดยอดเงิน', change: '0.00 → 150,000.00', reason: 'อายัดตามคำสั่งเจ้าพนักงานบังคับคดี', by: 'สุนีย์ พรหมมา' },
    { date: '2019-12-20 14:30', action: 'อายัดเรียกเก็บ', change: '0.00 → 1,000.00', reason: 'ตั้งอายัดเรียกเก็บรายเดือน', by: 'สุนีย์ พรหมมา' },
  ],
  'L-2021-0332': [
    { date: '2025-08-01 11:20', action: 'สถานะวงเงิน', change: 'ปกติ → อายัดวงเงิน', reason: 'ผิดนัดชำระเกิน 8 งวด ส่งดำเนินคดี', by: 'มนตรี ศรีสุข' },
  ],
  'L-2020-0118': [
    { date: '2025-04-02 09:05', action: 'สถานะสัญญา', change: 'ปกติ → ดำเนินคดี', reason: 'สมาชิกเสียชีวิต ทายาทไม่รับสภาพหนี้', by: 'มนตรี ศรีสุข' },
    { date: '2025-04-02 09:00', action: 'อายัดยอดเงิน', change: '0.00 → 250,000.00', reason: 'อายัดหลักประกันที่ดินตามหมายศาล', by: 'มนตรี ศรีสุข' },
  ],
};
window.lcHistory = (contractNo) => (window.LC_HISTORY[contractNo] || []).map(r => ({ ...r }));
