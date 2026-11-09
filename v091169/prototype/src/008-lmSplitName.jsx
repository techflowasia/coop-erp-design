// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน (ชุดเพิ่มเติม)
//  ข้อมูลและตัวเลือกร่วมของ 3 หน้าจอ:
//   • วัตถุประสงค์การกู้ (ออกหนังสือรับรองดอกเบี้ยลดหย่อนภาษี)
//   • ขอส่งคืนคำขอกู้
//   • โอนปันผล–เข้ารับจ่าย
// ════════════════════════════════════════════════════════════════════

// ─── แยกคำนำหน้า/ชื่อ/นามสกุล จากชื่อเต็ม ───────────────────────────
window.lmSplitName = (full) => {
  const m = String(full).match(/^(นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)?\s*(.*)$/);
  const title = m[1] || '';
  const rest = (m[2] || '').trim().split(/\s+/);
  const firstName = rest.shift() || '';
  const lastName = rest.join(' ');
  return { title, firstName, lastName };
};

// รายชื่อสมาชิกสำหรับ popup ค้นหา (อ้างจาก MEMBERS_LIST)
window.LM_MEMBERS = (window.MEMBERS_LIST || []).map(m => {
  const n = window.lmSplitName(m.name);
  return {
    code: m.code, name: m.name, title: n.title, firstName: n.firstName, lastName: n.lastName,
    citizenId: m.citizenId, dept: m.dept, deptCode: m.deptCode,
    joinDate: m.joinDate, loans: m.loans, loanCount: m.loanCount,
  };
});

window.lmFindMember = (code) => window.LM_MEMBERS.find(m => m.code === code) || null;

window.lmSearchMembers = (q) => {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return window.LM_MEMBERS;
  return window.LM_MEMBERS.filter(m =>
    m.code.toLowerCase().includes(s) || m.name.toLowerCase().includes(s) ||
    m.citizenId.includes(s) || (m.dept || '').toLowerCase().includes(s));
};

// ─── ที่อยู่จัดส่งเอกสาร (สังเคราะห์ต่อสมาชิก แบบคงที่ตามรหัส) ───────
const _lmStreets = ['ถ.พหลโยธิน', 'ถ.มหาราช', 'ถ.ราชดำเนิน', 'ถ.สุขุมวิท', 'ถ.เพชรเกษม'];
const _lmTambons = ['ต.ในเมือง', 'ต.สุเทพ', 'ต.ช้างเผือก', 'ต.หนองหอย', 'ต.ป่าตัน'];
const _lmAmphoes = ['อ.เมือง', 'อ.สันทราย', 'อ.หางดง', 'อ.สารภี'];
const _lmProvinces = ['จ.เชียงใหม่ 50000', 'จ.ลำพูน 51000', 'จ.ลำปาง 52000'];
const _lmHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
window.lmMemberAddress = (code) => {
  const h = _lmHash(code);
  const houseNo = (h % 200) + 1;
  const sub = (h >>> 3) % 40 + 1;
  const moo = (h >>> 6) % 12 + 1;
  return `${houseNo}/${sub} หมู่ ${moo} ${_lmStreets[h % _lmStreets.length]} ` +
         `${_lmTambons[(h >>> 9) % _lmTambons.length]} ${_lmAmphoes[(h >>> 12) % _lmAmphoes.length]} ` +
         `${_lmProvinces[(h >>> 15) % _lmProvinces.length]}`;
};

// ─── ประวัติการออกหนังสือรับรองดอกเบี้ย (รายสมาชิก) ─────────────────
//  สถานะส่งสรรพากร: sent = ส่งข้อมูลแล้ว · wait = รอส่ง
window.LOAN_CERT_HISTORY = [
  { certNo: 'IC-2568-004182', taxYear: 2568, contract: 'L-2565-00841', purpose: 'ซื้ออาคารพร้อมที่ดิน',
    interest: 48250.75, issuedAt: '2026-01-18', by: 'สมหญิง ก.', tax: 'sent', taxAt: '2026-02-05' },
  { certNo: 'IC-2567-003960', taxYear: 2567, contract: 'L-2565-00841', purpose: 'ซื้ออาคารพร้อมที่ดิน',
    interest: 52140.00, issuedAt: '2025-01-22', by: 'สมหญิง ก.', tax: 'sent', taxAt: '2025-02-08' },
  { certNo: 'IC-2568-004183', taxYear: 2568, contract: 'L-2566-01120', purpose: 'ซ่อมแซม ปรับปรุง ต่อเติม บ้านพักอาศัย',
    interest: 12980.50, issuedAt: '2026-01-18', by: 'สมหญิง ก.', tax: 'wait', taxAt: '' },
];
window.lmCertHistory = (code) => window.LOAN_CERT_HISTORY.map(r => ({ ...r }));
window.LOAN_CERT_TAX_CHANNELS = ['ยื่นผ่านอินเทอร์เน็ต (e-Filing)', 'สื่อบันทึกข้อมูล (Text File)', 'ยื่นแบบกระดาษ ณ สำนักงานสรรพากร'];

// ─── วัตถุประสงค์การกู้ (สำหรับหนังสือรับรองดอกเบี้ยลดหย่อนภาษี) ─────
window.LOAN_PURPOSES = [
  'ซื้ออาคาร',
  'ซื้ออาคารพร้อมที่ดิน',
  'ซื้อห้องชุดในอาคารชุด',
  'ปลูกสร้างอาคารบนที่ดินของตนเอง',
  'ปลูกสร้างอาคารบนที่ดินเช่า',
  'ปลูกสร้างอาคารบนที่ดินมีสิทธิครอบครอง',
  'ซื้อที่ดินพร้อมสิ่งปลูกสร้างเฉพาะส่วน',
  'ซื้อที่ดินเฉพาะส่วน',
  'ซื้อที่ดินพร้อมปลูกสร้างบ้าน',
  'เคหะสงเคราะห์ (ซื้อที่ดินพร้อมบ้านพักอาศัยและไถ่ถอน)',
  'เช่าซื้ออาคาร',
  'เช่าซื้ออาคารพร้อมที่ดิน',
  'เช่าซื้อห้องชุดในอาคาร',
  'ไถ่ถอนจำนองจากสถาบันการเงิน',
  'ซ่อมแซม ปรับปรุง ต่อเติม บ้านพักอาศัย',
  'เคหะสงเคราะห์ไถ่ถอน(ขายฝาก) และลงทุนประกอบอาชีพ',
  'เคหะสงเคราะห์(ปรับปรุงบ้าน) และลงทุนประกอบอาชีพ',
  'เคหะสงเคราะห์ (ซื้อที่ดินพร้อมปลูกสร้างบ้านพักอาศัย)',
  'เคหะสงเคราะห์ไถ่ถอนขายฝาก',
  'เคหะสงเคราะห์(ไถ่ถอนจำนอง) และยานพาหนะ',
  'เคหะสงเคราะห์(ปรับปรุงห้องชุดพักอาศัย)',
  'เคหะสงเคราะห์ (ซื้อที่ดินพร้อมบ้านพักอาศัยเฉพาะส่วน)',
  'เคหะสงเคราะห์(ไถ่ถอนจำนองและซื้อที่ดินพร้อมบ้านพัก)',
  'เคหะสงเคราะห์ (ไถ่ถอนจำนองและปรับปรุงบ้านพักอาศัย)',
  'เคหะสงเคราะห์ (ซื้อที่ดินพร้อมบ้านพักอาศัย และซื้อ)',
  'เคหะสงเคราะห์ (ไถ่ถอนขายฝาก และปรับปรุงบ้านพักอาศัย)',
  'ไม่ระบุ',
];

// ─── สัญญาเงินกู้ของสมาชิก (สังเคราะห์ตามจำนวนสัญญาใน MEMBERS_LIST) ──
const _lmContractKinds = ['พิเศษเคหะสงเคราะห์', 'สามัญปกติ', 'พิเศษเพื่อประกอบอาชีพ', 'สามัญหุ้น', 'ฉุกเฉินเงินสด'];
window.lmMemberContracts = (code) => {
  const m = window.lmFindMember(code);
  if (!m || !m.loanCount) return [];
  const h = _lmHash(code);
  const total = m.loans || 0;
  const n = m.loanCount;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const hh = _lmHash(code + ':' + i);
    const be = 2563 + (hh % 6);          // ปีเริ่มสัญญา พ.ศ.
    const sy = be - 543;
    const sm = (hh % 12);
    const sd = (hh % 27) + 1;
    const start = `${sy}-${String(sm + 1).padStart(2, '0')}-${String(sd).padStart(2, '0')}`;
    const last = `2026-0${(hh % 5) + 1}-${String((hh % 26) + 1).padStart(2, '0')}`;
    const bal = Math.round((total / n) * (0.6 + (hh % 40) / 100));
    rows.push({
      no: `${_lmContractKinds[hh % _lmContractKinds.length].startsWith('พิเศษ') ? 'พศ' : _lmContractKinds[hh % _lmContractKinds.length].startsWith('สามัญ') ? 'สญ' : 'ฉฉ'}.${be}/${String(10000 + (hh % 89999)).padStart(5, '0')}`,
      kind: _lmContractKinds[hh % _lmContractKinds.length],
      start, last, balance: bal,
    });
  }
  return rows;
};

// ─── ใบคำขอกู้ของสมาชิก (สำหรับหน้าขอส่งคืนคำขอกู้) ─────────────────
window.lmMemberApplications = (code) => {
  const m = window.lmFindMember(code);
  if (!m) return [];
  const h = _lmHash(code + 'app');
  const cnt = (m.loanCount || 0) + 1;        // อย่างน้อย 1 ใบคำขอที่รออยู่
  const out = [];
  for (let i = 0; i < cnt; i++) {
    const hh = _lmHash(code + 'app' + i);
    out.push({
      reqNo: `LR-2569-${String(40000 + (hh % 9999)).padStart(5, '0')}`,
      loanType: window.RETURN_LOAN_TYPES[hh % window.RETURN_LOAN_TYPES.length].replace(/\*$/, ''),
      amount: Math.round(50000 + (hh % 2000) * 1000),
      reqDate: `2026-0${(hh % 5) + 1}-${String((hh % 26) + 1).padStart(2, '0')}`,
      status: i === 0 ? 'รออนุมัติ' : (hh % 2 ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'),
    });
  }
  return out;
};

// ─── ประเภทเงินกู้ (รายการเต็ม) สำหรับหน้าขอส่งคืนคำขอกู้ ────────────
window.RETURN_LOAN_TYPES = [
  'ฉุกเฉินเงินสด', 'ฉุกเฉินหักโอน*', 'ฉุกเฉิน ATM',
  'สามัญ 33 เท่า*', 'สามัญ 35 เท่า (โครงการ)*', 'สามัญ 33 เท่า (โครงการ)*',
  'สามัญผ่อนผัน 33 เท่า (โครงการ)*', 'สามัญผ่อนผัน 33 เท่า*', 'สามัญผ่อนผัน 35 เท่า (โครงการ)*',
  'สามัญหุ้น', 'สามัญเพื่อการรวมหนี้', 'สามัญปืน*', 'สามัญเพื่อการปรับปรุงคุณภาพชีวิต 1*',
  'พิเศษเคหะสงเคราะห์', 'พิเศษยานพาหนะ', 'พิเศษเพื่อประกอบอาชีพ', 'พิเศษเคหะสงเคราะห์ (อัตราดอกเบี้ยพิเศษ)',
  'สามัญเพื่อผู้ประสบมหาอุทกภัย*', 'สามัญปกติ', 'สามัญปกติ (โครงการ)', 'สามัญปกติผ่อนผัน',
  'สามัญปกติผ่อนผัน (โครงการ)', 'สามัญเพื่อสินเชื่ออเนกประสงค์', 'สามัญเพื่อบรรเทาความเดือดร้อนกรณีเร่งด่วน',
  'สามัญเพื่อการปรับปรุงคุณภาพชีวิต 2', 'สามัญเพื่อการศึกษา', 'สามัญเพื่อเหตุจำเป็น',
  'เงินกู้สามัญเพิ่มสุขปีใหม่', 'สามัญฌาปนกิจสงเคราะห์ สส.ชสอ. และ สสอร.',
  'สามัญไม่เกินทุนเรือนหุ้นผู้เกษียณ 70%', 'สามัญช่วยเหลือผู้ค้ำประกัน',
  'สามัญปรับโครงสร้างหนี้ 1', 'สามัญปรับโครงสร้างหนี้ 2', 'สามัญไม่เกินทุนเรือนหุ้นผู้เกษียณ 90%',
  'สามัญเพื่อชำระหนี้บังคับคดีและสถาบันการเงิน',
  'สามัญเพื่อช่วยเหลือสมาชิกที่ได้รับเงินปันผล-เฉลี่ยคืนล่าช้า',
  'สามัญเพื่อชำระหนี้ฉุกเฉิน', 'สามัญเพื่อแก้ไขปัญหาเศรษฐกิจ',
];

// ─── เลขที่เอกสารส่งคืนคำขอกู้ (running) — RT-<พ.ศ.>-<5 หลัก> ─────────
window._lmReturnSeq = 128;
window.nextReturnDocNo = () => {
  const be = new Date(window.DEPOSIT_WORKING_DATE || Date.now()).getFullYear() + 543;
  window._lmReturnSeq += 1;
  return `RT-${be}-${String(window._lmReturnSeq).padStart(5, '0')}`;
};

// ─── ระบบต้นทางสำหรับโอนปันผล–เข้ารับจ่าย ───────────────────────────
window.TRANSFER_SOURCES = [
  { v: 'DIV', l: 'DIV - เงินปันผล' },
  { v: 'RB',  l: 'RB - เงินเฉลี่ยคืน' },
  { v: 'INT', l: 'INT - ดอกเบี้ยเงินฝาก' },
  { v: 'WF',  l: 'WF - เงินสวัสดิการ' },
  { v: 'SHR', l: 'SHR - ค่าหุ้นคืน' },
];
