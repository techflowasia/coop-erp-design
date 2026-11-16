// ═════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ › ค่าคงที่ — วัตถุประสงค์การกู้
//  กำหนดวัตถุประสงค์การกู้ที่ใช้ในใบคำขอกู้เงิน
//  + ระบุว่าวัตถุประสงค์ใดออกหนังสือรับรองดอกเบี้ยได้
//    (เมื่อกำหนดให้ออกได้ ต้องระบุรายละเอียดวัตถุประสงค์อย่างน้อย 1 รายการ)
// ═════════════════════════════════════════════════════════════════════

let _lpuUidSeq = 0;
const lpuUid = () => 'LPU-N' + (++_lpuUidSeq);
const LPU_USER = 'สมหญิง ก.';
const LPU_MODULE = 'สินเชื่อ — ค่าคงที่วัตถุประสงค์การกู้';

function LpuFormModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [f, setF] = useState(editRec ? { ...editRec, details: [...(editRec.details || [])] } : {
    code: '', v: '', name: '', note: '', taxLaw: '', taxCert: false, details: [],
  });
  const [error, setError] = useState('');
  const set = (k, val) => { setF(s => ({ ...s, [k]: val })); setError(''); };
  const setDetail = (i, val) => setF(s => ({ ...s, details: s.details.map((d, j) => j === i ? val : d) }));
  const addDetail = () => setF(s => ({ ...s, details: [...s.details, ''] }));
  const delDetail = (i) => setF(s => ({ ...s, details: s.details.filter((_, j) => j !== i) }));

  const toggleTaxCert = (on) => {
    setError('');
    setF(s => ({ ...s, taxCert: on, details: on && s.details.length === 0 ? [''] : s.details }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.code.trim()) return setError('กรุณาระบุรหัสวัตถุประสงค์');
    if (!f.name.trim()) return setError('กรุณาระบุชื่อวัตถุประสงค์การกู้');
    if (list.some(r => r.code === f.code.trim() && (!isEdit || r.id !== editRec.id)))
      return setError('รหัสวัตถุประสงค์นี้ถูกใช้แล้ว');
    const details = f.details.map(d => d.trim()).filter(Boolean);
    if (f.taxCert && details.length === 0)
      return setError('วัตถุประสงค์ที่ออกหนังสือรับรองดอกเบี้ยได้ ต้องระบุรายละเอียดวัตถุประสงค์อย่างน้อย 1 รายการ');
    onSubmit({
      id: isEdit ? editRec.id : lpuUid(),
      code: f.code.trim(),
      v: (f.v || '').trim() || (isEdit ? editRec.v : 'p' + f.code.trim()),
      name: f.name.trim(), note: f.note.trim(),
      taxCert: !!f.taxCert, taxLaw: f.taxCert ? f.taxLaw.trim() : '',
      details: f.taxCert ? details : [],
      enabled: isEdit ? editRec.enabled : true,
      createdDate: isEdit ? editRec.createdDate : window.DEPOSIT_WORKING_DATE || '',
      createdBy: isEdit ? editRec.createdBy : LPU_USER,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขวัตถุประสงค์การกู้' : 'เพิ่มวัตถุประสงค์การกู้'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isEdit ? `${editRec.code} · ${editRec.name}` : 'ใช้เป็นตัวเลือกวัตถุประสงค์ในใบคำขอกู้เงิน'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัส <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={f.code} autoFocus={!isEdit} placeholder="เช่น 08"
                     onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อวัตถุประสงค์การกู้ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={f.name} placeholder="เช่น เพื่อที่อยู่อาศัย"
                     onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">หมายเหตุ / คำอธิบาย</label>
            <input className="cfg-input" value={f.note} placeholder="คำอธิบายการใช้วัตถุประสงค์นี้"
                   onChange={(e) => set('note', e.target.value)} />
          </div>

          <div className="lpu-flag">
            <button type="button" className={"lt-switch" + (f.taxCert ? ' on' : '')} role="switch"
                    aria-checked={!!f.taxCert} onClick={() => toggleTaxCert(!f.taxCert)}>
              <span className="lt-switch-knob" />
            </button>
            <div style={{ minWidth: 0 }}>
              <b>ออกหนังสือรับรองดอกเบี้ยได้</b>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                เมื่อเปิด — ใบคำขอกู้ที่ติ๊ก “หนังสือรับรองดอกเบี้ย” และเลือกวัตถุประสงค์นี้ จะต้องระบุรายละเอียดวัตถุประสงค์เพิ่มเติม
              </div>
            </div>
          </div>

          {f.taxCert && (
            <div className="lpu-detail-box">
              <div style={{ marginBottom: 10 }}>
                <label className="lt-modal-label">อ้างอิงกฎหมาย / ประกาศ</label>
                <input className="cfg-input" value={f.taxLaw} placeholder="เช่น ประกาศอธิบดีกรมสรรพากร ฯ (ฉบับที่ 165)"
                       onChange={(e) => set('taxLaw', e.target.value)} />
              </div>
              <div className="lpu-detail-head">
                <label className="lt-modal-label" style={{ margin: 0 }}>
                  รายละเอียดวัตถุประสงค์ <span className="cfg-required">*</span>
                </label>
                <span className="muted" style={{ fontSize: 11 }}>{f.details.length} รายการ</span>
                <span className="spacer" />
                <button type="button" className="btn dashed sm" onClick={addDetail}><Icon name="plus" size={12} /> เพิ่มรายละเอียด</button>
              </div>
              <div className="lpu-detail-list">
                {f.details.map((d, i) => (
                  <div className="lpu-detail-row" key={i}>
                    <span className="lpu-detail-no mono">{i + 1}</span>
                    <input className="cfg-input" value={d} placeholder="เช่น ซื้ออาคารพร้อมที่ดิน"
                           onChange={(e) => setDetail(i, e.target.value)} />
                    <button type="button" className="btn text sm act-del" onClick={() => delDetail(i)} aria-label="ลบรายละเอียด">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                ))}
                {f.details.length === 0 && <div className="empty-state" style={{ padding: 14 }}>— ยังไม่มีรายละเอียด —</div>}
              </div>
              <div className="lt-list-foot muted" style={{ marginTop: 8 }}>
                <Icon name="info" size={12} /> รายการเหล่านี้จะแสดงเป็น Listbox ให้เจ้าหน้าที่เลือกในใบคำขอกู้เงิน
              </div>
            </div>
          )}

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มวัตถุประสงค์'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function LoanPurposeConstPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.lpuLoad);
  const [form, setForm] = useState(null);
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('all');   // all | cert | nocert

  const persist = (next) => { setList(next); window.lpuSave(next); };
  const certCount = list.filter(r => r.taxCert).length;
  const activeCount = list.filter(r => r.enabled).length;

  const handleSubmit = (rec) => {
    if (list.some(r => r.id === rec.id)) {
      persist(list.map(r => r.id === rec.id ? rec : r));
      audit.log({ action: 'update', module: LPU_MODULE, target: `${rec.code} · ${rec.name}`,
        summary: `แก้ไขวัตถุประสงค์การกู้ “${rec.name}”` + (rec.taxCert ? ` · ออกหนังสือรับรองดอกเบี้ยได้ (${rec.details.length} รายละเอียด)` : '') });
      onToast && onToast(`บันทึกวัตถุประสงค์ “${rec.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, rec]);
      audit.log({ action: 'create', module: LPU_MODULE, target: `${rec.code} · ${rec.name}`,
        summary: `เพิ่มวัตถุประสงค์การกู้ “${rec.name}”`,
        changes: [{ field: 'ออกหนังสือรับรองดอกเบี้ย', before: '—', after: rec.taxCert ? 'ได้' : 'ไม่ได้' }] });
      onToast && onToast(`เพิ่มวัตถุประสงค์ “${rec.name}” เรียบร้อยแล้ว`);
    }
    setForm(null);
  };

  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    audit.log({ action: 'update', module: LPU_MODULE, target: `${rec.code} · ${rec.name}`,
      summary: (rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งานวัตถุประสงค์ “${rec.name}”` });
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งาน “${rec.name}” แล้ว`);
  };

  const shown = list.filter(r => {
    if (only === 'cert' && !r.taxCert) return false;
    if (only === 'nocert' && r.taxCert) return false;
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return [r.code, r.name, r.note, ...(r.details || [])].some(v => String(v ?? '').toLowerCase().includes(n));
  });

  return (
    <div data-screen-label="ค่าคงที่วัตถุประสงค์การกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่วัตถุประสงค์การกู้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดวัตถุประสงค์การกู้ที่ใช้ในใบคำขอกู้เงิน และระบุวัตถุประสงค์ที่สามารถออกหนังสือรับรองดอกเบี้ยได้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}><Icon name="plus" /> เพิ่มวัตถุประสงค์</button>
      </div>

      <div className="toolbar" style={{ margin: '12px 0 10px' }}>
        <div className="search">
          <Icon name="search" size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัส, ชื่อวัตถุประสงค์, รายละเอียด..." />
        </div>
        <div className="tabs-bar subtab" style={{ border: 0 }}>
          {[['all', 'ทั้งหมด'], ['cert', 'ออกหนังสือรับรองได้'], ['nocert', 'ไม่ออกหนังสือรับรอง']].map(([v, l]) => (
            <button key={v} className={"tab" + (only === v ? ' active' : '')} onClick={() => setOnly(v)}>{l}</button>
          ))}
        </div>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>
          ทั้งหมด {list.length} · เปิดใช้งาน {activeCount} · ออกหนังสือรับรองได้ {certCount}
        </span>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1020 }}>
            <thead><tr>
              <th style={{ width: 64 }}>รหัส</th>
              <th style={{ minWidth: 210 }}>วัตถุประสงค์การกู้</th>
              <th className="center" style={{ width: 150 }}>หนังสือรับรองดอกเบี้ย</th>
              <th style={{ minWidth: 320 }}>รายละเอียดวัตถุประสงค์</th>
              <th className="center" style={{ width: 88 }}>สถานะ</th>
              <th className="center" style={{ width: 60 }}>ใช้งาน</th>
              <th className="center" style={{ width: 80 }} />
            </tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id} className={r.enabled ? '' : 'lpu-off'}>
                  <td className="mono">{r.code}</td>
                  <td>
                    <b style={{ fontWeight: 600 }}>{r.name}</b>
                    {r.note && <div className="lt-row-note muted" style={{ marginTop: 3 }}>{r.note}</div>}
                  </td>
                  <td className="center">
                    {r.taxCert
                      ? <span className="chip primary"><span className="dot-c" />ออกได้</span>
                      : <span className="muted">—</span>}
                    {r.taxCert && r.taxLaw && <div className="lt-row-note muted" style={{ marginTop: 3 }}>{r.taxLaw}</div>}
                  </td>
                  <td>
                    {r.taxCert ? (
                      <div className="lpu-chip-wrap">
                        {(r.details || []).map((d, i) => <span className="pill neutral" key={i}>{d}</span>)}
                      </div>
                    ) : <span className="muted">ไม่ต้องระบุ</span>}
                  </td>
                  <td className="center">{r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}</td>
                  <td className="center">
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => toggle(r)}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center">
                    <button className="btn sm" onClick={() => setForm({ editRec: r })}><Icon name="edit" size={13} /> แก้ไข</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan="7" className="empty-state" style={{ padding: 28 }}>— ไม่พบวัตถุประสงค์ตามเงื่อนไข —</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เฉพาะวัตถุประสงค์ที่ “เปิดใช้งาน” จะแสดงเป็นตัวเลือกในใบคำขอกู้เงิน · เมื่อติ๊ก “หนังสือรับรองดอกเบี้ย” ในใบคำขอ ระบบจะตรวจสอบว่าวัตถุประสงค์ที่เลือกออกหนังสือรับรองได้หรือไม่
      </div>

      {form && <LpuFormModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={handleSubmit} />}
    </div>
  );
}

Object.assign(window, { LoanPurposeConstPage });
