// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — ประเภทบัญชี (Account Type)
//  ตารางค่าคงที่ประเภทบัญชี · กำหนด รหัสประเภทบัญชี / ชื่อประเภทบัญชี /
//  สถานะใช้งาน — เพิ่ม / แก้ไข / ลบ ได้ · ปรับ ใช้งาน-ไม่ใช้งาน จากตารางทันที
// ════════════════════════════════════════════════════════════════════

// ─── ค่าตั้งต้น (seed) ───────────────────────────────────────────────
window.ACCT_TYPE_SEED = window.ACCT_TYPE_SEED || [
  { id: 'AT-01', code: '01', name: 'บัญชีเงินสด',           note: 'เงินสดในมือและเงินสดย่อย',    enabled: true },
  { id: 'AT-02', code: '02', name: 'บัญชีเงินฝากธนาคาร',     note: 'กระแสรายวัน / ออมทรัพย์ / ประจำ', enabled: true },
  { id: 'AT-03', code: '03', name: 'บัญชีลูกหนี้เงินกู้',    note: 'ลูกหนี้เงินกู้สมาชิก',         enabled: true },
  { id: 'AT-04', code: '04', name: 'บัญชีเจ้าหนี้',          note: 'เจ้าหนี้การค้าและอื่น ๆ',      enabled: true },
  { id: 'AT-05', code: '05', name: 'บัญชีทุนเรือนหุ้น',      note: 'ทุนเรือนหุ้นสมาชิก',            enabled: true },
  { id: 'AT-06', code: '06', name: 'บัญชีพักรอตรวจสอบ',      note: 'บัญชีพักชั่วคราว',             enabled: false },
];

// ─── localStorage ───────────────────────────────────────────────────
function atLoad() {
  try {
    const saved = localStorage.getItem('acct_type_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ACCT_TYPE_SEED || []).map(c => ({ ...c }));
}
function atSave(list) {
  try { localStorage.setItem('acct_type_v1', JSON.stringify(list)); } catch (e) {}
}
let _atSeq = 0;
const atUid = () => 'AT-' + Date.now().toString(36) + '-' + (++_atSeq);

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function AcctTypeModal({ mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [code, setCode]       = useState(isEdit ? draft0.code : '');
  const [name, setName]       = useState(isEdit ? draft0.name : '');
  const [note, setNote]       = useState(isEdit ? (draft0.note || '') : '');
  const [enabled, setEnabled] = useState(isEdit ? !!draft0.enabled : true);
  const [error, setError]     = useState('');

  const submit = (e) => {
    e.preventDefault();
    const c = String(code).trim();
    if (!c) { setError('กรุณาระบุรหัสประเภทบัญชี'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อประเภทบัญชี'); return; }
    const dup = (existing || []).some(x => x.code === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`รหัสประเภทบัญชี “${c}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น`); return; }
    onSubmit({ code: c, name: name.trim(), note: note.trim(), enabled });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขประเภทบัญชี' : 'เพิ่มประเภทบัญชี'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              ประเภทบัญชีเป็นค่าคงที่ที่เมนูงานบัญชีและระบบย่อยอื่นเรียกใช้
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {/* รหัสประเภทบัญชี */}
            <div className="bud-fld">
              <label className="lt-modal-label">รหัสประเภทบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="เช่น 01, 02, 03" disabled={isEdit}
                     maxLength={8} autoFocus={!isEdit}
                     onChange={(e) => { setCode(e.target.value.replace(/\s/g, '')); setError(''); }} />
              <div className="bud-fld-hint">รหัสประจำประเภทบัญชี (ตัวเลขหรือตัวอักษร ไม่เกิน 8 ตัว)</div>
            </div>

            {/* สถานะใช้งาน */}
            <div className="bud-fld">
              <label className="lt-modal-label">สถานะใช้งาน</label>
              <div className="ac-status-pick">
                <button type="button"
                        className={"ac-status-opt" + (enabled ? ' active' : '')}
                        onClick={() => setEnabled(true)}>
                  <span className="ac-dot ok" /> ใช้งาน
                </button>
                <button type="button"
                        className={"ac-status-opt" + (!enabled ? ' active off' : '')}
                        onClick={() => setEnabled(false)}>
                  <span className="ac-dot off" /> ไม่ใช้งาน
                </button>
              </div>
            </div>

            {/* ชื่อประเภทบัญชี */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อประเภทบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name}
                     placeholder="เช่น บัญชีเงินสด, บัญชีเงินฝากธนาคาร, บัญชีลูกหนี้เงินกู้"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            {/* หมายเหตุ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ <span className="muted" style={{ fontWeight: 400 }}>(ไม่บังคับ)</span></label>
              <input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติมของประเภทบัญชี"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกประเภทบัญชี'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Delete confirm modal
// ════════════════════════════════════════════════════════════════════
function AcctTypeDeleteModal({ rec, onConfirm, onClose }) {
  return (
    <window.DepStatusDialog tone="danger" title="ยืนยันการลบประเภทบัญชี" desc={<>ต้องการลบประเภทบัญชี “<span className="mono">{rec.code}</span> · {rec.name}” ใช่หรือไม่?</>}
      okLabel="ลบ" onOk={() => onConfirm(rec)} onClose={onClose} />
  );
}


// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
const AT_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

if (!document.getElementById('at-tbl-style')) {
  const st = document.createElement('style');
  st.id = 'at-tbl-style';
  st.textContent = '.ac-tbl .bud-acts { opacity: 1 !important; }'
    + '.ac-tbl .bud-act { border: 0 !important; background: transparent !important; color: var(--text-body, rgba(0,0,0,.65)); }'
    + '.ac-tbl .bud-act:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--primary) !important; }'
    + '.ac-tbl .bud-act.danger:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--danger) !important; }'
    + '.ac-tbl td, .ac-tbl th { white-space: normal; word-break: break-word; }';
  document.head.appendChild(st);
}

function AcctTypeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList]   = useState(atLoad);
  const [modal, setModal] = useState(null);   // {mode, rec}
  const [del, setDel]     = useState(null);    // rec

  const persist = (next) => { setList(next); atSave(next); };

  const sorted = React.useMemo(
    () => [...list].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [list]);

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({
        action: 'update', module: 'บัญชี — ค่าคงที่ประเภทบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขประเภทบัญชี “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขประเภทบัญชี “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: atUid(), ...vals }]);
      audit.log({
        action: 'create', module: 'บัญชี — ค่าคงที่ประเภทบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มประเภทบัญชี “${vals.name}”`,
        changes: [
          { field: 'รหัสประเภทบัญชี', before: '—', after: vals.code },
          { field: 'ชื่อประเภทบัญชี', before: '—', after: vals.name },
        ],
      });
      onToast && onToast(`เพิ่มประเภทบัญชี “${vals.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleEnabled = (c) => {
    persist(list.map(x => x.id === c.id ? { ...x, enabled: !x.enabled } : x));
    audit.log({
      action: 'update', module: 'บัญชี — ค่าคงที่ประเภทบัญชี',
      target: `${c.code} · ${c.name}`,
      summary: `${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ประเภทบัญชี “${c.name}”`,
      changes: [{ field: 'สถานะใช้งาน', before: c.enabled ? 'Active' : 'Inactive', after: c.enabled ? 'Inactive' : 'Active' }],
    });
    onToast && onToast(`${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ประเภทบัญชี “${c.name}” แล้ว`);
  };

  const confirmDelete = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ค่าคงที่ประเภทบัญชี',
      target: `${c.code} · ${c.name}`, summary: `ลบประเภทบัญชี “${c.name}”`,
    });
    onToast && onToast(`ลบประเภทบัญชี “${c.name}” เรียบร้อยแล้ว`);
    setDel(null);
  };

  const resetSeed = () => {
    const fresh = (window.ACCT_TYPE_SEED || []).map(c => ({ ...c }));
    persist(fresh);
    onToast && onToast('คืนค่าประเภทบัญชีตั้งต้นเรียบร้อยแล้ว');
  };

  const activeCount = list.filter(c => c.enabled).length;

  return (
    <div data-screen-label="หน้าค่าคงที่ประเภทบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประเภทบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            กำหนดประเภทบัญชีเป็นค่าคงที่ของระบบบัญชี — ระบุรหัสประเภทบัญชีและชื่อประเภทบัญชี
            เพื่อให้เมนูงานบัญชีและระบบย่อยอื่นเรียกใช้เป็นแกนจัดกลุ่มเดียวกัน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่มประเภทบัญชี
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="bud-toolbar" style={{ padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> คลิกสวิตช์ในคอลัมน์ “สถานะใช้งาน” เพื่อปรับ ใช้งาน / ไม่ใช้งาน ได้ทันที · กดไอคอนเพื่อแก้ไขหรือลบ
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>ใช้งานอยู่ {activeCount} / {list.length} รายการ</span>
        </div>

        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl ac-tbl" style={{ width: '100%', minWidth: 0, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 70 }}>ลำดับ</th>
                <th className="center" style={{ width: 120 }}>รหัสประเภทบัญชี</th>
                <th style={{ minWidth: 320 }}>ชื่อประเภทบัญชี</th>
                <th className="center" style={{ width: 150 }}>สถานะใช้งาน</th>
                <th className="center" style={{ width: 110 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีข้อมูลประเภทบัญชี — กดปุ่ม “เพิ่มประเภทบัญชี” เพื่อเริ่มกำหนดค่าคงที่
                </td></tr>
              )}
              {sorted.map((c, i) => (
                <tr key={c.id} className={"ac-row" + (c.enabled ? '' : ' is-off')}
                    style={c.enabled ? null : { opacity: .55, background: '#FAFAFA' }}>
                  <td className="center mono ac-order-cell">{i + 1}</td>
                  <td className="center mono">{c.code}</td>
                  <td className="ac-name-cell">
                    <div className="ac-name-line">
                      <span className="ac-name">{c.name}</span>
                    </div>
                    {c.note && <div className="ac-note">{c.note}</div>}
                  </td>
                  <td className="center">
                    <button className={"ac-switch" + (c.enabled ? ' on' : '')}
                            onClick={() => toggleEnabled(c)}
                            title={c.enabled ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                            aria-pressed={c.enabled}>
                      <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
                      <span className="ac-switch-label">{c.enabled ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>
                    </button>
                  </td>
                  <td className="bud-act-cell">
                    <div className="bud-acts" style={{ justifyContent: 'center' }}>
                      <button className="bud-act" title="แก้ไข" onClick={() => setModal({ mode: 'edit', rec: c })}>
                        <Icon name="edit" size={13} />
                      </button>
                      <button className="bud-act danger" title="ลบ" onClick={() => setDel(c)}
                              dangerouslySetInnerHTML={{ __html: AT_TRASH }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ประเภทบัญชีเหล่านี้เป็นค่าคงที่ของระบบบัญชี — เมนูงานบัญชีและระบบย่อยอื่นจะนำไปใช้จัดกลุ่มและอ้างอิงบัญชี
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <AcctTypeModal mode={modal.mode}
                       draft0={modal.mode === 'edit' ? modal.rec : null}
                       existing={list}
                       onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {del && <AcctTypeDeleteModal rec={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </div>
  );
}

// เปิดให้เมนูอื่นเรียกอ่านประเภทบัญชีล่าสุดได้
window.acctTypeLoad = atLoad;
Object.assign(window, { AcctTypeConfigPage });
