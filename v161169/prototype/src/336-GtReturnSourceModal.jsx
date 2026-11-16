// ════════════════════════════════════════════════════════════════════
//  โอนหนี้กลับผู้กู้ (RTN) — ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  รวมหนี้ที่เคยโอนไปให้ผู้ค้ำประกัน "กลับมาเป็นยอดเดียว" ของผู้กู้เดิม
//  • ยอดที่โอนกลับ = (ต้น + ดอกเบี้ย) − ยอดที่ผู้ค้ำชำระแล้ว ของผู้ค้ำทุกราย รวมกัน
//  • คำนวณสัดส่วนการค้ำประกันใหม่ตามยอดที่ผู้ค้ำแต่ละรายชำระแล้ว
//    เก็บไว้กับสัญญา เพื่อใช้แบ่งยอดเมื่อรับโอนเลขสัญญาผู้ค้ำอีกครั้ง
// ════════════════════════════════════════════════════════════════════

// ─── popup เลือกสัญญาที่โอนไปผู้ค้ำแล้ว (แหล่งที่จะโอนกลับ) ──────────
function GtReturnSourceModal({ list, onPick, onClose }) {
  const all = window.gtReturnableRecords(list);
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return all;
    return all.filter(r =>
      (r.id || '').toLowerCase().includes(n) ||
      (r.contractNo || '').toLowerCase().includes(n) ||
      (r.borrowerName || '').toLowerCase().includes(n) ||
      (r.borrowerCode || '').toLowerCase().includes(n) ||
      (r.allocations || []).some(a => (a.transferredContractNo || '').toLowerCase().includes(n) || (a.name || '').toLowerCase().includes(n)));
  }, [q, all]);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="swap" /></div>
          <h2>เลือกใบโอนหนี้ผู้ค้ำที่จะโอนกลับผู้กู้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 10 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
                   placeholder="ค้นหาทะเบียนโอน / สัญญาผู้กู้ / ผู้กู้ / เลขสัญญารับโอน…" />
          </div>
          <div className="gc-sub-title" style={{ marginTop: 0 }}>
            ใบโอนหนี้ผู้ค้ำที่อนุมัติแล้ว <span className="muted" style={{ fontWeight: 400 }}>· พบ {rows.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 320 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ทะเบียนโอน</th>
                  <th>สัญญาผู้กู้เดิม</th>
                  <th className="center">ผู้ค้ำ</th>
                  <th className="num">ยอดโอน (P+I)</th>
                  <th className="num">ชำระแล้ว</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่มีใบโอนหนี้ผู้ค้ำที่พร้อมโอนกลับ (ต้องอนุมัติแล้วและยังไม่ปิดหนี้)</td></tr>
                ) : rows.map(r => {
                  const paid = (r.allocations || []).reduce((s, a) => s + (Number(a.paid) || 0), 0);
                  return (
                    <tr key={r.id} className="clickable" onClick={() => onPick(r)}>
                      <td className="mono">{r.id}</td>
                      <td>
                        <div className="mono" style={{ fontSize: 11 }}>{r.contractNo}</div>
                        <div className="muted" style={{ fontSize: 10 }}>{r.borrowerName} · {r.borrowerCode}</div>
                      </td>
                      <td className="center">{(r.allocations || []).length} ราย</td>
                      <td className="num">{fmt.money(window.gtTransferTotal(r), 0)}</td>
                      <td className="num mono">{fmt.money(paid, 0)}</td>
                      <td className="center">
                        <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                onClick={(e) => { e.stopPropagation(); onPick(r); }} title="เลือก"><Icon name="chevRight" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ─── หน้าทำรายการโอนหนี้กลับผู้กู้ ───────────────────────────────────
function GtReturnWorkspace({ list, onSubmit, onCancel, onToast }) {
  const beYear = 2569;
  const today = window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10);
  const [source, setSource] = useState(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [returnDate, setReturnDate] = useState(today);

  // คำนวณยอดคงเหลือ/สัดส่วนค้ำใหม่
  const calc = useMemo(() => source ? window.gtComputeReturn(source) : null, [source]);

  // แยกยอดคงเหลือเป็นต้น/ดอกเบี้ย (หักยอดชำระเข้าดอกเบี้ยก่อน แล้วจึงต้นเงิน)
  const split = useMemo(() => {
    if (!calc) return { principal: 0, interest: 0 };
    let p = 0, i = 0;
    calc.allocs.forEach(a => {
      const paid = Number(a.paid) || 0;
      const intRem = Math.max(0, (Number(a.interest) || 0) - paid);
      const paidLeft = Math.max(0, paid - (Number(a.interest) || 0));
      const prinRem = Math.max(0, (Number(a.principal) || 0) - paidLeft);
      p += prinRem; i += intRem;
    });
    return { principal: Math.round(p * 100) / 100, interest: Math.round(i * 100) / 100 };
  }, [calc]);

  const totalRemaining = calc ? calc.totalRemaining : 0;

  const reset = () => { setSource(null); setReturnDate(today); onToast && onToast('ล้างค่าฟอร์มแล้ว'); };

  const checks = useMemo(() => {
    const l = [];
    l.push({ ok: !!source, label: 'เลือกใบโอนหนี้ผู้ค้ำที่ต้องการโอนกลับ' });
    l.push({ ok: !!returnDate, label: 'ระบุวันที่โอนกลับ' });
    l.push({ ok: totalRemaining > 0, label: 'มียอดคงเหลือให้โอนกลับ (มากกว่า 0)' });
    return l;
  }, [source, returnDate, totalRemaining]);
  const firstFail = checks.find(c => !c.ok);
  const canSave = !firstFail;

  const save = () => {
    if (!canSave) { onToast && onToast(`กรอกข้อมูลไม่ครบถ้วน — ${firstFail.label}`); return; }
    const guaranteeShares = calc.allocs.map(a => ({ code: a.code, name: a.name, paid: a.paid, sharePct: a.sharePct }));
    const rec = {
      id: window.gtNextId(list, beYear), transferType: 'RTN',
      transferDate: returnDate, accrueToDate: returnDate,
      contractNo: source.contractNo,
      borrowerCode: source.borrowerCode, borrowerName: source.borrowerName,
      borrowerDept: source.borrowerDept, borrowerStatus: source.borrowerStatus,
      loanType: source.loanType, contractType: source.contractType,
      legalStatus: source.legalStatus, intRate: source.intRate, lastInterestDate: source.lastInterestDate,
      principalRemaining: split.principal, interestAccrued: split.interest,
      installment: source.installment, lastPeriod: source.lastPeriod,
      exitReasonCode: '', exitReasonOther: '', rateMode: 'orig', appliedRate: source.intRate,
      transferPrincipal: split.principal, transferInterest: split.interest,
      allocations: [{
        code: source.borrowerCode, name: source.borrowerName, dept: source.borrowerDept,
        transferredContractNo: source.contractNo, accrueDate: returnDate,
        percent: 100, principal: split.principal, interest: split.interest,
        perPeriod: source.installment, type: 'RTN',
      }],
      guaranteeShares, sourceTransferId: source.id,
      docStatus: 'draft', collectStatus: 'pending',
      noticeRef: '—', dueDate: returnDate,
      history: [
        { date: returnDate, event: 'โอนหนี้กลับผู้กู้',
          detail: `รวมหนี้คงเหลือจากผู้ค้ำ ${calc.allocs.length} ราย เป็นยอดเดียว ${fmt.money(totalRemaining, 2)} บาท กลับไปยังสัญญาผู้กู้ ${source.contractNo}` +
                  ` · กำหนดสัดส่วนค้ำประกันใหม่ตามยอดชำระ: ${guaranteeShares.map(s => `${s.code} ${fmt.money(s.sharePct, 2)}%`).join(', ')}`,
          by: 'จันทร์เพ็ญ มาลี' },
      ],
      enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: new Date().toISOString().slice(0, 19),
    };
    onSubmit(rec, source, guaranteeShares);
  };

  return (
    <div data-screen-label="หน้าทำรายการโอนหนี้กลับผู้กู้">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setPickOpen(true)}><Icon name="swap" /> เลือกใบโอนหนี้ผู้ค้ำ</button>
        <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกโอนกลับ</button>
        <button className="btn sm" onClick={reset}><Icon name="refresh" /> ล้างค่า</button>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ใบโอนหนี้ผู้ค้ำที่จะโอนกลับ</h3></div>
        {!source ? (
          <div className="gt-pick-hint"><Icon name="swap" size={14} /> เลือก “ใบโอนหนี้ผู้ค้ำ” ที่อนุมัติแล้ว เพื่อรวมหนี้คงเหลือกลับไปยังผู้กู้เดิม</div>
        ) : (
          <>
            <div className="gt-detail-grid">
              <label className="gt-fld"><span className="label">ทะเบียนโอนเดิม</span>
                <input className="cfg-input mono" readOnly tabIndex={-1} value={source.id} /></label>
              <label className="gt-fld"><span className="label">สัญญาผู้กู้เดิม</span>
                <input className="cfg-input mono" readOnly tabIndex={-1} value={source.contractNo} /></label>
              <label className="gt-fld"><span className="label">ผู้กู้เดิม</span>
                <input className="cfg-input" readOnly tabIndex={-1} value={source.borrowerName} /></label>
              <label className="gt-fld"><span className="label">วันที่โอนกลับ *</span>
                <ErpDate value={returnDate} onChange={(v) => ((e) => setReturnDate(e.target.value))({ target: { value: v } })} className="cfg-input" /></label>
            </div>
            <div className="summary-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12 }}>
              <div className="summary-card"><div className="label">ยอดโอนเดิม (P+I)</div><div className="value">฿ {fmt.money(window.gtTransferTotal(source), 2)}</div></div>
              <div className="summary-card"><div className="label">ผู้ค้ำชำระแล้ว</div><div className="value">฿ {fmt.money(calc.totalPaid, 2)}</div></div>
              <div className="summary-card accent"><div className="label">คงเหลือโอนกลับ (ยอดเดียว)</div><div className="value" style={{ color: 'var(--danger)' }}>฿ {fmt.money(totalRemaining, 2)}</div></div>
            </div>
          </>
        )}
      </div>

      {source && (
        <>
          <div className="gt-rate-note" style={{ marginBottom: 12 }}>
            <Icon name="info" size={13} />
            <span>หนี้คงเหลือของผู้ค้ำทุกรายจะถูก <b>รวมเป็นยอดเดียว</b> ({fmt.money(totalRemaining, 2)} บาท) กลับไปยังสัญญาผู้กู้เดิม <b className="mono">{source.contractNo}</b> — แบ่งเป็นต้นเงิน {fmt.money(split.principal, 2)} + ดอกเบี้ย {fmt.money(split.interest, 2)}</span>
          </div>

          <div className="search-card" style={{ marginBottom: 12 }}>
            <div className="section-head" style={{ marginBottom: 12 }}>
              <span className="head-bar" /><h3>หนี้คงเหลือรายผู้ค้ำ และสัดส่วนการค้ำประกันใหม่</h3>
              <span className="gc-count">{calc.allocs.length} ราย</span>
            </div>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>เลขผู้ค้ำ</th><th>ชื่อผู้ค้ำ</th><th>เลขสัญญารับโอน</th>
                    <th className="num">ยอดที่รับโอน (P+I)</th><th className="num">ชำระแล้ว</th>
                    <th className="num">คงเหลือ</th><th className="num">สัดส่วนค้ำใหม่</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.allocs.map((a, i) => (
                    <tr key={i}>
                      <td className="mono">{a.code}</td>
                      <td>{a.name}<div className="muted" style={{ fontSize: 10 }}>{a.dept}</div></td>
                      <td className="mono">{a.transferredContractNo}</td>
                      <td className="num mono">{fmt.money(a.owed, 2)}</td>
                      <td className="num mono">{fmt.money(a.paid, 2)}</td>
                      <td className="num mono">{fmt.money(a.remaining, 2)}</td>
                      <td className="num"><b style={{ color: 'var(--brand-700, var(--primary))' }}>{fmt.money(a.sharePct, 2)}%</b></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="right"><b>รวม</b></td>
                    <td className="num mono"><b>{fmt.money(calc.allocs.reduce((s, a) => s + a.owed, 0), 2)}</b></td>
                    <td className="num mono"><b>{fmt.money(calc.totalPaid, 2)}</b></td>
                    <td className="num mono"><b>{fmt.money(totalRemaining, 2)}</b></td>
                    <td className="num"><b>{fmt.money(calc.allocs.reduce((s, a) => s + a.sharePct, 0), 2)}%</b></td>
                  </tr>
                </tfoot>
              </table>
            </div></div>
            <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
              <Icon name="info" size={11} /> สัดส่วนการค้ำประกันใหม่คำนวณตามยอดที่ผู้ค้ำแต่ละรายชำระแล้ว และถูกผูกไว้กับสัญญา — เมื่อสัญญานี้ถูกรับโอนเลขสัญญาผู้ค้ำประกันอีกครั้ง ระบบจะแบ่งยอดตามสัดส่วนนี้โดยอัตโนมัติ
            </p>
          </div>
        </>
      )}

      {pickOpen && (
        <GtReturnSourceModal list={list}
          onPick={(r) => { setSource(r); setReturnDate(today); setPickOpen(false); }}
          onClose={() => setPickOpen(false)} />
      )}
    </div>
  );
}

// ─── ทะเบียนรายการโอนกลับผู้กู้ (list) ───────────────────────────────
function GtReturnListView({ list, onCreate, onOpen }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    let r = list.filter(x => x.transferType === 'RTN');
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.id.toLowerCase().includes(n) || (x.contractNo || '').toLowerCase().includes(n) ||
        (x.borrowerName || '').toLowerCase().includes(n) || (x.borrowerCode || '').toLowerCase().includes(n));
    }
    return [...r].sort((a, b) => (b.transferDate || '').localeCompare(a.transferDate || '') || b.id.localeCompare(a.id));
  }, [list, q]);

  return (
    <div data-screen-label="หน้าทะเบียนโอนหนี้กลับผู้กู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>โอนหนี้กลับผู้กู้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · รวมหนี้คงเหลือจากผู้ค้ำกลับเป็นยอดเดียวของผู้กู้เดิม พร้อมกำหนดสัดส่วนค้ำประกันใหม่ตามยอดที่ชำระแล้ว
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> ทำรายการโอนกลับ</button>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ทะเบียน / สัญญาผู้กู้ / ผู้กู้</span>
            <div className="search" style={{ flex: 'none', width: 320, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น GT-2569-000005, L-2021-0332" style={{ height: 30 }} />
            </div>
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>ทะเบียนโอนกลับ</th>
                <th>สัญญาผู้กู้</th>
                <th>ผู้กู้เดิม</th>
                <th className="center">วันที่โอนกลับ</th>
                <th className="num">ยอดโอนกลับ (P+I)</th>
                <th className="center">สถานะใบทำรายการ</th>
                <th className="center" style={{ width: 64 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="swap" size={24} /></div>
                  ยังไม่มีรายการโอนหนี้กลับผู้กู้ — กด “ทำรายการโอนกลับ”
                </td></tr>
              ) : rows.map(r => {
                const ds = window.gtDocStatus(r.docStatus);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{r.contractNo}<div className="muted" style={{ fontSize: 10 }}>{r.loanType}</div></td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.borrowerName}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{r.borrowerCode}</div>
                    </td>
                    <td className="center mono">{fmt.date(r.transferDate)}</td>
                    <td className="num"><b>{fmt.money(window.gtTransferTotal(r), 2)}</b></td>
                    <td className="center"><span className={'pill ' + ds.pill}>{ds.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="bud-act" title="ดูรายละเอียด" onClick={() => onOpen(r)}><Icon name="eye" size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

// ─── การ์ดสัดส่วนค้ำประกันใหม่ (ต่อท้ายหน้ารายละเอียด RTN) ───────────
function GtShareCard({ rec }) {
  if (!rec || !rec.guaranteeShares || !rec.guaranteeShares.length) return null;
  return (
    <div className="search-card" style={{ marginBottom: 12 }}>
      <div className="section-head" style={{ marginBottom: 12 }}>
        <span className="head-bar" /><h3>สัดส่วนการค้ำประกันใหม่ (ตามยอดที่ชำระแล้ว)</h3>
        <span className="gc-count">{rec.guaranteeShares.length} ราย</span>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr><th>เลขผู้ค้ำ</th><th>ชื่อผู้ค้ำ</th><th className="num">ชำระแล้ว</th><th className="num">สัดส่วนค้ำใหม่</th></tr>
          </thead>
          <tbody>
            {rec.guaranteeShares.map((s, i) => (
              <tr key={i}>
                <td className="mono">{s.code}</td>
                <td>{s.name}</td>
                <td className="num mono">{fmt.money(s.paid || 0, 2)}</td>
                <td className="num"><b style={{ color: 'var(--brand-700, var(--primary))' }}>{fmt.money(s.sharePct, 2)}%</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
      <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
        <Icon name="info" size={11} /> สัดส่วนนี้ถูกผูกกับสัญญา {rec.contractNo} — เมื่อรับโอนเลขสัญญาผู้ค้ำประกันอีกครั้ง ระบบจะแบ่งยอดตามสัดส่วนนี้
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับ list / form / detail
// ════════════════════════════════════════════════════════════════════
function GuarantorReturnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.gtLoad);
  const [mode, setMode] = useState('list');
  const [current, setCurrent] = useState(null);

  const MODULE = 'ทะเบียนและติดตามหนี้ — โอนหนี้กลับผู้กู้';
  const persist = (next) => { setList(next); window.gtSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };
  const update = (rec, patch) => {
    const updated = { ...rec, ...patch };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    return updated;
  };

  const submit = (rec, source, shares) => {
    // ผูกสัดส่วนค้ำประกันใหม่กับสัญญาผู้กู้ + ทำเครื่องหมายใบโอนเดิมว่าโอนกลับแล้ว
    window.gtSaveReturnShares(rec.contractNo, shares);
    let next = [rec, ...list];
    next = next.map(r => r.id === source.id ? {
      ...r, returnedTo: rec.id, collectStatus: 'done',
      history: [...(r.history || []), { date: rec.transferDate, event: 'โอนหนี้กลับผู้กู้',
        detail: `หนี้คงเหลือถูกโอนกลับไปยังผู้กู้เดิม (${rec.id}) — ปิดสัญญารับโอนของผู้ค้ำ`, by: 'จันทร์เพ็ญ มาลี' }],
    } : r);
    persist(next);
    audit.log({
      action: 'create', module: MODULE,
      target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `โอนหนี้กลับผู้กู้ — รวมยอดคงเหลือ ${fmt.money(window.gtTransferTotal(rec), 2)} บาท จากใบโอน ${source.id}`,
      changes: [
        { field: 'ทะเบียนโอนกลับ', before: '—', after: rec.id },
        { field: 'ใบโอนหนี้ผู้ค้ำต้นทาง', before: '—', after: source.id },
        { field: 'สัญญาผู้กู้', before: '—', after: rec.contractNo },
        { field: 'ยอดโอนกลับ (P+I)', before: '—', after: `${fmt.money(window.gtTransferTotal(rec), 2)} บาท` },
        { field: 'สัดส่วนค้ำประกันใหม่', before: '—', after: shares.map(s => `${s.code} ${fmt.money(s.sharePct, 2)}%`).join(', ') },
      ],
    });
    onToast && onToast(`บันทึกโอนหนี้กลับผู้กู้ ${rec.id} เรียบร้อยแล้ว — รออนุมัติ`);
    setMode('list');
  };

  const approve = (rec) => {
    update(rec, { docStatus: 'approved', collectStatus: 'collecting',
      history: [...(rec.history || []), { date: window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10), event: 'อนุมัติรายการโอนกลับ', detail: 'อนุมัติการโอนหนี้กลับผู้กู้ — มีผล', by: 'ประสิทธิ์ คงทอง' }] });
    audit.log({ action: 'update', module: MODULE, target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `อนุมัติการโอนหนี้กลับผู้กู้ ${rec.id}`, changes: [{ field: 'สถานะใบทำรายการ', before: 'บันทึกแล้ว — รออนุมัติ', after: 'อนุมัติแล้ว' }] });
    onToast && onToast(`อนุมัติรายการ ${rec.id} เรียบร้อยแล้ว`);
  };
  const cancelRec = (rec) => {
    update(rec, { docStatus: 'cancelled',
      history: [...(rec.history || []), { date: window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10), event: 'ยกเลิกรายการ', detail: 'ยกเลิกใบทำรายการโอนกลับผู้กู้', by: 'จันทร์เพ็ญ มาลี' }] });
    audit.log({ action: 'delete', module: MODULE, target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `ยกเลิกรายการโอนกลับ ${rec.id}`, changes: [{ field: 'สถานะใบทำรายการ', before: window.gtDocStatus(rec.docStatus).l, after: 'ยกเลิกรายการ' }] });
    onToast && onToast(`ยกเลิกรายการ ${rec.id} แล้ว`);
  };
  const markDone = (rec) => {
    update(rec, { collectStatus: 'done',
      history: [...(rec.history || []), { date: window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10), event: 'ชำระครบ', detail: 'ผู้กู้ชำระหนี้ครบถ้วน ปิดสัญญา', by: 'จันทร์เพ็ญ มาลี' }] });
    onToast && onToast(`ปิดหนี้รายการ ${rec.id} เรียบร้อยแล้ว`);
  };
  const print = () => { onToast && onToast('กำลังเตรียมพิมพ์ใบทำรายการ'); setTimeout(() => window.print(), 80); };

  return (
    <>
      {mode === 'list'
        ? <GtReturnListView list={list} onCreate={() => setMode('form')} onOpen={openDetail} />
        : mode === 'detail'
          ? (
            <>
              <window.GtDetailView rec={current} onBack={() => setMode('list')} onApprove={approve} onCancel={cancelRec} onCollect={markDone} onPrint={print} />
              <GtShareCard rec={current} />
            </>
          )
          : <GtReturnWorkspace list={list} onSubmit={submit} onCancel={() => setMode('list')} onToast={onToast} />}
    </>
  );
}

Object.assign(window, { GuarantorReturnPage });
