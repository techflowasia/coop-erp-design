// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก — ยกเลิกการทำรายการ
//  ค้นหาด้วย เลขที่บัญชี / เลขสมาชิก / เลขที่ใบรายการ → เลือกรายการ →
//  ยืนยันด้วยรหัสผู้มีสิทธิ์ก่อนทำการยกเลิก
// ════════════════════════════════════════════════════════════════════

// เมนูย่อยกลุ่ม "ปรับปรุง" ของระบบเงินฝาก (อ้างอิงโครงสร้างเดิม) — เฉพาะ
// "ยกเลิกรายการ" ที่ใช้งานได้ในตัวอย่างนี้
const DEPOSIT_ADJUST_MENU = [
  { id: 'cancel',     label: 'ยกเลิกรายการ',            active: true  },
  { id: 'editType',   label: 'แก้ไขรายละเอียดประเภทบัญชี', active: false },
  { id: 'freeze',     label: 'อายัดบัญชี',               active: false },
  { id: 'freezeAtm',  label: 'อายัดบัญชีเงินฝาก ATM',     active: false },
  { id: 'unfreezeAtm',label: 'ยกเลิกอายัดบัญชีเงินฝาก ATM', active: false },
];

// ตัวค้นหา — เลขที่ใบรายการเป็นตัวหลัก (ชี้ไปที่ใบที่จะยกเลิกได้ตรงที่สุด) · ตัวอย่างจริงเติมจากข้อมูลในหน้า
const SEARCH_MODES = [
  { id: 'slip',    label: 'เลขที่ใบรายการ',  placeholder: 'เช่น TX-2569-11-4401', example: 'TX-2569-11-4401' },
  { id: 'account', label: 'เลขที่บัญชี',     placeholder: 'เช่น 001-2-58241-0',   example: '001-2-58241-0' },
  { id: 'member',  label: 'เลขสมาชิก',      placeholder: 'เช่น 58241',            example: '58241' },
];

function formatWorkDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear() + 543}`;
}

// ════════════════════════════════════════════════════════════════════
//  ข้อมูลจริง — บัญชีเงินฝาก (dep_txn_accounts) + ประวัติรายการ (dep_txn_ledger)
//  รหัส/ชื่อรายการจากค่าคงที่ "รหัสรายการเงินฝาก" · วันทำการเดียวกับหน้าฝาก/ถอน
// ════════════════════════════════════════════════════════════════════
const CT_FLOW = { deposit: 1, 'transfer-in': 1, withdraw: -1, 'transfer-out': -1 };
const ctWorkIso = () => (window.dpcToday ? window.dpcToday() : String(window.DEP_OPS_TODAY || window.DEPOSIT_WORKING_DATE || new Date().toISOString()).slice(0, 10));
const ctTxnCode = (l) => l.code || (String(l.channel || '').match(/^([A-Z]{2,4})\s/) || [])[1] || '';
function ctCodeInfo(code, l) {
  let r = null;
  try { r = (window.depTxnTypeLoad ? window.depTxnTypeLoad() : []).find(x => x.code === code); } catch (e) {}
  const flow = CT_FLOW[l.type] != null ? CT_FLOW[l.type] : ((r && r.side) || 1);
  return { label: (r && r.name) || String(l.channel || code).replace(/^[A-Z]{2,4}\s/, ''), flow };
}
// ใบรายการที่ยกเลิกในหน้านี้ไม่ได้ (พร้อมเหตุผล)
function ctBlockReason(l, code, reg) {
  if (l.ref === 'CLOSE' || /^CL/.test(code) || /ปิดบัญชี/.test(l.channel || '')) return 'รายการปิดบัญชี — ยกเลิกในหน้านี้ไม่ได้';
  if (code === 'RCL' || (code === 'FEE' && /เช็คคืน/.test(l.channel || ''))) return 'รายการคืนเช็ค — ยกเลิกในหน้านี้ไม่ได้';
  if (code === 'DCP' || /เช็ค/.test(l.channel || '') && l.type === 'deposit') {
    const c = ctChqOf(l, reg);
    if (c && c.status !== 'pending') return 'เช็คฉบับนี้' + (c.status === 'cleared' ? 'ผ่านเช็คแล้ว' : c.status === 'returned' ? 'คืนเช็คแล้ว' : 'ถูกยกเลิกแล้ว') + ' — ยกเลิกไม่ได้';
  }
  return '';
}
// เช็คในทะเบียนเช็คที่ตรงกับรายการฝากเช็ค
function ctChqOf(l, reg) {
  const ref = String(l.ref || '');
  return (reg || []).find(c => c.accNo === l.accNo && Number(c.amount) === Number(l.amount) && (!c.sendDate || c.sendDate === l.date)
    && (!c.chqNo || ref.includes(c.chqNo))) || null;
}
// รายการคู่ของการโอนระหว่างบัญชี (ขาออก ↔ ขาเข้า)
function ctPairOf(l, ledger) {
  if (l.type !== 'transfer-out' && l.type !== 'transfer-in') return null;
  const want = l.type === 'transfer-out' ? 'transfer-in' : 'transfer-out';
  return ledger.find(x => x.type === want && x.accNo === l.ref && x.ref === l.accNo && Number(x.amount) === Number(l.amount) && x.date === l.date && !x.cancelled) || null;
}
function ctBuildRecords() {
  const accs = window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [];
  const lg = window.depTxnLoadLedger ? window.depTxnLoadLedger() : [];
  const reg = window.depChqRegLoad ? window.depChqRegLoad() : [];
  const wd = ctWorkIso();
  const ST = { active: 'ใช้งาน', pending: 'รออนุมัติเปิด', closed: 'ปิดบัญชีแล้ว', rejected: 'ไม่อนุมัติ' };
  return accs.map(a => {
    const rule = window.dpcRules ? window.dpcRules(a, { type: 'withdraw', date: wd, amt: 0, moves: [] }) : null;
    const minBal = rule ? rule.minBal : 0;
    return {
      accNo: a.accNo, memberCode: a.member, memberName: a.name, accType: [a.typeCode, a.type].filter(Boolean).join(' '), accTypeCode: a.typeCode,
      status: ST[a.status] || a.status || 'ใช้งาน', balance: Number(a.balance) || 0, withdrawable: Math.max(0, (Number(a.balance) || 0) - minBal), minBal,
      rate: Number(a.rate) || 0, accInterest: Number(a.accrued || a.ytdInterest || 0), openDate: a.openDate,
      txns: lg.filter(l => l.accNo === a.accNo && !l.reversalOf).map(l => {
        const code = ctTxnCode(l), ci = ctCodeInfo(code, l), block = l.cancelled ? '' : ctBlockReason(l, code, reg);
        return { slip: l.id, code, label: ci.label, flow: ci.flow, desc: (l.channel || ci.label) + (l.ref && l.ref !== '—' && l.ref !== code ? ' · ' + l.ref : ''),
          amount: Number(l.amount) || 0, fee: Number(l.fee) || 0, sysFee: Number(l.sysFee) || 0, penalty: Number(l.penalty) || 0,
          by: l.by, date: l.date, time: l.time || '', cancelled: !!l.cancelled, cancelInfo: l.cancelInfo,
          cancellable: !block, blockReason: block, type: l.type };
      }),
    };
  });
}
// ผลต่อยอดเมื่อกลับรายการ — คืนค่าธรรมเนียม/ค่าปรับที่หักพร้อมรายการนั้นด้วย
const ctDelta = (t) => -t.flow * t.amount + t.fee + t.sysFee + t.penalty;

// ── ตัวอย่างรายการของวันทำการ (เติมครั้งเดียว · ยอดบัญชีปรับตามรายการจริง) ──
function ctSeedSamples() {
  try { if (localStorage.getItem('dep_cancel_samples_v1')) return; } catch (e) { return; }
  try {
    if (!window.depTxnLoadAccounts || !window.depTxnNextId) return;
    const wd = ctWorkIso();
    let accs = window.depTxnLoadAccounts();
    const lg = window.depTxnLoadLedger();
    const U1 = 'จันทร์เพ็ญ มาลี', U2 = 'สุนิสา ใจเย็น';
    const out = [];
    const post = (accNo, type, code, label, amount, extra) => {
      const a = accs.find(x => x.accNo === accNo); if (!a) return null;
      const fee = (extra && (extra.fee || 0) + (extra.sysFee || 0)) || 0;
      const bal = Number(a.balance) + (CT_FLOW[type] || 1) * amount - fee;
      accs = accs.map(x => x.accNo === accNo ? { ...x, balance: bal } : x);
      const e = { id: window.depTxnNextId(), date: wd, accNo, member: a.member, type, channel: code + ' ' + label, code, amount, fee: 0, balance: bal, ref: code, by: U1, ...(extra || {}) };
      out.push(e); return e;
    };
    post('001-2-58241-0', 'deposit', 'DCA', 'ฝากเพิ่มด้วยเงินสด', 2500);
    post('001-2-58241-0', 'withdraw', 'WCA', 'ถอนด้วยเงินสด', 1500, { by: U2 });
    post('002-5-58241-7', 'withdraw', 'WTE', 'ถอนโอนเข้าบัญชีธนาคาร', 20000, { sysFee: 200 });
    post('001-2-58241-0', 'transfer-out', 'TRI', 'โอนระหว่างบัญชีเงินฝาก', 10000, { ref: '002-5-58241-7' });
    post('002-5-58241-7', 'transfer-in', 'TRI', 'โอนระหว่างบัญชีเงินฝาก', 10000, { ref: '001-2-58241-0' });
    const chq = post('001-2-70011-3', 'deposit', 'DCP', 'ฝากเพิ่มด้วยเช็คส่วนบุคคล', 15000, { ref: '0098765 ธนาคารกรุงไทย', by: U2 });
    if (chq && window.depChqRegAdd) window.depChqRegAdd([{ chqNo: '0098765', bank: 'ธนาคารกรุงไทย', branch: 'สาขาสำนักงานใหญ่', type: 'เช็คในเขต', floatDays: 1,
      faceDate: wd, sendDate: wd, amount: 15000, accNo: '001-2-70011-3', accName: 'ประภาพร ศรีสวัสดิ์', src: 'ตัวอย่างยกเลิกรายการ', by: U2 }]);
    // ตัวอย่างสถานะ "ยกเลิกแล้ว" — ฝากแล้วกลับรายการ (ยอดสุทธิไม่เปลี่ยน)
    const x = post('001-2-70011-3', 'deposit', 'DCA', 'ฝากเพิ่มด้วยเงินสด', 3000);
    if (x) {
      x.cancelled = true; x.cancelInfo = { by: 'อภิชาติ ศรีสุข', reason: 'บันทึกจำนวนเงินผิด', ts: wd + 'T10:15:00' };
      post('001-2-70011-3', 'withdraw', 'DCA', 'ยกเลิก DCA ฝากเพิ่มด้วยเงินสด (ใบ ' + x.id + ')', 3000, { reversalOf: x.id, by: 'อภิชาติ ศรีสุข' });
    }
    window.depTxnSaveAccounts(accs);
    window.depTxnSaveLedger([...out.reverse(), ...lg]);
    localStorage.setItem('dep_cancel_samples_v1', wd);
  } catch (e) {}
}

function CancelTxnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  // บัญชี + รายการจริงจากประวัติบัญชี (ไม่ใช่ข้อมูลตัวอย่างของหน้านี้)
  const [records, setRecords] = useState(() => { ctSeedSamples(); return ctBuildRecords(); });
  const [mode, setMode]           = useState('all');
  const [pickOpen, setPickOpen]   = useState(false);
  const [pickQ, setPickQ]         = useState('');
  const [query, setQuery]         = useState('');
  const [searched, setSearched]   = useState(false);
  const [results, setResults]     = useState([]);          // matched accNo[]
  const [activeAccNo, setActive]  = useState(null);
  const [highlightSlip, setHL]    = useState(null);
  const [selected, setSelected]   = useState([]);          // slip[]
  const [confirmOpen, setConfirm] = useState(false);

  const workDate = ctWorkIso();
  const workIso = String(workDate).slice(0, 10);
  // ผู้ใช้งานปัจจุบัน + สิทธิ์เลือกวันที่ย้อนหลัง (หัวหน้า / ผู้มีสิทธิ์ยกเลิก)
  const me = React.useMemo(() => {
    const name = window.LC_USER || window.DN_USER || 'มนตรี ศรีสุข';
    const u = (window.sysUserByName && window.sysUserByName(name)) || { name, role: '' };
    const inAuth = (window.CANCEL_AUTHORIZERS || []).some(a => a.name === u.name);
    const canBack = inAuth || /หัวหน้า|ผู้จัดการ|ผู้ช่วย|ผู้อำนวยการ|ผู้ดูแลระบบ|admin/i.test(u.role || '');
    return { name: u.name, role: u.role || 'เจ้าหน้าที่', canBack };
  }, []);
  const [txDate, setTxDate] = useState(workIso);
  const isBack = txDate !== workIso;
  const pickDate = (v) => {
    const nv = v || workIso;
    if (nv === txDate) return;
    audit.log({ action: 'view', module: 'เงินฝาก — ยกเลิกรายการ', target: 'วันที่รายการ',
      summary: 'เลือกดูรายการย้อนหลังวันที่ ' + fmt.date(nv), user: me.name, role: me.role,
      changes: [{ field: 'วันที่รายการ', before: fmt.date(txDate), after: fmt.date(nv) }] });
    setTxDate(nv); setSelected([]);
  };
  // ค้นหาด้วยเลขที่ใบรายการ → แสดงเฉพาะใบนั้น
  // เรียงรายการล่าสุดขึ้นก่อน (วันที่-เวลา แล้วตามเลขที่ใบรายการ)
  const dayTxns = (r) => (r ? r.txns.filter(t => String(t.date).slice(0, 10) === txDate && (!highlightSlip || t.slip === highlightSlip))
    .slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.time || '').localeCompare(String(a.time || '')) || String(b.slip).localeCompare(String(a.slip))) : []);
  // ตัวอย่างจากข้อมูลจริง — ใบรายการล่าสุดของวันทำการ (ไม่มีจึงใช้รูปแบบตั้งต้น)
  const exModes = React.useMemo(() => {
    const all = records.flatMap(r => r.txns.map(t => ({ r, t }))).filter(x => !x.t.cancelled);
    const ex = all.filter(x => String(x.t.date).slice(0, 10) === workIso)[0] || all[0];
    return ex ? SEARCH_MODES.map(m => ({ ...m, example: m.id === 'slip' ? ex.t.slip : m.id === 'account' ? ex.r.accNo : String(ex.r.memberCode) }))
              : SEARCH_MODES;
  }, [records]);
  const modeDef  = { label: 'เลขที่ใบรายการ / เลขที่บัญชี / เลขสมาชิก',
    placeholder: 'ค้นหาเลขที่ใบรายการ / เลขที่บัญชี / เลขสมาชิก — เช่น ' + exModes.map(m => m.example).join(' · '), example: exModes[0].example };
  const norm = (s) => String(s).toLowerCase().replace(/[\s-]/g, '');
  // เลขสมาชิก — ค้นได้ทั้งมี/ไม่มีตัวอักษรหรือเลข 0 นำหน้า (M-058241 = 58241)
  const memKey = (s) => String(s || '').replace(/\D/g, '').replace(/^0+/, '');

  const runSearch = (q = query, md = mode) => {
    setSearched(true);
    setSelected([]);
    const nq = norm(q.trim());
    if (!nq) { setResults([]); setActive(null); setHL(null); return; }
    let hl = null;
    const qk = memKey(q);
    let hlTx = null;
    // ใบรายการก่อน (ตรงตัวก่อน แล้วค่อยบางส่วน) → เลขที่บัญชี → เลขสมาชิก
    const exact = records.find(r => r.txns.some(t => norm(t.slip) === nq));
    const matched = exact ? [exact] : records.filter(r => {
      const tx = r.txns.find(t => norm(t.slip).includes(nq));
      if (tx) { if (!hl) { hl = tx.slip; hlTx = tx; } return true; }
      if (norm(r.accNo).includes(nq)) return true;
      const mk = memKey(r.memberCode);
      return norm(r.memberCode).includes(nq) || (qk && mk && mk === qk);
    });
    if (exact) { hlTx = exact.txns.find(t => norm(t.slip) === nq); hl = hlTx.slip; }
    // ใบรายการของวันอื่น → เปิดวันนั้นให้ (เฉพาะผู้มีสิทธิ์ดูย้อนหลัง)
    if (hlTx && String(hlTx.date).slice(0, 10) !== txDate && me.canBack) pickDate(String(hlTx.date).slice(0, 10));
    setResults(matched.map(r => r.accNo));
    setHL(hl);
    setActive(matched.length === 1 ? matched[0].accNo : null);
  };

  const resetSearch = () => {
    setQuery(''); setSearched(false); setResults([]); setActive(null); setHL(null); setSelected([]);
  };

  const switchMode = (m) => { setMode(m); setQuery(''); setSearched(false); setResults([]); setActive(null); setHL(null); setSelected([]); };

  const matchedRecs = results.map(no => records.find(r => r.accNo === no)).filter(Boolean);
  const acc = activeAccNo ? records.find(r => r.accNo === activeAccNo) : null;

  const ctCashSel = acc ? acc.txns.filter(t => selected.includes(t.slip)).some(t => /เงินสด/.test(t.label + ' ' + t.desc)) : false;
  const ctBlocked = !(window.depCtCashReady && window.depCtCashReady());
  const toggleSel = (slip) => setSelected(s => s.includes(slip) ? s.filter(x => x !== slip) : [...s, slip]);
  const selectableSlips = dayTxns(acc).filter(t => !t.cancelled && t.cancellable !== false).map(t => t.slip);
  const allSelected = selectableSlips.length > 0 && selectableSlips.every(s => selected.includes(s));
  const toggleAll = () => setSelected(allSelected ? [] : [...selectableSlips]);

  const selectedTxns = acc ? acc.txns.filter(t => selected.includes(t.slip)) : [];
  // ตรวจก่อนยกเลิก — ยอดหลังกลับรายการต้องไม่ติดลบ และไม่ต่ำกว่าคงเหลือขั้นต่ำของประเภทบัญชี
  const selDelta = selectedTxns.reduce((s, t) => s + ctDelta(t), 0);
  const afterCancel = acc ? acc.balance + selDelta : 0;
  const cancelErrors = [];
  if (acc && selectedTxns.length) {
    if (afterCancel < 0) cancelErrors.push('ยกเลิกแล้วยอดคงเหลือติดลบ (' + fmt.money(afterCancel, 2) + ' บาท) — ยกเลิกไม่ได้');
    else if (selDelta < 0 && acc.minBal > 0 && afterCancel < acc.minBal) cancelErrors.push('ยกเลิกแล้วยอดคงเหลือต่ำกว่าขั้นต่ำของประเภทบัญชี (' + fmt.money(acc.minBal, 2) + ' บาท)');
    const frz = window.dpcFreezeOf ? window.dpcFreezeOf(acc.accNo) : null;
    if (frz) {
      const fr = window.dpcFreezeRule(frz, acc.balance);
      if (selDelta < 0 && fr.out) cancelErrors.push('บัญชีถูกอายัด — ' + frz.label + ' · ยกเลิกรายการที่ทำให้เงินออกจากบัญชีไม่ได้');
      else if (selDelta > 0 && fr.in) cancelErrors.push('บัญชีถูกอายัด — ' + frz.label + ' · ยกเลิกรายการที่ทำให้เงินเข้าบัญชีไม่ได้');
      else if (selDelta < 0 && fr.amt > 0 && afterCancel < fr.amt) cancelErrors.push('ยกเลิกแล้วยอดคงเหลือต่ำกว่ายอดที่อายัดไว้ (' + fmt.money(fr.amt, 2) + ' บาท)');
    }
  }

  // ── ดำเนินการยกเลิกหลังยืนยันรหัสผู้มีสิทธิ์ ──────────────────────
  const performCancel = ({ reason }) => {
    const authorizer = { name: me.name, role: me.role };
    const ts = new Date().toISOString().slice(0, 19);
    let accs = window.depTxnLoadAccounts();
    let lg = window.depTxnLoadLedger();
    let reg = window.depChqRegLoad ? window.depChqRegLoad() : null;
    const add = [];
    // กลับรายการ 1 ใบ: ทำเครื่องหมายยกเลิก + รายการกลับ + ปรับยอดบัญชี (คืนค่าธรรมเนียม/ค่าปรับที่หักพร้อมกัน)
    const reverse = (l) => {
      const code = ctTxnCode(l), ci = ctCodeInfo(code, l);
      const t = { flow: ci.flow, amount: Number(l.amount) || 0, fee: Number(l.fee) || 0, sysFee: Number(l.sysFee) || 0, penalty: Number(l.penalty) || 0 };
      const d = ctDelta(t);
      const a = accs.find(x => x.accNo === l.accNo); if (!a) return;
      const bal = Number(a.balance) + d;
      accs = accs.map(x => x.accNo === l.accNo ? { ...x, balance: bal } : x);
      lg = lg.map(x => x.id === l.id ? { ...x, cancelled: true, cancelInfo: { by: authorizer.name, reason, ts } } : x);
      add.push({ id: window.depTxnNextId(), date: workIso, accNo: l.accNo, member: l.member, type: d >= 0 ? 'deposit' : 'withdraw',
        channel: 'ยกเลิก ' + (code ? code + ' ' : '') + ci.label + ' (ใบ ' + l.id + ')', code, amount: Math.abs(d), fee: 0, balance: bal,
        ref: l.id, reversalOf: l.id, by: authorizer.name });
      if (reg && (code === 'DCP' || l.type === 'deposit')) { const c = ctChqOf(l, reg); if (c && c.status === 'pending') reg = reg.map(x => x.id === c.id ? { ...x, status: 'cancelled', actDate: workIso, reason: 'ยกเลิกรายการฝาก — ' + reason } : x); }
    };
    selected.forEach(slip => {
      const l = lg.find(x => x.id === slip); if (!l || l.cancelled) return;
      const pair = ctPairOf(l, lg);
      reverse(l);
      if (pair) reverse(lg.find(x => x.id === pair.id));   // โอนระหว่างบัญชี — กลับทั้งขาออกและขาเข้า
    });
    window.depTxnSaveAccounts(accs);
    window.depTxnSaveLedger([...add.reverse(), ...lg]);
    if (reg && window.depChqRegSave) window.depChqRegSave(reg);
    setRecords(ctBuildRecords());

    selectedTxns.forEach(t => {
      audit.log({
        action: 'delete', module: 'เงินฝาก',
        target: `${acc.memberCode} · ${acc.memberName}`,
        summary: `ยกเลิกรายการเงินฝาก ${t.slip} — ${t.code ? t.code + ' ' : ''}${t.label || ''}`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่ใบรายการ', before: t.slip, after: 'ยกเลิกแล้ว' },
          { field: 'บัญชี', before: acc.accNo, after: `${acc.accType}` },
          { field: 'จำนวนเงิน', before: fmt.money(t.amount, 2), after: '— (กลับรายการ' + (t.fee + t.sysFee + t.penalty ? ' รวมคืนค่าธรรมเนียม/ค่าปรับ ' + fmt.money(t.fee + t.sysFee + t.penalty, 2) : '') + ')' },
          { field: 'เหตุผล', before: '—', after: reason },
          ...(String(t.date).slice(0, 10) !== workIso
            ? [{ field: 'ประเภทการยกเลิก', before: '—', after: 'ยกเลิกย้อนหลัง (รายการวันที่ ' + fmt.date(t.date) + ')' }] : []),
          { field: 'ยกเลิกโดย', before: '—', after: `${authorizer.name} (${authorizer.role})` },
        ],
      });
    });

    const n = selectedTxns.length;
    window.depSuccess({ title: 'ยกเลิกรายการเรียบร้อยแล้ว', desc: 'ยกเลิกรายการ ' + n + ' รายการ โดย ' + authorizer.name + ' เรียบร้อยแล้ว' });
    setSelected([]);
    setConfirm(false);
  };

  return (
    <div data-screen-label="หน้ายกเลิกการทำรายการเงินฝาก" className="ct-page">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            ระบบเงินฝาก · ยกเลิกการทำรายการ
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาบัญชี แล้วเลือกรายการธุรกรรมที่ต้องการยกเลิก — ต้องยืนยันด้วยรหัสผู้มีสิทธิ์
          </div>
        </div>
      </div>

      {/* ── การ์ดค้นหา ── */}
      <div className="search-card">
        <div className="ct-searchbar">
          <div className="dep-input ct-search-input">
            <Icon name="search" size={14} />
            <input value={query}
                   placeholder={modeDef.placeholder}
                   onChange={e => setQuery(e.target.value)}
                   onKeyDown={e => { if (e.key === 'Enter') runSearch(); }} />
            <button className="dep-eye" onClick={() => setPickOpen(true)} title="เปิดหน้าต่างค้นหาบัญชี" aria-label="เปิดหน้าต่างค้นหาบัญชี">
              <span style={{ fontSize: 15, lineHeight: 1, letterSpacing: 1 }}>…</span>
            </button>
          </div>
          {me.canBack
            ? <div className="ct-date" title="เลือกวันที่ของรายการที่ต้องการยกเลิก">
                <window.ThaiDateField value={txDate} max={workIso} onChange={pickDate} />
              </div>
            : <div className="dep-input ct-date ct-date-lock" title="ยกเลิกรายการได้เฉพาะวันทำรายการ — การเลือกวันที่ย้อนหลังต้องใช้สิทธิ์หัวหน้าหรือผู้มีสิทธิ์ยกเลิก">
                <Icon name="lock" size={13} />
                <span>{fmt.date(txDate)}</span>
              </div>}
          <button className="btn primary ct-sbtn" onClick={() => runSearch()}>ค้นหา</button>
          <button className="btn ct-sbtn" onClick={() => { resetSearch(); setTxDate(workIso); }}>รีเซ็ต</button>
        </div>
        {isBack && (
          <div className="sr-warn" style={{ marginTop: 10 }}>
            <Icon name="info" size={14} /> กำลังดูรายการย้อนหลังวันที่ {fmt.date(txDate)} — การยกเลิกจะถูกบันทึกเป็น “ยกเลิกย้อนหลัง” ใน Audit Log พร้อมชื่อผู้ทำรายการ
          </div>
        )}
        {pickOpen && (
          <DepAccountSearchModal
            accounts={records.map(r => ({ accNo: r.accNo, member: r.memberCode, name: r.memberName, type: r.accType, typeCode: r.accTypeCode, balance: r.balance, status: 'active' }))}
            onPick={(a) => { setPickOpen(false); setQuery(a.accNo); runSearch(a.accNo); }}
            onClose={() => setPickOpen(false)} />
        )}
        <div className="ct-search-hint muted">
          <Icon name="info" size={12} /> ตัวอย่างสำหรับสาธิต — ลองค้นหา{' '}
          {exModes.map((m, i) => (
            <React.Fragment key={m.id}>
              {i > 0 && ' · '}
              <button className="ct-example mono" onClick={() => { setQuery(m.example); runSearch(m.example); }}>{m.example}</button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── ผลการค้นหา ── */}
      {searched && matchedRecs.length === 0 && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="search" size={26} /></div>
            ไม่พบบัญชีหรือรายการที่ตรงกับ “{query}”
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              ตรวจสอบเลขที่บัญชี เลขสมาชิก หรือเลขที่ใบรายการอีกครั้ง
            </div>
          </div>
        </div>
      )}

      {/* ── เลือกบัญชี (กรณีพบหลายบัญชี เช่น ค้นด้วยเลขสมาชิก) ── */}
      {!acc && matchedRecs.length > 1 && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head"><span className="head-bar" /><h3>พบ {matchedRecs.length} บัญชี — เลือกบัญชีที่ต้องการ</h3></div>
          <div className="ct-acct-picker">
            {matchedRecs.map(r => (
              <button key={r.accNo} className="ct-pick" onClick={() => { setActive(r.accNo); setSelected([]); }}>
                <div className="ct-pick-ico"><Icon name="wallet" /></div>
                <div className="ct-pick-main">
                  <div className="ct-pick-no mono">{r.accNo}</div>
                  <div className="ct-pick-type">{r.accType} · {r.memberCode} {r.memberName}</div>
                </div>
                <div className="ct-pick-bal">
                  <div className="muted" style={{ fontSize: 11 }}>ยอดคงเหลือ</div>
                  <div className="mono" style={{ fontWeight: 600 }}>฿ {fmt.money(r.balance, 2)}</div>
                </div>
                <Icon name="chevRight" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── รายละเอียดบัญชี + รายการ ── */}
      {acc && (
        <div className="search-card" style={{ marginTop: 12 }}>
          {/* identity strip */}
          <div className="ct-acct-strip">
            <div className="ct-acct-ico"><Icon name="wallet" /></div>
            <div style={{ minWidth: 0 }}>
              <div className="ct-acct-no mono">{acc.accNo}</div>
              <div className="ct-acct-sub">
                <span className="pill info">{acc.accType}</span>
                <span className="pill ok">{acc.status}</span>
                {(() => { const f = window.dpcFreezeOf && window.dpcFreezeOf(acc.accNo); return f ? <span className="pill bad" title={f.reason || ''}>อายัด · {f.label}</span> : null; })()}
                <span className="ct-acct-member">{acc.memberCode} · {acc.memberName}</span>
              </div>
            </div>
            <span className="spacer" style={{ flex: 1 }} />
            {matchedRecs.length > 1 && (
              <button className="btn sm" onClick={() => { setActive(null); setSelected([]); }}>
                <Icon name="chevLeft" /> เลือกบัญชีอื่น
              </button>
            )}
            <TxHistoryButton memberCode={acc.memberCode} memberName={acc.memberName}
                             modules={['เงินฝาก']} title="ประวัติการทำรายการ — เงินฝาก" />
          </div>

          {/* KPI */}
          <div className="summary-row" style={{ marginTop: 14 }}>
            <div className="summary-card accent">
              <div className="label">ยอดเงินคงเหลือ</div>
              <div className="value">{fmt.money(acc.balance, 2)}</div>
              <div className="sub">ณ วันทำรายการ {formatWorkDate(workDate)}</div>
            </div>
            <div className="summary-card">
              <div className="label">ยอดเงินถอนได้</div>
              <div className="value">{fmt.money(acc.withdrawable, 2)}</div>
              <div className="sub">อัตราดอกเบี้ย {acc.rate.toFixed(2)}% ต่อปี</div>
            </div>
            <div className="summary-card">
              <div className="label">ดอกเบี้ย / ปันผลสะสม</div>
              <div className="value">{fmt.money(acc.accInterest, 2)}</div>
              <div className="sub">เปิดบัญชี {fmt.date(acc.openDate)}</div>
            </div>
          </div>

          {/* ตารางรายการ */}
          <div className="section" style={{ marginTop: 16 }}>
            <div className="section-head">
              <span className="head-bar" />
              <h3>รายละเอียดรายการ</h3>
              <span className="muted" style={{ fontSize: 11 }}>
                เลือกได้เฉพาะรายการที่ทำโดยเจ้าหน้าที่ในวันทำรายการเดียวกัน
              </span>
            </div>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ct-tbl">
                <thead>
                  <tr>
                    <th className="center" style={{ width: 40 }}>
                      <input type="checkbox" className="ct-check"
                             checked={allSelected}
                             disabled={selectableSlips.length === 0}
                             onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                    </th>
                    <th className="center" style={{ width: 56 }}>ลำดับ</th>
                    <th>เลขที่ใบรายการ</th>
                    <th>คำอธิบาย</th>
                    <th className="num">จำนวนเงิน</th>
                    <th>ผู้ทำรายการ</th>
                    <th className="center">วันที่รายการ</th>
                    <th className="center">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {dayTxns(acc).length === 0 && (
                    <tr><td colSpan="9" className="empty-state">
                      {highlightSlip ? <>ไม่พบใบรายการ {highlightSlip} ในวันที่ {fmt.date(txDate)}</> : <>ไม่มีรายการของวันที่ {fmt.date(txDate)}</>}
                    </td></tr>
                  )}
                  {highlightSlip && (
                    <tr><td colSpan="9" style={{ background: '#fafafa', fontSize: 12 }}>
                      <span className="muted">แสดงเฉพาะใบรายการ <b className="mono" style={{ color: 'var(--text)' }}>{highlightSlip}</b></span>{' '}
                      <button className="btn sm" style={{ marginLeft: 8 }} onClick={() => { setHL(null); setSelected([]); }}>แสดงทุกรายการของบัญชี</button>
                    </td></tr>
                  )}
                  {dayTxns(acc).map((t, idx) => {
                    const c = { label: t.label, flow: t.flow };
                    const sel = selected.includes(t.slip);
                    const canPick = !t.cancelled && t.cancellable !== false;
                    return (
                      <tr key={t.slip}
                          className={(t.cancelled ? 'cancelled ' : '') + (sel ? 'sel' : '')}>
                        <td className="center">
                          {canPick ? (
                            <input type="checkbox" className="ct-check" checked={sel}
                                   onChange={() => toggleSel(t.slip)}
                                   aria-label={`เลือก ${t.slip}`} />
                          ) : (
                            <span className="ct-lockcell" title={t.cancelled ? 'ยกเลิกแล้ว' : t.blockReason}>
                              <Icon name="lock" size={12} />
                            </span>
                          )}
                        </td>
                        <td className="center muted mono">{idx + 1}</td>
                        <td className="mono">{t.slip}</td>
                        <td>{t.desc}{t.blockReason && !t.cancelled ? <div className="muted" style={{ fontSize: 11 }}>{t.blockReason}</div> : null}{(t.fee + t.sysFee + t.penalty) > 0 ? <div className="muted" style={{ fontSize: 11 }}>ค่าธรรมเนียม/ค่าปรับ {fmt.money(t.fee + t.sysFee + t.penalty, 2)}</div> : null}</td>
                        <td className="num" style={{ fontWeight: 600,
                              color: t.cancelled ? 'var(--text-faint)' : (c.flow < 0 ? 'var(--danger)' : 'var(--success)') }}>
                          {c.flow < 0 ? '−' : '+'} {fmt.money(t.amount, 2)}
                        </td>
                        <td>{t.by}</td>
                        <td className="center mono">{fmt.date(t.date)}</td>
                        <td className="center">
                          {t.cancelled
                            ? <span className="pill bad" title={t.cancelInfo ? 'โดย ' + t.cancelInfo.by + ' · ' + t.cancelInfo.reason : undefined}>ยกเลิกแล้ว</span>
                            : t.cancellable === false
                              ? <span className="pill" title={t.blockReason}>ยกเลิกไม่ได้</span>
                              : <span className="pill ok">ยกเลิกได้</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>
          </div>

          {/* action bar */}
          {ctBlocked && window.DepCtGateBanner && <window.DepCtGateBanner what="การยกเลิกรายการ" />}
          {cancelErrors.length > 0 && (
            <div className="dat-warn" style={{ marginTop: 12, background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
              <Icon name="info" size={14} /><div>{cancelErrors.map((e, i) => <div key={i}>{e}</div>)}</div>
            </div>
          )}
          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>
              {selected.length > 0
                ? <>เลือก <b style={{ color: 'var(--text)' }}>{selected.length}</b> รายการ · รวม{' '}
                    <b className="mono" style={{ color: 'var(--text)' }}>
                      ฿ {fmt.money(selectedTxns.reduce((a, t) => a + t.amount, 0), 2)}
                    </b> · ยอดคงเหลือหลังยกเลิก <b className="mono" style={{ color: 'var(--text)' }}>฿ {fmt.money(afterCancel, 2)}</b></>
                : 'ยังไม่ได้เลือกรายการที่จะยกเลิก'}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn danger ct-danger-solid" disabled={selected.length === 0 || ctBlocked || cancelErrors.length > 0} onClick={() => setConfirm(true)}>
              ยกเลิกรายการที่เลือก{selected.length > 0 ? ` (${selected.length})` : ''}
            </button>
          </div>
        </div>
      )}

      {/* ── สถานะเริ่มต้น (ยังไม่ค้นหา) ── */}
      {!searched && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="wallet" size={26} /></div>
            ค้นหาด้วยเลขที่บัญชี เลขสมาชิก หรือเลขที่ใบรายการ เพื่อแสดงรายการธุรกรรม
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              พิมพ์ในช่องค้นหาแล้วกด Enter หรือกดปุ่มค้นหา
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmCancelModal
          acc={acc} txns={selectedTxns}
          onClose={() => setConfirm(false)}
          onConfirm={performCancel} />
      )}
    </div>
  );
}

// ── โมดัลยืนยันการยกเลิก — ต้องเลือกเหตุผล + ใส่รหัสผู้มีสิทธิ์ ──────
function ConfirmCancelModal({ acc, txns, onClose, onConfirm }) {
  const [reason, setReason]   = useState(window.CANCEL_REASONS[0]);
  const [customR, setCustomR] = useState('');
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);
  const isOther = reason === window.CANCEL_REASONS[window.CANCEL_REASONS.length - 1];
  const total = txns.reduce((a, t) => a + t.amount, 0);

  const submit = (e) => {
    e.preventDefault();
    const finalReason = isOther ? customR.trim() : reason;
    if (isOther && !finalReason) { setError('กรุณาระบุเหตุผลการยกเลิก'); return; }
    setBusy(true); setError('');
    setTimeout(() => {
      const authorizer = { name: '', role: '' };
      setBusy(false);
      onConfirm({ authorizer, reason: finalReason });
    }, 300);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการยกเลิกรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              บัญชี <span className="mono">{acc.accNo}</span> · {acc.memberName}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะกลับรายการธุรกรรมและปรับยอดบัญชีทันที การกระทำนี้จะถูกบันทึกใน Audit Log และไม่สามารถย้อนกลับได้</span>
          </div>

          <div className="ct-confirm-list">
            {txns.map(t => {
              const c = { label: (t.code ? t.code + ' ' : '') + t.label, flow: t.flow };
              return (
                <div className="ct-confirm-row" key={t.slip}>
                  <div style={{ minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{t.slip}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{c.label} · {fmt.date(t.date)}</div>
                  </div>
                  <div className="mono" style={{ fontWeight: 600, color: c.flow < 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {c.flow < 0 ? '−' : '+'} {fmt.money(t.amount, 2)}
                  </div>
                </div>
              );
            })}
            <div className="ct-confirm-total">
              <span>รวม {txns.length} รายการ</span>
              <span className="mono">฿ {fmt.money(total, 2)}</span>
            </div>
          </div>

          <form className="dep-form" onSubmit={submit}>
            <label className="lb-label">เหตุผลการยกเลิก <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select className="filter-select" style={{ width: '100%', height: 38 }}
                    value={reason} onChange={e => { setReason(e.target.value); setError(''); }}>
              {window.CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {isOther && (
              <textarea className="cfg-input" rows={2} style={{ marginTop: 8 }}
                        placeholder="ระบุเหตุผลการยกเลิก..."
                        value={customR} onChange={e => { setCustomR(e.target.value); setError(''); }} />
            )}

            {error && <div className="dep-error"><Icon name="info" size={13} /> {error}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                ยกเลิก
              </button>
              <button type="submit" className="btn danger ct-danger-solid" style={{ flex: 1, justifyContent: 'center' }} disabled={busy}>
                {busy ? 'กำลังดำเนินการ...' : 'ยืนยันการยกเลิก'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}

Object.assign(window, { CancelTxnPage });
