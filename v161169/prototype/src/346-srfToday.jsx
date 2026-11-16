// ════════════════════════════════════════════════════════════════════
//  ใบสั่งคืนค่าหุ้น — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง: ① ข้อมูลสมาชิก ② รายละเอียดทุนเรือนหุ้น ③ รูปแบบการจ่ายคืน
//             ④ รายละเอียดการจ่ายคืน (การ์ดสรุป + คงเหลือสุทธิ)
//             ⑤ หักชำระหนี้ ⑥ หักชำระอื่น ๆ ⑦ โอนหนี้ผู้ค้ำ ⑧ โอนหนี้ผู้กู้ร่วม
//  ใช้ icr-* / sr-* / sw-* จาก styles.css · fmt จาก data.js
// ════════════════════════════════════════════════════════════════════

const srfToday = () => new Date().toISOString().slice(0, 10);

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function SrfFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function SrfRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── แถวสรุป (label ซ้าย + ช่องค่าด้านขวา พร้อมหน่วย) ────────────────
function SrfPayRow({ label, children, unit = 'บาท' }) {
  return (
    <div className="sr-pay-row">
      <span className="sr-pay-l">{label}</span>
      <div className="sr-pay-c">
        {children}
        {unit && <span className="sr-pay-u">{unit}</span>}
      </div>
    </div>
  );
}

// ─── Popup ค้นหาสมาชิก ───────────────────────────────────────────────
function SrfMemberSearchModal({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const results = window.srfSearchMembers(q);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสมาชิก</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)}
                   placeholder="ค้นหาเลขทะเบียน, ชื่อ-สกุล, เลขบัตรประชาชน, สังกัด…" />
          </div>
          <div className="gc-sub-title" style={{ marginTop: 0 }}>
            รายชื่อสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ทะเบียน</th><th>ชื่อ-ชื่อสกุล</th><th>สังกัด</th>
                  <th className="center">สถานะหุ้น</th><th className="num">หุ้นคงเหลือ</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map(m => {
                  const ss = window.srfShareStatus(m.shareStatus);
                  return (
                    <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                      <td className="mono">{m.code}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{m.dept}</td>
                      <td className="center"><span className={'pill ' + ss.pill}>{m.shareStatus}</span></td>
                      <td className="num mono">{fmt.money(m.shareBalance, 0)}</td>
                      <td className="center">
                        <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือกสมาชิก">
                          <Icon name="chevRight" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function SrfFormScreen({ onToast, audit }) {
  const today = srfToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [voucherDate, setVoucherDate] = useState(today);
  const [withdrawDate, setWithdrawDate] = useState(today);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // การจ่ายเงิน
  const [payType, setPayType] = useState('transfer');
  const [bank, setBank] = useState('');
  const [branch, setBranch] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [counterAcct, setCounterAcct] = useState(window.SRF_COUNTER_ACCTS[0]);

  // ตาราง
  const [debts, setDebts] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [coBorrowers, setCoBorrowers] = useState([]);

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loaded = !!member;
  const ss = member ? window.srfShareStatus(member.shareStatus) : null;
  const docNo = window.srfNextDocNo(beYear);
  const payDef = window.srfPayType(payType);

  const loadMember = (m) => {
    setMember(m);
    setVoucherDate(m.voucherDate || today);
    setWithdrawDate(m.withdrawDate || today);
    setWithdrawAmount(String(m.withdrawable));
    setPayType(m.accountNo ? 'transfer' : 'cash');
    setBank(m.bank || ''); setBranch(m.branch || ''); setAccountNo(m.accountNo || '');
    setCounterAcct(m.counterAcct || window.SRF_COUNTER_ACCTS[0]);
    setDebts((m.debts || []).map(d => ({ ...d, selected: true })));
    setDeductions((m.otherDeductions || []).map(d => ({ ...d, selected: d.selected !== false && (Number(d.amount) || 0) > 0 })));
    setGuarantors((m.guarantors || []).map(g => ({ ...g })));
    setCoBorrowers((m.coBorrowers || []).map(g => ({ ...g })));
    setError(''); setSaved(false);
  };
  const pickMember = (m) => { setModal(false); loadMember(m); };

  const clearScreen = () => {
    setMember(null); setVoucherDate(today); setWithdrawDate(today); setWithdrawAmount('');
    setPayType('transfer'); setBank(''); setBranch(''); setAccountNo('');
    setCounterAcct(window.SRF_COUNTER_ACCTS[0]);
    setDebts([]); setDeductions([]); setGuarantors([]); setCoBorrowers([]);
    setError(''); setSaved(false);
  };

  // ── ตัวช่วยแก้ไขตารางหนี้ ──
  const toggleDebt = (no) => { setError(''); setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, selected: !d.selected } : d)); };
  const setDebtField = (no, k, v) => {
    setError('');
    setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, [k]: v === '' ? '' : Number(v) } : d));
  };
  const toggleDeduction = (i) => { setError(''); setDeductions(ds => ds.map((d, idx) => idx === i ? { ...d, selected: !d.selected } : d)); };
  const setDeductionField = (i, k, v) => {
    setError('');
    setDeductions(ds => ds.map((d, idx) => {
      if (idx !== i) return d;
      if (k === 'code') {
        const def = window.SRF_DEDUCT_CODES.find(c => c.code === v);
        return { ...d, code: v, detail: def ? def.detail : d.detail };
      }
      return { ...d, [k]: k === 'amount' ? (v === '' ? '' : Number(v)) : v };
    }));
  };
  const addDeductionRow = () => {
    const def = window.SRF_DEDUCT_CODES[0];
    setDeductions(ds => [...ds, { code: def.code, detail: def.detail, amount: '', selected: true }]);
  };
  const removeDeductionRow = (i) => setDeductions(ds => ds.filter((_, idx) => idx !== i));

  // ── การคำนวณ ──
  const debtRowTotal = (d) => (Number(d.payPrincipal) || 0) + (Number(d.payInterest) || 0);
  const debtRowRemain = (d) => (Number(d.principal) || 0) - (Number(d.payPrincipal) || 0);
  const selDeductions = deductions.filter(d => d.selected);

  const debtTotals = debts.reduce((a, d) => ({
    principal: a.principal + (Number(d.principal) || 0),
    interestArrears: a.interestArrears + (Number(d.interestArrears) || 0),
    interestNew: a.interestNew + (Number(d.interestNew) || 0),
    payPrincipal: a.payPrincipal + (d.selected ? (Number(d.payPrincipal) || 0) : 0),
    payInterest: a.payInterest + (d.selected ? (Number(d.payInterest) || 0) : 0),
    rowTotal: a.rowTotal + (d.selected ? debtRowTotal(d) : 0),
    remain: a.remain + debtRowRemain(d),
  }), { principal: 0, interestArrears: 0, interestNew: 0, payPrincipal: 0, payInterest: 0, rowTotal: 0, remain: 0 });

  const deductionTotal = selDeductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const transferToDebt = debtTotals.rowTotal + deductionTotal;   // ยอดโอนชำระหนี้
  const withdraw = Number(withdrawAmount) || 0;                  // ยอดถอน
  const netRemain = withdraw - transferToDebt;                   // คงเหลือสุทธิ

  // ผู้ค้ำ / ผู้กู้ร่วม
  const sumTransfer = (rows) => rows.reduce((a, g) => ({
    tp: a.tp + (Number(g.transferPrincipal) || 0), ti: a.ti + (Number(g.transferInterestArrears) || 0),
    pp: a.pp + (Number(g.payPrincipal) || 0), pi: a.pi + (Number(g.payInterestArrears) || 0),
  }), { tp: 0, ti: 0, pp: 0, pi: 0 });
  const guarTotals = sumTransfer(guarantors);
  const coTotals = sumTransfer(coBorrowers);

  // แก้ไขค่าตัวเลขในตารางโอนหนี้ (ผู้ค้ำ / ผู้กู้ร่วม)
  const makeTransferSetter = (setRows) => (i, k, v) => {
    setError('');
    setRows(rows => rows.map((r, idx) => idx === i ? { ...r, [k]: v === '' ? '' : Number(v) } : r));
  };

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!ss.allow) return `หุ้นของสมาชิกอยู่ในสถานะ “${member.shareStatus}” — ไม่สามารถคืนค่าหุ้นได้จนกว่าจะปลดเงื่อนไข`;
    if (!voucherDate) return 'กรุณาระบุวันที่ใบจ่าย';
    if (!withdrawDate) return 'กรุณาระบุวันที่ถอนหุ้น';
    if (!(withdraw > 0)) return 'กรุณาระบุยอดถอน (มากกว่า 0)';
    if (withdraw > member.withdrawable) return `ยอดถอนต้องไม่เกินยอดถอนได้ ${fmt.money(member.withdrawable, 2)} บาท`;
    if (transferToDebt > withdraw && guarantors.length === 0 && coBorrowers.length === 0)
      return 'ยอดหักชำระรวมเกินยอดถอน — ต้องโอนหนี้ส่วนเกินให้ผู้ค้ำหรือผู้กู้ร่วม';
    if (payDef.needBank && (!bank || !branch || !accountNo.trim()))
      return 'เลือกจ่ายแบบโอนบัญชี/เช็ค — กรุณาระบุธนาคาร สาขา และเลขที่บัญชีให้ครบถ้วน';
    return '';
  };

  const doCalc = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนคำนวณ'); return; }
    setError('');
    onToast && onToast(`คำนวณแล้ว · ยอดโอนชำระหนี้ ${fmt.money(transferToDebt, 2)} บาท · คงเหลือสุทธิ ${fmt.money(netRemain, 2)} บาท`);
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setSaved(true);
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ใบสั่งคืนค่าหุ้น',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกใบสั่งคืนค่าหุ้น ${docNo} · ยอดถอน ${fmt.money(withdraw, 2)} · โอนชำระหนี้ ${fmt.money(transferToDebt, 2)} · คงเหลือสุทธิ ${fmt.money(netRemain, 2)}`,
      changes: [
        { field: 'ยอดถอน', before: '—', after: fmt.money(withdraw, 2) },
        { field: 'ยอดโอนชำระหนี้', before: '—', after: fmt.money(transferToDebt, 2) },
        { field: 'คงเหลือสุทธิ', before: '—', after: fmt.money(netRemain, 2) },
      ],
    });
    onToast && onToast(`บันทึกใบสั่งคืนค่าหุ้น ${docNo} · ${member.name} เรียบร้อยแล้ว`);
  };

  const doPrint = (label) => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast(`กำลังเตรียมพิมพ์${label}…`);
    setTimeout(() => window.print(), 80);
  };

  // ── ตารางโอนหนี้ (ผู้ค้ำ / ผู้กู้ร่วม) ──
  const TransferTable = ({ rows, totals, emptyText, onEdit }) => (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl sw-debt-tbl">
        <thead>
          <tr>
            <th rowSpan="2">เลขที่สัญญา</th>
            <th rowSpan="2">ผู้รับโอน</th>
            <th rowSpan="2" className="center">เริ่มชำระ</th>
            <th colSpan="2" className="center sw-grp">ยอดรับโอน</th>
            <th colSpan="2" className="center sw-grp">ผ่อนชำระ</th>
          </tr>
          <tr>
            <th className="num sw-sub">ต้นเงิน</th>
            <th className="num sw-sub">ด/บ ค้างชำระ</th>
            <th className="num sw-sub">เงินต้น</th>
            <th className="num sw-sub">ด/บ ค้าง</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="7" className="empty-state">{loaded ? emptyText : 'เลือกสมาชิกเพื่อแสดงรายการโอนหนี้'}</td></tr>
          ) : rows.map((g, i) => (
            <tr key={i}>
              <td className="mono">{g.contractNo}</td>
              <td>{g.transferee}</td>
              <td className="center mono" style={{ fontSize: 11.5 }}>{fmt.date(g.startDate)}</td>
              <td className="num">
                <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.transferPrincipal}
                       onChange={(e) => onEdit(i, 'transferPrincipal', e.target.value)} disabled={!loaded} placeholder="0.00" />
              </td>
              <td className="num">
                <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.transferInterestArrears}
                       onChange={(e) => onEdit(i, 'transferInterestArrears', e.target.value)} disabled={!loaded} placeholder="0.00" />
              </td>
              <td className="num">
                <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.payPrincipal}
                       onChange={(e) => onEdit(i, 'payPrincipal', e.target.value)} disabled={!loaded} placeholder="0.00" />
              </td>
              <td className="num">
                <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.payInterestArrears}
                       onChange={(e) => onEdit(i, 'payInterestArrears', e.target.value)} disabled={!loaded} placeholder="0.00" />
              </td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="sw-foot">
              <td colSpan="3" className="center"><b>รวมทั้งสิ้น</b></td>
              <td className="num mono"><b>{fmt.money(totals.tp, 2)}</b></td>
              <td className="num mono"><b>{fmt.money(totals.ti, 2)}</b></td>
              <td className="num mono"><b>{fmt.money(totals.pp, 2)}</b></td>
              <td className="num mono"><b>{fmt.money(totals.pi, 2)}</b></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div></div>
  );

  return (
    <div data-screen-label="ใบสั่งคืนค่าหุ้น">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="shares" size={20} /></span>
          <div>
            <h1>ใบสั่งคืนค่าหุ้น</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · จัดทำรายการคืนค่าหุ้น หักภาระหนี้ และโอนหนี้คงเหลือให้ผู้ค้ำ / ผู้กู้ร่วม</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn primary sm" onClick={() => doPrint('แบบการคืนค่าหุ้น')}><Icon name="print" size={13} /> พิมพ์แบบการคืนค่าหุ้น</button>
          <button className="btn sm" onClick={() => doPrint('ใบแจ้งการชำระหนี้–หุ้นพิเศษ')}><Icon name="receipt" size={13} /> พิมพ์ใบแจ้งการชำระหนี้–หุ้นพิเศษ</button>
        </div>
      </div>

      <div className="sr-toolbar">
        <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหาสมาชิก</button>
        <button className="btn sm" onClick={doCalc}><Icon name="refresh" size={13} /> คำนวณยอด</button>
        <span style={{ flex: 1 }} />
        <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
        <button className="btn sm danger" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {loaded && !error && ss.warn && (
        <div className="dn-status-alert bad" style={{ marginBottom: 12 }}>
          <Icon name="info" size={15} />
          <span>หุ้นอยู่ในสถานะ <b>“{member.shareStatus}”</b> — ตรวจสอบและปลดเงื่อนไขก่อนทำรายการคืนค่าหุ้น</span>
        </div>
      )}
      {saved && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} />
          <span>บันทึกใบสั่งคืนค่าหุ้นเลขที่ <b>{docNo}</b> เรียบร้อยแล้ว — ส่งต่อให้ฝ่ายการเงินจ่ายเงินคืนหุ้น</span>
        </div>
      )}

      {/* ── ส่วนบน: ซ้าย (ข้อมูล) + ขวา (สรุปการจ่ายคืน) ── */}
      <div className="sr-top-grid">
        <div className="sr-top-left">
          {/* ① ข้อมูลสมาชิก */}
          <div className="search-card icr-sec">
            <div className="icr-sec-head">
              <span className="sw-sec-ico"><Icon name="user" size={15} /></span>
              <h3>ข้อมูลสมาชิก</h3>
              <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>เลขที่เอกสาร · <b className="mono">{docNo}</b></span></div>
            </div>
            <div className="icr-strip">
              <SrfFld label="ทะเบียน" w={180} required>
                <div className="icr-search-box" onClick={() => setModal(true)}>
                  <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
                  <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
                </div>
              </SrfFld>
              <SrfFld label="ชื่อ-ชื่อสกุล" grow w={240} required><SrfRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></SrfFld>
              <SrfFld label="สังกัด" grow w={260}><SrfRO value={member ? window.affilMemberLabel(member) : ''} placeholder="(ดึงอัตโนมัติ)" /></SrfFld>
            </div>
          </div>

          {/* ② รายละเอียดทุนเรือนหุ้น */}
          <div className="search-card icr-sec">
            <div className="icr-sec-head">
              <span className="sw-sec-ico"><Icon name="shares" size={15} /></span>
              <h3>รายละเอียดทุนเรือนหุ้น</h3>
              <div className="icr-sec-actions">
                {loaded && <span className="icr-statusbox"><span className="icr-dot" style={{ background: `var(--${ss.pill === 'ok' ? 'success' : ss.pill === 'bad' ? 'danger' : ss.pill === 'info' ? 'info' : 'text-faint'}, #999)` }} /><span>หุ้น{member.shareStatus}</span></span>}
              </div>
            </div>
            <div className="icr-strip">
              <SrfFld label="หุ้นคงเหลือ" grow w={220}>
                <div className="icr-suffix">
                  <div className="icr-ro num mono sr-locked" style={{ paddingRight: 46 }}>{loaded ? fmt.money(member.shareBalance, 2) : '—'}</div>
                  <span className="icr-suffix-u">บาท</span>
                </div>
              </SrfFld>
              <SrfFld label="ยอดถอนได้" grow w={220}>
                <div className="icr-suffix">
                  <div className="icr-ro num mono sr-locked" style={{ paddingRight: 46 }}>{loaded ? fmt.money(member.withdrawable, 2) : '—'}</div>
                  <span className="icr-suffix-u">บาท</span>
                </div>
              </SrfFld>
            </div>
            <div className="sr-hint"><Icon name="lock" size={12} /> ข้อมูลทุนเรือนหุ้นดึงจากฐานข้อมูลหุ้นของสมาชิก — แก้ไขได้เฉพาะผู้มีสิทธิ์</div>
          </div>

          {/* ③ รูปแบบการจ่ายคืนค่าหุ้นคงเหลือ */}
          <div className="search-card icr-sec">
            <div className="icr-sec-head">
              <span className="sw-sec-ico"><Icon name="bank" size={15} /></span>
              <h3>รูปแบบการจ่ายคืนค่าหุ้นคงเหลือ</h3>
            </div>
            <div className="icr-strip">
              <SrfFld label="ประเภทเงิน" grow w={200} required>
                <select className="cfg-input" value={payType} onChange={(e) => { setPayType(e.target.value); setError(''); }} disabled={!loaded}>
                  {window.SRF_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </SrfFld>
              <SrfFld label="ธนาคาร" grow w={240} required={payDef.needBank}>
                <select className="cfg-input" value={bank} onChange={(e) => { setBank(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
                  <option value="">— เลือกธนาคาร —</option>
                  {window.SRF_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </SrfFld>
              <SrfFld label="สาขา" grow w={200} required={payDef.needBank}>
                <select className="cfg-input" value={branch} onChange={(e) => { setBranch(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
                  <option value="">— เลือกสาขา —</option>
                  {window.SRF_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </SrfFld>
              <SrfFld label="เลขที่บัญชี" grow w={170} required={payDef.needBank}>
                <input className="cfg-input mono" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank} placeholder="000-0-00000-0" />
              </SrfFld>
              <SrfFld label="คู่บัญชี" grow w={240}>
                <select className="cfg-input" value={counterAcct} onChange={(e) => setCounterAcct(e.target.value)} disabled={!loaded}>
                  {window.SRF_COUNTER_ACCTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </SrfFld>
            </div>
          </div>
        </div>

        {/* ④ รายละเอียดการจ่ายคืนค่าหุ้น (การ์ดสรุป) */}
        <div className="search-card icr-sec sr-paycard">
          <div className="icr-sec-head">
            <span className="sw-sec-ico"><Icon name="calendar" size={15} /></span>
            <h3>รายละเอียดการจ่ายคืนค่าหุ้น</h3>
          </div>
          <SrfPayRow label="วันที่ใบจ่าย" unit="">
            <ErpDate value={voucherDate} onChange={(v) => ((e) => { setVoucherDate(e.target.value); setError(''); })({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </SrfPayRow>
          <SrfPayRow label="วันที่ถอนหุ้น" unit="">
            <ErpDate value={withdrawDate} onChange={(v) => ((e) => { setWithdrawDate(e.target.value); setError(''); })({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </SrfPayRow>
          <SrfPayRow label="ยอดถอน">
            <input className="cfg-input mono num" type="number" min="0" value={withdrawAmount}
                   onChange={(e) => { setWithdrawAmount(e.target.value); setError(''); }} disabled={!loaded} placeholder="0.00" />
          </SrfPayRow>
          <SrfPayRow label="ยอดโอนชำระหนี้">
            <div className="icr-ro num mono sr-locked" style={{ flex: 1 }}>{loaded ? fmt.money(transferToDebt, 2) : '—'}</div>
          </SrfPayRow>
          <div className={'sr-net' + (netRemain < 0 ? ' neg' : '')}>
            <span className="sr-net-l">คงเหลือสุทธิ</span>
            <span className="sr-net-v">{loaded ? fmt.money(netRemain, 2) : '—'}<span className="sr-net-u">บาท</span></span>
          </div>
        </div>
      </div>

      {/* ── ⑤ หักชำระหนี้ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="loans" size={15} /></span>
          <h3>หักชำระหนี้</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}><Icon name="info" size={11} /> เลือกสัญญาที่นำเงินค่าหุ้นไปหักชำระ</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th rowSpan="2" style={{ width: 38 }} className="center">เลือก</th>
                <th rowSpan="2">เลขสัญญา</th>
                <th rowSpan="2" className="num">ต้นเงิน</th>
                <th colSpan="3" className="center sw-grp">ดอกเบี้ย</th>
                <th colSpan="2" className="center sw-grp">การชำระ</th>
                <th rowSpan="2" className="num">รวมชำระ</th>
                <th rowSpan="2" className="num">ต้นเงินคงเหลือ</th>
              </tr>
              <tr>
                <th className="center sw-sub">ตั้งแต่</th>
                <th className="num sw-sub">ด/บ ค้าง</th>
                <th className="num sw-sub">ด/บ ใหม่</th>
                <th className="num sw-sub">ต้นเงิน</th>
                <th className="num sw-sub">ด/บ</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="10" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  {loaded ? 'สมาชิกรายนี้ไม่มีสัญญาหนี้คงค้าง — คืนค่าหุ้นได้เต็มจำนวน' : 'เลือกสมาชิกเพื่อแสดงรายการสัญญาหนี้'}
                </td></tr>
              ) : debts.map(d => (
                <tr key={d.contractNo} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDebt(d.contractNo)} /></td>
                  <td className="mono">{d.contractNo}<div className="muted" style={{ fontSize: 10 }}>{d.loanType}</div></td>
                  <td className="num mono">{fmt.money(d.principal, 2)}</td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{fmt.date(d.interestFrom)}</td>
                  <td className="num mono" style={{ color: d.interestArrears > 0 ? 'var(--danger)' : undefined }}>{fmt.money(d.interestArrears, 2)}</td>
                  <td className="num mono">{fmt.money(d.interestNew, 2)}</td>
                  <td className="num">
                    <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.payPrincipal}
                           onChange={(e) => setDebtField(d.contractNo, 'payPrincipal', e.target.value)} disabled={!d.selected} />
                  </td>
                  <td className="num">
                    <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.payInterest}
                           onChange={(e) => setDebtField(d.contractNo, 'payInterest', e.target.value)} disabled={!d.selected} />
                  </td>
                  <td className="num mono"><b>{fmt.money(debtRowTotal(d), 2)}</b></td>
                  <td className="num mono">{fmt.money(debtRowRemain(d), 2)}</td>
                </tr>
              ))}
            </tbody>
            {debts.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="2" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.principal, 2)}</b></td>
                  <td />
                  <td className="num mono" style={{ color: 'var(--danger)' }}><b>{fmt.money(debtTotals.interestArrears, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.interestNew, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.payPrincipal, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.payInterest, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.rowTotal, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.remain, 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ── ⑥ หักชำระอื่น ๆ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="receipt" size={15} /></span>
          <h3>หักชำระอื่น ๆ</h3>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th style={{ width: 140 }}>รหัส</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 200 }}>ยอดเงินชำระ</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">{loaded ? 'ยังไม่มีรายการหักชำระอื่น — กด “เพิ่มแถว” เพื่อเพิ่มรายการ' : 'เลือกสมาชิกเพื่อแสดงรายการหัก'}</td></tr>
              ) : deductions.map((d, i) => (
                <tr key={i} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDeduction(i)} /></td>
                  <td>
                    <select className="cfg-input sm mono" value={d.code} onChange={(e) => setDeductionField(i, 'code', e.target.value)} disabled={!loaded}>
                      {window.SRF_DEDUCT_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="cfg-input sm" value={d.detail} onChange={(e) => setDeductionField(i, 'detail', e.target.value)} disabled={!loaded} />
                  </td>
                  <td className="num">
                    <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.amount}
                           onChange={(e) => setDeductionField(i, 'amount', e.target.value)} disabled={!loaded} placeholder="0.00" />
                  </td>
                  <td className="center">
                    <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => removeDeductionRow(i)} title="ลบแถว"><Icon name="close" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            {deductions.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="3" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(deductionTotal, 2)}</b></td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        <button className="btn dashed block sm sr-addrow" onClick={addDeductionRow} disabled={!loaded}><Icon name="plus" size={13} /> เพิ่มแถว</button>
      </div>

      {/* ── ⑦ โอนหนี้ให้ผู้ค้ำ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="guarantee" size={15} /></span>
          <h3>โอนหนี้ให้ผู้ค้ำ</h3>
          <div className="icr-sec-actions">
            <button className="btn sm" onClick={doCalc} disabled={!loaded}><Icon name="refresh" size={13} /> คำนวณยอดโอนใหม่</button>
          </div>
        </div>
        <TransferTable rows={guarantors} totals={guarTotals} onEdit={makeTransferSetter(setGuarantors)} emptyText="ไม่มีสัญญาที่ต้องโอนหนี้ให้ผู้ค้ำประกัน" />
      </div>

      {/* ── ⑧ โอนหนี้ให้ผู้กู้ร่วม ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="members" size={15} /></span>
          <h3>โอนหนี้ให้ผู้กู้ร่วม</h3>
        </div>
        <TransferTable rows={coBorrowers} totals={coTotals} onEdit={makeTransferSetter(setCoBorrowers)} emptyText="ไม่มีสัญญาที่ต้องโอนหนี้ให้ผู้กู้ร่วม" />
      </div>

      {modal && <SrfMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ShareRefundPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <SrfFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { ShareRefundPage, SrfFormScreen, SrfMemberSearchModal });
