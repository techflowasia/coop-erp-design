// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ข้อกำหนดประเภทหุ้น — ShareTermsConfigPage
//  master list (ประเภทหุ้น) → detail editor (2 tabs: รายละเอียด / การส่งหุ้นขั้นต่ำรายเดือน)
//  ระบบงานประมวลผลและจัดเก็บ › ค่าคงที่
// ════════════════════════════════════════════════════════════════════

// uid + วันที่
let _shUidSeq = 0;
const shUid = () => 'SH-N' + ++_shUidSeq;
const shToday = () => new Date().toISOString().slice(0, 10);

// ─── โหลด/บันทึก รายการลง localStorage ──────────────────────────────
function shLoad() {
  try {
    const saved = localStorage.getItem('share_terms');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.SH_SEED.map(r => ({
    ...r,
    settings: {
      ...r.settings
    },
    tiers: r.tiers.map(t => ({
      ...t
    }))
  }));
}
function shSave(list) {
  try {
    localStorage.setItem('share_terms', JSON.stringify(list));
  } catch (e) {}
}

// สถานะสมาชิกที่ใช้ประเภทหุ้นนี้
const SH_MEMBER_STATUS = ['สมาชิกปฏิบัติงาน', 'สมาชิกเกษียณ', 'สมาชิกสมทบปฏิบัติงาน', 'สมาชิกสมทบเครือญาติ', 'สมาชิกสมทบเกษียณ'];
window.SH_MEMBER_STATUS = SH_MEMBER_STATUS;
const SH_MODULE = 'ประมวลผลและจัดเก็บ — ค่าคงที่ข้อกำหนดประเภทหุ้น';

// ─── ยืนยันละทิ้งการแก้ไข ─────────────────────────────────────────
function ShDiscardModal({
  onKeep,
  onDiscard
}) {
  React.useEffect(() => {
    const esc = e => {
      if (e.key === 'Escape') onKeep();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "sh-dc-overlay",
    onClick: onKeep
  }, /*#__PURE__*/React.createElement("div", {
    className: "sh-dc-card",
    role: "alertdialog",
    "aria-modal": "true",
    "aria-labelledby": "sh-dc-title",
    "aria-describedby": "sh-dc-text",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "sh-dc-x",
    "aria-label": "ปิด",
    onClick: onKeep
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "sh-dc-ico",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v.5M12 11v5"
  }))), /*#__PURE__*/React.createElement("h2", {
    id: "sh-dc-title",
    className: "sh-dc-title"
  }, "ทิ้งการแก้ไข?"), /*#__PURE__*/React.createElement("p", {
    id: "sh-dc-text",
    className: "sh-dc-text"
  }, "หากออกจากหน้านี้ การเปลี่ยนแปลงล่าสุดจะไม่ถูกบันทึก"), /*#__PURE__*/React.createElement("div", {
    className: "sh-dc-btns"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    autoFocus: true,
    onClick: onKeep
  }, "แก้ไขต่อ"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary",
    onClick: onDiscard
  }, "ละทิ้ง"))));
}

// ─── ประวัติการแก้ไข (จาก Audit Trail ของโมดูลนี้) ────────────────
function ShHistoryModal({
  record,
  onClose
}) {
  const ctx = React.useContext(window.AuditContext || React.createContext({
    entries: []
  }));
  const all = ctx && ctx.entries || window.AUDIT_SEED || [];
  const rows = all.filter(e => e.module === SH_MODULE && String(e.target || '').indexOf(record.id) === 0).sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
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
    title: "ประเภทหุ้น",
    sub: record.id + ' \u00B7 ' + record.name,
    rows: mapped,
    onClose: onClose
  });
  return null;
}

// ════════════════════════════════════════════════════════════════════
//  Dense two-column form primitives (label ซ้าย / ค่าขวา) — view/edit
// ════════════════════════════════════════════════════════════════════
function S2Group({
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "l2-group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "l2-gh"
  }, /*#__PURE__*/React.createElement("span", {
    className: "l2-gh-t"
  }, title)), children);
}
function S2Row({
  label,
  indent,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "l2-row" + (indent ? ' indent' : '')
  }, /*#__PURE__*/React.createElement("div", {
    className: "l2-label"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "l2-ctrl"
  }, children));
}
function S2Num({
  v,
  editing,
  onChange,
  decimals,
  suffix,
  disabled
}) {
  if (!editing || disabled) {
    return /*#__PURE__*/React.createElement("div", {
      className: "l2-val num" + (disabled ? ' dis-val' : '')
    }, v === '' || v == null ? '—' : decimals != null ? fmt.money(Number(v || 0), decimals) : fmt.money(Number(v || 0), 0), suffix ? /*#__PURE__*/React.createElement("span", {
      className: "l2-suf"
    }, " ", suffix) : null);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "l2-inwrap"
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input num",
    type: "number",
    inputMode: "decimal",
    step: decimals ? '0.01' : '1',
    value: v,
    onChange: e => onChange(e.target.value)
  }), suffix && /*#__PURE__*/React.createElement("span", {
    className: "l2-suf"
  }, suffix));
}
function S2Sel({
  group,
  v,
  editing,
  onChange
}) {
  if (!editing) return /*#__PURE__*/React.createElement("div", {
    className: "l2-val"
  }, window.shLabel(group, v));
  return /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: v,
    onChange: e => onChange(e.target.value)
  }, window.SH_OPTS[group].map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l)));
}

// ════════════════════════════════════════════════════════════════════
//  Tab 1 — รายละเอียด (สองคอลัมน์ เห็นครบไม่ต้องเลื่อน)
// ════════════════════════════════════════════════════════════════════
function ShDetailTab({
  record,
  editing,
  onChange
}) {
  const s = record.settings;
  const set = (k, v) => onChange({
    ...s,
    [k]: v
  });
  const isSeparate = s.changeCountType === 'separate';
  const isCombined = s.changeCountType === 'combined';
  return /*#__PURE__*/React.createElement("div", {
    className: "search-card l2-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "l2-cols"
  }, /*#__PURE__*/React.createElement("div", {
    className: "l2-col"
  }, /*#__PURE__*/React.createElement(S2Group, {
    title: "รายละเอียดหุ้น"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "กลุ่มของหุ้น"
  }, /*#__PURE__*/React.createElement(S2Sel, {
    group: "shareGroup",
    v: s.shareGroup,
    editing: editing,
    onChange: v => set('shareGroup', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "มูลค่า/หุ้น"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.parValue,
    editing: editing,
    decimals: 2,
    suffix: "บาท",
    onChange: v => set('parValue', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "การใช้หุ้นคำนวณสิทธิเงินกู้"
  }, /*#__PURE__*/React.createElement(S2Sel, {
    group: "useForLoanRight",
    v: s.useForLoanRight,
    editing: editing,
    onChange: v => set('useForLoanRight', v)
  }))), /*#__PURE__*/React.createElement(S2Group, {
    title: "การถือครองหุ้น"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "จำนวนหุ้นขั้นต่ำที่ต้องถือ"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.minHold,
    editing: editing,
    decimals: 2,
    suffix: "หุ้น",
    onChange: v => set('minHold', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "จำนวนหุ้นสูงสุดที่ถือได้"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.maxHold,
    editing: editing,
    decimals: 2,
    suffix: "หุ้น",
    onChange: v => set('maxHold', v)
  }))), /*#__PURE__*/React.createElement(S2Group, {
    title: "การชำระพิเศษ"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "ซื้อหุ้นภายในวันที่นับเป็นเดือนปัจจุบัน"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.specialBuyCutoffDay,
    editing: editing,
    suffix: "วัน",
    onChange: v => set('specialBuyCutoffDay', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "นับงวดสำหรับการซื้อหุ้นพิเศษ"
  }, /*#__PURE__*/React.createElement(S2Sel, {
    group: "specialCountPeriod",
    v: s.specialCountPeriod,
    editing: editing,
    onChange: v => set('specialCountPeriod', v)
  }))), /*#__PURE__*/React.createElement(S2Group, {
    title: "การคิดเงินปันผล"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "จำนวนผิดนัดชำระที่ไม่ได้ปันผล"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.defaultNoDividend,
    editing: editing,
    suffix: "ครั้ง",
    onChange: v => set('defaultNoDividend', v)
  })))), /*#__PURE__*/React.createElement("div", {
    className: "l2-col"
  }, /*#__PURE__*/React.createElement(S2Group, {
    title: "ลดส่งค่าหุ้น"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "งวดต่ำสุดที่ลดส่งได้"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.reduceMinPeriod,
    editing: editing,
    suffix: "งวด",
    onChange: v => set('reduceMinPeriod', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "จำนวนหุ้นขั้นต่ำที่ลดส่งได้"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.reduceMinShares,
    editing: editing,
    decimals: 2,
    suffix: "หุ้น",
    onChange: v => set('reduceMinShares', v)
  }))), /*#__PURE__*/React.createElement(S2Group, {
    title: "งดส่งค่าหุ้น"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "ต้องส่งหุ้นมาแล้วงวด"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.suspendRequirePeriod,
    editing: editing,
    suffix: "งวด",
    onChange: v => set('suspendRequirePeriod', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "จำนวนหุ้นขั้นต่ำที่งดส่งได้"
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.suspendMinShares,
    editing: editing,
    decimals: 2,
    suffix: "หุ้น",
    onChange: v => set('suspendMinShares', v)
  }))), /*#__PURE__*/React.createElement(S2Group, {
    title: "การนับการเปลี่ยนแปลงการส่งหุ้น"
  }, /*#__PURE__*/React.createElement(S2Row, {
    label: "ประเภทการนับการเปลี่ยนแปลง"
  }, /*#__PURE__*/React.createElement(S2Sel, {
    group: "changeCountType",
    v: s.changeCountType,
    editing: editing,
    onChange: v => set('changeCountType', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "l2-subhead"
  }, "แบบนับรวม"), /*#__PURE__*/React.createElement(S2Row, {
    label: "รวมแล้วไม่เกิน",
    indent: true
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.combinedMax,
    editing: editing,
    disabled: !isCombined,
    suffix: "ครั้ง",
    onChange: v => set('combinedMax', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "l2-subhead"
  }, "แบบนับแยก"), /*#__PURE__*/React.createElement(S2Row, {
    label: "ขอเพิ่มหุ้นไม่เกิน",
    indent: true
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.sepAdd,
    editing: editing,
    disabled: !isSeparate,
    suffix: "ครั้ง",
    onChange: v => set('sepAdd', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "ขอลดหุ้นไม่เกิน",
    indent: true
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.sepReduce,
    editing: editing,
    disabled: !isSeparate,
    suffix: "ครั้ง",
    onChange: v => set('sepReduce', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "ขอหยุดส่งหุ้นไม่เกิน",
    indent: true
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.sepStop,
    editing: editing,
    disabled: !isSeparate,
    suffix: "ครั้ง",
    onChange: v => set('sepStop', v)
  })), /*#__PURE__*/React.createElement(S2Row, {
    label: "ขอส่งหุ้นต่อไม่เกิน",
    indent: true
  }, /*#__PURE__*/React.createElement(S2Num, {
    v: s.sepResume,
    editing: editing,
    disabled: !isSeparate,
    suffix: "ครั้ง",
    onChange: v => set('sepResume', v)
  }))))));
}

// ════════════════════════════════════════════════════════════════════
//  Tab 2 — การส่งหุ้นขั้นต่ำรายเดือน (data grid, ผูกช่วงเงินเดือน)
// ════════════════════════════════════════════════════════════════════
function ShTiersTab({
  record,
  editing,
  onChange
}) {
  const par = Number(record.settings.parValue || 0);
  const tiers = record.tiers;
  const setTier = (i, k, v) => onChange(tiers.map((t, idx) => idx === i ? {
    ...t,
    [k]: v
  } : t));
  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const from = last ? Number(last.salaryTo || 0) : 0;
    onChange([...tiers, {
      salaryFrom: from,
      salaryTo: from + 20000,
      sharesMin: 0,
      sharesMax: 0,
      user: window.LOGIN_USER.name,
      date: shToday()
    }]);
  };
  const removeTier = i => onChange(tiers.filter((_, idx) => idx !== i));
  const numCell = (i, k, v) => editing ? /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    type: "number",
    inputMode: "numeric",
    value: v,
    onChange: e => setTier(i, k, e.target.value)
  }) : /*#__PURE__*/React.createElement("span", {
    className: "sh-grid-num"
  }, fmt.money(Number(v || 0), 2));
  return /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      padding: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sh-grid-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sh-grid-title"
  }, "ตารางการส่งหุ้นขั้นต่ำรายเดือน"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 2
    }
  }, "กำหนดขั้นบันไดจำนวนหุ้นที่ต้องส่งรายเดือน ผูกกับช่วงเงินเดือนของสมาชิก \u2014 มูลค่าหุ้น/เดือนคำนวณจาก จำนวนหุ้น \xD7 ", fmt.money(par, 2), " บาท")), editing && /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: addTier
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus"
  }), " เพิ่มช่วงเงินเดือน")), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      border: 0,
      borderRadius: 0,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl sh-grid",
    style: {
      minWidth: 900
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "center",
    style: {
      width: 56
    }
  }, "ลำดับ"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "center group-col"
  }, "เงินเดือน"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "center group-col"
  }, "จำนวนหุ้น/เดือน"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "center group-col"
  }, "มูลค่าหุ้น/เดือน"), editing && /*#__PURE__*/React.createElement("th", {
    rowSpan: 2,
    className: "center",
    style: {
      width: 60
    }
  })), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "center sub-col"
  }, "ตั้งแต่ (>=)"), /*#__PURE__*/React.createElement("th", {
    className: "center sub-col"
  }, "ถึง (<)"), /*#__PURE__*/React.createElement("th", {
    className: "center sub-col"
  }, "ต่ำสุด"), /*#__PURE__*/React.createElement("th", {
    className: "center sub-col"
  }, "สูงสุด"), /*#__PURE__*/React.createElement("th", {
    className: "center sub-col"
  }, "ขั้นต่ำ"), /*#__PURE__*/React.createElement("th", {
    className: "center sub-col"
  }, "สูงสุด"))), /*#__PURE__*/React.createElement("tbody", null, tiers.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: editing ? 8 : 7,
    className: "center muted",
    style: {
      padding: '28px 12px'
    }
  }, "ยังไม่มีช่วงเงินเดือน \u2014 กดปุ่ม \u201Cเพิ่มช่วงเงินเดือน\u201D เพื่อสร้างขั้นบันได")), tiers.map((t, i) => {
    const valMin = Number(t.sharesMin || 0) * par;
    const valMax = Number(t.sharesMax || 0) * par;
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, /*#__PURE__*/React.createElement("td", {
      className: "center mono"
    }, i + 1), /*#__PURE__*/React.createElement("td", {
      className: "num-cell"
    }, numCell(i, 'salaryFrom', t.salaryFrom)), /*#__PURE__*/React.createElement("td", {
      className: "num-cell"
    }, numCell(i, 'salaryTo', t.salaryTo)), /*#__PURE__*/React.createElement("td", {
      className: "num-cell"
    }, numCell(i, 'sharesMin', t.sharesMin)), /*#__PURE__*/React.createElement("td", {
      className: "num-cell"
    }, numCell(i, 'sharesMax', t.sharesMax)), /*#__PURE__*/React.createElement("td", {
      className: "num-cell computed"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sh-grid-num"
    }, fmt.money(valMin, 2))), /*#__PURE__*/React.createElement("td", {
      className: "num-cell computed"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sh-grid-num"
    }, fmt.money(valMax, 2))), editing && /*#__PURE__*/React.createElement("td", {
      className: "center"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "act-del",
      "aria-label": "ลบ",
      onClick: () => removeTier(i),
      title: "ลบช่วงเงินเดือน"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    }))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "sh-grid-foot muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 12
  }), " ช่อง \u201Cมูลค่าหุ้น/เดือน\u201D เป็นค่าที่ระบบคำนวณอัตโนมัติ \u2014 แก้ไขได้เฉพาะจำนวนหุ้นและช่วงเงินเดือน"));
}

// ════════════════════════════════════════════════════════════════════
//  Detail page — header + tabs + editor (view/edit toggle)
// ════════════════════════════════════════════════════════════════════
function ShDetail({
  record,
  onBack,
  onSave,
  startEditing
}) {
  const [editing, setEditing] = useState(!!startEditing);
  // breadcrumb ระดับ 3: รายละเอียด / แก้ไขข้อมูล
  window.useBreadcrumb && window.crumb3 && window.useBreadcrumb(window.crumb3('ข้อกำหนดประเภทหุ้น', editing ? 'edit' : 'view', onBack), [editing]);
  const [tab, setTab] = useState('detail'); // 'detail' | 'tiers'
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => {
    if (!editing) setDraft(record);
  }, [record, editing]);
  const startEdit = () => {
    setDraft(record);
    setEditing(true);
  };
  const cancel = () => {
    setDraft(record);
    setEditing(false);
  };
  const save = () => {
    onSave(draft);
    setSavedAt(new Date());
    setEditing(false);
  };
  const cur = editing ? draft : record;
  const [hist, setHist] = useState(false);
  const auditCtx = React.useContext(window.AuditContext || React.createContext({
    entries: []
  }));
  const p2 = n => String(n).padStart(2, '0');
  const savedTs = savedAt ? savedAt.getFullYear() + '-' + p2(savedAt.getMonth() + 1) + '-' + p2(savedAt.getDate()) + ' ' + p2(savedAt.getHours()) + ':' + p2(savedAt.getMinutes()) : window.savedBadgeTs ? window.savedBadgeTs((auditCtx && auditCtx.entries || window.AUDIT_SEED || []).filter(x => String(x.target || '').indexOf(record.id) === 0), [SH_MODULE], 'share-terms:' + record.id) : '';
  const savedTxt = savedTs ? window.savedBadgeLabel ? window.savedBadgeLabel(savedTs) : 'บันทึกล่าสุด: ' + savedTs : null;
  const [askDiscard, setAskDiscard] = useState(false);
  const fldLbl = (t, req) => /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label"
  }, t, req && /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, " *"));
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "หน้ารายละเอียดข้อกำหนดประเภทหุ้น"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevLeft"
  }), " กลับสู่รายการ"), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "sh-top-actions"
  }, savedTxt && !editing && /*#__PURE__*/React.createElement("span", {
    className: "saved-badge"
  }, savedTxt), !editing && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn sm",
    onClick: () => setHist(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "history",
    size: 13
  }), " ประวัติ"), !editing ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary sm",
    onClick: startEdit
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  }), " แก้ไขข้อกำหนด") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn sm",
    onClick: () => setAskDiscard(true)
  }, "ละทิ้ง"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary sm",
    onClick: save
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " บันทึกข้อกำหนด")))), /*#__PURE__*/React.createElement("div", {
    className: "search-card lt-head-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lt-head-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lt-head-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shares",
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, editing ? /*#__PURE__*/React.createElement("div", {
    className: "sh-head-grid"
  }, /*#__PURE__*/React.createElement("div", null, fldLbl('รหัสประเภทหุ้น', true), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono sh-ro",
    value: draft.id,
    readOnly: true,
    disabled: true
  })), /*#__PURE__*/React.createElement("div", null, fldLbl('ชื่อประเภทหุ้น', true), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    style: {
      width: '100%'
    },
    value: draft.name,
    placeholder: "ชื่อประเภทหุ้น",
    onChange: e => setDraft(d => ({
      ...d,
      name: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, fldLbl('สถานะสมาชิก'), /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: draft.memberStatus || '',
    onChange: e => setDraft(d => ({
      ...d,
      memberStatus: e.target.value
    }))
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "— เลือกสถานะสมาชิก —"), SH_MEMBER_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '1 / -1'
    }
  }, fldLbl('หมายเหตุ'), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    style: {
      width: '100%'
    },
    value: draft.note || '',
    placeholder: "หมายเหตุประกอบรายการ",
    onChange: e => setDraft(d => ({
      ...d,
      note: e.target.value
    }))
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    className: "lt-head-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: 'var(--text-muted)',
      fontWeight: 600
    }
  }, record.id), " \xB7 ", record.name), /*#__PURE__*/React.createElement("div", {
    className: "lt-head-meta"
  }, /*#__PURE__*/React.createElement("span", null, "กลุ่ม: ", window.shLabel('shareGroup', cur.settings.shareGroup)), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), /*#__PURE__*/React.createElement("span", null, "สถานะสมาชิก: ", record.memberStatus || '—'), /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), /*#__PURE__*/React.createElement("span", null, "หมายเหตุ: ", record.note || '—')))), !editing && (record.enabled ? /*#__PURE__*/React.createElement("span", {
    className: "chip success",
    style: {
      height: 24
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot-c"
  }), " เปิดใช้งาน") : /*#__PURE__*/React.createElement("span", {
    className: "chip",
    style: {
      height: 24
    }
  }, "ปิดใช้งาน")))), askDiscard && /*#__PURE__*/React.createElement(ShDiscardModal, {
    onKeep: () => setAskDiscard(false),
    onDiscard: () => {
      setAskDiscard(false);
      cancel();
    }
  }), hist && /*#__PURE__*/React.createElement(ShHistoryModal, {
    record: record,
    onClose: () => setHist(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "tabs-container",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs-bar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === 'detail' ? ' active' : ''),
    onClick: () => setTab('detail')
  }, "รายละเอียด"), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === 'tiers' ? ' active' : ''),
    onClick: () => setTab('tiers')
  }, "การส่งหุ้นขั้นต่ำรายเดือน"))), tab === 'detail' ? /*#__PURE__*/React.createElement(ShDetailTab, {
    record: cur,
    editing: editing,
    onChange: settings => setDraft(d => ({
      ...d,
      settings
    }))
  }) : /*#__PURE__*/React.createElement(ShTiersTab, {
    record: cur,
    editing: editing,
    onChange: tiers => setDraft(d => ({
      ...d,
      tiers
    }))
  }));
}

// ════════════════════════════════════════════════════════════════════
//  Add modal — ชื่อ + กลุ่มหุ้น + เริ่มจาก
// ════════════════════════════════════════════════════════════════════
function ShAddModal({
  list,
  onClose,
  onCreate
}) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('common');
  const [memberStatus, setMemberStatus] = useState(SH_MEMBER_STATUS[0]);
  const [copyFrom, setCopyFrom] = useState('__default');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const submit = e => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อประเภทหุ้น');
      return;
    }
    if (!group) {
      setError('กรุณาเลือกกลุ่มของหุ้น');
      return;
    }
    const src = copyFrom === '__default' ? null : list.find(r => r.id === copyFrom);
    const base = src ? {
      ...src.settings
    } : {
      ...window.SH_SETTINGS_DEFAULTS
    };
    base.shareGroup = group;
    onCreate({
      id: shUid(),
      name: name.trim(),
      createdDate: shToday(),
      createdBy: window.LOGIN_USER.name,
      note: note.trim(),
      memberStatus,
      enabled: false,
      settings: base,
      tiers: src ? src.tiers.map(t => ({
        ...t
      })) : []
    });
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: 480
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", null, "เพิ่มประเภทหุ้น"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, "สร้างประเภทหุ้นใหม่ \u2014 ปิดใช้งานไว้จนกว่าจะเปิดสถานะ")), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose,
    "aria-label": "ปิด"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("form", {
    className: "modal-body",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label"
  }, "ชื่อประเภทหุ้น ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: name,
    autoFocus: true,
    placeholder: "เช่น หุ้นสามัญ, หุ้นพิเศษ",
    onChange: e => {
      setName(e.target.value);
      setError('');
    }
  }), /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label",
    style: {
      marginTop: 12
    }
  }, "กลุ่มของหุ้น ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: group,
    onChange: e => setGroup(e.target.value)
  }, window.SH_OPTS.shareGroup.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l))), /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label",
    htmlFor: "sh-add-mstatus",
    style: {
      marginTop: 12
    }
  }, "สถานะสมาชิก ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("select", {
    id: "sh-add-mstatus",
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: memberStatus,
    onChange: e => setMemberStatus(e.target.value)
  }, SH_MEMBER_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s))), /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label",
    style: {
      marginTop: 12
    }
  }, "เริ่มจาก"), /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: copyFrom,
    onChange: e => setCopyFrom(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "__default"
  }, "ค่าเริ่มต้นของระบบ"), list.map(r => /*#__PURE__*/React.createElement("option", {
    key: r.id,
    value: r.id
  }, "คัดลอกจาก: ", r.name))), /*#__PURE__*/React.createElement("label", {
    className: "lt-modal-label",
    style: {
      marginTop: 12
    }
  }, "หมายเหตุ"), /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 3,
    maxLength: 255,
    style: {
      width: '100%',
      resize: 'vertical'
    },
    value: note,
    placeholder: "ระบุหมายเหตุ (ถ้ามี)",
    onChange: e => setNote(e.target.value)
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "dep-error",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), " ", error), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 18
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
  }), " สร้างประเภทหุ้น")))));
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function ShareTermsConfigPage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  const [list, setList] = useState(shLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);
  const [confirm, setConfirm] = useState(null); // { rec, next }
  const persist = next => {
    setList(next);
    shSave(next);
  };
  const openRec = list.find(r => r.id === openId);
  // breadcrumb: หน้าหลัก › ข้อกำหนดประเภทหุ้น (› รายละเอียด / แก้ไขข้อมูล เมื่อเปิดรายการ)
  window.useBreadcrumb && window.crumb3 && window.useBreadcrumb(window.crumb3('ข้อกำหนดประเภทหุ้น', openRec ? startEditing ? 'edit' : 'view' : 'list', () => {
    setOpenId(null);
    setStartEditing(false);
  }), [!!openRec, startEditing]);
  const handleCreate = rec => {
    persist([rec, ...list]);
    audit.log({
      action: 'create',
      module: SH_MODULE,
      target: `${rec.id} · ${rec.name}`,
      summary: `เพิ่มประเภทหุ้น “${rec.name}”`,
      changes: [{
        field: 'ชื่อประเภทหุ้น',
        before: '—',
        after: rec.name
      }]
    });
    setAdding(false);
    onToast && onToast(`สร้างประเภทหุ้น “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true);
    setOpenId(rec.id);
  };
  const handleSaveDetail = draft => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({
      action: 'update',
      module: SH_MODULE,
      target: `${draft.id} · ${draft.name}`,
      summary: `แก้ไขข้อกำหนดประเภทหุ้น “${draft.name}”`
    });
    onToast && onToast(`บันทึกข้อกำหนด “${draft.name}” เรียบร้อยแล้ว`);
  };

  // ─── Detail view ──────────────────────────────────────────────────
  if (openRec) {
    return /*#__PURE__*/React.createElement(ShDetail, {
      record: openRec,
      startEditing: startEditing,
      onBack: () => {
        setOpenId(null);
        setStartEditing(false);
      },
      onSave: handleSaveDetail
    });
  }

  // ─── List view (รูปแบบตารางค่าคงที่ระบบสินเชื่อ) ─────────────────────
  const term = applied.trim().toLowerCase();
  const rows = list.filter(r => !term || [r.id, r.name, r.note, r.memberStatus, window.shLabel('shareGroup', r.settings.shareGroup)].filter(Boolean).some(s => String(s).toLowerCase().includes(term)));
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const curPage = Math.min(page, pages);
  const start = (curPage - 1) * per;
  const pageRows = rows.slice(start, start + per);
  const applyToggle = () => {
    const {
      rec,
      next
    } = confirm;
    persist(list.map(r => r.id === rec.id ? {
      ...r,
      enabled: next
    } : r));
    audit.log({
      action: 'update',
      module: SH_MODULE,
      target: `${rec.id} · ${rec.name}`,
      summary: (next ? 'เปิด' : 'ปิด') + `ใช้งานประเภทหุ้น “${rec.name}”`
    });
    setConfirm(null);
    onToast && onToast((next ? 'เปิด' : 'ปิด') + `ใช้งานประเภทหุ้น “${rec.name}” แล้ว`);
  };
  const pgBtn = (n, label, disabled, active, aria) => /*#__PURE__*/React.createElement("button", {
    key: label,
    type: "button",
    className: "sh-pg" + (active ? ' on' : ''),
    disabled: disabled,
    "aria-label": aria,
    "aria-current": active ? 'page' : undefined,
    onClick: () => !disabled && setPage(n)
  }, label);
  const open = r => {
    setStartEditing(false);
    setOpenId(r.id);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "หน้าค่าคงที่ข้อกำหนดประเภทหุ้น"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-actions"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 600
    }
  }, "ข้อกำหนดประเภทหุ้น"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 2
    }
  }, "กำหนดเงื่อนไขและกฎเกณฑ์ของแต่ละประเภทหุ้น พร้อมตารางการส่งหุ้นขั้นต่ำรายเดือนตามช่วงเงินเดือน")), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: () => setAdding(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus"
  }), " เพิ่มประเภทหุ้น")), /*#__PURE__*/React.createElement("div", {
    className: "search-card sh-listcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sh-searchbar",
    style: {
      alignItems: 'flex-end',
      padding: '14px 16px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 1 340px',
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "sh-q",
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
    id: "sh-q",
    "aria-label": "ค้นหา",
    value: q,
    placeholder: "ค้นหารหัส / ชื่อประเภทหุ้น",
    onChange: e => setQ(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        setApplied(q);
        setPage(1);
      }
    }
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary",
    onClick: () => {
      setApplied(q);
      setPage(1);
    }
  }, "ค้นหา"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: () => {
      setQ('');
      setApplied('');
      setPage(1);
    }
  }, "รีเซ็ต")), /*#__PURE__*/React.createElement("div", {
    className: "sh-table-area"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 1000
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }, "รหัสประเภทหุ้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "ชื่อประเภทหุ้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120
    }
  }, "กลุ่มของหุ้น"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 160
    }
  }, "สถานะสมาชิก"), /*#__PURE__*/React.createElement("th", {
    className: "right",
    style: {
      width: 110
    }
  }, "มูลค่า/หุ้น"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 110
    }
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 80
    }
  }, "ใช้งาน"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 84
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "sh-sr"
  }, "การจัดการ")))), /*#__PURE__*/React.createElement("tbody", null, pageRows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    className: "clickable",
    onClick: () => open(r)
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.id), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "lt-row-name"
  }, r.name), r.note && /*#__PURE__*/React.createElement("div", {
    className: "lt-row-note muted"
  }, r.note)), /*#__PURE__*/React.createElement("td", null, window.shLabel('shareGroup', r.settings.shareGroup)), /*#__PURE__*/React.createElement("td", null, r.memberStatus || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    className: "right mono"
  }, fmt.money(Number(r.settings.parValue || 0), 2)), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, r.enabled ? /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, "เปิดใช้งาน") : /*#__PURE__*/React.createElement("span", {
    className: "pill neutral"
  }, "ปิดใช้งาน")), /*#__PURE__*/React.createElement("td", {
    className: "center",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lt-switch" + (r.enabled ? ' on' : ''),
    role: "switch",
    "aria-checked": !!r.enabled,
    "aria-label": (r.enabled ? 'ปิดใช้งาน ' : 'เปิดใช้งาน ') + r.name,
    onClick: () => setConfirm({
      rec: r,
      next: !r.enabled
    })
  }, /*#__PURE__*/React.createElement("span", {
    className: "lt-switch-knob"
  }))), /*#__PURE__*/React.createElement("td", {
    className: "center",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn sm",
    "aria-label": 'ดู ' + r.name,
    onClick: () => open(r)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "eye",
    size: 13
  }), " ดู")))), total === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    className: "center muted",
    style: {
      padding: 24
    }
  }, "ไม่พบข้อมูลที่ค้นหา")))))), /*#__PURE__*/React.createElement("div", {
    className: "sh-pager"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, total === 0 ? '0 รายการ' : start + 1 + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, pgBtn(curPage - 1, '\u2039', curPage <= 1, false, 'หน้าก่อนหน้า'), Array.from({
    length: pages
  }, (_, i) => pgBtn(i + 1, String(i + 1), false, curPage === i + 1)), pgBtn(curPage + 1, '\u203A', curPage >= pages, false, 'หน้าถัดไป'), /*#__PURE__*/React.createElement("select", {
    className: "sh-per",
    value: per,
    "aria-label": "จำนวนต่อหน้า",
    onChange: e => {
      setPer(Number(e.target.value));
      setPage(1);
    }
  }, [20, 50, 100].map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n, " / หน้า")))))), /*#__PURE__*/React.createElement("div", {
    className: "lt-list-foot muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 12
  }), " ข้อกำหนดประเภทหุ้นใช้กับการประมวลผลเรียกเก็บและคำนวณปันผล \u2014 ควรตรวจสอบก่อนรอบประมวลผลประจำเดือน"), adding && /*#__PURE__*/React.createElement(ShAddModal, {
    list: list,
    onClose: () => setAdding(false),
    onCreate: handleCreate
  }), confirm && window.ToggleConfirmModal && /*#__PURE__*/React.createElement(window.ToggleConfirmModal, {
    next: confirm.next,
    title: (confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งานประเภทหุ้น',
    subtitle: confirm.rec.id + ' · ' + confirm.rec.name,
    detail: confirm.next ? 'เปิดใช้ประเภทหุ้น “' + confirm.rec.name + '” — นำไปใช้ในการประมวลผลเรียกเก็บรอบถัดไป' : 'ปิดการใช้งาน “' + confirm.rec.name + '” — ไม่นำไปใช้ในการประมวลผลรอบถัดไป (ข้อมูลเดิมไม่กระทบ)',
    onCancel: () => setConfirm(null),
    onConfirm: applyToggle
  }));
}
Object.assign(window, {
  ShareTermsConfigPage
});