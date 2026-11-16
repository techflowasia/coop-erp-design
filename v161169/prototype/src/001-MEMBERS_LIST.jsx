// Mock data for member detail page

// ─── Members list (search page) ──────────────────────────────────────
window.MEMBERS_LIST = [
  { code: "M-058241", name: "นายสมชาย ใจดี รักษ์ออม",     dept: "กองคลัง สำนักงานปลัด",       deptCode: "0801", citizenId: "3-1019-00821-45-3", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2008-06-01", shares: 789000,  loans: 1108250, loanCount: 4, monthly: 18030,  paymentStatus: "ปกติ" },
  { code: "M-058242", name: "นางสาวกานต์ ศิริวงศ์",         dept: "กองการศึกษา",                  deptCode: "0501", citizenId: "1-1099-00214-22-1", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2012-04-10", shares: 412500,  loans: 540000,  loanCount: 2, monthly: 8420,   paymentStatus: "ปกติ" },
  { code: "M-058243", name: "นายอนุชา สุขสวัสดิ์",           dept: "กองช่าง",                        deptCode: "0301", citizenId: "3-1018-00112-87-4", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2005-09-15", shares: 1240000, loans: 820000,  loanCount: 3, monthly: 15240,  paymentStatus: "ล่าช้า" },
  { code: "M-058244", name: "นางวิภา จันทร์เพ็ญ",            dept: "กองคลัง สำนักงานปลัด",       deptCode: "0801", citizenId: "3-1019-00482-19-2", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2015-02-22", shares: 285000,  loans: 91200,   loanCount: 1, monthly: 4280,   paymentStatus: "ปกติ" },
  { code: "M-058245", name: "นายธีรพงษ์ ขำเพชร",             dept: "สำนักปลัด",                     deptCode: "0101", citizenId: "1-2099-00321-66-8", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2010-11-03", shares: 632000,  loans: 1420000, loanCount: 5, monthly: 22100,  paymentStatus: "ผิดนัดชำระ" },
  { code: "M-058246", name: "นางสาวพรพิมล ทองคำ",         dept: "กองสาธารณสุข",                 deptCode: "0601", citizenId: "3-1018-00928-44-1", type: "สมาชิกชั่วคราว", status: "ปฏิบัติงาน", joinDate: "2023-08-01", shares: 25000,   loans: 0,       loanCount: 0, monthly: 2500,   paymentStatus: "ปกติ" },
  { code: "M-058247", name: "นายวีรชัย พิทักษ์ธรรม",        dept: "กองการคลัง",                    deptCode: "0801", citizenId: "5-1099-00021-11-9", type: "สมาชิกถาวร",    status: "เกษียณ",     joinDate: "1998-05-12", shares: 2150000, loans: 0,       loanCount: 0, monthly: 0,      paymentStatus: "ปกติ" },
  { code: "M-058248", name: "นางสาวศิริพร ใจงาม",            dept: "กองการศึกษา",                  deptCode: "0501", citizenId: "1-1019-00541-23-7", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2018-07-20", shares: 168000,  loans: 320000,  loanCount: 2, monthly: 6840,   paymentStatus: "ปกติ" },
  { code: "M-058249", name: "นายสุรชัย วงศ์ประเสริฐ",       dept: "กองช่าง",                        deptCode: "0301", citizenId: "3-1019-00112-44-5", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2009-03-30", shares: 925000,  loans: 460000,  loanCount: 2, monthly: 12480,  paymentStatus: "ปกติ" },
  { code: "M-058250", name: "นางอรอนงค์ บุญมาก",            dept: "สำนักปลัด",                     deptCode: "0101", citizenId: "3-1018-00772-19-3", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2014-10-15", shares: 358000,  loans: 215000,  loanCount: 1, monthly: 5920,   paymentStatus: "ปกติ" },
  { code: "M-058251", name: "นายภาคภูมิ รัตนา",                dept: "กองสาธารณสุข",                 deptCode: "0601", citizenId: "1-1098-00211-87-2", type: "สมาชิกถาวร",    status: "ปฏิบัติงาน", joinDate: "2016-06-08", shares: 224000,  loans: 178000,  loanCount: 2, monthly: 5340,   paymentStatus: "ล่าช้า" },
  { code: "M-058252", name: "นางสาวจุฬาลักษณ์ พัฒนกุล",     dept: "กองคลัง สำนักงานปลัด",       deptCode: "0801", citizenId: "5-1019-00482-11-9", type: "สมาชิกถาวร",    status: "ลาออก",      joinDate: "2011-01-18", shares: 0,       loans: 0,       loanCount: 0, monthly: 0,      paymentStatus: "ปกติ" },
];

window.MEMBER_DATA = {
  member: {
    code: "M-058241",
    name: "นายสมชาย ใจดี รักษ์ออม",
    nickname: "สมชาย",
    department: "กองคลัง สำนักงานปลัด",
    departmentCode: "0801",
    accumulatedInterest: 287450.50,
    note: "สมาชิกตัวอย่าง — มีประวัติการชำระดี ไม่เคยผิดนัด มีสัญญาเงินกู้สวัสดิการที่ใช้งานอยู่ 2 สัญญา",

    // ส่วนข้อมูลส่วนตัว
    memberType: "สมาชิกถาวร",
    title: "นาย",
    firstName: "สมชาย",
    lastName: "ใจดี รักษ์ออม",
    birthDate: "1981-03-14",
    gender: "ชาย",
    nationality: "ไทย",
    citizenId: "3-1019-00821-45-3",
    maritalStatus: "สมรส",
    photoUrl: null,
    signatureUrl: null,
    address: "128/45 หมู่ 3 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900",
    // คู่สมรส — ในที่นี้คู่สมรสเป็นสมาชิกสหกรณ์ (ดึงข้อมูลมาแสดง)
    spouse: "นางสาวพรพิมล ทองคำ",
    spouseInfo: {
      isMember: true,
      memberCode: "M-058246",
      title: "นาง",
      firstName: "พรพิมล",
      lastName: "ใจดี",
      citizenId: "3-1018-00928-44-1",
      birthDate: "1985-07-09",
      gender: "หญิง",
      nationality: "ไทย",
    },

    // ข้อมูลการทำงาน
    employeeId: "EMP-042189",
    workDepartment: "กลุ่มงานบัญชีและงบประมาณ",
    salary: 48750,
    workStatus: "ปฏิบัติงาน",
    retireDate: "2041-09-30",

    // ข้อมูลสมาชิกสหกรณ์
    joinDate: "2008-06-01",
    expireDate: null,
    resignDate: null,
    resignReason: null,
    resolution: "มติที่ประชุม คกก. ครั้งที่ 5/2551 วันที่ 28 พ.ค. 2551",
  },

  status: {
    applicationType: "permanent",      // ไม่ระบุ / ชั่วคราว / ถาวร
    collectionStatus: "normal",         // ปกติ / บางครั้ง / ไม่เรียกเก็บ
    loanReqs: {
      providentFund: true,              // กองทุนสำรองเลี้ยงชีพ
      assignmentDeed: true,             // หนังสือโอนสิทธิ์เรียกร้อง
      spouseConsent: true,              // ใบยินยอมคู่สมรส
      lifeInsurance: false,             // ประกันชีวิต
      beneficiary: true,                // มีผู้รับโอนผลประโยชน์
    },
    loanGuarantee: {
      noGuarantee: false,               // งดค้ำประกันทุกประเภท
      noLoan: false,                    // งดกู้ทุกประเภท
    },
    dividend: {
      freezeDividend: false,            // อายัด ปันผล/เฉลี่ยคืน
      noDividend: false,                // งดปันผล
      noRebate: false,                  // งดเฉลี่ยคืน
    },
  },

  // หักประจำเดือน
  deductions: [
    { no: 1, detail: "ค่าหุ้นรายเดือน",            term: "เดือนต่อเดือน", principal: 2500.00, interest: 0,       remaining: null },
    { no: 2, detail: "สัญญาเงินกู้สามัญ #L-2023-0148", term: "84/120",         principal: 8500.00, interest: 1425.00, remaining: 612500.00 },
    { no: 3, detail: "สัญญาเงินกู้พิเศษ #L-2024-0291", term: "12/60",          principal: 4200.00, interest: 875.50,  remaining: 240800.00 },
    { no: 4, detail: "เงินกู้ฉุกเฉิน #EM-2025-0312",  term: "3/12",           principal: 2500.00, interest: 187.50,  remaining: 22500.00 },
    { no: 5, detail: "ค่าฌาปนกิจสงเคราะห์",         term: "เดือนต่อเดือน", principal: 280.00,  interest: 0,       remaining: null },
    { no: 6, detail: "ค่าธรรมเนียมรายเดือน",         term: "เดือนต่อเดือน", principal: 50.00,   interest: 0,       remaining: null },
  ],
  deductionSummary: {
    emergencyTransfer: 2687.50,
    net: 18030.00,
  },

  // หุ้น
  shares: [
    { name: "ค่าหุ้นสะสมรายเดือน",   bf: 540000, term: 84, perMonth: 2500, sendStatus: "ปกติ", stopDate: null, shareValue: 750000, status: "ปกติ" },
    { name: "หุ้นเพิ่มพิเศษ (โบนัส 2024)", bf: 0,     term: 1,  perMonth: 0,    sendStatus: "ปกติ", stopDate: null, shareValue: 15000,  status: "ปกติ" },
    { name: "หุ้นทดแทน",            bf: 24000,  term: 12, perMonth: 1000, sendStatus: "หยุดส่ง", stopDate: "2024-11-01", shareValue: 24000,  status: "หยุดส่ง" },
  ],

  // ── Statement รายการส่งหุ้น (ทะเบียนการเคลื่อนไหวทุนเรือนหุ้น) ──
  //  par 10 บาท/หุ้น · ยอดสะสมปลายงวด = 789,000.00 = 78,900 หุ้น
  shareStatement: {
    parValue: 10,
    openingBalance: 714000,            // ยอดยกมา ณ ต้นงวด (ก่อน ม.ค. 2568)
    openingShares: 71400,
    // เรียงเก่า → ใหม่ (คอมโพเนนต์คำนวณยอดสะสมและกลับลำดับแสดงใหม่→เก่า)
    entries: [
      { date: "2025-01-30", period: "2568/01", desc: "ค่าหุ้นรายเดือน งวด ม.ค.",          type: "monthly", channel: "payroll", ref: "RC2568-01-00821", amount: 2500 },
      { date: "2025-01-30", period: "2568/01", desc: "เฉลี่ยคืน-เงินปันผลสมทบเป็นหุ้น",   type: "dividend", channel: "internal", ref: "DV2568-00821",     amount: 15000 },
      { date: "2025-02-26", period: "2568/02", desc: "ค่าหุ้นรายเดือน งวด ก.พ.",          type: "monthly", channel: "payroll", ref: "RC2568-02-00821", amount: 2500 },
      { date: "2025-03-27", period: "2568/03", desc: "ค่าหุ้นรายเดือน งวด มี.ค.",         type: "monthly", channel: "payroll", ref: "RC2568-03-00821", amount: 2500 },
      { date: "2025-04-29", period: "2568/04", desc: "ค่าหุ้นรายเดือน งวด เม.ย.",         type: "monthly", channel: "payroll", ref: "RC2568-04-00821", amount: 2500 },
      { date: "2025-05-28", period: "2568/05", desc: "ค่าหุ้นรายเดือน งวด พ.ค.",          type: "monthly", channel: "payroll", ref: "RC2568-05-00821", amount: 2500 },
      { date: "2025-06-26", period: "2568/06", desc: "ค่าหุ้นรายเดือน งวด มิ.ย.",         type: "monthly", channel: "payroll", ref: "RC2568-06-00821", amount: 2500 },
      { date: "2025-06-26", period: "2568/06", desc: "ซื้อหุ้นเพิ่มพิเศษ (เงินสด)",        type: "special", channel: "cash",    ref: "RV-2568-000914", amount: 20000 },
      { date: "2025-07-30", period: "2568/07", desc: "ค่าหุ้นรายเดือน งวด ก.ค.",          type: "monthly", channel: "payroll", ref: "RC2568-07-00821", amount: 2500 },
      { date: "2025-08-28", period: "2568/08", desc: "ค่าหุ้นรายเดือน งวด ส.ค.",          type: "monthly", channel: "payroll", ref: "RC2568-08-00821", amount: 2500 },
      { date: "2025-09-26", period: "2568/09", desc: "ค่าหุ้นรายเดือน งวด ก.ย.",          type: "monthly", channel: "payroll", ref: "RC2568-09-00821", amount: 2500 },
      { date: "2025-10-30", period: "2568/10", desc: "ค่าหุ้นรายเดือน งวด ต.ค.",          type: "monthly", channel: "payroll", ref: "RC2568-10-00821", amount: 2500 },
      { date: "2025-11-27", period: "2568/11", desc: "ค่าหุ้นรายเดือน งวด พ.ย.",          type: "monthly", channel: "payroll", ref: "RC2568-11-00821", amount: 2500 },
      { date: "2025-12-26", period: "2568/12", desc: "ค่าหุ้นรายเดือน งวด ธ.ค.",          type: "monthly", channel: "payroll", ref: "RC2568-12-00821", amount: 2500 },
      { date: "2026-01-29", period: "2569/01", desc: "ค่าหุ้นรายเดือน งวด ม.ค.",          type: "monthly", channel: "payroll", ref: "RC2569-01-00821", amount: 2500 },
      { date: "2026-02-26", period: "2569/02", desc: "ค่าหุ้นรายเดือน งวด ก.พ.",          type: "monthly", channel: "payroll", ref: "RC2569-02-00821", amount: 2500 },
      { date: "2026-03-27", period: "2569/03", desc: "ค่าหุ้นรายเดือน งวด มี.ค.",         type: "monthly", channel: "payroll", ref: "RC2569-03-00821", amount: 2500 },
      { date: "2026-04-29", period: "2569/04", desc: "ค่าหุ้นรายเดือน งวด เม.ย.",         type: "monthly", channel: "payroll", ref: "RC2569-04-00821", amount: 2500 },
    ],
  },

  // เงินกู้
  loans: [
    {
      seq: 1, contract: "L-2023-0148", typeCode: "01", typeName: "เงินกู้สามัญ", purposeCode: "03", insurer: "TIP ประกันชีวิต", amount: 800000, startDate: "2023-04-15", rate: 5.75, lastInterestDate: "2026-04-25", lastCollectDate: "2026-04-25", guarantors: ["นายอนุชา สุขสวัสดิ์ (M-058243 · 0301)", "นางสาวกานต์ ศิริวงศ์ (M-058247 · 0102)"],
      installment: 9925, payType: "คงยอด", totalTerms: 120, lastTerm: 84, lastPaymentDate: "2026-04-25",
      remaining: 612500, pendingDisburse: 0, interestDue: 0, interestOver: 245.5,
      lastChangeDays: 32, paymentStatus: "ปกติ", contractStatus: "ปกติ", debtSettleStatus: "ปกติ", debtSettleDate: null, restructureCount: 0,
    },
    {
      seq: 2, contract: "L-2024-0291", typeCode: "02", typeName: "เงินกู้พิเศษเพื่อที่อยู่อาศัย", purposeCode: "05", insurer: "เมืองไทยประกันชีวิต", amount: 280000, startDate: "2024-05-20", rate: 5.25, lastInterestDate: "2026-04-25", lastCollectDate: "2026-04-25", guarantors: ["นายธีรพงษ์ ขำเพชร (M-058250 · 0405)"],
      installment: 5075, payType: "คงยอดขั้นบันได", totalTerms: 60, lastTerm: 12, lastPaymentDate: "2026-04-25",
      remaining: 240800, pendingDisburse: 0, interestDue: 0, interestOver: 0,
      lastChangeDays: 32, paymentStatus: "ปกติ", contractStatus: "ปกติ", debtSettleStatus: "ปกติ", debtSettleDate: null, restructureCount: 0,
    },
    {
      seq: 3, contract: "L-2021-0089", typeCode: "01", typeName: "เงินกู้สามัญ", purposeCode: "01", insurer: "AIA", amount: 350000, startDate: "2021-11-01", rate: 6.00, lastInterestDate: "2026-03-25", lastCollectDate: "2026-03-25", guarantors: [],
      installment: 4200, payType: "คงยอด", totalTerms: 120, lastTerm: 54, lastPaymentDate: "2026-03-25",
      remaining: 198400, pendingDisburse: 0, interestDue: 1820, interestOver: 0,
      lastChangeDays: 63, paymentStatus: "ล่าช้า", contractStatus: "ปกติ", debtSettleStatus: "ปกติ", debtSettleDate: null, restructureCount: 1,
    },
    {
      seq: 4, contract: "L-2019-0214", typeCode: "10", typeName: "ฉฉ ฉุกเฉินเงินสด", purposeCode: "01", insurer: "ทิพยประกันภัย", amount: 150000, startDate: "2019-08-12", rate: 5.50, lastInterestDate: "2026-02-25", lastCollectDate: "2026-02-25", guarantors: ["หลักทรัพย์ค้ำประกัน — โฉนดที่ดิน จ.นนทบุรี"],
      installment: 1450, payType: "คงยอด", totalTerms: 120, lastTerm: 81, lastPaymentDate: "2026-02-25",
      remaining: 56550, pendingDisburse: 0, interestDue: 0, interestOver: 102,
      lastChangeDays: 94, paymentStatus: "ปกติ", contractStatus: "ปรับปรุงโครงสร้างหนี้", debtSettleStatus: "ปกติ", debtSettleDate: "2024-01-15", restructureCount: 2,
    },
  ],

  // ฉุกเฉินหักโอน
  emergencyLoans: [
    { year: 2569, contract: "EM-2025-0312", reqNo: "REQ-25-0421", reqDate: "2025-12-08", amount: 30000, startMonth: "2025-12", lastDate: "2026-04-25", guarantor: "นายอนุชา สุขสวัสดิ์",          status: "ปกติ" },
    { year: 2568, contract: "EM-2024-0102", reqNo: "REQ-24-0119", reqDate: "2024-02-14", amount: 25000, startMonth: "2024-03", lastDate: "2025-02-25", guarantor: "นายอนุชา สุขสวัสดิ์",          status: "ปกติ" },
    { year: 2567, contract: "EM-2023-0884", reqNo: "REQ-23-0901", reqDate: "2023-10-02", amount: 40000, startMonth: "2023-11", lastDate: "2024-10-25", guarantor: "นางสาวกานต์ ศิริวงศ์",       status: "ปกติ" },
    { year: 2566, contract: "EM-2022-0301", reqNo: "REQ-22-0287", reqDate: "2022-06-15", amount: 20000, startMonth: "2022-07", lastDate: "2023-06-25", guarantor: "นายอนุชา สุขสวัสดิ์",          status: "ผิดนัดชำระ" },
  ],

  // ลูกหนี้ตัวแทน — รายการที่ตัวแทน (หน่วยงานต้นสังกัด) เรียกเก็บและนำส่งแทนสมาชิก
  //  AGR = ตัวแทนตั้งยอดเรียกเก็บ (เพิ่ม) · ARE = ตัวแทนนำส่งชำระ (ลด)
  agentDebt: {
    year: "2569", yearTo: "2569", billTerm: "2569/07", outstanding: 0,
    rows: [
      { seq: 1,  docDate: "12/01/2569", txnDate: "12/01/2569", code: "AGR", period: "2569/01", add: 21041.75, reduce: 0,        balance: 21041.75, payType: "",    recordedAt: "12/01/69 09:14", recordedBy: "PROG",    note: "", actor: "" },
      { seq: 2,  docDate: "29/01/2569", txnDate: "29/01/2569", code: "ARE", period: "2569/01", add: 0,        reduce: 21041.75, balance: 0,        payType: "CQE", recordedAt: "27/01/69 10:42", recordedBy: "DISKCUT", note: "", actor: "" },
      { seq: 3,  docDate: "11/02/2569", txnDate: "11/02/2569", code: "AGR", period: "2569/02", add: 20898.25, reduce: 0,        balance: 20898.25, payType: "",    recordedAt: "11/02/69 08:51", recordedBy: "PROG",    note: "", actor: "" },
      { seq: 4,  docDate: "26/02/2569", txnDate: "26/02/2569", code: "ARE", period: "2569/02", add: 0,        reduce: 20898.25, balance: 0,        payType: "CQE", recordedAt: "24/02/69 13:37", recordedBy: "DISKCUT", note: "", actor: "" },
      { seq: 5,  docDate: "11/03/2569", txnDate: "11/03/2569", code: "AGR", period: "2569/03", add: 21032.75, reduce: 0,        balance: 21032.75, payType: "",    recordedAt: "11/03/69 09:25", recordedBy: "PROG",    note: "", actor: "" },
      { seq: 6,  docDate: "30/03/2569", txnDate: "30/03/2569", code: "ARE", period: "2569/03", add: 0,        reduce: 21032.75, balance: 0,        payType: "CQE", recordedAt: "26/03/69 10:06", recordedBy: "DISKCUT", note: "", actor: "" },
      { seq: 7,  docDate: "16/04/2569", txnDate: "16/04/2569", code: "AGR", period: "2569/04", add: 20982.25, reduce: 0,        balance: 20982.25, payType: "",    recordedAt: "16/04/69 09:01", recordedBy: "PROG",    note: "", actor: "" },
      { seq: 8,  docDate: "29/04/2569", txnDate: "29/04/2569", code: "ARE", period: "2569/04", add: 0,        reduce: 20982.25, balance: 0,        payType: "CQE", recordedAt: "27/04/69 10:30", recordedBy: "DISKCUT", note: "", actor: "" },
      { seq: 9,  docDate: "11/05/2569", txnDate: "11/05/2569", code: "AGR", period: "2569/05", add: 21024.25, reduce: 0,        balance: 21024.25, payType: "",    recordedAt: "11/05/69 09:42", recordedBy: "PROG",    note: "", actor: "" },
      { seq: 10, docDate: "29/05/2569", txnDate: "29/05/2569", code: "ARE", period: "2569/05", add: 0,        reduce: 21024.25, balance: 0,        payType: "CQE", recordedAt: "26/05/69 09:16", recordedBy: "DISKCUT", note: "", actor: "" },
      { seq: 11, docDate: "11/06/2569", txnDate: "11/06/2569", code: "AGR", period: "2569/06", add: 20974.00, reduce: 0,        balance: 20974.00, payType: "",    recordedAt: "11/06/69 10:35", recordedBy: "PROG",    note: "", actor: "" },
      { seq: 12, docDate: "29/06/2569", txnDate: "29/06/2569", code: "ARE", period: "2569/06", add: 0,        reduce: 20974.00, balance: 0,        payType: "CQE", recordedAt: "25/06/69 10:41", recordedBy: "DISKCUT", note: "", actor: "" },
    ],
  },

  // เรียกเก็บ
  collections: [
    { dept: "0801", term: "2569/04", receipt: "RC2569-04-00821", amount: 18030, emergency: 2687.5, agent: 18030,    collected: 18030,   refund: 0 },
    { dept: "0801", term: "2569/03", receipt: "RC2569-03-00821", amount: 18030, emergency: 2687.5, agent: 18030,    collected: 18030,   refund: 0 },
    { dept: "0801", term: "2569/02", receipt: "RC2569-02-00821", amount: 18030, emergency: 2687.5, agent: 18030,    collected: 18030,   refund: 0 },
    { dept: "0801", term: "2569/01", receipt: "RC2569-01-00821", amount: 18030, emergency: 2687.5, agent: 18030,    collected: 18030,   refund: 0 },
    { dept: "0801", term: "2568/12", receipt: "RC2568-12-00821", amount: 18030, emergency: 2687.5, agent: 18030,    collected: 18030,   refund: 0 },
    { dept: "0801", term: "2568/11", receipt: "RC2568-11-00821", amount: 18030, emergency: 2687.5, agent: 18030,    collected: 15530,   refund: 2500 },
    { dept: "0801", term: "2568/10", receipt: "RC2568-10-00821", amount: 17780, emergency: 2687.5, agent: 17780,    collected: 17780,   refund: 0 },
    { dept: "0801", term: "2568/09", receipt: "RC2568-09-00821", amount: 17780, emergency: 2687.5, agent: 17780,    collected: 17780,   refund: 0 },
  ],

  // ค้ำใคร — สมาชิกค้ำให้คนอื่น
  guaranteeGiven: [
    { contract: "L-2024-0518", code: "GR-024218", debtor: "นายอนุชา สุขสวัสดิ์", debtorCode: "M-058243", debtorDept: "0301", startDate: "2024-03-15", loanAmount: 850000, status: "ปกติ", remaining: 420000, percent: 50, maxAmount: 250000 },
    { contract: "L-2023-0291", code: "GR-018442", debtor: "นางสาวกานต์ ศิริวงศ์", debtorCode: "M-058247", debtorDept: "0102", startDate: "2023-07-20", loanAmount: 400000, status: "ปกติ", remaining: 187500, percent: 100, maxAmount: 200000 },
    { contract: "L-2021-0078", code: "GR-014008", debtor: "นายธีรพงษ์ ขำเพชร", debtorCode: "M-058250", debtorDept: "0405", startDate: "2021-11-02", loanAmount: 350000, status: "ผิดนัดชำระ", remaining: 142000, percent: 50, maxAmount: 175000 },
    { contract: "L-2020-0044", code: "GR-011287", debtor: "นางวิภา จันทร์เพ็ญ", debtorCode: "M-058244", debtorDept: "0801", startDate: "2020-05-18", loanAmount: 250000, status: "ปรับโครงสร้างหนี้", remaining: 91200, percent: 100, maxAmount: 120000 },
  ],

  // ใครค้ำ — คนค้ำให้สมาชิก
  guaranteeReceived: [
    { contract: "L-2023-0148", code: "GR-019120", collateralDetail: "นายอนุชา สุขสวัสดิ์ — เงินเดือน 52,400 บาท", status: "ปกติ", remaining: 612500, percent: 50, maxAmount: 400000 },
    { contract: "L-2023-0148", code: "GR-019121", collateralDetail: "นางสาวกานต์ ศิริวงศ์ — เงินเดือน 47,200 บาท", status: "ปกติ", remaining: 612500, percent: 50, maxAmount: 400000 },
    { contract: "L-2024-0291", code: "GR-021884", collateralDetail: "นายธีรพงษ์ ขำเพชร — เงินเดือน 41,800 บาท",   status: "ปกติ", remaining: 240800, percent: 100, maxAmount: 280000 },
    { contract: "L-2019-0214", code: "GR-009844", collateralDetail: "หลักทรัพย์ค้ำประกัน — โฉนดที่ดิน จ.นนทบุรี",      status: "ปกติ", remaining: 56550,  percent: 100, maxAmount: 200000 },
  ],

  // ผู้รับผลประโยชน์ (ผูกกับข้อมูลสมาชิก — แท็บรายละเอียดสมาชิก)
  beneficiaries: [
    { id: "BEN-001", title: "นาง",    firstName: "พรพิมล",  lastName: "ใจดี",       relation: "คู่สมรส",  citizenId: "3-1018-00928-44-1", share: 50 },
    { id: "BEN-002", title: "ด.ช.",   firstName: "ปกรณ์",   lastName: "ใจดี รักษ์ออม", relation: "บุตร",     citizenId: "1-1019-00773-21-0", share: 25 },
    { id: "BEN-003", title: "ด.ญ.",   firstName: "ปุณยนุช", lastName: "ใจดี รักษ์ออม", relation: "บุตร",     citizenId: "1-1019-00884-55-2", share: 25 },
  ],

  // ข้อมูลหลักทรัพย์ — รายการขึ้นทะเบียนหลักทรัพย์ของสมาชิก (แท็บข้อมูลการเงินและสัญญา)
  securities: [
    { code: "SEC-58241-01", name: "โฉนดที่ดินเลขที่ 28456 ต.บางกระสอ", type: "โฉนด",
      address: "เลขที่ดิน 142 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000", appraisal: 2850000, remainAfterGuarantee: 2237450,
      contract: "L-2019-0214" },
    { code: "SEC-58241-02", name: "ห้องชุดอาคารชุดสุขสบาย ชั้น 8 ห้อง 802", type: "ห้องชุด",
      address: "เลขที่ 88/802 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กทม. 10900", appraisal: 1650000, remainAfterGuarantee: 1093450,
      contract: "L-2023-0148" },
    { code: "SEC-58241-03", name: "สิ่งปลูกสร้าง บ้านเดี่ยว 2 ชั้น", type: "สิ่งปลูกสร้าง",
      address: "128/45 หมู่ 3 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กทม. 10900", appraisal: 1200000, remainAfterGuarantee: 1200000,
      contract: null },
  ],

  // ── ข้อมูลสำหรับรายงานรายละเอียดสมาชิก ──
  amlo: { designated: false, designatedLabel: "ไม่เป็นบุคคลที่ถูกกำหนด", risk: "ต่ำ" },
  statusNotes: [
    "ส่งหนังสือโอนสิทธิ์ ส.5550085 — วันที่เริ่มสัญญา 10 พ.ค. 2565",
    "ประกันชีวิตกลุ่ม (F27) — มีผลวันที่ 28 ส.ค. 2565",
  ],
  // รายการรับชำระเงินกู้
  loanReceipts: [
    { receiptDate: "2026-04-25", payDate: "2026-04-25", contract: "L-2023-0148", rate: 5.75, docNo: "PX69031939", txnType: "ชำระ",   principal: 9679.50, interest: 245.50, paid: 9925.00, remaining: 612500.00 },
    { receiptDate: "2026-04-25", payDate: "2026-04-25", contract: "L-2024-0291", rate: 5.25, docNo: "PX69031940", txnType: "ชำระ",   principal: 4965.00, interest: 110.00, paid: 5075.00, remaining: 240800.00 },
    { receiptDate: "2026-03-25", payDate: "2026-03-25", contract: "L-2021-0089", rate: 6.00, docNo: "PX69027347", txnType: "หักกลบ", principal: 2380.00, interest: 1820.00, paid: 4200.00, remaining: 198400.00 },
    { receiptDate: "2026-02-25", payDate: "2026-02-25", contract: "L-2019-0214", rate: 5.50, docNo: "PX69022624", txnType: "ชำระ",   principal: 1347.50, interest: 102.50, paid: 1450.00, remaining: 56550.00 },
    { receiptDate: "2025-09-11", payDate: "2025-09-11", contract: "L-2023-0148", rate: 5.75, docNo: "PX68040946", txnType: "หักกลบ", principal: 9679.50, interest: 0.00,    paid: 9679.50, remaining: 681779.75 },
    { receiptDate: "2025-05-31", payDate: "2025-05-31", contract: "L-2024-0291", rate: 5.25, docNo: "PX68027347", txnType: "หักกลบ", principal: 4965.00, interest: 0.00,    paid: 4965.00, remaining: 265875.00 },
  ],
  // การเปลี่ยนแปลงหุ้น
  shareChanges: [
    { changeDate: "2020-02-07", term: 38,  shareCapital: 540000, before: "ส่งหุ้นงวดละ 1,000.00", after: "ส่งหุ้นงวดละ 2,500.00" },
    { changeDate: "2016-12-09", term: 110, shareCapital: 47400,  before: "ส่งหุ้นงวดละ 500.00",   after: "ส่งหุ้นงวดละ 1,000.00" },
  ],

  // เงินฝาก — ข้อมูลสงวนสิทธิ์ (เข้าถึงได้เฉพาะผู้มีสิทธิ์ หลังยืนยัน Username/Password)
  deposits: {
    accounts: [
      { no: 1, accNo: "001-2-58241-0", type: "ออมทรัพย์",                openDate: "2008-06-01", rate: 1.25, balance: 342850.50, ytdInterest: 3120.40, status: "ใช้งาน" },
      { no: 2, accNo: "002-5-58241-7", type: "ออมทรัพย์พิเศษ",          openDate: "2015-03-10", rate: 2.75, balance: 680000.00, ytdInterest: 9120.00, status: "ใช้งาน" },
      { no: 3, accNo: "003-1-58241-4", type: "ฝากประจำ 12 เดือน",       openDate: "2024-01-15", rate: 3.10, balance: 500000.00, ytdInterest: 7750.00, status: "ใช้งาน" },
      { no: 4, accNo: "004-9-58241-2", type: "ออมทรัพย์เพื่อเกษียณ",     openDate: "2010-08-01", rate: 3.50, balance: 128400.00, ytdInterest: 2147.30, status: "ใช้งาน" },
    ],
    transactions: [
      { id: "TX-2569-04-2210", date: "2026-04-25", accNo: "002-5-58241-7", type: "deposit",  channel: "หักเงินเดือน",   amount: 5000.00,  balance: 680000.00, ref: "PAYROLL-2569-04", by: "ระบบอัตโนมัติ" },
      { id: "TX-2569-04-2188", date: "2026-04-25", accNo: "001-2-58241-0", type: "deposit",  channel: "หักเงินเดือน",   amount: 2000.00,  balance: 342850.50, ref: "PAYROLL-2569-04", by: "ระบบอัตโนมัติ" },
      { id: "TX-2569-03-1944", date: "2026-03-31", accNo: "004-9-58241-2", type: "interest", channel: "ปรับดอกเบี้ย",   amount: 374.50,   balance: 128400.00, ref: "INT-Q1-2569",    by: "ระบบอัตโนมัติ" },
      { id: "TX-2569-03-1902", date: "2026-03-31", accNo: "003-1-58241-4", type: "interest", channel: "ปรับดอกเบี้ย",   amount: 3875.00,  balance: 500000.00, ref: "INT-Q1-2569",    by: "ระบบอัตโนมัติ" },
      { id: "TX-2569-03-1755", date: "2026-03-18", accNo: "001-2-58241-0", type: "withdraw", channel: "เคาน์เตอร์",     amount: 15000.00, balance: 340850.50, ref: "WD-58241-0312",  by: "สุนิสา ทองแท้" },
      { id: "TX-2569-03-1610", date: "2026-03-05", accNo: "002-5-58241-7", type: "deposit",  channel: "โอน Online",     amount: 50000.00, balance: 675000.00, ref: "TRF-INET-77120", by: "สมาชิก (Online)" },
      { id: "TX-2569-02-1488", date: "2026-02-25", accNo: "002-5-58241-7", type: "deposit",  channel: "หักเงินเดือน",   amount: 5000.00,  balance: 625000.00, ref: "PAYROLL-2569-02", by: "ระบบอัตโนมัติ" },
      { id: "TX-2569-02-1402", date: "2026-02-14", accNo: "001-2-58241-0", type: "withdraw", channel: "ATM",            amount: 8000.00,  balance: 355850.50, ref: "ATM-002841",     by: "สมาชิก (ATM)" },
      { id: "TX-2569-01-1290", date: "2026-01-25", accNo: "001-2-58241-0", type: "deposit",  channel: "หักเงินเดือน",   amount: 2000.00,  balance: 363850.50, ref: "PAYROLL-2569-01", by: "ระบบอัตโนมัติ" },
      { id: "TX-2569-01-1101", date: "2026-01-15", accNo: "003-1-58241-4", type: "deposit",  channel: "เคาน์เตอร์",     amount: 500000.00,balance: 500000.00, ref: "FD-OPEN-58241",  by: "สุนิสา ทองแท้" },
    ],
  },
};

// ─── Format helpers ──────────────────────────────────────────────────
window.fmt = {
  // Thai locale-style number with commas, 2 decimals when needed
  money: (n, decimals = 2) => {
    if (n == null || n === '') return '—';
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  },
  int: (n) => {
    if (n == null) return '—';
    return Number(n).toLocaleString('en-US');
  },
  // Thai Buddhist year date display
  date: (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  },
  age: (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
    return `${a} ปี`;
  },
  // อายุแบบ ปี+เดือน — "44 ปี 2 เดือน"
  ageYM: (iso) => {
    if (!iso) return '';
    return fmt.diffYM(iso, new Date().toISOString().slice(0, 10));
  },
  // ระยะเวลาคงเหลือถึงวันที่กำหนด (เช่น เกษียณ) — "15 ปี 4 เดือน" หรือ "ครบกำหนดแล้ว"
  retireCountdown: (iso) => {
    if (!iso) return '';
    const today = new Date().toISOString().slice(0, 10);
    if (iso <= today) return 'ครบกำหนดแล้ว';
    return fmt.diffYM(today, iso);
  },
  // ผลต่างเป็น ปี+เดือน ระหว่างสอง ISO date (from ≤ to)
  diffYM: (fromIso, toIso) => {
    const a = new Date(fromIso), b = new Date(toIso);
    let years = b.getFullYear() - a.getFullYear();
    let months = b.getMonth() - a.getMonth();
    if (b.getDate() < a.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years < 0) return '0 เดือน';
    const yPart = years > 0 ? `${years} ปี ` : '';
    return `${yPart}${months} เดือน`.trim();
  },
  // วันที่ + เวลา แบบ พ.ศ. — "24 เม.ย. 2569 14:32"
  datetime: (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543} ${hh}:${mm}`;
  },
  // เวลาแบบ HH:MM:SS
  time: (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  },
};

// ─── ค่าคงที่สำหรับฟอร์มเพิ่ม/แก้ไขสมาชิก ────────────────────────────
window.TITLE_OPTIONS    = ['นาย', 'นาง', 'นางสาว'];
window.GENDER_OPTIONS   = ['ชาย', 'หญิง'];
window.MARITAL_OPTIONS  = ['โสด', 'สมรส', 'หย่าร้าง'];
window.WORKSTATUS_OPTIONS = ['พนักงานปกติ', 'เกษียณ', 'ลาออก', 'ไล่ออก'];

// ─── ตัวเลือกเพิ่มเติม: ฟอร์มสมัครสมาชิกใหม่ ──────────────────────────
window.APPLY_COUNT_OPTIONS    = ['ครั้งที่ 1', 'ครั้งที่ 2', 'ครั้งที่ 3'];
window.MEMBER_TYPE_FORM_OPTIONS = ['ไม่ระบุ', 'สมาชิกสามัญ', 'สมาชิกสมทบ'];
window.SUBSIDIARY_TYPE_OPTIONS  = ['สมทบพนักงาน', 'สมทบเครือญาติ'];
// ประเภทสมาชิกที่ "เกิดขึ้นจริง" จากหน้าเพิ่มสมาชิกใหม่ (memberType + subsidiaryType)
// ใช้ให้หน้าทะเบียนสมาชิกแสดง/แก้ไขให้สอดคล้องกับหน้าเพิ่มสมาชิกใหม่
window.MEMBER_TYPE_OPTIONS = ['ไม่ระบุ', 'สมาชิกสามัญ', 'สมาชิกสมทบ (พนักงาน)', 'สมาชิกสมทบ (เครือญาติ)'];

// ผู้ใช้งานที่ล็อกอินอยู่ขณะนี้ (ใช้เติมช่อง "ผู้ทำรายการ")
window.CURRENT_USER = { name: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', initials: 'จม', position: 'งพ.' }; // position: ตำแหน่งย่อ (งพ. = เจ้าหน้าที่เงินกู้พิเศษ · หงพ. = หัวหน้าเงินกู้พิเศษ)

// ค่าเริ่มต้นเงินฝากแรกเข้า (บาท)
window.DEFAULT_ENTRY_DEPOSIT = 500;

// ─── สังกัด / หน่วยงาน (สำหรับ popup ค้นหาสังกัดหัวหน้า) ───────────────
window.DEPARTMENTS = [
  { code: '0101', name: 'สำนักปลัด',              unit: 'งานบริหารทั่วไป',        head: 'นายประภาส วงศ์อนันต์' },
  { code: '0102', name: 'สำนักปลัด',              unit: 'งานนโยบายและแผน',       head: 'นางสุภาพร เกษมสุข' },
  { code: '0301', name: 'กองช่าง',                unit: 'กลุ่มงานโยธา',          head: 'นายสุรชัย วงศ์ประเสริฐ' },
  { code: '0302', name: 'กองช่าง',                unit: 'กลุ่มงานผังเมือง',       head: 'นายอนุชา สุขสวัสดิ์' },
  { code: '0501', name: 'กองการศึกษา',            unit: 'กลุ่มงานส่งเสริมการศึกษา', head: 'นางสาวศิริพร ใจงาม' },
  { code: '0601', name: 'กองสาธารณสุข',           unit: 'กลุ่มงานบริการสาธารณสุข',  head: 'นายภาคภูมิ รัตนา' },
  { code: '0801', name: 'กองคลัง สำนักงานปลัด',   unit: 'กลุ่มงานบัญชีและงบประมาณ', head: 'นางวิภา จันทร์เพ็ญ' },
  { code: '0802', name: 'กองคลัง สำนักงานปลัด',   unit: 'กลุ่มงานพัสดุและทรัพย์สิน', head: 'นายธีรพงษ์ ขำเพชร' },
  { code: '0901', name: 'กองสวัสดิการสังคม',       unit: 'งานสังคมสงเคราะห์',      head: 'นางอรอนงค์ บุญมาก' },
];
window.searchDepartments = (c) => {
  const code = (c.code || '').trim().toLowerCase();
  const name = (c.name || '').trim().toLowerCase();
  const unit = (c.unit || '').trim().toLowerCase();
  return window.DEPARTMENTS.filter((d) => {
    if (code && !d.code.toLowerCase().includes(code)) return false;
    if (name && !d.name.toLowerCase().includes(name)) return false;
    if (unit && !d.unit.toLowerCase().includes(unit)) return false;
    return true;
  });
};

// ─── ที่อยู่: จังหวัด → อำเภอ/เขต → ตำบล/แขวง (ชุดตัวอย่าง) ─────────────
window.PROVINCES = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ'];
window.AMPHOES = {
  'กรุงเทพมหานคร': ['จตุจักร', 'ดินแดง', 'บางซื่อ', 'พญาไท'],
  'นนทบุรี':       ['เมืองนนทบุรี', 'บางใหญ่', 'ปากเกร็ด'],
  'ปทุมธานี':      ['เมืองปทุมธานี', 'คลองหลวง', 'ธัญบุรี'],
  'สมุทรปราการ':   ['เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง'],
};
window.TAMBONS = {
  'จตุจักร':       ['จตุจักร', 'จอมพล', 'จันทรเกษม', 'ลาดยาว', 'เสนานิคม'],
  'ดินแดง':        ['ดินแดง', 'รัชดาภิเษก'],
  'บางซื่อ':       ['บางซื่อ', 'วงศ์สว่าง'],
  'พญาไท':         ['สามเสนใน'],
  'เมืองนนทบุรี':  ['บางกระสอ', 'ตลาดขวัญ', 'สวนใหญ่', 'บางเขน'],
  'บางใหญ่':       ['บางม่วง', 'บางใหญ่', 'เสาธงหิน'],
  'ปากเกร็ด':      ['ปากเกร็ด', 'บางตลาด', 'คลองเกลือ'],
  'เมืองปทุมธานี': ['บางปรอก', 'บ้านกลาง', 'บ้านฉาง'],
  'คลองหลวง':      ['คลองหนึ่ง', 'คลองสอง', 'คลองสาม'],
  'ธัญบุรี':        ['ประชาธิปัตย์', 'รังสิต', 'บึงยี่โถ'],
  'เมืองสมุทรปราการ': ['ปากน้ำ', 'สำโรงเหนือ', 'บางเมือง'],
  'บางพลี':        ['บางพลีใหญ่', 'บางแก้ว', 'ราชาเทวะ'],
  'พระประแดง':     ['ตลาด', 'บางพึ่ง', 'บางครุ'],
};

// ─── ประวัติสมาชิกเก่า (ระบบตรวจสอบจากเลขบัตรประชาชน เมื่อกรอกครบ) ─────
// คีย์ = เลขบัตรประชาชน (เฉพาะตัวเลข) → ข้อมูลทะเบียนเดิมที่ลาออกไปแล้ว
window.FORMER_MEMBERS = {
  '1209900321668': { resignDate: '2019-09-30', prevCode: 'M-049217', reasonCode: '08', reasonText: 'ลาออกตามความสมัครใจ' },
  '5101900482119': { resignDate: '2021-03-31', prevCode: 'M-051042', reasonCode: '12', reasonText: 'โอน/ย้ายหน่วยงาน' },
};
window.lookupFormerMember = (citizenId) => {
  const key = String(citizenId || '').replace(/\D/g, '');
  return key.length === 13 ? (window.FORMER_MEMBERS[key] || null) : null;
};

// ─── ตัวเลือก Listbox สำหรับแท็บสถานะภาพ ─────────────────────────────
window.APPLICATION_TYPE_OPTIONS = [
  { value: 'none',      label: 'ไม่ระบุ' },
  { value: 'temporary', label: 'สมาชิกชั่วคราว' },
  { value: 'permanent', label: 'สมาชิกปกติ' },
];
window.COLLECTION_STATUS_OPTIONS = [
  { value: 'normal',     label: 'เรียกเก็บตามปกติ' },
  { value: 'occasional', label: 'เรียกเก็บเป็นบางครั้ง' },
  { value: 'none',       label: 'ไม่เรียกเก็บ' },
];

// ─── ค่าคงที่ระบบเงินฝาก ─────────────────────────────────────────────
window.DEPOSIT_TXN_TYPES = {
  deposit:  { label: 'ฝากเงิน',   pill: 'ok',   sign: '+' },
  withdraw: { label: 'ถอนเงิน',   pill: 'bad',  sign: '−' },
  interest: { label: 'ดอกเบี้ย',  pill: 'info', sign: '+' },
};
window.DEPOSIT_ACCOUNT_TYPES = ['ออมทรัพย์', 'ออมทรัพย์พิเศษ', 'ฝากประจำ 12 เดือน', 'ออมทรัพย์เพื่อเกษียณ'];

// บัญชีผู้มีสิทธิ์เข้าถึงข้อมูลเงินฝาก (ต้องยืนยัน Username/Password ก่อนเข้าใช้งาน)
// หมายเหตุ: ข้อมูลสาธิตเท่านั้น — ระบบจริงต้องตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์
window.DEPOSIT_AUTHORIZED_USERS = [
  { username: 'finance',  password: 'coop@2569', name: 'สุนิสา ทองแท้',   role: 'เจ้าหน้าที่การเงิน' },
  { username: 'manager',  password: 'coop@2569', name: 'อภิชาติ ศรีสุข',  role: 'ผู้จัดการสหกรณ์' },
];

// gen รหัสสมาชิกถัดไปจากรายการปัจจุบัน
window.nextMemberCode = (list) => {
  const max = (list || []).reduce((mx, m) => {
    const n = parseInt(String(m.code).replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > mx ? n : mx;
  }, 58241);
  return 'M-' + String(max + 1).padStart(6, '0');
};

// ─── ผู้ใช้งานระบบ (สำหรับ audit log) ───────────────────────────────
window.SYSTEM_USERS = [
  { id: 'u01', name: 'จันทร์เพ็ญ มาลี',    role: 'เจ้าหน้าที่ทะเบียน',  initials: 'จม', email: 'janpen.m@sotkst.co.th' },
  { id: 'u02', name: 'ประเสริฐ วัฒนชัย',   role: 'หัวหน้าฝ่ายสินเชื่อ',  initials: 'ปว', email: 'prasert.w@sotkst.co.th' },
  { id: 'u03', name: 'สุนิสา ทองแท้',       role: 'เจ้าหน้าที่การเงิน',   initials: 'สท', email: 'sunisa.t@sotkst.co.th' },
  { id: 'u04', name: 'อภิชาติ ศรีสุข',      role: 'ผู้จัดการสหกรณ์',     initials: 'อศ', email: 'apichat.s@sotkst.co.th' },
  { id: 'u05', name: 'ระบบอัตโนมัติ',       role: 'System',             initials: 'SYS', email: 'system@sotkst.co.th' },
  { id: 'u06', name: 'มนตรี ศรีสุข',        role: 'ผู้ดูแลระบบ',        initials: 'มศ', email: 'montri.s@sotkst.co.th' },
  { id: 'u07', name: 'ปราณี วงศ์ทอง',       role: 'เจ้าหน้าที่สินเชื่อ',  initials: 'ปท', email: 'pranee.w@sotkst.co.th' },
  { id: 'u08', name: 'ธนากร แสงเพชร',       role: 'เจ้าหน้าที่บัญชี',    initials: 'ธส', email: 'thanakorn.s@sotkst.co.th' },
  { id: 'u09', name: 'อรทัย พรมมา',         role: 'เจ้าหน้าที่การเงิน',   initials: 'อพ', email: 'orathai.p@sotkst.co.th' },
];
window.sysUserByName = (name) => window.SYSTEM_USERS.find(u => u.name === name);

// ─── ประเภทการกระทำ (audit action) ─────────────────────────────────
window.AUDIT_ACTIONS = {
  create:  { label: 'สร้าง',         pill: 'ok'   },
  update:  { label: 'แก้ไข',        pill: 'info' },
  delete:  { label: 'ลบข้อมูล',      pill: 'bad'  },
  status:  { label: 'เปลี่ยนสถานะ',  pill: 'warn' },
  assign:  { label: 'กำหนดสิทธิ์',   pill: 'accent2' },
  revoke:  { label: 'ถอนสิทธิ์',     pill: 'warn' },
  enable:  { label: 'เปิดใช้งาน',    pill: 'ok'   },
  disable: { label: 'ปิดใช้งาน',     pill: 'bad'  },
  login:   { label: 'เข้าสู่ระบบ',    pill: 'ok' },
  logout:  { label: 'ออกจากระบบ',   pill: 'neutral' },
  access:  { label: 'เข้าถึงข้อมูล',  pill: 'warn' },
  export:  { label: 'ส่งออกข้อมูล',  pill: 'neutral' },
  print:   { label: 'พิมพ์เอกสาร',   pill: 'neutral' },
};
// ประเภทการกระทำที่ถือเป็น "การเปลี่ยนแปลงข้อมูล" (แท็บที่ 1) — ไม่รวมการเข้า-ออกระบบ
window.AUDIT_DATA_ACTIONS = ['create', 'update', 'delete', 'status', 'assign', 'revoke', 'enable', 'disable', 'export', 'print', 'access'];
window.AUDIT_ACCESS_ACTIONS = ['login', 'logout'];

// ─── ข้อมูลตั้งต้น Audit Log (ประวัติการใช้งานย้อนหลัง) ──────────────
// ts = ISO datetime; changes = [{ field, before, after }]
window.AUDIT_SEED = [
  { id: 'A-100260', ts: '2026-04-25T09:02:11', user: 'ระบบอัตโนมัติ', role: 'System', action: 'create', module: 'เงินฝาก', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'รับฝากหักเงินเดือนเข้าบัญชีออมทรัพย์พิเศษ', ip: 'system',
    changes: [ { field: 'บัญชี 002-5-58241-7', before: '675,000.00', after: '680,000.00' }, { field: 'ประเภทรายการ', before: '—', after: 'ฝากเงิน (หักเงินเดือน)' } ] },
  { id: 'A-100259', ts: '2026-03-18T14:21:47', user: 'สุนิสา ทองแท้', role: 'เจ้าหน้าที่การเงิน', action: 'update', module: 'เงินฝาก', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'ถอนเงินสดผ่านเคาน์เตอร์ บัญชีออมทรัพย์', ip: '10.21.4.22',
    changes: [ { field: 'บัญชี 001-2-58241-0', before: '355,850.50', after: '340,850.50' }, { field: 'ถอน', before: '—', after: '15,000.00' } ] },
  { id: 'A-100258', ts: '2026-04-25T08:40:05', user: 'ระบบอัตโนมัติ', role: 'System', action: 'status', module: 'หุ้น', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'รับชำระค่าหุ้นรายเดือน งวด 2569/04', ip: 'system',
    changes: [ { field: 'ทุนเรือนหุ้น', before: '786,500.00', after: '789,000.00' } ] },
  { id: 'A-100257', ts: '2026-04-25T08:38:50', user: 'ระบบอัตโนมัติ', role: 'System', action: 'status', module: 'การเรียกเก็บ', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'ตัดยอดเรียกเก็บประจำงวด 2569/04', ip: 'system',
    changes: [ { field: 'ยอดเรียกเก็บสุทธิ', before: '—', after: '18,030.00' }, { field: 'สถานะ', before: '—', after: 'เก็บครบ' } ] },
  { id: 'A-100256', ts: '2026-03-26T10:15:33', user: 'ประเสริฐ วัฒนชัย', role: 'หัวหน้าฝ่ายสินเชื่อ', action: 'update', module: 'เงินกู้และสัญญา', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'บันทึกรับชำระงวดเงินกู้สามัญ #L-2023-0148', ip: '10.21.4.31',
    changes: [ { field: 'คงเหลือ', before: '622,425.00', after: '612,500.00' }, { field: 'งวดที่ชำระ', before: '83', after: '84' } ] },
  { id: 'A-100247', ts: '2026-06-02T09:14:22', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'update', module: 'ทะเบียนสมาชิก', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'แก้ไขข้อมูลการทำงาน — ปรับอัตราเงินเดือน', ip: '10.21.4.18',
    changes: [ { field: 'อัตราเงินเดือน', before: '46,200.00', after: '48,750.00' }, { field: 'แผนกสังกัด', before: 'กลุ่มงานบัญชี', after: 'กลุ่มงานบัญชีและงบประมาณ' } ] },
  { id: 'A-100246', ts: '2026-06-02T08:55:01', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'login', module: 'ระบบ', target: '—', summary: 'เข้าสู่ระบบสำเร็จ', ip: '10.21.4.18', changes: [] },
  { id: 'A-100245', ts: '2026-06-01T16:42:37', user: 'ประเสริฐ วัฒนชัย', role: 'หัวหน้าฝ่ายสินเชื่อ', action: 'status', module: 'ทะเบียนสมาชิก', target: 'M-058245 · นายธีรพงษ์ ขำเพชร', summary: 'เปลี่ยนสถานะการเรียกเก็บ — งดเรียกเก็บชั่วคราว', ip: '10.21.4.31',
    changes: [ { field: 'สถานะการเรียกเก็บ', before: 'เรียกเก็บตามปกติ', after: 'เรียกเก็บเป็นบางครั้ง' }, { field: 'งดกู้ทุกประเภท', before: 'ไม่ใช่', after: 'ใช่' } ] },
  { id: 'A-100244', ts: '2026-06-01T14:20:10', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'create', module: 'ทะเบียนสมาชิก', target: 'M-058252 · นางสาวจุฬาลักษณ์ พัฒนกุล', summary: 'เพิ่มสมาชิกใหม่เข้าระบบ', ip: '10.21.4.18',
    changes: [ { field: 'เลขทะเบียนสมาชิก', before: '—', after: 'M-058252' }, { field: 'ชื่อ-สกุล', before: '—', after: 'นางสาวจุฬาลักษณ์ พัฒนกุล' }, { field: 'เลขบัตรประชาชน', before: '—', after: '5-1019-00482-11-9' } ] },
  { id: 'A-100243', ts: '2026-06-01T11:08:44', user: 'สุนิสา ทองแท้', role: 'เจ้าหน้าที่การเงิน', action: 'export', module: 'รายงาน', target: 'รายงานการเรียกเก็บ งวด 2569/05', summary: 'ส่งออกรายงานเป็นไฟล์ Excel', ip: '10.21.4.22', changes: [] },
  { id: 'A-100242', ts: '2026-05-30T15:33:19', user: 'อภิชาติ ศรีสุข', role: 'ผู้จัดการสหกรณ์', action: 'update', module: 'ข้อมูลสหกรณ์', target: 'ค่าคงที่ข้อมูลสหกรณ์', summary: 'แก้ไขเบอร์ติดต่อและอีเมลสหกรณ์', ip: '10.21.4.5',
    changes: [ { field: 'เบอร์ติดต่อ', before: '022625741', after: '022625742' }, { field: 'อีเมล', before: 'info@coop-moi.or.th', after: 'contact@coop-moi.or.th' } ] },
  { id: 'A-100241', ts: '2026-05-30T10:12:55', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'update', module: 'ทะเบียนสมาชิก', target: 'M-058241 · นายสมชาย ใจดี รักษ์ออม', summary: 'เพิ่มข้อมูลคู่สมรส (ดึงจากสมาชิก M-058246)', ip: '10.21.4.18',
    changes: [ { field: 'สถานภาพสมรส', before: 'โสด', after: 'สมรส' }, { field: 'คู่สมรส', before: '—', after: 'นางพรพิมล ทองคำ (M-058246)' } ] },
  { id: 'A-100240', ts: '2026-05-29T17:01:02', user: 'ประเสริฐ วัฒนชัย', role: 'หัวหน้าฝ่ายสินเชื่อ', action: 'create', module: 'เงินกู้และสัญญา', target: 'L-2026-0188 · นางวิภา จันทร์เพ็ญ', summary: 'อนุมัติสัญญาเงินกู้สามัญใหม่', ip: '10.21.4.31',
    changes: [ { field: 'วงเงินกู้', before: '—', after: '250,000.00' }, { field: 'จำนวนงวด', before: '—', after: '120' } ] },
  { id: 'A-100239', ts: '2026-05-29T09:47:38', user: 'ระบบอัตโนมัติ', role: 'System', action: 'status', module: 'การเรียกเก็บ', target: 'งวด 2569/05', summary: 'ประมวลผลตัดยอดเรียกเก็บประจำงวดอัตโนมัติ', ip: 'system', changes: [] },
  { id: 'A-100238', ts: '2026-05-28T13:25:14', user: 'สุนิสา ทองแท้', role: 'เจ้าหน้าที่การเงิน', action: 'print', module: 'ทะเบียนสมาชิก', target: 'M-058243 · นายอนุชา สุขสวัสดิ์', summary: 'พิมพ์ใบหักประจำเดือน งวด 2569/04', ip: '10.21.4.22', changes: [] },
  { id: 'A-100237', ts: '2026-05-28T08:50:00', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'update', module: 'ทะเบียนสมาชิก', target: 'M-058244 · นางวิภา จันทร์เพ็ญ', summary: 'อัปเดตลายเซ็นสมาชิก', ip: '10.21.4.18',
    changes: [ { field: 'ลายเซ็นสมาชิก', before: 'signature_v1.png', after: 'signature_v2.png' } ] },
  { id: 'A-100236', ts: '2026-05-27T16:18:42', user: 'อภิชาติ ศรีสุข', role: 'ผู้จัดการสหกรณ์', action: 'delete', module: 'ผู้ใช้งานและสิทธิ์', target: 'บัญชีผู้ใช้ u09 · ทดสอบระบบ', summary: 'ลบบัญชีผู้ใช้งานที่ไม่ใช้งานแล้ว', ip: '10.21.4.5',
    changes: [ { field: 'สถานะบัญชี', before: 'ระงับการใช้งาน', after: 'ลบออกจากระบบ' } ] },
  { id: 'A-100235', ts: '2026-05-27T10:33:27', user: 'ประเสริฐ วัฒนชัย', role: 'หัวหน้าฝ่ายสินเชื่อ', action: 'status', module: 'ทะเบียนสมาชิก', target: 'M-058247 · นายวีรชัย พิทักษ์ธรรม', summary: 'เปลี่ยนสถานะการทำงานเป็นเกษียณ', ip: '10.21.4.31',
    changes: [ { field: 'สถานะการทำงาน', before: 'พนักงานปกติ', after: 'เกษียณ' }, { field: 'วันที่พ้นสภาพ', before: '—', after: '30 ก.ย. 2568' } ] },
  { id: 'A-100234', ts: '2026-05-26T14:05:51', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'create', module: 'ทะเบียนสมาชิก', target: 'M-058246 · นางสาวพรพิมล ทองคำ', summary: 'เพิ่มสมาชิกใหม่ (สมาชิกชั่วคราว)', ip: '10.21.4.18',
    changes: [ { field: 'เลขทะเบียนสมาชิก', before: '—', after: 'M-058246' }, { field: 'ประเภทสมาชิก', before: '—', after: 'สมาชิกชั่วคราว' } ] },
  { id: 'A-100233', ts: '2026-05-26T08:48:09', user: 'สุนิสา ทองแท้', role: 'เจ้าหน้าที่การเงิน', action: 'login', module: 'ระบบ', target: '—', summary: 'เข้าสู่ระบบสำเร็จ', ip: '10.21.4.22', changes: [] },
  { id: 'A-100232', ts: '2026-05-25T15:55:33', user: 'อภิชาติ ศรีสุข', role: 'ผู้จัดการสหกรณ์', action: 'update', module: 'ข้อมูลระบบ', target: 'ค่าคงที่อัตราดอกเบี้ย', summary: 'ปรับอัตราดอกเบี้ยเงินกู้สามัญ', ip: '10.21.4.5',
    changes: [ { field: 'ดอกเบี้ยเงินกู้สามัญ (%/ปี)', before: '6.25', after: '6.00' } ] },
  { id: 'A-100261', ts: '2026-08-04T14:32:00', user: 'มนตรี ศรีสุข', role: 'ผู้ดูแลระบบ', action: 'assign', module: 'ผู้ดูแลระบบ', modulePath: 'ผู้ดูแลระบบ › จัดการกลุ่มผู้ใช้', target: 'กลุ่มผู้ใช้: ฝ่ายสินเชื่อ', summary: 'กำหนดสิทธิ์กลุ่มผู้ใช้: ฝ่ายสินเชื่อ', ip: '10.20.4.18', device: 'Windows 11 · Chrome 128', result: 'ok', changes: [] },
  { id: 'A-100262', ts: '2026-08-04T11:18:00', user: 'สุนิสา ทองแท้', role: 'เจ้าหน้าที่การเงิน', action: 'update', module: 'ทะเบียนสมาชิก', modulePath: 'ทะเบียนสมาชิก › ข้อมูลสมาชิก', target: 'สมาชิก: ประเสริฐ วัฒนชัย', summary: 'แก้ไขข้อมูลสมาชิก: ประเสริฐ วัฒนชัย', ip: '10.20.5.41', device: 'macOS 15 · Safari 18', result: 'ok', changes: [] },
  { id: 'A-100263', ts: '2026-08-04T09:47:00', user: 'อภิชาติ ศรีสุข', role: 'ผู้จัดการสหกรณ์', action: 'disable', module: 'ผู้ดูแลระบบ', modulePath: 'ผู้ดูแลระบบ › จัดการผู้ใช้งาน', target: 'ผู้ใช้งาน: wanchai.k', summary: 'ปิดใช้งานผู้ใช้งาน: wanchai.k', ip: '10.20.1.7', device: 'Windows 11 · Edge 128', result: 'ok', changes: [] },
  { id: 'A-100264', ts: '2026-08-03T16:05:00', user: 'มนตรี ศรีสุข', role: 'ผู้ดูแลระบบ', action: 'create', module: 'ผู้ดูแลระบบ', modulePath: 'ผู้ดูแลระบบ › จัดการบทบาท', target: 'บทบาท: ผู้ตรวจสอบภายใน', summary: 'สร้างบทบาทใหม่: ผู้ตรวจสอบภายใน', ip: '10.20.4.18', device: 'Windows 11 · Chrome 128', result: 'ok', changes: [] },
  { id: 'A-100265', ts: '2026-08-03T13:22:00', user: 'ปราณี วงศ์ทอง', role: 'เจ้าหน้าที่สินเชื่อ', action: 'update', module: 'สินเชื่อ', modulePath: 'สินเชื่อ › ค่าคงที่สินเชื่อ', target: 'ค่าคงที่: อัตราดอกเบี้ยเงินกู้สามัญ', summary: 'แก้ไขค่าคงที่: อัตราดอกเบี้ยเงินกู้สามัญ', ip: '10.20.6.12', device: 'Windows 10 · Chrome 127', result: 'ok', changes: [] },
  { id: 'A-100266', ts: '2026-08-03T10:41:00', user: 'ธนากร แสงเพชร', role: 'เจ้าหน้าที่บัญชี', action: 'update', module: 'บัญชี', modulePath: 'บัญชี › ผังบัญชี', target: 'ผังบัญชี: 5210-02 ค่าใช้จ่ายสำนักงาน', summary: 'แก้ไขผังบัญชี: 5210-02 ค่าใช้จ่ายสำนักงาน', ip: '10.20.7.88', device: 'Windows 11 · Chrome 128', result: 'fail', changes: [] },
  { id: 'A-100267', ts: '2026-08-02T15:58:00', user: 'มนตรี ศรีสุข', role: 'ผู้ดูแลระบบ', action: 'revoke', module: 'ผู้ดูแลระบบ', modulePath: 'ผู้ดูแลระบบ › กำหนดสิทธิ์ผู้ใช้', target: 'ผู้ใช้งาน: sunisa.t', summary: 'ถอนสิทธิ์ผู้ใช้งาน: sunisa.t', ip: '10.20.4.18', device: 'Windows 11 · Chrome 128', result: 'ok', changes: [] },
  { id: 'A-100268', ts: '2026-08-02T09:12:00', user: 'อรทัย พรมมา', role: 'เจ้าหน้าที่การเงิน', action: 'create', module: 'เงินฝาก', modulePath: 'เงินฝาก › เปิดบัญชีเงินฝาก', target: 'บัญชีเงินฝาก: 021-3-88214-7', summary: 'เปิดบัญชีเงินฝาก: 021-3-88214-7', ip: '10.20.8.23', device: 'Windows 11 · Chrome 128', result: 'ok', changes: [] },
  { id: 'A-100269', ts: '2026-08-01T17:34:00', user: 'อภิชาติ ศรีสุข', role: 'ผู้จัดการสหกรณ์', action: 'enable', module: 'ผู้ดูแลระบบ', modulePath: 'ผู้ดูแลระบบ › จัดการบทบาท', target: 'บทบาท: เจ้าหน้าที่ทะเบียน', summary: 'เปิดใช้งานบทบาท: เจ้าหน้าที่ทะเบียน', ip: '10.20.1.7', device: 'Windows 11 · Edge 128', result: 'ok', changes: [] },
];
// เติมค่า result / device / modulePath ที่ยังไม่ระบุให้แถวเก่า (ค่าเริ่มต้น)
window.AUDIT_SEED.forEach((e, i) => {
  if (e.result == null) e.result = 'ok';
  if (e.device == null) e.device = e.ip === 'system' ? 'ระบบอัตโนมัติ' : ['Windows 11 · Chrome 128', 'Windows 10 · Chrome 127', 'macOS 15 · Safari 18', 'Windows 11 · Edge 128'][i % 4];
  if (e.modulePath == null) e.modulePath = 'ผู้ดูแลระบบ › ' + e.module;
});

// ─── ประวัติการเข้า-ออกระบบ (แท็บ "การเข้าใช้งานระบบ") ────────────────
window.ADM_ACCESS_LOG_SEED = [
  { id: 'L-100401', ts: '2026-08-04T08:55:01', user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', action: 'login', target: 'เข้าสู่ระบบด้วยรหัสผ่าน', ip: '10.20.4.18', device: 'Windows 11 · Chrome 128', result: 'ok' },
  { id: 'L-100402', ts: '2026-08-04T08:12:44', user: 'สุนิสา ทองแท้', role: 'เจ้าหน้าที่การเงิน', action: 'login', target: 'เข้าสู่ระบบด้วยรหัสผ่าน', ip: '10.20.5.41', device: 'macOS 15 · Safari 18', result: 'ok' },
  { id: 'L-100403', ts: '2026-08-04T07:30:10', user: 'อภิชาติ ศรีสุข', role: 'ผู้จัดการสหกรณ์', action: 'login', target: 'เข้าสู่ระบบด้วยรหัสผ่าน', ip: '10.20.1.7', device: 'Windows 11 · Edge 128', result: 'ok' },
  { id: 'L-100404', ts: '2026-08-03T18:02:15', user: 'มนตรี ศรีสุข', role: 'ผู้ดูแลระบบ', action: 'logout', target: 'ออกจากระบบ', ip: '10.20.4.18', device: 'Windows 11 · Chrome 128', result: 'ok' },
  { id: 'L-100405', ts: '2026-08-03T09:05:52', user: 'สมศักดิ์ การะเกตุ', role: 'เจ้าหน้าที่สินเชื่อ', action: 'login', target: 'เข้าสู่ระบบล้มเหลว — รหัสผ่านไม่ถูกต้อง', ip: '10.20.9.14', device: 'Windows 10 · Chrome 127', result: 'fail' },
  { id: 'L-100406', ts: '2026-08-02T14:05:18', user: 'อรอนงค์ บุญมาก', role: 'ผู้ตรวจสอบภายใน', action: 'login', target: 'เข้าสู่ระบบด้วยรหัสผ่าน', ip: '10.20.6.30', device: 'Windows 11 · Chrome 128', result: 'ok' },
  { id: 'L-100407', ts: '2026-08-02T09:00:00', user: 'วิภา จันทร์เพ็ญ', role: 'เจ้าหน้าที่บัญชี', action: 'login', target: 'เข้าสู่ระบบล้มเหลว — บัญชีถูกล็อก', ip: '10.20.7.55', device: 'Windows 11 · Chrome 128', result: 'fail' },
];

// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก — ยกเลิกการทำรายการ (Deposit · cancel transaction)
// ════════════════════════════════════════════════════════════════════

// วันทำรายการของระบบ (วันที่ประมวลผลปัจจุบัน)
window.DEPOSIT_WORKING_DATE = '2026-06-02';

// รหัสประเภทรายการเงินฝาก — flow: +1 เงินเข้า / -1 เงินออก
window.DEPOSIT_TX_CODES = {
  '01': { label: 'ฝากเงินสด',        flow: +1, pill: 'ok'   },
  '02': { label: 'ถอนเงินสด',        flow: -1, pill: 'bad'  },
  '03': { label: 'โอนเงินเข้า',       flow: +1, pill: 'ok'   },
  '04': { label: 'โอนเงินออก',       flow: -1, pill: 'bad'  },
  '05': { label: 'ฝากหักเงินเดือน',   flow: +1, pill: 'ok'   },
  '11': { label: 'ดอกเบี้ยรับ',       flow: +1, pill: 'info' },
};

// บัญชีผู้มีสิทธิ์อนุมัติการยกเลิกรายการ (ต้องใส่รหัสยืนยันก่อนทำรายการ)
// หมายเหตุ: ข้อมูลสาธิตเท่านั้น — ระบบจริงต้องตรวจสอบสิทธิ์ฝั่งเซิร์ฟเวอร์
window.CANCEL_AUTHORIZERS = [
  { code: '491205', name: 'อภิชาติ ศรีสุข',   role: 'ผู้จัดการสหกรณ์' },
  { code: '770318', name: 'ประเสริฐ วัฒนชัย',  role: 'หัวหน้าฝ่ายการเงิน' },
];

// เหตุผลการยกเลิกรายการ (สำหรับบันทึกประกอบการตรวจสอบ)
window.CANCEL_REASONS = [
  'บันทึกรายการผิดพลาด',
  'ทำรายการซ้ำซ้อน',
  'จำนวนเงินไม่ถูกต้อง',
  'เลือกบัญชีผิด',
  'ยกเลิกตามคำขอของสมาชิก',
  'อื่น ๆ (ระบุเหตุผล)',
];

// ─── ข้อมูลบัญชีเงินฝาก + รายการเคลื่อนไหว (ค้นหาได้ด้วย เลขที่บัญชี / เลขสมาชิก / เลขที่ใบรายการ)
//  cancellable = ยกเลิกได้เฉพาะรายการที่ทำโดยเจ้าหน้าที่ในวันทำรายการเดียวกัน
//  txns เรียงจากใหม่ → เก่า ; balance = ยอดคงเหลือหลังรายการนั้น
window.DEPOSIT_TX_RECORDS = [
  {
    accNo: '001-2-58241-0', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    accType: 'ออมทรัพย์', openDate: '2008-06-01', rate: 1.25,
    balance: 357420.75, withdrawable: 357320.75, accInterest: 18540.30, status: 'ใช้งาน',
    txns: [
      { slip: 'DP6906-044120', code: '01', desc: 'ฝากเงินสด ผ่านเคาน์เตอร์ สาขาสำนักงานใหญ่', amount: 12000.00, by: 'สุนิสา ทองแท้',    date: '2026-06-02', seq: 1184, balance: 357420.75, cancellable: true  },
      { slip: 'WD6906-044051', code: '02', desc: 'ถอนเงินสด ผ่านเคาน์เตอร์ สาขาสำนักงานใหญ่', amount: 5000.00,  by: 'สุนิสา ทองแท้',    date: '2026-06-02', seq: 1183, balance: 345420.75, cancellable: true  },
      { slip: 'TF6906-043880', code: '03', desc: 'โอนเงินเข้าจากบัญชี 002-5-58241-7',          amount: 3000.00,  by: 'ระบบโอนภายใน',    date: '2026-06-01', seq: 1182, balance: 350420.75, cancellable: false },
      { slip: 'IN6905-009210', code: '11', desc: 'ดอกเบี้ยรับ งวดครึ่งปี 1/2569',              amount: 1560.25,  by: 'ระบบอัตโนมัติ',   date: '2026-05-31', seq: 1181, balance: 347420.75, cancellable: false },
      { slip: 'WD6905-038400', code: '02', desc: 'ถอนเงินสด ผ่านตู้ ATM',                     amount: 2000.00,  by: 'สมาชิก (ATM)',    date: '2026-05-20', seq: 1180, balance: 345860.50, cancellable: false },
    ],
  },
  {
    accNo: '002-5-58241-7', memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    accType: 'ออมทรัพย์พิเศษ', openDate: '2015-03-10', rate: 2.75,
    balance: 700000.00, withdrawable: 700000.00, accInterest: 24300.00, status: 'ใช้งาน',
    txns: [
      { slip: 'DP6906-044203', code: '01', desc: 'ฝากเงินสด ผ่านเคาน์เตอร์ สาขาสำนักงานใหญ่', amount: 20000.00, by: 'สุนิสา ทองแท้',  date: '2026-06-02', seq: 842, balance: 700000.00, cancellable: true  },
      { slip: 'IN6905-009305', code: '11', desc: 'ดอกเบี้ยรับ งวดครึ่งปี 1/2569',              amount: 9120.00,  by: 'ระบบอัตโนมัติ', date: '2026-05-31', seq: 841, balance: 680000.00, cancellable: false },
      { slip: 'TF6904-041002', code: '04', desc: 'โอนเงินออกไปบัญชี 001-2-58241-0',           amount: 3000.00,  by: 'สมาชิก (Online)', date: '2026-04-18', seq: 840, balance: 670880.00, cancellable: false },
    ],
  },
  {
    accNo: '005-3-58243-1', memberCode: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์',
    accType: 'ออมทรัพย์', openDate: '2005-09-15', rate: 1.25,
    balance: 128500.00, withdrawable: 128400.00, accInterest: 6210.45, status: 'ใช้งาน',
    txns: [
      { slip: 'WD6906-044502', code: '02', desc: 'ถอนเงินสด ผ่านเคาน์เตอร์ สาขาสำนักงานใหญ่', amount: 8000.00, by: 'ธนพล รักษาทรัพย์', date: '2026-06-02', seq: 559, balance: 128500.00, cancellable: true  },
      { slip: 'DP6905-043006', code: '05', desc: 'ฝากหักเงินเดือน งวด 2569/05',               amount: 4000.00, by: 'ระบบอัตโนมัติ',   date: '2026-05-25', seq: 558, balance: 136500.00, cancellable: false },
      { slip: 'IN6905-009410', code: '11', desc: 'ดอกเบี้ยรับ งวดครึ่งปี 1/2569',              amount: 312.20, by: 'ระบบอัตโนมัติ',   date: '2026-05-31', seq: 557, balance: 132500.00, cancellable: false },
    ],
  },
  {
    accNo: '006-1-58247-9', memberCode: 'M-058247', memberName: 'นายวีรชัย พิทักษ์ธรรม',
    accType: 'ฝากประจำ 12 เดือน', openDate: '2024-01-15', rate: 3.10,
    balance: 500000.00, withdrawable: 0.00, accInterest: 7750.00, status: 'ใช้งาน',
    txns: [
      { slip: 'DP6906-044610', code: '01', desc: 'ฝากเปิดบัญชีฝากประจำ ผ่านเคาน์เตอร์',         amount: 50000.00, by: 'สุนิสา ทองแท้',  date: '2026-06-02', seq: 233, balance: 500000.00, cancellable: true  },
      { slip: 'IN6905-009502', code: '11', desc: 'ดอกเบี้ยรับ งวดครึ่งปี 1/2569',              amount: 7750.00,  by: 'ระบบอัตโนมัติ', date: '2026-05-31', seq: 232, balance: 450000.00, cancellable: false },
    ],
  },
];

// ค้นหาบัญชีจากคีย์: mode = 'account' | 'member' | 'slip'
window.searchDepositRecords = (mode, query) => {
  const q = (query || '').trim().toLowerCase();
  if (!q) return { accounts: [], highlightSlip: null };
  const norm = (s) => String(s).toLowerCase().replace(/[\s-]/g, '');
  const recs = window.DEPOSIT_TX_RECORDS;
  if (mode === 'account') {
    return { accounts: recs.filter(r => norm(r.accNo).includes(norm(q))), highlightSlip: null };
  }
  if (mode === 'member') {
    return { accounts: recs.filter(r => norm(r.memberCode).includes(norm(q))), highlightSlip: null };
  }
  // slip
  let hit = null;
  const matched = recs.filter(r => r.txns.some(tx => {
    const m = norm(tx.slip).includes(norm(q));
    if (m && !hit) hit = tx.slip;
    return m;
  }));
  return { accounts: matched, highlightSlip: hit };
};
