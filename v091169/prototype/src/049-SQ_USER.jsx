// ════════════════════════════════════════════════════════════════════
//  ทะเบียนอายัดเงิน — ข้อมูล / ค่าคงที่ / helpers
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  ใช้ฐานสมาชิกลูกหนี้ร่วม (window.DN_MEMBERS) กับ แจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════

window.SQ_USER = (typeof window.DN_USER === 'string' && window.DN_USER) || 'จันทร์เพ็ญ มาลี';
window.sqToday = () => new Date().toISOString().slice(0, 10);

// ─── ผู้มีอำนาจลงนามในหนังสืออายัด (ตั้งค่าผู้ลงนาม) ─────────────────
window.SQ_SIGNERS = [
  { name: 'นายมรุต หมุดเพียร',   position: 'ผู้จัดการ' },
  { name: 'นางสาวปิยะนุช ทองแท้', position: 'รองผู้จัดการ' },
  { name: 'นายวิเชียร ตั้งมั่น',   position: 'ผู้ช่วยผู้จัดการฝ่ายสินเชื่อ' },
  { name: 'นางอรพิน สายบัว',      position: 'หัวหน้าฝ่ายติดตามหนี้' },
];

// ─── ประเภทผู้ที่เกี่ยวข้อง (สำเนาเรียน) ─────────────────────────────
//  CCH = หน่วยงานต้นสังกัด · CCM = สมาชิกที่เกี่ยวข้อง
window.SQ_PARTY_TYPES = [
  { v: 'CCH', l: 'CCH · หน่วยงานต้นสังกัด' },
  { v: 'CCM', l: 'CCM · สมาชิกที่เกี่ยวข้อง' },
];

// ─── ประเภทหนี้ค้างชำระ ──────────────────────────────────────────────
window.SQ_DEBT_TYPES = [
  { v: 'BPN', l: 'BPN · เงินต้นเงินกู้' },
  { v: 'BIE', l: 'BIE · ดอกเบี้ยเงินกู้' },
  { v: 'BPY', l: 'BPY · ค่าปรับ/เบี้ยผิดนัด' },
  { v: 'BSH', l: 'BSH · เงินกู้กองทุนหุ้น' },
];
window.sqDebtType = (v) => window.SQ_DEBT_TYPES.find(t => t.v === v) || { v, l: v };

// ─── สถานะหนี้/สัญญา (รหัสจากระบบงานหลัก) ───────────────────────────
window.SQ_DEBT_STATUS = [
  { v: 'ID',   l: 'ID · ผิดนัดชำระ' },
  { v: 'I3RT', l: 'I3RT · ค้างชำระเกิน 3 งวด' },
  { v: 'LG',   l: 'LG · อยู่ระหว่างดำเนินคดี' },
  { v: '-',    l: '— · ปกติ/ไม่ระบุ' },
];

// ─── สาเหตุที่ติดตาม/อายัด ───────────────────────────────────────────
window.SQ_CAUSES = [
  'ผิดนัดชำระหนี้ติดต่อกันเกิน 3 งวด',
  'ลาออก/พ้นสภาพโดยมีหนี้คงค้าง',
  'ถูกให้ออกจากงาน/ไล่ออก',
  'โอน/ย้ายสังกัดออกจากหน่วยงานต้นสังกัด',
  'อยู่ระหว่างการดำเนินคดี',
  'ผู้ค้ำประกันไม่ชำระหนี้แทน',
];

// ─── เอกสารแนบมาตรฐาน (สิ่งที่ส่งมาด้วย) ─────────────────────────────
window.SQ_ATTACHMENT_PRESETS = [
  'สำเนาหนังสือยินยอมให้ต้นสังกัดหักเงินชำระหนี้ตามสัญญา',
  'สำเนาหนังสือโอนสิทธิเรียกร้อง',
  'สำเนาสัญญาเงินกู้',
  'สำเนาหนังสือค้ำประกัน',
  'สำเนาบัตรประจำตัวประชาชนของสมาชิก',
];

// ─── ประเภทสังกัด (สำหรับ dropdown ประกอบ) ──────────────────────────
window.SQ_DEPT_TYPES = ['ส่วนกลาง', 'ส่วนภูมิภาค', 'รัฐวิสาหกิจ', 'หน่วยงานอิสระ'];

// ─── รวมยอดต่อสัญญา (เงินต้น + ค่าปรับ) — แถว BPN ───────────────────
window.sqPrincipalOf = (d) =>
  (Number(d.principalRemaining) || 0) + (Number(d.penalty) || 0);

// ─── สร้างรายการหนี้ค้างชำระเริ่มต้นจากสัญญาของสมาชิก ────────────────
//  · ทุกสัญญา → แถว BPN (เงินต้น + ค่าปรับ)
//  · ดอกเบี้ยค้างทุกสัญญา → รวมเป็นแถว BIE เดียว
window.sqBuildDebtRows = (member) => {
  if (!member) return [];
  const rows = (member.debts || []).map(d => ({
    typeCode: d.type === 'กู้หุ้น' ? 'BSH' : 'BPN',
    contractNo: d.contractNo,
    statusCode: /ผิดนัด/.test(d.status) ? 'ID'
      : /ดำเนินคดี/.test(d.status) ? 'LG'
      : (Number(d.overdueInstallments) || 0) >= 3 ? 'I3RT' : '-',
    amount: window.sqPrincipalOf(d),
  }));
  const interest = (member.debts || []).reduce((s, d) => s + (Number(d.interestDue) || 0), 0);
  if (interest > 0) rows.push({ typeCode: 'BIE', contractNo: '-', statusCode: '-', amount: interest });
  return rows;
};

// ─── ยอดหนี้คงค้างรวม (ผลรวมรายการหนี้ค้างชำระ) ─────────────────────
window.sqOutstanding = (member) =>
  window.sqBuildDebtRows(member).reduce((s, r) => s + (Number(r.amount) || 0), 0);

// ─── ยอดเงินอายัด = หนี้คงค้าง − ทุนเรือนหุ้น (ไม่ต่ำกว่า 0) ─────────
window.sqSeizureAmount = (outstanding, shares) =>
  Math.max(0, (Number(outstanding) || 0) - (Number(shares) || 0));

// ─── ผู้ค้ำประกันของสัญญาที่เลือก (auto → สำเนาเรียนผู้ค้ำประกัน) ────
window.sqGuarantorsOf = (member, selectedContractNos) => {
  if (!member) return [];
  const set = new Set(selectedContractNos || []);
  const out = [];
  (member.debts || []).forEach(d => {
    if (set.size && !set.has(d.contractNo)) return;
    (d.guarantors || []).forEach(g => {
      out.push({ contractNo: d.contractNo, memberCode: g.memberCode, name: g.name, dept: g.dept });
    });
  });
  return out;
};

// ─── เลขทะเบียนติดตาม (auto) — SQ-{พ.ศ.}-{running 6 หลัก} ───────────
window.sqNextTrackNo = (list, beYear) => {
  const yr = String(beYear || (new Date().getFullYear() + 543));
  const nums = (list || []).filter(r => String(r.id).startsWith('SQ-' + yr))
    .map(r => parseInt(String(r.id).split('-')[2], 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `SQ-${yr}-${String(next).padStart(6, '0')}`;
};

// ─── เลขที่อายัด (auto) — SQ{ปี2หลัก}01{running 4 หลัก} ─────────────
window.sqNextSeizureNo = (list) => {
  const yy = String((new Date().getFullYear() + 543) % 100).padStart(2, '0');
  const pfx = `SQ${yy}01`;
  const nums = (list || []).filter(r => String(r.seizureNo).startsWith(pfx))
    .map(r => parseInt(String(r.seizureNo).slice(pfx.length), 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 40) + 1;
  return `${pfx}${String(next).padStart(4, '0')}`;
};

// ─── สถานะรายการอายัด ────────────────────────────────────────────────
window.SQ_STATUS = [
  { v: 'recorded',  l: 'บันทึกแล้ว',   pill: 'info' },
  { v: 'effective', l: 'อายัดแล้ว',    pill: 'ok' },
  { v: 'cancelled', l: 'ยกเลิก',       pill: 'bad' },
];
window.sqStatus = (v) => window.SQ_STATUS.find(s => s.v === v) || { v, l: v, pill: 'neutral' };

// ─── ผู้มีอำนาจลงนาม = ผู้จัดการสหกรณ์ (ดึงอัตโนมัติเสมอ) ────────────
window.sqManager = () =>
  window.SQ_SIGNERS.find(s => s.position === 'ผู้จัดการ') || window.SQ_SIGNERS[0];

// ─── วันที่ทำสัญญา (ดึงจากระบบสัญญาเงินกู้) ─────────────────────────
window.sqContractDate = (no) =>
  (window.ICR_CONTRACT_EXTRA && window.ICR_CONTRACT_EXTRA[no] && window.ICR_CONTRACT_EXTRA[no].contractDate) || '';

// ─── โหลด/บันทึก localStorage ────────────────────────────────────────
const SQ_LS_KEY = 'coop.debtSeizure.v1';
window.sqLoad = () => {
  try {
    const raw = localStorage.getItem(SQ_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return window.SQ_SEED.map(r => ({ ...r }));
};
window.sqSaveLS = (list) => {
  try { localStorage.setItem(SQ_LS_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
};

// ─── ข้อมูลตั้งต้น (seed) — อ้างอิงสมาชิกจาก DN_MEMBERS ──────────────
(function seedSeizure() {
  const M = (window.DN_MEMBERS || []);
  const m1 = M.find(m => m.code === 'M-067012');
  const m2 = M.find(m => m.code === 'M-066238');
  const build = (m, over) => {
    if (!m) return null;
    const debts = window.sqBuildDebtRows(m);
    const outstanding = debts.reduce((s, r) => s + r.amount, 0);
    return {
      id: over.id, seizureNo: over.seizureNo, regDate: over.regDate,
      effectiveTo: over.effectiveTo,
      memberCode: m.code, memberName: m.name, dept: m.dept, deptCode: m.deptCode,
      deptType: 'ส่วนกลาง', shares: m.shares || 0, outstanding,
      cause: over.cause, causeDate: over.causeDate,
      notifyGuarantor: over.notifyGuarantor,
      signer: over.signer, signerPosition: over.signerPosition,
      attachments: over.attachments,
      contracts: (m.debts || []).map(d => ({ contractNo: d.contractNo, date: over.cdate[d.contractNo] || over.regDate, selected: true })),
      relatedParties: over.relatedParties,
      guarantors: window.sqGuarantorsOf(m, (m.debts || []).map(d => d.contractNo)),
      debts,
      seizureAmount: window.sqSeizureAmount(outstanding, m.shares || 0),
      status: over.status,
      enteredBy: window.SQ_USER,
      enteredAt: over.enteredAt,
    };
  };
  const seed = [];
  const r1 = build(m1, {
    id: 'SQ-2569-000001', seizureNo: 'SQ690100041', regDate: '2026-06-18',
    effectiveTo: '2026-09-30', cause: 'ผิดนัดชำระหนี้ติดต่อกันเกิน 3 งวด', causeDate: '2026-05-26',
    notifyGuarantor: true, signer: 'นายมรุต หมุดเพียร', signerPosition: 'ผู้จัดการ',
    attachments: [
      { id: 'a1', text: 'สำเนาหนังสือยินยอมให้ต้นสังกัดหักเงินชำระหนี้ตามสัญญา' },
      { id: 'a2', text: 'สำเนาหนังสือโอนสิทธิเรียกร้อง' },
    ],
    cdate: { 'L-2022-0455': '2022-03-14', 'EM-2024-0771': '2024-02-09', 'SP-2021-0144': '2021-07-19', 'SH-2023-0210': '2023-04-02' },
    relatedParties: [
      { id: 'p1', type: 'CCH', memberCode: '', detail: 'หน.กองช่าง' },
      { id: 'p2', type: 'CCM', memberCode: 'M-067012', detail: 'นายวิรัตน์ ทองสุข' },
    ],
    status: 'effective', enteredAt: '2026-06-18 10:22',
  });
  const r2 = build(m2, {
    id: 'SQ-2569-000002', seizureNo: 'SQ690100042', regDate: '2026-06-29',
    effectiveTo: '2026-12-31', cause: 'ลาออก/พ้นสภาพโดยมีหนี้คงค้าง', causeDate: '2026-06-10',
    notifyGuarantor: false, signer: 'นายมรุต หมุดเพียร', signerPosition: 'ผู้จัดการ',
    attachments: [
      { id: 'a1', text: 'สำเนาหนังสือยินยอมให้ต้นสังกัดหักเงินชำระหนี้ตามสัญญา' },
    ],
    cdate: { 'L-2021-0332': '2021-05-20' },
    relatedParties: [
      { id: 'p1', type: 'CCH', memberCode: '', detail: 'หน.กองการศึกษา' },
    ],
    status: 'recorded', enteredAt: '2026-06-29 14:05',
  });
  if (r1) seed.push(r1);
  if (r2) seed.push(r2);
  window.SQ_SEED = seed;
})();
