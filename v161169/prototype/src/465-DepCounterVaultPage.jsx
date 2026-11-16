// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — เบิกเงิน / คืนเงิน (เคาน์เตอร์ ↔ การเงิน)
//  เบิก: เคาน์เตอร์ขอเบิก → การเงินยอมรับ (ปรับยอดได้ / ปฏิเสธได้) → เคาน์เตอร์ยืนยันรับเงิน
//  คืน : เคาน์เตอร์ขอคืน → การเงินยอมรับ (ปรับยอดได้ / ปฏิเสธได้) → เคาน์เตอร์ยืนยันส่งเงิน
//  รายการที่เสร็จแล้วถูกนำไปคิดตอนปิดเคาน์เตอร์ (depCtVaultNet)
// ════════════════════════════════════════════════════════════════════

const DV_STATUS = {
  pending:   ['warn', 'รอหัวหน้าอนุมัติ'],
  approved:  ['info', 'หัวหน้าอนุมัติแล้ว'],
  done:      ['ok',   'เสร็จสิ้น'],
  rejected:  ['bad',  'ถูกปฏิเสธ'],
  cancelled: ['',     'ยกเลิก'],
};
const dvAmt = (x) => window.depCtNum(x.approvedAmount != null ? x.approvedAmount : x.amount);
const dvKindLabel = (k) => k === 'withdraw' ? 'เบิกเงิน' : 'คืนเงิน';

// ─── popup ขอเบิก / ขอคืน ───────────────────────────────────────────
function DvRequestModal({ session, mode, onClose, onConfirm }) {
  const n = window.depCtNum;
  const isReturn = mode === 'return';
  const cash = window.depCtCashNow(session);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const amt = n(amount);
  const submit = () => {
    if (!(amt > 0)) return setErr('จำนวนเงินต้องมากกว่า 0');
    if (isReturn && amt > cash + 0.005) return setErr('จำนวนเงินที่คืนต้องไม่เกินเงินในเครื่อง ' + fmt.money(cash, 2) + ' บาท');
    onConfirm({ amount: amt, note: note.trim() });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isReturn ? 'ขอคืนเงินให้หัวหน้า' : 'ขอเบิกเงินจากหัวหน้า'}</h2>
            <div className="muted" style={{ fontSize: 12 }}>
              {isReturn ? 'ใช้เมื่อเงินหน้าเคาน์เตอร์มีมากเกินไป — รอหัวหน้าอนุมัติ แล้วจึงยืนยันส่งเงิน'
                        : 'ใช้เมื่อเงินหน้าเคาน์เตอร์ไม่พอ — รอหัวหน้าอนุมัติ แล้วจึงยืนยันรับเงิน'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          <div className="dep-inset" style={{ marginBottom: 14 }}>
            <window.DepCtKv label="เคาน์เตอร์" value={session.code + ' · ' + window.depCtName(session.counter)} />
            <window.DepCtKv label="เงินในเครื่องปัจจุบัน" value={fmt.money(cash, 2) + ' บาท'} mono />
          </div>
          <window.DepCtRow label={isReturn ? 'จำนวนเงินที่ขอคืน (บาท)' : 'จำนวนเงินที่ขอเบิก (บาท)'} required>
            <input className="cfg-input mono right" inputMode="decimal" value={amount} placeholder="0.00"
                   onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setErr(''); }} />
          </window.DepCtRow>
          <window.DepCtRow label="หมายเหตุ">
            <input className="cfg-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ระบุเหตุผล (ถ้ามี)" />
          </window.DepCtRow>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit}><Icon name="check" /> {isReturn ? 'ส่งคำขอคืนเงิน' : 'ส่งคำขอเบิกเงิน'}</button>
        </div>
      </div>
    </>
  );
}

// ─── popup การเงิน: ยอมรับ (ปรับยอดได้) / ปฏิเสธ (ระบุเหตุผล) ──────────
function DvFinanceModal({ req, session, mode, onClose, onApprove, onReject }) {
  const n = window.depCtNum;
  const approve = mode === 'approve';
  const [amount, setAmount] = useState(String(req.amount));
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [sup, setSup] = useState('');
  const [pin, setPin] = useState('');
  const auths = window.CANCEL_AUTHORIZERS || [];
  const amt = n(amount);
  const cash = window.depCtCashNow(session);
  const submit = () => {
    const me = (window.depCtMe && window.depCtMe()) || {};
    const sv = { name: me.name || 'หัวหน้าการเงิน' };
    if (approve) {
      if (!(amt > 0)) return setErr('จำนวนเงินต้องมากกว่า 0');
      if (req.kind === 'return' && amt > cash + 0.005) return setErr('ยอดคืนต้องไม่เกินเงินในเครื่อง ' + fmt.money(cash, 2) + ' บาท');
      onApprove({ amount: amt, note: reason.trim(), by: sv.name });
    } else {
      if (!reason.trim()) return setErr('กรุณาระบุเหตุผลการปฏิเสธ');
      onReject({ reason: reason.trim(), by: sv.name });
    }
  };
  const changed = approve && Math.abs(amt - n(req.amount)) > 0.005;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={approve ? undefined : { color: 'var(--danger)' }}><Icon name={approve ? 'check' : 'close'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{approve ? 'อนุมัติคำขอ' + dvKindLabel(req.kind) : 'ปฏิเสธคำขอ' + dvKindLabel(req.kind)}</h2>
            <div className="muted" style={{ fontSize: 12 }}>
              {approve ? 'ตรวจสอบยอด ปรับได้ก่อนอนุมัติ — หน้าเคาน์เตอร์ต้องยืนยัน' + (req.kind === 'withdraw' ? 'รับเงิน' : 'ส่งเงิน') + 'อีกครั้ง'
                       : 'หน้าเคาน์เตอร์จะเห็นเหตุผลที่ระบุ'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          <div className="dep-inset" style={{ marginBottom: 14 }}>
            <window.DepCtKv label="เลขที่คำขอ" value={req.id} mono />
            <window.DepCtKv label="เคาน์เตอร์" value={session ? session.code + ' · ' + window.depCtName(session.counter) : req.counter} />
            <window.DepCtKv label="ผู้ขอ" value={req.requestedBy} />
            <window.DepCtKv label="ยอดที่ขอ" value={fmt.money(req.amount, 2) + ' บาท'} mono />
            {req.note && <window.DepCtKv label="หมายเหตุผู้ขอ" value={req.note} />}
          </div>
          {approve && (
            <window.DepCtRow label="ยอดที่อนุมัติ (บาท)" required>
              <input className="cfg-input mono right" inputMode="decimal" value={amount}
                     onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setErr(''); }} />
            </window.DepCtRow>
          )}
          {changed && (
            <div className="sr-warn" style={{ marginBottom: 14 }}>
              <Icon name="info" size={14} /> ปรับยอดจาก {fmt.money(req.amount, 2)} เป็น {fmt.money(amt, 2)} บาท
            </div>
          )}
          <window.DepCtRow label={approve ? 'หมายเหตุ' : 'เหตุผลการปฏิเสธ'} required={!approve}>
            <input className="cfg-input" value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }}
                   placeholder={approve ? 'ระบุหมายเหตุ (ถ้ามี)' : 'ระบุเหตุผลการปฏิเสธ'} />
          </window.DepCtRow>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          {approve
            ? <button className="btn primary" onClick={submit}><Icon name="check" /> อนุมัติ</button>
            : <button className="btn danger" onClick={submit}>ยืนยันปฏิเสธ</button>}
        </div>
      </div>
    </>
  );
}

// ─── หน้า เบิกเงิน / คืนเงิน ────────────────────────────────────────
function DepCounterVaultPage({ onToast, mode = 'counter', embedded = false, onlyCounter = null }) {
  const me = window.depCtMe();
  const view = mode;   // counter (เมนูเงินฝาก) | finance (เมนูการเงิน)
  const [sessions, setSessions] = useState(() => window.depCtLoadAll());
  const [list, setList] = useState(() => window.depCtVaultLoad());
  const [req, setReq] = useState(null);          // { code, mode }
  const [fin, setFin] = useState(null);          // { id, mode }
  !embedded && window.useBreadcrumb && window.useBreadcrumb([{ label: mode === 'finance' ? 'อนุมัติเบิก/คืนเงินเคาน์เตอร์' : 'เบิกเงิน/คืนเงิน', current: true }], [mode]);

  React.useEffect(() => {
    const sync = () => { setSessions(window.depCtLoadAll()); setList(window.depCtVaultLoad()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const save = (next) => { window.depCtVaultSave(next); setList(next); };
  const patch = (id, p) => save(list.map(x => x.id === id ? { ...x, ...p } : x));
  const now = () => window.depCtNow();

  const ready = window.DEP_COUNTERS.map(c => sessions[c.code]).filter(s => s && s.status === 'open' && s.cashVerified);
  const isMine = (s) => s && (s.tellerId ? s.tellerId === me.id : s.teller === me.name);
  const mine = ready.filter(isMine).filter(s => !onlyCounter || s.counter === onlyCounter).sort((a, b) => String(a.openedAt).localeCompare(String(b.openedAt)));
  const live = (x) => sessions[x.counter] && sessions[x.counter].openedAt === x.session;
  const today = list.filter(live);

  const createReq = ({ amount, note }) => {
    const s = sessions[req.code];
    const t = now();
    const rec = { id: 'VR' + String(Date.now()).slice(-8), kind: req.mode, counter: s.counter, session: s.openedAt,
                  amount, note, status: 'pending', requestedBy: me.name,
                  reqAt: t.iso, reqDate: t.date, reqTime: t.time };
    save([...list, rec]); setReq(null);
    window.depSuccess({ title: 'ส่งคำขอเรียบร้อยแล้ว', desc: 'ส่งคำขอ' + dvKindLabel(req.mode) + ' ' + fmt.money(amount, 2) + ' บาท เรียบร้อยแล้ว', next: 'รอหัวหน้าอนุมัติคำขอ' });
  };
  const finApprove = ({ amount, note, by }) => {
    const t = now();
    patch(fin.id, { status: 'approved', approvedAmount: amount, finNote: note, approvedBy: by || me.name, apDate: t.date, apTime: t.time });
    setFin(null); onToast && onToast('อนุมัติคำขอแล้ว — รอหน้าเคาน์เตอร์ยืนยัน');
  };
  const finReject = ({ reason, by }) => {
    const t = now();
    patch(fin.id, { status: 'rejected', rejectReason: reason, approvedBy: by || me.name, apDate: t.date, apTime: t.time });
    setFin(null); onToast && onToast('ปฏิเสธคำขอแล้ว');
  };
  const counterConfirm = (x) => {
    const s = sessions[x.counter];
    if (x.kind === 'return' && dvAmt(x) > window.depCtCashNow(s) + 0.005)
      return onToast && onToast('เงินในเครื่องไม่พอสำหรับยอดคืนนี้');
    const t = now();
    patch(x.id, { status: 'done', doneBy: me.name, doneDate: t.date, doneTime: t.time });
    onToast && onToast(x.kind === 'withdraw' ? 'ยืนยันรับเงินเข้าเคาน์เตอร์แล้ว' : 'ยืนยันส่งเงินคืนหัวหน้าแล้ว');
  };

  const Table = ({ rows, finance }) => (
    <div className="table-wrap" style={{ marginTop: 12, overflowX: 'auto' }}>
      <table className="tbl" style={{ minWidth: finance ? 820 : 760 }}>
        <thead>
          <tr>
            <th className="center" style={{ width: 52 }}>ลำดับ</th>
            <th>เลขที่คำขอ</th>
            <th>เวลา</th>
            {finance && <th>เคาน์เตอร์ / ผู้ขอ</th>}
            <th>ประเภท</th>
            <th className="right">ยอดที่ขอ</th>
            <th className="right">ยอดที่อนุมัติ</th>
            <th>สถานะ</th>
            {finance ? <th>ผู้อนุมัติ</th> : <th>หมายเหตุหัวหน้า</th>}
            <th className="center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={finance ? 10 : 9} className="empty-state">{finance ? 'ไม่มีคำขอในวันนี้' : 'ยังไม่มีรายการเบิก/คืนของเคาน์เตอร์นี้'}</td></tr>
          ) : rows.map((x, i) => {
            const s = sessions[x.counter];
            const [pc, pl] = DV_STATUS[x.status] || ['', x.status];
            const off = x.status === 'rejected' || x.status === 'cancelled';
            return (
              <tr key={x.id} className={off ? 'dat-off' : undefined}>
                <td className="center muted">{rows.length - i}</td>
                <td className="mono">{x.id}</td>
                <td className="mono">{x.reqTime} น.</td>
                {finance && <td>{s ? <><span className="mono">{s.code}</span> · {x.requestedBy}</> : x.requestedBy}</td>}
                <td>{dvKindLabel(x.kind)}</td>
                <td className="right mono">{fmt.money(x.amount, 2)}</td>
                <td className="right mono">{x.approvedAmount != null ? fmt.money(x.approvedAmount, 2) : '—'}</td>
                <td><span className={'pill ' + pc}>{pl}</span></td>
                {finance ? <td>{x.approvedBy || <span className="muted">—</span>}</td> : <td className="muted">{x.rejectReason || x.finNote || '—'}</td>}
                <td className="center">
                  {finance && x.status === 'pending' ? (
                    <div className="col-gap" style={{ justifyContent: 'center' }}>
                      <button className="btn sm" onClick={() => setFin({ id: x.id, mode: 'reject' })}>ปฏิเสธ</button>
                      <button className="btn primary sm" onClick={() => setFin({ id: x.id, mode: 'approve' })}>อนุมัติ</button>
                    </div>
                  ) : !finance && x.status === 'approved' ? (
                    <button className="btn primary sm" onClick={() => counterConfirm(x)}>
                      <Icon name="check" size={13} /> {x.kind === 'withdraw' ? 'ยืนยันรับเงิน' : 'ยืนยันส่งเงิน'}
                    </button>
                  ) : !finance && x.status === 'pending' ? (
                    <button className="btn sm" onClick={() => patch(x.id, { status: 'cancelled' })}>ยกเลิก</button>
                  ) : <span className="muted">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const pendingAll = today.filter(x => x.status === 'pending');

  return (
    <div data-screen-label={view === 'finance' ? 'อนุมัติเบิก/คืนเงินเคาน์เตอร์' : 'เบิกเงิน/คืนเงิน'}>
      {!embedded && <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{view === 'finance' ? 'อนุมัติเบิก/คืนเงินเคาน์เตอร์' : 'เบิกเงิน/คืนเงิน'}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {view === 'finance'
              ? 'สำหรับหัวหน้า — อนุมัติคำขอเบิกเงินตั้งต้น/เบิกเพิ่มของเคาน์เตอร์ และรับเงินคืนจากเคาน์เตอร์ ด้วยรหัสยืนยันของหัวหน้า ปรับยอดหรือปฏิเสธพร้อมเหตุผลได้'
              : 'เบิกเงินเมื่อเงินหน้าเคาน์เตอร์ไม่พอ หรือคืนเงินเมื่อมีมากเกินไป — ทุกคำขอต้องให้หัวหน้าอนุมัติ และจะถูกนำไปคิดตอนปิดเคาน์เตอร์'}
          </div>
        </div>
      </div>}

      {view === 'finance' ? (
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h3>คำขอเบิก/คืนเงินจากเคาน์เตอร์</h3>
            <div className="head-actions">
              <span className="pill warn">รออนุมัติ {pendingAll.length} รายการ</span>
            </div>
          </div>
          <Table rows={today.slice().reverse()} finance />
        </div>
      ) : mine.length === 0 ? (embedded ? null :
        <div className="search-card">
          <div style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div className="gc-modal-ico" style={{ margin: '0 auto 14px' }}><Icon name="wallet" size={20} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>ยังไม่มีเคาน์เตอร์ที่พร้อมทำรายการ</div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>
              ต้องเปิดเคาน์เตอร์และรับเงินตั้งต้นจากหัวหน้าที่เมนู <b>เปิดเคาน์เตอร์</b> ก่อน จึงจะเบิกหรือคืนเงินได้
            </div>
            <button className="btn primary" onClick={() => { window.location.hash = '#deposit/counter-open'; }}>
              <Icon name="chevRight" size={14} /> ไปหน้าเปิดเคาน์เตอร์
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr)' }}>
          {mine.map(s => {
            const rows = today.filter(x => x.counter === s.counter).slice().reverse();
            const done = rows.filter(x => x.status === 'done');
            const wd = done.filter(x => x.kind === 'withdraw').reduce((a, x) => a + dvAmt(x), 0);
            const rt = done.filter(x => x.kind === 'return').reduce((a, x) => a + dvAmt(x), 0);
            const waiting = rows.filter(x => x.status === 'approved').length;
            return (
              <div className="search-card" key={s.counter}>
                <div className="section-head" style={{ marginBottom: 12 }}>
                  <h3>{embedded ? 'เบิก / คืนเงินกับหัวหน้า' : window.depCtName(s.counter)}</h3>
                  <div className="head-actions">
                    {!embedded && <span className="chip primary"><span className="mono">{s.code}</span></span>}
                    {waiting > 0 && <span className="pill info">รอคุณยืนยัน {waiting} รายการ</span>}
                  </div>
                </div>
                {!embedded && <div className="dl-kpis">
                  <div className="dl-kpi"><span>เงินในเครื่องปัจจุบัน</span><b className="mono">{fmt.money(window.depCtCashNow(s), 2)}</b></div>
                  <div className="dl-kpi"><span>เบิกเข้าวันนี้</span><b className="mono" style={{ color: 'var(--brand, #237450)' }}>{fmt.money(wd, 2)}</b></div>
                  <div className="dl-kpi"><span>คืนหัวหน้าวันนี้</span><b className="mono" style={{ color: 'var(--info, #1677ff)' }}>{fmt.money(rt, 2)}</b></div>
                  <div className="dl-kpi"><span>คำขอที่ยังไม่เสร็จ</span><b className="mono">{rows.filter(x => x.status === 'pending' || x.status === 'approved').length}</b></div>
                </div>}
                <Table rows={rows} />
                <div className="page-actions" style={{ marginTop: 12, marginBottom: 0, justifyContent: 'flex-end' }}>
                  <button className="btn sm ct-btn-return" onClick={() => setReq({ code: s.counter, mode: 'return' })}>
                    <Icon name="upload" size={13} /> ขอคืนเงิน
                  </button>
                  <button className="btn sm ct-btn-withdraw" onClick={() => setReq({ code: s.counter, mode: 'withdraw' })}>
                    <Icon name="download" size={13} /> ขอเบิกเงิน
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {req && <DvRequestModal session={sessions[req.code]} mode={req.mode} onClose={() => setReq(null)} onConfirm={createReq} />}
      {fin && (() => {
        const x = list.find(r => r.id === fin.id);
        return x ? <DvFinanceModal req={x} session={sessions[x.counter]} mode={fin.mode}
                                   onClose={() => setFin(null)} onApprove={finApprove} onReject={finReject} /> : null;
      })()}
    </div>
  );
}

Object.assign(window, { DepCounterVaultPage });
