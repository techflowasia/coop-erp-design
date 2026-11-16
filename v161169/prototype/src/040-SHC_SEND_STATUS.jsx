// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ใบเปลี่ยนแปลงค่าหุ้น
//  ข้อมูลสาธิต: สถานะการส่งหุ้น · รายละเอียดหุ้นรายสมาชิก · ประวัติ
//  ใช้สมาชิกจาก DN_MEMBERS (data-debt-notice.js)
// ════════════════════════════════════════════════════════════════════

// ─── สถานะการส่งหุ้น ─────────────────────────────────────────────────
window.SHC_SEND_STATUS = [
  { v: 'normal', l: 'ส่งหุ้นปกติ',   pill: 'ok'   },
  { v: 'change', l: 'เปลี่ยนยอดส่ง', pill: 'info' },
  { v: 'waive',  l: 'งดส่ง',         pill: 'warn' },
  { v: 'stop',   l: 'หยุดส่ง',       pill: 'bad'  },
];
window.shcSendStatus = (v) => window.SHC_SEND_STATUS.find(s => s.v === v) || window.SHC_SEND_STATUS[0];

// ─── สถานะรายการ (workflow ของใบเปลี่ยนแปลง) ────────────────────────
window.SHC_REQ_STATUS = [
  { v: 'draft',     l: 'ร่าง',        pill: 'neutral' },
  { v: 'pending',   l: 'รออนุมัติ',    pill: 'warn'    },
  { v: 'approved',  l: 'อนุมัติแล้ว',   pill: 'ok'      },
  { v: 'cancelled', l: 'ยกเลิก',       pill: 'neutral' },
];
window.shcReqStatus = (v) => window.SHC_REQ_STATUS.find(s => s.v === v) || window.SHC_REQ_STATUS[0];

// ─── หัวข้อหมายเหตุยอดนิยม (เติมช่องหมายเหตุได้เร็ว) ──────────────────
window.SHC_NOTE_PRESETS = [
  'สมาชิกขอเพิ่มค่าหุ้นรายเดือน',
  'สมาชิกขอลดค่าหุ้นรายเดือน',
  'เปลี่ยนตามฐานเงินเดือนใหม่',
  'ปรับตามมติ/ระเบียบของสหกรณ์',
  'เจ้าหน้าที่บันทึกแก้ไขตามเอกสารคำขอ',
];

// ─── เพดานค่าหุ้น/เดือน (เงื่อนไขตรวจสอบขั้นต่ำ–ขั้นสูง) ───────────────
window.SHC_MIN_PER_MONTH = 100;      // ขั้นต่ำ/เดือน (บาท)
window.SHC_MAX_PER_MONTH = 30000;    // ขั้นสูง/เดือน (บาท)

// ─── ผู้บันทึก (ล็อกอินปัจจุบัน) ─────────────────────────────────────
window.SHC_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── ข้อมูลหุ้นรายสมาชิก (enrich) — เติมฟิลด์ที่หน้าจอต้องใช้ ──────────
//  อ้างอิงสมาชิกจาก DN_MEMBERS แล้วเติม: เงินเดือน · หุ้นยกมาต้นปี ·
//  งวดหุ้น · หุ้นฐาน/เดือน · สถานะการส่งปัจจุบัน · ค่าหุ้นปัจจุบัน/เดือน
window.SHC_MEMBER_EXTRA = {
  'M-067012': { salary: 35000, carryover: 120000, term: 240, baseShare: 700,  sendStatus: 'normal', perMonth: 1000 },
  'M-066238': { salary: 28500, carryover: 78000,  term: 210, baseShare: 570,  sendStatus: 'waive',  perMonth: 0    },
  'M-065471': { salary: 41200, carryover: 110000, term: 268, baseShare: 820,  sendStatus: 'stop',   perMonth: 0    },
  'M-064120': { salary: 32000, carryover: 52000,  term: 156, baseShare: 640,  sendStatus: 'normal', perMonth: 800  },
};
window.shcShareInfo = (m) => {
  if (!m) return null;
  const x = window.SHC_MEMBER_EXTRA[m.code] || {};
  return {
    salary:      x.salary != null ? x.salary : 25000,
    accumulated: m.shares || 0,            // หุ้นสะสม (ทุนเรือนหุ้น)
    carryover:   x.carryover != null ? x.carryover : 0,
    term:        x.term != null ? x.term : 120,
    baseShare:   x.baseShare != null ? x.baseShare : 600,
    sendStatus:  x.sendStatus || 'normal',
    perMonth:    x.perMonth != null ? x.perMonth : 600,
  };
};

// ─── ประวัติการเปลี่ยนแปลงค่าหุ้น (ต่อสมาชิก) ────────────────────────
window.SHC_HISTORY = {
  'M-067012': [
    { docNo: 'CHG-2568-000456', shareCapital: 450000, term: 240, perMonth: 1500, status: 'approved', sendStatus: 'change', note: 'ปรับเพิ่มตามคำร้อง',  recordedAt: '2025-12-10 10:15' },
    { docNo: 'CHG-2567-000321', shareCapital: 400000, term: 240, perMonth: 1200, status: 'approved', sendStatus: 'change', note: 'ปรับเพิ่ม',           recordedAt: '2024-08-15 14:30' },
    { docNo: 'CHG-2566-000210', shareCapital: 360000, term: 240, perMonth: 1000, status: 'approved', sendStatus: 'normal', note: 'เริ่มต้นส่งหุ้น',     recordedAt: '2023-04-01 09:05' },
  ],
  'M-066238': [
    { docNo: 'CHG-2568-000402', shareCapital: 92000,  term: 210, perMonth: 0,    status: 'approved', sendStatus: 'waive',  note: 'งดส่งระหว่างลาออก',  recordedAt: '2025-09-02 11:20' },
    { docNo: 'CHG-2566-000150', shareCapital: 80000,  term: 198, perMonth: 800,  status: 'approved', sendStatus: 'normal', note: 'ส่งหุ้นปกติ',         recordedAt: '2023-03-18 13:45' },
  ],
  'M-065471': [
    { docNo: 'CHG-2567-000288', shareCapital: 134500, term: 268, perMonth: 0,    status: 'approved', sendStatus: 'stop',   note: 'หยุดส่ง (เสียชีวิต)', recordedAt: '2024-04-30 15:00' },
  ],
  'M-064120': [
    { docNo: 'CHG-2568-000511', shareCapital: 52000,  term: 156, perMonth: 800,  status: 'approved', sendStatus: 'normal', note: 'ปรับตามฐานเงินเดือน', recordedAt: '2025-11-22 09:40' },
  ],
};
window.shcHistory = (code) => window.SHC_HISTORY[code] || [];

// ─── เลขที่ใบเปลี่ยนแปลง (auto) — DOC-CHG-{พ.ศ.}-{running 6 หลัก} ──────
window.shcNextDocNo = (beYear) => {
  const list = window.SHC_HISTORY['M-067012'] || [];
  const running = 123 + (list.length || 0); // เดโม: เลขรันถัดไป
  return `DOC-CHG-${beYear}-${String(running).padStart(6, '0')}`;
};
