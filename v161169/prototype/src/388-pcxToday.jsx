// ════════════════════════════════════════════════════════════════════
//  ระบบงานประมวลผลและจัดเก็บ › สินเชื่อ
//  4 หน้าจอใหม่:
//    · อนุมัติเปลี่ยนแปลงงวดชำระ  (process/inst-approve)
//    · ปรับยอดดอกเบี้ยสะสม        (process/accrued-interest-adjust)
//    · ปรับเพิ่ม-ลด หุ้น           (process/share-adjust)
//    · ปรับเพิ่ม-ลดหนี้            (process/debt-adjust)
//  ใช้สมาชิก/สัญญาจาก window.DN_MEMBERS · MemberSearchField / ContractSearchField
// ════════════════════════════════════════════════════════════════════

const pcxToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const pcxBE = () => new Date().getFullYear() + 543;
const pcxAudit = () => React.useContext(window.AuditContext || React.createContext({
  log: () => {}
}));
const pcxMoney = (v, d) => window.fmt.money(Number(v) || 0, d === undefined ? 2 : d);
function PcxFld({
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
function PcxRO({
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
function PcxHead({
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
    name: icon || 'edit',
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, actions));
}
function PcxSec({
  title,
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
    className: "pc-sec-actions"
  }, actions)), children);
}
// ฟิลด์ในกริด 7 คอลัมน์ (label ด้านบน) · span = จำนวนคอลัมน์
function PcxG({
  label,
  span,
  required,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      minWidth: 0,
      gridColumn: span ? `span ${span}` : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, " *")), children);
}
// เลขที่เอกสารอัตโนมัติ — กล่องเหลือง AUTO จนกว่าจะบันทึก
const pcxDocNo = no => no ? /*#__PURE__*/React.createElement(PcxRO, {
  value: no,
  mono: true
}) : /*#__PURE__*/React.createElement("div", {
  className: "icr-ro icr-auto"
}, "AUTO");
// ปุ่มลบแถว — แบบเดียวกับระบบสินเชื่อ
const pcxDelBtn = onClick => /*#__PURE__*/React.createElement("button", {
  type: "button",
  className: "act-del",
  title: "ลบ",
  "aria-label": "ลบ",
  onClick: onClick
}, /*#__PURE__*/React.createElement(Icon, {
  name: "trash",
  size: 13
}));
// ปุ่ม "เพิ่มข้อมูล" มุมขวาของหัวการ์ด
const pcxAddBtn = onClick => /*#__PURE__*/React.createElement("button", {
  type: "button",
  className: "btn primary sm",
  onClick: onClick
}, /*#__PURE__*/React.createElement(Icon, {
  name: "plus",
  size: 13
}), " เพิ่มข้อมูล");
// ช่องวันที่ พ.ศ. แบบระบบสินเชื่อ
const pcxDate = (value, onChange) => window.ErpDate ? /*#__PURE__*/React.createElement(window.ErpDate, {
  value: value,
  onChange: onChange
}) : /*#__PURE__*/React.createElement("input", {
  className: "cfg-input",
  type: "date",
  value: value,
  onChange: e => onChange(e.target.value)
});

// ════════════════════════════════════════════════════════════════════
//  ② ปรับยอดดอกเบี้ยสะสม
// ════════════════════════════════════════════════════════════════════
function AccruedInterestAdjustPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [addAmt, setAddAmt] = useState(''); // ยอดปรับเพิ่ม
  const [subAmt, setSubAmt] = useState(''); // ยอดปรับลด
  const [note, setNote] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [pcEditing, setPcEditing] = React.useState(false);
  const [error, setError] = useState('');
  const contracts = member ? member.debts || [] : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const before = contract ? Number(contract.interestDue) || 0 : 0;
  const adjust = (Number(addAmt) || 0) - (Number(subAmt) || 0);
  const after = before + adjust;
  const load = (m, debt) => {
    setMember(m);
    setContractNo(debt.contractNo);
    setAddAmt('');
    setSubAmt('');
    setNote('');
    setSavedNo('');
    setError('');
  };
  const clear = () => {
    setMember(null);
    setContractNo('');
    setAddAmt('');
    setSubAmt('');
    setNote('');
    setSavedNo('');
    setError('');
  };
  const doSave = () => {
    if (!member || !contract) {
      setError('กรุณาเลือกทะเบียนสมาชิกและสัญญาก่อนบันทึก');
      return false;
    }
    if (Number(addAmt) < 0 || Number(subAmt) < 0) {
      setError('ยอดปรับเพิ่ม / ยอดปรับลด ต้องไม่ติดลบ');
      return false;
    }
    if (!(Number(addAmt) > 0) && !(Number(subAmt) > 0)) {
      setError('กรุณาระบุยอดปรับเพิ่ม หรือยอดปรับลด');
      return false;
    }
    if (after < 0) {
      setError('ยอดใหม่ต้องไม่น้อยกว่า 0');
      return false;
    }
    if (!note.trim()) {
      setError('กรุณาระบุหมายเหตุ / เหตุผลการปรับยอด');
      return false;
    }
    setError('');
    const no = `AI${pcxBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ประมวลผลและจัดเก็บ — ปรับยอดดอกเบี้ยสะสม',
      target: `${member.code} · ${member.name} · ${contractNo}`,
      summary: `${no} · ปรับยอดดอกเบี้ยสะสม ${pcxMoney(before)} → ${pcxMoney(after)} บาท`,
      changes: [{
        field: 'ยอดดอกเบี้ยสะสม',
        before: pcxMoney(before),
        after: pcxMoney(after)
      }, {
        field: 'ยอดปรับเพิ่ม',
        before: '—',
        after: pcxMoney(addAmt)
      }, {
        field: 'ยอดปรับลด',
        before: '—',
        after: pcxMoney(subAmt)
      }, {
        field: 'หมายเหตุ',
        before: '—',
        after: note
      }]
    });
    onToast && onToast(`ปรับยอดดอกเบี้ยสะสมสัญญา ${contractNo} เรียบร้อยแล้ว (${no})`);
    return true;
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ปรับยอดดอกเบี้ยสะสม",
    className: pcEditing ? undefined : 'pc-locked'
  }, /*#__PURE__*/React.createElement(PcxHead, {
    icon: "money",
    title: "ปรับยอดดอกเบี้ยสะสม",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 ปรับยอดดอกเบี้ยสะสมของสัญญาเงินกู้ พร้อมบันทึกเหตุผล",
    actions: /*#__PURE__*/React.createElement(window.PcEditActions, {
      recordKey: member && contractNo ? 'ai.' + contractNo : '',
      editing: pcEditing,
      setEditing: setPcEditing,
      onSave: doSave,
      onDiscard: () => { const d = contracts.find(x => x.contractNo === contractNo); d && load(member, d); },
      title: "ปรับยอดดอกเบี้ยสะสม"
    })
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(PcxSec, {
    title: "ข้อมูลสมาชิกและสัญญา"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-grid7"
  }, /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขสมาชิก / เลขที่สัญญา",
    span: 2,
    required: true
  }, /*#__PURE__*/React.createElement(window.ErpContractPicker || ContractSearchField, {
    contract: contractNo,
    member: member,
    source: window.DN_MEMBERS,
    onPick: ({
      member: m,
      debt
    }) => load(m, debt),
    title: "ค้นหาสัญญาเงินกู้ — ปรับยอดดอกเบี้ยสะสม",
    placeholder: "เลขสมาชิก หรือเลขที่สัญญา…"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชื่อ-ชื่อสกุล"
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ประเภทเงินกู้",
    span: 2
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: contract ? contract.type : ''
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่เปลี่ยน"
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: window.fmt.date(today),
    mono: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ผู้ทำรายการ"
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: window.LOGIN_USER.name
  })))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "ยอดดอกเบี้ยสะสม",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-grid7"
  }, /*#__PURE__*/React.createElement(PcxG, {
    label: "ก่อนเปลี่ยนแปลง — ยอดเดิม",
    span: 2
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: contract ? pcxMoney(before) : '',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ยอดปรับเพิ่ม"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    step: "0.01",
    value: addAmt,
    disabled: !contract,
    style: {
      textAlign: 'right'
    },
    onChange: e => {
      setAddAmt(e.target.value);
      setError('');
    },
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ยอดปรับลด"
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    type: "number",
    min: "0",
    step: "0.01",
    value: subAmt,
    disabled: !contract,
    style: {
      textAlign: 'right'
    },
    onChange: e => {
      setSubAmt(e.target.value);
      setError('');
    },
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "หลังเปลี่ยนแปลง — ยอดใหม่",
    span: 3
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: contract ? pcxMoney(after) : '',
    num: true,
    mono: true,
    danger: after < 0
  })))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "หมายเหตุ",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-note-wrap"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 4,
    value: note,
    maxLength: 500,
    disabled: !contract,
    onChange: e => setNote(e.target.value),
    placeholder: "ระบุเหตุผลการปรับยอดดอกเบี้ยสะสม เช่น ปรับตามการคำนวณดอกเบี้ยใหม่ตามมติที่ประชุม"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-note-count"
  }, note.length, "/500"))));
}

// ════════════════════════════════════════════════════════════════════
//  ③ ปรับเพิ่ม-ลด หุ้น
// ════════════════════════════════════════════════════════════════════
function ShareAdjustPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [docDate, setDocDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [mode, setMode] = useState('add'); // add | sub
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [pcEditing, setPcEditing] = React.useState(false);
  const [error, setError] = useState('');
  const sign = mode === 'add' ? 1 : -1;
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const [amtErr, setAmtErr] = useState({});
  const pickMember = m => {
    setMember(m);
    setSavedNo('');
    setError('');
    setReason('');
    setAmtErr({});
    setRows([{
      code: 'SH-01',
      label: 'หุ้นสามัญ',
      amount: '',
      base: Number(m.shares) || 0
    }]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const addRow = () => {
    if (!member) {
      setError('กรุณาเลือกทะเบียนสมาชิกก่อนเพิ่มรายการ');
      return;
    }
    setRows(rs => [...rs, {
      code: '',
      label: '',
      amount: '',
      base: 0
    }]);
  };
  const removeRow = i => {
    setRows(rs => rs.filter((_, idx) => idx !== i));
    setAmtErr({});
  };
  const clear = () => {
    setAmtErr({});
    setMember(null);
    setRows([]);
    setReason('');
    setSavedNo('');
    setMode('add');
    setError('');
    setDocDate(today);
    setTxnDate(today);
  };
  const doSave = () => {
    if (!member) {
      setError('กรุณาระบุทะเบียนสมาชิกก่อนบันทึก');
      return false;
    }
    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผลที่ปรับปรุง');
      return false;
    }
    const badAmt = {};
    rows.forEach((r, i) => {
      if (!(Number(r.amount) > 0)) badAmt[i] = 'ยอดต้องมากกว่า 0';
    });
    setAmtErr(badAmt);
    if (Object.keys(badAmt).length) {
      setError('ยอดปรับปรุงต้องมากกว่า 0 ทุกรายการ');
      return false;
    }
    if (!rows.length || total === 0) {
      setError('กรุณาระบุรายการและยอดปรับปรุงอย่างน้อย 1 รายการ');
      return false;
    }
    const bad = rows.find(r => sign < 0 && (Number(r.amount) || 0) > (Number(r.base) || 0));
    if (bad) {
      setError(`ยอดปรับลดของรายการ "${bad.label || bad.code || '(รายการใหม่)'}" เกินยอดคงเหลือ`);
      return false;
    }
    setError('');
    const no = `SA${pcxBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ประมวลผลและจัดเก็บ — ปรับเพิ่ม-ลด หุ้น',
      target: `${member.code} · ${member.name}`,
      summary: `${no} · ${mode === 'add' ? 'ปรับปรุงเพิ่ม' : 'ปรับปรุงลด'}หุ้นรวม ${pcxMoney(total)} บาท — ${reason}`,
      changes: rows.map(r => ({
        field: `${r.code || '—'} · ${r.label || '—'}`,
        before: pcxMoney(r.base),
        after: pcxMoney((Number(r.base) || 0) + sign * (Number(r.amount) || 0))
      }))
    });
    onToast && onToast(`บันทึกใบปรับปรุงหุ้น ${no} เรียบร้อยแล้ว`);
    return true;
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ปรับเพิ่ม-ลด หุ้น",
    className: pcEditing ? undefined : 'pc-locked'
  }, /*#__PURE__*/React.createElement(PcxHead, {
    icon: "shares",
    title: "ปรับเพิ่ม-ลด หุ้น",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 ใบปรับปรุงยอดหุ้นของสมาชิก (เพิ่ม / ลด)",
    actions: /*#__PURE__*/React.createElement(window.PcEditActions, {
      recordKey: member ? 'sh.' + member.code : '',
      editing: pcEditing,
      setEditing: setPcEditing,
      onSave: doSave,
      onDiscard: () => pickMember(member),
      title: "ปรับเพิ่ม-ลด หุ้น"
    })
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(PcxSec, {
    title: "ข้อมูลใบปรับปรุง"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-grid7"
  }, /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขที่ใบปรับปรุง"
  }, pcxDocNo(savedNo)), /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขสมาชิก",
    required: true
  }, window.ErpMemberPicker ? /*#__PURE__*/React.createElement(window.ErpMemberPicker, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    codeOnly: true,
    title: "ค้นหาสมาชิก — ปรับเพิ่ม-ลด หุ้น",
    placeholder: "ค้นหาเลขสมาชิก…"
  }) : /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสมาชิก — ปรับเพิ่ม-ลด หุ้น"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชื่อ-ชื่อสกุล"
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่ใบปรับปรุง"
  }, pcxDate(docDate, setDocDate)), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่รายการ"
  }, pcxDate(txnDate, setTxnDate)), /*#__PURE__*/React.createElement(PcxG, {
    label: "ประเภทปรับปรุง",
    span: 2
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: mode,
    onChange: e => setMode(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "add"
  }, "ปรับปรุงเพิ่ม"), /*#__PURE__*/React.createElement("option", {
    value: "sub"
  }, "ปรับปรุงลด"))), /*#__PURE__*/React.createElement(PcxG, {
    label: "เหตุผลที่ปรับปรุง",
    span: 5,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: reason,
    disabled: !member,
    onChange: e => {
      setReason(e.target.value);
      setError('');
    },
    placeholder: "เช่น ปรับปรุงยอดหุ้นตามมติที่ประชุมคณะกรรมการ"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ยอดปรับปรุงรวม",
    span: 2
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: pcxMoney(total),
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "รายการปรับปรุง",
    actions: pcxAddBtn(addRow),
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10
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
  }), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }, "รหัส"), /*#__PURE__*/React.createElement("th", null, "รายการ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 170,
      textAlign: 'right'
    }
  }, "ยอดปรับปรุง"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 170,
      textAlign: 'right'
    }
  }, "คงเหลือ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 70
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    className: "muted mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.code,
    onChange: e => updateRow(i, {
      code: e.target.value
    }),
    placeholder: "SH-xx"
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.label,
    onChange: e => updateRow(i, {
      label: e.target.value
    }),
    placeholder: "ชื่อรายการหุ้น"
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right',
      ...(amtErr[i] ? {
        borderColor: 'var(--danger, #ff4d4f)'
      } : null)
    },
    value: r.amount,
    placeholder: "0.00",
    onChange: e => {
      updateRow(i, {
        amount: e.target.value
      });
      setAmtErr(m => {
        const n = {
          ...m
        };
        delete n[i];
        return n;
      });
    }
  }), amtErr[i] && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--danger, #ff4d4f)',
      fontSize: 11,
      marginTop: 2,
      textAlign: 'right'
    }
  }, amtErr[i])), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney((Number(r.base) || 0) + sign * (Number(r.amount) || 0))), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, pcxDelBtn(() => removeRow(i))))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 6,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสมาชิกเพื่อเริ่มบันทึกรายการปรับปรุง"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 3,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "รวม"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, pcxMoney(total)), /*#__PURE__*/React.createElement("td", {
    colSpan: 2
  })))))));
}

// ════════════════════════════════════════════════════════════════════
//  ④ ปรับเพิ่ม-ลดหนี้
// ════════════════════════════════════════════════════════════════════
const PCX_DEBT_TYPES = [{
  v: 'INS',
  l: 'INS-ปรับเบี้ยประกัน'
}, {
  v: 'CPL',
  l: 'CPL-ปรับเพิ่มหนี้'
}, {
  v: 'CMN',
  l: 'CMN-ปรับลดหนี้'
}, {
  v: 'CPN',
  l: 'CPN-ปรับเพิ่มหนี้ ไม่รับการชำระ'
},
// ไม่มีผลกับดอกเบี้ยสะสม
{
  v: 'CMX',
  l: 'CMX-ปรับลดหนี้ ไม่รับการชำระ'
},
// ไม่มีผลกับดอกเบี้ยสะสม
{
  v: 'WIN',
  l: 'WIN-wave ดอกเบี้ย'
}, {
  v: 'IAS',
  l: 'IAS-ตั้งเบี้ยค้าง'
}, {
  v: 'LGD',
  l: 'LGD-ลดตัวแทน (อย่าเพิ่งใช้-เพิ่มหนี้)'
}, {
  v: 'LGU',
  l: 'LGU-เพิ่มตัวแทน (อย่าเพิ่งใช้-ลดหนี้)'
}];
const PCX_APPROVE_MODES = [{
  v: 'none',
  l: 'ไม่ปรับยอดอนุมัติ'
}, {
  v: 'adjust',
  l: 'ปรับปรุงยอดอนุมัติ'
}];
function DebtAdjustPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [docDate, setDocDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [type, setType] = useState('INS');
  const [approveMode, setApproveMode] = useState('none');
  const [dataset, setDataset] = useState('');
  const [reason, setReason] = useState('');
  const [fireIns, setFireIns] = useState(false);
  const [projIns, setProjIns] = useState(false);
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [pcEditing, setPcEditing] = React.useState(false);
  const [error, setError] = useState('');
  const total = rows.reduce((s, r) => s + (Number(r.principal) || 0) + (Number(r.interest) || 0), 0);
  const load = (m, debt) => {
    setMember(m);
    setContractNo(debt.contractNo);
    setSavedNo('');
    setError('');
    setReason('');
    setRows([{
      code: 'PRN',
      label: `เงินต้นคงเหลือ · ${debt.type}`,
      dueTo: debt.dueDate || today,
      principal: '',
      interest: '',
      base: Number(debt.principalRemaining) || 0
    }, {
      code: 'INT',
      label: 'ดอกเบี้ยค้างชำระ',
      dueTo: debt.dueDate || today,
      principal: '',
      interest: '',
      base: Number(debt.interestDue) || 0
    }]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const addRow = () => {
    if (!contractNo) {
      setError('กรุณาเลือกสัญญาก่อนเพิ่มรายการ');
      return;
    }
    setRows(rs => [...rs, {
      code: '',
      label: '',
      dueTo: today,
      principal: '',
      interest: '',
      base: 0
    }]);
  };
  const removeRow = i => setRows(rs => rs.filter((_, idx) => idx !== i));
  const clear = () => {
    setMember(null);
    setContractNo('');
    setRows([]);
    setReason('');
    setSavedNo('');
    setType('INS');
    setApproveMode('none');
    setDataset('');
    setFireIns(false);
    setProjIns(false);
    setDocDate(today);
    setTxnDate(today);
    setError('');
  };
  const doSave = () => {
    if (!member || !contractNo) {
      setError('กรุณาเลือกทะเบียนสมาชิกและสัญญาก่อนบันทึก');
      return false;
    }
    if (!reason.trim()) {
      setError('กรุณาระบุเหตุผลที่ปรับปรุง');
      return false;
    }
    if (total === 0) {
      setError('กรุณาระบุยอดปรับปรุง (เงินต้น หรือ ดอกเบี้ย) อย่างน้อย 1 รายการ');
      return false;
    }
    setError('');
    const no = `DA${pcxBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    const t = PCX_DEBT_TYPES.find(o => o.v === type);
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ประมวลผลและจัดเก็บ — ปรับเพิ่ม-ลดหนี้',
      target: `${member.code} · ${member.name} · ${contractNo}`,
      summary: `${no} · ${t ? t.l : type} · ยอดปรับปรุงรวม ${pcxMoney(total)} บาท — ${reason}`,
      changes: [...rows.filter(r => Number(r.principal) || 0 || Number(r.interest) || 0).map(r => ({
        field: `${r.code || '—'} · ${r.label || '—'}`,
        before: pcxMoney(r.base),
        after: pcxMoney((Number(r.base) || 0) + (Number(r.principal) || 0) + (Number(r.interest) || 0))
      }))]
    });
    onToast && onToast(`บันทึกใบปรับปรุงหนี้ ${no} (สัญญา ${contractNo}) เรียบร้อยแล้ว`);
    return true;
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ปรับเพิ่ม-ลดหนี้",
    className: pcEditing ? undefined : 'pc-locked'
  }, /*#__PURE__*/React.createElement(PcxHead, {
    icon: "money",
    title: "ปรับเพิ่ม-ลดหนี้",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 ใบปรับปรุงยอดหนี้ เงินต้น ดอกเบี้ย และเบี้ยประกันของสัญญา",
    actions: /*#__PURE__*/React.createElement(window.PcEditActions, {
      recordKey: member && contractNo ? 'db.' + contractNo : '',
      editing: pcEditing,
      setEditing: setPcEditing,
      onSave: doSave,
      onDiscard: () => { const d = (member.debts || []).find(x => x.contractNo === contractNo); d && load(member, d); },
      title: "ปรับเพิ่ม-ลดหนี้"
    })
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(PcxSec, {
    title: "ข้อมูลใบปรับปรุง"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-grid7"
  }, /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขที่ใบปรับปรุง"
  }, pcxDocNo(savedNo)), /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขสมาชิก / เลขที่สัญญา",
    required: true
  }, /*#__PURE__*/React.createElement(window.ErpContractPicker || ContractSearchField, {
    contract: contractNo,
    member: member,
    source: window.DN_MEMBERS,
    onPick: ({
      member: m,
      debt
    }) => load(m, debt),
    title: "ค้นหาสัญญาเงินกู้ — ปรับเพิ่ม-ลดหนี้",
    placeholder: "เลขสมาชิก หรือเลขที่สัญญา…"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชื่อ-ชื่อสกุล"
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่ใบปรับปรุง"
  }, pcxDate(docDate, setDocDate)), /*#__PURE__*/React.createElement(PcxG, {
    label: "วันที่รายการ"
  }, pcxDate(txnDate, setTxnDate)), /*#__PURE__*/React.createElement(PcxG, {
    label: "ประเภทปรับปรุง",
    span: 2
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: type,
    onChange: e => setType(e.target.value)
  }, PCX_DEBT_TYPES.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l)))), /*#__PURE__*/React.createElement(PcxG, {
    label: "เหตุผลที่ปรับปรุง",
    span: 4,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: reason,
    disabled: !contractNo,
    onChange: e => {
      setReason(e.target.value);
      setError('');
    },
    placeholder: "เช่น ปรับปรุงเบี้ยประกันตามใบแจ้งของบริษัทประกัน"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชุดข้อมูลที่"
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: dataset,
    onChange: e => setDataset(e.target.value),
    disabled: !contractNo
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "—"), /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "ชุดที่ 1"), /*#__PURE__*/React.createElement("option", {
    value: "2"
  }, "ชุดที่ 2"))), /*#__PURE__*/React.createElement(PcxG, {
    label: "ยอดปรับปรุงรวม",
    span: 2
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: pcxMoney(total),
    num: true,
    mono: true,
    danger: total < 0
  })))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "รายการปรับปรุง",
    actions: pcxAddBtn(addRow),
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 980,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 40
    }
  }), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 90
    }
  }, "รหัส"), /*#__PURE__*/React.createElement("th", null, "รายการ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 140
    }
  }, "ตั้ง ต.บ ถึงวันที่"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 140,
      textAlign: 'right'
    }
  }, "เงินต้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 140,
      textAlign: 'right'
    }
  }, "ดอกเบี้ย"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130,
      textAlign: 'right'
    }
  }, "รวมปรับปรุง"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 140,
      textAlign: 'right'
    }
  }, "คงเหลือ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 66
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => {
    const sum = (Number(r.principal) || 0) + (Number(r.interest) || 0);
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", {
      className: "muted mono"
    }, i + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
      className: "cfg-input sm",
      value: r.code,
      onChange: e => updateRow(i, {
        code: e.target.value
      }),
      placeholder: "รหัส"
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
      className: "cfg-input sm",
      value: r.label,
      onChange: e => updateRow(i, {
        label: e.target.value
      }),
      placeholder: "ชื่อรายการ"
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
      className: "cfg-input sm",
      type: "date",
      value: r.dueTo,
      onChange: e => updateRow(i, {
        dueTo: e.target.value
      })
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
      }),
      placeholder: "0.00"
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
      }),
      placeholder: "0.00"
    })), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        textAlign: 'right'
      }
    }, pcxMoney(sum)), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        textAlign: 'right'
      }
    }, pcxMoney((Number(r.base) || 0) + sum)), /*#__PURE__*/React.createElement("td", {
      className: "center"
    }, pcxDelBtn(() => removeRow(i))));
  }), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 9,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสัญญาเพื่อเริ่มบันทึกรายการปรับปรุง"))), !!rows.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 6,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "รวมปรับปรุงทั้งสิ้น"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, pcxMoney(total)), /*#__PURE__*/React.createElement("td", {
    colSpan: 2
  }))))))));
}
Object.assign(window, {
  AccruedInterestAdjustPage,
  ShareAdjustPage,
  DebtAdjustPage
});