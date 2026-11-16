// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — เบิกเงินกู้ค้างจ่าย (Loan Payout / LPO)
//  ─ ใช้เบิกจ่าย "เงินกู้พิเศษ" ที่ผ่านอนุมัติสินเชื่อแล้ว โดยจ่ายเป็นงวด
//    (สูงสุด 4 งวด) — เจ้าหน้าที่สินเชื่อระบุ "วิธีจ่ายเงินกู้" ของแต่ละงวด
//  ─ เมื่อยืนยันการเบิกงวด → Order วิ่งไปยัง การเงิน › อนุมัติจ่ายสินเชื่อ
//    (finance/loan-disbursement) เพื่อให้เจ้าหน้าที่การเงินอนุมัติจ่ายจริง
// ════════════════════════════════════════════════════════════════════

window.LPO_OFFICER = 'เจ้าหน้าที่สินเชื่อ · ปิยะนุช ทองแท้';

// ── สถานะใบคำขอเบิก (ต่อสัญญา) ─────────────────────────────────────
window.LPO_STATUS = [
  { v: 'pending', l: 'รอบันทึกจ่าย',   pill: 'warn' },
  { v: 'done',    l: 'บันทึกจ่ายสำเร็จ', pill: 'ok'  },
];
window.lpoStatus = (v) => window.LPO_STATUS.find(s => s.v === v) || { v, l: v, pill: 'neutral' };

// ── วิธีจ่ายเงินกู้ (จ่ายเงินกู้เป็น) — ฟิลด์ที่ต้องกรอกต่างกันตามวิธี ──
//  need: acct(เลขบัญชี/เช็ค/ตั๋ว) · fromBank(ธนาคารต้นทาง) · fromBranch(สาขาธนาคาร)
//        · toBranch(สาขาปลายทาง) · zip(รหัสไปรษณีย์ปลายทาง) · payee(ผู้สั่งจ่าย)
window.LPO_PAY_METHODS = [
  { v: 'coop-deposit', l: 'โอนเงินฝากสหกรณ์',  need: ['acct'] },
  { v: 'bank-deposit', l: 'โอนเงินฝากธนาคาร',  need: ['acct', 'fromBank', 'fromBranch'] },
  { v: 'cash',         l: 'เงินสด',            need: [] },
  { v: 'money-order',  l: 'ธนาณัติออนไลน์',    need: ['zip', 'payee'] },
  { v: 'cashier',      l: 'แคชเชียร์เช็ค',      need: ['acct', 'fromBank', 'payee'] },
  { v: 'cheque',       l: 'เช็ค',              need: ['acct', 'toBranch', 'payee'] },
  { v: 'draft',        l: 'ตั๋วแลกเงิน',       need: ['acct', 'fromBank', 'fromBranch', 'toBranch', 'payee'] },
  { v: 'wait',         l: 'รอเจ้าหน้าที่เบิกจ่าย', need: [] },
];
// งวดที่เหลือ — ตัวเลือกเดียวกับ "บันทึกจ่ายเงินกู้พิเศษ"
window.LPO_REST_METHODS = ['coop-deposit', 'wait'];
window.lpoPayMethod = (v) => window.LPO_PAY_METHODS.find(m => m.v === v) || { v, l: v || '—', need: [] };

// ── รูปแบบการจ่ายกู้ ────────────────────────────────────────────────
window.LPO_PAYOUT_MODES = [
  { v: 'single', l: 'จ่ายงวดเดียว' },
  { v: 'multi',  l: 'จ่ายหลายงวด' },
];

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลตั้งต้น — สัญญาเงินกู้พิเศษที่ผ่านอนุมัติแล้ว รอเบิกจ่ายเป็นงวด
//   installments[]: งวดการเบิกจ่าย (จำนวน 4 งวด)
//     · no · amount(วงเงินงวด) · dueDate(กำหนดเบิก) · state(disbursed|pending)
//     · lines[]: วิธีจ่ายที่ระบุแล้วของงวดนั้น (ถ้ามี)
// ════════════════════════════════════════════════════════════════════
function lpoLine(method, o) {
  return Object.assign({
    method, acct: '-', fromBank: '-', fromBranch: '-', toBranch: '-', zip: '-', payee: '-',
    fee: 0, service: 0, tax: 0, transferTotal: 0, net: 0,
  }, o || {});
}

window.LPO_SEED = [
  {
    id: 'LPO-2569-000118', contractNo: 'AA123456789', reqNo: 'AA123456789',
    memberCode: '123456789', memberName: 'นายสมชาย ใจดี',
    dept: 'ส่วนบริการด้านสื่อสารอิเล็กทรอนิกส์และบริหารฐานข้อมูล',
    productCode: '61-สศ', productName: 'สามัญเพื่อแก้ไขปัญหาเศรษฐกิจ', group: 'เงินกู้พิเศษ',
    purpose: 'ใช้จ่ายในครอบครัวและส่วนตัว',
    amount: 900000, reqDate: '2026-01-01', payDate: '2026-01-01', collectDate: '2026-01-01',
    phone: '098-765-321', memberStatus: 'ปกติ', maritalStatus: 'โสด', spouseName: '-',
    alert: 'ประกันชีวิตกลุ่ม มีผลวันที่ 01/01/2569',
    payoutMode: 'multi',
    status: 'pending',
    installments: [
      { no: 1, amount: 300000, dueDate: '2026-01-01', state: 'disbursed', lines: [
        lpoLine('coop-deposit', { acct: '123456789', net: 120000, transferTotal: 0 }),
        lpoLine('bank-deposit', { acct: '123456789', fromBank: 'กรุงไทย', fromBranch: 'หลักสี่', net: 80000 }),
        lpoLine('cash', { net: 40000 }),
        lpoLine('money-order', { zip: '10900', payee: 'สมชาย ใจดี', net: 20000 }),
        lpoLine('cashier', { acct: '123456789', fromBank: 'กรุงไทย', payee: 'สมชาย ใจดี', net: 20000 }),
        lpoLine('cheque', { acct: '123456789', toBranch: 'หลักสี่', payee: 'สมชาย ใจดี', net: 10000 }),
        lpoLine('draft', { acct: '123456789', fromBank: 'กรุงไทย', fromBranch: 'หลักสี่', toBranch: 'หลักสี่', payee: 'สมชาย ใจดี', net: 10000 }),
      ] },
      { no: 'rest', amount: 600000, dueDate: '2026-04-01', state: 'pending', lines: [] },
    ],
  },
  {
    id: 'LPO-2569-000117', contractNo: 'AA100002045', reqNo: 'AA100002045',
    memberCode: '058262', memberName: 'นายกิตติ วัฒนาการ', dept: 'สำนักปลัด',
    productCode: 'พศ.02', productName: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', group: 'เงินกู้พิเศษ',
    purpose: 'ปลูกสร้างที่อยู่อาศัย',
    amount: 1500000, reqDate: '2025-12-18', payDate: '2025-12-20', collectDate: '2026-01-01',
    phone: '081-224-7781', memberStatus: 'ปกติ', maritalStatus: 'สมรส', spouseName: 'นางมาลี วัฒนาการ',
    alert: 'จ่ายด้วยเช็คขีดคร่อม — ผูกจำนองที่ดินครบถ้วน',
    payoutMode: 'multi',
    status: 'pending',
    installments: [
      { no: 1, amount: 600000, dueDate: '2025-12-20', state: 'disbursed', lines: [
        lpoLine('cheque', { acct: '0044213', toBranch: 'สีลม', payee: 'กิตติ วัฒนาการ', net: 600000 }),
      ] },
      { no: 'rest', amount: 900000, dueDate: '2026-03-20', state: 'pending', lines: [] },
    ],
  },
  {
    id: 'LPO-2569-000109', contractNo: 'AA100001988', reqNo: 'AA100001988',
    memberCode: '058251', memberName: 'นางวิภา จันทร์เพ็ญ', dept: 'กองการศึกษา',
    productCode: 'พศ.01', productName: 'เงินกู้พิเศษเพื่อการลงทุน', group: 'เงินกู้พิเศษ',
    purpose: 'ลงทุนประกอบอาชีพเสริม',
    amount: 800000, reqDate: '2025-11-30', payDate: '2025-12-02', collectDate: '2025-12-15',
    phone: '089-114-5520', memberStatus: 'ปกติ', maritalStatus: 'สมรส', spouseName: 'นายอดิศร จันทร์เพ็ญ',
    alert: 'ประกันชีวิตกลุ่ม มีผลวันที่ 01/12/2568',
    payoutMode: 'multi',
    status: 'done',
    installments: [
      { no: 1, amount: 200000, dueDate: '2025-12-02', state: 'disbursed', lines: [
        lpoLine('bank-deposit', { acct: '983-1-04821-6', fromBank: 'กรุงไทย', fromBranch: 'ราชการ', net: 200000 }),
      ] },
      { no: 'rest', amount: 600000, dueDate: '2026-02-02', state: 'disbursed', lines: [
        lpoLine('bank-deposit', { acct: '983-1-04821-6', fromBank: 'กรุงไทย', fromBranch: 'ราชการ', net: 450000 }),
        lpoLine('coop-deposit', { acct: '058251', net: 150000, transferTotal: 0 }),
      ] },
    ],
  },
];

window.lpoLineFactory = lpoLine;

// ── งวดที่เหลือ: ดึงจาก "บันทึกจ่ายเงินกู้พิเศษ" (แถว installment = 'rest') ──
//  แหล่งข้อมูล: 1) ที่บันทึกจากเมนูบันทึกจ่ายเงินกู้พิเศษ (localStorage) · 2) แผนตั้งต้น (seed)
const LPO_REST_KEY = 'lpo_special_rest_v1';
const LPO_REST_SEED = {
  'AA123456789': [
    { method: 'โอนเงินฝากสหกรณ์', accNo: '123456789', net: 400000 },
    { method: 'รอเจ้าหน้าที่เบิกจ่าย', net: 200000 },
  ],
  'AA100002045': [
    { method: 'โอนเงินฝากสหกรณ์', accNo: '058262', net: 50000 },
    { method: 'รอเจ้าหน้าที่เบิกจ่าย', net: 850000 },
  ],
};
window.lpoFromSpecialRow = (r) => {
  const m = window.LPO_PAY_METHODS.find(x => x.l === r.method);
  const n = (v) => Number(v) || 0;
  return lpoLine(m ? m.v : '', {
    acct: r.accNo || r.bankAcc || '', fromBank: r.bankFrom || '', fromBranch: r.branch || '',
    toBranch: r.branchTo || '', zip: r.postcode || '', payee: r.payer || '',
    fee: n(r.fee), service: n(r.service), tax: n(r.tax),
    transferTotal: n(r.fee) + n(r.service) + n(r.tax), net: n(r.net),
  });
};
window.lpoSaveSpecialRest = (reqNo, rows) => {
  if (!reqNo) return;
  try {
    const s = JSON.parse(localStorage.getItem(LPO_REST_KEY) || '{}');
    s[reqNo] = { rows, ts: new Date().toISOString() };
    localStorage.setItem(LPO_REST_KEY, JSON.stringify(s));
  } catch (e) {}
};
window.lpoRestPlan = (rec) => {
  let saved = null;
  try { saved = (JSON.parse(localStorage.getItem(LPO_REST_KEY) || '{}'))[rec.reqNo]; } catch (e) {}
  const rows = (saved && saved.rows && saved.rows.length) ? saved.rows : (LPO_REST_SEED[rec.reqNo] || []);
  return {
    lines: rows.map(window.lpoFromSpecialRow),
    found: rows.length > 0,
    ts: saved ? saved.ts : null,
  };
};

// ── สรุปงวดของสัญญา ─────────────────────────────────────────────────
window.lpoInstSummary = (rec) => {
  const inst = (rec && rec.installments) || [];
  const disbursed = inst.filter(i => i.state === 'disbursed');
  const pending = inst.filter(i => i.state !== 'disbursed');
  const paidAmt = disbursed.reduce((s, i) => s + Number(i.amount || 0), 0);
  return { total: inst.length, disbursedCount: disbursed.length, pendingCount: pending.length,
           paidAmt, remainAmt: Number(rec.amount || 0) - paidAmt,
           nextDue: pending[0] || null };
};

// ── ป้ายงวด: งวดที่ 1 · งวดที่เหลือ ───────────────────────────────
window.lpoInstLabel = (i) => (i && i.no === 'rest') ? 'งวดที่เหลือ' : 'งวดที่ ' + (i ? i.no : '—');

// ── งวดแรกที่ยังไม่ได้เบิก (สำหรับตั้ง "งวดที่เหลือ") ───────────────
window.lpoNextInstallment = (rec) => ((rec && rec.installments) || []).find(i => i.state !== 'disbursed') || null;

// ── สรุปยอดรวมของ lines (สำหรับ footer ตาราง) ──────────────────────
window.lpoLinesTotal = (lines) => (lines || []).reduce((t, l) => {
  t.fee += Number(l.fee || 0); t.service += Number(l.service || 0); t.tax += Number(l.tax || 0);
  t.transferTotal += Number(l.transferTotal || 0); t.net += Number(l.net || 0);
  return t;
}, { fee: 0, service: 0, tax: 0, transferTotal: 0, net: 0 });

// ════════════════════════════════════════════════════════════════════
//  Persistence (localStorage)
// ════════════════════════════════════════════════════════════════════
const LPO_LS_KEY = 'loan_payout_state_v2';
window.lpoStore = () => { try { return JSON.parse(localStorage.getItem(LPO_LS_KEY) || '{}'); } catch (e) { return {}; } };
window.lpoLoad = () => {
  const saved = window.lpoStore();
  return window.LPO_SEED.map(r => saved[r.id] ? { ...r, ...saved[r.id] } : { ...r });
};
window.lpoSave = (id, patch) => {
  const store = window.lpoStore();
  store[id] = { ...(store[id] || {}), ...patch };
  try { localStorage.setItem(LPO_LS_KEY, JSON.stringify(store)); } catch (e) {}
};
