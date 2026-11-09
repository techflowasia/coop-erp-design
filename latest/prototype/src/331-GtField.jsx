// ════════════════════════════════════════════════════════════════════
//  รับโอนเลขสัญญาผู้ค้ำประกัน — ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  ทะเบียน (list) + รายละเอียด (detail) + ทำรายการโอน (GtTransferWorkspace)
//  โอนหนี้ให้ผู้ค้ำ (TRN) / โอนกลับผู้กู้ (RTN)
// ════════════════════════════════════════════════════════════════════

// ─── helper: field row ──────────────────────────────────────────────
function GtField({ label, value, mono, strong, color }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '')} style={{ fontWeight: strong ? 700 : undefined, color }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
const gtTypeChip = (v) => v === 'RTN'
  ? <span className="chip warning">RTN · โอนกลับผู้กู้</span>
  : <span className="chip info">TRN · โอนให้ผู้ค้ำ</span>;

// ─── ทะเบียนรายการโอนหนี้ (list) ────────────────────────────────────
function GtListView({ list, onCreate, onOpenHistory, onOpen }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (dateFrom) r = r.filter(x => x.transferDate >= dateFrom);
    if (dateTo) r = r.filter(x => x.transferDate <= dateTo);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x =>
        x.id.toLowerCase().includes(n) ||
        (x.contractNo || '').toLowerCase().includes(n) ||
        (x.borrowerName || '').toLowerCase().includes(n) ||
        (x.borrowerCode || '').toLowerCase().includes(n) ||
        (x.allocations || []).some(a => (a.name || '').toLowerCase().includes(n) || (a.code || '').toLowerCase().includes(n) || (a.transferredContractNo || '').toLowerCase().includes(n)));
    }
    if (typeF !== 'all') r = r.filter(x => x.transferType === typeF);
    if (statusF !== 'all') r = r.filter(x => x.docStatus === statusF);
    return [...r].sort((a, b) => b.transferDate.localeCompare(a.transferDate) || b.id.localeCompare(a.id));
  }, [list, dateFrom, dateTo, q, typeF, statusF]);

  const hasFilter = dateFrom || dateTo || q || typeF !== 'all' || statusF !== 'all';
  const clear = () => { setDateFrom(''); setDateTo(''); setQ(''); setTypeF('all'); setStatusF('all'); };

  const totalAmount = rows.reduce((s, r) => s + window.gtTransferTotal(r), 0);
  const draftCnt = rows.filter(r => r.docStatus === 'draft').length;

  return (
    <div data-screen-label="หน้าทะเบียนรับโอนเลขสัญญาผู้ค้ำประกัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>โอนหนี้ให้ผู้ค้ำ / โอนกลับผู้กู้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · โอนหนี้ให้ผู้ค้ำ (TRN) / โอนกลับผู้กู้ (RTN) — กรณีผู้กู้เสียชีวิต ลาออก ให้ออก ไล่ออก ปลดออก
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> ทำรายการโอนหนี้</button>
      </div>

      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">รายการโอนทั้งหมด</div>
          <div className="stat-value">{fmt.int(rows.length)}</div>
          <div className="stat-sub">ใบทำรายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">รออนุมัติ</div>
          <div className="stat-value">{fmt.int(draftCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>ยังไม่อนุมัติ</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>วันที่โอน (จาก – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ width: 148 }} className="filter-select" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ width: 148 }} className="filter-select" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สัญญา / ผู้กู้ / ผู้ค้ำ / ทะเบียนรับโอน</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น L-2021-0332, GS-2569-0117, M-058241" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทการโอน</span>
            <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ width: 150 }}>
              <option value="all">ทุกประเภท</option>
              {window.GT_TRANSFER_TYPES.map(t => <option key={t.v} value={t.v}>{t.v}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะใบทำรายการ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 170 }}>
              <option value="all">ทุกสถานะ</option>
              {window.GT_DOC_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
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
                <th>ทะเบียนรับโอน</th>
                <th className="center">ประเภท</th>
                <th>สัญญาผู้กู้</th>
                <th>ผู้กู้เดิม</th>
                <th className="center">ผู้รับโอน</th>
                <th className="center">วันที่โอน</th>
                <th className="num">ยอดโอน (P+I)</th>
                <th className="center">สถานะใบทำรายการ</th>
                <th className="center" style={{ width: 64 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบรายการโอนที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const ds = window.gtDocStatus(r.docStatus);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="center">{gtTypeChip(r.transferType)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{r.contractNo}<div className="muted" style={{ fontSize: 10 }}>{r.loanType}</div></td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.borrowerName}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{r.borrowerCode}</div>
                    </td>
                    <td className="center">{(r.allocations || []).length} ราย</td>
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
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดการโอน ยอดเงินต้น/ดอกเบี้ยที่โอน ผู้ค้ำที่รับภาระ และเชื่อมโยงข้อมูลการเรียกเก็บหนี้
        </p>
      </div>
    </div>
  );
}

// ─── รายละเอียดรายการโอน (อ่านอย่างเดียว) ────────────────────────────
function GtDetailView({ rec, onBack, onApprove, onCancel, onCollect, onPrint }) {
  if (!rec) return null;
  const ds = window.gtDocStatus(rec.docStatus);
  const cs = window.gtStatus(rec.collectStatus);
  const tt = window.gtTransferType(rec.transferType);
  const exit = window.gtExitReason(rec.exitReasonCode) || {};
  const exitTxt = rec.exitReasonCode === 'E99' ? (rec.exitReasonOther || 'อื่น ๆ') : (exit.label || '—');
  const total = window.gtTransferTotal(rec);

  return (
    <div data-screen-label="หน้ารายละเอียดการโอนหนี้ให้ผู้ค้ำประกัน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        {rec.docStatus === 'draft' && <button className="btn sm" onClick={() => onCancel(rec)}><Icon name="close" /> ยกเลิกรายการ</button>}
        {rec.docStatus === 'draft' && <button className="btn sm" onClick={() => onApprove(rec)}><Icon name="check" /> อนุมัติรายการ</button>}
        {rec.docStatus === 'approved' && rec.collectStatus !== 'done' && <button className="btn sm" onClick={() => onCollect(rec)}><Icon name="check" /> ปิดหนี้ (ชำระครบ)</button>}
        <button className="btn primary sm" onClick={() => onPrint(rec)}><Icon name="print" /> พิมพ์ใบทำรายการ</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">ใบทำรายการโอนหนี้ผู้ค้ำประกัน</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{gtTypeChip(rec.transferType)}</span><span className="dot" />
              <span>สัญญาผู้กู้ <b className="mono">{rec.contractNo}</b></span><span className="dot" />
              <span>{rec.loanType}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + ds.pill} style={{ height: 24 }}>{ds.l}</span>
            <span className={'chip ' + (cs.pill === 'ok' ? 'success' : cs.pill === 'bad' ? 'danger' : cs.pill === 'warn' ? 'warning' : 'info')}>เรียกเก็บ: {cs.l}</span>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">ผู้กู้เดิม</span><span className="lt-date-v">{rec.borrowerName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.borrowerCode})</span></span></div>
          <div className="lt-date"><span className="lt-date-k">วันที่โอน</span><span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>{fmt.date(rec.transferDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ยอดที่โอน (P + I)</span><span className="lt-date-v" style={{ color: 'var(--danger)', fontWeight: 700 }}>฿ {fmt.money(total, 2)}</span></div>
          <div className="lt-date"><span className="lt-date-k">อัตราดอกเบี้ยที่ใช้</span><span className="lt-date-v">{(rec.appliedRate || 0).toFixed(2)}%</span></div>
        </div>
      </div>

      {/* ข้อมูลสัญญา + ยอดก่อนทำรายการ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สัญญาที่โอนหนี้ และยอดก่อนทำรายการ</h3></div>
        <div className="form-grid">
          <GtField label="เลขที่สัญญาผู้กู้" value={rec.contractNo} mono />
          <GtField label="รหัสสมาชิก (ผู้กู้)" value={rec.borrowerCode} mono />
          <GtField label="ชื่อ – นามสกุล" value={rec.borrowerName} />
          <GtField label="ประเภทเงินกู้" value={rec.loanType} />
          <GtField label="ประเภทสัญญา" value={rec.contractType} />
          <GtField label="สถานะกฎหมาย" value={rec.legalStatus === 'ดำเนินคดี' ? <span className="pill bad">ดำเนินคดี</span> : <span className="pill ok">{rec.legalStatus}</span>} />
          <GtField label="คิด ด/บ ล่าสุด" value={fmt.date(rec.lastInterestDate)} mono />
          <GtField label="ตั้งดอกเบี้ยค้างถึงวันที่" value={fmt.date(rec.accrueToDate)} mono />
        </div>
        <div className="summary-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: 12 }}>
          <div className="summary-card"><div className="label">ต้นคงเหลือ</div><div className="value">฿ {fmt.money(rec.principalRemaining, 2)}</div></div>
          <div className="summary-card"><div className="label">ด/บ ค้าง</div><div className="value">฿ {fmt.money(rec.interestAccrued, 2)}</div></div>
          <div className="summary-card"><div className="label">ยอดชำระ / งวด</div><div className="value">฿ {fmt.money(rec.installment, 2)}</div></div>
          <div className="summary-card"><div className="label">งวดล่าสุด</div><div className="value">{rec.lastPeriod}</div></div>
        </div>
      </div>

      {/* ยอดที่โอน + เหตุ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ยอดที่โอน</h3></div>
        <div className="summary-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 0 }}>
          <div className="summary-card"><div className="label">โอนเงินต้น (P)</div><div className="value">฿ {fmt.money(rec.transferPrincipal, 2)}</div></div>
          <div className="summary-card"><div className="label">โอนดอกเบี้ย (I)</div><div className="value">฿ {fmt.money(rec.transferInterest, 2)}</div></div>
          <div className="summary-card accent"><div className="label">รวม (P + I)</div><div className="value" style={{ color: 'var(--danger)' }}>฿ {fmt.money(total, 2)}</div></div>
        </div>
        {rec.transferType === 'TRN' && (
          <div className="form-grid" style={{ marginTop: 14 }}>
            <GtField label="เหตุที่ผู้กู้ออก" value={exitTxt} />
            <GtField label="อัตราดอกเบี้ยผู้ค้ำ" value={(window.gtRateMode(rec.rateMode) || {}).l} />
            <GtField label="อัตราที่ใช้จริง" value={(rec.appliedRate || 0).toFixed(2) + '%'} strong />
          </div>
        )}
      </div>

      {/* ผู้ค้ำที่รับโอนหนี้ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>{rec.transferType === 'RTN' ? 'ผู้รับโอน (ผู้กู้เดิม)' : 'ผู้ค้ำที่รับโอนหนี้'}</h3>
          <span className="gc-count">{(rec.allocations || []).length} ราย</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขสมาชิก</th><th>ชื่อ – นามสกุล</th><th>เลขที่สัญญารับโอน</th>
                <th className="center">วันที่คิดดอกเบี้ย</th><th className="num">%</th>
                <th className="num">เงินต้นโอน</th><th className="num">ดอกเบี้ยโอน</th><th className="num">ชำระ / งวด</th>
              </tr>
            </thead>
            <tbody>
              {(rec.allocations || []).map((a, i) => (
                <tr key={i}>
                  <td className="mono">{a.code}</td>
                  <td>{a.name}<div className="muted" style={{ fontSize: 10 }}>{a.dept}</div></td>
                  <td className="mono" style={{ color: 'var(--brand-700, var(--primary))', fontWeight: 600 }}>{a.transferredContractNo}</td>
                  <td className="center mono">{fmt.date(a.accrueDate)}</td>
                  <td className="num">{fmt.money(a.percent, 2)}%</td>
                  <td className="num mono">{fmt.money(a.principal, 2)}</td>
                  <td className="num mono">{fmt.money(a.interest, 2)}</td>
                  <td className="num mono">{fmt.money(a.perPeriod, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="right"><b>รวม</b></td>
                <td className="num"><b>{fmt.money((rec.allocations || []).reduce((s, a) => s + (Number(a.percent) || 0), 0), 2)}%</b></td>
                <td className="num mono"><b>{fmt.money((rec.allocations || []).reduce((s, a) => s + a.principal, 0), 2)}</b></td>
                <td className="num mono"><b>{fmt.money((rec.allocations || []).reduce((s, a) => s + a.interest, 0), 2)}</b></td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      {/* การเรียกเก็บหนี้ของผู้ค้ำ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>การเรียกเก็บหนี้ของผู้ค้ำ</h3></div>
        <div className="gt-link-row">
          <div className="gt-link-ico"><Icon name="guarantee" size={18} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>หนังสือแจ้งให้ชำระหนี้ <span className="mono">{rec.noticeRef || '—'}</span></div>
            <div className="muted" style={{ fontSize: 12 }}>เชื่อมโยงทะเบียนหนังสือแจ้งเรียกเก็บหนี้ของผู้ค้ำในระบบติดตามหนี้</div>
          </div>
          <span className={'pill ' + cs.pill}>{cs.l}</span>
        </div>
      </div>

      {/* ประวัติการโอน */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ประวัติการโอนหนี้</h3></div>
        {(rec.history || []).length === 0 ? (
          <div className="empty-state">ยังไม่มีประวัติการโอน</div>
        ) : (
          <div className="gt-timeline">
            {rec.history.map((h, i) => (
              <div className="gt-tl-item" key={i}>
                <div className="gt-tl-marker">
                  <span className="gt-tl-dot" />
                  {i < rec.history.length - 1 && <span className="gt-tl-line" />}
                </div>
                <div className="gt-tl-body">
                  <div className="gt-tl-top">
                    <span className="gt-tl-event">{h.event}</span>
                    <span className="gt-tl-date mono">{fmt.date(h.date)}</span>
                  </div>
                  <div className="gt-tl-detail">{h.detail}</div>
                  <div className="gt-tl-by muted">โดย {h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะโมดูลรับโอน) ───────────────────────────
function GtHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('รับโอนเลขสัญญา') || (e.module || '').includes('โอนหนี้'))]
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
            <h2 style={{ margin: 0 }}>ประวัติการทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>รับโอนเลขสัญญาผู้ค้ำประกัน</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {rows.length === 0 ? (
            <div className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>ยังไม่มีประวัติการทำรายการ</div>
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
//  หน้าหลัก — สลับ list / form / detail
// ════════════════════════════════════════════════════════════════════
function GuarantorTransferPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.gtLoad);
  const [mode, setMode] = useState('list');     // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const [histOpen, setHistOpen] = useState(false);

  const MODULE = 'ทะเบียนและติดตามหนี้ — รับโอนเลขสัญญาผู้ค้ำประกัน';
  const persist = (next) => { setList(next); window.gtSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };
  const update = (rec, patch) => {
    const updated = { ...rec, ...patch };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    return updated;
  };

  const submit = (rec) => {
    persist([rec, ...list]);
    const tt = window.gtTransferType(rec.transferType);
    audit.log({
      action: 'create', module: MODULE,
      target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `${tt.l} — เงินต้น ${fmt.money(rec.transferPrincipal, 2)} + ดอกเบี้ย ${fmt.money(rec.transferInterest, 2)} ไปยังผู้รับโอน ${(rec.allocations || []).length} ราย`,
      changes: [
        { field: 'ทะเบียนรับโอน', before: '—', after: rec.id },
        { field: 'ประเภทการโอน', before: '—', after: rec.transferType },
        { field: 'สัญญาผู้กู้', before: '—', after: rec.contractNo },
        { field: 'เลขสัญญารับโอน', before: '—', after: (rec.allocations || []).map(a => a.transferredContractNo).join(', ') },
        { field: 'วันที่โอน', before: '—', after: fmt.date(rec.transferDate) },
        { field: 'ยอดที่โอน (P+I)', before: '—', after: `${fmt.money(window.gtTransferTotal(rec), 2)} บาท` },
      ],
    });
    onToast && onToast(`บันทึกรายการโอน ${rec.id} เรียบร้อยแล้ว — รออนุมัติ`);
    setMode('list');
  };

  const approve = (rec) => {
    const updated = update(rec, { docStatus: 'approved', collectStatus: 'collecting',
      history: [...(rec.history || []), { date: window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10), event: 'อนุมัติรายการโอน', detail: 'อนุมัติรายการโอนหนี้ — มีผลและเริ่มกระบวนการเรียกเก็บ', by: 'ประสิทธิ์ คงทอง' }] });
    audit.log({ action: 'update', module: MODULE, target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `อนุมัติรายการโอนหนี้ ${rec.id}`, changes: [{ field: 'สถานะใบทำรายการ', before: 'บันทึกแล้ว — รออนุมัติ', after: 'อนุมัติแล้ว' }] });
    onToast && onToast(`อนุมัติรายการโอน ${rec.id} เรียบร้อยแล้ว`);
  };

  const cancelRec = (rec) => {
    const updated = update(rec, { docStatus: 'cancelled',
      history: [...(rec.history || []), { date: window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10), event: 'ยกเลิกรายการ', detail: 'ยกเลิกใบทำรายการโอนหนี้', by: 'จันทร์เพ็ญ มาลี' }] });
    audit.log({ action: 'delete', module: MODULE, target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `ยกเลิกรายการโอนหนี้ ${rec.id}`, changes: [{ field: 'สถานะใบทำรายการ', before: window.gtDocStatus(rec.docStatus).l, after: 'ยกเลิกรายการ' }] });
    onToast && onToast(`ยกเลิกรายการโอน ${rec.id} แล้ว`);
  };

  const markDone = (rec) => {
    const updated = update(rec, { collectStatus: 'done',
      history: [...(rec.history || []), { date: window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10), event: 'ชำระครบ', detail: `ผู้ค้ำชำระหนี้ครบถ้วน ${fmt.money(window.gtTransferTotal(rec), 2)} บาท ปิดสัญญารับโอน`, by: 'จันทร์เพ็ญ มาลี' }] });
    audit.log({ action: 'update', module: MODULE, target: `${rec.contractNo} · ${rec.borrowerName}`,
      summary: `ปิดหนี้สัญญารับโอน ${rec.id} — ชำระครบ`, changes: [{ field: 'สถานะการเรียกเก็บ', before: window.gtStatus(rec.collectStatus).l, after: 'ชำระครบ / ปิดหนี้' }] });
    onToast && onToast(`ปิดหนี้รายการ ${rec.id} เรียบร้อยแล้ว`);
  };

  const print = (rec) => {
    onToast && onToast('กำลังเตรียมพิมพ์ใบทำรายการ — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
    setTimeout(() => window.print(), 80);
  };

  return (
    <>
      {mode === 'list'
        ? <GtListView list={list} onCreate={() => setMode('form')} onOpenHistory={() => setHistOpen(true)} onOpen={openDetail} />
        : mode === 'detail'
          ? <GtDetailView rec={current} onBack={() => setMode('list')} onApprove={approve} onCancel={cancelRec} onCollect={markDone} onPrint={print} />
          : <GtTransferWorkspace list={list} onSubmit={submit} onCancel={() => setMode('list')} onToast={onToast} />}
      {histOpen && <GtHistoryDrawer onClose={() => setHistOpen(false)} />}
    </>
  );
}

Object.assign(window, { GuarantorTransferPage, GtDetailView });
