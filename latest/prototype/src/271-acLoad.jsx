// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — หมวดบัญชี (Account Category)
//  ตารางหมวดบัญชีหลัก · กำหนด รหัส / ชื่อไทย-อังกฤษ / ประเภทหมวดบัญชี /
//  ลำดับการแสดงผล / สถานะใช้งาน / หมายเหตุ — เป็นค่าคงที่ให้ "ผังบัญชี"
//  และเมนูบัญชีอื่นเรียกใช้ · ปรับสถานะใช้งานจากตารางได้ทันที + แก้ไข
// ════════════════════════════════════════════════════════════════════

// ─── localStorage (v2 — โครงสร้างฟิลด์ใหม่) ─────────────────────────
function acLoad() {
  try {
    const saved = localStorage.getItem('acct_categories_v2');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ACCT_CAT_SEED || []).map(c => ({ ...c }));
}
function acSave(list) {
  try { localStorage.setItem('acct_categories_v2', JSON.stringify(list)); } catch (e) {}
}
let _acSeq = 0;
const acUid = () => 'AC-' + Date.now().toString(36) + '-' + (++_acSeq);

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function AcctCatModal({ mode, draft0, existing, nextOrder, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [code, setCode]   = useState(isEdit ? draft0.code : '');
  const [name, setName]   = useState(isEdit ? draft0.name : '');
  const [en, setEn]       = useState(isEdit ? (draft0.en || '') : '');
  const [type, setType]   = useState(isEdit ? draft0.type : 'asset');
  const [order, setOrder] = useState(isEdit ? String(draft0.order ?? '') : String(nextOrder));
  const [note, setNote]   = useState(isEdit ? (draft0.note || '') : '');
  const [enabled, setEnabled] = useState(isEdit ? !!draft0.enabled : true);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const c = String(code).trim();
    if (!c) { setError('กรุณาระบุรหัสหมวดบัญชี'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อหมวดบัญชี'); return; }
    const dup = (existing || []).some(x => x.code === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`รหัสหมวด “${c}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น`); return; }
    onSubmit({
      code: c, name: name.trim(), en: en.trim(), type,
      order: Number(order) || 0, note: note.trim(), enabled,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขหมวดบัญชี' : 'เพิ่มหมวดบัญชี'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              หมวดบัญชีเป็นค่าคงที่ที่ผังบัญชีและเมนูบัญชีอื่นเรียกใช้
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {/* รหัสหมวด */}
            <div className="bud-fld">
              <label className="lt-modal-label">รหัสหมวดบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="เช่น 1" disabled={isEdit}
                     maxLength={4}
                     onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} />
              <div className="bud-fld-hint">รหัสประจำหมวด ใช้เป็นหลักนำหน้าเลขที่บัญชีในผังบัญชี</div>
            </div>

            {/* ลำดับการแสดงผล */}
            <div className="bud-fld">
              <label className="lt-modal-label">ลำดับการแสดงผล</label>
              <input className="cfg-input mono" type="number" min="0" value={order}
                     onChange={(e) => setOrder(e.target.value)} />
              <div className="bud-fld-hint">ใช้เรียงลำดับในรายงานและหน้าผังบัญชี</div>
            </div>

            {/* ชื่อหมวด */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อหมวดบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus
                     placeholder="เช่น สินทรัพย์, หนี้สิน, ทุน, รายได้, ค่าใช้จ่าย"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            {/* ชื่อภาษาอังกฤษ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อภาษาอังกฤษ <span className="muted" style={{ fontWeight: 400 }}>(ไม่บังคับ)</span></label>
              <input className="cfg-input" value={en} placeholder="เช่น Assets, Liabilities, Equity, Revenue, Expenses"
                     onChange={(e) => setEn(e.target.value)} />
            </div>

            {/* ประเภทหมวดบัญชี */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">
                ประเภทหมวดบัญชี <span className="cfg-required">*</span>
              </label>
              <select className="filter-select" style={{ width: '100%' }} value={type}
                      onChange={(e) => setType(e.target.value)}>
                {window.ACCT_CAT_OPTS.type.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <div className="bud-fld-hint">ระบุว่าเป็นหมวดหลักของบัญชีประเภทใด</div>
            </div>

            {/* สถานะใช้งาน */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">สถานะใช้งาน</label>
              <div className="ac-status-pick">
                <button type="button"
                        className={"ac-status-opt" + (enabled ? ' active' : '')}
                        onClick={() => setEnabled(true)}>
                  <span className="ac-dot ok" /> ใช้งาน (Active)
                </button>
                <button type="button"
                        className={"ac-status-opt" + (!enabled ? ' active off' : '')}
                        onClick={() => setEnabled(false)}>
                  <span className="ac-dot off" /> ปิดใช้งาน (Inactive)
                </button>
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ</label>
              <input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติมของหมวดบัญชี (ไม่บังคับ)"
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
//  Main page
// ════════════════════════════════════════════════════════════════════
const AC_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

if (!document.getElementById('ac-cat-style')) {
  const st = document.createElement('style');
  st.id = 'ac-cat-style';
  st.textContent = '[data-screen-label="หน้าค่าคงที่หมวดบัญชี"] .bud-act.danger:hover { border-color: var(--border) !important; }'
    + '.fs-tree-card > .section-head > .head-bar { display: none; }'
    + '.ac-tbl td, .ac-tbl th { white-space: normal; word-break: break-word; }'
    + '.ac-tbl .bud-acts { opacity: 1 !important; }'
    + '.ac-tbl .bud-act { border: 0 !important; background: transparent !important; color: var(--text-body, rgba(0,0,0,.65)); }'
    + '.ac-tbl .bud-act:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--primary) !important; }'
    + '.ac-tbl .bud-act.danger:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--danger) !important; }';
  document.head.appendChild(st);
}

function AccountCategoryConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(acLoad);
  const [modal, setModal] = useState(null);   // {mode, cat}

  const persist = (next) => { setList(next); acSave(next); };

  const delCat = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
      target: `${c.code} · ${c.name}`, summary: `ลบหมวดบัญชี “${c.name}”`,
    });
    onToast && onToast(`ลบหมวดบัญชี “${c.name}” เรียบร้อยแล้ว`);
  };

  // เรียงตามลำดับการแสดงผล แล้วจึงรหัส
  const sorted = React.useMemo(
    () => [...list].sort((a, b) =>
      (Number(a.order) - Number(b.order)) ||
      (Number(a.code) - Number(b.code)) ||
      a.code.localeCompare(b.code)),
    [list]);

  const nextOrder = React.useMemo(
    () => (list.reduce((mx, c) => Math.max(mx, Number(c.order) || 0), 0) + 1), [list]);

  const submit = (vals) => {
    const { mode, cat } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === cat.id ? { ...x, ...vals } : x));
      audit.log({
        action: 'update', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขหมวดบัญชี “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขหมวด “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: acUid(), ...vals }]);
      audit.log({
        action: 'create', module: 'บัญชี — ค่าคงที่หมวดบัญชี',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มหมวดบัญชี “${vals.name}”`,
        changes: [
          { field: 'รหัสหมวดบัญชี', before: '—', after: vals.code },
          { field: 'ประเภทหมวดบัญชี', before: '—', after: window.acctCatLabel('type', vals.type) },
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
    onToast && onToast(`${c.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}หมวด “${c.name}” แล้ว`);
  };

  const resetSeed = () => {
    const fresh = (window.ACCT_CAT_SEED || []).map(c => ({ ...c }));
    persist(fresh);
    onToast && onToast('คืนค่าหมวดบัญชีตั้งต้นเรียบร้อยแล้ว');
  };

  const activeCount = list.filter(c => c.enabled).length;

  return (
    <div data-screen-label="หน้าค่าคงที่หมวดบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>หมวดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            กำหนดหมวดบัญชีหลักเป็นค่าคงที่ของระบบ — ระบุรหัส ชื่อหมวด ประเภทหมวดบัญชี และลำดับการแสดงผล
            เพื่อให้ “ผังบัญชี” และเมนูบัญชีอื่น ๆ เรียกใช้เป็นแกนจัดกลุ่มเดียวกัน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', cat: null })}>
          <Icon name="plus" /> เพิ่มหมวดบัญชี
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
          <Icon name="info" size={12} /> คลิกสวิตช์ในคอลัมน์ “สถานะใช้งาน” เพื่อปรับ ใช้งาน / ไม่ใช้งาน ได้ทันที · กดไอคอนดินสอเพื่อแก้ไข
        </div>

        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl ac-tbl" style={{ width: '100%', minWidth: 0, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 70 }}>ลำดับ</th>
                <th className="center" style={{ width: 80 }}>รหัส</th>
                <th>ชื่อหมวดบัญชี</th>
                <th style={{ width: 130 }}>ประเภทหมวดบัญชี</th>
                <th className="center" style={{ width: 120 }}>สถานะใช้งาน</th>
                <th className="center" style={{ width: 110 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีหมวดบัญชี — กดปุ่ม “เพิ่มหมวดบัญชี” เพื่อเริ่มกำหนดค่าคงที่
                </td></tr>
              )}
              {sorted.map(c => {
                const tone = window.acctCatTypeTone(c.type);
                return (
                  <tr key={c.id} className={"ac-row" + (c.enabled ? '' : ' is-off')}
                      style={c.enabled ? null : { opacity: .55, background: '#FAFAFA' }}>
                    <td className="center mono ac-order-cell">{c.order}</td>
                    <td className="center mono">{c.code}</td>
                    <td className="ac-name-cell">
                      <div className="ac-name-line">
                        <span className="ac-name">{c.name}</span>
                        {c.en && <span className="ac-en">{c.en}</span>}
                      </div>
                      {c.note && <div className="ac-note">{c.note}</div>}
                    </td>
                    <td>
                      <span className={"ac-type-chip " + tone}>
                        <span className="ac-type-dot" />
                        {window.acctCatLabel('type', c.type)}
                      </span>
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
                        <button className="bud-act" title="แก้ไข" onClick={() => setModal({ mode: 'edit', cat: c })}>
                          <Icon name="edit" size={13} />
                        </button>
                        <button className="bud-act danger" title="ลบ" onClick={() => delCat(c)}
                                dangerouslySetInnerHTML={{ __html: AC_TRASH }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> หมวดบัญชีนี้เป็นค่าคงที่ของระบบบัญชี — เมนู “ผังบัญชี” จะนำหมวดเหล่านี้ไปจัดกลุ่มบัญชีย่อยและเรียงลำดับตามที่กำหนด
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <AcctCatModal mode={modal.mode}
                      draft0={modal.mode === 'edit' ? modal.cat : null}
                      existing={list} nextOrder={nextOrder}
                      onClose={() => setModal(null)} onSubmit={submit} />
      )}
    </div>
  );
}

// เปิดให้เมนู "ผังบัญชี" เรียกอ่านหมวดบัญชีล่าสุดได้
window.acctCatLoad = acLoad;
Object.assign(window, { AccountCategoryConfigPage });
