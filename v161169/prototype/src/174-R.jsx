// ════════════════════════════════════════════════════════════════════
//  หน้าเพิ่ม/แก้ไขโครงการอบรม — ช่อง "ผู้มีสิทธิ์เข้าร่วม" เลือกได้หลายรายการ
//  ตาราง 3 คอลัมน์: ผู้มีสิทธิ์เข้าร่วม · เงื่อนไข · ลบ + ปุ่มเพิ่มมุมขวาบน
// ════════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  if (!R) return;

  const VOID_TAGS = { input: 1, img: 1, br: 1, hr: 1, col: 1, area: 1, base: 1, embed: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  function mapTree(node, fn) {
    if (Array.isArray(node)) return node.map((n) => mapTree(n, fn));
    if (!R.isValidElement(node)) return node;
    const res = fn(node);
    if (res === null) return null;
    if (res !== undefined) return res;
    if (typeof node.type === 'string' && VOID_TAGS[node.type]) return node;
    const kids = node.props && node.props.children;
    if (kids == null || kids === false) return node;
    const arr = Array.isArray(kids) ? kids : [kids];
    return R.cloneElement(node, undefined, ...arr.map((k) => mapTree(k, fn)));
  }

  function EligibleMulti({ value, onChange }) {
    const opts = window.SEM_ELIGIBLE || [];
    const [open, setOpen] = R.useState(false);
    const box = R.useRef(null);
    const picked = String(value || '').split(',').map(s => s.trim()).filter(Boolean);

    R.useEffect(() => {
      if (!open) return;
      const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', away);
      return () => document.removeEventListener('mousedown', away);
    }, [open]);

    const commit = (next) => onChange({ target: { value: next.join(',') } });
    const toggle = (v) => commit(picked.includes(v) ? picked.filter(x => x !== v) : picked.concat(v));
    const labelOf = (v) => { const o = opts.find(o => o.v === v); return o ? o.l : v; };

    return (
      <div ref={box} style={{ position: 'relative' }}>
        <div onClick={() => setOpen(o => !o)}
             style={{ minHeight: 32, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                      padding: '4px 28px 4px 8px', border: '1px solid #d9d9d9', borderRadius: 6,
                      background: '#fff', cursor: 'pointer' }}>
          {picked.length === 0
            ? <span style={{ color: 'rgba(0,0,0,.35)', fontSize: 13 }}>เลือกผู้มีสิทธิ์เข้าร่วม</span>
            : picked.map(v => (
                <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
                                       background: '#f5f5f5', border: '1px solid #e6e6e6', borderRadius: 4,
                                       padding: '1px 4px 1px 7px', lineHeight: '18px' }}>
                  {labelOf(v)}
                  <span role="button" aria-label="ลบ"
                        onClick={(e) => { e.stopPropagation(); commit(picked.filter(x => x !== v)); }}
                        style={{ cursor: 'pointer', color: 'rgba(0,0,0,.45)', padding: '0 2px' }}>×</span>
                </span>
              ))}
          <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                         color: 'rgba(0,0,0,.3)', fontSize: 10 }}>▾</span>
        </div>
        {open && (
          <div style={{ position: 'absolute', zIndex: 30, top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: '#fff', border: '1px solid #e6e6e6', borderRadius: 6,
                        boxShadow: '0 6px 16px rgba(0,0,0,.12)', maxHeight: 240, overflowY: 'auto', padding: 4 }}>
            {opts.map(o => (
              <label key={o.v}
                     style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 13,
                              borderRadius: 4, cursor: 'pointer' }}>
                <input type="checkbox" checked={picked.includes(o.v)} onChange={() => toggle(o.v)} />
                <span>{o.l}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  const Icon = window.Icon || (() => null);

  // ── ช่องสังกัดที่มีสิทธิ์ — รูปแบบเดียวกับ SearchSelect เดิมของฟอร์ม ──
  //  ช่องยุบ "— ค้นหา / เพิ่มสังกัดที่มีสิทธิ์ —" → เปิดแล้วมีช่องค้นหา + แถว รหัส · ชื่อ (กลุ่มงานชิดขวา)
  //  tag เขียวของสังกัดที่เลือกเรียงใต้ช่อง
  function DeptPicker({ value, onChange, rowKey }) {
    const [, bump] = R.useState(0);
    R.useEffect(() => {
      const fn = () => bump(n => n + 1);
      subs.add(fn);
      return () => subs.delete(fn);
    }, []);

    const open = store.openDept === rowKey;
    const q = store.deptQuery || '';
    const setOpen = (v) => { store.openDept = v ? rowKey : null; store.deptQuery = ''; notify(); };
    const setQ = (v) => { store.deptQuery = v; notify(); };

    const opts = window.semAffilOptions ? window.semAffilOptions()
      : (window.semDeptOptions ? window.semDeptOptions().map(d => ({ value: d.code, label: d.code + ' · ' + d.name, sub: '' })) : []);
    const picked = value || [];
    const labelOf = (code) => (opts.find(o => o.value === code) || {}).label || code;
    const key = q.trim().toLowerCase();
    const shown = opts.filter(o => !picked.includes(o.value))
      .filter(o => !key || (o.label + ' ' + (o.sub || '')).toLowerCase().includes(key));

    const trig = R.useRef(null);
    const [box, setBox] = R.useState(null);

    const measure = R.useCallback(() => {
      const el = trig.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ left: r.left, top: r.bottom + 3, width: r.width });
    }, []);

    R.useEffect(() => {
      if (!open) { setBox(null); return; }
      measure();
      const onMove = () => measure();
      window.addEventListener('scroll', onMove, true);
      window.addEventListener('resize', onMove);
      // เลื่อนหน้าเข้าหาแผงให้หมด หากเปิดต่ำกว่าขอบจอ
      const t = setTimeout(() => {
        const el = trig.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const need = r.bottom + 3 + 290 - window.innerHeight;
        if (need > 0) {
          const sc = el.closest('.main') || document.scrollingElement;
          if (sc) sc.scrollTop += need + 16;
        }
      }, 20);
      return () => {
        clearTimeout(t);
        window.removeEventListener('scroll', onMove, true);
        window.removeEventListener('resize', onMove);
      };
    }, [open, measure]);

    return (
      <div style={{ position: 'relative' }}>
        <div ref={trig} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
             style={{ height: 32, display: 'flex', alignItems: 'center', cursor: 'pointer',
                      padding: '0 28px 0 10px', border: '1px solid #d9d9d9', borderRadius: 2,
                      background: '#fff', position: 'relative',
                      borderColor: open ? 'var(--primary)' : '#d9d9d9' }}>
          <span style={{ fontSize: 13, color: 'rgba(0,0,0,.35)' }}>— ค้นหา / เพิ่มสังกัดที่มีสิทธิ์ —</span>
          <span style={{ position: 'absolute', right: 10, color: 'rgba(0,0,0,.3)', fontSize: 10 }}>
            {open ? '\u25b4' : '\u25be'}
          </span>
        </div>

        {open && box && (
          <div style={{ position: 'fixed', zIndex: 1200, left: box.left, top: box.top, width: box.width,
                        background: '#fff', border: '1px solid #e6e6e6', borderRadius: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                          borderBottom: '1px solid #f0f0f0' }}>
              <Icon name="search" size={13} />
              <input autoFocus value={q} placeholder="พิมพ์รหัสสังกัด / ชื่อ…"
                     onChange={(e) => setQ(e.target.value)}
                     style={{ flex: 1, border: 0, outline: 'none', fontSize: 13, background: 'transparent' }} />
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {shown.length === 0 ? (
                <div className="muted" style={{ padding: '10px 12px', fontSize: 12.5 }}>ไม่พบสังกัด</div>
              ) : shown.map(o => (
                <div key={o.value} onClick={() => { onChange(picked.concat(o.value)); setQ(''); }}
                     style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                              fontSize: 13, cursor: 'pointer' }}
                     onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
                     onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <span>{o.label}</span>
                  <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{o.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {picked.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {picked.map(code => (
              <span key={code}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                             background: 'var(--primary-50)', border: '1px solid var(--primary)',
                             color: 'var(--primary-700)', borderRadius: 4, padding: '3px 8px 3px 10px' }}>
                {labelOf(code)}
                <span role="button" aria-label="ลบ" onClick={() => onChange(picked.filter(c => c !== code))}
                      style={{ cursor: 'pointer', opacity: .7 }}>×</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── ตารางผู้มีสิทธิ์เข้าร่วม (3 คอลัมน์) ────────────────────────────
  //  คอลัมน์: ผู้มีสิทธิ์เข้าร่วม (dropdown) · เงื่อนไข (ตามชนิดที่เลือก) · ลบ
  //  เก็บสถานะนอก component กันค่าหายเมื่อฟอร์มถูก remount
  const store = { rows: [{ v: '', cond: {} }], openDept: null, deptQuery: '' };
  const subs = new Set();
  const notify = () => subs.forEach(fn => fn());

  function EligibleTable({ onChange }) {
    const [, bump] = R.useState(0);
    R.useEffect(() => {
      const fn = () => bump(n => n + 1);
      subs.add(fn);
      return () => subs.delete(fn);
    }, []);

    const opts = window.SEM_ELIGIBLE || [];
    const depts = window.semDeptOptions ? window.semDeptOptions() : [];
    const rows = store.rows;

    const commit = (next) => {
      store.rows = next;
      notify();
      if (onChange) {
        onChange({ target: { value: next.map(r => r.v).filter(Boolean).join(',') } });
      }
    };
    const setRow = (i, patch) => commit(store.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    const setCond = (i, k, val) => setRow(i, { cond: { ...(store.rows[i] || {}).cond, [k]: val } });

    const condCell = (r, i) => {
      if (!r.v) return <span className="muted" style={{ fontSize: 12.5 }}>เลือกผู้มีสิทธิ์เข้าร่วมก่อน</span>;
      if (r.v === 'dept') {
        return (
          <DeptPicker value={r.cond.depts || []} rowKey={i}
                      onChange={(list) => setCond(i, 'depts', list)} />
        );
      }
      if (r.v === 'range') {
        return (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="cfg-input mono" style={{ width: 130 }} placeholder="M-000123"
                   value={r.cond.from || ''} onChange={(e) => setCond(i, 'from', e.target.value)} />
            <span className="muted">ถึง</span>
            <input className="cfg-input mono" style={{ width: 130 }} placeholder="M-000456"
                   value={r.cond.to || ''} onChange={(e) => setCond(i, 'to', e.target.value)} />
          </div>
        );
      }
      if (r.v === 'newbie') {
        return <span className="muted" style={{ fontSize: 12.5 }}>สมาชิกที่สมัครไม่เกิน 1 ปี (ระบบตรวจจากวันที่เข้าเป็นสมาชิก)</span>;
      }
      if (r.v === 'all') {
        return <span className="muted" style={{ fontSize: 12.5 }}>เปิดให้สมาชิกทุกคนมีสิทธิ์ลงทะเบียน</span>;
      }
      return (
        <input className="cfg-input" value={r.cond.text || ''} placeholder="ระบุเงื่อนไข"
               onChange={(e) => setCond(i, 'text', e.target.value)} />
      );
    };

    return (
      <div className="sr-field" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label className="sr-label" style={{ margin: 0 }}>ผู้มีสิทธิ์เข้าร่วม <span style={{ color: 'var(--danger)' }}>*</span></label>
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" className="btn sm"
                  onClick={() => commit(store.rows.concat({ v: '', cond: {} }))}>
            <Icon name="plus" /> เพิ่มผู้มีสิทธิ์เข้าร่วม
          </button>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '34%' }}>ผู้มีสิทธิ์เข้าร่วม</th>
                <th>เงื่อนไข</th>
                <th className="center" style={{ width: 70 }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={3} className="center muted" style={{ padding: 20 }}>
                  ยังไม่ได้กำหนดผู้มีสิทธิ์เข้าร่วม — กด “เพิ่มผู้มีสิทธิ์เข้าร่วม”
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <select className="cfg-input" value={r.v}
                            onChange={(e) => setRow(i, { v: e.target.value, cond: {} })}>
                      <option value="">— เลือกผู้มีสิทธิ์เข้าร่วม —</option>
                      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </td>
                  <td>{condCell(r, i)}</td>
                  <td className="center">
                    <button type="button" className="btn ghost" title="ลบแถว"
                            onClick={() => commit(store.rows.filter((_, j) => j !== i))}>
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const install = () => {
    const orig = window.SeminarProjectForm;
    if (!orig) return false;
    if (orig.__eligMulti) return true;
    const Patched = function (props) {
      const out = orig(props);
      const isEligOpts = (sel) => {
        const opts = window.SEM_ELIGIBLE || [];
        if (!opts.length) return false;
        const kids = R.Children.toArray(sel.props.children);
        if (kids.length !== opts.length) return false;
        return kids.every((k, i) => R.isValidElement(k) && String(k.props.value) === String(opts[i].v));
      };

      let eligChange = null;
      mapTree(out, (el) => {
        if (el.type === 'select' && isEligOpts(el)) eligChange = el.props.onChange;
        return undefined;
      });

      const DROP = { 'เงื่อนไข': 1, 'ช่วงรหัสสมาชิกที่มีสิทธิ์': 1, 'สังกัดที่มีสิทธิ์เข้าร่วม': 1 };
      return mapTree(out, (el) => {
        const lab = el.props && el.props.label;
        if (typeof lab !== 'string') return undefined;
        if (DROP[lab]) return null;
        if (lab !== 'ผู้มีสิทธิ์เข้าร่วม') return undefined;
        return <EligibleTable onChange={eligChange} />;
      });
    };
    Patched.__eligMulti = true;
    window.SeminarProjectForm = Patched;
    return true;
  };

  if (!install()) {
    let n = 0;
    const t = setInterval(() => { if (install() || ++n > 100) clearInterval(t); }, 100);
  }
})();
