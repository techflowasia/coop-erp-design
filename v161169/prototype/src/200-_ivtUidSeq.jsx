// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › ค่าคงที่ — กำหนดประเภทสินทรัพย์ลงทุน
//  รายการประเภทสินทรัพย์ ⇄ รายละเอียด (จัดกลุ่ม/ความเสี่ยง/เงื่อนไขการบันทึก)
// ════════════════════════════════════════════════════════════════════

let _ivtUidSeq = 0;
const ivtUid = () => 'IVT-N' + (++_ivtUidSeq);
const ivtToday = () => new Date().toISOString().slice(0, 10);
const IVT_USER = 'จันทร์เพ็ญ มาลี';

function ivtLoad() {
  try { const s = localStorage.getItem('invest_asset_types'); if (s) return JSON.parse(s).map(ivtNormalize); } catch (e) {}
  return window.IV_ASSET_TYPE_SEED.map(r => ({ ...r }));
}
// รองรับข้อมูลเก่าใน localStorage ที่ยังไม่มีฟิลด์ใหม่
const ivtNormalize = (r) => ({ valuationMode: 'value', needTerm: false, termUnits: [], ...r });
function ivtSaveLS(list) { try { localStorage.setItem('invest_asset_types', JSON.stringify(list)); } catch (e) {} }

const ivRiskPill = (risk) => {
  const r = window.IV_RISK[risk];
  return <span className={"pill " + (r ? r.pill : 'neutral')}>{risk}</span>;
};
const ivYesNo = (on) => on
  ? <span className="chip success"><span className="dot-c" />ต้องบันทึก</span>
  : <span className="muted">— ไม่บังคับ —</span>;

// ─── ฟิลด์ฟอร์ม ──────────────────────────────────────────────────────
function IvtField({ label, hint, children, span = 1 }) {
  return (
    <div className="dat-field" style={{ gridColumn: 'span ' + span }}>
      <label className="dat-label">{label}</label>
      {children}
      {hint && <div className="dat-hint">{hint}</div>}
    </div>
  );
}
function IvtSection({ icon, title, sub, children }) {
  return (
    <div className="search-card dat-section">
      <div className="dat-section-head">
        <span className="dat-section-ico"><Icon name={icon} size={15} /></span>
        <div>
          <div className="dat-section-title">{title}</div>
          {sub && <div className="muted" style={{ fontSize: 11.5 }}>{sub}</div>}
        </div>
      </div>
      <div className="dat-grid">{children}</div>
    </div>
  );
}
function IvtToggle({ on, onChange, disabled }) {
  return (
    <button type="button" className={"lt-switch" + (on ? ' on' : '')} role="switch" aria-checked={on}
            disabled={disabled} onClick={() => !disabled && onChange(!on)}>
      <span className="lt-switch-knob" />
    </button>
  );
}
const IvtRead = ({ children }) => <div className="dat-read">{children}</div>;

// แถวสวิตช์ + คำอธิบายสั้นในฟิลด์
function IvtFlagField({ label, hint, on, onText, offText, editing, onChange }) {
  return (
    <IvtField label={label} hint={hint}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IvtToggle on={on} disabled={!editing} onChange={onChange} />
        <span className="muted" style={{ fontSize: 12 }}>{on ? onText : offText}</span>
      </div>
    </IvtField>
  );
}

// บันทึกการลงทุนแบบ — มูลค่า (บาท) หรือ หน่วยลงทุน
function IvtValuationField({ value, editing, onChange }) {
  const modes = window.IV_VALUATION_MODES;
  const cur = modes[value] || modes.value;
  return (
    <IvtField label="บันทึกการลงทุนแบบ" hint={cur.hint} span={2}>
      {editing
        ? <div className="seg">{Object.keys(modes).map(k => (
            <button key={k} type="button" className={"seg-btn" + (value === k ? ' active' : '')} onClick={() => onChange(k)}>{modes[k].label}</button>))}</div>
        : <IvtRead><span className={"chip " + cur.pill}><span className="dot-c" />{cur.label}</span></IvtRead>}
    </IvtField>
  );
}

// หน่วยระยะเวลาที่เลือกได้ (วัน/เดือน/ปี)
function IvtTermUnitsField({ units, editing, onChange }) {
  const all = window.IV_TERM_UNITS;
  const list = units || [];
  const toggle = (u) => {
    const has = list.includes(u);
    const next = has ? list.filter(x => x !== u) : [...list, u];
    onChange(all.filter(x => next.includes(x)));
  };
  return (
    <IvtField label="หน่วยระยะเวลาที่เลือกได้" hint="หน่วยที่ผู้บันทึกเลือกได้เมื่อกรอกระยะเวลา/อายุของตราสาร" span={2}>
      {editing
        ? <div className="ivt-unit-group">{all.map(u => {
            const on = list.includes(u);
            return <button key={u} type="button" className={"ivt-unit-chip" + (on ? ' on' : '')} onClick={() => toggle(u)}>
              <Icon name={on ? 'check' : 'plus'} size={11} /> {u}</button>;
          })}</div>
        : <IvtRead>{list.length
            ? <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{list.map(u => <span key={u} className="chip info"><span className="dot-c" />{u}</span>)}</div>
            : '— ทุกหน่วย —'}</IvtRead>}
    </IvtField>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail / edit
// ════════════════════════════════════════════════════════════════════
function IvtDetail({ record, onBack, onSave, startEditing }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const cur = editing ? draft : record;
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save      = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  return (
    <div data-screen-label="หน้ารายละเอียดประเภทสินทรัพย์ลงทุน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {savedAt && !editing && <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>}
        {!editing
          ? <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ข้อมูล</button>
          : <>
              <button className="btn sm" onClick={cancel}>ยกเลิก</button>
              <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกข้อมูล</button>
            </>}
      </div>

      {/* หัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shares" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="cfg-input mono" style={{ width: 120 }} value={draft.code} placeholder="รหัส" onChange={(e) => set('code', e.target.value)} />
                <input className="cfg-input lt-name-input" style={{ flex: 1, minWidth: 240 }} value={draft.name} placeholder="ชื่อประเภทสินทรัพย์" onChange={(e) => set('name', e.target.value)} />
              </div>
            ) : (
              <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
            )}
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span><span className="dot" />
              <span>สร้าง {fmt.date(record.createdDate)} โดย {record.createdBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>{cur.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
            <IvtToggle on={cur.enabled} disabled={!editing} onChange={(v) => set('enabled', v)} />
          </div>
        </div>
      </div>

      {!cur.countLimit && (
        <div className="dat-warn">
          <Icon name="info" size={14} />
          <span>สินทรัพย์ประเภทนี้ตั้งค่า <b>ไม่นับรวมวงเงินลงทุนประจำปี</b> — รายการลงทุนจะไม่ถูกนำไปตรวจสอบกับเพดานวงเงินที่ประกาศไว้</span>
        </div>
      )}

      <div className="dat-cols">
        <IvtSection icon="shares" title="การจัดประเภท" sub="กลุ่มสินทรัพย์ ระดับความเสี่ยง และรูปแบบการบันทึกมูลค่า">
          <IvtField label="กลุ่มสินทรัพย์">
            {editing
              ? <select className="cfg-input" value={cur.group} onChange={(e) => set('group', e.target.value)}>
                  {window.IV_ASSET_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              : <IvtRead><span className="chip info"><span className="dot-c" />{cur.group}</span></IvtRead>}
          </IvtField>
          <IvtField label="ระดับความเสี่ยง">
            {editing
              ? <div className="seg">{Object.keys(window.IV_RISK).map(k => (
                  <button key={k} type="button" className={"seg-btn" + (cur.risk === k ? ' active' : '')} onClick={() => set('risk', k)}>{k}</button>))}</div>
              : <IvtRead>{ivRiskPill(cur.risk)}</IvtRead>}
          </IvtField>
          <IvtValuationField value={cur.valuationMode} editing={editing} onChange={(v) => set('valuationMode', v)} />
          <IvtFlagField label="นับรวมวงเงินลงทุนประจำปี" hint="นำมูลค่าลงทุนไปตรวจสอบกับเพดานวงเงินที่ประกาศ"
                        on={cur.countLimit} onText="นับรวม" offText="ไม่นับรวม" editing={editing}
                        onChange={(v) => set('countLimit', v)} />
        </IvtSection>

        <IvtSection icon="report" title="เงื่อนไขการบันทึกข้อมูล" sub="ฟิลด์ที่บังคับกรอกเมื่อบันทึกรายการลงทุนประเภทนี้">
          <IvtFlagField label="ต้องบันทึกวันครบกำหนด" hint="วันไถ่ถอน/ครบกำหนดของตราสาร"
                        on={cur.needMaturity} onText="บังคับกรอก" offText="ไม่บังคับ" editing={editing}
                        onChange={(v) => set('needMaturity', v)} />
          <IvtFlagField label="ต้องบันทึกอัตราดอกเบี้ย" hint="อัตราผลตอบแทน/คูปองต่อปี"
                        on={cur.needRate} onText="บังคับกรอก" offText="ไม่บังคับ" editing={editing}
                        onChange={(v) => set('needRate', v)} />
          <IvtFlagField label="ต้องบันทึกมูลค่าตลาด" hint="Mark-to-market / NAV ณ วันประเมิน"
                        on={cur.needMarketValue} onText="บังคับกรอก" offText="ไม่บังคับ" editing={editing}
                        onChange={(v) => set('needMarketValue', v)} />
          <IvtFlagField label="กำหนดระยะเวลา/อายุตราสาร" hint="สำหรับบัตรเงินฝาก ตั๋วสัญญาใช้เงิน เงินฝากประจำ ฯลฯ"
                        on={cur.needTerm} onText="กำหนดได้" offText="ไม่กำหนด" editing={editing}
                        onChange={(v) => set('needTerm', v)} />
          {cur.needTerm && (
            <IvtTermUnitsField units={cur.termUnits} editing={editing} onChange={(v) => set('termUnits', v)} />
          )}
        </IvtSection>

        <div style={{ gridColumn: '1 / -1' }}>
          <IvtSection icon="info" title="หมายเหตุ" sub="คำอธิบายเพิ่มเติมของประเภทสินทรัพย์">
            <IvtField label="หมายเหตุ" span={2}>
              {editing
                ? <input className="cfg-input" value={cur.note} onChange={(e) => set('note', e.target.value)} placeholder="คำอธิบายประกอบ (ไม่บังคับ)" />
                : <IvtRead>{cur.note || '—'}</IvtRead>}
            </IvtField>
          </IvtSection>
        </div>
      </div>
    </div>
  );
}

// ─── Add modal ───────────────────────────────────────────────────────
function IvtAddModal({ list, onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState(window.IV_ASSET_GROUPS[0]);
  const [risk, setRisk] = useState('ปานกลาง');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) return setError('กรุณาระบุรหัสประเภทสินทรัพย์');
    if (!name.trim()) return setError('กรุณาระบุชื่อประเภทสินทรัพย์');
    if (list.some(r => r.code === code.trim())) return setError('รหัสนี้ถูกใช้แล้ว');
    onCreate({
      id: ivtUid(), code: code.trim().toUpperCase(), name: name.trim(), group, risk,
      countLimit: true, needMaturity: false, needRate: false, needMarketValue: false,
      valuationMode: 'value', needTerm: false, termUnits: [],
      enabled: false, createdDate: ivtToday(), createdBy: IVT_USER, note: '',
    });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มประเภทสินทรัพย์ลงทุน</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างประเภทใหม่ — ปิดใช้งานไว้จนกว่าจะตั้งค่าครบ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัส <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} autoFocus placeholder="เช่น REIT" onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อประเภทสินทรัพย์ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} placeholder="เช่น ทรัสต์เพื่อการลงทุนในอสังหาฯ" onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">กลุ่มสินทรัพย์</label>
              <select className="cfg-input" value={group} onChange={(e) => setGroup(e.target.value)}>
                {window.IV_ASSET_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="lt-modal-label">ระดับความเสี่ยง</label>
              <select className="cfg-input" value={risk} onChange={(e) => setRisk(e.target.value)}>
                {Object.keys(window.IV_RISK).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> สร้างประเภทสินทรัพย์</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
function InvestAssetTypeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ivtLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [groupFilter, setGroupFilter] = useState('');
  const persist = (next) => { setList(next); ivtSaveLS(next); };
  const openRec = list.find(r => r.id === openId);
  const activeCount = list.filter(r => r.enabled).length;

  const handleCreate = (rec) => {
    persist([rec, ...list]);
    audit.log({ action: 'create', module: 'การเงินการลงทุน — ค่าคงที่ประเภทสินทรัพย์',
      target: `${rec.code} · ${rec.name}`, summary: `เพิ่มประเภทสินทรัพย์ลงทุน “${rec.name}”`,
      changes: [{ field: 'รหัส', before: '—', after: rec.code }] });
    setAdding(false); onToast && onToast(`สร้างประเภทสินทรัพย์ “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true); setOpenId(rec.id);
  };
  const handleSave = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่ประเภทสินทรัพย์',
      target: `${draft.code} · ${draft.name}`, summary: `แก้ไขประเภทสินทรัพย์ “${draft.name}”` });
    onToast && onToast(`บันทึกประเภทสินทรัพย์ “${draft.name}” เรียบร้อยแล้ว`);
  };
  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่ประเภทสินทรัพย์', target: `${rec.code} · ${rec.name}`,
      summary: (rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งานประเภทสินทรัพย์ “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: rec.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน', after: rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }] });
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งาน “${rec.name}” แล้ว`);
  };

  if (openRec) return <IvtDetail record={openRec} startEditing={startEditing}
    onBack={() => { setOpenId(null); setStartEditing(false); }} onSave={handleSave} />;

  const shown = groupFilter ? list.filter(r => r.group === groupFilter) : list;

  return (
    <div data-screen-label="หน้าค่าคงที่ประเภทสินทรัพย์ลงทุน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ประเภทสินทรัพย์ลงทุน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กำหนดประเภทสินทรัพย์ลงทุน กลุ่มสินทรัพย์ ระดับความเสี่ยง และเงื่อนไขการบันทึกข้อมูล</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มประเภทสินทรัพย์</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="shares" /></div>
        <div>
          <div className="lt-ab-label">ประเภทสินทรัพย์ลงทุนทั้งหมด</div>
          <div className="lt-ab-name">{list.length} ประเภท
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 10 }}>
        <button className={"filter-chip" + (groupFilter === '' ? ' active' : '')} onClick={() => setGroupFilter('')}>ทุกกลุ่ม</button>
        {window.IV_ASSET_GROUPS.map(g => (
          <button key={g} className={"filter-chip" + (groupFilter === g ? ' active' : '')} onClick={() => setGroupFilter(groupFilter === g ? '' : g)}>
            {g} <span className="count">{list.filter(r => r.group === g).length}</span>
          </button>
        ))}
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1240 }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>รหัส</th>
                <th style={{ minWidth: 220 }}>ชื่อประเภทสินทรัพย์</th>
                <th style={{ width: 110 }}>กลุ่ม</th>
                <th className="center" style={{ width: 90 }}>ความเสี่ยง</th>
                <th className="center" style={{ width: 92 }}>บันทึกแบบ</th>
                <th className="center" style={{ width: 90 }}>นับวงเงิน</th>
                <th className="center" style={{ width: 80 }}>วันครบกำหนด</th>
                <th className="center" style={{ width: 80 }}>ดอกเบี้ย</th>
                <th className="center" style={{ width: 80 }}>มูลค่าตลาด</th>
                <th className="center" style={{ width: 130 }}>ระยะเวลา</th>
                <th className="center" style={{ width: 90 }}>สถานะ</th>
                <th className="center" style={{ width: 70 }}>ใช้งาน</th>
                <th className="center" style={{ width: 64 }} />
              </tr>
            </thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id} className={"clickable" + (r.enabled ? ' selected' : '')}
                    onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                  <td className="mono">{r.code}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td><span className="muted" style={{ fontSize: 12 }}>{r.group}</span></td>
                  <td className="center">{ivRiskPill(r.risk)}</td>
                  <td className="center">{(() => { const m = window.IV_VALUATION_MODES[r.valuationMode] || window.IV_VALUATION_MODES.value; return <span className={"chip " + m.pill}>{m.short}</span>; })()}</td>
                  <td className="center">{r.countLimit ? <Icon name="check" size={14} /> : <span className="muted">—</span>}</td>
                  <td className="center">{r.needMaturity ? <Icon name="check" size={14} /> : <span className="muted">—</span>}</td>
                  <td className="center">{r.needRate ? <Icon name="check" size={14} /> : <span className="muted">—</span>}</td>
                  <td className="center">{r.needMarketValue ? <Icon name="check" size={14} /> : <span className="muted">—</span>}</td>
                  <td className="center">{r.needTerm
                    ? <span className="mono" style={{ fontSize: 11.5 }}>{(r.termUnits && r.termUnits.length) ? r.termUnits.join(' / ') : 'ทุกหน่วย'}</span>
                    : <span className="muted">—</span>}</td>
                  <td className="center">{r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}</td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled} onClick={() => toggle(r)}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn ghost sm" onClick={() => { setStartEditing(false); setOpenId(r.id); }}>เปิด <Icon name="chevRight" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เครื่องหมาย ✓ ในคอลัมน์ “วันครบกำหนด / ดอกเบี้ย / มูลค่าตลาด” หมายถึงฟิลด์ที่บังคับกรอกเมื่อบันทึกรายการลงทุนของประเภทนั้น
      </div>

      {adding && <IvtAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { InvestAssetTypeConfigPage });
