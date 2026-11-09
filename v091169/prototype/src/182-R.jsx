// ═════════════════════════════════════════════════════════════════
//  เบิกเงินกู้ค้างจ่าย — หน้ารายการ
//  รวม "ส่วนค้นหา + แท็บ + ตาราง/แบ่งหน้า" ให้อยู่ในการ์ดเดียวกัน
//  ตาม layout ของเมนูวัตถุประสงค์การกู้ (แถบค้นหา → เส้นคั่น → ตาราง)
// ═════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  const Orig = window.LoanPayoutPage;
  if (!R || !Orig || Orig.__lpoCardPatched) return;

  const LABEL = 'หน้ารายการเบิกเงินกู้ค้างจ่าย';
  const cls = (n) => (n && n.props && typeof n.props.className === 'string') ? n.props.className : '';
  const has = (node, test) => {
    if (!node || typeof node !== 'object') return false;
    if (Array.isArray(node)) return node.some((n) => has(n, test));
    if (test(node)) return true;
    return node.props ? has(R.Children.toArray(node.props.children), test) : false;
  };
  const hasTable = (n) => has(n, (x) => x.type === 'table');
  const hasGrid = (n) => has(n, (x) => cls(x).includes('lpo-filters-row'));

  function rebuild(screen) {
    const kids = R.Children.toArray(screen.props.children);
    const iSearch = kids.findIndex((k) => cls(k).includes('search-card') && hasGrid(k));
    const iTabs = kids.findIndex((k) => cls(k).includes('lpo-tabs'));
    const iTable = kids.findIndex((k, n) => n !== iSearch && hasTable(k));
    if (iSearch < 0 || iTable < 0) return null;

    const searchInner = R.Children.toArray(kids[iSearch].props.children)
      .map((c, i) => (R.isValidElement(c) ? R.cloneElement(c, { key: 'sc' + i }) : c));

    const tabs = iTabs >= 0
      ? R.cloneElement(kids[iTabs], { key: 'tabs', style: { ...(kids[iTabs].props.style || {}), margin: '0 2px' } })
      : null;

    const tableCard = kids[iTable];
    const tableInner = R.Children.toArray(
      cls(tableCard).includes('card') || cls(tableCard).includes('search-card')
        ? tableCard.props.children
        : [tableCard],
    ).map((c, i) => (R.isValidElement(c) ? R.cloneElement(c, { key: 'tc' + i }) : c));

    const merged = (
      <div className="search-card lpo-listcard" key="lpo-listcard" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #f0f0f0' }}>{searchInner}</div>
        {tabs ? <div style={{ padding: '0 16px' }}>{tabs}</div> : null}
        <div style={{ padding: '16px 16px 14px' }}>{tableInner}</div>
      </div>
    );

    const drop = new Set([iSearch, iTable].concat(iTabs >= 0 ? [iTabs] : []));
    const next = [];
    kids.forEach((k, i) => {
      if (i === iSearch) { next.push(merged); return; }
      if (drop.has(i)) return;
      next.push(R.isValidElement(k) ? R.cloneElement(k, { key: 'k' + i }) : k);
    });
    return R.cloneElement(screen, {}, next);
  }

  function LoanPayoutPage(props) {
    const out = Orig(props);
    try {
      let hit = false;
      const walk = (node) => {
        if (Array.isArray(node)) return node.map(walk);
        if (!node || typeof node !== 'object' || !node.props) return node;
        if (node.props['data-screen-label'] === LABEL) {
          const r = rebuild(node);
          if (r) { hit = true; return r; }
          return node;
        }
        if (hit) return node;
        return R.cloneElement(node, {}, walk(R.Children.toArray(node.props.children)));
      };
      const res = walk(out);
      return hit ? res : out;
    } catch (e) {
      return out;
    }
  }

  LoanPayoutPage.__lpoCardPatched = true;
  window.LoanPayoutPage = LoanPayoutPage;
})();
