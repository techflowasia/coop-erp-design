// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — Cash Flow คาดการณ์
//  คาดการณ์กระแสเงินสดรายเดือน จากครบกำหนด + ดอกเบี้ย + ปันผล −
//  แผนลงทุนใหม่ พร้อมกราฟ และเปรียบเทียบแผน vs ผลจริง
// ════════════════════════════════════════════════════════════════════

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function cfMonthLabel(key) { const [y, m] = key.split('-'); return TH_MONTH[+m - 1] + ' ' + (String(+y + 543).slice(2)); }
function cfAddMonths(key, n) { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }

function cfLastCoupon(p) {
  if (p.accrued) return p.accrued;
  const principal = p.faceValue || p.investAmount || 0;
  const months = p.couponFreq === 'รายเดือน' ? 1 : p.couponFreq === 'ราย 3 เดือน' ? 3 : p.couponFreq === 'ราย 6 เดือน' ? 6 : 12;
  return Math.round(principal * (p.couponRate / 100) * (months / 12));
}

function CashflowPage({ onToast }) {
  const [port] = useState(window.ivLoadPort);
  const [returns] = useState(window.ivLoadReturns);
  const [startMonth, setStartMonth] = useState('2026-06');
  const [span, setSpan] = useState(7);
  const [view, setView] = useState('table');  // 'table' | 'chart'

  const months = Array.from({ length: span }, (_, i) => cfAddMonths(startMonth, i));
  const plan = window.IV_CASH_PLAN || [];

  // สร้าง bucket ต่อเดือน
  let running = window.IV_CASH_OPENING;
  const rows = months.map(mk => {
    // เงินลงทุนครบกำหนด (เงินต้น + ดอกเบี้ยงวดสุดท้าย)
    const matured = port.filter(p => p.maturityDate && p.maturityDate.startsWith(mk) && p.status === 'active');
    const maturePrincipal = matured.reduce((a, p) => a + (p.faceValue || p.investAmount || 0), 0);
    // ดอกเบี้ยที่จะได้รับ (จากตารางรับ — ประเภทดอกเบี้ย)
    const interest = returns.filter(r => r.dueDate.startsWith(mk) && r.type === 'ดอกเบี้ย' && r.status !== 'received')
      .reduce((a, r) => a + r.expect, 0)
      + matured.reduce((a, p) => a + cfLastCoupon(p), 0);
    // เงินปันผล
    const dividend = returns.filter(r => r.dueDate.startsWith(mk) && r.type === 'เงินปันผล' && r.status !== 'received')
      .reduce((a, r) => a + r.expect, 0);
    // เงินลงทุนใหม่ที่วางแผน (outflow)
    const planRow = plan.find(p => p.month === mk);
    const newInvest = planRow ? planRow.planInvest : 0;
    const netFlow = maturePrincipal + interest + dividend - newInvest;
    running += netFlow;
    return { mk, maturePrincipal, interest, dividend, newInvest, netFlow, balance: running };
  });

  const totals = rows.reduce((a, r) => ({
    maturePrincipal: a.maturePrincipal + r.maturePrincipal, interest: a.interest + r.interest,
    dividend: a.dividend + r.dividend, newInvest: a.newInvest + r.newInvest, netFlow: a.netFlow + r.netFlow,
  }), { maturePrincipal: 0, interest: 0, dividend: 0, newInvest: 0, netFlow: 0 });

  const chartSeries = rows.map(r => ({ label: cfMonthLabel(r.mk), value: r.netFlow }));

  return (
    <div data-screen-label="หน้า Cash Flow คาดการณ์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Cash Flow คาดการณ์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ประมาณการกระแสเงินสดจากเงินลงทุนครบกำหนด ดอกเบี้ย เงินปันผล และแผนลงทุนใหม่
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออก Cash Flow เป็น Excel แล้ว')}><Icon name="download" /> Export Excel</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
        <IvStat label="เงินสดคงเหลือยกมา" value={'฿ ' + fmt.money(window.IV_CASH_OPENING, 0)} sub={'ณ ต้น ' + cfMonthLabel(startMonth)} accent />
        <IvStat label="กระแสเงินสดรับรวม" value={'฿ ' + fmt.money(totals.maturePrincipal + totals.interest + totals.dividend, 0)} sub={span + ' เดือน'} tone="success" />
        <IvStat label="แผนลงทุนใหม่รวม" value={'฿ ' + fmt.money(totals.newInvest, 0)} sub="กระแสเงินสดจ่าย" tone="warning" />
        <IvStat label="กระแสเงินสดสุทธิ" value={(totals.netFlow >= 0 ? '+' : '−') + ' ฿ ' + fmt.money(Math.abs(totals.netFlow), 0)}
                tone={totals.netFlow >= 0 ? 'success' : 'danger'} sub={'คงเหลือปลายงวด ฿ ' + fmt.money(rows[rows.length - 1].balance, 0)} />
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
          <span className="muted" style={{ fontSize: 12 }}>ช่วงเวลา</span>
          <input className="filter-select" type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
          <div className="seg">
            <button className={"seg-btn" + (span === 6 ? ' active' : '')} onClick={() => setSpan(6)}>6 เดือน</button>
            <button className={"seg-btn" + (span === 7 ? ' active' : '')} onClick={() => setSpan(7)}>ถึงสิ้นปี</button>
            <button className={"seg-btn" + (span === 12 ? ' active' : '')} onClick={() => setSpan(12)}>12 เดือน</button>
          </div>
          <span className="spacer" />
          <div className="seg">
            <button className={"seg-btn" + (view === 'table' ? ' active' : '')} onClick={() => setView('table')}>ตาราง</button>
            <button className={"seg-btn" + (view === 'chart' ? ' active' : '')} onClick={() => setView('chart')}>กราฟ</button>
          </div>
        </div>

        {view === 'chart' ? (
          <>
            <div className="section-head" style={{ marginBottom: 6 }}><span className="head-bar" /><h3>กระแสเงินสดสุทธิรายเดือน</h3></div>
            <IvColumnChart series={chartSeries} height={220} />
          </>
        ) : (
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 920 }}>
              <thead><tr>
                <th style={{ width: 110 }}>เดือน/ปี</th>
                <th className="right">เงินลงทุนครบกำหนด</th>
                <th className="right">ดอกเบี้ยรับ</th>
                <th className="right">เงินปันผลรับ</th>
                <th className="right">แผนลงทุนใหม่</th>
                <th className="right">กระแสเงินสดสุทธิ</th>
                <th className="right">เงินสดคงเหลือ</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.mk}>
                    <td><b>{cfMonthLabel(r.mk)}</b></td>
                    <td className="right mono">{r.maturePrincipal ? fmt.money(r.maturePrincipal, 0) : '—'}</td>
                    <td className="right mono">{r.interest ? fmt.money(r.interest, 0) : '—'}</td>
                    <td className="right mono">{r.dividend ? fmt.money(r.dividend, 0) : '—'}</td>
                    <td className="right mono" style={{ color: r.newInvest ? 'var(--danger)' : undefined }}>{r.newInvest ? '(' + fmt.money(r.newInvest, 0) + ')' : '—'}</td>
                    <td className="right mono"><span className={r.netFlow >= 0 ? 'iv-pos' : 'iv-neg'}>{(r.netFlow >= 0 ? '+' : '−') + ' ' + fmt.money(Math.abs(r.netFlow), 0)}</span></td>
                    <td className="right mono"><b>{fmt.money(r.balance, 0)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="right">รวม</td>
                  <td className="right mono">{fmt.money(totals.maturePrincipal, 0)}</td>
                  <td className="right mono">{fmt.money(totals.interest, 0)}</td>
                  <td className="right mono">{fmt.money(totals.dividend, 0)}</td>
                  <td className="right mono">({fmt.money(totals.newInvest, 0)})</td>
                  <td className="right mono">{(totals.netFlow >= 0 ? '+' : '−') + ' ' + fmt.money(Math.abs(totals.netFlow), 0)}</td>
                  <td className="right mono">{fmt.money(rows[rows.length - 1].balance, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ข้อมูลคำนวณจากทะเบียนพอร์ตลงทุน ตารางรับผลตอบแทน และแผนการลงทุนใหม่รายเดือน — เงินสดคงเหลือคำนวณแบบสะสมต่อเนื่อง
      </div>
    </div>
  );
}

Object.assign(window, { CashflowPage });
