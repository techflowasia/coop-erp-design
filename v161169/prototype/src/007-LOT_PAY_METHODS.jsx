// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: กำหนด Lot จ่ายเงินกู้
//  ข้อมูลตัวอย่างของรายการคำขอกู้ที่ "ผ่านการอนุมัติแล้ว" และพร้อมจัด Lot
//  เพื่อเตรียมโอน / จ่ายเงินกู้ออกเป็นรอบ (Lot) ให้สมาชิก
// ════════════════════════════════════════════════════════════════════

// ─── วิธีรับเงินกู้ (Dropdown) ───────────────────────────────────────
window.LOT_PAY_METHODS = [
  { v: 'transfer', l: 'โอนธนาคาร' },
  { v: 'coop',     l: 'โอนเข้าบัญชีเงินฝากสหกรณ์' },
  { v: 'cash',     l: 'เงินสด' },
  { v: 'cheque',   l: 'เช็คธนาคาร' },
];

// ─── ประเภทเงินกู้ (ผลิตภัณฑ์) สำหรับช่วง “ตั้งแต่–ถึง” ──────────────
// เรียงตามรหัสผลิตภัณฑ์ เพื่อให้กำหนดเป็นช่วงได้
window.LOT_LOAN_TYPES = [
  { code: '10', name: 'ฉุกเฉินเงินสด' },
  { code: '15', name: 'ฉุกเฉินโอนเงินฝาก' },
  { code: '20', name: 'สามัญปกติ' },
  { code: '25', name: 'สามัญหุ้น' },
  { code: '30', name: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย' },
  { code: '35', name: 'พิเศษเพื่อประกอบอาชีพ' },
];

// ─── โครงการเงินกู้ (ช่วง “ตั้งแต่–ถึง”) — ดึงจากเมนูโครงการเงินกู้ ──
window.lotProjects = () => {
  const all = (window.lpjLoad ? window.lpjLoad() : (window.LPJ_SEED || [])).filter(p => p.enabled !== false);
  return all.map(p => ({ id: p.id, code: p.code, name: p.name }));
};
// ประเภทเงินกู้เดิม / ผลิตภัณฑ์ → โครงการเงินกู้
window.LOT_TYPE_PROJECT = { '10': 'PJ-EMCASH', '15': 'PJ-EMCASH', '20': 'PJ-NRM', '25': 'PJ-NSHR', '30': 'PJ-SPWELF', '35': 'PJ-SPJOB',
  'LP-10': 'PJ-EMCASH', 'LP-20': 'PJ-NRM', 'LP-30': 'PJ-SPWELF', 'LP-50': 'PJ-NRM' };
// ลำดับ Lot สำหรับกรองช่วง Lot
window.LOT_RANGE_OPTIONS = [{ v: 'pending', l: 'รอจ่าย' }, { v: 'L1', l: 'Lot 1' }, { v: 'L2', l: 'Lot 2' }, { v: 'L3', l: 'Lot 3' }, { v: 'L4', l: 'Lot 4' }, { v: 'L5', l: 'Lot 5' }];

// ─── ตัวเลือกสำหรับ “กำหนด Lot จ่าย” (หมายเลข Lot หรือสถานะ) ─────────
window.LOT_SET_OPTIONS = [
  { v: 'pending', l: 'รอจ่าย' },
  { v: 'L1', l: 'Lot 1' },
  { v: 'L2', l: 'Lot 2' },
  { v: 'L3', l: 'Lot 3' },
  { v: 'L4', l: 'Lot 4' },
  { v: 'L5', l: 'Lot 5' },
];

// label ของค่า Lot ที่จะแสดงในตาราง
window.lotLabel = (v) => {
  // ไม่มี Lot / ยกเลิก Lot → นับเป็น "รอจ่าย"
  if (v == null || v === '' || v === 'unassigned' || v === 'clear' || v === 'pending') return 'รอจ่าย';
  const m = (window.LOT_SET_OPTIONS || []).find(o => o.v === v);
  return m ? m.l : v;
};

// ─── สาขาธนาคารปลายทาง (สำหรับรายงาน CBT แยกตามสาขา) ──────────────
const _lotBanks = [
  { bank: 'ธ.กรุงไทย',       branch: 'สาขาเทศบาล' },
  { bank: 'ธ.กรุงไทย',       branch: 'สาขาถนนมหาราช' },
  { bank: 'ธ.กรุงไทย',       branch: 'สาขาตลาดกลาง' },
  { bank: 'ธ.ออมสิน',        branch: 'สาขาสี่แยกหอนาฬิกา' },
  { bank: 'ธ.กรุงเทพ',       branch: 'สาขาเซ็นทรัล' },
];

// ─── รายการคำขอกู้ที่อนุมัติแล้ว — รอจัด Lot จ่าย ───────────────────
// payMethod: ตรงกับ LOT_PAY_METHODS · typeCode: ตรงกับ LOT_LOAN_TYPES
window.LOT_REQUESTS = [
  { reqNo: 'LN-2569-00471', name: 'นายสมชาย ใจดี รักษ์ออม',     dept: 'กองคลัง สำนักงานปลัด', amount: 480000,  enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '20', payMethod: 'transfer', bankIdx: 0, account: '019-1-44821-0', lot: 'pending' },
  { reqNo: 'LN-2569-00472', name: 'นางสาวกานต์ ศิริวงศ์',         dept: 'กองการศึกษา',            amount: 150000,  enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '20', payMethod: 'transfer', bankIdx: 1, account: '019-1-55120-7', lot: 'pending' },
  { reqNo: 'LN-2569-00473', name: 'นายอนุชา สุขสวัสดิ์',           dept: 'กองช่าง',                  amount: 92000,   enteredBy: 'ประสงค์ คงทน',     typeCode: '10', payMethod: 'transfer', bankIdx: 0, account: '019-1-33245-2', lot: 'pending' },
  { reqNo: 'LN-2569-00474', name: 'นางวิภา จันทร์เพ็ญ',            dept: 'กองคลัง สำนักงานปลัด', amount: 250000,  enteredBy: 'ประสงค์ คงทน',     typeCode: '25', payMethod: 'transfer', bankIdx: 2, account: '019-1-90011-8', lot: 'pending' },
  { reqNo: 'LN-2569-00475', name: 'นายธีรพงษ์ ขำเพชร',             dept: 'สำนักปลัด',               amount: 1200000, enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '30', payMethod: 'transfer', bankIdx: 0, account: '019-1-77820-4', lot: 'pending' },
  { reqNo: 'LN-2569-00476', name: 'นางสาวศิริพร ใจงาม',            dept: 'กองการศึกษา',            amount: 320000,  enteredBy: 'ประสงค์ คงทน',     typeCode: '20', payMethod: 'transfer', bankIdx: 1, account: '019-1-22014-6', lot: 'pending' },
  { reqNo: 'LN-2569-00477', name: 'นายสุรชัย วงศ์ประเสริฐ',       dept: 'กองช่าง',                  amount: 460000,  enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '25', payMethod: 'transfer', bankIdx: 3, account: '020-2-11842-9', lot: 'pending' },
  { reqNo: 'LN-2569-00478', name: 'นางอรอนงค์ บุญมาก',            dept: 'สำนักปลัด',               amount: 215000,  enteredBy: 'ประสงค์ คงทน',     typeCode: '20', payMethod: 'transfer', bankIdx: 0, account: '019-1-67710-3', lot: 'pending' },
  { reqNo: 'LN-2569-00479', name: 'นายภาคภูมิ รัตนา',                dept: 'กองสาธารณสุข',          amount: 178000,  enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '15', payMethod: 'transfer', bankIdx: 2, account: '019-1-48820-1', lot: 'pending' },
  { reqNo: 'LN-2569-00480', name: 'นางสาวจุฬาลักษณ์ พัฒนกุล',     dept: 'กองคลัง สำนักงานปลัด', amount: 540000,  enteredBy: 'ประสงค์ คงทน',     typeCode: '30', payMethod: 'transfer', bankIdx: 4, account: '030-0-91120-5', lot: 'pending' },
  { reqNo: 'LN-2569-00481', name: 'นายวีรชัย พิทักษ์ธรรม',        dept: 'กองการคลัง',             amount: 88000,   enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '10', payMethod: 'transfer', bankIdx: 1, account: '019-1-30021-7', lot: 'pending' },
  { reqNo: 'LN-2569-00482', name: 'นางสาวพรพิมล ทองคำ',         dept: 'กองสาธารณสุข',          amount: 35000,   enteredBy: 'ประสงค์ คงทน',     typeCode: '10', payMethod: 'transfer', bankIdx: 0, account: '019-1-28840-2', lot: 'pending' },
  { reqNo: 'LN-2569-00483', name: 'นายเกรียงไกร อภิรักษ์',         dept: 'กองช่าง',                  amount: 760000,  enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '35', payMethod: 'transfer', bankIdx: 2, account: '019-1-19920-8', lot: 'pending' },
  { reqNo: 'LN-2569-00484', name: 'นางมาลี ส่งศรี',                  dept: 'กองการศึกษา',            amount: 410000,  enteredBy: 'ประสงค์ คงทน',     typeCode: '25', payMethod: 'transfer', bankIdx: 3, account: '020-2-77410-6', lot: 'pending' },
  { reqNo: 'LN-2569-00485', name: 'นายชัยวัฒน์ เรืองศรี',           dept: 'สำนักปลัด',               amount: 125000,  enteredBy: 'จันทร์เพ็ญ มาลี',  typeCode: '20', payMethod: 'transfer', bankIdx: 0, account: '019-1-66120-4', lot: 'pending' },
  { reqNo: 'LN-2569-00486', name: 'นางสุดารัตน์ แก้วประเสริฐ',     dept: 'กองคลัง สำนักงานปลัด', amount: 300000,  enteredBy: 'ประสงค์ คงทน',     typeCode: '30', payMethod: 'transfer', bankIdx: 1, account: '019-1-50012-9', lot: 'pending' },
];

// แนบข้อมูลธนาคาร/สาขาเข้ากับแต่ละรายการ (อ้างจาก bankIdx)
window.LOT_REQUESTS.forEach(r => {
  const b = _lotBanks[r.bankIdx] || _lotBanks[0];
  r.bank = b.bank;
  r.branch = b.branch;
});
