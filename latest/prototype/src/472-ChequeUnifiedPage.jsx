// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน › ออกเช็ค — หน้ารวมทุกรูปแบบ
//  แหล่งรายการ (ทุกระบบ / เงินกู้ / เงินฝาก / CBT / ค่าใช้จ่าย)
//  × วิธีออกเช็ค (1 Slip : 1 เช็ค · รวมหลาย Slip เป็น 1 เช็ค · แตก 1 Slip เป็นหลายเช็ค)
//  เมนูเดิมทั้ง 6 เมนูยังคงอยู่
// ════════════════════════════════════════════════════════════════════
const CU_SOURCES = [
  { v: 'all',     l: 'ทุกระบบ' },
  { v: 'loan',    l: 'เงินกู้' },
  { v: 'deposit', l: 'เงินฝาก' },
  { v: 'cbt',     l: 'CBT' },
  { v: 'expense', l: 'ค่าใช้จ่าย' },
];
const CU_SYS_LABEL = { loan: 'เงินกู้', deposit: 'เงินฝาก', cbt: 'CBT', expense: 'ค่าใช้จ่าย' };
const CU_SYS_PILL  = { loan: 'info', deposit: 'ok', cbt: 'warn', expense: 'neutral' };
const CU_MODES = [
  { v: 'one',   l: '1 Slip : 1 เช็ค',            d: 'เลือกได้หลาย Slip — ออกเช็คแยกใบละ Slip' },
  { v: 'merge', l: 'รวมหลาย Slip เป็น 1 เช็ค',   d: 'เลือกหลาย Slip จากระบบเดียวกัน — รวมยอดเป็นเช็คใบเดียว' },
  { v: 'split', l: 'แตก 1 Slip เป็นหลายเช็ค',    d: 'เลือก 1 Slip — แบ่งยอดออกเป็นเช็คหลายใบตามผู้รับเงิน' },
];
const CU_TYPE_OF = { loan: '01', cbt: '01', deposit: '00', expense: '04' };

function cuRows(src) {
  const tag = (sys, list) => list.map(r => ({ ...r, sys, key: sys + ':' + r.ref }));
  const cbt = ciCbtRows().map(r => ({ ref: 'CBT-' + r.contractNo, contractNo: r.contractNo, memberCode: r.memberCode,
    name: r.name, date: r.date, detail: 'จ่ายเงินกู้ฉุกเฉินแบบกลุ่ม (CBT)', amount: r.amount }));
  const by = {
    loan: tag('loan', ciSourceRows('loan')),
    deposit: tag('deposit', ciSourceRows('deposit')),
    cbt: tag('cbt', cbt),
    expense: tag('expense', ciSourceRows('expense')),
  };
  return src === 'all' ? [...by.loan, ...by.deposit, ...by.cbt, ...by.expense] : (by[src] || []);
}

// วันที่เริ่มต้น = วันที่ล่าสุดของรายการรอออกเช็ค (กันตารางว่างเมื่อวันระบบอยู่ก่อนข้อมูล)
function cuDefaultDate() {
  const ds = cuRows('all').map(r => String(r.date || '').slice(0, 10)).filter(Boolean).sort();
  const last = ds[ds.length - 1];
  const t = ciToday();
  return last && last > t ? last : t;
}
// จำเล่มเช็คล่าสุดที่ใช้ (ต่อเครื่อง/เบราว์เซอร์) — เปิดหน้าใหม่ไม่ต้องเลือกเล่มซ้ำ
const CU_BOOK_KEY = 'cu.lastChequeBook';
function cuSavedBook() {
  let id = '';
  try { id = window.localStorage.getItem(CU_BOOK_KEY) || ''; } catch (e) {}
  const b = id && ciBooks().find(x => x.id === id);
  return b && ciFreeLeaves(b.id).length ? b : null; // เล่มถูกลบ/ใช้หมดแล้ว → กลับไปค่าเริ่มต้น
}
function cuSaveBook(id) {
  try { id ? window.localStorage.setItem(CU_BOOK_KEY, id) : window.localStorage.removeItem(CU_BOOK_KEY); } catch (e) {}
}
// เลขที่เช็คเริ่มต้น = ใบว่างใบแรกของเล่ม (ขึ้นให้ทันที ไม่ต้องเลือกเอง)
function cuFirstLeaf(bookId) {
  const l = bookId ? ciFreeLeaves(bookId)[0] : null;
  return l ? l.no : '';
}
function cuInitForm() {
  const f = ciNewForm('deposit');
  const b = cuSavedBook();
  const next = b ? { ...f, accountId: b.bankId, bookId: b.id } : f;
  return { ...next, chequeNo: cuFirstLeaf(next.bookId) };
}
function ChequeUnifiedPage({ onToast, preset }) {
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'ออกเช็ค' }, { label: 'ออกเช็ค (รวมทุกรูปแบบ)', current: true }], []);

  const [src, setSrc]   = ciUseState((preset && preset.src) || 'all');
  const [mode, setMode] = ciUseState((preset && preset.mode) || 'one');
  const [f, setF] = ciUseState(cuInitForm);
  const [bookRemembered] = ciUseState(() => !!cuSavedBook());
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [qD, setQD] = ciUseState('');
  const [q, setQ]   = ciUseState('');
  const [pullDate, setPullDate] = ciUseState(cuDefaultDate);
  const [loanGroup, setLoanGroup] = ciUseState('all');
  const [withDividend, setWithDividend] = ciUseState(false);
  const [picked, setPicked] = ciUseState(() => new Set());
  const [lines, setLines] = ciUseState([{ id: 1, payee: '', amount: '' }, { id: 2, payee: '', amount: '' }]);
  const books = ciBooks().filter(b => !f.accountId || b.bankId === f.accountId);
  const freeCount = (id) => ciFreeLeaves(id).length;
  const pickAccount = (id) => {
    const first = ciBooks().find(b => b.bankId === id);
    setF(p => ({ ...p, accountId: id, bookId: first ? first.id : '', chequeNo: cuFirstLeaf(first && first.id) }));
    cuSaveBook(first ? first.id : '');
  };
  const pickBook = (id) => { setF(p => ({ ...p, bookId: id, chequeNo: cuFirstLeaf(id) })); cuSaveBook(id); };
  const nextId = React.useRef(3);

  const all = ciUseMemo(() => cuRows(src), [src]);
  const kw = q.trim().toLowerCase();
  // รายการรอออกเช็ค ณ วันที่ที่เลือก (+ กลุ่มเงินกู้ เมื่อเป็น CBT)
  const byDate = all.filter(r => !pullDate || !r.date || String(r.date).slice(0, 10) <= pullDate)
    .filter(r => src !== 'cbt' || loanGroup === 'all' || !r.group || r.group === loanGroup);
  const rows = kw ? byDate.filter(r => [r.ref, r.contractNo, r.memberCode, r.name, r.detail].some(x => String(x || '').toLowerCase().includes(kw))) : byDate;

  // เปลี่ยนแหล่ง/โหมด → ล้างการเลือก
  // เปลี่ยนแหล่ง/วันที่/กลุ่ม → ล้างการเลือก (เปลี่ยนวิธีออกเช็คไม่ล้าง — ดู changeMode)
  React.useEffect(() => { setPicked(new Set()); }, [src, pullDate, loanGroup]);

  const selRows = all.filter(r => picked.has(r.key));
  const selSys = selRows.length ? selRows[0].sys : null;
  // ประเภทเช็คตามระบบของรายการที่เลือก
  React.useEffect(() => { if (selSys && CU_TYPE_OF[selSys]) set('type', CU_TYPE_OF[selSys]); }, [selSys]);
  // รวมหลาย Slip → ชื่อผู้รับเริ่มต้นจากรายการแรก
  React.useEffect(() => { if (mode === 'merge' && selRows.length && !f.payee) set('payee', selRows[0].name); }, [mode, selRows.length]);

  // เปลี่ยนวิธีออกเช็คโดยคงรายการที่เลือกไว้ให้มากที่สุด
  //  · → รวม: คงเฉพาะรายการระบบเดียวกับรายการแรก  · → แตก: คงรายการแรกรายการเดียว  · → 1:1: คงทั้งหมด
  const changeMode = (v) => {
    if (v === mode) return;
    const first = selRows[0];
    if (first && v === 'merge') setPicked(new Set(selRows.filter(r => r.sys === first.sys).map(r => r.key)));
    else if (first && v === 'split') setPicked(new Set([first.key]));
    setMode(v);
  };
  const blocked = (r) => mode === 'merge' && selSys && r.sys !== selSys;
  const toggle = (r) => {
    if (blocked(r)) return;
    setPicked(s => {
      if (mode === 'split') return s.has(r.key) ? new Set() : new Set([r.key]);
      const n = new Set(s); n.has(r.key) ? n.delete(r.key) : n.add(r.key); return n;
    });
  };
  const selectable = rows.filter(r => !blocked(r));
  const allChecked = mode !== 'split' && selectable.length > 0 && selectable.every(r => picked.has(r.key));
  const toggleAll = () => {
    if (allChecked) return setPicked(new Set());
    const base = mode === 'merge' ? (selSys || (selectable[0] && selectable[0].sys)) : null;
    setPicked(new Set(selectable.filter(r => !base || r.sys === base).map(r => r.key)));
  };

  // เลขเช็ค: เริ่มจากใบที่เลือก แล้วต่อเนื่องตามใบว่างในเล่ม
  const leaves = ciFreeLeaves(f.bookId).map(l => l.no);
  // กันกรณีเลขเช็คว่าง/ไม่อยู่ในเล่ม → เติมใบว่างใบแรกให้อัตโนมัติ
  React.useEffect(() => {
    if (f.bookId && (!f.chequeNo || !leaves.includes(f.chequeNo))) {
      const no = cuFirstLeaf(f.bookId);
      if (no !== f.chequeNo) set('chequeNo', no);
    }
  }, [f.bookId, f.chequeNo]);
  const seqFrom = (n) => { const i = leaves.indexOf(f.chequeNo); return i < 0 ? [] : leaves.slice(i, i + n); };

  const selTotal = selRows.reduce((a, r) => a + r.amount, 0);
  const lineTotal = lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const validLines = lines.filter(l => l.payee.trim() && Number(l.amount) > 0);
  const splitSrc = mode === 'split' ? selRows[0] : null;
  const splitDiff = splitSrc ? lineTotal - splitSrc.amount : 0;

  const plan = mode === 'one'
    ? selRows.map((r, i) => ({ no: seqFrom(selRows.length)[i], payee: r.name, amount: r.amount, refs: [r.ref] }))
    : mode === 'merge'
      ? (selRows.length ? [{ no: f.chequeNo, payee: f.payee, amount: selTotal, refs: selRows.map(r => r.ref) }] : [])
      : validLines.map((l, i) => ({ no: seqFrom(validLines.length)[i], payee: l.payee, amount: Number(l.amount), refs: splitSrc ? [splitSrc.ref] : [] }));
  const needLeaves = plan.length;
  const enoughLeaves = needLeaves > 0 && plan.every(p => p.no);

  let reason = '';
  if (!selRows.length) reason = mode === 'split' ? 'เลือก Slip ต้นทาง 1 รายการ' : 'เลือก Slip อย่างน้อย 1 รายการ';
  else if (!f.chequeNo) reason = 'เลือกเลขที่เช็คเริ่มต้น';
  else if (mode === 'merge' && !f.payee.trim()) reason = 'ระบุชื่อสั่งจ่าย';
  else if (mode === 'split' && !validLines.length) reason = 'ระบุผู้รับเงินและจำนวนเงินอย่างน้อย 1 แถว';
  else if (mode === 'split' && Math.abs(splitDiff) > 0.005) reason = 'ยอดแตกเช็คต้องเท่ากับยอด Slip';
  else if (!enoughLeaves) reason = 'ใบเช็คว่างในเล่มไม่พอ (ต้องใช้ ' + needLeaves + ' ใบ)';
  const canIssue = !reason;

  const issue = () => {
    const sum = plan.reduce((a, p) => a + p.amount, 0);
    audit.log && audit.log({ action: 'create', module: 'การเงิน — ออกเช็ค (รวมทุกรูปแบบ)',
      target: plan.map(p => p.no).join(', '),
      summary: `${CU_MODES.find(m => m.v === mode).l}${src === 'cbt' ? ' · CBT ' + (loanGroup === 'all' ? 'ทุกกลุ่ม' : loanGroup) + (withDividend ? ' · รวมปันผล/เฉลี่ยคืน' : '') : ''} · ${plan.length} ใบ · รวม ${fmt.money(sum, 2)} บาท · อ้างอิง ${[...new Set(plan.flatMap(p => p.refs))].join(', ')}` });
    window.depSuccess({ title: 'ออกเช็คเรียบร้อยแล้ว', lines: [['จำนวนเช็ค', plan.length + ' ใบ'], ['เลขที่เช็ค', plan.map(p => p.no).join(', ')], ['ยอดรวม', fmt.money(sum, 2) + ' บาท']],
      onPrint: () => onToast && onToast('ส่งพิมพ์เช็คแล้ว'), printLabel: 'พิมพ์เช็ค' });
    // เลื่อนเลขเช็คเริ่มต้นไปใบว่างถัดจากใบสุดท้ายที่เพิ่งออก
    const lastNo = plan.length ? plan[plan.length - 1].no : '';
    const nextNo = leaves[leaves.indexOf(lastNo) + 1] || '';
    if (nextNo) set('chequeNo', nextNo);
    setPicked(new Set()); setLines([{ id: nextId.current++, payee: '', amount: '' }, { id: nextId.current++, payee: '', amount: '' }]);
  };

  const addLine = () => setLines(ls => [...ls, { id: nextId.current++, payee: '', amount: '' }]);
  const delLine = (id) => setLines(ls => ls.filter(l => l.id !== id));
  const setLine = (id, k, v) => setLines(ls => ls.map(l => l.id === id ? { ...l, [k]: v } : l));
  const modeDef = CU_MODES.find(m => m.v === mode);

  return (
    <div data-screen-label="ออกเช็ค (รวมทุกรูปแบบ)" className="dep-open cu-page">
      <div className="page-actions dep-open-sticky">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ออกเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือก Slip ที่รอออกเช็ค แล้วตั้งค่าเช็คและตรวจสรุปก่อนออก</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" data-keep-top="" disabled={!canIssue} title={reason || undefined} onClick={issue}>
          <Icon name="print" /> ออกเช็ค &amp; พิมพ์
        </button>
      </div>

      {/* ── 1. รายการรอออกเช็ค (อยู่บนสุด — เห็นรายการทันทีโดยไม่ต้องเลื่อน) ── */}
      <div className="search-card">
        <DepSecHead icon="search" title="รายการรอออกเช็ค" sub="กรองรายการ เลือกวิธีออกเช็ค แล้วติ๊ก Slip ที่จะออกเช็ค" style={{ margin: '-16px -16px 16px', background: 'transparent' }} />

        {/* แถว 1 — กรองรายการ (จากกว้างไปแคบ) · ค้นหาเมื่อกดปุ่ม "ค้นหา" หรือ Enter */}
        <div className="cu-search" style={{ marginTop: 0, display: 'grid', gridTemplateColumns: '160px 180px minmax(0, 1fr) auto auto', gap: 8, alignItems: 'end' }}>
          <div className="cu-fld">
            <span className="cu-lbl">แหล่งรายการ</span>
            <select className="cfg-input" value={src} onChange={(e) => setSrc(e.target.value)}>
              {CU_SOURCES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div className="cu-fld">
            <span className="cu-lbl">รายการรอออกเช็ค ณ วันที่</span>
            <window.ThaiDateField value={pullDate} onChange={(v) => setPullDate(v || cuDefaultDate())} />
          </div>
          <div className="cu-fld" style={{ minWidth: 0 }}>
            <span className="cu-lbl">ค้นหา</span>
            <div className="dep-input" style={{ width: '100%', minWidth: 0, height: 32, boxSizing: 'border-box', background: '#fff' }}>
              <Icon name="search" size={14} />
              <input value={qD} aria-label="ค้นหา" onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setQ(qD); }}
                     placeholder="เลขที่อ้างอิง / เลขที่สัญญา / เลขสมาชิก / ชื่อ" />
            </div>
          </div>
          <button className="btn primary" style={{ height: 32 }} onClick={() => setQ(qD)}>ค้นหา</button>
          <button className="btn" style={{ height: 32 }} onClick={() => { setSrc('all'); setQD(''); setQ(''); setPullDate(cuDefaultDate()); setLoanGroup('all'); setWithDividend(false); }}>รีเซ็ต</button>
        </div>
        {src === 'cbt' && (
          <div style={{ display: 'grid', gridTemplateColumns: '180px auto auto', gap: 8, alignItems: 'end', marginTop: 10, justifyContent: 'start' }}>
            <div className="cu-fld">
              <span className="cu-lbl">กลุ่มเงินกู้</span>
              <select className="cfg-input" value={loanGroup} onChange={(e) => setLoanGroup(e.target.value)}>
                <option value="all">ทุกกลุ่มเงินกู้</option>
                <option>เงินกู้ฉุกเฉิน</option><option>เงินกู้สามัญ</option><option>เงินกู้พิเศษ</option>
              </select>
            </div>
            <label className="dpc-check" style={{ height: 32, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={withDividend} onChange={(e) => setWithDividend(e.target.checked)} /> จ่ายปันผลและเฉลี่ยคืน
            </label>
            <button className="btn" style={{ height: 32 }} onClick={() => onToast && onToast('เชื่อมต่อ CBT — ดึงยอดจากธนาคารแล้ว')}>
              <Icon name="download" /> ดึงยอดจาก CBT
            </button>
          </div>
        )}

        {/* แถว 2 — แถบเครื่องมือเหนือตาราง: วิธีออกเช็ค + จำนวน/ยอดที่เลือก */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <span className="cu-lbl" style={{ margin: 0 }}>วิธีออกเช็ค</span>
            <div className="cu-modes" role="radiogroup" aria-label="วิธีออกเช็ค">
              {CU_MODES.map(m => (
                <button key={m.v} type="button" role="radio" aria-checked={mode === m.v}
                        className={'cu-mode' + (mode === m.v ? ' active' : '')} onClick={() => changeMode(m.v)}>{m.l}</button>
              ))}
            </div>
          </div>
          <span className="spacer" style={{ flex: 1 }} />
          <div style={{ fontSize: 13, whiteSpace: 'nowrap' }} aria-live="polite">
            {selRows.length
              ? <>เลือกแล้ว <b>{selRows.length}</b> รายการ · รวม <b className="mono">{fmt.money(selTotal, 2)}</b> บาท</>
              : <span className="muted">ยังไม่ได้เลือกรายการ</span>}
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="info" size={12} /> {modeDef.d}
          {mode === 'merge' && selSys && <> · เลือกได้เฉพาะรายการ<b style={{ color: 'var(--text)' }}>{CU_SYS_LABEL[selSys]}</b></>}
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead><tr>
              <th className="center" style={{ width: 44 }}>
                {mode !== 'split' && <input type="checkbox" checked={allChecked} disabled={!selectable.length} onChange={toggleAll} aria-label="เลือกทั้งหมด" />}
              </th>
              <th style={{ width: 96 }}>ระบบ</th>
              <th style={{ width: 140 }}>เลขที่อ้างอิง</th>
              <th style={{ width: 130 }}>เลขที่สัญญา</th>
              <th style={{ width: 110 }}>เลขสมาชิก</th>
              <th className="center" style={{ width: 110 }}>วันที่</th>
              <th>สั่งจ่าย / รายละเอียด</th>
              <th className="right" style={{ width: 140 }}>จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 30 }}>ไม่พบข้อมูล</td></tr>}
              {rows.map(r => {
                const on = picked.has(r.key), off = blocked(r);
                return (
                  <tr key={r.key} className={(on ? 'selected' : '') + (off ? ' dat-off' : '')}
                      style={{ cursor: off ? 'not-allowed' : 'pointer' }} onClick={() => toggle(r)}
                      title={off ? 'รวมเช็คได้เฉพาะรายการจากระบบเดียวกัน' : undefined}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {mode === 'split'
                        ? <input type="radio" name="cu-src" checked={on} disabled={off} onChange={() => toggle(r)} />
                        : <input type="checkbox" checked={on} disabled={off} onChange={() => toggle(r)} />}
                    </td>
                    <td><span className={'pill ' + CU_SYS_PILL[r.sys]}>{CU_SYS_LABEL[r.sys]}</span></td>
                    <td className="mono">{r.ref}</td>
                    <td className="mono">{r.contractNo || '—'}</td>
                    <td className="mono">{r.memberCode}</td>
                    <td className="center mono">{fmt.date(r.date)}</td>
                    <td><div className="lt-row-name">{r.name}</div><div className="lt-row-note muted">{r.detail}</div></td>
                    <td className="right mono">{fmt.money(r.amount, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      {/* ── 2. ตั้งค่าเช็ค (อยู่ถัดจากรายการ ติดกับสรุปเช็คที่จะออก) ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <DepSecHead icon="cog" title="ตั้งค่าเช็ค" sub="บัญชี เล่มเช็ค และเลขที่เช็คที่ใช้ออก" style={{ margin: '-16px -16px 16px', background: 'transparent' }} />

        {/* แถว 1 — เงินออกจากไหน / ใช้เช็คใบไหน */}
        <div className="cu-setup">
          <div className="cu-fld">
            <span className="cu-lbl">บัญชีที่ตัดจาก <span className="cfg-required">*</span></span>
            <select className="cfg-input" value={f.accountId} onChange={(e) => pickAccount(e.target.value)}>
              {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.bank} · {b.accountNo}</option>)}
            </select>
          </div>
          <div className="cu-fld">
            <span className="cu-lbl">เล่มที่เช็ค <span className="cfg-required">*</span>
              <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }} title="ระบบจำเล่มเช็คที่เลือกล่าสุด เปิดหน้านี้ครั้งต่อไปจะเลือกเล่มนี้ให้อัตโนมัติ">
                · {bookRemembered ? 'ใช้เล่มล่าสุด' : 'ระบบจะจำเล่มที่เลือก'}
              </span>
            </span>
            <select className="cfg-input mono" value={f.bookId} disabled={!books.length}
                    onChange={(e) => pickBook(e.target.value)}>
              {!books.length && <option value="">— บัญชีนี้ไม่มีเล่มเช็ค —</option>}
              {books.map(b => <option key={b.id} value={b.id}>{b.id} · {b.bank} (ว่าง {freeCount(b.id)} ใบ)</option>)}
            </select>
          </div>
          <div className="cu-fld">
            <span className="cu-lbl">เลขที่เช็คเริ่มต้น <span className="cfg-required">*</span></span>
            <select className="cfg-input mono" value={f.chequeNo} disabled={!f.bookId} onChange={(e) => set('chequeNo', e.target.value)}>
              {!leaves.length && <option value="">— เล่มนี้ไม่มีใบว่าง —</option>}
              {leaves.map(no => <option key={no} value={no}>{no}</option>)}
            </select>
          </div>
          <div className="cu-fld">
            <span className="cu-lbl">วันที่หน้าเช็ค <span className="cfg-required">*</span></span>
            <window.ThaiDateField value={f.faceDate} onChange={(v) => set('faceDate', v)} />
          </div>
        </div>

        {/* แถว 2 — คุณสมบัติเช็ค + ค่าระบบ */}
        <div className="cu-setup" style={{ marginTop: 12 }}>
          <div className="cu-fld">
            <span className="cu-lbl">ประเภทเช็ค</span>
            <select className="cfg-input" value={f.type} onChange={(e) => set('type', e.target.value)}>
              {CI_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </div>
          <div className="cu-fld">
            <span className="cu-lbl">สถานะเช็ค</span>
            <select className="cfg-input" value={f.status} onChange={(e) => set('status', e.target.value)}>
              {CI_STATUSES.filter(s => s.code !== 'void').map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </div>
          <div className="cu-fld">
            <span className="cu-lbl">รหัสบัญชี CR</span>
            <select className="cfg-input" value={f.cr} onChange={(e) => set('cr', e.target.value)}>
              <option value="">— ไม่ระบุ —</option>
              {CI_CR.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="cu-pair">
            <div className="cu-fld">
              <span className="cu-lbl">เครื่องพิมพ์</span>
              <select className="cfg-input" value={f.printer} onChange={(e) => set('printer', e.target.value)}>
                {CI_PRINTERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="cu-fld">
              <span className="cu-lbl">ขนาดเช็ค</span>
              <select className="cfg-input" value={f.size} onChange={(e) => set('size', e.target.value)}>
                {CI_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {mode === 'merge' && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <DepSecHead icon="user" title="สั่งจ่าย" style={{ margin: '-16px -16px 16px', background: 'transparent' }} />
          <div className="cu-fld">
            <span className="cu-lbl">ชื่อผู้รับเงินบนหน้าเช็ค <span className="cfg-required">*</span></span>
            <input className="cfg-input" value={f.payee} placeholder="ชื่อผู้รับเงินบนหน้าเช็ค" onChange={(e) => set('payee', e.target.value)} />
          </div>
        </div>
      )}

      {mode === 'split' && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <DepSecHead icon="members" title="แตกเช็คตามผู้รับเงิน" style={{ margin: '-16px -16px 16px', background: 'transparent' }}
            right={<button className="btn sm" onClick={addLine}><Icon name="plus" size={12} /> เพิ่มแถว</button>} />
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead><tr>
                <th className="center" style={{ width: 60 }}>ลำดับ</th>
                <th>สั่งจ่าย</th>
                <th className="right" style={{ width: 170 }}>จำนวนเงิน</th>
                <th className="center" style={{ width: 70 }}>จัดการ</th>
              </tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={l.id}>
                    <td className="center mono">{i + 1}</td>
                    <td><input className="cfg-input" value={l.payee} placeholder="ชื่อผู้รับเงิน" onChange={(e) => setLine(l.id, 'payee', e.target.value)} /></td>
                    <td><IvMoneyInput value={l.amount} onChange={(v) => setLine(l.id, 'amount', v)} /></td>
                    <td className="center">
                      <button className="btn sm tt-del-btn" title="ลบแถว" aria-label="ลบแถว" disabled={lines.length <= 1} onClick={() => delLine(l.id)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td colSpan="2" className="right" style={{ fontWeight: 600 }}>รวมแตกเช็ค</td>
                <td className="right mono"><b>{fmt.money(lineTotal, 2)}</b></td><td />
              </tr></tfoot>
            </table>
          </div></div>
        </div>
      )}

      {/* ── สรุปเช็คที่จะออก ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <DepSecHead icon="check" title="สรุปเช็คที่จะออก" style={{ margin: '-16px -16px 16px', background: 'transparent' }} />
        {splitSrc && Math.abs(splitDiff) > 0.005 && validLines.length > 0 && (
          <div className="sr-error" style={{ marginBottom: 12 }}>
            <Icon name="info" size={14} /> ยอดแตกเช็ครวม {fmt.money(lineTotal, 2)} {splitDiff > 0 ? 'เกิน' : 'ขาด'}ยอด Slip {splitSrc.ref} ({fmt.money(splitSrc.amount, 2)}) อยู่ {fmt.money(Math.abs(splitDiff), 2)} บาท
          </div>
        )}
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ใบที่</th>
              <th style={{ width: 130 }}>เลขที่เช็ค</th>
              <th>สั่งจ่าย</th>
              <th style={{ width: 220 }}>อ้างอิง Slip</th>
              <th className="right" style={{ width: 150 }}>จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              {plan.length === 0 && <tr><td colSpan="5" className="center muted" style={{ padding: 24 }}>ยังไม่มีเช็คที่จะออก — {reason || 'เลือก Slip'}</td></tr>}
              {plan.map((p, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{p.no || <span style={{ color: 'var(--danger)' }}>ไม่มีใบว่าง</span>}</td>
                  <td>{p.payee || '—'}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.refs.join(', ')}</td>
                  <td className="right mono">{fmt.money(p.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
            {plan.length > 0 && (
              <tfoot><tr>
                <td colSpan="4" className="right" style={{ fontWeight: 600 }}>รวม {plan.length} ใบ</td>
                <td className="right mono"><b>{fmt.money(plan.reduce((a, p) => a + p.amount, 0), 2)}</b></td>
              </tr></tfoot>
            )}
          </table>
        </div></div>
        <div className="cu-fld" style={{ marginTop: 12 }}>
          <span className="cu-lbl">หมายเหตุ</span>
          <input className="cfg-input" value={f.note} placeholder="บันทึกเพิ่มเติมสำหรับเช็ครอบนี้" onChange={(e) => set('note', e.target.value)} />
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เลขที่เช็คเรียงต่อเนื่องจากใบที่เลือกในเล่ม · รายการที่ออกเช็คแล้วจะส่งเข้าระบบบัญชีและบันทึกใน Audit Log
      </div>
    </div>
  );
}

Object.assign(window, { ChequeUnifiedPage });
