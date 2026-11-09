// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ใบสำคัญจ่าย (Payment Voucher / PV)
//  ข้อมูลตั้งต้น: ผู้รับเงิน · เท็มเพลทคณะทำงาน · ภาษี/วิธีจ่าย/สถานะ
//  · ใบสำคัญจ่ายตัวอย่าง · ฐานยอดเบิกจ่ายสะสมต่อหมวด (ใช้คำนวณงบคงเหลือ)
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือกประเภทผู้รับเงิน ───────────────────────────────────────
window.VCH_PAYEE_TYPES = [
  { v: 'member',   l: 'สมาชิก' },
  { v: 'staff',    l: 'พนักงาน' },
  { v: 'vendor',   l: 'บุคคลภายนอก / คู่ค้า' },
  { v: 'group',    l: 'คณะทำงาน (เท็มเพลท)' },
];

// ─── ภาษีหัก ณ ที่จ่าย (WHT) ────────────────────────────────────────
window.VCH_WHT = [
  { v: '0',  l: 'ไม่หักภาษี',            rate: 0 },
  { v: '1',  l: '1% — ค่าขนส่ง/บริการรัฐ', rate: 1 },
  { v: '3',  l: '3% — ค่าบริการ/รับจ้างทำของ', rate: 3 },
  { v: '5',  l: '5% — ค่าเช่า/รางวัล',     rate: 5 },
  { v: '10', l: '10% — เงินปันผล',        rate: 10 },
];
window.vchWhtRate = (v) => {
  const found = window.VCH_WHT.find(x => x.v === v);
  if (found) return found.rate;
  const n = parseFloat(v);           // รองรับกรอกอัตรา % ได้อิสระ (เช่น 2, 7.5)
  return isFinite(n) && n > 0 ? n : 0;
};

// ─── วิธีการชำระเงิน ─────────────────────────────────────────────────
window.VCH_PAYMENT = [
  { v: 'transfer', l: 'โอนเงิน (Transfer)' },
  { v: 'cheque',   l: 'จ่ายเช็ค (Cheque)' },
  { v: 'cash',     l: 'เงินสด (Cash)' },
];

// ─── บัญชีธนาคารของสหกรณ์ (ฝั่งจ่าย) ────────────────────────────────
window.VCH_COOP_BANKS = [
  { v: 'kbank-001',  l: 'ธ.กสิกรไทย สาขาราชการ · 023-1-44521-0 (บัญชีจ่ายทั่วไป)' },
  { v: 'ktb-002',    l: 'ธ.กรุงไทย สาขาสำนักงานใหญ่ · 980-6-12233-7 (บัญชีสวัสดิการ)' },
  { v: 'gsb-003',    l: 'ธ.ออมสิน สาขาเทศบาล · 020-99-887766 (บัญชีลงทุน)' },
];

// ─── สถานะเอกสาร + สายอนุมัติ ───────────────────────────────────────
window.VCH_STATUS = {
  draft:        { l: 'ร่าง',                    pill: 'neutral', step: 0 },
  pending_check:{ l: 'รอตรวจสอบ',              pill: 'info',    step: 1 },
  pending_appr: { l: 'รอผู้อำนวยการอนุมัติ',    pill: 'warn',    step: 2 },
  approved:     { l: 'อนุมัติแล้ว / รอจ่ายเงิน', pill: 'info',    step: 3 },
  paid:         { l: 'จ่ายเงินแล้ว',            pill: 'ok',      step: 4 },
  cancelled:    { l: 'ยกเลิก',                  pill: 'bad',     step: -1 },
};
window.VCH_STATUS_ORDER = ['draft', 'pending_check', 'pending_appr', 'approved', 'paid', 'cancelled'];
// สถานะที่ถือว่า "ผูกพัน/ตัดงบแล้ว" — นำไปคำนวณยอดเบิกจ่ายสะสม
window.VCH_COMMITTED = ['pending_appr', 'approved', 'paid'];

// ─── ฐานข้อมูลผู้รับเงิน ─────────────────────────────────────────────
const VCH_BANKS = ['ธ.กสิกรไทย', 'ธ.กรุงไทย', 'ธ.ไทยพาณิชย์', 'ธ.กรุงเทพ', 'ธ.ออมสิน'];
function _acct(seed) {
  // เลขบัญชีจำลองคงที่ตาม seed
  let s = 0; for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) % 1000000;
  const a = String(100 + (s % 899)).padStart(3, '0');
  const b = String(s % 10);
  const c = String(10000 + (s % 89999)).padStart(5, '0');
  return `${a}-${b}-${c}-${(s % 9)}`;
}
function buildPayees() {
  const list = [];
  // สมาชิก — ดึงจากทะเบียนสมาชิก
  (window.MEMBERS_LIST || []).forEach(m => {
    list.push({
      id: 'PM-' + m.code, type: 'member', code: m.code, name: m.name,
      dept: m.dept, citizenId: m.citizenId,
      bank: VCH_BANKS[m.code.charCodeAt(m.code.length - 1) % VCH_BANKS.length],
      branch: 'สาขาราชการ', acctNo: _acct(m.code),
    });
  });
  // พนักงานสหกรณ์
  [
    ['EMP-001', 'นางจันทร์เพ็ญ มาลี', 'เจ้าหน้าที่ทะเบียน'],
    ['EMP-002', 'นายประสิทธิ์ คงทอง', 'ผู้จัดการสหกรณ์'],
    ['EMP-003', 'นางสาวิตรี อินทรโชติ', 'เจ้าหน้าที่การเงิน'],
    ['EMP-004', 'นายเกรียงไกร พูนผล', 'เจ้าหน้าที่บัญชี'],
  ].forEach(([code, name, dept]) => list.push({
    id: 'PE-' + code, type: 'staff', code, name, dept,
    bank: 'ธ.กรุงไทย', branch: 'สาขาสำนักงานใหญ่', acctNo: _acct(code),
  }));
  // บุคคลภายนอก / คู่ค้า
  [
    ['VEN-101', 'บจก. ไอทีโซลูชั่น ซิสเต็มส์', 'ผู้พัฒนาระบบสารสนเทศ'],
    ['VEN-102', 'หจก. ศรีสมบูรณ์ เครื่องเขียน', 'จำหน่ายวัสดุสำนักงาน'],
    ['VEN-103', 'บจก. เพาเวอร์เน็ต คอมพิวเตอร์', 'จำหน่ายครุภัณฑ์คอมพิวเตอร์'],
    ['VEN-104', 'การไฟฟ้าส่วนภูมิภาค', 'ค่าสาธารณูปโภค'],
    ['VEN-105', 'บจก. รักษ์ความสะอาด เซอร์วิส', 'บริการทำความสะอาด'],
  ].forEach(([code, name, dept]) => list.push({
    id: 'PV-' + code, type: 'vendor', code, name, dept,
    bank: 'ธ.ไทยพาณิชย์', branch: 'สาขาถนนสีลม', acctNo: _acct(code),
  }));
  return list;
}
window.VCH_PAYEES = buildPayees();
window.vchPayee = (id) => (window.VCH_PAYEES || []).find(p => p.id === id) || null;

// ─── เท็มเพลทคณะทำงาน / ชุดข้อมูลบุคคล ───────────────────────────────
// เลือกแล้วระบบจะ "แสตมป์" รายชื่อสมาชิกในคณะมาเป็นบรรทัดเบิกจ่าย
window.VCH_GROUPS_SEED = [
  {
    id: 'WG-001', name: 'คณะกรรมการดำเนินการ ชุดที่ 25',
    note: 'เบี้ยประชุมกรรมการดำเนินการ', defaultCat: 'B5301', defaultAmount: 2000, defaultWht: '0',
    members: [
      { name: 'นายประสิทธิ์ คงทอง',  role: 'ประธานกรรมการ',       bank: 'ธ.กรุงไทย',    acctNo: '980-1-22033-1' },
      { name: 'นายสมชาย ใจดี รักษ์ออม', role: 'รองประธานกรรมการ',  bank: 'ธ.กสิกรไทย',   acctNo: '023-4-55121-2' },
      { name: 'นางสาวกานต์ ศิริวงศ์',  role: 'กรรมการและเลขานุการ', bank: 'ธ.ไทยพาณิชย์', acctNo: '405-3-99812-5' },
      { name: 'นายอนุชา สุขสวัสดิ์',   role: 'กรรมการ',            bank: 'ธ.กรุงเทพ',    acctNo: '111-2-33445-7' },
      { name: 'นางวิภา จันทร์เพ็ญ',    role: 'กรรมการ',            bank: 'ธ.กรุงไทย',    acctNo: '980-6-77881-3' },
    ],
  },
  {
    id: 'WG-002', name: 'คณะอนุกรรมการพิจารณาเงินกู้',
    note: 'เบี้ยประชุมอนุกรรมการเงินกู้', defaultCat: 'B5301', defaultAmount: 1500, defaultWht: '0',
    members: [
      { name: 'นายธีรพงษ์ ขำเพชร',    role: 'ประธานอนุกรรมการ', bank: 'ธ.ออมสิน',   acctNo: '020-99-11223' },
      { name: 'นางสาวพรพิมล ทองคำ',   role: 'อนุกรรมการ',       bank: 'ธ.กสิกรไทย', acctNo: '023-7-44556' },
      { name: 'นายวีรชัย พิทักษ์ธรรม', role: 'อนุกรรมการ',       bank: 'ธ.กรุงไทย',  acctNo: '980-3-66778' },
    ],
  },
  {
    id: 'WG-003', name: 'คณะทำงานจัดประชุมใหญ่สามัญประจำปี',
    note: 'ค่าตอบแทนคณะทำงานจัดประชุมใหญ่', defaultCat: 'B5302', defaultAmount: 1200, defaultWht: '0',
    members: [
      { name: 'นางสาวศิริพร ใจงาม',    role: 'หัวหน้าคณะทำงาน', bank: 'ธ.ไทยพาณิชย์', acctNo: '405-1-22008' },
      { name: 'นายสุรชัย วงศ์ประเสริฐ', role: 'คณะทำงาน',       bank: 'ธ.กรุงเทพ',    acctNo: '111-9-88776' },
      { name: 'นางอรอนงค์ บุญมาก',     role: 'คณะทำงาน',        bank: 'ธ.ออมสิน',     acctNo: '020-99-33445' },
      { name: 'นายภาคภูมิ รัตนา',       role: 'คณะทำงาน/เลขานุการ', bank: 'ธ.กสิกรไทย', acctNo: '023-2-77665' },
    ],
  },
];

// ─── ยอดเบิกจ่ายสะสมตั้งต้นต่อหมวด (ก่อนนับใบสำคัญจ่ายในระบบ) ─────────
// ใช้ประกอบการคำนวณงบคงเหลือ: คงเหลือ = อนุมัติทั้งปี − (ฐานนี้ + ใบที่ตัดงบแล้ว)
window.VCH_SPENT_BASE = {
  B5101: 2400000, B5102: 120000, B5103: 210000,
  B5201: 130000,  B5202: 64000,  B5203: 38000,
  B5301: 180000,  B5302: 90000,
  B6101: 350000,  B6102: 120000, B6201: 40000,  B6202: 0,
  B7101: 420000,  B7102: 120000, B7103: 0,
};

// ─── ใบสำคัญจ่ายตัวอย่าง ─────────────────────────────────────────────
// payees: [{ type, payeeId, code, name, bank, branch, acctNo, amount }]
// lines:  [{ cat, desc, amount, vat, wht }]  (ตัดงบตามหมวดย่อย)
// ใบตัวอย่างผู้รับเงิน 20 ราย (ค่าเบี้ยประชุมคณะทำงาน) — ใช้ทดสอบหน้าพิมพ์ 1 หน้า A4
const VCH_SAMPLE20 = (() => {
  const P = [
    ['001024','นายประสิทธิ์ คงทอง','ธ.กรุงไทย','สาขาบางรัก'], ['001187','นายสมชาย ใจดี รักษ์ออม','ธ.กสิกรไทย','สาขาสีลม'],
    ['001302','นางสุนีย์ วงศ์สกุล','ธ.กรุงไทย','สาขาแจ้งวัฒนะ'], ['001455','นายวิชัย เรืองศรี','ธ.ไทยพาณิชย์','สาขาหลักสี่'],
    ['001521','นางสาวมาลี สุขใจ','ธ.กรุงเทพ','สาขาบางเขน'], ['001640','นายธนพล ศรีสวัสดิ์','ธ.กรุงไทย','สาขาบางรัก'],
    ['001718','นางอรุณี พรหมมา','ธ.ออมสิน','สาขาหลักสี่'], ['001806','นายกิตติ ชัยมงคล','ธ.กสิกรไทย','สาขาสีลม'],
    ['001922','นางสาวพิมพ์ชนก แสงทอง','ธ.กรุงไทย','สาขาแจ้งวัฒนะ'], ['002035','นายณัฐวุฒิ บุญมา','ธ.ไทยพาณิชย์','สาขาหลักสี่'],
    ['002117','นางวราภรณ์ ทองดี','ธ.กรุงเทพ','สาขาบางเขน'], ['002208','นายสุรเชษฐ์ อินทร์แก้ว','ธ.กรุงไทย','สาขาบางรัก'],
    ['002341','นางสาวกนกวรรณ ศรีงาม','ธ.ออมสิน','สาขาหลักสี่'], ['002419','นายอนุชา พลเยี่ยม','ธ.กสิกรไทย','สาขาสีลม'],
    ['002503','นางปราณี ขำวงษ์','ธ.กรุงไทย','สาขาแจ้งวัฒนะ'], ['002688','นายชัยวัฒน์ มีสุข','ธ.ไทยพาณิชย์','สาขาหลักสี่'],
    ['002751','นางสาวรัตนา คำภา','ธ.กรุงเทพ','สาขาบางเขน'], ['002839','นายเอกชัย ทองสุข','ธ.กรุงไทย','สาขาบางรัก'],
    ['002904','นางจิราพร แก้วมณี','ธ.ออมสิน','สาขาหลักสี่'], ['003016','นายปิยะ วงศ์ไทย','ธ.กสิกรไทย','สาขาสีลม'],
  ];
  const payees = P.map(([code, name, bank, branch], i) => {
    const chair = i === 0;
    const travel = i % 3 !== 2;
    const items = [
      { label: chair ? 'ค่าเบี้ยประชุม (ประธาน) ครั้งที่ 10/2569' : 'ค่าเบี้ยประชุมคณะทำงาน ครั้งที่ 10/2569', amount: chair ? 2000 : 1500, cat: 'B5301', acct: '' },
      ...(travel ? [{ label: 'ค่าพาหนะเดินทางเข้าร่วมประชุม', amount: 600, cat: 'B5301', acct: '' }] : []),
    ];
    const pm = i < 16 ? 'transfer' : i < 18 ? 'cash' : 'cheque';
    return { type: 'member', payeeId: '', code, name, bank: pm === 'transfer' ? bank : '', branch: pm === 'transfer' ? branch : '',
      acctNo: pm === 'transfer' ? ('9' + code.slice(1) + '-' + (i % 9) + '-' + String(10000 + i * 137).slice(0, 5)) : '',
      amount: items.reduce((a, it) => a + it.amount, 0), wht: '0', payMethod: pm,
      chequeNo: pm === 'cheque' ? ('20018' + (40 + i)) : '', chequeDate: pm === 'cheque' ? '2026-10-20' : '', items };
  });
  const sum = (pred) => payees.reduce((a, p) => a + p.items.filter(pred).reduce((b, it) => b + it.amount, 0), 0);
  return {
    id: 'PV-6910-0045', docDate: '2026-10-16', dueDate: '2026-10-20', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payType: 'committee', committeeName: 'คณะทำงานพัฒนาระบบเงินฝาก ชุดที่ 3',
    payees, payMethod: 'transfer', coopBank: '', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'draft', files: [],
    note: 'ตัวอย่างใบสำคัญจ่ายผู้รับเงิน 20 ราย — ค่าเบี้ยประชุมและค่าพาหนะคณะทำงานพัฒนาระบบเงินฝาก ครั้งที่ 10/2569 ประชุมวันที่ 15/10/2569 ณ ห้องประชุมชั้น 3 อาคารสำนักงานใหญ่',
    lines: [
      { cat: 'B5301', desc: 'ค่าเบี้ยประชุมคณะทำงาน ครั้งที่ 10/2569', amount: sum(it => /เบี้ยประชุม/.test(it.label)), vat: 0, wht: '0' },
      { cat: 'B5301', desc: 'ค่าพาหนะเดินทางเข้าร่วมประชุม', amount: sum(it => /พาหนะ/.test(it.label)), vat: 0, wht: '0' },
    ],
  };
})();

window.VCH_SEED = [
  VCH_SAMPLE20,
  {
    id: 'PV-6909-0031', docDate: '2026-09-24', dueDate: '2026-09-30', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payType: 'committee', committeeName: 'คณะกรรมการดำเนินการ ชุดที่ 42',
    payees: [
      { type: 'member', payeeId: '', code: '001024', name: 'นายประสิทธิ์ คงทอง', bank: 'ธ.กรุงไทย', branch: 'สาขาบางรัก', acctNo: '980-1-22033-1',
        amount: 2400, wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '',
        items: [
          { label: 'ค่าเบี้ยประชุมคณะกรรมการ ครั้งที่ 9/2569', amount: 1500, cat: 'B5301', acct: '' },
          { label: 'ค่าพาหนะเดินทางเข้าร่วมประชุม', amount: 600, cat: 'B5301', acct: '' },
          { label: 'ค่าอาหารว่างและเครื่องดื่ม', amount: 300, cat: 'B5302', acct: '' },
        ] },
      { type: 'member', payeeId: '', code: '001187', name: 'นายสมชาย ใจดี รักษ์ออม', bank: 'ธ.กสิกรไทย', branch: 'สาขาสีลม', acctNo: '023-4-55121-2',
        amount: 2100, wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '',
        items: [
          { label: 'ค่าเบี้ยประชุมคณะกรรมการ ครั้งที่ 9/2569', amount: 1500, cat: 'B5301', acct: '' },
          { label: 'ค่าพาหนะเดินทางเข้าร่วมประชุม', amount: 600, cat: 'B5301', acct: '' },
        ] },
    ],
    payMethod: 'transfer', coopBank: '', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'draft', note: 'ตัวอย่างใบสำคัญจ่ายที่มีรายการแจกแจง — ค่าเบี้ยประชุมคณะกรรมการ ครั้งที่ 9/2569',
    files: [],
    lines: [
      { cat: 'B5301', desc: 'ค่าเบี้ยประชุมคณะกรรมการ ครั้งที่ 9/2569', amount: 3000, vat: 0, wht: '0' },
      { cat: 'B5301', desc: 'ค่าพาหนะเดินทางเข้าร่วมประชุม', amount: 1200, vat: 0, wht: '0' },
      { cat: 'B5302', desc: 'ค่าอาหารว่างและเครื่องดื่ม', amount: 300, vat: 0, wht: '0' },
    ],
  },
  {
    id: 'PV-6905-0012', docDate: '2026-05-08', dueDate: '2026-05-15', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payees: [
      { type: 'vendor', payeeId: 'PV-VEN-101', code: 'VEN-101', name: 'บจก. ไอทีโซลูชั่น ซิสเต็มส์', bank: 'ธ.ไทยพาณิชย์', branch: 'สาขาถนนสีลม', acctNo: '405-2-31180-7', amount: 600000, wht: '3' },
    ],
    payMethod: 'transfer', coopBank: 'gsb-003', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'paid', note: 'งวดที่ 2 โครงการพัฒนาระบบ ERP',
    files: ['ใบแจ้งหนี้_ITSolution_งวด2.pdf', 'ใบส่งมอบงาน.pdf'],
    lines: [
      { cat: 'B6101', desc: 'ค่าพัฒนาระบบ ERP งวดที่ 2', amount: 600000, vat: 7, wht: '3' },
    ],
  },
  {
    id: 'PV-6905-0018', docDate: '2026-05-20', dueDate: '2026-05-25', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payees: [
      { type: 'member', payeeId: '', code: '', name: 'นายประสิทธิ์ คงทอง',  bank: 'ธ.กรุงไทย',    branch: '', acctNo: '980-1-22033-1', amount: 2000, payMethod: 'transfer' },
      { type: 'member', payeeId: '', code: '', name: 'นายสมชาย ใจดี รักษ์ออม', bank: 'ธ.กสิกรไทย',   branch: '', acctNo: '023-4-55121-2', amount: 2000, payMethod: 'transfer' },
      { type: 'member', payeeId: '', code: '', name: 'นางสาวกานต์ ศิริวงศ์',  bank: 'ธ.ไทยพาณิชย์', branch: '', acctNo: '405-3-99812-5', amount: 2000, payMethod: 'cash' },
      { type: 'member', payeeId: '', code: '', name: 'นายอนุชา สุขสวัสดิ์',   bank: 'ธ.กรุงเทพ',    branch: '', acctNo: '111-2-33445-7', amount: 2000, payMethod: 'cheque', chequeNo: '04418871', chequeDate: '2026-05-20' },
      { type: 'member', payeeId: '', code: '', name: 'นางวิภา จันทร์เพ็ญ',    bank: 'ธ.กรุงไทย',    branch: '', acctNo: '980-6-77881-3', amount: 2000, payMethod: 'transfer' },
    ],
    payMethod: 'transfer', coopBank: 'kbank-001', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'approved', note: 'เบี้ยประชุมกรรมการ ครั้งที่ 5/2569 — คณะกรรมการดำเนินการ ชุดที่ 25',
    files: ['รายงานการประชุม_5-2569.pdf'],
    lines: [
      { cat: 'B5301', desc: 'เบี้ยประชุมกรรมการดำเนินการ ครั้งที่ 5/2569', amount: 10000, vat: 0, wht: '0' },
    ],
  },
  {
    id: 'PV-6906-0003', docDate: '2026-06-02', dueDate: '2026-06-09', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payees: [
      { type: 'vendor', payeeId: 'PV-VEN-104', code: 'VEN-104', name: 'การไฟฟ้าส่วนภูมิภาค', bank: 'ธ.กรุงไทย', branch: 'สาขาเทศบาล', acctNo: '980-0-55512-9', amount: 28500 },
    ],
    payMethod: 'cheque', coopBank: 'kbank-001', chequeNo: '04412235', chequeBank: 'ธ.กสิกรไทย', chequeDate: '2026-06-09',
    status: 'pending_appr', note: 'ค่าไฟฟ้าสำนักงาน เดือน พ.ค. 2569',
    files: ['ใบแจ้งค่าไฟ_พค69.pdf'],
    lines: [
      { cat: 'B5201', desc: 'ค่ากระแสไฟฟ้าสำนักงาน พ.ค. 69', amount: 28500, vat: 7, wht: '0' },
    ],
  },
  {
    id: 'PV-6904-0021', docDate: '2026-04-18', dueDate: '2026-04-25', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payees: [
      { type: 'member', payeeId: '', code: '', name: 'นายประสิทธิ์ คงทอง',  bank: 'ธ.กรุงไทย',    branch: '', acctNo: '980-1-22033-1', amount: 2000, payMethod: 'transfer' },
      { type: 'member', payeeId: '', code: '', name: 'นายสมชาย ใจดี รักษ์ออม', bank: 'ธ.กสิกรไทย',   branch: '', acctNo: '023-4-55121-2', amount: 2000, payMethod: 'cash' },
      { type: 'member', payeeId: '', code: '', name: 'นางสาวกานต์ ศิริวงศ์',  bank: 'ธ.ไทยพาณิชย์', branch: '', acctNo: '405-3-99812-5', amount: 2000, payMethod: 'transfer' },
      { type: 'member', payeeId: '', code: '', name: 'นายอนุชา สุขสวัสดิ์',   bank: 'ธ.กรุงเทพ',    branch: '', acctNo: '111-2-33445-7', amount: 2000, payMethod: 'transfer' },
      { type: 'member', payeeId: '', code: '', name: 'นางวิภา จันทร์เพ็ญ',    bank: 'ธ.กรุงไทย',    branch: '', acctNo: '980-6-77881-3', amount: 2000, payMethod: 'transfer' },
    ],
    payMethod: 'transfer', coopBank: 'kbank-001', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'paid', note: 'เบี้ยประชุมกรรมการ ครั้งที่ 4/2569 — คณะกรรมการดำเนินการ ชุดที่ 25',
    files: ['รายงานการประชุม_4-2569.pdf'],
    lines: [
      { cat: 'B5301', desc: 'เบี้ยประชุมกรรมการดำเนินการ ครั้งที่ 4/2569', amount: 10000, vat: 0, wht: '0' },
    ],
  },
  {
    id: 'PV-6906-0007', docDate: '2026-06-05', dueDate: '2026-06-12', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payees: [
      { type: 'vendor', payeeId: 'PV-VEN-102', code: 'VEN-102', name: 'หจก. ศรีสมบูรณ์ เครื่องเขียน', bank: 'ธ.ไทยพาณิชย์', branch: 'สาขาถนนสีลม', acctNo: '405-8-99001-2', amount: 24600 },
    ],
    payMethod: 'transfer', coopBank: 'kbank-001', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'draft', note: 'จัดซื้อวัสดุสำนักงานประจำไตรมาส',
    files: [],
    lines: [
      { cat: 'B5202', desc: 'กระดาษ A4 และหมึกพิมพ์', amount: 18200, vat: 7, wht: '0' },
      { cat: 'B5202', desc: 'แฟ้มเอกสารและอุปกรณ์',   amount: 6400,  vat: 7, wht: '0' },
    ],
  },
  {
    id: 'PV-6906-0010', docDate: '2026-06-08', dueDate: '2026-06-15', createdBy: 'นางจันทร์เพ็ญ มาลี',
    payees: [
      { type: 'vendor', payeeId: '', code: '', name: 'นายสมเกียรติ วิชาการ',  bank: 'ธ.กรุงเทพ',   branch: '', acctNo: '111-4-55620-8', amount: 20000, wht: '3' },
      { type: 'vendor', payeeId: '', code: '', name: 'ผศ.ดร.มานพ เรืองปัญญา', bank: 'ธ.กสิกรไทย', branch: '', acctNo: '023-9-77410-2', amount: 20000, wht: '3' },
    ],
    payMethod: 'transfer', coopBank: 'kbank-001', chequeNo: '', chequeBank: '', chequeDate: '',
    status: 'approved', note: 'ค่าตอบแทนวิทยากรอบรมหลักสูตรการบริหารความเสี่ยง 8 มิ.ย. 2569',
    files: ['กำหนดการอบรม_ความเสี่ยง.pdf'],
    lines: [
      { cat: 'B5301', desc: 'ค่าตอบแทนวิทยากร (2 ท่าน)', amount: 40000, vat: 0, wht: '3' },
    ],
  },
];

// ─── คำนวณภาษี/สุทธิของบรรทัด ───────────────────────────────────────
window.vchLineCalc = (line) => {
  const base = Number(line.amount || 0);
  const vatAmt = base * Number(line.vat || 0) / 100;
  const whtAmt = base * window.vchWhtRate(line.wht) / 100;
  const net = base + vatAmt - whtAmt;
  return { base, vatAmt, whtAmt, net };
};
window.vchTotals = (lines) => {
  return (lines || []).reduce((t, l) => {
    const c = window.vchLineCalc(l);
    t.base += c.base; t.vat += c.vatAmt; t.wht += c.whtAmt; t.net += c.net;
    return t;
  }, { base: 0, vat: 0, wht: 0, net: 0 });
};
// ยอดรวมผู้รับเงินทั้งหมด
window.vchPayeeTotal = (payees) => (payees || []).reduce((s, p) => s + Number(p.amount || 0), 0);

// ─── วิธีรับเงินรายบุคคล ─────────────────────────────────────────────
// ผู้รับเงินแต่ละรายเลือกวิธีรับเงินได้เอง (โอน/เช็ค/เงินสด) — ใบเก่าที่ยัง
// ไม่ระบุรายบุคคล จะ fallback ไปใช้ค่า payMethod รวมของทั้งใบ
window.vchPayeeMethod = (p, v) => (p && p.payMethod) ? p.payMethod : ((v && v.payMethod) || 'transfer');
window.vchPayMethodLabel = (m) => (window.VCH_PAYMENT.find(x => x.v === m) || {}).l || '—';
// สรุปจำนวน/ยอดเงินแยกตามวิธีรับเงิน — [{ v, l, count, amount }]
window.vchMethodBreakdown = (voucher) => {
  const payees = ((voucher || {}).payees || []).filter(p => p.name || Number(p.amount));
  return window.VCH_PAYMENT.map(m => {
    const rows = payees.filter(p => window.vchPayeeMethod(p, voucher) === m.v);
    return { v: m.v, l: m.l, count: rows.length, amount: rows.reduce((s, p) => s + Number(p.amount || 0), 0) };
  }).filter(x => x.count > 0);
};

// ─── รายการรับเงินของสมาชิก จากใบสำคัญจ่ายทั้งหมด ────────────────────
// ใช้แสดงในแท็บ "จ่ายเบี้ยประชุม" ของหน้ารายละเอียดสมาชิก
// จับคู่ผู้รับเงินตามชื่อ (หรือรหัสสมาชิก) → คืน { voucher, payee, payeeIdx }
window.vchMemberReceipts = (member) => {
  if (!member) return [];
  const name = (member.name || '').trim();
  const code = (member.code || '').trim();
  const vouchers = window.vchLoadVouchers ? window.vchLoadVouchers() : (window.VCH_SEED || []);
  const out = [];
  (vouchers || []).forEach(v => {
    if (v.status === 'cancelled') return;
    (v.payees || []).forEach((p, idx) => {
      const pname = (p.name || '').trim();
      const pcode = (p.code || '').trim();
      if (!((name && pname === name) || (code && pcode && pcode === code))) return;
      out.push({ voucher: v, payee: p, payeeIdx: idx });
    });
  });
  return out.sort((a, b) => String(b.voucher.docDate || '').localeCompare(String(a.voucher.docDate || '')));
};

// ─── เลขที่ใบสำคัญจ่ายอัตโนมัติ: PV-YYMM-XXXX (ปี พ.ศ. 2 หลัก) ────────
window.vchNextNo = (vouchers, dateIso) => {
  const d = dateIso ? new Date(dateIso) : new Date();
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const prefix = `PV-${yy}${mm}-`;
  let mx = 0;
  (vouchers || []).forEach(v => {
    if (String(v.id).startsWith(prefix)) {
      const n = parseInt(String(v.id).slice(prefix.length), 10);
      if (!isNaN(n) && n > mx) mx = n;
    }
  });
  return prefix + String(mx + 1).padStart(4, '0');
};

// ─── แปลงเลขเป็นข้อความภาษาไทย (บาท/สตางค์) สำหรับใบสำคัญจ่าย ─────────
window.bahtText = (num) => {
  num = Math.round(Number(num || 0) * 100) / 100;
  if (num === 0) return 'ศูนย์บาทถ้วน';
  const txt = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const pos = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  const readChunk = (s) => {
    let r = '';
    const len = s.length;
    for (let i = 0; i < len; i++) {
      const dgt = parseInt(s[i], 10);
      const p = len - i - 1;
      if (dgt === 0) continue;
      if (p === 0 && dgt === 1 && len > 1) r += 'เอ็ด';
      else if (p === 1 && dgt === 2) r += 'ยี่' + pos[p];
      else if (p === 1 && dgt === 1) r += pos[p];
      else r += txt[dgt] + pos[p];
    }
    return r;
  };
  const read = (n) => {
    let s = String(n);
    let out = '';
    while (s.length > 6) {
      const head = s.slice(0, s.length - 6);
      const tail = s.slice(s.length - 6);
      out += readChunk(head) + 'ล้าน';
      s = tail.replace(/^0+/, '') || '0';
      if (s === '0') break;
    }
    out += readChunk(s);
    return out;
  };
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);
  let res = '';
  if (baht > 0) res += read(baht) + 'บาท';
  if (satang > 0) res += read(satang) + 'สตางค์';
  else res += 'ถ้วน';
  return res;
};

// ════════════════════════════════════════════════════════════════════
//  หนังสือรับรองการหักภาษี ณ ที่จ่าย (ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร)
//  ออกตามรายบุคคล โดยอ้างอิงรายการในใบสำคัญจ่าย
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทเงินได้พึงประเมินตามแบบฟอร์มราชการ (50 ทวิ) ───────────────
window.VCH_INCOME_SECTIONS = [
  { key: '1',  no: '1.',     label: 'เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)' },
  { key: '2',  no: '2.',     label: 'ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)' },
  { key: '3',  no: '3.',     label: 'ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)' },
  { key: '4a', no: '4. (ก)', label: 'ดอกเบี้ย เงินฝาก เงินกู้ยืม ฯลฯ ตามมาตรา 40 (4) (ก)' },
  { key: '4b', no: '4. (ข)', label: 'เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4) (ข)' },
  { key: '5',  no: '5.',     label: 'การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่ายตามคำสั่งกรมสรรพากร เช่น ค่าจ้างทำของ ค่าบริการ ค่าเช่า ค่าขนส่ง ค่าโฆษณา รางวัล ส่วนลด ฯลฯ' },
  { key: '6',  no: '6.',     label: 'อื่น ๆ (ระบุ)' },
];
window.VCH_INCOME_SECTION = (k) => window.VCH_INCOME_SECTIONS.find(s => s.key === k) || window.VCH_INCOME_SECTIONS[6];

// แมปอัตราหัก ณ ที่จ่าย → ประเภทเงินได้ + คำอธิบายตั้งต้นบนหนังสือรับรอง
window.VCH_WHT_INCOME_MAP = {
  '1':  { section: '5', detail: 'ค่าขนส่ง / ค่าบริการ' },
  '3':  { section: '5', detail: 'ค่าจ้างทำของ / ค่าบริการ' },
  '5':  { section: '5', detail: 'ค่าเช่า / รางวัล' },
  '10': { section: '4b', detail: 'เงินปันผล / เงินเฉลี่ยคืน' },
};

// แบบยื่นรายการ (ภ.ง.ด.) ตามแบบฟอร์มราชการ — 7 ตัวเลือก
window.VCH_PND_TYPES = ['ภ.ง.ด.1ก', 'ภ.ง.ด.1ก พิเศษ', 'ภ.ง.ด.2', 'ภ.ง.ด.3', 'ภ.ง.ด.2ก', 'ภ.ง.ด.3ก', 'ภ.ง.ด.53'];
window.VCH_PAYER_CONDITIONS = [
  { v: '1', l: 'หัก ณ ที่จ่าย' },
  { v: '2', l: 'ออกภาษีให้ตลอดไป' },
  { v: '3', l: 'ออกให้ครั้งเดียว' },
  { v: '4', l: 'อื่น ๆ (ระบุ)' },
];

// ─── ข้อมูลสหกรณ์ (ผู้มีหน้าที่หักภาษี ณ ที่จ่าย) ─────────────────────
window.vchCoopInfo = () => {
  try { const s = localStorage.getItem('coop_info'); if (s) return JSON.parse(s); } catch (e) {}
  return { ...(window.COOP_INFO_DEFAULTS || {}) };
};

// ─── เลขประจำตัวผู้เสียภาษีจำลอง (กรณีไม่มีในฐานข้อมูล) ───────────────
window.vchMockTaxId = (seed) => {
  let s = 0; const str = String(seed || '0');
  for (let i = 0; i < str.length; i++) s = (s * 33 + str.charCodeAt(i)) >>> 0;
  let out = '';
  for (let i = 0; i < 13; i++) { out += String(s % 10); s = Math.floor(s / 10) + (s % 7) * 7 + i; }
  return out;
};
// ค้นเลขประจำตัวผู้เสียภาษี/บัตรประชาชนของผู้รับเงิน
window.vchResolveTaxId = (payee) => {
  if (!payee) return '';
  if (payee.citizenId) return String(payee.citizenId).replace(/\D/g, '');
  const ref = payee.payeeId ? window.vchPayee(payee.payeeId)
            : (window.VCH_PAYEES || []).find(p => p.name === payee.name);
  if (ref && ref.citizenId) return String(ref.citizenId).replace(/\D/g, '');
  return window.vchMockTaxId((ref && ref.code) || payee.code || payee.name || '');
};
window.vchResolveAddress = (payee) => {
  if (!payee) return '';
  const ref = payee.payeeId ? window.vchPayee(payee.payeeId)
            : (window.VCH_PAYEES || []).find(p => p.name === payee.name);
  if (ref && ref.address) return ref.address;
  // ผู้รับเงินที่เป็นสมาชิก — ลองดึงจากทะเบียนสมาชิก
  const mem = (window.MEMBERS_LIST || []).find(m => m.name === payee.name);
  if (mem && mem.dept) return mem.dept;
  return '';
};

const _round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// ─── สร้างรายการหนังสือรับรองตามรายบุคคล จากใบสำคัญจ่าย ───────────────
// แหล่งข้อมูลหลัก = ผู้รับเงินที่ "ติ๊กเลือกรับหักภาษี ณ ที่จ่าย" (payee.wht > 0)
// ผู้รับเงินหลายราย → ออกหนังสือรับรองแยกคนละฉบับ (1 ราย = 1 หนังสือ)
window.vchBuildCerts = (voucher) => {
  if (!voucher) return [];
  const payees = (voucher.payees || []).filter(p => p.name && Number(p.amount) > 0);
  if (!payees.length) return [];

  // โหมดใหม่: อ้างอิงการติ๊กเลือกรายบุคคล (payee.wht)
  const tagged = payees.filter(p => window.vchWhtRate(p.wht) > 0);
  let source = tagged;
  let useLineFallback = false;
  if (!tagged.length) {
    // โหมดเดิม (ใบเก่าที่ยังไม่ได้ติ๊กรายบุคคล): เฉลี่ยจากบรรทัดที่มี WHT
    const whtLines = (voucher.lines || []).filter(l => window.vchWhtRate(l.wht) > 0 && Number(l.amount) > 0);
    if (!whtLines.length) return [];
    useLineFallback = true;
    source = payees;
    voucher = { ...voucher, _whtLines: whtLines };
  }

  return source.map((p, idx) => {
    let rows;
    if (!useLineFallback) {
      const rate = window.vchWhtRate(p.wht);
      const map = window.VCH_WHT_INCOME_MAP[p.wht] || { section: '5', detail: '' };
      const amount = _round2(Number(p.amount || 0));
      const tax = (p.whtAmt != null && p.whtAmt !== '') ? _round2(Number(p.whtAmt)) : _round2(amount * rate / 100);
      rows = [{ section: map.section, detail: voucher.note || map.detail, date: voucher.docDate, amount, tax }];
    } else {
      const payeeTotal = window.vchPayeeTotal(payees) || 1;
      const share = payees.length === 1 ? 1 : (Number(p.amount || 0) / payeeTotal);
      const bySection = {};
      (voucher._whtLines || []).forEach(l => {
        const rate = window.vchWhtRate(l.wht);
        const map = window.VCH_WHT_INCOME_MAP[l.wht] || { section: '5', detail: l.desc || '' };
        const amount = _round2(Number(l.amount || 0) * share);
        const tax = _round2(amount * rate / 100);
        if (!bySection[map.section]) bySection[map.section] = { section: map.section, detail: l.desc || map.detail, date: voucher.docDate, amount: 0, tax: 0 };
        bySection[map.section].amount = _round2(bySection[map.section].amount + amount);
        bySection[map.section].tax = _round2(bySection[map.section].tax + tax);
      });
      rows = Object.values(bySection);
    }
    const isCompany = p.type === 'vendor' && /บจก|บริษัท|หจก|จำกัด|ห้าง|การไฟฟ้า|การประปา/.test(p.name);
    return {
      payeeIdx: idx,
      payeeKey: (p.code || '') + '|' + p.name,
      name: p.name,
      type: p.type,
      taxId: window.vchResolveTaxId(p),
      address: window.vchResolveAddress(p),
      pndType: isCompany ? 'ภ.ง.ด.53' : 'ภ.ง.ด.3',
      seqNo: String(idx + 1),
      payerCondition: '1',
      payDate: voucher.docDate,
      rows,
      totalAmount: _round2(rows.reduce((s, r) => s + r.amount, 0)),
      totalTax: _round2(rows.reduce((s, r) => s + r.tax, 0)),
    };
  }).filter(c => c.totalTax > 0);
};

// ─── ทะเบียนภาษีหัก ณ ที่จ่าย — รวมรายการออกหนังสือจากทุกใบสำคัญจ่าย ───
// โหลดใบสำคัญจ่ายทั้งหมด (เติมตัวอย่างที่เพิ่มใหม่ ไม่ทับของเดิม)
window.vchLoadVouchers = () => {
  let list = null;
  try { const s = localStorage.getItem('vouchers'); if (s) list = JSON.parse(s); } catch (e) {}
  const seed = JSON.parse(JSON.stringify(window.VCH_SEED || []));
  if (!list) return seed;
  const ids = new Set(list.map(v => v.id));
  const missing = seed.filter(s => !ids.has(s.id));
  return missing.length ? [...missing, ...list] : list;
};

// ป้ายประเภทเงินได้แบบสั้น (สำหรับทะเบียน)
window.VCH_SECTION_TAG = {
  '1':  '40(1) เงินเดือน/ค่าจ้าง',
  '2':  '40(2) ค่าธรรมเนียม/นายหน้า',
  '3':  '40(3) ค่าลิขสิทธิ์',
  '4a': '40(4)(ก) ดอกเบี้ย',
  '4b': '40(4)(ข) เงินปันผล',
  '5':  'ม.3 เตรส (จ้างทำของ/บริการ/เช่า)',
  '6':  'อื่น ๆ',
};

window.vchWhtRegister = (vouchers) => {
  const out = [];
  (vouchers || []).forEach(v => {
    if (v.status === 'cancelled') return;
    const certs = window.vchCertsLoad(v);
    certs.forEach(c => out.push({
      voucher: v,
      cert: c,
      key: v.id + '·' + c.payeeKey,
    }));
  });
  return out;
};

// ─── จัดเก็บ/อ่านค่าที่ผู้ใช้แก้ไขบนหนังสือรับรอง (ต่อใบสำคัญจ่าย) ─────
window.vchCertsLoad = (voucher) => {
  const base = window.vchBuildCerts(voucher);
  let saved = null;
  try { const s = localStorage.getItem('wht_certs_' + voucher.id); if (s) saved = JSON.parse(s); } catch (e) {}
  if (!saved || !saved.length) return base;
  // ผสานค่าที่บันทึกไว้กับฐานที่คำนวณใหม่ (จับคู่ตามชื่อผู้รับเงิน)
  return base.map(b => {
    const m = saved.find(s => s.name === b.name);
    return m ? { ...b, ...m, rows: (m.rows && m.rows.length) ? m.rows : b.rows } : b;
  });
};
window.vchCertsSave = (voucherId, certs) => {
  try { localStorage.setItem('wht_certs_' + voucherId, JSON.stringify(certs)); } catch (e) {}
};
