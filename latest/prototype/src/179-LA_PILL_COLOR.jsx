// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: อนุมัติสินเชื่อ (LoanApprovalPage)
//  แสดงใบคำขอกู้ที่รออนุมัติทั้งหมด → เจ้าหน้าที่ผู้อนุมัติ:
//   • เลือกอนุมัติทีละรายการ / หลายรายการ / ทั้งหมด
//   • ไม่อนุมัติ (ต้องระบุสาเหตุ) → ส่งกลับผู้ทำรายการให้แก้ไข หรือปิดการทำงาน
//   • เรียกดูรายละเอียดใบคำขอแต่ละรายการ (เอกสารสรุปฉบับเต็ม)
//  ใช้คลาสร่วมกับหน้าอนุมัติอื่น (.dba-* / .wa-*) และ DS record-detail (.lt-*)
// ════════════════════════════════════════════════════════════════════

const LA_PILL_COLOR = {
  ok: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)',
  info: 'var(--info)', neutral: 'var(--text-faint, #9aa3ab)', primary: 'var(--primary)',
};

// ── สรุปผลตรวจคุณสมบัติ (chip) ──────────────────────────────────────
function laChecksPill(rec) {
  const fail = (rec.checks || []).filter(c => !c.ok).length;
  return fail > 0
    ? <span className="chip warning">ติดเงื่อนไข {fail}</span>
    : <span className="chip success">ผ่านเกณฑ์</span>;
}

// ── สถานะที่แสดงผล — เคส Authorization (special) เน้นสีแดงให้สะดุดตา ──
function laStatusDisplay(rec) {
  if (rec.status === 'special') return { l: 'รอนุมัติคำขอพิเศษ', pill: 'bad' };
  return window.laReqStatus(rec.status);
}
const LA_STATUS_TABS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'waitapprove', label: 'อนุมัติปกติ' },
  { id: 'special', label: 'รอนุมัติคำขอพิเศษ' },
];

// ════════════════════════════════════════════════════════════════════
//  Modal — ไม่อนุมัติ (ระบุสาเหตุ + เลือกทางเดินของ Order)
// ════════════════════════════════════════════════════════════════════
function LaRejectModal({ items, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [disposition, setDisposition] = useState('returned');
  const [err, setErr] = useState('');
  const multi = items.length > 1;
  const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);

  const submit = () => {
    if (!reason.trim()) { setErr('กรุณาระบุสาเหตุการไม่อนุมัติ'); return; }
    onConfirm(items, disposition, reason.trim());
  };

  const DISPOSITIONS = [
    { v: 'returned', icon: 'refresh', title: 'ส่งกลับให้ผู้ทำรายการแก้ไข',
      desc: 'Order วิ่งกลับไปยังผู้ทำรายการต้นทาง เพื่อปรับปรุงข้อมูลและยื่นเข้าอนุมัติใหม่' },
    { v: 'closed', icon: 'close', title: 'ปิดการทำงาน (ยุติคำขอ)',
      desc: 'ยุติใบคำขอกู้นี้ — ไม่ส่งกลับ ผู้ทำรายการต้องสร้างคำขอใหม่หากต้องการดำเนินการต่อ' },
  ];

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}>
            <Icon name="close" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>ไม่อนุมัติคำขอ{multi ? ` (${items.length} รายการ)` : ''}</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>
              {multi
                ? `${items.length} ใบคำขอ · รวม ฿${window.fmt.money(total, 0)}`
                : `${items[0].id} · ${items[0].memberName} · ฿${window.fmt.money(items[0].amount, 0)}`}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="dba-sec-head" style={{ marginBottom: 8 }}>สาเหตุการไม่อนุมัติ <span style={{ color: 'var(--danger)' }}>*</span></div>
          <textarea className="cfg-input" rows={3} value={reason} autoFocus
                    onChange={(e) => { setReason(e.target.value); setErr(''); }}
                    placeholder="ระบุสาเหตุ/ความเห็นการไม่อนุมัติ — ข้อความนี้จะแนบไปกับใบคำขอที่ส่งกลับ" />
          {err && <div className="sr-hint" style={{ color: 'var(--danger)', marginTop: 6 }}><Icon name="info" size={11} /> {err}</div>}

          <div className="dba-sec-head" style={{ margin: '16px 0 8px' }}>การดำเนินการต่อของ Order</div>
          <div className="la-disp-list">
            {DISPOSITIONS.map(d => (
              <label key={d.v} className={'la-disp' + (disposition === d.v ? ' active' : '')}>
                <input type="radio" name="la-disp" checked={disposition === d.v} onChange={() => setDisposition(d.v)} />
                <span className="la-disp-ico" style={{ color: d.v === 'closed' ? 'var(--danger)' : 'var(--info)' }}><Icon name={d.icon} size={16} /></span>
                <span className="la-disp-txt">
                  <span className="la-disp-title">{d.title}</span>
                  <span className="la-disp-desc">{d.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn danger" onClick={submit}>
            <Icon name={disposition === 'closed' ? 'close' : 'refresh'} size={13} />
            {disposition === 'closed' ? ' ไม่อนุมัติ · ปิดการทำงาน' : ' ไม่อนุมัติ · ส่งกลับแก้ไข'}
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — ยืนยันอนุมัติ (รายการเดียว/หลายรายการ)
// ════════════════════════════════════════════════════════════════════
function LaApproveModal({ items, initialLot, onClose, onConfirm }) {
  const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);
  const failing = items.filter(x => (x.checks || []).some(c => !c.ok));
  const [payLot, setPayLot] = useState(initialLot || 'pending');
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 520, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="check" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการอนุมัติ ({items.length} รายการ)</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>รวมวงเงินอนุมัติ ฿{window.fmt.money(total, 0)}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {failing.length > 0 && (
            <div className="sr-elig-warn" style={{ marginBottom: 12 }}>
              <Icon name="info" size={14} /> มี {failing.length} รายการที่ติดเงื่อนไขการตรวจคุณสมบัติ — โปรดตรวจสอบก่อนอนุมัติ
            </div>
          )}
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead><tr><th>เลขที่ใบคำขอ</th><th>สมาชิก</th><th className="num">วงเงิน</th><th className="center">ผลตรวจ</th></tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.memberName}</td>
                    <td className="num mono">{window.fmt.money(r.amount, 0)}</td>
                    <td className="center">{laChecksPill(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>กำหนด Lot จ่าย</span>
            <select className="cfg-input" style={{ width: 220 }} value={payLot} onChange={e => setPayLot(e.target.value)}>
              {window.LOT_SET_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={() => onConfirm(items, payLot)}><Icon name="check" size={13} /> ยืนยันอนุมัติ {items.length} รายการ</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — เอกสารสรุปใบคำขอกู้ฉบับเต็ม (เรียกดูรายการ)
// ════════════════════════════════════════════════════════════════════
function LaDetailDoc({ rec, onClose, onApprove, onReject }) {
  const p = window.laReqProduct(rec);
  const st = laStatusDisplay(rec);
  const pending = rec.status === 'waitapprove' || rec.status === 'special';
  const kv = (k, v, cls) => (
    <div className="dba-kv"><span className="dba-kv-k">{k}</span><span className={'dba-kv-v' + (cls ? ' ' + cls : '')}>{v}</span></div>
  );

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 820, maxWidth: '96vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="loans" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>รายละเอียดใบคำขอกู้เงิน</h2>
            <div className="muted mono" style={{ fontSize: 11, marginTop: 1 }}>{rec.id} · ดึงจาก CRM {rec.crmRef}</div>
          </div>
          <span className={'pill ' + laStatusDisplay(rec).pill} style={{ marginLeft: 'auto' }}>{laStatusDisplay(rec).l}</span>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body dba-doc" style={{ maxHeight: '74vh', overflow: 'auto' }}>
          {/* การ์ดหัวเรื่อง (DS record-detail) */}
          <div className="search-card lt-head-card">
            <div className="lt-head-main">
              <div className="lt-head-ico"><Icon name="loans" /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="lt-head-title">{p.code} — {p.name}</div>
                <div className="lt-head-meta">
                  <span>{rec.memberName}</span>
                  <span className="mono">{rec.memberCode}</span>
                  <span>{rec.dept}</span>
                </div>
              </div>
              <span className={'pill ' + st.pill}>{st.l}</span>
            </div>
            <div className="lt-head-dates">
              <div className="lt-date"><span className="lt-date-k">จำนวนเงินขอกู้</span><span className="lt-date-v mono hl">฿{window.fmt.money(rec.amount, 0)}</span></div>
              <div className="lt-date"><span className="lt-date-k">สิทธิ์การขอกู้</span><span className="lt-date-v mono">฿{window.fmt.money(rec.entitlement, 0)}</span></div>
              <div className="lt-date"><span className="lt-date-k">อัตราดอกเบี้ย</span><span className="lt-date-v mono">{rec.rate.toFixed(2)}%</span></div>
              <div className="lt-date"><span className="lt-date-k">จำนวนงวด</span><span className="lt-date-v mono">{rec.periods} งวด</span></div>
              <div className="lt-date"><span className="lt-date-k">รับสุทธิ</span><span className="lt-date-v mono">฿{window.fmt.money(rec.netReceive, 0)}</span></div>
            </div>
          </div>

          {/* รายละเอียดคำขอ */}
          <div className="search-card">
            <div className="section-head"><span className="head-bar" /><h3>รายละเอียดคำขอ</h3></div>
            <div className="dba-kv-list">
              {kv('กลุ่มผลิตภัณฑ์', p.group || '—')}
              {kv('วัตถุประสงค์การกู้', rec.purposeLabel)}
              {kv('ยอดชำระต่องวด', '฿' + window.fmt.money(rec.payment, 0))}
              {kv('เงินเดือน', '฿' + window.fmt.money(rec.salary, 0))}
              {kv('เงินเดือนคงเหลือ', '฿' + window.fmt.money(rec.salaryRemain, 0) + ' (' + rec.pctRemain.toFixed(2) + '%)', rec.pctRemain < 40 ? 'warn' : '')}
            </div>
          </div>

          {/* หลักประกัน / ผู้ค้ำ */}
          <div className="search-card">
            <div className="section-head"><span className="head-bar" /><h3>หลักประกัน</h3></div>
            <div className="dba-kv-list">
              {kv('ประเภทหลักประกัน', rec.collateralType)}
              {kv('สถานะการค้ำ', rec.collateralOk ? 'ค้ำครบยอดกู้' : 'ค้ำไม่ครบ', rec.collateralOk ? '' : 'warn')}
            </div>
            {rec.guarantors && rec.guarantors.length > 0 && (
              <div className="table-wrap" style={{ marginTop: 10 }}><table className="tbl">
                <thead><tr><th>เลขสมาชิกผู้ค้ำ</th><th>ชื่อ-นามสกุล</th></tr></thead>
                <tbody>{rec.guarantors.map((g, i) => (
                  <tr key={i}><td className="mono">{g.code}</td><td>{g.name}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </div>

          {/* ผลตรวจคุณสมบัติ */}
          <div className="search-card">
            <div className="section-head"><span className="head-bar" /><h3>ผลตรวจคุณสมบัติตามค่าคงที่ผลิตภัณฑ์</h3></div>
            <div className={'lrq-checklist' + ((rec.checks || []).every(c => c.ok) ? ' ok' : '')}>
              {(rec.checks || []).map((ck, i) => (
                <div key={i} className={'lrq-chk-item' + (ck.ok ? ' ok' : ' bad')}>
                  <Icon name={ck.ok ? 'check' : 'close'} size={12} />
                  <span className="lrq-chk-label">{ck.label}</span>
                  {ck.detail && <span className="lrq-chk-detail">{ck.detail}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ข้อมูลการยื่น */}
          <div className="search-card">
            <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการยื่นคำขอ</h3></div>
            <div className="dba-kv-list">
              {kv('ผู้ทำรายการ', rec.submittedBy)}
              {kv('วันที่ส่งอนุมัติ', rec.submittedAt)}
              {kv('หมายเหตุ', rec.note)}
            </div>
          </div>

          {/* ผลการพิจารณา */}
          {!pending && (
            <div className={'dba-decision ' + (rec.status === 'approved' ? 'approved' : 'rejected')}>
              <div className="dba-decision-head">
                <Icon name={rec.status === 'approved' ? 'check' : rec.status === 'returned' ? 'refresh' : 'close'} size={14} />
                <span>{st.l}</span>
                <span className="spacer" />
                <span className="muted" style={{ fontSize: 11 }}>{rec.decidedBy}{rec.decidedDate ? ' · ' + window.fmt.date(rec.decidedDate) : ''}</span>
              </div>
              {rec.remark && <div className="dba-decision-note">{rec.remark}</div>}
            </div>
          )}
        </div>

        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          {pending ? (
            <>
              <button className="btn danger" onClick={() => onReject([rec])}><Icon name="close" size={13} /> ไม่อนุมัติ</button>
              <button className="btn primary" onClick={() => onApprove([rec])}><Icon name="check" size={13} /> อนุมัติคำขอ</button>
            </>
          ) : (
            <>
              <span className="spacer" />
              <button className="btn" onClick={onClose}>ปิด</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — ยิงบาร์โค้ดเลขใบคำขอกู้เงิน แล้วอนุมัติ/ไม่อนุมัติทั้งหมด
// ════════════════════════════════════════════════════════════════════
function LaBarcodeModal({ pool, onClose, onApprove, onReject }) {
  const [code, setCode] = useState('');
  const [scanned, setScanned] = useState([]);   // pending items ที่ยิงเข้ามา
  const [msg, setMsg] = useState(null);          // { kind:'ok'|'warn'|'err', text }
  const [payLot, setPayLot] = useState('pending');
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const norm = (s) => String(s || '').trim().toUpperCase();

  const scan = () => {
    const v = norm(code);
    setCode('');
    if (!v) return;
    const rec = pool.find(x => norm(x.id) === v || norm(x.crmRef) === v);
    if (!rec) { setMsg({ kind: 'err', text: `ไม่พบใบคำขอเลขที่ ${v}` }); return; }
    if (rec.status !== 'waitapprove' && rec.status !== 'special') { setMsg({ kind: 'warn', text: `${rec.id} ถูกพิจารณาแล้ว (${window.laReqStatus(rec.status).l}) — ข้าม` }); return; }
    if (scanned.some(x => x.id === rec.id)) { setMsg({ kind: 'warn', text: `${rec.id} ถูกยิงไปแล้ว` }); return; }
    setScanned(s => [...s, rec]);
    setMsg({ kind: 'ok', text: `เพิ่ม ${rec.id} · ${rec.memberName}` });
  };

  const removeItem = (id) => setScanned(s => s.filter(x => x.id !== id));
  const total = scanned.reduce((s, x) => s + Number(x.amount || 0), 0);
  const msgColor = msg ? (msg.kind === 'ok' ? 'var(--success)' : msg.kind === 'warn' ? 'var(--warning)' : 'var(--danger)') : '';

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 600, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="barcode" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>อนุมัติด้วยบาร์โค้ด</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>ยิงบาร์โค้ดเลขที่ใบคำขอกู้เงิน — ระบบจะรวบรวมรายการเพื่ออนุมัติ/ไม่อนุมัติพร้อมกัน</div>
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
            รายการที่ยิงแล้ว <span className="muted" style={{ fontWeight: 400 }}>({scanned.length} รายการ · รวม ฿{window.fmt.money(total, 0)})</span>
          </div>
          {scanned.length === 0 ? (
            <div className="empty-state" style={{ padding: '22px 0' }}>
              <div style={{ marginBottom: 4 }}><Icon name="barcode" size={22} /></div>
              ยังไม่มีรายการ — ยิงบาร์โค้ดเลขที่ใบคำขอกู้เงินเพื่อเริ่ม
            </div>
          ) : (
            <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 240 }}>
              <table className="tbl">
                <thead><tr><th>เลขที่ใบคำขอ</th><th>ชื่อ-สกุล สมาชิก</th><th>ประเภทเงินกู้</th><th className="num">วงเงิน</th><th className="center">ผลตรวจ</th><th style={{ width: 40 }} /></tr></thead>
                <tbody>
                  {scanned.map(r => {
                    const rp = window.laReqProduct(r);
                    return (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td>{r.memberName}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{rp.code} — {rp.name}</td>
                      <td className="num mono">{window.fmt.money(r.amount, 0)}</td>
                      <td className="center">{laChecksPill(r)}</td>
                      <td className="center"><button className="lrq-delbtn act-del" title="นำออก" onClick={() => removeItem(r.id)}><Icon name="trash" size={12} /></button></td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>กำหนด Lot จ่าย</span>
            <select className="cfg-input" style={{ width: 220 }} value={payLot} onChange={e => setPayLot(e.target.value)}>
              {window.LOT_SET_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>

        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <span className="spacer" />
          <button className="btn danger" disabled={scanned.length === 0} onClick={() => onReject(scanned)}>
            <Icon name="close" size={13} /> ไม่อนุมัติทั้งหมด ({scanned.length})
          </button>
          <button className="btn primary" disabled={scanned.length === 0} onClick={() => onApprove(scanned, payLot)}>
            <Icon name="check" size={13} /> อนุมัติทั้งหมด ({scanned.length})
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — แจ้งเตือนผลการทำรายการสำเร็จ (อนุมัติ/ไม่อนุมัติ)
// ════════════════════════════════════════════════════════════════════
function LaResultModal({ result, onClose }) {
  const { kind, items, dispLabel } = result;   // kind: 'approved' | 'rejected'
  const approved = kind === 'approved';
  const total = items.reduce((s, x) => s + Number(x.amount || 0), 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 540, maxWidth: '95vw' }}>
        <div className="modal-body" style={{ paddingTop: 22 }}>
          <div className="la-result-head">
            <div className={'la-result-badge ' + (approved ? 'ok' : 'bad')}>
              <Icon name={approved ? 'check' : 'close'} size={26} />
            </div>
            <h2 className="la-result-title">ทำรายการสำเร็จ</h2>
            <div className="la-result-sub">
              {approved
                ? <>อนุมัติทั้งหมด <b>{items.length}</b> รายการ · รวมวงเงิน ฿{window.fmt.money(total, 0)}</>
                : <>ไม่อนุมัติทั้งหมด <b>{items.length}</b> รายการ{dispLabel ? <> · {dispLabel}</> : null}</>}
            </div>
          </div>

          <div className="dba-sec-head" style={{ margin: '4px 0 8px' }}>รายการที่{approved ? 'อนุมัติ' : 'ไม่อนุมัติ'}</div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 280 }}>
            <table className="tbl">
              <thead><tr><th style={{ width: 34 }} className="center">#</th><th>เลขที่ใบคำขอ</th><th>สมาชิก</th><th className="num">วงเงิน</th></tr></thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono">{r.id}</td>
                    <td>{r.memberName}<div className="muted mono" style={{ fontSize: 10.5 }}>{r.memberCode}</div></td>
                    <td className="num mono">{window.fmt.money(r.amount, 0)}</td>
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
//  หน้าหลัก — รายการขอสินเชื่อรออนุมัติ
// ════════════════════════════════════════════════════════════════════
function LoanApprovalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.laReqLoad);
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [sel, setSel] = useState(() => new Set());
  const [doc, setDoc] = useState(null);        // (เลิกใช้) — แทนด้วย viewRec
  const [viewRec, setViewRec] = useState(null); // ดูรายละเอียดแบบหน้าใบคำขอกู้เต็ม
  const [rejectItems, setRejectItems] = useState(null);
  const [approveItems, setApproveItems] = useState(null);
  const [approveLot, setApproveLot] = useState('pending');
  const [barcode, setBarcode] = useState(false);   // เปิดหน้าต่างยิงบาร์โค้ด
  const [result, setResult] = useState(null);       // ผลการทำรายการสำเร็จ

  const today = new Date().toISOString().slice(0, 10);
  const reload = () => setList(window.laReqLoad());

  const basePending = useMemo(() => list.filter(x => x.status === 'waitapprove' || x.status === 'special'), [list]);
  const laTabCounts = {
    all: basePending.length,
    waitapprove: basePending.filter(x => x.status === 'waitapprove').length,
    special: basePending.filter(x => x.status === 'special').length,
  };

  const rows = useMemo(() => {
    let r = list.filter(x => x.status === 'waitapprove' || x.status === 'special');
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) || x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) || (x.crmRef || '').toLowerCase().includes(n) ||
                        (x.productName || '').toLowerCase().includes(n));
    }
    return [...r].sort((a, b) =>
      (a.status === 'special' ? 0 : 1) - (b.status === 'special' ? 0 : 1) ||
      (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1) ||
      (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  }, [list, statusF, q]);

  const pending = list;
  const urgentCnt = pending.filter(x => x.priority === 'urgent').length;
  const pendingAmt = pending.reduce((s, x) => s + Number(x.amount || 0), 0);

  const pendingRows = rows;
  const selItems = rows.filter(r => sel.has(r.id));
  const clearSel = () => setSel(new Set());
  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── อนุมัติ ──
  const doApprove = (items, payLot) => {
    const lot = payLot || 'pending';
    items.forEach(rec => window.laReqSaveDecision(rec.id, {
      status: 'approved', decidedBy: window.LA_APPROVER, decidedDate: today,
      remark: 'อนุมัติตามหลักเกณฑ์', payLot: lot,
    }));
    reload(); clearSel(); setApproveItems(null); setViewRec(null); setBarcode(false);
    audit.log && audit.log({
      action: 'approve', module: 'สินเชื่อ — อนุมัติสินเชื่อ',
      target: items.length > 1 ? `${items.length} ใบคำขอ` : `${items[0].id} · ${items[0].memberName}`,
      summary: `อนุมัติใบคำขอกู้ ${items.length} รายการ · รวม ฿${window.fmt.money(items.reduce((s, x) => s + Number(x.amount || 0), 0), 0)}`,
      changes: items.map(it => ({ field: it.id, before: 'รออนุมัติ', after: 'อนุมัติแล้ว · ฿' + window.fmt.money(it.amount, 0) })),
    });
    setResult({ kind: 'approved', items });
    onToast && onToast(`อนุมัติใบคำขอกู้ ${items.length} รายการเรียบร้อยแล้ว`);
  };

  // ── ไม่อนุมัติ (ส่งกลับ/ปิด) ──
  const doReject = (items, disposition, reason) => {
    // ใช้สถานะชุดเดียวกับใบคำขอกู้เงิน: ปิดการทำงาน = ส่งคืนคำขอ (returned)
    //                                       ส่งกลับให้แก้ไข = ไม่อนุมัติ (rejected)
    const status = disposition === 'closed' ? 'returned' : 'rejected';
    items.forEach(rec => window.laReqSaveDecision(rec.id, {
      status, decidedBy: window.LA_APPROVER, decidedDate: today, remark: reason,
    }));
    reload(); clearSel(); setRejectItems(null); setViewRec(null); setBarcode(false);
    const dispLabel = disposition === 'closed' ? 'ปิดการทำงาน' : 'ส่งกลับให้ผู้ทำรายการแก้ไข';
    audit.log && audit.log({
      action: 'reject', module: 'สินเชื่อ — อนุมัติสินเชื่อ',
      target: items.length > 1 ? `${items.length} ใบคำขอ` : `${items[0].id} · ${items[0].memberName}`,
      summary: `ไม่อนุมัติใบคำขอกู้ ${items.length} รายการ · ${dispLabel}`,
      changes: [
        { field: 'ผลการพิจารณา', before: 'รออนุมัติ', after: 'ไม่อนุมัติ · ' + dispLabel },
        { field: 'สาเหตุ', before: '—', after: reason },
      ],
    });
    setResult({ kind: 'rejected', items, dispLabel });
    onToast && onToast(`ไม่อนุมัติ ${items.length} รายการ — ${dispLabel}`);
  };

  const allPendingSelected = pendingRows.length > 0 && pendingRows.every(r => sel.has(r.id));

  // Breadcrumb: หน้าหลัก › อนุมัติสินเชื่อ › [รายละเอียดใบคำขอ]
  window.useBreadcrumb(
    viewRec
      ? [{ label: 'อนุมัติสินเชื่อ', onClick: () => setViewRec(null) }, { label: 'รายละเอียด', current: true }]
      : [{ label: 'อนุมัติสินเชื่อ', current: true }],
    [!!viewRec, viewRec && viewRec.id]
  );

  // ── โมดัลร่วม (ต้อง mount ได้ทั้งหน้ารายการและหน้าดูรายละเอียด) ──
  const sharedModals = (
    <>
      {approveItems && <LaApproveModal items={approveItems} initialLot={approveLot} onClose={() => { setApproveItems(null); setApproveLot('pending'); }} onConfirm={(it, lot) => { doApprove(it, lot); setApproveLot('pending'); }} />}
      {rejectItems && <LaRejectModal items={rejectItems} onClose={() => setRejectItems(null)} onConfirm={doReject} />}
      {barcode && <LaBarcodeModal pool={list} onClose={() => setBarcode(false)}
                                  onApprove={(items, lot) => { setBarcode(false); setApproveLot(lot || 'pending'); setApproveItems(items); }}
                                  onReject={(items) => { setBarcode(false); setRejectItems(items); }} />}
      {result && <LaResultModal result={result} onClose={() => setResult(null)} />}
    </>
  );

  // ── ดูรายละเอียด: แสดงหน้าจอใบคำขอกู้เงินฉบับเต็ม (โหมดอ่านอย่างเดียว) ──
  if (viewRec) {
    const st = laStatusDisplay(viewRec);
    const pendingView = viewRec.status === 'waitapprove' || viewRec.status === 'special';
    return (
      <>
        <LoanRequestForm
          reviewMode
          initial={window.laReqToForm(viewRec)}
          statusBadge={{ l: st.l, pill: st.pill }}
          decision={pendingView ? null : { l: st.l, pill: st.pill, by: viewRec.decidedBy }}
          onBack={() => setViewRec(null)}
          onToast={onToast}
          onApprove={() => setApproveItems([viewRec])}
          onReject={() => setRejectItems([viewRec])}
        />
        {sharedModals}
      </>
    );
  }

  return (
    <div data-screen-label="หน้าอนุมัติสินเชื่อ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติสินเชื่อ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            รายการขอสินเชื่อที่เจ้าหน้าที่ทำรายการแล้ว รอการพิจารณาอนุมัติ — เลือกอนุมัติทีละรายการ/หลายรายการ/ทั้งหมด · ไม่อนุมัติต้องระบุสาเหตุแล้วส่งกลับให้แก้ไขหรือปิดการทำงาน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={() => setBarcode(true)}>
          <Icon name="barcode" /> ยิงบาร์โค้ด
        </button>
        <button className="btn primary" disabled={pendingRows.length === 0}
                onClick={() => setApproveItems(pendingRows)}>
          <Icon name="check" /> อนุมัติทั้งหมด ({pendingRows.length})
        </button>
      </div>

      <div className="search-card">
        <div className="lrq-inbox-toolbar" style={{ marginBottom: 10 }}>
          <div className="lrq-inbox-tabs">
            {LA_STATUS_TABS.map(t => (
              <button key={t.id} className={"lrq-itab" + (statusF === t.id ? ' active' : '')} onClick={() => { setStatusF(t.id); clearSel(); }}>
                {t.label}<span className="lrq-itab-c">{laTabCounts[t.id]}</span>
              </button>
            ))}
          </div>
          <span className="spacer" />
          <div className="search lrq-inbox-search" style={{ width: 300 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เลขที่ใบคำขอ (CRM) / เลขสมาชิก" />
          </div>
        </div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</div>

        {selItems.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selItems.length}</b> รายการที่เลือก</span>
            <span className="muted">· รวม ฿{window.fmt.money(selItems.reduce((s, x) => s + Number(x.amount || 0), 0), 0)}</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setApproveItems(selItems)}><Icon name="check" size={12} /> อนุมัติที่เลือก ({selItems.length})</button>
            <button className="btn danger sm" onClick={() => setRejectItems(selItems)}><Icon name="close" size={12} /> ไม่อนุมัติที่เลือก ({selItems.length})</button>
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
                <th>โครงการเงินกู้</th>
                <th>สมาชิก</th>
                <th className="num">วงเงินขอกู้ / สิทธิ์</th>
                <th className="center">ผลตรวจ</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 260, whiteSpace: 'nowrap' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="check" size={24} /></div>
                  ไม่มีใบคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const p = window.laReqProduct(r);
                const st = laStatusDisplay(r);
                const isPending = r.status === 'waitapprove' || r.status === 'special';
                return (
                  <tr key={r.id} className={'clickable' + (sel.has(r.id) ? ' wa-row-sel' : '')} onClick={() => setViewRec(r)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {isPending && <input type="checkbox" className="wa-chk" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} />}
                    </td>
                    <td>
                      <div className="mono">{r.id}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.crmRef}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{(() => {
                        const m = String(r.submittedAt || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
                        if (!m) return r.submittedAt;
                        const MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                        return m[3] + '/' + MO[Number(m[2]) - 1] + '/' + (Number(m[1]) + 543) + (m[4] ? ' ' + m[4] + ' น.' : '');
                      })()}</div>
                    </td>
                    <td>
                      {(() => {
                        const c = window.lpjListCell({ key: r.crmRef || r.id, productId: p.id, projectId: r.lpjProjectId, roundId: r.lpjRoundId });
                        return (
                          <>
                            <div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{c.title}</div>
                            <div className="muted" style={{ fontSize: 10.5 }}>{c.sub}</div>
                          </>
                        );
                      })()}
                      {r.priority === 'urgent' && isPending && <span className="chip danger" style={{ fontSize: 10, marginTop: 3 }}>เร่งด่วน</span>}
                      {r.status === 'special' && <span className="chip warning" style={{ fontSize: 10, marginTop: 3 }}>กรณีพิเศษ</span>}
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.memberCode} · {r.dept}</div>
                    </td>
                    <td className="num">
                      <div className="mono" style={{ fontWeight: 600 }}>{window.fmt.money(r.amount, 0)}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>สิทธิ์ {window.fmt.money(r.entitlement, 0)}</div>
                    </td>
                    <td className="center">{laChecksPill(r)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'nowrap' }}>
                          <button className="btn sm" onClick={() => setViewRec(r)}><Icon name="eye" size={12} /> ดู</button>
                          <button className="btn primary sm" onClick={() => setApproveItems([r])}><Icon name="check" size={12} /> อนุมัติ</button>
                          <button className="btn danger sm" onClick={() => setRejectItems([r])}><Icon name="close" size={12} /> ไม่อนุมัติ</button>
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
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อเปิดเอกสารสรุปใบคำขอฉบับเต็ม · เลือกหลายรายการเพื่ออนุมัติ/ไม่อนุมัติพร้อมกัน · การไม่อนุมัติจะส่ง Order กลับให้ผู้ทำรายการแก้ไข หรือปิดการทำงาน
        </p>
      </div>

      {sharedModals}
    </div>
  );
}

Object.assign(window, { LoanApprovalPage });
