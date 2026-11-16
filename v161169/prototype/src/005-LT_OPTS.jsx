// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — ค่าคงที่: ข้อกำหนดสินเชื่อ
//  เก็บการกำหนดเป็น "รายการ" (เวอร์ชัน) แต่ละรายการมีชื่อ, วันที่สร้าง,
//  วันที่มีผลบังคับใช้ และสถานะการบังคับใช้ (เปิดได้ครั้งละ 1 รายการ)
//  รายการลบไม่ได้ — ทำได้เพียงเปิด/ปิดการบังคับใช้
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก Dropdown ของแต่ละฟิลด์ ────────────────────────────────
window.LT_OPTS = {
  yearMode: [
    { v: 'calendar', l: 'ปีปฏิทิน (ม.ค.–ธ.ค.)' },
    { v: 'fiscal',   l: 'ปีบัญชี (ต.ค.–ก.ย.)' },
  ],
  monthMode: [
    { v: 'calendar', l: 'เดือนปฏิทิน' },
    { v: 'fiscal',   l: 'เดือนบัญชี' },
  ],
  rateView: [
    { v: 'yesterday', l: 'ดูอัตราเมื่อวาน (มาตรฐาน)' },
    { v: 'today',     l: 'ดูอัตราวันนี้' },
  ],
  payoffAdjust: [
    { v: 'none',   l: 'ไม่ปรับจำนวนวัน' },
    { v: 'plus1',  l: 'เพิ่ม 1 วัน' },
    { v: 'minus1', l: 'ลด 1 วัน' },
  ],
  decimal4: [
    { v: 'round', l: 'ปัด 5/4' },
    { v: 'down',  l: 'ปัดทิ้ง' },
    { v: 'up',    l: 'ปัดขึ้น' },
  ],
  satang: [
    { v: 'none',            l: 'ไม่ปัด (เก็บตามจริง)' },
    { v: 'roundup-salueng', l: 'ปัดขึ้นทีละสลึง' },
    { v: 'roundup-baht',    l: 'ปัดขึ้นทีละบาท' },
    { v: 'round-salueng',   l: 'ปัด 5/4 ทีละสลึง' },
  ],
  multiLayer: [
    { v: 'each',         l: 'ปัดทุกขั้นที่คำนวณได้' },
    { v: 'sumthenround', l: 'รวมทุกชั้นก่อนแล้วค่อยปัด' },
  ],
  debtSplit: [
    { v: 'equal',   l: 'แบ่งเท่ากันทุกผู้ค้ำ' },
    { v: 'byratio', l: 'แบ่งตามสัดส่วนวงเงินค้ำ' },
    { v: 'manual',  l: 'ระบุยอดเอง' },
  ],
  transferContractNo: [
    { v: 'new',    l: 'ออกเลขสัญญารับโอนใหม่' },
    { v: 'keep',   l: 'ใช้เลขสัญญาเดิม' },
    { v: 'suffix', l: 'เลขเดิม + ลำดับผู้ค้ำ' },
  ],
  interestOverMonth: [
    { v: 'keep',   l: 'คงต้นของเดือนนั้นไว้' },
    { v: 'reduce', l: 'ลดต้นของเดือนนั้นเอง' },
  ],
  fixedEstimate: [
    { v: 'avg1month', l: 'ดอกเบี้ยเฉลี่ย 1 เดือน' },
    { v: 'days30',    l: 'ดอกเบี้ย 30 วัน' },
  ],
  prepay: [
    { v: 'no',  l: 'ไม่คิดดอกเบี้ยล่วงหน้า' },
    { v: 'yes', l: 'คิดดอกเบี้ยล่วงหน้า' },
  ],
  refund: [
    { v: 'all',                l: 'คืนทุกกรณี' },
    { v: 'whenCollectGreater', l: 'เมื่อยอดเรียกเก็บมากกว่า' },
    { v: 'whenPayGreater',     l: 'เมื่อยอดชำระมากกว่า' },
  ],
};

// แปลงค่า → label สำหรับแสดงผลในโหมดดู
window.ltLabel = (group, value) => {
  const o = (window.LT_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value || '—');
};

// ─── ค่าตั้งต้น (ใช้เมื่อสร้างรายการใหม่จากค่าเริ่มต้น) ───────────────
window.LT_SETTINGS_DEFAULTS = {
  // เพดานการกู้ยืมสูงสุด
  maxLoanAmount: 5000000.00,
  // รูปแบบเลขสัญญา
  contractYearMode: 'fiscal',
  contractMonthMode: 'fiscal',
  contractPattern: 'PP-YY-RRRRR',
  // การนับวันการคิดดอกเบี้ย
  daysInYear: 365,
  rateViewMode: 'yesterday',
  firstInstallmentAdjust: 0,
  payoffAdjust: 'none',
  // รูปแบบการปัดเศษดอกเบี้ย
  decimal4Rounding: 'round',
  satangRounding: 'roundup-salueng',
  satangTable: '',                 // disabled — เปิดเมื่อเลือกเงื่อนไขเฉพาะ
  multiLayerRounding: 'each',
  decimalDigits: 7,
  // การค้ำประกัน
  guarLimitContractOn: true,
  guarLimitContractValue: 5,
  guarLimitPersonOn: true,
  guarLimitPersonValue: 99,
  // การโอนสัญญาให้ผู้ค้ำ
  transferSeparateReceipt: false,
  transferDebtSplit: 'equal',
  transferContractNoMode: 'new',
  transferReferLoanType: 'อ้างอิงประเภทเงินกู้เดิมของลูกหนี้', // disabled
  // การชำระแบบคงยอด — งวดแรก
  firstInterestOverMonth: 'keep',
  firstNegativeAdjust: 'ปรับต้นเป็นศูนย์',  // disabled
  // การชำระแบบคงยอด — งวดถัดไป
  nextInterestOverMonth: 'reduce',
  nextNegativeAdjust: 'ปรับต้นเป็นศูนย์',    // disabled
  fixedEstimateMode: 'avg1month',
  // อื่นๆ
  prepayAfterNew: 'no',
  refundProcessing: 'all',
};

// ─── รายการตัวอย่าง (master list) ────────────────────────────────────
// เปิดบังคับใช้ได้เพียง 1 รายการ — ที่เหลือเป็นเวอร์ชันร่าง/ประวัติ
window.LT_SEED = [
  {
    id: 'LT-2569',
    name: 'ข้อกำหนดสินเชื่อ ปีบัญชี 2569',
    createdDate: '2025-09-18',
    effectiveDate: '2025-10-01',
    enabled: true,
    createdBy: 'จันทร์เพ็ญ มาลี',
    note: 'ปรับเพดานเงินกู้สามัญและวิธีปัดเศษสตางค์ตามมติ คกก. ชุดที่ 28',
    settings: {
      ...window.LT_SETTINGS_DEFAULTS,
      maxLoanAmount: 6000000.00,
      contractPattern: 'PP-YY-RRRRR',
      daysInYear: 365,
      guarLimitPersonValue: 99,
    },
  },
  {
    id: 'LT-2570',
    name: 'ข้อกำหนดสินเชื่อ ปีบัญชี 2570 (ร่าง)',
    createdDate: '2026-05-20',
    effectiveDate: '2026-10-01',
    enabled: false,
    createdBy: 'จันทร์เพ็ญ มาลี',
    note: 'ร่างเตรียมบังคับใช้ปีบัญชีถัดไป — รอมติที่ประชุม',
    settings: {
      ...window.LT_SETTINGS_DEFAULTS,
      maxLoanAmount: 6500000.00,
      decimal4Rounding: 'up',
      satangRounding: 'roundup-baht',
      decimalDigits: 7,
    },
  },
  {
    id: 'LT-2568',
    name: 'ข้อกำหนดสินเชื่อ ปีบัญชี 2568',
    createdDate: '2024-09-15',
    effectiveDate: '2024-10-01',
    enabled: false,
    createdBy: 'ประภาส ทองสุข',
    note: 'เวอร์ชันก่อนหน้า — เก็บไว้เป็นประวัติ',
    settings: {
      ...window.LT_SETTINGS_DEFAULTS,
      maxLoanAmount: 5000000.00,
      contractPattern: 'PP-YY-RRRR',
      multiLayerRounding: 'sumthenround',
    },
  },
];
