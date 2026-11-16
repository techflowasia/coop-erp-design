// ════════════════════════════════════════════════════════════════════
//  ระบบงานประมวลผลและจัดเก็บ — ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร
//  ประมวลผล → แสดงสมาชิก/สัญญาที่ต้องนำส่ง → กดส่งข้อมูลให้กรมสรรพากร
// ════════════════════════════════════════════════════════════════════
const {
  useState: tcxUseState,
  useMemo: tcxUseMemo,
  useRef: tcxUseRef,
  useEffect: tcxUseEffect
} = React;
const TCX_YEARS = [2568, 2567, 2566];

// สมาชิกที่มีสัญญาเงินกู้เพื่อที่อยู่อาศัย (ดอกเบี้ยลดหย่อนภาษีได้)
const TCX_SEED = [{
  code: 'M-067012',
  name: 'นายวิรัตน์ ทองสุข',
  citizenId: '3-1020-00457-12-8',
  dept: 'กองช่าง',
  contracts: [{
    contractNo: 'L-2565-00841',
    type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย',
    purpose: 'ซื้ออาคารพร้อมที่ดิน',
    interest: 48250.75,
    certNo: 'IC-2568-004182',
    issuedAt: '2026-01-18',
    tax: 'sent',
    taxAt: '2026-02-05'
  }, {
    contractNo: 'L-2566-01120',
    type: 'เงินกู้พิเศษเคหะสงเคราะห์',
    purpose: 'ซ่อมแซม ปรับปรุง ต่อเติม บ้านพักอาศัย',
    interest: 12980.50,
    certNo: 'IC-2568-004183',
    issuedAt: '2026-01-18',
    tax: 'wait'
  }]
}, {
  code: 'M-066238',
  name: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์',
  citizenId: '1-1018-00712-90-4',
  dept: 'กองการศึกษา',
  contracts: [{
    contractNo: 'L-2564-00620',
    type: 'เงินกู้พิเศษเคหะสงเคราะห์',
    purpose: 'ปลูกสร้างอาคารบนที่ดินของตนเอง',
    interest: 71420.00,
    certNo: 'IC-2568-004201',
    issuedAt: '2026-01-18',
    tax: 'wait'
  }]
}, {
  code: 'M-065471',
  name: 'นายประเสริฐ มั่นคงดี',
  citizenId: '3-1006-00189-44-1',
  dept: 'สำนักงานปลัด',
  contracts: [{
    contractNo: 'L-2563-00318',
    type: 'เงินกู้พิเศษเคหะสงเคราะห์',
    purpose: 'ไถ่ถอนจำนองจากสถาบันการเงิน',
    interest: 96310.25,
    certNo: 'IC-2568-004214',
    issuedAt: '2026-01-19',
    tax: 'wait'
  }, {
    contractNo: 'L-2567-01402',
    type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย',
    purpose: '',
    interest: 8640.00,
    certNo: '',
    issuedAt: '',
    tax: 'wait'
  }]
}, {
  code: 'M-058241',
  name: 'นายสมชาย ใจดี รักษ์ออม',
  citizenId: '3-1001-00902-31-7',
  dept: 'กองคลัง',
  contracts: [{
    contractNo: 'L-2566-00975',
    type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย',
    purpose: 'ซื้อห้องชุดในอาคารชุด',
    interest: 33180.40,
    certNo: 'IC-2568-004230',
    issuedAt: '2026-01-19',
    tax: 'wait'
  }]
}, {
  code: 'M-058244',
  name: 'นางวิภา จันทร์เพ็ญ',
  citizenId: '',
  dept: 'กองคลัง',
  contracts: [{
    contractNo: 'L-2565-00733',
    type: 'เงินกู้พิเศษเคหะสงเคราะห์',
    purpose: 'ซื้อที่ดินพร้อมปลูกสร้างบ้าน',
    interest: 58940.10,
    certNo: 'IC-2568-004238',
    issuedAt: '2026-01-19',
    tax: 'wait'
  }]
}, {
  code: 'M-058247',
  name: 'นางสาวกานต์ ศิริวงศ์',
  citizenId: '1-1099-00344-08-2',
  dept: 'กองการศึกษา',
  contracts: [{
    contractNo: 'L-2567-01188',
    type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย',
    purpose: 'เช่าซื้ออาคารพร้อมที่ดิน',
    interest: 21760.00,
    certNo: 'IC-2568-004244',
    issuedAt: '2026-01-20',
    tax: 'wait'
  }]
}, {
  code: 'M-058250',
  name: 'นายธีรพงษ์ ขำเพชร',
  citizenId: '3-1044-00611-77-5',
  dept: 'กองคลัง',
  contracts: [{
    contractNo: 'L-2562-00204',
    type: 'เงินกู้พิเศษเคหะสงเคราะห์',
    purpose: 'ซื้ออาคารพร้อมที่ดิน',
    interest: 104270.85,
    certNo: 'IC-2568-004251',
    issuedAt: '2026-01-20',
    tax: 'wait'
  }, {
    contractNo: 'L-2568-01655',
    type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย',
    purpose: 'ซื้อที่ดินเฉพาะส่วน',
    interest: 5210.30,
    certNo: 'IC-2568-004252',
    issuedAt: '2026-01-20',
    tax: 'wait'
  }]
}, {
  code: 'M-058252',
  name: 'นางสาวจุฬาลักษณ์ ทองดี',
  citizenId: '1-1077-00458-19-3',
  dept: 'สำนักงานปลัด',
  contracts: [{
    contractNo: 'L-2566-01033',
    type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย',
    purpose: 'ปลูกสร้างอาคารบนที่ดินเช่า',
    interest: 27505.60,
    certNo: 'IC-2568-004260',
    issuedAt: '2026-01-20',
    tax: 'wait'
  }]
}];
const TCX_HISTORY = [{
  no: 'RD-2567-0001',
  taxYear: 2567,
  channel: 'ยื่นผ่านอินเทอร์เน็ต (e-Filing)',
  members: 214,
  contracts: 268,
  interest: 8642310.55,
  at: '2025-02-08 10:24',
  by: 'นางจันทร์เพ็ญ มาลี',
  status: 'ok'
}, {
  no: 'RD-2568-0001',
  taxYear: 2568,
  channel: 'ยื่นผ่านอินเทอร์เน็ต (e-Filing)',
  members: 187,
  contracts: 231,
  interest: 7418920.00,
  at: '2026-02-05 09:41',
  by: 'นางจันทร์เพ็ญ มาลี',
  status: 'ok'
}];

// เหตุที่ยังนำส่งไม่ได้
function tcxBlockers(m, c) {
  const b = [];
  if (!c.purpose) b.push('ไม่ได้ระบุวัตถุประสงค์การกู้');
  if (!c.certNo) b.push('ยังไม่ได้ออกหนังสือรับรองดอกเบี้ย');
  if (!m.citizenId) b.push('ไม่มีเลขประจำตัวประชาชนในทะเบียนสมาชิก');
  return b;
}
const TCX_TH = {
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  padding: '9px 12px',
  borderBottom: '1px solid #f0f0f0',
  whiteSpace: 'nowrap'
};
const TCX_TD = {
  padding: '10px 12px',
  borderBottom: '1px solid #f0f0f0',
  verticalAlign: 'top'
};
function TcxPager(p) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px 12px',
      borderTop: '1px solid #f0f0f0'
    }
  }, /*#__PURE__*/React.createElement(IcrPager, p));
}
function TaxCertSubmitPage({
  onToast
}) {
  const audit = React.useContext(window.AuditContext || React.createContext({
    log: () => {}
  }));
  const fmt = window.fmt;
  const [year, setYear] = tcxUseState(2568);
  const [dept, setDept] = tcxUseState('');
  const [includeSent, setIncludeSent] = tcxUseState(false);
  const [minInterest, setMinInterest] = tcxUseState('');
  const [phase, setPhase] = tcxUseState('idle'); // idle | running | done
  const [progress, setProgress] = tcxUseState(0);
  const [step, setStep] = tcxUseState('');
  const [rows, setRows] = tcxUseState([]); // ผลประมวลผล (flatten สัญญา)
  const [sel, setSel] = tcxUseState(() => new Set());
  const [ranAt, setRanAt] = tcxUseState('');
  const [history, setHistory] = tcxUseState(() => TCX_HISTORY.map(h => ({
    ...h
  })).sort((a, b) => a.at < b.at ? 1 : -1));
  const [modal, setModal] = tcxUseState(false);
  const [channel, setChannel] = tcxUseState((window.LOAN_CERT_TAX_CHANNELS || ['ยื่นผ่านอินเทอร์เน็ต (e-Filing)'])[0]);
  const timer = tcxUseRef(null);
  const dvJob = useDvJob(onToast);
  const ce = React.createElement;
  const [pg, setPg] = tcxUseState(1);
  const [per, setPer] = tcxUseState(20);
  const [hpg, setHpg] = tcxUseState(1);
  const [hper, setHper] = tcxUseState(20);
  window.useBreadcrumb && window.useBreadcrumb([{
    label: 'ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร',
    current: true
  }], []);
  tcxUseEffect(() => () => clearInterval(timer.current), []);
  const depts = tcxUseMemo(() => Array.from(new Set(TCX_SEED.map(m => m.dept))), []);
  const build = () => {
    const min = Number(String(minInterest).replace(/[^\d.]/g, '')) || 0;
    const out = [];
    TCX_SEED.forEach(m => {
      if (dept && m.dept !== dept) return;
      m.contracts.forEach(c => {
        if (c.tax === 'sent' && !includeSent) return;
        if (c.interest < min) return;
        const blockers = tcxBlockers(m, c);
        out.push({
          key: m.code + '|' + c.contractNo,
          member: m,
          ...c,
          taxYear: year,
          blockers,
          state: c.tax === 'sent' ? 'sent' : blockers.length ? 'blocked' : 'ready'
        });
      });
    });
    return out;
  };
  const finish = () => {
    const res = build();
    setRows(res);
    setSel(new Set(res.filter(r => r.state === 'ready').map(r => r.key)));
    setRanAt(new Date().toISOString());
    setPg(1);
    setPhase('done');
    onToast && onToast(`ประมวลผลเรียบร้อย — พบ ${res.filter(r => r.state !== 'sent').length} สัญญาที่ต้องนำส่ง`);
  };
  // จำลอง: ปีภาษีเก่าสุด (ข้อมูลย้อนหลัง) ใช้เวลานานจนหมดเวลา → แสดงสถานะโหลดไม่สำเร็จ
  const run = () => {
    if (dvJob.busy) return;
    reset();
    const slow = year === TCX_YEARS[TCX_YEARS.length - 1];
    dvJob.start(finish, slow, slow ? 52480 : 18640);
  };
  const reset = () => {
    clearInterval(timer.current);
    setPhase('idle');
    setRows([]);
    setSel(new Set());
    setProgress(0);
  };

  // จัดกลุ่มตามสมาชิก
  const groups = tcxUseMemo(() => {
    const g = new Map();
    rows.forEach(r => {
      if (!g.has(r.member.code)) g.set(r.member.code, {
        member: r.member,
        items: []
      });
      g.get(r.member.code).items.push(r);
    });
    return Array.from(g.values());
  }, [rows]);
  const readyRows = rows.filter(r => r.state === 'ready');
  const blockedRows = rows.filter(r => r.state === 'blocked');
  const sentRows = rows.filter(r => r.state === 'sent');
  const selRows = rows.filter(r => sel.has(r.key) && r.state === 'ready');
  const selMembers = new Set(selRows.map(r => r.member.code)).size;
  const selInterest = selRows.reduce((s, r) => s + r.interest, 0);
  const toggle = r => {
    if (r.state !== 'ready') return;
    setSel(s => {
      const n = new Set(s);
      n.has(r.key) ? n.delete(r.key) : n.add(r.key);
      return n;
    });
  };
  const toggleGroup = g => {
    const keys = g.items.filter(r => r.state === 'ready').map(r => r.key);
    if (!keys.length) return;
    const allOn = keys.every(k => sel.has(k));
    setSel(s => {
      const n = new Set(s);
      keys.forEach(k => allOn ? n.delete(k) : n.add(k));
      return n;
    });
  };
  const toggleAll = () => {
    const keys = readyRows.map(r => r.key);
    const allOn = keys.length && keys.every(k => sel.has(k));
    setSel(allOn ? new Set() : new Set(keys));
  };
  const submit = () => {
    const seq = String(history.filter(h => h.taxYear === year).length + 1).padStart(4, '0');
    const no = `RD-${year}-${seq}`;
    const at = new Date();
    const stamp = at.toISOString().slice(0, 10) + ' ' + at.toTimeString().slice(0, 5);
    const keys = new Set(selRows.map(r => r.key));
    setRows(rs => rs.map(r => keys.has(r.key) ? {
      ...r,
      state: 'sent',
      tax: 'sent',
      taxAt: at.toISOString().slice(0, 10),
      submitNo: no
    } : r));
    setHistory(h => [{
      no,
      taxYear: year,
      channel,
      members: selMembers,
      contracts: selRows.length,
      interest: selInterest,
      at: stamp,
      by: 'นางจันทร์เพ็ญ มาลี',
      status: 'ok'
    }, ...h]);
    setSel(new Set());
    setModal(false);
    audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร',
      target: no,
      summary: `นำส่งข้อมูลปีภาษี ${year} จำนวน ${selRows.length} สัญญา (${selMembers} ราย) · ${channel}`
    });
    onToast && onToast(`นำส่งข้อมูลเลขที่ ${no} — ${selRows.length} สัญญา / ${selMembers} ราย เรียบร้อยแล้ว`);
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-actions"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 18,
      fontWeight: 600
    }
  }, "ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginTop: 2
    }
  }, "ประมวลผลดอกเบี้ยเงินกู้เพื่อที่อยู่อาศัยตามหนังสือรับรองที่ออกแล้ว แล้วนำส่งข้อมูลให้กรมสรรพากร ตามประกาศอธิบดีกรมสรรพากรฯ (ฉบับที่ 165)")), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), phase === 'done' && /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: reset
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh"
  }), " ล้างข้อมูล"), phase === 'done' && /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => onToast && onToast('ส่งออกชุดข้อมูลนำส่ง (Text File) เรียบร้อย')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download"
  }), " ส่งออกไฟล์นำส่ง"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    disabled: !selRows.length,
    onClick: () => setModal(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload"
  }), " ส่งข้อมูลให้สรรพากร", selRows.length ? ` (${selRows.length})` : ''), /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    disabled: dvJob.busy,
    onClick: run
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check"
  }), " ", dvJob.busy ? 'กำลังประมวล…' : 'ประมวล')), /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      padding: 16,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "เงื่อนไขการประมวลผล")), /*#__PURE__*/React.createElement("div", {
    className: "tcx-crit"
  }, /*#__PURE__*/React.createElement("label", {
    className: "tcx-fld"
  }, /*#__PURE__*/React.createElement("span", null, "ปีภาษี"), /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: year,
    onChange: e => {
      setYear(Number(e.target.value));
      reset();
    }
  }, TCX_YEARS.map(y => /*#__PURE__*/React.createElement("option", {
    key: y,
    value: y
  }, y)))), /*#__PURE__*/React.createElement("label", {
    className: "tcx-fld"
  }, /*#__PURE__*/React.createElement("span", null, "สังกัด"), /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: dept,
    onChange: e => {
      setDept(e.target.value);
      reset();
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "ทุกสังกัด"), depts.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d)))), /*#__PURE__*/React.createElement("label", {
    className: "tcx-fld"
  }, /*#__PURE__*/React.createElement("span", null, "ดอกเบี้ยขั้นต่ำ (บาท)"), /*#__PURE__*/React.createElement("input", {
    className: "cfg-input mono",
    style: {
      textAlign: 'right'
    },
    placeholder: "0.00",
    value: minInterest,
    onChange: e => {
      setMinInterest(e.target.value.replace(/[^\d.,]/g, ''));
      reset();
    }
  })), /*#__PURE__*/React.createElement("label", {
    className: "tcx-fld tcx-chk"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: includeSent,
    onChange: e => {
      setIncludeSent(e.target.checked);
      reset();
    }
  }), /*#__PURE__*/React.createElement("span", null, "แสดงสัญญาที่นำส่งแล้วด้วย")))), /*#__PURE__*/React.createElement(DvJobBanner, {
    job: dvJob.job,
    onStop: dvJob.stop,
    onRetry: run
  }), phase === 'done' && ce("div", {
    className: "search-card",
    style: { padding: 16, marginTop: 12 }
  }, ce("div", { className: "section-head" }, ce("span", { className: "head-bar" }), ce("h3", null, "ผลการประมวลผล")),
  ce("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 } },
    [{ lab: 'สมาชิกที่ต้องนำส่ง (ราย)', val: new Set(rows.filter(r => r.state !== 'sent').map(r => r.member.code)).size },
     { lab: 'สัญญาพร้อมนำส่ง (สัญญา)', val: readyRows.length, color: '#237450' },
     { lab: 'ข้อมูลไม่ครบ (สัญญา)', val: blockedRows.length, color: blockedRows.length ? '#cf1322' : null },
     { lab: 'นำส่งแล้ว (สัญญา)', val: sentRows.length },
     { lab: 'ดอกเบี้ยรวมที่พร้อมนำส่ง (บาท)', val: fmt.money(readyRows.reduce((s, r) => s + r.interest, 0)) }
    ].map((k, i) => ce("div", { key: i, style: { border: '1px solid #f0f0f0', borderRadius: 8, padding: '14px 16px', background: '#fff' } },
      ce("div", { style: { fontSize: 12.5, color: 'rgba(0,0,0,.65)' } }, k.lab),
      ce("div", { style: { fontSize: 22, fontWeight: 700, marginTop: 4, lineHeight: 1.3, color: k.color || 'rgba(0,0,0,.88)', fontVariantNumeric: 'tabular-nums' } }, typeof k.val === 'number' ? k.val.toLocaleString('en-US') : k.val))))),
  phase === 'done' && ce("div", {
    className: "search-card",
    style: { padding: 0, overflow: 'hidden', marginTop: 12 }
  }, ce("div", { className: "section-head", style: { padding: '12px 16px 0' } }, ce("span", { className: "head-bar" }), ce("h3", null, "รายการที่ต้องนำส่ง — ปีภาษี ", year)),
  ce("div", { style: { padding: '16px 16px 0' } }, ce("div", { style: { overflowX: 'auto' } },
    ce("table", { style: { width: '100%', minWidth: 1120, borderCollapse: 'collapse', fontSize: 13 } },
      ce("thead", null, ce("tr", { style: { background: '#fafafa', color: 'rgba(0,0,0,.65)' } },
        ce("th", { style: { ...TCX_TH, width: 40, textAlign: 'center' } }, ce("input", { type: "checkbox", "aria-label": "เลือกทั้งหมดที่พร้อมนำส่ง", checked: readyRows.length > 0 && readyRows.every(r => sel.has(r.key)), disabled: !readyRows.length, onChange: toggleAll })),
        ce("th", { style: { ...TCX_TH, width: 130 } }, "เลขที่สัญญา"),
        ce("th", { style: { ...TCX_TH, minWidth: 220 } }, "สมาชิก"),
        ce("th", { style: { ...TCX_TH, width: 120 } }, "สังกัด"),
        ce("th", { style: { ...TCX_TH, minWidth: 180 } }, "ประเภทสัญญา"),
        ce("th", { style: { ...TCX_TH, minWidth: 220 } }, "วัตถุประสงค์การกู้"),
        ce("th", { style: { ...TCX_TH, width: 130, textAlign: 'right' } }, "ดอกเบี้ยที่รับรอง"),
        ce("th", { style: { ...TCX_TH, width: 150 } }, "เลขที่หนังสือรับรอง"),
        ce("th", { style: { ...TCX_TH, width: 120, textAlign: 'center' } }, "สถานะนำส่ง"))),
      ce("tbody", null, rows.length === 0 && ce("tr", null, ce("td", { colSpan: 9, style: { ...TCX_TD, textAlign: 'center', color: 'rgba(0,0,0,.55)', padding: '28px 12px' } }, "ไม่พบสัญญาที่ต้องนำส่งตามเงื่อนไข")),
        rows.slice((pg - 1) * per, pg * per).map(r => ce("tr", { key: r.key },
          ce("td", { style: { ...TCX_TD, textAlign: 'center' } }, ce("input", { type: "checkbox", "aria-label": "เลือก " + r.contractNo, checked: sel.has(r.key), disabled: r.state !== 'ready', onChange: () => toggle(r) })),
          ce("td", { style: { ...TCX_TD, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12, color: 'rgba(0,0,0,.65)' } }, r.contractNo),
          ce("td", { style: TCX_TD }, ce("span", { style: { display: 'block', fontWeight: 600, color: 'rgba(0,0,0,.88)' } }, r.member.name),
            ce("span", { style: { display: 'block', fontSize: 11, color: 'rgba(0,0,0,.55)', marginTop: 3 } }, r.member.code, r.member.citizenId ? ' · เลขปชช. ' + r.member.citizenId : ' · ไม่มีเลขประจำตัวประชาชน')),
          ce("td", { style: TCX_TD }, r.member.dept),
          ce("td", { style: TCX_TD }, r.type),
          ce("td", { style: TCX_TD }, r.purpose || ce("span", { style: { color: 'rgba(0,0,0,.45)' } }, "—"),
            r.blockers.length > 0 && r.blockers.map((b, i) => ce("span", { key: i, style: { display: 'block', fontSize: 11, color: '#cf1322', marginTop: 3 } }, "\xB7 ", b))),
          ce("td", { style: { ...TCX_TD, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } }, fmt.money(r.interest)),
          ce("td", { style: { ...TCX_TD, fontSize: 12 } }, r.certNo || ce("span", { style: { color: 'rgba(0,0,0,.45)' } }, "—"),
            r.issuedAt && ce("span", { style: { display: 'block', fontSize: 11, color: 'rgba(0,0,0,.55)', marginTop: 3 } }, "ออกเมื่อ ", fmt.date(r.issuedAt))),
          ce("td", { style: { ...TCX_TD, textAlign: 'center' } }, r.state === 'sent' ? ce("span", { className: "pill ok" }, "นำส่งแล้ว") : r.state === 'blocked' ? ce("span", { className: "pill bad" }, "ข้อมูลไม่ครบ") : ce("span", { className: "pill info" }, "พร้อมนำส่ง")))))))),
  ce(TcxPager, {
    total: rows.length,
    page: pg,
    pageCount: Math.max(1, Math.ceil(rows.length / per)),
    per: per,
    onPage: setPg,
    onPer: n => { setPer(n); setPg(1); }
  })),
  phase === 'done' && ce("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, fontSize: 11.5, color: 'rgba(0,0,0,.55)', lineHeight: 1.55 } },
    ce("span", { style: { display: 'inline-flex', flexShrink: 0, marginTop: 2 } }, ce(Icon, { name: "info", size: 12 })),
    ce("span", null, "เลือกได้เฉพาะสัญญาที่ “พร้อมนำส่ง” — สัญญาที่ข้อมูลไม่ครบต้องแก้ที่หน้าวัตถุประสงค์การกู้หรือทะเบียนสมาชิกก่อน", selRows.length > 0 && ce(React.Fragment, null, " \xB7 เลือกแล้ว ", selRows.length, " สัญญา / ", selMembers, " ราย \xB7 ดอกเบี้ยรวม ", fmt.money(selInterest), " บาท"))), phase === 'idle' && !dvJob.job && /*#__PURE__*/React.createElement("div", {
    className: "search-card tcx-empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tcx-empty-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "report",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    className: "tcx-empty-t"
  }, "ยังไม่ได้ประมวลผล"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, "เลือกปีภาษีและเงื่อนไข แล้วกด \u201Cประมวลผล\u201D เพื่อให้ระบบดึงข้อมูลสมาชิกและสัญญาที่ต้องนำส่งกรมสรรพากร")), /*#__PURE__*/React.createElement("div", {
    className: "search-card",
    style: {
      padding: 0,
      overflow: 'hidden',
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      padding: '12px 14px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "ประวัติการนำส่งข้อมูลกรมสรรพากร")), /*#__PURE__*/React.createElement("div", {
    className: "table-scroll",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 860
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "เลขที่นำส่ง"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 80
    }
  }, "ปีภาษี"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 220
    }
  }, "ช่องทางนำส่ง"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 90
    }
  }, "สมาชิก"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 90
    }
  }, "สัญญา"), /*#__PURE__*/React.createElement("th", {
    className: "right",
    style: {
      width: 140
    }
  }, "ดอกเบี้ยรวม"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "วันเวลานำส่ง"), /*#__PURE__*/React.createElement("th", {
    className: "center",
    style: {
      width: 100
    }
  }, "สถานะ"))), /*#__PURE__*/React.createElement("tbody", null, history.slice((hpg - 1) * hper, hpg * hper).map(h => /*#__PURE__*/React.createElement("tr", {
    key: h.no
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      fontSize: 11.5
    }
  }, h.no), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, h.taxYear), /*#__PURE__*/React.createElement("td", null, h.channel, /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, "ผู้นำส่ง ", h.by)), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, h.members), /*#__PURE__*/React.createElement("td", {
    className: "center mono"
  }, h.contracts), /*#__PURE__*/React.createElement("td", {
    className: "right mono"
  }, fmt.money(h.interest)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      fontSize: 11.5
    }
  }, h.at), /*#__PURE__*/React.createElement("td", {
    className: "center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, "สำเร็จ"))))))), /*#__PURE__*/React.createElement(TcxPager, {
    total: history.length,
    page: hpg,
    pageCount: Math.max(1, Math.ceil(history.length / hper)),
    per: hper,
    onPage: setHpg,
    onPer: n => {
      setHper(n);
      setHpg(1);
    }
  })), modal && /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onMouseDown: e => e.target === e.currentTarget && setModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    role: "dialog",
    "aria-modal": "true",
    style: {
      width: 560,
      maxWidth: '94vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("h2", null, "ยืนยันการนำส่งข้อมูลกรมสรรพากร"), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: () => setModal(false),
    "aria-label": "ปิด"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12,
      marginBottom: 12
    }
  }, "ระบบจะนำส่งข้อมูลดอกเบี้ยเงินกู้ตามหนังสือรับรองที่ออกแล้ว ให้กรมสรรพากร และบันทึกสถานะ \u201Cนำส่งแล้ว\u201D ให้สัญญาที่เลือก"), /*#__PURE__*/React.createElement("div", {
    className: "lpc-tax-sum"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "ปีภาษี"), /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, year)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "จำนวนสมาชิก"), /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, selMembers, " ราย")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "จำนวนสัญญา"), /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, selRows.length, " สัญญา")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "ดอกเบี้ยรวม"), /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, fmt.money(selInterest), " บาท"))), /*#__PURE__*/React.createElement("label", {
    className: "tcx-fld",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, "ช่องทางนำส่ง"), /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: channel,
    onChange: e => setChannel(e.target.value)
  }, (window.LOAN_CERT_TAX_CHANNELS || ['ยื่นผ่านอินเทอร์เน็ต (e-Filing)']).map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }, c)))), blockedRows.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 12
  }), " ยังมี ", blockedRows.length, " สัญญาที่ข้อมูลไม่ครบและจะไม่ถูกนำส่งในครั้งนี้")), /*#__PURE__*/React.createElement("div", {
    className: "modal-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => setModal(false)
  }, "ยกเลิก"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: submit
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload"
  }), " ยืนยันนำส่ง")))));
}
Object.assign(window, {
  TaxCertSubmitPage
});