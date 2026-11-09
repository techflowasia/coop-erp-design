// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › รับชำระแบบกลุ่ม
//  ดึงรายการลูกหนี้ตัวแทนตามเงื่อนไข (ปี/เดือน/ช่วงสังกัด) เป็นชุด →
//  เลือกราย ระบุยอดชำระ → นำเข้าเป็นรายการที่จะรับชำระ → บันทึกรับชำระเป็นกลุ่ม
// ════════════════════════════════════════════════════════════════════
const { useState: abrUseState, useMemo: abrUseMemo } = React;

function AbrField({ label, children, hint }) {
  return (
    <label className="ap-field">
      <span className="ap-label">{label}{hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>{hint}</span>}</span>
      {children}
    </label>
  );
}

// ตารางรายการ (ใช้ซ้ำทั้งฝั่งดึงข้อมูลและฝั่งจะรับชำระ)
function AbrTable({ rows, editable, onToggle, onToggleAll, onPay, emptyText, minWidth }) {
  const allChecked = rows.length > 0 && rows.every(r => r.checked);
  const selCount = rows.filter(r => r.checked).length;
  const totAgent = rows.reduce((s, r) => s + r.agentAmt, 0);
  const totRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const totPay = rows.reduce((s, r) => s + (Number(r.pay) || 0), 0);
  return (
    <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
      <table className="tbl" style={{ minWidth: minWidth || 900 }}>
        <thead><tr>
          <th className="center" style={{ width: 40 }}>
            <input type="checkbox" className="ct-check" checked={!!allChecked} disabled={rows.length === 0}
              onChange={e => onToggleAll(e.target.checked)} />
          </th>
          <th style={{ width: 92 }}>ทะเบียน</th>
          <th style={{ minWidth: 190 }}>ชื่อ – สกุล</th>
          <th className="center" style={{ width: 110 }}>สังกัดสมาชิก</th>
          <th className="center" style={{ width: 108 }}>สังกัดตัวแทน</th>
          <th className="right" style={{ width: 120 }}>ยอดตัวแทน</th>
          <th className="right" style={{ width: 120 }}>ยอดคงเหลือ</th>
          <th className="right" style={{ width: 132 }}>ยอดชำระ</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 26 }}>{emptyText}</td></tr>}
          {rows.map(r => {
            const over = (Number(r.pay) || 0) - r.remaining > 0.005;
            return (
              <tr key={r.reg} className={r.checked ? 'selected' : ''}>
                <td className="center"><input type="checkbox" className="ct-check" checked={!!r.checked}
                  onChange={e => onToggle(r.reg, e.target.checked)} /></td>
                <td className="mono">{r.reg}</td>
                <td>{r.name}</td>
                <td className="center mono" style={{ fontSize: 12 }}>{r.memberDeptCode}</td>
                <td className="center mono" style={{ fontSize: 12 }}>{r.agentDeptCode}</td>
                <td className="right mono">{window.fmt.money(r.agentAmt, 2)}</td>
                <td className="right mono">{window.fmt.money(r.remaining, 2)}</td>
                <td className="right">
                  {editable ? (
                    <input className="cfg-input mono num" type="number" step="0.01" min="0" value={r.pay}
                      style={{ height: 30, textAlign: 'right', maxWidth: 112, color: over ? 'var(--danger)' : undefined }}
                      onChange={e => onPay(r.reg, e.target.value)} />
                  ) : (
                    <span className="mono" style={{ fontWeight: 600, color: (Number(r.pay) || 0) > 0 ? 'var(--brand-700)' : undefined }}>
                      {window.fmt.money(Number(r.pay) || 0, 2)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        {rows.length > 0 && (
          <tfoot><tr className="vch-foot">
            <td colSpan={5} className="right">รวม ({selCount} เลือก / {rows.length} ราย)</td>
            <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totAgent, 2)}</td>
            <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totRemaining, 2)}</td>
            <td className="right mono" style={{ fontWeight: 700, color: 'var(--brand-700)' }}>{window.fmt.money(totPay, 2)}</td>
          </tr></tfoot>
        )}
      </table>
    </div>
  );
}

function AgentBatchReceivePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'รับชำระแบบกลุ่ม', current: true }], []);

  const slipId = React.useRef(window.abrNextSlip()).current;
  const [year, setYear] = abrUseState('2569');
  const [month, setMonth] = abrUseState('07');
  const [txnDate, setTxnDate] = abrUseState(window.abrToday());
  const [rangeMode, setRangeMode] = abrUseState('all');
  const [rangeText, setRangeText] = abrUseState('');
  const [payType, setPayType] = abrUseState('');
  const [payDetail, setPayDetail] = abrUseState('');
  const [query, setQuery] = abrUseState('');
  const [applied, setApplied] = abrUseState('');            // คำค้นที่กด “ค้น” แล้ว
  const [avail, setAvail] = abrUseState(null);              // ฝั่งดึงข้อมูล [{...,checked,pay}]
  const [batch, setBatch] = abrUseState([]);                // ฝั่งจะรับชำระ

  const period = `${year}${month}`;

  const pull = () => {
    if (rangeMode === 'range' && !rangeText.trim()) { onToast && onToast('กรุณาระบุช่วงข้อมูลที่ต้องการดึง'); return; }
    const found = window.abrPull(rangeMode, rangeText);
    if (found.length === 0) { onToast && onToast('ไม่พบข้อมูลตามช่วงที่ระบุ'); return; }
    setAvail(found.map(r => ({ ...r, checked: false, pay: 0 })));
    setBatch([]); setQuery(''); setApplied('');
    onToast && onToast(`ดึงข้อมูลรับชำระลูกหนี้ตัวแทน งวด ${period} — ${found.length} ราย`);
  };

  const availFiltered = abrUseMemo(() => {
    if (!avail) return [];
    if (!applied.trim()) return avail;
    const q = applied.trim().toLowerCase();
    return avail.filter(r => (r.reg + ' ' + r.name).toLowerCase().includes(q));
  }, [avail, applied]);

  const toggleAvail = (reg, v) => setAvail(rs => rs.map(r => r.reg === reg ? { ...r, checked: v } : r));
  const toggleAvailAll = (v) => setAvail(rs => rs.map(r => availFiltered.some(f => f.reg === r.reg) ? { ...r, checked: v } : r));
  const payAvail = (reg, v) => setAvail(rs => rs.map(r => r.reg === reg ? { ...r, pay: v } : r));
  const toggleBatch = (reg, v) => setBatch(rs => rs.map(r => r.reg === reg ? { ...r, checked: v } : r));
  const toggleBatchAll = (v) => setBatch(rs => rs.map(r => ({ ...r, checked: v })));
  const payBatch = (reg, v) => setBatch(rs => rs.map(r => r.reg === reg ? { ...r, pay: v } : r));

  // นำเข้า — ย้ายรายการที่เลือก (ฝั่งดึงข้อมูล) มาเป็นรายการที่จะรับชำระ
  const moveIn = () => {
    const picked = (avail || []).filter(r => r.checked);
    if (picked.length === 0) { onToast && onToast('กรุณาเลือกรายการที่ต้องการนำเข้าอย่างน้อย 1 ราย'); return; }
    const moved = picked.map(r => ({ ...r, checked: false, pay: (Number(r.pay) || 0) > 0 ? r.pay : r.remaining }));
    setBatch(b => [...b, ...moved]);
    setAvail(rs => rs.filter(r => !r.checked));
    onToast && onToast(`นำเข้า ${picked.length} ราย เข้ารายการที่จะรับชำระ`);
  };
  // นำออก — ย้ายรายการที่เลือก (ฝั่งจะรับชำระ) กลับไปฝั่งดึงข้อมูล
  const moveOut = () => {
    const picked = batch.filter(r => r.checked);
    if (picked.length === 0) { onToast && onToast('กรุณาเลือกรายการที่ต้องการนำออกอย่างน้อย 1 ราย'); return; }
    const moved = picked.map(r => ({ ...r, checked: false }));
    setAvail(rs => [...(rs || []), ...moved].sort((a, b) => a.reg.localeCompare(b.reg)));
    setBatch(b => b.filter(r => !r.checked));
    onToast && onToast(`นำออก ${picked.length} ราย กลับไปยังรายการที่ดึงมา`);
  };

  const batchPayTotal = abrUseMemo(() => batch.reduce((s, r) => s + (Number(r.pay) || 0), 0), [batch]);
  const overpay = batch.some(r => (Number(r.pay) || 0) - r.remaining > 0.005);
  const canSave = batch.length > 0 && batchPayTotal > 0 && !overpay && !!payType;

  const save = () => {
    if (batch.length === 0) { onToast && onToast('ยังไม่มีรายการที่จะรับชำระ — กรุณานำเข้ารายการก่อน'); return; }
    if (!payType) { onToast && onToast('กรุณาเลือกประเภทเงินที่รับชำระ'); return; }
    if (overpay) { onToast && onToast('ยอดชำระบางรายเกินยอดคงเหลือ — กรุณาตรวจสอบ'); return; }
    if (batchPayTotal <= 0) { onToast && onToast('กรุณาระบุยอดชำระ'); return; }
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — รับชำระแบบกลุ่ม',
      target: `${slipId} งวด ${period}`,
      summary: `รับชำระลูกหนี้ตัวแทนแบบกลุ่ม ${batch.length} ราย รวม ${window.fmt.money(batchPayTotal, 2)} บาท (${window.abrPayLabel(payType)})`,
    });
    onToast && onToast(`บันทึกรับชำระแบบกลุ่ม ${slipId} — ${batch.length} ราย รวม ${window.fmt.money(batchPayTotal, 2)} บาท เรียบร้อย`);
    setBatch([]); setAvail(null); setQuery(''); setApplied('');
  };

  return (
    <div data-screen-label="หน้ารับชำระแบบกลุ่ม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับชำระแบบกลุ่ม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ดึงรายการลูกหนี้ตัวแทนตามเงื่อนไขเป็นชุด เลือกและระบุยอดชำระ นำเข้าเป็นรายการที่จะรับชำระ แล้วบันทึกรับชำระเป็นกลุ่ม
          </div>
        </div>
        <span className="spacer" />
        <span className="mono muted" style={{ fontSize: 12 }}>ใบทำรายการ {slipId}</span>
      </div>

      {/* ── เงื่อนไขการดึงข้อมูล + ช่วงข้อมูล ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เงื่อนไขการดึงข้อมูลรับชำระลูกหนี้ตัวแทน</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AbrField label="ประจำปี">
            <input className="cfg-input mono" value={year} maxLength={4}
              onChange={e => { setYear(e.target.value.replace(/\D/g, '').slice(0, 4)); setAvail(null); setBatch([]); }} />
          </AbrField>
          <AbrField label="ประจำเดือน">
            <select className="cfg-input" value={month} onChange={e => { setMonth(e.target.value); setAvail(null); setBatch([]); }}>
              {window.ABR_MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </AbrField>
          <AbrField label="วันที่ทำรายการ">
            <ErpDate value={txnDate} onChange={(v) => (e => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </AbrField>

          <AbrField label="ช่วงข้อมูล">
            <select className="cfg-input" value={rangeMode} onChange={e => { setRangeMode(e.target.value); setAvail(null); setBatch([]); }}>
              <option value="all">ทั้งหมด</option>
              <option value="range">ระบุช่วงสังกัดสมาชิก</option>
            </select>
          </AbrField>
          <AbrField label="ระบุช่วงข้อมูล">
            <input className="cfg-input mono" value={rangeText} disabled={rangeMode === 'all'}
              placeholder={rangeMode === 'all' ? 'ดึงทุกสังกัดสมาชิก' : 'เช่น 110, 120, 140 - 150'}
              onChange={e => setRangeText(e.target.value)} />
          </AbrField>
          <div className="ap-field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary block" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
          </div>
        </div>
        <div className="ap-hint muted">
          <Icon name="info" size={13} /> ใส่ข้อมูลหรือช่วงข้อมูลที่ต้องการประมวลผลและคั่นด้วยเครื่องหมาย , หรือ - เช่น 110, 120, 140 - 150
        </div>
      </div>

      {/* ── ประเภทการชำระ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ประเภทการชำระ</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: '220px 1fr' }}>
          <AbrField label="ประเภทเงิน">
            <select className="cfg-input" value={payType} onChange={e => setPayType(e.target.value)}>
              {window.ABR_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </AbrField>
          <AbrField label="รายละเอียดการชำระ">
            <input className="cfg-input" value={payDetail} placeholder="เช่น เลขที่เช็ค / บัญชีที่โอน / อ้างอิงการนำส่ง"
              onChange={e => setPayDetail(e.target.value)} />
          </AbrField>
        </div>
      </div>

      {/* ── ตารางรายการที่ดึงมา ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>รายการลูกหนี้ตัวแทนที่ดึงมา</span>
          <div className="search" style={{ maxWidth: 260, marginLeft: 8 }}>
            <Icon name="search" size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} disabled={!avail}
              onKeyDown={e => { if (e.key === 'Enter') setApplied(query); }}
              placeholder="ค้นหาทะเบียน / ชื่อสมาชิก…" />
          </div>
          <button className="btn sm" disabled={!avail} onClick={() => setApplied(query)}>ค้น</button>
          {applied && <button className="btn text sm" onClick={() => { setQuery(''); setApplied(''); }}>ล้าง</button>}
          <span className="spacer" />
          {avail && <span className="muted" style={{ fontSize: 12 }}>เลือก {avail.filter(r => r.checked).length} / {avail.length} ราย</span>}
        </div>
        <AbrTable rows={availFiltered} editable minWidth={960}
          onToggle={toggleAvail} onToggleAll={toggleAvailAll} onPay={payAvail}
          emptyText={avail ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'กำหนดเงื่อนไขแล้วกด “ดึงข้อมูล” เพื่อแสดงรายการลูกหนี้ตัวแทน'} />
      </div>

      {/* ── นำเข้า / นำออก ── */}
      <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'center', gap: 10 }}>
        <button className="btn primary" onClick={moveIn} disabled={!avail}><Icon name="download" /> นำเข้า</button>
        <button className="btn" onClick={moveOut} disabled={batch.length === 0}><Icon name="upload" /> นำออก</button>
      </div>

      {/* ── ตารางรายการที่จะรับชำระ ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>รายการที่จะรับชำระ</span>
          <span className="gc-count">{batch.length} ราย</span>
          <span className="spacer" />
          {batch.length > 0 && <span className="muted mono" style={{ fontSize: 12 }}>รวมยอดชำระ {window.fmt.money(batchPayTotal, 2)} บาท</span>}
        </div>
        <AbrTable rows={batch} editable minWidth={960}
          onToggle={toggleBatch} onToggleAll={toggleBatchAll} onPay={payBatch}
          emptyText="ยังไม่มีรายการ — เลือกรายการด้านบนแล้วกด “นำเข้า”" />
      </div>

      {overpay && (
        <div className="ap-hint" style={{ color: 'var(--danger)' }}>
          <Icon name="info" size={13} /> ยอดชำระบางรายเกินยอดคงเหลือ — กรุณาตรวจสอบก่อนบันทึก
        </div>
      )}

      <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn primary" onClick={save} disabled={!canSave}><Icon name="check" /> บันทึกรับชำระ</button>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เลือกรายการจาก “รายการที่ดึงมา” แล้วกด “นำเข้า” เพื่อย้ายมาเป็น “รายการที่จะรับชำระ” · ปรับยอดชำระต่อรายได้ก่อนบันทึก
      </div>
    </div>
  );
}

Object.assign(window, { AgentBatchReceivePage });
