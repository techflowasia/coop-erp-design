// ════════════════════════════════════════════════════════════════════
//  ทะเบียนสมาชิก — ข้อมูลบุตรของสมาชิก (ใช้ร่วมกับคำขอทุนการศึกษา)
//  เก็บแยกตามรหัสสมาชิก · ใช้ทั้งแท็บรายละเอียดสมาชิก และฟอร์มคำขอทุน
// ════════════════════════════════════════════════════════════════════

window.CHILD_TITLE_OPTS = [
  { v: 'ด.ช.', l: 'ด.ช.' },
  { v: 'ด.ญ.', l: 'ด.ญ.' },
  { v: 'นาย',  l: 'นาย' },
  { v: 'น.ส.', l: 'น.ส.' },
];

// ข้อมูลตั้งต้น — คีย์ = รหัสสมาชิก
window.MEMBER_CHILDREN_SEED = {
  'M-058241': [
    { id: 'CH-241-1', title: 'น.ส.', firstName: 'ปริยากร', lastName: 'รักษ์ออม', citizenId: '1-1019-01284-55-1', birthDate: '2004-03-12', eduLevel: '6', studying: true },
    { id: 'CH-241-2', title: 'ด.ช.', firstName: 'ธีรเดช',  lastName: 'รักษ์ออม', citizenId: '1-1019-05821-22-4', birthDate: '2018-08-20', eduLevel: '1', studying: true },
  ],
  'M-058243': [
    { id: 'CH-243-1', title: 'นาย', firstName: 'ธนกฤต', lastName: 'สุขสวัสดิ์', citizenId: '1-1018-02841-33-7', birthDate: '2009-07-08', eduLevel: '3', studying: true },
  ],
  'M-058244': [
    { id: 'CH-244-1', title: 'ด.ช.', firstName: 'ภูริช',   lastName: 'จันทร์เพ็ญ', citizenId: '1-1019-03928-11-2', birthDate: '2017-11-20', eduLevel: '1', studying: true },
    { id: 'CH-244-2', title: 'ด.ญ.', firstName: 'ฐิติชญา', lastName: 'จันทร์เพ็ญ', citizenId: '1-1019-06621-09-5', birthDate: '2021-05-02', eduLevel: '0', studying: true },
  ],
  'M-058245': [
    { id: 'CH-245-1', title: 'ด.ช.', firstName: 'ณัฐนนท์', lastName: 'ขำเพชร', citizenId: '1-2099-04412-71-3', birthDate: '2011-09-14', eduLevel: '2', studying: true },
  ],
  'M-058248': [
    { id: 'CH-248-1', title: 'น.ส.', firstName: 'อาทิติยา', lastName: 'ใจงาม', citizenId: '1-1019-04210-88-3', birthDate: '2004-02-15', eduLevel: '6', studying: true },
  ],
  'M-058249': [
    { id: 'CH-249-1', title: 'นาย', firstName: 'ปุญญพัฒน์', lastName: 'วงศ์ประเสริฐ', citizenId: '3-1019-07781-20-6', birthDate: '2008-12-01', eduLevel: '4', studying: true },
  ],
};

let _childUidSeq = 0;
window.childUid = () => 'CH-N' + String(++_childUidSeq).padStart(3, '0') + '-' + Date.now().toString().slice(-4);

function _childStore() {
  try { return JSON.parse(localStorage.getItem('member_children') || '{}'); } catch (e) { return {}; }
}

// โหลดบุตรของสมาชิกรายหนึ่ง (localStorage override > seed)
window.loadMemberChildren = (code) => {
  const store = _childStore();
  if (store[code]) return store[code].map(c => ({ ...c }));
  return (window.MEMBER_CHILDREN_SEED[code] || []).map(c => ({ ...c }));
};

// บันทึกบุตรของสมาชิกรายหนึ่ง
window.saveMemberChildren = (code, list) => {
  const store = _childStore();
  store[code] = list;
  try { localStorage.setItem('member_children', JSON.stringify(store)); } catch (e) {}
};

// ป้ายชื่อบุตรแบบเต็ม
window.childFullName = (c) => `${c.title || ''}${c.firstName || ''} ${c.lastName || ''}`.trim();

// ─── ผู้รับผลประโยชน์ (แท็บรายละเอียดสมาชิก) ─────────────────────────
window.BENEFICIARY_TITLE_OPTS = ['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.'];
window.BENEFICIARY_RELATION_OPTS = ['คู่สมรส', 'บุตร', 'บิดา', 'มารดา', 'พี่น้อง', 'ญาติ', 'อื่น ๆ'];
let _benUidSeq = 0;
window.benUid = () => 'BEN-N' + String(++_benUidSeq).padStart(3, '0') + '-' + Date.now().toString().slice(-4);
window.benFullName = (b) => `${b.title || ''}${b.firstName || ''} ${b.lastName || ''}`.trim();

// ─── ผู้รับผลประโยชน์ที่ขึ้นทะเบียนไว้ ต่อสมาชิกแต่ละราย ───────────────
//  ใช้ดึงเข้าฟอร์มขอสินไหมกรณีสมาชิกเสียชีวิตโดยอัตโนมัติ (share = สัดส่วน %)
window.MEMBER_BENEFICIARIES_SEED = {
  'M-058241': [
    { title: 'นาง',  firstName: 'พรพิมล',  lastName: 'ใจดี',          relation: 'คู่สมรส', citizenId: '3-1018-00928-44-1', share: 50 },
    { title: 'ด.ช.', firstName: 'ปกรณ์',   lastName: 'ใจดี รักษ์ออม', relation: 'บุตร',    citizenId: '1-1019-00773-21-0', share: 25 },
    { title: 'ด.ญ.', firstName: 'ปุณยนุช', lastName: 'ใจดี รักษ์ออม', relation: 'บุตร',    citizenId: '1-1019-00884-55-2', share: 25 },
  ],
  'M-058243': [
    { title: 'นาง', firstName: 'กนกวรรณ', lastName: 'สุขสวัสดิ์', relation: 'คู่สมรส', citizenId: '3-1018-00230-11-8', share: 60 },
    { title: 'นาย', firstName: 'ธนกฤต',   lastName: 'สุขสวัสดิ์', relation: 'บุตร',    citizenId: '1-1018-02841-33-7', share: 40 },
  ],
  'M-058244': [
    { title: 'นาย', firstName: 'สมพงษ์', lastName: 'จันทร์เพ็ญ', relation: 'คู่สมรส', citizenId: '3-1019-00120-55-1', share: 60 },
    { title: 'ด.ช.', firstName: 'ภูริช', lastName: 'จันทร์เพ็ญ', relation: 'บุตร',    citizenId: '1-1019-03928-11-2', share: 40 },
  ],
  'M-058245': [
    { title: 'นาง',  firstName: 'สุดารัตน์', lastName: 'ขำเพชร', relation: 'คู่สมรส', citizenId: '3-2099-00187-45-2', share: 50 },
    { title: 'ด.ช.', firstName: 'ณัฐนนท์',   lastName: 'ขำเพชร', relation: 'บุตร',    citizenId: '1-2099-04412-71-3', share: 50 },
  ],
  'M-058247': [
    { title: 'นาง', firstName: 'สุนีย์', lastName: 'พิทักษ์ธรรม', relation: 'คู่สมรส', citizenId: '3-1099-00087-23-5', share: 100 },
  ],
  'M-058249': [
    { title: 'นาง', firstName: 'อรพิน',      lastName: 'วงศ์ประเสริฐ', relation: 'คู่สมรส', citizenId: '3-1019-00552-18-4', share: 40 },
    { title: 'นาย', firstName: 'ปุญญพัฒน์', lastName: 'วงศ์ประเสริฐ', relation: 'บุตร',    citizenId: '3-1019-07781-20-6', share: 30 },
    { title: 'น.ส.', firstName: 'ปวีณา',     lastName: 'วงศ์ประเสริฐ', relation: 'บุตร',    citizenId: '1-1019-08120-77-1', share: 30 },
  ],
};

function _benStore() {
  try { return JSON.parse(localStorage.getItem('member_beneficiaries') || '{}'); } catch (e) { return {}; }
}
// โหลดผู้รับผลประโยชน์ของสมาชิกรายหนึ่ง (localStorage override > seed) — [] ถ้าไม่มีข้อมูล
window.loadMemberBeneficiaries = (code) => {
  const store = _benStore();
  if (store[code]) return store[code].map(b => ({ ...b }));
  return (window.MEMBER_BENEFICIARIES_SEED[code] || []).map(b => ({ ...b }));
};
window.saveMemberBeneficiaries = (code, list) => {
  const store = _benStore();
  store[code] = list;
  try { localStorage.setItem('member_beneficiaries', JSON.stringify(store)); } catch (e) {}
};
