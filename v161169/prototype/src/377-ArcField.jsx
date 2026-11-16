// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › รับชำระตัวแทน
//  รับชำระยอดลูกหนี้ตัวแทนรายสมาชิก — เลือกสมาชิก แสดงงวดเรียกเก็บที่ค้าง
//  ระบุยอดชำระต่องวด (นำเงินรอคืนรวมชำระได้) แล้วออกใบเสร็จรับชำระ
// ════════════════════════════════════════════════════════════════════
const { useState: arcUseState, useMemo: arcUseMemo } = React;

function ArcField({ label, required, children, span, hint }) {
  return (
    <label className="ap-field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="ap-label">{label}{required && <b className="req"> *</b>}{hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>{hint}</span>}</span>
      {children}
    </label>
  );
}

const arcRO = { background: 'var(--surface-muted)' };
const arcROmoney = { background: 'var(--surface-muted)', textAlign: 'right', fontWeight: 600 };

function AgentReceivePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'รับชำระตัวแทน', current: true }], []);

  const slipId = React.useRef(window.arcNextSlip()).current;
  const [receiptDate, setReceiptDate] = arcUseState(window.arcToday());
  const [txnDate, setTxnDate] = arcUseState(window.arcToday());
  const [payType, setPayType] = arcUseState('cash');
  const [moneyDetail, setMoneyDetail] = arcUseState('cash-main');
  const [member, setMember] = arcUseState(null);
  const [rows, setRows] = arcUseState([]);            // งวด: {period, balance, pay}
  const [useRefund, setUseRefund] = arcUseState(false);
  const [note, setNote] = arcUseState('');
  const [list, setList] = arcUseState(window.arcLoad);

  const details = window.ARC_MONEY_DETAILS[payType] || [];

  const pickMember = (m) => {
    setMember(m);
    setRows((m.installments || []).map(it => ({ ...it, pay: 0 })));
    setUseRefund(false);
  };
  const changePayType = (v) => {
    setPayType(v);
    setMoneyDetail((window.ARC_MONEY_DETAILS[v] || [{}])[0].v);
  };

  const setRowPay = (i, v) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, pay: v } : r));
  const payFull = (i) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, pay: r.balance } : r));
  const payAll = () => setRows(rs => rs.map(r => ({ ...r, pay: r.balance })));

  const outstanding = arcUseMemo(() => rows.reduce((s, r) => s + (r.balance || 0), 0), [rows]);
  const pendingRefund = member ? member.pendingRefund : 0;
  const rowPayTotal = arcUseMemo(() => rows.reduce((s, r) => s + (parseFloat(r.pay) || 0), 0), [rows]);
  const refundApplied = useRefund ? Math.min(pendingRefund, Math.max(0, outstanding - rowPayTotal)) : 0;
  const payTotal = rowPayTotal + refundApplied;

  const overpay = rows.some(r => (parseFloat(r.pay) || 0) - (r.balance || 0) > 0.005);
  const canSave = !!member && payTotal > 0 && !overpay;

  const reset = () => {
    setMember(null); setRows([]); setNote(''); setUseRefund(false);
    setPayType('cash'); setMoneyDetail('cash-main');
  };

  const save = () => {
    if (!member) { onToast && onToast('กรุณาเลือกสมาชิกก่อนรับชำระ'); return; }
    if (overpay) { onToast && onToast('ยอดชำระต้องไม่เกินยอดคงเหลือของงวด'); return; }
    if (payTotal <= 0) { onToast && onToast('กรุณาระบุยอดชำระ'); return; }
    const now = new Date();
    const rec = {
      id: slipId, receiptDate, txnDate, memberCode: member.code, memberName: member.name,
      dept: member.dept, payType, payTypeLabel: window.arcPayLabel(payType),
      moneyDetail: (details.find(d => d.v === moneyDetail) || {}).l || '',
      outstanding, refundApplied, payTotal, note: note.trim(),
      lines: rows.map(r => ({ period: r.period, balance: r.balance, pay: parseFloat(r.pay) || 0 })),
      by: 'มนตรี ศรีสุข',
      at: `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getFullYear() + 543).slice(-2)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
    const next = [rec, ...list];
    setList(next); window.arcSave(next);
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — รับชำระตัวแทน',
      target: `${slipId} · ${member.code}`,
      summary: `รับชำระลูกหนี้ตัวแทน ${member.name} ยอด ${window.fmt.money(payTotal, 2)} บาท (${window.arcPayLabel(payType)})`,
      changes: [{ field: 'ยอดค้างจ่าย', before: window.fmt.money(outstanding, 2), after: window.fmt.money(Math.max(0, outstanding - payTotal), 2) }],
    });
    onToast && onToast(`รับชำระตัวแทน ${slipId} — ${window.fmt.money(payTotal, 2)} บาท เรียบร้อย`);
    reset();
  };

  const delRow = (id) => {
    const next = list.filter(r => r.id !== id);
    setList(next); window.arcSave(next);
    onToast && onToast('ลบใบเสร็จรับชำระแล้ว');
  };

  const listSorted = arcUseMemo(() => list.slice(), [list]);

  return (
    <div data-screen-label="หน้ารับชำระตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับชำระตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            รับชำระยอดลูกหนี้ตัวแทนรายสมาชิกตามงวดเรียกเก็บ — เลือกสมาชิก ระบุยอดชำระต่องวด แล้วออกใบเสร็จรับชำระ
          </div>
        </div>
        <span className="spacer" />
        <span className="mono muted" style={{ fontSize: 12 }}>ใบทำรายการ {slipId}</span>
      </div>

      {/* ── ฟอร์มรับชำระ ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายการรับชำระลูกหนี้ตัวแทน</h3></div>

        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <ArcField label="ใบทำรายการ">
            <input className="cfg-input mono" value="AUTO" readOnly tabIndex={-1}
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-500)', fontWeight: 600 }} />
          </ArcField>
          <ArcField label="วันที่ออกใบเสร็จ" required>
            <ErpDate value={receiptDate} onChange={(v) => (e => setReceiptDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </ArcField>
          <ArcField label="ประเภทรายการ">
            <input className="cfg-input" value="ยอดชำระลูกหนี้ตัวแทน" readOnly tabIndex={-1} style={arcRO} />
          </ArcField>

          <ArcField label="ทะเบียนสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <MemberSearchField member={member} onPick={pickMember}
              source={window.ARC_MEMBERS} searchFn={(c) => window.arcSearch(window.ARC_MEMBERS, c)}
              title="ค้นหาสมาชิก — รับชำระตัวแทน" placeholder="คลิกเพื่อค้นหาเลขทะเบียน / ชื่อสมาชิก…" />
          </ArcField>
          <ArcField label="วันที่ทำรายการ" required>
            <ErpDate value={txnDate} onChange={(v) => (e => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </ArcField>
          <ArcField label="ประเภทเงิน" required>
            <select className="cfg-input" value={payType} onChange={e => changePayType(e.target.value)}>
              {window.ARC_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </ArcField>

          <ArcField label="ชื่อ – สกุล" span={2}>
            <input className="cfg-input" readOnly tabIndex={-1}
              value={member ? member.name : ''} placeholder="— เลือกสมาชิกเพื่อแสดงชื่อ —" style={arcRO} />
          </ArcField>
          <ArcField label="สังกัด">
            <input className="cfg-input" readOnly tabIndex={-1} value={member ? member.dept : ''} placeholder="—" style={arcRO} />
          </ArcField>

          <ArcField label="ยอดเงินค้างจ่าย">
            <input className="cfg-input mono" readOnly tabIndex={-1}
              value={member ? window.fmt.money(outstanding, 2) : ''} placeholder="0.00"
              style={{ ...arcROmoney, color: 'var(--danger)' }} />
          </ArcField>
          <ArcField label="ยอดเงินรอคืน">
            <input className="cfg-input mono" readOnly tabIndex={-1}
              value={member ? window.fmt.money(pendingRefund, 2) : ''} placeholder="0.00" style={arcROmoney} />
          </ArcField>
          <ArcField label="รายละเอียดเงิน" required>
            <select className="cfg-input" value={moneyDetail} onChange={e => setMoneyDetail(e.target.value)}>
              {details.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
            </select>
          </ArcField>

          <ArcField label="ยอดชำระ">
            <input className="cfg-input mono" readOnly tabIndex={-1}
              value={member ? window.fmt.money(payTotal, 2) : ''} placeholder="0.00"
              style={{ ...arcROmoney, color: payTotal > 0 ? 'var(--brand-700)' : undefined }} />
          </ArcField>
          <div className="ap-field" style={{ gridColumn: 'span 2', justifyContent: 'flex-end' }}>
            <label className={"arc-refund-check" + (pendingRefund > 0 ? '' : ' disabled')}>
              <input type="checkbox" className="ct-check" checked={useRefund} disabled={!member || pendingRefund <= 0}
                onChange={e => setUseRefund(e.target.checked)} />
              <span>นำเงินคืนลูกหนี้ตัวแทนรวมชำระ{pendingRefund > 0 ? ` (${window.fmt.money(pendingRefund, 2)})` : ''}</span>
            </label>
          </div>

          <ArcField label="หมายเหตุ" span={3}>
            <input className="cfg-input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="ระบุหมายเหตุ / เอกสารอ้างอิงการชำระ" />
          </ArcField>
        </div>
      </div>

      {/* ── ตารางงวดเรียกเก็บ ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>งวดเรียกเก็บที่ค้างชำระ</span>
          {member && <span className="gc-count">{rows.length} งวด</span>}
          <span className="spacer" />
          {member && rows.length > 0 && <button className="btn sm" onClick={payAll}><Icon name="check" size={13} /> ชำระเต็มทุกงวด</button>}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead><tr>
              <th className="center" style={{ width: 70 }}>ลำดับ</th>
              <th style={{ width: 160 }}>งวดเรียกเก็บ</th>
              <th className="right" style={{ width: 160 }}>ยอดคงเหลือ</th>
              <th className="right" style={{ width: 200 }}>ยอดชำระ</th>
            </tr></thead>
            <tbody>
              {!member && <tr><td colSpan="4" className="center muted" style={{ padding: 28 }}>เลือกสมาชิกเพื่อแสดงงวดเรียกเก็บที่ค้างชำระ</td></tr>}
              {member && rows.length === 0 && <tr><td colSpan="4" className="center muted" style={{ padding: 28 }}>สมาชิกรายนี้ไม่มีงวดค้างชำระ</td></tr>}
              {member && rows.map((r, i) => {
                const over = (parseFloat(r.pay) || 0) - (r.balance || 0) > 0.005;
                return (
                  <tr key={r.period + i}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono">{r.period}</td>
                    <td className="right mono">{window.fmt.money(r.balance, 2)}</td>
                    <td className="right">
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                        <input className="cfg-input mono num" type="number" step="0.01" min="0" value={r.pay}
                          onChange={e => setRowPay(i, e.target.value)}
                          style={{ height: 30, textAlign: 'right', maxWidth: 120, color: over ? 'var(--danger)' : undefined }} />
                        <button className="btn text sm" title="ชำระเต็มงวด" onClick={() => payFull(i)}>เต็ม</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {member && rows.length > 0 && (
              <tfoot><tr className="vch-foot">
                <td colSpan={2} className="right">รวม</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(outstanding, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700, paddingRight: 44 }}>{window.fmt.money(rowPayTotal, 2)}</td>
              </tr></tfoot>
            )}
          </table>
        </div>
      </div>

      {overpay && (
        <div className="ap-hint" style={{ color: 'var(--danger)' }}>
          <Icon name="info" size={13} /> ยอดชำระของบางงวดเกินยอดคงเหลือ — กรุณาตรวจสอบก่อนบันทึก
        </div>
      )}

      <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn" onClick={reset} disabled={!member && !note}><Icon name="refresh" /> ล้างฟอร์ม</button>
        <button className="btn primary" onClick={save} disabled={!canSave}><Icon name="check" /> บันทึกรับชำระ</button>
      </div>

      {/* ── ทะเบียนใบเสร็จรับชำระล่าสุด ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>ใบเสร็จรับชำระล่าสุด</span>
          <span className="gc-count">{listSorted.length} รายการ</span>
          <span className="spacer" />
          <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายการรับชำระ (.xlsx) แล้ว')}><Icon name="download" /> Export</button>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 940 }}>
            <thead><tr>
              <th style={{ width: 160 }}>ใบทำรายการ</th>
              <th style={{ minWidth: 220 }}>สมาชิก</th>
              <th className="center" style={{ width: 100 }}>ประเภทเงิน</th>
              <th className="right" style={{ width: 130 }}>ยอดค้างจ่าย</th>
              <th className="right" style={{ width: 130 }}>ยอดชำระ</th>
              <th className="center" style={{ width: 100 }}>วันที่รายการ</th>
              <th style={{ minWidth: 150 }}>ผู้บันทึก</th>
              <th style={{ width: 44 }} />
            </tr></thead>
            <tbody>
              {listSorted.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 28 }}>ยังไม่มีใบเสร็จรับชำระ</td></tr>}
              {listSorted.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td><div className="lt-row-name">{r.memberName}</div><div className="lt-row-note muted mono">{r.memberCode} · {r.dept}</div></td>
                  <td className="center"><span className="chip info">{r.payTypeLabel}</span></td>
                  <td className="right mono">{window.fmt.money(r.outstanding, 2)}</td>
                  <td className="right mono" style={{ fontWeight: 700, color: 'var(--brand-700)' }}>{window.fmt.money(r.payTotal, 2)}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{window.arcThaiDate(r.txnDate)}</td>
                  <td style={{ fontSize: 12 }}>{r.by}<div className="muted mono" style={{ fontSize: 11 }}>{r.at}</div></td>
                  <td className="center"><button className="iv-doc-x" title="ลบใบเสร็จ" onClick={() => delRow(r.id)}><Icon name="trash" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เลขที่ใบทำรายการสร้างอัตโนมัติเมื่อบันทึก · ติ๊ก “นำเงินคืนลูกหนี้ตัวแทนรวมชำระ” เพื่อนำยอดเงินรอคืนมาหักชำระร่วม
      </div>
    </div>
  );
}

Object.assign(window, { AgentReceivePage });
