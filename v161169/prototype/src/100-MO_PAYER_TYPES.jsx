// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — ธนาณัติ (Postal Money Order · รับธนาณัติ)
//  ────────────────────────────────────────────────────────────────────
//  บันทึกการรับชำระเงินของสมาชิกที่ส่งมาทางธนาณัติ/ตั๋วแลกเงินไปรษณีย์
//    • บันทึกเลขที่ธนาณัติ · วันที่บนธนาณัติ · รหัส/ชื่อไปรษณีย์ต้นทาง
//    • ระบุความประสงค์ชำระเงินเป็นรายการ (ชำระหนี้ / ค่าหุ้น / เงินฝาก ฯลฯ)
//    • ติดตามสถานะการขึ้นเงิน (รอขึ้นเงิน → ขึ้นเงินแล้ว / ตีคืน)
//  ใช้ DN_MEMBERS เป็นแหล่งข้อมูลสมาชิก (มี dept/deptCode/status/debts)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทผู้ชำระ ───────────────────────────────────────────────────
window.MO_PAYER_TYPES = [
  { v: 'member', l: 'สมาชิก' },
  { v: 'external', l: 'บุคคลภายนอก' },
];

// ─── ประเภทการชำระ (ตราสารไปรษณีย์) ─────────────────────────────────
window.MO_PAY_TYPES = ['ธนาณัติ', 'ธนาณัติออนไลน์', 'ตั๋วแลกเงินไปรษณีย์'];

// ─── สถานะการขึ้นเงิน (workflow) ─────────────────────────────────────
window.MO_CASH_STATUS = {
  pending:  { l: 'รอขึ้นเงิน',   pill: 'warn' },
  cashed:   { l: 'ขึ้นเงินแล้ว', pill: 'ok' },
  returned: { l: 'ตีคืน',        pill: 'bad' },
};
window.moCashStatus = (v) => window.MO_CASH_STATUS[v] || { l: v || '—', pill: 'neutral' };

// ─── ประเภทรายการความประสงค์ชำระเงิน (คอลัมน์ "ประเภท" ในตาราง) ──────
//  refLabel = ความหมายของช่อง "เลขที่ สัญญา/เงินฝาก" สำหรับประเภทนั้น
window.MO_DETAIL_TYPES = [
  { v: 'loan',     l: 'ชำระหนี้เงินกู้',        refLabel: 'เลขที่สัญญา' },
  { v: 'share',    l: 'ค่าหุ้นรายเดือน',         refLabel: 'ทะเบียนหุ้น' },
  { v: 'sharebuy', l: 'ซื้อหุ้นเพิ่ม',           refLabel: 'ทะเบียนหุ้น' },
  { v: 'saving',   l: 'ฝากออมทรัพย์',           refLabel: 'เลขที่บัญชี' },
  { v: 'savingsp', l: 'ฝากออมทรัพย์พิเศษ',      refLabel: 'เลขที่บัญชี' },
  { v: 'fee',      l: 'ค่าธรรมเนียม / ค่าปรับ',  refLabel: '—' },
  { v: 'other',    l: 'อื่น ๆ',                 refLabel: '—' },
];
window.moDetailType = (v) => window.MO_DETAIL_TYPES.find(t => t.v === v) || { v, l: v || '—', refLabel: '' };

// ─── หมวดของช่องอ้างอิงตาม "ประเภท" (ใช้กำหนดชุดข้อมูลที่ค้นหาได้) ───
//   loan → สัญญาเงินกู้ · share → ทะเบียนหุ้น · deposit → บัญชีเงินฝาก
window.moRefCategory = (type) => {
  if (type === 'loan') return 'loan';
  if (type === 'share' || type === 'sharebuy') return 'share';
  if (type === 'saving' || type === 'savingsp') return 'deposit';
  return null; // fee / other → ไม่มีเลขอ้างอิง
};

// ─── รายการอ้างอิงที่ค้นหาได้ (popup) — กรองตาม "ประเภท" ของแถว ───────
//   คืนรายการของสมาชิกที่เลือกเท่านั้น: สัญญาเงินกู้ / ทะเบียนหุ้น / บัญชีเงินฝาก
window.moRefCandidates = function (type, member) {
  const cat = window.moRefCategory(type);
  if (!cat || !member) return [];
  const money = (n) => (window.fmt ? window.fmt.money(n, 0) : String(n));
  const digits = String(member.code || '').replace(/\D/g, '').slice(-4).padStart(4, '0');

  if (cat === 'loan') {
    return (member.debts || []).map(d => ({
      ref: d.contractNo, label: d.type, status: d.status,
      sub: `คงเหลือ ฿${money(d.principalRemaining)} · งวด ${d.paidTerms}/${d.totalTerms}`,
    }));
  }
  if (cat === 'share') {
    return [{
      ref: 'SH-' + digits, label: 'ทะเบียนหุ้นสะสม',
      sub: `ทุนเรือนหุ้น ฿${money(member.shares || 0)} · ค่าหุ้นรายเดือน`,
    }];
  }
  if (cat === 'deposit') {
    const sp = type === 'savingsp';
    const kind = sp ? 'ออมทรัพย์พิเศษ' : 'ออมทรัพย์';
    const seed = parseInt(digits, 10) || 0;
    const bal = sp ? 20000 + (seed % 90) * 5000 : 8000 + (seed % 70) * 1300;
    const acc = sp
      ? `203-5-${digits}${(seed % 9)}-${(seed % 8)}`
      : `101-2-${digits}${(seed % 7)}-${(seed % 6)}`;
    const list = [{ ref: acc, label: kind, sub: `ยอดคงเหลือ ฿${money(bal)}` }];
    if (!sp) list.push({ ref: `101-2-${digits}${(seed % 5)}-9`, label: 'ออมทรัพย์ (บัญชีที่ 2)', sub: `ยอดคงเหลือ ฿${money(3000 + (seed % 40) * 900)}` });
    return list;
  }
  return [];
};

// ─── ที่ทำการไปรษณีย์ต้นทาง (รหัสไปรษณีย์ · ชื่อไปรษณีย์) ─────────────
window.MO_POST_OFFICES = [
  { zip: '25110', name: 'ปณ.กบินทร์บุรี' },
  { zip: '25000', name: 'ปณ.ปราจีนบุรี' },
  { zip: '10900', name: 'ปณ.หลักสี่' },
  { zip: '10210', name: 'ปณ.ดอนเมือง' },
  { zip: '10500', name: 'ปณ.บางรัก' },
  { zip: '50000', name: 'ปณ.เชียงใหม่' },
  { zip: '40000', name: 'ปณ.ขอนแก่น' },
  { zip: '90110', name: 'ปณ.หาดใหญ่' },
  { zip: '30000', name: 'ปณ.นครราชสีมา' },
  { zip: '20000', name: 'ปณ.ชลบุรี' },
];
window.moPostByZip = (zip) => window.MO_POST_OFFICES.find(p => p.zip === String(zip || '').trim()) || null;

// helper สร้างรายการความประสงค์
const _moi = (type, ref, detail, amount) => ({ type, ref: ref || '', detail: detail || '', amount: amount || 0 });

// ─── ข้อมูลตั้งต้น (seed) ────────────────────────────────────────────
window.MONEY_ORDER_SEED = [
  {
    id: 'MO-2569-0007', transferDate: '2026-02-25', moDate: '2026-02-25',
    payerType: 'member', memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข',
    deptCode: '0301', dept: 'กองช่าง',
    moNo: '6902250041', payType: 'ธนาณัติ', cashStatus: 'pending', fee: 0,
    postZip: '25110', postName: 'ปณ.กบินทร์บุรี',
    items: [
      _moi('loan', 'L-2022-0455', 'ชำระงวดค้าง 2 งวด (เงินต้น+ดอกเบี้ย)', 19360),
      _moi('share', 'SH-067012', 'ค่าหุ้นรายเดือน ก.พ. 2569', 1000),
    ],
    by: 'จันทร์เพ็ญ มาลี', createdAt: '2026-02-25T09:14:00',
  },
  {
    id: 'MO-2569-0006', transferDate: '2026-02-24', moDate: '2026-02-23',
    payerType: 'member', memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
    deptCode: '0501', dept: 'กองการศึกษา',
    moNo: '6902230118', payType: 'ธนาณัติ', cashStatus: 'cashed', fee: 0,
    postZip: '50000', postName: 'ปณ.เชียงใหม่',
    items: [
      _moi('loan', 'L-2021-0332', 'ชำระหนี้ตามหนังสือบอกกล่าว', 32000),
    ],
    by: 'จันทร์เพ็ญ มาลี', createdAt: '2026-02-24T10:42:00',
  },
  {
    id: 'MO-2569-0005', transferDate: '2026-02-20', moDate: '2026-02-19',
    payerType: 'member', memberCode: 'M-058246', memberName: 'นางสาวพรพิมล ทองคำ',
    deptCode: '0601', dept: 'กองสาธารณสุข',
    moNo: '6902190552', payType: 'ธนาณัติออนไลน์', cashStatus: 'cashed', fee: 20,
    postZip: '90110', postName: 'ปณ.หาดใหญ่',
    items: [
      _moi('savingsp', '203-5-11055-9', 'ฝากออมทรัพย์พิเศษ', 5000),
      _moi('share', 'SH-058246', 'ค่าหุ้นรายเดือน ก.พ. 2569', 500),
    ],
    by: 'สมหมาย รุ่งเรือง', createdAt: '2026-02-20T14:05:00',
  },
  {
    id: 'MO-2569-0004', transferDate: '2026-02-18', moDate: '2026-02-16',
    payerType: 'external', memberCode: '', memberName: 'นายทองใบ ชูสกุล (ทายาท)',
    deptCode: '', dept: '',
    moNo: '6902160073', payType: 'ธนาณัติ', cashStatus: 'returned', fee: 0,
    postZip: '30000', postName: 'ปณ.นครราชสีมา',
    items: [
      _moi('other', '', 'ชำระหนี้แทนสมาชิกผู้เสียชีวิต (ตีคืน — ยอดไม่ครบ)', 15000),
    ],
    by: 'จันทร์เพ็ญ มาลี', createdAt: '2026-02-18T11:20:00',
  },
];

// ─── helpers ─────────────────────────────────────────────────────────
window.moItemsTotal = (items) => (items || []).reduce((a, x) => a + (Number(x.amount) || 0), 0);
// ยอดสุทธิที่รับ = รวมรายการ − ค่าธรรมเนียม (ค่าธรรมเนียมหักจากยอดที่ขึ้นเงินได้)
window.moNetAmount = (rec) => window.moItemsTotal(rec.items) - (Number(rec.fee) || 0);

window.moLoad = function () {
  try { const s = localStorage.getItem('money_order_v1'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.MONEY_ORDER_SEED));
};
window.moSave = function (l) { try { localStorage.setItem('money_order_v1', JSON.stringify(l)); } catch (e) {} };

// เลขที่เอกสารถัดไป: MO-<พ.ศ.>-NNNN
window.moNextNo = function (list) {
  const be = new Date().getFullYear() + 543;
  const prefix = `MO-${be}-`;
  let max = 0;
  (list || []).forEach(r => {
    const m = String(r.id || '').match(/-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return prefix + String(max + 1).padStart(4, '0');
};
