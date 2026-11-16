// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ดอกเบี้ย / การปรับโครงสร้างหนี้ — ระบบงานทะเบียนและติดตามหนี้
//  รูปแบบการปรับโครงสร้างหนี้ + อัตราดอกเบี้ยและเงื่อนไขที่ใช้
// ════════════════════════════════════════════════════════════════════

// ─── วิธีปรับโครงสร้างหนี้ ───────────────────────────────────────────
window.DRC_METHODS = [
  { v: 'reduce-interest', l: 'ลดอัตราดอกเบี้ย',          desc: 'ปรับลดอัตราดอกเบี้ยตามที่กำหนด คงงวด/เงินต้นเดิม' },
  { v: 'extend-term',     l: 'ขยายระยะเวลาผ่อน',          desc: 'ขยายจำนวนงวดเพื่อลดภาระต่อเดือน' },
  { v: 'hold-principal',  l: 'พักเงินต้น',                desc: 'พักชำระเงินต้นชั่วคราว ชำระเฉพาะดอกเบี้ย' },
  { v: 'combine',         l: 'ลดดอกเบี้ย + ขยายงวด',       desc: 'ปรับลดดอกเบี้ยและขยายงวดพร้อมกัน' },
];
window.drcMethod = (v) => window.DRC_METHODS.find(m => m.v === v) || window.DRC_METHODS[0];

// ─── เมื่อผิดเงื่อนไขการปรับโครงสร้าง ───────────────────────────────
window.DRC_BREACH = [
  { v: 'revert',    l: 'กลับสู่เงื่อนไขสัญญาเดิมทันที' },
  { v: 'penalty',   l: 'คิดดอกเบี้ยผิดนัด + เรียกชำระทั้งจำนวน' },
  { v: 'legal',     l: 'ส่งดำเนินคดีตามขั้นตอน' },
];
window.drcBreach = (v) => window.DRC_BREACH.find(b => b.v === v) || window.DRC_BREACH[0];

window.DRC_SETTINGS_DEFAULTS = {
  interestRate: 5.0000,        // อัตราดอกเบี้ยหลังปรับ (% ต่อปี)
  defaultRate: 7.5000,         // อัตราดอกเบี้ยผิดนัด (% ต่อปี)
  penaltyWaivePct: 100,        // ลดค่าปรับ (%)
  maxExtendTerms: 60,          // ขยายงวดสูงสุด (งวด)
  gracePeriodMonths: 6,        // ระยะปลอดเงินต้น (เดือน)
  minPaymentPct: 50,           // ชำระขั้นต่ำ (% ของงวดเดิม)
  reviewMonths: 12,            // ทบทวนเงื่อนไขทุก (เดือน)
  breachAction: 'penalty',
  capitalizeInterest: false,   // รวมดอกเบี้ยค้างเป็นเงินต้น
  requireGuarantorConsent: true, // ต้องได้รับความยินยอมจากผู้ค้ำ
};

// ─── ทะเบียนรูปแบบการปรับโครงสร้างหนี้ (ข้อมูลสาธิต) ────────────────
window.DRC_SEED = [
  {
    id: 'DR-0001', code: 'RS-STD', name: 'ปรับโครงสร้างหนี้มาตรฐาน',
    method: 'combine', enabled: true, createdDate: '2026-01-10', createdBy: 'จันทร์เพ็ญ มาลี',
    note: 'ใช้เป็นเงื่อนไขหลักสำหรับลูกหนี้ค้างชำระทั่วไป',
    settings: { ...window.DRC_SETTINGS_DEFAULTS,
      interestRate: 5.0000, defaultRate: 7.5000, penaltyWaivePct: 100,
      maxExtendTerms: 60, gracePeriodMonths: 6, minPaymentPct: 50, reviewMonths: 12,
      breachAction: 'penalty', capitalizeInterest: true, requireGuarantorConsent: true },
  },
  {
    id: 'DR-0002', code: 'RS-SOFT', name: 'ผ่อนปรนพิเศษ (กรณีเดือดร้อนรุนแรง)',
    method: 'hold-principal', enabled: true, createdDate: '2026-02-02', createdBy: 'จันทร์เพ็ญ มาลี',
    note: 'พักเงินต้นและลดดอกเบี้ยสำหรับสมาชิกที่ได้รับผลกระทบรุนแรง',
    settings: { ...window.DRC_SETTINGS_DEFAULTS,
      interestRate: 3.5000, defaultRate: 7.5000, penaltyWaivePct: 100,
      maxExtendTerms: 84, gracePeriodMonths: 12, minPaymentPct: 0, reviewMonths: 6,
      breachAction: 'revert', capitalizeInterest: false, requireGuarantorConsent: true },
  },
  {
    id: 'DR-0003', code: 'RS-LEGAL', name: 'ปรับโครงสร้างหลังดำเนินคดี',
    method: 'extend-term', enabled: false, createdDate: '2026-03-12', createdBy: 'จันทร์เพ็ญ มาลี',
    note: 'สำหรับลูกหนี้ที่ทำสัญญาประนีประนอมยอมความ',
    settings: { ...window.DRC_SETTINGS_DEFAULTS,
      interestRate: 6.0000, defaultRate: 7.5000, penaltyWaivePct: 50,
      maxExtendTerms: 120, gracePeriodMonths: 0, minPaymentPct: 100, reviewMonths: 12,
      breachAction: 'legal', capitalizeInterest: true, requireGuarantorConsent: false },
  },
];

window.drcLoad = () => {
  try {
    const saved = localStorage.getItem('debt_restruct_config');
    if (saved) {
      const p = JSON.parse(saved);
      if (Array.isArray(p) && p.length && p.every(r => r && r.settings)) return p;
    }
  } catch (e) {}
  return window.DRC_SEED.map(r => ({ ...r, settings: { ...r.settings } }));
};
window.drcSaveLS = (list) => {
  try { localStorage.setItem('debt_restruct_config', JSON.stringify(list)); } catch (e) {}
};
window.drcNextId = (list) => {
  const max = (list || []).reduce((mx, r) => {
    const n = parseInt(String(r.id).replace(/\D/g, ''), 10);
    return !isNaN(n) && n > mx ? n : mx;
  }, 0);
  return 'DR-' + String(max + 1).padStart(4, '0');
};
