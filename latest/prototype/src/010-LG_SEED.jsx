// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — ค่าคงที่: วงเงินกู้กลุ่ม
//  ใช้ควบคุมยอดหนี้รวมของแต่ละกลุ่มเงินกู้ (เพดานรวมต่อสมาชิก)
//  แต่ละกลุ่ม: รหัส, ชื่อ, วงเงินกู้สูงสุด — เปิด/ปิดการใช้งานได้
// ════════════════════════════════════════════════════════════════════

window.LG_SEED = [
  { id: 'LG-01', code: 'G-EMER', name: 'G-เงินกู้ฉุกเฉิน',       maxAmount: 100000.00,  enabled: true,  createdDate: '2024-09-20', createdBy: 'ประภาส ทองสุข', note: 'รวมฉุกเฉินเงินสดและฉุกเฉินหักโอน' },
  { id: 'LG-02', code: 'G-NORM', name: 'G-เงินกู้สามัญ',         maxAmount: 3000000.00, enabled: true,  createdDate: '2024-09-20', createdBy: 'ประภาส ทองสุข', note: 'เพดานหนี้รวมกลุ่มสามัญ' },
  { id: 'LG-03', code: 'G-SPEC', name: 'G-เงินกู้พิเศษ',          maxAmount: 5000000.00, enabled: true,  createdDate: '2024-12-15', createdBy: 'ประภาส ทองสุข', note: 'ใช้หลักทรัพย์ค้ำประกัน' },
  { id: 'LG-04', code: 'G-GUN',  name: 'G-เงินกู้สามัญปืน',       maxAmount: 200000.00,  enabled: true,  createdDate: '2024-09-22', createdBy: 'ประภาส ทองสุข', note: '' },
  { id: 'LG-05', code: 'G-STAFF',name: 'G-เงินกู้พนักงาน',       maxAmount: 1500000.00, enabled: false, createdDate: '2024-09-22', createdBy: 'ประภาส ทองสุข', note: 'เฉพาะเจ้าหน้าที่สหกรณ์ — รอเปิดใช้รอบถัดไป' },
  { id: 'LG-06', code: 'G-NCTL', name: 'G-เงินกู้สามัญคุมพิเศษ',  maxAmount: 800000.00,  enabled: false, createdDate: '2024-09-28', createdBy: 'ประภาส ทองสุข', note: 'ไม่นับรวมกับสามัญ02' },
];

// ─── เชื่อมกับหน้าประเภทเงินกู้ (กลุ่มวงเงินกู้ = ค่าคงที่เดียวกัน) ───
window.LG_KEY_MAP = {
  'G-EMER': 'g-emer', 'G-NORM': 'g-normal', 'G-SPEC': 'g-special',
  'G-GUN': 'g-gun', 'G-STAFF': 'g-staff', 'G-NCTL': 'g-normal-ctl',
};
window.lgList = () => {
  try { const s = localStorage.getItem('loan_groups'); if (s) return JSON.parse(s); } catch (e) {}
  return window.LG_SEED.map(r => ({ ...r }));
};
window.lgKey = (g) => window.LG_KEY_MAP[g.code] || String(g.code || '').toLowerCase();
window.lgFind = (key) => window.lgList().find(g => window.lgKey(g) === key) || null;
// ตัวเลือกกลุ่มวงเงินกู้ — เฉพาะกลุ่มที่เปิดใช้งาน (+ ค่าที่เลือกอยู่เดิม)
window.lgOptions = (current) => {
  const opts = window.lgList().filter(g => g.enabled)
    .map(g => ({ v: window.lgKey(g), l: g.name, max: g.maxAmount }));
  if (current && !opts.some(o => o.v === current)) {
    const g = window.lgFind(current);
    opts.unshift({ v: current, l: (g ? g.name : window.lpLabel('limitGroup', current)) + (g ? ' (ปิดใช้งาน)' : ''), max: g ? g.maxAmount : 0 });
  }
  return opts;
};
