// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › ยกเลิกสลิปจ่ายจากระบบอื่น
//  เลือกสมาชิก → แสดงสลิปจ่ายเงินที่มีต้นทางจากระบบงานอื่น (สวัสดิการ /
//  ทุนการศึกษา / เงินสงเคราะห์ / เงินกู้ / คืนค่าหุ้น ฯลฯ) ของสมาชิก →
//  เลือกสลิป + ระบุสาเหตุ → ยืนยันด้วยรหัสผู้มีสิทธิ์ก่อนทำการยกเลิก
// ════════════════════════════════════════════════════════════════════
const { useState: cpsUseState, useMemo: cpsUseMemo } = React;

const cpsToday = () => window.DEPOSIT_WORKING_DATE || '2026-06-02';
const cpsThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};

// ─── รายการจ่ายที่มีต้นทางจากระบบอื่น (demo) ────────────────────────
const CPS_OPERATORS = ['สุนิสา ทองแท้', 'วิสุทธิ์ เจริญพร', 'นารี กมล', 'ประยุทธ มานะ'];
const CPS_METHODS = [
  { v: 'cash',     l: 'เงินสด' },
  { v: 'cheque',   l: 'เช็ค' },
  { v: 'transfer', l: 'เงินโอน' },
];
const CPS_SOURCES = [
  { sys: 'สวัสดิการ',    item: 'จ่ายเงินสวัสดิการสมาชิก',        pre: 'WF' },
  { sys: 'ทุนการศึกษา',  item: 'จ่ายทุนการศึกษาบุตรสมาชิก',      pre: 'SC' },
  { sys: 'เงินสงเคราะห์', item: 'จ่ายเงินสงเคราะห์สมาชิก',        pre: 'RF' },
  { sys: 'เงินกู้',      item: 'จ่ายเงินกู้สามัญ',              pre: 'LN' },
  { sys: 'หุ้น',        item: 'จ่ายคืนค่าหุ้น',                pre: 'SH' },
  { sys: 'ฌาปนกิจ',     item: 'จ่ายเงินฌาปนกิจสงเคราะห์',       pre: 'FN' },
];
const cpsMethodLabel = (v) => (CPS_METHODS.find(m => m.v === v) || {}).l || v;

function cpsRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ─── สลิปจ่ายจากระบบอื่นของสมาชิก (demo, deterministic) ─────────────
function cpsSlipsOf(m, payDate) {
  if (!m) return [];
  const digits = String(m.code).replace(/\D/g, '');
  const seed = digits.split('').reduce((a, c) => a + Number(c) * 7, 23) + digits.length * 41;
  const rnd = cpsRng(seed || 77);
  const be = String(Number(payDate.slice(0, 4)) + 543).slice(2);
  const mm = payDate.slice(5, 7);
  const n = 2 + Math.floor(rnd() * 3);              // 2–4 สลิป
  const rows = [];
  let seq = 4100 + Math.floor(rnd() * 500);
  for (let i = 0; i < n; i++) {
    const src = CPS_SOURCES[Math.floor(rnd() * CPS_SOURCES.length)];
    const method = rnd() < 0.5 ? 'transfer' : (rnd() < 0.6 ? 'cheque' : 'cash');
    const amount = Math.round((3000 + rnd() * 195000) * 100) / 100;
    seq += 1 + Math.floor(rnd() * 20);
    rows.push({
      reqNo: `${src.pre}${be}${mm}-${String(seq).padStart(5, '0')}`,   // เลขที่คำขอต้นทาง
      slip: `PV${be}${mm}-${String(52000 + seq).padStart(5, '0')}`,     // เลขที่สลิปจ่ายการเงิน
      sys: src.sys,
      item: src.item,
      method,
      amount,
      by: CPS_OPERATORS[Math.floor(rnd() * CPS_OPERATORS.length)],
      cancellable: rnd() > 0.2,                       // ส่วนใหญ่ยกเลิกได้
      cancelled: false,
    });
  }
  return rows;
}

function FinanceCancelOtherSlipPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ยกเลิกสลิปจ่ายจากระบบอื่น', current: true }], []);

  const reasons = window.CANCEL_REASONS || ['บันทึกรายการผิดพลาด'];
  const demoMembers = cpsUseMemo(() => (window.DN_MEMBERS || []).slice(0, 3), []);

  const [member, setMember]   = cpsUseState(null);
  const [payDate, setPayDate] = cpsUseState(cpsToday());
  const [slips, setSlips]     = cpsUseState([]);
  const [selected, setSel]    = cpsUseState({});     // slip -> reasonText
  const [confirmOpen, setConfirm] = cpsUseState(false);

  const pickMember = (m) => {
    setMember(m);
    setSlips(cpsSlipsOf(m, payDate));
    setSel({});
  };

  const selectableSlips = slips.filter(s => s.cancellable && !s.cancelled).map(s => s.slip);
  const allSelected = selectableSlips.length > 0 && selectableSlips.every(s => selected[s] !== undefined);

  const toggleSel = (slip) => setSel(prev => {
    const next = { ...prev };
    if (next[slip] !== undefined) delete next[slip];
    else next[slip] = reasons[0];
    return next;
  });
  const toggleAll = () => setSel(() => {
    if (allSelected) return {};
    const next = {};
    selectableSlips.forEach(s => { next[s] = reasons[0]; });
    return next;
  });
  const setReason = (slip, r) => setSel(prev => ({ ...prev, [slip]: r }));

  const selectedTxns = slips.filter(s => selected[s.slip] !== undefined);
  const totalAmount = selectedTxns.reduce((a, t) => a + t.amount, 0);
  const missingReason = selectedTxns.some(t => !selected[t.slip] || !selected[t.slip].trim());

  const performCancel = ({ authorizer }) => {
    setSlips(prev => prev.map(s =>
      selected[s.slip] !== undefined
        ? { ...s, cancelled: true, cancelReason: selected[s.slip],
            cancelInfo: { by: authorizer.name, ts: new Date().toISOString().slice(0, 19) } }
        : s));

    selectedTxns.forEach(t => {
      audit.log && audit.log({
        action: 'delete', module: 'การเงิน — ยกเลิกสลิปจ่ายจากระบบอื่น',
        target: `${member.code} · ${window.msFullName(member)}`,
        summary: `ยกเลิกสลิปจ่าย ${t.slip} (คำขอ ${t.reqNo}) — ${t.item} · ระบบ${t.sys}`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่สลิปจ่าย', before: t.slip, after: 'ยกเลิกแล้ว' },
          { field: 'เลขที่คำขอต้นทาง', before: t.reqNo, after: `ระบบ${t.sys}` },
          { field: 'วิธีจ่าย', before: cpsMethodLabel(t.method), after: '— (กลับรายการ)' },
          { field: 'จำนวนเงิน', before: window.fmt.money(t.amount, 2), after: '— (กลับรายการ)' },
          { field: 'สาเหตุการยกเลิก', before: '—', after: selected[t.slip] },
          { field: 'อนุมัติโดย', before: '—', after: `${authorizer.name} (${authorizer.role})` },
        ],
      });
    });

    const n = selectedTxns.length;
    onToast && onToast(`ยกเลิกสลิปจ่ายเรียบร้อย ${n} รายการ · อนุมัติโดย ${authorizer.name}`);
    setSel({});
    setConfirm(false);
  };

  return (
    <div data-screen-label="หน้ายกเลิกสลิปจ่ายจากระบบอื่น (การเงิน)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกสลิปจ่ายจากระบบอื่น</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            เลือกสมาชิก แล้วเลือกสลิปจ่ายเงินที่มีต้นทางจากระบบงานอื่นที่ต้องการยกเลิก — ระบุสาเหตุและยืนยันด้วยรหัสผู้มีสิทธิ์
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{cpsThaiDate(cpsToday())}</span>
        </div>
      </div>

      {/* ── การ์ดค้นหาสมาชิก + วันที่จ่าย ── */}
      <div className="search-card">
        <div className="ap-form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <label className="ap-field">
            <span className="ap-label">เลขสมาชิก <b className="req">*</b> <span className="muted" style={{ fontWeight: 400 }}>(คลิกเพื่อค้นหา)</span></span>
            <MemberSearchField member={member} onPick={pickMember}
              source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
              title="ค้นหาสมาชิก — ยกเลิกสลิปจ่ายจากระบบอื่น"
              placeholder="คลิกเพื่อค้นหาเลขสมาชิก / ชื่อสมาชิก…" />
          </label>
          <label className="ap-field">
            <span className="ap-label">วันที่จ่าย</span>
            <ErpDate value={payDate} onChange={(v) => (e => { setPayDate(e.target.value); if (member) { setSlips(cpsSlipsOf(member, e.target.value)); setSel({}); } })({ target: { value: v } })} className="cfg-input" />
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

      {/* ── สถานะเริ่มต้น ── */}
      {!member && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="member" size={26} /></div>
            ค้นหาและเลือกสมาชิกเพื่อแสดงสลิปจ่ายเงินจากระบบอื่น
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              คลิกช่อง “เลขสมาชิก” ด้านบนเพื่อเริ่มค้นหา
            </div>
          </div>
        </div>
      )}

      {/* ── ตารางสลิปจ่ายของสมาชิก ── */}
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
            <button className="btn sm" onClick={() => { setMember(null); setSlips([]); setSel({}); }}>
              <Icon name="close" /> ล้าง
            </button>
          </div>

          <div className="section" style={{ marginTop: 14 }}>
            <div className="section-head">
              <span className="head-bar" />
              <h3>สลิปจ่ายเงินจากระบบอื่น</h3>
              <span className="muted" style={{ fontSize: 11 }}>
                เลือกสลิปที่ต้องการยกเลิก แล้วระบุสาเหตุการยกเลิกในแต่ละรายการ
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
                    <th style={{ minWidth: 210 }}>สาเหตุยกเลิก</th>
                    <th style={{ width: 130 }}>เลขที่คำขอ</th>
                    <th style={{ minWidth: 240 }}>รายการจ่าย</th>
                    <th style={{ minWidth: 250 }}>ข้อมูลการจ่ายเงิน</th>
                    <th className="center" style={{ width: 100 }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map(t => {
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
                        <td>
                          {t.cancelled ? (
                            <span style={{ fontSize: 12 }}>{t.cancelReason}</span>
                          ) : sel ? (
                            <select className="cfg-input" style={{ height: 30, fontSize: 12 }}
                                    value={selected[t.slip]} onChange={e => setReason(t.slip, e.target.value)}>
                              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td className="mono">{t.reqNo}</td>
                        <td>
                          <div>{t.item}</div>
                          <div className="muted" style={{ fontSize: 11 }}>
                            <span className="chip info" style={{ marginRight: 6 }}>ระบบ{t.sys}</span>
                            สลิป <span className="mono">{t.slip}</span>
                          </div>
                        </td>
                        <td>
                          <div className="mono" style={{ fontWeight: 600,
                                color: t.cancelled ? 'var(--text-faint)' : 'var(--danger)' }}>
                            − ฿ {window.fmt.money(t.amount, 2)}
                          </div>
                          <div className="muted" style={{ fontSize: 11 }}>
                            {cpsMethodLabel(t.method)} · {cpsThaiDate(payDate)} · โดย {t.by}
                          </div>
                        </td>
                        <td className="center">
                          {t.cancelled
                            ? <span className="pill bad">ยกเลิกแล้ว</span>
                            : t.cancellable
                              ? <span className="pill ok">จ่ายแล้ว</span>
                              : <span className="pill neutral">ปิดงวด</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {slips.length === 0 && (
                    <tr><td colSpan="6" className="center muted" style={{ padding: 28 }}>ไม่พบสลิปจ่ายจากระบบอื่นของสมาชิกรายนี้ในวันที่จ่ายที่เลือก</td></tr>
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
                : 'ยังไม่ได้เลือกสลิปที่จะยกเลิก'}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn danger" disabled={selectedTxns.length === 0 || missingReason} onClick={() => setConfirm(true)}>
              <Icon name="close" /> ยกเลิกสลิปที่เลือก{selectedTxns.length > 0 ? ` (${selectedTxns.length})` : ''}
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <CpsConfirmCancelModal
          member={member} txns={selectedTxns} reasonOf={(slip) => selected[slip]}
          onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ── โมดัลยืนยันการยกเลิก — ใส่รหัสผู้มีสิทธิ์ ────────────────────────
function CpsConfirmCancelModal({ member, txns, reasonOf, onClose, onConfirm }) {
  const [code, setCode]   = cpsUseState('');
  const [error, setError] = cpsUseState('');
  const [busy, setBusy]   = cpsUseState(false);
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
            <h2>ยืนยันการยกเลิกสลิปจ่าย</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              สมาชิก <span className="mono">{member.code}</span> · {window.msFullName(member)}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะกลับรายการจ่ายเงินและแจ้งกลับไปยังระบบต้นทางทันที การกระทำนี้จะถูกบันทึกใน Audit Log และไม่สามารถย้อนกลับได้</span>
          </div>

          <div className="ct-confirm-list">
            {txns.map(t => (
              <div className="ct-confirm-row" key={t.slip}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{t.slip}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{t.item} · ระบบ{t.sys} · {reasonOf(t.slip)}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600, color: 'var(--danger)' }}>− ฿ {window.fmt.money(t.amount, 2)}</div>
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

Object.assign(window, { FinanceCancelOtherSlipPage });
