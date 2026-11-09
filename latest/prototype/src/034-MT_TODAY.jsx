// ════════════════════════════════════════════════════════════════════
//  ข้อมูล — ย้ายสังกัดสมาชิก (Member Affiliation Transfer)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  ใช้ DN_MEMBERS เป็นแหล่งข้อมูลสมาชิก (มี dept/deptCode/status)
//  ใช้ DEPARTMENTS เป็นรายการสังกัด/หน่วยงานปลายทาง
// ════════════════════════════════════════════════════════════════════

// ─── วันทำการ / ผู้ป้อน ─────────────────────────────────────────────
window.MT_TODAY = (typeof window.DEPOSIT_WORKING_DATE === 'string' && window.DEPOSIT_WORKING_DATE) || '2026-06-21';
window.mtToday = () => window.MT_TODAY;
window.MT_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';
window.mtBeYear = (iso) => new Date(iso || window.MT_TODAY).getFullYear() + 543;

// ─── เลขที่เอกสารย้ายสังกัด (auto) — MT-{พ.ศ.}-{running 6 หลัก} ──────
window.mtNextDocNo = (beYear) => {
  const yy = beYear || window.mtBeYear();
  const running = 124 + Math.floor(Math.random() * 3); // เดโม: เลขรันถัดไป
  return `MT-${yy}-${String(running).padStart(6, '0')}`;
};

// ─── งวดเริ่มมีผล (auto) — พ.ศ.(4) + เดือน(2) เช่น 256907 ───────────
window.mtCurrentPeriod = (iso) => {
  const d = new Date(iso || window.MT_TODAY);
  return `${d.getFullYear() + 543}${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── ประวัติการโอนย้ายต่อสมาชิก (seed) ──────────────────────────────
//  rows: { date, detail, note }  (ใหม่อยู่บนสุด)
window.MT_HISTORY = {
  'M-067012': [
    { date: '2022-01-01', detail: 'ย้ายจาก กองโยธา (0303) ไปยัง กองช่าง · กลุ่มงานโยธา (0301)', note: 'ปรับปรุงโครงสร้างองค์กร' },
    { date: '2018-05-01', detail: 'รับเข้าร่วมเป็นสมาชิก — สังกัด กองโยธา (0303)', note: 'เริ่มต้นเป็นสมาชิก' },
  ],
  'M-066238': [
    { date: '2019-10-15', detail: 'ย้ายจาก สำนักปลัด (0101) ไปยัง กองการศึกษา · กลุ่มงานส่งเสริมการศึกษา (0501)', note: 'ย้ายตามคำร้องของสมาชิก' },
    { date: '2016-02-15', detail: 'รับเข้าร่วมเป็นสมาชิก — สังกัด สำนักปลัด (0101)', note: 'เริ่มต้นเป็นสมาชิก' },
  ],
  'M-065471': [
    { date: '2011-09-01', detail: 'รับเข้าร่วมเป็นสมาชิก — สังกัด กองคลัง สำนักงานปลัด (0801)', note: 'เริ่มต้นเป็นสมาชิก' },
  ],
};
window.mtHistory = (code, member) => {
  const seed = window.MT_HISTORY[code];
  if (seed) return seed;
  // ดีฟอลต์ — สำหรับสมาชิกที่ยังไม่มีประวัติย้ายสังกัด
  if (!member) return [];
  return [{
    date: member.joinDate || '2017-05-10',
    detail: `รับเข้าร่วมเป็นสมาชิก — สังกัด ${member.dept || '—'}${member.deptCode ? ` (${member.deptCode})` : ''}`,
    note: 'เริ่มต้นเป็นสมาชิก',
  }];
};

// ─── สถานะสมาชิกที่อนุญาตให้ทำรายการ ───────────────────────────────
window.mtIsActive = (status) => status === 'ปกติ';
