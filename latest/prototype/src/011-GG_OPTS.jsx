// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — ค่าคงที่: กำหนดวงเงินค้ำประกัน
//  จัดกลุ่มสิทธิการค้ำประกัน + รูปแบบการคำนวณสิทธิ
//  พร้อมตาราง Matrix เงื่อนไขวงเงินการค้ำแบบขั้นบันได
// ════════════════════════════════════════════════════════════════════

window.GG_OPTS = {
  calcMethod: [
    { v: '1', l: '1 - สิทธิค้ำหักในกลุ่มค้ำ' },
    { v: '2', l: '2 - สิทธิค้ำแต่ละสัญญา (ไม่หักในกลุ่ม)' },
  ],
  periodRef: [
    { v: '0', l: '0 - ไม่ดูระยะเวลาการเป็นสมาชิก' },
    { v: '1', l: '1 - อายุตามหุ้น' },
    { v: '2', l: '2 - อายุการทำงาน' },
    { v: '3', l: '3 - อายุการเป็นสมาชิกแบบวันชนวัน' },
    { v: '4', l: '4 - อายุการเป็นสมาชิกแบบงวด' },
    { v: '5', l: '5 - อายุการเป็นสมาชิกแบบงวดดูวันเรียกเก็บ' },
  ],
};
window.ggLabel = (group, value) => {
  const o = (window.GG_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value || '—');
};

window.GG_SEED = [
  {
    id: 'GG-01', code: '01', name: 'GR-วงเงินค้ำฉุกเฉิน',
    enabled: true, createdDate: '2024-09-20', createdBy: 'ประภาส ทองสุข',
    note: 'สิทธิค้ำสำหรับเงินกู้ฉุกเฉิน',
    calcMethod: '2', periodRef: '0',
    tiers: [
      { shareFrom: 0, shareTo: 9999999, monthFrom: 0, monthTo: 999, salaryFrom: 0, salaryTo: 999999, pctShare: 0, pctSalary: 0, maxAmount: 100000 },
    ],
  },
  {
    id: 'GG-02', code: '02', name: 'GR-วงเงินค้ำสามัญ',
    enabled: true, createdDate: '2024-09-22', createdBy: 'ประภาส ทองสุข',
    note: 'สิทธิค้ำสามัญ 35–60 เท่า ตามอายุสมาชิกและเงินเดือน',
    calcMethod: '2', periodRef: '4',
    tiers: [
      { shareFrom: 0, shareTo: 100000, monthFrom: 6, monthTo: 60, salaryFrom: 0, salaryTo: 30000, pctShare: 90, pctSalary: 35, maxAmount: 1500000 },
      { shareFrom: 100000, shareTo: 9999999, monthFrom: 60, monthTo: 999, salaryFrom: 30000, salaryTo: 999999, pctShare: 90, pctSalary: 60, maxAmount: 3000000 },
    ],
  },
  {
    id: 'GG-03', code: '03', name: 'GR-วงเงินค้ำสามัญปืน',
    enabled: true, createdDate: '2024-09-22', createdBy: 'ประภาส ทองสุข',
    note: '',
    calcMethod: '2', periodRef: '4',
    tiers: [
      { shareFrom: 0, shareTo: 9999999, monthFrom: 12, monthTo: 999, salaryFrom: 0, salaryTo: 999999, pctShare: 100, pctSalary: 40, maxAmount: 200000 },
    ],
  },
  {
    id: 'GG-04', code: '04', name: 'GR-วงเงินค้ำสามัญอุทกภัย',
    enabled: false, createdDate: '2024-09-28', createdBy: 'ประภาส ทองสุข',
    note: 'โครงการสิ้นสุดแล้ว — เก็บไว้เป็นค่าอ้างอิง',
    calcMethod: '1', periodRef: '0',
    tiers: [
      { shareFrom: 0, shareTo: 9999999, monthFrom: 0, monthTo: 999, salaryFrom: 0, salaryTo: 999999, pctShare: 0, pctSalary: 0, maxAmount: 200000 },
    ],
  },
];
