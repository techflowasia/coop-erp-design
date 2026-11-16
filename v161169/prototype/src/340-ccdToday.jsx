// ช่องจำนวนเงิน — แสดงคอมมา + ทศนิยม 2 ตำแหน่งเมื่อไม่ได้พิมพ์ · พิมพ์ได้เป็นตัวเลขล้วน
function CcdMoneyInput({
  value,
  onChange,
  disabled,
  over
}) {
  const [txt, setTxt] = React.useState(null);
  const has = value !== '' && value != null && !isNaN(Number(value));
  const disp = has ? window.fmt.money(Number(value), 2) : '';
  return /*#__PURE__*/React.createElement("input", {
    className: 'cfg-input mono' + (over ? ' ccd-over' : ''),
    inputMode: "decimal",
    disabled: disabled,
    placeholder: "0.00",
    style: {
      width: '100%',
      minWidth: 104,
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums'
    },
    value: txt != null ? txt : disp,
    onFocus: () => setTxt(has ? String(Number(value)) : ''),
    onBlur: () => {
      if (txt != null && txt !== '') onChange(Number(txt).toFixed(2));
      setTxt(null);
    },
    onChange: e => {
      const t = e.target.value.replace(/[^0-9.]/g, '');
      setTxt(t);
      onChange(t);
    }
  });
}
// ════════════════════════════════════════════════════════════════════
//  เปลี่ยนแปลงรายละเอียดสัญญา — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง: ① ข้อมูลสมาชิก + ข้อมูลสัญญา ② สรุป (stat) ③ รายละเอียด
//             การค้ำประกัน (ตารางแก้ไขได้) ④ หมายเหตุ + ข้อมูลแก้ไขล่าสุด
//  ใช้สมาชิก/สัญญาจาก DN_MEMBERS · DnMemberSearchModal (data/components-debt-notice)
// ════════════════════════════════════════════════════════════════════

const ccdToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function CcdFld({
  label,
  w,
  grow,
  fill,
  span,
  required,
  children
}) {
  const style = fill ? {
    minWidth: 0,
    gridColumn: span ? `span ${span}` : undefined
  } : grow ? {
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

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function CcdRO({
  value,
  mono,
  num,
  danger,
  placeholder
}) {
  const empty = value === undefined || value === null || value === '';
  return /*#__PURE__*/React.createElement("div", {
    className: 'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : ''),
    title: empty ? undefined : String(value),
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontVariantNumeric: 'tabular-nums'
    }
  }, empty ? placeholder || '—' : value);
}

// ════════════════════════════════════════════════════════════════════
// แปลงค่า type เก่าของระบบ (CCD) → รายการประเภทหลักประกันของหน้าสร้างใบคำขอกู้ (LR_COLL_KINDS)
const CCD_TYPE_MAP = {
  land: 'asset',
  other: 'asset'
};
const ccdCollKind = v => {
  const kinds = window.LR_COLL_KINDS || window.CCD_COLLATERAL_TYPES || [];
  const mapped = CCD_TYPE_MAP[v] || v;
  return kinds.some(k => k.v === mapped) ? mapped : kinds[0] ? kinds[0].v : mapped;
};

// เงินเดือนผู้ค้ำ — ดึงจากฐานเงินเดือนสมาชิก
const ccdSalaryOf = code => {
  const m = [window.DN_MEMBERS, window.MEMBERS_LIST, window.GUAR_MEMBERS].flatMap(l => l || []).find(x => x && x.code === code && x.salary);
  return m && Number(m.salary) || (window.SCHREQ_SALARY || {})[code] || 0;
};

// popup ดูหลักประกัน — โครงเดียวกับใบคำขอกู้ (CollateralDetailModal) · เติมข้อมูลจากแถวของสัญญา
const ccdCollView = (r, member, base) => {
  const kinds = window.LR_COLL_KINDS || [];
  const k = kinds.find(x => x.v === r.type) || {};
  const tpl = (window.LR_DEMO && window.LR_DEMO.collaterals || []).find(c => c.view && c.view.kind === r.type);
  const view = tpl ? JSON.parse(JSON.stringify(tpl.view)) : {
    kind: r.type,
    typeName: k.l,
    rows: []
  };
  const amt = Number(r.guaranteed) || 0,
    avail = Number(r.available) || 0;
  const pct = (base > 0 ? Math.min(100, amt / base * 100) : 0).toFixed(2) + '%';
  const nm = String(r.detail || '').trim();
  const parts = nm.replace(/^(นาย|นางสาว|นาง|น\.ส\.)/, '').split(/\s+/);
  const mcode = member ? String(member.code).replace(/^M-/, '') : '';
  const mname = member ? member.name : '';
  if (view.limit) view.limit = {
    max: avail,
    used: Math.max(0, avail - amt),
    locked: 0,
    remain: avail,
    pct,
    ok: amt
  };
  if (r.type === 'person' || r.type === 'share') {
    const nm2 = r.type === 'person' ? parts : String(mname).replace(/^(นาย|นางสาว|นาง|น\.ส\.)/, '').split(/\s+/);
    view.rows = (view.rows || []).slice(0, 1).map(x => ({
      ...x,
      fname: nm2[0] || '',
      lname: nm2.slice(1).join(' '),
      pct
    }));
  } else if (r.type === 'deposit') {
    view.rows = [{
      accNo: r.securityNo,
      accName: mname,
      memberNo: mcode,
      memberName: mname,
      depType: 'เงินฝากออมทรัพย์'
    }];
  } else if (r.type === 'asset') {
    const at = (nm.match(/^(โฉนด|นส3ก|นส3|โฉนดตราจอง|ห้องชุด|สิ่งปลูกสร้าง)/) || [])[1] || 'โฉนด';
    view.rows = [{
      reg: r.securityNo,
      assetNo: r.securityNo,
      assetType: at,
      memberNo: mcode,
      memberName: mname,
      loanType: 'กู้สามัญ',
      mortgagePrice: avail
    }];
  } else if (r.type === 'bond') {
    view.rows = [{
      bondNo: r.securityNo,
      ownerName: mname,
      memberNo: mcode,
      memberName: mname,
      bondType: 'พันธบัตรรัฐบาล'
    }];
  }
  return {
    type: k.l,
    code: k.code,
    ref: r.securityNo,
    detail: r.detail,
    view
  };
};
const CCD_MODULES = ['ทะเบียนและติดตามหนี้ — เปลี่ยนแปลงรายละเอียดสัญญา'];

// Modal ประวัติการแก้ไข — ไทม์ไลน์จาก Audit Trail (layout กลางเดียวกับหน้ารายละเอียดประเภทเงินกู้)
function CcdHistoryModal({
  title,
  onClose
}) {
  const ctx = React.useContext(window.AuditContext || React.createContext({
    entries: []
  }));
  const all = ctx && ctx.entries || window.AUDIT_SEED || [];
  const rows = all.filter(e => CCD_MODULES.includes(e.module)).sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  const acts = window.AUDIT_ACTIONS || {};
  const mapped = rows.map(e => ({
    at: e.ts,
    by: e.user,
    kind: e.action === 'create' ? 'create' : 'edit',
    action: (acts[e.action] || {}).label || e.action,
    summary: e.summary,
    changes: e.changes || []
  })).reverse();
  if (window.PcHistoryModal) return /*#__PURE__*/React.createElement(window.PcHistoryModal, {
    title: "ปรับปรุงรายละเอียดสัญญา",
    sub: title,
    rows: mapped,
    onClose: onClose
  });
  return null;
}

//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
// ช่องค้นหา เลขสมาชิก / เลขที่สัญญา — แบบเดียวกับระบบสินเชื่อ (พิมพ์แล้ว Enter · แว่นขยาย = popup ค้นหาเต็ม)
function CcdContractPicker({
  contractNo,
  member,
  onContract,
  onMember,
  source,
  title,
  placeholder,
  disabled
}) {
  const [open, setOpen] = React.useState(false);
  const Picker = window.SearchPickerField;
  const Modal = window.ContractSearchModal;
  const items = React.useMemo(() => {
    const out = [];
    (source || []).forEach(m => {
      out.push({
        code: m.code,
        m
      });
      (m.debts || []).forEach(d => out.push({
        code: d.contractNo,
        m,
        d
      }));
    });
    return out;
  }, [source]);
  if (!Picker) return null;
  return /*#__PURE__*/React.createElement("div", {
    "data-pc-keep": "1",
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Picker, {
    value: contractNo || (member ? member.code : ''),
    items: items,
    keyOf: it => it.code,
    labelOf: it => it.code,
    className: "cfg-input",
    placeholder: placeholder,
    disabled: disabled,
    notFoundText: "ไม่พบเลขสมาชิกหรือเลขที่สัญญานี้ในระบบ",
    onPick: it => it.d ? onContract(it.m, it.d) : onMember(it.m),
    onOpenModal: () => setOpen(true)
  }), open && Modal && /*#__PURE__*/React.createElement(Modal, {
    onPick: r => {
      setOpen(false);
      r && r.debt ? onContract(r.member, r.debt) : r && r.member && onMember(r.member);
    },
    onClose: () => setOpen(false),
    title: title,
    source: source
  }));
}
function CcdFormScreen({
  onToast,
  audit,
  title,
  subtitle,
  screenLabel
}) {
  const {
    useState
  } = React;
  const today = ccdToday();
  title = title || 'เปลี่ยนแปลงรายละเอียดสัญญา';
  subtitle = subtitle || 'ระบบงานทะเบียนและติดตามหนี้ · ปรับปรุงรายละเอียดสัญญา หลักประกัน และผู้ค้ำประกัน';
  screenLabel = screenLabel || 'เปลี่ยนแปลงรายละเอียดสัญญา';
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [collSearchRow, setCollSearchRow] = useState(null); // index แถวที่กำลังค้นหาผู้ค้ำ
  const [updatedDate, setUpdatedDate] = useState(today);
  const [purpose, setPurpose] = useState('');
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [lastEdit, setLastEdit] = useState(null); // { by, at }
  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');
  const [editing, setEditing] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [okMsg, setOkMsg] = useState(null);
  const [viewRow, setViewRow] = useState(null); // popup ดูข้อมูลหลักประกัน
  const regAssets = React.useMemo(() => (member && window.lcOf ? window.lcOf(member.code) : []).map(a => ({
    ...a,
    _sv: window.lrAssetSurveyInfo(a)
  })), [member && member.code]);
  const snapRef = React.useRef(null); // ค่าก่อนเข้าโหมดแก้ไข (สำหรับปุ่มยกเลิก)

  const contracts = member ? member.debts || [] : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const info = contract ? window.ccdContractInfo(contract) : null;
  const loaded = !!info;

  // ── สรุปยอดค้ำประกัน + เปอร์เซ็นต์ (อ้างอิงยอดอนุมัติ) ──
  const totalGuaranteed = rows.reduce((s, r) => s + (Number(r.guaranteed) || 0), 0);
  const base = info ? info.approvedAmount : 0;
  const rowPct = r => base > 0 ? Math.min(100, (Number(r.guaranteed) || 0) / base * 100) : 0;
  const totalPct = base > 0 ? Math.min(100, totalGuaranteed / base * 100) : 0;
  const rawTotalPct = base > 0 ? totalGuaranteed / base * 100 : 0;
  const loadContract = (m, debt) => {
    setMember(m);
    setContractNo(debt.contractNo);
    setRows(window.ccdCollateral(debt.contractNo).map(r => ({
      ...r,
      type: ccdCollKind(r.type),
      salary: Number(r.salary) || (r.type === 'person' ? ccdSalaryOf(r.securityNo) : 0)
    })));
    setNote('');
    setSavedNo('');
    setLastEdit({
      by: window.CCD_USER,
      at: `${window.fmt.date(today)} 09:30 น.`
    });
    setUpdatedDate(today);
    setError('');
    const i = window.ccdContractInfo(debt);
    setPurpose(i.purpose || '');
    snapRef.current = null;
    setWarn(i.interestArrears > 0 ? `สัญญานี้มีดอกเบี้ยค้างชำระ ${window.fmt.money(i.interestArrears, 2)} บาท — โปรดพิจารณาก่อนบันทึกการเปลี่ยนแปลง` : '');
  };
  const pickMember = m => {
    const first = (m.debts || [])[0];
    if (first) loadContract(m, first);else {
      setMember(m);
      setContractNo('');
      setRows([]);
      setError('สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง');
      setWarn('');
    }
  };
  const pickContract = no => {
    const c = contracts.find(d => d.contractNo === no);
    if (c) loadContract(member, c);
  };

  // ── จัดการตารางหลักประกัน ──
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const addRow = () => {
    if (!loaded) {
      setError('กรุณาเลือกสัญญาก่อนเพิ่มรายการหลักประกัน');
      return;
    }
    setRows(rs => [...rs, {
      type: 'person',
      securityNo: '',
      detail: '',
      salary: 0,
      available: 0,
      guaranteed: 0
    }]);
  };
  const removeRow = i => setRows(rs => rs.filter((_, idx) => idx !== i));
  // เปิด popup ค้นหาสมาชิก (ผู้ค้ำประกัน) สำหรับแถว — รูปแบบกลาง DS
  const openCollSearch = i => {
    if (rows[i].type !== 'person') return;
    setCollSearchRow(i);
  };
  const pickCollMember = m => {
    if (collSearchRow == null) return;
    updateRow(collSearchRow, {
      securityNo: m.code,
      detail: m.name,
      salary: m.salary || ccdSalaryOf(m.code)
    });
    setCollSearchRow(null);
  };
  const clearScreen = () => {
    setMember(null);
    setContractNo('');
    setRows([]);
    setNote('');
    setPurpose('');
    setSavedNo('');
    setLastEdit(null);
    setUpdatedDate(today);
    setError('');
    setWarn('');
    setEditing(false);
    snapRef.current = null;
  };

  // ── เข้า/ออกโหมดแก้ไข ──
  const startEdit = () => {
    if (!loaded) return;
    snapRef.current = {
      rows: rows.map(r => ({
        ...r
      })),
      note,
      purpose,
      updatedDate
    };
    setError('');
    setEditing(true);
  };
  const cancelEdit = () => {
    const s = snapRef.current;
    if (s) {
      setRows(s.rows.map(r => ({
        ...r
      })));
      setNote(s.note);
      setPurpose(s.purpose);
      setUpdatedDate(s.updatedDate);
    }
    snapRef.current = null;
    setError('');
    setEditing(false);
  };
  const validate = () => {
    if (!member) return 'กรุณาระบุเลขทะเบียนสมาชิกก่อนบันทึก';
    if (!contract) return 'กรุณาเลือกสัญญาเงินกู้ที่ต้องการเปลี่ยนแปลง';
    if (!updatedDate) return 'กรุณาระบุวันที่ปรับปรุง';
    if (rows.length === 0) return 'ต้องมีรายการหลักประกัน/ผู้ค้ำประกันอย่างน้อย 1 รายการ';
    // ค้ำประกันต้องไม่เกินค้ำคงเหลือ
    const over = rows.find(r => (Number(r.guaranteed) || 0) > (Number(r.available) || 0));
    if (over) return `ยอดค้ำประกัน "${over.detail || over.securityNo || '(รายการใหม่)'}" เกินยอดค้ำคงเหลือ`;
    // ผู้ค้ำต้องไม่ซ้ำ
    const persons = rows.filter(r => r.type === 'person' && r.securityNo).map(r => r.securityNo);
    const dup = persons.find((p, i) => persons.indexOf(p) !== i);
    if (dup) return `พบผู้ค้ำประกันซ้ำในสัญญาเดียวกัน (${dup}) — กรุณาตรวจสอบ`;
    if (rawTotalPct > 100) return `สัดส่วนค้ำประกันรวม ${rawTotalPct.toFixed(2)}% เกิน 100% ของยอดอนุมัติ — กรุณาปรับยอดค้ำประกัน`;
    return '';
  };
  const doSave = () => {
    const err = validate();
    if (err) {
      setError(err);
      setWarn('');
      return;
    }
    setError('');
    const beYear = new Date().getFullYear() + 543;
    const no = window.ccdNextNo(beYear);
    setSavedNo(no);
    const at = `${window.fmt.date(today)} ${new Date().toTimeString().slice(0, 5)} น.`;
    setLastEdit({
      by: window.CCD_USER,
      at
    });
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ทะเบียนและติดตามหนี้ — เปลี่ยนแปลงรายละเอียดสัญญา',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกเอกสาร ${no} · สัญญา ${contractNo} · ค้ำประกันรวม ${window.fmt.money(totalGuaranteed, 0)} บาท (${totalPct.toFixed(2)}%)`,
      changes: [{
        field: 'จำนวนรายการค้ำประกัน',
        before: '—',
        after: String(rows.length)
      }, {
        field: 'ยอดค้ำประกันรวม',
        before: '—',
        after: window.fmt.money(totalGuaranteed, 2)
      }, ...(purpose !== info.purpose ? [{
        field: 'วัตถุประสงค์การกู้',
        before: info.purpose || '—',
        after: purpose
      }] : []), ...(note ? [{
        field: 'หมายเหตุ',
        before: '—',
        after: note
      }] : [])]
    });
    onToast && onToast(`บันทึกการเปลี่ยนแปลงสัญญา ${contractNo} (${no}) เรียบร้อยแล้ว`);
    setOkMsg({
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: `บันทึกการเปลี่ยนรายละเอียดสัญญา ${contractNo} · เลขที่เอกสาร ${no} · ค้ำประกันรวม ${window.fmt.money(totalGuaranteed, 2)} บาท (${totalPct.toFixed(2)}%) เรียบร้อยแล้ว`
    });
    snapRef.current = null;
    setEditing(false);
  };
  const doPrint = () => {
    if (!loaded) {
      setError('กรุณาเลือกสัญญาก่อนพิมพ์');
      return;
    }
    onToast && onToast('กำลังเตรียมพิมพ์เอกสารสรุปการเปลี่ยนแปลงรายละเอียดสัญญา…');
    setTimeout(() => window.print(), 80);
  };

  // ── badge “บันทึกล่าสุด” — เวลาจาก Audit Trail ของเมนูนี้ ──
  const savedBadge = (() => {
    if (!loaded) return null;
    const entries = audit && audit.entries || window.AUDIT_SEED || [];
    const ts = window.savedBadgeTs ? window.savedBadgeTs(entries, CCD_MODULES, 'ccd.' + contractNo) : null;
    return window.savedBadgeLabel && window.savedBadgeLabel(ts) || null;
  })();
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": screenLabel
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-title"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, editing ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    "data-pc-own": "1",
    onClick: () => window.pcAskDiscard ? window.pcAskDiscard(cancelEdit) : cancelEdit()
  }, "ละทิ้ง"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: doSave
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " บันทึกข้อมูล")) : /*#__PURE__*/React.createElement(React.Fragment, null, savedBadge && /*#__PURE__*/React.createElement("span", {
    className: "saved-badge"
  }, savedBadge), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => setHistOpen(true),
    disabled: !loaded
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "history",
    size: 13
  }), " ประวัติ"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: doPrint,
    disabled: !loaded
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "print",
    size: 13
  }), " พิมพ์เอกสาร"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: startEdit,
    disabled: !loaded
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  }), " แก้ไขข้อมูล")))), error && /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement("span", null, warn)), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "ข้อมูลสมาชิก"), loaded && /*#__PURE__*/React.createElement("span", {
    className: "chip warning",
    style: {
      marginLeft: 'auto'
    }
  }, "REQ")), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gridAutoFlow: 'row dense'
    }
  }, /*#__PURE__*/React.createElement(CcdFld, {
    label: "เลขสมาชิก / เลขที่สัญญา",
    fill: true,
    span: 2,
    required: true
  }, /*#__PURE__*/React.createElement(CcdContractPicker, {
    contractNo: contractNo,
    member: member,
    onContract: loadContract,
    onMember: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสัญญาเงินกู้ \u2014 ปรับปรุงรายละเอียดสัญญา",
    placeholder: "เลขสมาชิก หรือเลขที่สัญญา\u2026"
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "ชื่อ-นามสกุล",
    fill: true,
    span: 2
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "สังกัด",
    fill: true,
    span: 2
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: member ? `${member.deptCode || ''}  ${member.dept || ''}`.trim() : ''
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "ลาออก",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: member && member.status === 'ลาออก' ? '01/2565' : member ? '-' : '',
    mono: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "เกษียณ",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: member ? '-' : '',
    mono: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "สถานะสมาชิก",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: member ? 'สมาชิกใช้งาน' : ''
  })))), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "รายละเอียดสัญญา")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gridAutoFlow: 'row dense',
      gap: '14px 18px'
    }
  }, /*#__PURE__*/React.createElement(CcdFld, {
    label: "เลขที่สัญญา",
    fill: true,
    span: 3,
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input mono",
    value: contractNo,
    onChange: e => pickContract(e.target.value),
    disabled: !member || contracts.length === 0
  }, !member && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 เลือกสมาชิกก่อน \u2014"), member && contracts.length === 0 && /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 ไม่มีสัญญา \u2014"), contracts.map(d => /*#__PURE__*/React.createElement("option", {
    key: d.contractNo,
    value: d.contractNo
  }, d.contractNo)))), /*#__PURE__*/React.createElement(CcdFld, {
    label: "โครงการเงินกู้",
    fill: true,
    span: 2
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info ? info.project || info.loanType + (info.startDate ? ' ปี ' + (new Date(info.startDate).getFullYear() + 543) : '') : ''
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "วันที่ปรับปรุง",
    fill: true,
    span: 2,
    required: true
  }, /*#__PURE__*/React.createElement(ErpDate, {
    value: updatedDate,
    onChange: setUpdatedDate,
    disabled: !loaded
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "ยอดอนุมัติ",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info ? window.fmt.money(info.approvedAmount, 2) : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "ยอดรอเบิก",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info ? window.fmt.money(info.pendingDisburse, 2) : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "ยอดคงเหลือ",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info ? window.fmt.money(info.outstanding, 2) : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "งวดชำระล่าสุด",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info ? info.lastPaidTerm : '',
    mono: true,
    num: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "วันที่เริ่มสัญญา",
    fill: true
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info && info.startDate ? (() => {
      const dt = new Date(info.startDate);
      const p = n => String(n).padStart(2, '0');
      return isNaN(dt) ? String(info.startDate) : `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear() + 543}`;
    })() : '',
    mono: true
  })), /*#__PURE__*/React.createElement(CcdFld, {
    label: "ดอกเบี้ยค้าง",
    fill: true,
    span: 2
  }, /*#__PURE__*/React.createElement(CcdRO, {
    value: info ? window.fmt.money(info.interestArrears, 2) : '',
    mono: true,
    num: true,
    danger: info && info.interestArrears > 0
  })))), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "รายละเอียดการค้ำประกัน"), /*#__PURE__*/React.createElement("div", {
    className: "head-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm primary",
    onClick: addRow,
    disabled: !editing
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), " เพิ่มแถว"))), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl ccd-coll-tbl",
    style: {
      width: '100%',
      tableLayout: 'auto'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150
    }
  }, "ประเภทหลักประกัน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 258
    }
  }, "เลขที่อ้างอิง"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 200
    }
  }, "รายละเอียด"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      width: 120
    }
  }, "เงินเดือน"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      width: 120
    }
  }, "ค้ำคงเหลือ"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      width: 140
    }
  }, "ค้ำประกัน"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      width: 120
    }
  }, "คำนวณ %"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 56
    }
  }, "จัดการ"))), /*#__PURE__*/React.createElement("tbody", null, !loaded ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "empty-state"
  }, "เลือกสัญญาเพื่อแสดงรายละเอียดหลักประกัน / ผู้ค้ำประกัน")) : rows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "empty-state"
  }, "ยังไม่มีรายการ \u2014 กด \u201Cเพิ่มแถว\u201D เพื่อบันทึกหลักประกัน / ผู้ค้ำประกัน")) : rows.map((r, i) => {
    const over = (Number(r.guaranteed) || 0) > (Number(r.available) || 0);
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
      className: "cfg-input",
      value: r.type,
      disabled: !editing,
      onChange: e => updateRow(i, {
        type: e.target.value
      })
    }, (window.LR_COLL_KINDS || window.CCD_COLLATERAL_TYPES).map(t => /*#__PURE__*/React.createElement("option", {
      key: t.v,
      value: t.v
    }, t.l)))), /*#__PURE__*/React.createElement("td", {
      className: "mono lrq-ref-cell"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "lrq-refbox",
      style: {
        flex: 1,
        minWidth: 0
      }
    }, r.type === 'person' ? /*#__PURE__*/React.createElement("div", {
      className: "lrq-coll-member",
      style: editing ? null : {
        pointerEvents: 'none',
        opacity: .85
      }
    }, /*#__PURE__*/React.createElement(ErpMemberPicker, {
      member: r.securityNo ? {
        code: r.securityNo,
        name: r.detail
      } : null,
      onPick: m => updateRow(i, {
        securityNo: m.code,
        detail: m.name,
        salary: m.salary || ccdSalaryOf(m.code)
      }),
      source: window.DN_MEMBERS,
      title: "ค้นหาผู้ค้ำประกัน",
      placeholder: "เลขสมาชิกผู้ค้ำ\u2026"
    })) : r.type === 'asset' ? /*#__PURE__*/React.createElement("select", {
      className: "cfg-input lrq-rowsel",
      value: r.assetId || (r.securityNo ? '__cur' : ''),
      disabled: !editing,
      onChange: e => {
        const as = regAssets.find(x => x.id === e.target.value);
        if (!as) {
          if (e.target.value === '') updateRow(i, {
            assetId: '',
            securityNo: '',
            detail: ''
          });
          return;
        }
        if (!as._sv.ok) {
          onToast && onToast('ใช้ค้ำไม่ได้ — ' + as._sv.reason + ' (ดำเนินการที่เมนูสำรวจหลักทรัพย์)');
          return;
        }
        const loc = as.locProvince || as.landOfficeProvince || '';
        updateRow(i, {
          assetId: as.id,
          securityNo: as.code || as.titleNo || as.id,
          detail: [as.type, as.titleNo ? 'เลขที่โฉนด ' + as.titleNo : '', loc].filter(Boolean).join(' · '),
          available: as._sv.remainRight
        });
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, regAssets.some(x => x._sv.ok) ? '--- เลือกหลักทรัพย์ที่สรุปผลสำรวจแล้ว ---' : '— ไม่มีหลักทรัพย์ที่สรุปผลสำรวจแล้ว —'), !r.assetId && r.securityNo && /*#__PURE__*/React.createElement("option", {
      value: "__cur"
    }, r.securityNo), regAssets.map(x => /*#__PURE__*/React.createElement("option", {
      key: x.id,
      value: x.id,
      disabled: !x._sv.ok
    }, [x.type, x.code || x.titleNo].filter(Boolean).join(' · ') + (x._sv.ok ? ' · ค้ำสูงสุด ฿' + window.fmt.money(x._sv.maxRight, 2) : ' (' + x._sv.reason + ')')))) : /*#__PURE__*/React.createElement("input", {
      className: "cfg-input sm mono",
      style: {
        width: '100%',
        maxWidth: 'none'
      },
      value: r.securityNo,
      disabled: !editing,
      placeholder: "เลขที่อ้างอิง",
      onChange: e => updateRow(i, {
        securityNo: e.target.value
      })
    })), r.securityNo && /*#__PURE__*/React.createElement("button", {
      className: "lrq-eyebtn lrq-eyebtn-g act-view",
      title: "ดูข้อมูล",
      onClick: () => setViewRow(r),
      style: {
        background: '#fff',
        border: '1px solid var(--primary)',
        color: 'var(--primary)',
        width: 28,
        height: 28,
        minWidth: 28,
        padding: 0,
        borderRadius: 4,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "eye",
      size: 14
    })))), /*#__PURE__*/React.createElement("td", null, r.detail || /*#__PURE__*/React.createElement("span", {
      className: "lrq-dash"
    }, "-")), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, /*#__PURE__*/React.createElement(CcdMoneyInput, {
      value: r.salary,
      disabled: !editing,
      onChange: v => updateRow(i, {
        salary: v
      })
    })), /*#__PURE__*/React.createElement("td", {
      className: "num mono",
      style: {
        whiteSpace: 'nowrap'
      }
    }, window.fmt.money(r.available, 2)), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, /*#__PURE__*/React.createElement("div", {
      className: "icr-suffix"
    }, /*#__PURE__*/React.createElement(CcdMoneyInput, {
      value: r.guaranteed,
      over: over,
      disabled: !editing,
      onChange: v => updateRow(i, {
        guaranteed: v
      })
    }))), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, /*#__PURE__*/React.createElement(CcdMoneyInput, {
      value: rowPct(r).toFixed(2),
      disabled: !editing,
      onChange: v => updateRow(i, {
        guaranteed: base > 0 ? String(Math.round(base * (Number(v) || 0)) / 100) : r.guaranteed
      })
    })), /*#__PURE__*/React.createElement("td", {
      className: "center"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn text sm danger ccd-del act-del",
      title: "ลบรายการ",
      disabled: !editing,
      onClick: () => removeRow(i)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 14
    }))));
  })), loaded && rows.length > 0 && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    className: "ccd-total-row"
  }, /*#__PURE__*/React.createElement("td", {
    colSpan: "5",
    className: "ccd-total-label"
  }, "รวม"), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(totalGuaranteed, 2)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, totalPct.toFixed(2), "%"), /*#__PURE__*/React.createElement("td", null)))))), loaded && totalPct > 0 && totalPct < 100 && /*#__PURE__*/React.createElement("div", {
    className: "icr-restruct-note",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, "สัดส่วนค้ำประกันรวม ", totalPct.toFixed(2), "% ยังไม่ครบ 100% ของยอดอนุมัติ \u2014 โปรดตรวจสอบความเพียงพอของหลักประกันก่อนบันทึก"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "หมายเหตุการเปลี่ยนแปลง")), /*#__PURE__*/React.createElement("div", {
    className: "icr-note-wrap"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 4,
    value: note,
    onChange: e => setNote(e.target.value),
    disabled: !loaded || !editing,
    maxLength: 500,
    placeholder: "ระบุเหตุผล/รายละเอียดการเปลี่ยนแปลง เช่น ปรับลดวงเงินค้ำประกันเนื่องจากมีการชำระเงินบางส่วนแล้ว"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-note-count"
  }, note.length, "/500")))), okMsg && window.StatusModal && /*#__PURE__*/React.createElement(window.StatusModal, {
    variant: "success",
    title: okMsg.title,
    detail: okMsg.detail,
    onClose: () => setOkMsg(null)
  }), viewRow && window.CollateralDetailModal && /*#__PURE__*/React.createElement(window.CollateralDetailModal, {
    coll: ccdCollView(viewRow, member, base),
    onClose: () => setViewRow(null)
  }), histOpen && /*#__PURE__*/React.createElement(CcdHistoryModal, {
    title: contractNo ? `สัญญา ${contractNo}${member ? ' · ' + member.name : ''}` : title,
    onClose: () => setHistOpen(false)
  }), collSearchRow != null && /*#__PURE__*/React.createElement(MemberSearchModal, {
    onPick: pickCollMember,
    onClose: () => setCollSearchRow(null),
    title: "ค้นหาผู้ค้ำประกัน",
    source: window.DN_MEMBERS,
    searchFn: window.ccdSearchMembers
  }));
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ContractChangePage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  return /*#__PURE__*/React.createElement(CcdFormScreen, {
    onToast: onToast,
    audit: audit
  });
}

// ระบบสินเชื่อ — ปรับปรุงรายละเอียดสัญญา (แก้ไขข้อมูลผู้ค้ำประกัน) — ใช้หน้าจอเดียวกัน
function ContractAdjustPage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  return /*#__PURE__*/React.createElement(CcdFormScreen, {
    onToast: onToast,
    audit: audit,
    title: "ปรับปรุงรายละเอียดสัญญา",
    subtitle: "ระบบสินเชื่อ \xB7 ปรับปรุงรายละเอียดสัญญา และแก้ไขข้อมูลผู้ค้ำประกัน",
    screenLabel: "ปรับปรุงรายละเอียดสัญญา"
  });
}

// ระบบประมวลผลและจัดเก็บ › สินเชื่อ — ปรับปรุงรายละเอียดสัญญา (process/collateral-change) — เหมือนเมนูของระบบสินเชื่อทุกอย่าง
const PcxCollateralChangePage = ContractAdjustPage;
Object.assign(window, {
  ContractChangePage,
  ContractAdjustPage,
  CcdFormScreen,
  CcdHistoryModal,
  PcxCollateralChangePage
});