// ═════════════════════════════════════════════════════════════════
//  บทบาท — RolePermissionPage
//  ระบบงานผู้ดูแลระบบ › การทำงาน
//  รายการบทบาท (เพิ่ม/แก้ไข/เปิด-ปิดใช้งาน) + กำหนดสิทธิ์รายบทบาท
// ═════════════════════════════════════════════════════════════════

function rpLoad() {
  try {
    const saved = localStorage.getItem('admin_roles');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.ADM_ROLES.map(r => ({ ...r, perms: { ...r.perms } }));
}
function rpSaveLS(list) {
  try { localStorage.setItem('admin_roles', JSON.stringify(list)); } catch (e) {}
}
function rpAssignLoad() {
  try { const s = localStorage.getItem('admin_role_perms'); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
}
function rpAssignSave(map) {
  try { localStorage.setItem('admin_role_perms', JSON.stringify(map)); } catch (e) {}
}
const RP_PERM_TYPE_CHIP = { Menu: 'info', Edit: 'warning', Approve: 'success' };

// ─── โมดัล เพิ่ม/แก้ไขบทบาท ───────────────────────────────────────────
function RoleModal({ role, onClose, onSave }) {
  const isNew = !role;
  const [name, setName] = useState(role ? role.name : '');
  const [desc, setDesc] = useState(role ? role.desc : '');
  const [active, setActive] = useState(role ? role.active !== false : true);
  const [err, setErr] = useState('');
  const locked = role && role.locked;

  const submit = () => {
    if (!name.trim()) return setErr('กรุณาระบุชื่อบทบาท');
    onSave({ name: name.trim(), desc: desc.trim(), active: locked ? true : active }, isNew);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head">
          <h2>{isNew ? 'สร้างบทบาท' : 'แก้ไขบทบาท'}</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          <div className="cfg-field">
            <label className="cfg-label">ชื่อบทบาท<span className="cfg-required">*</span></label>
            <div className="cfg-input-wrap" style={{ position: 'relative' }}>
              <input className="cfg-input" maxLength={100} value={name}
                     onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="กรอกชื่อบทบาท" />
              <span className="muted" style={{ position: 'absolute', right: 10, top: 9, fontSize: 11 }}>{name.length} / 100</span>
            </div>
          </div>
          <div className="cfg-field" style={{ marginTop: 12 }}>
            <label className="cfg-label">คำอธิบายบทบาท</label>
            <div className="cfg-input-wrap" style={{ position: 'relative' }}>
              <textarea className="cfg-input" rows={4} maxLength={255} value={desc}
                        onChange={(e) => setDesc(e.target.value)} placeholder="กรอกคำอธิบายบทบาท (optional)" />
              <span className="muted" style={{ position: 'absolute', right: 10, bottom: 6, fontSize: 11 }}>{desc.length} / 255</span>
            </div>
          </div>
          <div className="cfg-field" style={{ marginTop: 14 }}>
            <label className="cfg-label">สถานะ</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: locked ? 'not-allowed' : 'pointer' }}>
              <span className={"tgl" + (active ? ' on' : '') + (locked ? ' dis' : '')}
                    onClick={() => !locked && setActive(a => !a)} />
              <span style={{ fontSize: 13 }}>ใช้งาน</span>
            </label>
            {locked && <div className="cfg-hint">บทบาทนี้เป็นบทบาทระบบ — ไม่สามารถปิดใช้งานได้</div>}
          </div>
        </div>
        <div className="col-gap" style={{ padding: '14px 20px', borderTop: '1px solid var(--divider)' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <span style={{ flex: 1 }} />
          <button className="btn primary" onClick={submit}>บันทึก</button>
        </div>
      </div>
    </>
  );
}

// ─── หน้ากำหนดสิทธิ์ของบทบาทหนึ่ง ────────────────────────────────────
function AssignPermissionView({ role, onBack, onEdit, onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [assignMap, setAssignMap] = useState(rpAssignLoad);
  const [q, setQ] = useState('');
  const [sysF, setSysF] = useState('all');
  const [modF, setModF] = useState('all');
  const [menuF, setMenuF] = useState('all');
  const [typeF, setTypeF] = useState('all');

  window.useBreadcrumb && window.useBreadcrumb(
    [{ label: 'บทบาท', onClick: onBack }, { label: 'กำหนดสิทธิ์ · ' + role.name, current: true }], [role.id]);

  const assigned = React.useMemo(() => {
    const stored = assignMap[role.id];
    if (stored) return new Set(stored);
    return new Set(window.admAssignedPerms(role).map(p => p.code));
  }, [assignMap, role]);

  const systems = React.useMemo(() => [...new Set(window.ADM_PERM_CATALOG.map(p => p.sys))], []);
  const modules = React.useMemo(() => [...new Set(window.ADM_PERM_CATALOG.filter(p => sysF === 'all' || p.sys === sysF).map(p => p.module))], [sysF]);
  const menus = React.useMemo(() => [...new Set(window.ADM_PERM_CATALOG.filter(p => (sysF === 'all' || p.sys === sysF) && (modF === 'all' || p.module === modF)).map(p => p.menu))], [sysF, modF]);

  const rows = React.useMemo(() => {
    let r = window.ADM_PERM_CATALOG.filter(p => assigned.has(p.code));
    if (sysF !== 'all') r = r.filter(p => p.sys === sysF);
    if (modF !== 'all') r = r.filter(p => p.module === modF);
    if (menuF !== 'all') r = r.filter(p => p.menu === menuF);
    if (typeF !== 'all') r = r.filter(p => p.type === typeF);
    if (q.trim()) { const n = q.trim().toLowerCase(); r = r.filter(p => p.code.toLowerCase().includes(n) || p.name.toLowerCase().includes(n)); }
    return r;
  }, [assigned, sysF, modF, menuF, typeF, q]);

  const reset = () => { setQ(''); setSysF('all'); setModF('all'); setMenuF('all'); setTypeF('all'); };

  const toggle = (p) => {
    const next = new Set(assigned);
    const willAssign = !next.has(p.code);
    if (willAssign) next.add(p.code); else next.delete(p.code);
    const nextMap = { ...assignMap, [role.id]: [...next] };
    setAssignMap(nextMap); rpAssignSave(nextMap);
    audit.log({ action: 'update', module: 'ผู้ดูแลระบบ — บทบาท', target: role.name,
      summary: `${willAssign ? 'มอบ' : 'ยกเลิก'}สิทธิ์ “${p.name}” (${p.code}) ให้บทบาท “${role.name}”`,
      changes: [{ field: p.code, before: willAssign ? 'ไม่มีสิทธิ์' : 'มีสิทธิ์', after: willAssign ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์' }] });
  };

  let lastGroup = '', lastMenu = '';
  return (
    <div data-screen-label="หน้ากำหนดสิทธิ์บทบาท">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" size={13} /> กลับสู่รายการ</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ยังไม่มีประวัติการเปลี่ยนแปลงเพิ่มเติม — ดูรายละเอียดที่เมนู “ประวัติการใช้งาน”')}>
          <Icon name="history" size={13} /> ประวัติ
        </button>
        <button className="btn primary sm" onClick={() => onEdit(role)}><Icon name="edit" size={13} /> แก้ไข</button>
      </div>

      <div className="search-card lt-head-card" style={{ marginBottom: 12 }}>
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="muted" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.03em' }}>กำลัง Assign Permission ให้กับบทบาท</div>
            <h1 className="lt-head-title">{role.name}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 12 }}><Icon name="check" size={12} /> Permission ที่ Assign แล้ว</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{assigned.size}</div>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 16px', marginBottom: 12 }}>
          <div className="cfg-field">
            <label className="cfg-label">ค้นหา</label>
            <input className="cfg-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ชื่อสิทธิ์ หรือ รหัสสิทธิ์…" />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">ระบบ</label>
            <select className="cfg-input" value={sysF} onChange={(e) => { setSysF(e.target.value); setModF('all'); setMenuF('all'); }}>
              <option value="all">— ทั้งหมด —</option>
              {systems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">โมดูล</label>
            <select className="cfg-input" value={modF} onChange={(e) => { setModF(e.target.value); setMenuF('all'); }}>
              <option value="all">— ทั้งหมด —</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">เมนู</label>
            <select className="cfg-input" value={menuF} onChange={(e) => setMenuF(e.target.value)}>
              <option value="all">— ทั้งหมด —</option>
              {menus.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="cfg-field" style={{ width: 220 }}>
            <label className="cfg-label">ประเภทสิทธิ์</label>
            <select className="cfg-input" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
              <option value="all">— ทั้งหมด —</option>
              <option value="Menu">Menu</option>
              <option value="Edit">Edit</option>
              <option value="Approve">Approve</option>
            </select>
          </div>
          <span className="spacer" />
          <button className="btn primary" onClick={() => {}}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn" onClick={reset}>รีเซ็ต</button>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr><th>รหัสสิทธิ์</th><th>ชื่อสิทธิ์</th><th style={{ width: 130 }}>ประเภทสิทธิ์</th><th style={{ width: 180 }}>Assign โดย</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="4" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบสิทธิ์ที่ Assign ให้บทบาทนี้ตามเงื่อนไข</td></tr>
              ) : rows.map(p => {
                const groupKey = p.sys + ' — ' + p.module;
                const showGroup = groupKey !== lastGroup;
                if (showGroup) { lastGroup = groupKey; lastMenu = ''; }
                const showMenu = p.menu !== lastMenu;
                if (showMenu) lastMenu = p.menu;
                return (
                  <React.Fragment key={p.code}>
                    {showGroup && <tr className="rp-group-row"><td colSpan="4">{groupKey}</td></tr>}
                    {showMenu && <tr className="rp-menu-row"><td colSpan="4">{p.menu}</td></tr>}
                    <tr className="clickable" onClick={() => toggle(p)} title="คลิกเพื่อ Assign / ยกเลิก Assign">
                      <td className="mono">{p.code}</td>
                      <td>{p.name}</td>
                      <td><span className={"chip " + RP_PERM_TYPE_CHIP[p.type]}>{p.type}</span></td>
                      <td className="muted" style={{ fontSize: 12 }}>{window.RP_USER || 'มนตรี ศรีสุข'}<div className="mono" style={{ fontSize: 10 }}>{window.fmt.datetime(role.updatedAt)} น.</div></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — รายการบทบาท
// ════════════════════════════════════════════════════════════════════
function RolePermissionPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [roles, setRoles] = useState(rpLoad);
  const [view, setView] = useState('list');
  const [assignId, setAssignId] = useState(null);
  const [modal, setModal] = useState(null);   // null | {} (new) | role (edit)
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');

  const persist = (next) => { setRoles(next); rpSaveLS(next); };

  const rows = React.useMemo(() => {
    let r = roles;
    if (q.trim()) { const n = q.trim().toLowerCase(); r = r.filter(x => x.name.toLowerCase().includes(n)); }
    if (statusF !== 'all') r = r.filter(x => (x.active !== false ? 'active' : 'inactive') === statusF);
    return r;
  }, [roles, q, statusF]);

  const saveRole = (f, isNew) => {
    if (isNew) {
      const rec = { id: 'R-' + Date.now().toString().slice(-6), name: f.name, desc: f.desc, active: f.active,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), system: false, tier: '1',
        perms: window.ADM_SYSTEMS.reduce((o, s) => (o[s.key] = 'none', o), {}) };
      persist([...roles, rec]);
      audit.log({ action: 'create', module: 'ผู้ดูแลระบบ — บทบาท', target: rec.name, summary: `สร้างบทบาทใหม่ “${rec.name}”`, changes: [] });
      onToast && onToast(`สร้างบทบาท “${rec.name}” เรียบร้อยแล้ว`);
    } else {
      const next = roles.map(r => r.id === modal.id ? { ...r, name: f.name, desc: f.desc, active: f.active, updatedAt: new Date().toISOString() } : r);
      persist(next);
      audit.log({ action: 'update', module: 'ผู้ดูแลระบบ — บทบาท', target: f.name, summary: `แก้ไขบทบาท “${f.name}”`, changes: [] });
      onToast && onToast(`บันทึกบทบาท “${f.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleActive = (r) => {
    if (r.locked) return;
    const next = roles.map(x => x.id === r.id ? { ...x, active: x.active === false, updatedAt: new Date().toISOString() } : x);
    persist(next);
    onToast && onToast(r.active === false ? `เปิดใช้งานบทบาท “${r.name}” แล้ว` : `ปิดใช้งานบทบาท “${r.name}” แล้ว`);
  };

  if (view === 'assign' && assignId) {
    const role = roles.find(r => r.id === assignId);
    if (role) return (
      <>
        <AssignPermissionView role={role} onBack={() => setView('list')} onEdit={(r) => setModal(r)} onToast={onToast} />
        {modal && <RoleModal role={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveRole} />}
      </>
    );
  }

  return (
    <div data-screen-label="หน้าบทบาท">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายการบทบาท</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>จัดการบทบาทและกำหนดสิทธิ์การใช้งานระบบของเจ้าหน้าที่</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({})}><Icon name="plus" /> เพิ่มบทบาท</button>
      </div>

      <div className="search-card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, flexShrink: 0 }}>ค้นหา</label>
          <input className="cfg-input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ชื่อบทบาท…" />
          <label style={{ fontSize: 13, fontWeight: 500, flexShrink: 0 }}>สถานะ</label>
          <select className="cfg-input" style={{ width: 220, flexShrink: 0 }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">บทบาททั้งหมด ({roles.length})</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
          <button className="btn primary" style={{ flexShrink: 0 }} onClick={() => {}}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn" style={{ flexShrink: 0 }} onClick={() => { setQ(''); setStatusF('all'); }}>รีเซ็ต</button>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr>
              <th>ชื่อบทบาท</th><th>วันที่สร้าง</th><th>อัพเดตล่าสุด</th>
              <th className="center">สถานะ</th><th className="center" style={{ width: 90 }}>ใช้งาน</th>
              <th className="center" style={{ width: 220 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="6" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบบทบาทที่ตรงกับเงื่อนไข</td></tr>
              ) : rows.map(r => {
                const active = r.active !== false;
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{r.desc}</div>
                    </td>
                    <td className="mono muted" style={{ fontSize: 11.5 }}>{window.fmt.datetime(r.createdAt)} น.</td>
                    <td className="mono muted" style={{ fontSize: 11.5 }}>{window.fmt.datetime(r.updatedAt)} น.</td>
                    <td className="center"><span className={"pill " + (active ? 'ok' : 'neutral')}>{active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span></td>
                    <td className="center">
                      <span className={"tgl" + (active ? ' on' : '') + (r.locked ? ' dis' : '')} title={r.locked ? 'บทบาทระบบ — ไม่สามารถปิดใช้งานได้' : 'เปลี่ยนสถานะ'} onClick={() => toggleActive(r)} />
                    </td>
                    <td className="center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn sm" onClick={() => { setAssignId(r.id); setView('assign'); }}><Icon name="shield" size={13} /> กำหนดสิทธิ์</button>
                        <button className="btn sm" onClick={() => setModal(r)}><Icon name="edit" size={13} /> แก้ไข</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      {modal && <RoleModal role={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveRole} />}
    </div>
  );
}

Object.assign(window, { RolePermissionPage });
