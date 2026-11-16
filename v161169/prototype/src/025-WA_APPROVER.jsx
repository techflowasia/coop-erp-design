// ════════════════════════════════════════════════════════════════════
//  ระบบงานสวัสดิการสมาชิก — อนุมัติคำขอ (ศูนย์รวมคำขอที่ผ่านการประมวลผล)
//  ดึงคำขอทุกประเภทที่ผ่านการประมวลผลแล้ว → พิจารณาอนุมัติ → ออกใบสำคัญจ่าย
// ════════════════════════════════════════════════════════════════════

window.WA_APPROVER = 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์';

// ── ประเภทคำขอสวัสดิการ + บัญชีที่เกี่ยวข้อง ──────────────────────────
//  ทุนการศึกษาแยกไปอนุมัติที่เมนู "อนุมัติคำขอทุนการศึกษา" โดยเฉพาะ — ไม่แสดงที่นี่
window.WA_TYPES = [
  { v: 'relief',      l: 'เงินสงเคราะห์สมาชิก',    short: 'เงินสงเคราะห์', icon: 'money',   chip: 'danger',  gl: '5320 · เงินสงเคราะห์สมาชิก' },
  { v: 'seminar',     l: 'ค่าใช้จ่ายอบรม/สัมมนา',  short: 'อบรม/สัมมนา',  icon: 'calendar', chip: 'info',    gl: '5330 · ค่าใช้จ่ายอบรม/สัมมนา' },
  { v: 'grant',       l: 'ทุนสวัสดิการ/เงินช่วยเหลือ', short: 'เงินช่วยเหลือ', icon: 'wallet', chip: 'success', gl: '5340 · เงินสวัสดิการ/เงินช่วยเหลือ' },
  { v: 'funeral',     l: 'เงินฌาปนกิจสงเคราะห์',    short: 'ฌาปนกิจ',     icon: 'receipt', chip: 'warning', gl: '5350 · เงินฌาปนกิจสงเคราะห์' },
];
window.waType = (v) => window.WA_TYPES.find(t => t.v === v) || { l: v, short: v, icon: 'shield', chip: 'neutral', gl: '—' };

// ── สถานะการอนุมัติ ──────────────────────────────────────────────────
window.WA_STATUS = [
  { v: 'pending',  l: 'รอพิจารณา',       pill: 'warn' },
  { v: 'approved', l: 'อนุมัติแล้ว',      pill: 'info' },   // รอออกใบสำคัญจ่าย
  { v: 'voucher',  l: 'ออกใบสำคัญจ่ายแล้ว', pill: 'ok' },
  { v: 'rejected', l: 'ไม่อนุมัติ',       pill: 'bad' },
];
window.waStatus = (v) => window.WA_STATUS.find(s => s.v === v) || { l: v, pill: 'neutral' };

// ── วิธีจ่าย ──────────────────────────────────────────────────────────
window.WA_PAY_BY = {
  coop: 'โอนเข้าเงินฝากสหกรณ์', bank: 'โอนเข้าบัญชีธนาคาร',
  cash: 'รับเงินสด', postal: 'ธนาณัติ (ไปรษณีย์)',
  CBT: 'โอนเข้าบัญชีธนาคาร', CSH: 'รับเงินสด', MON: 'ธนาณัติ (ไปรษณีย์)', TRN: 'โอนเข้าเงินฝากสหกรณ์',
};
window.waPayBy = (v) => window.WA_PAY_BY[v] || v || '—';

// แผนกของสมาชิก (lookup)
function waDept(code) {
  const m = (window.MEMBERS_LIST || []).find(x => x.code === String(code).trim());
  return m ? (m.deptCode + ' · ' + m.dept) : '';
}

// ── ข้อมูลตั้งต้น: คำขอ "อื่น ๆ" ที่ผ่านการประมวลผลแล้ว (นอกเหนือทุนการศึกษา) ──
//  ทุนการศึกษาถูกดึงสดจากใบคำขอที่ผ่านการคัดเลือก (status 'approved')
window.WA_SEED = [
  { id: 'WA-RL-2569-0007', type: 'relief',  srcDoc: 'RL-2569-0031', memberCode: 'M-058246', memberName: 'นายประสิทธิ์ คงทน',
    payee: 'นางมาลี คงทน (คู่สมรส)', amount: 120000, processedDate: '2026-05-21', processedBy: 'สมหญิง ตั้งใจ',
    payBy: 'bank', payAccount: '402-1-58246-0', note: 'เงินสงเคราะห์กรณีสมาชิกเสียชีวิต · อายุสมาชิก 16 ปี', status: 'pending' },
  { id: 'WA-RL-2569-0008', type: 'relief',  srcDoc: 'RL-2569-0034', memberCode: 'M-058250', memberName: 'นางสุดารัตน์ พงษ์ไพร',
    payee: 'นางสุดารัตน์ พงษ์ไพร', amount: 10000, processedDate: '2026-05-24', processedBy: 'สมหญิง ตั้งใจ',
    payBy: 'coop', payAccount: '101-2-58250-9', note: 'สวัสดิการภัยพิบัติ · ระดับความเสียหายรุนแรง', status: 'pending' },
  { id: 'WA-SM-2569-0003', type: 'seminar', srcDoc: 'SM-2569-0012', memberCode: 'M-058245', memberName: 'นายวีระ ขำเพชร',
    payee: 'นายวีระ ขำเพชร', amount: 4500, processedDate: '2026-05-18', processedBy: 'จันทร์เพ็ญ มาลี',
    payBy: 'coop', payAccount: '101-2-58245-3', note: 'ค่าลงทะเบียนอบรมหลักสูตรผู้ตรวจสอบกิจการ', status: 'approved' },
  { id: 'WA-GR-2569-0005', type: 'grant',   srcDoc: 'GR-2569-0019', memberCode: 'M-058249', memberName: 'นายเอกพงษ์ วงศ์ประเสริฐ',
    payee: 'นายเอกพงษ์ วงศ์ประเสริฐ', amount: 3000, processedDate: '2026-05-20', processedBy: 'จันทร์เพ็ญ มาลี',
    payBy: 'coop', payAccount: '101-2-58249-1', note: 'เงินช่วยเหลือสมาชิกอุปสมบท', status: 'pending' },
  { id: 'WA-GR-2569-0006', type: 'grant',   srcDoc: 'GR-2569-0022', memberCode: 'M-058242', memberName: 'นางสาวพิมพ์ใจ ศรีสุข',
    payee: 'นางสาวพิมพ์ใจ ศรีสุข', amount: 2000, processedDate: '2026-05-22', processedBy: 'จันทร์เพ็ญ มาลี',
    payBy: 'bank', payAccount: '402-1-58242-0', note: 'เงินช่วยเหลือสมาชิกคลอดบุตร', status: 'approved' },
  { id: 'WA-FN-2569-0002', type: 'funeral', srcDoc: 'FN-2569-0008', memberCode: 'M-058247', memberName: 'นายธีรพล มั่นคง',
    payee: 'ทายาทผู้รับเงิน · นางพรทิพย์ มั่นคง', amount: 200000, processedDate: '2026-05-15', processedBy: 'สมหญิง ตั้งใจ',
    payBy: 'bank', payAccount: '402-1-58247-0', note: 'เงินฌาปนกิจสงเคราะห์ · สมาชิก ฌปท.', status: 'pending' },
];

// ── โหลดรายการอนุมัติ — รวม seed + ทุนการศึกษาที่ผ่านการคัดเลือก + decision ที่บันทึกไว้ ──
window.waDecisionStore = () => {
  try { return JSON.parse(localStorage.getItem('welfare_approvals_state') || '{}'); } catch (e) { return {}; }
};
window.waLoad = () => {
  const saved = window.waDecisionStore();
  const base = window.WA_SEED.map(r => ({ ...r, dept: waDept(r.memberCode) }));

  // ทุนการศึกษาถูกย้ายไปอนุมัติที่เมนู "อนุมัติคำขอทุนการศึกษา" โดยเฉพาะ
  // (ไม่ดึงเข้ามาที่เมนูอนุมัติคำขอรวมอีกต่อไป)

  // overlay decision ที่บันทึกไว้ (อนุมัติ/ออกใบสำคัญจ่าย/ไม่อนุมัติ)
  return base.map(it => saved[it.id] ? { ...it, ...saved[it.id] } : it);
};

// บันทึก decision ของรายการ
window.waSaveDecision = (id, patch) => {
  const store = window.waDecisionStore();
  store[id] = { ...(store[id] || {}), ...patch };
  try { localStorage.setItem('welfare_approvals_state', JSON.stringify(store)); } catch (e) {}
};

// เลขที่ใบสำคัญจ่าย (running)
window.waNextVoucherNo = () => {
  const store = window.waDecisionStore();
  const used = Object.values(store).map(s => s.voucherNo).filter(Boolean);
  const yr = 2569;
  const nums = used.filter(v => String(v).startsWith('PV-' + yr)).map(v => parseInt(String(v).split('-')[2], 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 40) + 1;
  return `PV-${yr}-${String(next).padStart(4, '0')}`;
};
