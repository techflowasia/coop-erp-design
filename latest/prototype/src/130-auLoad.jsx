// ════════════════════════════════════════════════════════════════════
//  ผู้ใช้งานและสิทธิ์ — UserManagementPage
//  ระบบงานผู้ดูแลระบบ › การทำงาน
//  ทะเบียนผู้ใช้ (โมดัลเพิ่ม) + รายละเอียดผู้ใช้งานและสิทธิ์ (Effective / Additional)
// ════════════════════════════════════════════════════════════════════

function auLoad() {
  try {
    const saved = localStorage.getItem('admin_users_v2');
    const parsed = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.every(u => u && u.id && u.username && Array.isArray(u.roleIds))) return parsed;
  } catch (e) {}
  return window.ADM_USERS_SEED.map(u => ({ ...u }));
}
function auSaveLS(list) {
  try { localStorage.setItem('admin_users_v2', JSON.stringify(list)); } catch (e) {}
}
function auInitials(name) {
  return (name || '?').trim().replace(/^(นาย|นาง|นางสาว|ว่าที่ ร\.ต\.)\s*/, '').slice(0, 1);
}
const auRoleName = (id) => (window.admRole(id) || {}).name || id;

// ─── ตัวเลือกหลายค่า (บทบาท / กลุ่มผู้ใช้) — กล่องค้นหา + เลือก ─────────
function AuTagPicker({ options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = React.useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()) && !value.includes(o.value));
  const toggle = (v) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="aup-pick" ref={ref}>
      <div className="aup-pick-box" onClick={() => setOpen(true)}>
        {value.map(v => {
          const o = options.find(x => x.value === v);
          return (
            <span key={v} className="chip primary" style={{ gap: 5 }}>
              {o ? o.label : v}
              <span onClick={(e) => { e.stopPropagation(); toggle(v); }} style={{ cursor: 'pointer', display: 'inline-flex' }}><Icon name="close" size={10} /></span>
            </span>
          );
        })}
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
               placeholder={value.length ? '' : placeholder} />
      </div>
      {open && (
        <div className="aup-pick-menu">
          {filtered.length === 0 ? <div className="aup-pick-empty">ไม่พบตัวเลือก</div> : filtered.map(o => (
            <div key={o.value} className="aup-pick-opt" onClick={() => { toggle(o.value); setQ(''); }}>
              <Icon name="plus" size={11} /> {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── โมดัลเพิ่มผู้ใช้งานใหม่ ────────────────────────────────────────────
function AuAddUserModal({ onClose, onSave }) {
  const [f, setF] = useState({ citizenId: '', email: '', dept: '', roleIds: [], groupIds: [], active: true });
  const [err, setErr] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setErr(''); };
  const roleOpts = window.ADM_ROLES.map(r => ({ value: r.id, label: r.name }));
  const groupOpts = window.ADM_USER_GROUPS.map(g => ({ value: g, label: g }));

  const submit = () => {
    if (!f.citizenId.trim()) return setErr('กรุณาระบุเลขประจำตัวประชาชน');
    if (!f.email.trim()) return setErr('กรุณาระบุอีเมล');
    if (!f.dept) return setErr('กรุณาเลือกฝ่าย/สังกัด');
    if (f.roleIds.length === 0) return setErr('กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท');
    onSave({
      id: 'u' + Date.now().toString().slice(-6),
      username: f.email.split('@')[0],
      name: '(รอกรอกชื่อ-สกุล)',
      initials: '?',
      citizenId: f.citizenId.trim(),
      email: f.email.trim(),
      dept: f.dept, group: f.dept,
      roleId: f.roleIds[0], roleIds: f.roleIds,
      groupIds: f.groupIds,
      status: f.active ? 'active' : 'locked',
      lastLogin: '', createdAt: new Date().toISOString().slice(0, 10),
      pwChangedAt: new Date().toISOString().slice(0, 10), pwExpireDays: 90, mustChange: true,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head"><h2>เพิ่มผู้ใช้งานใหม่</h2><button className="close-btn" onClick={onClose}><Icon name="close" /></button></div>
        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          <div className="cfg-field">
            <label className="cfg-label">เลขประจำตัวประชาชน<span className="cfg-required">*</span></label>
            <input className="cfg-input mono" value={f.citizenId} onChange={(e) => set('citizenId', e.target.value)} placeholder="เช่น 1-1099-00123-45-6" />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">อีเมล<span className="cfg-required">*</span></label>
            <input className="cfg-input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="name@coopthai.or.th" />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">ฝ่าย/สังกัด<span className="cfg-required">*</span></label>
            <select className="cfg-input" value={f.dept} onChange={(e) => set('dept', e.target.value)}>
              <option value="">— เลือกฝ่าย/สังกัด —</option>
              {window.ADM_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">บทบาท<span className="cfg-required">*</span></label>
            <AuTagPicker options={roleOpts} value={f.roleIds} onChange={(v) => set('roleIds', v)} placeholder="ค้นหาและเลือกบทบาท" />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">กลุ่มผู้ใช้</label>
            <AuTagPicker options={groupOpts} value={f.groupIds} onChange={(v) => set('groupIds', v)} placeholder="ค้นหาและเลือกกลุ่มผู้ใช้" />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">สถานะ</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={'tgl' + (f.active ? ' on' : '')} onClick={() => set('active', !f.active)} />
              <span style={{ fontSize: 13 }}>ใช้งาน</span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit}>บันทึกผู้ใช้งาน</button>
        </div>
      </div>
    </>
  );
}

// ─── ตารางสิทธิ์แบบ tree (กลุ่มระบบ → เมนู → รายการสิทธิ์) ───────────────
function AuPermTable({ groups, permType, statusF, q }) {
  const flat = [];
  groups.forEach(g => {
    const rows = [];
    g.modules.forEach(m => {
      const mrows = m.rows.filter(r =>
        (permType === 'all' || r.type === permType) &&
        (statusF === 'all' || r.status === statusF) &&
        (!q.trim() || r.code.toLowerCase().includes(q.toLowerCase()) || r.name.toLowerCase().includes(q.toLowerCase())));
      if (mrows.length) rows.push({ menu: m.menu, rows: mrows });
    });
    if (rows.length) flat.push({ sys: g.sys, modules: rows });
  });
  return (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl">
        <thead>
          <tr><th>รหัสสิทธิ์</th><th>ชื่อสิทธิ์</th><th>ประเภทสิทธิ์</th><th>แหล่งที่มา</th><th>สถานะ</th></tr>
        </thead>
        <tbody>
          {flat.length === 0 ? (
            <tr><td colSpan="5" className="empty-state">ไม่พบสิทธิ์ที่ตรงกับเงื่อนไข</td></tr>
          ) : flat.map((g, gi) => (
            <React.Fragment key={gi}>
              <tr className="rp-group-row"><td colSpan="5"><Icon name="down" size={11} /> {g.sys}</td></tr>
              {g.modules.map((m, mi) => (
                <React.Fragment key={mi}>
                  <tr className="rp-menu-row"><td colSpan="5"><Icon name="down" size={10} /> {m.menu}</td></tr>
                  {m.rows.map(r => (
                    <tr key={r.code}>
                      <td className="mono">{r.code}</td>
                      <td>{r.name}</td>
                      <td><span className={'chip' + (r.type === 'Menu' ? ' primary' : '')}>{r.type}</span></td>
                      <td className="muted" style={{ fontSize: 12 }}>{r.source}</td>
                      <td><span className={'chip ' + (r.status === 'allow' ? 'primary' : 'danger')}>{r.status === 'allow' ? 'Allow' : 'Deny'}</span></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div></div>
  );
}

// ─── รายละเอียดผู้ใช้งานและสิทธิ์ ───────────────────────────────────────
function AuUserDetail({ user, onBack, onSave, onToast }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(() => ({ ...user }));
  useEffect(() => { setF({ ...user }); setEditing(false); }, [user.id]);
  const [tab, setTab] = useState('effective');
  const [q, setQ] = useState(''); const [permType, setPermType] = useState('all'); const [statusF, setStatusF] = useState('all');

  window.useBreadcrumb([
    { label: 'ผู้ใช้งานและสิทธิ์', onClick: onBack },
    { label: 'ข้อมูลผู้ใช้งานและสิทธิ์', current: true },
  ], [user.id]);

  const st = window.ADM_USER_STATUS[user.status] || {};
  const groups = useMemo(() => window.admUserPermGroups(user), [user.id, user.status, (user.roleIds || []).join(','), (user.groupIds || []).join(',')]);
  const roleOpts = window.ADM_ROLES.map(r => ({ value: r.id, label: r.name }));
  const groupOpts = window.ADM_USER_GROUPS.map(g => ({ value: g, label: g }));

  const save = () => { onSave({ ...f, dept: f.dept, group: (f.groupIds && f.groupIds[0]) || f.dept, roleIds: f.roleIds || [], groupIds: f.groupIds || [] }); setEditing(false); onToast && onToast('บันทึกข้อมูลผู้ใช้งานเรียบร้อยแล้ว'); };

  return (
    <div data-screen-label="หน้าข้อมูลผู้ใช้งานและสิทธิ์">
      <div className="page-actions">
        <button className="btn sm ghost" onClick={onBack}><Icon name="left" size={13} /> กลับสู่รายการ</button>
        <span className="spacer" />
        <span className="chip">{user.lastLogin ? ('บันทึกล่าสุด: ' + fmt.datetime(user.lastLogin)) : 'ยังไม่มีการเข้าใช้งาน'}</span>
        <button className="btn sm" onClick={() => onToast && onToast('เปิดประวัติการทำรายการของผู้ใช้งาน ' + user.username)}><Icon name="history" /> ประวัติ</button>
        {editing ? (
          <>
            <button className="btn sm ghost" onClick={() => { setF({ ...user }); setEditing(false); }}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
          </>
        ) : (
          <button className="btn primary sm" onClick={() => setEditing(true)}><Icon name="edit" /> แก้ไขข้อมูลผู้ใช้งาน</button>
        )}
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{user.name}</h1>
          <span className={'pill ' + st.pill}>{st.l}</span>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          อีเมล: <span className="mono">{user.email}</span> · เข้าระบบล่าสุด {user.lastLogin ? fmt.datetime(user.lastLogin) : '—'}
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ข้อมูลผู้ใช้งาน</h3></div>
        <div className="lt-grid">
          <div>
            <div className="cfg-field">
              <label className="cfg-label">เลขประจำตัวประชาชน<span className="cfg-required">*</span></label>
              {editing ? <input className="cfg-input mono" value={f.citizenId || ''} onChange={(e) => setF(s => ({ ...s, citizenId: e.target.value }))} />
                       : <div className="aup-view-box mono">{user.citizenId || '—'}</div>}
            </div>
            <div className="cfg-field">
              <label className="cfg-label">ฝ่าย/สังกัด<span className="cfg-required">*</span></label>
              {editing ? (
                <select className="cfg-input" value={f.dept} onChange={(e) => setF(s => ({ ...s, dept: e.target.value }))}>
                  {window.ADM_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : <div className="aup-view-box">{user.dept}</div>}
            </div>
            <div className="cfg-field">
              <label className="cfg-label">กลุ่มผู้ใช้</label>
              {editing ? <AuTagPicker options={groupOpts} value={f.groupIds || []} onChange={(v) => setF(s => ({ ...s, groupIds: v }))} placeholder="ค้นหาและเลือกกลุ่มผู้ใช้" />
                       : <div className="aup-chiprow">{(user.groupIds && user.groupIds.length ? user.groupIds : [user.group]).map(g => <span key={g} className="chip">{g}</span>)}</div>}
            </div>
          </div>
          <div>
            <div className="cfg-field">
              <label className="cfg-label">อีเมล<span className="cfg-required">*</span></label>
              {editing ? <input className="cfg-input" value={f.email} onChange={(e) => setF(s => ({ ...s, email: e.target.value }))} />
                       : <div className="aup-view-box mono">{user.email}</div>}
            </div>
            <div className="cfg-field">
              <label className="cfg-label">บทบาท<span className="cfg-required">*</span></label>
              {editing ? <AuTagPicker options={roleOpts} value={f.roleIds || []} onChange={(v) => setF(s => ({ ...s, roleIds: v, roleId: v[0] }))} placeholder="ค้นหาและเลือกบทบาท" />
                       : <div className="aup-chiprow">{(user.roleIds && user.roleIds.length ? user.roleIds : [user.roleId]).map(r => <span key={r} className="chip primary">{auRoleName(r)}</span>)}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-container">
        <div className="tabs-bar">
          <button className={'tab' + (tab === 'effective' ? ' active' : '')} onClick={() => setTab('effective')}>สิทธิ์ที่มีจริง</button>
          <button className={'tab' + (tab === 'extra' ? ' active' : '')} onClick={() => setTab('extra')}>สิทธิ์เพิ่มเติม</button>
        </div>
        <div className="tab-panel">
          <div className="aud-filter-grid" style={{ marginBottom: 14 }}>
            <div className="aud-field" style={{ gridColumn: 'span 2' }}>
              <label className="aud-flab">ค้นหา</label>
              <input className="cfg-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="รหัสสิทธิ์ / ชื่อสิทธิ์" />
            </div>
            <div className="aud-field">
              <label className="aud-flab">ประเภทสิทธิ์</label>
              <select className="cfg-input" value={permType} onChange={(e) => setPermType(e.target.value)}>
                <option value="all">— ทั้งหมด —</option>
                <option value="Menu">Menu</option>
                <option value="Action">Action</option>
              </select>
            </div>
            <div className="aud-field">
              <label className="aud-flab">สถานะ</label>
              <select className="cfg-input" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
                <option value="all">— ทั้งหมด —</option>
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="btn primary" onClick={() => {}}><Icon name="search" size={13} /> ค้นหา</button>
            <button className="btn" onClick={() => { setQ(''); setPermType('all'); setStatusF('all'); }}>รีเซ็ต</button>
          </div>
          {tab === 'effective' ? (
            <AuPermTable groups={groups} permType={permType} statusF={statusF} q={q} />
          ) : (
            <AuPermTable groups={groups.map(g => ({ ...g, modules: g.modules.map(m => ({ ...m, rows: m.rows.filter(r => r.source === 'Override รายบุคคล') })) }))}
                         permType={permType} statusF={statusF} q={q} />
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — รายการผู้ใช้งาน
// ════════════════════════════════════════════════════════════════════
function UserManagementPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(auLoad);
  const [selId, setSelId] = useState(null);
  const [q, setQ] = useState('');
  const [roleF, setRoleF] = useState('all');
  const [groupF, setGroupF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [addOpen, setAddOpen] = useState(false);

  const persist = (next) => { setList(next); auSaveLS(next); };

  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(u => u.name.toLowerCase().includes(n) || u.username.toLowerCase().includes(n) || (u.email || '').toLowerCase().includes(n));
    }
    if (roleF !== 'all') r = r.filter(u => (u.roleIds || [u.roleId]).includes(roleF));
    if (groupF !== 'all') r = r.filter(u => (u.groupIds || [u.group]).includes(groupF));
    if (statusF !== 'all') r = r.filter(u => u.status === statusF);
    return r;
  }, [list, q, roleF, groupF, statusF]);

  const hasFilter = q || roleF !== 'all' || groupF !== 'all' || statusF !== 'all';
  const resetFilters = () => { setQ(''); setRoleF('all'); setGroupF('all'); setStatusF('all'); };

  const sel = selId ? list.find(u => u.id === selId) || null : null;

  const saveUser = (rec, isNew) => {
    const exists = list.some(u => u.id === rec.id);
    const next = exists ? list.map(u => u.id === rec.id ? rec : u) : [rec, ...list];
    persist(next);
    audit.log({
      action: isNew ? 'create' : 'update', module: 'ผู้ดูแลระบบ — ผู้ใช้งานและสิทธิ์',
      target: `${rec.username} · ${rec.name}`,
      summary: isNew ? `เพิ่มผู้ใช้งานใหม่ ${rec.email}` : `แก้ไขผู้ใช้งาน ${rec.username}`,
      changes: [{ field: 'บทบาท', before: '—', after: (rec.roleIds || [rec.roleId]).map(auRoleName).join(', ') }],
    });
    onToast && onToast(isNew ? 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว' : `บันทึกผู้ใช้งาน ${rec.username} เรียบร้อยแล้ว`);
    setAddOpen(false);
  };

  const toggleActive = (u) => {
    if (u.status === 'locked') return;
    const status = u.status === 'active' ? 'disabled' : 'active';
    persist(list.map(x => x.id === u.id ? { ...x, status } : x));
    audit.log({ action: 'status', module: 'ผู้ดูแลระบบ — ผู้ใช้งานและสิทธิ์', target: `${u.username} · ${u.name}`,
      summary: status === 'disabled' ? `ปิดใช้งานบัญชี ${u.username}` : `เปิดใช้งานบัญชี ${u.username}` });
    onToast && onToast(status === 'disabled' ? `ปิดใช้งานบัญชี ${u.username} แล้ว` : `เปิดใช้งานบัญชี ${u.username} แล้ว`);
  };

  if (sel) {
    return <AuUserDetail user={sel} onBack={() => setSelId(null)} onSave={(rec) => saveUser(rec, false)} onToast={onToast} />;
  }

  return (
    <div data-screen-label="หน้าผู้ใช้งานและสิทธิ์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ผู้ใช้งานและสิทธิ์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            จัดการบัญชีผู้ใช้ บทบาท และระดับการเข้าถึงระบบของเจ้าหน้าที่
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAddOpen(true)}><Icon name="plus" /> เพิ่มผู้ใช้งาน</button>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 260px', maxWidth: 360 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: ชื่อ, username, อีเมล…" style={{ height: 32, fontSize: 13 }} />
          </div>
          <select className="filter-select" value={roleF} onChange={(e) => setRoleF(e.target.value)}>
            <option value="all">ทุกบทบาท</option>
            {window.ADM_ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select className="filter-select" value={groupF} onChange={(e) => setGroupF(e.target.value)}>
            <option value="all">ทุกกลุ่มผู้ใช้งาน</option>
            {window.ADM_USER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {Object.entries(window.ADM_USER_STATUS).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
          </select>
          <span className="spacer" />
          <button className="btn primary sm" onClick={() => {}}><Icon name="search" size={13} /> ค้นหา</button>
          {hasFilter && <button className="btn ghost sm" onClick={resetFilters}>รีเซ็ต</button>}
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>ผู้ใช้งาน</th>
                <th>ฝ่าย/สังกัด</th>
                <th>บทบาท</th>
                <th>กลุ่มผู้ใช้งาน</th>
                <th className="center">เข้าระบบล่าสุด</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</td></tr>
              ) : rows.map(u => {
                const st = window.ADM_USER_STATUS[u.status] || {};
                const isOn = u.status !== 'disabled' && u.status !== 'locked';
                return (
                  <tr key={u.id} className="clickable" onClick={() => setSelId(u.id)}>
                    <td>
                      <div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{u.name}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{u.username}</div>
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{u.dept || '—'}</td>
                    <td><div className="aup-chiprow">{(u.roleIds || [u.roleId]).map(r => <span key={r} className="chip primary">{auRoleName(r)}</span>)}</div></td>
                    <td><div className="aup-chiprow">{(u.groupIds || [u.group]).map(g => <span key={g} className="chip">{g}</span>)}</div></td>
                    <td className="center mono muted" style={{ fontSize: 11 }}>{u.lastLogin ? fmt.datetime(u.lastLogin) : '—'}</td>
                    <td className="center">
                      <span className={'pill ' + st.pill}>{st.l}</span>
                      {u.status === 'locked' && <div className="aup-subnote warn"><Icon name="lock" size={10} /> ล็อกจากระบบ</div>}
                      {u.status === 'disabled' && u.disabledBy === 'hr' && <div className="aup-subnote info"><Icon name="lock" size={10} /> จากระบบ HR</div>}
                    </td>
                    <td className="center">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span className={'tgl' + (isOn ? ' on' : '') + (u.status === 'locked' ? ' dis' : '')}
                              title={u.status === 'locked' ? 'บัญชีถูกล็อกจากระบบ' : 'เปลี่ยนสถานะการใช้งาน'}
                              onClick={(e) => { e.stopPropagation(); toggleActive(u); }} />
                        <span className="muted" style={{ fontSize: 11 }}>{isOn ? 'เปิด' : 'ปิด'}</span>
                        <Icon name="right" size={12} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <div className="pagination">
          <span className="muted" style={{ fontSize: 12, marginRight: 'auto' }}>1-{rows.length} จาก {rows.length} แถว</span>
          <button className="btn sm" disabled><Icon name="chevLeft" /></button>
          <button className="btn sm primary">1</button>
          <button className="btn sm" disabled><Icon name="chevRight" /></button>
          <select className="filter-select" style={{ height: 30, marginLeft: 4 }} defaultValue="20">
            <option value="20">20 / หน้า</option>
            <option value="50">50 / หน้า</option>
            <option value="100">100 / หน้า</option>
          </select>
        </div>
      </div>

      {addOpen && <AuAddUserModal onClose={() => setAddOpen(false)} onSave={(rec) => saveUser(rec, true)} />}
    </div>
  );
}

Object.assign(window, { UserManagementPage });
