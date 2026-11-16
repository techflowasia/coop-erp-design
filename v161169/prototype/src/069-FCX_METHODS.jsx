// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — รับ / จ่ายเงินจากระบบอื่น (Cross-system receipt/payment)
//  รับหรือจ่ายเงินที่มีต้นทางจากระบบงานอื่น (เงินฝาก · สินเชื่อ · สวัสดิการ …)
//  โดยอ้างอิงสมาชิกและลงบัญชีรับรู้เป็นรายบรรทัด + ดึงรายการที่ถูกยกเลิก
//  จากระบบต้นทางมากลับรายการ
// ════════════════════════════════════════════════════════════════════

// ─── ทำรายการโดย (ช่องทางเงิน) — ใช้ชุดเดียวกับ รับ/จ่าย ตามประเภท ──────
window.FCX_METHODS = (window.FBT_METHODS || [
  { v: 'cash',     l: 'เงินสด' },
  { v: 'transfer', l: 'โอนเงิน' },
  { v: 'cheque',   l: 'เช็ค' },
]);
window.fcxMethodLabel = (v) => (window.FCX_METHODS.find(m => m.v === v) || {}).l || '—';

// ─── ประเภทรายการ (รับ / จ่าย) ─────────────────────────────────────
window.FCX_TXN_TYPES = [
  { v: 'receive', l: 'รายการรับ',  short: 'รับ',  tone: 'recv' },
  { v: 'pay',     l: 'รายการจ่าย', short: 'จ่าย', tone: 'pay'  },
];

// ─── ผู้ทำรายการ / สาขาปัจจุบัน (จาก Login) ────────────────────────
window.FCX_CURRENT_USER = { name: 'Chaiwat', branch: 'สำนักงานใหญ่' };

// ─── บัญชีที่ลงรายการได้ (posting) — ใช้ผังบัญชีร่วมกับ รับ/จ่าย ตามประเภท
window.fcxPostingAccounts = () =>
  (window.fbtPostingAccounts ? window.fbtPostingAccounts() : []);
window.fcxAccountName = (code) =>
  (code && window.coaAccountName ? window.coaAccountName(String(code)) : '') || '';

// ─── เลขที่ใบรายการอัตโนมัติ:  รจ.YYMM-NNNN ────────────────────────
window.fcxNextNo = (list, dateIso) => {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const stem = `รจ.${yy}${mm}-`;
  let mx = 0;
  (list || []).forEach(x => {
    if (String(x.id).startsWith(stem)) {
      const n = parseInt(String(x.id).slice(stem.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return stem + String(mx + 1).padStart(4, '0');
};

// ─── รายการที่ถูกยกเลิกจากระบบต้นทาง (รอกลับรายการที่การเงิน) ─────────
//  ผูกกับทะเบียนสมาชิก (regNo) เพื่อกรองแสดงเฉพาะของสมาชิกที่เลือก
//  row: { ref, regNo, method, txnType, item, amount, contra }
window.FCX_SOURCE_CANCEL = [
  { ref: 'DP-6907-11824', regNo: '067012', method: 'cash',     txnType: 'receive', item: 'รับฝากเงินออมทรัพย์ (ยกเลิกจากระบบเงินฝาก)', amount: 5000,  contra: '110101 · เงินสดในมือ' },
  { ref: 'LN-6907-00932', regNo: '067012', method: 'transfer', txnType: 'pay',     item: 'จ่ายเงินกู้ฉุกเฉิน (ยกเลิกจากระบบสินเชื่อ)',   amount: 20000, contra: '110111 · เงินฝากธนาคาร-ออมทรัพย์' },
  { ref: 'WF-6907-00218', regNo: '058252', method: 'cheque',   txnType: 'pay',     item: 'จ่ายเงินสงเคราะห์ (ยกเลิกจากระบบสวัสดิการ)', amount: 8000,  contra: '211001 · เจ้าหนี้เงินสงเคราะห์' },
];
window.fcxCancelByReg = (regNo) =>
  (window.FCX_SOURCE_CANCEL || []).filter(r => String(r.regNo) === String(regNo));

// ─── โหลด / บันทึก รายการที่บันทึกแล้ว ─────────────────────────────
window.fcxLoad = () => {
  try { const s = localStorage.getItem('fin_cross'); if (s) return JSON.parse(s); } catch (e) {}
  return [];
};
window.fcxSave = (l) => { try { localStorage.setItem('fin_cross', JSON.stringify(l)); } catch (e) {} };
