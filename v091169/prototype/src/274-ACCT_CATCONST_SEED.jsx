// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — หมวดบัญชี (ค่าคงที่) (Account Category — const)
//  ตารางค่าคงที่หมวดบัญชี · กำหนด รหัสหมวดบัญชี / ชื่อหมวดบัญชี /
//  สถานะใช้งาน — เพิ่ม / แก้ไข / ลบ ได้ · ปรับ ใช้งาน-ไม่ใช้งาน จากตารางทันที
// ════════════════════════════════════════════════════════════════════

// ─── ค่าตั้งต้น (seed) ───────────────────────────────────────────────
window.ACCT_CATCONST_SEED = window.ACCT_CATCONST_SEED || [
  { id: 'CC-1', code: '1', name: 'สินทรัพย์',   note: 'Assets',      enabled: true },
  { id: 'CC-2', code: '2', name: 'หนี้สิน',      note: 'Liabilities', enabled: true },
  { id: 'CC-3', code: '3', name: 'ทุน',          note: 'Equity',      enabled: true },
  { id: 'CC-4', code: '4', name: 'รายได้',        note: 'Revenue',     enabled: true },
  { id: 'CC-5', code: '5', name: 'ค่าใช้จ่าย',    note: 'Expenses',    enabled: true },
];

// ─── localStorage ───────────────────────────────────────────────────
function ccLoad() {
  try {
    const saved = localStorage.getItem('acct_catconst_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ACCT_CATCONST_SEED || []).map(c => ({ ...c }));
}
function ccSave(list) {
  try { localStorage.setItem('acct_catconst_v1', JSON.stringify(list)); } catch (e) {}
}
let _ccSeq = 0;
const ccUid = () => 'CC-' + Date.now().toString(36) + '-' + (++_ccSeq);

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function CatConstModal({ mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [code, setCode]       = useState(isEdit ? draft0.code : '');
  const [name, setName]       = useState(isEdit ? draft0.name : '');
  const [note, setNote]       = useState(isEdit ? (draft0.note || '') : '');
  const [enabled, setEnabled] = useState(isEdit ? !!draft0.enabled : true);
  const [error, setError]     = useState('');

  const submit = (e) => {
    e.preventDefault();
    const c = String(code).trim();
    if (!c) { setError('กรุณาระบุรหัสหมวดบัญชี'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อหมวดบัญชี'); return; }
    const dup = (existing || []).some(x => x.code === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`รหัสหมวดบัญชี “${c}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น`); return; }
    onSubmit({ code: c, name: name.trim(), note: note.trim(), enabled });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขหมวดบัญชี' : 'เพิ่มหมวดบัญชี'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              หมวดบัญชีเป็นค่าคงที่ที่เมนูงานบัญชีและระบบย่อยอื่นเรียกใช้
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {/* รหัสหมวดบัญชี */}
            <div className="bud-fld">
              <label className="lt-modal-label">รหัสหมวดบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="เช่น 1, 2, 3" disabled={isEdit}
                     maxLength={8} autoFocus={!isEdit}
                     onChange={(e) => { setCode(e.target.value.replace(/\s/g, '')); setError(''); }} />
              <div className="bud-fld-hint">รหัสประจำหมวดบัญชี (ตัวเลขหรือตัวอักษร ไม่เกิน 8 ตัว)</div>
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

            {/* ชื่อหมวดบัญชี */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อหมวดบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name}
                     placeholder="เช่น สินทรัพย์, หนี้สิน, ทุน, รายได้, ค่าใช้จ่าย"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            {/* หมายเหตุ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ <span className="muted" style={{ fontWeight: 400 }}>(ไม่บังคับ)</span></label>
              <input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติมของหมวดบัญชี"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกหมวดบัญชี'}
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
function CatConstDeleteModal({ rec, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="trash" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการลบหมวดบัญชี</h2>
            <div className="muted" style={{ fontSize: 11 }}>การลบไม่สามารถย้อนกลับได้</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '2px 0 16px', fontSize: 13.5, lineHeight: 1.6 }}>
            ต้องการลบหมวดบัญชี <b className="mono">{rec.code}</b> · {rec.name} ใช่หรือไม่?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onConfirm(rec)}>
              <Icon name="trash" size={13} /> ยืนยันการลบ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function CatConstConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList]   = useState(ccLoad);
  const [modal, setModal] = useState(null);
  const [del, setDel]     = useState(null);

  const persist = (next) => { setList(next); ccSave(next); };

  const sorted = React.useMemo(
    () => [...list].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [list]);

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({
        action: 'update', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขหมวดบัญชี “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขหมวดบัญชี “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: ccUid(), ...vals }]);
      audit.log({
        action: 'create', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มหมวดบัญชี “${vals.name}”`,
        changes: [
          { field: 'รหัสหมวดบัญชี', before: '—', after: vals.code },
          { field: 'ชื่อหมวดบัญชี', before: '—', after: vals.name },
        ],
      });
      onToast && onToast(`เพิ่มหมวดบัญชี “${vals.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleEnabled = (c) => {
    persist(list.map(x => x.id === c.id ? { ...x, enabled: !x.enabled } : x));
    audit.log({
      action: 'update', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
      target: `${c.code} · ${c.name}`,
      summary: `${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}หมวดบัญชี “${c.name}”`,
      changes: [{ field: 'สถานะใช้งาน', before: c.enabled ? 'Active' : 'Inactive', after: c.enabled ? 'Inactive' : 'Active' }],
    });
    onToast && onToast(`${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}หมวดบัญชี “${c.name}” แล้ว`);
  };

  const confirmDelete = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
      target: `${c.code} · ${c.name}`, summary: `ลบหมวดบัญชี “${c.name}”`,
    });
    onToast && onToast(`ลบหมวดบัญชี “${c.name}” เรียบร้อยแล้ว`);
    setDel(null);
  };

  const resetSeed = () => {
    const fresh = (window.ACCT_CATCONST_SEED || []).map(c => ({ ...c }));
    persist(fresh);
    onToast && onToast('คืนค่าหมวดบัญชีตั้งต้นเรียบร้อยแล้ว');
  };

  const activeCount = list.filter(c => c.enabled).length;

  return (
    <div data-screen-label="หน้าค่าคงที่หมวดบัญชี (ค่าคงที่)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>หมวดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            กำหนดหมวดบัญชีเป็นค่าคงที่ของระบบบัญชี — ระบุรหัสหมวดบัญชีและชื่อหมวดบัญชี
            เพื่อให้เมนูงานบัญชีและระบบย่อยอื่นเรียกใช้เป็นแกนจัดกลุ่มเดียวกัน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่มหมวดบัญชี
        </button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="bud-toolbar">
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> คลิกสวิตช์ในคอลัมน์ “สถานะใช้งาน” เพื่อปรับ ใช้งาน / ไม่ใช้งาน ได้ทันที · กดไอคอนเพื่อแก้ไขหรือลบ
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>ใช้งานอยู่ {activeCount} / {list.length} รายการ</span>
        </div>

        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl ac-tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 70 }}>ลำดับ</th>
                <th className="center" style={{ width: 120 }}>รหัสหมวดบัญชี</th>
                <th style={{ minWidth: 320 }}>ชื่อหมวดบัญชี</th>
                <th className="center" style={{ width: 150 }}>สถานะใช้งาน</th>
                <th className="center" style={{ width: 110 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีข้อมูลหมวดบัญชี — กดปุ่ม “เพิ่มหมวดบัญชี” เพื่อเริ่มกำหนดค่าคงที่
                </td></tr>
              )}
              {sorted.map((c, i) => (
                <tr key={c.id} className={"ac-row" + (c.enabled ? '' : ' is-off')}>
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
                      <button className="bud-act danger" title="ลบ" onClick={() => setDel(c)}>
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> หมวดบัญชีเหล่านี้เป็นค่าคงที่ของระบบบัญชี — เมนูงานบัญชีและระบบย่อยอื่นจะนำไปใช้จัดกลุ่มและอ้างอิงบัญชี
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <CatConstModal mode={modal.mode}
                       draft0={modal.mode === 'edit' ? modal.rec : null}
                       existing={list}
                       onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {del && <CatConstDeleteModal rec={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </div>
  );
}

window.acctCatConstLoad = ccLoad;
Object.assign(window, { CatConstConfigPage });
