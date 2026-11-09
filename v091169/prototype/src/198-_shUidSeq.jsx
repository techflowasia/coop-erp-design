// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ข้อกำหนดประเภทหุ้น — ShareTermsConfigPage
//  master list (ประเภทหุ้น) → detail editor (2 tabs: รายละเอียด / การส่งหุ้นขั้นต่ำรายเดือน)
//  ระบบงานประมวลผลและจัดเก็บ › ค่าคงที่
// ════════════════════════════════════════════════════════════════════

// uid + วันที่
let _shUidSeq = 0;
const shUid = () => 'SH-N' + (++_shUidSeq);
const shToday = () => new Date().toISOString().slice(0, 10);

// ─── โหลด/บันทึก รายการลง localStorage ──────────────────────────────
function shLoad() {
  try {
    const saved = localStorage.getItem('share_terms');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.SH_SEED || []).map(r => ({ ...r, settings: { ...r.settings }, tiers: r.tiers.map(t => ({ ...t })) }));
}
function shSave(list) {
  try { localStorage.setItem('share_terms', JSON.stringify(list)); } catch (e) {}
}

// ════════════════════════════════════════════════════════════════════
//  Dense two-column form primitives (label ซ้าย / ค่าขวา) — view/edit
// ════════════════════════════════════════════════════════════════════
function S2Group({ title, children }) {
  return (
    <div className="l2-group">
      <div className="l2-gh"><span className="l2-gh-t">{title}</span></div>
      {children}
    </div>
  );
}
function S2Row({ label, indent, children }) {
  return (
    <div className={"l2-row" + (indent ? ' indent' : '')}>
      <div className="l2-label">{label}</div>
      <div className="l2-ctrl">{children}</div>
    </div>
  );
}
function S2Num({ v, editing, onChange, decimals, suffix, disabled }) {
  if (!editing || disabled) {
    return (
      <div className={"l2-val num" + (disabled ? ' dis-val' : '')}>
        {v === '' || v == null ? '—' : (decimals != null ? fmt.money(Number(v || 0), decimals) : fmt.money(Number(v || 0), 0))}
        {suffix ? <span className="l2-suf"> {suffix}</span> : null}
      </div>
    );
  }
  return (
    <div className="l2-inwrap">
      <input className="l2-input num" type="number" inputMode="decimal"
             step={decimals ? '0.01' : '1'} value={v}
             onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="l2-suf">{suffix}</span>}
    </div>
  );
}
function S2Sel({ group, v, editing, onChange }) {
  if (!editing) return <div className="l2-val">{window.shLabel(group, v)}</div>;
  return (
    <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>
      {window.SH_OPTS[group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Tab 1 — รายละเอียด (สองคอลัมน์ เห็นครบไม่ต้องเลื่อน)
// ════════════════════════════════════════════════════════════════════
function ShDetailTab({ record, editing, onChange }) {
  const s = record.settings;
  const set = (k, v) => onChange({ ...s, [k]: v });
  const isSeparate = s.changeCountType === 'separate';
  const isCombined = s.changeCountType === 'combined';

  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        {/* ── คอลัมน์ซ้าย ── */}
        <div className="l2-col">
          <S2Group title="รายละเอียดหุ้น">
            <S2Row label="กลุ่มของหุ้น">
              <S2Sel group="shareGroup" v={s.shareGroup} editing={editing}
                     onChange={(v) => set('shareGroup', v)} />
            </S2Row>
            <S2Row label="มูลค่า/หุ้น">
              <S2Num v={s.parValue} editing={editing} decimals={2} suffix="บาท"
                     onChange={(v) => set('parValue', v)} />
            </S2Row>
            <S2Row label="การใช้หุ้นคำนวณสิทธิเงินกู้">
              <S2Sel group="useForLoanRight" v={s.useForLoanRight} editing={editing}
                     onChange={(v) => set('useForLoanRight', v)} />
            </S2Row>
          </S2Group>

          <S2Group title="การถือครองหุ้น">
            <S2Row label="จำนวนหุ้นขั้นต่ำที่ต้องถือ">
              <S2Num v={s.minHold} editing={editing} decimals={2} suffix="หุ้น"
                     onChange={(v) => set('minHold', v)} />
            </S2Row>
            <S2Row label="จำนวนหุ้นสูงสุดที่ถือได้">
              <S2Num v={s.maxHold} editing={editing} decimals={2} suffix="หุ้น"
                     onChange={(v) => set('maxHold', v)} />
            </S2Row>
          </S2Group>

          <S2Group title="การชำระพิเศษ">
            <S2Row label="ซื้อหุ้นภายในวันที่นับเป็นเดือนปัจจุบัน">
              <S2Num v={s.specialBuyCutoffDay} editing={editing} suffix="วัน"
                     onChange={(v) => set('specialBuyCutoffDay', v)} />
            </S2Row>
            <S2Row label="นับงวดสำหรับการซื้อหุ้นพิเศษ">
              <S2Sel group="specialCountPeriod" v={s.specialCountPeriod} editing={editing}
                     onChange={(v) => set('specialCountPeriod', v)} />
            </S2Row>
          </S2Group>

          <S2Group title="การคิดเงินปันผล">
            <S2Row label="จำนวนผิดนัดชำระที่ไม่ได้ปันผล">
              <S2Num v={s.defaultNoDividend} editing={editing} suffix="ครั้ง"
                     onChange={(v) => set('defaultNoDividend', v)} />
            </S2Row>
          </S2Group>
        </div>

        {/* ── คอลัมน์ขวา ── */}
        <div className="l2-col">
          <S2Group title="ลดส่งค่าหุ้น">
            <S2Row label="งวดต่ำสุดที่ลดส่งได้">
              <S2Num v={s.reduceMinPeriod} editing={editing} suffix="งวด"
                     onChange={(v) => set('reduceMinPeriod', v)} />
            </S2Row>
            <S2Row label="จำนวนหุ้นขั้นต่ำที่ลดส่งได้">
              <S2Num v={s.reduceMinShares} editing={editing} decimals={2} suffix="หุ้น"
                     onChange={(v) => set('reduceMinShares', v)} />
            </S2Row>
          </S2Group>

          <S2Group title="งดส่งค่าหุ้น">
            <S2Row label="ต้องส่งหุ้นมาแล้วงวด">
              <S2Num v={s.suspendRequirePeriod} editing={editing} suffix="งวด"
                     onChange={(v) => set('suspendRequirePeriod', v)} />
            </S2Row>
            <S2Row label="จำนวนหุ้นขั้นต่ำที่งดส่งได้">
              <S2Num v={s.suspendMinShares} editing={editing} decimals={2} suffix="หุ้น"
                     onChange={(v) => set('suspendMinShares', v)} />
            </S2Row>
          </S2Group>

          <S2Group title="การนับการเปลี่ยนแปลงการส่งหุ้น">
            <S2Row label="ประเภทการนับการเปลี่ยนแปลง">
              <S2Sel group="changeCountType" v={s.changeCountType} editing={editing}
                     onChange={(v) => set('changeCountType', v)} />
            </S2Row>

            <div className="l2-subhead">แบบนับรวม</div>
            <S2Row label="รวมแล้วไม่เกิน" indent>
              <S2Num v={s.combinedMax} editing={editing} disabled={!isCombined} suffix="ครั้ง"
                     onChange={(v) => set('combinedMax', v)} />
            </S2Row>

            <div className="l2-subhead">แบบนับแยก</div>
            <S2Row label="ขอเพิ่มหุ้นไม่เกิน" indent>
              <S2Num v={s.sepAdd} editing={editing} disabled={!isSeparate} suffix="ครั้ง"
                     onChange={(v) => set('sepAdd', v)} />
            </S2Row>
            <S2Row label="ขอลดหุ้นไม่เกิน" indent>
              <S2Num v={s.sepReduce} editing={editing} disabled={!isSeparate} suffix="ครั้ง"
                     onChange={(v) => set('sepReduce', v)} />
            </S2Row>
            <S2Row label="ขอหยุดส่งหุ้นไม่เกิน" indent>
              <S2Num v={s.sepStop} editing={editing} disabled={!isSeparate} suffix="ครั้ง"
                     onChange={(v) => set('sepStop', v)} />
            </S2Row>
            <S2Row label="ขอส่งหุ้นต่อไม่เกิน" indent>
              <S2Num v={s.sepResume} editing={editing} disabled={!isSeparate} suffix="ครั้ง"
                     onChange={(v) => set('sepResume', v)} />
            </S2Row>
          </S2Group>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Tab 2 — การส่งหุ้นขั้นต่ำรายเดือน (data grid, ผูกช่วงเงินเดือน)
// ════════════════════════════════════════════════════════════════════
function ShTiersTab({ record, editing, onChange }) {
  const par = Number(record.settings.parValue || 0);
  const tiers = record.tiers;

  const setTier = (i, k, v) => onChange(tiers.map((t, idx) => idx === i ? { ...t, [k]: v } : t));
  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const from = last ? Number(last.salaryTo || 0) : 0;
    onChange([...tiers, {
      salaryFrom: from, salaryTo: from + 20000, sharesMin: 0, sharesMax: 0,
      user: 'จันทร์เพ็ญ มาลี', date: shToday(),
    }]);
  };
  const removeTier = (i) => onChange(tiers.filter((_, idx) => idx !== i));

  const numCell = (i, k, v) => editing
    ? <input className="sh-grid-input" type="number" inputMode="numeric" value={v}
             onChange={(e) => setTier(i, k, e.target.value)} />
    : <span className="sh-grid-num">{fmt.money(Number(v || 0), 2)}</span>;

  return (
    <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="sh-grid-head">
        <div>
          <div className="sh-grid-title">ตารางการส่งหุ้นขั้นต่ำรายเดือน</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            กำหนดขั้นบันไดจำนวนหุ้นที่ต้องส่งรายเดือน ผูกกับช่วงเงินเดือนของสมาชิก — มูลค่าหุ้น/เดือนคำนวณจาก จำนวนหุ้น × {fmt.money(par, 2)} บาท
          </div>
        </div>
        {editing && (
          <button className="btn primary sm" onClick={addTier}>
            <Icon name="plus" /> เพิ่มช่วงเงินเดือน
          </button>
        )}
      </div>

      <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
        <table className="tbl sh-grid" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th rowSpan={2} className="center" style={{ width: 56 }}>ลำดับ</th>
              <th colSpan={2} className="center group-col">เงินเดือน</th>
              <th colSpan={2} className="center group-col">จำนวนหุ้น/เดือน</th>
              <th colSpan={2} className="center group-col">มูลค่าหุ้น/เดือน</th>
              <th rowSpan={2} style={{ width: 130 }}>ผู้ทำรายการ</th>
              <th rowSpan={2} style={{ width: 120 }}>วันทำรายการ</th>
              {editing && <th rowSpan={2} className="center" style={{ width: 60 }} />}
            </tr>
            <tr>
              <th className="center sub-col">ตั้งแต่ (&gt;=)</th>
              <th className="center sub-col">ถึง (&lt;)</th>
              <th className="center sub-col">ต่ำสุด</th>
              <th className="center sub-col">สูงสุด</th>
              <th className="center sub-col">ขั้นต่ำ</th>
              <th className="center sub-col">สูงสุด</th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 && (
              <tr>
                <td colSpan={editing ? 10 : 9} className="center muted" style={{ padding: '28px 12px' }}>
                  ยังไม่มีช่วงเงินเดือน — กดปุ่ม “เพิ่มช่วงเงินเดือน” เพื่อสร้างขั้นบันได
                </td>
              </tr>
            )}
            {tiers.map((t, i) => {
              const valMin = Number(t.sharesMin || 0) * par;
              const valMax = Number(t.sharesMax || 0) * par;
              return (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="num-cell">{numCell(i, 'salaryFrom', t.salaryFrom)}</td>
                  <td className="num-cell">{numCell(i, 'salaryTo', t.salaryTo)}</td>
                  <td className="num-cell">{numCell(i, 'sharesMin', t.sharesMin)}</td>
                  <td className="num-cell">{numCell(i, 'sharesMax', t.sharesMax)}</td>
                  <td className="num-cell computed"><span className="sh-grid-num">{fmt.money(valMin, 2)}</span></td>
                  <td className="num-cell computed"><span className="sh-grid-num">{fmt.money(valMax, 2)}</span></td>
                  <td>{t.user}</td>
                  <td>{fmt.date(t.date)}</td>
                  {editing && (
                    <td className="center">
                      <button className="btn danger sm" onClick={() => removeTier(i)} title="ลบช่วงเงินเดือน">
                        <Icon name="close" size={13} /> ลบ
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="sh-grid-foot muted">
        <Icon name="info" size={12} /> ช่อง “มูลค่าหุ้น/เดือน” เป็นค่าที่ระบบคำนวณอัตโนมัติ — แก้ไขได้เฉพาะจำนวนหุ้นและช่วงเงินเดือน
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail page — header + tabs + editor (view/edit toggle)
// ════════════════════════════════════════════════════════════════════
function ShDetail({ record, onBack, onSave, startEditing }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [tab, setTab] = useState('detail');   // 'detail' | 'tiers'
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  const cur = editing ? draft : record;

  return (
    <div data-screen-label="หน้ารายละเอียดข้อกำหนดประเภทหุ้น">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}>
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
            <button className="btn sm" onClick={cancel}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}>
              <Icon name="check" /> บันทึกข้อกำหนด
            </button>
          </>
        )}
      </div>

      {/* การ์ดหัวเรื่อง: ชื่อ + กลุ่ม + ผู้ทำรายการ */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shares" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <input className="cfg-input lt-name-input" value={draft.name}
                     placeholder="ชื่อประเภทหุ้น"
                     onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} />
            ) : (
              <h1 className="lt-head-title">{record.name}</h1>
            )}
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span>
              <span className="dot" />
              <span>กลุ่ม: {window.shLabel('shareGroup', cur.settings.shareGroup)}</span>
              <span className="dot" />
              <span>มูลค่า/หุ้น {fmt.money(Number(cur.settings.parValue || 0), 2)} บาท</span>
            </div>
          </div>
          {record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> ใช้งานอยู่</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>}
        </div>

        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">วันที่สร้าง</span>
            <span className="lt-date-v">{fmt.date(record.createdDate)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ผู้ทำรายการ</span>
            <span className="lt-date-v">{record.createdBy}</span>
          </div>
          <div className="lt-date" style={{ flex: 1 }}>
            <span className="lt-date-k">หมายเหตุ</span>
            {editing ? (
              <input className="cfg-input" value={draft.note || ''}
                     placeholder="หมายเหตุประกอบรายการ"
                     onChange={(e) => setDraft(d => ({ ...d, note: e.target.value }))} />
            ) : (
              <span className="lt-date-v">{record.note || <span className="muted">—</span>}</span>
            )}
          </div>
        </div>
      </div>

      {/* แท็บ */}
      <div className="tabs-container" style={{ marginTop: 12 }}>
        <div className="tabs-bar">
          <button className={"tab" + (tab === 'detail' ? ' active' : '')} onClick={() => setTab('detail')}>
            รายละเอียด
          </button>
          <button className={"tab" + (tab === 'tiers' ? ' active' : '')} onClick={() => setTab('tiers')}>
            การส่งหุ้นขั้นต่ำรายเดือน
            <span className="count">{cur.tiers.length}</span>
          </button>
        </div>
      </div>

      {tab === 'detail' ? (
        <ShDetailTab record={cur} editing={editing}
                     onChange={(settings) => setDraft(d => ({ ...d, settings }))} />
      ) : (
        <ShTiersTab record={cur} editing={editing}
                    onChange={(tiers) => setDraft(d => ({ ...d, tiers }))} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal — ชื่อ + กลุ่มหุ้น + เริ่มจาก
// ════════════════════════════════════════════════════════════════════
function ShAddModal({ list, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('common');
  const [copyFrom, setCopyFrom] = useState('__default');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('กรุณาระบุชื่อประเภทหุ้น'); return; }
    const src = copyFrom === '__default' ? null : list.find(r => r.id === copyFrom);
    const base = src ? { ...src.settings } : { ...window.SH_SETTINGS_DEFAULTS };
    base.shareGroup = group;
    onCreate({
      id: shUid(),
      name: name.trim(),
      createdDate: shToday(),
      createdBy: 'จันทร์เพ็ญ มาลี',
      note: note.trim(),
      enabled: false,
      settings: base,
      tiers: src ? src.tiers.map(t => ({ ...t })) : [],
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มประเภทหุ้น</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างประเภทหุ้นใหม่ — ปิดใช้งานไว้จนกว่าจะเปิดสถานะ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">ชื่อประเภทหุ้น <span className="cfg-required">*</span></label>
          <input className="cfg-input" value={name} autoFocus
                 placeholder="เช่น หุ้นสามัญ, หุ้นพิเศษ"
                 onChange={(e) => { setName(e.target.value); setError(''); }} />

          <label className="lt-modal-label" style={{ marginTop: 12 }}>กลุ่มของหุ้น</label>
          <select className="filter-select" style={{ width: '100%' }} value={group}
                  onChange={(e) => setGroup(e.target.value)}>
            {window.SH_OPTS.shareGroup.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>

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
              <Icon name="check" /> สร้างประเภทหุ้น
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
function ShareTermsConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(shLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const persist = (next) => { setList(next); shSave(next); };
  const openRec = list.find(r => r.id === openId);

  const handleCreate = (rec) => {
    persist([rec, ...list]);
    audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ค่าคงที่ข้อกำหนดประเภทหุ้น',
      target: `${rec.id} · ${rec.name}`,
      summary: `เพิ่มประเภทหุ้น “${rec.name}”`,
      changes: [{ field: 'ชื่อประเภทหุ้น', before: '—', after: rec.name }],
    });
    setAdding(false);
    onToast && onToast(`สร้างประเภทหุ้น “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true);
    setOpenId(rec.id);
  };

  const handleSaveDetail = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({
      action: 'update', module: 'ประมวลผลและจัดเก็บ — ค่าคงที่ข้อกำหนดประเภทหุ้น',
      target: `${draft.id} · ${draft.name}`,
      summary: `แก้ไขข้อกำหนดประเภทหุ้น “${draft.name}”`,
    });
    onToast && onToast(`บันทึกข้อกำหนด “${draft.name}” เรียบร้อยแล้ว`);
  };

  // ─── Detail view ──────────────────────────────────────────────────
  if (openRec) {
    return (
      <ShDetail record={openRec}
                startEditing={startEditing}
                onBack={() => { setOpenId(null); setStartEditing(false); }}
                onSave={handleSaveDetail} />
    );
  }

  // ─── List view ────────────────────────────────────────────────────
  return (
    <div data-screen-label="หน้าค่าคงที่ข้อกำหนดประเภทหุ้น">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ข้อกำหนดประเภทหุ้น</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดเงื่อนไขและกฎเกณฑ์ของแต่ละประเภทหุ้น พร้อมตารางการส่งหุ้นขั้นต่ำรายเดือนตามช่วงเงินเดือน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}>
          <Icon name="plus" /> เพิ่มประเภทหุ้น
        </button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>รหัส</th>
                <th style={{ minWidth: 220 }}>ชื่อประเภทหุ้น</th>
                <th style={{ width: 130 }}>กลุ่มของหุ้น</th>
                <th className="right" style={{ width: 110 }}>มูลค่า/หุ้น</th>
                <th className="center" style={{ width: 110 }}>ช่วงเงินเดือน</th>
                <th className="center" style={{ width: 100 }}>สถานะ</th>
                <th className="center" style={{ width: 84 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className={"clickable" + (r.enabled ? ' selected' : '')}
                    onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                  <td className="mono">{r.id}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td>{window.shLabel('shareGroup', r.settings.shareGroup)}</td>
                  <td className="right mono">{fmt.money(Number(r.settings.parValue || 0), 2)}</td>
                  <td className="center mono">{r.tiers.length} ช่วง</td>
                  <td className="center">
                    {r.enabled
                      ? <span className="pill ok">ใช้งานอยู่</span>
                      : <span className="pill neutral">ปิดใช้งาน</span>}
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn ghost sm"
                            onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                      เปิด <Icon name="chevRight" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ข้อกำหนดประเภทหุ้นใช้กับการประมวลผลเรียกเก็บและคำนวณปันผล — ควรตรวจสอบก่อนรอบประมวลผลประจำเดือน
      </div>

      {adding && <ShAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { ShareTermsConfigPage });
