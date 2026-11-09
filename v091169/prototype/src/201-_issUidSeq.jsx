// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › ค่าคงที่ — กำหนดผู้ออกหลักทรัพย์ / คู่สัญญา
//  รายการผู้ออก/คู่สัญญา → เพิ่ม/แก้ไข (ป๊อบอัพ) · เปิด/ปิดการใช้งาน
// ════════════════════════════════════════════════════════════════════

let _issUidSeq = 0;
const issUid = () => 'ISS-N' + (++_issUidSeq);
const issToday = () => new Date().toISOString().slice(0, 10);
const ISS_USER = 'จันทร์เพ็ญ มาลี';

function issLoad() {
  try { const s = localStorage.getItem('invest_issuers'); if (s) return JSON.parse(s); } catch (e) {}
  return window.IV_ISSUER_SEED.map(r => ({ ...r }));
}
function issSaveLS(list) { try { localStorage.setItem('invest_issuers', JSON.stringify(list)); } catch (e) {} }

const issTypePill = (t) => <span className={"chip " + (window.IV_ISSUER_TYPE_PILL[t] || 'neutral')}><span className="dot-c" />{t}</span>;

// ════════════════════════════════════════════════════════════════════
//  Add / Edit modal
// ════════════════════════════════════════════════════════════════════
function IssFormModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [f, setF] = useState(editRec ? { ...editRec } : {
    code: '', name: '', issuerType: window.IV_ISSUER_TYPES[0], regNo: '',
    rating: '', contact: '', phone: '', email: '',
  });
  const [error, setError] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!f.code.trim()) return setError('กรุณาระบุรหัสผู้ออกหลักทรัพย์');
    if (!f.name.trim()) return setError('กรุณาระบุชื่อบริษัท / ธนาคาร / หน่วยงาน');
    const dup = list.some(r => r.code === f.code.trim() && (!isEdit || r.id !== editRec.id));
    if (dup) return setError('รหัสผู้ออกหลักทรัพย์นี้ถูกใช้แล้ว');
    onSubmit({
      id: isEdit ? editRec.id : issUid(),
      code: f.code.trim().toUpperCase(), name: f.name.trim(), issuerType: f.issuerType,
      regNo: f.regNo.trim(), rating: f.rating.trim(), contact: f.contact.trim(),
      phone: f.phone.trim(), email: f.email.trim(),
      enabled: isEdit ? editRec.enabled : false,
      createdDate: isEdit ? editRec.createdDate : issToday(),
      createdBy: isEdit ? editRec.createdBy : ISS_USER,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขผู้ออกหลักทรัพย์ / คู่สัญญา' : 'เพิ่มผู้ออกหลักทรัพย์ / คู่สัญญา'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isEdit ? `${editRec.code} · ${editRec.name}` : 'บันทึกข้อมูลผู้ออกตราสาร/คู่สัญญาสำหรับอ้างอิงเมื่อบันทึกการลงทุน'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัสผู้ออก <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={f.code} autoFocus={!isEdit} placeholder="เช่น TMB" onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อบริษัท / ธนาคาร / หน่วยงาน <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={f.name} placeholder="เช่น ธนาคารกรุงเทพ จำกัด (มหาชน)" onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">ประเภทผู้ออก</label>
              <select className="cfg-input" value={f.issuerType} onChange={(e) => set('issuerType', e.target.value)}>
                {window.IV_ISSUER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="lt-modal-label">เลขทะเบียนนิติบุคคล</label>
              <input className="cfg-input mono" value={f.regNo} placeholder="0xxxxxxxxxxxx" onChange={(e) => set('regNo', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">Rating / Credit Rating</label>
            <input className="cfg-input" value={f.rating} placeholder="เช่น AAA (tris) / AA+ / A" onChange={(e) => set('rating', e.target.value)} />
          </div>

          <div className="dat-section-head" style={{ background: 'transparent', borderBottom: '1px solid var(--divider)', padding: '12px 0 8px', marginTop: 8 }}>
            <span className="dat-section-ico"><Icon name="user" size={14} /></span>
            <div className="dat-section-title">ข้อมูลผู้ติดต่อ</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="lt-modal-label">ผู้ติดต่อ</label>
            <input className="cfg-input" value={f.contact} placeholder="เช่น ฝ่ายบริหารเงิน / นักลงทุนสัมพันธ์" onChange={(e) => set('contact', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">เบอร์โทร</label>
              <input className="cfg-input mono" value={f.phone} placeholder="0-2xxx-xxxx" onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">อีเมล</label>
              <input className="cfg-input" type="email" value={f.email} placeholder="contact@example.com" onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ออกหลักทรัพย์'}
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
function InvestIssuerConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(issLoad);
  const [form, setForm] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [q, setQ] = useState('');

  const persist = (next) => { setList(next); issSaveLS(next); };
  const activeCount = list.filter(r => r.enabled).length;

  const handleSubmit = (rec) => {
    const exists = list.some(r => r.id === rec.id);
    if (exists) {
      persist(list.map(r => r.id === rec.id ? rec : r));
      audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่ผู้ออกหลักทรัพย์',
        target: `${rec.code} · ${rec.name}`, summary: `แก้ไขผู้ออกหลักทรัพย์ “${rec.name}”` });
      onToast && onToast(`บันทึกผู้ออกหลักทรัพย์ “${rec.name}” เรียบร้อยแล้ว`);
    } else {
      persist([rec, ...list]);
      audit.log({ action: 'create', module: 'การเงินการลงทุน — ค่าคงที่ผู้ออกหลักทรัพย์',
        target: `${rec.code} · ${rec.name}`, summary: `เพิ่มผู้ออกหลักทรัพย์ “${rec.name}” (${rec.issuerType})`,
        changes: [{ field: 'รหัสผู้ออก', before: '—', after: rec.code }] });
      onToast && onToast(`เพิ่มผู้ออกหลักทรัพย์ “${rec.name}” เรียบร้อยแล้ว`);
    }
    setForm(null);
  };

  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่ผู้ออกหลักทรัพย์', target: `${rec.code} · ${rec.name}`,
      summary: (rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งานผู้ออกหลักทรัพย์ “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: rec.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน', after: rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }] });
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งาน “${rec.name}” แล้ว`);
  };

  const shown = list.filter(r => {
    if (typeFilter && r.issuerType !== typeFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return [r.code, r.name, r.regNo, r.rating, r.contact].some(v => String(v ?? '').toLowerCase().includes(n));
    }
    return true;
  });

  return (
    <div data-screen-label="หน้าค่าคงที่ผู้ออกหลักทรัพย์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ผู้ออกหลักทรัพย์ / คู่สัญญา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนผู้ออกตราสาร ธนาคาร และคู่สัญญา สำหรับอ้างอิงเมื่อบันทึกรายการลงทุน — เพิ่ม, แก้ไข และเปิด/ปิดการใช้งาน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}>
          <Icon name="plus" /> เพิ่มผู้ออกหลักทรัพย์
        </button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="shield" /></div>
        <div>
          <div className="lt-ab-label">ผู้ออกหลักทรัพย์ / คู่สัญญาทั้งหมด</div>
          <div className="lt-ab-name">{list.length} ราย
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 10 }}>
        <div className="search">
          <Icon name="search" size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัส, ชื่อ, เลขทะเบียน, เรตติ้ง..." />
        </div>
        <button className={"filter-chip" + (typeFilter === '' ? ' active' : '')} onClick={() => setTypeFilter('')}>ทุกประเภท</button>
        {window.IV_ISSUER_TYPES.map(t => (
          <button key={t} className={"filter-chip" + (typeFilter === t ? ' active' : '')} onClick={() => setTypeFilter(typeFilter === t ? '' : t)}>
            {t} <span className="count">{list.filter(r => r.issuerType === t).length}</span>
          </button>
        ))}
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>แสดง {shown.length}/{list.length} ราย</span>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1120 }}>
            <thead>
              <tr>
                <th style={{ width: 84 }}>รหัส</th>
                <th style={{ minWidth: 250 }}>ชื่อบริษัท / ธนาคาร / หน่วยงาน</th>
                <th className="center" style={{ width: 110 }}>ประเภทผู้ออก</th>
                <th style={{ width: 140 }}>เลขทะเบียน</th>
                <th className="center" style={{ width: 110 }}>Rating</th>
                <th style={{ minWidth: 170 }}>ผู้ติดต่อ</th>
                <th className="center" style={{ width: 90 }}>สถานะ</th>
                <th className="center" style={{ width: 70 }}>ใช้งาน</th>
                <th className="center" style={{ width: 84 }} />
              </tr>
            </thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id} className={r.enabled ? 'selected' : ''}>
                  <td className="mono">{r.code}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {(r.phone || r.email) && (
                      <div className="lt-row-note muted">{[r.phone, r.email].filter(Boolean).join(' · ')}</div>
                    )}
                  </td>
                  <td className="center">{issTypePill(r.issuerType)}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.regNo || <span className="muted">—</span>}</td>
                  <td className="center">{r.rating ? <span className="chip"><span className="dot-c" />{r.rating}</span> : <span className="muted">—</span>}</td>
                  <td>{r.contact || <span className="muted">—</span>}</td>
                  <td className="center">{r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}</td>
                  <td className="center">
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => toggle(r)}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center">
                    <button className="btn ghost sm" onClick={() => setForm({ editRec: r })}>
                      <Icon name="edit" size={13} /> แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan="9" className="empty-state" style={{ padding: 28 }}>— ไม่พบผู้ออกหลักทรัพย์ตามเงื่อนไข —</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เฉพาะผู้ออกหลักทรัพย์/คู่สัญญาที่ “เปิดใช้งาน” เท่านั้นที่จะแสดงเป็นตัวเลือกเมื่อบันทึกรายการลงทุน
      </div>

      {form && <IssFormModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={handleSubmit} />}
    </div>
  );
}

Object.assign(window, { InvestIssuerConfigPage });
