// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — ฝากหลายยอด / ถอนหลายยอด
//  บัญชีเดียว ทำได้หลายรายการ (เงินสดหลายยอด + เช็คหลายฉบับ)
//  แต่ละยอดแยกเป็นรายการเคลื่อนไหวคนละรายการ ไม่รวมยอด
// ════════════════════════════════════════════════════════════════════

const DEP_MA_CFG = {
  deposit: { title: 'ฝากหลายยอด', desc: 'ฝากเงินเข้าบัญชีได้หลายรายการในครั้งเดียว — แต่ละยอดบันทึกเป็นรายการแยกกัน', action: 'บันทึกรายการฝาก', channel: 'ฝากหลายยอด', type: 'deposit', sign: 1 },
  withdraw: { title: 'ถอนหลายยอด', desc: 'ถอนเงินออกจากบัญชีได้หลายรายการในครั้งเดียว — แต่ละยอดบันทึกเป็นรายการแยกกัน', action: 'บันทึกรายการถอน', channel: 'ถอนหลายยอด', type: 'withdraw', sign: -1 },
};

function DepMaRo({ label, value, mono, wide }) {
  return (
    <div className="dat-field" style={wide ? { gridColumn: 'span 2' } : undefined}>
      <label>{label}</label>
      <input className={'cfg-input' + (mono ? ' mono' : '')} readOnly value={value || ''} placeholder="—" />
    </div>
  );
}

// บัญชีธนาคารของเจ้าของบัญชี — จากทะเบียนสมาชิก / ทะเบียนบุคคลภายนอก
function depMaOwnerBanks(acc) {
  if (!acc) return [];
  const key = (v) => String(v == null ? '' : v).replace(/\D/g, '').replace(/^0+/, '');
  const raw = String(acc.member || '');
  const isExt = /^[EL]\d/.test(raw);
  const pools = isExt
    ? [window.depExtPersonsLoad ? window.depExtPersonsLoad() : null]
    : [window.DEP_TXN_MEMBERS, window.GUAR_MEMBERS, window.MEMBERS_LIST];
  let p = null;
  for (const pool of pools.filter(Boolean)) {
    p = pool.find(x => isExt ? String(x.code) === raw : (key(x.code) === key(raw) || key(x.memberCode) === key(raw)));
    if (p && (p.bankAcc || p.bankAcct || p.acctNo || (p.bankAccounts || []).length)) break;
  }
  if (!p) return [];
  // ชื่อธนาคารให้ตรงกับรายการ DEP_BANKS (เช่น "ธ. กรุงไทย จำกัด (มหาชน)" → "ธ.กรุงไทย")
  const normBank = (b) => {
    const s = String(b || '').replace(/\s+/g, '');
    return (window.DEP_BANKS || []).find(x => { const n = String(x).replace(/\s+/g, '').replace(/^ธ\./, ''); return n && s.includes(n); }) || b || '';
  };
  const list = [];
  const push = (bank, accNo, name, branch) => { if (accNo && !list.some(x => x.acc === accNo)) list.push({ bank: normBank(bank), acc: accNo, name: name || acc.name || '', branch: branch || '' }); };
  push(p.bank, p.bankAcc || p.bankAcct || p.acctNo, p.bankAccName || p.name, p.bankBranch);
  (p.bankAccounts || []).forEach(b => push(b.bank, b.acc || b.acctNo, b.name, b.branch));
  return list;
}

function DepMultiAmountPage({ mode: mode0 = 'deposit', onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [mode, setMode] = useState(mode0);
  React.useEffect(() => { setMode(mode0); }, [mode0]);
  const [askMode, setAskMode] = useState(null);
  const cfg = DEP_MA_CFG[mode];
  const TINT = mode === 'withdraw' ? '#cf1322' : 'var(--brand, #237450)';
  const [ownerBanks, setOwnerBanks] = useState([]);
  const blankTrf = (ob) => {
    const b = (ob || ownerBanks)[0];
    return { k: Date.now() + Math.random(), bank: b ? b.bank : window.DEP_BANKS[0], acc: b ? b.acc : '', name: b ? b.name : '', other: !b,
             ref: '', date: window.DEP_OPS_TODAY || '', amount: '' };
  };
  const [trfs, setTrfs] = useState([]);
  const pickTrfAcc = (k, v) => {
    if (v === '__other') { setTrfs(c => c.map(r => r.k === k ? { ...r, other: true, acc: '', name: '' } : r)); return; }
    const b = ownerBanks.find(x => x.acc === v);
    setTrfs(c => c.map(r => r.k === k ? { ...r, other: false, acc: v, bank: b ? b.bank : r.bank, name: b ? b.name : r.name } : r));
  };
  const addTrf = () => setTrfs(c => [...c, blankTrf()]);
  const delTrf = (k) => setTrfs(c => (c.length > 1 ? c.filter(r => r.k !== k) : c));
  const setTrf = (k, fld, v) => setTrfs(c => c.map(r => (r.k === k ? { ...r, [fld]: v } : r)));

  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [accPick, setAccPick] = useState(false);
  const [cur, setCur] = useState(null);
  const [branch, setBranch] = useState('000');
  const [cash, setCash] = useState([{ k: 1, amount: '' }]);
  const [chqs, setChqs] = useState([]);
  const [hasBook, setHasBook] = useState(true);
  const [bookBal, setBookBal] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(null);
  const [ctTick, setCtTick] = useState(0);
  const ctReady = !!(window.depCtCashReady && window.depCtCashReady()) || ctTick < 0;
  const ctSession = ctReady && window.depCtReadyCounters ? window.depCtReadyCounters()[0] : null;
  // เคาน์เตอร์ที่เปิดให้แล้ว แต่เจ้าหน้าที่ยังไม่ได้ตรวจรับเงิน
  const ctPending = (() => {
    if (ctReady || !window.depCtLoadAll || !window.depCtMe) return null;
    const me = window.depCtMe(), all = window.depCtLoadAll();
    return (window.DEP_COUNTERS || []).map(c => all[c.code]).find(s => s && s.status === 'open' && !s.cashVerified
      && (s.tellerId ? s.tellerId === me.id : s.teller === me.name)) || null;
  })();

  const noAcc = !cur;
  const num = (v) => parseFloat(String(v).replace(/,/g, '')) || 0;
  const cashSum = cash.reduce((s, r) => s + num(r.amount), 0);
  const chqSum = chqs.reduce((s, r) => s + num(r.amount), 0);
  const trfSum = trfs.reduce((s, r) => s + num(r.amount), 0);
  const total = cashSum + chqSum + trfSum;
  const ctBlocked = !ctReady;   // ทำรายการใดไม่ได้จนกว่าหัวหน้าอนุมัติเบิกเงินและยืนยันรับเงินแล้ว
  const lines = [
    ...cash.filter(r => num(r.amount) > 0).map(r => ({ amount: num(r.amount), kind: 'เงินสด', ref: '—' })),
    ...chqs.filter(r => num(r.amount) > 0).map(r => ({ amount: num(r.amount), kind: 'เช็ค', ref: `${r.chqNo || '—'} ${r.bank}` })),
    ...trfs.filter(r => num(r.amount) > 0).map(r => ({ amount: num(r.amount), kind: mode === 'withdraw' ? 'โอนออก' : 'โอนเข้า', ref: `${r.bank} ${r.acc || '—'}${r.ref ? ' · ' + r.ref : ''}` })),
  ];
  const hasData = total > 0;
  const resetLines = () => {
    setCash([{ k: Date.now(), amount: '' }]);
    setChqs([]);
    setTrfs([]);
  };
  const bankOpts = (cur) => [...new Set([...(window.DEP_BANKS || []), ...ownerBanks.map(b => b.bank), cur].filter(Boolean))];
  const switchMode = (m) => { if (m === mode) return; if (hasData) setAskMode(m); else { setMode(m); setDone(null); } };
  const avail = cur ? cur.balance : 0;
  const over = mode === 'withdraw' && total > avail;

  const pick = (a) => {
    const ob = depMaOwnerBanks(a);
    setOwnerBanks(ob);
    setTrfs(c => c.map(r => (num(r.amount) > 0 || r.acc) && r.k !== c[0].k ? r : (num(r.amount) > 0 ? r : blankTrf(ob))));
    setCur(a); setDone(null);
    setBookBal(a ? fmt.money(a.balance, 2) : '');
  };

  const addCash = () => setCash(c => [...c, { k: Date.now(), amount: '' }]);
  const delCash = (k) => setCash(c => (c.length > 1 ? c.filter(r => r.k !== k) : c));
  const addChq = () => setChqs(c => [...c, { k: Date.now(), chqNo: '', faceDate: '', bank: window.DEP_BANKS[0], branch: '', type: window.DEP_CHQ_TYPES[0], float: '0', amount: '', late2: false }]);
  const delChq = (k) => setChqs(c => (c.length > 1 ? c.filter(r => r.k !== k) : c));
  const setChq = (k, f, v) => setChqs(c => c.map(r => (r.k === k ? { ...r, [f]: v } : r)));

  const blankChq = (k) => ({ k, chqNo: '', faceDate: '', bank: window.DEP_BANKS[0], branch: '', type: window.DEP_CHQ_TYPES[0], float: '0', amount: '', late2: false });
  const allRows = [...cash.map(r => ({ ...r, _t: 'cash' })), ...chqs.map(r => ({ ...r, _t: 'chq' })), ...trfs.map(r => ({ ...r, _t: 'trf' }))]
    .sort((a, b) => (a.seq || a.k) - (b.seq || b.k));
  const rmFrom = (r) => r._t === 'cash' ? setCash(c => c.filter(x => x.k !== r.k)) : r._t === 'chq' ? setChqs(c => c.filter(x => x.k !== r.k)) : setTrfs(c => c.filter(x => x.k !== r.k));
  const putTo = (t, base) => t === 'cash' ? setCash(c => [...c, { k: base.k, seq: base.seq, amount: base.amount }])
    : t === 'chq' ? setChqs(c => [...c, { ...blankChq(base.k), seq: base.seq, amount: base.amount }])
    : setTrfs(c => [...c, { ...blankTrf(), k: base.k, seq: base.seq, amount: base.amount }]);
  const changeKind = (r, t) => { if (t === r._t) return; rmFrom(r); putTo(t, { k: r.k, seq: r.seq || r.k, amount: r.amount }); };
  const addRow = () => { const k = Date.now(); putTo(ctReady ? 'cash' : 'trf', { k, seq: k, amount: '' }); };
  const delRow = (r) => { if (allRows.length > 1) rmFrom(r); };
  const setAmt = (r, v) => r._t === 'cash' ? setCash(c => c.map(x => x.k === r.k ? { ...x, amount: v } : x)) : r._t === 'chq' ? setChq(r.k, 'amount', v) : setTrf(r.k, 'amount', v);

  const submit = () => {
    let bal = cur.balance;
    const entries = lines.map(l => {
      bal += cfg.sign * l.amount;
      return { id: window.depTxnNextId(), date: window.DEP_OPS_TODAY, accNo: cur.accNo, member: cur.member,
        type: cfg.type, channel: `${cfg.channel} — ${l.kind}`, amount: l.amount, fee: 0, balance: bal,
        ref: l.ref, by: window.DEP_OPS_USER };
    });
    const nextAcc = accounts.map(a => (a.accNo === cur.accNo ? { ...a, balance: bal } : a));
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    const nextL = [...entries.slice().reverse(), ...ledger];
    setLedger(nextL); window.depTxnSaveLedger(nextL);
    setCur({ ...cur, balance: bal }); setBookBal(fmt.money(bal, 2));
    audit.log({
      action: 'create', module: 'เงินฝาก — ' + cfg.title, target: cur.accNo,
      summary: `${cfg.action} ${entries.length} รายการ รวม ${fmt.money(total, 2)} บาท`,
      changes: [{ field: 'ยอดคงเหลือ', before: fmt.money(cur.balance, 2), after: fmt.money(bal, 2) }],
    });
    if (ctSession && window.depCtChqAdd) {
      const t = window.depCtNow ? window.depCtNow() : { time: '' };
      window.depCtChqAdd(chqs.filter(r => num(r.amount) > 0).map(r => ({
        counter: ctSession.counter, sessionAt: ctSession.openedAt, dir: mode === 'withdraw' ? 'out' : 'in',
        accNo: cur.accNo, chqNo: r.chqNo, bank: r.bank, amount: num(r.amount), time: t.time, src: cfg.title })));
    }
    setDone({ count: entries.length, total, bal });
    resetLines();
    window.depSuccess({ title: cfg.action + 'เรียบร้อยแล้ว', lines: [['จำนวน', entries.length + ' รายการ'], ['ยอดรวม', fmt.money(total, 2) + ' บาท']],
      onPrint: () => window.depPrintSlip && window.depPrintSlip(onToast) });
  };

  return (
    <div data-screen-label="ฝาก / ถอนหลายยอด">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ฝาก / ถอนหลายยอด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{cfg.desc} · รับ/จ่ายได้ทั้งเงินสด เช็ค และโอน</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={noAcc || lines.length === 0 || over || ctBlocked} onClick={submit}
                style={mode === 'withdraw'
                  ? ((noAcc || lines.length === 0 || over || ctBlocked)
                      ? { background: '#ffa39e', borderColor: '#ffa39e', color: '#fff', opacity: 1 }
                      : { background: '#cf1322', borderColor: '#cf1322', color: '#fff' })
                  : undefined}>
          <Icon name="check" /> {cfg.action}
        </button>
      </div>

      {ctBlocked && window.DepCtGateBanner && <window.DepCtGateBanner what="การฝาก/ถอนเงิน" />}
      <div className="dep-form-cols" style={{ marginTop: 0, alignItems: 'start' }}>
      <div className="dep-form-main" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div className="search-card dat-section" style={{ marginTop: 0, minWidth: 0 }}>
        <DepSecHead icon="search" title="บัญชีเงินฝาก" sub="ค้นหาเลขที่บัญชี / เลขสมาชิก / ชื่อบัญชี" />
        <div className="dat-grid dense" style={{ paddingBottom: 0, gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
          <div className="dat-field">
            <label>เลขที่บัญชี</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 8, alignItems: 'stretch' }}>
              <DepAccountSearchField accounts={accounts} value={cur} onPick={pick} placeholder="คลิกเพื่อค้นหาเลขที่บัญชี / เลขสมาชิก / ชื่อบัญชี…" />
              <button className="btn primary" style={{ height: 'auto' }} onClick={() => setAccPick(true)}>ค้นหา</button>
              <button className="btn" style={{ height: 'auto' }} onClick={() => { setCur(null); setBookBal(''); setDone(null); }}>รีเซ็ต</button>
            </div>
          </div>
          <div className="dat-field">
            <label>ประเภทรายการ</label>
            <select className="cfg-input" value={mode} onChange={(e) => switchMode(e.target.value)}
                    style={{ color: TINT, fontWeight: 600, borderColor: `color-mix(in srgb, ${TINT} 45%, #fff)` }}>
              <option value="deposit">ฝากเงิน (+)</option>
              <option value="withdraw">ถอนเงิน (−)</option>
            </select>
          </div>
        </div>
        {accPick && <DepAccountSearchModal accounts={accounts} onPick={(a) => { pick(a); setAccPick(false); }} onClose={() => setAccPick(false)} />}
        <div className="dat-grid dense" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <DepMaRo label="สาขา" value={branch} mono />
          <DepMaRo label="ชื่อบัญชี" value={cur && cur.name} />
          <DepMaRo label="เลขสมาชิก" value={cur && cur.member} mono />
          <DepMaRo label="ประเภทบัญชี" value={cur && `${cur.typeCode} ${cur.type}`} />
          <DepMaRo label="ยอดคงเหลือ" value={cur && fmt.money(cur.balance, 2)} mono />
          <DepMaRo label="ยอดถอนได้" value={cur && fmt.money(avail, 2)} mono />
          <DepMaRo label="Int./Div. สะสม" value={cur && fmt.money(cur.ytdInterest || 0, 2)} mono />
        </div>
      </div>

          <div className="search-card dat-section" style={{ marginTop: 0 }}>
            <DepSecHead bar icon="wallet" title={mode === 'withdraw' ? 'การจ่ายเงินถอน' : 'การรับเงินฝาก'}
              right={<button className="btn primary sm" disabled={noAcc} onClick={addRow}><Icon name="plus" /> เพิ่มข้อมูล</button>} />
            <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
              <table className="tbl dma-tbl" style={{ minWidth: 780, width: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: 76 }} /><col style={{ width: '17%' }} /><col style={{ width: '12%' }} /><col style={{ width: '9%' }} />
                  <col style={{ width: '16%' }} /><col style={{ width: 124 }} /><col style={{ width: '9%' }} /><col style={{ width: 104 }} /><col style={{ width: 40 }} />
                </colgroup>
                <thead><tr>
                  <th>{mode === 'withdraw' ? 'จ่ายเป็น' : 'รับเป็น'}</th>
                  <th>เลขที่บัญชี / เช็ค</th>
                  <th>ธนาคาร</th>
                  <th>สาขา</th>
                  <th>ชื่อบัญชี / ผู้สั่งจ่าย</th>
                  <th>วันที่เช็ค / โอน</th>
                  <th>เลขอ้างอิง</th>
                  <th className="right">จำนวนเงิน</th>
                  <th className="center">ลบ</th>
                </tr></thead>
                <tbody>
                  {allRows.length === 0 && <tr><td colSpan="9" className="empty-state">ยังไม่มีรายการ — กด “เพิ่มข้อมูล”</td></tr>}
                  {allRows.map(r => {
                    const dash = <span className="muted">—</span>;
                    return (
                      <tr key={r._t + r.k}>
                        <td>
                          <select className="cfg-input" value={r._t} disabled={noAcc} onChange={(e) => changeKind(r, e.target.value)}>
                            <option value="cash" disabled={!ctReady && r._t !== 'cash'}>เงินสด</option>
                            <option value="chq">เช็ค</option>
                            <option value="trf">โอน</option>
                          </select>
                        </td>
                        <td>{r._t === 'chq'
                          ? <input className="cfg-input mono" value={r.chqNo} disabled={noAcc} placeholder="เลขที่เช็ค" onChange={(e) => setChq(r.k, 'chqNo', e.target.value)} />
                          : r._t === 'trf'
                            ? (ownerBanks.length && !r.other
                                ? <select className="cfg-input mono" value={r.acc} disabled={noAcc} onChange={(e) => pickTrfAcc(r.k, e.target.value)}>
                                    {ownerBanks.map(b => <option key={b.acc} value={b.acc}>{b.acc}</option>)}
                                    <option value="__other">บัญชีอื่น…</option>
                                  </select>
                                : <input className="cfg-input mono" value={r.acc} disabled={noAcc} placeholder="เลขที่บัญชี" onChange={(e) => setTrf(r.k, 'acc', e.target.value)} />)
                            : dash}</td>
                        <td>{r._t === 'chq'
                          ? <select className="cfg-input" value={r.bank} disabled={noAcc} onChange={(e) => setChq(r.k, 'bank', e.target.value)}>{window.DEP_BANKS.map(b => <option key={b}>{b}</option>)}</select>
                          : r._t === 'trf'
                            ? <input className="cfg-input" value={r.bank} disabled={noAcc} onChange={(e) => setTrf(r.k, 'bank', e.target.value)} />
                            : dash}</td>
                        <td>{r._t === 'chq'
                          ? <input className="cfg-input" value={r.branch} disabled={noAcc} placeholder="สาขา" onChange={(e) => setChq(r.k, 'branch', e.target.value)} />
                          : r._t === 'trf'
                            ? <input className="cfg-input" value={r.branch || ''} disabled={noAcc} placeholder="สาขา" onChange={(e) => setTrf(r.k, 'branch', e.target.value)} />
                            : dash}</td>
                        <td>{r._t === 'chq'
                          ? <input className="cfg-input" value={r.payer || ''} disabled={noAcc} placeholder="ผู้สั่งจ่าย" onChange={(e) => setChq(r.k, 'payer', e.target.value)} />
                          : r._t === 'trf'
                            ? <input className="cfg-input" value={r.name} disabled={noAcc} onChange={(e) => setTrf(r.k, 'name', e.target.value)} />
                            : dash}</td>
                        <td>{r._t === 'chq'
                          ? <window.ThaiDateField value={r.faceDate} onChange={(v) => setChq(r.k, 'faceDate', v)} />
                          : r._t === 'trf'
                            ? <window.ThaiDateField value={r.date} onChange={(v) => setTrf(r.k, 'date', v)} />
                            : dash}</td>
                        <td>{r._t === 'trf'
                          ? <input className="cfg-input mono" value={r.ref} disabled={noAcc} placeholder="เลขอ้างอิง" onChange={(e) => setTrf(r.k, 'ref', e.target.value)} />
                          : dash}</td>
                        <td><input className="cfg-input mono right" inputMode="decimal" value={r.amount} placeholder="0.00"
                                   disabled={noAcc || (r._t === 'cash' && !ctReady)}
                                   onChange={(e) => setAmt(r, e.target.value.replace(/[^0-9.]/g, ''))} /></td>
                        <td className="center">
                          <button className="btn sm tt-del-btn" title="ลบรายการ" aria-label="ลบรายการ" disabled={noAcc || allRows.length <= 1} onClick={() => delRow(r)}>
                            <Icon name="trash" size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr>
                  <td colSpan="7" className="right" style={{ fontWeight: 600 }}>รวม</td>
                  <td className="right mono"><b>{fmt.money(total, 2)}</b></td>
                  <td />
                </tr></tfoot>
              </table>
            </div>
          </div>
      </div>

      <div className="dep-form-side" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div className="search-card dat-section" style={{ marginTop: 0, minWidth: 0 }}>
        <DepSecHead icon="copy" title="การทำรายการ" sub="สมุดคู่ฝาก" />
        <div className="dat-grid dense" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          <div className="dat-field">
            <label>สมุดคู่ฝาก</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', minHeight: 32 }}>
              {[{ v: true, l: 'มีสมุด' }, { v: false, l: 'ไม่มี' }].map(o => (
                <label key={o.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 400 }}>
                  <input type="radio" checked={hasBook === o.v} disabled={noAcc} onChange={() => setHasBook(o.v)} />{o.l}
                </label>
              ))}
            </div>
          </div>
          <DatFieldLite label="ยอดในสมุด">
            <input className="cfg-input mono" style={{ textAlign: 'right' }} value={bookBal} disabled={noAcc || !hasBook}
                   placeholder="0.00" onChange={(e) => setBookBal(e.target.value)} />
          </DatFieldLite>
        </div>
      </div>
      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <DepSecHead icon="info" title="สรุปยอด" sub="ยอดรวมของทุกรายการ" />
        <div style={{ padding: 16 }}>
          <div className="dep-sum-row"><span>รวมเงินสด</span><span className="mono">{fmt.money(cashSum, 2)}</span></div>
          <div className="dep-sum-row"><span>รวมเช็ค</span><span className="mono">{fmt.money(chqSum, 2)}</span></div>
          <div className="dep-sum-row"><span>รวมโอน</span><span className="mono">{fmt.money(trfSum, 2)}</span></div>
          <div className="dep-sum-row"><span>จำนวนรายการ</span><span className="mono">{lines.length}</span></div>
          <div className="dep-sum-row total"><span>รวมยอด{mode === 'withdraw' ? 'ถอน' : 'ฝาก'}</span><span className="mono" style={{ color: TINT }}>{fmt.money(total, 2)}</span></div>
          <div className="dep-sum-row"><span>ยอดคงเหลือหลังทำรายการ</span><span className="mono">{fmt.money(avail + cfg.sign * total, 2)}</span></div>
        </div>
      </div>
          <div className="search-card dat-section" style={{ marginTop: 0 }}>
            <DepSecHead icon="edit" title="หมายเหตุ" sub="บันทึกเพิ่มเติมสำหรับรายการนี้" />
            <div style={{ padding: 16 }}>
              <textarea className="cfg-input" rows="3" value={note} disabled={noAcc} onChange={(e) => setNote(e.target.value)}
                        placeholder="บันทึกหมายเหตุการทำรายการ (ถ้ามี)" />
              <div className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.6 }}>
                รายการแต่ละรายการจะแยกเป็นรายการต่าง ๆ ไป ไม่มีการรวมรายการลงในรายการเคลื่อนไหว
              </div>
            </div>
          </div>
      </div>
      </div>

      {over && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="info" size={14} />
          <span>ยอดถอนรวม {fmt.money(total, 2)} บาท <b>เกินยอดถอนได้</b> ({fmt.money(avail, 2)} บาท)</span>
        </div>
      )}
      {done && (
        <div className="dat-ok" style={{ marginTop: 12 }}>
          <Icon name="check" size={14} />
          <span>{cfg.action}เรียบร้อย {done.count} รายการ รวม {fmt.money(done.total, 2)} บาท · ยอดคงเหลือใหม่ {fmt.money(done.bal, 2)} บาท</span>
        </div>
      )}
      {askMode && window.DepConfirmModal && (
        <window.DepConfirmModal tone="danger" title={'เปลี่ยนเป็นรายการ' + (askMode === 'withdraw' ? 'ถอน' : 'ฝาก')}
          lines={[['รายการที่กรอกไว้', lines.length + ' รายการ'], ['ยอดรวม', fmt.money(total, 2) + ' บาท'], ['ผลกระทบ', 'รายการเงินสด เช็ค และโอนที่กรอกไว้จะถูกล้าง']]}
          okLabel="ล้างและเปลี่ยนประเภท" onOk={() => { resetLines(); setMode(askMode); setDone(null); setAskMode(null); }}
          onClose={() => setAskMode(null)} />
      )}
    </div>
  );
}

Object.assign(window, { DepMultiAmountPage });
