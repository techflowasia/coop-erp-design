// ════════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ค่าคงที่  (Level 2)
//    · กำหนดรายละเอียดระบบ (สถานะระบบ)   (process/system-status)
//    · กำหนดระดับการอนุมัติ               (process/approval-level)
//  (ข้อกำหนดรายละเอียดสังกัด / ข้อกำหนดประเภทหุ้น ใช้หน้าเดิม)
// ════════════════════════════════════════════════════════════════════

const cstToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const cstBE = () => new Date().getFullYear() + 543;
const cstMoney = (v, d) => window.fmt.money(Number(v) || 0, d === undefined ? 2 : d);
const cstAudit = () => React.useContext(window.AuditContext || React.createContext({
  log: () => {}
}));
function CstFld({
  label,
  w,
  grow,
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
  }, label), children);
}
function CstRO({
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
function CstHead({
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
    name: icon || 'cog',
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, actions));
}
function CstSec({
  title,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, title)), children);
}
function CstCheck({
  checked,
  onChange,
  label
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
  }), /*#__PURE__*/React.createElement("span", null, label));
}

// ════════════════════════════════════════════════════════════════════
//  ① กำหนดรายละเอียดระบบ (สถานะระบบ)
// ════════════════════════════════════════════════════════════════════
const CST_PROGRAMS = [{
  name: 'account',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2555',
  lastDate: '08-09-2569'
}, {
  name: 'ACCOUNT',
  workDate: '04-03-2556',
  status: '-',
  autoClose: 0,
  fiscalYear: '2555',
  lastDate: '03-03-2556'
}, {
  name: 'admin',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 30,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'admins',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 30,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'agency',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'ap_deposit',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'app_assist',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'app_finance',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'budget',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'cmd',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'execadmin',
  workDate: '04-03-2556',
  status: '-',
  autoClose: 0,
  fiscalYear: '2555',
  lastDate: '03-03-2556'
}, {
  name: 'extra',
  workDate: '04-03-2556',
  status: '-',
  autoClose: 0,
  fiscalYear: '2555',
  lastDate: '03-03-2556'
}, {
  name: 'hr',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'ibank',
  workDate: '21-03-2556',
  status: '-',
  autoClose: 0,
  fiscalYear: '2555',
  lastDate: '20-03-2556'
}, {
  name: 'keeping',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'lawsys',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}, {
  name: 'loanassist',
  workDate: '09-09-2569',
  status: '-',
  autoClose: 0,
  fiscalYear: '2569',
  lastDate: '08-09-2569'
}];
const CST_CLOSE_ROWS = [{
  label: 'ประจำวัน',
  status: '-',
  by: 'SOMMART',
  at: '9/9/2026 08:14:17'
}, {
  label: 'ประจำเดือน',
  status: '-',
  by: 'SOMMART',
  at: '5/20/2026 08:03:35'
}, {
  label: 'ประจำปี',
  status: 'ยังไม่ปิดงาน',
  by: 'SOMMART',
  at: '7/9/2026 08:15:38'
}];
const CST_CLOSE_STATUS = ['-', 'ปิดงานแล้ว', 'ยังไม่ปิดงาน'];
function SystemStatusConfigPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = cstAudit();
  const [sel, setSel] = useState(CST_PROGRAMS[0].name);
  const [rows, setRows] = useState(CST_PROGRAMS);
  const [closeRows, setCloseRows] = useState(CST_CLOSE_ROWS);
  const [server, setServer] = useState({
    ip: '',
    service: '',
    port: ''
  });
  const cur = rows.find(r => r.name === sel) || rows[0];
  const patch = p => setRows(rs => rs.map(r => r.name === sel ? {
    ...r,
    ...p
  } : r));
  const save = () => {
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ประมวลผลและจัดเก็บ — กำหนดรายละเอียดระบบ (สถานะระบบ)',
      target: cur.name,
      summary: `ปรับปรุงรายละเอียดระบบ ${cur.name} · ปีบัญชี ${cur.fiscalYear} · วันทำการ ${cur.workDate}`,
      changes: [{
        field: 'เวลาปิดตัวเอง (นาที)',
        before: '—',
        after: String(cur.autoClose)
      }, {
        field: 'วันทำการ',
        before: '—',
        after: cur.workDate
      }]
    });
    onToast && onToast(`บันทึกรายละเอียดระบบ ${cur.name} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E23\u0E30\u0E1A\u0E1A (\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E30\u0E1A\u0E1A)"
  }, /*#__PURE__*/React.createElement(CstHead, {
    icon: "cog",
    title: "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E23\u0E30\u0E1A\u0E1A (\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E23\u0E30\u0E1A\u0E1A)",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48 \u2014 \u0E27\u0E31\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23 \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 \u0E41\u0E25\u0E30\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: save
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setRows(CST_PROGRAMS);
        setCloseRows(CST_CLOSE_ROWS);
        onToast && onToast('คืนค่าเดิมเรียบร้อยแล้ว');
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E21"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(240px, 320px) minmax(0, 1fr)',
      gap: 12,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      overflowX: 'auto',
      maxHeight: 620,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 70
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.name,
    onClick: () => setSel(r.name),
    style: {
      cursor: 'pointer',
      background: r.name === sel ? 'var(--brand-soft)' : undefined
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.name), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.workDate), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, r.status))))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement(CstRO, {
    value: cur.name,
    mono: true
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07 (\u0E19\u0E32\u0E17\u0E35)",
    w: 200
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    min: "0",
    style: {
      textAlign: 'right'
    },
    value: cur.autoClose,
    onChange: e => patch({
      autoClose: e.target.value
    })
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E27\u0E31\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E1B\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: cur.fiscalYear,
    onChange: e => patch({
      fiscalYear: e.target.value
    })
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23",
    w: 190
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: cur.workDate,
    onChange: e => patch({
      workDate: e.target.value
    })
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E27\u0E31\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
    w: 190
  }, /*#__PURE__*/React.createElement(CstRO, {
    value: cur.lastDate,
    mono: true
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19",
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
      width: 140
    }
  }, "\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 170
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 180
    }
  }, "\u0E1C\u0E39\u0E49\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"), /*#__PURE__*/React.createElement("th", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"))), /*#__PURE__*/React.createElement("tbody", null, closeRows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.label
  }, /*#__PURE__*/React.createElement("td", null, r.label), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input sm",
    value: r.status,
    onChange: e => setCloseRows(cs => cs.map((c, idx) => idx === i ? {
      ...c,
      status: e.target.value
    } : c))
  }, CST_CLOSE_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.by), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.at))))))), /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E2A\u0E48\u0E27\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E25\u0E32\u0E07",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "Server IP",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: server.ip,
    onChange: e => setServer(s => ({
      ...s,
      ip: e.target.value
    }))
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "Service",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: server.service,
    onChange: e => setServer(s => ({
      ...s,
      service: e.target.value
    }))
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "Port",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: server.port,
    onChange: e => setServer(s => ({
      ...s,
      port: e.target.value
    }))
  })))))));
}

// ════════════════════════════════════════════════════════════════════
//  ② กำหนดระดับการอนุมัติ
// ════════════════════════════════════════════════════════════════════
const CST_APPROVAL_FLAGS = ['สามารถทำรายการย้อนรายการ', 'สามารถถอนและปรับปรุงรายการได้', 'สามารถเปลี่ยนวันทำการได้', 'สามารถยกเลิกการปรับเงินฝากได้', 'สามารถทำรายการฝากถอน ย้อนวันได้', 'สามารถอายัดเงินฝากได้', 'สามารถระงับการเข้าระบบได้'];
const CST_APPROVAL_SEED = [{
  code: '00000',
  label: '<ไม่เกี่ยวข้องกับการเงิน>',
  loanMax: 0,
  withdrawMax: 0,
  depositMax: 0,
  flags: []
}, {
  code: '00001',
  label: 'กรรมการผู้มีอำนาจ',
  loanMax: 5000000,
  withdrawMax: 5000000,
  depositMax: 5000000,
  flags: ['สามารถเปลี่ยนวันทำการได้']
}, {
  code: '00002',
  label: 'ผู้จัดการ',
  loanMax: 3000000,
  withdrawMax: 3000000,
  depositMax: 3000000,
  flags: ['สามารถถอนและปรับปรุงรายการได้']
}, {
  code: '00003',
  label: 'รองผู้จัดการ',
  loanMax: 2000000,
  withdrawMax: 2000000,
  depositMax: 2000000,
  flags: []
}, {
  code: '00004',
  label: 'ผู้ช่วยผู้จัดการ',
  loanMax: 1000000,
  withdrawMax: 1000000,
  depositMax: 1000000,
  flags: []
}, {
  code: '00005',
  label: 'หัวหน้าสายการเงิน',
  loanMax: 500000,
  withdrawMax: 500000,
  depositMax: 500000,
  flags: []
}, {
  code: '00006',
  label: 'พนักงานการเงิน',
  loanMax: 100000,
  withdrawMax: 100000,
  depositMax: 100000,
  flags: []
}, {
  code: '00007',
  label: 'พนักงานบัญชี',
  loanMax: 0,
  withdrawMax: 0,
  depositMax: 0,
  flags: []
}, {
  code: '00008',
  label: 'หัวหน้าเงินฝาก',
  loanMax: 0,
  withdrawMax: 300000,
  depositMax: 300000,
  flags: ['สามารถอายัดเงินฝากได้']
}, {
  code: '00009',
  label: 'พนักงานเงินฝาก',
  loanMax: 0,
  withdrawMax: 50000,
  depositMax: 50000,
  flags: []
}];
function ApprovalLevelConfigPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = cstAudit();
  const [list, setList] = useState(CST_APPROVAL_SEED);
  const [sel, setSel] = useState(CST_APPROVAL_SEED[0].code);
  const cur = list.find(r => r.code === sel) || list[0];
  const patch = p => setList(ls => ls.map(r => r.code === sel ? {
    ...r,
    ...p
  } : r));
  const toggleFlag = f => patch({
    flags: cur.flags.includes(f) ? cur.flags.filter(x => x !== f) : [...cur.flags, f]
  });
  const addLevel = () => {
    const next = String(Math.max(...list.map(r => Number(r.code))) + 1).padStart(5, '0');
    const row = {
      code: next,
      label: 'ระดับการอนุมัติใหม่',
      loanMax: 0,
      withdrawMax: 0,
      depositMax: 0,
      flags: []
    };
    setList(ls => [...ls, row]);
    setSel(next);
    onToast && onToast(`เพิ่มระดับการอนุมัติ ${next} เรียบร้อยแล้ว`);
  };
  const removeLevel = code => {
    if (list.length <= 1) return;
    setList(ls => ls.filter(r => r.code !== code));
    if (code === sel) setSel(list.find(r => r.code !== code).code);
    onToast && onToast(`ลบระดับการอนุมัติ ${code} เรียบร้อยแล้ว`);
  };
  const save = () => {
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ประมวลผลและจัดเก็บ — กำหนดระดับการอนุมัติ',
      target: `${cur.code} · ${cur.label}`,
      summary: `ปรับปรุงระดับการอนุมัติ ${cur.code} — วงเงินกู้สูงสุด ${cstMoney(cur.loanMax)} · ถอนได้สูงสุด ${cstMoney(cur.withdrawMax)}`,
      changes: [{
        field: 'วงเงินกู้อนุมัติสูงสุด',
        before: '—',
        after: cstMoney(cur.loanMax)
      }, {
        field: 'ถอนได้สูงสุด',
        before: '—',
        after: cstMoney(cur.withdrawMax)
      }, {
        field: 'ฝากได้สูงสุด',
        before: '—',
        after: cstMoney(cur.depositMax)
      }, {
        field: 'การปรับปรุงรายการ',
        before: '—',
        after: cur.flags.length ? cur.flags.join(', ') : 'ไม่กำหนด'
      }]
    });
    onToast && onToast(`บันทึกระดับการอนุมัติ ${cur.code} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  }, /*#__PURE__*/React.createElement(CstHead, {
    icon: "shield",
    title: "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48 \u2014 \u0E27\u0E07\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49 \u0E40\u0E07\u0E34\u0E19\u0E1D\u0E32\u0E01 \u0E41\u0E25\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E23\u0E30\u0E14\u0E31\u0E1A",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: save
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: addLevel
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 13
    }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E30\u0E14\u0E31\u0E1A"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)',
      gap: 12,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      overflowX: 'auto',
      maxHeight: 560,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 80
    }
  }, "\u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("th", null, "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 60
    }
  }, "\u0E25\u0E1A"))), /*#__PURE__*/React.createElement("tbody", null, list.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.code,
    onClick: () => setSel(r.code),
    style: {
      cursor: 'pointer',
      background: r.code === sel ? 'var(--brand-soft)' : undefined
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.code), /*#__PURE__*/React.createElement("td", null, r.label), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "btn sm danger",
    onClick: e => {
      e.stopPropagation();
      removeLevel(r.code);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 12
  })))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: addLevel
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E30\u0E14\u0E31\u0E1A"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E23\u0E2B\u0E31\u0E2A\u0E41\u0E25\u0E30\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E23\u0E2B\u0E31\u0E2A",
    w: 140
  }, /*#__PURE__*/React.createElement(CstRO, {
    value: cur.code,
    mono: true
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: cur.label,
    onChange: e => patch({
      label: e.target.value
    })
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 (\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49)",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E27\u0E07\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    w: 240
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: cur.loanMax,
    onChange: e => patch({
      loanMax: e.target.value
    })
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 (\u0E40\u0E07\u0E34\u0E19\u0E1D\u0E32\u0E01)",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E16\u0E2D\u0E19\u0E44\u0E14\u0E49\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    w: 240
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: cur.withdrawMax,
    onChange: e => patch({
      withdrawMax: e.target.value
    })
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "\u0E1D\u0E32\u0E01\u0E44\u0E14\u0E49\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    w: 240
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    value: cur.depositMax,
    onChange: e => patch({
      depositMax: e.target.value
    })
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '10px 24px'
    }
  }, CST_APPROVAL_FLAGS.map(f => /*#__PURE__*/React.createElement(CstCheck, {
    key: f,
    label: f,
    checked: cur.flags.includes(f),
    onChange: () => toggleFlag(f)
  })))))));
}
Object.assign(window, {
  SystemStatusConfigPage,
  ApprovalLevelConfigPage
});