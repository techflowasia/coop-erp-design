// ════════════════════════════════════════════════════════════════════
//  ระบบงานขอสินไหม / งานประกันสมาชิก
//  ตรวจสอบสิทธิการเข้าโครงการประกัน (Claim Eligibility Check)
//  ── ค้นหาสมาชิก · ตรวจสอบสถานะ · ยืนยันสิทธิก่อนยื่นขอสินไหม
//  ข้อมูลสาธิตครอบคลุมทุกผลลัพธ์: มีสิทธิ์ / ไม่มีสิทธิ์ / รอเอกสาร / ต้องตรวจสอบ
// ════════════════════════════════════════════════════════════════════

// ─── ค่าคงที่ที่หน้าจอนี้รองรับ ───────────────────────────────────────
window.CL_INSURANCE_TYPES = ['ประกันชีวิต', 'ประกันเงินกู้', 'ประกันกลุ่ม'];
window.CL_MEMBER_STATUS   = ['ปกติ', 'ลาออก', 'เสียชีวิต', 'พ้นสภาพ'];
window.CL_WORK_STATUS     = ['ทำงาน', 'เกษียณ', 'ลาออก', 'พ้นสภาพ'];
window.CL_DEATH_STATUS    = [{ v: 'alive', l: 'ยังไม่เสียชีวิต' }, { v: 'deceased', l: 'เสียชีวิตแล้ว' }];

// สถานะความคุ้มครองกรมธรรม์
window.CL_COVERAGE_STATUS = {
  active:  { l: 'คุ้มครองอยู่',  pill: 'ok' },
  pending: { l: 'รอมีผล',       pill: 'info' },
  ended:   { l: 'สิ้นสุด',       pill: 'neutral' },
  expired: { l: 'สิ้นสุดคุ้มครอง', pill: 'bad' },
  cancelled: { l: 'ยกเลิก',      pill: 'bad' },
};
// สถานะคำขอสินไหม
window.CL_CLAIM_STATUS = {
  none:      { l: 'ยังไม่ขอ',       pill: 'neutral' },
  draft:     { l: 'ร่างคำขอ',       pill: 'neutral' },
  review:    { l: 'รอตรวจสอบ',      pill: 'warn' },
  sent:      { l: 'ส่งบริษัทประกัน', pill: 'info' },
  approved:  { l: 'อนุมัติ',        pill: 'ok' },
  rejected:  { l: 'ปฏิเสธ',         pill: 'bad' },
  paid:      { l: 'จ่ายแล้ว',       pill: 'ok' },
  cancelled: { l: 'ยกเลิก',         pill: 'neutral' },
};
window.clCoverageTag = (k) => window.CL_COVERAGE_STATUS[k] || { l: k, pill: 'neutral' };
window.clClaimTag    = (k) => window.CL_CLAIM_STATUS[k] || { l: k, pill: 'neutral' };

// เอกสารประกอบตามประเภทประกัน (จำเป็น/ไม่จำเป็น)
window.CL_DOC_TEMPLATE = {
  'ประกันชีวิต': ['ใบมรณบัตร', 'สำเนาบัตรประชาชนผู้เสียชีวิต', 'สำเนาทะเบียนบ้าน', 'เอกสารผู้รับผลประโยชน์', 'สำเนากรมธรรม์'],
  'ประกันเงินกู้': ['ใบมรณบัตร', 'สำเนาบัตรประชาชนผู้เสียชีวิต', 'สำเนาทะเบียนบ้าน', 'สัญญาเงินกู้', 'หนังสือรับรองยอดหนี้คงเหลือ'],
  'ประกันกลุ่ม': ['ใบมรณบัตร', 'สำเนาบัตรประชาชนผู้เสียชีวิต', 'เอกสารผู้รับผลประโยชน์'],
};

// ─── ข้อมูลสาธิตสมาชิก (ผู้เข้าข่ายขอสินไหม) ─────────────────────────
//  แต่ละคนสาธิตผลการตรวจสอบสิทธิที่ต่างกัน
window.CL_MEMBERS = [
  // ① มีสิทธิ์ขอสินไหม — เสียชีวิต · อยู่ในคุ้มครอง · ไม่เคยขอ · เอกสารครบ
  {
    code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3',
    birthDate: '1962-03-14', deptCode: '0801', dept: 'กองคลัง สำนักงานปลัด',
    memberStatus: 'เสียชีวิต', workStatus: 'เกษียณ', joinDate: '2005-06-01', resignDate: '',
    deathStatus: 'deceased', deathDate: '2026-04-18', deathSource: 'งานทะเบียนสมาชิก',
    policies: [
      { id: 'PL-58241-1', projCode: 'PRJ-LIFE-01', projName: 'โครงการประกันชีวิตกลุ่มสมาชิก 2568', insType: 'ประกันชีวิต',
        company: 'บมจ. ไทยสมุทรประกันชีวิต', policyNo: 'INS-2568-00141', refNo: 'REF-58241-A',
        startDate: '2025-05-12', endDate: '2026-05-11', coverage: 1500000, premium: 18500,
        beneficiary: 'นางวิภา ใจดี (คู่สมรส)', coverageStatus: 'active', claimStatus: 'none',
        claimCond: 'คุ้มครองกรณีเสียชีวิตทุกกรณี เว้นข้อยกเว้นตามกรมธรรม์', exclusion: false },
      { id: 'PL-58241-2', projCode: 'PRJ-LOAN-02', projName: 'โครงการประกันคุ้มครองสินเชื่อ', insType: 'ประกันเงินกู้',
        company: 'บมจ. กรุงเทพประกันภัย', policyNo: 'INS-2568-00142', refNo: 'REF-58241-B',
        startDate: '2025-05-12', endDate: '2026-05-11', coverage: 500000, premium: 3200,
        beneficiary: 'สหกรณ์ออมทรัพย์ (ชำระหนี้คงเหลือ)', coverageStatus: 'active', claimStatus: 'none',
        claimCond: 'จ่ายตามยอดหนี้คงเหลือ ณ วันเสียชีวิต', exclusion: false },
    ],
    claims: [],
    docs: [
      { name: 'ใบมรณบัตร', required: true, status: 'complete', attachDate: '2026-04-22', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนาบัตรประชาชนผู้เสียชีวิต', required: true, status: 'complete', attachDate: '2026-04-22', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนาทะเบียนบ้าน', required: true, status: 'complete', attachDate: '2026-04-22', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'เอกสารผู้รับผลประโยชน์', required: true, status: 'complete', attachDate: '2026-04-23', attachBy: 'จันทร์เพ็ญ มาลี', note: 'สำเนาบัตร + ทะเบียนบ้านคู่สมรส' },
      { name: 'สำเนากรมธรรม์', required: false, status: 'complete', attachDate: '2026-04-23', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
    ],
  },

  // ② รอเอกสารเพิ่มเติม — เสียชีวิต · คุ้มครอง · ไม่เคยขอ · เอกสารไม่ครบ
  {
    code: 'M-058251', name: 'นายภาคภูมิ รัตนา', citizenId: '1-1098-00211-87-2',
    birthDate: '1968-11-02', deptCode: '0601', dept: 'กองสาธารณสุข',
    memberStatus: 'เสียชีวิต', workStatus: 'พ้นสภาพ', joinDate: '2010-01-15', resignDate: '2026-05-20',
    deathStatus: 'deceased', deathDate: '2026-05-18', deathSource: 'บันทึกโดยเจ้าหน้าที่',
    policies: [
      { id: 'PL-58251-1', projCode: 'PRJ-GRP-03', projName: 'โครงการประกันกลุ่มฌาปนกิจสมาชิก', insType: 'ประกันกลุ่ม',
        company: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์', policyNo: 'INS-2568-00150', refNo: 'REF-58251-A',
        startDate: '2025-06-25', endDate: '2026-06-24', coverage: 600000, premium: 4800,
        beneficiary: 'นางสาวพิมพ์ใจ รัตนา (บุตร)', coverageStatus: 'active', claimStatus: 'review',
        claimCond: 'คุ้มครองสมาชิกที่ชำระเบี้ยครบตามกำหนด', exclusion: false },
    ],
    claims: [],
    docs: [
      { name: 'ใบมรณบัตร', required: true, status: 'complete', attachDate: '2026-05-21', attachBy: 'อนุวัฒน์ ใจดี', note: '' },
      { name: 'สำเนาบัตรประชาชนผู้เสียชีวิต', required: true, status: 'complete', attachDate: '2026-05-21', attachBy: 'อนุวัฒน์ ใจดี', note: '' },
      { name: 'เอกสารผู้รับผลประโยชน์', required: true, status: 'pending', attachDate: '', attachBy: '', note: 'รอสำเนาบัตร/ทะเบียนบ้านบุตร' },
    ],
  },

  // ③ ไม่มีสิทธิ์ — เสียชีวิตนอกช่วงคุ้มครอง (กรมธรรม์หมดอายุ)
  {
    code: 'M-058249', name: 'นายสุรชัย วงศ์ประเสริฐ', citizenId: '3-1019-00112-44-5',
    birthDate: '1959-07-30', deptCode: '0301', dept: 'กองช่าง',
    memberStatus: 'เสียชีวิต', workStatus: 'เกษียณ', joinDate: '2001-03-01', resignDate: '',
    deathStatus: 'deceased', deathDate: '2026-08-02', deathSource: 'งานทะเบียนสมาชิก',
    policies: [
      { id: 'PL-58249-1', projCode: 'PRJ-LIFE-01', projName: 'โครงการประกันชีวิตกลุ่มสมาชิก 2568', insType: 'ประกันชีวิต',
        company: 'บมจ. ไทยสมุทรประกันชีวิต', policyNo: 'INS-2568-00088', refNo: 'REF-58249-A',
        startDate: '2025-06-20', endDate: '2026-06-19', coverage: 900000, premium: 11200,
        beneficiary: 'นางอรพิน วงศ์ประเสริฐ (คู่สมรส)', coverageStatus: 'expired', claimStatus: 'none',
        claimCond: 'คุ้มครองเฉพาะช่วงกรมธรรม์มีผล', exclusion: false },
    ],
    claims: [],
    docs: [
      { name: 'ใบมรณบัตร', required: true, status: 'complete', attachDate: '2026-08-05', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนาบัตรประชาชนผู้เสียชีวิต', required: true, status: 'complete', attachDate: '2026-08-05', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนาทะเบียนบ้าน', required: true, status: 'complete', attachDate: '2026-08-05', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'เอกสารผู้รับผลประโยชน์', required: true, status: 'complete', attachDate: '2026-08-05', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนากรมธรรม์', required: false, status: 'complete', attachDate: '2026-08-05', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
    ],
  },

  // ④ ไม่มีสิทธิ์ — เคยขอสินไหมในโครงการเดียวกันแล้ว (ขอซ้ำ)
  {
    code: 'M-047003', name: 'นายวีระ จันทร์ดี', citizenId: '3-1099-00234-88-0',
    birthDate: '1950-02-10', deptCode: '0601', dept: 'กองสาธารณสุข',
    memberStatus: 'เสียชีวิต', workStatus: 'เกษียณ', joinDate: '1998-05-10', resignDate: '',
    deathStatus: 'deceased', deathDate: '2026-02-10', deathSource: 'งานทะเบียนสมาชิก',
    policies: [
      { id: 'PL-47003-1', projCode: 'PRJ-LIFE-01', projName: 'โครงการประกันชีวิตกลุ่มสมาชิก 2568', insType: 'ประกันชีวิต',
        company: 'บมจ. ไทยสมุทรประกันชีวิต', policyNo: 'INS-2567-00060', refNo: 'REF-47003-A',
        startDate: '2025-10-01', endDate: '2026-09-30', coverage: 1000000, premium: 12800,
        beneficiary: 'นางสมใจ จันทร์ดี (คู่สมรส)', coverageStatus: 'active', claimStatus: 'approved',
        claimCond: 'คุ้มครองกรณีเสียชีวิตทุกกรณี', exclusion: false },
    ],
    claims: [
      { claimNo: 'CLM-2569-0018', date: '2026-02-20', projName: 'โครงการประกันชีวิตกลุ่มสมาชิก 2568',
        company: 'บมจ. ไทยสมุทรประกันชีวิต', claimAmount: 1000000, status: 'approved',
        sentDate: '2026-02-24', approveDate: '2026-03-30', paidAmount: 1000000, policyId: 'PL-47003-1' },
    ],
    docs: [
      { name: 'ใบมรณบัตร', required: true, status: 'complete', attachDate: '2026-02-18', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนาบัตรประชาชนผู้เสียชีวิต', required: true, status: 'complete', attachDate: '2026-02-18', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนาทะเบียนบ้าน', required: true, status: 'complete', attachDate: '2026-02-18', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'เอกสารผู้รับผลประโยชน์', required: true, status: 'complete', attachDate: '2026-02-18', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
      { name: 'สำเนากรมธรรม์', required: false, status: 'complete', attachDate: '2026-02-18', attachBy: 'จันทร์เพ็ญ มาลี', note: '' },
    ],
  },

  // ⑤ ไม่มีสิทธิ์ — ไม่มีข้อมูลเข้าโครงการประกัน
  {
    code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', citizenId: '3-1019-00482-19-2',
    birthDate: '1971-09-19', deptCode: '0801', dept: 'กองคลัง สำนักงานปลัด',
    memberStatus: 'เสียชีวิต', workStatus: 'พ้นสภาพ', joinDate: '2012-07-01', resignDate: '2026-06-28',
    deathStatus: 'deceased', deathDate: '2026-06-26', deathSource: 'นำเข้าข้อมูล',
    policies: [],
    claims: [],
    docs: [],
  },

  // ⑥ ต้องตรวจสอบโดยเจ้าหน้าที่ — ยังไม่มีสถานะเสียชีวิต / ไม่มีวันเสียชีวิต
  {
    code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', citizenId: '3-1018-00112-87-4',
    birthDate: '1978-12-05', deptCode: '0301', dept: 'กองช่าง',
    memberStatus: 'ปกติ', workStatus: 'ทำงาน', joinDate: '2015-02-01', resignDate: '',
    deathStatus: 'alive', deathDate: '', deathSource: '',
    policies: [
      { id: 'PL-58243-1', projCode: 'PRJ-LOAN-02', projName: 'โครงการประกันคุ้มครองสินเชื่อ', insType: 'ประกันเงินกู้',
        company: 'บมจ. กรุงเทพประกันภัย', policyNo: 'INS-2568-00097', refNo: 'REF-58243-A',
        startDate: '2025-05-20', endDate: '2026-05-19', coverage: 2200000, premium: 9800,
        beneficiary: 'สหกรณ์ออมทรัพย์ (ชำระหนี้คงเหลือ)', coverageStatus: 'active', claimStatus: 'none',
        claimCond: 'จ่ายตามยอดหนี้คงเหลือ ณ วันเสียชีวิต', exclusion: false },
    ],
    claims: [],
    docs: [],
  },
];

// อายุจากวันเกิด (ณ วันทำการ)
window.clAge = (birth, fromStr) => {
  if (!birth) return null;
  const from = new Date((fromStr || window.DEPOSIT_WORKING_DATE || '2026-07-04') + 'T00:00:00');
  const b = new Date(birth + 'T00:00:00');
  let a = from.getFullYear() - b.getFullYear();
  const m = from.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && from.getDate() < b.getDate())) a--;
  return a;
};

// สถานะประกันโดยรวมของสมาชิก (ใช้ในตารางผลค้นหา)
window.clMemberInsSummary = (m) => {
  if (!m.policies || !m.policies.length) return { l: 'ไม่มีประกัน', pill: 'neutral' };
  const anyActive = m.policies.some(p => p.coverageStatus === 'active');
  return anyActive ? { l: 'มีประกัน · คุ้มครองอยู่', pill: 'ok' } : { l: 'มีประกัน · สิ้นสุด', pill: 'warn' };
};
// สถานะคำขอสินไหมล่าสุด
window.clMemberClaimSummary = (m) => {
  if (m.claims && m.claims.length) {
    const last = m.claims[m.claims.length - 1];
    return window.clClaimTag(last.status);
  }
  return window.clClaimTag('none');
};

// ─── Logic ตรวจสอบสิทธิอัตโนมัติ ──────────────────────────────────────
//  คืน { checks:[{key,label,detail,result:'pass'|'fail'|'warn'|'na'}], summary:{key,label,tone}, reasons:[], missingDocs:[] }
window.clEligibility = (m, policy, fromStr) => {
  const checks = [];
  const reasons = [];
  const hasPolicy = !!(m.policies && m.policies.length);
  const pol = policy || (hasPolicy ? m.policies[0] : null);

  // 1) มีข้อมูลเข้าโครงการประกัน
  checks.push({ key: 'hasPolicy', label: 'สมาชิกมีข้อมูลเข้าโครงการประกัน',
    result: hasPolicy ? 'pass' : 'fail',
    detail: hasPolicy ? `พบ ${m.policies.length} โครงการ` : 'ไม่พบข้อมูลโครงการประกันของสมาชิก' });
  if (!hasPolicy) reasons.push('ไม่พบข้อมูลเข้าโครงการประกัน');

  // 2) สมาชิกมีสถานะเสียชีวิต
  const deceased = m.deathStatus === 'deceased' && !!m.deathDate;
  checks.push({ key: 'deceased', label: 'สมาชิกมีสถานะเสียชีวิตแล้ว',
    result: deceased ? 'pass' : (m.deathStatus === 'deceased' ? 'warn' : 'fail'),
    detail: deceased ? `เสียชีวิต ${window.fmt.date(m.deathDate)} · แหล่ง: ${m.deathSource || '—'}`
      : (m.deathStatus === 'deceased' ? 'มีสถานะเสียชีวิต แต่ไม่พบวันที่เสียชีวิต' : 'สมาชิกยังไม่มีสถานะเสียชีวิต') });
  if (!deceased && m.deathStatus !== 'deceased') reasons.push('สมาชิกยังไม่มีสถานะเสียชีวิต');
  if (m.deathStatus === 'deceased' && !m.deathDate) reasons.push('ไม่พบวันที่เสียชีวิต');

  // 3) โครงการยังไม่ถูกยกเลิก
  const notCancelled = pol ? (pol.coverageStatus !== 'cancelled') : false;
  checks.push({ key: 'notCancelled', label: 'โครงการยังไม่ถูกยกเลิก',
    result: !pol ? 'na' : (notCancelled ? 'pass' : 'fail'),
    detail: !pol ? '—' : (notCancelled ? 'กรมธรรม์ยังมีผล ไม่ถูกยกเลิก' : 'กรมธรรม์ถูกยกเลิก') });
  if (pol && !notCancelled) reasons.push('กรมธรรม์ถูกยกเลิก');

  // 4) อยู่ในช่วงวันที่คุ้มครองตามกรมธรรม์ (วันเสียชีวิตอยู่ในช่วง start-end)
  let inCoverage = false;
  if (pol && deceased) {
    const d = new Date(m.deathDate + 'T00:00:00');
    inCoverage = d >= new Date(pol.startDate + 'T00:00:00') && d <= new Date(pol.endDate + 'T00:00:00');
  }
  checks.push({ key: 'inCoverage', label: 'อยู่ในช่วงวันที่คุ้มครองตามกรมธรรม์',
    result: (!pol || !deceased) ? 'na' : (inCoverage ? 'pass' : 'fail'),
    detail: !pol ? '—' : `คุ้มครอง ${window.fmt.date(pol.startDate)} – ${window.fmt.date(pol.endDate)}`
      + (deceased ? (inCoverage ? ' · วันเสียชีวิตอยู่ในช่วง' : ' · วันเสียชีวิตอยู่นอกช่วง') : '') });
  if (pol && deceased && !inCoverage) reasons.push('วันที่เสียชีวิตอยู่นอกช่วงความคุ้มครองของกรมธรรม์');

  // 5) ยังไม่เคยขอสินไหมซ้ำในโครงการเดียวกัน
  let noDup = true;
  if (pol && m.claims) {
    noDup = !m.claims.some(c => c.projName === pol.projName && !['cancelled', 'rejected'].includes(c.status));
  }
  checks.push({ key: 'noDup', label: 'ยังไม่เคยขอสินไหมซ้ำในโครงการเดียวกัน',
    result: !pol ? 'na' : (noDup ? 'pass' : 'fail'),
    detail: !pol ? '—' : (noDup ? 'ไม่พบคำขอสินไหมเดิมในโครงการนี้' : 'พบคำขอสินไหมในโครงการเดียวกันแล้ว') });
  if (pol && !noDup) reasons.push('พบรายการขอสินไหมในโครงการเดียวกันแล้ว');

  // 6) สมาชิกไม่อยู่ในข้อยกเว้น
  const notExcluded = pol ? !pol.exclusion : false;
  checks.push({ key: 'notExcluded', label: 'สมาชิกไม่อยู่ในข้อยกเว้นของประกัน',
    result: !pol ? 'na' : (notExcluded ? 'pass' : 'fail'),
    detail: !pol ? '—' : (notExcluded ? 'ไม่พบเงื่อนไขยกเว้น' : 'เข้าเงื่อนไขข้อยกเว้นของกรมธรรม์') });
  if (pol && !notExcluded) reasons.push('สมาชิกอยู่ในข้อยกเว้นของประกัน');

  // 7) เอกสารจำเป็นครบถ้วน
  const reqDocs = (m.docs || []).filter(d => d.required);
  const missingDocs = reqDocs.filter(d => d.status !== 'complete').map(d => d.name);
  // ถ้ายังไม่มี docs เลย ให้ถือว่าเอกสารตามแม่แบบยังไม่ครบ
  const template = pol ? (window.CL_DOC_TEMPLATE[pol.insType] || []) : [];
  const docsComplete = reqDocs.length > 0 && missingDocs.length === 0;
  const missingAll = (!reqDocs.length && template.length) ? template : missingDocs;
  checks.push({ key: 'docs', label: 'เอกสารจำเป็นครบถ้วน',
    result: !pol ? 'na' : (docsComplete ? 'pass' : 'warn'),
    detail: !pol ? '—' : (docsComplete ? `ครบถ้วน ${reqDocs.length} รายการ` : `ยังขาด ${missingAll.length} รายการ`) });

  // ─── สรุปผลสิทธิ ───
  let summary;
  const hardFail = checks.some(c => ['hasPolicy', 'notCancelled', 'inCoverage', 'noDup', 'notExcluded'].includes(c.key) && c.result === 'fail');
  const needStaff = (m.deathStatus === 'deceased' && !m.deathDate) || (m.deathStatus !== 'deceased' && hasPolicy);
  if (!hasPolicy) {
    summary = { key: 'no', label: 'ไม่มีสิทธิ์ขอสินไหม', tone: 'bad' };
  } else if (hardFail) {
    summary = { key: 'no', label: 'ไม่มีสิทธิ์ขอสินไหม', tone: 'bad' };
  } else if (needStaff) {
    summary = { key: 'staff', label: 'ต้องตรวจสอบโดยเจ้าหน้าที่', tone: 'info' };
  } else if (!docsComplete) {
    summary = { key: 'docwait', label: 'รอเอกสารเพิ่มเติม', tone: 'warn' };
  } else {
    summary = { key: 'ok', label: 'มีสิทธิ์ขอสินไหม', tone: 'ok' };
  }

  return { checks, summary, reasons, missingDocs: missingAll, policy: pol };
};

// สถานะเอกสาร → pill
window.CL_DOC_STATUS = {
  complete: { l: 'ครบถ้วน', pill: 'ok' },
  pending:  { l: 'ยังไม่ครบ', pill: 'bad' },
  review:   { l: 'รอตรวจสอบ', pill: 'warn' },
  invalid:  { l: 'ไม่ถูกต้อง', pill: 'bad' },
  na:       { l: 'ไม่จำเป็น', pill: 'neutral' },
};
window.clDocTag = (k) => window.CL_DOC_STATUS[k] || { l: k, pill: 'neutral' };
