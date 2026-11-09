// ════════════════════════════════════════════════════════════════════
//  ใบคำขอเปลี่ยนแปลงยอดชำระหนี้ — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง 5 ส่วน: ① ค้นหาสัญญา ② ข้อมูลคำขอ ③ ข้อมูลสัญญาเงินกู้
//                    ④ รายละเอียดการเปลี่ยนแปลง ⑤ ประวัติการเปลี่ยนแปลง
// ════════════════════════════════════════════════════════════════════

const ICR_PILL_COLOR = {
  ok: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)',
  info: 'var(--info)', neutral: 'var(--text-faint, #9aa3ab)', primary: 'var(--primary)',
};

// ─── หัวข้อ section พร้อมเลขลำดับ (วงกลมเขียว) ───────────────────────
function IcrSecHead({ no, title, children }) {
  return (
    <div className="icr-sec-head">
      <h3>{title}</h3>
      {children && <div className="icr-sec-actions">{children}</div>}
    </div>
  );
}

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function IcrFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 130 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function IcrRO({ value, mono, num, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── ป้ายสถานะแบบกล่อง (ใช้แทน select เมื่ออ่านอย่างเดียว) ──────────
function IcrStatusBox({ pill, label }) {
  return (
    <div className="icr-statusbox">
      <span className="icr-dot" style={{ background: ICR_PILL_COLOR[pill] || ICR_PILL_COLOR.neutral }} />
      <span>{label}</span>
    </div>
  );
}

// ─── select ที่มีจุดสีสถานะนำหน้า ───────────────────────────────────
function IcrDotSelect({ value, onChange, options, disabled }) {
  const cur = options.find(o => o.v === value) || options[0];
  return (
    <div className="icr-dotsel">
      <span className="icr-dot" style={{ background: ICR_PILL_COLOR[cur ? cur.pill : 'neutral'] || ICR_PILL_COLOR.neutral }} />
      <select className="cfg-input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ─── แถวฟิลด์ใน section รายละเอียด (label ซ้าย + control ขวา) ────────
function IcrRow({ label, required, children, hint }) {
  return (
    <div className="icr-drow">
      <label className="icr-drow-l">{label}{required && <span className="cfg-required"> *</span>}</label>
      <div className="icr-drow-c">{children}{hint && <span className="icr-drow-hint">{hint}</span>}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
// ─── จำนวนเดือนระหว่างสองวันที่ (ตรวจวันเกษียณผู้ค้ำ) ────────────────────
function icrMonthsBetween(aIso, bIso) {
  const a = new Date(aIso), b = new Date(bIso);
  if (isNaN(a) || isNaN(b)) return Infinity;
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function IcrFormScreen({ onToast, audit }) {
  const today = icrToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [modal, setModal] = useState(false);

  const [changeDate, setChangeDate] = useState(today);
  const [updatedDate, setUpdatedDate] = useState(today);
  const [savedNo, setSavedNo] = useState('');           // เลขที่ออกหลังบันทึก (Auto → CHG-..)

  // รายละเอียดการเปลี่ยนแปลง
  const [debtStatus, setDebtStatus] = useState('normal');
  const [payMethod, setPayMethod] = useState('equal-principal');
  const [terms, setTerms] = useState('');
  const [perInstallment, setPerInstallment] = useState('');
  const [addPrincipalYearly, setAddPrincipalYearly] = useState('');
  const [arrearsPerTerm, setArrearsPerTerm] = useState('');
  const [reqStatus, setReqStatus] = useState('draft');
  const [fromMonth, setFromMonth] = useState(new Date(today).getMonth());
  const [fromYear, setFromYear] = useState(beYear);
  const [meetingNo, setMeetingNo] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [restruct, setRestruct] = useState('none');
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');
  const [graceTerms, setGraceTerms] = useState('');
  const [graceInstallment, setGraceInstallment] = useState('');
  const [suspendNotice, setSuspendNotice] = useState('');
  const [suspendTick, setSuspendTick] = useState(0);

  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');

  const contracts = member ? (member.debts || []) : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const info = contract ? window.icrContractInfo(contract) : null;
  const loaded = !!info;
  const compromise = info ? window.icrCompromise(info.compromise) : null;
  const ds = window.icrDebtStatus(debtStatus);
  const rs = window.icrReqStatus(reqStatus);
  const history = contract ? window.icrHistory(contractNo) : [];

  // ── ค่าที่คำนวณได้สำหรับกฎปรับโครงสร้าง/จัดชั้น/ตัวแทน/ผู้ค้ำ ──
  const restructuring = restruct === 'restructure';
  const isGuarantor = !!info && info.role === 'guarantor';
  const agentBal = member ? window.icrAgentBalance(member.code) : 0;
  const restructCount = contract ? window.icrRestructCount(contractNo) : 0;
  const startIso = `${fromYear - 543}-${String(fromMonth + 1).padStart(2, '0')}-01`;
  const monthsToRetire = (info && info.retireDate) ? icrMonthsBetween(startIso, info.retireDate) : Infinity;
  const _tick = suspendTick; // บังคับ re-read รายการพักชำระหลังยกเลิก
  const activeSuspension = contract ? window.icrActiveSuspension(contractNo) : null;

  // การจัดชั้นลูกหนี้
  const classInfo = (() => {
    if (!info) return null;
    const cur = info.overdueTerms;
    if (restructuring && cur > 0) {
      return { cls: window.icrClassify(info.everOverdue), reason: `ผิดนัดระหว่างปรับโครงสร้าง — จัดชั้นจากงวดผิดนัดสะสมทั้งหมด ${info.everOverdue} งวด`, alert: true };
    }
    if (restructuring) {
      const base = window.icrClassify(cur);
      const watch = window.ICR_CLASS[1];
      const cls = base.min >= watch.min ? base : watch;
      return { cls, reason: 'ปรับโครงสร้างหนี้ — จัดชั้น “กล่าวถึงเป็นพิเศษ” เป็นอย่างน้อย' };
    }
    const base = window.icrClassify(cur);
    return { cls: base, reason: cur > 0 ? `ค้างชำระ ${cur} งวด` : 'ชำระปกติ' };
  })();

  // ตารางชำระหนี้ (amortization)
  const schedule = (info && Number(terms) > 0 && Number(perInstallment) > 0)
    ? window.icrBuildSchedule({
        outstanding: info.outstanding, rate: Number(rate) || info.rate,
        terms: Number(terms), perInstallment: Number(perInstallment),
        graceTerms: Number(graceTerms) || 0, graceInstallment: Number(graceInstallment) || 0,
        startDate: startIso, role: info.role,
      })
    : null;

  const loadContract = (m, debt) => {
    const i = window.icrContractInfo(debt);
    setMember(m); setContractNo(debt.contractNo);
    setDebtStatus(i.debtStatus);
    setPayMethod('equal-principal');
    setTerms(String(i.remainTerms));
    setPerInstallment(String(i.installment));
    setRate(i.rate.toFixed(2));
    setAddPrincipalYearly(''); setArrearsPerTerm('');
    setRestruct('none'); setMeetingNo(''); setMeetingDate('');
    setGraceTerms(''); setGraceInstallment(''); setSuspendNotice('');
    setReqStatus('draft'); setSavedNo('');
    setFromMonth(new Date(today).getMonth()); setFromYear(beYear);
    setNote(window.icrMemberNote(m.code) || '');
    setError(''); setWarn(i.interestArrears > 0 ? `สัญญานี้มีดอกเบี้ยค้างชำระ ${window.fmt.money(i.interestArrears, 2)} บาท — โปรดพิจารณาก่อนอนุมัติ` : '');
  };
  const pickMember = (m) => {
    setModal(false);
    const first = (m.debts || [])[0];
    if (first) loadContract(m, first);
    else { setMember(m); setContractNo(''); setError('สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง'); }
  };
  const pickContract = (no) => {
    const c = contracts.find(d => d.contractNo === no);
    if (c) loadContract(member, c);
  };

  const clearScreen = () => {
    setMember(null); setContractNo(''); setSavedNo('');
    setDebtStatus('normal'); setPayMethod('equal-principal');
    setTerms(''); setPerInstallment(''); setAddPrincipalYearly(''); setArrearsPerTerm('');
    setReqStatus('draft'); setFromMonth(new Date(today).getMonth()); setFromYear(beYear);
    setMeetingNo(''); setMeetingDate(''); setRestruct('none'); setRate(''); setNote('');
    setGraceTerms(''); setGraceInstallment(''); setSuspendNotice('');
    setChangeDate(today); setUpdatedDate(today); setError(''); setWarn('');
  };

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนบันทึก';
    if (!contract) return 'กรุณาเลือกสัญญาเงินกู้ที่ต้องการเปลี่ยนแปลง';
    if (!(info.outstanding > 0)) return 'สัญญาต้องมียอดหนี้คงเหลือมากกว่า 0';
    if (!(Number(perInstallment) > 0)) return 'ยอดชำระต่องวดต้องมากกว่า 0';
    if (!(Number(terms) > 0)) return 'จำนวนงวดต้องมากกว่า 0';
    if (restruct === 'restructure') {
      if (!(Number(rate) > 0)) return 'การปรับโครงสร้างหนี้ ต้องระบุอัตราดอกเบี้ย';
      if (!meetingDate) return 'การปรับโครงสร้างหนี้ ต้องระบุวันที่ประชุม/วันที่เริ่มมีผล';
      if (agentBal > 0) return `สมาชิกมียอดลูกหนี้ตัวแทนคงค้าง ${window.fmt.money(agentBal, 2)} บาท — ต้องจัดการ/ปรับโครงสร้างยอดลูกหนี้ตัวแทนก่อนจึงจะปรับโครงสร้างหนี้สัญญานี้ได้`;
      if (isGuarantor) {
        if (Number(terms) > 60) return 'หนี้ในฐานะผู้ค้ำประกัน ขยายระยะเวลาได้สูงสุด 60 งวด (ระบบจะเก็บเต็มจำนวนคงเหลือในงวดที่ 61)';
        if (Number(terms) > monthsToRetire) return `จำนวนงวดเกินกำหนดเกษียณของผู้ค้ำประกัน — เหลือถึงเกษียณ ${monthsToRetire} งวด`;
      }
    }
    return '';
  };

  const buildPayload = () => ({
    contractNo, memberCode: member.code, memberName: member.name,
    payMethod, debtStatus, terms: Number(terms), perInstallment: Number(perInstallment),
    addPrincipalYearly: Number(addPrincipalYearly) || 0, arrearsPerTerm: Number(arrearsPerTerm) || 0,
    restruct, rate: Number(rate) || 0, reqStatus,
    effective: `${window.ICR_MONTHS[fromMonth]} ${fromYear}`,
  });

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const no = window.icrNextChangeNo(beYear);
    setSavedNo(no); setReqStatus('pending'); setUpdatedDate(today);
    const p = buildPayload();
    // ── ปรับโครงสร้าง → ยกเลิกรายการพักชำระหนี้ของสัญญานี้อัตโนมัติ (เชื่อมเมนูพักชำระหนี้) ──
    let cancelledSus = null;
    if (restruct === 'restructure') cancelledSus = window.icrCancelSuspension(contractNo);
    if (cancelledSus) { setSuspendNotice(`ยกเลิกรายการพักชำระหนี้ ${cancelledSus.id} ของสัญญา ${contractNo} ให้อัตโนมัติแล้ว — จากการปรับโครงสร้างหนี้`); setSuspendTick(t => t + 1); }
    else setSuspendNotice('');
    // ── ส่งรายการไปยังเมนู “อนุมัติใบคำขอ” ──
    const reqId = window.dbaNextReqNo(beYear);
    window.dbaPush && window.dbaPush({
      id: reqId, type: restruct === 'restructure' ? 'restructure' : 'inst-change', docNo: no,
      memberCode: member.code, memberName: member.name, dept: member.dept,
      contractNo, loanType: info.loanType, amount: info.outstanding,
      requestedBy: window.ICR_USER, requestDate: changeDate,
      meetingRef: meetingNo || '', priority: 'normal',
      summary: `${window.icrPayMethod(payMethod).l} · ชำระ/งวด ${window.fmt.money(info.installment, 0)} → ${window.fmt.money(p.perInstallment, 0)} · งวด ${info.remainTerms} → ${p.terms}`,
      fields: [
        { k: 'รูปแบบการชำระ', v: window.icrPayMethod(payMethod).l },
        { k: 'ชำระ/งวดเดิม', v: window.fmt.money(info.installment, 2) + ' บาท' },
        { k: 'ชำระ/งวดใหม่', v: window.fmt.money(p.perInstallment, 2) + ' บาท', hl: true },
        { k: 'งวดชำระเดิม', v: info.remainTerms + ' งวด' },
        { k: 'งวดชำระใหม่', v: p.terms + ' งวด', hl: true },
        ...(restruct === 'restructure' ? [{ k: 'ปรับโครงสร้าง', v: `ดอกเบี้ย ${p.rate}% เริ่ม ${p.effective}${restructCount > 0 ? ` · ครั้งที่ ${restructCount + 1}` : ''}`, hl: true }] : []),
        ...(classInfo ? [{ k: 'การจัดชั้นลูกหนี้', v: classInfo.cls.l }] : []),
        { k: 'หมายเหตุ', v: note || '—' },
      ],
      status: 'pending',
    });
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ใบคำขอเปลี่ยนแปลงยอดชำระหนี้',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกใบคำขอ ${no} · สัญญา ${contractNo} · ${window.icrPayMethod(payMethod).l} · ชำระ/งวด ${window.fmt.money(p.perInstallment, 0)}`,
      changes: [
        { field: 'รูปแบบการชำระ', before: '—', after: window.icrPayMethod(payMethod).l },
        { field: 'ชำระ/งวด', before: window.fmt.money(info.installment, 2), after: window.fmt.money(p.perInstallment, 2) },
        { field: 'งวดชำระ', before: String(info.remainTerms), after: String(p.terms) },
        ...(restruct === 'restructure' ? [{ field: 'ปรับโครงสร้างหนี้', before: 'ไม่ปรับ', after: `ดอกเบี้ย ${p.rate}% เริ่ม ${p.effective}` }] : []),
        ...(classInfo ? [{ field: 'การจัดชั้นลูกหนี้', before: window.icrClassify(info.overdueTerms).l, after: classInfo.cls.l }] : []),
        ...(cancelledSus ? [{ field: 'รายการพักชำระหนี้', before: cancelledSus.id, after: 'ยกเลิกอัตโนมัติ' }] : []),
      ],
    });
    onToast && onToast(`บันทึกใบคำขอ ${no} · ${member.name} — ส่งไปที่เมนูอนุมัติใบคำขอแล้ว${cancelledSus ? ` · ยกเลิกพักชำระ ${cancelledSus.id} อัตโนมัติ` : ''}`);
  };

  const doPrint = () => {
    if (!loaded) { setError('กรุณาเลือกสัญญาก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบคำขอเปลี่ยนแปลงยอดชำระหนี้…');
    setTimeout(() => window.print(), 80);
  };

  const monthYearWidth = { display: 'flex', gap: 8 };

  return (
    <div data-screen-label="ใบคำขอเปลี่ยนแปลงยอดชำระหนี้">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="edit" size={20} /></span>
          <div>
            <h1>ใบคำขอเปลี่ยนแปลงยอดชำระหนี้</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · ปรับยอด/งวดชำระ และปรับโครงสร้างหนี้ของสัญญาเงินกู้</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={clearScreen}><Icon name="plus" size={13} /> เพิ่มใหม่</button>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {warn && !error && (<div className="dn-status-alert warn" style={{ marginBottom: 12 }}><Icon name="info" size={15} /><span>{warn}</span></div>)}

      {/* ── ① ค้นหาข้อมูลสัญญา ── */}
      <div className="search-card icr-sec">
        <IcrSecHead title="ค้นหาข้อมูลสัญญา / ข้อมูลคำขอ" />
        <div className="icr-strip">
          <IcrFld label="เลขที่สัญญา" w={168}>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={contractNo} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </IcrFld>
          <IcrFld label="วันที่สัญญา" w={120}><IcrRO value={info ? window.fmt.date(info.contractDate) : ''} mono /></IcrFld>
          <IcrFld label="ยอดคงเหลือ" w={130}><IcrRO value={info ? window.fmt.money(info.outstanding, 2) : ''} mono num /></IcrFld>
          <IcrFld label="ชำระต่องวด" w={120}><IcrRO value={info ? window.fmt.money(info.installment, 2) : ''} mono num /></IcrFld>
          <IcrFld label="คงเหลือ – งวด" w={104}><IcrRO value={info ? `${info.remainTerms}` : ''} mono num danger /></IcrFld>
          <IcrFld label="สถานะ" w={132}>{info ? <IcrStatusBox pill={ds.pill} label={ds.l} /> : <IcrRO value="" />}</IcrFld>
          <IcrFld label="สถานะประนอมหนี้" w={170}>{compromise ? <IcrStatusBox pill={compromise.pill} label={compromise.l} /> : <IcrRO value="" />}</IcrFld>
          <IcrFld label="เลขที่ขอเปลี่ยน" w={140}><IcrRO value={savedNo} mono placeholder="(Auto)" /></IcrFld>
          <IcrFld label="ผู้ทำรายการ" grow w={150}><IcrRO value={window.ICR_USER} /></IcrFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 16 }}>
          <IcrFld label="เลขที่เปลี่ยนแปลง" w={150}>
            {savedNo ? <IcrRO value={savedNo} mono /> : <div className="icr-ro icr-auto">Auto</div>}
          </IcrFld>
          <IcrFld label="วันที่ขอเปลี่ยนแปลง" w={158}>
            <ErpDate value={changeDate} onChange={(v) => ((e) => setChangeDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </IcrFld>
          <IcrFld label="ผู้ป้อน" w={190}><IcrRO value={window.ICR_USER} /></IcrFld>
          <IcrFld label="เลขทะเบียน" w={150}>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </IcrFld>
          <IcrFld label="ชื่อ-ชื่อสกุล" grow w={220}><IcrRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></IcrFld>
          <IcrFld label="วันที่ปรับปรุง" w={130}><IcrRO value={window.fmt.date(updatedDate)} mono /></IcrFld>
        </div>
      </div>

      {/* ── ③ ข้อมูลสัญญาเงินกู้ ── */}
      <div className="search-card icr-sec">
        <IcrSecHead no="3" title="ข้อมูลสัญญาเงินกู้" />
        <div className="icr-strip">
          <IcrFld label="เลขสัญญา" w={150}>
            <select className="cfg-input mono" value={contractNo} onChange={(e) => pickContract(e.target.value)} disabled={!member || contracts.length === 0}>
              {!member && <option value="">— เลือกสมาชิกก่อน —</option>}
              {member && contracts.length === 0 && <option value="">— ไม่มีสัญญา —</option>}
              {contracts.map(d => <option key={d.contractNo} value={d.contractNo}>{d.contractNo}</option>)}
            </select>
          </IcrFld>
          <IcrFld label="ประเภทเงินกู้" w={140}><IcrRO value={info ? info.loanType : ''} /></IcrFld>
          <IcrFld label="งวดชำระล่าสุด" w={110}><IcrRO value={info ? `${info.paidTerms}` : ''} mono num /></IcrFld>
          <IcrFld label="ยอดอนุมัติ" grow w={140}><IcrRO value={info ? window.fmt.money(info.approvedAmount, 2) : ''} mono num /></IcrFld>
          <IcrFld label="ยอดรอบบิล" grow w={130}><IcrRO value={info ? window.fmt.money(info.billAmount, 2) : ''} mono num /></IcrFld>
          <IcrFld label="ยอดคงเหลือ" grow w={140}><IcrRO value={info ? window.fmt.money(info.outstanding, 2) : ''} mono num /></IcrFld>
          <IcrFld label="ดอกเบี้ยค้าง" grow w={130}><IcrRO value={info ? window.fmt.money(info.interestArrears, 2) : ''} mono num danger={info && info.interestArrears > 0} /></IcrFld>
          <IcrFld label="ฐานะหนี้" w={120}>
            {info ? <span className={'chip ' + (isGuarantor ? 'warning' : 'primary')}>{isGuarantor ? 'ผู้ค้ำประกัน' : 'ผู้กู้'}</span> : <IcrRO value="" />}
          </IcrFld>
          <IcrFld label="จัดชั้นลูกหนี้" grow w={150}>
            {info ? <IcrStatusBox pill={classInfo.cls.pill} label={classInfo.cls.l} /> : <IcrRO value="" />}
          </IcrFld>
        </div>
      </div>

      {/* ── ④ รายละเอียดการเปลี่ยนแปลง ── */}
      <div className="search-card icr-sec">
        <IcrSecHead no="4" title="รายละเอียดการเปลี่ยนแปลง">
          <span className={'pill ' + rs.pill}>{rs.l}</span>
        </IcrSecHead>
        {loaded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {suspendNotice && (
              <div className="dn-status-alert"><Icon name="check" size={15} /><span>{suspendNotice}</span></div>
            )}
            {agentBal > 0 && (
              <div className="dn-status-alert warn"><Icon name="info" size={15} /><span>สมาชิกมี<b>ยอดลูกหนี้ตัวแทนคงค้าง {window.fmt.money(agentBal, 2)} บาท</b> — ต้องจัดการ/ปรับโครงสร้างยอดลูกหนี้ตัวแทนก่อน จึงจะปรับโครงสร้างหนี้สัญญานี้ได้</span></div>
            )}
            {isGuarantor && (
              <div className="dn-status-alert warn"><Icon name="info" size={15} /><span>หนี้ในฐานะ <b>ผู้ค้ำประกัน</b> — ขยายงวดได้สูงสุด <b>60 งวด</b> และไม่เกินวันเกษียณ{Number.isFinite(monthsToRetire) ? ` (เหลือถึงเกษียณ ${monthsToRetire} งวด)` : ''} — ระบบจะ <b>เก็บเต็มจำนวนในงวดที่ 61</b></span></div>
            )}
            {activeSuspension && (
              <div className="dn-status-alert"><Icon name="lock" size={15} /><span>สัญญานี้มีรายการพักชำระหนี้ <b className="mono">{activeSuspension.id}</b> ({window.dsStatus(activeSuspension.status).l}) — เมื่อบันทึก <b>ปรับโครงสร้างหนี้</b> ระบบจะยกเลิกรายการพักชำระให้อัตโนมัติ</span></div>
            )}
            {restructCount > 0 && (
              <div className="dn-status-alert"><Icon name="history" size={15} /><span>สัญญานี้เคย <b>ปรับโครงสร้างมาแล้ว {restructCount} ครั้ง</b> — สามารถปรับโครงสร้างซ้ำได้ (ครั้งที่ {restructCount + 1})</span></div>
            )}
          </div>
        )}
        <div className="icr-detail2">
          {/* ซ้าย */}
          <div className="icr-dcol">
            <IcrRow label="สถานะหนี้">
              <IcrDotSelect value={debtStatus} onChange={setDebtStatus} options={window.ICR_DEBT_STATUS} disabled={!loaded} />
            </IcrRow>
            <IcrRow label="ชำระแบบ">
              <select className="cfg-input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} disabled={!loaded}>
                {window.ICR_PAY_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </IcrRow>
            <IcrRow label="งวดชำระ" required>
              <div className="icr-suffix"><input className="cfg-input mono" type="number" min="1" value={terms} onChange={(e) => setTerms(e.target.value)} disabled={!loaded} placeholder="0" /><span className="icr-suffix-u">งวด</span></div>
            </IcrRow>
            <IcrRow label="ชำระ/งวด" required>
              <div className="icr-suffix"><input className="cfg-input mono" type="number" min="0" value={perInstallment} onChange={(e) => setPerInstallment(e.target.value)} disabled={!loaded} placeholder="0.00" /><span className="icr-suffix-u">บาท</span></div>
            </IcrRow>
            <IcrRow label="เพิ่มต้นปีละ">
              <div className="icr-suffix"><input className="cfg-input mono" type="number" min="0" value={addPrincipalYearly} onChange={(e) => setAddPrincipalYearly(e.target.value)} disabled={!loaded} placeholder="0.00" /><span className="icr-suffix-u">บาท</span></div>
            </IcrRow>
            <IcrRow label="ด/ป ค้าง/งวด">
              <div className="icr-suffix"><input className="cfg-input mono" type="number" min="0" value={arrearsPerTerm} onChange={(e) => setArrearsPerTerm(e.target.value)} disabled={!loaded} placeholder="0.00" /><span className="icr-suffix-u">บาท</span></div>
            </IcrRow>
            <IcrRow label="สถานะ">
              <IcrDotSelect value={reqStatus} onChange={setReqStatus} options={window.ICR_REQ_STATUS} disabled={!loaded} />
            </IcrRow>
          </div>

          {/* ขวา */}
          <div className="icr-dcol">
            <IcrRow label="ตั้งแต่เดือน">
              <div style={monthYearWidth}>
                <select className="cfg-input" value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))} disabled={!loaded} style={{ flex: 1 }}>
                  {window.ICR_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <input className="cfg-input mono" type="number" value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))} disabled={!loaded} style={{ width: 92 }} />
              </div>
            </IcrRow>
            <IcrRow label="อส.คสอ.">
              <input className="cfg-input mono" value={meetingNo} onChange={(e) => setMeetingNo(e.target.value)} disabled={!loaded} placeholder="เช่น 4/2569" />
            </IcrRow>
            <IcrRow label="วันที่ประชุม" required={restruct === 'restructure'}>
              <ErpDate value={meetingDate} onChange={(v) => ((e) => setMeetingDate(e.target.value))({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
            </IcrRow>
            <IcrRow label="ปรับโครงสร้าง">
              <select className={'cfg-input' + (restruct === 'restructure' ? ' icr-restruct-on' : '')} value={restruct} onChange={(e) => setRestruct(e.target.value)} disabled={!loaded}>
                {window.ICR_RESTRUCT.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </IcrRow>
            <IcrRow label="ดอกเบี้ย" required={restruct === 'restructure'}>
              <div className="icr-suffix" style={{ maxWidth: 180 }}><input className="cfg-input mono" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} disabled={!loaded} placeholder="0.00" /><span className="icr-suffix-u">% ต่อปี</span></div>
            </IcrRow>
            {restructuring && (
              <IcrRow label="ลดค่างวด (งวดแรก)" hint="ลดชั่วคราว แล้วผ่อนปกติ">
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="icr-suffix" style={{ maxWidth: 120 }}><input className="cfg-input mono" type="number" min="0" max="60" value={graceTerms} onChange={(e) => setGraceTerms(e.target.value)} disabled={!loaded} placeholder="0" /><span className="icr-suffix-u">งวด</span></div>
                  <div className="icr-suffix" style={{ maxWidth: 180 }}><input className="cfg-input mono" type="number" min="0" value={graceInstallment} onChange={(e) => setGraceInstallment(e.target.value)} disabled={!loaded} placeholder="ค่างวดช่วงลด" /><span className="icr-suffix-u">บาท</span></div>
                </div>
              </IcrRow>
            )}
            <IcrRow label="หมายเหตุ">
              <div className="icr-note-wrap">
                <textarea className="cfg-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={!loaded} maxLength={500}
                          placeholder="บันทึกรายละเอียด/เหตุผลการเปลี่ยนแปลง เช่น เลขมติที่ประชุม เงื่อนไขใหม่" />
                <span className="icr-note-count">{note.length}/500</span>
              </div>
            </IcrRow>
          </div>
        </div>
        {restruct === 'restructure' && (
          <div className="icr-restruct-note"><Icon name="info" size={13} /><span>เลือก “ปรับโครงสร้างหนี้” — ต้องระบุอัตราดอกเบี้ย วันที่ประชุม และเดือนที่เริ่มมีผล ระบบจะเก็บข้อมูลก่อน/หลังปรับโครงสร้างไว้ในประวัติ</span></div>
        )}
      </div>

      {/* ── ตารางชำระหนี้ (amortization) ── */}
      <div className="search-card icr-sec">
        <IcrSecHead title="ตารางชำระหนี้ (ประมาณการ)">
          <span className="muted" style={{ fontSize: 11.5 }}>
            {schedule ? `${schedule.rows.length} งวด${schedule.capped ? ' · จำกัด 60 งวด (ผู้ค้ำ) เก็บเต็มงวดที่ 61' : ''}` : '— ระบุงวด/ค่างวดเพื่อแสดงตาราง —'}
          </span>
        </IcrSecHead>
        <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 64 }}>งวดที่</th>
                <th className="center" style={{ width: 120 }}>วันครบกำหนด</th>
                <th className="num">เงินต้น</th>
                <th className="num">ดอกเบี้ย</th>
                <th className="num">ชำระ/งวด</th>
                <th className="num">คงเหลือ</th>
                <th style={{ width: 130 }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {!schedule ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="calendar" size={22} /></div>ระบุจำนวนงวดและค่างวดเพื่อแสดงตารางชำระหนี้</td></tr>
              ) : schedule.rows.map(r => (
                <tr key={r.term} style={{ background: r.collectFull ? 'rgba(214,77,87,0.08)' : (r.grace ? 'rgba(35,116,80,0.06)' : undefined) }}>
                  <td className="center mono">{r.term}</td>
                  <td className="center mono">{window.fmt.date(r.due)}</td>
                  <td className="num mono">{window.fmt.money(r.principal, 2)}</td>
                  <td className="num mono">{window.fmt.money(r.interest, 2)}</td>
                  <td className="num mono">{window.fmt.money(r.pay, 2)}</td>
                  <td className="num mono">{window.fmt.money(r.balance, 2)}</td>
                  <td>{r.collectFull ? <span className="chip danger">เก็บเต็มจำนวน</span> : (r.grace ? <span className="chip info">ลดค่างวด</span> : '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        {schedule && schedule.term61 && (
          <div className="icr-restruct-note"><Icon name="info" size={13} /><span>หนี้ในฐานะผู้ค้ำประกัน — ขยายครบ 60 งวด และ <b>เก็บเต็มจำนวนคงเหลือในงวดที่ 61</b></span></div>
        )}
      </div>

      {/* ── ⑤ ประวัติการเปลี่ยนแปลง ── */}
      <div className="search-card icr-sec">
        <IcrSecHead no="5" title="ประวัติการเปลี่ยนแปลง">
          <span className="muted" style={{ fontSize: 11.5 }}>{loaded ? `สัญญา ${contractNo}` : '— เลือกสัญญาเพื่อแสดงประวัติ —'}</span>
        </IcrSecHead>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl icr-hist-tbl">
            <thead>
              <tr>
                <th>เลขที่เอกสาร</th>
                <th>รูปแบบ</th>
                <th className="num">ชำระ/งวด (บาท)</th>
                <th className="center">สถานะ</th>
                <th className="num">ด/ป ค้างต่องวด (บาท)</th>
                <th className="num">เพิ่มชำระต้นเงินปีละ (บาท)</th>
                <th className="num">เพิ่มปีละ (บาท)</th>
                <th className="center">วันที่เอกสาร</th>
                <th>ผู้ทำรายการ</th>
                <th className="center" style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                <tr><td colSpan="10" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>เลือกสัญญาเพื่อแสดงประวัติการเปลี่ยนแปลงยอดชำระ</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="10" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>ยังไม่มีประวัติการเปลี่ยนแปลงสำหรับสัญญานี้</td></tr>
              ) : history.map(h => {
                const st = window.icrReqStatus(h.status);
                return (
                  <tr key={h.docNo}>
                    <td className="mono">{h.docNo}</td>
                    <td>{window.icrPayMethod(h.payMethod).l}</td>
                    <td className="num mono">{window.fmt.money(h.perInstallment, 2)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="num mono">{window.fmt.money(h.arrearsPerTerm, 2)}</td>
                    <td className="num mono">{window.fmt.money(h.addPrincipalYearly, 2)}</td>
                    <td className="num mono">{h.addYearly > 0 ? window.fmt.money(h.addYearly, 2) : '–'}</td>
                    <td className="center mono">{window.fmt.date(h.docDate)}</td>
                    <td>{h.by}</td>
                    <td className="center"><button className="btn text sm icr-rowmenu" title="เพิ่มเติม">···</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <div className="icr-hist-foot">
          <span className="muted">{loaded && history.length > 0 ? `แสดง 1 – ${history.length} จาก ${history.length} รายการ` : ''}</span>
          <div className="icr-pager">
            <button className="icr-pg" disabled>«</button>
            <button className="icr-pg" disabled>‹</button>
            <button className="icr-pg active">1</button>
            <button className="icr-pg" disabled>›</button>
            <button className="icr-pg" disabled>»</button>
          </div>
        </div>
      </div>

      {modal && <ContractSearchModal
        onPick={({ member: m, debt }) => { setModal(false); loadContract(m, debt); }}
        onClose={() => setModal(false)} />}
      <IcrTodayBadge />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function InstallmentChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <IcrFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { InstallmentChangePage, IcrFormScreen });
