// ════════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ค่าคงที่ประเภทรายการ · ค่าคงที่ระบบสมาชิก
//  ตารางค่าคงที่แบบแก้ไขในตาราง (เพิ่มแถว / ลบ / บันทึก) — LkTable
// ════════════════════════════════════════════════════════════════════

const lkAudit = () => React.useContext(window.AuditContext || React.createContext({
  log: () => {}
}));
const LK_SEX = [{
  v: 'M',
  l: 'ชาย'
}, {
  v: 'F',
  l: 'หญิง'
}];
function LkTable({
  title,
  subtitle,
  module,
  cols,
  seed,
  storeKey,
  onToast
}) {
  const {
    useState,
    useMemo
  } = React;
  const audit = lkAudit();
  const blank = () => cols.reduce((o, c) => {
    o[c.key] = c.type === 'check' ? false : c.type === 'select' ? c.options[0] && c.options[0].v : '';
    return o;
  }, {});
  const load = () => {
    try {
      const s = localStorage.getItem(storeKey);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return seed.map(r => ({
      ...r
    }));
  };
  const [rows, setRows] = useState(load);
  const [q, setQ] = useState('');
  const [dirty, setDirty] = useState(false);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(r => cols.some(c => String(r[c.key] ?? '').toLowerCase().includes(t)));
  }, [rows, q, cols]);
  const set = (i, k, v) => {
    setRows(rs => rs.map((r, idx) => idx === i ? {
      ...r,
      [k]: v
    } : r));
    setDirty(true);
  };
  const addRow = () => {
    setRows(rs => [...rs, blank()]);
    setDirty(true);
  };
  const removeRow = i => {
    setRows(rs => rs.filter((_, idx) => idx !== i));
    setDirty(true);
  };
  const save = () => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(rows));
    } catch (e) {}
    setDirty(false);
    audit && audit.log && audit.log({
      action: 'update',
      module: `ประมวลผลและจัดเก็บ — ${module}`,
      target: title,
      summary: `บันทึกค่าคงที่ “${title}” จำนวน ${rows.length} รายการ`
    });
    onToast && onToast(`บันทึก${title}เรียบร้อยแล้ว (${rows.length} รายการ)`);
  };
  const reset = () => {
    setRows(seed.map(r => ({
      ...r
    })));
    setDirty(true);
    onToast && onToast('คืนค่าตั้งต้นเรียบร้อยแล้ว');
  };
  const cell = (r, i, c) => {
    if (c.type === 'check') return /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: !!r[c.key],
      onChange: e => set(i, c.key, e.target.checked)
    });
    if (c.type === 'select') return /*#__PURE__*/React.createElement("select", {
      className: "cfg-input sm",
      style: c.full ? {
        width: '100%'
      } : undefined,
      value: r[c.key],
      onChange: e => set(i, c.key, e.target.value)
    }, c.options.map(o => /*#__PURE__*/React.createElement("option", {
      key: o.v,
      value: o.v
    }, o.l)));
    return /*#__PURE__*/React.createElement("input", {
      className: "cfg-input sm",
      type: c.type === 'num' ? 'number' : 'text',
      step: c.type === 'num' ? c.decimals ? '0.01' : '1' : undefined,
      style: c.type === 'num' ? {
        textAlign: 'right'
      } : c.full ? {
        width: '100%'
      } : undefined,
      value: r[c.key] ?? '',
      onChange: e => set(i, c.key, e.target.value)
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": title
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-form-title"
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-form-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "database",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: save
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
    onClick: reset
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh",
    size: 13
  }), " \u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19"))), /*#__PURE__*/React.createElement("div", {
    className: "search-card icr-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      flex: '1 1 0',
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, "\u0E04\u0E49\u0E19\u0E2B\u0E32"), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E14\u0E49\u0E27\u0E22\u0E23\u0E2B\u0E31\u0E2A\u0E2B\u0E23\u0E37\u0E2D\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      width: 160
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("div", {
    className: "icr-ro num mono"
  }, window.fmt.money(rows.length, 0))), /*#__PURE__*/React.createElement("div", {
    className: "icr-fld",
    style: {
      width: 160
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "icr-fld-l"
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /*#__PURE__*/React.createElement("div", {
    className: "icr-ro"
  }, dirty ? 'ยังไม่บันทึก' : 'บันทึกแล้ว'))), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      width: c.w,
      textAlign: c.type === 'num' ? 'right' : c.type === 'check' ? 'center' : undefined
    }
  }, c.label)), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 66
    }
  }, "\u0E25\u0E1A"))), /*#__PURE__*/React.createElement("tbody", null, shown.map(r => {
    const i = rows.indexOf(r);
    return /*#__PURE__*/React.createElement("tr", {
      key: i
    }, cols.map(c => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        textAlign: c.type === 'check' ? 'center' : undefined
      }
    }, cell(r, i, c))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      className: "btn sm danger",
      onClick: () => removeRow(i)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 12
    }))));
  }), !shown.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: cols.length + 1,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))))), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 8
    }
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 \u2014 \u0E2B\u0E25\u0E31\u0E07\u0E08\u0E32\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27/\u0E25\u0E1A\u0E41\u0E16\u0E27 \u0E41\u0E25\u0E49\u0E27\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07")));
}

// ─── ค่าคงที่ประเภทรายการ ────────────────────────────────────────────
const LK_KEEP_COLS = [{
  key: 'code',
  label: 'รหัสรายการคืนใบเสร็จ',
  w: 180
}, {
  key: 'acc',
  label: 'รหัสบัญชี',
  w: 140
}, {
  key: 'name',
  label: 'ชื่อบัญชีที่ทำรายการคืนใบเสร็จ'
}];
const LK_KEEP_SEED = [{
  code: 'AGC',
  acc: '1105010',
  name: 'ลูกหนี้ตัวแทน'
}, {
  code: 'BNK',
  acc: '1103520',
  name: 'โอนคืนสมาชิก'
}, {
  code: 'WTG',
  acc: '2203510',
  name: 'เงินรอจ่ายคืน'
}];
function ConstKeepPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E04\u0E39\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35 (Keep)",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E04\u0E39\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E37\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    cols: LK_KEEP_COLS,
    seed: LK_KEEP_SEED,
    storeKey: "const_keep",
    onToast: onToast
  });
}
const LK_SIDE = [{
  v: '1',
  l: '1'
}, {
  v: '-1',
  l: '-1'
}];
const LK_KEEPITEM_COLS = [{
  key: 'code',
  label: 'รหัสสายการ',
  w: 110
}, {
  key: 'name',
  label: 'ชื่อประเภทการทำรายการจัดเก็บ'
}, {
  key: 'group',
  label: 'รหัสกลุ่ม',
  w: 100
}, {
  key: 'procOnly',
  label: 'ประมวลผลเท่านั้น',
  w: 130,
  type: 'check'
}, {
  key: 'order',
  label: 'การเรียงในใบเสร็จ',
  w: 130,
  type: 'num'
}, {
  key: 'side',
  label: 'ฝั่งรายการ',
  w: 110,
  type: 'select',
  options: LK_SIDE
}, {
  key: 'sys',
  label: 'ระบบ',
  w: 90
}];
const LK_KEEPITEM_SEED = [{
  code: 'D00',
  name: 'เงินฝากออมทรัพย์',
  group: 'DEP',
  procOnly: true,
  order: 10,
  side: '1',
  sys: 'DEP'
}, {
  code: 'D01',
  name: 'เงินฝากประจำ',
  group: 'DEP',
  procOnly: true,
  order: 11,
  side: '1',
  sys: 'DEP'
}, {
  code: 'D02',
  name: 'เงินฝากออมทรัพย์พิเศษ',
  group: 'DEP',
  procOnly: true,
  order: 12,
  side: '1',
  sys: 'DEP'
}, {
  code: 'DPI',
  name: 'แสดงยอดค/บค้างชำระ',
  group: 'DPY',
  procOnly: false,
  order: 3,
  side: '1',
  sys: 'LON'
}, {
  code: 'DPL',
  name: 'แสดงยอดคงเหลือหนี้',
  group: 'DPY',
  procOnly: false,
  order: 1,
  side: '1',
  sys: 'LON'
}, {
  code: 'DPS',
  name: 'แสดงยอดคงเหลือหุ้น',
  group: 'DPY',
  procOnly: false,
  order: 1,
  side: '1',
  sys: 'LON'
}, {
  code: 'ETN',
  name: 'ฉุกเฉินหักโอน',
  group: 'ETN',
  procOnly: true,
  order: 100,
  side: '-1',
  sys: 'LON'
}, {
  code: 'FFE',
  name: 'ค่าธรรมเนียมแรกเข้า',
  group: 'FEE',
  procOnly: true,
  order: 5,
  side: '1',
  sys: 'LON'
}, {
  code: 'IAR',
  name: 'ดอกเบี้ยค้างรับ',
  group: 'IAR',
  procOnly: true,
  order: 101,
  side: '1',
  sys: 'LON'
}, {
  code: 'ISF',
  name: 'เบี้ยประกันอัคคีภัย',
  group: 'ISR',
  procOnly: true,
  order: 8,
  side: '1',
  sys: 'LON'
}, {
  code: 'L01',
  name: 'เงินกู้ฉุกเฉิน',
  group: 'LON',
  procOnly: true,
  order: 2,
  side: '1',
  sys: 'LON'
}, {
  code: 'L02',
  name: 'เงินกู้สามัญ',
  group: 'LON',
  procOnly: true,
  order: 3,
  side: '1',
  sys: 'LON'
}, {
  code: 'L03',
  name: 'เงินกู้พิเศษ',
  group: 'LON',
  procOnly: true,
  order: 4,
  side: '1',
  sys: 'LON'
}, {
  code: 'LAF',
  name: 'ค่าฤชาธรรมเนียมศาล',
  group: 'OTH',
  procOnly: true,
  order: 103,
  side: '1',
  sys: 'LON'
}, {
  code: 'LAW',
  name: 'ค่าทนายความ',
  group: 'OTH',
  procOnly: true,
  order: 102,
  side: '1',
  sys: 'LON'
}, {
  code: 'LNF',
  name: 'กองทุนช่วยเหลือผู้ค้ำ',
  group: 'MRT',
  procOnly: true,
  order: 999,
  side: '-1',
  sys: 'LON'
}, {
  code: 'MAV',
  name: 'ชำระเงินกู้ล่วงหน้า',
  group: 'MRT',
  procOnly: true,
  order: 999,
  side: '-1',
  sys: 'LON'
}, {
  code: 'MCB',
  name: 'ดอกเบี้ยเก็บเกินเรียกคืน',
  group: 'OTH',
  procOnly: true,
  order: 101,
  side: '1',
  sys: 'LON'
}, {
  code: 'MCD',
  name: 'ค่าบัตรสมาชิก',
  group: 'OTH',
  procOnly: true,
  order: 101,
  side: '1',
  sys: 'LON'
}, {
  code: 'MRT',
  name: 'เงินคืน',
  group: 'MRT',
  procOnly: true,
  order: 99,
  side: '-1',
  sys: 'LON'
}];
function ConstKeepItemPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E23\u0E2B\u0E31\u0E2A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (KeepItem)",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E41\u0E25\u0E30\u0E25\u0E33\u0E14\u0E31\u0E1A\u0E43\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    cols: LK_KEEPITEM_COLS,
    seed: LK_KEEPITEM_SEED,
    storeKey: "const_keepitem",
    onToast: onToast
  });
}

// ─── ค่าคงที่ระบบสมาชิก ─────────────────────────────────────────────
const LK_PREFIX_SEED = [['01', 'นาย', 'นาย', 'M'], ['02', 'น.ส.', 'น.ส.', 'F'], ['03', 'นาง', 'นาง', 'F'], ['04', 'พ.ต.', 'พ.ต.', 'M'], ['05', 'ว่าที่ พ.ต.', 'ว่าที่ พ.ต', 'M'], ['06', 'พ.ท.', 'พ.ท.', 'M'], ['07', 'ร.ต.', 'ร.ต.', 'M'], ['08', 'ว่าที่ ร.ต.', 'ว่าที่ ร.ต', 'M'], ['09', 'ร.ท.', 'ร.ท.', 'M'], ['10', 'ว่าที่ ร.ท.', 'ว่าที่ ร.ท', 'M'], ['11', 'ร.อ.', 'ร.อ.', 'M'], ['12', 'ว่าที่ ร.อ.', 'ว่าที่ ร.อ', 'M'], ['13', 'ว่าที่ ร.ต.หญิง', 'ว่าที่ ร.ต', 'F'], ['14', 'น.ต.', 'น.ต.', 'M'], ['15', 'พ.อ.อ.', 'พ.อ.อ.', 'M'], ['16', 'ส.อ.', 'ส.อ.', 'M'], ['17', 'จ.ส.ต.', 'จ.ส.ต.', 'M'], ['18', 'จ.ส.ท.', 'จ.ส.ท.', 'M'], ['19', 'จ.ส.อ.', 'จ.ส.อ.', 'M'], ['20', 'ส.ต.ต.', 'ส.ต.ต.', 'M']].map(([code, name, abbr, sex]) => ({
  code,
  name,
  abbr,
  sex
}));
function ConstPrefixPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E04\u0E33\u0E19\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E32\u0E21",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E04\u0E33\u0E19\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E32\u0E21 \u0E04\u0E33\u0E22\u0E48\u0E2D \u0E41\u0E25\u0E30\u0E40\u0E1E\u0E28",
    cols: [{
      key: 'code',
      label: 'รหัสคำนำหน้า',
      w: 120
    }, {
      key: 'name',
      label: 'ชื่อคำนำหน้านาม'
    }, {
      key: 'abbr',
      label: 'คำย่อ',
      w: 140
    }, {
      key: 'sex',
      label: 'เพศ',
      w: 120,
      type: 'select',
      options: LK_SEX
    }],
    seed: LK_PREFIX_SEED,
    storeKey: "const_prefix",
    onToast: onToast
  });
}
function ConstMemberAffilPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E23\u0E2B\u0E31\u0E2A\u0E41\u0E25\u0E30\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14\u0E02\u0E2D\u0E07\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    cols: [{
      key: 'code',
      label: 'รหัสสังกัด',
      w: 140
    }, {
      key: 'name',
      label: 'ชื่อสังกัด'
    }],
    seed: [{
      code: '001',
      name: 'ddddd'
    }, {
      code: 'ยยย',
      name: '(ไม่ระบุ)'
    }],
    storeKey: "const_member_affil",
    onToast: onToast
  });
}
function ConstPositionPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E23\u0E2B\u0E31\u0E2A\u0E41\u0E25\u0E30\u0E0A\u0E37\u0E48\u0E2D\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    cols: [{
      key: 'code',
      label: 'รหัสตำแหน่ง',
      w: 140
    }, {
      key: 'name',
      label: 'ชื่อตำแหน่ง'
    }],
    seed: [{
      code: 'ยยย',
      name: 'ไม่ระบุ'
    }],
    storeKey: "const_position",
    onToast: onToast
  });
}
function ConstApplyTypePage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E2A\u0E21\u0E31\u0E04\u0E23",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21\u0E41\u0E23\u0E01\u0E40\u0E02\u0E49\u0E32",
    cols: [{
      key: 'code',
      label: 'รหัสประเภท',
      w: 140
    }, {
      key: 'name',
      label: 'ชื่อประเภทการสมัคร'
    }, {
      key: 'fee',
      label: 'ค่าธรรมเนียม',
      w: 150,
      type: 'num',
      decimals: true
    }],
    seed: [{
      code: '01',
      name: 'ครั้งที่ 1',
      fee: 100
    }, {
      code: '02',
      name: 'ครั้งที่ 2',
      fee: 100
    }, {
      code: '03',
      name: 'ครั้งที่ 3',
      fee: 100
    }, {
      code: 'ยย',
      name: '(ไม่ระบุ)',
      fee: 100
    }],
    storeKey: "const_apply_type",
    onToast: onToast
  });
}
const LK_RELATION_SEED = ['คนเอง', 'บิดา', 'มารดา', 'สามี', 'ภรรยา', 'ลุง', 'ป้า', 'น้า', 'อา', 'พี่ชาย', 'พี่สาว', 'พี่สะใภ้', 'พี่เขย', 'น้องชาย', 'น้องสาว', 'น้องสะใภ้', 'น้องเขย', 'บุตร', 'บุตรบุญธรรม', 'หลาน'].map((name, i) => ({
  code: String(i).padStart(2, '0'),
  name
}));
function ConstRelationPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E42\u0E2D\u0E19\u0E1C\u0E25\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E42\u0E2D\u0E19\u0E1C\u0E25\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C",
    cols: [{
      key: 'code',
      label: 'รหัส',
      w: 120
    }, {
      key: 'name',
      label: 'ความสัมพันธ์'
    }],
    seed: LK_RELATION_SEED,
    storeKey: "const_relation",
    onToast: onToast
  });
}
function ConstResignReasonPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E25\u0E32\u0E2D\u0E2D\u0E01",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E25\u0E32\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    cols: [{
      key: 'code',
      label: 'รหัส',
      w: 120
    }, {
      key: 'name',
      label: 'สาเหตุการลาออก'
    }],
    seed: [{
      code: '01',
      name: 'ลาออกจากการเป็นสมาชิก'
    }, {
      code: '02',
      name: 'เสียชีวิต'
    }, {
      code: '03',
      name: 'ให้ออกจากการเป็นสมาชิก'
    }, {
      code: '04',
      name: 'ลาออกจากการทำงาน'
    }, {
      code: '05',
      name: 'เกษียณ, เกษียณก่อนกำหนด'
    }, {
      code: '06',
      name: 'ไล่ออก ปลดออก ให้ออกจากการทำงาน'
    }, {
      code: '07',
      name: 'โอนย้าย'
    }, {
      code: '08',
      name: 'อื่น ๆ'
    }, {
      code: '09',
      name: 'สมัครเป็นสมาชิกใหม่'
    }, {
      code: '10',
      name: 'เป็นคนไร้ความสามารถ หรือ เสมือนไร้ความสามารถ'
    }],
    storeKey: "const_resign_reason",
    onToast: onToast
  });
}
function ConstMemberTypePage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E15\u0E32\u0E21\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E07\u0E32\u0E19\u0E15\u0E49\u0E19\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    cols: [{
      key: 'code',
      label: 'รหัส',
      w: 120
    }, {
      key: 'name',
      label: 'ประเภทการสมัครสมาชิก',
      full: true
    }],
    seed: [{
      code: '000',
      name: 'ไม่ระบุ',
      eligGroup: 'regular'
    }, {
      code: '001',
      name: 'ปณท.',
      eligGroup: 'regular'
    }, {
      code: '002',
      name: 'กสท.',
      eligGroup: 'regular'
    }, {
      code: '003',
      name: 'กสทช.',
      eligGroup: 'regular'
    }, {
      code: '004',
      name: 'เกษียณส่วนกลาง',
      eligGroup: 'regular'
    }, {
      code: '005',
      name: 'เกษียณส่วนภูมิภาค',
      eligGroup: 'regular'
    }, {
      code: '006',
      name: 'ฌปท.',
      eligGroup: 'regular'
    }, {
      code: '007',
      name: 'สอ.กสท',
      eligGroup: 'regular'
    }, {
      code: '008',
      name: 'สหกรณ์ร้านค้า',
      eligGroup: 'regular'
    }, {
      code: '009',
      name: 'สมาชิกสมทบ',
      eligGroup: 'associate-staff'
    }, {
      code: '010',
      name: 'ปณทดบ',
      eligGroup: 'regular'
    }],
    storeKey: "const_member_type_v3",
    onToast: onToast
  });
}
const LK_SHRITEM_SEED = [{
  code: 'AJM',
  name: 'ปรับปรุงลดหุ้น',
  print: 'AJM',
  effect: '',
  side: '-1'
}, {
  code: 'AJP',
  name: 'ปรับปรุงเพิ่มหุ้น',
  print: 'AJP',
  effect: '',
  side: '1'
}, {
  code: 'B/F',
  name: 'ยอดยกมา',
  print: 'B/F',
  effect: '',
  side: '1'
}, {
  code: 'ERM',
  name: 'ยกเลิกการคืนใบเสร็จ',
  print: '',
  effect: '',
  side: '1'
}, {
  code: 'RPM',
  name: 'ยกเลิกการส่งหุ้นประจำเดือน',
  print: 'RPM',
  effect: 'SPM',
  side: '-1'
}, {
  code: 'RPX',
  name: 'ยกเลิกการซื้อหุ้นเพิ่ม',
  print: 'RPX',
  effect: 'SPX',
  side: '-1'
}, {
  code: 'RWD',
  name: 'ยกเลิกการถอนหุ้น',
  print: 'RWD',
  effect: 'SWD',
  side: '1'
}, {
  code: 'RWP',
  name: 'ยกเลิกถอนหุ้นบางส่วน',
  print: 'RWP',
  effect: 'SWP',
  side: '1'
}, {
  code: 'SGF',
  name: 'หุ้นของขวัญ',
  print: 'SGF',
  effect: 'RGF',
  side: '1'
}, {
  code: 'SPM',
  name: 'ส่งหุ้นประจำเดือน',
  print: 'SPM',
  effect: 'RPM',
  side: '1'
}, {
  code: 'SPX',
  name: 'ซื้อหุ้นเพิ่ม',
  print: 'SPX',
  effect: 'RPX',
  side: '1'
}, {
  code: 'SWD',
  name: 'โอนหุ้น',
  print: 'SWD',
  effect: 'RWD',
  side: '-1'
}, {
  code: 'SWP',
  name: 'ถอนหุ้น',
  print: 'SWP',
  effect: 'RWP',
  side: '-1'
}];
function ConstShrItemPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E23\u0E2B\u0E31\u0E2A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 (ShrItem)",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E38\u0E49\u0E19\u0E41\u0E25\u0E30\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E23\u0E30\u0E17\u0E1A",
    cols: [{
      key: 'code',
      label: 'รหัสสายการ',
      w: 110
    }, {
      key: 'name',
      label: 'ชื่อประเภทการทำรายการหุ้น'
    }, {
      key: 'print',
      label: 'รหัสพิมพ์',
      w: 110
    }, {
      key: 'effect',
      label: 'รหัสกระทบ',
      w: 110
    }, {
      key: 'side',
      label: 'ฝั่งรายการ',
      w: 110,
      type: 'select',
      options: LK_SIDE
    }],
    seed: LK_SHRITEM_SEED,
    storeKey: "const_shritem",
    onToast: onToast
  });
}
function ConstMemberStatusPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E23\u0E2B\u0E31\u0E2A\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E41\u0E25\u0E30\u0E01\u0E25\u0E38\u0E48\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30",
    cols: [{
      key: 'code',
      label: 'รหัส',
      w: 100
    }, {
      key: 'name',
      label: 'ชื่อสถานะสมาชิก'
    }, {
      key: 'status',
      label: 'สถานะ',
      w: 110,
      type: 'num'
    }, {
      key: 'group',
      label: 'กลุ่ม',
      w: 110,
      type: 'num'
    }],
    seed: [{
      code: '10',
      name: 'สมาชิกปกติ',
      status: 1,
      group: 1
    }, {
      code: '30',
      name: 'สมาชิกผิดนัดชำระหนี้',
      status: 1,
      group: 1
    }, {
      code: '40',
      name: 'สมาชิกดำเนินคดี',
      status: -9,
      group: 1
    }, {
      code: '70',
      name: 'สมาชิกรับสภาพหนี้',
      status: -9,
      group: 1
    }, {
      code: '71',
      name: 'สมาชิกรับสภาพหนี้โครงการค้ำฯ',
      status: -9,
      group: 1
    }, {
      code: '80',
      name: 'พ้นสภาพสมาชิก',
      status: -9,
      group: 1
    }, {
      code: '81',
      name: 'สมาชิกลาออกรอปันผล',
      status: -9,
      group: 0
    }],
    storeKey: "const_member_status",
    onToast: onToast
  });
}
function ConstStatusNotePage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E2A\u0E16\u0E32\u0E19\u0E30",
    module: "\u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E04\u0E48\u0E32\u0E04\u0E07\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01 \u2014 \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    cols: [{
      key: 'code',
      label: 'รหัส',
      w: 120
    }, {
      key: 'name',
      label: 'หมายเหตุ-สถานะ'
    }],
    seed: [{
      code: '001',
      name: 'โครงการค้ำประกัน'
    }, {
      code: '002',
      name: 'ติดลบ'
    }, {
      code: '003',
      name: 'เกษียณ'
    }, {
      code: '004',
      name: 'ค/ก'
    }, {
      code: '005',
      name: 'พ้นสภาพการเป็นสมาชิก'
    }, {
      code: '007',
      name: 'งดกู้ทุกประเภท'
    }, {
      code: '010',
      name: 'ป/พ'
    }, {
      code: '011',
      name: 'ม/ส'
    }, {
      code: '012',
      name: 'งดค้ำประกัน'
    }, {
      code: '013',
      name: 'กู้ไม่เกินค่าหุ้น'
    }, {
      code: '014',
      name: 'กู้ ฉ.จ. ไม่เกินค่าหุ้น'
    }, {
      code: '015',
      name: 'รับสภาพหนี้'
    }, {
      code: '016',
      name: 'รับสภาพหนี้หลังคำพิพากษา'
    }, {
      code: '017',
      name: 'วินัย'
    }, {
      code: '018',
      name: 'รวมหนี้'
    }, {
      code: '019',
      name: 'งดกู้หุ้น'
    }, {
      code: '020',
      name: 'ใช้หุ้นสมาชิกค้ำประกันเงินกู้'
    }, {
      code: '021',
      name: 'งดทำนิติกรรม'
    }, {
      code: '022',
      name: 'ให้ออกจากสมาชิก'
    }, {
      code: '023',
      name: 'ลาออกจากกองทุนสำรองเลี้ยงชีพ'
    }],
    storeKey: "const_status_note",
    onToast: onToast
  });
}
Object.assign(window, {
  LkTable,
  ConstKeepPage,
  ConstKeepItemPage,
  ConstPrefixPage,
  ConstMemberAffilPage,
  ConstPositionPage,
  ConstApplyTypePage,
  ConstRelationPage,
  ConstResignReasonPage,
  ConstMemberTypePage,
  ConstShrItemPage,
  ConstMemberStatusPage,
  ConstStatusNotePage
});