// ═════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ค่าคงที่ — ข้อกำหนดรายละเอียดสังกัด
//  ตารางค่าคงที่หน่วยงาน/สังกัด : รหัสหน่วยงาน · ชื่อหน่วยงาน · รหัสเขต ·
//  ลูกหนี้ตัวแทน · ภูมิภาคสังกัด · แผ่นจัดเก็บ · รหัสที่อยู่ · การจ่ายปันผล
//  · เพิ่ม/แก้ไข/ดู ผ่าน drawer ขวา · เลือกเขตใช้งาน/ไม่ใช้งาน (เดี่ยว+ชุด)
//  · ตัวกรอง + การ์ดสรุป + ตาราง + แบ่งหน้า
//  โครงสร้าง/สไตล์อิงเมนู "สังกัดปันผลเฉลี่ยคืน" (ใช้คลาส da-* ร่วมกัน)
// ═════════════════════════════════════════════════════════════════

const AD_USER = window.LOGIN_USER.name;

// ─── ตัวเลือก ภูมิภาคสังกัด / แผ่นจัดเก็บ (ตามระบบเดิม) ─────────────
window.AD_REGIONS = [...Array.from({
  length: 10
}, (_, i) => ({
  v: String(i + 1),
  l: 'เขต ' + (i + 1)
})), {
  v: 'PN-N',
  l: 'ปน.เหนือ'
}, {
  v: 'PN-S',
  l: 'ปน.ใต้'
}, {
  v: 'DIV-THP',
  l: 'ฝ่าย ปณท.'
}, {
  v: 'DIV-CAT',
  l: 'ฝ่าย กสท.'
}, {
  v: 'NBTC',
  l: 'กสทช.'
}, {
  v: 'RET-R',
  l: 'เกษียณส่วนภูมิภาค'
}, {
  v: 'RET-C',
  l: 'เกษียณส่วนกลาง'
}, {
  v: 'OTHER',
  l: 'หน่วยงานอื่น ๆ'
}];
window.AD_DISK_TYPES = ['ETC', 'ก.ดิจ', 'กสท', 'กสทช', 'ปณท', 'ปณทดบ', 'สอ.ร', 'สอกสท'].map(x => ({
  v: x,
  l: x
}));
// แปลงข้อมูลเดิม: แผ่นจัดเก็บแบบเก่า → รหัสกลุ่ม · เติมรหัสสังกัดจากชื่อสังกัด
const adAffilCodeOf = org => {
  const i = (window.AD_ORGS || []).indexOf(org);
  return i >= 0 ? String(i + 1).padStart(2, '0') : '';
};
// ลูกหนี้ตัวแทน — ดึงจากเมนู ประมวลผลและจัดเก็บ › กำหนดสังกัดลูกหนี้ตัวแทน
const adAgentSrc = () => typeof pcxAaLoad === 'function' ? pcxAaLoad() || [] : [];
window.adAgentOptions = () => adAgentSrc().filter(a => a.code && a.enabled !== false).map(a => ({
  v: a.code,
  l: a.code + ' · ' + a.name
}));
window.adAgentLabel = v => {
  if (!v) return '';
  const a = adAgentSrc().find(x => x.code === v);
  return a ? a.code + ' · ' + a.name : v;
};
// รหัสสังกัดต้องไม่ซ้ำ — ข้อมูลเดิมที่ว่าง/ซ้ำ จะได้รหัสถัดไปที่ยังไม่ถูกใช้
// สังกัด (ระดับบน) จากเมนู ค่าคงที่ระบบสมาชิก › สังกัดสมาชิก
const adMemberAffils = () => window.pcMemberAffilOptions ? window.pcMemberAffilOptions() : [];
const adAffilLink = r => {
  const opts = adMemberAffils();
  // ข้อมูลเดิม: affilCode เคยเป็นรหัสประจำแถว → ย้ายไปเป็น seq
  const seq = r.seq !== undefined ? r.seq : r.affilCode || '';
  let a = r.seq !== undefined ? opts.find(o => o.code === r.affilCode) : null;
  if (!a) a = opts.find(o => o.name === r.org);
  return {
    seq,
    affilCode: a ? a.code : r.seq !== undefined ? r.affilCode || '' : '',
    org: a ? a.name : r.org || ''
  };
};
const adUniqueCodes = list => {
  const seen = new Set();
  const used = new Set(list.map(r => r.seq).filter(Boolean));
  let n = 1;
  const nextFree = () => {
    let c;
    do c = String(n++).padStart(2, '0'); while (used.has(c));
    used.add(c);
    return c;
  };
  return list.map(r => {
    let c = r.seq;
    if (!c || seen.has(c)) c = nextFree();
    seen.add(c);
    return c === r.seq ? r : {
      ...r,
      seq: c
    };
  });
};
const adMigrate = list => adUniqueCodes(list.map((r, idx) => {
  const ags = adAgentSrc();
  let agent = r.agent;
  if (ags.length && !ags.some(a => a.code === agent)) agent = ags[idx % ags.length].code;
  let disk = r.disk;
  if (disk && !window.AD_DISK_TYPES.some(o => o.v === disk)) disk = /ไปรษณีย์/.test(r.org || '') ? 'ปณท' : /โทรคมนาคม/.test(r.org || '') ? 'กสท' : 'สอกสท';
  return {
    ...r,
    disk,
    agent,
    on: r.on !== false,
    ...adAffilLink(r)
  };
}));

// รายการสังกัดหลังแปลงข้อมูลเดิม — ใช้ตรวจการอ้างอิงจากเมนูค่าคงที่อื่น
window.adList = () => adMigrate(window.adLoad());

// ─── ป้ายการจ่ายปันผล ────────────────────────────────────────────────
function AdDivChip({
  v
}) {
  const t = window.adDividend(v);
  return /*#__PURE__*/React.createElement("span", {
    className: 'chip ' + t.chip
  }, t.l);
}

// ════════════════════════════════════════════════════════════════════
//  Drawer — เพิ่ม / แก้ไข / ดูรายละเอียด สังกัด
// ════════════════════════════════════════════════════════════════════
function AdDrawer({
  mode,
  record,
  existing,
  onClose,
  onSubmit
}) {
  const view = mode === 'view';
  const isEdit = mode === 'edit';
  const [code, setCode] = useState(record ? record.code : '');
  const [name, setName] = useState(record ? record.name : '');
  const [zone, setZone] = useState(record ? record.zone : '');
  const [agent, setAgent] = useState(record ? record.agent || '' : '');
  const [region, setRegion] = useState(record ? record.region || '' : '');
  const [disk, setDisk] = useState(record ? record.disk || '' : '');
  const [addr, setAddr] = useState(record ? record.addr || '' : '');
  const [div] = useState(record ? record.div || '' : ''); // ช่องการจ่ายปันผลเอาออกจากฟอร์มแล้ว (คงค่าเดิมไว้)
  const [org, setOrg] = useState(record ? record.org || '' : '');
  const [affilCode, setAffilCode] = useState(record ? record.affilCode || '' : '');
  const [seq, setSeq] = useState(record ? record.seq || '' : (() => {
    const nums = (existing || []).map(x => Number(x.seq)).filter(n => !isNaN(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, '0');
  })());
  const affils = React.useMemo(adMemberAffils, []);
  const pickAffil = v => {
    const a = affils.find(x => x.code === v);
    setAffilCode(v);
    setOrg(a ? a.name : '');
    setError('');
  };
  const [dept, setDept] = useState(record ? record.dept || '' : '');
  const [section, setSection] = useState(record ? record.section || '' : '');
  const [address, setAddress] = useState(record ? record.address || '' : '');
  const [on, setOn] = useState(record ? !!record.on : true);
  const [note, setNote] = useState(record ? record.note || '' : '');
  const [error, setError] = useState('');
  // ตัวเลือกจากเมนูค่าคงที่ "หน่วยงาน" และ "รหัสเขต"
  const units = React.useMemo(() => window.pcUnitOptions ? window.pcUnitOptions() : [], []);
  const zones = React.useMemo(() => window.pcZoneOptions ? window.pcZoneOptions() : [], []);
  const usedCodes = (existing || []).filter(x => !record || x.id !== record.id).map(x => x.code);
  const pickUnit = v => {
    const u = units.find(x => x.code === v);
    setCode(v);
    setName(u ? u.name : '');
    setError('');
  };
  const validate = () => {
    if (!affilCode) return 'กรุณาเลือกรหัสสังกัด';
    const c = code.trim();
    if (!c) return 'กรุณาระบุรหัสหน่วยงาน';
    if (c.length < 3) return 'รหัสหน่วยงานต้องมีอย่างน้อย 3 หลัก';
    if ((existing || []).some(x => x.affilCode === affilCode && x.code === c && (!isEdit || x.id !== record.id))) return `สังกัด ${affilCode} กับหน่วยงาน ${c} มีอยู่แล้วในระบบ — ห้ามซ้ำ`;
    if (!name.trim()) return 'กรุณาระบุชื่อหน่วยงาน';
    if (!zone.trim()) return 'กรุณาระบุรหัสเขต';
    if (!region) return 'กรุณาเลือกภูมิภาคสังกัด';
    if (!agent) return 'กรุณาเลือกลูกหนี้ตัวแทน';
    return '';
  };
  const handle = again => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    onSubmit({
      vals: {
        code: code.trim(),
        name: name.trim(),
        zone: zone.trim(),
        agent: agent.trim(),
        region,
        disk,
        addr: addr.trim(),
        div,
        on: isEdit ? on : true,
        note: note.trim(),
        org: org.trim(),
        affilCode,
        seq: String(seq).trim(),
        dept: dept.trim(),
        section: section.trim(),
        address: address.trim()
      },
      again
    });
    if (again) {
      setCode('');
      setName('');
      setZone('');
      setAgent('');
      setRegion('');
      setDisk('');
      setAddr('');
      setOn(true);
      setNote('');
      setError('');
      setOrg('');
      setDept('');
      setSection('');
      setAddress('');
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card da-modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "da-modal-title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-drawer-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: view ? 'eye' : isEdit ? 'edit' : 'plus'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    id: "da-modal-title"
  }, view ? 'รายละเอียดสังกัด' : isEdit ? 'แก้ไขข้อมูลสังกัด' : 'เพิ่มสังกัด'), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, view ? 'ดูข้อกำหนดรายละเอียดสังกัด/หน่วยงาน' : 'ค่าคงที่หน่วยงานสำหรับประมวลผลเรียกเก็บและจัดเก็บข้อมูล')), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose,
    "aria-label": "ปิด"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body da-form"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "รหัสสังกัด ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), view ? /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    value: affilCode,
    readOnly: true
  }) : /*#__PURE__*/React.createElement("select", {
    className: "filter-select mono",
    style: {
      width: '100%'
    },
    "aria-label": "รหัสสังกัด",
    value: affilCode,
    onChange: e => pickAffil(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "เลือกรหัสสังกัด"), affils.filter(a => a.enabled !== false || a.code === affilCode).map(a => /*#__PURE__*/React.createElement("option", {
    key: a.code,
    value: a.code
  }, a.code)))), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ชื่อสังกัด ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input icr-ro",
    value: org,
    readOnly: true,
    tabIndex: -1,
    placeholder: "แสดงอัตโนมัติจากรหัสสังกัด"
  }), !view && /*#__PURE__*/React.createElement("div", {
    className: "da-hint"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 11
  }), " ชื่อสังกัดแสดงจากรหัสสังกัดที่เลือก \xB7 เพิ่ม/แก้ไขได้ที่เมนู ค่าคงที่ระบบสมาชิก \u203A สังกัดสมาชิก"))), /*#__PURE__*/React.createElement("div", {
    className: "da-field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "รหัสหน่วยงาน ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), view || isEdit ? /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    value: code,
    readOnly: true
  }) : /*#__PURE__*/React.createElement("select", {
    className: "filter-select mono",
    style: {
      width: '100%'
    },
    "aria-label": "รหัสหน่วยงาน",
    value: code,
    onChange: e => pickUnit(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "เลือกรหัสหน่วยงาน"), units.filter(u => u.enabled !== false || u.code === code).map(u => /*#__PURE__*/React.createElement("option", {
    key: u.code,
    value: u.code
  }, u.code))), isEdit && /*#__PURE__*/React.createElement("div", {
    className: "da-hint"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 11
  }), " รหัสหน่วยงานเป็นรหัสอ้างอิงหลัก แก้ไขไม่ได้หลังสร้าง")), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ชื่อหน่วยงาน ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input icr-ro",
    value: name,
    readOnly: true,
    tabIndex: -1,
    placeholder: "แสดงอัตโนมัติจากรหัสหน่วยงาน"
  }), !view && /*#__PURE__*/React.createElement("div", {
    className: "da-hint"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 11
  }), " ชื่อหน่วยงานแสดงจากรหัสหน่วยงานที่เลือก · เพิ่ม/แก้ไขได้ที่เมนู ค่าคงที่ \u203A หน่วยงาน"))), /*#__PURE__*/React.createElement("div", {
    className: "da-field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ฝ่ายสังกัด"), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: dept,
    maxLength: 120,
    readOnly: view,
    placeholder: "เช่น ฝ่ายบริหารทั่วไป",
    onChange: e => setDept(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ส่วนสังกัด"), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    value: section,
    maxLength: 120,
    readOnly: view,
    placeholder: "เช่น ส่วนธุรการ",
    onChange: e => setSection(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "da-field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "รหัสเขต ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), view ? /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    value: zone,
    readOnly: true
  }) : /*#__PURE__*/React.createElement("select", {
    className: "filter-select mono",
    style: {
      width: '100%'
    },
    "aria-label": "รหัสเขต",
    value: zone,
    onChange: e => {
      setZone(e.target.value);
      setError('');
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "เลือกรหัสเขต"), zones.filter(z => z.enabled !== false || z.code === zone).map(z => /*#__PURE__*/React.createElement("option", {
    key: z.code,
    value: z.code
  }, z.code)))), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ภูมิภาคสังกัด ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), view ? /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 6
    }
  }, region ? window.adRegion(region).l : /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")) : /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: region,
    onChange: e => {
      setRegion(e.target.value);
      setError('');
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "เลือกภูมิภาคสังกัด"), window.AD_REGIONS.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l))))), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ลูกหนี้ตัวแทน ", /*#__PURE__*/React.createElement("span", {
    className: "cfg-required"
  }, "*")), view ? /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 2
    }
  }, agent ? window.adAgentLabel(agent) : /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")) : /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: agent,
    onChange: e => setAgent(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "เลือกลูกหนี้ตัวแทน"), window.adAgentOptions().map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l)), agent && !window.adAgentOptions().some(o => o.v === agent) && /*#__PURE__*/React.createElement("option", {
    value: agent
  }, agent))), /*#__PURE__*/React.createElement("div", {
    className: "da-field-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "แผ่นจัดเก็บ"), view ? /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 6
    }
  }, window.adDiskType(disk) ? window.adDiskType(disk).l : disk || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")) : /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    style: {
      width: '100%'
    },
    value: disk,
    onChange: e => setDisk(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "เลือกแผ่นจัดเก็บ"), window.AD_DISK_TYPES.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.v,
    value: o.v
  }, o.l)))), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "รหัสที่อยู่"), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    value: addr,
    maxLength: 10,
    readOnly: view,
    placeholder: "เช่น 10200",
    onChange: e => setAddr(e.target.value.replace(/\D/g, ''))
  }))), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "ที่อยู่สังกัด"), /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 3,
    value: address,
    maxLength: 300,
    readOnly: view,
    placeholder: "เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์",
    onChange: e => setAddress(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "da-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "da-label"
  }, "หมายเหตุ"), /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 2,
    value: note,
    maxLength: 255,
    readOnly: view,
    placeholder: "ระบุหมายเหตุ (ถ้ามี)",
    onChange: e => setNote(e.target.value)
  })), error && /*#__PURE__*/React.createElement("div", {
    className: "dep-error",
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 13
  }), " ", error)), !view && /*#__PURE__*/React.createElement("div", {
    className: "da-modal-foot"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: onClose
  }, view ? 'ปิด' : 'ยกเลิก'), !view && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary",
    onClick: () => handle(false)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " ", isEdit ? 'บันทึกการแก้ไข' : 'บันทึก'))));
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function AffilDetailConfigPage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  const [list, setList] = useState(() => adMigrate(window.adLoad()));
  const [confirm, setConfirm] = useState(null); // { rec, next } ยืนยันเปิด/ปิดใช้งาน
  const blank = {
    q: '',
    name: ''
  };
  const [crit, setCrit] = useState(blank);
  const [applied, setApplied] = useState(blank);
  const [drawer, setDrawer] = useState(null); // {mode, record}
  const [sel, setSel] = useState({}); // {id: true}
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const persist = next => {
    setList(next);
    window.adSave(next);
  };
  const MODULE = 'ประมวลผลและจัดเก็บ — ข้อกำหนดรายละเอียดสังกัด';

  // สรุปยอด
  const total = list.length;
  const onCnt = list.filter(r => r.on).length;
  const offCnt = total - onCnt;

  // กรอง + เรียงตามรหัส
  const filtered = useMemo(() => list.filter(r => {
    if (applied.name && r.name !== applied.name) return false;
    const t = applied.q.trim().toLowerCase();
    if (!t) return true;
    return [r.affilCode, r.zone, r.org].filter(Boolean).some(s => String(s).toLowerCase().includes(t));
  }).sort((a, b) => String(a.affilCode || '').localeCompare(String(b.affilCode || '')) || String(a.code).localeCompare(String(b.code))), [list, applied]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);
  const fUnits = React.useMemo(() => window.pcUnitOptions ? window.pcUnitOptions() : [], []);
  const fZones = React.useMemo(() => window.pcZoneOptions ? window.pcZoneOptions() : [], []);
  const runSearch = () => {
    setApplied(crit);
    setPage(1);
  };
  const clearSearch = () => {
    setCrit(blank);
    setApplied(blank);
    setPage(1);
  };
  const setC = (k, v) => setCrit(p => ({
    ...p,
    [k]: v
  }));

  // ── CRUD ──
  const submit = ({
    vals,
    again
  }) => {
    const m = drawer.mode;
    if (m === 'edit') {
      const rec = drawer.record;
      persist(list.map(x => x.id === rec.id ? {
        ...x,
        ...vals
      } : x));
      audit.log && audit.log({
        action: 'update',
        module: MODULE,
        target: `${vals.code} · ${vals.name}`,
        summary: `แก้ไขสังกัด “${vals.name}”`
      });
      onToast && onToast(`บันทึกการแก้ไขสังกัด “${vals.name}” เรียบร้อยแล้ว`);
      setDrawer(null);
    } else {
      const rec = {
        id: window.adUid(),
        ...vals,
        inUse: false
      };
      persist([...list, rec]);
      audit.log && audit.log({
        action: 'create',
        module: MODULE,
        target: `${vals.code} · ${vals.name}`,
        summary: `เพิ่มสังกัด “${vals.name}”`,
        changes: [{
          field: 'รหัสหน่วยงาน',
          before: '—',
          after: vals.code
        }, {
          field: 'รหัสเขต',
          before: '—',
          after: vals.zone
        }]
      });
      onToast && onToast(`เพิ่มสังกัด “${vals.name}” (${vals.code}) เรียบร้อยแล้ว`);
      if (!again) setDrawer(null);
    }
  };
  const applyToggle = () => {
    const r = confirm.rec;
    setConfirm(null);
    persist(list.map(x => x.id === r.id ? {
      ...x,
      on: !x.on
    } : x));
    audit.log && audit.log({
      action: 'update',
      module: MODULE,
      target: `${r.code} · ${r.name}`,
      summary: `${r.on ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}เขตของสังกัด “${r.name}”`
    });
    onToast && onToast(`${r.on ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}เขต “${r.name}” แล้ว`);
  };

  // ── เลือกหลายรายการ ──
  const selIds = Object.keys(sel).filter(k => sel[k]);
  const allOnPage = pageRows.length > 0 && pageRows.every(r => sel[r.id]);
  const toggleAll = () => {
    setSel(s => {
      const n = {
        ...s
      };
      if (allOnPage) pageRows.forEach(r => {
        delete n[r.id];
      });else pageRows.forEach(r => {
        n[r.id] = true;
      });
      return n;
    });
  };
  const bulkSetEnabled = val => {
    persist(list.map(x => selIds.includes(x.id) ? {
      ...x,
      on: val
    } : x));
    onToast && onToast(`${val ? 'เปิด' : 'ปิด'}ใช้งานเขต ${selIds.length} รายการแล้ว`);
    setSel({});
  };
  const hasFilter = !!(applied.q || applied.name);
  const startN = filtered.length === 0 ? 0 : (curPage - 1) * pageSize + 1;
  const endN = Math.min(curPage * pageSize, filtered.length);
  const pageNums = useMemo(() => {
    const out = [];
    const span = 2;
    for (let p = 1; p <= pageCount; p++) {
      if (p === 1 || p === pageCount || p >= curPage - span && p <= curPage + span) out.push(p);else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }, [pageCount, curPage]);
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "หน้าข้อกำหนดรายละเอียดสังกัด"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-actions"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      whiteSpace: 'nowrap'
    }
  }, "ข้อกำหนดรายละเอียดสังกัด"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 2,
      maxWidth: 820
    }
  }, "กำหนดหน่วยงาน/สังกัดสำหรับการประมวลผล \u2014 สังกัด ฝ่าย ส่วน ภูมิภาค รหัสหน่วยงาน รหัสเขต ลูกหนี้ตัวแทน แผ่นจัดเก็บ และที่อยู่สังกัด \xB7 เลือกได้ว่าเขตใดใช้งานอยู่หรือไม่ใช้งานแล้ว")), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => onToast && onToast('นำเข้าข้อมูลสังกัด (สาธิต)')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 13
  }), " นำเข้า"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => onToast && onToast('ส่งออกข้อมูลสังกัด (สาธิต)')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  }), " ส่งออก"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: () => setDrawer({
      mode: 'add',
      record: null
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 13
  }), " เพิ่มสังกัด")), /*#__PURE__*/React.createElement("div", {
    className: "search-card da-unified"
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
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "ค้นหา"), /*#__PURE__*/React.createElement("label", {
    className: "sh-search-input",
    style: {
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  }), /*#__PURE__*/React.createElement("input", {
    "aria-label": "ค้นหา",
    value: crit.q,
    placeholder: "รหัสสังกัด / รหัสเขต / ชื่อสังกัด",
    onKeyDown: e => e.key === 'Enter' && runSearch(),
    onChange: e => setC('q', e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 1 260px',
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontSize: 12,
      color: 'var(--text-muted)',
      marginBottom: 4
    }
  }, "ชื่อหน่วยงาน"), /*#__PURE__*/React.createElement("select", {
    className: "filter-select",
    "aria-label": "ชื่อหน่วยงาน",
    style: {
      width: '100%',
      height: 32
    },
    value: crit.name,
    onChange: e => setC('name', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "ทั้งหมด"), fUnits.map(u => /*#__PURE__*/React.createElement("option", {
    key: u.code,
    value: u.name
  }, u.name)))), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn primary",
    onClick: runSearch
  }, "ค้นหา"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: clearSearch
  }, "รีเซ็ต")), /*#__PURE__*/React.createElement("div", {
    className: "da-table-area"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      border: 0,
      borderRadius: 0,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl da-tbl",
    style: {
      minWidth: 1900
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 96
    }
  }, "รหัสสังกัด"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "ชื่อสังกัด"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "ชื่อหน่วยงาน"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 200
    }
  }, "ฝ่ายสังกัด"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 170
    }
  }, "ส่วนสังกัด"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 72
    }
  }, "รหัสเขต"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 200
    }
  }, "ลูกหนี้ตัวแทน"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 140
    }
  }, "ภูมิภาคสังกัด"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 100
    }
  }, "แผ่นจัดเก็บ"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 84
    }
  }, "รหัสที่อยู่"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 112
    }
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 80
    }
  }, "ใช้งาน"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 92
    },
    "aria-label": "การจัดการ"
  }))), /*#__PURE__*/React.createElement("tbody", null, pageRows.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 13,
    className: "empty-state",
    style: {
      padding: '36px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 24
  })), hasFilter ? 'ไม่พบสังกัดที่ตรงกับเงื่อนไข' : 'ยังไม่มีข้อมูลสังกัด — กดปุ่ม “เพิ่มสังกัด” เพื่อเริ่มต้น')) : pageRows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    className: r.on ? '' : 'da-off'
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, r.affilCode || '\u2014')), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: 12.5
    }
  }, r.org || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "da-detail"
  }, r.name)), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: 12.5
    }
  }, r.dept || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: 12.5
    }
  }, r.section || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, r.zone), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: 12
    }
  }, r.agent ? window.adAgentLabel(r.agent) : /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", null, r.region ? window.adRegion(r.region).l : /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: 12
    }
  }, window.adDiskType(r.disk) ? window.adDiskType(r.disk).l : r.disk || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, r.addr || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, r.on ? /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, "เปิดใช้งาน") : /*#__PURE__*/React.createElement("span", {
    className: "pill neutral"
  }, "ปิดใช้งาน")), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lt-switch" + (r.on ? ' on' : ''),
    role: "switch",
    "aria-checked": !!r.on,
    "aria-label": (r.on ? 'ปิดใช้งาน ' : 'เปิดใช้งาน ') + r.name,
    onClick: () => setConfirm({
      rec: r,
      next: !r.on
    })
  }, /*#__PURE__*/React.createElement("span", {
    className: "lt-switch-knob"
  }))), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn sm da-edit-btn",
    "aria-label": 'แก้ไข ' + r.name,
    onClick: () => setDrawer({
      mode: 'edit',
      record: r
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  }), " แก้ไข"))))))), /*#__PURE__*/React.createElement("div", {
    className: "sh-pager"
  }, /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, filtered.length === 0 ? '0 รายการ' : startN + '-' + endN + ' จาก ' + filtered.length + ' รายการ'), /*#__PURE__*/React.createElement("div", {
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
  }, "\u2039"), pageNums.map((p, i) => p === '…' ? /*#__PURE__*/React.createElement("span", {
    key: 'e' + i,
    className: "muted"
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
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
    value: pageSize,
    "aria-label": "จำนวนต่อหน้า",
    onChange: e => {
      setPageSize(Number(e.target.value));
      setPage(1);
    }
  }, [20, 50, 100].map(n => /*#__PURE__*/React.createElement("option", {
    key: n,
    value: n
  }, n, " / หน้า"))))))), /*#__PURE__*/React.createElement("div", {
    className: "lt-list-foot muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 12
  }), " ค่าคงที่นี้ใช้ในการประมวลผลเรียกเก็บประจำเดือน \xB7 จัดเก็บข้อมูล (แผ่นจัดเก็บ) \xB7 และการจ่ายปันผลตามหน่วยงาน \u2014 เปิด/ปิดใช้งานได้ที่สวิตช์ในคอลัมน์ใช้งาน"), confirm && window.ToggleConfirmModal && /*#__PURE__*/React.createElement(window.ToggleConfirmModal, {
    next: confirm.next,
    title: (confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งานสังกัด',
    subtitle: (confirm.rec.affilCode || '') + ' · ' + (confirm.rec.org || '') + ' · ' + confirm.rec.name,
    detail: confirm.next ? 'เปิดใช้งาน “' + confirm.rec.name + '” — นำไปใช้ในการประมวลผลเรียกเก็บและจัดเก็บรอบถัดไป' : 'ปิดใช้งาน “' + confirm.rec.name + '” — ไม่นำไปใช้ในการประมวลผลรอบถัดไป (ข้อมูลเดิมไม่กระทบ)',
    onCancel: () => setConfirm(null),
    onConfirm: applyToggle
  }), drawer && /*#__PURE__*/React.createElement(AdDrawer, {
    mode: drawer.mode,
    record: drawer.record,
    existing: list,
    onClose: () => setDrawer(null),
    onSubmit: submit
  }));
}
Object.assign(window, {
  AffilDetailConfigPage
});