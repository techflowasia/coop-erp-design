// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ประมวลผลตัดยอดเงินฝาก (DepCutoffProcessPage)
//  ดึงยอดเงินฝากคงเหลือรายบัญชีของหน่วยงาน/งวดที่เลือก มาปรับปรุงและ
//  โอนยอดออก (ตัดยอด) แล้วผ่านรายการ + บันทึกเข้าระบบบัญชี
// ════════════════════════════════════════════════════════════════════

const DEP_CO_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// หน่วยงานต้นสังกัด (สำหรับตัดยอดโอนเข้าบัญชีหน่วยงาน)
const DEP_CO_ORGS = [
  { code: '3', label: '3 — กสท' },
  { code: '1', label: '1 — สำนักงานใหญ่' },
  { code: '2', label: '2 — ทีโอที' },
  { code: '4', label: '4 — ไปรษณีย์ไทย' },
];

// ยอดเงินฝากคงเหลือรายบัญชี (จำลอง) — ดึงตามหน่วยงาน/งวด
// closed = วันที่ปิดบัญชี (ถ้ามี → ยอดโอนออกเต็มจำนวน)
const DEP_CO_ACCOUNTS = [
  { reg: '039450', accNo: '0100106077', name: 'นายศุภชัย  วิมโลภาส',    amount: 10000, adjust: 0 },
  { reg: '050981', accNo: '0100106458', name: 'นายวุฒิชัย  แซ่โง้ว',      amount: 200,   adjust: 0 },
  { reg: '052520', accNo: '0100106683', name: 'น.ส.สุชาดา  เผือกม่วง',   amount: 2000,  adjust: 0 },
  { reg: '052802', accNo: '0100107053', name: 'น.ส.ศลิษา  หงษ์สี',       amount: 500,   adjust: 0 },
  { reg: '052944', accNo: '0100107289', name: 'นายเอกดนัย  เจะเมาะ',      amount: 500,   adjust: 0 },
  { reg: '052950', accNo: '0100107295', name: 'นายเกษมสุข  ช่วยป่า',      amount: 500,   adjust: 0 },
  { reg: '052957', accNo: '0100107302', name: 'นายชัชวาลย์  สท้านไพร',    amount: 600,   adjust: 0 },
  { reg: '052964', accNo: '0100107309', name: 'นายสมเกียรติ  ชูสุข',      amount: 500,   adjust: 0 },
  { reg: '052965', accNo: '0100107310', name: 'นายชัยวิชิต  ดชนุต',       amount: 500,   adjust: 0 },
  { reg: '039658', accNo: '0100108068', name: 'นางภรณี  ยาวิชัย (โคตร)',  amount: 1000,  adjust: 0 },
  { reg: '027988', accNo: '0100108069', name: 'น.ส.อัญญรัตน์  สุขหร่าย',  amount: 1000,  adjust: 0 },
  { reg: '053612', accNo: '0100108571', name: 'น.ส.เสาวลักษณ์  พลอย',     amount: 500,   adjust: 0 },
  { reg: '050929', accNo: '0100108787', name: 'น.ส.ทิพสุคนธ์  สว่างดี',   amount: 500,   adjust: 0 },
  { reg: '052231', accNo: '0100109046', name: 'นายธีระพงศ์  ชาติชาญ',     amount: 500,   adjust: 0 },
  { reg: '054048', accNo: '0100109231', name: 'นายโชติวัฒน์  ศรีมิตร',    amount: 1500,  adjust: 0 },
  { reg: '054123', accNo: '0100109318', name: 'นายพชร  สาลีพันธ์',        amount: 300,   adjust: 0 },
  { reg: '054185', accNo: '0100109394', name: 'นายอดิศร  น้อยนารายณ์',    amount: 500,   adjust: 0 },
  { reg: '054187', accNo: '0100109396', name: 'นายพงษ์พัฒน์  ชอบชม',      amount: 100,   adjust: 0 },
  { reg: '054191', accNo: '0100109400', name: 'นายธนสรรค์  แก่นเพชร',     amount: 500,   adjust: 0 },
  { reg: '034296', accNo: '0100109527', name: 'นางวีระยา  ปารุง',         amount: 700,   adjust: 0 },
  { reg: '054298', accNo: '0100109549', name: 'นายปติ  เหลืองอร่าม',      amount: 500,   adjust: 0 },
  { reg: '054909', accNo: '0100110211', name: 'นายรองศิริ  ผู้ศรัทธาธรรม', amount: 500,  adjust: 0 },
  { reg: '054981', accNo: '0100110293', name: 'นายนาวิน  อุ้มเพชร',       amount: 500,   adjust: 0 },
  { reg: '044287', accNo: '0100110951', name: 'น.ส.ดวงพร  โพธิ์ทอง',      amount: 5000,  adjust: 0, closed: '2026-07-15' },
  { reg: '033941', accNo: '0100112940', name: 'ว่าที่ ร.ต.ณ.สดารัตน์ ศ.', amount: 1000,  adjust: 0 },
];

function DepCutoffProcessPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));

  const today = window.DEP_OPS_TODAY || '2026-07-20';
  const now = new Date(today);
  const [year, setYear] = useState(now.getFullYear() + 543);
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based (07)
  const [org, setOrg] = useState('3');
  const [txnDate, setTxnDate] = useState(today);
  const [rows, setRows] = useState(null);
  const [posted, setPosted] = useState(false);
  const [sel, setSel] = useState([]);
  const [ask, setAsk] = useState(false);

  const orgLabel = (DEP_CO_ORGS.find(o => o.code === org) || {}).label || org;

  const pull = () => {
    const found = DEP_CO_ACCOUNTS.map((a, i) => ({
      seq: i + 1, ...a,
      transfer: a.amount + a.adjust, // ยอดโอน = จำนวนเงิน + ยอดปรับปรุง
    }));
    setRows(found); setSel(found.map(r => r.accNo));
    setPosted(false);
    const tot = found.reduce((s, x) => s + x.transfer, 0);
    onToast && onToast(`ดึงข้อมูลยอดเงินฝาก ${orgLabel} งวด ${DEP_CO_MONTHS[month - 1]} ${year} — ${found.length} ราย รวม ${fmt.money(tot, 2)} บาท`);
    audit.log({ action: 'process', module: 'เงินฝาก — ประมวลผลตัดยอดเงินฝาก',
      target: `${orgLabel} · ${DEP_CO_MONTHS[month - 1]} ${year}`,
      summary: `ดึงข้อมูลยอดตัด ${found.length} บัญชี รวม ${fmt.money(tot, 2)} บาท` });
  };

  const postTxn = () => {
    setAsk(false);
    if (!rows) { onToast && onToast('กรุณาดึงข้อมูลก่อนผ่านรายการ'); return; }
    setPosted(true);
    onToast && onToast(`ผ่านรายการตัดยอดเงินฝาก ${rows.length} รายการเรียบร้อย — พร้อมบันทึกลงบัญชี`);
    audit.log({ action: 'update', module: 'เงินฝาก — ประมวลผลตัดยอดเงินฝาก',
      target: `ผ่านรายการ ${DEP_CO_MONTHS[month - 1]} ${year}`,
      summary: `ผ่านรายการตัดยอด ${rows.length} บัญชี` });
  };

  const saveTxn = () => {
    if (!rows) { onToast && onToast('กรุณาดึงข้อมูลก่อนบันทึกรายการ'); return; }
    if (!posted) { onToast && onToast('กรุณาผ่านรายการก่อนบันทึก'); return; }
    const tot = rows.reduce((s, x) => s + x.transfer, 0);
    onToast && onToast(`บันทึกรายการตัดยอดเงินฝาก ${rows.length} รายการ รวม ${fmt.money(tot, 2)} บาท เข้าระบบบัญชีเรียบร้อย`);
    audit.log({ action: 'create', module: 'เงินฝาก — ประมวลผลตัดยอดเงินฝาก',
      target: `บันทึกรายการ ${DEP_CO_MONTHS[month - 1]} ${year}`,
      summary: `บันทึกตัดยอดเงินฝาก ${rows.length} บัญชี รวม ${fmt.money(tot, 2)} บาท ลงวันที่ ${fmt.date(txnDate)}` });
  };

  const totAmount = rows ? rows.reduce((s, x) => s + x.amount, 0) : 0;
  const totAdjust = rows ? rows.reduce((s, x) => s + x.adjust, 0) : 0;
  const totTransfer = rows ? rows.reduce((s, x) => s + x.transfer, 0) : 0;

  return (
    <div data-screen-label="หน้าประมวลผลตัดยอดเงินฝาก">
      <div className="page-actions dep-open-sticky" ref={(el) => { if (!el || el.__stk) return; el.__stk = true; const sc = el.closest('.main') || window; const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null; el.style.top = ((bc ? bc.offsetHeight : 0) - 16) + 'px'; }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลตัดยอดเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>พิมพ์รายงานการปรับยอด · ดึงยอดเงินฝากคงเหลือรายบัญชีของหน่วยงานตามงวด แล้วปรับปรุง–โอนยอด (ตัดยอด) เพื่อผ่านและบันทึกลงระบบบัญชี</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={!rows || posted || sel.length === 0} onClick={() => setAsk(true)}>{posted ? 'ผ่านรายการแล้ว' : 'ผ่านรายการ' + (rows && sel.length ? ' (' + sel.length + ' ราย)' : '')}</button>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls dep-co-controls" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) auto', alignItems: 'end' }}>
          <DatFieldLite label="ปี (พ.ศ.)">
            <input className="cfg-input mono" type="number" value={year} onChange={(e) => { setYear(parseInt(e.target.value, 10) || year); setRows(null); }} />
          </DatFieldLite>
          <DatFieldLite label="เดือน">
            <select className="cfg-input" value={month} onChange={(e) => { setMonth(parseInt(e.target.value, 10)); setRows(null); }}>
              {DEP_CO_MONTHS.map((m, i) => <option key={m} value={i + 1}>{String(i + 1).padStart(2, '0')} — {m}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="หน่วยงาน">
            <select className="cfg-input" value={org} onChange={(e) => { setOrg(e.target.value); setRows(null); }}>
              {DEP_CO_ORGS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="รายการลงวันที่">
            <window.ThaiDateField value={txnDate} onChange={(v) => setTxnDate(v)} />
          </DatFieldLite>
          <button className="btn primary" style={{ height: 32 }} onClick={pull}>ดึงข้อมูล</button>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          <Icon name="info" size={11} /> ยอดโอน = จำนวนเงินคงเหลือ + ยอดปรับปรุง · บัญชีที่มีวันที่ปิดบัญชีจะถูกตัดโอนออกเต็มจำนวน · ผ่านรายการก่อนจึงจะบันทึกลงบัญชีได้
        </div>
      </div>

      {rows && (
        <>
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
            <IvStat label="จำนวนราย" value={rows.length + ' ราย'} accent />
            <IvStat label="รวมจำนวนเงิน" value={'฿ ' + fmt.money(totAmount, 2)} />
            <IvStat label="รวมยอดปรับปรุง" value={'฿ ' + fmt.money(totAdjust, 2)} />
            <IvStat label="รวมยอดโอน" value={'฿ ' + fmt.money(totTransfer, 2)} tone="ok" />
          </div>
          <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
            <div className="dat-section-head is-bar"><span className="head-bar" />
              <div className="dat-section-title">รายงานการปรับยอด · {orgLabel} · {DEP_CO_MONTHS[month - 1]} {year}</div>
              {posted && <span className="pill ok" style={{ marginLeft: 'auto' }}>ผ่านรายการแล้ว</span>}
            </div>
            <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
              <table className="tbl" style={{ minWidth: 960 }}>
                <thead><tr>
                  <th className="center" style={{ width: 40 }}><input type="checkbox" className="ct-check" disabled={posted} checked={rows.length > 0 && sel.length === rows.length} onChange={() => setSel(sel.length === rows.length ? [] : rows.map(r => r.accNo))} /></th>
                  <th className="center" style={{ width: 54 }}>ลำดับ</th>
                  <th className="mono" style={{ width: 92 }}>ทะเบียน</th>
                  <th className="mono" style={{ width: 128 }}>เลขที่บัญชี</th>
                  <th>ชื่อบัญชี</th>
                  <th className="right" style={{ width: 120 }}>จำนวนเงิน</th>
                  <th className="right" style={{ width: 120 }}>ยอดปรับปรุง</th>
                  <th className="right" style={{ width: 120 }}>ยอดโอน</th>
                  <th className="center" style={{ width: 116 }}>วันที่ปิดบัญชี</th>
                </tr></thead>
                <tbody>
                  <tr className="dep-co-sumrow">
                    <td colSpan="5"><b>จำนวนราย {rows.length} ราย</b></td>
                    <td className="right mono"><b>{fmt.money(totAmount, 2)}</b></td>
                    <td className="right mono"><b>{fmt.money(totAdjust, 2)}</b></td>
                    <td className="right mono"><b>{fmt.money(totTransfer, 2)}</b></td>
                    <td></td>
                  </tr>
                  {rows.map(r => (
                    <tr key={r.accNo}>
                    <td className="center"><input type="checkbox" className="ct-check" disabled={posted} checked={sel.includes(r.accNo)} onChange={() => setSel(s => s.includes(r.accNo) ? s.filter(x => x !== r.accNo) : [...s, r.accNo])} /></td>
                      <td className="center mono">{r.seq}</td>
                      <td className="mono">{r.reg}</td>
                      <td className="mono">{r.accNo}</td>
                      <td>{r.name}</td>
                      <td className="right mono">{fmt.money(r.amount, 2)}</td>
                      <td className="right mono">{fmt.money(r.adjust, 2)}</td>
                      <td className="right mono">{fmt.money(r.transfer, 2)}</td>
                      <td className="center mono">{r.closed ? fmt.date(r.closed) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan="5" className="right">รวมทั้งสิ้น</td>
                  <td className="right mono"><b>{fmt.money(totAmount, 2)}</b></td>
                  <td className="right mono"><b>{fmt.money(totAdjust, 2)}</b></td>
                  <td className="right mono"><b>{fmt.money(totTransfer, 2)}</b></td>
                  <td></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
          {ask && window.DepConfirmModal && <window.DepConfirmModal title="ยืนยันผ่านรายการตัดยอดเงินฝาก"
            lines={[['งวด', DEP_CO_MONTHS[month - 1] + ' ' + year], ['หน่วยงาน', orgLabel], ['ผ่านรายการ', sel.length + ' ราย'],
              ['ยอดโอนรวม', fmt.money(rows.filter(r => sel.includes(r.accNo)).reduce((s, r) => s + (r.transfer || 0), 0), 2) + ' บาท']]}
            okLabel="ยืนยันผ่านรายการ" onOk={() => { postTxn(); setTimeout(saveTxn, 0); }} onClose={() => setAsk(false)} />}
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepCutoffProcessPage });
