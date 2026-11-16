// ═════════════════════════════════════════════════════════════════
//  ค่าคงที่ (สินเชื่อ) — ประเภทเงินกู้ (patch หน้ารายการ)
//   • เพิ่มแถบค้นหา (ค้นหา / รีเซ็ต) ในการ์ดเดียวกับตาราง
//   • เพิ่ม pagination ใต้ตาราง · ระยะขอบซ้าย-ขวาของตาราง 16px
// ═════════════════════════════════════════════════════════════════

(function () {
  const Orig = window.LoanTypeConfigPage;
  if (!Orig || Orig.__ltListPatched) return;
  const LABEL = 'หน้าค่าคงที่ประเภทเงินกู้';

  const textOf = (node) => {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join(' ');
    if (node.props) return textOf(node.props.children);
    return '';
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

  function LoanTypeConfigPage(props) {
    const [q, setQ] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [per, setPer] = React.useState(20);
    const tree = Orig(props);
    try {
      if (!tree || tree.props['data-screen-label'] !== LABEL) return tree;
      const kids = React.Children.toArray(tree.props.children);
      const cIdx = kids.findIndex(k => k.props && String(k.props.className || '') === 'search-card');
      if (cIdx < 0) return tree;
      const card = kids[cIdx];

      const table = findTable(React.Children.toArray(card.props.children));
      const body = table && React.Children.toArray(table.props.children).find(c => c.type === 'tbody');
      const allRows = body ? React.Children.toArray(body.props.children) : [];
      const dataRows = allRows.filter(r => r.type === 'tr');
      const term = q.trim().toLowerCase();
      const matched = term ? dataRows.filter(r => textOf(r).toLowerCase().includes(term)) : dataRows;

      const total = matched.length;
      const pages = Math.max(1, Math.ceil(total / per));
      const cur = Math.min(page, pages);
      const from = total ? (cur - 1) * per + 1 : 0;
      const to = Math.min(cur * per, total);
      const shown = matched.slice(from - 1 < 0 ? 0 : from - 1, to);

      const paged = mapTable(React.Children.toArray(card.props.children), (tbl) => {
        // หาตำแหน่งคอลัมน์ "ประวัติ" เพื่อตัดออกทั้งหัวตารางและทุกแถว
        let dropIdx = -1;
        const head = React.Children.toArray(tbl.props.children).find(c => c.type === 'thead');
        if (head) { void head; }
        const dropCells = (row) => {
          if (dropIdx < 0 || !row.props) return row;
          const cells = React.Children.toArray(row.props.children);
          if (cells.length <= dropIdx) return row;
          return React.cloneElement(row, {}, cells.filter((_, i) => i !== dropIdx));
        };
        // ปุ่มประวัติในตาราง — แสดงแค่ไอคอน (ตัดตัวเลขจำนวนครั้งออก)
        const iconOnly = (node) => {
          if (Array.isArray(node)) return node.map(iconOnly);
          if (!React.isValidElement(node)) return node;
          if (node.type === 'button' && /ghost/.test(String(node.props.className || ''))) {
            const kids = React.Children.toArray(node.props.children)
              .filter(k => React.isValidElement(k));
            if (kids.length) return React.cloneElement(node, {}, kids);
          }
          const kids = node.props && node.props.children;
          if (kids == null || kids === false) return node;
          return React.cloneElement(node, {}, iconOnly(React.Children.toArray(kids)));
        };
        const parts = React.Children.toArray(tbl.props.children).map(c => {
          if (c.type === 'thead') {
            return React.cloneElement(c, {},
              React.Children.toArray(c.props.children).map(r => r.type === 'tr' ? dropCells(r) : r));
          }
          if (c.type !== 'tbody') return c;
          const cols = dropIdx < 0 ? 9 : 8;
          const rows = shown.length ? shown.map(r => iconOnly(dropCells(r))) : [
            <tr key="empty"><td colSpan={cols} className="center muted" style={{ padding: 24 }}>ไม่พบผลิตภัณฑ์ที่ค้นหา</td></tr>,
          ];
          return React.cloneElement(c, {}, rows);
        });
        return React.cloneElement(tbl, {}, parts);
      });

      const bar = (
        <div className="gcc-searchbar-row" key="lt-searchbar"
             style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
                      padding: '14px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <div className="gcc-search-input" style={{ flex: '0 1 340px', minWidth: 300 }}>
            <Icon name="search" size={14} />
            <input className="cfg-input" value={q} placeholder="ค้นหารหัส / ชื่อผลิตภัณฑ์"
              onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </div>
          <button className="btn primary sm" onClick={() => setPage(1)}>ค้นหา</button>
          <button className="btn sm" onClick={() => { setQ(''); setPage(1); }}>รีเซ็ต</button>
        </div>
      );

      const pageBtns = [];
      const win = 5;
      let st = Math.max(1, cur - Math.floor(win / 2));
      const en = Math.min(pages, st + win - 1);
      st = Math.max(1, en - win + 1);
      const pgStyle = (active, disabled) => ({
        minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
        cursor: disabled ? 'default' : 'pointer',
        border: '1px solid ' + (active ? '#237450' : '#d9d9d9'),
        background: active ? '#237450' : '#fff',
        color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)'),
      });
      for (let i = st; i <= en; i++) {
        pageBtns.push(
          <button key={i} style={pgStyle(i === cur, false)} onClick={() => setPage(i)}>{i}</button>
        );
      }

      const pager = (
        <div key="lt-pager"
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
        <div className="search-card gcc-listcard" key="lt-listcard" style={{ padding: 0, overflow: 'hidden' }}>
          {bar}
          <div style={{ padding: '16px 16px 0' }}>{paged}</div>
          {pager}
        </div>
      );
      return React.cloneElement(tree, {}, next);
    } catch (e) {
      return tree;
    }
  }
  LoanTypeConfigPage.__ltListPatched = true;
  Object.assign(window, { LoanTypeConfigPage });
})();
