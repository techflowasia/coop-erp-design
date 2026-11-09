// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก — ธุรกรรมเคาน์เตอร์รวมหน้าจอเดียว (ฝาก/ถอน/โอน/ปิดบัญชี)
//  รหัสรายการตามประเภท · วันที่เคลื่อนไหวล่าสุด · บัญชีไม่เคลื่อนไหว 2 ปี
//  การปลดล็อกบัญชีโดยหัวหน้า/ผู้มีสิทธิ์ (เก็บใน localStorage)
// ════════════════════════════════════════════════════════════════════

window.DPC_TXN_TYPES = [
  { id: 'deposit',  label: 'ฝากเงิน (+)',        sign: '+', icon: 'download' },
  { id: 'withdraw', label: 'ถอนเงิน (−)',        sign: '−', icon: 'upload' },
  { id: 'transfer', label: 'โอนระหว่างบัญชี (→)', sign: '→', icon: 'refresh' },
  { id: 'close',    label: 'ปิดบัญชี (/)',        sign: '/', icon: 'lock' },
];

// รหัสรายการย่อยตามประเภท (ตามผังรหัสเดิมของสหกรณ์)
window.DPC_TXN_CODES = {
  deposit: [
    { code: 'DCA', label: 'ฝากเพิ่มด้วยเงินสด',        money: 'CSH', pair: '111101' },
    { code: 'DTE', label: 'ฝากเพิ่มด้วยการโอนธนาคาร',  money: 'TRF', pair: '111201', needRef: true, needBank: true },
    { code: 'DCP', label: 'ฝากเพิ่มด้วยเช็คส่วนบุคคล',  money: 'CHQ', pair: '111301', needRef: true, needBank: true, clearing: true },
    { code: 'DTM', label: 'ฝากโอนรายเดือน',           money: 'TRF', pair: '111201' },
    { code: 'DTS', label: 'โอนเงินเดือน/เบี้ยประชุม',   money: 'TRF', pair: '111202' },
    { code: 'DMO', label: 'PAY AT POST',              money: 'TRF', pair: '111203', needRef: true },
    { code: 'DSV', label: 'ฝากผ่าน Counter Service',   money: 'TRF', pair: '111204', needRef: true },
    { code: 'DTR', label: 'ฝากเพิ่มด้วยการโอน',        money: 'TRF', pair: '111205', needRef: true },
    { code: 'DTO', label: 'ฝากย้อนวัน',                money: 'CSH', pair: '111101', backdate: true },
    { code: 'DOR', label: 'ฝากตามสั่ง',                money: 'CSH', pair: '111101' },
    { code: 'DRT', label: 'เงินจ่ายคืน',               money: 'CSH', pair: '111106' },
    { code: 'DRW', label: 'ค่าตอบแทนตัวแทนสหกรณ์',    money: 'CSH', pair: '111107' },
  ],
  withdraw: [
    { code: 'WCA', label: 'ถอนด้วยเงินสด',             money: 'CSH', pair: '111101' },
    { code: 'WTE', label: 'ถอนโอนเข้าบัญชีธนาคาร',      money: 'TRF', pair: '111201', needBank: true },
    { code: 'WCQ', label: 'ถอนจ่ายด้วยเช็ค',           money: 'CHQ', pair: '111301', needRef: true },
    { code: 'WLN', label: 'ถอนชำระหนี้เงินกู้',         money: 'TRF', pair: '121101' },
    { code: 'WSH', label: 'ถอนซื้อหุ้น',                money: 'TRF', pair: '131101' },
    { code: 'WFE', label: 'ถอนหักค่าธรรมเนียม',        money: 'CSH', pair: '111108' },
    { code: 'WTO', label: 'ถอนย้อนวัน',                money: 'CSH', pair: '111101', backdate: true },
  ],
  transfer: [
    { code: 'TRI', label: 'โอนระหว่างบัญชีเงินฝาก',     money: 'TRF', pair: '111150' },
    { code: 'TRX', label: 'โอนข้ามสมาชิก',             money: 'TRF', pair: '111151' },
    { code: 'TRL', label: 'โอนชำระหนี้เงินกู้',         money: 'TRF', pair: '121101' },
    { code: 'TRS', label: 'โอนซื้อหุ้น',                money: 'TRF', pair: '131101' },
  ],
  close: [
    { code: 'CLA', label: 'ปิดบัญชีรับเงินสด',          money: 'CSH', pair: '111101' },
    { code: 'CLT', label: 'ปิดบัญชีโอนเข้าธนาคาร',      money: 'TRF', pair: '111201', needBank: true },
    { code: 'CLQ', label: 'ปิดบัญชีจ่ายด้วยเช็ค',       money: 'CHQ', pair: '111301', needRef: true },
    { code: 'CLD', label: 'ปิดบัญชีกรณีสมาชิกเสียชีวิต', money: 'CSH', pair: '111101' },
    { code: 'CLR', label: 'ปิดบัญชีเพื่อเปิดบัญชีใหม่',  money: 'TRF', pair: '111150' },
  ],
};

window.DPC_CHANNELS = [
  { v: 'book',   l: 'มีสมุด' },
  { v: 'nobook', l: 'ไม่มีสมุด' },
  { v: 'atm',    l: 'ผ่าน ATM' },
  { v: 'online', l: 'ผ่านระบบออนไลน์' },
];

// ─── วันที่เคลื่อนไหวล่าสุด + ประวัติเคลื่อนไหว (seed) ─────────────────
window.DPC_LASTMOVE_SEED = {
  '001-2-70020-5': '2026-10-15',
  '001-2-70011-3': '2026-09-30',
  '001-2-70012-1': '2026-09-30',
  '001-1-70012-4': '2026-09-30',
  '001-2-70013-8': '2026-09-30',
  '005-2-90001-6': '2026-09-18',
  '001-2-58241-0': '2026-07-01',
  '002-5-58241-7': '2026-06-25',
  '003-1-58241-4': '2025-01-15',
  '002-5-60112-3': '2026-05-12',
  '001-2-57003-9': '2023-04-12',
  '004-9-61580-1': '2022-03-18',
};

window.DPC_MOVES_SEED = {
  '001-2-70011-3': [
    { date: '2026-09-30', code: 'INT', label: 'ดอกเบี้ยเงินฝาก (ทบต้น)', dc: '+', amount: 266.90, balance: 85400.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-08-12', code: 'DCA', label: 'ฝากเพิ่มด้วยเงินสด', dc: '+', amount: 5000, balance: 85133.10, by: 'จันทร์เพ็ญ มาลี' },
    { date: '2026-03-31', code: 'INT', label: 'ดอกเบี้ยเงินฝาก (ทบต้น)', dc: '+', amount: 245.50, balance: 80133.10, by: 'ระบบคำนวณดอกเบี้ย' },
  ],
  '001-2-70012-1': [
    { date: '2026-09-30', code: 'INT', label: 'ดอกเบี้ยเงินฝาก', dc: '+', amount: 4120.00, balance: 416120.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-09-30', code: 'WTA', label: 'โอนดอกเบี้ยเข้าบัญชี 001-1-70012-4', dc: '−', amount: 4120.00, balance: 412000.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-06-18', code: 'DTE', label: 'ฝากเพิ่มด้วยการโอนธนาคาร', dc: '+', amount: 50000, balance: 412000.00, by: 'ประไพ ศรีทอง' },
  ],
  '001-1-70012-4': [
    { date: '2026-09-30', code: 'DTA', label: 'รับโอนดอกเบี้ยจากบัญชี 001-2-70012-1', dc: '+', amount: 4120.00, balance: 24350.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-07-04', code: 'WCA', label: 'ถอนด้วยเงินสด', dc: '−', amount: 3000, balance: 20230.00, by: 'จันทร์เพ็ญ มาลี' },
  ],
  '001-2-70013-8': [
    { date: '2026-09-30', code: 'INT', label: 'ดอกเบี้ยเงินฝาก', dc: '+', amount: 10805.00, balance: 1091305.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-09-30', code: 'WTB', label: 'โอนดอกเบี้ยเข้า ธ.กรุงไทย 987-0-12345-6', dc: '−', amount: 10805.00, balance: 1080500.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-05-20', code: 'DCA', label: 'ฝากเพิ่มด้วยเงินสด', dc: '+', amount: 80000, balance: 1080500.00, by: 'ประไพ ศรีทอง' },
  ],
  '005-2-90001-6': [
    { date: '2026-09-18', code: 'DCS', label: 'ฝากเงินสด', dc: '+', amount: 250000, balance: 1250000.00, by: 'จันทร์เพ็ญ มาลี' },
    { date: '2026-08-05', code: 'WCS', label: 'ถอนเงินสด', dc: '−', amount: 150000, balance: 1000000.00, by: 'ประไพ ศรีทอง' },
    { date: '2026-06-30', code: 'INT', label: 'ดอกเบี้ยเงินฝาก', dc: '+', amount: 4925, balance: 1150000.00, by: 'ระบบ' },
  ],
  '001-2-58241-0': [
    { date: '2026-07-01', code: 'DTM', label: 'ฝากโอนรายเดือน', dc: '+', amount: 2000, balance: 342850.50, by: 'ระบบหักเงินเดือน' },
    { date: '2026-06-01', code: 'DTM', label: 'ฝากโอนรายเดือน', dc: '+', amount: 2000, balance: 340850.50, by: 'ระบบหักเงินเดือน' },
    { date: '2026-05-14', code: 'WCA', label: 'ถอนด้วยเงินสด', dc: '−', amount: 5000, balance: 338850.50, by: 'จันทร์เพ็ญ มาลี' },
    { date: '2026-04-01', code: 'DTM', label: 'ฝากโอนรายเดือน', dc: '+', amount: 2000, balance: 343850.50, by: 'ระบบหักเงินเดือน' },
  ],
  '002-5-58241-7': [
    { date: '2026-06-25', code: 'DCA', label: 'ฝากเพิ่มด้วยเงินสด', dc: '+', amount: 50000, balance: 680000.00, by: 'ประไพ ศรีทอง' },
    { date: '2026-03-31', code: 'INT', label: 'ดอกเบี้ยเงินฝาก', dc: '+', amount: 4560.00, balance: 630000.00, by: 'ระบบคำนวณดอกเบี้ย' },
    { date: '2026-01-20', code: 'DTE', label: 'ฝากเพิ่มด้วยการโอนธนาคาร', dc: '+', amount: 100000, balance: 625440.00, by: 'ประไพ ศรีทอง' },
  ],
  '003-1-58241-4': [
    { date: '2025-01-15', code: 'DCA', label: 'เปิดบัญชีฝากประจำ', dc: '+', amount: 500000, balance: 500000.00, by: 'จันทร์เพ็ญ มาลี' },
  ],
  '002-5-60112-3': [
    { date: '2026-05-12', code: 'WCA', label: 'ถอนด้วยเงินสด', dc: '−', amount: 20000, balance: 158200.00, by: 'จันทร์เพ็ญ มาลี' },
    { date: '2026-04-01', code: 'DTM', label: 'ฝากโอนรายเดือน', dc: '+', amount: 3000, balance: 178200.00, by: 'ระบบหักเงินเดือน' },
    { date: '2026-03-01', code: 'DTM', label: 'ฝากโอนรายเดือน', dc: '+', amount: 3000, balance: 175200.00, by: 'ระบบหักเงินเดือน' },
  ],
  '001-2-57003-9': [
    { date: '2023-04-12', code: 'DCA', label: 'ฝากเพิ่มด้วยเงินสด', dc: '+', amount: 3000, balance: 89400.25, by: 'ประไพ ศรีทอง' },
    { date: '2022-12-30', code: 'INT', label: 'ดอกเบี้ยเงินฝาก', dc: '+', amount: 540.10, balance: 86400.25, by: 'ระบบคำนวณดอกเบี้ย' },
  ],
  '004-9-61580-1': [
    { date: '2022-03-18', code: 'WCA', label: 'ถอนด้วยเงินสด', dc: '−', amount: 8000, balance: 12050.00, by: 'ประไพ ศรีทอง' },
    { date: '2021-12-30', code: 'INT', label: 'ดอกเบี้ยเงินฝาก', dc: '+', amount: 95.20, balance: 20050.00, by: 'ระบบคำนวณดอกเบี้ย' },
  ],
};

// วันนี้ (อ้างวันทำการของระบบ ถ้ามี)
window.dpcToday = function () {
  return window.DEP_OPS_TODAY || new Date().toISOString().slice(0, 10);
};

// รวมประวัติเคลื่อนไหว: seed + ledger จริงที่ทำในระบบ
window.dpcMoves = function (accNo, ledger) {
  const seed = (window.DPC_MOVES_SEED[accNo] || []).map(m => ({ ...m }));
  const live = (ledger || []).filter(l => l.accNo === accNo).map(l => ({
    date: l.date, code: l.id, label: l.channel,
    dc: (l.type === 'withdraw' || l.type === 'transfer-out') ? '−' : '+',
    amount: l.amount, balance: l.balance, by: l.by,
  }));
  return [...live, ...seed].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
};

window.dpcLastMove = function (accNo, ledger) {
  const rows = window.dpcMoves(accNo, ledger);
  return rows.length ? rows[0].date : (window.DPC_LASTMOVE_SEED[accNo] || null);
};

// จำนวนวัน/ปี ที่ไม่เคลื่อนไหว
window.dpcIdleDays = function (lastDate) {
  if (!lastDate) return 99999;
  return Math.max(0, Math.round((new Date(window.dpcToday()) - new Date(lastDate)) / 86400000));
};
window.DPC_DORMANT_DAYS = 730;   // 2 ปี

// ─── ผู้มีสิทธิ์ปลดล็อกบัญชีไม่เคลื่อนไหว ──────────────────────────────
window.DPC_APPROVERS = [
  { id: 'A01', name: 'สุนทรี ภักดีวงศ์',  role: 'หัวหน้าฝ่ายเงินฝาก' },
  { id: 'A02', name: 'ธนกร วัฒนศิริ',     role: 'ผู้จัดการสหกรณ์' },
  { id: 'A03', name: 'พิมพ์ใจ ธีระวุฒิ',   role: 'รองผู้จัดการฝ่ายการเงิน' },
];

// ปลดล็อกบัญชี (ต่อบัญชี ต่อวันทำการ) — เก็บใน localStorage
window.dpcUnlocksLoad = function () {
  try { const s = localStorage.getItem('dep_counter_unlocks'); if (s) return JSON.parse(s); } catch (e) {}
  return {};
};
window.dpcUnlocksSave = function (obj) { try { localStorage.setItem('dep_counter_unlocks', JSON.stringify(obj)); } catch (e) {} };
