// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ › ค่าคงที่ — ต้นสังกัด (Affiliation / Department)
//  ค่าคงที่พื้นฐานของระบบ: รหัสต้นสังกัด · ชื่อสังกัด · หน่วยงาน/กลุ่มงาน ·
//  หัวหน้าสังกัด · สถานะใช้งาน · หมายเหตุ
//  เป็นแหล่งข้อมูลกลาง (single source of truth) ที่ทุกเมนูซึ่งแสดง "ต้นสังกัด"
//  เรียกใช้ร่วมกัน — แก้ที่นี่แล้วมีผลกับทุกหน้าจอที่อ้างอิงรหัสสังกัด
// ════════════════════════════════════════════════════════════════════

// ─── รายการต้นสังกัดตั้งต้น (seed) ───────────────────────────────────
window.AFFIL_SEED = [
  { id: 'AF-0101', code: '0101', name: 'สำนักปลัด',            unit: 'งานบริหารทั่วไป',          head: 'นายประภาส วงศ์อนันต์',   enabled: true, note: '' },
  { id: 'AF-0102', code: '0102', name: 'สำนักปลัด',            unit: 'งานนโยบายและแผน',         head: 'นางสุภาพร เกษมสุข',      enabled: true, note: '' },
  { id: 'AF-0301', code: '0301', name: 'กองช่าง',              unit: 'กลุ่มงานโยธา',            head: 'นายสุรชัย วงศ์ประเสริฐ', enabled: true, note: '' },
  { id: 'AF-0302', code: '0302', name: 'กองช่าง',              unit: 'กลุ่มงานผังเมือง',         head: 'นายอนุชา สุขสวัสดิ์',    enabled: true, note: '' },
  { id: 'AF-0501', code: '0501', name: 'กองการศึกษา',          unit: 'กลุ่มงานส่งเสริมการศึกษา',  head: 'นางสาวศิริพร ใจงาม',     enabled: true, note: '' },
  { id: 'AF-0601', code: '0601', name: 'กองสาธารณสุข',         unit: 'กลุ่มงานบริการสาธารณสุข',   head: 'นายภาคภูมิ รัตนา',       enabled: true, note: '' },
  { id: 'AF-0801', code: '0801', name: 'กองคลัง สำนักงานปลัด', unit: 'กลุ่มงานบัญชีและงบประมาณ',  head: 'นางวิภา จันทร์เพ็ญ',     enabled: true, note: '' },
  { id: 'AF-0802', code: '0802', name: 'กองคลัง สำนักงานปลัด', unit: 'กลุ่มงานพัสดุและทรัพย์สิน',  head: 'นายธีรพงษ์ ขำเพชร',      enabled: true, note: '' },
  { id: 'AF-0901', code: '0901', name: 'กองสวัสดิการสังคม',     unit: 'งานสังคมสงเคราะห์',        head: 'นางอรอนงค์ บุญมาก',      enabled: true, note: '' },
];

const AFFIL_LS = 'coop_affiliations_v1';

window.affilLoad = function () {
  try {
    const saved = localStorage.getItem(AFFIL_LS);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.AFFIL_SEED || []).map(d => ({ ...d }));
};
window.affilSave = function (list) {
  try { localStorage.setItem(AFFIL_LS, JSON.stringify(list)); } catch (e) {}
  window.affilSyncDepartments(list);
};

// ทำให้ window.DEPARTMENTS (ที่ popup/ตัวค้นหาสังกัดทั่วระบบใช้อยู่) สะท้อน
// ค่าคงที่ล่าสุดเสมอ — เฉพาะรายการที่เปิดใช้งาน
window.affilSyncDepartments = function (list) {
  const src = list || window.affilLoad();
  window.DEPARTMENTS = src
    .filter(d => d.enabled !== false)
    .map(d => ({ code: d.code, name: d.name, unit: d.unit, head: d.head }));
};

// ─── Lookup helpers (ใช้ร่วมทุกเมนู) ─────────────────────────────────
window.affilByCode = function (code) {
  if (!code) return null;
  const c = String(code).trim();
  return (window.affilLoad() || []).find(d => String(d.code) === c) || null;
};

// รูปแบบมาตรฐานการแสดงต้นสังกัด: "รหัส · ชื่อสังกัด"
//  affilLabel('0301')                 → "0301 · กองช่าง"
//  affilLabel('0301', 'กองช่าง')       → "0301 · กองช่าง"  (ใช้ชื่อ fallback ถ้าไม่พบใน master)
//  affilLabel('', 'กองช่าง')           → "กองช่าง"
window.affilLabel = function (code, fallbackName) {
  const c = code != null ? String(code).trim() : '';
  const rec = c ? window.affilByCode(c) : null;
  const name = (rec && rec.name) || fallbackName || '';
  if (c && name) return `${c} · ${name}`;
  if (c) return c;
  return name || '—';
};

// เดินตามข้อมูลสมาชิก (มี .deptCode/.dept) → "รหัส · ชื่อสังกัด"
window.affilMemberLabel = function (m) {
  if (!m) return '—';
  return window.affilLabel(m.deptCode, m.dept || m.department);
};

// นับจำนวนสมาชิกในทะเบียนที่อ้างอิงรหัสสังกัดนี้ (แสดงการเรียกใช้งานจริง)
window.affilUsage = function (code) {
  const c = String(code).trim();
  const lists = [window.DN_MEMBERS, window.MEMBERS_LIST].filter(Boolean);
  const seen = new Set();
  let n = 0;
  for (const arr of lists) {
    for (const m of arr) {
      if (String(m.deptCode) === c && !seen.has(m.code)) { seen.add(m.code); n++; }
    }
  }
  return n;
};

// sync ทันทีตอนโหลดไฟล์ เพื่อให้ทั้งระบบใช้ค่าคงที่ล่าสุด
window.affilSyncDepartments(window.affilLoad());
