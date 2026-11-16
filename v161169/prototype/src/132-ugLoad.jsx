// ═════════════════════════════════════════════════════════════════
//  กลุ่มผู้ใช้ — UserGroupPage
//  ระบบงานผู้ดูแลระบบ › การทำงาน
//  รายการกลุ่มผู้ใช้ (เพิ่ม/แก้ไข/เปิด-ปิดใช้งาน) + กำหนดสิทธิ์รายกลุ่มผู้ใช้
// ═════════════════════════════════════════════════════════════════

function ugLoad() {
  try {
    const saved = localStorage.getItem('admin_user_groups');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ADM_USER_GROUPS_SEED || []).map(g => ({ ...g, perms: { ...g.perms } }));
}
function ugSaveLS(list) {
  try { localStorage.setItem('admin_user_groups', JSON.stringify(list)); } catch (e) {}
}
function ugAssignLoad() {
  try { const s = localStorage.getItem('admin_usergroup_perms'); return s ? JSON.parse(s) : {}; } catch (e) { return {}; }
}
function ugAssignSave(map) {
  try { localStorage.setItem('admin_usergroup_perms', JSON.stringify(map)); } catch (e) {}
}
const UG_PERM_TYPE_CHIP = { Menu: 'info', Edit: 'warning', Approve: 'success' };

// ─── โมดัล เพิ่ม/แก้ไขกลุ่มผู้ใช้ ──────────────────────────────────────
function UserGroupModal({ group, onClose, onSave }) {
  const isNew = !group;
  const [name, setName] = useState(group ? group.name : '');
  const [desc, setDesc] = useState(group ? group.desc : '');
  const [active, setActive] = useState(group ? group.active !== false : true);
  const [err, setErr] = useState('');
  const locked = group && group.locked;

  const submit = () => {
    if (!name.trim()) return setErr('กรุณาระบุชื่อกลุ่มผู้ใช้');
    onSave({ name: name.trim(), desc: desc.trim(), active: locked ? true : active }, isNew);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head">
          <h2>{isNew ? 'สร้างกลุ่มผู้ใช้' : 'แก้ไขกลุ่มผู้ใช้'}</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          <div className="cfg-field">
            <label className="cfg-label">ชื่อกลุ่มผู้ใช้<span className="cfg-required">*</span></label>
            <div className="cfg-input-wrap" style={{ position: 'relative' }}>
              <input className="cfg-input" maxLength={100} value={name}
                     onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="กรอกชื่อกลุ่มผู้ใช้" />
              <span className="muted" style={{ position: 'absolute', right: 10, top: 9, fontSize: 11 }}>{name.length} / 100</span>
            </div>
          </div>
          <div className="cfg-field" style={{ marginTop: 12 }}>
            <label className="cfg-label">คำอธิบายกลุ่มผู้ใช้</label>
            <div className="cfg-input-wrap" style={{ position: 'relative' }}>
              <textarea className="cfg-input" rows={4} maxLength={255} value={desc}
                        onChange={(e) => setDesc(e.target.value)} placeholder="กรอกคำอธิบายกลุ่มผู้ใช้ (optional)" />
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
            {locked && <div className="cfg-hint">กลุ่มผู้ใช้นี้เป็นกลุ่มระบบ — ไม่สามารถปิดใช้งานได้</div>}
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

// ─── หน้ากำหนดสิทธิ์ของกลุ่มผู้ใช้หนึ่ง ────────────────────────────────
function UgAssignPermissionView({ group, onBack, onEdit, onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [assignMap, setAssignMap] = useState(ugAssignLoad);
  const [q, setQ] = useState('');
  const [sysF, setSysF] = useState('all');
  const [modF, setModF] = useState('all');
  const [menuF, setMenuF] = useState('all');
  const [typeF, setTypeF] = useState('all');

  window.useBreadcrumb && window.useBreadcrumb(
    [{ label: 'กลุ่มผู้ใช้', onClick: onBack }, { label: 'กำหนดสิทธิ์รายกลุ่มผู้ใช้ · ' + group.name, current: true }], [group.id]);

  const assigned = React.useMemo(() => {
    const stored = assignMap[group.id];
    if (stored) return new Set(stored);
    return new Set(window.admAssignedPerms(group).map(p => p.code));
  }, [assignMap, group]);

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
    const nextMap = { ...assignMap, [group.id]: [...next] };
    setAssignMap(nextMap); ugAssignSave(nextMap);
    audit.log({ action: 'update', module: 'ผู้ดูแลระบบ — กลุ่มผู้ใช้', target: group.name,
      summary: `${willAssign ? 'มอบ' : 'ยกเลิก'}สิทธิ์ “${p.name}” (${p.code}) ให้กลุ่มผู้ใช้ “${group.name}”`,
      changes: [{ field: p.code, before: willAssign ? 'ไม่มีสิทธิ์' : 'มีสิทธิ์', after: willAssign ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์' }] });
  };

  let lastGroup = '', lastMenu = '';
  return (
    <div data-screen-label="หน้ากำหนดสิทธิ์รายกลุ่มผู้ใช้">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" size={13} /> กลับสู่รายการ</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ยังไม่มีประวัติการเปลี่ยนแปลงเพิ่มเติม — ดูรายละเอียดที่เมนู “ประวัติการใช้งาน”')}>
          <Icon name="history" size={13} /> ประวัติ
        </button>
        <button className="btn primary sm" onClick={() => onEdit(group)}><Icon name="edit" size={13} /> แก้ไข</button>
      </div>

      <div className="search-card lt-head-card" style={{ marginBottom: 12 }}>
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="member" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="muted" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '.03em' }}>กำลัง Assign Permission ให้กับกลุ่มผู้ใช้</div>
            <h1 className="lt-head-title">{group.name}</h1>
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
                <tr><td colSpan="4" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบสิทธิ์ที่ Assign ให้กลุ่มผู้ใช้นี้ตามเงื่อนไข</td></tr>
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
                      <td><span className={"chip " + UG_PERM_TYPE_CHIP[p.type]}>{p.type}</span></td>
                      <td className="muted" style={{ fontSize: 12 }}>{window.RP_USER || 'มนตรี ศรีสุข'}<div className="mono" style={{ fontSize: 10 }}>{window.fmt.datetime(group.updatedAt)} น.</div></td>
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
//  Main page — รายการกลุ่มผู้ใช้
// ════════════════════════════════════════════════════════════════════
function UserGroupPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [groups, setGroups] = useState(ugLoad);
  const [view, setView] = useState('list');
  const [assignId, setAssignId] = useState(null);
  const [modal, setModal] = useState(null);   // null | {} (new) | group (edit)
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');

  const persist = (next) => { setGroups(next); ugSaveLS(next); };

  const rows = React.useMemo(() => {
    let r = groups;
    if (q.trim()) { const n = q.trim().toLowerCase(); r = r.filter(x => x.name.toLowerCase().includes(n)); }
    if (statusF !== 'all') r = r.filter(x => (x.active !== false ? 'active' : 'inactive') === statusF);
    return r;
  }, [groups, q, statusF]);

  const saveGroup = (f, isNew) => {
    if (isNew) {
      const rec = { id: 'UG-' + Date.now().toString().slice(-6), name: f.name, desc: f.desc, active: f.active,
        memberCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), locked: false,
        perms: window.ADM_SYSTEMS.reduce((o, s) => (o[s.key] = 'none', o), {}) };
      persist([...groups, rec]);
      audit.log({ action: 'create', module: 'ผู้ดูแลระบบ — กลุ่มผู้ใช้', target: rec.name, summary: `สร้างกลุ่มผู้ใช้ใหม่ “${rec.name}”`, changes: [] });
      onToast && onToast(`สร้างกลุ่มผู้ใช้ “${rec.name}” เรียบร้อยแล้ว`);
    } else {
      const next = groups.map(g => g.id === modal.id ? { ...g, name: f.name, desc: f.desc, active: f.active, updatedAt: new Date().toISOString() } : g);
      persist(next);
      audit.log({ action: 'update', module: 'ผู้ดูแลระบบ — กลุ่มผู้ใช้', target: f.name, summary: `แก้ไขกลุ่มผู้ใช้ “${f.name}”`, changes: [] });
      onToast && onToast(`บันทึกกลุ่มผู้ใช้ “${f.name}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleActive = (g) => {
    if (g.locked) return;
    const next = groups.map(x => x.id === g.id ? { ...x, active: x.active === false, updatedAt: new Date().toISOString() } : x);
    persist(next);
    onToast && onToast(g.active === false ? `เปิดใช้งานกลุ่มผู้ใช้ “${g.name}” แล้ว` : `ปิดใช้งานกลุ่มผู้ใช้ “${g.name}” แล้ว`);
  };

  if (view === 'assign' && assignId) {
    const group = groups.find(g => g.id === assignId);
    if (group) return (
      <>
        <UgAssignPermissionView group={group} onBack={() => setView('list')} onEdit={(g) => setModal(g)} onToast={onToast} />
        {modal && <UserGroupModal group={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveGroup} />}
      </>
    );
  }

  return (
    <div data-screen-label="หน้ากลุ่มผู้ใช้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายการกลุ่มผู้ใช้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>จัดการกลุ่มผู้ใช้และกำหนดสิทธิ์การใช้งานระบบตามหน่วยงาน — กลุ่มผู้ใช้คือบทบาทประเภทหนึ่ง เพิ่มเพื่อให้จัดการง่ายขึ้น</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({})}><Icon name="plus" /> เพิ่มกลุ่มผู้ใช้</button>
      </div>

      <div className="search-card">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, flexShrink: 0 }}>ค้นหา</label>
          <input className="cfg-input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ชื่อกลุ่มผู้ใช้…" />
          <label style={{ fontSize: 13, fontWeight: 500, flexShrink: 0 }}>สถานะ</label>
          <select className="cfg-input" style={{ width: 220, flexShrink: 0 }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">กลุ่มทั้งหมด ({groups.length})</option>
            <option value="active">เปิดใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
          </select>
          <button className="btn primary" style={{ flexShrink: 0 }} onClick={() => {}}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn" style={{ flexShrink: 0 }} onClick={() => { setQ(''); setStatusF('all'); }}>รีเซ็ต</button>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr>
              <th>ชื่อกลุ่มผู้ใช้</th><th className="center">จำนวนสมาชิก</th><th>วันที่สร้าง</th><th>อัพเดตล่าสุด</th>
              <th className="center">สถานะ</th><th className="center" style={{ width: 90 }}>ใช้งาน</th>
              <th className="center" style={{ width: 220 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบกลุ่มผู้ใช้ที่ตรงกับเงื่อนไข</td></tr>
              ) : rows.map(g => {
                const active = g.active !== false;
                return (
                  <tr key={g.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{g.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{g.desc}</div>
                    </td>
                    <td className="center mono">{g.memberCount || 0} คน</td>
                    <td className="mono muted" style={{ fontSize: 11.5 }}>{window.fmt.datetime(g.createdAt)} น.</td>
                    <td className="mono muted" style={{ fontSize: 11.5 }}>{window.fmt.datetime(g.updatedAt)} น.</td>
                    <td className="center"><span className={"pill " + (active ? 'ok' : 'neutral')}>{active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span></td>
                    <td className="center">
                      <span className={"tgl" + (active ? ' on' : '') + (g.locked ? ' dis' : '')} title={g.locked ? 'กลุ่มระบบ — ไม่สามารถปิดใช้งานได้' : 'เปลี่ยนสถานะ'} onClick={() => toggleActive(g)} />
                    </td>
                    <td className="center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn sm" onClick={() => { setAssignId(g.id); setView('assign'); }}><Icon name="shield" size={13} /> กำหนดสิทธิ์</button>
                        <button className="btn sm" onClick={() => setModal(g)}><Icon name="edit" size={13} /> แก้ไข</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      {modal && <UserGroupModal group={modal.id ? modal : null} onClose={() => setModal(null)} onSave={saveGroup} />}
    </div>
  );
}

Object.assign(window, { UserGroupPage });
