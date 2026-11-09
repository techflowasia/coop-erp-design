// ─── หน้าประวัติการใช้งาน (Audit Log) ─────────────────────────────────
// เจ้าหน้าที่ตรวจสอบย้อนหลังได้ว่า ใคร · ทำอะไร · เมื่อใด · ผลลัพธ์เป็นอย่างไร
// แท็บ 1: การเปลี่ยนแปลงข้อมูล (create/update/delete/status/assign/revoke/…)
// แท็บ 2: การเข้าใช้งานระบบ (login/logout)

function auditInitials(name) {
  const u = window.sysUserByName ? window.sysUserByName(name) : null;
  if (u) return u.initials;
  return (name || '?').replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1);
}
function auditEmail(name) {
  const u = window.sysUserByName ? window.sysUserByName(name) : null;
  return u ? u.email : '';
}
function ActionPill({ action }) {
  const a = window.AUDIT_ACTIONS[action] || { label: action, pill: 'neutral' };
  return <span className={"pill " + a.pill}>{a.label}</span>;
}
function ResultPill({ result }) {
  return result === 'fail'
    ? <span className="pill bad">ล้มเหลว</span>
    : <span className="pill ok">สำเร็จ</span>;
}

function AuditFilterBar({ q, setQ, actionFilter, setActionFilter, actionOptions, userFilter, setUserFilter, users,
                          moduleFilter, setModuleFilter, modules, resultFilter, setResultFilter,
                          dateFrom, setDateFrom, dateTo, setDateTo, onReset, showModule }) {
  return (
    <div className="search-card" style={{ marginBottom: 12 }}>
      <div className="aud-filter-grid">
        <div className="aud-field" style={{ gridColumn: 'span 2' }}>
          <label className="aud-flab">ช่วงวันที่</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ minWidth: 0, flex: 1 }} className="cfg-input" />
            <span className="muted">–</span>
            <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ minWidth: 0, flex: 1 }} className="cfg-input" />
          </div>
        </div>
        <div className="aud-field">
          <label className="aud-flab">ผู้ใช้งาน</label>
          <select className="cfg-input" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="all">ทุกคน</option>
            {users.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="aud-field">
          <label className="aud-flab">ประเภทการกระทำ</label>
          <select className="cfg-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {actionOptions.map(k => <option key={k} value={k}>{(window.AUDIT_ACTIONS[k] || {}).label || k}</option>)}
          </select>
        </div>
        {showModule && (
          <div className="aud-field">
            <label className="aud-flab">เมนู</label>
            <select className="cfg-input" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
        <div className="aud-field">
          <label className="aud-flab">ผลลัพธ์</label>
          <select className="cfg-input" value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            <option value="ok">สำเร็จ</option>
            <option value="fail">ล้มเหลว</option>
          </select>
        </div>
        <div className="aud-field" style={{ gridColumn: 'span 2', minWidth: 220 }}>
          <label className="aud-flab">ค้นหา</label>
          <input className="cfg-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อข้อมูล / รายละเอียด…" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button className="btn primary" onClick={() => {}}><Icon name="search" size={13} /> ค้นหา</button>
        <button className="btn" onClick={onReset}>รีเซ็ต</button>
      </div>
    </div>
  );
}

function AuditTable({ rows, page, setPage, totalPages, total, onSelect }) {
  return (
    <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 130 }}>วันเวลา</th>
              <th style={{ width: 180 }}>ผู้กระทำ</th>
              <th style={{ width: 120 }}>การกระทำ</th>
              <th>ข้อมูลที่ถูกกระทำ</th>
              <th className="center" style={{ width: 90 }}>ผลลัพธ์</th>
              <th style={{ width: 150 }}>IP / อุปกรณ์</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan="6" className="empty-state">
                <div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>
                ไม่พบเหตุการณ์ที่ตรงกับเงื่อนไข
              </td></tr>
            ) : rows.map(e => (
              <tr key={e.id} className="clickable" onClick={() => onSelect(e)}>
                <td>
                  <div className="audit-time">
                    <span className="d">{fmt.date(e.ts)}</span>
                    <span className="t">{fmt.time(e.ts)} น.</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{e.user}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{auditEmail(e.user)}</div>
                </td>
                <td><ActionPill action={e.action} /></td>
                <td style={{ whiteSpace: 'normal' }}>
                  <div style={{ fontWeight: 500 }}>{e.summary || e.target}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{e.modulePath || e.module}</div>
                </td>
                <td className="center"><ResultPill result={e.result} /></td>
                <td>
                  <div className="mono" style={{ fontSize: 12 }}>{e.ip}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{e.device}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
      <div className="pagination">
        <span className="muted" style={{ fontSize: 12 }}>หน้า {page} / {totalPages} · แสดง {rows.length} จาก {total} รายการ</span>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevLeft" /></button>
        {Array.from({ length: totalPages }).slice(0, 8).map((_, i) => (
          <button key={i} className={"btn sm" + (page === i + 1 ? ' primary' : '')} style={{ minWidth: 30, padding: '0 8px' }} onClick={() => setPage(i + 1)}>{i + 1}</button>
        ))}
        <button className="btn sm" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><Icon name="chevRight" /></button>
      </div>
    </div>
  );
}

function AuditLogPage({ log }) {
  const [tab, setTab] = useState('data'); // 'data' | 'access'
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('2026-07-06');
  const [dateTo, setDateTo] = useState('2026-08-04');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const source = tab === 'data'
    ? log.filter(e => (window.AUDIT_DATA_ACTIONS || []).includes(e.action))
    : (window.ADM_ACCESS_LOG_SEED || []);

  const modules = useMemo(() => [...new Set(source.map(e => e.module).filter(Boolean))], [source]);
  const users = useMemo(() => [...new Set(source.map(e => e.user))], [source]);
  const actionOptions = useMemo(() => [...new Set(source.map(e => e.action))], [source]);

  const filtered = useMemo(() => {
    let r = source;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(e => (e.target || '').toLowerCase().includes(n) || (e.summary || '').toLowerCase().includes(n) ||
        (e.user || '').toLowerCase().includes(n) || (e.id || '').toLowerCase().includes(n));
    }
    if (actionFilter !== 'all') r = r.filter(e => e.action === actionFilter);
    if (userFilter !== 'all') r = r.filter(e => e.user === userFilter);
    if (moduleFilter !== 'all') r = r.filter(e => e.module === moduleFilter);
    if (resultFilter !== 'all') r = r.filter(e => (e.result || 'ok') === resultFilter);
    if (dateFrom) r = r.filter(e => e.ts.slice(0, 10) >= dateFrom);
    if (dateTo) r = r.filter(e => e.ts.slice(0, 10) <= dateTo);
    return [...r].sort((a, b) => b.ts.localeCompare(a.ts));
  }, [source, q, actionFilter, userFilter, moduleFilter, resultFilter, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [tab, q, actionFilter, userFilter, moduleFilter, resultFilter, dateFrom, dateTo]);
  useEffect(() => { setActionFilter('all'); setModuleFilter('all'); setUserFilter('all'); }, [tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const resetAll = () => { setQ(''); setActionFilter('all'); setUserFilter('all'); setModuleFilter('all'); setResultFilter('all'); };

  return (
    <div data-screen-label="หน้าประวัติการใช้งาน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประวัติการใช้งาน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ตรวจสอบการเปลี่ยนแปลงข้อมูลและการเข้าใช้งานระบบย้อนหลัง</div>
        </div>
      </div>

      <div className="tabs-bar" style={{ marginBottom: 14 }}>
        <button className={"tab" + (tab === 'data' ? ' active' : '')} onClick={() => setTab('data')}>การเปลี่ยนแปลงข้อมูล</button>
        <button className={"tab" + (tab === 'access' ? ' active' : '')} onClick={() => setTab('access')}>การเข้าใช้งานระบบ</button>
      </div>

      <AuditFilterBar q={q} setQ={setQ}
        actionFilter={actionFilter} setActionFilter={setActionFilter} actionOptions={actionOptions}
        userFilter={userFilter} setUserFilter={setUserFilter} users={users}
        moduleFilter={moduleFilter} setModuleFilter={setModuleFilter} modules={modules}
        resultFilter={resultFilter} setResultFilter={setResultFilter}
        dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
        onReset={resetAll} showModule={tab === 'data'} />

      <AuditTable rows={pageRows} page={page} setPage={setPage} totalPages={totalPages} total={filtered.length} onSelect={setSelected} />

      {selected && <AuditDetailDrawer entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function AuditDetailDrawer({ entry, onClose }) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)',
                        color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div>
            <h2 style={{ margin: 0 }}>รายละเอียดเหตุการณ์</h2>
            <div className="muted" style={{ fontSize: 11 }}>รหัสอ้างอิง {entry.id}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          <div className="section">
            <div className="form-grid cols-1">
              <div className="field"><span className="label">การกระทำ</span><span className="value"><ActionPill action={entry.action} /></span></div>
              <div className="field"><span className="label">ผลลัพธ์</span><span className="value"><ResultPill result={entry.result} /></span></div>
              <div className="field"><span className="label">รายละเอียด</span><span className="value">{entry.summary || entry.target}</span></div>
              <div className="field"><span className="label">ผู้บันทึก</span>
                <span className="value">
                  <div><div style={{ fontWeight: 500 }}>{entry.user}</div><div className="muted" style={{ fontSize: 11 }}>{auditEmail(entry.user)}</div></div>
                </span>
              </div>
              <div className="field"><span className="label">วันเวลา</span><span className="value mono">{fmt.datetime(entry.ts)} น.</span></div>
              <div className="field"><span className="label">เมนู/โมดูล</span><span className="value">{entry.modulePath || entry.module}</span></div>
              <div className="field"><span className="label">รายการที่เกี่ยวข้อง</span><span className="value">{entry.target}</span></div>
              <div className="field"><span className="label">IP Address</span><span className="value mono">{entry.ip}</span></div>
              <div className="field"><span className="label">อุปกรณ์</span><span className="value">{entry.device}</span></div>
            </div>
          </div>

          {entry.changes && entry.changes.length > 0 && (
            <div className="section" style={{ marginTop: 8 }}>
              <div className="section-head"><span className="head-bar" /><h3>รายการเปลี่ยนแปลงข้อมูล</h3></div>
              <div className="audit-diff">
                <div className="hd">ฟิลด์ข้อมูล</div>
                <div className="hd">ค่าเดิม</div>
                <div className="hd">ค่าใหม่</div>
                {entry.changes.map((c, i) => (
                  <React.Fragment key={i}>
                    <div className="fld">{c.field}</div>
                    <div><span className="before">{c.before}</span></div>
                    <div><span className="after">{c.after}</span></div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="mp-note" style={{ marginTop: 16 }}>
            <div className="mp-note-title">บันทึกเพื่อการตรวจสอบ</div>
            รายการนี้ถูกบันทึกโดยอัตโนมัติและไม่สามารถแก้ไขได้ เพื่อใช้เป็นหลักฐานตรวจสอบย้อนหลังตามหลักธรรมาภิบาล
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AuditLogPage });
