// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน › ค่าคงที่ — หมวดค่าใช้จ่าย (Expense Categories)
//  กำหนดหมวดค่าใช้จ่ายที่ใช้ในคำขอยืมเงินทดรอง (และงานการเงินอื่น)
//  เพิ่ม / แก้ไข (ป๊อบอัพ) · เปิด–ปิดการใช้งาน · ค้นหา/กรองตามกลุ่ม
// ════════════════════════════════════════════════════════════════════

let _pacUidSeq = 0;
const pacUid = () => 'C-N' + (Date.now().toString(36)) + (++_pacUidSeq);

// ── Add / Edit modal ────────────────────────────────────────────────
function PaCatFormModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [f, setF] = React.useState(editRec ? { ...editRec } : {
    code: '', name: '', group: window.paCatGroups()[0], unit: 'รายการ',
  });
  const [error, setError] = React.useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setError('กรุณาระบุชื่อหมวดค่าใช้จ่าย');
    const dupName = list.some(r => r.name.trim() === f.name.trim() && (!isEdit || r.id !== editRec.id));
    if (dupName) return setError('ชื่อหมวดค่าใช้จ่ายนี้มีอยู่แล้ว');
    const code = f.code.trim().toUpperCase();
    if (code) {
      const dupCode = list.some(r => (r.code || '').toUpperCase() === code && (!isEdit || r.id !== editRec.id));
      if (dupCode) return setError('รหัสหมวดค่าใช้จ่ายนี้ถูกใช้แล้ว');
    }
    onSubmit({
      id: isEdit ? editRec.id : pacUid(),
      code, name: f.name.trim(), group: f.group, unit: f.unit,
      enabled: isEdit ? editRec.enabled : true,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขหมวดค่าใช้จ่าย' : 'เพิ่มหมวดค่าใช้จ่าย'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isEdit ? `${editRec.code || '—'} · ${editRec.name}` : 'กำหนดหมวดค่าใช้จ่ายสำหรับเลือกในรายการประมาณการค่าใช้จ่าย'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัสหมวด</label>
              <input className="cfg-input mono" value={f.code} autoFocus={!isEdit} disabled={isEdit} placeholder="เช่น EXP-TRV" onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อหมวดค่าใช้จ่าย <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={f.name} placeholder="เช่น ค่าเดินทาง (พาหนะ/น้ำมัน)" onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">กลุ่มค่าใช้จ่าย</label>
              <select className="cfg-input" value={f.group} onChange={(e) => set('group', e.target.value)}>
                {(() => { const gs = window.paCatGroups(); return (f.group && !gs.includes(f.group) ? [f.group, ...gs] : gs).map(g => <option key={g} value={g}>{g}</option>); })()}
              </select>
            </div>
            <div>
              <label className="lt-modal-label">หน่วยนับเริ่มต้น</label>
              <select className="cfg-input" value={f.unit} onChange={(e) => set('unit', e.target.value)}>
                {window.PA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดค่าใช้จ่าย'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────────
function ExpenseCategoryConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = React.useState(window.paCatLoad);
  const [form, setForm] = React.useState(null);
  const [groupFilter, setGroupFilter] = React.useState('');
  const [q, setQ] = React.useState('');

  const persist = (next) => { setList(next); window.paCatSave(next); };
  const activeCount = list.filter(r => r.enabled).length;

  const handleSubmit = (rec) => {
    const exists = list.some(r => r.id === rec.id);
    if (exists) {
      persist(list.map(r => r.id === rec.id ? rec : r));
      audit.log && audit.log({ action: 'update', module: 'การเงิน — ค่าคงที่หมวดค่าใช้จ่าย',
        target: `${rec.code || '—'} · ${rec.name}`, summary: `แก้ไขหมวดค่าใช้จ่าย “${rec.name}”` });
      onToast && onToast(`บันทึกหมวดค่าใช้จ่าย “${rec.name}” เรียบร้อยแล้ว`);
    } else {
      persist([rec, ...list]);
      audit.log && audit.log({ action: 'create', module: 'การเงิน — ค่าคงที่หมวดค่าใช้จ่าย',
        target: `${rec.code || '—'} · ${rec.name}`, summary: `เพิ่มหมวดค่าใช้จ่าย “${rec.name}” (${rec.group})`,
        changes: [{ field: 'ชื่อหมวด', before: '—', after: rec.name }] });
      onToast && onToast(`เพิ่มหมวดค่าใช้จ่าย “${rec.name}” เรียบร้อยแล้ว`);
    }
    setForm(null);
  };

  const [askDel, setAskDel] = React.useState(null);
  const [askOff, setAskOff] = React.useState(null);
  const remove = (rec) => setAskDel(rec);
  const doRemove = (rec) => {
    setAskDel(null);
    persist(list.filter(r => r.id !== rec.id));
    audit.log && audit.log({ action: 'delete', module: 'การเงิน — ค่าคงที่หมวดค่าใช้จ่าย',
      target: (rec.code || '—') + ' · ' + rec.name, summary: 'ลบหมวดค่าใช้จ่าย “' + rec.name + '”' });
    onToast && onToast('ลบหมวดค่าใช้จ่าย “' + rec.name + '” แล้ว');
  };

  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    audit.log && audit.log({ action: 'update', module: 'การเงิน — ค่าคงที่หมวดค่าใช้จ่าย', target: `${rec.code || '—'} · ${rec.name}`,
      summary: (rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งานหมวดค่าใช้จ่าย “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: rec.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน', after: rec.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }] });
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งาน “${rec.name}” แล้ว`);
  };

  const [query, setQuery] = React.useState('');

  const shown = list.filter(r => {
    if (groupFilter && r.group !== groupFilter) return false;
    if (query.trim()) {
      const n = query.toLowerCase();
      return [r.code, r.name, r.group].some(v => String(v ?? '').toLowerCase().includes(n));
    }
    return true;
  });

  return (
    <div data-screen-label="หน้าค่าคงที่หมวดค่าใช้จ่าย">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>หมวดค่าใช้จ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดหมวดค่าใช้จ่ายที่เลือกได้ในรายการประมาณการค่าใช้จ่าย (คำขอยืมเงินทดรอง) — เพิ่ม, แก้ไข และเปิด/ปิดการใช้งาน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}>
          <Icon name="plus" /> เพิ่มหมวดค่าใช้จ่าย
        </button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="receipt" /></div>
        <div>
          <div className="lt-ab-label">หมวดค่าใช้จ่ายทั้งหมด</div>
          <div className="lt-ab-name">{list.length} หมวด
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div className="search" style={{ flex: '1 1 280px', minWidth: 0, height: 32, boxSizing: 'border-box' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} style={{ height: 30, width: '100%', minWidth: 0 }}
                   onKeyDown={(e) => { if (e.key === 'Enter') setQuery(q); }}
                   placeholder="ค้นหารหัส, ชื่อหมวดค่าใช้จ่าย, กลุ่ม" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={() => setQuery(q)}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={() => { setQ(''); setQuery(''); setGroupFilter(''); }}>รีเซ็ต</button>
        </div>

      <div className="pc-tabs" style={{ marginBottom: 16 }}>
        <button className={"pc-tab" + (groupFilter === '' ? ' active' : '')} onClick={() => setGroupFilter('')}>
          ทั้งหมด <span className="pc-tab-count">{list.length}</span>
        </button>
        {window.paCatGroups().map(g => (
          <button key={g} className={"pc-tab" + (groupFilter === g ? ' active' : '')} onClick={() => setGroupFilter(g)}>
            {g} <span className="pc-tab-count">{list.filter(r => r.group === g).length}</span>
          </button>
        ))}
      </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ width: 110 }}>รหัส</th>
                <th style={{ minWidth: 260 }}>ชื่อหมวดค่าใช้จ่าย</th>
                <th style={{ width: 170 }}>กลุ่ม</th>
                <th className="center" style={{ width: 130 }}>หน่วยนับเริ่มต้น</th>
                <th className="center" style={{ width: 110 }}>ใช้งาน</th>
                <th className="center" style={{ width: 190 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id} className={r.enabled ? '' : 'dat-off'}>
                  <td className="mono">{r.code || <span className="muted">—</span>}</td>
                  <td><div className="lt-row-name">{r.name}</div></td>
                  <td><span className={'ec-group g' + Math.max(0, window.paCatGroups().indexOf(r.group))}>{r.group}</span></td>
                  <td className="center muted">{r.unit || '—'}</td>
                  <td className="center">
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => { if (r.enabled) setAskOff(r); else toggle(r); }}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center">
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button className="btn sm ex-row-btn" onClick={() => setForm({ editRec: r })}>
                        <Icon name="edit" size={13} /> แก้ไข
                      </button>
                      <button className="btn sm ex-row-btn del" disabled={!r.enabled} title="ลบหมวดค่าใช้จ่าย" onClick={() => remove(r)}>
                        <Icon name="trash" size={13} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan="6" className="empty-state" style={{ padding: 28 }}>— ไม่พบหมวดค่าใช้จ่ายตามเงื่อนไข —</td></tr>
              )}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เฉพาะหมวดค่าใช้จ่ายที่ “เปิดใช้งาน” เท่านั้นที่จะแสดงเป็นตัวเลือกในรายการประมาณการค่าใช้จ่าย
      </div>

      {askDel && window.DepStatusDialog && (
        <window.DepStatusDialog tone="danger" title="ยืนยันการลบหมวดค่าใช้จ่าย"
          desc={<>ต้องการลบหมวดค่าใช้จ่าย <b className="mono">{askDel.code || '—'}</b> · {askDel.name} ใช่หรือไม่?</>}
          okLabel="ลบ" onOk={() => doRemove(askDel)} onClose={() => setAskDel(null)} />
      )}
      {askOff && window.DepStatusDialog && (
        <window.DepStatusDialog tone="danger" title="ปิดใช้งานรายการนี้?"
          desc={<>ต้องการปิดใช้งานหมวดค่าใช้จ่าย <b className="mono">{askOff.code || '—'}</b> · {askOff.name} ใช่หรือไม่? หมวดนี้จะไม่แสดงเป็นตัวเลือกในรายการประมาณการค่าใช้จ่าย</>}
          okLabel="ยืนยันปิดใช้งาน" onOk={() => { toggle(askOff); setAskOff(null); }} onClose={() => setAskOff(null)} />
      )}
      {form && <PaCatFormModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={handleSubmit} />}
    </div>
  );
}

Object.assign(window, { ExpenseCategoryConfigPage, PaCatFormModal });
