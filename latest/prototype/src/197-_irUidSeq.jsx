// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่อัตราดอกเบี้ยเงินกู้ — InterestRateConfigPage
//  รายการตารางอัตรา → หน้ารายละเอียด (ข้อมูลตาราง + ช่วงอัตรา + ประวัติ)
//  ไม่ผูกกับประเภทเงินกู้ — 1 ตารางใช้ได้หลายประเภท (ประเภทเงินกู้เลือกตารางเองที่แท็บดอกเบี้ย)
//  ระบบงานสินเชื่อ › ค่าคงที่
// ════════════════════════════════════════════════════════════════════

let _irUidSeq = 0;
const irUid = () => 'IR-N' + (++_irUidSeq);
const irToday = () => new Date().toISOString().slice(0, 10);
const irNow = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const IR_USER = 'จันทร์เพ็ญ มาลี';
const IR_MODULE = 'สินเชื่อ — ค่าคงที่อัตราดอกเบี้ยเงินกู้';

function irLoad() {
  try {
    const saved = localStorage.getItem('int_rates');
    if (saved) return JSON.parse(saved).map(r => ({ loanTypeIds: [], history: [], ...r }));
  } catch (e) {}
  return window.IR_SEED.map(r => ({
    ...r, loanTypeIds: (r.loanTypeIds || []).slice(), history: [],
    rates: r.rates.map(x => ({ monthFrom: 0, monthTo: 0, ...x })),
  }));
}
window.irLoadAll = irLoad;
function irSaveLS(list) {
  try { localStorage.setItem('int_rates', JSON.stringify(list)); } catch (e) {}
}
// ประเภทเงินกู้ที่เลือกตารางนี้เป็น “ตารางอัตราที่ใช้” (ทุกสถานะ ที่ยังไม่ถูกลบ)
const irUsedBy = (rec) => window.lpTypesUsing ? window.lpTypesUsing(s => s.rateTable === rec.code || s.rateTable === rec.id) : [];
const IR_G = '#237450';
const IR_LINE = '#f0f0f0';
const IR_TH = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12,
                color: 'rgba(0,0,0,.65)', borderBottom: '1px solid ' + IR_LINE, whiteSpace: 'nowrap' };
const IR_TD = { padding: '11px 12px', borderBottom: '1px solid ' + IR_LINE, verticalAlign: 'top' };
const IR_MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12.5 };
const irBtn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px',
  border: '1px solid ' + (primary ? IR_G : '#d9d9d9'), background: primary ? IR_G : '#fff',
  color: primary ? '#fff' : 'rgba(0,0,0,.65)', borderRadius: 4, fontFamily: 'inherit',
  fontSize: 13, cursor: 'pointer',
});

const irRateSpan = (r) => {
  const rs = r.rates || [];
  if (!rs.length) return null;
  const vals = rs.map(x => Number(x.rate) || 0);
  return { min: Math.min(...vals), max: Math.max(...vals) };
};
const irLatestEff = (r) => {
  const rs = r.rates || [];
  if (!rs.length) return null;
  return rs.reduce((mx, x) => (!mx || (x.effectiveDate || '') > (mx.effectiveDate || '')) ? x : mx, null);
};

// ════════════════════════════════════════════════════════════════════
//  Detail — ข้อมูลตาราง + ตารางช่วงอัตรา + ประวัติการแก้ไข
// ════════════════════════════════════════════════════════════════════
function IrDetail({ record, onBack, onSave, startEditing, onHistory }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  const cur = editing ? draft : record;
  const setHdr = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const rows = cur.rates || [];
  const setRow = (i, k, v) => setDraft(d => ({
    ...d, rates: d.rates.map((t, idx) => idx === i ? { ...t, [k]: v } : t),
  }));
  const addRow = () => setDraft(d => {
    const last = d.rates[0];
    return { ...d, rates: [{
      effectiveDate: irToday(),
      loanFrom: 0, loanTo: last ? last.loanTo : 1000000,
      rate: last ? last.rate : 6.0000, useAdjust: false,
      user: IR_USER, date: irToday(),
    }, ...d.rates] };
  });
  const delRow = (i) => setDraft(d => ({ ...d, rates: d.rates.filter((_, idx) => idx !== i) }));

  const savedBadge = (() => {
    if (savedAt) return (window.savedBadgeLabel && window.savedBadgeLabel(savedAt.toISOString().slice(0, 16).replace('T', ' '))) || null;
    const last = (record.history || [])[0];
    if (last && last.ts) return (window.savedBadgeLabel && window.savedBadgeLabel(String(last.ts))) || null;
    if (record.createdDate) return (window.savedBadgeLabel && window.savedBadgeLabel(String(record.createdDate))) || null;
    return null;
  })();

  return (
    <div data-screen-label="หน้ารายละเอียดอัตราดอกเบี้ยเงินกู้">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {!editing && savedBadge && <span className="saved-badge">{savedBadge}</span>}
        {!editing && <button className="btn sm" onClick={onHistory}><Icon name="history" /> ประวัติ</button>}
        {!editing
          ? <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อมูล</button>
          : (
            <>
              <button className="btn sm" data-discard="1" onClick={cancel}>ละทิ้ง</button>
              <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกข้อมูล</button>
            </>
          )}
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div className="lt-head-ico"><Icon name="report" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label className="lt-modal-label">รหัสตาราง <span className="cfg-required">*</span></label>
                    <input className="cfg-input mono" value={draft.code} disabled style={{ width: '100%', background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                  </div>
                  <div>
                    <label className="lt-modal-label">ชื่อตาราง <span className="cfg-required">*</span></label>
                    <input className="cfg-input" style={{ width: '100%' }} value={draft.name} placeholder="ชื่อตารางอัตรา"
                           onChange={(e) => setHdr('name', e.target.value)} />
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label className="lt-modal-label">หมายเหตุ</label>
                  <input className="cfg-input" style={{ width: '100%' }} value={draft.note || ''} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                         onChange={(e) => setHdr('note', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
                <div className="lt-head-meta">
                  {record.note && <span>หมายเหตุ: {record.note}</span>}
                </div>
              </>
            )}
          </div>
          {!editing && (record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>)}
        </div>
      </div>

      {/* ตารางช่วงอัตรา */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">ตารางช่วงอัตราดอกเบี้ย <span className="muted" style={{ fontWeight: 400 }}>· {rows.length} แถว</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              คิดดอกเบี้ยตามช่วงวงเงินขอกู้ — แต่ละแถวมีวันที่มีผลของตัวเอง
            </div>
          </div>
          {editing && <button className="btn primary sm" onClick={addRow}><Icon name="plus" /> เพิ่มแถว</button>}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl sh-grid" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th rowSpan={2} className="center" style={{ width: 132 }}>วันที่มีผล</th>
                <th colSpan={2} className="center group-col">วงเงินขอกู้ (บาท)</th>
                <th rowSpan={2} className="center group-col" style={{ width: 120 }}>อัตรา (%)</th>
                <th rowSpan={2} className="center" style={{ width: 130 }}>อัตราเพิ่ม/ลด</th>
                {editing && <th rowSpan={2} className="center" style={{ width: 52 }} />}
              </tr>
              <tr>
                <th className="center sub-col">ตั้งแต่</th><th className="center sub-col">ถึง</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={editing ? 6 : 5} className="center muted" style={{ padding: '26px 12px' }}>
                  ยังไม่มีช่วงอัตรา — กดปุ่ม “เพิ่มแถว” เพื่อกำหนดอัตราใหม่
                </td></tr>
              )}
              {rows.map((t, i) => (
                <tr key={i}>
                  <td className="center mono">
                    {editing
                      ? <ErpDate value={t.effectiveDate} onChange={(v) => setRow(i, 'effectiveDate', v)} style={{ textAlign: 'center', maxWidth: 'none' }} className="sh-grid-input" />
                      : fmt.date(t.effectiveDate)}
                  </td>
                  <td className="num-cell">
                    {editing ? <input className="sh-grid-input" style={{ width: '100%', maxWidth: 'none' }} type="number" value={t.loanFrom} onChange={(e) => setRow(i, 'loanFrom', e.target.value)} />
                             : <span className="sh-grid-num">{fmt.money(Number(t.loanFrom || 0), 2)}</span>}
                  </td>
                  <td className="num-cell">
                    {editing ? <input className="sh-grid-input" style={{ width: '100%', maxWidth: 'none' }} type="number" value={t.loanTo} onChange={(e) => setRow(i, 'loanTo', e.target.value)} />
                             : <span className="sh-grid-num">{fmt.money(Number(t.loanTo || 0), 2)}</span>}
                  </td>
                  <td className="num-cell">
                    {editing ? <input className="sh-grid-input" style={{ width: '100%', maxWidth: 'none' }} type="number" step="0.0001" value={t.rate} onChange={(e) => setRow(i, 'rate', e.target.value)} />
                             : <span className="sh-grid-num" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{fmt.money(Number(t.rate || 0), 2)}</span>}
                  </td>
                  <td className="center">
                    {editing
                      ? <label className="l2-check" style={{ justifyContent: 'center' }}>
                          <input type="checkbox" className="ct-check" checked={!!t.useAdjust} onChange={(e) => setRow(i, 'useAdjust', e.target.checked)} />
                          <span style={{ fontSize: 12 }}>ใช้</span>
                        </label>
                      : (t.useAdjust ? <span className="chip warning">ใช้อัตราเพิ่ม/ลด</span> : <span className="muted">—</span>)}
                  </td>
                  {editing && (
                    <td className="center">
                      <button className="btn act-del" onClick={() => delRow(i)} title="ลบรายการ"
                              style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)',
                                       width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}>
                        <Icon name="trash" size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> ระบบจะใช้แถวที่วันที่มีผลล่าสุดและตรงช่วงวงเงินของคำขอกู้
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal — รหัส + ชื่อ + หมายเหตุ
// ════════════════════════════════════════════════════════════════════
function IrAddModal({ list, onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณาระบุรหัสตาราง'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อตาราง'); return; }
    if (list.some(r => r.code === code.trim())) { setError('รหัสนี้ถูกใช้แล้ว'); return; }
    onCreate({
      id: irUid(), code: code.trim(), name: name.trim(),
      enabled: false, createdDate: irNow(), createdBy: IR_USER, note: note.trim(),
      rates: [], history: [],
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มตารางอัตราดอกเบี้ย</h2>
            <div className="muted" style={{ fontSize: 11 }}>ประเภทเงินกู้เลือกตารางนี้ได้ที่แท็บดอกเบี้ย เมนูประเภทเงินกู้</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 150px' }}>
              <label className="lt-modal-label">รหัสตาราง <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" style={{ width: '100%' }} value={code} placeholder="IR-LP10"
                     onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="lt-modal-label">ชื่อตาราง <span className="cfg-required">*</span></label>
              <input className="cfg-input" style={{ width: '100%' }} value={name} placeholder="เช่น อัตราสามัญปกติ 2569"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" style={{ width: '100%' }} value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                 onChange={(e) => setNote(e.target.value)} />

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> สร้างตารางอัตรา
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Toggle confirm modal
// ════════════════════════════════════════════════════════════════════
function IrToggleModal({ target, turningOn, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการใช้งานตารางอัตรา' : 'ปิดการใช้งานตารางอัตรา'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">
            {turningOn
              ? <>เปิดใช้งานตารางอัตรา <b>“{target.name}”</b> — ระบบจะนำอัตราในตารางนี้ไปใช้คิดดอกเบี้ยเงินกู้ที่อ้างอิงรหัส {target.code}</>
              : <>ปิดใช้งานตารางอัตรา <b>“{target.name}”</b> — ระบบจะ<b>ไม่นำอัตรานี้ไปคิดดอกเบี้ย</b>กับเงินกู้ใหม่</>}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className={"btn " + (turningOn ? 'primary' : 'danger')} style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
              <Icon name="check" /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function InterestRateConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(irLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [hist, setHist] = useState(null);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);

  const persist = (next) => { setList(next); irSaveLS(next); };
  const openRec = list.find(r => r.id === openId);
  const activeCount = list.filter(r => r.enabled).length;
  const [blocked, setBlocked] = useState(null);

  const filtered = React.useMemo(() => {
    const k = applied.trim().toLowerCase();
    if (!k) return list;
    return list.filter(r => [r.code, r.name, r.note]
      .filter(Boolean).some(x => String(x).toLowerCase().indexOf(k) >= 0));
  }, [list, applied]);
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * per;
  const shown = filtered.slice(start, start + per);
  const pageBtn = (n, label, disabled, active) => (
    <button key={label + n} type="button" disabled={disabled} onClick={() => setPage(n)}
            style={{ minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer',
                     border: '1px solid ' + (active ? IR_G : '#d9d9d9'), background: active ? IR_G : '#fff',
                     color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)'),
                     fontFamily: 'inherit', fontSize: 12 }}>{label}</button>
  );

  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3 ? window.crumb3('อัตราดอกเบี้ยเงินกู้', openRec ? 'view' : 'list', () => setOpenId(null)) : null,
    [openId]
  );

  const handleCreate = (rec) => {
    const entry = { ts: irNow(), user: IR_USER, action: 'create', summary: `สร้างตารางอัตรา “${rec.name}”`, changes: [{ field: 'รหัสตาราง', before: '—', after: rec.code }] };
    persist([{ ...rec, history: [entry] }, ...list]);
    audit.log({
      action: 'create', module: IR_MODULE,
      target: `${rec.code} · ${rec.name}`, summary: `เพิ่มตารางอัตราดอกเบี้ย “${rec.name}”`,
      changes: [{ field: 'รหัสตาราง', before: '—', after: rec.code }],
    });
    setAdding(false);
    onToast && onToast(`สร้างตารางอัตรา “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true); setOpenId(rec.id);
  };

  const handleSaveDetail = (draft) => {
    const before = list.find(r => r.id === draft.id) || {};
    const changes = [];
    if (before.code !== draft.code) changes.push({ field: 'รหัสตาราง', before: before.code, after: draft.code });
    if (before.name !== draft.name) changes.push({ field: 'ชื่อตาราง', before: before.name, after: draft.name });
    if ((before.rates || []).length !== (draft.rates || []).length) {
      changes.push({ field: 'จำนวนช่วงอัตรา', before: (before.rates || []).length + ' ช่วง', after: (draft.rates || []).length + ' ช่วง' });
    }
    const summary = changes.length
      ? changes.map(c => `${c.field}: ${c.before} → ${c.after}`).join(' · ')
      : `แก้ไขช่วงอัตราในตาราง (${(draft.rates || []).length} ช่วง)`;
    const entry = { ts: irNow(), user: IR_USER, action: 'update', summary, changes };
    persist(list.map(r => r.id === draft.id ? { ...draft, history: [entry, ...(r.history || [])] } : r));
    audit.log({ action: 'update', module: IR_MODULE, target: `${draft.code} · ${draft.name}`, summary, changes });
    onToast && onToast(`บันทึกตารางอัตรา “${draft.name}” เรียบร้อยแล้ว`);
  };

  const applyToggle = () => {
    const { rec, turningOn } = toggleTarget;
    const entry = { ts: irNow(), user: IR_USER, action: 'toggle',
                    summary: turningOn ? 'เปิดใช้งานตาราง' : 'ปิดใช้งานตาราง',
                    changes: [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }] };
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: turningOn, history: [entry, ...(r.history || [])] } : r));
    audit.log({
      action: 'update', module: IR_MODULE,
      target: `${rec.code} · ${rec.name}`,
      summary: turningOn ? `เปิดใช้งานตารางอัตรา “${rec.name}”` : `ปิดใช้งานตารางอัตรา “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }],
    });
    onToast && onToast(turningOn ? `เปิดใช้งาน “${rec.name}” แล้ว` : `ปิดใช้งาน “${rec.name}” แล้ว`);
    setToggleTarget(null);
  };

  if (openRec) {
    return (
      <>
        <IrDetail record={openRec} startEditing={startEditing}
                  onBack={() => { setOpenId(null); setStartEditing(false); }}
                  onSave={handleSaveDetail}
                  onHistory={() => setHist({ title: 'ประวัติ', subtitle: openRec.code + ' · ' + openRec.name, entries: openRec.history || [] })} />
        {hist && window.LpjHistoryModal && <window.LpjHistoryModal {...hist} onClose={() => setHist(null)} />}
      </>
    );
  }

  return (
    <div data-screen-label="หน้าค่าคงที่อัตราดอกเบี้ยเงินกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อัตราดอกเบี้ยเงินกู้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            สร้างตารางอัตราดอกเบี้ย — แต่ละตารางกำหนดอัตราตามช่วงวงเงินขอกู้ พร้อมเก็บประวัติการเปลี่ยนแปลง (ประเภทเงินกู้เลือกตารางนี้ได้ที่แท็บดอกเบี้ย เมนูประเภทเงินกู้)
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}>
          <Icon name="plus" /> เพิ่มตารางอัตรา
        </button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="report" /></div>
        <div>
          <div className="lt-ab-label">ตารางอัตราดอกเบี้ยทั้งหมด</div>
          <div className="lt-ab-name">{list.length} ตาราง
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '14px 16px 12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff',
                          border: '1px solid #d9d9d9', borderRadius: 2, minWidth: 300, flex: '0 1 340px' }}>
            <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.35)' }}><Icon name="search" size={14} /></span>
            <input value={q} placeholder="ค้นหารหัส, ชื่อ, หมายเหตุ..."
                   onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') { setApplied(q); setPage(1); } }}
                   style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit',
                            fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent' }} />
          </label>
          <button type="button" style={irBtn(true)} onClick={() => { setApplied(q); setPage(1); }}>ค้นหา</button>
          <button type="button" style={irBtn(false)} onClick={() => { setQ(''); setApplied(''); setPage(1); }}>รีเซ็ต</button>
        </div>

        <div style={{ padding: '4px 16px 0', borderTop: '1px solid ' + IR_LINE }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1020, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ ...IR_TH, width: 120 }}>รหัสตาราง</th>
                  <th style={{ ...IR_TH, minWidth: 220 }}>ชื่อตาราง</th>
                  <th style={{ ...IR_TH, width: 96, textAlign: 'center' }}>ช่วงอัตรา</th>
                  <th style={{ ...IR_TH, width: 150, textAlign: 'right' }}>อัตรา (ต่ำ–สูง)</th>
                  <th style={{ ...IR_TH, width: 124, textAlign: 'center' }}>วันที่มีผลล่าสุด</th>
                  <th style={{ ...IR_TH, width: 108, textAlign: 'center' }}>สถานะ</th>
                  <th style={{ ...IR_TH, width: 70, textAlign: 'center' }}>ใช้งาน</th>
                  <th style={{ ...IR_TH, width: 76, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => {
                  const lr = irLatestEff(r);
                  const sp = irRateSpan(r);
                  return (
                    <tr key={r.id} style={r.enabled ? undefined : { background: '#fafafa', opacity: .72 }}>
                      <td style={{ ...IR_TD, ...IR_MONO, color: 'rgba(0,0,0,.65)' }}>{r.code}</td>
                      <td style={IR_TD}>
                        <span style={{ display: 'block', fontWeight: 600 }}>{r.name}</span>
                        {r.note && <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3 }}>{r.note}</span>}
                      </td>
                      <td style={{ ...IR_TD, ...IR_MONO, textAlign: 'center' }}>{(r.rates || []).length}</td>
                      <td style={{ ...IR_TD, ...IR_MONO, textAlign: 'right' }}>
                        {sp ? <b>{fmt.money(sp.min, 2)}–{fmt.money(sp.max, 2)}%</b> : <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}
                      </td>
                      <td style={{ ...IR_TD, ...IR_MONO, textAlign: 'center' }}>{lr ? fmt.date(lr.effectiveDate) : '—'}</td>
                      <td style={{ ...IR_TD, textAlign: 'center' }}>
                        <span className={'pill ' + (r.enabled ? 'ok' : 'neutral')}>{r.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                      </td>
                      <td style={{ ...IR_TD, textAlign: 'center' }}>
                        <button type="button" role="switch" aria-checked={!!r.enabled}
                                aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                onClick={() => {
                                  const used = r.enabled ? irUsedBy(r) : [];
                                  if (used.length) return setBlocked({ title: 'ปิดการใช้งานตารางอัตรา', subtitle: r.code + ' · ' + r.name,
                                    detail: `ปิดใช้งานไม่ได้ — ตารางอัตรา “${r.name}” ถูกใช้อยู่ใน ${used.length} ประเภทเงินกู้: ${used.join(' · ')} · กรุณาเปลี่ยนตารางอัตราที่ใช้ในประเภทเงินกู้เหล่านี้ก่อน` });
                                  setToggleTarget({ rec: r, turningOn: !r.enabled });
                                }}
                                style={{ position: 'relative', width: 44, height: 22, border: 'none', borderRadius: 9999,
                                         cursor: 'pointer', padding: 0, transition: 'background .18s',
                                         background: r.enabled ? IR_G : 'rgba(0,0,0,.25)' }}>
                          <span style={{ position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18,
                                         borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
                        </button>
                      </td>
                      <td style={{ ...IR_TD, textAlign: 'center' }}>
                        <button type="button" onClick={() => { setStartEditing(false); setOpenId(r.id); }} title="ดูรายละเอียดตารางอัตรา"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px',
                                         border: '1px solid #d9d9d9', background: '#fff', borderRadius: 4,
                                         fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer' }}>
                          <Icon name="eye" size={14} /> ดู
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {total === 0 && (
                  <tr><td colSpan={8} style={{ ...IR_TD, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 0', borderTop: '1px solid ' + IR_LINE, display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
              {total === 0 ? '0 รายการ' : (start + 1) + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pageBtn(cur - 1, '‹', cur <= 1, false)}
              {Array.from({ length: pages }, (_, i) => pageBtn(i + 1, String(i + 1), false, cur === i + 1))}
              {pageBtn(cur + 1, '›', cur >= pages, false)}
              <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }} aria-label="จำนวนต่อหน้า"
                      style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                               fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                {[20, 50, 100].map(n => <option key={n} value={n}>{n} / หน้า</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ประเภทเงินกู้เลือกตารางนี้ได้ที่แท็บดอกเบี้ย เมนูประเภทเงินกู้ — ตารางที่เปิดใช้งานจะปรากฏเป็นตัวเลือก “ตารางอัตราที่ใช้”
      </div>

      {adding && <IrAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
      {toggleTarget && <IrToggleModal target={toggleTarget.rec} turningOn={toggleTarget.turningOn}
                                      onClose={() => setToggleTarget(null)} onConfirm={applyToggle} />}
      {blocked && window.ConstBlockedModal && <window.ConstBlockedModal {...blocked} onClose={() => setBlocked(null)} />}
    </div>
  );
}

Object.assign(window, { InterestRateConfigPage });
