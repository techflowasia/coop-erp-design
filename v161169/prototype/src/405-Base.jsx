// ════════════════════════════════════════════════════════════════════
//  สำรวจหลักทรัพย์ — ปรับ popup "ประวัติการใช้งาน" ให้เป็น modal กลางจอ
//  (หัวข้อ + ไอคอนวงกลม · เนื้อหา · ปุ่มปิดสีเขียวมุมขวาล่าง)
//  ครอบ window.TxHistoryDrawer เฉพาะโมดูลสำรวจหลักทรัพย์ · โมดูลอื่นใช้เดิม
// ════════════════════════════════════════════════════════════════════
(function () {
  const Base = window.TxHistoryDrawer;
  const SVR_MODULE = 'สินเชื่อ — สำรวจหลักทรัพย์';

  function SurveyHistoryModal({ memberCode, memberName, modules, title, onClose }) {
    const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
    const all = ctx.entries || window.AUDIT_SEED || [];
    const rows = React.useMemo(() => {
      const r = all.filter(e => (e.target || '').includes(memberCode) &&
                                (!modules || !modules.length || modules.includes(e.module)));
      return [...r].sort((a, b) => b.ts.localeCompare(a.ts));
    }, [all, memberCode, modules]);

    return (
      <>
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-card" role="dialog" aria-modal="true"
             style={{ width: 640, maxWidth: '94vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div className="modal-head" style={{ padding: '18px 22px', borderBottom: '1px solid var(--line, #f0f0f0)', margin: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-50)',
                          color: 'var(--primary)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
              <Icon name="history" />
            </div>
            <h2 style={{ margin: 0, fontSize: 16 }}>{title || 'ประวัติการใช้งาน'}</h2>
            <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '22px', minHeight: 220 }}>
            {rows.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 0' }}>
                <div style={{ marginBottom: 6 }}><Icon name="history" size={24} /></div>
                ยังไม่มีประวัติการทำรายการ
              </div>
            ) : (
              <div className="tx-timeline">
                {rows.map(e => {
                  const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                  return (
                    <div className="tx-item" key={e.id}>
                      <div className={"tx-dot " + a.pill} />
                      <div className="tx-body">
                        <div className="tx-top">
                          <span className={"pill " + a.pill}>{a.label}</span>
                          <span className="tx-mod">{e.module}</span>
                          <span className="spacer" />
                          <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                        </div>
                        <div className="tx-summary">{e.summary}</div>
                        <div className="tx-meta">
                          <span>โดย {e.user}</span>
                          <span className="sep">·</span>
                          <span>{e.role}</span>
                          <span className="sep">·</span>
                          <span className="mono muted">{e.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line, #f0f0f0)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </>
    );
  }

  window.TxHistoryDrawer = function TxHistoryDrawerRouted(props) {
    const mods = props.modules || [];
    if (mods.includes(SVR_MODULE)) return <SurveyHistoryModal {...props} />;
    return Base ? <Base {...props} /> : null;
  };
  window.SurveyHistoryModal = SurveyHistoryModal;
})();
