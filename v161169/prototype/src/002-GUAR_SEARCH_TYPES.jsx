// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ตรวจสอบสิทธิค้ำ
//  ข้อมูลสาธิตสำหรับการค้นหาสิทธิค้ำของสมาชิก 4 ประเภท:
//  คนค้ำประกัน · หุ้นค้ำประกัน · เงินฝากค้ำประกัน · หลักทรัพย์ค้ำประกัน
// ════════════════════════════════════════════════════════════════════

// ประเภทการค้นหาสิทธิค้ำ
window.GUAR_SEARCH_TYPES = [
  { code: '01', id: 'person',   label: 'คนค้ำประกัน' },
  { code: '02', id: 'share',    label: 'หุ้นค้ำประกัน' },
  { code: '03', id: 'deposit',  label: 'เงินฝากค้ำประกัน' },
  { code: '04', id: 'security', label: 'หลักทรัพย์ค้ำประกัน' },
];

// ประเภทหลักทรัพย์ (6 ประเภท)
window.SECURITY_TYPES = ['โฉนด', 'นส.3', 'นส.3 ก', 'โฉนดตราจอง', 'ห้องชุด', 'สิ่งปลูกสร้าง'];

// ─── ข้อมูลสมาชิก + สิทธิค้ำ (ค้นหาด้วยเลขที่สมาชิก) ──────────────────
window.GUAR_MEMBERS = [
  {
    code: 'M-058241',
    maritalStatus: 'สมรส', spouse: 'นางสุนีย์ ใจดี',
    title: 'นาย', firstName: 'สมชาย', lastName: 'ใจดี รักษ์ออม',
    name: 'นายสมชาย ใจดี รักษ์ออม',
    memberType: 'สมาชิกปกติ',
    department: 'กองคลัง สำนักงานปลัด',
    unit: '0801 · กลุ่มงานบัญชีและงบประมาณ',
    citizenId: '3-1019-00821-45-3',
    birthDate: '1981-03-14',
    retireDate: '2041-09-30',
    joinDate: '2008-06-01',
    workStartDate: '2006-05-01',
    salary: 48750,

    // หุ้น
    share: {
      shareName: 'หุ้นสะสมรายเดือน',
      broughtForward: 540000,
      capital: 789000,
      perMonthShares: 25,
      perMonthValue: 2500,
      sendType: 'ส่งปกติ',
      status: 'ปกติ',
      groups: [
        { group: 'กลุ่ม ก — ข้าราชการประจำ', right: 'ค้ำได้สูงสุด 2 สัญญา' },
        { group: 'กลุ่มสวัสดิการเงินกู้สามัญ', right: 'ค้ำได้อีก 1 สัญญา' },
      ],
    },

    // เงินฝาก
    deposit: {
      accNo: '001-2-58241-0',
      accType: 'ออมทรัพย์',
      registryRef: 'REG-2551-58241',
      openDate: '2008-06-01',
      broughtForward: 318420.10,
      balance: 342850.50,
      withdrawable: 342750.50,
      frozen: 100.00,
    },

    // หลักทรัพย์
    security: {
      no: 'LP-58241-01',
      type: 'โฉนดที่ดินพร้อมสิ่งปลูกสร้าง',
      landPrice: 2400000,
      housePrice: 1800000,
      appraisalPrice: 4200000,
      guarPercent: 80,        // % ที่ใช้ค้ำได้ (อ้างอิงค่าคงที่ — มูลค่าหลักประกัน 04)
      guarUsed: 200000,       // วงเงินค้ำที่ใช้ไปแล้ว
      mortgaged: 'จดจำนองแล้ว',
      mortgageDate: '2022-03-15',
      redeemDate: null,
      items: [
        { code: 'TD-110248', type: 'โฉนด' },
        { code: 'BD-220471', type: 'สิ่งปลูกสร้าง' },
      ],
    },

    // รายการหลักทรัพย์ค้ำประกัน (มีหลายรายการ — อ้างอิง Tab ข้อมูลหลักทรัพย์ ของรายละเอียดสมาชิก)
    //  แต่ละรายการค้ำได้หลายสัญญา — ถ้ามีมูลค่าคงเหลือนำไปค้ำสัญญาอื่นได้อีก
    securities: [
      { code: 'SEC-58241-01', name: 'โฉนดที่ดินเลขที่ 28456 ต.บางกระสอ', type: 'โฉนด',
        address: 'เลขที่ดิน 142 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000', appraisal: 2850000, guarPercent: 80,
        contracts: [
          { contractNo: 'L-2019-0214', amount: 200000 },
          { contractNo: 'L-2023-0148', amount: 400000 },
        ] },
      { code: 'SEC-58241-02', name: 'ห้องชุดอาคารชุดสุขสบาย ชั้น 8 ห้อง 802', type: 'ห้องชุด',
        address: 'เลขที่ 88/802 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กทม. 10900', appraisal: 1650000, guarPercent: 80,
        contracts: [
          { contractNo: 'L-2023-0148', amount: 226550 },
        ] },
      { code: 'SEC-58241-03', name: 'สิ่งปลูกสร้าง บ้านเดี่ยว 2 ชั้น', type: 'สิ่งปลูกสร้าง',
        address: '128/45 หมู่ 3 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กทม. 10900', appraisal: 1200000, guarPercent: 100,
        contracts: [] },
    ],

    // สมาชิกอื่นค้ำให้ (ใครค้ำให้สมาชิกรายนี้)
    othersGuaranteeMe: [
      { contractNo: 'L-2023-0148', guarNo: 'GR-019120', collateralDetail: 'นายอนุชา สุขสวัสดิ์ (M-058243)',   remaining: 612500, percent: 50,  amount: 400000 },
      { contractNo: 'L-2023-0148', guarNo: 'GR-019121', collateralDetail: 'นางสาวกานต์ ศิริวงศ์ (M-058242)',  remaining: 612500, percent: 50,  amount: 400000 },
      { contractNo: 'L-2019-0214', guarNo: 'GR-009844', collateralDetail: 'หลักทรัพย์ค้ำ — โฉนด จ.นนทบุรี',     remaining: 56550,  percent: 100, amount: 200000 },
    ],

    // ค้ำให้สมาชิกอื่น (สมาชิกรายนี้ค้ำให้ใคร)
    guaranteeOthers: [
      { contractNo: 'L-2024-0518', name: 'นายอนุชา สุขสวัสดิ์',  loanRemaining: 420000 },
      { contractNo: 'L-2023-0291', name: 'นางสาวกานต์ ศิริวงศ์', loanRemaining: 187500 },
      { contractNo: 'L-2021-0078', name: 'นายธีรพงษ์ ขำเพชร',    loanRemaining: 142000 },
    ],

    // ค้ำให้สมาชิกอื่นยังไม่อนุมัติ
    guaranteeOthersPending: [
      { reqNo: 'REQ-2569-0421', loanType: 'กู้สามัญ',  name: 'นางวิภา จันทร์เพ็ญ', amount: 300000 },
      { reqNo: 'REQ-2569-0455', loanType: 'กู้ฉุกเฉิน', name: 'นายสุรชัย วงศ์ประเสริฐ', amount: 40000 },
    ],

    // สิทธิค้ำที่ใช้ไปแล้ว แยกตามรหัสประเภทเงินกู้ (ค้ำแล้ว / รออนุมัติ)
    guaranteeUsage:        { '20': 1, '50': 0 },
    guaranteePendingUsage: { '20': 1 },
  },

  {
    code: 'M-058243',
    maritalStatus: 'สมรส', spouse: 'นางวราภรณ์ สุขสวัสดิ์',
    title: 'นาย', firstName: 'อนุชา', lastName: 'สุขสวัสดิ์',
    name: 'นายอนุชา สุขสวัสดิ์',
    memberType: 'สมาชิกปกติ',
    department: 'กองช่าง',
    unit: '0301 · กลุ่มงานโยธา',
    citizenId: '3-1018-00112-87-4',
    birthDate: '1976-08-22',
    retireDate: '2036-09-30',
    joinDate: '2005-09-15',
    workStartDate: '2003-06-01',
    salary: 52400,

    share: {
      shareName: 'หุ้นสะสมรายเดือน',
      broughtForward: 1080000,
      capital: 1240000,
      perMonthShares: 40,
      perMonthValue: 4000,
      sendType: 'ส่งปกติ',
      status: 'ปกติ',
      groups: [
        { group: 'กลุ่ม ก — ข้าราชการประจำ', right: 'ค้ำได้สูงสุด 2 สัญญา' },
      ],
    },

    deposit: {
      accNo: '005-3-58243-1',
      accType: 'ออมทรัพย์พิเศษ',
      registryRef: 'REG-2548-58243',
      openDate: '2005-09-15',
      broughtForward: 110200.00,
      balance: 128500.00,
      withdrawable: 128400.00,
      frozen: 100.00,
    },

    security: {
      no: 'LP-58243-01',
      type: 'ที่ดินเปล่า',
      landPrice: 1650000,
      housePrice: 0,
      appraisalPrice: 1650000,
      guarPercent: 80,
      guarUsed: 0,
      mortgaged: 'จดจำนองแล้ว',
      mortgageDate: '2020-11-04',
      redeemDate: null,
      items: [
        { code: 'TD-330912', type: 'นส.3 ก' },
      ],
    },

    securities: [
      { code: 'SEC-58243-01', name: 'ที่ดินเปล่า ต.บางรักใหญ่', type: 'นส.3 ก',
        address: 'หมู่ 5 ต.บางรักใหญ่ อ.บางบัวทอง จ.นนทบุรี 11110', appraisal: 1650000, guarPercent: 80,
        contracts: [] },
    ],

    othersGuaranteeMe: [
      { contractNo: 'L-2024-0518', guarNo: 'GR-024218', collateralDetail: 'นายสมชาย ใจดี รักษ์ออม (M-058241)', remaining: 420000, percent: 50,  amount: 250000 },
      { contractNo: 'L-2024-0518', guarNo: 'GR-024219', collateralDetail: 'นางอรอนงค์ บุญมาก (M-058250)',      remaining: 420000, percent: 50,  amount: 250000 },
    ],

    guaranteeOthers: [
      { contractNo: 'L-2023-0148', name: 'นายสมชาย ใจดี รักษ์ออม', loanRemaining: 612500 },
    ],

    guaranteeOthersPending: [
      { reqNo: 'REQ-2569-0488', loanType: 'กู้พิเศษ', name: 'นายภาคภูมิ รัตนา', amount: 500000 },
    ],

    guaranteeUsage:        { '20': 1, '50': 0 },
    guaranteePendingUsage: {},
  },

  {
    code: 'M-058246',
    maritalStatus: 'โสด', spouse: '',
    title: 'นางสาว', firstName: 'พรพิมล', lastName: 'ทองคำ',
    name: 'นางสาวพรพิมล ทองคำ',
    memberType: 'สมาชิกสมทบ (พนักงาน)',
    department: 'กองสาธารณสุข',
    unit: '0601 · กลุ่มงานบริการ',
    citizenId: '3-1018-00928-44-1',
    birthDate: '1985-07-09',
    retireDate: '2045-09-30',
    joinDate: '2023-08-01',
    workStartDate: '2021-04-12',
    salary: 21800,

    share: {
      shareName: 'หุ้นสะสมรายเดือน',
      broughtForward: 12000,
      capital: 25000,
      perMonthShares: 5,
      perMonthValue: 500,
      sendType: 'ส่งปกติ',
      status: 'ปกติ',
      groups: [
        { group: 'กลุ่มสมาชิกสมทบ', right: 'ค้ำได้เฉพาะหุ้น/เงินฝากของตนเอง' },
      ],
    },

    deposit: {
      accNo: '008-7-58246-3',
      accType: 'ออมทรัพย์',
      registryRef: 'REG-2566-58246',
      openDate: '2023-08-01',
      broughtForward: 8200.00,
      balance: 24500.00,
      withdrawable: 24500.00,
      frozen: 0.00,
    },

    security: {
      no: '—',
      type: 'ไม่มีหลักทรัพย์ค้ำประกัน',
      landPrice: 0,
      housePrice: 0,
      appraisalPrice: 0,
      guarPercent: 80,
      guarUsed: 0,
      mortgaged: 'ยังไม่จดจำนอง',
      mortgageDate: null,
      redeemDate: null,
      items: [],
    },

    securities: [],

    othersGuaranteeMe: [],
    guaranteeOthers: [],
    guaranteeOthersPending: [],
    guaranteeUsage:        { '50': 0 },
    guaranteePendingUsage: {},
  },
];

// ─── ค้นหาสมาชิกสำหรับ popup (ทะเบียน/ชื่อ/นามสกุล/บัตรประชาชน/หน่วย) ──
window.searchGuarMembers = (criteria) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const c = {
    code: norm(criteria.code),
    firstName: (criteria.firstName || '').trim().toLowerCase(),
    lastName: (criteria.lastName || '').trim().toLowerCase(),
    citizenId: norm(criteria.citizenId),
    unit: (criteria.unit || '').trim().toLowerCase(),
  };
  const any = Object.values(c).some(Boolean);
  return window.GUAR_MEMBERS.filter((m) => {
    if (c.code && !norm(m.code).includes(c.code)) return false;
    if (c.firstName && !m.firstName.toLowerCase().includes(c.firstName)) return false;
    if (c.lastName && !m.lastName.toLowerCase().includes(c.lastName)) return false;
    if (c.citizenId && !norm(m.citizenId).includes(c.citizenId)) return false;
    if (c.unit && !(m.unit.toLowerCase().includes(c.unit) || m.department.toLowerCase().includes(c.unit))) return false;
    return any; // ไม่กรอกอะไรเลย = แสดงทั้งหมด
  });
};

// จำนวนเดือนทั้งหมดระหว่างสอง ISO date (ปัดตามวันที่)
window.totalMonths = (fromIso, toIso) => {
  const a = new Date(fromIso), b = new Date(toIso || new Date().toISOString().slice(0, 10));
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months--;
  return Math.max(0, months);
};

// ─── สิทธิการค้ำของบุคคล แยกตามประเภทเงินกู้ ─────────────────────────
//  อ้างอิงค่าคงที่ประเภทเงินกู้ (window.LP_SEED):
//   • settings.allowPersonGuar  — ผลิตภัณฑ์อนุญาตให้ใช้บุคคลค้ำ
//   • settings.maxGuarPerPerson — จำนวนสัญญาสูงสุดที่ 1 คนค้ำได้
//   • settings.eligibleMemberTypes — ประเภทสมาชิกที่กู้/ค้ำผลิตภัณฑ์นี้ได้
//  หักด้วยจำนวนที่สมาชิกค้ำไปแล้ว (guaranteeUsage) + รออนุมัติ (guaranteePendingUsage)
window.GUAR_MEMBER_TYPE_ELIG = {
  'สมาชิกปกติ': 'regular',
  'สมาชิกสมทบ (พนักงาน)': 'associate-staff',
  'สมาชิกสมทบ (เครือญาติ)': 'associate-kin',
};
window.guarPersonRights = (member) => {
  const eligCode = window.GUAR_MEMBER_TYPE_ELIG[member.memberType] || 'regular';
  const usage = member.guaranteeUsage || {};
  const pending = member.guaranteePendingUsage || {};
  return (window.LP_SEED || [])
    .filter((p) => p.enabled && p.settings && p.settings.allowPersonGuar)
    .map((p) => {
      const max = Number(p.settings.maxGuarPerPerson || 0);
      const used = Number(usage[p.code] || 0);
      const pend = Number(pending[p.code] || 0);
      const eligible = (p.settings.eligibleMemberTypes || []).includes(eligCode);
      const remaining = eligible ? Math.max(0, max - used - pend) : 0;
      return { code: p.code, name: p.name, abbr: p.abbr, group: p.group, max, used, pending: pend, remaining, eligible };
    });
};
