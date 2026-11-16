// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ทดรองจ่ายปันผล-เฉลี่ยคืน
//  (Advance payout of dividend / patronage-rebate, per member)
//  ----------------------------------------------------------------
//  ทำรายการจ่ายเงินปันผลและเฉลี่ยคืนรายบุคคล โดยตรวจสอบภาระหนี้ /
//  ดอกเบี้ยค้าง / รายการหัก แล้วคำนวณยอดรับสุทธิก่อนบันทึกจ่ายจริง
//  · ก่อนบันทึก เลขเอกสาร = AUTO · หลังบันทึกระบบสร้างเลขจริง
//  · รับสุทธิ = ปันผล + เฉลี่ยคืน − (หักสอร. + หักสส.ชสอ + รวมชำระหนี้)
// ═════════════════════════════════════════════════════════════════

// ปีปันผล (พ.ศ.) ที่เปิดให้เลือก
window.ADV_YEARS = ['2564', '2565', '2566', '2567', '2568'];

// ─── ช่องทางการจ่ายเงิน ───────────────────────────────────────────────
//  need: ข้อมูลประกอบที่ต้องระบุ (ใช้ตรวจสอบก่อนบันทึก)
window.ADV_PAY_METHODS = [
  { v: 'transfer', label: 'โอนเข้าบัญชีธนาคาร', need: 'bank' },
  { v: 'cash',     label: 'จ่ายเงินสด',         need: 'none' },
  { v: 'cheque',   label: 'จ่ายด้วยเช็ค',        need: 'none' },
  { v: 'payfile',  label: 'นำเข้าระบบจ่ายเงิน',  need: 'bank' },
  { v: 'offset',   label: 'หักกลบหนี้ทั้งหมด',    need: 'none' },
];
window.advPayMethod = (v) => window.ADV_PAY_METHODS.find(m => m.v === v) || null;

// ─── แฟ้มธนาคารกลาง (สำหรับ dropdown) ────────────────────────────────
window.ADV_BANKS = [
  { v: '006', l: '006 : ธนาคารกรุงไทย' },
  { v: '014', l: '014 : ธนาคารไทยพาณิชย์' },
  { v: '004', l: '004 : ธนาคารกสิกรไทย' },
  { v: '002', l: '002 : ธนาคารกรุงเทพ' },
  { v: '025', l: '025 : ธนาคารกรุงศรีอยุธยา' },
];
window.advBankLabel = (v) => (window.ADV_BANKS.find(b => b.v === v) || {}).l || v || '';

// เงื่อนไขการกันเงิน/หักจากปันผล (สัดส่วนสูงสุดที่นำไปหักได้)
window.ADV_DEDUCT_CAP = 0.80;

// ─── สมาชิกสำหรับค้นหา (ใช้กับ MemberSearchModal) ─────────────────────
window.ADV_MEMBERS = [
  { code: '000123', title: 'นาย',    firstName: 'สมชาย',  lastName: 'ใจดี',
    name: 'นายสมชาย ใจดี', citizenId: '3-1018-00482-31-7',
    dept: 'ฝ่ายบริการลูกค้า · บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)' },
  { code: '000247', title: 'นางสาว', firstName: 'กานต์',  lastName: 'ศิริวงศ์',
    name: 'นางสาวกานต์ ศิริวงศ์', citizenId: '1-1099-00214-55-2',
    dept: 'ฝ่ายปฏิบัติการโครงข่าย · บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)' },
  { code: '000388', title: 'นาง',    firstName: 'วิภา',    lastName: 'จันทร์เพ็ญ',
    name: 'นางวิภา จันทร์เพ็ญ', citizenId: '3-3101-00219-44-2',
    dept: 'สำนักการเงินและบัญชี · บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)' },
  { code: '000451', title: 'นาย',    firstName: 'ธีรพงษ์', lastName: 'ขำเพชร',
    name: 'นายธีรพงษ์ ขำเพชร', citizenId: '1-2099-00321-66-8',
    dept: 'ฝ่ายเทคโนโลยีสารสนเทศ · บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)' },
];

// ─── ข้อมูลปันผล/เฉลี่ยคืน + รายการหนี้ รายสมาชิก · รายปี ────────────
//  paid:true = สมาชิกได้รับเงินปันผล-เฉลี่ยคืนของปีนี้แล้ว (ห้ามจ่ายซ้ำ)
//  debts[].intFrom = วันที่เริ่มคิดดอกเบี้ยค้าง (พ.ศ. dd/mm/yyyy)
//  debts[].intAccrued = ดอกเบี้ยค้างเดิม · principalPay = ยอดหักชำระเงินต้น
window.ADV_DIVIDEND = {
  '000123': {
    '2564': {
      paid: false,
      divRate: 5.00, avgRate: 10.00,
      shareBase: 200000.00, interestPaid: 30000.00,
      dividend: 10000.00, avgReturn: 3000.00,
      deductCoop: 500.00,   // หักสอร.
      deductAssoc: 300.00,  // หักสส.ชสอ
      bank: '006', branch: '0308 : สาขาแจ้งวัฒนะ', bankAcct: '308-0-54335-1',
      debts: [
        { contractNo: 'CL64010001', principal: 150000.00, rate: 6.00,
          intFrom: '30/04/2565', intAccrued: 1200.00, principalPay: 0.00 },
        { contractNo: 'CL64010002', principal: 90000.00, rate: 6.50,
          intFrom: '30/04/2565', intAccrued: 800.00, principalPay: 0.00 },
      ],
    },
  },
  '000247': {
    '2564': {
      paid: false,
      divRate: 5.00, avgRate: 10.00,
      shareBase: 96000.00, interestPaid: 0.00,
      dividend: 4800.00, avgReturn: 0.00,
      deductCoop: 0.00, deductAssoc: 120.00,
      bank: '014', branch: '0421 : สาขางามวงศ์วาน', bankAcct: '421-2-08817-6',
      debts: [],   // ไม่มีหนี้คงค้าง — จ่ายเต็มจำนวน
    },
  },
  '000388': {
    '2564': {
      paid: false,
      divRate: 5.00, avgRate: 10.00,
      shareBase: 142000.00, interestPaid: 52000.00,
      dividend: 7100.00, avgReturn: 5200.00,
      deductCoop: 350.00, deductAssoc: 250.00,
      bank: '004', branch: '0188 : สาขาเซ็นทรัลแจ้งวัฒนะ', bankAcct: '188-1-44290-3',
      // หนี้มากกว่ายอดที่มีสิทธิ์รับ → ยอดรับสุทธิจะถูกปรับเป็น 0.00
      debts: [
        { contractNo: 'CL63020114', principal: 420000.00, rate: 6.25,
          intFrom: '31/03/2565', intAccrued: 6400.00, principalPay: 8000.00 },
        { contractNo: 'EM65000942', principal: 50000.00, rate: 6.75,
          intFrom: '30/04/2565', intAccrued: 950.00, principalPay: 0.00 },
      ],
    },
  },
  '000451': {
    '2564': {
      paid: true,    // ทำรายการทดรองจ่ายไปแล้ว
      docNo: 'ADV-DIV-2564-000087',
      divRate: 5.00, avgRate: 10.00,
      shareBase: 180000.00, interestPaid: 18000.00,
      dividend: 9000.00, avgReturn: 1800.00,
      deductCoop: 400.00, deductAssoc: 200.00,
      bank: '002', branch: '0142 : สาขาหลักสี่', bankAcct: '142-0-77105-8',
      debts: [
        { contractNo: 'CL64030551', principal: 110000.00, rate: 6.00,
          intFrom: '30/04/2565', intAccrued: 600.00, principalPay: 0.00 },
      ],
    },
  },
};

// ─── ค้นหาสมาชิก (รับ criteria object ตาม DS) ────────────────────────
window.advSearchMembers = (criteria) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const c = criteria || {};
  const code = norm(c.code), fn = norm(c.firstName), ln = norm(c.lastName),
        cid = norm(c.citizenId), un = norm(c.unit);
  return (window.ADV_MEMBERS || []).filter(m =>
    (!code || norm(m.code).includes(code)) &&
    (!fn   || norm(m.firstName || m.name).includes(fn)) &&
    (!ln   || norm(m.lastName || m.name).includes(ln)) &&
    (!cid  || norm(m.citizenId).includes(cid)) &&
    (!un   || norm(m.dept).includes(un)));
};

// คืน record ปันผล/เฉลี่ยคืน + หนี้ ของสมาชิกตามปี (deep-clone)
window.advRecord = (code, year) => {
  const byYear = window.ADV_DIVIDEND[code];
  if (!byYear) return null;
  const r = byYear[year];
  if (!r) return null;
  return { ...r, debts: (r.debts || []).map(d => ({ ...d })) };
};

// ปีปันผลที่สมาชิกรายนี้มีข้อมูล
window.advYearsOf = (code) => Object.keys(window.ADV_DIVIDEND[code] || {});

// ─── ตัวช่วยวันที่ พ.ศ. (dd/mm/yyyy) ─────────────────────────────────
window.advParseThai = (s) => {
  const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = +m[1], mo = +m[2], by = +m[3];          // by = พ.ศ.
  const dt = new Date(by - 543, mo - 1, d);
  return isNaN(dt) ? null : dt;
};
window.advTodayThai = () => {
  const t = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return p(t.getDate()) + '/' + p(t.getMonth() + 1) + '/' + (t.getFullYear() + 543);
};
// จำนวนวันระหว่างวันที่ พ.ศ. สองค่า (b − a) ไม่ติดลบ
window.advDaysBetween = (aThai, bThai) => {
  const a = window.advParseThai(aThai), b = window.advParseThai(bThai);
  if (!a || !b) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

// ─── คำนวณดอกเบี้ยใหม่ของสัญญา ณ วันที่คิดดอกเบี้ย ───────────────────
//  ดอกเบี้ยใหม่ = เงินต้นคงเหลือ × อัตรา/ปี × จำนวนวัน ÷ 365
window.advLineCalc = (debt, calcDateThai) => {
  const days = window.advDaysBetween(debt.intFrom, calcDateThai);
  const intNew = debt.principal * (debt.rate / 100) * days / 365;
  const payInt = (debt.intAccrued || 0) + intNew;             // ลำดับ: ค้าง → ใหม่
  const principalPay = debt.principalPay || 0;
  const totalPay = payInt + principalPay;                     // รวมชำระ
  const remainPrincipal = debt.principal - principalPay;
  return { days, intNew, payInt, principalPay, totalPay, remainPrincipal };
};

// ─── สรุปยอดทั้งใบ (ปันผล/เฉลี่ยคืน − หักรวม → รับสุทธิ) ──────────────
window.advSummary = (rec, calcDateThai) => {
  if (!rec) return null;
  const lines = (rec.debts || []).map(d => ({ ...d, ...window.advLineCalc(d, calcDateThai) }));
  const debtPay = lines.reduce((a, l) => a + l.totalPay, 0);
  const grossEntitled = rec.dividend + rec.avgReturn;           // ก่อนหัก
  const before80 = grossEntitled;                               // ฐานก่อนหัก 80%
  const cond80 = before80 * window.ADV_DEDUCT_CAP;              // ยอดตามเงื่อนไข 80%
  const totalDeduct = (rec.deductCoop || 0) + (rec.deductAssoc || 0) + debtPay;
  const netRaw = grossEntitled - totalDeduct;
  const net = Math.max(0, netRaw);                             // ป้องกันติดลบ
  return {
    lines, debtPay, grossEntitled, before80, cond80, totalDeduct,
    netRaw, net, overDeduct: netRaw < -0.005,
  };
};
