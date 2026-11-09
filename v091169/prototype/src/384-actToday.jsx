// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ยกเลิกทำรายการ
//  ค้นหาสมาชิก → แสดงใบทำรายการรับชำระลูกหนี้ตัวแทนของสมาชิก →
//  เลือกรายการ + ระบุสาเหตุการยกเลิกต่อรายการ →
//  ยืนยันด้วยรหัสผู้มีสิทธิ์ก่อนทำการยกเลิก (กลับรายการ)
// ════════════════════════════════════════════════════════════════════
const { useState: actUseState, useMemo: actUseMemo } = React;

const actToday = () => window.DEPOSIT_WORKING_DATE || '2026-07-21';
const actThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};

// ─── ผู้ทำรายการ (demo) / คำอธิบายรายการ ────────────────────────────
const ACT_OPERATORS = ['SIRIRAT.S', 'WISUT.J', 'NAREE.K', 'PRAYUT.M', 'KANOK.T'];
const ACT_DESCS = [
  { code: 'REC', desc: 'ยอดชำระลูกหนี้ตัวแทน' },
  { code: 'REC', desc: 'รับชำระหนี้เงินกู้ผ่านตัวแทน' },
  { code: 'RCS', desc: 'รับชำระค่าหุ้นผ่านตัวแทน' },
  { code: 'RCD', desc: 'รับฝากเงินผ่านตัวแทน' },
];

// LCG อย่างง่าย — สร้างข้อมูลสาธิตแบบ deterministic ต่อรหัสสมาชิก
function actRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ─── ใบทำรายการรับชำระลูกหนี้ตัวแทนของสมาชิก (demo) ──────────────────
function actTxnsOf(m) {
  if (!m) return [];
  const digits = String(m.code).replace(/\D/g, '');
  const seed = digits.split('').reduce((a, c) => a + Number(c) * 7, 13) + digits.length * 31;
  const rnd = actRng(seed || 99);
  const n = 2 + Math.floor(rnd() * 3);              // 2–4 รายการ
  const be = 66;                                    // ปี พ.ศ. ย่อ (2566–2567)
  const rows = [];
  for (let i = 0; i < n; i++) {
    const d = ACT_DESCS[Math.floor(rnd() * ACT_DESCS.length)];
    const yy = be + (rnd() < 0.4 ? 1 : 0);
    const mm = String(1 + Math.floor(rnd() * 12)).padStart(2, '0');
    const dd = String(1 + Math.floor(rnd() * 27)).padStart(2, '0');
    const iso = `25${yy}-${mm}-${dd}`;
    const amount = Math.round((15000 + rnd() * 260000) * 100) / 100;
    // รายการล่าสุด (i===0) ยกเลิกได้เสมอ; รายการเก่าบางส่วนถูกล็อก (ปิดงวดแล้ว)
    const cancellable = i === 0 || rnd() > 0.35;
    rows.push({
      seq: i + 1,
      slip: `AS${yy}${String(80000 + Math.floor(rnd() * 9999)).padStart(5, '0')}`,
      date: iso,
      code: d.code,
      desc: d.desc,
      amount,
      by: ACT_OPERATORS[Math.floor(rnd() * ACT_OPERATORS.length)],
      cancellable,
      cancelled: false,
    });
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1)).map((r, i) => ({ ...r, seq: i + 1 }));
}

function AgentCancelTxnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ยกเลิกทำรายการ', current: true }], []);

  const reasons = actUseMemo(() => (window.agentCancelReasonLoad ? window.agentCancelReasonLoad() : []), []);
  const demoMembers = actUseMemo(() => (window.DN_MEMBERS || []).slice(0, 3), []);

  const [member, setMember]   = actUseState(null);
  const [txnDate, setTxnDate] = actUseState(actToday());
  const [txns, setTxns]       = actUseState([]);         // ใบทำรายการของสมาชิกที่เลือก
  const [selected, setSel]    = actUseState({});         // slip -> reasonCode
  const [confirmOpen, setConfirm] = actUseState(false);

  const pickMember = (m) => {
    setMember(m);
    setTxns(actTxnsOf(m));
    setSel({});
  };

  const selectableSlips = txns.filter(t => t.cancellable && !t.cancelled).map(t => t.slip);
  const selectedSlips = Object.keys(selected);
  const allSelected = selectableSlips.length > 0 && selectableSlips.every(s => selected[s] !== undefined);

  const toggleSel = (slip) => setSel(prev => {
    const next = { ...prev };
    if (next[slip] !== undefined) delete next[slip];
    else next[slip] = (reasons[0] && reasons[0].code) || '';
    return next;
  });
  const toggleAll = () => setSel(() => {
    if (allSelected) return {};
    const next = {};
    selectableSlips.forEach(s => { next[s] = (reasons[0] && reasons[0].code) || ''; });
    return next;
  });
  const setReason = (slip, code) => setSel(prev => ({ ...prev, [slip]: code }));

  const selectedTxns = txns.filter(t => selected[t.slip] !== undefined);
  const totalAmount = selectedTxns.reduce((a, t) => a + t.amount, 0);
  const missingReason = selectedTxns.some(t => !selected[t.slip]);

  const reasonLabel = (code) => {
    const r = reasons.find(x => x.code === code);
    return r ? `${r.code} — ${r.desc}` : (code || '—');
  };

  // ── ดำเนินการยกเลิกหลังยืนยันรหัสผู้มีสิทธิ์ ──────────────────────
  const performCancel = ({ authorizer }) => {
    setTxns(prev => prev.map(t =>
      selected[t.slip] !== undefined
        ? { ...t, cancelled: true, cancelReason: selected[t.slip],
            cancelInfo: { by: authorizer.name, ts: new Date().toISOString().slice(0, 19) } }
        : t));

    selectedTxns.forEach(t => {
      audit.log && audit.log({
        action: 'delete', module: 'ลูกหนี้ตัวแทน — ยกเลิกทำรายการ',
        target: `${member.code} · ${window.msFullName(member)}`,
        summary: `ยกเลิกใบทำรายการลูกหนี้ตัวแทน ${t.slip} — ${t.desc}`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่ใบทำรายการ', before: t.slip, after: 'ยกเลิกแล้ว' },
          { field: 'จำนวนเงิน', before: window.fmt.money(t.amount, 2), after: '— (กลับรายการ)' },
          { field: 'สาเหตุการยกเลิก', before: '—', after: reasonLabel(selected[t.slip]) },
          { field: 'อนุมัติโดย', before: '—', after: `${authorizer.name} (${authorizer.role})` },
        ],
      });
    });

    const n = selectedTxns.length;
    onToast && onToast(`ยกเลิกใบทำรายการเรียบร้อย ${n} รายการ · อนุมัติโดย ${authorizer.name}`);
    setSel({});
    setConfirm(false);
  };

  return (
    <div data-screen-label="หน้ายกเลิกทำรายการลูกหนี้ตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกทำรายการ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิก แล้วเลือกใบทำรายการรับชำระลูกหนี้ตัวแทนที่ต้องการยกเลิก — ระบุสาเหตุและยืนยันด้วยรหัสผู้มีสิทธิ์
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำรายการ</span>
          <span className="ct-workdate-value mono">{actThaiDate(txnDate)}</span>
        </div>
      </div>

      {/* ── การ์ดค้นหาสมาชิก + วันที่ทำรายการ ── */}
      <div className="search-card">
        <div className="ap-form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <label className="ap-field">
            <span className="ap-label">เลขสมาชิก <b className="req">*</b> <span className="muted" style={{ fontWeight: 400 }}>(คลิกเพื่อค้นหา)</span></span>
            <MemberSearchField member={member} onPick={pickMember}
              source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
              title="ค้นหาสมาชิก — ยกเลิกทำรายการลูกหนี้ตัวแทน"
              placeholder="คลิกเพื่อค้นหาเลขสมาชิก / ชื่อสมาชิก…" />
          </label>
          <label className="ap-field">
            <span className="ap-label">วันที่ทำรายการ</span>
            <ErpDate value={txnDate} onChange={(v) => (e => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </label>
        </div>

        {member && (
          <div className="ap-form-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: 12 }}>
            <label className="ap-field">
              <span className="ap-label">ชื่อ – สกุล</span>
              <input className="cfg-input" readOnly tabIndex={-1} value={window.msFullName(member)}
                style={{ background: 'var(--surface-muted)' }} />
            </label>
            <label className="ap-field">
              <span className="ap-label">สังกัด</span>
              <input className="cfg-input mono" readOnly tabIndex={-1}
                value={`${member.deptCode || ''} — ${member.dept || ''}`}
                style={{ background: 'var(--surface-muted)' }} />
            </label>
          </div>
        )}

        {!member && (
          <div className="ap-hint muted" style={{ marginTop: 4 }}>
            <Icon name="info" size={13} /> ตัวอย่างสำหรับสาธิต — เลือกได้จาก{' '}
            {demoMembers.map((m, i) => (
              <React.Fragment key={m.code}>
                {i > 0 && ', '}
                <button className="ct-example mono" onClick={() => pickMember(m)}>{m.code}</button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── สถานะเริ่มต้น (ยังไม่เลือกสมาชิก) ── */}
      {!member && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="member" size={26} /></div>
            ค้นหาและเลือกสมาชิกเพื่อแสดงใบทำรายการรับชำระลูกหนี้ตัวแทน
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              คลิกช่อง “เลขสมาชิก” ด้านบนเพื่อเริ่มค้นหา
            </div>
          </div>
        </div>
      )}

      {/* ── ตารางใบทำรายการของสมาชิก ── */}
      {member && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="ct-acct-strip">
            <div className="ct-acct-ico"><Icon name="member" /></div>
            <div style={{ minWidth: 0 }}>
              <div className="ct-acct-no">{window.msFullName(member)}</div>
              <div className="ct-acct-sub">
                <span className="pill info mono">{member.code}</span>
                <span className="ct-acct-member">{member.deptCode} · {member.dept}</span>
              </div>
            </div>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn sm" onClick={() => { setMember(null); setTxns([]); setSel({}); }}>
              <Icon name="close" /> ล้าง
            </button>
          </div>

          <div className="section" style={{ marginTop: 14 }}>
            <div className="section-head">
              <span className="head-bar" />
              <h3>ใบทำรายการรับชำระลูกหนี้ตัวแทน</h3>
              <span className="muted" style={{ fontSize: 11 }}>
                เลือกรายการที่ต้องการยกเลิก แล้วระบุสาเหตุการยกเลิกในแต่ละรายการ
              </span>
            </div>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ct-tbl" style={{ minWidth: 1080 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 40 }}>
                      <input type="checkbox" className="ct-check" checked={allSelected}
                        disabled={selectableSlips.length === 0} onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                    </th>
                    <th className="center" style={{ width: 52 }}>ลำดับ</th>
                    <th style={{ minWidth: 220 }}>สาเหตุยกเลิก</th>
                    <th style={{ width: 130 }}>เลขที่ใบทำรายการ</th>
                    <th className="center" style={{ width: 100 }}>วันที่ทำรายการ</th>
                    <th className="center" style={{ width: 60 }}>รหัส</th>
                    <th style={{ minWidth: 200 }}>รายละเอียดการทำรายการ</th>
                    <th className="num" style={{ width: 130 }}>จำนวนเงิน</th>
                    <th style={{ width: 110 }}>ผู้ทำรายการ</th>
                    <th className="center" style={{ width: 96 }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map(t => {
                    const sel = selected[t.slip] !== undefined;
                    const canPick = t.cancellable && !t.cancelled;
                    return (
                      <tr key={t.slip} className={(t.cancelled ? 'cancelled ' : '') + (sel ? 'sel' : '')}>
                        <td className="center">
                          {canPick ? (
                            <input type="checkbox" className="ct-check" checked={sel}
                              onChange={() => toggleSel(t.slip)} aria-label={`เลือก ${t.slip}`} />
                          ) : (
                            <span className="ct-lockcell" title={t.cancelled ? 'ยกเลิกแล้ว' : 'ยกเลิกไม่ได้ (ปิดงวดแล้ว)'}>
                              <Icon name="lock" size={12} />
                            </span>
                          )}
                        </td>
                        <td className="center muted mono">{t.seq}</td>
                        <td>
                          {t.cancelled ? (
                            <span style={{ fontSize: 12 }}>{reasonLabel(t.cancelReason)}</span>
                          ) : sel ? (
                            <select className="cfg-input" style={{ height: 30, fontSize: 12 }}
                              value={selected[t.slip]} onChange={e => setReason(t.slip, e.target.value)}>
                              <option value="">— เลือกสาเหตุ —</option>
                              {reasons.map(r => <option key={r.code} value={r.code}>{r.code} — {r.desc}</option>)}
                            </select>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td className="mono">{t.slip}</td>
                        <td className="center mono">{actThaiDate(t.date)}</td>
                        <td className="center mono">{t.code}</td>
                        <td>{t.desc}</td>
                        <td className="num mono" style={{ fontWeight: 600,
                          color: t.cancelled ? 'var(--text-faint)' : 'var(--text)' }}>
                          {window.fmt.money(t.amount, 2)}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>{t.by}</td>
                        <td className="center">
                          {t.cancelled
                            ? <span className="pill bad">ยกเลิกแล้ว</span>
                            : t.cancellable
                              ? <span className="pill ok">ยกเลิกได้</span>
                              : <span className="pill neutral">ปิดงวด</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {txns.length === 0 && (
                    <tr><td colSpan="10" className="center muted" style={{ padding: 28 }}>ไม่พบใบทำรายการของสมาชิกรายนี้</td></tr>
                  )}
                </tbody>
              </table>
            </div></div>
          </div>

          {/* action bar */}
          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>
              {selectedTxns.length > 0
                ? <>เลือก <b style={{ color: 'var(--text)' }}>{selectedTxns.length}</b> รายการ · รวม{' '}
                    <b className="mono" style={{ color: 'var(--text)' }}>฿ {window.fmt.money(totalAmount, 2)}</b>
                    {missingReason && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>· ยังมีรายการที่ยังไม่ได้ระบุสาเหตุ</span>}</>
                : 'ยังไม่ได้เลือกรายการที่จะยกเลิก'}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn danger" disabled={selectedTxns.length === 0 || missingReason} onClick={() => setConfirm(true)}>
              <Icon name="close" /> ยกเลิกรายการที่เลือก{selectedTxns.length > 0 ? ` (${selectedTxns.length})` : ''}
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <AgentConfirmCancelModal
          member={member} txns={selectedTxns} reasonLabel={reasonLabel}
          reasonOf={(slip) => selected[slip]}
          onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ── โมดัลยืนยันการยกเลิก — ใส่รหัสผู้มีสิทธิ์ ────────────────────────
function AgentConfirmCancelModal({ member, txns, reasonLabel, reasonOf, onClose, onConfirm }) {
  const [code, setCode]   = actUseState('');
  const [error, setError] = actUseState('');
  const [busy, setBusy]   = actUseState(false);
  const total = txns.reduce((a, t) => a + t.amount, 0);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณากรอกรหัสผู้มีสิทธิ์ยกเลิก'); return; }
    setBusy(true); setError('');
    setTimeout(() => {
      const authorizer = (window.CANCEL_AUTHORIZERS || []).find(a => a.code === code.trim());
      if (!authorizer) { setBusy(false); setError('รหัสผู้มีสิทธิ์ไม่ถูกต้อง หรือไม่มีสิทธิ์อนุมัติการยกเลิก'); return; }
      setBusy(false);
      onConfirm({ authorizer });
    }, 400);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการยกเลิกทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              สมาชิก <span className="mono">{member.code}</span> · {window.msFullName(member)}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะกลับรายการรับชำระลูกหนี้ตัวแทนและปรับยอดที่เกี่ยวข้องทันที การกระทำนี้จะถูกบันทึกใน Audit Log และไม่สามารถย้อนกลับได้</span>
          </div>

          <div className="ct-confirm-list">
            {txns.map(t => (
              <div className="ct-confirm-row" key={t.slip}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{t.slip}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{t.desc} · {reasonLabel(reasonOf(t.slip))}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>฿ {window.fmt.money(t.amount, 2)}</div>
              </div>
            ))}
            <div className="ct-confirm-total">
              <span>รวม {txns.length} รายการ</span>
              <span className="mono">฿ {window.fmt.money(total, 2)}</span>
            </div>
          </div>

          <form className="dep-form" onSubmit={submit}>
            <label className="lb-label">รหัสผู้มีสิทธิ์ยกเลิก <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div className="dep-input">
              <Icon name="lock" size={14} />
              <input type="password" value={code} autoComplete="off" inputMode="numeric"
                placeholder="รหัสยืนยันของผู้มีสิทธิ์"
                onChange={e => { setCode(e.target.value); setError(''); }} autoFocus />
            </div>

            {error && <div className="dep-error"><Icon name="info" size={13} /> {error}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
              <button type="submit" className="btn danger" style={{ flex: 1, justifyContent: 'center' }} disabled={busy}>
                {busy ? 'กำลังตรวจสอบสิทธิ์...' : <><Icon name="check" /> ยืนยันการยกเลิก</>}
              </button>
            </div>
          </form>

          <div className="dep-hint">
            <Icon name="shield" size={13} />
            <span>ตัวอย่างสำหรับสาธิต — รหัสผู้มีสิทธิ์: <b className="mono">491205</b> (อภิชาติ ศรีสุข) หรือ <b className="mono">770318</b> (ประเสริฐ วัฒนชัย)</span>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { AgentCancelTxnPage });
