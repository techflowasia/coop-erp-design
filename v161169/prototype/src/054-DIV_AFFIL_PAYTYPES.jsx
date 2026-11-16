// ═════════════════════════════════════════════════════════════════
//  ระบบทะเบียนและติดตามหนี้ › ค่าคงที่ — สังกัดปันผลเฉลี่ยคืน
//  ค่าคงที่กลุ่ม/หน่วยงานของสมาชิกที่ใช้ในการคำนวณและจ่ายปันผลเฉลี่ยคืน
//  ฟิลด์: รหัสสังกัด · รายละเอียด · รหัสคุมสังกัด · ประเภทการจ่าย · สถานะ
// ═════════════════════════════════════════════════════════════════

// ─── ประเภทการจ่าย (ประเภทรายการ) ───────────────────────────────────
window.DIV_AFFIL_PAYTYPES = [
  { v: 'CSH', l: 'เงินสด',   chip: 'success' },
  { v: 'TNA', l: 'ธนาณัติ',  chip: 'info' },
];
window.divAffilPayType = (v) =>
  window.DIV_AFFIL_PAYTYPES.find(o => o.v === v) || { v, l: v, chip: 'neutral' };

// ─── รหัสคุมสังกัด (กลุ่มควบคุม) ─────────────────────────────────────
window.DIV_AFFIL_CTRL = [
  { v: '00', l: 'ไม่ทราบสังกัด' },
  { v: '13', l: 'กลุ่มตรวจสอบ / หน่วยงานภายใน' },
  { v: '16', l: 'ดำเนินการทางกฎหมาย / สถานะพิเศษ' },
  { v: '20', l: 'สำนักงานเขต / ภูมิภาค' },
];
window.divAffilCtrl = (v) =>
  window.DIV_AFFIL_CTRL.find(o => o.v === v) || { v, l: '' };

// ─── ข้อมูลตั้งต้น (seed) ────────────────────────────────────────────
//  inUse = true หมายถึงรหัสสังกัดถูกผูกกับสมาชิก/ข้อมูลปันผลแล้ว — ลบไม่ได้
const _DA_SEED_BASE = [
  { code: '00000', detail: 'ไม่ทราบสังกัด',                              ctrl: '00', pay: 'CSH', on: true,  inUse: true,  at: '2567-05-12 10:15', by: 'ธารา ว.',     note: 'ค่าตั้งต้นระบบ — ห้ามลบ' },
  { code: '00001', detail: 'ดำเนินการทางกฎหมาย',                          ctrl: '16', pay: 'CSH', on: true,  inUse: true,  at: '2567-05-12 10:16', by: 'ธารา ว.',     note: '' },
  { code: '00002', detail: 'สมาชิกรับสภาพหนี้',                           ctrl: '16', pay: 'CSH', on: true,  inUse: true,  at: '2567-05-12 10:16', by: 'ธารา ว.',     note: '' },
  { code: '00003', detail: 'สมาชิกพ้นสภาพหนี้',                           ctrl: '16', pay: 'CSH', on: false, inUse: false, at: '2567-05-12 10:17', by: 'ธารา ว.',     note: 'ปิดใช้งานชั่วคราว' },
  { code: '00004', detail: 'ตรวจสอบเทคโนโลยีสารสนเทศและตรวจราชการ',       ctrl: '13', pay: 'TNA', on: true,  inUse: true,  at: '2567-05-12 10:17', by: 'ธารา ว.',     note: '' },
  { code: '00005', detail: 'ตรวจสอบงานปฏิบัติการ กต. ปณท.',              ctrl: '13', pay: 'TNA', on: true,  inUse: false, at: '2567-05-12 10:17', by: 'ธารา ว.',     note: '' },
  { code: '00006', detail: 'ส่วนตรวจสอบสำนักงานใหญ่',                     ctrl: '13', pay: 'TNA', on: true,  inUse: false, at: '2567-05-12 10:18', by: 'จันทร์เพ็ญ ม.', note: '' },
  { code: '00007', detail: 'ส่วนตรวจสอบบัญชีและการเงิน',                  ctrl: '13', pay: 'TNA', on: true,  inUse: false, at: '2567-05-12 10:18', by: 'จันทร์เพ็ญ ม.', note: '' },
];

// ส่วนตรวจสอบภูมิภาค (ปข.1–ปข.9) — ประเภทจ่ายธนาณัติ รหัสคุม 13
const _DA_REGIONS = [
  'กรุงเทพมหานคร', 'ภาคกลาง', 'ภาคเหนือตอนบน', 'ภาคเหนือตอนล่าง',
  'ภาคตะวันออกเฉียงเหนือตอนบน', 'ภาคตะวันออกเฉียงเหนือตอนล่าง',
  'ภาคตะวันออก', 'ภาคใต้ตอนบน', 'ภาคใต้ตอนล่าง',
];
const _DA_SEED_REGION = _DA_REGIONS.map((rg, i) => ({
  code: String(8 + i).padStart(5, '0'),                      // 00008–00016
  detail: `ส่วนตรวจสอบภูมิภาค (ปข.${i + 1}) ${rg}`,
  ctrl: '13', pay: 'TNA', on: true, inUse: false,
  at: '2567-05-12 10:' + String(18 + i).padStart(2, '0'),
  by: 'จันทร์เพ็ญ ม.', note: '',
}));

// สำนักงานเขตไปรษณีย์ (ขต.) — รหัสคุม 20
const _DA_AREAS = [
  'เขตไปรษณีย์ภาคกลาง', 'เขตไปรษณีย์ภาคเหนือ', 'เขตไปรษณีย์ภาคอีสาน',
  'เขตไปรษณีย์ภาคตะวันออก', 'เขตไปรษณีย์ภาคใต้', 'เขตไปรษณีย์นครหลวง',
  'ศูนย์ไปรษณีย์หลักสี่', 'ศูนย์ไปรษณีย์ด่วนพิเศษ', 'ศูนย์รับฝากไปรษณีย์จำนวนมาก',
  'ฝ่ายปฏิบัติการคลังสินค้า', 'ฝ่ายขนส่งและกระจายสินค้า', 'สำนักกรรมการผู้จัดการใหญ่',
];
const _DA_SEED_AREA = _DA_AREAS.map((nm, i) => ({
  code: String(20 + i).padStart(5, '0'),                     // 00020–00031
  detail: nm,
  ctrl: '20', pay: i % 3 === 0 ? 'CSH' : 'TNA',
  on: i !== 10, inUse: i < 2,
  at: '2567-05-1' + (3 + (i % 3)) + ' 0' + (9 + (i % 5)) + ':' + String(10 + i).padStart(2, '0'),
  by: i % 2 ? 'ธารา ว.' : 'จันทร์เพ็ญ ม.', note: '',
}));

// หน่วยงานพิเศษ — รหัสคุม 16
const _DA_SEED_SPECIAL = [
  { code: '00040', detail: 'สมาชิกสมทบ — รอตรวจสอบสังกัด',     ctrl: '16', pay: 'CSH', on: true,  inUse: false, at: '2567-05-15 14:02', by: 'ธารา ว.',     note: '' },
  { code: '00041', detail: 'สมาชิกเกษียณอายุราชการ',           ctrl: '20', pay: 'TNA', on: true,  inUse: true,  at: '2567-05-15 14:05', by: 'ธารา ว.',     note: '' },
  { code: '00042', detail: 'สมาชิกลาออกระหว่างปี',              ctrl: '16', pay: 'CSH', on: false, inUse: false, at: '2567-05-15 14:08', by: 'จันทร์เพ็ญ ม.', note: 'รอปิดงวด' },
];

window.DIV_AFFIL_SEED = []
  .concat(_DA_SEED_BASE, _DA_SEED_REGION, _DA_SEED_AREA, _DA_SEED_SPECIAL)
  .map((r, i) => ({ id: 'DA-' + r.code, ...r }));

// ─── localStorage ───────────────────────────────────────────────────
window.divAffilLoad = function () {
  try {
    const saved = localStorage.getItem('div_affil_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.DIV_AFFIL_SEED.map(r => ({ ...r }));
};
window.divAffilSaveLS = function (list) {
  try { localStorage.setItem('div_affil_v1', JSON.stringify(list)); } catch (e) {}
};

// ─── uid ─────────────────────────────────────────────────────────────
let _daSeq = 0;
window.divAffilUid = () => 'DA-' + Date.now().toString(36) + '-' + (++_daSeq);

// ─── ค้นหา / กรอง ────────────────────────────────────────────────────
window.divAffilFilter = function (list, c) {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');
  const code = norm(c.code), detail = norm(c.detail), ctrl = norm(c.ctrl);
  return list.filter(r => {
    if (code && !norm(r.code).includes(code)) return false;
    if (detail && !norm(r.detail).includes(detail)) return false;
    if (ctrl && !norm(r.ctrl).includes(ctrl)) return false;
    if (c.pay && c.pay !== 'all' && r.pay !== c.pay) return false;
    if (c.status && c.status !== 'all') {
      if (c.status === 'on' && !r.on) return false;
      if (c.status === 'off' && r.on) return false;
    }
    return true;
  });
};
