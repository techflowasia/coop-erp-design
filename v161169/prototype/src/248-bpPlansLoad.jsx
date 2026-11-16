// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — กำหนดงบประมาณ (รายปี)
//  · ต้องตั้งปีงบประมาณก่อน จึงจะกรอกตัวเลขแต่ละหมวดได้
//  · ดึงโครงสร้างหมวดงบประมาณ (live) จากเมนู "กำหนดโครงสร้างงบประมาณ"
//  · สร้างปีใหม่จะ "แสตมป์" ตัวเลขจากปีก่อนหน้ามาให้แก้ไข
//  · หมวด/หมวดย่อยที่เพิ่มในโครงสร้างภายหลัง จะถูกดึงมาแสดงให้กรอกด้วย
// ════════════════════════════════════════════════════════════════════

// ─── localStorage ───────────────────────────────────────────────────
function bpPlansLoad() {
  try {
    const s = localStorage.getItem('budget_plans_v2');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return JSON.parse(JSON.stringify(window.BUDGET_PLAN_SEED || []));
}
function bpPlansSave(list) {
  try { localStorage.setItem('budget_plans_v2', JSON.stringify(list)); } catch (e) {}
}
function bpStructure() {
  return (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || []));
}

// ─── helpers: roll-up + leaf walk ───────────────────────────────────
function bpRollup(node, amounts) {
  const k = node.children || [];
  if (!k.length) return Number(amounts[node.id] || 0);
  return k.reduce((s, c) => s + bpRollup(c, amounts), 0);
}
// ระดับที่กรอกงบประมาณ (entry level) = ระดับ 2 — ระดับ 1 รวมยอดอัตโนมัติ,
// ระดับ 3 ขึ้นไปไม่มีช่องกรอก แต่อ้างอิงยอดงบจากหมวดระดับ 2 แทน
const BP_ENTRY_LEVEL = 2;
function bpNodeValue(node, level, amounts) {
  if (level >= BP_ENTRY_LEVEL) return Number(amounts[node.id] || 0);
  const k = node.children || [];
  if (!k.length) return Number(amounts[node.id] || 0);
  return k.reduce((s, c) => s + bpNodeValue(c, level + 1, amounts), 0);
}
function bpSumNature(structure, amounts, nature) {
  let s = 0;
  const walk = (ns, lvl) => ns.forEach(n => {
    const isEntry = lvl >= BP_ENTRY_LEVEL || !(n.children && n.children.length);
    if (isEntry) { if (n.nature === nature) s += Number(amounts[n.id] || 0); }
    else walk(n.children, lvl + 1);
  });
  walk(structure, 1);
  return s;
}
function bpEachEntry(structure, fn) {
  const walk = (ns, lvl) => ns.forEach(n => {
    const isEntry = lvl >= BP_ENTRY_LEVEL || !(n.children && n.children.length);
    if (isEntry) fn(n); else walk(n.children, lvl + 1);
  });
  walk(structure, 1);
}

// ─── เบิกจ่ายสะสม (deterministic) + งบประมาณคงเหลือ ───────────────────
// ระบบจริงดึงยอดเบิกจ่ายสะสมจากบัญชีแยกประเภท (GL) — ในตัวอย่างนี้ใช้ค่าคงที่
// อิงรหัสหมวดเพื่อให้คงเหลือ = งบที่ตั้งไว้ − เบิกจ่ายสะสม แสดงผลได้สม่ำเสมอ
function bpHash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
function bpUsedFor(node, val) { if (!val) return 0; const pct = 0.32 + (bpHash(node.id) % 57) / 100; return Math.round(val * pct); }
function bpNodeUsed(node, level, amounts) {
  if (level >= BP_ENTRY_LEVEL) return bpUsedFor(node, Number(amounts[node.id] || 0));
  const k = node.children || [];
  if (!k.length) return bpUsedFor(node, Number(amounts[node.id] || 0));
  return k.reduce((s, c) => s + bpNodeUsed(c, level + 1, amounts), 0);
}
function bpSumUsedNature(structure, amounts, nature) {
  let s = 0;
  const walk = (ns, lvl) => ns.forEach(n => {
    const isEntry = lvl >= BP_ENTRY_LEVEL || !(n.children && n.children.length);
    if (isEntry) { if (n.nature === nature) s += bpUsedFor(n, Number(amounts[n.id] || 0)); }
    else walk(n.children, lvl + 1);
  });
  walk(structure, 1);
  return s;
}

// ════════════════════════════════════════════════════════════════════
//  Create-year modal
// ════════════════════════════════════════════════════════════════════
function BudgetYearModal({ plans, onClose, onCreate }) {
  const years = plans.map(p => p.year).sort((a, b) => b - a);
  const suggested = (years.length ? Math.max(...years) : (new Date().getFullYear() + 543)) + 1;
  const [year, setYear] = useState(String(suggested));
  const [copyFrom, setCopyFrom] = useState(years.length ? String(years[0]) : '__blank');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const y = parseInt(year, 10);
    if (!y || y < 2500 || y > 2700) { setError('กรุณาระบุปีงบประมาณ (พ.ศ.) ให้ถูกต้อง'); return; }
    if (plans.some(p => p.year === y)) { setError('มีปีงบประมาณนี้อยู่แล้วในระบบ'); return; }
    onCreate(y, copyFrom === '__blank' ? null : parseInt(copyFrom, 10), note.trim());
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="calendar" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ตั้งปีงบประมาณใหม่</h2>
            <div className="muted" style={{ fontSize: 11 }}>กำหนดปีก่อน แล้วจึงกรอกตัวเลขแต่ละหมวด</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">ปีงบประมาณ (พ.ศ.) <span className="cfg-required">*</span></label>
          <input className="cfg-input mono" value={year} autoFocus inputMode="numeric"
                 placeholder="เช่น 2570"
                 onChange={(e) => { setYear(e.target.value.replace(/\D/g, '')); setError(''); }} />

          <label className="lt-modal-label" style={{ marginTop: 12 }}>แสตมป์ตัวเลขจากปี</label>
          <select className="filter-select" style={{ width: '100%' }} value={copyFrom}
                  onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="__blank">เริ่มจากศูนย์ (ไม่คัดลอก)</option>
            {years.map(y => <option key={y} value={y}>คัดลอกงบประมาณจากปี {y}</option>)}
          </select>
          <div className="bud-fld-hint" style={{ marginTop: 5 }}>
            ระบบจะคัดลอกตัวเลขงบประมาณของแต่ละหมวดจากปีที่เลือกมาตั้งต้นให้ — ปรับแก้ไขได้ภายหลัง
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="เช่น ร่างเสนอที่ประชุมใหญ่ (ไม่บังคับ)"
                 onChange={(e) => setNote(e.target.value)} />

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> ตั้งปีงบประมาณ
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Tree row (recursive) — มีช่องกรอกตัวเลขที่ leaf
// ════════════════════════════════════════════════════════════════════
function BudgetPlanRow({ node, level, expanded, onToggle, amounts, prevAmounts, hasPrev, editable, onAmt, refVal }) {
  const kids = node.children || [];
  const hasKids = kids.length > 0;
  const isOpen = expanded.has(node.id);

  const isBelowEntry  = level > BP_ENTRY_LEVEL;                 // ระดับ 3+ → อ้างอิง ไม่กรอก
  const isRollupParent = level < BP_ENTRY_LEVEL && hasKids;     // ระดับเหนือ entry → รวมยอด
  const editableHere   = editable && !isBelowEntry && !isRollupParent;  // ระดับ 2 (หรือ leaf ตื้นกว่า)

  const thisVal = bpNodeValue(node, level, amounts);
  const prevVal = bpNodeValue(node, level, prevAmounts || {});
  const isNew = editableHere && hasPrev && !(node.id in (prevAmounts || {}));
  // ค่าอ้างอิงที่ส่งให้ลูกระดับถัดไป: ถ้า node นี้คือ entry → ยอดของตัวเอง
  const childRef = level >= BP_ENTRY_LEVEL ? thisVal : refVal;

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
            {editableHere && <span className="bp-entry-tag">ช่องกรอกงบ</span>}
            {isNew && <span className="bud-new-tag">หมวดใหม่</span>}
            {!node.enabled && <span className="pill neutral">ปิดใช้งาน</span>}
          </div>
        </td>
        <td className="center">
          <span className={"chip " + (node.type === 'capital' ? 'info' : 'primary')} style={{ height: 20 }}>
            {window.budLabel('type', node.type)}
          </span>
        </td>
        {hasPrev && (
          <td className="right mono bud-prev">{prevVal ? fmt.money(prevVal, 0) : '—'}</td>
        )}
        <td className="right bud-amt-cell">
          {isRollupParent ? (
            <span className="mono bud-amt">{thisVal ? fmt.money(thisVal, 0) : '—'}</span>
          ) : editableHere ? (
            <input className="bp-amt-input" type="number" inputMode="decimal" step="0.01"
                   value={amounts[node.id] == null ? '' : amounts[node.id]}
                   placeholder="0"
                   onChange={(e) => onAmt(node.id, e.target.value)} />
          ) : isBelowEntry ? (
            <span className="bp-ref" title="อ้างอิงยอดงบประมาณจากหมวดระดับ 2">
              ↑ อ้างอิงระดับ 2{refVal ? ' · ฿' + fmt.money(refVal, 0) : ''}
            </span>
          ) : (
            <span className="mono bud-amt">{thisVal ? fmt.money(thisVal, 0) : '—'}</span>
          )}
        </td>
        <td className="right mono bud-remain">
          {thisVal ? (() => {
            const remain = thisVal - bpNodeUsed(node, level, amounts);
            return <span className={remain < 0 ? 'bp-remain-neg' : 'bp-remain-pos'}>{fmt.money(remain, 0)}</span>;
          })() : <span className="muted">—</span>}
        </td>
      </tr>
      {hasKids && isOpen && kids.map(c => (
        <BudgetPlanRow key={c.id} node={c} level={level + 1} expanded={expanded}
                       onToggle={onToggle} amounts={amounts} prevAmounts={prevAmounts}
                       hasPrev={hasPrev} editable={editable} onAmt={onAmt} refVal={childRef} />
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function BudgetPlanConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [plans, setPlans] = useState(bpPlansLoad);
  const [structure, setStructure] = useState(bpStructure);
  const [selYear, setSelYear] = useState(() => {
    const ys = bpPlansLoad().map(p => p.year);
    return ys.length ? Math.max(...ys) : null;
  });
  const [draft, setDraft] = useState({});
  const [expanded, setExpanded] = useState(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const current = plans.find(p => p.year === selYear) || null;
  const prevPlan = React.useMemo(() => {
    const earlier = plans.filter(p => p.year < selYear).sort((a, b) => b.year - a.year);
    return earlier[0] || null;
  }, [plans, selYear]);
  const hasPrev = !!prevPlan;

  // โหลดตัวเลขของปีที่เลือกเข้าฉบับร่างแก้ไข + เปิดระดับ 1–2
  useEffect(() => {
    if (current) setDraft({ ...current.amounts });
    const s = new Set();
    const walk = (ns, lvl) => ns.forEach(n => { if (lvl <= 2 && n.children && n.children.length) { s.add(n.id); walk(n.children, lvl + 1); } });
    walk(structure, 1);
    setExpanded(s);
  }, [selYear]);   // eslint-disable-line

  const persistPlans = (next) => { setPlans(next); bpPlansSave(next); };

  const dirty = current ? JSON.stringify(draft) !== JSON.stringify(current.amounts) : false;

  const setAmt = (id, v) => setDraft(d => {
    const n = { ...d };
    if (v === '' || v == null) delete n[id]; else n[id] = Number(v);
    return n;
  });

  const toggle = (id) => setExpanded(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allIds = () => { const s = new Set(); const w = (ns) => ns.forEach(n => { if (n.children && n.children.length) { s.add(n.id); w(n.children); } }); w(structure); return s; };

  const syncStructure = () => {
    const fresh = bpStructure();
    setStructure(fresh);
    // ดึงหมวดใหม่: leaf ที่ยังไม่มีใน draft จะปรากฏช่องกรอกว่าง ๆ ให้กรอก
    let added = 0;
    bpEachEntry(fresh, (n) => { if (!(n.id in draft) && (!current || !(n.id in current.amounts))) added++; });
    onToast && onToast(added > 0
      ? `ซิงค์โครงสร้างล่าสุดแล้ว — พบหมวดที่ต้องกรอกเพิ่ม ${added} รายการ`
      : 'ซิงค์โครงสร้างล่าสุดแล้ว — โครงสร้างเป็นปัจจุบัน');
  };

  const save = () => {
    persistPlans(plans.map(p => p.year === selYear ? { ...p, amounts: { ...draft } } : p));
    audit.log({
      action: 'update', module: 'บัญชี — ค่าคงที่กำหนดงบประมาณ',
      target: `ปีงบประมาณ ${selYear}`,
      summary: `บันทึกตัวเลขงบประมาณประจำปี ${selYear}`,
    });
    onToast && onToast(`บันทึกงบประมาณปี ${selYear} เรียบร้อยแล้ว`);
  };

  const changeStatus = (st) => {
    persistPlans(plans.map(p => p.year === selYear ? { ...p, status: st } : p));
    onToast && onToast(`ปรับสถานะปีงบประมาณ ${selYear} เป็น “${window.BUD_PLAN_STATUS[st].l}”`);
  };

  const createYear = (y, copyFromYear, note) => {
    const src = copyFromYear ? plans.find(p => p.year === copyFromYear) : null;
    const amounts = src ? { ...src.amounts } : {};
    const rec = {
      year: y, status: 'draft', note,
      createdBy: 'จันทร์เพ็ญ มาลี', createdDate: new Date().toISOString().slice(0, 10),
      amounts,
    };
    persistPlans([...plans, rec]);
    audit.log({
      action: 'create', module: 'บัญชี — ค่าคงที่กำหนดงบประมาณ',
      target: `ปีงบประมาณ ${y}`,
      summary: `ตั้งปีงบประมาณ ${y}${src ? ` (แสตมป์จากปี ${src.year})` : ''}`,
      changes: [{ field: 'ปีงบประมาณ', before: '—', after: String(y) }],
    });
    setCreateOpen(false);
    setSelYear(y);
    onToast && onToast(`ตั้งปีงบประมาณ ${y} เรียบร้อยแล้ว${src ? ` — แสตมป์ตัวเลขจากปี ${src.year} มาให้แก้ไข` : ''}`);
  };

  const yearsSorted = [...plans].map(p => p.year).sort((a, b) => b - a);

  const totalRev = current ? bpSumNature(structure, draft, 'revenue') : 0;
  const totalExp = current ? bpSumNature(structure, draft, 'expense') : 0;

  // ─── Empty state: ยังไม่มีปีงบประมาณ ───────────────────────────────
  if (plans.length === 0) {
    return (
      <div data-screen-label="หน้ากำหนดงบประมาณ (ยังไม่มีปี)">
        <div className="page-actions">
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดงบประมาณ</h1>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กรอกตัวเลขงบประมาณแต่ละหมวดตามปีงบประมาณ</div>
          </div>
        </div>
        <div className="search-card bp-empty">
          <div className="bp-empty-ico"><Icon name="calendar" size={26} /></div>
          <div className="bp-empty-t">ยังไม่มีปีงบประมาณในระบบ</div>
          <div className="bp-empty-s">ต้องตั้งปีงบประมาณประจำปีขึ้นมาก่อน จึงจะกรอกตัวเลขงบประมาณแต่ละหมวดได้</div>
          <button className="btn primary" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" /> ตั้งปีงบประมาณใหม่
          </button>
        </div>
        {createOpen && <BudgetYearModal plans={plans} onClose={() => setCreateOpen(false)} onCreate={createYear} />}
      </div>
    );
  }

  const stMeta = current ? window.BUD_PLAN_STATUS[current.status] : null;

  return (
    <div data-screen-label="หน้ากำหนดงบประมาณ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดงบประมาณ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กรอกตัวเลขงบประมาณแต่ละหมวดตามโครงสร้างที่กำหนดไว้ — แยกตามปีงบประมาณ
          </div>
        </div>
        <span className="spacer" />
        <label className="bp-year-pick">
          <span>ปีงบประมาณ</span>
          <select className="filter-select" value={selYear || ''}
                  onChange={(e) => setSelYear(parseInt(e.target.value, 10))}>
            {yearsSorted.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="bp-year-pick">
          <span>สถานะปีงบประมาณ</span>
          <select className="filter-select" value={current.status}
                  onChange={(e) => changeStatus(e.target.value)}>
            {Object.keys(window.BUD_PLAN_STATUS).map(k =>
              <option key={k} value={k}>{window.BUD_PLAN_STATUS[k].l}</option>)}
          </select>
        </label>
        <button className="btn primary sm" onClick={() => setCreateOpen(true)}>
          <Icon name="plus" /> ตั้งปีงบประมาณ
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="bud-toolbar" style={{ padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} />{' '}
            กรอกงบประมาณที่ “หมวดย่อยระดับ 2” — ระดับ 1 รวมยอดอัตโนมัติ ส่วนระดับ 3 อ้างอิงยอดจากระดับ 2 · งบคงเหลือ = งบที่ตั้งไว้ − เบิกจ่ายสะสม
            {hasPrev ? ` · คอลัมน์ “งบปี ${prevPlan.year}” แสดงไว้เป็นฐานอ้างอิง` : ''}
          </div>
          <span className="spacer" />
          <button className="btn ghost sm" onClick={syncStructure} title="ดึงหมวดที่เพิ่มใหม่จากโครงสร้าง">
            <Icon name="refresh" /> ซิงค์โครงสร้าง
          </button>
          <button className="btn ghost sm" onClick={() => setExpanded(allIds())}>ขยายทั้งหมด</button>
          <button className="btn ghost sm" onClick={() => setExpanded(new Set())}>ยุบทั้งหมด</button>
        </div>

        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl bud-tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 360 }}>หมวดงบประมาณ</th>
                <th className="center" style={{ width: 120 }}>ประเภท</th>
                {hasPrev && <th className="right" style={{ width: 130 }}>งบปี {prevPlan.year}</th>}
                <th className="right" style={{ width: 170 }}>งบประมาณปี {selYear} (บาท)</th>
                <th className="right" style={{ width: 150 }}>งบประมาณคงเหลือ (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {structure.map(n => (
                <BudgetPlanRow key={n.id} node={n} level={1} expanded={expanded}
                               onToggle={toggle} amounts={draft} prevAmounts={prevPlan ? prevPlan.amounts : {}}
                               hasPrev={hasPrev} editable={true} onAmt={setAmt} />
              ))}
            </tbody>
            <tfoot>
              <tr className="bp-foot-row">
                <td colSpan={2} className="right" style={{ fontWeight: 600 }}>รวมรายจ่ายทั้งสิ้น</td>
                {hasPrev && <td className="right mono">{fmt.money(bpSumNature(structure, prevPlan.amounts, 'expense'), 0)}</td>}
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totalExp, 0)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totalExp - bpSumUsedNature(structure, draft, 'expense'), 0)}</td>
              </tr>
              <tr className="bp-foot-row">
                <td colSpan={2} className="right" style={{ fontWeight: 600 }}>รวมรายรับทั้งสิ้น</td>
                {hasPrev && <td className="right mono">{fmt.money(bpSumNature(structure, prevPlan.amounts, 'revenue'), 0)}</td>}
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totalRev, 0)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totalRev - bpSumUsedNature(structure, draft, 'revenue'), 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="bp-save-bar">
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> ตั้งปีงบประมาณ {selYear} โดย {current.createdBy} · {fmt.date(current.createdDate)}
            {current.note ? ` · ${current.note}` : ''}
          </div>
          <span className="spacer" />
          {dirty && <span className="chip warning" style={{ height: 24 }}><span className="dot-c" /> มีการแก้ไขที่ยังไม่บันทึก</span>}
          <button className="btn" onClick={() => setDraft({ ...current.amounts })} disabled={!dirty}>คืนค่าที่บันทึกไว้</button>
          <button className="btn primary" onClick={save} disabled={!dirty}>
            <Icon name="check" /> บันทึกงบประมาณปี {selYear}
          </button>
        </div>
      </div>

      {createOpen && <BudgetYearModal plans={plans} onClose={() => setCreateOpen(false)} onCreate={createYear} />}
    </div>
  );
}

Object.assign(window, { BudgetPlanConfigPage });
