// ════════════════════════════════════════════════════════════════════
//  คืนเงินทดรอง / ส่งใช้เงินทดรอง (Petty / Advance Clearing)
//  ระบบการเงิน › เงินทดรอง
//  ทะเบียนรายการคืน (list) · แบบฟอร์มบันทึก (form) · รายละเอียด (detail)
//  ทำงานสอดคล้องกับเมนู "ขอยืมเงินทดรอง" — อ้างอิงรายการยืมที่จ่ายแล้ว
//  แล้วบันทึกค่าใช้จ่ายจริง เพื่อคืนเงิน/เบิกเพิ่ม และปิดรายการทดรอง
// ════════════════════════════════════════════════════════════════════
const { useState: prUseState, useMemo: prUseMemo } = React;

// ─── ฟิลด์ย่อย (label + control) ────────────────────────────────────
function PrField({ label, required, hint, children, full, span }) {
  const st = full ? { gridColumn: '1 / -1' } : (span ? { gridColumn: `span ${span}` } : null);
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}
function PrKv({ label, value, mono, span }) {
  const st = span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="icr-kv" style={st}>
      <span className="icr-kv-k">{label}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}
const PR_VERIFY = { ok: { l: 'ตรวจแล้ว', pill: 'ok' }, pending: { l: 'รอตรวจ', pill: 'warn' }, bad: { l: 'ไม่ผ่าน', pill: 'bad' } };

// ════════════════════════════════════════════════════════════════════
//  Popup เลือกรายการยืมที่รอส่งใช้
// ════════════════════════════════════════════════════════════════════
function PrAdvancePickModal({ items, onPick, onClose }) {
  const [q, setQ] = prUseState('');
  const rows = prUseMemo(() => {
    if (!q.trim()) return items;
    const n = q.toLowerCase().replace(/\s/g, '');
    return items.filter(o =>
      o.advanceId.toLowerCase().includes(n) ||
      o.memberName.toLowerCase().replace(/\s/g, '').includes(n) ||
      o.memberCode.toLowerCase().includes(n));
  }, [items, q]);
  const today = window.prToday();

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" size={18} /></div>
          <h2>เลือกรายการยืมเงินทดรองที่รอส่งใช้</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ height: 34, marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="ค้นหาด้วยเลขที่รายการยืม / รหัส / ชื่อผู้ขอ…" style={{ height: 32 }} />
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: '48vh' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่รายการยืม</th>
                  <th>ผู้ขอยืม</th>
                  <th className="center">ประเภท</th>
                  <th>วัตถุประสงค์</th>
                  <th className="center">ครบกำหนดคืน</th>
                  <th className="num">ยอดที่ยืม</th>
                  <th className="center" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">ไม่พบรายการยืมที่รอส่งใช้ตามเงื่อนไข</td></tr>
                ) : rows.map(o => {
                  const overdue = o.dueDate && o.dueDate < today;
                  return (
                    <tr key={o.advanceId} className="clickable" onClick={() => onPick(o)}>
                      <td className="mono">{o.advanceId}</td>
                      <td>
                        <div style={{ whiteSpace: 'nowrap' }}>{o.memberName}</div>
                        <div className="muted mono" style={{ fontSize: 10 }}>{o.memberCode} · {o.dept}</div>
                      </td>
                      <td className="center"><span className="chip info">{window.prTypeShort(o.typeV)}</span></td>
                      <td><div className="pa-clamp">{o.purpose}</div></td>
                      <td className="center mono">
                        {fmt.date(o.dueDate)}{overdue && <div><span className="chip danger" style={{ marginTop: 2 }}>เกินกำหนด</span></div>}
                      </td>
                      <td className="num mono">{fmt.money(o.amount, 0)}</td>
                      <td className="center"><button className="btn primary sm" onClick={(e) => { e.stopPropagation(); onPick(o); }}>เลือก</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            <Icon name="info" size={11} /> แสดงเฉพาะรายการยืมที่อนุมัติ/จ่ายเงินแล้วและยังไม่ได้ส่งใช้
          </p>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนรายการคืนเงินทดรอง (list)
// ════════════════════════════════════════════════════════════════════
function PrListView({ list, pending, onCreate, onOpen }) {
  const [q, setQ] = prUseState('');
  const [statusF, setStatusF] = prUseState('all');

  const rows = prUseMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) ||
                        String(x.advanceId).toLowerCase().includes(n));
    }
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.recordDate.localeCompare(a.recordDate) || b.id.localeCompare(a.id));
  }, [list, q, statusF]);

  const hasFilter = q || statusF !== 'all';
  const clear = () => { setQ(''); setStatusF('all'); };

  const openCnt = list.filter(r => r.status === 'submitted' || r.status === 'approved').length;
  const refundTotal = list.filter(r => r.status !== 'cancelled').reduce((s, r) => {
    const sum = window.prSummary(r.lines, r.advanceAmount);
    return s + (sum.mode === 'refund' ? sum.absDiff : 0);
  }, 0);

  return (
    <div data-screen-label="หน้าทะเบียนคืนเงินทดรอง">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>คืนเงินทดรอง</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ระบบการเงิน · ส่งใช้เงินทดรองจ่าย บันทึกค่าใช้จ่ายจริงพร้อมหลักฐาน คืนเงินส่วนที่เหลือหรือเบิกเพิ่ม และปิดรายการทดรอง
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> สร้างรายการคืนเงินทดรอง</button>
      </div>

      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">รอส่งใช้ (ยืมค้าง)</div>
          <div className="stat-value">{fmt.int(pending)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">อยู่ระหว่างดำเนินการ</div>
          <div className="stat-value">{fmt.int(openCnt)}</div>
          <div className="stat-sub">รอตรวจ / รออนุมัติ</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">ยอดคืนสหกรณ์รวม</div>
          <div className="stat-value">{fmt.money(refundTotal, 0)}</div>
          <div className="stat-sub">บาท</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่คืน / เลขที่ยืม / ผู้ขอ</span>
            <div className="search" style={{ flex: 'none', width: 320, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น RV-2569-000040, AV-2569-…, วิรัตน์" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 160 }}>
              <option value="all">ทุกสถานะ</option>
              {Object.keys(window.PR_STATUS).map(s => <option key={s} value={s}>{window.PR_STATUS[s].l}</option>)}
            </select>
          </div>
          {hasFilter && <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่คืน</th>
                <th>วันที่</th>
                <th>อ้างอิงยืม</th>
                <th>ผู้ขอ</th>
                <th className="num">ยอดที่ยืม</th>
                <th className="num">ใช้จริง</th>
                <th className="center">ผล</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบรายการคืนที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const st = window.prStatus(r.status);
                const sum = window.prSummary(r.lines, r.advanceAmount);
                const md = window.PR_MODES[sum.mode];
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td>{fmt.date(r.recordDate)}</td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{r.advanceId}</td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.dept}</div>
                    </td>
                    <td className="num mono">{fmt.money(r.advanceAmount, 0)}</td>
                    <td className="num mono">{fmt.money(sum.actualTotal, 0)}</td>
                    <td className="center">
                      <span className={'chip ' + md.chip}>{md.short}{sum.mode !== 'balanced' ? ' ' + fmt.money(sum.absDiff, 0) : ''}</span>
                    </td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดการคืนเงินทดรอง
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกการคืนเงินทดรอง
// ════════════════════════════════════════════════════════════════════
const prBlankDoc = () => ({ docType: window.PR_DOC_TYPES[0], docNo: '', docDate: '', fileName: '', note: '' });
//  รายการค่าใช้จ่ายจริง — ตั้งต้นจากประมาณการของรายการยืม
const prLineFromEst = (l) => ({
  cat: l.cat, desc: l.desc, qty: Number(l.qty) || 1, unit: l.unit || 'รายการ',
  price: Number(l.price) || 0, receiptNo: '', note: '',
});
const prBlankLine = () => ({ cat: window.PA_EXP_CATS[0] || '', desc: '', qty: 1, unit: 'รายการ', price: 0, receiptNo: '', note: '' });

function PrCreateForm({ list, clearable, onSubmit, onCancel }) {
  const [adv, setAdv] = prUseState(null);
  const [picking, setPicking] = prUseState(false);

  const [recordDate, setRecordDate] = prUseState(window.prToday);
  const [returnDate, setReturnDate] = prUseState(window.prToday);
  const [lines, setLines] = prUseState([]);
  const [note, setNote] = prUseState('');

  const [settleMethod, setSettleMethod] = prUseState('cash');
  const [settleBank, setSettleBank] = prUseState(window.PA_BANKS[0]);
  const [settleAcctNo, setSettleAcctNo] = prUseState('');
  const [settleDate, setSettleDate] = prUseState(window.prToday);
  const [settlePlace, setSettlePlace] = prUseState('');
  const [settleNote, setSettleNote] = prUseState('');

  const [docs, setDocs] = prUseState([]);
  const [error, setError] = prUseState('');

  const fiscal = prUseMemo(() => window.prFiscal(recordDate), [recordDate]);
  const requestNo = prUseMemo(() => window.prNextNo(list, window.prBeYear(recordDate)), [list, recordDate]);
  const sum = prUseMemo(() => window.prSummary(lines, adv ? adv.amount : 0), [lines, adv]);
  const md = window.PR_MODES[sum.mode];
  const cats = window.PA_EXP_CATS || [];
  const overdue = adv && adv.dueDate && adv.dueDate < window.prToday();

  const chooseAdv = (o) => {
    setAdv(o);
    setLines((o.lines && o.lines.length ? o.lines : [{}]).map(prLineFromEst));
    setPicking(false);
    setError('');
  };

  const setLine = (i, k, v) => setLines(s => s.map((r, idx) => {
    if (idx !== i) return r;
    return { ...r, [k]: (k === 'qty' || k === 'price') ? (v === '' ? 0 : Number(v)) : v };
  }));
  const addLine = () => setLines(s => [...s, prBlankLine()]);
  const delLine = (i) => setLines(s => s.filter((_, idx) => idx !== i));

  const setDoc = (i, k, v) => setDocs(s => s.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addDoc = () => setDocs(s => [...s, prBlankDoc()]);
  const delDoc = (i) => setDocs(s => s.filter((_, idx) => idx !== i));

  const build = (status) => ({
    id: requestNo, recordDate, returnDate,
    fiscalYear: fiscal.year, fiscalPeriod: fiscal.periodLabel,
    advanceId: adv.advanceId, advanceType: adv.typeV, advanceAmount: adv.amount,
    advanceRecordDate: adv.recordDate, advanceDueDate: adv.dueDate, advancePaidDate: adv.paidDate,
    memberCode: adv.memberCode, memberName: adv.memberName, dept: adv.dept,
    position: adv.position, supervisor: adv.supervisor, phone: adv.phone, email: adv.email,
    purpose: adv.purpose,
    lines: lines.map(l => ({ ...l })),
    settleMethod: sum.mode === 'balanced' ? '' : settleMethod,
    settleBank: (sum.mode !== 'balanced' && settleMethod === 'transfer') ? settleBank : '',
    settleAcctNo: (sum.mode !== 'balanced' && settleMethod === 'transfer') ? settleAcctNo.trim() : '',
    settleDate: sum.mode === 'balanced' ? '' : settleDate,
    settlePlace: (sum.mode !== 'balanced' && settleMethod === 'cash') ? settlePlace.trim() : '',
    settleNote: settleNote.trim() || note.trim(),
    docs: docs.map(d => ({ ...d, by: window.PR_USER, at: recordDate, verified: 'pending' })),
    status, enteredBy: window.PR_USER, enteredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  const validate = () => {
    if (!adv) { setError('กรุณาเลือกรายการยืมเงินทดรองที่จะส่งใช้'); return false; }
    if (!returnDate) { setError('กรุณาระบุวันที่ส่งใช้ / คืนเงิน'); return false; }
    if (!(sum.actualTotal > 0)) { setError('กรุณาระบุรายการค่าใช้จ่ายจริงอย่างน้อย 1 รายการ'); return false; }
    if (lines.some(l => !l.desc.trim())) { setError('กรุณาระบุรายละเอียดค่าใช้จ่ายจริงให้ครบทุกรายการ'); return false; }
    if (docs.length === 0) { setError('กรุณาแนบหลักฐานการใช้จ่าย (ใบเสร็จ/ใบกำกับภาษี) อย่างน้อย 1 รายการ'); return false; }
    if (sum.mode !== 'balanced' && settleMethod === 'transfer' && !settleAcctNo.trim()) {
      setError('วิธีคืน/รับเงินแบบโอน ต้องระบุเลขที่บัญชี'); return false;
    }
    setError(''); return true;
  };

  const submit = (status) => {
    if (!adv) { setError('กรุณาเลือกรายการยืมเงินทดรองก่อน'); return; }
    if (status === 'submitted' && !validate()) return;
    onSubmit(build(status), status);
  };

  return (
    <div data-screen-label="หน้าบันทึกคืนเงินทดรอง">
      {picking && <PrAdvancePickModal items={clearable} onPick={chooseAdv} onClose={() => setPicking(false)} />}

      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สร้างรายการคืนเงินทดรอง</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เลือกรายการยืม · บันทึกค่าใช้จ่ายจริง · คืนเงิน/เบิกเพิ่ม · หลักฐานการใช้จ่าย
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <button className="btn sm" onClick={() => submit('draft')} disabled={!adv}><Icon name="edit" size={13} /> บันทึกร่าง</button>
        <button className="btn primary sm" onClick={() => submit('submitted')} disabled={!adv}>
          <Icon name="check" /> บันทึก & ส่งตรวจสอบ
        </button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ① ข้อมูลเอกสาร + รายการยืมที่อ้างอิง ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลเอกสาร</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>เลขที่คืน <b className="mono" style={{ color: 'var(--text)' }}>{requestNo}</b></span>
          </div>
        </div>
        <div className="form-grid cols-4">
          <PrField label="เลขที่รายการคืน" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono ds-auto-field" value="Auto" readOnly />
          </PrField>
          <PrField label="วันที่ทำรายการ" required>
            <ErpDate value={recordDate} onChange={(v) => ((e) => setRecordDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PrField>
          <PrField label="ปีบัญชี / งวดบัญชี" hint="(อ้างวันที่ทำรายการ)">
            <input className="cfg-input mono sr-auto" value={`${fiscal.year} · งวด ${fiscal.periodLabel}`} readOnly />
          </PrField>
          <PrField label="สถานะ">
            <input className="cfg-input sr-readonly" value="ร่าง (ยังไม่บันทึก)" readOnly />
          </PrField>
        </div>

        <div className="section-head" style={{ margin: '18px 0 12px' }}>
          <span className="head-bar" /><h3 style={{ fontSize: 13 }}>รายการยืมที่ส่งใช้</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm primary" onClick={() => setPicking(true)}>
              <Icon name="search" size={13} /> {adv ? 'เปลี่ยนรายการยืม' : 'เลือกรายการยืม'}
            </button>
          </div>
        </div>
        {!adv ? (
          <div className="pa-doc-empty" onClick={() => setPicking(true)} style={{ cursor: 'pointer' }}>
            <Icon name="search" size={22} />
            <div>ยังไม่ได้เลือกรายการยืม — คลิกเพื่อเลือกรายการยืมเงินทดรองที่จ่ายแล้วและรอส่งใช้</div>
          </div>
        ) : (
          <div className="lt-head-dates" style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-subtle, #fafafa)', padding: '12px 14px' }}>
            <div className="lt-date"><span className="lt-date-k">เลขที่รายการยืม</span><span className="lt-date-v mono">{adv.advanceId}</span></div>
            <div className="lt-date"><span className="lt-date-k">ประเภท</span><span className="lt-date-v">{window.prTypeLabel(adv.typeV)}</span></div>
            <div className="lt-date"><span className="lt-date-k">ยอดที่ยืม</span><span className="lt-date-v mono">{fmt.money(adv.amount, 2)} บ.</span></div>
            <div className="lt-date"><span className="lt-date-k">จ่ายเมื่อ</span><span className="lt-date-v">{fmt.date(adv.paidDate)}</span></div>
            <div className="lt-date"><span className="lt-date-k">ครบกำหนดคืน</span><span className={'lt-date-v' + (overdue ? ' pr-overdue' : '')}>{fmt.date(adv.dueDate)}</span></div>
          </div>
        )}
        {adv && (
          <PrField label="วันที่ส่งใช้ / คืนเงิน" required span={2} full>
            <div className="form-grid cols-4" style={{ marginTop: 6 }}>
              <ErpDate value={returnDate} onChange={(v) => ((e) => setReturnDate(e.target.value))({ target: { value: v } })} style={{ maxWidth: 220 }} className="cfg-input" />
            </div>
          </PrField>
        )}
        {overdue && (
          <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>รายการยืมนี้<b>เกินกำหนดส่งใช้</b> ({fmt.date(adv.dueDate)}) — ระบบจะบันทึกไว้ในประวัติการส่งใช้ล่าช้าของผู้ขอ</span>
          </div>
        )}
      </div>

      {adv && (<>
        {/* ── ② ข้อมูลผู้ขอ + วัตถุประสงค์ ── */}
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลผู้ขอยืม</h3></div>
          <div className="form-grid cols-4">
            <PrField label="รหัส / ชื่อผู้ขอ">
              <input className="cfg-input sr-auto" value={`${adv.memberCode} · ${adv.memberName}`} readOnly />
            </PrField>
            <PrField label="ตำแหน่ง">
              <input className="cfg-input sr-auto" value={adv.position || '—'} readOnly />
            </PrField>
            <PrField label="หน่วยงาน / สังกัด">
              <input className="cfg-input sr-auto" value={adv.dept || '—'} readOnly />
            </PrField>
            <PrField label="ผู้บังคับบัญชา">
              <input className="cfg-input sr-auto" value={adv.supervisor || '—'} readOnly />
            </PrField>
          </div>
          <div className="form-grid cols-1" style={{ marginTop: 14 }}>
            <PrField label="วัตถุประสงค์การยืม (อ้างอิง)" full>
              <div className="icr-note-view">{adv.purpose}</div>
            </PrField>
          </div>
        </div>

        {/* ── ③ รายการค่าใช้จ่ายจริง ── */}
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>รายการค่าใช้จ่ายจริง</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <button className="btn sm" onClick={addLine}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl pa-line-tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 40 }}>#</th>
                  <th style={{ minWidth: 150 }}>หมวดค่าใช้จ่าย</th>
                  <th style={{ minWidth: 170 }}>รายละเอียด</th>
                  <th className="center" style={{ width: 70 }}>จำนวน</th>
                  <th className="center" style={{ width: 92 }}>หน่วยนับ</th>
                  <th className="num" style={{ width: 100 }}>ราคา/หน่วย</th>
                  <th className="num" style={{ width: 110 }}>จำนวนเงินจริง</th>
                  <th style={{ width: 120 }}>เลขที่ใบเสร็จ</th>
                  <th className="center" style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {lines.map((r, i) => (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <select className="cfg-input pa-cell" value={r.cat} onChange={(e) => setLine(i, 'cat', e.target.value)}>
                        {!cats.includes(r.cat) && r.cat && <option value={r.cat}>{r.cat}</option>}
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td><input className="cfg-input pa-cell" value={r.desc} onChange={(e) => setLine(i, 'desc', e.target.value)} placeholder="ระบุรายละเอียดจากใบเสร็จจริง" /></td>
                    <td className="center"><input className="cfg-input mono pa-cell num" type="number" min="0" value={r.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} /></td>
                    <td>
                      <select className="cfg-input pa-cell" value={r.unit} onChange={(e) => setLine(i, 'unit', e.target.value)}>
                        {window.PA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="num"><input className="cfg-input mono pa-cell num" type="number" min="0" step="0.01" value={r.price} onChange={(e) => setLine(i, 'price', e.target.value)} /></td>
                    <td className="num mono pa-line-amt">{fmt.money(window.prLineAmount(r), 2)}</td>
                    <td><input className="cfg-input pa-cell" value={r.receiptNo} onChange={(e) => setLine(i, 'receiptNo', e.target.value)} placeholder="—" /></td>
                    <td className="center">
                      <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delLine(i)}
                              disabled={lines.length === 1} title="ลบรายการ"><Icon name="close" size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="pa-line-tot">
                  <td colSpan="6" className="right">รวมค่าใช้จ่ายจริง</td>
                  <td className="num mono">{fmt.money(sum.actualTotal, 2)}</td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            </table>
          </div></div>

          {/* ── ยอดสรุปการคืน ── */}
          <div className="pa-sum-wrap">
            <div className="pr-sum-note muted" style={{ fontSize: 11.5, alignSelf: 'flex-start', maxWidth: 320 }}>
              <Icon name="info" size={11} /> ผลต่างระหว่างยอดที่ยืมกับค่าใช้จ่ายจริง จะกำหนดว่าต้อง<b>คืนเงิน</b>ให้สหกรณ์ หรือ<b>เบิกเพิ่ม</b>
            </div>
            <div className="pa-sum-box">
              <div className="pa-sum-row"><span>ยอดที่ยืม</span><b className="mono">{fmt.money(sum.advanceAmount, 2)}</b></div>
              <div className="pa-sum-row"><span>ค่าใช้จ่ายจริง</span><b className="mono">{fmt.money(sum.actualTotal, 2)}</b></div>
              <div className={'pa-sum-row grand ' + (sum.mode === 'claim' ? 'pr-claim' : sum.mode === 'refund' ? 'pr-refund' : '')}>
                <span>{md.l}</span>
                <b className="mono">{sum.mode === 'balanced' ? fmt.money(0, 2) : (sum.mode === 'claim' ? '+' : '') + fmt.money(sum.absDiff, 2)}</b>
              </div>
            </div>
          </div>
        </div>

        {/* ── ④ วิธีคืนเงิน / รับเงินเพิ่ม ── */}
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>{sum.mode === 'claim' ? 'วิธีรับเงินเบิกเพิ่ม' : 'วิธีคืนเงิน'}</h3>
          </div>
          {sum.mode === 'balanced' ? (
            <p className="muted" style={{ fontSize: 12, margin: 0 }}>
              <Icon name="info" size={12} /> ค่าใช้จ่ายจริงเท่ากับยอดที่ยืม — ไม่มีการคืนเงินหรือเบิกเพิ่ม ระบบจะปิดรายการทดรองเมื่อตรวจสอบเรียบร้อย
            </p>
          ) : (<>
            <div className="form-grid cols-4">
              <PrField label={sum.mode === 'claim' ? 'วิธีรับเงิน' : 'วิธีคืนเงิน'} required>
                <div className="seg">
                  {(sum.mode === 'claim' ? window.PA_METHODS : window.PA_METHODS.filter(m => m.v !== 'cheque')).map(m => (
                    <button key={m.v} className={'seg-btn' + (settleMethod === m.v ? ' active' : '')} onClick={() => setSettleMethod(m.v)}>{m.l}</button>
                  ))}
                </div>
              </PrField>
              <PrField label={sum.mode === 'claim' ? 'วันที่รับเงิน' : 'วันที่คืนเงิน'} required>
                <ErpDate value={settleDate} onChange={(v) => ((e) => setSettleDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
              </PrField>
              <PrField label="หมายเหตุการคืน/จ่าย" hint="(ถ้ามี)" span={2}>
                <input className="cfg-input" value={settleNote} onChange={(e) => setSettleNote(e.target.value)} placeholder="ข้อมูลเพิ่มเติม" />
              </PrField>
            </div>
            {settleMethod === 'transfer' && (
              <div className="form-grid cols-4" style={{ marginTop: 14 }}>
                <PrField label="ธนาคาร" required>
                  <select className="cfg-input" value={settleBank} onChange={(e) => setSettleBank(e.target.value)}>
                    {window.PA_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </PrField>
                <PrField label="เลขที่บัญชี" required>
                  <input className="cfg-input mono" value={settleAcctNo} onChange={(e) => setSettleAcctNo(e.target.value)} placeholder="เลขที่บัญชี" />
                </PrField>
                <PrField label="ชื่อบัญชี" span={2}>
                  <input className="cfg-input sr-auto" value={adv.memberName} readOnly />
                </PrField>
              </div>
            )}
            {settleMethod === 'cash' && (
              <div className="form-grid cols-4" style={{ marginTop: 14 }}>
                <PrField label={sum.mode === 'claim' ? 'สถานที่รับเงิน' : 'สถานที่คืนเงิน'} span={2}>
                  <input className="cfg-input" value={settlePlace} onChange={(e) => setSettlePlace(e.target.value)} placeholder="จุดรับ-คืนเงิน / ช่องจ่ายเงิน" />
                </PrField>
              </div>
            )}
            {settleMethod === 'cheque' && (
              <p className="muted" style={{ fontSize: 11.5, margin: '12px 0 0' }}>
                <Icon name="info" size={11} /> เบิกเพิ่มด้วยเช็ค — ระบบจะออกเช็คในขั้นตอนจ่ายเงิน (เมนู “จ่ายเงินด้วยเช็ค”)
              </p>
            )}
          </>)}
        </div>

        {/* ── ⑤ เอกสารหลักฐานการใช้จ่าย ── */}
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>เอกสารหลักฐานการใช้จ่าย</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <button className="btn sm" onClick={addDoc}><Icon name="attach" size={13} /> แนบเอกสาร</button>
            </div>
          </div>
          {docs.length === 0 ? (
            <div className="pa-doc-empty">
              <Icon name="attach" size={22} />
              <div>ยังไม่มีหลักฐานการใช้จ่าย — เช่น ใบเสร็จรับเงิน · ใบกำกับภาษี · ใบสำคัญรับเงิน · รายงานผลการเดินทาง</div>
            </div>
          ) : (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl pa-doc-tbl">
                <thead>
                  <tr>
                    <th style={{ minWidth: 150 }}>ประเภทเอกสาร</th>
                    <th style={{ width: 130 }}>เลขที่เอกสาร</th>
                    <th className="center" style={{ width: 130 }}>วันที่เอกสาร</th>
                    <th style={{ minWidth: 150 }}>ชื่อไฟล์</th>
                    <th style={{ minWidth: 120 }}>หมายเหตุ</th>
                    <th className="center" style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <select className="cfg-input pa-cell" value={d.docType} onChange={(e) => setDoc(i, 'docType', e.target.value)}>
                          {window.PR_DOC_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
                        </select>
                      </td>
                      <td><input className="cfg-input pa-cell" value={d.docNo} onChange={(e) => setDoc(i, 'docNo', e.target.value)} placeholder="—" /></td>
                      <td><ErpDate value={d.docDate} onChange={(v) => ((e) => setDoc(i, 'docDate', e.target.value))({ target: { value: v } })} className="cfg-input pa-cell" /></td>
                      <td>
                        <label className="pa-file">
                          <Icon name="upload" size={12} />
                          <input className="cfg-input pa-cell" value={d.fileName} onChange={(e) => setDoc(i, 'fileName', e.target.value)} placeholder="เลือก/ระบุชื่อไฟล์" />
                        </label>
                      </td>
                      <td><input className="cfg-input pa-cell" value={d.note} onChange={(e) => setDoc(i, 'note', e.target.value)} placeholder="—" /></td>
                      <td className="center">
                        <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delDoc(i)} title="ลบ"><Icon name="close" size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          )}
          <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            <Icon name="info" size={11} /> ผู้อัปโหลด/วันที่อัปโหลด บันทึกอัตโนมัติ · สถานะตรวจสอบเอกสารกำหนดในขั้นตรวจรับหลักฐาน
          </p>
        </div>
      </>)}

      <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
        <Icon name="calendar" size={13} /><span>วันที่ปัจจุบัน</span><b className="mono">{fmt.date(window.prToday())}</b>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดการคืน (อ่านอย่างเดียว) — รูปแบบ lt-head-card
// ════════════════════════════════════════════════════════════════════
function PrDetailView({ rec, onBack, onApprove, onSettle, onCancel }) {
  if (!rec) return null;
  const st = window.prStatus(rec.status);
  const sum = window.prSummary(rec.lines, rec.advanceAmount);
  const md = window.PR_MODES[sum.mode];
  const m = window.prMethod(rec.settleMethod);
  const overdue = rec.advanceDueDate && rec.returnDate && rec.returnDate > rec.advanceDueDate;

  return (
    <div data-screen-label="หน้ารายละเอียดคืนเงินทดรอง">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn sm" disabled><Icon name="print" /> พิมพ์</button>
        {rec.status === 'submitted' && (
          <>
            <button className="btn sm danger" onClick={() => onCancel(rec)}><Icon name="close" size={13} /> ยกเลิก</button>
            <button className="btn primary sm" onClick={() => onApprove(rec)}><Icon name="check" /> ตรวจสอบผ่าน</button>
          </>
        )}
        {rec.status === 'approved' && (
          <button className="btn primary sm" onClick={() => onSettle(rec)}><Icon name="money" /> ปิดรายการทดรอง</button>
        )}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="money" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">คืนเงินทดรอง — {window.prTypeLabel(rec.advanceType)}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>อ้างอิงยืม <b className="mono">{rec.advanceId}</b></span><span className="dot" />
              <span>{rec.memberName} ({rec.memberCode})</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            <span className={'chip ' + md.chip}>{md.short}{sum.mode !== 'balanced' ? ' ' + fmt.money(sum.absDiff, 0) : ''} บ.</span>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">วันที่ทำรายการ</span><span className="lt-date-v">{fmt.date(rec.recordDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">วันที่ส่งใช้ / คืน</span><span className={'lt-date-v' + (overdue ? ' pr-overdue' : '')}>{fmt.date(rec.returnDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ครบกำหนดคืน (ยืม)</span><span className="lt-date-v">{fmt.date(rec.advanceDueDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">{sum.mode === 'claim' ? 'วิธีรับเงิน' : 'วิธีคืนเงิน'}</span><span className="lt-date-v">{sum.mode === 'balanced' ? '—' : m.l}</span></div>
        </div>
      </div>

      {/* ผู้ขอ + สรุปยอด */}
      <div className="pa-two" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ข้อมูลผู้ขอยืม</h3></div>
          <PrKv label="ตำแหน่ง" value={rec.position} />
          <PrKv label="หน่วยงาน / สังกัด" value={rec.dept} />
          <PrKv label="ผู้บังคับบัญชา" value={rec.supervisor} />
          <PrKv label="วัตถุประสงค์การยืม" value={rec.purpose} />
          <PrKv label="ปีบัญชี / งวด" value={`${rec.fiscalYear || '—'} · ${rec.fiscalPeriod || '—'}`} mono />
        </div>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สรุปการส่งใช้</h3></div>
          <div className="pa-sum-box" style={{ width: '100%' }}>
            <div className="pa-sum-row"><span>ยอดที่ยืม</span><b className="mono">{fmt.money(sum.advanceAmount, 2)}</b></div>
            <div className="pa-sum-row"><span>ค่าใช้จ่ายจริง</span><b className="mono">{fmt.money(sum.actualTotal, 2)}</b></div>
            <div className={'pa-sum-row grand ' + (sum.mode === 'claim' ? 'pr-claim' : sum.mode === 'refund' ? 'pr-refund' : '')}>
              <span>{md.l}</span>
              <b className="mono">{sum.mode === 'balanced' ? fmt.money(0, 2) : (sum.mode === 'claim' ? '+' : '') + fmt.money(sum.absDiff, 2)}</b>
            </div>
          </div>
          {sum.mode !== 'balanced' && (
            <div className="form-grid cols-2" style={{ marginTop: 12 }}>
              <PrKv label={sum.mode === 'claim' ? 'วันที่รับเงิน' : 'วันที่คืนเงิน'} value={fmt.date(rec.settleDate)} />
              {rec.settleMethod === 'transfer'
                ? <PrKv label="บัญชี" value={`${rec.settleBank || ''} ${rec.settleAcctNo || ''}`} mono />
                : <PrKv label="สถานที่" value={rec.settlePlace || '—'} />}
              {rec.settleNote && <PrKv label="หมายเหตุ" value={rec.settleNote} span={2} />}
            </div>
          )}
        </div>
      </div>

      {/* ค่าใช้จ่ายจริง */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายการค่าใช้จ่ายจริง</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>#</th>
                <th>หมวด</th>
                <th>รายละเอียด</th>
                <th className="center">จำนวน</th>
                <th className="num">ราคา/หน่วย</th>
                <th className="num">จำนวนเงินจริง</th>
                <th>เลขที่ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody>
              {rec.lines.map((r, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>{r.cat}</td>
                  <td>{r.desc}</td>
                  <td className="center mono">{r.qty} {r.unit}</td>
                  <td className="num mono">{fmt.money(r.price, 2)}</td>
                  <td className="num mono">{fmt.money(window.prLineAmount(r), 2)}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{r.receiptNo || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="pa-line-tot"><td colSpan="5" className="right">รวมค่าใช้จ่ายจริง</td><td className="num mono">{fmt.money(sum.actualTotal, 2)}</td><td /></tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      {/* เอกสารหลักฐาน */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เอกสารหลักฐานการใช้จ่าย</h3></div>
        {(!rec.docs || rec.docs.length === 0) ? (
          <div className="muted" style={{ fontSize: 12 }}>— ไม่มีเอกสารหลักฐาน —</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ประเภทเอกสาร</th><th>เลขที่</th><th className="center">วันที่เอกสาร</th>
                  <th>ชื่อไฟล์</th><th>ผู้อัปโหลด</th><th className="center">วันที่อัปโหลด</th><th className="center">สถานะตรวจ</th>
                </tr>
              </thead>
              <tbody>
                {rec.docs.map((d, i) => {
                  const v = PR_VERIFY[d.verified] || PR_VERIFY.pending;
                  return (
                    <tr key={i}>
                      <td>{d.docType}</td>
                      <td className="mono">{d.docNo || '—'}</td>
                      <td className="center mono">{d.docDate ? fmt.date(d.docDate) : '—'}</td>
                      <td><span className="pa-file-name"><Icon name="attach" size={12} /> {d.fileName || '—'}</span></td>
                      <td>{d.by}</td>
                      <td className="center mono">{d.at ? fmt.date(d.at) : '—'}</td>
                      <td className="center"><span className={'pill ' + v.pill}>{v.l}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
        <Icon name="calendar" size={13} /><span>วันที่ปัจจุบัน</span><b className="mono">{fmt.date(window.prToday())}</b>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับ list / form / detail
// ════════════════════════════════════════════════════════════════════
function PettyReturnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = prUseState(window.prLoad);
  const [mode, setMode] = prUseState('list');
  const [current, setCurrent] = prUseState(null);

  const clearable = prUseMemo(() => window.prClearable(list), [list]);

  window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'คืนเงินทดรอง', onClick: () => setMode('list') }, { label: 'สร้างรายการคืนเงินทดรอง', current: true }]
      : mode === 'detail'
        ? [{ label: 'คืนเงินทดรอง', onClick: () => setMode('list') }, { label: current ? current.id : 'รายละเอียด', current: true }]
        : [{ label: 'คืนเงินทดรอง', current: true }],
    [mode, current]);

  const persist = (next) => { setList(next); window.prSave(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const submit = (rec, status) => {
    persist([rec, ...list]);
    const sum = window.prSummary(rec.lines, rec.advanceAmount);
    audit.log && audit.log({
      action: 'create', module: 'การเงิน — คืนเงินทดรอง',
      target: `${rec.id} · ${rec.memberName}`,
      summary: `${status === 'draft' ? 'บันทึกร่าง' : 'สร้าง'}รายการคืนเงินทดรอง ${rec.id} · อ้างอิง ${rec.advanceId} · ${window.PR_MODES[sum.mode].short} ${fmt.money(sum.absDiff, 2)} บาท`,
    });
    onToast && onToast(status === 'draft'
      ? `บันทึกร่างรายการคืน ${rec.id} แล้ว`
      : `บันทึกและส่งตรวจสอบรายการคืน ${rec.id} · ${rec.memberName} เรียบร้อย`);
    setMode('list');
  };

  const setStatus = (rec, status, verb) => {
    const updated = { ...rec, status };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: 'การเงิน — คืนเงินทดรอง',
      target: `${rec.id} · ${rec.memberName}`, summary: `${verb}รายการคืนเงินทดรอง ${rec.id}`,
    });
    onToast && onToast(`${verb}รายการคืน ${rec.id} แล้ว`);
  };

  return (
    <>
      {mode === 'list'
        ? <PrListView list={list} pending={clearable.length} onCreate={() => setMode('form')} onOpen={openDetail} />
        : mode === 'detail'
          ? <PrDetailView rec={current} onBack={() => setMode('list')}
              onApprove={(r) => setStatus(r, 'approved', 'ตรวจสอบผ่าน')}
              onSettle={(r) => setStatus(r, 'settled', 'ปิดรายการ')}
              onCancel={(r) => setStatus(r, 'cancelled', 'ยกเลิก')} />
          : <PrCreateForm list={list} clearable={clearable} onSubmit={submit} onCancel={() => setMode('list')} />}
    </>
  );
}

Object.assign(window, { PettyReturnPage, PrListView, PrCreateForm, PrDetailView });
