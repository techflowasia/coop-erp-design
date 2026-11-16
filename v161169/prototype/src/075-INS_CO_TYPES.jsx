// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ › ค่าคงที่ — บริษัทประกันภัย (Insurance Company)
//  ทะเบียนบริษัท/สมาคมประกันภัยที่สหกรณ์ใช้อ้างอิงเมื่อทำประกันหรือ
//  ต่ออายุประกันต่าง ๆ ของสมาชิก (บันทึกเบี้ยประกัน · จัดการประกันภัยสมาชิก)
//  เป็นแหล่งข้อมูลกลาง — window.INSURANCE_COMPANIES (ชื่อบริษัทที่เปิดใช้งาน)
//  ถูกสร้างจากรายการนี้ ทำให้ทุก dropdown เลือกบริษัทประกันตรงกัน
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทบริษัทประกัน ──────────────────────────────────────────────
window.INS_CO_TYPES = ['ประกันชีวิต', 'ประกันวินาศภัย', 'สมาคมฌาปนกิจ', 'ประกันสินเชื่อ'];
window.INS_CO_TYPE_PILL = {
  'ประกันชีวิต':   'info',
  'ประกันวินาศภัย': 'primary',
  'สมาคมฌาปนกิจ':  'warning',
  'ประกันสินเชื่อ': 'success',
};

// ─── รายการบริษัทประกันตั้งต้น (seed) ────────────────────────────────
window.INS_CO_SEED = [
  { id: 'INSCO-01', code: 'OCEAN', name: 'บมจ. ไทยสมุทรประกันชีวิต',     insurerTypes: ['ประกันชีวิต', 'ประกันสินเชื่อ'], regNo: '0107537000114', contact: 'ฝ่ายลูกค้าสัมพันธ์', phone: '0-2207-8888', email: 'contact@ocean.co.th',   note: 'ประกันชีวิตคุ้มครองสินเชื่อกลุ่ม/รายเดี่ยว', enabled: true },
  { id: 'INSCO-02', code: 'BKI',   name: 'บมจ. กรุงเทพประกันภัย',        insurerTypes: ['ประกันวินาศภัย'], regNo: '0107537001943', contact: 'ฝ่ายรับประกันภัย',  phone: '0-2285-8888', email: 'info@bangkokinsurance.com', note: 'ประกันอัคคีภัยหลักทรัพย์ค้ำประกัน', enabled: true },
  { id: 'INSCO-03', code: 'COOP',  name: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์', insurerTypes: ['สมาคมฌาปนกิจ'], regNo: '',            contact: 'สำนักงานสมาคม',    phone: '0-2496-1200', email: '',                       note: 'ฌาปนกิจสงเคราะห์สมาชิก', enabled: true },
  { id: 'INSCO-04', code: 'TIP',   name: 'บมจ. ทิพยประกันภัย',           insurerTypes: ['ประกันวินาศภัย', 'ประกันสินเชื่อ'], regNo: '0107537000161', contact: 'ฝ่ายรับประกันภัย',  phone: '1736',        email: 'callcenter@tipinsure.com', note: 'ประกันอัคคีภัย/อุบัติเหตุส่วนบุคคล', enabled: true },
  { id: 'INSCO-05', code: 'AIA',   name: 'บมจ. เอไอเอ ประเทศไทย',        insurerTypes: ['ประกันชีวิต'], regNo: '',            contact: 'ฝ่ายประกันกลุ่ม',  phone: '1581',        email: '',                       note: '', enabled: false },
];

const INS_CO_LS = 'coop_insurance_companies_v1';

window.insCoLoad = function () {
  try {
    const saved = localStorage.getItem(INS_CO_LS);
    if (saved) return JSON.parse(saved).map(r => r.insurerTypes ? r : { ...r, insurerTypes: r.insurerType ? [r.insurerType] : [] });
  } catch (e) {}
  return (window.INS_CO_SEED || []).map(r => ({ ...r }));
};
window.insCoSave = function (list) {
  try { localStorage.setItem(INS_CO_LS, JSON.stringify(list)); } catch (e) {}
  window.insCoSyncNames(list);
};

// สร้าง window.INSURANCE_COMPANIES (ชื่อบริษัทที่เปิดใช้งาน) จากค่าคงที่ล่าสุด
//  → ทุก dropdown ที่ใช้ INSURANCE_COMPANIES จะได้รายการตรงกัน
window.insCoSyncNames = function (list) {
  const src = list || window.insCoLoad();
  window.INSURANCE_COMPANIES = src.filter(r => r.enabled !== false).map(r => r.name);
};

window.insCoByName = function (name) {
  if (!name) return null;
  return (window.insCoLoad() || []).find(r => r.name === name) || null;
};

// sync ทันทีตอนโหลดไฟล์ (ทับค่า static ใน data-insurance.js)
window.insCoSyncNames(window.insCoLoad());
