// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ดอกเบี้ย — ประมาณการดอกเบี้ย (Interest Projection)
//  ดูข้อมูลการประมาณการดอกเบี้ยจ่าย แยกตามประเภทเงินฝากแต่ละประเภท
//  • ภาพรวม: สรุปประมาณการทั้งระบบ + ตารางรายประเภท
//  • เรียกดูรายการประมาณการรายบัญชีของแต่ละประเภทได้ (drill-down)
// ════════════════════════════════════════════════════════════════════

// ช่วงประมาณการมาตรฐาน (สิ้นงวด/สิ้นปี)
const DEP_PROJ_PERIODS = [
  { id: 'y2569',  label: 'ทั้งปี 2569',            from: '2026-01-01', to: '2026-12-31' },
  { id: 'h2',     label: 'ครึ่งปีหลัง 2569',       from: '2026-07-01', to: '2026-12-31' },
  { id: 'rest',   label: 'คงเหลือถึงสิ้นปี 2569',  from: window.DEP_OPS_TODAY, to: '2026-12-31' },
  { id: 'custom', label: 'กำหนดช่วงเอง',           from: '', to: '' },
];

// สร้างบรรทัดประมาณการรายบัญชี (ยอดคงเหลือ × อัตรา% × วัน ÷ 365, หักภาษี)
function depProjLine(a, days) {
  const gross = a.balance * (a.rate / 100) * days / 365;
  const taxRate = window.depTaxRate(a.typeCode);
  const tax = gross * taxRate;
  return { accNo: a.accNo, member: a.member, name: a.name, dept: a.dept, type: a.type, typeCode: a.typeCode,
    balance: a.balance, rate: a.rate, days, taxRate, gross, tax, net: gross - tax };
}
const depProjSum = (rows, k) => rows.reduce((s, x) => s + (x[k] || 0), 0);

// รอบจ่ายดอกเบี้ยถัดไป — งวดครึ่งปี (30 มิ.ย. / 31 ธ.ค.)
function depNextPayRound() {
  const today = String(window.DEPOSIT_WORKING_DATE || window.DEP_OPS_TODAY || new Date().toISOString()).slice(0, 10);
  const y = Number(today.slice(0, 4)), md = today.slice(5);
  const to = md <= '06-30' ? y + '-06-30' : y + '-12-31';
  return { from: today, to };
}
function DepInterestProjectionPage({ onToast, mode }) {
  const adv = mode === 'advance';
  const nxt = adv ? depNextPayRound() : null;
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [periodId, setPeriodId] = useState(adv ? 'custom' : 'y2569');
  const period = DEP_PROJ_PERIODS.find(p => p.id === periodId);
  const [fromDate, setFromDate] = useState(adv ? nxt.from : '2026-01-01');
  const [toDate, setToDate] = useState(adv ? nxt.to : '2026-12-31');
  // ตัวกรองแบบระบบเดิม (เฉพาะประมาณการจ่ายล่วงหน้า): สาขา · ช่วงวันที่ · ช่วงประเภท → กด "ประมวลผล"
  const allTypes = (window.DEP_ACCTYPE_SEED || []).filter(t => t.enabled);
  const [branch, setBranch] = useState('สำนักงานใหญ่');
  const [dFrom, setDFrom] = useState(adv ? nxt.from : '');
  const [dTo, setDTo] = useState(adv ? nxt.to : '');
  const [tFrom, setTFrom] = useState(allTypes[0] ? allTypes[0].code : '');
  const [tTo, setTTo] = useState(allTypes.length ? allTypes[allTypes.length - 1].code : '');
  const [range, setRange] = useState(() => ({ a: 0, b: allTypes.length - 1 }));
  const runAdv = () => {
    let a = allTypes.findIndex(t => t.code === tFrom), b = allTypes.findIndex(t => t.code === tTo);
    if (a > b) { const x = a; a = b; b = x; }
    setFromDate(dFrom); setToDate(dTo); setRange({ a, b });
    onToast && onToast('ประมวลผลประมาณการจ่ายดอกเบี้ยล่วงหน้าแล้ว');
  };
  const [openType, setOpenType] = useState(null); // typeCode ที่กำลังดูรายละเอียด

  // ช่วงวันจริงที่ใช้คำนวณ
  const from = periodId === 'custom' ? fromDate : period.from;
  const to = periodId === 'custom' ? toDate : period.to;
  const days = window.depDaysBetween(from, to);

  // บัญชีใช้งานอยู่ + บรรทัดประมาณการ
  const lines = useMemo(
    () => accounts.filter(a => a.status === 'active').map(a => depProjLine(a, days)),
    [accounts, days]
  );

  // จัดกลุ่มตามประเภทเงินฝาก — อิงประเภทที่เปิดใช้งานทั้งหมด (แสดงทุกประเภท)
  const byType = useMemo(() => {
    const types = adv ? allTypes.slice(range.a, range.b + 1) : allTypes;
    const seen = new Set(adv ? allTypes.map(t => t.code) : []);
    const out = types.map(t => {
      seen.add(t.code);
      const rows = lines.filter(l => l.typeCode === t.code);
      const bal = depProjSum(rows, 'balance');
      const wAvgRate = bal > 0 ? rows.reduce((s, r) => s + r.balance * r.rate, 0) / bal : (t.interest?.rate || 0);
      return { code: t.code, name: t.name, n: rows.length, balance: bal, avgRate: wAvgRate,
        gross: depProjSum(rows, 'gross'), tax: depProjSum(rows, 'tax'), net: depProjSum(rows, 'net'),
        taxable: window.depTaxRate(t.code) > 0, rows };
    });
    // ประเภทที่มีในบัญชีแต่ไม่มีใน seed (กันพลาด)
    lines.forEach(l => {
      if (seen.has(l.typeCode)) return;
      seen.add(l.typeCode);
      const rows = lines.filter(x => x.typeCode === l.typeCode);
      const bal = depProjSum(rows, 'balance');
      out.push({ code: l.typeCode, name: l.type, n: rows.length, balance: bal,
        avgRate: bal > 0 ? rows.reduce((s, r) => s + r.balance * r.rate, 0) / bal : 0,
        gross: depProjSum(rows, 'gross'), tax: depProjSum(rows, 'tax'), net: depProjSum(rows, 'net'),
        taxable: window.depTaxRate(l.typeCode) > 0, rows });
    });
    return out;
  }, [lines, range.a, range.b]);

  const totals = {
    n: depProjSum(byType, 'n'),
    balance: depProjSum(byType, 'balance'),
    gross: depProjSum(byType, 'gross'),
    tax: depProjSum(byType, 'tax'),
    net: depProjSum(byType, 'net'),
  };

  // ─── รายละเอียดรายบัญชีของประเภทที่เลือก ──────────────────────────
  if (openType) {
    const grp = byType.find(t => t.code === openType);
    if (!grp) { setOpenType(null); return null; }
    return (
      <div data-screen-label="หน้ารายละเอียดประมาณการดอกเบี้ยรายประเภท">
        <div className="page-actions">
          <button className="btn ghost sm" onClick={() => setOpenType(null)}><Icon name="chevLeft" /> กลับสู่ภาพรวมรายประเภท</button>
        </div>
        <div className="search-card dat-section">
          <div className="dat-section-head is-bar"><span className="head-bar" />
            <div><div className="dat-section-title">ประมาณการดอกเบี้ย — {grp.name} <span className="pill neutral mono" style={{ marginLeft: 6 }}>{grp.code}</span></div>
              <div className="muted" style={{ fontSize: 11.5 }}>ช่วงประมาณการ {fmt.date(from)} – {fmt.date(to)} · {days} วัน{grp.taxable ? ' · หักภาษี ณ ที่จ่าย 15%' : ''}</div></div>
          </div>
        </div>
        <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
          <IvStat label="ยอดคงเหลือรวม" value={fmt.money(grp.balance, 2)} sub="บาท" accent />
          <IvStat label="อัตราเฉลี่ย (ถ่วงน้ำหนัก)" value={grp.avgRate.toFixed(2) + '%'} sub="ต่อปี" />
          <IvStat label="ดอกเบี้ยสุทธิ (ประมาณการ)" value={fmt.money(grp.net, 2)} sub="บาท" tone="success" />
          <IvStat label="จำนวนบัญชี" value={grp.n} sub="บัญชี" />
        </div>

        <div className="search-card dat-section" style={{ marginTop: 12 }}>
          <div className="dat-section-head is-bar"><span className="head-bar" />
            <div className="dat-section-title">รายการประมาณการรายบัญชี</div>
            <span className="spacer" />
            <span className="muted" style={{ fontSize: 11.5 }}>{grp.rows.length} รายการ</span>
          </div>
          <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
            <table className="tbl" style={{ width: '100%', minWidth: 760 }}>
              <thead><tr>
                <th className="mono">เลขที่บัญชี</th><th>สมาชิก</th>
                <th className="right">ยอดคงเหลือ</th><th className="center">อัตรา</th><th className="center">วัน</th>
                <th className="right">ดอกเบี้ยประมาณการ</th><th className="right">ภาษี</th><th className="right">สุทธิ</th>
              </tr></thead>
              <tbody>
                {grp.rows.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 24 }}>ไม่มีบัญชีในประเภทนี้</td></tr>}
                {grp.rows.map(l => (
                  <tr key={l.accNo}>
                    <td className="mono">{l.accNo}</td>
                    <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
                    <td className="right mono">{fmt.money(l.balance, 2)}</td>
                    <td className="center mono">{l.rate.toFixed(2)}%</td>
                    <td className="center mono">{l.days}</td>
                    <td className="right mono">{fmt.money(l.gross, 2)}</td>
                    <td className="right mono" style={{ color: l.tax ? 'var(--danger)' : undefined }}>{l.tax ? fmt.money(l.tax, 2) : '—'}</td>
                    <td className="right mono"><b>{fmt.money(l.net, 2)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td colSpan="5" className="right">รวมประเภท {grp.name}</td>
                <td className="right mono">{fmt.money(grp.gross, 2)}</td>
                <td className="right mono">{fmt.money(grp.tax, 2)}</td>
                <td className="right mono"><b>{fmt.money(grp.net, 2)}</b></td>
              </tr></tfoot>
            </table>
          </div>
        </div>
        <div className="lt-list-foot muted"><Icon name="info" size={12} /> ตัวเลขเป็น<b>ประมาณการ</b>จากยอดคงเหลือและอัตราปัจจุบัน · ยอดจริงขึ้นกับการฝาก-ถอนและการปรับอัตราระหว่างงวด</div>
      </div>
    );
  }

  // ─── ภาพรวม + ตารางรายประเภท ──────────────────────────────────────
  return (
    <div data-screen-label="หน้าประมาณการดอกเบี้ย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{adv ? 'ประมาณการจ่ายดอกเบี้ยล่วงหน้า' : 'ประมาณการดอกเบี้ยเงินฝาก'}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{adv
            ? 'ยอดดอกเบี้ยที่ต้องจ่ายในรอบจ่ายถัดไป แยกตามประเภทเงินฝาก — ใช้เตรียมเงินก่อนวันจ่าย'
            : 'ประมาณการดอกเบี้ยจ่ายตามช่วงเวลา แยกตามประเภทเงินฝากแต่ละประเภท — คลิกประเภทเพื่อดูรายการประมาณการรายบัญชี'}</div>
        </div>
      </div>

      {adv ? (
      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', alignItems: 'end' }}>
          <DatFieldLite label="สาขา">
            <select className="cfg-input" value={branch} onChange={(e) => setBranch(e.target.value)}>
              {(window.DEP_BRANCHES || ['สำนักงานใหญ่']).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="ตั้งแต่วันที่"><window.ThaiDateField value={dFrom} max={dTo} onChange={(v) => setDFrom(v)} /></DatFieldLite>
          <DatFieldLite label="ถึงวันที่"><window.ThaiDateField value={dTo} min={dFrom} onChange={(v) => setDTo(v)} /></DatFieldLite>
          <DatFieldLite label="ตั้งแต่ประเภท">
            <select className="cfg-input" value={tFrom} onChange={(e) => setTFrom(e.target.value)}>
              {allTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="ถึงประเภท">
            <select className="cfg-input" value={tTo} onChange={(e) => setTTo(e.target.value)}>
              {allTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </DatFieldLite>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}><button className="btn primary" style={{ height: 32 }} disabled={!dFrom || !dTo} onClick={runAdv}>ประมวลผล</button></div>
        </div>
      </div>
      ) : (
      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls" style={{ gridTemplateColumns: periodId === 'custom' ? 'repeat(3, minmax(0, 1fr))' : 'minmax(0, 1fr)', maxWidth: periodId === 'custom' ? 'none' : 360 }}>
          <DatFieldLite label={adv ? 'รอบจ่าย' : 'ช่วงประมาณการ'}>
            <select className="cfg-input" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
              {DEP_PROJ_PERIODS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </DatFieldLite>
          {periodId === 'custom' && (
            <>
              <DatFieldLite label="ตั้งแต่วันที่"><window.ThaiDateField value={fromDate} max={toDate} onChange={(v) => setFromDate(v)} /></DatFieldLite>
              <DatFieldLite label="ถึงวันที่"><window.ThaiDateField value={toDate} min={fromDate} onChange={(v) => setToDate(v)} /></DatFieldLite>
            </>
          )}
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          <Icon name="info" size={11} /> สูตร: ยอดคงเหลือ × อัตรา% × จำนวนวัน ÷ 365 · ช่วง {fmt.date(from)} – {fmt.date(to)} = {days} วัน · เงินฝากประจำหักภาษี ณ ที่จ่าย 15%
        </div>
      </div>
      )}

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
        {adv ? <>
          <IvStat label="ดอกเบี้ยสุทธิที่ต้องจ่าย" value={fmt.money(totals.net, 2)} sub="บาท" accent tone="success" />
          <IvStat label="บัญชีที่ถึงรอบจ่าย" value={totals.n} sub="บัญชี" />
          <IvStat label="ภาษีหัก ณ ที่จ่าย" value={fmt.money(totals.tax, 2)} sub="บาท" tone="danger" />
          <IvStat label="วันจ่าย" value={fmt.date(to)} sub={'อีก ' + days + ' วัน'} tone="warning" />
        </> : <>
          <IvStat label="บัญชีที่ประมาณการ" value={totals.n} sub="บัญชี" accent />
          <IvStat label="ดอกเบี้ยประมาณการ (Gross)" value={fmt.money(totals.gross, 2)} sub="บาท" />
          <IvStat label="ภาษีหัก ณ ที่จ่าย" value={fmt.money(totals.tax, 2)} sub="บาท" tone="danger" />
          <IvStat label="ดอกเบี้ยสุทธิ (ประมาณการ)" value={fmt.money(totals.net, 2)} sub="บาท" tone="success" />
        </>}
      </div>

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <div className="dat-section-head is-bar"><span className="head-bar" />
          <div className="dat-section-title">{adv ? 'ยอดจ่ายดอกเบี้ยรายประเภทเงินฝาก' : 'ประมาณการดอกเบี้ยรายประเภทเงินฝาก'}</div>
        </div>
        <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
          <table className="tbl" style={{ width: '100%', minWidth: 760 }}>
            <thead><tr>
              <th style={{ width: 70 }}>รหัส</th><th>ประเภทเงินฝาก</th>
              <th className="center">บัญชี</th><th className="right">ยอดคงเหลือรวม</th><th className="center">อัตราเฉลี่ย</th>
              <th className="right">ดอกเบี้ยประมาณการ</th><th className="right">ภาษี</th><th className="right">สุทธิ</th>
              <th className="center" style={{ width: 90 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {byType.map(t => {
                const has = t.n > 0;
                return (
                  <tr key={t.code}>
                    <td className="mono">{t.code}</td>
                    <td>
                      <div className="lt-row-name">{t.name}</div>
                      {t.taxable && <div className="lt-row-note muted">หักภาษี ณ ที่จ่าย 15%</div>}
                    </td>
                    <td className="center mono">{has ? t.n : <span className="muted">—</span>}</td>
                    <td className="right mono">{has ? fmt.money(t.balance, 2) : <span className="muted">—</span>}</td>
                    <td className="center mono">{has ? t.avgRate.toFixed(2) + '%' : <span className="muted">{(t.avgRate || 0).toFixed(2)}%</span>}</td>
                    <td className="right mono">{has ? fmt.money(t.gross, 2) : <span className="muted">—</span>}</td>
                    <td className="right mono" style={{ color: has && t.tax ? 'var(--danger)' : undefined }}>{has ? (t.tax ? fmt.money(t.tax, 2) : '—') : <span className="muted">—</span>}</td>
                    <td className="right mono">{has ? <b>{fmt.money(t.net, 2)}</b> : <span className="muted">—</span>}</td>
                    <td className="center">{has ? <button className="btn sm ex-row-btn fb-act-btn" onClick={() => setOpenType(t.code)}><Icon name="eye" size={13} /> ดู</button> : <span className="muted" style={{ fontSize: 11 }}>ไม่มีบัญชี</span>}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr>
              <td colSpan="3" className="right">รวมทุกประเภท</td>
              <td className="right mono">{fmt.money(totals.balance, 2)}</td>
              <td />
              <td className="right mono">{fmt.money(totals.gross, 2)}</td>
              <td className="right mono">{fmt.money(totals.tax, 2)}</td>
              <td className="right mono"><b>{fmt.money(totals.net, 2)}</b></td>
              <td />
            </tr></tfoot>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> ตัวเลขเป็น<b>ประมาณการ</b>จากยอดคงเหลือและอัตราดอกเบี้ยปัจจุบัน มิใช่ยอดที่ลงบัญชีจริง · ใช้เพื่อวางแผน/ตั้งประมาณการดอกเบี้ยจ่าย</div>
    </div>
  );
}

Object.assign(window, { DepInterestProjectionPage });
