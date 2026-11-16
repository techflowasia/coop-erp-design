// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — ค่าคงที่: อัตราดอกเบี้ยเงินกู้
//  ตารางอัตราดอกเบี้ยแต่ละรหัส (INT10, INT20, ...) + ประวัติการเปลี่ยนแปลง
//  คิดดอกเบี้ยตามช่วงวงเงินอนุมัติ และวันที่เริ่มมีผลบังคับใช้
// ════════════════════════════════════════════════════════════════════

window.IR_SEED = [
  {
    id: 'IR-10', code: 'INT10', name: 'INT10-ฉุกเฉิน', loanTypeIds: ['LP-10'],
    enabled: true, createdDate: '2024-09-20 10:24', createdBy: 'ประภาส ทองสุข',
    note: 'อัตราดอกเบี้ยเงินกู้ฉุกเฉิน',
    rates: [
      { effectiveDate: '2025-10-01', loanFrom: 0, loanTo: 50000,  rate: 6.2500, useAdjust: false, user: 'จันทร์เพ็ญ มาลี', date: '2025-09-18' },
      { effectiveDate: '2024-10-01', loanFrom: 0, loanTo: 40000,  rate: 6.5000, useAdjust: false, user: 'ประภาส ทองสุข',  date: '2024-09-20' },
    ],
  },
  {
    id: 'IR-20', code: 'INT20', name: 'INT20-สามัญปกติ', loanTypeIds: ['LP-20'],
    enabled: true, createdDate: '2024-09-22 14:05', createdBy: 'ประภาส ทองสุข',
    note: 'อัตราดอกเบี้ยเงินกู้สามัญ คิดตามช่วงวงเงิน',
    rates: [
      { effectiveDate: '2025-10-01', loanFrom: 0,       loanTo: 1000000, rate: 6.0000, useAdjust: false, user: 'จันทร์เพ็ญ มาลี', date: '2025-09-18' },
      { effectiveDate: '2025-10-01', loanFrom: 1000000, loanTo: 3000000, rate: 6.5000, useAdjust: true,  user: 'จันทร์เพ็ญ มาลี', date: '2025-09-18' },
      { effectiveDate: '2024-10-01', loanFrom: 0,       loanTo: 3000000, rate: 6.7500, useAdjust: false, user: 'ประภาส ทองสุข',  date: '2024-09-22' },
    ],
  },
  {
    id: 'IR-30', code: 'INT30', name: 'INT30-เงินกู้พิเศษ', loanTypeIds: ['LP-30'],
    enabled: true, createdDate: '2024-12-15 09:38', createdBy: 'ประภาส ทองสุข',
    note: 'ใช้หลักทรัพย์ค้ำประกัน',
    rates: [
      { effectiveDate: '2025-01-01', loanFrom: 0, loanTo: 5000000, rate: 5.7500, useAdjust: false, user: 'ประภาส ทองสุข', date: '2024-12-15' },
    ],
  },
  {
    id: 'IR-57', code: 'INT57', name: 'INT57-สามัญผู้เกษียณ 90%', loanTypeIds: ['LP-20'],
    enabled: true, createdDate: '2024-09-25 11:12', createdBy: 'ประภาส ทองสุข',
    note: '',
    rates: [
      { effectiveDate: '2025-10-01', loanFrom: 0, loanTo: 2000000, rate: 6.2500, useAdjust: false, user: 'จันทร์เพ็ญ มาลี', date: '2025-09-18' },
    ],
  },
  {
    id: 'IR-40', code: 'INT40', name: 'INT40-สามัญอุทกภัย', loanTypeIds: ['LP-40'],
    enabled: false, createdDate: '2024-09-28 16:41', createdBy: 'ประภาส ทองสุข',
    note: 'อัตราช่วยเหลือผู้ประสบอุทกภัย — สิ้นสุดโครงการแล้ว',
    rates: [
      { effectiveDate: '2024-10-01', loanFrom: 0, loanTo: 200000, rate: 4.5000, useAdjust: false, user: 'ประภาส ทองสุข', date: '2024-09-28' },
    ],
  },
  {
    id: 'IR-50', code: 'INT50', name: 'INT50-สามัญเพิ่มสุข (ปันผล–เฉลี่ยคืน)', loanTypeIds: ['LP-50'],
    enabled: true, createdDate: '2025-09-15 13:20', createdBy: 'ประภาส ทองสุข',
    note: 'ผลิตภัณฑ์ชำระจากเงินปันผล/เฉลี่ยคืน',
    rates: [
      { effectiveDate: '2025-10-01', loanFrom: 0, loanTo: 500000, rate: 5.5000, useAdjust: false, user: 'จันทร์เพ็ญ มาลี', date: '2025-09-15' },
    ],
  },
  {
    id: 'IR-49', code: 'INX49', name: 'INX49-อัตราพิเศษ 49 (3.50%)', loanTypeIds: ['LP-30'],
    enabled: false, createdDate: '2024-10-05 08:55', createdBy: 'ประภาส ทองสุข',
    note: 'อัตราพิเศษเฉพาะโครงการ — ปิดใช้งานชั่วคราว',
    rates: [
      { effectiveDate: '2024-10-01', loanFrom: 0, loanTo: 9999999, rate: 3.5000, useAdjust: false, user: 'ประภาส ทองสุข', date: '2024-10-05' },
    ],
  },
];

// ════════════════════════════════════════════════════════════════════
//  ตัวช่วยใช้ร่วม — ให้เมนู “ประเภทเงินกู้” อ้างอิงรหัสตารางดอกเบี้ย
//  จากค่าคงที่อัตราดอกเบี้ยจริง (sync กัน) ไม่ใช่รายการตายตัว
//  อ่านจาก localStorage 'int_rates' (ที่หน้าอัตราดอกเบี้ยบันทึก) ก่อน
//  แล้วค่อย fallback ไปที่ IR_SEED — เพื่อให้สองเมนูทำงานสอดคล้องกัน
// ════════════════════════════════════════════════════════════════════
window.irList = function () {
  try {
    const saved = localStorage.getItem('int_rates');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.IR_SEED;
};

// ป้ายชื่อสั้นของตาราง เช่น "INT20 — สามัญปกติ"
window.irTableLabel = function (code) {
  const t = window.irList().find(r => r.code === code);
  if (!t) return (code || '—') + ' — (ไม่พบในค่าคงที่ดอกเบี้ย)';
  const shortName = (t.name || '').replace(/^[A-Z0-9]+-/, '');
  return t.code + ' — ' + shortName + (t.enabled ? '' : ' (ปิดใช้งาน)');
};

// ตัวเลือก dropdown ของรหัสตารางดอกเบี้ย — ดึงจากตารางจริง
//  แสดงเฉพาะที่เปิดใช้งาน + คงค่าที่เลือกอยู่ไว้เสมอ (กันค่าอ้างอิงเก่าหาย)
window.irTableOptions = function (includeValue) {
  const list = window.irList();
  const opts = list
    .filter(r => r.enabled || r.code === includeValue)
    .map(r => ({ v: r.code, l: window.irTableLabel(r.code) }));
  if (includeValue && !opts.some(o => o.v === includeValue)) {
    opts.push({ v: includeValue, l: includeValue + ' — (ไม่พบในค่าคงที่ดอกเบี้ย)' });
  }
  return opts;
};

// ── การผูกตารางอัตรากับประเภทเงินกู้ (1 ตาราง = 1 ประเภท / ประเภทมีหลายตารางได้) ──
window.irBoundTypeId = (t) => ((t && t.loanTypeIds) || [])[0] || '';
window.irLoanTypeName = (id) => {
  let list = [];
  try {
    const s = localStorage.getItem('loan_types');
    list = s ? JSON.parse(s) : (window.LP_SEED || []);
  } catch (e) { list = window.LP_SEED || []; }
  const p = list.find(x => x.id === id);
  return p ? p.code + ' — ' + p.name : '';
};
// ตารางทั้งหมดที่ผูกกับประเภทนี้ (ไม่รวมตารางของผลิตภัณฑ์เอง)
window.irTablesForType = function (typeId) {
  return window.irList().filter(t => !t.ownedBy && ((t.loanTypeIds || []).indexOf(typeId) >= 0));
};
// ตารางกลาง = ตารางที่ยังไม่ผูกกับประเภทใดเลย
window.irCentralTables = function () {
  return window.irList().filter(t => !t.ownedBy && !((t.loanTypeIds || []).length));
};
// ตัวเลือกสำหรับฟิลด์ “ตารางอัตราที่ใช้” ของแต่ละประเภท
window.irOptionsForType = function (typeId, includeValue) {
  const bound = window.irTablesForType(typeId);
  const central = window.irCentralTables();
  const seen = new Set();
  const opts = [];
  const push = (t, grp) => {
    if (seen.has(t.code)) return;
    seen.add(t.code);
    opts.push({ v: t.code, l: window.irTableLabel(t.code), grp });
  };
  bound.forEach(t => push(t, 'ตารางที่ผูกกับประเภทนี้'));
  central.forEach(t => push(t, 'ตารางกลาง (ยังไม่ผูกประเภท)'));
  if (includeValue && !seen.has(includeValue)) {
    opts.push({ v: includeValue, l: window.irTableLabel(includeValue), grp: 'ค่าที่ใช้อยู่เดิม' });
  }
  return opts;
};

// อัตราที่มีผลล่าสุดของตารางหนึ่ง — เลือกตามช่วงวงเงินถ้าระบุยอด
window.irLatestRate = function (code, amount) {
  const t = window.irList().find(r => r.code === code);
  if (!t || !t.rates || !t.rates.length) return null;
  let rows = t.rates.slice();
  if (amount != null && amount !== '') {
    const inRange = rows.filter(x => Number(amount) >= Number(x.loanFrom) && Number(amount) <= Number(x.loanTo));
    if (inRange.length) rows = inRange;
  }
  return rows.reduce((mx, x) => (!mx || x.effectiveDate > mx.effectiveDate) ? x : mx, null);
};
