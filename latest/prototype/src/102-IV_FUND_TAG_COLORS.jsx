// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › ค่าคงที่ — กำหนดแหล่งเงิน / Tagging
//  แหล่งเงินที่ใช้ลงทุน (Fund Source) พร้อมวงเงินประจำปี · GL · สี Tag
//  ใช้จับคู่กับรายการลงทุน (IV_FUND_TAGS เดิมยังคงอ้างอิง .tag/.color ได้)
// ════════════════════════════════════════════════════════════════════

window.IV_FUND_TAG_COLORS = ['primary', 'info', 'warning', 'success', 'danger', 'neutral'];

window.IV_FUND_TAG_SEED = [
  { id: 'FT-01', code: 'OPR', tag: 'ทุนดำเนินงาน', color: 'primary',
    annualLimit: 800000000, used: 612000000, glCode: '11030101',
    note: 'เงินทุนหมุนเวียนจากการดำเนินงานปกติ', enabled: true,
    createdDate: '2019-01-05', createdBy: 'ประภาส ทองสุข' },
  { id: 'FT-02', code: 'RSV', tag: 'ทุนสำรอง', color: 'info',
    annualLimit: 350000000, used: 280000000, glCode: '11030102',
    note: 'ทุนสำรองตามกฎหมาย — ลงทุนความเสี่ยงต่ำเท่านั้น', enabled: true,
    createdDate: '2019-01-05', createdBy: 'ประภาส ทองสุข' },
  { id: 'FT-03', code: 'DEP', tag: 'เงินรับฝาก', color: 'warning',
    annualLimit: 1200000000, used: 1045000000, glCode: '11030103',
    note: 'เงินรับฝากจากสมาชิก — บริหารสภาพคล่องระยะสั้น', enabled: true,
    createdDate: '2019-01-05', createdBy: 'ประภาส ทองสุข' },
  { id: 'FT-04', code: 'SPC', tag: 'ทุนสะสมพิเศษ', color: 'success',
    annualLimit: 200000000, used: 96000000, glCode: '11030104',
    note: 'ทุนสะสมตามมติที่ประชุมใหญ่', enabled: true,
    createdDate: '2021-03-01', createdBy: 'จันทร์เพ็ญ มาลี' },
  { id: 'FT-05', code: 'GRT', tag: 'เงินรับบริจาค / กองทุน', color: 'neutral',
    annualLimit: 50000000, used: 0, glCode: '11030105',
    note: 'รอเปิดใช้งานปีบัญชี 2570', enabled: false,
    createdDate: '2025-11-01', createdBy: 'จันทร์เพ็ญ มาลี' },
];

window.ivFundTagLoad = function () {
  try { const s = localStorage.getItem('invest_fund_tags'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.IV_FUND_TAG_SEED));
};
window.ivFundTagSave = function (l) { try { localStorage.setItem('invest_fund_tags', JSON.stringify(l)); } catch (e) {} };
