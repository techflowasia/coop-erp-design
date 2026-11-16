// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน — ค่าคงที่
//  • ประเภทสินทรัพย์ลงทุน (IV_ASSET_TYPE_SEED)
//  • ผู้ออกหลักทรัพย์ / คู่สัญญา (IV_ISSUER_SEED)
//  • วงเงินลงทุนประจำปี (IV_LIMIT_SEED)
// ════════════════════════════════════════════════════════════════════

// กลุ่มสินทรัพย์ และระดับความเสี่ยง (ใช้ร่วมกันทั้งหน้าจอ)
window.IV_ASSET_GROUPS = ['เงินฝาก', 'ตราสารหนี้', 'ตราสารทุน', 'กองทุน', 'อื่น ๆ'];
window.IV_RISK = {
  'ต่ำ':      { label: 'ต่ำ',      pill: 'ok',      order: 1 },
  'ปานกลาง':  { label: 'ปานกลาง',  pill: 'warn',    order: 2 },
  'สูง':      { label: 'สูง',      pill: 'bad',     order: 3 },
};
window.IV_ISSUER_TYPES = ['ธนาคาร', 'รัฐบาล', 'รัฐวิสาหกิจ', 'เอกชน'];

// รูปแบบการบันทึกมูลค่าการลงทุน และหน่วยระยะเวลาอายุตราสาร
window.IV_VALUATION_MODES = {
  'value': { label: 'มูลค่า (บาท)', short: 'มูลค่า', hint: 'บันทึกการลงทุนเป็นจำนวนเงิน (บาท)', pill: 'info' },
  'unit':  { label: 'หน่วยลงทุน', short: 'หน่วย', hint: 'บันทึกเป็นจำนวนหน่วย × ราคา/มูลค่าต่อหน่วย', pill: 'primary' },
};
window.IV_TERM_UNITS = ['วัน', 'เดือน', 'ปี'];
window.IV_ISSUER_TYPE_PILL = {
  'ธนาคาร':     'info',
  'รัฐบาล':     'ok',
  'รัฐวิสาหกิจ': 'primary',
  'เอกชน':      'neutral',
};

// ─── ประเภทสินทรัพย์ลงทุน ────────────────────────────────────────────
// countLimit      = นับรวมวงเงินลงทุนประจำปีหรือไม่
// needMaturity    = ต้องบันทึกวันครบกำหนดหรือไม่
// needRate        = ต้องบันทึกอัตราดอกเบี้ยหรือไม่
// needMarketValue = ต้องบันทึกมูลค่าตลาดหรือไม่
// valuationMode   = บันทึกการลงทุนแบบ มูลค่า (value) หรือ หน่วยลงทุน (unit)
// needTerm        = กำหนดระยะเวลา/อายุตราสาร (บัตรเงินฝาก/ตั๋วสัญญาใช้เงิน ฯลฯ)
// termUnits       = หน่วยระยะเวลาที่เลือกได้ (วัน/เดือน/ปี)
window.IV_ASSET_TYPE_SEED = [
  { id: 'IVT-01', code: 'DEP',   name: 'เงินฝากธนาคาร',         group: 'เงินฝาก',   risk: 'ต่ำ',
    countLimit: true,  needMaturity: false, needRate: true,  needMarketValue: false,
    valuationMode: 'value', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'เงินฝากออมทรัพย์/กระแสรายวันกับสถาบันการเงิน' },
  { id: 'IVT-02', code: 'SLAK',  name: 'สลากออมทรัพย์',          group: 'เงินฝาก',   risk: 'ต่ำ',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: false,
    valuationMode: 'value', needTerm: true, termUnits: ['เดือน', 'ปี'], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'สลาก ธ.ก.ส. / ธ.ออมสิน — มีวันครบกำหนดไถ่ถอน' },
  { id: 'IVT-03', code: 'GOVB',  name: 'พันธบัตรรัฐบาล',          group: 'ตราสารหนี้', risk: 'ต่ำ',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'ความเสี่ยงต่ำสุด — ค้ำประกันโดยรัฐบาล' },
  { id: 'IVT-04', code: 'SOEB',  name: 'พันธบัตรรัฐวิสาหกิจ',       group: 'ตราสารหนี้', risk: 'ปานกลาง',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'พันธบัตรที่ออกโดยรัฐวิสาหกิจ' },
  { id: 'IVT-05', code: 'DEBT',  name: 'หุ้นกู้',                  group: 'ตราสารหนี้', risk: 'ปานกลาง',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'หุ้นกู้บริษัทเอกชนที่ได้รับการจัดอันดับเครดิต' },
  { id: 'IVT-06', code: 'STOCK', name: 'หุ้นสามัญ',                group: 'ตราสารทุน', risk: 'สูง',
    countLimit: true,  needMaturity: false, needRate: false, needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'หลักทรัพย์จดทะเบียนในตลาดหลักทรัพย์' },
  { id: 'IVT-07', code: 'FUND',  name: 'หน่วยลงทุน / กองทุน',       group: 'กองทุน',    risk: 'ปานกลาง',
    countLimit: true,  needMaturity: false, needRate: false, needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'หน่วยลงทุนในกองทุนรวม — ใช้ NAV เป็นมูลค่าตลาด' },
  { id: 'IVT-08', code: 'BE',    name: 'ตั๋วแลกเงิน',              group: 'ตราสารหนี้', risk: 'ปานกลาง',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: false,
    valuationMode: 'value', needTerm: true, termUnits: ['วัน', 'เดือน'], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'B/E — ตราสารหนี้ระยะสั้น มีวันครบกำหนด' },
  { id: 'IVT-09', code: 'PVTB',  name: 'ตราสารหนี้เอกชน',          group: 'ตราสารหนี้', risk: 'สูง',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'ตราสารหนี้เอกชนทั่วไป — ประเมินความเสี่ยงตามเครดิต' },
  { id: 'IVT-10', code: 'FIXD',  name: 'บัญชีเงินฝากประจำ',         group: 'เงินฝาก',   risk: 'ต่ำ',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: false,
    valuationMode: 'value', needTerm: true, termUnits: ['เดือน', 'ปี'], enabled: true,
    createdDate: '2024-10-01', createdBy: 'ประภาส ทองสุข', note: 'เงินฝากประจำ 3–24 เดือน มีวันครบกำหนด' },
  { id: 'IVT-11', code: 'PFND',  name: 'กองทุนส่วนบุคคล',          group: 'กองทุน',    risk: 'สูง',
    countLimit: true,  needMaturity: false, needRate: false, needMarketValue: true,
    valuationMode: 'unit', needTerm: false, termUnits: [], enabled: true,
    createdDate: '2024-11-12', createdBy: 'ประภาส ทองสุข', note: 'Private Fund บริหารโดย บลจ. ที่ได้รับอนุญาต' },
  { id: 'IVT-13', code: 'NCD',   name: 'บัตรเงินฝาก',            group: 'เงินฝาก',   risk: 'ต่ำ',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: false,
    valuationMode: 'value', needTerm: true, termUnits: ['วัน', 'เดือน', 'ปี'], enabled: true,
    createdDate: '2024-11-12', createdBy: 'ประภาส ทองสุข', note: 'NCD — บัตรเงินฝากที่เปลี่ยนมือได้ กำหนดระยะเวลาได้เอง' },
  { id: 'IVT-14', code: 'PN',    name: 'ตั๋วสัญญาใช้เงิน',         group: 'ตราสารหนี้', risk: 'ปานกลาง',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: false,
    valuationMode: 'value', needTerm: true, termUnits: ['วัน', 'เดือน', 'ปี'], enabled: true,
    createdDate: '2024-11-12', createdBy: 'ประภาส ทองสุข', note: 'P/N — ตั๋วสัญญาใช้เงิน กำหนดระยะเวลาชำระได้เอง' },
  { id: 'IVT-15', code: 'TBILL', name: 'ตั๋วเงินคลัง',             group: 'ตราสารหนี้', risk: 'ต่ำ',
    countLimit: true,  needMaturity: true,  needRate: true,  needMarketValue: true,
    valuationMode: 'unit', needTerm: true, termUnits: ['วัน', 'เดือน'], enabled: true,
    createdDate: '2024-11-12', createdBy: 'ประภาส ทองสุข', note: 'T-Bill — ตราสารหนี้ระยะสั้นรัฐบาล ซื้อขายแบบส่วนลด อ้างอิงราคาตลาด' },
  { id: 'IVT-12', code: 'OTHR',  name: 'สินทรัพย์อื่น ๆ',           group: 'อื่น ๆ',    risk: 'ปานกลาง',
    countLimit: false, needMaturity: false, needRate: false, needMarketValue: false,
    valuationMode: 'value', needTerm: false, termUnits: [], enabled: false,
    createdDate: '2024-11-12', createdBy: 'ประภาส ทองสุข', note: 'สินทรัพย์ลงทุนอื่นที่ไม่เข้าประเภทข้างต้น — เปิดใช้เมื่อมีรายการ' },
];

// ─── ผู้ออกหลักทรัพย์ / คู่สัญญา ──────────────────────────────────────
window.IV_ISSUER_SEED = [
  { id: 'ISS-01', code: 'MOF',   name: 'กระทรวงการคลัง',                       issuerType: 'รัฐบาล',
    regNo: '0994000165501', rating: 'AAA (รัฐบาล)', contact: 'สำนักงานบริหารหนี้สาธารณะ', phone: '0-2271-7999', email: 'pdmo@mof.go.th',      enabled: true,
    createdDate: '2024-10-02', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-02', code: 'KTB',   name: 'ธนาคารกรุงไทย จำกัด (มหาชน)',          issuerType: 'ธนาคาร',
    regNo: '0107537000882', rating: 'AA+ (tris)', contact: 'ฝ่ายตลาดทุน',          phone: '0-2111-1111', email: 'capital@ktb.co.th',    enabled: true,
    createdDate: '2024-10-02', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-03', code: 'GSB',   name: 'ธนาคารออมสิน',                          issuerType: 'รัฐวิสาหกิจ',
    regNo: '0994000182850', rating: 'AAA (รัฐบาล)', contact: 'ฝ่ายบริหารเงิน',     phone: '0-2299-8000', email: 'treasury@gsb.or.th',   enabled: true,
    createdDate: '2024-10-02', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-04', code: 'EGAT',  name: 'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย',          issuerType: 'รัฐวิสาหกิจ',
    regNo: '0994000272010', rating: 'AAA (tris)', contact: 'ฝ่ายการเงิน',         phone: '0-2436-0000', email: 'finance@egat.co.th',   enabled: true,
    createdDate: '2024-10-05', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-05', code: 'PTT',   name: 'บมจ. ปตท.',                            issuerType: 'เอกชน',
    regNo: '0107544000108', rating: 'AAA (tris)', contact: 'นักลงทุนสัมพันธ์',     phone: '0-2537-2000', email: 'ir@pttplc.com',        enabled: true,
    createdDate: '2024-10-05', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-06', code: 'BAAC',  name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',    issuerType: 'รัฐวิสาหกิจ',
    regNo: '0994000165862', rating: 'AAA (รัฐบาล)', contact: 'ฝ่ายบริหารเงิน',     phone: '0-2555-0555', email: 'treasury@baac.or.th',  enabled: true,
    createdDate: '2024-10-08', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-07', code: 'SCC',   name: 'บมจ. ปูนซิเมนต์ไทย',                    issuerType: 'เอกชน',
    regNo: '0107537000114', rating: 'A+ (tris)',  contact: 'นักลงทุนสัมพันธ์',     phone: '0-2586-3333', email: 'invest@scg.com',       enabled: true,
    createdDate: '2024-10-08', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-08', code: 'KBANK', name: 'ธนาคารกสิกรไทย จำกัด (มหาชน)',          issuerType: 'ธนาคาร',
    regNo: '0107536000315', rating: 'AA+ (tris)', contact: 'ฝ่ายบริหารเงิน',       phone: '0-2888-8888', email: 'treasury@kbank.com',   enabled: true,
    createdDate: '2024-10-10', createdBy: 'ประภาส ทองสุข' },
  { id: 'ISS-09', code: 'CPALL', name: 'บมจ. ซีพี ออลล์',                       issuerType: 'เอกชน',
    regNo: '0107542000033', rating: 'A (tris)',   contact: 'นักลงทุนสัมพันธ์',     phone: '0-2071-9000', email: 'ir@cpall.co.th',       enabled: false,
    createdDate: '2024-11-15', createdBy: 'ประภาส ทองสุข' },
];

// ─── วงเงินลงทุนประจำปี ───────────────────────────────────────────────
// breakdown: วงเงินแยกตามประเภทสินทรัพย์ + ยอดที่ใช้ไปแล้ว (used)
// history: ประวัติการแก้ไขวงเงิน
const M = 1000000;
window.IV_LIMIT_SEED = [
  {
    id: 'IVL-2569', year: 2569, totalLimit: 1000 * M,
    announceDate: '2025-10-08', docRef: 'ประกาศ สอ.กสท. ที่ 42/2568', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    status: 'อนุมัติ', note: 'แผนการลงทุนประจำปีบัญชี 2569 ตามมติที่ประชุมใหญ่สามัญ',
    resolution: { meetingNo: 'ครั้งที่ 9/2568', meetingDate: '2025-09-28', agenda: 'วาระที่ 4.2', detail: 'อนุมัติแผนและวงเงินการลงทุนประจำปี 2569 รวม 1,000 ล้านบาท ตามกรอบการลงทุนของสหกรณ์' },
    breakdown: [
      { typeCode: 'GOVB', name: 'พันธบัตรรัฐบาล',        limit: 300 * M, used: 245 * M },
      { typeCode: 'SOEB', name: 'พันธบัตรรัฐวิสาหกิจ',    limit: 150 * M, used: 120 * M },
      { typeCode: 'DEBT', name: 'หุ้นกู้',               limit: 200 * M, used: 185 * M },
      { typeCode: 'STOCK',name: 'หุ้นสามัญ',             limit: 100 * M, used: 64 * M },
      { typeCode: 'FUND', name: 'หน่วยลงทุน / กองทุน',    limit: 150 * M, used: 132 * M },
      { typeCode: 'FIXD', name: 'บัญชีเงินฝากประจำ',      limit: 100 * M, used: 100 * M },
    ],
    history: [
      { ts: '2025-10-08 09:14', user: 'ประภาส ทองสุข', action: 'ตั้งวงเงิน', detail: 'ตั้งวงเงินลงทุนประจำปี 2569 รวม 1,000,000,000 บาท' },
      { ts: '2025-12-02 11:30', user: 'ประภาส ทองสุข', action: 'แก้ไข',     detail: 'ปรับวงเงินหุ้นกู้ 180 → 200 ล้านบาท (โอนจากหุ้นสามัญ)' },
      { ts: '2026-03-18 15:05', user: 'จันทร์เพ็ญ มาลี', action: 'แก้ไข',     detail: 'ปรับวงเงินหน่วยลงทุน 130 → 150 ล้านบาท' },
    ],
  },
  {
    id: 'IVL-2568', year: 2568, totalLimit: 900 * M,
    announceDate: '2024-10-10', docRef: 'ประกาศ สอ.กสท. ที่ 38/2567', approver: 'คณะกรรมการดำเนินการ ชุดที่ 47',
    status: 'ปิดปี', note: 'ปิดปีบัญชี 2568 เรียบร้อย — ใช้วงเงินไป 96.1%',
    resolution: { meetingNo: 'ครั้งที่ 9/2567', meetingDate: '2024-09-26', agenda: 'วาระที่ 4.1', detail: 'อนุมัติวงเงินการลงทุนประจำปี 2568 รวม 900 ล้านบาท' },
    breakdown: [
      { typeCode: 'GOVB', name: 'พันธบัตรรัฐบาล',        limit: 280 * M, used: 278 * M },
      { typeCode: 'SOEB', name: 'พันธบัตรรัฐวิสาหกิจ',    limit: 140 * M, used: 135 * M },
      { typeCode: 'DEBT', name: 'หุ้นกู้',               limit: 180 * M, used: 172 * M },
      { typeCode: 'STOCK',name: 'หุ้นสามัญ',             limit: 100 * M, used: 88 * M },
      { typeCode: 'FUND', name: 'หน่วยลงทุน / กองทุน',    limit: 120 * M, used: 118 * M },
      { typeCode: 'FIXD', name: 'บัญชีเงินฝากประจำ',      limit: 80 * M,  used: 74 * M },
    ],
    history: [
      { ts: '2024-10-10 10:02', user: 'ประภาส ทองสุข', action: 'ตั้งวงเงิน', detail: 'ตั้งวงเงินลงทุนประจำปี 2568 รวม 900,000,000 บาท' },
      { ts: '2025-09-30 16:40', user: 'ประภาส ทองสุข', action: 'ปิดปี',     detail: 'ปิดปีบัญชี 2568 — สรุปใช้วงเงิน 865,000,000 บาท' },
    ],
  },
  {
    id: 'IVL-2567', year: 2567, totalLimit: 800 * M,
    announceDate: '2023-10-09', docRef: 'ประกาศ สอ.กสท. ที่ 35/2566', approver: 'คณะกรรมการดำเนินการ ชุดที่ 46',
    status: 'ปิดปี', note: 'ปิดปีบัญชี 2567 เรียบร้อย',
    resolution: { meetingNo: 'ครั้งที่ 9/2566', meetingDate: '2023-09-27', agenda: 'วาระที่ 4.1', detail: 'อนุมัติวงเงินการลงทุนประจำปี 2567 รวม 800 ล้านบาท' },
    breakdown: [
      { typeCode: 'GOVB', name: 'พันธบัตรรัฐบาล',        limit: 250 * M, used: 240 * M },
      { typeCode: 'SOEB', name: 'พันธบัตรรัฐวิสาหกิจ',    limit: 120 * M, used: 116 * M },
      { typeCode: 'DEBT', name: 'หุ้นกู้',               limit: 160 * M, used: 150 * M },
      { typeCode: 'STOCK',name: 'หุ้นสามัญ',             limit: 90 * M,  used: 70 * M },
      { typeCode: 'FUND', name: 'หน่วยลงทุน / กองทุน',    limit: 110 * M, used: 102 * M },
      { typeCode: 'FIXD', name: 'บัญชีเงินฝากประจำ',      limit: 70 * M,  used: 66 * M },
    ],
    history: [
      { ts: '2023-10-09 09:30', user: 'ประภาส ทองสุข', action: 'ตั้งวงเงิน', detail: 'ตั้งวงเงินลงทุนประจำปี 2567 รวม 800,000,000 บาท' },
      { ts: '2024-09-30 16:10', user: 'ประภาส ทองสุข', action: 'ปิดปี',     detail: 'ปิดปีบัญชี 2567' },
    ],
  },
];
