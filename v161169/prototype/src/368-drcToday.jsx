// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ดอกเบี้ย / การปรับโครงสร้างหนี้ — DebtRestructConfigPage
//  master list (รูปแบบการปรับโครงสร้าง) → settings editor
//  ระบบงานทะเบียนและติดตามหนี้ › ค่าคงที่ — ใช้ lt-head-card + L2 primitives
// ════════════════════════════════════════════════════════════════════

const drcToday = () => new Date().toISOString().slice(0, 10);
const DRC_USER = 'จันทร์เพ็ญ มาลี';

// ─── primitives ─────────────────────────────────────────────────────
function DrcSelRow({ label, options, v, editing, onChange }) {
  return (
    <L2Row label={label}>
      {editing
        ? <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        : <div className="l2-val">{(options.find(o => o.v === v) || {}).l || '—'}</div>}
    </L2Row>
  );
}
function DrcToggleRow({ label, on, editing, onToggle }) {
  return (
    <div className="dsp-toggle-row">
      <div className="dsp-tr-text"><div className="dsp-tr-label">{label}</div></div>
      <button type="button" className={'lt-switch' + (on ? ' on' : '')} role="switch" aria-checked={on}
              disabled={!editing} onClick={() => editing && onToggle(!on)}>
        <span className="lt-switch-knob" />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Settings editor
// ════════════════════════════════════════════════════════════════════
function DrcSettingsEditor({ record, editing, onChange, onMethodChange }) {
  const s = record.settings;
  const set = (k, v) => onChange({ ...s, [k]: v });
  const m = window.drcMethod(record.method);

  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <L2Group title="วิธีการปรับโครงสร้าง">
            <L2Row label="วิธีปรับโครงสร้างหนี้">
              {editing
                ? <select className="l2-select" value={record.method} onChange={(e) => onMethodChange(e.target.value)}>
                    {window.DRC_METHODS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                : <div className="l2-val">{m.l}</div>}
            </L2Row>
            <div className="dsp-type-desc"><Icon name="info" size={12} /> {m.desc}</div>
          </L2Group>

          <L2Group title="อัตราดอกเบี้ย">
            <L2Row label="อัตราดอกเบี้ยหลังปรับ">
              <L2Num v={s.interestRate} editing={editing} decimals={2} suffix="% ต่อปี" onChange={(v) => set('interestRate', v)} />
            </L2Row>
            <L2Row label="อัตราดอกเบี้ยผิดนัด">
              <L2Num v={s.defaultRate} editing={editing} decimals={2} suffix="% ต่อปี" onChange={(v) => set('defaultRate', v)} />
            </L2Row>
            <L2Row label="ลดค่าปรับ (เบี้ยปรับ)">
              <L2Num v={s.penaltyWaivePct} editing={editing} suffix="%" onChange={(v) => set('penaltyWaivePct', v)} />
            </L2Row>
            <DrcToggleRow label="รวมดอกเบี้ยค้างเป็นเงินต้น (Capitalize)" on={s.capitalizeInterest} editing={editing}
                         onToggle={(v) => set('capitalizeInterest', v)} />
          </L2Group>
        </div>

        <div className="l2-col">
          <L2Group title="เงื่อนไขการผ่อนชำระ">
            <L2Row label="ขยายงวดสูงสุด">
              <L2Num v={s.maxExtendTerms} editing={editing} suffix="งวด" onChange={(v) => set('maxExtendTerms', v)} />
            </L2Row>
            <L2Row label="ระยะปลอดเงินต้น">
              <L2Num v={s.gracePeriodMonths} editing={editing} suffix="เดือน" onChange={(v) => set('gracePeriodMonths', v)} />
            </L2Row>
            <L2Row label="ชำระขั้นต่ำ (ของงวดเดิม)">
              <L2Num v={s.minPaymentPct} editing={editing} suffix="%" onChange={(v) => set('minPaymentPct', v)} />
            </L2Row>
            <L2Row label="ทบทวนเงื่อนไขทุก">
              <L2Num v={s.reviewMonths} editing={editing} suffix="เดือน" onChange={(v) => set('reviewMonths', v)} />
            </L2Row>
          </L2Group>

          <L2Group title="การควบคุม / เมื่อผิดเงื่อนไข">
            <DrcToggleRow label="ต้องได้รับความยินยอมจากผู้ค้ำประกัน" on={s.requireGuarantorConsent} editing={editing}
                         onToggle={(v) => set('requireGuarantorConsent', v)} />
            <DrcSelRow label="เมื่อผิดเงื่อนไขปรับโครงสร้าง" options={window.DRC_BREACH} v={s.breachAction} editing={editing}
                      onChange={(v) => set('breachAction', v)} />
          </L2Group>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail — header + editor
// ════════════════════════════════════════════════════════════════════
function DrcDetail({ record, onBack, onSave, startEditing }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  const cur = editing ? draft : record;
  const m = window.drcMethod(cur.method);

  return (
    <div data-screen-label="หน้ารายละเอียดการปรับโครงสร้างหนี้">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {savedAt && !editing && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขรูปแบบ</button>
        ) : (
          <>
            <button className="btn sm" onClick={cancel}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกรูปแบบ</button>
          </>
        )}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="swap" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="cfg-input mono" style={{ width: 120 }} value={draft.code} placeholder="รหัส เช่น RS-STD"
                       onChange={(e) => setDraft(d => ({ ...d, code: e.target.value }))} />
                <input className="cfg-input lt-name-input" style={{ flex: 1, minWidth: 220 }} value={draft.name}
                       placeholder="ชื่อรูปแบบการปรับโครงสร้างหนี้"
                       onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
              </div>
            ) : (
              <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
            )}
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span><span className="dot" />
              <span>{m.l}</span><span className="dot" />
              <span>สร้างโดย {record.createdBy}</span>
            </div>
          </div>
          {record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>}
        </div>

        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">วิธีปรับโครงสร้าง</span>
            <span className="lt-date-v">{m.l}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">อัตราดอกเบี้ยหลังปรับ</span>
            <span className="lt-date-v mono">{fmt.money(cur.settings.interestRate, 2)}% ต่อปี</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">วันที่สร้าง</span>
            <span className="lt-date-v">{fmt.date(record.createdDate)}</span>
          </div>
          <div className="lt-date" style={{ flex: 1 }}>
            <span className="lt-date-k">หมายเหตุ</span>
            {editing ? (
              <input className="cfg-input" value={draft.note || ''} placeholder="หมายเหตุประกอบ"
                     onChange={(e) => setDraft(d => ({ ...d, note: e.target.value }))} />
            ) : (
              <span className="lt-date-v">{record.note || <span className="muted">—</span>}</span>
            )}
          </div>
        </div>
      </div>

      <DrcSettingsEditor record={cur} editing={editing}
                        onChange={(settings) => setDraft(d => ({ ...d, settings }))}
                        onMethodChange={(method) => setDraft(d => ({ ...d, method }))} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal
// ════════════════════════════════════════════════════════════════════
function DrcAddModal({ list, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [method, setMethod] = useState('combine');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const m = window.drcMethod(method);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('กรุณาระบุชื่อรูปแบบ'); return; }
    if (!code.trim()) { setError('กรุณาระบุรหัส'); return; }
    onCreate({
      id: window.drcNextId(list), code: code.trim(), name: name.trim(), method,
      createdDate: drcToday(), createdBy: DRC_USER, enabled: false, note: note.trim(),
      settings: { ...window.DRC_SETTINGS_DEFAULTS },
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มรูปแบบการปรับโครงสร้างหนี้</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างรายการใหม่ — ยังไม่เปิดใช้งานจนกว่าจะเปิดสถานะ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
            <div>
              <label className="lt-modal-label">รหัส <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="RS-XX"
                     onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อรูปแบบ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus placeholder="เช่น ปรับโครงสร้างหนี้มาตรฐาน"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>วิธีปรับโครงสร้าง <span className="cfg-required">*</span></label>
          <select className="filter-select" style={{ width: '100%' }} value={method} onChange={(e) => setMethod(e.target.value)}>
            {window.DRC_METHODS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="dsp-type-desc" style={{ marginTop: 6 }}><Icon name="info" size={12} /> {m.desc}</div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                 onChange={(e) => setNote(e.target.value)} />

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> สร้างรายการ
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function DebtRestructConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.drcLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const persist = (next) => { setList(next); window.drcSaveLS(next); };
  const openRec = list.find(r => r.id === openId);

  const toggleEnabled = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่การปรับโครงสร้างหนี้',
      target: `${rec.id} · ${rec.name}`,
      summary: (rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + `รูปแบบ “${rec.name}”`,
      changes: [{ field: 'สถานะใช้งาน', before: rec.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน', after: rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }],
    });
    onToast && onToast((rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + `รูปแบบ “${rec.name}” แล้ว`);
  };

  const handleCreate = (rec) => {
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่การปรับโครงสร้างหนี้',
      target: `${rec.id} · ${rec.name}`,
      summary: `เพิ่มรูปแบบการปรับโครงสร้างหนี้ “${rec.name}”`,
      changes: [{ field: 'ชื่อรูปแบบ', before: '—', after: rec.name }],
    });
    setAdding(false);
    onToast && onToast(`สร้างรูปแบบ “${rec.name}” แล้ว`);
    setStartEditing(true); setOpenId(rec.id);
  };

  const handleSave = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่การปรับโครงสร้างหนี้',
      target: `${draft.id} · ${draft.name}`,
      summary: `แก้ไขรูปแบบการปรับโครงสร้างหนี้ “${draft.name}”`,
    });
    onToast && onToast(`บันทึกรูปแบบ “${draft.name}” แล้ว`);
  };

  if (openRec) {
    return <DrcDetail record={openRec} startEditing={startEditing}
                     onBack={() => { setOpenId(null); setStartEditing(false); }}
                     onSave={handleSave} />;
  }

  const enabledCnt = list.filter(r => r.enabled).length;

  return (
    <div data-screen-label="หน้าค่าคงที่ดอกเบี้ย/การปรับโครงสร้างหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ดอกเบี้ย / การปรับโครงสร้างหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดรูปแบบการปรับโครงสร้างหนี้ · อัตราดอกเบี้ย · และเงื่อนไขการผ่อนชำระที่ใช้ในการติดตามหนี้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มรูปแบบ</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="swap" /></div>
        <div>
          <div className="lt-ab-label">รูปแบบการปรับโครงสร้างหนี้ที่เปิดใช้งาน</div>
          <div className="lt-ab-name">{enabledCnt} รูปแบบ
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · ใช้อ้างอิงเมื่อทำสัญญาปรับโครงสร้างหนี้</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>รหัส</th>
                <th style={{ minWidth: 240 }}>ชื่อรูปแบบ</th>
                <th style={{ width: 180 }}>วิธีปรับโครงสร้าง</th>
                <th className="num" style={{ width: 130 }}>ดอกเบี้ยหลังปรับ</th>
                <th className="center" style={{ width: 110 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 76 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const m = window.drcMethod(r.method);
                return (
                  <tr key={r.id} className={'clickable' + (r.enabled ? ' selected' : '')}
                      onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                    <td className="mono">{r.code}</td>
                    <td>
                      <div className="lt-row-name">{r.name}</div>
                      {r.note && <div className="lt-row-note muted">{r.note}</div>}
                    </td>
                    <td><span className="chip info">{m.l}</span></td>
                    <td className="num mono">{fmt.money(r.settings.interestRate, 2)}%</td>
                    <td className="center">
                      {r.enabled
                        ? <span className="pill ok">เปิดใช้งาน</span>
                        : <span className="pill neutral">ปิดใช้งาน</span>}
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className={'lt-switch' + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                              aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => toggleEnabled(r)}>
                        <span className="lt-switch-knob" />
                      </button>
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn ghost sm" onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                        เปิด <Icon name="chevRight" size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> รูปแบบการปรับโครงสร้างหนี้ใช้กำหนดอัตราดอกเบี้ยและเงื่อนไขเมื่อทำสัญญาปรับโครงสร้าง
      </div>

      {adding && <DrcAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { DebtRestructConfigPage });
