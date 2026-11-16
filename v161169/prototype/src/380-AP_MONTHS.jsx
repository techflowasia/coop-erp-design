// override 366 — วันที่ใบเสร็จ / วันที่ทำรายการ ใช้ช่องวันที่ไทยชุดเดียวกับหน้ารับชำระตัวแทน
(function () {
// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ประมวลผลลูกหนี้ตัวแทน
//  ประมวลผลประจำเดือนเพื่อสร้างทะเบียนลูกหนี้ตัวแทนตามสังกัด —
//  เลือกปี/เดือน + ช่วงข้อมูล → ดึงข้อมูล → รายงานสรุปยอดตั้งตัวแทนรายสังกัด
// ════════════════════════════════════════════════════════════════════
const { useState: apUseState, useMemo: apUseMemo } = React;

const AP_MONTHS = [
  { v: '01', l: 'มกราคม' }, { v: '02', l: 'กุมภาพันธ์' }, { v: '03', l: 'มีนาคม' },
  { v: '04', l: 'เมษายน' }, { v: '05', l: 'พฤษภาคม' }, { v: '06', l: 'มิถุนายน' },
  { v: '07', l: 'กรกฎาคม' }, { v: '08', l: 'สิงหาคม' }, { v: '09', l: 'กันยายน' },
  { v: '10', l: 'ตุลาคม' }, { v: '11', l: 'พฤศจิกายน' }, { v: '12', l: 'ธันวาคม' },
];

// ─── สังกัดลูกหนี้ตัวแทน + ยอดเรียกเก็บ/ยอดหักโอน (ข้อมูลตัวอย่างประจำงวด) ──
const AP_UNITS = [
  { code: '0101', name: 'กองเกษียณ',                                       collect: 151846796.73, deduct: 0 },
  { code: '0102', name: 'สอ.กสท.',                                         collect: 1419497.23,   deduct: 0 },
  { code: '0105', name: 'สหกรณ์ร้านค้า',                                    collect: 24876.50,     deduct: 0 },
  { code: '0106', name: 'กทช.',                                            collect: 7061242.84,   deduct: 0 },
  { code: '0107', name: 'ปณท.',                                            collect: 331923824.22, deduct: 0 },
  { code: '0108', name: 'กสท.',                                            collect: 64595294.91,  deduct: 0 },
  { code: '0109', name: 'กทช.(กระทรวง ICT )',                               collect: 24464.50,     deduct: 0 },
  { code: '0110', name: 'บริษัท ไปรษณีย์ไทย ดิสทริบิวชั่น จำกัด',            collect: 47794.50,     deduct: 0 },
  { code: '0111', name: 'สมทบเครือญาติ',                                    collect: 50550.00,     deduct: 0 },
  { code: '0112', name: 'สมาชิกสมทบ ปณท',                                   collect: 399650.00,    deduct: 0 },
  { code: '0113', name: 'สมาชิกสมทบ ไปรษณีย์ไทย ดิสทริบิวชั่น',             collect: 2000.00,      deduct: 0 },
];

const apToday = () => new Date().toISOString().slice(0, 10);
// วันที่แบบไทย dd/mm/พ.ศ.
const apThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};
const apNow = () => {
  const n = new Date();
  const hh = String(((n.getHours() + 11) % 12) + 1).padStart(2, '0');
  const mm = String(n.getMinutes()).padStart(2, '0');
  const ss = String(n.getSeconds()).padStart(2, '0');
  const ap = n.getHours() >= 12 ? 'pm' : 'am';
  return `${apThaiDate(apToday())} เวลา ${hh}:${mm}:${ss} ${ap}`;
};
// กรองตามช่วงรหัสสังกัด เช่น "0101, 0107" หรือ "0105 - 0110"
const apInRange = (code, spec) => {
  const c = parseInt(code, 10);
  return spec.split(',').some(part => {
    const seg = part.trim();
    if (!seg) return false;
    const m = seg.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { const lo = parseInt(m[1], 10), hi = parseInt(m[2], 10); return c >= lo && c <= hi; }
    return parseInt(seg, 10) === c;
  });
};

function AgentProcessPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ประมวลผลลูกหนี้ตัวแทน', current: true }], []);

  const [year, setYear] = apUseState('2569');
  const [month, setMonth] = apUseState('07');
  const [receiptDate, setReceiptDate] = apUseState(apToday());
  const [txnDate, setTxnDate] = apUseState(apToday());
  const [rangeMode, setRangeMode] = apUseState('all');   // all | range
  const [rangeText, setRangeText] = apUseState('');
  const [report, setReport] = apUseState(null);          // ผลการประมวลผล (snapshot)

  const period = `${year}${month}`;                       // งวดเรียกเก็บ เช่น 256907

  const pull = () => {
    if (rangeMode === 'range' && !rangeText.trim()) {
      onToast && onToast('กรุณาระบุช่วงข้อมูลที่ต้องการประมวลผล');
      return;
    }
    const rows = AP_UNITS
      .filter(u => rangeMode === 'all' || apInRange(u.code, rangeText))
      .map(u => ({ ...u, set: u.collect - u.deduct }));
    if (rows.length === 0) {
      onToast && onToast('ไม่พบข้อมูลตามช่วงที่ระบุ');
      return;
    }
    setReport({
      period, monthLabel: (AP_MONTHS.find(m => m.v === month) || {}).l, year,
      receiptDate, txnDate, printedAt: apNow(), rows,
    });
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — ประมวลผลลูกหนี้ตัวแทน',
      target: `งวด ${period}`, summary: `ประมวลผลสร้างทะเบียนลูกหนี้ตัวแทน งวด ${period} (${rows.length} สังกัด)`,
    });
    onToast && onToast(`ดึงข้อมูลงวด ${period} เรียบร้อย — ${rows.length} สังกัด`);
  };

  const doPrint = () => {
    if (!report) return;
    onToast && onToast('กำลังเตรียมพิมพ์รายงานสรุปสร้างทะเบียนลูกหนี้ตัวแทน…');
    setTimeout(() => window.print(), 80);
  };

  const tot = report
    ? report.rows.reduce((a, r) => ({ collect: a.collect + r.collect, deduct: a.deduct + r.deduct, set: a.set + r.set }), { collect: 0, deduct: 0, set: 0 })
    : null;

  return (
    <div data-screen-label="หน้าประมวลผลลูกหนี้ตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลลูกหนี้ตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ประมวลผลประจำเดือนเพื่อสร้างทะเบียนลูกหนี้ตัวแทนตามสังกัด และสรุปยอดตั้งตัวแทนรายสังกัด
          </div>
        </div>
      </div>

      {/* ── เงื่อนไขการประมวลผล ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ประมวลผลประจำเดือนสร้างทะเบียนลูกหนี้ตัวแทน</h3></div>
        <div className="ap-form-grid">
          <label className="ap-field">
            <span className="ap-label">ประจำปี <b className="req">*</b></span>
            <input className="cfg-input mono" value={year} maxLength={4}
              onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          </label>
          <label className="ap-field">
            <span className="ap-label">วันที่ใบเสร็จ</span>
            <ThaiDateField value={receiptDate} onChange={setReceiptDate} />
          </label>
          <label className="ap-field">
            <span className="ap-label">ประจำเดือน <b className="req">*</b></span>
            <select className="cfg-input" value={month} onChange={e => setMonth(e.target.value)}>
              {AP_MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </label>
          <label className="ap-field">
            <span className="ap-label">วันที่ทำรายการ</span>
            <ThaiDateField value={txnDate} onChange={setTxnDate} />
          </label>
        </div>
      </div>

      {/* ── ช่วงข้อมูล ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ช่วงข้อมูลที่ต้องการประมวลผล</h3></div>
        <div className="ap-form-grid">
          <label className="ap-field">
            <span className="ap-label">ช่วงข้อมูล</span>
            <select className="cfg-input" value={rangeMode} onChange={e => setRangeMode(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="range">ระบุช่วงสังกัด</option>
            </select>
          </label>
          <label className="ap-field" style={{ gridColumn: '2 / span 1' }}>
            <span className="ap-label">รหัสสังกัด / ช่วงสังกัด</span>
            <input className="cfg-input mono" value={rangeText} disabled={rangeMode === 'all'}
              placeholder={rangeMode === 'all' ? 'ประมวลผลทุกสังกัด' : 'เช่น 0101, 0107 หรือ 0105 - 0110'}
              onChange={e => setRangeText(e.target.value)} />
          </label>
        </div>
        <div className="ap-hint muted">
          <Icon name="info" size={13} /> ใส่ข้อมูลหรือช่วงข้อมูลที่ต้องการประมวลผลและคั่นด้วยเครื่องหมาย , หรือ - เช่น 0101, 0107, 0105 - 0110
        </div>
      </div>

      <div className="ap-run">
        <button className="btn primary lg" onClick={pull}><Icon name="refresh" /> ดึงข้อมูล</button>
      </div>

      {/* ── รายงานสรุป ── */}
      {report && (
        <div className="search-card ap-report" style={{ marginTop: 12 }}>
          <div className="ap-report-head">
            <div className="ap-report-title">
              <div className="ap-rt-main">รายงานสรุปสร้างทะเบียนลูกหนี้ตัวแทน</div>
              <div className="ap-rt-sub">งวดเรียกเก็บ : <span className="mono">{report.period}</span> · ประจำเดือน{report.monthLabel} {report.year}</div>
            </div>
            <div className="ap-report-meta">
              <div>วันที่พิมพ์ : <span className="mono">{report.printedAt}</span></div>
              <div>หน้าที่ : <span className="mono">1/1</span></div>
            </div>
          </div>

          <div className="ap-report-actions no-print">
            <span className="chip info"><span className="dot-c" />{report.rows.length} สังกัด</span>
            <span className="spacer" />
            <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายงาน (.xlsx) แล้ว')}><Icon name="download" /> Export</button>
            <button className="btn sm" onClick={doPrint}><Icon name="print" /> พิมพ์รายงาน</button>
          </div>

          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="tbl ap-tbl" style={{ minWidth: 760 }}>
              <thead><tr>
                <th className="center" style={{ width: 64 }}>ลำดับ</th>
                <th style={{ minWidth: 240 }}>สังกัดลูกหนี้ตัวแทน</th>
                <th className="right" style={{ width: 160 }}>ยอดเรียกเก็บ</th>
                <th className="right" style={{ width: 130 }}>ยอดหักโอน</th>
                <th className="right" style={{ width: 160 }}>ยอดตั้งตัวแทน</th>
              </tr></thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={r.code}>
                    <td className="center mono">{i + 1}</td>
                    <td><span className="mono">{r.code}</span> — {r.name}</td>
                    <td className="right mono">{window.fmt.money(r.collect, 2)}</td>
                    <td className="right mono">{window.fmt.money(r.deduct, 2)}</td>
                    <td className="right mono">{window.fmt.money(r.set, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="pc-rep-tot">
                <td colSpan={2} className="right">รวมทั้งสิ้น</td>
                <td className="right mono">{window.fmt.money(tot.collect, 2)}</td>
                <td className="right mono">{window.fmt.money(tot.deduct, 2)}</td>
                <td className="right mono">{window.fmt.money(tot.set, 2)}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AgentProcessPage });

})();
