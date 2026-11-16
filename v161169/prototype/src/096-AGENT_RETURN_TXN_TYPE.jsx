// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › คืนใบเสร็จลูกหนี้ตัวแทน — ข้อมูล / helpers
//  ยกเลิก/คืนใบเสร็จรับชำระลูกหนี้ตัวแทน (ยอดยกเลิกรับชำระลูกหนี้)
//  เลือกสมาชิก → แสดงงวดเรียกเก็บที่รับชำระแล้ว → เลือกงวดที่ต้องการคืน
// ════════════════════════════════════════════════════════════════════

window.AGENT_RETURN_TXN_TYPE = 'ยอดยกเลิกรับชำระลูกหนี้';

window.AGENT_RETURN_PAY_TYPES = [
  { v: 'cash', l: 'เงินสด' },
  { v: 'cheque', l: 'เช็ค' },
  { v: 'transfer', l: 'เงินโอน' },
];
window.agReturnPayLabel = (v) => (window.AGENT_RETURN_PAY_TYPES.find(p => p.v === v) || {}).l || v;

// วันนี้ (ISO) + วันที่แบบไทย dd/mm/พ.ศ.
window.agReturnToday = () => new Date().toISOString().slice(0, 10);
window.agReturnThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};

// สังกัดตัวแทนของสมาชิก (แสดงรูปแบบ "10160:ปณ.ภาษีเจริญ")
window.agReturnAffiliation = (m) => {
  if (!m) return '';
  if (m.agentAffil) return m.agentAffil;
  return `${m.deptCode || '—'}:${m.dept || '—'}`;
};

// ── งวดเรียกเก็บที่รับชำระแล้ว และยังคืนได้ (deterministic ต่อสมาชิก) ──
//  remaining = ยอดคงเหลือที่คืนได้ของงวดนั้น
window.agReturnPeriods = (m) => {
  if (!m) return [];
  const base = Number(m.monthly) || 21015.5;
  // จำนวนงวดที่คืนได้ 1–2 งวด ตามเลขสมาชิก
  const n = (parseInt(String(m.code).replace(/\D/g, ''), 10) % 2) === 0 ? 2 : 1;
  const rows = [];
  // งวดล่าสุด เช่น 256907
  let term = 256907;
  for (let i = 0; i < n; i++) {
    const remaining = Math.round((base + (i === 0 ? 0 : -41.5)) * 100) / 100;
    rows.push({ seq: i + 1, period: String(term - i), remaining });
  }
  return rows;
};

// ── เลขที่ใบทำรายการถัดไป (AUTO) ──
window.agReturnNextId = (list) => {
  const yy = 2569;
  const max = (list || []).reduce((mx, r) => {
    const m = String(r.id).match(/RCB-\d{4}-(\d+)/);
    return m ? Math.max(mx, parseInt(m[1], 10)) : mx;
  }, 0);
  return `RCB-${yy}-${String(max + 1).padStart(5, '0')}`;
};

// ── Store (localStorage) ──────────────────────────────────────────────
window.AGENT_RETURN_SEED = [
  {
    id: 'RCB-2569-00042', receiptDate: '2569-07-18', txnDate: '2569-07-18',
    memberCode: 'M-058244', memberName: 'นางวิภา จันทร์เพ็ญ', affiliation: '0801:กองคลัง สำนักงานปลัด',
    payType: 'cash', moneyNote: 'เงินสด — คืนหน้าเคาน์เตอร์', note: 'คืนใบเสร็จจากการรับซ้ำ',
    total: 4280, periods: [{ seq: 1, period: '256907', remaining: 4280, amount: 4280 }],
    createdBy: 'นางสาวรัตนา (การเงิน)', createdAt: '18/07/69 14:22',
  },
  {
    id: 'RCB-2569-00041', receiptDate: '2569-07-15', txnDate: '2569-07-15',
    memberCode: 'M-058242', memberName: 'นางสาวกานต์ ศิริวงศ์', affiliation: '0501:กองการศึกษา',
    payType: 'transfer', moneyNote: 'โอนคืนบัญชี KTB ****4821', note: '',
    total: 8420, periods: [{ seq: 1, period: '256907', remaining: 8420, amount: 8420 }],
    createdBy: 'นางสาวรัตนา (การเงิน)', createdAt: '15/07/69 10:05',
  },
];

window.agReturnLoad = () => {
  try {
    const raw = localStorage.getItem('agent_return_receipts');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return window.AGENT_RETURN_SEED.map(r => ({ ...r }));
};
window.agReturnSave = (list) => {
  try { localStorage.setItem('agent_return_receipts', JSON.stringify(list)); } catch (e) {}
};
