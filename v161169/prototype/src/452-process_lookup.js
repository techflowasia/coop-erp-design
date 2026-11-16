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
// ─── รูปแบบเดียวกับเมนูค่าคงที่อื่น (หน่วยงาน/รหัสเขต) ─────────────
//  ตารางอ่านอย่างเดียว · ค้นหา/รีเซ็ต · สถานะ + สวิตช์ใช้งาน · แก้ไข/เพิ่มผ่าน popup
const lkFmtNum = (c, v) => v === '' || v === undefined || v === null ? '—' : (Number(v) || 0).toLocaleString('en-US', {
  minimumFractionDigits: c.decimals ? 2 : 0,
  maximumFractionDigits: c.decimals ? 2 : 0
});
const lkShow = (c, v) => {
  const h = React.createElement;
  if (c.type === 'check') return v ? h("span", { style: { color: '#237450', fontWeight: 600 } }, "✓") : h("span", { style: { color: 'rgba(0,0,0,.3)' } }, "—");
  if (c.type === 'select') {
    const o = (c.options || []).find(x => String(x.v) === String(v));
    return o ? o.l : v || '—';
  }
  if (c.type === 'num') return lkFmtNum(c, v);
  return v === '' || v === undefined || v === null ? h("span", { style: { color: 'rgba(0,0,0,.3)' } }, "—") : String(v);
};
const lkAlign = c => c.type === 'num' ? 'right' : c.type === 'check' || c.type === 'select' ? 'center' : 'left';
const lkCfg = props => {
  const { title, subtitle, module, cols, seed, storeKey } = props;
  const codeCol = cols.find(c => c.key === 'code') || cols[0];
  const nameCol = cols.find(c => c.key === 'name') || cols[1];
  const extras = cols.filter(c => c !== codeCol && c !== nameCol);
  const entity = title.replace(/\s*\(.*\)\s*$/, '');
  const desc = String(subtitle || '').split('— ').pop();
  const blank = () => cols.reduce((o, c) => {
    o[c.key] = c.type === 'check' ? false : c.type === 'select' ? c.options[0] && c.options[0].v : '';
    return o;
  }, { enabled: true });
  return {
    key: storeKey + '_v2', idPrefix: storeKey + '-', module: 'ประมวลผลและจัดเก็บ — ' + module,
    screen: title, title: title, entity: entity, subtitle: desc,
    codeLabel: codeCol.label, nameLabel: nameCol.label,
    codePh: 'ระบุ' + codeCol.label, namePh: 'ระบุ' + nameCol.label, codeMax: 20,
    formHint: desc,
    searchPh: 'ค้นหา' + codeCol.label + ', ' + nameCol.label + '...',
    searchKeys: ['code', 'name'],
    footnote: 'เฉพาะรายการที่ “เปิดใช้งาน” จะแสดงเป็นตัวเลือกในหน้าที่เกี่ยวข้อง · ปิดใช้งานแล้วข้อมูลเดิมยังคงอยู่',
    usage: props.usage,
    usageLabel: props.usageLabel,
    noNote: true,
    formWidth: extras.length > 1 ? 720 : 560,
    tableMin: 720 + extras.length * 120,
    blank: () => blank(),
    seed: () => {
      let base = null;
      try {
        const s = localStorage.getItem(storeKey);
        if (s) base = JSON.parse(s);
      } catch (e) {}
      return (base || seed).map((r, i) => ({
        ...r,
        id: r.id || storeKey + '-' + i,
        enabled: r.enabled !== false,
        updatedBy: r.updatedBy || 'มนตรี ศรีสุข',
        updatedAt: r.updatedAt || '2026-06-01 09:00'
      }));
    },
    cols: extras.map(c => ({
      label: c.label,
      th: { width: c.w || 140, textAlign: lkAlign(c) },
      td: { textAlign: lkAlign(c), ...(c.type === 'num' ? { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12 } : {}) },
      render: r => lkShow(c, r[c.key])
    })),
    formExtra: extras.length ? (f, set, { lbl, inp }) => {
      const h = React.createElement;
      return h("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } }, extras.map(c => {
        const id = 'lk-' + c.key;
        if (c.type === 'check') return h("label", { key: c.key, htmlFor: id, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', alignSelf: 'end', height: 32 } },
          h("input", { id: id, type: "checkbox", checked: !!f[c.key], onChange: e => set(c.key, e.target.checked) }), c.label);
        return h("div", { key: c.key },
          h("label", { style: lbl, htmlFor: id }, c.label),
          c.type === 'select' ? h("select", { id: id, className: "filter-select", style: { width: '100%', height: 32 }, value: f[c.key] ?? '', onChange: e => set(c.key, e.target.value) },
            (c.options || []).map(o => h("option", { key: o.v, value: o.v }, o.l)))
          : h("input", { id: id, style: { ...inp, ...(c.type === 'num' ? { textAlign: 'right', fontFamily: '"IBM Plex Mono", ui-monospace, monospace' } : {}) },
              type: c.type === 'num' ? 'number' : 'text', step: c.type === 'num' ? (c.decimals ? '0.01' : '1') : undefined,
              value: f[c.key] ?? '', placeholder: 'ระบุ' + c.label,
              onChange: e => set(c.key, c.type === 'num' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value) }));
      }));
    } : undefined
  };
};
function LkTable(props) {
  const cfg = React.useMemo(() => lkCfg(props), [props.storeKey]);
  return React.createElement(window.PcCodeNameConstPage, { cfg: cfg, onToast: props.onToast });
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
    title: "ประเภทคู่บัญชี (Keep)",
    module: "ค่าคงที่ประเภทรายการ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ประเภทรายการ \u2014 คู่บัญชีที่ใช้ทำรายการคืนใบเสร็จ",
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
    title: "รหัสรายการ (KeepItem)",
    module: "ค่าคงที่ประเภทรายการ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ประเภทรายการ \u2014 ประเภทการทำรายการจัดเก็บและลำดับในใบเสร็จ",
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
    title: "คำนำหน้านาม",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 คำนำหน้านาม คำย่อ และเพศ",
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
// สังกัดสมาชิก — ข้อมูลหลัก (ระดับบน) · ข้อกำหนดรายละเอียดสังกัดอ้างอิงรหัส/ชื่อจากเมนูนี้
const LK_MEMBER_AFFIL_PROPS = {
  title: "สังกัดสมาชิก",
  module: "ค่าคงที่ระบบสมาชิก",
  subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 รหัสและชื่อสังกัดของสมาชิก ใช้อ้างอิงในข้อกำหนดรายละเอียดสังกัด",
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
    name: 'บริษัท ไปรษณีย์ไทย จำกัด'
  }, {
    code: '002',
    name: 'บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)'
  }, {
    code: '003',
    name: 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด'
  }, {
    code: '004',
    name: 'สำนักงาน กสทช.'
  }, {
    code: '005',
    name: 'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม'
  }, {
    code: '999',
    name: '(ไม่ระบุ)'
  }],
  storeKey: "const_member_affil_v3",
  usageLabel: 'รายการในข้อกำหนดรายละเอียดสังกัด',
  usage: rec => window.pcAffilRefs ? window.pcAffilRefs(r => r.affilCode === rec.code).map(r => r.code + ' — ' + r.name) : []
};
function ConstMemberAffilPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    ...LK_MEMBER_AFFIL_PROPS,
    onToast: onToast
  });
}
// ตัวเลือกสังกัดสมาชิก (เรียงตามรหัส) — ใช้ในข้อกำหนดรายละเอียดสังกัด
window.pcMemberAffilOptions = () => {
  const cfg = lkCfg(LK_MEMBER_AFFIL_PROPS);
  let list = null;
  try {
    const s = localStorage.getItem(cfg.key);
    if (s) list = JSON.parse(s);
  } catch (e) {}
  return (list || cfg.seed()).slice().sort((x, y) => String(x.code).localeCompare(String(y.code)));
};
function ConstPositionPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(LkTable, {
    title: "ตำแหน่ง",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 รหัสและชื่อตำแหน่งของสมาชิก",
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
    title: "ประเภทการสมัคร",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 ประเภทการสมัครและค่าธรรมเนียมแรกเข้า",
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
    title: "ความสัมพันธ์ผู้รับโอนผลประโยชน์",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 ความสัมพันธ์ของผู้รับโอนผลประโยชน์",
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
    title: "สาเหตุการลาออก",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 สาเหตุการลาออกจากการเป็นสมาชิก",
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
    title: "ประเภทสมาชิก",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 ประเภทการเป็นสมาชิกตามหน่วยงานต้นสังกัด",
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
      name: 'ไม่ระบุ'
    }, {
      code: '001',
      name: 'ปณท.'
    }, {
      code: '002',
      name: 'กสท.'
    }, {
      code: '003',
      name: 'กสทช.'
    }, {
      code: '004',
      name: 'เกษียณส่วนกลาง'
    }, {
      code: '005',
      name: 'เกษียณส่วนภูมิภาค'
    }, {
      code: '006',
      name: 'ฌปท.'
    }, {
      code: '007',
      name: 'สอ.กสท'
    }, {
      code: '008',
      name: 'สหกรณ์ร้านค้า'
    }, {
      code: '009',
      name: 'สมาชิกสมทบ'
    }, {
      code: '010',
      name: 'ปณทดบ'
    }],
    storeKey: "const_member_type_v4",
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
    title: "รหัสรายการ (ShrItem)",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 ประเภทการทำรายการหุ้นและรหัสกระทบ",
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
    title: "สถานะการเป็นสมาชิก",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 รหัสสถานะสมาชิกและกลุ่มสถานะ",
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
    title: "หมายเหตุสถานะ",
    module: "ค่าคงที่ระบบสมาชิก",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 ค่าคงที่ระบบสมาชิก \u2014 หมายเหตุประกอบสถานะสมาชิก",
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