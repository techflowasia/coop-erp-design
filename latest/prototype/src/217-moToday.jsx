// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — ธนาณัติ (Postal Money Order)
//  ────────────────────────────────────────────────────────────────────
//  ทะเบียนรับธนาณัติ (list) · แบบฟอร์มบันทึกธนาณัติ (form) · รายละเอียด (view)
//  ค่าคงที่ + helpers จาก data-money-order.js · ใช้ MemberSearchField / DN_MEMBERS
// ════════════════════════════════════════════════════════════════════
const { useState: moUseState, useMemo: moUseMemo } = React;

const moToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const moNum = (v) => Number(String(v).replace(/,/g, '')) || 0;

// ── ฟิลด์ (label เล็กด้านบน + control) ──────────────────────────────
function MoFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function MoRO({ value, mono, placeholder, auto }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (auto ? ' icr-auto' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}
// ช่องกรอกจำนวนเงินในตาราง
function MoAmt({ value, onChange }) {
  return (
    <input type="text" inputMode="decimal" className="cfg-input mono po-amt"
      value={window.fmt.money(moNum(value), 2)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(moNum(e.target.value.replace(/[^\d.]/g, '')))} />
  );
}

// ── ช่องอ้างอิง "เลขที่ สัญญา/เงินฝาก" — ค้นหา + popup เลือกรายการ ────
//   รายการที่ให้เลือกกรองตาม "ประเภท" ของแถว (loan/share/deposit) และสมาชิกที่เลือก
function MoRefPickModal({ type, member, onPick, onClose }) {
  const dt = window.moDetailType(type);
  const all = moUseMemo(() => window.moRefCandidates(type, member), [type, member]);
  const [q, setQ] = moUseState('');
  const [dirty, setDirty] = moUseState(false);
  const results = moUseMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter(r => (r.ref + ' ' + r.label + ' ' + (r.sub || '')).toLowerCase().includes(s));
  }, [q, all]);
  const onSearch = (v) => { setQ(v); setDirty(true); };
  const reset = () => { setQ(''); setDirty(false); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 720 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหา{dt.refLabel} — {dt.l}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf gc-sf-wide">
              <span>{dt.refLabel}</span>
              <input value={q} onChange={(e) => onSearch(e.target.value)} autoFocus
                     placeholder={`ค้นหา${dt.refLabel} หรือรายละเอียด…`} className="mono" />
            </label>
            <div className="gc-sf-actions">
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>
          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการ{dt.l}ของ{member ? ` ${member.name}` : 'สมาชิกที่เลือก'}{' '}
            <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl cs-tbl">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>{dt.refLabel}</th>
                  <th>รายละเอียด</th>
                  <th className="center" style={{ width: 96 }}>สถานะ</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">
                    {!member ? 'กรุณาเลือกสมาชิกก่อน จึงจะค้นหารายการได้'
                            : dirty ? 'ไม่พบรายการที่ตรงกับเงื่อนไข'
                            : `ไม่มีรายการ${dt.l}ของสมาชิกรายนี้`}
                  </td></tr>
                ) : results.map((r, i) => (
                  <tr key={i} className="clickable cs-crow" onClick={() => onPick(r)}>
                    <td className="mono">{r.ref}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.label}</div>
                      {r.sub && <div className="muted" style={{ fontSize: 11 }}>{r.sub}</div>}
                    </td>
                    <td className="center">{r.status ? <span className="chip">{r.status}</span> : '—'}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(r); }} title={`เลือก${dt.refLabel}`}>
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

function MoRefField({ value, type, member, onPick }) {
  const dt = window.moDetailType(type);
  const noRef = dt.refLabel === '—';
  const [open, setOpen] = moUseState(false);
  if (noRef) return <input className="cfg-input mono" value="" disabled placeholder="—" />;
  return (
    <>
      <button type="button" className="gc-member-trigger lb-trigger mo-ref-trigger" onClick={() => setOpen(true)}>
        {value ? (
          <>
            <span className="gc-mt-code mono">{value}</span>
            <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
          </>
        ) : (
          <>
            <Icon name="search" size={14} />
            <span className="muted">{`ค้นหา${dt.refLabel}…`}</span>
            <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
          </>
        )}
      </button>
      {open && (
        <MoRefPickModal type={type} member={member}
          onPick={(r) => { onPick(r); setOpen(false); }}
          onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกธนาณัติ
// ════════════════════════════════════════════════════════════════════
function MoneyOrderForm({ nextNo, onSave, onCancel, onToast }) {
  const fmt = window.fmt;
  const today = moToday();

  const [payerType, setPayerType]     = moUseState('member');
  const [member, setMember]           = moUseState(null);
  const [externalName, setExternalName] = moUseState('');
  const [transferDate, setTransferDate] = moUseState(today);
  const [moDate, setMoDate]           = moUseState(today);
  const [moNo, setMoNo]               = moUseState('');
  const [payType, setPayType]         = moUseState(window.MO_PAY_TYPES[0]);
  const [cashStatus, setCashStatus]   = moUseState('pending');
  const [fee, setFee]                 = moUseState(0);
  const [postZip, setPostZip]         = moUseState('');
  const [postName, setPostName]       = moUseState('');
  const [items, setItems]             = moUseState([{ type: 'loan', ref: '', detail: '', amount: 0 }]);
  const [error, setError]             = moUseState('');

  const memberName = payerType === 'member' ? (member ? member.name : '') : externalName;
  const deptLabel = payerType === 'member' && member ? window.affilLabel(member.deptCode, member.dept) : '';

  const total = moUseMemo(() => window.moItemsTotal(items), [items]);
  const net = total - moNum(fee);

  // เลือกไปรษณีย์จากรหัส → เติมชื่อ / เลือกจากชื่อ → เติมรหัส
  const onZip = (z) => {
    setPostZip(z);
    const p = window.moPostByZip(z);
    if (p) setPostName(p.name);
  };
  const onPostName = (name) => {
    setPostName(name);
    const p = window.MO_POST_OFFICES.find(o => o.name === name);
    if (p) setPostZip(p.zip);
  };

  const setItem = (i, patch) => setItems(rs => rs.map((r, x) => x === i ? { ...r, ...patch } : r));
  const addRow = () => setItems(rs => [...rs, { type: 'loan', ref: '', detail: '', amount: 0 }]);
  const delRow = (i) => setItems(rs => rs.length > 1 ? rs.filter((_, x) => x !== i) : rs);

  const validate = () => {
    if (payerType === 'member' && !member) return 'กรุณาค้นหาและเลือกสมาชิกก่อนบันทึก';
    if (payerType === 'external' && !externalName.trim()) return 'กรุณาระบุชื่อผู้ส่งธนาณัติ (บุคคลภายนอก)';
    if (!moNo.trim()) return 'กรุณาระบุเลขที่ธนาณัติ';
    if (!moDate) return 'กรุณาระบุวันที่บนธนาณัติ';
    if (!postZip.trim()) return 'กรุณาระบุรหัสไปรษณีย์ต้นทางของธนาณัติ';
    const valid = items.filter(r => moNum(r.amount) > 0);
    if (!valid.length) return 'กรุณาระบุรายการความประสงค์ชำระเงินอย่างน้อย 1 รายการ (จำนวนเงินมากกว่า 0)';
    if (moNum(fee) > total) return 'ค่าธรรมเนียมต้องไม่เกินยอดรวมธนาณัติ';
    return '';
  };

  const submit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const rec = {
      id: nextNo, transferDate, moDate, payerType,
      memberCode: payerType === 'member' ? member.code : '',
      memberName, deptCode: payerType === 'member' && member ? member.deptCode : '',
      dept: payerType === 'member' && member ? member.dept : '',
      moNo: moNo.trim(), payType, cashStatus, fee: moNum(fee),
      postZip: postZip.trim(), postName: postName.trim(),
      items: items.filter(r => moNum(r.amount) > 0).map(r => ({ ...r, amount: moNum(r.amount) })),
      by: 'จันทร์เพ็ญ มาลี', createdAt: new Date().toISOString(),
    };
    onSave(rec);
  };

  const demoMembers = (window.DN_MEMBERS || []).slice(0, 3);

  return (
    <div data-screen-label="บันทึกธนาณัติ">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="mail" size={20} /></span>
          <div>
            <h1>บันทึกธนาณัติ</h1>
            <div className="icr-form-sub">ระบบงานการเงิน · รับชำระเงินสมาชิกทางธนาณัติ / ตั๋วแลกเงินไปรษณีย์</div>
          </div>
        </div>
        <span className="spacer" />
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ข้อมูลเอกสาร / สมาชิก + การ์ดยอดเงิน ── */}
      <div className="po-top-grid">
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลธนาณัติ / สมาชิก</h3></div>
          <div className="icr-strip">
            <MoFld label="เลขที่เอกสาร" w={150}><MoRO value={nextNo} mono auto /></MoFld>
            <MoFld label="วันที่โอน" w={150} required>
              <ErpDate value={transferDate} onChange={(v) => ((e) => setTransferDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </MoFld>
            <MoFld label="วันที่บนธนาณัติ" w={150} required>
              <ErpDate value={moDate} onChange={(v) => ((e) => setMoDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </MoFld>
            <MoFld label="เลขที่ธนาณัติ" grow w={170} required>
              <input className="cfg-input mono" value={moNo} onChange={(e) => setMoNo(e.target.value)} placeholder="เลขที่บนธนาณัติ" />
            </MoFld>

            <MoFld label="ประเภทผู้ชำระ" w={150} required>
              <select className="cfg-input" value={payerType}
                      onChange={(e) => { setPayerType(e.target.value); setMember(null); setExternalName(''); }}>
                {window.MO_PAYER_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </MoFld>
            {payerType === 'member' ? (
              <MoFld label="เลขสมาชิก" grow w={240} required>
                <MemberSearchField member={member} onPick={setMember}
                  source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
                  title="ค้นหาสมาชิก — บันทึกธนาณัติ" changeLabel="เปลี่ยน"
                  placeholder="ค้นหาเลขสมาชิก / ชื่อ…" />
              </MoFld>
            ) : (
              <MoFld label="ชื่อผู้ส่งธนาณัติ" grow w={240} required>
                <input className="cfg-input" value={externalName} onChange={(e) => setExternalName(e.target.value)} placeholder="ชื่อ-นามสกุล ผู้ส่ง" />
              </MoFld>
            )}
            <MoFld label="ชื่อสมาชิก" grow w={200}><MoRO value={memberName} placeholder="—" /></MoFld>

            <MoFld label="ประเภทการชำระ" w={180} required>
              <select className="cfg-input" value={payType} onChange={(e) => setPayType(e.target.value)}>
                {window.MO_PAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MoFld>
            <MoFld label="สังกัด" grow w={220}><MoRO value={deptLabel} placeholder="—" /></MoFld>
            <MoFld label="การขึ้นเงิน" w={160} required>
              <select className="cfg-input" value={cashStatus} onChange={(e) => setCashStatus(e.target.value)}>
                {Object.keys(window.MO_CASH_STATUS).map(k => <option key={k} value={k}>{window.MO_CASH_STATUS[k].l}</option>)}
              </select>
            </MoFld>

            <MoFld label="ค่าธรรมเนียม" w={150}>
              <input className="cfg-input mono" style={{ textAlign: 'right' }} inputMode="decimal"
                     value={fmt.money(moNum(fee), 2)} onFocus={(e) => e.target.select()}
                     onChange={(e) => setFee(moNum(e.target.value.replace(/[^\d.]/g, '')))} />
            </MoFld>
            <MoFld label="รหัสไปรษณีย์ (ธนาณัติ)" w={170} required>
              <input className="cfg-input mono" list="mo-zip-list" value={postZip}
                     onChange={(e) => onZip(e.target.value)} placeholder="เช่น 25110" />
              <datalist id="mo-zip-list">
                {window.MO_POST_OFFICES.map(p => <option key={p.zip} value={p.zip}>{p.name}</option>)}
              </datalist>
            </MoFld>
            <MoFld label="ชื่อไปรษณีย์" grow w={240}>
              <select className="cfg-input" value={postName} onChange={(e) => onPostName(e.target.value)}>
                <option value="">— เลือกที่ทำการไปรษณีย์ —</option>
                {window.MO_POST_OFFICES.map(p => <option key={p.zip} value={p.name}>{p.name} ({p.zip})</option>)}
              </select>
            </MoFld>
          </div>
        </div>

        <div className="po-total-card">
          <div className="po-total-head"><span>จำนวนเงิน</span><Icon name="mail" size={14} /></div>
          <div className="po-total-value">{fmt.money(total, 2)}</div>
          <div className="po-total-unit">บาท</div>
          <div className="po-total-break">
            <div><span>ค่าธรรมเนียม</span><b>{fmt.money(moNum(fee), 2)}</b></div>
            <div><span>ยอดสุทธิที่ขึ้นเงิน</span><b>{fmt.money(net, 2)}</b></div>
            <div><span>สถานะ</span><b>{window.moCashStatus(cashStatus).l}</b></div>
          </div>
        </div>
      </div>

      {/* ── รายละเอียดธนาณัติ (ความประสงค์ชำระเงิน) ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายละเอียดธนาณัติ</h3>
          <span className="head-actions">
            <button className="btn text sm" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มแถว</button>
          </span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl po-tbl mo-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 54 }}>ลำดับ</th>
                <th style={{ width: 190 }}>ประเภท</th>
                <th style={{ width: 190 }}>เลขที่ สัญญา/เงินฝาก</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 150 }}>จำนวนเงิน</th>
                <th className="center" style={{ width: 48 }} />
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => {
                const dt = window.moDetailType(r.type);
                const noRef = dt.refLabel === '—';
                return (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <select className="cfg-input" value={r.type} onChange={(e) => setItem(i, { type: e.target.value })}>
                        {window.MO_DETAIL_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                    </td>
                    <td>
                      <MoRefField value={r.ref} type={r.type} member={payerType === 'member' ? member : null}
                                  onPick={(rec) => setItem(i, { ref: rec.ref, detail: r.detail || rec.label })} />
                    </td>
                    <td>
                      <input className="cfg-input" value={r.detail}
                             onChange={(e) => setItem(i, { detail: e.target.value })} placeholder="รายละเอียดรายการ" />
                    </td>
                    <td className="num"><MoAmt value={r.amount} onChange={(v) => setItem(i, { amount: v })} /></td>
                    <td className="center">
                      <button className="bud-act" title="ลบแถว" onClick={() => delRow(i)} disabled={items.length <= 1}>
                        <Icon name="trash" size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="po-foot">
                <td colSpan={4} className="right">รวม</td>
                <td className="num mono po-strong">{fmt.money(total, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div></div>
        <div className="po-note">
          <b>หมายเหตุ:</b> บันทึกความประสงค์ชำระเงินของสมาชิกตามที่แจ้งมากับธนาณัติ · ยอดรวมทุกรายการต้องเท่ากับจำนวนเงินหน้าธนาณัติ · หักค่าธรรมเนียม (ถ้ามี) ก่อนขึ้นเงิน
        </div>
      </div>

      {/* ── แถบปุ่มคำสั่ง ── */}
      <div className="po-actionbar">
        <button className="btn primary" onClick={submit}><Icon name="check" size={14} /> บันทึกธนาณัติ</button>
        <button className="btn" onClick={onCancel}><Icon name="close" size={14} /> ยกเลิก</button>
        {payerType === 'member' && demoMembers.length > 0 && (
          <span className="po-demo muted">
            ตัวอย่าง:&nbsp;
            {demoMembers.map((m, i) => (
              <React.Fragment key={m.code}>
                {i > 0 && ' · '}
                <button className="ct-example mono" onClick={() => setMember(m)}>{m.code}</button>
              </React.Fragment>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดธนาณัติ (read-only)
// ════════════════════════════════════════════════════════════════════
function MoneyOrderDetail({ rec, onBack, onCash, onDelete }) {
  const fmt = window.fmt;
  const st = window.moCashStatus(rec.cashStatus);
  const total = window.moItemsTotal(rec.items);
  const net = total - (Number(rec.fee) || 0);

  return (
    <div data-screen-label="รายละเอียดธนาณัติ">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" size={13} /> กลับทะเบียน</button>
        <span className="spacer" />
        {rec.cashStatus === 'pending' && (
          <button className="btn primary sm" onClick={() => onCash(rec)}><Icon name="check" size={13} /> บันทึกขึ้นเงินแล้ว</button>
        )}
        <button className="btn sm danger" onClick={() => onDelete(rec)}><Icon name="trash" size={13} /> ลบ</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <span className="lt-head-ico"><Icon name="mail" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="lt-head-title">ธนาณัติ {rec.id}</h2>
            <div className="lt-head-meta">
              <span className="mono">เลขที่ธนาณัติ {rec.moNo}</span>
              <span className="dot" />
              <span>{rec.payType}</span>
              <span className="dot" />
              <span>{rec.memberName || '—'}{rec.memberCode ? ` · ${rec.memberCode}` : ''}</span>
              <span className={'pill ' + st.pill} style={{ marginLeft: 4 }}>{st.l}</span>
            </div>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">วันที่โอน</span><span className="lt-date-v">{fmt.date(rec.transferDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">วันที่บนธนาณัติ</span><span className="lt-date-v">{fmt.date(rec.moDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ไปรษณีย์ต้นทาง</span><span className="lt-date-v">{rec.postName || '—'} {rec.postZip ? `(${rec.postZip})` : ''}</span></div>
          <div className="lt-date"><span className="lt-date-k">สังกัด</span><span className="lt-date-v">{rec.dept ? window.affilLabel(rec.deptCode, rec.dept) : '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">จำนวนเงิน</span><span className="lt-date-v mono">฿ {fmt.money(total, 2)}</span></div>
        </div>
      </div>

      <div className="search-card">
        <div className="section-head"><span className="head-bar" /><h3>รายละเอียดธนาณัติ</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 54 }}>ลำดับ</th>
                <th style={{ width: 200 }}>ประเภท</th>
                <th style={{ width: 190 }}>เลขที่ สัญญา/เงินฝาก</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 150 }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {rec.items.map((r, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>{window.moDetailType(r.type).l}</td>
                  <td className="mono">{r.ref || '—'}</td>
                  <td>{r.detail || '—'}</td>
                  <td className="num mono">{fmt.money(r.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="po-foot">
                <td colSpan={4} className="right">รวม</td>
                <td className="num mono po-strong">{fmt.money(total, 2)}</td>
              </tr>
              {(Number(rec.fee) || 0) > 0 && (
                <>
                  <tr className="po-foot"><td colSpan={4} className="right">หักค่าธรรมเนียม</td><td className="num mono">{fmt.money(rec.fee, 2)}</td></tr>
                  <tr className="po-foot"><td colSpan={4} className="right">ยอดสุทธิที่ขึ้นเงิน</td><td className="num mono po-strong">{fmt.money(net, 2)}</td></tr>
                </>
              )}
            </tfoot>
          </table>
        </div></div>
        <div className="lt-list-foot muted" style={{ marginTop: 10 }}>
          <Icon name="info" size={12} /> บันทึกโดย {rec.by} · {fmt.date(rec.createdAt)}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — ทะเบียนรับธนาณัติ
// ════════════════════════════════════════════════════════════════════
function MoneyOrderPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const fmt = window.fmt;
  const [list, setList] = moUseState(window.moLoad);
  const [formKey, setFormKey] = moUseState(0);   // remount form after save/reset

  const persist = (next) => { setList(next); window.moSave(next); };

  // เมนูเปิดตรงเข้าแบบฟอร์มบันทึกธนาณัติ (ไม่มีหน้าทะเบียน/รายการ)
  const saveNew = (rec) => {
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'การเงิน — ธนาณัติ', target: rec.id,
      summary: `บันทึกธนาณัติ ${rec.id} · ${rec.memberName || '—'} · ${fmt.money(window.moItemsTotal(rec.items), 2)} บาท`,
    });
    onToast && onToast(`บันทึกธนาณัติ ${rec.id} เรียบร้อยแล้ว`);
    setFormKey(k => k + 1);   // เคลียร์ฟอร์มพร้อมบันทึกรายการถัดไป
  };

  return (
    <MoneyOrderForm key={formKey} nextNo={window.moNextNo(list)}
      onSave={saveNew} onCancel={() => setFormKey(k => k + 1)} onToast={onToast} />
  );
}

Object.assign(window, { MoneyOrderPage });
