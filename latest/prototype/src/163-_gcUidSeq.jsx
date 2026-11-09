// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่: กำหนดจำนวนคนค้ำประกัน — GuarantorCountConfigPage
//  ซ้าย: ผลิตภัณฑ์ (ประเภทเงินกู้) → ขวา: กลุ่มนับค้ำ + ตารางจำนวนคนค้ำ
//  ระบบงานสินเชื่อ › ค่าคงที่
// ════════════════════════════════════════════════════════════════════

let _gcUidSeq = 0;
const gcUid = () => 'GC-N' + (++_gcUidSeq);

function gcLoadGroups() {
  try { const s = localStorage.getItem('guarantor_count_groups'); if (s) return JSON.parse(s); } catch (e) {}
  return window.GC_GROUP_SEED.map(g => JSON.parse(JSON.stringify(g)));
}
function gcSaveGroups(list) {
  try { localStorage.setItem('guarantor_count_groups', JSON.stringify(list)); } catch (e) {}
}
function gcLoadMap() {
  try { const s = localStorage.getItem('guarantor_count_map'); if (s) return JSON.parse(s); } catch (e) {}
  return { ...window.GC_PRODUCT_MAP_SEED };
}
function gcSaveMap(m) {
  try { localStorage.setItem('guarantor_count_map', JSON.stringify(m)); } catch (e) {}
}
// ดึงผลิตภัณฑ์จากค่าคงที่ประเภทเงินกู้ (แหล่งเดียวกับหน้าประเภทเงินกู้)
function gcLoadProducts() {
  try { const s = localStorage.getItem('loan_types'); if (s) return JSON.parse(s); } catch (e) {}
  return window.LP_SEED.map(r => JSON.parse(JSON.stringify(r)));
}
const gcMaxOf = (r) => (r.useNormal ? Number(r.normalCount || 0) : 0)
  + Number(r.insurance1 || 0) + Number(r.insurance2 || 0) + Number(r.extraFund || 0);

// ─── cell inputs ────────────────────────────────────────────────────
function GcNum({ v, editing, onChange, width }) {
  if (!editing) return <span className="sh-grid-num">{Number(v || 0)}</span>;
  return <input className="sh-grid-input num mono" type="number" min="0" value={v == null ? '' : v}
                style={width ? { width } : null} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />;
}
function GcTxt({ v, editing, onChange }) {
  if (!editing) return <span className="mono">{v || '—'}</span>;
  return <input className="sh-grid-input mono center" value={v || ''} onChange={(e) => onChange(e.target.value)} />;
}

// ════════════════════════════════════════════════════════════════════
//  กลุ่มนับค้ำ — เลือก / เพิ่ม
// ════════════════════════════════════════════════════════════════════
function GcGroupModal({ groups, onClose, onSubmit }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณาระบุรหัสกลุ่มนับค้ำ'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อกลุ่มนับค้ำ'); return; }
    if (groups.some(g => g.code === code.trim())) { setError('รหัสกลุ่มนับค้ำนี้ถูกใช้แล้ว'); return; }
    onSubmit({
      id: gcUid(), code: code.trim(), name: name.trim(), note: note.trim(),
      rows: [{ memberType: 'regular', memberFrom: '0', memberTo: '', useNormal: true, normalCount: 0, insurance1: 0, insurance2: 0, extraFund: 0 }],
    });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มกลุ่มนับค้ำ</h2>
            <div className="muted" style={{ fontSize: 11 }}>กำหนดจำนวนคนค้ำประกันเป็นชุด แล้วผูกกับผลิตภัณฑ์</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">รหัสกลุ่มนับค้ำ <span className="cfg-required">*</span></label>
          <input className="cfg-input mono" value={code} autoFocus placeholder="เช่น 4Y"
                 onChange={(e) => { setCode(e.target.value); setError(''); }} />
          <label className="lt-modal-label" style={{ marginTop: 12 }}>ชื่อกลุ่มนับค้ำ <span className="cfg-required">*</span></label>
          <input className="cfg-input" value={name} placeholder="เช่น GM-จำนวนคนค้ำสามัญผสมประกัน 6 คน"
                 onChange={(e) => { setName(e.target.value); setError(''); }} />
          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" onChange={(e) => setNote(e.target.value)} />
          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> เพิ่มกลุ่ม</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function GuarantorCountConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [products] = useState(gcLoadProducts);
  const [groups, setGroups] = useState(gcLoadGroups);
  const [map, setMap] = useState(gcLoadMap);
  const [pid, setPid] = useState(null);            // null = หน้ารายการ
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);        // สำเนากลุ่มระหว่างแก้ไข
  const [addGroup, setAddGroup] = useState(false);
  const [q, setQ] = useState('');

  const product = products.find(p => p.id === pid) || null;
  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3('กำหนดจำนวนคนค้ำประกัน',
      product ? (editing ? 'edit' : 'view') : 'list',
      () => { setPid(null); setEditing(false); setDraft(null); }),
    [pid, editing]
  );
  const groupId = product ? map[product.id] : null;
  const group = groups.find(g => g.id === groupId) || null;
  const view = editing && draft ? draft : group;

  const filtered = products.filter(p => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return (p.code + ' ' + p.name).toLowerCase().includes(s);
  });

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(group))); setEditing(true); };
  const cancelEdit = () => { setDraft(null); setEditing(false); };
  const saveEdit = () => {
    const next = groups.map(g => g.id === draft.id ? draft : g);
    setGroups(next); gcSaveGroups(next);
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่จำนวนคนค้ำประกัน',
      target: `${draft.code} · ${draft.name}`,
      summary: `แก้ไขจำนวนคนค้ำประกันกลุ่ม “${draft.name}” (${draft.rows.length} เงื่อนไข)`,
      changes: draft.rows.map(r => ({
        field: window.gcMemberTypeLabel(r.memberType),
        before: '—', after: `สูงสุด ${gcMaxOf(r)} คน`,
      })),
    });
    onToast && onToast(`บันทึกจำนวนคนค้ำประกันกลุ่ม “${draft.name}” เรียบร้อยแล้ว`);
    setEditing(false); setDraft(null);
  };

  const setRow = (i, k, v) => setDraft({ ...draft, rows: draft.rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r) });
  const addRow = () => setDraft({ ...draft, rows: [...draft.rows, { memberType: 'regular', memberFrom: '0', memberTo: '', useNormal: true, normalCount: 0, insurance1: 0, insurance2: 0, extraFund: 0 }] });
  const delRow = (i) => setDraft({ ...draft, rows: draft.rows.filter((_, idx) => idx !== i) });

  const assignGroup = (gid) => {
    const next = { ...map, [product.id]: gid };
    setMap(next); gcSaveMap(next);
    const g = groups.find(x => x.id === gid);
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่จำนวนคนค้ำประกัน',
      target: `${product.code} · ${product.name}`,
      summary: `ผูกผลิตภัณฑ์ “${product.name}” กับกลุ่มนับค้ำ ${g ? g.code + ' · ' + g.name : '—'}`,
      changes: [{ field: 'กลุ่มนับค้ำ', before: group ? group.code : '—', after: g ? g.code : '—' }],
    });
    onToast && onToast(`ผูกกลุ่มนับค้ำให้ “${product.name}” แล้ว`);
    cancelEdit();
  };

  // ─── Detail view ──────────────────────────────────────────────────
  if (product) return (
    <div data-screen-label="หน้ารายละเอียดจำนวนคนค้ำประกัน">
      <div className="page-actions">
        <button className="btn sm" onClick={() => { setPid(null); cancelEdit(); }}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {!editing && group && <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขจำนวนคนค้ำ</button>}
        {editing && (
          <>
            <button className="btn sm" data-discard="1" onClick={cancelEdit}>ละทิ้ง</button>
            <button className="btn primary sm" onClick={saveEdit}><Icon name="check" /> บันทึก</button>
          </>
        )}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="guarantee" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{product.code}</span> · {product.name}</h1>
            <div className="lt-head-meta">
              <span className="mono">{product.id}</span>
              <span className="dot" />
              <span>กลุ่ม: {window.lpLabel('loanGroup', product.group)}</span>
            </div>
          </div>
          {product.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>}
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">รหัสกลุ่มนับค้ำ</span>
            <span className="lt-date-v mono">{group ? group.code : '—'}</span>
          </div>
          <div className="lt-date" style={{ flex: 1, minWidth: 260 }}>
            <span className="lt-date-k">ชื่อกลุ่มนับค้ำ</span>
            <select className="cfg-input" value={groupId || ''} onChange={(e) => assignGroup(e.target.value)}>
              <option value="">— ไม่ผูกกลุ่ม (ไม่ตรวจจำนวนคนค้ำ) —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.code} · {g.name}</option>)}
            </select>
          </div>
          <div className="lt-date" style={{ flex: 1 }}>
            <span className="lt-date-k">หมายเหตุ</span>
            <span className="lt-date-v" style={{ fontWeight: 400 }}>{group && group.note ? group.note : <span className="muted">—</span>}</span>
          </div>
        </div>
      </div>

      {!group ? (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="muted" style={{ padding: 20, textAlign: 'center', fontSize: 12.5 }}>
            ผลิตภัณฑ์นี้ยังไม่ผูกกลุ่มนับค้ำ — เลือกกลุ่มด้านบน หรือกลับไปกด “เพิ่มกลุ่มนับค้ำ” ที่หน้ารายการ
          </div>
        </div>
      ) : (
        <div className="search-card gcc-tblcard" style={{ marginTop: 12 }}>
          <div className="section-head">
            <span>จำนวนคนค้ำประกัน</span>
            <span className="muted">{view.rows.length} เงื่อนไข</span>
            <span className="spacer" style={{ flex: 1 }} />
            {editing && <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={addRow}><Icon name="plus" size={13} /> เพิ่มแถว</button>}
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
            <table className="tbl sh-grid gcc-tbl" style={{ minWidth: 940 }}>
              <thead>
                <tr>
                  <th rowSpan="2" className="center" style={{ width: 150 }}>ประเภทสมาชิก</th>
                  <th colSpan="2" className="center group-col">ช่วงสมาชิก</th>
                  <th rowSpan="2" className="center group-col" style={{ width: 110 }}>สิทธิปกติ<br />จำนวนสัญญา</th>
                  <th rowSpan="2" className="center group-col" style={{ width: 120 }}>สิทธิเพิ่มจากประกัน<br /><span className="gcc-th-sub">(ชีวิต/หนี้) 1 ประเภท</span></th>
                  <th rowSpan="2" className="center group-col" style={{ width: 120 }}>สิทธิเพิ่มจากประกัน<br /><span className="gcc-th-sub">(ชีวิต/หนี้) 2 ประเภท</span></th>
                  <th rowSpan="2" className="center group-col" style={{ width: 120 }}>สิทธิเพิ่มจาก<br />สสอร+ชสอ</th>
                  {editing && <th rowSpan="2" className="center" style={{ width: 46 }} />}
                </tr>
                <tr>
                  <th className="center sub-col" style={{ width: 150 }}>&ge;</th><th className="center sub-col" style={{ width: 150 }}>&le;</th>
                </tr>
              </thead>
              <tbody>
                {view.rows.map((r, i) => (
                  <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
                    <td>
                      {editing
                        ? <select className="sh-grid-input" value={r.memberType} onChange={(e) => setRow(i, 'memberType', e.target.value)}>
                            {window.GC_MEMBER_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                        : window.gcMemberTypeLabel(r.memberType)}
                    </td>
                    <td className="center"><GcTxt v={/^0*$/.test(String(r.memberFrom ?? '')) ? '0' : r.memberFrom} editing={editing} onChange={(v) => setRow(i, 'memberFrom', v)} /></td>
                    <td className="center"><window.LpUnlCell editing={editing} text center v={r.memberTo || ''} inf="999999" onChange={(v) => setRow(i, 'memberTo', v)} /></td>
                    <td className="center">
                      <div className="gcc-normal">
                        <input type="checkbox" style={{ accentColor: 'var(--brand, #237450)' }} checked={!!r.useNormal} disabled={!editing}
                               onChange={(e) => setRow(i, 'useNormal', e.target.checked)} />
                        <GcNum v={r.normalCount} editing={editing && r.useNormal} onChange={(v) => setRow(i, 'normalCount', v)} width={54} />
                      </div>
                    </td>
                    <td className="center"><GcNum v={r.insurance1} editing={editing} onChange={(v) => setRow(i, 'insurance1', v)} width={54} /></td>
                    <td className="center"><GcNum v={r.insurance2} editing={editing} onChange={(v) => setRow(i, 'insurance2', v)} width={54} /></td>
                    <td className="center"><GcNum v={r.extraFund} editing={editing} onChange={(v) => setRow(i, 'extraFund', v)} width={54} /></td>
                    {editing && (
                      <td className="center">
                        <button className="btn danger sm act-del" onClick={() => delRow(i)} aria-label="ลบแถว"><Icon name="trash" size={12} /></button>
                      </td>
                    )}
                  </tr>
                ))}
                {!view.rows.length && (
                  <tr><td colSpan={editing ? 8 : 7} className="center muted" style={{ padding: 24 }}>ยังไม่มีเงื่อนไข — กด “เพิ่มแถว”</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="lt-list-foot muted" style={{ padding: '10px 14px 0' }}>
            <Icon name="info" size={12} /> กลุ่มนับค้ำนี้ใช้ร่วมกับผลิตภัณฑ์อื่นที่ผูกกลุ่มเดียวกัน
          </div>
        </div>
      )}
    </div>
  );

  // ─── List view ────────────────────────────────────────────────────
  const linkedCount = products.filter(p => map[p.id]).length;
  return (
    <div data-screen-label="หน้าค่าคงที่จำนวนคนค้ำประกัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดจำนวนคนค้ำประกัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            รายการกลุ่มนับค้ำ — กดที่กลุ่มเพื่อเข้าไปกำหนดจำนวนคนค้ำสูงสุดตามประเภทสมาชิก ช่วงทะเบียน และสิทธิเพิ่มจากประกัน
          </div>
        </div>
        <span className="spacer" />
        <input className="cfg-input" style={{ maxWidth: 220 }} value={q} placeholder="ค้นหารหัส / ชื่อผลิตภัณฑ์" onChange={(e) => setQ(e.target.value)} />
        <button className="btn sm" onClick={() => setAddGroup(true)}><Icon name="plus" /> เพิ่มกลุ่มนับค้ำ</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="guarantee" /></div>
        <div>
          <div className="lt-ab-label">กลุ่มนับค้ำที่ใช้งาน</div>
          <div className="lt-ab-name">{groups.length} กลุ่ม
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · ผูกแล้ว {linkedCount} จาก {products.length} ผลิตภัณฑ์</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 70 }}>รหัส</th>
                <th style={{ minWidth: 220 }}>ชื่อเงินกู้</th>
                <th style={{ width: 100 }}>กลุ่มนับค้ำ</th>
                <th style={{ minWidth: 200 }}>ชื่อกลุ่มนับค้ำ</th>
                <th className="center" style={{ width: 90 }}>เงื่อนไข</th>
                <th className="center" style={{ width: 110 }}>ค้ำสูงสุด</th>
                <th className="center" style={{ width: 90 }}>สถานะ</th>
                <th className="center" style={{ width: 74 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const g = groups.find(x => x.id === map[p.id]);
                const maxCnt = g && g.rows.length ? Math.max(...g.rows.map(gcMaxOf)) : null;
                return (
                  <tr key={p.id} className="clickable" onClick={() => setPid(p.id)}>
                    <td className="mono">{p.code}</td>
                    <td><div className="lt-row-name">{p.name} <span className="muted" style={{ fontWeight: 400 }}>({p.abbr})</span></div></td>
                    <td className="mono">{g ? g.code : '—'}</td>
                    <td>{g ? g.name : <span className="muted">ยังไม่ผูกกลุ่มนับค้ำ</span>}</td>
                    <td className="center mono">{g ? g.rows.length : '—'}</td>
                    <td className="center">{maxCnt == null ? '—' : <><b className="mono">{maxCnt}</b> <span className="muted" style={{ fontSize: 11 }}>คน</span></>}</td>
                    <td className="center">{p.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}</td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn sm" onClick={() => setPid(p.id)}><Icon name="eye" size={13} /> ดู</button>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && <tr><td colSpan="8" className="center muted" style={{ padding: 24 }}>ไม่พบผลิตภัณฑ์ที่ค้นหา</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> กลุ่มนับค้ำหนึ่งกลุ่มใช้ร่วมกันได้หลายผลิตภัณฑ์ — แก้ไขตารางจำนวนคนค้ำจะมีผลกับทุกผลิตภัณฑ์ที่ผูกกลุ่มเดียวกัน
      </div>

      {addGroup && (
        <GcGroupModal groups={groups} onClose={() => setAddGroup(false)} onSubmit={(g) => {
          const next = [g, ...groups]; setGroups(next); gcSaveGroups(next);
          onToast && onToast(`เพิ่มกลุ่มนับค้ำ “${g.name}” เรียบร้อยแล้ว`);
          setAddGroup(false);
        }} />
      )}
    </div>
  );
}

Object.assign(window, { GuarantorCountConfigPage });
