// ═════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ค่าคงที่ — ข้อกำหนดรายละเอียดสังกัด
//  ค่าคงที่หน่วยงาน/สังกัดที่ใช้ในการประมวลผลเรียกเก็บและจัดเก็บข้อมูล
//  ฟิลด์: รหัสหน่วยงาน · ชื่อหน่วยงาน · รหัสเขต · ลูกหนี้ตัวแทน ·
//        ภูมิภาคสังกัด · แผ่นจัดเก็บ · รหัสที่อยู่ · การจ่ายปันผล · สถานะเขต
// ═════════════════════════════════════════════════════════════════

// ─── ภูมิภาคสังกัด ───────────────────────────────────────────────────
window.AD_REGIONS = [
  { v: '1', l: 'กรุงเทพและปริมณฑล' },
  { v: '2', l: 'ภาคกลาง' },
  { v: '3', l: 'ภาคเหนือ' },
  { v: '4', l: 'ภาคตะวันออกเฉียงเหนือ' },
  { v: '5', l: 'ภาคตะวันออก' },
  { v: '6', l: 'ภาคตะวันตก' },
  { v: '7', l: 'ภาคใต้' },
];
window.adRegion = (v) => window.AD_REGIONS.find(o => o.v === v) || { v, l: '—' };

// ─── การจ่ายปันผล ────────────────────────────────────────────────────
window.AD_DIVIDEND = [
  { v: 'CASH', l: 'จ่ายเงินสด',        chip: 'success' },
  { v: 'ACCT', l: 'โอนเข้าบัญชี',       chip: 'info' },
  { v: 'UNIT', l: 'จ่ายผ่านหน่วยงาน',   chip: 'primary' },
  { v: 'NONE', l: 'ไม่จ่ายปันผล',       chip: 'neutral' },
];
window.adDividend = (v) => window.AD_DIVIDEND.find(o => o.v === v) || { v, l: v, chip: 'neutral' };

// ─── ข้อมูลตั้งต้น (seed) ────────────────────────────────────────────
//  code=รหัสหน่วยงาน · name=ชื่อหน่วยงาน · zone=รหัสเขต · agent=ลูกหนี้ตัวแทน
//  region=ภูมิภาคสังกัด · disk=แผ่นจัดเก็บ · addr=รหัสที่อยู่ · div=การจ่ายปันผล
//  on=สถานะเขต (true=ใช้งาน) · inUse=ถูกผูกกับสมาชิกแล้ว (ลบไม่ได้)
const _AD_SEED = [
  { code: '01001', name: 'สำนักงานใหญ่ ส่วนกลาง',           zone: '01', agent: 'ต.001 กองการเงิน',       region: '1', disk: 'D-01', addr: '10200', div: 'ACCT', on: true,  inUse: true,  note: 'ค่าตั้งต้นระบบ' },
  { code: '01002', name: 'ฝ่ายบริหารทรัพยากรบุคคล',         zone: '01', agent: 'ต.001 กองการเงิน',       region: '1', disk: 'D-01', addr: '10200', div: 'ACCT', on: true,  inUse: true,  note: '' },
  { code: '02010', name: 'สำนักงานเขตพระนคร',               zone: '02', agent: 'ต.010 เขตพระนคร',        region: '1', disk: 'D-02', addr: '10200', div: 'CASH', on: true,  inUse: true,  note: '' },
  { code: '02011', name: 'สำนักงานเขตดุสิต',                zone: '02', agent: 'ต.010 เขตพระนคร',        region: '1', disk: 'D-02', addr: '10300', div: 'CASH', on: true,  inUse: false, note: '' },
  { code: '03020', name: 'สำนักงานภาคกลาง (อยุธยา)',        zone: '03', agent: 'ต.020 ภาคกลาง',          region: '2', disk: 'D-03', addr: '13000', div: 'UNIT', on: true,  inUse: true,  note: '' },
  { code: '03021', name: 'หน่วยบริการสระบุรี',              zone: '03', agent: 'ต.020 ภาคกลาง',          region: '2', disk: 'D-03', addr: '18000', div: 'UNIT', on: false, inUse: false, note: 'ปิดเขตชั่วคราว' },
  { code: '04030', name: 'สำนักงานภาคเหนือ (เชียงใหม่)',    zone: '04', agent: 'ต.030 ภาคเหนือ',         region: '3', disk: 'D-04', addr: '50000', div: 'UNIT', on: true,  inUse: true,  note: '' },
  { code: '04031', name: 'หน่วยบริการลำปาง',                zone: '04', agent: 'ต.030 ภาคเหนือ',         region: '3', disk: 'D-04', addr: '52000', div: 'CASH', on: true,  inUse: false, note: '' },
  { code: '05040', name: 'สำนักงานภาคอีสาน (ขอนแก่น)',      zone: '05', agent: 'ต.040 ภาคอีสาน',         region: '4', disk: 'D-05', addr: '40000', div: 'UNIT', on: true,  inUse: true,  note: '' },
  { code: '05041', name: 'หน่วยบริการอุดรธานี',             zone: '05', agent: 'ต.040 ภาคอีสาน',         region: '4', disk: 'D-05', addr: '41000', div: 'CASH', on: true,  inUse: false, note: '' },
  { code: '05042', name: 'หน่วยบริการนครราชสีมา',           zone: '05', agent: 'ต.040 ภาคอีสาน',         region: '4', disk: 'D-05', addr: '30000', div: 'CASH', on: false, inUse: false, note: 'รอตรวจสอบสังกัด' },
  { code: '06050', name: 'สำนักงานภาคตะวันออก (ชลบุรี)',    zone: '06', agent: 'ต.050 ภาคตะวันออก',      region: '5', disk: 'D-06', addr: '20000', div: 'UNIT', on: true,  inUse: true,  note: '' },
  { code: '06051', name: 'หน่วยบริการระยอง',                zone: '06', agent: 'ต.050 ภาคตะวันออก',      region: '5', disk: 'D-06', addr: '21000', div: 'CASH', on: true,  inUse: false, note: '' },
  { code: '07060', name: 'สำนักงานภาคตะวันตก (กาญจนบุรี)',  zone: '07', agent: 'ต.060 ภาคตะวันตก',       region: '6', disk: 'D-07', addr: '71000', div: 'UNIT', on: true,  inUse: false, note: '' },
  { code: '08070', name: 'สำนักงานภาคใต้ (สุราษฎร์ธานี)',   zone: '08', agent: 'ต.070 ภาคใต้',           region: '7', disk: 'D-08', addr: '84000', div: 'UNIT', on: true,  inUse: true,  note: '' },
  { code: '08071', name: 'หน่วยบริการสงขลา',                zone: '08', agent: 'ต.070 ภาคใต้',           region: '7', disk: 'D-08', addr: '90000', div: 'CASH', on: true,  inUse: false, note: '' },
  { code: '08072', name: 'หน่วยบริการภูเก็ต',               zone: '08', agent: 'ต.070 ภาคใต้',           region: '7', disk: 'D-08', addr: '83000', div: 'NONE', on: false, inUse: false, note: 'ยังไม่เปิดจ่ายปันผล' },
];

window.AD_SEED = _AD_SEED.map(r => ({ id: 'AD-' + r.code, ...r }));

// ─── localStorage ───────────────────────────────────────────────────
const AD_LS = 'affil_detail_v1';
window.adLoad = function () {
  try {
    const saved = localStorage.getItem(AD_LS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.AD_SEED.map(r => ({ ...r }));
};
window.adSave = function (list) {
  try { localStorage.setItem(AD_LS, JSON.stringify(list)); } catch (e) {}
};

// ─── uid ─────────────────────────────────────────────────────────────
let _adSeq = 0;
window.adUid = () => 'AD-' + Date.now().toString(36) + '-' + (++_adSeq);

// ─── ค้นหา / กรอง ────────────────────────────────────────────────────
window.adFilter = function (list, c) {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');
  const code = norm(c.code), name = norm(c.name), zone = norm(c.zone);
  return list.filter(r => {
    if (code && !norm(r.code).includes(code)) return false;
    if (name && !norm(r.name).includes(name)) return false;
    if (zone && !norm(r.zone).includes(zone)) return false;
    if (c.region && c.region !== 'all' && r.region !== c.region) return false;
    if (c.div && c.div !== 'all' && r.div !== c.div) return false;
    if (c.status && c.status !== 'all') {
      if (c.status === 'on' && !r.on) return false;
      if (c.status === 'off' && r.on) return false;
    }
    return true;
  });
};
