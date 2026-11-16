// ═════════════════════════════════════════════════════════════════
//  ข้อมูล — ใบสั่งชำระเงิน (Payment Order) · ระบบงานสินเชื่อ
//  ────────────────────────────────────────────────────────────────
//  หน้าจอรับชำระพิเศษจากสมาชิก: ชำระหนี้เงินกู้ (ต้น/ดอกเบี้ย),
//  ซื้อหุ้นพิเศษ และรายการอื่น ๆ (ค่าธรรมเนียม/ค่าปรับ)
//  ใช้ฐานสมาชิก/สัญญาร่วม window.DN_MEMBERS (เหมือนเมนูติดตามหนี้)
// ═════════════════════════════════════════════════════════════════

// ── ตัวเลือก dropdown ในส่วนหัว ─────────────────────────────────────
window.PO_TXN_CODES = [
  { value: 'PX', label: 'PX - รับชำระหนี้ปกติ' },
  { value: 'PS', label: 'PS - ชำระหนี้พิเศษ' },
  { value: 'PC', label: 'PC - ปิดบัญชีเงินกู้' },
  { value: 'SH', label: 'SH - ซื้อหุ้นพิเศษ' },
];
window.PO_CHANNELS = [
  { value: 'CSH', label: 'CSH - เงินสด',  account: '1101010101 - เงินสด' },
  { value: 'TRF', label: 'TRF - โอนเงิน', account: '1101020105 - เงินฝากธนาคาร-ออมทรัพย์' },
  { value: 'CHQ', label: 'CHQ - เช็ค',    account: '1101020110 - เงินฝากธนาคาร-กระแสฯ' },
  { value: 'RCV', label: 'RCV - เงินรอจ่ายคืน', account: '29101 - เงินรอจ่ายคืน' },
];
window.PO_ACCOUNTS = [
  '1101010101 - เงินสด',
  '1101020105 - เงินฝากธนาคาร-ออมทรัพย์',
  '1101020110 - เงินฝากธนาคาร-กระแสฯ',
  '29101 - เงินรอจ่ายคืน',
];

// ── รหัสประเภทเงินกู้ย่อ (สำหรับคอลัมน์ "ประเภท") ──────────────────
window.PO_LOAN_CODE = {
  'เงินกู้สามัญ':  'B',
  'เงินกู้พิเศษ':  'ID',
  'เงินกู้ฉุกเฉิน': 'EM',
  'กู้หุ้น':        'SH',
};

// ── งวดบัญชีที่เปิดอยู่ (ใช้เป็น "ดอกเบี้ยตั้งแต่") ───────────────────
window.PO_PERIOD_START = '2026-07-01';

// hash เล็ก ๆ เพื่อคำนวณดอกเบี้ยใหม่แบบคงที่ (เดโม) ─────────────────
const poHash = (s) => {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) % 100000;
  return h;
};

// ── แปลง member.debts → แถวรายการหนี้ของใบสั่งชำระเงิน ──────────────
//  ทุกแถวเริ่มต้น "ยังไม่เลือก" (checked=false, ยอดชำระ=0)
//  เมื่อผู้ใช้เลือก จะเติมยอดชำระเต็ม (ชำระพิเศษ = ปิดต้น+ดอกเบี้ยใหม่)
window.poDebtRows = (member) => {
  if (!member || !member.debts) return [];
  return member.debts
    .filter(d => (Number(d.principalRemaining) || 0) > 0)
    .map((d) => {
      const principal = Number(d.principalRemaining) || 0;
      // ดอกเบี้ยใหม่ ณ วันที่รายการ — ประมาณจากต้นเงินคงเหลือ (เดโมคงที่)
      const days = 1 + (poHash(d.contractNo) % 6);
      const rate = 0.0575;                       // 5.75%/ปี
      const intNew = Math.round(principal * rate / 365 * days * 100) / 100;
      return {
        contractNo: d.contractNo,
        type: d.type,
        code: window.PO_LOAN_CODE[d.type] || 'B',
        principal,
        intFrom: window.PO_PERIOD_START,
        intDue: Number(d.interestDue) || 0,      // ดอกเบี้ยค้าง
        intNew,                                   // ดอกเบี้ยใหม่
      };
    });
};

// ── รายการหุ้นของสมาชิก (ทุนเรือนหุ้น + ซื้อเพิ่ม) ───────────────────
window.poShareRows = (member) => {
  if (!member) return [];
  const capital = Number(member.shares) || 0;
  if (capital <= 0) return [];
  return [{
    code: 'SHR',
    detail: 'SHR - ซื้อหุ้นพิเศษ',
    term: Math.max(1, Math.round(capital / 1000)),   // จำนวนหุ้น/งวด
    capital,
  }];
};

// ── รายการอื่น ๆ (ค่าธรรมเนียม/ค่าปรับ) ─────────────────────────────
window.poOtherRows = () => ([
  { code: 'OTH001', detail: 'ค่าธรรมเนียมการโอนเงิน', amount: 0 },
]);

// ── running number ใบเสร็จ ──────────────────────────────────────────
let _poSeq = 4820;
window.poNextReceiptNo = () => {
  _poSeq += 1;
  const be = new Date().getFullYear() + 543;
  return `RC${be}-${String(_poSeq).padStart(5, '0')}`;
};

// ── สมาชิกตัวอย่างสำหรับปุ่มสาธิต ───────────────────────────────────
window.PO_DEMO_CODES = ['M-067012', 'M-066238', 'M-065471'];
