// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — คำขอเปลี่ยนแปลงงวดชำระ
//  ข้อมูลสาธิต: ประเภทการเปลี่ยนแปลง · หัวข้อหมายเหตุ · ทะเบียนคำขอ
//  ใช้สมาชิก/สัญญาจาก DN_MEMBERS (data-debt-notice.js)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทการเปลี่ยนแปลง (2 ฟังก์ชันหลัก) ──────────────────────────
window.ICR_CHANGE_TYPES = [
  { v: 'installment', l: 'เปลี่ยนแปลงงวดชำระ', short: 'เปลี่ยนงวดชำระ',
    desc: 'ปรับยอดผ่อนชำระ / จำนวนงวด ต่อสัญญาเงินกู้', icon: 'calendar' },
  { v: 'annual',      l: 'ปรับเพิ่มส่งรายปี',  short: 'เพิ่มส่งรายปี',
    desc: 'ปรับเพิ่มยอดส่งชำระเป็นรายปีตามมติที่ประชุม', icon: 'money' },
];
window.icrChangeType = (v) => window.ICR_CHANGE_TYPES.find(t => t.v === v) || window.ICR_CHANGE_TYPES[0];

// ─── หัวข้อหมายเหตุ (แยกหมวด — สำหรับจัดกลุ่มเหตุผลการเปลี่ยนแปลง) ────
window.ICR_NOTE_CATEGORIES = [
  { v: 'restruct-borrower',  l: 'ปรับโครงสร้างหนี้ผู้กู้',       pill: 'info' },
  { v: 'restruct-guarantor', l: 'ปรับโครงสร้างหนี้ผู้ค้ำ',       pill: 'info' },
  { v: 'share-transfer',     l: 'โอนหุ้น',                       pill: 'primary' },
  { v: 'debt-ack',           l: 'รับสภาพหนี้',                   pill: 'warning' },
  { v: 'suspend',            l: 'พักชำระหนี้',                   pill: 'warning' },
  { v: 'manage',             l: 'บริหารจัดการหนี้',              pill: 'primary' },
  { v: 'stop-collect',       l: 'หยุดเก็บหนี้',                  pill: 'danger' },
  { v: 'collect-judgment',   l: 'เปิดเก็บหนี้ตามคำพิพากษา',      pill: 'danger' },
];
window.icrNoteCat = (v) => window.ICR_NOTE_CATEGORIES.find(c => c.v === v) || null;

// ─── สถานะคำขอ ──────────────────────────────────────────────────────
window.ICR_STATUS = [
  { v: 'recorded',  l: 'บันทึกแล้ว',  pill: 'info' },
  { v: 'effective', l: 'มีผลแล้ว',     pill: 'ok' },
  { v: 'cancelled', l: 'ยกเลิก',       pill: 'neutral' },
];
window.icrStatus = (v) => window.ICR_STATUS.find(s => s.v === v) || window.ICR_STATUS[0];

// ─── หมายเหตุทะเบียนสมาชิก (ดึงจากหน้าจอแก้ไขสมาชิก) ────────────────
//  ช่อง "หมายเหตุ" ในแบบฟอร์มจะดึงข้อความตั้งต้นจากที่นี่ (เลียนแบบฟิลด์
//  note ในหน้าจอแก้ไขสมาชิก) เมื่อเลือกสมาชิก แล้วผู้บันทึกแก้ไขเพิ่มได้
window.ICR_MEMBER_NOTES = {
  'M-067012': 'สมาชิกแจ้งความประสงค์ขอลดยอดผ่อนชำระต่องวด เนื่องจากถูกปรับลดเงินเดือน — มติคณะกรรมการดำเนินการ ครั้งที่ 4/2569 เห็นชอบให้ขยายระยะเวลาผ่อน',
  'M-066238': 'สมาชิกลาออกจากราชการแต่ยังคงมีภาระหนี้ค้าง — อยู่ระหว่างจัดทำหนังสือรับสภาพหนี้และปรับโครงสร้างหนี้',
  'M-065471': 'สมาชิกถึงแก่กรรม — ทายาทขอผ่อนชำระหนี้ตามคำพิพากษาของศาล',
  'M-064120': 'ไม่มีภาระหนี้คงค้าง',
};
window.icrMemberNote = (code) => window.ICR_MEMBER_NOTES[code] || '';

// ─── ผู้บันทึก (ล็อกอินปัจจุบัน) ─────────────────────────────────────
window.ICR_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';

// ─── เลขที่คำขอ (auto) — ICR-{พ.ศ.}-{running 6 หลัก} ────────────────
window.icrNextNo = (list, beYear) => {
  const prefix = `ICR-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n) && n > mx) return n;
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(6, '0');
};

// ─── ข้อมูลสาธิต (ทะเบียนคำขอ) ──────────────────────────────────────
window.ICR_SEED = [
  {
    id: 'ICR-2569-000001', recordDate: '2026-05-12', effectiveDate: '2026-06-01',
    changeType: 'installment',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    dept: 'กองช่าง', deptCode: '0301',
    contractNo: 'L-2022-0455', loanType: 'เงินกู้สามัญ',
    oldTerm: 120, oldAmount: 9680, newTerm: 156, newAmount: 7250,
    annualIncrease: 0,
    noteCategory: 'restruct-borrower',
    note: 'สมาชิกแจ้งความประสงค์ขอลดยอดผ่อนชำระต่องวด เนื่องจากถูกปรับลดเงินเดือน — มติคณะกรรมการดำเนินการ ครั้งที่ 4/2569 เห็นชอบให้ขยายระยะเวลาผ่อน',
    status: 'effective',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-12T10:24:00',
  },
  {
    id: 'ICR-2569-000002', recordDate: '2026-05-28', effectiveDate: '2026-07-01',
    changeType: 'annual',
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    dept: 'กองการศึกษา', deptCode: '0501',
    contractNo: 'L-2021-0332', loanType: 'เงินกู้สามัญ',
    oldTerm: 96, oldAmount: 6450, newTerm: 96, newAmount: 6450,
    annualIncrease: 12000,
    noteCategory: 'debt-ack',
    note: 'สมาชิกลาออกจากราชการแต่ยังคงมีภาระหนี้ค้าง — ตกลงทำหนังสือรับสภาพหนี้ และปรับเพิ่มยอดส่งชำระเป็นรายปี ปีละ 12,000 บาท',
    status: 'recorded',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-28T14:05:00',
  },
  {
    id: 'ICR-2569-000003', recordDate: '2026-06-03', effectiveDate: '2026-06-25',
    changeType: 'installment',
    memberCode: 'M-065471', memberName: 'นายประเสริฐ ชูเกียรติ',
    dept: 'สำนักงานปลัด', deptCode: '0801',
    contractNo: 'L-2020-0118', loanType: 'เงินกู้พิเศษ',
    oldTerm: 144, oldAmount: 8200, newTerm: 144, newAmount: 5500,
    annualIncrease: 0,
    noteCategory: 'collect-judgment',
    note: 'สมาชิกถึงแก่กรรม — ทายาทขอผ่อนชำระหนี้ตามคำพิพากษาของศาล โดยปรับลดยอดผ่อนต่องวดตามความสามารถในการชำระ',
    status: 'recorded',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-06-03T09:40:00',
  },
];

// ════════════════════════════════════════════════════════════════════
//  ใบคำขอเปลี่ยนแปลงยอดชำระหนี้ — ค่าคงที่สำหรับหน้าจอบันทึก (single screen)
// ════════════════════════════════════════════════════════════════════

// ─── สถานะหนี้ของสัญญา ──────────────────────────────────────────────
window.ICR_DEBT_STATUS = [
  { v: 'normal',       l: 'ปกติ',        pill: 'ok'   },
  { v: 'overdue',      l: 'ค้างชำระ',     pill: 'warn' },
  { v: 'compromise',   l: 'ประนอมหนี้',   pill: 'info' },
  { v: 'collect-full', l: 'เก็บเต็มจำนวน', pill: 'bad'  },
];
window.icrDebtStatus = (v) => window.ICR_DEBT_STATUS.find(s => s.v === v) || window.ICR_DEBT_STATUS[0];

// ─── การจัดชั้นลูกหนี้ (NPL classification) ─────────────────────────
//  จัดตามจำนวนงวดที่ค้างชำระ (เลือกชั้นที่ min สูงสุดที่ ≤ งวดค้าง)
window.ICR_CLASS = [
  { v: 'normal',      l: 'ปกติ',                pill: 'ok',   min: 0, prov: 'ตั้งสำรอง 1%' },
  { v: 'watch',       l: 'กล่าวถึงเป็นพิเศษ',    pill: 'info', min: 1, prov: 'ตั้งสำรอง 2%' },
  { v: 'substandard', l: 'ต่ำกว่ามาตรฐาน',       pill: 'warn', min: 3, prov: 'ตั้งสำรอง 20%' },
  { v: 'doubtful',    l: 'สงสัย',               pill: 'warn', min: 4, prov: 'ตั้งสำรอง 50%' },
  { v: 'loss',        l: 'สงสัยจะสูญ',           pill: 'bad',  min: 6, prov: 'ตั้งสำรอง 100%' },
];
window.icrClassify = (overdueTerms) => {
  const n = Number(overdueTerms) || 0;
  let cur = window.ICR_CLASS[0];
  window.ICR_CLASS.forEach(c => { if (n >= c.min) cur = c; });
  return cur;
};

// ─── ยอดลูกหนี้ตัวแทนคงค้างของสมาชิก (ตรวจก่อนปรับโครงสร้าง) ───────
window.ICR_AGENT_BALANCE = {
  'M-067012': 0,
  'M-066238': 18500,   // มียอดลูกหนี้ตัวแทนค้าง — ต้องจัดการก่อนปรับโครงสร้าง
  'M-065471': 0,
};
window.icrAgentBalance = (code) => Number(window.ICR_AGENT_BALANCE[code]) || 0;

// ─── สถานะประนอมหนี้ (แสดงในแถบค้นหา) ───────────────────────────────
window.ICR_COMPROMISE = [
  { v: 'none',   l: 'ไม่อยู่ระหว่างประนอมหนี้', pill: 'neutral' },
  { v: 'review', l: 'ระหว่างพิจารณา',           pill: 'warn'    },
  { v: 'active', l: 'อยู่ระหว่างประนอมหนี้',      pill: 'info'    },
];
window.icrCompromise = (v) => window.ICR_COMPROMISE.find(c => c.v === v) || window.ICR_COMPROMISE[0];

// ─── รูปแบบการชำระ (ชำระแบบ) ────────────────────────────────────────
window.ICR_PAY_METHODS = [
  { v: 'equal-principal',   l: 'ต้นเท่ากัน',           desc: 'เงินต้นเท่ากันทุกงวด ดอกเบี้ยลดลงตามยอดคงเหลือ' },
  { v: 'equal-installment', l: 'ต้น+ดอกเท่ากัน',       desc: 'ยอดผ่อนรวมเท่ากันทุกงวด' },
  { v: 'interest-only',     l: 'ชำระเฉพาะดอกเบี้ย',     desc: 'ชำระเฉพาะดอกเบี้ยในช่วงเวลาที่กำหนด' },
  { v: 'principal-grace',   l: 'พักชำระเงินต้น',        desc: 'พักเงินต้น ชำระเฉพาะดอกเบี้ย' },
  { v: 'restructure',       l: 'ปรับโครงสร้างหนี้',     desc: 'ปรับเงื่อนไขใหม่ตามมติอนุมัติ' },
];
window.icrPayMethod = (v) => window.ICR_PAY_METHODS.find(m => m.v === v) || window.ICR_PAY_METHODS[0];

// ─── ปรับโครงสร้างหนี้ (มี/ไม่มี) ────────────────────────────────────
window.ICR_RESTRUCT = [
  { v: 'none',        l: 'ไม่ปรับโครงสร้าง' },
  { v: 'restructure', l: 'ปรับโครงสร้างหนี้' },
];

// ─── สถานะรายการคำขอ (workflow ตามใบคำขอ) ──────────────────────────
window.ICR_REQ_STATUS = [
  { v: 'draft',     l: 'ร่าง',          pill: 'neutral', step: 0 },
  { v: 'pending',   l: 'รออนุมัติ',      pill: 'warn',    step: 1 },
  { v: 'approved',  l: 'อนุมัติ',        pill: 'ok',      step: 2 },
  { v: 'rejected',  l: 'ไม่อนุมัติ',      pill: 'bad',     step: 2 },
  { v: 'cancelled', l: 'ยกเลิก',         pill: 'neutral', step: 3 },
  { v: 'applied',   l: 'ปรับปรุงแล้ว',    pill: 'info',    step: 4 },
];
window.icrReqStatus = (v) => window.ICR_REQ_STATUS.find(s => s.v === v) || window.ICR_REQ_STATUS[0];

// ─── เดือน (ตั้งแต่เดือน — เริ่มมีผล) ──────────────────────────────────
window.ICR_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// ─── เลขที่ใบคำขอเปลี่ยนแปลง (auto) — CHG-{พ.ศ.ย่อ}-{running 4 หลัก} ──
window.icrNextChangeNo = (beYear) => {
  const yy = String(beYear).slice(-2);
  const n = 7 + Math.floor(Math.random() * 1); // เดโม: เลขรันถัดไป
  return `CHG-${yy}-${String(n).padStart(4, '0')}`;
};

// ─── ข้อมูลสัญญาเงินกู้ (enrich) — เติมฟิลด์ที่หน้าจอต้องใช้ ──────────
//  อ้างอิงสัญญาจาก DN_MEMBERS (debts[]) แล้วเติม: วันที่สัญญา · ยอดอนุมัติ
//  · ยอดรอบบิล · งวดชำระล่าสุด · อัตราดอกเบี้ย · สถานะหนี้ · ประนอมหนี้
window.ICR_CONTRACT_EXTRA = {
  'L-2022-0455': { contractDate: '2022-03-14', approvedAmount: 800000, rate: 6.50, debtStatus: 'overdue',    compromise: 'review', role: 'borrower',  retireDate: '2039-09-30', everOverdue: 6 },
  'EM-2024-0771':{ contractDate: '2024-02-09', approvedAmount: 50000,  rate: 6.75, debtStatus: 'overdue',    compromise: 'none',   role: 'borrower',  retireDate: '2039-09-30', everOverdue: 3 },
  'SP-2021-0144':{ contractDate: '2021-07-19', approvedAmount: 500000, rate: 7.00, debtStatus: 'overdue',    compromise: 'none',   role: 'guarantor', retireDate: '2031-09-30', everOverdue: 5 },
  'SH-2023-0210':{ contractDate: '2023-04-02', approvedAmount: 120000, rate: 5.75, debtStatus: 'normal',     compromise: 'none',   role: 'borrower',  retireDate: '2039-09-30', everOverdue: 0 },
  'L-2021-0332': { contractDate: '2021-05-20', approvedAmount: 600000, rate: 6.50, debtStatus: 'compromise', compromise: 'active', role: 'borrower',  retireDate: '2034-09-30', everOverdue: 9 },
  'L-2020-0118': { contractDate: '2020-08-11', approvedAmount: 900000, rate: 7.00, debtStatus: 'overdue',    compromise: 'review', role: 'borrower',  retireDate: '2030-09-30', everOverdue: 12 },
};
window.icrContractInfo = (debt) => {
  if (!debt) return null;
  const x = window.ICR_CONTRACT_EXTRA[debt.contractNo] || {};
  const approved = x.approvedAmount || (debt.principalRemaining + debt.paidTerms * debt.installment);
  return {
    contractNo: debt.contractNo,
    loanType: debt.type,
    contractDate: x.contractDate || '2022-01-01',
    approvedAmount: approved,
    billAmount: debt.installment,
    outstanding: debt.principalRemaining,
    interestArrears: debt.interestDue,
    installment: debt.installment,
    totalTerms: debt.totalTerms,
    paidTerms: debt.paidTerms,
    remainTerms: Math.max(0, debt.totalTerms - debt.paidTerms),
    rate: x.rate != null ? x.rate : 6.50,
    debtStatus: x.debtStatus || 'normal',
    compromise: x.compromise || 'none',
    role: x.role || 'borrower',
    retireDate: x.retireDate || null,
    overdueTerms: Number(debt.overdueInstallments) || 0,
    everOverdue: x.everOverdue != null ? x.everOverdue : (Number(debt.overdueInstallments) || 0),
  };
};

// ─── ประวัติการเปลี่ยนแปลงยอดชำระ (ต่อสัญญา — แสดงในตารางด้านล่าง) ────
window.ICR_HISTORY = {
  'L-2022-0455': [
    { docNo: 'CHG-67-0003', payMethod: 'equal-principal',   perInstallment: 9680, status: 'approved', arrearsPerTerm: 100, addPrincipalYearly: 200,  addYearly: 0,     docDate: '2024-02-15', by: 'จันทร์เพ็ญ มาลี' },
    { docNo: 'CHG-66-0021', payMethod: 'equal-principal',   perInstallment: 9680, status: 'approved', arrearsPerTerm: 100, addPrincipalYearly: 200,  addYearly: 0,     docDate: '2023-08-10', by: 'จันทร์เพ็ญ มาลี' },
    { docNo: 'CHG-66-0010', payMethod: 'equal-principal',   perInstallment: 9680, status: 'cancelled',arrearsPerTerm: 0,   addPrincipalYearly: 0,    addYearly: 0,     docDate: '2023-03-05', by: 'อนุวัฒน์ ใจดี'   },
  ],
  'L-2021-0332': [
    { docNo: 'CHG-67-0014', payMethod: 'equal-installment', perInstallment: 6450, status: 'approved', arrearsPerTerm: 250, addPrincipalYearly: 0,    addYearly: 12000, docDate: '2024-06-18', by: 'จันทร์เพ็ญ มาลี' },
    { docNo: 'CHG-66-0033', payMethod: 'equal-installment', perInstallment: 6450, status: 'applied',  arrearsPerTerm: 250, addPrincipalYearly: 0,    addYearly: 12000, docDate: '2023-09-02', by: 'จันทร์เพ็ญ มาลี' },
  ],
  'L-2020-0118': [
    { docNo: 'CHG-67-0009', payMethod: 'restructure',       perInstallment: 5500, status: 'pending',  arrearsPerTerm: 500, addPrincipalYearly: 0,    addYearly: 0,     docDate: '2024-06-03', by: 'จันทร์เพ็ญ มาลี' },
  ],
};
window.icrHistory = (contractNo) => window.ICR_HISTORY[contractNo] || [];

// ─── จำนวนครั้งที่เคยปรับโครงสร้าง (สำหรับ "ปรับโครงสร้างซ้ำ") ───────
window.icrRestructCount = (contractNo) =>
  (window.icrHistory(contractNo) || []).filter(h => h.payMethod === 'restructure').length;

// ─── ตารางชำระหนี้ (amortization) — แจกแจงทีละงวด ────────────────────
//  • graceTerms งวดแรกใช้ค่างวดที่ลด (graceInstallment) แล้วผ่อนปกติจนงวดสุดท้าย
//  • งวดสุดท้ายหักเก็บยอดคงเหลือทั้งหมด (เก็บเต็มจำนวน)
//  • ผู้ค้ำประกัน: จำกัด ≤60 งวด แล้วเก็บเต็มจำนวนในงวดที่ 61
//  คืน { rows:[{term,due,principal,interest,pay,balance,grace,collectFull}], capped, term61 }
window.icrBuildSchedule = ({ outstanding, rate, terms, perInstallment, graceTerms = 0, graceInstallment = 0, startDate, role = 'borrower' }) => {
  const r = (Number(rate) || 0) / 100 / 12;
  let n = Math.max(1, Math.floor(Number(terms) || 1));
  const guarantor = role === 'guarantor';
  const CAP = 60;
  let capped = false;
  if (guarantor && n > CAP) { n = CAP; capped = true; }
  const per = Number(perInstallment) || 0;
  const gPer = Number(graceInstallment) || 0;
  const gT = Math.max(0, Math.min(Math.floor(Number(graceTerms) || 0), n - 1));
  let bal = Number(outstanding) || 0;
  const base = startDate ? new Date(startDate) : new Date();
  const r2 = (x) => Math.round(x * 100) / 100;
  const rows = [];
  for (let i = 1; i <= n && bal > 0.005; i++) {
    const balBefore = bal;
    const interest = r2(balBefore * r);
    let pay = i <= gT ? gPer : per;
    let principal;
    let collectFull = false;
    const lastCollectsAll = (i === n) && !(guarantor && capped);
    const due = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
    if (lastCollectsAll || pay - interest >= balBefore) {
      principal = balBefore; pay = r2(principal + interest); collectFull = true;
    } else {
      principal = Math.max(0, r2(pay - interest));
    }
    bal = Math.max(0, r2(balBefore - principal));
    rows.push({ term: i, due: due.toISOString().slice(0, 10), principal, interest, pay, balance: bal, grace: i <= gT, collectFull });
  }
  let term61 = null;
  if (guarantor && capped && bal > 0.005) {
    const interest = r2(bal * r);
    const due = new Date(base.getFullYear(), base.getMonth() + (CAP + 1), base.getDate());
    term61 = { term: CAP + 1, due: due.toISOString().slice(0, 10), principal: bal, interest, pay: r2(bal + interest), balance: 0, grace: false, collectFull: true };
    rows.push(term61);
    bal = 0;
  }
  return { rows, capped, term61, finalBalance: bal };
};

// ─── เชื่อมกับเมนูพักชำระหนี้ — ตรวจ/ยกเลิกรายการพักชำระที่ยัง active ──
window.icrActiveSuspension = (contractNo) => {
  if (!contractNo || !window.dsLoad) return null;
  try { return (window.dsLoad() || []).find(r => r.contractNo === contractNo && r.status !== 'cancelled') || null; }
  catch (e) { return null; }
};
window.icrCancelSuspension = (contractNo) => {
  if (!contractNo || !window.dsLoad || !window.dsSaveLS) return null;
  try {
    const list = window.dsLoad() || [];
    let hit = null;
    const today = (window.dnToday ? window.dnToday() : new Date().toISOString().slice(0, 10));
    const next = list.map(r => {
      if (r.contractNo === contractNo && r.status !== 'cancelled') {
        hit = r;
        return { ...r, status: 'cancelled', cancelledDate: today, cancelReason: 'ยกเลิกอัตโนมัติจากการปรับโครงสร้างหนี้' };
      }
      return r;
    });
    if (hit) window.dsSaveLS(next);
    return hit;
  } catch (e) { return null; }
};

// ─── โหลด / บันทึก localStorage ─────────────────────────────────────
window.icrLoad = () => {
  try {
    const saved = localStorage.getItem('installment_changes');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.ICR_SEED.map(r => ({ ...r }));
};
window.icrSaveLS = (list) => {
  try { localStorage.setItem('installment_changes', JSON.stringify(list)); } catch (e) {}
};
