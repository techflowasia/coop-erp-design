// ════════════════════════════════════════════════════════════════════
//  ระบบงานสวัสดิการสมาชิก — ค่าคงที่: กำหนดจำนวนทุนการศึกษา
//  กำหนดจำนวนผู้รับทุน + จำนวนเงินต่อทุน แยกตามปี / ประเภททุน / ระดับชั้น
// ════════════════════════════════════════════════════════════════════

// ── ตัวเลือก (Dropdown) ──────────────────────────────────────────────
window.SCH_OPTS = {
  // ประเภททุนการศึกษา
  scholarType: [
    { v: '1', l: '1-ทุนช่วยเหลือการศึกษา' },
    { v: '2', l: '2-ทุนเรียนดี' },
    { v: '3', l: '3-ทุนส่งเสริมการศึกษาบุตร' },
    { v: '4', l: '4-ทุนผู้ด้อยโอกาส' },
  ],
  // ระดับชั้นการศึกษา
  eduLevel: [
    { v: '0', l: '0-อนุบาล' },
    { v: '1', l: '1-ประถมศึกษา' },
    { v: '2', l: '2-มัธยมศึกษาตอนต้น' },
    { v: '3', l: '3-มัธยมศึกษาตอนปลาย / ปวช.' },
    { v: '4', l: '4-ปวช.' },
    { v: '5', l: '5-ปวส. / อนุปริญญา' },
    { v: '6', l: '6-ปริญญาตรี' },
    { v: '7', l: '7-สูงกว่าปริญญาตรี' },
  ],
};

// ระดับชั้นสำหรับเมนู "กำหนดจำนวนทุนการศึกษา" — ม.ปลายและ ปวช. ถือเป็นระดับ
// ชั้นเดียวกัน (value '3') จึงไม่แสดง '4-ปวช.' เป็นแถวแยก แต่ยังคงค่าคงที่
// '4-ปวช.' ไว้ใน SCH_OPTS.eduLevel เพื่อให้ schLabel แปลงค่าเดิมได้
window.SCH_EDU_LEVEL_CONFIG = window.SCH_OPTS.eduLevel.filter(o => o.v !== '4');

// แปลงค่า → ป้ายชื่อแสดงผล
window.schLabel = (group, v) => {
  const o = (window.SCH_OPTS[group] || []).find(x => x.v === String(v));
  return o ? o.l : v;
};

// ── แปลงเกณฑ์ผลการเรียน เกรดเฉลี่ย (เต็ม 4) ↔ ร้อยละ (เชิงเส้น) ────────
//  ใช้ร่วมกับเมนูกำหนดจำนวนทุน และฟอร์มคำขอ — กรอกช่องใดอีกช่องคำนวณตาม
window.schGradeToPct = (g) => (g === '' || g == null || !isFinite(parseFloat(g))) ? '' : +(parseFloat(g) / 4 * 100).toFixed(2);
window.schPctToGrade = (p) => (p === '' || p == null || !isFinite(parseFloat(p))) ? '' : +(parseFloat(p) / 100 * 4).toFixed(2);

// ── รหัสเลขเอกสารคำขอ แยกตามประเภททุนการศึกษา ────────────────────────
//  กำหนดในเมนู "กำหนดจำนวนทุนการศึกษา" · ใช้สร้างเลขใบคำขอในเมนูคำขอทุน
//  เลขใบคำขอ = <รหัส>-<ปีพ.ศ.>-<ลำดับ 4 หลัก> (ลำดับแยกตามรหัส+ปี)
window.SCH_DOCCODE_SEED = {
  '1': 'WS',   // ทุนช่วยเหลือการศึกษา
  '2': 'WD',   // ทุนเรียนดี
  '3': 'WG',   // ทุนส่งเสริมการศึกษาบุตร
  '4': 'WU',   // ทุนผู้ด้อยโอกาส
};
window.schDocCodeLoad = () => {
  try { const s = localStorage.getItem('scholarship_doccode'); if (s) return { ...window.SCH_DOCCODE_SEED, ...JSON.parse(s) }; } catch (e) {}
  return { ...window.SCH_DOCCODE_SEED };
};
window.schDocCodeSave = (map) => {
  try { localStorage.setItem('scholarship_doccode', JSON.stringify(map)); } catch (e) {}
};
// รหัสเลขเอกสารของประเภททุน (ค่าเริ่มต้น WS)
window.schDocCode = (scholarType) => {
  const map = window.schDocCodeLoad();
  return (map[String(scholarType)] || 'WS').toUpperCase();
};

// ── ข้อมูลตั้งต้น (ปี 2569) ───────────────────────────────────────────
//  minGpa / minPercent = เกณฑ์ขั้นต่ำผลการเรียนบุตร (สัมพันธ์กันเชิงเส้น)
window.SCH_SEED = [
  { id: 'SCH-001', year: 2569, scholarType: '1', eduLevel: '0', quota: 20, amountEach: 1500.00, minGpa: 0,    minPercent: 0,    lastSeq: 18 },
  { id: 'SCH-002', year: 2569, scholarType: '1', eduLevel: '1', quota: 35, amountEach: 2000.00, minGpa: 2.00, minPercent: 50.00, lastSeq: 33 },
  { id: 'SCH-003', year: 2569, scholarType: '1', eduLevel: '2', quota: 30, amountEach: 2500.00, minGpa: 2.50, minPercent: 62.50, lastSeq: 27 },
  { id: 'SCH-004', year: 2569, scholarType: '1', eduLevel: '3', quota: 25, amountEach: 3000.00, minGpa: 2.50, minPercent: 62.50, lastSeq: 24 },
  { id: 'SCH-005', year: 2569, scholarType: '1', eduLevel: '6', quota: 15, amountEach: 5000.00, minGpa: 2.75, minPercent: 68.75, lastSeq: 12 },
  { id: 'SCH-006', year: 2569, scholarType: '2', eduLevel: '3', quota: 10, amountEach: 4000.00, minGpa: 3.25, minPercent: 81.25, lastSeq: 9 },
  { id: 'SCH-007', year: 2569, scholarType: '2', eduLevel: '6', quota: 8,  amountEach: 8000.00, minGpa: 3.50, minPercent: 87.50, lastSeq: 7 },
];
