// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — รับ / จ่าย ตามประเภท (Receipt / Payment by type)
//  ฟอร์มบันทึกรายการรับ/จ่ายเงินทั่วไป แยกบรรทัดตามบัญชีรับรู้
//  + หัก ณ ที่จ่าย · VAT · คำนวณยอดสุทธิอัตโนมัติ  ·  ตารางรายการล่าสุด
// ════════════════════════════════════════════════════════════════════
const { useState: fbtUseState, useMemo: fbtUseMemo } = React;

function FbtField({ label, hint, required, children, style }) {
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

const fbtBlankLine = () => ({ code: '', desc: '', acct: '', whtPct: 0, vat: false, amount: '' });
const fbtBlankDoc = (type, list) => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: window.fbtNextNo(list || [], type, new Date().toISOString()),
    ts: new Date().toISOString(), type,
    receiptDate: today, txnDate: today,
    partyType: 'member', partyCode: '', partyName: '',
    receiveUnit: (window.FBT_RECEIVE_UNITS[0] || {}).v || '00100',
    method: 'cash', cashAcct: window.fbtDefaultCashAccount(), docState: 'normal',
    by: window.FBT_CURRENT_USER.name, branch: window.FBT_CURRENT_USER.branch,
    wht: false, taxId: '', address: '', detail: '', note: '',
    lines: [fbtBlankLine()],
  };
};

function FinByTypeWorkspace({ onToast, initialRecord }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = fbtUseState(window.fbtLoad);
  const [d, setD] = fbtUseState(() => (initialRecord
    ? JSON.parse(JSON.stringify(initialRecord))
    : fbtBlankDoc('pay', window.fbtLoad())));
  const [partyModal, setPartyModal] = fbtUseState(false);

  const persist = (next) => { setList(next); window.fbtSave(next); };
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  const t = window.fbtTxnType(d.type);
  // ทำรายการโดย → เลือกรหัสบัญชี (เงินสด / เงินฝาก) ให้อัตโนมัติ
  const methodAccount = (method) => {
    const list = window.fbtPostingAccounts();
    const find = (re) => (list.find(a => re.test(a.name)) || {}).code;
    const code = method === 'cash' ? find(/เงินสดในมือ/) || find(/เงินสด/)
      : method === 'cheque' ? find(/กระแสรายวัน/) || find(/เงินฝากธนาคาร/) || find(/ธนาคาร/)
      : find(/เงินฝากธนาคาร/) || find(/ธนาคาร/) || find(/ออมทรัพย์/);
    return code || window.fbtDefaultCashAccount();
  };
  const setMethod = (method) => setD(p => ({ ...p, method, cashAcct: methodAccount(method) }));
  const accounts = fbtUseMemo(() => window.fbtPostingAccounts(), []);
  const totals = window.fbtTotals(d.lines);
  // บรรทัดที่มีภาษีหัก ณ ที่จ่าย — แสดงเมื่อติ๊ก "หักภาษี ณ ที่จ่าย"
  const whtLines = d.lines.map((l, i) => {
    const pct = Number(String(l.whtPct || 0).replace(/,/g, '')) || 0;
    const base = Number(String(l.amount || 0).replace(/,/g, '')) || 0;
    return { i, desc: l.desc, pct, base, tax: base * pct / 100 };
  }).filter(w => w.pct > 0 && w.base > 0);

  // เปลี่ยนประเภทรายการ → ออกเลขที่ใหม่ตามประเภท
  const changeType = (type) => {
    setD(p => ({ ...p, type, id: window.fbtNextNo(list, type, new Date().toISOString()) }));
  };

  // ── รายการ (บรรทัด) ──
  const setLine = (i, patch) => setD(p => ({ ...p, lines: p.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));
  const addLine = () => setD(p => ({ ...p, lines: [...p.lines, fbtBlankLine()] }));
  const removeLine = (i) => setD(p => ({ ...p, lines: p.lines.length > 1 ? p.lines.filter((_, idx) => idx !== i) : p.lines }));

  const pickMember = (m) => {
    setD(p => ({ ...p, partyCode: m.code, partyName: m.name, address: m.address || p.address }));
    setPartyModal(false);
  };

  const resetForm = () => {
    setD(fbtBlankDoc(d.type, list));
    onToast && onToast('ล้างฟอร์มเรียบร้อย — พร้อมบันทึกรายการใหม่');
  };

  const save = () => {
    if (!d.partyName.trim()) { onToast && onToast('กรุณาระบุชื่อผู้' + t.verb + 'เงิน'); return; }
    const hasLine = d.lines.some(l => (l.acct || l.desc) && Number(String(l.amount).replace(/,/g, '')) > 0);
    if (!hasLine) { onToast && onToast('กรุณาเพิ่มรายการอย่างน้อย 1 บรรทัด พร้อมจำนวนเงิน'); return; }
    const clean = { ...d, ts: new Date().toISOString() };
    const exists = list.some(v => v.id === clean.id);
    const next = exists ? list.map(v => v.id === clean.id ? clean : v) : [clean, ...list];
    persist(next);
    audit.log && audit.log({
      action: exists ? 'update' : 'create', module: 'การเงิน — รับ/จ่าย ตามประเภท',
      target: `${clean.id} · ${clean.partyName}`,
      summary: `${t.l} “${clean.partyName}” ${window.fmt.money(window.fbtTotals(clean.lines).net, 2)} บาท`,
    });
    onToast && onToast(`บันทึก${t.l} ${clean.id} เรียบร้อย — สุทธิ ${window.fmt.money(window.fbtTotals(clean.lines).net, 2)} บาท`);
    setD(fbtBlankDoc(d.type, next));
  };

  const editRecord = (rec) => {
    setD(JSON.parse(JSON.stringify(rec)));
    window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sorted = fbtUseMemo(() => [...list].sort((a, b) => (a.ts < b.ts ? 1 : -1)), [list]);

  return (
    <div data-screen-label="หน้ารับ/จ่าย ตามประเภท (การเงิน)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับ / จ่าย ตามประเภท</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 720 }}>
            บันทึกรายการรับหรือจ่ายเงินทั่วไป แยกบรรทัดตามบัญชีรับรู้ พร้อมหักภาษี ณ ที่จ่ายและ VAT — คำนวณยอดสุทธิอัตโนมัติ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกรายการ</button>
      </div>

      {/* หัวเอกสาร */}
      <div className="search-card fbt-card">
        <div className="fbt-grid g3">
          <FbtField label="ประเภทรายการ" required>
            <FbtSelect className="cfg-input" value={d.type} onChange={(e) => changeType(e.target.value)}>
              {window.FBT_TXN_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </FbtSelect>
          </FbtField>
          <FbtField label="วันที่ใบเสร็จ" required>
            <FbtDate value={d.receiptDate} onChange={(v) => set('receiptDate', v)} />
          </FbtField>
          <FbtField label="วันที่ทำรายการ" hint="(วันที่ระบบ)">
            <input className="cfg-input fbt-ro" value={window.fmt.date(d.txnDate)} readOnly />
          </FbtField>

          <FbtField label="ประเภทคู่ค้า / เลขที่" required>
            <div className="fbt-party">
              <FbtSelect className="cfg-input" style={{ flex: '0 0 118px', width: 'auto' }} value={d.partyType}
                      onChange={(e) => setD(p => ({ ...p, partyType: e.target.value, partyCode: '', partyName: '' }))}>
                {window.FBT_PARTY_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </FbtSelect>
              <input className="cfg-input mono fbt-party-code" value={d.partyCode}
                     placeholder="รหัส" onChange={(e) => set('partyCode', e.target.value)} />
              {d.partyType === 'member' && (
                <button type="button" className="btn fbt-party-btn" title="ค้นหาสมาชิก" onClick={() => setPartyModal(true)}>…</button>
              )}
            </div>
          </FbtField>
          <FbtField label="ชื่อ – ชื่อสกุล" required>
            <input className="cfg-input" value={d.partyName} placeholder="ชื่อผู้รับ / ผู้จ่ายเงิน"
                   onChange={(e) => set('partyName', e.target.value)} />
          </FbtField>
          <FbtField label="ส่วนรับเงิน">
            <FbtSelect className="cfg-input" value={d.receiveUnit} onChange={(e) => set('receiveUnit', e.target.value)}>
              {window.FBT_RECEIVE_UNITS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </FbtSelect>
          </FbtField>

          <FbtField label="ทำรายการโดย" required>
            <FbtSelect className="cfg-input" value={d.method} onChange={(e) => setMethod(e.target.value)}>
              {window.FBT_METHODS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </FbtSelect>
          </FbtField>
          <FbtField label="รหัสบัญชี" hint="(เงินสด / เงินฝาก)" required>
            <FbtSelect className="cfg-input" value={d.cashAcct} onChange={(e) => set('cashAcct', e.target.value)}>
              {accounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </FbtSelect>
          </FbtField>
          <FbtField label="ใบรายการ">
            <FbtSelect className="cfg-input" value={d.docState} onChange={(e) => set('docState', e.target.value)}>
              {window.FBT_DOC_STATES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </FbtSelect>
          </FbtField>

          <FbtField label="ผู้ทำรายการ" hint="(จาก Login)">
            <input className="cfg-input fbt-ro" value={d.by} readOnly />
          </FbtField>
          <FbtField label="สาขาทำรายการ">
            <FbtSelect className="cfg-input" value={d.branch} onChange={(e) => set('branch', e.target.value)}>
              {window.FBT_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </FbtSelect>
          </FbtField>
          <FbtField label="สถานะรายการ">
            <input className="cfg-input fbt-ro fbt-status" value={window.FBT_RECORD_STATUS} readOnly />
          </FbtField>
        </div>

        {/* ภาษี + ยอดสุทธิ */}
        <div className="fbt-taxrow">
          <div className="fbt-tax-fields">
            <div className="fbt-tax-line">
              <label className="fbt-chk">
                <input type="checkbox" checked={d.wht} onChange={(e) => set('wht', e.target.checked)} />
                <span>หักภาษี ณ ที่จ่าย</span>
              </label>
              <div className="fbt-tax-amt mono">{window.fmt.money(totals.wht, 2)}</div>
            </div>
            {d.wht && (
            <div className="fbt-tax-line">
              <label className="fbt-tax-name">จำนวน VAT</label>
              <div className="fbt-tax-amt mono">{window.fmt.money(totals.vat, 2)}</div>
            </div>
            )}
            {d.wht && (
              <div className="fbt-wht-detail">
                <div className="fbt-wht-rows">
                  {whtLines.length === 0 ? (
                    <div className="muted" style={{ fontSize: 12 }}>ยังไม่มีบรรทัดที่ระบุอัตราภาษีหัก ณ ที่จ่าย — กรอกช่อง “ภาษี %” ในตารางรายการ</div>
                  ) : whtLines.map(w => (
                    <div key={w.i} className="fbt-wht-row">
                      <span className="mono" style={{ minWidth: 22 }}>{w.i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.desc || '—'}
                      </span>
                      <span className="mono muted" style={{ minWidth: 52, textAlign: 'right' }}>{w.pct}%</span>
                      <span className="mono" style={{ minWidth: 96, textAlign: 'right' }}>{window.fmt.money(w.base, 2)}</span>
                      <span className="mono" style={{ minWidth: 96, textAlign: 'right', fontWeight: 600 }}>{window.fmt.money(w.tax, 2)}</span>
                    </div>
                  ))}
                </div>
                <div className="fbt-wht-foot">
                  <span>รวมภาษีหัก ณ ที่จ่าย</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{window.fmt.money(totals.wht, 2)}</span>
                </div>
              </div>
            )}
          </div>
          <div className={"fbt-netbox " + t.tone}>
            <span className="fbt-net-lab">สุทธิ :</span>
            <span className="fbt-net-val mono">{window.fmt.money(totals.net, 2)}</span>
          </div>
        </div>

        {/* รายละเอียด + ผู้เสียภาษี — แสดงเมื่อติ๊กหักภาษี ณ ที่จ่าย */}
        {d.wht && <>
        <div className="fbt-grid g1" style={{ marginTop: 12 }}>
          <FbtField label="รายละเอียด">
            <input className="cfg-input" value={d.detail} placeholder="คำอธิบายรายการโดยรวม"
                   onChange={(e) => set('detail', e.target.value)} />
          </FbtField>
        </div>
        <div className="fbt-grid fbt-idrow" style={{ marginTop: 10 }}>
          <FbtField label="เลขที่ผู้เสียภาษี">
            <input className="cfg-input mono" value={d.taxId} placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก"
                   maxLength={13} onChange={(e) => set('taxId', e.target.value.replace(/\D/g, ''))} />
          </FbtField>
          <FbtField label="ที่อยู่">
            <input className="cfg-input" value={d.address} placeholder="ที่อยู่ตามเอกสาร"
                   onChange={(e) => set('address', e.target.value)} />
          </FbtField>
        </div>
        <div className="fbt-grid g1" style={{ marginTop: 10 }}>
          <FbtField label="หมายเหตุ">
            <input className="cfg-input" value={d.note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                   onChange={(e) => set('note', e.target.value)} />
          </FbtField>
        </div>
        </>}
      </div>

      {/* รายการ (บรรทัด) */}
      <div className="search-card fbt-card">
        <div className="fbt-lines-head">
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>รายการ</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm" onClick={addLine}><Icon name="plus" size={12} /> เพิ่มแถว</button>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl fbt-tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }}>#</th>
                <th style={{ width: 120 }}>รหัสรายการ</th>
                <th style={{ minWidth: 240 }}>คำอธิบายรายการ <span className="muted" style={{ fontWeight: 400 }}>(ไม่เกิน 255 ตัวอักษร)</span></th>
                <th style={{ width: 210 }}>บัญชีรับรู้</th>
                <th className="center" style={{ width: 78 }}>ภาษี %</th>
                <th className="center" style={{ width: 62 }}>คิด VAT</th>
                <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
                <th style={{ width: 34 }} />
              </tr>
            </thead>
            <tbody>
              {d.lines.map((l, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td><input className="vch-cell-input mono" value={l.code} placeholder="รหัส"
                             maxLength={10} onChange={(e) => setLine(i, { code: e.target.value })} /></td>
                  <td><input className="vch-cell-input" value={l.desc} placeholder="คำอธิบายรายการ"
                             maxLength={255} onChange={(e) => setLine(i, { desc: e.target.value })} /></td>
                  <td>
                    <FbtSelect className="vch-cell-input" value={l.acct} onChange={(e) => setLine(i, { acct: e.target.value })}>
                      <option value="">— เลือกบัญชี —</option>
                      {accounts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                    </FbtSelect>
                  </td>
                  <td className="center">
                    <input className="vch-cell-input num" type="number" inputMode="decimal" min="0" max="100" step="0.5"
                           value={l.whtPct} placeholder="0" onChange={(e) => setLine(i, { whtPct: e.target.value })} />
                  </td>
                  <td className="center">
                    <input type="checkbox" checked={!!l.vat} onChange={(e) => setLine(i, { vat: e.target.checked })} />
                  </td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={l.amount}
                             placeholder="0.00" onChange={(e) => setLine(i, { amount: e.target.value })} /></td>
                  <td className="center">
                    <button className="btn sm tt-del-btn" title="ลบแถว" aria-label="ลบแถว" onClick={() => removeLine(i)} disabled={d.lines.length <= 1}>
                      <Icon name="trash" size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fbt-foot">
                <td colSpan="4" className="right">รวม :</td>
                <td className="center mono">{window.fmt.money(totals.wht, 2)}</td>
                <td className="center mono">{window.fmt.money(totals.vat, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totals.amount, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="vch-tax-note muted">
          <Icon name="info" size={12} /> ยอดสุทธิ = จำนวนเงินรวม + VAT (7% ต่อบรรทัดที่คิด) − ภาษีหัก ณ ที่จ่าย (ตาม % ต่อบรรทัด) · บัญชีรับรู้อ้างอิงผังบัญชีของสหกรณ์
        </div>
      </div>

      {/* รายการล่าสุด */}
      <div className="search-card fbt-card">
        <div className="fbt-lines-head">
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>รายการรับ / จ่าย ล่าสุด</h3>
          <span className="spacer" />
          <div className="muted" style={{ fontSize: 11.5 }}><Icon name="info" size={12} /> คลิกแถวเพื่อเปิดแก้ไข</div>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl fbt-tbl" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>เลขที่</th>
                <th style={{ width: 104 }}>วันที่</th>
                <th style={{ width: 96 }}>ประเภท</th>
                <th style={{ minWidth: 200 }}>ผู้รับ / ผู้จ่ายเงิน</th>
                <th style={{ width: 78 }}>วิธี</th>
                <th className="right" style={{ width: 130 }}>สุทธิ (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan="6" className="center muted" style={{ padding: '26px 12px' }}>ยังไม่มีรายการ</td></tr>
              )}
              {sorted.map(rec => {
                const rt = window.fbtTxnType(rec.type);
                const net = window.fbtTotals(rec.lines).net;
                const cancelled = rec.docState === 'cancel';
                return (
                  <tr key={rec.id} className={"clickable" + (cancelled ? ' fin-row-cancel' : '')} onClick={() => editRecord(rec)}>
                    <td className="mono" style={{ fontSize: 12 }}>{rec.id}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{window.fmt.date(rec.receiptDate)}</td>
                    <td><span className={"chip " + (rec.type === 'receive' ? 'success' : 'warning')}>{rt.verb}</span></td>
                    <td>
                      <div className="lt-row-name">{rec.partyName}</div>
                      {rec.detail && <div className="lt-row-note muted">{rec.detail}</div>}
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{window.fbtMethodLabel(rec.method)}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(net, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {partyModal && window.MemberSearchModal && (
        <MemberSearchModal onPick={pickMember} onClose={() => setPartyModal(false)}
                           title="ค้นหาสมาชิก — รับ/จ่าย ตามประเภท"
                           source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)} />
      )}
    </div>
  );
}

// Dropdown / ปฏิทิน — ใช้ชุดเดียวกับเมนูใบสำคัญรับ
function FbtSelect(props) { const C = window.RcvSelect; return C ? <C {...props} /> : <select {...props} />; }
function FbtDate(props) {
  const C = window.ThaiDateField || window.RcvThaiDate;
  return C ? <C {...props} />
    : <input className="cfg-input" type="date" value={props.value || ''} onChange={(e) => props.onChange(e.target.value)} />;
}

function FinByTypePage({ onToast }) { return <FinByTypeWorkspace onToast={onToast} />; }
Object.assign(window, { FinByTypePage, FinByTypeWorkspace });
