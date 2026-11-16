// ════════════════════════════════════════════════════════════════════
//  ประมวลผลและจัดเก็บ › สินเชื่อ — อนุมัติเปลี่ยนแปลงงวดชำระ
//  ขั้นตอน: ① เลือกช่วง "วันที่เปลี่ยน" → ดึงข้อมูล
//           ② พิจารณาทีละรายการ / เลือกหลายรายการ / ทั้งหมด
//           ③ ยืนยันผ่านโมดัล (ไม่อนุมัติต้องระบุสาเหตุ + การดำเนินการ)
//  รูปแบบขั้นตอนเดียวกับเมนู "อนุมัติสินเชื่อ" (ระบบสินเชื่อ)
// ════════════════════════════════════════════════════════════════════

const PCX_IC_ROWS = [{
  doc: 'CL69001163',
  contract: 'ส7.66-009233',
  reg: '049049',
  date: '2026-01-14',
  om: 'คงยอด',
  op: 15500,
  os: 'ส่งปกติ',
  nm: 'คงยอด',
  np: 15500,
  ns: 'งดต้น',
  by: 'jeerana'
}, {
  doc: 'CL69001191',
  contract: 'ส7.67-008930',
  reg: '059798',
  date: '2026-01-16',
  om: 'คงยอด',
  op: 6300,
  os: 'งดส่ง',
  nm: 'คงยอด',
  np: 6300,
  ns: 'ส่งปกติ',
  by: 'jeerana'
}, {
  doc: 'CL69001192',
  contract: 'ส7.67-080313',
  reg: '059798',
  date: '2026-01-16',
  om: 'คงยอด',
  op: 400,
  os: 'งดส่ง',
  nm: 'คงยอด',
  np: 400,
  ns: 'ส่งปกติ',
  by: 'jeerana'
}, {
  doc: 'CL69001193',
  contract: 'ส7.67-067933',
  reg: '059798',
  date: '2026-01-16',
  om: 'คงยอด',
  op: 2167,
  os: 'งดส่ง',
  nm: 'คงยอด',
  np: 2167,
  ns: 'ส่งปกติ',
  by: 'jeerana'
}, {
  doc: 'CL69001295',
  contract: 'สจ.66-005617',
  reg: '052970',
  date: '2026-01-16',
  om: 'ตามงวด',
  op: 8500,
  os: 'ส่งปกติ',
  nm: 'ตามงวด',
  np: 10000,
  ns: 'ส่งปกติ',
  by: 'SORACHAI.I'
}, {
  doc: 'CL69001223',
  contract: 'ส6.66-007532',
  reg: '057245',
  date: '2026-01-20',
  om: 'คงยอด',
  op: 5000,
  os: 'งดส่ง',
  nm: 'คงยอด',
  np: 5000,
  ns: 'ส่งปกติ',
  by: 'jeerana'
}, {
  doc: 'CL69001237',
  contract: 'ส7.62-001599',
  reg: '034240',
  date: '2026-01-22',
  om: 'คงยอด',
  op: 35400,
  os: 'ส่งปกติ',
  nm: 'คงยอด',
  np: 45400,
  ns: 'ส่งปกติ',
  by: 'SORACHAI.I'
}, {
  doc: 'CL69001239',
  contract: 'สห.67-003476',
  reg: '039620',
  date: '2026-01-22',
  om: 'คงต้น',
  op: 8600,
  os: 'ส่งปกติ',
  nm: 'คงต้น',
  np: 14000,
  ns: 'ส่งปกติ',
  by: 'SORACHAI.I'
}, {
  doc: 'CL69001241',
  contract: 'ส7.67-000358',
  reg: '055255',
  date: '2026-01-22',
  om: 'คงยอด',
  op: 10600,
  os: 'ส่งปกติ',
  nm: 'คงยอด',
  np: 10600,
  ns: 'งดต้น',
  by: 'jeerana'
}, {
  doc: 'CL69001242',
  contract: 'ส6.67-004363',
  reg: '030885',
  date: '2026-01-23',
  om: 'คงยอด',
  op: 31000,
  os: 'ส่งปกติ',
  nm: 'คงยอด',
  np: 31000,
  ns: 'งดต้น',
  by: 'PRAPAWAN'
}, {
  doc: 'CL69001251',
  contract: 'ฉฉ.68-015825',
  reg: '055292',
  date: '2026-01-26',
  om: 'คงต้น',
  op: 700,
  os: 'ส่งปกติ',
  nm: 'คงต้น',
  np: 3000,
  ns: 'ส่งปกติ',
  by: 'SORACHAI.I'
}, {
  doc: 'CL69001261',
  contract: 'ส6.65-002665',
  reg: '049401',
  date: '2026-01-28',
  om: 'คงยอด',
  op: 22000,
  os: 'ส่งปกติ',
  nm: 'คงยอด',
  np: 25000,
  ns: 'ส่งปกติ',
  by: 'SORACHAI.I'
}, {
  doc: 'CL69001264',
  contract: 'ส6.68-003334',
  reg: '029302',
  date: '2026-01-28',
  om: 'คงยอด',
  op: 43900,
  os: 'ส่งปกติ',
  nm: 'คงยอด',
  np: 43900,
  ns: 'งดต้น',
  by: 'jeerana'
}, {
  doc: 'CL69001272',
  contract: 'สห.67-009394',
  reg: '018789',
  date: '2026-02-02',
  om: 'คงต้น',
  op: 300,
  os: 'ส่งปกติ',
  nm: 'คงต้น',
  np: 500,
  ns: 'ส่งปกติ',
  by: 'SORACHAI.I'
}];
const PCX_IC_TABS = [{
  id: 'all',
  label: 'ทั้งหมด'
}, {
  id: 'wait',
  label: 'รออนุมัติ'
}, {
  id: 'yes',
  label: 'อนุมัติแล้ว'
}, {
  id: 'no',
  label: 'ไม่อนุมัติ'
}];
// ที่เก็บใบคำขอเปลี่ยนแปลงงวดชำระ — ใช้ร่วมกับหน้า "ใบคำขอเปลี่ยนแปลงงวดชำระ" (395-mod.js)
//  ที่เก็บว่าง → ใช้ PCX_IC_ROWS เป็นค่าเริ่มต้น
const PCX_IC_KEY = 'pcx_installment_change_requests_v1';
const pcxIcLoad = () => {
  try {
    const s = localStorage.getItem(PCX_IC_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return PCX_IC_ROWS.map(r => ({
    ...r,
    status: 'รออนุมัติ',
    decision: 'wait',
    disposition: '',
    reason: '',
    decidedBy: '',
    decidedAt: ''
  }));
};
const pcxIcSave = list => {
  try {
    localStorage.setItem(PCX_IC_KEY, JSON.stringify(list));
  } catch (e) {}
};

// ชื่อผู้ใช้ (login) → ชื่อผู้ทำรายการ — 'jeerana' คือ login ของผู้ใช้ปัจจุบัน (CCD_USER)
const pcxIcByName = by => by === 'jeerana' ? window.CCD_USER || '' : by;
const pcxIcPill = r => r.decision === 'yes' ? {
  l: 'อนุมัติแล้ว',
  pill: 'ok'
} : r.decision === 'no' && r.disposition === 'return' ? {
  l: 'ไม่อนุมัติ · ส่งกลับแก้ไข',
  pill: 'bad'
} : r.decision === 'no' ? {
  l: 'ไม่อนุมัติ',
  pill: 'bad'
} : {
  l: 'รออนุมัติ',
  pill: 'warn'
};
function PcxIcApproveModal({
  items,
  onClose,
  onConfirm
}) {
  const total = items.reduce((s, x) => s + (Number(x.np) || 0), 0);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    style: {
      width: 620,
      maxWidth: '95vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", null, "ยืนยันการอนุมัติ (", items.length, " รายการ)"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 1
    }
  }, "ยอดส่งชำระใหม่รวม ", pcxMoney(total), " บาท/งวด")), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll",
    style: {
      maxHeight: 300
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "เลขที่เอกสาร"), /*#__PURE__*/React.createElement("th", null, "สัญญา"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "เดิม"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "ใหม่"), /*#__PURE__*/React.createElement("th", null, "สถานะใหม่"))), /*#__PURE__*/React.createElement("tbody", null, items.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.doc
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.doc), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.contract), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney(r.op)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney(r.np)), /*#__PURE__*/React.createElement("td", null, r.ns))))))), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), " การดำเนินการนี้จะถูกบันทึกใน Audit Trail")), /*#__PURE__*/React.createElement("div", {
    className: "dba-drawer-foot",
    style: {
      position: 'static'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "ยกเลิก"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => onConfirm(items)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " ยืนยันอนุมัติ ", items.length, " รายการ"))));
}
function PcxIcRejectModal({
  items,
  onClose,
  onConfirm
}) {
  const [reason, setReason] = React.useState('');
  const [disposition, setDisposition] = React.useState('return');
  const [err, setErr] = React.useState('');
  const submit = () => {
    if (!reason.trim()) {
      setErr('กรุณาระบุสาเหตุที่ไม่อนุมัติ');
      return;
    }
    onConfirm(items, disposition, reason.trim());
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    style: {
      width: 560,
      maxWidth: '95vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", null, "ไม่อนุมัติ (", items.length, " รายการ)"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 1
    }
  }, "ระบุสาเหตุและการดำเนินการต่อ")), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label"
  }, "การดำเนินการ"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "lrq-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "pcx-disp",
    checked: disposition === 'return',
    onChange: () => setDisposition('return')
  }), "ส่งกลับให้ผู้ทำรายการแก้ไข"), /*#__PURE__*/React.createElement("label", {
    className: "lrq-check"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "pcx-disp",
    checked: disposition === 'closed',
    onChange: () => setDisposition('closed')
  }), "ปิดการทำงาน (ยกเลิกคำขอ)")), /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label",
    style: {
      marginTop: 14
    }
  }, "สาเหตุที่ไม่อนุมัติ ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 3,
    value: reason,
    maxLength: 300,
    onChange: e => {
      setReason(e.target.value);
      setErr('');
    },
    placeholder: "เช่น ยอดส่งชำระใหม่ต่ำกว่าเกณฑ์ขั้นต่ำของประเภทเงินกู้"
  }), err && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", err)), /*#__PURE__*/React.createElement("div", {
    className: "dba-drawer-foot",
    style: {
      position: 'static'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "ยกเลิก"), /*#__PURE__*/React.createElement("button", {
    className: "btn danger",
    onClick: submit
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 13
  }), " ยืนยันไม่อนุมัติ"))));
}
function PcxIcResultModal({
  result,
  onClose
}) {
  const ok = result.kind === 'approved';
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    style: {
      width: 470,
      maxWidth: '95vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ok ? 'check' : 'close'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", null, ok ? 'อนุมัติเรียบร้อยแล้ว' : 'บันทึกผลไม่อนุมัติแล้ว'), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 1
    }
  }, result.items.length, " รายการ", result.dispLabel ? ' · ' + result.dispLabel : '')), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ccd-audit"
  }, result.items.slice(0, 8).map(r => /*#__PURE__*/React.createElement("div", {
    className: "ccd-audit-row",
    key: r.doc
  }, /*#__PURE__*/React.createElement("span", {
    className: "ccd-audit-k mono"
  }, r.doc), /*#__PURE__*/React.createElement("span", {
    className: "ccd-audit-v mono"
  }, r.contract, " \xB7 ", pcxMoney(r.np)))), result.items.length > 8 && /*#__PURE__*/React.createElement("div", {
    className: "ccd-audit-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ccd-audit-k muted"
  }, "และอีก ", result.items.length - 8, " รายการ"), /*#__PURE__*/React.createElement("span", null)))), /*#__PURE__*/React.createElement("div", {
    className: "dba-drawer-foot",
    style: {
      position: 'static'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: onClose
  }, "ปิด"))));
}
function InstallmentChangeApprovePage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState(today);
  const [fetched, setFetched] = useState(() => ({
    from: '2026-01-01',
    to: today
  }));
  const [rows, setRows] = useState(() => pcxIcLoad().filter(r => r.date >= '2026-01-01' && r.date <= today));
  const me = window.LOGIN_USER.name;
  const [q, setQ] = useState(me); // ค่าเริ่มต้น: ชื่อผู้ทำรายการ (ลบออกเพื่อดูทั้งหมด)
  const [tab, setTab] = useState('wait'); // ค่าเริ่มต้น: เฉพาะรายการรออนุมัติ
  const [page, setPage] = useState(1);
  const [PAGE, setPageSize] = useState(20);
  const [sel, setSel] = useState(() => new Set());
  const [approveItems, setApproveItems] = useState(null);
  const [rejectItems, setRejectItems] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const matchQ = r => {
    if (!q.trim()) return true;
    const k = q.trim().toLowerCase();
    return [r.doc, r.contract, r.reg, r.by, pcxIcByName(r.by)].some(v => String(v || '').toLowerCase().includes(k));
  };
  const qRows = rows.filter(matchQ); // ตัวเลขบนแท็บนับตามคำค้น
  const cnt = {
    all: qRows.length,
    wait: qRows.filter(r => r.decision === 'wait').length,
    yes: qRows.filter(r => r.decision === 'yes').length,
    no: qRows.filter(r => r.decision === 'no').length
  };
  const shown = qRows.filter(r => tab === 'all' || r.decision === tab);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE));
  const curPage = Math.min(page, pageCount);
  const pageRows = shown.slice((curPage - 1) * PAGE, curPage * PAGE);
  const selItems = shown.filter(r => sel.has(r.doc));
  const waitRows = shown.filter(r => r.decision === 'wait'); // ทุกหน้า
  const allWait = qRows.filter(r => r.decision === 'wait'); // อนุมัติทั้งหมด — ทุกแท็บ ตามคำค้น
  const allSelected = waitRows.length > 0 && waitRows.every(r => sel.has(r.doc));
  const clearSel = () => setSel(new Set());
  const toggleSel = doc => setSel(s => {
    const n = new Set(s);
    n.has(doc) ? n.delete(doc) : n.add(doc);
    return n;
  });
  const doFetch = () => {
    if (!from || !to) {
      setError('กรุณาระบุ "วันที่เปลี่ยน — จากวันที่ / ถึงวันที่" ก่อนดึงข้อมูล');
      return;
    }
    if (from > to) {
      setError('ช่วงวันที่ไม่ถูกต้อง — จากวันที่ต้องไม่มากกว่าถึงวันที่');
      return;
    }
    setError('');
    const data = pcxIcLoad().filter(r => r.date >= from && r.date <= to);
    setRows(data);
    setFetched({
      from,
      to
    });
    setPage(1);
    clearSel();
    onToast && onToast(data.length ? 'ดึงข้อมูลคำขอเปลี่ยนแปลงงวดชำระ ' + data.length + ' รายการ' : 'ไม่พบข้อมูลในช่วงวันที่ที่ระบุ');
  };
  const resetFilter = () => {
    setQ('');
    setFrom('2026-01-01');
    setTo(today);
    setTab('wait');
    setPage(1);
    clearSel();
    setError('');
    setRows(pcxIcLoad().filter(r => r.date >= '2026-01-01' && r.date <= today));
    setFetched({
      from: '2026-01-01',
      to: today
    });
  };
  const clearAll = () => {
    setRows([]);
    setFetched(null);
    clearSel();
    setQ(me);
    setTab('wait');
    setPage(1);
    setError('');
  };
  const applyDecision = (items, decision, disposition, reason) => {
    const at = window.fmt.date(today) + ' ' + new Date().toTimeString().slice(0, 5) + ' น.';
    const by = window.CCD_USER || 'ผู้อนุมัติ';
    const ids = new Set(items.map(i => i.doc));
    const isReturn = decision === 'no' && disposition === 'return';
    // ส่งกลับ → ใบคำขอกลับเป็น "รออนุมัติ" (สถานะที่หน้าใบคำขอแก้ไขได้) พร้อมเหตุผล
    const patch = {
      decision,
      disposition: disposition || '',
      reason: reason || '',
      decidedBy: by,
      decidedAt: at,
      status: decision === 'yes' ? 'อนุมัติ' : isReturn ? 'รออนุมัติ' : 'ไม่อนุมัติ',
      returned: isReturn,
      returnReason: isReturn ? reason || '' : ''
    };
    setRows(rs => rs.map(r => ids.has(r.doc) ? {
      ...r,
      ...patch
    } : r));
    pcxIcSave(pcxIcLoad().map(r => ids.has(r.doc) ? {
      ...r,
      ...patch
    } : r));
    clearSel();
    setApproveItems(null);
    setRejectItems(null);
    const dispLabel = disposition === 'closed' ? 'ปิดการทำงาน' : disposition === 'return' ? 'ส่งกลับให้ผู้ทำรายการแก้ไข' : '';
    audit && audit.log && audit.log({
      action: decision === 'yes' ? 'approve' : 'reject',
      module: 'ประมวลผลและจัดเก็บ — อนุมัติเปลี่ยนแปลงงวดชำระ',
      target: items.length > 1 ? items.length + ' รายการ' : items[0].doc + ' · ' + items[0].contract,
      summary: decision === 'yes' ? 'อนุมัติเปลี่ยนแปลงงวดชำระ ' + items.length + ' รายการ (ช่วง ' + window.fmt.date(fetched.from) + ' - ' + window.fmt.date(fetched.to) + ')' : 'ไม่อนุมัติ ' + items.length + ' รายการ · ' + dispLabel + ' · ' + reason,
      changes: items.slice(0, 12).map(r => ({
        field: r.doc + ' · ' + r.contract,
        before: r.om + ' ' + pcxMoney(r.op) + ' (' + r.os + ')',
        after: r.nm + ' ' + pcxMoney(r.np) + ' (' + r.ns + ')'
      }))
    });
    setResult({
      kind: decision === 'yes' ? 'approved' : 'rejected',
      items,
      dispLabel
    });
    onToast && onToast(decision === 'yes' ? 'อนุมัติ ' + items.length + ' รายการเรียบร้อยแล้ว' : 'ไม่อนุมัติ ' + items.length + ' รายการ — ' + dispLabel);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "อนุมัติเปลี่ยนแปลงงวดชำระ"
  }, /*#__PURE__*/React.createElement(PcxHead, {
    icon: "check",
    title: "อนุมัติเปลี่ยนแปลงงวดชำระ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 ดึงข้อมูลตามช่วงวันที่ แล้วพิจารณาอนุมัติทีละรายการ หรือติ๊กเลือกหลายรายการ",
    actions: null
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      padding: '0 16px 16px',
      overflow: 'hidden',
      borderRadius: 12,
      borderColor: 'rgba(0,0,0,.1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: 10,
      margin: '0 -16px',
      padding: '14px 16px 6px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 1 320px',
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "ia-q",
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "ค้นหา"), /*#__PURE__*/React.createElement("label", {
    className: "sh-search-input",
    style: {
      width: '100%',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  }), /*#__PURE__*/React.createElement("input", {
    id: "ia-q",
    value: q,
    onChange: e => {
      setQ(e.target.value);
      setPage(1);
    },
    onKeyDown: e => e.key === 'Enter' && doFetch(),
    placeholder: "เลขที่เอกสาร / สัญญา / เลขสมาชิก / ผู้ทำรายการ\u2026"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "วันที่เปลี่ยน ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 170
    }
  }, pcxDate(from, v => {
    setFrom(v);
    setError('');
  })), /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 170
    }
  }, pcxDate(to, v => {
    setTo(v);
    setError('');
  })))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary",
    onClick: doFetch
  }, "ค้นหา"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: resetFilter
  }, "รีเซ็ต")), /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      margin: '0 -16px 12px',
      padding: '0 16px',
      borderBottom: '1px solid var(--border-light, #f0f0f0)'
    }
  }, PCX_IC_TABS.map(t => {
    const on = tab === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      role: "tab",
      "aria-selected": on,
      onClick: () => {
        setTab(t.id);
        setPage(1);
        clearSel();
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 44,
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
    }, t.label, /*#__PURE__*/React.createElement("span", {
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
    }, cnt[t.id]));
  })), selItems.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      padding: '10px 14px',
      marginBottom: 12,
      background: '#f0f7f3',
      border: '1px solid #9cc5ad',
      borderRadius: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("b", null, selItems.length, " รายการที่เลือก"), /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, " \xB7 รวมชำระ/งวดใหม่ ", pcxMoney(selItems.reduce((t, r) => t + (Number(r.np) || 0), 0)), " บาท")), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: () => setApproveItems(selItems)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12
  }), " อนุมัติที่เลือก (", selItems.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn danger sm",
    onClick: () => setRejectItems(selItems)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 12
  }), " ไม่อนุมัติที่เลือก (", selItems.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn text sm",
    onClick: clearSel
  }, "ยกเลิกการเลือก")), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 1300,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    style: {
      width: 38
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: allSelected,
    disabled: !waitRows.length,
    title: 'เลือกรายการรออนุมัติทั้งหมดทุกหน้า (' + waitRows.length + ' รายการ)',
    onChange: e => setSel(e.target.checked ? new Set(waitRows.map(r => r.doc)) : new Set())
  })), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    style: {
      width: 54,
      textAlign: 'center'
    }
  }, "ลำดับ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "เลขที่เอกสาร/สัญญา"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "เลขสมาชิก"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "วันที่เปลี่ยน"), /*#__PURE__*/React.createElement("th", {
    colSpan: 3,
    style: {
      textAlign: 'center'
    }
  }, "การส่งเดิม"), /*#__PURE__*/React.createElement("th", {
    colSpan: 3,
    style: {
      textAlign: 'center'
    }
  }, "การส่งใหม่"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "ผู้ทำรายการ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    style: {
      width: 180
    }
  }, "จัดการ")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "รูปแบบ"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "ชำระ/งวด"), /*#__PURE__*/React.createElement("th", null, "สถานะ"), /*#__PURE__*/React.createElement("th", null, "รูปแบบ"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "ชำระ/งวด"), /*#__PURE__*/React.createElement("th", null, "สถานะ"))), /*#__PURE__*/React.createElement("tbody", null, pageRows.map((r, idx) => {
    const st = pcxIcPill(r);
    const wait = r.decision === 'wait';
    return /*#__PURE__*/React.createElement("tr", {
      key: r.doc,
      className: sel.has(r.doc) ? 'selected' : ''
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: sel.has(r.doc),
      disabled: !wait,
      onChange: () => toggleSel(r.doc)
    })), /*#__PURE__*/React.createElement("td", {
      className: "mono muted",
      style: {
        textAlign: 'center'
      }
    }, (curPage - 1) * PAGE + idx + 1), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, /*#__PURE__*/React.createElement("div", null, r.doc), /*#__PURE__*/React.createElement("div", {
      className: "muted",
      style: {
        fontSize: 11
      }
    }, r.contract)), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, r.reg), /*#__PURE__*/React.createElement("td", {
      className: "mono"
    }, window.fmt.date(r.date)), /*#__PURE__*/React.createElement("td", null, r.om), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        textAlign: 'right'
      }
    }, pcxMoney(r.op)), /*#__PURE__*/React.createElement("td", null, r.os), /*#__PURE__*/React.createElement("td", null, r.nm), /*#__PURE__*/React.createElement("td", {
      className: "mono",
      style: {
        textAlign: 'right'
      }
    }, pcxMoney(r.np)), /*#__PURE__*/React.createElement("td", null, r.ns), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", null, pcxIcByName(r.by)), pcxIcByName(r.by) !== r.by && /*#__PURE__*/React.createElement("div", {
      className: "muted mono",
      style: {
        fontSize: 10.5
      }
    }, r.by)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: 'pill ' + st.pill
    }, st.l), !wait && r.decidedAt && /*#__PURE__*/React.createElement("div", {
      className: "muted",
      style: {
        fontSize: 10.5,
        marginTop: 2
      }
    }, r.decidedBy, " \xB7 ", r.decidedAt)), /*#__PURE__*/React.createElement("td", null, wait ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: () => setApproveItems([r])
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 12
    }), " อนุมัติ"), /*#__PURE__*/React.createElement("button", {
      className: "btn danger sm",
      onClick: () => setRejectItems([r])
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 12
    }), " ไม่อนุมัติ")) : /*#__PURE__*/React.createElement("span", {
      className: "muted",
      style: {
        fontSize: 11.5
      }
    }, r.reason || 'พิจารณาแล้ว')));
  }), !shown.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 14,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "ไม่พบข้อมูล")))))), /*#__PURE__*/React.createElement("div", {
    className: "sh-pager",
    style: {
      padding: '12px 0 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, shown.length ? (curPage - 1) * PAGE + 1 + '-' + Math.min(curPage * PAGE, shown.length) + ' จาก ' + shown.length + ' รายการ' : '0 รายการ'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "sh-pg",
    disabled: curPage === 1,
    onClick: () => setPage(curPage - 1),
    "aria-label": "หน้าก่อนหน้า"
  }, "\u2039"), Array.from({
    length: pageCount
  }, (_, k) => k + 1).map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    type: "button",
    className: 'sh-pg' + (p === curPage ? ' on' : ''),
    "aria-current": p === curPage ? 'page' : undefined,
    onClick: () => setPage(p)
  }, p)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "sh-pg",
    disabled: curPage === pageCount,
    onClick: () => setPage(curPage + 1),
    "aria-label": "หน้าถัดไป"
  }, "\u203A"), /*#__PURE__*/React.createElement("select", {
    className: "sh-per",
    value: PAGE,
    "aria-label": "จำนวนต่อหน้า",
    onChange: e => {
      setPageSize(Number(e.target.value));
      setPage(1);
    }
  }, [20, 50, 100].map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n, " / หน้า")))))), approveItems && /*#__PURE__*/React.createElement(PcxIcApproveModal, {
    items: approveItems,
    onClose: () => setApproveItems(null),
    onConfirm: items => applyDecision(items, 'yes')
  }), rejectItems && /*#__PURE__*/React.createElement(PcxIcRejectModal, {
    items: rejectItems,
    onClose: () => setRejectItems(null),
    onConfirm: (items, disp, reason) => applyDecision(items, 'no', disp, reason)
  }), result && /*#__PURE__*/React.createElement(PcxIcResultModal, {
    result: result,
    onClose: () => setResult(null)
  }));
}
Object.assign(window, {
  InstallmentChangeApprovePage,
  pcxIcLoad,
  pcxIcSave
});