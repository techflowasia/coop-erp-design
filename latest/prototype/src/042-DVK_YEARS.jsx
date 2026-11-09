// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — คีย์ข้อมูลหักปันผล / เฉลี่ยคืนรายคน
//  (Dividend / patronage-rebate deduction entry, per member)
//  ----------------------------------------------------------------
//  บันทึก/จัดการรายการหักเงินจากยอดปันผล–เฉลี่ยคืนของสมาชิกแต่ละราย
//  · หักชำระหนี้ (LON) · ออมเข้าบัญชีสหกรณ์ (สอร) · โอนธนาคาร (CBT)
//  · คำนวณ ยอดเงิน = หักเฉลี่ยคืน + หักปันผล  และยอดคงเหลือก่อนบันทึก
//  หน้าจอแก้ไขได้ (editable) — ต่างจาก "รายละเอียดปันผล" ที่อ่านอย่างเดียว
// ═════════════════════════════════════════════════════════════════

// ปีปันผล (พ.ศ.) ที่เปิดให้เลือก
window.DVK_YEARS = ['2568', '2567', '2566'];

// ─── ประเภทรายการหัก ─────────────────────────────────────────────────
//  need: ข้อมูลประกอบที่ "ต้องระบุ" ของแต่ละประเภท (ใช้ตรวจสอบก่อนบันทึก)
window.DVK_TXN_TYPES = [
  { v: 'LON', label: 'LON : โอนชำระหนี้',   need: 'contract' }, // ผูกเลขที่สัญญาเงินกู้
  { v: 'สอร', label: 'สอร : ออมปกติ สอร.',  need: 'coop'     }, // ผูกบัญชีเงินฝากสหกรณ์
  { v: 'CBT', label: 'CBT : โอนธนาคาร',      need: 'bank'     }, // ต้องมีธนาคาร/สาขา/เลขบัญชี
];
window.dvkType = (v) => window.DVK_TXN_TYPES.find(t => t.v === v) || window.DVK_TXN_TYPES[0];

// สถานะผิดนัดชำระ
window.DVK_DEBT_STATUS = [
  { v: 'normal',  l: 'ปกติ',   pill: 'ok'  },
  { v: 'default', l: 'ผิดนัด', pill: 'bad' },
];
window.dvkDebtStatus = (v) => window.DVK_DEBT_STATUS.find(s => s.v === v) || window.DVK_DEBT_STATUS[0];

// ─── สมาชิกสำหรับค้นหา (ใช้กับ MemberSearchField / MemberSearchModal) ──
//  record มี .code (เลขทะเบียน) เป็นอย่างน้อย — เพิ่ม dept/citizenId เพื่อค้นหา
window.DVK_MEMBERS = [
  { code: 'b54823', title: 'นาย',    firstName: 'เอก',     lastName: 'มารศรี',
    name: 'นายเอก มารศรี', citizenId: '3-3199-00482-31-7',
    dept: '04241 : ส่วนงานและกิจการตลาด บุรีรัมย์ (บกก.3.1(สร.))XNT1' },
  { code: 'b54902', title: 'นาง',    firstName: 'สมพร',    lastName: 'ทองดี',
    name: 'นางสมพร ทองดี', citizenId: '3-3101-00219-44-2',
    dept: '04210 : ส่วนงานบริการลูกค้า บุรีรัมย์ (บกก.3.1(สร.))XNT1' },
  { code: 'b55117', title: 'นางสาว', firstName: 'ปิยะนุช', lastName: 'แก้วใส',
    name: 'นางสาวปิยะนุช แก้วใส', citizenId: '1-3017-00781-09-5',
    dept: '03118 : ส่วนงานปฏิบัติการ นครราชสีมา (บกก.3.1)NMA2' },
];

// ─── ค่าตั้งต้นบัญชี/ธนาคารสำหรับ dropdown (สาธิต) ────────────────────
window.DVK_BANKS = [
  { v: '006', l: '006 : ธ.กรุงไทย' },
  { v: '014', l: '014 : ธ.ไทยพาณิชย์' },
  { v: '002', l: '002 : ธ.กรุงเทพ' },
  { v: '004', l: '004 : ธ.กสิกรไทย' },
];

// ─── ข้อมูลปันผล/เฉลี่ยคืนรายสมาชิก · รายปี + รายการหักตั้งต้น ─────────
//  total      = dividend + avgReturn
//  ยอดเงินต่อรายการ = dedAvg (หักเฉลี่ยคืน) + dedDiv (หักปันผล)
//  ปันผลคงเหลือ    = dividend − Σ dedDiv ;  เฉลี่ยคืนคงเหลือ = avgReturn − Σ dedAvg
window.DVK_DIVIDEND = {
  'b54823': {
    '2568': {
      debtStatus: 'normal',
      divRate: 5.01, avgRate: 15.08,
      accumShare: 100942.25,                 // ค่าหุ้นสะสม (ค/บ สะสม)
      dividend: 2710.25, avgReturn: 15222.00,
      arrears: 0.00,                         // ค้างจ่าย (ยกมา)
      lines: [
        { type: 'LON', dedAvg: 9362.50, dedDiv: 0.00,
          heir: '', bank: '', branch: '', bankAcct: '', coopAcct: '',
          contractNo: 'สพ68012324', note: 'สมทบเงินกู้',
          gen: 'GENERATE', genAt: '30/01/2569 11:44' },
        { type: 'สอร', dedAvg: 5540.00, dedDiv: 0.00,
          heir: '', bank: '', branch: '', bankAcct: '', coopAcct: '010-0-11194-1',
          contractNo: '', note: 'ออมปกติสงเคราะห์ สอร.',
          gen: 'GENERATE', genAt: '30/01/2569 11:45' },
        { type: 'CBT', dedAvg: 319.50, dedDiv: 2710.25,
          heir: '', bank: '006', branch: '0308 : สาขาบุรีรัมย์', bankAcct: '308-0-54335-1', coopAcct: '',
          contractNo: '', note: 'โอนธนาคาร',
          gen: 'GENERATE', genAt: '30/01/2569 11:45' },
      ],
    },
  },
  'b54902': {
    '2568': {
      debtStatus: 'normal',
      divRate: 5.01, avgRate: 15.08,
      accumShare: 248110.00,
      dividend: 12430.50, avgReturn: 9874.00,
      arrears: 0.00,
      lines: [
        { type: 'สอร', dedAvg: 9874.00, dedDiv: 12430.50,
          heir: '', bank: '', branch: '', bankAcct: '', coopAcct: '010-0-22087-3',
          contractNo: '', note: 'ออมปกติสงเคราะห์ สอร.',
          gen: 'GENERATE', genAt: '30/01/2569 09:12' },
      ],
    },
  },
  'b55117': {
    '2568': {
      debtStatus: 'default',
      divRate: 5.01, avgRate: 15.08,
      accumShare: 56720.00,
      dividend: 1845.75, avgReturn: 5230.00,
      arrears: 3120.00,
      // หนี้ค้างชำระ (สำหรับแผงตรวจสอบก่อนจ่าย เมื่อสถานะ "ผิดนัด")
      debts: [
        { type: 'เงินกู้สามัญ',  contractNo: 'สพ67009918', status: 'ผิดนัดชำระ', arrears: 2480.00, overdue: 2 },
        { type: 'เงินกู้ฉุกเฉิน', contractNo: 'ฉก67004417', status: 'ค้างชำระ',  arrears: 640.00,  overdue: 1 },
      ],
      lines: [
        { type: 'LON', dedAvg: 5230.00, dedDiv: 1845.75,
          heir: '', bank: '', branch: '', bankAcct: '', coopAcct: '',
          contractNo: 'สพ67009918', note: 'หักชำระหนี้ค้าง (ผิดนัด)',
          gen: 'GENERATE', genAt: '30/01/2569 10:03' },
      ],
    },
  },
};

// ─── ค้นหาสมาชิก (รับ criteria object ตาม DS) ────────────────────────
window.dvkSearchMembers = (criteria) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const c = criteria || {};
  const code = norm(c.code), fn = norm(c.firstName), ln = norm(c.lastName),
        cid = norm(c.citizenId), un = norm(c.unit);
  return (window.DVK_MEMBERS || []).filter(m =>
    (!code || norm(m.code).includes(code)) &&
    (!fn   || norm(m.firstName || m.name).includes(fn)) &&
    (!ln   || norm(m.lastName || m.name).includes(ln)) &&
    (!cid  || norm(m.citizenId).includes(cid)) &&
    (!un   || norm(m.dept).includes(un)));
};

// คืน record ปันผล/เฉลี่ยคืนของสมาชิกตามปี (deep-clone lines เพื่อแก้ไขได้)
window.dvkRecord = (code, year) => {
  const byYear = window.DVK_DIVIDEND[code];
  if (!byYear) return null;
  const r = byYear[year] || byYear[Object.keys(byYear)[0]];
  if (!r) return null;
  return {
    ...r,
    lines: (r.lines || []).map(l => ({ ...l })),
  };
};

// ปีปันผลที่สมาชิกรายนี้มีข้อมูล
window.dvkYearsOf = (code) => Object.keys(window.DVK_DIVIDEND[code] || {});

// สรุปยอดหนี้ค้างของสมาชิก (สำหรับแผงตรวจสอบก่อนจ่าย เมื่อสถานะ "ผิดนัด")
window.dvkDebtSummary = (code, year) => {
  const r = (window.DVK_DIVIDEND[code] || {})[year] || {};
  const rows = (r.debts || []).map(d => ({
    type: d.type, contractNo: d.contractNo, status: d.status,
    arrears: d.arrears || 0, overdue: d.overdue || 0,
  }));
  return { rows, totalArrears: rows.reduce((a, d) => a + d.arrears, 0) };
};

// แถวรายการหักเปล่า (สำหรับปุ่ม "เพิ่มรายการ")
window.dvkBlankLine = () => ({
  type: 'LON', dedAvg: 0, dedDiv: 0,
  heir: '', bank: '', branch: '', bankAcct: '', coopAcct: '',
  contractNo: '', note: '', gen: 'MANUAL', genAt: '',
});
