// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน (Finance / Cashier) — รับเงิน & จ่ายเงิน (Quick teller)
//  หน้าเคาน์เตอร์รับ–จ่ายเงินจริง เน้นความเร็ว · อ้างอิงเชื่อมโยงไปยัง
//  ใบสำคัญรับ (RV) / ใบสำคัญจ่าย (PV) ในระบบบัญชี (แสดงลิงก์เท่านั้น)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทการรับเงิน (ฝั่งรับ) ─────────────────────────────────────
window.FIN_RCV_TYPES = [
  { v: 'loan',   l: 'ชำระหนี้เงินกู้',           short: 'ชำระหนี้',   tone: 'primary', hint: 'เงินต้น · ดอกเบี้ย · ค่าปรับ' },
  { v: 'share',  l: 'ค่าหุ้นรายเดือน',           short: 'ค่าหุ้น',     tone: 'info',    hint: 'หักทุนเรือนหุ้นสะสม' },
  { v: 'income', l: 'รายได้อื่น / ค่าธรรมเนียม', short: 'รายได้อื่น', tone: 'success', hint: 'ค่าธรรมเนียม · รายได้เบ็ดเตล็ด' },
  { v: 'agent',  l: 'รับเงินจากตัวแทน',          short: 'ตัวแทน',     tone: 'warning', hint: 'หน่วยหักเงิน ณ ที่จ่าย' },
];
window.finRcvType = (v) => window.FIN_RCV_TYPES.find(t => t.v === v) || window.FIN_RCV_TYPES[0];

// ─── ประเภทการจ่ายเงิน (ฝั่งจ่าย) ───────────────────────────────────
window.FIN_PAY_TYPES = [
  { v: 'allowance', l: 'เบี้ยประชุม / ค่าตอบแทน',    short: 'เบี้ยประชุม', tone: 'primary', hint: 'กรรมการ · อนุกรรมการ · วิทยากร' },
  { v: 'expense',   l: 'ค่าใช้จ่าย / ซัพพลายเออร์', short: 'ค่าใช้จ่าย', tone: 'info',    hint: 'ค่าสาธารณูปโภค · จัดซื้อ · บริการ' },
  { v: 'welfare',   l: 'สวัสดิการ / เงินช่วยเหลือ', short: 'สวัสดิการ',   tone: 'success', hint: 'ฌาปนกิจ · ทุน · เงินสงเคราะห์' },
];
window.finPayType = (v) => window.FIN_PAY_TYPES.find(t => t.v === v) || window.FIN_PAY_TYPES[0];

// ─── วิธีรับ–จ่ายเงิน ────────────────────────────────────────────────
window.FIN_METHODS = [
  { v: 'cash',     l: 'เงินสด' },
  { v: 'transfer', l: 'โอนเงิน' },
  { v: 'cheque',   l: 'เช็ค' },
];
window.finMethodLabel = (v) => (window.FIN_METHODS.find(m => m.v === v) || {}).l || '—';

// ─── ผู้ชำระ / ผู้รับเงิน (รายชื่อช่วยพิมพ์เร็ว) ─────────────────────
window.finReceivePayers = () => {
  const out = [];
  (window.RCV_PAYERS || []).forEach(p => out.push({ name: p.name, code: p.code, type: p.type }));
  return out;
};
window.finPayPayees = () => {
  const out = [];
  (window.VCH_PAYEES || []).forEach(p => out.push({ name: p.name, code: p.code, type: p.type }));
  return out;
};

// ─── เลขที่รายการอัตโนมัติ: RCT-YYMMDD-NN / PMT-YYMMDD-NN ────────────
window.finNextNo = (list, prefix, dateIso) => {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const stem = `${prefix}-${yy}${mm}${dd}-`;
  let mx = 0;
  (list || []).forEach(x => {
    if (String(x.id).startsWith(stem)) {
      const n = parseInt(String(x.id).slice(stem.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return stem + String(mx + 1).padStart(2, '0');
};

// ─── ข้อมูลตัวอย่าง — วันนี้อิงวันที่ระบบ ────────────────────────────
const _finToday = new Date();
const _finIso = (daysAgo, h, m) => {
  const d = new Date(_finToday);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

window.FIN_RCV_SEED = [
  { id: 'RCT-690614-03', ts: _finIso(0, 14, 22), type: 'agent', payer: 'ตัวแทนหักเงิน ณ ที่จ่าย กรมการสื่อสาร', payerCode: 'AG-201',
    amount: 208200, method: 'transfer', refType: 'RV', refNo: 'RV-2569-000034', note: 'รับชำระลูกหนี้ตัวแทน รอบ มิ.ย.', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'RCT-690614-02', ts: _finIso(0, 11, 8), type: 'income', payer: 'นางสาวจุฬาลักษณ์ ทองดี', payerCode: 'M-058252',
    amount: 300, method: 'cash', refType: 'RV', refNo: '', note: 'ค่าธรรมเนียมออกหนังสือรับรอง', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'RCT-690614-01', ts: _finIso(0, 9, 41), type: 'loan', payer: 'นายสมชาย ใจดี รักษ์ออม', payerCode: 'M-058241',
    amount: 8560, method: 'cash', refType: 'RV', refNo: 'RV-2569-000031', note: 'ชำระเงินกู้สามัญ งวด มิ.ย. (เงินต้น+ดอกเบี้ย+ค่าปรับ)', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'RCT-690612-02', ts: _finIso(2, 15, 33), type: 'share', payer: 'นางวิภา จันทร์เพ็ญ', payerCode: 'M-058244',
    amount: 1500, method: 'transfer', refType: 'RV', refNo: 'RV-2569-000033', note: 'ค่าหุ้นรายเดือน', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'RCT-690612-01', ts: _finIso(2, 10, 12), type: 'loan', payer: 'นายอนุชา สุขสวัสดิ์', payerCode: 'M-058243',
    amount: 12400, method: 'transfer', refType: 'RV', refNo: '', note: 'ชำระเงินกู้ฉุกเฉิน', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'RCT-690611-01', ts: _finIso(3, 13, 5), type: 'income', payer: 'บมจ. ทิพยประกันภัย', payerCode: 'RE-301',
    amount: 4800, method: 'cheque', refType: 'RV', refNo: '', note: 'ค่าตอบแทนตัวแทนขายประกัน', by: 'นางสาวสุนิสา ทองแท้', status: 'cancelled' },
];

window.FIN_PAY_SEED = [
  { id: 'PMT-690614-02', ts: _finIso(0, 13, 47), type: 'expense', payer: 'การไฟฟ้าส่วนภูมิภาค', payerCode: 'VEN-104',
    amount: 28500, method: 'cheque', refType: 'PV', refNo: 'PV-6906-0003', note: 'ค่าไฟฟ้าสำนักงาน พ.ค. 69', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'PMT-690614-01', ts: _finIso(0, 10, 20), type: 'welfare', payer: 'นางสมหญิง รักดี', payerCode: 'M-058249',
    amount: 5000, method: 'cash', refType: 'PV', refNo: '', note: 'เงินสงเคราะห์สมาชิกประสบภัย', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'PMT-690610-02', ts: _finIso(4, 11, 2), type: 'allowance', payer: 'คณะกรรมการดำเนินการ ชุดที่ 25 (5 ราย)', payerCode: 'WG-001',
    amount: 10000, method: 'transfer', refType: 'PV', refNo: 'PV-6905-0018', note: 'เบี้ยประชุมกรรมการ ครั้งที่ 5/2569', by: 'นางสาวสุนิสา ทองแท้', status: 'done' },
  { id: 'PMT-690610-01', ts: _finIso(4, 9, 30), type: 'expense', payer: 'บจก. ไอทีโซลูชั่น ซิสเต็มส์', payerCode: 'VEN-101',
    amount: 582000, method: 'transfer', refType: 'PV', refNo: 'PV-6905-0012', note: 'ค่าพัฒนาระบบ ERP งวดที่ 2 (หัก WHT 3%)', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
  { id: 'PMT-690608-01', ts: _finIso(6, 14, 55), type: 'allowance', payer: 'นายสมเกียรติ วิชาการ (วิทยากร 2 ราย)', payerCode: '—',
    amount: 38800, method: 'transfer', refType: 'PV', refNo: 'PV-6906-0010', note: 'ค่าตอบแทนวิทยากรอบรมความเสี่ยง', by: 'นางจันทร์เพ็ญ มาลี', status: 'done' },
];

// ─── โหลด / บันทึก ───────────────────────────────────────────────────
function _finLoad(key, seed) {
  let list = null;
  try { const s = localStorage.getItem(key); if (s) list = JSON.parse(s); } catch (e) {}
  const base = JSON.parse(JSON.stringify(seed || []));
  if (!list) return base;
  const ids = new Set(list.map(v => v.id));
  const missing = base.filter(s => !ids.has(s.id));
  return missing.length ? [...missing, ...list] : list;
}
window.finRcvLoad = () => _finLoad('fin_receipts', window.FIN_RCV_SEED);
window.finRcvSave = (l) => { try { localStorage.setItem('fin_receipts', JSON.stringify(l)); } catch (e) {} };
window.finPayLoad = () => _finLoad('fin_payments', window.FIN_PAY_SEED);
window.finPaySave = (l) => { try { localStorage.setItem('fin_payments', JSON.stringify(l)); } catch (e) {} };

// ─── ตัวช่วยจัดรูปแบบเวลา ────────────────────────────────────────────
window.finTime = (iso) => { try { return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return '—'; } };
window.finDateKey = (iso) => { try { return new Date(iso).toISOString().slice(0, 10); } catch (e) { return ''; } };
