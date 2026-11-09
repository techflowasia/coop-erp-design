// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ข้อกำหนดสินเชื่อ — LoanTermsConfigPage
//  master list (รายการ/เวอร์ชัน) → settings editor
//  · เปิดบังคับใช้ได้ครั้งละ 1 รายการ  · ลบไม่ได้
// ════════════════════════════════════════════════════════════════════

// uid ใหม่สำหรับรายการที่สร้างเพิ่ม
let _ltUidSeq = 0;
const ltUid = () => 'LT-N' + (++_ltUidSeq);
const ltToday = () => new Date().toISOString().slice(0, 10);

// ─── โหลด/บันทึก รายการลง localStorage ──────────────────────────────
function ltLoad() {
  try {
    const saved = localStorage.getItem('loan_terms');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.LT_SEED.map(r => ({ ...r }));
}
function ltSave(list) {
  try { localStorage.setItem('loan_terms', JSON.stringify(list)); } catch (e) {}
}

// ════════════════════════════════════════════════════════════════════
//  Field primitives — view/edit aware
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//  Dense two-column form primitives — label ซ้าย / ค่าขวา (view/edit)
// ════════════════════════════════════════════════════════════════════
function L2Group({ title, action, children }) {
  return (
    <div className="l2-group">
      <div className="l2-gh"><span className="l2-gh-t">{title}</span>{action}</div>
      {children}
    </div>
  );
}
function L2Row({ label, indent, children }) {
  return (
    <div className={"l2-row" + (indent ? ' indent' : '')}>
      <div className="l2-label">{label}</div>
      <div className="l2-ctrl">{children}</div>
    </div>
  );
}
function L2Num({ v, editing, onChange, decimals, suffix, disabled }) {
  if (!editing) {
    return (
      <div className="l2-val num">
        {decimals != null ? fmt.money(Number(v || 0), decimals) : (v === '' ? '—' : v)}
        {suffix ? <span className="l2-suf"> {suffix}</span> : null}
      </div>
    );
  }
  return (
    <div className="l2-inwrap">
      <input className="l2-input num" type="number" inputMode="decimal" disabled={disabled}
             step={decimals ? '0.01' : '1'} value={v}
             onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="l2-suf">{suffix}</span>}
    </div>
  );
}
function L2Sel({ group, v, editing, onChange }) {
  if (!editing) return <div className="l2-val">{window.ltLabel(group, v)}</div>;
  return (
    <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>
      {window.LT_OPTS[group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function L2Txt({ v, editing, onChange, center, placeholder }) {
  if (!editing) return <div className={"l2-val mono" + (center ? ' center' : '')}>{v || '—'}</div>;
  return (
    <input className={"l2-input mono" + (center ? ' center' : '')} value={v || ''}
           placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}
// ฟิลด์ระบบกำหนด — พื้นหลังสีเทา กรอกไม่ได้
function L2Dis({ v }) {
  return <div className="l2-input dis" title="ระบบกำหนดอัตโนมัติ">{v || '—'}</div>;
}
// checkbox + ช่องตัวเลข (การค้ำประกัน)
function L2GuarRow({ label, on, v, editing, suffix, onToggle, onValue }) {
  return (
    <L2Row label={
      <label className="l2-check">
        <input type="checkbox" className="ct-check" checked={on} disabled={!editing}
               onChange={(e) => onToggle(e.target.checked)} />
        {label}
      </label>
    }>
      {editing ? (
        <div className="l2-inwrap">
          <input className="l2-input num" type="number" disabled={!on}
                 value={v} onChange={(e) => onValue(e.target.value)} />
          <span className="l2-suf">{suffix}</span>
        </div>
      ) : (
        <div className="l2-val num">{on ? v : '—'}<span className="l2-suf"> {suffix}</span></div>
      )}
    </L2Row>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Settings editor — ฟอร์มข้อกำหนดทั้งหมด (สองคอลัมน์ เห็นครบไม่ต้องเลื่อน)
// ════════════════════════════════════════════════════════════════════
function LtSettingsEditor({ record, editing, onChange }) {
  const s = record.settings;
  const set = (k, v) => onChange({ ...s, [k]: v });

  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        {/* ── คอลัมน์ซ้าย ── */}
        <div className="l2-col">
          <L2Group title="ข้อกำหนดเงินกู้">
            <L2Row label="จำนวนเงินกู้สูงสุด">
              <L2Num v={s.maxLoanAmount} editing={editing} decimals={2}
                     onChange={(v) => set('maxLoanAmount', v)} />
            </L2Row>
          </L2Group>

          <L2Group title="รูปแบบเลขสัญญา">
            <L2Row label="ปีในเลขสัญญา">
              <L2Sel group="yearMode" v={s.contractYearMode} editing={editing}
                     onChange={(v) => set('contractYearMode', v)} />
            </L2Row>
            <L2Row label="เดือนในเลขสัญญา">
              <L2Sel group="monthMode" v={s.contractMonthMode} editing={editing}
                     onChange={(v) => set('contractMonthMode', v)} />
            </L2Row>
            <L2Row label="รูปแบบเลขที่สัญญา">
              <L2Txt v={s.contractPattern} editing={editing} placeholder="PP-YY-RRRRR"
                     onChange={(v) => set('contractPattern', v)} />
            </L2Row>
          </L2Group>

          <L2Group title="การนับวันการคิด ด/บ">
            <L2Row label="จำนวนวันในรอบปี">
              <L2Num v={s.daysInYear} editing={editing} onChange={(v) => set('daysInYear', v)} />
            </L2Row>
            <L2Row label="รูปแบบการดูอัตรา ด/บ">
              <L2Sel group="rateView" v={s.rateViewMode} editing={editing}
                     onChange={(v) => set('rateViewMode', v)} />
            </L2Row>
            <L2Row label="รับเงินกู้งวดแรกคิด ด/บ เพิ่ม/ลด (วัน)">
              <L2Num v={s.firstInstallmentAdjust} editing={editing}
                     onChange={(v) => set('firstInstallmentAdjust', v)} />
            </L2Row>
            <L2Row label="ชำระหมดคิด ด/บ เพิ่ม/ลด (วัน)">
              <L2Sel group="payoffAdjust" v={s.payoffAdjust} editing={editing}
                     onChange={(v) => set('payoffAdjust', v)} />
            </L2Row>
          </L2Group>

          <L2Group title="รูปแบบการปัดเศษ ด/บ">
            <L2Row label="การปัดทศนิยมหลักที่ 4">
              <L2Sel group="decimal4" v={s.decimal4Rounding} editing={editing}
                     onChange={(v) => set('decimal4Rounding', v)} />
            </L2Row>
            <L2Row label="รูปแบบการปัดเศษสตางค์">
              <L2Sel group="satang" v={s.satangRounding} editing={editing}
                     onChange={(v) => set('satangRounding', v)} />
            </L2Row>
            <L2Row label="ตารางการปัดเศษสตางค์">
              <L2Dis v="" />
            </L2Row>
            <L2Row label="การปัดเศษสตางค์ ด/บ หลายขั้น">
              <L2Sel group="multiLayer" v={s.multiLayerRounding} editing={editing}
                     onChange={(v) => set('multiLayerRounding', v)} />
            </L2Row>
            <L2Row label="จำนวนหลักทศนิยมที่ใช้">
              <L2Num v={s.decimalDigits} editing={editing} onChange={(v) => set('decimalDigits', v)} />
            </L2Row>
          </L2Group>
        </div>

        {/* ── คอลัมน์ขวา ── */}
        <div className="l2-col">
          <L2Group title="การค้ำประกัน">
            <L2GuarRow label="ไม่เกินสัญญา" on={s.guarLimitContractOn} v={s.guarLimitContractValue}
                       editing={editing} suffix="สัญญา"
                       onToggle={(v) => set('guarLimitContractOn', v)}
                       onValue={(v) => set('guarLimitContractValue', v)} />
            <L2GuarRow label="ไม่เกินคน" on={s.guarLimitPersonOn} v={s.guarLimitPersonValue}
                       editing={editing} suffix="คน"
                       onToggle={(v) => set('guarLimitPersonOn', v)}
                       onValue={(v) => set('guarLimitPersonValue', v)} />
          </L2Group>

          <L2Group title="การโอนสัญญาให้ผู้ค้ำ" action={
            <label className="l2-check sm">
              <input type="checkbox" className="ct-check" checked={s.transferSeparateReceipt}
                     disabled={!editing}
                     onChange={(e) => set('transferSeparateReceipt', e.target.checked)} />
              หนี้รับโอนเรียกเก็บแยกใบเสร็จ
            </label>
          }>
            <L2Row label="รูปแบบการแบ่งยอดหนี้">
              <L2Sel group="debtSplit" v={s.transferDebtSplit} editing={editing}
                     onChange={(v) => set('transferDebtSplit', v)} />
            </L2Row>
            <L2Row label="รูปแบบเลขสัญญารับโอน">
              <L2Sel group="transferContractNo" v={s.transferContractNoMode} editing={editing}
                     onChange={(v) => set('transferContractNoMode', v)} />
            </L2Row>
            <L2Row label="สัญญาใหม่อ้างอิงเงินกู้ประเภท">
              <L2Dis v={s.transferReferLoanType} />
            </L2Row>
          </L2Group>

          <L2Group title="การชำระแบบคงยอด">
            <div className="l2-subhead">งวดแรก</div>
            <L2Row label="ถ้า ด/บ เกินเดือน เก็บเงินต้น" indent>
              <L2Sel group="interestOverMonth" v={s.firstInterestOverMonth} editing={editing}
                     onChange={(v) => set('firstInterestOverMonth', v)} />
            </L2Row>
            <L2Row label="กรณีลดต้นแล้วติดลบ" indent>
              <L2Dis v={s.firstNegativeAdjust} />
            </L2Row>
            <div className="l2-subhead">งวดถัดไป</div>
            <L2Row label="ถ้า ด/บ เกินเดือน เก็บเงินต้น" indent>
              <L2Sel group="interestOverMonth" v={s.nextInterestOverMonth} editing={editing}
                     onChange={(v) => set('nextInterestOverMonth', v)} />
            </L2Row>
            <L2Row label="กรณีลดต้นแล้วติดลบ" indent>
              <L2Dis v={s.nextNegativeAdjust} />
            </L2Row>
            <L2Row label="การประมาณ ด/บ แบบคงยอด">
              <L2Sel group="fixedEstimate" v={s.fixedEstimateMode} editing={editing}
                     onChange={(v) => set('fixedEstimateMode', v)} />
            </L2Row>
          </L2Group>

          <L2Group title="อื่นๆ">
            <L2Row label="กู้ใหม่หลังจัดเก็บคิด ด/บ ล่วงหน้า">
              <L2Sel group="prepay" v={s.prepayAfterNew} editing={editing}
                     onChange={(v) => set('prepayAfterNew', v)} />
            </L2Row>
            <L2Row label="การประมวลผลคืนเงินที่ให้สมาชิก">
              <L2Sel group="refund" v={s.refundProcessing} editing={editing}
                     onChange={(v) => set('refundProcessing', v)} />
            </L2Row>
          </L2Group>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail page — header + editor (view/edit toggle)
// ════════════════════════════════════════════════════════════════════
function LtDetail({ record, onBack, onSave, startEditing, onMode }) {
  const [editing, setEditing] = useState(!!startEditing);
  useEffect(() => { onMode && onMode(editing ? 'edit' : 'view'); }, [editing]);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);

  // sync ถ้า record ภายนอกเปลี่ยน (เช่น toggle บังคับใช้)
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save = () => {
    onSave(draft);
    setSavedAt(new Date());
    setEditing(false);
  };

  const cur = editing ? draft : record;

  return (
    <div data-screen-label="หน้ารายละเอียดข้อกำหนดสินเชื่อ">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}>
          <Icon name="chevLeft" /> กลับสู่รายการ
        </button>
        <span className="spacer" />
        {savedAt && !editing && (
          <span className="chip success">
            <Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}
          </span>
        )}
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}>
            <Icon name="edit" /> แก้ไขข้อกำหนด
          </button>
        ) : (
          <>
            <button className="btn sm" data-discard="1" onClick={cancel}>ละทิ้ง</button>
            <button className="btn primary sm" onClick={save}>
              <Icon name="check" /> บันทึกข้อกำหนด
            </button>
          </>
        )}
      </div>

      {/* การ์ดหัวเรื่อง: ชื่อ + วันที่ + สถานะ */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="loans" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '170px 170px 170px minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                <div>
                  <label className="lt-modal-label">รหัสข้อกำหนดสินเชื่อ <span className="cfg-required">*</span></label>
                  <input className="cfg-input mono" value={draft.code ?? draft.id} disabled style={{ width: '100%', background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                </div>
                <div style={{ gridColumn: '2 / -1' }}>
                  <label className="lt-modal-label">ชื่อข้อกำหนดสินเชื่อ <span className="cfg-required">*</span></label>
                  <input className="cfg-input" style={{ width: '100%' }} value={draft.name} placeholder="ชื่อข้อกำหนดสินเชื่อ"
                         onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div>
                  <label className="lt-modal-label">วันที่สร้าง</label>
                  <ErpDate value={record.createdDate} disabled className="cfg-input" />
                </div>
                <div>
                  <label className="lt-modal-label">วันที่มีผลบังคับใช้ <span className="cfg-required">*</span></label>
                  <ErpDate value={draft.effectiveDate} onChange={(v) => setDraft(d => ({ ...d, effectiveDate: v }))} className="cfg-input" />
                </div>
                <div style={{ gridColumn: '3 / -1' }}>
                  <label className="lt-modal-label">หมายเหตุ</label>
                  <input className="cfg-input" style={{ width: '100%' }} value={draft.note || ''} placeholder="หมายเหตุประกอบรายการ"
                         onChange={(e) => setDraft(d => ({ ...d, note: e.target.value }))} />
                </div>
              </div>
            ) : (
              <>
                <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code || record.id}</span> · {record.name}</h1>
                <div className="lt-head-meta">
                  <span>วันที่สร้าง: {fmt.date(record.createdDate)}</span>
                  <span className="dot" />
                  <span>วันที่มีผลบังคับใช้: {fmt.date(record.effectiveDate)}</span>
                  <span className="dot" />
                  <span>หมายเหตุ: {record.note || '—'}</span>
                </div>
              </>
            )}
          </div>
          {!editing && (record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>)}
        </div>

      </div>

      <LtSettingsEditor record={cur} editing={editing}
                        onChange={(settings) => setDraft(d => ({ ...d, settings }))} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal — ชื่อ + วันที่มีผลบังคับใช้ + เริ่มจาก
// ════════════════════════════════════════════════════════════════════
function LtAddModal({ list, onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [effDate, setEffDate] = useState(ltToday());
  const [note, setNote] = useState('');
  const [copyFrom, setCopyFrom] = useState('__default');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณาระบุรหัสข้อกำหนดสินเชื่อ'); return; }
    if (list.some(r => (r.code || r.id) === code.trim())) { setError('รหัสข้อกำหนดสินเชื่อนี้มีอยู่แล้ว'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อข้อกำหนดสินเชื่อ'); return; }
    if (!effDate)     { setError('กรุณาระบุวันที่มีผลบังคับใช้'); return; }
    const base = copyFrom === '__default'
      ? { ...window.LT_SETTINGS_DEFAULTS }
      : { ...(list.find(r => r.id === copyFrom)?.settings || window.LT_SETTINGS_DEFAULTS) };
    onCreate({
      id: ltUid(),
      code: code.trim(),
      name: name.trim(),
      createdDate: ltToday(),
      effectiveDate: effDate,
      enabled: false,
      createdBy: 'จันทร์เพ็ญ มาลี',
      note: note.trim(),
      settings: base,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480, overflow: 'visible' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มค่าคงที่ข้อกำหนดสินเชื่อ</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างรายการใหม่ — ยังไม่บังคับใช้จนกว่าจะเปิดสถานะ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">รหัสข้อกำหนดสินเชื่อ <span className="cfg-required">*</span></label>
          <input className="cfg-input mono" value={code} autoFocus placeholder="เช่น LT-2571"
                 onChange={(e) => { setCode(e.target.value); setError(''); }} />

          <label className="lt-modal-label" style={{ marginTop: 12 }}>ชื่อข้อกำหนดสินเชื่อ <span className="cfg-required">*</span></label>
          <input className="cfg-input" value={name}
                 placeholder="เช่น ข้อกำหนดสินเชื่อ ปีบัญชี 2571"
                 onChange={(e) => { setName(e.target.value); setError(''); }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">วันที่สร้าง</label>
              <ErpDate value={ltToday()} disabled className="cfg-input" />
            </div>
            <div>
              <label className="lt-modal-label">วันที่มีผลบังคับใช้ <span className="cfg-required">*</span></label>
              <ErpDate value={effDate} onChange={(v) => ((e) => { setEffDate(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>เริ่มจาก</label>
          <select className="filter-select" style={{ width: '100%' }} value={copyFrom}
                  onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="__default">ค่าเริ่มต้นของระบบ</option>
            {list.map(r => <option key={r.id} value={r.id}>คัดลอกจาก: {r.name}</option>)}
          </select>

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
//  Toggle confirm modal — เปิดบังคับใช้ (จะปิดของเดิม)
// ════════════════════════════════════════════════════════════════════
function LtToggleModal({ target, current, turningOn, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการบังคับใช้' : 'ปิดการบังคับใช้'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {turningOn ? (
            <p className="lt-confirm-text">
              เปิดบังคับใช้ <b>“{target.name}”</b> (มีผลตั้งแต่ {fmt.date(target.effectiveDate)})
              {current && current.id !== target.id ? (
                <> ระบบจะ<b>ปิดการบังคับใช้</b>ของ “{current.name}” โดยอัตโนมัติ
                เนื่องจากเปิดบังคับใช้ได้ครั้งละ 1 รายการเท่านั้น</>
              ) : null}
            </p>
          ) : (
            <p className="lt-confirm-text">
              ปิดบังคับใช้ <b>“{target.name}”</b> หลังจากนี้จะ<b>ไม่มีข้อกำหนดสินเชื่อใดบังคับใช้</b>
              จนกว่าจะเปิดรายการใดรายการหนึ่ง — แนะนำให้เปิดรายการที่ต้องการแทน
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className={"btn " + (turningOn ? 'primary' : 'danger')}
                    style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
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
function LoanTermsConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ltLoad);
  const [openId, setOpenId] = useState(null);    // null = list view
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);  // { rec, turningOn }

  const persist = (next) => { setList(next); ltSave(next); };
  const active = list.find(r => r.enabled);
  const openRec = list.find(r => r.id === openId);
  const [dMode, setDMode] = useState('view');
  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3('ข้อกำหนดสินเชื่อ', openRec ? dMode : 'list',
      () => { setOpenId(null); setStartEditing(false); }),
    [openId, dMode]
  );

  // เปิด/ปิดบังคับใช้ — เปิดได้ครั้งละ 1 รายการ
  const applyToggle = () => {
    const { rec, turningOn } = toggleTarget;
    const next = list.map(r => {
      if (turningOn) return { ...r, enabled: r.id === rec.id };
      return r.id === rec.id ? { ...r, enabled: false } : r;
    });
    persist(next);
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่ข้อกำหนดสินเชื่อ',
      target: `${rec.id} · ${rec.name}`,
      summary: turningOn ? `เปิดการบังคับใช้ข้อกำหนดสินเชื่อ “${rec.name}”`
                         : `ปิดการบังคับใช้ข้อกำหนดสินเชื่อ “${rec.name}”`,
      changes: [{ field: 'การบังคับใช้', before: turningOn ? 'ไม่บังคับใช้' : 'บังคับใช้อยู่',
                  after: turningOn ? 'บังคับใช้อยู่' : 'ไม่บังคับใช้' }],
    });
    onToast && onToast(turningOn
      ? `เปิดบังคับใช้ “${rec.name}” เรียบร้อยแล้ว`
      : `ปิดบังคับใช้ “${rec.name}” เรียบร้อยแล้ว`);
    setToggleTarget(null);
  };

  const handleCreate = (rec) => {
    persist([rec, ...list]);
    audit.log({
      action: 'create', module: 'สินเชื่อ — ค่าคงที่ข้อกำหนดสินเชื่อ',
      target: `${rec.id} · ${rec.name}`,
      summary: `เพิ่มค่าคงที่ข้อกำหนดสินเชื่อ “${rec.name}” (มีผล ${fmt.date(rec.effectiveDate)})`,
      changes: [{ field: 'ชื่อค่าคงที่', before: '—', after: rec.name }],
    });
    setAdding(false);
    onToast && onToast(`สร้างรายการ “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true);
    setOpenId(rec.id);
  };

  const handleSaveDetail = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่ข้อกำหนดสินเชื่อ',
      target: `${draft.id} · ${draft.name}`,
      summary: `แก้ไขข้อกำหนดสินเชื่อ “${draft.name}”`,
    });
    onToast && onToast(`บันทึกข้อกำหนด “${draft.name}” เรียบร้อยแล้ว`);
  };

  // ─── Detail view ──────────────────────────────────────────────────
  if (openRec) {
    return (
      <>
        <LtDetail record={openRec}
                  startEditing={startEditing} onMode={setDMode}
                  onBack={() => { setOpenId(null); setStartEditing(false); }}
                  onSave={handleSaveDetail} />
      </>
    );
  }

  // ─── List view ────────────────────────────────────────────────────
  return (
    <div data-screen-label="หน้าค่าคงที่ข้อกำหนดสินเชื่อ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ข้อกำหนดสินเชื่อ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เก็บข้อกำหนดสินเชื่อเป็นรายการ — กำหนดวันที่มีผลบังคับใช้ และเปิดบังคับใช้ได้ครั้งละ 1 รายการ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}>
          <Icon name="plus" /> เพิ่มข้อกำหนดสินเชื่อ
        </button>
      </div>

      {/* แถบสรุปรายการที่บังคับใช้อยู่ */}
      <div className={"lt-active-banner" + (active ? '' : ' none')}>
        <div className="lt-ab-ico"><Icon name={active ? 'shield' : 'info'} /></div>
        {active ? (
          <div>
            <div className="lt-ab-label">ข้อกำหนดที่บังคับใช้อยู่ในปัจจุบัน</div>
            <div className="lt-ab-name">{active.name}
              <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · มีผลตั้งแต่ {fmt.date(active.effectiveDate)}</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="lt-ab-label">ยังไม่มีข้อกำหนดสินเชื่อบังคับใช้</div>
            <div className="lt-ab-name" style={{ fontSize: 13, fontWeight: 500 }}>เปิดบังคับใช้รายการใดรายการหนึ่งเพื่อให้ระบบนำไปใช้คำนวณ</div>
          </div>
        )}
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 160 }}>รหัสข้อกำหนดสินเชื่อ</th>
                <th style={{ minWidth: 240 }}>ชื่อข้อกำหนดสินเชื่อ</th>
                <th style={{ width: 120 }}>วันที่สร้าง</th>
                <th style={{ width: 140 }}>วันที่มีผลบังคับใช้</th>
                <th className="center" style={{ width: 110 }}>สถานะ</th>
                <th className="center" style={{ width: 110 }}>ใช้งาน</th>
                <th className="center" style={{ width: 84 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className={"clickable" + (r.enabled ? ' selected' : '')}
                    onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                  <td className="mono">{r.code || r.id}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td>{fmt.date(r.createdDate)}</td>
                  <td>{fmt.date(r.effectiveDate)}</td>
                  <td className="center">
                    {r.enabled
                      ? <span className="pill ok">เปิดใช้งาน</span>
                      : <span className="pill neutral">ปิดใช้งาน</span>}
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')}
                            role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดบังคับใช้' : 'เปิดบังคับใช้'}
                            onClick={() => setToggleTarget({ rec: r, turningOn: !r.enabled })}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn sm"
                            onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                      <Icon name="eye" size={13} /> ดู
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> รายการข้อกำหนดสินเชื่อไม่สามารถลบได้ — เก็บไว้เป็นประวัติเพื่อการตรวจสอบย้อนหลัง
      </div>

      {adding && <LtAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
      {toggleTarget && (
        <LtToggleModal target={toggleTarget.rec} current={active} turningOn={toggleTarget.turningOn}
                       onClose={() => setToggleTarget(null)} onConfirm={applyToggle} />
      )}
    </div>
  );
}

Object.assign(window, { LoanTermsConfigPage });
