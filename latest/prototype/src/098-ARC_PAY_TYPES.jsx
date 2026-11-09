// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › รับชำระตัวแทน — ข้อมูล / helpers
//  รับชำระยอดลูกหนี้ตัวแทนรายสมาชิก (ตัวแทนนำส่งแทนสมาชิก) ตามงวดเรียกเก็บ
//  → เลือกสมาชิก → แสดงงวดที่ค้างชำระ → ระบุยอดชำระต่องวด → ออกใบเสร็จ
// ════════════════════════════════════════════════════════════════════

// ประเภทเงิน (วิธีการชำระ)
window.ARC_PAY_TYPES = [
  { v: 'cash', l: 'เงินสด' },
  { v: 'cheque', l: 'เช็ค' },
  { v: 'transfer', l: 'เงินโอน' },
];
window.arcPayLabel = (v) => (window.ARC_PAY_TYPES.find(p => p.v === v) || {}).l || v;

// รายละเอียดเงิน — บัญชี/แหล่งเงินปลายทางตามวิธีการชำระ
window.ARC_MONEY_DETAILS = {
  cash:     [{ v: 'cash-main', l: 'เงินสดในมือ — เคาน์เตอร์การเงิน' }],
  cheque:   [
    { v: 'chq-ktb', l: 'เช็คธนาคารกรุงไทย' },
    { v: 'chq-bbl', l: 'เช็คธนาคารกรุงเทพ' },
  ],
  transfer: [
    { v: 'tf-ktb', l: 'โอนเข้า KTB 980-6-xxxxx-x' },
    { v: 'tf-bbl', l: 'โอนเข้า BBL 101-4-xxxxx-x' },
  ],
};

window.arcToday = () => new Date().toISOString().slice(0, 10);
window.arcThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};
window.arcNextSlip = () => 'AGR-2569-' + String(1 + Math.floor(Math.random() * 900)).padStart(5, '0');

// ── สร้างงวดเรียกเก็บที่ค้างชำระจากยอดคงเหลือ (จำลอง — sum เท่ากับ remaining) ──
function arcInstallments(remaining, seed) {
  if (!remaining || remaining <= 0) return [];
  // บางสมาชิกค้างสะสม 2 งวด (งวดก่อน + งวดปัจจุบัน)
  if (remaining >= 4000 && seed % 3 === 0) {
    const first = Math.round(remaining * 0.4 * 100) / 100;
    return [
      { period: '256906', balance: first },
      { period: '256907', balance: Math.round((remaining - first) * 100) / 100 },
    ];
  }
  return [{ period: '256907', balance: remaining }];
}

// ── ฐานสมาชิกลูกหนี้ตัวแทน (อ้างอิงยอดจาก AGP_ROWS ให้สอดคล้องทั้งระบบ) ──
window.ARC_MEMBERS = (window.AGP_ROWS || []).map(r => {
  const seed = parseInt(r.reg, 10) || 0;
  return {
    code: r.reg,
    name: r.name,
    dept: r.memberDept,
    deptCode: r.memberDept.split(':')[0],
    agentCode: r.agentCode,
    agentName: r.agentName,
    // ยอดเงินรอคืน — เงินที่ตัวแทนนำส่งเกิน/รอคืนให้สมาชิก (จำลอง)
    pendingRefund: seed % 4 === 0 ? Math.round((150 + (seed % 7) * 55) * 100) / 100 : 0,
    installments: arcInstallments(r.remaining, seed),
  };
});
window.arcMember = (code) => (window.ARC_MEMBERS || []).find(m => m.code === code) || null;
window.arcSearch = (source, c) => window.msSearchMembers(source || window.ARC_MEMBERS, c);

// ── ทะเบียนใบเสร็จรับชำระตัวแทน (persist) ──
window.ARC_LS_KEY = 'coop_agent_receive_v1';
window.arcLoad = function () {
  try { const raw = localStorage.getItem(window.ARC_LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return [];
};
window.arcSave = function (list) { try { localStorage.setItem(window.ARC_LS_KEY, JSON.stringify(list)); } catch (e) {} };
