// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — รับ / จ่ายเงินจากระบบอื่น (Cross-system receipt/payment)
//  สำเนาที่แก้ไขได้ของ component 117 (ชื่อไฟล์เดิมมีปัญหา encoding จึงแก้ไขไม่ได้)
//  ไฟล์นี้โหลดหลังไฟล์เดิมและ override window.FinCrossSystemPage
//  เปลี่ยนแปลง: ตาราง "รายการรับ / จ่ายจากระบบอื่น ล่าสุด" ใช้ layout
//  เดียวกับตาราง "รายการยกเลิกจากต้นทาง" (การ์ด fbt-card + section-head)
// ════════════════════════════════════════════════════════════════════
const { useState: fcx2UseState, useMemo: fcx2UseMemo } = React;

// เลขทะเบียน 6 หลักจากรหัสสมาชิก (M-067012 → 067012)
const fcx2RegOf = (m) => (String((m && m.code) || '').replace(/\D/g, '').slice(-6)) || (m && m.code) || '';

function Fcx2Field({ label, hint, required, children, style }) {
  return (
    <div className="fbt-field" style={style}>
      <label className="fbt-lab">
        {label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="fbt-lab-hint"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const fcx2BlankLine = () => ({ acct: '', desc: '', amount: '' });

function FinCrossSystemWorkspace({ onToast, initialRecord }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const today = (initialRecord && initialRecord.txnDate) || new Date().toISOString().slice(0, 10);

  const [list, setList] = fcx2UseState(window.fcxLoad);
  const init = initialRecord || null;
  const [member, setMember] = fcx2UseState(() => (init
    ? ((window.DN_MEMBERS || []).find(x =>
        (init.memberCode && x.code === init.memberCode)
        || (init.regNo && fcx2RegOf(x) === String(init.regNo))
        || (init.memberName && window.msFullName(x) === init.memberName))
       || (() => { const nm = String(init.memberName || '').trim(); const p = nm.split(/\s+/);
             return { code: init.memberCode || init.regNo || '', name: nm, regNo: init.regNo || init.memberCode || '',
                      firstName: p[0] || '', lastName: p.slice(1).join(' '), deptCode: init.deptCode || '', dept: init.dept || '' }; })())
    : null));
  const [txnType, setTxnType] = fcx2UseState(() => (init ? init.txnType : 'receive'));
  const [method, setMethod] = fcx2UseState(() => (init ? init.method : 'cash'));
  const [cashAcct, setCashAcct] = fcx2UseState(() => (init && init.cashAcct ? init.cashAcct
    : (window.fbtDefaultCashAccount ? window.fbtDefaultCashAccount() : '')));
  const [lines, setLines] = fcx2UseState(() => (init && init.lines && init.lines.length
    ? JSON.parse(JSON.stringify(init.lines)) : [fcx2BlankLine()]));
  const [searchOpen, setSearchOpen] = fcx2UseState(false);

  const accounts = fcx2UseMemo(() => window.fcxPostingAccounts(), []);
  const persist = (next) => { setList(next); window.fcxSave(next); };

  const net = fcx2UseMemo(
    () => lines.reduce((s, l) => s + (Number(String(l.amount || 0).replace(/,/g, '')) || 0), 0),
    [lines]
  );
  const tone = txnType === 'pay' ? 'pay' : 'recv';

  const cancels = fcx2UseMemo(
    () => (member ? window.fcxCancelByReg(fcx2RegOf(member)) : []),
    [member]
  );

  const setLine = (i, patch) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const addLine = () => setLines(ls => [...ls, fcx2BlankLine()]);
  const removeLine = (i) => setLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls);

  const pickMember = (m) => { setMember(m); setSearchOpen(false); };

  // ดึงรายการที่ถูกยกเลิกจากต้นทาง → เติมลงเป็นบรรทัดใหม่ (กลับรายการ)
  const pullCancel = (row) => {
    const acctCode = String(row.contra || '').split('·')[0].trim();
    const line = { acct: accounts.some(a => a.code === acctCode) ? acctCode : '', desc: row.item, amount: row.amount };
    setTxnType(row.txnType);
    setMethod(row.method);
    setLines(ls => {
      const first = ls[0];
      const empty = !first.acct && !first.desc && !first.amount;
      return empty ? [line] : [...ls, line];
    });
    onToast && onToast(`ดึงรายการ ${row.ref} เข้ารายการแล้ว`);
  };

  const resetForm = () => {
    setMember(null); setTxnType('receive'); setMethod('cash');
    setCashAcct(window.fbtDefaultCashAccount ? window.fbtDefaultCashAccount() : '');
    setLines([fcx2BlankLine()]);
  };

  const save = () => {
    if (!member) { onToast && onToast('กรุณาเลือกสมาชิกก่อนบันทึกรายการ'); return; }
    const has = lines.some(l => (l.acct || l.desc) && Number(String(l.amount).replace(/,/g, '')) > 0);
    if (!has) { onToast && onToast('กรุณาเพิ่มรายการอย่างน้อย 1 บรรทัด พร้อมจำนวนเงิน'); return; }
    const id = window.fcxNextNo(list, new Date().toISOString());
    const rec = {
      id, ts: new Date().toISOString(), txnDate: today, txnType, method, cashAcct,
      regNo: fcx2RegOf(member), memberCode: member.code, memberName: window.msFullName(member),
      by: window.FCX_CURRENT_USER.name, branch: window.FCX_CURRENT_USER.branch,
      lines: JSON.parse(JSON.stringify(lines)),
      amount: net,
    };
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'การเงิน — รับ/จ่ายเงินจากระบบอื่น', target: `${id} · ${rec.memberName}`,
      summary: `${txnType === 'pay' ? 'จ่าย' : 'รับ'}เงินจากระบบอื่น “${rec.memberName}” ${window.fmt.money(net, 2)} บาท`,
    });
    onToast && onToast(`บันทึกรายการ ${id} เรียบร้อย — สุทธิ ${window.fmt.money(net, 2)} บาท`);
    resetForm();
  };

  const sorted = fcx2UseMemo(() => [...list].sort((a, b) => (a.ts < b.ts ? 1 : -1)), [list]);

  return (
    <div data-screen-label="หน้ารับ/จ่ายเงินจากระบบอื่น (การเงิน)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับ / จ่ายเงินจากระบบอื่น</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            บันทึกการรับหรือจ่ายเงินที่มีต้นทางจากระบบงานอื่น (เงินฝาก · สินเชื่อ · สวัสดิการ) โดยอ้างอิงสมาชิกและลงบัญชีรับรู้เป็นรายบรรทัด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกรายการ</button>
      </div>

      {/* ── รายละเอียดสมาชิก ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>รายละเอียดสมาชิก</h3>
        </div>
        <div className="fbt-grid">
          <Fcx2Field label="ทะเบียน" required>
            <div className="fbt-party">
              <input className="cfg-input mono" value={member ? fcx2RegOf(member) : ''} readOnly placeholder="— ยังไม่ได้เลือก —" />
              <button type="button" className="btn fbt-party-btn" onClick={() => setSearchOpen(true)} style={{ whiteSpace: 'nowrap', padding: '0 12px' }}>
                <Icon name="search" size={13} /> ค้นหา…
              </button>
            </div>
          </Fcx2Field>
          <Fcx2Field label="วันที่ทำรายการ" hint="(วันที่ระบบ)">
            <input className="cfg-input fbt-ro" value={window.fmt.date(today)} readOnly />
          </Fcx2Field>
          <Fcx2Field label="ผู้ทำรายการ" hint="(จาก Login)">
            <input className="cfg-input fbt-ro" value={(init && init.by) || window.FCX_CURRENT_USER.name} readOnly />
          </Fcx2Field>

          <Fcx2Field label="ชื่อ">
            <input className="cfg-input fbt-ro" value={member ? (member.firstName || (member.name || '').split(' ')[0] || '') : ''} readOnly />
          </Fcx2Field>
          <Fcx2Field label="ชื่อสกุล">
            <input className="cfg-input fbt-ro" value={member ? (member.lastName || (member.name || '').split(' ').slice(1).join(' ')) : ''} readOnly />
          </Fcx2Field>
          <Fcx2Field label="สาขา">
            <input className="cfg-input fbt-ro" value={(init && init.branch) || window.FCX_CURRENT_USER.branch} readOnly />
          </Fcx2Field>

          <Fcx2Field label="หน่วย">
            <input className="cfg-input mono fbt-ro" value={member ? (member.deptCode || '') : ''} readOnly />
          </Fcx2Field>
          <Fcx2Field label="ชื่อหน่วย" style={{ gridColumn: 'span 2' }}>
            <input className="cfg-input fbt-ro" value={member ? (member.dept || member.department || '') : ''} readOnly />
          </Fcx2Field>
        </div>
      </div>

      {/* ── รายการ / รายละเอียดรายการ ── */}
      <div className="search-card fbt-card">
        <div className="fcx-txn-top">
          <div className="fcx-txn-col">
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายการ</h3></div>
            <div className="seg fcx-typeseg">
              {window.FCX_TXN_TYPES.map(t => (
                <button key={t.v} className={"seg-btn" + (txnType === t.v ? ' active' : '')} onClick={() => setTxnType(t.v)}>{t.l}</button>
              ))}
            </div>
          </div>
          <div className="fcx-detail-col">
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายละเอียดรายการ</h3></div>
            <div className="fcx-detail-grid">
              <Fcx2Field label="ทำรายการโดย" required>
                <select className="cfg-input" value={method} onChange={e => setMethod(e.target.value)}>
                  {window.FCX_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </Fcx2Field>
              <Fcx2Field label="รหัสบัญชี" hint="(เงินสด / เงินฝาก)" required>
                <select className="cfg-input" value={cashAcct} onChange={e => setCashAcct(e.target.value)}>
                  <option value="">— เลือกบัญชี —</option>
                  {accounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                </select>
              </Fcx2Field>
              <div className={"fbt-netbox " + tone} style={{ gridColumn: 'span 2' }}>
                <span className="fbt-net-lab">สุทธิ :</span>
                <span className="fbt-net-val mono">{window.fmt.money(net, 2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* บรรทัดรายการ */}
        <div className="fbt-lines-head" style={{ marginTop: 16 }}>
          <span className="head-bar" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>รายการรับ – จ่าย</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm" onClick={addLine}><Icon name="plus" size={12} /> เพิ่มแถว</button>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl fbt-tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }}>#</th>
                <th style={{ width: 240 }}>รหัสบัญชี</th>
                <th style={{ minWidth: 260 }}>รายละเอียด</th>
                <th className="right" style={{ width: 150 }}>จำนวนเงิน</th>
                <th style={{ width: 34 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="vch-cell-input" value={l.acct} onChange={e => setLine(i, { acct: e.target.value })}>
                      <option value="">— เลือกบัญชี —</option>
                      {accounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                    </select>
                  </td>
                  <td><input className="vch-cell-input" value={l.desc} placeholder="รายละเอียดรายการ" maxLength={255}
                             onChange={e => setLine(i, { desc: e.target.value })} /></td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={l.amount}
                             placeholder="0.00" onChange={e => setLine(i, { amount: e.target.value })} /></td>
                  <td className="center">
                    <button className="btn sm tt-del-btn" title="ลบแถว" aria-label="ลบแถว" onClick={() => removeLine(i)} disabled={lines.length <= 1}>
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fbt-foot">
                <td colSpan="3" className="right">รวม :</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(net, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── รายการยกเลิกจากต้นทาง ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการยกเลิกจากต้นทาง</h3>
          <div className="head-actions">
            <span className="muted" style={{ fontSize: 11.5 }}>
              <Icon name="info" size={12} /> คลิก “ดึงเข้ารายการ” เพื่อกลับรายการที่ระบบต้นทางยกเลิก
            </span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ width: 150 }}>อ้างอิง</th>
                <th style={{ width: 96 }}>ทำรายการโดย</th>
                <th style={{ minWidth: 260 }}>รายการ</th>
                <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
                <th style={{ minWidth: 220 }}>คู่บัญชี</th>
                <th className="center" style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {!member && (
                <tr><td colSpan="6" className="center muted" style={{ padding: '24px 12px' }}>เลือกสมาชิกเพื่อแสดงรายการที่ถูกยกเลิกจากระบบต้นทาง</td></tr>
              )}
              {member && cancels.length === 0 && (
                <tr><td colSpan="6" className="center muted" style={{ padding: '24px 12px' }}>ไม่มีรายการยกเลิกจากต้นทางของสมาชิกรายนี้</td></tr>
              )}
              {member && cancels.map(row => (
                <tr key={row.ref}>
                  <td className="mono" style={{ fontSize: 12 }}>{row.ref}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{window.fcxMethodLabel(row.method)}</td>
                  <td>
                    <span className={"chip " + (row.txnType === 'pay' ? 'warning' : 'success')} style={{ marginRight: 6 }}>
                      {row.txnType === 'pay' ? 'จ่าย' : 'รับ'}
                    </span>
                    {row.item}
                  </td>
                  <td className="right mono">{window.fmt.money(row.amount, 2)}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{row.contra}</td>
                  <td className="center">
                    <button className="btn text sm" onClick={() => pullCancel(row)}><Icon name="download" size={12} /> ดึงเข้ารายการ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── รายการที่บันทึกล่าสุด (layout เดียวกับรายการยกเลิกจากต้นทาง) ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการรับ / จ่ายจากระบบอื่น ล่าสุด</h3>
          <div className="head-actions">
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {sorted.length} รายการ</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th style={{ width: 128 }}>เลขที่</th>
                <th style={{ width: 100 }}>วันที่</th>
                <th style={{ width: 84 }}>ประเภท</th>
                <th style={{ width: 92 }}>ทะเบียน</th>
                <th style={{ minWidth: 200 }}>สมาชิก</th>
                <th style={{ width: 78 }}>วิธี</th>
                <th className="right" style={{ width: 130 }}>สุทธิ (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="7" className="center muted" style={{ padding: '26px 12px' }}>ยังไม่มีรายการ</td></tr>
              )}
              {sorted.map(rec => (
                <tr key={rec.id}>
                  <td className="mono" style={{ fontSize: 12 }}>{rec.id}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{window.fmt.date(rec.txnDate)}</td>
                  <td><span className={"chip " + (rec.txnType === 'pay' ? 'warning' : 'success')}>{rec.txnType === 'pay' ? 'จ่าย' : 'รับ'}</span></td>
                  <td className="mono" style={{ fontSize: 12 }}>{rec.regNo}</td>
                  <td>{rec.memberName}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{window.fcxMethodLabel(rec.method)}</td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(rec.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {searchOpen && window.MemberSearchModal && (
        <MemberSearchModal onPick={pickMember} onClose={() => setSearchOpen(false)}
                           title="ค้นหาสมาชิก — รับ/จ่ายเงินจากระบบอื่น" showUnit
                           source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)} />
      )}
    </div>
  );
}

function FinCrossSystemPage({ onToast }) { return <FinCrossSystemWorkspace onToast={onToast} />; }
Object.assign(window, { FinCrossSystemPage, FinCrossSystemWorkspace });
