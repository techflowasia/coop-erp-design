// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — จัดการประกันภัยสมาชิก (ต่อเบี้ยประกัน / Renewal)
//  ข้อมูลตัวอย่าง: รายการกรมธรรม์ที่ครบกำหนดต่ออายุ + ตัวช่วยจัดการ
// ════════════════════════════════════════════════════════════════════

// ประเภทประกันภัยที่สหกรณ์ดูแล
window.INSURANCE_RENEWAL_TYPES = [
  'ประกันชีวิตคุ้มครองสินเชื่อ',
  'ประกันอุบัติเหตุส่วนบุคคล (PA)',
  'ประกันกลุ่มสมาชิก',
  'ประกันอัคคีภัยหลักทรัพย์',
];

// ─── ข้อมูลตัวอย่าง: รายการต่อเบี้ยประกันของสมาชิก ───────────────────
//  status: pending = ยังไม่ต่ออายุ · review = รอตรวจสอบ · renewed = ต่ออายุแล้ว
//  ระดับความเร่งด่วน (สี) คำนวณจาก endDate เทียบวันทำการ
window.INSURANCE_RENEWAL_SEED = [
  { id: 'IR-00001', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3',
    dept: 'กองคลัง สำนักงานปลัด', phone: '081-234-5678', address: '88/12 ถ.ติวานนท์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2568-00141', newPolicyNo: '', coverage: 1500000, premium: 18500,
    startDate: '2025-05-12', endDate: '2026-05-11', payMethod: 'collect',
    beneficiary: 'นางวิภา ใจดี (คู่สมรส)', status: 'pending' },

  { id: 'IR-00002', memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์', citizenId: '3-1018-00112-87-4',
    dept: 'กองช่าง', phone: '089-887-1122', address: '14 หมู่ 3 ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันอัคคีภัยหลักทรัพย์', company: 'บมจ. กรุงเทพประกันภัย',
    oldPolicyNo: 'INS-2568-00097', newPolicyNo: '', coverage: 2200000, premium: 9800,
    startDate: '2025-05-20', endDate: '2026-05-19', payMethod: 'deduct',
    beneficiary: '—', status: 'pending' },

  { id: 'IR-00003', memberCode: 'M-058245', memberName: 'นายธีรพงษ์ ขำเพชร', citizenId: '1-2099-00321-66-8',
    dept: 'สำนักปลัด', phone: '062-345-9090', address: '209/5 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2568-00110', newPolicyNo: '', coverage: 1800000, premium: 22400,
    startDate: '2025-06-01', endDate: '2026-05-28', payMethod: 'collect',
    beneficiary: 'นางสมหญิง ขำเพชร (มารดา)', status: 'pending' },

  { id: 'IR-00004', memberCode: 'M-058242', memberName: 'นางสาวกานต์ ศิริวงศ์', citizenId: '1-1099-00214-22-1',
    dept: 'กองการศึกษา', phone: '084-556-7788', address: '72 หมู่ 1 ต.คลองข่อย อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันอุบัติเหตุส่วนบุคคล (PA)', company: 'บมจ. กรุงเทพประกันภัย',
    oldPolicyNo: 'INS-2568-00123', newPolicyNo: '', coverage: 500000, premium: 3200,
    startDate: '2025-06-15', endDate: '2026-06-14', payMethod: 'collect',
    beneficiary: 'นายประสิทธิ์ ศิริวงศ์ (บิดา)', status: 'pending' },

  { id: 'IR-00005', memberCode: 'M-058249', memberName: 'นายสุรชัย วงศ์ประเสริฐ', citizenId: '3-1019-00112-44-5',
    dept: 'กองช่าง', phone: '081-998-2211', address: '5/9 ถ.แจ้งวัฒนะ ต.ปากเกร็ด อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2568-00088', newPolicyNo: '', coverage: 900000, premium: 11200,
    startDate: '2025-06-20', endDate: '2026-06-19', payMethod: 'transfer',
    beneficiary: 'นางอรพิน วงศ์ประเสริฐ (คู่สมรส)', status: 'review' },

  { id: 'IR-00006', memberCode: 'M-058251', memberName: 'นายภาคภูมิ รัตนา', citizenId: '1-1098-00211-87-2',
    dept: 'กองสาธารณสุข', phone: '090-112-3344', address: '33 หมู่ 6 ต.บางตลาด อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันกลุ่มสมาชิก', company: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์',
    oldPolicyNo: 'INS-2568-00150', newPolicyNo: '', coverage: 600000, premium: 4800,
    startDate: '2025-06-25', endDate: '2026-06-24', payMethod: 'collect',
    beneficiary: 'นางสาวพิมพ์ใจ รัตนา (บุตร)', status: 'pending' },

  { id: 'IR-00007', memberCode: 'M-058244', memberName: 'นางวิภา จันทร์เพ็ญ', citizenId: '3-1019-00482-19-2',
    dept: 'กองคลัง สำนักงานปลัด', phone: '086-778-9900', address: '120/7 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2568-00132', newPolicyNo: '', coverage: 400000, premium: 5600,
    startDate: '2025-07-01', endDate: '2026-06-30', payMethod: 'collect',
    beneficiary: 'นายเอกชัย จันทร์เพ็ญ (คู่สมรส)', status: 'pending' },

  { id: 'IR-00008', memberCode: 'M-058248', memberName: 'นางสาวศิริพร ใจงาม', citizenId: '1-1019-00541-23-7',
    dept: 'กองการศึกษา', phone: '083-221-7766', address: '45 หมู่ 2 ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันอุบัติเหตุส่วนบุคคล (PA)', company: 'บมจ. กรุงเทพประกันภัย',
    oldPolicyNo: 'INS-2568-00144', newPolicyNo: '', coverage: 500000, premium: 3000,
    startDate: '2025-07-10', endDate: '2026-07-09', payMethod: 'cash',
    beneficiary: 'นางมาลี ใจงาม (มารดา)', status: 'pending' },

  { id: 'IR-00009', memberCode: 'M-058250', memberName: 'นางอรอนงค์ บุญมาก', citizenId: '3-1018-00772-19-3',
    dept: 'สำนักปลัด', phone: '081-445-6677', address: '8/3 ถ.ติวานนท์ ต.ท่าทราย อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2568-00118', newPolicyNo: '', coverage: 750000, premium: 9400,
    startDate: '2025-08-01', endDate: '2026-07-31', payMethod: 'collect',
    beneficiary: 'นายสมพงษ์ บุญมาก (คู่สมรส)', status: 'pending' },

  { id: 'IR-00010', memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ', citizenId: '3-1018-00928-44-1',
    dept: 'กองสาธารณสุข', phone: '095-332-1199', address: '17 หมู่ 4 ต.คลองเกลือ อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันกลุ่มสมาชิก', company: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์',
    oldPolicyNo: 'INS-2568-00161', newPolicyNo: '', coverage: 300000, premium: 2400,
    startDate: '2025-08-15', endDate: '2026-08-14', payMethod: 'collect',
    beneficiary: 'นางบุญมา ทองคำ (มารดา)', status: 'pending' },

  { id: 'IR-00011', memberCode: 'M-058247', memberName: 'นายวีรชัย พิทักษ์ธรรม', citizenId: '5-1099-00021-11-9',
    dept: 'กองการคลัง', phone: '081-667-8899', address: '99/1 ถ.รัตนาธิเบศร์ ต.บางรักน้อย อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2567-00072', newPolicyNo: 'INS-2569-00203', coverage: 1200000, premium: 16800,
    startDate: '2026-05-01', endDate: '2027-04-30', payMethod: 'collect',
    beneficiary: 'นางสุดา พิทักษ์ธรรม (คู่สมรส)', status: 'renewed' },

  { id: 'IR-00012', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3',
    dept: 'กองคลัง สำนักงานปลัด', phone: '081-234-5678', address: '88/12 ถ.ติวานนท์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันอุบัติเหตุส่วนบุคคล (PA)', company: 'บมจ. กรุงเทพประกันภัย',
    oldPolicyNo: 'INS-2568-00142', newPolicyNo: '', coverage: 500000, premium: 3200,
    startDate: '2025-05-12', endDate: '2026-05-11', payMethod: 'collect',
    beneficiary: 'นางวิภา ใจดี (คู่สมรส)', status: 'pending' },

  { id: 'IR-00013', memberCode: 'M-058252', memberName: 'นางสาวจุฬาลักษณ์ พัฒนกุล', citizenId: '5-1019-00482-11-9',
    dept: 'กองคลัง สำนักงานปลัด', phone: '087-100-2030', address: '6 หมู่ 8 ต.บางตลาด อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
    oldPolicyNo: 'INS-2569-00170', newPolicyNo: 'INS-2569-00205', coverage: 800000, premium: 10200,
    startDate: '2026-04-15', endDate: '2027-04-14', payMethod: 'transfer',
    beneficiary: 'นางสมร พัฒนกุล (มารดา)', status: 'renewed' },

  { id: 'IR-00014', memberCode: 'M-058245', memberName: 'นายธีรพงษ์ ขำเพชร', citizenId: '1-2099-00321-66-8',
    dept: 'สำนักปลัด', phone: '062-345-9090', address: '209/5 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000',
    insuranceType: 'ประกันอัคคีภัยหลักทรัพย์', company: 'บมจ. กรุงเทพประกันภัย',
    oldPolicyNo: 'INS-2568-00099', newPolicyNo: '', coverage: 3000000, premium: 12600,
    startDate: '2025-09-01', endDate: '2026-08-31', payMethod: 'deduct',
    beneficiary: '—', status: 'pending' },

  { id: 'IR-00015', memberCode: 'M-058249', memberName: 'นายสุรชัย วงศ์ประเสริฐ', citizenId: '3-1019-00112-44-5',
    dept: 'กองช่าง', phone: '081-998-2211', address: '5/9 ถ.แจ้งวัฒนะ ต.ปากเกร็ด อ.ปากเกร็ด จ.นนทบุรี 11120',
    insuranceType: 'ประกันกลุ่มสมาชิก', company: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์',
    oldPolicyNo: 'INS-2568-00091', newPolicyNo: '', coverage: 600000, premium: 4800,
    startDate: '2025-09-10', endDate: '2026-09-09', payMethod: 'collect',
    beneficiary: 'นางอรพิน วงศ์ประเสริฐ (คู่สมรส)', status: 'pending' },
];

// ─── โครงการเงินกู้ + ลักษณะสัญญา (ผูกกับกรมธรรม์) ────────────────────
//  โครงการเงินกู้ = ผลิตภัณฑ์ที่เปิดใช้งานในค่าคงที่ (ชุดเดียวกับใบคำขอกู้)
window.INSURANCE_LOAN_PROJECTS = () => {
  const ps = (window.lrProducts ? window.lrProducts() : (window.LP_SEED || [])).filter(p => p.enabled);
  return ps.length ? ps.map(p => p.name) : ['ฉุกเฉินเงินสด', 'สามัญปกติ', 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', 'สามัญเพิ่มสุข (ชำระจากปันผล)'];
};
window.INSURANCE_CONTRACT_NATURES = ['สัญญาเงินกู้ปกติ', 'ปรับโครงสร้างหนี้'];

// เลขที่สัญญาเงินกู้ / โครงการเงินกู้ / ลักษณะสัญญา ของแต่ละรายการต่อประกัน
const _IR_LOAN_INFO = {
  'IR-00001': ['L-2566-0148', 'สามัญปกติ',  'สัญญาเงินกู้ปกติ'],
  'IR-00002': ['L-2565-0078', 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', 'สัญญาเงินกู้ปกติ'],
  'IR-00003': ['L-2566-0110', 'สามัญปกติ',  'ปรับโครงสร้างหนี้'],
  'IR-00004': ['L-2567-0231', 'ฉุกเฉินเงินสด', 'สัญญาเงินกู้ปกติ'],
  'IR-00005': ['L-2566-0088', 'สามัญปกติ',  'สัญญาเงินกู้ปกติ'],
  'IR-00006': ['L-2567-0150', 'ฉุกเฉินเงินสด', 'สัญญาเงินกู้ปกติ'],
  'IR-00007': ['L-2567-0132', 'สามัญเพิ่มสุข (ชำระจากปันผล)',  'สัญญาเงินกู้ปกติ'],
  'IR-00008': ['L-2566-0144', 'ฉุกเฉินเงินสด', 'สัญญาเงินกู้ปกติ'],
  'IR-00009': ['L-2566-0118', 'สามัญปกติ',  'ปรับโครงสร้างหนี้'],
  'IR-00010': ['L-2567-0161', 'ฉุกเฉินเงินสด', 'สัญญาเงินกู้ปกติ'],
  'IR-00011': ['L-2564-0072', 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', 'สัญญาเงินกู้ปกติ'],
  'IR-00012': ['L-2566-0142', 'ฉุกเฉินเงินสด', 'สัญญาเงินกู้ปกติ'],
  'IR-00013': ['L-2569-0170', 'สามัญเพิ่มสุข (ชำระจากปันผล)',  'สัญญาเงินกู้ปกติ'],
  'IR-00014': ['L-2565-0099', 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', 'ปรับโครงสร้างหนี้'],
  'IR-00015': ['L-2566-0091', 'สามัญปกติ',  'สัญญาเงินกู้ปกติ'],
};
window.INSURANCE_RENEWAL_SEED.forEach(r => {
  const li = _IR_LOAN_INFO[r.id] || ['—', 'สามัญปกติ', 'สัญญาเงินกู้ปกติ'];
  r.loanContractNo = li[0];
  r.loanType = li[1];
  r.contractNature = li[2];
});

// ─── คลังสัญญาเงินกู้ในระบบที่ "ยังไม่เคยทำประกัน" (อ้างอิงตอนทำประกันใหม่) ──
const _IR_MEMBERS = {
  'M-058241': { name: 'นายสมชาย ใจดี รักษ์ออม', cid: '3-1019-00821-45-3', dept: 'กองคลัง สำนักงานปลัด', phone: '081-234-5678', addr: '88/12 ถ.ติวานนท์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000' },
  'M-058242': { name: 'นางสาวกานต์ ศิริวงศ์', cid: '1-1099-00214-22-1', dept: 'กองการศึกษา', phone: '084-556-7788', addr: '72 หมู่ 1 ต.คลองข่อย อ.ปากเกร็ด จ.นนทบุรี 11120' },
  'M-058243': { name: 'นายอนุชา สุขสวัสดิ์', cid: '3-1018-00112-87-4', dept: 'กองช่าง', phone: '089-887-1122', addr: '14 หมู่ 3 ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120' },
  'M-058244': { name: 'นางวิภา จันทร์เพ็ญ', cid: '3-1019-00482-19-2', dept: 'กองคลัง สำนักงานปลัด', phone: '086-778-9900', addr: '120/7 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000' },
  'M-058245': { name: 'นายธีรพงษ์ ขำเพชร', cid: '1-2099-00321-66-8', dept: 'สำนักปลัด', phone: '062-345-9090', addr: '209/5 ถ.รัตนาธิเบศร์ ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000' },
  'M-058248': { name: 'นางสาวศิริพร ใจงาม', cid: '1-1019-00541-23-7', dept: 'กองการศึกษา', phone: '083-221-7766', addr: '45 หมู่ 2 ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120' },
  'M-058249': { name: 'นายสุรชัย วงศ์ประเสริฐ', cid: '3-1019-00112-44-5', dept: 'กองช่าง', phone: '081-998-2211', addr: '5/9 ถ.แจ้งวัฒนะ ต.ปากเกร็ด อ.ปากเกร็ด จ.นนทบุรี 11120' },
  'M-058250': { name: 'นางอรอนงค์ บุญมาก', cid: '3-1018-00772-19-3', dept: 'สำนักปลัด', phone: '081-445-6677', addr: '8/3 ถ.ติวานนท์ ต.ท่าทราย อ.เมือง จ.นนทบุรี 11000' },
  'M-058251': { name: 'นายภาคภูมิ รัตนา', cid: '1-1098-00211-87-2', dept: 'กองสาธารณสุข', phone: '090-112-3344', addr: '33 หมู่ 6 ต.บางตลาด อ.ปากเกร็ด จ.นนทบุรี 11120' },
};
window.LOAN_CONTRACTS_POOL = [
  { contractNo: 'L-2569-0205', memberCode: 'M-058241', loanType: 'สามัญปกติ',  contractNature: 'สัญญาเงินกู้ปกติ', principal: 500000,  startDate: '2026-02-10', term: '72 งวด' },
  { contractNo: 'L-2568-0175', memberCode: 'M-058242', loanType: 'สามัญปกติ',  contractNature: 'สัญญาเงินกู้ปกติ', principal: 540000,  startDate: '2025-12-05', term: '84 งวด' },
  { contractNo: 'L-2569-0221', memberCode: 'M-058243', loanType: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', contractNature: 'สัญญาเงินกู้ปกติ', principal: 1200000, startDate: '2026-03-18', term: '120 งวด' },
  { contractNo: 'L-2569-0210', memberCode: 'M-058244', loanType: 'สามัญปกติ',  contractNature: 'สัญญาเงินกู้ปกติ', principal: 350000,  startDate: '2026-01-22', term: '60 งวด' },
  { contractNo: 'L-2569-0240', memberCode: 'M-058245', loanType: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', contractNature: 'สัญญาเงินกู้ปกติ', principal: 1420000, startDate: '2026-04-01', term: '120 งวด' },
  { contractNo: 'L-2569-0218', memberCode: 'M-058248', loanType: 'ฉุกเฉินเงินสด', contractNature: 'สัญญาเงินกู้ปกติ', principal: 80000,   startDate: '2026-03-30', term: '12 งวด' },
  { contractNo: 'L-2569-0230', memberCode: 'M-058249', loanType: 'สามัญปกติ',  contractNature: 'สัญญาเงินกู้ปกติ', principal: 460000,  startDate: '2026-02-14', term: '72 งวด' },
  { contractNo: 'L-2568-0190', memberCode: 'M-058250', loanType: 'สามัญปกติ',  contractNature: 'สัญญาเงินกู้ปกติ', principal: 215000,  startDate: '2025-11-20', term: '60 งวด' },
  { contractNo: 'L-2567-0140', memberCode: 'M-058251', loanType: 'ฉุกเฉินเงินสด', contractNature: 'ปรับโครงสร้างหนี้', principal: 178000,  startDate: '2024-09-10', term: '24 งวด' },
].map(c => {
  const m = _IR_MEMBERS[c.memberCode] || {};
  return { ...c, memberName: m.name, citizenId: m.cid, dept: m.dept, phone: m.phone, address: m.addr };
});

// สถานะสมาชิก
window.IR_MEMBER_STATUSES = ['พนักงานปกติ', 'เกษียณ', 'ลาออก', 'ให้ออก', 'ปลดออก', 'ไล่ออก', 'เสียชีวิต'];
const _IR_MSTATUS = { 'M-058243': 'เกษียณ', 'M-058245': 'ลาออก', 'M-058251': 'เกษียณ' };
window.irMemberStatus = (code) => _IR_MSTATUS[code] || 'พนักงานปกติ';

// สัญญาเงินกู้ที่ยังไม่มีประกัน (ตัดที่ทำประกันแล้วออก)
window.availableLoanContracts = (records) => {
  const insured = new Set((records || []).map(r => r.loanContractNo));
  return window.LOAN_CONTRACTS_POOL.filter(c => !insured.has(c.contractNo));
};

// ประกันของสมาชิกรายคน (ใช้ในแท็บประกันภัยหน้าทะเบียนสมาชิก)
window.memberInsurancePolicies = (memberCode) =>
  window.INSURANCE_RENEWAL_SEED.filter(r => r.memberCode === memberCode);

// running id สำหรับรายการประกันใหม่
window._irUidSeq = 1015;
window.nextInsRenewId = () => 'IR-' + String(++window._irUidSeq).padStart(5, '0');

// ─── ระดับความเร่งด่วน / สถานะ (สีบ่งบอก) ────────────────────────────
window.daysUntil = (dateStr, fromStr) => {
  const from = new Date((fromStr || window.DEPOSIT_WORKING_DATE) + 'T00:00:00');
  const to = new Date(dateStr + 'T00:00:00');
  return Math.round((to - from) / 86400000);
};

// คืนสถานะการต่อ + โทนสี (tone ใช้กับ .pill)
window.insRenewState = (rec, fromStr) => {
  if (rec.status === 'cancelled') return { key: 'cancelled', label: 'ยกเลิกทำประกัน', tone: 'bad' };
  if (rec.status === 'renewed') return { key: 'renewed', label: 'ต่ออายุแล้ว', tone: 'ok' };
  if (rec.status === 'review')  return { key: 'review',  label: 'รอตรวจสอบ',  tone: 'info' };
  const d = window.daysUntil(rec.endDate, fromStr);
  if (d < 0)   return { key: 'overdue', label: 'เลยกำหนด / หมดอายุ', tone: 'bad',  days: d };
  if (d <= 30) return { key: 'near',    label: 'ใกล้ครบกำหนด',       tone: 'warn', days: d };
  return { key: 'pending', label: 'ยังไม่ต่ออายุ', tone: 'neutral', days: d };
};

// ─── คอลัมน์สำหรับ Export / Template ─────────────────────────────────
window.INSURANCE_RENEWAL_COLUMNS = [
  { key: 'memberCode',    label: 'รหัสสมาชิก',          required: true },
  { key: 'memberName',    label: 'ชื่อ-นามสกุล',         required: true },
  { key: 'citizenId',     label: 'เลขบัตรประชาชน',       required: true },
  { key: 'insuranceType', label: 'ประเภทประกันภัย',      required: true },
  { key: 'company',       label: 'บริษัทประกันภัย',       required: true },
  { key: 'newPolicyNo',   label: 'เลขที่กรมธรรม์ใหม่',    required: false },
  { key: 'coverage',      label: 'ทุนประกัน',            required: true },
  { key: 'premium',       label: 'เบี้ยประกันภัย',        required: true },
  { key: 'startDate',     label: 'วันที่เริ่มคุ้มครอง',     required: true },
  { key: 'endDate',       label: 'วันที่สิ้นสุดคุ้มครอง',    required: true },
  { key: 'payMethod',     label: 'ช่องทางชำระเบี้ย',      required: true },
  { key: 'beneficiary',   label: 'ผู้รับผลประโยชน์',       required: false },
];

// คอลัมน์เพิ่มเติมที่ใส่ในไฟล์ Export (สำหรับประสานงานบริษัทประกัน)
window.INSURANCE_EXPORT_EXTRA = [
  { key: 'dept',    label: 'หน่วยงานสังกัด' },
  { key: 'phone',   label: 'เบอร์โทรศัพท์' },
  { key: 'address', label: 'ที่อยู่' },
];

// แปลง payMethod value -> label (ใช้ค่าคงที่จาก data-insurance.js)
window.insPayLabel = (v) => {
  const m = (window.INSURANCE_PAY_METHODS || []).find(x => x.value === v);
  return m ? m.label : v;
};
window.insPayValueFromLabel = (label) => {
  const m = (window.INSURANCE_PAY_METHODS || []).find(x => x.label === String(label).trim());
  return m ? m.value : '';
};

// ─── CSV utilities (ทำงานออฟไลน์ ไม่พึ่งไลบรารีภายนอก) ───────────────
window.csvEscape = (v) => {
  const s = (v === null || v === undefined) ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
window.buildCSV = (columns, rows) => {
  const head = columns.map(c => window.csvEscape(c.label)).join(',');
  const body = rows.map(r => columns.map(c => window.csvEscape(r[c.key])).join(',')).join('\n');
  // BOM เพื่อให้ Excel อ่านภาษาไทยถูกต้อง
  return '\ufeff' + head + '\n' + body;
};
window.downloadFile = (filename, content, mime) => {
  const blob = new Blob([content], { type: (mime || 'text/csv') + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
};
// parser รองรับ comma + ค่าในเครื่องหมายคำพูด + newline ในเซลล์
window.parseCSV = (text) => {
  text = text.replace(/^\ufeff/, '');
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i+1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c === '\r') { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
};
