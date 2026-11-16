// ════════════════════════════════════════════════════════════════════
//  ทะเบียนอายัดเงิน — ทะเบียน (list) + รายละเอียด + ประวัติ
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
// ════════════════════════════════════════════════════════════════════

// ─── ป้ายวันที่ปัจจุบัน — มุมขวาล่างของหน้าจอ ────────────────────────
function SqTodayBadge() {
  return (
    <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
      <Icon name="calendar" size={13} />
      <span>วันที่ปัจจุบัน</span>
      <b className="mono">{fmt.date(window.sqToday())}</b>
    </div>
  );
}

const sqInitial = (name) => String(name || '?').replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1);

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนอายัดเงิน (list)
// ════════════════════════════════════════════════════════════════════
function SqListView({ list, onCreate, onOpen, onOpenHistory }) {
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => (x.memberCode || '').toLowerCase().includes(n) ||
                        (x.memberName || '').toLowerCase().includes(n) ||
                        (x.id || '').toLowerCase().includes(n) ||
                        (x.seizureNo || '').toLowerCase().includes(n));
    }
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => (b.regDate || '').localeCompare(a.regDate || '') || (b.id || '').localeCompare(a.id || ''));
  }, [list, q, statusF]);

  const hasFilter = q || statusF !== 'all';
  const clear = () => { setQ(''); setStatusF('all'); };

  const effCnt = list.filter(r => r.status === 'effective').length;
  const recCnt = list.filter(r => r.status === 'recorded').length;
  const totalSeized = list.filter(r => r.status !== 'cancelled')
    .reduce((s, r) => s + (Number(r.seizureAmount) || 0), 0);

  return (
    <div data-screen-label="หน้าทะเบียนอายัดเงิน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ทะเบียนอายัดเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · บันทึกการอายัดเงินของสมาชิกที่มีหนี้คงค้าง พร้อมคำนวณยอดเงินอายัดและออกหนังสืออายัด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> บันทึกอายัดเงิน</button>
      </div>

      {/* KPI */}
      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">รายการทั้งหมด</div>
          <div className="stat-value">{fmt.int(list.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">รอมีผลอายัด</div>
          <div className="stat-value">{fmt.int(recCnt)}</div>
          <div className="stat-sub">บันทึกแล้ว</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">อายัดแล้ว</div>
          <div className="stat-value">{fmt.int(effCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>effective</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ยอดเงินอายัดรวม</div>
          <div className="stat-value mono">{fmt.money(totalSeized, 0)}</div>
          <div className="stat-sub">บาท</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขสมาชิก / ชื่อ / เลขที่อายัด / ทะเบียนติดตาม</span>
            <div className="search" style={{ flex: 'none', width: 320, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น M-067012, SQ690100042" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 160 }}>
              <option value="all">ทุกสถานะ</option>
              {window.SQ_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
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
                <th>ทะเบียนติดตาม</th>
                <th>เลขที่อายัด</th>
                <th>สมาชิก</th>
                <th className="center">วันที่ลงทะเบียน</th>
                <th className="num">หนี้คงค้าง</th>
                <th className="num">ทุนเรือนหุ้น</th>
                <th className="num">ยอดเงินอายัด</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบรายการอายัดเงินที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.sqStatus(r.status);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="mono">{r.seizureNo}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{sqInitial(r.memberName)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td className="center mono">{fmt.date(r.regDate)}</td>
                    <td className="num mono">{fmt.money(r.outstanding, 2)}</td>
                    <td className="num mono">{fmt.money(r.shares, 2)}</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(r.seizureAmount, 2)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดรายการอายัดเงิน · ยอดเงินอายัด = หนี้คงค้าง − ทุนเรือนหุ้น
        </p>
      </div>

      <SqTodayBadge />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดรายการอายัดเงิน (อ่านอย่างเดียว) — รูปแบบ lt-head-card
// ════════════════════════════════════════════════════════════════════
function SqDetailView({ rec, onBack, onMarkEffective, onCancel, onToast }) {
  if (!rec) return null;
  const st = window.sqStatus(rec.status);
  const debtTotal = (rec.debts || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const selContracts = (rec.contracts || []).filter(c => c.selected);

  return (
    <div data-screen-label="หน้ารายละเอียดอายัดเงิน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <div className="sq-action-group">
          <button className="btn sm" onClick={() => onToast && onToast('เตรียมพิมพ์หนังสืออายัดหนี้ · ' + rec.seizureNo)}><Icon name="print" /> พิมพ์อายัด</button>
          <button className="btn sm" onClick={() => onToast && onToast('เตรียมพิมพ์สำเนาหนังสืออายัด · ' + rec.seizureNo)}><Icon name="print" /> พิมพ์สำเนา</button>
          {rec.status === 'recorded' && (
            <>
              <button className="btn sm danger" onClick={() => onCancel(rec)}><Icon name="close" size={13} /> ยกเลิก</button>
              <button className="btn primary sm" onClick={() => onMarkEffective(rec)}><Icon name="check" /> ทำให้มีผลอายัด</button>
            </>
          )}
        </div>
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="report" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">ทะเบียนอายัดเงิน</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span className="mono">อายัดเลขที่ {rec.seizureNo}</span><span className="dot" />
              <span>บันทึกโดย {rec.enteredBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            {rec.notifyGuarantor && <span className="chip warning"><Icon name="info" size={11} /> แจ้งผู้ค้ำล่วงหน้า</span>}
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">สมาชิกผู้ถูกอายัด</span>
            <span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">สังกัด</span>
            <span className="lt-date-v">{rec.dept} <span className="muted" style={{ fontWeight: 400 }}>· {rec.deptType}</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">วันที่ลงทะเบียน</span>
            <span className="lt-date-v">{fmt.date(rec.regDate)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ต/บ ถึง</span>
            <span className="lt-date-v">{rec.effectiveTo ? fmt.date(rec.effectiveTo) : '—'}</span>
          </div>
        </div>
      </div>

      {/* สรุปยอดเงินอายัด */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สรุปยอดเงินอายัด</h3></div>
        <div className="ds-sum-strip" style={{ marginTop: 0 }}>
          <SqSumTile icon="money" label="หนี้คงค้าง" value={rec.outstanding} tone="warn" />
          <SqSumTile icon="wallet" label="ทุนเรือนหุ้น (หัก)" value={rec.shares} tone="income" />
          <SqSumTile icon="check" label="ยอดเงินอายัด" value={rec.seizureAmount} tone="net" />
        </div>
        <div className="icr-delta-note">
          <Icon name="info" size={13} />
          <span>ยอดเงินอายัด = หนี้คงค้าง <b>{fmt.money(rec.outstanding, 2)}</b> − ทุนเรือนหุ้น <b>{fmt.money(rec.shares, 2)}</b> = <b>{fmt.money(rec.seizureAmount, 2)}</b> บาท</span>
        </div>
      </div>

      {/* ข้อมูลการอายัด */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลการอายัด / ผู้ลงนาม</h3></div>
        <div className="icr-detail-compare">
          <div className="icr-dc-col">
            <SqKv label="ผู้ลงนาม" value={rec.signer} />
            <SqKv label="ตำแหน่ง" value={rec.signerPosition} />
            <SqKv label="สาเหตุที่ติดตาม" value={rec.cause} />
          </div>
          <div className="icr-dc-col new">
            <SqKv label="เมื่อวันที่ (เกิดเหตุ)" value={rec.causeDate ? fmt.date(rec.causeDate) : '—'} />
            <SqKv label="แจ้งผู้ค้ำล่วงหน้า" value={rec.notifyGuarantor ? 'แจ้งแล้ว' : 'ไม่แจ้ง'} />
            <SqKv label="วันที่บันทึก" value={rec.enteredAt} mono />
          </div>
        </div>
      </div>

      {/* เอกสารแนบ + สัญญาเงินกู้ */}
      <div className="ds-bottom-grid" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สิ่งที่ส่งมาด้วย (เอกสารอื่นๆ)</h3></div>
          {(rec.attachments || []).length === 0 ? <div className="muted" style={{ fontSize: 12 }}>— ไม่มีเอกสารแนบ —</div> : (
            <ol className="sq-doc-list">
              {rec.attachments.map((a, i) => <li key={a.id || i}>{a.text}</li>)}
            </ol>
          )}
        </div>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สิ่งที่ส่งมาด้วย (สัญญาเงินกู้)</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>สัญญาเลขที่</th><th className="center">ลงวันที่</th></tr></thead>
              <tbody>
                {selContracts.length === 0 ? <tr><td colSpan="2" className="empty-state">— ไม่มีสัญญาที่เลือก —</td></tr>
                  : selContracts.map((c, i) => (
                    <tr key={i}><td className="mono">{c.contractNo}</td><td className="center mono">{fmt.date(c.date)}</td></tr>
                  ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>

      {/* สำเนาเรียนผู้เกี่ยวข้อง + ผู้ค้ำประกัน */}
      <div className="ds-bottom-grid" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สำเนาเรียนผู้ที่เกี่ยวข้อง</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th className="center">ประเภท</th><th className="center">เลขสมาชิก</th><th>รายละเอียด</th></tr></thead>
              <tbody>
                {(rec.relatedParties || []).length === 0 ? <tr><td colSpan="3" className="empty-state">— ไม่มีรายการ —</td></tr>
                  : rec.relatedParties.map((p, i) => (
                    <tr key={p.id || i}>
                      <td className="center"><span className="chip">{p.type}</span></td>
                      <td className="center mono">{p.memberCode || '—'}</td>
                      <td>{p.detail}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div></div>
        </div>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สำเนาเรียนผู้ค้ำประกัน</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th className="mono">สัญญา</th><th className="center">ผู้ค้ำประกัน</th><th>ชื่อ-ชื่อสกุล</th><th>สังกัด</th></tr></thead>
              <tbody>
                {(rec.guarantors || []).length === 0 ? <tr><td colSpan="4" className="empty-state">— ไม่มีผู้ค้ำประกัน —</td></tr>
                  : rec.guarantors.map((g, i) => (
                    <tr key={i}>
                      <td className="mono">{g.contractNo}</td>
                      <td className="center mono">{g.memberCode}</td>
                      <td>{g.name}</td>
                      <td>{g.dept}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>

      {/* รายการหนี้ค้างชำระ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายการหนี้ค้างชำระ</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 56 }}>ลำดับ</th>
                <th className="center">ประเภท</th>
                <th>สัญญาเลขที่</th>
                <th className="center">สถานะ</th>
                <th className="num">ยอดค้างชำระ (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {(rec.debts || []).map((d, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="center"><span className="chip">{d.typeCode}</span></td>
                  <td className="mono">{d.contractNo === '-' ? '—' : d.contractNo}</td>
                  <td className="center">{d.statusCode === '-' ? '—' : <span className="chip info">{d.statusCode}</span>}</td>
                  <td className="num mono">{fmt.money(d.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="ds-sched-tot">
                <td colSpan="4" className="right">รวมยอดค้างชำระ</td>
                <td className="num mono">{fmt.money(debtTotal, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      <SqTodayBadge />
    </div>
  );
}

// ─── การ์ดสรุป (reuse ระบบ ds-sum-tile) ──────────────────────────────
function SqSumTile({ icon, label, value, tone }) {
  return (
    <div className={'ds-sum-tile' + (tone ? ' ' + tone : '')}>
      <div className="ds-sum-ico"><Icon name={icon} size={16} /></div>
      <div className="ds-sum-body">
        <span className="ds-sum-label">{label}</span>
        <span className="ds-sum-value mono">{fmt.money(value, 2)}</span>
      </div>
    </div>
  );
}

function SqKv({ label, value, mono }) {
  return (
    <div className="icr-kv">
      <span className="icr-kv-k">{label}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะโมดูลนี้) ─────────────────────────────
function SqHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('ทะเบียนอายัดเงิน'))]
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
            <div className="muted" style={{ fontSize: 11 }}>ทะเบียนอายัดเงิน</div>
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

Object.assign(window, { SqListView, SqDetailView, SqHistoryDrawer, SqTodayBadge, SqSumTile, SqKv, sqInitial });
