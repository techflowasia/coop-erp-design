// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › ค่าคงที่ — กำหนดแหล่งเงิน / Tagging
//  แหล่งเงินที่ใช้ลงทุน + วงเงินประจำปี + GL + สี Tag
//  เพิ่ม/แก้ไข (โมดัล) · เปิด/ปิดการใช้งาน · แสดงสัดส่วนการใช้วงเงิน
// ════════════════════════════════════════════════════════════════════

let _ftUidSeq = 0;
const ftUid = () => 'FT-N' + (++_ftUidSeq);
const FT_USER = 'จันทร์เพ็ญ มาลี';
const ftColorLabel = { primary: 'เขียว', info: 'น้ำเงิน', warning: 'ส้ม', success: 'เขียวอ่อน', danger: 'แดง', neutral: 'เทา' };

function FtFormModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [f, setF] = useState(editRec ? { ...editRec } : {
    code: '', tag: '', color: 'primary', annualLimit: '', glCode: '', note: '',
  });
  const [error, setError] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!f.code.trim()) return setError('กรุณาระบุรหัสแหล่งเงิน');
    if (!f.tag.trim()) return setError('กรุณาระบุชื่อแหล่งเงิน / Tag');
    const dup = list.some(r => r.code === f.code.trim().toUpperCase() && (!isEdit || r.id !== editRec.id));
    if (dup) return setError('รหัสแหล่งเงินนี้ถูกใช้แล้ว');
    onSubmit({
      id: isEdit ? editRec.id : ftUid(),
      code: f.code.trim().toUpperCase(), tag: f.tag.trim(), color: f.color,
      annualLimit: Number(f.annualLimit) || 0, used: isEdit ? editRec.used : 0,
      glCode: f.glCode.trim(), note: f.note.trim(),
      enabled: isEdit ? editRec.enabled : false,
      createdDate: isEdit ? editRec.createdDate : new Date().toISOString().slice(0, 10),
      createdBy: isEdit ? editRec.createdBy : FT_USER,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขแหล่งเงิน / Tag' : 'เพิ่มแหล่งเงิน / Tag'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{isEdit ? `${editRec.code} · ${editRec.tag}` : 'กำหนดแหล่งเงินสำหรับจับคู่กับรายการลงทุน'}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัสแหล่งเงิน <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={f.code} autoFocus={!isEdit} placeholder="เช่น OPR" onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อแหล่งเงิน / Tag <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={f.tag} placeholder="เช่น ทุนดำเนินงาน" onChange={(e) => set('tag', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">วงเงินลงทุนประจำปี (บาท)</label>
              <input className="cfg-input mono" type="number" value={f.annualLimit} placeholder="0" onChange={(e) => set('annualLimit', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">รหัสบัญชี GL</label>
              <input className="cfg-input mono" value={f.glCode} placeholder="เช่น 11030101" onChange={(e) => set('glCode', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">สี Tag</label>
            <div className="ft-color-row">
              {window.IV_FUND_TAG_COLORS.map(c => (
                <button type="button" key={c} className={"ft-color-opt" + (f.color === c ? ' active' : '')} onClick={() => set('color', c)}>
                  <span className={"chip " + c}><span className="dot-c" />{ftColorLabel[c]}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">หมายเหตุ</label>
            <input className="cfg-input" value={f.note} placeholder="คำอธิบายการใช้แหล่งเงินนี้" onChange={(e) => set('note', e.target.value)} />
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มแหล่งเงิน'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function InvestFundTagConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.ivFundTagLoad);
  const [form, setForm] = useState(null);
  const [q, setQ] = useState('');

  const persist = (next) => { setList(next); window.ivFundTagSave(next); };
  const activeCount = list.filter(r => r.enabled).length;
  const totalLimit = list.filter(r => r.enabled).reduce((s, r) => s + r.annualLimit, 0);
  const totalUsed = list.filter(r => r.enabled).reduce((s, r) => s + r.used, 0);

  const handleSubmit = (rec) => {
    const exists = list.some(r => r.id === rec.id);
    if (exists) {
      persist(list.map(r => r.id === rec.id ? rec : r));
      audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่แหล่งเงิน', target: `${rec.code} · ${rec.tag}`, summary: `แก้ไขแหล่งเงิน “${rec.tag}”` });
      onToast && onToast(`บันทึกแหล่งเงิน “${rec.tag}” เรียบร้อยแล้ว`);
    } else {
      persist([rec, ...list]);
      audit.log({ action: 'create', module: 'การเงินการลงทุน — ค่าคงที่แหล่งเงิน', target: `${rec.code} · ${rec.tag}`,
        summary: `เพิ่มแหล่งเงิน “${rec.tag}”`, changes: [{ field: 'รหัสแหล่งเงิน', before: '—', after: rec.code }] });
      onToast && onToast(`เพิ่มแหล่งเงิน “${rec.tag}” เรียบร้อยแล้ว`);
    }
    setForm(null);
  };

  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่แหล่งเงิน', target: `${rec.code} · ${rec.tag}`,
      summary: (rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งานแหล่งเงิน “${rec.tag}”` });
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งาน “${rec.tag}” แล้ว`);
  };

  const shown = list.filter(r => {
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return [r.code, r.tag, r.glCode, r.note].some(v => String(v ?? '').toLowerCase().includes(n));
  });

  return (
    <div data-screen-label="หน้าค่าคงที่แหล่งเงิน Tagging">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่แหล่งเงิน / Tagging</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดแหล่งเงินที่ใช้ลงทุน (Fund Source) พร้อมวงเงินประจำปีและบัญชี GL — ใช้จับคู่กับรายการลงทุนเพื่อควบคุมวงเงินแยกตามแหล่งเงิน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}><Icon name="plus" /> เพิ่มแหล่งเงิน</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="แหล่งเงินทั้งหมด" value={list.length + ' รายการ'} sub={`เปิดใช้งาน ${activeCount} · ปิด ${list.length - activeCount}`} accent />
        <IvStat label="วงเงินลงทุนรวม (เปิดใช้งาน)" value={'฿ ' + fmt.money(totalLimit, 0)} />
        <IvStat label="ใช้ไปแล้ว" value={'฿ ' + fmt.money(totalUsed, 0)} sub={totalLimit ? (totalUsed / totalLimit * 100).toFixed(1) + '% ของวงเงิน' : ''} tone="warning" />
      </div>

      <div className="toolbar" style={{ margin: '12px 0 10px' }}>
        <div className="search">
          <Icon name="search" size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัส, ชื่อแหล่งเงิน, GL..." />
        </div>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>แสดง {shown.length}/{list.length} รายการ</span>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1040 }}>
            <thead><tr>
              <th style={{ width: 70 }}>รหัส</th><th style={{ minWidth: 160 }}>แหล่งเงิน / Tag</th>
              <th className="mono" style={{ width: 100 }}>GL</th>
              <th className="right" style={{ width: 140 }}>วงเงินประจำปี</th>
              <th className="right" style={{ width: 130 }}>ใช้ไปแล้ว</th>
              <th style={{ width: 160 }}>สัดส่วนการใช้</th>
              <th className="center" style={{ width: 80 }}>สถานะ</th>
              <th className="center" style={{ width: 64 }}>ใช้งาน</th>
              <th className="center" style={{ width: 80 }} />
            </tr></thead>
            <tbody>
              {shown.map(r => {
                const pct = r.annualLimit ? r.used / r.annualLimit * 100 : 0;
                return (
                  <tr key={r.id} className={r.enabled ? 'selected' : ''}>
                    <td className="mono">{r.code}</td>
                    <td>
                      <span className={"chip " + r.color}><span className="dot-c" />{r.tag}</span>
                      {r.note && <div className="lt-row-note muted" style={{ marginTop: 3 }}>{r.note}</div>}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.glCode || <span className="muted">—</span>}</td>
                    <td className="right mono">{fmt.money(r.annualLimit, 0)}</td>
                    <td className="right mono">{fmt.money(r.used, 0)}</td>
                    <td>
                      <IvBar pct={pct} />
                      <div className="muted mono" style={{ fontSize: 11, marginTop: 3 }}>{pct.toFixed(1)}%</div>
                    </td>
                    <td className="center">{r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}</td>
                    <td className="center">
                      <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled} aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => toggle(r)}>
                        <span className="lt-switch-knob" />
                      </button>
                    </td>
                    <td className="center"><button className="btn ghost sm" onClick={() => setForm({ editRec: r })}><Icon name="edit" size={13} /> แก้ไข</button></td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan="9" className="empty-state" style={{ padding: 28 }}>— ไม่พบแหล่งเงินตามเงื่อนไข —</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> เฉพาะแหล่งเงินที่ “เปิดใช้งาน” เท่านั้นที่จะแสดงเป็นตัวเลือกเมื่อบันทึกรายการลงทุน</div>

      {form && <FtFormModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={handleSubmit} />}
    </div>
  );
}

Object.assign(window, { InvestFundTagConfigPage });
