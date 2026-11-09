// ════════════════════════════════════════════════════════════════════
//  ยกเลิกใบสั่งคืนค่าหุ้น — หน้าจอทำงาน (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง: ① ข้อมูลสมาชิก ② เงื่อนไขการค้นหา (ช่วงวันที่ + สถานะ)
//             ③ ตารางรายการใบสั่งคืนค่าหุ้น (เลือกเพื่อยกเลิก)
//             ④ เหตุผลการยกเลิก + สรุปข้อมูลการยกเลิก
//  ใช้ icr-* / src-* จาก styles.css · fmt จาก data.js
//  ใช้ฐานสมาชิก + popup ค้นหาสมาชิกร่วมกับ components-share-refund.jsx
// ════════════════════════════════════════════════════════════════════

const srcToday = () => '2026-05-29';

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function SrcFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function SrcRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  โมดัลยืนยันการยกเลิก — แสดงรายการที่เลือก + เหตุผล + รหัสผู้มีสิทธิ์
// ════════════════════════════════════════════════════════════════════
function SrcConfirmModal({ member, orders, reason, onClose, onConfirm }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const total = orders.reduce((a, o) => a + o.amount, 0);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณากรอกรหัสผู้มีสิทธิ์ยกเลิก'); return; }
    setBusy(true); setError('');
    setTimeout(() => {
      const authorizer = (window.CANCEL_AUTHORIZERS || []).find(a => a.code === code.trim());
      if (!authorizer) { setBusy(false); setError('รหัสผู้มีสิทธิ์ไม่ถูกต้อง หรือไม่มีสิทธิ์อนุมัติการยกเลิก'); return; }
      setBusy(false);
      onConfirm({ authorizer });
    }, 420);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการยกเลิกใบสั่งคืนค่าหุ้น</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              สมาชิก <span className="mono">{member.code}</span> · {member.name}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะปรับสถานะรายการเป็น “ยกเลิก” และบันทึกผู้ทำรายการ วันเวลา และเหตุผล ลงใน Audit Log — ไม่สามารถย้อนกลับได้</span>
          </div>

          <div className="ct-confirm-list">
            {orders.map(o => (
              <div className="ct-confirm-row" key={o.payNo}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.payNo}</div>
                  <div className="muted" style={{ fontSize: 11 }}>วันที่จ่าย {fmt.date(o.payDate)} · {o.status}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>฿ {fmt.money(o.amount, 2)}</div>
              </div>
            ))}
            <div className="ct-confirm-total">
              <span>รวม {orders.length} รายการ</span>
              <span className="mono">฿ {fmt.money(total, 2)}</span>
            </div>
          </div>

          <div className="src-confirm-reason">
            <span className="src-confirm-reason-l">เหตุผลการยกเลิก</span>
            <span className="src-confirm-reason-v">{reason}</span>
          </div>

          <form className="dep-form" onSubmit={submit}>
            <label className="lb-label">
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
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                ย้อนกลับ
              </button>
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

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function SrcCancelScreen({ onToast, audit }) {
  const today = srcToday();

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [dateFrom, setDateFrom] = useState('2026-05-01');
  const [dateTo, setDateTo] = useState('2026-05-31');
  const [statusFilter, setStatusFilter] = useState('all');

  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState([]);          // [{...order, selected}]
  const [reason, setReason] = useState('');
  const [confirmOpen, setConfirm] = useState(false);

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loaded = !!member;
  const operator = window.CURRENT_USER || { name: 'เจ้าหน้าที่ทะเบียน', role: '' };

  const pickMember = (m) => {
    setModal(false);
    setMember(m);
    setSearched(false); setOrders([]); setError(''); setSaved(false);
  };

  const clearAll = () => {
    setMember(null); setDateFrom('2026-05-01'); setDateTo('2026-05-31'); setStatusFilter('all');
    setSearched(false); setOrders([]); setReason(''); setError(''); setSaved(false);
  };

  // ── ค้นหารายการใบสั่งคืนค่าหุ้น ──
  const runSearch = () => {
    setSaved(false);
    if (!member) { setError('กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนค้นหารายการ'); return; }
    if (!dateFrom || !dateTo) { setError('กรุณาระบุช่วงวันที่ที่ต้องการค้นหารายการ'); return; }
    if (dateFrom > dateTo) { setError('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'); return; }
    setError('');
    const found = window.srcSearchOrders(member.code, dateFrom, dateTo, statusFilter);
    setOrders(found.map(o => ({ ...o, selected: false })));
    setSearched(true);
  };

  const resetSearch = () => {
    setStatusFilter('all'); setDateFrom('2026-05-01'); setDateTo('2026-05-31');
    setSearched(false); setOrders([]); setError(''); setSaved(false);
  };

  // ── เลือกรายการ ──
  const toggleOrder = (payNo) => {
    setError(''); setSaved(false);
    setOrders(os => os.map(o => o.payNo === payNo ? { ...o, selected: !o.selected } : o));
  };
  const selectableNos = orders.filter(o => window.srcOrderStatus(o.status).cancellable).map(o => o.payNo);
  const allSelected = selectableNos.length > 0 && selectableNos.every(no => orders.find(o => o.payNo === no).selected);
  const toggleAll = () => {
    setError(''); setSaved(false);
    setOrders(os => os.map(o => window.srcOrderStatus(o.status).cancellable ? { ...o, selected: !allSelected } : o));
  };

  const selected = orders.filter(o => o.selected);
  const selectedTotal = selected.reduce((a, o) => a + o.amount, 0);

  // ── ตรวจสอบก่อนยกเลิก ──
  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!searched) return 'กรุณาค้นหารายการใบสั่งคืนค่าหุ้นก่อนทำการยกเลิก';
    if (selected.length === 0) return 'กรุณาเลือกรายการที่ต้องการยกเลิกอย่างน้อย 1 รายการ';
    const blocked = selected.find(o => !window.srcOrderStatus(o.status).cancellable);
    if (blocked) return `รายการ ${blocked.payNo} สถานะ “${blocked.status}” ไม่สามารถยกเลิกได้`;
    if (reason.trim().length < 10) return 'กรุณาระบุเหตุผลการยกเลิก (อย่างน้อย 10 ตัวอักษร)';
    return '';
  };

  // กดบันทึก/ยืนยัน → ตรวจสอบแล้วเปิดโมดัลยืนยันสิทธิ์
  const openConfirm = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setConfirm(true);
  };

  // กด "บันทึกการยกเลิก" — ตรวจสอบเงื่อนไขเช่นกัน แล้วเปิดโมดัล
  const doSaveDraft = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    onToast && onToast('บันทึกร่างการยกเลิกแล้ว — กด “ยืนยัน” เพื่อยืนยันสิทธิ์และยกเลิกรายการ');
  };

  // ── ยกเลิกจริงหลังยืนยันรหัสผู้มีสิทธิ์ ──
  const performCancel = ({ authorizer }) => {
    const sel = orders.filter(o => o.selected);
    setOrders(os => os.map(o => o.selected ? { ...o, status: 'ยกเลิก', selected: false, note: 'ยกเลิกแล้ว — ' + reason.trim() } : o));
    sel.forEach(o => {
      audit && audit.log && audit.log({
        action: 'delete', module: 'ทะเบียนและติดตามหนี้ — ยกเลิกใบสั่งคืนค่าหุ้น',
        target: `${member.code} · ${member.name}`,
        summary: `ยกเลิกใบสั่งคืนค่าหุ้น ${o.payNo} · จำนวนเงิน ${fmt.money(o.amount, 2)} บาท`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่จ่าย', before: o.payNo, after: 'ยกเลิกแล้ว' },
          { field: 'วันที่จ่ายเดิม', before: fmt.date(o.payDate), after: '—' },
          { field: 'จำนวนเงินที่ยกเลิก', before: fmt.money(o.amount, 2), after: '—' },
          { field: 'สถานะรายการ', before: o.status, after: 'ยกเลิก' },
          { field: 'เหตุผลการยกเลิก', before: '—', after: reason.trim() },
          { field: 'อนุมัติโดย', before: '—', after: `${authorizer.name} (${authorizer.role})` },
        ],
      });
    });
    setConfirm(false); setSaved(true);
    onToast && onToast(`ยกเลิกใบสั่งคืนค่าหุ้นเรียบร้อย ${sel.length} รายการ · อนุมัติโดย ${authorizer.name}`);
  };

  const doExport = () => { if (loaded && searched) onToast && onToast('กำลังเตรียมส่งออกรายการใบสั่งคืนค่าหุ้น…'); };
  const doPrint = () => { if (loaded && searched) { onToast && onToast('กำลังเตรียมพิมพ์รายการ…'); setTimeout(() => window.print(), 80); } };

  return (
    <div data-screen-label="ยกเลิกใบสั่งคืนค่าหุ้น">
      {/* ── หัวเรื่อง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="shares" size={20} /></span>
          <div>
            <h1>ยกเลิกใบสั่งคืนค่าหุ้น</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · ตรวจสอบและยกเลิกใบสั่งจ่ายคืนค่าหุ้นที่ออกผิดพลาดหรือยังไม่ต้องการดำเนินการจ่าย</div>
          </div>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {saved && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} />
          <span>ยกเลิกรายการเรียบร้อยแล้ว — รายการที่ถูกยกเลิกถูกบันทึกประวัติไว้ตรวจสอบย้อนหลัง และจะไม่ถูกนำไปจ่ายซ้ำอีก</span>
        </div>
      )}

      {/* ── ① ข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="user" size={15} /></span>
          <h3>ข้อมูลสมาชิก</h3>
        </div>
        <div className="icr-strip">
          <SrcFld label="ทะเบียน" w={200} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </SrcFld>
          <SrcFld label="ชื่อ-ชื่อสกุล" grow w={240}><SrcRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></SrcFld>
          <SrcFld label="ทุนเรือนหุ้น" grow w={180}>
            <div className="icr-suffix">
              <div className="icr-ro num mono sr-locked" style={{ paddingRight: 46 }}>{loaded ? fmt.money(member.shareBalance, 2) : '—'}</div>
              <span className="icr-suffix-u">บาท</span>
            </div>
          </SrcFld>
          <SrcFld label="หน่วยงาน" grow w={240}><SrcRO value={member ? member.dept : ''} placeholder="(ดึงอัตโนมัติ)" /></SrcFld>
        </div>
      </div>

      {/* ── ② เงื่อนไขการค้นหา ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="filter" size={15} /></span>
          <h3>เงื่อนไขการค้นหา</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>ระบุช่วงวันที่ที่ต้องการยกเลิกรายการ</span></div>
        </div>
        <div className="icr-strip" style={{ alignItems: 'flex-end' }}>
          <SrcFld label="จากวันที่" w={170} required>
            <ErpDate value={dateFrom} onChange={(v) => (e => { setDateFrom(e.target.value); setError(''); })({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </SrcFld>
          <SrcFld label="ถึงวันที่" w={170} required>
            <ErpDate value={dateTo} onChange={(v) => (e => { setDateTo(e.target.value); setError(''); })({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </SrcFld>
          <SrcFld label="สถานะรายการ" w={200}>
            <select className="cfg-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setError(''); }} disabled={!loaded}>
              {window.SRC_STATUS_FILTERS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </SrcFld>
          <span style={{ flex: 1 }} />
          <button className="btn primary" onClick={runSearch} disabled={!loaded}><Icon name="search" size={14} /> ค้นหา</button>
          <button className="btn" onClick={resetSearch}><Icon name="refresh" size={14} /> ล้างค่า</button>
        </div>
      </div>

      {/* ── ③ รายการใบสั่งคืนค่าหุ้น ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="receipt" size={15} /></span>
          <h3>รายการใบสั่งคืนค่าหุ้น</h3>
          <div className="icr-sec-actions src-tbl-actions">
            {searched && (
              <span className="muted src-count">
                พบทั้งหมด <b>{orders.length}</b> รายการ
                {selected.length > 0 && <> · เลือกแล้ว <b style={{ color: 'var(--danger)' }}>{selected.length}</b> รายการ</>}
              </span>
            )}
            <button className="btn danger sm" disabled={selected.length === 0} onClick={openConfirm}>
              <Icon name="close" size={13} /> ยกเลิกรายการที่เลือก{selected.length > 0 ? ` (${selected.length})` : ''}
            </button>
            <span className="src-actions-sp" />
            <button className="btn sm" disabled={!searched || orders.length === 0} onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
            <button className="btn sm" disabled={!searched || orders.length === 0} onClick={doExport}><Icon name="download" size={13} /> ส่งออก</button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl src-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>
                  <input type="checkbox" className="ch-box" checked={allSelected}
                         disabled={selectableNos.length === 0} onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                </th>
                <th>เลขที่จ่าย</th>
                <th className="center">วันที่จ่าย</th>
                <th className="num">จำนวนเงินจ่าย (บาท)</th>
                <th className="center">สถานะ</th>
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {!searched ? (
                <tr><td colSpan="6" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={22} /></div>
                  {loaded ? 'ระบุช่วงวันที่แล้วกด “ค้นหา” เพื่อแสดงรายการใบสั่งคืนค่าหุ้น' : 'เลือกสมาชิกและระบุช่วงวันที่เพื่อค้นหารายการ'}
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="info" size={22} /></div>
                  ไม่พบข้อมูลใบสั่งคืนค่าหุ้นในช่วงวันที่ที่ระบุ
                </td></tr>
              ) : orders.map(o => {
                const st = window.srcOrderStatus(o.status);
                return (
                  <tr key={o.payNo} className={o.selected ? 'dn-row-sel' : ''}>
                    <td className="center">
                      {st.cancellable ? (
                        <input type="checkbox" className="ch-box" checked={o.selected} onChange={() => toggleOrder(o.payNo)} aria-label={`เลือก ${o.payNo}`} />
                      ) : (
                        <span className="src-lockcell" title={st.hint}><Icon name="lock" size={12} /></span>
                      )}
                    </td>
                    <td className="mono">{o.payNo}</td>
                    <td className="center mono" style={{ fontSize: 12 }}>{fmt.date(o.payDate)}</td>
                    <td className="num mono">{fmt.money(o.amount, 2)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{o.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.note}</td>
                  </tr>
                );
              })}
            </tbody>
            {searched && orders.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="3" className="center"><b>รวมรายการที่เลือก {selected.length} รายการ</b></td>
                  <td className="num mono"><b>{fmt.money(selectedTotal, 2)}</b></td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ── ④ เหตุผลการยกเลิก + สรุปข้อมูลการยกเลิก ── */}
      <div className="src-bottom-grid">
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="icr-sec-head">
            <span className="sw-sec-ico"><Icon name="edit" size={15} /></span>
            <h3>เหตุผลการยกเลิก</h3>
          </div>
          <textarea className="cfg-input src-reason" rows={4} maxLength={500}
                    placeholder="ระบุเหตุผลการยกเลิกรายการ (อย่างน้อย 10 ตัวอักษร) — เช่น ออกใบสั่งจ่ายผิดพลาด / บันทึกซ้ำซ้อน / ยังไม่ต้องการจ่ายคืนค่าหุ้น"
                    value={reason} onChange={e => { setReason(e.target.value); setError(''); }} disabled={!loaded} />
          <div className="src-reason-count">{reason.length} / 500</div>
        </div>

        <div className="search-card icr-sec src-summary-card" style={{ marginBottom: 0 }}>
          <div className="icr-sec-head">
            <span className="sw-sec-ico"><Icon name="info" size={15} /></span>
            <h3>สรุปข้อมูลการยกเลิก</h3>
            <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>อ้างอิงจากรายการที่เลือก</span></div>
          </div>
          <div className="src-summary">
            <div className="src-sum-row"><span className="src-sum-l">จำนวนรายการที่เลือก</span><span className="src-sum-v mono">{selected.length} รายการ</span></div>
            <div className="src-sum-row"><span className="src-sum-l">รวมจำนวนเงิน</span><span className="src-sum-v mono">{fmt.money(selectedTotal, 2)} บาท</span></div>
            <div className="src-sum-row"><span className="src-sum-l">ผู้ทำรายการ</span><span className="src-sum-v">{operator.name}</span></div>
            <div className="src-sum-row"><span className="src-sum-l">วันที่ทำรายการ</span><span className="src-sum-v mono">{fmt.date(today)}</span></div>
          </div>
        </div>
      </div>

      {/* ── แถบปุ่มท้ายหน้า ── */}
      <div className="src-footbar">
        <button className="btn" onClick={doSaveDraft} disabled={!loaded}><Icon name="edit" size={14} /> บันทึกการยกเลิก</button>
        <button className="btn primary" onClick={openConfirm} disabled={selected.length === 0}><Icon name="check" size={14} /> ยืนยัน</button>
        <button className="btn" onClick={clearAll}><Icon name="close" size={14} /> ปิด</button>
      </div>

      {modal && <window.SrfMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
      {confirmOpen && (
        <SrcConfirmModal member={member} orders={selected} reason={reason.trim()}
                         onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ShareRefundCancelPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <SrcCancelScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { ShareRefundCancelPage, SrcCancelScreen });
