// ═════════════════════════════════════════════════════════════════
//  อายัดตามหมายศาล — ข้อมูล / ค่าคงที่ / helpers
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  บันทึกการอายัดเงินปันผล/เฉลี่ยคืนของสมาชิกตามคำสั่งศาล/บังคับคดี
//  ใช้ฐานสมาชิก window.DN_MEMBERS ร่วมกับ แจ้งให้ชำระหนี้
// ═════════════════════════════════════════════════════════════════

window.CS_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'Chaiwat';
window.csToday = () => new Date().toISOString().slice(0, 10);

// ─── ประเภทการอายัด ───────────────────────────────────────────────
//  ควบคุมว่าเงินประเภทใดของสมาชิกจะถูกอายัดตอนจ่าย
window.CS_SEIZE_TYPES = [
  { v: '1', l: '1-ปันผล + เฉลี่ยคืน', blocks: ['ปันผล', 'เฉลี่ยคืน'] },
  { v: '2', l: '2-เฉพาะปันผล',        blocks: ['ปันผล'] },
  { v: '3', l: '3-เฉพาะเฉลี่ยคืน',    blocks: ['เฉลี่ยคืน'] },
];
window.csSeizeType = (v) => window.CS_SEIZE_TYPES.find(t => t.v === v) || { v, l: v, blocks: [] };

// ─── สถานะหมายอายัด ───────────────────────────────────────────────
window.CS_STATUS = [
  { v: 'active',    l: 'อายัดอยู่',   pill: 'ok',      dot: 'var(--success, #1F8A5B)' },
  { v: 'withdrawn', l: 'ถอนอายัด',    pill: 'neutral', dot: 'var(--text-faint, #94a3b8)' },
  { v: 'cancelled', l: 'ยกเลิก',      pill: 'bad',     dot: 'var(--danger, #c0392b)' },
  { v: 'ended',     l: 'สิ้นสุดอายัด', pill: 'info',    dot: 'var(--info, #2A6FDB)' },
];
window.csStatus = (v) => window.CS_STATUS.find(s => s.v === v) || { v, l: v, pill: 'neutral', dot: '#94a3b8' };

// ─── สำนักงานบังคับคดี (Dropdown — กันสะกดไม่ตรงกัน) ────────────────
window.CS_EXEC_OFFICES = [
  'สำนักงานบังคับคดีแพ่งกรุงเทพมหานคร 1',
  'สำนักงานบังคับคดีแพ่งกรุงเทพมหานคร 2',
  'สำนักงานบังคับคดีแพ่งกรุงเทพมหานคร 3',
  'สำนักงานบังคับคดีจังหวัดนนทบุรี',
  'สำนักงานบังคับคดีจังหวัดปทุมธานี',
  'สำนักงานบังคับคดีจังหวัดสมุทรปราการ',
  'สำนักงานบังคับคดีจังหวัดนครปฐม',
  'สำนักงานบังคับคดีจังหวัดชลบุรี',
];

// ─── ตัวอย่างศาล (datalist ช่วยกรอก) ───────────────────────────────
window.CS_COURTS = [
  'ศาลแพ่งกรุงเทพใต้', 'ศาลแพ่งพระโขนง', 'ศาลแพ่งธนบุรี',
  'ศาลจังหวัดธนบุรี', 'ศาลแขวงบางกอกน้อย', 'ศาลแขวงพระนครใต้',
  'ศาลจังหวัดนนทบุรี', 'ศาลจังหวัดสมุทรปราการ',
];

// ─── สร้างเลขที่คำขอ (Auto) — AR + ปีพ.ศ.2หลัก + เดือน + running ─────
window.csNextReqNo = (list) => {
  const d = new Date();
  const be = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const prefix = `AR${be}${mm}`;
  const n = ((list || []).reduce((mx, r) => {
    const m = r.reqNo && r.reqNo.match(/-(\d+)$/); return m ? Math.max(mx, Number(m[1])) : mx;
  }, 0)) + 1;
  return `${prefix}-${String(n).padStart(6, '0')}`;
};

// ─── แปลง ISO → วันที่ไทย dd/mm/(ปีพ.ศ.) ───────────────────────────
window.csBeDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso); if (isNaN(d)) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear() + 543}`;
};
window.csBeDateTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso); if (isNaN(d)) return '-';
  return `${window.csBeDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ─── LocalStorage ─────────────────────────────────────────────────
const CS_LS = 'coop.courtSeizure.v1';
window.csLoad = () => {
  try { const raw = localStorage.getItem(CS_LS); if (raw) return JSON.parse(raw); }
  catch (e) { /* ignore */ }
  return window.CS_SEED.map(r => ({ ...r }));
};
window.csSaveLS = (list) => {
  try { localStorage.setItem(CS_LS, JSON.stringify(list)); } catch (e) { /* ignore */ }
};

// ─── ข้อมูลตั้งต้น (seed) — อ้างอิงสมาชิกจาก DN_MEMBERS ─────────────
(function seedCourtSeizure() {
  const M = (window.DN_MEMBERS || []);
  const m1 = M.find(m => m.code === 'M-067012') || M[0];
  const m2 = M.find(m => m.code === 'M-066238') || M[1] || M[0];
  const m3 = M.find(m => m.code === 'M-065471') || M[2] || M[0];

  const mk = (o) => ({
    execOffice: '', redCaseNo: '', plaintiff: '', note: '',
    withdrawRecvDate: '', withdrawRecvNo: '', withdrawLetterNo: '', withdrawDate: '',
    ...o,
  });

  window.CS_SEED = [
    mk({
      reqNo: 'AR6707-000123', memberCode: m1.code, memberName: m1.name,
      dept: m1.dept, deptCode: m1.deptCode, memberStatus: m1.status,
      seizeType: '1', status: 'active',
      recvDate: '2026-07-01', recvNo: 'สอ.0451/2569', letterNo: 'อ.1204/2569', seizeDate: '2026-07-01',
      redCaseNo: 'ผ.1123/2569', plaintiff: 'ธนาคารกรุงไทย จำกัด (มหาชน)',
      court: 'ศาลแพ่งกรุงเทพใต้', execOffice: 'สำนักงานบังคับคดีแพ่งกรุงเทพมหานคร 1',
      note: 'อายัดเงินปันผลและเฉลี่ยคืนตามคำสั่งอายัดชั่วคราวก่อนพิพากษา',
      enteredBy: 'Chaiwat', enteredAt: '2026-07-01T10:15',
    }),
    mk({
      reqNo: 'AR6706-000098', memberCode: m2.code, memberName: m2.name,
      dept: m2.dept, deptCode: m2.deptCode, memberStatus: m2.status,
      seizeType: '2', status: 'withdrawn',
      recvDate: '2026-06-20', recvNo: 'สอ.0388/2569', letterNo: 'อ.0977/2569', seizeDate: '2026-06-20',
      withdrawRecvDate: '2026-06-25', withdrawRecvNo: 'สอ.0402/2569',
      withdrawLetterNo: 'ถอน.145/2569', withdrawDate: '2026-06-25',
      redCaseNo: 'ผ.0891/2569', plaintiff: 'บริษัท บัตรกรุงไทย จำกัด (มหาชน)',
      court: 'ศาลจังหวัดธนบุรี', execOffice: 'สำนักงานบังคับคดีจังหวัดนนทบุรี',
      note: 'ถอนอายัดตามหนังสือถอนของสำนักงานบังคับคดี (คู่ความตกลงชำระหนี้)',
      enteredBy: 'Somchai', enteredAt: '2026-06-20T09:30',
    }),
    mk({
      reqNo: 'AR6705-000076', memberCode: m3.code, memberName: m3.name,
      dept: m3.dept, deptCode: m3.deptCode, memberStatus: m3.status,
      seizeType: '3', status: 'active',
      recvDate: '2026-05-10', recvNo: 'สอ.0290/2569', letterNo: 'อ.0714/2569', seizeDate: '2026-05-10',
      redCaseNo: 'ผ.0620/2569', plaintiff: 'บริษัท อยุธยา แคปปิตอล จำกัด',
      court: 'ศาลแขวงบางกอกน้อย', execOffice: 'สำนักงานบังคับคดีจังหวัดปทุมธานี',
      note: 'อายัดเฉพาะเงินเฉลี่ยคืน — เงินปันผลจ่ายได้ตามปกติ',
      enteredBy: 'Chaiwat', enteredAt: '2026-05-10T11:45',
    }),
  ];
})();
