// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — ค่าคงที่: กำหนดจำนวนคนค้ำประกัน
//  แต่ละผลิตภัณฑ์ (ประเภทเงินกู้) ผูกกับ "กลุ่มนับค้ำ" หนึ่งกลุ่ม
//  กลุ่มนับค้ำ = รหัส + ชื่อ + ตารางจำนวนคนค้ำแยกตามประเภทสมาชิก/ช่วงสมาชิก
// ════════════════════════════════════════════════════════════════════

window.GC_MEMBER_TYPES = [
  { v: 'regular', l: 'สมาชิกสามัญ' },
  { v: 'associate-staff', l: 'สมาชิกสมทบ (พนักงาน)' },
  { v: 'associate-kin', l: 'สมาชิกสมทบ (เครือญาติ)' },
];
window.gcMemberTypeLabel = (v) => (window.GC_MEMBER_TYPES.find(x => x.v === v) || {}).l || v;

const gcRow = (type, count, ins1, ins2, extra) => ({
  memberType: type, memberFrom: '000000', memberTo: '999999',
  useNormal: true, normalCount: count, insurance1: ins1, insurance2: ins2, extraFund: extra,
});

window.GC_GROUP_SEED = [
  {
    id: 'GC-01', code: '4Y', name: 'GM-จำนวนคนค้ำสามัญผสมประกัน 6 คน',
    note: 'ใช้กับเงินกู้สามัญที่มีประกันชีวิต/ประกันหนี้',
    rows: [gcRow('regular', 4, 2, 0, 0), gcRow('associate-staff', 4, 2, 0, 0)],
  },
  {
    id: 'GC-02', code: '2N', name: 'GM-จำนวนคนค้ำสามัญ 2 คน',
    note: 'กลุ่มมาตรฐานสำหรับเงินกู้สามัญวงเงินไม่สูง',
    rows: [gcRow('regular', 2, 1, 0, 0), gcRow('associate-staff', 3, 1, 0, 0)],
  },
  {
    id: 'GC-03', code: '0X', name: 'GM-ไม่ต้องมีคนค้ำ',
    note: 'เงินกู้ฉุกเฉิน / เงินกู้ที่ใช้หลักทรัพย์ค้ำ',
    rows: [gcRow('regular', 0, 0, 0, 0)],
  },
];

// ผลิตภัณฑ์ → กลุ่มนับค้ำ (ค่าตั้งต้น; อ้างด้วยรหัสผลิตภัณฑ์)
window.GC_PRODUCT_MAP_SEED = {
  'LP-20': 'GC-01', 'LP-30': 'GC-02', 'LP-40': 'GC-02', 'LP-10': 'GC-03', 'LP-50': 'GC-03',
};
