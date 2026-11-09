// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน — รับ–จ่ายเงิน (เช็ค / โอนธนาคาร)
//  • เล่มเช็ค            (CHQ_BOOK_SEED)
//  • รายการจ่ายเช็ค       (CHQ_PAY_SEED)
//  • ไฟล์โอนธนาคาร        (BANK_FILE_SEED)
// ════════════════════════════════════════════════════════════════════

// บัญชีธนาคารของสหกรณ์ (ใช้ทั้งจ่ายเช็คและสร้างไฟล์โอน)
window.COOP_BANK_ACCOUNTS = [
  { id: 'BA-01', bank: 'ธนาคารกรุงไทย', short: 'KTB', branch: 'แจ้งวัฒนะ', accountNo: '067-1-23456-7', accountName: 'สอ.การสื่อสารแห่งประเทศไทย', type: 'กระแสรายวัน' },
  { id: 'BA-02', bank: 'ธนาคารออมสิน', short: 'GSB', branch: 'สำนักงานใหญ่', accountNo: '020-6-54321-0', accountName: 'สอ.การสื่อสารแห่งประเทศไทย', type: 'กระแสรายวัน' },
  { id: 'BA-03', bank: 'ธนาคารกสิกรไทย', short: 'KBANK', branch: 'หลักสี่', accountNo: '012-3-45678-9', accountName: 'สอ.การสื่อสารแห่งประเทศไทย', type: 'ออมทรัพย์' },
];

// สถานะใบเช็คในเล่ม
window.CHQ_STATUS = {
  free:    { l: 'ว่าง',     pill: 'ok' },
  used:    { l: 'ใช้แล้ว',  pill: 'info' },
  void:    { l: 'ยกเลิก',   pill: 'neutral' },
  damaged: { l: 'เสีย',     pill: 'bad' },
};

// ─── เล่มเช็ค ─────────────────────────────────────────────────────────
window.CHQ_BOOK_SEED = [
  { id: 'CB-2569-006', bankId: 'BA-01', bank: 'ธนาคารกรุงไทย', branch: 'แจ้งวัฒนะ', accountNo: '067-1-23456-7',
    startNo: '06700125', endNo: '06700174', count: 50, receiveDate: '2026-05-04', by: 'จันทร์เพ็ญ มาลี',
    status: 'active', used: 18, free: 30, voided: 1, damaged: 1 },
  { id: 'CB-2569-005', bankId: 'BA-02', bank: 'ธนาคารออมสิน', branch: 'สำนักงานใหญ่', accountNo: '020-6-54321-0',
    startNo: '02055001', endNo: '02055050', count: 50, receiveDate: '2026-03-12', by: 'จันทร์เพ็ญ มาลี',
    status: 'active', used: 41, free: 8, voided: 1, damaged: 0 },
  { id: 'CB-2569-004', bankId: 'BA-03', bank: 'ธนาคารกสิกรไทย', branch: 'หลักสี่', accountNo: '012-3-45678-9',
    startNo: '01200301', endNo: '01200350', count: 50, receiveDate: '2026-01-20', by: 'ประภาส ทองสุข',
    status: 'active', used: 33, free: 16, voided: 0, damaged: 1 },
  { id: 'CB-2568-021', bankId: 'BA-01', bank: 'ธนาคารกรุงไทย', branch: 'แจ้งวัฒนะ', accountNo: '067-1-23456-7',
    startNo: '06700075', endNo: '06700124', count: 50, receiveDate: '2025-10-08', by: 'จันทร์เพ็ญ มาลี',
    status: 'depleted', used: 49, free: 0, voided: 1, damaged: 0 },
];

// รายการเลขเช็คในเล่มที่กำลังใช้งาน (สำหรับหน้าจ่ายเช็ค — เลือกใบว่าง)
window.CHQ_LEAF_SEED = (function () {
  const leaves = [];
  // เล่ม CB-2569-006: ใช้ 06700125–06700142 แล้ว, ว่าง 06700143 เป็นต้นไป
  const mk = (bookId, accountNo, no, status) => ({ bookId, accountNo, no, status });
  for (let i = 0; i < 50; i++) {
    const no = String(6700125 + i).padStart(8, '0');
    let st = 'free';
    if (i < 18) st = 'used';
    if (i === 7) st = 'void';
    if (i === 12) st = 'damaged';
    leaves.push(mk('CB-2569-006', '067-1-23456-7', no, st));
  }
  return leaves;
})();

// ─── รายการจ่ายเช็ค ───────────────────────────────────────────────────
// status: issued (จ่ายแล้ว) | cleared (ขึ้นเงินแล้ว) | void (ยกเลิก)
window.CHQ_PAY_SEED = [
  { id: 'CHQ-2569-0042', chequeNo: '06700142', bookId: 'CB-2569-006', accountNo: '067-1-23456-7', bank: 'ธนาคารกรุงไทย',
    payDate: '2026-06-10', payee: 'บมจ. ปตท. (ลงทุนหุ้นกู้ PTTC295A)', amount: 30000000,
    detail: 'ชำระค่าซื้อหุ้นกู้ PTTC295A จำนวน 30 ล้านบาท', ref: 'INV-2569-0011', voucherNo: 'PV-2569-0231',
    status: 'cleared', clearDate: '2026-06-11' },
  { id: 'CHQ-2569-0041', chequeNo: '06700141', bookId: 'CB-2569-006', accountNo: '067-1-23456-7', bank: 'ธนาคารกรุงไทย',
    payDate: '2026-06-05', payee: 'สำนักงานบริหารหนี้สาธารณะ', amount: 49925000,
    detail: 'ชำระค่าซื้อพันธบัตร LB29DA', ref: 'INV-2569-0012', voucherNo: 'PV-2569-0228',
    status: 'cleared', clearDate: '2026-06-06' },
  { id: 'CHQ-2569-0040', chequeNo: '02055041', bookId: 'CB-2569-005', accountNo: '020-6-54321-0', bank: 'ธนาคารออมสิน',
    payDate: '2026-06-02', payee: 'บจก. รักษาความปลอดภัย ไทยซีเคียว', amount: 86400,
    detail: 'ค่าบริการ รปภ. ประจำเดือน พ.ค. 2569', ref: 'PV-2569-0220', voucherNo: 'PV-2569-0220',
    status: 'issued', clearDate: null },
  { id: 'CHQ-2569-0039', chequeNo: '01200333', bookId: 'CB-2569-004', accountNo: '012-3-45678-9', bank: 'ธนาคารกสิกรไทย',
    payDate: '2026-05-28', payee: 'นายสมชาย ใจดี รักษ์ออม', amount: 250000,
    detail: 'คืนเงินค่าหุ้นกรณีลาออกจากสมาชิก', ref: 'M-058241', voucherNo: 'PV-2569-0214',
    status: 'cleared', clearDate: '2026-05-29' },
  { id: 'CHQ-2569-0038', chequeNo: '02055040', bookId: 'CB-2569-005', accountNo: '020-6-54321-0', bank: 'ธนาคารออมสิน',
    payDate: '2026-05-20', payee: 'บจก. ไอที โซลูชั่น', amount: 128400,
    detail: 'ค่าบำรุงรักษาระบบประจำปี', ref: 'PV-2569-0205', voucherNo: 'PV-2569-0205',
    status: 'void', clearDate: null },
  { id: 'CHQ-2569-0037', chequeNo: '06700140', bookId: 'CB-2569-006', accountNo: '067-1-23456-7', bank: 'ธนาคารกรุงไทย',
    payDate: '2026-05-15', payee: 'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย', amount: 25050000,
    detail: 'ชำระค่าซื้อพันธบัตร EGAT296A', ref: 'INV-2569-0009', voucherNo: 'PV-2569-0198',
    status: 'cleared', clearDate: '2026-05-16' },
];

// ─── ไฟล์โอนธนาคาร (Bank Direct Credit) ───────────────────────────────
// status: draft | generated | uploaded | completed | failed
window.BANK_FILE_SEED = [
  { id: 'BF-2569-0024', transferType: 'KTB iPay Direct', destBankScope: 'ทุกธนาคาร', bankId: 'BA-01',
    transferDate: '2026-06-13', createdBy: 'จันทร์เพ็ญ มาลี', status: 'generated',
    items: [
      { name: 'นายสมชาย ใจดี รักษ์ออม', bank: 'ธ.กรุงไทย', acctNo: '8120045566', amount: 18030, coCode: 'SHARE' },
      { name: 'นางสาวกานต์ ศิริวงศ์', bank: 'ธ.กสิกรไทย', acctNo: '0123998877', amount: 12500, coCode: 'SHARE' },
      { name: 'นายอนุชา สุขสวัสดิ์', bank: 'ธ.ไทยพาณิชย์', acctNo: '4459001122', amount: 9925, coCode: 'LOAN' },
      { name: 'นางวิภา จันทร์เพ็ญ', bank: 'ธ.กรุงไทย', acctNo: '8120033441', amount: 7600, coCode: 'DIVIDEND' },
    ] },
  { id: 'BF-2569-0023', transferType: 'KTB iPay Direct', destBankScope: 'ธนาคารกรุงไทย', bankId: 'BA-01',
    transferDate: '2026-06-05', createdBy: 'จันทร์เพ็ญ มาลี', status: 'completed',
    items: [
      { name: 'นายธีรพงษ์ ขำเพชร', bank: 'ธ.กรุงไทย', acctNo: '8120077889', amount: 21000, coCode: 'LOAN' },
      { name: 'นางอรอนงค์ บุญมาก', bank: 'ธ.กรุงไทย', acctNo: '8120066778', amount: 15400, coCode: 'SHARE' },
      { name: 'นายภาคภูมิ รัตนา', bank: 'ธ.กรุงไทย', acctNo: '8120055667', amount: 8800, coCode: 'WELFARE' },
    ] },
  { id: 'BF-2569-0022', transferType: 'SCB Business Net', destBankScope: 'ทุกธนาคาร', bankId: 'BA-02',
    transferDate: '2026-05-30', createdBy: 'ประภาส ทองสุข', status: 'completed',
    items: [
      { name: 'บจก. รักษาความปลอดภัย ไทยซีเคียว', bank: 'ธ.ไทยพาณิชย์', acctNo: '1112223334', amount: 86400, coCode: 'EXPENSE' },
      { name: 'บจก. ไอที โซลูชั่น', bank: 'ธ.กสิกรไทย', acctNo: '0125556667', amount: 128400, coCode: 'EXPENSE' },
    ] },
  { id: 'BF-2569-0021', transferType: 'KTB iPay Direct', destBankScope: 'ทุกธนาคาร', bankId: 'BA-01',
    transferDate: '2026-05-25', createdBy: 'จันทร์เพ็ญ มาลี', status: 'failed',
    items: [
      { name: 'นายวีรชัย พิทักษ์ธรรม', bank: 'ธ.กรุงเทพ', acctNo: '2340011223', amount: 11200, coCode: 'LOAN' },
    ] },
];

// แถวรอโอน (pending) — แหล่งรายการที่สามารถดึงมาสร้างไฟล์โอนได้
window.BANK_PENDING_SEED = [
  { id: 'PP-001', name: 'นายสมชาย ใจดี รักษ์ออม', memberCode: 'M-058241', bank: 'ธ.กรุงไทย', acctNo: '8120045566', amount: 18030, type: 'คืนค่าหุ้น', coCode: 'SHARE' },
  { id: 'PP-002', name: 'นางสาวกานต์ ศิริวงศ์', memberCode: 'M-058242', bank: 'ธ.กสิกรไทย', acctNo: '0123998877', amount: 12500, type: 'เงินปันผล', coCode: 'DIVIDEND' },
  { id: 'PP-003', name: 'นายอนุชา สุขสวัสดิ์', memberCode: 'M-058243', bank: 'ธ.ไทยพาณิชย์', acctNo: '4459001122', amount: 9925, type: 'เงินกู้ฉุกเฉิน', coCode: 'LOAN' },
  { id: 'PP-004', name: 'นางวิภา จันทร์เพ็ญ', memberCode: 'M-058244', bank: 'ธ.กรุงไทย', acctNo: '8120033441', amount: 7600, type: 'เงินปันผล', coCode: 'DIVIDEND' },
  { id: 'PP-005', name: 'นายธีรพงษ์ ขำเพชร', memberCode: 'M-058245', bank: 'ธ.กรุงไทย', acctNo: '8120077889', amount: 21000, type: 'เงินกู้สามัญ', coCode: 'LOAN' },
  { id: 'PP-006', name: 'นางอรอนงค์ บุญมาก', memberCode: 'M-058250', bank: 'ธ.กรุงไทย', acctNo: '8120066778', amount: 15400, type: 'คืนค่าหุ้น', coCode: 'SHARE' },
  { id: 'PP-007', name: 'นายภาคภูมิ รัตนา', memberCode: 'M-058251', bank: 'ธ.กรุงไทย', acctNo: '8120055667', amount: 8800, type: 'สวัสดิการ', coCode: 'WELFARE' },
  { id: 'PP-008', name: 'นางสาวจุฬาลักษณ์ พัฒนกุล', memberCode: 'M-058252', bank: 'ธ.ไทยพาณิชย์', acctNo: '4459778899', amount: 13250, type: 'เงินปันผล', coCode: 'DIVIDEND' },
  { id: 'PP-009', name: 'นางสาวศิริพร ใจงาม', memberCode: 'M-058248', bank: 'ธ.กสิกรไทย', acctNo: '0123445566', amount: 6700, type: 'คืนค่าหุ้น', coCode: 'SHARE' },
  { id: 'PP-010', name: 'นายสุรชัย วงศ์ประเสริฐ', memberCode: 'M-058249', bank: 'ธ.กรุงเทพ', acctNo: '2340778899', amount: 19800, type: 'เงินกู้สามัญ', coCode: 'LOAN' },
];

window.BANK_FILE_STATUS = {
  draft:     { l: 'ร่าง',        pill: 'neutral' },
  generated: { l: 'สร้างไฟล์แล้ว', pill: 'info' },
  uploaded:  { l: 'อัปโหลดแล้ว',  pill: 'warn' },
  completed: { l: 'โอนสำเร็จ',    pill: 'ok' },
  failed:    { l: 'ไม่สำเร็จ',    pill: 'bad' },
};

// ─── Helpers — load/save ─────────────────────────────────────────────
window.chqLoadBooks = function () {
  try { const s = localStorage.getItem('cheque_books'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.CHQ_BOOK_SEED));
};
window.chqSaveBooks = function (l) { try { localStorage.setItem('cheque_books', JSON.stringify(l)); } catch (e) {} };

window.chqLoadPays = function () {
  try { const s = localStorage.getItem('cheque_pays'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.CHQ_PAY_SEED));
};
window.chqSavePays = function (l) { try { localStorage.setItem('cheque_pays', JSON.stringify(l)); } catch (e) {} };

window.bankLoadFiles = function () {
  try { const s = localStorage.getItem('bank_files'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.BANK_FILE_SEED));
};
window.bankSaveFiles = function (l) { try { localStorage.setItem('bank_files', JSON.stringify(l)); } catch (e) {} };
