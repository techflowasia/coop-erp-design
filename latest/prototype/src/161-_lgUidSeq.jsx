// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่วงเงินกู้กลุ่ม — LoanGroupConfigPage
//  รายการวงเงินกู้กลุ่ม → เพิ่ม/แก้ไข (ป๊อบอัพ) · เปิด/ปิดการใช้งาน
//  ระบบงานสินเชื่อ › ค่าคงที่
// ════════════════════════════════════════════════════════════════════

let _lgUidSeq = 0;
const lgUid = () => 'LG-N' + (++_lgUidSeq);
const lgToday = () => new Date().toISOString().slice(0, 10);

function lgLoad() {
  try {
    const saved = localStorage.getItem('loan_groups');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.LG_SEED.map(r => ({ ...r }));
}
function lgSaveLS(list) {
  try { localStorage.setItem('loan_groups', JSON.stringify(list)); } catch (e) {}
}

// ════════════════════════════════════════════════════════════════════
//  Add / Edit modal — รหัส + ชื่อ + วงเงินกู้สูงสุด
// ════════════════════════════════════════════════════════════════════
function LgFormModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [code, setCode] = useState(editRec ? editRec.code : '');
  const [name, setName] = useState(editRec ? editRec.name : '');
  const [maxAmount, setMaxAmount] = useState(editRec ? editRec.maxAmount : '');
  const [note, setNote] = useState(editRec ? (editRec.note || '') : '');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณาระบุรหัสวงเงินกู้กลุ่ม'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อวงเงินกู้กลุ่ม'); return; }
    if (maxAmount === '' || Number(maxAmount) <= 0) { setError('กรุณาระบุวงเงินกู้สูงสุด'); return; }
    const dup = list.some(r => r.code === code.trim() && (!isEdit || r.id !== editRec.id));
    if (dup) { setError('รหัสวงเงินกู้กลุ่มนี้ถูกใช้แล้ว'); return; }
    onSubmit({
      id: isEdit ? editRec.id : lgUid(),
      code: code.trim(), name: name.trim(), maxAmount: Number(maxAmount),
      enabled: isEdit ? editRec.enabled : false,
      createdDate: isEdit ? editRec.createdDate : lgToday(),
      createdBy: isEdit ? editRec.createdBy : 'จันทร์เพ็ญ มาลี',
      note: note.trim(),
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขวงเงินกู้กลุ่ม' : 'เพิ่มวงเงินกู้กลุ่ม'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isEdit ? `${editRec.code} · ${editRec.name}` : 'กำหนดเพดานยอดหนี้รวมของกลุ่มเงินกู้'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">รหัสวงเงินกู้กลุ่ม <span className="cfg-required">*</span></label>
          <input className="cfg-input mono" value={code} autoFocus={!isEdit} placeholder="เช่น G-NORM" disabled={isEdit}
                 style={isEdit ? { background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' } : undefined}
                 onChange={(e) => { setCode(e.target.value); setError(''); }} />

          <label className="lt-modal-label" style={{ marginTop: 12 }}>ชื่อวงเงินกู้กลุ่ม <span className="cfg-required">*</span></label>
          <input className="cfg-input" value={name} placeholder="เช่น G-เงินกู้สามัญ"
                 onChange={(e) => { setName(e.target.value); setError(''); }} />

          <label className="lt-modal-label" style={{ marginTop: 12 }}>วงเงินกู้สูงสุด <span className="cfg-required">*</span></label>
          <div className="lt-num-wrap">
            <input className="cfg-input mono" type="number" inputMode="decimal" step="0.01" value={maxAmount}
                   style={{ textAlign: 'right' }} placeholder="0.00"
                   onChange={(e) => { setMaxAmount(e.target.value); setError(''); }} />
            <span className="lt-suffix">บาท</span>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                 onChange={(e) => setNote(e.target.value)} />

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มวงเงินกู้กลุ่ม'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Toggle confirm modal — เปิด/ปิดการใช้งาน
// ════════════════════════════════════════════════════════════════════
function LgToggleModal({ target, turningOn, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการใช้งานวงเงินกู้กลุ่ม' : 'ปิดการใช้งานวงเงินกู้กลุ่ม'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">
            {turningOn
              ? <>เปิดใช้งานวงเงินกู้กลุ่ม <b>“{target.name}”</b> — ระบบจะนำเพดานยอด {fmt.money(target.maxAmount, 2)} บาท ไปใช้ควบคุมยอดหนี้รวมของกลุ่มนี้</>
              : <>ปิดใช้งานวงเงินกู้กลุ่ม <b>“{target.name}”</b> — กลุ่มนี้จะไม่แสดงเป็นตัวเลือกในเมนูประเภทเงินกู้</>}
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
//  Delete confirm modal — ลบกลุ่มที่ไม่ใช้งาน
// ════════════════════════════════════════════════════════════════════
function LgDeleteModal({ target, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}>
            <Icon name="trash" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>ลบวงเงินกู้กลุ่ม</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">
            ลบวงเงินกู้กลุ่ม <b>“{target.name}”</b> ออกจากระบบอย่างถาวร — ไม่สามารถกู้คืนได้
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
              <Icon name="trash" /> ลบกลุ่มนี้
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
function LoanGroupConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(lgLoad);
  const [form, setForm] = useState(null);          // { editRec } | { } (add)
  const [toggleTarget, setToggleTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [blocked, setBlocked] = useState(null);
  // ประเภทเงินกู้ที่เลือกกลุ่มนี้ในแท็บวงเงินกู้ (ทุกสถานะ ที่ยังไม่ถูกลบ)
  const usedBy = (r) => window.lpTypesUsing ? window.lpTypesUsing(s => s.limitGroup === window.lgKey(r)) : [];
  const blockMsg = (r, used, verb) => ({ title: verb === 'ลบ' ? 'ลบวงเงินกู้กลุ่ม' : 'ปิดการใช้งานวงเงินกู้กลุ่ม', subtitle: r.code + ' · ' + r.name,
    detail: `${verb === 'ลบ' ? 'ลบ' : 'ปิดใช้งาน'}ไม่ได้ — วงเงินกู้กลุ่ม “${r.name}” ถูกใช้อยู่ใน ${used.length} ประเภทเงินกู้: ${used.join(' · ')} · กรุณาเปลี่ยนวงเงินกู้กลุ่มของประเภทเงินกู้เหล่านี้ก่อน` });

  const persist = (next) => { setList(next); lgSaveLS(next); };
  const activeCount = list.filter(r => r.enabled).length;
  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3('วงเงินกู้กลุ่ม', 'list'), []
  );

  const handleSubmit = (rec) => {
    const exists = list.some(r => r.id === rec.id);
    if (exists) {
      persist(list.map(r => r.id === rec.id ? rec : r));
      audit.log({
        action: 'update', module: 'สินเชื่อ — ค่าคงที่วงเงินกู้กลุ่ม',
        target: `${rec.code} · ${rec.name}`, summary: `แก้ไขวงเงินกู้กลุ่ม “${rec.name}”`,
        changes: [{ field: 'วงเงินกู้สูงสุด', before: '—', after: fmt.money(rec.maxAmount, 2) }],
      });
      onToast && onToast(`บันทึกวงเงินกู้กลุ่ม “${rec.name}” เรียบร้อยแล้ว`);
    } else {
      persist([rec, ...list]);
      audit.log({
        action: 'create', module: 'สินเชื่อ — ค่าคงที่วงเงินกู้กลุ่ม',
        target: `${rec.code} · ${rec.name}`, summary: `เพิ่มวงเงินกู้กลุ่ม “${rec.name}” (เพดาน ${fmt.money(rec.maxAmount, 2)} บาท)`,
        changes: [{ field: 'รหัสวงเงินกู้กลุ่ม', before: '—', after: rec.code }],
      });
      onToast && onToast(`เพิ่มวงเงินกู้กลุ่ม “${rec.name}” เรียบร้อยแล้ว`);
    }
    setForm(null);
  };

  const applyToggle = () => {
    const { rec, turningOn } = toggleTarget;
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: turningOn } : r));
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่วงเงินกู้กลุ่ม',
      target: `${rec.code} · ${rec.name}`,
      summary: turningOn ? `เปิดใช้งานวงเงินกู้กลุ่ม “${rec.name}”` : `ปิดใช้งานวงเงินกู้กลุ่ม “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }],
    });
    onToast && onToast(turningOn ? `เปิดใช้งาน “${rec.name}” แล้ว` : `ปิดใช้งาน “${rec.name}” แล้ว`);
    setToggleTarget(null);
  };

  const applyDelete = () => {
    const rec = deleteTarget;
    persist(list.filter(r => r.id !== rec.id));
    audit.log({
      action: 'delete', module: 'สินเชื่อ — ค่าคงที่วงเงินกู้กลุ่ม',
      target: `${rec.code} · ${rec.name}`, summary: `ลบวงเงินกู้กลุ่ม “${rec.name}”`,
      changes: [{ field: 'รหัสวงเงินกู้กลุ่ม', before: rec.code, after: '—' }],
    });
    onToast && onToast(`ลบวงเงินกู้กลุ่ม “${rec.name}” เรียบร้อยแล้ว`);
    setDeleteTarget(null);
  };

  return (
    <div data-screen-label="หน้าค่าคงที่วงเงินกู้กลุ่ม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่วงเงินกู้กลุ่ม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดเพดานยอดหนี้รวมของแต่ละกลุ่มเงินกู้ — เพิ่ม, แก้ไข และเปิด/ปิดการใช้งานได้แต่ละกลุ่ม
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}>
          <Icon name="plus" /> เพิ่มวงเงินกู้กลุ่ม
        </button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="wallet" /></div>
        <div>
          <div className="lt-ab-label">วงเงินกู้กลุ่มทั้งหมด</div>
          <div className="lt-ab-name">{list.length} กลุ่ม
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ width: 120 }}>รหัส</th>
                <th style={{ minWidth: 240 }}>ชื่อวงเงินกู้กลุ่ม</th>
                <th className="right" style={{ width: 160 }}>วงเงินกู้สูงสุด</th>
                <th className="center" style={{ width: 100 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className={r.enabled ? 'selected' : ''}>
                  <td className="mono">{r.code}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td className="right mono"><b>{fmt.money(Number(r.maxAmount || 0), 2)}</b></td>
                  <td className="center">
                    {r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}
                  </td>
                  <td className="center">
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            onClick={() => {
                              const used = r.enabled ? usedBy(r) : [];
                              if (used.length) return setBlocked(blockMsg(r, used, 'ปิด'));
                              setToggleTarget({ rec: r, turningOn: !r.enabled });
                            }}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center">
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="btn sm" onClick={() => setForm({ editRec: r })}>
                        <Icon name="edit" size={13} /> แก้ไข
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
        <Icon name="info" size={12} /> วงเงินกู้กลุ่มใช้ควบคุมยอดหนี้รวมต่อสมาชิกในแต่ละกลุ่มเงินกู้ — กำหนดในแท็บ “วงเงินกู้” ของแต่ละประเภทเงินกู้
      </div>

      {form && <LgFormModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={handleSubmit} />}
      {toggleTarget && <LgToggleModal target={toggleTarget.rec} turningOn={toggleTarget.turningOn}
                                      onClose={() => setToggleTarget(null)} onConfirm={applyToggle} />}
      {blocked && window.ConstBlockedModal && <window.ConstBlockedModal {...blocked} onClose={() => setBlocked(null)} />}
      {deleteTarget && usedBy(deleteTarget).length > 0 && window.ConstBlockedModal
        ? <window.ConstBlockedModal {...blockMsg(deleteTarget, usedBy(deleteTarget), 'ลบ')} onClose={() => setDeleteTarget(null)} />
        : deleteTarget && <LgDeleteModal target={deleteTarget}
                                      onClose={() => setDeleteTarget(null)} onConfirm={applyDelete} />}
    </div>
  );
}

Object.assign(window, { LoanGroupConfigPage });
