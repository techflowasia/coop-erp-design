// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ใบสำคัญรับ (Receipt Voucher / RV)
//  ข้อมูลตั้งต้น: ประเภทผู้ชำระ · ประเภทการรับ · วิธีรับเงิน · บัญชีรับ
//  · สถานะเอกสาร · Mapping คู่บัญชีเดบิต/เครดิต · ทะเบียนผู้ชำระเงิน
//  · รายการค้างชำระจำลอง (เงินกู้/เงินฝาก/หุ้น/ลูกหนี้ตัวแทน) · ใบ RV ตัวอย่าง
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทผู้ชำระเงิน ──────────────────────────────────────────────
window.RCV_PAYER_TYPES = [
  { v: 'member',   l: 'สมาชิก' },
  { v: 'agent',    l: 'ตัวแทน' },
  { v: 'debtor',   l: 'ลูกหนี้' },
  { v: 'org',      l: 'หน่วยงาน / สังกัด' },
  { v: 'external', l: 'บุคคลภายนอก' },
];
window.rcvPayerTypeLabel = (v) => (window.RCV_PAYER_TYPES.find(t => t.v === v) || {}).l || '—';

// ─── ประเภทเอกสารใบสำคัญรับ ─────────────────────────────────────────
window.RCV_DOC_TYPES = [
  { v: 'general',  l: 'รับเงินทั่วไป' },
  { v: 'loan',     l: 'รับชำระหนี้เงินกู้' },
  { v: 'deposit',  l: 'รับเงินฝาก' },
  { v: 'agent',    l: 'รับชำระลูกหนี้ตัวแทน' },
  { v: 'claim',    l: 'รับเงินค่าสินไหมจากบริษัทประกัน' },
];

// ─── ประเภทรายการรับเงิน → คู่บัญชีฝั่งเครดิต (Mapping) ───────────────
window.RCV_LINE_TYPES = [
  { v: 'principal', l: 'เงินต้น',       credit: '110202', short: 'เงินต้น' },
  { v: 'interest',  l: 'ดอกเบี้ย',      credit: '410100', short: 'ดอกเบี้ย' },
  { v: 'penalty',   l: 'ค่าปรับ',       credit: '420000', short: 'ค่าปรับ' },
  { v: 'fee',       l: 'ค่าธรรมเนียม',  credit: '410200', short: 'ค่าธรรมเนียม' },
  { v: 'deposit',   l: 'เงินรับฝาก',    credit: '210101', short: 'เงินฝาก' },
  { v: 'share',     l: 'ค่าหุ้น',       credit: '310000', short: 'หุ้น' },
  { v: 'agent',     l: 'ลูกหนี้ตัวแทน', credit: '110202', short: 'ลูกหนี้ตัวแทน' },
  { v: 'claim',     l: 'รับเงินสินไหม',  credit: '110202', short: 'สินไหม' },
  { v: 'other',     l: 'รายได้อื่น',    credit: '420000', short: 'รายได้อื่น' },
];
window.rcvLineType = (v) => window.RCV_LINE_TYPES.find(t => t.v === v) || window.RCV_LINE_TYPES[7];

// ─── ระบบต้นทางของรายการ ────────────────────────────────────────────
window.RCV_SOURCES = [
  { v: 'loan',    l: 'ระบบเงินกู้' },
  { v: 'deposit', l: 'ระบบเงินฝาก' },
  { v: 'share',   l: 'ระบบหุ้น' },
  { v: 'agent',   l: 'ลูกหนี้ตัวแทน' },
  { v: 'claim',   l: 'ทะเบียนขอสินไหม' },
  { v: 'income',  l: 'รายได้อื่น' },
];
window.rcvSourceLabel = (v) => (window.RCV_SOURCES.find(s => s.v === v) || {}).l || '—';

// ─── วิธีรับเงิน → บัญชีเดบิต (เงินสด/ธนาคาร) ────────────────────────
window.RCV_METHODS = [
  { v: 'cash',     l: 'เงินสด',                  gl: '110101' },
  { v: 'transfer', l: 'โอนเงินผ่านธนาคาร',       gl: '110111' },
  { v: 'cheque',   l: 'เช็ค',                     gl: '110111' },
  { v: 'qr',       l: 'QR Payment',              gl: '110111' },
  { v: 'salary',   l: 'หักเงินเดือน',             gl: '110111' },
];
window.rcvMethodLabel = (v) => (window.RCV_METHODS.find(m => m.v === v) || {}).l || '—';

// ─── บัญชีรับเงินของสหกรณ์ (ฝั่งรับ) ────────────────────────────────
window.RCV_COOP_ACCOUNTS = [
  { v: 'cash',      gl: '110101', l: 'เงินสดในมือ · บัญชีเงินสดสำนักงาน' },
  { v: 'ktb-101',   gl: '110111', l: 'ธ.กรุงไทย สาขาราชการ · 980-1-50031-2 (บัญชีรับเงินทั่วไป)' },
  { v: 'gsb-102',   gl: '110112', l: 'ธ.ออมสิน สาขาเทศบาล · 020-77-553311 (บัญชีรับชำระหนี้)' },
  { v: 'kbank-103', gl: '110120', l: 'ธ.กสิกรไทย สาขาราชการ · 023-1-66120-8 (บัญชีกระแสรายวัน)' },
];
window.rcvCoopAccount = (v) => window.RCV_COOP_ACCOUNTS.find(a => a.v === v) || null;

// ─── ธนาคาร (ผู้ออกเช็ค / ผู้โอน) ───────────────────────────────────
window.RCV_BANKS = ['ธ.กรุงไทย', 'ธ.กสิกรไทย', 'ธ.ไทยพาณิชย์', 'ธ.กรุงเทพ', 'ธ.ออมสิน', 'ธ.ทหารไทยธนชาต'];

// ─── ค่าธรรมเนียมธนาคาร (ฝั่งเดบิตค่าใช้จ่าย) ────────────────────────
window.RCV_FEE_ACCT = '520900';
window.RCV_FEE_NAME = 'ค่าธรรมเนียมธนาคาร';

// ─── สถานะเอกสารใบสำคัญรับ + สายอนุมัติ ─────────────────────────────
window.RCV_STATUS = {
  draft:        { l: 'ร่าง',             pill: 'neutral', step: 0 },
  pending_check:{ l: 'รอตรวจสอบ',        pill: 'info',    step: 1 },
  pending_appr: { l: 'รออนุมัติ',         pill: 'warn',    step: 2 },
  approved:     { l: 'อนุมัติแล้ว',       pill: 'info',    step: 3 },
  posted:       { l: 'ผ่านรายการแล้ว',    pill: 'ok',      step: 4 },
  returned:     { l: 'ส่งกลับแก้ไข',      pill: 'warn',    step: -2 },
  cancelled:    { l: 'ยกเลิก',            pill: 'bad',     step: -1 },
  reversed:     { l: 'กลับรายการแล้ว',    pill: 'bad',     step: -3 },
};
window.RCV_STATUS_ORDER = ['draft', 'pending_check', 'pending_appr', 'approved', 'posted', 'returned', 'cancelled', 'reversed'];

// ป้ายชื่อประเภทใบสำคัญรับ — รองรับ "อื่น ๆ (ระบุ)"
window.rcvDocTypeLabel = (doc) => {
  if (!doc) return '—';
  if (doc.docType === '__other') return doc.docTypeOther || 'อื่น ๆ';
  const t = (window.RCV_DOC_TYPES || []).find(x => x.v === doc.docType);
  return t ? t.l : '—';
};

// ─── ปี / งวดบัญชี ──────────────────────────────────────────────────
window.RCV_FISCAL_YEARS = [2569, 2568, 2567];
window.rcvYearOf = (iso) => (new Date(iso || Date.now()).getFullYear() + 543);
window.rcvPeriodOf = (iso) => {
  const d = new Date(iso || Date.now());
  return String(d.getMonth() + 1).padStart(2, '0') + '/' + (d.getFullYear() + 543);
};
window.rcvPeriodOptions = (iso) => {
  const yr = window.rcvYearOf(iso);
  return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0') + '/' + yr);
};

// ─── แผนก / หน่วยงานที่รับผิดชอบ + ศูนย์ต้นทุน ──────────────────────
window.RCV_DEPTS = ['ฝ่ายการเงิน', 'ฝ่ายบัญชี', 'ฝ่ายสินเชื่อ', 'ฝ่ายเงินฝาก', 'สำนักงานสาขา 1'];
window.RCV_COST_CENTERS = ['CC-00 สำนักงานใหญ่', 'CC-01 ฝ่ายการเงิน', 'CC-02 ฝ่ายสินเชื่อ', 'CC-03 ฝ่ายเงินฝาก', 'CC-10 สาขา 1'];
window.RCV_BUDGET_CODES = ['—', 'BG-รายได้ดอกเบี้ย', 'BG-ค่าธรรมเนียม', 'BG-รายได้อื่น'];

// ─── หมวดงบประมาณที่รับเข้า (รับเงินคืนเข้างบประมาณ หรือ ไม่เข้างบ) ──
window.RCV_BUDGET_MODES = [
  { v: 'none',   l: 'ไม่เข้างบประมาณ',       hint: 'บันทึกเป็นรายได้/รายการทั่วไป ไม่กระทบยอดงบประมาณ' },
  { v: 'budget', l: 'รับคืนเข้างบประมาณ',    hint: 'เงินที่รับคืนเข้าไปเพิ่มยอดคงเหลือของหมวดงบประมาณที่เลือก' },
];

// ─── ประเภทเอกสารแนบ ────────────────────────────────────────────────
window.RCV_FILE_TYPES = ['สลิปโอนเงิน', 'Bank Statement', 'ใบแจ้งหนี้', 'หนังสือแจ้งหักเงินเดือน', 'สำเนาเช็ค', 'เอกสารลูกหนี้ตัวแทน', 'อื่น ๆ'];

// ─── เลขประจำตัวผู้เสียภาษีจำลอง ────────────────────────────────────
window.rcvMockTaxId = (seed) => {
  let s = 0; const str = String(seed || '0');
  for (let i = 0; i < str.length; i++) s = (s * 33 + str.charCodeAt(i)) >>> 0;
  let out = '';
  for (let i = 0; i < 13; i++) { out += String(s % 10); s = Math.floor(s / 10) + (s % 7) * 7 + i; }
  return out;
};

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนผู้ชำระเงิน (สมาชิก / ตัวแทน / ลูกหนี้ / หน่วยงาน / ภายนอก)
// ════════════════════════════════════════════════════════════════════
function rcvBuildPayers() {
  const list = [];
  (window.MEMBERS_LIST || []).slice(0, 18).forEach(m => {
    list.push({
      id: 'RM-' + m.code, type: 'member', code: m.code, name: m.name,
      memberNo: m.code, dept: m.dept, taxId: m.citizenId ? String(m.citizenId).replace(/\D/g, '') : window.rcvMockTaxId(m.code),
      phone: '08' + (1 + (m.code.charCodeAt(m.code.length - 1) % 8)) + '-' + String(1000000 + (m.code.charCodeAt(2) * 7919) % 8999999).slice(0, 7),
      address: m.dept || '',
    });
  });
  [
    ['AG-201', 'ตัวแทนหักเงิน ณ ที่จ่าย กรมการสื่อสาร', 'หน่วยหักเงินเดือน เขต 1'],
    ['AG-202', 'ตัวแทนรับชำระ สาขาภาคเหนือ', 'หน่วยตัวแทนภาคเหนือ'],
    ['AG-203', 'ตัวแทนรับชำระ สาขาภาคใต้', 'หน่วยตัวแทนภาคใต้'],
  ].forEach(([code, name, dept]) => list.push({
    id: 'RA-' + code, type: 'agent', code, name, dept, memberNo: '',
    taxId: window.rcvMockTaxId(code), phone: '02-271-' + (1000 + code.charCodeAt(3)), address: dept,
  }));
  [
    ['DT-301', 'นายวิรัตน์ เจริญทรัพย์', 'ลูกหนี้เงินยืมทดรอง'],
    ['DT-302', 'นางมาลี ผ่องใส', 'ลูกหนี้เงินจ่ายเกิน'],
  ].forEach(([code, name, dept]) => list.push({
    id: 'RD-' + code, type: 'debtor', code, name, dept, memberNo: '',
    taxId: window.rcvMockTaxId(code), phone: '08-9-' + (100000 + code.charCodeAt(3)), address: dept,
  }));
  [
    ['OG-401', 'กรมการสื่อสารทหาร', 'หน่วยงานต้นสังกัด'],
    ['OG-402', 'บมจ. ธนาคารกรุงไทย', 'ดอกเบี้ยเงินฝาก/เงินลงทุน'],
  ].forEach(([code, name, dept]) => list.push({
    id: 'RO-' + code, type: 'org', code, name, dept, memberNo: '',
    taxId: window.rcvMockTaxId(code), phone: '02-555-' + (2000 + code.charCodeAt(3)), address: dept,
  }));
  [
    ['EX-501', 'บจก. รุ่งเรือง พัสดุภัณฑ์', 'รับค่าธรรมเนียม/รายได้อื่น'],
  ].forEach(([code, name, dept]) => list.push({
    id: 'RE-' + code, type: 'external', code, name, dept, memberNo: '',
    taxId: window.rcvMockTaxId(code), phone: '02-712-3344', address: dept,
  }));
  return list;
}
window.RCV_PAYERS = rcvBuildPayers();
window.rcvPayersByType = (t) => window.RCV_PAYERS.filter(p => p.type === t);
window.rcvPayer = (id) => window.RCV_PAYERS.find(p => p.id === id) || null;

// ════════════════════════════════════════════════════════════════════
//  รายการค้างชำระจำลอง (สำหรับปุ่ม “ดึงรายการจากระบบ…”)
//  loan: 1 สัญญา → หลายบรรทัด (เงินต้น/ดอกเบี้ย/ค่าปรับ)
// ════════════════════════════════════════════════════════════════════
window.RCV_LOAN_DUE = [
  { contractNo: 'L-สามัญ-6512', memberNo: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', outstandingPrincipal: 320000,
    parts: [{ type: 'principal', desc: 'ชำระเงินต้นเงินกู้สามัญ งวด พ.ค.', outstanding: 320000, due: 8000 },
            { type: 'interest', desc: 'ดอกเบี้ยเงินกู้สามัญ งวด พ.ค.', outstanding: 1800, due: 1800 },
            { type: 'penalty', desc: 'ค่าปรับชำระล่าช้า', outstanding: 200, due: 200 }] },
  { contractNo: 'L-ฉุกเฉิน-6603', memberNo: 'M-058242', name: 'นางสาวกานต์ ศิริวงศ์', outstandingPrincipal: 24000,
    parts: [{ type: 'principal', desc: 'ชำระเงินต้นเงินกู้ฉุกเฉิน', outstanding: 24000, due: 4000 },
            { type: 'interest', desc: 'ดอกเบี้ยเงินกู้ฉุกเฉิน', outstanding: 360, due: 360 }] },
];
window.RCV_DEPOSIT_DUE = [
  { acctNo: 'S-001-44521', memberNo: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', kind: 'ออมทรัพย์', balance: 152300 },
  { acctNo: 'F-003-11220', memberNo: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', kind: 'ประจำ 12 เดือน', balance: 500000 },
];
window.RCV_SHARE_DUE = [
  { memberNo: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', monthly: 2000, desc: 'ค่าหุ้นรายเดือน งวด พ.ค.' },
  { memberNo: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', monthly: 1500, desc: 'ค่าหุ้นรายเดือน งวด พ.ค.' },
];
window.RCV_AGENT_DUE = [
  { agentCode: 'AG-201', ref: 'AGR-6906-001', label: 'AGR ยอดเรียกเก็บประจำเดือน', outstanding: 185400 },
  { agentCode: 'AG-201', ref: 'ARE-6906-001', label: 'ARE ดอกเบี้ยรับ', outstanding: 22800 },
  { agentCode: 'AG-202', ref: 'CCL-6906-014', label: 'CCL ค่าธรรมเนียมเรียกเก็บ', outstanding: 4200 },
];

// ════════════════════════════════════════════════════════════════════
//  การคำนวณ
// ════════════════════════════════════════════════════════════════════
window.rcvLineRemain = (l) => Number(l.outstanding || 0) - Number(l.amount || 0) - Number(l.discount || 0);
window.rcvLineStatus = (l) => {
  const out = Number(l.outstanding || 0);
  const amt = Number(l.amount || 0);
  if (out <= 0) return { k: 'normal', l: 'ปกติ', pill: 'neutral' };
  const remain = out - amt - Number(l.discount || 0);
  if (Math.abs(remain) < 0.005) return { k: 'full', l: 'ชำระครบ', pill: 'ok' };
  if (remain < 0) return { k: 'over', l: 'ยอดเกิน', pill: 'warn' };
  return { k: 'partial', l: 'ชำระบางส่วน', pill: 'info' };
};
window.rcvSumReceived = (lines) => (lines || []).reduce((s, l) => s + Number(l.amount || 0), 0);
window.rcvOverPaid = (lines) => (lines || []).reduce((s, l) => {
  const out = Number(l.outstanding || 0); if (out <= 0) return s;
  const over = Number(l.amount || 0) + Number(l.discount || 0) - out;
  return s + (over > 0 ? over : 0);
}, 0);
window.rcvOutstandingAfter = (lines) => (lines || []).reduce((s, l) => {
  const r = window.rcvLineRemain(l); return s + (r > 0 ? r : 0);
}, 0);

window.rcvAcctName = (code) => {
  if (!code) return '';
  if (code === window.RCV_FEE_ACCT) return window.RCV_FEE_NAME;
  return (window.coaAccountName && window.coaAccountName(code)) || '';
};

// ─── สร้างรายการบัญชีเดบิต/เครดิตอัตโนมัติจาก Mapping ───────────────
window.rcvBuildEntries = (doc) => {
  const lines = (doc.lines || []).filter(l => Number(l.amount) > 0);
  const gross = window.rcvSumReceived(lines);
  const fee = Number((doc.receive || {}).bankFee || 0);
  const net = gross - fee;
  const coop = window.rcvCoopAccount((doc.receive || {}).coopAccount);
  const recvGl = coop ? coop.gl : (window.RCV_METHODS.find(m => m.v === (doc.receive || {}).method) || { gl: '110101' }).gl;

  const entries = [];
  // เดบิต: เงินสด/ธนาคารที่รับเข้า (ยอดสุทธิ)
  if (net !== 0) entries.push({ acct: recvGl, desc: 'รับเงินเข้า ' + window.rcvAcctName(recvGl), debit: net, credit: 0, src: '', cc: doc.dept || '' });
  // เดบิต: ค่าธรรมเนียมธนาคาร (ถ้ามี)
  if (fee > 0) entries.push({ acct: window.RCV_FEE_ACCT, desc: 'ค่าธรรมเนียมธนาคารหักจากยอดรับ', debit: fee, credit: 0, src: '', cc: doc.dept || '' });
  // เครดิต: ตามรายการรับ (รวมหมวดเดียวกัน)
  const byAcct = {};
  lines.forEach(l => {
    const t = window.rcvLineType(l.recvType);
    const acct = t.credit;
    if (!byAcct[acct]) { byAcct[acct] = { acct, desc: t.l, credit: 0, src: l.srcSystem || '', ref: l.refDoc || '' }; }
    byAcct[acct].credit += Number(l.amount || 0);
  });
  Object.values(byAcct).forEach(e => entries.push({ acct: e.acct, desc: e.desc, debit: 0, credit: e.credit, src: e.src, ref: e.ref, cc: doc.dept || '' }));
  return entries;
};
window.rcvEntryTotals = (entries) => (entries || []).reduce((t, e) => {
  t.debit += Number(e.debit || 0); t.credit += Number(e.credit || 0); return t;
}, { debit: 0, credit: 0 });

// ════════════════════════════════════════════════════════════════════
//  อ้างอิงทะเบียนขอสินไหม (Insurance Claim Registration)
//  บริษัทประกันจ่ายค่าสินไหมมาที่สหกรณ์ → ผูกใบสำคัญรับกับเลขที่คำขอสินไหม
//  → ออกยอดเทียบ "ยอดที่ขอสินไหม" กับ "ยอดที่ได้รับจริง"
// ════════════════════════════════════════════════════════════════════
// สถานะคำขอที่พร้อมให้อ้างอิงในใบสำคัญรับ (ตั้งแต่ส่งบริษัท → ได้รับเงิน)
window.RCV_CLAIM_REF_STATUS = ['sent', 'reviewing', 'approved', 'received', 'offset', 'refunded', 'closed'];

// รวมข้อมูลคำขอสินไหม 1 รายการให้อยู่ในรูปที่ใบสำคัญรับใช้อ้างอิงได้
window.rcvClaimInfo = (rec) => {
  if (!rec) return null;
  const m = (window.CL_MEMBERS || []).find(x => x.code === rec.memberCode) || {};
  const policy = (m.policies || []).find(p => p.id === rec.policyId) || null;
  const offsetTotal = (rec.debts || []).reduce((s, d) => s + Number(d.offset || 0), 0);
  return {
    claimNo: rec.id,
    status: rec.status,
    memberCode: rec.memberCode,
    memberName: m.name || rec.memberCode,
    company: policy ? policy.company : '—',
    policyNo: policy ? policy.policyNo : '',
    reqType: rec.reqType,
    estimate: Number(rec.estimate || 0),   // ยอดที่ขอสินไหม (วงเงินคุ้มครอง/ประมาณการ)
    actual: Number(rec.actual || 0),       // ยอดที่บริษัทอนุมัติ/ได้รับจริง
    offsetTotal,                            // ยอดที่ต้องนำไปตัดชำระหนี้
  };
};

// รายการคำขอสินไหมที่อ้างอิงได้ (เรียงล่าสุดก่อน)
window.rcvClaimRefList = () => {
  const list = (window.crLoad ? window.crLoad() : (window.CR_SEED || []));
  return list
    .filter(r => window.RCV_CLAIM_REF_STATUS.includes(r.status))
    .map(window.rcvClaimInfo)
    .filter(Boolean);
};

// รายงานสรุป: ต่อคำขอสินไหม → ขอไปเท่าไร (estimate) · อนุมัติ (actual) ·
//  รับเข้าจริงผ่านใบสำคัญรับที่ผ่านรายการ/อนุมัติแล้วเท่าไร · ผลต่าง
window.rcvClaimReport = (receipts) => {
  const rvList = receipts || (window.rcvLoad ? window.rcvLoad() : []);
  // ยอดรับจริงจากใบสำคัญรับที่ผูกกับคำขอสินไหม (นับเฉพาะเอกสารที่ไม่ถูกยกเลิก)
  const receivedBy = {};
  const rvsBy = {};
  rvList.forEach(v => {
    const cr = v.claimRef;
    if (!cr || !cr.claimNo) return;
    if (['cancelled', 'reversed', 'returned'].includes(v.status)) return;
    const amt = window.rcvSumReceived(v.lines);
    receivedBy[cr.claimNo] = (receivedBy[cr.claimNo] || 0) + amt;
    (rvsBy[cr.claimNo] = rvsBy[cr.claimNo] || []).push({ id: v.id, date: v.docDate, amount: amt, status: v.status });
  });
  const claims = (window.crLoad ? window.crLoad() : (window.CR_SEED || [])).map(window.rcvClaimInfo).filter(Boolean);
  return claims.map(c => {
    const received = receivedBy[c.claimNo] || 0;
    const diff = c.actual - received;       // อนุมัติ − รับเข้าจริง
    let statusKey, statusLabel, tone;
    if (received === 0)      { statusKey = 'pending';  statusLabel = 'ยังไม่รับเงินเข้า'; tone = 'neutral'; }
    else if (diff > 0.005)   { statusKey = 'partial';  statusLabel = 'รับเข้าบางส่วน';    tone = 'warn'; }
    else if (diff < -0.005)  { statusKey = 'over';     statusLabel = 'รับเกินยอดอนุมัติ';  tone = 'bad'; }
    else                     { statusKey = 'full';     statusLabel = 'รับครบตามอนุมัติ';   tone = 'ok'; }
    return { ...c, received, diff, statusKey, statusLabel, tone, rvs: rvsBy[c.claimNo] || [] };
  });
};

// ─── เลขที่ใบสำคัญรับอัตโนมัติ: RV-YYYY-NNNNNN (พ.ศ.) ───────────────
window.rcvNextNo = (list, dateIso) => {
  const yr = window.rcvYearOf(dateIso);
  const prefix = `RV-${yr}-`;
  let mx = 0;
  (list || []).forEach(v => {
    if (String(v.id).startsWith(prefix)) {
      const n = parseInt(String(v.id).slice(prefix.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return prefix + String(mx + 1).padStart(6, '0');
};

// ─── เลขที่ใบเสร็จอัตโนมัติ: RCP-YYYY-NNNNNN ─────────────────────────
window.rcvNextReceiptNo = (list, dateIso) => {
  const yr = window.rcvYearOf(dateIso);
  const prefix = `RCP-${yr}-`;
  let mx = 0;
  (list || []).forEach(v => {
    const rn = v.receipt && v.receipt.no;
    if (rn && String(rn).startsWith(prefix)) {
      const n = parseInt(String(rn).slice(prefix.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return prefix + String(mx + 1).padStart(6, '0');
};

// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญรับตัวอย่าง
// ════════════════════════════════════════════════════════════════════
window.RCV_SEED = [
  {
    id: 'RV-2569-000031', docDate: '2026-05-09', postDate: '2026-05-09', fiscalYear: 2569, period: '05/2569',
    docType: 'loan', dept: 'ฝ่ายการเงิน', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'posted',
    refNo: 'L-สามัญ-6512', headerNote: 'รับชำระเงินกู้สามัญประจำงวด พ.ค. 2569',
    payer: { type: 'member', payerId: 'RM-M-058241', code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม',
             memberNo: 'M-058241', dept: 'กองคลัง สำนักงานปลัด', taxId: '', address: 'กองคลัง สำนักงานปลัด', phone: '081-2345678' },
    receive: { method: 'cash', receiveDate: '2026-05-09', coopAccount: 'cash', bank: '', bankAccount: '',
               transferRef: '', chequeNo: '', chequeDate: '', chequeBank: '', bankFee: 0 },
    lines: [
      { recvType: 'principal', srcSystem: 'loan', contractNo: 'L-สามัญ-6512', desc: 'ชำระเงินต้นเงินกู้สามัญ งวด พ.ค.', outstanding: 320000, amount: 8000, discount: 0, budgetCode: '—', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: 'L-สามัญ-6512' },
      { recvType: 'interest', srcSystem: 'loan', contractNo: 'L-สามัญ-6512', desc: 'ดอกเบี้ยเงินกู้สามัญ งวด พ.ค.', outstanding: 1800, amount: 1800, discount: 0, budgetCode: 'BG-รายได้ดอกเบี้ย', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: 'L-สามัญ-6512' },
      { recvType: 'penalty', srcSystem: 'loan', contractNo: 'L-สามัญ-6512', desc: 'ค่าปรับชำระล่าช้า', outstanding: 200, amount: 200, discount: 0, budgetCode: 'BG-รายได้อื่น', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: 'L-สามัญ-6512' },
    ],
    files: [{ name: 'สลิปชำระเงินกู้_058241.pdf', type: 'สลิปโอนเงิน', size: '142 KB', date: '2026-05-09', by: 'นางจันทร์เพ็ญ มาลี' }],
    receipt: { issue: true, no: 'RCP-2569-000028', date: '2026-05-09', name: 'นายสมชาย ใจดี รักษ์ออม', address: 'กองคลัง สำนักงานปลัด', status: 'issued' },
  },
  {
    id: 'RV-2569-000032', docDate: '2026-05-20', postDate: '2026-05-20', fiscalYear: 2569, period: '05/2569',
    docType: 'deposit', dept: 'ฝ่ายเงินฝาก', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'approved',
    refNo: 'S-001-44521', headerNote: 'รับฝากเงินออมทรัพย์',
    payer: { type: 'member', payerId: 'RM-M-058241', code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม',
             memberNo: 'M-058241', dept: 'กองคลัง สำนักงานปลัด', taxId: '', address: 'กองคลัง สำนักงานปลัด', phone: '081-2345678' },
    receive: { method: 'transfer', receiveDate: '2026-05-20', coopAccount: 'ktb-101', bank: 'ธ.กรุงไทย', bankAccount: '980-1-50031-2',
               transferRef: 'TXN-20260520-0098', chequeNo: '', chequeDate: '', chequeBank: '', bankFee: 0 },
    lines: [
      { recvType: 'deposit', srcSystem: 'deposit', contractNo: 'S-001-44521', desc: 'รับฝากเงินออมทรัพย์', outstanding: 0, amount: 5000, discount: 0, budgetCode: '—', costCenter: 'CC-03 ฝ่ายเงินฝาก', refDoc: 'S-001-44521' },
    ],
    files: [{ name: 'สลิปโอนออมทรัพย์.jpg', type: 'สลิปโอนเงิน', size: '88 KB', date: '2026-05-20', by: 'นางจันทร์เพ็ญ มาลี' }],
    receipt: { issue: true, no: 'RCP-2569-000031', date: '2026-05-20', name: 'นายสมชาย ใจดี รักษ์ออม', address: 'กองคลัง สำนักงานปลัด', status: 'issued' },
  },
  {
    id: 'RV-2569-000033', docDate: '2026-06-02', postDate: '2026-06-02', fiscalYear: 2569, period: '06/2569',
    docType: 'general', dept: 'ฝ่ายการเงิน', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'pending_appr',
    refNo: '', headerNote: 'รับค่าหุ้นรายเดือนและค่าธรรมเนียม',
    payer: { type: 'member', payerId: 'RM-M-058244', code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ',
             memberNo: 'M-058244', dept: 'กองการศึกษา', taxId: '', address: 'กองการศึกษา', phone: '089-8765432' },
    receive: { method: 'qr', receiveDate: '2026-06-02', coopAccount: 'kbank-103', bank: 'ธ.กสิกรไทย', bankAccount: '023-1-66120-8',
               transferRef: 'QR-20260602-1187', chequeNo: '', chequeDate: '', chequeBank: '', bankFee: 15 },
    lines: [
      { recvType: 'share', srcSystem: 'share', contractNo: '', desc: 'ค่าหุ้นรายเดือน งวด พ.ค.', outstanding: 0, amount: 1500, discount: 0, budgetCode: '—', costCenter: 'CC-01 ฝ่ายการเงิน', refDoc: '' },
      { recvType: 'fee', srcSystem: 'income', contractNo: '', desc: 'ค่าธรรมเนียมบริการ', outstanding: 0, amount: 100, discount: 0, budgetCode: 'BG-ค่าธรรมเนียม', costCenter: 'CC-01 ฝ่ายการเงิน', refDoc: '' },
    ],
    files: [],
    receipt: { issue: false, no: '', date: '', name: '', address: '', status: 'none' },
  },
  {
    id: 'RV-2569-000034', docDate: '2026-06-08', postDate: '2026-06-08', fiscalYear: 2569, period: '06/2569',
    docType: 'agent', dept: 'ฝ่ายสินเชื่อ', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'draft',
    refNo: 'AGR-6906-001', headerNote: 'รับชำระลูกหนี้ตัวแทน รอบ มิ.ย. 2569',
    payer: { type: 'agent', payerId: 'RA-AG-201', code: 'AG-201', name: 'ตัวแทนหักเงิน ณ ที่จ่าย กรมการสื่อสาร',
             memberNo: '', dept: 'หน่วยหักเงินเดือน เขต 1', taxId: '', address: 'หน่วยหักเงินเดือน เขต 1', phone: '02-271-1064' },
    receive: { method: 'transfer', receiveDate: '2026-06-08', coopAccount: 'gsb-102', bank: 'ธ.ออมสิน', bankAccount: '020-77-553311',
               transferRef: 'TXN-20260608-2210', chequeNo: '', chequeDate: '', chequeBank: '', bankFee: 0 },
    lines: [
      { recvType: 'agent', srcSystem: 'agent', contractNo: 'AGR-6906-001', desc: 'AGR ยอดเรียกเก็บประจำเดือน', outstanding: 185400, amount: 185400, discount: 0, budgetCode: '—', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: 'AGR-6906-001' },
      { recvType: 'interest', srcSystem: 'agent', contractNo: 'ARE-6906-001', desc: 'ARE ดอกเบี้ยรับ', outstanding: 22800, amount: 22800, discount: 0, budgetCode: 'BG-รายได้ดอกเบี้ย', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: 'ARE-6906-001' },
    ],
    files: [{ name: 'รายงานตัวแทน_AGR_มิย69.xlsx', type: 'เอกสารลูกหนี้ตัวแทน', size: '64 KB', date: '2026-06-08', by: 'นางจันทร์เพ็ญ มาลี' }],
    receipt: { issue: false, no: '', date: '', name: '', address: '', status: 'none' },
  },
  {
    id: 'RV-2569-000035', docDate: '2026-06-30', postDate: '2026-06-30', fiscalYear: 2569, period: '06/2569',
    docType: 'claim', dept: 'ฝ่ายการเงิน', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'posted',
    refNo: 'CLM-2569-0031', headerNote: 'รับเงินค่าสินไหมประกันชีวิตจากบริษัทประกัน — สมาชิก M-058241',
    budget: { mode: 'none', catId: '' },
    claimRef: { claimNo: 'CLM-2569-0031', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
                company: 'บมจ. ไทยสมุทรประกันชีวิต', policyNo: 'INS-2568-00141',
                estimate: 1500000, actual: 1500000, offsetTotal: 330935 },
    payer: { type: 'org', payerId: '', code: 'INSCO-01', name: 'บมจ. ไทยสมุทรประกันชีวิต',
             memberNo: 'M-058241', dept: 'ฝ่ายสินไหม', taxId: '0107537000114', address: '', phone: '' },
    receive: { method: 'transfer', receiveDate: '2026-06-30', coopAccount: 'ktb-101', bank: 'ธ.กรุงไทย', bankAccount: '980-1-50031-2',
               transferRef: 'TXN-20260630-0451', chequeNo: '', chequeDate: '', chequeBank: '', bankFee: 0 },
    lines: [
      { recvType: 'claim', srcSystem: 'claim', contractNo: 'CLM-2569-0031', desc: 'รับเงินสินไหมประกันชีวิต — สมาชิก M-058241 (นายสมชาย ใจดี รักษ์ออม)', outstanding: 1500000, amount: 1500000, discount: 0, budgetCat: '', budgetCode: '—', costCenter: 'CC-01 ฝ่ายการเงิน', refDoc: 'CLM-2569-0031', claimNo: 'CLM-2569-0031' },
    ],
    files: [{ name: 'หนังสือแจ้งจ่ายสินไหม_ไทยสมุทร.pdf', type: 'อื่น ๆ', size: '196 KB', date: '2026-06-30', by: 'นางจันทร์เพ็ญ มาลี' }],
    receipt: { issue: true, no: 'RCP-2569-000045', date: '2026-06-30', name: 'บมจ. ไทยสมุทรประกันชีวิต', address: '', status: 'issued' },
  },
];

// ─── โหลด/บันทึกใบสำคัญรับ ──────────────────────────────────────────
window.rcvLoad = () => {
  let list = null;
  try { const s = localStorage.getItem('receipts'); if (s) list = JSON.parse(s); } catch (e) {}
  const seed = JSON.parse(JSON.stringify(window.RCV_SEED || []));
  if (!list) return seed;
  const ids = new Set(list.map(v => v.id));
  const missing = seed.filter(s => !ids.has(s.id));
  return missing.length ? [...missing, ...list] : list;
};
window.rcvSave = (list) => { try { localStorage.setItem('receipts', JSON.stringify(list)); } catch (e) {} };

// ─── แปลงเลขเป็นตัวอักษรไทย (ใช้ร่วมกับใบสำคัญจ่ายถ้ามี) ─────────────
if (!window.bahtText) {
  window.bahtText = (n) => Number(n || 0).toLocaleString('th-TH') + ' บาทถ้วน';
}
