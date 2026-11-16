// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — เงินสดย่อย (Petty Cash / Imprest)
//  ตั้งวงเงิน · เบิก · บันทึกค่าใช้จ่าย · แนบหลักฐาน · ส่งเคลียร์ ·
//  อนุมัติเคลียร์ · เติมเงิน · ตรวจยอดคงเหลือ · รายงาน · ลงบัญชีอัตโนมัติ
// ════════════════════════════════════════════════════════════════════

// ─── ผังบัญชีที่เกี่ยวข้อง ───────────────────────────────────────────
window.PC_GL = {
  petty:   '110102',   // เงินสดย่อย
  bank:    '110111',   // เงินฝากธนาคาร–กระแสรายวัน
  advance: '115101',   // ลูกหนี้เงินทดรองจ่าย
};
const PC_GL_NAMES = {
  '110102': 'เงินสดย่อย',
  '110111': 'เงินฝากธนาคาร–กระแสรายวัน',
  '115101': 'ลูกหนี้เงินทดรองจ่าย',
};
window.pcAcctName = (code) => {
  if (!code) return '';
  if (window.coaAccountName) { const n = window.coaAccountName(code); if (n) return n; }
  const cat = (window.PC_CATEGORIES || []).find(c => c.gl === code);
  if (cat) return cat.l;
  return PC_GL_NAMES[code] || code;
};

// ─── หมวดค่าใช้จ่ายเงินสดย่อย → ผังบัญชีฝั่งเดบิต ────────────────────
window.PC_CATEGORIES = [
  { v: 'office',  l: 'ค่าวัสดุสำนักงาน',        gl: '530201', tone: 'info' },
  { v: 'fuel',    l: 'ค่าน้ำมันเชื้อเพลิง',      gl: '530401', tone: 'warning' },
  { v: 'postage', l: 'ค่าไปรษณีย์ / ขนส่ง',      gl: '530301', tone: 'info' },
  { v: 'repair',  l: 'ค่าซ่อมแซมบำรุงรักษา',     gl: '530501', tone: 'neutral' },
  { v: 'meeting', l: 'ค่ารับรอง / ประชุม',       gl: '530601', tone: 'primary' },
  { v: 'utility', l: 'ค่าสาธารณูปโภคย่อย',       gl: '530101', tone: 'success' },
  { v: 'misc',    l: 'ค่าใช้จ่ายเบ็ดเตล็ด',       gl: '530901', tone: 'neutral' },
];
window.pcCat = (v) => window.PC_CATEGORIES.find(c => c.v === v) || window.PC_CATEGORIES[window.PC_CATEGORIES.length - 1];

// ─── ประเภทรายการเคลื่อนไหว ─────────────────────────────────────────
window.PC_TYPES = {
  setup:     { l: 'ตั้งวงเงิน',   tone: 'primary', dir: 'in'  },
  replenish: { l: 'เติมเงิน',     tone: 'success', dir: 'in'  },
  advance:   { l: 'เบิกเงินสดย่อย', tone: 'warning', dir: 'out' },
  expense:   { l: 'ค่าใช้จ่าย',    tone: 'info',    dir: 'out' },
};

// ─── สถานะเอกสาร (ใช้กับค่าใช้จ่าย/เบิก) ────────────────────────────
window.PC_STATUS = {
  posted:        { l: 'บันทึกแล้ว',  pill: 'neutral' },   // setup/replenish
  draft:         { l: 'ร่าง',         pill: 'neutral' },
  pending_clear: { l: 'รอเคลียร์',    pill: 'warn' },
  cleared:       { l: 'เคลียร์แล้ว',  pill: 'info' },
  replenished:   { l: 'เติมคืนแล้ว',  pill: 'ok' },
  open:          { l: 'รอล้างบัญชี',  pill: 'warn' },     // advance
  settled:       { l: 'ล้างบัญชีแล้ว', pill: 'ok' },
};
window.pcStatus = (k) => window.PC_STATUS[k] || { l: k, pill: 'neutral' };

// ─── วงเงินสดย่อย (ค่าตั้งต้น) ───────────────────────────────────────
window.PC_FUND_DEFAULT = {
  amount: 30000,
  custodian: 'นางสาวสาวิตรี อินทรโชติ',
  dept: 'ฝ่ายการเงิน',
  bank: 'kbank-001',
  startDate: '2026-06-01',
  set: true,
};

// ─── ตัวอย่างรายการเคลื่อนไหว (รอบปัจจุบัน) ──────────────────────────
window.PC_SEED = [
  { id: 'PC-690601-01', date: '2026-06-01', type: 'setup', cat: '', desc: 'ตั้งวงเงินสดย่อยประจำงวด มิ.ย. 2569', amount: 30000, payee: '', files: ['อนุมัติตั้งวงเงิน_มิย69.pdf'], status: 'posted', by: 'นางจันทร์เพ็ญ มาลี' },
  { id: 'PC-690605-01', date: '2026-06-05', type: 'expense', cat: 'office', desc: 'กระดาษ A4 และหมึกพิมพ์', amount: 1850, payee: 'หจก. ศรีสมบูรณ์ เครื่องเขียน', files: ['ใบเสร็จ_เครื่องเขียน.jpg'], status: 'cleared', by: 'นางสาวสาวิตรี อินทรโชติ' },
  { id: 'PC-690608-01', date: '2026-06-08', type: 'expense', cat: 'fuel', desc: 'ค่าน้ำมันรถสำนักงาน', amount: 1200, payee: 'ปตท. สาขาราชเทวี', files: ['ใบเสร็จน้ำมัน.jpg'], status: 'cleared', by: 'นางสาวสาวิตรี อินทรโชติ' },
  { id: 'PC-690610-01', date: '2026-06-10', type: 'expense', cat: 'postage', desc: 'ค่าส่งไปรษณีย์ลงทะเบียน 12 ฉบับ', amount: 480, payee: 'บจก. ไปรษณีย์ไทย', files: [], status: 'pending_clear', by: 'นางสาวสาวิตรี อินทรโชติ' },
  { id: 'PC-690611-01', date: '2026-06-11', type: 'advance', cat: '', desc: 'เบิกเงินทดรองจัดประชุมใหญ่', amount: 5000, payee: 'นางสาวศิริพร ใจงาม', files: ['บันทึกขอเบิก.pdf'], status: 'open', by: 'นางจันทร์เพ็ญ มาลี' },
  { id: 'PC-690612-01', date: '2026-06-12', type: 'expense', cat: 'meeting', desc: 'ค่าอาหารว่างประชุมคณะกรรมการ', amount: 2300, payee: 'ร้านกาแฟสด เดอะมอลล์', files: ['ใบเสร็จกาแฟ.jpg'], status: 'draft', by: 'นางสาวสาวิตรี อินทรโชติ' },
];

// ─── โหลด / บันทึก ───────────────────────────────────────────────────
window.pcFundLoad = () => {
  try { const s = localStorage.getItem('petty_fund'); if (s) return JSON.parse(s); } catch (e) {}
  return { ...window.PC_FUND_DEFAULT };
};
window.pcFundSave = (f) => { try { localStorage.setItem('petty_fund', JSON.stringify(f)); } catch (e) {} };

window.pcLoad = () => {
  let list = null;
  try { const s = localStorage.getItem('petty_txns'); if (s) list = JSON.parse(s); } catch (e) {}
  const seed = JSON.parse(JSON.stringify(window.PC_SEED || []));
  if (!list) return seed;
  const ids = new Set(list.map(v => v.id));
  const missing = seed.filter(s => !ids.has(s.id));
  return missing.length ? [...missing, ...list] : list;
};
window.pcSave = (l) => { try { localStorage.setItem('petty_txns', JSON.stringify(l)); } catch (e) {} };

// ─── เลขที่รายการอัตโนมัติ: PC-YYMMDD-NN ─────────────────────────────
window.pcNextNo = (list, dateIso) => {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const stem = `PC-${yy}${mm}${dd}-`;
  let mx = 0;
  (list || []).forEach(x => { if (String(x.id).startsWith(stem)) { const n = parseInt(String(x.id).slice(stem.length), 10); if (!isNaN(n) && n > mx) mx = n; } });
  return stem + String(mx + 1).padStart(2, '0');
};

// ─── ทิศทางเงินสด (+เข้า / −ออก) ของรายการ ──────────────────────────
window.pcCashDelta = (tx) => {
  const dir = (window.PC_TYPES[tx.type] || {}).dir;
  const amt = Number(tx.amount || 0);
  if (tx.status === 'cancelled') return 0;
  return dir === 'in' ? amt : -amt;
};

// ─── เรียงลำดับ + คำนวณยอดคงเหลือสะสม ───────────────────────────────
window.pcSorted = (list) => [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1)));
window.pcWithBalance = (list) => {
  let bal = 0;
  return window.pcSorted(list).map(tx => { bal += window.pcCashDelta(tx); return { ...tx, _balance: bal }; });
};

// ─── สรุปยอดเพื่อกระทบยอดวงเงิน (imprest reconciliation) ─────────────
window.pcReconcile = (list, fund) => {
  const active = (list || []).filter(t => t.status !== 'cancelled');
  const cash = active.reduce((s, t) => s + window.pcCashDelta(t), 0);
  // ค่าใช้จ่ายที่ยังไม่เติมคืน (draft/pending/cleared)
  const pendingExp = active.filter(t => t.type === 'expense' && ['draft', 'pending_clear', 'cleared'].includes(t.status))
                           .reduce((s, t) => s + Number(t.amount || 0), 0);
  const openAdvance = active.filter(t => t.type === 'advance' && t.status === 'open')
                            .reduce((s, t) => s + Number(t.amount || 0), 0);
  const ceiling = Number((fund || {}).amount || 0);
  const counted = cash + pendingExp + openAdvance;
  return { cash, pendingExp, openAdvance, ceiling, counted, balanced: Math.abs(counted - ceiling) < 0.005, diff: counted - ceiling };
};

// ─── สร้างคู่บัญชีเดบิต/เครดิตอัตโนมัติของรายการ ─────────────────────
window.pcEntries = (tx) => {
  const amt = Number(tx.amount || 0);
  const G = window.PC_GL;
  if (tx.type === 'setup' || tx.type === 'replenish') {
    return [
      { acct: G.petty, name: window.pcAcctName(G.petty), debit: amt, credit: 0 },
      { acct: G.bank,  name: window.pcAcctName(G.bank),  debit: 0,   credit: amt },
    ];
  }
  if (tx.type === 'advance') {
    return [
      { acct: G.advance, name: window.pcAcctName(G.advance), debit: amt, credit: 0 },
      { acct: G.petty,   name: window.pcAcctName(G.petty),   debit: 0,   credit: amt },
    ];
  }
  // expense
  const cat = window.pcCat(tx.cat);
  return [
    { acct: cat.gl, name: cat.l,                     debit: amt, credit: 0 },
    { acct: G.petty, name: window.pcAcctName(G.petty), debit: 0,  credit: amt },
  ];
};
