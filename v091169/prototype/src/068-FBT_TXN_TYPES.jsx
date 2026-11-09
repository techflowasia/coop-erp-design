// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — รับ / จ่าย ตามประเภท (Receipt / Payment by type)
//  ฟอร์มบันทึกรายการรับหรือจ่ายเงินทั่วไป แยกเป็นรายบรรทัด (บัญชีรับรู้)
//  พร้อมหัก ภาษี ณ ที่จ่าย + VAT — คำนวณยอดสุทธิอัตโนมัติ
//  (แนวเดียวกับหน้าจอ "รับ/จ่าย ตามประเภท" ของระบบเดิม)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทรายการ (รับ / จ่าย) ─────────────────────────────────────
window.FBT_TXN_TYPES = [
  { v: 'pay',     l: 'รายการจ่าย', verb: 'จ่าย', prefix: 'จ', tone: 'pay',  accent: 'var(--warn, #e08e0b)' },
  { v: 'receive', l: 'รายการรับ',  verb: 'รับ',  prefix: 'ร', tone: 'recv', accent: 'var(--brand-700, #237450)' },
];
window.fbtTxnType = (v) => window.FBT_TXN_TYPES.find(t => t.v === v) || window.FBT_TXN_TYPES[0];

// ─── ประเภทคู่ค้า (ผู้รับ/ผู้จ่ายเงิน) ─────────────────────────────
window.FBT_PARTY_TYPES = [
  { v: 'member',   l: 'สมาชิก' },
  { v: 'vendor',   l: 'ผู้จัดจำหน่าย' },
  { v: 'employee', l: 'พนักงาน' },
  { v: 'external', l: 'บุคคลภายนอก' },
];

// ─── ทำรายการโดย (ช่องทางเงิน) ─────────────────────────────────────
window.FBT_METHODS = [
  { v: 'cash',     l: 'เงินสด' },
  { v: 'transfer', l: 'โอนเงิน' },
  { v: 'cheque',   l: 'เช็ค' },
];
window.fbtMethodLabel = (v) => (window.FBT_METHODS.find(m => m.v === v) || {}).l || '—';

// ─── สถานะใบรายการ ("ใบรายการ") ────────────────────────────────────
window.FBT_DOC_STATES = [
  { v: 'normal', l: 'ปกติ' },
  { v: 'hold',   l: 'พักไว้' },
  { v: 'cancel', l: 'ยกเลิก' },
];

// ─── สถานะรายการ (record status) ──────────────────────────────────
window.FBT_RECORD_STATUS = '1 - ปกติ';

// ─── ส่วนรับเงิน / สาขาทำรายการ ────────────────────────────────────
window.FBT_RECEIVE_UNITS = [
  { v: '00100', l: '00100 · ช่องรับ–จ่ายเงิน 1 สำนักงานใหญ่' },
  { v: '00200', l: '00200 · ช่องรับ–จ่ายเงิน 2 สำนักงานใหญ่' },
  { v: '00300', l: '00300 · หน่วยบริการเคลื่อนที่' },
];
window.FBT_BRANCHES = ['สำนักงานใหญ่', 'สาขาหลักสี่', 'สาขาแจ้งวัฒนะ', 'หน่วยบริการเคลื่อนที่'];

// ─── ผู้ทำรายการปัจจุบัน (จาก User Login) ──────────────────────────
window.FBT_CURRENT_USER = { name: 'Chaiwat', branch: 'สำนักงานใหญ่' };

// ─── บัญชีที่ลงรายการได้ (posting) — ใช้สร้างตัวเลือก "รหัสบัญชี" / "บัญชีรับรู้"
window.fbtPostingAccounts = () => {
  const all = window.coaFlatAccounts ? window.coaFlatAccounts() : [];
  return all.filter(a => a.kind === 'posting' && a.enabled !== false)
            .map(a => ({ code: String(a.code), name: a.name }));
};
// บัญชีเงินสด/เงินฝากตั้งต้น (ช่อง "รหัสบัญชี")
window.fbtDefaultCashAccount = () => {
  const list = window.fbtPostingAccounts();
  const cash = list.find(a => /เงินสดในมือ/.test(a.name)) || list.find(a => /เงินสด/.test(a.name));
  return cash ? cash.code : (list[0] ? list[0].code : '');
};
window.fbtAccountName = (code) => {
  if (!code) return '';
  return (window.coaAccountName && window.coaAccountName(String(code))) || '';
};

// ─── เลขที่ใบรายการอัตโนมัติ:  จ.YYMM-NNNN / ร.YYMM-NNNN ────────────
window.fbtNextNo = (list, type, dateIso) => {
  const t = window.fbtTxnType(type);
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const stem = `${t.prefix}.${yy}${mm}-`;
  let mx = 0;
  (list || []).forEach(x => {
    if (String(x.id).startsWith(stem)) {
      const n = parseInt(String(x.id).slice(stem.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return stem + String(mx + 1).padStart(4, '0');
};

// ─── คำนวณยอดต่อบรรทัด + ยอดรวมเอกสาร ──────────────────────────────
//  line: { code, desc, acct, whtPct, vat(bool), amount }
window.fbtLineCalc = (l) => {
  const amount = Number(String(l.amount || 0).replace(/,/g, '')) || 0;
  const vatAmt = l.vat ? +(amount * 0.07).toFixed(2) : 0;
  const whtAmt = +(amount * (Number(l.whtPct || 0) / 100)).toFixed(2);
  return { amount, vatAmt, whtAmt, net: +(amount + vatAmt - whtAmt).toFixed(2) };
};
window.fbtTotals = (lines) => {
  return (lines || []).reduce((s, l) => {
    const c = window.fbtLineCalc(l);
    s.amount += c.amount; s.vat += c.vatAmt; s.wht += c.whtAmt; s.net += c.net;
    return s;
  }, { amount: 0, vat: 0, wht: 0, net: 0 });
};

// ─── ข้อมูลตัวอย่าง (seed) ─────────────────────────────────────────
const _fbtNow = new Date();
const _fbtIso = (daysAgo, h, m) => {
  const d = new Date(_fbtNow); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const _fbtDate = (daysAgo) => { const d = new Date(_fbtNow); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };

window.FBT_SEED = [
  {
    id: 'จ.6907-0002', ts: _fbtIso(0, 14, 12), type: 'pay',
    receiptDate: _fbtDate(0), txnDate: _fbtDate(0),
    partyType: 'vendor', partyCode: 'VEN-104', partyName: 'การไฟฟ้าส่วนภูมิภาค',
    receiveUnit: '00100', method: 'cheque', cashAcct: '210101', docState: 'normal',
    by: 'Chaiwat', branch: 'สำนักงานใหญ่',
    wht: false, taxId: '0994000165510', address: '200 ถนนงามวงศ์วาน นนทบุรี 11000',
    detail: 'ค่าไฟฟ้าสำนักงาน ประจำเดือน มิ.ย. 2569', note: '',
    lines: [
      { code: '5301', desc: 'ค่ากระแสไฟฟ้าสำนักงานใหญ่', acct: '530101', whtPct: 0, vat: false, amount: 28500 },
    ],
  },
  {
    id: 'จ.6907-0001', ts: _fbtIso(1, 10, 40), type: 'pay',
    receiptDate: _fbtDate(1), txnDate: _fbtDate(1),
    partyType: 'vendor', partyCode: 'VEN-101', partyName: 'บจก. ไอทีโซลูชั่น ซิสเต็มส์',
    receiveUnit: '00100', method: 'transfer', cashAcct: '110111', docState: 'normal',
    by: 'Chaiwat', branch: 'สำนักงานใหญ่',
    wht: true, taxId: '0105551024680', address: '99/1 อาคารซอฟต์แวร์ ถนนรัชดาภิเษก กรุงเทพฯ 10400',
    detail: 'ค่าพัฒนาระบบ ERP งวดที่ 2 (หัก ณ ที่จ่าย 3%)', note: 'ตามสัญญาจ้าง 12/2568',
    lines: [
      { code: '1401', desc: 'ค่าพัฒนาระบบสารสนเทศ งวดที่ 2', acct: '140101', whtPct: 3, vat: true, amount: 540000 },
    ],
  },
  {
    id: 'ร.6907-0001', ts: _fbtIso(1, 9, 5), type: 'receive',
    receiptDate: _fbtDate(1), txnDate: _fbtDate(1),
    partyType: 'member', partyCode: 'M-058252', partyName: 'นางสาวจุฬาลักษณ์ ทองดี',
    receiveUnit: '00100', method: 'cash', cashAcct: '110101', docState: 'normal',
    by: 'Chaiwat', branch: 'สำนักงานใหญ่',
    wht: false, taxId: '', address: '',
    detail: 'ค่าธรรมเนียมออกหนังสือรับรองการเป็นสมาชิก', note: '',
    lines: [
      { code: '4102', desc: 'ค่าธรรมเนียมหนังสือรับรอง', acct: '420102', whtPct: 0, vat: false, amount: 300 },
    ],
  },
];

// ─── โหลด / บันทึก ─────────────────────────────────────────────────
window.fbtLoad = () => {
  let list = null;
  try { const s = localStorage.getItem('fin_bytype'); if (s) list = JSON.parse(s); } catch (e) {}
  const base = JSON.parse(JSON.stringify(window.FBT_SEED || []));
  if (!list) return base;
  const ids = new Set(list.map(v => v.id));
  const missing = base.filter(s => !ids.has(s.id));
  return missing.length ? [...missing, ...list] : list;
};
window.fbtSave = (l) => { try { localStorage.setItem('fin_bytype', JSON.stringify(l)); } catch (e) {} };
