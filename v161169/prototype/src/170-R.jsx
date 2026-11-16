// ════════════════════════════════════════════════════════════════════
//  หน้ารายละเอียด "ข้อกำหนดสินเชื่อ" (ระบบสินเชื่อ)
//   • แถวปุ่มมุมบนขวา: badge บันทึกล่าสุด › ประวัติ › แก้ไขข้อกำหนด
//     (โหมดแก้ไข: badge › ประวัติ › ยกเลิก › บันทึก)
//   • ไม่ใช้แถบ Action มุมขวาล่าง (ดู 375_bottom_action_bar.js)
// ════════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  const Orig = window.LtDetail;
  if (!R || !Orig || Orig.__ltTermsPatched) return;

  const SCREEN = 'หน้ารายละเอียดข้อกำหนดสินเชื่อ';
  const MODULES = ['สินเชื่อ — ค่าคงที่ข้อกำหนดสินเชื่อ'];
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  const savedLabel = (ts) => (window.savedBadgeLabel ? window.savedBadgeLabel(ts) : null);

  const textOf = (el) => {
    let s = '';
    const rec = (n) => {
      if (n == null || n === false || n === true) return;
      if (Array.isArray(n)) return n.forEach(rec);
      if (typeof n === 'string' || typeof n === 'number') { s += n; return; }
      if (R.isValidElement(n)) rec(n.props.children);
    };
    rec(el);
    return s.trim();
  };

  const flatten = (kids) => {
    const out = [];
    R.Children.toArray(kids).forEach((k) => {
      if (R.isValidElement(k) && k.type === R.Fragment) out.push(...flatten(k.props.children));
      else out.push(k);
    });
    return out;
  };

  const VOID_TAGS = { input: 1, img: 1, br: 1, hr: 1, col: 1, area: 1, base: 1, embed: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };

  function mapTree(node, fn) {
    if (Array.isArray(node)) return node.map((n) => mapTree(n, fn));
    if (!R.isValidElement(node)) return node;
    const res = fn(node);
    if (res !== undefined) return res;
    if (typeof node.type === 'string' && VOID_TAGS[node.type]) return node;
    const kids = node.props && node.props.children;
    if (kids == null || kids === false) return node;
    const arr = Array.isArray(kids) ? kids : [kids];
    return R.cloneElement(node, undefined, ...arr.map((k) => mapTree(k, fn)));
  }

  function TermsHistoryModal({ title, onClose }) {
    const ctx = R.useContext(window.AuditContext || R.createContext({ entries: [] }));
    const all = (ctx && ctx.entries) || window.AUDIT_SEED || [];
    const rows = all
      .filter((e) => MODULES.includes(e.module))
      .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
    return (
      <>
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 640, width: '92vw' }}>
          <div className="modal-head">
            <div style={{ minWidth: 0 }}>
              <h2>ประวัติการแก้ไข</h2>
              <div className="muted" style={{ fontSize: 11 }}>{title}</div>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {rows.length === 0 ? (
              <div className="muted" style={{ padding: '20px 2px', textAlign: 'center', fontSize: 13 }}>
                ยังไม่มีประวัติการแก้ไข
              </div>
            ) : (
              <div className="tx-timeline">
                {rows.map((e) => {
                  const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                  return (
                    <div className="tx-item" key={e.id}>
                      <div className={'tx-dot ' + a.pill} />
                      <div className="tx-body">
                        <div className="tx-top">
                          <span className={'pill ' + a.pill}>{a.label}</span>
                          <span className="spacer" />
                          <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                        </div>
                        <div className="tx-summary">{e.summary}</div>
                        <div className="tx-meta">
                          <span>โดย {e.user}</span>
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
          <div className="modal-foot">
            <button className="btn sm" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </>
    );
  }

  function LtDetail(props) {
    const [hist, setHist] = R.useState(false);
    const auditCtx = R.useContext(window.AuditContext || R.createContext({ entries: [] }));
    const tree = Orig(props);
    const entries = (auditCtx && auditCtx.entries) || window.AUDIT_SEED || [];
    const lastTs = window.savedBadgeTs ? window.savedBadgeTs(entries, MODULES, 'loanTerms') : '';

    let found = false;
    let title = '';
    const patched = mapTree(tree, (el) => {
      if (found) return undefined;
      if (!(el.props && el.props['data-screen-label'] === SCREEN)) return undefined;
      found = true;
      const walk = (n) => {
        if (title || !R.isValidElement(n)) return;
        if (String(n.props.className || '').includes('lt-head-title')) { title = textOf(n); return; }
        R.Children.toArray(n.props.children).forEach(walk);
      };
      walk(el);
      return mapTree(el, (inner) => {
        if (!inner.props || inner.props.className !== 'page-actions') return undefined;
        const kids = flatten(inner.props.children);
        const lead = [], rest = [];
        let seen = false;
        let legacyTs = '';
        kids.forEach((k, i) => {
          const t = textOf(k);
          if (/^บันทึกล่าสุด/.test(t)) { legacyTs = t; return; }   // chip เดิมของหน้า — ใช้ badge มาตรฐานแทน
          if (/^(แก้ไขข้อกำหนด|ยกเลิก|ละทิ้ง|บันทึก|ประวัติ)/.test(t)) { seen = true; if (!/^ประวัติ/.test(t)) rest.push(R.cloneElement(k, { key: 'a' + i })); }
          else if (!seen) lead.push(R.isValidElement(k) ? R.cloneElement(k, { key: 'l' + i }) : k);
          else rest.push(R.isValidElement(k) ? R.cloneElement(k, { key: 'r' + i }) : k);
        });
        if (!rest.length) return undefined;
        // โหมดแก้ไข (มีปุ่มยกเลิก/บันทึกในแถว): ไม่แสดง badge และปุ่มประวัติ
        const isEdit = rest.some((k) => /^(ยกเลิก|ละทิ้ง|บันทึก)/.test(textOf(k)));
        const label = savedLabel(lastTs) || (legacyTs ? legacyTs.replace(/^บันทึกล่าสุด\s*/, 'บันทึกล่าสุด: ') : null);
        const badge = label ? <span key="saved" className="saved-badge">{label}</span> : null;
        const histBtn = (
          <button key="hist" className="btn sm" onClick={() => setHist(true)}>
            <Icon name="history" /> ประวัติ
          </button>
        );
        return isEdit
          ? R.cloneElement(inner, undefined, ...lead, ...rest)
          : R.cloneElement(inner, undefined, ...lead, ...(badge ? [badge] : []), histBtn, ...rest);
      });
    });

    if (!found) return tree;
    return (
      <>
        {patched}
        {hist && <TermsHistoryModal title={title} onClose={() => setHist(false)} />}
      </>
    );
  }

  LtDetail.__ltTermsPatched = true;
  window.LtDetail = LtDetail;
})();
