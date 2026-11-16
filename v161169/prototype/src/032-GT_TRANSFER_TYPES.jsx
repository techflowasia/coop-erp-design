// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — รับโอนเลขสัญญาผู้ค้ำประกัน
//  โอนหนี้ให้ผู้ค้ำ (TRN) / โอนกลับผู้กู้ (RTN)
//  ใช้กรณีผู้กู้เสียชีวิต ลาออก ให้ออก ไล่ออก ปลดออก ฯลฯ แล้วต้องโอน
//  ภาระหนี้ของสัญญาเดิมไปยังผู้ค้ำประกัน (ออกเลขสัญญารับโอนใหม่)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทการโอน ───────────────────────────────────────────────────
window.GT_TRANSFER_TYPES = [
  { v: 'TRN', l: 'TRN — โอนหนี้ให้ผู้ค้ำ',  dir: 'to-guarantor' },
  { v: 'RTN', l: 'RTN — โอนกลับผู้กู้',      dir: 'to-borrower' },
];
window.gtTransferType = (v) => window.GT_TRANSFER_TYPES.find(t => t.v === v) || window.GT_TRANSFER_TYPES[0];

// ─── เหตุที่ผู้กู้ออก (บังคับกรอกเมื่อประเภท TRN) ────────────────────
window.GT_EXIT_REASONS = [
  { code: 'E01', label: 'เสียชีวิต',         special: true },
  { code: 'E02', label: 'ลาออก',            special: false },
  { code: 'E03', label: 'ให้ออก',           special: true },
  { code: 'E04', label: 'ไล่ออก',           special: true },
  { code: 'E05', label: 'ปลดออก',           special: true },
  { code: 'E06', label: 'พ้นสภาพสมาชิก',     special: false },
  { code: 'E99', label: 'อื่น ๆ',            special: false },
];
window.gtExitReason = (code) => window.GT_EXIT_REASONS.find(r => r.code === code) || null;

// ─── สถานะสมาชิกที่เข้าเงื่อนไขโอนหนี้ให้ผู้ค้ำ (ดึงจากระบบทะเบียนสมาชิก) ──
//  เลือกทำรายการได้เฉพาะผู้กู้ที่ ตาย/ให้ออก/ไล่ออก/ปลดออก/ลาออก/พ้นสภาพ
//  เหตุที่ผู้กู้ออกถูก "ดึง" จากสถานะสมาชิก ไม่ใช่เลือกเอง
//  map: สถานะสมาชิก → เหตุ (code) + อัตราพิเศษผู้ค้ำ (special)
window.GT_STATUS_EXIT_MAP = {
  'เสียชีวิต':      { code: 'E01', label: 'เสียชีวิต',      special: true },
  'ตาย':           { code: 'E01', label: 'เสียชีวิต',      special: true },
  'ลาออก':         { code: 'E02', label: 'ลาออก',          special: false },
  'ให้ออก':        { code: 'E03', label: 'ให้ออก',         special: true },
  'ไล่ออก':        { code: 'E04', label: 'ไล่ออก',         special: true },
  'ปลดออก':        { code: 'E05', label: 'ปลดออก',         special: true },
  'พ้นสภาพ':       { code: 'E06', label: 'พ้นสภาพสมาชิก',   special: false },
  'พ้นสภาพสมาชิก': { code: 'E06', label: 'พ้นสภาพสมาชิก',   special: false },
};
window.gtStatusToExit = (status) => window.GT_STATUS_EXIT_MAP[String(status || '').trim()] || null;
window.gtIsEligibleStatus = (status) => !!window.gtStatusToExit(status);

// ─── อัตราดอกเบี้ยสำหรับผู้ค้ำประกัน ─────────────────────────────────
//  กรณีผู้กู้ ตาย/ให้ออก/ไล่ออก/ปลดออก — ผู้ค้ำ (สามี/ภรรยา/บุตร) ได้ 3.50%
window.GT_RATE_MODES = [
  { v: 'orig',     l: 'ใช้อัตราเดิมของสัญญา' },
  { v: 'special',  l: 'อัตราพิเศษสำหรับผู้ค้ำ (3.50%)', rate: 3.50, effective: '2017-07-01' },
  { v: 'announce', l: 'ตามประกาศสหกรณ์ (5.00%)',        rate: 5.00, effective: '2017-07-01' },
];
window.gtRateMode = (v) => window.GT_RATE_MODES.find(m => m.v === v) || window.GT_RATE_MODES[0];

// ─── ประเภทการส่ง (วิธีตัดชำระต่องวดของสัญญารับโอน) ──────────────────
//  คงต้น = ตัดเงินต้นเท่ากันทุกงวด ดอกเบี้ยลดตามต้น
//  คงยอด = ยอดชำระต่องวดคงที่ (เงินต้น+ดอกเบี้ยรวมเท่ากันทุกงวด)
window.GT_SEND_TYPES = [
  { v: 'principal', l: 'คงต้น' },
  { v: 'balance',   l: 'คงยอด' },
];
window.gtSendType = (v) => window.GT_SEND_TYPES.find(s => s.v === v) || window.GT_SEND_TYPES[0];

// ─── สถานะใบทำรายการโอน ─────────────────────────────────────────────
window.GT_DOC_STATUS = [
  { v: 'draft',     l: 'บันทึกแล้ว — รออนุมัติ', pill: 'info'    },
  { v: 'approved',  l: 'อนุมัติแล้ว',            pill: 'ok'      },
  { v: 'cancelled', l: 'ยกเลิกรายการ',           pill: 'bad'     },
];
window.gtDocStatus = (v) => window.GT_DOC_STATUS.find(s => s.v === v) || window.GT_DOC_STATUS[0];

// ─── สถานะการเรียกเก็บ (ของหนี้ที่โอนไปผู้ค้ำ) ──────────────────────
window.GT_COLLECT_STATUS = [
  { v: 'pending',    l: 'รอเรียกเก็บ',          pill: 'neutral' },
  { v: 'collecting', l: 'อยู่ระหว่างเรียกเก็บ',  pill: 'warn'    },
  { v: 'partial',    l: 'เรียกเก็บบางส่วน',     pill: 'info'    },
  { v: 'legal',      l: 'ดำเนินคดี',            pill: 'bad'     },
  { v: 'done',       l: 'ชำระครบ / ปิดหนี้',     pill: 'ok'      },
];
window.gtStatus = (v) => window.GT_COLLECT_STATUS.find(s => s.v === v) || window.GT_COLLECT_STATUS[0];

// ─── คำนวณดอกเบี้ยค้าง (เส้นตรง รายวัน 365) ─────────────────────────
window.gtDaysBetween = (aISO, bISO) =>
  Math.max(0, Math.round((new Date(bISO) - new Date(aISO)) / 86400000));
window.gtAccruedInterest = (principal, ratePct, fromISO, toISO) => {
  const days = window.gtDaysBetween(fromISO, toISO);
  return Math.round((Number(principal) || 0) * (Number(ratePct) || 0) / 100 * days / 365 * 100) / 100;
};

// ════════════════════════════════════════════════════════════════════
//  สัญญาเงินกู้ที่สามารถค้นหาเพื่อโอนหนี้
//  guarantors[]: ผู้ค้ำประกันที่ผูกกับสัญญา (ดึงเข้าตารางเลือกผู้รับโอน)
// ════════════════════════════════════════════════════════════════════
window.GT_LOAN_CONTRACTS = [
  {
    contractNo: 'L-2021-0332',
    borrowerCode: 'M-066238', borrowerName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    borrowerDept: 'กองการศึกษา', borrowerStatus: 'ลาออก',
    loanType: 'เงินกู้สามัญ', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', docStatusHint: 'ยังไม่มีรายการโอน',
    intRate: 6.25, contractDate: '2021-03-18', citizenId: '3 1009 0185 442 1',
    lastInterestDate: '2026-03-25',
    principalRemaining: 276400, installment: 6450,
    totalTerms: 96, paidTerms: 41, lastPeriod: '2569/03',
    closed: false, pendingTransfer: false,
    guarantors: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', relation: 'คู่สมรส' },
      { code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ',       dept: 'กองคลัง สำนักงานปลัด', relation: 'เพื่อนร่วมงาน' },
    ],
  },
  {
    contractNo: 'L-2020-0118',
    borrowerCode: 'M-065471', borrowerName: 'นายประเสริฐ ชูเกียรติ',
    borrowerDept: 'สำนักงานปลัด', borrowerStatus: 'เสียชีวิต',
    loanType: 'เงินกู้พิเศษ', contractType: 'ค้ำด้วยบุคคล + หลักทรัพย์',
    legalStatus: 'ดำเนินคดี', docStatusHint: 'ยังไม่มีรายการโอน',
    intRate: 6.75, contractDate: '2020-07-09', citizenId: '3 4099 0012 778 5',
    lastInterestDate: '2026-03-25',
    principalRemaining: 612000, installment: 8200,
    totalTerms: 144, paidTerms: 58, lastPeriod: '2569/03',
    closed: false, pendingTransfer: false,
    guarantors: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', relation: 'บุตร' },
      { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',     dept: 'กองช่าง',              relation: 'เพื่อนร่วมงาน' },
    ],
  },
  {
    contractNo: 'L-2022-0455',
    borrowerCode: 'M-067012', borrowerName: 'นายวิรัตน์ ทองสุข',
    borrowerDept: 'กองช่าง', borrowerStatus: 'พ้นสภาพ',
    loanType: 'เงินกู้สามัญ', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', docStatusHint: 'ยังไม่มีรายการโอน',
    intRate: 6.25, contractDate: '2022-09-01', citizenId: '1 5701 0099 321 7',
    lastInterestDate: '2026-04-25',
    principalRemaining: 458200, installment: 9680,
    totalTerms: 120, paidTerms: 36, lastPeriod: '2569/04',
    closed: false, pendingTransfer: false,
    guarantors: [
      { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์',  dept: 'กองช่าง',      relation: 'เพื่อนร่วมงาน' },
      { code: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', dept: 'กองการศึกษา', relation: 'เพื่อนร่วมงาน' },
    ],
  },
  {
    contractNo: 'EM-2023-0612',
    borrowerCode: 'M-064905', borrowerName: 'นายเอกชัย พูนผล',
    borrowerDept: 'กองช่าง', borrowerStatus: 'ลาออก',
    loanType: 'เงินกู้ฉุกเฉิน', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', docStatusHint: 'ยังไม่มีรายการโอน',
    intRate: 7.00, contractDate: '2023-04-20', citizenId: '3 1601 0054 880 2',
    lastInterestDate: '2026-04-10',
    principalRemaining: 41200, installment: 3120,
    totalTerms: 12, paidTerms: 9, lastPeriod: '2569/04',
    closed: false, pendingTransfer: false,
    guarantors: [
      { code: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', dept: 'กองคลัง', relation: 'เพื่อนร่วมงาน' },
    ],
  },
  {
    contractNo: 'L-2019-0087',
    borrowerCode: 'M-061230', borrowerName: 'นางสมหญิง พิทักษ์',
    borrowerDept: 'กองสาธารณสุข', borrowerStatus: 'ปกติ',
    loanType: 'เงินกู้สามัญ', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', docStatusHint: 'ปิดบัญชีแล้ว',
    intRate: 6.25, contractDate: '2019-05-10', citizenId: '3 1012 0166 905 9',
    lastInterestDate: '2025-12-25',
    principalRemaining: 0, installment: 0,
    totalTerms: 84, paidTerms: 84, lastPeriod: '2568/12',
    closed: true, pendingTransfer: false,   // ทดสอบเงื่อนไข "สัญญาปิดแล้ว"
    guarantors: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', relation: 'เพื่อนร่วมงาน' },
    ],
  },
];
window.gtContract = (no) => window.GT_LOAN_CONTRACTS.find(c => c.contractNo === no) || null;
window.gtSearchContracts = (q) => {
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const n = norm(q);
  if (!n) return window.GT_LOAN_CONTRACTS;
  return window.GT_LOAN_CONTRACTS.filter(c =>
    norm(c.contractNo).includes(n) ||
    norm(c.borrowerCode).includes(n) ||
    norm(c.borrowerName).includes(n) ||
    norm(c.loanType).includes(n));
};

// ─── เลขทะเบียนรับโอน (auto) — GT-{พ.ศ.}-{running 6 หลัก} ───────────
window.gtNextId = (list, beYear) => {
  const prefix = `GT-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n)) return Math.max(mx, n);
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(6, '0');
};
// ─── เลขสัญญารับโอน (auto) — {GS|GE}-{พ.ศ.}-{running 4 หลัก} ────────
window.gtNextContractSeq = (list, beYear, prefix) => {
  const pre = `${prefix || 'GS'}-${beYear}-`;
  let max = 0;
  (list || []).forEach(r => (r.allocations || []).forEach(a => {
    const s = String(a.transferredContractNo || '');
    if (s.startsWith(pre)) { const n = parseInt(s.slice(pre.length), 10); if (!isNaN(n)) max = Math.max(max, n); }
  }));
  return max;
};
window.gtMakeContractNo = (prefix, beYear, seq) =>
  `${prefix}-${beYear}-${String(seq).padStart(4, '0')}`;

// รวมยอดต้น + ดอกเบี้ยที่โอน
window.gtTransferTotal = (r) =>
  (Number(r.transferPrincipal) || 0) + (Number(r.transferInterest) || 0);

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนรายการโอนหนี้ (seed)
//  allocations[]: ภาระที่โอนไปยังผู้ค้ำแต่ละราย
// ════════════════════════════════════════════════════════════════════
window.GT_SEED = [
  {
    id: 'GT-2569-000001', transferType: 'TRN',
    transferDate: '2026-05-22', accrueToDate: '2026-05-22',
    contractNo: 'L-2021-0332',
    borrowerCode: 'M-066238', borrowerName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    borrowerDept: 'กองการศึกษา', borrowerStatus: 'ลาออก',
    loanType: 'เงินกู้สามัญ', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', intRate: 6.25, lastInterestDate: '2026-03-25',
    principalRemaining: 276400, interestAccrued: 18920, installment: 6450, lastPeriod: '2569/03',
    exitReasonCode: 'E02', exitReasonOther: '',
    rateMode: 'orig', appliedRate: 6.25,
    transferPrincipal: 276400, transferInterest: 18920,
    allocations: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด',
        transferredContractNo: 'GS-2569-0117', accrueDate: '2026-05-22',
        percent: 60, principal: 165840, interest: 11352, perPeriod: 3870, type: 'TRN', paid: 42000 },
      { code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', dept: 'กองคลัง สำนักงานปลัด',
        transferredContractNo: 'GS-2569-0118', accrueDate: '2026-05-22',
        percent: 40, principal: 110560, interest: 7568, perPeriod: 2580, type: 'TRN', paid: 18000 },
    ],
    docStatus: 'approved', collectStatus: 'collecting',
    noticeRef: 'TRK-2569-000001', dueDate: '2026-06-07',
    history: [
      { date: '2026-05-08', event: 'แจ้งเรียกเก็บผู้ค้ำ', detail: 'ออกหนังสือแจ้งให้ชำระหนี้ TRK-2569-000001 ถึงผู้ค้ำประกัน', by: 'จันทร์เพ็ญ มาลี' },
      { date: '2026-05-20', event: 'อนุมัติรายการโอน', detail: 'คณะกรรมการอนุมัติให้โอนภาระหนี้ไปยังผู้ค้ำ 2 ราย', by: 'ประสิทธิ์ คงทอง' },
      { date: '2026-05-22', event: 'บันทึกโอนหนี้', detail: 'โอนเงินต้น 276,400.00 + ดอกเบี้ย 18,920.00 ออกเลขสัญญารับโอน GS-2569-0117, GS-2569-0118', by: 'จันทร์เพ็ญ มาลี' },
    ],
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-22T11:05:00',
  },
  {
    id: 'GT-2569-000002', transferType: 'TRN',
    transferDate: '2026-05-28', accrueToDate: '2026-05-28',
    contractNo: 'L-2020-0118',
    borrowerCode: 'M-065471', borrowerName: 'นายประเสริฐ ชูเกียรติ',
    borrowerDept: 'สำนักงานปลัด', borrowerStatus: 'เสียชีวิต',
    loanType: 'เงินกู้พิเศษ', contractType: 'ค้ำด้วยบุคคล + หลักทรัพย์',
    legalStatus: 'ดำเนินคดี', intRate: 6.75, lastInterestDate: '2026-03-25',
    principalRemaining: 612000, interestAccrued: 41280, installment: 8200, lastPeriod: '2569/03',
    exitReasonCode: 'E01', exitReasonOther: '',
    rateMode: 'special', appliedRate: 3.50,
    transferPrincipal: 612000, transferInterest: 41280,
    allocations: [
      { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด',
        transferredContractNo: 'GS-2569-0124', accrueDate: '2026-05-28',
        percent: 50, principal: 306000, interest: 20640, perPeriod: 3560, type: 'TRN', paid: 50000 },
      { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง',
        transferredContractNo: 'GS-2569-0125', accrueDate: '2026-05-28',
        percent: 50, principal: 306000, interest: 20640, perPeriod: 3560, type: 'TRN', paid: 0 },
    ],
    docStatus: 'approved', collectStatus: 'partial',
    noticeRef: 'TRK-2569-000002', dueDate: '2026-07-14',
    history: [
      { date: '2026-05-15', event: 'แจ้งเรียกเก็บผู้ค้ำ', detail: 'ออกหนังสือแจ้งให้ชำระหนี้ TRK-2569-000002 (ผู้กู้เดิมเสียชีวิต)', by: 'จันทร์เพ็ญ มาลี' },
      { date: '2026-05-26', event: 'อนุมัติรายการโอน', detail: 'แบ่งภาระหนี้ผู้ค้ำ 2 ราย รายละ 50% · ใช้อัตราพิเศษผู้ค้ำ 3.50%', by: 'สมศักดิ์ ธนวัฒน์' },
      { date: '2026-05-28', event: 'บันทึกโอนหนี้', detail: 'ออกเลขสัญญารับโอน GS-2569-0124, GS-2569-0125', by: 'จันทร์เพ็ญ มาลี' },
      { date: '2026-06-10', event: 'รับชำระบางส่วน', detail: 'ผู้ค้ำชำระ 50,000 บาท', by: 'พิมพ์ใจ สุวรรณโชติ' },
    ],
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-28T15:32:00',
  },
  {
    id: 'GT-2569-000003', transferType: 'TRN',
    transferDate: '2026-06-04', accrueToDate: '2026-06-04',
    contractNo: 'L-2022-0455',
    borrowerCode: 'M-067012', borrowerName: 'นายวิรัตน์ ทองสุข',
    borrowerDept: 'กองช่าง', borrowerStatus: 'พ้นสภาพ',
    loanType: 'เงินกู้สามัญ', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', intRate: 6.25, lastInterestDate: '2026-04-25',
    principalRemaining: 458200, interestAccrued: 6240, installment: 9680, lastPeriod: '2569/04',
    exitReasonCode: 'E06', exitReasonOther: '',
    rateMode: 'orig', appliedRate: 6.25,
    transferPrincipal: 458200, transferInterest: 6240,
    allocations: [
      { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', dept: 'กองช่าง',
        transferredContractNo: 'GS-2569-0131', accrueDate: '2026-06-04',
        percent: 100, principal: 458200, interest: 6240, perPeriod: 9680, type: 'TRN' },
    ],
    docStatus: 'draft', collectStatus: 'pending',
    noticeRef: 'TRK-2569-000003', dueDate: '2026-07-02',
    history: [
      { date: '2026-06-04', event: 'บันทึกโอนหนี้', detail: 'บันทึกรายการโอนหนี้ให้ผู้ค้ำ 1 ราย รับผิดชอบ 100% รออนุมัติ', by: 'จันทร์เพ็ญ มาลี' },
    ],
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-06-04T09:48:00',
  },
  {
    id: 'GT-2568-000044', transferType: 'TRN',
    transferDate: '2025-11-12', accrueToDate: '2025-11-12',
    contractNo: 'EM-2023-0612',
    borrowerCode: 'M-064905', borrowerName: 'นายเอกชัย พูนผล',
    borrowerDept: 'กองช่าง', borrowerStatus: 'ลาออก',
    loanType: 'เงินกู้ฉุกเฉิน', contractType: 'ค้ำด้วยบุคคล',
    legalStatus: 'ปกติ', intRate: 7.00, lastInterestDate: '2025-10-10',
    principalRemaining: 41200, interestAccrued: 980, installment: 3120, lastPeriod: '2568/10',
    exitReasonCode: 'E02', exitReasonOther: '',
    rateMode: 'orig', appliedRate: 7.00,
    transferPrincipal: 41200, transferInterest: 980,
    allocations: [
      { code: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', dept: 'กองคลัง',
        transferredContractNo: 'GE-2568-0089', accrueDate: '2025-11-12',
        percent: 100, principal: 41200, interest: 980, perPeriod: 3120, type: 'TRN' },
    ],
    docStatus: 'approved', collectStatus: 'done',
    noticeRef: 'TRK-2568-000211', dueDate: '2025-12-10',
    history: [
      { date: '2025-11-12', event: 'บันทึกโอนหนี้', detail: 'ออกเลขสัญญารับโอน GE-2568-0089 แทนสัญญาเดิม EM-2023-0612', by: 'จันทร์เพ็ญ มาลี' },
      { date: '2025-12-09', event: 'ชำระครบ', detail: 'ผู้ค้ำชำระหนี้ครบถ้วน ปิดสัญญารับโอน', by: 'พิมพ์ใจ สุวรรณโชติ' },
    ],
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2025-11-12T13:20:00',
  },
];

// ─── โหลด/บันทึก localStorage (v2 — โครงสร้างใหม่) ──────────────────
window.gtLoad = () => {
  try {
    const saved = localStorage.getItem('guarantor_transfers_v2');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.GT_SEED.map(r => ({ ...r }));
};
window.gtSaveLS = (list) => {
  try { localStorage.setItem('guarantor_transfers_v2', JSON.stringify(list)); } catch (e) {}
};

// ══════════════════════════════════════════════════════════════════
//  โอนหนี้กลับผู้กู้ (RTN) — รวมหนี้ที่โอนไปผู้ค้ำกลับมาเป็นยอดเดียว
//  • แหล่งที่โอนกลับ = ใบทำรายการ TRN ที่อนุมัติแล้ว ยังไม่ปิดหนี้ และยังไม่ถูกโอนกลับ
//  • ยอดหนี้ที่โอนกลับ = รวม (ต้น+ดอกเบี้ย) − ยอดที่ผู้ค้ำชำระแล้ว → รวมเป็นยอดเดียว
//  • สัดส่วนการค้ำประกันใหม่ = ตามยอดที่ผู้ค้ำแต่ละรายชำระแล้ว (ถ้ายังไม่มีใครชำระ = แบ่งเท่า)
// ══════════════════════════════════════════════════════════════════

// รายการ TRN ที่สามารถโอนกลับผู้กู้ได้ (อนุมัติแล้ว / อยู่ระหว่างเรียกเก็บ ยังไม่ปิดหนี้)
window.gtReturnableRecords = (list) => (list || []).filter(r =>
  r.transferType === 'TRN' &&
  r.docStatus === 'approved' &&
  r.collectStatus !== 'done' &&
  !r.returnedTo);

// คำนวณยอดโอนกลับ + สัดส่วนค้ำประกันใหม่จากยอดที่ผู้ค้ำชำระแล้ว
window.gtComputeReturn = (rec) => {
  const allocs = (rec.allocations || []).map(a => {
    const owed = (Number(a.principal) || 0) + (Number(a.interest) || 0);
    const paid = Number(a.paid) || 0;
    return { ...a, owed, paid, remaining: Math.max(0, Math.round((owed - paid) * 100) / 100) };
  });
  const totalRemaining = Math.round(allocs.reduce((s, a) => s + a.remaining, 0) * 100) / 100;
  const totalPaid = Math.round(allocs.reduce((s, a) => s + a.paid, 0) * 100) / 100;
  // สัดส่วนการค้ำประกันใหม่ = ตามยอดที่ชำระแล้ว (ไม่มีการชำระ → แบ่งเท่ากัน)
  let acc = 0;
  const shares = allocs.map((a, i) => {
    let pct;
    if (totalPaid > 0) pct = Math.round(a.paid / totalPaid * 10000) / 100;
    else pct = Math.round(100 / allocs.length * 100) / 100;
    return { ...a, sharePct: pct };
  });
  // ปัดเศษให้รวม = 100 ที่รายสุดท้าย
  const sumPct = shares.reduce((s, x) => s + x.sharePct, 0);
  if (shares.length) shares[shares.length - 1].sharePct = Math.round((shares[shares.length - 1].sharePct + (100 - sumPct)) * 100) / 100;
  return { allocs: shares, totalRemaining, totalPaid };
};
// ─── จำสัดส่วนการค้ำประกันของสัญญาที่โอนกลับผู้กู้ ─────────
//  { [contractNo]: [{ code, name, sharePct }] }
//  ใช้ตอนนำสัญญาที่โอนกลับไปรับโอนเลขสัญญาผู้ค้ำอีกครั้ง
window.gtLoadReturnShares = () => {
  try { return JSON.parse(localStorage.getItem('gt_return_shares') || '{}'); } catch (e) { return {}; }
};
window.gtSaveReturnShares = (contractNo, shares) => {
  try {
    const all = window.gtLoadReturnShares();
    all[contractNo] = shares;
    localStorage.setItem('gt_return_shares', JSON.stringify(all));
  } catch (e) {}
};
window.gtReturnShares = (contractNo) => window.gtLoadReturnShares()[contractNo] || null;
