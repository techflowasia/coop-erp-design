// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ดอกเบี้ยเงินฝาก
//  • คำนวณดอกเบี้ย    (DepInterestCalcPage)
//  • จ่ายดอกเบี้ย     (DepInterestPayPage)
//  • ดอกเบี้ยค้างจ่าย (DepInterestAccruedPage)
//  • คำนวณดอกเบี้ยค้าง (DepInterestAccruedCalcPage) — รายวัน / ตามงวด
//  • รายงานดอกเบี้ยค้างจ่าย (DepInterestAccruedReportPage)
//  ประเภทเงินฝาก / อัตราดอกเบี้ย / ภาษี / ฐานวัน ดึงจากค่าคงที่ประเภทเงินฝาก (ผ่าน dpcRules)
// ════════════════════════════════════════════════════════════════════

const DEP_INT_SCOPES = ['ทุกประเภท', 'ออมทรัพย์', 'ออมทรัพย์พิเศษ', 'ฝากประจำ 12 เดือน'];   // ค่าเดิม (ไม่ใช้แล้ว)
// ประเภทเงินฝากให้เลือก — จากค่าคงที่ประเภทเงินฝาก (value = รหัสประเภท)
const depIntTypes = () => { try { return (window.datLoad ? window.datLoad() : []).filter(t => t.enabled !== false); } catch (e) { return []; } };
const depScopeLabel = (scope) => { if (!scope || scope === 'ทุกประเภท') return 'ทุกประเภท'; const t = depIntTypes().find(x => x.code === scope); return t ? t.name : scope; };
function DepIntScopeSelect({ value, onChange, style }) {
  const types = depIntTypes();
  return (
    <select className="cfg-input" style={style} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="ทุกประเภท">ทุกประเภท</option>
      {types.map(t => <option key={t.code} value={t.code}>{t.code} · {t.name}</option>)}
    </select>
  );
}
const depScopeFilter = (accounts, scope) => {
  const act = accounts.filter(a => a.status === 'active');
  if (!scope || scope === 'ทุกประเภท') return act;
  const tokens = scope.split('+').map(s => s.trim());
  return act.filter(a => tokens.includes(a.typeCode) || tokens.includes(a.type));
};
// อัตราดอกเบี้ย / ภาษี / ฐานวัน ตามกฎประเภทเงินฝาก ณ วันที่ (ไม่พบประเภท → ค่าในบัญชี)
function depIntRuleOf(a, date) {
  try {
    const r = window.dpcRules ? window.dpcRules(a, { type: 'deposit', date: date || window.DEP_OPS_TODAY, amt: 0, moves: [] }) : null;
    if (r) return { rate: r.intOn === false ? 0 : Number(r.rate) || 0, taxRate: (Number(r.taxRate) || 0) / 100, dayBase: Number(r.dayBase) || 365, src: r.rateSrc || '' };
  } catch (e) {}
  return { rate: Number(a.rate) || 0, taxRate: window.depTaxRate ? window.depTaxRate(a.typeCode) : 0, dayBase: 365, src: 'บัญชี' };
}

// จำนวนวันคิดดอกเบี้ยแบบนับรวมวันต้น-วันปลาย (เลือกวันเดียวกัน = 1 วัน)
const depIntDays = (fromDate, toDate) => (fromDate && toDate && toDate >= fromDate) ? window.depDaysBetween(fromDate, toDate) + 1 : 0;

// คำนวณบรรทัดดอกเบี้ยของชุด (period from→to แบบเดียวกันทุกบัญชี)
function depBuildIntLines(accounts, fromDate, toDate, scope) {
  const days = depIntDays(fromDate, toDate);
  return depScopeFilter(accounts, scope).map(a => {
    const r = depIntRuleOf(a, toDate);
    const gross = a.balance * (r.rate / 100) * days / r.dayBase;
    const taxRate = r.taxRate;
    const tax = gross * taxRate;
    return { accNo: a.accNo, member: a.member, name: a.name, type: a.type, typeCode: a.typeCode,
      balance: a.balance, rate: r.rate, days, gross, tax, net: gross - tax, taxRate };
  });
}
const depSum = (lines, k) => lines.reduce((s, x) => s + (x[k] || 0), 0);

// ─── 1) คำนวณดอกเบี้ย ─────────────────────────────────────────────────
function DepInterestCalcPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [runs, setRuns] = useState(window.depIntLoad);
  const [scope, setScope] = useState('ทุกประเภท');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-06-30');
  const [period, setPeriod] = useState('ครึ่งปีแรก 2569');
  const [preview, setPreview] = useState(null);

  const run = () => {
    const lines = depBuildIntLines(accounts, fromDate, toDate, scope);
    setPreview(lines);
    onToast && onToast(`คำนวณดอกเบี้ย ${lines.length} บัญชี — รวมดอกเบี้ยสุทธิ ${fmt.money(depSum(lines, 'net'), 2)} บาท`);
  };
  const save = () => {
    const n = runs.reduce((m, r) => Math.max(m, parseInt(String(r.id).slice(-2), 10) || 0), 0) + 1;
    const rec = { id: 'INT-2569-' + String(n).padStart(2, '0'), period, scope: depScopeLabel(scope), scopeCode: scope, calcDate: window.DEP_OPS_TODAY,
      fromDate, toDate, accounts: preview.length, gross: depSum(preview, 'gross'), tax: depSum(preview, 'tax'),
      net: depSum(preview, 'net'), status: 'calculated', postDate: '', by: window.DEP_OPS_USER, acctLines: preview };
    const next = [rec, ...runs]; setRuns(next); window.depIntSave(next);
    audit.log({ action: 'create', module: 'เงินฝาก — คำนวณดอกเบี้ย', target: rec.id,
      summary: `คำนวณดอกเบี้ย ${rec.accounts} บัญชี รวมสุทธิ ${fmt.money(rec.net, 2)} บาท`,
      changes: [{ field: 'ดอกเบี้ยสุทธิ', before: '—', after: fmt.money(rec.net, 2) }] });
    setPreview(null);
    onToast && onToast(`บันทึกชุดคำนวณ ${rec.id} เรียบร้อย — รอจ่ายดอกเบี้ยที่เมนู “จ่ายดอกเบี้ย”`);
  };

  return (
    <div data-screen-label="หน้าคำนวณดอกเบี้ย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>คำนวณดอกเบี้ยเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>คำนวณดอกเบี้ยตามช่วงเวลา แยกตามประเภทบัญชี พร้อมหักภาษี ณ ที่จ่ายสำหรับเงินฝากประจำ</div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls">
          <DatFieldLite label="ประเภทบัญชี">
            <DepIntScopeSelect value={scope} onChange={setScope} />
          </DatFieldLite>
          <DatFieldLite label="งวด / รอบ"><input className="cfg-input" value={period} onChange={(e) => setPeriod(e.target.value)} /></DatFieldLite>
          <DatFieldLite label="คำนวณตั้งแต่"><window.ThaiDateField value={fromDate} onChange={(v) => setFromDate(v)} /></DatFieldLite>
          <DatFieldLite label="ถึงวันที่"><window.ThaiDateField value={toDate} onChange={(v) => setToDate(v)} /></DatFieldLite>
          <button className="btn primary" onClick={run}>คำนวณดอกเบี้ย</button>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          <Icon name="info" size={11} /> สูตร: ยอดคงเหลือ × อัตรา% × จำนวนวัน ÷ ฐานวัน (อัตรา / ภาษีตามประเภทเงินฝาก) · ช่วงที่เลือก = {depIntDays(fromDate, toDate)} วัน (นับรวมวันแรกและวันสุดท้าย — เลือกวันเดียวกันจะคิดเฉพาะวันนั้น)
        </div>
      </div>

      {preview && (
        <>
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
            <IvStat label="บัญชีที่คำนวณ" value={preview.length + ' บัญชี'} accent />
            <IvStat label="ดอกเบี้ยรวม (Gross)" value={'฿ ' + fmt.money(depSum(preview, 'gross'), 2)} />
            <IvStat label="ภาษีหัก ณ ที่จ่าย" value={'฿ ' + fmt.money(depSum(preview, 'tax'), 2)} tone="danger" />
            <IvStat label="ดอกเบี้ยสุทธิ" value={'฿ ' + fmt.money(depSum(preview, 'net'), 2)} tone="success" />
          </div>
          <div className="search-card dat-section" style={{ marginTop: 12 }}>
            <div className="table-wrap" style={{ margin: '12px 16px 16px' }}>
              <table className="tbl" style={{ minWidth: 900 }}>
                <thead><tr>
                  <th className="mono">เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th>
                  <th className="right">ยอดคงเหลือ</th><th className="center">อัตรา</th><th className="center">วัน</th>
                  <th className="right">ดอกเบี้ย</th><th className="right">ภาษี</th><th className="right">สุทธิ</th>
                </tr></thead>
                <tbody>
                  {preview.map(l => (
                    <tr key={l.accNo}>
                      <td className="mono">{l.accNo}</td>
                      <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
                      <td style={{ fontSize: 12 }}>{l.type}</td>
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
                  <td colSpan="6" className="right">รวมทั้งสิ้น</td>
                  <td className="right mono">{fmt.money(depSum(preview, 'gross'), 2)}</td>
                  <td className="right mono">{fmt.money(depSum(preview, 'tax'), 2)}</td>
                  <td className="right mono"><b>{fmt.money(depSum(preview, 'net'), 2)}</b></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
          <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setPreview(null)}>ยกเลิก</button>
            <button className="btn primary" onClick={save}><Icon name="check" /> บันทึกชุดคำนวณ (รอจ่าย)</button>
          </div>
        </>
      )}

      <DepIntRunTable runs={runs} title="ประวัติการคำนวณดอกเบี้ย" />
    </div>
  );
}

// ─── ตารางประวัติชุดคำนวณ (ใช้ร่วม) ───────────────────────────────────
function DepIntRunTable({ runs, title, onPick }) {
  const ST = { calculated: { l: 'คำนวณแล้ว · รอจ่าย', pill: 'warn' }, posted: { l: 'จ่ายแล้ว', pill: 'ok' } };
  return (
    <div className="search-card dat-section" style={{ marginTop: 12 }}>
      <div className="dat-section-head is-bar"><span className="head-bar" />
        <div className="dat-section-title">{title}</div></div>
      <div className="table-wrap" style={{ margin: '12px 16px 16px' }}>
        <table className="tbl" style={{ minWidth: 880 }}>
          <thead><tr>
            <th>เลขที่ชุด</th><th>งวด / รอบ</th><th>ประเภท</th><th className="center">วันที่คำนวณ</th>
            <th className="center">บัญชี</th><th className="right">ดอกเบี้ยสุทธิ</th><th className="center">สถานะ</th>
            {onPick && <th className="center" style={{ width: 90 }} />}
          </tr></thead>
          <tbody>
            {runs.length === 0 && <tr><td colSpan={onPick ? 8 : 7} className="center muted" style={{ padding: 24 }}>ยังไม่มีชุดคำนวณ</td></tr>}
            {runs.map(r => {
              const st = ST[r.status] || ST.calculated;
              return (
                <tr key={r.id} className={onPick && r.status === 'calculated' ? 'clickable' : ''} onClick={() => onPick && r.status === 'calculated' && onPick(r)}>
                  <td className="mono">{r.id}</td>
                  <td>{r.period}</td>
                  <td style={{ fontSize: 12 }}>{r.scope}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.calcDate)}</td>
                  <td className="center mono">{r.accounts}</td>
                  <td className="right mono"><b>{fmt.money(r.net, 2)}</b></td>
                  <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                  {onPick && <td className="center">{r.status === 'calculated' ? <button className="btn ghost sm">จ่าย <Icon name="chevRight" size={12} /></button> : <span className="muted" style={{ fontSize: 11 }}>—</span>}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 2) จ่ายดอกเบี้ย ──────────────────────────────────────────────────
function DepInterestPayPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [runs, setRuns] = useState(window.depIntLoad);
  const [openRun, setOpenRun] = useState(null);

  const linesOf = (r) => r.acctLines || depBuildIntLines(accounts, r.fromDate, r.toDate, r.scope);

  const post = (r) => {
    const lines = linesOf(r);
    let nextAcc = accounts.map(a => ({ ...a }));
    const newLedger = [];
    lines.forEach(l => {
      const idx = nextAcc.findIndex(a => a.accNo === l.accNo);
      if (idx < 0) return;
      const nb = nextAcc[idx].balance + l.net;
      nextAcc[idx] = { ...nextAcc[idx], balance: nb, lastIntDate: r.toDate, ytdInterest: (nextAcc[idx].ytdInterest || 0) + l.net };
      newLedger.unshift({ id: window.depTxnNextId(), date: window.DEP_OPS_TODAY, accNo: l.accNo, member: l.member,
        type: 'interest', channel: 'ดอกเบี้ยเงินฝาก', amount: l.net, fee: l.tax, balance: nb, ref: r.id, by: window.DEP_OPS_USER });
    });
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    const nextL = [...newLedger, ...ledger]; setLedger(nextL); window.depTxnSaveLedger(nextL);
    const nextRuns = runs.map(x => x.id === r.id ? { ...x, status: 'posted', postDate: window.DEP_OPS_TODAY } : x);
    setRuns(nextRuns); window.depIntSave(nextRuns);
    audit.log({ action: 'update', module: 'เงินฝาก — จ่ายดอกเบี้ย', target: r.id,
      summary: `จ่ายดอกเบี้ย ${lines.length} บัญชี รวมสุทธิ ${fmt.money(depSum(lines, 'net'), 2)} บาท เข้าบัญชีเงินฝาก`,
      changes: [{ field: 'สถานะ', before: 'คำนวณแล้ว', after: 'จ่ายแล้ว' }] });
    setOpenRun(null);
    onToast && onToast(`จ่ายดอกเบี้ยชุด ${r.id} เข้าบัญชีเงินฝาก ${lines.length} บัญชีเรียบร้อย`);
  };

  if (openRun) {
    const lines = linesOf(openRun);
    return (
      <div data-screen-label="หน้ารายละเอียดจ่ายดอกเบี้ย">
        <div className="page-actions">
          <button className="btn ghost sm" onClick={() => setOpenRun(null)}><Icon name="chevLeft" /> กลับสู่รายการชุดคำนวณ</button>
          <span className="spacer" />
          <button className="btn primary sm" onClick={() => post(openRun)}><Icon name="wallet" /> จ่ายดอกเบี้ยเข้าบัญชี ({lines.length})</button>
        </div>
        <div className="search-card lt-head-card">
          <div className="lt-head-main">
            <div className="lt-head-ico"><Icon name="money" size={20} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className="lt-head-title">ชุดคำนวณ <span className="mono">{openRun.id}</span> <span className="pill warn">รอจ่าย</span></h1>
              <div className="lt-head-meta"><span>{openRun.period}</span><span className="dot" /><span>{openRun.scope}</span><span className="dot" /><span>คำนวณ {fmt.date(openRun.calcDate)}</span></div>
            </div>
          </div>
        </div>
        <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <IvStat label="ดอกเบี้ยรวม (Gross)" value={'฿ ' + fmt.money(depSum(lines, 'gross'), 2)} />
          <IvStat label="ภาษีหัก ณ ที่จ่าย" value={'฿ ' + fmt.money(depSum(lines, 'tax'), 2)} tone="danger" />
          <IvStat label="ดอกเบี้ยสุทธิ (จ่ายเข้าบัญชี)" value={'฿ ' + fmt.money(depSum(lines, 'net'), 2)} accent tone="success" />
        </div>
        <div className="search-card dat-section" style={{ marginTop: 12 }}>
          <div className="table-wrap" style={{ margin: '12px 16px 16px' }}>
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead><tr><th className="mono">เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th><th className="right">ดอกเบี้ย</th><th className="right">ภาษี</th><th className="right">สุทธิ</th></tr></thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.accNo}>
                    <td className="mono">{l.accNo}</td>
                    <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
                    <td style={{ fontSize: 12 }}>{l.type}</td>
                    <td className="right mono">{fmt.money(l.gross, 2)}</td>
                    <td className="right mono" style={{ color: l.tax ? 'var(--danger)' : undefined }}>{l.tax ? fmt.money(l.tax, 2) : '—'}</td>
                    <td className="right mono"><b>{fmt.money(l.net, 2)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const waiting = runs.filter(r => r.status === 'calculated');
  return (
    <div data-screen-label="หน้าจ่ายดอกเบี้ย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>จ่ายดอกเบี้ยเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกชุดที่คำนวณแล้วเพื่อจ่ายดอกเบี้ยสุทธิเข้าบัญชีเงินฝากสมาชิก พร้อมบันทึกรายการอัตโนมัติ</div>
        </div>
      </div>
      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="ชุดรอจ่าย" value={waiting.length + ' ชุด'} tone={waiting.length ? 'warning' : undefined} accent />
        <IvStat label="ดอกเบี้ยสุทธิรอจ่าย" value={'฿ ' + fmt.money(waiting.reduce((s, r) => s + r.net, 0), 2)} />
        <IvStat label="จ่ายแล้วปีนี้" value={runs.filter(r => r.status === 'posted').length + ' ชุด'} tone="success" />
      </div>
      <DepIntRunTable runs={runs} title="ชุดคำนวณดอกเบี้ย — คลิกชุดที่รอจ่ายเพื่อจ่ายเข้าบัญชี" onPick={setOpenRun} />
    </div>
  );
}

// ─── 3) ดอกเบี้ยค้างจ่าย ──────────────────────────────────────────────
function DepInterestAccruedPage({ onToast }) {
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [runs] = useState(window.depIntLoad);
  const [scope, setScope] = useState('ทุกประเภท');

  const lines = depScopeFilter(accounts, scope).map(a => depAccruedLine(a, window.DEP_OPS_TODAY));
  const waiting = runs.filter(r => r.status === 'calculated');

  return (
    <div data-screen-label="หน้าดอกเบี้ยค้างจ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ดอกเบี้ยค้างจ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ประมาณการดอกเบี้ยค้างจ่ายสะสมของแต่ละบัญชี นับจากวันจ่ายดอกเบี้ยครั้งล่าสุดถึงวันนี้ ({fmt.date(window.DEP_OPS_TODAY)})</div>
        </div>
        <span className="spacer" />
        <DepIntScopeSelect style={{ width: 'auto' }} value={scope} onChange={setScope} />
      </div>

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
        <IvStat label="บัญชีที่มีดอกเบี้ยค้าง" value={lines.length + ' บัญชี'} accent />
        <IvStat label="ดอกเบี้ยค้าง (Gross)" value={'฿ ' + fmt.money(depSum(lines, 'gross'), 2)} />
        <IvStat label="ภาษีค้างหัก" value={'฿ ' + fmt.money(depSum(lines, 'tax'), 2)} tone="danger" />
        <IvStat label="ดอกเบี้ยค้างสุทธิ" value={'฿ ' + fmt.money(depSum(lines, 'net'), 2)} tone="warning" />
      </div>

      {waiting.length > 0 && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="info" size={14} />
          <span>มีชุดที่<b>คำนวณแล้วรอจ่าย</b> {waiting.length} ชุด (สุทธิ {fmt.money(waiting.reduce((s, r) => s + r.net, 0), 2)} บาท) — ดำเนินการได้ที่เมนู “จ่ายดอกเบี้ย”</span>
        </div>
      )}

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead><tr>
              <th className="mono">เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th>
              <th className="right">ยอดคงเหลือ</th><th className="center">อัตรา</th>
              <th className="center">จ่ายล่าสุด</th><th className="center">วันค้าง</th>
              <th className="right">ดอกเบี้ยค้าง</th><th className="right">สุทธิ</th>
            </tr></thead>
            <tbody>
              {lines.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: 24 }}>ไม่มีบัญชีในกลุ่มนี้</td></tr>}
              {lines.map(l => (
                <tr key={l.accNo}>
                  <td className="mono">{l.accNo}</td>
                  <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
                  <td style={{ fontSize: 12 }}>{l.type}</td>
                  <td className="right mono">{fmt.money(l.balance, 2)}</td>
                  <td className="center mono">{l.rate.toFixed(2)}%</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(l.from)}</td>
                  <td className="center mono">{l.days}</td>
                  <td className="right mono">{fmt.money(l.gross, 2)}</td>
                  <td className="right mono"><b>{fmt.money(l.net, 2)}</b></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan="7" className="right">รวมดอกเบี้ยค้างจ่ายสุทธิ</td><td className="right mono">{fmt.money(depSum(lines, 'gross'), 2)}</td><td className="right mono"><b>{fmt.money(depSum(lines, 'net'), 2)}</b></td></tr></tfoot>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> ตัวเลขเป็นประมาณการแบบ Real-time · ยอดจริงจะลงบัญชีเมื่อ “คำนวณดอกเบี้ย” และ “จ่ายดอกเบี้ย” ตามรอบ</div>
    </div>
  );
}

// ─── 4) คำนวณดอกเบี้ยค้าง (รวมคำนวณดอกเบี้ย) — เลือกช่วงเวลาเป็นรายวัน หรือตามงวด ───
//  รายวัน : เลือกช่วงวันที่ แล้วติ๊กวันที่จะคำนวณ (ทุกวัน / วันทำการ / วันสิ้นเดือน / เลือกเอง)
//  ตามงวด : เลือกงวดจ่ายดอกเบี้ยของประเภทเงินฝาก หรือรายเดือน / รายไตรมาส — คิดทุกวันในงวด
//  บันทึกแล้วเป็นชุดรอจ่ายที่เมนู "จ่ายดอกเบี้ย" · เตือนเมื่อวันที่เลือกซ้ำกับชุดที่บันทึกไว้แล้ว
const depWeekdayTh = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const DEP_TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function depFmtISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function depEnumDays(from, to) {
  const out = [];
  if (!from || !to) return out;
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  let d = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  let guard = 0;
  while (d <= end && guard++ < 400) { out.push(depFmtISO(d)); d.setDate(d.getDate() + 1); }
  return out;
}
const depMonthEnd = (y, m) => depFmtISO(new Date(y, m, 0));     // m = 1..12
// ดอกเบี้ยรายวันของบัญชี — อัตรา / ภาษี / ฐานวันตามกฎประเภทเงินฝาก
function depDailyLine(a, date) {
  const r = depIntRuleOf(a, date);
  const gross = a.balance * (r.rate / 100) / r.dayBase;
  const tax = gross * r.taxRate;
  return { accNo: a.accNo, member: a.member, name: a.name, type: a.type, typeCode: a.typeCode,
    balance: a.balance, rate: r.rate, taxRate: r.taxRate, dayBase: r.dayBase, dGross: gross, dTax: tax, dNet: gross - tax };
}
// เดือนที่จ่ายดอกเบี้ย — จากตาราง "วันที่จ่ายดอกเบี้ย/ปันผล" ของประเภทเงินฝาก (ไม่มี → มิ.ย./ธ.ค.)
function depPayMonths(scope) {
  let types = [];
  try { types = window.datLoad ? window.datLoad() : []; } catch (e) {}
  if (scope && scope !== 'ทุกประเภท') types = types.filter(t => t.code === scope);
  const set = new Set();
  types.forEach(t => {
    if (t.settings && t.settings.monthlyIntOn) for (let m = 1; m <= 12; m++) set.add(m);
    (t.dividendDates || []).forEach(r => { const m = Number(r.payMonth); if (m >= 1 && m <= 12) set.add(m); });
  });
  const list = [...set].sort((a, b) => a - b);
  return list.length ? list : [6, 12];
}
// รายการงวดให้เลือก (ปีก่อน + ปีนี้ ตามวันทำการ)
function depPeriodOptions(scope) {
  const today = window.DEP_OPS_TODAY || new Date().toISOString().slice(0, 10);
  const y0 = Number(today.slice(0, 4));
  const pay = depPayMonths(scope);
  const out = [];
  [y0, y0 - 1].forEach(y => {
    const be = y + 543;
    // งวดจ่ายดอกเบี้ยของประเภทเงินฝาก
    pay.forEach((m, i) => {
      const prevM = i === 0 ? pay[pay.length - 1] : pay[i - 1];
      const fromY = i === 0 && prevM >= m ? y - 1 : y;
      const from = pay.length === 1 ? `${y}-01-01` : depFmtISO(new Date(fromY, prevM, 1));
      const to = depMonthEnd(y, m);
      const fl = from.slice(0, 4) === to.slice(0, 4) ? DEP_TH_MON[Number(from.slice(5, 7)) - 1] : DEP_TH_MON[Number(from.slice(5, 7)) - 1] + ' ' + (Number(from.slice(0, 4)) + 543);
      out.push({ key: `pay-${y}-${m}`, group: 'งวดจ่ายดอกเบี้ย ' + be, from, to,
        label: `งวดที่ ${i + 1}/${be} (${fl}–${DEP_TH_MON[m - 1]} ${be})` });
    });
    // รายไตรมาส
    for (let q = 4; q >= 1; q--) out.push({ key: `q-${y}-${q}`, group: 'รายไตรมาส ' + be, from: `${y}-${String(q * 3 - 2).padStart(2, '0')}-01`, to: depMonthEnd(y, q * 3), label: `ไตรมาส ${q}/${be}` });
    // รายเดือน
    for (let m = 12; m >= 1; m--) out.push({ key: `m-${y}-${m}`, group: 'รายเดือน ' + be, from: `${y}-${String(m).padStart(2, '0')}-01`, to: depMonthEnd(y, m), label: `${DEP_TH_MON[m - 1]} ${be}` });
  });
  return out;
}
// วันที่ซ้ำกับชุดคำนวณที่บันทึกไว้แล้ว (ประเภทเงินฝากทับกัน)
function depRunOverlap(runs, scope, days) {
  const want = new Set(days);
  const hits = [];
  (runs || []).forEach(r => {
    const rs = r.scopeCode || r.scope;
    const scopeHit = scope === 'ทุกประเภท' || rs === 'ทุกประเภท' || rs === scope || r.scope === depScopeLabel(scope);
    if (!scopeHit) return;
    const rd = r.selectedDays || depEnumDays(r.fromDate, r.toDate);
    const n = rd.filter(d => want.has(d)).length;
    if (n) hits.push({ id: r.id, n });
  });
  return hits;
}

function DepInterestAccruedCalcPage({ onToast, initialMode }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [runs, setRuns] = useState(window.depIntLoad);
  const [scope, setScope] = useState('ทุกประเภท');
  const [mode, setMode] = useState(initialMode === 'period' ? 'period' : 'daily');   // daily | period
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState(window.DEP_OPS_TODAY);
  const periodOpts = useMemo(() => depPeriodOptions(scope), [scope]);
  const [periodKey, setPeriodKey] = useState('');
  const period = periodOpts.find(p => p.key === periodKey) || periodOpts[0];
  const [expanded, setExpanded] = useState(null);

  const rFrom = mode === 'period' && period ? period.from : fromDate;
  const rTo = mode === 'period' && period ? period.to : toDate;

  // บัญชีที่มีรายการค้างจ่ายดอกเบี้ย (ใช้งานอยู่ + มียอด + มีอัตรา)
  const dailyLines = useMemo(
    () => depScopeFilter(accounts, scope).map(a => depDailyLine(a, rTo)).filter(l => l.balance > 0 && l.rate > 0),
    [accounts, scope, rTo]
  );
  const perDay = useMemo(() => ({
    n: dailyLines.length,
    gross: depSum(dailyLines, 'dGross'),
    tax: depSum(dailyLines, 'dTax'),
    net: depSum(dailyLines, 'dNet'),
  }), [dailyLines]);

  const days = useMemo(() => depEnumDays(rFrom, rTo), [rFrom, rTo]);
  const [selected, setSelected] = useState(() => new Set());
  // ตั้งค่าเริ่มต้น/รีเซ็ตให้เลือกทุกวันเมื่อช่วงวันเปลี่ยน
  useEffect(() => { setSelected(new Set(days)); setExpanded(null); }, [rFrom, rTo, mode]);

  const toggleDay = (iso) => setSelected(s => { const n = new Set(s); n.has(iso) ? n.delete(iso) : n.add(iso); return n; });
  const allOn = days.length > 0 && days.every(d => selected.has(d));
  const setAll = () => setSelected(allOn ? new Set() : new Set(days));
  const weekdayDays = days.filter(d => { const [y, m, dd] = d.split('-').map(Number); const w = new Date(y, m - 1, dd).getDay(); return w !== 0 && w !== 6; });
  const monthEndDays = days.filter(d => { const [y, m, dd] = d.split('-').map(Number); return dd === new Date(y, m, 0).getDate(); });
  const sameSet = (arr) => arr.length > 0 && arr.length === selected.size && arr.every(d => selected.has(d));
  const dayMode = selected.size === 0 ? 'custom' : allOn ? 'all' : sameSet(weekdayDays) ? 'weekday' : sameSet(monthEndDays) ? 'monthend' : 'custom';
  const pickDayMode = (m) => {
    if (m === 'all') setSelected(new Set(days));
    else if (m === 'weekday') setSelected(new Set(weekdayDays));
    else if (m === 'monthend') setSelected(new Set(monthEndDays));
  };

  const selDays = mode === 'period' ? days : days.filter(d => selected.has(d));
  const nSel = selDays.length;
  const acctLines = dailyLines.map(l => ({
    accNo: l.accNo, member: l.member, name: l.name, type: l.type, typeCode: l.typeCode,
    balance: l.balance, rate: l.rate, days: nSel, taxRate: l.taxRate,
    gross: l.dGross * nSel, tax: l.dTax * nSel, net: l.dNet * nSel,
  }));
  const totGross = depSum(acctLines, 'gross'), totTax = depSum(acctLines, 'tax'), totNet = depSum(acctLines, 'net');
  const overlap = useMemo(() => depRunOverlap(runs, scope, selDays), [runs, scope, selDays.join(',')]);

  const save = () => {
    if (nSel === 0) { onToast && onToast('กรุณาเลือกวันที่ต้องการคำนวณอย่างน้อย 1 วัน'); return; }
    const be = Number(String(window.DEP_OPS_TODAY || '').slice(0, 4)) + 543 || 2569;
    const pre = 'INT-' + be + '-';
    const n = runs.filter(r => String(r.id).startsWith(pre)).reduce((m, r) => Math.max(m, parseInt(String(r.id).slice(pre.length), 10) || 0), 0) + 1;
    const rec = { id: pre + String(n).padStart(2, '0'),
      period: mode === 'period' && period ? period.label : `ดอกเบี้ยค้าง ${nSel} วัน`,
      scope: depScopeLabel(scope), scopeCode: scope, mode,
      calcDate: window.DEP_OPS_TODAY, fromDate: selDays[0], toDate: selDays[selDays.length - 1],
      accounts: acctLines.length, gross: totGross, tax: totTax, net: totNet,
      status: 'calculated', postDate: '', by: window.DEP_OPS_USER, acctLines, selectedDays: selDays };
    const next = [rec, ...runs]; setRuns(next); window.depIntSave(next);
    audit.log({ action: 'create', module: 'เงินฝาก — คำนวณดอกเบี้ยค้าง', target: rec.id,
      summary: `คำนวณดอกเบี้ยค้าง ${rec.period} · ${acctLines.length} บัญชี · ${nSel} วัน รวมสุทธิ ${fmt.money(rec.net, 2)} บาท`,
      changes: [{ field: 'ดอกเบี้ยค้างสุทธิ', before: '—', after: fmt.money(rec.net, 2) }] });
    onToast && onToast(`บันทึกชุดคำนวณ ${rec.id} (${rec.period}) — รอจ่ายที่เมนู “จ่ายดอกเบี้ย”`);
  };

  const acctTable = (
    <table className="tbl" style={{ minWidth: 900 }}>
      <thead><tr>
        <th className="mono">เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th>
        <th className="right">ยอดคงเหลือ</th><th className="center">อัตรา</th><th className="center">วัน</th>
        <th className="right">ดอกเบี้ย</th><th className="right">ภาษี</th><th className="right">สุทธิ</th>
      </tr></thead>
      <tbody>
        {acctLines.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: 24 }}>ไม่มีบัญชีที่มีดอกเบี้ยค้างในกลุ่มนี้</td></tr>}
        {acctLines.map(l => (
          <tr key={l.accNo}>
            <td className="mono">{l.accNo}</td>
            <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
            <td style={{ fontSize: 12 }}>{l.type}</td>
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
        <td colSpan="6" className="right">รวมทั้งสิ้น</td>
        <td className="right mono">{fmt.money(totGross, 2)}</td>
        <td className="right mono">{fmt.money(totTax, 2)}</td>
        <td className="right mono"><b>{fmt.money(totNet, 2)}</b></td>
      </tr></tfoot>
    </table>
  );

  return (
    <div data-screen-label="หน้าคำนวณดอกเบี้ยค้าง">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>คำนวณดอกเบี้ยค้าง</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>คำนวณดอกเบี้ยค้างจ่ายเป็นรายวัน หรือตามงวด แยกตามประเภทเงินฝาก พร้อมหักภาษี ณ ที่จ่ายตามกฎประเภทเงินฝาก</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" onClick={save} disabled={nSel === 0 || acctLines.length === 0}>
          <Icon name="check" /> บันทึกชุดคำนวณ ({nSel} วัน)
        </button>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          <DatFieldLite label="ประเภทเงินฝาก">
            <DepIntScopeSelect value={scope} onChange={(v) => { setScope(v); setPeriodKey(''); }} />
          </DatFieldLite>
          <DatFieldLite label="รูปแบบช่วงเวลา">
            <select className="cfg-input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="daily">รายวัน (เลือกวันเอง)</option>
              <option value="period">ตามงวด</option>
            </select>
          </DatFieldLite>
          {mode === 'daily' ? (
            <>
              <DatFieldLite label="ตั้งแต่วันที่"><window.ThaiDateField value={fromDate} max={toDate} onChange={(v) => v && setFromDate(v)} /></DatFieldLite>
              <DatFieldLite label="ถึงวันที่"><window.ThaiDateField value={toDate} min={fromDate} onChange={(v) => v && setToDate(v)} /></DatFieldLite>
              <DatFieldLite label="วันที่คำนวณ">
                <select className="cfg-input" value={dayMode} onChange={(e) => pickDayMode(e.target.value)}>
                  <option value="all">ทุกวัน</option>
                  <option value="weekday" disabled={weekdayDays.length === 0}>เฉพาะวันทำการ{weekdayDays.length === 0 ? ' (ไม่มีในช่วงนี้)' : ''}</option>
                  <option value="monthend" disabled={monthEndDays.length === 0}>เฉพาะวันสิ้นเดือน{monthEndDays.length === 0 ? ' (ไม่มีในช่วงนี้)' : ''}</option>
                  <option value="custom" disabled>เลือกเอง (ติ๊กในตาราง)</option>
                </select>
              </DatFieldLite>
            </>
          ) : (
            <>
              <DatFieldLite label="งวด">
                <select className="cfg-input" value={period ? period.key : ''} onChange={(e) => setPeriodKey(e.target.value)}>
                  {[...new Set(periodOpts.map(p => p.group))].map(g => (
                    <optgroup key={g} label={g}>
                      {periodOpts.filter(p => p.group === g).map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </DatFieldLite>
              <DatFieldLite label="ตั้งแต่วันที่"><div className="cfg-display-box mono">{period ? fmt.date(period.from) : '—'}</div></DatFieldLite>
              <DatFieldLite label="ถึงวันที่"><div className="cfg-display-box mono">{period ? fmt.date(period.to) : '—'}</div></DatFieldLite>
            </>
          )}
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          <Icon name="info" size={11} /> ดอกเบี้ยรายวัน = ยอดคงเหลือ × อัตรา% ÷ ฐานวัน (อัตรา / ภาษี / ฐานวันตามประเภทเงินฝาก) · ช่วง {days.length} วัน · คำนวณ {nSel} วัน · บัญชีค้างจ่าย {perDay.n} บัญชี (ดอกเบี้ยสุทธิ/วัน {fmt.money(perDay.net, 2)} บาท) · บันทึกแล้วจะเป็นชุดรอจ่ายที่เมนู “จ่ายดอกเบี้ย”
        </div>
      </div>

      {overlap.length > 0 && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="info" size={14} />
          <span>วันที่เลือกซ้ำกับชุดคำนวณที่บันทึกไว้แล้ว — {overlap.map(o => `${o.id} (${o.n} วัน)`).join(', ')} · ตรวจสอบก่อนบันทึกเพื่อไม่ให้คิดดอกเบี้ยซ้ำ</span>
        </div>
      )}

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
        <IvStat label="วันที่คำนวณ" value={nSel + ' วัน'} sub={mode === 'period' && period ? period.label : 'จากช่วง ' + days.length + ' วัน'} accent tone={nSel ? 'warning' : undefined} />
        <IvStat label="ดอกเบี้ยค้างรวม (Gross)" value={fmt.money(totGross, 2)} sub={acctLines.length + ' บัญชี · บาท'} />
        <IvStat label="ภาษีหัก ณ ที่จ่าย" value={fmt.money(totTax, 2)} sub="บาท" tone="danger" />
        <IvStat label="ดอกเบี้ยค้างสุทธิ" value={fmt.money(totNet, 2)} sub="บาท" tone="success" />
      </div>

      {mode === 'period' ? (
        <div className="search-card dat-section" style={{ marginTop: 12 }}>
          <DepSecHead bar icon="report" title={'ดอกเบี้ยค้างรายบัญชี — ' + (period ? period.label : '')} />
          <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">{acctTable}</div></div>
        </div>
      ) : (
        <div className="search-card dat-section" style={{ marginTop: 12 }}>
          <DepSecHead bar icon="calendar" title="เลือกวันที่ต้องการคำนวณดอกเบี้ยค้าง" />
          <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead><tr>
                <th className="center" style={{ width: 42 }}><input type="checkbox" className="ct-check" checked={allOn} onChange={setAll} aria-label="เลือกทุกวัน" /></th>
                <th className="center">วันที่</th><th className="center">วัน</th>
                <th className="center">บัญชีค้างจ่าย</th>
                <th className="right">ดอกเบี้ย/วัน</th><th className="right">ภาษี/วัน</th><th className="right">สุทธิ/วัน</th>
                <th className="right">สะสมสุทธิ (ที่เลือก)</th>
              </tr></thead>
              <tbody>
                {days.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 24 }}>ช่วงวันที่ไม่ถูกต้อง</td></tr>}
                {(() => { let cum = 0; return days.map(iso => {
                  const [y, m, dd] = iso.split('-').map(Number);
                  const w = new Date(y, m - 1, dd).getDay();
                  const on = selected.has(iso);
                  const weekend = w === 0 || w === 6;
                  if (on) cum += perDay.net;
                  const isOpen = expanded === iso;
                  return (
                    <React.Fragment key={iso}>
                      <tr className={"clickable" + (on ? '' : ' dep-day-off')} onClick={() => setExpanded(isOpen ? null : iso)}
                          style={{ background: on ? undefined : 'var(--surface-muted, #fafafa)' }}>
                        <td className="center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="ct-check" checked={on} onChange={() => toggleDay(iso)} aria-label={iso} />
                        </td>
                        <td className="center mono">{fmt.date(iso)}</td>
                        <td className="center" style={{ color: weekend ? 'var(--danger)' : undefined, fontSize: 12 }}>{depWeekdayTh[w]}</td>
                        <td className="center mono">{perDay.n}</td>
                        <td className="right mono">{fmt.money(perDay.gross, 2)}</td>
                        <td className="right mono" style={{ color: perDay.tax ? 'var(--danger)' : undefined }}>{perDay.tax ? fmt.money(perDay.tax, 2) : '—'}</td>
                        <td className="right mono"><b>{fmt.money(perDay.net, 2)}</b></td>
                        <td className="right mono" style={{ color: on ? 'var(--primary-700, #1c5c40)' : 'var(--ink-400, #bbb)' }}>{on ? fmt.money(cum, 2) : '—'}</td>
                      </tr>
                      {isOpen && (
                        <tr className="dep-day-detail"><td colSpan="8" style={{ padding: 0, background: 'var(--surface-muted, #fafafa)' }}>
                          <div style={{ padding: '4px 12px 10px' }}>
                            <table className="tbl" style={{ minWidth: 600, background: 'var(--surface-card, #fff)' }}>
                              <thead><tr><th className="mono">เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th><th className="right">ยอดคงเหลือ</th><th className="center">อัตรา</th><th className="right">ดอกเบี้ย/วัน</th><th className="right">ภาษี/วัน</th><th className="right">สุทธิ/วัน</th></tr></thead>
                              <tbody>
                                {dailyLines.map(l => (
                                  <tr key={l.accNo}>
                                    <td className="mono">{l.accNo}</td>
                                    <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
                                    <td style={{ fontSize: 12 }}>{l.type}</td>
                                    <td className="right mono">{fmt.money(l.balance, 2)}</td>
                                    <td className="center mono">{l.rate.toFixed(2)}%</td>
                                    <td className="right mono">{fmt.money(l.dGross, 4)}</td>
                                    <td className="right mono" style={{ color: l.dTax ? 'var(--danger)' : undefined }}>{l.dTax ? fmt.money(l.dTax, 4) : '—'}</td>
                                    <td className="right mono"><b>{fmt.money(l.dNet, 4)}</b></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                }); })()}
              </tbody>
              <tfoot><tr>
                <td colSpan="6" className="right">รวมดอกเบี้ยค้างของ {nSel} วันที่เลือก</td>
                <td className="right mono">{fmt.money(totTax, 2)}</td>
                <td className="right mono"><b>{fmt.money(totNet, 2)}</b></td>
              </tr></tfoot>
            </table>
          </div></div>
        </div>
      )}

      <DepIntRunTable runs={runs} title="ประวัติการคำนวณดอกเบี้ย" />
    </div>
  );
}

// ─── 5) รายงานดอกเบี้ยค้างจ่าย — ณ วันที่เลือก · สรุปตามประเภท + รายบัญชี · พิมพ์ / ส่งออก Excel ───
function depAccruedLine(a, asOf) {
  const r = depIntRuleOf(a, asOf);
  const from = a.lastIntDate || '2025-12-31';
  const days = asOf > from ? window.depDaysBetween(from, asOf) : 0;
  const gross = a.balance * (r.rate / 100) * days / r.dayBase;
  const tax = gross * r.taxRate;
  return { accNo: a.accNo, member: a.member, name: a.name, type: a.type, typeCode: a.typeCode,
    balance: a.balance, rate: r.rate, from, days, gross, tax, net: gross - tax };
}
function DepInterestAccruedReportPage({ onToast }) {
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [scope, setScope] = useState('ทุกประเภท');
  const [asOf, setAsOf] = useState(window.DEP_OPS_TODAY);
  const [view, setView] = useState('summary');        // summary | detail
  const lines = useMemo(() => depScopeFilter(accounts, scope).map(a => depAccruedLine(a, asOf)), [accounts, scope, asOf]);
  const groups = useMemo(() => {
    const m = new Map();
    lines.forEach(l => {
      const g = m.get(l.typeCode) || { typeCode: l.typeCode, type: l.type, n: 0, balance: 0, gross: 0, tax: 0, net: 0 };
      g.n += 1; g.balance += l.balance; g.gross += l.gross; g.tax += l.tax; g.net += l.net; m.set(l.typeCode, g);
    });
    return [...m.values()];
  }, [lines]);
  const exportCsv = () => {
    const head = ['เลขที่บัญชี', 'สมาชิก', 'ชื่อบัญชี', 'ประเภท', 'ยอดคงเหลือ', 'อัตรา%', 'คิดตั้งแต่', 'วันค้าง', 'ดอกเบี้ยค้าง', 'ภาษี', 'สุทธิ'];
    const rows = lines.map(l => [l.accNo, l.member, l.name, l.type, l.balance.toFixed(2), l.rate.toFixed(2), l.from, l.days, l.gross.toFixed(2), l.tax.toFixed(2), l.net.toFixed(2)]);
    const csv = '﻿' + [head, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'รายงานดอกเบี้ยค้างจ่าย_' + asOf + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast && onToast('ส่งออกรายงานดอกเบี้ยค้างจ่าย ' + lines.length + ' บัญชี');
  };
  const printIt = () => {
    document.documentElement.classList.add('dep-printing');
    const cleanup = () => { document.documentElement.classList.remove('dep-printing'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 60);
  };

  return (
    <div data-screen-label="หน้ารายงานดอกเบี้ยค้างจ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายงานดอกเบี้ยค้างจ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ดอกเบี้ยค้างจ่ายสะสมของแต่ละบัญชี นับจากวันจ่ายดอกเบี้ยครั้งล่าสุดถึงวันที่เลือก — อัตรา / ภาษีตามประเภทเงินฝาก</div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={exportCsv} disabled={!lines.length}><Icon name="download" size={13} /> ส่งออก Excel</button>
        <button className="btn sm" onClick={printIt} disabled={!lines.length}><Icon name="print" size={13} /> พิมพ์</button>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <DatFieldLite label="ประเภทเงินฝาก"><DepIntScopeSelect value={scope} onChange={setScope} /></DatFieldLite>
          <DatFieldLite label="ณ วันที่"><window.ThaiDateField value={asOf} onChange={(v) => v && setAsOf(v)} /></DatFieldLite>
          <DatFieldLite label="รูปแบบรายงาน">
            <select className="cfg-input" value={view} onChange={(e) => setView(e.target.value)}>
              <option value="summary">สรุปตามประเภทเงินฝาก</option>
              <option value="detail">รายบัญชี</option>
            </select>
          </DatFieldLite>
        </div>
      </div>

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
        <IvStat label="บัญชีที่มีดอกเบี้ยค้าง" value={lines.filter(l => l.gross > 0).length + ' บัญชี'} accent />
        <IvStat label="ดอกเบี้ยค้าง (Gross)" value={'฿ ' + fmt.money(depSum(lines, 'gross'), 2)} />
        <IvStat label="ภาษีค้างหัก" value={'฿ ' + fmt.money(depSum(lines, 'tax'), 2)} tone="danger" />
        <IvStat label="ดอกเบี้ยค้างสุทธิ" value={'฿ ' + fmt.money(depSum(lines, 'net'), 2)} tone="warning" />
      </div>

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <DepSecHead bar icon="report" title={(view === 'summary' ? 'สรุปตามประเภทเงินฝาก' : 'รายบัญชี') + ' ณ วันที่ ' + fmt.date(asOf)} />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          {view === 'summary' ? (
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead><tr>
                <th>ประเภทเงินฝาก</th><th className="center">จำนวนบัญชี</th><th className="right">ยอดเงินฝากรวม</th>
                <th className="right">ดอกเบี้ยค้าง</th><th className="right">ภาษี</th><th className="right">สุทธิ</th>
              </tr></thead>
              <tbody>
                {groups.length === 0 && <tr><td colSpan="6" className="center muted" style={{ padding: 24 }}>ไม่มีบัญชีในกลุ่มนี้</td></tr>}
                {groups.map(g => (
                  <tr key={g.typeCode}>
                    <td><span className="mono muted">{g.typeCode}</span> {g.type}</td>
                    <td className="center mono">{g.n}</td>
                    <td className="right mono">{fmt.money(g.balance, 2)}</td>
                    <td className="right mono">{fmt.money(g.gross, 2)}</td>
                    <td className="right mono" style={{ color: g.tax ? 'var(--danger)' : undefined }}>{g.tax ? fmt.money(g.tax, 2) : '—'}</td>
                    <td className="right mono"><b>{fmt.money(g.net, 2)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td className="right">รวมทั้งสิ้น</td><td className="center mono">{lines.length}</td>
                <td className="right mono">{fmt.money(depSum(lines, 'balance'), 2)}</td>
                <td className="right mono">{fmt.money(depSum(lines, 'gross'), 2)}</td>
                <td className="right mono">{fmt.money(depSum(lines, 'tax'), 2)}</td>
                <td className="right mono"><b>{fmt.money(depSum(lines, 'net'), 2)}</b></td>
              </tr></tfoot>
            </table>
          ) : (
            <table className="tbl" style={{ minWidth: 980 }}>
              <thead><tr>
                <th className="mono">เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th>
                <th className="right">ยอดคงเหลือ</th><th className="center">อัตรา</th>
                <th className="center">จ่ายล่าสุด</th><th className="center">วันค้าง</th>
                <th className="right">ดอกเบี้ยค้าง</th><th className="right">ภาษี</th><th className="right">สุทธิ</th>
              </tr></thead>
              <tbody>
                {lines.length === 0 && <tr><td colSpan="10" className="center muted" style={{ padding: 24 }}>ไม่มีบัญชีในกลุ่มนี้</td></tr>}
                {lines.map(l => (
                  <tr key={l.accNo}>
                    <td className="mono">{l.accNo}</td>
                    <td><div className="lt-row-name">{l.name}</div><div className="lt-row-note muted mono">{l.member}</div></td>
                    <td style={{ fontSize: 12 }}>{l.type}</td>
                    <td className="right mono">{fmt.money(l.balance, 2)}</td>
                    <td className="center mono">{l.rate.toFixed(2)}%</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(l.from)}</td>
                    <td className="center mono">{l.days}</td>
                    <td className="right mono">{fmt.money(l.gross, 2)}</td>
                    <td className="right mono" style={{ color: l.tax ? 'var(--danger)' : undefined }}>{l.tax ? fmt.money(l.tax, 2) : '—'}</td>
                    <td className="right mono"><b>{fmt.money(l.net, 2)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td colSpan="7" className="right">รวมดอกเบี้ยค้างจ่าย</td>
                <td className="right mono">{fmt.money(depSum(lines, 'gross'), 2)}</td>
                <td className="right mono">{fmt.money(depSum(lines, 'tax'), 2)}</td>
                <td className="right mono"><b>{fmt.money(depSum(lines, 'net'), 2)}</b></td>
              </tr></tfoot>
            </table>
          )}
        </div></div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> เป็นยอดประมาณการ ณ วันที่เลือก · ยอดจริงลงบัญชีเมื่อคำนวณดอกเบี้ยและจ่ายดอกเบี้ยตามรอบ</div>
    </div>
  );
}

Object.assign(window, { DepInterestCalcPage, DepInterestPayPage, DepInterestAccruedPage, DepInterestAccruedCalcPage, DepInterestAccruedReportPage });
