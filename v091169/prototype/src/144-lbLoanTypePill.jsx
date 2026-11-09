// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ห้ามกู้
//  เพิ่มข้อมูลเหตุผลในการห้ามกู้ของสมาชิก: ค้นหาสมาชิก → เลือกประเภท
//  เงินกู้ → ระบุเหตุผลการห้ามกู้ / เหตุผลการกู้ต่อ → บันทึกข้อมูล
// ════════════════════════════════════════════════════════════════════

// pill ประเภทเงินกู้ (ใช้ร่วมกับหน้าตรวจสอบสิทธิค้ำ)
const lbLoanTypePill = (s) => {
  if (s.startsWith('ฉุกเฉิน')) return <span className="pill warn">{s}</span>;
  if (s.startsWith('สามัญ'))  return <span className="pill info">{s}</span>;
  if (s.startsWith('พิเศษ'))  return <span className="pill ok">{s}</span>;
  return <span className="pill neutral">{s}</span>;
};

// uid สำหรับรายการห้ามกู้แต่ละแถว
let _lbUidSeq = 0;
const lbUid = () => 'lb-' + (++_lbUidSeq);

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// ข้อมูล: รหัสสมาชิก · ชื่อ · นามสกุล · เลขที่บัตรประชาชน
function LbMemberSearchModal({ onPick, onClose }) {
  const [c, setC] = useState({ code: '', firstName: '', lastName: '', citizenId: '' });
  const [results, setResults] = useState(() => window.GUAR_MEMBERS);
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const run = () => setResults(window.searchGuarMembers(c));
  const reset = () => { setC({ code: '', firstName: '', lastName: '', citizenId: '' }); setResults(window.GUAR_MEMBERS); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสมาชิก</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. รหัสสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-058241" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. ชื่อ</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อจริง" />
            </label>
            <label className="gc-sf">
              <span>3. นามสกุล</span>
              <input value={c.lastName} onChange={(e) => set('lastName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="นามสกุล" />
            </label>
            <label className="gc-sf">
              <span>4. เลขที่บัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน" className="mono" />
            </label>
            <div className="gc-sf-actions" style={{ gridColumn: 'span 4' }}>
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายชื่อสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>รหัสสมาชิก</th>
                  <th>ชื่อ</th>
                  <th>นามสกุล</th>
                  <th>เลขที่บัตรประชาชน</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map((m) => (
                  <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                    <td className="mono">{m.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                        <span>{m.title}{m.firstName}</span>
                      </div>
                    </td>
                    <td>{m.lastName}</td>
                    <td className="mono">{m.citizenId}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือกสมาชิก">
                        <Icon name="chevRight" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ─── หน้าหลัก: ห้ามกู้ ───────────────────────────────────────────────
function LoanBanPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const workDate = window.DEPOSIT_WORKING_DATE;

  const [docNo, setDocNo]       = useState(() => window.nextLoanBanDocNo());
  const [member, setMember]     = useState(null);
  const [modalOpen, setModal]   = useState(false);
  const [sel, setSel]           = useState({});   // { [loanType]: banReason } ประเภทที่ติ๊กเลือกห้ามกู้
  const [error, setError]       = useState('');
  const [bans, setBans]         = useState(() => window.LOAN_BAN_SEED.map(b => ({ ...b, id: lbUid() })));
  const [cancelTarget, setCancelTarget] = useState(null);

  const pick = (m) => {
    setMember(m); setModal(false); setError('');
    setSel({});
  };

  const memberBans = member ? bans.filter(b => b.memberCode === member.code) : [];
  // ประเภทที่ถูกห้ามกู้อยู่แล้ว (ยังไม่ปลดล็อก) ของสมาชิกรายนี้
  const activeBannedTypes = memberBans.filter(b => b.status === 'ห้ามกู้').map(b => b.loanType);

  // ติ๊ก / เอาออก ประเภทเงินกู้
  const toggleType = (t) => {
    setSel(prev => {
      const n = { ...prev };
      if (t in n) delete n[t]; else n[t] = '';
      return n;
    });
    setError('');
  };
  const setReason = (t, v) => { setSel(prev => ({ ...prev, [t]: v })); setError(''); };
  const selectedTypes = Object.keys(sel);

  const resetForm = () => { setSel({}); setError(''); };

  const save = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนบันทึก'); return; }
    if (selectedTypes.length === 0) {
      setError('กรุณาเลือกประเภทเงินกู้ที่ต้องการห้ามกู้อย่างน้อย 1 รายการ'); return;
    }
    const missing = selectedTypes.filter(t => !sel[t].trim());
    if (missing.length) {
      setError('กรุณาระบุเหตุผลการห้ามกู้ให้ครบทุกประเภทที่เลือก'); return;
    }
    const list = selectedTypes.map(t => ({ loanType: t, banReason: sel[t].trim() }));

    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const recs = list.map(it => ({
      id: lbUid(), docNo, memberCode: member.code,
      loanType: it.loanType, banReason: it.banReason, resumeReason: '',
      status: 'ห้ามกู้', by: 'จันทร์เพ็ญ มาลี', ts,
    }));
    setBans(prev => [...recs, ...prev]);

    audit.log({
      action: 'create', module: 'สินเชื่อ — ห้ามกู้',
      target: `${member.code} · ${member.name}`,
      summary: `เพิ่มรายการห้ามกู้ ${list.length} ประเภท (${list.map(i => i.loanType).join(', ')}) เลขที่เอกสาร ${docNo}`,
      changes: [
        { field: 'เลขที่เอกสาร', before: '—', after: docNo },
        ...list.map(i => ({ field: `ห้ามกู้ — ${i.loanType}`, before: '—', after: i.banReason })),
      ],
    });

    onToast && onToast(`บันทึกการห้ามกู้ ${docNo} · ${member.name} จำนวน ${list.length} ประเภทเรียบร้อยแล้ว`);
    setSel({}); setError('');
    setDocNo(window.nextLoanBanDocNo());
  };

  // ยกเลิกการห้ามกู้ (ปลดล็อก) — ระบุเหตุผลการกู้ต่อ
  const confirmCancel = ({ rec, resumeReason }) => {
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    setBans(prev => prev.map(b => b.id === rec.id
      ? { ...b, status: 'ปลดล็อก', resumeReason, cancelBy: 'จันทร์เพ็ญ มาลี', cancelTs: ts }
      : b));
    audit.log({
      action: 'update', module: 'สินเชื่อ — ห้ามกู้',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกการห้ามกู้ (${rec.loanType}) เลขที่เอกสาร ${rec.docNo}`,
      changes: [
        { field: 'สถานะ', before: 'ห้ามกู้', after: 'ปลดล็อก' },
        { field: `เหตุผลการกู้ต่อ — ${rec.loanType}`, before: '—', after: resumeReason },
      ],
    });
    onToast && onToast(`ยกเลิกการห้ามกู้ ${rec.loanType} · ${member.name} เรียบร้อยแล้ว`);
    setCancelTarget(null);
  };

  return (
    <div data-screen-label="หน้าห้ามกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ระบบสินเชื่อ · ห้ามกู้
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เพิ่มข้อมูลเหตุผลในการห้ามกู้ของสมาชิก — เลือกห้ามได้หลายประเภทเงินกู้ และยกเลิกการห้ามกู้ได้
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันที่เอกสาร</span>
          <span className="ct-workdate-value mono">{fmt.date(workDate)}</span>
        </div>
      </div>

      {/* ── การ์ดหัวเอกสาร: เลขที่เอกสาร + ข้อมูลสมาชิก ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" />
          <h3>ข้อมูลเอกสารและสมาชิก</h3>
          <span className="head-actions">
            <span className="lb-docno">
              <span className="lb-docno-k">เลขที่เอกสาร</span>
              <span className="lb-docno-v mono">{docNo}</span>
            </span>
          </span>
        </div>

        <div className="lb-header-grid">
          <div className="field">
            <span className="label">เลขที่สมาชิก</span>
            <span className="value">
              <button className="gc-member-trigger lb-trigger" onClick={() => setModal(true)}>
                {member ? (
                  <>
                    <span className="row-avatar">{member.firstName.slice(0, 1)}</span>
                    <span className="gc-mt-code mono">{member.code}</span>
                    <span className="gc-mt-name">{member.name}</span>
                    <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
                  </>
                ) : (
                  <>
                    <Icon name="search" size={14} />
                    <span className="muted">คลิกเพื่อค้นหาเลขสมาชิก…</span>
                    <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                  </>
                )}
              </button>
            </span>
          </div>
          <div className="field">
            <span className="label">ชื่อสมาชิก</span>
            <span className={"value" + (member ? '' : ' muted')}>{member ? member.name : '—'}</span>
          </div>
          <div className="field">
            <span className="label">สังกัด</span>
            <span className={"value" + (member ? '' : ' muted')}>{member ? member.unit : '—'}</span>
          </div>
          <div className="field">
            <span className="label">ชื่อหน่วยงาน</span>
            <span className={"value" + (member ? '' : ' muted')}>{member ? member.department : '—'}</span>
          </div>
        </div>
      </div>

      {/* ── ฟอร์มเพิ่มข้อมูลห้ามกู้ (แสดงเมื่อเลือกสมาชิกแล้ว) ── */}
      {member ? (
        <>
          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head" style={{ marginBottom: 14 }}>
              <span className="head-bar" style={{ background: 'var(--danger)' }} />
              <h3>รายละเอียดการห้ามกู้</h3>
              <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
                เลือกประเภทเงินกู้ที่ต้องการห้ามกู้ (เลือกได้มากกว่า 1 ประเภท)
              </span>
            </div>

            <div className="lb-form">
              <div className="lb-field">
                <label className="lb-label">
                  ประเภทเงินกู้ที่ห้ามกู้ <span className="cfg-required">*</span>
                  {selectedTypes.length > 0 &&
                    <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>· เลือกแล้ว {selectedTypes.length} ประเภท</span>}
                </label>
              </div>

              {/* รายการประเภทเงินกู้ทั้งหมด — เลือกแบบ checkbox + ระบุเหตุผลรายประเภท */}
              <div className="lb-checklist">
                {window.LOAN_BAN_TYPES.map(t => {
                  const banned  = activeBannedTypes.includes(t);
                  const checked = t in sel;
                  return (
                    <div className={"lb-check-item" + (checked ? ' on' : '') + (banned ? ' banned' : '')} key={t}>
                      <label className="lb-check-main">
                        <input type="checkbox" className="ct-check"
                               checked={checked} disabled={banned}
                               onChange={() => toggleType(t)} />
                        <span className="lb-check-name">{t}</span>
                        {banned && <span className="pill bad lb-check-tag">ห้ามกู้อยู่แล้ว</span>}
                      </label>
                      {checked && (
                        <input className="cfg-input lb-check-reason" autoFocus
                               placeholder="ระบุเหตุผลการห้ามกู้ของประเภทนี้…"
                               value={sel[t]}
                               onChange={(e) => setReason(t, e.target.value)} />
                      )}
                    </div>
                  );
                })}
              </div>

              {error && <div className="dep-error"><Icon name="info" size={13} /> {error}</div>}

              <div className="lb-actions">
                <span className="lb-hint muted" style={{ marginRight: 'auto' }}>
                  <Icon name="info" size={12} /> ยกเลิกการห้ามกู้ได้ที่ตารางประวัติด้านล่าง โดยระบุ “เหตุผลการกู้ต่อ”
                </span>
                <button className="btn" onClick={resetForm}>
                  <Icon name="refresh" /> ล้างฟอร์ม
                </button>
                <button className="btn primary" onClick={save}
                        disabled={selectedTypes.length === 0}>
                  <Icon name="check" /> บันทึกข้อมูล
                </button>
              </div>
            </div>
          </div>

          {/* ── รายการห้ามกู้ของสมาชิกรายนี้ ── */}
          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head" style={{ marginBottom: 12 }}>
              <span className="head-bar" />
              <h3>ประวัติการห้ามกู้ของสมาชิก</h3>
              <span className="gc-count">{memberBans.length} รายการ</span>
            </div>
            {memberBans.length === 0 ? (
              <div className="gc-empty">— ยังไม่มีรายการห้ามกู้ของสมาชิกรายนี้ —</div>
            ) : (
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>เลขที่เอกสาร</th>
                      <th className="center">ประเภทเงินกู้</th>
                      <th>เหตุผลการห้ามกู้</th>
                      <th>เหตุผลการกู้ต่อ</th>
                      <th className="center">สถานะ</th>
                      <th>บันทึกโดย</th>
                      <th className="center" style={{ width: 150 }}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberBans.map((b) => (
                      <tr key={b.id}>
                        <td className="mono">{b.docNo}</td>
                        <td className="center">{lbLoanTypePill(b.loanType)}</td>
                        <td style={{ whiteSpace: 'normal', maxWidth: 260 }}>{b.banReason}</td>
                        <td style={{ whiteSpace: 'normal', maxWidth: 220 }}>
                          {b.resumeReason || <span className="muted">—</span>}
                        </td>
                        <td className="center">
                          {b.status === 'ห้ามกู้'
                            ? <span className="pill bad">ห้ามกู้</span>
                            : <span className="pill ok">ปลดล็อก</span>}
                        </td>
                        <td>
                          <div>{b.by}</div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{b.ts}</div>
                        </td>
                        <td className="center">
                          {b.status === 'ห้ามกู้' ? (
                            <button className="btn ghost sm lb-cancel-btn" onClick={() => setCancelTarget(b)}>
                              <Icon name="unlock" size={13} /> ยกเลิกการห้ามกู้
                            </button>
                          ) : (
                            <span className="muted" style={{ fontSize: 11 }}>
                              ปลดล็อกแล้ว<br />
                              <span className="mono">{b.cancelTs || ''}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </div>
        </>
      ) : (
        <div className="search-card gc-placeholder" style={{ marginTop: 12 }}>
          <div className="gc-ph-ico"><Icon name="lock" size={26} /></div>
          <div className="gc-ph-title">ยังไม่ได้เลือกสมาชิก</div>
          <div className="gc-ph-sub">
            ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อเพิ่มข้อมูลเหตุผลในการห้ามกู้
          </div>
          <button className="btn primary" onClick={() => setModal(true)}>
            <Icon name="search" /> ค้นหาเลขสมาชิก
          </button>
          <div className="gc-ph-hint muted">
            ตัวอย่างสำหรับสาธิต — เลือกได้จาก{' '}
            {window.GUAR_MEMBERS.map((m, i) => (
              <React.Fragment key={m.code}>
                {i > 0 && ', '}
                <button className="ct-example mono" onClick={() => pick(m)}>{m.code}</button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {modalOpen && <LbMemberSearchModal onPick={pick} onClose={() => setModal(false)} />}
      {cancelTarget && (
        <LbCancelModal rec={cancelTarget} member={member}
                       onClose={() => setCancelTarget(null)}
                       onConfirm={confirmCancel} />
      )}
    </div>
  );
}

// ─── โมดัลยกเลิกการห้ามกู้ — ต้องระบุเหตุผลการกู้ต่อ ─────────────────
function LbCancelModal({ rec, member, onClose, onConfirm }) {
  const [resumeReason, setResume] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!resumeReason.trim()) { setError('กรุณาระบุเหตุผลการกู้ต่อ'); return; }
    onConfirm({ rec, resumeReason: resumeReason.trim() });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="unlock" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยกเลิกการห้ามกู้</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {member.code} · {member.name}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lb-cancel-info">
            <div className="lb-ci-row">
              <span className="lb-ci-k">เลขที่เอกสาร</span>
              <span className="mono">{rec.docNo}</span>
            </div>
            <div className="lb-ci-row">
              <span className="lb-ci-k">ประเภทเงินกู้</span>
              {lbLoanTypePill(rec.loanType)}
            </div>
            <div className="lb-ci-row">
              <span className="lb-ci-k">เหตุผลการห้ามกู้</span>
              <span style={{ textAlign: 'right' }}>{rec.banReason}</span>
            </div>
          </div>

          <form onSubmit={submit} style={{ marginTop: 14 }}>
            <label className="lb-label">เหตุผลการกู้ต่อ <span className="cfg-required">*</span></label>
            <textarea className="cfg-input" rows={3} autoFocus
                      placeholder="ระบุเงื่อนไข / เหตุผลที่อนุญาตให้สมาชิกกลับมากู้ได้…"
                      value={resumeReason}
                      onChange={(e) => { setResume(e.target.value); setError(''); }} />
            {error && <div className="dep-error" style={{ marginTop: 8 }}><Icon name="info" size={13} /> {error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                ยกเลิก
              </button>
              <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
                <Icon name="check" /> ยืนยันการกู้ต่อ
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { LoanBanPage });
