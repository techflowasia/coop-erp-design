// ════════════════════════════════════════════════════════════════════
//  แจ้งเปลี่ยนผู้ค้ำประกัน — ทะเบียน (list) + รายละเอียด + หน้าหลัก
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน › ค้ำประกัน
// ════════════════════════════════════════════════════════════════════

// ─── ทะเบียนหนังสือแจ้งเปลี่ยนผู้ค้ำประกัน ──────────────────────────
function GcnListView({ list, onCreate, onOpenHistory, onOpen, onPrint }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [q, setQ] = useState('');
  const [cause, setCause] = useState('all');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (dateFrom) r = r.filter(x => x.regDate >= dateFrom);
    if (dateTo) r = r.filter(x => x.regDate <= dateTo);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => (x.memberCode || '').toLowerCase().includes(n) ||
                        (x.memberName || '').toLowerCase().includes(n) ||
                        (x.id || '').toLowerCase().includes(n) ||
                        (x.refNo || '').toLowerCase().includes(n));
    }
    if (cause !== 'all') r = r.filter(x => x.causeCode === cause);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.regDate.localeCompare(a.regDate) || b.id.localeCompare(a.id));
  }, [list, dateFrom, dateTo, q, cause, statusF]);

  const hasFilter = dateFrom || dateTo || q || cause !== 'all' || statusF !== 'all';
  const clear = () => { setDateFrom(''); setDateTo(''); setQ(''); setCause('all'); setStatusF('all'); };

  const today = window.gcnToday();
  const pendingCnt = rows.filter(r => r.status !== 'done' && r.status !== 'cancelled').length;
  const overdueCnt = rows.filter(r => r.status !== 'done' && r.status !== 'cancelled' && r.dueDate < today).length;

  return (
    <div data-screen-label="หน้าทะเบียนแจ้งเปลี่ยนผู้ค้ำประกัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>แจ้งเปลี่ยนผู้ค้ำประกัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · ทะเบียนหนังสือแจ้งเปลี่ยนผู้ค้ำประกัน — บันทึกรายการ ติดตามสถานะ และพิมพ์หนังสือแจ้ง
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการดำเนินการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> บันทึกรายการแจ้งเปลี่ยนผู้ค้ำ</button>
      </div>

      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">หนังสือทั้งหมด</div>
          <div className="stat-value">{fmt.int(rows.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">อยู่ระหว่างดำเนินการ</div>
          <div className="stat-value">{fmt.int(pendingCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>{overdueCnt > 0 ? `เลยกำหนด ${overdueCnt} ราย` : 'รอเปลี่ยนผู้ค้ำ'}</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>วันที่ลงทะเบียน (จาก – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ทะเบียน / เลขสมาชิก / ชื่อ / เลขอ้างอิง</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น 050000, GT-2569-00001" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สาเหตุที่ติดตาม</span>
            <select className="filter-select" value={cause} onChange={(e) => setCause(e.target.value)} style={{ width: 210 }}>
              <option value="all">ทุกสาเหตุ</option>
              {window.GCN_CAUSES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 180 }}>
              <option value="all">ทุกสถานะ</option>
              {window.GCN_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          {hasFilter && <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>ทะเบียนติดตาม</th>
                <th>สมาชิก / ลูกหนี้</th>
                <th>สาเหตุ</th>
                <th className="center">สัญญา</th>
                <th className="num">ยอดหนี้คงเหลือ</th>
                <th className="center">ครบกำหนด</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 90 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.gcnStatus(r.status);
                const c = window.gcnCause(r.causeCode) || {};
                const overdue = r.status !== 'done' && r.status !== 'cancelled' && r.dueDate < today;
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}{r.refNo && <div className="muted" style={{ fontSize: 10 }}>{r.refNo}</div>}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{(r.memberName || '').replace(/^(นาย|นาง|นางสาว|น\.ส\.)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {window.gcnDeptLabel(r.deptCode)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.causeCode === 'G99' ? (r.causeDetail || c.label) : c.label}</td>
                    <td className="center">{(r.contracts || []).length}</td>
                    <td className="num"><b>{fmt.money(r.totalRemaining, 2)}</b></td>
                    <td className="center mono">
                      {fmt.date(r.dueDate)}
                      {overdue && <div><span className="chip danger" style={{ fontSize: 10 }}>เลยกำหนด</span></div>}
                    </td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 2 }}>
                        <button className="bud-act" title="ดูรายละเอียด" onClick={() => onOpen(r)}><Icon name="eye" size={13} /></button>
                        <button className="bud-act" title="พิมพ์หนังสือแจ้ง" onClick={() => onPrint(r)}><Icon name="print" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียด · ปุ่มพิมพ์เพื่อออกหนังสือแจ้งเปลี่ยนผู้ค้ำประกัน (PDF / เครื่องพิมพ์)
        </p>
      </div>
    </div>
  );
}

// ─── รายละเอียด (อ่านอย่างเดียว) ─────────────────────────────────────
function GcnDetailRow({ label, value, mono }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}
function GcnDetailView({ rec, onBack, onEdit, onPrint, onStatus }) {
  if (!rec) return null;
  const st = window.gcnStatus(rec.status);
  const c = window.gcnCause(rec.causeCode) || {};
  const causeTxt = rec.causeCode === 'G99' ? (rec.causeDetail || c.label) : c.label;
  const today = window.gcnToday();
  const overdue = rec.status !== 'done' && rec.status !== 'cancelled' && rec.dueDate < today;

  return (
    <div data-screen-label="หน้ารายละเอียดแจ้งเปลี่ยนผู้ค้ำประกัน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        {rec.status !== 'done' && rec.status !== 'cancelled' && (
          <button className="btn sm" onClick={() => onStatus(rec, 'done')}><Icon name="check" /> ปิดรายการ (ดำเนินการแล้ว)</button>
        )}
        <button className="btn sm" onClick={() => onEdit(rec)}><Icon name="edit" /> แก้ไข</button>
        <button className="btn primary sm" onClick={() => onPrint(rec)}><Icon name="print" /> พิมพ์หนังสือแจ้ง</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="swap" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">หนังสือแจ้งเปลี่ยนผู้ค้ำประกัน</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              {rec.refNo && <><span>เลขอ้างอิง {rec.refNo}</span><span className="dot" /></>}
              <span>บันทึกโดย {rec.enteredBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            {rec.notifyAhead && <span className="chip warning"><Icon name="info" size={11} /> แจ้งผู้ค้ำล่วงหน้า</span>}
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">สมาชิก / ลูกหนี้</span><span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span></div>
          <div className="lt-date"><span className="lt-date-k">ยอดหนี้คงเหลือรวม</span><span className="lt-date-v" style={{ color: 'var(--danger)', fontWeight: 700 }}>฿ {fmt.money(rec.totalRemaining, 2)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ครบกำหนดดำเนินการ</span><span className="lt-date-v">{fmt.date(rec.dueDate)} {overdue && <span className="chip danger" style={{ marginLeft: 4 }}>เลยกำหนด</span>}</span></div>
          <div className="lt-date"><span className="lt-date-k">สาเหตุที่ติดตาม</span><span className="lt-date-v">{causeTxt}</span></div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลทะเบียนติดตาม และผู้ลงนาม</h3></div>
        <div className="form-grid">
          <GcnDetailRow label="เลขทะเบียนติดตาม" value={rec.id} mono />
          <GcnDetailRow label="เลขที่อ้างอิง" value={rec.refNo || '—'} mono />
          <GcnDetailRow label="วันที่ลงทะเบียน" value={fmt.date(rec.regDate)} />
          <GcnDetailRow label="วันที่ครบกำหนด" value={fmt.date(rec.dueDate)} />
          <GcnDetailRow label="ผู้ลงนาม" value={rec.signer} />
          <GcnDetailRow label="ตำแหน่ง" value={rec.signerPosition} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิก และเหตุผลการติดตาม</h3></div>
        <div className="form-grid">
          <GcnDetailRow label="ทะเบียนสมาชิก" value={rec.memberCode} mono />
          <GcnDetailRow label="ชื่อ-สกุล" value={rec.memberName} />
          <GcnDetailRow label="สังกัด" value={window.gcnDeptLabel(rec.deptCode)} />
          <GcnDetailRow label="ทุนเรือนหุ้น" value={'฿ ' + fmt.money(rec.shares, 2)} />
          <GcnDetailRow label="หนี้คงค้าง" value={'฿ ' + fmt.money(rec.outstanding, 2)} />
          <GcnDetailRow label="สาเหตุที่ติดตาม" value={causeTxt} />
          <GcnDetailRow label="รายละเอียดเพิ่มเติม" value={rec.causeDetail || '—'} />
          <GcnDetailRow label="แจ้งผู้ค้ำล่วงหน้า" value={rec.notifyAhead ? 'ใช่' : 'ไม่'} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายการสัญญาเงินกู้ที่เกี่ยวข้อง</h3><span className="gc-count">{(rec.contracts || []).length} สัญญา</span></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 44 }}>ลำดับ</th>
                <th>เลขที่สัญญา</th><th>ประเภท</th><th className="center">วันที่ทำสัญญา</th>
                <th className="num">จำนวนเงินกู้</th><th className="num">ยอดหนี้คงเหลือ</th>
                <th className="center">รหัสผู้ค้ำ</th><th>ชื่อผู้ค้ำเดิม</th><th className="center">ประเภทผู้ค้ำ</th><th>สังกัดผู้ค้ำ</th>
              </tr>
            </thead>
            <tbody>
              {(rec.contracts || []).map((c, i) => (
                <tr key={i}>
                  <td className="center">{i + 1}</td>
                  <td className="mono">{c.contractNo}</td>
                  <td>{c.loanType}</td>
                  <td className="center mono">{fmt.date(c.contractDate)}</td>
                  <td className="num mono">{fmt.money(c.amount, 2)}</td>
                  <td className="num mono">{fmt.money(c.remaining, 2)}</td>
                  <td className="center mono">{c.guarCode}</td>
                  <td>{c.guarName}</td>
                  <td className="center"><span className={'chip ' + (c.guarType === 'ผู้ค้ำประกันชีวิต' ? 'info' : 'primary')}>{c.guarType}</span></td>
                  <td>{window.gcnDeptLabel(c.guarDeptCode)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="right"><b>รวม {(rec.contracts || []).length} รายการ</b></td>
                <td className="num mono"><b>{fmt.money(rec.totalAmount, 2)}</b></td>
                <td className="num mono"><b>{fmt.money(rec.totalRemaining, 2)}</b></td>
                <td colSpan="4" />
              </tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      {rec.note && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>หมายเหตุ</h3></div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }}>{rec.note}</p>
        </div>
      )}

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สถานะ และการพิมพ์</h3></div>
        <div className="form-grid">
          <GcnDetailRow label="สถานะรายการ" value={st.l} />
          <GcnDetailRow label="วันที่สถานะ" value={rec.statusDate ? fmt.date(rec.statusDate) : '—'} />
          <GcnDetailRow label="จำนวนครั้งที่พิมพ์" value={(rec.printCount || 0) + ' ครั้ง'} />
          <GcnDetailRow label="พิมพ์ล่าสุด" value={rec.printedDate ? fmt.date(rec.printedDate) : '—'} />
        </div>
      </div>
    </div>
  );
}

// ─── ประวัติการดำเนินการ (drawer) ────────────────────────────────────
function GcnHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('แจ้งเปลี่ยนผู้ค้ำประกัน'))]
    .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>ประวัติการดำเนินการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>แจ้งเปลี่ยนผู้ค้ำประกัน</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {rows.length === 0 ? (
            <div className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>ยังไม่มีประวัติการดำเนินการ</div>
          ) : (
            <div className="tx-timeline">
              {rows.map(e => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="tx-mod">{e.module}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span><span className="sep">·</span><span>{e.role}</span>
                        <span className="sep">·</span><span className="mono muted">{e.id}</span>
                      </div>
                      {e.changes && e.changes.length > 0 && (
                        <div className="tx-changes">
                          {e.changes.map((c, i) => (
                            <div className="tx-change" key={i}>
                              <span className="fld">{c.field}</span>
                              <span className="before">{c.before}</span>
                              <span className="arr">→</span>
                              <span className="after">{c.after}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับ list / form / detail + จัดการพิมพ์
// ════════════════════════════════════════════════════════════════════
function GuarantorChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.gcnLoad);
  const [mode, setMode] = useState('list');     // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const MODULE = 'ทะเบียนและติดตามหนี้ — แจ้งเปลี่ยนผู้ค้ำประกัน';

  // Breadcrumb ภายในหน้า (list → create/view)
  window.useBreadcrumb && window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'แจ้งเปลี่ยนผู้ค้ำประกัน', onClick: () => setMode('list') }, { label: editing ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่', current: true }]
      : mode === 'detail'
        ? [{ label: 'แจ้งเปลี่ยนผู้ค้ำประกัน', onClick: () => setMode('list') }, { label: 'รายละเอียด', current: true }]
        : [{ label: 'แจ้งเปลี่ยนผู้ค้ำประกัน', current: true }],
    [mode, editing]
  );

  const persist = (next) => { setList(next); window.gcnSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const doPrint = (rec) => {
    setPrintDoc(rec);
    const updated = {
      ...rec,
      printCount: (rec.printCount || 0) + 1,
      printedDate: window.gcnToday(),
      status: (rec.status === 'draft') ? 'printed' : rec.status,
    };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log && audit.log({
      action: 'print', module: MODULE,
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `พิมพ์หนังสือแจ้งเปลี่ยนผู้ค้ำประกัน ${rec.id} (พิมพ์ครั้งที่ ${updated.printCount})`,
      changes: [{ field: 'จำนวนครั้งที่พิมพ์', before: String(rec.printCount || 0), after: String(updated.printCount) }],
    });
    setTimeout(() => window.printGuarantorChange(onToast), 80);
  };

  const setStatus = (rec, status) => {
    const updated = { ...rec, status, statusDate: window.gcnToday() };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: MODULE, target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ปรับสถานะรายการ ${rec.id} เป็น “${window.gcnStatus(status).l}”`,
      changes: [{ field: 'สถานะรายการ', before: window.gcnStatus(rec.status).l, after: window.gcnStatus(status).l }],
    });
    onToast && onToast(`ปรับสถานะรายการ ${rec.id} เรียบร้อยแล้ว`);
  };

  const submit = (rec, alsoPrint) => {
    const exists = list.some(r => r.id === rec.id);
    const next = exists ? list.map(r => r.id === rec.id ? rec : r) : [rec, ...list];
    persist(next);
    const c = window.gcnCause(rec.causeCode) || {};
    audit.log && audit.log({
      action: exists ? 'update' : 'create', module: MODULE,
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `${exists ? 'แก้ไข' : 'บันทึก'}รายการแจ้งเปลี่ยนผู้ค้ำประกัน ${rec.id} · ${rec.memberName} · ${(rec.contracts || []).length} สัญญา`,
      changes: [
        { field: 'ทะเบียนติดตาม', before: '—', after: rec.id },
        { field: 'สาเหตุที่ติดตาม', before: '—', after: rec.causeCode === 'G99' ? rec.causeDetail : c.label },
        { field: 'ยอดหนี้คงเหลือรวม', before: '—', after: `${fmt.money(rec.totalRemaining, 2)} บาท` },
      ],
    });
    onToast && onToast(`${exists ? 'แก้ไข' : 'บันทึก'}รายการ ${rec.id} · ${rec.memberName} เรียบร้อยแล้ว`);
    setEditing(null);
    setMode('list');
    if (alsoPrint) doPrint(rec);
  };

  const startCreate = () => { setEditing(null); setMode('form'); };
  const startEdit = (rec) => { setEditing(rec); setMode('form'); };

  return (
    <>
      {mode === 'list'
        ? <GcnListView list={list} onCreate={startCreate} onOpenHistory={() => setHistOpen(true)} onOpen={openDetail} onPrint={doPrint} />
        : mode === 'detail'
          ? <GcnDetailView rec={current} onBack={() => setMode('list')} onEdit={startEdit} onPrint={doPrint} onStatus={setStatus} />
          : <GcnCreateForm list={list} initial={editing} onSubmit={submit} onCancel={() => { setEditing(null); setMode('list'); }} onToast={onToast} />}
      {histOpen && <GcnHistoryDrawer onClose={() => setHistOpen(false)} />}
      <GcnPrintSheet rec={printDoc} />
    </>
  );
}

Object.assign(window, { GuarantorChangePage, GcnListView, GcnDetailView });
