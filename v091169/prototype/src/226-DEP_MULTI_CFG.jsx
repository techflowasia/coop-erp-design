// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ฝากหลายประเภท (batch deposit)
//  ฝากปันผล · ฝากเงินเดือนเจ้าหน้าที่ · ฝากทุนการศึกษา · ฝากเงินสวัสดิการ · ฝากจากเงินกู้
//  ดึงข้อมูลจากผลการประมวลผลต้นทาง → ประมวลผลรับฝากเข้าบัญชีเงินฝากของสมาชิก
//  จับคู่ด้วยเลขที่บัญชี · โพสต์เข้า ledger เดียวกับหน้ารับฝาก · เก็บ Audit Trail
// ════════════════════════════════════════════════════════════════════

const DEP_MULTI_CFG = {
  dividend: {
    title: 'ฝาก-ปันผล', channel: 'ฝากปันผล', icon: 'wallet',
    desc: 'ดึงผลการประมวลผลการจ่ายปันผลประจำปี มาทำรายการฝากเข้าบัญชีเงินฝากของสมาชิก',
    srcLabel: 'ผลประมวลผลการปันผล',
    cols: [
      { key: 'member', label: 'เลขสมาชิก', mono: true },
      { key: 'accNo', label: 'เลขที่บัญชี', mono: true },
      { key: 'name', label: 'ชื่อบัญชี' },
    ],
  },
  salary: {
    title: 'ฝาก-เงินเดือนเจ้าหน้าที่', channel: 'ฝากเงินเดือนเจ้าหน้าที่', icon: 'wallet',
    desc: 'ดึงผลการประมวลผลการฝากประจำเดือน มาทำรายการฝากเข้าบัญชีเงินฝากของเจ้าหน้าที่',
    srcLabel: 'ผลประมวลผลการฝากประจำเดือน',
    cols: [
      { key: 'member', label: 'เลขสมาชิก', mono: true },
      { key: 'name', label: 'ชื่อ - สกุล' },
      { key: 'accNo', label: 'โอนเข้าบัญชี', mono: true },
    ],
  },
  scholarship: {
    title: 'ฝาก-ทุนการศึกษา', channel: 'ฝากทุนการศึกษา', icon: 'wallet',
    desc: 'ดึงผลการประมวลผลการจ่ายทุนการศึกษาที่อนุมัติ มาทำรายการฝากเข้าบัญชีเงินฝากของสมาชิก',
    srcLabel: 'ผลประมวลผลการจ่ายทุนการศึกษา',
    cols: [
      { key: 'seq', label: 'ลำดับทุน', mono: true, center: true },
      { key: 'name', label: 'ชื่อ - สกุล' },
      { key: 'accNo', label: 'โอนเข้าบัญชี', mono: true },
    ],
  },
  welfare: {
    title: 'ฝาก-เงินสวัสดิการ', channel: 'ฝากเงินสวัสดิการ', icon: 'wallet',
    desc: 'ดึงรายการอนุมัติจ่ายเงินสวัสดิการ มาทำรายการฝากเข้าบัญชีเงินฝากของสมาชิก',
    srcLabel: 'รายการอนุมัติจ่ายเงินสวัสดิการ',
    cols: [
      { key: 'reqNo', label: 'เลขที่คำขอ', mono: true },
      { key: 'name', label: 'ชื่อ - สกุล' },
      { key: 'accNo', label: 'โอนเข้าบัญชี', mono: true },
    ],
  },
  meeting: {
    title: 'ฝาก-เบี้ยประชุมและเลือกตั้ง', channel: 'ฝากเบี้ยประชุมและเลือกตั้ง', icon: 'wallet',
    desc: 'ดึงรายการอนุมัติจ่ายเบี้ยประชุมและค่าตอบแทนการเลือกตั้ง มาทำรายการฝากเข้าบัญชีเงินฝากของสมาชิก',
    srcLabel: 'รายการอนุมัติจ่ายเบี้ยประชุม',
    cols: [
      { key: 'docNo', label: 'เลขที่เอกสาร', mono: true },
      { key: 'name', label: 'ชื่อ - สกุล' },
      { key: 'accNo', label: 'โอนเข้าบัญชี', mono: true },
    ],
  },
  loan: {
    title: 'ฝาก-เงินกู้', channel: 'ฝากจากเงินกู้', icon: 'wallet',
    desc: 'ดึงรายการโอนจากระบบเงินกู้ (ตาม LOT) มาทำรายการฝากเข้าบัญชีเงินฝากของสมาชิก',
    srcLabel: 'รายการโอนจากระบบเงินกู้',
    cols: [
      { key: 'member', label: 'เลขสมาชิก', mono: true },
      { key: 'contract', label: 'เลขที่สัญญา', mono: true },
      { key: 'accNo', label: 'เลขที่บัญชี', mono: true },
      { key: 'name', label: 'ชื่อบัญชี' },
    ],
  },
};

function DepMultiDepositPage({ source, onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const cfg = DEP_MULTI_CFG[source];
  const data = window.DEP_MULTI_DATA[source];

  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [rows, setRows] = useState(null);   // null = ยังไม่ดึง
  const [posted, setPosted] = useState(false);

  // ── ค่าตัวกรอง (แต่ละแหล่งข้อมูลใช้ฟิลด์ต่างกัน) ──
  const thaiToday = window.depMultiThaiToday();
  const [filters, setFilters] = useState(() => {
    if (source === 'dividend')    return { year: data.years[0], txnDate: thaiToday };
    if (source === 'salary')      return { txnDate: thaiToday, year: data.years[0], month: data.months[6] };
    if (source === 'scholarship') return { year: data.years[0], type: data.types[0], level: data.levels[0] };
    if (source === 'welfare')     return { type: data.types[0], payDate: thaiToday };
    if (source === 'meeting')     return { year: data.years[0], postDate: thaiToday, type: data.types[0], pair: data.pairs[0], cutDate: thaiToday, cutTime: data.cutTime };
    if (source === 'loan')        return { txnDate: thaiToday, lot: data.lots[0], accType: data.accTypes[0] };
    return {};
  });
  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setRows(null); setPosted(false); };

  const periodLabel = () => {
    if (source === 'dividend')    return `ปันผลปี ${filters.year}`;
    if (source === 'salary')      return `${filters.month} ${filters.year}`;
    if (source === 'scholarship') return `ปีงบ ${filters.year} · ${filters.type.split(' - ')[1] || filters.type}`;
    if (source === 'welfare')     return filters.type.split(' - ')[1] || filters.type;
    if (source === 'meeting')     return 'ประชุมใหญ่ ' + filters.year + ' · ' + (filters.type.split(' - ')[1] || filters.type);
    if (source === 'loan')        return filters.lot;
    return '';
  };

  // เงินกู้ที่อนุมัติจ่ายแล้ว (โอนเข้าบัญชีเงินฝาก) — ยังไม่ได้ฝาก
  const loanApproved = () => {
    if (source !== 'loan' || !window.ldLoad) return [];
    let posted = {}; try { posted = JSON.parse(localStorage.getItem('dep_loan_posted') || '{}'); } catch (e) {}
    const norm = (x) => String(x || '').replace(/\s+/g, '');
    const dig = (x) => String(x || '').replace(/\D/g, '').replace(/^0+/, '');
    const pick = (r) => {
      if (r.depositAcc) { const a = accounts.find(x => x.accNo === r.depositAcc); if (a) return a; }
      const m = accounts.filter(a => a.status !== 'closed' && ((r.memberCode && dig(a.member) === dig(r.memberCode)) || norm(a.name) === norm(r.memberName)));
      return m.find(a => /ออมทรัพย์/.test(a.type || '')) || m[0];
    };
    return window.ldLoad().filter(r => r.status === 'approved' && r.payMethod === 'transfer' && !posted[r.id]).map(r => {
      const acc = pick(r);
      return { member: r.memberCode || (acc && acc.member) || '—', contract: r.contractNo || r.id, accNo: (acc && acc.accNo) || r.depositAcc || '—',
               name: r.memberName || (acc && acc.name) || '—', amount: Number(r.netReceive || r.amount) || 0, _loanId: r.id };
    });
  };
  const pull = () => {
    const withMatch = [...loanApproved(), ...data.rows].map((r, i) => ({
      ...r, _line: i + 1,
      match: accounts.some(a => a.accNo === r.accNo) ? 'matched' : 'unmatched',
    }));
    setRows(withMatch); setPosted(false);
    onToast && onToast(`ดึงข้อมูล ${withMatch.length} รายการจาก${cfg.srcLabel}เรียบร้อย`);
  };

  const matched = rows ? rows.filter(r => r.match === 'matched') : [];
  const unmatched = rows ? rows.filter(r => r.match === 'unmatched') : [];
  const sum = (rs) => rs.reduce((s, r) => s + r.amount, 0);
  const total = rows ? sum(rows) : 0;

  const [askProc, setAskProc] = useState(false);
  // เปลี่ยนเมนูย่อย — ล้างรายการที่ดึงไว้ ไม่ให้ประมวลผลข้ามเมนู
  React.useEffect(() => { setRows(null); setPosted(false); setAskProc(false); }, [source]);
  const process = () => {
    setAskProc(false);
    let nextAcc = accounts.map(a => ({ ...a }));
    const newLedger = [];
    matched.forEach(r => {
      const idx = nextAcc.findIndex(a => a.accNo === r.accNo);
      if (idx < 0) return;
      const nb = nextAcc[idx].balance + r.amount;
      nextAcc[idx] = { ...nextAcc[idx], balance: nb };
      newLedger.unshift({
        id: window.depTxnNextId(), date: window.DEP_OPS_TODAY, accNo: r.accNo, member: r.member || nextAcc[idx].member,
        type: 'deposit', channel: cfg.channel, amount: r.amount, fee: 0, balance: nb,
        ref: periodLabel(), by: window.DEP_OPS_USER,
      });
    });
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    if (source === 'loan') {
      let posted = {}; try { posted = JSON.parse(localStorage.getItem('dep_loan_posted') || '{}'); } catch (e) {}
      matched.forEach(r => { if (r._loanId) posted[r._loanId] = window.DEP_OPS_TODAY; });
      try { localStorage.setItem('dep_loan_posted', JSON.stringify(posted)); } catch (e) {}
    }
    const nextL = [...newLedger, ...ledger]; setLedger(nextL); window.depTxnSaveLedger(nextL);
    audit.log({
      action: 'create', module: 'เงินฝาก — ' + cfg.title, target: periodLabel(),
      summary: `ประมวลผลรับฝาก (${cfg.channel}) ${matched.length} รายการ รวม ${fmt.money(sum(matched), 2)} บาท`,
      changes: [{ field: 'จำนวนรายการฝาก', before: '—', after: String(matched.length) }],
    });
    setPosted(true);
    onToast && onToast(`ประมวลผลรับฝาก ${matched.length} รายการเรียบร้อย${unmatched.length ? ` · ข้าม ${unmatched.length} รายการที่ไม่พบบัญชี` : ''}`);
  };

  // ── ตัวช่วย render ฟิลด์กรอง ──
  const Sel = ({ k, opts }) => (
    <select className="cfg-input" value={filters[k]} onChange={(e) => setF(k, e.target.value)}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  const thToIso = (s) => { const x = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return x ? (Number(x[3]) - 543) + '-' + x[2] + '-' + x[1] : ''; };
  const isoToTh = (iso) => { const [y, mo, d] = String(iso || '').split('-'); return y ? d + '/' + mo + '/' + (Number(y) + 543) : ''; };
  // วันที่ลงบัญชี — ล็อกเป็นวันทำการของระบบ (อ่านอย่างเดียว)
  const PostDate = () => (
    <div className="cfg-input dmd-postdate" title="วันที่ลงบัญชีเป็นวันทำการของระบบ — แก้ไขไม่ได้">
      <span>{thaiToday}</span>
    </div>
  );
  const DateF = ({ k }) => (
    <window.ThaiDateField value={thToIso(filters[k])} onChange={(v) => setF(k, isoToTh(v))} />
  );

  return (
    <div data-screen-label={cfg.title}>
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cfg.title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{cfg.desc}</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <button className="btn primary sm" data-keep-top="" disabled={!rows || posted || matched.length === 0} onClick={() => setAskProc(true)}>
            <Icon name="check" /> {posted ? 'ประมวลผลแล้ว' : 'ประมวลผล' + (rows && matched.length ? ' (' + matched.length + ' รายการ)' : '')}
          </button>
        </div>
      </div>

      {/* ── ตัวกรอง + ปุ่มดึง/ประมวลผล ── */}
      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <div className={'dmd-filter' + (source === 'meeting' ? ' meeting' : '')} style={{ paddingTop: 16 }}>
          <div className="dmd-fields">
            {source === 'dividend' && <>
              <DatFieldLite label="จ่ายปันผลปี"><Sel k="year" opts={data.years} /></DatFieldLite>
              <DatFieldLite label="วันที่ทำรายการ (ลงบัญชี)"><PostDate /></DatFieldLite>
            </>}
            {source === 'salary' && <>
              <DatFieldLite label="วันที่โอนเงินเดือน (ลงบัญชี)"><PostDate /></DatFieldLite>
              <DatFieldLite label="ปี"><Sel k="year" opts={data.years} /></DatFieldLite>
              <DatFieldLite label="เดือน"><Sel k="month" opts={data.months} /></DatFieldLite>
            </>}
            {source === 'scholarship' && <>
              <DatFieldLite label="ปีงบประมาณ"><Sel k="year" opts={data.years} /></DatFieldLite>
              <DatFieldLite label="ประเภททุน"><Sel k="type" opts={data.types} /></DatFieldLite>
              <DatFieldLite label="ระดับชั้น"><Sel k="level" opts={data.levels} /></DatFieldLite>
              <DatFieldLite label="วันที่ลงบัญชี"><PostDate /></DatFieldLite>
            </>}
            {source === 'welfare' && <>
              <DatFieldLite label="ประเภทสวัสดิการ" span={2}><Sel k="type" opts={data.types} /></DatFieldLite>
              <DatFieldLite label="วันที่สั่งจ่าย"><DateF k="payDate" /></DatFieldLite>
              <DatFieldLite label="วันที่ลงบัญชี"><PostDate /></DatFieldLite>
            </>}
            {source === 'meeting' && <>
              <DatFieldLite label="จ่ายค่าประชุมใหญ่"><Sel k="year" opts={data.years} /></DatFieldLite>
              <DatFieldLite label="ประเภทการจ่าย" span={2}><Sel k="type" opts={data.types} /></DatFieldLite>
              <DatFieldLite label="ตัดข้อมูล ณ วันที่ / เวลา" span={2}>
                <div className="dmd-cut">
                  <DateF k="cutDate" />
                  <input className="cfg-input" value={filters.cutTime || ''} onChange={(e) => setF('cutTime', e.target.value)} placeholder="ชช:นน:วว" />
                </div>
              </DatFieldLite>
              <DatFieldLite label="วันที่โอนเข้าฝาก (ลงบัญชี)"><PostDate /></DatFieldLite>
              <DatFieldLite label="คู่บัญชี" span={2}><Sel k="pair" opts={data.pairs} /></DatFieldLite>
            </>}
            {source === 'loan' && <>
              <DatFieldLite label="วันที่โอนรายการ (ลงบัญชี)"><PostDate /></DatFieldLite>
              <DatFieldLite label="LOT ทำรายการ"><Sel k="lot" opts={data.lots} /></DatFieldLite>
              <DatFieldLite label="ประเภทบัญชีเงินฝาก" span={2}><Sel k="accType" opts={data.accTypes} /></DatFieldLite>
            </>}
          </div>
          <div className="dmd-btns">
            <button className="btn primary" onClick={pull}><Icon name="download" /> {source === 'meeting' ? 'ดึงรายการ' : 'ดึงข้อมูล'}</button>
          </div>
        </div>
      </div>

      {rows && (
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
            <IvStat label="รายการที่ดึงได้" value={rows.length + ' รายการ'} sub={'฿ ' + fmt.money(total, 2)} accent />
            <IvStat label="จับคู่บัญชีได้" value={matched.length + ' รายการ'} sub={'฿ ' + fmt.money(sum(matched), 2)} tone="success" />
            <IvStat label="ไม่พบบัญชี" value={unmatched.length + ' รายการ'} tone={unmatched.length ? 'danger' : undefined} />
            <IvStat label="สถานะ" value={posted ? 'ฝากเข้าบัญชีแล้ว' : 'รอประมวลผล'} tone={posted ? 'success' : 'warning'} />
          </div>
      )}

          {source === 'meeting' && (
          <div className="search-card dat-section" style={{ marginTop: 12 }}>
            <div className="table-wrap" style={{ margin: 16 }}><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 520 }}>
                <thead><tr>
                  <th>ประเภทรายการ</th>
                  <th className="num" style={{ width: 160 }}>จำนวนรายการ</th>
                  <th className="num" style={{ width: 180 }}>ยอดรวม</th>
                </tr></thead>
                <tbody>
                  {!rows ? (
                    <tr><td colSpan={3} className="empty-state">กำหนดเงื่อนไขแล้วกด “ดึงรายการ”</td></tr>
                  ) : Object.entries(rows.reduce((g, r) => { const k = r.kind || 'อื่น ๆ'; (g[k] = g[k] || []).push(r); return g; }, {})).map(([k, rs]) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td className="num mono">{rs.length.toLocaleString()}</td>
                      <td className="num mono">{fmt.money(sum(rs), 2)}</td>
                    </tr>
                  ))}
                </tbody>
                {rows && <tfoot><tr>
                  <td><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{rows.length.toLocaleString()}</b></td>
                  <td className="num mono"><b style={{ color: 'var(--brand, #237450)' }}>{fmt.money(total, 2)}</b></td>
                </tr></tfoot>}
              </table>
            </div></div>
          </div>
          )}

          <div className="search-card dat-section" style={{ marginTop: 12 }}>
            <DepSecHead bar icon={cfg.icon || 'wallet'} title={/^รายการ/.test(cfg.srcLabel) ? cfg.srcLabel : 'รายการ' + cfg.srcLabel}
              meta={rows ? rows.length + ' รายการ · ยอดรวม ' + fmt.money(total, 2) + ' บาท' : null} />
            <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 720 }}>
                <thead><tr>
                  <th className="center" style={{ width: 56 }}>ลำดับ</th>
                  {cfg.cols.map(c => <th key={c.key} className={c.center ? 'center' : ''}>{c.label}</th>)}
                  <th className="num" style={{ width: 150 }}>ยอดโอน</th>
                  <th className="center" style={{ width: 96 }}>ผลจับคู่</th>
                </tr></thead>
                <tbody>
                  {!rows ? (
                    <tr><td colSpan={cfg.cols.length + 3} className="empty-state">กำหนดเงื่อนไขแล้วกด “{source === 'meeting' ? 'ดึงรายการ' : 'ดึงข้อมูล'}” เพื่อแสดงรายการจาก{cfg.srcLabel}</td></tr>
                  ) : rows.map(r => (
                    <tr key={r._line} className={r.match === 'unmatched' ? 'iv-void-row' : ''}>
                      <td className="center mono">{r._line}</td>
                      {cfg.cols.map(c => (
                        <td key={c.key} className={(c.mono ? 'mono ' : '') + (c.center ? 'center' : '')}>{r[c.key]}</td>
                      ))}
                      <td className="num mono">{fmt.money(r.amount, 2)}</td>
                      <td className="center">{r.match === 'matched'
                        ? <span className="pill ok">พบบัญชี</span>
                        : <span className="pill bad">ไม่พบบัญชี</span>}</td>
                    </tr>
                  ))}
                </tbody>
                {rows && <tfoot><tr>
                  <td colSpan={cfg.cols.length + 1}><b>รวม {rows.length} รายการ · จับคู่ได้ {matched.length} รายการ</b></td>
                  <td className="num mono"><b style={{ color: 'var(--brand, #237450)' }}>{fmt.money(sum(matched), 2)}</b></td>
                  <td />
                </tr></tfoot>}
              </table>
            </div></div>
          </div>

          {rows && unmatched.length > 0 && !posted && (
            <div className="dat-warn" style={{ marginTop: 12 }}>
              <Icon name="info" size={14} />
              <span>มี {unmatched.length} รายการที่<b>ไม่พบบัญชีเงินฝาก</b> — ระบบจะข้ามรายการเหล่านี้ ตรวจสอบเลขที่บัญชีปลายทางก่อนประมวลผล</span>
            </div>
          )}

          {rows && posted && (
            <div className="dat-ok" style={{ marginTop: 12 }}>
              <Icon name="check" size={14} />
              <span>ประมวลผลรับฝากเรียบร้อย — โอนเข้าบัญชี {matched.length} รายการ รวม {fmt.money(sum(matched), 2)} บาท · ส่งข้อมูลเข้าระบบบัญชีอัตโนมัติ</span>
            </div>
          )}
      {askProc && window.DepConfirmModal && (
        <window.DepConfirmModal title={'ยืนยันประมวลผล — ' + cfg.title}
          lines={[['งวด', periodLabel()], ['รายการที่จะฝาก', matched.length + ' รายการ'], ...(unmatched.length ? [['ข้าม (ไม่พบบัญชี)', unmatched.length + ' รายการ']] : []), ['ยอดรวม', fmt.money(sum(matched), 2) + ' บาท']]}
          okLabel="ยืนยันประมวลผล" onOk={process} onClose={() => setAskProc(false)} />
      )}
    </div>
  );
}

Object.assign(window, { DepMultiDepositPage });
