// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — ผังบัญชี (Chart of Accounts)
//  ผังต้นไม้ 5+ ระดับ · รหัส 6 หลัก · บัญชีคุม/บัญชีย่อย · Active/Inactive
//  · ค้นหา · เพิ่ม/แก้ไข/แทรก/ลบ · แยกตามปีงบประมาณ
// ════════════════════════════════════════════════════════════════════

// ─── localStorage (แยกตามปีงบประมาณ) ───────────────────────────────
function coaClone(list) { return (list || []).map(n => ({ ...n, children: coaClone(n.children) })); }
function coaLoad(year) {
  try {
    const saved = localStorage.getItem('coa_tree_v2_' + year);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  if (Number(year) === window.COA_CURRENT_YEAR) return coaClone(window.COA_SEED);
  return [];   // ปีอื่นเริ่มว่าง — ให้ผู้ใช้คัดลอกจากปีที่มีข้อมูล
}
function coaSave(year, list) {
  try { localStorage.setItem('coa_tree_v2_' + year, JSON.stringify(list)); } catch (e) {}
}
function coaYearHasData(year) {
  try { if (localStorage.getItem('coa_tree_v2_' + year)) return true; } catch (e) {}
  return Number(year) === window.COA_CURRENT_YEAR;
}

let _coaSeq = 0;
const coaUid = () => 'CN-' + Date.now().toString(36) + '-' + (++_coaSeq);

// ─── tree helpers ───────────────────────────────────────────────────
function coaRemove(list, id) {
  return list.filter(n => n.id !== id).map(n => ({ ...n, children: coaRemove(n.children || [], id) }));
}
function coaUpdate(list, id, patch) {
  return list.map(n => n.id === id ? { ...n, ...patch }
    : { ...n, children: coaUpdate(n.children || [], id, patch) });
}
function coaAddChild(list, parentId, child) {
  return list.map(n => n.id === parentId
    ? { ...n, kind: 'control', children: [...(n.children || []), child] }
    : { ...n, children: coaAddChild(n.children || [], parentId, child) });
}
function coaInsertAfter(list, siblingId, node) {
  const idx = list.findIndex(n => n.id === siblingId);
  if (idx >= 0) { const c = [...list]; c.splice(idx + 1, 0, node); return c; }
  return list.map(n => ({ ...n, children: coaInsertAfter(n.children || [], siblingId, node) }));
}
function coaFind(list, id, parent = null, level = 1) {
  for (const n of list) {
    if (n.id === id) return { node: n, parent, level };
    const r = coaFind(n.children || [], id, n, level + 1);
    if (r) return r;
  }
  return null;
}
function coaAllCodes(list, out = []) {
  list.forEach(n => { out.push(n.code); coaAllCodes(n.children || [], out); });
  return out;
}
const COA_BTN = { height: 32, padding: '0 12px' };
const COA_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';
const COA_INSERT_BELOW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">' + '<path d="M6 3.5v10.5a2 2 0 0 0 2 2h10" /><path d="M14 12l4 4-4 4" />' + '</svg>';

if (!document.getElementById('coa-tbl-style')) {
  const st = document.createElement('style');
  st.id = 'coa-tbl-style';
  st.textContent = '.coa-tbl .bud-acts { opacity: 1 !important; }'
    + '.coa-tbl .bud-act { border: 0 !important; background: transparent !important; color: var(--text-body, rgba(0,0,0,.65)); }'
    + '.coa-tbl .bud-act:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--primary) !important; }'
    + '.coa-tbl .bud-act.danger:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--danger) !important; }'
    + '.coa-tbl .bud-act.warn { color: #d48806 !important; }'
    + '.coa-tbl .bud-act.warn:hover { border: 1px solid #ffd666 !important; background: #fffbe6 !important; color: #d48806 !important; }'
    + '.coa-tbl .bud-act.danger { color: #cf1322 !important; }'
    + '.coa-tbl .bud-act.danger:hover { border: 1px solid #ffa39e !important; background: #fff1f0 !important; color: #cf1322 !important; }'
    + '.coa-tbl td, .coa-tbl th { white-space: normal !important; overflow-wrap: anywhere; min-width: 0 !important; }'
    + '.coa-tbl .bud-code, .coa-tbl .mono, .coa-tbl .ac-code-badge { overflow-wrap: normal !important; word-break: keep-all !important; white-space: nowrap !important; }'
    + '.coa-tbl .bud-name-wrap { flex-wrap: wrap !important; row-gap: 2px; }'
    + '.coa-tbl .bud-name-wrap > * { min-width: 0; }'
    + '.coa-search { border: 1px solid var(--border) !important; border-radius: 2px; background: #fff; }'
    + '.coa-search input { height: 100%; border: 0 !important; outline: 0 !important; box-shadow: none !important; background: transparent !important; }';
  document.head.appendChild(st);
}

function coaStats(list, acc = { total: 0, active: 0, control: 0, posting: 0, maxLevel: 0 }, level = 1) {
  list.forEach(n => {
    acc.total++; if (n.enabled) acc.active++;
    const isCtl = (n.children && n.children.length) || n.kind === 'control';
    if (isCtl) acc.control++; else acc.posting++;
    if (level > acc.maxLevel) acc.maxLevel = level;
    coaStats(n.children || [], acc, level + 1);
  });
  return acc;
}

// แนะนำรหัสบัญชีถัดไป (6 หลัก) จากบัญชีคุมระดับเหนือ
function coaSuggestChild(parent) {
  const base = parent.code;
  const zeros = (base.match(/0+$/) || [''])[0].length;
  if (zeros === 0) return '';
  const blk = zeros >= 2 ? 2 : 1;
  const prefixLen = window.COA_CODE_LEN - zeros;
  const prefix = base.slice(0, prefixLen);
  let mx = 0;
  (parent.children || []).forEach(s => {
    const v = parseInt(s.code.slice(prefixLen, prefixLen + blk), 10);
    if (!isNaN(v) && v > mx) mx = v;
  });
  const next = String(mx + 1).padStart(blk, '0');
  return (prefix + next).padEnd(window.COA_CODE_LEN, '0').slice(0, window.COA_CODE_LEN);
}
function coaSuggestRoot(list) {
  const used = new Set(list.map(n => n.code[0]));
  for (let i = 1; i <= 9; i++) if (!used.has(String(i))) return String(i) + '00000';
  return '';
}

// ─── ค้นหา: กรองต้นไม้ + คืน id ที่ต้องกางออก ───────────────────────
function coaMatch(n, q) {
  return n.code.includes(q) || n.name.toLowerCase().includes(q) || (n.en || '').toLowerCase().includes(q);
}
function coaFilter(list, q) {
  const out = []; const ids = new Set();
  for (const n of list) {
    const sub = coaFilter(n.children || [], q);
    if (coaMatch(n, q) || sub.list.length) {
      out.push({ ...n, children: sub.list });
      ids.add(n.id);
      sub.ids.forEach(i => ids.add(i));
    }
  }
  return { list: out, ids };
}

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function CoaNodeModal({ mode, parent, level, allCodes, draft0, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [code, setCode] = useState(isEdit ? draft0.code : '');
  const [name, setName] = useState(isEdit ? draft0.name : '');
  const [en, setEn]     = useState(isEdit ? (draft0.en || '') : '');
  const [kind, setKind] = useState(isEdit ? draft0.kind : 'posting');
  const [enabled, setEnabled] = useState(isEdit ? !!draft0.enabled : true);
  const [note, setNote] = useState(isEdit ? (draft0.note || '') : '');
  const [auto, setAuto] = useState(!isEdit);
  const [error, setError] = useState('');

  const suggested = React.useMemo(() => {
    if (isEdit) return '';
    return level === 1 ? coaSuggestRoot(window.__coaListRef || []) : (parent ? coaSuggestChild(parent) : '');
  }, [isEdit, level, parent]);
  useEffect(() => { if (auto && !isEdit) setCode(suggested); }, [auto, suggested, isEdit]);

  const catType = window.coaCatType(code || (parent ? parent.code : '1'));
  const titleMap = {
    'add-root': 'เพิ่มหมวดบัญชีหลัก (ระดับ 1)',
    'add-child': `เพิ่มบัญชีย่อย (ระดับ ${level})`,
    'insert': `แทรกบัญชีระดับเดียวกัน (ระดับ ${level})`,
    'edit': 'แก้ไขบัญชี',
  };

  const submit = (e) => {
    e.preventDefault();
    const c = String(code).trim();
    if (!c) { setError('กรุณาระบุรหัสบัญชี'); return; }
    if (!/^\d+$/.test(c)) { setError('รหัสบัญชีต้องเป็นตัวเลขเท่านั้น'); return; }
    if (c.length !== window.COA_CODE_LEN) { setError(`รหัสบัญชีต้องมี ${window.COA_CODE_LEN} หลัก`); return; }
    const dup = (allCodes || []).some(x => x === c) && (!isEdit || c !== draft0.code);
    if (dup) { setError(`รหัสบัญชี “${c}” มีอยู่แล้วในผังบัญชี`); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อบัญชี'); return; }
    onSubmit({ code: c, name: name.trim(), en: en.trim(), kind, enabled, note: note.trim() });
  };

  const parentLabel = level === 1 ? 'ไม่มี — เป็นหมวดบัญชีสูงสุด'
    : (parent ? `${parent.code} · ${parent.name}` : '—');

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true"
           style={{ width: 560, maxWidth: '94vw', top: 'calc(50% + 32px)', maxHeight: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{titleMap[mode]}</h2>
            <div className="muted" style={{ fontSize: 11 }}>บัญชีระดับเหนือกว่า: {parentLabel}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }} onSubmit={submit}>
          <div className="bud-form-grid">
            {/* รหัสบัญชี */}
            <div className="bud-fld">
              <label className="lt-modal-label">รหัสบัญชี ({window.COA_CODE_LEN} หลัก) <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} disabled={isEdit || auto}
                     maxLength={window.COA_CODE_LEN} placeholder="เช่น 110101"
                     onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} />
              {!isEdit && (
                <label className="bud-auto-toggle">
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
                  ใช้รหัสที่ระบบแนะนำ {auto && suggested && <span className="mono bud-auto-hint">→ {suggested}</span>}
                </label>
              )}
              {isEdit && <div className="bud-fld-hint">แก้ไขรหัสบัญชีได้ — ระบบตรวจสอบไม่ให้ซ้ำกับบัญชีอื่น</div>}
            </div>

            {/* ประเภทบัญชี */}
            <div className="bud-fld">
              <label className="lt-modal-label">ประเภทบัญชี</label>
              <select className="filter-select" style={{ width: '100%' }} value={kind}
                      onChange={(e) => setKind(e.target.value)}>
                {window.COA_OPTS.kind.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <div className="bud-fld-hint">
                {kind === 'control' ? 'บัญชีคุม — เป็นหัวบัญชี ไม่ลงรายการโดยตรง' : 'บัญชีย่อย — ลงรายการบัญชีได้'}
              </div>
            </div>

            {/* ชื่อบัญชี */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus
                     placeholder="เช่น เงินสด, ลูกหนี้เงินกู้สามัญ, ดอกเบี้ยรับเงินให้กู้"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            {/* ชื่ออังกฤษ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อภาษาอังกฤษ <span className="muted" style={{ fontWeight: 400 }}>(ไม่บังคับ)</span></label>
              <input className="cfg-input" value={en} placeholder="เช่น Cash, Loans Receivable"
                     onChange={(e) => setEn(e.target.value)} />
            </div>

            {/* หมวดบัญชี (อ่านอย่างเดียว — อิงรหัส) + สถานะ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมวดบัญชี <span className="bud-key-tag">อิงรหัส</span></label>
              <div className="coa-cat-readonly">
                <span className={"ac-type-chip " + window.acctCatTypeTone(catType)}>
                  <span className="ac-type-dot" />{window.acctCatLabel('type', catType)}
                </span>
                <span className="muted" style={{ fontSize: 11 }}>หลักแรกของรหัส = {String(code || (parent ? parent.code : '1'))[0]}</span>
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ</label>
              <input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกบัญชี'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Delete confirm
// ════════════════════════════════════════════════════════════════════
function CoaDeleteModal({ node, onClose, onConfirm }) {
  const childCount = (() => { let c = 0; const w = (ns) => ns.forEach(n => { c++; w(n.children || []); }); w(node.children || []); return c; })();
  return (
    <window.DepStatusDialog tone="danger" title="ยืนยันการลบบัญชี" desc={<>ต้องการลบ “<span className="mono">{node.code}</span> · {node.name}” ใช่หรือไม่?</>}
      okLabel="ลบ" onOk={onConfirm} onClose={onClose}>
      {childCount > 0 && <div className="sr-warn" style={{ margin: 0, fontSize: 12.5 }}><Icon name="info" size={13} /> บัญชีนี้มีบัญชีย่อยอีก {childCount} รายการ ซึ่งจะถูกลบไปพร้อมกัน</div>}
    </window.DepStatusDialog>
  );
}


// ════════════════════════════════════════════════════════════════════
//  Tree row (recursive)
// ════════════════════════════════════════════════════════════════════
function CoaRow({ node, level, expanded, forceOpen, q, onToggle, onAct, onToggleEnabled }) {
  const kids = node.children || [];
  const hasKids = kids.length > 0;
  const isOpen = forceOpen || expanded.has(node.id);
  const isControl = hasKids || node.kind === 'control';
  const catType = window.coaCatType(node.code);

  const hi = (text) => {
    if (!q) return text;
    const i = String(text).toLowerCase().indexOf(q);
    if (i < 0) return text;
    return (<>{String(text).slice(0, i)}<mark className="coa-hi">{String(text).slice(i, i + q.length)}</mark>{String(text).slice(i + q.length)}</>);
  };

  return (
    <>
      <tr className={"bud-row coa-row lvl" + level + (node.enabled ? '' : ' is-off')}
          style={node.enabled ? null : { opacity: .55, background: '#FAFAFA' }}>
        <td className="bud-name-cell">
          <div className="bud-name-wrap" style={{ paddingLeft: (level - 1) * 22 }}>
            {hasKids ? (
              <button className={"bud-caret" + (isOpen ? ' open' : '')} onClick={() => onToggle(node.id)}
                      aria-label={isOpen ? 'ยุบ' : 'ขยาย'}><Icon name="chevRight" size={13} /></button>
            ) : (<span className="bud-caret leaf" />)}
            <span className={"bud-lvl-badge l" + Math.min(level, 3)}>{level}</span>
            <span className="bud-code mono">{hi(node.code)}</span>
            <span className="bud-name">{hi(node.name)}</span>
            {node.en && <span className="coa-en">{node.en}</span>}
            <span className={"pill " + (isControl ? 'info' : 'neutral')}>{isControl ? 'บัญชีคุม' : 'ลงรายการ'}</span>
            {node.note && <span className="bud-note-ico" title={node.note}><Icon name="info" size={12} /></span>}
          </div>
        </td>
        <td>
          <span className={"ac-type-chip " + window.acctCatTypeTone(catType)}>
            <span className="ac-type-dot" />{window.acctCatLabel('type', catType)}
          </span>
        </td>
        <td className="center">
          <button className={"ac-switch" + (node.enabled ? ' on' : '')} onClick={() => onToggleEnabled(node)}
                  title={node.enabled ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'} aria-pressed={node.enabled}>
            <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
          </button>
        </td>
        <td className="center">
          <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'center' }}>
            {level < window.COA_MAX_LEVEL && (
              <button className="btn sm ex-row-btn add" title="เพิ่มบัญชีย่อย" onClick={() => onAct('add-child', node, level + 1)}>
                <Icon name="plus" size={13} /> บัญชีย่อย
              </button>
            )}
            <button className="btn sm ex-row-btn" onClick={() => onAct('edit', node, level)}>
              <Icon name="edit" size={13} /> แก้ไข
            </button>
            <button className="btn sm ex-row-btn del" title="ลบบัญชี" onClick={() => onAct('delete', node, level)}>
              <Icon name="trash" size={13} /> ลบ
            </button>
          </div>
        </td>
      </tr>
      {hasKids && isOpen && kids.map(c => (
        <CoaRow key={c.id} node={c} level={level + 1} expanded={expanded} forceOpen={forceOpen}
                q={q} onToggle={onToggle} onAct={onAct} onToggleEnabled={onToggleEnabled} />
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function ChartOfAccountsPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [year, setYear] = useState(window.COA_CURRENT_YEAR);
  const [list, setList] = useState(() => coaLoad(window.COA_CURRENT_YEAR));
  const [query, setQuery] = useState('');
  const [qIn, setQIn] = useState('');
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState(() => {
    const s = new Set();
    const walk = (ns, lvl) => ns.forEach(n => { if (lvl <= 2) { s.add(n.id); walk(n.children || [], lvl + 1); } });
    walk(coaLoad(window.COA_CURRENT_YEAR), 1);
    return s;
  });

  window.__coaListRef = list;
  const persist = (next) => { setList(next); coaSave(year, next); };

  const switchYear = (y) => {
    setYear(y);
    const data = coaLoad(y);
    setList(data);
    const s = new Set();
    const walk = (ns, lvl) => ns.forEach(n => { if (lvl <= 2) { s.add(n.id); walk(n.children || [], lvl + 1); } });
    walk(data, 1); setExpanded(s);
    setQuery(''); setQIn('');
  };

  const copyFromYear = (srcYear) => {
    const src = coaClone(coaLoad(srcYear));
    persist(src);
    const s = new Set();
    const walk = (ns, lvl) => ns.forEach(n => { if (lvl <= 2) { s.add(n.id); walk(n.children || [], lvl + 1); } });
    walk(src, 1); setExpanded(s);
    audit.log({ action: 'create', module: 'บัญชี — ค่าคงที่ผังบัญชี',
      target: `ปีงบประมาณ ${year}`, summary: `คัดลอกผังบัญชีจากปี ${srcYear} มาเป็นปี ${year}` });
    onToast && onToast(`คัดลอกผังบัญชีจากปี ${srcYear} มาเป็นปี ${year} เรียบร้อยแล้ว`);
  };

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(() => q ? coaFilter(list, q) : { list, ids: null }, [list, q]);
  const stats = React.useMemo(() => coaStats(list), [list]);

  const toggle = (id) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allParentIds = () => { const s = new Set(); const w = (ns) => ns.forEach(n => { if (n.children && n.children.length) { s.add(n.id); w(n.children); } }); w(list); return s; };
  const expandAll = () => setExpanded(allParentIds());
  const collapseAll = () => setExpanded(new Set());

  const handleAct = (mode, node, level) => setModal({ mode, node, level });

  const confirmDelete = () => {
    const n = modal.node;
    persist(coaRemove(list, n.id));
    audit.log({ action: 'delete', module: 'บัญชี — ค่าคงที่ผังบัญชี',
      target: `${n.code} · ${n.name}`, summary: `ลบบัญชี “${n.name}” (ปี ${year})`,
      changes: [{ field: 'รหัสบัญชี', before: n.code, after: '—' }] });
    onToast && onToast(`ลบบัญชี “${n.name}” เรียบร้อยแล้ว`);
    setModal(null);
  };

  const [askOff, setAskOff] = useState(null);
  const requestToggle = (n) => window.depConfirmOff
    ? window.depConfirmOff(n.enabled, n.code + ' · ' + n.name, () => toggleEnabled(n), 'บัญชีนี้จะไม่แสดงเป็นตัวเลือกตอนลงรายการบัญชี', 'ปิดการใช้งานบัญชี')
    : (n.enabled ? setAskOff(n) : toggleEnabled(n));
  const toggleEnabled = (n) => {
    setAskOff(null);
    persist(coaUpdate(list, n.id, { enabled: !n.enabled }));
    audit.log({ action: 'update', module: 'บัญชี — ค่าคงที่ผังบัญชี',
      target: `${n.code} · ${n.name}`,
      summary: `${n.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}บัญชี “${n.name}” (ปี ${year})`,
      changes: [{ field: 'สถานะใช้งาน', before: n.enabled ? 'Active' : 'Inactive', after: n.enabled ? 'Inactive' : 'Active' }] });
    onToast && onToast(`${n.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}บัญชี “${n.name}” แล้ว`);
  };

  const submitNode = (vals) => {
    const { mode, node } = modal;
    if (mode === 'edit') {
      persist(coaUpdate(list, node.id, vals));
      audit.log({ action: 'update', module: 'บัญชี — ค่าคงที่ผังบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขบัญชี “${vals.name}” (ปี ${year})`,
        changes: [
          ...(node.code !== vals.code ? [{ field: 'รหัสบัญชี', before: node.code, after: vals.code }] : []),
          ...(node.name !== vals.name ? [{ field: 'ชื่อบัญชี', before: node.name, after: vals.name }] : []),
        ] });
      onToast && onToast(`บันทึกการแก้ไข “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      const newNode = { id: coaUid(), ...vals, children: [] };
      if (mode === 'add-root') persist([...list, newNode]);
      else if (mode === 'add-child') { persist(coaAddChild(list, node.id, newNode)); setExpanded(s => new Set(s).add(node.id)); }
      else if (mode === 'insert') persist(coaInsertAfter(list, node.id, newNode));
      audit.log({ action: 'create', module: 'บัญชี — ค่าคงที่ผังบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มบัญชี “${vals.name}” (ปี ${year})`,
        changes: [{ field: 'รหัสบัญชี', before: '—', after: vals.code }] });
      onToast && onToast(`เพิ่มบัญชี “${vals.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const resetSeed = () => {
    if (Number(year) !== window.COA_CURRENT_YEAR) { onToast && onToast('คืนค่าตั้งต้นทำได้เฉพาะปีงบประมาณปัจจุบัน'); return; }
    const fresh = coaClone(window.COA_SEED);
    persist(fresh);
    onToast && onToast('คืนค่าผังบัญชีตั้งต้นเรียบร้อยแล้ว');
  };

  const modalParent = modal && (modal.mode === 'add-child' ? modal.node
    : (modal.mode === 'insert' || modal.mode === 'edit') ? (coaFind(list, modal.node.id)?.parent || null) : null);
  const modalLevel = modal ? modal.level : 1;

  const otherYearsWithData = window.COA_FISCAL_YEARS.filter(y => y !== year && coaYearHasData(y));

  return (
    <div data-screen-label="หน้าค่าคงที่ผังบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ผังบัญชี (Chart of Accounts)</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            จัดการผังบัญชีแบบต้นไม้ รองรับ {stats.maxLevel >= 5 ? stats.maxLevel : '5'}+ ระดับ · รหัสบัญชี {window.COA_CODE_LEN} หลัก · บัญชีคุม/บัญชีย่อย · แก้ไขแยกตามปีงบประมาณ
          </div>
        </div>
        <span className="spacer" />
        <div className="coa-year">
          <span className="coa-year-lbl">ปีงบประมาณ</span>
          <select className="filter-select" value={year} onChange={(e) => switchYear(Number(e.target.value))}>
            {window.COA_FISCAL_YEARS.map(y => (
              <option key={y} value={y}>{y}{coaYearHasData(y) ? '' : ' (ว่าง)'}</option>
            ))}
          </select>
        </div>
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add-root', node: null, level: 1 })}>
          <Icon name="plus" /> เพิ่มหมวดบัญชีหลัก
        </button>
      </div>

      {list.length === 0 ? (
        <div className="search-card coa-empty">
          <div className="coa-empty-ico"><Icon name="report" size={26} /></div>
          <div className="coa-empty-title">ยังไม่มีผังบัญชีสำหรับปีงบประมาณ {year}</div>
          <div className="muted" style={{ fontSize: 12.5, maxWidth: 480, textAlign: 'center' }}>
            เริ่มต้นด้วยการคัดลอกผังบัญชีจากปีก่อนหน้า แล้วปรับแก้ตามปีงบประมาณนี้ หรือเพิ่มหมวดบัญชีหลักใหม่เอง
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {otherYearsWithData.map(y => (
              <button key={y} className="btn sm" onClick={() => copyFromYear(y)}>
                <Icon name="download" /> คัดลอกจากปี {y}
              </button>
            ))}
            <button className="btn primary sm" onClick={() => setModal({ mode: 'add-root', node: null, level: 1 })}>
              <Icon name="plus" /> เพิ่มหมวดบัญชีหลัก
            </button>
          </div>
        </div>
      ) : (
        <div className="search-card fbt-card">
          <div className="toolbar" style={{ flexWrap: 'wrap', padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
            <div className="search coa-search" style={{ flex: '1 1 300px', height: 32 }}>
              <Icon name="search" size={14} />
              <input type="text" value={qIn} placeholder="ค้นหารหัสบัญชี หรือชื่อบัญชี"
                     onChange={(e) => setQIn(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') setQuery(qIn); }} />
            </div>
            <button className="btn primary pa-tb-btn" onClick={() => setQuery(qIn)}>ค้นหา</button>
            <button className="btn pa-tb-btn" onClick={() => { setQIn(''); setQuery(''); }}>รีเซ็ต</button>
            {q && <span className="muted" style={{ fontSize: 11.5 }}>พบ {filtered.ids ? filtered.ids.size : 0} บัญชีที่ตรงกับ “{query}”</span>}
            <button className="btn ghost" style={COA_BTN} onClick={expandAll}>ขยายทั้งหมด</button>
            <button className="btn ghost" style={COA_BTN} onClick={collapseAll}>ยุบทั้งหมด</button>
          </div>

          <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
            <table className="tbl bud-tbl coa-tbl" style={{ width: '100%', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 0 }}>รหัส / ชื่อบัญชี</th>
                  <th style={{ width: 96 }}>หมวดบัญชี</th>
                  <th className="center" style={{ width: 88 }}>สถานะ</th>
                  <th className="center" style={{ width: 280 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {q && filtered.list.length === 0 && (
                  <tr><td colSpan={4} className="center muted" style={{ padding: '32px 12px' }}>
                    ไม่พบบัญชีที่ตรงกับ “{query}”
                  </td></tr>
                )}
                {filtered.list.map(n => (
                  <CoaRow key={n.id} node={n} level={1} expanded={expanded} forceOpen={!!q} q={q}
                          onToggle={toggle} onAct={handleAct} onToggleEnabled={requestToggle} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ผังบัญชีนี้เป็นค่าคงที่ของระบบบัญชี ปี {year} — เลื่อนเมาส์ที่แถวเพื่อ เพิ่มบัญชีย่อย · แทรก · แก้ไข · ลบ
        <span className="spacer" />
        {Number(year) === window.COA_CURRENT_YEAR &&
          <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>}
      </div>

      {askOff && window.DepConfirmModal && (
        <window.DepConfirmModal tone="danger" title="ยืนยันการปิดใช้งานบัญชี"
          lines={[['รหัสบัญชี', askOff.code], ['ชื่อบัญชี', askOff.name], ['ผลกระทบ', 'จะไม่แสดงเป็นตัวเลือกในการลงรายการบัญชี']]}
          okLabel="ยืนยันปิดใช้งาน" onOk={() => toggleEnabled(askOff)} onClose={() => setAskOff(null)} />
      )}
      {modal && modal.mode === 'delete' && (
        <CoaDeleteModal node={modal.node} onClose={() => setModal(null)} onConfirm={confirmDelete} />
      )}
      {modal && modal.mode !== 'delete' && (
        <CoaNodeModal mode={modal.mode} parent={modalParent} level={modalLevel}
                      allCodes={coaAllCodes(list)}
                      draft0={modal.mode === 'edit' ? modal.node : null}
                      onClose={() => setModal(null)} onSubmit={submitNode} />
      )}
    </div>
  );
}

window.coaLoadTree = coaLoad;
Object.assign(window, { ChartOfAccountsPage });
