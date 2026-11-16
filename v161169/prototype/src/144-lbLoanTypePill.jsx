// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ห้ามกู้
//  เพิ่มข้อมูลเหตุผลในการห้ามกู้ของสมาชิก: ค้นหาสมาชิก → เลือกประเภท
//  เงินกู้ → ระบุเหตุผลการห้ามกู้ / เหตุผลการกู้ต่อ → บันทึกข้อมูล
// ════════════════════════════════════════════════════════════════════

// pill ประเภทเงินกู้ (ใช้ร่วมกับหน้าตรวจสอบสิทธิค้ำ)
const lbLoanTypePill = s => {
  if (s.startsWith('ฉุกเฉิน')) return /*#__PURE__*/React.createElement("span", {
    className: "pill warn"
  }, s);
  if (s.startsWith('สามัญ')) return /*#__PURE__*/React.createElement("span", {
    className: "pill info"
  }, s);
  if (s.startsWith('พิเศษ')) return /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, s);
  return /*#__PURE__*/React.createElement("span", {
    className: "pill neutral"
  }, s);
};

// uid สำหรับรายการห้ามกู้แต่ละแถว
let _lbUidSeq = 0;
const lbUid = () => 'lb-' + ++_lbUidSeq;

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// ข้อมูล: รหัสสมาชิก · ชื่อ · นามสกุล · เลขที่บัตรประชาชน
function LbMemberSearchModal({
  onPick,
  onClose
}) {
  const [c, setC] = useState({
    code: '',
    firstName: '',
    lastName: '',
    citizenId: ''
  });
  const [results, setResults] = useState(() => window.GUAR_MEMBERS);
  const set = (k, v) => setC(p => ({
    ...p,
    [k]: v
  }));
  const run = () => setResults(window.searchGuarMembers(c));
  const reset = () => {
    setC({
      code: '',
      firstName: '',
      lastName: '',
      citizenId: ''
    });
    setResults(window.GUAR_MEMBERS);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card gc-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search"
  })), /*#__PURE__*/React.createElement("h2", null, "ค้นหาสมาชิก"), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose,
    "aria-label": "ปิด"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-search-grid lb-search-grid"
  }, /*#__PURE__*/React.createElement("label", {
    className: "gc-sf"
  }, /*#__PURE__*/React.createElement("span", null, "1. รหัสสมาชิก"), /*#__PURE__*/React.createElement("input", {
    value: c.code,
    onChange: e => set('code', e.target.value),
    onKeyDown: e => e.key === 'Enter' && run(),
    placeholder: "เช่น M-058241",
    className: "mono",
    autoFocus: true
  })), /*#__PURE__*/React.createElement("label", {
    className: "gc-sf"
  }, /*#__PURE__*/React.createElement("span", null, "2. ชื่อ"), /*#__PURE__*/React.createElement("input", {
    value: c.firstName,
    onChange: e => set('firstName', e.target.value),
    onKeyDown: e => e.key === 'Enter' && run(),
    placeholder: "ชื่อจริง"
  })), /*#__PURE__*/React.createElement("label", {
    className: "gc-sf"
  }, /*#__PURE__*/React.createElement("span", null, "3. นามสกุล"), /*#__PURE__*/React.createElement("input", {
    value: c.lastName,
    onChange: e => set('lastName', e.target.value),
    onKeyDown: e => e.key === 'Enter' && run(),
    placeholder: "นามสกุล"
  })), /*#__PURE__*/React.createElement("label", {
    className: "gc-sf"
  }, /*#__PURE__*/React.createElement("span", null, "4. เลขที่บัตรประชาชน"), /*#__PURE__*/React.createElement("input", {
    value: c.citizenId,
    onChange: e => set('citizenId', e.target.value),
    onKeyDown: e => e.key === 'Enter' && run(),
    placeholder: "เลขบัตรประชาชน",
    className: "mono"
  })), /*#__PURE__*/React.createElement("div", {
    className: "gc-sf-actions",
    style: {
      gridColumn: 'span 4'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: run
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search"
  }), " ค้นหา"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: reset
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh"
  }), " ล้าง"))), /*#__PURE__*/React.createElement("div", {
    className: "gc-sub-title",
    style: {
      marginTop: 4
    }
  }, "รายชื่อสมาชิก ", /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontWeight: 400
    }
  }, "\xB7 พบ ", results.length, " รายการ")), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll",
    style: {
      maxHeight: 300
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "รหัสสมาชิก"), /*#__PURE__*/React.createElement("th", null, "ชื่อ"), /*#__PURE__*/React.createElement("th", null, "นามสกุล"), /*#__PURE__*/React.createElement("th", null, "เลขที่บัตรประชาชน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 40
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, results.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "5",
    className: "empty-state"
  }, "ไม่พบสมาชิกที่ตรงกับเงื่อนไข")) : results.map(m => /*#__PURE__*/React.createElement("tr", {
    key: m.code,
    className: "clickable",
    onClick: () => onPick(m)
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, m.code), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "row-avatar"
  }, m.firstName.slice(0, 1)), /*#__PURE__*/React.createElement("span", null, m.title, m.firstName))), /*#__PURE__*/React.createElement("td", null, m.lastName), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, m.citizenId), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    style: {
      padding: '0 6px'
    },
    onClick: e => {
      e.stopPropagation();
      onPick(m);
    },
    title: "เลือกสมาชิก"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevRight"
  }))))))))))));
}

// ─── หน้าหลัก: ห้ามกู้ ───────────────────────────────────────────────
function LoanBanPage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  const workDate = window.DEPOSIT_WORKING_DATE;
  const [docNo, setDocNo] = useState(() => window.nextLoanBanDocNo());
  const [member, setMember] = useState(null);
  const [txnDate, setTxnDate] = useState(() => workDate); // วันที่ทำรายการ
  const [sel, setSel] = useState({}); // { [loanType]: null = ใช้เหตุผลหลัก | string = เหตุผลแยกเฉพาะประเภท }
  const [mainReason, setMainReason] = useState(''); // เหตุผลการห้ามกู้หลัก ใช้กับทุกประเภทที่เลือก
  const [pcEditing, setPcEditing] = React.useState(false);
  const [error, setError] = useState('');
  const [bans, setBans] = useState(() => window.LOAN_BAN_SEED.map(b => ({
    ...b,
    id: lbUid()
  })));
  const [cancelTarget, setCancelTarget] = useState(null);
  const [files, setFiles] = useState([]); // เอกสารแนบ [{ id, name, size }]
  const fileRef = React.useRef(null);
  const addFiles = list => {
    const arr = Array.from(list || []).map(x => ({
      id: lbUid(),
      name: x.name,
      size: x.size
    }));
    if (arr.length) setFiles(prev => [...prev, ...arr]);
  };
  const fmtSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const pick = m => {
    setMember(m);
    setError('');
    setSel({});
    setMainReason('');
    setFiles([]);
  };
  const memberBans = member ? bans.filter(b => b.memberCode === member.code) : [];
  // ประเภทที่ถูกห้ามกู้อยู่แล้ว (ยังไม่ปลดล็อก) ของสมาชิกรายนี้
  const activeBannedTypes = memberBans.filter(b => b.status === 'ห้ามกู้').map(b => b.loanType);

  // ติ๊ก / เอาออก ประเภทเงินกู้
  const toggleType = t => {
    setSel(prev => {
      const n = {
        ...prev
      };
      if (t in n) delete n[t];else n[t] = null;
      return n;
    });
    setError('');
  };
  const setReason = (t, v) => {
    setSel(prev => ({
      ...prev,
      [t]: v
    }));
    setError('');
  };
  // เปิด/ปิด การระบุเหตุผลแยกของประเภทนั้น (null = กลับไปใช้เหตุผลหลัก)
  const setOverride = (t, on) => {
    setSel(prev => ({
      ...prev,
      [t]: on ? '' : null
    }));
    setError('');
  };
  const selectedTypes = Object.keys(sel);
  const isOverride = t => typeof sel[t] === 'string';
  const reasonOf = t => (isOverride(t) ? sel[t] : mainReason) || '';
  const usesMain = selectedTypes.some(t => !isOverride(t));
  // ล้างข้อมูล — เคลียร์สมาชิก ประเภทที่เลือก เอกสารแนบ และวันที่ทำรายการ
  const resetForm = () => {
    setMember(null);
    setSel({});
    setMainReason('');
    setFiles([]);
    setError('');
    setTxnDate(workDate);
  };
  const save = () => {
    if (!member) {
      setError('กรุณาเลือกสมาชิกก่อนบันทึก');
      return false;
    }
    if (selectedTypes.length === 0) {
      setError('กรุณาเลือกประเภทเงินกู้ที่ต้องการห้ามกู้อย่างน้อย 1 รายการ');
      return false;
    }
    if (usesMain && !mainReason.trim()) {
      setError('กรุณาระบุเหตุผลการห้ามกู้');
      return false;
    }
    const missing = selectedTypes.filter(t => !reasonOf(t).trim());
    if (missing.length) {
      setError('กรุณาระบุเหตุผลแยกให้ครบ: ' + missing.join(', '));
      return false;
    }
    const list = selectedTypes.map(t => ({
      loanType: t,
      banReason: reasonOf(t).trim()
    }));
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const recs = list.map(it => ({
      id: lbUid(),
      docNo,
      memberCode: member.code,
      loanType: it.loanType,
      banReason: it.banReason,
      resumeReason: '',
      status: 'ห้ามกู้',
      txnDate,
      by: 'จันทร์เพ็ญ มาลี',
      ts,
      files: files.map(x => x.name)
    }));
    setBans(prev => [...recs, ...prev]);
    audit.log({
      action: 'create',
      module: 'สินเชื่อ — ห้ามกู้',
      target: `${member.code} · ${member.name}`,
      summary: `เพิ่มรายการห้ามกู้ ${list.length} ประเภท (${list.map(i => i.loanType).join(', ')}) เลขที่เอกสาร ${docNo}`,
      changes: [{
        field: 'เลขที่เอกสาร',
        before: '—',
        after: docNo
      }, {
        field: 'วันที่ทำรายการ',
        before: '—',
        after: fmt.date(txnDate)
      }, ...list.map(i => ({
        field: `ห้ามกู้ — ${i.loanType}`,
        before: '—',
        after: i.banReason
      })), ...(files.length ? [{
        field: 'เอกสารแนบ',
        before: '—',
        after: files.map(x => x.name).join(', ')
      }] : [])]
    });
    onToast && onToast(`บันทึกการห้ามกู้ ${docNo} · ${member.name} จำนวน ${list.length} ประเภทเรียบร้อยแล้ว`);
    setSel({});
    setMainReason('');
    setFiles([]);
    setError('');
    setDocNo(window.nextLoanBanDocNo());
    return true;
  };

  // ยกเลิกการห้ามกู้ (ปลดล็อก) — เลือกได้หลายประเภท ใช้เหตุผลการกู้ต่อเดียวกัน
  const confirmCancel = ({
    recs,
    resumeReason
  }) => {
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const ids = recs.map(r => r.id);
    setBans(prev => prev.map(b => ids.includes(b.id) ? {
      ...b,
      status: 'ปลดล็อก',
      resumeReason,
      cancelBy: 'จันทร์เพ็ญ มาลี',
      cancelTs: ts
    } : b));
    const types = recs.map(r => r.loanType);
    audit.log({
      action: 'update',
      module: 'สินเชื่อ — ห้ามกู้',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกการห้ามกู้ ${recs.length} ประเภท (${types.join(', ')})`,
      changes: [...recs.map(r => ({
        field: `สถานะ — ${r.loanType} (${r.docNo})`,
        before: 'ห้ามกู้',
        after: 'ปลดล็อก'
      })), {
        field: 'เหตุผลการกู้ต่อ',
        before: '—',
        after: resumeReason
      }]
    });
    onToast && onToast(`ยกเลิกการห้ามกู้ ${recs.length} ประเภท · ${member.name} เรียบร้อยแล้ว`);
    setCancelTarget(null);
  };
  // ฟิลด์แบบ label ด้านบน (รูปแบบเดียวกับระบบสินเชื่อ)
  const lbFld = (label, child, opt = {}) => /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      minWidth: 0,
      gridColumn: opt.span ? `span ${opt.span}` : undefined
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, label, opt.required && /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, " *")), child);
  const lbRO = (value, cls) => {
    const empty = value === undefined || value === null || value === '';
    return /*#__PURE__*/React.createElement("div", {
      className: 'icr-ro' + (cls ? ' ' + cls : '') + (empty ? ' empty' : ''),
      title: empty ? undefined : String(value)
    }, empty ? '—' : value);
  };
  const Picker = window.ErpMemberPicker;
  const DateIn = window.ErpDate;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "หน้าห้ามกู้",
    className: pcEditing ? undefined : 'pc-locked'
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-actions"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: '-.01em'
    }
  }, "ห้ามกู้"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 2
    }
  }, "เพิ่มข้อมูลเหตุผลในการห้ามกู้ของสมาชิก — เลือกห้ามได้หลายประเภทเงินกู้ และยกเลิกการห้ามกู้ได้")), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lb-top-actions"
  }, /*#__PURE__*/React.createElement(window.PcEditActions, {
      recordKey: member ? 'lb.' + member.code : '',
      editing: pcEditing,
      setEditing: setPcEditing,
      onSave: save,
      onDiscard: () => pick(member),
      title: "ห้ามกู้"
    }))), /*#__PURE__*/React.createElement("div", {
    className: "search-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "ข้อมูลเอกสารและสมาชิก")), /*#__PURE__*/React.createElement("div", {
    className: "lb-hdr7"
  }, lbFld("เลขที่เอกสาร", lbRO(docNo, 'mono icr-auto')), lbFld("เลขสมาชิก", Picker ? /*#__PURE__*/React.createElement(Picker, {
    member: member,
    onPick: pick,
    source: window.GUAR_MEMBERS,
    title: "ค้นหาสมาชิก — ห้ามกู้",
    placeholder: "ค้นหาเลขสมาชิก…",
    codeOnly: true
  }) : /*#__PURE__*/React.createElement(window.MemberSearchField, {
    member: member,
    onPick: pick,
    source: window.GUAR_MEMBERS,
    showName: false
  }), {
    required: true
  }), lbFld("ชื่อ-นามสกุล", lbRO(member ? member.name : '')), lbFld("สังกัด", lbRO(member ? member.unit : ''), {
    span: 2
  }), lbFld("ชื่อหน่วยงาน", lbRO(member ? member.department : '')), lbFld("วันที่ทำรายการ", DateIn ? /*#__PURE__*/React.createElement(DateIn, {
    value: txnDate,
    onChange: v => setTxnDate(v)
  }) : /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: txnDate || '',
    onChange: e => setTxnDate(e.target.value)
  }), {
    required: true
  }))), member ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "รายละเอียดการห้ามกู้"), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11,
      marginLeft: 'auto'
    }
  }, "เลือกประเภทเงินกู้ที่ต้องการห้ามกู้ (เลือกได้มากกว่า 1 ประเภท)")), /*#__PURE__*/React.createElement("div", {
    className: "lb-form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "lb-label"
  }, "ประเภทเงินกู้ที่ห้ามกู้ ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*"), selectedTypes.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontWeight: 400,
      marginLeft: 6
    }
  }, "\xB7 เลือกแล้ว ", selectedTypes.length, " ประเภท"))), /*#__PURE__*/React.createElement("div", {
    className: "lb-checklist"
  }, window.LOAN_BAN_TYPES.map(t => {
    const banned = activeBannedTypes.includes(t);
    const checked = (t in sel);
    return /*#__PURE__*/React.createElement("div", {
      className: "lb-check-item" + (checked ? ' on' : '') + (banned ? ' banned' : ''),
      key: t
    }, /*#__PURE__*/React.createElement("label", {
      className: "lb-check-main"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "ct-check",
      checked: checked,
      disabled: banned,
      onChange: () => toggleType(t)
    }), /*#__PURE__*/React.createElement("span", {
      className: "lb-check-name"
    }, t), banned && /*#__PURE__*/React.createElement("span", {
      className: "pill bad lb-check-tag"
    }, "ห้ามกู้อยู่แล้ว")), checked && (isOverride(t) ? /*#__PURE__*/React.createElement("div", {
      className: "lb-ovr"
    }, /*#__PURE__*/React.createElement("input", {
      className: "cfg-input lb-check-reason",
      autoFocus: true,
      "aria-label": "เหตุผลแยกของ " + t,
      placeholder: "ระบุเหตุผลเฉพาะประเภทนี้…",
      value: sel[t],
      onChange: e => setReason(t, e.target.value)
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "lb-ovr-link",
      onClick: () => setOverride(t, false)
    }, "ใช้เหตุผลหลัก")) : /*#__PURE__*/React.createElement("div", {
      className: "lb-ovr lb-ovr-main"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lb-ovr-note"
    }, "ใช้เหตุผลหลัก"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "lb-ovr-link",
      onClick: () => setOverride(t, true)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "edit",
      size: 12
    }), " ระบุเหตุผลแยก"))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "lb-field",
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "lb-label",
    htmlFor: "lb-main-reason"
  }, "เหตุผลการห้ามกู้ ", usesMain && /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*"), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontWeight: 400,
      marginLeft: 6
    }
  }, "\xB7 ใช้กับทุกประเภทที่เลือก ยกเว้นประเภทที่ระบุเหตุผลแยก")), /*#__PURE__*/React.createElement("textarea", {
    id: "lb-main-reason",
    className: "cfg-input",
    rows: 2,
    placeholder: "ระบุเหตุผลการห้ามกู้…",
    value: mainReason,
    onChange: e => {
      setMainReason(e.target.value);
      setError('');
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "lb-field",
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: "lb-label"
  }, "อัปโหลดเอกสาร", /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontWeight: 400,
      marginLeft: 6
    }
  }, "\xB7 แนบได้หลายไฟล์ (PDF, JPG, PNG, DOCX)")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lb-dropzone",
    onClick: () => fileRef.current && fileRef.current.click(),
    onDragOver: e => e.preventDefault(),
    onDrop: e => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "คลิก หรือ ลากไฟล์มาที่นี่ เพื่ออัปโหลด")), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    multiple: true,
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    style: {
      display: 'none'
    },
    onChange: e => {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }), files.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "lb-filelist"
  }, files.map(x => /*#__PURE__*/React.createElement("div", {
    key: x.id,
    className: "lb-file"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lb-file-ico",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "attach",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "lb-file-name",
    title: x.name
  }, x.name), /*#__PURE__*/React.createElement("span", {
    className: "lb-file-size mono"
  }, fmtSize(x.size)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-view",
    title: "ดูเอกสาร",
    "aria-label": "ดูเอกสาร " + x.name,
    onClick: () => onToast && onToast('เปิดไฟล์ ' + x.name)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "eye",
    size: 14
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-del",
    title: "ลบเอกสาร",
    "aria-label": "ลบเอกสาร " + x.name,
    onClick: () => setFiles(prev => prev.filter(y => y.id !== x.id))
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  })))))), error && /*#__PURE__*/React.createElement("div", {
    className: "dep-error"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), " ", error), /*#__PURE__*/React.createElement("div", {
    className: "lb-hint muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 12
  }), " ยกเลิกการห้ามกู้ได้ที่ตารางประวัติด้านล่าง โดยระบุ “เหตุผลการกู้ต่อ”"))), /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "ประวัติการห้ามกู้ของสมาชิก"), /*#__PURE__*/React.createElement("span", {
    className: "gc-count"
  }, memberBans.length, " รายการ")), memberBans.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "gc-empty"
  }, "— ยังไม่มีรายการห้ามกู้ของสมาชิกรายนี้ —") : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "เลขที่เอกสาร"), /*#__PURE__*/React.createElement("th", {
    className: "center"
  }, "ประเภทเงินกู้"), /*#__PURE__*/React.createElement("th", null, "เหตุผลการห้ามกู้"), /*#__PURE__*/React.createElement("th", null, "เหตุผลการกู้ต่อ"), /*#__PURE__*/React.createElement("th", {
    className: "center"
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", null, "บันทึกโดย"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 150
    }
  }, "การจัดการ"))), /*#__PURE__*/React.createElement("tbody", null, memberBans.map(b => /*#__PURE__*/React.createElement("tr", {
    key: b.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, b.docNo), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, lbLoanTypePill(b.loanType)), /*#__PURE__*/React.createElement("td", {
    style: {
      whiteSpace: 'normal',
      maxWidth: 260
    }
  }, b.banReason, b.files && b.files.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "attach",
    size: 11
  }), " แนบ ", b.files.length, " ไฟล์")), /*#__PURE__*/React.createElement("td", {
    style: {
      whiteSpace: 'normal',
      maxWidth: 220
    }
  }, b.resumeReason || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "—")), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, b.status === 'ห้ามกู้' ? /*#__PURE__*/React.createElement("span", {
    className: "pill bad"
  }, "ห้ามกู้") : /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, "ปลดล็อก")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", null, b.by), /*#__PURE__*/React.createElement("div", {
    className: "muted mono",
    style: {
      fontSize: 11
    }
  }, b.ts)), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, b.status === 'ห้ามกู้' ? /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm lb-cancel-btn",
    onClick: () => setCancelTarget(b)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "unlock",
    size: 13
  }), " ยกเลิกการห้ามกู้") : /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, "ปลดล็อกแล้ว", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, b.cancelTs || ''))))))))))) : /*#__PURE__*/React.createElement("div", {
    className: "search-card cs-empty",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-ph-ico",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    className: "gc-ph-title"
  }, "ยังไม่ได้เลือกสมาชิก"), /*#__PURE__*/React.createElement("div", {
    className: "gc-ph-sub"
  }, "ค้นหาและเลือกสมาชิกจากช่องเลขสมาชิกด้านบน เพื่อเพิ่มข้อมูลเหตุผลในการห้ามกู้")), cancelTarget && /*#__PURE__*/React.createElement(LbCancelModal, {
    rec: cancelTarget,
    actives: memberBans.filter(b => b.status === 'ห้ามกู้'),
    member: member,
    onClose: () => setCancelTarget(null),
    onConfirm: confirmCancel
  }));
}

// ─── โมดัลยกเลิกการห้ามกู้ — ต้องระบุเหตุผลการกู้ต่อ ─────────────────
function LbCancelModal({
  rec,
  actives,
  member,
  onClose,
  onConfirm
}) {
  const list = actives && actives.length ? actives : [rec];
  const [picked, setPicked] = useState(() => [rec.id]);
  const [resumeReason, setResume] = useState('');
  const [error, setError] = useState('');
  const allOn = picked.length === list.length;
  const togglePick = id => {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    setError('');
  };
  const submit = e => {
    e.preventDefault();
    if (!picked.length) {
      setError('กรุณาเลือกประเภทเงินกู้ที่ต้องการปลดล็อกอย่างน้อย 1 รายการ');
      return;
    }
    if (!resumeReason.trim()) {
      setError('กรุณาระบุเหตุผลการกู้ต่อ');
      return;
    }
    onConfirm({
      recs: list.filter(b => picked.includes(b.id)),
      resumeReason: resumeReason.trim()
    });
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "lb-cancel-title",
    style: {
      width: 540,
      maxWidth: '95vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "unlock"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", {
    id: "lb-cancel-title"
  }, "ยกเลิกการห้ามกู้"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, member.code, " \xB7 ", member.name)), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose,
    "aria-label": "ปิด"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("form", {
    className: "modal-body",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-label",
    style: {
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "เลือกประเภทเงินกู้ที่ต้องการปลดล็อก ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*"), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontWeight: 400,
      marginLeft: 6
    }
  }, "\xB7 เลือกแล้ว ", picked.length, " / ", list.length)), list.length > 1 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lb-ovr-link",
    onClick: () => setPicked(allOn ? [] : list.map(b => b.id))
  }, allOn ? 'ไม่เลือกทั้งหมด' : 'เลือกทั้งหมด')), /*#__PURE__*/React.createElement("div", {
    className: "lb-unlock-list"
  }, list.map(b => /*#__PURE__*/React.createElement("label", {
    key: b.id,
    className: "lb-unlock-item" + (picked.includes(b.id) ? ' on' : '')
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    className: "ct-check",
    checked: picked.includes(b.id),
    onChange: () => togglePick(b.id)
  }), /*#__PURE__*/React.createElement("span", {
    className: "lb-unlock-main"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lb-unlock-type"
  }, b.loanType), /*#__PURE__*/React.createElement("span", {
    className: "lb-unlock-reason muted"
  }, b.banReason)), /*#__PURE__*/React.createElement("span", {
    className: "mono muted",
    style: {
      fontSize: 11,
      flexShrink: 0
    }
  }, b.docNo)))), /*#__PURE__*/React.createElement("label", {
    className: "lb-label",
    htmlFor: "lb-resume-reason",
    style: {
      marginTop: 14
    }
  }, "เหตุผลการกู้ต่อ ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*"), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontWeight: 400,
      marginLeft: 6
    }
  }, "\xB7 ใช้กับทุกประเภทที่เลือก")), /*#__PURE__*/React.createElement("textarea", {
    id: "lb-resume-reason",
    className: "cfg-input",
    rows: 3,
    style: {
      marginTop: 6
    },
    placeholder: "ระบุเงื่อนไข / เหตุผลที่อนุญาตให้สมาชิกกลับมากู้ได้…",
    value: resumeReason,
    onChange: e => {
      setResume(e.target.value);
      setError('');
    }
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "dep-error",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), " ", error), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    onClick: onClose
  }, "ยกเลิก"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn primary",
    style: {
      flex: 1,
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check"
  }), " ยืนยันการกู้ต่อ", picked.length > 1 ? ` (${picked.length} ประเภท)` : '')))));
}
Object.assign(window, {
  LoanBanPage
});
