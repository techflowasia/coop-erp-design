// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ทดรองจ่ายปันผล-เฉลี่ยคืน
//  หน้าจอทำรายการ (editable): เอกสาร → สมาชิก → ช่องทางจ่าย →
//  ยอดเงิน (ปันผล/เฉลี่ยคืน − หัก → รับสุทธิ) → รายการหนี้รายสัญญา
//  · เลขเอกสาร AUTO ก่อนบันทึก · ป้องกันจ่ายซ้ำ · ป้องกันยอดติดลบ
//  · ใช้ ADV_MEMBERS / advRecord / advSummary · MemberSearchModal
// ═════════════════════════════════════════════════════════════════

const advM = (v) => window.fmt.money(v || 0, 2);

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function AdvFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 140 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── การ์ดยอดเงิน (label บน + ตัวเลขใหญ่) ────────────────────────────
function AdvAmt({ label, value, sub, accent, tone, big }) {
  return (
    <div className={'adv-amt' + (big ? ' adv-amt-net' : '')}>
      <span className="adv-amt-l">{label}</span>
      <div className="adv-amt-v">
        <b className={tone ? 'dvk-v-' + tone : ''}>{value}</b>
        <span className="adv-amt-u">บาท</span>
      </div>
      {sub && <span className="adv-amt-sub">{sub}</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
function AdvanceDividendPage({ onToast }) {
  const today = React.useMemo(() => window.advTodayThai(), []);
  const [year, setYear]       = React.useState('2564');
  const [intDate, setIntDate] = React.useState('22/05/2565');   // วันที่คิดดอกเบี้ย
  const [txnDate, setTxnDate] = React.useState(today);          // วันที่ทำรายการ
  const [member, setMember]   = React.useState(null);
  const [rec, setRec]         = React.useState(null);
  const [memberMsg, setMemberMsg] = React.useState(null);       // {tone, text} แจ้งเตือนใต้ช่องสมาชิก
  const [payMethod, setPayMethod] = React.useState('');
  const [bank, setBank]       = React.useState('');
  const [branch, setBranch]   = React.useState('');
  const [bankAcct, setBankAcct] = React.useState('');
  const [docNo, setDocNo]     = React.useState(null);           // null = AUTO (ยังไม่บันทึก)
  const [errors, setErrors]   = React.useState([]);
  const [modal, setModal]     = React.useState(false);
  const user = 'VIBHA';

  const need = (window.advPayMethod(payMethod) || {}).need;     // 'bank' | 'none'
  const summary = React.useMemo(
    () => rec ? window.advSummary(rec, intDate) : null, [rec, intDate]);

  // ── เลือกสมาชิก ──
  const loadMember = (m) => {
    const r = window.advRecord(m.code, year);
    setMember(m);
    setRec(r);
    setErrors([]);
    if (!r) {
      setMemberMsg({ tone: 'warn', text: 'สมาชิกไม่มีข้อมูลปันผล/เฉลี่ยคืนในปี ' + year + ' กรุณาตรวจสอบการประมวลผลประจำปี' });
      setPayMethod(''); setBank(''); setBranch(''); setBankAcct('');
      return;
    }
    if (r.paid) {
      setMemberMsg({ tone: 'bad', text: 'สมาชิกเลขที่ ' + m.code + ' ได้รับเงินปันผล-เฉลี่ยคืนของปี ' + year + ' แล้ว (เลขเอกสาร ' + (r.docNo || '—') + ') ไม่สามารถทำรายการซ้ำได้' });
    } else {
      setMemberMsg({ tone: 'ok', text: 'ดึงข้อมูลปันผล/เฉลี่ยคืนและรายการหนี้ของ ' + m.name + ' เรียบร้อย' });
    }
    // prefill บัญชีรับเงินจากแฟ้มสมาชิก
    setPayMethod('transfer');
    setBank(r.bank || ''); setBranch(r.branch || ''); setBankAcct(r.bankAcct || '');
  };

  const pickMember = (m) => { loadMember(m); setModal(false); };

  const changeYear = (yr) => {
    setYear(yr);
    if (member) {
      const r = window.advRecord(member.code, yr);
      setRec(r); setErrors([]);
      if (!r) setMemberMsg({ tone: 'warn', text: 'สมาชิกไม่มีข้อมูลปันผล/เฉลี่ยคืนในปี ' + yr });
      else if (r.paid) setMemberMsg({ tone: 'bad', text: 'สมาชิกได้รับเงินปันผล-เฉลี่ยคืนของปี ' + yr + ' แล้ว ไม่สามารถทำรายการซ้ำได้' });
      else { setMemberMsg({ tone: 'ok', text: 'ดึงข้อมูลปี ' + yr + ' เรียบร้อย' });
             setPayMethod('transfer'); setBank(r.bank || ''); setBranch(r.branch || ''); setBankAcct(r.bankAcct || ''); }
    }
  };

  // ── ปุ่มคำสั่ง ──
  const clearScreen = () => {
    setMember(null); setRec(null); setMemberMsg(null); setErrors([]);
    setPayMethod(''); setBank(''); setBranch(''); setBankAcct(''); setDocNo(null);
    onToast && onToast('ล้างข้อมูลแล้ว — เริ่มทำรายการใหม่');
  };

  const validate = () => {
    const errs = [];
    if (!year) errs.push('กรุณาระบุปีปันผล');
    if (!intDate || !window.advParseThai(intDate)) errs.push('กรุณาระบุวันที่คิดดอกเบี้ยให้ถูกต้อง (วว/ดด/ปปปป)');
    if (!txnDate || !window.advParseThai(txnDate)) errs.push('กรุณาระบุวันที่ทำรายการให้ถูกต้อง (วว/ดด/ปปปป)');
    if (!member) { errs.push('กรุณาเลือกสมาชิก'); return errs; }
    if (!rec) { errs.push('สมาชิกไม่มีข้อมูลปันผล/เฉลี่ยคืนในปีที่เลือก'); return errs; }
    if (rec.paid) errs.push('สมาชิกได้รับเงินปันผล-เฉลี่ยคืนของปีนี้แล้ว ไม่สามารถทำรายการซ้ำได้');
    if (rec.dividend <= 0 && rec.avgReturn <= 0) errs.push('สมาชิกไม่มียอดปันผลหรือเฉลี่ยคืนให้จ่าย');
    if (!payMethod) errs.push('กรุณาเลือกช่องทางการจ่ายเงิน');
    if (need === 'bank' && (!bank || !branch || !bankAcct))
      errs.push('การจ่ายแบบโอนเงินต้องระบุ ธนาคาร / สาขา / เลขที่บัญชี');
    if (need === 'bank' && bankAcct && !/^[0-9\- ]{6,}$/.test(bankAcct))
      errs.push('เลขที่บัญชีไม่ถูกต้อง — ต้องเป็นตัวเลข');
    return errs;
  };

  const doSave = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) { onToast && onToast('พบ ' + errs.length + ' ข้อที่ต้องแก้ไขก่อนบันทึก'); return; }
    const seq = String(Math.floor(Math.random() * 900000) + 100000);
    const generated = 'ADV-DIV-' + year + '-' + seq;
    setDocNo(generated);
    setRec(r => ({ ...r, paid: true, docNo: generated }));
    setMemberMsg({ tone: 'ok', text: 'บันทึกรายการทดรองจ่ายปันผล-เฉลี่ยคืนเรียบร้อยแล้ว (เลขเอกสาร ' + generated + ')' });
    onToast && onToast('บันทึกรายการทดรองจ่ายปันผล-เฉลี่ยคืนเรียบร้อยแล้ว — ' + generated);
  };

  const doPrint = () => {
    if (!rec) { onToast && onToast('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    setTimeout(() => window.print(), 80);
  };
  const doCancel = () => { window.history.back(); };

  const msgPill = memberMsg ? (memberMsg.tone === 'bad' ? 'bad' : memberMsg.tone === 'warn' ? 'warn' : 'ok') : '';

  return (
    <div data-screen-label="ทดรองจ่ายปันผล-เฉลี่ยคืน" className="adv-page">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="wallet" size={20} /></span>
          <div>
            <h1>ทดรองจ่ายปันผล-เฉลี่ยคืน</h1>
            <div className="icr-form-sub">ทำรายการจ่ายเงินปันผลและเฉลี่ยคืนรายบุคคล โดยตรวจสอบภาระหนี้ก่อนจ่าย</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn primary sm" onClick={doSave}><Icon name="download" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn sm" onClick={doCancel}><Icon name="close" size={13} /> ยกเลิก</button>
        </div>
      </div>

      {/* ── ① ข้อมูลเอกสารและข้อมูลทั่วไป ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลเอกสารและข้อมูลทั่วไป</h3></div>
        <div className="icr-strip" style={{ marginTop: 12 }}>
          <AdvFld label="เลขเอกสาร" w={190}>
            <div className={'icr-ro mono' + (docNo ? '' : ' icr-auto')}>{docNo || 'AUTO'}</div>
          </AdvFld>
          <AdvFld label="ปีปันผล" w={130} required>
            <select className="cfg-input mono" value={year} onChange={(e) => changeYear(e.target.value)}>
              {window.ADV_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </AdvFld>
          <AdvFld label="วันที่คิดดอกเบี้ย" w={150} required>
            <input className="cfg-input mono" value={intDate}
                   onChange={(e) => { setIntDate(e.target.value); setErrors([]); }} placeholder="วว/ดด/ปปปป" />
          </AdvFld>
          <AdvFld label="วันที่ทำรายการ" w={150} required>
            <input className="cfg-input mono" value={txnDate}
                   onChange={(e) => setTxnDate(e.target.value)} placeholder="วว/ดด/ปปปป" />
          </AdvFld>
          <AdvFld label="ผู้ทำรายการ" w={150}>
            <div className="icr-ro mono sr-locked">{user}</div>
          </AdvFld>
        </div>
      </div>

      {/* ── ② ข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3></div>
        <div className="icr-strip" style={{ marginTop: 12 }}>
          <AdvFld label="เลขสมาชิก" w={210} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </AdvFld>
          <AdvFld label="ชื่อ - ชื่อสกุล" grow w={280}>
            <div className={'icr-ro' + (member ? '' : ' empty')} style={{ justifyContent: 'flex-start' }}>
              {member ? member.name : '(ดึงอัตโนมัติเมื่อเลือกสมาชิก)'}
            </div>
          </AdvFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 12 }}>
          <AdvFld label="สังกัด" grow w={420}>
            <div className={'icr-ro' + (member ? '' : ' empty')} style={{ justifyContent: 'flex-start' }}>
              {member ? member.dept : '(ดึงอัตโนมัติ)'}
            </div>
          </AdvFld>
        </div>
        {memberMsg && (
          <div className={'adv-note adv-note-' + msgPill}>
            <Icon name={msgPill === 'ok' ? 'check' : 'info'} size={14} />
            <span>{memberMsg.text}</span>
          </div>
        )}
      </div>

      {/* ── ③ ช่องทางการจ่ายเงิน + ④ ข้อมูลยอดเงิน ── */}
      <div className="adv-grid">
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>ช่องทางการจ่ายเงิน</h3></div>
          <div className="adv-pay" style={{ marginTop: 12 }}>
            <div className="adv-pay-row">
              <span className="adv-pay-l">ทำรายการโดย<span className="cfg-required"> *</span></span>
              <select className="cfg-input" value={payMethod} onChange={(e) => { setPayMethod(e.target.value); setErrors([]); }} disabled={!rec || rec.paid}>
                <option value="">— กรุณาเลือก —</option>
                {window.ADV_PAY_METHODS.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
              </select>
            </div>
            <div className="adv-pay-row">
              <span className="adv-pay-l">ธนาคาร{need === 'bank' && <span className="cfg-required"> *</span>}</span>
              <select className="cfg-input" value={bank} onChange={(e) => setBank(e.target.value)} disabled={need !== 'bank'}>
                <option value="">— กรุณาเลือก —</option>
                {window.ADV_BANKS.map(b => <option key={b.v} value={b.v}>{b.l}</option>)}
              </select>
            </div>
            <div className="adv-pay-row">
              <span className="adv-pay-l">สาขา</span>
              <input className="cfg-input" value={branch} onChange={(e) => setBranch(e.target.value)}
                     placeholder="รหัส / ชื่อสาขา" disabled={need !== 'bank'} />
            </div>
            <div className="adv-pay-row">
              <span className="adv-pay-l">เลขบัญชี{need === 'bank' && <span className="cfg-required"> *</span>}</span>
              <input className="cfg-input mono" value={bankAcct} onChange={(e) => setBankAcct(e.target.value)}
                     placeholder="xxx-x-xxxxx-x" disabled={need !== 'bank'} />
            </div>
          </div>
        </div>

        <div className="search-card icr-sec">
          <div className="section-head">
            <span className="head-bar" /><h3>ข้อมูลยอดเงิน</h3>
            <span className="spacer" style={{ flex: 1 }} />
            <span className="muted" style={{ fontSize: 11.5 }}>หน่วย: บาท</span>
          </div>
          <div className="adv-amts" style={{ marginTop: 12 }}>
            <AdvAmt label="ปันผล"     value={summary ? advM(rec.dividend) : '0.00'}   tone="green" />
            <AdvAmt label="เฉลี่ยคืน"  value={summary ? advM(rec.avgReturn) : '0.00'}  tone="green" />
            <AdvAmt label="หักสอร."    value={summary ? advM(rec.deductCoop) : '0.00'} tone="danger" />
            <AdvAmt label="หักสส.ชสอ"  value={summary ? advM(rec.deductAssoc) : '0.00'} tone="danger" />
            <AdvAmt label="ก่อนหัก 80%" value={summary ? advM(summary.before80) : '0.00'}
                    sub={summary ? 'ยอดตามเงื่อนไข 80% = ' + advM(summary.cond80) : null} />
            <AdvAmt label="รับสุทธิ" big
                    value={summary ? advM(summary.net) : '0.00'}
                    tone={summary && summary.net > 0.005 ? 'green' : 'danger'}
                    sub={summary && summary.overDeduct ? 'ยอดหักมากกว่าสิทธิ์ — ปรับเป็น 0.00' : (summary ? 'หักรวม ' + advM(summary.totalDeduct) : null)} />
          </div>
        </div>
      </div>

      {/* ── ⑤ รายการหนี้ ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>รายการหนี้</h3>
          <span className="spacer" style={{ flex: 1 }} />
          {summary && <span className="muted" style={{ fontSize: 11.5 }}>คิดดอกเบี้ย ณ {intDate} · {summary.lines.length} สัญญา</span>}
        </div>
        <div className="table-wrap" style={{ marginTop: 4 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: 56 }} rowSpan="2">ลำดับ</th>
                  <th style={{ width: 130 }} rowSpan="2">เลขสัญญา</th>
                  <th className="num" style={{ width: 130 }} rowSpan="2">ต้นเงิน</th>
                  <th className="center" colSpan="3">ดอกเบี้ย</th>
                  <th className="num" style={{ width: 130 }} rowSpan="2">การชำระ ด/บ</th>
                  <th className="num" style={{ width: 130 }} rowSpan="2">รวมชำระ</th>
                  <th className="num" style={{ width: 130 }} rowSpan="2">ต้นเงินคงเหลือ</th>
                </tr>
                <tr>
                  <th className="center" style={{ width: 110 }}>ตั้งแต่</th>
                  <th className="num" style={{ width: 110 }}>ด/บ ค้าง</th>
                  <th className="num" style={{ width: 110 }}>ด/บ ใหม่</th>
                </tr>
              </thead>
              <tbody>
                {summary && summary.lines.length ? summary.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono">{l.contractNo}</td>
                    <td className="num mono">{advM(l.principal)}</td>
                    <td className="center mono">{l.intFrom}</td>
                    <td className="num mono">{advM(l.intAccrued)}</td>
                    <td className="num mono">{advM(l.intNew)}</td>
                    <td className="num mono">{advM(l.payInt)}</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{advM(l.totalPay)}</td>
                    <td className="num mono">{advM(l.remainPrincipal)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="9"><div className="empty-state" style={{ padding: 24 }}>
                    {!member ? '— กรุณาค้นหาสมาชิกเพื่อแสดงรายการหนี้ —'
                      : !rec ? '— สมาชิกไม่มีข้อมูลในปีที่เลือก —'
                      : '— สมาชิกไม่มีหนี้คงค้าง —'}
                  </div></td></tr>
                )}
              </tbody>
              {summary && summary.lines.length > 0 && (
                <tfoot>
                  <tr className="adv-tfoot">
                    <td className="center" colSpan="4">รวม</td>
                    <td className="num mono">{advM(summary.lines.reduce((a, l) => a + l.intAccrued, 0))}</td>
                    <td className="num mono">{advM(summary.lines.reduce((a, l) => a + l.intNew, 0))}</td>
                    <td className="num mono">{advM(summary.lines.reduce((a, l) => a + l.payInt, 0))}</td>
                    <td className="num mono">{advM(summary.debtPay)}</td>
                    <td className="num mono">{advM(summary.lines.reduce((a, l) => a + l.remainPrincipal, 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        <div className="ie-foot-note" style={{ marginTop: 10 }}>
          <Icon name="info" size={13} />
          <span className="muted">ลำดับการชำระจากเงินปันผล/เฉลี่ยคืน: ดอกเบี้ยค้าง → ดอกเบี้ยใหม่ → เงินต้น — ดอกเบี้ยใหม่คำนวณจากเงินต้นคงเหลือ × อัตรา/ปี × จำนวนวัน ÷ 365 ถึงวันที่คิดดอกเบี้ย · ตัวเลขทั้งหมดเป็นตัวอย่างข้อมูล</span>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="dvk-errors" style={{ marginTop: 4 }}>
          <div className="dvk-err-head"><Icon name="info" size={14} /> ตรวจสอบข้อมูลก่อนบันทึก ({errors.length})</div>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* ── แถบสรุปยอดรับสุทธิ + ปุ่มบันทึก (sticky) ── */}
      <div className="dvk-foot">
        <span className="dvk-foot-ico"><Icon name="wallet" size={22} /></span>
        <div className="dvk-foot-bal">
          <span className="dvk-foot-l">รับสุทธิ (ยอดที่สมาชิกได้รับจริง)</span>
          <div className="dvk-foot-v">
            <b className={summary ? (summary.net > 0.005 ? 'dvk-v-green' : 'dvk-v-danger') : ''}>{summary ? advM(summary.net) : '0.00'}</b>
            <span className="dvk-foot-u">บาท</span>
          </div>
        </div>
        <span className="dvk-foot-divider" />
        {summary && (
          <div className="adv-foot-mini">
            <span>ปันผล + เฉลี่ยคืน <b className="mono">{advM(summary.grossEntitled)}</b></span>
            <span>หักรวม <b className="mono">{advM(summary.totalDeduct)}</b></span>
          </div>
        )}
        <span className="dvk-foot-sp" />
        <button className="btn primary lg" onClick={doSave} disabled={!rec || rec.paid}><Icon name="download" size={15} /> บันทึกรายการ</button>
        <button className="btn lg" onClick={clearScreen}><Icon name="refresh" size={15} /> ล้างข้อมูล</button>
      </div>

      {modal && <MemberSearchModal onPick={pickMember} onClose={() => setModal(false)}
                                   title="ค้นหาสมาชิก" source={window.ADV_MEMBERS} searchFn={window.advSearchMembers} />}
    </div>
  );
}

Object.assign(window, { AdvanceDividendPage });
