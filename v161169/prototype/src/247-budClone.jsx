// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — กำหนดโครงสร้างงบประมาณ
//  ผังต้นไม้ 3 ระดับ · เพิ่ม / แทรก / แก้ไข / ลบ · ผูกรหัสผังบัญชี (GL)
//  รวมยอดจากหมวดย่อยขึ้นหมวดใหญ่อัตโนมัติ — ใช้เป็นค่าคงที่งบประมาณประจำปี
// ════════════════════════════════════════════════════════════════════

// ─── localStorage ───────────────────────────────────────────────────
function budClone(list) {
  return (list || []).map(n => ({ ...n, children: budClone(n.children) }));
}
function budLoad() {
  try {
    const saved = localStorage.getItem('budget_structure_v2');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return budClone(window.BUDGET_SEED);
}
function budSave(list) {
  try { localStorage.setItem('budget_structure_v2', JSON.stringify(list)); } catch (e) {}
}
function budCfgLoad() {
  try {
    const s = localStorage.getItem('budget_codecfg');
    if (s) return { ...window.BUD_CODECFG_DEFAULT, ...JSON.parse(s) };
  } catch (e) {}
  return { ...window.BUD_CODECFG_DEFAULT };
}
function budCfgSave(cfg) {
  try { localStorage.setItem('budget_codecfg', JSON.stringify(cfg)); } catch (e) {}
}

// ─── tree helpers ───────────────────────────────────────────────────
let _budSeq = 0;
const budUid = () => 'BN-' + Date.now().toString(36) + '-' + (++_budSeq);

function budRemove(list, id) {
  return list.filter(n => n.id !== id).map(n => ({ ...n, children: budRemove(n.children || [], id) }));
}
function budUpdate(list, id, patch) {
  return list.map(n => n.id === id
    ? { ...n, ...patch }
    : { ...n, children: budUpdate(n.children || [], id, patch) });
}
function budAddChild(list, parentId, child) {
  return list.map(n => n.id === parentId
    ? { ...n, children: [...(n.children || []), child] }
    : { ...n, children: budAddChild(n.children || [], parentId, child) });
}
function budInsertAfter(list, siblingId, node) {
  const idx = list.findIndex(n => n.id === siblingId);
  if (idx >= 0) { const c = [...list]; c.splice(idx + 1, 0, node); return c; }
  return list.map(n => ({ ...n, children: budInsertAfter(n.children || [], siblingId, node) }));
}
function budFind(list, id, parent = null, level = 1) {
  for (const n of list) {
    if (n.id === id) return { node: n, parent, level };
    const r = budFind(n.children || [], id, n, level + 1);
    if (r) return r;
  }
  return null;
}
function budCountLeaves(list) {
  let c = 0;
  const walk = (ns) => ns.forEach(n => (n.children && n.children.length) ? walk(n.children) : c++);
  walk(list);
  return c;
}

// ─── auto-code generation ───────────────────────────────────────────
function budNextRootCode(list, cfg) {
  const nums = list.map(n => parseInt(n.code, 10)).filter(x => !isNaN(x));
  const mx = nums.length ? Math.max(...nums) : 0;
  return String(mx + 1).padStart(cfg.rootLen, '0');
}
function budNextChildCode(parent, cfg, childLevel) {
  const append = childLevel === 2 ? cfg.lvl2Append : cfg.lvl3Append;
  const sibs = parent.children || [];
  let mx = 0;
  sibs.forEach(s => {
    const tail = String(s.code).slice(String(parent.code).length).replace(/\D/g, '');
    const n = parseInt(tail, 10);
    if (!isNaN(n) && n > mx) mx = n;
  });
  return String(parent.code) + (cfg.separator || '') + String(mx + 1).padStart(append, '0');
}

// ════════════════════════════════════════════════════════════════════
//  Node editor modal — add-root / add-child / insert / edit
// ════════════════════════════════════════════════════════════════════
function BudgetNodeModal({ mode, parent, level, cfg, draft0, onClose, onSubmit }) {
  const isEdit = mode === 'edit';

  const [code, setCode]   = useState(isEdit ? draft0.code : '');
  const [auto, setAuto]   = useState(isEdit ? false : !!cfg.auto);
  const [name, setName]   = useState(isEdit ? draft0.name : '');
  const [type, setType]   = useState(isEdit ? draft0.type : (parent ? parent.type : 'operating'));
  const [nature, setNat]  = useState(isEdit ? draft0.nature : (parent ? parent.nature : 'expense'));
  const [gl, setGl]       = useState(isEdit ? (draft0.gl || '') : '');
  const [note, setNote]   = useState(isEdit ? (draft0.note || '') : '');
  const [enabled, setEn]  = useState(isEdit ? !!draft0.enabled : true);
  const [error, setError] = useState('');

  // รหัสที่ระบบเสนอให้ (auto)
  const suggested = React.useMemo(() => {
    if (level === 1) return budNextRootCode(window.__budListRef || [], cfg);
    if (parent) return budNextChildCode(parent, cfg, level);
    return '';
  }, [level, parent, cfg]);

  useEffect(() => { if (auto && !isEdit) setCode(suggested); }, [auto, suggested, isEdit]);

  const glGroups = React.useMemo(() => {
    // ดึงบัญชีจากค่าคงที่ "ผังบัญชี" (data-coa.js) จัดกลุ่มตามหมวดบัญชี
    const by = {};
    (window.coaFlatAccounts ? window.coaFlatAccounts() : []).forEach(a => {
      const label = window.acctCatLabel('type', a.catType);
      (by[label] = by[label] || []).push(a);
    });
    Object.keys(by).forEach(k => by[k].sort((x, y) => x.code.localeCompare(y.code)));
    const order = (window.ACCT_CAT_OPTS && window.ACCT_CAT_OPTS.type ? window.ACCT_CAT_OPTS.type : []).map(o => window.acctCatLabel('type', o.v));
    const ordered = {};
    order.forEach(lbl => { if (by[lbl]) ordered[lbl] = by[lbl]; });
    Object.keys(by).forEach(lbl => { if (!ordered[lbl]) ordered[lbl] = by[lbl]; });
    return ordered;
  }, []);

  const titleMap = {
    'add-root': 'เพิ่มหมวดงบประมาณหลัก (ระดับ 1)',
    'add-child': `เพิ่มหมวดย่อย (ระดับ ${level})`,
    'insert': `แทรกหมวดระดับเดียวกัน (ระดับ ${level})`,
    'edit': 'แก้ไขหมวดงบประมาณ',
  };

  const submit = (e) => {
    e.preventDefault();
    if (!String(code).trim()) { setError('กรุณาระบุรหัสหมวดงบประมาณ'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อหมวดงบประมาณ'); return; }
    onSubmit({
      code: String(code).trim(),
      name: name.trim(),
      type, nature,
      gl: gl || null,
      note: note.trim(),
      enabled,
    });
  };

  const parentLabel = level === 1
    ? 'ไม่มี — เป็นหมวดหลักสูงสุด'
    : (parent ? `${parent.code} · ${parent.name}` : '—');

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{titleMap[mode]}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              หมวดระดับเหนือกว่า: {parentLabel}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {/* รหัส */}
            <div className="bud-fld">
              <label className="lt-modal-label">รหัสหมวดงบประมาณ <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} disabled={isEdit || auto}
                     placeholder="เช่น 5101"
                     onChange={(e) => { setCode(e.target.value); setError(''); }} />
              {!isEdit && (
                <label className="bud-auto-toggle">
                  <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
                  ใช้รูปแบบรหัสอัตโนมัติ {auto && <span className="mono bud-auto-hint">→ {suggested}</span>}
                </label>
              )}
            </div>

            {/* สถานะ */}
            <div className="bud-fld">
              <label className="lt-modal-label">สถานะการใช้งาน</label>
              <select className="filter-select" style={{ width: '100%' }} value={enabled ? '1' : '0'}
                      onChange={(e) => setEn(e.target.value === '1')}>
                <option value="1">ใช้งานอยู่</option>
                <option value="0">ปิดใช้งาน</option>
              </select>
            </div>

            {/* ชื่อ — เต็มแถว */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อหมวดงบประมาณ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus
                     placeholder="เช่น ค่าใช้จ่ายพนักงาน, งบลงทุนไอที, สวัสดิการสมาชิก"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            {/* ประเภทงบประมาณ */}
            <div className="bud-fld">
              <label className="lt-modal-label">ประเภทงบประมาณ</label>
              <select className="filter-select" style={{ width: '100%' }} value={type}
                      onChange={(e) => setType(e.target.value)}>
                {window.BUD_OPTS.type.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            {/* ลักษณะรายการ */}
            <div className="bud-fld">
              <label className="lt-modal-label">ลักษณะรายการ</label>
              <select className="filter-select" style={{ width: '100%' }} value={nature}
                      onChange={(e) => setNat(e.target.value)}>
                {window.BUD_OPTS.nature.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            {/* GL Account Mapping — เต็มแถว, เน้น */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">
                รหัสผังบัญชีที่ผูกพัน (GL Account Mapping)
                <span className="bud-key-tag">สำคัญ</span>
              </label>
              <select className="filter-select bud-gl-select" style={{ width: '100%' }} value={gl}
                      onChange={(e) => setGl(e.target.value)}>
                <option value="">— ยังไม่ผูกผังบัญชี —</option>
                {Object.keys(glGroups).map(cls => (
                  <optgroup key={cls} label={cls}>
                    {glGroups[cls].map(a => (
                      <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="bud-fld-hint">
                ผูกหมวดงบประมาณกับรหัสผังบัญชี เพื่อให้เวลาเบิกจ่าย ระบบบัญชีและระบบงบประมาณตัดยอดตรงกัน
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ</label>
              <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกหมวดงบประมาณ'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Code-format config modal — รูปแบบรหัสอัตโนมัติ
// ════════════════════════════════════════════════════════════════════
function BudgetCodeCfgModal({ cfg, onClose, onSave }) {
  const [d, setD] = useState({ ...cfg });
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const sep = d.separator || '';
  const sample1 = String(5).padStart(d.rootLen, '0');
  const sample2 = sample1 + sep + String(1).padStart(d.lvl2Append, '0');
  const sample3 = sample2 + sep + String(1).padStart(d.lvl3Append, '0');

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="cog" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ตั้งค่ารูปแบบรหัสอัตโนมัติ</h2>
            <div className="muted" style={{ fontSize: 11 }}>ระบบจะสร้างรหัสหมวดให้ตามลำดับชั้นที่กำหนด</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <label className="bud-auto-toggle" style={{ marginTop: 0, marginBottom: 12 }}>
            <input type="checkbox" checked={!!d.auto} onChange={(e) => set('auto', e.target.checked)} />
            เปิดใช้การสร้างรหัสอัตโนมัติเมื่อเพิ่มหมวดใหม่
          </label>

          <div className="bud-form-grid">
            <div className="bud-fld">
              <label className="lt-modal-label">จำนวนหลักระดับ 1</label>
              <input className="cfg-input mono" type="number" min="1" max="4" value={d.rootLen}
                     onChange={(e) => set('rootLen', Math.max(1, Number(e.target.value || 1)))} />
            </div>
            <div className="bud-fld">
              <label className="lt-modal-label">ตัวคั่นระหว่างระดับ</label>
              <select className="filter-select" style={{ width: '100%' }} value={d.separator}
                      onChange={(e) => set('separator', e.target.value)}>
                <option value="">ไม่มี (5101)</option>
                <option value="-">ขีดกลาง (5-1-01)</option>
                <option value=".">จุด (5.1.01)</option>
              </select>
            </div>
            <div className="bud-fld">
              <label className="lt-modal-label">หลักต่อท้ายระดับ 2</label>
              <input className="cfg-input mono" type="number" min="1" max="4" value={d.lvl2Append}
                     onChange={(e) => set('lvl2Append', Math.max(1, Number(e.target.value || 1)))} />
            </div>
            <div className="bud-fld">
              <label className="lt-modal-label">หลักต่อท้ายระดับ 3</label>
              <input className="cfg-input mono" type="number" min="1" max="4" value={d.lvl3Append}
                     onChange={(e) => set('lvl3Append', Math.max(1, Number(e.target.value || 1)))} />
            </div>
          </div>

          <div className="bud-sample">
            <div className="bud-sample-t">ตัวอย่างรหัสที่สร้าง</div>
            <div className="bud-sample-row">
              <span className="bud-lvl-badge l1">ระดับ 1</span><span className="mono">{sample1}</span>
              <span className="bud-sample-arrow">→</span>
              <span className="bud-lvl-badge l2">ระดับ 2</span><span className="mono">{sample2}</span>
              <span className="bud-sample-arrow">→</span>
              <span className="bud-lvl-badge l3">ระดับ 3</span><span className="mono">{sample3}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="button" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => onSave(d)}>
              <Icon name="check" /> บันทึกรูปแบบรหัส
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Delete confirm modal
// ════════════════════════════════════════════════════════════════════
function BudgetDeleteModal({ node, onClose, onConfirm }) {
  const childCount = (() => { let c = 0; const w = (ns) => ns.forEach(n => { c++; w(n.children || []); }); w(node.children || []); return c; })();
  return (
    <window.DepStatusDialog tone="danger" title="ยืนยันการลบหมวดงบประมาณ" desc={<>ต้องการลบ “<span className="mono">{node.code}</span> · {node.name}” ใช่หรือไม่?</>}
      okLabel="ลบ" onOk={onConfirm} onClose={onClose}>
      {childCount > 0 && <div className="sr-warn" style={{ margin: 0, fontSize: 12.5 }}><Icon name="info" size={13} /> หมวดนี้มีหมวดย่อยอีก {childCount} รายการ ซึ่งจะถูกลบไปพร้อมกัน</div>}
    </window.DepStatusDialog>
  );
}


// ════════════════════════════════════════════════════════════════════
//  Tree row (recursive)
// ════════════════════════════════════════════════════════════════════
const BUD_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';
const BUD_INSERT_BELOW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">' + '<path d="M6 3.5v10.5a2 2 0 0 0 2 2h10" /><path d="M14 12l4 4-4 4" />' + '</svg>';

if (!document.getElementById('bud-tbl-style')) {
  const st = document.createElement('style');
  st.id = 'bud-tbl-style';
  st.textContent = '.bud-tbl .bud-acts { opacity: 1 !important; }'
    + '.bud-tbl .bud-act { border: 0 !important; background: transparent !important; color: var(--text-body, rgba(0,0,0,.65)); }'
    + '.bud-tbl .bud-act:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--primary) !important; }'
    + '.bud-tbl .bud-act.danger:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--danger) !important; }'
    + '.bud-tbl .bud-act-cell { text-align: center; }'
    + '.bud-tbl .bud-acts { display: inline-flex; justify-content: flex-start; width: 108px; }';
  document.head.appendChild(st);
}

function BudgetRow({ node, level, expanded, onToggle, onAct }) {
  const kids = node.children || [];
  const hasKids = kids.length > 0;
  const glName = node.gl ? window.glLabel(node.gl) : null;
  const isOpen = expanded.has(node.id);

  return (
    <>
      <tr className={"bud-row lvl" + level + (node.enabled ? '' : ' is-off')}>
        <td className="bud-name-cell">
          <div className="bud-name-wrap" style={{ paddingLeft: (level - 1) * 22 }}>
            {hasKids ? (
              <button className={"bud-caret" + (isOpen ? ' open' : '')} onClick={() => onToggle(node.id)}
                      aria-label={isOpen ? 'ยุบ' : 'ขยาย'}>
                <Icon name="chevRight" size={13} />
              </button>
            ) : (
              <span className="bud-caret leaf" />
            )}
            <span className={"bud-lvl-badge l" + level}>{level}</span>
            <span className="bud-code mono">{node.code}</span>
            <span className="bud-name">{node.name}</span>
            {!node.enabled && <span className="pill neutral">ปิดใช้งาน</span>}
            {node.note && <span className="bud-note-ico" title={node.note}><Icon name="info" size={12} /></span>}
          </div>
        </td>
        <td className="center">
          <span className={"chip " + (node.type === 'capital' ? 'info' : 'primary')} style={{ height: 20 }}>
            {window.budLabel('type', node.type)}
          </span>
        </td>
        <td className="center">
          <span className={"bud-nat " + node.nature}>{window.budLabel('nature', node.nature)}</span>
        </td>
        <td className="bud-gl-cell">
          {node.gl
            ? <span><span className="mono bud-code">{node.gl}</span> <span className="bud-gl-name">{glName}</span></span>
            : <span className="bud-unmapped"><Icon name="info" size={11} /> ยังไม่ผูกผังบัญชี</span>}
        </td>
        <td className="bud-act-cell">
          <div className="bud-acts">
            {level < 3 && (
              <button className="bud-act" title="เพิ่มหมวดย่อย" onClick={() => onAct('add-child', node, level + 1)}>
                <Icon name="plus" size={13} />
              </button>
            )}
            <button className="bud-act" title="แทรกหมวดระดับเดียวกัน" onClick={() => onAct('insert', node, level)}
                    dangerouslySetInnerHTML={{ __html: BUD_INSERT_BELOW }} />
            <button className="bud-act" title="แก้ไข" onClick={() => onAct('edit', node, level)}>
              <Icon name="edit" size={13} />
            </button>
            <button className="bud-act danger" title="ลบ" onClick={() => onAct('delete', node, level)}
                    dangerouslySetInnerHTML={{ __html: BUD_TRASH }} />
          </div>
        </td>
      </tr>
      {hasKids && isOpen && kids.map(c => (
        <BudgetRow key={c.id} node={c} level={level + 1} expanded={expanded}
                   onToggle={onToggle} onAct={onAct} />
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function BudgetStructureConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(budLoad);
  const [cfg, setCfg] = useState(budCfgLoad);
  const [expanded, setExpanded] = useState(() => {
    // เปิดระดับ 1 + 2 ไว้ตั้งต้น
    const s = new Set();
    const walk = (ns, lvl) => ns.forEach(n => { if (lvl <= 2) { s.add(n.id); walk(n.children || [], lvl + 1); } });
    walk(budLoad(), 1);
    return s;
  });
  const [modal, setModal] = useState(null);   // {mode, node, level}
  const [cfgOpen, setCfgOpen] = useState(false);

  // ให้ modal เข้าถึง list ปัจจุบันได้สำหรับสร้างรหัสระดับ 1
  window.__budListRef = list;

  const persist = (next) => { setList(next); budSave(next); };

  const toggle = (id) => setExpanded(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const allIds = () => { const s = new Set(); const w = (ns) => ns.forEach(n => { if (n.children && n.children.length) { s.add(n.id); w(n.children); } }); w(list); return s; };
  const expandAll = () => setExpanded(allIds());
  const collapseAll = () => setExpanded(new Set());

  const handleAct = (mode, node, level) => {
    if (mode === 'delete') { setModal({ mode, node, level }); return; }
    setModal({ mode, node, level });
  };

  const confirmDelete = () => {
    const n = modal.node;
    persist(budRemove(list, n.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ค่าคงที่โครงสร้างงบประมาณ',
      target: `${n.code} · ${n.name}`, summary: `ลบหมวดงบประมาณ “${n.name}”`,
      changes: [{ field: 'รหัสหมวดงบประมาณ', before: n.code, after: '—' }],
    });
    onToast && onToast(`ลบหมวดงบประมาณ “${n.name}” เรียบร้อยแล้ว`);
    setModal(null);
  };

  const submitNode = (vals) => {
    const { mode, node, level } = modal;
    if (mode === 'edit') {
      persist(budUpdate(list, node.id, vals));
      audit.log({
        action: 'update', module: 'บัญชี — ค่าคงที่โครงสร้างงบประมาณ',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขหมวดงบประมาณ “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไข “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      const newNode = { id: budUid(), ...vals, children: [] };
      if (mode === 'add-root') {
        persist([...list, newNode]);
      } else if (mode === 'add-child') {
        persist(budAddChild(list, node.id, newNode));
        setExpanded(s => new Set(s).add(node.id));
      } else if (mode === 'insert') {
        persist(budInsertAfter(list, node.id, newNode));
      }
      audit.log({
        action: 'create', module: 'บัญชี — ค่าคงที่โครงสร้างงบประมาณ',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มหมวดงบประมาณ “${vals.name}”`,
        changes: [
          { field: 'รหัสหมวดงบประมาณ', before: '—', after: vals.code },
          { field: 'ผังบัญชีที่ผูกพัน', before: '—', after: vals.gl || 'ยังไม่ผูก' },
        ],
      });
      onToast && onToast(`เพิ่มหมวดงบประมาณ “${vals.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const resetSeed = () => {
    const fresh = budClone(window.BUDGET_SEED);
    persist(fresh);
    onToast && onToast('คืนค่าโครงสร้างงบประมาณตั้งต้นเรียบร้อยแล้ว');
  };

  const modalParent = modal && (modal.mode === 'add-child'
    ? modal.node
    : modal.mode === 'insert'
      ? budFind(list, modal.node.id)?.parent || null
      : modal.mode === 'edit'
        ? budFind(list, modal.node.id)?.parent || null
        : null);

  return (
    <div data-screen-label="หน้าค่าคงที่โครงสร้างงบประมาณ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดโครงสร้างงบประมาณ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            จัดหมวดหมู่รายการรายรับ–รายจ่ายเป็นผังต้นไม้ 3 ระดับ ผูกกับรหัสผังบัญชี (GL) — เป็นโครงสร้างเท่านั้น ไม่มีตัวเลข/ปีงบประมาณ ใช้เป็นค่าคงที่ให้เมนู “กำหนดงบประมาณ” เรียกใช้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setCfgOpen(true)}>
          <Icon name="cog" /> รูปแบบรหัส
        </button>
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add-root', node: null, level: 1 })}>
          <Icon name="plus" /> เพิ่มหมวดหลัก
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="bud-toolbar" style={{ padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> เลื่อนเมาส์ที่แถวเพื่อ เพิ่มหมวดย่อย · แทรก · แก้ไข · ลบ — กำหนดได้สูงสุด 3 ระดับ
          </div>
          <span className="spacer" />
          <button className="btn ghost sm" onClick={expandAll}>ขยายทั้งหมด</button>
          <button className="btn ghost sm" onClick={collapseAll}>ยุบทั้งหมด</button>
        </div>

        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl bud-tbl" style={{ minWidth: 960 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 360 }}>หมวดงบประมาณ</th>
                <th className="center" style={{ width: 120 }}>ประเภท</th>
                <th className="center" style={{ width: 90 }}>ลักษณะ</th>
                <th style={{ width: 240 }}>ผังบัญชีที่ผูกพัน (GL)</th>
                <th className="center" style={{ width: 132 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={5} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีหมวดงบประมาณ — กดปุ่ม “เพิ่มหมวดหลัก” เพื่อเริ่มสร้างโครงสร้าง
                </td></tr>
              )}
              {list.map(n => (
                <BudgetRow key={n.id} node={n} level={1} expanded={expanded}
                           onToggle={toggle} onAct={handleAct} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> โครงสร้างนี้เป็นค่าคงที่ของระบบ — เมนู “กำหนดงบประมาณ” จะดึงโครงสร้างนี้ไปให้กรอกตัวเลขงบประมาณรายปี
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && modal.mode === 'delete' && (
        <BudgetDeleteModal node={modal.node} onClose={() => setModal(null)} onConfirm={confirmDelete} />
      )}
      {modal && modal.mode !== 'delete' && (
        <BudgetNodeModal mode={modal.mode}
                         parent={modalParent}
                         level={modal.level}
                         cfg={cfg}
                         draft0={modal.mode === 'edit' ? modal.node : null}
                         onClose={() => setModal(null)}
                         onSubmit={submitNode} />
      )}
      {cfgOpen && (
        <BudgetCodeCfgModal cfg={cfg} onClose={() => setCfgOpen(false)}
                            onSave={(d) => { setCfg(d); budCfgSave(d); setCfgOpen(false); onToast && onToast('บันทึกรูปแบบรหัสอัตโนมัติเรียบร้อยแล้ว'); }} />
      )}
    </div>
  );
}

// เปิดให้เมนู "กำหนดงบประมาณ" เรียกอ่านโครงสร้างล่าสุดได้
window.budLoadStructure = budLoad;
Object.assign(window, { BudgetStructureConfigPage });