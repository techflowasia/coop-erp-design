// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — เปิดบัญชีเงินฝาก
//  โครงหน้าจอ 6 ส่วน (อ้างอิงข้อกำหนดหน้าจอเปิดบัญชี):
//   1) ข้อมูลเอกสารเปิดบัญชี  2) ข้อมูลเจ้าของบัญชี
//   3) ข้อมูลการรับเงินเปิดบัญชี 4) ผู้ฝากร่วม
//   5) การส่งฝากรายงวด        6) รายการเช็ค
//  เงื่อนไข/สไตล์อ้างอิงตาม Design System (เขียวสหกรณ์ · Sarabun · การ์ดขาว)
// ════════════════════════════════════════════════════════════════════

const OPEN_USER = 'จันทร์เพ็ญ มาลี';

// ── ตัวเลือกค่าคงที่ในหน้าจอ ──
// ประเภทผู้เปิดบัญชี — สมาชิกสหกรณ์ / บุคคลภายนอก / นิติบุคคลภายนอก
const DEP_OPENER_TYPES = [
  { v: 'member',   l: 'สมาชิกสหกรณ์',    icon: 'members', idLabel: 'เลขสมาชิก',        idPh: 'คลิกเพื่อค้นหาเลขสมาชิก…' },
  { v: 'person',   l: 'บุคคลภายนอก',     icon: 'user',    idLabel: 'เลขบัตรประชาชน',   idPh: 'เลขบัตรประชาชน 13 หลัก' },
  { v: 'juristic', l: 'นิติบุคคลภายนอก', icon: 'report',  idLabel: 'เลขทะเบียนนิติบุคคล', idPh: 'เลขทะเบียน 13 หลัก' },
];
const DEP_HOLDER_TYPES = [
  { v: '01', l: '01 บุคคล (เจ้าของคนเดียว)' },
  { v: '02', l: '02 บุคคล (บัญชีร่วม)' },
  { v: '03', l: '03 นิติบุคคล' },
  { v: '04', l: '04 ผู้เยาว์ (มีผู้ปกครอง)' },
];
const DEP_WITHDRAW_CONDS = [
  { v: 'type',   l: 'ตามประเภทบัญชี' },
  { v: 'single', l: 'ถอนคนเดียว' },
  { v: 'joint',  l: 'ถอนร่วม (ทุกคนลงนาม)' },
  { v: 'any',    l: 'ถอนคนใดคนหนึ่ง' },
  { v: 'approve',l: 'ต้องมีผู้อนุมัติ' },
];
const DEP_OPENED_BY = [
  'เปิดบัญชีใหม่ด้วยเงินสด',
  'เปิดบัญชีด้วยแคชเชียร์เช็ค',
  'เปิดบัญชีด้วยดราฟท์',
  'เปิดบัญชีด้วยเช็คส่วนบุคคล',
  'เปิดบัญชีจากลูกหนี้ตัวแทนหักเงินเดือน',
  'เปิดบัญชีใหม่ด้วยการโอนนอกระบบ',
  'เปิดบัญชีโดยธนาณัติ',
  'เปิดบัญชีใหม่ด้วยการโอน',
];
const depIntReceive = () => ((window.DAT_OPTS || {}).intReceiveMode) || DEP_INT_RECEIVE;
const DEP_INT_RECEIVE = [
  { v: 'compound', l: 'ทบต้น (เข้าบัญชีเดิม)' },
  { v: 'savings',  l: 'รับเข้าบัญชีออมทรัพย์' },
  { v: 'cash',     l: 'รับเป็นเงินสด' },
  { v: 'transfer', l: 'โอนเข้าบัญชีธนาคาร' },
];
// สถานะเจ้าของบัญชี — อ้างอิงทะเบียนสมาชิก › ข้อมูลการทำงาน
function depMemberWork(m) {
  if (!m) return { label: '—', tone: 'muted', ok: false };
  const det = (window.MEMBER_DETAILS && window.MEMBER_DETAILS[m.code])
           || (window.MEMBER_DETAIL && window.MEMBER_DETAIL.code === m.code ? window.MEMBER_DETAIL : null) || {};
  const work = det.work || det.employment || det;
  const ws = work.workStatus || m.workStatus || m.status || '';
  const retire = work.retireDate || m.retireDate || '';
  if (/ปฏิบัติงาน|ปกติ/.test(ws)) return { label: 'ปกติ', tone: 'success', ok: true };
  if (/เกษียณ/.test(ws)) { const y = retire ? Number(String(retire).slice(0, 4)) + 543 : ''; return { label: 'กษ.' + y, tone: 'warning', ok: true }; }
  return { label: ws || '—', tone: 'danger', ok: !/ลาออก|เสียชีวิต/.test(ws) };
}
const depBankAccts = () => (window.baLoad ? window.baLoad() : []).filter(a => a.status === 'ใช้งาน');
const depBankName = (c) => (window.baBankName ? window.baBankName(c) : c);
// รหัสคู่บัญชี DR — ดึงจาก "คู่บัญชี" ของรายการธนาคาร
const depDrOptions = () => {
  const coas = (window.BA_COA || []).slice();
  depBankAccts().forEach(a => { if (a.coa && !coas.includes(a.coa)) coas.push(a.coa); });
  return coas.length ? coas.map(s => { const i = s.indexOf(' · '); return { code: s.slice(0, i), name: s.slice(i + 3) }; }) : DEP_DR_ACCOUNTS;
};
const DEP_DR_ACCOUNTS = [
  { code: '110101', name: 'เงินสด' },
  { code: '110111', name: 'ธ.กรุงไทย — ออมทรัพย์' },
  { code: '110112', name: 'ธ.ออมสิน — ออมทรัพย์' },
  { code: '110120', name: 'เงินฝากธนาคาร–กระแสรายวัน' },
  { code: '110201', name: 'ลูกหนี้เงินกู้ฉุกเฉิน' },
  { code: '110202', name: 'ลูกหนี้เงินกู้สามัญ' },
  { code: '110203', name: 'ลูกหนี้เงินกู้พิเศษ' },
  { code: '110300', name: 'ดอกเบี้ยค้างรับ' },
  { code: '120101', name: 'ที่ดิน' },
  { code: '120102', name: 'อาคารสำนักงาน' },
  { code: '210100', name: 'เงินรับฝากจากสมาชิก' },
  { code: '310100', name: 'ทุนเรือนหุ้น' },
];
window.DEP_PRINTERS_LIST = null;
const DEP_PRINTERS = [
  'DRC เงินฝาก 01 (\\\\192.168.22.55\\Tally T5040)',
  'DRC เงินฝาก 02 (\\\\192.168.22.56\\Tally T5040)',
  'เคาน์เตอร์ 1 (Passbook Printer PR9)',
];
window.DEP_PRINTERS_LIST = DEP_PRINTERS;
const DEP_PERIODIC = [
  { v: 'none',    l: 'ไม่ต้องการฝากรายเดือน' },
  { v: 'monthly', l: 'ฝากรายเดือน (ส่งทุกเดือน)' },
];
// งวดเรียกเก็บ YYYYMM (พ.ศ.) — ใช้รูปแบบเดียวกับเมนูเปลี่ยนแปลงฝากรายเดือน
const DEP_PER_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const depPerOf = (iso) => window.depPeriodOf ? window.depPeriodOf(iso) : (String(Number(String(iso).slice(0, 4)) + 543) + String(iso).slice(5, 7));
const depPerAdd = (p, n) => { const y = Number(p.slice(0, 4)), m = Number(p.slice(4, 6)) - 1 + n; return String(y + Math.floor(m / 12)) + String((m % 12 + 12) % 12 + 1).padStart(2, '0'); };
// ถึงงวด = เริ่มงวด + จำนวนงวดที่ประเภทกำหนด − 1 · ไม่กำหนดจำนวนงวด = 9999999 (หักตลอดไป)
const depPerUntil = (from, count) => (Number(count) > 0 && /^\d{6}$/.test(String(from)) ? depPerAdd(String(from), Number(count) - 1) : '9999999');
const depPerFmt = (p) => { const s = String(p || '').trim(); if (/^9{6,7}$/.test(s)) return 'ตลอดไป'; if (!/^\d{6}$/.test(s)) return s || '—'; const m = Number(s.slice(4)); return (DEP_PER_TH[m - 1] || s.slice(4)) + ' ' + s.slice(0, 4); };
const DEP_CHEQUE_TYPES = ['CL', 'BC', 'DAF'];
const DEP_TERM_MONTHS = { '12': 12, F12: 12, F24: 24 };

// ════ ค่าคงที่ที่หน้าเปิดบัญชีอ้างอิง ════
// ประเภทเงินฝาก — อ่านจากเมนูประเภทเงินฝาก (datLoad) รวมค่าเดิมจาก seed
const depOpenTypes = () => {
  let recs = []; try { recs = window.datLoad ? window.datLoad() : []; } catch (e) {}
  const seed = window.DEP_ACCTYPE_SEED || [];
  const src = recs.length ? recs : seed.map(r => (window.datBuildRecord ? window.datBuildRecord(JSON.parse(JSON.stringify(r))) : r));
  return src.filter(r => r && r.enabled !== false).map(r => {
    const b = seed.find(x => x.code === r.code) || {};
    return { ...b, ...r, cond: r.cond || b.cond || {}, interest: r.interest || b.interest || { rate: 0 },
      withdraw: r.withdraw || b.withdraw || {}, passbook: r.passbook || b.passbook || {}, control: r.control || b.control || {},
      st: { ...(window.DAT_SETTINGS_DEFAULTS || {}), ...(r.settings || {}) } };
  });
};
// ประเภทบุคคลที่ใช้ได้ (แท็บข้อมูลหลัก)
const depMemberKind = (m) => /สมทบ/.test(String((m && (m.type || m.memberType)) || '')) ? 'assoc' : 'regular';
const depPersonOk = (pt, openerType, member) => {
  if (!pt || pt === 'all') return true;
  if (pt === 'juristic') return openerType === 'juristic';
  if (pt === 'nonmember') return openerType === 'person';
  if (openerType !== 'member') return false;
  return !member || depMemberKind(member) === pt;
};
// ตัวนับเลขที่บัญชี (รหัสคุมเลขที่บัญชี) + รูปแบบเลขบัญชี (ข้อกำหนดระบบเงินฝาก)
window.depAccCounters = () => { let o = {}; try { o = JSON.parse(localStorage.getItem('dep_acc_counters_v1') || '{}'); } catch (e) {} return { ...(window.DEP_ACC_COUNTERS || {}), ...o }; };
window.depBumpAccCounter = (code, n) => {
  try { const o = JSON.parse(localStorage.getItem('dep_acc_counters_v1') || '{}'); const base = window.depAccCounters()[code] || {};
    o[code] = { ...base, last: n, updated: new Date().toISOString().slice(0, 16) }; localStorage.setItem('dep_acc_counters_v1', JSON.stringify(o)); } catch (e) {}
};
const depAccFmt = () => { let v = {}; try { v = JSON.parse(localStorage.getItem('dep_sysconfig') || '{}'); } catch (e) {}
  // B = รหัสสาขา — ดึงจากค่าคงที่ระบบเงินฝาก › "สาขาสหกรณ์" (สำนักงานใหญ่ รหัส 0 ถ้ามี ไม่มีใช้รายการแรก)
  //     เมื่อมีหลายสาขาในอนาคต ให้เปลี่ยนเป็นสาขาของผู้ใช้/เคาน์เตอร์ที่ทำรายการ
  let br = '0';
  try { const l = window.depConstList ? window.depConstList('coopbranch') : []; const hq = l.find(r => String(r.code).trim() === '0'); br = hq ? hq.code : (l.length ? l[0].code : '0'); } catch (e) { br = '0'; }
  return { store: v.acctStoreFormat || 'BTTrrrrrrr', display: v.acctDisplayFormat || 'X-XX-XXXXXXX', branch: String(br == null || br === '' ? '0' : br).trim() }; };
const depFmtAcc = (store, display, branch, tt, run) => {
  const cnt = (c) => (store.match(new RegExp(c, 'g')) || []).length;
  const fit = (v, n) => String(v).padStart(n, '0').slice(-n);
  const seg = { B: fit(branch, cnt('B')), T: fit(tt, cnt('T')), r: fit(run, cnt('r')) }, ix = { B: 0, T: 0, r: 0 };
  let out = ''; for (const ch of store) out += seg[ch] != null ? seg[ch][ix[ch]++] : ch;
  let d = '', k = 0; for (const ch of display) d += ch === 'X' ? (out[k++] || '') : ch;
  return { store: out, display: k < out.length ? d + out.slice(k) : d };
};
window.depNextAccNo = (rec, accounts) => {
  const code = String((rec && rec.st && rec.st.docNo) || '').trim().toUpperCase();
  const ctr = code ? window.depAccCounters()[code] : null;
  if (!ctr) return null;
  const f = depAccFmt(); let n = Number(ctr.last || 0) + 1, x;
  // TT = รหัสประเภทเงินฝาก (เมนูประเภทเงินฝาก) · r = เลขลำดับจากรหัสคุมเลขที่บัญชีของประเภทนั้น
  const tt = String((rec && rec.code) || '').trim() || code.slice(-2);
  do { x = depFmtAcc(f.store, f.display, f.branch, tt, n); } while ((accounts || []).some(a => a.accNo === x.display) && ++n);
  return { code, next: n, ...x };
};
// อัตราดอกเบี้ย — แท็บอัตรา Int./Div. → เมนูอัตราดอกเบี้ยเงินฝาก (ตามวันที่มีผล + ช่วงยอดเงิน)
const depOpenRate = (rec, openerType, amt, date) => {
  const mt = openerType === 'member' ? 'regular' : 'ext-person';
  const tiers = (rec && rec.rateTiers) || [];
  const t = tiers.find(x => x.memberType === mt) || tiers[0];
  const tb = t && (window.depIntTables ? window.depIntTables() : []).find(x => x.code === t.rateTable);
  if (tb && tb.enabled !== false) {
    const rows = (tb.rows || []).filter(r => (!r.effectiveDate || r.effectiveDate <= date) && (!r.endDate || r.endDate >= date));
    const hit = rows.find(r => amt >= Number(r.balFrom || 0) && amt <= Number(r.balTo || 99999999)) || (tb.rows || []).find(r => r.id === t.rateRow);
    if (hit) return { rate: Number(hit.rate) || 0, src: tb.code };
  }
  return { rate: Number((rec && rec.interest && rec.interest.rate) || 0), src: '' };
};
// ธนาคาร — เมนูค่าคงที่ธนาคาร
const depBanks = () => { const l = window.depBankLoad ? window.depBankLoad().filter(b => b.enabled !== false).map(b => b.name) : []; return l.length ? l : (window.DEP_BANKS || []); };

function depAddMonths(iso, months) {
  if (!iso || !months) return '';
  const d = new Date(iso); d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
function depNameEng(name) {
  // ประมาณชื่ออังกฤษจากชื่อไทย (placeholder ให้ผู้ใช้แก้ได้)
  return '';
}


// ── หัว section (มีเลขลำดับ + ปุ่มขวา) ──
// หัวการ์ดระบบเงินฝาก — ขีดเขียวซ้ายแบบเดียวทุกการ์ด (icon/bar คงไว้เพื่อความเข้ากันได้ ไม่ใช้แสดงผล)
function DepSecHead({ icon, n, title, sub, right, style, bar, meta }) {
  return (
    <div className="dat-section-head is-bar" style={style}>
      {n != null && n !== '' && <span className="dep-step-n">{n}</span>}
      <span className="head-bar" />
      <div style={{ minWidth: 0 }}>
        <div className="dat-section-title">{title}</div>
        {sub && <div className="muted" style={{ fontSize: 11.5 }}>{sub}</div>}
      </div>
      {(meta || right) && (
        <div className="dep-sec-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {meta && <span className="muted" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>{meta}</span>}
          {right}
        </div>
      )}
    </div>
  );
}

const thDate = (iso) => { if (!iso) return '—'; const [y, m, d] = String(iso).split('-'); return `${d}/${m}/${Number(y) + 543}`; };

// ── ฟิลด์ย่อ (label + control) ──
function DatFieldLite({ label, children, span, required, top }) {
  const st = { ...(span > 1 ? { gridColumn: 'span ' + span } : {}), ...(top ? { alignSelf: 'start' } : {}) };
  return (
    <div className="dat-field" style={Object.keys(st).length ? st : undefined}>
      <label className="dat-label">{label}{required && <span className="cfg-required"> *</span>}</label>
      {children}
    </div>
  );
}

function DepOpenAccountPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);

  // ── 1) เอกสารเปิดบัญชี ──
  const [openDate, setOpenDate] = useState(new Date().toISOString().slice(0, 10));
  const [typeCode, setTypeCode] = useState('');
  const [certNo, setCertNo] = useState('');
  // เลขที่สมุด (ตัวอย่างเลขถัดไป) — ออกจริงตอนบันทึก
  const autoCertFor = (tc, pj) => window.depBookPeek ? window.depBookPeek({ typeCode: tc, projectCode: pj }, openDate) : '';
  const [noBook, setNoBook] = useState(false);
  const [printer, setPrinter] = useState(DEP_PRINTERS[0]);
  const [printBook, setPrintBook] = useState(true);

  // ── 2) เจ้าของบัญชี ──
  const [openerType, setOpenerType] = useState('member');
  const [extId, setExtId] = useState('');           // เลขบัตร/เลขทะเบียน (บุคคล/นิติบุคคลภายนอก)
  const [member, setMember] = useState(null);
  const [extPick, setExtPick] = useState(null);     // บุคคล/นิติบุคคลภายนอกที่เลือกจากทะเบียน
  const [jointModal, setJointModal] = useState(null); // index แถวผู้ฝากร่วมที่เปิด popup
  const [nameTh, setNameTh] = useState('');
  const [nameEng, setNameEng] = useState('');
  const [phone, setPhone] = useState('');   // เบอร์ติดต่อ — ใช้ภายใน ไม่แสดงในรายงาน/เอกสารพิมพ์
  const holderTypes = React.useMemo(() => {
    const l = window.depHolderTypeLoad ? window.depHolderTypeLoad().filter(r => r.enabled !== false) : [];
    return l.length ? l : [{ code: '01', name: 'บุคคลธรรมดา' }];
  }, []);
  const defHolder = (holderTypes.find(h => h.code === '01') || holderTypes[0] || {}).code || '01';
  const [holderType, setHolderType] = useState(defHolder);
  const [withdrawCond, setWithdrawCond] = useState('');
  const openByOpts = useMemo(() => (window.depOpenByOpts ? window.depOpenByOpts() : DEP_OPENED_BY), []);
  // ประเภทคู่บัญชี — เฉพาะที่เปิดใช้งาน
  const pairRows = useMemo(() => (window.depTxnPairLoad ? window.depTxnPairLoad() : []).filter(r => r.enabled !== false), []);
  const drFor = (ob) => { const seen = new Set(); return pairRows.filter(r => r.openBy === ob && !seen.has(r.code) && seen.add(r.code)); };
  const defOpenBy = openByOpts.includes('เปิดบัญชีใหม่ด้วยเงินสด') ? 'เปิดบัญชีใหม่ด้วยเงินสด' : openByOpts[0];
  const [openedBy, setOpenedBy] = useState('');
  const [drCode, setDrCode] = useState('');
  const pickOpenedBy = (ob) => { setOpenedBy(ob); setDrCode(ob ? ((drFor(ob)[0] || {}).code || '') : ''); };
  // รหัสคู่บัญชี DR — ทุกบัญชีในเมนูประเภทการทำรายการคู่บัญชี (ไม่ซ้ำรหัส) · บัญชีที่ผูกกับวิธีเปิดบัญชีขึ้นก่อน
  const drOpts = useMemo(() => {
    const bound = new Set(drFor(openedBy).map(r => r.code)), seen = new Set(), out = [];
    pairRows.forEach(r => { if (!seen.has(r.code)) { seen.add(r.code); out.push({ code: r.code, name: r.name, bound: bound.has(r.code) }); } });
    return out.sort((a, b) => (b.bound - a.bound) || String(a.code).localeCompare(String(b.code)));
  }, [openedBy, pairRows]);
  const [refNo, setRefNo] = useState('');

  // ── 3) การรับเงินเปิดบัญชี ──
  const [intMethod, setIntMethod] = useState('compound');
  const [srcAcc, setSrcAcc] = useState('');
  const [srcBank, setSrcBank] = useState('');
  const [srcBranch, setSrcBranch] = useState('');
  const [srcName, setSrcName] = useState('');
  const [inAmt, setInAmt] = useState('');
  const [extAmt, setExtAmt] = useState('');

  // ── 4) ผู้ฝากร่วม ──
  const [joints, setJoints] = useState([]);

  // ── 5) ส่งฝากรายงวด ──
  const [periodicMode, setPeriodicMode] = useState('none');
  const [periodicAmt, setPeriodicAmt] = useState('');

  // ── 6) รายการเช็ค ──
  const [cheques, setCheques] = useState([]);

  const [slip, setSlip] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allTypes = useMemo(depOpenTypes, []);
  // เงื่อนไขเปิดบัญชี: “ไม่อนุญาต” ไม่แสดงในรายการ · “เฉพาะบางกรณี” ต้องส่งอนุมัติ
  const accTypes = allTypes.filter(t => t.st.openCond !== 'deny');
  const accType = accTypes.find(t => t.code === typeCode);
  const [projRoundId, setProjRoundId] = useState('');
  // รอบโครงการที่เปิดรับสมัครอยู่และตรงกับประเภทเงินฝากที่เลือก
  const projOptions = useMemo(
    () => (typeCode && window.dpjOpenRoundsFor ? window.dpjOpenRoundsFor(typeCode, openDate) : []),
    [typeCode, openDate]);
  const proj = projOptions.find(o => o.round.id === projRoundId);
  const projRound = proj ? proj.round : null;
  // เปิดบัญชีไม่ต้องผ่านการอนุมัติ — บันทึกแล้วบัญชีใช้งานได้ทันที (ทุกประเภทที่อนุญาตให้เปิด)
  const needApprove = false;
  // ส่งฝากรายงวด — ค่าตั้งต้น "ไม่ต้องการฝากรายเดือน" ทุกประเภท · เจ้าหน้าที่เลือกเองได้
  //  ล็อกเฉพาะประเภทฝากประจำที่ไม่ได้กำหนดให้ส่งรายงวด (ฝากครั้งเดียวตอนเปิด)
  const typePeriodic = !!accType && (accType.st?.periodicSend === 'period' || accType.st?.periodicSend === true);
  const periodicLocked = !!accType && !typePeriodic && !!(window.depIsFixedType && window.depIsFixedType(typeCode));
  // งวดเรียกเก็บ — ระบบกำหนดให้ (ไม่ต้องกรอก): เริ่ม = งวดที่เปิดบัญชี · ถึง = ตามจำนวนงวดของประเภท (ไม่กำหนด = 9999999)
  //  แก้ภายหลังที่เมนูเปลี่ยนแปลงฝากรายเดือน
  const periodicFrom = depPerOf(openDate);
  const periodicUntil = depPerUntil(periodicFrom, accType?.st?.periodicCount);
  const ownerCode = openerType === 'member' ? member?.code : extId;  const ownerReady = openerType === 'member' ? !!member : (!!extId.trim() && !!nameTh.trim());
  useEffect(() => { pickOpenedBy(ownerCode ? defOpenBy : ''); }, [ownerCode]);
  // เลขที่บัญชี — จากรหัสคุมเลขที่บัญชี + รูปแบบเลขบัญชี (ถ้าประเภทนี้ไม่ได้กำหนดรหัสคุม ใช้วิธีเดิม)
  const accNoInfo = useMemo(() => {
    if (!ownerCode || !accType) return null;
    const code = String(accType.st.docNo || '').trim().toUpperCase();
    if (!code) return { accNo: window.depGenAccNo(typeCode, ownerCode, accounts), src: '' };
    const n = window.depNextAccNo(accType, accounts);
    if (!n) return { accNo: '—', src: code, err: 'ไม่พบรหัสคุมเลขที่บัญชี “' + code + '” — ติดต่อฝ่าย IT ก่อนเปิดบัญชีประเภทนี้' };
    return { accNo: n.display, src: code, next: n.next };
  }, [ownerCode, typeCode, accounts, accType]);
  const accNo = accNoInfo ? accNoInfo.accNo : '—';
  const stTerm = accType && (accType.st.fixedTerm || accType.st.hasTerm) ? Number(accType.st.termMonths) || 0 : 0;
  const termMonths = (projRound && Number(projRound.termMonths)) || stTerm || DEP_TERM_MONTHS[typeCode] || 0;
  const maturityDate = termMonths ? depAddMonths(openDate, termMonths) : '';

  const minOpen = (projRound && projRound.minOpen) ? Number(projRound.minOpen) : Number(accType?.st?.minOpen ?? accType?.cond?.minOpen ?? 0);
  const inNum = Number(inAmt) || 0;
  const extNum = Number(extAmt) || 0;
  const chequeSum = cheques.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalNet = inNum + extNum + chequeSum;
  const openRate = accType ? depOpenRate(accType, openerType, totalNet, openDate) : { rate: 0, src: '' };

  const [extTick, setExtTick] = useState(0);
  const [quickAdd, setQuickAdd] = useState(false);
  // ทะเบียนบุคคล/นิติบุคคลภายนอก (ใช้ค้นหาเลขทะเบียนในโหมดภายนอก)
  const extSource = useMemo(() => (window.depExtPersonsLoad ? window.depExtPersonsLoad() : [])
    .filter(p => p.kind === (openerType === 'juristic' ? 'juristic' : 'person') && (!p.status || p.status === 'ใช้งาน'))
    .map(p => ({ ...p, name: p.kind === 'juristic' ? (p.orgName || '') : [p.title, p.firstName, p.lastName].filter(Boolean).join(' ').replace(/^(นาย|นาง|นางสาว) /, '$1'),
                 citizenId: p.kind === 'juristic' ? (p.taxId || '') : (p.citizenId || '') })), [openerType, extTick]);
  const condOf = (name, phone) => [name, phone ? 'โทร ' + phone : ''].filter(Boolean).join(' · ');

  // เมื่อเลือกสมาชิก → เติมข้อมูลเจ้าของบัญชี + เงื่อนไขการถอน (ชื่อ · เบอร์)
  useEffect(() => {
    if (openerType !== 'member') return;
    if (!member) { setNameTh(''); setNameEng(''); setWithdrawCond(''); setPhone(''); return; }
    setNameTh(member.name);
    setPhone(member.mobile || member.phone || '');
    setNameEng(prev => prev || '');
    setWithdrawCond(condOf(member.name, member.mobile || member.phone));
  }, [member, openerType]);

  const pickExt = (p) => {
    setExtPick(p); setExtId(p.code); setNameTh(p.kind === 'juristic' ? '' : p.name); setPhone(p.mobile || p.phone || '');
    setWithdrawCond(p.kind === 'juristic' ? '' : condOf(p.name, p.mobile || p.phone));
  };

  // เมื่อสลับประเภทผู้เปิดบัญชี → ล้างข้อมูลเจ้าของบัญชี + ตั้งค่าผู้ถือตามประเภท
  useEffect(() => {
    setMember(null); setExtPick(null); setExtId(''); setNameTh(''); setNameEng(''); setWithdrawCond(''); setPhone('');
    setHolderType(defHolder);
  }, [openerType]);

  // เมื่อเลือกประเภทบัญชี → เติมค่าเริ่มต้นตามค่าคงที่ประเภทบัญชี
  useEffect(() => {
    if (!accType) return;
    const st = accType.st || {};
    setNoBook(st.passbookHold ? st.passbookHold !== 'book' : (!accType.passbook?.useBook && !!accType.passbook?.noBook));
    setInAmt(''); setExtAmt(String(Number(st.minOpen ?? accType.cond?.minOpen) || ''));
    setProjRoundId('');
    setIntMethod(st.intReceiveMode || 'compound');
    setPeriodicMode('none'); setPeriodicAmt('');
  }, [typeCode]);

  useEffect(() => {
    if (projRound && projRound.minOpen) setExtAmt(String(projRound.minOpen));
  }, [projRoundId]);

  const errors = [];
  if (openerType === 'member' && member && !depMemberWork(member).ok) errors.push(`สมาชิกมีสถานะ “${depMemberWork(member).label}” — ต้องตรวจสอบสิทธิ์ก่อนเปิดบัญชี`);
  if (accType) {
    const st = accType.st || {};
    if (!depPersonOk(st.personType, openerType, member))
      errors.push(`ประเภท “${accType.name}” เปิดได้เฉพาะ${window.datLabel ? window.datLabel('personType', st.personType) : st.personType} — ไม่ตรงกับเจ้าของบัญชีนี้`);
    if (totalNet < minOpen) errors.push(`ยอดเงินเปิดบัญชีต้องไม่น้อยกว่าขั้นต่ำ ${fmt.money(minOpen, 0)} บาท`);
    if (st.maxBalanceOn && Number(st.maxBalance) > 0 && totalNet > Number(st.maxBalance))
      errors.push(`ยอดเงินเปิดบัญชีเกินยอดคงเหลือสูงสุดของประเภทนี้ ${fmt.money(Number(st.maxBalance), 2)} บาท`);
    if (accNoInfo && accNoInfo.err) errors.push(accNoInfo.err);
    if (periodicMode !== 'none') {
      const minDep = Number(st.minDeposit) || 0;
      if (!(Number(periodicAmt) > 0)) errors.push('กรุณาระบุจำนวนส่งต่องวด');
      else if (minDep > 0 && Number(periodicAmt) < minDep) errors.push(`จำนวนส่งต่องวดต้องไม่น้อยกว่าฝากขั้นต่ำของประเภทนี้ ${fmt.money(minDep, 2)} บาท`);
    }
  }
  const cashOpen = /เงินสด/.test(openedBy || '');
  const ctBlocked = !(window.depCtCashReady && window.depCtCashReady());
  // จำนวนบัญชีที่เปิดได้ต่อสมาชิก — ตามค่าคงที่ประเภทเงินฝาก
  // จำนวนบัญชีที่เปิดได้ (แท็บข้อมูลหลัก) + จำกัดจำนวนบัญชีต่อสมาชิก (แท็บข้อกำหนดและการปรับ)
  const limitMsg = (() => {
    if (!accType || !ownerReady) return '';
    const st = accType.st || {};
    const key = openerType === 'member' ? (member && member.code) : extId;
    const have = accounts.filter(a => a.typeCode === accType.code && a.status !== 'closed' && (a.member === key || a.memberCode === key)).length;
    const max = (st.accountOpenRule === 'one' || st.accountOpenRule === 'reopen') ? 1 : (st.limitAccounts && Number(st.maxAccounts) ? Number(st.maxAccounts) : 0);
    if (!max || have < max) return '';
    return st.accountOpenRule === 'reopen'
      ? 'มีบัญชีประเภท “' + accType.name + '” ที่ยังไม่ปิดอยู่แล้ว — เปิดใหม่ได้เมื่อปิดบัญชีเดิม'
      : 'เจ้าของบัญชีมีบัญชีประเภท “' + accType.name + '” ครบ ' + max + ' บัญชีแล้ว — ไม่สามารถเปิดเพิ่มได้';
  })();
  const canSubmit = ownerReady && accType && errors.length === 0 && !ctBlocked && !limitMsg;
  const openerCfg = DEP_OPENER_TYPES.find(o => o.v === openerType) || DEP_OPENER_TYPES[0];

  const reset = () => {
    setOpenerType('member'); setMember(null); setExtId(''); setTypeCode(''); setCertNo(''); setNoBook(false);
    setHolderType(defHolder); setWithdrawCond(''); pickOpenedBy(''); setRefNo('');
    setIntMethod('compound'); setSrcAcc(''); setSrcBank(''); setSrcBranch(''); setSrcName('');
    setInAmt(''); setExtAmt(''); setJoints([]); setPeriodicMode('none'); setPeriodicAmt('');
    setCheques([]); setSlip(null);
  };

  // ผู้ฝากร่วม
  const addJoint = () => setJoints(j => [...j, { ref: '', name: '' }]);
  const typeJointRef = (i, v) => {
    const hit = (window.DEP_TXN_MEMBERS || []).find(x => x.code === v.trim());
    setJoints(j => j.map((x, idx) => idx === i ? { ...x, ref: v, name: hit ? hit.name : x.name } : x));
  };
  const setJoint = (i, patch) => setJoints(j => j.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const delJoint = (i) => setJoints(j => j.filter((_, idx) => idx !== i));

  // เช็ค
  const addCheque = () => setCheques(c => [...c, { no: '', faceDate: '', bank: '', branch: '', type: 'CL', float: 1, amount: '', late: false }]);
  const setCheque = (i, patch) => setCheques(c => c.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const delCheque = (i) => setCheques(c => c.filter((_, idx) => idx !== i));

  const submit = () => {
    if (limitMsg) { onToast && onToast(limitMsg); return; }
    if (!canSubmit) return;
    const openerLabel = DEP_OPENER_TYPES.find(o => o.v === openerType)?.l || '';
    const bookNo = noBook ? '' : (certNo || (window.depBookIssue ? window.depBookIssue({ typeCode, projectCode: proj ? proj.project.code : '' }, openDate) : '') || '');
    const rec = {
      accNo, member: ownerCode, name: nameTh || member?.name, dept: member?.dept || '—', memberStatus: member ? depMemberWork(member).label : '—',
      openerType, ownerKind: openerType, extId, typeCode, type: accType.name, openDate, rate: openRate.rate, rateTable: openRate.src, accCounter: accNoInfo ? accNoInfo.src : '', depGroup: accType.st.depGroup || '',
      balance: totalNet, status: needApprove ? 'pending' : 'active',
      openedBy: OPEN_USER, openReqAt: new Date().toISOString(), openTerm: window.DEP_DAILY_TERMINAL || '',
      payrollLinked: false, bank: srcBank, bankAcc: srcAcc, bankLinkStatus: srcBank ? 'pending' : 'none',
      useLoan: !!accType.control?.loanDisburse, useFuneral: false,
      freeQuota: accType.st.wdCountLimit ? Number(accType.st.wdCountMax) || 0 : (accType.withdraw.freeCount || 0), freeUsed: 0, ytdInterest: 0,
      certNo: bookNo, bookHistory: bookNo ? [{ no: bookNo, issuedAt: openDate, reason: 'เปิดบัญชี', status: 'active', by: OPEN_USER }] : [], contactPhone: phone, noBook, holderType, withdrawCond, withdrawCondText: withdrawCond, intMethod, joints, maturityDate,
      projectCode: proj ? proj.project.code : '', projectName: proj ? proj.project.name : '',
      projectRoundId: projRound ? projRound.id : '', projectRoundName: projRound ? projRound.name : '',
      rateBonus: projRound ? Number(projRound.rateBonus) || 0 : 0,
      ...(periodicMode !== 'none' && Number(periodicAmt) > 0 ? { monthlyDeposit: Number(periodicAmt), collectUntil: String(periodicUntil).trim(), payrollLinked: true } : {}),
    };
    const next = [rec, ...accounts];
    setAccounts(next); window.depTxnSaveAccounts(next);
    // ฝากรายเดือน — บันทึกประวัติแถวแรก "ตั้งยอดตอนเปิดบัญชี" (เมนูเปลี่ยนแปลงฝากรายเดือน)
    if (Number(rec.monthlyDeposit) > 0 && window.depMonthlyLoadHistory) {
      window.depMonthlySaveHistory([{ id: 'OPEN-' + accNo, accNo, member: ownerCode, reqDate: openDate, date: openDate,
        oldAmount: 0, newAmount: Number(rec.monthlyDeposit), collectUntil: rec.collectUntil,
        by: window.depOpsUser ? window.depOpsUser() : OPEN_USER,
        note: '', source: 'open', status: 'applied' }, ...window.depMonthlyLoadHistory()]);
    }
    if (accNoInfo && accNoInfo.src && accNoInfo.next) window.depBumpAccCounter(accNoInfo.src, accNoInfo.next);

    const ledger = window.depTxnLoadLedger();
    const txId = window.depTxnNextId();
    window.depTxnSaveLedger([{ id: txId, date: openDate, accNo, member: ownerCode, type: 'deposit', channel: 'เปิดบัญชี', amount: totalNet, balance: totalNet, ref: 'OPEN', by: OPEN_USER }, ...ledger]);

    if (projRound && window.dpjLoad) {
      try {
        const all = window.dpjLoad().map(p => p.code !== proj.project.code ? p : {
          ...p, rounds: p.rounds.map(r => r.id === projRound.id ? { ...r, joined: Number(r.joined || 0) + 1 } : r),
        });
        localStorage.setItem('dep_projects_v1', JSON.stringify(all));
      } catch (e) {}
    }
    audit.log({ action: needApprove ? 'submit' : 'create', module: 'เงินฝาก — เปิดบัญชี',
      target: `${ownerCode} · ${nameTh || member?.name || ''}`,
      summary: needApprove ? `ส่งอนุมัติเปิดบัญชี ${accType.name} (${accNo})` : `เปิดบัญชี ${accType.name} (${accNo}) เงินเปิด ${fmt.money(totalNet, 2)} บาท`,
      changes: [{ field: 'เลขที่บัญชี', before: '—', after: accNo }, { field: 'เงินเปิดบัญชี', before: '—', after: fmt.money(totalNet, 2) },
        ...(Number(rec.monthlyDeposit) > 0 ? [{ field: 'ฝากรายเดือน', before: '—', after: fmt.money(rec.monthlyDeposit, 2) + ' บาท · ถึงงวด ' + rec.collectUntil }] : [])] });

    setSlip({
      title: needApprove ? 'คำขอเปิดบัญชีเงินฝาก (รออนุมัติ)' : 'หลักฐานการเปิดบัญชีเงินฝาก',
      sub: `เลขที่รายการ ${txId} · วันที่ ${fmt.date(openDate)}`,
      rows: [
        { k: 'ประเภทผู้เปิดบัญชี', v: openerLabel },
        { k: openerType === 'member' ? 'สมาชิก / เจ้าของบัญชี' : 'เจ้าของบัญชี', v: `${ownerCode || '—'} · ${nameTh || member?.name || ''}` },
        { k: 'ประเภทบัญชี', v: accType.name },
        ...(projRound ? [{ k: 'โครงการ', v: `${proj.project.name} — ${projRound.name}` }] : []),
        { k: 'เลขที่บัญชี', v: accNo, mono: true },
        ...(maturityDate ? [{ k: 'วันครบกำหนด', v: fmt.date(maturityDate), mono: true }] : []),
        { k: 'อัตราดอกเบี้ย', v: openRate.rate.toFixed(2) + '%', mono: true },
        { k: 'เงินโอนภายใน', v: fmt.money(inNum, 2) + ' บาท', mono: true },
        { k: 'เงินสด/โอนภายนอก', v: fmt.money(extNum + chequeSum, 2) + ' บาท', mono: true },
        { k: 'รวมสุทธิเปิดบัญชี', v: fmt.money(totalNet, 2) + ' บาท', mono: true, strong: true },
        { k: 'สถานะ', v: needApprove ? 'รออนุมัติจากแผนกประมวลผล' : 'เปิดบัญชีสมบูรณ์' },
      ],
      foot: needApprove ? 'บัญชีนี้ต้องได้รับอนุมัติก่อนเริ่มทำรายการ' : 'เชื่อมระบบบัญชีเพื่อบันทึกบัญชีอัตโนมัติแล้ว',
    });
    window.depSuccess(needApprove
      ? { title: 'ส่งอนุมัติเปิดบัญชีเรียบร้อยแล้ว', desc: 'เลขที่บัญชี ' + accNo, next: 'รอหัวหน้าอนุมัติที่เมนูอนุมัติทำรายการ ก่อนเริ่มทำรายการกับบัญชีนี้' }
      : { title: 'เปิดบัญชีเรียบร้อยแล้ว', desc: 'เลขที่บัญชี ' + accNo, onPrint: () => depPrintSlip(onToast) });
    false && onToast(needApprove ? `ส่งคำขอเปิดบัญชี ${accNo} เข้าอนุมัติแล้ว` : `เปิดบัญชี ${accNo} เรียบร้อยแล้ว`);
  };

  const validate = () => {
    if (errors.length) { onToast && onToast(errors[0]); return; }
    if (!ownerReady) { onToast && onToast(openerType === 'member' ? 'กรุณาเลือกสมาชิกเจ้าของบัญชีก่อน' : 'กรุณาระบุเลขทะเบียนและชื่อเจ้าของบัญชี'); return; }
    if (!accType) { onToast && onToast('กรุณาเลือกประเภทเงินฝาก'); return; }
    onToast && onToast('ตรวจสอบข้อมูลครบถ้วน — พร้อมบันทึกเปิดบัญชี');
  };

  // เลือกบัญชีจากรายการธนาคาร → เติมธนาคาร / สาขา / ชื่อบัญชี
  const pickCoopAcct = (no) => {
    setSrcAcc(no);
    const a = depBankAccts().find(x => x.acctNo === no);
    setSrcBank(a ? depBankName(a.bankCode) : '');
    setSrcBranch(a ? (a.branch || '') : '');
    setSrcName(a ? (a.acctName || '') : '');
  };

  // โอนเข้าบัญชีธนาคาร → ดึงบัญชีธนาคารของสมาชิก (เลขที่บัญชียังแก้ไขได้)
  useEffect(() => {
    if (intMethod !== 'tobank' || !member) return;
    setSrcAcc(member.bankAcc || member.bankAcct || '');
    setSrcBank(member.bank || '');
    setSrcBranch(member.bankBranch || member.branch || '');
    setSrcName(member.bankAccName || member.name || '');
  }, [intMethod, member && member.code]);

  return (
    <div data-screen-label="หน้าเปิดบัญชีเงินฝาก" className="dep-open">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปิดบัญชีเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึกเอกสารเปิดบัญชี ตรวจสอบเจ้าของบัญชี กำหนดประเภทเงินฝาก และรับเงินเปิดบัญชี</div>
        </div>
        <span className="spacer" />
        <div className="dep-open-toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {slip && <button className="btn sm" data-keep-top="" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์เอกสาร</button>}
          <button className="btn sm" data-keep-top="" disabled={!ownerReady || !accType || noBook} title={noBook ? 'เปิดบัญชีแบบไม่มีสมุด — ไม่มีการพิมพ์สมุด' : undefined} onClick={() => onToast && onToast('ส่งพิมพ์ปกสมุดแล้ว')}>
            <Icon name="print" /> พิมพ์ปกสมุด
          </button>
          <button className="btn sm" data-keep-top="" disabled={!ownerReady || !accType || noBook} title={noBook ? 'เปิดบัญชีแบบไม่มีสมุด — ไม่มีการพิมพ์สมุด' : undefined} onClick={() => onToast && onToast('ส่งพิมพ์ BOOK แล้ว')}>
            <Icon name="print" /> พิมพ์ BOOK
          </button>
          <button className="btn primary sm" data-keep-top="" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
            <Icon name="check" /> {needApprove ? 'ส่งอนุมัติ' : 'บันทึกเปิดบัญชี'}
          </button>
        </div>
      </div>

      {ctBlocked && window.DepCtGateBanner && <window.DepCtGateBanner what="การเปิดบัญชี" />}

      {/* 1 · ข้อมูลเอกสารเปิดบัญชี */}
      <div className="search-card dat-section">
        <DepSecHead icon="report" title="ข้อมูลเอกสารเปิดบัญชี" sub="วันที่ทำรายการ ประเภทเงินฝาก และการพิมพ์สมุด"
          right={
            <div className="dep-open-printer">
              <label className="dpc-check">
                <input type="checkbox" checked={printBook && !noBook} disabled={noBook}
                       onChange={(e) => setPrintBook(e.target.checked)} /> เครื่องพิมพ์
              </label>
              <select className="cfg-input" value={printer} disabled={noBook || !printBook} onChange={(e) => setPrinter(e.target.value)}>
                {DEP_PRINTERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          } />
        <div className="dat-grid g3">
          <DatFieldLite label="วันที่เปิดบัญชี" required>
            <div className="cfg-display-box">{(() => { const [y, m, d] = String(openDate).split('-'); return y ? d + '/' + m + '/' + (Number(y) + 543) : '—'; })()}</div>
          </DatFieldLite>
          <DatFieldLite label="วันที่ครบกำหนด">
            {termMonths
              ? <div className="cfg-display-box mono">{maturityDate ? fmt.date(maturityDate) : 'วว/ดด/ปปปป'}</div>
              : <div className="cfg-display-box muted">— (เฉพาะเงินฝากประจำ)</div>}
          </DatFieldLite>
          <DatFieldLite label="ประเภทเงินฝาก" required>
            <select className="cfg-input" value={typeCode} onChange={(e) => setTypeCode(e.target.value)}>
              <option value="">— เลือกประเภทเงินฝาก —</option>
              {accTypes.map(t => <option key={t.code} value={t.code}>{t.code} · {t.name}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="โครงการเงินฝาก">
            {!typeCode
              ? <div className="cfg-display-box muted">— เลือกประเภทเงินฝากก่อน —</div>
              : projOptions.length === 0
                ? <div className="cfg-display-box muted">— ไม่มีโครงการที่เปิดรับสมัคร —</div>
                : <select className="cfg-input" value={projRoundId} onChange={(e) => setProjRoundId(e.target.value)}>
                    <option value="">— ไม่เข้าร่วมโครงการ —</option>
                    {projOptions.map(o => (
                      <option key={o.round.id} value={o.round.id}>
                        {o.project.code} · {o.round.name} (เหลือ {Math.max(0, Number(o.round.quotaMax || 0) - Number(o.round.joined || 0)).toLocaleString()} สิทธิ์)
                      </option>
                    ))}
                  </select>}
          </DatFieldLite>
          <DatFieldLite label="เลขที่บัญชี (สร้างอัตโนมัติ)">
            <div className="cfg-display-box mono strong">{accNo}</div>
          </DatFieldLite>
          <DatFieldLite label="เลขที่สมุด / Certificate (สร้างอัตโนมัติ)">
            <div className="cfg-display-box mono">{noBook ? 'ไม่มีสมุด (No Book)'
              : (() => { const n = typeCode ? autoCertFor(typeCode, proj ? proj.project.code : '') : ''; return n ? (window.depBookFmt ? window.depBookFmt(n) : n) : (typeCode ? 'ประเภทเงินฝากนี้กำหนดไม่มีสมุด' : '—'); })()}</div>
          </DatFieldLite>
        </div>
        {projRound && (
          <div style={{ padding: '0 16px', marginTop: 6 }}>
            <div className="dat-warn info" style={{ marginTop: 0 }}>
              <Icon name="info" size={14} />
              <span>
                เข้าร่วมโครงการ <b>{proj.project.name} — {projRound.name}</b> ·
                สิทธิ์คงเหลือ <b>{Math.max(0, Number(projRound.quotaMax || 0) - Number(projRound.joined || 0)).toLocaleString()}</b> / {Number(projRound.quotaMax || 0).toLocaleString()} คน
                {projRound.rateBonus ? <> · ดอกเบี้ยพิเศษ <b>+{Number(projRound.rateBonus).toFixed(2)}%</b></> : null}
                {projRound.minOpen ? <> · เปิดขั้นต่ำตามโครงการ <b>{fmt.money(projRound.minOpen, 0)}</b> บาท</> : null}
                {projRound.termMonths ? <> · ระยะเวลา <b>{projRound.termMonths}</b> เดือน</> : null}
              </span>
            </div>
          </div>
        )}
        {accType && (
          <div className="dep-inline-check">
            <span className="muted" style={{ fontSize: 11.5 }}>อัตราดอกเบี้ย {openRate.rate.toFixed(2)}%{openRate.src ? ' (' + openRate.src + ')' : ''}{accType.interest.payCycle ? ' · จ่าย ' + accType.interest.payCycle : ''}{limitMsg && <span style={{ color: 'var(--danger, #cf1322)', fontWeight: 600 }}> · {limitMsg}</span>}</span>
          </div>
        )}
      </div>

      {/* 2 · ข้อมูลเจ้าของบัญชี */}
      <div className="search-card dat-section">
        <DepSecHead icon="user" title="ข้อมูลเจ้าของบัญชี" sub="เลือกประเภทผู้เปิดบัญชี แล้วระบุ/ค้นหาข้อมูลเจ้าของบัญชี"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }} title={accType ? 'ค่าตั้งต้นตามประเภทเงินฝาก: ' + (accType.st.passbookHold === 'book' ? 'มีสมุด' : 'ไม่มีสมุด') : 'เลือกประเภทเงินฝากก่อน'}>
              <span className="muted" style={{ fontSize: 12.5 }}>เปิดบัญชีแบบ</span>
              <label className="dpc-check"><input type="checkbox" checked={!noBook} disabled={!accType} onChange={(e) => setNoBook(!e.target.checked)} /> มีสมุด</label>
              <label className="dpc-check"><input type="checkbox" checked={noBook} disabled={!accType} onChange={(e) => setNoBook(e.target.checked)} /> ไม่มีสมุด</label>
            </div>
          } />

        {/* เลือกประเภทผู้เปิดบัญชี — สมาชิกสหกรณ์ / บุคคลภายนอก / นิติบุคคลภายนอก */}
        <div className="dep-opener-seg">
          <span className="dep-opener-lab">เปิดบัญชีให้</span>
          <span className="seg dep-opener-tabs">
            {DEP_OPENER_TYPES.map(o => (
              <button key={o.v} type="button"
                      className={"seg-btn " + (openerType === o.v ? 'active' : '')}
                      onClick={() => setOpenerType(o.v)}>
                <Icon name={o.icon} size={14} /> {o.l}
              </button>
            ))}
          </span>
        </div>

        {openerType === 'member' && member && (
          <div style={{ padding: '0 16px' }}>
            <div className="dep-member-strip">
              <div className="member-avatar" style={{ width: 34, height: 34 }}>{member.name.slice(0, 2)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{member.name} <span className="muted mono" style={{ fontWeight: 400 }}>· {member.code}</span></div>
                <div className="muted" style={{ fontSize: 12 }}>{member.dept} · เลขบัตร {member.citizenId}</div>
              </div>
              <span className={"chip " + depMemberWork(member).tone}><span className="dot-c" />{depMemberWork(member).label}</span>
            </div>
          </div>
        )}
        {openerType !== 'member' && extPick && (
          <div style={{ padding: '0 16px' }}>
            <div className="dep-member-strip">
              <div className="member-avatar" style={{ width: 34, height: 34 }}>{(extPick.name || '').replace(/^(บริษัท|ห้างหุ้นส่วน(จำกัด|สามัญ)?|นาย|นาง|นางสาว)\s*/, '').slice(0, 2)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{extPick.name} <span className="muted mono" style={{ fontWeight: 400 }}>· {extPick.code}</span></div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {openerType === 'juristic' ? 'เลขผู้เสียภาษี ' + (extPick.taxId || '—') : 'เลขบัตร ' + (extPick.citizenId || '—')}
                  {(extPick.phone || extPick.mobile) ? ' · โทร ' + (extPick.phone || extPick.mobile) : ''}
                </div>
              </div>
              <span className="chip">{openerType === 'juristic' ? 'นิติบุคคลภายนอก' : 'บุคคลภายนอก'}</span>
            </div>
          </div>
        )}
        {openerType !== 'member' && !extPick && (
          <div style={{ padding: '0 16px' }}>
            <div className="dat-warn info" style={{ marginTop: 0 }}>
              <Icon name="info" size={14} />
              <div>{openerType === 'person'
                ? 'เปิดบัญชีให้บุคคลภายนอก (ไม่ใช่สมาชิก) — ค้นหาเลขทะเบียนบุคคลภายนอก ระบบจะเติมชื่อและเงื่อนไขการถอนให้'
                : 'เปิดบัญชีให้นิติบุคคลภายนอก — ค้นหาเลขทะเบียนนิติบุคคลภายนอก ระบบจะเติมชื่อและเงื่อนไขการถอนให้'}</div>
            </div>
          </div>
        )}

        <div className="dat-grid g3">
          {/* แถว 1 · ตัวตน */}
          {openerType === 'member' ? (
            <>
              <DatFieldLite label="เลขสมาชิก" required>
                <MemberSearchField member={member} onPick={setMember}
                                   source={window.DEP_TXN_MEMBERS}
                                   searchFn={(c) => window.msSearchMembers(window.DEP_TXN_MEMBERS, c)}
                                   title="ค้นหาสมาชิก" placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />
              </DatFieldLite>
              <DatFieldLite label="หน่วย / สังกัด">
                <div className="cfg-display-box">{member ? (member.dept || '—') : '—'}</div>
              </DatFieldLite>
            </>
          ) : (
            <>
              <DatFieldLite label="เลขทะเบียน" required>
                <MemberSearchField member={extPick} onPick={pickExt} source={extSource}
                                   variant={openerType === 'juristic' ? 'juristic' : 'person'}
                                   addLabel={openerType === 'juristic' ? 'เพิ่มนิติบุคคลภายนอก' : 'เพิ่มบุคคลภายนอก'}
                                   onAdd={() => setQuickAdd(true)}
                                   title={openerType === 'juristic' ? 'ค้นหานิติบุคคลภายนอก' : 'ค้นหาบุคคลภายนอก'}
                                   placeholder={openerType === 'juristic' ? 'คลิกเพื่อค้นหาเลขทะเบียน เช่น L00001…' : 'คลิกเพื่อค้นหาเลขทะเบียน เช่น E00001…'} />
              </DatFieldLite>
              <DatFieldLite label={openerType === 'juristic' ? 'เลขประจำตัวผู้เสียภาษี' : 'เลขบัตรประชาชน'}>
                <div className="cfg-display-box mono">
                  {extPick ? ((openerType === 'juristic' ? extPick.taxId : extPick.citizenId) || '—') : '—'}
                </div>
              </DatFieldLite>
            </>
          )}
          <DatFieldLite label="ผู้ถือบัญชี">
            <select className="cfg-input" value={holderType} onChange={(e) => setHolderType(e.target.value)}>
              {holderTypes.map(o => <option key={o.code} value={o.code}>{o.code} {o.name}</option>)}
            </select>
          </DatFieldLite>

          {/* แถว 2 · ชื่อบัญชี */}
          <DatFieldLite label="ชื่อบัญชี (TH)" required>
            <input className="cfg-input" value={nameTh} onChange={(e) => setNameTh(e.target.value)}
                   placeholder={openerType === 'juristic' ? 'ชื่อนิติบุคคล ภาษาไทย' : 'ชื่อ-นามสกุล ภาษาไทย'} />
          </DatFieldLite>
          <DatFieldLite label="ชื่อบัญชี (ENG)">
            <input className="cfg-input" value={nameEng} onChange={(e) => setNameEng(e.target.value.toUpperCase())} placeholder="ACCOUNT NAME (ENGLISH)" />
          </DatFieldLite>
          <DatFieldLite label="เบอร์โทร">
            <input className="cfg-input mono" inputMode="tel" value={phone} placeholder="0X-XXX-XXXX"
                   onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, ''))} />
          </DatFieldLite>

          {/* แถว 3 · ค่าระบบ */}
          <DatFieldLite label="เปิดบัญชีโดย">
            <select className="cfg-input" value={openedBy} disabled={!ownerCode} onChange={(e) => pickOpenedBy(e.target.value)}>
              {!ownerCode && <option value="">— ค้นหาเจ้าของบัญชีก่อน —</option>}
              {openByOpts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="รหัสคู่บัญชี DR">
            <window.BaSelect className="cfg-input" value={drCode} disabled={!ownerCode} onChange={(e) => setDrCode(e.target.value)}>
              <option value="">{!ownerCode ? '— ค้นหาเจ้าของบัญชีก่อน —' : '— เลือกรหัสคู่บัญชี —'}</option>
              {drOpts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </window.BaSelect>
          </DatFieldLite>
          <DatFieldLite label="เลขอ้างอิง">
            <input className="cfg-input mono" value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="เลขอ้างอิงประกอบรายการ" />
          </DatFieldLite>

          {/* แถว 4 · เงื่อนไขการถอน (เต็มแถว ขยายตามข้อความ) */}
          <DatFieldLite label="เงื่อนไขการถอน" span={3}>
            <textarea className="cfg-input dep-cond-area" rows={3} value={withdrawCond}
                      onChange={(e) => { setWithdrawCond(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 2 + 'px'; }}
                      ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; } }}
                      placeholder="ระบุเงื่อนไขการถอน / รายชื่อผู้มีอำนาจลงนาม — กรณีมีหลายชื่อ ขึ้นบรรทัดใหม่ทีละรายการ" />
          </DatFieldLite>
        </div>

      </div>

      {/* 3 · ข้อมูลการรับเงินเปิดบัญชี */}
      <div className="search-card dat-section">
        <DepSecHead icon="wallet" title="ข้อมูลการรับเงินเปิดบัญชี" sub="ระบุเงินโอนภายในและเงินสด/โอนจากภายนอกที่ใช้เปิดบัญชี" />
        <div className="dep-recv-cols">
          <div className="dat-grid g2" style={{ padding: 16 }}>
            <DatFieldLite label="วิธีรับดอกเบี้ย / ปันผล">
              <select className="cfg-input" value={intMethod} onChange={(e) => setIntMethod(e.target.value)}>
                {depIntReceive().map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </DatFieldLite>
            <DatFieldLite label="เลขที่บัญชี">
              {intMethod === 'toaccount'
                ? <select className="cfg-input mono" value={srcAcc} onChange={(e) => pickCoopAcct(e.target.value)}>
                    <option value="">— เลือกบัญชีจากรายการธนาคาร —</option>
                    {depBankAccts().map(a => <option key={a.id} value={a.acctNo}>{a.acctNo} · {depBankName(a.bankCode)}</option>)}
                  </select>
                : <input className="cfg-input mono" value={srcAcc} onChange={(e) => setSrcAcc(e.target.value)}
                         placeholder={intMethod === 'tobank' ? 'เลขที่บัญชีธนาคารของสมาชิก' : 'เลขบัญชีต้นทาง'} />}
            </DatFieldLite>
            <DatFieldLite label="ธนาคาร">
              {intMethod === 'toaccount'
                ? <div className="cfg-display-box">{srcBank || '— เลือกเลขที่บัญชีก่อน —'}</div>
                : <select className="cfg-input" value={srcBank} onChange={(e) => setSrcBank(e.target.value)}>
                    <option value="">— เลือกธนาคาร —</option>
                    {depBanks().map(b => <option key={b} value={b}>{b}</option>)}
                  </select>}
            </DatFieldLite>
            <DatFieldLite label="สาขา">
              {intMethod === 'toaccount'
                ? <div className="cfg-display-box">{srcBranch || '—'}</div>
                : <input className="cfg-input" value={srcBranch} disabled={!srcBank} onChange={(e) => setSrcBranch(e.target.value)} placeholder={srcBank ? 'ชื่อสาขา' : 'เลือกธนาคารก่อน'} />}
            </DatFieldLite>
            <DatFieldLite label="ชื่อบัญชี" span={2}>
              {intMethod === 'toaccount'
                ? <div className="cfg-display-box">{srcName || '—'}</div>
                : <input className="cfg-input" value={srcName} onChange={(e) => setSrcName(e.target.value)} placeholder="ชื่อบัญชี" />}
            </DatFieldLite>
            <DatFieldLite label="เงินโอนภายในเปิดบัญชี">
              <input className="cfg-input mono num-input" ref={(el) => { if (el) el.__moneyFmt = true; }} type="number" value={inAmt} onChange={(e) => setInAmt(e.target.value)} placeholder="0.00" />
            </DatFieldLite>
            <DatFieldLite label="เงินสด / โอนภายนอกเปิดบัญชี">
              <input className="cfg-input mono num-input" ref={(el) => { if (el) el.__moneyFmt = true; }} type="number" value={extAmt} onChange={(e) => setExtAmt(e.target.value)} placeholder="0.00" />
            </DatFieldLite>
          </div>
          <div className="dep-recv-summary">
            <div className="dep-recv-sum-head">{accType ? accType.name : 'ยังไม่เลือกประเภทเงินฝาก'}</div>
            <div className="dep-recv-sum-body">
              <div className="dep-recv-row"><span>เงินโอนภายในเปิดบัญชี</span><span className="mono">{fmt.money(inNum, 2)}</span></div>
              <div className="dep-recv-row"><span>เงินสด / โอนภายนอกเปิดบัญชี</span><span className="mono">{fmt.money(extNum, 2)}</span></div>
              {chequeSum > 0 && <div className="dep-recv-row"><span>รับด้วยเช็ค ({cheques.length} ใบ)</span><span className="mono">{fmt.money(chequeSum, 2)}</span></div>}
              <div className="dep-recv-row total"><span>รวมสุทธิ</span><span className="mono">{fmt.money(totalNet, 2)}</span></div>
              {accType && minOpen > 0 && (
                <div className={"dep-recv-min " + (totalNet >= minOpen ? 'ok' : 'bad')}>
                  <Icon name={totalNet >= minOpen ? 'check' : 'info'} size={12} /> ขั้นต่ำเปิดบัญชี {fmt.money(minOpen, 0)} บาท
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {jointModal != null && (
        <MemberSearchModal title="ค้นหาผู้ฝากร่วม" source={window.DEP_TXN_MEMBERS}
                           searchFn={(c) => window.msSearchMembers(window.DEP_TXN_MEMBERS, c)}
                           onClose={() => setJointModal(null)}
                           onPick={(mm) => { setJoint(jointModal, { ref: mm.code, name: mm.name }); setJointModal(null); }} />
      )}

      {/* 4 + 5 */}
      <div className="dep-open-row">
        {/* 4 · ผู้ฝากร่วม */}
        <div className="search-card dat-section">
          <DepSecHead bar icon="members" title="ผู้ฝากร่วม" sub="กรณีบัญชีมีเจ้าของร่วมมากกว่าหนึ่งคน"
            right={<button className="btn primary sm" onClick={addJoint}><Icon name="plus" /> เพิ่มผู้ฝากร่วม</button>} />
          <div className="table-wrap" style={{ margin: '16px' }}><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 48 }}>ลำดับ</th>
                  <th style={{ width: 200 }}>เลขอ้างอิง</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {joints.length === 0 ? (
                  <tr><td colSpan="4" className="center muted" style={{ padding: '18px 12px' }}>ไม่มีผู้ฝากร่วม — กด “เพิ่มผู้ฝากร่วม” เมื่อบัญชีมีเจ้าของร่วม</td></tr>
                ) : joints.map((j, i) => (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <div className="dep-joint-ref">
                        <input className="vch-cell-input mono" value={j.ref} onChange={(e) => typeJointRef(i, e.target.value)}
                               onKeyDown={(e) => { if (e.key === 'Enter') setJointModal(i); }} placeholder="เลขสมาชิก" />
                        <button type="button" className="dep-joint-dots" title="ค้นหาสมาชิก" aria-label="ค้นหาสมาชิก" onClick={() => setJointModal(i)}>
                          <span style={{ fontSize: 15, lineHeight: 1, letterSpacing: 1 }}>…</span>
                        </button>
                      </div>
                    </td>
                    <td><input className="vch-cell-input" value={j.name} onChange={(e) => setJoint(i, { name: e.target.value })} placeholder="ชื่อ-นามสกุล ผู้ฝากร่วม" /></td>
                    <td className="center"><button className="btn sm ex-row-btn del" title="ลบแถว" onClick={() => delJoint(i)}><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        {/* 5 · การส่งฝากรายงวด */}
        <div className="search-card dat-section">
          <DepSecHead icon="calendar" title="การส่งฝากรายงวด" sub={!accType ? 'เลือกประเภทเงินฝากก่อน' : periodicLocked ? 'ประเภทนี้ไม่มีการฝากรายเดือน' : 'ยอดเงินฝากที่หักผ่านเงินเดือนทุกเดือน'} />
          <div className="dat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <DatFieldLite label="รูปแบบการส่งฝาก" span={2}>
              <select className="cfg-input" value={periodicMode} disabled={!accType || periodicLocked} onChange={(e) => setPeriodicMode(e.target.value)}>
                {DEP_PERIODIC.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </DatFieldLite>
            <DatFieldLite label="จำนวนส่งต่องวด (บาท)" required={periodicMode !== 'none'} span={2}>
              <input className="cfg-input mono num-input" ref={(el) => { if (el) el.__moneyFmt = true; }} type="number" value={periodicAmt} disabled={periodicMode === 'none'}
                     onChange={(e) => setPeriodicAmt(e.target.value)} placeholder="0.00" />
            </DatFieldLite>
          </div>
        </div>
      </div>

      {/* 6 · รายการเช็ค */}
      <div className="search-card dat-section">
        <DepSecHead bar icon="report" title="รายการเช็ค" sub="กรณีเปิดบัญชีด้วยเช็ค"
          right={<button className="btn primary sm" onClick={addCheque}><Icon name="plus" /> เพิ่มรายการเช็ค</button>} />
        <div className="table-wrap" style={{ margin: '16px' }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>เลขที่เช็ค</th>
                <th style={{ width: 140 }}>วันที่หน้าเช็ค</th>
                <th style={{ minWidth: 150 }}>ธนาคาร</th>
                <th style={{ minWidth: 120 }}>สาขา</th>
                <th style={{ width: 78 }}>ประเภท</th>
                <th className="center" style={{ width: 96 }}>วันรอเรียกเก็บ</th>
                <th className="right" style={{ width: 120 }}>จำนวนเงิน</th>
                <th className="center" style={{ width: 56 }}>Late</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {cheques.length === 0 ? (
                <tr><td colSpan="9" className="center muted" style={{ padding: '18px 12px' }}>ไม่มีรายการเช็ค — กด “เพิ่มรายการเช็ค” เมื่อเปิดบัญชีด้วยเช็ค</td></tr>
              ) : cheques.map((c, i) => (
                <tr key={i}>
                  <td><input className="vch-cell-input mono" value={c.no} onChange={(e) => setCheque(i, { no: e.target.value })} placeholder="เลขที่เช็ค" /></td>
                  <td><ErpDate value={c.faceDate} onChange={(v) => ((e) => setCheque(i, { faceDate: e.target.value }))({ target: { value: v } })} className="vch-cell-input mono" /></td>
                  <td>
                    <select className="vch-cell-input" value={c.bank} onChange={(e) => setCheque(i, { bank: e.target.value })}>
                      <option value="">— เลือกธนาคาร —</option>
                      {depBanks().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                  <td><input className="vch-cell-input" value={c.branch} onChange={(e) => setCheque(i, { branch: e.target.value })} placeholder="สาขา" /></td>
                  <td>
                    <select className="vch-cell-input" value={c.type} onChange={(e) => setCheque(i, { type: e.target.value })}>
                      {DEP_CHEQUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td><input className="vch-cell-input num" type="number" min="0" value={c.float} title="จำนวนวันรอเรียกเก็บ" onChange={(e) => setCheque(i, { float: e.target.value })} /></td>
                  <td><input className="vch-cell-input num" type="number" value={c.amount} onChange={(e) => setCheque(i, { amount: e.target.value })} placeholder="0.00" /></td>
                  <td className="center"><input type="checkbox" checked={!!c.late} onChange={(e) => setCheque(i, { late: e.target.checked })} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} /></td>
                  <td className="center"><button className="btn sm ex-row-btn del" title="ลบแถว" onClick={() => delCheque(i)}><Icon name="trash" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            {cheques.length > 0 && (
              <tfoot>
                <tr className="vch-foot">
                  <td colSpan="6" className="right">รวมเช็ค {cheques.length} ใบ</td>
                  <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(chequeSum, 2)}</td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {errors.length > 0 && (
        <div className="dat-warn" style={{ marginTop: 4 }}>
          <Icon name="info" size={14} />
          <div>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
        </div>
      )}


      {slip && (
        <div className="dep-slip-host">
          <DepSlip {...slip} />
        </div>
      )}
      {quickAdd && (
        <window.ExtPersonModal mode="add" lockKind draft0={{ kind: openerType === 'juristic' ? 'juristic' : 'person' }}
          existing={window.depExtPersonsLoad ? window.depExtPersonsLoad() : []} onClose={() => setQuickAdd(false)}
          onSubmit={(vals) => {
            // บันทึกผ่านขั้นตอนเดียวกับเมนูเพิ่มแก้ไขบุคคลภายนอก (รหัส · สถานะ · ผู้สร้าง · Audit Log)
            const { rec } = window.depExtPersonAdd(vals, { source: 'open', audit });
            const code = rec.code;
            setQuickAdd(false); setExtTick(t => t + 1);
            if ((rec.kind === 'juristic') !== (openerType === 'juristic')) {
              onToast && onToast('เพิ่ม ' + code + ' · ' + window.depExtPersonName(rec) + ' แล้ว — ประเภทไม่ตรงกับแท็บที่เลือก จึงยังไม่เลือกให้');
              return;
            }
            const nm = window.depExtPersonName(rec);
            pickExt({ ...rec, name: nm, citizenId: rec.kind === 'juristic' ? rec.taxId : rec.citizenId });
            onToast && onToast('เพิ่ม' + (rec.kind === 'juristic' ? 'นิติบุคคล' : 'บุคคล') + 'ภายนอก ' + rec.code + ' · ' + nm + ' แล้ว');
          }} />
      )}
      {confirmOpen && (
        <window.DepConfirmModal title={needApprove ? 'ยืนยันส่งอนุมัติเปิดบัญชี' : 'ยืนยันการเปิดบัญชีเงินฝาก'}
          okLabel={needApprove ? 'ยืนยันส่งอนุมัติ' : 'ยืนยันเปิดบัญชี'}
          lines={[
            ['เลขที่บัญชี', accNo || '—'],
            ['ประเภทบัญชี', accType ? accType.name : '—'],
            ['ชื่อบัญชี', nameTh || (member && member.name) || '—'],
            ['เงินเปิดบัญชี', fmt.money(totalNet, 2) + ' บาท'],
            ['เปิดบัญชีโดย', openedBy || '—'],
          ]}
          onClose={() => setConfirmOpen(false)}
          onOk={() => { setConfirmOpen(false); submit(); }} />
      )}
    </div>
  );
}

Object.assign(window, { DepOpenAccountPage, DatFieldLite, DepSecHead });
