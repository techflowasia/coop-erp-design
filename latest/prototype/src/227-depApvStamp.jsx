// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — อนุมัติทำรายการ
//  ดึงรายการเงินฝากที่รออนุมัติ (รหัสรายการ / ชื่อบัญชี / จำนวน)
//  เมื่ออนุมัติ ระบบแสตมป์: เลขที่รายการอนุมัติ · เครื่อง/วันที่/ผู้ขอ · เครื่อง/วันที่/ผู้อนุมัติ · จำนวนรวม
// ════════════════════════════════════════════════════════════════════

function depApvStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear() + 543} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function DepApproveField({ label, value, mono, strong }) {
  return (
    <div className="dat-field">
      <label>{label}</label>
      <input className={'cfg-input' + (mono ? ' mono' : '')} readOnly value={value || ''} placeholder="—"
             style={strong ? { fontWeight: 700, color: 'var(--primary-700)' } : undefined} />
    </div>
  );
}

// ── เลขที่ใบอนุมัติ — ตามค่าคงที่ "เลขที่เอกสารอัตโนมัติ" (ประเภท approve) · เลขรันต่อเนื่องตามรอบรีเซ็ต
function depApvNextNo() {
  let cfg = null;
  try { const s = localStorage.getItem('admin_docno'); if (s) cfg = JSON.parse(s).find(d => d.key === 'approve'); } catch (e) {}
  cfg = cfg || (window.SCH_DOCNO_DEFAULT || []).find(d => d.key === 'approve') || { prefix: 'APV', digits: 5, reset: 'year' };
  const d = new Date(), by = d.getFullYear() + 543, bm = String(d.getMonth() + 1).padStart(2, '0');
  const period = cfg.reset === 'month' ? by + '-' + bm : cfg.reset === 'never' ? 'all' : String(by);
  let seq = {};
  try { seq = JSON.parse(localStorage.getItem('dep_apv_seq') || '{}'); } catch (e) {}
  const key = cfg.prefix + '|' + period;
  const n = (Number(seq[key]) || 0) + 1; seq[key] = n;
  try { localStorage.setItem('dep_apv_seq', JSON.stringify(seq)); } catch (e) {}
  return cfg.prefix + '-' + by + (cfg.reset === 'month' ? '-' + bm : '') + '-' + String(n).padStart(Number(cfg.digits) || 5, '0');
}
const apvIsoStamp = (iso) => { const d = new Date(iso); if (isNaN(d)) return ''; const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear() + 543} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const apvDmy = (iso) => { const [y, m, d] = String(iso || '').slice(0, 10).split('-'); return y ? d + '/' + m + '/' + (Number(y) + 543) : ''; };
// ประเภทเงิน (CSH/CHQ/TRF …) → ชื่อ จากค่าคงที่ "กำหนดประเภทเงินทำรายการ" / "ประเภทกลุ่มเงิน"
function apvMoneyName(code) {
  try { const t = (typeof ttMoneyTypes === 'function' ? ttMoneyTypes() : []).find(x => x.v === code); if (t && t.d) return t.d; } catch (e) {}
  try { const g = (typeof ttMoneyGroups === 'function' ? ttMoneyGroups() : []).find(x => x.v === code); if (g && g.d) return g.d; } catch (e) {}
  return ({ CSH: 'เงินสด', CHQ: 'เช็ค', TRF: 'โอน' })[code] || code || '';
}
// รหัสรายการ → ประเภทหลัก จากค่าคงที่ "รหัสรายการเงินฝาก"
function apvKindOfCode(code) {
  let r = null;
  try { r = (window.depTxnTypeLoad ? window.depTxnTypeLoad() : []).find(x => x.code === code); } catch (e) {}
  const c = String(code || '').toUpperCase(), g = String((r && r.group) || '').toUpperCase();
  if (/^TR/.test(c) || /^TR/.test(g)) return 'โอนระหว่างบัญชี';
  if (g === 'CLS' || /^CL/.test(c)) return 'ปิดบัญชี';
  if (g === 'DEP' || (r && r.side === 1)) return 'ฝากเงิน';
  return 'ถอนเงิน';
}
const APV_FRZ_KEYS = { dep: 'dep_freezes', atm: 'dep_atm_freezes' };
const apvFrzLoad = (k) => { try { return JSON.parse(localStorage.getItem(APV_FRZ_KEYS[k]) || '{}'); } catch (e) { return {}; } };
const apvFrzSave = (k, m) => { try { localStorage.setItem(APV_FRZ_KEYS[k], JSON.stringify(m)); } catch (e) {} };

// ประเภทหลัก + ช่องทาง จากชื่อรายการ
const APV_KIND = [
  { k: 'เปิดบัญชี', re: /^เปิดบัญชี/, c: '#08979c', bg: '#e6fffb', bd: '#87e8de' },
  { k: 'อายัดบัญชี', re: /^อายัด/, c: '#a8071a', bg: '#fff1f0', bd: '#ff7875' },
  { k: 'ยกเลิกอายัด', re: /^ยกเลิกอายัด/, c: '#7c4a03', bg: '#fffbe6', bd: '#ffe58f' },
  { k: 'ถอนเงิน', re: /^ถอน/, c: '#cf1322', bg: '#fff1f0', bd: '#ffa39e' },
  { k: 'ปิดบัญชี', re: /^ปิดบัญชี/, c: '#d46b08', bg: '#fff7e6', bd: '#ffd591' },
  { k: 'โอนระหว่างบัญชี', re: /^โอน/, c: '#0958d9', bg: '#e6f4ff', bd: '#91caff' },
  { k: 'ปลดล็อกบัญชี', re: /^ปลดล็อก/, c: '#531dab', bg: '#f9f0ff', bd: '#d3adf7' },
  { k: 'ฝากเงิน', re: /^ฝาก/, c: '#237450', bg: '#eafef2', bd: '#b7e4c7' },
];
const apvKindOf = (kind) => APV_KIND.find(x => x.re.test(String(kind || ''))) || { k: kind, c: 'rgba(0,0,0,.65)', bg: '#fafafa', bd: '#d9d9d9' };
const apvChannelOf = (kind) => { const m = String(kind || '').match(/—\s*(.+)$/); return m ? m[1] : (/ก่อนครบกำหนด/.test(kind) ? 'ก่อนครบกำหนด' : ''); };

// ── ตัวอย่างคำขอหลายประเภท — เติมลงที่เก็บคำขอจริงครั้งเดียว (อนุมัติ/ไม่อนุมัติแล้วมีผลจริง และไม่กลับมาอีก)
const APV_SAMPLE_KEY = 'dep_apv_samples_v1';
function apvSeedSamples() {
  try { if (localStorage.getItem(APV_SAMPLE_KEY)) return; } catch (e) { return; }
  try {
    const now = new Date(), p = (n) => String(n).padStart(2, '0');
    const iso = now.toISOString().slice(0, 10);
    const at = (hh, mm) => { const d = new Date(now); d.setHours(hh, mm, 0, 0); return d.toISOString(); };
    const thDate = (hh, mm) => `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear() + 543} ${p(hh)}:${p(mm)}`;
    const addM = (n) => { const d = new Date(now); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };
    const T1 = 'POS-01 (เคาน์เตอร์ 1)', T2 = 'POS-02 (เคาน์เตอร์ 2)', T3 = 'POS-03 (เคาน์เตอร์ 3)';
    const U1 = 'จันทร์เพ็ญ มาลี', U2 = 'ปิยะพร ทองแท้', U3 = 'ประไพ ศรีทอง';
    const accounts = window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [];
    const has = (no) => accounts.some(a => a.accNo === no);
    const base = { payrollLinked: false, bank: '', bankAcc: '', bankLinkStatus: 'none', useLoan: false, useFuneral: false,
      freeQuota: 0, freeUsed: 0, ytdInterest: 0, intMethod: 'compound', memberStatus: 'ปฏิบัติงาน', openerType: 'member', ownerKind: 'member' };
    // 1–2) เปิดบัญชีรออนุมัติ
    const newAcc = [
      { ...base, accNo: '003-1-70011-9', member: '70011', name: 'ประภาพร ศรีสวัสดิ์', dept: 'กองบริหารทั่วไป', typeCode: '12', type: 'ฝากประจำ 12 เดือน',
        openDate: iso, maturityDate: addM(12), rate: 3.1, balance: 100000, status: 'pending', withdrawCond: 'ถอนได้คนเดียว',
        openedBy: U1, openReqAt: at(8, 35), openTerm: T1 },
      { ...base, accNo: '007-9-70013-2', member: '70013', name: 'อรวรรณ แก้วมณี', dept: '—', typeCode: '13', type: 'เงินฝากเพื่อรับเงินกู้พิเศษ',
        openDate: iso, rate: 0.5, balance: 0, status: 'pending', useLoan: true, withdrawCond: 'ถอนได้คนเดียว',
        openedBy: U2, openReqAt: at(9, 5), openTerm: T2 },
    ].filter(a => !has(a.accNo));
    if (newAcc.length && window.depTxnSaveAccounts) window.depTxnSaveAccounts([...newAcc, ...accounts]);
    // 3–5) อายัด / อายัดวงเงิน (เงินฝาก + ATM) / ยกเลิกอายัด
    const dep = apvFrzLoad('dep'), atm = apvFrzLoad('atm');
    if (!dep['001-2-58241-0']) dep['001-2-58241-0'] = { type: '4', label: 'อายัดห้ามถอน/ปิดบัญชี', reason: 'ศาลสั่งอายัด (หมายบังคับคดีเลขที่ 1234/2569)', mode: 'full',
      amount: 0, date: iso, at: at(8, 50), by: U2, term: T2, approveStatus: 'pending', approver: '', reqNo: 'FRZ-2569-S001', prev: null };
    if (!dep['001-2-70011-3'] && !atm['001-2-70011-3']) {
      const r = { reason: 'สมาชิกค้ำประกันเงินกู้ผิดนัดชำระ', mode: 'partial', amount: 50000, date: iso, at: at(9, 40), by: U1, term: T1,
        approveStatus: 'pending', approver: '', reqNo: 'FRZ-2569-S002', prev: null };
      dep['001-2-70011-3'] = { ...r, type: '1', label: 'อายัดจำนวนเงิน' };
      atm['001-2-70011-3'] = { ...r, type: '00', label: 'อายัดยอดเงิน', reqId: 'FRZ-2569-S002' };
    }
    if (!dep['004-9-61580-1']) dep['004-9-61580-1'] = { type: '2', label: 'อายัดการเคลื่อนไหว', reason: 'รอตรวจสอบเอกสารมรดก', mode: 'full', amount: 0,
      date: addM(-2), by: U3, approveStatus: 'approved', apvNo: 'APV-2569-S0001', reqNo: 'FRZ-2569-S000',
      releasePending: { reqNo: 'FRZ-2569-S003', reason: 'ทายาทยื่นเอกสารครบถ้วนแล้ว', date: iso, at: at(10, 15), by: U3, term: T3, approver: '' } };
    apvFrzSave('dep', dep); apvFrzSave('atm', atm);
    // 6) ปลดล็อกบัญชีไม่เคลื่อนไหว
    if (window.dpcUnlockReqLoad) {
      const ul = window.dpcUnlockReqLoad();
      if (!ul.some(r => r.id === 'UL-2569-S001')) window.dpcUnlockReqSave([...ul, { id: 'UL-2569-S001', accNo: '001-2-57003-9', name: 'ธีรพงษ์ มากมี', member: '57003',
        lastMove: '2023-04-12', idleDays: Math.round((now - new Date('2023-04-12')) / 86400000), reason: 'สมาชิกมาแสดงตัวพร้อมบัตรประชาชน ต้องการถอนเงิน',
        reqBy: U1, reqTerm: T1, reqDate: thDate(10, 30), date: iso, status: 'pending' }]);
    }
    // 7–9) ถอนเงิน — เงินสด / เช็ค (ต่ำกว่าคงเหลือขั้นต่ำ) / โอน (เกินโควตาถอนฟรี)
    if (window.dpcWdReqLoad) {
      const wd = window.dpcWdReqLoad();
      const add = [
        { id: 'WA-S001', accNo: '001-2-70020-5', name: 'วรเชษฐ์ ธนพัฒน์', amount: 2500000, code: 'WCA', codeLabel: 'ถอนด้วยเงินสด', money: 'CSH',
          reqBy: U2, reqTerm: T2, reqDate: thDate(11, 0), date: iso, status: 'pending' },
        { id: 'WA-S002', accNo: '001-2-70013-8', name: 'อรวรรณ แก้วมณี', amount: 1080000, code: 'WCQ', codeLabel: 'ถอนจ่ายด้วยเช็ค', money: 'CHQ',
          note: 'สั่งจ่ายเช็คยอดสูง — เกินวงเงินอนุมัติของเจ้าหน้าที่', reqBy: U1, reqTerm: T1, reqDate: thDate(11, 20), date: iso, status: 'pending' },
        { id: 'WA-S003', accNo: '001-2-70012-1', name: 'ธนากร วงศ์ไพบูลย์', amount: 150000, code: 'WTE', codeLabel: 'ถอนโอนเข้าบัญชีธนาคาร', money: 'TRF',
          note: 'ถอนครั้งที่ 2 ของเดือน — เกินจำนวนครั้งถอนฟรี', reqBy: U3, reqTerm: T3, reqDate: thDate(11, 45), date: iso, status: 'pending' },
      ].filter(r => !wd.some(x => x.id === r.id));
      if (add.length) window.dpcWdReqSave([...wd, ...add]);
      // ประวัติถอนครั้งแรกของเดือน (ให้เห็นค่าปรับถอนเกินครั้งของตัวอย่างที่ 9)
      if (window.depTxnLoadLedger) {
        const lg = window.depTxnLoadLedger();
        if (!lg.some(l => l.id === 'TX-S-0001')) window.depTxnSaveLedger([{ id: 'TX-S-0001', date: iso.slice(0, 8) + '01', accNo: '001-2-70012-1', member: '70012',
          type: 'withdraw', channel: 'WCA ถอนด้วยเงินสด', amount: 3000, fee: 0, balance: 412000, ref: 'WCA', by: U3 }, ...lg]);
      }
    }
    localStorage.setItem(APV_SAMPLE_KEY, iso);
  } catch (e) {}
}

function DepApprovePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const parseD = (s) => { const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?/); return m ? [m[3], m[2], m[1], m[4] || '00', m[5] || '00'].join('') : ''; };
  // คิวรออนุมัติ — ดึงจากคำขอจริงทุกหน้า (ไม่มีรายการตัวอย่าง)
  const queue = () => {
    const accounts = window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [];
    const accOf = (no) => accounts.find(a => a.accNo === no) || {};
    // 1) ปลดล็อกบัญชีไม่เคลื่อนไหว (หน้าฝาก/ถอน/โอน/ปิด)
    const ul = (window.dpcUnlockReqLoad ? window.dpcUnlockReqLoad() : []).filter(r => r.status === 'pending').map(r => ({
      id: r.id, accNo: r.accNo, name: r.name, kind: 'ปลดล็อกบัญชี', amount: 0, reqBy: r.reqBy, reqTerm: r.reqTerm, reqDate: r.reqDate,
      reason: 'ไม่เคลื่อนไหว ' + Math.floor((r.idleDays || 0) / 365) + ' ปี — ' + r.reason, _unlock: true }));
    // 2) ถอนเกินวงเงิน (หน้าฝาก/ถอน/โอน/ปิด) — ประเภทจากรหัสรายการ · วิธีจากประเภทเงิน
    const wa = (window.dpcWdReqLoad ? window.dpcWdReqLoad() : []).filter(r => r.status === 'pending').map(r => ({
      id: r.id, accNo: r.accNo, name: r.name, kind: apvKindOfCode(r.code) + ' — ' + apvMoneyName(r.money), code: r.code,
      amount: r.amount, reqBy: r.reqBy, reqTerm: r.reqTerm, reqDate: r.reqDate,
      reason: (r.note || ('ถอนตั้งแต่ ' + (window.fmt ? window.fmt.money(window.DEP_WD_APV_LIMIT, 0) : '2,000,000') + ' บาทขึ้นไป')) + ' · ' + r.code + ' ' + (r.codeLabel || ''), _wd: true }));
    // 3) เปิดบัญชีที่ต้องอนุมัติ (หน้าเปิดบัญชี — สถานะรออนุมัติ)
    const op = accounts.filter(a => a.status === 'pending').map(a => ({
      id: 'OPN-' + a.accNo, accNo: a.accNo, name: a.name, kind: 'เปิดบัญชี — ' + (a.type || a.typeCode || ''), amount: Number(a.balance) || 0,
      reqBy: a.openedBy || '—', reqTerm: a.openTerm || '—', reqDate: a.openReqAt ? apvIsoStamp(a.openReqAt) : apvDmy(a.openDate),
      reason: (a.typeCode ? a.typeCode + ' ' : '') + (a.type || '') + ' · ต้องได้รับอนุมัติก่อนเริ่มทำรายการ', _open: true }));
    // 4) อายัด / ยกเลิกอายัด (หน้าอายัดบัญชี) — รวมเงินฝาก + ATM ที่อยู่ในคำขอเดียวกัน
    const fz = {};
    ['dep', 'atm'].forEach(k => {
      const map = apvFrzLoad(k);
      Object.keys(map).forEach(accNo => {
        const e = map[accNo]; if (!e) return;
        const rel = e.releasePending;
        if (e.approveStatus !== 'pending' && !rel) return;
        const no = rel ? rel.reqNo : (e.reqNo || e.reqId || accNo);
        const key = (rel ? 'REL-' : 'FRZ-') + no + '-' + accNo;
        const src = rel || e;
        const g = fz[key] || (fz[key] = { id: no, _key: key, accNo, name: accOf(accNo).name || accNo, amount: 0,
          reqBy: src.by || '—', reqTerm: src.term || '—', reqDate: src.at ? apvIsoStamp(src.at) : apvDmy(src.date),
          _frz: rel ? 'release' : 'freeze', frz: [] });
        g.frz.push({ k, e });
        if (!rel && e.mode === 'partial') g.amount = Math.max(g.amount, Number(e.amount) || 0);
      });
    });
    const fr = Object.values(fz).map(g => {
      const scope = g.frz.length > 1 ? 'เงินฝาก + ATM' : g.frz[0].k === 'atm' ? 'ATM' : 'เงินฝาก';
      const e = g.frz[0].e;
      return { ...g, kind: (g._frz === 'release' ? 'ยกเลิกอายัด — ' : 'อายัดบัญชี — ') + scope,
        reason: g._frz === 'release' ? 'ยกเลิก “' + g.frz.map(x => x.e.label).join(' / ') + '” · ' + (e.releasePending.reason || '')
                                     : g.frz.map(x => x.e.label).join(' / ') + ' · ' + (e.reason || '') };
    });
    return [...op, ...fr, ...ul, ...wa].map(r => ({ ...r, _key: r._key || r.id }))
      .sort((a, b) => parseD(a.reqDate).localeCompare(parseD(b.reqDate)));
  };
  const [rows, setRows] = useState(() => { apvSeedSamples(); return queue(); });
  const [sel, setSel] = useState([]);
  const [stamp, setStamp] = useState(null);
  const [qD, setQD] = useState(''); const [kD, setKD] = useState('');
  const [q, setQ] = useState('');   const [k, setK] = useState('');
  const kinds = APV_KIND.map(x => x.k);
  const refresh = () => { setRows(queue()); setSel([]); onToast && onToast('อัปเดตรายการรออนุมัติแล้ว'); };

  const nq = q.trim().toLowerCase();
  const list = rows.filter(r => (!k || apvKindOf(r.kind).k === k) &&
    (!nq || [r.id, r.accNo, r.name, r.reqBy].some(x => String(x || '').toLowerCase().includes(nq))));
  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allOn = list.length > 0 && list.every(r => sel.includes(r._key));
  const picked = list.filter(r => sel.includes(r._key));
  const total = picked.reduce((s, r) => s + r.amount, 0);

  const [viewRow, setViewRow] = useState(null);
  const [rejectTxt, setRejectTxt] = useState('');
  const [rejecting, setRejecting] = useState(false);
  // นำผลอนุมัติ/ไม่อนุมัติไปมีผลที่ต้นทาง (บัญชี / อายัด)
  const applyOpen = (r, patch) => {
    if (!window.depTxnLoadAccounts) return;
    window.depTxnSaveAccounts(window.depTxnLoadAccounts().map(a => a.accNo === r.accNo ? { ...a, ...patch } : a));
  };
  const applyFrz = (r, ok, stampInfo) => {
    r.frz.forEach(({ k }) => {
      const map = apvFrzLoad(k), e = map[r.accNo]; if (!e) return;
      if (r._frz === 'release') {
        if (ok) delete map[r.accNo];
        else { const { releasePending, ...rest } = e; map[r.accNo] = rest; }
      } else if (ok) {
        const { prev, ...rest } = e; map[r.accNo] = { ...rest, approveStatus: 'approved', ...stampInfo };
      } else if (e.prev) map[r.accNo] = e.prev;
      else delete map[r.accNo];
      apvFrzSave(k, map);
    });
  };
  const approve = (only) => {
    const picked = only ? [only] : list.filter(r => sel.includes(r._key));
    const total = picked.reduce((s, r) => s + r.amount, 0);
    const pickIds = picked.map(r => r._key);
    const first = picked[0];
    const st = {
      system: 'เงินฝาก',
      docNo: depApvNextNo(),
      reqTerm: first.reqTerm, reqDate: first.reqDate, reqBy: first.reqBy,
      apvTerm: window.DEP_DAILY_TERMINAL, apvDate: depApvStamp(), apvBy: window.DEP_DAILY_APPROVER,
      count: picked.length, total,
    };
    setStamp(st);
    const stampInfo = { apvBy: window.DEP_DAILY_APPROVER, apvDate: st.apvDate, apvNo: st.docNo };
    picked.filter(r => r._open).forEach(r => applyOpen(r, { status: 'active', ...stampInfo }));
    picked.filter(r => r._frz).forEach(r => applyFrz(r, true, stampInfo));
    const waIds = picked.filter(r => r._wd).map(r => r.id);
    if (waIds.length && window.dpcWdReqLoad) {
      window.dpcWdReqSave(window.dpcWdReqLoad().map(r => waIds.includes(r.id) ? { ...r, status: 'approved', apvBy: window.DEP_DAILY_APPROVER, apvDate: st.apvDate, apvNo: st.docNo } : r));
    }
    const ulIds = picked.filter(r => r._unlock).map(r => r.id);
    if (ulIds.length && window.dpcUnlockReqLoad) {
      const reqs = window.dpcUnlockReqLoad();
      const today = window.dpcToday ? window.dpcToday() : '';
      const un = window.dpcUnlocksLoad ? window.dpcUnlocksLoad() : {};
      reqs.forEach(r => { if (ulIds.includes(r.id)) {
        r.status = 'approved'; r.apvBy = window.DEP_DAILY_APPROVER; r.apvDate = st.apvDate;
        un[r.accNo] = { by: String(window.DEP_DAILY_APPROVER).replace(/\s*\(.*\)$/, ''), role: (String(window.DEP_DAILY_APPROVER).match(/\((.*)\)/) || [])[1] || 'หัวหน้า',
                        reason: r.reason, date: today, at: new Date().toISOString(), reqId: r.id, apvNo: st.docNo };
      } });
      window.dpcUnlockReqSave(reqs);
      window.dpcUnlocksSave && window.dpcUnlocksSave(un);
    }
    setRows(rows.filter(r => !pickIds.includes(r._key)));
    setSel(sel.filter(id => !pickIds.includes(id))); setViewRow(null);
    audit.log({
      action: 'approve', module: 'เงินฝาก — อนุมัติทำรายการ', target: st.docNo,
      summary: `อนุมัติรายการเงินฝาก ${st.count} รายการ รวม ${fmt.money(st.total, 2)} บาท`,
      changes: picked.map(r => ({ field: r.id + ' · ' + r.kind, before: 'รออนุมัติ', after: 'อนุมัติแล้ว' })),
    });
    window.depSuccess({ title: 'อนุมัติรายการเรียบร้อยแล้ว', desc: 'เลขที่ ' + st.docNo,
      lines: [['จำนวนรายการ', st.count + ' รายการ'], ['ผู้อนุมัติ', st.apvBy], ['วันที่อนุมัติ', st.apvDate + ' น.'],
              ['จำนวนเงินที่อนุมัติ', fmt.money(st.total, 2) + ' บาท']] });
  };

  const reject = (r, why) => {
    const upd = (load, save) => { if (!load) return; save(load().map(x => x.id === r.id ? { ...x, status: 'rejected', rejectReason: why, apvBy: window.DEP_DAILY_APPROVER, apvDate: depApvStamp() } : x)); };
    if (r._wd) upd(window.dpcWdReqLoad, window.dpcWdReqSave);
    else if (r._unlock) upd(window.dpcUnlockReqLoad, window.dpcUnlockReqSave);
    else if (r._open) applyOpen(r, { status: 'rejected', rejectReason: why, apvBy: window.DEP_DAILY_APPROVER, apvDate: depApvStamp() });
    else if (r._frz) applyFrz(r, false);
    setRows(rows.filter(x => x._key !== r._key)); setSel(sel.filter(id => id !== r._key));
    setViewRow(null); setRejecting(false); setRejectTxt('');
    audit.log({ action: 'reject', module: 'เงินฝาก — อนุมัติทำรายการ', target: r.id + ' · ' + r.accNo,
      summary: 'ไม่อนุมัติ' + r.kind + ' — ' + why, changes: [{ field: r.id, before: 'รออนุมัติ', after: 'ไม่อนุมัติ' }] });
    window.depSuccess({ title: 'บันทึกการไม่อนุมัติแล้ว', desc: r.id + ' · ' + r.accNo, lines: [['เหตุผล', why]] });
  };

  // ── popup รายละเอียดคำขอ ──
  const detailEl = viewRow && (() => {
    const r = viewRow;
    const acc = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : (window.DEP_TXN_ACCOUNTS_SEED || [])).find(a => a.accNo === r.accNo) || {};
    const ledger = window.depTxnLoadLedger ? window.depTxnLoadLedger() : [];
    const moves = window.dpcMoves ? window.dpcMoves(r.accNo, ledger).slice(0, 5) : [];
    const last = window.dpcLastMove ? window.dpcLastMove(r.accNo, ledger) : null;
    const idle = window.dpcIdleDays ? window.dpcIdleDays(last) : 0;
    const t = apvKindOf(r.kind), ch = apvChannelOf(r.kind);
    const isWd = t.k === 'ถอนเงิน';
    const bal = Number(acc.balance || 0);
    // ยอดหลังถอน — รวมค่าปรับ/ค่าธรรมเนียมตามค่าคงที่ประเภทเงินฝาก และเตือนเมื่อต่ำกว่าคงเหลือขั้นต่ำ
    const today = window.dpcToday ? window.dpcToday() : new Date().toISOString().slice(0, 10);
    const rule = isWd && acc.accNo && window.dpcRules ? window.dpcRules(acc, { type: 'withdraw', date: today, amt: Number(r.amount) || 0, moves: window.dpcMoves ? window.dpcMoves(r.accNo, ledger) : [] }) : null;
    const wdCharges = rule ? (rule.penalty || 0) + (rule.overFee || 0) : 0;
    const afterWd = bal - (Number(r.amount) || 0) - wdCharges;
    const minBal = rule ? rule.minBal : 0;
    const frzScope = r._frz ? r.frz.map(x => x.k === 'atm' ? 'บัญชีเงินฝาก ATM' : 'บัญชีเงินฝาก').join(' + ') : '';
    const kv = (k, v, mono) => <div className="dpc-kv"><span>{k}</span><b className={mono ? 'mono' : undefined}>{v == null || v === '' ? '—' : v}</b></div>;
    return ReactDOM.createPortal(<>
      <div className="modal-backdrop" style={{ zIndex: 1100, top: 'var(--navbar-h, 64px)' }} onClick={() => { setViewRow(null); setRejecting(false); }} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ zIndex: 1101, width: 760, maxWidth: '94vw',
           height: 'auto', maxHeight: 'calc(100vh - var(--navbar-h, 64px) - 48px)',
           top: 'calc(var(--navbar-h, 64px) + (100vh - var(--navbar-h, 64px)) / 2)', transform: 'translate(-50%, -50%)',
           display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              รายละเอียดคำขออนุมัติ
              <span className="apv-tag" style={{ color: t.c, background: t.bg, borderColor: t.bd }}>{t.k}</span>
            </h2>
            <div className="muted" style={{ fontSize: 12 }}><span className="mono">{r.id}</span> · ขอโดย {r.reqBy} ({r.reqTerm}) · {r.reqDate} น.</div>
          </div>
          <button className="close-btn" onClick={() => { setViewRow(null); setRejecting(false); }} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body apv-detail" style={{ overflowY: 'auto', minHeight: 0 }}>
          <div className="apv-sec-t">ข้อมูลบัญชี</div>
          <div className="apv-grid">
            {kv('เลขที่บัญชี', r.accNo, true)}{kv('ชื่อบัญชี', r.name)}
            {kv('ประเภทบัญชี', acc.typeCode ? acc.typeCode + ' ' + (acc.type || '') : acc.type)}
            {kv('ยอดคงเหลือ', fmt.money(bal, 2) + ' บาท', true)}
            {kv('เคลื่อนไหวล่าสุด', last ? fmt.date(last) : '—')}
            {kv('สถานะบัญชี', acc.frozen ? 'อายัด' : (acc.status === 'active' ? 'ปกติ' : acc.status))}
          </div>

          <div className="apv-sec-t">รายละเอียดคำขอ</div>
          <div className="apv-grid">
            {kv('ประเภทรายการ', r.kind)}
            {ch ? kv('วิธีทำรายการ', ch) : null}
            {!r._unlock && !r._open && !(r._frz && !r.amount) && kv(r._frz ? 'วงเงินที่อายัด' : 'จำนวนเงิน', fmt.money(r.amount, 2) + ' บาท', true)}
            {isWd && wdCharges > 0 && kv('ค่าปรับ / ค่าธรรมเนียม', fmt.money(wdCharges, 2) + ' บาท', true)}
            {isWd && kv('ยอดคงเหลือหลังถอน', fmt.money(afterWd, 2) + ' บาท', true)}
            {r._open && kv('วันที่เปิดบัญชี', acc.openDate ? fmt.date(acc.openDate) : '—')}
            {r._open && kv('ผู้เปิดบัญชี', (acc.openerType === 'member' || !acc.openerType ? 'สมาชิก ' : 'บุคคลภายนอก ') + (acc.member || acc.extId || ''))}
            {r._open && kv('ยอดเงินเปิดบัญชี', fmt.money(r.amount, 2) + ' บาท', true)}
            {r._frz && kv('ขอบเขต', frzScope)}
            {r._frz && r.frz.map(({ k, e }) => <React.Fragment key={k}>{kv((k === 'atm' ? 'ประเภทอายัด ATM' : 'ประเภทอายัด') + (r._frz === 'release' ? ' (เดิม)' : ''), e.label)}</React.Fragment>)}
            {r._frz === 'freeze' && kv('รูปแบบวงเงิน', r.frz.some(x => x.e.mode === 'partial') ? 'อายัดเฉพาะวงเงิน ' + fmt.money(r.amount, 2) + ' บาท' : 'อายัดทั้งบัญชี')}
            {isWd && minBal > 0 && afterWd < minBal && (
              <div className="dat-warn" style={{ gridColumn: '1 / -1', margin: 0, background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
                <Icon name="info" size={14} /><span>ถอนแล้วคงเหลือต่ำกว่าขั้นต่ำของประเภทบัญชี ({fmt.money(minBal, 2)} บาท)</span>
              </div>
            )}
            {r._unlock && kv('ไม่เคลื่อนไหว', Math.floor(idle / 365) + ' ปี ' + (idle % 365) + ' วัน')}
            <div className="dpc-kv" style={{ gridColumn: '1 / -1' }}><span>เหตุผล / หมายเหตุ</span><b>{r.reason || '—'}</b></div>
            {acc.withdrawCond && isWd && (
              <div className="dpc-kv" style={{ gridColumn: '1 / -1' }}><span>เงื่อนไขการถอน</span><b style={{ whiteSpace: 'pre-line' }}>{acc.withdrawCond}</b></div>
            )}
          </div>

          <div className="apv-sec-t">รายการเคลื่อนไหวล่าสุด</div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>วันที่</th><th>รายการ</th><th className="right">ถอน</th><th className="right">ฝาก</th><th className="right">คงเหลือ</th></tr></thead>
            <tbody>
              {moves.length === 0 ? <tr><td colSpan="5" className="center muted">ไม่มีรายการเคลื่อนไหว</td></tr>
                : moves.map((m, i) => (
                  <tr key={i}>
                    <td className="mono">{fmt.date(m.date)}</td><td>{m.desc || m.label || m.code}</td>
                    <td className="right mono">{m.dc === '−' ? fmt.money(m.amount, 2) : ''}</td>
                    <td className="right mono">{m.dc !== '−' && m.amount != null ? fmt.money(m.amount, 2) : ''}</td>
                    <td className="right mono">{m.balance != null ? fmt.money(m.balance, 2) : ''}</td>
                  </tr>))}
            </tbody>
          </table></div>

          {rejecting && (
            <div style={{ marginTop: 14 }}>
              <label className="cfg-label" style={{ display: 'block', marginBottom: 6 }}>เหตุผลที่ไม่อนุมัติ <span className="cfg-required">*</span></label>
              <textarea className="cfg-input" rows={3} autoFocus value={rejectTxt} onChange={(e) => setRejectTxt(e.target.value)}
                        placeholder="ระบุเหตุผล — เจ้าหน้าที่ผู้ขอจะเห็นข้อความนี้" style={{ width: '100%', resize: 'vertical' }} />
            </div>
          )}
        </div>
        <div className="modal-foot">
          {!rejecting ? <>
            <button className="btn" onClick={() => setRejecting(true)} style={{ color: 'var(--danger, #cf1322)', borderColor: 'var(--danger, #cf1322)' }}>ไม่อนุมัติ</button>
            <button className="btn primary" onClick={() => approve(r)}><Icon name="check" /> อนุมัติ</button>
          </> : <>
            <button className="btn" onClick={() => { setRejecting(false); setRejectTxt(''); }}>ย้อนกลับ</button>
            <button className="btn primary" disabled={!rejectTxt.trim()} onClick={() => reject(r, rejectTxt.trim())}
                    style={rejectTxt.trim() ? { background: 'var(--danger, #cf1322)', borderColor: 'var(--danger, #cf1322)' } : undefined}>ยืนยันไม่อนุมัติ</button>
          </>}
        </div>
      </div>
    </>, document.body);
  })();

  return (
    <div data-screen-label="อนุมัติทำรายการ">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติทำรายการ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ผู้อนุมัติ: {window.DEP_DAILY_APPROVER} · เครื่อง {window.DEP_DAILY_TERMINAL}{false && <>อนุมัติรายการเงินฝากที่ต้องได้รับการอนุมัติจากผู้มีอำนาจ — ระบบแสตมป์ข้อมูลผู้ขอและผู้อนุมัติทุกครั้ง</>}</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={picked.length === 0} onClick={() => approve()}>
          <Icon name="check" /> อนุมัติรายการที่เลือก{picked.length ? ' (' + picked.length + ')' : ''}
        </button>
      </div>

      <div className="search-card" style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto auto', gap: 8, alignItems: 'center' }}>
        <div className="dep-input" style={{ height: 32, minHeight: 32, boxSizing: 'border-box', background: '#fff', minWidth: 0, margin: 0, padding: '0 10px', borderRadius: 2 }}>
          <Icon name="search" size={14} />
          <input value={qD} onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setQ(qD); setK(kD); } }}
                 placeholder="ค้นหารหัสรายการ / เลขที่บัญชี / ชื่อบัญชี / ผู้ขออนุมัติ" />
        </div>
        <select className="cfg-input" style={{ height: 32, minHeight: 32, boxSizing: 'border-box', margin: 0 }} value={kD} onChange={(e) => setKD(e.target.value)}>
          <option value="">ทุกประเภทรายการ</option>
          {kinds.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className="btn primary" style={{ height: 32 }} onClick={() => { setQ(qD); setK(kD); }}>ค้นหา</button>
        <button className="btn" style={{ height: 32 }} onClick={() => { setQD(''); setKD(''); setQ(''); setK(''); }}>รีเซ็ต</button>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <DepSecHead bar icon="filter" title={'รายการที่รออนุมัติ (' + rows.length + ')'} sub="เรียงตามวันที่ขอ — รายการที่รอนานที่สุดอยู่บนสุด" meta={'เครื่องที่ใช้อนุมัติ ' + window.DEP_DAILY_TERMINAL}
          right={<button className="btn sm" onClick={refresh} title="อัปเดตรายการที่ส่งเข้ามาใหม่"><Icon name="refresh" /> รีเฟรช</button>} />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1040 }}>
            <thead><tr>
              <th className="center" style={{ width: 40 }}>
                <input type="checkbox" className="apv-chk" checked={allOn} disabled={list.length === 0}
                       onChange={() => setSel(allOn ? sel.filter(id => !list.some(r => r._key === id)) : [...new Set([...sel, ...list.map(r => r._key)])])} />
              </th>
              <th style={{ width: 150 }}>รหัสรายการ</th>
              <th style={{ width: 132 }}>เลขที่บัญชี</th>
              <th>ชื่อบัญชี</th>
              <th style={{ width: 180 }}>ประเภทรายการ</th>
              <th style={{ width: 150 }}>ผู้ขออนุมัติ</th>
              <th className="center" style={{ width: 130 }}>วันที่ขอ</th>
              <th className="right" style={{ width: 120 }}>จำนวน</th>
              <th className="center" style={{ width: 76 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan="9" className="center muted" style={{ padding: '28px 12px' }}>
                  {rows.length === 0 ? 'ไม่มีรายการรออนุมัติ' : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
                </td></tr>
              ) : list.map(r => (
                <tr key={r._key} className={sel.includes(r._key) ? 'is-selected' : ''}>
                  <td className="center"><input type="checkbox" className="apv-chk" checked={sel.includes(r._key)} onChange={() => toggle(r._key)} /></td>
                  <td className="mono">{r.id}</td>
                  <td className="mono">{r.accNo}</td>
                  <td>{r.name}<div className="muted" style={{ fontSize: 11 }}>{r.reason}</div></td>
                  <td>{(() => { const t = apvKindOf(r.kind), ch = apvChannelOf(r.kind); return (<>
                    <span className="apv-tag" style={{ color: t.c, background: t.bg, borderColor: t.bd }}>{t.k}</span>
                    {ch && <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{ch}</div>}
                  </>); })()}</td>
                  <td>{r.reqBy}<div className="muted" style={{ fontSize: 11 }}>{r.reqTerm}</div></td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{r.reqDate}</td>
                  <td className="right mono">{r._unlock || r._open || (r._frz && !r.amount) ? (r._open ? fmt.money(r.amount, 2) : <span className="muted">—</span>) : fmt.money(r.amount, 2)}</td>
                  <td className="center"><button className="btn sm" onClick={() => { setViewRow(r); setRejecting(false); setRejectTxt(''); }}><Icon name="eye" size={12} /> ดู</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan="7" className="right"><b>รวมจำนวนที่เลือกอนุมัติ ({picked.length} รายการ)</b></td>
              <td className="right mono"><b>{fmt.money(total, 2)}</b></td>
              <td />
            </tr></tfoot>
          </table>
        </div></div>
      </div>
      {detailEl}
    </div>
  );
}

Object.assign(window, { DepApprovePage });
