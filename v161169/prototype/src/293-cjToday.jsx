// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › บันทึกบัญชี — ยกเลิกรายการรายวัน
//  อ้างอิงการทำงานจากหน้าจอ "ลงรายวัน" (DailyJournalWorkspace):
//  เลือกประจำวันที่ → ดึงข้อมูล Voucher ของวัน → เลือกรายการที่จะยกเลิก
//  → ยืนยันด้วยเหตุผล + รหัสผู้มีสิทธิ์ → กลับรายการ (สถานะ = ยกเลิกแล้ว)
//  • ยกเลิกได้เฉพาะรายการที่ยังไม่ผ่านบัญชี (ร่าง / รออนุมัติ)
//  • รายการที่ผ่านรายการแล้วต้องใช้การกลับรายการที่เมนูผ่านรายการฯ
// ════════════════════════════════════════════════════════════════════
const { useState: cjUseState, useMemo: cjUseMemo, useEffect: cjUseEffect } = React;

const cjToday = () => '2026-06-13';
const cjMoney = (n) => window.fmt.money(Number(n || 0), 2);

// สถานะที่ยกเลิกได้ (ยังไม่ลงบัญชีแยกประเภท)
const cjCancellable = (v) => v.status === 'draft' || v.status === 'pending';

if (!document.getElementById('cj-range-style')) {
  const st = document.createElement('style');
  st.id = 'cj-range-style';
  st.textContent = '[data-screen-label="ยกเลิกรายการรายวัน"] .jv-fetch-field { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }'
    + '[data-screen-label="ยกเลิกรายการรายวัน"] .jv-fetchbar { flex-wrap: wrap; row-gap: 8px; }'
    + '[data-screen-label="ยกเลิกรายการรายวัน"] .jv-fetch-field .thai-date, [data-screen-label="ยกเลิกรายการรายวัน"] .jv-fetch-field .cfg-input { height: 32px; }';
  document.head.appendChild(st);
}

function CancelJournalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = cjUseState(window.jvLoad);
  const [date, setDate] = cjUseState(cjToday);
  const [dateTo, setDateTo] = cjUseState(null);
  const [q, setQ] = cjUseState('');
  const [fetched, setFetched] = cjUseState(false);
  const [fetchBusy, setFetchBusy] = cjUseState(false);
  const [fetchResult, setFetchResult] = cjUseState(null);
  const [sel, setSel] = cjUseState(() => new Set());
  const [confirm, setConfirm] = cjUseState(false);

  const persist = (next) => { setList(next); window.jvSave(next); };

  // Breadcrumb: หน้าหลัก › ยกเลิกรายการรายวัน
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ยกเลิกรายการรายวัน', current: true }], []);

  // Voucher ของวันที่เลือก (แสดงหลังกดดึงข้อมูล)
  const inRange = (d) => {
    const lo = date, hi = dateTo || date;
    return d >= (lo < hi ? lo : hi) && d <= (lo < hi ? hi : lo);
  };

  const dayList = cjUseMemo(
    () => fetched ? list.filter(v => inRange(v.docDate)) : [],
    [list, date, dateTo, fetched]);

  const dayCount = cjUseMemo(() => list.filter(v => inRange(v.docDate)).length, [list, date, dateTo]);

  const filtered = cjUseMemo(() => dayList.filter(v => {
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return v.id.toLowerCase().includes(n) || (v.desc || '').toLowerCase().includes(n) || (v.ref || '').toLowerCase().includes(n);
  }), [dayList, q]);

  const stat = cjUseMemo(() => ({
    total: dayList.length,
    cancellable: dayList.filter(cjCancellable).length,
    posted: dayList.filter(v => v.status === 'posted').length,
    cancelled: dayList.filter(v => v.status === 'cancelled').length,
  }), [dayList]);

  // ── ดึงข้อมูล Voucher ของวัน (mirror หน้าลงรายวัน) ─────────────────
  const fetchDay = () => {
    if (fetchBusy) return;
    const d = date;
    setSel(new Set());
    setFetchBusy(true);
    setTimeout(() => {
      const dl = list.filter(v => inRange(v.docDate));
      setFetchBusy(false);
      setFetched(true);
      setFetchResult({ count: dl.length, date: d });
    }, 850);
  };

  const selectable = filtered.filter(cjCancellable);
  const allSel = selectable.length > 0 && selectable.every(v => sel.has(v.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(selectable.map(v => v.id)));
  const toggleRow = (v) => {
    if (!cjCancellable(v)) return;
    setSel(s => { const n = new Set(s); n.has(v.id) ? n.delete(v.id) : n.add(v.id); return n; });
  };

  const chosen = dayList.filter(v => sel.has(v.id));
  const selTotal = chosen.reduce((a, v) => a + window.jvTotals(v.lines).dr, 0);

  // ── ยืนยันการยกเลิก ───────────────────────────────────────────────
  const performCancel = ({ authorizer, reason }) => {
    const ids = new Set(chosen.map(v => v.id));
    const stamp = new Date().toISOString().slice(0, 19);
    const next = list.map(v => ids.has(v.id)
      ? { ...v, status: 'cancelled', cancelInfo: { by: authorizer.name, role: authorizer.role, reason, ts: stamp } }
      : v);
    persist(next);
    chosen.forEach(v => {
      audit.log && audit.log({
        action: 'cancel', module: 'บัญชี — ยกเลิกรายการรายวัน', target: v.id,
        summary: `ยกเลิกรายการลงรายวัน ${v.id} — ${v.desc || ''}`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่ Voucher', before: v.id, after: 'ยกเลิกแล้ว' },
          { field: 'ประจำวันที่', before: window.fmt.date(v.docDate), after: '—' },
          { field: 'ยอดรายการ (DR)', before: cjMoney(window.jvTotals(v.lines).dr), after: '— (กลับรายการ)' },
          { field: 'เหตุผล', before: '—', after: reason },
          { field: 'อนุมัติโดย', before: '—', after: `${authorizer.name} (${authorizer.role})` },
        ],
      });
    });
    onToast && onToast(`ยกเลิกรายการรายวันเรียบร้อย ${chosen.length} รายการ · อนุมัติโดย ${authorizer.name}`);
    setSel(new Set());
    setConfirm(false);
  };

  const statusPill = (v) => {
    if (v.status === 'cancelled') return <span className="pill bad">ยกเลิกแล้ว</span>;
    const st = window.JV_STATUS[v.status] || { l: v.status, pill: 'neutral' };
    return <span className={"pill " + st.pill}>{st.l}</span>;
  };

  // ── Popup: loading + ผลการดึงข้อมูล (mirror หน้าลงรายวัน) ──────────
  const fetchPopups = (
    <>
      {fetchBusy && (
        <>
          <div className="modal-backdrop" />
          <div className="jv-loading-pop" role="alertdialog" aria-busy="true">
            <div className="jv-spinner" />
            <div className="jv-loading-txt">กำลังดึงข้อมูล Voucher…</div>
            <div className="jv-loading-sub muted">ประจำวันที่ {window.fmt.date(date)}</div>
          </div>
        </>
      )}
      {fetchResult && (
        <>
          <div className="modal-backdrop" onClick={() => setFetchResult(null)} />
          <div className="modal-card jv-result-pop" role="dialog" aria-modal="true">
            <div className={"jv-result-ico " + (fetchResult.count ? 'ok' : 'warn')}>
              <Icon name={fetchResult.count ? 'check' : 'info'} size={26} />
            </div>
            <h3 className="jv-result-title">{fetchResult.count ? 'ดึงข้อมูลสำเร็จ' : 'ไม่พบข้อมูล'}</h3>
            <div className="jv-result-body">
              {fetchResult.count ? (
                <>ดึงข้อมูล Voucher ประจำวันที่ <b>{window.fmt.date(fetchResult.date)}</b> ทั้งหมด <b className="jv-result-count">{fetchResult.count}</b> รายการ — เลือกรายการที่ต้องการยกเลิก</>
              ) : (
                <>ไม่พบ Voucher ประจำวันที่ <b>{window.fmt.date(fetchResult.date)}</b> ที่สามารถยกเลิกได้</>
              )}
            </div>
            <div className="jv-result-foot">
              <button className="btn primary" onClick={() => setFetchResult(null)}>ตกลง</button>
            </div>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="jv-ws" data-screen-label="ยกเลิกรายการรายวัน">
      {/* ── หัวเรื่องหน้า ── */}
      <div className="jv-page-head">
        <div>
          <h1>ยกเลิกรายการรายวัน <span className="jv-page-sub">(กลับรายการลงรายวัน)</span></h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกประจำวันที่ → ดึงข้อมูล Voucher → เลือกรายการที่ต้องการยกเลิก — ต้องยืนยันด้วยรหัสผู้มีสิทธิ์</div>
        </div>
        <span className="spacer" />
        <div className="jv-period"><Icon name="calendar" size={14} /> งวดบัญชี : มิถุนายน 2569 <span className="pill ok" style={{ marginLeft: 4 }}>เปิด</span></div>
      </div>

      {/* ── แถบเลือกวัน + ดึงข้อมูล ── */}
      <div className="search-card jv-fetchbar">
        <div className="jv-fetch-field">
          <label className="jv-fetch-lab">ประจำวันที่ :</label>
          <window.ThaiDateField value={date}
            onChange={(v) => { setDate(v); setFetched(false); setSel(new Set()); }} />
          <span className="muted" style={{ fontSize: 12 }}>ถึง</span>
          <window.ThaiDateField value={dateTo || date}
            onChange={(v) => { setDateTo(v); setFetched(false); setSel(new Set()); }} />
        </div>
        <button className="btn primary" onClick={fetchDay}><Icon name="download" size={13} /> ดึงข้อมูล</button>
        <span className="spacer" />
        <span className="jv-fetch-note"><Icon name="info" size={13} /> ช่วงวันที่เลือกมี Voucher {dayCount} รายการ — กด “ดึงข้อมูล” เพื่อแสดงรายการที่ยกเลิกได้</span>
        <div style={{ flex: '1 1 100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
          background: '#FAFAFA', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginTop: 4 }}>
          <input className="cfg-input" value={q} onChange={e => setQ(e.target.value)}
            placeholder="ค้นหาเลขที่ Voucher / รายละเอียด / เอกสารอ้างอิง…"
            style={{ flex: '1 1 320px', minWidth: 220 }} />
          <button className="btn" disabled={!q} onClick={() => setQ('')}
            style={{ height: 32, flex: '0 0 96px', justifyContent: 'center' }}>รีเซ็ต</button>
        </div>
      </div>

      {/* ── ก่อนดึงข้อมูล ── */}
      {!fetched && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="report" size={26} /></div>
            เลือกประจำวันที่แล้วกด “ดึงข้อมูล” เพื่อแสดงรายการลงรายวัน
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              ระบบจะแสดงเฉพาะ Voucher ของวันที่เลือก — ยกเลิกได้เฉพาะรายการที่ยังไม่ผ่านบัญชี
            </div>
          </div>
        </div>
      )}

      {/* ── หลังดึงข้อมูล ── */}
      {fetched && (
        <>
          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head">
              <span className="head-bar" />
              <h3>รายการ Voucher ประจำวันที่ {window.fmt.date(date)}</h3>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 11 }}>เลือกได้เฉพาะรายการที่ยังไม่ผ่านบัญชี (ร่าง / รออนุมัติ)</span>
            </div>

            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ct-tbl" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 40 }}>
                      <input type="checkbox" className="ct-check" checked={allSel}
                             disabled={selectable.length === 0} onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                    </th>
                    <th style={{ width: 120 }}>เลขที่ Voucher</th>
                    <th className="center" style={{ width: 56 }}>ประเภท</th>
                    <th>รายละเอียด</th>
                    <th style={{ width: 130 }}>ผู้บันทึก</th>
                    <th className="right" style={{ width: 120 }}>ยอดรวม (DR)</th>
                    <th className="center" style={{ width: 110 }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="center muted" style={{ padding: '28px 8px' }}>ไม่พบรายการลงรายวันของวันที่เลือก</td></tr>
                  )}
                  {filtered.map(v => {
                    const can = cjCancellable(v);
                    const s = sel.has(v.id);
                    const amt = window.jvTotals(v.lines).dr;
                    return (
                      <tr key={v.id} className={(v.status === 'cancelled' ? 'cancelled ' : '') + (s ? 'sel' : '')}>
                        <td className="center">
                          {can ? (
                            <input type="checkbox" className="ct-check" checked={s} onChange={() => toggleRow(v)} aria-label={`เลือก ${v.id}`} />
                          ) : (
                            <span className="ct-lockcell" title={v.status === 'cancelled' ? 'ยกเลิกแล้ว' : 'ผ่านบัญชีแล้ว — ยกเลิกไม่ได้'}>
                              <Icon name="lock" size={12} />
                            </span>
                          )}
                        </td>
                        <td className="mono" style={{ fontSize: 11.5 }}>{v.id}</td>
                        <td className="center"><span className="jv-mtag">{v.vtype}</span></td>
                        <td><div className="jv-cell-desc">{v.desc || '—'}</div></td>
                        <td style={{ fontSize: 12 }}>{v.createdBy}</td>
                        <td className="right mono" style={{ fontWeight: 600 }}>{cjMoney(amt)}</td>
                        <td className="center">{statusPill(v)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>

            {/* action bar */}
            <div className="ct-actionbar">
              <Icon name="info" size={13} />
              <span className="muted" style={{ fontSize: 12 }}>
                {sel.size > 0
                  ? <>เลือก <b style={{ color: 'var(--text)' }}>{sel.size}</b> รายการ · รวม{' '}
                      <b className="mono" style={{ color: 'var(--text)' }}>฿ {cjMoney(selTotal)}</b></>
                  : 'ยังไม่ได้เลือกรายการที่จะยกเลิก'}
              </span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn danger" disabled={sel.size === 0} onClick={() => setConfirm(true)}>
                <Icon name="close" /> ยกเลิกรายการที่เลือก{sel.size > 0 ? ` (${sel.size})` : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {confirm && (
        <ConfirmCancelJournalModal
          txns={chosen} date={date}
          onClose={() => setConfirm(false)}
          onConfirm={performCancel} />
      )}

      {fetchPopups}
    </div>
  );
}

// ── โมดัลยืนยันการยกเลิก — เหตุผล + รหัสผู้มีสิทธิ์ ───────────────────
function ConfirmCancelJournalModal({ txns, date, onClose, onConfirm }) {
  const [reason, setReason] = cjUseState(window.CANCEL_REASONS[0]);
  const [customR, setCustomR] = cjUseState('');
  const [code, setCode] = cjUseState('');
  const [error, setError] = cjUseState('');
  const [busy, setBusy] = cjUseState(false);
  const isOther = reason === window.CANCEL_REASONS[window.CANCEL_REASONS.length - 1];
  const total = txns.reduce((a, v) => a + window.jvTotals(v.lines).dr, 0);

  const submit = (e) => {
    e.preventDefault();
    const finalReason = isOther ? customR.trim() : reason;
    if (isOther && !finalReason) { setError('กรุณาระบุเหตุผลการยกเลิก'); return; }
    if (!code.trim()) { setError('กรุณากรอกรหัสผู้มีสิทธิ์ยกเลิก'); return; }
    setBusy(true); setError('');
    setTimeout(() => {
      const authorizer = (window.CANCEL_AUTHORIZERS || []).find(a => a.code === code.trim());
      if (!authorizer) { setBusy(false); setError('รหัสผู้มีสิทธิ์ไม่ถูกต้อง หรือไม่มีสิทธิ์อนุมัติการยกเลิก'); return; }
      setBusy(false);
      onConfirm({ authorizer, reason: finalReason });
    }, 450);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการยกเลิกรายการรายวัน</h2>
            <div className="muted" style={{ fontSize: 11 }}>ประจำวันที่ <span className="mono">{window.fmt.date(date)}</span></div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะกลับรายการลงรายวันและเปลี่ยนสถานะเป็น “ยกเลิกแล้ว” ทันที การกระทำนี้จะถูกบันทึกใน Audit Log และไม่สามารถย้อนกลับได้</span>
          </div>

          <div className="ct-confirm-list">
            {txns.map(v => (
              <div className="ct-confirm-row" key={v.id}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{v.id}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{v.vtype} · {v.desc || '—'}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>฿ {cjMoney(window.jvTotals(v.lines).dr)}</div>
              </div>
            ))}
            <div className="ct-confirm-total">
              <span>รวม {txns.length} รายการ</span>
              <span className="mono">฿ {cjMoney(total)}</span>
            </div>
          </div>

          <form className="dep-form" onSubmit={submit}>
            <label className="lb-label">เหตุผลการยกเลิก <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select className="filter-select" style={{ width: '100%', height: 38 }}
                    value={reason} onChange={e => { setReason(e.target.value); setError(''); }}>
              {window.CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {isOther && (
              <textarea className="cfg-input" rows={2} style={{ marginTop: 8 }}
                        placeholder="ระบุเหตุผลการยกเลิก..."
                        value={customR} onChange={e => { setCustomR(e.target.value); setError(''); }} />
            )}

            <label className="lb-label" style={{ marginTop: 12 }}>
              รหัสผู้มีสิทธิ์ยกเลิก <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div className="dep-input">
              <Icon name="lock" size={14} />
              <input type="password" value={code} autoComplete="off" inputMode="numeric"
                     placeholder="รหัสยืนยันของผู้มีสิทธิ์"
                     onChange={e => { setCode(e.target.value); setError(''); }} />
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

Object.assign(window, { CancelJournalPage });
