// ═════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำเดือน — ประมวลผลเปิดบัญชีเงินฝาก
//  ดึงรายชื่อสมาชิกที่ขอเปิดบัญชีผ่านการเรียกเก็บรายเดือน ตามงวดเรียกเก็บ
//  → ตรวจยอดที่หักเก็บได้ → ประมวลผลเปิดบัญชีเฉพาะรายที่หักเก็บได้ครบ
// ═════════════════════════════════════════════════════════════════

const DPO_PAGE_SIZE = 10;
const dpoTh = (iso) => { const a = String(iso || '').split('-'); return a.length === 3 ? a[2] + '/' + a[1] + '/' + (Number(a[0]) + 543) : ''; };
const dpoIso = (s) => { const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? (Number(m[3]) - 543) + '-' + m[2] + '-' + m[1] : ''; };
const DPO_TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

// งวดเรียกเก็บย้อนหลัง 12 งวด (พ.ศ. + เดือน เช่น 256907)
function dpoPeriods() {
  const today = String(window.DEP_OPS_TODAY || new Date().toISOString().slice(0, 10));
  let y = Number(today.slice(0, 4)) + 543, m = Number(today.slice(5, 7));
  const out = [];
  for (let i = 0; i < 12; i++) {
    out.push({ v: String(y) + String(m).padStart(2, '0'), l: String(y) + String(m).padStart(2, '0') + ' · ' + DPO_TH_MONTHS[m - 1] + ' ' + y });
    m -= 1; if (m === 0) { m = 12; y -= 1; }
  }
  return out;
}

const DPO_PERIODS = dpoPeriods();

// ข้อมูลตัวอย่าง — คำขอเปิดบัญชีที่ส่งเรียกเก็บในงวด
const DPO_SEED = [
  { member: '001024', name: 'นายประสิทธิ์ คงทอง',      dept: 'ฝ่ายบริหารเครือข่าย',   open: 1000,  collected: 1000 },
  { member: '001187', name: 'นายสมชาย ใจดี รักษ์ออม',  dept: 'ฝ่ายการเงิน',          open: 2000,  collected: 2000 },
  { member: '001352', name: 'นางสาวสุนีย์ วงศ์สกุล',    dept: 'ภาค 1 (กรุงเทพฯ)',      open: 500,   collected: 500 },
  { member: '001498', name: 'นายวิชัย เรืองศรี',        dept: 'ภาค 2 (ภาคกลาง)',      open: 1500,  collected: 0 },
  { member: '001566', name: 'นางอารีย์ สุขสม',          dept: 'สำนักงานใหญ่',         open: 1000,  collected: 1000 },
  { member: '001603', name: 'นายประเสริฐ มั่นคง',       dept: 'ภาค 3 (ภาคเหนือ)',      open: 3000,  collected: 3000 },
  { member: '001715', name: 'นางสาวกมลวรรณ ศรีสุข',    dept: 'ฝ่ายทรัพยากรบุคคล',     open: 500,   collected: 500 },
  { member: '001822', name: 'นายธนากร พูลผล',          dept: 'ฝ่ายเทคโนโลยีสารสนเทศ', open: 2000,  collected: 0 },
  { member: '001907', name: 'นางจันทร์เพ็ญ มาลี',       dept: 'สำนักงานใหญ่',         open: 1000,  collected: 1000 },
  { member: '002011', name: 'นายอนุชา แก้วประเสริฐ',    dept: 'ภาค 4 (ภาคอีสาน)',     open: 1500,  collected: 1500 },
  { member: '002134', name: 'นางสาวพิมพ์ชนก ทองดี',    dept: 'ฝ่ายบัญชี',            open: 1000,  collected: 1000 },
  { member: '002256', name: 'นายสุรชัย ศักดิ์สิทธิ์',     dept: 'ภาค 5 (ภาคใต้)',        open: 2500,  collected: 2500 },
];

function DepProcOpenPage(props) {
  if (window.__DPO_BISECT) return <div data-screen-label="ประมวลผลเปิดบัญชีเงินฝาก">ok</div>;
  return <DepProcOpenPageInner {...props} />;
}
function DepProcOpenPageInner({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const periods = DPO_PERIODS;
  const [period, setPeriod] = useState(periods[0].v);
  const [procDate, setProcDate] = useState(String(window.DEP_OPS_TODAY || new Date().toISOString().slice(0, 10)));
  const [rows, setRows] = useState(null);     // null = ยังไม่ดึง
  const [posted, setPosted] = useState(false);
  const [page, setPage] = useState(1);

  const resetResult = () => { setRows(null); setPosted(false); setPage(1); };

  const pull = () => {
    const r = DPO_SEED.map((x, i) => ({ ...x, _line: i + 1 }));
    setRows(r); setPosted(false); setPage(1);
    onToast && onToast('ดึงข้อมูลงวด ' + period + ' ได้ ' + r.length + ' ราย');
  };

  const all = rows || [];
  const ok = all.filter(r => r.collected >= r.open && r.open > 0);
  const fail = all.filter(r => !(r.collected >= r.open && r.open > 0));
  const sumOpen = all.reduce((s, r) => s + r.open, 0);
  const sumColl = all.reduce((s, r) => s + r.collected, 0);
  const pageCount = Math.max(1, Math.ceil(all.length / DPO_PAGE_SIZE));
  const view = all.slice((page - 1) * DPO_PAGE_SIZE, page * DPO_PAGE_SIZE);

  const [askProc, setAskProc] = useState(false);
  const process = () => {
    setAskProc(false);
    audit.log({
      action: 'create', module: 'เงินฝาก — ประมวลผลเปิดบัญชีเงินฝาก', target: 'งวด ' + period,
      summary: 'ประมวลผลเปิดบัญชี ' + ok.length + ' ราย รวม ' + fmt.money(ok.reduce((s, r) => s + r.collected, 0), 2) + ' บาท',
      changes: [
        { field: 'วันที่ประมวลผล', before: '—', after: fmt.date(procDate) },
        { field: 'เปิดบัญชีสำเร็จ', before: '—', after: ok.length + ' ราย' },
        { field: 'หักเก็บไม่ได้', before: '—', after: fail.length + ' ราย' },
      ],
    });
    setPosted(true);
    onToast && onToast('ประมวลผลเปิดบัญชี ' + ok.length + ' ราย เรียบร้อย');
  };

  return (
    <div data-screen-label="ประมวลผลเปิดบัญชีเงินฝาก">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลเปิดบัญชีเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เปิดบัญชีให้สมาชิกที่ขอเปิดผ่านการเรียกเก็บเงินรายเดือน ตามยอดที่หักเก็บได้ในงวด</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={!rows || posted || ok.length === 0} onClick={() => setAskProc(true)}>
          <Icon name="check" /> {posted ? 'ประมวลผลแล้ว' : 'ประมวลผล' + (rows && ok.length ? ' (' + ok.length + ' ราย)' : '')}
        </button>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto', gap: 12, alignItems: 'end' }}>
          <DatFieldLite label="งวดเรียกเก็บ" required>
            <select className="cfg-input" value={period} onChange={(e) => { setPeriod(e.target.value); resetResult(); }}>
              {periods.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="วันที่ประมวลผล" required>
            <input className="cfg-input mono" value={dpoTh(procDate)} placeholder="วว/ดด/ปปปป"
                   onChange={(e) => { const iso = dpoIso(e.target.value); setProcDate(iso || procDate); setPosted(false); }} />
          </DatFieldLite>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
          </div>
        </div>
      </div>

      {rows && (
        <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
          <IvStat label="รายชื่อในงวด" value={all.length + ' ราย'} sub={'ยอดเปิดบัญชี ฿ ' + fmt.money(sumOpen, 2)} accent />
          <IvStat label="หักเก็บได้" value={ok.length + ' ราย'} sub={'฿ ' + fmt.money(sumColl, 2)} tone="success" />
          <IvStat label="หักเก็บไม่ได้" value={fail.length + ' ราย'} tone={fail.length ? 'danger' : undefined} />
          <IvStat label="สถานะ" value={posted ? 'เปิดบัญชีแล้ว' : 'รอประมวลผล'} tone={posted ? 'success' : 'warning'} />
        </div>
      )}

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <DepSecHead bar icon="members" title="รายการประมวลผลเปิดบัญชี"
          meta={rows ? all.length + ' ราย · ยอดเปิดบัญชีรวม ' + fmt.money(sumOpen, 2) + ' บาท' : null} />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead><tr>
              <th className="center" style={{ width: 64 }}>ลำดับ</th>
              <th style={{ width: 120 }}>เลขสมาชิก</th>
              <th>ชื่อ นามสกุล</th>
              <th>สังกัด</th>
              <th className="num" style={{ width: 150 }}>ยอดเปิดบัญชี</th>
              <th className="num" style={{ width: 150 }}>หักเก็บได้</th>
              {posted && <th className="center" style={{ width: 120 }}>ผลประมวลผล</th>}
            </tr></thead>
            <tbody>
              {!rows ? (
                <tr><td colSpan={posted ? 7 : 6} className="empty-state">เลือกงวดเรียกเก็บแล้วกด “ดึงข้อมูล”</td></tr>
              ) : view.map(r => {
                const good = r.collected >= r.open && r.open > 0;
                return (
                  <tr key={r._line}>
                    <td className="center muted">{r._line}</td>
                    <td className="mono">{r.member}</td>
                    <td>{r.name}</td>
                    <td className="muted">{r.dept}</td>
                    <td className="num mono">{fmt.money(r.open, 2)}</td>
                    <td className="num mono" style={good ? undefined : { color: 'var(--danger, #cf1322)', fontWeight: 600 }}>{fmt.money(r.collected, 2)}</td>
                    {posted && <td className="center">{good ? <span className="pill ok">เปิดบัญชีแล้ว</span> : <span className="pill bad">ไม่ได้เปิด</span>}</td>}
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr>
              <td colSpan={4}><b>รวม {all.length} ราย</b></td>
              <td className="num mono"><b>{fmt.money(sumOpen, 2)}</b></td>
              <td className="num mono"><b style={{ color: 'var(--brand, #237450)' }}>{fmt.money(sumColl, 2)}</b></td>
              {posted && <td />}
            </tr></tfoot>
          </table>
        </div></div>
        {rows && pageCount > 1 && (
          <div className="pagination" style={{ padding: '0 16px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>แสดง {(page - 1) * DPO_PAGE_SIZE + 1}–{Math.min(page * DPO_PAGE_SIZE, all.length)} จาก {all.length} ราย</span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>ก่อนหน้า</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
              <button key={n} className={'btn sm' + (n === page ? ' primary' : '')} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="btn sm" disabled={page === pageCount} onClick={() => setPage(p => p + 1)}>ถัดไป</button>
          </div>
        )}
      </div>

      {rows && fail.length > 0 && !posted && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="info" size={14} />
          <span>มี {fail.length} รายที่<b>หักเก็บเงินไม่ได้</b> — ระบบจะไม่เปิดบัญชีให้รายเหล่านี้ และจะยกไปเรียกเก็บในงวดถัดไป</span>
        </div>
      )}
      {posted && (
        <div className="dat-ok" style={{ marginTop: 12 }}>
          <Icon name="check" size={14} />
          <span>ประมวลผลเรียบร้อย — เปิดบัญชี {ok.length} ราย รวม {fmt.money(ok.reduce((s, r) => s + r.collected, 0), 2)} บาท · บันทึกใน Audit Log แล้ว</span>
        </div>
      )}
      {askProc && window.DepConfirmModal && (
        <window.DepConfirmModal title="ยืนยันประมวลผลเปิดบัญชีเงินฝาก"
          lines={[['งวด', period], ['เปิดบัญชี (หักเก็บได้)', ok.length + ' ราย'], ...(fail.length ? [['ข้าม (หักเก็บไม่ได้)', fail.length + ' ราย']] : []), ['ยอดรวม', fmt.money(ok.reduce((s, r) => s + r.collected, 0), 2) + ' บาท']]}
          okLabel="ยืนยันประมวลผล" onOk={process} onClose={() => setAskProc(false)} />
      )}
    </div>
  );
}

Object.assign(window, { DepProcOpenPage });
