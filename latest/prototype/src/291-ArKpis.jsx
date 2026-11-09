// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — ทะเบียน/บัญชีแยกประเภทย่อย
//  ยอดยกมา · ธนาคาร · เจ้าหนี้ · ลูกหนี้
// ════════════════════════════════════════════════════════════════════
const { useState: arUseState, useMemo: arUseMemo } = React;

// แถบ KPI (ใช้คลาส .fin-kpi ร่วมกับโมดูลการเงิน)
function ArKpis({ items }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
      {items.map((k, i) => (
        <div key={i} className={"fin-kpi" + (k.accent ? ' accent' : '')} style={{ flex: 1, minWidth: 150 }}>
          <div className="fin-kpi-lab">{k.lab}</div>
          <div className="fin-kpi-val">{k.val} {k.unit && <span className="fin-kpi-unit">{k.unit}</span>}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ป้ายอายุหนี้ (aging) ────────────────────────────────────────────
function arAgeBucket(dueIso) {
  const today = new Date();
  const due = new Date(dueIso);
  const days = Math.floor((today - due) / 86400000);
  if (days < 0) return { k: 'future', l: 'ยังไม่ถึงกำหนด', tone: 'info', days };
  if (days <= 30) return { k: 'd30', l: 'ค้าง 1–30 วัน', tone: 'warning', days };
  if (days <= 60) return { k: 'd60', l: 'ค้าง 31–60 วัน', tone: 'warning', days };
  return { k: 'd90', l: 'ค้างเกิน 60 วัน', tone: 'danger', days };
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   1. ยอดยกมา (Opening Balances)                                  │
// ╰─────────────────────────────────────────────────────────────────╯
const OPENING_SEED = [
  { code: '110101', name: 'เงินสด', dr: 250000, cr: 0 },
  { code: '110102', name: 'เงินสดย่อย', dr: 30000, cr: 0 },
  { code: '110111', name: 'เงินฝากธนาคาร–กระแสรายวัน', dr: 18450000, cr: 0 },
  { code: '110202', name: 'ลูกหนี้เงินให้กู้–สามัญ', dr: 1042799500, cr: 0 },
  { code: '113000', name: 'เงินลงทุน', dr: 285000000, cr: 0 },
  { code: '120000', name: 'ที่ดิน อาคาร และอุปกรณ์ (สุทธิ)', dr: 42800000, cr: 0 },
  { code: '210100', name: 'เงินรับฝากจากสมาชิก', dr: 0, cr: 528600000 },
  { code: '210301', name: 'ภาษีหัก ณ ที่จ่ายค้างจ่าย', dr: 0, cr: 184500 },
  { code: '310100', name: 'ทุนเรือนหุ้น', dr: 0, cr: 712400000 },
  { code: '320100', name: 'ทุนสำรอง', dr: 0, cr: 98500000 },
  { code: '330100', name: 'กำไรสะสมรอจัดสรร', dr: 0, cr: 49645000 },
];
function OpeningBalancePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [year, setYear] = arUseState(2569);
  const [rows, setRows] = arUseState(() => { try { const s = localStorage.getItem('acct_opening_' + 2569); if (s) return JSON.parse(s); } catch (e) {} return OPENING_SEED.map(r => ({ ...r })); });
  const [editing, setEditing] = arUseState(false);
  const [locked, setLocked] = arUseState(() => localStorage.getItem('acct_opening_locked_2569') === '1');

  const tot = arUseMemo(() => rows.reduce((t, r) => { t.dr += Number(r.dr || 0); t.cr += Number(r.cr || 0); return t; }, { dr: 0, cr: 0 }), [rows]);
  const balanced = Math.abs(tot.dr - tot.cr) < 0.5;
  const persist = (next) => { setRows(next); try { localStorage.setItem('acct_opening_' + year, JSON.stringify(next)); } catch (e) {} };
  const setCell = (i, k, v) => persist(rows.map((r, j) => j === i ? { ...r, [k]: Number(String(v).replace(/[^\d.]/g, '')) || 0 } : r));

  const save = () => { setEditing(false); onToast && onToast('บันทึกยอดยกมาเรียบร้อย'); audit.log && audit.log({ action: 'update', module: 'บัญชี — ยอดยกมา', target: 'ปี ' + year, summary: 'แก้ไขยอดยกมา' }); };
  const lock = () => { if (!balanced) { onToast && onToast('ยอดเดบิตและเครดิตไม่เท่ากัน — ยืนยันไม่ได้'); return; } setLocked(true); localStorage.setItem('acct_opening_locked_2569', '1'); onToast && onToast('ยืนยันและล็อกยอดยกมาแล้ว'); audit.log && audit.log({ action: 'approve', module: 'บัญชี — ยอดยกมา', target: 'ปี ' + year, summary: 'ยืนยันยอดยกมา' }); };

  return (
    <div data-screen-label="หน้ายอดยกมา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยอดยกมา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึกยอดยกมาต้นงวดบัญชีของแต่ละบัญชีในผังบัญชี — เดบิตต้องเท่ากับเครดิต</div>
        </div>
        <span className="spacer" />
        <div className="year-switcher">
          <button className="btn ghost sm" onClick={() => setYear(y => y - 1)}><Icon name="chevLeft" /></button>
          <div className="yr-display"><div className="yr-be">ปีบัญชี {year}</div></div>
          <button className="btn ghost sm" onClick={() => setYear(y => y + 1)}><Icon name="chevRight" /></button>
        </div>
        <button className="btn sm"><Icon name="upload" /> นำเข้า</button>
        {locked ? <span className="chip success"><Icon name="lock" size={11} /> ยืนยันแล้ว</span>
          : editing ? <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
          : <button className="btn sm" onClick={() => setEditing(true)}><Icon name="edit" /> แก้ไข</button>}
        {!locked && !editing && <button className="btn accent sm" onClick={lock}><Icon name="check" /> ยืนยันยอดยกมา</button>}
      </div>

      <div className="as-stat-row ob-stat-row" style={{ marginTop: 4 }}>
        {[
          { lab: 'จำนวนบัญชี', val: rows.length, unit: 'บัญชี' },
          { lab: 'รวมเดบิต', val: window.fmt.money(tot.dr), unit: 'บาท', tone: 'dr' },
          { lab: 'รวมเครดิต', val: window.fmt.money(tot.cr), unit: 'บาท', tone: 'cr' },
          { lab: 'สถานะดุล', val: balanced ? 'สมดุล ✓' : 'ไม่สมดุล', unit: '' },
        ].map((k, i) => (
          <div key={i} className={"as-stat as-stat-card" + (k.tone ? ' is-' + k.tone : '')}>
            <span className="as-stat-lab">{k.lab}</span>
            <span className="as-stat-val"><b className="as-stat-num">{k.val}</b>{k.unit && <span className="as-stat-unit">{k.unit}</span>}</span>
          </div>
        ))}
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <h3>ตารางยอดยกมาตามผังบัญชี</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {rows.length} บัญชี</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead><tr><th style={{ width: 100 }}>รหัสบัญชี</th><th style={{ minWidth: 280 }}>ชื่อบัญชี</th><th className="right" style={{ width: 170 }}>ยอดยกมา–เดบิต</th><th className="right" style={{ width: 170 }}>ยอดยกมา–เครดิต</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.code}>
                  <td className="mono">{r.code}</td>
                  <td>{r.name}</td>
                  <td className="right mono">{editing && !locked ? <input className="cfg-input mono" style={{ textAlign: 'right' }} value={r.dr || ''} onChange={e => setCell(i, 'dr', e.target.value)} /> : (r.dr ? window.fmt.money(r.dr) : '—')}</td>
                  <td className="right mono">{editing && !locked ? <input className="cfg-input mono" style={{ textAlign: 'right' }} value={r.cr || ''} onChange={e => setCell(i, 'cr', e.target.value)} /> : (r.cr ? window.fmt.money(r.cr) : '—')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="pc-rep-tot"><td colSpan={2} className="right">รวมทั้งสิ้น</td><td className="right mono">{window.fmt.money(tot.dr)}</td><td className="right mono">{window.fmt.money(tot.cr)}</td></tr></tfoot>
          </table>
        </div>
        <div className="lt-list-foot muted">
          {balanced ? <span className="pill ok"><Icon name="check" size={11} /> เดบิต = เครดิต ยอดยกมาสมดุล</span> : <span className="pill bad"><Icon name="info" size={11} /> ผลต่าง {window.fmt.money(Math.abs(tot.dr - tot.cr))} บาท</span>}
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   2. ธนาคาร (Bank book & reconciliation)                         │
// ╰─────────────────────────────────────────────────────────────────╯
if (!document.getElementById('ob-stat-style')) {
  const st = document.createElement('style');
  st.id = 'ob-stat-style';
  st.textContent = '.ob-stat-row .as-stat-card { flex-direction: column; align-items: flex-start; gap: 8px; background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; min-width: 132px; }'
    + '.ob-stat-row .as-stat-lab { font-size: 12.5px; font-weight: 600; color: var(--text); }'
    + '.ob-stat-row .as-stat-val { display: flex; align-items: baseline; gap: 5px; }'
    + '.ob-stat-row .as-stat-num { font-size: 22px; font-weight: 700; line-height: 1; margin: 0; }'
    + '.ob-stat-row .as-stat-unit { font-size: 11.5px; color: var(--text-muted); }'
    + '.ob-stat-row .as-stat-card.is-ok { background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.ob-stat-row .as-stat-card.is-ok .as-stat-lab, .ob-stat-row .as-stat-card.is-ok .as-stat-num { color: #237450; }'
    + '.ob-stat-row .as-stat-card.is-dr { background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.ob-stat-row .as-stat-card.is-dr .as-stat-lab, .ob-stat-row .as-stat-card.is-dr .as-stat-num { color: #237450; }'
    + '.ob-stat-row .as-stat-card.is-cr { background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.ob-stat-row .as-stat-card.is-cr .as-stat-lab, .ob-stat-row .as-stat-card.is-cr .as-stat-num { color: #237450; }'
    + '.ob-stat-row .as-stat-val { flex-wrap: wrap !important; row-gap: 2px; min-width: 0; }'
    + '.ob-stat-row .as-stat-num { max-width: 100%; overflow-wrap: anywhere; }'
    + '.yr-display .yr-be { white-space: nowrap; }'
    + '.yr-display { min-width: max-content; }'
    + '.ob-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }'
    + '@media (max-width: 900px) { .ob-stat-row { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); } .ob-stat-row .as-stat-num { font-size: 19px; } }'
    + '@media (max-width: 640px) { .ob-stat-row { grid-template-columns: 1fr 1fr; } [data-screen-label="หน้ายอดยกมา"] .page-actions { flex-wrap: wrap; row-gap: 8px; } [data-screen-label="หน้ายอดยกมา"] .year-switcher { margin-left: 0; } }'
    + '[data-screen-label="หน้ายอดยกมา"] .section-head > .head-bar { display: none !important; }';
  document.head.appendChild(st);
}

const BANK_ACCTS = [
  { id: 'kbank-001', gl: '110111', name: 'ธ.กสิกรไทย สาขาราชการ', no: '023-1-44521-0', kind: 'กระแสรายวัน', book: 18450000, stmt: 18450000 },
  { id: 'ktb-101', gl: '110112', name: 'ธ.กรุงไทย สาขาราชการ', no: '980-1-50031-2', kind: 'ออมทรัพย์ (รับเงินทั่วไป)', book: 6240500, stmt: 6255500 },
  { id: 'gsb-003', gl: '110113', name: 'ธ.ออมสิน สาขาเทศบาล', no: '020-99-88776-6', kind: 'ออมทรัพย์ (บัญชีลงทุน)', book: 32100000, stmt: 32100000 },
  { id: 'kbank-103', gl: '110120', name: 'ธ.กสิกรไทย สาขาราชการ', no: '023-1-66120-8', kind: 'กระแสรายวัน (QR)', book: 1875300, stmt: 1862300 },
];
const BANK_STMT = {
  'ktb-101': [
    { date: '2026-06-12', desc: 'รับโอนค่าหุ้นรายเดือน', in: 1500, out: 0, matched: true },
    { date: '2026-06-11', desc: 'ดอกเบี้ยเงินฝากธนาคาร', in: 15000, out: 0, matched: false },
    { date: '2026-06-08', desc: 'รับชำระเงินกู้ผ่านระบบ', in: 12400, out: 0, matched: true },
    { date: '2026-06-05', desc: 'ค่าธรรมเนียมบริการ', in: 0, out: 0, matched: true },
  ],
  'kbank-103': [
    { date: '2026-06-13', desc: 'รับชำระ QR สมาชิก', in: 4800, out: 0, matched: true },
    { date: '2026-06-10', desc: 'ค่าธรรมเนียม QR (ยังไม่บันทึก)', in: 0, out: 13000, matched: false },
  ],
};
function BankPage({ onToast }) {
  const [sel, setSel] = arUseState('ktb-101');
  const acct = BANK_ACCTS.find(a => a.id === sel);
  const stmt = BANK_STMT[sel] || [];
  const totBook = BANK_ACCTS.reduce((s, a) => s + a.book, 0);
  const unrec = BANK_ACCTS.filter(a => a.book !== a.stmt).length;
  return (
    <div data-screen-label="หน้าธนาคาร">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ธนาคาร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>สมุดบัญชีเงินฝากธนาคารของสหกรณ์ และการกระทบยอดกับ Statement ธนาคาร</div>
        </div>
        <span className="spacer" />
        <button className="btn sm"><Icon name="upload" /> นำเข้า Statement</button>
        <button className="btn primary sm" onClick={() => onToast && onToast('เปิดหน้ากระทบยอดธนาคาร')}><Icon name="check" /> กระทบยอดธนาคาร</button>
      </div>

      <div className="as-stat-row ob-stat-row" style={{ marginTop: 4 }}>
        {[
          { lab: 'บัญชีธนาคาร', val: BANK_ACCTS.length, unit: 'บัญชี' },
          { lab: 'ยอดตามสมุดรวม', val: window.fmt.money(totBook), unit: 'บาท', tone: 'ok' },
          { lab: 'บัญชีที่ยังไม่กระทบยอด', val: unrec, unit: 'บัญชี' },
        ].map((k, i) => (
          <div key={i} className={"as-stat as-stat-card" + (k.tone ? ' is-' + k.tone : '')}>
            <span className="as-stat-lab">{k.lab}</span>
            <span className="as-stat-val"><b className="as-stat-num">{k.val}</b>{k.unit && <span className="as-stat-unit">{k.unit}</span>}</span>
          </div>
        ))}
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead><tr><th style={{ minWidth: 220 }}>บัญชีธนาคาร</th><th style={{ width: 130 }}>เลขที่บัญชี</th><th className="mono" style={{ width: 80 }}>ผังบัญชี</th><th className="right" style={{ width: 130 }}>ยอดตามสมุด</th><th className="right" style={{ width: 130 }}>ยอดตาม Statement</th><th className="center" style={{ width: 120 }}>สถานะ</th></tr></thead>
            <tbody>
              {BANK_ACCTS.map(a => {
                const diff = a.book - a.stmt;
                return (
                  <tr key={a.id} className={sel === a.id ? 'is-sel' : ''} style={{ cursor: 'pointer' }} onClick={() => setSel(a.id)}>
                    <td><div style={{ fontWeight: 600 }}>{a.name}</div><div className="muted" style={{ fontSize: 11 }}>{a.kind}</div></td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{a.no}</td>
                    <td className="mono">{a.gl}</td>
                    <td className="right mono">{window.fmt.money(a.book)}</td>
                    <td className="right mono">{window.fmt.money(a.stmt)}</td>
                    <td className="center">{diff === 0 ? <span className="pill ok">กระทบยอดตรง</span> : <span className="pill warn">ต่าง {window.fmt.money(Math.abs(diff))}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 16 }}>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 640 }}>
          <thead><tr><th style={{ width: 110 }}>วันที่</th><th>รายการ</th><th className="right" style={{ width: 110 }}>เงินเข้า</th><th className="right" style={{ width: 110 }}>เงินออก</th><th className="center" style={{ width: 130 }}>กระทบยอด</th></tr></thead>
          <tbody>
            {stmt.length === 0 && <tr><td colSpan={5} className="center muted" style={{ padding: 20 }}>ไม่มีรายการ</td></tr>}
            {stmt.map((s, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontSize: 11.5 }}>{window.fmt.date(s.date)}</td>
                <td>{s.desc}</td>
                <td className="right mono pc-in">{s.in ? window.fmt.money(s.in) : '—'}</td>
                <td className="right mono pc-out">{s.out ? window.fmt.money(s.out) : '—'}</td>
                <td className="center">{s.matched ? <span className="pill ok"><Icon name="check" size={11} /> ตรงกัน</span> : <span className="pill warn">รอบันทึก</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   3. เจ้าหนี้ (Accounts Payable) + 4. ลูกหนี้ (Receivable)        │
// ╰─────────────────────────────────────────────────────────────────╯
const AP_SEED = [
  { doc: 'PV-6906-0003', name: 'การไฟฟ้าส่วนภูมิภาค', kind: 'ค่าสาธารณูปโภค', amount: 28500, due: '2026-06-09' },
  { doc: 'PV-6906-0007', name: 'หจก. ศรีสมบูรณ์ เครื่องเขียน', kind: 'จัดซื้อวัสดุ', amount: 24600, due: '2026-06-20' },
  { doc: 'AP-6905-0021', name: 'บจก. ไอทีโซลูชั่น ซิสเต็มส์', kind: 'ค่าพัฒนาระบบ งวด 3', amount: 600000, due: '2026-06-30' },
  { doc: 'AP-6905-0014', name: 'บจก. รักษ์ความสะอาด เซอร์วิส', kind: 'ค่าบริการทำความสะอาด', amount: 18000, due: '2026-05-15' },
  { doc: 'AP-6904-0033', name: 'บจก. เพาเวอร์เน็ต คอมพิวเตอร์', kind: 'ครุภัณฑ์คอมพิวเตอร์', amount: 142000, due: '2026-04-20' },
];
const AR_SEED = [
  { doc: 'AR-6906-0008', name: 'ตัวแทนหักเงิน ณ ที่จ่าย กรมการสื่อสาร', kind: 'ลูกหนี้ตัวแทน', amount: 185400, due: '2026-06-25' },
  { doc: 'PC-690611-01', name: 'นางสาวศิริพร ใจงาม', kind: 'เงินทดรองจ่าย', amount: 5000, due: '2026-06-18' },
  { doc: 'AR-6905-0012', name: 'บมจ. ทิพยประกันภัย', kind: 'ค่าตอบแทนตัวแทนประกัน', amount: 48200, due: '2026-06-10' },
  { doc: 'AR-6905-0004', name: 'ดอกเบี้ยค้างรับ–เงินลงทุน', kind: 'ดอกเบี้ยค้างรับ', amount: 137500, due: '2026-06-17' },
  { doc: 'AR-6904-0019', name: 'บจก. ศูนย์ฝึกอบรม เอ็กเซลเลนซ์', kind: 'ลูกหนี้การค้า', amount: 32000, due: '2026-04-30' },
];
function SubledgerPage({ mode, onToast }) {
  const isAP = mode === 'ap';
  const seed = isAP ? AP_SEED : AR_SEED;
  const title = isAP ? 'เจ้าหนี้' : 'ลูกหนี้';
  const colName = isAP ? 'เจ้าหนี้' : 'ลูกหนี้';
  const total = seed.reduce((s, r) => s + r.amount, 0);
  const overdue = seed.filter(r => arAgeBucket(r.due).days > 0).reduce((s, r) => s + r.amount, 0);
  return (
    <div data-screen-label={`หน้า${title}`}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียน{title}คงค้างและการวิเคราะห์อายุหนี้ (Aging) {isAP ? '— ยอดที่สหกรณ์ต้องชำระ' : '— ยอดที่สหกรณ์ต้องเรียกเก็บ (ไม่รวมลูกหนี้เงินกู้)'}
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm"><Icon name="download" /> ส่งออกรายงาน</button>
        <button className="btn primary sm" onClick={() => onToast && onToast(`บันทึก${title}ใหม่`)}><Icon name="plus" /> บันทึก{title}</button>
      </div>

      <div className="as-stat-row ob-stat-row" style={{ marginTop: 4 }}>
        {[
          { lab: `จำนวน${colName}`, val: seed.length, unit: 'ราย' },
          { lab: 'ยอดคงค้างรวม', val: window.fmt.money(total), unit: 'บาท', tone: 'ok' },
          { lab: 'เกินกำหนดชำระ', val: window.fmt.money(overdue), unit: 'บาท' },
        ].map((k, i) => (
          <div key={i} className={"as-stat as-stat-card" + (k.tone ? ' is-' + k.tone : '')}>
            <span className="as-stat-lab">{k.lab}</span>
            <span className="as-stat-val"><b className="as-stat-num">{k.val}</b>{k.unit && <span className="as-stat-unit">{k.unit}</span>}</span>
          </div>
        ))}
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <h3>ทะเบียน{title}คงค้าง</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {seed.length} ราย</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead><tr><th style={{ width: 130 }}>เลขที่เอกสาร</th><th style={{ minWidth: 240 }}>{colName}</th><th style={{ width: 110 }}>วันครบกำหนด</th><th className="right" style={{ width: 130 }}>ยอดคงค้าง</th><th className="center" style={{ width: 150 }}>อายุหนี้</th></tr></thead>
            <tbody>
              {window.arSortDue(seed).map(r => {
                const age = arAgeBucket(r.due);
                return (
                  <tr key={r.doc}>
                    <td className="mono" style={{ fontSize: 11.5 }}>{r.doc}</td>
                    <td><div style={{ fontWeight: 600 }}>{r.name}</div><div className="muted" style={{ fontSize: 11 }}>{r.kind}</div></td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{window.fmt.date(r.due)}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(r.amount)}</td>
                    <td className="center"><span className={"chip " + age.tone}>{age.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr className="pc-rep-tot"><td colSpan={3} className="right">รวมคงค้างทั้งสิ้น</td><td className="right mono">{window.fmt.money(total)}</td><td></td></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
window.arSortDue = (list) => [...list].sort((a, b) => (a.due < b.due ? -1 : 1));

function PayablePage(props) { return <SubledgerPage mode="ap" {...props} />; }
function ReceivablePage(props) { return <SubledgerPage mode="ar" {...props} />; }

Object.assign(window, { OpeningBalancePage, BankPage, PayablePage, ReceivablePage });
