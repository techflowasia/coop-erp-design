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
    "data-screen-label": "\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "money",
    title: "\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: addRow
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 13
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: clear
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        onToast && onToast('กำลังเตรียมพิมพ์ใบสำคัญจ่าย…');
        setTimeout(() => window.print(), 80);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "print",
      size: 13
    }), " \u0E1E\u0E34\u0E21\u0E1E\u0E4C"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E2A\u0E33\u0E04\u0E31\u0E0D",
    w: 150
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: savedNo,
    mono: true,
    placeholder: "Auto"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E08\u0E48\u0E32\u0E22",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: payDate,
    onChange: e => setPayDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: txnDate,
    onChange: e => setTxnDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22",
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
    label: "\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    w: 260,
    required: true
  }, /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E01\u0E38\u0E25",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.name : '',
    placeholder: "(\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01)"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? `${member.departmentCode || ''} - ${member.department || ''}`.trim() : ''
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19",
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
    label: "\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23",
    grow: true,
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: bank,
    disabled: isCash,
    onChange: e => setBank(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E2A\u0E32\u0E02\u0E32",
    grow: true,
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: branch,
    disabled: isCash,
    onChange: e => setBranch(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    grow: true,
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: accountNo,
    disabled: isCash,
    onChange: e => setAccountNo(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E04\u0E39\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    grow: true,
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: pairAccount,
    onChange: e => setPairAccount(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E07\u0E34\u0E19\u0E23\u0E31\u0E1A\u0E2A\u0E38\u0E17\u0E18\u0E34",
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(net),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E04\u0E37\u0E19",
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
  }), /*#__PURE__*/React.createElement("th", null, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E07\u0E34\u0E19\u0E04\u0E37\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "\u0E15\u0E49\u0E19\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("th", {
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
    placeholder: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E07\u0E34\u0E19\u0E04\u0E37\u0E19"
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
    className: "btn sm danger",
    onClick: () => removeRow(i)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 12
  }), " \u0E25\u0E1A")))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 6,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E04\u0E37\u0E19"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 4,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "\u0E40\u0E07\u0E34\u0E19\u0E23\u0E31\u0E1A\u0E2A\u0E38\u0E17\u0E18\u0E34"), /*#__PURE__*/React.createElement("td", {
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
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "cog",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "cog",
      size: 13
    }), " \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setSystems([]);
        setResult(null);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))
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
  }, "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E07\u0E27\u0E14 ", /*#__PURE__*/React.createElement("b", null, month, " ", year), " \u0E08\u0E33\u0E19\u0E27\u0E19 ", /*#__PURE__*/React.createElement("b", null, result.count), " \u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19 \u0E40\u0E27\u0E25\u0E32 ", result.at, " \u0E19.")), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: year,
    onChange: e => setYear(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    w: 170
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: month,
    onChange: e => setMonth(e.target.value)
  }, MO_MONTHS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: m
  }, m)))), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E25\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: receiptDate,
    onChange: e => setReceiptDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E14/\u0E1A \u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: interestDate,
    onChange: e => setInterestDate(e.target.value)
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E0A\u0E48\u0E27\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
    style: {
      marginTop: 12
    },
    hint: "\u0E43\u0E2A\u0E48\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E48\u0E27\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E04\u0E31\u0E48\u0E19\u0E14\u0E49\u0E27\u0E22\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22 - \u0E2B\u0E23\u0E37\u0E2D , \u0E40\u0E0A\u0E48\u0E19 11010, 11020, 11000 - 11020"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E0A\u0E48\u0E27\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: range,
    onChange: e => setRange(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"
  }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /*#__PURE__*/React.createElement("option", {
    value: "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14"
  }, "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14"), /*#__PURE__*/React.createElement("option", {
    value: "\u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"
  }, "\u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01")))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
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
    label: "\u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: byMember,
    disabled: range !== 'ตามเลขสมาชิก',
    onChange: e => setByMember(e.target.value)
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(MoCheckGrid, {
    items: MO_COLLECT_SYSTEMS,
    value: systems,
    onToggle: toggle,
    extra: /*#__PURE__*/React.createElement(MoCheck, {
      label: "\u0E43\u0E2A\u0E48\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 \u0E40\u0E23\u0E34\u0E48\u0E21\u0E17\u0E35\u0E48",
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
    title: "\u0E01\u0E32\u0E23\u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A",
    grow: true,
    w: 320
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: clearMode,
    onChange: e => setClearMode(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"
  }, "\u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21\u0E17\u0E31\u0E49\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /*#__PURE__*/React.createElement("option", {
    value: "\u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25"
  }, "\u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: run
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cog",
    size: 14
  }), " \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25")));
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
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "cog",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "cog",
      size: 13
    }), " \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setSystems([]);
        setResult(null);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))
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
  }, "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E07\u0E27\u0E14 ", /*#__PURE__*/React.createElement("b", null, month, " ", year), " \u0E08\u0E33\u0E19\u0E27\u0E19 ", /*#__PURE__*/React.createElement("b", null, result.count), " \u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19 \u0E40\u0E27\u0E25\u0E32 ", result.at, " \u0E19.")), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: year,
    onChange: e => setYear(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    w: 200
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: month,
    onChange: e => setMonth(e.target.value)
  }, MO_MONTHS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: m
  }, m)))))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E0A\u0E48\u0E27\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14",
    style: {
      marginTop: 12
    },
    hint: "\u0E43\u0E2A\u0E48\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E48\u0E27\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E04\u0E31\u0E48\u0E19\u0E14\u0E49\u0E27\u0E22\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22 - \u0E2B\u0E23\u0E37\u0E2D , \u0E40\u0E0A\u0E48\u0E19 11010, 11020, 11000 - 11020"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E0A\u0E48\u0E27\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: range,
    onChange: e => setRange(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"
  }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /*#__PURE__*/React.createElement("option", {
    value: "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14"
  }, "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14"), /*#__PURE__*/React.createElement("option", {
    value: "\u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"
  }, "\u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01")))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
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
    label: "\u0E15\u0E32\u0E21\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: byMember,
    disabled: range !== 'ตามเลขสมาชิก',
    onChange: e => setByMember(e.target.value)
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(MoCheckGrid, {
    items: MO_CUTOFF_SYSTEMS,
    value: systems,
    onToggle: toggle
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: run
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cog",
    size: 14
  }), " \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25")));
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
  const [prog, setProg] = useState(null); // { done, total } ระหว่างประมวลผล
  const [stopped, setStopped] = useState(null); // { done, total } เมื่อผู้ใช้กดหยุด
  const [error, setError] = useState('');
  const timerRef = React.useRef(null);
  React.useEffect(() => () => clearInterval(timerRef.current), []);
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
    setProg(null);
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
    if (prog) return;
    setError('');
    setResult(null);
    setStopped(null);
    setProg({
      done: 0,
      total: TOTAL
    });
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProg(p => {
        if (!p) return p;
        const done = Math.min(p.total, p.done + Math.ceil(p.total / 45));
        if (done >= p.total) {
          clearInterval(timerRef.current);
          setTimeout(finish, 250);
        }
        return {
          ...p,
          done
        };
      });
    }, 110);
  };
  const stop = () => {
    clearInterval(timerRef.current);
    setProg(p => {
      if (p) setStopped({
        done: p.done,
        total: p.total
      });
      return null;
    });
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ขึ้นแผ่นจัดเก็บ',
      target: `งวด ${period}`,
      summary: `หยุดการประมวลผลขึ้นแผ่นจัดเก็บ งวด ${period} โดยผู้ใช้`
    });
    onToast && onToast('หยุดการประมวลผลแล้ว — ยังไม่ได้สร้างแผ่นจัดเก็บ');
  };
  const fileBase = `CLT${period}_${groupCode}`.replace(/[^\w\u0E00-\u0E7F.-]/g, '');
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
  const pct = prog ? Math.round(prog.done / prog.total * 100) : 0;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "database",
    title: "\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2A\u0E48\u0E07\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19"
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E07\u0E27\u0E14",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: period,
    onChange: e => setPeriod(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: receiptDate,
    onChange: e => setReceiptDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E25\u0E38\u0E48\u0E21\u0E01\u0E32\u0E23\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1C\u0E48\u0E19",
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
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014"), MO_DISK_GROUPS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g,
    value: g
  }, g)))), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
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
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014"), MO_DISK_FORMATS.map(x => /*#__PURE__*/React.createElement("option", {
    key: x,
    value: x
  }, x)))), /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      width: 'auto'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, "\xA0"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: run,
    disabled: !!prog
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cog",
    size: 13
  }), " \u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")))), stopped && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "\u0E2B\u0E22\u0E38\u0E14\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E44\u0E1B ", window.fmt.money(stopped.done, 0), " / ", window.fmt.money(stopped.total, 0), " \u0E23\u0E2B\u0E31\u0E2A \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \u0E01\u0E14 ", /*#__PURE__*/React.createElement("b", null, "\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), " \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E43\u0E2B\u0E21\u0E48")), result && /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E2A\u0E23\u0E38\u0E1B\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A",
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
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07\u0E41\u0E1C\u0E48\u0E19 Text (.txt)"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: saveXls
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07\u0E41\u0E1C\u0E48\u0E19 Excel (.xlsx)"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E2B\u0E31\u0E2A",
    w: 150
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: window.fmt.money(result.rows, 0),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E2B\u0E38\u0E49\u0E19\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19",
    w: 170
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.share),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E2B\u0E19\u0E35\u0E49\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49",
    w: 170
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.loan),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19\u0E46",
    w: 160
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.other),
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E23\u0E27\u0E21\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A",
    grow: true,
    w: 180
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(result.total),
    num: true,
    mono: true
  })))), prog && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop"
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: 480,
      maxWidth: '95vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cog"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E02\u0E36\u0E49\u0E19\u0E41\u0E1C\u0E48\u0E19\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 1
    }
  }, "\u0E07\u0E27\u0E14 ", period, " \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21 ", groupCode, " \xB7 ", format))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body",
    role: "status",
    "aria-live": "polite"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5
    }
  }, "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 18,
      fontWeight: 700
    }
  }, window.fmt.money(prog.done, 0)), /*#__PURE__*/React.createElement("span", {
    className: "mono muted",
    style: {
      fontSize: 13
    }
  }, "/ ", window.fmt.money(prog.total, 0), " \u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("span", {
    className: "spacer",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, pct, "%")), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-valuenow": pct,
    style: {
      height: 10,
      borderRadius: 5,
      background: '#E8EBEE',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      background: 'var(--primary, #237450)',
      borderRadius: 5,
      transition: 'width .1s linear'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 10
    }
  }, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E1B\u0E34\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25")), /*#__PURE__*/React.createElement("div", {
    className: "dba-drawer-foot",
    style: {
      position: 'static'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn danger",
    onClick: stop
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 13
  }), " \u0E2B\u0E22\u0E38\u0E14\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25")))));
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
    "data-screen-label": "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19\u0E46"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "receipt",
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19\u0E46",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19\u0E46 \u0E23\u0E32\u0E22\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: addRow
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 13
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setMember(null);
        setRows([]);
        setError('');
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19\u0E46"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    w: 260,
    required: true
  }, /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E2D\u0E37\u0E48\u0E19\u0E46"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.name : '',
    placeholder: "(\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01)"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    w: 160
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.memberType : ''
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
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
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 190
    }
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 230
    }
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "\u0E1B\u0E35/\u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("th", null, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150,
      textAlign: 'right'
    }
  }, "\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("th", {
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
    value: "\u0E40\u0E01\u0E47\u0E1A\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"
  }, "\u0E40\u0E01\u0E47\u0E1A\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"), /*#__PURE__*/React.createElement("option", {
    value: "\u0E40\u0E01\u0E47\u0E1A\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"
  }, "\u0E40\u0E01\u0E47\u0E1A\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
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
    className: "btn sm danger",
    onClick: () => removeRow(i)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 12
  }), " \u0E25\u0E1A")))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "\u0E23\u0E27\u0E21\u0E22\u0E2D\u0E14\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("td", {
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
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27"))));
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
    "data-screen-label": "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E48\u0E19"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "database",
    title: "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E48\u0E19",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E19\u0E33\u0E44\u0E1F\u0E25\u0E4C\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E48\u0E19 Disk \u0E21\u0E32\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: doCheck
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 13
    }), " \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A"), /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doCutoff
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14"))
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
  }, "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E07\u0E27\u0E14 ", /*#__PURE__*/React.createElement("b", null, period), " \u0E08\u0E33\u0E19\u0E27\u0E19 ", /*#__PURE__*/React.createElement("b", null, window.fmt.money(totals.rows, 0)), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 \u0E2B\u0E31\u0E01\u0E44\u0E14\u0E49 ", /*#__PURE__*/React.createElement("b", null, moMoney(totals.deduct)), " \u0E1A\u0E32\u0E17")), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E08\u0E30\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E35",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: period,
    onChange: e => setPeriod(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: group,
    onChange: e => setGroup(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014"), /*#__PURE__*/React.createElement("option", {
    value: "01 - \u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07"
  }, "01 - \u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07"), /*#__PURE__*/React.createElement("option", {
    value: "02 - \u0E20\u0E39\u0E21\u0E34\u0E20\u0E32\u0E04"
  }, "02 - \u0E20\u0E39\u0E21\u0E34\u0E20\u0E32\u0E04"), /*#__PURE__*/React.createElement("option", {
    value: "03 - \u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19"
  }, "03 - \u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19"))), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: postDate,
    onChange: e => setPostDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C .txt",
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
    label: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E15\u0E34\u0E14\u0E25\u0E1A",
    checked: negative,
    onChange: setNegative
  }), /*#__PURE__*/React.createElement(MoCheck, {
    label: "\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19",
    checked: agentPay,
    onChange: setAgentPay
  }))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E49\u0E07\u0E08\u0E32\u0E01 \u0E2A\u0E2B\u0E01\u0E23\u0E13\u0E4C",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: checked ? window.fmt.money(totals.rows, 0) : '0',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E48\u0E07\u0E2B\u0E31\u0E01",
    w: 240
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(checked ? totals.collect : 0),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E22\u0E2D\u0E14\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E48\u0E19 Disk",
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
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150,
      textAlign: 'right'
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 180,
      textAlign: 'right'
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 180,
      textAlign: 'right'
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19\u0E2B\u0E31\u0E01\u0E44\u0E14\u0E49"))), /*#__PURE__*/React.createElement("tbody", null, summary.map(r => /*#__PURE__*/React.createElement("tr", {
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
  }, "\u0E23\u0E27\u0E21\u0E22\u0E2D\u0E14\u0E01\u0E25\u0E31\u0E1A\u0E08\u0E32\u0E01 Disk"), /*#__PURE__*/React.createElement("td", {
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
    title: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
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
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120
    }
  }, "\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"), /*#__PURE__*/React.createElement("th", null, "\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "\u0E22\u0E2D\u0E14\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A DB"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160,
      textAlign: 'right'
    }
  }, "\u0E22\u0E2D\u0E14\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A Disk"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150
    }
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E15\u0E48\u0E32\u0E07"))), /*#__PURE__*/React.createElement("tbody", null, detail.map((r, i) => /*#__PURE__*/React.createElement("tr", {
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
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C .txt \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")))))));
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
    "data-screen-label": "\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"
  }, /*#__PURE__*/React.createElement(MoHead, {
    icon: "receipt",
    title: "\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2014 \u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E01\u0E40\u0E01\u0E47\u0E1A\u0E23\u0E32\u0E22\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: clear
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        onToast && onToast('กำลังเตรียมพิมพ์รายงานรายละเอียดสมาชิก…');
        setTimeout(() => window.print(), 80);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "print",
      size: 13
    }), " \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E1A\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07",
    w: 150
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: savedNo,
    mono: true,
    placeholder: "Auto"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: docDate,
    onChange: e => setDocDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: txnDate,
    onChange: e => setTxnDate(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07",
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
    label: "\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    w: 260,
    required: true
  }, /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E01\u0E38\u0E25",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: member ? member.name : '',
    placeholder: "(\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01)"
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: month
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07",
    w: 200
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: reason,
    onChange: e => setReason(e.target.value)
  }, MO_RETURN_REASONS.map(r => /*#__PURE__*/React.createElement("option", {
    key: r,
    value: r
  }, r)))), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: reasonNote,
    disabled: !member,
    onChange: e => setReasonNote(e.target.value)
  })), /*#__PURE__*/React.createElement(MoFld, {
    label: "\u0E04\u0E37\u0E19\u0E17\u0E31\u0E49\u0E07\u0E43\u0E1A",
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
    label: "\u0E22\u0E2D\u0E14\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    w: 200
  }, /*#__PURE__*/React.createElement(MoRO, {
    value: moMoney(total),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(MoSec, {
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
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
  }, "\u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    style: {
      textAlign: 'center'
    }
  }, "\u0E22\u0E2D\u0E14\u0E04\u0E37\u0E19\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    style: {
      textAlign: 'center'
    }
  }, "\u0E22\u0E2D\u0E14\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E35\u0E01"), /*#__PURE__*/React.createElement("th", {
    colSpan: 3,
    style: {
      textAlign: 'center'
    }
  }, "\u0E22\u0E2D\u0E14\u0E04\u0E37\u0E19\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "\u0E40\u0E07\u0E34\u0E19\u0E15\u0E49\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "\u0E40\u0E07\u0E34\u0E19\u0E15\u0E49\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, "\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120,
      textAlign: 'right'
    }
  }, "\u0E40\u0E07\u0E34\u0E19\u0E15\u0E49\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120,
      textAlign: 'right'
    }
  }, "\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130,
      textAlign: 'right'
    }
  }, "\u0E23\u0E27\u0E21\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
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
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E44\u0E14\u0E49"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "\u0E22\u0E2D\u0E14\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E27\u0E21"), /*#__PURE__*/React.createElement("td", {
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