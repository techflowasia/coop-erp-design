// ═════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — นิติกรรม (Legal / Juristic Act · LA)
//  ─ ทำนิติกรรมเกี่ยวกับหลักทรัพย์ค้ำประกันเงินกู้ของสมาชิก
//    (จดจำนอง · ไถ่ถอน · อายัด · สินไหม · ภาระจำยอม · รวม/แยก/ออก/สอบโฉนด …)
//  ─ อ้างอิงตาม TOR ข้อ 1.2.7 (บันทึกข้อมูลการทำนิติกรรม + พิมพ์เอกสาร)
//  ─ ใช้สมาชิก/สัญญา ร่วมกับเมนูอื่น (window.DN_MEMBERS)
// ═════════════════════════════════════════════════════════════════

// ── ประเภทนิติกรรม (11 ประเภทตาม TOR) + ประเภทย่อย ─────────────────
window.LA_TYPES = [
  { code: 'MG', label: 'จดจำนอง', icon: 'lock', needsAmount: true, phase: 'mg',
    desc: 'จดจำนองหลักทรัพย์ที่ยังไม่ติดจำนอง (หากติดจำนองอยู่แล้วให้ใช้ "จำนองลำดับที่สอง") นิติกรรมประเภทอื่นทั้งหมดทำได้หลังจดจำนองแล้วเท่านั้น',
    subtypes: ['จำนองแปลงเดียว', 'จำนองรวมหลายแปลง', 'จำนองเฉพาะส่วน', 'จำนองลำดับที่สอง', 'จำนองเพิ่มหลักทรัพย์', 'ขึ้นเงินจากจำนอง', 'ผ่อนต้นเงินจากจำนอง', 'แก้ไขหนี้อันจำนองเป็นประกัน'] },
  { code: 'RD', label: 'ไถ่ถอน / แบ่งไถ่ถอน', icon: 'unlock', phase: 'post',
    desc: 'เป็นขั้นตอนสุดท้ายเมื่อชำระหนี้ครบทั้งหมดหรือบางส่วน',
    subtypes: ['ไถ่ถอนทั้งหมด', 'ไถ่ถอนบางแปลง', 'แบ่งไถ่ถอน'] },
  { code: 'RL', label: 'ปลอดจำนอง', icon: 'unlock', phase: 'post',
    desc: 'คือการปลดทรัพย์บางแปลงออกจากจำนอง โดยหนี้ยังคงอยู่และแปลงที่เหลือยังติดจำนอง',
    subtypes: ['ปลอดจำนองบางแปลง'] },
  { code: 'SZ', label: 'อายัดกรมบังคับคดี', icon: 'shield', phase: 'post',
    desc: 'เกิดขึ้นเมื่อมีการบังคับคดีกับทรัพย์ที่จำนองอยู่ ผู้รับจำนองยังมีบุริมสิทธิ์ตามลำดับการจดทะเบียน',
    subtypes: ['อายัดตามคำสั่ง', 'ถอนอายัด'] },
  { code: 'IN', label: 'สินไหมทดแทน', icon: 'money', needsAmount: true, phase: 'post',
    desc: 'ใช้เมื่อทรัพย์ที่จำนองถูกเวนคืน เสียหาย หรือมีค่าทดแทน ซึ่งผู้รับจำนองมีสิทธิเหนือเงินนั้น',
    subtypes: ['รับสินไหมทดแทน', 'ชดใช้ค่าเสียหาย'] },
  { code: 'SV', label: 'จดภาระจำยอม (แบ่งหักเป็นทาง)', icon: 'swap', phase: 'post',
    desc: 'จดภาระจำยอมบนที่ดินที่ติดจำนอง หากผู้รับจำนองไม่ยินยอม สิทธิจำนองจะอยู่เหนือภาระจำยอม เมื่อมีการบังคับจำนอง ภาระจำยอมนั้นอาจถูกลบออกได้ถ้าเป็นที่เสียหายแก่ผู้รับจำนอง (ป.พ.พ. ม.722)',
    subtypes: ['ภาระจำยอมเป็นทางเข้า-ออก', 'ภาระจำยอมสาธารณูปโภค'] },
  { code: 'CB', label: 'รวมโฉนด', icon: 'copy', phase: 'post',
    desc: 'รวมโฉนดที่ติดจำนอง ทุกแปลงต้องติดจำนองในสัญญาเดียวกัน และผู้รับจำนองต้องยินยอม',
    subtypes: ['รวมโฉนดหลายแปลงเป็นแปลงเดียว'] },
  { code: 'IS', label: 'ออกโฉนด', icon: 'insert', phase: 'post',
    desc: 'เปลี่ยน น.ส.3 / น.ส.3 ก ที่ติดจำนองเป็นโฉนด ภาระจำนองจะถูกยกไปลงในโฉนดใหม่',
    subtypes: ['ออกโฉนดใหม่จาก น.ส.3 / น.ส.3ก'] },
  { code: 'SP', label: 'แบ่งแยกโฉนด', icon: 'column', phase: 'post',
    desc: 'ถ้าแบ่งระหว่างจำนอง ภาระจำนองจะติดไปทุกแปลงที่แบ่งออก เว้นแต่จะทำปลอดจำนองบางแปลงควบคู่ไปด้วย',
    subtypes: ['แบ่งแยกในนามเดิม', 'แบ่งขาย / โอนบางส่วน'] },
  { code: 'CK', label: 'สอบโฉนด', icon: 'search', phase: 'post',
    desc: 'ตรวจสอบสารบัญจดทะเบียน ชื่อผู้ถือกรรมสิทธิ์ ภาระผูกพัน และการอายัดของหลักทรัพย์ที่ติดจำนอง (สอบซ้ำเป็นระยะได้)',
    subtypes: ['สอบเขต / รังวัดสอบเขต', 'ตรวจสอบสารบบที่ดิน'] },
  { code: 'IH', label: 'รับมรดกระหว่างจำนอง', icon: 'members', phase: 'post', transfer: true,
    desc: 'ใช้เมื่อกรรมสิทธิ์เปลี่ยนมือขณะที่ยังติดจำนอง โดยภาระจำนองติดตามทรัพย์ไปยังผู้รับโอน',
    subtypes: ['โอนมรดก (คงจำนองเดิม)'] },
  { code: 'GF', label: 'รับให้ระหว่างจำนอง', icon: 'user', phase: 'post', transfer: true,
    desc: 'ใช้เมื่อกรรมสิทธิ์เปลี่ยนมือขณะที่ยังติดจำนอง โดยภาระจำนองติดตามทรัพย์ไปยังผู้รับโอน',
    subtypes: ['โอนให้โดยเสน่หา (คงจำนองเดิม)'] },
];
window.LA_PHASES = {
  mg:     { l: 'จดจำนอง' },
  post:   { l: 'ทำหลังจดจำนองแล้วเท่านั้น' },
};
// หลักทรัพย์ที่ติดจำนองอยู่ (จากนิติกรรมที่จดทะเบียนแล้ว) → { assetId: { contractNo, reqNo, actNo } }
window.laMortgageMap = (acts, excludeId) => {
  const m = {};
  (acts || []).filter(x => x.status === 'registered' && x.id !== excludeId)
    .sort((a, b) => String(a.regDate).localeCompare(String(b.regDate)))
    .forEach(x => (x.assetIds || []).forEach(id => {
      if (x.typeCode === 'MG') m[id] = { contractNo: x.contractNo, reqNo: x.reqNo, actNo: x.actNo };
      else if ((x.typeCode === 'RD' || x.typeCode === 'RL') && m[id] && (!x.contractNo || x.contractNo === m[id].contractNo)) delete m[id];
    }));
  return m;
};
window.laType = (code) => window.LA_TYPES.find(t => t.code === code) || window.LA_TYPES[0];

// ── สถานะนิติกรรม ─────────────────────────────────────────────────
window.LA_STATUS = [
  { v: 'draft',      step: 0, l: 'ร่าง',           pill: 'neutral' },
  { v: 'pending',    step: 1, l: 'รอจดทะเบียน',    pill: 'warn'    },
  { v: 'registered', step: 2, l: 'ปิดนิติกรรมแล้ว', pill: 'ok'      },
  { v: 'cancelled',  step: 3, l: 'ยกเลิก',          pill: 'bad'     },
];
window.laStatus = (v) => window.LA_STATUS.find(s => s.v === v) || window.LA_STATUS[0];

// ── เอกสารนิติกรรมที่พิมพ์ได้ ──────────────────────────────────────
window.LA_DOC_TYPES = [
  { v: 'deed',   label: 'หนังสือนิติกรรมจำนอง' },
  { v: 'poa',    label: 'หนังสือมอบอำนาจ' },
  { v: 'mortgage', label: 'สัญญาจำนอง / สัญญาจำนองเฉพาะส่วน' },
  { v: 'annex',  label: 'สัญญาต่อท้าย (สัญญาจำนองเป็นประกัน)' },
];

// ── สำนักงานที่ดินตัวอย่าง (จดทะเบียน) ──────────────────────────────
window.LA_LAND_OFFICES = [
  'สำนักงานที่ดินกรุงเทพมหานคร', 'สำนักงานที่ดินจังหวัดนนทบุรี',
  'สำนักงานที่ดินจังหวัดปทุมธานี สาขาธัญบุรี', 'สำนักงานที่ดินจังหวัดสมุทรปราการ สาขาบางพลี',
  'สำนักงานที่ดินจังหวัดนครปฐม', 'สำนักงานที่ดินจังหวัดพระนครศรีอยุธยา',
];

const laPad = (n, w) => String(n).padStart(w || 4, '0');
let __laSeq = 200;
window.laNewId = () => 'LA-' + laPad(++__laSeq, 6);
let __laActSeq = 4820;
window.laNewActNo = () => 'จ' + (new Date().getFullYear() + 543).toString().slice(-2) + '-' + laPad(++__laActSeq, 5);

window.laToday = () => new Date().toISOString().slice(0, 10);
window.laUser = 'มนตรี ศรีสุข';   // เจ้าหน้าที่ที่ login

// ── เจ้าหน้าที่ที่เกี่ยวข้อง (ผู้รับมอบอำนาจ) ───────────────────────
window.LA_STAFF = [
  { name: 'มนตรี ศรีสุข',     position: 'เจ้าหน้าที่นิติกรรม',  citizenId: '3-1012-00385-41-7' },
  { name: 'วิไลวรรณ ทองดี',   position: 'เจ้าหน้าที่นิติกรรม',  citizenId: '1-1018-00931-25-6' },
  { name: 'จันทร์เพ็ญ มาลี',   position: 'เจ้าหน้าที่สินเชื่อ',   citizenId: '3-1009-00218-66-2' },
  { name: 'อนุวัฒน์ ใจดี',     position: 'เจ้าหน้าที่สินเชื่อ',   citizenId: '1-1020-00144-73-9' },
  { name: 'สมหญิง ตั้งตรง',    position: 'หัวหน้าฝ่ายสินเชื่อ',   citizenId: '3-1015-00672-18-4' },
  { name: 'ประสิทธิ์ คงทอง',   position: 'ผู้จัดการสหกรณ์',      citizenId: '3-1007-00109-52-1' },
];
window.laStaff = (name) => window.LA_STAFF.find(x => x.name === name) || null;

// ── ใบคำขอกู้โครงการเงินกู้พิเศษ (อนุมัติแล้ว) → ใช้ตอนจดจำนอง ────────
window.LA_SPECIAL_REQS = {
  'M-067012': [
    { reqNo: 'LR-2569-04790', project: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย',      amount: 1500000, contractNo: 'SP-2569-0112', status: 'approved' },
    { reqNo: 'LR-2569-04801', project: 'เงินกู้พิเศษเพื่อการเคหะสงเคราะห์', amount: 900000,  contractNo: 'SP-2569-0127', status: 'approved' },
    { reqNo: 'LR-2569-04815', project: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย',      amount: 600000,  contractNo: '',             status: 'waitapprove' },
  ],
  'M-066238': [
    { reqNo: 'LR-2569-04772', project: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย',      amount: 850000,  contractNo: 'SP-2569-0098', status: 'approved' },
  ],
};
window.laSpecialReqsOf = (member) => {
  const code = member && member.code;
  const list = (window.LA_SPECIAL_REQS[code] || []).slice();
  try {
    const saved = window.laReqStore ? window.laReqStore() : {};
    (window.LA_REQ_SEED || []).filter(r => r.memberCode === code && r.group === 'เงินกู้พิเศษ').forEach(r => {
      const x = { ...r, ...(saved[r.id] || {}) };
      list.push({ reqNo: r.id, project: r.productName, amount: r.amount, contractNo: x.contractNo || '', status: x.status });
    });
  } catch (e) {}
  return list.filter(r => r.status === 'approved')
    .map(r => ({ reqNo: r.reqNo, contractNo: r.contractNo || String(r.reqNo).replace(/^LR/, 'SP'), type: r.project, amount: r.amount }));
};

// ── หนี้ทั้งหมดของสมาชิกกับสหกรณ์ ─────────────────────────────────
// ประเภทเงินกู้เดิม → ชื่อโครงการเงินกู้
window.LA_PROJECT_OF_TYPE = { 'เงินกู้สามัญ': 'เงินกู้สามัญปกติ', 'เงินกู้ฉุกเฉิน': 'เงินกู้เพื่อเหตุฉุกเฉิน', 'เงินกู้พิเศษ': 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', 'กู้หุ้น': 'เงินกู้โดยใช้หุ้นค้ำประกัน' };
window.laDebtsOf = (member) => {
  const rows = ((member && member.debts) || []).map(d => {
    const left = d.totalTerms ? Math.max(0, d.totalTerms - (d.paidTerms || 0)) : null;
    const loan = d.loanAmount || (d.totalTerms && left ? Math.round((d.principalRemaining || 0) * d.totalTerms / left / 1000) * 1000 : d.principalRemaining || 0);
    return { contractNo: d.contractNo, project: d.project || window.LA_PROJECT_OF_TYPE[d.type] || d.type, loanAmount: loan, remaining: d.principalRemaining || 0, termsLeft: left, totalTerms: d.totalTerms || null };
  });
  window.laSpecialReqsOf(member).forEach(r => {
    if (!rows.some(x => x.contractNo === r.contractNo)) rows.push({ contractNo: r.contractNo, project: r.type, loanAmount: r.amount || 0, remaining: r.amount || 0, termsLeft: 240, totalTerms: 240 });
  });
  return rows;
};
// ประเภทหลักทรัพย์ที่รวมโฉนดได้ (เรียงตามลำดับ)
window.LA_CB_TYPES = ['โฉนด', 'น.ส.3', 'น.ส.3ก', 'โฉนดตราจอง'];
window.laTypeKey = (t) => String(t || '').replace(/[.\s]/g, '');

// ── หลักทรัพย์ของสมาชิก (demo) — ผูกกับเลขทะเบียนสมาชิก ─────────────
//  ใช้แสดงใน "รายการหลักทรัพย์" และเลือกตอนทำนิติกรรม
function laAsset(id, type, titleNo, area, loc, extra) {
  return Object.assign({ id, type, titleNo, area, loc, office: 'สำนักงานที่ดินจังหวัดอ่างทอง' }, extra || {});
}
window.LA_ASSETS_BY_MEMBER = {
  'M-067012': [
    laAsset('A1', 'โฉนด', '12345', '3 ไร่ 1 งาน 50 วา', 'ต.อ่างทอง อ.เมือง จ.อ่างทอง', { landNo: '125', surveyPage: '4521', volume: '124', page: '45', rawang: '5137 II 6420-08' }),
    laAsset('A2', 'ห้องชุด', '88/802', '48.50 ตร.ม.', 'ต.อ่างทอง อ.เมือง จ.อ่างทอง', { floor: '8', bldNo: '-', condoName: 'อาคารชุดสุขสบาย คอนโดมิเนียม', condoReg: '3/2558', parentTitle: '20877', landNo: '310', surveyPage: '6120' }),
    laAsset('A3', 'สิ่งปลูกสร้าง', '12345', '210 ตร.ม.', 'ต.อ่างทอง อ.เมือง จ.อ่างทอง'),
    laAsset('A4', 'โฉนด', '67890', '1 ไร่ 2 งาน 12 วา', 'ต.บางแก้ว อ.เมือง จ.อ่างทอง', { landNo: '88', surveyPage: '3310', volume: '210', page: '12', rawang: '5137 II 6420-09' }),
    laAsset('A5', 'โฉนดตราจอง', '1532', '5 ไร่ 2 งาน 40 วา', 'ต.โพสะ อ.เมือง จ.อ่างทอง', { landNo: '17', surveyPage: '902', volume: '16', page: '32', rawang: '5137 I 2216' }),
    laAsset('A6', 'น.ส.3', '2241', '2 ไร่ 3 งาน 10 วา', 'ต.ศาลาแดง อ.เมือง จ.อ่างทอง', { landNo: '54', volume: '23', page: '41', moo: '4', airName: 'อ่างทอง', airNo: '5137 II 6420', airSheet: '12' }),
  ],
  'M-066238': [
    laAsset('B1', 'โฉนด', '44120', '2 ไร่ 0 งาน 30 วา', 'ต.บ้านแป้ง อ.บางปะอิน จ.พระนครศรีอยุธยา', { landNo: '412', surveyPage: '7710', volume: '442', page: '20', rawang: '5136 IV 6624-03' }),
    laAsset('B2', 'น.ส.3ก', '1180', '1 ไร่ 1 งาน 0 วา', 'ต.บ้านแป้ง อ.บางปะอิน จ.พระนครศรีอยุธยา', { landNo: '206', volume: '12', page: '80', moo: '3', airName: 'บางปะอิน', airNo: '5136 IV 6624', airSheet: '04' }),
  ],
};
window.laAssetsOf = (code) => {
  // มีทะเบียนหลักทรัพย์จริง → ใช้ข้อมูลชุดเดียวกับหน้าทะเบียนหลักทรัพย์
  const reg = (window.LC_BY_MEMBER || {})[code];
  if (reg && reg.length && window.lcOf) {
    return window.lcOf(code).map(r => {
      const c = r.condo || {};
      const titleNo = r.type === 'ห้องชุด' ? c.roomNo : r.type === 'สิ่งปลูกสร้าง' ? window.lcBldTitleNos(r).join(', ') : r.titleNo;
      return { ...r, titleNo,
        area: window.lcAssetArea ? window.lcAssetArea(r) : '', loc: window.lcAssetLoc ? window.lcAssetLoc(r) : '',
        office: 'สำนักงานที่ดินจังหวัด' + (r.landOfficeProvince || '') + (r.landOfficeBranch ? ' สาขา' + r.landOfficeBranch : ''),
        floor: c.floor, bldNo: c.buildingNo, condoName: c.roomName, condoReg: c.regNo, parentTitle: c.titleNos,
        _lc: r };
    });
  }
  const src = window.LA_ASSETS_BY_MEMBER[code];
  if (src) return src.map(r => ({ ...r }));
  // สมาชิกอื่น: สร้างชุดสาธิตขั้นต่ำ 2 แปลง
  return [
    laAsset(code + '-a', 'โฉนด', '20551', '1 ไร่ 0 งาน 40 วา', 'ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี'),
    laAsset(code + '-b', 'สิ่งปลูกสร้าง', '20551', '180 ตร.ม.', 'ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี'),
  ];
};

// ── แปลงหลักทรัพย์ (นิติกรรม) → รูปแบบทะเบียนหลักทรัพย์ (ใช้ modal รายละเอียดเดียวกัน)
window.laToLcRec = (a, member) => {
  if (a._lc) return a._lc;
  const type = ({ 'น.ส.3': 'นส3', 'น.ส.3ก': 'นส3ก' })[a.type] || a.type;
  const ar = String(a.area || '');
  const m = ar.match(/(\d+)\s*ไร่\s*(\d+)\s*งาน\s*(\d+)\s*วา/);
  const sqm = (ar.match(/([\d.,]+)\s*ตร\.ม/) || [])[1];
  const lm = String(a.loc || '').match(/ต\.(\S+)\s+อ\.(\S+)\s+จ\.(\S+)/) || [];
  const [prov, branch] = String(a.office || '').replace(/^สำนักงานที่ดิน(จังหวัด)?/, '').split(/\s*สาขา/);
  const owners = member && member.name ? [{ name: member.name, citizenId: member.citizenId, age: member.age, marital: member.maritalStatus }] : [];
  const r = { id: a.id, type, titleNo: a.titleNo, volume: a.volume, page: a.page, moo: a.moo, rawang: a.rawang,
    landNo: a.landNo, surveyPage: a.surveyPage, locTambon: lm[1], locAmphoe: lm[2], locProvince: lm[3],
    landOfficeProvince: prov, landOfficeBranch: branch, owners };
  if (m && (window.LC_TITLE_TYPES || []).includes(type)) Object.assign(r, { rai: m[1], ngan: m[2], wa: m[3] });
  if (type === 'ห้องชุด') r.condo = { roomNo: a.titleNo, floor: a.floor, buildingNo: a.bldNo, roomName: a.condoName, regNo: a.condoReg, titleNos: a.parentTitle, areaSqm: sqm };
  if (type === 'สิ่งปลูกสร้าง') { r.code = 'บนโฉนด ' + a.titleNo; r.building = { refTitleNo: a.titleNo, refTitleNos: [a.titleNo], usableArea: sqm }; }
  return r;
};
window.laAssetLabel = (a) => {
  if (a.type === 'ห้องชุด') return 'ห้องชุดเลขที่ ' + a.titleNo;
  if (a.type === 'สิ่งปลูกสร้าง') return a._lc ? 'สิ่งปลูกสร้าง ' + (a._lc.code || '') + ' (โฉนด ' + a.titleNo + ')' : 'สิ่งปลูกสร้างบนโฉนด ' + a.titleNo;
  return 'โฉนดเลขที่ ' + a.titleNo;
};

// ── สัญญาเงินกู้ของสมาชิก → รายการเลือกทำนิติกรรม ─────────────────
//  reqNo (เลขที่ใบขอกู้) สังเคราะห์จากเลขที่สัญญา
window.laContractsOf = (member) => {
  const debts = (member && member.debts) || [];
  return debts.map((d) => ({
    contractNo: d.contractNo,
    reqNo: 'REQ-' + String(d.contractNo).replace(/[^0-9]/g, '').slice(0, 8),
    type: d.type,
    principalRemaining: d.principalRemaining || 0,
  }));
};

// ── สรุป "รายละเอียด" หลักทรัพย์ที่เกี่ยวข้องในนิติกรรม ──────────────
window.laAssetSummary = (assets, ids) => {
  const sel = (assets || []).filter(a => (ids || []).includes(a.id));
  if (!sel.length) return '—';
  return sel.map(a => (a.type === 'ห้องชุด' ? 'ห้องชุดเลขที่ ' : 'เลขที่โฉนด ') + a.titleNo).join(', ');
};

// ── ค่าธรรมเนียมเริ่มต้นตามประเภท (บาท) ────────────────────────────
window.laDefaultFees = (typeCode, amount) => {
  const amt = Number(amount) || 0;
  if (typeCode === 'MG') return { register: 500, act: Math.round(amt * 0.01), stamp: Math.round(amt * 0.0005), other: 0 };
  if (typeCode === 'RD') return { register: 50, act: 0, stamp: 0, other: 0 };
  if (typeCode === 'IN') return { register: 0, act: 0, stamp: 0, other: 0 };
  return { register: 500, act: 0, stamp: 0, other: 200 };
};
window.laFeeTotal = (f) => f ? (Number(f.register || 0) + Number(f.act || 0) + Number(f.stamp || 0) + Number(f.other || 0)) : 0;

// ── สร้างรายการนิติกรรมเปล่า ───────────────────────────────────────
window.laBlankAct = (member, typeCode) => {
  typeCode = typeCode || 'MG';
  const t = window.laType(typeCode);
  const contracts = window.laContractsOf(member);
  const c = (typeCode === 'MG' ? window.laSpecialReqsOf(member)[0] : contracts[0]) || { contractNo: '', reqNo: '' };
  return {
    id: window.laNewId(),
    actNo: window.laNewActNo(),
    memberCode: member.code,
    reqNo: c.reqNo, contractNo: c.contractNo,
    typeCode, subtype: t.subtypes[0] || '',
    assetIds: [],
    amount: '',
    fees: window.laDefaultFees(typeCode, 0),
    landOffice: window.LA_LAND_OFFICES[5],
    regDate: window.laToday(),
    attorney: window.laUser, attorneyId: (window.laStaff(window.laUser) || {}).citizenId || '',
    cbType: '',
    transferee: '', consent: false, withRelease: false,
    note: '',
    attachments: [],
    status: 'draft',
    createdBy: window.laUser,
    createdAt: window.laToday(),
    printCount: 0,
    docEdits: {},   // { deed: {...}, poa: {...} } — เนื้อหาที่แก้ก่อนพิมพ์
  };
};

// ── ข้อมูลตัวอย่างในทะเบียน (seed) ─────────────────────────────────
function laSeedAct(over) {
  const base = {
    id: window.laNewId(), actNo: window.laNewActNo(),
    memberCode: 'M-067012', reqNo: 'REQ-20220455', contractNo: 'L-2022-0455',
    typeCode: 'MG', subtype: 'จำนองรวมหลายแปลง', rate: '6.25',
    assetIds: ['A1', 'A4'], amount: '1200000',
    fees: { register: 500, act: 12000, stamp: 600, other: 0 },
    landOffice: window.LA_LAND_OFFICES[3], regDate: '2569-03-14',
    attorney: 'นางสาวตัวอย่าง ผู้รับมอบอำนาจ', attorneyId: '3-1019-00482-19-2',
    note: '', attachments: [{ name: 'สำเนาโฉนด-12345.pdf', size: '1.2 MB' }],
    status: 'registered', createdBy: 'มนตรี ศรีสุข', createdAt: '2569-03-10',
    printCount: 2, docEdits: {},
  };
  return Object.assign(base, over || {});
}
window.LA_SEED = [
  laSeedAct({}),
  laSeedAct({ typeCode: 'RD', subtype: 'ไถ่ถอนบางแปลง', assetIds: ['A2', 'A3'], amount: '',
    fees: { register: 50, act: 0, stamp: 0, other: 0 }, status: 'pending', regDate: '2569-05-02', printCount: 0,
    contractNo: 'SP-2021-0144', reqNo: 'REQ-20210144' }),
  laSeedAct({ memberCode: 'M-066238', typeCode: 'MG', subtype: 'จำนองแปลงเดียว', assetIds: ['B1'],
    amount: '850000', contractNo: 'L-2021-0332', reqNo: 'REQ-20210332',
    fees: { register: 500, act: 8500, stamp: 425, other: 0 }, status: 'registered', regDate: '2569-02-20',
    attorney: 'นายตัวอย่าง ผู้รับมอบอำนาจ', attorneyId: '3-1020-00457-12-8', printCount: 1 }),
  // ── ตัวอย่างชุดเอกสารจดจำนองแยกตามประเภทหลักทรัพย์ ──
  laSeedAct({ id: 'LA-DEMO-TJ', actNo: 'จ69-09001', subtype: 'จำนองแปลงเดียว', assetIds: ['A5'], amount: '650000', rate: '6.25',
    fees: { register: 500, act: 6500, stamp: 325, other: 0 }, status: 'pending', regDate: '2569-07-08', printCount: 0, note: 'ตัวอย่าง — โฉนดตราจอง' }),
  laSeedAct({ id: 'LA-DEMO-NS3', actNo: 'จ69-09002', subtype: 'จำนองแปลงเดียว', assetIds: ['A6'], amount: '420000', rate: '6.25',
    fees: { register: 500, act: 4200, stamp: 210, other: 0 }, status: 'pending', regDate: '2569-07-10', printCount: 0, note: 'ตัวอย่าง — น.ส.3' }),
  laSeedAct({ id: 'LA-DEMO-NS3K', actNo: 'จ69-09003', memberCode: 'M-066238', subtype: 'จำนองแปลงเดียว', assetIds: ['B2'], amount: '380000', rate: '6.25',
    contractNo: 'L-2021-0332', reqNo: 'REQ-20210332', attorney: 'นายตัวอย่าง ผู้รับมอบอำนาจ', attorneyId: '3-1020-00457-12-8',
    fees: { register: 500, act: 3800, stamp: 190, other: 0 }, status: 'pending', regDate: '2569-07-14', printCount: 0, note: 'ตัวอย่าง — น.ส.3 ก.' }),
  laSeedAct({ id: 'LA-DEMO-CD', actNo: 'จ69-09004', subtype: 'จำนองแปลงเดียว', assetIds: ['A2'], amount: '1100000', rate: '6.25',
    fees: { register: 500, act: 11000, stamp: 550, other: 0 }, status: 'pending', regDate: '2569-07-16', printCount: 0, note: 'ตัวอย่าง — ห้องชุด' }),
  laSeedAct({ id: 'LA-DEMO-MG1', actNo: 'จ69-09005', subtype: 'จำนองแปลงเดียว', assetIds: ['A1'], amount: '900000', rate: '6.25',
    fees: { register: 500, act: 9000, stamp: 450, other: 0 }, status: 'pending', regDate: '2569-07-18', printCount: 0, note: 'ตัวอย่าง — จำนองแปลงเดียว (โฉนด)' }),
  laSeedAct({ id: 'LA-DEMO-MGN', actNo: 'จ69-09006', subtype: 'จำนองรวมหลายแปลง', assetIds: ['A1', 'A3', 'A4'], amount: '2500000', rate: '6.25',
    fees: { register: 500, act: 25000, stamp: 1250, other: 0 }, status: 'pending', regDate: '2569-07-20', printCount: 0, note: 'ตัวอย่าง — จำนองรวมหลายแปลง (โฉนด 2 แปลง + สิ่งปลูกสร้าง)' }),
  laSeedAct({ id: 'LA-DEMO-RD', actNo: 'จ69-09007', typeCode: 'RD', subtype: 'ไถ่ถอนทั้งหมด', assetIds: ['A1'], amount: '',
    fees: { register: 50, act: 0, stamp: 0, other: 0 }, status: 'pending', regDate: '2569-07-22', printCount: 0, note: 'ตัวอย่าง — ไถ่ถอนจากจำนอง' }),
  laSeedAct({ id: 'LA-DEMO-RL', actNo: 'จ69-09008', typeCode: 'RL', subtype: 'ปลอดจำนองบางแปลง', assetIds: ['A4'], amount: '',
    fees: { register: 50, act: 0, stamp: 0, other: 0 }, status: 'pending', regDate: '2569-07-24', printCount: 0, note: 'ตัวอย่าง — ปลอดจำนอง' }),
  laSeedAct({ id: 'LA-DEMO-SV', actNo: 'จ69-09009', typeCode: 'SV', subtype: 'ภาระจำยอมเป็นทางเข้า-ออก', assetIds: ['A4'], amount: '',
    fees: { register: 0, act: 0, stamp: 0, other: 0 }, status: 'pending', regDate: '2569-07-26', printCount: 0, note: 'ตัวอย่าง — จดภาระจำยอม' }),
  laSeedAct({ id: 'LA-DEMO-CK', actNo: 'จ69-09010', typeCode: 'CK', subtype: 'สอบเขต / รังวัดสอบเขต', assetIds: ['A5'], amount: '',
    fees: { register: 0, act: 0, stamp: 0, other: 0 }, status: 'pending', regDate: '2569-07-28', printCount: 0, note: 'ตัวอย่าง — สอบโฉนด (รังวัดสอบเขต)' }),
  laSeedAct({ memberCode: 'M-066238', typeCode: 'SZ', subtype: 'อายัดตามคำสั่ง', assetIds: ['B2'], amount: '',
    fees: { register: 0, act: 0, stamp: 0, other: 300 }, status: 'draft', regDate: '2569-06-11',
    contractNo: 'L-2021-0332', reqNo: 'REQ-20210332', attorney: '', printCount: 0 }),
];

// ── โหลด / บันทึก localStorage ─────────────────────────────────────
const LA_CONTRACT_MAP = {
  'L-2022-0455':  ['LR-2569-04790', 'SP-2569-0112'],
  'SP-2021-0144': ['LR-2569-04801', 'SP-2569-0127'],
  'L-2021-0332':  ['LR-2569-04772', 'SP-2569-0098'],
};
const laMigrate = (x) => { const m = LA_CONTRACT_MAP[x.contractNo]; return m ? { ...x, reqNo: m[0], contractNo: m[1] } : x; };
window.LA_SEED = window.LA_SEED.map(laMigrate);
window.laLoad = () => {
  try {
    const saved = localStorage.getItem('legal_acts');
    if (saved) {
      const list = JSON.parse(saved).map(laMigrate);
      const have = new Set(list.map(x => x.id));
      window.LA_SEED.filter(x => /^LA-DEMO-/.test(x.id) && !have.has(x.id)).forEach(x => list.push(JSON.parse(JSON.stringify(x))));
      return list;
    }
  } catch (e) {}
  return window.LA_SEED.map(r => JSON.parse(JSON.stringify(r)));
};
window.laSaveLS = (list) => {
  try { localStorage.setItem('legal_acts', JSON.stringify(list)); } catch (e) {}
};

// ── ชื่อสมาชิกแบบย่อ (ตัวอักษรแรก) ─────────────────────────────────
window.laMemberOf = (code) => (window.DN_MEMBERS || []).find(m => m.code === code) || null;
