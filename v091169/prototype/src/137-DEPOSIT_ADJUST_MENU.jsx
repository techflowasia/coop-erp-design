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

const SEARCH_MODES = [
  { id: 'account', label: 'เลขที่บัญชี',     placeholder: 'เช่น 001-2-58241-0',  example: '001-2-58241-0' },
  { id: 'member',  label: 'เลขสมาชิก',      placeholder: 'เช่น M-058241',        example: 'M-058241' },
  { id: 'slip',    label: 'เลขที่ใบรายการ',  placeholder: 'เช่น DP6906-044120',   example: 'DP6906-044120' },
];

function formatWorkDate(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear() + 543}`;
}

function CancelTxnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  // ข้อมูลตัวอย่างเพิ่มเติม — รายการวันทำรายการหลายรายการ + ตัวอย่างสถานะ "ยกเลิกแล้ว"
  const [records, setRecords] = useState(() => {
    const wd = String(window.DEPOSIT_WORKING_DATE).slice(0, 10);
    const [y, m] = wd.split('-');
    const yy = String(Number(y) + 543).slice(2) + m;
    const staff = ['สุนิสา ใจเย็น', 'ธนพล ศรีวงศ์', 'จันทร์เพ็ญ มาลี'];
    const samples = [
      { code: '01', desc: 'ฝากเงินสด ผ่านเคาน์เตอร์ สาขาสำนักงานใหญ่', amount: 2500 },
      { code: '02', desc: 'ถอนเงินสด ผ่านเคาน์เตอร์ สาขาสำนักงานใหญ่', amount: 1500 },
      { code: '01', desc: 'ฝากเงินสด ผ่านเคาน์เตอร์ (แก้ไขยอดผิด)',      amount: 10000, cancelled: true, reason: 'บันทึกจำนวนเงินผิด' },
      { code: '03', desc: 'โอนเงินเข้าจากบัญชีภายในสหกรณ์',            amount: 4200 },
      { code: '02', desc: 'ถอนเงินสด ผ่านเคาน์เตอร์ (ลูกค้ายกเลิก)',    amount: 3000, cancelled: true, reason: 'สมาชิกขอยกเลิกรายการ' },
    ];
    return window.DEPOSIT_TX_RECORDS.map((r, ri) => {
      const base = r.txns.map(t => ({ ...t }));
      const have = new Set(base.map(t => t.slip));
      const add = samples.slice(0, ri % 2 === 0 ? 5 : 4).map((s, i) => {
        const pre = s.code === '02' ? 'WD' : s.code === '03' ? 'TF' : 'DP';
        const slip = pre + yy + '-' + String(45100 + ri * 20 + i).padStart(6, '0');
        return {
          slip, code: s.code, desc: s.desc, amount: s.amount, by: staff[(ri + i) % staff.length], date: wd,
          cancellable: true, cancelled: !!s.cancelled,
          ...(s.cancelled ? { cancelInfo: { by: 'มนตรี ศรีสุข', reason: s.reason, ts: wd + 'T10:1' + i + ':00' } } : {}),
        };
      }).filter(t => !have.has(t.slip));
      return { ...r, txns: [...add, ...base] };
    });
  });
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

  const workDate = window.DEPOSIT_WORKING_DATE;
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
  const modeDef  = { label: 'เลขที่บัญชี / เลขสมาชิก / เลขที่ใบรายการ', placeholder: 'ค้นหาเลขที่บัญชี / เลขสมาชิก / เลขที่ใบรายการ', example: SEARCH_MODES[0].example };
  const norm = (s) => String(s).toLowerCase().replace(/[\s-]/g, '');

  const runSearch = (q = query, md = mode) => {
    setSearched(true);
    setSelected([]);
    const nq = norm(q.trim());
    if (!nq) { setResults([]); setActive(null); setHL(null); return; }
    let hl = null;
    const matched = records.filter(r => {
      if (norm(r.accNo).includes(nq) || norm(r.memberCode).includes(nq)) return true;
      const tx = r.txns.find(t => norm(t.slip).includes(nq));
      if (tx && !hl) hl = tx.slip;
      return !!tx;
    });
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

  const ctCashSel = acc ? acc.txns.filter(t => selected.includes(t.slip))
    .some(t => /เงินสด/.test(((window.DEPOSIT_TX_CODES || {})[t.code] || {}).label || '')) : false;
  const ctBlocked = !(window.depCtCashReady && window.depCtCashReady());
  const toggleSel = (slip) => setSelected(s => s.includes(slip) ? s.filter(x => x !== slip) : [...s, slip]);
  const selectableSlips = dayTxns(acc).filter(t => !t.cancelled).map(t => t.slip);
  const allSelected = selectableSlips.length > 0 && selectableSlips.every(s => selected.includes(s));
  const toggleAll = () => setSelected(allSelected ? [] : [...selectableSlips]);

  const selectedTxns = acc ? acc.txns.filter(t => selected.includes(t.slip)) : [];

  // ── ดำเนินการยกเลิกหลังยืนยันรหัสผู้มีสิทธิ์ ──────────────────────
  const performCancel = ({ reason }) => {
    const authorizer = { name: me.name, role: me.role };
    const CODES = window.DEPOSIT_TX_CODES;
    setRecords(prev => prev.map(r => {
      if (r.accNo !== activeAccNo) return r;
      let bal = r.balance, wd = r.withdrawable;
      const txns = r.txns.map(t => {
        if (!selected.includes(t.slip) || t.cancelled) return t;
        const flow = (CODES[t.code] || { flow: 0 }).flow;
        bal -= flow * t.amount;            // กลับรายการ
        wd  -= flow * t.amount;
        return { ...t, cancelled: true,
                 cancelInfo: { by: authorizer.name, reason, ts: new Date().toISOString().slice(0, 19) } };
      });
      return { ...r, txns, balance: bal, withdrawable: Math.max(0, wd) };
    }));

    selectedTxns.forEach(t => {
      audit.log({
        action: 'delete', module: 'เงินฝาก',
        target: `${acc.memberCode} · ${acc.memberName}`,
        summary: `ยกเลิกรายการเงินฝาก ${t.slip} — ${(window.DEPOSIT_TX_CODES[t.code] || {}).label || ''}`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่ใบรายการ', before: t.slip, after: 'ยกเลิกแล้ว' },
          { field: 'บัญชี', before: acc.accNo, after: `${acc.accType}` },
          { field: 'จำนวนเงิน', before: fmt.money(t.amount, 2), after: '— (กลับรายการ)' },
          { field: 'เหตุผล', before: '—', after: reason },
          ...(String(t.date).slice(0, 10) !== String(window.DEPOSIT_WORKING_DATE).slice(0, 10)
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
          {SEARCH_MODES.map((m, i) => (
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
                    const c = window.DEPOSIT_TX_CODES[t.code] || { label: t.code, pill: 'neutral', flow: 1 };
                    const sel = selected.includes(t.slip);
                    const canPick = !t.cancelled;
                    return (
                      <tr key={t.slip}
                          className={(t.cancelled ? 'cancelled ' : '') + (sel ? 'sel' : '')}>
                        <td className="center">
                          {canPick ? (
                            <input type="checkbox" className="ct-check" checked={sel}
                                   onChange={() => toggleSel(t.slip)}
                                   aria-label={`เลือก ${t.slip}`} />
                          ) : (
                            <span className="ct-lockcell" title="ยกเลิกแล้ว">
                              <Icon name="lock" size={12} />
                            </span>
                          )}
                        </td>
                        <td className="center muted mono">{idx + 1}</td>
                        <td className="mono">{t.slip}</td>
                        <td>{t.desc}</td>
                        <td className="num" style={{ fontWeight: 600,
                              color: t.cancelled ? 'var(--text-faint)' : (c.flow < 0 ? 'var(--danger)' : 'var(--success)') }}>
                          {c.flow < 0 ? '−' : '+'} {fmt.money(t.amount, 2)}
                        </td>
                        <td>{t.by}</td>
                        <td className="center mono">{fmt.date(t.date)}</td>
                        <td className="center">
                          {t.cancelled
                            ? <span className="pill bad">ยกเลิกแล้ว</span>
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
          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>
              {selected.length > 0
                ? <>เลือก <b style={{ color: 'var(--text)' }}>{selected.length}</b> รายการ · รวม{' '}
                    <b className="mono" style={{ color: 'var(--text)' }}>
                      ฿ {fmt.money(selectedTxns.reduce((a, t) => a + t.amount, 0), 2)}
                    </b></>
                : 'ยังไม่ได้เลือกรายการที่จะยกเลิก'}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn danger ct-danger-solid" disabled={selected.length === 0 || ctBlocked} onClick={() => setConfirm(true)}>
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
              const c = window.DEPOSIT_TX_CODES[t.code] || { label: t.code, flow: 1 };
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
