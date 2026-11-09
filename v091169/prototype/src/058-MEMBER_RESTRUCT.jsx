// ════════════════════════════════════════════════════════════════════
//  ทะเบียนสมาชิก — ประวัติการปรับโครงสร้างหนี้รายสัญญา (แท็บในหน้าสมาชิก)
//  ─ ล้อกับเมนู "ปรับโครงสร้างหนี้ / ใบคำขอเปลี่ยนแปลงยอดชำระหนี้" ของจริง
//    ใช้ค่าคงที่ร่วมกับ:
//      • DRC_METHODS       (วิธีปรับโครงสร้าง)          — data-debt-restruct.js
//      • ICR_PAY_METHODS   (รูปแบบการชำระ)             — data-installment-change.js
//      • ICR_NOTE_CATEGORIES (ปรับโครงสร้างผู้กู้/ผู้ค้ำ) — data-installment-change.js
//      • ICR_REQ_STATUS    (สถานะใบคำขอ)               — data-installment-change.js
//      • ICR_CLASS         (การจัดชั้นลูกหนี้)          — data-installment-change.js
//      • icrBuildSchedule  (ตารางผ่อนชำระ)             — data-installment-change.js
//  ─ ข้อมูลเก็บแยก "รายสัญญา" (key = เลขที่สัญญา) เพื่อให้ทุกหน้าที่อ้างถึง
//    สัญญาเดียวกันเห็นประวัติชุดเดียวกัน (เช่นเดียวกับ ICR_HISTORY)
// ════════════════════════════════════════════════════════════════════

// ─── ประวัติการปรับโครงสร้างหนี้ (รายสัญญา) ─────────────────────────
//  แต่ละ item = การปรับโครงสร้าง 1 ครั้ง (round) เรียงจากเก่า → ใหม่
//  before/after : เงื่อนไขก่อน–หลังปรับ (อัตรา · งวด · ยอดผ่อน/งวด · เงินต้นคงเหลือ)
//  sched        : พารามิเตอร์ตารางผ่อน (คำนวณด้วย icrBuildSchedule ตอนเรนเดอร์)
window.MEMBER_RESTRUCT = {

  // เงินกู้สามัญ — ปรับโครงสร้าง 1 ครั้ง (ขยายระยะเวลาผ่อน)
  'L-2021-0089': [
    {
      round: 1,
      reqNo: 'ICR-2566-000418', docNo: 'CHG-66-0087',
      recordDate: '2023-09-18', effectiveDate: '2023-10-01',
      meetingRef: 'ครั้งที่ 9/2566', resolutionDate: '2023-09-12',
      method: 'extend-term',            // DRC_METHODS
      configCode: 'RS-STD', configName: 'ปรับโครงสร้างหนี้มาตรฐาน',
      noteCategory: 'restruct-borrower', // ปรับโครงสร้างในฐานะผู้กู้
      payMethod: 'equal-installment',    // ICR_PAY_METHODS
      status: 'applied',                 // ICR_REQ_STATUS (ปรับปรุงแล้ว)
      by: 'จันทร์เพ็ญ มาลี',
      classBefore: 'watch', classAfter: 'normal',
      penaltyWaived: 1650, capitalizeInterest: false, guarantorConsent: true,
      before: { rate: 6.00, terms: 84,  perInstallment: 4200, outstanding: 236800, overdueTerms: 2 },
      after:  { rate: 6.00, terms: 108, perInstallment: 2980, outstanding: 236800, graceTerms: 0 },
      sched:  { role: 'borrower', graceInstallment: 0 },
      note: 'สมาชิกแจ้งภาระค่าใช้จ่ายในครัวเรือนเพิ่มขึ้น ขอลดยอดผ่อนต่องวด — คณะกรรมการเห็นชอบให้ขยายระยะเวลาผ่อนจาก 84 เป็น 108 งวด คงอัตราดอกเบี้ยเดิม',
    },
  ],

  // ฉฉ ฉุกเฉินเงินสด — ปรับโครงสร้าง 2 ครั้ง (ลดดอกเบี้ย+ขยายงวด → พักเงินต้น)
  'L-2019-0214': [
    {
      round: 1,
      reqNo: 'ICR-2565-000216', docNo: 'CHG-65-0042',
      recordDate: '2022-06-15', effectiveDate: '2022-07-01',
      meetingRef: 'ครั้งที่ 6/2565', resolutionDate: '2022-06-09',
      method: 'combine',                 // ลดดอกเบี้ย + ขยายงวด
      configCode: 'RS-STD', configName: 'ปรับโครงสร้างหนี้มาตรฐาน',
      noteCategory: 'restruct-borrower',
      payMethod: 'equal-installment',
      status: 'applied',
      by: 'อนุวัฒน์ ใจดี',
      classBefore: 'substandard', classAfter: 'watch',
      penaltyWaived: 2840, capitalizeInterest: true, guarantorConsent: true,
      before: { rate: 5.50, terms: 60, perInstallment: 1450, outstanding: 92400, overdueTerms: 4 },
      after:  { rate: 5.00, terms: 84, perInstallment: 1180, outstanding: 92400, graceTerms: 0 },
      sched:  { role: 'borrower', graceInstallment: 0 },
      note: 'ผิดนัดชำระ 4 งวด — ปรับลดอัตราดอกเบี้ยเหลือ 5.00% ต่อปี และขยายระยะเวลาผ่อน พร้อมรวมดอกเบี้ยค้างเป็นเงินต้น ตามเงื่อนไขปรับโครงสร้างมาตรฐาน',
    },
    {
      round: 2,
      reqNo: 'ICR-2567-000073', docNo: 'CHG-67-0015',
      recordDate: '2024-01-15', effectiveDate: '2024-02-01',
      meetingRef: 'ครั้งที่ 1/2567', resolutionDate: '2024-01-10',
      method: 'hold-principal',          // พักเงินต้น ชำระเฉพาะดอกเบี้ย
      configCode: 'RS-SOFT', configName: 'ผ่อนปรนพิเศษ (กรณีเดือดร้อนรุนแรง)',
      noteCategory: 'restruct-borrower',
      payMethod: 'principal-grace',
      status: 'applied',
      by: 'จันทร์เพ็ญ มาลี',
      classBefore: 'watch', classAfter: 'watch',
      penaltyWaived: 980, capitalizeInterest: false, guarantorConsent: true,
      before: { rate: 5.00, terms: 84, perInstallment: 1180, outstanding: 64200, overdueTerms: 1 },
      after:  { rate: 3.50, terms: 90, perInstallment: 1050, outstanding: 64200, graceTerms: 6, graceInstallment: 190 },
      sched:  { role: 'borrower' },
      note: 'สมาชิกได้รับผลกระทบด้านรายได้ ขอพักชำระเงินต้น 6 งวดแรก (ชำระเฉพาะดอกเบี้ย) และลดอัตราดอกเบี้ยเหลือ 3.50% ต่อปี ตามเงื่อนไขผ่อนปรนพิเศษ',
    },
  ],

  // ── สัญญาอ้างอิงจากเมนูปรับโครงสร้างจริง (DN_MEMBERS) — ใช้ร่วมกันได้ ──
  'L-2020-0118': [
    {
      round: 1,
      reqNo: 'ICR-2567-000091', docNo: 'CHG-67-0009',
      recordDate: '2024-06-03', effectiveDate: '2024-07-01',
      meetingRef: 'ครั้งที่ 5/2567', resolutionDate: '2024-05-28',
      method: 'combine',
      configCode: 'RS-LEGAL', configName: 'ปรับโครงสร้างหลังดำเนินคดี',
      noteCategory: 'restruct-borrower',
      payMethod: 'restructure',
      status: 'pending',                 // รออนุมัติ
      by: 'จันทร์เพ็ญ มาลี',
      classBefore: 'loss', classAfter: 'substandard',
      penaltyWaived: 8600, capitalizeInterest: true, guarantorConsent: false,
      before: { rate: 7.00, terms: 144, perInstallment: 8200, outstanding: 612000, overdueTerms: 12 },
      after:  { rate: 6.00, terms: 180, perInstallment: 5500, outstanding: 612000, graceTerms: 0 },
      sched:  { role: 'borrower', graceInstallment: 0 },
      note: 'อยู่ระหว่างทำสัญญาประนีประนอมยอมความ — เสนอปรับลดดอกเบี้ยเหลือ 6.00% ต่อปี ขยายงวดเป็น 180 งวด รวมดอกเบี้ยค้างเป็นเงินต้น (รออนุมัติจากที่ประชุม)',
    },
  ],
};

// ─── ประวัติของสัญญาหนึ่ง (เรียงตามครั้ง) ───────────────────────────
window.mrsForContract = (contractNo) => {
  const list = (window.MEMBER_RESTRUCT && window.MEMBER_RESTRUCT[contractNo]) || [];
  return list.slice().sort((a, b) => (a.round || 0) - (b.round || 0));
};

// ─── รวมประวัติปรับโครงสร้างของสมาชิก (จากรายการสัญญาเงินกู้) ────────
//  รับ loans[] ของสมาชิก → คืนเฉพาะสัญญาที่เคยปรับโครงสร้าง พร้อม rounds[]
//  คงลำดับตามรายการสัญญาเดิม
window.mrsForMember = (loans) => {
  return (loans || [])
    .map(loan => {
      const key = loan.contract || loan.contractNo;
      const rounds = window.mrsForContract(key);
      return rounds.length ? { loan, contractNo: key, rounds } : null;
    })
    .filter(Boolean);
};

// ─── นับจำนวนครั้ง / แยกตามประเภทวิธีปรับ (สำหรับแถบสรุป) ────────────
window.mrsMethodBreakdown = (groups) => {
  const tally = {};
  (groups || []).forEach(g => g.rounds.forEach(r => {
    tally[r.method] = (tally[r.method] || 0) + 1;
  }));
  return Object.keys(tally).map(v => ({
    method: v,
    label: (window.drcMethod ? window.drcMethod(v).l : v),
    count: tally[v],
  })).sort((a, b) => b.count - a.count);
};
