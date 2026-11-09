// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ประมวลผิดนัดการฝาก (DepDefaultProcessPage)
//  ตรวจหาบัญชีเงินฝากรายเดือนที่ไม่ส่งเงินฝากตามกำหนดในงวดที่เลือก
//  แล้วบันทึกจำนวนครั้งผิดนัด + ยอดค้างส่งสะสมของแต่ละบัญชี
// ════════════════════════════════════════════════════════════════════

const DEP_DF_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// ประเภทเงินฝากที่บังคับส่งรายเดือน (รหัส 56 = ออมทรัพย์รายเดือน/สัจจะ)
const DEP_DF_TYPES = [
  { code: '56', label: '56 — ออมทรัพย์รายเดือน (สัจจะ)' },
  { code: '52', label: '52 — ออมทรัพย์พิเศษรายเดือน' },
];

// บัญชีที่ผูกภาระฝากรายเดือน (มี monthlyDeposit) → จำลองประวัติการส่ง
// missed = จำนวนงวดที่ยังไม่ส่ง ณ งวดที่ประมวลผล
const DEP_DF_OBLIGATIONS = [
  { accNo: '101-56-58241-2', member: '58241', name: 'สมชาย ใจดี',        typeCode: '56', monthly: 2000, missed: 2 },
  { accNo: '101-56-60112-8', member: '60112', name: 'วิภาวดี รังสิต',     typeCode: '56', monthly: 3000, missed: 1 },
  { accNo: '101-56-57003-4', member: '57003', name: 'ธีรพงษ์ มากมี',      typeCode: '56', monthly: 1000, missed: 3 },
  { accNo: '101-56-62880-6', member: '62880', name: 'อรอุมา เพชรรัตน์',   typeCode: '56', monthly: 1500, missed: 0 },
  { accNo: '101-56-61580-9', member: '61580', name: 'ปาริชาติ สุขสวัสดิ์', typeCode: '56', monthly: 500,  missed: 4 },
  { accNo: '102-52-58241-5', member: '58241', name: 'สมชาย ใจดี',        typeCode: '52', monthly: 5000, missed: 1 },
];

function DepDefaultProcessPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));

  const today = window.DEP_OPS_TODAY || '2026-07-20';
  const now = new Date(today);
  const [year, setYear] = useState(now.getFullYear() + 543);
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [depType, setDepType] = useState('56');
  const [rows, setRows] = useState(null);
  const [sel, setSel] = useState([]);
  const [ask, setAsk] = useState(false);

  const process = () => {
    const found = DEP_DF_OBLIGATIONS
      .filter(o => o.typeCode === depType && o.missed > 0)
      .map((o, i) => ({ seq: i + 1, ...o, total: o.missed * o.monthly }));
    setRows(found); setSel(found.map(r => r.accNo));
    const totAmt = found.reduce((s, x) => s + x.total, 0);
    onToast && onToast(`ประมวลผลผิดนัดการฝาก ${DEP_DF_MONTHS[month]} ${year} — พบ ${found.length} บัญชี รวมยอดผิดนัด ${fmt.money(totAmt, 2)} บาท`);
    audit.log({ action: 'process', module: 'เงินฝาก — ประมวลผิดนัดการฝาก',
      target: `ประเภท ${depType} · ${DEP_DF_MONTHS[month]} ${year}`,
      summary: `ประมวลผลผิดนัด ${found.length} บัญชี รวมยอดค้างส่ง ${fmt.money(totAmt, 2)} บาท` });
  };

  const closePeriod = () => {
    setAsk(false);
    if (!rows) { onToast && onToast('กรุณาประมวลผลผิดนัดการฝากก่อนปิดบัญชี'); return; }
    onToast && onToast(`ปิดบัญชีงวด ${DEP_DF_MONTHS[month]} ${year} เรียบร้อย — บันทึกผลผิดนัด ${rows.length} บัญชีเข้าระบบ`);
    audit.log({ action: 'update', module: 'เงินฝาก — ประมวลผิดนัดการฝาก',
      target: `ปิดบัญชี ${DEP_DF_MONTHS[month]} ${year}`,
      summary: `ปิดงวดผิดนัดการฝาก ${rows.length} บัญชี` });
  };

  const totMissed = rows ? rows.reduce((s, x) => s + x.missed, 0) : 0;
  const totAmt = rows ? rows.reduce((s, x) => s + x.total, 0) : 0;
  const typeLabel = (DEP_DF_TYPES.find(t => t.code === depType) || {}).label || depType;

  return (
    <div data-screen-label="หน้าประมวลผิดนัดการฝาก">
      <div className="page-actions dep-open-sticky" ref={(el) => { if (!el || el.__stk) return; el.__stk = true; const sc = el.closest('.main') || window; const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null; el.style.top = ((bc ? bc.offsetHeight : 0) - 16) + 'px'; }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผิดนัดการฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ตรวจหาบัญชีเงินฝากรายเดือนที่ไม่ส่งเงินฝากตามกำหนด แล้วบันทึกจำนวนครั้งและยอดค้างส่งสะสมประจำงวด</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={!rows || sel.length === 0} onClick={() => setAsk(true)}>ปิดบัญชี{rows && sel.length ? ' (' + sel.length + ' บัญชี)' : ''}</button>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) auto', alignItems: 'end' }}>
          <DatFieldLite label="วันทำการสุดท้าย">
            <input className="cfg-input mono" value={(() => { const [y, m, d] = String(today).split('-'); return d + '/' + m + '/' + (Number(y) + 543); })()} readOnly disabled />
          </DatFieldLite>
          <DatFieldLite label="ปี (พ.ศ.)">
            <input className="cfg-input mono" type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value, 10) || year)} />
          </DatFieldLite>
          <DatFieldLite label="เดือน">
            <select className="cfg-input" value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
              {DEP_DF_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="ประเภทเงินฝาก">
            <select className="cfg-input" value={depType} onChange={(e) => { setDepType(e.target.value); setRows(null); }}>
              {DEP_DF_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </DatFieldLite>
          <button className="btn primary" style={{ height: 32 }} onClick={process}>ประมวลผลผิดนัดการฝาก</button>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          <Icon name="info" size={11} /> เกณฑ์: นับงวดที่บัญชี{typeLabel}ยังไม่ส่งเงินฝากตามยอดรายเดือนที่กำหนด · ยอดผิดนัด = จำนวนครั้ง × ยอดฝากรายเดือน
        </div>
      </div>

      {rows && (
        <>
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 12 }}>
            <IvStat label="บัญชีที่ผิดนัด" value={rows.length + ' บัญชี'} accent />
            <IvStat label="จำนวนครั้งผิดนัดรวม" value={totMissed + ' งวด'} tone="danger" />
            <IvStat label="รวมยอดผิดนัด" value={'฿ ' + fmt.money(totAmt, 2)} tone="danger" />
          </div>
          <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
            <div className="dat-section-head is-bar"><span className="head-bar" />
              <div className="dat-section-title">ผลผิดนัดการฝาก · {DEP_DF_MONTHS[month]} {year}</div></div>
            <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
              <table className="tbl" style={{ minWidth: 760 }}>
                <thead><tr>
                  <th className="center" style={{ width: 40 }}><input type="checkbox" className="ct-check" checked={rows.length > 0 && sel.length === rows.length} onChange={() => setSel(sel.length === rows.length ? [] : rows.map(r => r.accNo))} /></th>
                  <th className="center" style={{ width: 64 }}>ลำดับ</th>
                  <th className="mono">เลขบัญชี</th>
                  <th>ชื่อบัญชี</th>
                  <th className="center" style={{ width: 110 }}># ผิดนัด</th>
                  <th className="right" style={{ width: 160 }}>รวมยอดผิดนัด</th>
                </tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan="6" className="center muted" style={{ padding: 24 }}>ไม่พบบัญชีผิดนัดในงวดนี้</td></tr>}
                  {rows.map(r => (
                    <tr key={r.accNo}>
                    <td className="center"><input type="checkbox" className="ct-check" checked={sel.includes(r.accNo)} onChange={() => setSel(s => s.includes(r.accNo) ? s.filter(x => x !== r.accNo) : [...s, r.accNo])} /></td>
                      <td className="center mono">{r.seq}</td>
                      <td className="mono">{r.accNo}</td>
                      <td><div className="lt-row-name">{r.name}</div><div className="lt-row-note muted mono">{r.member}</div></td>
                      <td className="center"><span className="pill bad">{r.missed} งวด</span></td>
                      <td className="right mono"><b>{fmt.money(r.total, 2)}</b></td>
                    </tr>
                  ))}
                </tbody>
                {rows.length > 0 && <tfoot><tr>
                  <td colSpan="4" className="right">รวมทั้งสิ้น</td>
                  <td className="center mono">{totMissed} งวด</td>
                  <td className="right mono"><b>{fmt.money(totAmt, 2)}</b></td>
                </tr></tfoot>}
              </table>
            </div>
          </div>
          {ask && window.DepConfirmModal && <window.DepConfirmModal title="ยืนยันปิดบัญชี"
            lines={[['งวด', DEP_DF_MONTHS[month] + ' ' + year], ['บันทึกผลผิดนัด', sel.length + ' บัญชี'],
              ['ยอดผิดนัดรวม', fmt.money(rows.filter(r => sel.includes(r.accNo)).reduce((s, r) => s + (r.amount || r.total || 0), 0), 2) + ' บาท']]}
            okLabel="ยืนยันปิดบัญชี" onOk={closePeriod} onClose={() => setAsk(false)} />}
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepDefaultProcessPage });
