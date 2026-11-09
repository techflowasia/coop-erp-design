// ═════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ › ค่าคงที่ — วัตถุประสงค์การกู้
//  กำหนดวัตถุประสงค์การกู้ที่ใช้ในใบคำขอกู้เงิน
//  taxCert = วัตถุประสงค์นี้ออกหนังสือรับรองดอกเบี้ย (ลดหย่อนภาษี) ได้
//            → ต้องระบุรายละเอียดวัตถุประสงค์ (details) อย่างน้อย 1 รายการ
// ═════════════════════════════════════════════════════════════════════

window.LOAN_PURPOSE_CONST_SEED = [
  { id: 'LPU-01', code: '01', v: 'family', name: 'ใช้จ่ายในครอบครัวและส่วนตัว',
    taxCert: false, details: [], note: '', enabled: true,
    createdDate: '2566-01-05', createdBy: 'ระบบ (ค่าตั้งต้น)' },
  { id: 'LPU-02', code: '02', v: 'edu', name: 'เพื่อการศึกษา',
    taxCert: false, details: [], note: '', enabled: true,
    createdDate: '2566-01-05', createdBy: 'ระบบ (ค่าตั้งต้น)' },
  { id: 'LPU-03', code: '03', v: 'house', name: 'เพื่อที่อยู่อาศัย',
    taxCert: true, taxLaw: 'ประกาศอธิบดีกรมสรรพากร ฯ (ฉบับที่ 165)', note: 'ดอกเบี้ยใช้สิทธิลดหย่อนได้ตามจำนวนที่จ่ายจริง ไม่เกิน 100,000 บาท/ปีภาษี',
    details: [
      'ซื้ออาคาร',
      'ซื้ออาคารพร้อมที่ดิน',
      'ซื้อห้องชุดในอาคารชุด',
      'ซื้อที่ดินพร้อมปลูกสร้างบ้าน',
      'ปลูกสร้างอาคารบนที่ดินของตนเอง',
      'ปลูกสร้างอาคารบนที่ดินเช่า',
      'เช่าซื้ออาคารพร้อมที่ดิน',
      'เช่าซื้อห้องชุดในอาคารชุด',
      'ซ่อมแซม ปรับปรุง ต่อเติม บ้านพักอาศัย',
    ], enabled: true, createdDate: '2566-01-05', createdBy: 'ระบบ (ค่าตั้งต้น)' },
  { id: 'LPU-04', code: '04', v: 'redeem', name: 'ไถ่ถอนจำนองจากสถาบันการเงิน',
    taxCert: true, taxLaw: 'ประกาศอธิบดีกรมสรรพากร ฯ (ฉบับที่ 165)', note: 'ไถ่ถอนเฉพาะส่วนที่เป็นที่อยู่อาศัยของผู้กู้',
    details: [
      'ไถ่ถอนจำนองที่ดินพร้อมบ้านพักอาศัย',
      'ไถ่ถอนจำนองห้องชุดในอาคารชุด',
      'ไถ่ถอนขายฝากที่ดินพร้อมบ้านพักอาศัย',
      'ไถ่ถอนจำนองและปรับปรุงบ้านพักอาศัย',
      'ไถ่ถอนจำนองที่ดินพร้อมบ้านพักอาศัยเฉพาะส่วน',
    ], enabled: true, createdDate: '2566-01-05', createdBy: 'ระบบ (ค่าตั้งต้น)' },
  { id: 'LPU-05', code: '05', v: 'debt', name: 'เพื่อรวมหนี้',
    taxCert: false, details: [], note: '', enabled: true,
    createdDate: '2566-01-05', createdBy: 'ระบบ (ค่าตั้งต้น)' },
  { id: 'LPU-06', code: '06', v: 'biz', name: 'เพื่อการประกอบอาชีพ',
    taxCert: false, details: [], note: '', enabled: true,
    createdDate: '2566-01-05', createdBy: 'ระบบ (ค่าตั้งต้น)' },
  { id: 'LPU-07', code: '07', v: 'vehicle', name: 'เพื่อยานพาหนะ',
    taxCert: false, details: [], note: '', enabled: false,
    createdDate: '2567-03-11', createdBy: 'สมหญิง ก.' },
];

const _LPU_KEY = 'loan_purpose_const';
window.lpuLoad = function () {
  try { const s = localStorage.getItem(_LPU_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.LOAN_PURPOSE_CONST_SEED));
};
window.lpuSave = function (list) {
  try { localStorage.setItem(_LPU_KEY, JSON.stringify(list)); } catch (e) {}
};

// ตัวเลือกสำหรับ Listbox ในใบคำขอกู้ (เฉพาะที่เปิดใช้งาน)
window.lpuOptions = function () {
  return window.lpuLoad().filter(r => r.enabled)
    .map(r => ({ v: r.v, l: r.name, taxCert: !!r.taxCert, details: r.details || [] }));
};
window.lpuFind = function (v) {
  return window.lpuOptions().find(o => o.v === v) || null;
};
