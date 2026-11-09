// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ยกเลิกใบสั่งคืนค่าหุ้น
//  (Cancel Share Refund Order)
//  ข้อมูลสาธิต: รายการใบสั่งจ่ายคืนค่าหุ้นของสมาชิก พร้อมสถานะรายการ
//  ใช้ฐานสมาชิกร่วมกับ SRF_MEMBERS / srfSearchMembers (data-share-refund.js)
//  namespace: SRC_*  /  fmt จาก data.js
// ════════════════════════════════════════════════════════════════════

// ─── สถานะรายการใบสั่งคืนค่าหุ้น ─────────────────────────────────────
//  cancellable = อนุญาตให้ยกเลิกได้ (ยังไม่จ่ายเงินจริง / ยังไม่บันทึกบัญชี)
window.SRC_ORDER_STATUS = {
  'รอจ่าย':       { pill: 'warn',    cancellable: true,  hint: 'มีการออกใบสั่งคืนค่าหุ้นแล้ว แต่ยังไม่จ่ายเงินจริง' },
  'จ่ายแล้ว':     { pill: 'ok',      cancellable: false, hint: 'มีการจ่ายคืนค่าหุ้นแล้ว — ต้องทำรายการกลับบัญชีแทน' },
  'ส่งบัญชีแล้ว':  { pill: 'info',    cancellable: false, hint: 'รายการถูกส่งเข้าระบบบัญชีแล้ว — ต้องทำรายการปรับปรุงแทน' },
  'ยกเลิก':       { pill: 'neutral', cancellable: false, hint: 'รายการถูกยกเลิกแล้ว' },
  'ยกเลิกไม่ได้':  { pill: 'bad',     cancellable: false, hint: 'รายการไม่สามารถยกเลิกได้ตามเงื่อนไขระบบ' },
};
window.srcOrderStatus = (v) => window.SRC_ORDER_STATUS[v] || window.SRC_ORDER_STATUS['รอจ่าย'];

// ─── ตัวเลือกตัวกรองสถานะ (ในเงื่อนไขการค้นหา) ──────────────────────
window.SRC_STATUS_FILTERS = [
  { v: 'all',          l: 'ทั้งหมด' },
  { v: 'รอจ่าย',       l: 'รอจ่าย' },
  { v: 'จ่ายแล้ว',     l: 'จ่ายแล้ว' },
  { v: 'ส่งบัญชีแล้ว',  l: 'ส่งบัญชีแล้ว' },
  { v: 'ยกเลิก',       l: 'ยกเลิก' },
  { v: 'ยกเลิกไม่ได้',  l: 'ยกเลิกไม่ได้' },
];

// ─── รายการใบสั่งคืนค่าหุ้นต่อสมาชิก (keyed by member code) ───────────
//  payNo: เลขที่จ่าย · payDate: วันที่จ่าย (ISO) · amount: จำนวนเงินจ่าย
//  status: สถานะรายการ · note: หมายเหตุ
window.SRC_ORDERS = {
  '012345': [
    { payNo: 'RS-2569-000201', payDate: '2026-05-02', amount: 50000,  status: 'รอจ่าย',       note: 'รอดำเนินการจ่ายเงิน' },
    { payNo: 'RS-2569-000202', payDate: '2026-05-05', amount: 120000, status: 'ส่งบัญชีแล้ว',  note: 'ส่งเข้าระบบบัญชีแล้ว — ต้องปรับปรุงบัญชี' },
    { payNo: 'RS-2569-000203', payDate: '2026-05-10', amount: 45000,  status: 'จ่ายแล้ว',     note: 'โอนเงินเข้าบัญชีเรียบร้อย' },
    { payNo: 'RS-2569-000204', payDate: '2026-05-15', amount: 90000,  status: 'รอจ่าย',       note: 'ตรวจสอบข้อมูลก่อนจ่าย' },
    { payNo: 'RS-2569-000205', payDate: '2026-05-20', amount: 30000,  status: 'ยกเลิก',       note: 'ยกเลิกแล้ว (บันทึกรายการซ้ำ)' },
  ],
  '018842': [
    { payNo: 'RS-2569-000188', payDate: '2026-05-03', amount: 220000, status: 'ส่งบัญชีแล้ว',  note: 'ส่งเข้าระบบบัญชีแล้ว' },
    { payNo: 'RS-2569-000189', payDate: '2026-05-08', amount: 35000,  status: 'รอจ่าย',       note: 'รอดำเนินการจ่ายเงิน' },
    { payNo: 'RS-2569-000190', payDate: '2026-05-18', amount: 60000,  status: 'ยกเลิกไม่ได้',  note: 'อยู่ระหว่างตรวจสอบบัญชี' },
  ],
  '024519': [
    { payNo: 'RS-2569-000245', payDate: '2026-05-06', amount: 158000, status: 'รอจ่าย',       note: 'คืนค่าหุ้นเต็มจำนวน (ไม่มีหนี้คงค้าง)' },
  ],
  '021770': [
    { payNo: 'RS-2569-000217', payDate: '2026-05-12', amount: 80000,  status: 'ยกเลิกไม่ได้',  note: 'หุ้นของสมาชิกถูกอายัด' },
  ],
};

// ─── ค้นหารายการใบสั่งคืนค่าหุ้นตามสมาชิก + ช่วงวันที่ + สถานะ ────────
window.srcSearchOrders = (memberCode, fromIso, toIso, statusFilter = 'all') => {
  const list = window.SRC_ORDERS[memberCode] || [];
  return list.filter(o => {
    if (fromIso && o.payDate < fromIso) return false;
    if (toIso && o.payDate > toIso) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });
};
