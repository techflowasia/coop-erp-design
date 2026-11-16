// ════════════════════════════════════════════════════════════════════
//  งานอบรม/สัมมนาและอบรมวิชาชีพ — SeminarProjectPage  (TOR 8.2)
//  ระบบงานสวัสดิการสมาชิก › การทำงาน
//  list = ทะเบียนโครงการ · form = สร้างโครงการ (components-seminar-form.jsx)
//  detail = ผู้ลงทะเบียน (A/B/C) · ลงทะเบียนหน้างาน · ห้องพัก · ค่าใช้จ่าย
//  กลุ่มผู้เข้าร่วม: A สมัครผ่านแอป/CMS · B ลงทะเบียนหน้างาน · C ลงล่วงหน้าโดยเจ้าหน้าที่
// ════════════════════════════════════════════════════════════════════

function semLoad() {
  try { const s = localStorage.getItem('seminar_projects'); if (s) return JSON.parse(s); } catch (e) {}
  return window.SEM_SEED.map(p => ({ ...p, registrants: p.registrants.map(r => ({ ...r })) }));
}
function semSaveLS(list) { try { localStorage.setItem('seminar_projects', JSON.stringify(list)); } catch (e) {} }

const semInitials = (name) => (name || '').replace(/^(นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').slice(0, 1);
function SemSourceChip({ v }) {
  const s = window.semSource(v);
  return <span className={"chip " + s.chip + " sem-src-chip"} title={s.desc}>{s.short} · {s.l}</span>;
}

// (แบบฟอร์มสร้าง/แก้ไขโครงการ อยู่ที่ components-seminar-form.jsx : window.SeminarProjectForm)

// ════════════════════════════════════════════════════════════════════
//  หน้าจอลงทะเบียนหน้างาน (กลุ่ม B) — ยืนยันตัวตนด้วยบัตรประชาชน
// ════════════════════════════════════════════════════════════════════
function SemCheckIn({ rec, onRegister, onToast }) {
  const [cid, setCid] = useState('');
  const [result, setResult] = useState(null);   // { member, eligible, dup } | { notFound:true }
  const registeredCodes = new Set(rec.registrants.map(r => r.code));

  const norm = (s) => String(s || '').replace(/\D/g, '');
  const fmtCid = (s) => { const d = norm(s).slice(0, 13); return d.replace(/^(\d)(\d{0,4})(\d{0,5})(\d{0,2})(\d{0,1}).*$/, (m, a, b, c, e, f) => [a, b, c, e, f].filter(Boolean).join('-')); };

  const verify = (rawCid) => {
    const key = norm(rawCid);
    if (key.length !== 13) { setResult(null); onToast && onToast('กรุณาระบุเลขบัตรประชาชนให้ครบ 13 หลัก'); return; }
    const member = window.semFindMemberByCitizen(key);
    if (!member) { setResult({ notFound: true }); return; }
    const elig = window.semMemberEligible(rec, member);
    setResult({ member, eligible: elig, dup: registeredCodes.has(member.code) });
  };

  // จำลองเครื่องอ่านบัตร — สุ่มสมาชิกที่ยังไม่ได้ลงทะเบียน
  const readCard = () => {
    const pool = (window.MEMBERS_LIST || []).filter(m => !registeredCodes.has(m.code) && m.citizenId);
    const pick = (pool.length ? pool : window.MEMBERS_LIST)[Math.floor(Math.random() * (pool.length || window.MEMBERS_LIST.length))];
    const v = pick.citizenId;
    setCid(fmtCid(v));
    verify(v);
    onToast && onToast('อ่านบัตรประชาชนสำเร็จ');
  };

  const confirm = () => {
    if (!result || !result.member || !result.eligible.ok || result.dup) return;
    if (onRegister(result.member, 'B')) {
      onToast && onToast(`ลงทะเบียนหน้างาน ${result.member.name} เรียบร้อย`);
      setCid(''); setResult(null);
    }
  };

  const todayB = rec.registrants.filter(r => r.source === 'B');

  return (
    <div className="search-card sem-checkin">
      <div className="section-head" style={{ marginBottom: 6 }}><span className="head-bar" /><h3>ลงทะเบียนหน้างาน (Walk-in) — ยืนยันตัวตนด้วยบัตรประชาชน</h3></div>
      <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 14 }}>
        <Icon name="info" size={11} /> เสียบบัตรที่เครื่องอ่าน หรือกรอกเลขบัตร 13 หลัก ระบบจะตรวจสอบเลขสมาชิกและสิทธิ์เข้าร่วมโครงการก่อนบันทึก
      </p>

      <div className="sem-checkin-row">
        <div className="sem-checkin-input">
          <label className="sr-label">เลขบัตรประชาชน</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="cfg-input mono" style={{ flex: 1, fontSize: 15, letterSpacing: 1 }}
              value={cid} onChange={(e) => { setCid(fmtCid(e.target.value)); setResult(null); }}
              onKeyDown={(e) => e.key === 'Enter' && verify(cid)} placeholder="0-0000-00000-00-0" inputMode="numeric" />
            <button className="btn sm" onClick={readCard}><Icon name="member" size={14} /> อ่านบัตร</button>
            <button className="btn primary sm" onClick={() => verify(cid)}><Icon name="search" size={13} /> ตรวจสอบ</button>
          </div>
        </div>
      </div>

      {result && result.notFound && (
        <div className="sem-verify sem-verify-bad">
          <Icon name="close" size={16} />
          <div><b>ไม่พบเลขบัตรนี้ในทะเบียนสมาชิก</b><div className="muted" style={{ fontSize: 12 }}>ไม่สามารถลงทะเบียนหน้างานได้ — โปรดตรวจสอบบัตร หรือแจ้งงานทะเบียนสมาชิก</div></div>
        </div>
      )}

      {result && result.member && (() => {
        const m = result.member; const ok = result.eligible.ok && !result.dup;
        return (
          <div className={"sem-verify " + (ok ? 'sem-verify-ok' : 'sem-verify-warn')}>
            <span className="sem-verify-ava">{semInitials(m.name)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{m.name} <span className="muted mono" style={{ fontSize: 11 }}>{m.code}</span></div>
              <div className="muted" style={{ fontSize: 12 }}>{m.dept} · สังกัด {m.deptCode} · บัตร {m.citizenId}</div>
              <div className="sem-verify-flags">
                <span className={"sem-flag " + (result.eligible.ok ? 'ok' : 'no')}><Icon name={result.eligible.ok ? 'check' : 'close'} size={11} /> {result.eligible.reason}</span>
                <span className={"sem-flag " + (result.dup ? 'no' : 'ok')}><Icon name={result.dup ? 'close' : 'check'} size={11} /> {result.dup ? 'ลงทะเบียนไว้แล้ว' : 'ยังไม่เคยลงทะเบียน'}</span>
              </div>
            </div>
            <button className="btn primary" disabled={!ok} onClick={confirm}><Icon name="check" /> ยืนยันลงทะเบียน</button>
          </div>
        );
      })()}

      <div className="sh-grid-head" style={{ marginTop: 18, paddingLeft: 0, paddingRight: 0 }}>
        <div><div className="sh-grid-title">ลงทะเบียนหน้างานแล้ว (กลุ่ม B)</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{todayB.length} รายการ</div></div>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl">
          <thead><tr><th style={{ width: 40 }} className="center">#</th><th>สมาชิก</th><th>สังกัด</th><th className="center">เวลาเช็คอิน</th><th className="center">สถานะ</th></tr></thead>
          <tbody>
            {todayB.length === 0 ? <tr><td colSpan="5" className="empty-state">ยังไม่มีการลงทะเบียนหน้างาน</td></tr>
              : todayB.map((r, i) => (
                <tr key={r.code}>
                  <td className="center mono muted">{i + 1}</td>
                  <td>{r.name} <span className="muted mono" style={{ fontSize: 10 }}>{r.code}</span></td>
                  <td className="muted" style={{ fontSize: 12 }}>{r.dept}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{r.checkinAt || '—'}</td>
                  <td className="center"><span className={"pill " + (r.status === 'confirmed' ? 'ok' : 'warn')}>{r.status === 'confirmed' ? 'ยืนยัน' : 'สำรอง'}</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดโครงการ + จัดการผู้ลงทะเบียน / ห้องพัก / ค่าใช้จ่าย
// ════════════════════════════════════════════════════════════════════
function SemDetail({ rec, initialTab, initialAdd, onBack, onEdit, onUpdate, onToast }) {
  const [tab, setTab] = useState(initialTab || 'reg');
  const [grp, setGrp] = useState('all');
  const [addModal, setAddModal] = useState(!!initialAdd);
  React.useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab, rec && rec.id]);
  React.useEffect(() => { if (initialAdd) setAddModal(true); }, [initialAdd, rec && rec.id]);
  const structure = (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || []));
  if (!rec) return null;
  const st = window.semStatus(rec.status);
  const confirmed = rec.registrants.filter(r => r.status === 'confirmed');
  const reserve = rec.registrants.filter(r => r.status === 'reserve');
  const cost = window.semCostEstimate(rec);
  const fillPct = Math.min(100, Math.round(confirmed.length / (rec.capacity || 1) * 100));
  const byGroup = { A: 0, B: 0, C: 0 };
  rec.registrants.forEach(r => { byGroup[r.source || 'C'] = (byGroup[r.source || 'C'] || 0) + 1; });

  const setReg = (next) => onUpdate({ ...rec, registrants: next });
  const toggleStatus = (code) => setReg(rec.registrants.map(r => r.code === code ? { ...r, status: r.status === 'confirmed' ? 'reserve' : 'confirmed' } : r));
  const toggleVip = (code) => setReg(rec.registrants.map(r => r.code === code ? { ...r, vip: !r.vip } : r));
  const setRoom = (code, room) => setReg(rec.registrants.map(r => r.code === code ? { ...r, room } : r));
  const removeReg = (code) => setReg(rec.registrants.filter(r => r.code !== code));

  // เพิ่มผู้ลงทะเบียน (ใช้ร่วมกันทั้ง C ล่วงหน้า และ B หน้างาน)
  const addReg = (m, source) => {
    if (rec.registrants.some(r => r.code === m.code)) { onToast && onToast('สมาชิกรายนี้ลงทะเบียนแล้ว'); return false; }
    const elig = window.semMemberEligible(rec, m);
    if (!elig.ok) { onToast && onToast('ไม่มีสิทธิ์เข้าร่วม: ' + elig.reason); return false; }
    const isFull = confirmed.length >= rec.capacity;
    const row = { code: m.code, name: m.name, dept: m.dept || '—', deptCode: m.deptCode || '',
      status: isFull ? 'reserve' : 'confirmed', vip: false, room: '', source };
    if (source === 'B') row.checkinAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setReg([...rec.registrants, row]);
    return true;
  };
  const addPreReg = (m) => { if (addReg(m, 'C')) { setAddModal(false); onToast && onToast(`ลงทะเบียนล่วงหน้า ${m.name} เรียบร้อย`); } };

  // เฉพาะสมาชิกที่มีสิทธิ์ + ยังไม่ลงทะเบียน (สำหรับ modal ลงล่วงหน้า)
  const eligibleSource = (window.MEMBERS_LIST || []).filter(m =>
    !rec.registrants.some(r => r.code === m.code) && window.semMemberEligible(rec, m).ok);

  const autoRoom = () => {
    const cap = window.SEM_RATES.roomCapacity; let n = 0, idx = 0;
    const next = rec.registrants.map(r => ({ ...r }));
    next.filter(r => r.status === 'confirmed').forEach((r) => {
      if (r.vip) { r.room = 'V-' + String(201 + idx).padStart(3, '0'); idx++; return; }
      r.room = 'A-' + String(101 + Math.floor(n / cap)).padStart(3, '0'); n++;
    });
    setReg(next); onToast && onToast('จัดห้องพักอัตโนมัติเรียบร้อยแล้ว');
  };

  const eligLabel = (window.SEM_ELIGIBLE.find(e => e.v === rec.eligible) || {}).l;
  const shownRegs = grp === 'all' ? rec.registrants : rec.registrants.filter(r => (r.source || 'C') === grp);

  return (
    <div data-screen-label="หน้ารายละเอียดโครงการอบรม/สัมมนา">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียนโครงการ</button>
        <span className="spacer" />
        <button className="btn sm"><Icon name="mail" /> ส่งหนังสือเชิญ / SMS</button>
        <button className="btn sm" onClick={() => onEdit(rec)}><Icon name="edit" /> แก้ไขโครงการ</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{rec.title}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{window.semType(rec.type).l}</span><span className="dot" />
              <span>{fmt.date(rec.dateFrom)}{rec.dateTo && rec.dateTo !== rec.dateFrom ? ' – ' + fmt.date(rec.dateTo) : ''}</span>
            </div>
          </div>
          <span className={"pill " + st.pill} style={{ height: 24 }}>{st.l}</span>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">สถานที่</span><span className="lt-date-v">{rec.venue || '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">รับสมัคร</span><span className="lt-date-v">{confirmed.length}/{rec.capacity} คน · สำรอง {reserve.length}/{rec.reserve}</span></div>
          <div className="lt-date"><span className="lt-date-k">ผู้มีสิทธิ์</span><span className="lt-date-v">{eligLabel}{rec.eligible === 'dept' && (rec.allowDepts || []).length ? ` · ${rec.allowDepts.length} สังกัด` : ''}{rec.areaNote ? ` · ${rec.areaNote}` : ''}</span></div>
          <div className="lt-date"><span className="lt-date-k">งบประมาณรวม</span><span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>฿ {fmt.money(cost.total, 0)}</span></div>
        </div>
        {rec.eligible === 'dept' && (rec.allowDepts || []).length > 0 && (
          <div className="sem-allow-strip">
            <span className="muted" style={{ fontSize: 11.5 }}>สังกัดที่มีสิทธิ์:</span>
            {rec.allowDepts.map(c => <span key={c} className="chip"><span className="mono">{c}</span> {window.semDeptName(c)}</span>)}
          </div>
        )}
      </div>

      {/* ความคืบหน้า + สรุปกลุ่ม */}
      <div className="search-card" style={{ marginTop: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <b style={{ fontSize: 13 }}>ความคืบหน้าการรับสมัคร</b>
          <span className="spacer" />
          <span className="sem-grp-stat" title={window.semSource('A').desc}><b>{byGroup.A || 0}</b> A·แอป/CMS</span>
          <span className="sem-grp-stat" title={window.semSource('B').desc}><b>{byGroup.B || 0}</b> B·หน้างาน</span>
          <span className="sem-grp-stat" title={window.semSource('C').desc}><b>{byGroup.C || 0}</b> C·ล่วงหน้า</span>
          <span className="mono muted" style={{ fontSize: 12 }}>รวม {confirmed.length}/{rec.capacity} ({fillPct}%)</span>
          {rec.autoClose && confirmed.length >= rec.capacity && <span className="chip warning">เต็ม — ปิดรับอัตโนมัติ</span>}
        </div>
        <div className="bk-prog-track"><div className="bk-prog-bar" style={{ width: fillPct + '%' }} /></div>
      </div>

      {/* แท็บ */}
      <div className="tabs-bar" style={{ marginBottom: 12 }}>
        <button className={"tab" + (tab === 'reg' ? ' active' : '')} onClick={() => setTab('reg')}>ผู้ลงทะเบียน <span className="count">{rec.registrants.length}</span></button>
        <button className={"tab" + (tab === 'checkin' ? ' active' : '')} onClick={() => setTab('checkin')}>ลงทะเบียนหน้างาน</button>
        <button className={"tab" + (tab === 'room' ? ' active' : '')} onClick={() => setTab('room')}>จัดห้องพัก</button>
        <button className={"tab" + (tab === 'cost' ? ' active' : '')} onClick={() => setTab('cost')}>ค่าใช้จ่าย</button>
      </div>

      {tab === 'reg' && (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-grid-head">
            <div><div className="sh-grid-title">รายชื่อผู้ลงทะเบียน</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>ยืนยัน {confirmed.length} · สำรอง {reserve.length} — สลับสถานะ/VIP หรือถอนรายชื่อได้</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm" onClick={() => setTab('checkin')}><Icon name="member" size={13} /> ลงทะเบียนหน้างาน</button>
              <button className="btn primary sm" onClick={() => setAddModal(true)}><Icon name="plus" /> ลงทะเบียนล่วงหน้า</button>
            </div>
          </div>
          <div className="sem-grp-filter">
            {[['all', 'ทั้งหมด', rec.registrants.length], ['A', 'A · แอป/CMS', byGroup.A || 0], ['B', 'B · หน้างาน', byGroup.B || 0], ['C', 'C · ล่วงหน้า', byGroup.C || 0]].map(([v, l, n]) => (
              <button key={v} className={"sem-grp-btn" + (grp === v ? ' active' : '')} onClick={() => setGrp(v)}>{l} <span className="mono">{n}</span></button>
            ))}
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th style={{ width: 40 }} className="center">#</th><th>สมาชิก</th><th>สังกัด</th><th className="center">ที่มา</th><th className="center">สถานะ</th><th className="center">VIP</th><th className="center" style={{ width: 120 }}>จัดการ</th></tr></thead>
              <tbody>
                {shownRegs.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">ยังไม่มีผู้ลงทะเบียนในกลุ่มนี้</td></tr>
                ) : shownRegs.map((r, i) => (
                  <tr key={r.code}>
                    <td className="center mono muted">{i + 1}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="row-avatar">{semInitials(r.name)}</span>
                      <div style={{ minWidth: 0 }}><div style={{ whiteSpace: 'nowrap' }}>{r.name}</div><div className="muted mono" style={{ fontSize: 10 }}>{r.code}{r.checkinAt ? ' · เช็คอิน ' + r.checkinAt.slice(11) : ''}</div></div>
                    </div></td>
                    <td className="muted" style={{ fontSize: 12 }}>{r.dept}{r.deptCode ? ` (${r.deptCode})` : ''}</td>
                    <td className="center"><SemSourceChip v={r.source || 'C'} /></td>
                    <td className="center"><span className={"pill " + (r.status === 'confirmed' ? 'ok' : 'warn')}>{r.status === 'confirmed' ? 'ยืนยัน' : 'สำรอง'}</span></td>
                    <td className="center">{r.vip ? <span className="chip primary">VIP</span> : <span className="muted">—</span>}</td>
                    <td className="center">
                      <div style={{ display: 'inline-flex', gap: 2 }}>
                        <button className="bud-act" title={r.status === 'confirmed' ? 'ย้ายเป็นสำรอง' : 'ยืนยันเข้าร่วม'} onClick={() => toggleStatus(r.code)}><Icon name="swap" size={13} /></button>
                        <button className="bud-act" title="สลับ VIP" onClick={() => toggleVip(r.code)}><Icon name="shares" size={13} /></button>
                        <button className="bud-act" title="ถอนรายชื่อ" onClick={() => removeReg(r.code)}><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      )}

      {tab === 'checkin' && <SemCheckIn rec={rec} onRegister={addReg} onToast={onToast} />}

      {tab === 'room' && (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-grid-head">
            <div><div className="sh-grid-title">ผังการจัดห้องพัก</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{rec.nights > 0 ? `${window.SEM_RATES.roomCapacity} คน/ห้อง · พัก ${rec.nights} คืน` : 'โครงการนี้ไม่มีที่พักค้างคืน'}</div></div>
            {rec.nights > 0 && <button className="btn sm" onClick={autoRoom}><Icon name="refresh" /> จัดห้องอัตโนมัติ</button>}
          </div>
          {rec.nights > 0 ? (
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
              <table className="tbl">
                <thead><tr><th>สมาชิก (เฉพาะผู้ยืนยัน)</th><th>สังกัด</th><th className="center">VIP</th><th style={{ width: 160 }}>ห้องพัก</th></tr></thead>
                <tbody>
                  {confirmed.map(r => (
                    <tr key={r.code}>
                      <td>{r.name} <span className="muted mono" style={{ fontSize: 10 }}>{r.code}</span></td>
                      <td className="muted" style={{ fontSize: 12 }}>{r.dept}</td>
                      <td className="center">{r.vip ? <span className="chip primary">VIP</span> : '—'}</td>
                      <td><input className="sh-grid-input mono" value={r.room} onChange={(e) => setRoom(r.code, e.target.value)} placeholder="เช่น A-101" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          ) : (
            <div className="empty-state" style={{ padding: '32px 16px' }}>โครงการแบบไป-กลับ ไม่ต้องจัดห้องพัก</div>
          )}
        </div>
      )}

      {tab === 'cost' && (
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ค่าใช้จ่ายโครงการ</h3></div>
          {(rec.expenses && rec.expenses.length) ? (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl">
                <thead><tr>
                  <th style={{ width: 40 }} className="center">#</th><th>รายการค่าใช้จ่าย</th><th className="center">รูปแบบ</th>
                  <th className="num">อัตรา × จำนวน</th><th>หมวดงบประมาณ</th><th className="num">รวม (บาท)</th>
                </tr></thead>
                <tbody>
                  {rec.expenses.map((e, i) => {
                    const perhead = e.mode === 'perhead';
                    const qty = e.qty === '' || e.qty == null ? cost.head : (Number(e.qty) || 0);
                    const leaf = (window.bdLeafCats ? window.bdLeafCats(structure) : []).find(l => l.id === e.cat);
                    return (
                      <tr key={e.key || i}>
                        <td className="center mono muted">{i + 1}</td>
                        <td>{e.desc || '—'}</td>
                        <td className="center"><span className="chip">{perhead ? 'รายบุคคล' : 'มูลค่ารวม'}</span></td>
                        <td className="num mono" style={{ fontSize: 12 }}>{perhead ? `${fmt.money(Number(e.rate) || 0, 0)} × ${qty}` : '—'}</td>
                        <td className="muted" style={{ fontSize: 12 }}>{leaf ? `${leaf.code || ''} ${leaf.name}` : '—'}</td>
                        <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(window.semExpenseTotal(e, cost.head), 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="sem-cost-row total">
                    <td colSpan="5" style={{ textAlign: 'right', fontWeight: 600 }}>รวมค่าใช้จ่ายโครงการ</td>
                    <td className="num mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>฿ {fmt.money(cost.total, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div></div>
          ) : (
            <div className="sem-cost-list">
              <div className="sem-cost-row"><span>ค่าพาหนะ {rec.charter ? `(เหมารถ ${rec.buses || Math.ceil(cost.head / window.SEM_RATES.busSeats)} คัน)` : `(ตามระยะทาง ${cost.km} กม. ไป-กลับ × ${cost.head} คน)`}</span><b className="mono">{fmt.money(cost.transport, 0)}</b></div>
              <div className="sem-cost-row"><span>ค่าที่พัก ({cost.rooms} ห้อง × {rec.nights} คืน × ฿{fmt.int(window.SEM_RATES.lodgingPerNight)})</span><b className="mono">{fmt.money(cost.lodging, 0)}</b></div>
              <div className="sem-cost-row"><span>ค่าอาหาร ({cost.head} คน × {rec.days} วัน × ฿{fmt.int(window.SEM_RATES.mealPerDay)})</span><b className="mono">{fmt.money(cost.meal, 0)}</b></div>
              <div className="sem-cost-row total"><span>รวมงบประมาณโครงการ</span><b className="mono">฿ {fmt.money(cost.total, 0)}</b></div>
              <div className="sem-cost-row sub"><span>เฉลี่ยต่อคน ({cost.head} คน)</span><span className="mono">฿ {fmt.money(cost.perHead, 0)}</span></div>
            </div>
          )}
          <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
            <Icon name="info" size={11} /> ยอดรวมนี้ใช้เป็นเป้าหมายในการตัดจ่ายจากงบประมาณด้านล่าง · เฉลี่ยต่อคน (จาก {cost.head} คน) ฿ {fmt.money(cost.perHead, 0)}
          </p>
        </div>
      )}

      {tab === 'cost' && (
        <div style={{ marginTop: 12 }}>
          <BudgetDisburseSection structure={structure} lines={rec.disburse || [window.bdBlankLine()]}
                                 onChange={(v) => onUpdate({ ...rec, disburse: v })}
                                 target={cost.total} targetLabel="งบประมาณโครงการ (ประมาณการ)" />
        </div>
      )}

      {addModal && <MemberSearchModal title={`ลงทะเบียนล่วงหน้า (กลุ่ม C) — ${eligibleSource.length} สมาชิกมีสิทธิ์`} source={eligibleSource}
                                      onPick={(m) => addPreReg(m)} onClose={() => setAddModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนโครงการ (list)
// ════════════════════════════════════════════════════════════════════
function SemList({ list, onCreate, onOpen }) {
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) { const n = q.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(n) || p.id.toLowerCase().includes(n) || (p.venue || '').toLowerCase().includes(n)); }
    if (typeF !== 'all') r = r.filter(p => p.type === typeF);
    if (statusF !== 'all') r = r.filter(p => p.status === statusF);
    return [...r].sort((a, b) => (b.dateFrom || '').localeCompare(a.dateFrom || ''));
  }, [list, q, typeF, statusF]);

  const openCnt = list.filter(p => p.status === 'open').length;
  const totalConf = list.reduce((s, p) => s + p.registrants.filter(r => r.status === 'confirmed').length, 0);
  const totalSeats = list.reduce((s, p) => s + (p.capacity || 0), 0);

  return (
    <div data-screen-label="หน้าทะเบียนโครงการอบรม/สัมมนา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>งานอบรม / สัมมนา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>สร้างและจัดการโครงการอบรม สัมมนา และอบรมวิชาชีพ — รับสมัคร ลงทะเบียนหน้างาน จัดห้องพัก และค่าใช้จ่าย</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> สร้างโครงการ</button>
      </div>

      <div className="sem-stat-row">
        <div className="sem-stat"><span className="sem-stat-n">{list.length}</span><span className="sem-stat-l">โครงการทั้งหมด</span></div>
        <div className="sem-stat"><span className="sem-stat-n" style={{ color: 'var(--success, #1F8A5B)' }}>{openCnt}</span><span className="sem-stat-l">กำลังเปิดรับสมัคร</span></div>
        <div className="sem-stat"><span className="sem-stat-n">{totalConf}</span><span className="sem-stat-l">ผู้ยืนยันเข้าร่วม (รวม)</span></div>
        <div className="sem-stat"><span className="sem-stat-n">{totalSeats}</span><span className="sem-stat-l">ที่นั่งที่เปิดรับ (รวม)</span></div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 260px', maxWidth: 360 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: ชื่อโครงการ, รหัส, สถานที่…" style={{ height: 32, fontSize: 13 }} />
          </div>
          <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)}>
            <option value="all">ทุกประเภท</option>{window.SEM_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
          <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">ทุกสถานะ</option>{Object.entries(window.SEM_STATUS).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
          </select>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> โครงการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr><th>รหัส</th><th>ชื่อโครงการ</th><th>ประเภท</th><th className="center">วันที่จัด</th><th className="center">รับสมัคร</th><th className="num">งบประมาณ</th><th className="center">สถานะ</th><th className="center" style={{ width: 150 }}>ลงทะเบียน</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบโครงการที่ตรงกับเงื่อนไข</td></tr>
              ) : rows.map(p => {
                const st = window.semStatus(p.status);
                const conf = p.registrants.filter(r => r.status === 'confirmed').length;
                const cost = window.semCostEstimate(p);
                const closed = p.status === 'closed' || p.status === 'cancelled';
                return (
                  <tr key={p.id} className="clickable" onClick={() => onOpen(p, 'reg')}>
                    <td className="mono" style={{ fontSize: 11 }}>{p.id}</td>
                    <td style={{ fontWeight: 500, maxWidth: 280 }}>{p.title}</td>
                    <td>{window.semType(p.type).l}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(p.dateFrom)}</td>
                    <td className="center"><span className="mono">{conf}/{p.capacity}</span></td>
                    <td className="num mono">{fmt.money(cost.total, 0)}</td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button className="btn text sm" title="ลงทะเบียนล่วงหน้า (กลุ่ม C)" disabled={closed} onClick={() => onOpen(p, 'prereg')}><Icon name="plus" size={13} /> ล่วงหน้า</button>
                        <button className="btn text sm" title="ลงทะเบียนหน้างาน (กลุ่ม B)" disabled={closed} onClick={() => onOpen(p, 'checkin')}><Icon name="member" size={13} /> หน้างาน</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}><Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดและรายชื่อผู้เข้าร่วม · ปุ่ม “ล่วงหน้า/หน้างาน” สำหรับเจ้าหน้าที่ลงทะเบียนแทนสมาชิก</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main
// ════════════════════════════════════════════════════════════════════
function SeminarProjectPage({ onToast, startMode, onNav }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(semLoad);
  const [mode, setMode] = useState(startMode === 'form' ? 'form' : 'list');  // list | form | detail
  const [current, setCurrent] = useState(null);
  const [editInit, setEditInit] = useState(null);
  const [detailTab, setDetailTab] = useState('reg');
  const [detailAdd, setDetailAdd] = useState(false);

  const isEntryForm = startMode === 'form';
  const gotoRegistry = () => { if (onNav) onNav({ view: 'welfare', page: 'seminar' }); else setMode('list'); };

  window.useBreadcrumb && window.useBreadcrumb(
    isEntryForm
      ? [{ label: 'สร้างโครงการสัมมนา', current: true }]
      : mode === 'form'
        ? [{ label: 'งานอบรม/สัมมนา', onClick: () => setMode('list') }, { label: editInit ? 'แก้ไขโครงการ' : 'สร้างโครงการ', current: true }]
        : mode === 'detail'
          ? [{ label: 'งานอบรม/สัมมนา', onClick: () => setMode('list') }, { label: 'รายละเอียดโครงการ', current: true }]
          : [{ label: 'งานอบรม/สัมมนา', current: true }],
    [isEntryForm, mode, editInit]);

  const persist = (next) => { setList(next); semSaveLS(next); };

  const openDetail = (p, tab) => {
    setCurrent(p);
    setDetailTab(tab === 'prereg' ? 'reg' : (tab || 'reg'));
    setDetailAdd(tab === 'prereg');
    setMode('detail');
  };

  const submit = (rec, isNew, kind) => {
    const next = isNew ? [rec, ...list] : list.map(p => p.id === rec.id ? rec : p);
    persist(next);
    const actionMsg = kind === 'copy' ? `คัดลอกเป็นโครงการใหม่ ${rec.id}`
      : kind === 'cancel' ? `ยกเลิกโครงการ ${rec.id}`
      : kind === 'open' ? `บันทึกและเปิดรับสมัคร ${rec.id}`
      : isNew ? `สร้างโครงการ ${rec.id} · ${rec.title}` : `แก้ไขโครงการ ${rec.id}`;
    audit.log({ action: isNew ? 'create' : 'update', module: 'สวัสดิการ — งานอบรม/สัมมนา', target: `${rec.id} · ${rec.title}`,
      summary: actionMsg,
      changes: [{ field: 'ชื่อโครงการ', before: '—', after: rec.title }, { field: 'สถานะ', before: '—', after: window.semStatus(rec.status).l }, { field: 'จำนวนรับ', before: '—', after: rec.capacity + ' คน' }] });
    onToast && onToast(actionMsg + ' เรียบร้อยแล้ว');
    setCurrent(rec); setEditInit(null); setDetailTab('reg'); setDetailAdd(false); setMode('detail');
  };
  const updateProject = (rec) => { persist(list.map(p => p.id === rec.id ? rec : p)); setCurrent(rec); };

  const formCancel = () => {
    if (isEntryForm && mode === 'form' && !editInit) { gotoRegistry(); return; }
    setMode(editInit ? 'detail' : 'list'); setEditInit(null);
  };

  return (
    <>
      {mode === 'list' && <SemList list={list} onCreate={() => { setEditInit(null); setMode('form'); }} onOpen={openDetail} />}
      {mode === 'form' && <SeminarProjectForm list={list} initial={editInit} onSubmit={submit} onCancel={formCancel} onToast={onToast} />}
      {mode === 'detail' && <SemDetail rec={current} initialTab={detailTab} initialAdd={detailAdd} onBack={() => (isEntryForm ? gotoRegistry() : setMode('list'))} onEdit={(p) => { setEditInit(p); setMode('form'); }} onUpdate={updateProject} onToast={onToast} />}
    </>
  );
}

Object.assign(window, { SeminarProjectPage });
