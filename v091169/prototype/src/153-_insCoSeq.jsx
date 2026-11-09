// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ › ค่าคงที่ — บริษัทประกันภัย (Insurance Company)
//  ทะเบียนบริษัท/สมาคมประกันภัย → เพิ่ม/แก้ไข (ป๊อบอัพ) · เปิด/ปิดการใช้งาน
//  ใช้อ้างอิงเมื่อทำประกันหรือต่ออายุประกันของสมาชิก
// ════════════════════════════════════════════════════════════════════

let _insCoSeq = 0;
const insCoUid = () => 'INSCO-N' + (++_insCoSeq);

const insCoTypePill = (t) =>
  <span className={"chip " + (window.INS_CO_TYPE_PILL[t] || 'neutral')}><span className="dot-c" />{t}</span>;
const insCoTypePills = (types) => (types || []).length
  ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>{types.map(t => insCoTypePill(t))}</div>
  : <span className="muted">—</span>;

// ════════════════════════════════════════════════════════════════════
//  Add / Edit modal
// ════════════════════════════════════════════════════════════════════
function InsCoFormModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [f, setF] = useState(editRec ? { ...editRec } : {
    code: '', name: '', insurerTypes: [window.INS_CO_TYPES[0]], regNo: '',
    contact: '', phone: '', email: '', note: '',
  });
  const [error, setError] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };
  const toggleType = (t) => setF(s => {
    const has = s.insurerTypes.includes(t);
    return { ...s, insurerTypes: has ? s.insurerTypes.filter(x => x !== t) : [...s.insurerTypes, t] };
  });

  const submit = (e) => {
    e.preventDefault();
    if (!f.code.trim()) return setError('กรุณาระบุรหัสบริษัทประกัน');
    if (!f.name.trim()) return setError('กรุณาระบุชื่อบริษัท / สมาคมประกันภัย');
    if (!f.insurerTypes.length) return setError('กรุณาเลือกประเภทประกันอย่างน้อย 1 ประเภท');
    const dup = list.some(r => r.code === f.code.trim().toUpperCase() && (!isEdit || r.id !== editRec.id));
    if (dup) return setError('รหัสบริษัทประกันนี้ถูกใช้แล้ว');
    onSubmit({
      id: isEdit ? editRec.id : insCoUid(),
      code: f.code.trim().toUpperCase(), name: f.name.trim(), insurerTypes: f.insurerTypes,
      regNo: f.regNo.trim(), contact: f.contact.trim(), phone: f.phone.trim(),
      email: f.email.trim(), note: f.note.trim(),
      enabled: isEdit ? editRec.enabled : true,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขบริษัทประกันภัย' : 'เพิ่มบริษัทประกันภัย'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isEdit ? `${editRec.code} · ${editRec.name}` : 'บันทึกบริษัท/สมาคมประกันสำหรับอ้างอิงเมื่อทำประกันหรือต่ออายุประกันของสมาชิก'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัสบริษัท <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={f.code} autoFocus={!isEdit} placeholder="เช่น TIP" onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อบริษัท / สมาคมประกันภัย <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={f.name} placeholder="เช่น บมจ. ทิพยประกันภัย" onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">ประเภทประกัน <span className="cfg-required">*</span></label>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 14, paddingTop: 4, overflowX: 'auto' }}>
              {window.INS_CO_TYPES.map(t => (
                <label key={t} className="l2-check" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                  <input type="checkbox" className="ct-check" checked={f.insurerTypes.includes(t)} onChange={() => toggleType(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">เลขทะเบียนนิติบุคคล</label>
            <input className="cfg-input mono" value={f.regNo} placeholder="0xxxxxxxxxxxx" onChange={(e) => set('regNo', e.target.value)} />
          </div>

          <div className="dat-section-head" style={{ background: 'transparent', borderBottom: '1px solid var(--divider)', padding: '12px 0 8px', marginTop: 8 }}>
            <span className="dat-section-ico"><Icon name="user" size={14} /></span>
            <div className="dat-section-title">ข้อมูลผู้ติดต่อ</div>
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="lt-modal-label">ผู้ติดต่อ</label>
            <input className="cfg-input" value={f.contact} placeholder="เช่น ฝ่ายรับประกันภัย / ประกันกลุ่ม" onChange={(e) => set('contact', e.target.value)} />
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

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">หมายเหตุ / ประเภทกรมธรรม์ที่รับ</label>
            <input className="cfg-input" value={f.note} placeholder="เช่น ประกันชีวิตคุ้มครองสินเชื่อ, อัคคีภัย (ไม่บังคับ)" onChange={(e) => set('note', e.target.value)} />
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มบริษัทประกัน'}
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
const INSCO_G = '#237450';
const INSCO_SOFT = '#eafef2';
const INSCO_LINE = '#f0f0f0';
const INSCO_TH = { textAlign: 'left', fontWeight: 600, fontSize: 12, padding: '9px 12px', borderBottom: '1px solid ' + INSCO_LINE, color: 'rgba(0,0,0,.65)' };
const INSCO_TD = { padding: '10px 12px', borderBottom: '1px solid ' + INSCO_LINE, verticalAlign: 'top' };
const inscoBtn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 14px',
  border: '1px solid ' + (primary ? INSCO_G : '#d9d9d9'), background: primary ? INSCO_G : '#fff',
  color: primary ? '#fff' : 'rgba(0,0,0,.65)', borderRadius: 4, fontFamily: 'inherit',
  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
});

function InsuranceCompanyConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.insCoLoad);
  const [form, setForm] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [stDraft, setStDraft] = useState('all');
  const [stApplied, setStApplied] = useState('all');
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);
  const [confirm, setConfirm] = useState(null);
  const [done, setDone] = useState(null);

  const persist = (next) => { setList(next); window.insCoSave(next); };
  const MODULE = 'สินเชื่อ — ค่าคงที่บริษัทประกันภัย';

  const handleSubmit = (rec) => {
    const exists = list.some(r => r.id === rec.id);
    if (exists) {
      persist(list.map(r => r.id === rec.id ? rec : r));
      audit.log({ action: 'update', module: MODULE,
        target: `${rec.code} · ${rec.name}`, summary: `แก้ไขบริษัทประกัน “${rec.name}”` });
      setDone({ title: 'บันทึกการแก้ไขเรียบร้อยแล้ว', detail: rec.name });
    } else {
      persist([rec, ...list]);
      audit.log({ action: 'create', module: MODULE,
        target: `${rec.code} · ${rec.name}`, summary: `เพิ่มบริษัทประกัน “${rec.name}” (${rec.insurerTypes.join(', ')})`,
        changes: [{ field: 'รหัสบริษัท', before: '—', after: rec.code }] });
      setDone({ title: 'เพิ่มบริษัทประกันภัยเรียบร้อยแล้ว', detail: rec.name });
    }
    setForm(null);
  };

  const doToggle = (rec, next) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: next } : r));
    audit.log({ action: 'update', module: MODULE, target: `${rec.code} · ${rec.name}`,
      summary: (next ? 'เปิด' : 'ปิด') + `ใช้งานบริษัทประกัน “${rec.name}”` });
    setConfirm(null);
    setDone({ title: (next ? 'เปิด' : 'ปิด') + 'การใช้งานเรียบร้อยแล้ว', detail: rec.name });
  };

  const term = applied.trim().toLowerCase();
  const matched = list.filter(r => {
    if (typeFilter && !(r.insurerTypes || []).includes(typeFilter)) return false;
    if (stApplied !== 'all' && (stApplied === 'on') !== !!r.enabled) return false;
    if (term) return [r.code, r.name, r.regNo, r.contact, r.note].some(v => String(v ?? '').toLowerCase().includes(term));
    return true;
  });
  const total = matched.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * per;
  const shown = matched.slice(start, start + per);

  const tabCount = (t) => list.filter(r => {
    if (t && !(r.insurerTypes || []).includes(t)) return false;
    if (term) return [r.code, r.name, r.regNo, r.contact, r.note].some(v => String(v ?? '').toLowerCase().includes(term));
    return true;
  }).length;

  const segBtn = (key, label) => {
    const on = typeFilter === key;
    return (
      <button key={key || 'all'} type="button" onClick={() => { setTypeFilter(key); setPage(1); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 2px',
                       border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13,
                       cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '2px solid ' + (on ? INSCO_G : 'transparent'),
                       color: on ? INSCO_G : 'rgba(0,0,0,.65)', fontWeight: on ? 600 : 400,
                       transition: 'color .15s, border-color .15s' }}>
        {label}
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 18,
                       padding: '0 6px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                       background: on ? INSCO_SOFT : '#f5f5f5', color: on ? INSCO_G : 'rgba(0,0,0,.45)' }}>{tabCount(key)}</span>
      </button>
    );
  };

  const pageBtn = (n, label, disabled, active) => (
    <button key={label} type="button" disabled={disabled} onClick={() => !disabled && setPage(n)}
            aria-current={active ? 'page' : undefined}
            style={{ minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
                     cursor: disabled ? 'default' : 'pointer',
                     border: '1px solid ' + (active ? INSCO_G : '#d9d9d9'),
                     background: active ? INSCO_G : '#fff',
                     color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)') }}>{label}</button>
  );

  return (
    <div data-screen-label="หน้าค่าคงที่บริษัทประกันภัย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บริษัทประกันภัย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 780 }}>
            ทะเบียนบริษัทและสมาคมประกันภัยที่สหกรณ์ใช้อ้างอิงเมื่อทำประกันหรือต่ออายุประกันของสมาชิก —
            เพิ่ม, แก้ไข และเปิด/ปิดการใช้งาน โดยเฉพาะรายการที่เปิดใช้งานจะแสดงเป็นตัวเลือกในเมนูงานประกัน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}>
          <Icon name="plus" /> เพิ่มบริษัทประกัน
        </button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, padding: '14px 16px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>ค้นหา</span>
            <div className="gcc-search-input" style={{ flex: 'none', width: 340, maxWidth: 'none' }}>
              <Icon name="search" size={14} />
              <input className="cfg-input" value={q} onChange={(e) => setQ(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') { setApplied(q); setStApplied(stDraft); setPage(1); } }}
                     placeholder="รหัส / ชื่อบริษัท / เลขทะเบียน / ผู้ติดต่อ…" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>สถานะ</span>
            <select className="cfg-input" style={{ width: 150 }} value={stDraft} onChange={(e) => setStDraft(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="on">เปิดใช้งาน</option>
              <option value="off">ปิดใช้งาน</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn primary" onClick={() => { setApplied(q); setStApplied(stDraft); setPage(1); }}>ค้นหา</button>
            <button type="button" className="btn" onClick={() => { setQ(''); setApplied(''); setStDraft('all'); setStApplied('all'); setTypeFilter(''); setPage(1); }}>รีเซ็ต</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 16px', flexWrap: 'wrap',
                      borderBottom: '1px solid ' + INSCO_LINE }}>
          {segBtn('', 'ทั้งหมด')}
          {window.INS_CO_TYPES.map(t => segBtn(t, t))}
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1020, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ ...INSCO_TH, width: 84 }}>รหัส</th>
                  <th style={{ ...INSCO_TH, minWidth: 260 }}>ชื่อบริษัท / สมาคมประกันภัย</th>
                  <th style={{ ...INSCO_TH, width: 190, textAlign: 'center' }}>ประเภทประกัน</th>
                  <th style={{ ...INSCO_TH, width: 150 }}>เลขทะเบียน</th>
                  <th style={{ ...INSCO_TH, minWidth: 180 }}>ผู้ติดต่อ</th>
                  <th style={{ ...INSCO_TH, width: 104, textAlign: 'center' }}>สถานะ</th>
                  <th style={{ ...INSCO_TH, width: 70, textAlign: 'center' }}>ใช้งาน</th>
                  <th style={{ ...INSCO_TH, width: 84, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.id} style={r.enabled ? undefined : { background: '#fafafa', opacity: .72 }}>
                    <td style={{ ...INSCO_TD, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12, color: 'rgba(0,0,0,.65)' }}>{r.code}</td>
                    <td style={INSCO_TD}>
                      <span style={{ display: 'block', fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>{r.name}</span>
                      {r.note && <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3, lineHeight: 1.5 }}>{r.note}</span>}
                    </td>
                    <td style={{ ...INSCO_TD, textAlign: 'center' }}>{insCoTypePills(r.insurerTypes)}</td>
                    <td style={{ ...INSCO_TD, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12 }}>
                      {r.regNo || <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}
                    </td>
                    <td style={INSCO_TD}>
                      {r.contact || r.phone || r.email ? (
                        <>
                          <span style={{ display: 'block' }}>{r.contact || <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}</span>
                          {(r.phone || r.email) && (
                            <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3 }}>
                              {[r.phone, r.email].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </>
                      ) : <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}
                    </td>
                    <td style={{ ...INSCO_TD, textAlign: 'center' }}>
                      {r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}
                    </td>
                    <td style={{ ...INSCO_TD, textAlign: 'center' }}>
                      <button type="button" role="switch" aria-checked={!!r.enabled}
                              aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                              onClick={() => setConfirm({ rec: r, next: !r.enabled })}
                              style={{ position: 'relative', width: 44, height: 22, flexShrink: 0, border: 'none',
                                       borderRadius: 9999, cursor: 'pointer', padding: 0, transition: 'background .18s',
                                       background: r.enabled ? INSCO_G : 'rgba(0,0,0,.25)' }}>
                        <span style={{ position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18,
                                       borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
                      </button>
                    </td>
                    <td style={{ ...INSCO_TD, textAlign: 'center' }}>
                      <button type="button" onClick={() => setForm({ editRec: r })}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 9px',
                                       border: '1px solid transparent', background: 'transparent', borderRadius: 4,
                                       fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <Icon name="edit" size={13} /> แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr><td colSpan={8} style={{ ...INSCO_TD, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 0', borderTop: '1px solid ' + INSCO_LINE, display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
              {total === 0 ? '0 รายการ' : (start + 1) + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pageBtn(cur - 1, '‹', cur <= 1, false)}
              {Array.from({ length: pages }, (_, i) => pageBtn(i + 1, String(i + 1), false, cur === i + 1))}
              {pageBtn(cur + 1, '›', cur >= pages, false)}
              <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }}
                      aria-label="จำนวนต่อหน้า"
                      style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                               fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                {[20, 50, 100].map(n => <option key={n} value={n}>{n} / หน้า</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เฉพาะบริษัทประกันที่ “เปิดใช้งาน” เท่านั้นที่จะแสดงเป็นตัวเลือกในเมนู “บันทึกเบี้ยประกัน” และ “จัดการประกันภัยสมาชิก”
      </div>

      {form && <InsCoFormModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={handleSubmit} />}

      {confirm && window.ToggleConfirmModal && (
        <window.ToggleConfirmModal
          next={confirm.next}
          title={(confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งานบริษัทประกันภัย'}
          subtitle={confirm.rec.code + ' · ' + confirm.rec.name}
          detail={confirm.next
            ? 'บริษัทนี้จะกลับมาแสดงเป็นตัวเลือกในเมนู “บันทึกเบี้ยประกัน” และ “จัดการประกันภัยสมาชิก”'
            : 'บริษัทนี้จะไม่แสดงเป็นตัวเลือกในเมนู “บันทึกเบี้ยประกัน” และ “จัดการประกันภัยสมาชิก” — รายการที่บันทึกไว้แล้วยังคงอยู่'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => doToggle(confirm.rec, confirm.next)} />
      )}

      {done && window.StatusModal && (
        <window.StatusModal variant="success" title={done.title} detail={done.detail} onClose={() => setDone(null)} />
      )}
    </div>
  );
}

Object.assign(window, { InsuranceCompanyConfigPage });
