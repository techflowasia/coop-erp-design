// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ › ค่าคงที่ — ต้นสังกัด (Affiliation)
//  ตารางต้นสังกัดหลักของระบบ · กำหนด รหัส / ชื่อสังกัด / หน่วยงาน-กลุ่มงาน /
//  หัวหน้าสังกัด / สถานะใช้งาน / หมายเหตุ — เป็นค่าคงที่พื้นฐานที่ทุกเมนู
//  ซึ่งแสดง "ต้นสังกัด" เรียกใช้ร่วมกัน (window.affilLabel / window.DEPARTMENTS)
// ════════════════════════════════════════════════════════════════════

let _afSeq = 0;
const afUid = () => 'AF-' + Date.now().toString(36) + '-' + (++_afSeq);

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function AffiliationModal({ mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [code, setCode]     = useState(isEdit ? draft0.code : '');
  const [name, setName]     = useState(isEdit ? draft0.name : '');
  const [unit, setUnit]     = useState(isEdit ? (draft0.unit || '') : '');
  const [head, setHead]     = useState(isEdit ? (draft0.head || '') : '');
  const [note, setNote]     = useState(isEdit ? (draft0.note || '') : '');
  const [enabled, setEnabled] = useState(isEdit ? !!draft0.enabled : true);
  const [error, setError]   = useState('');

  const submit = (e) => {
    e.preventDefault();
    const c = String(code).trim();
    if (!c) { setError('กรุณาระบุรหัสต้นสังกัด'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อสังกัด'); return; }
    const dup = (existing || []).some(x => String(x.code) === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`รหัสสังกัด “${c}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น`); return; }
    onSubmit({ code: c, name: name.trim(), unit: unit.trim(), head: head.trim(), note: note.trim(), enabled });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขต้นสังกัด' : 'เพิ่มต้นสังกัด'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              ต้นสังกัดเป็นค่าคงที่พื้นฐานที่ทุกเมนูซึ่งแสดงต้นสังกัดเรียกใช้
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            <div className="bud-fld">
              <label className="lt-modal-label">รหัสต้นสังกัด <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="เช่น 0301" maxLength={6}
                     onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} />
              <div className="bud-fld-hint">รหัสประจำต้นสังกัด ใช้อ้างอิงในทะเบียนสมาชิกและทุกเมนู</div>
            </div>

            <div className="bud-fld">
              <label className="lt-modal-label">สถานะใช้งาน</label>
              <div className="ac-status-pick">
                <button type="button" className={"ac-status-opt" + (enabled ? ' active' : '')}
                        onClick={() => setEnabled(true)}>
                  <span className="ac-dot ok" /> ใช้งาน
                </button>
                <button type="button" className={"ac-status-opt" + (!enabled ? ' active off' : '')}
                        onClick={() => setEnabled(false)}>
                  <span className="ac-dot off" /> ปิดใช้งาน
                </button>
              </div>
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">ชื่อสังกัด <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus
                     placeholder="เช่น กองช่าง, กองการศึกษา, สำนักปลัด"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">หน่วยงาน / กลุ่มงาน</label>
              <input className="cfg-input" value={unit} placeholder="เช่น กลุ่มงานโยธา"
                     onChange={(e) => setUnit(e.target.value)} />
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">หัวหน้าสังกัด</label>
              <input className="cfg-input" value={head} placeholder="ชื่อ-สกุลหัวหน้าสังกัด (ไม่บังคับ)"
                     onChange={(e) => setHead(e.target.value)} />
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">หมายเหตุ</label>
              <input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                     onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกต้นสังกัด'}
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
function AffiliationConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.affilLoad);
  const [modal, setModal] = useState(null);

  const persist = (next) => { setList(next); window.affilSave(next); };

  const sorted = React.useMemo(
    () => [...list].sort((a, b) => String(a.code).localeCompare(String(b.code))), [list]);

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({
        action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่ต้นสังกัด',
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขต้นสังกัด “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขต้นสังกัด “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: afUid(), ...vals }]);
      audit.log({
        action: 'create', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่ต้นสังกัด',
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มต้นสังกัด “${vals.name}”`,
        changes: [{ field: 'รหัสต้นสังกัด', before: '—', after: vals.code }],
      });
      onToast && onToast(`เพิ่มต้นสังกัด “${vals.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleEnabled = (d) => {
    persist(list.map(x => x.id === d.id ? { ...x, enabled: !x.enabled } : x));
    audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่ต้นสังกัด',
      target: `${d.code} · ${d.name}`,
      summary: `${d.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ต้นสังกัด “${d.name}”`,
    });
    onToast && onToast(`${d.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}ต้นสังกัด “${d.name}” แล้ว`);
  };

  const resetSeed = () => {
    const fresh = (window.AFFIL_SEED || []).map(d => ({ ...d }));
    persist(fresh);
    onToast && onToast('คืนค่าต้นสังกัดตั้งต้นเรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="หน้าค่าคงที่ต้นสังกัด">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ต้นสังกัด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 780 }}>
            กำหนดต้นสังกัดเป็นค่าคงที่พื้นฐานของระบบ — ระบุรหัสต้นสังกัด ชื่อสังกัด หน่วยงาน/กลุ่มงาน และหัวหน้าสังกัด
            เพื่อให้ทะเบียนสมาชิกและทุกเมนูที่แสดงต้นสังกัดเรียกใช้เป็นแหล่งข้อมูลเดียวกัน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่มต้นสังกัด
        </button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="bud-toolbar">
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> คลิกสวิตช์คอลัมน์ “สถานะใช้งาน” เพื่อปรับ ใช้งาน / ปิดใช้งาน ได้ทันที · กดไอคอนดินสอเพื่อแก้ไข
          </div>
        </div>

        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl ac-tbl" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 100 }}>รหัสต้นสังกัด</th>
                <th style={{ minWidth: 220 }}>ชื่อสังกัด</th>
                <th style={{ minWidth: 200 }}>หน่วยงาน / กลุ่มงาน</th>
                <th style={{ minWidth: 180 }}>หัวหน้าสังกัด</th>
                <th className="center" style={{ width: 90 }}>สมาชิก</th>
                <th className="center" style={{ width: 140 }}>สถานะใช้งาน</th>
                <th className="center" style={{ width: 80 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีต้นสังกัด — กดปุ่ม “เพิ่มต้นสังกัด” เพื่อเริ่มกำหนดค่าคงที่
                </td></tr>
              )}
              {sorted.map(d => {
                const usage = window.affilUsage(d.code);
                return (
                  <tr key={d.id} className={"ac-row" + (d.enabled ? '' : ' is-off')}>
                    <td className="center"><span className="ac-code-badge mono" style={{ width: 'auto', minWidth: 48, padding: '0 8px' }}>{d.code}</span></td>
                    <td className="ac-name-cell">
                      <div className="ac-name-line"><span className="ac-name">{d.name}</span></div>
                      {d.note && <div className="ac-note">{d.note}</div>}
                    </td>
                    <td>{d.unit || <span className="muted">—</span>}</td>
                    <td>{d.head || <span className="muted">—</span>}</td>
                    <td className="center mono">{usage > 0 ? fmt.int(usage) : <span className="muted">0</span>}</td>
                    <td className="center">
                      <button className={"ac-switch" + (d.enabled ? ' on' : '')}
                              onClick={() => toggleEnabled(d)}
                              title={d.enabled ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                              aria-pressed={d.enabled}>
                        <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
                        <span className="ac-switch-label">{d.enabled ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                      </button>
                    </td>
                    <td className="bud-act-cell">
                      <div className="bud-acts" style={{ justifyContent: 'center' }}>
                        <button className="bud-act" title="แก้ไข" onClick={() => setModal({ mode: 'edit', rec: d })}>
                          <Icon name="edit" size={13} />
                        </button>
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
        <Icon name="info" size={12} /> ต้นสังกัดนี้เป็นค่าคงที่พื้นฐานของระบบ — ทุกเมนูที่แสดงต้นสังกัด (ทะเบียนสมาชิก, รับชำระ, ติดตามหนี้ ฯลฯ) จะแสดงรหัสและชื่อสังกัดจากรายการนี้
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <AffiliationModal mode={modal.mode}
                          draft0={modal.mode === 'edit' ? modal.rec : null}
                          existing={list}
                          onClose={() => setModal(null)} onSubmit={submit} />
      )}
    </div>
  );
}

Object.assign(window, { AffiliationConfigPage });
