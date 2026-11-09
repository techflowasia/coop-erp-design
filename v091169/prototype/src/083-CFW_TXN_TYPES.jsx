// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — สูตรกระดาษทำการงบการเงินกระแสเงินสด
//  (Cash Flow Statement Working-Paper Formula)
//
//  แต่ละแถว = รายการในกระดาษทำการงบกระแสเงินสด กำหนดว่าจะดึงยอด
//  เคลื่อนไหวของบัญชีมาลงด้าน "เดบิต / เครดิต" อย่างไร และบัญชีใดเป็น
//  "ยอดยกมา" ต้นงวด — เพื่อวิเคราะห์การเปลี่ยนแปลงเงินสดสุทธิ
//
//  ไวยากรณ์สูตร (คั่นแต่ละพจน์ด้วย ,):
//    +drcr(111101)          ยอดเดบิตสุทธิ (เดบิต − เครดิต) ของบัญชี
//    +crdr(111101)          ยอดเครดิตสุทธิ (เครดิต − เดบิต) ของบัญชี
//    +dr(141100)            ยอดด้านเดบิตของบัญชี
//    +cr(510390)            ยอดด้านเครดิตของบัญชี
//    +drcr(111210-111300)   ช่วงรหัสบัญชี (รวมทุกบัญชีในช่วง)
//    เครื่องหมาย +/- นำหน้าแต่ละพจน์ · คอลัมน์ "ยกมา" ใส่เฉพาะรหัส/ช่วง
// ════════════════════════════════════════════════════════════════════

// ─── ประเภททำการ / ด้านยอดยกมา ─────────────────────────────────────
window.CFW_TXN_TYPES = ['เดบิต,เครดิต', 'เดบิต', 'เครดิต'];
window.CFW_CARRY_SIDES = ['เดบิต', 'เครดิต'];

// ─── ค่าตั้งต้น (seed) — กระดาษทำการงบกระแสเงินสด มาตรฐานสหกรณ์ ──────
window.CFW_ROWS_SEED = window.CFW_ROWS_SEED || [
  { id: 'CFW-1',  name: 'เงินสด, เงินฝากธนาคารและสหกรณ์', debit: '+drcr(111101),+drcr(111210-111300)', credit: '+crdr(111101),+crdr(111210-111300)', carry: '111101,111210-111300' },
  { id: 'CFW-2',  name: 'เงินลงทุน',                       debit: '+drcr(115401),+drcr(120100)',       credit: '+crdr(115401),+crdr(120100)',       carry: '115401,120100,120200' },
  { id: 'CFW-3',  name: 'ลูกหนี้เงินกู้',                   debit: '+drcr(115100),+drcr(115200)',       credit: '+crdr(115100),+crdr(115200)',       carry: '115100,115200,131010' },
  { id: 'CFW-4',  name: 'ลูกหนี้ระหว่างดำเนินคดี',          debit: '+drcr(115301),+drcr(131030)',       credit: '+crdr(115301),+crdr(131030)',       carry: '115301,131030' },
  { id: 'CFW-5',  name: 'ลูกหนี้ตามคำพิพากษา',             debit: '+drcr(115302),+drcr(131040)',       credit: '+crdr(115302),+crdr(131040)',       carry: '115302,131040' },
  { id: 'CFW-6',  name: 'ลูกหนี้ตัวแทนรอหักส่ง',           debit: '+drcr(115403)',                     credit: '+crdr(115403)',                     carry: '115403' },
  { id: 'CFW-7',  name: 'ลูกหนี้ตัวแทนรอเรียกคืน',         debit: '+drcr(115604)',                     credit: '+crdr(115604)',                     carry: '115604' },
  { id: 'CFW-8',  name: 'ลูกหนี้กองทุนสงเคราะห์เจ้าหน้าที่', debit: '+drcr(115402)',                   credit: '+crdr(115402)',                     carry: '115402' },
  { id: 'CFW-9',  name: 'ดอกเบี้ยเงินให้กู้ค้างรับ',        debit: '+drcr(116100)',                     credit: '+crdr(116100)',                     carry: '116100' },
  { id: 'CFW-10', name: 'วัสดุคงเหลือ',                     debit: '+drcr(117100)',                     credit: '+crdr(117100)',                     carry: '117100' },
  { id: 'CFW-11', name: 'เงินทดรองจ่ายดำเนินคดี',           debit: '+drcr(191100)',                     credit: '+crdr(191100)',                     carry: '191100' },
  { id: 'CFW-12', name: 'ที่ดินรอการจำหน่าย',              debit: '+drcr(119301)',                     credit: '+crdr(119301)',                     carry: '119301' },
  { id: 'CFW-13', name: 'ค่าเบี้ยประกันภัยจ่ายล่วงหน้า',    debit: '+drcr(115501)',                     credit: '+crdr(115501)',                     carry: '115501' },
  { id: 'CFW-14', name: 'ค่าใช้จ่ายจ่ายล่วงหน้า',           debit: '+drcr(115504),+drcr(115505)',       credit: '+crdr(115504),+crdr(115505)',       carry: '115504,115505,115506' },
  { id: 'CFW-15', name: 'ดอกเบี้ยตั๋วแลกเงินค้างรับ',       debit: '+drcr(119102)',                     credit: '+crdr(119102)',                     carry: '119102' },
  { id: 'CFW-16', name: 'ดอกเบี้ยเงินฝากธนาคารค้างรับ',     debit: '+drcr(119101)',                     credit: '+crdr(119101)',                     carry: '119101' },
  { id: 'CFW-17', name: 'รายได้ค้างรับ',                    debit: '+drcr(119103-119110)',              credit: '+crdr(119103-119110)',              carry: '119103-119110' },
  { id: 'CFW-18', name: 'เงินเฉลี่ยคืนคลาดเคลื่อน',         debit: '+drcr(119202)',                     credit: '+crdr(119202)',                     carry: '119202' },
  { id: 'CFW-19', name: 'เงินปันผลคลาดเคลื่อน',             debit: '+drcr(119201)',                     credit: '+crdr(119201)',                     carry: '119201' },
  { id: 'CFW-20', name: 'เครื่องใช้สำนักงาน',               debit: '+dr(141100)',                       credit: '+dr(510390)',                       carry: '141100' },
  // ── หน้า 2 — หนี้สิน / ทุน / รายการปรับปรุง ──
  { id: 'CFW-21', name: 'เงินเบิกเกินบัญชีธนาคาร',          debit: '+drcr(211100)',                     credit: '+crdr(211100)',                     carry: '211100' },
  { id: 'CFW-22', name: 'เงินรับฝาก',                       debit: '+drcr(214000-214999)',              credit: '+crdr(214000-214999)',              carry: '214000-214999' },
  { id: 'CFW-23', name: 'เจ้าหนี้อื่น',                     debit: '+drcr(215100)',                     credit: '+crdr(215100)',                     carry: '215100' },
  { id: 'CFW-24', name: 'เงินกู้ยืม',                       debit: '+drcr(213100),+drcr(213200)',       credit: '+crdr(213100),+crdr(213200)',       carry: '213100,213200' },
  { id: 'CFW-25', name: 'ค่าใช้จ่ายค้างจ่าย',              debit: '+drcr(218100)',                     credit: '+crdr(218100)',                     carry: '218100' },
  { id: 'CFW-26', name: 'ภาษีเงินได้หัก ณ ที่จ่ายค้างจ่าย', debit: '+drcr(219707-219710)',             credit: '+crdr(219707-219710)',              carry: '219707-219710' },
  { id: 'CFW-27', name: 'ทุนเรือนหุ้น',                     debit: '+drcr(311100)',                     credit: '+crdr(311100)',                     carry: '311100' },
  { id: 'CFW-28', name: 'ทุนสำรอง',                         debit: '+drcr(321100)',                     credit: '+crdr(321100)',                     carry: '321100' },
  { id: 'CFW-29', name: 'ทุนสะสมตามข้อบังคับ',              debit: '+drcr(322100-322900)',              credit: '+crdr(322100-322900)',              carry: '322100-322900' },
  { id: 'CFW-30', name: 'กำไร (ขาดทุน) สุทธิประจำปี',        debit: '+drcr(331100)',                     credit: '+crdr(331100)',                     carry: '331100' },
];

// ─── localStorage ───────────────────────────────────────────────────
window.cfwLoad = function () {
  try {
    const saved = localStorage.getItem('acct_cfworksheet_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.CFW_ROWS_SEED || []).map(r => ({ ...r }));
};
window.cfwSave = function (rows) {
  try { localStorage.setItem('acct_cfworksheet_v1', JSON.stringify(rows)); } catch (e) {}
};
let _cfwSeq = 0;
window.cfwUid = () => 'CFW-' + Date.now().toString(36) + '-' + (++_cfwSeq);

// ════════════════════════════════════════════════════════════════════
//  ยอดเคลื่อนไหวบัญชี (GL movement) — จำลองแบบคงที่ (deterministic)
//  ในระบบจริงยอดเหล่านี้อ่านจากบัญชีแยกประเภทของงวด/ปีบัญชี
// ════════════════════════════════════════════════════════════════════
function _cfwHash(s) {
  let h = 2166136261;
  s = String(s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const _cfwMoveCache = {};
window.cfwMovement = function (code) {
  code = String(code);
  if (_cfwMoveCache[code]) return _cfwMoveCache[code];
  const h = _cfwHash(code);
  const opening = ((h % 14000) + 600) * 1000;             // 0.6 – 14.6 ลบ.
  const dr = (((h >> 5) % 9000) + 200) * 1000;            // 0.2 – 9.2 ลบ.
  const cr = Math.round(dr * (0.35 + (((h >> 9) % 60) / 100)));  // 35–95% ของ dr
  const m = { opening, dr, cr };
  _cfwMoveCache[code] = m;
  return m;
};

// รหัสบัญชีที่ลงรายการได้ทั้งหมด (สำหรับขยายช่วงรหัส)
window.cfwAllCodes = function () {
  const all = window.coaFlatAccounts ? window.coaFlatAccounts() : [];
  return all.filter(a => a.kind === 'posting' && /^\d+$/.test(String(a.code))).map(a => String(a.code));
};

// ════════════════════════════════════════════════════════════════════
//  ตัวแปลสูตร (parser) + ตัวประมวลผล (evaluator)
// ════════════════════════════════════════════════════════════════════
window.cfwParseTerms = function (formula) {
  if (!formula) return [];
  return String(formula).split(',').map(t => t.trim()).filter(Boolean).map(t => {
    const m = t.match(/^([+\-]?)\s*(drcr|crdr|dr|cr)\s*\(\s*([0-9]+(?:\s*-\s*[0-9]+)?)\s*\)$/i);
    if (!m) return { raw: t, bad: true };
    return { sign: m[1] === '-' ? -1 : 1, fn: m[2].toLowerCase(), arg: m[3].replace(/\s/g, ''), raw: t };
  });
};

// ขยาย argument (รหัสเดี่ยว หรือช่วง) เป็นรายการรหัสบัญชี
window.cfwCodesInArg = function (arg) {
  arg = String(arg).replace(/\s/g, '');
  if (arg.includes('-')) {
    const [lo, hi] = arg.split('-');
    const L = Number(lo), H = Number(hi);
    const found = window.cfwAllCodes().filter(c => { const n = Number(c); return n >= L && n <= H; });
    return found.length ? found : [lo, hi];   // ไม่พบในผังบัญชี → ใช้ปลายช่วง
  }
  return [arg];
};

function _cfwEvalTerm(term) {
  if (term.bad) return 0;
  let dr = 0, cr = 0;
  window.cfwCodesInArg(term.arg).forEach(c => { const m = window.cfwMovement(c); dr += m.dr; cr += m.cr; });
  let v = 0;
  if (term.fn === 'drcr') v = dr - cr;
  else if (term.fn === 'crdr') v = cr - dr;
  else if (term.fn === 'dr') v = dr;
  else v = cr;
  return term.sign * v;
}
window.cfwEvalFormula = function (f) {
  return window.cfwParseTerms(f).reduce((s, t) => s + _cfwEvalTerm(t), 0);
};
window.cfwEvalOpening = function (str) {
  if (!str) return 0;
  let sum = 0;
  String(str).split(',').map(s => s.trim()).filter(Boolean).forEach(a => {
    window.cfwCodesInArg(a).forEach(c => { sum += window.cfwMovement(c).opening; });
  });
  return sum;
};

// คำนวณค่าของแถว → { opening, debit, credit, change, ending }
window.cfwComputeRow = function (row) {
  const debit = window.cfwEvalFormula(row.debit);
  const credit = window.cfwEvalFormula(row.credit);
  const opening = window.cfwEvalOpening(row.carry);
  const change = debit - credit;
  return { opening, debit, credit, change, ending: opening + change };
};

// ── สร้างสูตร เดบิต/เครดิต จากรหัสบัญชี "ยกมา" ตามประเภททำการ ──
window.cfwDerive = function (carry, txnType) {
  const terms = String(carry || '').split(',').map(s => s.trim()).filter(Boolean);
  const mk = (fn) => terms.map(t => '+' + fn + '(' + t + ')').join(',');
  if (!terms.length) return { debit: null, credit: null };
  if (txnType === 'เดบิต')  return { debit: mk('dr'),   credit: null };
  if (txnType === 'เครดิต') return { debit: null,        credit: mk('cr') };
  return { debit: mk('drcr'), credit: mk('crdr') };   // เดบิต,เครดิต
};

// ── ตรวจสอบสูตรของแถว → รายการปัญหา (issues) ──
window.cfwValidateRow = function (row) {
  const issues = [];
  const coa = new Set(window.cfwAllCodes());
  const checkCol = (col, label) => {
    const raw = row[col];
    if (raw == null || String(raw).trim() === '') return;
    window.cfwParseTerms(raw).forEach(t => {
      if (t.bad) { issues.push(`${label}: รูปแบบสูตรไม่ถูกต้อง “${t.raw}”`); return; }
      if (!t.arg.includes('-') && !coa.has(t.arg))
        issues.push(`${label}: ไม่พบรหัสบัญชี ${t.arg} ในผังบัญชี`);
    });
  };
  checkCol('debit', 'เดบิต');
  checkCol('credit', 'เครดิต');
  String(row.carry || '').split(',').map(s => s.trim()).filter(Boolean).forEach(a => {
    a = a.replace(/\s/g, '');
    if (!/^[0-9]+(-[0-9]+)?$/.test(a)) issues.push(`ยกมา: รูปแบบรหัสไม่ถูกต้อง “${a}”`);
    else if (!a.includes('-') && !coa.has(a)) issues.push(`ยกมา: ไม่พบรหัสบัญชี ${a} ในผังบัญชี`);
  });
  return issues;
};
