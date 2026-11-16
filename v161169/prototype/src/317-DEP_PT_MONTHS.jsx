// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ประมวลผลตัดหุ้นพูนทวี (DepPoontaweeProcessPage)
//  ดึงบัญชีเงินฝาก "หุ้นพูนทวี" ตามงวด แล้วตัดยอดเรียกเก็บ (หุ้น/หนี้) จาก
//  ยอดคงเหลือในบัญชี → ผ่านรายการเพื่อบันทึกลงระบบ
//  * ต้องตรวจสอบยอดขั้นต่ำในการถอนเงินจากบัญชีก่อนตัด
// ════════════════════════════════════════════════════════════════════

const DEP_PT_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// รูปแบบการหัก
const DEP_PT_DEDUCT = 'หุ้น+หนี้';

// บัญชีหุ้นพูนทวี (จำลอง) — ดึงตามงวด
//  balance = ยอดคงเหลือในบัญชี · collect = ยอดเรียกเก็บ · closed = วันที่ปิดบัญชี (ถ้ามี)
const DEP_PT_ACCOUNTS = [
  { reg: '033831', accNo: '0110412264', name: 'น.ส.ประภาศรี  กาญจนารมย์ (ค/ก 56)', balance: 0,          collect: 0,       deduct: DEP_PT_DEDUCT, closed: '2026-07-07' },
  { reg: '019660', accNo: '0100100925', name: 'นายอดุลย์  ทับมาโนช',               balance: 116814.43,  collect: 1000,    deduct: DEP_PT_DEDUCT },
  { reg: '036571', accNo: '0100105046', name: 'นางราณี  นามวงศ์ (หุ้นพูนทวี)',      balance: 275691.77,  collect: 1000,    deduct: DEP_PT_DEDUCT },
  { reg: '035815', accNo: '0100105324', name: 'นายกิตติพัฒน์  ประดาศักดิ์ (หุ้นพูนทวี)', balance: 61964.17, collect: 5000, deduct: DEP_PT_DEDUCT },
  { reg: '038724', accNo: '0100105642', name: 'นายเตชภณ  นิติเสาวภาคย์ (ลาออกงาน)', balance: 5243.67,    collect: 400,     deduct: DEP_PT_DEDUCT },
  { reg: '040638', accNo: '0100105707', name: 'น.ส.สุมารีย์  หุ้นพูนทวี จันทร์เศรษฐี', balance: 55125.51, collect: 1000,   deduct: DEP_PT_DEDUCT },
  { reg: '048726', accNo: '0100105942', name: 'น.ส.อลิสา  ศิลพงษ์ หุ้นพูนทวี',       balance: 8516.98,    collect: 1000,    deduct: DEP_PT_DEDUCT },
  { reg: '039444', accNo: '0100106021', name: 'นายพิเชษฐ์  ลายคราม',                balance: 58886.69,   collect: 900,     deduct: DEP_PT_DEDUCT },
  { reg: '047462', accNo: '0100106296', name: 'น.ส.ณัชชา  พิมพวาทิน (หุ้นพูนทวี)',   balance: 5129.70,    collect: 5000,    deduct: DEP_PT_DEDUCT },
  { reg: '052940', accNo: '0100107256', name: 'นายอภิศักดิ์  จันทา (หุ้นพูนทวี)',    balance: 534.14,     collect: 500,     deduct: DEP_PT_DEDUCT },
  { reg: '035154', accNo: '0100107264', name: 'น.ส.สมบูรณ์  โตยะบุตร (หุ้นพูนทวี)',  balance: 5981.06,    collect: 1000,    deduct: DEP_PT_DEDUCT },
  { reg: '053482', accNo: '0100108320', name: 'น.ส.กัญญวัฒน์  โชติพุทธิกุล (หุ้นพูนทวี)', balance: 13060.08, collect: 1000, deduct: DEP_PT_DEDUCT },
  { reg: '040401', accNo: '0100108392', name: 'น.ส.ศรีสุดา  เนตรนาค (หุ้นพูนทวี)',   balance: 1072.08,    collect: 500,     deduct: DEP_PT_DEDUCT },
  { reg: '026912', accNo: '0100109501', name: 'นายพิเชฐ  ตันติวรถาวร (หุ้นพูนทวี)',   balance: 75265.84,   collect: 600,     deduct: DEP_PT_DEDUCT },
  { reg: '041414', accNo: '0110408634', name: 'นางพจนีย์  เมฆประยูรทอง (หุ้นพูนทวี)', balance: 27051.44,   collect: 1000,    deduct: DEP_PT_DEDUCT },
];

function DepPoontaweeProcessPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));

  const today = window.DEP_OPS_TODAY || '2026-07-21';
  const now = new Date(today);
  const [year, setYear] = useState(now.getFullYear() + 543);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [procDate, setProcDate] = useState(today);
  const [rows, setRows] = useState(null);
  const [posted, setPosted] = useState(false);
  const [sel, setSel] = useState([]);
  const [askPost, setAskPost] = useState(false);

  // ยอดตัดจริง = min(ยอดเรียกเก็บ, ยอดคงเหลือ) · บัญชีปิดแล้วตัด 0
  const buildRows = () => DEP_PT_ACCOUNTS.map((a, i) => {
    const deducted = a.closed ? 0 : Math.min(a.collect, a.balance);
    const shortfall = a.closed ? 0 : Math.max(a.collect - a.balance, 0);
    return { seq: i + 1, ...a, deducted, shortfall };
  });

  const pull = () => {
    const found = buildRows();
    setRows(found); setPosted(false); setSel(found.filter(r => !r.closed && r.deducted > 0).map(r => r.accNo));
    const tot = found.reduce((s, x) => s + x.deducted, 0);
    onToast && onToast(`ดึงข้อมูลหุ้นพูนทวี งวด ${DEP_PT_MONTHS[month - 1]} ${year} — ${found.length} ราย รวมตัด ${fmt.money(tot, 2)} บาท`);
    audit.log({ action: 'process', module: 'เงินฝาก — ประมวลผลตัดหุ้นพูนทวี',
      target: `${DEP_PT_MONTHS[month - 1]} ${year}`,
      summary: `ดึงข้อมูลตัดหุ้นพูนทวี ${found.length} บัญชี รวม ${fmt.money(tot, 2)} บาท` });
  };

  const postTxn = () => {
    setAskPost(false);
    const picked = rows.filter(r => sel.includes(r.accNo));
    setPosted(true);
    const tot = picked.reduce((s, x) => s + x.deducted, 0);
    onToast && onToast(`ผ่านรายการตัดหุ้นพูนทวี ${picked.length} บัญชี รวม ${fmt.money(tot, 2)} บาท เรียบร้อย`);
    audit.log({ action: 'update', module: 'เงินฝาก — ประมวลผลตัดหุ้นพูนทวี',
      target: `ผ่านรายการ ${DEP_PT_MONTHS[month - 1]} ${year}`,
      summary: `ผ่านรายการตัดหุ้นพูนทวี ${picked.length} บัญชี รวม ${fmt.money(tot, 2)} บาท · ข้าม ${rows.length - picked.length} บัญชี` });
  };
  const canPick = (r) => !r.closed && r.deducted > 0 && !posted;
  const toggle = (acc) => setSel(s => s.includes(acc) ? s.filter(x => x !== acc) : [...s, acc]);
  const pickable = rows ? rows.filter(canPick) : [];
  const allOn = pickable.length > 0 && pickable.every(r => sel.includes(r.accNo));
  const selTot = rows ? rows.filter(r => sel.includes(r.accNo)).reduce((s, x) => s + x.deducted, 0) : 0;

  const okRows = rows ? rows.filter(r => !r.closed && r.deducted > 0) : [];
  const shortRows = rows ? rows.filter(r => r.shortfall > 0) : [];
  const closedRows = rows ? rows.filter(r => r.closed) : [];
  const totBalance = rows ? rows.reduce((s, x) => s + x.balance, 0) : 0;
  const totCollect = rows ? rows.reduce((s, x) => s + x.collect, 0) : 0;
  const totDeducted = rows ? rows.reduce((s, x) => s + x.deducted, 0) : 0;

  return (
    <div data-screen-label="หน้าประมวลผลตัดหุ้นพูนทวี">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลตัดหุ้นพูนทวี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ดึงบัญชีเงินฝากหุ้นพูนทวีตามงวด แล้วตัดยอดเรียกเก็บ (หุ้น/หนี้) จากยอดคงเหลือในบัญชี เพื่อผ่านรายการและบันทึกลงระบบ</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={!rows || posted || sel.length === 0} onClick={() => setAskPost(true)}>
          {posted ? 'ผ่านรายการแล้ว' : 'ผ่านรายการ' + (rows && sel.length ? ' (' + sel.length + ' ราย)' : '')}
        </button>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr)) auto' }}>
          <DatFieldLite label="ปี (พ.ศ.)">
            <input className="cfg-input mono" type="number" value={year} onChange={(e) => { setYear(parseInt(e.target.value, 10) || year); setRows(null); }} />
          </DatFieldLite>
          <DatFieldLite label="เดือน">
            <select className="cfg-input" value={month} onChange={(e) => { setMonth(parseInt(e.target.value, 10)); setRows(null); }}>
              {DEP_PT_MONTHS.map((m, i) => <option key={m} value={i + 1}>{String(i + 1).padStart(2, '0')} — {m}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="วันที่ประมวลผล">
            <window.ThaiDateField value={procDate} onChange={(v) => setProcDate(v)} />
          </DatFieldLite>
          <button className="btn primary" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
        </div>
        <div className="sr-error" style={{ marginTop: 10, fontWeight: 600 }}>
          <Icon name="info" size={14} /> กรุณาตรวจสอบยอดขั้นต่ำในการถอนเงินจากบัญชีก่อนตัดหุ้นพูนทวี
        </div>
      </div>

      {rows && (
        <>
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
            <IvStat label="จำนวนราย" value={rows.length} sub="ราย" accent />
            <IvStat label="รวมยอดเรียกเก็บ" value={fmt.money(totCollect, 2)} sub="บาท" />
            <IvStat label="รวมยอดตัดได้" value={fmt.money(totDeducted, 2)} sub="บาท" tone="ok" />
            <IvStat label="เรียกเก็บไม่พอ" value={shortRows.length} sub="ราย" tone={shortRows.length ? 'warn' : undefined} />
          </div>
          <div className="search-card dat-section" style={{ marginTop: 12 }}>
            <div className="dat-section-head is-bar"><span className="head-bar" />
              <div className="dat-section-title">รายการตัดหุ้นพูนทวี · {DEP_PT_MONTHS[month - 1]} {year}</div>
              {posted && <span className="pill ok" style={{ marginLeft: 'auto' }}>ผ่านรายการแล้ว</span>}
            </div>
            <div className="table-wrap" style={{ margin: '12px 16px 16px' }}>
              <table className="tbl" style={{ width: '100%', minWidth: 1040 }}>
                <thead><tr>
                  <th className="center" style={{ width: 40 }}><input type="checkbox" className="ct-check" checked={allOn} disabled={posted || !pickable.length}
                    onChange={() => setSel(allOn ? [] : pickable.map(r => r.accNo))} aria-label="เลือกทั้งหมด" /></th>
                  <th className="center" style={{ width: 54 }}>ลำดับ</th>
                  <th className="mono" style={{ width: 128 }}>เลขบัญชี</th>
                  <th>สมาชิก : ชื่อบัญชี</th>
                  <th className="right" style={{ width: 132 }}>คงเหลือในบัญชี</th>
                  <th className="right" style={{ width: 116 }}>ยอดเรียกเก็บ</th>
                  <th className="right" style={{ width: 116 }}>ยอดตัดได้</th>
                  <th className="center" style={{ width: 82 }}>หักแบบ</th>
                  <th style={{ width: 150 }}>หมายเหตุ</th>
                </tr></thead>
                <tbody>
                  <tr className="dep-co-sumrow">
                    <td colSpan="4"><b>จำนวนราย {rows.length} ราย</b></td>
                    <td className="right mono"><b>{fmt.money(totBalance, 2)}</b></td>
                    <td className="right mono"><b>{fmt.money(totCollect, 2)}</b></td>
                    <td className="right mono"><b>{fmt.money(totDeducted, 2)}</b></td>
                    <td colSpan="2"></td>
                  </tr>
                  {rows.map(r => (
                    <tr key={r.accNo} className={r.closed ? 'dep-pt-closed' : (r.shortfall > 0 ? 'dep-pt-short' : '')}>
                      <td className="center"><input type="checkbox" className="ct-check" checked={sel.includes(r.accNo)} disabled={!canPick(r)}
                        onChange={() => toggle(r.accNo)} aria-label={'เลือก ' + r.accNo} /></td>
                      <td className="center mono">{r.seq}</td>
                      <td className="mono">{r.accNo}</td>
                      <td><span className="mono muted">{r.reg}</span> : {r.name}</td>
                      <td className="right mono">{fmt.money(r.balance, 2)}</td>
                      <td className="right mono">{fmt.money(r.collect, 2)}</td>
                      <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(r.deducted, 2)}</td>
                      <td className="center"><span className="chip">{r.deduct}</span></td>
                      <td>
                        {r.closed ? <span className="pill bad">ปิดบัญชี {fmt.date(r.closed)}</span>
                          : r.shortfall > 0 ? <span className="pill warn">ขาด {fmt.money(r.shortfall, 2)}</span>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan="4" className="right">รวมทั้งสิ้น</td>
                  <td className="right mono"><b>{fmt.money(totBalance, 2)}</b></td>
                  <td className="right mono"><b>{fmt.money(totCollect, 2)}</b></td>
                  <td className="right mono"><b>{fmt.money(totDeducted, 2)}</b></td>
                  <td colSpan="2"></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            <Icon name="info" size={11} /> ยอดตัดได้ = จำนวนที่ต่ำกว่าระหว่างยอดเรียกเก็บและยอดคงเหลือ · บัญชีที่ปิดแล้วจะไม่ถูกตัด · รายการที่ยอดคงเหลือไม่พอจะถูกทำเครื่องหมาย "ขาด" · ผ่านรายการเพื่อบันทึกลงระบบ
          </div>
          {askPost && window.DepConfirmModal && (
            <window.DepConfirmModal title="ยืนยันผ่านรายการตัดหุ้นพูนทวี"
              lines={[['งวด', DEP_PT_MONTHS[month - 1] + ' ' + year], ['ผ่านรายการ', sel.length + ' บัญชี'],
                ...(rows.length - sel.length ? [['ข้ามรอบนี้', (rows.length - sel.length) + ' บัญชี']] : []),
                ['ยอดตัดรวม', fmt.money(selTot, 2) + ' บาท']]}
              okLabel="ยืนยันผ่านรายการ" onOk={postTxn} onClose={() => setAskPost(false)} />
          )}
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepPoontaweeProcessPage });
