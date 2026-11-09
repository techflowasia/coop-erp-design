// override 367 — วันที่ใบเสร็จ / วันที่ทำรายการ ใช้ช่องวันที่ไทยชุดเดียวกับหน้ารับชำระตัวแทน
(function () {
// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ประมวลคืนเงินเพื่อรับชำระตัวแทน
//  ประมวลผลประจำเดือนคืนเงินเดือนเก่า -> ชำระเดือน... —
//  เลือกปี/เดือน + วันที่ใบเสร็จ/ทำรายการ → ดึงข้อมูล →
//  รายงานโอนเงินเกินหักชำระหนี้ (ยอดเงินเกินรายสังกัดตัวแทน)
// ════════════════════════════════════════════════════════════════════
const { useState: armUseState } = React;

const ARM_MONTHS = [
  { v: '01', l: 'มกราคม' }, { v: '02', l: 'กุมภาพันธ์' }, { v: '03', l: 'มีนาคม' },
  { v: '04', l: 'เมษายน' }, { v: '05', l: 'พฤษภาคม' }, { v: '06', l: 'มิถุนายน' },
  { v: '07', l: 'กรกฎาคม' }, { v: '08', l: 'สิงหาคม' }, { v: '09', l: 'กันยายน' },
  { v: '10', l: 'ตุลาคม' }, { v: '11', l: 'พฤศจิกายน' }, { v: '12', l: 'ธันวาคม' },
];

// ─── ยอดโอนเงินเกินหักชำระหนี้รายสังกัดตัวแทน (ข้อมูลตัวอย่างประจำงวด) ──
//  จำนวน = จำนวนสมาชิกที่มีเงินโอนเกิน · ยอดเงินเกิน = ยอดรวมที่ต้องคืน
const ARM_UNITS = [
  { code: '0101', name: 'กองเกษียณ',                                       count: 12, excess: 48250.00 },
  { code: '0106', name: 'กทช.',                                            count: 3,  excess: 6420.50 },
  { code: '0107', name: 'ปณท.',                                            count: 47, excess: 213880.75 },
  { code: '0108', name: 'กสท.',                                            count: 21, excess: 87604.00 },
  { code: '0111', name: 'สมทบเครือญาติ',                                    count: 2,  excess: 1500.00 },
  { code: '0112', name: 'สมาชิกสมทบ ปณท',                                   count: 5,  excess: 9750.00 },
];

const armToday = () => new Date().toISOString().slice(0, 10);
const armThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};
const armNow = () => {
  const n = new Date();
  const hh = String(((n.getHours() + 11) % 12) + 1).padStart(2, '0');
  const mm = String(n.getMinutes()).padStart(2, '0');
  const ss = String(n.getSeconds()).padStart(2, '0');
  const ap = n.getHours() >= 12 ? 'pm' : 'am';
  return `${armThaiDate(armToday())} เวลา ${hh}:${mm}:${ss} ${ap}`;
};

function AgentReturnMoneyPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ประมวลคืนเงินเพื่อรับชำระตัวแทน', current: true }], []);

  const [year, setYear] = armUseState('2569');
  const [month, setMonth] = armUseState('07');
  const [receiptDate, setReceiptDate] = armUseState(armToday());
  const [txnDate, setTxnDate] = armUseState('2569-06-30');
  const [report, setReport] = armUseState(null);   // ผลการประมวลผล (snapshot)

  const period = `${year}${month}`;                 // งวดเรียกเก็บ เช่น 256907

  const pull = () => {
    if (!year.trim() || year.length < 4) {
      onToast && onToast('กรุณาระบุประจำปีให้ครบถ้วน');
      return;
    }
    const rows = ARM_UNITS.map(u => ({ ...u }));
    setReport({
      period, monthLabel: (ARM_MONTHS.find(m => m.v === month) || {}).l, year,
      receiptDate, txnDate, printedAt: armNow(), rows,
    });
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — ประมวลคืนเงินเพื่อรับชำระตัวแทน',
      target: `งวด ${period}`, summary: `ประมวลคืนเงินโอนเกินหักชำระหนี้ งวด ${period} (${rows.length} สังกัด)`,
    });
    onToast && onToast(`ดึงข้อมูลงวด ${period} เรียบร้อย — ${rows.length} สังกัด`);
  };

  const doPrint = () => {
    if (!report) return;
    onToast && onToast('กำลังเตรียมพิมพ์รายงานโอนเงินเกินหักชำระหนี้…');
    setTimeout(() => window.print(), 80);
  };

  const tot = report
    ? report.rows.reduce((a, r) => ({ count: a.count + r.count, excess: a.excess + r.excess }), { count: 0, excess: 0 })
    : null;

  return (
    <div data-screen-label="หน้าประมวลคืนเงินเพื่อรับชำระตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลคืนเงินเพื่อรับชำระตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ประมวลผลประจำเดือนคืนเงินเดือนเก่าเพื่อรับชำระเดือนถัดไป และสรุปยอดโอนเงินเกินหักชำระหนี้รายสังกัดตัวแทน
          </div>
        </div>
      </div>

      {/* ── เงื่อนไขการประมวลผล ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ประมวลผลประจำเดือนคืนเงินเดือนเก่า → ชำระเดือน…</h3></div>
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
              {ARM_MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </label>
          <label className="ap-field">
            <span className="ap-label">วันที่ทำรายการ</span>
            <ThaiDateField value={txnDate} onChange={setTxnDate} />
          </label>
        </div>
        <div className="ap-hint muted">
          <Icon name="info" size={13} /> เลือกงวด (ปี/เดือน) ที่ต้องการประมวลคืนเงินโอนเกิน แล้วกด “ดึงข้อมูล” เพื่อสร้างรายงานโอนเงินเกินหักชำระหนี้
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
              <div className="ap-rt-main">รายงานโอนเงินเกินหักชำระหนี้</div>
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
            <table className="tbl ap-tbl" style={{ minWidth: 640 }}>
              <thead><tr>
                <th className="center" style={{ width: 64 }}>ลำดับ</th>
                <th style={{ minWidth: 260 }}>สังกัดตัวแทน</th>
                <th className="right" style={{ width: 120 }}>จำนวน</th>
                <th className="right" style={{ width: 180 }}>ยอดเงินเกิน</th>
              </tr></thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={r.code}>
                    <td className="center mono">{i + 1}</td>
                    <td><span className="mono">{r.code}</span> — {r.name}</td>
                    <td className="right mono">{window.fmt.money(r.count, 0)}</td>
                    <td className="right mono">{window.fmt.money(r.excess, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="pc-rep-tot">
                <td colSpan={2} className="right">รวมทั้งสิ้น</td>
                <td className="right mono">{window.fmt.money(tot.count, 0)}</td>
                <td className="right mono">{window.fmt.money(tot.excess, 2)}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AgentReturnMoneyPage });

})();
