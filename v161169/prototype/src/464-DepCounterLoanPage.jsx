// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — ยืมเงินระหว่างเคาน์เตอร์
//  เจ้าหน้าที่ ↔ เจ้าหน้าที่ (เคาน์เตอร์ที่เปิดและตรวจรับเงินแล้ว)
//  ผู้ยืมส่งคำขอ → ผู้ให้ยืมกดยืนยันจ่าย (ยืม) / ยืนยันรับ (คืน)
//  ยอดที่ยืนยันแล้วถูกนำไปคิดตอนปิดเคาน์เตอร์ (depCtLoanNet)
// ════════════════════════════════════════════════════════════════════

function dlOwner(s) { return s ? (s.tellerId || s.teller) : null; }
function dlCash(s, loans) { return window.depCtIssued(s) + window.depCtLoanNet(s, loans) + window.depCtVaultNet(s); }
// ยอดค้างคืน: ที่ borrower(s) ยืมจาก lender(l) แล้วยังไม่คืน (เฉพาะ session ปัจจุบันของทั้งคู่)
function dlOwed(borrower, lender, loans) {
  if (!borrower || !lender) return 0;
  const n = window.depCtNum;
  return loans.filter(x => x.status === 'done' && x.sessionFrom === lender.openedAt && x.sessionTo === borrower.openedAt
                        && x.from === lender.counter && x.to === borrower.counter && x.kind === 'borrow')
              .reduce((a, x) => a + n(x.amount), 0)
       - loans.filter(x => x.status === 'done' && x.sessionFrom === borrower.openedAt && x.sessionTo === lender.openedAt
                        && x.from === borrower.counter && x.to === lender.counter && x.kind === 'return')
              .reduce((a, x) => a + n(x.amount), 0);
}

// ─── popup ยืม / คืน ───────────────────────────────────────────────
function DepLoanModal({ me, mine, others, sessions, loans, mode, onClose, onConfirm }) {
  const isReturn = mode === 'return';
  const n = window.depCtNum;
  const [target, setTarget] = useState(others[0] ? others[0].counter : '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const tgt = sessions[target] || null;
  const owed = isReturn && tgt ? dlOwed(mine, tgt, loans) : 0;
  const myCash = dlCash(mine, loans);
  const tgtCash = tgt ? dlCash(tgt, loans) : 0;
  const amt = n(amount);

  const submit = () => {
    if (!tgt) return setErr(isReturn ? 'กรุณาเลือกเคาน์เตอร์ที่จะคืนเงิน' : 'กรุณาเลือกเคาน์เตอร์ที่ต้องการยืม');
    if (!(amt > 0)) return setErr('จำนวนเงินต้องมากกว่า 0');
    if (isReturn && amt > owed + 0.005) return setErr('จำนวนเงินที่คืนต้องไม่เกินยอดค้างคืน ' + fmt.money(owed, 2) + ' บาท');
    if (isReturn && amt > myCash + 0.005) return setErr('เงินในเครื่องของคุณไม่พอ (มี ' + fmt.money(myCash, 2) + ' บาท)');
    if (!isReturn && amt > tgtCash + 0.005) return setErr('เงินในเครื่อง ' + tgt.code + ' ไม่พอ (มี ' + fmt.money(tgtCash, 2) + ' บาท)');
    onConfirm({ target: tgt, amount: amt, note: note.trim() });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 500, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="swap" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isReturn ? 'คืนเงินที่ยืม' : 'ขอยืมเงินจากเคาน์เตอร์อื่น'}</h2>
            <div className="muted" style={{ fontSize: 12 }}>
              {isReturn ? 'ส่งคำขอคืนเงิน — เจ้าของเคาน์เตอร์ปลายทางต้องกดยืนยันรับเงิน'
                        : 'ส่งคำขอยืมเงิน — เจ้าของเคาน์เตอร์ต้นทางต้องกดยืนยันจ่ายเงิน'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}

          <div className="dep-inset" style={{ marginBottom: 14 }}>
            <window.DepCtKv label={isReturn ? 'คืนจากเคาน์เตอร์' : 'ยืมเข้าเคาน์เตอร์'} value={mine.code + ' · ' + window.depCtName(mine.counter)} />
            <window.DepCtKv label="เงินในเครื่องของคุณ" value={fmt.money(myCash, 2) + ' บาท'} mono />
          </div>

          <window.DepCtRow label={isReturn ? 'คืนให้เคาน์เตอร์' : 'ยืมจากเคาน์เตอร์'} required>
            <select className="cfg-input" value={target} onChange={(e) => { setTarget(e.target.value); setErr(''); }}>
              {others.length === 0 && <option value="">— ไม่มีเคาน์เตอร์ที่เลือกได้ —</option>}
              {others.map(o => (
                <option key={o.counter} value={o.counter}>
                  {o.code} · {window.depCtName(o.counter)} — {o.teller}
                </option>
              ))}
            </select>
          </window.DepCtRow>

          {tgt && (
            <div className="dep-inset" style={{ marginBottom: 14 }}>
              <window.DepCtKv label="เจ้าหน้าที่ประจำเครื่อง" value={window.depCtWho(tgt.teller, tgt.tellerRole)} />
              {!isReturn && <window.DepCtKv label="เงินในเครื่องปลายทาง" value={fmt.money(tgtCash, 2) + ' บาท'} mono />}
              {isReturn && <window.DepCtKv label="ยอดค้างคืน" value={fmt.money(owed, 2) + ' บาท'} mono />}
            </div>
          )}

          <window.DepCtRow label="จำนวนเงิน (บาท)" required>
            <input className="cfg-input mono right" inputMode="decimal" value={amount} placeholder="0.00"
                   onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setErr(''); }} />
          </window.DepCtRow>

          <window.DepCtRow label="หมายเหตุ">
            <input className="cfg-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ระบุเหตุผล (ถ้ามี)" />
          </window.DepCtRow>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!tgt} onClick={submit}>
            <Icon name="check" /> {isReturn ? 'ส่งคำขอคืนเงิน' : 'ส่งคำขอยืมเงิน'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── หน้า ยืมเงินระหว่างเคาน์เตอร์ ──────────────────────────────
function DepCounterLoanPage({ onToast, embedded = false, onlyCounter = null }) {
  const me = window.depCtMe();
  const meKey = me.id || me.name;
  const [sessions, setSessions] = useState(() => window.depCtLoadAll());
  const [loans, setLoans] = useState(() => window.depCtLoansLoad());
  const [modal, setModal] = useState(null);     // { code, mode }
  const [reject, setReject] = useState(null);   // loan
  !embedded && window.useBreadcrumb && window.useBreadcrumb([{ label: 'ยืมเงินระหว่างเคาน์เตอร์', current: true }], []);

  React.useEffect(() => {
    const sync = () => { setSessions(window.depCtLoadAll()); setLoans(window.depCtLoansLoad()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const ready = window.DEP_COUNTERS.map(c => sessions[c.code]).filter(s => s && s.status === 'open' && s.cashVerified);
  const isMine = (s) => dlOwner(s) === meKey || (s && s.teller === me.name);
  const mine = ready.filter(isMine).filter(s => !onlyCounter || s.counter === onlyCounter).sort((a, b) => String(a.openedAt).localeCompare(String(b.openedAt)));
  const live = (x) => sessions[x.from] && sessions[x.from].openedAt === x.sessionFrom
                   && sessions[x.to] && sessions[x.to].openedAt === x.sessionTo;
  const todays = loans.filter(live);

  const save = (next) => { window.depCtLoansSave(next); setLoans(next); };

  const create = ({ target, amount, note }) => {
    const s = sessions[modal.code];
    const t = window.depCtNow();
    const borrow = modal.mode === 'borrow';
    const rec = {
      id: 'LN' + Date.now(), kind: borrow ? 'borrow' : 'return', status: 'pending', amount, note,
      // from = ฝั่งจ่ายเงินออก · to = ฝั่งรับเงินเข้า
      from: borrow ? target.counter : s.counter, to: borrow ? s.counter : target.counter,
      sessionFrom: borrow ? target.openedAt : s.openedAt, sessionTo: borrow ? s.openedAt : target.openedAt,
      requestedBy: me.name, requestedAt: t.iso, reqDate: t.date, reqTime: t.time,
    };
    save([...loans, rec]); setModal(null);
    window.depSuccess({ title: 'ส่งคำขอเรียบร้อยแล้ว', desc: (borrow ? 'ส่งคำขอยืม ' : 'ส่งคำขอคืน ') + fmt.money(amount, 2) + ' บาท ไปยัง “' + target.code + '” เรียบร้อยแล้ว', next: 'รอเคาน์เตอร์ ' + target.code + ' ยืนยันรายการ' });
  };

  const confirmLoan = (x) => {
    const payer = sessions[x.from];
    if (dlCash(payer, loans) + 0.005 < window.depCtNum(x.amount))
      return onToast && onToast('เงินในเครื่อง ' + payer.code + ' ไม่พอสำหรับรายการนี้');
    const t = window.depCtNow();
    save(loans.map(l => l.id === x.id ? { ...l, status: 'done', confirmedBy: me.name, confirmedAt: t.iso, cfDate: t.date, cfTime: t.time } : l));
    onToast && onToast(x.kind === 'borrow' ? 'ยืนยันจ่ายเงินให้ยืมเรียบร้อย' : 'ยืนยันรับเงินคืนเรียบร้อย');
  };
  const cancelLoan = (x, why) => {
    const t = window.depCtNow();
    save(loans.map(l => l.id === x.id ? { ...l, status: why === 'cancel' ? 'cancelled' : 'rejected', closedBy: me.name, closedAt: t.iso } : l));
    setReject(null);
    onToast && onToast(why === 'cancel' ? 'ยกเลิกคำขอแล้ว' : 'ปฏิเสธคำขอแล้ว');
  };

  // ใครต้องกดยืนยัน: ยืม → ฝั่งจ่าย (from) · คืน → ฝั่งรับ (to)
  const approverOf = (x) => x.kind === 'borrow' ? sessions[x.from] : sessions[x.to];
  const requesterOf = (x) => x.kind === 'borrow' ? sessions[x.to] : sessions[x.from];
  const STATUS = { pending: ['warn', 'รอยืนยัน'], done: ['ok', 'ยืนยันแล้ว'], rejected: ['bad', 'ปฏิเสธ'], cancelled: ['', 'ยกเลิก'] };

  const header = embedded ? null : (
    <div className="page-actions">
      <div>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยืมเงินระหว่างเคาน์เตอร์</h1>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          ยืมหรือคืนเงินสดระหว่างเคาน์เตอร์ที่เปิดอยู่ — ทุกรายการต้องให้เจ้าของอีกเคาน์เตอร์กดยืนยัน และจะถูกนำไปคิดตอนปิดเคาน์เตอร์
        </div>
      </div>
    </div>
  );

  if (mine.length === 0) {
    if (embedded) return null;
    return (
      <div data-screen-label="ยืมเงินระหว่างเคาน์เตอร์">
        {header}
        <div className="search-card">
          <div style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div className="gc-modal-ico" style={{ margin: '0 auto 14px' }}><Icon name="wallet" size={20} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>ยังไม่มีเคาน์เตอร์ที่พร้อมทำรายการ</div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>
              ต้องเปิดเคาน์เตอร์และรับเงินตั้งต้นจากหัวหน้าที่เมนู <b>เปิดเคาน์เตอร์</b> ก่อน จึงจะยืมหรือคืนเงินระหว่างเคาน์เตอร์ได้
            </div>
            <button className="btn primary" onClick={() => { window.location.hash = '#deposit/counter-open'; }}>
              <Icon name="chevRight" size={14} /> ไปหน้าเปิดเคาน์เตอร์
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-screen-label="ยืมเงินระหว่างเคาน์เตอร์">
      {header}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {mine.map(s => {
          const cash = dlCash(s, loans);
          const net = window.depCtLoanNet(s, loans);
          const others = ready.filter(o => o.counter !== s.counter);
          const owedList = others.map(o => ({ o, v: dlOwed(s, o, loans) })).filter(r => r.v > 0.005);
          const owedTotal = owedList.reduce((a, r) => a + r.v, 0);
          const lentTotal = others.reduce((a, o) => a + Math.max(0, dlOwed(o, s, loans)), 0);
          const rows = todays.filter(x => x.from === s.counter || x.to === s.counter).slice().reverse();
          const incoming = rows.filter(x => x.status === 'pending' && approverOf(x) && approverOf(x).counter === s.counter);

          return (
            <div className="search-card" key={s.counter}>
              <div className="section-head" style={{ marginBottom: 12 }}>
                <h3>{embedded ? 'ยืม / คืนระหว่างเคาน์เตอร์' : window.depCtName(s.counter)}</h3>
                <div className="head-actions">
                  {!embedded && <span className="chip primary"><span className="mono">{s.code}</span></span>}
                  {incoming.length > 0 && <span className="pill warn">รอคุณยืนยัน {incoming.length} รายการ</span>}
                </div>
              </div>

              {!embedded && <div className="dl-kpis">
                <div className="dl-kpi"><span>เงินในเครื่องปัจจุบัน</span><b className="mono">{fmt.money(cash, 2)}</b></div>
                <div className="dl-kpi"><span>ยืม/คืนสุทธิวันนี้</span>
                  <b className="mono" style={{ color: net > 0 ? 'var(--brand, #237450)' : net < 0 ? 'var(--danger)' : undefined }}>
                    {(net > 0 ? '+' : '') + fmt.money(net, 2)}</b></div>
                <div className="dl-kpi"><span>ค้างคืนเคาน์เตอร์อื่น</span><b className="mono">{fmt.money(owedTotal, 2)}</b></div>
                <div className="dl-kpi"><span>ให้เคาน์เตอร์อื่นยืมอยู่</span><b className="mono">{fmt.money(lentTotal, 2)}</b></div>
              </div>}

              {incoming.length > 0 && (
                <div className="dl-inbox">
                  {incoming.map(x => {
                    const rq = requesterOf(x);
                    return (
                      <div className="dl-inbox-row" key={x.id}>
                        <Icon name="info" size={14} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <b>{rq ? rq.code : '—'}</b> ({x.requestedBy}) {x.kind === 'borrow' ? 'ขอยืมเงิน' : 'ขอคืนเงิน'}{' '}
                          <b className="mono">{fmt.money(x.amount, 2)}</b> บาท
                          {x.note && <span className="muted"> · {x.note}</span>}
                        </span>
                        <button className="btn sm" onClick={() => setReject(x)}>ปฏิเสธ</button>
                        <button className="btn primary sm" onClick={() => confirmLoan(x)}>
                          <Icon name="check" size={13} /> {x.kind === 'borrow' ? 'ยืนยันจ่ายเงิน' : 'ยืนยันรับเงิน'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="table-wrap" style={{ marginTop: 12, overflowX: 'auto' }}>
                <table className="tbl" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th className="center" style={{ width: 52 }}>ลำดับ</th>
                      <th>เวลา</th>
                      <th>ประเภท</th>
                      <th>คู่เคาน์เตอร์</th>
                      <th className="right">รับเข้า</th>
                      <th className="right">จ่ายออก</th>
                      <th>สถานะ</th>
                      <th className="center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan="8" className="empty-state">ยังไม่มีรายการยืม/คืนของเคาน์เตอร์นี้</td></tr>
                    ) : rows.map((x, i) => {
                      const inbound = x.to === s.counter;
                      const peer = sessions[inbound ? x.from : x.to];
                      const [pc, pl] = STATUS[x.status] || ['', x.status];
                      const iRequested = requesterOf(x) && requesterOf(x).counter === s.counter;
                      return (
                        <tr key={x.id} className={x.status === 'rejected' || x.status === 'cancelled' ? 'dat-off' : undefined}>
                          <td className="center muted">{rows.length - i}</td>
                          <td className="mono">{x.reqTime} น.</td>
                          <td>{x.kind === 'borrow' ? 'ยืม' : 'คืน'}</td>
                          <td>{peer ? <><span className="mono">{peer.code}</span> · {peer.teller}</> : '—'}</td>
                          <td className="right mono">{inbound ? fmt.money(x.amount, 2) : ''}</td>
                          <td className="right mono">{!inbound ? fmt.money(x.amount, 2) : ''}</td>
                          <td><span className={'pill ' + pc}>{pl}</span></td>
                          <td className="center">
                            {x.status === 'pending' && iRequested
                              ? <button className="btn sm" onClick={() => cancelLoan(x, 'cancel')}>ยกเลิก</button>
                              : <span className="muted">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="page-actions" style={{ marginTop: 12, marginBottom: 0, justifyContent: 'flex-end' }}>
                <button className="btn sm ct-btn-repay" disabled={owedList.length === 0} title={owedList.length === 0 ? 'ไม่มียอดค้างคืน' : undefined}
                        onClick={() => setModal({ code: s.counter, mode: 'return' })}>
                  <Icon name="upload" size={13} /> คืนเงิน
                </button>
                <button className="btn sm ct-btn-borrow" disabled={others.length === 0}
                        title={others.length === 0 ? 'ยังไม่มีเคาน์เตอร์อื่นที่พร้อมทำรายการ' : undefined}
                        onClick={() => setModal({ code: s.counter, mode: 'borrow' })}>
                  <Icon name="download" size={13} /> ขอยืมเงิน
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (() => {
        const s = sessions[modal.code];
        const others = ready.filter(o => o.counter !== s.counter);
        const list = modal.mode === 'return' ? others.filter(o => dlOwed(s, o, loans) > 0.005) : others;
        return <DepLoanModal me={me} mine={s} others={list} sessions={sessions} loans={loans} mode={modal.mode}
                             onClose={() => setModal(null)} onConfirm={create} />;
      })()}

      {reject && (
        <>
          <div className="modal-backdrop" onClick={() => setReject(null)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420, maxWidth: '94vw' }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={{ color: 'var(--danger)' }}><Icon name="close" /></div>
              <div style={{ minWidth: 0 }}><h2>ปฏิเสธคำขอ</h2></div>
              <button className="close-btn" onClick={() => setReject(null)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.7 }}>
              คุณต้องการปฏิเสธคำขอ{reject.kind === 'borrow' ? 'ยืม' : 'คืน'}เงิน <b className="mono">{fmt.money(reject.amount, 2)}</b> บาท
              จาก {reject.requestedBy} ใช่หรือไม่? เงินในเครื่องทั้งสองฝั่งจะไม่เปลี่ยนแปลง
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setReject(null)}>ยกเลิก</button>
              <button className="btn danger" onClick={() => cancelLoan(reject, 'reject')}>ยืนยันปฏิเสธ</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepCounterLoanPage });
