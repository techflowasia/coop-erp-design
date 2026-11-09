// ═════════════════════════════════════════════════════════════════
//  สินเชื่อ › อนุมัติสินเชื่อ — จัดรูปแบบหน้ารายการใหม่
//  ลำดับตามเมนู "วัตถุประสงค์การกู้": แถบค้นหา (ค้นหา/รีเซ็ต)
//  → แท็บขีดใต้ + ตัวเลข → แถบเลือกหลายรายการ → ตาราง → แบ่งหน้า
//  คอลัมน์/พฤติกรรมเดิมทั้งหมด (คลิกแถว, อนุมัติ/ไม่อนุมัติ) คงไว้
// ═════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  const Orig = window.LoanApprovalPage;
  if (!R || !Orig || Orig.__laListPatched) return;

  const LABEL = 'หน้าอนุมัติสินเชื่อ';
  const G = '#237450', SOFT = '#eafef2', LINE = '#f0f0f0';

  const cls = (n) => (n && n.props && typeof n.props.className === 'string') ? n.props.className : '';
  const kidsOf = (n) => (n && n.props) ? R.Children.toArray(n.props.children) : [];
  const findDeep = (node, test) => {
    const stack = Array.isArray(node) ? node.slice() : [node];
    while (stack.length) {
      const n = stack.shift();
      if (!n || typeof n !== 'object') continue;
      if (Array.isArray(n)) { stack.unshift.apply(stack, n); continue; }
      if (test(n)) return n;
      if (n.props) stack.push.apply(stack, kidsOf(n));
    }
    return null;
  };

  const btnStyle = (primary) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px',
    borderRadius: 4, fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    whiteSpace: 'nowrap',
    border: '1px solid ' + (primary ? G : '#d9d9d9'),
    background: primary ? G : '#fff',
    color: primary ? '#fff' : 'rgba(0,0,0,.65)',
  });
  const inpStyle = {
    height: 32, padding: '0 10px', border: '1px solid #d9d9d9', borderRadius: 2,
    fontFamily: 'inherit', fontSize: 13, color: 'rgba(0,0,0,.88)', background: '#fff',
  };

  function ListLayout(props) {
    const { screen, typeF, setTypeF, from, setFrom, to, setTo, page, setPage, per, setPer } = props;
    const kids = kidsOf(screen);
    const iCard = kids.findIndex((k) => cls(k).includes('search-card'));
    if (iCard < 0) return null;

    const card = kids[iCard];
    const cardKids = kidsOf(card);
    const toolbar = cardKids.find((k) => cls(k).includes('lrq-inbox-toolbar'));
    const selbar = cardKids.find((k) => cls(k).includes('wa-selbar'));
    const tableWrap = cardKids.find((k) => cls(k).includes('table-wrap'));
    const note = cardKids.find((k) => k.type === 'p');
    if (!toolbar || !tableWrap) return null;

    const tabsBox = findDeep(toolbar, (n) => cls(n).includes('lrq-inbox-tabs'));
    const searchBox = findDeep(toolbar, (n) => cls(n).includes('lrq-inbox-search'));
    const searchInput = searchBox ? findDeep(searchBox, (n) => n.type === 'input') : null;
    const table = findDeep(tableWrap, (n) => n.type === 'table');
    if (!table) return null;

    // ── ข้อมูลจริงของแต่ละแถว (ใช้กรองประเภทเงินกู้ / ช่วงวันที่ยื่นคำขอ) ──
    const recs = (window.laReqLoad ? window.laReqLoad() : []) || [];
    const byId = {};
    recs.forEach((r) => { byId[r.id] = r; });
    const prodOf = (r) => (window.laReqProduct ? window.laReqProduct(r) : null)
      || { code: r.productCode || r.productId, name: r.productName || '' };
    const projOf = (r) => (window.lpjListCell ? window.lpjListCell({ key: r.crmRef || r.id, productId: r.productId, projectId: r.lpjProjectId, roundId: r.lpjRoundId }).title : '') || '';
    const typeOpts = [...new Set(recs.map(projOf).filter(Boolean))].map(t => ({ code: t, label: t }));
    // Children.toArray เติม ".$" หน้า key — ตัดออกก่อนเทียบกับ id ของระเบียน
    const rowId = (tr) => String(tr.key == null ? '' : tr.key).replace(/^\.\$/, '');

    const keep = (tr) => {
      const rec = byId[rowId(tr)];
      if (!rec) return true;
      if (typeF !== 'all' && projOf(rec) !== typeF) return false;
      const d = String(rec.submittedAt || '').slice(0, 10);
      if (from && d && d < from) return false;
      if (to && d && d > to) return false;
      return true;
    };

    const tKids = kidsOf(table);
    const thead = tKids.find((n) => n.type === 'thead');
    const tbody = tKids.find((n) => n.type === 'tbody');
    const allRows = kidsOf(tbody).filter((n) => n && n.type === 'tr');
    const dataRows = allRows.filter((tr) => !!byId[rowId(tr)]);
    const filtered = dataRows.length ? dataRows.filter(keep) : allRows;
    const total = dataRows.length ? filtered.length : 0;
    const pages = Math.max(1, Math.ceil(total / per));
    const cur = Math.min(page, pages);
    const start = (cur - 1) * per;
    const shown = dataRows.length ? filtered.slice(start, start + per) : allRows;

    const emptyRow = (
      <tr key="la-empty">
        <td colSpan="8" style={{ textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px', fontSize: 13 }}>
          ไม่พบข้อมูล
        </td>
      </tr>
    );

    const newTable = R.cloneElement(table, {}, [
      thead ? R.cloneElement(thead, { key: 'th' }) : null,
      <tbody key="tb">{dataRows.length && shown.length === 0 ? emptyRow : shown}</tbody>,
    ]);
    const newTableWrap = R.cloneElement(tableWrap, {}, kidsOf(tableWrap).map((n, i) =>
      cls(n).includes('table-scroll')
        ? R.cloneElement(n, { key: 'ts' }, [newTable])
        : R.cloneElement(n, { key: 'tw' + i })));

    // ── แท็บ: ขีดใต้แท็บที่ Active + ตัวเลขจำนวน (นับทั้งหมด ไม่สนตัวกรอง) ──
    const tabs = (tabsBox ? kidsOf(tabsBox) : []).map((b, i) => {
      const active = cls(b).includes('active');
      const bk = kidsOf(b);
      const label = bk.find((x) => typeof x === 'string' || typeof x === 'number');
      const countNode = bk.find((x) => x && x.props);
      const count = countNode ? kidsOf(countNode)[0] : null;
      return R.cloneElement(b, {
        key: 'tab' + i,
        className: 'la-utab' + (active ? ' active' : ''),
        onClick: (e) => { setPage(1); if (b.props.onClick) b.props.onClick(e); },
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: 0,
          border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap',
          color: active ? G : 'rgba(0,0,0,.65)',
          borderBottom: '2px solid ' + (active ? G : 'transparent'),
          marginBottom: -1,
        },
      }, [
        <span key="l">{label}</span>,
        count != null ? (
          <span key="c" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20,
            height: 20, padding: '0 6px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
            background: active ? SOFT : '#f5f5f5', color: active ? G : 'rgba(0,0,0,.45)',
          }}>{count}</span>
        ) : null,
      ]);
    });

    const resetAll = () => {
      setTypeF('all'); setFrom(''); setTo(''); setPage(1);
      if (searchInput && searchInput.props.onChange) searchInput.props.onChange({ target: { value: '' } });
    };

    const pageBtn = (n, label, disabled, active) => (
      <button key={'p' + label} type="button" disabled={disabled} onClick={() => setPage(n)}
              style={{
                minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit',
                fontSize: 12, cursor: disabled ? 'default' : 'pointer',
                border: '1px solid ' + (active ? G : '#d9d9d9'),
                background: active ? G : '#fff',
                color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)'),
              }}>{label}</button>
    );

    const merged = (
      <div key="la-listcard" className="search-card la-listcard" style={{ padding: 0, overflow: 'hidden' }}>
        {/* ── แถบค้นหา ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, padding: '14px 16px 12px' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 300px', minWidth: 220 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', lineHeight: 1.2 }}>ค้นหา</span>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff',
              border: '1px solid #d9d9d9', borderRadius: 2,
            }}>
              <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.35)' }}>
                {window.Icon ? <window.Icon name="search" size={14} /> : null}
              </span>
              {searchInput ? R.cloneElement(searchInput, {
                style: {
                  flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit',
                  fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent',
                },
              }) : null}
            </label>
          </span>

          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', lineHeight: 1.2 }}>โครงการเงินกู้</span>
            <select className="cfg-input" value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(1); }}
                    aria-label="โครงการเงินกู้" style={{ width: 260 }}>
              <option value="all">ทั้งหมด</option>
              {typeOpts.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </span>

          <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', lineHeight: 1.2 }}>วันที่ยื่นคำขอ</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ErpDate value={from} onChange={(v) => ((e) => { setFrom(e.target.value); setPage(1); })({ target: { value: v } })} style={{ width: 186 }} />
            <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>
            <ErpDate value={to} onChange={(v) => ((e) => { setTo(e.target.value); setPage(1); })({ target: { value: v } })} style={{ width: 186 }} />
            </span>
          </span>

          <span style={{ flex: '1 1 auto' }} />

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button type="button" style={btnStyle(true)} onClick={() => setPage(1)}>ค้นหา</button>
            <button type="button" style={btnStyle(false)} onClick={resetAll}>รีเซ็ต</button>
          </span>
        </div>

        {/* ── แท็บ ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 16px', borderBottom: '1px solid ' + LINE }}>
          {tabs}
        </div>

        {/* ── แถบเลือกหลายรายการ ── */}
        {selbar ? <div style={{ padding: '12px 16px 0' }}>{R.cloneElement(selbar, { key: 'sb' })}</div> : null}

        {/* ── ตาราง + แบ่งหน้า ── */}
        <div style={{ padding: '16px 16px 0' }}>
          {newTableWrap}
          <div style={{
            padding: '12px 0', borderTop: '1px solid ' + LINE, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
              {total === 0 ? '0 รายการ' : (start + 1) + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pageBtn(cur - 1, '‹', cur <= 1, false)}
              {Array.from({ length: pages }, (_, i) => pageBtn(i + 1, String(i + 1), false, cur === i + 1))}
              {pageBtn(cur + 1, '›', cur >= pages, false)}
              <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }}
                      aria-label="จำนวนต่อหน้า"
                      style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                               fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                <option value={20}>20 / หน้า</option>
                <option value={50}>50 / หน้า</option>
                <option value={100}>100 / หน้า</option>
              </select>
            </div>
          </div>
          {note ? <div style={{ paddingBottom: 14 }}>{R.cloneElement(note, { key: 'note', style: { ...(note.props.style || {}), marginTop: 0 } })}</div> : null}
        </div>
      </div>
    );

    const next = [];
    kids.forEach((k, i) => {
      if (i === iCard) { next.push(merged); return; }
      next.push(R.isValidElement(k) ? R.cloneElement(k, { key: 'k' + i }) : k);
    });
    return R.cloneElement(screen, {}, next);
  }

  function LoanApprovalPage(props) {
    const [typeF, setTypeF] = R.useState('all');
    const [from, setFrom] = R.useState('');
    const [to, setTo] = R.useState('');
    const [page, setPage] = R.useState(1);
    const [per, setPer] = R.useState(20);
    const out = Orig(props);
    try {
      let hit = false;
      const walk = (node) => {
        if (Array.isArray(node)) return node.map(walk);
        if (!node || typeof node !== 'object' || !node.props) return node;
        if (node.props['data-screen-label'] === LABEL) {
          const r = ListLayout({ screen: node, typeF, setTypeF, from, setFrom, to, setTo, page, setPage, per, setPer });
          if (r) { hit = true; return r; }
          return node;
        }
        if (hit) return node;
        return R.cloneElement(node, {}, walk(kidsOf(node)));
      };
      const res = walk(out);
      return hit ? res : out;
    } catch (e) {
      return out;
    }
  }

  LoanApprovalPage.__laListPatched = true;
  window.LoanApprovalPage = LoanApprovalPage;
})();
