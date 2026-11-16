// ════════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › รายเดือน  (Level 2)
//  7 หน้าจอ:
//    · จ่ายเงินให้สมาชิก          (process/member-payout)
//    · ประมวลผลเรียกเก็บ          (process/monthly-collect)
//    · ประมวลผลตัดยอด            (process/monthly-cutoff)
//    · ขึ้นแผ่นจัดเก็บ             (process/collect-disk)
//    · รายการเรียกเก็บอื่น ๆ        (process/collect-other)
//    · ตัดยอดเรียกเก็บจากแผ่น       (process/collect-cutoff-disk)
//    · คืนใบเสร็จ                (process/receipt-return)
// ════════════════════════════════════════════════════════════════════

const moToday437 = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const moBE = () => new Date().getFullYear() + 543;
const moMoney = (v, d) => window.fmt.money(Number(v) || 0, d === undefined ? 2 : d);
const moAudit = () => React.useContext(window.AuditContext || React.createContext({
  log: () => {}
}));
const MO_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
function MoFld({
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
    width: w || 150
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
function MoRO({
  value,
  mono,
  num,
  placeholder
}) {
  const empty = value === undefined || value === null || value === '';
  return /*#__PURE__*/React.createElement("div", {
    className: 'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')
  }, empty ? placeholder || '—' : value);
}
function MoHead({
  icon,
  title,
  subtitle,
  actions
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "icr-form-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-form-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon || 'receipt',
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, actions));
}
function MoSec({
  title,
  hint,
  children,
  style,
  actions
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, title), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, actions)), children, hint && /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 8
    }
  }, hint));
}
function MoCheck({
  checked,
  onChange,
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    onChange: e => onChange(e.target.checked)
  }), /*#__PURE__*/React.createElement("span", null, label), children);
}
function MoCheckGrid({
  items,
  value,
  onToggle,
  extra
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '10px 24px'
    }
  }, items.map(it => /*#__PURE__*/React.createElement(MoCheck, {
    key: it,
    label: it,
    checked: value.includes(it),
    onChange: () => onToggle(it)
  })), extra);
}

// ════════════════════════════════════════════════════════════════════
//  ① จ่ายเงินให้สมาชิก
// ════════════════════════════════════════════════════════════════════
function MemberPayoutPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const today = moToday437();
  const [member, setMember] = useState(null);
  const [payDate, setPayDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [payCode, setPayCode] = useState('LRT');
  const [moneyType, setMoneyType] = useState('CSH');
  const [bank, setBank] = useState('');
  const [branch, setBranch] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [pairAccount, setPairAccount] = useState('');
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');
  const net = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const isCash = moneyType === 'CSH';
  const pickMember = m => {
    setMember(m);
    setSavedNo('');
    setError('');
    setRows([{
      detail: 'คืนค่าหุ้น',
      principal: '',
      interest: '',
      amount: ''
    }]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => {
    if (idx !== i) return r;
    const n = {
      ...r,
      ...patch
    };
    if ('principal' in patch || 'interest' in patch) n.amount = (Number(n.principal) || 0) + (Number(n.interest) || 0);
    return n;
  }));
  const addRow = () => {
    if (!member) {
      setError('กรุณาเลือกเลขสมาชิกก่อนเพิ่มรายการ');
      return;
    }
    setRows(rs => [...rs, {
      detail: '',
      principal: '',
      interest: '',
      amount: ''
    }]);
  };
  const removeRow = i => setRows(rs => rs.filter((_, idx) => idx !== i));
  const clear = () => {
    setMember(null);
    setRows([]);
    setSavedNo('');
    setError('');
    setPayDate(today);
    setTxnDate(today);
    setPayCode('LRT');
    setMoneyType('CSH');
    setBank('');
    setBranch('');
    setAccountNo('');
    setPairAccount('');
  };
  const doSave = () => {
    if (!member) {
      setError('กรุณาระบุเลขสมาชิกก่อนบันทึก');
      return;
    }
    if (!rows.length || net <= 0) {
      setError('กรุณาระบุรายการจ่ายคืนอย่างน้อย 1 รายการ');
      return;
    }
    if (!isCash && !accountNo.trim()) {
      setError('การจ่ายผ่านธนาคารต้องระบุเลขที่บัญชี');
      return;
    }
    setError('');
    const no = `PV${moBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — จ่ายเงินให้สมาชิก',
      target: `${member.code} · ${member.name}`,
      summary: `${no} · จ่ายเงินให้สมาชิก ${moMoney(net)} บาท (${moneyType})`,
      changes: rows.map(r => ({
        field: r.detail || '—',
        before: '—',
        after: moMoney(r.amount)
      }))
    });
    onToast && onToast(`บันทึกใบสำคัญจ่าย ${no} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "จ่ายเงินให้สมาชิก"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "money",
    title: "จ่ายเงินให้สมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 การจ่ายเงินให้สมาชิก",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " บันทึก"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: addRow
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 13
    }), " เพิ่มรายการ"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: clear
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " ล้างข้อมูล"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        onToast && onToast('กำลังเตรียมพิมพ์ใบสำคัญจ่าย…');
        setTimeout(() => window.print(), 80);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "print",
      size: 13
    }), " พิมพ์เอกสาร"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "การจ่ายเงินให้สมาชิก"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "เลขที่ใบสำคัญ",
    w: 150
  }, (savedNo ? /*#__PURE__*/React.createElement(MoRO, {
    value: savedNo,
    mono: true
  }) : /*#__PURE__*/React.createElement("div", {
    className: "icr-ro icr-auto"
  }, "AUTO"))), /*#__PURE__*/React.createElement(MoFld, {
    label: "วันที่ใบจ่าย",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: payDate,
    onChange: e => setPayDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "วันที่รายการ",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: txnDate,
    onChange: e => setTxnDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "รหัสการจ่าย",
    w: 150
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: payCode,
    onChange: e => setPayCode(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "LRT"
  }, "LRT"), /*#__PURE__*/React.createElement("option", {
    value: "SHR"
  }, "SHR"), /*#__PURE__*/React.createElement("option", {
    value: "DPS"
  }, "DPS"), /*#__PURE__*/React.createElement("option", {
    value: "OTH"
  }, "OTH")))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "เลขสมาชิก",
    w: 260,
    required: true
  }, /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสมาชิก \u2014 จ่ายเงินให้สมาชิก"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ชื่อ-ชื่อสกุล",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "สังกัด",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? `${member.departmentCode || ''} - ${member.department || ''}`.trim() : ''
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ประเภทเงินทำรายการ",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ประเภทเงิน",
    w: 130
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: moneyType,
    onChange: e => setMoneyType(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "CSH"
  }, "CSH"), /*#__PURE__*/React.createElement("option", {
    value: "CHQ"
  }, "CHQ"), /*#__PURE__*/React.createElement("option", {
    value: "TRF"
  }, "TRF"))), /*#__PURE__*/React.createElement(MoFld, {
    label: "ธนาคาร",
    grow: true,
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: bank,
    disabled: isCash,
    onChange: e => setBank(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "สาขา",
    grow: true,
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: branch,
    disabled: isCash,
    onChange: e => setBranch(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "เลขที่บัญชี",
    grow: true,
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: accountNo,
    disabled: isCash,
    onChange: e => setAccountNo(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "คู่บัญชี",
    grow: true,
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: pairAccount,
    onChange: e => setPairAccount(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "เงินรับสุทธิ",
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(net),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "รายการจ่ายคืน",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 44
    }
  }), /*#__PURE__*/React.createElement("th", null, "รายละเอียดเงินคืน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "ต้นเงิน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "ดอกเบี้ย"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "จำนวนเงิน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 70
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    className: "muted mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.detail,
    onChange: e => updateRow(i, {
      detail: e.target.value
    }),
    placeholder: "รายละเอียดเงินคืน"
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.principal,
    onChange: e => updateRow(i, {
      principal: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.interest,
    onChange: e => updateRow(i, {
      interest: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.amount)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-del",
    title: "ลบ",
    "aria-label": "ลบ",
    onClick: () => removeRow(i)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  }))))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 6,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสมาชิกเพื่อเริ่มบันทึกรายการจ่ายคืน"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 4,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "เงินรับสุทธิ"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, moMoney(net)), /*#__PURE__*/React.createElement("td", null)))))));
}

// ════════════════════════════════════════════════════════════════════
//  ② ประมวลผลเรียกเก็บ
// ════════════════════════════════════════════════════════════════════
const MO_COLLECT_SYSTEMS = ['ค่าธรรมเนียมแรกเข้า', 'เรียกเก็บเบี้ยประกันอัคคีภัย', 'ค่าทำบัตรสมาชิก', 'หุ้นรายเดือน', 'คืนเงินส่วนที่เก็บเกินมา', 'กองทุนช่วยเหลือผู้ค้ำประกัน', 'หนี้เงินกู้', 'เรียกเก็บอื่นๆที่ได้บันทึกข้อมูลไว้', 'ค่าทนาย/ฤชาธรรมเนียมศาล', 'เงินฝากรายเดือน', 'ฉุกเฉินหักโอน'];
function MonthlyCollectPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const [year, setYear] = useState(String(moBE()));
  const [month, setMonth] = useState(MO_MONTHS[new Date().getMonth()]);
  const [receiptDate, setReceiptDate] = useState(moToday437());
  const [interestDate, setInterestDate] = useState(moToday437());
  const [range, setRange] = useState('ทั้งหมด');
  const [byAffil, setByAffil] = useState('');
  const [byMember, setByMember] = useState('');
  const [systems, setSystems] = useState(['ค่าธรรมเนียมแรกเข้า']);
  const [useReceiptNo, setUseReceiptNo] = useState(false);
  const [receiptStart, setReceiptStart] = useState('1');
  const [clearMode, setClearMode] = useState('ล้างข้อมูลเดิมทั้งทั้งหมด');
  const [result, setResult] = useState(null);
  const toggle = s => setSystems(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s]);
  const run = () => {
    if (!systems.length) {
      onToast && onToast('กรุณาเลือกระบบงานที่จะประมวลผลอย่างน้อย 1 รายการ');
      return;
    }
    setResult({
      at: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      count: systems.length
    });
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลเรียกเก็บ',
      target: `งวด ${year}/${month}`,
      summary: `ประมวลผลเรียกเก็บประจำเดือน ${month} ${year} — ${systems.length} ระบบงาน · ${clearMode}`
    });
    onToast && onToast(`ประมวลผลเรียกเก็บประจำเดือน ${month} ${year} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ประมวลผลเรียกเก็บ"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "cog",
    title: "ประมวลผลเรียกเก็บ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 ประมวลผลรายการเรียกเก็บประจำเดือน",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " ประมวล"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setSystems([]);
        setResult(null);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " ล้างข้อมูล"))
  }), result && /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "ประมวลผลเรียกเก็บงวด ", /*#__PURE__*/React.createElement("b", null, month, " ", year), " จำนวน ", /*#__PURE__*/React.createElement("b", null, result.count), " ระบบงาน เวลา ", result.at, " น.")), /*#__PURE__*/React.createElement(MoSec, {
    title: "ประมวลผลประจำเดือน"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ประจำปี",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: year,
    onChange: e => setYear(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ประจำเดือน",
    w: 170
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: month,
    onChange: e => setMonth(e.target.value)
  }, MO_MONTHS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: m
  }, m)))), /*#__PURE__*/React.createElement(MoFld, {
    label: "ใบเสร็จลงวันที่",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: receiptDate,
    onChange: e => setReceiptDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ด/บ ถึงวันที่",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: interestDate,
    onChange: e => setInterestDate(e.target.value)
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ช่วงข้อมูลที่ต้องการประมวลผล",
    style: {
      marginTop: 12
    },
    hint: "ใส่ข้อมูลหรือช่วงข้อมูลที่ต้องการประมวลผลและคั่นด้วยเครื่องหมาย - หรือ , เช่น 11010, 11020, 11000 - 11020"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ช่วงข้อมูล",
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: range,
    onChange: e => setRange(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "ทั้งหมด"
  }, "ทั้งหมด"), /*#__PURE__*/React.createElement("option", {
    value: "ตามสังกัด"
  }, "ตามสังกัด"), /*#__PURE__*/React.createElement("option", {
    value: "ตามเลขสมาชิก"
  }, "ตามเลขสมาชิก")))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ตามสังกัด",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: byAffil,
    disabled: range !== 'ตามสังกัด',
    onChange: e => setByAffil(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ตามเลขสมาชิก",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: byMember,
    disabled: range !== 'ตามเลขสมาชิก',
    onChange: e => setByMember(e.target.value)
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ระบบงานที่จะประมวลผล",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(MoCheckGrid, {
    items: MO_COLLECT_SYSTEMS,
    value: systems,
    onToggle: toggle,
    extra: /*#__PURE__*/React.createElement(MoCheck, {
      label: "ใส่เลขที่ใบเสร็จ เริ่มที่",
      checked: useReceiptNo,
      onChange: setUseReceiptNo
    }, /*#__PURE__*/React.createElement("input", {
      className: "cfg-input sm",
      style: {
        width: 110
      },
      value: receiptStart,
      disabled: !useReceiptNo,
      onChange: e => setReceiptStart(e.target.value)
    }))
  })), /*#__PURE__*/React.createElement(MoSec, {
    title: "การล้างข้อมูลเดิม",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "รูปแบบ",
    grow: true,
    w: 320
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: clearMode,
    onChange: e => setClearMode(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "ล้างข้อมูลเดิมทั้งทั้งหมด"
  }, "ล้างข้อมูลเดิมทั้งทั้งหมด"), /*#__PURE__*/React.createElement("option", {
    value: "ล้างข้อมูลตามประเภทรายการที่จะประมวล"
  }, "ล้างข้อมูลตามประเภทรายการที่จะประมวล"))))));
}

// ════════════════════════════════════════════════════════════════════
//  ③ ประมวลผลตัดยอด
// ════════════════════════════════════════════════════════════════════
const MO_CUTOFF_SYSTEMS = ['ค่าธรรมเนียมแรกเข้า', 'ค่าทนาย/ฤชาธรรมเนียมศาล', 'กองทุนช่วยเหลือผู้ค้ำ', 'ค่าทำบัตรสมาชิก', 'หนี้เงินกู้', 'เบี้ยประกันอัคคีภัย', 'หุ้นรายเดือน', 'ฉุกเฉินหักโอน', 'รายการเรียกเก็บอื่นๆ', 'คืนเงินส่วนที่เก็บเกินมา', 'ส่งรายการหักไประบบเงินฝาก'];
function MonthlyCutoffPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const [year, setYear] = useState(String(moBE()));
  const [month, setMonth] = useState(MO_MONTHS[new Date().getMonth()]);
  const [range, setRange] = useState('ทั้งหมด');
  const [byAffil, setByAffil] = useState('');
  const [byMember, setByMember] = useState('');
  const [systems, setSystems] = useState([]);
  const [result, setResult] = useState(null);
  const toggle = s => setSystems(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s]);
  const run = () => {
    if (!systems.length) {
      onToast && onToast('กรุณาเลือกระบบงานที่จะตัดยอดอย่างน้อย 1 รายการ');
      return;
    }
    setResult({
      at: new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      count: systems.length
    });
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลตัดยอด',
      target: `งวด ${year}/${month}`,
      summary: `ตัดยอดประจำเดือน ${month} ${year} — ${systems.length} ระบบงาน`
    });
    onToast && onToast(`ประมวลผลตัดยอดประจำเดือน ${month} ${year} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ประมวลผลตัดยอด"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "cog",
    title: "ประมวลผลตัดยอด",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 ตัดยอดรายการเรียกเก็บประจำเดือน",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " ประมวล"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setSystems([]);
        setResult(null);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " ล้างข้อมูล"))
  }), result && /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "ตัดยอดงวด ", /*#__PURE__*/React.createElement("b", null, month, " ", year), " จำนวน ", /*#__PURE__*/React.createElement("b", null, result.count), " ระบบงาน เวลา ", result.at, " น.")), /*#__PURE__*/React.createElement(MoSec, {
    title: "ตัดยอดประจำเดือน"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ประจำปี",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: year,
    onChange: e => setYear(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ประจำเดือน",
    w: 200
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: month,
    onChange: e => setMonth(e.target.value)
  }, MO_MONTHS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: m
  }, m)))))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ช่วงข้อมูลที่ต้องการตัดยอด",
    style: {
      marginTop: 12
    },
    hint: "ใส่ข้อมูลหรือช่วงข้อมูลที่ต้องการประมวลผลและคั่นด้วยเครื่องหมาย - หรือ , เช่น 11010, 11020, 11000 - 11020"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ช่วงข้อมูล",
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: range,
    onChange: e => setRange(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "ทั้งหมด"
  }, "ทั้งหมด"), /*#__PURE__*/React.createElement("option", {
    value: "ตามสังกัด"
  }, "ตามสังกัด"), /*#__PURE__*/React.createElement("option", {
    value: "ตามเลขสมาชิก"
  }, "ตามเลขสมาชิก")))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ตามสังกัด",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: byAffil,
    disabled: range !== 'ตามสังกัด',
    onChange: e => setByAffil(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ตามเลขสมาชิก",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: byMember,
    disabled: range !== 'ตามเลขสมาชิก',
    onChange: e => setByMember(e.target.value)
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ระบบงานที่จะตัดยอด",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(MoCheckGrid, {
    items: MO_CUTOFF_SYSTEMS,
    value: systems,
    onToggle: toggle
  })));
}

// ════════════════════════════════════════════════════════════════════
//  ④ ขึ้นแผ่นจัดเก็บ
// ════════════════════════════════════════════════════════════════════
// รหัสกลุ่มการขึ้นแผ่น / รูปแบบรายการ (ตามระบบเดิม)
const MO_DISK_GROUPS = ['ETC', 'ก.ดิจ', 'กสท', 'กสทช', 'ปณท', 'ปณทดบ', 'สอ.ร', 'สอกสท'];
const MO_DISK_FORMATS = ['เรียกเก็บแบบรวม', 'เรียกเก็บแบบแยก ตัวเอง + R'];
// ข้อมูลจำลองรายการขึ้นแผ่น (สร้างครั้งเดียว ใช้ทั้งสรุปผลและไฟล์ที่บันทึก)
const moDiskData = total => {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  return Array.from({
    length: total
  }, (_, i) => {
    const share = 500 + Math.round(rnd() * 30) * 50;
    const loan = Math.round(rnd() * 160) * 100;
    const other = rnd() < 0.3 ? Math.round(rnd() * 20) * 20 : 0;
    return {
      code: String(40000 + i * 7).padStart(6, '0'),
      share,
      loan,
      other,
      total: share + loan + other
    };
  });
};

// zip แบบไม่บีบอัด (STORE) สำหรับสร้างไฟล์ .xlsx โดยไม่ต้องใช้ไลบรารีภายนอก
const moCrcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const moCrc32 = u8 => {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = moCrcTable[(c ^ u8[i]) & 0xFF] ^ c >>> 8;
  return (c ^ 0xFFFFFFFF) >>> 0;
};
const moZipStore = files => {
  const enc = new TextEncoder();
  const parts = [],
    central = [];
  let offset = 0;
  const u16 = v => [v & 0xFF, v >>> 8 & 0xFF];
  const u32 = v => [v & 0xFF, v >>> 8 & 0xFF, v >>> 16 & 0xFF, v >>> 24 & 0xFF];
  Object.keys(files).forEach(name => {
    const nameB = enc.encode(name),
      data = enc.encode(files[name]),
      crc = moCrc32(data);
    const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0)]);
    parts.push(local, nameB, data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nameB);
    offset += local.length + nameB.length + data.length;
  });
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const count = Object.keys(files).length;
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(count), ...u16(count), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  return new Blob([...parts, ...central, end], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};
function CollectDiskPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const d = new Date();
  const [period, setPeriod] = useState(`${moBE()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  const [receiptDate, setReceiptDate] = useState(moToday437());
  const [groupCode, setGroupCode] = useState('');
  const [format, setFormat] = useState('');
  const [result, setResult] = useState(null); // { rows, share, loan, other, total, data }
  const [error, setError] = useState('');
  // แถบสถานะการประมวลผลแบบเดียวกับ ปันผล–เฉลี่ยคืน (DvJobBanner / useDvJob ใน 443-dividend.js)
  const dvJob = useDvJob(null);
  const TOTAL = 1284;
  const finish = () => {
    const data = moDiskData(TOTAL);
    const sum = data.reduce((acc, r) => ({
      share: acc.share + r.share,
      loan: acc.loan + r.loan,
      other: acc.other + r.other
    }), {
      share: 0,
      loan: 0,
      other: 0
    });
    const res = {
      rows: data.length,
      ...sum,
      total: sum.share + sum.loan + sum.other,
      data
    };
    setResult(res);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ขึ้นแผ่นจัดเก็บ',
      target: `งวด ${period}`,
      summary: `ขึ้นแผ่นจัดเก็บ งวด ${period} · กลุ่ม ${groupCode} · ${format} · ${data.length} รหัส · ${moMoney(res.total)} บาท`
    });
    onToast && onToast(`ประมวลผลขึ้นแผ่นจัดเก็บงวด ${period} เรียบร้อยแล้ว`);
  };
  const run = () => {
    if (!groupCode) {
      setError('กรุณาเลือกรหัสกลุ่มการขึ้นแผ่น');
      return;
    }
    if (!format) {
      setError('กรุณาเลือกรูปแบบรายการ');
      return;
    }
    if (dvJob.busy) return;
    setError('');
    setResult(null);
    // จำลอง: รูปแบบ "เรียกเก็บแบบแยก" ใช้เวลานานจนหมดเวลา (แสดงสถานะ Timeout)
    dvJob.start(finish, format !== MO_DISK_FORMATS[0], TOTAL);
  };
  const stop = () => {
    dvJob.stop();
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ขึ้นแผ่นจัดเก็บ',
      target: `งวด ${period}`,
      summary: `หยุดการประมวลผลขึ้นแผ่นจัดเก็บ งวด ${period} โดยผู้ใช้`
    });
    onToast && onToast('หยุดการประมวลผลแล้ว — ยังไม่ได้สร้างแผ่นจัดเก็บ');
  };
  const fileBase = `CLT${period}_${groupCode}`.replace(/[^\w฀-๿.-]/g, '');
  const download = (name, content, type) => {
    const blob = new Blob(['\ufeff' + content], {
      type
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const saveTxt = () => {
    if (!result) return;
    const head = `งวด|${period}|วันที่ใบเสร็จ|${receiptDate}|กลุ่ม|${groupCode}|รูปแบบ|${format}`;
    const lines = result.data.map(r => [r.code, r.share.toFixed(2), r.loan.toFixed(2), r.other.toFixed(2), r.total.toFixed(2)].join('|'));
    const foot = `รวม|${result.rows}|${result.share.toFixed(2)}|${result.loan.toFixed(2)}|${result.other.toFixed(2)}|${result.total.toFixed(2)}`;
    download(fileBase + '.txt', [head, ...lines, foot].join('\r\n'), 'text/plain;charset=utf-8');
    onToast && onToast('บันทึกลงแผ่น ' + fileBase + '.txt เรียบร้อยแล้ว');
  };
  const saveXls = () => {
    if (!result) return;
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const colL = i => String.fromCharCode(65 + i);
    let rn = 0;
    const row = cells => {
      rn++;
      return '<row r="' + rn + '">' + cells.map((v, i) => typeof v === 'number' ? '<c r="' + colL(i) + rn + '"><v>' + v + '</v></c>' : '<c r="' + colL(i) + rn + '" t="inlineStr"><is><t>' + esc(v) + '</t></is></c>').join('') + '</row>';
    };
    const rows = [row(['งวด', period, 'วันที่ใบเสร็จ', receiptDate, 'กลุ่ม', groupCode, 'รูปแบบ', format]), row(['เลขสมาชิก', 'หุ้นรายเดือน', 'หนี้เงินกู้', 'เรียกเก็บอื่นๆ', 'รวมเรียกเก็บ']), ...result.data.map(r => row([r.code, r.share, r.loan, r.other, r.total])), row(['รวม ' + result.rows + ' รหัส', result.share, result.loan, result.other, result.total])].join('');
    const files = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="ขึ้นแผ่นจัดเก็บ" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + rows + '</sheetData></worksheet>'
    };
    const blob = moZipStore(files);
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = fileBase + '.xlsx';
    el.click();
    setTimeout(() => URL.revokeObjectURL(el.href), 1000);
    onToast && onToast('บันทึกลงแผ่น ' + fileBase + '.xlsx เรียบร้อยแล้ว');
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ขึ้นแผ่นจัดเก็บ"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "database",
    title: "ขึ้นแผ่นจัดเก็บ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 สร้างแผ่นจัดเก็บรายการเรียกเก็บส่งหน่วยงาน",
    actions: /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run,
      disabled: dvJob.busy
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " ประมวล")
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "ขึ้นแผ่นจัดเก็บ"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "งวด",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: period,
    onChange: e => setPeriod(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "วันที่ใบเสร็จ",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: receiptDate,
    onChange: e => setReceiptDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "รหัสกลุ่มการขึ้นแผ่น",
    w: 220
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: groupCode,
    onChange: e => {
      setGroupCode(e.target.value);
      setError('');
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 เลือก \u2014"), MO_DISK_GROUPS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g,
    value: g
  }, g)))), /*#__PURE__*/React.createElement(MoFld, {
    label: "รูปแบบรายการ",
    w: 260
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: format,
    onChange: e => {
      setFormat(e.target.value);
      setError('');
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 เลือก \u2014"), MO_DISK_FORMATS.map(x => /*#__PURE__*/React.createElement("option", {
    key: x,
    value: x
  }, x)))))), React.createElement(DvJobBanner, { job: dvJob.job, onStop: stop, onRetry: run }), result && /*#__PURE__*/React.createElement(MoSec, {
    title: "สรุปผลการขึ้นแผ่นจัดเก็บ",
    style: {
      marginTop: 12
    },
    hint: `งวด ${period} · กลุ่ม ${groupCode} · ${format}`,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: saveTxt
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 13
    }), " บันทึกลงแผ่น Text (.txt)"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: saveXls
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 13
    }), " บันทึกลงแผ่น Excel (.xlsx)"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "จำนวนรหัส",
    w: 150
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: window.fmt.money(result.rows, 0),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "หุ้นรายเดือน",
    w: 170
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.share),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "หนี้เงินกู้",
    w: 170
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.loan),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "เรียกเก็บอื่นๆ",
    w: 160
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.other),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "รวมเรียกเก็บ",
    grow: true,
    w: 180
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.total),
    num: true,
    mono: true
  })))));
}

// ════════════════════════════════════════════════════════════════════
//  ⑤ รายการเรียกเก็บอื่น ๆ
// ════════════════════════════════════════════════════════════════════
const MO_OTHER_CODES = ['ดอกเบี้ยค้างรับ (เรียกเก็บ)', 'ค่าทนาย/ฤชาธรรมเนียมศาล', 'ค่าทำบัตรสมาชิก', 'กองทุนช่วยเหลือผู้ค้ำประกัน', 'เบี้ยประกันอัคคีภัย', 'ค่าธรรมเนียมอื่น'];
function CollectOtherPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const [member, setMember] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const newRow = () => ({
    mode: 'เก็บครั้งเดียว',
    code: MO_OTHER_CODES[0],
    start: '',
    detail: '',
    amount: ''
  });
  const pickMember = m => {
    setMember(m);
    setError('');
    setRows([newRow()]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const addRow = () => {
    if (!member) {
      setError('กรุณาเลือกเลขสมาชิกก่อนเพิ่มแถว');
      return;
    }
    setRows(rs => [...rs, newRow()]);
  };
  const removeRow = i => setRows(rs => rs.filter((_, idx) => idx !== i));
  const doSave = () => {
    if (!member) {
      setError('กรุณาระบุเลขสมาชิกก่อนบันทึก');
      return;
    }
    if (!rows.length || total <= 0) {
      setError('กรุณาระบุรายการเรียกเก็บและยอดเงินอย่างน้อย 1 รายการ');
      return;
    }
    setError('');
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — รายการเรียกเก็บอื่นๆ',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกรายการเรียกเก็บอื่นๆ ${rows.length} รายการ รวม ${moMoney(total)} บาท`,
      changes: rows.map(r => ({
        field: r.code,
        before: '—',
        after: `${r.mode} · ${moMoney(r.amount)}`
      }))
    });
    onToast && onToast('บันทึกรายการเรียกเก็บอื่นๆ เรียบร้อยแล้ว');
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "รายการเรียกเก็บอื่นๆ"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "receipt",
    title: "รายการเรียกเก็บอื่นๆ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 บันทึกรายการเรียกเก็บอื่นๆ รายสมาชิก",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " บันทึก"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: addRow
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 13
    }), " เพิ่มแถว"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setMember(null);
        setRows([]);
        setError('');
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " ล้างข้อมูล"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "รายการเรียกเก็บอื่นๆ"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "เลขสมาชิก",
    w: 260,
    required: true
  }, /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสมาชิก \u2014 รายการเรียกเก็บอื่นๆ"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ชื่อสมาชิก",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ประเภทสมาชิก",
    w: 160
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.memberType : ''
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "หน่วยสมาชิก",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? `${member.departmentCode || ''} - ${member.department || ''}`.trim() : ''
  }))), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 12,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 54
    }
  }, "ลำดับ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 190
    }
  }, "ประเภทการเก็บ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 230
    }
  }, "รหัสเรียกเก็บ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "ปี/เดือน ที่เริ่มเก็บ"), /*#__PURE__*/React.createElement("th", null, "รายละเอียด"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150,
      textAlign: 'right'
    }
  }, "ยอดเงินที่เรียกเก็บ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 70
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    className: "muted mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input sm",
    value: r.mode,
    onChange: e => updateRow(i, {
      mode: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: "เก็บครั้งเดียว"
  }, "เก็บครั้งเดียว"), /*#__PURE__*/React.createElement("option", {
    value: "เก็บทุกครั้งที่มีการเรียกเก็บ"
  }, "เก็บทุกครั้งที่มีการเรียกเก็บ"))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input sm",
    value: r.code,
    onChange: e => updateRow(i, {
      code: e.target.value
    })
  }, MO_OTHER_CODES.map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.start,
    placeholder: "256909",
    onChange: e => updateRow(i, {
      start: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.detail,
    onChange: e => updateRow(i, {
      detail: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.amount,
    onChange: e => updateRow(i, {
      amount: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-del",
    title: "ลบ",
    "aria-label": "ลบ",
    onClick: () => removeRow(i)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  }))))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสมาชิกเพื่อเริ่มบันทึกรายการเรียกเก็บ"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "รวมยอดเรียกเก็บ"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, moMoney(total)), /*#__PURE__*/React.createElement("td", null))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: addRow
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), " เพิ่มแถว"))));
}

// ════════════════════════════════════════════════════════════════════
//  ⑥ ตัดยอดเรียกเก็บจากแผ่น
// ════════════════════════════════════════════════════════════════════
function CollectCutoffDiskPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const d = new Date();
  const [period, setPeriod] = useState(`${moBE()}${String(d.getMonth() + 1).padStart(2, '0')}`);
  const [group, setGroup] = useState('');
  const [negative, setNegative] = useState(true);
  const [agentPay, setAgentPay] = useState(true);
  const [postDate, setPostDate] = useState(moToday437());
  const [fileName, setFileName] = useState('');
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const summary = checked ? [{
    label: 'หักได้เต็มจำนวน',
    rows: 1148,
    collect: 17240500,
    deduct: 17240500
  }, {
    label: 'หักได้บางส่วน',
    rows: 96,
    collect: 1042850,
    deduct: 612300
  }, {
    label: 'หักไม่ได้เลย',
    rows: 40,
    collect: 209000,
    deduct: 0
  }] : [{
    label: 'หักได้เต็มจำนวน',
    rows: null,
    collect: 0,
    deduct: 0
  }, {
    label: 'หักได้บางส่วน',
    rows: null,
    collect: 0,
    deduct: 0
  }, {
    label: 'หักไม่ได้เลย',
    rows: null,
    collect: 0,
    deduct: 0
  }];
  const totals = summary.reduce((a, r) => ({
    rows: a.rows + (r.rows || 0),
    collect: a.collect + r.collect,
    deduct: a.deduct + r.deduct
  }), {
    rows: 0,
    collect: 0,
    deduct: 0
  });
  const detail = checked ? [{
    code: '046892',
    name: 'นายศรัณย์พงษ์ อุปนันท์',
    db: 8420,
    disk: 8420,
    diff: 'ตรงกัน'
  }, {
    code: '049886',
    name: 'นายอุทัย ตัดผ่อง',
    db: 6150,
    disk: 4200,
    diff: 'หักได้บางส่วน'
  }, {
    code: '051204',
    name: 'นางสาวพรรณี ชูเกียรติ',
    db: 5230,
    disk: 0,
    diff: 'หักไม่ได้'
  }] : [];
  const doCheck = () => {
    if (!fileName) {
      onToast && onToast('กรุณาเลือกไฟล์ .txt ที่ได้จากแผ่นจัดเก็บ');
      return;
    }
    setChecked(true);
    setDone(false);
    onToast && onToast(`ตรวจสอบไฟล์ ${fileName} เรียบร้อยแล้ว`);
  };
  const doCutoff = () => {
    if (!checked) {
      onToast && onToast('กรุณาตรวจสอบข้อมูลก่อนตัดยอด');
      return;
    }
    setDone(true);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ตัดยอดเรียกเก็บจากแผ่น',
      target: `งวด ${period}`,
      summary: `ตัดยอดเรียกเก็บจากแผ่น ${fileName} · ${totals.rows} รายการ · หักได้ ${moMoney(totals.deduct)} บาท`
    });
    onToast && onToast('ตัดยอดเรียกเก็บจากแผ่นเรียบร้อยแล้ว');
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ตัดยอดเรียกเก็บจากแผ่น"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "database",
    title: "ตัดยอดเรียกเก็บจากแผ่น",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 นำไฟล์กลับจากแผ่น Disk มาตัดยอดเรียกเก็บ",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: doCheck
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 13
    }), " ตรวจสอบ"), /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doCutoff
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " ตัดยอด"))
  }), done && /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, "ตัดยอดงวด ", /*#__PURE__*/React.createElement("b", null, period), " จำนวน ", /*#__PURE__*/React.createElement("b", null, window.fmt.money(totals.rows, 0)), " รายการ \xB7 หักได้ ", /*#__PURE__*/React.createElement("b", null, moMoney(totals.deduct)), " บาท")), /*#__PURE__*/React.createElement(MoSec, {
    title: "ข้อมูลที่จะตัดยอด"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ปี",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: period,
    onChange: e => setPeriod(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "กลุ่มข้อมูล",
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: group,
    onChange: e => setGroup(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 เลือก \u2014"), /*#__PURE__*/React.createElement("option", {
    value: "01 - ส่วนกลาง"
  }, "01 - ส่วนกลาง"), /*#__PURE__*/React.createElement("option", {
    value: "02 - ภูมิภาค"
  }, "02 - ภูมิภาค"), /*#__PURE__*/React.createElement("option", {
    value: "03 - ลูกหนี้ตัวแทน"
  }, "03 - ลูกหนี้ตัวแทน"))), /*#__PURE__*/React.createElement(MoFld, {
    label: "วันที่ผ่านรายการ",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: postDate,
    onChange: e => setPostDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "เลือกไฟล์ .txt",
    grow: true,
    w: 240
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "file",
    accept: ".txt",
    onChange: e => {
      setFileName(e.target.files && e.target.files[0] ? e.target.files[0].name : '');
      setChecked(false);
      setDone(false);
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      marginTop: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(MoCheck, {
    label: "สถานะติดลบ",
    checked: negative,
    onChange: setNegative
  }), /*#__PURE__*/React.createElement(MoCheck, {
    label: "รับชำระลูกหนี้ตัวแทน",
    checked: agentPay,
    onChange: setAgentPay
  }))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ยอดตั้งจาก สหกรณ์",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "จำนวนรายการ",
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: checked ? window.fmt.money(totals.rows, 0) : '0',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "จำนวนเงินส่งหัก",
    w: 240
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(checked ? totals.collect : 0),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "ยอดกลับจากแผ่น Disk",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "ประเภทรายการ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150,
      textAlign: 'right'
    }
  }, "จำนวนรายการ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 180,
      textAlign: 'right'
    }
  }, "จำนวนเงินเรียกเก็บ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 180,
      textAlign: 'right'
    }
  }, "จำนวนเงินหักได้"))), /*#__PURE__*/React.createElement("tbody", null, summary.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.label
  }, /*#__PURE__*/React.createElement("td", null, r.label), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, r.rows == null ? '-' : window.fmt.money(r.rows, 0)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.collect)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.deduct))))), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 600
    }
  }, "รวมยอดกลับจาก Disk"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, window.fmt.money(totals.rows, 0)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, moMoney(totals.collect)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, moMoney(totals.deduct))))))), /*#__PURE__*/React.createElement(MoSec, {
    title: "รายละเอียดรายการ",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 54
    }
  }, "ลำดับ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120
    }
  }, "เลขสมาชิก"), /*#__PURE__*/React.createElement("th", null, "ชื่อสมาชิก"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "ยอดเรียกเก็บ DB"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "ยอดเรียกเก็บ Disk"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150
    }
  }, "ประเภทต่าง"))), /*#__PURE__*/React.createElement("tbody", null, detail.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.code
  }, /*#__PURE__*/React.createElement("td", {
    className: "muted mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.code), /*#__PURE__*/React.createElement("td", null, r.name), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.db)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.disk)), /*#__PURE__*/React.createElement("td", null, r.diff))), !detail.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 6,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกไฟล์ .txt แล้วกดตรวจสอบเพื่อแสดงรายการ")))))));
}

// ════════════════════════════════════════════════════════════════════
//  ⑦ คืนใบเสร็จ
// ════════════════════════════════════════════════════════════════════
const MO_RETURN_REASONS = ['เงินไม่พอ', 'หักเงินผิดพลาด', 'สมาชิกลาออก', 'ยกเลิกรายการเรียกเก็บ', 'อื่นๆ'];
function ReceiptReturnPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = moAudit();
  const today = moToday437();
  const [member, setMember] = useState(null);
  const [docDate, setDocDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [type, setType] = useState('MTH');
  const [month, setMonth] = useState('');
  const [reason, setReason] = useState(MO_RETURN_REASONS[0]);
  const [reasonNote, setReasonNote] = useState('');
  const [wholeReceipt, setWholeReceipt] = useState(false);
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');
  const total = rows.reduce((s, r) => s + (Number(r.thisPrincipal) || 0) + (Number(r.thisInterest) || 0), 0);
  const pickMember = m => {
    setMember(m);
    setSavedNo('');
    setError('');
    setMonth(`${MO_MONTHS[new Date().getMonth()]} ${moBE()}`);
    setRows([{
      code: 'SHR',
      label: 'หุ้นรายเดือน',
      donePrincipal: 0,
      doneInterest: 0,
      leftPrincipal: 1500,
      leftInterest: 0,
      thisPrincipal: '',
      thisInterest: ''
    }, {
      code: 'LON',
      label: 'หนี้เงินกู้สามัญ',
      donePrincipal: 0,
      doneInterest: 0,
      leftPrincipal: 8200,
      leftInterest: 1450,
      thisPrincipal: '',
      thisInterest: ''
    }, {
      code: 'EMG',
      label: 'ฉุกเฉินหักโอน',
      donePrincipal: 0,
      doneInterest: 0,
      leftPrincipal: 2000,
      leftInterest: 180,
      thisPrincipal: '',
      thisInterest: ''
    }]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const fillAll = on => {
    setWholeReceipt(on);
    setRows(rs => rs.map(r => on ? {
      ...r,
      thisPrincipal: r.leftPrincipal,
      thisInterest: r.leftInterest
    } : {
      ...r,
      thisPrincipal: '',
      thisInterest: ''
    }));
  };
  const clear = () => {
    setMember(null);
    setRows([]);
    setSavedNo('');
    setError('');
    setWholeReceipt(false);
    setMonth('');
    setReasonNote('');
    setReason(MO_RETURN_REASONS[0]);
  };
  const doSave = () => {
    if (!member) {
      setError('กรุณาระบุทะเบียนสมาชิกก่อนบันทึก');
      return;
    }
    if (total <= 0) {
      setError('กรุณาระบุยอดคืนครั้งนี้อย่างน้อย 1 รายการ');
      return;
    }
    const over = rows.find(r => (Number(r.thisPrincipal) || 0) > r.leftPrincipal || (Number(r.thisInterest) || 0) > r.leftInterest);
    if (over) {
      setError(`ยอดคืนครั้งนี้ของรายการ "${over.label}" เกินยอดคืนได้อีก`);
      return;
    }
    setError('');
    const no = `RT${moBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — คืนใบเสร็จ',
      target: `${member.code} · ${member.name}`,
      summary: `${no} · คืนใบเสร็จ ${type} ${month} รวม ${moMoney(total)} บาท — ${reason}`,
      changes: rows.filter(r => (Number(r.thisPrincipal) || 0) + (Number(r.thisInterest) || 0) > 0).map(r => ({
        field: `${r.code} · ${r.label}`,
        before: '—',
        after: moMoney((Number(r.thisPrincipal) || 0) + (Number(r.thisInterest) || 0))
      }))
    });
    onToast && onToast(`บันทึกใบคืนใบเสร็จ ${no} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "คืนใบเสร็จ"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "receipt",
    title: "คืนใบเสร็จ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 รายเดือน \u2014 ปรับปรุงคืนใบเสร็จรายการเรียกเก็บรายสมาชิก",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " บันทึก"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: clear
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " ล้างข้อมูล"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        onToast && onToast('กำลังเตรียมพิมพ์รายงานรายละเอียดสมาชิก…');
        setTimeout(() => window.print(), 80);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "print",
      size: 13
    }), " พิมพ์รายงานรายละเอียดสมาชิก"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "ข้อมูลใบปรับปรุง"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "เลขที่ใบปรับปรุง",
    w: 150
  }, (savedNo ? /*#__PURE__*/React.createElement(MoRO, {
    value: savedNo,
    mono: true
  }) : /*#__PURE__*/React.createElement("div", {
    className: "icr-ro icr-auto"
  }, "AUTO"))), /*#__PURE__*/React.createElement(MoFld, {
    label: "วันที่ใบปรับปรุง",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: docDate,
    onChange: e => setDocDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "วันที่รายการ",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: txnDate,
    onChange: e => setTxnDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ประเภทปรับปรุง",
    w: 140
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: type,
    onChange: e => setType(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "MTH"
  }, "MTH"), /*#__PURE__*/React.createElement("option", {
    value: "DAY"
  }, "DAY"), /*#__PURE__*/React.createElement("option", {
    value: "SPC"
  }, "SPC")))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "ทะเบียนสมาชิก",
    w: 260,
    required: true
  }, /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสมาชิก \u2014 คืนใบเสร็จ"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ชื่อ-ชื่อสกุล",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "ประจำเดือน",
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: month
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "เหตุผลที่ปรับปรุง",
    w: 200
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: reason,
    onChange: e => setReason(e.target.value)
  }, MO_RETURN_REASONS.map(r => /*#__PURE__*/React.createElement("option", {
    key: r,
    value: r
  }, r)))), /*#__PURE__*/React.createElement(MoFld, {
    label: "รายละเอียดเพิ่มเติม",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: reasonNote,
    disabled: !member,
    onChange: e => setReasonNote(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "คืนทั้งใบ",
    w: 120
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      height: 32
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: wholeReceipt,
    disabled: !member,
    onChange: e => fillAll(e.target.checked)
  }))), /*#__PURE__*/React.createElement(MoFld, {
    label: "ยอดคืนใบเสร็จ",
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(total),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "รายการคืนใบเสร็จ",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    style: {
      width: 70
    }
  }, "รหัส"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "รายการ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    style: {
      textAlign: 'center'
    }
  }, "ยอดคืนแล้ว"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    style: {
      textAlign: 'center'
    }
  }, "ยอดคืนได้อีก"), /*#__PURE__*/React.createElement("th", {
    colSpan: 3,
    style: {
      textAlign: 'center'
    }
  }, "ยอดคืนครั้งนี้")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "เงินต้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "ดอกเบี้ย"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "เงินต้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "ดอกเบี้ย"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120,
      textAlign: 'right'
    }
  }, "เงินต้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120,
      textAlign: 'right'
    }
  }, "ดอกเบี้ย"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130,
      textAlign: 'right'
    }
  }, "รวมปรับปรุง"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.code
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.code), /*#__PURE__*/React.createElement("td", null, r.label), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.donePrincipal)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.doneInterest)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.leftPrincipal)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney(r.leftInterest)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.thisPrincipal,
    onChange: e => {
      setWholeReceipt(false);
      updateRow(i, {
        thisPrincipal: e.target.value
      });
    }
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: r.thisInterest,
    onChange: e => {
      setWholeReceipt(false);
      updateRow(i, {
        thisInterest: e.target.value
      });
    }
  })), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, moMoney((Number(r.thisPrincipal) || 0) + (Number(r.thisInterest) || 0))))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 9,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสมาชิกเพื่อแสดงรายการที่คืนใบเสร็จได้"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "ยอดคืนใบเสร็จรวม"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, moMoney(total))))))));
}
Object.assign(window, {
  MemberPayoutPage,
  MonthlyCollectPage,
  MonthlyCutoffPage,
  CollectDiskPage,
  CollectOtherPage,
  CollectCutoffDiskPage,
  ReceiptReturnPage
});