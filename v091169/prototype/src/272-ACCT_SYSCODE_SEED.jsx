// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — กำหนดชื่อระบบ (System Code / Department)
//  ตารางค่าคงที่ชื่อระบบงาน · กำหนด ชื่อย่อระบบ (เช่น ACC, DEP, KEP) /
//  ชื่อระบบ (เช่น แผนกบัญชี, แผนกธุรกิจเงินรับฝาก, แผนกหน่วยจัดเก็บ) /
//  สถานะใช้งาน — เพิ่ม / แก้ไข / ลบ ได้ · ปรับ Active-Inactive จากตารางทันที
// ════════════════════════════════════════════════════════════════════

// ─── ค่าตั้งต้น (seed) ───────────────────────────────────────────────
window.ACCT_SYSCODE_SEED = window.ACCT_SYSCODE_SEED || [
  { id: 'SY-ACC', code: 'ACC', name: 'แผนกบัญชี',              note: 'ระบบงานบัญชีและการเงิน', enabled: true },
  { id: 'SY-DEP', code: 'DEP', name: 'แผนกธุรกิจเงินรับฝาก',    note: 'ระบบเงินรับฝากทุกประเภท',   enabled: true },
  { id: 'SY-KEP', code: 'KEP', name: 'แผนกหน่วยจัดเก็บ',        note: 'หน่วยจัดเก็บและติดตามหนี้', enabled: true },
  { id: 'SY-LON', code: 'LON', name: 'แผนกสินเชื่อ',            note: 'ระบบงานสินเชื่อ',           enabled: true },
  { id: 'SY-MEM', code: 'MEM', name: 'แผนกทะเบียนสมาชิก',       note: 'งานทะเบียนและหุ้น',         enabled: false },
];

// ─── localStorage ───────────────────────────────────────────────────
function scLoad() {
  try {
    const saved = localStorage.getItem('acct_syscode_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ACCT_SYSCODE_SEED || []).map(c => ({ ...c }));
}
function scSave(list) {
  try { localStorage.setItem('acct_syscode_v1', JSON.stringify(list)); } catch (e) {}
}
let _scSeq = 0;
const scUid = () => 'SY-' + Date.now().toString(36) + '-' + (++_scSeq);

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function SysCodeModal({ mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [code, setCode]       = useState(isEdit ? draft0.code : '');
  const [name, setName]       = useState(isEdit ? draft0.name : '');
  const [note, setNote]       = useState(isEdit ? (draft0.note || '') : '');
  const [enabled, setEnabled] = useState(isEdit ? !!draft0.enabled : true);
  const [error, setError]     = useState('');

  const submit = (e) => {
    e.preventDefault();
    const c = String(code).trim().toUpperCase();
    if (!c) { setError('กรุณาระบุชื่อย่อระบบ'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อระบบ'); return; }
    const dup = (existing || []).some(x => x.code.toUpperCase() === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`ชื่อย่อระบบ “${c}” มีอยู่แล้ว — กรุณาใช้ชื่อย่ออื่น`); return; }
    onSubmit({ code: c, name: name.trim(), note: note.trim(), enabled });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขชื่อระบบ' : 'เพิ่มชื่อระบบ'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              ชื่อระบบเป็นค่าคงที่ที่เมนูงานบัญชีและระบบย่อยอื่นเรียกใช้
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {/* ชื่อย่อระบบ */}
            <div className="bud-fld">
              <label className="lt-modal-label">ชื่อย่อระบบ <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="เช่น ACC, DEP, KEP" disabled={isEdit}
                     maxLength={6} autoFocus={!isEdit} style={{ textTransform: 'uppercase' }}
                     onChange={(e) => { setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()); setError(''); }} />
              <div className="bud-fld-hint">รหัสย่อประจำระบบ / แผนก (ตัวอักษรหรือตัวเลข ไม่เกิน 6 ตัว)</div>
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

            {/* ชื่อระบบ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อระบบ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name}
                     placeholder="เช่น แผนกบัญชี, แผนกธุรกิจเงินรับฝาก, แผนกหน่วยจัดเก็บ"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            {/* หมายเหตุ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ <span className="muted" style={{ fontWeight: 400 }}>(ไม่บังคับ)</span></label>
              <input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติมของระบบ / แผนก"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกชื่อระบบ'}
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
function SysCodeDeleteModal({ rec, onConfirm, onClose }) {
  return (
    <window.DepStatusDialog tone="danger" title="ยืนยันการลบชื่อระบบ" desc={<>ต้องการลบชื่อระบบ “<span className="mono">{rec.code}</span> · {rec.name}” ใช่หรือไม่?</>}
      okLabel="ลบ" onOk={() => onConfirm(rec)} onClose={onClose} />
  );
}


// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
const SC_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

if (!document.getElementById('sc-tbl-style')) {
  const st = document.createElement('style');
  st.id = 'sc-tbl-style';
  st.textContent = '.ac-tbl .bud-acts { opacity: 1 !important; }'
    + '.ac-tbl .bud-act { border: 0 !important; background: transparent !important; color: var(--text-body, rgba(0,0,0,.65)); }'
    + '.ac-tbl .bud-act:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--primary) !important; }'
    + '.ac-tbl .bud-act.danger:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--danger) !important; }'
    + '.ac-tbl td, .ac-tbl th { white-space: normal; word-break: break-word; }';
  document.head.appendChild(st);
}

function SysCodeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList]   = useState(scLoad);
  const [modal, setModal] = useState(null);   // {mode, rec}
  const [del, setDel]     = useState(null);    // rec

  const persist = (next) => { setList(next); scSave(next); };

  const sorted = React.useMemo(
    () => [...list].sort((a, b) => a.code.localeCompare(b.code)), [list]);

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({
        action: 'update', module: 'บัญชี — ค่าคงที่ชื่อระบบ',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขชื่อระบบ “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขระบบ “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: scUid(), ...vals }]);
      audit.log({
        action: 'create', module: 'บัญชี — ค่าคงที่ชื่อระบบ',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มชื่อระบบ “${vals.name}”`,
        changes: [
          { field: 'ชื่อย่อระบบ', before: '—', after: vals.code },
          { field: 'ชื่อระบบ', before: '—', after: vals.name },
        ],
      });
      onToast && onToast(`เพิ่มชื่อระบบ “${vals.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleEnabled = (c) => {
    persist(list.map(x => x.id === c.id ? { ...x, enabled: !x.enabled } : x));
    audit.log({
      action: 'update', module: 'บัญชี — ค่าคงที่ชื่อระบบ',
      target: `${c.code} · ${c.name}`,
      summary: `${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ชื่อระบบ “${c.name}”`,
      changes: [{ field: 'สถานะใช้งาน', before: c.enabled ? 'Active' : 'Inactive', after: c.enabled ? 'Inactive' : 'Active' }],
    });
    onToast && onToast(`${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ระบบ “${c.name}” แล้ว`);
  };

  const confirmDelete = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ค่าคงที่ชื่อระบบ',
      target: `${c.code} · ${c.name}`, summary: `ลบชื่อระบบ “${c.name}”`,
    });
    onToast && onToast(`ลบชื่อระบบ “${c.name}” เรียบร้อยแล้ว`);
    setDel(null);
  };

  const resetSeed = () => {
    const fresh = (window.ACCT_SYSCODE_SEED || []).map(c => ({ ...c }));
    persist(fresh);
    onToast && onToast('คืนค่าชื่อระบบตั้งต้นเรียบร้อยแล้ว');
  };

  const activeCount = list.filter(c => c.enabled).length;

  return (
    <div data-screen-label="หน้าค่าคงที่กำหนดชื่อระบบ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดชื่อระบบ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            กำหนดชื่อระบบงาน / แผนกเป็นค่าคงที่ของระบบบัญชี — ระบุชื่อย่อระบบ (เช่น ACC, DEP, KEP)
            และชื่อระบบ (เช่น แผนกบัญชี, แผนกธุรกิจเงินรับฝาก, แผนกหน่วยจัดเก็บ) เพื่อให้เมนูงานบัญชีอื่นเรียกใช้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่มชื่อระบบ
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
                <th className="center" style={{ width: 120 }}>ชื่อย่อระบบ</th>
                <th style={{ minWidth: 320 }}>ชื่อระบบ</th>
                <th className="center" style={{ width: 150 }}>สถานะใช้งาน</th>
                <th className="center" style={{ width: 110 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีข้อมูลชื่อระบบ — กดปุ่ม “เพิ่มชื่อระบบ” เพื่อเริ่มกำหนดค่าคงที่
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
                              dangerouslySetInnerHTML={{ __html: SC_TRASH }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ชื่อระบบเหล่านี้เป็นค่าคงที่ของระบบบัญชี — เมนูงานบัญชีและระบบย่อยอื่นจะนำไปใช้อ้างอิงระบบ / แผนกต้นทาง
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <SysCodeModal mode={modal.mode}
                      draft0={modal.mode === 'edit' ? modal.rec : null}
                      existing={list}
                      onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {del && <SysCodeDeleteModal rec={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </div>
  );
}

// เปิดให้เมนูอื่นเรียกอ่านชื่อระบบล่าสุดได้
window.acctSysCodeLoad = scLoad;
Object.assign(window, { SysCodeConfigPage });
