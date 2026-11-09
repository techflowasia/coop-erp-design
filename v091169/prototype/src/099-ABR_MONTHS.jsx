// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › รับชำระแบบกลุ่ม — ข้อมูล / helpers
//  ดึงรายการลูกหนี้ตัวแทนตามเงื่อนไข (ปี/เดือน/ช่วงสังกัด) เป็นชุด →
//  เลือกราย → นำเข้าเป็นรายการที่จะรับชำระ → ระบุยอดชำระ → บันทึกรับชำระเป็นกลุ่ม
// ════════════════════════════════════════════════════════════════════

// เดือน / ประเภทเงิน — ใช้ร่วมกับหน้าอื่นในระบบลูกหนี้ตัวแทน
window.ABR_MONTHS = window.AGP_MONTHS || [
  { v: '01', l: 'มกราคม' }, { v: '02', l: 'กุมภาพันธ์' }, { v: '03', l: 'มีนาคม' },
  { v: '04', l: 'เมษายน' }, { v: '05', l: 'พฤษภาคม' }, { v: '06', l: 'มิถุนายน' },
  { v: '07', l: 'กรกฎาคม' }, { v: '08', l: 'สิงหาคม' }, { v: '09', l: 'กันยายน' },
  { v: '10', l: 'ตุลาคม' }, { v: '11', l: 'พฤศจิกายน' }, { v: '12', l: 'ธันวาคม' },
];

window.ABR_PAY_TYPES = [
  { v: '', l: '— เลือกประเภทเงิน —' },
  { v: 'cash', l: 'เงินสด' },
  { v: 'cheque', l: 'เช็ค' },
  { v: 'transfer', l: 'เงินโอน' },
];
window.abrPayLabel = (v) => (window.ABR_PAY_TYPES.find(p => p.v === v) || {}).l || v;

window.abrToday = () => new Date().toISOString().slice(0, 10);
window.abrThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};
window.abrNextSlip = () => 'AGB-2569-' + String(1 + Math.floor(Math.random() * 900)).padStart(5, '0');

// สังกัดสมาชิก (รหัสหน่วยหักเงิน) — จำลองจาก seed ทะเบียน
function abrMemberDeptCode(reg) {
  return (parseInt(reg, 10) % 2 === 0) ? '00100' : '00111';
}

// ── รายการลูกหนี้ตัวแทนสำหรับรับชำระแบบกลุ่ม (จำลอง อ้างอิงยอดจาก AGP_ROWS) ──
//  memberDeptCode = สังกัดสมาชิก · agentDeptCode = สังกัดตัวแทน
//  agentAmt = ยอดตัวแทน (เรียกเก็บ) · remaining = ยอดคงเหลือ
window.ABR_ROWS = (window.AGP_ROWS || []).map(r => ({
  reg: r.reg,
  name: r.name,
  memberDeptCode: abrMemberDeptCode(r.reg),
  agentDeptCode: '0101',
  agentAmt: r.agentAmt,
  remaining: r.remaining,
}));

// กรองตามช่วงรหัสสังกัดสมาชิก เช่น "110, 120, 140 - 150"
window.abrInRange = (code, spec) => {
  const c = parseInt(code, 10);
  return String(spec).split(',').some(part => {
    const seg = part.trim();
    if (!seg) return false;
    const m = seg.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) return c >= parseInt(m[1], 10) && c <= parseInt(m[2], 10);
    return parseInt(seg, 10) === c;
  });
};

window.abrPull = (rangeMode, rangeText) =>
  window.ABR_ROWS
    .filter(r => rangeMode === 'all' || window.abrInRange(r.memberDeptCode, rangeText))
    .map((r, i) => ({ seq: i + 1, ...r }));
