// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ "โครงการพักชำระหนี้" — ระบบงานทะเบียนและติดตามหนี้ › ค่าคงที่
//  กำหนดรายละเอียดโครงการ · ช่วงเวลาโครงการ · เงื่อนไขการเข้าร่วม
//  ใช้โดยหน้า "ใบคำขอพักชำระหนี้" (เลือกโครงการก่อนบันทึก)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทโครงการ ──────────────────────────────────────────────────
window.DSP_TYPES = [
  { v: 'general',      l: 'พักชำระทั่วไป',
    desc: 'พักชำระหนี้ตามมติคณะกรรมการ/ภาวะวิกฤติ — คำนวณความสามารถในการชำระตามปกติ' },
  { v: 'debt-mgmt',    l: 'โครงการบริหารจัดการหนี้',
    desc: '1 สัญญาใช้สิทธิได้เพียง 1 ครั้งตลอดอายุสัญญา · เข้าร่วมแล้วงดกู้ทุกประเภท · รายได้คงเหลือต้องไม่ติดลบจึงบันทึกได้' },
  { v: 'guarantor-r',  l: 'พักชำระสัญญาแปลงหนี้ผู้ค้ำ (สัญญา R)',
    desc: 'เฉพาะสัญญา R (ผู้ค้ำรับโอนหนี้มาเป็นของตน) — บันทึกได้ทันที ไม่ต้องคำนวณ พักได้ทุกสัญญาที่เป็น R' },
];
window.dspType = (v) => window.DSP_TYPES.find(t => t.v === v) || window.DSP_TYPES[0];

// ─── รูปแบบการชำระระหว่างพัก (อ้างอิงรายละเอียดสัญญา) ───────────────
window.DSP_PAY_BASIS = [
  { v: 'as-contract', l: 'ตามรายละเอียดสัญญา (คงต้น/คงยอด)' },
  { v: 'fixed-principal', l: 'คงต้น (Constant Principal)' },
  { v: 'fixed-balance',   l: 'คงยอด (Constant Balance)' },
];
window.dspPayBasis = (v) => window.DSP_PAY_BASIS.find(p => p.v === v) || window.DSP_PAY_BASIS[0];

// ─── โหลด / บันทึก localStorage ─────────────────────────────────────
window.dspLoad = () => {
  try {
    const saved = localStorage.getItem('suspension_projects');
    if (saved) {
      const p = JSON.parse(saved);
      if (Array.isArray(p) && p.length && p.every(r => r && r.settings)) return p;
    }
  } catch (e) {}
  return window.DSP_SEED.map(r => ({ ...r, settings: { ...r.settings } }));
};
window.dspSaveLS = (list) => {
  try { localStorage.setItem('suspension_projects', JSON.stringify(list)); } catch (e) {}
};

// โครงการที่เปิดบังคับใช้และยังอยู่ในช่วงเวลา (สำหรับ dropdown ในใบคำขอ)
window.dspActive = (list, isoDate) => {
  const d = isoDate || new Date().toISOString().slice(0, 10);
  return (list || []).filter(p => p.enabled &&
    (!p.settings.startDate || p.settings.startDate <= d) &&
    (!p.settings.endDate   || p.settings.endDate   >= d));
};

// ─── ค่าตั้งต้นของ settings ──────────────────────────────────────────
window.DSP_SETTINGS_DEFAULTS = {
  description: '',
  startDate: '',
  endDate: '',
  payBasis: 'as-contract',
  maxMonths: 12,
  // เงื่อนไขการเข้าร่วม
  requireSufficientIncome: true,   // รายได้คงเหลือหลังเข้าโครงการต้องเพียงพอต่อการผ่อนชำระ
  requireNonNegativeBalance: false, // ยอดเงินเดือนคงเหลือต้องไม่ติดลบจึงบันทึกได้
  oncePerContract: false,          // 1 สัญญาใช้สิทธิได้ 1 ครั้งตลอดอายุสัญญา
  banNewLoans: false,              // เข้าร่วมแล้วงดกู้ทุกประเภท
  skipCalculation: false,          // ไม่ต้องคำนวณ — บันทึกได้ทันที (สัญญา R)
  oneContractAtATime: true,        // ใช้สิทธิได้ครั้งละ 1 สัญญา
};

// ─── ข้อมูลสาธิต (ทะเบียนโครงการพักชำระหนี้) ───────────────────────
window.DSP_SEED = [
  {
    id: 'DSP-0001', code: 'PMT-GEN', name: 'โครงการพักชำระหนี้ช่วยเหลือสมาชิก ปี 2569',
    type: 'general', createdDate: '2026-01-08', createdBy: 'จันทร์เพ็ญ มาลี',
    enabled: true,
    note: 'พักชำระตามมติที่ประชุมคณะกรรมการดำเนินการ ครั้งที่ 1/2569',
    settings: {
      description: 'ช่วยเหลือสมาชิกที่ได้รับผลกระทบทางเศรษฐกิจ พักชำระเงินต้น/ดอกเบี้ยตามเงื่อนไข — ' +
                   'พิจารณาความสามารถในการชำระจากรายได้คงเหลือของสมาชิก',
      startDate: '2026-01-01', endDate: '2026-12-31',
      payBasis: 'as-contract', maxMonths: 12,
      requireSufficientIncome: true, requireNonNegativeBalance: false,
      oncePerContract: false, banNewLoans: false, skipCalculation: false, oneContractAtATime: true,
    },
  },
  {
    id: 'DSP-0002', code: 'PMT-DMP', name: 'โครงการบริหารจัดการหนี้ ปี 2569',
    type: 'debt-mgmt', createdDate: '2026-02-14', createdBy: 'จันทร์เพ็ญ มาลี',
    enabled: true,
    note: '1 สัญญาใช้สิทธิได้ 1 ครั้งตลอดอายุสัญญา · เข้าร่วมแล้วงดกู้ทุกประเภท',
    settings: {
      description: 'ปรับลดภาระการผ่อนชำระให้สมาชิกที่มีหนี้สูง โดยพักชำระและจัดตารางใหม่ — ' +
                   'รายได้คงเหลือหลังเข้าโครงการต้องไม่ติดลบ และต้องเพียงพอต่อการผ่อนชำระ',
      startDate: '2026-02-01', endDate: '2026-12-31',
      payBasis: 'as-contract', maxMonths: 24,
      requireSufficientIncome: true, requireNonNegativeBalance: true,
      oncePerContract: true, banNewLoans: true, skipCalculation: false, oneContractAtATime: true,
    },
  },
  {
    id: 'DSP-0003', code: 'PMT-R', name: 'พักชำระสัญญาแปลงหนี้ผู้ค้ำ (สัญญา R)',
    type: 'guarantor-r', createdDate: '2026-01-08', createdBy: 'จันทร์เพ็ญ มาลี',
    enabled: true,
    note: 'เฉพาะสัญญา R — บันทึกได้ทันที ไม่ต้องคำนวณ',
    settings: {
      description: 'รองรับผู้ค้ำที่รับโอนหนี้มาเป็นของตน (สัญญา R) — ไม่ต้องคำนวณความสามารถในการชำระ ' +
                   'บันทึกพักชำระได้ทันที และพักได้ทุกสัญญาที่เป็น R',
      startDate: '2026-01-01', endDate: '',
      payBasis: 'as-contract', maxMonths: 12,
      requireSufficientIncome: false, requireNonNegativeBalance: false,
      oncePerContract: false, banNewLoans: false, skipCalculation: true, oneContractAtATime: false,
    },
  },
];

// ─── เลข id ใหม่ ─────────────────────────────────────────────────────
window.dspNextId = (list) => {
  const max = (list || []).reduce((mx, r) => {
    const n = parseInt(String(r.id).replace(/\D/g, ''), 10);
    return !isNaN(n) && n > mx ? n : mx;
  }, 0);
  return 'DSP-' + String(max + 1).padStart(4, '0');
};
