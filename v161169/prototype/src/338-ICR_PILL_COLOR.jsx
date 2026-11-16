// ════════════════════════════════════════════════════════════════════
//  ใบคำขอเปลี่ยนแปลงยอดชำระหนี้ — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง 5 ส่วน: ① ค้นหาสัญญา ② ข้อมูลคำขอ ③ ข้อมูลสัญญาเงินกู้
//                    ④ รายละเอียดการเปลี่ยนแปลง ⑤ ประวัติการเปลี่ยนแปลง
// ════════════════════════════════════════════════════════════════════

const ICR_PILL_COLOR = {
  ok: 'var(--success)',
  warn: 'var(--warning)',
  bad: 'var(--danger)',
  info: 'var(--info)',
  neutral: 'var(--text-faint, #9aa3ab)',
  primary: 'var(--primary)'
};

// ─── หัวข้อ section พร้อมเลขลำดับ (วงกลมเขียว) ───────────────────────
function IcrSecHead({
  no,
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, title), children && /*#__PURE__*/React.createElement("div", {
    className: "icr-sec-actions"
  }, children));
}

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function IcrFld({
  label,
  w,
  grow,
  required,
  children
}) {
  const style = grow ? {
    flex: '1 1 0',
    minWidth: w || 120
  } : {
    width: w || 130
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, " *")), children);
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function IcrRO({
  value,
  mono,
  num,
  danger,
  placeholder
}) {
  const empty = value === undefined || value === null || value === '';
  return /*#__PURE__*/React.createElement("div", {
    className: 'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')
  }, empty ? placeholder || '—' : value);
}

// ─── ป้ายสถานะแบบกล่อง (ใช้แทน select เมื่ออ่านอย่างเดียว) ──────────
function IcrStatusBox({
  pill,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "icr-statusbox"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-dot",
    style: {
      background: ICR_PILL_COLOR[pill] || ICR_PILL_COLOR.neutral
    }
  }), /*#__PURE__*/React.createElement("span", null, label));
}

// ─── select ที่มีจุดสีสถานะนำหน้า ───────────────────────────────────
function IcrDotSelect({
  value,
  onChange,
  options,
  disabled
}) {
  const cur = options.find(o => o.v === value) || options[0];
  return /*#__PURE__*/React.createElement("div", {
    className: "icr-dotsel"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-dot",
    style: {
      background: ICR_PILL_COLOR[cur ? cur.pill : 'neutral'] || ICR_PILL_COLOR.neutral
    }
  }), /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: value,
    onChange: e => onChange(e.target.value),
    disabled: disabled
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l))));
}

// ─── แถวฟิลด์ใน section รายละเอียด (label ซ้าย + control ขวา) ────────
function IcrRow({
  label,
  required,
  children,
  hint
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      minWidth: 0,
      width: '100%',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, " *")), /*#__PURE__*/React.createElement("div", {
    className: "icr-drow-c",
    style: {
      width: '100%'
    }
  }, children), hint && /*#__PURE__*/React.createElement("span", {
    className: "icr-drow-hint",
    style: {
      marginTop: 4
    }
  }, hint));
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
// ─── จำนวนเดือนระหว่างสองวันที่ (ตรวจวันเกษียณผู้ค้ำ) ────────────────────
function icrMonthsBetween(aIso, bIso) {
  const a = new Date(aIso),
    b = new Date(bIso);
  if (isNaN(a) || isNaN(b)) return Infinity;
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ─── ตัวเลือกของหน้าใบคำขอ (ตามคอมเมนต์ 15/09/69) ─────────────────────
const ICR_WORK_TYPES = [{
  v: 'restructure',
  l: 'ปรับโครงสร้างหนี้'
}, {
  v: 'installment',
  l: 'เปลี่ยนแปลงค่างวด'
}];
const ICR_DEBT_STATUS_OPTS = [{
  v: 'normal',
  l: 'ปกติ',
  pill: 'ok'
}, {
  v: 'compromise',
  l: 'ประนอมหนี้',
  pill: 'info'
}, {
  v: 'acknowledge',
  l: 'รับสภาพหนี้',
  pill: 'warn'
}, {
  v: 'collect-full',
  l: 'เก็บเต็มจำนวน',
  pill: 'bad'
}];
const ICR_PAY_OPTS = [{
  v: 'equal-principal',
  l: 'ต้นเท่ากัน'
}, {
  v: 'equal-installment',
  l: 'ยอดเท่ากัน'
}];
const ICR_COLLECT_STATUS = [{
  v: 'normal',
  l: 'ปกติ',
  pill: 'ok'
}, {
  v: 'stop-all',
  l: 'งดทั้งหมด',
  pill: 'bad'
}, {
  v: 'stop-principal',
  l: 'งดเงินต้น',
  pill: 'warn'
}, {
  v: 'stop-interest',
  l: 'งดดอกเบี้ย',
  pill: 'warn'
}];
const icrPayLabel = v => (ICR_PAY_OPTS.find(o => o.v === v) || ICR_PAY_OPTS[0]).l;
const icrCollectLabel = v => (ICR_COLLECT_STATUS.find(o => o.v === v) || ICR_COLLECT_STATUS[0]).l;
const ICR_RS_PAGE = 5;
// แบ่งหน้า — แบบเดียวกับระบบสินเชื่อ (x-y จาก n รายการ · ‹ 1 › · n / หน้า)
function IcrPager({
  total,
  page,
  pageCount,
  per,
  onPage,
  onPer
}) {
  const from = total ? (page - 1) * per + 1 : 0;
  const to = Math.min(page * per, total);
  return /*#__PURE__*/React.createElement("div", {
    className: "sh-pager",
    style: {
      padding: '12px 0 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, total ? from + '-' + to + ' จาก ' + total + ' รายการ' : '0 รายการ'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "sh-pg",
    disabled: page <= 1,
    onClick: () => onPage(page - 1),
    "aria-label": "หน้าก่อนหน้า"
  }, "\u2039"), Array.from({
    length: Math.max(1, pageCount)
  }, (_, k) => k + 1).map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    type: "button",
    className: 'sh-pg' + (p === page ? ' on' : ''),
    "aria-current": p === page ? 'page' : undefined,
    onClick: () => onPage(p)
  }, p)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "sh-pg",
    disabled: page >= pageCount,
    onClick: () => onPage(page + 1),
    "aria-label": "หน้าถัดไป"
  }, "\u203A"), /*#__PURE__*/React.createElement("select", {
    className: "sh-per",
    value: per,
    "aria-label": "จำนวนต่อหน้า",
    onChange: e => onPer(Number(e.target.value))
  }, [20, 50, 100].map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n, " / หน้า")))));
}
function IcrFormScreen({
  onToast,
  audit,
  title,
  subtitle,
  pcxLink
}) {
  const today = icrToday();
  const beYear = new Date(today).getFullYear() + 543;
  const [workType, setWorkType] = useState('');
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState('schedule');
  const [collectStatus, setCollectStatus] = useState('normal');
  const [rsRows, setRsRows] = useState([]);
  const [rsPage, setRsPage] = useState(1);
  const [rsPer, setRsPer] = useState(20);
  const [editDoc, setEditDoc] = useState('');
  const [returnInfo, setReturnInfo] = useState(null);
  const loadReturned = () => (pcxLink && window.pcxIcLoad ? window.pcxIcLoad() : []).filter(r => r.returned);
  const [returnedList, setReturnedList] = useState(loadReturned);
  const [changeDate, setChangeDate] = useState(today);
  const [updatedDate, setUpdatedDate] = useState(today);
  const [savedNo, setSavedNo] = useState(''); // เลขที่ออกหลังบันทึก (Auto → CHG-..)

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
  const [rate, setRate] = useState('');
  const [note, setNote] = useState('');
  const [graceTerms, setGraceTerms] = useState('');
  const [graceInstallment, setGraceInstallment] = useState('');
  const [suspendNotice, setSuspendNotice] = useState('');
  const [suspendTick, setSuspendTick] = useState(0);
  const [pcEditing, setPcEditing] = React.useState(false);
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const contracts = member ? member.debts || [] : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const info = contract ? window.icrContractInfo(contract) : null;
  const loaded = !!info;
  const compromise = info ? window.icrCompromise(info.compromise) : null;
  const ds = info ? window.icrDebtStatus(info.debtStatus) : null; // สถานะสัญญาปัจจุบัน
  const restruct = workType === 'restructure' ? 'restructure' : 'none';
  const rs = window.icrReqStatus(reqStatus);
  const history = contract ? window.icrHistory(contractNo) : [];

  // ── ค่าที่คำนวณได้สำหรับกฎปรับโครงสร้าง/จัดชั้น/ตัวแทน/ผู้ค้ำ ──
  const restructuring = restruct === 'restructure';
  const isGuarantor = !!info && info.role === 'guarantor';
  const agentBal = member ? window.icrAgentBalance(member.code) : 0;
  const restructCount = contract ? window.icrRestructCount(contractNo) : 0;
  const startIso = `${fromYear - 543}-${String(fromMonth + 1).padStart(2, '0')}-01`;
  const monthsToRetire = info && info.retireDate ? icrMonthsBetween(startIso, info.retireDate) : Infinity;
  const _tick = suspendTick; // บังคับ re-read รายการพักชำระหลังยกเลิก
  const activeSuspension = contract ? window.icrActiveSuspension(contractNo) : null;

  // การจัดชั้นลูกหนี้
  const classInfo = (() => {
    if (!info) return null;
    const cur = info.overdueTerms;
    if (restructuring && cur > 0) {
      return {
        cls: window.icrClassify(info.everOverdue),
        reason: `ผิดนัดระหว่างปรับโครงสร้าง — จัดชั้นจากงวดผิดนัดสะสมทั้งหมด ${info.everOverdue} งวด`,
        alert: true
      };
    }
    if (restructuring) {
      const base = window.icrClassify(cur);
      const watch = window.ICR_CLASS[1];
      const cls = base.min >= watch.min ? base : watch;
      return {
        cls,
        reason: 'ปรับโครงสร้างหนี้ — จัดชั้น “กล่าวถึงเป็นพิเศษ” เป็นอย่างน้อย'
      };
    }
    const base = window.icrClassify(cur);
    return {
      cls: base,
      reason: cur > 0 ? `ค้างชำระ ${cur} งวด` : 'ชำระปกติ'
    };
  })();

  // ตารางชำระหนี้ (amortization)
  const schedule = info && Number(terms) > 0 && Number(perInstallment) > 0 ? window.icrBuildSchedule({
    outstanding: info.outstanding,
    rate: Number(rate) || info.rate,
    terms: Number(terms),
    perInstallment: Number(perInstallment),
    graceTerms: Number(graceTerms) || 0,
    graceInstallment: Number(graceInstallment) || 0,
    startDate: startIso,
    role: info.role
  }) : null;
  const loadContract = (m, debt) => {
    const i = window.icrContractInfo(debt);
    setMember(m);
    setContractNo(debt.contractNo);
    setDebtStatus(ICR_DEBT_STATUS_OPTS.some(o => o.v === i.debtStatus) ? i.debtStatus : 'normal');
    setPayMethod('equal-principal');
    setCollectStatus('normal');
    setRsRows([]);
    setRsPage(1);
    setEditDoc('');
    setReturnInfo(null);
    setTerms(String(i.remainTerms));
    setPerInstallment(String(i.installment));
    setRate(i.rate.toFixed(2));
    setAddPrincipalYearly('');
    setArrearsPerTerm('');
    setMeetingNo('');
    setMeetingDate('');
    setGraceTerms('');
    setGraceInstallment('');
    setSuspendNotice('');
    setReqStatus('draft');
    setSavedNo('');
    setFromMonth(new Date(today).getMonth());
    setFromYear(beYear);
    setNote(window.icrMemberNote(m.code) || '');
    setError('');
    setWarn(i.interestArrears > 0 ? `สัญญานี้มีดอกเบี้ยค้างชำระ ${window.fmt.money(i.interestArrears, 2)} บาท — โปรดพิจารณาก่อนอนุมัติ` : '');
  };
  const pickMember = m => {
    setModal(false);
    const first = (m.debts || [])[0];
    if (first) loadContract(m, first);else {
      setMember(m);
      setContractNo('');
      setError('สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง');
    }
  };
  const pickContract = no => {
    const c = contracts.find(d => d.contractNo === no);
    if (c) loadContract(member, c);
  };
  const clearScreen = () => {
    setWorkType('');
    setCollectStatus('normal');
    setRsRows([]);
    setRsPage(1);
    setEditDoc('');
    setReturnInfo(null);
    setMember(null);
    setContractNo('');
    setSavedNo('');
    setDebtStatus('normal');
    setPayMethod('equal-principal');
    setTerms('');
    setPerInstallment('');
    setAddPrincipalYearly('');
    setArrearsPerTerm('');
    setReqStatus('draft');
    setFromMonth(new Date(today).getMonth());
    setFromYear(beYear);
    setMeetingNo('');
    setMeetingDate('');
    setRate('');
    setNote('');
    setGraceTerms('');
    setGraceInstallment('');
    setSuspendNotice('');
    setChangeDate(today);
    setUpdatedDate(today);
    setError('');
    setWarn('');
  };
  const openSearch = () => {
    if (!workType) {
      setError('กรุณาเลือกประเภทงานก่อนค้นหาสัญญา');
      return;
    }
    setError('');
    setModal(true);
  };
  // เปิดใบคำขอที่ถูกส่งกลับจากหน้าอนุมัติ (ที่เก็บเดียวกับหน้าอนุมัติเปลี่ยนแปลงงวดชำระ)
  const openReturned = r => {
    const m = (window.DN_MEMBERS || []).find(x => x.code === r.reg);
    const debt = m && (m.debts || []).find(d => d.contractNo === r.contract);
    if (!debt) {
      setError('ไม่พบเลขสมาชิก ' + r.reg + ' / สัญญา ' + r.contract + ' ในข้อมูลสมาชิก จึงเปิดแก้ไขไม่ได้');
      return;
    }
    const fm = r.form || {};
    setWorkType(fm.workType || 'installment');
    loadContract(m, debt);
    if (fm.debtStatus) setDebtStatus(fm.debtStatus);
    if (fm.payMethod) setPayMethod(fm.payMethod);
    if (fm.terms != null) setTerms(String(fm.terms));
    if (fm.perInstallment != null) setPerInstallment(String(fm.perInstallment));
    setAddPrincipalYearly(fm.addPrincipalYearly || '');
    setArrearsPerTerm(fm.arrearsPerTerm || '');
    if (fm.collectStatus) setCollectStatus(fm.collectStatus);
    if (fm.fromMonth != null) setFromMonth(fm.fromMonth);
    if (fm.fromYear) setFromYear(fm.fromYear);
    setMeetingNo(fm.meetingNo || '');
    setMeetingDate(fm.meetingDate || '');
    if (fm.rate) setRate(fm.rate);
    setNote(fm.note || '');
    setRsRows(fm.rsRows || []);
    if (r.date) setChangeDate(r.date);
    setEditDoc(r.doc);
    setSavedNo(r.doc);
    setReturnInfo(r);
  };

  // ── ตารางการผ่อนชำระหนี้ สัญญาปรับโครงสร้างหนี้ ──
  const rsPageCount = Math.max(1, Math.ceil(rsRows.length / rsPer));
  const rsCur = Math.min(rsPage, rsPageCount);
  const rsShown = rsRows.slice((rsCur - 1) * rsPer, rsCur * rsPer);
  const rsAdd = () => {
    const last = rsRows[rsRows.length - 1];
    const from = last ? (Number(last.to) || 0) + 1 : 1;
    const next = [...rsRows, {
      id: Date.now() + '-' + rsRows.length,
      from: String(from),
      to: '',
      pay: '',
      arrears: '',
      date: today
    }];
    setRsRows(next);
    setRsPage(Math.ceil(next.length / rsPer));
  };
  const rsUpd = (id, patch) => setRsRows(rs => rs.map(r => r.id === id ? {
    ...r,
    ...patch
  } : r));
  const rsDel = id => setRsRows(rs => rs.filter(r => r.id !== id));
  const validate = () => {
    if (!workType) return 'กรุณาเลือกประเภทงานก่อนทำรายการ';
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
    contractNo,
    memberCode: member.code,
    memberName: member.name,
    payMethod,
    debtStatus,
    terms: Number(terms),
    perInstallment: Number(perInstallment),
    addPrincipalYearly: Number(addPrincipalYearly) || 0,
    arrearsPerTerm: Number(arrearsPerTerm) || 0,
    restruct,
    workType,
    collectStatus,
    rate: Number(rate) || 0,
    reqStatus,
    effective: `${window.ICR_MONTHS[fromMonth]} ${fromYear}`
  });
  const doSave = () => {
    const err = validate();
    if (err) {
      setError(err);
      return false;
    }
    setError('');
    const no = editDoc || (pcxLink ? 'CHG-' + String(beYear).slice(-2) + '-' + String(Math.floor(Math.random() * 9000) + 1000) : window.icrNextChangeNo(beYear));
    setSavedNo(no);
    setReqStatus('pending');
    setUpdatedDate(today);
    const p = buildPayload();
    // ── ปรับโครงสร้าง → ยกเลิกรายการพักชำระหนี้ของสัญญานี้อัตโนมัติ (เชื่อมเมนูพักชำระหนี้) ──
    let cancelledSus = null;
    if (restruct === 'restructure') cancelledSus = window.icrCancelSuspension(contractNo);
    if (cancelledSus) {
      setSuspendNotice(`ยกเลิกรายการพักชำระหนี้ ${cancelledSus.id} ของสัญญา ${contractNo} ให้อัตโนมัติแล้ว — จากการปรับโครงสร้างหนี้`);
      setSuspendTick(t => t + 1);
    } else setSuspendNotice('');
    // ── ประมวลผลฯ: ส่งเข้า "อนุมัติเปลี่ยนแปลงงวดชำระ" (ที่เก็บเดียวกับหน้าอนุมัติ) ──
    if (pcxLink && window.pcxIcLoad && window.pcxIcSave) {
      const rec = {
        doc: no,
        contract: contractNo,
        reg: member.code,
        date: changeDate,
        om: '—',
        op: Number(info.installment) || 0,
        os: '—',
        nm: icrPayLabel(payMethod),
        np: Number(perInstallment) || 0,
        ns: icrCollectLabel(collectStatus),
        by: window.ICR_USER,
        status: 'รออนุมัติ',
        decision: 'wait',
        disposition: '',
        reason: '',
        decidedBy: '',
        decidedAt: '',
        returned: false,
        returnReason: '',
        form: {
          workType,
          debtStatus,
          payMethod,
          terms,
          perInstallment,
          addPrincipalYearly,
          arrearsPerTerm,
          collectStatus,
          fromMonth,
          fromYear,
          meetingNo,
          meetingDate,
          rate,
          note,
          rsRows
        }
      };
      const list = window.pcxIcLoad();
      const idx = list.findIndex(x => x.doc === no);
      window.pcxIcSave(idx >= 0 ? list.map((x, k) => k === idx ? {
        ...x,
        ...rec
      } : x) : [rec, ...list]);
      setReturnedList(loadReturned());
    }
    setEditDoc('');
    setReturnInfo(null);
    // ── ส่งรายการไปยังเมนู “อนุมัติใบคำขอ” ──
    const reqId = window.dbaNextReqNo(beYear);
    window.dbaPush && window.dbaPush({
      id: reqId,
      type: restruct === 'restructure' ? 'restructure' : 'inst-change',
      docNo: no,
      memberCode: member.code,
      memberName: member.name,
      dept: member.dept,
      contractNo,
      loanType: info.loanType,
      amount: info.outstanding,
      requestedBy: window.ICR_USER,
      requestDate: changeDate,
      meetingRef: meetingNo || '',
      priority: 'normal',
      summary: `${icrPayLabel(payMethod)} · ชำระ/งวด ${window.fmt.money(info.installment, 0)} → ${window.fmt.money(p.perInstallment, 0)} · งวด ${info.remainTerms} → ${p.terms}`,
      fields: [{
        k: 'รูปแบบการชำระ',
        v: icrPayLabel(payMethod)
      }, {
        k: 'ชำระ/งวดเดิม',
        v: window.fmt.money(info.installment, 2) + ' บาท'
      }, {
        k: 'ชำระ/งวดใหม่',
        v: window.fmt.money(p.perInstallment, 2) + ' บาท',
        hl: true
      }, {
        k: 'งวดชำระเดิม',
        v: info.remainTerms + ' งวด'
      }, {
        k: 'งวดชำระใหม่',
        v: p.terms + ' งวด',
        hl: true
      }, ...(restruct === 'restructure' ? [{
        k: 'ปรับโครงสร้าง',
        v: `ดอกเบี้ย ${p.rate}% เริ่ม ${p.effective}${restructCount > 0 ? ` · ครั้งที่ ${restructCount + 1}` : ''}`,
        hl: true
      }] : []), ...(classInfo ? [{
        k: 'การจัดชั้นลูกหนี้',
        v: classInfo.cls.l
      }] : []), {
        k: 'หมายเหตุ',
        v: note || '—'
      }],
      status: 'pending'
    });
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ทะเบียนและติดตามหนี้ — ใบคำขอเปลี่ยนแปลงยอดชำระหนี้',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกใบคำขอ ${no} · สัญญา ${contractNo} · ${icrPayLabel(payMethod)} · ชำระ/งวด ${window.fmt.money(p.perInstallment, 0)}`,
      changes: [{
        field: 'รูปแบบการชำระ',
        before: '—',
        after: icrPayLabel(payMethod)
      }, {
        field: 'ชำระ/งวด',
        before: window.fmt.money(info.installment, 2),
        after: window.fmt.money(p.perInstallment, 2)
      }, {
        field: 'งวดชำระ',
        before: String(info.remainTerms),
        after: String(p.terms)
      }, ...(restruct === 'restructure' ? [{
        field: 'ปรับโครงสร้างหนี้',
        before: 'ไม่ปรับ',
        after: `ดอกเบี้ย ${p.rate}% เริ่ม ${p.effective}`
      }] : []), ...(classInfo ? [{
        field: 'การจัดชั้นลูกหนี้',
        before: window.icrClassify(info.overdueTerms).l,
        after: classInfo.cls.l
      }] : []), ...(cancelledSus ? [{
        field: 'รายการพักชำระหนี้',
        before: cancelledSus.id,
        after: 'ยกเลิกอัตโนมัติ'
      }] : [])]
    });
    onToast && onToast(`บันทึกใบคำขอ ${no} · ${member.name} — ส่งไปที่เมนูอนุมัติใบคำขอแล้ว${cancelledSus ? ` · ยกเลิกพักชำระ ${cancelledSus.id} อัตโนมัติ` : ''}`);
    return true;
  };
  const doPrint = () => {
    if (!loaded) {
      setError('กรุณาเลือกสัญญาก่อนพิมพ์');
      return;
    }
    onToast && onToast('กำลังเตรียมพิมพ์ใบคำขอเปลี่ยนแปลงยอดชำระหนี้…');
    setTimeout(() => window.print(), 80);
  };
  const monthYearWidth = {
    display: 'flex',
    gap: 8
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ใบคำขอเปลี่ยนแปลงยอดชำระหนี้",
    className: pcEditing ? undefined : 'pc-locked'
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-form-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title || 'ใบคำขอเปลี่ยนแปลงยอดชำระหนี้'), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle || 'ระบบงานทะเบียนและติดตามหนี้ · ปรับยอด/งวดชำระ และปรับโครงสร้างหนี้ของสัญญาเงินกู้'))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, /*#__PURE__*/React.createElement(window.PcEditActions, {
      recordKey: member && contractNo ? 'icr.' + contractNo : '',
      editing: pcEditing,
      setEditing: setPcEditing,
      onSave: doSave,
      onDiscard: () => { const d = (member.debts || []).find(x => x.contractNo === contractNo); d && loadContract(member, d); },
      title: title || "ใบคำขอเปลี่ยนแปลงงวดชำระ"
    }))), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), warn && !error && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, warn)), pcxLink && returnInfo && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "กำลังแก้ไขใบคำขอ ", /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, returnInfo.doc), " ที่ถูกส่งกลับ \xB7 เหตุผลที่ส่งกลับ: ", returnInfo.returnReason || '—', returnInfo.decidedBy ? ' (' + returnInfo.decidedBy + ' · ' + returnInfo.decidedAt + ')' : '')), pcxLink && !returnInfo && returnedList.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement(IcrSecHead, {
    title: 'ใบคำขอที่ถูกส่งกลับให้แก้ไข (' + returnedList.length + ')'
  }), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 820
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "เลขที่เอกสาร"), /*#__PURE__*/React.createElement("th", null, "สัญญา"), /*#__PURE__*/React.createElement("th", null, "เลขสมาชิก"), /*#__PURE__*/React.createElement("th", null, "เหตุผลที่ส่งกลับ"), /*#__PURE__*/React.createElement("th", null, "ผู้พิจารณา"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, returnedList.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.doc
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.doc), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.contract), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.reg), /*#__PURE__*/React.createElement("td", null, r.returnReason || '—'), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, r.decidedBy, r.decidedAt ? ' · ' + r.decidedAt : ''), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => openReturned(r)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 12
  }), " เปิดแก้ไข"))))))))), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement(IcrSecHead, {
    title: "ค้นหาข้อมูลสัญญา / ข้อมูลคำขอ"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pc-grid7"
  }, /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขที่เปลี่ยนแปลง"
  }, savedNo ? /*#__PURE__*/React.createElement(IcrRO, {
    value: savedNo,
    mono: true
  }) : /*#__PURE__*/React.createElement("div", {
    className: "icr-ro icr-auto"
  }, "AUTO")), /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขสมาชิก / เลขที่สัญญา",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
  }, /*#__PURE__*/React.createElement(CcdContractPicker, {
    contractNo: contractNo,
    member: member,
    onContract: loadContract,
    onMember: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสัญญาเงินกู้ \u2014 ใบคำขอเปลี่ยนแปลงงวดชำระ",
    placeholder: "เลขสมาชิก  หรือเลขที่สัญญา\u2026"
  }))), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชื่อ-ชื่อสกุล"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: member ? member.name : '',
    placeholder: "(ดึงอัตโนมัติ)"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ประเภทงานที่ทำรายการ",
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: workType,
    onChange: e => {
      setWorkType(e.target.value);
      setError('');
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 เลือกประเภทงาน \u2014"), ICR_WORK_TYPES.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l)))), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่ขอเปลี่ยนแปลง"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: changeDate,
    onChange: e => setChangeDate(e.target.value)
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่สัญญา"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? window.fmt.date(info.contractDate) : '',
    mono: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ประเภทเงินกู้"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? info.loanType : ''
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ยอดอนุมัติ"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? window.fmt.money(info.approvedAmount, 2) : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ยอดคงเหลือ"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? window.fmt.money(info.outstanding, 2) : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชำระต่องวด"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? window.fmt.money(info.installment, 2) : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "คงเหลือ \u2013 งวด"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? `${info.remainTerms}` : '',
    mono: true,
    num: true,
    danger: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "งวดชำระล่าสุด"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? `${info.paidTerms}` : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ดอกเบี้ยค้าง"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: info ? window.fmt.money(info.interestArrears, 2) : '',
    mono: true,
    num: true,
    danger: info && info.interestArrears > 0
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "สถานะ"
  }, info ? /*#__PURE__*/React.createElement(IcrStatusBox, {
    pill: ds.pill,
    label: ds.l
  }) : /*#__PURE__*/React.createElement(IcrRO, {
    value: ""
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "สถานะประนอมหนี้"
  }, compromise ? /*#__PURE__*/React.createElement(IcrStatusBox, {
    pill: compromise.pill,
    label: compromise.l
  }) : /*#__PURE__*/React.createElement(IcrRO, {
    value: ""
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ฐานะหนี้"
  }, info ? /*#__PURE__*/React.createElement("span", {
    className: 'chip ' + (isGuarantor ? 'warning' : 'primary'),
    style: {
      alignSelf: 'flex-start',
      marginTop: 6
    }
  }, isGuarantor ? 'ผู้ค้ำประกัน' : 'ผู้กู้') : /*#__PURE__*/React.createElement(IcrRO, {
    value: ""
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "จัดชั้นลูกหนี้"
  }, info ? /*#__PURE__*/React.createElement(IcrStatusBox, {
    pill: classInfo.cls.pill,
    label: classInfo.cls.l
  }) : /*#__PURE__*/React.createElement(IcrRO, {
    value: ""
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่ปรับปรุง"
  }, /*#__PURE__*/React.createElement(IcrRO, {
    value: window.fmt.date(updatedDate),
    mono: true
  })))), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement(IcrSecHead, {
    no: "4",
    title: "รายละเอียดการเปลี่ยนแปลง"
  }, /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + rs.pill
  }, rs.l)), loaded && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginBottom: 14
    }
  }, suspendNotice && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, suspendNotice)), agentBal > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "สมาชิกมี", /*#__PURE__*/React.createElement("b", null, "ยอดลูกหนี้ตัวแทนคงค้าง ", window.fmt.money(agentBal, 2), " บาท"), " \u2014 ต้องจัดการ/ปรับโครงสร้างยอดลูกหนี้ตัวแทนก่อน จึงจะปรับโครงสร้างหนี้สัญญานี้ได้")), isGuarantor && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "หนี้ในฐานะ ", /*#__PURE__*/React.createElement("b", null, "ผู้ค้ำประกัน"), " \u2014 ขยายงวดได้สูงสุด ", /*#__PURE__*/React.createElement("b", null, "60 งวด"), " และไม่เกินวันเกษียณ", Number.isFinite(monthsToRetire) ? ` (เหลือถึงเกษียณ ${monthsToRetire} งวด)` : '', " \u2014 ระบบจะ ", /*#__PURE__*/React.createElement("b", null, "เก็บเต็มจำนวนในงวดที่ 61"))), activeSuspension && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "สัญญานี้มีรายการพักชำระหนี้ ", /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, activeSuspension.id), " (", window.dsStatus(activeSuspension.status).l, ") \u2014 เมื่อบันทึก ", /*#__PURE__*/React.createElement("b", null, "ปรับโครงสร้างหนี้"), " ระบบจะยกเลิกรายการพักชำระให้อัตโนมัติ")), restructCount > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "history",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "สัญญานี้เคย ", /*#__PURE__*/React.createElement("b", null, "ปรับโครงสร้างมาแล้ว ", restructCount, " ครั้ง"), " \u2014 สามารถปรับโครงสร้างซ้ำได้ (ครั้งที่ ", restructCount + 1, ")"))), /*#__PURE__*/React.createElement("div", {
    className: "icr-detail2",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
      columnGap: 14,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-dcol",
    style: {
      display: 'contents'
    }
  }, /*#__PURE__*/React.createElement(IcrRow, {
    label: "สถานะหนี้"
  }, /*#__PURE__*/React.createElement(IcrDotSelect, {
    value: debtStatus,
    onChange: setDebtStatus,
    options: ICR_DEBT_STATUS_OPTS,
    disabled: !loaded
  })), /*#__PURE__*/React.createElement(IcrRow, {
    label: "ชำระแบบ"
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: payMethod,
    onChange: e => setPayMethod(e.target.value),
    disabled: !loaded
  }, ICR_PAY_OPTS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m.v,
    value: m.v
  }, m.l)))), /*#__PURE__*/React.createElement(IcrRow, {
    label: "งวดชำระ",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "1",
    value: terms,
    onChange: e => setTerms(e.target.value),
    disabled: !loaded,
    placeholder: "0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "งวด"))), /*#__PURE__*/React.createElement(IcrRow, {
    label: "ชำระ/งวด",
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    value: perInstallment,
    onChange: e => setPerInstallment(e.target.value),
    disabled: !loaded,
    placeholder: "0.00"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "บาท"))), /*#__PURE__*/React.createElement(IcrRow, {
    label: "เพิ่มต้นปีละ"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    value: addPrincipalYearly,
    onChange: e => setAddPrincipalYearly(e.target.value),
    disabled: !loaded,
    placeholder: "0.00"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "บาท"))), /*#__PURE__*/React.createElement(IcrRow, {
    label: "ด/ป ค้าง/งวด"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    value: arrearsPerTerm,
    onChange: e => setArrearsPerTerm(e.target.value),
    disabled: !loaded,
    placeholder: "0.00"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "บาท"))), /*#__PURE__*/React.createElement(IcrRow, {
    label: "สถานะ"
  }, /*#__PURE__*/React.createElement(IcrDotSelect, {
    value: collectStatus,
    onChange: setCollectStatus,
    options: ICR_COLLECT_STATUS,
    disabled: !loaded
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-dcol",
    style: {
      display: 'contents'
    }
  }, /*#__PURE__*/React.createElement(IcrRow, {
    label: "ตั้งแต่เดือน"
  }, /*#__PURE__*/React.createElement("div", {
    style: monthYearWidth
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: fromMonth,
    onChange: e => setFromMonth(Number(e.target.value)),
    disabled: !loaded,
    style: {
      flex: 1
    }
  }, window.ICR_MONTHS.map((m, i) => /*#__PURE__*/React.createElement("option", {
    key: i,
    value: i
  }, m))), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    value: fromYear,
    onChange: e => setFromYear(Number(e.target.value)),
    disabled: !loaded,
    style: {
      width: 92
    }
  }))), /*#__PURE__*/React.createElement(IcrRow, {
    label: "อส.คสอ."
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    value: meetingNo,
    onChange: e => setMeetingNo(e.target.value),
    disabled: !loaded,
    placeholder: "เช่น 4/2569"
  })), /*#__PURE__*/React.createElement(IcrRow, {
    label: "วันที่ประชุม",
    required: restruct === 'restructure'
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: meetingDate,
    onChange: e => setMeetingDate(e.target.value),
    disabled: !loaded
  })), /*#__PURE__*/React.createElement(IcrRow, {
    label: "ดอกเบี้ย",
    required: restruct === 'restructure'
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix",
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    step: "0.01",
    min: "0",
    value: rate,
    onChange: e => setRate(e.target.value),
    disabled: !loaded,
    placeholder: "0.00"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "% ต่อปี"))), restructuring && /*#__PURE__*/React.createElement(IcrRow, {
    label: "ลดค่างวด (งวดแรก)",
    hint: "ลดชั่วคราว แล้วผ่อนปกติ"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix",
    style: {
      maxWidth: 120
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    max: "60",
    value: graceTerms,
    onChange: e => setGraceTerms(e.target.value),
    disabled: !loaded,
    placeholder: "0"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "งวด")), /*#__PURE__*/React.createElement("div", {
    className: "icr-suffix",
    style: {
      maxWidth: 180
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    value: graceInstallment,
    onChange: e => setGraceInstallment(e.target.value),
    disabled: !loaded,
    placeholder: "ค่างวดช่วงลด"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-suffix-u"
  }, "บาท")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "icr-drow-l",
    style: {
      display: 'block',
      marginBottom: 6
    }
  }, "หมายเหตุ"), /*#__PURE__*/React.createElement("div", {
    className: "icr-note-wrap"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 7,
    style: {
      minHeight: 150,
      resize: 'vertical'
    },
    value: note,
    onChange: e => setNote(e.target.value),
    disabled: !loaded,
    maxLength: 500,
    placeholder: "บันทึกรายละเอียด/เหตุผลการเปลี่ยนแปลง เช่น เลขมติที่ประชุม เงื่อนไขใหม่"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-note-count"
  }, note.length, "/500"))), restructuring && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontSize: 13
    }
  }, "ตารางการผ่อนชำระหนี้ สัญญาปรับโครงสร้างหนี้"), /*#__PURE__*/React.createElement("span", {
    className: "spacer",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: rsAdd,
    disabled: !loaded
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 12
  }), " เพิ่มแถว")), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 760
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 60
    }
  }, "ลำดับ"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 110
    }
  }, "ตั้งแต่งวด"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 110
    }
  }, "ถึงงวด"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      width: 150
    }
  }, "ชำระต่องวด"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      width: 160
    }
  }, "ผ่อนดอกเบี้ยค้าง"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 120
    }
  }, "วันที่ป้อน"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 54
    }
  }, "ลบ"))), /*#__PURE__*/React.createElement("tbody", null, rsShown.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "7",
    className: "empty-state"
  }, "ยังไม่มีรายการ \u2014 กด \u201Cเพิ่มแถว\u201D เพื่อกำหนดช่วงงวดการผ่อนชำระ")) : rsShown.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, (rsCur - 1) * rsPer + i + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm mono",
    type: "number",
    min: "1",
    style: {
      textAlign: 'center'
    },
    value: r.from,
    onChange: e => rsUpd(r.id, {
      from: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm mono",
    type: "number",
    min: "1",
    style: {
      textAlign: 'center'
    },
    value: r.to,
    onChange: e => rsUpd(r.id, {
      to: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm mono",
    type: "number",
    min: "0",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.pay,
    placeholder: "0.00",
    onChange: e => rsUpd(r.id, {
      pay: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm mono",
    type: "number",
    min: "0",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.arrears,
    placeholder: "0.00",
    onChange: e => rsUpd(r.id, {
      arrears: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, window.fmt.date(r.date)), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-del",
    "aria-label": "ลบ",
    title: "ลบแถว",
    onClick: () => rsDel(r.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  }))))))))), /*#__PURE__*/React.createElement(IcrPager, {
    total: rsRows.length,
    page: rsCur,
    pageCount: rsPageCount,
    per: rsPer,
    onPage: setRsPage,
    onPer: n => {
      setRsPer(n);
      setRsPage(1);
    }
  })), restruct === 'restructure' && /*#__PURE__*/React.createElement("div", {
    className: "icr-restruct-note"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, "ประเภทงาน \u201Cปรับโครงสร้างหนี้\u201D \u2014 ต้องระบุอัตราดอกเบี้ย วันที่ประชุม และเดือนที่เริ่มมีผล ระบบจะเก็บข้อมูลก่อน/หลังปรับโครงสร้างไว้ในประวัติ"))), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      margin: '-4px -16px 12px',
      padding: '0 16px',
      borderBottom: '1px solid var(--border-light, #f0f0f0)'
    }
  }, ['schedule', 'history'].map(id => ((id, label, count) => {
    const on = tab === id;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      type: "button",
      role: "tab",
      "aria-selected": on,
      onClick: () => setTab(id),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 42,
        padding: '0 2px',
        border: 'none',
        background: 'transparent',
        fontFamily: 'inherit',
        fontSize: 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        borderBottom: '2px solid ' + (on ? '#237450' : 'transparent'),
        color: on ? '#237450' : 'rgba(0,0,0,.65)',
        fontWeight: on ? 600 : 400
      }
    }, label, count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 20,
        height: 18,
        padding: '0 6px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        background: on ? '#eafef2' : '#f5f5f5',
        color: on ? '#237450' : 'rgba(0,0,0,.55)'
      }
    }, count));
  })(id, id === 'schedule' ? 'ตารางชำระหนี้ (ประมาณการ)' : 'ประวัติการเปลี่ยนแปลง', id === 'schedule' ? schedule ? schedule.rows.length : null : loaded ? history.length : null)), /*#__PURE__*/React.createElement("span", {
    className: "spacer",
    style: {
      flex: 1
    }
  }), tab === 'schedule' ? /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, schedule ? `${schedule.rows.length} งวด${schedule.capped ? ' · จำกัด 60 งวด (ผู้ค้ำ) เก็บเต็มงวดที่ 61' : ''}` : '— ระบุงวด/ค่างวดเพื่อแสดงตาราง —') : /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, loaded ? `สัญญา ${contractNo}` : '— เลือกสัญญาเพื่อแสดงประวัติ —')), tab === 'schedule' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll",
    style: {
      maxHeight: 340
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 64
    }
  }, "งวดที่"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 120
    }
  }, "วันครบกำหนด"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "เงินต้น"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "ดอกเบี้ย"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "ชำระ/งวด"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "คงเหลือ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "หมายเหตุ"))), /*#__PURE__*/React.createElement("tbody", null, !schedule ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "7",
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 22
  })), "ระบุจำนวนงวดและค่างวดเพื่อแสดงตารางชำระหนี้")) : schedule.rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.term,
    style: {
      background: r.collectFull ? 'rgba(214,77,87,0.08)' : r.grace ? 'rgba(35,116,80,0.06)' : undefined
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, r.term), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, window.fmt.date(r.due)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(r.principal, 2)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(r.interest, 2)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(r.pay, 2)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(r.balance, 2)), /*#__PURE__*/React.createElement("td", null, r.collectFull ? /*#__PURE__*/React.createElement("span", {
    className: "chip danger"
  }, "เก็บเต็มจำนวน") : r.grace ? /*#__PURE__*/React.createElement("span", {
    className: "chip info"
  }, "ลดค่างวด") : ''))))))), schedule && schedule.term61 && /*#__PURE__*/React.createElement("div", {
    className: "icr-restruct-note"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, "หนี้ในฐานะผู้ค้ำประกัน \u2014 ขยายครบ 60 งวด และ ", /*#__PURE__*/React.createElement("b", null, "เก็บเต็มจำนวนคงเหลือในงวดที่ 61")))), tab === 'history' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl icr-hist-tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "เลขที่เอกสาร"), /*#__PURE__*/React.createElement("th", null, "รูปแบบ"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "ชำระ/งวด (บาท)"), /*#__PURE__*/React.createElement("th", {
    className: "center"
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "ด/ป ค้างต่องวด (บาท)"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "เพิ่มชำระต้นเงินปีละ (บาท)"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "เพิ่มปีละ (บาท)"), /*#__PURE__*/React.createElement("th", {
    className: "center"
  }, "วันที่เอกสาร"), /*#__PURE__*/React.createElement("th", null, "ผู้ทำรายการ"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 40
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, !loaded ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "10",
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "history",
    size: 22
  })), "เลือกสัญญาเพื่อแสดงประวัติการเปลี่ยนแปลงยอดชำระ")) : history.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "10",
    className: "empty-state"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "history",
    size: 22
  })), "ยังไม่มีประวัติการเปลี่ยนแปลงสำหรับสัญญานี้")) : history.map(h => {
    const st = window.icrReqStatus(h.status);
    return /*#__PURE__*/React.createElement("tr", {
      key: h.docNo
    }, /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, h.docNo), /*#__PURE__*/React.createElement("td", null, window.icrPayMethod(h.payMethod).l), /*#__PURE__*/React.createElement("td", {
      className: "num mono"
    }, window.fmt.money(h.perInstallment, 2)), /*#__PURE__*/React.createElement("td", {
      className: "center"
    }, /*#__PURE__*/React.createElement("span", {
      className: 'pill ' + st.pill
    }, st.l)), /*#__PURE__*/React.createElement("td", {
      className: "num mono"
    }, window.fmt.money(h.arrearsPerTerm, 2)), /*#__PURE__*/React.createElement("td", {
      className: "num mono"
    }, window.fmt.money(h.addPrincipalYearly, 2)), /*#__PURE__*/React.createElement("td", {
      className: "num mono"
    }, h.addYearly > 0 ? window.fmt.money(h.addYearly, 2) : '–'), /*#__PURE__*/React.createElement("td", {
      className: "center mono"
    }, window.fmt.date(h.docDate)), /*#__PURE__*/React.createElement("td", null, h.by), /*#__PURE__*/React.createElement("td", {
      className: "center"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn text sm icr-rowmenu",
      title: "เพิ่มเติม"
    }, "\xB7\xB7\xB7")));
  }))))), /*#__PURE__*/React.createElement(IcrPager, {
    total: loaded ? history.length : 0,
    page: 1,
    pageCount: 1,
    per: 20,
    onPage: () => {},
    onPer: () => {}
  }))), modal && /*#__PURE__*/React.createElement(ContractSearchModal, {
    extended: true,
    onPick: ({
      member: m,
      debt
    }) => {
      setModal(false);
      loadContract(m, debt);
    },
    onClose: () => setModal(false)
  }));
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function InstallmentChangePage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  return /*#__PURE__*/React.createElement(IcrFormScreen, {
    onToast: onToast,
    audit: audit
  });
}

// ระบบประมวลผลและจัดเก็บ › สินเชื่อ — ใบคำขอเปลี่ยนแปลงงวดชำระ (process/inst-change-req)
//  ใช้หน้าจอเดียวกัน + เชื่อมที่เก็บของหน้า "อนุมัติเปลี่ยนแปลงงวดชำระ"
function PcxInstallmentChangeRequestPage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  return /*#__PURE__*/React.createElement(IcrFormScreen, {
    onToast: onToast,
    audit: audit,
    pcxLink: true,
    title: "ใบคำขอเปลี่ยนแปลงงวดชำระ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 ปรับโครงสร้างหนี้ หรือเปลี่ยนแปลงค่างวดของสัญญาเงินกู้ แล้วส่งไปที่เมนูอนุมัติเปลี่ยนแปลงงวดชำระ"
  });
}
Object.assign(window, {
  InstallmentChangePage,
  IcrFormScreen,
  PcxInstallmentChangeRequestPage
});