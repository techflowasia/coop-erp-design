// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ข้อมูลพื้นฐาน — ตั้งค่าค่าธรรมเนียมและค่าปรับ
//  ตารางกฎค่าธรรมเนียม/ค่าปรับ ตามประเภทบัญชี × ประเภทรายการ + Audit
// ════════════════════════════════════════════════════════════════════

let _feeUidSeq = 0;
const feeUid = () => 'FEE-N' + (++_feeUidSeq);
const FEE_USER = 'จันทร์เพ็ญ มาลี';

function feeLoad() {
  try { const s = localStorage.getItem('dep_fees'); if (s) return JSON.parse(s); } catch (e) {}
  return window.DEP_FEE_SEED.map(r => ({ ...r }));
}
function feeSaveLS(list) { try { localStorage.setItem('dep_fees', JSON.stringify(list)); } catch (e) {} }

function feeAcctOptions() {
  const types = (window.DEP_ACCTYPE_SEED || []).map(t => t.name);
  return ['ทุกประเภท', ...types];
}

// ─── Add/Edit modal ──────────────────────────────────────────────────
function FeeEditModal({ rec, lockAcctType, onClose, onSubmit }) {
  const isNew = !rec.id;
  const [f, setF] = useState(lockAcctType ? { ...rec, acctType: lockAcctType } : rec);
  const [error, setError] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const FT = window.DEP_FEE_TYPES;
  const submit = (e) => {
    e.preventDefault();
    if (!f.txnType) return setError('กรุณาเลือกประเภทรายการ');
    if (!f.glCode.trim()) return setError('กรุณาระบุรหัสบัญชี GL');
    onSubmit({ ...f, fee: Number(f.fee) || 0, freeCount: Number(f.freeCount) || 0 });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isNew ? 'plus' : 'edit'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isNew ? 'เพิ่มกฎค่าธรรมเนียม / ค่าปรับ' : 'แก้ไขกฎค่าธรรมเนียม / ค่าปรับ'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>กำหนดค่าธรรมเนียมตามประเภทบัญชีและประเภทรายการ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div className="fee-form-grid">
            <div>
              <label className="lt-modal-label">ประเภทบัญชี</label>
              {lockAcctType ? (
                <input className="cfg-input" value={lockAcctType} disabled readOnly
                       title="กำหนดจากประเภทบัญชีที่เปิดอยู่" />
              ) : (
                <select className="cfg-input" value={f.acctType} onChange={(e) => set('acctType', e.target.value)}>
                  {feeAcctOptions().map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="lt-modal-label">ประเภทรายการ <span className="cfg-required">*</span></label>
              <select className="cfg-input" value={f.txnType} onChange={(e) => { set('txnType', e.target.value); setError(''); }}>
                <option value="">— เลือก —</option>
                {window.DEP_FEE_TXN_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="lt-modal-label">จำนวนครั้งทำรายการฟรี/เดือน</label>
              <input className="cfg-input mono" type="number" value={f.freeCount} onChange={(e) => set('freeCount', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">วิธีคิดค่าธรรมเนียม</label>
              <select className="cfg-input" value={f.feeType} onChange={(e) => set('feeType', e.target.value)}>
                {Object.entries(FT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="lt-modal-label">อัตรา/จำนวนค่าธรรมเนียม</label>
              <input className="cfg-input mono" type="number" step="0.01" value={f.fee} disabled={f.feeType === 'rate_diff'}
                     onChange={(e) => set('fee', e.target.value)} placeholder={f.feeType === 'rate_diff' ? 'คำนวณอัตโนมัติ' : ''} />
            </div>
            <div>
              <label className="lt-modal-label">รหัสบัญชี GL ค่าธรรมเนียม <span className="cfg-required">*</span></label>
              {(() => { const gl = (window.coaFlatAccounts ? window.coaFlatAccounts() : []).filter(a => a.kind === 'posting' && a.enabled !== false); const hit = gl.some(a => a.code === f.glCode);
                return <select className="cfg-input" value={f.glCode || ''} onChange={(e) => { set('glCode', e.target.value); setError(''); }}>
                  <option value="">— เลือกรหัสบัญชี —</option>
                  {f.glCode && !hit && <option value={f.glCode}>{f.glCode} (ไม่พบในผังบัญชี)</option>}
                  {gl.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                </select>; })()}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="lt-modal-label">เงื่อนไขยกเว้นค่าธรรมเนียม</label>
              <input className="cfg-input" value={f.exemptCond} onChange={(e) => set('exemptCond', e.target.value)} placeholder="เช่น ยกเว้นกรณีถอนหลายรายการในคราวเดียว" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="lt-modal-label">วิธีแสดงในสมุดคู่ฝาก</label>
              <input className="cfg-input" value={f.showAs} onChange={(e) => set('showAs', e.target.value)} placeholder="เช่น แสดงเป็น Transaction แยก “ค่าธรรมเนียมถอน”" />
            </div>
          </div>
          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> {isNew ? 'เพิ่มกฎ' : 'บันทึก'}</button>
          </div>
        </form>
      </div>
    </>
  );
}

function DepFeeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(feeLoad);
  const [editRec, setEditRec] = useState(null);
  const persist = (next) => { setList(next); feeSaveLS(next); };
  const FT = window.DEP_FEE_TYPES;
  const activeCount = list.filter(r => r.enabled).length;

  const blank = () => ({ acctType: 'ทุกประเภท', txnType: '', freeCount: 0, fee: 0, feeType: 'flat', exemptCond: '', showAs: 'แสดงเป็น Transaction แยกในสมุดคู่ฝาก', glCode: '', enabled: true });
  const submit = (f) => {
    if (f.id) {
      persist(list.map(r => r.id === f.id ? f : r));
      audit.log({ action: 'update', module: 'เงินฝาก — ค่าธรรมเนียม/ค่าปรับ', target: `${f.acctType} · ${f.txnType}`, summary: `แก้ไขกฎค่าธรรมเนียม “${f.txnType}”` });
      onToast && onToast('บันทึกกฎค่าธรรมเนียมเรียบร้อยแล้ว');
    } else {
      const rec = { ...f, id: feeUid() };
      persist([rec, ...list]);
      audit.log({ action: 'create', module: 'เงินฝาก — ค่าธรรมเนียม/ค่าปรับ', target: `${rec.acctType} · ${rec.txnType}`, summary: `เพิ่มกฎค่าธรรมเนียม “${rec.txnType}”` });
      onToast && onToast('เพิ่มกฎค่าธรรมเนียมเรียบร้อยแล้ว');
    }
    setEditRec(null);
  };
  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + 'ใช้งานกฎค่าธรรมเนียมแล้ว');
  };

  const feeText = (r) => {
    if (r.feeType === 'rate_diff') return 'ส่วนต่างดบ.';
    if (r.feeType === 'percent') return fmt.money(r.fee, 2) + '%';
    return fmt.money(r.fee, 2) + ' ฿';
  };

  return (
    <div data-screen-label="หน้าตั้งค่าค่าธรรมเนียมและค่าปรับ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตั้งค่าค่าธรรมเนียมและค่าปรับ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กำหนดค่าธรรมเนียม/ค่าปรับตามประเภทบัญชีและประเภทรายการ — แสดงเป็น Transaction แยกในสมุดคู่ฝาก</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setEditRec(blank())}><Icon name="plus" /> เพิ่มกฎค่าธรรมเนียม</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="receipt" /></div>
        <div>
          <div className="lt-ab-label">กฎค่าธรรมเนียม/ค่าปรับ</div>
          <div className="lt-ab-name">{list.length} กฎ<span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span></div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 170 }}>ประเภทบัญชี</th>
                <th style={{ minWidth: 160 }}>ประเภทรายการ</th>
                <th className="center" style={{ width: 90 }}>ถอนฟรี/ด.</th>
                <th className="right" style={{ width: 110 }}>ค่าธรรมเนียม</th>
                <th style={{ minWidth: 230 }}>วิธีแสดงในสมุดคู่ฝาก</th>
                <th className="center" style={{ width: 110 }}>GL</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 64 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className="clickable" onClick={() => setEditRec(r)}>
                  <td>{r.acctType === 'ทุกประเภท' ? <span className="chip"><span className="dot-c" />ทุกประเภท</span> : r.acctType}</td>
                  <td><b>{r.txnType}</b><div className="muted" style={{ fontSize: 11 }}>{FT[r.feeType]?.label}</div></td>
                  <td className="center mono">{r.freeCount > 0 ? r.freeCount : '—'}</td>
                  <td className="right mono"><b>{feeText(r)}</b></td>
                  <td><div style={{ fontSize: 12.5 }}>{r.showAs}</div>{r.exemptCond && <div className="muted" style={{ fontSize: 11 }}>ยกเว้น: {r.exemptCond}</div>}</td>
                  <td className="center mono">{r.glCode}</td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled} onClick={() => toggle(r)}><span className="lt-switch-knob" /></button>
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}><button className="btn ghost sm" onClick={() => setEditRec(r)}><Icon name="edit" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ระบบคำนวณค่าธรรมเนียมอัตโนมัติ แสดงค่าปรับ/ค่าธรรมเนียมเป็น Transaction แยกในสมุดคู่ฝาก และเก็บ Audit Log ผู้อนุมัติการยกเว้นทุกครั้ง
      </div>

      {editRec && <FeeEditModal rec={editRec} onClose={() => setEditRec(null)} onSubmit={submit} />}
    </div>
  );
}

Object.assign(window, { DepFeeConfigPage, FeeEditModal, feeLoad, feeSaveLS });
