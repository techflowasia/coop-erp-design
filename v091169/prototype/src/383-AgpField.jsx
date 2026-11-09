// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ทำรายการรับชำระหุ้นพูนทวี
//  ดึงยอดเรียกเก็บหุ้นพูนทวีที่ตัวแทนนำส่งแทนสมาชิกตามงวด → เลือกราย →
//  ระบุยอดชำระ → นำเข้าเพื่อบันทึกรับชำระ
// ════════════════════════════════════════════════════════════════════
const { useState: agpUseState } = React;

function AgpField({ label, children }) {
  return (
    <label className="ap-field">
      <span className="ap-label">{label}</span>
      {children}
    </label>
  );
}

function AgentPoontaweePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ทำรายการรับชำระหุ้นพูนทวี', current: true }], []);

  const slipId = React.useRef(window.agpNextSlip()).current;
  const [year, setYear] = agpUseState('2569');
  const [month, setMonth] = agpUseState('07');
  const [txnDate, setTxnDate] = agpUseState(window.agpToday());
  const [rangeMode, setRangeMode] = agpUseState('all');
  const [rangeText, setRangeText] = agpUseState('');
  const [payType, setPayType] = agpUseState('cash');
  const [payNote, setPayNote] = agpUseState('');
  const [query, setQuery] = agpUseState('');
  const [rows, setRows] = agpUseState(null);        // ผลการดึง [{seq, ...row, checked, amount}]
  const [posted, setPosted] = agpUseState(false);

  const period = `${year}${month}`;

  const pull = () => {
    if (rangeMode === 'range' && !rangeText.trim()) { onToast && onToast('กรุณาระบุช่วงข้อมูลที่ต้องการดึง'); return; }
    const found = window.agpPull(rangeMode, rangeText);
    if (found.length === 0) { onToast && onToast('ไม่พบข้อมูลตามช่วงที่ระบุ'); return; }
    setRows(found.map(r => ({ ...r, checked: true, amount: r.remaining })));
    setPosted(false);
    onToast && onToast(`ดึงข้อมูลรับชำระหุ้นพูนทวี งวด ${period} — ${found.length} ราย`);
  };

  const setRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const filtered = rows ? rows.filter(r => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (r.reg + ' ' + r.name).toLowerCase().includes(q);
  }) : [];
  const selected = rows ? rows.filter(r => r.checked) : [];
  const payTotal = selected.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totAgent = rows ? rows.reduce((s, r) => s + r.agentAmt, 0) : 0;
  const totRemaining = rows ? rows.reduce((s, r) => s + r.remaining, 0) : 0;
  const allChecked = rows && rows.length > 0 && rows.every(r => r.checked);

  const importTxn = () => {
    if (!rows) { onToast && onToast('กรุณาดึงข้อมูลก่อนนำเข้า'); return; }
    if (selected.length === 0) { onToast && onToast('กรุณาเลือกรายการที่ต้องการรับชำระอย่างน้อย 1 ราย'); return; }
    if (payTotal <= 0) { onToast && onToast('กรุณาระบุยอดชำระ'); return; }
    setPosted(true);
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — ทำรายการรับชำระหุ้นพูนทวี',
      target: `${slipId} งวด ${period}`,
      summary: `รับชำระหุ้นพูนทวี ${selected.length} ราย รวม ${window.fmt.money(payTotal, 2)} บาท (${window.agpPayLabel(payType)})`,
    });
    onToast && onToast(`นำเข้ารับชำระหุ้นพูนทวี ${selected.length} ราย รวม ${window.fmt.money(payTotal, 2)} บาท เรียบร้อย`);
  };
  const exportTxn = () => {
    if (!rows) { onToast && onToast('กรุณาดึงข้อมูลก่อนนำออก'); return; }
    onToast && onToast(`นำออกรายการรับชำระหุ้นพูนทวี ${selected.length || rows.length} ราย (.xlsx) แล้ว`);
  };

  return (
    <div data-screen-label="หน้าทำรายการรับชำระหุ้นพูนทวี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ทำรายการรับชำระหุ้นพูนทวี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ดึงยอดเรียกเก็บหุ้นพูนทวีที่ตัวแทนนำส่งแทนสมาชิกตามงวด เลือกรายและระบุยอดชำระ แล้วนำเข้าเพื่อบันทึกรับชำระ
          </div>
        </div>
        <span className="spacer" />
        <span className="mono muted" style={{ fontSize: 12 }}>ใบทำรายการ {slipId}</span>
      </div>

      {/* ── เงื่อนไขการดึงข้อมูล ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เงื่อนไขการดึงข้อมูลรับชำระลูกหนี้ตัวแทน</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AgpField label="ประจำปี">
            <input className="cfg-input mono" value={year} maxLength={4}
              onChange={e => { setYear(e.target.value.replace(/\D/g, '').slice(0, 4)); setRows(null); }} />
          </AgpField>
          <AgpField label="ประจำเดือน">
            <select className="cfg-input" value={month} onChange={e => { setMonth(e.target.value); setRows(null); }}>
              {window.AGP_MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </AgpField>
          <AgpField label="วันที่ทำรายการ">
            <ErpDate value={txnDate} onChange={(v) => (e => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </AgpField>
          <AgpField label="ช่วงข้อมูล">
            <select className="cfg-input" value={rangeMode} onChange={e => { setRangeMode(e.target.value); setRows(null); }}>
              <option value="all">ทั้งหมด</option>
              <option value="range">ระบุช่วงสังกัดตัวแทน</option>
            </select>
          </AgpField>
          <AgpField label="ระบุช่วงข้อมูล">
            <input className="cfg-input mono" value={rangeText} disabled={rangeMode === 'all'}
              placeholder={rangeMode === 'all' ? 'ดึงทุกสังกัดตัวแทน' : 'เช่น 0107 หรือ 0106 - 0108'}
              onChange={e => setRangeText(e.target.value)} />
          </AgpField>
          <div className="ap-field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary block" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
          </div>
        </div>
        <div className="ap-hint muted">
          <Icon name="info" size={13} /> ใส่ข้อมูลหรือช่วงข้อมูลที่ต้องการประมวลผลและคั่นด้วยเครื่องหมาย , หรือ - เช่น 0106, 0107, 0106 - 0108
        </div>
      </div>

      {/* ── ประเภทการชำระ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ประเภทการชำระ</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: '220px 1fr' }}>
          <AgpField label="ประเภทเงิน">
            <select className="cfg-input" value={payType} onChange={e => setPayType(e.target.value)}>
              {window.AGP_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </AgpField>
          <AgpField label="รายละเอียดการชำระ">
            <input className="cfg-input" value={payNote} placeholder="เช่น เลขที่เช็ค / บัญชีที่โอน / อ้างอิงการนำส่ง"
              onChange={e => setPayNote(e.target.value)} />
          </AgpField>
        </div>
      </div>

      {/* ── ตารางรายการ ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)' }}>
          <div className="search" style={{ maxWidth: 280 }}>
            <Icon name="search" size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ค้นหาทะเบียน / ชื่อสมาชิก…" disabled={!rows} />
          </div>
          <span className="spacer" />
          {rows && <span className="muted" style={{ fontSize: 12 }}>เลือก {selected.length} / {rows.length} ราย</span>}
          {posted && <span className="pill ok" style={{ marginLeft: 8 }}>นำเข้าแล้ว</span>}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th className="center" style={{ width: 40 }}>
                <input type="checkbox" className="ct-check" checked={!!allChecked} disabled={!rows}
                  onChange={e => setRows(rs => rs.map(r => ({ ...r, checked: e.target.checked })))} />
              </th>
              <th style={{ width: 100 }}>ทะเบียน</th>
              <th style={{ minWidth: 200 }}>ชื่อ – สกุล</th>
              <th style={{ minWidth: 170 }}>สังกัดสมาชิก</th>
              <th style={{ width: 140 }}>สังกัดตัวแทน</th>
              <th className="right" style={{ width: 120 }}>ยอดตัวแทน</th>
              <th className="right" style={{ width: 120 }}>ยอดคงเหลือ</th>
              <th className="right" style={{ width: 140 }}>ยอดชำระ</th>
            </tr></thead>
            <tbody>
              {!rows && <tr><td colSpan="8" className="center muted" style={{ padding: 28 }}>กำหนดเงื่อนไขแล้วกด “ดึงข้อมูล” เพื่อแสดงรายการรับชำระหุ้นพูนทวี</td></tr>}
              {rows && filtered.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 28 }}>ไม่พบรายการที่ตรงกับคำค้นหา</td></tr>}
              {rows && filtered.map(r => {
                const i = rows.indexOf(r);
                return (
                  <tr key={r.reg} className={r.checked ? 'selected' : ''}>
                    <td className="center"><input type="checkbox" className="ct-check" checked={r.checked}
                      onChange={e => setRow(i, { checked: e.target.checked })} /></td>
                    <td className="mono">{r.reg}</td>
                    <td>{r.name}</td>
                    <td style={{ fontSize: 12 }}>{r.memberDept}</td>
                    <td style={{ fontSize: 12 }}><span className="mono">{r.agentCode}</span> {r.agentName}</td>
                    <td className="right mono">{window.fmt.money(r.agentAmt, 2)}</td>
                    <td className="right mono">{window.fmt.money(r.remaining, 2)}</td>
                    <td className="right">
                      <input className="cfg-input mono num" type="number" step="0.01" value={r.amount}
                        disabled={!r.checked} style={{ height: 30, textAlign: 'right' }}
                        onChange={e => setRow(i, { amount: e.target.value })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {rows && (
              <tfoot><tr className="vch-foot">
                <td colSpan={5} className="right">รวม ({selected.length} ราย)</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totAgent, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totRemaining, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(payTotal, 2)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'center', gap: 10 }}>
        <button className="btn" onClick={exportTxn} disabled={!rows}><Icon name="download" /> นำออก</button>
        <button className="btn primary" onClick={importTxn} disabled={!rows || posted}><Icon name="check" /> นำเข้า</button>
      </div>
    </div>
  );
}

Object.assign(window, { AgentPoontaweePage });
