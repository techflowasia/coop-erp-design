// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ทำรายการรับชำระหุ้นพูนทวี — ข้อมูล / helpers
//  ดึงยอดเรียกเก็บหุ้นพูนทวีที่ตัวแทน (หน่วยงานต้นสังกัด) นำส่งแทนสมาชิก
//  ตามงวด แล้วบันทึกรับชำระเข้าระบบ
// ════════════════════════════════════════════════════════════════════

window.AGP_MONTHS = [
  { v: '01', l: 'มกราคม' }, { v: '02', l: 'กุมภาพันธ์' }, { v: '03', l: 'มีนาคม' },
  { v: '04', l: 'เมษายน' }, { v: '05', l: 'พฤษภาคม' }, { v: '06', l: 'มิถุนายน' },
  { v: '07', l: 'กรกฎาคม' }, { v: '08', l: 'สิงหาคม' }, { v: '09', l: 'กันยายน' },
  { v: '10', l: 'ตุลาคม' }, { v: '11', l: 'พฤศจิกายน' }, { v: '12', l: 'ธันวาคม' },
];

window.AGP_PAY_TYPES = [
  { v: 'cash', l: 'เงินสด' },
  { v: 'cheque', l: 'เช็ค' },
  { v: 'transfer', l: 'เงินโอน' },
];
window.agpPayLabel = (v) => (window.AGP_PAY_TYPES.find(p => p.v === v) || {}).l || v;

window.agpToday = () => new Date().toISOString().slice(0, 10);
window.agpThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};

// ── ยอดเรียกเก็บหุ้นพูนทวีของตัวแทนต่อสมาชิก (จำลอง) ────────────────
//  agentCode/agentName = สังกัดตัวแทน · agentAmt = ยอดตัวแทน (เรียกเก็บ)
//  remaining = ยอดคงเหลือที่ต้องรับชำระ
window.AGP_ROWS = [
  { reg: '050000', name: 'นายวิวัฒน์  จงรุ่งสำราญ',  memberDept: '10160:ปณ.ภาษีเจริญ',        agentCode: '0107', agentName: 'ปณท.',   agentAmt: 21015.50, remaining: 21015.50 },
  { reg: '033831', name: 'น.ส.ประภาศรี  กาญจนารมย์', memberDept: '10110:ปณ.ราชดำเนิน',        agentCode: '0107', agentName: 'ปณท.',   agentAmt: 5000.00,  remaining: 5000.00 },
  { reg: '019660', name: 'นายอดุลย์  ทับมาโนช',       memberDept: '10200:กสท.สำนักงานใหญ่',   agentCode: '0108', agentName: 'กสท.',   agentAmt: 3000.00,  remaining: 3000.00 },
  { reg: '036571', name: 'นางราณี  นามวงศ์',          memberDept: '10200:กสท.สำนักงานใหญ่',   agentCode: '0108', agentName: 'กสท.',   agentAmt: 4500.00,  remaining: 4500.00 },
  { reg: '035815', name: 'นายกิตติพัฒน์  ประดาศักดิ์', memberDept: '10160:ปณ.ภาษีเจริญ',       agentCode: '0107', agentName: 'ปณท.',   agentAmt: 5000.00,  remaining: 2500.00 },
  { reg: '040638', name: 'น.ส.สุมารีย์  จันทร์เศรษฐี',  memberDept: '10310:ปณ.บางรัก',          agentCode: '0107', agentName: 'ปณท.',   agentAmt: 1000.00,  remaining: 1000.00 },
  { reg: '048726', name: 'น.ส.อลิสา  ศิลพงษ์',         memberDept: '10500:สอ.กสท.',            agentCode: '0102', agentName: 'สอ.กสท.', agentAmt: 2000.00,  remaining: 2000.00 },
  { reg: '039444', name: 'นายพิเชษฐ์  ลายคราม',        memberDept: '10200:กสท.สำนักงานใหญ่',   agentCode: '0108', agentName: 'กสท.',   agentAmt: 900.00,   remaining: 900.00 },
  { reg: '026912', name: 'นายพิเชฐ  ตันติวรถาวร',      memberDept: '10120:กทช.',               agentCode: '0106', agentName: 'กทช.',   agentAmt: 600.00,   remaining: 600.00 },
  { reg: '041414', name: 'นางพจนีย์  เมฆประยูรทอง',   memberDept: '10160:ปณ.ภาษีเจริญ',       agentCode: '0107', agentName: 'ปณท.',   agentAmt: 1000.00,  remaining: 1000.00 },
];

// กรองตามช่วงรหัสสังกัดตัวแทน เช่น "0107" หรือ "0106 - 0108"
window.agpInRange = (code, spec) => {
  const c = parseInt(code, 10);
  return String(spec).split(',').some(part => {
    const seg = part.trim();
    if (!seg) return false;
    const m = seg.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) return c >= parseInt(m[1], 10) && c <= parseInt(m[2], 10);
    return parseInt(seg, 10) === c;
  });
};

window.agpPull = (rangeMode, rangeText) =>
  window.AGP_ROWS.filter(r => rangeMode === 'all' || window.agpInRange(r.agentCode, rangeText))
    .map((r, i) => ({ seq: i + 1, ...r }));

// เลขที่ใบทำรายการถัดไป (AUTO)
window.agpNextSlip = () => `PB-2569-${String(1 + Math.floor(Math.random() * 900)).padStart(5, '0')}`;
