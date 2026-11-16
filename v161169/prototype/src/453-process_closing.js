// ════════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ประมวลผล  (Level 2)
//  11 หน้าจอ:
//    · ปิดงานประจำวัน                (process/day-close-run)
//    · ปิดงานประจำเดือน               (process/month-close-run)
//    · ปิดสิ้นปี                      (process/year-close-run)
//    · จัดทำหนังสือยืนยันยอด           (process/balance-confirm)
//    · จัดทำหนี้สั้นยาว                (process/debt-term)
//    · ประมวลผลปรับอัตราดอกเบี้ย        (process/rate-adjust)
//    · ประมวลผลหุ้นของขวัญ             (process/gift-share)
//    · ตัดยอดรายการหุ้นของขวัญ          (process/gift-share-cut)
//    · ประมวลผลปิดสิ้นปี (หนี้)          (process/year-close-debt)
//    · ประมวลผลปิดสิ้นปี (หุ้น)          (process/year-close-share)
//    · ค่าเบี้ยประชุมค้างจ่าย            (process/meeting-fee)
//  ทุกหน้าแสดง "ผลการประมวลผล" — จำนวนเคสทั้งหมด / สำเร็จ / ไม่ผ่าน + รายการ
// ════════════════════════════════════════════════════════════════════

const clToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const clBE = () => new Date().getFullYear() + 543;
const clMoney = (v, d) => window.fmt.money(Number(v) || 0, d === undefined ? 2 : d);
const clAudit = () => React.useContext(window.AuditContext || React.createContext({
  log: () => {}
}));
const CL_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
function ClFld({
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
    width: w || 170
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
function ClRO({
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
function ClHead({
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
    name: icon || 'receipt',
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "icr-form-actions"
  }, actions));
}
function ClSec({
  title,
  hint,
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
  }), /*#__PURE__*/React.createElement("h3", null, title)), children, hint && /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 8
    }
  }, hint));
}
function ClCheck({
  checked,
  onChange,
  label,
  note
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      fontSize: 13,
      cursor: 'pointer',
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: !!checked,
    onChange: e => onChange(e.target.checked),
    style: {
      marginTop: 3,
      accentColor: 'var(--primary)'
    }
  }), /*#__PURE__*/React.createElement("span", null, label, note && /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, " \u2014 ", note)));
}
function ClNotes({
  title,
  items
}) {
  return /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingInlineStart: 20,
      fontSize: 12.5,
      lineHeight: 1.85,
      color: 'var(--text-muted)'
    }
  }, items.map((t, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, t)));
}

// ─── สร้างผลการประมวลผล (สรุปเคส + รายการที่ไม่ผ่าน) ─────────────────
function clRun(spec) {
  // spec: { steps: [{label, total, failed, reason}], no }
  const steps = spec.steps.map(s => ({
    ...s,
    ok: s.total - s.failed
  }));
  const total = steps.reduce((a, s) => a + s.total, 0);
  const failed = steps.reduce((a, s) => a + s.failed, 0);
  const fails = [];
  steps.forEach(s => {
    for (let i = 0; i < s.failed; i++) {
      const seq = fails.length + 1;
      fails.push({
        no: seq,
        step: s.label,
        memberCode: String(19500 + seq * 137).padStart(6, '0'),
        name: CL_FAIL_NAMES[(seq - 1) % CL_FAIL_NAMES.length],
        ref: s.refPrefix ? `${s.refPrefix}${String(seq).padStart(4, '0')}` : '—',
        reason: Array.isArray(s.reason) ? s.reason[(seq - 1) % s.reason.length] : s.reason
      });
    }
  });
  return {
    no: spec.no,
    at: new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' น.',
    steps,
    total,
    failed,
    ok: total - failed,
    fails
  };
}
const CL_FAIL_NAMES = ['นายทองชัย ทั่วยะบัตร', 'นางสาวพิมพ์ใจ ธนวัฒน์', 'นายประสิทธิ์ สุวรรณมาลี', 'นางบุญชวน หิรัญวัฒนะ', 'นายสุขัด มหาพรหม', 'นางสาวกานต์ ศิริวงศ์', 'นายวิเชียร หน่อเพ็ชร์', 'นายอนุชา สุขสวัสดิ์'];
function ClStat({
  label,
  value,
  tone
}) {
  const color = tone === 'bad' ? 'var(--error, #ff4d4f)' : tone === 'ok' ? 'var(--brand-700, #237450)' : 'var(--text)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 0',
      minWidth: 150,
      padding: '12px 14px',
      borderRadius: 8,
      background: 'var(--surface-muted, #FAFAFA)',
      border: '1px solid var(--border-light, #F0F0F0)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color,
      marginTop: 2
    }
  }, value));
}

// ─── แผงผลการประมวลผล (ใช้ทุกหน้า) ────────────────────────────────
function ClResult({
  result,
  unit
}) {
  if (!result) return null;
  const u = unit || 'เคส';
  return /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
    style: {
      marginTop: 12
    },
    hint: `เลขที่การประมวลผล ${result.no} · เวลา ${result.at}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E33\u0E25\u0E2D\u0E07 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E08\u0E23\u0E34\u0E07")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(ClStat, {
    label: `จำนวนที่ทำรายการทั้งหมด (${u})`,
    value: window.fmt.money(result.total, 0)
  }), /*#__PURE__*/React.createElement(ClStat, {
    label: `ประมวลผลสำเร็จ (${u})`,
    value: window.fmt.money(result.ok, 0),
    tone: "ok"
  }), /*#__PURE__*/React.createElement(ClStat, {
    label: `ไม่ผ่านการประมวลผล (${u})`,
    value: window.fmt.money(result.failed, 0),
    tone: result.failed ? 'bad' : undefined
  })), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 14,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 240
    }
  }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 110
    }
  }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 110
    }
  }, "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 110
    }
  }, "\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 110
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), /*#__PURE__*/React.createElement("tbody", null, result.steps.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.label
  }, /*#__PURE__*/React.createElement("td", null, s.label), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(s.total, 0)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(s.ok, 0)), /*#__PURE__*/React.createElement("td", {
    className: "num mono",
    style: s.failed ? {
      color: 'var(--error, #ff4d4f)',
      fontWeight: 600
    } : undefined
  }, window.fmt.money(s.failed, 0)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + (s.failed ? 'warn' : 'ok')
  }, s.failed ? 'มีรายการไม่ผ่าน' : 'สำเร็จทั้งหมด')))), /*#__PURE__*/React.createElement("tr", {
    style: {
      fontWeight: 700,
      background: 'var(--surface-muted, #FAFAFA)'
    }
  }, /*#__PURE__*/React.createElement("td", null, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E34\u0E49\u0E19"), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(result.total, 0)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(result.ok, 0)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, window.fmt.money(result.failed, 0)), /*#__PURE__*/React.createElement("td", null))))), /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 (", window.fmt.money(result.failed, 0), " ", u, ")")), result.fails.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 13,
      padding: '10px 0'
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25") : /*#__PURE__*/React.createElement("div", {
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
      width: 56
    }
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 110
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 200
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 170
    }
  }, "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 120
    }
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 260
    }
  }, "\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19"))), /*#__PURE__*/React.createElement("tbody", null, result.fails.map(f => /*#__PURE__*/React.createElement("tr", {
    key: f.no
  }, /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, f.no), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, f.memberCode), /*#__PURE__*/React.createElement("td", null, f.name), /*#__PURE__*/React.createElement("td", null, f.step), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, f.ref), /*#__PURE__*/React.createElement("td", {
    style: {
      color: 'var(--error, #ff4d4f)'
    }
  }, f.reason)))))));
}
function ClRunBtn({
  label,
  onClick,
  disabled
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: onClick,
    disabled: disabled
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " ", label);
}

// ════════════════════════════════════════════════════════════════════
//  ① ปิดงานประจำวัน
// ════════════════════════════════════════════════════════════════════
function DayCloseRunPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [date, setDate] = useState(clToday());
  const [result, setResult] = useState(null);
  const run = () => {
    const r = clRun({
      no: `DC${clBE().toString().slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps: [{
        label: 'ตรวจสอบรายการค้างประจำวัน',
        total: 412,
        failed: 0
      }, {
        label: 'ปิดยอดเคาน์เตอร์ (รับ-จ่าย)',
        total: 268,
        failed: 2,
        refPrefix: 'RCV-',
        reason: ['ใบเสร็จยังไม่ผ่านการอนุมัติ', 'ยอดเงินสดไม่ตรงกับใบนำส่ง']
      }, {
        label: 'ปิดยอดเงินฝาก',
        total: 1904,
        failed: 3,
        refPrefix: 'DEP-',
        reason: ['บัญชีถูกอายัด ไม่สามารถปิดยอดได้', 'รายการฝากซ้ำในวันเดียวกัน']
      }, {
        label: 'ปิดยอดหุ้น–หนี้',
        total: 1355,
        failed: 1,
        refPrefix: 'LON-',
        reason: 'สัญญาอยู่ระหว่างแก้ไขรายละเอียด'
      }, {
        label: 'บันทึกบัญชีสิ้นวัน',
        total: 96,
        failed: 0
      }]
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ปิดงานประจำวัน',
      target: `วันที่ ${window.fmt.date(date)}`,
      summary: `${r.no} · ปิดงานสิ้นวัน ${r.total} เคส · สำเร็จ ${r.ok} · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ปิดงานสิ้นวัน ${window.fmt.date(date)} เรียบร้อยแล้ว — ไม่ผ่าน ${r.failed} เคส`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "receipt",
    title: "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E1B\u0E34\u0E14\u0E22\u0E2D\u0E14\u0E17\u0E38\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E2A\u0E34\u0E49\u0E19\u0E27\u0E31\u0E19",
      onClick: run
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: date,
    onChange: e => {
      setDate(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: window.LOGIN_USER.name
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E27\u0E31\u0E19\u0E17\u0E33\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: result ? 'ปิดงานแล้ว' : 'ยังไม่ปิดงาน'
  })))), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ② ปิดงานประจำเดือน
// ════════════════════════════════════════════════════════════════════
function MonthCloseRunPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE()));
  const [month, setMonth] = useState(CL_MONTHS[new Date().getMonth()]);
  const [result, setResult] = useState(null);
  const run = () => {
    const r = clRun({
      no: `MC${year.slice(-2)}${String(CL_MONTHS.indexOf(month) + 1).padStart(2, '0')}`,
      steps: [{
        label: 'ปิดยอดเรียกเก็บประจำเดือน',
        total: 8420,
        failed: 12,
        refPrefix: 'COL-',
        reason: ['หักเงินเดือนไม่ครบตามงวด', 'ไม่พบข้อมูลสังกัดของสมาชิก', 'สมาชิกลาออกระหว่างเดือน']
      }, {
        label: 'คิดดอกเบี้ยเงินกู้',
        total: 5311,
        failed: 4,
        refPrefix: 'INT-',
        reason: ['สัญญาอยู่ในสถานะดำเนินคดี', 'ไม่พบอัตราดอกเบี้ยของงวด']
      }, {
        label: 'คิดดอกเบี้ยเงินฝาก',
        total: 3740,
        failed: 2,
        refPrefix: 'DIN-',
        reason: 'บัญชีปิดระหว่างเดือน'
      }, {
        label: 'ปรับยอดหุ้นประจำเดือน',
        total: 8420,
        failed: 5,
        refPrefix: 'SHR-',
        reason: ['ค่าหุ้นรายเดือนต่ำกว่าเกณฑ์', 'สถานะสมาชิกไม่อนุญาตให้ส่งหุ้น']
      }, {
        label: 'บันทึกบัญชีสิ้นเดือน',
        total: 214,
        failed: 0
      }]
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ปิดงานประจำเดือน',
      target: `งวด ${month} ${year}`,
      summary: `${r.no} · ปิดงานประจำเดือน ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ปิดงานประจำเดือน ${month} ${year} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "receipt",
    title: "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E1B\u0E34\u0E14\u0E22\u0E2D\u0E14\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E07\u0E27\u0E14\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E02\u0E2D\u0E07\u0E17\u0E38\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E07\u0E32\u0E19",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
      onClick: run
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E07\u0E27\u0E14\u0E17\u0E35\u0E48\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35",
    w: 140,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19",
    w: 190,
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: month,
    onChange: e => {
      setMonth(e.target.value);
      setResult(null);
    }
  }, CL_MONTHS.map(m => /*#__PURE__*/React.createElement("option", {
    key: m,
    value: m
  }, m)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: window.LOGIN_USER.name
  })))), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ③ ปิดสิ้นปี
// ════════════════════════════════════════════════════════════════════
function YearCloseRunPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE()));
  const [parts, setParts] = useState(['หุ้น', 'หนี้', 'เงินฝาก', 'บัญชี']);
  const [result, setResult] = useState(null);
  const toggle = p => {
    setParts(v => v.includes(p) ? v.filter(x => x !== p) : [...v, p]);
    setResult(null);
  };
  const run = () => {
    const steps = [];
    if (parts.includes('หุ้น')) steps.push({
      label: 'ปิดสิ้นปี — ทะเบียนหุ้น',
      total: 8420,
      failed: 6,
      refPrefix: 'SHR-',
      reason: ['หุ้นคงเหลือไม่ตรงกับรายการเคลื่อนไหว', 'สมาชิกอยู่ระหว่างคืนค่าหุ้น']
    });
    if (parts.includes('หนี้')) steps.push({
      label: 'ปิดสิ้นปี — ทะเบียนเงินกู้',
      total: 5311,
      failed: 9,
      refPrefix: 'LON-',
      reason: ['ดอกเบี้ยค้างรับยังไม่เคลียร์', 'สัญญาอยู่ในสถานะบังคับคดี', 'ยอดคงเหลือติดลบ']
    });
    if (parts.includes('เงินฝาก')) steps.push({
      label: 'ปิดสิ้นปี — เงินฝาก',
      total: 3740,
      failed: 2,
      refPrefix: 'DEP-',
      reason: 'บัญชีถูกอายัดตามคำสั่งศาล'
    });
    if (parts.includes('บัญชี')) steps.push({
      label: 'ยกยอดบัญชีเข้าปีใหม่',
      total: 268,
      failed: 0
    });
    if (!steps.length) return;
    const r = clRun({
      no: `YC${year.slice(-2)}${String(Math.floor(Math.random() * 900) + 100)}`,
      steps
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ปิดสิ้นปี',
      target: `ปี ${year}`,
      summary: `${r.no} · ปิดสิ้นปี ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ปิดสิ้นปี ${year} เรียบร้อยแล้ว — ไม่ผ่าน ${r.failed} เคส`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "receipt",
    title: "\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E1B\u0E34\u0E14\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35\u0E41\u0E25\u0E30\u0E22\u0E01\u0E22\u0E2D\u0E14\u0E40\u0E02\u0E49\u0E32\u0E1B\u0E35\u0E43\u0E2B\u0E21\u0E48",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run,
      disabled: !parts.length
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E1B\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E17\u0E35\u0E48\u0E1B\u0E34\u0E14"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E34\u0E14\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    w: 170
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: `31/12/${year}`,
    mono: true
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: window.LOGIN_USER.name
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '10px 24px'
    }
  }, ['หุ้น', 'หนี้', 'เงินฝาก', 'บัญชี'].map(p => /*#__PURE__*/React.createElement(ClCheck, {
    key: p,
    label: `ปิดสิ้นปีระบบ${p}`,
    checked: parts.includes(p),
    onChange: () => toggle(p)
  })))), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E48\u0E2D\u0E19\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(ClNotes, {
    items: ['ตรวจสอบข้อมูลหุ้น–หนี้–เงินฝากคงเหลือให้เรียบร้อย', 'สำรองข้อมูล (Backup database) ก่อนทำรายการ', 'ทำรายการปิดสิ้นปีทีละระบบงาน', 'Reconcile ยอดยกมาหลังประมวลผลทุกครั้ง']
  })), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ④ จัดทำหนังสือยืนยันยอด
// ════════════════════════════════════════════════════════════════════
const CL_CONFIRM_SCOPES = [{
  k: 'share',
  l: 'ประมวลเก็บยอดหุ้น'
}, {
  k: 'debt',
  l: 'ประมวลเก็บยอดหนี้'
}, {
  k: 'deposit',
  l: 'ประมวลเก็บยอดเงินฝาก'
}, {
  k: 'guarantor',
  l: 'ประมวลเก็บยอดคนค้ำประกัน'
}];
function BalanceConfirmPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const today = clToday();
  const [txnDate, setTxnDate] = useState(today);
  const [asOf, setAsOf] = useState(today);
  const [scopes, setScopes] = useState(['share', 'debt']);
  const [sample, setSample] = useState('สมาชิกทุกคน');
  const [txnType, setTxnType] = useState('ทั้งหมด');
  const [affil, setAffil] = useState('');
  const [memberCode, setMemberCode] = useState('');
  const [result, setResult] = useState(null);
  const toggle = k => {
    setScopes(v => v.includes(k) ? v.filter(x => x !== k) : [...v, k]);
    setResult(null);
  };
  const run = () => {
    const base = {
      share: 8420,
      debt: 5311,
      deposit: 3740,
      guarantor: 4102
    };
    const fail = {
      share: [4, ['ไม่พบที่อยู่ที่ใช้ส่งหนังสือ', 'สมาชิกลาออกแล้ว']],
      debt: [7, ['สัญญาอยู่ในสถานะดำเนินคดี', 'ยอดคงเหลือไม่ตรงกับทะเบียน']],
      deposit: [3, 'บัญชีปิดก่อนวันคงเหลือ'],
      guarantor: [5, ['ไม่พบสัญญาที่ค้ำประกัน', 'ผู้ค้ำถูกปลดภาระแล้ว']]
    };
    const steps = CL_CONFIRM_SCOPES.filter(s => scopes.includes(s.k)).map(s => ({
      label: s.l,
      total: base[s.k],
      failed: fail[s.k][0],
      refPrefix: 'CFM-',
      reason: fail[s.k][1]
    }));
    if (!steps.length) return;
    const r = clRun({
      no: `CFM${clBE().toString().slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — จัดทำหนังสือยืนยันยอด',
      target: `คงเหลือ ณ ${window.fmt.date(asOf)}`,
      summary: `${r.no} · จัดทำหนังสือยืนยันยอด ${r.total} ฉบับ · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`จัดทำหนังสือยืนยันยอดเรียบร้อยแล้ว (${r.ok} ฉบับ)`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E08\u0E31\u0E14\u0E17\u0E33\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E2D\u0E14"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "print",
    title: "\u0E08\u0E31\u0E14\u0E17\u0E33\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E2D\u0E14",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E08\u0E31\u0E14\u0E17\u0E33\u0E2B\u0E19\u0E31\u0E07\u0E2A\u0E37\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E22\u0E2D\u0E14\u0E2B\u0E38\u0E49\u0E19 \u0E2B\u0E19\u0E35\u0E49 \u0E40\u0E07\u0E34\u0E19\u0E1D\u0E32\u0E01 \u0E41\u0E25\u0E30\u0E04\u0E19\u0E04\u0E49\u0E33\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run,
      disabled: !scopes.length
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E17\u0E33"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: txnDate,
    onChange: e => {
      setTxnDate(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D \u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: asOf,
    onChange: e => {
      setAsOf(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E2A\u0E38\u0E48\u0E21",
    w: 200
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: sample,
    onChange: e => {
      setSample(e.target.value);
      setResult(null);
    }
  }, ['สมาชิกทุกคน', 'สุ่มตามสัดส่วน 10%', 'สุ่มตามสัดส่วน 25%', 'เฉพาะที่ระบุ'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: txnType,
    onChange: e => {
      setTxnType(e.target.value);
      setResult(null);
    }
  }, ['ทั้งหมด', 'เฉพาะสังกัด', 'เฉพาะทะเบียน'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '10px 24px'
    }
  }, CL_CONFIRM_SCOPES.map(s => /*#__PURE__*/React.createElement(ClCheck, {
    key: s.k,
    label: s.l,
    checked: scopes.includes(s.k),
    onChange: () => toggle(s.k)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E23\u0E30\u0E1A\u0E38\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    grow: true,
    w: 240
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: affil,
    disabled: txnType !== 'เฉพาะสังกัด',
    placeholder: txnType === 'เฉพาะสังกัด' ? 'รหัสสังกัด เช่น 00555' : 'เลือกประเภททำรายการเป็น “เฉพาะสังกัด”',
    onChange: e => setAffil(e.target.value)
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E23\u0E30\u0E1A\u0E38\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19",
    grow: true,
    w: 240
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: memberCode,
    disabled: txnType !== 'เฉพาะทะเบียน',
    placeholder: txnType === 'เฉพาะทะเบียน' ? 'เลขทะเบียนสมาชิก' : 'เลือกประเภททำรายการเป็น “เฉพาะทะเบียน”',
    onChange: e => setMemberCode(e.target.value)
  })))), /*#__PURE__*/React.createElement(ClResult, {
    result: result,
    unit: "\u0E09\u0E1A\u0E31\u0E1A"
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑤ จัดทำหนี้สั้นยาว
// ════════════════════════════════════════════════════════════════════
function DebtTermPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const today = clToday();
  const [year, setYear] = useState(String(clBE()));
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [result, setResult] = useState(null);
  const run = () => {
    const r = clRun({
      no: `DT${year.slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps: [{
        label: 'จัดชั้นหนี้ระยะสั้น (ครบกำหนดภายใน 1 ปี)',
        total: 2841,
        failed: 3,
        refPrefix: 'LON-',
        reason: ['ไม่พบงวดชำระของสัญญา', 'วันครบกำหนดไม่อยู่ในปีบัญชี']
      }, {
        label: 'จัดชั้นหนี้ระยะยาว (เกิน 1 ปี)',
        total: 2470,
        failed: 2,
        refPrefix: 'LON-',
        reason: 'สัญญาอยู่ระหว่างปรับโครงสร้างหนี้'
      }, {
        label: 'บันทึกผลจัดชั้นเข้าทะเบียนเงินกู้',
        total: 5311,
        failed: 0
      }]
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — จัดทำหนี้สั้นยาว',
      target: `ปีบัญชี ${year}`,
      summary: `${r.no} · จัดทำหนี้สั้นยาว ${r.total} สัญญา · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`จัดทำหนี้สั้นยาวปีบัญชี ${year} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E08\u0E31\u0E14\u0E17\u0E33\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E31\u0E49\u0E19\u0E22\u0E32\u0E27"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "money",
    title: "\u0E08\u0E31\u0E14\u0E17\u0E33\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E31\u0E49\u0E19\u0E22\u0E32\u0E27",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E08\u0E31\u0E14\u0E0A\u0E31\u0E49\u0E19\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E23\u0E30\u0E22\u0E30\u0E2A\u0E31\u0E49\u0E19\u0E41\u0E25\u0E30\u0E23\u0E30\u0E22\u0E30\u0E22\u0E32\u0E27\u0E15\u0E32\u0E21\u0E1B\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E25\u0E39\u0E01\u0E2B\u0E19\u0E35\u0E49\u0E2A\u0E31\u0E49\u0E19\u0E22\u0E32\u0E27"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: from,
    onChange: e => {
      setFrom(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: to,
    onChange: e => {
      setTo(e.target.value);
      setResult(null);
    }
  })))), /*#__PURE__*/React.createElement(ClResult, {
    result: result,
    unit: "\u0E2A\u0E31\u0E0D\u0E0D\u0E32"
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑥ ประมวลผลปรับอัตราดอกเบี้ย
// ════════════════════════════════════════════════════════════════════
const CL_LOAN_TYPES = [{
  code: '10',
  label: 'ฉุกเฉินเงินสด'
}, {
  code: '11',
  label: 'ฉุกเฉินหักโอน*'
}, {
  code: '12',
  label: 'ฉุกเฉิน ATM'
}, {
  code: '20',
  label: 'สามัญ 33 เท่า*'
}, {
  code: '21',
  label: 'สามัญ 35 เท่า (โครงการ)*'
}, {
  code: '22',
  label: 'สามัญ 33 เท่า (โครงการ)*'
}, {
  code: '23',
  label: 'สามัญผ่อนผัน 33 เท่า (โครงการ)*'
}, {
  code: '24',
  label: 'สามัญผ่อนผัน 33 เท่า*'
}, {
  code: '25',
  label: 'สามัญผ่อนผัน 35 เท่า (โครงการ)*'
}, {
  code: '26',
  label: 'สามัญหุ้น'
}, {
  code: '27',
  label: 'สามัญเพื่อการรวมหนี้'
}, {
  code: '28',
  label: 'สามัญบิน*'
}, {
  code: '29',
  label: 'สามัญเพื่อการปรับปรุงคุณภาพชีวิต 1*'
}, {
  code: '30',
  label: 'พิเศษเคหะสงเคราะห์'
}, {
  code: '31',
  label: 'พิเศษยานพาหนะ'
}, {
  code: '32',
  label: 'พิเศษเพื่อประกอบอาชีพ'
}];
function RateAdjustPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const today = clToday();
  const [effDate, setEffDate] = useState(today);
  const [sysDate, setSysDate] = useState(today);
  const [cond, setCond] = useState('เฉพาะสัญญาที่สูงกว่า');
  const [rate, setRate] = useState('5.25');
  const [types, setTypes] = useState([]);
  const [result, setResult] = useState(null);
  const toggle = c => {
    setTypes(v => v.includes(c) ? v.filter(x => x !== c) : [...v, c]);
    setResult(null);
  };
  const toggleAll = () => {
    setTypes(v => v.length === CL_LOAN_TYPES.length ? [] : CL_LOAN_TYPES.map(t => t.code));
    setResult(null);
  };
  const run = () => {
    if (!types.length) return;
    const steps = types.map((c, i) => {
      const t = CL_LOAN_TYPES.find(x => x.code === c);
      const total = 120 + i * 137 % 640;
      const failed = i % 3 === 0 ? i % 2 + 1 : 0;
      return {
        label: `${c} · ${t.label}`,
        total,
        failed,
        refPrefix: 'LON-',
        reason: ['สัญญาอยู่ในสถานะดำเนินคดี', 'อัตราดอกเบี้ยตามสัญญาต่ำกว่าอัตราใหม่']
      };
    });
    const r = clRun({
      no: `IR${clBE().toString().slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลปรับอัตราดอกเบี้ย',
      target: `มีผล ${window.fmt.date(effDate)} · ${rate}%`,
      summary: `${r.no} · ปรับอัตราดอกเบี้ย ${types.length} ประเภทเงินกู้ · ${r.total} สัญญา · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ปรับอัตราดอกเบี้ยเป็น ${rate}% เรียบร้อยแล้ว (${r.ok} สัญญา)`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E23\u0E31\u0E1A\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "money",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E23\u0E31\u0E1A\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E1B\u0E23\u0E31\u0E1A\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run,
      disabled: !types.length
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E21\u0E35\u0E1C\u0E25\u0E43\u0E0A\u0E49\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22",
    w: 200,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: effDate,
    onChange: e => {
      setEffDate(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A",
    w: 200
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: sysDate,
    onChange: e => setSysDate(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12.5,
      color: 'var(--error, #ff4d4f)',
      fontWeight: 600
    }
  }, "*** \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E0A\u0E31\u0E27\u0E23\u0E4C \u0E43\u0E2B\u0E49\u0E1B\u0E23\u0E31\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22"), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A",
    grow: true,
    w: 240
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: cond,
    onChange: e => {
      setCond(e.target.value);
      setResult(null);
    }
  }, ['เฉพาะสัญญาที่สูงกว่า', 'เฉพาะสัญญาที่ต่ำกว่า', 'ทุกสัญญา'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E31\u0E15\u0E23\u0E32 \u0E14/\u0E1A",
    w: 160,
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: rate,
    onChange: e => {
      setRate(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 13
    }
  }, "%"))))), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    hint: `เลือกแล้ว ${types.length} จาก ${CL_LOAN_TYPES.length} ประเภท`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: toggleAll
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " ", types.length === CL_LOAN_TYPES.length ? 'ไม่เลือกทั้งหมด' : 'เลือกทั้งหมด')), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      maxHeight: 360,
      overflow: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 40
    }
  }), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 70
    }
  }, "\u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("th", null, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))), /*#__PURE__*/React.createElement("tbody", null, CL_LOAN_TYPES.map(t => /*#__PURE__*/React.createElement("tr", {
    key: t.code,
    className: types.includes(t.code) ? 'selected' : ''
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: types.includes(t.code),
    onChange: () => toggle(t.code)
  })), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, t.code), /*#__PURE__*/React.createElement("td", null, t.label)))))))), /*#__PURE__*/React.createElement(ClResult, {
    result: result,
    unit: "\u0E2A\u0E31\u0E0D\u0E0D\u0E32"
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑦ ประมวลผลหุ้นของขวัญ — แก้ไขรายการที่ประมวลผลแล้วได้
// ════════════════════════════════════════════════════════════════════
const CL_GIFT_KEY = 'cl_gift_share_v1';
const clGiftLoad = () => {
  try {
    return JSON.parse(localStorage.getItem(CL_GIFT_KEY) || 'null');
  } catch (e) {
    return null;
  }
};
const clGiftSave = rows => {
  try {
    localStorage.setItem(CL_GIFT_KEY, JSON.stringify(rows));
  } catch (e) {}
};
const CL_GIFT_SEED = [{
  code: '001485',
  name: 'ไพโรจน์ กางกั้น (ก 50)',
  affil: '00100 กองเกษียณ (ส่วนภูมิภาค)',
  shares: 120,
  amount: 1200,
  status: 'ผ่าน',
  note: ''
}, {
  code: '019518',
  name: 'บุญชวน หิรัญวัฒนะ (ก58)',
  affil: '00100 กองเกษียณ (ส่วนกลาง 1)',
  shares: 95,
  amount: 950,
  status: 'ผ่าน',
  note: ''
}, {
  code: '019741',
  name: 'ประสิทธิ์ สุวรรณมาลี (ก63)',
  affil: '00100 กองเกษียณ (ส่วนกลาง 1)',
  shares: 0,
  amount: 0,
  status: 'ไม่ผ่าน',
  note: 'หุ้นคงเหลือต่ำกว่าเกณฑ์'
}, {
  code: '019773',
  name: 'สุขัด มหาพรหม (ก 62)',
  affil: '00100 กองเกษียณ (ส่วนภูมิภาค)',
  shares: 140,
  amount: 1400,
  status: 'ผ่าน',
  note: ''
}, {
  code: '019849',
  name: 'วิเชียร หน่อเพ็ชร์ (ก59)',
  affil: '00111 เกษียณอายุราชการ',
  shares: 0,
  amount: 0,
  status: 'ไม่ผ่าน',
  note: 'สถานะสมาชิกไม่อนุญาตให้รับหุ้นของขวัญ'
}, {
  code: '020117',
  name: 'กานต์ ศิริวงศ์ (ก61)',
  affil: '00100 กองเกษียณ (ส่วนกลาง 2)',
  shares: 110,
  amount: 1100,
  status: 'ผ่าน',
  note: ''
}];
function GiftSharePage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const today = clToday();
  const [year, setYear] = useState(String(clBE()));
  const [round, setRound] = useState('1');
  const [txnDate, setTxnDate] = useState(today);
  const [perShare, setPerShare] = useState('10');
  const [rows, setRows] = useState(() => clGiftLoad() || null);
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState(null);
  const summarize = rs => clRun({
    no: `GS${year.slice(-2)}-${String(round).padStart(2, '0')}`,
    steps: [{
      label: `จัดสรรหุ้นของขวัญ ปี ${year} ครั้งที่ ${round}`,
      total: rs.length,
      failed: rs.filter(r => r.status !== 'ผ่าน').length,
      refPrefix: 'GS-',
      reason: ['หุ้นคงเหลือต่ำกว่าเกณฑ์', 'สถานะสมาชิกไม่อนุญาตให้รับหุ้นของขวัญ']
    }]
  });
  const run = () => {
    const rs = CL_GIFT_SEED.map(r => ({
      ...r
    }));
    setRows(rs);
    clGiftSave(rs);
    setResult(summarize(rs));
    setEditing(false);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลหุ้นของขวัญ',
      target: `ปี ${year} ครั้งที่ ${round}`,
      summary: `ประมวลผลหุ้นของขวัญ ${rs.length} เคส · ไม่ผ่าน ${rs.filter(r => r.status !== 'ผ่าน').length}`
    });
    onToast && onToast('ประมวลผลหุ้นของขวัญเรียบร้อยแล้ว');
  };
  const patch = (i, p) => setRows(rs => rs.map((r, idx) => {
    if (idx !== i) return r;
    const n = {
      ...r,
      ...p
    };
    if ('shares' in p) n.amount = (Number(n.shares) || 0) * (Number(perShare) || 0);
    return n;
  }));
  const saveEdits = () => {
    clGiftSave(rows);
    setResult(summarize(rows));
    setEditing(false);
    audit && audit.log && audit.log({
      action: 'update',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลหุ้นของขวัญ',
      target: `ปี ${year} ครั้งที่ ${round}`,
      summary: `แก้ไขรายการหุ้นของขวัญที่ประมวลผลแล้ว ${rows.length} รายการ`,
      changes: rows.map(r => ({
        field: `${r.code} · ${r.name}`,
        before: '—',
        after: `${r.shares} หุ้น · ${r.status}`
      }))
    });
    onToast && onToast('บันทึกการแก้ไขรายการหุ้นของขวัญเรียบร้อยแล้ว');
  };
  const total = (rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E2B\u0E38\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "shares",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E2B\u0E38\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E08\u0E31\u0E14\u0E2A\u0E23\u0E23\u0E2B\u0E38\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D \u0E41\u0E25\u0E30\u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E49\u0E27",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run
    }), rows && !editing && /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => setEditing(true)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "edit",
      size: 13
    }), " \u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E49\u0E27"), rows && editing && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: saveEdits
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        const r = clGiftLoad();
        setRows(r);
        setEditing(false);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")))
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35",
    w: 140,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => setYear(e.target.value)
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48",
    w: 120,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: round,
    onChange: e => setRound(e.target.value),
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: txnDate,
    onChange: e => setTxnDate(e.target.value)
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E15\u0E48\u0E2D\u0E2B\u0E38\u0E49\u0E19 (\u0E1A\u0E32\u0E17)",
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: perShare,
    onChange: e => setPerShare(e.target.value),
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E22\u0E2D\u0E14\u0E08\u0E31\u0E14\u0E2A\u0E23\u0E23\u0E23\u0E27\u0E21",
    w: 170
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: clMoney(total),
    num: true,
    mono: true
  })))), rows && /*#__PURE__*/React.createElement(ClSec, {
    title: 'รายการหุ้นของขวัญที่ประมวลผลแล้ว' + (editing ? ' (กำลังแก้ไข)' : ''),
    style: {
      marginTop: 12
    },
    hint: editing ? 'แก้ไขจำนวนหุ้น สถานะ และหมายเหตุได้ แล้วกด “บันทึกการแก้ไข” เพื่อประมวลผลสรุปใหม่' : undefined
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
      width: 56
    }
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 100
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 110
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2B\u0E38\u0E49\u0E19"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 120
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 120
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 240
    }
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.code
  }, /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.code), /*#__PURE__*/React.createElement("td", null, r.name), /*#__PURE__*/React.createElement("td", null, r.affil), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, editing ? /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    value: r.shares,
    onChange: e => patch(i, {
      shares: e.target.value
    }),
    style: {
      textAlign: 'right',
      width: 90
    }
  }) : /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, window.fmt.money(r.shares, 0))), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, clMoney(r.amount)), /*#__PURE__*/React.createElement("td", null, editing ? /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: r.status,
    onChange: e => patch(i, {
      status: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", null, "\u0E1C\u0E48\u0E32\u0E19"), /*#__PURE__*/React.createElement("option", null, "\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19")) : /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + (r.status === 'ผ่าน' ? 'ok' : 'warn')
  }, r.status)), /*#__PURE__*/React.createElement("td", null, editing ? /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    value: r.note,
    onChange: e => patch(i, {
      note: e.target.value
    }),
    style: {
      width: '100%'
    }
  }) : r.note || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014")))))))), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑧ ตัดยอดรายการหุ้นของขวัญ
// ════════════════════════════════════════════════════════════════════
function GiftShareCutPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const today = clToday();
  const [year, setYear] = useState(String(clBE()));
  const [round, setRound] = useState('0');
  const [txnDate, setTxnDate] = useState(today);
  const [receiptDate, setReceiptDate] = useState(today);
  const [pairAccount, setPairAccount] = useState('');
  const [type, setType] = useState('ทั้งหมด');
  const [result, setResult] = useState(null);
  const run = () => {
    const r = clRun({
      no: `GC${year.slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps: [{
        label: 'ตัดยอดหุ้นของขวัญเข้าทะเบียนหุ้น',
        total: 1842,
        failed: 6,
        refPrefix: 'GS-',
        reason: ['ไม่พบรายการหุ้นของขวัญที่ประมวลผลแล้ว', 'สมาชิกลาออกก่อนวันตัดยอด']
      }, {
        label: 'ออกใบเสร็จรับเงินหุ้นของขวัญ',
        total: 1836,
        failed: 2,
        refPrefix: 'RCV-',
        reason: 'เลขที่ใบเสร็จซ้ำ'
      }, {
        label: 'บันทึกคู่บัญชี',
        total: 1834,
        failed: 0
      }]
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ตัดยอดรายการหุ้นของขวัญ',
      target: `ปี ${year} ครั้งที่ ${round}`,
      summary: `${r.no} · ตัดยอดหุ้นของขวัญ ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast('ตัดยอดรายการหุ้นของขวัญเรียบร้อยแล้ว');
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E38\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "shares",
    title: "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E38\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E2B\u0E38\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D\u0E40\u0E02\u0E49\u0E32\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2B\u0E38\u0E49\u0E19\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E40\u0E07\u0E34\u0E19\u0E23\u0E32\u0E07\u0E27\u0E31\u0E25\u0E2B\u0E38\u0E49\u0E19\u0E1B\u0E35",
    w: 160,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48",
    w: 120,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: round,
    onChange: e => {
      setRound(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E04\u0E39\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: pairAccount,
    onChange: e => setPairAccount(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "(\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E39\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35)"), ['1101-01 เงินสด', '1102-01 เงินฝากธนาคาร — กระแสรายวัน', '2201-01 ทุนเรือนหุ้น', '5301-05 ค่าใช้จ่ายส่งเสริมสมาชิก'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o))))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: txnDate,
    onChange: e => {
      setTxnDate(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08",
    w: 180,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: receiptDate,
    onChange: e => setReceiptDate(e.target.value)
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",
    w: 180
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: type,
    onChange: e => {
      setType(e.target.value);
      setResult(null);
    }
  }, ['ทั้งหมด', 'เฉพาะสมาชิกสามัญ', 'เฉพาะสมาชิกสมทบ', 'เฉพาะเกษียณ'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))))), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑨ ประมวลผลปิดสิ้นปี (หนี้)
// ════════════════════════════════════════════════════════════════════
const CL_DEBT_DOCS = [{
  code: 'LR',
  detail: 'ใบคำขอกู้',
  last: 'LR69-004821'
}, {
  code: 'LC',
  detail: 'สัญญาเงินกู้',
  last: 'LC69-003914'
}, {
  code: 'LP',
  detail: 'ใบสั่งจ่ายเงินกู้',
  last: 'LP69-003877'
}, {
  code: 'RCV',
  detail: 'ใบเสร็จรับเงิน',
  last: 'RCV69-114208'
}, {
  code: 'DN',
  detail: 'หนังสือทวงถามหนี้',
  last: 'DN69-000642'
}];
function YearCloseDebtPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE()));
  const [clearInterest, setClearInterest] = useState(true);
  const [clearDocNo, setClearDocNo] = useState(true);
  const [result, setResult] = useState(null);
  const [docs, setDocs] = useState(null);
  const run = () => {
    const steps = [{
      label: 'ยกยอดหนี้คงเหลือเข้าปีใหม่',
      total: 5311,
      failed: 7,
      refPrefix: 'LON-',
      reason: ['ยอดคงเหลือไม่ตรงกับรายการเคลื่อนไหว', 'สัญญาอยู่ในสถานะบังคับคดี']
    }, {
      label: 'ตรวจสอบหนี้ระยะสั้น–ระยะยาว',
      total: 5311,
      failed: 2,
      refPrefix: 'LON-',
      reason: 'ไม่พบผลจัดชั้นหนี้สั้นยาวของปีบัญชี'
    }];
    if (clearInterest) steps.push({
      label: 'เคลียร์ดอกเบี้ยสะสม',
      total: 5311,
      failed: 4,
      refPrefix: 'INT-',
      reason: ['ดอกเบี้ยค้างรับยังไม่ได้ตั้งยอด', 'สัญญามีรายการปรับยอดค้างอยู่']
    });
    if (clearDocNo) steps.push({
      label: 'เคลียร์เลขที่เอกสาร',
      total: CL_DEBT_DOCS.length,
      failed: 1,
      refPrefix: 'DOC-',
      reason: 'ระบบอื่นยังไม่เคลียร์งานของเอกสารนี้'
    });
    const r = clRun({
      no: `YD${year.slice(-2)}${String(Math.floor(Math.random() * 900) + 100)}`,
      steps
    });
    setResult(r);
    setDocs(clearDocNo ? CL_DEBT_DOCS.map((d, i) => ({
      ...d,
      next: `${d.code}${(Number(year) + 1).toString().slice(-2)}-000001`,
      status: i === 3 ? 'ไม่ผ่าน' : 'Clear แล้ว'
    })) : null);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลปิดสิ้นปี (หนี้)',
      target: `ปี ${year}`,
      summary: `${r.no} · ปิดสิ้นปีเงินกู้ ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ประมวลผลปิดสิ้นปีเงินกู้ ${year} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35 (\u0E2B\u0E19\u0E35\u0E49)"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "money",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35 (\u0E2B\u0E19\u0E35\u0E49)",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E2A\u0E30\u0E2A\u0E21\u0E41\u0E25\u0E30\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35\u0E40\u0E07\u0E34\u0E19\u0E01\u0E39\u0E49"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35",
    w: 160,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E14\u0E2D\u0E01\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E2A\u0E30\u0E2A\u0E21",
    checked: clearInterest,
    onChange: v => {
      setClearInterest(v);
      setResult(null);
    }
  }), /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
    checked: clearDocNo,
    onChange: v => {
      setClearDocNo(v);
      setResult(null);
    }
  }))), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(ClNotes, {
    items: ['ตรวจสอบข้อมูลหนี้คงเหลือให้เรียบร้อย', 'ตรวจสอบข้อมูลหนี้ระยะสั้นระยะยาวให้เรียบร้อย', 'ตรวจสอบข้อมูลดอกเบี้ยค้างรับให้เรียบร้อย', 'กรณีเคลียร์เลขที่เอกสาร ควรสอบถามระบบอื่นว่าเคลียร์งานเสร็จหมดหรือยัง', 'สำรองข้อมูลก่อนทำรายการ', 'ทำรายการปิดสิ้นปีเงินกู้', 'สำรองข้อมูลหลังทำรายการ', 'ตรวจสอบข้อมูลดอกเบี้ยที่ถูกเคลียร์ที่ทะเบียนสมาชิก ทะเบียนเงินกู้', 'ตรวจสอบข้อมูลเลขที่เอกสาร']
  })), docs && /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
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
      width: 56
    }
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 110
    }
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 240
    }
  }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 150
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 150
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 120
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30 Clear"))), /*#__PURE__*/React.createElement("tbody", null, docs.map((d, i) => /*#__PURE__*/React.createElement("tr", {
    key: d.code
  }, /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, d.code), /*#__PURE__*/React.createElement("td", null, d.detail), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, d.last), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, d.next), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + (d.status === 'Clear แล้ว' ? 'ok' : 'warn')
  }, d.status)))))))), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑩ ประมวลผลปิดสิ้นปี (หุ้น)
// ════════════════════════════════════════════════════════════════════
function YearCloseSharePage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE()));
  const [setRegistry, setSetRegistry] = useState(true);
  const [setMovement, setSetMovement] = useState(false);
  const [result, setResult] = useState(null);
  const run = () => {
    const steps = [{
      label: 'ยกยอดหุ้นคงเหลือเข้าปีใหม่',
      total: 8420,
      failed: 5,
      refPrefix: 'SHR-',
      reason: ['หุ้นคงเหลือไม่ตรงกับรายการเคลื่อนไหว', 'สมาชิกอยู่ระหว่างคืนค่าหุ้น']
    }];
    if (setRegistry) steps.push({
      label: 'ตั้งหุ้นยกมาทะเบียนหุ้น',
      total: 8420,
      failed: 3,
      refPrefix: 'SHR-',
      reason: 'ไม่พบยอดหุ้นสะสมของสมาชิก'
    });
    if (setMovement) steps.push({
      label: 'ตั้งหุ้นยกมารายการเคลื่อนไหวหุ้น (B/F)',
      total: 8420,
      failed: 2,
      refPrefix: 'SHM-',
      reason: 'มีรายการเคลื่อนไหวซ้ำในงวดยกมา'
    });
    const r = clRun({
      no: `YS${year.slice(-2)}${String(Math.floor(Math.random() * 900) + 100)}`,
      steps
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลผลปิดสิ้นปี (หุ้น)',
      target: `ปี ${year}`,
      summary: `${r.no} · ปิดสิ้นปีสมาชิกและหุ้น ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ประมวลผลปิดสิ้นปีสมาชิกและหุ้น ${year} เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35 (\u0E2B\u0E38\u0E49\u0E19)"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "shares",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35 (\u0E2B\u0E38\u0E49\u0E19)",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E41\u0E25\u0E30\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2B\u0E38\u0E49\u0E19",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35 \u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E41\u0E25\u0E30\u0E2B\u0E38\u0E49\u0E19"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E49\u0E19\u0E1B\u0E35",
    w: 160,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E15\u0E31\u0E49\u0E07\u0E2B\u0E38\u0E49\u0E19\u0E22\u0E01\u0E21\u0E32\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2B\u0E38\u0E49\u0E19",
    checked: setRegistry,
    onChange: v => {
      setSetRegistry(v);
      setResult(null);
    }
  }), /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E15\u0E31\u0E49\u0E07\u0E2B\u0E38\u0E49\u0E19\u0E22\u0E01\u0E21\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27\u0E2B\u0E38\u0E49\u0E19",
    note: "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 2558 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07 \u0E08\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E04\u0E34\u0E14",
    checked: setMovement,
    onChange: v => {
      setSetMovement(v);
      setResult(null);
    }
  }))), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(ClNotes, {
    items: ['ตรวจสอบข้อมูลหุ้นคงเหลือให้เรียบร้อย', 'สำรองข้อมูล (Backup database)', 'ทำประมวลผลปิดสิ้นปี สมาชิกและหุ้น', 'Reconcile หลังประมวลผล', 'กรณีตั้งหุ้นยกมาทะเบียนหุ้น ให้ดูว่าหุ้นยกมาของแต่ละคนตรงกับหุ้นสะสมหรือไม่', 'กรณีตั้งหุ้นยกมารายการเคลื่อนไหวหุ้น จะมี B/F ใน Statement']
  })), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ⑪ ค่าเบี้ยประชุมค้างจ่าย
// ════════════════════════════════════════════════════════════════════
const CL_MEETING_EVENTS = ['01 ค่าเดินทางใช้สิทธิเลือกตั้ง', '02 ค่าเบี้ยประชุมใหญ่สามัญประจำปี', '03 ค่าเบี้ยประชุมคณะกรรมการดำเนินการ', '04 ค่าเบี้ยประชุมคณะอนุกรรมการ'];
const CL_MEETING_ROWS = [{
  code: '001485',
  name: 'ไพโรจน์ กางกั้น (ก 50)',
  affil: '00100 กองเกษียณ (ส่วนภูมิภาค)',
  reg: '16/02/2569 00:00:00',
  zone: 'ผิดเขต ปข.06',
  tel: '065-995-9196',
  method: 'CBT-โอนธนาคาร',
  amount: 2000,
  bank: '006',
  branch: '0111',
  acct: '1111908311',
  note: 'ลงทะเบียนผิดเขต'
}, {
  code: '019518',
  name: 'บุญชวน หิรัญวัฒนะ (ก58)',
  affil: '00100 กองเกษียณ (ส่วนกลาง 1)',
  reg: '16/02/2569 00:00:00',
  zone: 'ผิดเขต ส่วนกลาง 1',
  tel: '084-290-2225',
  method: 'CBT-โอนธนาคาร',
  amount: 2000,
  bank: '006',
  branch: '0222',
  acct: '2220187233',
  note: 'ลงทะเบียนผิดเขต'
}, {
  code: '019741',
  name: 'ประสิทธิ์ สุวรรณมาลี (ก63)(ประกันชีวิต)',
  affil: '00100 กองเกษียณ (ส่วนกลาง 1)',
  reg: '16/02/2569 00:00:00',
  zone: 'ผิดเขต ปข.04',
  tel: '093-071-8951',
  method: 'CBT-โอนธนาคาร',
  amount: 2000,
  bank: '006',
  branch: '0419',
  acct: '4193036782',
  note: 'ลงทะเบียนผิดเขต'
}, {
  code: '019773',
  name: 'สุขัด มหาพรหม (ก 62)',
  affil: '00100 กองเกษียณ (ส่วนภูมิภาค)',
  reg: '16/02/2569 00:00:00',
  zone: 'ผิดเขต ปข.08',
  tel: '089-597-0214',
  method: 'CBT-โอนธนาคาร',
  amount: 2000,
  bank: '006',
  branch: '0911',
  acct: '9111566876',
  note: 'ลงทะเบียนผิดเขต'
}, {
  code: '019849',
  name: 'วิเชียร หน่อเพ็ชร์ (ก59)',
  affil: '00111 เกษียณอายุราชการ',
  reg: '16/02/2569 00:00:00',
  zone: 'ผิดเขต ส่วนกลาง 1',
  tel: '081-304-7919',
  method: 'CBT-โอนธนาคาร',
  amount: 2000,
  bank: '006',
  branch: '0020',
  acct: '0201093677',
  note: 'ลงทะเบียนผิดเขต'
}];
function MeetingFeePage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE()));
  const [event, setEvent] = useState(CL_MEETING_EVENTS[0]);
  const [memberCode, setMemberCode] = useState('');
  const [rows, setRows] = useState(null);
  const [result, setResult] = useState(null);
  const fetchRows = () => {
    const rs = CL_MEETING_ROWS.filter(r => !memberCode.trim() || r.code.includes(memberCode.trim())).map(r => ({
      ...r
    }));
    setRows(rs);
    setResult(null);
    onToast && onToast(`ดึงข้อมูลค่าเบี้ยประชุมค้างจ่าย ${rs.length} รายการ`);
  };
  const patch = (i, p) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...p
  } : r));
  const run = () => {
    if (!rows || !rows.length) return;
    const failed = rows.filter(r => !r.acct || !r.amount).length + 1;
    const r = clRun({
      no: `PEN${year.slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps: [{
        label: 'ตรวจสอบสิทธิรับค่าเบี้ยประชุม',
        total: rows.length,
        failed: 0
      }, {
        label: 'จ่ายค่าเบี้ยประชุมค้างจ่าย (PEN)',
        total: rows.length,
        failed,
        refPrefix: 'PEN-',
        reason: ['เลขที่บัญชีธนาคารไม่ถูกต้อง', 'ลงทะเบียนผิดเขต ต้องตรวจสอบก่อนจ่าย']
      }, {
        label: 'Map เลขบัญชีสำหรับรายการ PEN',
        total: rows.length,
        failed: 0
      }]
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ค่าเบี้ยประชุมค้างจ่าย',
      target: `${event} · ปีงบประมาณ ${year}`,
      summary: `${r.no} · จ่ายค่าเบี้ยประชุมค้างจ่าย ${rows.length} คน · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast('ประมวลผลค่าเบี้ยประชุมค้างจ่ายเรียบร้อยแล้ว');
  };
  const total = (rows || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E04\u0E48\u0E32\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E1B\u0E23\u0E30\u0E0A\u0E38\u0E21\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "money",
    title: "\u0E04\u0E48\u0E32\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E1B\u0E23\u0E30\u0E0A\u0E38\u0E21\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 \u2014 \u0E08\u0E48\u0E32\u0E22\u0E04\u0E48\u0E32\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E1B\u0E23\u0E30\u0E0A\u0E38\u0E21\u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22 (PEN)",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: fetchRows
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 13
    }), " \u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25",
      onClick: run,
      disabled: !rows || !rows.length
    }))
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E35\u0E07\u0E1A\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => setYear(e.target.value),
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "Event",
    grow: true,
    w: 300
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: event,
    onChange: e => setEvent(e.target.value)
  }, CL_MEETING_EVENTS.map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E40\u0E25\u0E02\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: memberCode,
    onChange: e => setMemberCode(e.target.value),
    placeholder: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E22\u0E2D\u0E14\u0E08\u0E48\u0E32\u0E22\u0E23\u0E27\u0E21",
    w: 160
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: clMoney(total),
    num: true,
    mono: true
  })))), rows && /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E48\u0E32\u0E40\u0E1A\u0E35\u0E49\u0E22\u0E1B\u0E23\u0E30\u0E0A\u0E38\u0E21\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22",
    style: {
      marginTop: 12
    },
    hint: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E27\u0E34\u0E18\u0E35\u0E08\u0E48\u0E32\u0E22 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35 \u0E41\u0E25\u0E30\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E44\u0E14\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E14\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25"
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
      width: 56
    }
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 260
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D - \u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 190
    }
  }, "\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 170
    }
  }, "\u0E27\u0E34\u0E18\u0E35\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 120
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 90
    }
  }, "\u0E18\u0E19\u0E32\u0E04\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 90
    }
  }, "\u0E2A\u0E32\u0E02\u0E32"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 150
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E0D\u0E0A\u0E35"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.code
  }, /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, r.code), " ", r.name), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, r.affil), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, "SMS ", r.tel)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "mono",
    style: {
      fontSize: 11.5
    }
  }, r.reg), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, r.zone)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: r.method,
    onChange: e => patch(i, {
      method: e.target.value
    })
  }, ['CBT-โอนธนาคาร', 'CSH-เงินสด', 'CHQ-เช็ค'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    value: r.amount,
    onChange: e => patch(i, {
      amount: e.target.value
    }),
    style: {
      textAlign: 'right',
      width: 100
    }
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    value: r.bank,
    onChange: e => patch(i, {
      bank: e.target.value
    }),
    style: {
      width: 70
    }
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    value: r.branch,
    onChange: e => patch(i, {
      branch: e.target.value
    }),
    style: {
      width: 70
    }
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input mono",
    value: r.acct,
    onChange: e => patch(i, {
      acct: e.target.value
    }),
    style: {
      width: 140
    }
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "sh-grid-input",
    value: r.note,
    onChange: e => patch(i, {
      note: e.target.value
    }),
    style: {
      width: '100%'
    }
  })))))))), /*#__PURE__*/React.createElement(ClResult, {
    result: result,
    unit: "\u0E04\u0E19"
  }));
}