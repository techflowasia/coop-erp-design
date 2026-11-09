// ═════════════════════════════════════════════════════════════════
//  ระบบทะเบียนและติดตามหนี้ › ค่าคงที่ — สังกัดปันผลเฉลี่ยคืน
//  ตารางค่าคงที่ "สังกัดปันผล" : รหัส · รายละเอียด · รหัสคุม · ประเภทจ่าย
//  · เพิ่ม/แก้ไข/ดู ผ่าน drawer ขวา · ลบ (กันลบรหัสที่ถูกใช้งานแล้ว)
//  · ตัวกรอง + การ์ดสรุป + ตาราง + แบ่งหน้า · เปิด/ปิดใช้งานเป็นชุด
// ═════════════════════════════════════════════════════════════════

// แปลง "2567-05-12 10:15" → "12/05/2567 10:15"
function daFmtAt(s) {
  if (!s) return '—';
  const [d, t] = String(s).split(' ');
  const p = d.split('-');
  if (p.length !== 3) return s;
  return `${p[2]}/${p[1]}/${p[0]}${t ? ' ' + t : ''}`;
}
const DA_USER = 'ธารา ว.';
const daNow = () => {
  const n = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear() + 543}-${pad(n.getMonth() + 1)}-${pad(n.getDate())} ${pad(n.getHours())}:${pad(n.getMinutes())}`;
};

// ─── ป้ายประเภทการจ่าย ───────────────────────────────────────────────
function DaPayChip({ v }) {
  const t = window.divAffilPayType(v);
  return <span className={'chip ' + t.chip}>{v} : {t.l}</span>;
}

// ════════════════════════════════════════════════════════════════════
//  Drawer — เพิ่ม / แก้ไข / ดูรายละเอียด สังกัดปันผล
// ════════════════════════════════════════════════════════════════════
function DaDrawer({ mode, record, existing, onClose, onSubmit }) {
  const view = mode === 'view';
  const isEdit = mode === 'edit';
  const [code, setCode]     = useState(record ? record.code : '');
  const [detail, setDetail] = useState(record ? record.detail : '');
  const [ctrl, setCtrl]     = useState(record ? record.ctrl : '');
  const [pay, setPay]       = useState(record ? record.pay : '');
  const [on, setOn]         = useState(record ? !!record.on : true);
  const [note, setNote]     = useState(record ? (record.note || '') : '');
  const [error, setError]   = useState('');

  const validate = () => {
    const c = code.trim();
    if (!c) return 'กรุณาระบุรหัสสังกัดปันผล';
    if (c.length < 5) return 'รหัสสังกัดปันผลต้องมี 5 หลัก';
    const dup = (existing || []).some(x => x.code === c && (!isEdit || x.id !== record.id));
    if (dup) return `รหัสสังกัด “${c}” มีอยู่แล้วในระบบ — ห้ามซ้ำ`;
    if (!detail.trim()) return 'กรุณาระบุรายละเอียดสังกัดปันผล';
    if (!ctrl.trim()) return 'กรุณาระบุรหัสคุมสังกัดปันผล';
    if (!window.DIV_AFFIL_CTRL.some(o => o.v === ctrl.trim()))
      return 'รหัสคุมสังกัดต้องเป็นรหัสที่ระบบกำหนดไว้ (00 / 13 / 16 / 20)';
    if (!pay) return 'กรุณาเลือกประเภทการจ่าย';
    return '';
  };

  const handle = (again) => {
    const err = validate();
    if (err) { setError(err); return; }
    onSubmit({
      vals: { code: code.trim(), detail: detail.trim(), ctrl: ctrl.trim(), pay, on, note: note.trim() },
      again,
    });
    if (again) {
      setCode(''); setDetail(''); setCtrl(''); setPay(''); setOn(true); setNote(''); setError('');
    }
  };

  const Counter = ({ val, max }) => (
    <div className="da-counter">{val.length}/{max}</div>
  );

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer da-drawer">
        <div className="drawer-head">
          <div className="da-drawer-ico">
            <Icon name={view ? 'eye' : isEdit ? 'edit' : 'plus'} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2>{view ? 'รายละเอียดสังกัดปันผล' : isEdit ? 'แก้ไขสังกัดปันผล' : 'เพิ่มสังกัดปันผล'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {view ? 'ดูข้อมูลค่าคงที่สังกัดปันผลเฉลี่ยคืน' : 'ค่าคงที่กลุ่ม/หน่วยงานสำหรับการจ่ายปันผลเฉลี่ยคืน'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="drawer-body da-form">
          {/* รหัสสังกัดปันผล */}
          <div className="da-field">
            <label className="da-label">รหัสสังกัดปันผล <span className="cfg-required">*</span></label>
            <input className="cfg-input mono" value={code} maxLength={5} readOnly={view || isEdit}
                   placeholder="ระบุรหัสสังกัดปันผล เช่น 00012"
                   onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} />
            {!view && !isEdit && <Counter val={code} max={5} />}
            {isEdit && <div className="da-hint"><Icon name="info" size={11} /> รหัสสังกัดเป็นรหัสอ้างอิงหลัก แก้ไขไม่ได้หลังสร้าง</div>}
          </div>

          {/* รายละเอียดสังกัดปันผล */}
          <div className="da-field">
            <label className="da-label">รายละเอียดสังกัดปันผล <span className="cfg-required">*</span></label>
            <textarea className="cfg-input" rows={2} value={detail} maxLength={255} readOnly={view}
                      placeholder="ระบุรายละเอียดสังกัดปันผล เช่น ส่วนตรวจสอบภูมิภาค"
                      onChange={(e) => { setDetail(e.target.value); setError(''); }} />
            {!view && <Counter val={detail} max={255} />}
          </div>

          {/* รหัสคุมสังกัดปันผล */}
          <div className="da-field">
            <label className="da-label">รหัสคุมสังกัดปันผล <span className="cfg-required">*</span></label>
            <input className="cfg-input mono" value={ctrl} maxLength={2} readOnly={view}
                   placeholder="ระบุรหัสคุมสังกัด เช่น 13"
                   onChange={(e) => { setCtrl(e.target.value.replace(/\D/g, '')); setError(''); }} />
            {!view && (
              <div className="da-ctrl-hints">
                {window.DIV_AFFIL_CTRL.map(o => (
                  <button key={o.v} type="button"
                          className={'da-ctrl-chip' + (ctrl === o.v ? ' on' : '')}
                          onClick={() => { setCtrl(o.v); setError(''); }}>
                    <b className="mono">{o.v}</b> {o.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ประเภทการจ่าย */}
          <div className="da-field">
            <label className="da-label">ประเภทการจ่าย <span className="cfg-required">*</span></label>
            {view ? (
              <div style={{ paddingTop: 2 }}>{pay ? <DaPayChip v={pay} /> : <span className="muted">—</span>}</div>
            ) : (
              <select className="filter-select" style={{ width: '100%' }} value={pay}
                      onChange={(e) => { setPay(e.target.value); setError(''); }}>
                <option value="">เลือกประเภทการจ่าย</option>
                {window.DIV_AFFIL_PAYTYPES.map(o => <option key={o.v} value={o.v}>{o.v} : {o.l}</option>)}
              </select>
            )}
          </div>

          {/* สถานะ */}
          <div className="da-field">
            <label className="da-label">สถานะ <span className="cfg-required">*</span></label>
            {view ? (
              <div style={{ paddingTop: 2 }}>
                {on ? <span className="pill ok">ใช้งาน</span> : <span className="pill neutral">ไม่ใช้งาน</span>}
              </div>
            ) : (
              <div className="da-status-pick">
                <button type="button" className={'da-status-opt' + (on ? ' active' : '')} onClick={() => setOn(true)}>
                  <span className="da-dot ok" /> ใช้งาน
                </button>
                <button type="button" className={'da-status-opt' + (!on ? ' active off' : '')} onClick={() => setOn(false)}>
                  <span className="da-dot off" /> ไม่ใช้งาน
                </button>
              </div>
            )}
          </div>

          {/* หมายเหตุ */}
          <div className="da-field">
            <label className="da-label">หมายเหตุ</label>
            <textarea className="cfg-input" rows={2} value={note} maxLength={500} readOnly={view}
                      placeholder="ระบุหมายเหตุ (ถ้ามี)"
                      onChange={(e) => setNote(e.target.value)} />
            {!view && <Counter val={note} max={500} />}
          </div>

          {view && record && (
            <div className="da-meta-strip">
              <div><span className="da-meta-k">แก้ไขล่าสุด</span><span className="da-meta-v mono">{daFmtAt(record.at)}</span></div>
              <div><span className="da-meta-k">ผู้แก้ไข</span><span className="da-meta-v">{record.by}</span></div>
              <div><span className="da-meta-k">การใช้งาน</span>
                <span className="da-meta-v">{record.inUse
                  ? <span className="chip warning">ถูกใช้งานแล้ว</span>
                  : <span className="chip">ยังไม่ถูกใช้งาน</span>}</span>
              </div>
            </div>
          )}

          {error && <div className="dep-error" style={{ marginTop: 4 }}><Icon name="info" size={13} /> {error}</div>}
        </div>

        {!view && (
          <div className="da-drawer-foot">
            <button className="btn primary block" onClick={() => handle(false)}>
              <Icon name="download" size={14} /> บันทึก
            </button>
            {!isEdit && (
              <button className="btn block" onClick={() => handle(true)}>
                <Icon name="plus" size={14} /> บันทึกและเพิ่มต่อ
              </button>
            )}
            <button className="btn text block" onClick={onClose}>ยกเลิก</button>
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — ยืนยันการลบ (กันลบรหัสที่ถูกใช้งานแล้ว)
// ════════════════════════════════════════════════════════════════════
function DaDeleteModal({ record, onClose, onConfirm, onDisable }) {
  const blocked = record.inUse;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: blocked ? 'var(--warning-50, #fff7e6)' : '#fff1f0', color: blocked ? 'var(--warning)' : 'var(--danger)' }}>
            <Icon name={blocked ? 'shield' : 'trash'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{blocked ? 'ไม่สามารถลบได้' : 'ยืนยันการลบสังกัดปันผล'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              <span className="mono">{record.code}</span> · {record.detail}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {blocked ? (
            <div className="da-del-note warn">
              <Icon name="info" size={14} />
              <span>รหัสสังกัดนี้ <b>ถูกผูกกับสมาชิกหรือข้อมูลปันผลแล้ว</b> จึงไม่สามารถลบออกจากระบบได้
                เพื่อรักษาความถูกต้องของข้อมูล แนะนำให้เปลี่ยนสถานะเป็น <b>“ไม่ใช้งาน”</b> แทน</span>
            </div>
          ) : (
            <div className="da-del-note">
              <Icon name="info" size={14} />
              <span>ต้องการลบสังกัดปันผล <b>{record.detail}</b> ออกจากระบบใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn block" style={{ justifyContent: 'center' }} onClick={onClose}>ปิด</button>
            {blocked ? (
              record.on && (
                <button className="btn primary block" style={{ justifyContent: 'center' }} onClick={onDisable}>
                  <Icon name="lock" size={13} /> เปลี่ยนเป็นไม่ใช้งาน
                </button>
              )
            ) : (
              <button className="btn danger block" style={{ justifyContent: 'center' }} onClick={onConfirm}>
                <Icon name="trash" size={13} /> ยืนยันการลบ
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function DividendAffiliationConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.divAffilLoad);
  const [crit, setCrit] = useState({ code: '', detail: '', ctrl: '', pay: 'all', status: 'all' });
  const [applied, setApplied] = useState({ code: '', detail: '', ctrl: '', pay: 'all', status: 'all' });
  const [drawer, setDrawer] = useState(null);   // {mode, record}
  const [delTarget, setDelTarget] = useState(null);
  const [sel, setSel] = useState({});           // {id: true}
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const persist = (next) => { setList(next); window.divAffilSaveLS(next); };

  // สรุปยอด
  const total = list.length;
  const cshCnt = list.filter(r => r.pay === 'CSH').length;
  const tnaCnt = list.filter(r => r.pay === 'TNA').length;

  // กรอง + เรียงตามรหัส
  const filtered = useMemo(
    () => window.divAffilFilter(list, applied).sort((a, b) => a.code.localeCompare(b.code)),
    [list, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  const runSearch = () => { setApplied(crit); setPage(1); };
  const clearSearch = () => {
    const blank = { code: '', detail: '', ctrl: '', pay: 'all', status: 'all' };
    setCrit(blank); setApplied(blank); setPage(1);
  };
  const setC = (k, v) => setCrit(p => ({ ...p, [k]: v }));

  // ── CRUD ──
  const submit = ({ vals, again }) => {
    const m = drawer.mode;
    if (m === 'edit') {
      const rec = drawer.record;
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals, at: daNow(), by: DA_USER } : x));
      audit.log && audit.log({
        action: 'update', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่สังกัดปันผลเฉลี่ยคืน',
        target: `${vals.code} · ${vals.detail}`, summary: `แก้ไขสังกัดปันผล “${vals.detail}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขสังกัด “${vals.detail}” เรียบร้อยแล้ว`);
      setDrawer(null);
    } else {
      const rec = { id: window.divAffilUid(), ...vals, inUse: false, at: daNow(), by: DA_USER };
      persist([...list, rec]);
      audit.log && audit.log({
        action: 'create', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่สังกัดปันผลเฉลี่ยคืน',
        target: `${vals.code} · ${vals.detail}`, summary: `เพิ่มสังกัดปันผล “${vals.detail}”`,
        changes: [
          { field: 'รหัสสังกัด', before: '—', after: vals.code },
          { field: 'รหัสคุมสังกัด', before: '—', after: vals.ctrl },
          { field: 'ประเภทการจ่าย', before: '—', after: window.divAffilPayType(vals.pay).l },
        ],
      });
      onToast && onToast(`เพิ่มสังกัดปันผล “${vals.detail}” (${vals.code}) เรียบร้อยแล้ว`);
      if (!again) setDrawer(null);
    }
  };

  const doDelete = () => {
    const r = delTarget;
    persist(list.filter(x => x.id !== r.id));
    setSel(s => { const n = { ...s }; delete n[r.id]; return n; });
    audit.log && audit.log({
      action: 'delete', module: 'ทะเบียนและติดตามหนี้ — ค่าคงที่สังกัดปันผลเฉลี่ยคืน',
      target: `${r.code} · ${r.detail}`, summary: `ลบสังกัดปันผล “${r.detail}”`,
    });
    onToast && onToast(`ลบสังกัดปันผล “${r.detail}” เรียบร้อยแล้ว`);
    setDelTarget(null);
  };
  const disableFromDelete = () => {
    const r = delTarget;
    persist(list.map(x => x.id === r.id ? { ...x, on: false, at: daNow(), by: DA_USER } : x));
    onToast && onToast(`เปลี่ยนสถานะสังกัด “${r.detail}” เป็นไม่ใช้งานแล้ว`);
    setDelTarget(null);
  };
  const toggleEnabled = (r) => {
    persist(list.map(x => x.id === r.id ? { ...x, on: !x.on, at: daNow(), by: DA_USER } : x));
    onToast && onToast(`${r.on ? 'ปิด' : 'เปิด'}ใช้งานสังกัด “${r.detail}” แล้ว`);
  };

  // ── เลือกหลายรายการ ──
  const selIds = Object.keys(sel).filter(k => sel[k]);
  const allOnPage = pageRows.length > 0 && pageRows.every(r => sel[r.id]);
  const toggleAll = () => {
    setSel(s => {
      const n = { ...s };
      if (allOnPage) pageRows.forEach(r => { delete n[r.id]; });
      else pageRows.forEach(r => { n[r.id] = true; });
      return n;
    });
  };
  const bulkSetEnabled = (val) => {
    persist(list.map(x => selIds.includes(x.id) ? { ...x, on: val, at: daNow(), by: DA_USER } : x));
    onToast && onToast(`${val ? 'เปิด' : 'ปิด'}ใช้งาน ${selIds.length} รายการแล้ว`);
    setSel({});
  };

  const hasFilter = applied.code || applied.detail || applied.ctrl || applied.pay !== 'all' || applied.status !== 'all';
  const startN = filtered.length === 0 ? 0 : (curPage - 1) * pageSize + 1;
  const endN = Math.min(curPage * pageSize, filtered.length);

  // เลขหน้าแบบกระชับ
  const pageNums = useMemo(() => {
    const out = [];
    const span = 2;
    for (let p = 1; p <= pageCount; p++) {
      if (p === 1 || p === pageCount || (p >= curPage - span && p <= curPage + span)) out.push(p);
      else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }, [pageCount, curPage]);

  return (
    <div data-screen-label="หน้าค่าคงที่สังกัดปันผลเฉลี่ยคืน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            สังกัดปันผลเฉลี่ยคืน
            <span className="da-help" title="ค่าคงที่กลุ่ม/หน่วยงานของสมาชิกที่ใช้ในการคำนวณและจ่ายปันผลเฉลี่ยคืน"><Icon name="info" size={14} /></span>
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ใช้สำหรับกำหนดสังกัดและประเภทการจ่ายปันผลเฉลี่ยคืน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('นำเข้าข้อมูลสังกัดปันผล (สาธิต)')}><Icon name="upload" size={13} /> นำเข้า</button>
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกข้อมูลสังกัดปันผล (สาธิต)')}><Icon name="download" size={13} /> ส่งออก</button>
        <button className="btn sm" onClick={() => onToast && onToast('เปิดประวัติการแก้ไข (ดูได้ที่เมนูตรวจสอบการใช้งานระบบ)')}><Icon name="history" size={13} /> ประวัติการแก้ไข</button>
        <button className="btn primary sm" onClick={() => setDrawer({ mode: 'add', record: null })}>
          <Icon name="plus" size={13} /> เพิ่มสังกัด
        </button>
      </div>

      {/* ── ตัวกรอง ── */}
      <div className="search-card da-filter">
        <div className="da-filter-grid">
          <div className="da-ff">
            <label>รหัสสังกัดปันผล</label>
            <input className="cfg-input mono" value={crit.code} placeholder="ระบุรหัสสังกัดปันผล"
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   onChange={(e) => setC('code', e.target.value.replace(/\D/g, ''))} maxLength={5} />
          </div>
          <div className="da-ff">
            <label>รายละเอียดสังกัดปันผล</label>
            <input className="cfg-input" value={crit.detail} placeholder="ระบุรายละเอียดสังกัดปันผล"
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   onChange={(e) => setC('detail', e.target.value)} />
          </div>
          <div className="da-ff">
            <label>รหัสคุมสังกัดปันผล</label>
            <input className="cfg-input mono" value={crit.ctrl} placeholder="ระบุรหัสคุมสังกัดปันผล"
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   onChange={(e) => setC('ctrl', e.target.value.replace(/\D/g, ''))} maxLength={2} />
          </div>
          <div className="da-ff">
            <label>ประเภทการจ่าย</label>
            <select className="filter-select" value={crit.pay} onChange={(e) => setC('pay', e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {window.DIV_AFFIL_PAYTYPES.map(o => <option key={o.v} value={o.v}>{o.v} : {o.l}</option>)}
            </select>
          </div>
          <div className="da-ff">
            <label>สถานะ</label>
            <select className="filter-select" value={crit.status} onChange={(e) => setC('status', e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="on">ใช้งาน</option>
              <option value="off">ไม่ใช้งาน</option>
            </select>
          </div>
          <div className="da-ff-actions">
            <button className="btn primary" onClick={runSearch}><Icon name="search" size={13} /> ค้นหา</button>
            <button className="btn" onClick={clearSearch}><Icon name="refresh" size={13} /> ล้างค่า</button>
          </div>
        </div>
      </div>

      {/* ── การ์ดสรุป ── */}
      <div className="da-stats">
        <div className="da-stat">
          <span className="da-stat-ico t-total"><Icon name="database" size={20} /></span>
          <div className="da-stat-body">
            <span className="da-stat-l">จำนวนสังกัดทั้งหมด</span>
            <div className="da-stat-v"><b>{fmt.int(total)}</b><span className="da-stat-u">รายการ</span></div>
          </div>
        </div>
        <div className="da-stat">
          <span className="da-stat-ico t-csh"><Icon name="money" size={20} /></span>
          <div className="da-stat-body">
            <span className="da-stat-l">เงินสด (CSH)</span>
            <div className="da-stat-v"><b>{fmt.int(cshCnt)}</b><span className="da-stat-u">รายการ</span></div>
          </div>
        </div>
        <div className="da-stat">
          <span className="da-stat-ico t-tna"><Icon name="mail" size={20} /></span>
          <div className="da-stat-body">
            <span className="da-stat-l">ธนาณัติ (TNA)</span>
            <div className="da-stat-v"><b>{fmt.int(tnaCnt)}</b><span className="da-stat-u">รายการ</span></div>
          </div>
        </div>
      </div>

      {/* ── ตาราง ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        {selIds.length > 0 && (
          <div className="da-bulkbar">
            <span><b>{selIds.length}</b> รายการที่เลือก</span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn sm" onClick={() => bulkSetEnabled(true)}><Icon name="check" size={12} /> เปิดใช้งาน</button>
            <button className="btn sm" onClick={() => bulkSetEnabled(false)}><Icon name="lock" size={12} /> ปิดใช้งาน</button>
            <button className="btn text sm" onClick={() => setSel({})}>ยกเลิกการเลือก</button>
          </div>
        )}
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl da-tbl" style={{ minWidth: 1040 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>
                  <input type="checkbox" className="ct-check" checked={allOnPage} onChange={toggleAll}
                         aria-label="เลือกทั้งหน้า" />
                </th>
                <th className="center" style={{ width: 56 }}>ลำดับ</th>
                <th style={{ width: 130 }}>รหัสสังกัดปันผล</th>
                <th style={{ minWidth: 300 }}>รายละเอียดสังกัดปันผล</th>
                <th className="center" style={{ width: 96 }}>รหัสคุมสังกัด</th>
                <th style={{ width: 150 }}>ประเภทการจ่าย</th>
                <th className="center" style={{ width: 92 }}>สถานะ</th>
                <th className="center" style={{ width: 150 }}>แก้ไขล่าสุด</th>
                <th style={{ width: 110 }}>ผู้แก้ไข</th>
                <th className="center" style={{ width: 108 }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={10} className="empty-state" style={{ padding: '36px 12px' }}>
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  {hasFilter ? 'ไม่พบสังกัดปันผลที่ตรงกับเงื่อนไข' : 'ยังไม่มีข้อมูลสังกัดปันผล — กดปุ่ม “เพิ่มสังกัด” เพื่อเริ่มต้น'}
                </td></tr>
              ) : pageRows.map((r, i) => (
                <tr key={r.id} className={(sel[r.id] ? 'selected ' : '') + (r.on ? '' : 'da-off')}>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="ct-check" checked={!!sel[r.id]}
                           onChange={() => setSel(s => ({ ...s, [r.id]: !s[r.id] }))}
                           aria-label={'เลือก ' + r.code} />
                  </td>
                  <td className="center mono muted">{(curPage - 1) * pageSize + i + 1}</td>
                  <td><span className="da-code mono">{r.code}</span></td>
                  <td>
                    <div className="da-detail">{r.detail}</div>
                    {r.note && <div className="da-row-note muted">{r.note}</div>}
                  </td>
                  <td className="center mono">{r.ctrl}</td>
                  <td><DaPayChip v={r.pay} /></td>
                  <td className="center">
                    <button className="da-status-toggle" onClick={() => toggleEnabled(r)}
                            title={r.on ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}>
                      {r.on ? <span className="pill ok">ใช้งาน</span> : <span className="pill neutral">ไม่ใช้งาน</span>}
                    </button>
                  </td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{daFmtAt(r.at)}</td>
                  <td style={{ fontSize: 12 }}>{r.by}</td>
                  <td className="center">
                    <div className="da-acts">
                      <button className="da-act" title="ดูรายละเอียด" onClick={() => setDrawer({ mode: 'view', record: r })}><Icon name="eye" size={14} /></button>
                      <button className="da-act" title="แก้ไข" onClick={() => setDrawer({ mode: 'edit', record: r })}><Icon name="edit" size={13} /></button>
                      <button className="da-act danger" title="ลบ" onClick={() => setDelTarget(r)}><Icon name="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── แบ่งหน้า ── */}
        <div className="da-pager">
          <span className="muted" style={{ fontSize: 12 }}>
            แสดง {startN}–{endN} จาก {fmt.int(filtered.length)} รายการ
          </span>
          <span className="da-pager-pp">
            <span className="muted" style={{ fontSize: 12 }}>แสดงต่อหน้า</span>
            <select className="filter-select sm" value={pageSize} style={{ width: 72 }}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <div className="da-pages">
            <button className="da-pg" disabled={curPage === 1} onClick={() => setPage(1)} aria-label="หน้าแรก">«</button>
            <button className="da-pg" disabled={curPage === 1} onClick={() => setPage(curPage - 1)} aria-label="ก่อนหน้า">‹</button>
            {pageNums.map((p, i) => p === '…'
              ? <span key={'e' + i} className="da-pg-dots">…</span>
              : <button key={p} className={'da-pg' + (p === curPage ? ' on' : '')} onClick={() => setPage(p)}>{p}</button>)}
            <button className="da-pg" disabled={curPage === pageCount} onClick={() => setPage(curPage + 1)} aria-label="ถัดไป">›</button>
            <button className="da-pg" disabled={curPage === pageCount} onClick={() => setPage(pageCount)} aria-label="หน้าสุดท้าย">»</button>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ค่าคงที่นี้ใช้ร่วมกับระบบคำนวณปันผล/เฉลี่ยคืน · การจ่ายเงินปันผล · และรายงานปันผลเฉลี่ยคืน — รหัสสังกัดที่ถูกใช้งานแล้วจะลบไม่ได้ ให้เปลี่ยนเป็นไม่ใช้งานแทน
      </div>

      {drawer && (
        <DaDrawer mode={drawer.mode} record={drawer.record} existing={list}
                  onClose={() => setDrawer(null)} onSubmit={submit} />
      )}
      {delTarget && (
        <DaDeleteModal record={delTarget} onClose={() => setDelTarget(null)}
                       onConfirm={doDelete} onDisable={disableFromDelete} />
      )}
    </div>
  );
}

Object.assign(window, { DividendAffiliationConfigPage });
