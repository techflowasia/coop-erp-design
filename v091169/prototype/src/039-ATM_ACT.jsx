// ═════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ATM Activities (ข้อมูลตัวอย่าง)
//  ────────────────────────────────────────────────────────────────
//  ข้อมูลการกดเงินกู้ผ่านตู้ ATM + รายการเดินบัญชีเงินกู้ ต่อสัญญา
//  key = เลขที่สัญญา (debt.contractNo จาก window.DN_MEMBERS)
//  สัญญาที่ไม่มี key = "ไม่พบสัญญาเงินกู้ ฉุกเฉิน ATM"
// ═════════════════════════════════════════════════════════════════

window.ATM_ACT = {
  'L-2022-0455': {
    // ── ข้อมูลฝั่งสหกรณ์ ──
    coop: {
      atmContractNo: 'ฉA62002181',
      startDate: '2019-02-21',
      accountNo: '701-0-68986-5',
      approvedAmount: 100000,     // ยอดอนุมัติวงเงิน
      currentDebt: 0,             // ยอดหนี้ปัจจุบัน
      withdrawable: 10000,        // ยอดถอนได้
      note: 'อายัดการเบิกเงินกู้',
    },
    // ── วิธีคำนวณยอดกดเงินกู้ ATM ──
    calc: {
      remainingCredit: -90000,    // วงเงินที่เหลือที่ใช้คำนวณ
      paying: 0,                  // ชำระ (รอโพสต์)
      drawPending: 0,             // เบิกเงินกู้ (รอโพสต์)
      seizureCollect: 1000,       // อายัดเรียกเก็บ
      seizureAmount: 100000,      // อายัดยอด
      drawnAlready: 0,            // กดเงินกู้ไปแล้ว
      withdrawable: -191000,      // ยอดที่เบิกได้
    },
    // ── รายการกด ATM ──
    press: [
      { date: '2019-02-21 15:51', account: '701-0-68986-5', refNo: 'RC68011201',   action: 'ถอนเงินกู้ ATM', result: 'สำเร็จ',    amount: 40000, availCredit: 100000, balance: 60000, ktb: '701-0-68986-5' },
      { date: '2019-02-22 07:47', account: '701-0-68986-5', refNo: 'K0073100005104', action: 'ถอนเงินกู้ ATM', result: 'สำเร็จ',    amount: 9000,  availCredit: 60000,  balance: 51000, ktb: '701-0-68986-5' },
      { date: '2019-02-22 07:48', account: '701-0-68986-5', refNo: 'K0073100005105', action: 'ถอนเงินกู้ ATM', result: 'สำเร็จ',    amount: 51000, availCredit: 51000,  balance: 0,     ktb: '701-0-68986-5' },
      { date: '2019-02-22 08:10', account: '701-0-68986-5', refNo: 'K0073100005106', action: 'สอบถามยอดเงิน',  result: 'สำเร็จ',    amount: 0,     availCredit: 0,      balance: 0,     ktb: '701-0-68986-5' },
      { date: '2019-02-22 09:03', account: '701-0-68986-5', refNo: 'K0073100005110', action: 'ถอนเงินกู้ ATM', result: 'ไม่สำเร็จ', amount: 5000,  availCredit: 0,      balance: 0,     ktb: '701-0-68986-5', reason: 'วงเงินคงเหลือไม่พอ' },
    ],
    // ── รายการเงินกู้ (เดินบัญชี) ──
    loan: [
      { txnDate: '2019-02-21', receiptDate: '2019-02-21', receiptNo: '',                item: 'LRC', term: 0,  recvP: 0,    recvI: 0,      payP: 40000, payI: 0, balance: 40000,  intFrom: '2019-02-21', intTo: '',           intTerm: 0,      intArrears: 0, intRefund: 0, money: 'CBT', by: '21/02/2562 15:51-RUNGAROO', note: '' },
      { txnDate: '2019-02-22', receiptDate: '2019-02-22', receiptNo: 'K0073100005104', item: 'LRC', term: 0,  recvP: 0,    recvI: 0,      payP: 9000,  payI: 0, balance: 49000,  intFrom: '2019-02-21', intTo: '2019-02-22', intTerm: 6.50,   intArrears: 6.50, intRefund: 0, money: 'CBT', by: '22/02/2562 07:47-ATMKTB', note: '' },
      { txnDate: '2019-02-22', receiptDate: '2019-02-22', receiptNo: 'K0073100005105', item: 'LRC', term: 0,  recvP: 0,    recvI: 0,      payP: 51000, payI: 0, balance: 100000, intFrom: '2019-02-22', intTo: '',           intTerm: 6.50,   intArrears: 6.50, intRefund: 0, money: 'CBT', by: '22/02/2562 07:48-ATMKTB', note: '' },
      { txnDate: '2019-03-31', receiptDate: '2019-03-31', receiptNo: '6203027292',     item: 'LPM', term: 0,  recvP: 0,    recvI: 6.50,   payP: 0,     payI: 0, balance: 100000, intFrom: '2019-02-22', intTo: '2019-04-01', intTerm: 6.50,   intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-03-31', receiptDate: '2019-03-31', receiptNo: '6203027292',     item: 'LPM', term: 1,  recvP: 1000, recvI: 598.75, payP: 0,     payI: 0, balance: 99000,  intFrom: '2019-02-22', intTo: '2019-04-01', intTerm: 598.75, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-04-30', receiptDate: '2019-04-30', receiptNo: '6204027239',     item: 'LPM', term: 2,  recvP: 1000, recvI: 468.00, payP: 0,     payI: 0, balance: 98000,  intFrom: '2019-04-01', intTo: '2019-05-01', intTerm: 468.00, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-05-31', receiptDate: '2019-05-31', receiptNo: '6205027224',     item: 'LPM', term: 3,  recvP: 1000, recvI: 478.75, payP: 0,     payI: 0, balance: 97000,  intFrom: '2019-05-01', intTo: '2019-06-01', intTerm: 478.75, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-06-30', receiptDate: '2019-06-30', receiptNo: '6206027177',     item: 'LPM', term: 4,  recvP: 1000, recvI: 458.50, payP: 0,     payI: 0, balance: 96000,  intFrom: '2019-06-01', intTo: '2019-07-01', intTerm: 458.50, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-07-31', receiptDate: '2019-07-31', receiptNo: '6207027154',     item: 'LPM', term: 5,  recvP: 1000, recvI: 469.00, payP: 0,     payI: 0, balance: 95000,  intFrom: '2019-07-01', intTo: '2019-08-01', intTerm: 469.00, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-08-31', receiptDate: '2019-08-31', receiptNo: '6208027144',     item: 'LPM', term: 6,  recvP: 1000, recvI: 464.00, payP: 0,     payI: 0, balance: 94000,  intFrom: '2019-08-01', intTo: '2019-09-01', intTerm: 464.00, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-09-30', receiptDate: '2019-09-30', receiptNo: '6209027312',     item: 'LPM', term: 7,  recvP: 1000, recvI: 444.25, payP: 0,     payI: 0, balance: 93000,  intFrom: '2019-09-01', intTo: '2019-10-01', intTerm: 444.25, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-10-31', receiptDate: '2019-10-31', receiptNo: '6210027998',     item: 'LPM', term: 8,  recvP: 1000, recvI: 454.25, payP: 0,     payI: 0, balance: 92000,  intFrom: '2019-10-01', intTo: '2019-11-01', intTerm: 454.25, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-11-30', receiptDate: '2019-11-30', receiptNo: '6211028086',     item: 'LPM', term: 9,  recvP: 1000, recvI: 435.00, payP: 0,     payI: 0, balance: 91000,  intFrom: '2019-11-01', intTo: '2019-12-01', intTerm: 435.00, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
      { txnDate: '2019-12-31', receiptDate: '2019-12-31', receiptNo: '6212028159',     item: 'LPM', term: 10, recvP: 1000, recvI: 444.50, payP: 0,     payI: 0, balance: 90000,  intFrom: '2019-12-01', intTo: '2020-01-01', intTerm: 444.50, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
    ],
  },

  // สัญญาฉุกเฉิน — มีการกด ATM แต่จำนวนน้อย (ตัวอย่างที่สอง)
  'EM-2024-0771': {
    coop: {
      atmContractNo: 'ฉE24007710',
      startDate: '2024-02-14',
      accountNo: '701-0-71204-2',
      approvedAmount: 50000,
      currentDebt: 18600,
      withdrawable: 0,
      note: '',
    },
    calc: {
      remainingCredit: 31400,
      paying: 0,
      drawPending: 0,
      seizureCollect: 0,
      seizureAmount: 0,
      drawnAlready: 50000,
      withdrawable: 0,
    },
    press: [
      { date: '2024-02-14 10:22', account: '701-0-71204-2', refNo: 'K0073100118842', action: 'ถอนเงินกู้ ATM', result: 'สำเร็จ', amount: 30000, availCredit: 50000, balance: 20000, ktb: '701-0-71204-2' },
      { date: '2024-02-14 10:24', account: '701-0-71204-2', refNo: 'K0073100118843', action: 'ถอนเงินกู้ ATM', result: 'สำเร็จ', amount: 20000, availCredit: 20000, balance: 0,     ktb: '701-0-71204-2' },
    ],
    loan: [
      { txnDate: '2024-02-14', receiptDate: '2024-02-14', receiptNo: 'K0073100118842', item: 'LRC', term: 0, recvP: 0,    recvI: 0,      payP: 30000, payI: 0, balance: 30000, intFrom: '2024-02-14', intTo: '',           intTerm: 0,      intArrears: 0, intRefund: 0, money: 'CBT', by: '14/02/2567 10:22-ATMKTB', note: '' },
      { txnDate: '2024-02-14', receiptDate: '2024-02-14', receiptNo: 'K0073100118843', item: 'LRC', term: 0, recvP: 0,    recvI: 0,      payP: 20000, payI: 0, balance: 50000, intFrom: '2024-02-14', intTo: '',           intTerm: 0,      intArrears: 0, intRefund: 0, money: 'CBT', by: '14/02/2567 10:24-ATMKTB', note: '' },
      { txnDate: '2024-03-25', receiptDate: '2024-03-25', receiptNo: '6703031127',     item: 'LPM', term: 1, recvP: 3120, recvI: 291.25, payP: 0,     payI: 0, balance: 46880, intFrom: '2024-02-14', intTo: '2024-03-25', intTerm: 291.25, intArrears: 0, intRefund: 0, money: 'TRN', by: '', note: '' },
    ],
  },
};

// รายการ ATM ของสัญญา (คืน null เมื่อไม่พบ)
window.atmActOf = (contractNo) => (contractNo && window.ATM_ACT[contractNo]) || null;

// ตัวเลือก "ประเภทรายการ"
window.ATM_TXN_TYPES = [
  { v: 'loan',    l: 'เงินกู้' },
  { v: 'deposit', l: 'เงินฝาก' },
];
