// ═════════════════════════════════════════════════════════════════
//  ข้อมูล — ข้อมูลพื้นฐาน (บัญชีเงินฝาก) · ระบบเงินฝาก
//  เมนูเรียกดูข้อมูลบัญชีเงินฝากของสมาชิก (อ่านอย่างเดียว)
//  ต่อยอดจาก window.DEP_TXN_ACCOUNTS_SEED + ledger + DEP_TXN_MEMBERS
// ═════════════════════════════════════════════════════════════════

// ข้อมูลเสริมรายบัญชี (ส่วนที่ไม่มีใน seed ธุรกรรม)
window.DEP_BASIC_EXTRA = {
  '001-2-58241-0': {
    pb: 'PB-004512', projectCode: '01', projectName: 'ออมทรัพย์ทั่วไป (หักเงินเดือน)',
    acctName: 'นายสมชาย ใจดี', stmLine: 12, lastPrincipal: 342850.50, withdrawCount: 4,
    mapKTB: '982-1-44021-7 (KTB สาขาสำนักงานใหญ่)', mapKTBDate: '2019-03-04', intReceive: 'ทบเข้าบัญชีเงินฝากเดิม (ทุกวันที่ 30 มิ.ย. และ 31 ธ.ค.)',
    withdrawCond: 'ถอนได้ไม่จำกัดจำนวนครั้ง · ต้องคงยอดขั้นต่ำ 100.00 บาท · ถอนผ่านเคาน์เตอร์ต้องแสดงสมุดคู่ฝากทุกครั้ง',
    statusNote: 'บัญชีปกติ ใช้งานได้ · ผูกหักเงินเดือนรายเดือน 2,000.00 บาท · ผูกหัก ฌปท./ฌาปนกิจ',
    carryForward: 300430.10, withdrawable: 342750.50, bookBalance: 342850.50, chequeCollect: 0, intDivAccum: 3120.40,
    lastMovement: '2026-06-10',
    stm: [
      { date: '2026-01-01', desc: 'ยอดยกมา',        ref: '—',            wd: 0,    dp: 0,       bal: 300430.10, div: 0,       by: 'ระบบ' },
      { date: '2026-01-25', desc: 'หักเงินเดือน',    ref: 'PAYROLL-2569/01', wd: 0, dp: 2000,   bal: 302430.10, div: 0,       by: 'ระบบ' },
      { date: '2026-02-25', desc: 'หักเงินเดือน',    ref: 'PAYROLL-2569/02', wd: 0, dp: 2000,   bal: 304430.10, div: 0,       by: 'ระบบ' },
      { date: '2026-03-12', desc: 'ถอนเงินสด',      ref: 'TX-2569-03-0411', wd: 5000, dp: 0,   bal: 299430.10, div: 0,       by: 'จันทร์เพ็ญ มาลี' },
      { date: '2026-03-25', desc: 'หักเงินเดือน',    ref: 'PAYROLL-2569/03', wd: 0, dp: 2000,   bal: 301430.10, div: 0,       by: 'ระบบ' },
      { date: '2026-04-20', desc: 'ฝากปันผล',       ref: 'DIV-2568',        wd: 0, dp: 37300.00, bal: 338730.10, div: 0,      by: 'ระบบ' },
      { date: '2026-04-25', desc: 'หักเงินเดือน',    ref: 'PAYROLL-2569/04', wd: 0, dp: 2000,   bal: 340730.10, div: 0,       by: 'ระบบ' },
      { date: '2026-05-25', desc: 'หักเงินเดือน',    ref: 'PAYROLL-2569/05', wd: 0, dp: 2000,   bal: 342730.10, div: 0,       by: 'ระบบ' },
      { date: '2026-06-10', desc: 'ดอกเบี้ยค้างจ่าย', ref: 'INT-2569-01',   wd: 0, dp: 120.40,  bal: 342850.50, div: 3120.40, by: 'ระบบ' },
    ],
    fixed: [],
    coDep: [
      { ref: '58241', name: 'นายสมชาย ใจดี', rel: 'เจ้าของบัญชี' },
      { ref: '3-1009-00874-21-4', name: 'นางสุนีย์ ใจดี', rel: 'ผู้ฝากร่วม (คู่สมรส)' },
    ],
    sign: [
      { name: 'นายสมชาย ใจดี', role: 'เจ้าของบัญชี', date: '2008-06-01', cond: 'ลงลายมือชื่อคนเดียวได้' },
      { name: 'นางสุนีย์ ใจดี', role: 'ผู้ฝากร่วม', date: '2015-08-14', cond: 'ลงลายมือชื่อคนเดียวได้' },
    ],
  },
  '002-5-58241-7': {
    pb: 'PB-006188', projectCode: '02', projectName: 'ออมทรัพย์พิเศษ 24 เดือน',
    acctName: 'นายสมชาย ใจดี', stmLine: 8, lastPrincipal: 680000.00, withdrawCount: 0,
    mapKTB: '982-1-44021-7 (KTB สาขาสำนักงานใหญ่)', mapKTBDate: '2019-03-04', intReceive: 'โอนดอกเบี้ยเข้าบัญชีออมทรัพย์ 001-2-58241-0 (ทุกสิ้นปี)',
    withdrawCond: 'ถอนได้ปีละ 1 ครั้งโดยไม่เสียค่าธรรมเนียม · ครั้งถัดไปคิดค่าธรรมเนียม 50.00 บาท/ครั้ง · คงยอดขั้นต่ำ 10,000.00 บาท',
    statusNote: 'บัญชีปกติ ใช้งานได้ · ผูกหักเงินเดือนรายเดือน 5,000.00 บาท',
    carryForward: 620000.00, withdrawable: 670000.00, bookBalance: 680000.00, chequeCollect: 0, intDivAccum: 9120.00,
    lastMovement: '2026-05-25',
    stm: [
      { date: '2026-01-01', desc: 'ยอดยกมา',     ref: '—',               wd: 0, dp: 0,     bal: 620000.00, div: 0,      by: 'ระบบ' },
      { date: '2026-02-25', desc: 'หักเงินเดือน', ref: 'PAYROLL-2569/02', wd: 0, dp: 5000, bal: 625000.00, div: 0,      by: 'ระบบ' },
      { date: '2026-03-25', desc: 'หักเงินเดือน', ref: 'PAYROLL-2569/03', wd: 0, dp: 5000, bal: 630000.00, div: 0,      by: 'ระบบ' },
      { date: '2026-04-25', desc: 'หักเงินเดือน', ref: 'PAYROLL-2569/04', wd: 0, dp: 45000, bal: 675000.00, div: 0,     by: 'ระบบ' },
      { date: '2026-05-25', desc: 'หักเงินเดือน', ref: 'PAYROLL-2569/05', wd: 0, dp: 5000, bal: 680000.00, div: 9120.00, by: 'ระบบ' },
    ],
    fixed: [],
    coDep: [{ ref: '58241', name: 'นายสมชาย ใจดี', rel: 'เจ้าของบัญชี' }],
    sign: [{ name: 'นายสมชาย ใจดี', role: 'เจ้าของบัญชี', date: '2015-03-10', cond: 'ลงลายมือชื่อคนเดียวได้' }],
  },
  '003-1-58241-4': {
    pb: 'CERT-2567-0091', projectCode: '03', projectName: 'ฝากประจำ 12 เดือน (ปลอดภาษีบางส่วน)',
    acctName: 'นายสมชาย ใจดี', stmLine: 3, lastPrincipal: 500000.00, withdrawCount: 0,
    mapKTB: '', intReceive: 'จ่ายดอกเบี้ยเมื่อครบกำหนด · หักภาษี ณ ที่จ่าย 15%',
    withdrawCond: 'ถอนก่อนครบกำหนดคิดดอกเบี้ยในอัตราออมทรัพย์และเสียค่าธรรมเนียมปิดบัญชีก่อนกำหนด 200.00 บาท',
    statusNote: 'บัญชีปกติ · ครบกำหนด 15 ม.ค. 2568 (ต่ออายุอัตโนมัติ)',
    carryForward: 500000.00, withdrawable: 0, bookBalance: 500000.00, chequeCollect: 0, intDivAccum: 7750.00,
    lastMovement: '2026-01-15',
    stm: [
      { date: '2026-01-01', desc: 'ยอดยกมา',        ref: '—',           wd: 0, dp: 0,       bal: 500000.00, div: 0,       by: 'ระบบ' },
      { date: '2026-01-15', desc: 'ต่ออายุต้นเงิน',  ref: 'FD-2569-0044', wd: 0, dp: 0,      bal: 500000.00, div: 7750.00, by: 'ประไพ ศรีทอง' },
    ],
    fixed: [
      { no: 1, amount: 300000.00, balance: 300000.00, startDate: '2024-01-15', dueDate: '2025-01-15', lastTxn: '2026-01-15', intAccrued: 4650.00, intPaid: 0, tax: 697.50 },
      { no: 2, amount: 200000.00, balance: 200000.00, startDate: '2024-01-15', dueDate: '2025-01-15', lastTxn: '2026-01-15', intAccrued: 3100.00, intPaid: 0, tax: 465.00 },
    ],
    coDep: [{ ref: '58241', name: 'นายสมชาย ใจดี', rel: 'เจ้าของบัญชี' }],
    sign: [{ name: 'นายสมชาย ใจดี', role: 'เจ้าของบัญชี', date: '2024-01-15', cond: 'ลงลายมือชื่อคนเดียวได้' }],
  },
  '002-5-60112-3': {
    pb: 'PB-007204', projectCode: '02', projectName: 'ออมทรัพย์พิเศษ 24 เดือน',
    acctName: 'นางวิภาวดี รังสิต', stmLine: 6, lastPrincipal: 158200.00, withdrawCount: 1,
    mapKTB: '020-6-71188-2 (ธ.ออมสิน สาขาเมือง)', mapKTBDate: '2021-11-18', intReceive: 'ทบเข้าบัญชีเงินฝากเดิม (ทุกสิ้นปี)',
    withdrawCond: 'ถอนได้ปีละ 1 ครั้งโดยไม่เสียค่าธรรมเนียม · ใช้สิทธิ์ครบแล้วในปีนี้ · ครั้งถัดไปคิดค่าธรรมเนียม 50.00 บาท/ครั้ง',
    statusNote: 'บัญชีปกติ ใช้งานได้ · ผูกหักเงินเดือน 3,000.00 บาท ถึงงวด 2569/12 · ผูกหัก ฌปท./ฌาปนกิจ',
    carryForward: 140200.00, withdrawable: 148200.00, bookBalance: 158200.00, chequeCollect: 0, intDivAccum: 2410.00,
    lastMovement: '2026-05-25',
    stm: [
      { date: '2026-01-01', desc: 'ยอดยกมา',       ref: '—',               wd: 0,     dp: 0,    bal: 140200.00, div: 0,       by: 'ระบบ' },
      { date: '2026-02-25', desc: 'หักเงินเดือน',   ref: 'PAYROLL-2569/02', wd: 0,     dp: 3000, bal: 143200.00, div: 0,       by: 'ระบบ' },
      { date: '2026-03-18', desc: 'ถอนเงินสด',     ref: 'TX-2569-03-0502',  wd: 10000, dp: 0,    bal: 133200.00, div: 0,       by: 'จันทร์เพ็ญ มาลี' },
      { date: '2026-04-25', desc: 'หักเงินเดือน',   ref: 'PAYROLL-2569/04', wd: 0,     dp: 22000, bal: 155200.00, div: 0,      by: 'ระบบ' },
      { date: '2026-05-25', desc: 'หักเงินเดือน',   ref: 'PAYROLL-2569/05', wd: 0,     dp: 3000, bal: 158200.00, div: 2410.00, by: 'ระบบ' },
    ],
    fixed: [],
    coDep: [
      { ref: '60112', name: 'นางวิภาวดี รังสิต', rel: 'เจ้าของบัญชี' },
      { ref: '1-1005-00311-05-2', name: 'นายกิตติ รังสิต', rel: 'ผู้ฝากร่วม (คู่สมรส)' },
    ],
    sign: [
      { name: 'นางวิภาวดี รังสิต', role: 'เจ้าของบัญชี', date: '2018-07-20', cond: 'ลงลายมือชื่อร่วมกัน 2 คน' },
      { name: 'นายกิตติ รังสิต', role: 'ผู้ฝากร่วม', date: '2018-07-20', cond: 'ลงลายมือชื่อร่วมกัน 2 คน' },
    ],
  },
  '001-2-57003-9': {
    pb: 'PB-004980', projectCode: '01', projectName: 'ออมทรัพย์ทั่วไป',
    acctName: 'นายธีรพงษ์ มากมี', stmLine: 5, lastPrincipal: 89400.25, withdrawCount: 7,
    mapKTB: '044-2-90017-5 (ธ.กสิกรไทย — รอยืนยันการผูกบัญชี)', intReceive: 'ทบเข้าบัญชีเงินฝากเดิม (ทุกวันที่ 30 มิ.ย. และ 31 ธ.ค.)',
    withdrawCond: 'ถอนได้ไม่จำกัดจำนวนครั้ง · ต้องคงยอดขั้นต่ำ 100.00 บาท',
    statusNote: 'บัญชีปกติ ใช้งานได้ · ยังไม่ผูกหักเงินเดือน · การผูกบัญชีธนาคารอยู่ระหว่างรอยืนยัน',
    carryForward: 84200.15, withdrawable: 89300.25, bookBalance: 89400.25, chequeCollect: 0, intDivAccum: 740.10,
    lastMovement: '2026-06-02',
    stm: [
      { date: '2026-01-01', desc: 'ยอดยกมา',    ref: '—',              wd: 0,    dp: 0,    bal: 84200.15, div: 0,      by: 'ระบบ' },
      { date: '2026-03-04', desc: 'ฝากเงินสด',  ref: 'TX-2569-03-0288', wd: 0,    dp: 8000, bal: 92200.15, div: 0,      by: 'ประไพ ศรีทอง' },
      { date: '2026-06-02', desc: 'ถอนเงินสด',  ref: 'TX-2569-06-0731', wd: 2799.90, dp: 0, bal: 89400.25, div: 740.10, by: 'จันทร์เพ็ญ มาลี' },
    ],
    fixed: [],
    coDep: [{ ref: '57003', name: 'นายธีรพงษ์ มากมี', rel: 'เจ้าของบัญชี' }],
    sign: [{ name: 'นายธีรพงษ์ มากมี', role: 'เจ้าของบัญชี', date: '2009-02-11', cond: 'ลงลายมือชื่อคนเดียวได้' }],
  },
  '004-9-61580-1': {
    pb: 'PB-005771', projectCode: '01', projectName: 'ออมทรัพย์ทั่วไป',
    acctName: 'นางสาวปาริชาติ สุขสวัสดิ์', stmLine: 2, lastPrincipal: 12050.00, withdrawCount: 2,
    mapKTB: '', intReceive: 'ทบเข้าบัญชีเงินฝากเดิม (ทุกวันที่ 30 มิ.ย. และ 31 ธ.ค.)',
    withdrawCond: 'ถอนได้ไม่จำกัดจำนวนครั้ง · สมาชิกลาออกแล้ว — ต้องปิดบัญชีภายใน 90 วันนับจากวันลาออก',
    statusNote: 'สมาชิกลาออก · รอปิดบัญชีและจ่ายคืนเงินฝาก',
    carryForward: 12050.00, withdrawable: 12050.00, bookBalance: 12050.00, chequeCollect: 0, intDivAccum: 0,
    lastMovement: '2025-12-31',
    stm: [{ date: '2026-01-01', desc: 'ยอดยกมา', ref: '—', wd: 0, dp: 0, bal: 12050.00, div: 0, by: 'ระบบ' }],
    fixed: [],
    coDep: [{ ref: '61580', name: 'นางสาวปาริชาติ สุขสวัสดิ์', rel: 'เจ้าของบัญชี' }],
    sign: [{ name: 'นางสาวปาริชาติ สุขสวัสดิ์', role: 'เจ้าของบัญชี', date: '2016-05-05', cond: 'ลงลายมือชื่อคนเดียวได้' }],
  },
};

// รวมข้อมูลบัญชี + ข้อมูลเสริม + สมาชิก + รายการ ledger จริง (ถ้ามี)
window.depBasicAccounts = function () {
  const accs = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : (window.DEP_TXN_ACCOUNTS_SEED || []));
  const mems = window.DEP_TXN_MEMBERS || [];
  return accs.map(a => {
    const x = window.DEP_BASIC_EXTRA[a.accNo] || {};
    const m = mems.find(mm => mm.code === a.member) || {};
    return {
      ...a,
      pb: x.pb || '—',
      projectCode: x.projectCode || '—',
      projectName: x.projectName || a.type,
      acctName: x.acctName || a.name,
      citizenId: m.citizenId || '—',
      deptCode: m.deptCode || '',
      stmLine: x.stmLine || 0,
      lastPrincipal: x.lastPrincipal != null ? x.lastPrincipal : a.balance,
      withdrawCount: x.withdrawCount || 0,
      mapKTB: x.mapKTB || '',
      intReceive: x.intReceive || '—',
      withdrawCond: x.withdrawCond || '—',
      statusNote: x.statusNote || '—',
      carryForward: x.carryForward != null ? x.carryForward : a.balance,
      withdrawable: x.withdrawable != null ? x.withdrawable : a.balance,
      bookBalance: x.bookBalance != null ? x.bookBalance : a.balance,
      chequeCollect: x.chequeCollect || 0,
      intDivAccum: x.intDivAccum != null ? x.intDivAccum : (a.ytdInterest || 0),
      mapKTBDate: x.mapKTBDate || '',
      lastMovement: x.lastMovement || a.openDate,
      fixed: x.fixed || [],
      coDep: x.coDep || [],
      sign: x.sign || [],
      _stmSeed: x.stm || [],
    };
  });
};

// Statement = รายการ seed + รายการที่บันทึกจริงจาก ledger (localStorage)
window.depBasicStatement = function (acc) {
  const seed = (acc._stmSeed || []).map((r, i) => ({ ...r, seq: i + 1 }));
  const live = (window.depTxnLoadLedger ? window.depTxnLoadLedger() : [])
    .filter(l => l.accNo === acc.accNo)
    .slice().reverse()
    .map((l, i) => ({
      seq: seed.length + i + 1, date: l.date,
      desc: l.type === 'withdraw' ? 'ถอนเงิน' : l.type === 'deposit' ? 'รับฝากเงิน' : (l.type || 'รายการ'),
      ref: l.ref || l.id || '—',
      wd: l.type === 'withdraw' ? l.amount : 0,
      dp: l.type === 'withdraw' ? 0 : l.amount,
      bal: l.balance, div: 0, by: l.by || 'ระบบ',
    }));
  return seed.concat(live);
};

window.DEP_BASIC_STATUS = {
  active: { l: 'ใช้งาน', pill: 'ok' },
  frozen: { l: 'อายัด', pill: 'bad' },
  closed: { l: 'ปิดบัญชี', pill: 'neutral' },
};
