// ════════════════════════════════════════════════════════════════════
//  ประมาณการถอนหุ้น — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง: ① ค้นหาข้อมูลสมาชิก ② รายละเอียดหุ้น (+ การ์ดสรุป)
//             ③ รายละเอียดการจ่ายเงิน ④ การชำระหนี้/โอนหนี้
//             ⑤ รายการหักชำระอื่น ๆ ⑥ ประมาณการโอนหนี้ผู้ค้ำ + ผู้ค้ำร่วม
//  ใช้ icr-* / dn-* / shc-* จาก styles.css · fmt จาก data.js
// ════════════════════════════════════════════════════════════════════

const swToday = () => new Date().toISOString().slice(0, 10);

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function SwFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function SwRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── การ์ดสรุปยอด (ยอดถอน / ยอดโอนชำระหนี้ / คงเหลือสุทธิ) ───────────
function SwSummary({ label, value, icon, tone }) {
  return (
    <div className={'sw-sum ' + (tone || '')}>
      <span className="sw-sum-ico"><Icon name={icon} size={18} /></span>
      <span className="sw-sum-l">{label}</span>
      <span className="sw-sum-v">{value}<span className="sw-sum-u">บาท</span></span>
    </div>
  );
}

// ─── Popup ค้นหาสมาชิก ───────────────────────────────────────────────
function SwMemberSearchModal({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const results = window.swSearchMembers(q);
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
                  const ss = window.swShareStatus(m.shareStatus);
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
function SwFormScreen({ onToast, audit }) {
  const today = swToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [withdrawDate, setWithdrawDate] = useState(today);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [carryHold, setCarryHold] = useState(false);

  // การจ่ายเงิน
  const [payType, setPayType] = useState('transfer');
  const [bank, setBank] = useState('');
  const [branch, setBranch] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [counterAcct, setCounterAcct] = useState(window.SW_COUNTER_ACCTS[0]);

  // ตาราง
  const [debts, setDebts] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [guarTransfer, setGuarTransfer] = useState([]);
  const [coGuar, setCoGuar] = useState([]);

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loaded = !!member;
  const ss = member ? window.swShareStatus(member.shareStatus) : null;
  const mStat = member ? window.swMemberStatus(member.memberStatus) : null;
  const docNo = window.swNextDocNo(beYear);
  const payDef = window.swPayType(payType);

  const loadMember = (m) => {
    setMember(m);
    setWithdrawDate(today);
    setWithdrawAmount(String(m.shareBalance));
    setCarryHold(false);
    setPayType(m.accountNo ? 'transfer' : 'cash');
    setBank(m.bank || ''); setBranch(m.branch || ''); setAccountNo(m.accountNo || '');
    setCounterAcct(m.counterAcct || window.SW_COUNTER_ACCTS[0]);
    setDebts((m.debts || []).map(d => ({ ...d, selected: true })));
    setDeductions((m.otherDeductions || []).map(d => ({ ...d, selected: true })));
    setGuarTransfer((m.guarTransfer || []).map(g => ({ ...g })));
    setCoGuar((m.coGuarantors || []).map(g => ({ ...g })));
    setError(''); setSaved(false);
  };
  const pickMember = (m) => { setModal(false); loadMember(m); };

  const clearScreen = () => {
    setMember(null); setWithdrawDate(today); setWithdrawAmount(''); setCarryHold(false);
    setPayType('transfer'); setBank(''); setBranch(''); setAccountNo('');
    setCounterAcct(window.SW_COUNTER_ACCTS[0]);
    setDebts([]); setDeductions([]); setGuarTransfer([]); setCoGuar([]);
    setError(''); setSaved(false);
  };

  // ── ตัวช่วยแก้ไขตารางหนี้ ──
  const toggleDebt = (no) => { setError(''); setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, selected: !d.selected } : d)); };
  const setDebtField = (no, k, v) => {
    setError('');
    setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, [k]: v === '' ? '' : Number(v) } : d));
  };
  const toggleDeduction = (i) => { setError(''); setDeductions(ds => ds.map((d, idx) => idx === i ? { ...d, selected: !d.selected } : d)); };

  // ── การคำนวณ ──
  const debtRowTotal = (d) => (Number(d.payPrincipal) || 0) + (Number(d.payInterest) || 0);
  const debtRowRemain = (d) => (Number(d.principal) || 0) - (Number(d.payPrincipal) || 0);
  const selDebts = debts.filter(d => d.selected);
  const selDeductions = deductions.filter(d => d.selected);

  const debtTotals = debts.reduce((a, d) => ({
    principal: a.principal + (Number(d.principal) || 0),
    interestCalc: a.interestCalc + (Number(d.interestCalc) || 0),
    interestArrears: a.interestArrears + (Number(d.interestArrears) || 0),
    payPrincipal: a.payPrincipal + (d.selected ? (Number(d.payPrincipal) || 0) : 0),
    payInterest: a.payInterest + (d.selected ? (Number(d.payInterest) || 0) : 0),
    rowTotal: a.rowTotal + (d.selected ? debtRowTotal(d) : 0),
    remain: a.remain + debtRowRemain(d),
  }), { principal: 0, interestCalc: 0, interestArrears: 0, payPrincipal: 0, payInterest: 0, rowTotal: 0, remain: 0 });

  const deductionTotal = selDeductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const transferToDebt = debtTotals.rowTotal + deductionTotal;   // ยอดโอนชำระหนี้
  const withdraw = Number(withdrawAmount) || 0;                  // ยอดถอน
  const netRemain = withdraw - transferToDebt;                   // คงเหลือสุทธิ

  // ผู้ค้ำ
  const guarTotals = guarTransfer.reduce((a, g) => ({
    tp: a.tp + (Number(g.transferPrincipal) || 0), ti: a.ti + (Number(g.transferInterestArrears) || 0),
    pp: a.pp + (Number(g.payPrincipal) || 0), pi: a.pi + (Number(g.payInterestArrears) || 0),
  }), { tp: 0, ti: 0, pp: 0, pi: 0 });
  const coGuarTotals = coGuar.reduce((a, g) => ({
    tp: a.tp + (Number(g.transferPrincipal) || 0), ti: a.ti + (Number(g.transferInterestArrears) || 0),
    pp: a.pp + (Number(g.payPrincipal) || 0), pi: a.pi + (Number(g.payInterestArrears) || 0),
  }), { tp: 0, ti: 0, pp: 0, pi: 0 });

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!ss.allow) return `หุ้นของสมาชิกอยู่ในสถานะ “${member.shareStatus}” — ไม่สามารถถอนหุ้นได้จนกว่าจะปลดเงื่อนไข`;
    if (withdrawDate < today) return 'วันที่ถอนหุ้นต้องไม่มาก่อนวันที่ทำรายการ';
    if (!(withdraw > 0)) return 'กรุณาระบุยอดถอนหุ้น (มากกว่า 0)';
    if (withdraw > member.shareBalance) return `ยอดถอนต้องไม่เกินหุ้นคงเหลือ ${fmt.money(member.shareBalance, 2)} บาท`;
    if (transferToDebt > withdraw) return 'ยอดชำระหนี้รวมต้องไม่เกินยอดถอนหุ้น';
    if (netRemain < 0 && guarTransfer.length === 0) return 'คงเหลือสุทธิติดลบ — ต้องโอนหนี้ส่วนเกินไปยังผู้ค้ำประกัน';
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
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ประมาณการถอนหุ้น',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกประมาณการถอนหุ้น ${docNo} · ยอดถอน ${fmt.money(withdraw, 2)} · โอนชำระหนี้ ${fmt.money(transferToDebt, 2)} · คงเหลือสุทธิ ${fmt.money(netRemain, 2)}`,
      changes: [
        { field: 'ยอดถอนหุ้น', before: '—', after: fmt.money(withdraw, 2) },
        { field: 'ยอดโอนชำระหนี้', before: '—', after: fmt.money(transferToDebt, 2) },
        { field: 'คงเหลือสุทธิ', before: '—', after: fmt.money(netRemain, 2) },
      ],
    });
    onToast && onToast(`บันทึกประมาณการถอนหุ้น ${docNo} · ${member.name} เรียบร้อยแล้ว`);
  };

  const doPrint = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบประมาณการถอนหุ้น…');
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="ประมาณการถอนหุ้น">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="shares" size={20} /></span>
          <div>
            <h1>ประมาณการถอนหุ้น</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · คำนวณยอดถอนหุ้น โอนชำระหนี้ และคงเหลือสุทธิที่สมาชิกได้รับ</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn sm" onClick={doCalc}><Icon name="refresh" size={13} /> คำนวณ</button>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn sm danger" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {loaded && !error && (ss.warn || mStat.warn) && (
        <div className={'dn-status-alert' + (ss.allow ? '' : ' bad')} style={{ marginBottom: 12 }}>
          <Icon name="info" size={15} />
          <span>
            {!ss.allow
              ? <>หุ้นอยู่ในสถานะ <b>“{member.shareStatus}”</b> — ตรวจสอบและปลดเงื่อนไขก่อนทำรายการถอนหุ้น</>
              : <>สถานะสมาชิก <b>“{member.memberStatus}”</b> — ตรวจสอบเอกสารและภาระหนี้คงค้างก่อนถอนหุ้น</>}
          </span>
        </div>
      )}
      {saved && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} />
          <span>บันทึกประมาณการถอนหุ้นเลขที่ <b>{docNo}</b> เรียบร้อยแล้ว — ส่งต่อให้ฝ่ายการเงินจ่ายเงินคืนหุ้น</span>
        </div>
      )}

      {/* ── ① ค้นหาข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="user" size={15} /></span>
          <h3>ค้นหาข้อมูลสมาชิก</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>เลขที่เอกสาร · <b className="mono">{docNo}</b></span></div>
        </div>
        <div className="icr-strip">
          <SwFld label="ทะเบียน" w={210} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </SwFld>
          <SwFld label="ชื่อ-ชื่อสกุล" grow w={280} required><SwRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></SwFld>
          <SwFld label="สังกัด" grow w={320}><SwRO value={member ? window.affilMemberLabel(member) : ''} placeholder="(ดึงอัตโนมัติ)" /></SwFld>
        </div>
      </div>

      {/* ── ② รายละเอียดหุ้น (+ การ์ดสรุป) ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="shares" size={15} /></span>
          <h3>รายละเอียดหุ้น</h3>
        </div>
        <div className="sw-share-grid">
          <div className="sw-share-form">
            <div className="icr-strip">
              <SwFld label="หุ้นคงเหลือ" w={210}>
                <div className="icr-suffix">
                  <div className="icr-ro num mono" style={{ paddingRight: 46, justifyContent: 'flex-end' }}>{loaded ? fmt.money(member.shareBalance, 2) : '—'}</div>
                  <span className="icr-suffix-u">บาท</span>
                </div>
              </SwFld>
              <SwFld label="สถานะหุ้น" w={140}>
                {loaded ? <div className="icr-statusbox"><span className="icr-dot" style={{ background: `var(--${ss.pill === 'ok' ? 'success' : ss.pill === 'bad' ? 'danger' : ss.pill === 'info' ? 'info' : 'text-faint'}, #999)` }} /><span>{member.shareStatus}</span></div> : <SwRO value="" />}
              </SwFld>
              <SwFld label="วันที่ใบสำคัญจ่าย" w={170}>
                <input className="cfg-input" type="date" value={loaded ? member.voucherDate : ''} readOnly disabled={!loaded} />
              </SwFld>
              <SwFld label="วันที่ถอนหุ้น" w={170} required>
                <ErpDate value={withdrawDate} onChange={(v) => ((e) => { setWithdrawDate(e.target.value); setError(''); })({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
              </SwFld>
              <SwFld label="ยอดถอน" w={210} required>
                <div className="icr-suffix">
                  <input className="cfg-input mono" type="number" min="0" value={withdrawAmount}
                         onChange={(e) => { setWithdrawAmount(e.target.value); setError(''); }} disabled={!loaded} placeholder="0.00" />
                  <span className="icr-suffix-u">บาท</span>
                </div>
              </SwFld>
            </div>
            <label className="ct-addr-check" style={{ marginTop: 14 }}>
              <input type="checkbox" className="ch-box" checked={carryHold} onChange={(e) => setCarryHold(e.target.checked)} disabled={!loaded} />
              <span>หุ้นคงเหลือตั้งเป็นหุ้นค้างจ่าย <span className="muted" style={{ fontSize: 11 }}>(ตั้งเป็นยอดค้างจ่ายไว้ก่อน ยังไม่จ่ายคืนหุ้นทันที)</span></span>
            </label>
          </div>

          <div className="sw-summary">
            <SwSummary label="ยอดถอน" value={loaded ? fmt.money(withdraw, 2) : '—'} icon="wallet" tone="t-primary" />
            <SwSummary label="ยอดโอนชำระหนี้" value={loaded ? fmt.money(transferToDebt, 2) : '—'} icon="bank" tone="t-amber" />
            <SwSummary label="คงเหลือสุทธิ" value={loaded ? fmt.money(netRemain, 2) : '—'} icon="money" tone={netRemain < 0 ? 't-danger' : 't-success'} />
          </div>
        </div>
      </div>

      {/* ── ③ รายละเอียดการจ่ายเงิน ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="bank" size={15} /></span>
          <h3>รายละเอียดการจ่ายเงิน</h3>
        </div>
        <div className="icr-strip">
          <SwFld label="ประเภทเงิน" w={200} required>
            <select className="cfg-input" value={payType} onChange={(e) => { setPayType(e.target.value); setError(''); }} disabled={!loaded}>
              {window.SW_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </SwFld>
          <SwFld label="ธนาคาร" grow w={260} required={payDef.needBank}>
            <select className="cfg-input" value={bank} onChange={(e) => { setBank(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
              <option value="">— เลือกธนาคาร —</option>
              {window.SW_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </SwFld>
          <SwFld label="สาขา" grow w={200} required={payDef.needBank}>
            <select className="cfg-input" value={branch} onChange={(e) => { setBranch(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank}>
              <option value="">— เลือกสาขา —</option>
              {window.SW_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </SwFld>
          <SwFld label="เลขที่บัญชี" w={170} required={payDef.needBank}>
            <input className="cfg-input mono" value={accountNo} onChange={(e) => { setAccountNo(e.target.value); setError(''); }} disabled={!loaded || !payDef.needBank} placeholder="000-0-00000-0" />
          </SwFld>
          <SwFld label="คู่บัญชี" grow w={280}>
            <select className="cfg-input" value={counterAcct} onChange={(e) => setCounterAcct(e.target.value)} disabled={!loaded}>
              {window.SW_COUNTER_ACCTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </SwFld>
        </div>
      </div>

      {/* ── ④ รายละเอียดการชำระหนี้ / โอนหนี้ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="loans" size={15} /></span>
          <h3>รายละเอียดการชำระหนี้ / โอนหนี้</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}><Icon name="info" size={11} /> เลือกสัญญาที่นำยอดถอนหุ้นไปหักชำระ</span></div>
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
                <th rowSpan="2" className="num">ต้นคงเหลือ</th>
              </tr>
              <tr>
                <th className="center sw-sub">ตั้งแต่</th>
                <th className="num sw-sub">ด/บ ที่คิดได้</th>
                <th className="num sw-sub">ด/บ ค้าง</th>
                <th className="num sw-sub">ต้นเงิน</th>
                <th className="num sw-sub">ด/บ</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="10" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  {loaded ? 'สมาชิกรายนี้ไม่มีสัญญาหนี้คงค้าง — ถอนหุ้นได้เต็มจำนวน' : 'เลือกสมาชิกเพื่อแสดงรายการสัญญาหนี้'}
                </td></tr>
              ) : debts.map(d => (
                <tr key={d.contractNo} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDebt(d.contractNo)} /></td>
                  <td className="mono">{d.contractNo}<div className="muted" style={{ fontSize: 10 }}>{d.loanType}</div></td>
                  <td className="num mono">{fmt.money(d.principal, 2)}</td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{fmt.date(d.interestFrom)}</td>
                  <td className="num mono">{fmt.money(d.interestCalc, 2)}</td>
                  <td className="num mono" style={{ color: d.interestArrears > 0 ? 'var(--danger)' : undefined }}>{fmt.money(d.interestArrears, 2)}</td>
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
                  <td className="num mono"><b>{fmt.money(debtTotals.interestCalc, 2)}</b></td>
                  <td className="num mono" style={{ color: 'var(--danger)' }}><b>{fmt.money(debtTotals.interestArrears, 2)}</b></td>
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

      {/* ── ⑤ รายการหักชำระอื่น ๆ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="receipt" size={15} /></span>
          <h3>รายละเอียดการหัก / การชำระอื่น</h3>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th style={{ width: 110 }}>รหัส</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 220 }}>ยอดเงินชำระ</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">{loaded ? 'ไม่มีรายการหักชำระอื่น' : 'เลือกสมาชิกเพื่อแสดงรายการหัก'}</td></tr>
              ) : deductions.map((d, i) => (
                <tr key={i} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDeduction(i)} /></td>
                  <td className="mono">{d.code}</td>
                  <td>{d.detail}</td>
                  <td className="num mono">{fmt.money(d.amount, 2)}</td>
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

      {/* ── ⑥ ประมาณการโอนหนี้ผู้ค้ำ ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="guarantee" size={15} /></span>
          <h3>ประมาณการโอนหนี้ผู้ค้ำ</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>{netRemain < 0 ? `หนี้ส่วนเกิน ${fmt.money(-netRemain, 2)} บาท โอนไปยังผู้ค้ำ` : 'ไม่มียอดหนี้ส่วนเกินที่ต้องโอน'}</span></div>
        </div>

        <div className="sw-guar-sub">สัญญาที่โอนหนี้ให้ผู้ค้ำ</div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th rowSpan="2">เลขที่สัญญา</th>
                <th rowSpan="2">เลขสมาชิก</th>
                <th rowSpan="2">ชื่อ-ชื่อสกุล</th>
                <th rowSpan="2">สังกัด</th>
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
              {guarTransfer.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">ไม่มีสัญญาที่ต้องโอนหนี้ให้ผู้ค้ำประกัน</td></tr>
              ) : guarTransfer.map((g, i) => (
                <tr key={i}>
                  <td className="mono">{g.contractNo}</td>
                  <td className="mono">{g.memberCode}</td>
                  <td>{g.name}</td>
                  <td style={{ fontSize: 12 }}>{g.dept}</td>
                  <td className="num mono">{fmt.money(g.transferPrincipal, 2)}</td>
                  <td className="num mono">{fmt.money(g.transferInterestArrears, 2)}</td>
                  <td className="num mono">{fmt.money(g.payPrincipal, 2)}</td>
                  <td className="num mono">{fmt.money(g.payInterestArrears, 2)}</td>
                </tr>
              ))}
            </tbody>
            {guarTransfer.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="4" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(guarTotals.tp, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(guarTotals.ti, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(guarTotals.pp, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(guarTotals.pi, 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>

        <div className="sw-guar-sub" style={{ marginTop: 18 }}>ผู้ค้ำประกันร่วม</div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th rowSpan="2">เลขที่สัญญา</th>
                <th rowSpan="2">เลขสมาชิก</th>
                <th rowSpan="2">ชื่อ-ชื่อสกุล</th>
                <th rowSpan="2">สังกัด</th>
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
              {coGuar.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">ไม่มีผู้ค้ำประกันร่วม</td></tr>
              ) : coGuar.map((g, i) => (
                <tr key={i}>
                  <td className="mono">{g.contractNo}</td>
                  <td className="mono">{g.memberCode}</td>
                  <td>{g.name}</td>
                  <td style={{ fontSize: 12 }}>{g.dept}</td>
                  <td className="num mono">{fmt.money(g.transferPrincipal, 2)}</td>
                  <td className="num mono">{fmt.money(g.transferInterestArrears, 2)}</td>
                  <td className="num mono">{fmt.money(g.payPrincipal, 2)}</td>
                  <td className="num mono">{fmt.money(g.payInterestArrears, 2)}</td>
                </tr>
              ))}
            </tbody>
            {coGuar.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="4" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(coGuarTotals.tp, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(coGuarTotals.ti, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(coGuarTotals.pp, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(coGuarTotals.pi, 2)}</b></td>
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
function ShareWithdrawPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <SwFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { ShareWithdrawPage, SwFormScreen, SwMemberSearchModal });
