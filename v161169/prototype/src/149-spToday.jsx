// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — งานยกเลิก
//  ① ยกเลิกชำระพิเศษ (CancelSpecialPayPage)
//     ค้นหาสมาชิก → รายการ Slip ใบเสร็จรับชำระพิเศษ (PX) ในช่วงวันที่ →
//     เลือก slip เพื่อดูรายละเอียดใบเสร็จ + breakdown การชำระต่องวด →
//     ติ๊กเลือก → ยกเลิกชำระพิเศษ (ต้องระบุเหตุผล)
//  ② ยกเลิกใบสั่งชำระพิเศษ (CancelSpecialOrderPage)
//     ค้นหาสมาชิก → รายการใบสั่งชำระพิเศษ → เลือกเพื่อดูรายละเอียดใบสั่ง +
//     breakdown การชำระ → ยกเลิกใบสั่ง (ต้องระบุเหตุผล)
//  ใช้รูปแบบกลาง: MemberSearchField · icr-*/ldc-* · DN_MEMBERS · fmt · audit
// ════════════════════════════════════════════════════════════════════

const spToday = () => window.DEPOSIT_WORKING_DATE || '2026-07-24';
const spAddDays = (iso, d) => { const t = new Date(iso); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const spHash = (s) => { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0; return h; };
const spMoney = (v) => window.fmt.money(v || 0, 2);
const SP_OPERATORS = ['DONLAYA', 'SUPHAP', 'MONTRI', 'AREE'];
const SP_UNIT = (m) => (m && (m.deptCode ? m.deptCode + ' - ' + m.dept : m.dept)) || '—';

// ─── ฟิลด์ (label เล็กด้านบน) ────────────────────────────────────────
function SpFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function SpRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}
function SpKv({ label, children }) {
  return (
    <div className="ldc-kv">
      <span className="ldc-kv-l">{label}</span>
      <span className="ldc-kv-c">{children}</span>
    </div>
  );
}

// ── สร้างรายการใบเสร็จรับชำระพิเศษ (PX) ของสมาชิก ────────────────────
//  เฉพาะสัญญาที่มีการชำระแล้ว (paidTerms > 0) จึงจะมีใบเสร็จให้ยกเลิก
function spSlipsOf(member) {
  const today = spToday();
  const yy = String(new Date(today).getFullYear() + 543).slice(-2);
  const out = [];
  (member.debts || []).forEach((d, i) => {
    if (!d.paidTerms) return;                          // ยังไม่เคยชำระ → ไม่มีใบเสร็จ
    const h = spHash(member.code + d.contractNo);
    const dayOffset = h % 3;                            // 0 = วันทำการ (ยกเลิกได้)
    const recDate = spAddDays(today, -dayOffset);
    const principal = Math.round((d.installment || 5000) * 0.86 / 10) * 10;
    const interest = Math.round((d.installment || 5000) * 0.14 / 10) * 10;
    const payTotal = principal + interest;
    const remaining = d.principalRemaining || 0;
    out.push({
      slipId: member.code + '-' + i,
      receiptNo: `SI${yy}${String(10000 + (h % 89999)).padStart(6, '0')}`,
      itemType: 'PX',
      receiptDate: recDate,
      txnDate: recDate,
      unit: member.deptCode || '10160',
      itemCode: 'PX',
      operator: SP_OPERATORS[h % SP_OPERATORS.length],
      statusCode: '1 - ปกติ',
      contractNo: d.contractNo,
      loanType: d.type,
      period: d.paidTerms,
      principal, interest, payTotal, remaining,
      total: payTotal,
      crossDay: dayOffset > 0,
      issuedName: member.name + (member.status === 'เสียชีวิต' ? ' (ทายาท)' : ''),
    });
  });
  return out;
}

// ── สร้างรายการใบสั่งชำระพิเศษ ของสมาชิก ────────────────────────────
function spOrdersOf(member) {
  const today = spToday();
  const yy = String(new Date(today).getFullYear() + 543).slice(-2);
  const out = [];
  (member.debts || []).forEach((d, i) => {
    if (!d.overdueInstallments) return;                // มีงวดค้าง → เคยออกใบสั่งชำระพิเศษ
    const h = spHash('ORD' + member.code + d.contractNo);
    const dayOffset = h % 3;
    const orderDate = spAddDays(today, -dayOffset);
    const principal = Math.round((d.installment || 5000) * (d.overdueInstallments) * 0.85 / 10) * 10;
    const interest = Math.round((d.installment || 5000) * (d.overdueInstallments) * 0.15 / 10) * 10;
    const payTotal = principal + interest;
    out.push({
      slipId: 'O-' + member.code + '-' + i,
      receiptNo: `SI${yy}${String(20000 + (h % 79999)).padStart(6, '0')}`,
      itemType: 'PB',
      orderNo: `PB${yy}${String(30000 + (h % 69999)).padStart(6, '0')}`,
      orderDate,
      operator: SP_OPERATORS[h % SP_OPERATORS.length],
      statusCode: '1 - ปกติ',
      contractNo: d.contractNo,
      loanType: d.type,
      detail: 'ชำระพิเศษ ' + d.type + ' (' + d.contractNo + ')',
      period: d.overdueInstallments,
      principal, interest, payTotal,
      remaining: d.principalRemaining || 0,
      total: payTotal,
      crossDay: dayOffset > 0,
    });
  });
  return out;
}

// ════════════════════════════════════════════════════════════════════
//  โมดัลยืนยันการยกเลิก (ใช้ร่วมกัน)
// ════════════════════════════════════════════════════════════════════
function SpConfirmModal({ title, member, rows, labelKey, reason, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const total = rows.reduce((a, r) => a + r.total, 0);
  const submit = () => { setBusy(true); setTimeout(() => { setBusy(false); onConfirm(); }, 360); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            <div className="muted" style={{ fontSize: 11 }}>สมาชิก <span className="mono">{member.code}</span> · {member.name}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะปรับสถานะรายการเป็น “ยกเลิก” และบันทึกผู้ทำรายการ วันเวลา และเหตุผล ลงใน Audit Log — ไม่สามารถย้อนกลับได้</span>
          </div>
          <div className="ct-confirm-list">
            {rows.map(r => (
              <div className="ct-confirm-row" key={r.slipId}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{r[labelKey]}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{r.contractNo} · {r.loanType}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>฿ {spMoney(r.total)}</div>
              </div>
            ))}
            <div className="ct-confirm-total"><span>รวม {rows.length} รายการ</span><span className="mono">฿ {spMoney(total)}</span></div>
          </div>
          <div className="src-confirm-reason">
            <span className="src-confirm-reason-l">เหตุผลการยกเลิก</span>
            <span className="src-confirm-reason-v">{reason}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ย้อนกลับ</button>
            <button type="button" className="btn danger" style={{ flex: 1, justifyContent: 'center' }} disabled={busy} onClick={submit}>
              {busy ? 'กำลังดำเนินการ...' : <><Icon name="check" /> ยืนยันการยกเลิก</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ① ยกเลิกชำระพิเศษ
// ════════════════════════════════════════════════════════════════════
function CancelSpecialPayScreen({ onToast, audit }) {
  const today = spToday();
  const [member, setMember] = useState(null);
  const [slips, setSlips]   = useState([]);
  const [fromDate, setFrom] = useState(spAddDays(today, -180));
  const [toDate, setTo]     = useState(today);
  const [selId, setSelId]   = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [reason, setReason] = useState('');
  const [error, setError]   = useState('');
  const [notFound, setNotFound] = useState(false);
  const [confirm, setConfirm]   = useState(false);

  const loaded = !!member;
  const inRange = (d) => d >= fromDate && d <= toDate;
  const visible = slips.filter(s => inRange(s.receiptDate));
  const sel = visible.find(s => s.slipId === selId) || null;
  const checkedRows = visible.filter(s => checked.has(s.slipId));

  const pickMember = (m) => {
    const all = spSlipsOf(m);
    setMember(m); setSlips(all); setChecked(new Set()); setError(''); setReason('');
    setNotFound(all.length === 0);
    const first = all.find(s => inRange(s.receiptDate));
    setSelId(first ? first.slipId : null);
  };
  const clearScreen = () => {
    setMember(null); setSlips([]); setSelId(null); setChecked(new Set());
    setFrom(spAddDays(today, -180)); setTo(today); setReason(''); setError(''); setNotFound(false);
  };
  const toggle = (id) => setChecked(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openConfirm = () => {
    if (!member) { setError('กรุณาค้นหาและเลือกสมาชิกก่อน'); return; }
    if (checkedRows.length === 0) { setError('กรุณาเลือกรายการใบเสร็จที่ต้องการยกเลิกอย่างน้อย 1 รายการ'); return; }
    const locked = checkedRows.filter(s => s.crossDay);
    if (locked.length) { setError(`มี ${locked.length} รายการเป็นการยกเลิกข้ามวัน — ไม่สามารถยกเลิกที่หน้าจอนี้ กรุณาติดต่อแผนกประมวลผล`); return; }
    if (reason.trim().length < 10) { setError('กรุณาระบุเหตุผลการยกเลิก (อย่างน้อย 10 ตัวอักษร)'); return; }
    setError(''); setConfirm(true);
  };
  const performCancel = () => {
    const total = checkedRows.reduce((s, x) => s + x.total, 0);
    const cancelled = [...checkedRows];
    const remain = slips.filter(s => !checked.has(s.slipId));
    setSlips(remain); setChecked(new Set());
    const nextSel = remain.find(s => inRange(s.receiptDate));
    setSelId(nextSel ? nextSel.slipId : null);
    setConfirm(false);
    audit && audit.log && audit.log({
      action: 'delete', module: 'สินเชื่อ — ยกเลิกชำระพิเศษ',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกใบเสร็จชำระพิเศษ ${cancelled.length} รายการ · รวม ${spMoney(total)} บาท`,
      changes: cancelled.map(s => ({ field: s.receiptNo, before: `รับชำระ · ${spMoney(s.total)}`, after: 'ยกเลิกชำระพิเศษ · ' + reason.trim() })),
    });
    onToast && onToast(`ยกเลิกชำระพิเศษ ${cancelled.length} รายการ (${member.name}) — รวม ${spMoney(total)} บาท เรียบร้อยแล้ว`);
    setReason('');
  };

  return (
    <div data-screen-label="ยกเลิกชำระพิเศษ">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ยกเลิกชำระพิเศษ</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · งานยกเลิก — ค้นหาสมาชิก เลือกใบเสร็จรับชำระพิเศษ (PX) ที่ต้องการยกเลิก</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn danger sm" onClick={openConfirm}><Icon name="close" size={13} /> ยกเลิกชำระพิเศษ</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
        </div>
      </div>

      {notFound && (
        <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> ไม่พบรายการ Slip ของสมาชิก</div>
      )}
      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ① รายละเอียดสมาชิก */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3></div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <SpFld label="เลขสมาชิก / เลขที่สัญญา" fill span={2} required>
            <ContractSearchField contract={member && member.debts && member.debts[0] ? member.debts[0].contractNo : ''} member={member}
                                 onPick={({ member: m }) => pickMember(m)}
                                 source={window.DN_MEMBERS}
                                 title="ค้นหาสมาชิก — ยกเลิกชำระพิเศษ"
                                 placeholder="เลขสมาชิก หรือเลขที่สัญญา…" />
          </SpFld>
          <SpFld label="ชื่อ-นามสกุล" fill><SpRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></SpFld>
          <SpFld label="สังกัด" fill><SpRO value={member ? SP_UNIT(member) : ''} placeholder="—" /></SpFld>
          <SpFld label="ทุนเรือนหุ้น" fill><SpRO value={member ? spMoney(member.shares) : ''} mono num placeholder="—" /></SpFld>
          <SpFld label="ช่วงวันที่ต้องการยกเลิกรายการ" fill>
            <ErpDate value={fromDate} onChange={(v) => ((e) => setFrom(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </SpFld>
          <SpFld label="ถึงวันที่" fill>
            <ErpDate value={toDate} onChange={(v) => ((e) => setTo(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </SpFld>
        </div>
      </div>

      {/* ② รายการ Slip (ซ้าย) + รายละเอียด Slip (ขวา) */}
      <div className="ldc-grid">
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>รายการ Slip</h3>
            <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>
              {loaded ? `พบ ${visible.length} รายการในช่วงวันที่ · เลือกยกเลิก ${checkedRows.length}` : '— ค้นหาสมาชิกเพื่อแสดงรายการใบเสร็จ —'}
            </span>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ldc-slip-tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 36 }} />
                  <th>เลขที่ใบเสร็จ</th>
                  <th className="center" style={{ width: 70 }}>ประเภท</th>
                  <th className="center" style={{ width: 100 }}>วันที่ใบเสร็จ</th>
                  <th className="num" style={{ width: 120 }}>รวม</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr><td colSpan="5" className="empty-state">ค้นหาสมาชิกเพื่อแสดงรายการใบเสร็จรับชำระพิเศษ</td></tr>
                ) : visible.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบรายการใบเสร็จในช่วงวันที่ที่เลือก</td></tr>
                ) : visible.map(s => (
                  <tr key={s.slipId} className={'clickable' + (s.slipId === selId ? ' ldc-row-on' : '')} onClick={() => setSelId(s.slipId)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checked.has(s.slipId)} onChange={() => toggle(s.slipId)} aria-label="เลือกยกเลิก" style={{ accentColor: 'var(--primary)' }} />
                    </td>
                    <td className="mono">{s.receiptNo}{s.crossDay && <span className="chip warning" style={{ marginLeft: 6, fontSize: 10 }}>ข้ามวัน</span>}</td>
                    <td className="center"><span className="chip info">{s.itemType}</span></td>
                    <td className="center mono">{window.fmt.date(s.receiptDate)}</td>
                    <td className="num mono">{spMoney(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียด Slip</h3>
            {sel && <span className="mono muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{sel.receiptNo}</span>}
          </div>
          {!sel ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              เลือกรายการ Slip ทางซ้ายเพื่อแสดงรายละเอียดใบเสร็จ
            </div>
          ) : (
            <>
              <div className="ldc-kv-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px 16px' }}>
                <div style={{ display: 'contents' }}>
                  <SpKv label="เลขที่ใบเสร็จ"><SpRO value={sel.receiptNo} mono /></SpKv>
                  <SpKv label="วันที่ใบเสร็จ"><SpRO value={window.fmt.date(sel.receiptDate)} mono /></SpKv>
                </div>
                <div style={{ display: 'contents' }}>
                  <SpKv label="รหัสรายการ"><SpRO value={sel.itemCode} mono /></SpKv>
                  <SpKv label="วันที่รายการ"><SpRO value={window.fmt.date(sel.txnDate)} mono /></SpKv>
                </div>
                <div style={{ display: 'contents' }}>
                  <SpKv label="หน่วย"><SpRO value={sel.unit} mono /></SpKv>
                  <SpKv label="ทำรายการโดย"><SpRO value={sel.operator} /></SpKv>
                </div>
                <div style={{ display: 'contents' }}>
                  <SpKv label="ทุนเรือนหุ้น"><SpRO value={spMoney(member.shares)} mono num /></SpKv>
                  <SpKv label="สถานะรายการ"><SpRO value={sel.statusCode} /></SpKv>
                </div>
                <SpKv label="ออกใบเสร็จชื่อ"><SpRO value={sel.issuedName} /></SpKv>
              </div>

              <div className="ldc-net" style={{ marginTop: 14 }}>
                <span className="ldc-net-l">รวม</span>
                <span className="ldc-net-v mono">{spMoney(sel.total)}</span>
              </div>

              <div className="ldc-subhead">รายการ Slip <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>(การชำระต่องวด)</span></div>
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl ldc-break-tbl">
                  <thead>
                    <tr>
                      <th>รายการ</th>
                      <th className="center" style={{ width: 54 }}>งวด</th>
                      <th className="num">ชำระต้น</th>
                      <th className="num">ชำระด/บ</th>
                      <th className="num">รวมชำระ</th>
                      <th className="num">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="mono">{sel.contractNo}</td>
                      <td className="center mono">{sel.period}</td>
                      <td className="num mono">{spMoney(sel.principal)}</td>
                      <td className="num mono">{spMoney(sel.interest)}</td>
                      <td className="num mono">{spMoney(sel.payTotal)}</td>
                      <td className="num mono">{spMoney(sel.remaining)}</td>
                    </tr>
                  </tbody>
                </table>
              </div></div>
            </>
          )}
        </div>
      </div>

      {/* ③ เหตุผลการยกเลิก */}
      {loaded && (
        <div className="search-card icr-sec" style={{ marginTop: 12, marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>เหตุผลการยกเลิก</h3></div>
          <textarea className="cfg-input src-reason" rows={3} maxLength={500}
            placeholder="ระบุเหตุผลการยกเลิกชำระพิเศษ (อย่างน้อย 10 ตัวอักษร) — เช่น รับชำระผิดสัญญา / บันทึกซ้ำซ้อน / ยกเลิกตามคำขอสมาชิก"
            value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} />
          <div className="src-reason-count">{reason.length} / 500</div>
        </div>
      )}

      {confirm && (
        <SpConfirmModal title="ยืนยันการยกเลิกชำระพิเศษ" member={member} rows={checkedRows}
          labelKey="receiptNo" reason={reason.trim()} onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ② ยกเลิกใบสั่งชำระพิเศษ
// ════════════════════════════════════════════════════════════════════
function CancelSpecialOrderScreen({ onToast, audit }) {
  const today = spToday();
  const [member, setMember] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selId, setSelId]   = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [reason, setReason] = useState('');
  const [error, setError]   = useState('');
  const [notFound, setNotFound] = useState(false);
  const [confirm, setConfirm]   = useState(false);

  const loaded = !!member;
  const sel = orders.find(s => s.slipId === selId) || null;
  const checkedRows = orders.filter(s => checked.has(s.slipId));

  const pickMember = (m) => {
    const all = spOrdersOf(m);
    setMember(m); setOrders(all); setChecked(new Set()); setError(''); setReason('');
    setNotFound(all.length === 0);
    setSelId(all[0] ? all[0].slipId : null);
  };
  const clearScreen = () => {
    setMember(null); setOrders([]); setSelId(null); setChecked(new Set());
    setReason(''); setError(''); setNotFound(false);
  };
  const toggle = (id) => setChecked(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openConfirm = () => {
    if (!member) { setError('กรุณาค้นหาและเลือกสมาชิกก่อน'); return; }
    if (checkedRows.length === 0) { setError('กรุณาเลือกใบสั่งชำระพิเศษที่ต้องการยกเลิกอย่างน้อย 1 รายการ'); return; }
    if (reason.trim().length < 10) { setError('กรุณาระบุเหตุผลการยกเลิก (อย่างน้อย 10 ตัวอักษร)'); return; }
    setError(''); setConfirm(true);
  };
  const performCancel = () => {
    const total = checkedRows.reduce((s, x) => s + x.total, 0);
    const cancelled = [...checkedRows];
    const remain = orders.filter(s => !checked.has(s.slipId));
    setOrders(remain); setChecked(new Set());
    setSelId(remain[0] ? remain[0].slipId : null);
    setConfirm(false);
    audit && audit.log && audit.log({
      action: 'delete', module: 'สินเชื่อ — ยกเลิกใบสั่งชำระพิเศษ',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกใบสั่งชำระพิเศษ ${cancelled.length} รายการ · รวม ${spMoney(total)} บาท`,
      changes: cancelled.map(s => ({ field: s.orderNo, before: `ใบสั่งปกติ · ${spMoney(s.total)}`, after: 'ยกเลิกใบสั่ง · ' + reason.trim() })),
    });
    onToast && onToast(`ยกเลิกใบสั่งชำระพิเศษ ${cancelled.length} รายการ (${member.name}) — รวม ${spMoney(total)} บาท เรียบร้อยแล้ว`);
    setReason('');
  };

  return (
    <div data-screen-label="ยกเลิกใบสั่งชำระพิเศษ">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ยกเลิกใบสั่งชำระพิเศษ</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · งานยกเลิก — ค้นหาสมาชิก เลือกใบสั่งชำระพิเศษที่ยังไม่ได้รับชำระเพื่อยกเลิก</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn danger sm" onClick={openConfirm}><Icon name="close" size={13} /> ยกเลิกใบสั่ง</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
        </div>
      </div>

      {notFound && (
        <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> ไม่พบรายการชำระหนี้</div>
      )}
      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ① รายละเอียดสมาชิก */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3></div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <SpFld label="เลขสมาชิก / เลขที่สัญญา" fill span={2} required>
            <ContractSearchField contract={member && member.debts && member.debts[0] ? member.debts[0].contractNo : ''} member={member}
                                 onPick={({ member: m }) => pickMember(m)}
                                 source={window.DN_MEMBERS}
                                 title="ค้นหาสมาชิก — ยกเลิกใบสั่งชำระพิเศษ"
                                 placeholder="เลขสมาชิก หรือเลขที่สัญญา…" />
          </SpFld>
          <SpFld label="ชื่อ-นามสกุล" fill><SpRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></SpFld>
          <SpFld label="สังกัด" fill><SpRO value={member ? SP_UNIT(member) : ''} placeholder="—" /></SpFld>
          <SpFld label="ทุนเรือนหุ้น" fill><SpRO value={member ? spMoney(member.shares) : ''} mono num placeholder="—" /></SpFld>
        </div>
      </div>

      {/* ② รายการ (ซ้าย) + รายละเอียดใบสั่ง (ขวา) */}
      <div className="ldc-grid">
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>รายการ Slip</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ldc-slip-tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 36 }} />
                  <th>เลขที่ใบเสร็จ</th>
                  <th className="center" style={{ width: 70 }}>ประเภท</th>
                  <th className="center" style={{ width: 110 }}>วันที่สั่งชำระ</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr><td colSpan="4" className="empty-state">ค้นหาสมาชิกเพื่อแสดงใบสั่งชำระพิเศษ</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">ไม่พบใบสั่งชำระพิเศษของสมาชิก</td></tr>
                ) : orders.map(s => (
                  <tr key={s.slipId} className={'clickable' + (s.slipId === selId ? ' ldc-row-on' : '')} onClick={() => setSelId(s.slipId)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checked.has(s.slipId)} onChange={() => toggle(s.slipId)} aria-label="เลือกยกเลิก" style={{ accentColor: 'var(--primary)' }} />
                    </td>
                    <td className="mono">{s.receiptNo}</td>
                    <td className="center"><span className="chip">{s.itemType}</span></td>
                    <td className="center mono">{window.fmt.date(s.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียดใบสั่ง</h3>
            {sel && <span className="mono muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{sel.orderNo}</span>}
          </div>
          {!sel ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              เลือกใบสั่งทางซ้ายเพื่อแสดงรายละเอียด
            </div>
          ) : (
            <>
              <div className="ldc-kv-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px 16px' }}>
                <div style={{ display: 'contents' }}>
                  <SpKv label="เลขที่ใบสั่ง"><SpRO value={sel.orderNo} mono /></SpKv>
                  <SpKv label="สถานะรายการ"><SpRO value={sel.statusCode} /></SpKv>
                </div>
                <div style={{ display: 'contents' }}>
                  <SpKv label="วันที่ใบสั่ง"><SpRO value={window.fmt.date(sel.orderDate)} mono /></SpKv>
                  <SpKv label="ทำรายการโดย"><SpRO value={sel.operator} /></SpKv>
                </div>
              </div>
              <div className="ldc-net" style={{ marginTop: 14 }}>
                <span className="ldc-net-l">รวม</span>
                <span className="ldc-net-v mono">{spMoney(sel.total)}</span>
              </div>

              <div className="ldc-subhead">รายละเอียดการชำระ</div>
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl ldc-break-tbl">
                  <thead>
                    <tr>
                      <th>รายละเอียด</th>
                      <th className="center" style={{ width: 48 }}>งวด</th>
                      <th className="num">ต้นเงิน</th>
                      <th className="num">ด/บ</th>
                      <th className="num">รวมชำระ</th>
                      <th className="num">ต้นคงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{sel.detail}</td>
                      <td className="center mono">{sel.period}</td>
                      <td className="num mono">{spMoney(sel.principal)}</td>
                      <td className="num mono">{spMoney(sel.interest)}</td>
                      <td className="num mono">{spMoney(sel.payTotal)}</td>
                      <td className="num mono">{spMoney(sel.remaining)}</td>
                    </tr>
                  </tbody>
                </table>
              </div></div>
            </>
          )}
        </div>
      </div>

      {/* ③ เหตุผลการยกเลิก */}
      {loaded && (
        <div className="search-card icr-sec" style={{ marginTop: 12, marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>เหตุผลการยกเลิก</h3></div>
          <textarea className="cfg-input src-reason" rows={3} maxLength={500}
            placeholder="ระบุเหตุผลการยกเลิกใบสั่งชำระพิเศษ (อย่างน้อย 10 ตัวอักษร) — เช่น ออกใบสั่งผิดพลาด / ยกเลิกตามคำขอ / ซ้ำซ้อน"
            value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} />
          <div className="src-reason-count">{reason.length} / 500</div>
        </div>
      )}

      {confirm && (
        <SpConfirmModal title="ยืนยันการยกเลิกใบสั่งชำระพิเศษ" member={member} rows={checkedRows}
          labelKey="orderNo" reason={reason.trim()} onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ─── Page wrappers ──────────────────────────────────────────────────
function CancelSpecialPayPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb(window.crumb3('ยกเลิกชำระพิเศษ', 'list'), []);
  return <CancelSpecialPayScreen onToast={onToast} audit={audit} />;
}
function CancelSpecialOrderPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb(window.crumb3('ยกเลิกใบสั่งชำระพิเศษ', 'list'), []);
  return <CancelSpecialOrderScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, {
  CancelSpecialPayPage, CancelSpecialOrderPage,
  CancelSpecialPayScreen, CancelSpecialOrderScreen,
});
