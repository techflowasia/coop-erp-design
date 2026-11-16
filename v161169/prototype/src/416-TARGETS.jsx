// ═════════════════════════════════════════════════════════════════
//  ค่าคงที่ (สินเชื่อ) — patch หน้ารายการให้ใช้ layout การ์ดเดียวกับ
//  หน้าประเภทเงินกู้: แถบค้นหา (ค้นหา/รีเซ็ต) + เส้นคั่น → ตารางเว้นขอบ 16px
//  → แถบแบ่งหน้า + dropdown ต่อหน้า  (คอลัมน์/ข้อมูลเดิมไม่เปลี่ยน)
//  ใช้กับ: จำนวนคนค้ำประกัน · วงเงินกู้กลุ่ม · กำหนดวงเงินค้ำประกัน · ข้อกำหนดสินเชื่อ
// ═════════════════════════════════════════════════════════════════

(function () {
  const TARGETS = [
    ['GuarantorCountConfigPage', 'หน้าค่าคงที่จำนวนคนค้ำประกัน', 'ค้นหารหัส / ชื่อกลุ่มนับค้ำ'],
    ['LoanGroupConfigPage', 'หน้าค่าคงที่วงเงินกู้กลุ่ม', 'ค้นหารหัส / ชื่อวงเงินกู้กลุ่ม'],
    ['GuaranteeLimitConfigPage', 'หน้าค่าคงที่กำหนดวงเงินค้ำประกัน', 'ค้นหารหัส / ชื่อกลุ่มการค้ำ'],
    ['LoanTermsConfigPage', 'หน้าค่าคงที่ข้อกำหนดสินเชื่อ', 'ค้นหารหัส / ชื่อข้อกำหนด'],
  ];

  const textOf = (node) => {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join(' ');
    if (node.props) return textOf(node.props.children);
    return '';
  };
  const cls = (n) => (n && n.props && typeof n.props.className === 'string') ? n.props.className : '';
  const hasTable = (node) => {
    if (!node || typeof node !== 'object') return false;
    if (Array.isArray(node)) return node.some(hasTable);
    if (node.type === 'table') return true;
    return node.props ? hasTable(React.Children.toArray(node.props.children)) : false;
  };
  const findTable = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) { for (const n of node) { const r = findTable(n); if (r) return r; } return null; }
    if (node.type === 'table') return node;
    return node.props ? findTable(React.Children.toArray(node.props.children)) : null;
  };
  const mapTable = (node, fn) => {
    if (Array.isArray(node)) return node.map(n => mapTable(n, fn));
    if (!node || typeof node !== 'object' || !node.props) return node;
    if (node.type === 'table') return fn(node);
    return React.cloneElement(node, {}, mapTable(React.Children.toArray(node.props.children), fn));
  };

  const wrap = (name, LABEL, placeholder) => {
    const Orig = window[name];
    if (!Orig || Orig.__lcListPatched) return;

    function Patched(props) {
      const [q, setQ] = React.useState('');
      const [page, setPage] = React.useState(1);
      const [per, setPer] = React.useState(20);
      const outer = Orig(props);
      try {
        const rebuild = (tree) => {
        const kids = React.Children.toArray(tree.props.children);
        const cIdx = kids.findIndex(k => cls(k).includes('search-card') && hasTable(k));
        if (cIdx < 0) return null;
        const card = kids[cIdx];
        const cardKids = React.Children.toArray(card.props.children);

        const table = findTable(cardKids);
        const body = table && React.Children.toArray(table.props.children).find(c => c.type === 'tbody');
        const dataRows = body ? React.Children.toArray(body.props.children).filter(r => r.type === 'tr') : [];
        const term = q.trim().toLowerCase();
        const matched = term ? dataRows.filter(r => textOf(r).toLowerCase().includes(term)) : dataRows;

        const total = matched.length;
        const pages = Math.max(1, Math.ceil(total / per));
        const cur = Math.min(page, pages);
        const from = total ? (cur - 1) * per + 1 : 0;
        const to = Math.min(cur * per, total);
        const shown = matched.slice(from > 0 ? from - 1 : 0, to);
        const cols = table ? Math.max(1, React.Children.toArray(
          (React.Children.toArray(table.props.children).find(c => c.type === 'thead') || { props: { children: [] } })
            .props.children).reduce((a, tr) => Math.max(a, React.Children.toArray(tr.props.children).length), 1)) : 1;

        // ตารางส่วนเนื้อหา (เฉพาะ node ที่ไม่ใช่ toolbar เดิม)
        const keep = cardKids.filter(k => !/toolbar|searchbar|gcc-search|filter-row/.test(cls(k)));
        const paged = mapTable(keep, (tbl) => {
          const parts = React.Children.toArray(tbl.props.children).map(c => {
            if (c.type !== 'tbody') return c;
            const rows = shown.length ? shown : [
              <tr key="empty"><td colSpan={cols} className="center muted" style={{ padding: 24 }}>ไม่พบข้อมูลที่ค้นหา</td></tr>,
            ];
            return React.cloneElement(c, {}, rows);
          });
          return React.cloneElement(tbl, {}, parts);
        });

        const bar = (
          <div className="gcc-searchbar-row" key="lc-searchbar"
               style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                        padding: '14px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <div className="gcc-search-input" style={{ flex: '0 1 340px', minWidth: 300 }}>
              <Icon name="search" size={14} />
              <input className="cfg-input" value={q} placeholder={placeholder}
                     onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            </div>
            <button className="btn primary sm" onClick={() => setPage(1)}>ค้นหา</button>
            <button className="btn sm" onClick={() => { setQ(''); setPage(1); }}>รีเซ็ต</button>
          </div>
        );

        const pgStyle = (active, disabled) => ({
          minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
          cursor: disabled ? 'default' : 'pointer',
          border: '1px solid ' + (active ? '#237450' : '#d9d9d9'),
          background: active ? '#237450' : '#fff',
          color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)'),
        });
        const win = 5;
        let st = Math.max(1, cur - Math.floor(win / 2));
        const en = Math.min(pages, st + win - 1);
        st = Math.max(1, en - win + 1);
        const pageBtns = [];
        for (let i = st; i <= en; i++) {
          pageBtns.push(<button key={i} style={pgStyle(i === cur, false)} onClick={() => setPage(i)}>{i}</button>);
        }

        const pager = (
          <div key="lc-pager"
               style={{ margin: '0 16px', padding: '12px 0', borderTop: '1px solid #f0f0f0', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
              {total === 0 ? '0 รายการ' : from + '-' + to + ' จาก ' + total + ' รายการ'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={pgStyle(false, cur <= 1)} disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="ก่อนหน้า">‹</button>
              {pageBtns}
              <button style={pgStyle(false, cur >= pages)} disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="ถัดไป">›</button>
              <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }}
                      aria-label="จำนวนต่อหน้า"
                      style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                               fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                {[20, 50, 100].map(n => <option key={n} value={n}>{n} / หน้า</option>)}
              </select>
            </div>
          </div>
        );

        const next = kids.slice();
        next[cIdx] = (
          <div className={cls(card) + ' gcc-listcard'} key="lc-listcard" style={{ padding: 0, overflow: 'hidden' }}>
            {bar}
            <div style={{ padding: '16px 16px 0' }}>{paged}</div>
            {pager}
          </div>
        );
        const patchedScreen = React.cloneElement(tree, {}, next);
        return patchedScreen;
        };

        let hit = false;
        const transform = (node) => {
          if (Array.isArray(node)) return node.map(transform);
          if (!node || typeof node !== 'object' || !node.props) return node;
          if (node.props['data-screen-label'] === LABEL) {
            const r = rebuild(node);
            if (r) { hit = true; return r; }
            return node;
          }
          if (hit) return node;
          return React.cloneElement(node, {}, transform(React.Children.toArray(node.props.children)));
        };
        const res = transform(outer);
        return hit ? res : outer;
      } catch (e) {
        return outer;
      }
    }
    Patched.__lcListPatched = true;
    window[name] = Patched;
  };

  TARGETS.forEach(([n, l, p]) => wrap(n, l, p));
})();
