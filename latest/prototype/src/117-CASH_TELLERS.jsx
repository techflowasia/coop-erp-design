// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — ตรวจสอบเงินสด (Cash / drawer reconciliation)
//  รายงานสรุปรับ–จ่ายรายผู้ทำการ (teller) · ยอดเงินสดคงเหลือในลิ้นชัก
//  เลือกผู้ใช้จากรายชื่อ → ดูสถานะลิ้นชัก, รายรับ, รายจ่าย และยอดคงเหลือ
// ════════════════════════════════════════════════════════════════════
const { useState: ccUseState, useMemo: ccUseMemo } = React;

// ─── ข้อมูลตัวอย่าง — ผู้ทำการเคาน์เตอร์ (teller) แต่ละคน ─────────────
const CASH_TELLERS = [
  {
    user: 'ANANYAPORN', name: 'นส.อนัญพร วรยศ', drawer: 'open',
    income: [
      { label: 'ANANYAPORN เปิดลิ้นชัก : 0', amount: 562094.50 },
      { label: 'ฝาก 0700001133', amount: 205779.00 },
      { label: 'ฝาก 0100122014', amount: 10000.00 },
      { label: 'ฝาก 0110409337', amount: 75000.00 },
      { label: 'ฝาก 0110409350', amount: 149000.00 },
      { label: 'ฝาก 0210209312', amount: 2000.00 },
    ],
    expense: [
      { label: 'ถอน 0110407247', amount: 255779.00 },
      { label: 'ถอน 0110402839', amount: 50000.00 },
      { label: 'ถอน 0110408201', amount: 55000.00 },
      { label: 'ถอน 0100136938', amount: 6000.00 },
      { label: 'ถอน 0110404156', amount: 300000.00 },
      { label: 'ถอน 0110402423', amount: 200000.00 },
      { label: 'ถอน 0100105684', amount: 15329.05 },
    ],
  },
  {
    user: 'CHOLTHICHA', name: 'นส.ชลธิชา แก้วมณี', drawer: 'open',
    income: [
      { label: 'CHOLTHICHA เปิดลิ้นชัก : 0', amount: 300000.00 },
      { label: 'ฝาก 0110221045', amount: 48250.00 },
      { label: 'ฝาก 0100338921', amount: 120000.00 },
      { label: 'ชำระเงินกู้ 0250114477', amount: 33780.00 },
      { label: 'ค่าหุ้นรายเดือน (รวม 14 ราย)', amount: 21000.00 },
    ],
    expense: [
      { label: 'ถอน 0110226610', amount: 90000.00 },
      { label: 'ถอน 0100447120', amount: 25500.00 },
      { label: 'จ่ายเงินกู้ฉุกเฉิน 0330119088', amount: 150000.00 },
      { label: 'ถอน 0110228834', amount: 12800.00 },
    ],
  },
  {
    user: 'CHONLADA.L', name: 'นส.ชลลดา ลิ้มสกุล', drawer: 'open',
    income: [
      { label: 'CHONLADA.L เปิดลิ้นชัก : 0', amount: 250000.00 },
      { label: 'ฝาก 0110550021', amount: 66000.00 },
      { label: 'ฝาก 0100662130', amount: 8500.00 },
      { label: 'รับชำระหนี้ตามคำพิพากษา', amount: 42000.00 },
    ],
    expense: [
      { label: 'ถอน 0110551900', amount: 74000.00 },
      { label: 'ถอน 0100668452', amount: 30000.00 },
      { label: 'จ่ายเงินสงเคราะห์สมาชิก', amount: 5000.00 },
    ],
  },
  {
    user: 'DONLAYA', name: 'นส.ดลยา ศรีสมบัติ', drawer: 'open',
    income: [
      { label: 'DONLAYA เปิดลิ้นชัก : 0', amount: 180000.00 },
      { label: 'ฝาก 0110770145', amount: 95300.00 },
      { label: 'ค่าธรรมเนียมออกหนังสือรับรอง (6 ราย)', amount: 1800.00 },
    ],
    expense: [
      { label: 'ถอน 0110771230', amount: 60000.00 },
      { label: 'ถอน 0100889677', amount: 44200.00 },
    ],
  },
  {
    user: 'KWANHATHAI', name: 'นส.ขวัญหทัย พงษ์ไทย', drawer: 'open',
    income: [
      { label: 'KWANHATHAI เปิดลิ้นชัก : 0', amount: 220000.00 },
      { label: 'ฝาก 0110990088', amount: 130450.00 },
      { label: 'ฝาก 0100112245', amount: 5000.00 },
      { label: 'รับเงินจากตัวแทน AG-201', amount: 88000.00 },
    ],
    expense: [
      { label: 'ถอน 0110991144', amount: 175000.00 },
      { label: 'ถอน 0100113900', amount: 62300.00 },
    ],
  },
  {
    user: 'RUNGAROON', name: 'นส.รุ่งอรุณ เทพทอง', drawer: 'closed',
    income: [],
    expense: [],
  },
  {
    user: 'WATCHARAWIT.', name: 'นาย วัชรวิทย์ อ่อนศรี', drawer: 'closed',
    income: [],
    expense: [],
  },
];

const ccSum = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);

// ─── ตารางรายรับ / รายจ่าย ───────────────────────────────────────────
// หัวตาราง/แถวยอดรวม ติดขอบกรอบ เวลาเลื่อนในตาราง
if (!document.getElementById('cc-sticky-css')) {
  const st = document.createElement('style'); st.id = 'cc-sticky-css';
  st.textContent = '.cc-sticky-tbl thead th{position:sticky;top:0;z-index:2;background:#fafafa}'
    + '.cc-sticky-tbl tbody tr:not(.cc-fill){height:1px}.cc-sticky-tbl tr.cc-fill:hover td{background:transparent}'
    + '.cc-sticky-tbl tfoot td{position:sticky;bottom:0;z-index:2;background:#fff;box-shadow:0 -1px 0 #f0f0f0}';
  document.head.appendChild(st);
}
const CC_SIZES = [10, 20, 50, 100];
function CashLedger({ variant, rows }) {
  const isIncome = variant === 'income';
  const total = ccSum(rows);
  const [page, setPage] = ccUseState(1);
  const [CC_PAGE, setSize] = ccUseState(10);
  React.useEffect(() => { setPage(1); }, [rows]);
  const pageCount = Math.max(1, Math.ceil(rows.length / CC_PAGE));
  const pg = Math.min(page, pageCount);
  const from = rows.length ? (pg - 1) * CC_PAGE + 1 : 0;
  const to = Math.min(pg * CC_PAGE, rows.length);
  const view = rows.slice(from ? from - 1 : 0, to);
  const fill = rows.length ? CC_PAGE - view.length : 0;
  const nums = [];
  if (pageCount <= 7) { for (let n = 1; n <= pageCount; n++) nums.push(n); }
  else {
    nums.push(1);
    if (pg > 3) nums.push('…');
    for (let n = Math.max(2, pg - 1); n <= Math.min(pageCount - 1, pg + 1); n++) nums.push(n);
    if (pg < pageCount - 2) nums.push('…');
    nums.push(pageCount);
  }
  return (
    <div className="search-card dat-section cc-ledger" style={{ marginTop: 0 }}>
      <DepSecHead bar title={isIncome ? 'รายรับ' : 'รายจ่าย'}
        right={<div className="cc-ledger-sum">
          <span className="muted">รวมทั้งหมด {rows.length.toLocaleString('th-TH')} รายการ ·</span>
          <b className={'mono ' + (isIncome ? 'in' : 'out')}>{window.fmt.money(total)}</b>
        </div>} />
      <div className="table-wrap" style={{ margin: '12px 16px 0' }}><div className="table-scroll" style={{ overflowX: 'hidden' }}>
        <table className="tbl cc-ledger-tbl" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: 52 }} className="center">ลำดับ</th>
              <th>รายการ</th>
              <th className="right" style={{ width: '34%', maxWidth: 140 }}>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={3} className="empty-state">ยังไม่มีรายการ{isIncome ? 'รับ' : 'จ่าย'}</td></tr>
            )}
            {view.map((r, i) => (
              <tr key={from + i}>
                <td className="center muted">{from + i}</td>
                <td className="cc-item" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{r.label}</td>
                <td className="right mono cc-amt">{window.fmt.money(r.amount)}</td>
              </tr>
            ))}
            {Array.from({ length: fill }).map((_, i) => (
              <tr key={'f' + i} className="cc-fill-row" aria-hidden="true" data-pgn-hide-skip=""><td colSpan={3}>&nbsp;</td></tr>
            ))}
          </tbody>
        </table>
      </div></div>
      <div className="pagination pgn-auto cc-pager" data-for="cc-own" style={{ marginTop: 12 }}>
        <span className="pgn-info">{rows.length ? from + '-' + to + ' จาก ' + rows.length + ' รายการ' : '0 รายการ'}</span>
        <div className="pgn-nav">
          <button type="button" className="pgn-btn" disabled={pg <= 1} onClick={() => setPage(pg - 1)}>‹</button>
          {nums.map((n, i) => n === '…'
            ? <span key={'d' + i} className="pgn-gap">…</span>
            : <button key={n} type="button" className={'pgn-btn' + (n === pg ? ' on' : '')} onClick={() => setPage(n)}>{n}</button>)}
          <button type="button" className="pgn-btn" disabled={pg >= pageCount} onClick={() => setPage(pg + 1)}>›</button>
          <select className="pgn-size" value={CC_PAGE} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
            {CC_SIZES.map(s => <option key={s} value={s}>{s} / หน้า</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function CashCheckPage({ onToast }) {
  const [sel, setSel] = ccUseState(0);
  const [processedAt, setProcessedAt] = ccUseState(() => new Date());
  const teller = CASH_TELLERS[sel];

  const income = ccUseMemo(() => ccSum(teller.income), [teller]);
  const expense = ccUseMemo(() => ccSum(teller.expense), [teller]);
  const balance = income - expense;
  const open = teller.drawer === 'open';

  const process = () => {
    setProcessedAt(new Date());
    onToast && onToast(`ประมวลผลยอดเงินสดของ ${teller.name} เรียบร้อย`);
  };

  const totalDrawers = CASH_TELLERS.filter(t => t.drawer === 'open').length;
  const grandBalance = CASH_TELLERS.reduce((s, t) => s + (ccSum(t.income) - ccSum(t.expense)), 0);

  return (
    <div data-screen-label="หน้าตรวจสอบเงินสด (การเงิน)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตรวจสอบเงินสด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            รายงานสรุปรับ–จ่ายรายผู้ทำการ — ตรวจนับยอดเงินสดคงเหลือในลิ้นชักเทียบกับระบบก่อนปิดวัน
          </div>
        </div>
        <span className="spacer" />
        <div className="fin-kpi">
          <div className="fin-kpi-lab">ลิ้นชักที่เปิดอยู่</div>
          <div className="fin-kpi-val">{totalDrawers} / {CASH_TELLERS.length} <span className="fin-kpi-unit">คน</span></div>
        </div>
        <div className="fin-kpi accent" style={{ width: 'auto', minWidth: 0, flex: 'none' }}>
          <div className="fin-kpi-lab" style={{ whiteSpace: 'nowrap' }}>เงินสดในลิ้นชักรวม</div>
          <div className="fin-kpi-val" style={{ whiteSpace: 'nowrap' }}>{window.fmt.money(grandBalance)} <span className="fin-kpi-unit">บาท</span></div>
        </div>
      </div>

      <div className="cc-layout">
        {/* ── รายชื่อผู้ใช้ ── */}
        <div className="search-card cc-users">
          <div className="cc-users-head" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 3, height: 14, background: 'var(--primary, #237450)', borderRadius: 2, flexShrink: 0 }} /> รายชื่อผู้ใช้</div>
          <div className="cc-users-list">
            {CASH_TELLERS.map((t, i) => (
              <button key={t.user} className={"cc-user" + (i === sel ? ' active' : '')} onClick={() => setSel(i)}>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, textAlign: 'left' }}>
                  <span className="cc-user-name" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>{t.user}</span>
                </span>
                <span className={"pill " + (t.drawer === 'open' ? 'ok' : 'neutral')} style={{ flex: 'none' }}>{t.drawer === 'open' ? 'เปิด' : 'ปิด'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── รายละเอียดผู้ใช้ ── */}
        <div className="cc-detail">
          <div className="search-card cc-head-card">
            <div className="cc-head-top">
              <div className="cc-head-idrow">
                <span className="cc-head-lab">ชื่อผู้ใช้</span>
                <span className="cc-head-name">{teller.name}</span>
                <span className={"pill " + (open ? 'ok' : 'neutral')}>
                  {open ? 'เปิดลิ้นชัก' : 'ปิดลิ้นชัก'}
                </span>
              </div>
              <button className="btn primary" onClick={process}>ประมวลผล</button>
            </div>
            <div className="cc-balance">
              <div className="cc-balance-lab">
                <span>เงินสดในลิ้นชักของ {teller.name}</span>
                <span className="cc-balance-sub">รายรับ − รายจ่าย</span>
              </div>
              <div className={"cc-balance-val mono" + (balance < 0 ? ' neg' : '')}>{window.fmt.money(balance)}</div>
            </div>
            <div className="cc-head-foot muted">
              <Icon name="info" size={12} /> ประมวลผลล่าสุด {(() => { const d = processedAt; const p = (n) => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + (d.getFullYear() + 543) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); })()} น.
            </div>
          </div>

          {open ? (
            <div className="cc-ledgers">
              <CashLedger variant="income" rows={teller.income} />
              <CashLedger variant="expense" rows={teller.expense} />
            </div>
          ) : (
            <div className="search-card cc-empty">
              <Icon name="lock" size={20} />
              <div className="cc-empty-title">ลิ้นชักยังไม่เปิดทำการ</div>
              <div className="muted" style={{ fontSize: 12.5 }}>ผู้ใช้รายนี้ยังไม่เปิดลิ้นชักในวันนี้ จึงยังไม่มีรายการรับ–จ่ายให้ตรวจสอบ</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CashCheckPage, CASH_TELLERS, ccSum });
