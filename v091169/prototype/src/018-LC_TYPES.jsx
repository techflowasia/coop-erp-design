// ═════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — บันทึกหลักทรัพย์ (Loan Collateral / LC)
//  ─ ทะเบียนหลักทรัพย์ค้ำประกันเงินกู้ของสมาชิก แยกตามประเภท
//    (โฉนด · นส3 · นส3ก · โฉนดตราจอง · ห้องชุด · สิ่งปลูกสร้าง)
//  ─ แต่ละสมาชิกมีได้หลายหลักทรัพย์; ห้องชุด/สิ่งปลูกสร้างอ้างอิงโฉนดแม่
// ═════════════════════════════════════════════════════════════════

// ── รายการตัวเลือก (dropdown) ────────────────────────────────────
window.LC_TYPES = ['โฉนด', 'นส3', 'นส3ก', 'โฉนดตราจอง', 'ห้องชุด', 'สิ่งปลูกสร้าง'];
window.LC_TITLE_TYPES = ['โฉนด', 'นส3', 'นส3ก', 'โฉนดตราจอง'];   // ประเภทที่ใช้ฟอร์มโฉนด/ที่ดิน
window.LC_MARITAL = ['โสด', 'สมรส (ชายxหญิง)', 'หย่าร้าง', 'หม้าย'];
window.LC_BUILDING_TYPES = ['บ้านเดี่ยว', 'บ้านแฝด', 'ทาวน์เฮาส์', 'ตึกแถว / อาคารพาณิชย์', 'อาคารสำนักงาน', 'โรงงาน / โกดัง', 'อื่นๆ'];
window.LC_USAGE = ['ที่อยู่อาศัย', 'พาณิชยกรรม', 'อุตสาหกรรม', 'เกษตรกรรม'];
window.LC_STRUCTURE = ['คอนกรีตเสริมเหล็ก', 'ครึ่งตึกครึ่งไม้', 'ไม้', 'เหล็ก / โครงสร้างสำเร็จรูป'];
window.LC_BUILD_STATUS = ['ก่อสร้างแล้วเสร็จ', 'อยู่ระหว่างก่อสร้าง', 'รอรื้อถอน'];
window.LC_OBLIGATION = ['ไม่มีภาระผูกพัน', 'จำนอง', 'อายัด', 'ติดภาระจำยอม'];
window.LC_LAND_PROVINCES = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'นครปฐม', 'ฉะเชิงเทรา', 'พระนครศรีอยุธยา', 'นครนายก', 'สระบุรี'];

// ── ผู้ถือกรรมสิทธิ์ตัวอย่าง ──────────────────────────────────────
function lcOwners() {
  return [
    { name: 'นายสมชาย ใจดี', citizenId: '1234567890123', age: 50, marital: 'สมรส (ชายxหญิง)', spouse: 'นางสมหญิง ใจดี', father: '-', mother: '-' },
    { name: 'นางสาวเจนจิรา อักษร', citizenId: '1234567890123', age: 48, marital: 'โสด', spouse: '-', father: 'นายจิตร อักษร', mother: 'นางมาลี อักษร' },
  ];
}

let __lcSeq = 1;
function lcId() { return 'LC-' + String(__lcSeq++).padStart(4, '0'); }

// สร้างหลักทรัพย์เปล่าตามประเภท (ใช้ตอนกด "เพิ่มหลักทรัพย์")
window.lcBlank = function (type) {
  type = type || 'โฉนด';
  return {
    id: lcId(), type, code: '',
    landOfficeProvince: '', landOfficeBranch: '', landOfficeSubBranch: '',
    titleNo: '', volume: '', page: '', moo: '',
    rawang: '', landNo: '', surveyPage: '', locProvince: '', locAmphoe: '', locTambon: '',
    rai: '', ngan: '', wa: '',
    govPerWa: '', govPrice: '', coopPrice: '', licensedPrice: '', maxGuarPct: '', summaryPrice: '',
    // ราคาประเมินสหกรณ์/ตารางเมตร (ห้องชุด/สิ่งปลูกสร้าง)
    coopPerSqm: '',
    note: '',
    // อ้างอิงโฉนดแม่ (ห้องชุด/สิ่งปลูกสร้าง)
    refTitleNo: '', refLandOfficeProvince: '', refLandOfficeBranch: '', refLandOfficeSubBranch: '',
    condo: { roomNo: '', floor: '', buildingNo: '', roomName: '', regNo: '', titleNos: '', areaSqm: '', province: '', amphoe: '', tambon: '' },
    building: {
      btype: '', otherType: '', usage: '',
      houseNo: '', permitDate: '2569-01-01', moo: '', soi: '', road: '',
      province: '', amphoe: '', tambon: '', postcode: '', lat: '', lng: '',
      refTitleNo: '', refTitleNos: [], refLandNo: '', refSurveyPage: '', rai: '', ngan: '', wa: '',
      yearBuilt: '', yearDone: '', ageYears: '', floors: '', usableArea: '', width: '', length: '',
      structure: '', wallMat: '', roofMat: '', floorMat: '', ceilingMat: '',
      bedrooms: '', bathrooms: '', kitchens: '', parking: '', amenities: '',
      buildAppraisal: '', appraisalPerSqm: '', depreciation: '', residualValue: '', totalValue: '',
      buildStatus: '', permitNo: '', permitApproveDate: '', obligation: '',
    },
    owners: lcOwners(),
    relatedIds: [],
  };
};

// สร้างเรคคอร์ดตัวอย่าง (ใส่ค่าหลักไว้ให้เห็นเวลาแก้ไข)
function lcMake(type, prov, extra, sub) {
  const r = window.lcBlank(type);
  r.locProvince = prov;
  r.landOfficeProvince = prov;
  r.sub = !!sub;
  return Object.assign(r, extra || {});
}

// ── หลักทรัพย์ของสมาชิกตัวอย่าง (คีย์ตามเลขทะเบียน) ──────────────────
// เจ้าของหลักทรัพย์ = สมาชิกผู้กู้ (ข้อมูลตรงกับทะเบียนสมาชิก)
const LC_OWNER_058241 = [{ name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3101800123456', age: 50, marital: 'สมรส (ชายxหญิง)', spouse: 'นางสาวพรพิมล ทองคำ', father: '-', mother: '-' }];
window.LC_BY_MEMBER = {
  'M-058241': [
    // แปลงที่ 1 — ที่ดินตั้งบ้าน (สิ่งปลูกสร้างผูกกับโฉนดนี้)
    lcMake('โฉนด', 'สมุทรปราการ', {
      code: 'TL-2567-00841', titleNo: '12345', volume: '124', page: '45', moo: '3',
      rawang: '5136 II 4826', landNo: '210', surveyPage: '3312',
      locProvince: 'สมุทรปราการ', locAmphoe: 'บางพลี', locTambon: 'บางแก้ว',
      rai: '0', ngan: '1', wa: '35',
      landOfficeProvince: 'สมุทรปราการ', landOfficeBranch: 'บางพลี',
      govPerWa: '18,000.00', govPrice: '2,430,000.00', coopPrice: '2,187,000.00',
      licensedPrice: '2,700,000.00', maxGuarPct: '90.00', summaryPrice: '2,187,000.00', guarUsed: '400,000.00',
      note: 'ที่ดินติดถนนสาธารณะ (ซอยบางแก้ว 12) ถมแล้วทั้งแปลง',
      owners: LC_OWNER_058241,
    }),
    // แปลงที่ 2 — ติดกับโฉนด 12345 (ด้านทิศเหนือ) ใช้เป็นที่จอดรถ/สวน
    lcMake('โฉนด', 'สมุทรปราการ', {
      code: 'TL-2567-00842', titleNo: '12346', volume: '124', page: '46', moo: '3',
      rawang: '5136 II 4826', landNo: '211', surveyPage: '3313',
      locProvince: 'สมุทรปราการ', locAmphoe: 'บางพลี', locTambon: 'บางแก้ว',
      rai: '0', ngan: '0', wa: '60',
      landOfficeProvince: 'สมุทรปราการ', landOfficeBranch: 'บางพลี',
      govPerWa: '18,000.00', govPrice: '1,080,000.00', coopPrice: '972,000.00',
      licensedPrice: '1,200,000.00', maxGuarPct: '90.00', summaryPrice: '972,000.00',
      note: 'ติดต่อกับโฉนด 12345 ด้านทิศเหนือ',
      owners: LC_OWNER_058241,
    }),
    // สิ่งปลูกสร้าง — บ้านเดี่ยวสร้างคร่อมโฉนด 12345 + 12346 (ต้องผูกโฉนดอย่างน้อย 1 แปลงเสมอ)
    lcMake('สิ่งปลูกสร้าง', 'สมุทรปราการ', {
      code: 'BD-2567-00204',
      refTitleNo: '12345', refLandOfficeProvince: 'สมุทรปราการ', refLandOfficeBranch: 'บางพลี',
      coopPrice: '2,652,000.00', summaryPrice: '2,652,000.00',
      note: 'บ้านเดี่ยว 2 ชั้น สภาพดี มีรั้วรอบ',
      owners: LC_OWNER_058241,
      building: Object.assign(window.lcBlank('สิ่งปลูกสร้าง').building, {
        btype: 'บ้านเดี่ยว', usage: 'ที่อยู่อาศัย', houseNo: '128/45', moo: '3', soi: 'บางแก้ว 12', road: 'เทพารักษ์',
        province: 'สมุทรปราการ', amphoe: 'บางพลี', tambon: 'บางแก้ว', postcode: '10540',
        refTitleNo: '12345', refTitleNos: ['12345', '12346'], refLandNo: '210', refSurveyPage: '3312', rai: '0', ngan: '1', wa: '35',
        yearBuilt: '2557', yearDone: '2558', ageYears: '11', floors: '2', usableArea: '210', width: '10', length: '10.5',
        structure: 'คอนกรีตเสริมเหล็ก', wallMat: 'ก่ออิฐฉาบปูน', roofMat: 'กระเบื้องคอนกรีต', floorMat: 'คอนกรีตปูกระเบื้อง', ceilingMat: 'ยิปซั่มบอร์ด',
        bedrooms: '3', bathrooms: '3', kitchens: '1', parking: '2', amenities: 'โรงจอดรถ, ลานซักล้าง, ระเบียงชั้น 2',
        buildAppraisal: '3,400,000.00', appraisalPerSqm: '16,190.00', depreciation: '22', residualValue: '2,652,000.00', totalValue: '4,839,000.00',
        buildStatus: 'ก่อสร้างแล้วเสร็จ', permitNo: 'อ.1 456/2557', obligation: 'ไม่มีภาระผูกพัน',
      }),
    }, true),
    // สิ่งปลูกสร้าง — โรงจอดรถ/ห้องเก็บของ บนโฉนด 12345 (โฉนดเดียวมีสิ่งปลูกสร้างได้หลายรายการ)
    lcMake('สิ่งปลูกสร้าง', 'สมุทรปราการ', {
      code: 'BD-2567-00205',
      refTitleNo: '12345', refLandOfficeProvince: 'สมุทรปราการ', refLandOfficeBranch: 'บางพลี',
      coopPrice: '180,000.00', summaryPrice: '180,000.00',
      note: 'โรงจอดรถโครงเหล็ก หลังคาเมทัลชีท ด้านหน้าบ้าน',
      owners: LC_OWNER_058241,
      building: Object.assign(window.lcBlank('สิ่งปลูกสร้าง').building, {
        btype: 'อื่นๆ', otherType: 'โรงจอดรถ', usage: 'ที่อยู่อาศัย', houseNo: '128/45', moo: '3', soi: 'บางแก้ว 12', road: 'เทพารักษ์',
        province: 'สมุทรปราการ', amphoe: 'บางพลี', tambon: 'บางแก้ว', postcode: '10540',
        refTitleNo: '12345', refTitleNos: ['12345'],
        yearBuilt: '2560', yearDone: '2560', ageYears: '9', floors: '1', usableArea: '36', width: '6', length: '6',
        structure: 'เหล็ก / โครงสร้างสำเร็จรูป', roofMat: 'เมทัลชีท', floorMat: 'คอนกรีต',
        buildStatus: 'ก่อสร้างแล้วเสร็จ', obligation: 'ไม่มีภาระผูกพัน',
      }),
    }, true),
    // ห้องชุด — อยู่บนที่ดินของนิติบุคคลอาคารชุด (โฉนด 45872 ไม่ใช่หลักทรัพย์ของสมาชิก)
    lcMake('ห้องชุด', 'สมุทรปราการ', {
      code: 'CD-2567-00119',
      refTitleNo: '45872', refLandOfficeProvince: 'สมุทรปราการ', refLandOfficeBranch: 'บางพลี',
      condo: { roomNo: '18/305', floor: '3', buildingNo: 'A', roomName: 'เดอะ กรีน เรสซิเดนซ์', regNo: 'อช.115/2560', titleNos: '45872', areaSqm: '48.50', province: 'สมุทรปราการ', amphoe: 'บางพลี', tambon: 'บางแก้ว' },
      govPrice: '2,425,000.00', coopPerSqm: '55,000.00', coopPrice: '2,667,500.00', summaryPrice: '2,425,000.00',
      note: 'ห้องมุม ชั้น 3 สภาพพร้อมอยู่',
      owners: LC_OWNER_058241,
    }),
    lcMake('นส3ก', 'ปทุมธานี', {
      code: 'TL-2566-00688', titleNo: '1180', volume: '12', page: '80', moo: '5',
      rawang: '5136 IV 2210', landNo: '45', surveyPage: '880',
      locProvince: 'ปทุมธานี', locAmphoe: 'ลาดหลุมแก้ว', locTambon: 'คูขวาง',
      rai: '2', ngan: '0', wa: '00', landOfficeProvince: 'ปทุมธานี', landOfficeBranch: 'ลาดหลุมแก้ว',
      govPerWa: '1,500.00', govPrice: '1,200,000.00',
      note: 'ที่ดินเกษตร (นาข้าว) ยังไม่ได้ประเมินราคาสหกรณ์',
      owners: LC_OWNER_058241,
    }),
  ],
};

// คืนรายการหลักทรัพย์ของสมาชิก (deep clone เพื่อแก้ไขอิสระ)
window.lcOf = function (code) {
  const src = window.LC_BY_MEMBER[code] || [];
  return src.map(r => JSON.parse(JSON.stringify(r)));
};

// ── เงื่อนไข: สิ่งปลูกสร้างต้องผูกกับหลักทรัพย์ประเภทที่ดิน (โฉนด/นส3/นส3ก/ตราจอง) ของสมาชิกเสมอ ──
// เลขที่โฉนดทั้งหมดที่สิ่งปลูกสร้างตั้งอยู่ (สร้างคร่อมได้หลายโฉนด)
window.lcBldTitleNos = function (rec) {
  if (!rec || rec.type !== 'สิ่งปลูกสร้าง') return [];
  const b = rec.building || {};
  const arr = (b.refTitleNos && b.refTitleNos.length) ? b.refTitleNos : [rec.refTitleNo || b.refTitleNo];
  return [...new Set(arr.filter(Boolean))];
};
// โฉนดที่สิ่งปลูกสร้างตั้งอยู่ (record จริงในทะเบียน)
window.lcLandsOf = function (bld, pool) {
  const TT = window.LC_TITLE_TYPES || [];
  return window.lcBldTitleNos(bld).map(no => (pool || []).find(r => TT.includes(r.type) && r.titleNo === no)).filter(Boolean);
};
// สิ่งปลูกสร้างที่ตั้งอยู่บนที่ดินแปลงนี้ (โฉนดหนึ่งมีได้หลายรายการ)
window.lcBuildingsOn = function (land, pool) {
  if (!land || !land.titleNo) return [];
  return (pool || []).filter(r => r.type === 'สิ่งปลูกสร้าง' && window.lcBldTitleNos(r).includes(land.titleNo));
};
window.lcBuildingRefError = function (rec, list) {
  if (!rec || rec.type !== 'สิ่งปลูกสร้าง') return '';
  const refs = window.lcBldTitleNos(rec);
  if (!refs.length) return 'สิ่งปลูกสร้างต้องผูกกับหลักทรัพย์ที่มีโฉนดอย่างน้อย 1 แปลง — กรุณาเชื่อมโฉนดที่ตั้งสิ่งปลูกสร้างในส่วนหลักทรัพย์ที่เกี่ยวข้อง';
  const TT = window.LC_TITLE_TYPES || [];
  const miss = refs.filter(no => !(list || []).some(r => TT.includes(r.type) && r.titleNo === no));
  return miss.length ? 'ไม่พบโฉนดเลขที่ ' + miss.join(', ') + ' ในทะเบียนหลักทรัพย์ของสมาชิก — กรุณาบันทึกโฉนดก่อน แล้วผูกกับสิ่งปลูกสร้าง' : '';
};

// ── บันทึกหลักทรัพย์ใหม่เข้าทะเบียนจริงของสมาชิก (คืน rec ที่บันทึกแล้ว) ──
window.lcSaveNew = function (code, rec) {
  (window.LC_BY_MEMBER[code] = window.LC_BY_MEMBER[code] || []).push(rec);
  return rec;
};
