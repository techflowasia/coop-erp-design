// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — หนังสือรับรองภาษีหัก ณ ที่จ่าย
//  (ดอกเบี้ยเงินฝากประจำ) — ออกหนังสือรับรอง · พิมพ์ · ติดตามสถานะ
// ════════════════════════════════════════════════════════════════════

function DepTaxCertPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.depTaxLoad);
  const [fYear, setFYear] = useState('');
  const [print, setPrint] = useState(null);

  const persist = (next) => { setList(next); window.depTaxSave(next); };
  const years = [...new Set(list.map(c => c.taxYear))].sort((a, b) => b - a);

  const issue = (c) => {
    const certNo = 'ภงด.2569/' + String(list.filter(x => x.status === 'issued').length + 1).padStart(4, '0');
    persist(list.map(x => x.id === c.id ? { ...x, status: 'issued', issuedDate: window.DEP_OPS_TODAY, certNo } : x));
    audit.log({ action: 'create', module: 'เงินฝาก — หนังสือรับรองภาษี', target: `${c.member} · ${c.name}`,
      summary: `ออกหนังสือรับรองภาษี ${certNo} (ภาษีหัก ${fmt.money(c.taxWithheld, 2)} บาท)` });
    onToast && onToast(`ออกหนังสือรับรองภาษี ${certNo} เรียบร้อยแล้ว`);
  };

  const doPrint = (c) => {
    setPrint(c);
    document.documentElement.classList.add('dep-printing');
    const cleanup = () => { document.documentElement.classList.remove('dep-printing'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 80);
    onToast && onToast('กำลังเตรียมหนังสือรับรองภาษี — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์');
  };

  const shown = list.filter(c => !fYear || String(c.taxYear) === fYear);
  const issued = list.filter(c => c.status === 'issued');
  const sumTax = issued.reduce((s, c) => s + c.taxWithheld, 0);

  return (
    <div data-screen-label="หน้าหนังสือรับรองภาษี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>หนังสือรับรองภาษีหัก ณ ที่จ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ออกหนังสือรับรองการหักภาษี ณ ที่จ่ายจากดอกเบี้ยเงินฝากประจำ สำหรับสมาชิกยื่นภาษีเงินได้</div>
        </div>
      </div>

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="หนังสือทั้งหมด" value={list.length} sub={'ฉบับ · ' + issued.length + ' ออกแล้ว · ' + (list.length - issued.length) + ' ร่าง'} accent />
        <IvStat label="ภาษีหัก ณ ที่จ่ายรวม" value={fmt.money(sumTax, 2)} sub="บาท · เฉพาะที่ออกหนังสือแล้ว" />
        <IvStat label="รอออกหนังสือ" value={(list.length - issued.length)} sub="ฉบับ" tone={(list.length - issued.length) ? 'warning' : undefined} />
      </div>

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <div className="dat-section-head is-bar"><span className="head-bar" />
          <div className="dat-section-title">รายการหนังสือรับรองภาษีหัก ณ ที่จ่าย</div>
          <span className="spacer" style={{ flex: 1 }} />
          <select className="cfg-input" style={{ width: 170, flex: '0 0 170px' }} value={fYear} onChange={(e) => setFYear(e.target.value)}>
            <option value="">ทุกปีภาษี</option>
            {years.map(y => <option key={y} value={y}>ปีภาษี {y}</option>)}
          </select>
        </div>
        <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
          <table className="tbl" style={{ width: '100%', minWidth: 900 }}>
            <thead><tr>
              <th>เลขที่หนังสือ</th><th className="center">ปีภาษี</th><th>สมาชิก</th><th className="mono">เลขที่บัญชี</th>
              <th className="right">ดอกเบี้ยจ่าย</th><th className="center">อัตราภาษี</th><th className="right">ภาษีหัก</th>
              <th className="center">สถานะ</th><th className="center" style={{ width: 130 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: 24 }}>ไม่พบหนังสือ</td></tr>}
              {shown.map(c => (
                <tr key={c.id}>
                  <td className="mono">{c.certNo || <span className="muted">— ร่าง —</span>}</td>
                  <td className="center mono">{c.taxYear}</td>
                  <td><div className="lt-row-name">{c.name}</div><div className="lt-row-note muted mono">{c.member}</div></td>
                  <td className="mono">{c.accNo}</td>
                  <td className="right mono">{fmt.money(c.interestPaid, 2)}</td>
                  <td className="center mono">{(c.taxRate * 100).toFixed(0)}%</td>
                  <td className="right mono"><b>{fmt.money(c.taxWithheld, 2)}</b></td>
                  <td className="center">{c.status === 'issued' ? <span className="pill ok">ออกแล้ว</span> : <span className="pill warn">ร่าง</span>}</td>
                  <td className="center">
                    {c.status === 'draft'
                      ? <button className="btn primary sm" style={{ minWidth: 96, justifyContent: 'center' }} onClick={() => issue(c)}>ออกหนังสือ</button>
                      : <button className="btn sm ex-row-btn" style={{ minWidth: 96, justifyContent: 'center' }} onClick={() => doPrint(c)}><Icon name="print" size={12} /> พิมพ์</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> หนังสือรับรองอ้างอิงดอกเบี้ยเงินฝากประจำที่หักภาษี ณ ที่จ่าย 15% ตามประมวลรัษฎากร</div>

      {print && (
        <div className="dep-slip-host">
          <div className="dep-slip" style={{ width: 600 }}>
            <div className="dep-slip-head">
              <img src={window.__resources.logo} alt="" className="dep-slip-logo" />
              <div>
                <div className="dep-slip-org">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)</div>
                <div className="dep-slip-org-en">THE COMMUNICATIONS AUTHORITY OF THAILAND SAVINGS CO-OPERATIVE LTD.</div>
                <div className="dep-slip-title">หนังสือรับรองการหักภาษี ณ ที่จ่าย</div>
              </div>
            </div>
            <div className="dep-slip-sub">เลขที่ {print.certNo} · ปีภาษี {print.taxYear}</div>
            <table className="dep-slip-tbl"><tbody>
              <tr><td className="k">ผู้มีเงินได้</td><td className="v">{print.member} · {print.name}</td></tr>
              <tr><td className="k">เลขที่บัญชีเงินฝาก</td><td className="v mono">{print.accNo}</td></tr>
              <tr><td className="k">ประเภทเงินได้</td><td className="v">ดอกเบี้ยเงินฝาก ({print.type})</td></tr>
              <tr><td className="k">วันที่จ่ายเงินได้</td><td className="v">{fmt.date(print.payDate)}</td></tr>
              <tr><td className="k">จำนวนเงินได้ที่จ่าย</td><td className="v mono strong">{fmt.money(print.interestPaid, 2)} บาท</td></tr>
              <tr><td className="k">อัตราภาษีหัก ณ ที่จ่าย</td><td className="v mono">{(print.taxRate * 100).toFixed(0)}%</td></tr>
              <tr className="strong"><td className="k">ภาษีที่หักและนำส่ง</td><td className="v mono">{fmt.money(print.taxWithheld, 2)} บาท</td></tr>
            </tbody></table>
            <div className="dep-slip-foot">ออกให้ ณ วันที่ {fmt.date(print.issuedDate || window.DEP_OPS_TODAY)} เพื่อใช้เป็นหลักฐานประกอบการยื่นแบบแสดงรายการภาษีเงินได้</div>
            <div className="dep-slip-sign">
              <div><div className="sl-line" />ผู้จ่ายเงิน / ผู้มีหน้าที่หักภาษี</div>
              <div><div className="sl-line" />ผู้มีอำนาจลงนาม</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DepTaxCertPage });


// ═════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › อื่นๆ — ข้อมูลภาษีส่งสรรพากร (ภ.ง.ด.2)
//  งวด · วันที่ใบเสร็จ · รหัสกลุ่มการขึ้นแผ่น · รูปแบบรายการ → ดึงข้อมูล → ส่งออก
// ═════════════════════════════════════════════════════════════════
const PND2_GROUPS = [
  { v: '', l: 'ทุกกลุ่ม' },
  { v: '01', l: '01 · สำนักงานใหญ่' },
  { v: '02', l: '02 · ภาค 1' },
  { v: '03', l: '03 · ภาค 2' },
  { v: '04', l: '04 · ภาค 3' },
];
const PND2_FORMATS = [
  { v: 'sum', l: 'เรียกเก็บแบบรวม' },
  { v: 'split', l: 'เรียกเก็บแบบแยก ตัวเอง + R' },
];
const pnd2Dmy = (iso) => { const [y, m, d] = String(iso || '').split('-'); return y ? d + '/' + m + '/' + (Number(y) + 543) : '—'; };
function DepPnd2Page({ onToast }) {
  const today = String(window.DEPOSIT_WORKING_DATE || window.DEP_OPS_TODAY || new Date().toISOString()).slice(0, 10);
  const [y0, m0] = today.split('-');
  const [period, setPeriod] = useState((Number(y0) + 543) + m0);
  const [rcptDate, setRcptDate] = useState(today);
  const [group, setGroup] = useState('');
  const [format, setFormat] = useState('sum');
  const [rows, setRows] = useState(null);
  const validPeriod = /^\d{6}$/.test(period) && Number(period.slice(4)) >= 1 && Number(period.slice(4)) <= 12;

  const pull = () => {
    if (!validPeriod) { onToast && onToast('กรุณาระบุงวดเป็น ปปปปดด เช่น 256904'); return; }
    const accs = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : []).filter(a => a.status !== 'closed');
    const mems = [...(window.MEMBERS_LIST || []), ...(window.GUAR_MEMBERS || [])];
    const exts = window.depExtPersonsLoad ? window.depExtPersonsLoad() : [];
    const digits = (s) => String(s || '').replace(/\D/g, '');
    const nm = (s) => String(s || '').replace(/^(นาย|นางสาว|นาง|น\.ส\.)\s*/, '').replace(/\s+/g, ' ').trim();
    // เลขผู้เสียภาษี — บัญชี → ทะเบียนสมาชิก → ทะเบียนบุคคล/นิติบุคคลภายนอก
    const taxIdOf = (a) => {
      if (a.taxId || a.citizenId) return a.taxId || a.citizenId;
      const num = (s) => String(Number(digits(s) || 0));
      const an = nm(a.name);
      const m = mems.find(x => a.member && (x.code === a.member || (digits(a.member) && num(x.code) === num(a.member))))
             || mems.find(x => { const xn = nm(x.name); return an && (xn === an || xn.startsWith(an + ' ') || an.startsWith(xn + ' ')); });
      if (m && m.citizenId) return m.citizenId;
      const e = exts.find(x => x.code === a.member || nm(window.depExtPersonName ? window.depExtPersonName(x) : x.name) === nm(a.name));
      if (e) return e.taxId || e.citizenId;
      return '';   // ไม่พบเลขผู้เสียภาษี — ต้องเพิ่มที่ทะเบียนก่อนยื่น
    };
    const list = accs.map((a, i) => {
      const gross = Math.round(Number(a.balance || 0) * Number(a.rate || 0) / 100 / 12 * 100) / 100;
      const tax = Math.round(gross * 0.15 * 100) / 100;
      return { accNo: a.accNo, name: a.name, member: a.member, taxId: taxIdOf(a),
               grp: PND2_GROUPS[1 + (i % 4)].v, gross, tax };
    }).filter(r => r.gross > 0 && (!group || r.grp === group));
    setRows(format === 'split'
      ? list.flatMap(r => [r, { ...r, accNo: r.accNo + '-R', gross: Math.round(r.gross * 0.1 * 100) / 100, tax: Math.round(r.tax * 0.1 * 100) / 100, isR: true }])
      : list);
  };
  const sum = rows ? rows.reduce((s, r) => ({ g: s.g + r.gross, t: s.t + r.tax }), { g: 0, t: 0 }) : { g: 0, t: 0 };
  const people = rows ? new Set(rows.map(r => r.member)).size : 0;
  const exportFile = () => {
    if (!rows || !rows.length) return;
    const missing = rows.filter(r => !r.taxId).length;
    if (missing) { onToast && onToast('มี ' + missing + ' รายการที่ยังไม่มีเลขประจำตัวผู้เสียภาษี — กรุณาเพิ่มที่ทะเบียนสมาชิก/บุคคลภายนอกก่อนส่งออก'); return; }
    const head = 'ลำดับ|เลขประจำตัวผู้เสียภาษี|ชื่อ-สกุล|เลขที่บัญชี|วันที่จ่าย|เงินได้|อัตราภาษี|ภาษีที่หัก';
    const d = pnd2Dmy(rcptDate);
    const body = rows.map((r, i) => [i + 1, String(r.taxId).replace(/-/g, ''), r.name, r.accNo, d, r.gross.toFixed(2), '15', r.tax.toFixed(2)].join('|')).join('\n');
    const blob = new Blob(['\ufeff' + head + '\n' + body], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'PND2_' + period + '.txt'; a.click();
    onToast && onToast('ส่งออกไฟล์ ภ.ง.ด.2 งวด ' + period + ' แล้ว');
  };

  return (
    <div data-screen-label="ข้อมูลภาษีส่งสรรพากร (ภ.ง.ด.2)">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ข้อมูลภาษีส่งสรรพากร (ภ.ง.ด.2)</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ดึงข้อมูลดอกเบี้ยเงินฝากและภาษีหัก ณ ที่จ่ายตามงวด เพื่อจัดทำไฟล์ยื่นแบบ ภ.ง.ด.2</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={!rows || !rows.length} onClick={exportFile}>ส่งออกไฟล์ ภ.ง.ด.2</button>
      </div>

      <div className="search-card dat-section" style={{ marginBottom: 12 }}>
        <div className="dat-section-head is-bar"><span className="head-bar" />
          <div><div className="dat-section-title">เงื่อนไขการดึงข้อมูล</div></div>
        </div>
        <div className="dat-grid dense" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) auto', alignItems: 'end' }}>
          <DatFieldLite label="งวด" required>
            <input className={'cfg-input mono' + (period && !validPeriod ? ' error' : '')} value={period} inputMode="numeric" maxLength={6}
                   placeholder="ปปปปดด" onChange={(e) => setPeriod(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </DatFieldLite>
          <DatFieldLite label="วันที่ใบเสร็จ" required>
            <window.ThaiDateField value={rcptDate} onChange={(v) => setRcptDate(v)} />
          </DatFieldLite>
          <DatFieldLite label="รหัสกลุ่มการขึ้นแผ่น">
            <select className="cfg-input" value={group} onChange={(e) => setGroup(e.target.value)}>
              {PND2_GROUPS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="รูปแบบรายการ">
            <select className="cfg-input" value={format} onChange={(e) => setFormat(e.target.value)}>
              {PND2_FORMATS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
            </select>
          </DatFieldLite>
          <button className="btn primary" onClick={pull}>ดึงข้อมูล</button>
        </div>
      </div>

      {rows && (
        <>
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 12 }}>
            <IvStat label="ผู้มีเงินได้" value={people} sub="ราย" accent />
            <IvStat label="เงินได้รวม" value={window.fmt.money(sum.g, 2)} sub="บาท" />
            <IvStat label="ภาษีหัก ณ ที่จ่ายรวม" value={window.fmt.money(sum.t, 2)} sub="บาท" tone="danger" />
          </div>
          <div className="search-card dat-section">
            <div className="dat-section-head is-bar"><span className="head-bar" />
              <div><div className="dat-section-title">รายการผู้มีเงินได้ งวด {period}</div></div>
            </div>
            <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
              <table className="tbl" style={{ width: '100%', minWidth: 900 }}>
                <thead><tr>
                  <th className="center" style={{ width: 54 }}>ลำดับ</th>
                  <th>เลขประจำตัวผู้เสียภาษี</th>
                  <th>ชื่อ-สกุล</th>
                  <th>เลขที่บัญชี</th>
                  <th className="center">วันที่จ่าย</th>
                  <th className="right">เงินได้</th>
                  <th className="center">อัตราภาษี</th>
                  <th className="right">ภาษีที่หัก</th>
                </tr></thead>
                <tbody>
                  {rows.length === 0
                    ? <tr><td colSpan="8" className="empty-state">ไม่พบข้อมูล</td></tr>
                    : rows.map((r, i) => (
                      <tr key={r.accNo + i}>
                        <td className="center mono">{i + 1}</td>
                        <td className="mono">{r.taxId || <span style={{ color: 'var(--danger, #cf1322)', fontFamily: 'var(--font-sans)' }}>ยังไม่มีเลขผู้เสียภาษี</span>}</td>
                        <td>{r.name}{r.isR && <span className="muted"> (R)</span>}</td>
                        <td className="mono">{r.accNo}</td>
                        <td className="center mono">{pnd2Dmy(rcptDate)}</td>
                        <td className="right mono">{window.fmt.money(r.gross, 2)}</td>
                        <td className="center mono">15%</td>
                        <td className="right mono" style={{ color: 'var(--danger)' }}>{window.fmt.money(r.tax, 2)}</td>
                      </tr>
                    ))}
                </tbody>
                {rows.length > 0 && (
                  <tfoot><tr>
                    <td colSpan="5" className="right"><b>รวมทั้งสิ้น {rows.length} รายการ</b></td>
                    <td className="right mono"><b>{window.fmt.money(sum.g, 2)}</b></td>
                    <td />
                    <td className="right mono" style={{ color: 'var(--danger)' }}><b>{window.fmt.money(sum.t, 2)}</b></td>
                  </tr></tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
window.DepPnd2Page = DepPnd2Page;
