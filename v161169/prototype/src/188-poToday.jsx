// ═════════════════════════════════════════════════════════════════
//  ใบสั่งชำระเงิน (Payment Order) — ระบบงานสินเชื่อ
//  ────────────────────────────────────────────────────────────────
//  ออกใบสั่งชำระเงินให้สมาชิก: รับชำระหนี้เงินกู้ (ต้น/ดอกเบี้ย),
//  ซื้อหุ้นพิเศษ และรายการอื่น ๆ — คำนวณยอดรวมแบบ real-time
//  โครงสร้าง: ① ข้อมูลเอกสาร/สมาชิก + การ์ดยอดรวม  ② รายการหนี้
//             ③ รายการหุ้น  ④ รายการอื่น ๆ  ⑤ แถบปุ่มคำสั่ง
// ═════════════════════════════════════════════════════════════════

const poToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const poNum = (v) => Number(v) || 0;

// สถานะสมาชิก/สัญญาที่ห้ามทำรายการ
const PO_BLOCK_MEMBER = { 'เสียชีวิต': 'สมาชิกเสียชีวิต', 'พ้นสภาพ': 'สมาชิกพ้นสภาพ' };
const PO_BLOCK_CONTRACT = { 'ดำเนินคดี': true, 'ปิดบัญชี': true, 'อายัด': true };

// ── ฟิลด์ (label เล็กด้านบน + control) ──────────────────────────────
function PoFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function PoRO({ value, mono, placeholder, auto }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (auto ? ' icr-auto' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}
// ─── Modal ประวัติการแก้ไข — ไทม์ไลน์จาก Audit Trail ───────────
const PO_MODULES = ['สินเชื่อ — ใบสั่งชำระเงิน'];

function PoHistoryModal({ title, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = (ctx && ctx.entries) || window.AUDIT_SEED || [];
  const rows = all
    .filter((e) => PO_MODULES.includes(e.module))
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 640, width: '92vw' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการแก้ไข</h2>
            <div className="muted" style={{ fontSize: 11 }}>{title}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {rows.length === 0 ? (
            <div className="muted" style={{ padding: '20px 2px', textAlign: 'center', fontSize: 13 }}>
              ยังไม่มีประวัติการแก้ไข
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map((e) => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{window.fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span>
                        <span className="sep">·</span>
                        <span className="mono muted">{e.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn sm" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ช่องกรอกจำนวนเงินในตาราง
function PoAmt({ value, onChange, disabled, max }) {
  return (
    <input type="text" inputMode="decimal"
      className={'cfg-input mono po-amt' + (disabled ? ' po-amt-off' : '')}
      value={disabled ? '' : window.fmt.money(poNum(value), 2)}
      disabled={disabled}
      onFocus={(e) => { if (!disabled) e.target.select(); }}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, '');
        let n = poNum(raw);
        if (max != null && n > max) n = max;
        onChange(n);
      }} />
  );
}

// ════════════════════════════════════════════════════════════════════
function PaymentOrderPage({ onToast }) {
  const { useState, useMemo } = React;
  const today = poToday();
  const fmt = window.fmt;

  const [member, setMember]       = useState(null);
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(today);
  const [txnDate, setTxnDate]     = useState(today);
  const [txnCode, setTxnCode]     = useState('PX');
  const [channel, setChannel]     = useState('CSH');
  const [account, setAccount]     = useState(window.PO_ACCOUNTS[0]);
  const [receiptName, setReceiptName] = useState('');

  const [rcvRefs, setRcvRefs]     = useState([]);   // รายการเงินรอจ่ายคืนที่ค้างจ่าย (เมื่อทำรายการโดย RCV)
  const [rcvModal, setRcvModal]   = useState(false);

  const [debtRows, setDebtRows]   = useState([]);
  const [shareRows, setShareRows] = useState([]);
  const [otherRows, setOtherRows] = useState([]);
  const [error, setError] = useState('');
  const [warn, setWarn]   = useState('');
  const [editing, setEditing] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [okMsg, setOkMsg] = useState(null);
  const [noticePick, setNoticePick] = useState(false);   // popup เลือกใบแจ้งชำระที่ยังไม่ชำระ
  const [noticePrint, setNoticePrint] = useState(null);  // ใบแจ้งที่เลือกพิมพ์
  const snapRef = React.useRef(null);

  const loaded = !!member;
  const isRcv  = channel === 'RCV';
  const rcvTotal = useMemo(() => rcvRefs.reduce((a, r) => a + poNum(r.amount), 0), [rcvRefs]);

  // ── โหลดข้อมูลสมาชิก ──
  const pickMember = (m) => {
    const block = PO_BLOCK_MEMBER[m.status];
    setMember(m);
    setReceiptName(m.name || '');
    setDebtRows((window.poDebtRows(m) || []).map(r => ({
      ...r, checked: false, payPrincipal: 0, payInterest: 0,
    })));
    setShareRows((window.poShareRows(m) || []).map(r => ({ ...r, checked: false, buyMore: 0 })));
    setOtherRows((window.poOtherRows(m) || []).map(r => ({ ...r, checked: false })));
    setError(block ? `ไม่สามารถทำรายการได้: ${block} — โปรดตรวจสอบสถานะสมาชิก` : '');
    setWarn(m.status === 'ลาออก' ? 'สมาชิกรายนี้อยู่ระหว่างลาออก — ทำรายการได้เฉพาะเพื่อปิดบัญชี' : '');
    setEditing(true); snapRef.current = null;   // เข้ามาแล้วทำรายการได้ทันที
  };

  // ── ปรับปรุงแถว ──
  const setDebt  = (i, patch) => setDebtRows(rs => rs.map((r, x) => x === i ? { ...r, ...patch } : r));
  const setShare = (i, patch) => setShareRows(rs => rs.map((r, x) => x === i ? { ...r, ...patch } : r));
  const setOther = (i, patch) => setOtherRows(rs => rs.map((r, x) => x === i ? { ...r, ...patch } : r));

  // เลือก/ยกเลิกแถวหนี้ → เติม/ล้างยอดชำระเต็ม
  const toggleDebt = (i, on) => setDebt(i, on
    ? { checked: true,  payPrincipal: debtRows[i].principal, payInterest: debtRows[i].intNew }
    : { checked: false, payPrincipal: 0, payInterest: 0 });
  const toggleShare = (i, on) => setShare(i, { checked: on, buyMore: on ? shareRows[i].buyMore : 0 });
  const toggleOther = (i, on) => setOther(i, { checked: on, amount: on ? otherRows[i].amount : 0 });

  // ── ยอดรวม (real-time) ──
  const debtSum = useMemo(() => debtRows.reduce((a, r) => a + (r.checked ? poNum(r.payPrincipal) + poNum(r.payInterest) : 0), 0), [debtRows]);
  const shareSum = useMemo(() => shareRows.reduce((a, r) => a + (r.checked ? poNum(r.buyMore) : 0), 0), [shareRows]);
  const otherSum = useMemo(() => otherRows.reduce((a, r) => a + (r.checked ? poNum(r.amount) : 0), 0), [otherRows]);
  const grandTotal = debtSum + shareSum + otherSum;

  const principalTotal   = debtRows.reduce((a, r) => a + poNum(r.principal), 0);
  const intDueTotal      = debtRows.reduce((a, r) => a + poNum(r.intDue), 0);
  const intNewTotal      = debtRows.reduce((a, r) => a + poNum(r.intNew), 0);
  const payPrincipalTotal= debtRows.reduce((a, r) => a + (r.checked ? poNum(r.payPrincipal) : 0), 0);
  const payInterestTotal = debtRows.reduce((a, r) => a + (r.checked ? poNum(r.payInterest) : 0), 0);
  const remainTotal      = debtRows.reduce((a, r) => a + (poNum(r.principal) - (r.checked ? poNum(r.payPrincipal) : 0)), 0);
  const shareCapitalTotal= shareRows.reduce((a, r) => a + poNum(r.capital), 0);
  const shareAccumTotal  = shareRows.reduce((a, r) => a + poNum(r.capital) + (r.checked ? poNum(r.buyMore) : 0), 0);

  const anySelected = debtRows.some(r => r.checked) || shareRows.some(r => r.checked) || otherRows.some(r => r.checked);

  // ── กระจายยอด: เลือกทุกสัญญา + เติมยอดชำระเต็ม ──
  const distribute = () => {
    if (!loaded) { setError('กรุณาค้นหาและเลือกสมาชิกก่อน'); return; }
    if (debtRows.length === 0) { setError('สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง'); return; }
    setDebtRows(rs => rs.map(r => ({ ...r, checked: true, payPrincipal: r.principal, payInterest: r.intNew })));
    setError('');
    onToast && onToast('กระจายยอดชำระเต็มจำนวนไปยังทุกสัญญาเรียบร้อยแล้ว');
  };

  const clearScreen = () => {
    setMember(null); setReceiptNo(''); setReceiptDate(today); setTxnDate(today);
    setTxnCode('PX'); setChannel('CSH'); setAccount(window.PO_ACCOUNTS[0]); setReceiptName('');
    setRcvRefs([]); setRcvModal(false);
    setDebtRows([]); setShareRows([]); setOtherRows([]); setError(''); setWarn('');
    setEditing(false); snapRef.current = null;
  };

  // ── เข้า/ออกโหมดแก้ไข ──
  const startEdit = () => {
    if (!loaded) return;
    snapRef.current = {
      receiptDate, txnDate, txnCode, channel, account, receiptName,
      rcvRefs: rcvRefs.slice(),
      debtRows: debtRows.map(r => ({ ...r })),
      shareRows: shareRows.map(r => ({ ...r })),
      otherRows: otherRows.map(r => ({ ...r })),
    };
    setError(''); setEditing(true);
  };
  const cancelEdit = () => {
    const s = snapRef.current;
    if (s) {
      setReceiptDate(s.receiptDate); setTxnDate(s.txnDate); setTxnCode(s.txnCode);
      setChannel(s.channel); setAccount(s.account); setReceiptName(s.receiptName);
      setRcvRefs(s.rcvRefs.slice());
      setDebtRows(s.debtRows.map(r => ({ ...r })));
      setShareRows(s.shareRows.map(r => ({ ...r })));
      setOtherRows(s.otherRows.map(r => ({ ...r })));
    }
    snapRef.current = null;
    setError(''); setEditing(false);
  };

  const validate = () => {
    if (!member) return 'กรุณาระบุเลขสมาชิกและค้นหาข้อมูลก่อนบันทึก';
    if (PO_BLOCK_MEMBER[member.status]) return `ไม่สามารถทำรายการได้: ${PO_BLOCK_MEMBER[member.status]}`;
    if (!txnDate) return 'กรุณาระบุวันที่รายการ';
    if (!txnCode) return 'กรุณาเลือกรหัสรายการรับชำระ';
    if (!channel) return 'กรุณาเลือกช่องทางรับชำระ';
    if (isRcv && rcvRefs.length === 0) return 'ทำรายการโดยเงินรอจ่ายคืน — กรุณาเลือกรายการเงินรอจ่ายคืนที่ค้างจ่ายอย่างน้อย 1 รายการ';
    if (!anySelected) return 'กรุณาเลือกรายการหนี้ / หุ้น / อื่น ๆ อย่างน้อย 1 รายการ';
    const over = debtRows.find(r => r.checked && poNum(r.payPrincipal) > poNum(r.principal));
    if (over) return `ยอดชำระต้นเงินของสัญญา ${over.contractNo} เกินต้นเงินคงเหลือ`;
    const overInt = debtRows.find(r => r.checked && poNum(r.payInterest) > poNum(r.intNew) + poNum(r.intDue));
    if (overInt) return `ยอดชำระดอกเบี้ยของสัญญา ${overInt.contractNo} เกินดอกเบี้ยที่คำนวณได้`;
    if (grandTotal <= 0) return 'ยอดรวมต้องมากกว่า 0.00 จึงจะบันทึกได้';
    if (isRcv && rcvTotal + 0.005 < grandTotal) return `เงินรอจ่ายคืนที่เลือกไว้ ${fmt.money(rcvTotal, 2)} บาท ไม่พอกับยอดรับชำระรวม ${fmt.money(grandTotal, 2)} บาท`;
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const no = window.poNextReceiptNo();
    setReceiptNo(no);
    // ใบสั่งชำระที่บันทึก = ใบแจ้งชำระรอชำระของงวดวันที่รายการ (เลือกพิมพ์ได้จากปุ่มพิมพ์ใบแจ้งชำระ)
    window.poSaveNotice && window.poSaveNotice({
      id: 'PO-' + no, docNo: no, kind: 'ใบสั่งชำระเงิน (' + (txnCode || '') + ')', memberCode: member.code,
      period: String(txnDate).slice(0, 7), issueDate: txnDate, dueDate: txnDate, status: 'unpaid',
      lines: [
        ...debtRows.filter(r => r.checked).map(r => ({ detail: 'ชำระเงินกู้ ' + (r.type || r.code), contractNo: r.contractNo, principal: poNum(r.payPrincipal), interest: poNum(r.payInterest) })),
        ...shareRows.filter(r => r.checked && poNum(r.buyMore) > 0).map(r => ({ detail: r.detail, amount: poNum(r.buyMore) })),
        ...otherRows.filter(r => r.checked && poNum(r.amount) > 0).map(r => ({ detail: r.detail, amount: poNum(r.amount) })),
      ],
    });
    setOkMsg({
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: `บันทึกใบสั่งชำระเงิน ${no} · ${member.code} ${member.name} · ยอดรับชำระรวม ${fmt.money(grandTotal, 2)} บาท เรียบร้อยแล้ว`,
    });
    snapRef.current = null;
  };

  // ── badge “บันทึกล่าสุด” — เวลาจาก Audit Trail ของเมนูนี้ ──
  const savedBadge = (() => {
    if (!loaded) return null;
    const ts = window.savedBadgeTs ? window.savedBadgeTs(window.AUDIT_SEED || [], PO_MODULES, 'po.' + member.code) : null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(ts)) || null;
  })();
  const doPrint = () => { if (loaded) { setError(''); setNoticePick(true); } };

  const demoMembers = (window.DN_MEMBERS || []).filter(m => (window.PO_DEMO_CODES || []).includes(m.code));

  return (
    <div data-screen-label="ใบสั่งชำระเงิน">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ใบสั่งชำระเงิน</h1>
            <div className="icr-form-sub">ระบบงานสินเชื่อ · รับชำระหนี้เงินกู้ · ซื้อหุ้นพิเศษ · รายการอื่น ๆ</div>
          </div>
        </div>
        <div className="icr-form-actions">
          {savedBadge && <span className="saved-badge">{savedBadge}</span>}
          <button className="btn sm" onClick={() => setHistOpen(true)} disabled={!loaded}><Icon name="history" size={13} /> ประวัติ</button>
          <button className="btn sm" onClick={doPrint} disabled={!loaded}><Icon name="print" size={13} /> พิมพ์ใบแจ้งชำระ</button>
          <button className="btn primary sm" onClick={doSave} disabled={!loaded}><Icon name="check" size={13} /> บันทึก</button>
        </div>
      </div>

      {noticePick && member && window.PoNoticePickModal && (
        <window.PoNoticePickModal member={member} asOf={txnDate} onClose={() => setNoticePick(false)}
          onPrint={(list) => { setNoticePick(false); setNoticePrint(list); }} />
      )}
      {noticePrint && member && window.PoNoticePrintOverlay && (
        <window.PoNoticePrintOverlay notices={noticePrint} member={member} printedBy="จันทร์เพ็ญ มาลี" onClose={() => setNoticePrint(null)} />
      )}
      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {warn && !error && (<div className="dn-status-alert warn" style={{ marginBottom: 12 }}><Icon name="info" size={15} /><span>{warn}</span></div>)}

      {/* ── ข้อมูลเอกสาร/สมาชิก + การ์ดยอดรวม ── */}
      <div className="po-top-grid">
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลเอกสาร / ข้อมูลสมาชิก</h3></div>
          <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            <PoFld label="เลขที่ใบเสร็จ" fill><PoRO value={receiptNo || 'AUTO'} mono auto={!receiptNo} /></PoFld>
            <PoFld label="เลขสมาชิก" fill required>
              <MemberSearchField member={member} onPick={pickMember}
                source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
                title="ค้นหาสมาชิก — ใบสั่งชำระเงิน" changeLabel="เปลี่ยน"
                placeholder="ค้นหาเลขสมาชิก / ชื่อ…" />
            </PoFld>
            <PoFld label="วันที่ใบเสร็จ" fill required>
              <ErpDate value={receiptDate} disabled={!editing} onChange={(v) => ((e) => setReceiptDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </PoFld>
            <PoFld label="วันที่รายการ" fill required>
              <ErpDate value={txnDate} disabled={!editing} onChange={(v) => ((e) => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </PoFld>
            <PoFld label="รหัสรายการ" fill required>
              <select className="cfg-input" value={txnCode} disabled={!editing} onChange={(e) => setTxnCode(e.target.value)}>
                {window.PO_TXN_CODES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </PoFld>
            <PoFld label="ชื่อ-นามสกุล" fill><PoRO value={member ? member.name : ''} placeholder="—" /></PoFld>
            <PoFld label="สังกัด" fill><PoRO value={member ? `${member.deptCode || ''} ${member.dept || ''}`.trim() : ''} placeholder="—" /></PoFld>
            <PoFld label="ทำรายการโดย" fill required>
              <select className="cfg-input" value={channel} disabled={!editing}
                onChange={(e) => {
                  const v = e.target.value;
                  setChannel(v); setError('');
                  const c = window.PO_CHANNELS.find(x => x.value === v); if (c) setAccount(c.account);
                  if (v !== 'RCV') setRcvRefs([]);
                }}>
                {window.PO_CHANNELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </PoFld>
            <PoFld label="คู่บัญชี" fill required>
              <select className="cfg-input mono" value={account} disabled={!editing} onChange={(e) => setAccount(e.target.value)}>
                {window.PO_ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </PoFld>
            <PoFld label="ออกใบเสร็จชื่อ" fill>
              <input className="cfg-input" value={receiptName} onChange={(e) => setReceiptName(e.target.value)} placeholder="ชื่อผู้รับใบเสร็จ" disabled={!loaded || !editing} />
            </PoFld>
          </div>
        </div>

        <div className="po-total-card">
          <div className="po-total-head"><span>ยอดรับชำระรวม</span><Icon name="info" size={14} /></div>
          <div className="po-total-value">{fmt.money(grandTotal, 2)}</div>
          <div className="po-total-unit">บาท</div>
          <div className="po-total-break">
            <div><span>รวมชำระหนี้</span><b>{fmt.money(debtSum, 2)}</b></div>
            <div><span>ซื้อหุ้นเพิ่ม</span><b>{fmt.money(shareSum, 2)}</b></div>
            <div><span>รายการอื่น ๆ</span><b>{fmt.money(otherSum, 2)}</b></div>
            {isRcv && <div><span>เงินรอจ่ายคืนที่เลือก</span><b>{fmt.money(rcvTotal, 2)}</b></div>}
          </div>
        </div>
      </div>

      {/* ── เงินรอจ่ายคืนที่ค้างจ่าย (เมื่อทำรายการโดย RCV) ── */}
      {isRcv && (
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>เงินรอจ่ายคืนที่ค้างจ่าย</h3>
            <span className="head-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>เลือกรายการเงินรอจ่ายคืนที่ค้างจ่ายไว้ มาใช้ชำระในใบสั่งชำระเงินนี้</span>
              <button className="btn primary sm" onClick={() => setRcvModal(true)} disabled={!editing}><Icon name="search" size={13} /> ค้นหารายการเงินรอจ่ายคืน</button>
            </span>
          </div>
          {rcvRefs.length === 0 ? (
            <div className="pvr-ref-empty muted">
              <Icon name="info" size={13} /> ยังไม่ได้เลือกรายการเงินรอจ่ายคืน — กด “ค้นหารายการเงินรอจ่ายคืน” เพื่อเลือกรายการที่ค้างจ่ายไว้
            </div>
          ) : (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl po-tbl">
                <thead>
                  <tr>
                    <th>รายการเงินรอจ่ายคืน</th>
                    <th style={{ width: 170 }}>สมาชิก</th>
                    <th style={{ width: 150 }}>อ้างอิงใบสำคัญรับ</th>
                    <th className="num" style={{ width: 140 }}>จำนวนเงิน</th>
                    <th className="center" style={{ width: 48 }} />
                  </tr>
                </thead>
                <tbody>
                  {rcvRefs.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="lt-row-name">{r.desc} <span className="muted mono" style={{ fontSize: 11, fontWeight: 400 }}>({r.id})</span></div>
                        <div className="lt-row-note muted mono" style={{ fontSize: 11 }}>{r.acct} · {window.pvrAcctName ? window.pvrAcctName(r.acct) : ''}</div>
                      </td>
                      <td><div className="mono" style={{ fontSize: 12 }}>{r.memberNo}</div><div className="muted" style={{ fontSize: 11 }}>{r.memberName}</div></td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.rvNo}<div className="muted">{fmt.date(r.rvDate)}</div></td>
                      <td className="num mono po-strong">{fmt.money(r.amount, 2)}</td>
                      <td className="center">
                        <button className="bud-act act-del" title="นำออก" disabled={!editing} onClick={() => setRcvRefs(rs => rs.filter(x => x.id !== r.id))}><Icon name="trash" size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="po-foot">
                    <td colSpan={3}>รวมเงินรอจ่ายคืนที่เลือก ({rcvRefs.length} รายการ)</td>
                    <td className="num mono po-strong">{fmt.money(rcvTotal, 2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div></div>
          )}
          <div className="po-note">
            <b>หมายเหตุ:</b> ยอดเงินรอจ่ายคืนที่เลือกต้องไม่น้อยกว่ายอดรับชำระรวมของใบสั่งชำระเงิน · ส่วนที่เหลือคงค้างอยู่ในบัญชีเงินรอจ่ายคืนของสมาชิก
          </div>
        </div>
      )}

      {/* ── รายการหนี้ ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายการหนี้</h3>
          <span className="head-actions muted" style={{ fontWeight: 400, fontSize: 12 }}>เลือกสัญญาที่ต้องการรับชำระ แล้วระบุยอดชำระต้นเงิน/ดอกเบี้ย</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl po-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }} rowSpan={2}>
                  <input type="checkbox" disabled={debtRows.length === 0 || !editing}
                    checked={debtRows.length > 0 && debtRows.every(r => r.checked)}
                    onChange={(e) => setDebtRows(rs => rs.map(r => e.target.checked
                      ? { ...r, checked: true, payPrincipal: r.principal, payInterest: r.intNew }
                      : { ...r, checked: false, payPrincipal: 0, payInterest: 0 }))} />
                </th>
                <th rowSpan={2}>เลขสัญญา</th>
                <th className="center" rowSpan={2}>ประเภท</th>
                <th className="num" rowSpan={2}>ต้นเงิน</th>
                <th className="center" colSpan={3}>ดอกเบี้ย</th>
                <th className="num" rowSpan={2}>ชำระต้นเงิน</th>
                <th className="num" rowSpan={2}>ชำระดอกเบี้ย</th>
                <th className="num" rowSpan={2}>รวมชำระ</th>
                <th className="num" rowSpan={2}>ต้นเงินคงเหลือ</th>
              </tr>
              <tr>
                <th className="center po-sub">ตั้งแต่</th>
                <th className="num po-sub">ค้าง</th>
                <th className="num po-sub">ใหม่</th>
              </tr>
            </thead>
            <tbody>
              {debtRows.length === 0 ? (
                <tr><td colSpan={11} className="empty-state">
                  {loaded ? 'สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง' : 'ค้นหาและเลือกสมาชิกเพื่อแสดงรายการหนี้'}
                </td></tr>
              ) : debtRows.map((r, i) => {
                const rowTotal = r.checked ? poNum(r.payPrincipal) + poNum(r.payInterest) : 0;
                const remain = poNum(r.principal) - (r.checked ? poNum(r.payPrincipal) : 0);
                return (
                  <tr key={r.contractNo} className={r.checked ? 'selected' : ''}>
                    <td className="center"><input type="checkbox" checked={r.checked} disabled={!editing} onChange={(e) => toggleDebt(i, e.target.checked)} /></td>
                    <td className="mono">{r.contractNo}</td>
                    <td className="center"><span className="chip">{r.code}</span></td>
                    <td className="num mono">{fmt.money(r.principal, 2)}</td>
                    <td className="center mono muted">{fmt.date(r.intFrom)}</td>
                    <td className={'num mono' + (r.intDue > 0 ? ' po-due' : ' muted')}>{fmt.money(r.intDue, 2)}</td>
                    <td className="num mono">{fmt.money(r.intNew, 2)}</td>
                    <td className="num"><PoAmt value={r.payPrincipal} disabled={!r.checked || !editing} max={r.principal} onChange={(v) => setDebt(i, { payPrincipal: v })} /></td>
                    <td className="num"><PoAmt value={r.payInterest} disabled={!r.checked || !editing} max={r.intNew + r.intDue} onChange={(v) => setDebt(i, { payInterest: v })} /></td>
                    <td className="num mono po-strong">{fmt.money(rowTotal, 2)}</td>
                    <td className="num mono">{fmt.money(remain, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
            {debtRows.length > 0 && (
              <tfoot>
                <tr className="po-foot">
                  <td /><td colSpan={2}>รวมรายการที่เลือก</td>
                  <td className="num mono">{fmt.money(principalTotal, 2)}</td>
                  <td /><td className="num mono">{fmt.money(intDueTotal, 2)}</td>
                  <td className="num mono">{fmt.money(intNewTotal, 2)}</td>
                  <td className="num mono">{fmt.money(payPrincipalTotal, 2)}</td>
                  <td className="num mono">{fmt.money(payInterestTotal, 2)}</td>
                  <td className="num mono po-strong">{fmt.money(payPrincipalTotal + payInterestTotal, 2)}</td>
                  <td className="num mono">{fmt.money(remainTotal, 2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        <div className="po-note">
          <b>หมายเหตุ:</b> ① การชำระพิเศษทำได้กับหนี้ทุกประเภท คิดดอกเบี้ยจากต้นเงินคงเหลือ · ② ชำระต้นเงินไม่เกินต้นเงินคงเหลือ · ③ ชำระดอกเบี้ยไม่เกินดอกเบี้ยที่คำนวณได้
        </div>
      </div>

      {/* ── รายการหุ้น ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายการหุ้น</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl po-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }}>
                  <input type="checkbox" disabled={shareRows.length === 0 || !editing}
                    checked={shareRows.length > 0 && shareRows.every(r => r.checked)}
                    onChange={(e) => setShareRows(rs => rs.map(r => ({ ...r, checked: e.target.checked, buyMore: e.target.checked ? r.buyMore : 0 })))} />
                </th>
                <th>รายละเอียด</th>
                <th className="num">งวด</th>
                <th className="num">ทุนเรือนหุ้น</th>
                <th className="num">ซื้อเพิ่ม</th>
                <th className="num">ทุนเรือนหุ้นสะสม</th>
              </tr>
            </thead>
            <tbody>
              {shareRows.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">
                  {loaded ? 'ไม่มีข้อมูลหุ้นของสมาชิก' : 'ค้นหาและเลือกสมาชิกเพื่อแสดงรายการหุ้น'}
                </td></tr>
              ) : shareRows.map((r, i) => {
                const accum = poNum(r.capital) + (r.checked ? poNum(r.buyMore) : 0);
                return (
                  <tr key={r.code} className={r.checked ? 'selected' : ''}>
                    <td className="center"><input type="checkbox" checked={r.checked} disabled={!editing} onChange={(e) => toggleShare(i, e.target.checked)} /></td>
                    <td>{r.detail}</td>
                    <td className="num mono">{r.term}</td>
                    <td className="num mono">{fmt.money(r.capital, 2)}</td>
                    <td className="num"><PoAmt value={r.buyMore} disabled={!r.checked || !editing} onChange={(v) => setShare(i, { buyMore: v })} /></td>
                    <td className="num mono po-strong">{fmt.money(accum, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
            {shareRows.length > 0 && (
              <tfoot>
                <tr className="po-foot">
                  <td /><td colSpan={2}>รวม</td>
                  <td className="num mono">{fmt.money(shareCapitalTotal, 2)}</td>
                  <td className="num mono">{fmt.money(shareSum, 2)}</td>
                  <td className="num mono po-strong">{fmt.money(shareAccumTotal, 2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ── รายการอื่น ๆ ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายการอื่น ๆ</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl po-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }}>
                  <input type="checkbox" disabled={otherRows.length === 0 || !editing}
                    checked={otherRows.length > 0 && otherRows.every(r => r.checked)}
                    onChange={(e) => setOtherRows(rs => rs.map(r => ({ ...r, checked: e.target.checked, amount: e.target.checked ? r.amount : 0 })))} />
                </th>
                <th style={{ width: 140 }}>รหัส</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 220 }}>ยอดเงินชำระ</th>
              </tr>
            </thead>
            <tbody>
              {otherRows.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">
                  {loaded ? 'ไม่มีรายการอื่น ๆ' : 'ค้นหาและเลือกสมาชิกเพื่อแสดงรายการอื่น ๆ'}
                </td></tr>
              ) : otherRows.map((r, i) => (
                <tr key={r.code} className={r.checked ? 'selected' : ''}>
                  <td className="center"><input type="checkbox" checked={r.checked} disabled={!editing} onChange={(e) => toggleOther(i, e.target.checked)} /></td>
                  <td className="mono">{r.code}</td>
                  <td>{r.detail}</td>
                  <td className="num"><PoAmt value={r.amount} disabled={!r.checked || !editing} onChange={(v) => setOther(i, { amount: v })} /></td>
                </tr>
              ))}
            </tbody>
            {otherRows.length > 0 && (
              <tfoot>
                <tr className="po-foot">
                  <td /><td colSpan={2}>รวม</td>
                  <td className="num mono po-strong">{fmt.money(otherSum, 2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => setOkMsg(null)} />
      )}

      {histOpen && (
        <PoHistoryModal title={member ? `${member.code} · ${member.name}` : 'ใบสั่งชำระเงิน'} onClose={() => setHistOpen(false)} />
      )}

      {rcvModal && window.PvrRecvSearchModal && (
        <window.PvrRecvSearchModal current={rcvRefs}
          onApply={(chosen) => {
            setRcvRefs(chosen); setRcvModal(false); setError('');
            onToast && onToast(`เลือกรายการเงินรอจ่ายคืน ${chosen.length} รายการ · รวม ${fmt.money(chosen.reduce((a, r) => a + poNum(r.amount), 0), 2)} บาท`);
          }}
          onClose={() => setRcvModal(false)} />
      )}
    </div>
  );
}

Object.assign(window, { PaymentOrderPage, PoHistoryModal });
