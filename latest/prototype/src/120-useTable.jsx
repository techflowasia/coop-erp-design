// ─── แท็บเงินฝาก (ข้อมูลสงวนสิทธิ์) + ประวัติการทำรายการ (ใช้ร่วมทุกหน้าจอ) ──

// ════════════════════════════════════════════════════════════════════
//  useTable + TableToolbar — ค้นหา/เรียงรายการในตาราง (ใช้ร่วมในแท็บเงินฝาก)
// ════════════════════════════════════════════════════════════════════
function useTable(source) {
  const all = source || [];
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(r =>
      Object.values(r).some(v =>
        v != null && String(v).toLowerCase().includes(term)));
  }, [all, q]);

  return { rows, q, setQ };
}

function TableToolbar({ q, setQ, count, total, children, placeholder }) {
  return (
    <div className="toolbar" style={{ flexWrap: 'wrap' }}>
      <div className="search" style={{ flex: '0 0 240px' }}>
        <Icon name="search" size={14} />
        <input value={q || ''} onChange={e => setQ && setQ(e.target.value)}
               placeholder={placeholder || 'ค้นหาในรายการ...'} />
      </div>
      {children}
      <span className="spacer" />
      <span className="muted" style={{ fontSize: 12 }}>
        แสดง {count != null ? count : 0}{total != null ? ' จาก ' + total : ''} รายการ
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ประวัติการทำรายการ — Drawer ที่เรียกใช้ได้จากทุกหน้าจอทำรายการ
// ════════════════════════════════════════════════════════════════════
function TxHistoryButton({ memberCode, memberName, modules, title, small = true }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={"btn" + (small ? " sm" : "")} onClick={() => setOpen(true)}>
        <Icon name="history" /> ประวัติการทำรายการ
      </button>
      {open && (
        <TxHistoryDrawer memberCode={memberCode} memberName={memberName}
                         modules={modules} title={title || 'ประวัติการทำรายการ'}
                         onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function TxHistoryDrawer({ memberCode, memberName, modules, title, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const allEntries = ctx.entries || window.AUDIT_SEED || [];
  const [scoped, setScoped] = useState(true);   // true = เฉพาะหน้าจอนี้ / false = ทุกโมดูล

  const rows = useMemo(() => {
    let r = allEntries.filter(e => (e.target || '').includes(memberCode));
    if (scoped && modules && modules.length) {
      r = r.filter(e => modules.includes(e.module));
    }
    return [...r].sort((a, b) => b.ts.localeCompare(a.ts));
  }, [allEntries, memberCode, modules, scoped]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)',
                        color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <div className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {memberCode} · {memberName}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {modules && modules.length > 0 && (
            <div className="toolbar" style={{ marginTop: 0, marginBottom: 12 }}>
              <button className={"filter-chip" + (scoped ? " active" : "")} onClick={() => setScoped(true)}>
                เฉพาะหน้าจอนี้
              </button>
              <button className={"filter-chip" + (!scoped ? " active" : "")} onClick={() => setScoped(false)}>
                ทุกรายการของสมาชิก
              </button>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 12 }}>{rows.length} เหตุการณ์</span>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>
              ยังไม่มีประวัติการทำรายการในหน้าจอนี้
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map(e => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={"tx-dot " + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={"pill " + a.pill}>{a.label}</span>
                        <span className="tx-mod">{e.module}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span>
                        <span className="sep">·</span>
                        <span>{e.role}</span>
                        <span className="sep">·</span>
                        <span className="mono muted">{e.id}</span>
                      </div>
                      {e.changes && e.changes.length > 0 && (
                        <div className="tx-changes">
                          {e.changes.map((c, i) => (
                            <div className="tx-change" key={i}>
                              <span className="fld">{c.field}</span>
                              <span className="before">{c.before}</span>
                              <span className="arr">→</span>
                              <span className="after">{c.after}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mp-note" style={{ marginTop: 16 }}>
            <div className="mp-note-title">บันทึกเพื่อการตรวจสอบ</div>
            ประวัติการทำรายการถูกบันทึกอัตโนมัติจากระบบ Audit Log และไม่สามารถแก้ไขย้อนหลังได้
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บเงินฝาก — ต้องยืนยัน Username/Password ก่อนเข้าถึงข้อมูล
// ════════════════════════════════════════════════════════════════════
function DepositsTab({ data, auth, onAuth }) {
  if (!auth) return <DepositGate member={data.member} onAuth={onAuth} />;
  return <DepositView data={data} auth={auth} onLock={() => onAuth(null)} />;
}

// ════════════════════════════════════════════════════════════════════
//  DESIGN SYSTEM · DepositAccessGate
//  พื้นฐานกลางสำหรับ "ข้อมูลเงินฝากสงวนสิทธิ์" — ใช้ครอบเนื้อหาเงินฝาก
//  ทุกหน้าจอในระบบ ให้เฉพาะผู้มีสิทธิ์ (DEPOSIT_AUTHORIZED_USERS) ที่ยืนยัน
//  ตัวตนแล้วเท่านั้นจึงจะเห็นข้อมูล · การเข้าถึงถูกบันทึกลง Audit Log
//  ─ ใช้:  <DepositAccessGate member={m}>{เนื้อหาเงินฝาก}</DepositAccessGate>
//  ─ auth/onAuth (optional) : ยกสถานะสิทธิ์ไปเก็บที่หน้าจอ (คงสิทธิ์ข้ามแท็บ)
// ════════════════════════════════════════════════════════════════════
function DepositAccessGate({ member, children, subtitle, auth: authProp, onAuth }) {
  const [authState, setAuthState] = useState(null);
  const controlled = typeof onAuth === 'function';
  const auth = controlled ? authProp : authState;
  const setAuth = controlled ? onAuth : setAuthState;

  if (!member) return children || null;
  if (!auth) return <DepositGate member={member} onAuth={setAuth} subtitle={subtitle} />;
  return (
    <div>
      <div className="dep-authbar">
        <span className="dep-authbar-ico"><Icon name="unlock" size={14} /></span>
        <span>เข้าถึงข้อมูลเงินฝากโดย <b>{auth.name}</b> · {auth.role}</span>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setAuth(null)}><Icon name="lock" /> ล็อกข้อมูล</button>
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

// ─── หน้าจอยืนยันตัวตนก่อนเข้าถึงข้อมูลเงินฝาก ────────────────────────
function DepositGate({ member, onAuth, subtitle }) {
  const m = member;
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('กรุณากรอก Username และ Password'); return; }
    setBusy(true);
    setError('');
    // จำลองการตรวจสอบสิทธิ์
    setTimeout(() => {
      const user = (window.DEPOSIT_AUTHORIZED_USERS || []).find(
        u => u.username === username.trim() && u.password === password);
      if (!user) {
        setBusy(false);
        setError('Username หรือ Password ไม่ถูกต้อง หรือบัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูลเงินฝาก');
        return;
      }
      audit.log({
        action: 'access', module: 'เงินฝาก',
        target: `${m.code} · ${m.name}`,
        summary: `เข้าถึงข้อมูลเงินฝากของสมาชิก (ยืนยันตัวตนโดย ${user.name})`,
        user: user.name, role: user.role,
        changes: [{ field: 'ผู้เข้าถึง', before: '—', after: `${user.name} (${user.username})` }],
      });
      setBusy(false);
      onAuth(user);
    }, 450);
  };

  return (
    <div className="dep-gate">
      <div className="dep-gate-card">
        <div className="dep-lock-badge"><Icon name="lock" size={22} /></div>
        <h3 className="dep-gate-title">ข้อมูลเงินฝาก — สงวนสิทธิ์เฉพาะผู้มีสิทธิ์</h3>
        <p className="dep-gate-sub">
          {subtitle || <>ข้อมูลเงินฝากเป็นข้อมูลที่ต้องควบคุมการเข้าถึง กรุณายืนยันตัวตนด้วย
          Username และ Password ของเจ้าหน้าที่ผู้มีสิทธิ์ก่อนเรียกดูข้อมูลของ</>}
          <b> {m.name} ({m.code})</b>
        </p>

        <form className="dep-form" onSubmit={submit}>
          <label className="lb-label">Username</label>
          <div className="dep-input">
            <Icon name="user" size={14} />
            <input value={username} autoComplete="off"
                   onChange={e => { setUsername(e.target.value); setError(''); }}
                   placeholder="ชื่อผู้ใช้เจ้าหน้าที่" />
          </div>

          <label className="lb-label" style={{ marginTop: 10 }}>Password</label>
          <div className="dep-input">
            <Icon name="lock" size={14} />
            <input type={showPw ? 'text' : 'password'} value={password} autoComplete="off"
                   onChange={e => { setPassword(e.target.value); setError(''); }}
                   placeholder="รหัสผ่าน" />
            <button type="button" className="dep-eye" onClick={() => setShowPw(v => !v)}
                    aria-label="แสดง/ซ่อนรหัสผ่าน"><Icon name="eye" size={14} /></button>
          </div>

          {error && <div className="dep-error"><Icon name="info" size={13} /> {error}</div>}

          <button className="btn primary dep-submit" type="submit" disabled={busy}>
            {busy ? 'กำลังตรวจสอบสิทธิ์...' : <><Icon name="unlock" /> เข้าถึงข้อมูลเงินฝาก</>}
          </button>
        </form>

        <div className="dep-hint">
          <Icon name="shield" size={13} />
          <span>การเข้าถึงทุกครั้งจะถูกบันทึกไว้ใน Audit Log · ตัวอย่างสำหรับสาธิต: <b className="mono">finance</b> / <b className="mono">coop@2569</b></span>
        </div>
      </div>
    </div>
  );
}

// ─── หน้าจอข้อมูลเงินฝาก (หลังยืนยันตัวตน) ────────────────────────────
function DepositView({ data, auth, onLock }) {
  const m = data.member;
  const dep = data.deposits;
  const t = useTable(dep.transactions);
  const [typeFilter, setTypeFilter] = useState('all');

  const rows = typeFilter === 'all' ? t.rows : t.rows.filter(r => r.type === typeFilter);
  const total = dep.accounts.reduce((a, r) => a + r.balance, 0);
  const ytd = dep.accounts.reduce((a, r) => a + (r.ytdInterest || 0), 0);
  const TT = window.DEPOSIT_TXN_TYPES;

  return (
    <div>
      <div className="dep-authbar">
        <span className="dep-authbar-ico"><Icon name="unlock" size={14} /></span>
        <span>เข้าถึงโดย <b>{auth.name}</b> · {auth.role}</span>
        <span className="spacer" />
        <button className="btn sm" onClick={onLock}><Icon name="lock" /> ล็อกข้อมูล</button>
      </div>

      <div className="section" style={{ marginTop: 16 }}>
        <div className="section-head"><span className="head-bar" /><h3>บัญชีเงินฝาก</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 48 }}>ลำดับ</th>
                <th>เลขที่บัญชี</th>
                <th>ประเภทบัญชี</th>
                <th className="center">วันที่เปิด</th>
                <th className="num">อัตราดอกเบี้ย</th>
                <th className="num">ดอกเบี้ยปีนี้</th>
                <th className="num">ยอดคงเหลือ</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {dep.accounts.map(r => (
                <tr key={r.accNo}>
                  <td className="center muted">{r.no}</td>
                  <td className="mono">{r.accNo}</td>
                  <td>{r.type}</td>
                  <td className="center mono">{fmt.date(r.openDate)}</td>
                  <td className="num">{r.rate.toFixed(2)}%</td>
                  <td className="num">{fmt.money(r.ytdInterest, 2)}</td>
                  <td className="num"><b>{fmt.money(r.balance, 2)}</b></td>
                  <td className="center"><span className="pill ok">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5" className="right">ยอดเงินฝากรวม</td>
                <td className="num">{fmt.money(ytd, 2)}</td>
                <td className="num"><b>{fmt.money(total, 2)}</b></td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      <div className="section">
        <div className="section-head"><span className="head-bar" /><h3>รายการฝาก–ถอน</h3></div>
        <TableToolbar {...t} count={rows.length} total={dep.transactions.length}>
          {[['all', 'ทั้งหมด'], ['deposit', 'ฝากเงิน'], ['withdraw', 'ถอนเงิน'], ['interest', 'ดอกเบี้ย']].map(([v, label]) => (
            <button key={v} className={"filter-chip" + (typeFilter === v ? " active" : "")}
                    onClick={() => setTypeFilter(v)}>{label}</button>
          ))}
        </TableToolbar>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่รายการ</th>
                <th className="center">วันที่</th>
                <th>เลขที่บัญชี</th>
                <th className="center">ประเภท</th>
                <th>ช่องทาง</th>
                <th className="num">จำนวนเงิน</th>
                <th className="num">ยอดคงเหลือ</th>
                <th>ทำรายการโดย</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">ไม่พบรายการตามเงื่อนไข</td></tr>
              ) : rows.map(r => {
                const tt = TT[r.type] || { label: r.type, pill: 'neutral', sign: '' };
                return (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td className="center mono">{fmt.date(r.date)}</td>
                    <td className="mono">{r.accNo}</td>
                    <td className="center"><span className={"pill " + tt.pill}>{tt.label}</span></td>
                    <td>{r.channel}</td>
                    <td className="num" style={{ color: r.type === 'withdraw' ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      {tt.sign} {fmt.money(r.amount, 2)}
                    </td>
                    <td className="num">{fmt.money(r.balance, 2)}</td>
                    <td>{r.by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> แสดงรายการเคลื่อนไหวล่าสุด · เครื่องหมาย + คือเงินเข้า, − คือเงินออก
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { TxHistoryButton, TxHistoryDrawer, DepositsTab, DepositAccessGate, DepositGate });
