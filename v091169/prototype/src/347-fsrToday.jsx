// ════════════════════════════════════════════════════════════════════
//  คืนค่าหุ้น — ระบบการเงิน (เคาน์เตอร์รับ–จ่ายเงิน)
//  จ่ายคืนค่าหุ้นให้สมาชิก · หักโอนชำระหนี้ · ออกใบเสร็จ
//  โครงสร้างตามแบบฟอร์มเดิม:
//    ① ออกใบเสร็จ ② ข้อมูลสมาชิก ③ รายละเอียดหุ้น
//    ④ รายละเอียดการจ่ายเงิน (+ ตั้งหุ้นค้างจ่าย) ⑤ ยอดถอน/โอนชำระหนี้/คงเหลือสุทธิ
//    ⑥ หักชำระหนี้ (ตามสัญญา) ⑦ หักชำระอื่น ๆ
//  ใช้ข้อมูลสาธิตร่วมกับ data-share-refund.js (SRF_*) + SrfMemberSearchModal
//  ใช้ icr-* / sr-* / sw-* จาก styles.css · fmt จาก data.js
// ════════════════════════════════════════════════════════════════════

const fsrToday = () => new Date().toISOString().slice(0, 10);

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function FsrFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function FsrRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
const FSR_VARIANTS = {
  refund: {
    screenLabel: 'คืนค่าหุ้น', title: 'คืนค่าหุ้น', icon: 'shares',
    sub: 'ระบบการเงิน · เคาน์เตอร์รับ–จ่ายเงิน — จ่ายคืนค่าหุ้นให้สมาชิก หักโอนชำระหนี้ และออกใบเสร็จ',
    voucherLabel: 'ใบสำคัญจ่ายคืนค่าหุ้น', module: 'การเงิน — คืนค่าหุ้น', verb: 'คืนค่าหุ้น',
    withdrawLabel: 'ยอดถอน', netLabel: 'คงเหลือสุทธิ (จ่ายจริง)',
  },
  halfwithdraw: {
    screenLabel: 'ถอนหุ้นกึ่งหนึ่ง', title: 'ถอนหุ้นกึ่งหนึ่ง', icon: 'shares',
    sub: 'ระบบการเงิน · เคาน์เตอร์รับ–จ่ายเงิน — จ่ายถอนหุ้นกึ่งหนึ่งให้สมาชิก หักโอนชำระหนี้ และออกใบเสร็จ',
    voucherLabel: 'ใบสำคัญจ่ายถอนหุ้นกึ่งหนึ่ง', module: 'การเงิน — ถอนหุ้นกึ่งหนึ่ง', verb: 'ถอนหุ้นกึ่งหนึ่ง',
    withdrawLabel: 'ยอดถอน', netLabel: 'ยอดถอนคงเหลือ (จ่ายจริง)',
  },
};

function FsrFormScreen({ onToast, audit, variant = 'refund' }) {
  const V = FSR_VARIANTS[variant] || FSR_VARIANTS.refund;
  const today = fsrToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [issueReceipt, setIssueReceipt] = useState(true);   // ออกใบเสร็จ
  const [asPending, setAsPending] = useState(false);        // หุ้นคงเหลือตั้งเป็นหุ้นค้างจ่าย

  const [voucherDate, setVoucherDate] = useState('');       // วันที่ใบสำคัญจ่าย (อ่านอย่างเดียว)
  const [withdrawDate, setWithdrawDate] = useState(today);  // วันที่ถอนหุ้น
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
    setAsPending(false);
    setDebts((m.debts || []).map(d => ({ ...d, selected: true })));
    setDeductions((m.otherDeductions || []).map(d => ({ ...d, selected: d.selected !== false && (Number(d.amount) || 0) > 0 })));
    setError(''); setSaved(false);
  };
  const pickMember = (m) => { setModal(false); loadMember(m); };

  const clearScreen = () => {
    setMember(null); setVoucherDate(''); setWithdrawDate(today); setWithdrawAmount('');
    setPayType('transfer'); setBank(''); setBranch(''); setAccountNo('');
    setCounterAcct(window.SRF_COUNTER_ACCTS[0]); setAsPending(false);
    setDebts([]); setDeductions([]);
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

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!ss.allow) return `หุ้นของสมาชิกอยู่ในสถานะ “${member.shareStatus}” — ไม่สามารถคืนค่าหุ้นได้จนกว่าจะปลดเงื่อนไข`;
    if (!withdrawDate) return 'กรุณาระบุวันที่ถอนหุ้น';
    if (!(withdraw > 0)) return 'กรุณาระบุยอดถอน (มากกว่า 0)';
    if (withdraw > member.withdrawable) return `ยอดถอนต้องไม่เกินยอดถอนได้ ${fmt.money(member.withdrawable, 2)} บาท`;
    if (netRemain < 0) return 'ยอดหักชำระรวมเกินยอดถอน — ตรวจสอบรายการหักชำระหนี้และหักชำระอื่น';
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
      action: 'create', module: V.module,
      target: `${member.code} · ${member.name}`,
      summary: `จ่าย${V.verb} ${docNo} · ยอดถอน ${fmt.money(withdraw, 2)} · โอนชำระหนี้ ${fmt.money(transferToDebt, 2)} · จ่ายสุทธิ ${fmt.money(netRemain, 2)}${issueReceipt ? ' · ออกใบเสร็จ' : ''}`,
      changes: [
        { field: 'ยอดถอน', before: '—', after: fmt.money(withdraw, 2) },
        { field: 'ยอดโอนชำระหนี้', before: '—', after: fmt.money(transferToDebt, 2) },
        { field: 'คงเหลือสุทธิ (จ่ายจริง)', before: '—', after: fmt.money(netRemain, 2) },
        { field: 'ออกใบเสร็จ', before: '—', after: issueReceipt ? 'ใช่' : 'ไม่' },
      ],
    });
    onToast && onToast(`บันทึกการ${V.verb} ${docNo} · ${member.name} เรียบร้อยแล้ว`);
  };

  const doPrint = (label) => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast(`กำลังเตรียมพิมพ์${label}…`);
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label={V.screenLabel}>
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name={V.icon} size={20} /></span>
          <div>
            <h1>{V.title}</h1>
            <div className="icr-form-sub">{V.sub}</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn primary sm" onClick={() => doPrint(V.voucherLabel)}><Icon name="print" size={13} /> พิมพ์ใบสำคัญจ่าย</button>
          <button className="btn sm" onClick={() => doPrint('ใบเสร็จรับเงิน')} disabled={!issueReceipt}><Icon name="receipt" size={13} /> พิมพ์ใบเสร็จ</button>
        </div>
      </div>

      <div className="sr-toolbar">
        <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหาสมาชิก</button>
        <button className="btn sm" onClick={doCalc}><Icon name="refresh" size={13} /> คำนวณยอด</button>
        <label className="fsr-check" style={{ marginLeft: 4 }}>
          <input type="checkbox" className="ch-box" checked={issueReceipt} onChange={(e) => setIssueReceipt(e.target.checked)} />
          <span>ออกใบเสร็จ</span>
        </label>
        <span style={{ flex: 1 }} />
        <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึกจ่ายเงิน</button>
        <button className="btn sm danger" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {loaded && !error && ss.warn && (
        <div className="dn-status-alert bad" style={{ marginBottom: 12 }}>
          <Icon name="info" size={15} />
          <span>หุ้นอยู่ในสถานะ <b>“{member.shareStatus}”</b> — ตรวจสอบและปลดเงื่อนไขก่อนจ่ายคืนค่าหุ้น</span>
        </div>
      )}
      {saved && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} />
          <span>บันทึกการจ่าย{V.verb}เลขที่ <b>{docNo}</b> เรียบร้อยแล้ว — จ่ายสุทธิ <b>{fmt.money(netRemain, 2)}</b> บาท{issueReceipt ? ' · ออกใบเสร็จให้สมาชิกแล้ว' : ''}</span>
        </div>
      )}

      {/* ── ส่วนบน: ซ้าย (ข้อมูล) + ขวา (ยอดสรุป) ── */}
      <div className="sr-top-grid">
        <div className="sr-top-left">
          {/* ① ข้อมูลสมาชิก */}
          <div className="search-card icr-sec">
            <div className="icr-sec-head">
              <span className="sw-sec-ico"><Icon name="user" size={15} /></span>
              <h3>ข้อมูลสมาชิก</h3>
              <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>เลขที่ใบสำคัญจ่าย · <b className="mono">{docNo}</b></span></div>
            </div>
            <div className="icr-strip">
              <FsrFld label="ทะเบียน" w={180} required>
                <div className="icr-search-box" onClick={() => setModal(true)}>
                  <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
                  <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
                </div>
              </FsrFld>
              <FsrFld label="ชื่อ-ชื่อสกุล" grow w={240} required><FsrRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></FsrFld>
              <FsrFld label="สังกัด" grow w={260}><FsrRO value={member ? window.affilMemberLabel(member) : ''} placeholder="(ดึงอัตโนมัติ)" /></FsrFld>
            </div>
          </div>

          {/* ② รายละเอียดหุ้น */}
          <div className="search-card icr-sec">
            <div className="icr-sec-head">
              <span className="sw-sec-ico"><Icon name="shares" size={15} /></span>
              <h3>รายละเอียดหุ้น</h3>
              <div className="icr-sec-actions">
                {loaded && <span className="icr-statusbox"><span className="icr-dot" style={{ background: `var(--${ss.pill === 'ok' ? 'success' : ss.pill === 'bad' ? 'danger' : ss.pill === 'info' ? 'info' : 'text-faint'}, #999)` }} /><span>หุ้น{member.shareStatus}</span></span>}
              </div>
            </div>
            <div className="icr-strip">
              <FsrFld label="หุ้นคงเหลือ" grow w={200}>
                <div className="icr-suffix">
                  <div className="icr-ro num mono sr-locked" style={{ paddingRight: 46 }}>{loaded ? fmt.money(member.shareBalance, 2) : '—'}</div>
                  <span className="icr-suffix-u">บาท</span>
                </div>
              </FsrFld>
              <FsrFld label="สถานะหุ้น" grow w={150}>
                {loaded
                  ? <div className="icr-ro" style={{ display: 'flex', alignItems: 'center' }}><span className={'pill ' + ss.pill}>{member.shareStatus}</span></div>
                  : <FsrRO value="" placeholder="—" />}
              </FsrFld>
              <FsrFld label="วันที่ใบสำคัญจ่าย" grow w={160}>
                <FsrRO value={loaded && voucherDate ? fmt.date(voucherDate) : ''} mono placeholder="/ /" />
              </FsrFld>
              <FsrFld label="วันที่ถอนหุ้น" grow w={160}>
                <ErpDate value={withdrawDate} onChange={(v) => ((e) => { setWithdrawDate(e.target.value); setError(''); })({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
              </FsrFld>
            </div>
          </div>

          {/* ③ รายละเอียดการจ่ายเงิน */}
          <div className="search-card icr-sec">
            <div className="icr-sec-head">
              <span className="sw-sec-ico"><Icon name="bank" size={15} /></span>
              <h3>รายละเอียดการจ่ายเงิน</h3>
              <div className="icr-sec-actions">
                <label className="fsr-check">
                  <input type="checkbox" className="ch-box" checked={asPending} onChange={(e) => setAsPending(e.target.checked)} disabled={!loaded} />
                  <span>หุ้นคงเหลือตั้งเป็นหุ้นค้างจ่าย</span>
                </label>
              </div>
            </div>
            <div className="icr-strip">
              <FsrFld label="ประเภทเงิน" grow w={190} required>
                <select className="cfg-input" value={payType} onChange={(e) => { setPayType(e.target.value); setError(''); }} disabled={!loaded}>
                  {window.SRF_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </FsrFld>
              <FsrFld label="ธนาคาร" grow w={230} required={payDef.needBank}>
                <select className="cfg-input" value={bank} onChange={(e) => { setBank(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
                  <option value="">— เลือกธนาคาร —</option>
                  {window.SRF_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </FsrFld>
              <FsrFld label="สาขา" grow w={180} required={payDef.needBank}>
                <select className="cfg-input" value={branch} onChange={(e) => { setBranch(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
                  <option value="">— เลือกสาขา —</option>
                  {window.SRF_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </FsrFld>
            </div>
            <div className="icr-strip">
              <FsrFld label="เลขที่บัญชี" grow w={200} required={payDef.needBank}>
                <input className="cfg-input mono" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank} placeholder="000-0-00000-0" />
              </FsrFld>
              <FsrFld label="คู่บัญชี" grow w={280}>
                <select className="cfg-input" value={counterAcct} onChange={(e) => setCounterAcct(e.target.value)} disabled={!loaded}>
                  {window.SRF_COUNTER_ACCTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </FsrFld>
            </div>
          </div>
        </div>

        {/* ④ ยอดถอน / ยอดโอนชำระหนี้ / คงเหลือสุทธิ */}
        <div className="search-card icr-sec sr-paycard">
          <div className="icr-sec-head">
            <span className="sw-sec-ico"><Icon name="money" size={15} /></span>
            <h3>สรุปการจ่ายเงิน</h3>
          </div>
          <div className="fsr-amt">
            <span className="fsr-amt-l">{V.withdrawLabel}</span>
            <span className="fsr-amt-v neg">{loaded ? fmt.money(withdraw, 2) : '0.00'}</span>
          </div>
          <div className="fsr-amt">
            <span className="fsr-amt-l">ยอดโอนชำระหนี้</span>
            <span className="fsr-amt-v warn">{loaded ? fmt.money(transferToDebt, 2) : '0.00'}</span>
          </div>
          <div className={'sr-net' + (netRemain < 0 ? ' neg' : '')}>
            <span className="sr-net-l">{V.netLabel}</span>
            <span className="sr-net-v">{loaded ? fmt.money(netRemain, 2) : '0.00'}<span className="sr-net-u">บาท</span></span>
          </div>
          <div className="sr-hint" style={{ marginTop: 10 }}><Icon name="info" size={12} /> คงเหลือสุทธิ = ยอดถอน − ยอดโอนชำระหนี้ (หักชำระหนี้ + หักชำระอื่น)</div>
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
                  {loaded ? 'สมาชิกรายนี้ไม่มีสัญญาหนี้คงค้าง — จ่ายคืนค่าหุ้นได้เต็มจำนวน' : 'เลือกสมาชิกเพื่อแสดงรายการสัญญาหนี้'}
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

      {modal && <window.SrfMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function FinanceShareRefundPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <FsrFormScreen onToast={onToast} audit={audit} variant="refund" />;
}

function FinanceShareHalfWithdrawPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <FsrFormScreen onToast={onToast} audit={audit} variant="halfwithdraw" />;
}

Object.assign(window, { FinanceShareRefundPage, FinanceShareHalfWithdrawPage, FsrFormScreen });
