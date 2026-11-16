// ════════════════════════════════════════════════════════════════════
//  ขอให้ชำระหนี้ (แจ้งหน่วยงานต้นสังกัด) — ทะเบียนหนังสือ (list) +
//  รายละเอียด + หน้าหลัก  ·  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
// ════════════════════════════════════════════════════════════════════

// ─── ทะเบียนหนังสือขอให้ชำระหนี้ ────────────────────────────────────
function OrqListView({ list, onCreate, onOpenHistory, onOpen, onPrint, onEmsScan, onEmsQuick }) {
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
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) ||
                        (x.docNo || '').toLowerCase().includes(n) ||
                        ((x.org && x.org.name) || '').toLowerCase().includes(n));
    }
    if (cause !== 'all') r = r.filter(x => x.causeCode === cause);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.regDate.localeCompare(a.regDate) || b.id.localeCompare(a.id));
  }, [list, dateFrom, dateTo, q, cause, statusF]);

  const hasFilter = dateFrom || dateTo || q || cause !== 'all' || statusF !== 'all';
  const clear = () => { setDateFrom(''); setDateTo(''); setQ(''); setCause('all'); setStatusF('all'); };

  const pendingCnt = rows.filter(r => r.status !== 'closed').length;
  const today = window.dnToday();
  const overdueCnt = rows.filter(r => r.status !== 'closed' && r.dueDate < today).length;

  return (
    <div data-screen-label="หน้าทะเบียนหนังสือขอให้ชำระหนี้ (แจ้งต้นสังกัด)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ขอให้ชำระหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · หนังสือแจ้งหน่วยงานต้นสังกัดที่ออกแล้ว — ดูรายละเอียด ติดตามสถานะ และพิมพ์สำเนาย้อนหลัง
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn sm" onClick={onEmsScan}><Icon name="barcode" /> อัปเดตเลข EMS (สแกน)</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> บันทึกรายการแจ้งต้นสังกัด</button>
      </div>

      {/* KPI */}
      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">หนังสือทั้งหมด</div>
          <div className="stat-value">{fmt.int(rows.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">ยังไม่ปิดรายการ</div>
          <div className="stat-value">{fmt.int(pendingCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>{overdueCnt > 0 ? `เลยกำหนด ${overdueCnt} ราย` : 'อยู่ระหว่างติดตาม'}</div>
        </div>
      </div>

      <div className="search-card">
        {/* ── ตัวกรอง ── */}
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
            <span className="muted" style={{ fontSize: 11 }}>เลขสมาชิก / ชื่อ / ทะเบียน / เลขหนังสือ / ต้นสังกัด</span>
            <div className="search" style={{ flex: 'none', width: 320, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น M-066238, ORG-2569-000001, กองการศึกษา" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สาเหตุที่ติดตาม</span>
            <select className="filter-select" value={cause} onChange={(e) => setCause(e.target.value)} style={{ width: 200 }}>
              <option value="all">ทุกสาเหตุ</option>
              {window.DN_CAUSES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 170 }}>
              <option value="all">ทุกสถานะ</option>
              {window.ORQ_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>
          )}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {/* ── ตาราง ── */}
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>ทะเบียน</th>
                <th>เลขที่หนังสือ</th>
                <th className="center">ครั้งที่</th>
                <th>สมาชิกลูกหนี้</th>
                <th>หน่วยงานต้นสังกัด</th>
                <th className="center">ครบกำหนด</th>
                <th className="num">หนี้คงค้าง</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 90 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบหนังสือที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.orqStatus(r.status);
                const overdue = r.status !== 'closed' && r.dueDate < today;
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{r.docNo}</td>
                    <td className="center">{r.round}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{(r.org && r.org.name) || r.dept}</td>
                    <td className="center mono">
                      {fmt.date(r.dueDate)}
                      {overdue && <div><span className="chip danger" style={{ fontSize: 10 }}>เลยกำหนด</span></div>}
                    </td>
                    <td className="num"><b>{fmt.money(r.totalOutstanding, 2)}</b></td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 2 }}>
                        <button className="bud-act" title="ดูรายละเอียด" onClick={() => onOpen(r)}><Icon name="eye" size={13} /></button>
                        <button className="bud-act" title="อัปเดตเลข EMS" onClick={() => onEmsQuick(r)}><Icon name="barcode" size={13} /></button>
                        <button className="bud-act" title="พิมพ์สำเนา (แจ้งต้นสังกัด)" onClick={() => onPrint(r)}><Icon name="print" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียด · หนังสือฉบับนี้พิมพ์ออกเป็น “สำเนา” เพื่อแจ้งหน่วยงานต้นสังกัด (แจ้งครั้งเดียวต่อสัญญา)
        </p>
      </div>
    </div>
  );
}

// ─── รายละเอียดหนังสือ (อ่านอย่างเดียว) ──────────────────────────────
function OrqDetailRow({ label, value, mono }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}
function OrqDetailView({ rec, onBack, onPrint, onClose }) {
  if (!rec) return null;
  const st = window.orqStatus(rec.status);
  const c = window.dnCause(rec.causeCode) || {};
  const causeTxt = rec.causeCode === 'C99' ? (rec.causeOther || c.label) : c.label;
  const ms = window.DN_MEMBER_STATUS[rec.memberStatus] || { pill: 'neutral' };
  const today = window.dnToday();
  const overdue = rec.status !== 'closed' && rec.dueDate < today;
  const org = rec.org || {};

  return (
    <div data-screen-label="หน้ารายละเอียดหนังสือขอให้ชำระหนี้ (แจ้งต้นสังกัด)">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        {rec.status !== 'closed' && (
          <button className="btn sm" onClick={() => onClose(rec)}><Icon name="check" /> ปิดรายการ (ชำระครบ)</button>
        )}
        <button className="btn primary sm" onClick={() => onPrint(rec)}><Icon name="print" /> พิมพ์สำเนา (แจ้งต้นสังกัด)</button>
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="guarantee" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">หนังสือขอให้ชำระหนี้ <span className="orq-head-tag">แจ้งต้นสังกัด · สำเนา</span></h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>เลขที่หนังสือ {rec.docNo}</span><span className="dot" />
              <span>ครั้งที่ {rec.round}</span><span className="dot" />
              <span>บันทึกโดย {rec.enteredBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            {rec.printCount > 0 && <span className="chip info"><Icon name="print" size={11} /> พิมพ์แล้ว {rec.printCount} ครั้ง</span>}
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">สมาชิกลูกหนี้</span>
            <span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">แจ้งถึงหน่วยงานต้นสังกัด</span>
            <span className="lt-date-v">{org.name || rec.dept}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">หนี้คงค้างที่แจ้ง</span>
            <span className="lt-date-v" style={{ color: 'var(--danger)', fontWeight: 700 }}>฿ {fmt.money(rec.totalOutstanding, 2)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ครบกำหนดชำระ</span>
            <span className="lt-date-v">{fmt.date(rec.dueDate)} {overdue && <span className="chip danger" style={{ marginLeft: 4 }}>เลยกำหนด</span>}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลเอกสาร</h3></div>
        <div className="form-grid">
          <OrqDetailRow label="ทะเบียนขอให้ชำระหนี้" value={rec.id} mono />
          <OrqDetailRow label="เลขที่หนังสือ (แจ้งต้นสังกัด)" value={rec.docNo} mono />
          <OrqDetailRow label="ครั้งที่" value={rec.round} />
          <OrqDetailRow label="วันที่ลงทะเบียน" value={fmt.date(rec.regDate)} />
          <OrqDetailRow label="วันครบกำหนดชำระ" value={fmt.date(rec.dueDate)} />
          <OrqDetailRow label="เลขนำส่ง EMS" value={rec.emsNo || '—'} mono />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>หน่วยงานต้นสังกัด (ผู้รับหนังสือ)</h3></div>
        <div className="form-grid">
          <OrqDetailRow label="ชื่อหน่วยงานต้นสังกัด" value={org.name} />
          <OrqDetailRow label="รหัสสังกัด" value={org.code || '—'} mono />
          <OrqDetailRow label="หน่วยงาน / กลุ่มงาน" value={org.unit || '—'} />
          <OrqDetailRow label="เรียน (หัวหน้าสังกัด)" value={org.head || '—'} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิก และการติดตาม</h3></div>
        <div className="form-grid">
          <OrqDetailRow label="ทะเบียนสมาชิก" value={rec.memberCode} mono />
          <OrqDetailRow label="ชื่อ-ชื่อสกุล" value={rec.memberName} />
          <OrqDetailRow label="สังกัด" value={`${rec.deptCode} · ${rec.dept}`} />
          <OrqDetailRow label="ทุนเรือนหุ้น" value={'฿ ' + fmt.money(rec.shares, 2)} />
          <OrqDetailRow label="สาเหตุที่ติดตาม" value={causeTxt} />
          <OrqDetailRow label="เมื่อวันที่" value={rec.occurredDate ? fmt.date(rec.occurredDate) : '—'} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หนี้ค้างชำระ</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>ประเภท</th><th>สัญญาเลขที่</th><th className="center">สถานะ</th>
                <th className="num">เงินต้นคงเหลือ</th><th className="num">ดอกเบี้ยค้าง</th>
                <th className="num">ค่าปรับ</th><th className="center">งวดค้าง</th><th className="num">รวมต่อสัญญา</th>
              </tr>
            </thead>
            <tbody>
              {rec.debts.map((d, i) => (
                <tr key={i}>
                  <td>{d.type}</td>
                  <td className="mono">{d.contractNo}</td>
                  <td className="center"><span className={'chip ' + (d.status === 'ผิดนัดชำระ' || d.status === 'ดำเนินคดี' ? 'danger' : 'warning')}>{d.status}</span></td>
                  <td className="num mono">{fmt.money(d.principalRemaining, 2)}</td>
                  <td className="num mono">{fmt.money(d.interestDue, 2)}</td>
                  <td className="num mono">{fmt.money(d.penalty, 2)}</td>
                  <td className="center">{d.overdueInstallments} งวด</td>
                  <td className="num mono"><b>{fmt.money(window.dnContractTotal(d), 2)}</b></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan="7" className="right"><b>รวมหนี้คงค้างทั้งหมด</b></td><td className="num mono"><b>{fmt.money(rec.totalOutstanding, 2)}</b></td></tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ผู้ค้ำประกันที่แจ้งในหนังสือฉบับเดียว</h3></div>
        {(rec.guarantors || []).length === 0 ? (
          <div className="empty-state">ไม่มีผู้ค้ำประกันในรายการนี้</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr><th style={{ width: 40 }} className="center">ลำดับ</th><th>สัญญา</th><th>ผู้ค้ำประกัน</th><th>ชื่อ-ชื่อสกุล</th><th>สังกัด</th></tr>
              </thead>
              <tbody>
                {rec.guarantors.map((g, i) => (
                  <tr key={i}>
                    <td className="center">{i + 1}</td>
                    <td className="mono">{g.contractNo}</td>
                    <td className="mono">{g.memberCode || '—'}</td>
                    <td>{g.prefix}{g.name}</td>
                    <td>{g.dept || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ผู้ลงนาม และสถานะ</h3></div>
        <div className="form-grid">
          <OrqDetailRow label="ผู้ลงนาม" value={rec.signer} />
          <OrqDetailRow label="ตำแหน่ง" value={rec.signerPosition} />
          <OrqDetailRow label="สถานะรายการ" value={st.l} />
          <OrqDetailRow label="จำนวนครั้งที่พิมพ์" value={rec.printCount + ' ครั้ง'} />
          <OrqDetailRow label="พิมพ์ล่าสุด" value={rec.printedDate ? fmt.date(rec.printedDate) : '—'} />
          <OrqDetailRow label="วันที่ปิดรายการ" value={rec.closedDate ? fmt.date(rec.closedDate) : '—'} />
        </div>
      </div>
    </div>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะโมดูลขอให้ชำระหนี้) ────────────────────
function OrqHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('ขอให้ชำระหนี้'))]
    .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)',
                        color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>ประวัติการทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>ขอให้ชำระหนี้ (แจ้งต้นสังกัด)</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>
              ยังไม่มีประวัติการทำรายการ
            </div>
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
//  หน้าหลัก — สลับ list / form / detail + จัดการพิมพ์ + สถานะ
// ════════════════════════════════════════════════════════════════════
function DebtOrgRequestPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.orqLoad);
  const [mode, setMode] = useState('list');     // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const [emsScan, setEmsScan] = useState(false);
  const [emsQuick, setEmsQuick] = useState(null);

  const persist = (next) => { setList(next); window.orqSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const doPrint = (rec) => {
    setPrintDoc(rec);
    const updated = {
      ...rec,
      printCount: (rec.printCount || 0) + 1,
      printedDate: window.dnToday(),
      status: rec.status === 'closed' ? 'closed' : 'printed',
    };
    const next = list.map(r => r.id === rec.id ? updated : r);
    persist(next);
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log({
      action: 'print', module: 'ทะเบียนและติดตามหนี้ — ขอให้ชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `พิมพ์สำเนาหนังสือขอให้ชำระหนี้ (แจ้งต้นสังกัด${rec.org && rec.org.name ? ' ' + rec.org.name : ''}) ${rec.id} ครั้งที่ ${rec.round} (พิมพ์ครั้งที่ ${updated.printCount})`,
      changes: [{ field: 'จำนวนครั้งที่พิมพ์', before: String(rec.printCount || 0), after: String(updated.printCount) }],
    });
    setTimeout(() => window.printOrgRequest(onToast), 80);
  };

  const closeRec = (rec) => {
    const updated = { ...rec, status: 'closed', closedDate: window.dnToday() };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ขอให้ชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ปิดรายการขอให้ชำระหนี้ ${rec.id} — ชำระครบถ้วน`,
      changes: [{ field: 'สถานะรายการ', before: window.orqStatus(rec.status).l, after: 'ปิดรายการ (ชำระครบ)' }],
    });
    onToast && onToast(`ปิดรายการ ${rec.id} เรียบร้อยแล้ว`);
  };

  // อัปเดตหมายเลข EMS (จากสถานีสแกน หรือปุ่มไมครอนรายฉบับ)
  const saveEms = (rec, ems) => {
    const updated = { ...rec, emsNo: ems };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ขอให้ชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `อัปเดตเลข EMS ของหนังสือ ${rec.id} → ${ems}`,
      changes: [{ field: 'เลข EMS', before: rec.emsNo || '—', after: ems }],
    });
    onToast && onToast(`อัปเดตเลข EMS ของ ${rec.id} เป็น ${ems} แล้ว`);
  };

  const submit = (rec, alsoPrint) => {
    const next = [rec, ...list];
    persist(next);
    const c = window.dnCause(rec.causeCode) || {};
    audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ขอให้ชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `บันทึกรายการขอให้ชำระหนี้ (แจ้งต้นสังกัด ${(rec.org && rec.org.name) || rec.dept}) ${rec.id} · ${rec.memberName} · หนี้คงค้าง ${fmt.money(rec.totalOutstanding, 2)} บาท`,
      changes: [
        { field: 'ทะเบียนขอให้ชำระหนี้', before: '—', after: rec.id },
        { field: 'เลขที่หนังสือ', before: '—', after: rec.docNo },
        { field: 'หน่วยงานต้นสังกัด', before: '—', after: (rec.org && rec.org.name) || rec.dept },
        { field: 'สาเหตุที่ติดตาม', before: '—', after: rec.causeCode === 'C99' ? rec.causeOther : c.label },
        { field: 'หนี้คงค้างรวม', before: '—', after: `${fmt.money(rec.totalOutstanding, 2)} บาท` },
      ],
    });
    onToast && onToast(`บันทึกรายการ ${rec.id} · ${rec.memberName} เรียบร้อยแล้ว`);
    setMode('list');
    if (alsoPrint) doPrint(rec);
  };

  return (
    <>
      {mode === 'list'
        ? <OrqListView list={list} onCreate={() => setMode('form')} onOpenHistory={() => setHistOpen(true)}
                       onOpen={openDetail} onPrint={doPrint}
                       onEmsScan={() => setEmsScan(true)} onEmsQuick={(r) => setEmsQuick(r)} />
        : mode === 'detail'
          ? <OrqDetailView rec={current} onBack={() => setMode('list')} onPrint={doPrint} onClose={closeRec} />
          : <OrqCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} />}
      {histOpen && <OrqHistoryDrawer onClose={() => setHistOpen(false)} />}
      {emsScan && <EmsScanStation records={list} docNoOf={(r) => r.docNo} docLabel="เลขที่หนังสือ"
                                  onSaveEms={saveEms} onClose={() => setEmsScan(false)} />}
      {emsQuick && <EmsQuickModal rec={emsQuick} docNoOf={(r) => r.docNo} docLabel="เลขที่หนังสือ"
                                  onSaveEms={saveEms} onClose={() => setEmsQuick(null)} />}
      <OrqPrintSheet rec={printDoc} />
    </>
  );
}

Object.assign(window, { DebtOrgRequestPage });
