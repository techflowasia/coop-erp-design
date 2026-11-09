// ════════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ปันผล–เฉลี่ยคืน  (Level 2)
//    · ประมาณปันผล                    (process/dividend-estimate)
//    · ประมวลปันผล                    (process/dividend-process)
//    · ประมวลตั้งค่าคีย์ปันผลเฉลี่ยคืน    (process/dividend-key-setup)
//  ใช้คอมโพเนนต์ร่วมกับ 441-closing.js (ClHead / ClSec / ClFld / ClRO / ClResult)
// ════════════════════════════════════════════════════════════════════

const dvPct = v => (Number(v) || 0).toFixed(2) + '%';
const dvYears = () => {
  const y = clBE();
  return [y, y - 1, y - 2, y - 3, y - 4].map(String);
};

// ─── แถบสถานะการประมวลผล: กำลังโหลด (หยุดได้) / Timeout ─────────────
const DV_TIMEOUT_SEC = 15;
function DvJobBanner({ job, onStop, onRetry }) {
  if (!job) return null;
  const h = React.createElement;
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const fmt = (v) => Number(v).toLocaleString('en-US');
  const box = { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 8, marginTop: 12, fontSize: 14, fontWeight: 600 };
  const total = job.total || 0, done = Math.min(job.n || 0, total);
  const pct = total ? Math.floor(done * 100 / total) : 0;
  const progress = total ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 } },
    h('div', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done, style: { flex: 1, height: 8, borderRadius: 4, background: job.state === 'timeout' ? '#ffccc7' : '#d6e4ff', overflow: 'hidden' } },
      h('div', { style: { width: pct + '%', height: '100%', background: job.state === 'timeout' ? '#ff4d4f' : '#1677ff', borderRadius: 4, transition: 'width .25s linear' } })),
    h('span', { className: 'mono', style: { fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }, fmt(done) + ' / ' + fmt(total)),
    h('span', { className: 'mono', style: { fontWeight: 600, minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } }, pct + '%')) : null;
  if (job.state === 'timeout') {
    return h('div', { role: 'alert', style: { ...box, display: 'block', background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', style: { flex: 'none' } },
          h('path', { d: 'M8 2.2 14.2 13H1.8L8 2.2ZM8 6.5v3M8 11.2v.2' })),
        h('span', { style: { flex: 1 } }, 'โหลดข้อมูลไม่สำเร็จ เนื่องจากใช้เวลานานเกินกำหนด'),
        h('button', { className: 'btn primary sm', onClick: onRetry }, h(Icon, { name: 'refresh', size: 13 }), ' ลองอีกครั้ง')),
      progress);
  }
  return h('div', { role: 'status', style: { ...box, display: 'block', background: '#f0f5ff', border: '1px solid #adc6ff', color: 'rgba(0,0,0,.88)' } },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
      h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: '#1677ff', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', style: { flex: 'none' } },
        h('path', { d: 'M8 4.5V8l2.5 1.5M2.2 8a5.8 5.8 0 1 0 11.6 0A5.8 5.8 0 0 0 2.2 8Z' })),
      h('span', { style: { flex: 1 } }, 'กำลังประมวลผลข้อมูลจำนวนมาก อาจใช้เวลาหลายนาที กรุณาอย่าปิดหน้านี้'),
      h('span', { style: { fontWeight: 400, color: 'rgba(0,0,0,.65)', whiteSpace: 'nowrap' } }, 'ผ่านไป ', h('b', { className: 'mono', style: { color: 'rgba(0,0,0,.88)' } }, mmss(job.sec))),
      h('button', { className: 'btn sm', onClick: onStop }, h(Icon, { name: 'close', size: 13 }), ' หยุดประมวลผล')),
    progress);
}

function useDvJob(onToast) {
  const [job, setJob] = React.useState(null);
  const ref = React.useRef(null);
  const clear = () => { const j = ref.current; if (j) { clearInterval(j.tick); clearTimeout(j.done); ref.current = null; } };
  React.useEffect(() => clear, []);
  // จำลอง: ปกติเสร็จใน 4 วินาที · slow = เดินช้าจนหมดเวลา (ถึงราว 40%)
  const start = (fn, slow, total) => {
    clear();
    const t0 = Date.now(), N = total || 0, DUR = 4000;
    const nAt = (ms) => Math.floor(N * (slow ? Math.min(0.4, ms / (DV_TIMEOUT_SEC * 1000) * 0.4) : Math.min(1, ms / DUR)));
    setJob({ state: 'loading', sec: 0, n: 0, total: N });
    const tick = setInterval(() => {
      const ms = Date.now() - t0, sec = Math.floor(ms / 1000);
      if (sec >= DV_TIMEOUT_SEC) { clear(); setJob({ state: 'timeout', sec, n: nAt(ms), total: N }); return; }
      setJob({ state: 'loading', sec, n: nAt(ms), total: N });
    }, 250);
    const done = slow ? null : setTimeout(() => { clear(); setJob(null); fn(); }, DUR);
    ref.current = { tick, done };
  };
  const stop = () => { clear(); setJob(null); onToast && onToast('หยุดการประมวลผลแล้ว'); };
  return { job, start, stop, busy: !!job && job.state === 'loading' };
}

// ════════════════════════════════════════════════════════════════════
//  ① ประมาณปันผล — เลือกช่วงอัตราเพื่อประมาณการปันผล/เฉลี่ยคืน
// ════════════════════════════════════════════════════════════════════
function DividendEstimatePage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE() - 1));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [divFrom, setDivFrom] = useState('4.00');
  const [divTo, setDivTo] = useState('5.00');
  const [divStep, setDivStep] = useState('0.25');
  const [rbFrom, setRbFrom] = useState('8.00');
  const [rbTo, setRbTo] = useState('12.00');
  const [rbStep, setRbStep] = useState('2.00');
  const [source, setSource] = useState('ประมวลจากข้อมูลปัจจุบัน');
  const [matrix, setMatrix] = useState(null);
  const [result, setResult] = useState(null);
  const SHARE_BASE = 1842500000; // ทุนเรือนหุ้นเฉลี่ยทั้งสหกรณ์
  const INT_BASE = 268400000; // ดอกเบี้ยเงินกู้รับทั้งปี
  const PROFIT = 172400000; // กำไรสุทธิประมาณการ

  const compute = () => {
    const ds = [],
      rs = [];
    for (let d = Number(divFrom); d <= Number(divTo) + 1e-9; d += Number(divStep) || 1) ds.push(Number(d.toFixed(2)));
    for (let r = Number(rbFrom); r <= Number(rbTo) + 1e-9; r += Number(rbStep) || 1) rs.push(Number(r.toFixed(2)));
    const cells = [];
    ds.forEach(d => rs.forEach(r => {
      const div = SHARE_BASE * d / 100;
      const reb = INT_BASE * r / 100;
      cells.push({
        div: d,
        reb: r,
        divAmt: div,
        rebAmt: reb,
        total: div + reb,
        left: PROFIT - div - reb
      });
    }));
    setMatrix({
      ds,
      rs,
      cells
    });
    const failed = cells.filter(c => c.left < 0).length;
    const r = clRun({
      no: `DVE${year.slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps: [{
        label: 'ดึงฐานทุนเรือนหุ้นและดอกเบี้ยรับ',
        total: 8420,
        failed: 0
      }, {
        label: `คำนวณประมาณการ ${ds.length} × ${rs.length} อัตรา`,
        total: cells.length,
        failed,
        refPrefix: 'EST-',
        reason: 'ยอดจัดสรรเกินกำไรสุทธิประมาณการ'
      }, {
        label: 'จัดเตรียมไฟล์ Excel สำหรับดาวน์โหลด',
        total: 1,
        failed: 0
      }]
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมาณปันผล',
      target: `ปีปันผล ${year}`,
      summary: `${r.no} · ประมาณการ ${cells.length} กรณี · เกินกำไรสุทธิ ${failed} กรณี`
    });
    onToast && onToast(`ประมาณการปันผล–เฉลี่ยคืน ${cells.length} กรณี เรียบร้อยแล้ว`);
  };
  const reset = () => {
    setMatrix(null);
    setResult(null);
  };

  const dvJob = useDvJob(onToast);
  const job = dvJob.job, stopJob = dvJob.stop;
  // จำลอง: "ประมวลจากข้อมูลสิ้นปีบัญชี" ใช้เวลานานจนหมดเวลา (Timeout)
  const run = () => { reset(); dvJob.start(compute, source === 'ประมวลจากข้อมูลสิ้นปีบัญชี', 8420); };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E1B\u0E31\u0E19\u0E1C\u0E25"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "shares",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E31\u0E19\u0E1C\u0E25\u2013\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19 \u2014 \u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19\u0E15\u0E32\u0E21\u0E0A\u0E48\u0E27\u0E07\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run,
    disabled: job && job.state === 'loading'
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: reset
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      disabled: !matrix,
      onClick: () => onToast && onToast('กำลังเตรียมไฟล์ Excel ประมาณการปันผล…')
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 13
    }), " \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 Excel"))
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E1B\u0E31\u0E19\u0E1C\u0E25 \u2013 \u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E35\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: year,
    onChange: e => {
      setYear(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E04\u0E34\u0E14\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: from,
    onChange: e => {
      setFrom(e.target.value);
      reset();
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: to,
    onChange: e => {
      setTo(e.target.value);
      reset();
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25",
    w: 230
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: source,
    onChange: e => {
      setSource(e.target.value);
      reset();
    }
  }, ['ประมวลจากข้อมูลปัจจุบัน', 'ประมวลจากข้อมูลสิ้นปีบัญชี', 'ประมวลจากข้อมูลที่ตั้งไว้'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o))))), /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "\u0E0A\u0E48\u0E27\u0E07\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E1B\u0E31\u0E19\u0E1C\u0E25 (\u0E2B\u0E38\u0E49\u0E19)")), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E40\u0E23\u0E34\u0E48\u0E21 rate \u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: divFrom,
    onChange: e => {
      setDivFrom(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14 rate \u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: divTo,
    onChange: e => {
      setDivTo(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "Step \u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: divStep,
    onChange: e => {
      setDivStep(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, "\u0E0A\u0E48\u0E27\u0E07\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19")), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E40\u0E23\u0E34\u0E48\u0E21 rate \u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19",
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: rbFrom,
    onChange: e => {
      setRbFrom(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14 rate \u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19",
    w: 170
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: rbTo,
    onChange: e => {
      setRbTo(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "Step \u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: rbStep,
    onChange: e => {
      setRbStep(e.target.value);
      reset();
    },
    style: {
      textAlign: 'right'
    }
  })))), matrix && /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E01\u0E32\u0E23",
    style: {
      marginTop: 12
    },
    hint: `กำไรสุทธิประมาณการ ${clMoney(PROFIT)} บาท · ทุนเรือนหุ้นเฉลี่ย ${clMoney(SHARE_BASE)} บาท · ดอกเบี้ยเงินกู้รับ ${clMoney(INT_BASE)} บาท`
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
      minWidth: 110
    }
  }, "\u0E1B\u0E31\u0E19\u0E1C\u0E25"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 110
    }
  }, "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 150
    }
  }, "\u0E22\u0E2D\u0E14\u0E1B\u0E31\u0E19\u0E1C\u0E25"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 150
    }
  }, "\u0E22\u0E2D\u0E14\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 160
    }
  }, "\u0E23\u0E27\u0E21\u0E08\u0E31\u0E14\u0E2A\u0E23\u0E23"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 160
    }
  }, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E08\u0E32\u0E01\u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34"))), /*#__PURE__*/React.createElement("tbody", null, matrix.cells.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, dvPct(c.div)), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, dvPct(c.reb)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, clMoney(c.divAmt)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, clMoney(c.rebAmt)), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, clMoney(c.total)), /*#__PURE__*/React.createElement("td", {
    className: "num mono",
    style: c.left < 0 ? {
      color: 'var(--error, #ff4d4f)',
      fontWeight: 600
    } : undefined
  }, clMoney(c.left)))))))), React.createElement(DvJobBanner, { job: job, onStop: stopJob, onRetry: run }), /*#__PURE__*/React.createElement(ClResult, {
    result: result,
    unit: "\u0E01\u0E23\u0E13\u0E35"
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ② ประมวลปันผล
// ════════════════════════════════════════════════════════════════════
function DividendProcessRunPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const [year, setYear] = useState(String(clBE() - 1));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [divRate, setDivRate] = useState('4.75');
  const [rebRate, setRebRate] = useState('10.00');
  const [source, setSource] = useState('ประมวลจากข้อมูลปัจจุบัน');
  const [setAffil, setSetAffil] = useState(true);
  const [postDiv, setPostDiv] = useState(false);
  const [postNoCalc, setPostNoCalc] = useState(false);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const compute = () => {
    const steps = [{
      label: 'คำนวณปันผลตามทุนเรือนหุ้น',
      total: 8420,
      failed: 6,
      refPrefix: 'DIV-',
      reason: ['ไม่พบยอดหุ้นสะสมของสมาชิก', 'สมาชิกลาออกก่อนวันปิดบัญชี']
    }, {
      label: 'คำนวณเฉลี่ยคืนตามดอกเบี้ยที่ชำระ',
      total: 5311,
      failed: 4,
      refPrefix: 'RBT-',
      reason: ['ไม่พบดอกเบี้ยที่ชำระในปีบัญชี', 'สัญญาอยู่ในสถานะดำเนินคดี']
    }];
    if (setAffil) steps.push({
      label: 'ตั้งสังกัดปันผล',
      total: 8420,
      failed: 3,
      refPrefix: 'AFF-',
      reason: 'ไม่พบรหัสสังกัดของสมาชิก'
    });
    if (postDiv) steps.push({
      label: 'ผ่านรายการปันผลเข้าทะเบียน',
      total: 8420,
      failed: 2,
      refPrefix: 'DIV-',
      reason: 'ทะเบียนสมาชิกถูกล็อกโดยผู้ใช้อื่น'
    });
    if (postNoCalc) steps.push({
      label: 'ผ่านรายการโดยไม่คำนวณ',
      total: 8420,
      failed: 0
    });
    const shareBase = 1842500000,
      intBase = 268400000;
    const divAmt = shareBase * Number(divRate) / 100;
    const rebAmt = intBase * Number(rebRate) / 100;
    setSummary([{
      label: 'ทุนเรือนหุ้นเฉลี่ยที่ใช้คิดปันผล',
      value: shareBase
    }, {
      label: `ยอดปันผลรวม (${dvPct(divRate)})`,
      value: divAmt
    }, {
      label: 'ดอกเบี้ยเงินกู้รับที่ใช้คิดเฉลี่ยคืน',
      value: intBase
    }, {
      label: `ยอดเฉลี่ยคืนรวม (${dvPct(rebRate)})`,
      value: rebAmt
    }, {
      label: 'รวมจัดสรรปันผล–เฉลี่ยคืน',
      value: divAmt + rebAmt
    }]);
    const r = clRun({
      no: `DVP${year.slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลปันผล',
      target: `ปีปันผล ${year}`,
      summary: `${r.no} · ปันผล ${dvPct(divRate)} · เฉลี่ยคืน ${dvPct(rebRate)} · ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`ประมวลผลปันผล–เฉลี่ยคืน ปี ${year} เรียบร้อยแล้ว`);
  };

  const dvJob = useDvJob(onToast);
  // จำลอง: "ประมวลจากข้อมูลสิ้นปีบัญชี" ใช้เวลานานจนหมดเวลา (Timeout)
  const run = () => { setResult(null); setSummary(null); dvJob.start(compute, source === 'ประมวลจากข้อมูลสิ้นปีบัญชี', 8420); };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1B\u0E31\u0E19\u0E1C\u0E25"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "shares",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E31\u0E19\u0E1C\u0E25\u2013\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19 \u2014 \u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E25\u0E30\u0E1C\u0E48\u0E32\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: run,
    disabled: dvJob.busy
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        setResult(null);
        setSummary(null);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " \u0E25\u0E49\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E1B\u0E31\u0E19\u0E1C\u0E25 \u2013 \u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E35\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 150,
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
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E1B\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: from,
    onChange: e => {
      setFrom(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E1B\u0E35\u0E1A\u0E31\u0E0D\u0E0A\u0E35",
    w: 180
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: "date",
    value: to,
    onChange: e => {
      setTo(e.target.value);
      setResult(null);
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "% \u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 140,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: divRate,
    onChange: e => {
      setDivRate(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "% \u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19",
    w: 140,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: rebRate,
    onChange: e => {
      setRebRate(e.target.value);
      setResult(null);
    },
    style: {
      textAlign: 'right'
    }
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25",
    w: 230
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: source,
    onChange: e => {
      setSource(e.target.value);
      setResult(null);
    }
  }, ['ประมวลจากข้อมูลปัจจุบัน', 'ประมวลจากข้อมูลสิ้นปีบัญชี', 'ประมวลจากข้อมูลที่ตั้งไว้'].map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      display: 'grid',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    checked: setAffil,
    onChange: v => {
      setSetAffil(v);
      setResult(null);
    }
  }), /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E1C\u0E48\u0E32\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    checked: postDiv,
    onChange: v => {
      setPostDiv(v);
      setResult(null);
    }
  }), /*#__PURE__*/React.createElement(ClCheck, {
    label: "\u0E1C\u0E48\u0E32\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E04\u0E33\u0E19\u0E27\u0E13",
    note: "\u0E43\u0E0A\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1C\u0E48\u0E32\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27",
    checked: postNoCalc,
    onChange: v => {
      setPostNoCalc(v);
      setResult(null);
    }
  }))), summary && /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E2A\u0E23\u0E38\u0E1B\u0E22\u0E2D\u0E14\u0E08\u0E31\u0E14\u0E2A\u0E23\u0E23",
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
      minWidth: 300
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 180
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)"))), /*#__PURE__*/React.createElement("tbody", null, summary.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.label
  }, /*#__PURE__*/React.createElement("td", null, s.label), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, clMoney(s.value)))))))), React.createElement(DvJobBanner, { job: dvJob.job, onStop: dvJob.stop, onRetry: run }), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}

// ════════════════════════════════════════════════════════════════════
//  ③ ประมวลตั้งค่าคีย์ปันผลเฉลี่ยคืน
// ════════════════════════════════════════════════════════════════════
const DV_KEY_CONDS = ['ตั้งปันผลเฉลี่ยคืนยกมา', 'ตั้งคีย์ปันผลเฉลี่ยคืนใหม่ทั้งหมด', 'ตั้งเฉพาะสมาชิกที่ยังไม่มีคีย์', 'ล้างคีย์ปันผลเฉลี่ยคืนของปี'];
function DividendKeySetupPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = clAudit();
  const years = dvYears();
  const [cond, setCond] = useState(DV_KEY_CONDS[0]);
  const [divYear, setDivYear] = useState(years[0]);
  const [baseYear, setBaseYear] = useState(years[1]);
  const [result, setResult] = useState(null);
  const compute = () => {
    const clearing = cond.startsWith('ล้าง');
    const steps = [{
      label: 'ตรวจสอบทะเบียนสมาชิกที่มีสิทธิ์',
      total: 8420,
      failed: 0
    }, {
      label: clearing ? `ล้างคีย์ปันผล–เฉลี่ยคืน ปี ${divYear}` : `ตั้งค่าคีย์ปันผล–เฉลี่ยคืน ปี ${divYear} จากปี ${baseYear}`,
      total: 8420,
      failed: clearing ? 1 : 7,
      refPrefix: 'KEY-',
      reason: ['ไม่พบคีย์ปันผลของปีตั้งต้น', 'สมาชิกเข้าใหม่ระหว่างปี ไม่มียอดยกมา', 'คีย์ซ้ำกับที่ตั้งไว้แล้ว']
    }, {
      label: 'บันทึกคีย์เข้าทะเบียนปันผล',
      total: 8420,
      failed: 0
    }];
    const r = clRun({
      no: `DVK${divYear.slice(-2)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      steps
    });
    setResult(r);
    audit && audit.log && audit.log({
      action: 'process',
      module: 'ประมวลผลและจัดเก็บ — ประมวลตั้งค่าคีย์ปันผลเฉลี่ยคืน',
      target: `ปีปันผล ${divYear} · ปีตั้งต้น ${baseYear}`,
      summary: `${r.no} · ${cond} · ${r.total} เคส · ไม่ผ่าน ${r.failed}`
    });
    onToast && onToast(`${cond} ปี ${divYear} เรียบร้อยแล้ว`);
  };

  const dvJob = useDvJob(onToast);
  // จำลอง: เงื่อนไข "ล้างคีย์…" ใช้เวลานานจนหมดเวลา (Timeout)
  const run = () => { setResult(null); dvJob.start(compute, cond.startsWith('ล้าง'), 42376); };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E04\u0E35\u0E22\u0E4C\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19"
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: "shares",
    title: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E04\u0E35\u0E22\u0E4C\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19",
    subtitle: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A \xB7 \u0E1B\u0E31\u0E19\u0E1C\u0E25\u2013\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19 \u2014 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E04\u0E35\u0E22\u0E4C\u0E1B\u0E31\u0E19\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E04\u0E37\u0E19\u0E22\u0E01\u0E21\u0E32\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E1B\u0E35",
    actions: /*#__PURE__*/React.createElement(ClRunBtn, {
      label: "\u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25",
      onClick: run,
      disabled: dvJob.busy
    })
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E04\u0E35\u0E22\u0E4C"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02",
    w: 280,
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: cond,
    onChange: e => {
      setCond(e.target.value);
      setResult(null);
    }
  }, DV_KEY_CONDS.map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E35\u0E1B\u0E31\u0E19\u0E1C\u0E25",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: divYear,
    onChange: e => {
      setDivYear(e.target.value);
      setResult(null);
    }
  }, years.map(y => /*#__PURE__*/React.createElement("option", {
    key: y
  }, y)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1B\u0E35\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: baseYear,
    disabled: cond.startsWith('ล้าง'),
    onChange: e => {
      setBaseYear(e.target.value);
      setResult(null);
    }
  }, years.map(y => /*#__PURE__*/React.createElement("option", {
    key: y
  }, y)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    w: 180
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: (window.LOGIN_USER && window.LOGIN_USER.name) || '—'
  })))), React.createElement(DvJobBanner, { job: dvJob.job, onStop: dvJob.stop, onRetry: run }), /*#__PURE__*/React.createElement(ClResult, {
    result: result
  }));
}