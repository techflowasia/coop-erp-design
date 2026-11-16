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
    "data-screen-label": "กำหนดรายละเอียดระบบ (สถานะระบบ)"
  }, /*#__PURE__*/React.createElement(CstHead, {
    icon: "cog",
    title: "กำหนดรายละเอียดระบบ (สถานะระบบ)",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ \u2014 วันทำการ สถานะการปิดงาน และรายละเอียดบริการส่วนกลางของแต่ละโปรแกรม",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: save
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " บันทึก"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setRows(CST_PROGRAMS);
        setCloseRows(CST_CLOSE_ROWS);
        onToast && onToast('คืนค่าเดิมเรียบร้อยแล้ว');
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " คืนค่าเดิม"))
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
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "โปรแกรม"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }, "วันทำการ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 70
    }
  }, "สถานะ"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => /*#__PURE__*/React.createElement("tr", {
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
    title: "โปรแกรม"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "โปรแกรม",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement(CstRO, {
    value: cur.name,
    mono: true
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "เวลาปิดตัวเอง (นาที)",
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
    title: "วันทำการ",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "ปีบัญชีปัจจุบัน",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: cur.fiscalYear,
    onChange: e => patch({
      fiscalYear: e.target.value
    })
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "วันทำการ",
    w: 190
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: cur.workDate,
    onChange: e => patch({
      workDate: e.target.value
    })
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "วันล่าสุด",
    w: 190
  }, /*#__PURE__*/React.createElement(CstRO, {
    value: cur.lastDate,
    mono: true
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "สถานะการปิดงาน",
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
  }, "การปิดงาน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 170
    }
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 180
    }
  }, "ผู้ปิดงาน"), /*#__PURE__*/React.createElement("th", null, "วันที่ปิดงาน"))), /*#__PURE__*/React.createElement("tbody", null, closeRows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
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
    title: "รายละเอียดส่วนบริการส่วนกลาง",
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
function ApprovalLevelConfigPageOld({
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
    "data-screen-label": "กำหนดระดับการอนุมัติ"
  }, /*#__PURE__*/React.createElement(CstHead, {
    icon: "shield",
    title: "กำหนดระดับการอนุมัติ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ \u2014 วงเงินอนุมัติเงินกู้ เงินฝาก และสิทธิ์การปรับปรุงรายการของแต่ละระดับ",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: save
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " บันทึก"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: addLevel
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 13
    }), " เพิ่มระดับ"))
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
  }, "รหัส"), /*#__PURE__*/React.createElement("th", null, "คำอธิบาย"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 60
    }
  }, "ลบ"))), /*#__PURE__*/React.createElement("tbody", null, list.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.code,
    onClick: () => setSel(r.code),
    style: {
      cursor: 'pointer',
      background: r.code === sel ? 'var(--brand-soft)' : undefined
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.code), /*#__PURE__*/React.createElement("td", null, r.label), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-del",
    title: "ลบ",
    "aria-label": "ลบ",
    onClick: e => {
      e.stopPropagation();
      removeLevel(r.code);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
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
  }), " เพิ่มระดับ"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CstSec, {
    title: "รหัสและชื่อระดับการอนุมัติ"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "รหัส",
    w: 140
  }, /*#__PURE__*/React.createElement(CstRO, {
    value: cur.code,
    mono: true
  })), /*#__PURE__*/React.createElement(CstFld, {
    label: "คำอธิบาย",
    grow: true,
    w: 260
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: cur.label,
    onChange: e => patch({
      label: e.target.value
    })
  })))), /*#__PURE__*/React.createElement(CstSec, {
    title: "ระดับการอนุมัติ (เงินกู้)",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "วงเงินกู้อนุมัติสูงสุด",
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
    title: "ระดับการอนุมัติ (เงินฝาก)",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(CstFld, {
    label: "ถอนได้สูงสุด",
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
    label: "ฝากได้สูงสุด",
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
    title: "การปรับปรุงรายการ",
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
  ApprovalLevelConfigPageOld
});
// ═════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ค่าคงที่ — หน่วยงาน / รหัสเขต
//  รูปแบบและการทำงานเดียวกับ "ค่าคงที่วัตถุประสงค์การกู้" ของระบบสินเชื่อ
//  หัวข้อ + ปุ่มเพิ่ม · ค้นหา/รีเซ็ต · แท็บกรองสถานะ · ตาราง (สถานะ/สวิตช์ใช้งาน/แก้ไข)
//  · แบ่งหน้า · modal เพิ่ม/แก้ไข · ยืนยันเปิด/ปิด · modal สำเร็จ
// ═════════════════════════════════════════════════════════════════
const PCCN_G = '#237450';
const PCCN_SOFT = '#eafef2';
const PCCN_LINE = '#f0f0f0';
const pccnBtn = primary => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 14px',
  border: '1px solid ' + (primary ? PCCN_G : '#d9d9d9'), background: primary ? PCCN_G : '#fff',
  borderRadius: 4, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
  color: primary ? '#fff' : 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
});
const PCCN_TH = { textAlign: 'left', fontWeight: 600, fontSize: 12, padding: '9px 12px', borderBottom: '1px solid ' + PCCN_LINE };
const PCCN_TD = { padding: '10px 12px', borderBottom: '1px solid ' + PCCN_LINE, verticalAlign: 'top' };
const PCCN_SEARCH = 'M11.5 11.5l3 3M7 13a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z';
const PCCN_PLUS = 'M8 3v10M3 8h10';
const PCCN_EDIT = 'm3 13 1-3 7-7 2 2-7 7-3 1Z';
const PCCN_INFO = 'M8 7v4M8 5v.5M2.5 8a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z';
function PccnIco({ d, s = 14 }) {
  return React.createElement("svg", { width: s, height: s, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0 }, "aria-hidden": "true" }, React.createElement("path", { d: d }));
}
const pccnStamp = () => {
  const p = n => String(n).padStart(2, '0');
  const t = new Date();
  return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) + ' ' + p(t.getHours()) + ':' + p(t.getMinutes());
};
const pccnWhen = v => {
  if (!v) return '—';
  const d = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!d) return String(v);
  const y = Number(d[1]);
  return d[3] + '/' + d[2] + '/' + (y > 2400 ? y : y + 543) + (d[4] ? ' ' + d[4] + ':' + d[5] + ' น.' : '');
};

// ─── modal เพิ่ม/แก้ไข ─────────────────────────────────────────────
function PccnForm({ cfg, rec, list, onClose, onSave }) {
  const h = React.createElement;
  const isEdit = !!rec;
  const [f, setF] = React.useState(() => rec ? { ...rec } : cfg.blank ? cfg.blank(list) : { code: '', name: '', note: '', enabled: true });
  const [err, setErr] = React.useState('');
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErr(''); };
  const submit = () => {
    if (!String(f.code).trim()) return setErr('กรุณาระบุ' + cfg.codeLabel);
    if (!String(f.name).trim()) return setErr('กรุณาระบุ' + cfg.nameLabel);
    if (list.some(r => r.code === f.code.trim() && (!isEdit || r.id !== rec.id))) return setErr(cfg.codeLabel + 'นี้ถูกใช้แล้ว');
    onSave({ ...f, code: f.code.trim(), name: f.name.trim(), note: (f.note || '').trim() });
  };
  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,.65)', marginBottom: 5 };
  const inp = { width: '100%', height: 32, padding: '0 10px', border: '1px solid #d9d9d9', borderRadius: 2, fontFamily: 'inherit', fontSize: 13, color: 'rgba(0,0,0,.88)', outline: 'none', boxSizing: 'border-box' };
  const req = h("span", { style: { color: '#cf1322' } }, "*");
  return h("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 900, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', overflowY: 'auto' }, onClick: onClose },
    h("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "pccn-form-title", onClick: e => e.stopPropagation(), style: { width: cfg.formWidth || 560, maxWidth: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,.18)', overflow: 'hidden' } },
      h("div", { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid ' + PCCN_LINE } },
        h("span", { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9999, background: PCCN_SOFT, color: PCCN_G } }, h(PccnIco, { d: isEdit ? PCCN_EDIT : PCCN_PLUS, s: 16 })),
        h("div", { style: { minWidth: 0 } },
          h("h2", { id: "pccn-form-title", style: { margin: 0, fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,.88)' } }, (isEdit ? 'แก้ไข' : 'เพิ่ม') + cfg.entity),
          h("div", { style: { fontSize: 11, color: 'rgba(0,0,0,.55)', marginTop: 2 } }, isEdit ? rec.code + ' · ' + rec.name : cfg.formHint)),
        h("span", { style: { flex: 1 } }),
        h("button", { type: "button", onClick: onClose, "aria-label": "ปิด", title: "ปิด", style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', background: 'transparent', borderRadius: 4, color: 'rgba(0,0,0,.45)', cursor: 'pointer', flexShrink: 0 } }, h(Icon, { name: "close", size: 16 }))),
      h("div", { style: { padding: 20, display: 'grid', gap: 14 } },
        isEdit && h("div", { style: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid #1677ff', borderRadius: 4, background: '#e6f4ff', fontSize: 12.5, color: 'rgba(0,0,0,.65)', lineHeight: 1.5 } },
          h(PccnIco, { d: PCCN_INFO, s: 13 }),
          h("span", null, "แก้ไขล่าสุดโดย ", h("b", null, rec.updatedBy || 'มนตรี ศรีสุข'), " เมื่อ ", h("b", null, pccnWhen(rec.updatedAt)))),
        h("div", { style: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 } },
          h("div", null, h("label", { style: lbl, htmlFor: "pccn-code" }, cfg.codeLabel, " ", req),
            h("input", { id: "pccn-code", style: { ...inp, fontFamily: '"IBM Plex Mono", ui-monospace, monospace' }, value: f.code, placeholder: cfg.codePh, maxLength: cfg.codeMax || 10, autoFocus: !isEdit, onChange: e => set('code', e.target.value) })),
          h("div", null, h("label", { style: lbl, htmlFor: "pccn-name" }, cfg.nameLabel, " ", req),
            h("input", { id: "pccn-name", style: inp, value: f.name, placeholder: cfg.namePh, onChange: e => set('name', e.target.value) }))),
        cfg.noNote ? null : h("div", null, h("label", { style: lbl, htmlFor: "pccn-note" }, "หมายเหตุ"),
          h("textarea", { id: "pccn-note", rows: 3, maxLength: 255, style: { ...inp, height: 'auto', minHeight: 72, padding: '7px 10px', lineHeight: 1.5, resize: 'vertical' }, value: f.note || '', placeholder: "ระบุหมายเหตุ (ถ้ามี)", onChange: e => set('note', e.target.value) })),
        cfg.formExtra ? cfg.formExtra(f, set, { lbl, inp }) : null,
        err && h("div", { role: "alert", style: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#cf1322' } }, h(PccnIco, { d: PCCN_INFO, s: 13 }), " ", err)),
      h("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid ' + PCCN_LINE, background: '#fafafa' } },
        h("button", { type: "button", style: pccnBtn(false), onClick: onClose }, "ยกเลิก"),
        h("button", { type: "button", style: pccnBtn(true), onClick: submit }, isEdit ? 'บันทึกการแก้ไข' : 'เพิ่ม' + cfg.entity))));
}

// ─── หน้าจอหลัก (ใช้ร่วม: หน่วยงาน / รหัสเขต) ───────────────────────
function PcCodeNameConstPage({ cfg, onToast }) {
  const h = React.createElement;
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const load = () => {
    try { const s = localStorage.getItem(cfg.key); if (s) return JSON.parse(s); } catch (e) {}
    return cfg.seed();
  };
  const [list, setList] = React.useState(load);
  const [q, setQ] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [only, setOnly] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [per, setPer] = React.useState(20);
  const [form, setForm] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [block, setBlock] = React.useState(null); // { rec, refs } ปิดใช้งานไม่ได้ — ถูกอ้างอิงอยู่
  const [done, setDone] = React.useState(null);
  const askToggle = r => {
    if (r.enabled && cfg.usage) {
      const refs = cfg.usage(r) || [];
      if (refs.length) return setBlock({ rec: r, refs: refs });
    }
    setConfirm({ rec: r, next: !r.enabled });
  };
  const persist = next => { setList(next); try { localStorage.setItem(cfg.key, JSON.stringify(next)); } catch (e) {} };
  const rows = React.useMemo(() => {
    const t = applied.trim().toLowerCase();
    return list.filter(r => {
      if (only === 'on' && !r.enabled) return false;
      if (only === 'off' && r.enabled) return false;
      if (!t) return true;
      return (cfg.searchKeys ? cfg.searchKeys.map(k => r[k]) : [r.code, r.name, r.note]).filter(Boolean).some(s => String(s).toLowerCase().includes(t));
    });
  }, [list, applied, only]);
  const total = rows.length;
  const start = (page - 1) * per;
  const pageRows = rows.slice(start, start + per);
  const pages = Math.max(1, Math.ceil(total / per));
  const onCount = list.filter(r => r.enabled).length;
  const who = (window.LOGIN_USER && window.LOGIN_USER.name) || 'มนตรี ศรีสุข';
  const doSave = d => {
    const isEdit = !!(form && form.rec);
    if (isEdit) {
      persist(list.map(r => r.id === form.rec.id ? { ...r, ...d, updatedBy: who, updatedAt: pccnStamp() } : r));
      audit.log({ action: 'update', module: cfg.module, target: d.code + ' · ' + d.name, summary: 'แก้ไข' + cfg.entity + ' “' + d.name + '”' });
      setDone({ title: 'บันทึกการแก้ไขเรียบร้อยแล้ว', detail: cfg.entity + ' “' + d.name + '” ถูกแก้ไขเรียบร้อยแล้ว' });
    } else {
      persist([...list, { ...d, id: cfg.idPrefix + Date.now(), enabled: true, updatedBy: who, updatedAt: pccnStamp() }]);
      audit.log({ action: 'create', module: cfg.module, target: d.code + ' · ' + d.name, summary: 'เพิ่ม' + cfg.entity + ' “' + d.name + '”' });
      setDone({ title: 'เพิ่ม' + cfg.entity + 'เรียบร้อยแล้ว', detail: cfg.entity + ' “' + d.name + '” ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว' });
    }
    setForm(null);
  };
  const applyToggle = () => {
    const { rec, next } = confirm;
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: next, updatedBy: who, updatedAt: pccnStamp() } : r));
    audit.log({ action: 'update', module: cfg.module, target: rec.code + ' · ' + rec.name, summary: (next ? 'เปิด' : 'ปิด') + 'การใช้งาน' + cfg.entity + ' “' + rec.name + '”' });
    setDone({ title: (next ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + 'เรียบร้อยแล้ว', detail: cfg.entity + ' “' + rec.name + '” ถูก' + (next ? 'เปิด' : 'ปิด') + 'ใช้งานเรียบร้อยแล้ว' });
    setConfirm(null);
  };
  const segBtn = (key, label, count) => {
    const on = only === key;
    return h("button", { key: key, type: "button", "aria-pressed": on, onClick: () => { setOnly(key); setPage(1); },
      style: { display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 2px', border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '2px solid ' + (on ? PCCN_G : 'transparent'), color: on ? PCCN_G : 'rgba(0,0,0,.65)', fontWeight: on ? 600 : 400 } },
      label, h("span", { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 18, padding: '0 6px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: on ? PCCN_SOFT : '#f5f5f5', color: on ? PCCN_G : 'rgba(0,0,0,.55)' } }, count));
  };
  const pageBtn = (n, label, disabled, active, aria) => h("button", { key: label, type: "button", disabled: disabled, "aria-label": aria, "aria-current": active ? 'page' : undefined, onClick: () => !disabled && setPage(n),
    style: { minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, cursor: disabled ? 'default' : 'pointer', border: '1px solid ' + (active ? PCCN_G : '#d9d9d9'), background: active ? PCCN_G : '#fff', color: active ? '#fff' : disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)' } }, label);
  return h("div", { "data-screen-label": cfg.screen },
    h("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 } },
      h("div", null,
        h("h1", { style: { margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: 'rgba(0,0,0,.88)' } }, cfg.title),
        h("p", { style: { margin: '6px 0 0', fontSize: 12, color: 'rgba(0,0,0,.55)', lineHeight: 1.55, maxWidth: 760 } }, cfg.subtitle)),
      h("div", { style: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 } },
        cfg.HeadExtra ? h(cfg.HeadExtra, { list: list, persist: persist, onToast: onToast }) : null,
        h("button", { type: "button", style: pccnBtn(true), onClick: () => setForm({ rec: null }) }, h(PccnIco, { d: PCCN_PLUS, s: 15 }), " เพิ่ม" + cfg.entity))),
    h("div", { style: { background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,.03)', overflow: 'hidden', marginTop: 14 } },
      h("div", { style: { display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, padding: '14px 16px 16px', borderBottom: '1px solid ' + PCCN_LINE } },
        h("div", { style: { flex: '0 1 340px', minWidth: 240 } },
        h("div", { style: { fontSize: 12, color: 'rgba(0,0,0,.55)', marginBottom: 4 } }, "ค้นหา"),
        h("label", { style: { display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4, width: '100%', boxSizing: 'border-box' } },
          h("span", { style: { display: 'inline-flex', color: 'rgba(0,0,0,.45)' } }, h(PccnIco, { d: PCCN_SEARCH })),
          h("input", { "aria-label": "ค้นหา", placeholder: cfg.searchPh, value: q, onChange: e => setQ(e.target.value), onKeyDown: e => { if (e.key === 'Enter') { setApplied(q); setPage(1); } },
            style: { flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent' } }))),
        h("span", { style: { flex: 1 } }),
        h("button", { type: "button", style: pccnBtn(true), onClick: () => { setApplied(q); setPage(1); } }, "ค้นหา"),
        h("button", { type: "button", style: pccnBtn(false), onClick: () => { setQ(''); setApplied(''); setOnly('all'); setPage(1); } }, "รีเซ็ต")),
      h("div", { style: { padding: '16px 16px 0' } },
        h("div", { style: { overflowX: 'auto' } },
          h("table", { style: { width: '100%', minWidth: cfg.tableMin || 720, borderCollapse: 'collapse', fontSize: 13 } },
            h("thead", null, h("tr", { style: { background: '#fafafa', color: 'rgba(0,0,0,.65)' } },
              h("th", { style: { ...PCCN_TH, width: 120 } }, cfg.codeLabel),
              h("th", { style: { ...PCCN_TH, minWidth: 260 } }, cfg.nameLabel),
              ...(cfg.cols || []).map(c => h("th", { key: c.label, style: { ...PCCN_TH, ...(c.th || {}) } }, c.label)),
              h("th", { style: { ...PCCN_TH, width: 112, textAlign: 'center' } }, "สถานะ"),
              h("th", { style: { ...PCCN_TH, width: 60, textAlign: 'center' } }, "ใช้งาน"),
              h("th", { style: { ...PCCN_TH, width: 80, textAlign: 'center' } }, h("span", { className: "sr-only", style: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' } }, "จัดการ")))),
            h("tbody", null, pageRows.map(r => h("tr", { key: r.id, style: r.enabled ? undefined : { background: '#fafafa', opacity: .72 } },
              h("td", { style: { ...PCCN_TD, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12, color: 'rgba(0,0,0,.65)' } }, r.code),
              h("td", { style: PCCN_TD }, h("span", { style: { display: 'block', fontWeight: 600, color: 'rgba(0,0,0,.88)' } }, r.name),
                r.note && h("span", { style: { display: 'block', fontSize: 11, color: 'rgba(0,0,0,.55)', marginTop: 3, lineHeight: 1.5 } }, r.note)),
              ...(cfg.cols || []).map(c => h("td", { key: c.label, style: { ...PCCN_TD, ...(c.td || {}) } }, c.render(r))),
              h("td", { style: { ...PCCN_TD, textAlign: 'center' } }, r.enabled ? h("span", { className: "pill ok" }, "เปิดใช้งาน") : h("span", { className: "pill neutral" }, "ปิดใช้งาน")),
              h("td", { style: { ...PCCN_TD, textAlign: 'center' } },
                h("button", { type: "button", role: "switch", "aria-checked": !!r.enabled, "aria-label": (r.enabled ? 'ปิดใช้งาน ' : 'เปิดใช้งาน ') + r.name, onClick: () => askToggle(r),
                  style: { position: 'relative', width: 44, height: 22, flexShrink: 0, border: 'none', borderRadius: 9999, cursor: 'pointer', padding: 0, transition: 'background .18s', background: r.enabled ? PCCN_G : 'rgba(0,0,0,.25)' } },
                  h("span", { style: { position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18, borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' } }))),
              h("td", { style: { ...PCCN_TD, textAlign: 'center' } },
                h("button", { type: "button", onClick: () => setForm({ rec: r }), "aria-label": 'แก้ไข ' + r.name,
                  style: { display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 9px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap' } },
                  h(PccnIco, { d: PCCN_EDIT, s: 13 }), " แก้ไข")))),
              total === 0 && h("tr", null, h("td", { colSpan: 5 + (cfg.cols || []).length, style: { ...PCCN_TD, textAlign: 'center', color: 'rgba(0,0,0,.55)', padding: '28px 12px' } }, "ไม่พบข้อมูล"))))),
        h("div", { style: { padding: '12px 0', borderTop: '1px solid ' + PCCN_LINE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 } },
          h("span", { style: { fontSize: 12, color: 'rgba(0,0,0,.55)' } }, total === 0 ? '0 รายการ' : start + 1 + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'),
          h("div", { style: { display: 'flex', alignItems: 'center', gap: 6 } },
            pageBtn(page - 1, '‹', page <= 1, false, 'หน้าก่อนหน้า'),
            Array.from({ length: pages }, (_, i) => pageBtn(i + 1, String(i + 1), false, page === i + 1)),
            pageBtn(page + 1, '›', page >= pages, false, 'หน้าถัดไป'),
            h("select", { value: per, "aria-label": "จำนวนต่อหน้า", onChange: e => { setPer(Number(e.target.value)); setPage(1); },
              style: { height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' } },
              h("option", { value: 20 }, "20 / หน้า"), h("option", { value: 50 }, "50 / หน้า"), h("option", { value: 100 }, "100 / หน้า")))))),
    h("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, fontSize: 11.5, color: 'rgba(0,0,0,.55)', lineHeight: 1.55, maxWidth: 900 } },
      h("span", { style: { display: 'inline-flex', flexShrink: 0, marginTop: 2 } }, h(PccnIco, { d: PCCN_INFO, s: 12 })), h("span", null, cfg.footnote)),
    done && (window.StatusModal ? h(window.StatusModal, { variant: "success", title: done.title, detail: done.detail, onClose: () => setDone(null) })
      : h("div", { role: "status", style: { position: 'fixed', right: 20, bottom: 20, zIndex: 920, background: '#fff', border: '1px solid ' + PCCN_G, borderRadius: 8, padding: '12px 16px', boxShadow: '0 6px 24px rgba(0,0,0,.18)' } }, done.title, " ",
        h("button", { type: "button", style: pccnBtn(false), onClick: () => setDone(null) }, "ปิด"))),
    block && window.ToggleConfirmModal && h(window.ToggleConfirmModal, {
      blocked: true,
      next: false,
      title: 'ปิดการใช้งาน' + cfg.entity,
      subtitle: block.rec.code + ' · ' + block.rec.name,
      detail: 'ปิดใช้งานไม่ได้ — ' + cfg.entity + ' “' + block.rec.name + '” ถูกใช้อยู่ใน ' + block.refs.length + ' ' + (cfg.usageLabel || 'รายการ') + ': ' +
        block.refs.slice(0, 5).join(' · ') + (block.refs.length > 5 ? ' และอีก ' + (block.refs.length - 5) + ' รายการ' : '') +
        ' · กรุณาปิดใช้งาน' + (cfg.usageLabel || 'รายการ') + 'เหล่านี้ก่อน',
      onCancel: () => setBlock(null)
    }),
    form && h(PccnForm, { cfg: cfg, rec: form.rec, list: list, onClose: () => setForm(null), onSave: doSave }),
    confirm && (window.ToggleConfirmModal ? h(window.ToggleConfirmModal, {
      next: confirm.next,
      title: (confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งาน' + cfg.entity,
      subtitle: confirm.rec.code + ' · ' + confirm.rec.name,
      detail: confirm.next ? 'เปิดให้ใช้' + cfg.entity + ' “' + confirm.rec.name + '” — จะแสดงเป็นตัวเลือกในหน้าที่เกี่ยวข้องทันที' : 'ปิดการใช้งาน “' + confirm.rec.name + '” — จะไม่แสดงเป็นตัวเลือกในรายการใหม่ (ข้อมูลเดิมไม่กระทบ)',
      onCancel: () => setConfirm(null),
      onConfirm: applyToggle
    }) : null));
}

// ─── ข้อมูลตั้งต้นจากข้อกำหนดรายละเอียดสังกัด ──────────────────────
const pccnAffil = () => (window.adLoad ? window.adLoad() : window.AD_SEED || []);
// รายการในข้อกำหนดรายละเอียดสังกัดที่ยังเปิดใช้งาน (ใช้ตรวจก่อนปิดใช้งานค่าคงที่ที่ถูกอ้างอิง)
window.pcAffilRefs = pred => {
  const rows = window.adList ? window.adList() : window.adLoad ? window.adLoad() : [];
  return rows.filter(r => r.on !== false && pred(r));
};
const PC_AFFIL_REF_LABEL = 'รายการในข้อกำหนดรายละเอียดสังกัด';
const PC_UNIT_CFG = {
  usageLabel: PC_AFFIL_REF_LABEL,
  usage: rec => window.pcAffilRefs(r => r.code === rec.code).map(r => (r.affilCode ? r.affilCode + ' — ' : '') + (r.org || r.name)),
  key: 'pc_const_unit_v1', idPrefix: 'UNIT-', module: 'ประมวลผลและจัดเก็บ — ค่าคงที่หน่วยงาน',
  screen: 'ค่าคงที่หน่วยงาน', title: 'หน่วยงาน', entity: 'หน่วยงาน',
  subtitle: 'กำหนดรหัสหน่วยงานและชื่อหน่วยงาน ใช้เป็นตัวเลือกในข้อกำหนดรายละเอียดสังกัดและเมนูที่เกี่ยวข้อง',
  codeLabel: 'รหัสหน่วยงาน', nameLabel: 'ชื่อหน่วยงาน', codePh: 'เช่น 02010', namePh: 'เช่น สำนักงานเขตพระนคร', codeMax: 10,
  formHint: 'ใช้เป็นตัวเลือกหน่วยงานในระบบประมวลผล',
  searchPh: 'ค้นหารหัสหน่วยงาน, ชื่อหน่วยงาน...',
  footnote: 'เฉพาะหน่วยงานที่ “เปิดใช้งาน” จะแสดงเป็นตัวเลือกในหน้าที่เกี่ยวข้อง · ปิดใช้งานแล้วข้อมูลเดิมยังคงอยู่',
  seed: () => {
    const seen = {};
    return pccnAffil().filter(r => r.code && !seen[r.code] && (seen[r.code] = 1)).map(r => ({ id: 'UNIT-' + r.code, code: r.code, name: r.name, note: '', enabled: r.on !== false, updatedBy: 'มนตรี ศรีสุข', updatedAt: '2026-06-01 09:00' }));
  }
};
const PC_ZONE_CFG = {
  usageLabel: PC_AFFIL_REF_LABEL,
  usage: rec => window.pcAffilRefs(r => r.zone === rec.code).map(r => r.code + ' — ' + r.name),
  key: 'pc_const_zone_v1', idPrefix: 'ZONE-', module: 'ประมวลผลและจัดเก็บ — ค่าคงที่รหัสเขต',
  screen: 'ค่าคงที่รหัสเขต', title: 'รหัสเขต', entity: 'รหัสเขต',
  subtitle: 'กำหนดรหัสเขตและชื่อเขต ใช้เป็นตัวเลือกในข้อกำหนดรายละเอียดสังกัดและเมนูที่เกี่ยวข้อง',
  codeLabel: 'รหัสเขต', nameLabel: 'ชื่อเขต', codePh: 'เช่น 09', namePh: 'เช่น เขตภาคเหนือตอนบน', codeMax: 6,
  formHint: 'ใช้เป็นตัวเลือกรหัสเขตในระบบประมวลผล',
  searchPh: 'ค้นหารหัสเขต, ชื่อเขต...',
  footnote: 'เฉพาะรหัสเขตที่ “เปิดใช้งาน” จะแสดงเป็นตัวเลือกในหน้าที่เกี่ยวข้อง · ปิดใช้งานแล้วข้อมูลเดิมยังคงอยู่',
  seed: () => {
    const seen = {};
    return pccnAffil().filter(r => r.zone && !seen[r.zone] && (seen[r.zone] = 1)).sort((a, b) => String(a.zone).localeCompare(String(b.zone))).map(r => ({ id: 'ZONE-' + r.zone, code: r.zone, name: r.dept ? 'เขต ' + r.zone + ' — ' + r.dept : 'เขต ' + r.zone, note: '', enabled: true, updatedBy: 'มนตรี ศรีสุข', updatedAt: '2026-06-01 09:00' }));
  }
};
function PcUnitConstPage({ onToast }) { return React.createElement(PcCodeNameConstPage, { cfg: PC_UNIT_CFG, onToast: onToast }); }
function PcZoneConstPage({ onToast }) { return React.createElement(PcCodeNameConstPage, { cfg: PC_ZONE_CFG, onToast: onToast }); }
Object.assign(window, { PcCodeNameConstPage, PcUnitConstPage, PcZoneConstPage });

// ═════════════════════════════════════════════════════════════════
//  กำหนดระดับการอนุมัติ — รูปแบบเดียวกับเมนูหน่วยงาน
//  ตาราง (สถานะ/สวิตช์ใช้งาน/แก้ไข) · รายละเอียดวงเงิน/สิทธิ์อยู่ใน popup
// ═════════════════════════════════════════════════════════════════
const pcApvNum = v => (Number(v) || 0).toLocaleString('en-US');
function PcApvMoney({ id, value, onChange, unit }) {
  const h = React.createElement;
  return h("div", { style: { display: 'flex', alignItems: 'center', gap: 6 } },
    h("input", { id: id, inputMode: "numeric", value: pcApvNum(value),
      onChange: e => onChange(Number(String(e.target.value).replace(/[^0-9]/g, '')) || 0),
      style: { width: '100%', height: 32, padding: '0 10px', border: '1px solid #d9d9d9', borderRadius: 2, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 13, textAlign: 'right', color: 'rgba(0,0,0,.88)', outline: 'none', boxSizing: 'border-box' } }),
    null);
}
const pcApvSec = (h, t) => h("div", { style: { fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,.88)', lineHeight: 1.3, margin: '4px 0 -2px' } }, t);
const PC_APV_CFG = {
  key: 'pc_const_approval_v1', idPrefix: 'APV-', module: 'ประมวลผลและจัดเก็บ — กำหนดระดับการอนุมัติ',
  screen: 'กำหนดระดับการอนุมัติ', title: 'กำหนดระดับการอนุมัติ', entity: 'ระดับการอนุมัติ',
  subtitle: 'กำหนดวงเงินอนุมัติเงินกู้ เงินฝาก และสิทธิ์การปรับปรุงรายการของแต่ละระดับ',
  codeLabel: 'รหัส', nameLabel: 'คำอธิบาย', codePh: 'เช่น 00010', namePh: 'เช่น ผู้จัดการ', codeMax: 5,
  formHint: 'กำหนดวงเงินและสิทธิ์ของระดับการอนุมัติ',
  searchPh: 'ค้นหารหัส', searchKeys: ['code'],
  footnote: 'เฉพาะระดับการอนุมัติที่ “เปิดใช้งาน” จะใช้ตรวจสอบสิทธิ์ในการทำรายการ · ปิดใช้งานแล้วข้อมูลเดิมยังคงอยู่',
  noNote: true, formWidth: 720, tableMin: 1080,
  blank: list => ({ code: String(Math.max(0, ...list.map(r => Number(r.code) || 0)) + 1).padStart(5, '0'), name: '', loanMax: 0, withdrawMax: 0, depositMax: 0, flags: [], enabled: true }),
  seed: () => CST_APPROVAL_SEED.map(r => ({ id: 'APV-' + r.code, code: r.code, name: r.label, loanMax: r.loanMax, withdrawMax: r.withdrawMax, depositMax: r.depositMax, flags: (r.flags || []).slice(), enabled: true, updatedBy: 'มนตรี ศรีสุข', updatedAt: '2026-06-01 09:00' })),
  cols: [
    { label: 'วงเงินกู้อนุมัติสูงสุด', th: { width: 150, textAlign: 'right' }, td: { textAlign: 'right', fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12 }, render: r => pcApvNum(r.loanMax) },
    { label: 'ถอนได้สูงสุด', th: { width: 130, textAlign: 'right' }, td: { textAlign: 'right', fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12 }, render: r => pcApvNum(r.withdrawMax) },
    { label: 'ฝากได้สูงสุด', th: { width: 130, textAlign: 'right' }, td: { textAlign: 'right', fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12 }, render: r => pcApvNum(r.depositMax) },
    { label: 'สิทธิ์ปรับปรุงรายการ', th: { width: 140, textAlign: 'center' }, td: { textAlign: 'center', fontSize: 12 },
      render: r => (r.flags || []).length ? React.createElement("span", { title: r.flags.join('\n') }, r.flags.length + ' รายการ') : React.createElement("span", { style: { color: 'rgba(0,0,0,.35)' } }, '—') }
  ],
  formExtra: (f, set, { lbl }) => {
    const h = React.createElement;
    const flags = f.flags || [];
    return h(React.Fragment, null,
      pcApvSec(h, 'ระดับการอนุมัติ (เงินกู้)'),
      h("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
        h("div", null, h("label", { style: lbl, htmlFor: "apv-loan" }, "วงเงินกู้อนุมัติสูงสุด (บาท)"), h(PcApvMoney, { id: "apv-loan", value: f.loanMax, onChange: v => set('loanMax', v) }))),
      pcApvSec(h, 'ระดับการอนุมัติ (เงินฝาก)'),
      h("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
        h("div", null, h("label", { style: lbl, htmlFor: "apv-wd" }, "ถอนได้สูงสุด (บาท)"), h(PcApvMoney, { id: "apv-wd", value: f.withdrawMax, onChange: v => set('withdrawMax', v) })),
        h("div", null, h("label", { style: lbl, htmlFor: "apv-dp" }, "ฝากได้สูงสุด (บาท)"), h(PcApvMoney, { id: "apv-dp", value: f.depositMax, onChange: v => set('depositMax', v) }))),
      pcApvSec(h, 'การปรับปรุงรายการ'),
      h("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' } },
        CST_APPROVAL_FLAGS.map(fl => h(CstCheck, { key: fl, label: fl, checked: flags.includes(fl),
          onChange: on => set('flags', on ? [...flags, fl] : flags.filter(x => x !== fl)) }))));
  }
};
function ApprovalLevelConfigPage({ onToast }) { return React.createElement(PcCodeNameConstPage, { cfg: PC_APV_CFG, onToast: onToast }); }
Object.assign(window, { ApprovalLevelConfigPage });

// ─── ตัวเลือกจากค่าคงที่ (ใช้ในข้อกำหนดรายละเอียดสังกัด ฯลฯ) ─────────
const pcConstList = cfg => {
  try {
    const s = localStorage.getItem(cfg.key);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return cfg.seed();
};
window.pcUnitOptions = () => pcConstList(PC_UNIT_CFG).slice().sort((a, b) => String(a.code).localeCompare(String(b.code)));
window.pcZoneOptions = () => pcConstList(PC_ZONE_CFG).slice().sort((a, b) => String(a.code).localeCompare(String(b.code)));
