/* Popup รายละเอียดรายการ — ครอบ TxHistoryDrawer เดิม
   คลิกแถวไทม์ไลน์ (.tx-item) เพื่อเปิดหน้าต่างรายละเอียดการเปลี่ยนแปลง */
(function () {
  const Base = window.TxHistoryDrawer;
  if (!Base) return;

  const THAI_MONTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  function fmtTs(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d)) return ts;
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getDate()} ${THAI_MONTH[d.getMonth()]} ${d.getFullYear() + 543} เวลา ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function txt(el, sel) { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; }

  function findEntry(itemEl) {
    const all = (window.AUDIT_SEED || []);
    const idm = itemEl.textContent.match(/A-\d{4,}/);
    if (idm) {
      const hit = all.find(e => e.id === idm[0]);
      if (hit) return hit;
    }
    const summary = txt(itemEl, '.tx-summary');
    const mod = txt(itemEl, '.tx-mod');
    return all.find(e => e.summary === summary && (!mod || e.module === mod))
        || all.find(e => e.summary === summary)
        || null;
  }

  function DetailPopup({ entry, onClose }) {
    React.useEffect(() => {
      const onKey = (ev) => { if (ev.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const a = (window.AUDIT_ACTIONS || {})[entry.action] || { label: entry.action, pill: 'neutral' };
    const changes = entry.changes || [];
    const Icon = window.Icon || (() => null);

    const row = (label, value, mono) => (
      <div style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--border, #e8eae9)' }}>
        <span style={{ flex: '0 0 132px', color: 'var(--text-muted, #7a8079)', fontSize: 13 }}>{label}</span>
        <span className={mono ? 'mono' : ''} style={{ fontSize: 13, color: 'var(--text, #1f2420)' }}>{value || '—'}</span>
      </div>
    );

    return (
      <div onClick={onClose}
           style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(20,28,22,.42)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={(e) => e.stopPropagation()}
             style={{ width: 'min(620px, 100%)', maxHeight: '86vh', overflow: 'auto', background: '#fff',
                      borderRadius: 8, boxShadow: '0 18px 48px rgba(0,0,0,.28)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
                        borderBottom: '1px solid var(--border, #e8eae9)' }}>
            <span className={'pill ' + a.pill}>{a.label}</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>รายละเอียดรายการ</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted, #7a8079)' }}>{entry.id}</span>
            <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
          </div>
          <div style={{ padding: '12px 18px 18px' }}>
            {row('วันที่–เวลา', fmtTs(entry.ts))}
            {row('โมดูล', entry.module)}
            {row('เป้าหมาย', entry.target, true)}
            {row('ผู้ดำเนินการ', entry.user)}
            {row('ตำแหน่ง', entry.role)}
            {row('สรุปรายการ', entry.summary)}
            {changes.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>ข้อมูลที่เปลี่ยนแปลง</div>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr><th style={{ width: '34%' }}>รายการ</th><th>ค่าเดิม</th><th>ค่าใหม่</th></tr>
                  </thead>
                  <tbody>
                    {changes.map((c, i) => (
                      <tr key={i}>
                        <td>{c.field}</td>
                        <td className="mono" style={{ color: 'var(--text-muted, #7a8079)' }}>{c.before}</td>
                        <td className="mono" style={{ fontWeight: 600 }}>{c.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function TxHistoryDrawerWithPopup(props) {
    const [entry, setEntry] = React.useState(null);
    const onClick = (ev) => {
      const item = ev.target.closest && ev.target.closest('.tx-item');
      if (!item) return;
      const found = findEntry(item);
      if (found) setEntry(found);
    };
    return (
      <React.Fragment>
        <div onClick={onClick} style={{ display: 'contents', cursor: 'pointer' }}>
          <Base {...props} />
        </div>
        {entry && <DetailPopup entry={entry} onClose={() => setEntry(null)} />}
      </React.Fragment>
    );
  }

  window.TxHistoryDrawer = TxHistoryDrawerWithPopup;
})();
