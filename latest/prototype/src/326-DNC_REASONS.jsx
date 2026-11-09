// ════════════════════════════════════════════════════════════════════
//  ยกเลิกแจ้งขอให้ชำระหนี้ — ค้นหาสมาชิก → ดึงหนังสือที่เคยออก → เลือกยกเลิก
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  ใช้ทะเบียนหนังสือแจ้งชำระหนี้ร่วม (window.dnLoad / window.dnSaveLS)
//  + DnMemberSearchModal ร่วมกับ แจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════

// เหตุผลการยกเลิก (ผู้ใช้เลือกได้ + ระบุเอง)
const DNC_REASONS = [
  'ชำระหนี้ครบถ้วนแล้ว',
  'ออกหนังสือซ้ำ / ผิดพลาด',
  'ข้อมูลลูกหนี้ไม่ถูกต้อง',
  'ทำสัญญาปรับโครงสร้างหนี้ใหม่',
  'อยู่ระหว่างพักชำระหนี้',
  'อื่น ๆ',
];

// ─── หน้าหลัก ────────────────────────────────────────────────────────
function DebtNoticeCancelPage({ onToast }) {
  const MemberSearchEmptyState = window.MemberSearchEmptyState;
  const DnField = window.DnField;
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const useBreadcrumb = window.useBreadcrumb;

  const [list, setList] = useState(window.dnLoad);
  const [member, setMember] = useState(null);
  const [sel, setSel] = useState(() => new Set());
  const [reason, setReason] = useState('');
  const [reasonOther, setReasonOther] = useState('');
  const [note, setNote] = useState('');

  useBreadcrumb && useBreadcrumb(
    [{ label: 'ยกเลิกแจ้งขอให้ชำระหนี้', current: true }], []);

  const persist = (next) => { setList(next); window.dnSaveLS(next); };

  // สมาชิกตัวอย่าง (เฉพาะรายที่เคยมีหนังสือแจ้ง) สำหรับปุ่มสาธิต
  const demoMembers = useMemo(() => {
    const codes = [...new Set(list.map(r => r.memberCode))];
    return codes.map(c => window.dnMember(c)).filter(Boolean).slice(0, 3);
  }, [list]);

  // หนังสือทั้งหมดที่เคยออกให้สมาชิกรายนี้
  const notices = useMemo(() => {
    if (!member) return [];
    return list
      .filter(r => r.memberCode === member.code)
      .sort((a, b) => (b.regDate || '').localeCompare(a.regDate) || (b.id || '').localeCompare(a.id));
  }, [list, member]);

  const activeNotices = notices.filter(r => r.status !== 'cancelled');
  const cancelledNotices = notices.filter(r => r.status === 'cancelled');

  const pickMember = (m) => {
    setMember(m);
    setSel(new Set()); setReason(''); setReasonOther(''); setNote('');
  };
  const resetMember = () => {
    setMember(null); setSel(new Set()); setReason(''); setReasonOther(''); setNote('');
  };

  const toggle = (id) => setSel(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const allSelectable = activeNotices.filter(r => r.status !== 'closed').map(r => r.id);
  const toggleAll = () => setSel(p =>
    p.size === allSelectable.length && allSelectable.length > 0 ? new Set() : new Set(allSelectable));

  const reasonText = reason === 'อื่น ๆ' ? reasonOther.trim() : reason;
  const canSubmit = sel.size > 0 && !!reasonText;

  const submit = () => {
    if (!canSubmit) return;
    const today = window.dnToday();
    const targets = notices.filter(r => sel.has(r.id));
    const next = list.map(r => sel.has(r.id)
      ? { ...r, status: 'cancelled', cancelDate: today, cancelReason: reasonText,
          cancelNote: note.trim(), cancelledBy: window.DN_USER || 'จันทร์เพ็ญ มาลี' }
      : r);
    persist(next);
    audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — แจ้งให้ชำระหนี้',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกหนังสือแจ้งขอให้ชำระหนี้ ${targets.length} รายการ (${targets.map(t => t.id).join(', ')}) — เหตุผล: ${reasonText}`,
      changes: targets.map(t => ({ field: `สถานะ ${t.id}`, before: window.dnStatus(t.status).l, after: 'ยกเลิกหนังสือ' })),
    });
    onToast && onToast(`ยกเลิกหนังสือแจ้งให้ชำระหนี้ ${targets.length} รายการเรียบร้อยแล้ว`);
    setSel(new Set()); setReason(''); setReasonOther(''); setNote('');
  };

  const today = window.dnToday();
  const totalSel = notices.filter(r => sel.has(r.id)).reduce((s, r) => s + (Number(r.totalOutstanding) || 0), 0);

  return (
    <div data-screen-label="หน้ายกเลิกแจ้งขอให้ชำระหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกแจ้งขอให้ชำระหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิกจากเลขทะเบียน · ระบบดึงหนังสือแจ้งให้ชำระหนี้ที่เคยออกทั้งหมด — เลือกรายการที่ต้องการยกเลิกและจัดเก็บสถานะ
          </div>
        </div>
      </div>

      {/* ── ค้นหาสมาชิก ── */}
      {!member ? (
        <MemberSearchEmptyState
          icon="member"
          title="ยังไม่ได้เลือกสมาชิก"
          description="ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อแสดงหนังสือแจ้งให้ชำระหนี้ที่เคยออก"
          buttonLabel="ค้นหาเลขสมาชิก"
          source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
          examples={demoMembers} modalTitle="ค้นหาสมาชิกลูกหนี้"
          onPick={pickMember} />
      ) : (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สมาชิกลูกหนี้</h3></div>
          <div className="dnc-member">
            <span className="row-avatar lg">{(member.firstName || member.name).slice(0, 1)}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{member.name}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                <span className="mono">{member.code}</span> · {member.dept} · เลขบัตร <span className="mono">{member.citizenId}</span>
              </div>
            </div>
            <span className={'pill ' + (window.DN_MEMBER_STATUS[member.status]?.pill || 'neutral')}>{member.status}</span>
            <button className="btn sm" onClick={resetMember}><Icon name="refresh" size={13} /> เปลี่ยนสมาชิก</button>
          </div>
        </div>
      )}

      {/* ── หนังสือที่เคยออก ── */}
      {member && (
        <>
          <div className="search-stats" style={{ marginBottom: 12, gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">หนังสือที่เคยออกทั้งหมด</div>
              <div className="stat-value">{fmt.int(notices.length)}</div>
              <div className="stat-sub">รายการ</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">ยกเลิกได้</div>
              <div className="stat-value">{fmt.int(activeNotices.length)}</div>
              <div className="stat-sub">ยังไม่ถูกยกเลิก</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">ยกเลิกไปแล้ว</div>
              <div className="stat-value">{fmt.int(cancelledNotices.length)}</div>
              <div className="stat-sub" style={{ color: 'var(--danger)' }}>รายการ</div>
            </div>
          </div>

          <div className="search-card" style={{ marginBottom: 12 }}>
            <div className="section-head" style={{ marginBottom: 12 }}>
              <span className="head-bar" /><h3>หนังสือแจ้งให้ชำระหนี้ที่เคยออก</h3>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 12 }}>เลือกแล้ว <b style={{ color: 'var(--text)' }}>{sel.size}</b> / {allSelectable.length} รายการ</span>
            </div>

            {notices.length === 0 ? (
              <div className="empty-state">
                <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                สมาชิกรายนี้ยังไม่เคยมีหนังสือแจ้งให้ชำระหนี้
              </div>
            ) : (
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="center" style={{ width: 40 }}>
                        <input type="checkbox" checked={allSelectable.length > 0 && sel.size === allSelectable.length}
                               onChange={toggleAll} disabled={allSelectable.length === 0} aria-label="เลือกทั้งหมด" />
                      </th>
                      <th>ทะเบียนติดตาม</th>
                      <th>เลขที่หนังสือ</th>
                      <th className="center">ครั้งที่</th>
                      <th className="center">วันที่ออก</th>
                      <th>สาเหตุ</th>
                      <th className="num">หนี้คงค้าง</th>
                      <th className="center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notices.map(r => {
                      const st = window.dnStatus(r.status);
                      const c = window.dnCause(r.causeCode) || {};
                      const causeTxt = r.causeCode === 'C99' ? (r.causeOther || c.label) : c.label;
                      const cancelled = r.status === 'cancelled';
                      const locked = cancelled || r.status === 'closed';
                      const checked = sel.has(r.id);
                      return (
                        <tr key={r.id} className={locked ? 'is-disabled' : 'clickable'}
                            onClick={() => !locked && toggle(r.id)}
                            style={cancelled ? { opacity: .6 } : null}>
                          <td className="center" onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={checked} disabled={locked}
                                   onChange={() => toggle(r.id)} aria-label={'เลือก ' + r.id} />
                          </td>
                          <td className="mono">{r.id}</td>
                          <td className="mono" style={{ fontSize: 11 }}>{r.seizeNo}</td>
                          <td className="center">{r.round}</td>
                          <td className="center mono">{fmt.date(r.regDate)}</td>
                          <td style={{ fontSize: 12 }}>{causeTxt}</td>
                          <td className="num"><b>{fmt.money(r.totalOutstanding, 2)}</b></td>
                          <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div></div>
            )}
            <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
              <Icon name="info" size={11} /> รายการที่ปิดแล้ว (ชำระครบ) หรือยกเลิกไปแล้ว จะไม่สามารถเลือกยกเลิกซ้ำได้
            </p>
          </div>

          {/* ── เหตุผลการยกเลิก + ยืนยัน ── */}
          {activeNotices.length > 0 && (
            <div className="search-card">
              <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เหตุผลการยกเลิก</h3></div>
              <div className="form-grid">
                <DnField label="เหตุผลการยกเลิก" required span={reason === 'อื่น ๆ' ? 1 : 2}>
                  <select className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option value="">— เลือกเหตุผล —</option>
                    {DNC_REASONS.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </DnField>
                {reason === 'อื่น ๆ' && (
                  <DnField label="ระบุเหตุผล" required>
                    <input className="cfg-input" value={reasonOther} onChange={(e) => setReasonOther(e.target.value)}
                           placeholder="ระบุเหตุผลการยกเลิก" />
                  </DnField>
                )}
                <DnField label="หมายเหตุเพิ่มเติม" full>
                  <textarea className="cfg-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="รายละเอียดประกอบ (ถ้ามี)" style={{ resize: 'vertical' }} />
                </DnField>
              </div>

              <div className="dnc-confirm">
                <div className="muted" style={{ fontSize: 13 }}>
                  จะยกเลิกหนังสือ <b style={{ color: 'var(--text)' }}>{sel.size}</b> รายการ
                  {sel.size > 0 && <> · รวมหนี้คงค้าง <b style={{ color: 'var(--danger)' }}>฿ {fmt.money(totalSel, 2)}</b></>}
                </div>
                <span className="spacer" />
                <button className="btn danger" disabled={!canSubmit} onClick={submit}>
                  <Icon name="close" size={14} /> ยืนยันการยกเลิก
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}

Object.assign(window, { DebtNoticeCancelPage });
