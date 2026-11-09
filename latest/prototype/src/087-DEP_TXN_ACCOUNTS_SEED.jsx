// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก — การทำงาน (transactions)
//  ชุดข้อมูลบัญชีเงินฝากใช้งานร่วม (เปิด/ฝาก/ถอน/ปิด) + ช่องทาง + ธนาคาร
//  เก็บสถานะบัญชี + ledger ใน localStorage เพื่อให้ทุกหน้าจอเห็นยอดตรงกัน
// ════════════════════════════════════════════════════════════════════

// บัญชีเงินฝากใช้งาน (ข้ามสมาชิกหลายราย)
window.DEP_TXN_ACCOUNTS_SEED = [
  // ── ตัวอย่างบัญชียอดสูง — ทดสอบถอนเกิน 2,000,000 บาท (ต้องให้หัวหน้าอนุมัติ) ──
  { accNo: '001-2-70020-5', member: '70020', name: 'วรเชษฐ์ ธนพัฒน์', sample: true, dept: 'สำนักงานผู้จัดการ', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2015-03-02', rate: 1.25, balance: 3500000.00, status: 'active',
    payrollLinked: true, intMethod: 'compound', bank: 'ธ.กรุงไทย', bankAcc: '982-1-77020-4', bankLinkStatus: 'linked',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 31250.00, withdrawCond: 'ถอนได้คนเดียว' },
  // ── ตัวอย่างวิธีรับ Int./Div. 3 แบบ (ดูที่เมนูแก้ไขรายละเอียดบัญชี › แท็บเงื่อนไข) ──
  { accNo: '001-2-70011-3', member: '70011', name: 'ประภาพร ศรีสวัสดิ์', sample: true, dept: 'กองบริหารทั่วไป', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2023-04-03', rate: 1.25, balance: 85400.00, status: 'active',
    payrollLinked: false, intMethod: 'compound', bank: '', bankAcc: '', bankLinkStatus: 'none',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 812.40, withdrawCond: 'ถอนได้คนเดียว' },
  { accNo: '001-2-70012-1', member: '70012', name: 'ธนากร วงศ์ไพบูลย์', sample: true, dept: 'กองการเงิน', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S02', type: 'ออมทรัพย์พิเศษ', openDate: '2022-11-15', rate: 2.00, balance: 412000.00, status: 'active',
    payrollLinked: false, intMethod: 'toaccount',
    bank: '', bankAcc: '', intToAcc: '001-1-70012-4', bankLinkStatus: 'none',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 6180.00, withdrawCond: 'ถอนได้คนเดียว' },
  { accNo: '001-1-70012-4', member: '70012', name: 'ธนากร วงศ์ไพบูลย์', sample: true, dept: 'กองการเงิน', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2022-11-15', rate: 1.25, balance: 24350.00, status: 'active',
    payrollLinked: false, intMethod: 'compound', bank: '', bankAcc: '', bankLinkStatus: 'none',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 180.25, withdrawCond: 'ถอนได้คนเดียว' },
  { accNo: '001-2-70013-8', member: '70013', name: 'อรวรรณ แก้วมณี', sample: true, dept: 'กองแผนงาน', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S02', type: 'ออมทรัพย์พิเศษ', openDate: '2021-06-01', rate: 2.00, balance: 1080500.00, status: 'active',
    payrollLinked: false, intMethod: 'tobank',
    bank: 'ธ.กรุงไทย', bankAcc: '987-0-12345-6', bankAccName: 'อรวรรณ แก้วมณี', bankBranch: 'สาขาแจ้งวัฒนะ', bankLinkStatus: 'linked',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 16207.50, withdrawCond: 'ถอนได้คนเดียว' },
  { accNo: '005-2-90001-6', member: 'L00001', ownerKind: 'juristic', name: 'บริษัท ทรัพย์เจริญพัฒนา จำกัด', dept: 'นิติบุคคลภายนอก', memberStatus: 'ปกติ',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2024-03-01', rate: 1.25, balance: 1250000.00, status: 'active',
    payrollLinked: false, bank: 'ธ.กรุงไทย', bankAcc: '120-6-33041-9', bankLinkStatus: 'none',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 9850.00,
    withdrawCond: 'ถอนได้ต้องลงนาม 2 ใน 3 คน\nนายสมชาย ใจดี · กรรมการผู้จัดการ\nนางวิภา จันทร์เพ็ญ · กรรมการ\nนายอนุชา สุขสวัสดิ์ · กรรมการ' },
  { accNo: '001-2-58241-0', member: '58241', name: 'สมชาย ใจดี', dept: 'กองคลัง สำนักงานปลัด', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2008-06-01', rate: 1.25, balance: 342850.50, status: 'active',
    payrollLinked: true, bank: 'ธ.กรุงไทย', bankAcc: '982-1-44021-7', bankLinkStatus: 'linked',
    useLoan: false, useFuneral: true, freeQuota: 0, freeUsed: 0, ytdInterest: 3120.40,
    monthlyDeposit: 2000, collectUntil: '999999' },
  { accNo: '002-5-58241-7', member: '58241', name: 'สมชาย ใจดี', dept: 'กองคลัง สำนักงานปลัด', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S02', type: 'ออมทรัพย์พิเศษ', openDate: '2015-03-10', rate: 2.75, balance: 680000.00, status: 'active',
    payrollLinked: true, bank: 'ธ.กรุงไทย', bankAcc: '982-1-44021-7', bankLinkStatus: 'linked',
    useLoan: false, useFuneral: false, freeQuota: 1, freeUsed: 0, ytdInterest: 9120.00,
    monthlyDeposit: 5000, collectUntil: '999999' },
  { accNo: '003-1-58241-4', member: '58241', name: 'สมชาย ใจดี', dept: 'กองคลัง สำนักงานปลัด', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'F12', type: 'ฝากประจำ 12 เดือน', openDate: '2024-01-15', rate: 3.10, balance: 500000.00, status: 'active',
    payrollLinked: false, bank: '', bankAcc: '', bankLinkStatus: 'none',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 7750.00, maturityDate: '2025-01-15' },
  { accNo: '002-5-60112-3', member: '60112', name: 'วิภาวดี รังสิต', dept: 'กองการศึกษา', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S02', type: 'ออมทรัพย์พิเศษ', openDate: '2018-07-20', rate: 2.75, balance: 158200.00, status: 'active',
    payrollLinked: true, bank: 'ธ.ออมสิน', bankAcc: '020-6-71188-2', bankLinkStatus: 'linked',
    useLoan: false, useFuneral: true, freeQuota: 1, freeUsed: 1, ytdInterest: 2410.00,
    monthlyDeposit: 3000, collectUntil: '256912' },
  { accNo: '001-2-57003-9', member: '57003', name: 'ธีรพงษ์ มากมี', dept: 'กองช่าง', memberStatus: 'ปฏิบัติงาน',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2009-02-11', rate: 1.25, balance: 89400.25, status: 'active',
    payrollLinked: false, bank: 'ธ.กสิกรไทย', bankAcc: '044-2-90017-5', bankLinkStatus: 'pending',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 740.10 },
  { accNo: '004-9-61580-1', member: '61580', name: 'ปาริชาติ สุขสวัสดิ์', dept: 'สำนักปลัด', memberStatus: 'ลาออก',
    typeCode: 'S01', type: 'ออมทรัพย์', openDate: '2016-05-05', rate: 1.25, balance: 12050.00, status: 'active',
    payrollLinked: false, bank: '', bankAcc: '', bankLinkStatus: 'none',
    useLoan: false, useFuneral: false, freeQuota: 0, freeUsed: 0, ytdInterest: 95.20 },
];

// สมาชิกที่ค้นเจอได้ตอนเปิดบัญชี (รวมรายที่ยังไม่มีบัญชี)
window.DEP_TXN_MEMBERS = [
  { code: '70011', mobile: '081-552-0193', name: 'ประภาพร ศรีสวัสดิ์', dept: 'กองบริหารทั่วไป', deptCode: '0102', status: 'ปฏิบัติงาน', citizenId: '3-1012-00487-15-3' },
  { code: '70012', mobile: '089-120-7744', name: 'ธนากร วงศ์ไพบูลย์', dept: 'กองการเงิน', deptCode: '0201', status: 'ปฏิบัติงาน', citizenId: '1-1020-00915-62-8' },
  { code: '70013', mobile: '086-334-9051', name: 'อรวรรณ แก้วมณี', dept: 'กองแผนงาน', deptCode: '0601', status: 'ปฏิบัติงาน', citizenId: '3-1006-01128-44-7',
    bank: 'ธ.กรุงไทย', bankBranch: 'สาขาแจ้งวัฒนะ', bankAcc: '987-0-12345-6', bankAccName: 'อรวรรณ แก้วมณี' },
  { code: '58241', mobile: '081-245-6612', name: 'สมชาย ใจดี',        dept: 'กองคลัง สำนักงานปลัด', deptCode: '0801', status: 'ปฏิบัติงาน', citizenId: '3-1019-00821-45-3',
    bank: 'ธ. กรุงไทย จำกัด (มหาชน)',  bankBranch: 'สาขา แจ้งวัฒนะ',  bankAcc: '308-0-54335-1', bankAccName: 'สมชาย ใจดี' },
  { code: '60112', mobile: '089-331-0457', name: 'วิภาวดี รังสิต',     dept: 'กองการศึกษา',         deptCode: '0501', status: 'ปฏิบัติงาน', citizenId: '1-1099-00214-22-1',
    bank: 'ธ. ไทยพาณิชย์ จำกัด (มหาชน)', bankBranch: 'สาขา งามวงศ์วาน', bankAcc: '421-2-08817-6', bankAccName: 'วิภาวดี รังสิต' },
  { code: '57003', mobile: '086-772-1309', name: 'ธีรพงษ์ มากมี',      dept: 'กองช่าง',             deptCode: '0301', status: 'ปฏิบัติงาน', citizenId: '3-1018-00112-87-4',
    bank: 'ธ. กสิกรไทย จำกัด (มหาชน)',  bankBranch: 'สาขา ปากเกร็ด',   bankAcc: '271-1-05529-8', bankAccName: 'ธีรพงษ์ มากมี' },
  { code: '62880', mobile: '092-418-5520', name: 'อรอุมา เพชรรัตน์',   dept: 'กองสาธารณสุข',        deptCode: '0901', status: 'ปฏิบัติงาน', citizenId: '1-1037-00455-09-2',
    bank: 'ธ. ออมสิน',                 bankBranch: 'สาขา หลักสี่',     bankAcc: '142-0-77105-8', bankAccName: 'อรอุมา เพชรรัตน์' },
  { code: '61580', mobile: '083-650-2291', name: 'ปาริชาติ สุขสวัสดิ์', dept: 'สำนักปลัด',           deptCode: '0101', status: 'ลาออก',     citizenId: '3-1009-00781-33-8',
    bank: 'ธ. กรุงไทย จำกัด (มหาชน)',  bankBranch: 'สาขา ไปรษณีย์ไทย (กสท)', bankAcc: '093-6-01847-2', bankAccName: 'ปาริชาติ สุขสวัสดิ์' },
];

window.DEP_DEPOSIT_CHANNELS = [
  { id: 'cash',    label: 'เงินสด',            needRef: false },
  { id: 'cheque',  label: 'เช็ค',              needRef: true  },
  { id: 'transfer',label: 'เงินโอน',           needRef: true  },
  { id: 'counter', label: 'Counter Service',   needRef: true  },
  { id: 'bill',    label: 'Bill Payment',      needRef: true  },
  { id: 'loan',    label: 'โอนจากระบบเงินกู้', needRef: true  },
  { id: 'agent',   label: 'รับจากตัวแทน',      needRef: true  },
];
window.DEP_WITHDRAW_METHODS = [
  { id: 'cash',     label: 'เงินสด' },
  { id: 'transfer', label: 'โอนเข้าบัญชีธนาคาร' },
  { id: 'cheque',   label: 'เช็ค' },
];
window.DEP_BANKS = ['ธ.กรุงไทย', 'ธ.ออมสิน', 'ธ.กสิกรไทย', 'ธ.ไทยพาณิชย์', 'ธ.กรุงเทพ', 'ธ.ทหารไทยธนชาต'];

// ─── localStorage: บัญชี + ledger ────────────────────────────────────
window.depTxnLoadAccounts = function () {
  try {
    const s = localStorage.getItem('dep_txn_accounts');
    if (s) {
      const list = JSON.parse(s);
      const have = new Set(list.map(x => x.accNo));
      window.DEP_TXN_ACCOUNTS_SEED.filter(x => x.sample).forEach(x => {
        const o = list.find(y => y.accNo === x.accNo);
        if (o) { o.name = x.name; if (x.bankAccName) o.bankAccName = x.bankAccName; }
      });
      window.DEP_TXN_ACCOUNTS_SEED.forEach(x => { if (!have.has(x.accNo)) list.push({ ...x }); });
      return list;
    }
  } catch (e) {}
  return window.DEP_TXN_ACCOUNTS_SEED.map(a => ({ ...a }));
};
window.depTxnSaveAccounts = function (list) { try { localStorage.setItem('dep_txn_accounts', JSON.stringify(list)); } catch (e) {} };
window.depTxnLoadLedger = function () {
  try { const s = localStorage.getItem('dep_txn_ledger'); if (s) return JSON.parse(s); } catch (e) {}
  return [];
};
window.depTxnSaveLedger = function (list) { try { localStorage.setItem('dep_txn_ledger', JSON.stringify(list)); } catch (e) {} };

// เลขที่รายการ TX-yyyy-mm-#### (running)
window.depTxnNextId = function () {
  let n = 4400;
  try { n = parseInt(localStorage.getItem('dep_txn_seq') || '4400', 10) + 1; localStorage.setItem('dep_txn_seq', String(n)); } catch (e) {}
  const d = new Date();
  const yy = d.getFullYear() + 543;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `TX-${yy}-${mm}-${n}`;
};

// ════════════════════════════════════════════════════════════════════
//  เปลี่ยนแปลงฝากรายเดือน — ประวัติคำขอ + เลขที่คำร้อง (running)
// ════════════════════════════════════════════════════════════════════
window.DEP_MONTHLY_HISTORY_SEED = [
  { id: 'DMC-2569-0007', accNo: '001-2-58241-0', member: '58241', date: '2026-01-05',
    oldAmount: 1500, newAmount: 2000, collectUntil: '999999', by: 'จันทร์เพ็ญ มาลี', note: 'สมาชิกขอเพิ่มยอดฝากรายเดือน' },
  { id: 'DMC-2568-0142', accNo: '001-2-58241-0', member: '58241', date: '2025-04-01',
    oldAmount: 1000, newAmount: 1500, collectUntil: '999999', by: 'ประไพ ศรีทอง', note: 'ปรับตามฐานเงินเดือนใหม่' },
  { id: 'DMC-2568-0098', accNo: '002-5-58241-7', member: '58241', date: '2025-02-14',
    oldAmount: 3000, newAmount: 5000, collectUntil: '999999', by: 'จันทร์เพ็ญ มาลี', note: '' },
  { id: 'DMC-2568-0071', accNo: '002-5-60112-3', member: '60112', date: '2025-01-20',
    oldAmount: 2000, newAmount: 3000, collectUntil: '256912', by: 'ประไพ ศรีทอง', note: 'กำหนดหักถึง ธ.ค. 2569' },
];
window.depMonthlyLoadHistory = function () {
  try { const s = localStorage.getItem('dep_monthly_history'); if (s) return JSON.parse(s); } catch (e) {}
  return window.DEP_MONTHLY_HISTORY_SEED.map(h => ({ ...h }));
};
window.depMonthlySaveHistory = function (list) { try { localStorage.setItem('dep_monthly_history', JSON.stringify(list)); } catch (e) {} };
// เลขที่คำร้อง DMC-yyyy-#### (running ต่อปี พ.ศ.)
window.depMonthlyNextReqNo = function () {
  const be = new Date().getFullYear() + 543;
  let n = 200;
  try { n = parseInt(localStorage.getItem('dep_monthly_seq') || '200', 10) + 1; localStorage.setItem('dep_monthly_seq', String(n)); } catch (e) {}
  return `DMC-${be}-${String(n).padStart(4, '0')}`;
};

// สร้างเลขที่บัญชีตามรูปแบบสหกรณ์: {type3}-{cd}-{member5}-{seq}
window.depGenAccNo = function (typeCode, member, existing) {
  const map = { S01: '001', S02: '002', F12: '003', F24: '003', L90: '005', W10: '006' };
  const pre = map[typeCode] || '009';
  const cd = (typeCode.charCodeAt(0) % 9) + 1;
  const m5 = String(member).slice(-5).padStart(5, '0');
  let seq = 0;
  while (existing.some(a => a.accNo === `${pre}-${cd}-${m5}-${seq}`)) seq++;
  return `${pre}-${cd}-${m5}-${seq}`;
};

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนบุคคลภายนอก — ใช้อ้างอิงตอนเปิดบัญชีเงินฝากให้ผู้ที่ไม่ใช่สมาชิก
//  (บุคคลธรรมดา / นิติบุคคล) — เพิ่ม/แก้ไขจากเมนู "ข้อมูลบุคคลภายนอก"
// ════════════════════════════════════════════════════════════════════
window.DEP_EXT_PERSON_TITLES = ['นาย', 'นาง', 'นางสาว', 'ว่าที่ ร.ต.', 'ดร.'];

window.DEP_EXT_PERSON_SEED = [
  { id: 'EX-0001', code: 'E00001', kind: 'person', title: 'นาย', firstName: 'ประสิทธิ์', lastName: 'วงศ์อารีย์',
    citizenId: '3-1005-00214-88-1', taxId: '', addr: '128/4', moo: '5', village: 'บ้านสวนหลวง', soi: 'ประชาราษฎร์ 12',
    road: 'ประชาราษฎร์', province: 'นนทบุรี', amphoe: 'ปากเกร็ด', tambon: 'บางตลาด', zipcode: '11120',
    phone: '02-583-2210', mobile: '081-234-5678', email: 'prasit.w@example.com', note: 'ผู้ฝากร่วมบัญชีสมาชิก 58241' },
  { id: 'EX-0002', code: 'E00002', kind: 'person', title: 'นางสาว', firstName: 'อรวรรณ', lastName: 'ทองสุข',
    citizenId: '1-1099-00841-20-6', taxId: '', addr: '55', moo: '-', village: '', soi: 'ลาดพร้าว 71',
    road: 'ลาดพร้าว', province: 'กรุงเทพมหานคร', amphoe: 'จตุจักร', tambon: 'ลาดยาว', zipcode: '10900',
    phone: '', mobile: '089-556-7788', email: 'orawan.t@example.com', note: '' },
  { id: 'EX-0003', code: 'L00001', kind: 'juristic', title: '', firstName: '', lastName: '',
    orgName: 'บริษัท ทรัพย์เจริญพัฒนา จำกัด', citizenId: '', taxId: '0-1055-61023-45-8',
    addr: '99/1', moo: '3', village: '', soi: '', road: 'ติวานนท์', province: 'ปทุมธานี', amphoe: 'เมืองปทุมธานี',
    tambon: 'บ้านกลาง', zipcode: '12000', phone: '02-975-1100', mobile: '', email: 'contact@subcharoen.co.th',
    note: 'คู่สัญญาโครงการ — เปิดบัญชีออมทรัพย์นิติบุคคล' },
  { id: 'EX-0004', code: 'L00002', kind: 'juristic', title: '', firstName: '', lastName: '',
    orgName: 'ห้างหุ้นส่วนจำกัด สยามโทรคมนาคมบริการ', citizenId: '', taxId: '0-1035-58012-77-3',
    addr: '45/12', moo: '-', village: '', soi: 'แจ้งวัฒนะ 14', road: 'แจ้งวัฒนะ', province: 'กรุงเทพมหานคร', amphoe: 'หลักสี่',
    tambon: 'ทุ่งสองห้อง', zipcode: '10210', phone: '02-576-3344', mobile: '086-221-4410', email: 'office@siamtelecom-service.co.th',
    note: 'ผู้รับเหมาซ่อมบำรุงอุปกรณ์สื่อสาร' },
  { id: 'EX-0005', code: 'L00003', kind: 'juristic', title: '', firstName: '', lastName: '',
    orgName: 'มูลนิธิเพื่อการศึกษาบุตรพนักงาน กสท', citizenId: '', taxId: '0-9940-00321-15-6',
    addr: '99', moo: '-', village: '', soi: '', road: 'แจ้งวัฒนะ', province: 'กรุงเทพมหานคร', amphoe: 'หลักสี่',
    tambon: 'ทุ่งสองห้อง', zipcode: '10210', phone: '02-104-2200', mobile: '', email: 'foundation@catedu.or.th',
    note: 'บัญชีมูลนิธิ — ผู้มีอำนาจลงนาม 2 ใน 3 คน' },
  { id: 'EX-0006', code: 'L00004', kind: 'juristic', title: '', firstName: '', lastName: '',
    orgName: 'บริษัท ดิจิทัลเน็ตเวิร์ค โซลูชั่น จำกัด (มหาชน)', citizenId: '', taxId: '0-1075-63004-21-9',
    addr: '388', moo: '-', village: '', soi: '', road: 'พหลโยธิน', province: 'กรุงเทพมหานคร', amphoe: 'พญาไท',
    tambon: 'สามเสนใน', zipcode: '10400', phone: '02-279-8800', mobile: '081-990-1122', email: 'treasury@dns-pcl.co.th',
    note: 'บริษัทมหาชน — ฝากเงินระยะสั้น' },
];

window.depExtPersonsSave = function (list) { try { localStorage.setItem('dep_ext_persons', JSON.stringify(list)); } catch (e) {} };
// รหัสทะเบียน: บุคคลภายนอก E##### · นิติบุคคลภายนอก L#####
const depExtPrefix = (kind) => (kind === 'juristic' ? 'L' : 'E');
window.depExtPersonsLoad = function () {
  let list = null;
  try { const s = localStorage.getItem('dep_ext_persons'); if (s) list = JSON.parse(s); } catch (e) {}
  if (!list) {
    // โปรไฟล์ใหม่ได้ตัวอย่างครบอยู่แล้ว — จดว่าเติมแล้ว เพื่อไม่ให้รายการที่ลบภายหลังถูกเติมกลับ
    try { localStorage.setItem('dep_ext_persons_seeded', JSON.stringify(['EX-0004', 'EX-0005', 'EX-0006'])); } catch (e) {}
    return window.DEP_EXT_PERSON_SEED.map(p => ({ ...p }));
  }
  // แปลงรหัสรูปแบบเดิม EXT-##### → E/L ตามประเภท (รันเลขต่อแยกแต่ละประเภท)
  if (list.some(p => /^EXT-/.test(String(p.code)))) {
    const seq = { E: 0, L: 0 };
    list.forEach(p => { const m = String(p.code).match(/^([EL])(\d{5})$/); if (m) seq[m[1]] = Math.max(seq[m[1]], +m[2]); });
    list = list.slice().reverse().map(p => {
      if (!/^EXT-/.test(String(p.code))) return p;
      const px = depExtPrefix(p.kind); seq[px] += 1;
      return { ...p, code: px + String(seq[px]).padStart(5, '0') };
    }).reverse();
    window.depExtPersonsSave(list);
  }
  // เติมตัวอย่างเพิ่มเติมครั้งเดียว — รายการที่เจ้าหน้าที่ลบไปแล้วจะไม่กลับมา
  let seeded = [];
  try { seeded = JSON.parse(localStorage.getItem('dep_ext_persons_seeded') || '[]'); } catch (e) {}
  const EXTRA = ['EX-0004', 'EX-0005', 'EX-0006'];
  const pending = EXTRA.filter(id => !seeded.includes(id));
  if (pending.length) {
    const have = new Set(list.map(p => p.id)), haveCode = new Set(list.map(p => p.code));
    const add = window.DEP_EXT_PERSON_SEED.filter(p => pending.includes(p.id) && !have.has(p.id) && !haveCode.has(p.code));
    if (add.length) { list = [...list, ...add.map(p => ({ ...p }))]; window.depExtPersonsSave(list); }
    try { localStorage.setItem('dep_ext_persons_seeded', JSON.stringify([...seeded, ...pending])); } catch (e) {}
  }
  return list;
};

// รหัสทะเบียนถัดไป — แยกเลขรันตามประเภท (E = บุคคลภายนอก · L = นิติบุคคลภายนอก)
window.depExtPersonNextCode = function (list, kind) {
  const px = depExtPrefix(kind);
  const nums = (list || []).filter(p => String(p.code).charAt(0) === px)
    .map(p => parseInt(String(p.code).slice(1), 10) || 0);
  return px + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(5, '0');
};

// ชื่อเต็มของบุคคล/นิติบุคคลในทะเบียน
window.depExtPersonName = function (p) {
  if (!p) return '';
  if (p.kind === 'juristic') return p.orgName || '';
  return [p.title, p.firstName, p.lastName].filter(Boolean).join(' ');
};
