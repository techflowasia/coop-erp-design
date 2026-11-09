// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน — การทำงาน: อนุมัติจ่ายสินเชื่อ (LoanDisbursementApprovalPage)
//  ขั้นสุดท้ายของการอนุมัติสินเชื่อ — ข้อมูลที่วิ่งเข้ามา = ใบคำขอกู้ที่
//  ผ่าน "อนุมัติสินเชื่อ" แล้ว รอเจ้าหน้าที่การเงินอนุมัติ "จ่าย"
//   • อนุมัติจ่ายทีละรายการ / หลายรายการ / ทั้งหมด · ยิงบาร์โค้ด
//   • ไม่อนุมัติจ่าย (ต้องระบุสาเหตุ) → Order วิ่งกลับไปยังผู้ทำรายการ
//     เพื่อปรับแก้ไข แล้วเข้ากระบวนการอนุมัติใหม่อีกครั้ง
//  พฤติกรรม/คลาส ใช้ร่วมกับหน้า "อนุมัติสินเชื่อ" (.dba-*/.wa-*/.la-*/.lt-*)
// ════════════════════════════════════════════════════════════════════

// ── สรุปผลตรวจเอกสารจ่าย (chip) ────────────────────────────────────
function ldChecksPill(rec) {
  const fail = (rec.checks || []).filter(c => !c.ok).length;
  return fail > 0
    ? <span className="chip warning">ติดเงื่อนไข {fail}</span>
    : <span className="chip success">พร้อมจ่าย</span>;
}

// ── แถบสรุปวิธีจ่าย (ใช้ในตาราง/เอกสาร) ─────────────────────────────
function ldPayCell(rec) {
  const pm = window.ldPayMethod(rec.payMethod);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Icon name={pm.icon} size={12} /> {pm.l}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — ไม่อนุมัติจ่าย (ระบุสาเหตุ → ส่งกลับผู้ทำรายการแก้ไข)
// ════════════════════════════════════════════════════════════════════
function LdRejectModal({ items, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const multi = items.length > 1;
  const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);

  const submit = () => {
    if (!reason.trim()) { setErr('กรุณาระบุสาเหตุการไม่อนุมัติจ่าย'); return; }
    onConfirm(items, reason.trim());
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
            <Icon name="close" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>ไม่อนุมัติจ่าย{multi ? ` (${items.length} รายการ)` : ''}</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>
              {multi
                ? `${items.length} ใบคำขอ · รวม ฿${window.fmt.money(total, 0)}`
                : `${items[0].id} · ${items[0].memberName} · ฿${window.fmt.money(items[0].amount, 0)}`}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="dba-sec-head" style={{ marginBottom: 8 }}>สาเหตุการไม่อนุมัติจ่าย <span style={{ color: 'var(--danger)' }}>*</span></div>
          <textarea className="cfg-input" rows={3} value={reason} autoFocus
                    onChange={(e) => { setReason(e.target.value); setErr(''); }}
                    placeholder="ระบุสาเหตุ/ข้อที่ต้องแก้ไข — ข้อความนี้จะแนบไปกับ Order ที่ส่งกลับให้ผู้ทำรายการ" />
          {err && <div className="sr-hint" style={{ color: 'var(--danger)', marginTop: 6 }}><Icon name="info" size={11} /> {err}</div>}

          <div className="la-disp-list" style={{ marginTop: 16 }}>
            <div className="la-disp active" style={{ cursor: 'default' }}>
              <span className="la-disp-ico" style={{ color: 'var(--info)' }}><Icon name="refresh" size={16} /></span>
              <span className="la-disp-txt">
                <span className="la-disp-title">ส่งกลับให้ผู้ทำรายการแก้ไข → เข้ากระบวนการอนุมัติใหม่</span>
                <span className="la-disp-desc">Order วิ่งกลับไปยังเจ้าหน้าที่ที่บันทึกข้อมูล เพื่อปรับปรุงข้อมูลตามสาเหตุข้างต้น แล้วยื่นเข้าอนุมัติสินเชื่อและอนุมัติจ่ายใหม่อีกครั้ง</span>
              </span>
            </div>
          </div>
        </div>

        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn danger" onClick={submit}>
            <Icon name="refresh" size={13} /> ไม่อนุมัติจ่าย · ส่งกลับแก้ไข
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — ยืนยันอนุมัติจ่าย (รายการเดียว/หลายรายการ)
// ════════════════════════════════════════════════════════════════════
function LdApproveModal({ items, onClose, onConfirm }) {
  const total = items.reduce((s, x) => s + Number(x.netReceive || x.amount || 0), 0);
  const failing = items.filter(x => (x.checks || []).some(c => !c.ok));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="check" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันอนุมัติจ่าย ({items.length} รายการ)</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>รวมยอดจ่ายสุทธิ ฿{window.fmt.money(total, 0)}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {failing.length > 0 && (
            <div className="sr-elig-warn" style={{ marginBottom: 12 }}>
              <Icon name="info" size={14} /> มี {failing.length} รายการที่ติดเงื่อนไขเอกสารจ่าย — โปรดตรวจสอบก่อนอนุมัติจ่าย
            </div>
          )}
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead><tr><th>เลขที่ใบคำขอ</th><th>สมาชิก</th><th>วิธีจ่าย</th><th className="num">ยอดจ่ายสุทธิ</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.memberName}</td>
                    <td>{ldPayCell(r)}</td>
                    <td className="num mono">{window.fmt.money(r.netReceive || r.amount, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={() => onConfirm(items)}><Icon name="check" size={13} /> ยืนยันอนุมัติจ่าย {items.length} รายการ</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — ยิงบาร์โค้ดเลขใบคำขอกู้ แล้วอนุมัติจ่าย/ไม่อนุมัติทั้งหมด
// ════════════════════════════════════════════════════════════════════
function LdBarcodeModal({ pool, onClose, onApprove, onReject }) {
  const [code, setCode] = useState('');
  const [scanned, setScanned] = useState([]);
  const [msg, setMsg] = useState(null);
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);
  const norm = (s) => String(s || '').trim().toUpperCase();

  const scan = () => {
    const v = norm(code);
    setCode('');
    if (!v) return;
    const rec = pool.find(x => norm(x.id) === v || norm(x.crmRef) === v);
    if (!rec) { setMsg({ kind: 'err', text: `ไม่พบใบคำขอเลขที่ ${v}` }); return; }
    if (rec.status !== 'pending') { setMsg({ kind: 'warn', text: `${rec.id} ถูกพิจารณาแล้ว (${window.ldStatus(rec.status).l}) — ข้าม` }); return; }
    if (scanned.some(x => x.id === rec.id)) { setMsg({ kind: 'warn', text: `${rec.id} ถูกยิงไปแล้ว` }); return; }
    setScanned(s => [...s, rec]);
    setMsg({ kind: 'ok', text: `เพิ่ม ${rec.id} · ${rec.memberName}` });
  };

  const removeItem = (id) => setScanned(s => s.filter(x => x.id !== id));
  const total = scanned.reduce((s, x) => s + Number(x.netReceive || x.amount || 0), 0);
  const msgColor = msg ? (msg.kind === 'ok' ? 'var(--success)' : msg.kind === 'warn' ? 'var(--warning)' : 'var(--danger)') : '';

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 600, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="barcode" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>อนุมัติจ่ายด้วยบาร์โค้ด</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>ยิงบาร์โค้ดเลขที่ใบคำขอกู้เงิน — ระบบจะรวบรวมรายการเพื่ออนุมัติจ่าย/ไม่อนุมัติพร้อมกัน</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="la-scan-box">
            <Icon name="barcode" size={20} />
            <input ref={inputRef} className="cfg-input la-scan-input" value={code}
                   placeholder="ยิงบาร์โค้ด หรือพิมพ์เลขที่ใบคำขอ แล้วกด Enter"
                   onChange={(e) => { setCode(e.target.value); setMsg(null); }}
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); scan(); } }} />
            <button className="btn primary sm" onClick={scan}>เพิ่ม</button>
          </div>
          {msg && <div className="la-scan-msg" style={{ color: msgColor }}><Icon name={msg.kind === 'ok' ? 'check' : 'info'} size={12} /> {msg.text}</div>}

          <div className="dba-sec-head" style={{ margin: '14px 0 8px' }}>
            รายการที่ยิงแล้ว <span className="muted" style={{ fontWeight: 400 }}>({scanned.length} รายการ · จ่ายสุทธิ ฿{window.fmt.money(total, 0)})</span>
          </div>
          {scanned.length === 0 ? (
            <div className="empty-state" style={{ padding: '22px 0' }}>
              <div style={{ marginBottom: 4 }}><Icon name="barcode" size={22} /></div>
              ยังไม่มีรายการ — ยิงบาร์โค้ดเลขที่ใบคำขอกู้เงินเพื่อเริ่ม
            </div>
          ) : (
            <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 240 }}>
              <table className="tbl">
                <thead><tr><th>เลขที่ใบคำขอ</th><th>สมาชิก</th><th className="num">จ่ายสุทธิ</th><th className="center">เอกสาร</th><th style={{ width: 40 }} /></tr></thead>
                <tbody>
                  {scanned.map(r => (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td>{r.memberName}</td>
                      <td className="num mono">{window.fmt.money(r.netReceive || r.amount, 0)}</td>
                      <td className="center">{ldChecksPill(r)}</td>
                      <td className="center"><button className="lrq-delbtn act-del" title="นำออก" onClick={() => removeItem(r.id)}><Icon name="trash" size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          )}
        </div>

        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <span className="spacer" />
          <button className="btn danger" disabled={scanned.length === 0} onClick={() => onReject(scanned)}>
            <Icon name="refresh" size={13} /> ไม่อนุมัติ · ส่งกลับ ({scanned.length})
          </button>
          <button className="btn primary" disabled={scanned.length === 0} onClick={() => onApprove(scanned)}>
            <Icon name="check" size={13} /> อนุมัติจ่ายทั้งหมด ({scanned.length})
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — แจ้งผลการทำรายการสำเร็จ
// ════════════════════════════════════════════════════════════════════
function LdResultModal({ result, onClose }) {
  const { kind, items } = result;   // kind: 'approved' | 'rejected'
  const approved = kind === 'approved';
  const total = items.reduce((s, x) => s + Number(x.netReceive || x.amount || 0), 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 540, maxWidth: '95vw' }}>
        <div className="modal-body" style={{ paddingTop: 22 }}>
          <div className="la-result-head">
            <div className={'la-result-badge ' + (approved ? 'ok' : 'bad')}>
              <Icon name={approved ? 'check' : 'refresh'} size={26} />
            </div>
            <h2 className="la-result-title">ทำรายการสำเร็จ</h2>
            <div className="la-result-sub">
              {approved
                ? <>อนุมัติจ่ายทั้งหมด <b>{items.length}</b> รายการ · รวมจ่ายสุทธิ ฿{window.fmt.money(total, 0)}</>
                : <>ไม่อนุมัติจ่าย <b>{items.length}</b> รายการ · ส่งกลับให้ผู้ทำรายการแก้ไข</>}
            </div>
          </div>

          <div className="dba-sec-head" style={{ margin: '4px 0 8px' }}>รายการที่{approved ? 'อนุมัติจ่าย' : 'ส่งกลับ'}</div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 280 }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 34 }} className="center">#</th><th>เลขที่ใบคำขอ</th><th>สมาชิก</th><th className="num">{approved ? 'จ่ายสุทธิ' : 'วงเงิน'}</th></tr></thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono">{r.id}</td>
                    <td>{r.memberName}<div className="muted mono" style={{ fontSize: 10.5 }}>{r.memberCode}</div></td>
                    <td className="num mono">{window.fmt.money(approved ? (r.netReceive || r.amount) : r.amount, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <span className="spacer" />
          <button className="btn primary" onClick={onClose}><Icon name="check" size={13} /> รับทราบ</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — รายการรออนุมัติจ่ายสินเชื่อ
// ════════════════════════════════════════════════════════════════════
function LoanDisbursementApprovalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.ldLoad);
  const [statusF, setStatusF] = useState('pending');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [viewRec, setViewRec] = useState(null);
  const [rejectItems, setRejectItems] = useState(null);
  const [approveItems, setApproveItems] = useState(null);
  const [barcode, setBarcode] = useState(false);
  const [result, setResult] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const reload = () => setList(window.ldLoad());

  const rows = useMemo(() => {
    let r = list;
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) || x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) || (x.crmRef || '').toLowerCase().includes(n) ||
                        (x.productName || '').toLowerCase().includes(n));
    }
    return [...r].sort((a, b) =>
      (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
      (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1) ||
      (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  }, [list, statusF, q]);

  const pending = list.filter(x => x.status === 'pending');
  const urgentCnt = pending.filter(x => x.priority === 'urgent').length;
  const pendingAmt = pending.reduce((s, x) => s + Number(x.netReceive || x.amount || 0), 0);

  const pendingRows = rows.filter(r => r.status === 'pending');
  const selItems = rows.filter(r => sel.has(r.id) && r.status === 'pending');
  const clearSel = () => setSel(new Set());
  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── อนุมัติจ่าย ──
  const doApprove = (items) => {
    items.forEach(rec => window.ldSaveDecision(rec.id, {
      status: 'approved', decidedBy: window.LD_APPROVER, decidedDate: today,
      remark: 'อนุมัติจ่ายตามหลักเกณฑ์ — ' + window.ldPayMethod(rec.payMethod).l,
    }));
    reload(); clearSel(); setApproveItems(null); setViewRec(null); setBarcode(false);
    const sum = items.reduce((s, x) => s + Number(x.netReceive || x.amount || 0), 0);
    audit.log && audit.log({
      action: 'approve', module: 'การเงิน — อนุมัติจ่ายสินเชื่อ',
      target: items.length > 1 ? `${items.length} ใบคำขอ` : `${items[0].id} · ${items[0].memberName}`,
      summary: `อนุมัติจ่ายสินเชื่อ ${items.length} รายการ · รวมจ่ายสุทธิ ฿${window.fmt.money(sum, 0)}`,
      changes: items.map(it => ({ field: it.id, before: 'รออนุมัติจ่าย', after: 'อนุมัติจ่ายแล้ว · ฿' + window.fmt.money(it.netReceive || it.amount, 0) })),
    });
    setResult({ kind: 'approved', items });
    onToast && onToast(`อนุมัติจ่ายสินเชื่อ ${items.length} รายการเรียบร้อยแล้ว`);
  };

  // ── ไม่อนุมัติจ่าย → ส่งกลับผู้ทำรายการแก้ไข ──
  const doReject = (items, reason) => {
    items.forEach(rec => window.ldSaveDecision(rec.id, {
      status: 'returned', decidedBy: window.LD_APPROVER, decidedDate: today, remark: reason,
    }));
    reload(); clearSel(); setRejectItems(null); setViewRec(null); setBarcode(false);
    audit.log && audit.log({
      action: 'reject', module: 'การเงิน — อนุมัติจ่ายสินเชื่อ',
      target: items.length > 1 ? `${items.length} ใบคำขอ` : `${items[0].id} · ${items[0].memberName}`,
      summary: `ไม่อนุมัติจ่ายสินเชื่อ ${items.length} รายการ · ส่งกลับให้ผู้ทำรายการแก้ไข`,
      changes: [
        { field: 'ผลการพิจารณา', before: 'รออนุมัติจ่าย', after: 'ไม่อนุมัติจ่าย · ส่งกลับให้แก้ไข' },
        { field: 'สาเหตุ', before: '—', after: reason },
      ],
    });
    setResult({ kind: 'rejected', items });
    onToast && onToast(`ส่งกลับ ${items.length} รายการให้ผู้ทำรายการแก้ไข`);
  };

  const allPendingSelected = pendingRows.length > 0 && pendingRows.every(r => sel.has(r.id));

  // Breadcrumb: หน้าหลัก › อนุมัติจ่ายสินเชื่อ › [รายละเอียด]
  window.useBreadcrumb(
    viewRec
      ? [{ label: 'อนุมัติจ่ายสินเชื่อ', onClick: () => setViewRec(null) }, { label: 'รายละเอียดใบคำขอกู้ ' + viewRec.id, current: true }]
      : [{ label: 'อนุมัติจ่ายสินเชื่อ', current: true }],
    [!!viewRec, viewRec && viewRec.id]
  );

  const sharedModals = (
    <>
      {approveItems && <LdApproveModal items={approveItems} onClose={() => setApproveItems(null)} onConfirm={doApprove} />}
      {rejectItems && <LdRejectModal items={rejectItems} onClose={() => setRejectItems(null)} onConfirm={doReject} />}
      {barcode && <LdBarcodeModal pool={list} onClose={() => setBarcode(false)}
                                  onApprove={(items) => { setBarcode(false); setApproveItems(items); }}
                                  onReject={(items) => { setBarcode(false); setRejectItems(items); }} />}
      {result && <LdResultModal result={result} onClose={() => setResult(null)} />}
    </>
  );

  // ── ดูรายละเอียด: แสดงหน้าจอใบคำขอกู้เงินฉบับเต็ม (อ่านอย่างเดียว) ──
  if (viewRec) {
    const st = window.ldStatus(viewRec.status);
    const pendingView = viewRec.status === 'pending';
    const pm = window.ldPayMethod(viewRec.payMethod);
    return (
      <>
        <div data-screen-label="อนุมัติจ่ายสินเชื่อ — รายละเอียดใบคำขอกู้">
          {/* แถบข้อมูลการจ่าย (เฉพาะหน้าอนุมัติจ่าย) */}
          <div className="search-card" style={{ marginBottom: 12 }}>
            <div className="section-head"><span className="head-bar" /><h3>รายละเอียดการจ่ายเงินกู้</h3></div>
            <div className="dba-kv-list">
              <div className="dba-kv"><span className="dba-kv-k">วิธีการจ่าย</span><span className="dba-kv-v"><Icon name={pm.icon} size={13} /> {pm.l}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">ธนาคาร / ปลายทาง</span><span className="dba-kv-v">{viewRec.payBank || '—'}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">เลขบัญชี / เลขเช็ค</span><span className="dba-kv-v mono">{viewRec.payAccount || '—'}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">รอบจ่าย (Lot)</span><span className="dba-kv-v mono">{viewRec.payLot || '—'}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">วงเงินอนุมัติ</span><span className="dba-kv-v mono">฿{window.fmt.money(viewRec.amount, 0)}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">ค่าธรรมเนียม/หักกลบ</span><span className="dba-kv-v mono">฿{window.fmt.money((viewRec.amount || 0) - (viewRec.netReceive || 0), 0)}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">ยอดจ่ายสุทธิ</span><span className="dba-kv-v mono hl">฿{window.fmt.money(viewRec.netReceive || viewRec.amount, 0)}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">ผ่านอนุมัติสินเชื่อโดย</span><span className="dba-kv-v">{viewRec.loanApprovedBy || '—'}{viewRec.loanApprovedDate ? ' · ' + window.fmt.date(viewRec.loanApprovedDate) : ''}</span></div>
            </div>
          </div>
          <LoanRequestForm
            reviewMode
            initial={window.ldToForm(viewRec)}
            statusBadge={{ l: st.l, pill: st.pill }}
            decision={pendingView ? null : { l: st.l, pill: st.pill, by: viewRec.decidedBy }}
            onBack={() => setViewRec(null)}
            onToast={onToast}
            approveLabel="อนุมัติจ่าย"
            rejectLabel="ไม่อนุมัติจ่าย"
            rejectIcon="refresh"
            onApprove={() => setApproveItems([viewRec])}
            onReject={() => setRejectItems([viewRec])}
          />
        </div>
        {sharedModals}
      </>
    );
  }

  return (
    <div data-screen-label="หน้าอนุมัติจ่ายสินเชื่อ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติจ่ายสินเชื่อ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ใบคำขอกู้ที่ผ่านการอนุมัติสินเชื่อแล้ว รอเจ้าหน้าที่การเงินอนุมัติจ่าย (ขั้นตอนสุดท้าย) — เลือกอนุมัติทีละรายการ/หลายรายการ/ทั้งหมด · ไม่อนุมัติต้องระบุสาเหตุแล้วส่ง Order กลับให้ผู้ทำรายการแก้ไขเพื่อเข้ากระบวนการอนุมัติใหม่
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={() => setBarcode(true)}>
          <Icon name="barcode" /> ยิงบาร์โค้ด
        </button>
        <button className="btn primary" disabled={pendingRows.length === 0}
                onClick={() => setApproveItems(pendingRows)}>
          <Icon name="check" /> อนุมัติจ่ายทั้งหมด ({pendingRows.length})
        </button>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่ใบคำขอ / CRM / สมาชิก / ประเภทเงินกู้</span>
            <div className="search" style={{ flex: 'none', width: 320, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา…" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => { setStatusF(e.target.value); clearSel(); }} style={{ width: 190 }}>
              <option value="all">ทุกสถานะ</option>
              {window.LD_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {selItems.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selItems.length}</b> รายการที่เลือก</span>
            <span className="muted">· จ่ายสุทธิ ฿{window.fmt.money(selItems.reduce((s, x) => s + Number(x.netReceive || x.amount || 0), 0), 0)}</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setApproveItems(selItems)}><Icon name="check" size={12} /> อนุมัติจ่ายที่เลือก ({selItems.length})</button>
            <button className="btn danger sm" onClick={() => setRejectItems(selItems)}><Icon name="refresh" size={12} /> ไม่อนุมัติที่เลือก ({selItems.length})</button>
            <button className="btn text sm" onClick={clearSel}>ยกเลิกการเลือก</button>
          </div>
        )}

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }} className="center">
                  <input type="checkbox" className="wa-chk" checked={allPendingSelected}
                         onChange={(e) => setSel(e.target.checked ? new Set(pendingRows.map(r => r.id)) : new Set())} />
                </th>
                <th>เลขที่ใบคำขอ</th>
                <th>ประเภทเงินกู้</th>
                <th>สมาชิก</th>
                <th>วิธีจ่าย</th>
                <th className="num">วงเงิน / จ่ายสุทธิ</th>
                <th className="center">เอกสาร</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 280, whiteSpace: 'nowrap' }}>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="check" size={24} /></div>
                  ไม่มีใบคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const p = window.ldProduct(r);
                const st = window.ldStatus(r.status);
                const isPending = r.status === 'pending';
                return (
                  <tr key={r.id} className={'clickable' + (sel.has(r.id) ? ' wa-row-sel' : '')} onClick={() => setViewRec(r)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {isPending && <input type="checkbox" className="wa-chk" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} />}
                    </td>
                    <td>
                      <div className="mono">{r.id}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.crmRef} · {r.submittedAt}</div>
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{p.code} — {p.name}</div>
                      <div className="muted" style={{ fontSize: 10.5 }}>{r.purposeLabel}</div>
                      {r.priority === 'urgent' && isPending && <span className="chip danger" style={{ fontSize: 10, marginTop: 3 }}>เร่งด่วน</span>}
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.memberCode} · {r.dept}</div>
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{ldPayCell(r)}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.payBank} · {r.payAccount}</div>
                    </td>
                    <td className="num">
                      <div className="mono" style={{ fontWeight: 600 }}>{window.fmt.money(r.netReceive || r.amount, 0)}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>วงเงิน {window.fmt.money(r.amount, 0)}</div>
                    </td>
                    <td className="center">{ldChecksPill(r)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'nowrap' }}>
                          <button className="btn sm" onClick={() => setViewRec(r)}><Icon name="eye" size={12} /> ดู</button>
                          <button className="btn primary sm" onClick={() => setApproveItems([r])}><Icon name="check" size={12} /> อนุมัติจ่าย</button>
                          <button className="btn danger sm" onClick={() => setRejectItems([r])}><Icon name="refresh" size={12} /> ส่งกลับ</button>
                        </div>
                      ) : (
                        <button className="btn text sm" onClick={() => setViewRec(r)}>ดูผลพิจารณา</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อเปิดเอกสารสรุปใบคำขอฉบับเต็ม · เลือกหลายรายการเพื่ออนุมัติจ่าย/ไม่อนุมัติพร้อมกัน · การไม่อนุมัติจ่ายจะส่ง Order กลับให้ผู้ทำรายการแก้ไขแล้วเข้ากระบวนการอนุมัติใหม่
        </p>
      </div>

      {sharedModals}
    </div>
  );
}

Object.assign(window, { LoanDisbursementApprovalPage });
