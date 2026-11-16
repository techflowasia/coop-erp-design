// ════════════════════════════════════════════════════════════════════
//  ระบบสวัสดิการ — ทุนสาธารณประโยชน์ + สวัสดิการวันเกิด (TOR 8.3)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภททุน/เงินช่วยเหลือ ──────────────────────────────────────────
window.WG_TYPES = [
  { v: 'public',   l: 'ทุนสาธารณประโยชน์', desc: 'บริจาค/สนับสนุนหน่วยงานภายนอก' },
  { v: 'birthday', l: 'สวัสดิการวันเกิด',    desc: 'โอนเข้าบัญชีอัตโนมัติเดือนเกิด' },
  { v: 'aid',      l: 'เงินช่วยเหลือสมาชิก',  desc: 'ช่วยเหลือกรณีเดือดร้อน/เจ็บป่วย' },
];
window.wgType = (v) => window.WG_TYPES.find(x => x.v === v) || window.WG_TYPES[0];

// ─── สถานะ (เสนอผู้บริหาร → อนุมัติ → ออกใบสำคัญจ่าย) ─────────────────
window.WG_STATUS = {
  draft:    { l: 'ร่าง',             pill: 'neutral' },
  proposed: { l: 'เสนอผู้บริหาร',     pill: 'warn' },
  approved: { l: 'อนุมัติแล้ว',       pill: 'info' },
  voucher:  { l: 'ออกใบสำคัญจ่าย',    pill: 'ok' },
};
window.wgStatus = (v) => window.WG_STATUS[v] || window.WG_STATUS.draft;

// ─── หน่วยงานที่ให้ทุนสาธารณประโยชน์ ──────────────────────────────────
window.WG_ORGS = ['โรงเรียนในพื้นที่', 'โรงพยาบาล/สถานพยาบาล', 'วัด/ศาสนสถาน', 'มูลนิธิ/องค์กรการกุศล', 'หน่วยงานราชการ', 'ชุมชน/ท้องถิ่น'];

// ─── อัตราสวัสดิการวันเกิด (ตามอายุการเป็นสมาชิก) ────────────────────
window.WG_BIRTHDAY_TIERS = [
  { minYears: 0,  amount: 300 },
  { minYears: 10, amount: 500 },
  { minYears: 20, amount: 800 },
  { minYears: 30, amount: 1200 },
];
window.wgBirthdayAmount = (years) => {
  let amt = 0;
  window.WG_BIRTHDAY_TIERS.forEach(t => { if (years >= t.minYears) amt = t.amount; });
  return amt;
};

// ─── ข้อมูลตั้งต้น (ทุน/เงินช่วยเหลือ) ─────────────────────────────────
window.WG_SEED = [
  { id: 'WG-2569-001', type: 'public', title: 'สนับสนุนทุนอาหารกลางวัน โรงเรียนบ้านหนองบัว',
    org: 'โรงเรียนในพื้นที่', amount: 50000, reqDate: '2026-06-10', status: 'voucher',
    voucherNo: 'PV-2569-00231', payDate: '2026-06-18', note: 'โครงการสาธารณประโยชน์ประจำปี', by: 'จันทร์เพ็ญ มาลี' },
  { id: 'WG-2569-002', type: 'aid', title: 'เงินช่วยเหลือสมาชิกประสบอัคคีภัย',
    org: '', memberCode: 'M-058250', memberName: 'นายอนุชา สุขสวัสดิ์', amount: 20000, reqDate: '2026-06-22',
    status: 'approved', voucherNo: '', payDate: '', note: 'บ้านพักเสียหายจากเพลิงไหม้', by: 'จันทร์เพ็ญ มาลี' },
  { id: 'WG-2569-003', type: 'public', title: 'บริจาคสมทบทุนซื้อครุภัณฑ์การแพทย์ รพ.สต.',
    org: 'โรงพยาบาล/สถานพยาบาล', amount: 80000, reqDate: '2026-06-25', status: 'proposed',
    voucherNo: '', payDate: '', note: 'รออนุมัติจากคณะกรรมการ', by: 'จันทร์เพ็ญ มาลี' },
];
window.wgNextNo = (list, year) => {
  const yr = String(year || 2569);
  const nums = list.filter(r => String(r.id).startsWith('WG-' + yr)).map(r => parseInt(String(r.id).split('-')[2], 10) || 0);
  return `WG-${yr}-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
};

// ─── สมาชิกที่มีวันเกิดเดือนนี้ (สวัสดิการวันเกิดอัตโนมัติ) ────────────
//  ตัวอย่าง — ระบบจริงดึงจากทะเบียนสมาชิก
window.WG_BIRTHDAY_BATCH = {
  month: 6, monthLabel: 'มิถุนายน 2569',
  members: [
    { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', birth: '1981-06-08', years: 18, account: '001-2-58241-0', paid: true },
    { code: 'M-058246', name: 'นางพรพิมล ทองคำ', birth: '1976-06-15', years: 22, account: '001-2-58246-1', paid: true },
    { code: 'M-058250', name: 'นายอนุชา สุขสวัสดิ์', birth: '1990-06-22', years: 9, account: '001-2-58250-3', paid: false },
    { code: 'M-051042', name: 'นายบุญส่ง วราพันธ์', birth: '1955-06-28', years: 32, account: '001-2-51042-5', paid: false },
  ],
};
