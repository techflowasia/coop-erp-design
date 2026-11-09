// ════════════════════════════════════════════════════════════════════
//  ใบคำขอพักชำระหนี้ — ทะเบียน (list) + รายละเอียด + ประวัติ + helpers
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
// ════════════════════════════════════════════════════════════════════

const dsToday = () => new Date().toISOString().slice(0, 10);
const zeroMap = (fields) => { const o = {}; (fields || []).forEach(f => o[f.k] = 0); return o; };

// ─── ป้ายวันที่ปัจจุบัน — มุมขวาล่างของหน้าจอ ────────────────────────
function DsTodayBadge() {
  return (
    <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
      <Icon name="calendar" size={13} />
      <span>วันที่ปัจจุบัน</span>
      <b className="mono">{fmt.date(dsToday())}</b>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนคำขอพักชำระหนี้ (list)
// ════════════════════════════════════════════════════════════════════
function DsListView({ list, onCreate, onOpen, onOpenHistory }) {
  const [q, setQ] = useState('');
  const [modeF, setModeF] = useState('all');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) ||
                        (x.contractNo || '').toLowerCase().includes(n));
    }
    if (modeF !== 'all') r = r.filter(x => x.payMode === modeF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.recordDate.localeCompare(a.recordDate) || b.id.localeCompare(a.id));
  }, [list, q, modeF, statusF]);

  const hasFilter = q || modeF !== 'all' || statusF !== 'all';
  const clear = () => { setQ(''); setModeF('all'); setStatusF('all'); };

  const effCnt = list.filter(r => r.status === 'effective').length;
  const recCnt = list.filter(r => r.status === 'recorded').length;
  const totalHeld = list.filter(r => r.status !== 'cancelled')
    .reduce((s, r) => s + (Number(r.remaining) || 0), 0);

  return (
    <div data-screen-label="หน้าทะเบียนใบคำขอพักชำระหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ใบคำขอพักชำระหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · บันทึกคำขอพักชำระหนี้ของสมาชิก พร้อมเงื่อนไขและตารางพักชำระ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> บันทึกคำขอ</button>
      </div>

      {/* KPI */}
      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">คำขอทั้งหมด</div>
          <div className="stat-value">{fmt.int(list.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">รอมีผล</div>
          <div className="stat-value">{fmt.int(recCnt)}</div>
          <div className="stat-sub">บันทึกแล้ว</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">มีผลบังคับแล้ว</div>
          <div className="stat-value">{fmt.int(effCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>effective</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขสมาชิก / ชื่อ / เลขที่สัญญา / เลขที่คำขอ</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น M-067012, L-2022-0455" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>รูปแบบพักชำระ</span>
            <select className="filter-select" value={modeF} onChange={(e) => setModeF(e.target.value)} style={{ width: 180 }}>
              <option value="all">ทุกรูปแบบ</option>
              {window.DS_PAY_MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 150 }}>
              <option value="all">ทุกสถานะ</option>
              {window.DS_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>
          )}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่คำขอ</th>
                <th>สมาชิก</th>
                <th>สัญญา / ประเภท</th>
                <th className="center">รูปแบบพักชำระ</th>
                <th className="center">จำนวนเดือน</th>
                <th className="center">เริ่มมีผล</th>
                <th className="num">ยอดคงเหลือ</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.dsStatus(r.status);
                const pm = window.dsPayMode(r.payMode);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mono">{r.contractNo}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{r.loanType}</div>
                    </td>
                    <td className="center"><span className={'chip ' + (r.skipCalc ? 'primary' : r.payMode === 'hold-all' ? 'warning' : 'info')}>{r.skipCalc ? 'สัญญา R' : pm.l}</span></td>
                    <td className="center mono">{r.skipCalc ? '—' : r.months + ' เดือน'}</td>
                    <td className="center">{r.skipCalc ? 'ทันที' : window.dsMonthLabel(r.startMonth)}</td>
                    <td className="num mono">{fmt.money(r.remaining, 0)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดคำขอพักชำระหนี้
        </p>
      </div>

      <DsTodayBadge />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดคำขอ (อ่านอย่างเดียว) — รูปแบบ lt-head-card
// ════════════════════════════════════════════════════════════════════
function DsKv({ label, value, mono }) {
  return (
    <div className="icr-kv">
      <span className="icr-kv-k">{label}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}

function DsDetailView({ rec, onBack, onMarkEffective, onCancel }) {
  if (!rec) return null;
  const st = window.dsStatus(rec.status);
  const pm = window.dsPayMode(rec.payMode);
  const sumInc = window.dsSumIncome(rec.income || {});
  const sumDed = window.dsSumDeduct(rec.deduct || {});
  const netCalc = sumInc - sumDed;
  const sched = rec.schedule || [];
  const schedTotalPer = sched.reduce((s, r) => s + (Number(r.perInstallment) || 0), 0);
  const schedTotalInt = sched.reduce((s, r) => s + (Number(r.interestInstallment) || 0), 0);

  return (
    <div data-screen-label="หน้ารายละเอียดใบคำขอพักชำระหนี้">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn sm" disabled><Icon name="print" /> พิมพ์</button>
        {rec.status === 'recorded' && (
          <>
            <button className="btn sm danger" onClick={() => onCancel(rec)}><Icon name="close" size={13} /> ยกเลิกคำขอ</button>
            <button className="btn primary sm" onClick={() => onMarkEffective(rec)}><Icon name="check" /> ทำให้มีผล</button>
          </>
        )}
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="calendar" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">ใบคำขอพักชำระหนี้</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{rec.projectName || pm.l}</span><span className="dot" />
              <span>บันทึกโดย {rec.enteredBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            <span className={'chip ' + (rec.skipCalc ? 'primary' : rec.payMode === 'hold-all' ? 'warning' : 'info')}>{rec.skipCalc ? 'สัญญา R · ทันที' : rec.months + ' เดือน'}</span>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">สมาชิก</span>
            <span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">สัญญาเงินกู้</span>
            <span className="lt-date-v mono">{rec.contractNo} <span className="muted" style={{ fontWeight: 400 }}>· {rec.loanType}</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">เริ่มมีผล</span>
            <span className="lt-date-v">{window.dsMonthLabel(rec.startMonth)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">วันที่ขอ</span>
            <span className="lt-date-v">{fmt.date(rec.recordDate)}</span>
          </div>
        </div>
      </div>

      {/* รายละเอียดสัญญา */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดสัญญา</h3></div>
        <div className="icr-detail-compare">
          <div className="icr-dc-col">
            <DsKv label="งวดชำระล่าสุด" value={`${rec.lastTerm} งวด`} mono />
            <DsKv label="ยอดอนุมัติ" value={fmt.money(rec.approved, 2)} mono />
            <DsKv label="ยอดรอเบิก" value={fmt.money(rec.pendingDisburse, 2)} mono />
          </div>
          <div className="icr-dc-col new">
            <DsKv label="ยอดคงเหลือ" value={fmt.money(rec.remaining, 2)} mono />
            <DsKv label="ดอกเบี้ยค้าง" value={fmt.money(rec.interestDue, 2)} mono />
            <DsKv label="รูปแบบพักชำระ" value={pm.l} />
          </div>
        </div>
        <div className="icr-delta-note">
          <Icon name="info" size={13} />
          <span>{pm.desc}</span>
        </div>
      </div>

      {/* ความสามารถในการชำระ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ความสามารถในการชำระ</h3></div>
        <div className="ds-sum-strip" style={{ marginTop: 0 }}>
          <DsSumTile icon="wallet" label="รวมเงินได้" value={sumInc} tone="income" />
          <DsSumTile icon="receipt" label="รวมเงินหัก" value={sumDed} tone="deduct" />
          <DsSumTile icon="money" label="ดอกเบี้ย (คงต้น)" value={rec.interestDue} tone="warn" />
          <DsSumTile icon="check" label="รายได้คำนวณ" value={netCalc} tone="net" />
        </div>
      </div>

      {/* ตารางการชำระหนี้ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ตารางการชำระหนี้</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl ds-sched-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 56 }}>ลำดับ</th>
                <th className="center">ตั้งแต่งวด</th>
                <th className="center">ถึงงวด</th>
                <th className="num">ชำระต่องวด</th>
                <th className="num">ผ่อนดอกเบี้ยค้าง</th>
                <th className="center">วันที่ป้อน</th>
              </tr>
            </thead>
            <tbody>
              {sched.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">— ไม่มีรายการ —</td></tr>
              ) : sched.map((r, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="center mono">{r.from}</td>
                  <td className="center mono">{r.to}</td>
                  <td className="num mono">{fmt.money(r.perInstallment, 2)}</td>
                  <td className="num mono">{fmt.money(r.interestInstallment, 2)}</td>
                  <td className="center mono">{fmt.date(r.enteredDate)}</td>
                </tr>
              ))}
            </tbody>
            {sched.length > 0 && (
              <tfoot>
                <tr className="ds-sched-tot">
                  <td colSpan="3" className="right">รวม</td>
                  <td className="num mono">{fmt.money(schedTotalPer, 2)}</td>
                  <td className="num mono">{fmt.money(schedTotalInt, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* หมายเหตุ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หมายเหตุ</h3></div>
        <div className="icr-note-view">{rec.note ? rec.note : <span className="muted">— ไม่มีหมายเหตุ —</span>}</div>
      </div>

      <DsTodayBadge />
    </div>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะโมดูลนี้) ─────────────────────────────
function DsHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('ใบคำขอพักชำระหนี้'))]
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
            <div className="muted" style={{ fontSize: 11 }}>ใบคำขอพักชำระหนี้</div>
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

Object.assign(window, { DsListView, DsDetailView, DsHistoryDrawer, DsTodayBadge, dsToday, zeroMap });
