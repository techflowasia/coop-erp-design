// ════════════════════════════════════════════════════════════════════
//  Pagination กลางระบบ — เพิ่มแถบแบ่งหน้าให้ตารางรายการทุกเมนู
//  · ทำงานระดับ document: หาตารางรายการที่ยังไม่มีแถบแบ่งหน้า แล้วเติมให้
//  · ซ่อนแถวที่อยู่นอกหน้าปัจจุบัน · เลือกจำนวนแถวต่อหน้าได้ (10/20/50/100)
//  · ข้ามตารางกรอกข้อมูล (มี input/select) และตารางที่มี pagination อยู่แล้ว
// ════════════════════════════════════════════════════════════════════
(function () {
  const MIN_ROWS = 5;          // ตารางเล็กกว่านี้ไม่ต้องแบ่งหน้า
  const DEFAULT_SIZE = 20;
  const SIZES = [20, 50, 100];
  const state = new Map();     // id → { page, size }
  let seq = 0, busy = false, timer = null;
  const sig = new Map();       // id → ลายเซ็นสถานะล่าสุด (กันสร้างซ้ำไม่จำเป็น)

  // ── สไตล์ ──────────────────────────────────────────────────────────
  const css = `
.pgn-auto { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  margin: 0 16px; padding: 12px 0; border-top: 1px solid #f0f0f0; }
.pgn-auto .pgn-info { font-size: 12px; color: rgba(0,0,0,.45); }
.pgn-auto .pgn-nav { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.pgn-auto .pgn-btn {
  min-width: 28px; height: 28px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid #d9d9d9; background: #fff; border-radius: 4px; cursor: pointer;
  font-family: inherit; font-size: 12px; color: rgba(0,0,0,.65);
  transition: color .15s, border-color .15s, background .15s;
}
.pgn-auto .pgn-btn:hover:not(:disabled) { color: var(--primary, #237450); border-color: var(--primary, #237450); }
.pgn-auto .pgn-btn.on { background: var(--primary, #237450); border-color: var(--primary, #237450); color: #fff; }
.pgn-auto .pgn-btn:disabled { color: rgba(0,0,0,.25); cursor: default; }
.pgn-auto .pgn-gap { padding: 0 2px; color: rgba(0,0,0,.45); font-size: 12px; }
.pgn-auto .pgn-size {
  height: 28px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff;
  font-family: inherit; font-size: 12px; color: rgba(0,0,0,.65); padding: 0 6px;
}
@media print { .pgn-auto { display: none !important; } }
`;
  const style = document.createElement('style');
  style.id = 'pgn-auto-style';
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  // ── ตัวช่วย ────────────────────────────────────────────────────────
  const dataRows = (tbody) => Array.from(tbody.rows).filter(r => !r.hasAttribute('data-pgn-hide-skip'));

  const PAGER_TEXT = /\d+\s*[-–]\s*\d+\s*จาก\s*[\d,]+\s*(รายการ|แถว|คน)/;
  const PAGER_SIZE = /\/\s*หน้า/;

  // element นี้หน้าตาเหมือนแถบแบ่งหน้าของเดิมหรือไม่
  function looksLikePager(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.classList.contains('pgn-auto')) return false;
    const cls = typeof el.className === 'string' ? el.className : '';
    if (/\b(pagination|pager|pgn-native)\b/i.test(cls)) return true;
    if (el.querySelector('table')) return false;          // ไม่ใช่แถบ แต่เป็นคอนเทนเนอร์
    const txt = (el.textContent || '').trim();
    if (txt.length > 200) return false;
    if (PAGER_TEXT.test(txt)) return true;
    if (PAGER_SIZE.test(txt) && el.querySelector('select, button')) return true;
    return false;
  }

  function hasNativePager(tbl) {
    let node = tbl.parentElement;
    while (node && node !== document.body) {
      for (const child of node.children) {
        if (child.contains(tbl)) continue;
        if (child.classList.contains('pgn-auto') || child.querySelector('.pgn-auto')) continue;
        if (looksLikePager(child)) return true;
        // แถบอาจถูกห่ออีกชั้นหนึ่ง
        if (child.children.length <= 4) {
          for (const g of child.children) {
            if (g.classList.contains('pgn-auto') || g.querySelector('.pgn-auto')) continue;
            if (looksLikePager(g)) return true;
          }
        }
      }
      if (node.tagName === 'MAIN' || node.classList.contains('main') || node.classList.contains('modal-card')
          || node.classList.contains('search-card') || node.classList.contains('cfg-card')
          || node.classList.contains('card') || node.hasAttribute('data-screen-label')) break;
      node = node.parentElement;
    }
    return false;
  }

  function isListTable(tbl) {
    if (!tbl.tBodies || !tbl.tBodies[0]) return false;
    if (tbl.closest('.pgn-auto')) return false;
    if (tbl.classList.contains('vch-grid-tbl') || tbl.classList.contains('vch-items-tbl') || tbl.classList.contains('cc-sticky-tbl') || tbl.classList.contains('cc-ledger-tbl') || tbl.classList.contains('lpo-pay-tbl') || tbl.hasAttribute('data-no-pgn')) return false;
    const tbody = tbl.tBodies[0];
    const rows = dataRows(tbody);
    if (rows.length < MIN_ROWS) return false;
    // ตารางกรอกข้อมูล → ข้าม (สวิตช์/checkbox ในคอลัมน์“ใช้งาน” ไม่นับ)
    if (tbody.querySelector('textarea, select, input:not([type="checkbox"]):not([type="radio"])')) return false;
    // แถวว่าง/แถวสรุปเดี่ยว → ข้าม
    if (rows.length === 1) return false;
    // มีแถบแบ่งหน้าของเดิมอยู่แล้วในหน้านี้ → ข้าม (กันซ้อนกัน)
    if (hasNativePager(tbl)) return false;
    return true;
  }

  function mountPoint(tbl) {
    const wrap = tbl.closest('.table-scroll') || tbl.closest('.table-wrap');
    return wrap || tbl;
  }

  function build(tbl) {
    const tbody = tbl.tBodies[0];
    const rows = dataRows(tbody);
    const total = rows.length;

    if (!tbl.dataset.pgnId) tbl.dataset.pgnId = 'pgn' + (++seq);
    const id = tbl.dataset.pgnId;
    const st = state.get(id) || { page: 1, size: DEFAULT_SIZE };
    const pages = Math.max(1, Math.ceil(total / st.size));
    if (st.page > pages) st.page = pages;
    state.set(id, st);

    // ไม่มีอะไรเปลี่ยน → ไม่ต้องแตะ DOM (กันวนซ้ำกับ React)
    const host0 = mountPoint(tbl);
    const bar0 = host0.nextElementSibling;
    const barOk = !!(bar0 && bar0.classList && bar0.classList.contains('pgn-auto') && bar0.dataset.for === id);
    const mySig = total + '|' + st.page + '|' + st.size + '|' + (barOk ? 1 : 0);
    if (sig.get(id) === mySig && barOk) return;
    sig.set(id, mySig);

    const from = (st.page - 1) * st.size;
    const to = Math.min(from + st.size, total);
    rows.forEach((r, i) => {
      const show = i >= from && i < to;
      if (show) { if (r.dataset.pgnHidden) { r.style.display = ''; delete r.dataset.pgnHidden; } }
      else if (!r.dataset.pgnHidden) { r.style.display = 'none'; r.dataset.pgnHidden = '1'; }
    });

    const host = mountPoint(tbl);
    let bar = host.nextElementSibling;
    if (!(bar && bar.classList && bar.classList.contains('pgn-auto') && bar.dataset.for === id)) {
      bar = document.createElement('div');
      bar.className = 'pagination pgn-auto';
      bar.dataset.for = id;
      host.parentNode.insertBefore(bar, host.nextSibling);
    }

    const nums = [];
    const push = (n) => nums.push(n);
    if (pages <= 7) { for (let i = 1; i <= pages; i++) push(i); }
    else {
      push(1);
      if (st.page > 3) push('…');
      for (let i = Math.max(2, st.page - 1); i <= Math.min(pages - 1, st.page + 1); i++) push(i);
      if (st.page < pages - 2) push('…');
      push(pages);
    }

    bar.innerHTML = '';
    const info = document.createElement('span');
    info.className = 'pgn-info';
    info.textContent = total === 0 ? '0 รายการ' : (from + 1) + '-' + to + ' จาก ' + total + ' รายการ';
    bar.appendChild(info);

    const nav = document.createElement('div');
    nav.className = 'pgn-nav';
    bar.appendChild(nav);

    const mk = (label, disabled, onClick, on) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pgn-btn' + (on ? ' on' : '');
      b.textContent = label;
      b.disabled = !!disabled;
      if (onClick) b.addEventListener('click', onClick);
      nav.appendChild(b);
      return b;
    };
    const go = (p) => { st.page = p; state.set(id, st); build(tbl); };

    mk('‹', st.page <= 1, () => go(st.page - 1));
    nums.forEach(n => {
      if (n === '…') { const s = document.createElement('span'); s.className = 'pgn-gap'; s.textContent = '…'; nav.appendChild(s); }
      else mk(String(n), false, () => go(n), n === st.page);
    });
    mk('›', st.page >= pages, () => go(st.page + 1));

    const sel = document.createElement('select');
    sel.className = 'pgn-size';
    SIZES.forEach(s => {
      const o = document.createElement('option');
      o.value = String(s); o.textContent = s + ' / หน้า';
      if (s === st.size) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => { st.size = Number(sel.value); st.page = 1; state.set(id, st); build(tbl); });
    nav.appendChild(sel);
  }

  function cleanup(tbl) {
    const id = tbl.dataset.pgnId;
    dataRows(tbl.tBodies[0] || { rows: [] }).forEach(r => {
      if (r.dataset.pgnHidden) { r.style.display = ''; delete r.dataset.pgnHidden; }
    });
    if (id) {
      sig.delete(id);
      const bar = document.querySelector('.pgn-auto[data-for="' + id + '"]');
      if (bar) bar.remove();
    }
  }

  function apply() {
    busy = true;
    try {
      document.querySelectorAll('table.tbl, table.data-table').forEach(tbl => {
        if (isListTable(tbl)) build(tbl);
        else if (tbl.dataset.pgnId) cleanup(tbl);
      });
      // ลบแถบที่ตารางหายไปแล้ว
      document.querySelectorAll('.pgn-auto:not(.cc-pager)').forEach(bar => {
        const id = bar.dataset.for;
        if (!document.querySelector('table[data-pgn-id="' + id + '"]')) bar.remove();
      });
    } finally {
      // ทิ้ง mutation ที่เกิดจากตัวเอง แล้วจึงปลดล็อก (กันวนซ้ำข้าม microtask)
      try { obs.takeRecords(); } catch (e) {}
      setTimeout(() => { busy = false; }, 0);
    }
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; apply(); }, 150);
  }

  const obs = new MutationObserver((muts) => {
    if (busy) return;
    for (const m of muts) {
      const t = m.target;
      if (!t || t.nodeType !== 1) continue;
      if (t.closest && t.closest('.pgn-auto')) continue;
      if (t.hasAttribute && (t.hasAttribute('data-pgn-hidden') || t.hasAttribute('data-pgn-id'))) continue;
      if (t.tagName === 'TR' || t.tagName === 'TBODY') continue;
      return schedule();
    }
  });

  const start = () => {
    obs.observe(document.body, { childList: true, subtree: true, attributes: false });
    apply();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    window.addEventListener('hashchange', schedule);
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);

  window.pgnRefresh = apply;
})();
