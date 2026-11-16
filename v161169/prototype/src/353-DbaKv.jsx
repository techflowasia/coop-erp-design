// ════════════════════════════════════════════════════════════════════
//  อนุมัติใบคำขอ — เอกสารสรุปแบบละเอียด (Popup ตรวจสอบรายการ)
//  เรนเดอร์เอกสารต้นทางแบบเต็มตามรูปแบบ DS record-detail (lt-head-card +
//  .search-card ต่อ section) จากข้อมูล rec.detail ของแต่ละประเภทคำขอ
// ════════════════════════════════════════════════════════════════════

// ─── คีย์-ค่า แบบเปรียบเทียบ (icr-kv) ───────────────────────────────
function DbaKv({ k, v, mono, danger, warn }) {
  return (
    <div className="icr-kv">
      <span className="icr-kv-k">{k}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')}
            style={danger ? { color: 'var(--danger)', fontWeight: 600 } : (warn ? { color: 'var(--warning)' } : undefined)}>
        {v ?? '—'}
      </span>
    </div>
  );
}

// ─── การ์ดสรุปผลคำนวณ (ds-sum-tile) ─────────────────────────────────
function DbaSumTile({ icon, label, value, tone }) {
  return (
    <div className={'ds-sum-tile' + (tone ? ' ' + tone : '')}>
      <div className="ds-sum-ico"><Icon name={icon || 'money'} size={16} /></div>
      <div className="ds-sum-body">
        <span className="ds-sum-label">{label}</span>
        <span className="ds-sum-value mono">{typeof value === 'number' ? window.fmt.money(value, 2) : value}</span>
      </div>
    </div>
  );
}

// ─── หนึ่ง section ของเอกสาร ────────────────────────────────────────
function DbaDocSection({ s }) {
  const thCls = (a) => (a === 'num' ? 'num' : a === 'center' ? 'center' : '');
  const tdCls = (a, mono) => [a === 'num' ? 'num' : a === 'center' ? 'center' : '', mono ? 'mono' : ''].filter(Boolean).join(' ');

  return (
    <div className="search-card" style={{ marginBottom: 12 }}>
      <div className="section-head" style={{ marginBottom: s.kind === 'table' || s.kind === 'note' ? 12 : 14 }}>
        <span className="head-bar" /><h3>{s.title}</h3>
      </div>

      {/* ── ตารางคีย์-ค่า (form-grid) + ที่อยู่ ── */}
      {s.kind === 'grid' && (
        <>
          <div className={'form-grid' + (s.cols4 ? ' cols-4' : '')}>
            {s.rows.map((r, i) => (
              <div className="field" key={i}>
                <span className="label">{r.k}</span>
                <span className={'value' + (r.mono ? ' mono' : '')}
                      style={r.danger ? { color: 'var(--danger)', fontWeight: 600 } : (r.warn ? { color: 'var(--warning)', fontWeight: 600 } : undefined)}>
                  {r.pill ? <span className={'pill ' + r.pill}>{r.v}</span> : (r.v ?? '—')}
                </span>
              </div>
            ))}
          </div>
          {s.addr && (
            <div className="ct-addr-detail">
              {s.addr.map((a, i) => (
                <div className="ct-addr-detail-row" key={i}>
                  <span className="muted">{a.k}</span>
                  <span>{a.v}{a.chip && <span className={'chip ' + (a.chipTone || 'info')} style={{ marginLeft: 6 }}>{a.chip}</span>}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── เปรียบเทียบ เดิม/ใหม่ (icr-detail-compare) ── */}
      {s.kind === 'compare' && (
        <>
          <div className="icr-detail-compare">
            <div className="icr-dc-col">
              {s.leftLabel && <div className="icr-dc-tag">{s.leftLabel}</div>}
              {s.left.map((kv, i) => <DbaKv key={i} {...kv} />)}
            </div>
            <div className="icr-dc-col new">
              {s.rightLabel && <div className="icr-dc-tag">{s.rightLabel}</div>}
              {s.right.map((kv, i) => <DbaKv key={i} {...kv} />)}
            </div>
          </div>
          {s.note && <div className="icr-delta-note"><Icon name="info" size={13} /><span>{s.note}</span></div>}
        </>
      )}

      {/* ── การ์ดสรุปผลคำนวณ (tiles) ── */}
      {s.kind === 'tiles' && (
        <div className="ds-sum-strip" style={{ marginTop: 0 }}>
          {s.tiles.map((tile, i) => <DbaSumTile key={i} {...tile} />)}
        </div>
      )}

      {/* ── ตารางข้อมูล ── */}
      {s.kind === 'table' && (
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>{s.cols.map((c, i) => <th key={i} className={thCls(c.align)} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {(!s.rows || s.rows.length === 0) ? (
                <tr><td colSpan={s.cols.length} className="empty-state">{s.empty || '— ไม่มีรายการ —'}</td></tr>
              ) : s.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={tdCls(cell.align ?? s.cols[ci].align, cell.mono)}>
                      {cell.bold ? <b>{cell.v}</b> : cell.v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {s.foot && (
              <tfoot>
                <tr>
                  {s.foot.map((cell, ci) => (
                    <td key={ci} colSpan={cell.colSpan || 1}
                        className={[cell.align === 'right' ? 'right' : tdCls(cell.align, cell.mono)].filter(Boolean).join(' ')}>
                      {cell.v != null && (cell.bold ? <b>{cell.v}</b> : cell.v)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      )}

      {/* ── หมายเหตุ ── */}
      {s.kind === 'note' && (
        <div className="icr-note-view">{s.text ? s.text : <span className="muted">— ไม่มีหมายเหตุ —</span>}</div>
      )}
    </div>
  );
}

// ─── เอกสารสรุปแบบเต็ม ──────────────────────────────────────────────
function DbaDocDetail({ rec }) {
  const t = window.dbaType(rec.type);
  const st = window.dbaStatus(rec.status);
  const d = rec.detail || {};
  const head = d.head || [
    { k: 'สมาชิก', v: <>{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></> },
    { k: 'สัญญาเงินกู้', v: rec.contractNo, mono: true },
    { k: 'ประเภทเงินกู้', v: rec.loanType },
    { k: 'วันที่ยื่นคำขอ', v: window.fmt.date(rec.requestDate) },
  ];
  const sections = d.sections || [
    { kind: 'grid', title: 'รายละเอียดคำขอ', rows: rec.fields.map(f => ({ k: f.k, v: f.v, mono: /[0-9]/.test(f.v) && f.hl, danger: f.warn })) },
  ];

  return (
    <div className="dba-doc">
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name={t.icon} size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{d.title || t.l}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>เอกสาร {rec.docNo}</span><span className="dot" />
              <span>บันทึกโดย {rec.requestedBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            {d.badge && <span className={'chip ' + (d.badgeChip || 'info')}>{d.badge}</span>}
            {rec.priority === 'urgent' && rec.status === 'pending' && <span className="chip danger">เร่งด่วน</span>}
          </div>
        </div>
        {head.length > 0 && (
          <div className="lt-head-dates">
            {head.map((h, i) => (
              <div className="lt-date" key={i}>
                <span className="lt-date-k">{h.k}</span>
                <span className={'lt-date-v' + (h.mono ? ' mono' : '')}
                      style={h.danger ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>
                  {h.pill ? <span className={'pill ' + h.pill}>{h.v}</span> : h.v}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {sections.map((s, i) => <DbaDocSection key={i} s={s} />)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Popup ตรวจสอบรายการคำขอ (เอกสารเต็ม) — เรียกก่อนเข้าสู่แผงพิจารณา
// ════════════════════════════════════════════════════════════════════
function DbaCheckModal({ rec, onClose, onProceed }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card dba-doc-modal">
        <div className="dba-doc-bar">
          <div className="dba-doc-bar-l">
            <Icon name="eye" size={15} />
            <span>ตรวจสอบรายการคำขอ</span>
            <span className="muted mono" style={{ fontSize: 11, fontWeight: 400 }}>· {rec.id}</span>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="dba-doc-scroll">
          <DbaDocDetail rec={rec} />
        </div>

        <div className="dba-doc-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          <span className="spacer" />
          <button className="btn primary" onClick={() => onProceed(rec)}>
            <Icon name="check" size={13} /> ตรวจสอบเรียบร้อย · พิจารณาอนุมัติ
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { DbaDocDetail, DbaDocSection, DbaSumTile, DbaCheckModal });
