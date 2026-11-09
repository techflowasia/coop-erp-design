// ═════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — นัดหมายออกสำรวจหลักทรัพย์ (Survey Appointment / SV)
//  ─ ดึงหลักทรัพย์ที่บันทึกไว้ (data-loan-collateral) มาลงนัดออกสำรวจ
//  ─ แสดงผลบนปฏิทิน (นัดหมายออกสำรวจ = เขียว, นัดหมายนิติกรรม = ฟ้า)
// ═════════════════════════════════════════════════════════════════

// วันอ้างอิง "วันนี้" ของระบบสาธิต (ตรงกับ mockup: 6 เม.ย. 2569)
window.SV_TODAY = '2026-04-06';

// ประเภทนัดหมาย
window.SV_TYPES = {
  survey: { label: 'นัดหมายออกสำรวจ', color: '#237450', bg: '#E7F3EC' },
  legal:  { label: 'นัดหมายนิติกรรม', color: '#1677FF', bg: '#E6F0FF' },
};

// เจ้าหน้าที่ผู้รับผิดชอบ
window.SV_OFFICERS = [
  { id: 'O-01', name: 'มาลี สุขใจ' },
  { id: 'O-02', name: 'วินัย ตรงเวลา' },
  { id: 'O-03', name: 'ประเสริฐ วงศ์ดี' },
  { id: 'O-04', name: 'สุดา ภักดี' },
  { id: 'O-05', name: 'อนุชา รักงาน' },
];

// ตัวเลือกเวลา
window.SV_TIMES = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

// วันหยุด/วันสำคัญ (label แสดงบนปฏิทิน)
window.SV_HOLIDAYS = {
  '2026-04-06': 'วันจักรี',
  '2026-04-13': 'วันสงกรานต์',
  '2026-04-14': 'วันสงกรานต์',
  '2026-04-15': 'วันสงกรานต์',
  '2026-05-01': 'วันแรงงานแห่งชาติ',
  '2026-05-04': 'วันฉัตรมงคล',
  '2026-06-03': 'วันเฉลิมพระชนมพรรษาฯ',
};

// ── ข้อมูลนัดหมายเริ่มต้น ──────────────────────────────────────────
function svSeed() {
  return [
    { id: 'SV-0001', type: 'survey', date: '2026-04-10', time: '09:00', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', officer: 'วินัย ตรงเวลา', assetTitle: 'โฉนดเลขที่ 12345', note: 'ที่ดินตั้งบ้านเลขที่ 128/45' },
    { id: 'SV-0005', type: 'survey', date: '2026-04-10', time: '09:00', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', officer: 'วินัย ตรงเวลา', assetTitle: 'สิ่งปลูกสร้าง BD-2567-00204', note: 'บ้านเดี่ยว 2 ชั้น บนโฉนด 12345' },
    { id: 'SV-0006', type: 'survey', date: '2026-04-10', time: '09:00', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', officer: 'วินัย ตรงเวลา', assetTitle: 'โฉนดเลขที่ 12346', note: 'แปลงติดต่อกับโฉนด 12345' },
    { id: 'SV-0002', type: 'legal',  date: '2026-04-30', time: '13:30', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', officer: 'วินัย ตรงเวลา', assetTitle: 'ห้องชุด 18/305', note: 'จดจำนอง' },
    { id: 'SV-0004', type: 'survey', date: '2026-04-16', time: '10:00', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', officer: 'มาลี สุขใจ', assetTitle: 'ห้องชุด 18/305', note: 'สำรวจห้องชุด เดอะ กรีน เรสซิเดนซ์ อาคาร A ชั้น 3' },
    { id: 'SV-0007', type: 'survey', date: '2026-04-24', time: '13:30', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', officer: 'ประเสริฐ วงศ์ดี', assetTitle: 'โฉนดเลขที่ 1180', note: 'ที่ดินเกษตร ลาดหลุมแก้ว' },
    { id: 'SV-0003', type: 'survey', date: '2026-04-20', time: '09:00', memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ', officer: 'วินัย ตรงเวลา', assetTitle: 'นส3ก-1180', note: '' },
  ];
}

window.svLoad = function () {
  try {
    const raw = localStorage.getItem('lc_survey_appts');
    if (raw) {
      let list = JSON.parse(raw);
      // เพิ่มตัวอย่างนัดออกสำรวจห้องชุด (ครั้งเดียว)
      if (!localStorage.getItem('lc_survey_condo_demo_v1')) {
        const demo = svSeed().find(a => a.id === 'SV-0004');
        if (!list.some(a => a.id === demo.id)) { list = [...list, demo]; localStorage.setItem('lc_survey_appts', JSON.stringify(list)); }
        localStorage.setItem('lc_survey_condo_demo_v1', '1');
      }
      // v2: ข้อมูลตัวอย่างให้ตรงทะเบียนสมาชิก/หลักทรัพย์ (ครั้งเดียว — คงนัดหมายที่ผู้ใช้สร้างเอง)
      if (!localStorage.getItem('lc_survey_seed_v2')) {
        const seed = svSeed(), ids = seed.map(x => x.id);
        list = [...seed, ...list.filter(a => !ids.includes(a.id) && !/^SV-000\d$/.test(a.id))];
        localStorage.setItem('lc_survey_appts', JSON.stringify(list));
        localStorage.setItem('lc_survey_seed_v2', '1');
      }
      return list;
    }
  } catch (e) {}
  try { localStorage.setItem('lc_survey_seed_v2', '1'); } catch (e) {}
  const seed = svSeed();
  try { localStorage.setItem('lc_survey_appts', JSON.stringify(seed)); } catch (e) {}
  return seed;
};
window.svSave = function (list) {
  try { localStorage.setItem('lc_survey_appts', JSON.stringify(list)); } catch (e) {}
};
let __svSeq = 100;
window.svNextId = function () { return 'SV-' + String(++__svSeq).padStart(4, '0'); };

// ชื่อย่อสำหรับป้ายบนปฏิทิน: "พีรพล จันทร์เพ็ญ" → "พีรพล จ."
window.svShortName = function (name) {
  const s = String(name || '').trim().replace(/^(นาย|นาง|นางสาว)\s*/, '');
  const sp = s.indexOf(' ');
  return sp === -1 ? s : s.slice(0, sp) + ' ' + s.slice(sp + 1, sp + 2) + '.';
};

// ── สรุปผลสำรวจหลักทรัพย์ (Survey Result) ──────────────────────────
// เก็บผลสำรวจแยกตามหลักทรัพย์ (assetId) : ราคาประเมิน + เอกสาร/ภาพ + หมายเหตุ
window.svResultLoad = function () {
  try { const raw = localStorage.getItem('lc_survey_results'); if (raw) return JSON.parse(raw); } catch (e) {}
  return {};
};
window.svResultSave = function (map) {
  try { localStorage.setItem('lc_survey_results', JSON.stringify(map)); } catch (e) {}
};

// รายการหลักทรัพย์ที่ "รอออกสำรวจ" ของสมาชิก — ดึงจากนัดหมายออกสำรวจ (type=survey)
// จับคู่นัดหมายกับหลักทรัพย์ที่บันทึกไว้ (lcOf) ด้วยชื่อหลักทรัพย์
window.svSurveyTargets = function (memberCode) {
  const appts = window.svLoad().filter(a => a.type === 'survey' && a.memberCode === memberCode);
  const assets = window.lcOf ? window.lcOf(memberCode) : [];
  const results = window.svResultLoad();
  return appts.map(ap => {
    const asset = assets.find(x => window.lcAssetTitle && window.lcAssetTitle(x) === ap.assetTitle) || null;
    const key = asset ? asset.id : ap.id;
    return { appt: ap, asset, result: results[key] || null, key };
  });
};

