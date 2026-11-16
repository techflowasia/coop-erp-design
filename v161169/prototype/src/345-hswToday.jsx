// ════════════════════════════════════════════════════════════════════
//  ใบสั่งถอนหุ้นกึ่งหนึ่ง — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน › หุ้น
//  โครงสร้าง (อ้างอิงแบบฟอร์มใบสั่งถอนหุ้นกึ่งหนึ่ง):
//    ① ข้อมูลสมาชิก  ② รายละเอียดการจ่ายเงิน
//    ③ สรุปการถอนหุ้น (5 การ์ด)  ④ รายการสัญญาที่ต้องการโอนชำระ
//    ⑤ รายการหักเพิ่มเติม
//  ใช้ข้อมูลสาธิตร่วมกับประมาณการถอนหุ้น (window.SW_MEMBERS) + SwMemberSearchModal
// ════════════════════════════════════════════════════════════════════

const hswToday = () => new Date().toISOString().slice(0, 10);

// ─── ฟิลด์ในแถบ ─────────────────────────────────────────────────────
function HswFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว ──────────────────────────────────────────────
function HswRO({ value, mono, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── การ์ดสรุป (icon ซ้าย · label+value ชิดขวา) ─────────────────────
function HswStat({ icon, tone, label, value, unit, valueColor, input, onInput, disabled }) {
  return (
    <div className={'hsw-stat ' + (tone || '')}>
      <span className={'shc-stat-ico ' + (tone || 'a-blue')}><Icon name={icon} size={20} /></span>
      <div className="hsw-stat-body">
        <span className="hsw-stat-l">{label}</span>
        {input ? (
          <span className="hsw-stat-vwrap">
            <input className="hsw-stat-input mono" type="number" min="0" value={value}
                   onChange={(e) => onInput && onInput(e.target.value)} disabled={disabled} placeholder="0.00" />
            <span className="hsw-stat-u">{unit || 'บาท'}</span>
          </span>
        ) : (
          <span className="hsw-stat-v" style={valueColor ? { color: valueColor } : null}>
            {value}<span className="hsw-stat-u">{unit || 'บาท'}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function HswFormScreen({ onToast, audit }) {
  const today = hswToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [txnDate, setTxnDate] = useState(today);
  const [payDate, setPayDate] = useState(today);
  const [payType, setPayType] = useState('cash');
  const [bank, setBank] = useState('');
  const [branch, setBranch] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [payPeriod, setPayPeriod] = useState('1');
  const [counterAcct, setCounterAcct] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [debts, setDebts] = useState([]);
  const [deductions, setDeductions] = useState([]);

  const [error, setError] = useState('');
  const [approved, setApproved] = useState(false);

  const loaded = !!member;
  const ss = member ? window.swShareStatus(member.shareStatus) : null;
  const docNo = window.hswNextDocNo(beYear);
  const payDef = window.swPayType(payType);

  const loadMember = (m) => {
    setMember(m);
    setTxnDate(today); setPayDate(today);
    setPayType(m.accountNo ? 'transfer' : 'cash');
    setBank(m.bank || ''); setBranch(m.branch || ''); setAccountNo(m.accountNo || '');
    setPayPeriod('1'); setCounterAcct(m.counterAcct || window.SW_COUNTER_ACCTS[0]);
    setWithdrawAmount('');
    // เริ่มต้น: ยังไม่เลือกสัญญา/ยังไม่ระบุยอดชำระ (ตามแบบฟอร์มใบสั่ง)
    setDebts((m.debts || []).map(d => ({ ...d, selected: false, payPrincipal: 0, payInterest: 0 })));
    setDeductions((m.otherDeductions || []).map(d => ({ ...d, selected: false })));
    setApproved(false); setError('');
  };
  const pickMember = (m) => { setModal(false); loadMember(m); };

  const clearScreen = () => {
    setMember(null); setTxnDate(today); setPayDate(today); setPayType('cash');
    setBank(''); setBranch(''); setAccountNo(''); setPayPeriod('1'); setCounterAcct('');
    setWithdrawAmount(''); setDebts([]); setDeductions([]); setApproved(false); setError('');
  };

  // ── แก้ไขตาราง ──
  const toggleDebt = (no) => { setError(''); setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, selected: !d.selected } : d)); };
  const setDebtField = (no, k, v) => { setError(''); setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, [k]: v === '' ? '' : Number(v) } : d)); };
  const toggleDeduction = (i) => { setError(''); setDeductions(ds => ds.map((d, idx) => idx === i ? { ...d, selected: !d.selected } : d)); };
  const setDeductionAmt = (i, v) => { setError(''); setDeductions(ds => ds.map((d, idx) => idx === i ? { ...d, amount: v === '' ? '' : Number(v) } : d)); };

  // ── การคำนวณ ──
  const rowTotal = (d) => (Number(d.payPrincipal) || 0) + (Number(d.payInterest) || 0);
  const rowRemain = (d) => (Number(d.principal) || 0) - (Number(d.payPrincipal) || 0);
  const debtTotals = debts.reduce((a, d) => ({
    principal: a.principal + (Number(d.principal) || 0),
    interestArrears: a.interestArrears + (Number(d.interestArrears) || 0),
    interestCalc: a.interestCalc + (Number(d.interestCalc) || 0),
    payPrincipal: a.payPrincipal + (d.selected ? (Number(d.payPrincipal) || 0) : 0),
    payInterest: a.payInterest + (d.selected ? (Number(d.payInterest) || 0) : 0),
    rowTotal: a.rowTotal + (d.selected ? rowTotal(d) : 0),
    remain: a.remain + rowRemain(d),
  }), { principal: 0, interestArrears: 0, interestCalc: 0, payPrincipal: 0, payInterest: 0, rowTotal: 0, remain: 0 });

  const deductionTotal = deductions.filter(d => d.selected).reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const shareCapital = loaded ? member.shareBalance : 0;   // ทุนเรือนหุ้น
  const withdraw = Number(withdrawAmount) || 0;            // ยอดถอน
  const transferToDebt = debtTotals.rowTotal + deductionTotal; // ยอดโอนชำระหนี้
  const shareNet = shareCapital - withdraw;               // หุ้นคงเหลือสุทธิ
  const withdrawRemain = withdraw - transferToDebt;        // ยอดถอนคงเหลือ

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!ss.allow) return `หุ้นของสมาชิกอยู่ในสถานะ “${member.shareStatus}” — ไม่สามารถถอนหุ้นได้จนกว่าจะปลดเงื่อนไข`;
    if (!(withdraw > 0)) return 'กรุณาระบุยอดถอน (มากกว่า 0)';
    if (withdraw > shareCapital) return `ยอดถอนต้องไม่เกินทุนเรือนหุ้น ${fmt.money(shareCapital, 2)} บาท`;
    if (transferToDebt > withdraw) return 'ยอดโอนชำระหนี้รวมต้องไม่เกินยอดถอน';
    if (payDef.needBank && (!bank || !branch || !accountNo.trim()))
      return 'จ่ายแบบโอนบัญชี/เช็ค — กรุณาระบุธนาคาร สาขา และเลขที่บัญชีให้ครบถ้วน';
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); onToast && onToast(err); return; }
    setError('');
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ใบสั่งถอนหุ้นกึ่งหนึ่ง',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกใบสั่งถอนหุ้นกึ่งหนึ่ง ${docNo} · ยอดถอน ${fmt.money(withdraw, 2)} · โอนชำระหนี้ ${fmt.money(transferToDebt, 2)} · ถอนคงเหลือ ${fmt.money(withdrawRemain, 2)}`,
      changes: [
        { field: 'ยอดถอน', before: '—', after: fmt.money(withdraw, 2) },
        { field: 'ยอดโอนชำระหนี้', before: '—', after: fmt.money(transferToDebt, 2) },
        { field: 'ยอดถอนคงเหลือ', before: '—', after: fmt.money(withdrawRemain, 2) },
      ],
    });
    onToast && onToast(`บันทึกใบสั่งถอนหุ้นกึ่งหนึ่ง ${docNo} · ${member.name} เรียบร้อยแล้ว`);
  };

  const doApprove = () => {
    const err = validate();
    if (err) { setError(err); onToast && onToast(err); return; }
    if (approved) { const m = 'ใบสั่งนี้ได้รับการอนุมัติแล้ว'; setError(m); onToast && onToast(m); return; }
    setError(''); setApproved(true);
    onToast && onToast(`อนุมัติใบสั่งถอนหุ้นกึ่งหนึ่ง ${docNo} · ${member.name} เรียบร้อยแล้ว`);
  };

  const doPrint = (which) => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast(`กำลังเตรียมพิมพ์${which}…`);
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="ใบสั่งถอนหุ้นกึ่งหนึ่ง">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="shares" size={20} /></span>
          <div>
            <h1>ใบสั่งถอนหุ้นกึ่งหนึ่ง</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · สั่งถอนหุ้นกึ่งหนึ่ง โอนยอดถอนชำระหนี้ และจ่ายคืนส่วนที่เหลือให้สมาชิก</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn accent sm" onClick={doApprove}><Icon name="check" size={13} /> อนุมัติ</button>
          <button className="btn sm" onClick={() => doPrint('ใบสำคัญจ่าย')}><Icon name="print" size={13} /> พิมพ์ใบสำคัญจ่าย</button>
          <button className="btn sm" onClick={() => doPrint('ใบแจ้งการชำระหนี้-หุ้นพิเศษ')}><Icon name="print" size={13} /> พิมพ์ใบแจ้งการชำระหนี้-หุ้นพิเศษ</button>
          <button className="btn danger sm" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {loaded && !error && ss.warn && (
        <div className="dn-status-alert bad" style={{ marginBottom: 12 }}>
          <Icon name="info" size={15} />
          <span>หุ้นอยู่ในสถานะ <b>“{member.shareStatus}”</b> — ตรวจสอบและปลดเงื่อนไขก่อนทำรายการถอนหุ้น</span>
        </div>
      )}
      {approved && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} />
          <span>อนุมัติใบสั่งถอนหุ้นกึ่งหนึ่งเลขที่ <b>{docNo}</b> เรียบร้อยแล้ว — ส่งต่อให้ฝ่ายการเงินจ่ายเงิน</span>
        </div>
      )}

      {/* ── ① ข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="user" size={15} /></span>
          <h3>ข้อมูลสมาชิก</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>เลขที่เอกสาร · <b className="mono">{docNo}</b></span></div>
        </div>
        <div className="icr-strip">
          <HswFld label="ทะเบียน" w={200} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </HswFld>
          <HswFld label="ชื่อ-ชื่อสกุล" grow w={280}><HswRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></HswFld>
          <HswFld label="วันที่ทำรายการ" w={170} required>
            <ErpDate value={txnDate} onChange={(v) => ((e) => setTxnDate(e.target.value))({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </HswFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 14 }}>
          <HswFld label="สังกัด" grow w={360}><HswRO value={member ? window.affilMemberLabel(member) : ''} placeholder="(ดึงอัตโนมัติ)" /></HswFld>
          <HswFld label="ผู้ทำรายการ" grow w={240}><HswRO value={loaded ? window.SW_USER : ''} placeholder="(ผู้บันทึกปัจจุบัน)" /></HswFld>
        </div>
      </div>

      {/* ── ② รายละเอียดการจ่ายเงิน ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="receipt" size={15} /></span>
          <h3>รายละเอียดการจ่ายเงิน</h3>
        </div>
        <div className="icr-strip">
          <HswFld label="ประเภทเงิน" w={200} required>
            <select className="cfg-input" value={payType} onChange={(e) => { setPayType(e.target.value); setError(''); }} disabled={!loaded}>
              {window.SW_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.v.toUpperCase()} : {p.l}</option>)}
            </select>
          </HswFld>
          <HswFld label="ธนาคาร" grow w={220} required={payDef.needBank}>
            <select className="cfg-input" value={bank} onChange={(e) => { setBank(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
              <option value="">เลือกธนาคาร</option>
              {window.SW_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </HswFld>
          <HswFld label="สาขา" grow w={190} required={payDef.needBank}>
            <select className="cfg-input" value={branch} onChange={(e) => { setBranch(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
              <option value="">เลือกสาขา</option>
              {window.SW_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </HswFld>
          <HswFld label="วันที่จ่ายเงิน" w={170}>
            <ErpDate value={payDate} onChange={(v) => ((e) => setPayDate(e.target.value))({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </HswFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 14 }}>
          <HswFld label="เลขที่บัญชี" grow w={260} required={payDef.needBank}>
            <input className="cfg-input mono" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank} placeholder="ระบุเลขที่บัญชี" />
          </HswFld>
          <HswFld label="งวดจ่ายเงิน" w={200}>
            <select className="cfg-input" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} disabled={!loaded}>
              {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </HswFld>
          <HswFld label="คู่บัญชี" grow w={300}>
            <select className="cfg-input" value={counterAcct} onChange={(e) => setCounterAcct(e.target.value)} disabled={!loaded}>
              <option value="">เลือกคู่บัญชี</option>
              {window.SW_COUNTER_ACCTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </HswFld>
        </div>
      </div>

      {/* ── ③ สรุปการถอนหุ้น ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="shares" size={15} /></span>
          <h3>สรุปการถอนหุ้น</h3>
        </div>
        <div className="hsw-stats">
          <HswStat icon="shares" tone="a-blue"   label="ทุนเรือนหุ้น"  value={loaded ? fmt.money(shareCapital, 2) : '0.00'} />
          <HswStat icon="money"  tone="a-red"    label="ยอดถอน"       value={withdrawAmount} input onInput={(v) => { setWithdrawAmount(v); setError(''); }} disabled={!loaded} />
          <HswStat icon="swap"   tone="a-blue"   label="ยอดโอนชำระหนี้" value={fmt.money(transferToDebt, 2)} />
          <HswStat icon="shield" tone="a-green"  label="หุ้นคงเหลือสุทธิ" value={fmt.money(shareNet, 2)} valueColor="var(--success)" />
          <HswStat icon="wallet" tone="a-teal"   label="ยอดถอนคงเหลือ" value={fmt.money(withdrawRemain, 2)} valueColor={withdrawRemain < 0 ? 'var(--danger)' : 'var(--primary)'} />
        </div>
      </div>

      {/* ── ④ รายการสัญญาที่ต้องการโอนชำระ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="loans" size={15} /></span>
          <h3>รายการสัญญาที่ต้องการโอนชำระ</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}><Icon name="info" size={11} /> เลือกสัญญาและระบุยอดที่นำเงินถอนหุ้นไปชำระ</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th>เลขสัญญา</th>
                <th className="num">ต้นเงิน</th>
                <th className="center">ดอกเบี้ยตั้งแต่</th>
                <th className="num">ด/บ ค้าง</th>
                <th className="num">ด/บ ใหม่</th>
                <th className="num">ชำระต้นเงิน</th>
                <th className="num">ชำระด/บ</th>
                <th className="num">รวมชำระ</th>
                <th className="num">ต้นเงินคงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="10" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  {loaded ? 'สมาชิกรายนี้ไม่มีสัญญาหนี้คงค้าง — ถอนหุ้นได้เต็มจำนวน' : 'เลือกสมาชิกเพื่อแสดงรายการสัญญา'}
                </td></tr>
              ) : debts.map(d => (
                <tr key={d.contractNo} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDebt(d.contractNo)} /></td>
                  <td className="mono">{d.contractNo}<div className="muted" style={{ fontSize: 10 }}>{d.loanType}</div></td>
                  <td className="num mono">{fmt.money(d.principal, 2)}</td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{fmt.date(d.interestFrom)}</td>
                  <td className="num mono" style={{ color: d.interestArrears > 0 ? 'var(--danger)' : undefined }}>{fmt.money(d.interestArrears, 2)}</td>
                  <td className="num mono">{fmt.money(d.interestCalc, 2)}</td>
                  <td className="num">
                    <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.payPrincipal}
                           onChange={(e) => setDebtField(d.contractNo, 'payPrincipal', e.target.value)} disabled={!d.selected} />
                  </td>
                  <td className="num">
                    <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.payInterest}
                           onChange={(e) => setDebtField(d.contractNo, 'payInterest', e.target.value)} disabled={!d.selected} />
                  </td>
                  <td className="num mono"><b>{fmt.money(rowTotal(d), 2)}</b></td>
                  <td className="num mono">{fmt.money(rowRemain(d), 2)}</td>
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
                  <td className="num mono"><b>{fmt.money(debtTotals.interestCalc, 2)}</b></td>
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

      {/* ── ⑤ รายการหักเพิ่มเติม ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="receipt" size={15} /></span>
          <h3>รายการหักเพิ่มเติม</h3>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th style={{ width: 140 }}>รหัส</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 220 }}>ยอดเงินชำระ</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">{loaded ? 'ไม่มีรายการหักเพิ่มเติม' : 'เลือกสมาชิกเพื่อแสดงรายการหัก'}</td></tr>
              ) : deductions.map((d, i) => (
                <tr key={i} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDeduction(i)} /></td>
                  <td className="mono">{d.code}</td>
                  <td>{d.detail}</td>
                  <td className="num">
                    <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.amount}
                           onChange={(e) => setDeductionAmt(i, e.target.value)} disabled={!d.selected} />
                  </td>
                </tr>
              ))}
            </tbody>
            {deductions.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="3" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(deductionTotal, 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {modal && <SwMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ShareHalfWithdrawPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <HswFormScreen onToast={onToast} audit={audit} />;
}

// เลขที่ใบสั่งถอนหุ้นกึ่งหนึ่ง (auto) — HSW-{พ.ศ.}-{running 6 หลัก}
window.hswNextDocNo = (beYear) => `HSW-${beYear || (new Date().getFullYear() + 543)}-${String(512).padStart(6, '0')}`;

Object.assign(window, { ShareHalfWithdrawPage, HswFormScreen });
