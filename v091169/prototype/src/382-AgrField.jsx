// override 368 — ตารางแบบเดียวกับปรับปรุงลูกหนี้ตัวแทน + ช่องวันที่ไทยเหมือนหน้ารับชำระตัวแทน
(function () {
// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › คืนใบเสร็จลูกหนี้ตัวแทน
//  ยกเลิก/คืนใบเสร็จรับชำระลูกหนี้ตัวแทน (ประเภทรายการ: ยอดยกเลิกรับชำระลูกหนี้)
//  เลือกสมาชิก → แสดงงวดเรียกเก็บที่รับชำระแล้ว → เลือกงวด + ระบุยอดคืน → บันทึก
// ════════════════════════════════════════════════════════════════════
const { useState: arrUseState, useMemo: arrUseMemo } = React;

function AgrField({ label, children, required, span, tag }) {
  const Tag = tag || 'label';   // ใช้ div สำหรับฟิลด์ที่มี popup ภายใน (กัน label re-target คลิก)
  return (
    <Tag className="ap-field" style={span ? { gridColumn: `span ${span}` } : null}>
      <span className="ap-label">{label}{required && <b className="req"> *</b>}</span>
      {children}
    </Tag>
  );
}

// ─── ฟอร์มสร้างรายการคืนใบเสร็จ ───────────────────────────────────────
function AgentReturnForm({ nextId, onSave, onCancel, onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([
    { label: 'คืนใบเสร็จลูกหนี้ตัวแทน', route: { view: 'agent', page: 'receipt-return' } },
    { label: 'สร้างรายการคืนใบเสร็จ', current: true },
  ], []);

  const [member, setMember] = arrUseState(null);
  const [receiptDate, setReceiptDate] = arrUseState(window.agReturnToday());
  const [txnType, setTxnType] = React.useState('ยอดยกเลิกรับชำระลูกหนี้');
  // เลขที่ใบทำรายการรันใหม่ตามประเภทรายการที่เลือก (RC = ยกเลิกรับชำระ · RF = คืนเงิน)
  const docId = arrUseMemo(() => {
    const pfx = txnType === 'ยอดคืนเงินลูกหนี้ตัวแทน' ? 'RF' : 'RC';
    return String(nextId || '').replace(/^[A-Z]+/, pfx);
  }, [nextId, txnType]);
  const [txnDate, setTxnDate] = arrUseState(window.agReturnToday());
  const [payType, setPayType] = arrUseState('cash');
  const [moneyNote, setMoneyNote] = arrUseState('');
  const [note, setNote] = arrUseState('');
  const [rows, setRows] = arrUseState([]);   // งวดเรียกเก็บ [{seq,period,remaining,checked,amount}]

  const pickMember = (m) => {
    const full = (window.MEMBERS_LIST || []).find(x => x.code === m.code) || m;
    setMember(full);
    const periods = window.agReturnPeriods(full);
    setRows(periods.map(p => ({ ...p, checked: true, amount: p.remaining })));
    onToast && onToast(`เลือกสมาชิก ${full.code} — พบงวดที่รับชำระแล้ว ${periods.length} งวด`);
  };

  const setRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));

  const selected = rows.filter(r => r.checked);
  const payTotal = selected.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const outstanding = rows.reduce((s, r) => s + (r.remaining || 0), 0);   // ยอดเงินค้างจ่าย (คืนได้ทั้งหมด)
  const pendingRefund = 0;                                                // ยอดเงินรอคืน (คงค้างจากรายการก่อน)

  const canSave = member && selected.length > 0 && payTotal > 0 &&
    !selected.some(r => Number(r.amount) > r.remaining);

  const save = () => {
    if (!member) { onToast && onToast('กรุณาเลือกสมาชิกก่อนบันทึก'); return; }
    if (selected.length === 0) { onToast && onToast('กรุณาเลือกงวดเรียกเก็บที่ต้องการคืนอย่างน้อย 1 งวด'); return; }
    if (payTotal <= 0) { onToast && onToast('กรุณาระบุยอดชำระที่ต้องการคืน'); return; }
    const over = selected.find(r => Number(r.amount) > r.remaining);
    if (over) { onToast && onToast(`งวด ${over.period}: ยอดชำระเกินยอดคงเหลือ (${window.fmt.money(over.remaining, 2)})`); return; }
    onSave({
      id: docId, txnType, receiptDate, txnDate,
      memberCode: member.code, memberName: member.name,
      affiliation: window.agReturnAffiliation(member),
      payType, moneyNote: moneyNote.trim(), note: note.trim(),
      total: payTotal,
      periods: selected.map(r => ({ seq: r.seq, period: r.period, remaining: r.remaining, amount: Number(r.amount) || 0 })),
    });
  };

  return (
    <div data-screen-label="หน้าสร้างรายการคืนใบเสร็จลูกหนี้ตัวแทน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="mono" style={{ fontWeight: 600, marginLeft: 4 }}>{docId}</span>
        <span className={"chip " + (txnType === 'ยอดคืนเงินลูกหนี้ตัวแทน' ? 'success' : 'warning')}>
          <span className="dot-c" />{txnType}
        </span>
        <span className="spacer" />
        <button className="btn primary sm" disabled={!canSave} onClick={save}><Icon name="check" /> บันทึกคืนใบเสร็จ</button>
      </div>

      {/* ── หัวเอกสาร ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลใบทำรายการ</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AgrField label="เลขที่ใบทำรายการ">
            <input className="cfg-input mono" value={docId} readOnly />
          </AgrField>
          <AgrField label="วันที่ออกใบเสร็จ" required>
            <ThaiDateField value={receiptDate} onChange={setReceiptDate} />
          </AgrField>
          <AgrField label="ประเภทรายการ">
            <select className="cfg-input" value={txnType} onChange={e => setTxnType(e.target.value)}>
              <option value="ยอดยกเลิกรับชำระลูกหนี้">ยอดยกเลิกรับชำระลูกหนี้</option>
              <option value="ยอดคืนเงินลูกหนี้ตัวแทน">ยอดคืนเงินลูกหนี้ตัวแทน</option>
            </select>
          </AgrField>
          <AgrField label="ทะเบียนสมาชิก" required tag="div">
            <MemberSearchField member={member} onPick={pickMember} source={window.MEMBERS_LIST}
              title="ค้นหาสมาชิก — คืนใบเสร็จลูกหนี้ตัวแทน" placeholder="คลิกเพื่อค้นหาเลขทะเบียน / ชื่อ…" />
          </AgrField>
          <AgrField label="วันที่ทำรายการ" required>
            <ThaiDateField value={txnDate} onChange={setTxnDate} />
          </AgrField>
          <AgrField label="ประเภทเงิน" required>
            <select className="cfg-input" value={payType} onChange={e => setPayType(e.target.value)}>
              {window.AGENT_RETURN_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </AgrField>
          <AgrField label="ชื่อ – สกุล">
            <input className="cfg-input" value={member ? member.name : ''} placeholder="— เลือกสมาชิก —" readOnly />
          </AgrField>
          <AgrField label="สังกัด" span={2}>
            <input className="cfg-input" value={member ? window.agReturnAffiliation(member) : ''} placeholder="—" readOnly />
          </AgrField>
        </div>
      </div>

      {/* ── ยอดเงิน ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ยอดเงิน</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AgrField label="ยอดเงินค้างจ่าย">
            <input className="cfg-input mono num" value={window.fmt.money(outstanding, 2)} readOnly
              style={{ color: 'var(--danger)', fontWeight: 700, textAlign: 'right' }} />
          </AgrField>
          <AgrField label="ยอดเงินรอคืน">
            <input className="cfg-input mono num" value={window.fmt.money(pendingRefund, 2)} readOnly
              style={{ color: 'var(--success)', fontWeight: 700, textAlign: 'right' }} />
          </AgrField>
          <AgrField label="ยอดชำระ" span={3}>
            <input className="cfg-input mono num" value={window.fmt.money(payTotal, 2)} readOnly
              style={{ fontWeight: 700, fontSize: 18, textAlign: 'right' }} />
          </AgrField>
          <AgrField label="หมายเหตุ" span={3}>
            <input className="cfg-input" value={note} placeholder="เหตุผลการคืนใบเสร็จ (ไม่บังคับ)"
              onChange={e => setNote(e.target.value)} />
          </AgrField>
        </div>
      </div>

      {/* ── งวดเรียกเก็บ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>งวดเรียกเก็บที่รับชำระแล้ว</h3></div>
        {!member ? (
          <div className="center muted" style={{ padding: '26px 12px' }}>เลือกสมาชิกเพื่อแสดงงวดเรียกเก็บที่รับชำระแล้ว</div>
        ) : rows.length === 0 ? (
          <div className="center muted" style={{ padding: '26px 12px' }}>ไม่พบงวดเรียกเก็บที่รับชำระแล้วสำหรับสมาชิกรายนี้</div>
        ) : (
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead><tr>
                <th className="center" style={{ width: 44 }} />
                <th className="center" style={{ width: 64 }}>ลำดับ</th>
                <th className="center" style={{ width: 130 }}>งวดเรียกเก็บ</th>
                <th className="right" style={{ width: 150 }}>ยอดคงเหลือ</th>
                <th className="right" style={{ width: 160 }}>ยอดชำระ</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.period} className={r.checked ? 'selected' : ''}>
                    <td className="center">
                      <input type="checkbox" className="ct-check" checked={r.checked}
                        onChange={e => setRow(i, { checked: e.target.checked, amount: e.target.checked ? (r.amount || r.remaining) : r.amount })} />
                    </td>
                    <td className="center mono">{r.seq}</td>
                    <td className="center mono">{r.period}</td>
                    <td className="right mono">{window.fmt.money(r.remaining, 2)}</td>
                    <td className="right">
                      <input className="cfg-input mono num" type="number" step="0.01" value={r.amount}
                        disabled={!r.checked} style={{ height: 30, textAlign: 'right' }}
                        onChange={e => setRow(i, { amount: e.target.value })} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="vch-foot">
                <td colSpan={4} className="right">รวมยอดคืน ({selected.length} งวด)</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(payTotal, 2)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        <div className="ap-hint muted" style={{ marginTop: 12 }}>
          <Icon name="info" size={13} /> เลือกงวดเรียกเก็บที่ต้องการยกเลิก/คืนใบเสร็จ — ยอดชำระคืนต้องไม่เกินยอดคงเหลือของงวด
        </div>
      </div>
    </div>
  );
}

// ─── หน้าหลัก: รายการคืนใบเสร็จลูกหนี้ตัวแทน ──────────────────────────
function AgentReceiptReturnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = arrUseState(window.agReturnLoad);
  const [creating, setCreating] = arrUseState(false);

  const [query, setQuery] = arrUseState('');
  const [applied, setApplied] = arrUseState('');
  const [typeFilter, setTypeFilter] = arrUseState('');

  const shown = arrUseMemo(() => {
    const q = applied.trim().toLowerCase();
    return (list || []).filter(r => {
      const type = r.txnType || window.AGENT_RETURN_TXN_TYPE;
      if (typeFilter && type !== typeFilter) return false;
      if (!q) return true;
      return (r.id + ' ' + r.memberName + ' ' + r.memberCode + ' ' + (r.affiliation || '')).toLowerCase().includes(q);
    });
  }, [list, applied, typeFilter]);

  const persist = (next) => { setList(next); window.agReturnSave(next); };
  const nextId = arrUseMemo(() => window.agReturnNextId(list), [list, creating]);

  const handleSave = (data) => {
    const rec = {
      ...data,
      createdBy: 'นางสาวรัตนา (การเงิน)',
      createdAt: window.agReturnThaiDate(window.agReturnToday()).replace(/(\d+)\/(\d+)\/(\d+)/, '$1/$2/$3').slice(0, 8) + ' ' +
        new Date().toTimeString().slice(0, 5),
    };
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — คืนใบเสร็จลูกหนี้ตัวแทน',
      target: rec.id, summary: `คืนใบเสร็จลูกหนี้ตัวแทน ${rec.memberName} (${rec.memberCode}) ยอด ${window.fmt.money(rec.total, 2)} บาท`,
      changes: [{ field: 'ยอดคืน', before: '—', after: window.fmt.money(rec.total, 2) }],
    });
    setCreating(false);
    onToast && onToast(`บันทึกคืนใบเสร็จ ${rec.id} เรียบร้อย`);
  };

  if (creating) return <AgentReturnForm nextId={nextId} onSave={handleSave} onCancel={() => setCreating(false)} onToast={onToast} />;

  return (
    <div data-screen-label="หน้าคืนใบเสร็จลูกหนี้ตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>คืนใบเสร็จลูกหนี้ตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ยกเลิก/คืนใบเสร็จรับชำระลูกหนี้ตัวแทน — เลือกสมาชิกและงวดเรียกเก็บที่ต้องการคืน แล้วบันทึกเป็นรายการยอดยกเลิกรับชำระลูกหนี้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setCreating(true)}><Icon name="plus" /> สร้างรายการคืนใบเสร็จ</button>
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="head-bar" /><h3>รายการคืนใบเสร็จล่าสุด</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {shown.length} รายการ</span>
            <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายการคืนใบเสร็จ (.xlsx) แล้ว')}>Export</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input className="cfg-input" value={query} style={{ flex: 1, minWidth: 0 }}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setApplied(query); }}
            placeholder="ค้นหาเลขที่ใบทำรายการ / สมาชิก / สังกัด…" />
          <select className="cfg-input" style={{ flex: '0 0 220px' }} value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}>
            <option value="">ทุกประเภทรายการ</option>
            <option value="ยอดยกเลิกรับชำระลูกหนี้">ยอดยกเลิกรับชำระลูกหนี้</option>
            <option value="ยอดคืนเงินลูกหนี้ตัวแทน">ยอดคืนเงินลูกหนี้ตัวแทน</option>
          </select>
          <button className="btn sm" style={{ minWidth: 76, justifyContent: 'center' }} onClick={() => setApplied(query)}>ค้นหา</button>
          {(applied || typeFilter) && (
            <button className="btn sm" style={{ minWidth: 76, justifyContent: 'center' }}
              onClick={() => { setQuery(''); setApplied(''); setTypeFilter(''); }}>ล้าง</button>
          )}
        </div>
        <div className="table-wrap adr-scroll" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 1100 }}>
            <thead><tr>
              <th style={{ width: 140 }}>เลขที่ใบทำรายการ</th>
              <th className="center" style={{ width: 100 }}>วันที่ทำรายการ</th>
              <th style={{ minWidth: 200 }}>สมาชิก</th>
              <th style={{ minWidth: 180 }}>สังกัด</th>
              <th style={{ minWidth: 170 }}>ประเภทรายการ</th>
              <th className="center" style={{ width: 90 }}>ประเภทเงิน</th>
              <th className="center" style={{ width: 70 }}>งวด</th>
              <th className="right" style={{ width: 130 }}>ยอดคืน</th>
            </tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 28 }}>
                {list.length === 0 ? 'ยังไม่มีรายการคืนใบเสร็จ' : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
              </td></tr>}
              {shown.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{r.txnDate}</td>
                  <td><div className="lt-row-name">{r.memberName}</div><div className="lt-row-note muted mono">{r.memberCode}</div></td>
                  <td style={{ fontSize: 12 }}>{r.affiliation}</td>
                  <td>
                    <span className={"chip " + ((r.txnType || window.AGENT_RETURN_TXN_TYPE) === 'ยอดคืนเงินลูกหนี้ตัวแทน' ? 'success' : 'warning')}>
                      {r.txnType || window.AGENT_RETURN_TXN_TYPE}
                    </span>
                  </td>
                  <td className="center"><span className="chip info">{window.agReturnPayLabel(r.payType)}</span></td>
                  <td className="center mono">{(r.periods || []).length}</td>
                  <td className="right mono"><b>{window.fmt.money(r.total, 2)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> รายการคืนใบเสร็จบันทึกเป็นประเภท “{window.AGENT_RETURN_TXN_TYPE}” และปรับปรุงยอดลูกหนี้ตัวแทนของสมาชิกตามงวดที่คืน
      </div>
    </div>
  );
}

Object.assign(window, { AgentReceiptReturnPage, AgentReturnForm });

})();
