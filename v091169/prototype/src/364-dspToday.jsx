// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่โครงการพักชำระหนี้ — DebtSuspensionProjectPage
//  master list (ทะเบียนโครงการ) → settings editor (รายละเอียด + เงื่อนไข)
//  ระบบงานทะเบียนและติดตามหนี้ › ค่าคงที่
//  · ใช้รูปแบบ lt-head-card + L2 primitives (ร่วมกับ ค่าคงที่ข้อกำหนดสินเชื่อ)
// ════════════════════════════════════════════════════════════════════

const dspToday = () => new Date().toISOString().slice(0, 10);
const DSP_USER = 'จันทร์เพ็ญ มาลี';

// ─── primitives เฉพาะหน้านี้ ────────────────────────────────────────
function DspSelRow({ label, indent, options, v, editing, onChange }) {
  return (
    <L2Row label={label} indent={indent}>
      {editing
        ? <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        : <div className="l2-val">{(options.find(o => o.v === v) || {}).l || '—'}</div>}
    </L2Row>
  );
}
function DspDateRow({ label, v, editing, onChange }) {
  return (
    <L2Row label={label}>
      {editing
        ? <ErpDate value={v || ''} onChange={(v) => ((e) => onChange(e.target.value))({ target: { value: v } })} className="l2-input" />
        : <div className="l2-val">{v ? fmt.date(v) : <span className="muted">— ไม่กำหนด —</span>}</div>}
    </L2Row>
  );
}
function DspToggleRow({ label, hint, on, editing, onToggle }) {
  return (
    <div className="dsp-toggle-row">
      <div className="dsp-tr-text">
        <div className="dsp-tr-label">{label}</div>
        {hint && <div className="dsp-tr-hint">{hint}</div>}
      </div>
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
function DspSettingsEditor({ record, editing, onChange, onTypeChange }) {
  const s = record.settings;
  const set = (k, v) => onChange({ ...s, [k]: v });
  const t = window.dspType(record.type);

  // เลือกประเภท → เซ็ตเงื่อนไขเริ่มต้นตาม preset (ช่วยลดการตั้งค่าผิด)
  const applyTypePreset = (type) => {
    const preset = {
      'general':     { requireSufficientIncome: true,  requireNonNegativeBalance: false, oncePerContract: false, banNewLoans: false, skipCalculation: false, oneContractAtATime: true },
      'debt-mgmt':   { requireSufficientIncome: true,  requireNonNegativeBalance: true,  oncePerContract: true,  banNewLoans: true,  skipCalculation: false, oneContractAtATime: true },
      'guarantor-r': { requireSufficientIncome: false, requireNonNegativeBalance: false, oncePerContract: false, banNewLoans: false, skipCalculation: true,  oneContractAtATime: false },
    }[type] || {};
    onTypeChange(type, { ...s, ...preset });
  };

  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        {/* ── คอลัมน์ซ้าย: รายละเอียดโครงการ ── */}
        <div className="l2-col">
          <L2Group title="รายละเอียดโครงการ">
            <L2Row label="ประเภทโครงการ">
              {editing
                ? <select className="l2-select" value={record.type} onChange={(e) => applyTypePreset(e.target.value)}>
                    {window.DSP_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                : <div className="l2-val">{t.l}</div>}
            </L2Row>
            <div className="dsp-type-desc"><Icon name="info" size={12} /> {t.desc}</div>
            <L2Row label="รายละเอียด / วัตถุประสงค์">
              {editing
                ? <textarea className="l2-input" rows={4} value={s.description}
                            placeholder="อธิบายรายละเอียดและเงื่อนไขของโครงการ เช่น รายได้คงเหลือหลังเข้าโครงการต้องเพียงพอต่อการผ่อนชำระ"
                            onChange={(e) => set('description', e.target.value)} />
                : <div className="l2-val" style={{ whiteSpace: 'normal', textAlign: 'left', lineHeight: 1.55 }}>{s.description || '—'}</div>}
            </L2Row>
          </L2Group>

          <L2Group title="ช่วงเวลาโครงการ">
            <DspDateRow label="วันที่เริ่มโครงการ" v={s.startDate} editing={editing} onChange={(v) => set('startDate', v)} />
            <DspDateRow label="วันที่สิ้นสุดโครงการ" v={s.endDate} editing={editing} onChange={(v) => set('endDate', v)} />
            <L2Row label="จำนวนเดือนพักชำระสูงสุด">
              <L2Num v={s.maxMonths} editing={editing} suffix="เดือน" onChange={(v) => set('maxMonths', v)} />
            </L2Row>
          </L2Group>

          <L2Group title="รูปแบบการชำระระหว่างพัก">
            <DspSelRow label="ชำระแบบ" options={window.DSP_PAY_BASIS} v={s.payBasis} editing={editing}
                       onChange={(v) => set('payBasis', v)} />
            <div className="dsp-type-desc">
              <Icon name="info" size={12} /> รูปแบบ “คงต้น/คงยอด” อ้างอิงตามรายละเอียดสัญญาของแต่ละเลขสัญญา
            </div>
          </L2Group>
        </div>

        {/* ── คอลัมน์ขวา: เงื่อนไขการเข้าร่วม ── */}
        <div className="l2-col">
          <L2Group title="เงื่อนไขการเข้าร่วม / การบันทึก">
            <DspToggleRow label="รายได้คงเหลือต้องเพียงพอต่อการผ่อนชำระ"
                          hint="ตรวจรายได้คงเหลือหลังเข้าโครงการต้องครอบคลุมยอดส่งใหม่"
                          on={s.requireSufficientIncome} editing={editing}
                          onToggle={(v) => set('requireSufficientIncome', v)} />
            <DspToggleRow label="ยอดเงินเดือนคงเหลือต้องไม่ติดลบ"
                          hint="หากรายได้คงเหลือติดลบ จะบันทึกไม่ได้ (โครงการบริหารจัดการหนี้)"
                          on={s.requireNonNegativeBalance} editing={editing}
                          onToggle={(v) => set('requireNonNegativeBalance', v)} />
            <DspToggleRow label="1 สัญญาใช้สิทธิได้ 1 ครั้งตลอดอายุสัญญา"
                          hint="สัญญาที่เคยเข้าโครงการนี้แล้ว จะเข้าร่วมซ้ำไม่ได้"
                          on={s.oncePerContract} editing={editing}
                          onToggle={(v) => set('oncePerContract', v)} />
            <DspToggleRow label="เข้าร่วมแล้วงดกู้ทุกประเภท"
                          hint="ตั้งสถานะห้ามกู้ให้สมาชิกโดยอัตโนมัติเมื่อบันทึก"
                          on={s.banNewLoans} editing={editing}
                          onToggle={(v) => set('banNewLoans', v)} />
            <DspToggleRow label="ไม่ต้องคำนวณ — บันทึกได้ทันที"
                          hint="สำหรับสัญญา R (ผู้ค้ำรับโอนหนี้มาเป็นของตน)"
                          on={s.skipCalculation} editing={editing}
                          onToggle={(v) => set('skipCalculation', v)} />
            <DspToggleRow label="ใช้สิทธิได้ครั้งละ 1 สัญญา"
                          hint="ปิดได้เฉพาะสัญญา R ที่พักได้ทุกสัญญา"
                          on={s.oneContractAtATime} editing={editing}
                          onToggle={(v) => set('oneContractAtATime', v)} />
          </L2Group>

          <div className="dsp-rule-note">
            <Icon name="shield" size={14} />
            <span>เงื่อนไขเหล่านี้จะถูกบังคับใช้ในหน้า <b>ใบคำขอพักชำระหนี้</b> เมื่อเจ้าหน้าที่เลือกโครงการนี้</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail — header + editor
// ════════════════════════════════════════════════════════════════════
function DspDetail({ record, onBack, onSave, startEditing }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  const cur = editing ? draft : record;
  const t = window.dspType(cur.type);
  const period = (cur.settings.startDate ? fmt.date(cur.settings.startDate) : '—') +
                 ' – ' + (cur.settings.endDate ? fmt.date(cur.settings.endDate) : 'ไม่กำหนด');

  return (
    <div data-screen-label="หน้ารายละเอียดโครงการพักชำระหนี้">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {savedAt && !editing && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขโครงการ</button>
        ) : (
          <>
            <button className="btn sm" onClick={cancel}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกโครงการ</button>
          </>
        )}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="calendar" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="cfg-input mono" style={{ width: 130 }} value={draft.code} placeholder="รหัส เช่น PMT-DMP"
                       onChange={(e) => setDraft(d => ({ ...d, code: e.target.value }))} />
                <input className="cfg-input lt-name-input" style={{ flex: 1, minWidth: 240 }} value={draft.name}
                       placeholder="ชื่อโครงการพักชำระหนี้"
                       onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
              </div>
            ) : (
              <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
            )}
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span><span className="dot" />
              <span>{t.l}</span><span className="dot" />
              <span>สร้างโดย {record.createdBy}</span>
            </div>
          </div>
          {record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>}
        </div>

        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">ประเภทโครงการ</span>
            <span className="lt-date-v">{t.l}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ช่วงเวลาโครงการ</span>
            <span className="lt-date-v">{period}</span>
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

      <DspSettingsEditor record={cur} editing={editing}
                         onChange={(settings) => setDraft(d => ({ ...d, settings }))}
                         onTypeChange={(type, settings) => setDraft(d => ({ ...d, type, settings }))} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal
// ════════════════════════════════════════════════════════════════════
function DspAddModal({ list, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('general');
  const [startDate, setStartDate] = useState(dspToday());
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const t = window.dspType(type);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('กรุณาระบุชื่อโครงการ'); return; }
    if (!code.trim()) { setError('กรุณาระบุรหัสโครงการ'); return; }
    const preset = {
      'general':     { requireSufficientIncome: true,  requireNonNegativeBalance: false, oncePerContract: false, banNewLoans: false, skipCalculation: false, oneContractAtATime: true },
      'debt-mgmt':   { requireSufficientIncome: true,  requireNonNegativeBalance: true,  oncePerContract: true,  banNewLoans: true,  skipCalculation: false, oneContractAtATime: true },
      'guarantor-r': { requireSufficientIncome: false, requireNonNegativeBalance: false, oncePerContract: false, banNewLoans: false, skipCalculation: true,  oneContractAtATime: false },
    }[type] || {};
    onCreate({
      id: window.dspNextId(list), code: code.trim(), name: name.trim(), type,
      createdDate: dspToday(), createdBy: DSP_USER, enabled: false, note: note.trim(),
      settings: { ...window.DSP_SETTINGS_DEFAULTS, startDate, endDate, ...preset },
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 500 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มโครงการพักชำระหนี้</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างโครงการใหม่ — ยังไม่เปิดใช้งานจนกว่าจะเปิดสถานะ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
            <div>
              <label className="lt-modal-label">รหัสโครงการ <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="PMT-XX"
                     onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อโครงการ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus placeholder="เช่น โครงการบริหารจัดการหนี้ ปี 2570"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>ประเภทโครงการ <span className="cfg-required">*</span></label>
          <select className="filter-select" style={{ width: '100%' }} value={type} onChange={(e) => setType(e.target.value)}>
            {window.DSP_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="dsp-type-desc" style={{ marginTop: 6 }}><Icon name="info" size={12} /> {t.desc}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">วันที่เริ่มโครงการ</label>
              <ErpDate value={startDate} onChange={(v) => ((e) => setStartDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </div>
            <div>
              <label className="lt-modal-label">วันที่สิ้นสุดโครงการ</label>
              <ErpDate value={endDate} onChange={(v) => ((e) => setEndDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                 onChange={(e) => setNote(e.target.value)} />

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> สร้างโครงการ
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
function DebtSuspensionProjectPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.dspLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const persist = (next) => { setList(next); window.dspSaveLS(next); };
  const openRec = list.find(r => r.id === openId);
  const today = dspToday();

  const toggleEnabled = (rec) => {
    const next = list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r);
    persist(next);
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่โครงการพักชำระหนี้',
      target: `${rec.id} · ${rec.name}`,
      summary: (rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + `โครงการพักชำระหนี้ “${rec.name}”`,
      changes: [{ field: 'สถานะใช้งาน', before: rec.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน', after: rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }],
    });
    onToast && onToast((rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน') + `โครงการ “${rec.name}” แล้ว`);
  };

  const handleCreate = (rec) => {
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่โครงการพักชำระหนี้',
      target: `${rec.id} · ${rec.name}`,
      summary: `เพิ่มโครงการพักชำระหนี้ “${rec.name}” (${window.dspType(rec.type).l})`,
      changes: [{ field: 'ชื่อโครงการ', before: '—', after: rec.name }],
    });
    setAdding(false);
    onToast && onToast(`สร้างโครงการ “${rec.name}” แล้ว`);
    setStartEditing(true); setOpenId(rec.id);
  };

  const handleSave = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่โครงการพักชำระหนี้',
      target: `${draft.id} · ${draft.name}`,
      summary: `แก้ไขโครงการพักชำระหนี้ “${draft.name}”`,
    });
    onToast && onToast(`บันทึกโครงการ “${draft.name}” แล้ว`);
  };

  if (openRec) {
    return <DspDetail record={openRec} startEditing={startEditing}
                      onBack={() => { setOpenId(null); setStartEditing(false); }}
                      onSave={handleSave} />;
  }

  const activeCnt = window.dspActive(list, today).length;

  return (
    <div data-screen-label="หน้าค่าคงที่โครงการพักชำระหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่โครงการพักชำระหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดรายละเอียดโครงการ · ช่วงเวลา · และเงื่อนไขการเข้าร่วม — ใช้ในหน้าใบคำขอพักชำระหนี้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มโครงการ</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="calendar" /></div>
        <div>
          <div className="lt-ab-label">โครงการที่เปิดใช้งานและอยู่ในช่วงเวลา ณ {fmt.date(today)}</div>
          <div className="lt-ab-name">{activeCnt} โครงการ
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เลือกได้ในหน้าใบคำขอพักชำระหนี้</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>รหัส</th>
                <th style={{ minWidth: 240 }}>ชื่อโครงการ</th>
                <th style={{ width: 200 }}>ประเภท</th>
                <th style={{ width: 180 }}>ช่วงเวลาโครงการ</th>
                <th className="center" style={{ width: 110 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 76 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const t = window.dspType(r.type);
                const inWindow = (!r.settings.startDate || r.settings.startDate <= today) &&
                                 (!r.settings.endDate || r.settings.endDate >= today);
                const periodTxt = (r.settings.startDate ? fmt.date(r.settings.startDate) : '—') + ' – ' +
                                  (r.settings.endDate ? fmt.date(r.settings.endDate) : 'ไม่กำหนด');
                return (
                  <tr key={r.id} className={'clickable' + (r.enabled ? ' selected' : '')}
                      onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                    <td className="mono">{r.code}</td>
                    <td>
                      <div className="lt-row-name">{r.name}</div>
                      {r.note && <div className="lt-row-note muted">{r.note}</div>}
                    </td>
                    <td><span className={'chip ' + (r.type === 'debt-mgmt' ? 'warning' : r.type === 'guarantor-r' ? 'primary' : 'info')}>{t.l}</span></td>
                    <td>
                      <div style={{ fontSize: 12 }}>{periodTxt}</div>
                      {r.enabled && !inWindow && <div className="muted" style={{ fontSize: 10.5 }}>นอกช่วงเวลา</div>}
                    </td>
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
        <Icon name="info" size={12} /> เงื่อนไขของแต่ละโครงการจะถูกบังคับใช้เมื่อเลือกในหน้าใบคำขอพักชำระหนี้
      </div>

      {adding && <DspAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { DebtSuspensionProjectPage });
