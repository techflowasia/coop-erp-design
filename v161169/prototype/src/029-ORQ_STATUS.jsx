// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ขอให้ชำระหนี้ (แจ้งหน่วยงานต้นสังกัด)
//  ใช้ข้อมูลร่วมกับ "แจ้งให้ชำระหนี้" (DN_MEMBERS / DN_CAUSES / DN_SIGNERS /
//  DN_MEMBER_STATUS / DN_DUE_PRESETS / dnContractTotal)
//
//  ต่างจาก "แจ้งให้ชำระหนี้" ตรงที่ —
//   • เป็นหนังสือถึง "หน่วยงานต้นสังกัด" ของสมาชิก (ไม่ใช่ถึงผู้กู้/ผู้ค้ำโดยตรง)
//   • เอกสารที่พิมพ์เป็น "สำเนา" (สำหรับแจ้งต้นสังกัด)
//   • หนึ่งสัญญาแจ้งได้เพียงครั้งเดียว (ครอบคลุมทั้งผู้กู้และผู้ค้ำในหนังสือเดียว)
// ════════════════════════════════════════════════════════════════════

// ─── สถานะรายการขอให้ชำระหนี้ (ใช้ชุดเดียวกับแจ้งให้ชำระหนี้) ────────
window.ORQ_STATUS = [
  { v: 'draft',     step: 0, l: 'บันทึกแล้ว — รอพิมพ์', pill: 'neutral' },
  { v: 'printed',   step: 1, l: 'แจ้งต้นสังกัดแล้ว',     pill: 'info' },
  { v: 'closed',    step: 2, l: 'ปิดรายการ (ชำระครบ)',   pill: 'ok' },
  { v: 'cancelled', step: 3, l: 'ยกเลิกหนังสือ',          pill: 'bad' },
];
window.orqStatus = (v) => window.ORQ_STATUS.find(s => s.v === v) || window.ORQ_STATUS[0];

// ─── เลขทะเบียนขอให้ชำระหนี้ (auto) — ORG-{พ.ศ.}-{running 6 หลัก} ────
window.orqNextTracking = (list, beYear) => {
  const prefix = `ORG-${beYear}-`;
  const max = (list || []).reduce((mx, r) => {
    if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
      const n = parseInt(r.id.slice(prefix.length), 10);
      if (!isNaN(n)) return Math.max(mx, n);
    }
    return mx;
  }, 0);
  return prefix + String(max + 1).padStart(6, '0');
};

// ─── เลขที่หนังสือ (auto) — ที่ สอ.กสท.(ต) {running}/{พ.ศ.} ──────────
window.orqNextDocNo = (list, beYear) => {
  const suffix = `/${beYear}`;
  const max = (list || []).reduce((mx, r) => {
    const s = String(r.docNo || '');
    const m = s.match(/(\d+)\/(\d+)$/);
    if (m && m[2] === String(beYear)) return Math.max(mx, parseInt(m[1], 10) || 0);
    return mx;
  }, 0);
  return `สอ.กสท.(ต) ${String(max + 1).padStart(4, '0')}${suffix}`;
};

// ─── กฎ: หนึ่งสัญญาแจ้งต้นสังกัดได้เพียงครั้งเดียว (นับเฉพาะที่ไม่ยกเลิก) ─
//  คืน Map: contractNo → ทะเบียน ORG ที่เคยแจ้งไปแล้ว
window.orqNotifiedContracts = (list, exceptId) => {
  const map = {};
  (list || []).forEach(r => {
    if (r.status === 'cancelled') return;
    if (exceptId && r.id === exceptId) return;
    (r.debts || []).forEach(d => { if (!map[d.contractNo]) map[d.contractNo] = r.id; });
  });
  return map;
};

// ─── ข้อมูลหน่วยงานต้นสังกัดจากรหัสสังกัดสมาชิก (ผู้รับหนังสือ) ───────
window.orqOrgOf = (member) => {
  if (!member) return { name: '', unit: '', head: '', code: '' };
  const rec = window.affilByCode ? window.affilByCode(member.deptCode) : null;
  return {
    code: member.deptCode || '',
    name: (rec && rec.name) || member.dept || '',
    unit: (rec && rec.unit) || '',
    head: (rec && rec.head) || '',
  };
};

// ─── ทะเบียนหนังสือขอให้ชำระหนี้ (seed) ─────────────────────────────
window.ORQ_SEED = [
  {
    id: 'ORG-2569-000001', docNo: 'สอ.กสท.(ต) 0001/2569', round: 1,
    regDate: '2026-05-12', dueDate: '2026-06-11',
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    dept: 'กองการศึกษา', deptCode: '0501', shares: 92000, memberStatus: 'ลาออก',
    org: { code: '0501', name: 'กองการศึกษา', unit: 'กลุ่มงานส่งเสริมการศึกษา', head: 'นางสาวศิริพร ใจงาม' },
    causeCode: 'C05', causeOther: '', occurredDate: '2026-01-31',
    signer: 'นายประสิทธิ์ คงทอง', signerPosition: 'ผู้จัดการสหกรณ์',
    debts: [
      { type: 'เงินกู้สามัญ', contractNo: 'L-2021-0332', status: 'บอกเลิกสัญญา',
        principalRemaining: 276400, interestDue: 18920, penalty: 3400,
        overdueInstallments: 8, dueDate: '2026-03-25', arrears: 55000 },
    ],
    guarantors: [
      { contractNo: 'L-2021-0332', memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', dept: 'กองคลัง สำนักงานปลัด', prefix: '' },
      { contractNo: 'L-2021-0332', memberCode: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ',       dept: 'กองคลัง สำนักงานปลัด', prefix: '' },
    ],
    totalOutstanding: 298720,
    status: 'printed', printCount: 1, printedDate: '2026-05-12', closedDate: null,
    emsNo: 'EH223456781TH',
    enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: '2026-05-12T11:08:00',
  },
];

// ─── โหลด/บันทึก localStorage ───────────────────────────────────────
window.orqLoad = () => {
  try {
    const saved = localStorage.getItem('debt_org_requests');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.ORQ_SEED.map(r => ({ ...r }));
};
window.orqSaveLS = (list) => {
  try { localStorage.setItem('debt_org_requests', JSON.stringify(list)); } catch (e) {}
};
