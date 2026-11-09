// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก — ค่าคงที่ประเภทบัญชีเงินฝาก (โมเดลเต็ม 6 แท็บ)
//  ต่อยอดจาก window.DEP_ACCTYPE_SEED (data-deposit-config.js) โดย "ไม่ทำลาย"
//  กลุ่มค่าเดิม (cond / interest / withdraw / passbook / gl / control) ที่
//  หน้าจอทำรายการฝาก-ถอน-ปิดบัญชี-ค่าธรรมเนียม ยังอ่านอยู่
//
//  โครงสร้างที่เพิ่ม:
//   • record.settings  — ค่าตั้งแบบแบน ครอบคลุมทุกฟิลด์ในสเปก (ทุกแท็บ)
//   • record.rateTiers      — ตารางกำหนดอัตรา Int./Div. (แท็บ 5)
//   • record.earlyWithdraw  — ตารางเงื่อนไขถอนก่อนกำหนด (แท็บ 6)
//   • record.dividendDates  — ตารางวันที่จ่าย Int./Div. ตามยอดคงเหลือ
//   • record.history        — ประวัติการเพิ่ม/แก้ไข
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก Dropdown ทุกชุด ────────────────────────────────────────
window.DAT_OPTS = {
  // ── ข้อมูลหลัก ──
  personType: [
    { v: 'all',      l: 'ทุกประเภทบุคคล' },
    { v: 'regular',  l: 'สมาชิกสามัญ' },
    { v: 'assoc',    l: 'สมาชิกสมทบ' },
    { v: 'juristic', l: 'นิติบุคคล' },
    { v: 'nonmember',l: 'บุคคลทั่วไป (ไม่เป็นสมาชิก)' },
  ],
  depGroup: [
    { v: 'saving',   l: 'ออมทรัพย์' },
    { v: 'fixed',    l: 'ประจำ' },
    { v: 'current',  l: 'กระแสรายวัน' },
    { v: 'special',  l: 'ออมทรัพย์พิเศษ' },
    { v: 'internal', l: 'บัญชีพักภายใน' },
  ],
  accGroupACC: [
    { v: 'DEP-SAV',  l: 'DEP-SAV — เงินรับฝากออมทรัพย์' },
    { v: 'DEP-FIX',  l: 'DEP-FIX — เงินรับฝากประจำ' },
    { v: 'DEP-CUR',  l: 'DEP-CUR — เงินรับฝากกระแสรายวัน' },
    { v: 'DEP-INT',  l: 'DEP-INT — บัญชีพักภายในเงินฝาก' },
  ],
  accountOpenRule: [
    { v: 'one',      l: 'เปิดได้คนละ 1 บัญชี' },
    { v: 'many',     l: 'เปิดได้หลายบัญชี' },
    { v: 'reopen',   l: 'เปิดใหม่ได้เมื่อปิดบัญชีเดิม' },
  ],
  openCond: [
    { v: 'allow',    l: 'อนุญาตให้เปิดบัญชี' },
    { v: 'deny',     l: 'ไม่อนุญาตให้เปิด (ระบบสร้างให้เท่านั้น)' },
    { v: 'cond',     l: 'เปิดได้เฉพาะบางกรณี' },
  ],
  compareBase: [
    { v: 'total',    l: 'ยอดคงเหลือรวมทุกบัญชี' },
    { v: 'account',  l: 'ยอดคงเหลือบัญชีนี้' },
    { v: 'depSum',   l: 'ยอดเงินฝากรวม' },
  ],
  timeUnit: [
    { v: 'day',      l: 'วัน' },
    { v: 'month',    l: 'เดือน' },
    { v: 'year',     l: 'ปี' },
  ],
  penaltyBase: [
    { v: 'withdrawn',l: 'ยอดที่ถอน' },
    { v: 'balance',  l: 'ยอดคงเหลือ' },
    { v: 'flat',     l: 'จำนวนเงินคงที่' },
  ],
  overWdBaseOpts: [
    { v: 'withdrawn',l: 'ยอดที่ถอน' },
    { v: 'balance',  l: 'ยอดคงเหลือ' },
  ],
  passbookHold: [
    { v: 'book',     l: 'สมุดคู่ฝาก' },
    { v: 'nobook',   l: 'ไม่มีสมุด (No Book)' },
    { v: 'card',     l: 'บัตร ATM/สมาชิก' },
  ],
  // ── จ่าย Int./Div. / ค่ารักษาบัญชี ──
  depAgeRef: [
    { v: 'principal',l: 'วันที่ต้นเงินฝาก' },
    { v: 'open',     l: 'วันที่เปิดบัญชี' },
    { v: 'firstdep', l: 'วันที่ฝากครั้งแรก' },
  ],
  taxRateMode: [
    { v: 'byterm',   l: 'ระบุตามช่วงเวลาฝาก' },
    { v: 'fixed',    l: 'อัตราคงที่' },
    { v: 'exempt',   l: 'ยกเว้นภาษี' },
  ],
  taxCalcMethod: [
    { v: 'full',     l: 'คิดช่วงเต็ม' },
    { v: 'actual',   l: 'คิดตามจริง' },
  ],
  intGiveRef: [
    { v: 'fixed',    l: 'คงที่ตามยอดเงิน' },
    { v: 'tier',     l: 'ตามอัตราขั้นบันได' },
  ],
  compoundWhen: [
    { v: 'none',     l: 'ไม่ทบต้น (จ่ายออก)' },
    { v: 'maturity', l: 'ทบเมื่อครบกำหนด' },
    { v: 'eachpay',  l: 'ทบทุกงวดจ่าย' },
  ],
  intCalcMethod: [
    { v: 'month',    l: 'เป็นเดือน' },
    { v: 'day',      l: 'เป็นวัน' },
    { v: 'period',   l: 'ตามงวด' },
  ],
  feeUnit: [
    { v: 'day',      l: 'วัน' },
    { v: 'month',    l: 'เดือน' },
    { v: 'year',     l: 'ปี' },
  ],
  // ── การคิด Int./Div. ──
  intReceiveMode: [
    { v: 'compound', l: 'ทบต้น' },
    { v: 'toaccount',l: 'โอนเข้าบัญชี' },
    { v: 'tobank',   l: 'โอนเข้าบัญชีธนาคาร' },
  ],
  earlyPayMode: [
    { v: 'deposited',l: 'จากจำนวนเงินที่ฝาก' },
    { v: 'withdrawn',l: 'จากจำนวนเงินที่ถอน' },
  ],
  principalDateMode: [
    { v: 'reset',    l: 'เริ่มใหม่' },
    { v: 'keep',     l: 'คงเดิม' },
  ],
  intCalcFrom: [
    { v: 'statement',l: 'S: Statement' },
    { v: 'principal',l: 'P: ต้นเงิน' },
  ],
  intCalcBase: [
    { v: 'balance',      l: 'จากยอดคงเหลือ' },
    { v: 'balanceTrunc', l: 'จากยอดคงเหลือปัดเศษทิ้ง' },
    { v: 'txn',          l: 'จากยอดทำรายการ' },
  ],
  earlyIntCalc: [
    { v: 'announced', l: 'ตามประกาศที่กำหนด' },
    { v: 'fixedAtDep',l: 'คงที่ตามกำหนด ณ วันฝาก' },
    { v: 'fixedAtWd', l: 'คงที่ตามกำหนด ณ วันถอน' },
  ],
  accrueMethod: [
    { v: 'daily',    l: 'รายวัน' },
    { v: 'monthly',  l: 'รายเดือน' },
    { v: 'fixed',    l: 'ประจำ' },
  ],
  backdateUnit: [
    { v: 'calendar', l: 'วันปฏิทิน' },
    { v: 'workday',  l: 'วันทำการ' },
  ],
  periodicSendMode: [
    { v: 'period',   l: 'ส่งเงินฝากเป็นงวด' },
    { v: 'none',     l: 'ไม่ส่งเงินฝากเป็นงวด' },
  ],
  periodicAmtMode: [
    { v: 'equal',    l: 'เท่ากันทุกงวด' },
    { v: 'unequal',  l: 'ไม่เท่ากันทุกงวด' },
  ],
  exhaustAction: [
    { v: 'keep',     l: 'คงบัญชีไว้' },
    { v: 'transfer', l: 'โอนไปบัญชีปลายทาง' },
    { v: 'close',    l: 'ปิดบัญชี' },
  ],
  recallMode: [
    { v: 'no',       l: 'ไม่มีการเรียกคืน' },
    { v: 'yes',      l: 'มีการเรียกคืน' },
  ],
  // ── ถอนก่อนกำหนด ──
  earlyIntCond: [
    { v: 'none',     l: 'ไม่ได้ Int./Div.' },
    { v: 'get',      l: 'ได้ Int./Div.' },
  ],
  earlyRateMode: [
    { v: 'bytype',   l: 'กำหนดตามประเภทอ้างอิง' },
    { v: 'fixed',    l: 'อัตราคงที่' },
  ],
  earlyRateType: [
    { v: '-',        l: '— ไม่ใช้ —' },
    { v: 'saving',   l: 'เงินฝากออมทรัพย์' },
    { v: 'fixed',    l: 'เงินฝากประจำ' },
    { v: 'special',  l: 'ออมทรัพย์พิเศษ' },
  ],
  rateTable: [
    { v: '-',        l: '— ไม่อ้างอิง —' },
    { v: 'SAV',      l: 'ตารางออมทรัพย์' },
    { v: 'SAVP',     l: 'ตารางออมทรัพย์พิเศษ' },
    { v: 'FIX',      l: 'ตารางฝากประจำ' },
  ],
};

// แปลงค่า → label
window.datLabel = (group, value) => {
  const o = (window.DAT_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value == null || value === '' ? '—' : String(value));
};

// ─── ค่าตั้งต้นแบบแบน (ครอบคลุมทุกแท็บ) ──────────────────────────────
// ─── ตัวนับเลขที่บัญชี (ตัวอย่าง — ระบบจริงเก็บในฐานข้อมูล ตั้งโดยฝ่าย IT) ───
window.DEP_ACC_COUNTERS = {
  DPACCDOCNO10: { name: 'ออมทรัพย์',      last: 125, digits: 7, updated: '2026-11-04T14:20' },
  DPACCDOCNO11: { name: 'ออมทรัพย์พิเศษ', last: 48,  digits: 7, updated: '2026-11-01T09:05' },
  DPACCDOCNO12: { name: 'ฝากประจำ',       last: 310, digits: 7, updated: '2026-11-03T10:42' },
};
window.DAT_SETTINGS_DEFAULTS = {
  // ข้อมูลหลัก
  personType: 'all', docNo: '', depGroup: 'saving', abbr: '',
  glCode: '', glPair: '', accGroupACC: 'DEP-SAV',
  accountOpenRule: 'many', minOnlineBalance: 0,
  passbookProjectName: '', bookNote1: '', bookNote2: '',

  // แท็บ 2 — ข้อกำหนดและการปรับ (ฝาก-ถอน)
  minOpen: 100, openCond: 'allow', minDeposit: 1, minWithdraw: 1, minBalance: 100,
  maxBalanceOn: false, chkPB: true, maxBalance: 0, compareBase: 'account',
  limitAccounts: false, maxAccounts: 0,
  // ข้อกำหนดครั้งการถอน
  wdCountLimit: false, wdCountMax: 0, wdCountWithin: 1, wdCountWithinUnit: 'month',
  closeAfterN: 0, closeAfterUnit: 'day', closeIntRef: 'ตามอัตราถอนก่อนกำหนด',
  // สมุดหาย/ชำรุด
  lostBookPenaltyOn: false, lostBookFee: 100, lostBookGl: '',
  // ถอนเกินจำนวนครั้ง
  overWdPenaltyOn: false, overWdBase: 'withdrawn', overWdPercent: 1, overWdMinFee: 200,
  overWdRangeCond: 9999999, overWdGl: '',
  // การทำรายการด้านฝาก
  depTxnLimitOn: false, depTxnPer: 'บัญชี', depTxnWithin: 'month', depTxnMaxAmount: 0,
  // การทำรายการด้านถอน
  wdTxnLimitOn: false, wdTxnPer: 'บัญชี', wdTxnWithin: 'month', wdTxnMaxAmount: 0,
  // การถือสมุดคู่ฝาก
  passbookHold: 'book', nonCountTxns: ['WCN', 'WDC', 'WDE'],

  // แท็บ 3 — เงื่อนไขจ่าย Int./Div. / ค่ารักษาบัญชี
  hasTerm: false, depAgeRef: 'principal', fixedTerm: false, termMonths: 0,
  whtOn: false, taxRateMode: 'byterm', taxCalcMethod: 'full',
  // ถอนปิดก่อนถึงระยะเวลา
  earlyCloseePenaltyOn: false, earlyClosePercent: 0, earlyCloseGl: '',
  // การให้ Int./Div.
  intGiveOn: true, intGiveRef: 'fixed',
  // การทบ
  compoundWhen: 'none', intCalcMethod: 'day',
  // ค่ารักษาบัญชี
  maintFeeOn: false, maintBalanceUnder: 0, maintInactiveDur: 2, maintUnit: 'year',
  maintFeeAmount: 100, maintFeeDay: 'eom', maintFeeMonth: 12, maintEveryMonth: false, maintGl: '',

  // แท็บ 4 — การคิด Int./Div.
  minIntGeneral: 0, minIntMonthly: 0, monthlyIntOn: false, intReceiveMode: 'compound',
  // ถอนก่อนกำหนด — วิธีจ่าย
  earlyPayMode: 'withdrawn', principalDateMode: 'keep', earlyWithdrawIntOn: true, intCalcFrom: 'principal',
  // ค่าปรับ/คิดดอกเบี้ยถอนก่อน
  earlyIntCalc: 'fixedAtWd', earlyPenaltyRate: 0, earlyPenaltyGl: '', earlyPenaltyAmount: 0, intInSlip: 'แสดงรวมในใบสั่ง',
  // ยอดเงินคิด
  intCalcBalanceBase: 'balance',
  // ตั้งดอกเบี้ยค้าง
  accrueOn: false, accrueMethod: 'daily',
  // เมื่อหมดต้น
  exhaustAction: 'keep', transferTargetType: '', transferRate: 0, monthlyDeposit: false, recallMode: 'no',
  // การส่งแบบรายงวด
  backdateOn: false, backdateDays: 7, backdateUnit: 'calendar',
  periodicSend: 'none', periodicAmtMode: 'equal', periodicMissMax: 0, periodicLateMax: 0,
};

// ─── ค่าตั้งต้นของตารางย่อย ─────────────────────────────────────────
window.DAT_TABLE_DEFAULTS = () => ({
  rateTiers: [],       // { seq, effectiveDate, balFrom, rate }
  earlyWithdraw: [],   // { ageLessThan, unit, intCond, rateMode, rateType, rateTable, penalty, tax }
  dividendDates: [],   // { balFrom, balTo, payDay, payMonth, calcToDay }
});

// ─── override เฉพาะรหัส (ค่าที่โดดเด่น + ตารางตัวอย่าง) ───────────────
const DAT_OVR = {
  S01: {
    settings: { depGroup: 'saving', personType: 'all', accGroupACC: 'DEP-SAV', accountOpenRule: 'many',
      intGiveOn: true, intGiveRef: 'fixed', intCalcMethod: 'day', compoundWhen: 'none',
      passbookProjectName: 'เงินฝากออมทรัพย์', docNo: 'DPACCDOCNO10' },
    rateTiers: [
      { seq: 3, effectiveDate: '2025-01-01', balFrom: 1, rate: 1.2500 },
      { seq: 2, effectiveDate: '2024-01-01', balFrom: 1, rate: 1.5000 },
      { seq: 1, effectiveDate: '2022-06-01', balFrom: 1, rate: 1.0000 },
    ],
    dividendDates: [
      { balFrom: 0, balTo: 999999999, payDay: 30, payMonth: 6,  calcToDay: 30 },
      { balFrom: 0, balTo: 999999999, payDay: 31, payMonth: 12, calcToDay: 31 },
    ],
  },
  S02: {
    settings: { depGroup: 'special', accGroupACC: 'DEP-SAV', accountOpenRule: 'many',
      limitAccounts: true, maxAccounts: 3, wdCountLimit: true, wdCountMax: 1, wdCountWithin: 1, wdCountWithinUnit: 'month',
      overWdPenaltyOn: true, overWdBase: 'withdrawn', overWdPercent: 1, overWdMinFee: 200, overWdRangeCond: 9999999, overWdGl: '43010101',
      intGiveRef: 'tier', maintFeeOn: true, maintBalanceUnder: 1000, maintInactiveDur: 12, maintUnit: 'month',
      maintFeeAmount: 50, maintFeeDay: 31, maintFeeMonth: 12, maintGl: '43010201',
      passbookProjectName: 'เงินฝากออมทรัพย์พิเศษ', docNo: 'DPACCDOCNO11' },
    rateTiers: [
      { seq: 3, effectiveDate: '2025-01-01', balFrom: 1,       rate: 2.5000 },
      { seq: 2, effectiveDate: '2025-01-01', balFrom: 100001,  rate: 2.7500 },
      { seq: 1, effectiveDate: '2025-01-01', balFrom: 500001,  rate: 3.0000 },
    ],
    dividendDates: [
      { balFrom: 0, balTo: 999999999, payDay: 30, payMonth: 6,  calcToDay: 30 },
      { balFrom: 0, balTo: 999999999, payDay: 31, payMonth: 12, calcToDay: 31 },
    ],
  },
  F12: {
    settings: { depGroup: 'fixed', accGroupACC: 'DEP-FIX', accountOpenRule: 'many',
      hasTerm: true, depAgeRef: 'principal', fixedTerm: true, termMonths: 12,
      whtOn: true, taxRateMode: 'byterm', taxCalcMethod: 'full',
      earlyCloseePenaltyOn: true, earlyClosePercent: 1.5, earlyCloseGl: '43010103',
      compoundWhen: 'maturity', intCalcMethod: 'month', intReceiveMode: 'compound',
      earlyWithdrawIntOn: true, intCalcFrom: 'principal', earlyIntCalc: 'earlyRate',
      accrueOn: true, accrueMethod: 'daily', exhaustAction: 'keep',
      passbookProjectName: 'เงินฝากประจำ 12 เดือน', docNo: 'DPACCDOCNO12', minOpen: 50000, minBalance: 50000 },
    rateTiers: [
      { seq: 1, effectiveDate: '2025-01-01', balFrom: 50000, rate: 3.1000 },
    ],
    dividendDates: [
      { balFrom: 50000, balTo: 999999999, payDay: 'eom', payMonth: 12, calcToDay: 'eom' },
    ],
    earlyWithdraw: [
      { ageLessThan: 3,  unit: 'month', intCond: 'none', rateMode: 'bytype', rateType: '-',      rateTable: '-',   penalty: false, tax: true },
      { ageLessThan: 12, unit: 'month', intCond: 'get',  rateMode: 'bytype', rateType: 'saving', rateTable: 'SAV', penalty: false, tax: true },
    ],
  },
  L90: {
    settings: { depGroup: 'internal', accGroupACC: 'DEP-INT', accountOpenRule: 'one',
      openCond: 'deny', limitAccounts: true, maxAccounts: 1, intGiveOn: true, intGiveRef: 'fixed',
      passbookHold: 'nobook', passbookProjectName: 'เงินฝากเพื่อรับเงินกู้พิเศษ', docNo: '' },
  },
  W10: {
    settings: { depGroup: 'internal', accGroupACC: 'DEP-INT', accountOpenRule: 'one',
      openCond: 'deny', limitAccounts: true, maxAccounts: 1, passbookHold: 'nobook',
      passbookProjectName: 'เงินฝากสำหรับหัก ฌปท/ฌาปนกิจ', docNo: '' },
  },
  T01: {
    settings: { depGroup: 'internal', accGroupACC: 'DEP-INT', openCond: 'deny', intGiveOn: false,
      passbookHold: 'nobook', passbookProjectName: 'บัญชีรับโอนจากระบบเงินกู้', docNo: '' },
  },
  T02: {
    settings: { depGroup: 'internal', accGroupACC: 'DEP-INT', openCond: 'deny', intGiveOn: false,
      passbookHold: 'nobook', passbookProjectName: 'บัญชีรับโอนจากตัวแทน', docNo: '' },
  },
};

// ─── สร้าง record เต็มจาก seed เดิม (ไม่แตะกลุ่มค่าเดิม) ──────────────
window.datBuildRecord = (base) => {
  const ovr = DAT_OVR[base.code] || {};
  const c = base.cond || {}, itr = base.interest || {}, wd = base.withdraw || {}, gl = base.gl || {}, ctl = base.control || {};
  // ค่าจากกลุ่มเดิม → settings (ให้แท็บใหม่แสดงข้อมูลตรงกับที่ระบบใช้จริง)
  const derived = {
    abbr: base.code, glCode: gl.glCode || '', glPair: gl.pairCode || '',
    minOpen: c.minOpen ?? 100, minBalance: c.minBalance ?? 100,
    limitAccounts: !!c.limitPerMember, maxAccounts: c.maxPerMember || 0,
    accountOpenRule: c.limitPerMember ? (c.maxPerMember <= 1 ? 'one' : 'many') : 'many',
    overWdFee: wd.feeOver || 0,
    wdCountMax: wd.freeCount >= 99 ? 0 : (wd.freeCount || 0),
    intGiveOn: Number(itr.rate || 0) > 0,
    intCalcMethod: itr.method === 'monthly' ? 'month' : 'day',
    passbookHold: base.passbook?.useBook ? 'book' : 'nobook',
  };
  const settings = { ...window.DAT_SETTINGS_DEFAULTS, ...derived, ...(ovr.settings || {}) };
  const tbl = window.DAT_TABLE_DEFAULTS();
  return {
    ...base,
    settings,
    rateTiers:     ovr.rateTiers     ? JSON.parse(JSON.stringify(ovr.rateTiers))     : tbl.rateTiers,
    earlyWithdraw: ovr.earlyWithdraw ? JSON.parse(JSON.stringify(ovr.earlyWithdraw)) : tbl.earlyWithdraw,
    dividendDates: ovr.dividendDates ? JSON.parse(JSON.stringify(ovr.dividendDates)) : tbl.dividendDates,
    history: base.history || [],
  };
};
