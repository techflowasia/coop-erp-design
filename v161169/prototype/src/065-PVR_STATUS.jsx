// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ใบสำคัญจ่ายเงินรอจ่ายคืน (Payment Voucher / Receivable · PVR)
//  ทำงานเหมือน "ใบสำคัญจ่าย" แต่:
//   · แทน "รายการเบิกจ่ายงบประมาณ" ด้วย "รายการบัญชี" (เดบิต/เครดิต ผังบัญชี)
//   · Ref ใบสำคัญรับ ของเลขสมาชิกที่ลงบัญชี "รายการค้างรับ" ไว้ → ดึงมาตั้งจ่าย
//  ใช้ค่าคงที่ร่วมกับ data-voucher.js (ประเภทผู้รับเงิน · WHT · วิธีจ่าย · ธนาคาร)
// ════════════════════════════════════════════════════════════════════

// ─── สถานะเอกสาร + สายอนุมัติ (ชุดเดียวกับใบสำคัญจ่าย) ───────────────
window.PVR_STATUS = window.VCH_STATUS;
window.PVR_STATUS_ORDER = window.VCH_STATUS_ORDER;

// ─── บัญชี "ค้างรับ/เงินค้างจ่ายสมาชิก" (ฝั่งเดบิตเมื่อจ่ายล้างยอด) ────
//  ยอดที่สหกรณ์รับไว้แล้วบันทึกเป็นภาระต้องจ่ายคืน/ส่งมอบให้สมาชิก
//  (มุมมองสมาชิก = เงิน "ค้างรับ") บันทึกครั้งแรกผ่านใบสำคัญรับ
window.PVR_HOLD_ACCT = '29101';   // รายการค้างรับ (บัญชีตั้งต้น)

// ─── บัญชีเงินสด/ธนาคารฝั่งจ่าย ตามวิธีจ่าย ──────────────────────────
window.PVR_PAY_GL = { transfer: '110111', cheque: '110120', cash: '110101' };
window.pvrPayGl = (method) => window.PVR_PAY_GL[method] || '110111';

// ─── ชื่อบัญชีจากผังบัญชี ───────────────────────────────────────────
window.pvrAcctName = (code) => {
  if (!code) return '';
  if (String(code) === '29101') return 'เงินรอจ่ายคืน';
  return (window.coaAccountName && window.coaAccountName(String(code))) || '';
};

// ─── รายการบัญชีที่ลงรายการได้ (posting) สำหรับ datalist/เลือกบัญชี ──
window.pvrPostingAccounts = () => {
  const all = window.coaFlatAccounts ? window.coaFlatAccounts() : [];
  const posting = all.filter(a => a.kind === 'posting' && a.enabled);
  if (!posting.some(a => String(a.code) === '29101')) {
    posting.unshift({ code: '29101', name: 'เงินรอจ่ายคืน', kind: 'posting', enabled: true, catType: 'liability', level: 2 });
  }
  return posting;
};

// ════════════════════════════════════════════════════════════════════
//  รายการค้างรับที่ลงบัญชีไว้ผ่านใบสำคัญรับ (ตาม "เลขสมาชิก")
//  แต่ละรายการอ้างอิงเลขที่ใบสำคัญรับ (RV) ต้นทางที่บันทึกยอดค้างรับไว้
//  fields: id · rvNo · rvDate · memberNo · memberName · dept · bank · acctNo
//          · acct(GL ค้างรับ) · category · desc · outstanding
// ════════════════════════════════════════════════════════════════════
window.PVR_RECV_SEED = [
  { id: 'AR-001', rvNo: 'RV-2569-000031', rvDate: '2026-05-09', memberNo: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    dept: 'กองคลัง สำนักงานปลัด', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-04556-6',
    acct: '29101', category: 'dividend', desc: 'เงินปันผลค้างจ่ายสมาชิก ปี 2568', outstanding: 18030 },
  { id: 'AR-002', rvNo: 'RV-2569-000031', rvDate: '2026-05-09', memberNo: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    dept: 'กองคลัง สำนักงานปลัด', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-04556-6',
    acct: '29101', category: 'rebate', desc: 'เงินเฉลี่ยคืนค้างจ่าย ปี 2568', outstanding: 5240 },
  { id: 'AR-003', rvNo: 'RV-2569-000032', rvDate: '2026-05-20', memberNo: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม',
    dept: 'กองคลัง สำนักงานปลัด', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-04556-6',
    acct: '29101', category: 'deposit', desc: 'เงินรับฝากออมทรัพย์รอจ่ายคืน', outstanding: 42000 },

  { id: 'AR-011', rvNo: 'RV-2569-000041', rvDate: '2026-05-22', memberNo: 'M-058244', memberName: 'นางวิภา จันทร์เพ็ญ',
    dept: 'กองการศึกษา', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-03344-1',
    acct: '29101', category: 'dividend', desc: 'เงินปันผลค้างจ่ายสมาชิก ปี 2568', outstanding: 7600 },
  { id: 'AR-012', rvNo: 'RV-2569-000041', rvDate: '2026-05-22', memberNo: 'M-058244', memberName: 'นางวิภา จันทร์เพ็ญ',
    dept: 'กองการศึกษา', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-03344-1',
    acct: '29101', category: 'welfare', desc: 'เงินสวัสดิการสมาชิกค้างจ่าย', outstanding: 3000 },

  { id: 'AR-021', rvNo: 'RV-2569-000045', rvDate: '2026-05-28', memberNo: 'M-058243', memberName: 'นายอนุชา สุขสวัสดิ์',
    dept: 'กองช่าง', bank: 'ธ.ไทยพาณิชย์', branch: 'สาขาถนนสีลม', acctNo: '445-9-00112-2',
    acct: '29101', category: 'share', desc: 'ค่าหุ้นคืนค้างจ่าย (ปรับปรุงยอดหุ้น)', outstanding: 9925 },

  { id: 'AR-031', rvNo: 'RV-2569-000048', rvDate: '2026-06-02', memberNo: 'M-058245', memberName: 'นายธีรพงษ์ ขำเพชร',
    dept: 'กองคลัง', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-07788-9',
    acct: '29101', category: 'overpay', desc: 'รับชำระเกินรอจ่ายคืน (ใบสำคัญรับ)', outstanding: 21000 },
  { id: 'AR-032', rvNo: 'RV-2569-000050', rvDate: '2026-06-05', memberNo: 'M-058250', memberName: 'นางอรอนงค์ บุญมาก',
    dept: 'กองคลัง', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-06677-8',
    acct: '29101', category: 'dividend', desc: 'เงินปันผลค้างจ่ายสมาชิก ปี 2568', outstanding: 15400 },
];

// เลขบัตรประชาชนของสมาชิก (สำหรับค้นหา) — map ตามเลขสมาชิก
window.PVR_MEMBER_CID = {
  'M-058241': '3-1001-01542-11-2',
  'M-058243': '3-1005-00238-44-1',
  'M-058244': '3-1016-00591-77-2',
  'M-058245': '3-1020-00457-12-8',
  'M-058250': '3-1017-00238-90-3',
};

// หมวดรายการค้างรับ (label + chip tone)
window.PVR_RECV_CATS = {
  dividend: { l: 'เงินปันผลค้างจ่าย',      tone: 'primary' },
  rebate:   { l: 'เงินเฉลี่ยคืนค้างจ่าย',  tone: 'primary' },
  deposit:  { l: 'เงินรับฝากรอจ่ายคืน',    tone: 'info' },
  share:    { l: 'ค่าหุ้นคืนค้างจ่าย',     tone: 'info' },
  welfare:  { l: 'สวัสดิการค้างจ่าย',      tone: 'success' },
  overpay:  { l: 'รับชำระเกินรอจ่ายคืน',   tone: 'warning' },
};
window.pvrRecvCat = (v) => window.PVR_RECV_CATS[v] || { l: 'ค้างรับอื่น', tone: 'neutral' };

// ─── รายการค้างรับที่ยังไม่ถูกจ่าย (หักยอดที่จ่ายไปแล้วในใบ PVR) ──────
window.pvrPaidByItem = () => {
  const paid = {};
  (window.pvrLoad ? window.pvrLoad() : []).forEach(v => {
    if (v.status === 'cancelled') return;
    (v.refs || []).forEach(r => { paid[r.id] = (paid[r.id] || 0) + Number(r.amount || 0); });
  });
  return paid;
};
window.pvrRecvItems = () => {
  const paid = window.pvrPaidByItem();
  return window.PVR_RECV_SEED.map(it => {
    const used = paid[it.id] || 0;
    return { ...it, citizenId: window.PVR_MEMBER_CID[it.memberNo] || '', paid: used, remain: Math.max(0, Number(it.outstanding || 0) - used) };
  });
};
// รายการค้างรับตาม "เลขสมาชิก" (ที่ยังมียอดคงเหลือ)
window.pvrRecvByMember = (memberNo) => window.pvrRecvItems()
  .filter(it => it.memberNo === memberNo && it.remain > 0.005);

// รายชื่อสมาชิกที่มีรายการค้างรับ (สำหรับค้นหา)
window.pvrMembersWithRecv = () => {
  const by = {};
  window.pvrRecvItems().forEach(it => {
    if (it.remain <= 0.005) return;
    if (!by[it.memberNo]) by[it.memberNo] = { memberNo: it.memberNo, name: it.memberName, dept: it.dept, citizenId: window.PVR_MEMBER_CID[it.memberNo] || '', count: 0, total: 0 };
    by[it.memberNo].count += 1; by[it.memberNo].total += it.remain;
  });
  return Object.values(by);
};

// ════════════════════════════════════════════════════════════════════
//  การคำนวณรายการบัญชี (เดบิต/เครดิต)
// ════════════════════════════════════════════════════════════════════
window.pvrEntryTotals = (entries) => (entries || []).reduce((t, e) => {
  t.dr += Number(e.dr || 0); t.cr += Number(e.cr || 0); return t;
}, { dr: 0, cr: 0 });
window.pvrBalanced = (entries) => {
  const t = window.pvrEntryTotals(entries);
  return Math.abs(t.dr - t.cr) < 0.005 && (t.dr > 0 || t.cr > 0);
};

// สร้างรายการบัญชีอัตโนมัติจากรายการค้างรับที่อ้างอิง + ผู้รับเงิน
//  เดบิต: บัญชีค้างรับของแต่ละรายการ (ล้างภาระ)   เครดิต: เงินสด/ธนาคารฝั่งจ่าย
window.pvrAutoEntries = (doc) => {
  const refs = (doc.refs || []).filter(r => Number(r.amount) > 0);
  const entries = [];
  // เดบิต: รวมตามบัญชีค้างรับ
  const byAcct = {};
  refs.forEach(r => {
    const acct = r.acct || window.PVR_HOLD_ACCT;
    if (!byAcct[acct]) byAcct[acct] = { acct, dr: 0, refNo: r.rvNo || '', desc: window.pvrAcctName(acct) };
    byAcct[acct].dr += Number(r.amount || 0);
  });
  Object.values(byAcct).forEach(e => entries.push({ acct: e.acct, desc: e.desc, ref: e.refNo, dr: e.dr, cr: 0 }));
  // เครดิต: เงินสด/ธนาคาร แยกตามวิธีจ่ายของผู้รับเงิน
  const byGl = {};
  (doc.payees || []).forEach(p => {
    if (!(p.name || Number(p.amount))) return;
    const method = window.vchPayeeMethod(p, doc);
    const gl = window.pvrPayGl(method);
    if (!byGl[gl]) byGl[gl] = { gl, cr: 0 };
    byGl[gl].cr += Number(p.amount || 0);
  });
  Object.values(byGl).forEach(e => entries.push({ acct: e.gl, desc: 'จ่ายชำระ ' + window.pvrAcctName(e.gl), ref: '', dr: 0, cr: e.cr }));
  return entries;
};

// ─── เลขที่ใบสำคัญจ่ายเงินรอจ่ายคืนอัตโนมัติ: PVR-YYMM-XXXX (ปี พ.ศ. 2 หลัก) ─
window.pvrNextNo = (list, dateIso) => {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const prefix = `PVR-${yy}${mm}-`;
  let mx = 0;
  (list || []).forEach(v => {
    if (String(v.id).startsWith(prefix)) {
      const n = parseInt(String(v.id).slice(prefix.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return prefix + String(mx + 1).padStart(4, '0');
};

// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่ายเงินรอจ่ายคืนตัวอย่าง
//   refs:   [{ id, rvNo, memberNo, acct, category, desc, amount }]
//   payees: [{ type, code, name, bank, branch, acctNo, amount, wht, payMethod }]
//   entries:[{ acct, desc, ref, dr, cr }]
// ════════════════════════════════════════════════════════════════════
window.PVR_SEED = [
  {
    id: 'PVR-6906-0001', docDate: '2026-06-08', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'paid',
    note: 'จ่ายเงินปันผล–เฉลี่ยคืนค้างจ่าย ปี 2568 (อ้างอิงใบสำคัญรับ)',
    refs: [
      { id: 'AR-001', rvNo: 'RV-2569-000031', memberNo: 'M-058241', acct: '29101', category: 'dividend', desc: 'เงินปันผลค้างจ่ายสมาชิก ปี 2568', amount: 18030 },
      { id: 'AR-002', rvNo: 'RV-2569-000031', memberNo: 'M-058241', acct: '29101', category: 'rebate', desc: 'เงินเฉลี่ยคืนค้างจ่าย ปี 2568', amount: 5240 },
    ],
    payees: [
      { type: 'member', code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', bank: 'ธ.กรุงไทย', branch: 'สาขาราชการ', acctNo: '812-0-04556-6', amount: 23270, wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '' },
    ],
    entries: [
      { acct: '29101', desc: 'รายการค้างรับ', ref: 'RV-2569-000031', dr: 23270, cr: 0 },
      { acct: '110111', desc: 'ธ.กรุงไทย — ออมทรัพย์', ref: '', dr: 0, cr: 23270 },
    ],
    coopBank: 'ktb-002', payMethod: 'transfer', files: [],
  },
  {
    id: 'PVR-6906-0002', docDate: '2026-06-11', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'pending_appr',
    note: 'จ่ายคืนค่าหุ้นค้างจ่าย — ปรับปรุงยอดหุ้นสมาชิก',
    refs: [
      { id: 'AR-021', rvNo: 'RV-2569-000045', memberNo: 'M-058243', acct: '29101', category: 'share', desc: 'ค่าหุ้นคืนค้างจ่าย (ปรับปรุงยอดหุ้น)', amount: 9925 },
    ],
    payees: [
      { type: 'member', code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', bank: 'ธ.ไทยพาณิชย์', branch: 'สาขาถนนสีลม', acctNo: '445-9-00112-2', amount: 9925, wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '' },
    ],
    entries: [
      { acct: '29101', desc: 'รายการค้างรับ', ref: 'RV-2569-000045', dr: 9925, cr: 0 },
      { acct: '110111', desc: 'ธ.กรุงไทย — ออมทรัพย์', ref: '', dr: 0, cr: 9925 },
    ],
    coopBank: 'ktb-002', payMethod: 'transfer', files: [],
  },
  {
    id: 'PVR-6906-0003', docDate: '2026-06-13', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'draft',
    note: '',
    refs: [],
    payees: [{ type: 'member', code: '', name: '', bank: '', branch: '', acctNo: '', amount: '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '' }],
    entries: [{ acct: '', desc: '', ref: '', dr: '', cr: '' }],
    coopBank: '', payMethod: 'transfer', files: [],
  },
];

// ─── โหลด/บันทึก (localStorage) ─────────────────────────────────────
window.pvrLoad = () => {
  let list = null;
  try { const s = localStorage.getItem('vouchers_recv'); if (s) list = JSON.parse(s); } catch (e) {}
  const seed = JSON.parse(JSON.stringify(window.PVR_SEED || []));
  if (!list) return seed;
  const ids = new Set(list.map(v => v.id));
  const missing = seed.filter(s => !ids.has(s.id));
  return missing.length ? [...missing, ...list] : list;
};
window.pvrSave = (list) => { try { localStorage.setItem('vouchers_recv', JSON.stringify(list)); } catch (e) {} };
