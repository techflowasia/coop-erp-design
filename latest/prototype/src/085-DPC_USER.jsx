// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก — ข้อมูลพื้นฐาน (master data / ค่าคงที่)
//  Seeds: ประเภทบัญชีเงินฝาก · อัตราดอกเบี้ยเงินฝาก · ค่าธรรมเนียม/ค่าปรับ
//         · การหักเงิน ฌปท/ฌาปนกิจ · ตั้งค่าพิมพ์สมุดคู่ฝาก
// ════════════════════════════════════════════════════════════════════

const DPC_USER = 'จันทร์เพ็ญ มาลี';

// ─── 1. ประเภทบัญชีเงินฝาก ───────────────────────────────────────────
window.DEP_ACCTYPE_SEED = [
  {
    id: 'DAT-01', code: 'S01', name: 'ออมทรัพย์', enabled: true,
    createdDate: '2008-01-05', createdBy: 'ประภาส ทองสุข',
    note: 'บัญชีออมทรัพย์ทั่วไป ถอนได้ตลอด',
    cond:   { minOpen: 100, minBalance: 100, limitPerMember: false, maxPerMember: 0 },
    interest: { method: 'daily', rate: 1.25, dayBase: 365, payCycle: 'ปีละ 2 ครั้ง (มิ.ย./ธ.ค.)' },
    withdraw: { freeCount: 0, feeOver: 0, exemptCond: 'ไม่จำกัดจำนวนครั้ง' },
    passbook: { useBook: true, noBook: true },
    gl: { glCode: '21010101', pairCode: '51030101', bankType: 'ออมทรัพย์' },
    control: { needApprove: false, loanDisburse: false },
  },
  {
    id: 'DAT-02', code: 'S02', name: 'ออมทรัพย์พิเศษ', enabled: true,
    createdDate: '2010-04-01', createdBy: 'ประภาส ทองสุข',
    note: 'ดอกเบี้ยสูงกว่า ถอนฟรี 1 ครั้ง/เดือน',
    cond:   { minOpen: 10000, minBalance: 1000, limitPerMember: true, maxPerMember: 3 },
    interest: { method: 'daily', rate: 2.75, dayBase: 365, payCycle: 'ปีละ 2 ครั้ง (มิ.ย./ธ.ค.)' },
    withdraw: { freeCount: 1, feeOver: 50, exemptCond: 'ยกเว้นกรณีปิดบัญชี' },
    passbook: { useBook: true, noBook: true },
    gl: { glCode: '21010102', pairCode: '51030102', bankType: 'ออมทรัพย์' },
    control: { needApprove: false, loanDisburse: false },
  },
  {
    id: 'DAT-03', code: 'F12', name: 'ฝากประจำ 12 เดือน', enabled: true,
    createdDate: '2012-06-01', createdBy: 'ประภาส ทองสุข',
    note: 'ฝากประจำ ครบกำหนด 12 เดือน หักภาษี ณ ที่จ่าย',
    cond:   { minOpen: 50000, minBalance: 50000, limitPerMember: false, maxPerMember: 0 },
    interest: { method: 'monthly', rate: 3.10, dayBase: 365, payCycle: 'เมื่อครบกำหนด' },
    withdraw: { freeCount: 0, feeOver: 0, exemptCond: 'ถอนก่อนครบกำหนดได้อัตราออมทรัพย์' },
    passbook: { useBook: true, noBook: false },
    gl: { glCode: '21010201', pairCode: '51030201', bankType: 'ฝากประจำ' },
    control: { needApprove: false, loanDisburse: false },
  },
  {
    id: 'DAT-04', code: 'L90', name: 'เงินฝากเพื่อรับเงินกู้พิเศษ', enabled: true,
    createdDate: '2018-09-10', createdBy: 'ประภาส ทองสุข',
    note: 'บัญชีรับเงินกู้พิเศษเป็นงวด ๆ — ต้องได้รับอนุมัติจากแผนกประมวลผลก่อนเปิด',
    cond:   { minOpen: 0, minBalance: 0, limitPerMember: true, maxPerMember: 1 },
    interest: { method: 'daily', rate: 0.50, dayBase: 365, payCycle: 'ปีละ 1 ครั้ง (ธ.ค.)' },
    withdraw: { freeCount: 99, feeOver: 0, exemptCond: 'เบิกตามงวดเงินกู้' },
    passbook: { useBook: false, noBook: true },
    gl: { glCode: '21010301', pairCode: '51030301', bankType: 'ออมทรัพย์' },
    control: { needApprove: true, loanDisburse: true },
  },
  {
    id: 'DAT-05', code: 'W10', name: 'เงินฝากสำหรับหัก ฌปท / ฌาปนกิจ', enabled: true,
    createdDate: '2016-01-15', createdBy: 'ประภาส ทองสุข',
    note: 'พักเงินเพื่อหักเข้ากองทุนสวัสดิการอัตโนมัติ',
    cond:   { minOpen: 0, minBalance: 0, limitPerMember: true, maxPerMember: 1 },
    interest: { method: 'daily', rate: 0.50, dayBase: 365, payCycle: 'ปีละ 1 ครั้ง (ธ.ค.)' },
    withdraw: { freeCount: 0, feeOver: 0, exemptCond: 'ถอนได้เฉพาะนำส่งกองทุน' },
    passbook: { useBook: false, noBook: true },
    gl: { glCode: '21010401', pairCode: '51030401', bankType: 'ออมทรัพย์' },
    control: { needApprove: false, loanDisburse: false },
  },
  {
    id: 'DAT-06', code: 'T01', name: 'บัญชีรับโอนจากระบบเงินกู้', enabled: true,
    createdDate: '2019-03-01', createdBy: 'ประภาส ทองสุข',
    note: 'บัญชีพักรับโอนจากระบบเงินกู้',
    cond:   { minOpen: 0, minBalance: 0, limitPerMember: false, maxPerMember: 0 },
    interest: { method: 'daily', rate: 0.00, dayBase: 365, payCycle: 'ไม่จ่ายดอกเบี้ย' },
    withdraw: { freeCount: 99, feeOver: 0, exemptCond: 'บัญชีพักภายใน' },
    passbook: { useBook: false, noBook: true },
    gl: { glCode: '21019901', pairCode: '51039901', bankType: 'ออมทรัพย์' },
    control: { needApprove: false, loanDisburse: false },
  },
  {
    id: 'DAT-07', code: 'T02', name: 'บัญชีรับโอนจากตัวแทน', enabled: false,
    createdDate: '2020-07-01', createdBy: 'ประภาส ทองสุข',
    note: 'บัญชีพักรับโอนจากตัวแทน — ปิดใช้งานชั่วคราว',
    cond:   { minOpen: 0, minBalance: 0, limitPerMember: false, maxPerMember: 0 },
    interest: { method: 'daily', rate: 0.00, dayBase: 365, payCycle: 'ไม่จ่ายดอกเบี้ย' },
    withdraw: { freeCount: 99, feeOver: 0, exemptCond: 'บัญชีพักภายใน' },
    passbook: { useBook: false, noBook: true },
    gl: { glCode: '21019902', pairCode: '51039902', bankType: 'ออมทรัพย์' },
    control: { needApprove: false, loanDisburse: false },
  },
];

window.DEP_INT_METHODS = {
  daily:   { label: 'รายวัน',   pill: 'info' },
  monthly: { label: 'รายเดือน', pill: 'neutral' },
};

// ─── 2. อัตราดอกเบี้ยเงินฝาก (ตามช่วงยอดเงิน + ประวัติ) ───────────────
window.DEP_RATE_SEED = [
  {
    id: 'DR-01', code: 'S01', name: 'ออมทรัพย์', enabled: true,
    createdDate: '2008-01-05', createdBy: 'ประภาส ทองสุข',
    note: 'อัตราเดียวทุกช่วงยอด',
    rates: [
      { effectiveDate: '2025-01-01', endDate: '', balFrom: 0, balTo: 999999999, rate: 1.2500, method: 'daily', dayBase: 365, approve: 'approved', user: DPC_USER, date: '2024-12-18' },
      { effectiveDate: '2024-01-01', endDate: '2024-12-31', balFrom: 0, balTo: 999999999, rate: 1.5000, method: 'daily', dayBase: 365, approve: 'approved', user: 'ประภาส ทองสุข', date: '2023-12-20' },
    ],
  },
  {
    id: 'DR-02', code: 'S02', name: 'ออมทรัพย์พิเศษ', enabled: true,
    createdDate: '2010-04-01', createdBy: 'ประภาส ทองสุข',
    note: 'คิดดอกเบี้ยขั้นบันไดตามยอดเงิน',
    rates: [
      { effectiveDate: '2025-01-01', endDate: '', balFrom: 0,      balTo: 100000,    rate: 2.5000, method: 'daily', dayBase: 365, approve: 'approved', user: DPC_USER, date: '2024-12-18' },
      { effectiveDate: '2025-01-01', endDate: '', balFrom: 100001, balTo: 500000,    rate: 2.7500, method: 'daily', dayBase: 365, approve: 'approved', user: DPC_USER, date: '2024-12-18' },
      { effectiveDate: '2025-01-01', endDate: '', balFrom: 500001, balTo: 999999999, rate: 3.0000, method: 'daily', dayBase: 365, approve: 'approved', user: DPC_USER, date: '2024-12-18' },
    ],
  },
  {
    id: 'DR-03', code: 'F12', name: 'ฝากประจำ 12 เดือน', enabled: true,
    createdDate: '2012-06-01', createdBy: 'ประภาส ทองสุข',
    note: 'หักภาษี ณ ที่จ่าย 15%',
    rates: [
      { effectiveDate: '2025-01-01', endDate: '', balFrom: 50000, balTo: 999999999, rate: 3.1000, method: 'monthly', dayBase: 365, approve: 'approved', user: DPC_USER, date: '2024-12-18' },
    ],
  },
  {
    id: 'DR-04', code: 'F24', name: 'ฝากประจำ 24 เดือน', enabled: false,
    createdDate: '2025-02-01', createdBy: DPC_USER,
    note: 'รออนุมัติคณะกรรมการ',
    rates: [
      { effectiveDate: '2025-04-01', endDate: '', balFrom: 50000, balTo: 999999999, rate: 3.4000, method: 'monthly', dayBase: 365, approve: 'pending', user: DPC_USER, date: '2025-02-12' },
    ],
  },
];

window.DEP_RATE_APPROVE = {
  approved: { label: 'อนุมัติแล้ว', pill: 'ok' },
  pending:  { label: 'รออนุมัติ',  pill: 'warn' },
  draft:    { label: 'ร่าง',       pill: 'neutral' },
};

// ─── 3. ค่าธรรมเนียมและค่าปรับ ───────────────────────────────────────
window.DEP_FEE_TXN_TYPES = ['ถอนเกินจำนวนครั้ง', 'ปิดบัญชี', 'ปิดบัญชีก่อนกำหนด', 'ออกสมุดใหม่', 'อายัด/ปลดอายัด'];
window.DEP_FEE_SEED = [
  { id: 'FEE-01', acctType: 'ออมทรัพย์พิเศษ', txnType: 'ถอนเกินจำนวนครั้ง', freeCount: 1, fee: 50, feeType: 'flat',
    exemptCond: 'ยกเว้นถ้าถอนปิดบัญชี / ถอนหลายรายการในคราวเดียว', showAs: 'แสดงเป็น Transaction แยก “ค่าธรรมเนียมถอน”',
    glCode: '43010101', enabled: true },
  { id: 'FEE-02', acctType: 'ทุกประเภท', txnType: 'ออกสมุดใหม่', freeCount: 0, fee: 100, feeType: 'flat',
    exemptCond: 'ยกเว้นกรณีสมุดชำรุดจากระบบ', showAs: 'แสดงเป็น Transaction แยก “ค่าออกสมุด”',
    glCode: '43010102', enabled: true },
  { id: 'FEE-03', acctType: 'ฝากประจำ 12 เดือน', txnType: 'ปิดบัญชีก่อนกำหนด', freeCount: 0, fee: 0, feeType: 'rate_diff',
    exemptCond: 'คิดส่วนต่างดอกเบี้ยเป็นค่าปรับ', showAs: 'แสดงค่าปรับแยกในสมุดคู่ฝาก “ค่าปรับถอนก่อนกำหนด”',
    glCode: '43010103', enabled: true },
  { id: 'FEE-04', acctType: 'ทุกประเภท', txnType: 'อายัด/ปลดอายัด', freeCount: 0, fee: 200, feeType: 'flat',
    exemptCond: 'ยกเว้นกรณีคำสั่งศาล', showAs: 'แสดงเป็น Transaction แยก',
    glCode: '43010104', enabled: false },
];
window.DEP_FEE_TYPES = {
  flat:      { label: 'จำนวนเงินคงที่ (บาท)' },
  rate_diff: { label: 'คิดเป็นส่วนต่างดอกเบี้ย' },
  percent:   { label: 'ร้อยละของยอดเงิน' },
};

// ─── 4. การหักเงิน ฌปท / ฌาปนกิจ ─────────────────────────────────────
window.DEP_FUNERAL_FUNDS = {
  CHPT:  { code: 'ฌปท', label: 'ฌปท. (ฌาปนกิจสงเคราะห์ฯ พนักงาน)' },
  CHAPA: { code: 'ฌาปนกิจ', label: 'ฌาปนกิจสงเคราะห์สมาชิกสหกรณ์' },
};
window.DEP_FUNERAL_SEED = [
  { id: 'FN-001', fund: 'CHPT',  member: '58241', name: 'สมชาย ใจดี',        accNo: 'W10-58241-0', amount: 220, baseAmount: 220, freq: 'รายเดือน', startDate: '2020-01-01', endDate: '', status: 'active',  lastResult: 'success', editedReason: '', approver: '' },
  { id: 'FN-002', fund: 'CHAPA', member: '58241', name: 'สมชาย ใจดี',        accNo: 'W10-58241-0', amount: 150, baseAmount: 150, freq: 'รายเดือน', startDate: '2020-01-01', endDate: '', status: 'active',  lastResult: 'success', editedReason: '', approver: '' },
  { id: 'FN-003', fund: 'CHPT',  member: '60112', name: 'วิภาวดี รังสิต',     accNo: 'W10-60112-3', amount: 220, baseAmount: 200, freq: 'รายเดือน', startDate: '2021-05-01', endDate: '', status: 'active',  lastResult: 'success', editedReason: 'ปรับเพิ่มตามมติที่ประชุม 2/2568', approver: 'อภิชาติ ศรีสุข' },
  { id: 'FN-004', fund: 'CHAPA', member: '60112', name: 'วิภาวดี รังสิต',     accNo: 'W10-60112-3', amount: 150, baseAmount: 150, freq: 'รายเดือน', startDate: '2021-05-01', endDate: '', status: 'active',  lastResult: 'fail',    editedReason: '', approver: '' },
  { id: 'FN-005', fund: 'CHPT',  member: '57003', name: 'ธีรพงษ์ มากมี',      accNo: 'W10-57003-9', amount: 220, baseAmount: 220, freq: 'รายเดือน', startDate: '2019-03-01', endDate: '', status: 'active',  lastResult: 'success', editedReason: '', approver: '' },
  { id: 'FN-006', fund: 'CHAPA', member: '57003', name: 'ธีรพงษ์ มากมี',      accNo: 'W10-57003-9', amount: 150, baseAmount: 150, freq: 'รายเดือน', startDate: '2019-03-01', endDate: '2025-12-31', status: 'paused', lastResult: 'success', editedReason: 'พักการหักตามคำขอ', approver: 'อภิชาติ ศรีสุข' },
  { id: 'FN-007', fund: 'CHPT',  member: '61580', name: 'ปาริชาติ สุขสวัสดิ์', accNo: 'W10-61580-1', amount: 220, baseAmount: 220, freq: 'รายเดือน', startDate: '2022-08-01', endDate: '', status: 'active',  lastResult: 'fail',    editedReason: '', approver: '' },
  { id: 'FN-008', fund: 'CHAPA', member: '61580', name: 'ปาริชาติ สุขสวัสดิ์', accNo: 'W10-61580-1', amount: 150, baseAmount: 150, freq: 'รายเดือน', startDate: '2022-08-01', endDate: '', status: 'active',  lastResult: 'success', editedReason: '', approver: '' },
];

// ─── 5. ตั้งค่าพิมพ์สมุดคู่ฝาก / Passbook ─────────────────────────────
window.DEP_PASSBOOK_SEED = {
  format: 'สมุดคู่ฝากมาตรฐานสหกรณ์ (3 คอลัมน์)',
  linesPerPage: 23,
  startLine: 1,
  startOffsetX: 4.0,
  startOffsetY: 6.5,
  lineSpacing: 6.0,
  txtFormat: 'วันที่ · รายการ · ถอน · ฝาก · คงเหลือ',
  dateFormat: 'วว/ดด/ปป (พ.ศ.)',
  moneyFormat: '#,##0.00',
  printer: 'PASSBOOK-EPSON-PLQ20 (เคาน์เตอร์ 1)',
  template: 'PB-STD-2569',
  autoPassbook: true,
  mobileNoBook: true,
};
window.DEP_PASSBOOK_FORMATS = [
  'สมุดคู่ฝากมาตรฐานสหกรณ์ (3 คอลัมน์)',
  'สมุดคู่ฝากแบบยาว (5 คอลัมน์)',
  'สมุดออมทรัพย์พิเศษ (มีดอกเบี้ย)',
];
window.DEP_PASSBOOK_PRINTERS = [
  'PASSBOOK-EPSON-PLQ20 (เคาน์เตอร์ 1)',
  'PASSBOOK-EPSON-PLQ20 (เคาน์เตอร์ 2)',
  'PASSBOOK-EPSON-PLQ30 (การเงิน)',
];
// ตัวอย่างบรรทัดสำหรับทดสอบตำแหน่งพิมพ์
window.DEP_PASSBOOK_SAMPLE = [
  { date: '02/04/69', desc: 'ยอดยกมา',        wd: '',          dp: '',           bal: '342,850.50' },
  { date: '25/04/69', desc: 'หักเงินเดือน',    wd: '',          dp: '2,000.00',   bal: '344,850.50' },
  { date: '28/04/69', desc: 'ถอนเงินสด',       wd: '15,000.00', dp: '',           bal: '329,850.50' },
  { date: '28/04/69', desc: 'ค่าธรรมเนียมถอน', wd: '50.00',     dp: '',           bal: '329,800.50' },
  { date: '30/04/69', desc: 'ดอกเบี้ย',        wd: '',          dp: '374.50',     bal: '330,175.00' },
];
