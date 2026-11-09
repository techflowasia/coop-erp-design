// ════════════════════════════════════════════════════════════════════
//  ระบบงานประมวลผลและจัดเก็บ — ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร
//  ประมวลผล → แสดงสมาชิก/สัญญาที่ต้องนำส่ง → กดส่งข้อมูลให้กรมสรรพากร
// ════════════════════════════════════════════════════════════════════
const { useState: tcxUseState, useMemo: tcxUseMemo, useRef: tcxUseRef, useEffect: tcxUseEffect } = React;

const TCX_YEARS = [2568, 2567, 2566];

// สมาชิกที่มีสัญญาเงินกู้เพื่อที่อยู่อาศัย (ดอกเบี้ยลดหย่อนภาษีได้)
const TCX_SEED = [
  { code: 'M-067012', name: 'นายวิรัตน์ ทองสุข', citizenId: '3-1020-00457-12-8', dept: 'กองช่าง', contracts: [
    { contractNo: 'L-2565-00841', type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย', purpose: 'ซื้ออาคารพร้อมที่ดิน', interest: 48250.75, certNo: 'IC-2568-004182', issuedAt: '2026-01-18', tax: 'sent', taxAt: '2026-02-05' },
    { contractNo: 'L-2566-01120', type: 'เงินกู้พิเศษเคหะสงเคราะห์', purpose: 'ซ่อมแซม ปรับปรุง ต่อเติม บ้านพักอาศัย', interest: 12980.50, certNo: 'IC-2568-004183', issuedAt: '2026-01-18', tax: 'wait' },
  ] },
  { code: 'M-066238', name: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์', citizenId: '1-1018-00712-90-4', dept: 'กองการศึกษา', contracts: [
    { contractNo: 'L-2564-00620', type: 'เงินกู้พิเศษเคหะสงเคราะห์', purpose: 'ปลูกสร้างอาคารบนที่ดินของตนเอง', interest: 71420.00, certNo: 'IC-2568-004201', issuedAt: '2026-01-18', tax: 'wait' },
  ] },
  { code: 'M-065471', name: 'นายประเสริฐ มั่นคงดี', citizenId: '3-1006-00189-44-1', dept: 'สำนักงานปลัด', contracts: [
    { contractNo: 'L-2563-00318', type: 'เงินกู้พิเศษเคหะสงเคราะห์', purpose: 'ไถ่ถอนจำนองจากสถาบันการเงิน', interest: 96310.25, certNo: 'IC-2568-004214', issuedAt: '2026-01-19', tax: 'wait' },
    { contractNo: 'L-2567-01402', type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย', purpose: '', interest: 8640.00, certNo: '', issuedAt: '', tax: 'wait' },
  ] },
  { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1001-00902-31-7', dept: 'กองคลัง', contracts: [
    { contractNo: 'L-2566-00975', type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย', purpose: 'ซื้อห้องชุดในอาคารชุด', interest: 33180.40, certNo: 'IC-2568-004230', issuedAt: '2026-01-19', tax: 'wait' },
  ] },
  { code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', citizenId: '', dept: 'กองคลัง', contracts: [
    { contractNo: 'L-2565-00733', type: 'เงินกู้พิเศษเคหะสงเคราะห์', purpose: 'ซื้อที่ดินพร้อมปลูกสร้างบ้าน', interest: 58940.10, certNo: 'IC-2568-004238', issuedAt: '2026-01-19', tax: 'wait' },
  ] },
  { code: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', citizenId: '1-1099-00344-08-2', dept: 'กองการศึกษา', contracts: [
    { contractNo: 'L-2567-01188', type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย', purpose: 'เช่าซื้ออาคารพร้อมที่ดิน', interest: 21760.00, certNo: 'IC-2568-004244', issuedAt: '2026-01-20', tax: 'wait' },
  ] },
  { code: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', citizenId: '3-1044-00611-77-5', dept: 'กองคลัง', contracts: [
    { contractNo: 'L-2562-00204', type: 'เงินกู้พิเศษเคหะสงเคราะห์', purpose: 'ซื้ออาคารพร้อมที่ดิน', interest: 104270.85, certNo: 'IC-2568-004251', issuedAt: '2026-01-20', tax: 'wait' },
    { contractNo: 'L-2568-01655', type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย', purpose: 'ซื้อที่ดินเฉพาะส่วน', interest: 5210.30, certNo: 'IC-2568-004252', issuedAt: '2026-01-20', tax: 'wait' },
  ] },
  { code: 'M-058252', name: 'นางสาวจุฬาลักษณ์ ทองดี', citizenId: '1-1077-00458-19-3', dept: 'สำนักงานปลัด', contracts: [
    { contractNo: 'L-2566-01033', type: 'เงินกู้สามัญเพื่อที่อยู่อาศัย', purpose: 'ปลูกสร้างอาคารบนที่ดินเช่า', interest: 27505.60, certNo: 'IC-2568-004260', issuedAt: '2026-01-20', tax: 'wait' },
  ] },
];

const TCX_HISTORY = [
  { no: 'RD-2567-0001', taxYear: 2567, channel: 'ยื่นผ่านอินเทอร์เน็ต (e-Filing)', members: 214, contracts: 268, interest: 8642310.55, at: '2025-02-08 10:24', by: 'นางจันทร์เพ็ญ มาลี', status: 'ok' },
  { no: 'RD-2568-0001', taxYear: 2568, channel: 'ยื่นผ่านอินเทอร์เน็ต (e-Filing)', members: 187, contracts: 231, interest: 7418920.00, at: '2026-02-05 09:41', by: 'นางจันทร์เพ็ญ มาลี', status: 'ok' },
];

// เหตุที่ยังนำส่งไม่ได้
function tcxBlockers(m, c) {
  const b = [];
  if (!c.purpose) b.push('ไม่ได้ระบุวัตถุประสงค์การกู้');
  if (!c.certNo) b.push('ยังไม่ได้ออกหนังสือรับรองดอกเบี้ย');
  if (!m.citizenId) b.push('ไม่มีเลขประจำตัวประชาชนในทะเบียนสมาชิก');
  return b;
}

function TaxCertSubmitPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const fmt = window.fmt;
  const [year, setYear] = tcxUseState(2568);
  const [dept, setDept] = tcxUseState('');
  const [includeSent, setIncludeSent] = tcxUseState(false);
  const [minInterest, setMinInterest] = tcxUseState('');
  const [phase, setPhase] = tcxUseState('idle');       // idle | running | done
  const [progress, setProgress] = tcxUseState(0);
  const [step, setStep] = tcxUseState('');
  const [rows, setRows] = tcxUseState([]);             // ผลประมวลผล (flatten สัญญา)
  const [sel, setSel] = tcxUseState(() => new Set());
  const [ranAt, setRanAt] = tcxUseState('');
  const [history, setHistory] = tcxUseState(() => TCX_HISTORY.map(h => ({ ...h })).sort((a, b) => (a.at < b.at ? 1 : -1)));
  const [modal, setModal] = tcxUseState(false);
  const [channel, setChannel] = tcxUseState((window.LOAN_CERT_TAX_CHANNELS || ['ยื่นผ่านอินเทอร์เน็ต (e-Filing)'])[0]);
  const timer = tcxUseRef(null);

  window.useBreadcrumb && window.useBreadcrumb(
    [{ label: 'ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร', current: true }], []);

  tcxUseEffect(() => () => clearInterval(timer.current), []);

  const depts = tcxUseMemo(() => Array.from(new Set(TCX_SEED.map(m => m.dept))), []);

  const build = () => {
    const min = Number(String(minInterest).replace(/[^\d.]/g, '')) || 0;
    const out = [];
    TCX_SEED.forEach(m => {
      if (dept && m.dept !== dept) return;
      m.contracts.forEach(c => {
        if (c.tax === 'sent' && !includeSent) return;
        if (c.interest < min) return;
        const blockers = tcxBlockers(m, c);
        out.push({
          key: m.code + '|' + c.contractNo,
          member: m, ...c, taxYear: year,
          blockers,
          state: c.tax === 'sent' ? 'sent' : (blockers.length ? 'blocked' : 'ready'),
        });
      });
    });
    return out;
  };

  const run = () => {
    clearInterval(timer.current);
    setPhase('running'); setProgress(0); setRows([]); setSel(new Set());
    const steps = [
      'อ่านทะเบียนสมาชิกและสัญญาเงินกู้เพื่อที่อยู่อาศัย',
      'คำนวณดอกเบี้ยที่ชำระจริงในปีภาษี ' + year,
      'ตรวจสอบวัตถุประสงค์การกู้และหนังสือรับรองที่ออกแล้ว',
      'ตรวจสอบเลขประจำตัวประชาชนและความครบถ้วนของข้อมูล',
      'จัดชุดข้อมูลนำส่งกรมสรรพากร',
    ];
    let p = 0;
    timer.current = setInterval(() => {
      p += 8 + Math.random() * 9;
      const v = Math.min(100, p);
      setProgress(v);
      setStep(steps[Math.min(steps.length - 1, Math.floor(v / (100 / steps.length)))]);
      if (v >= 100) {
        clearInterval(timer.current);
        const res = build();
        setRows(res);
        setSel(new Set(res.filter(r => r.state === 'ready').map(r => r.key)));
        setRanAt(new Date().toISOString());
        setPhase('done');
        onToast && onToast(`ประมวลผลเรียบร้อย — พบ ${res.filter(r => r.state !== 'sent').length} สัญญาที่ต้องนำส่ง`);
      }
    }, 170);
  };

  const reset = () => { clearInterval(timer.current); setPhase('idle'); setRows([]); setSel(new Set()); setProgress(0); };

  // จัดกลุ่มตามสมาชิก
  const groups = tcxUseMemo(() => {
    const g = new Map();
    rows.forEach(r => {
      if (!g.has(r.member.code)) g.set(r.member.code, { member: r.member, items: [] });
      g.get(r.member.code).items.push(r);
    });
    return Array.from(g.values());
  }, [rows]);

  const readyRows = rows.filter(r => r.state === 'ready');
  const blockedRows = rows.filter(r => r.state === 'blocked');
  const sentRows = rows.filter(r => r.state === 'sent');
  const selRows = rows.filter(r => sel.has(r.key) && r.state === 'ready');
  const selMembers = new Set(selRows.map(r => r.member.code)).size;
  const selInterest = selRows.reduce((s, r) => s + r.interest, 0);

  const toggle = (r) => { if (r.state !== 'ready') return; setSel(s => { const n = new Set(s); n.has(r.key) ? n.delete(r.key) : n.add(r.key); return n; }); };
  const toggleGroup = (g) => {
    const keys = g.items.filter(r => r.state === 'ready').map(r => r.key);
    if (!keys.length) return;
    const allOn = keys.every(k => sel.has(k));
    setSel(s => { const n = new Set(s); keys.forEach(k => allOn ? n.delete(k) : n.add(k)); return n; });
  };
  const toggleAll = () => {
    const keys = readyRows.map(r => r.key);
    const allOn = keys.length && keys.every(k => sel.has(k));
    setSel(allOn ? new Set() : new Set(keys));
  };

  const submit = () => {
    const seq = String(history.filter(h => h.taxYear === year).length + 1).padStart(4, '0');
    const no = `RD-${year}-${seq}`;
    const at = new Date();
    const stamp = at.toISOString().slice(0, 10) + ' ' + at.toTimeString().slice(0, 5);
    const keys = new Set(selRows.map(r => r.key));
    setRows(rs => rs.map(r => keys.has(r.key) ? { ...r, state: 'sent', tax: 'sent', taxAt: at.toISOString().slice(0, 10), submitNo: no } : r));
    setHistory(h => [{ no, taxYear: year, channel, members: selMembers, contracts: selRows.length, interest: selInterest, at: stamp, by: 'นางจันทร์เพ็ญ มาลี', status: 'ok' }, ...h]);
    setSel(new Set());
    setModal(false);
    audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร',
      target: no, summary: `นำส่งข้อมูลปีภาษี ${year} จำนวน ${selRows.length} สัญญา (${selMembers} ราย) · ${channel}`,
    });
    onToast && onToast(`นำส่งข้อมูลเลขที่ ${no} — ${selRows.length} สัญญา / ${selMembers} ราย เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ประมวลผลดอกเบี้ยเงินกู้เพื่อที่อยู่อาศัยตามหนังสือรับรองที่ออกแล้ว แล้วนำส่งข้อมูลให้กรมสรรพากร ตามประกาศอธิบดีกรมสรรพากรฯ (ฉบับที่ 165)
          </div>
        </div>
        <span className="spacer" />
        {phase === 'done' && <button className="btn sm" onClick={reset}><Icon name="close" /> ล้างผลประมวลผล</button>}
        {phase === 'done' && <button className="btn sm" onClick={() => onToast && onToast('ส่งออกชุดข้อมูลนำส่ง (Text File) เรียบร้อย')}><Icon name="download" /> ส่งออกไฟล์นำส่ง</button>}
        <button className="btn primary sm" disabled={!selRows.length} onClick={() => setModal(true)}>
          <Icon name="upload" /> ส่งข้อมูลให้สรรพากร{selRows.length ? ` (${selRows.length})` : ''}
        </button>
      </div>

      {/* ── เงื่อนไขการประมวลผล ── */}
      <div className="search-card" style={{ padding: 16, marginTop: 8 }}>
        <div className="section-head"><span className="head-bar" /><h3>เงื่อนไขการประมวลผล</h3></div>
        <div className="tcx-crit">
          <label className="tcx-fld"><span>ปีภาษี</span>
            <select className="cfg-input" value={year} onChange={e => { setYear(Number(e.target.value)); reset(); }}>
              {TCX_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="tcx-fld"><span>สังกัด</span>
            <select className="cfg-input" value={dept} onChange={e => { setDept(e.target.value); reset(); }}>
              <option value="">ทุกสังกัด</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="tcx-fld"><span>ดอกเบี้ยขั้นต่ำ (บาท)</span>
            <input className="cfg-input mono" style={{ textAlign: 'right' }} placeholder="0.00" value={minInterest}
                   onChange={e => { setMinInterest(e.target.value.replace(/[^\d.,]/g, '')); reset(); }} />
          </label>
          <label className="tcx-fld tcx-chk">
            <input type="checkbox" checked={includeSent} onChange={e => { setIncludeSent(e.target.checked); reset(); }} />
            <span>แสดงสัญญาที่นำส่งแล้วด้วย</span>
          </label>
          <div className="tcx-run">
            <button className="btn primary" disabled={phase === 'running'} onClick={run}>
              <Icon name="check" /> {phase === 'running' ? 'กำลังประมวลผล…' : 'ประมวลผล'}
            </button>
          </div>
        </div>
        {phase === 'running' && (
          <div className="tcx-prog">
            <div className="pc-bar-wrap"><div className="pc-bar" style={{ width: progress + '%' }} /><span className="pc-bar-pct">{Math.round(progress)}%</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{step}</div>
          </div>
        )}
        {phase === 'done' && (
          <div className="tcx-ran muted"><Icon name="info" size={12} /> ประมวลผลเมื่อ {fmt.datetime ? fmt.datetime(ranAt) : fmt.date(ranAt)} · ปีภาษี {year}{dept ? ` · สังกัด ${dept}` : ''}</div>
        )}
      </div>

      {/* ── สรุปผลประมวลผล ── */}
      {phase === 'done' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {[
            { lab: 'สมาชิกที่ต้องนำส่ง', val: new Set(rows.filter(r => r.state !== 'sent').map(r => r.member.code)).size, unit: 'ราย', accent: true },
            { lab: 'สัญญาพร้อมนำส่ง', val: readyRows.length, unit: 'สัญญา', accent: true },
            { lab: 'ข้อมูลไม่ครบ', val: blockedRows.length, unit: 'สัญญา' },
            { lab: 'นำส่งแล้ว', val: sentRows.length, unit: 'สัญญา' },
            { lab: 'ดอกเบี้ยรวมที่พร้อมนำส่ง', val: fmt.money(readyRows.reduce((s, r) => s + r.interest, 0)), unit: 'บาท' },
          ].map((k, i) => (
            <div key={i} className={"fin-kpi" + (k.accent ? ' accent' : '')} style={{ flex: 1, minWidth: 150 }}>
              <div className="fin-kpi-lab">{k.lab}</div>
              <div className="fin-kpi-val">{k.val} {k.unit && <span className="fin-kpi-unit">{k.unit}</span>}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── ผลประมวลผล: สมาชิก / สัญญา ── */}
      {phase === 'done' && (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
          <div className="section-head" style={{ padding: '12px 14px 0' }}>
            <span className="head-bar" /><h3>รายการที่ต้องนำส่ง — ปีภาษี {year}</h3>
            <span className="spacer" />
            <button className="btn text sm" onClick={toggleAll}>{readyRows.length && readyRows.every(r => sel.has(r.key)) ? 'ไม่เลือกทั้งหมด' : 'เลือกทั้งหมดที่พร้อมนำส่ง'}</button>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0, marginTop: 10 }}><div className="table-scroll">
            <table className="tbl tcx-tbl" style={{ minWidth: 1040 }}>
              <thead><tr>
                <th style={{ width: 36 }} />
                <th style={{ width: 130 }}>เลขที่สัญญา</th>
                <th style={{ minWidth: 190 }}>ประเภทสัญญา</th>
                <th style={{ minWidth: 220 }}>วัตถุประสงค์การกู้</th>
                <th className="right" style={{ width: 130 }}>ดอกเบี้ยที่รับรอง</th>
                <th style={{ width: 140 }}>เลขที่หนังสือรับรอง</th>
                <th className="center" style={{ width: 120 }}>สถานะนำส่ง</th>
              </tr></thead>
              <tbody>
                {groups.length === 0 && <tr><td colSpan={7} className="center muted" style={{ padding: 28 }}>ไม่พบสมาชิกที่ต้องนำส่งตามเงื่อนไข</td></tr>}
                {groups.map(g => {
                  const readyKeys = g.items.filter(r => r.state === 'ready').map(r => r.key);
                  const allOn = readyKeys.length > 0 && readyKeys.every(k => sel.has(k));
                  const gInt = g.items.reduce((s, r) => s + r.interest, 0);
                  return (
                    <React.Fragment key={g.member.code}>
                      <tr className="tcx-grp">
                        <td className="center">
                          <input type="checkbox" checked={allOn} disabled={!readyKeys.length} onChange={() => toggleGroup(g)} />
                        </td>
                        <td colSpan={3}>
                          <div className="tcx-mem">
                            <span className="tcx-mem-name">{g.member.name}</span>
                            <span className="mono tcx-mem-code">{g.member.code}</span>
                            <span className="muted">· {g.member.dept}</span>
                            {g.member.citizenId
                              ? <span className="mono muted">· เลขปชช. {g.member.citizenId}</span>
                              : <span className="chip danger">ไม่มีเลขประจำตัวประชาชน</span>}
                          </div>
                        </td>
                        <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(gInt)}</td>
                        <td colSpan={2} className="muted" style={{ fontSize: 11.5 }}>{g.items.length} สัญญา</td>
                      </tr>
                      {g.items.map(r => (
                        <tr key={r.key} className={sel.has(r.key) ? 'is-selected' : (r.state === 'sent' ? 'tcx-sent' : '')}>
                          <td className="center">
                            <input type="checkbox" checked={sel.has(r.key)} disabled={r.state !== 'ready'} onChange={() => toggle(r)} />
                          </td>
                          <td className="mono" style={{ fontSize: 11.5 }}>{r.contractNo}</td>
                          <td>{r.type}</td>
                          <td>
                            {r.purpose || <span className="muted">— ยังไม่ระบุ —</span>}
                            {r.blockers.length > 0 && (
                              <div className="tcx-blk">{r.blockers.map((b, i) => <span key={i}>· {b}</span>)}</div>
                            )}
                          </td>
                          <td className="right mono">{fmt.money(r.interest)}</td>
                          <td className="mono" style={{ fontSize: 11.5 }}>
                            {r.certNo || <span className="muted">—</span>}
                            {r.issuedAt && <div className="muted" style={{ fontSize: 10.5 }}>ออกเมื่อ {fmt.date(r.issuedAt)}</div>}
                          </td>
                          <td className="center">
                            {r.state === 'sent' ? <span className="pill ok">นำส่งแล้ว{r.taxAt ? '' : ''}</span>
                              : r.state === 'blocked' ? <span className="pill bad">ข้อมูลไม่ครบ</span>
                              : <span className="pill info">พร้อมนำส่ง</span>}
                            {r.state === 'sent' && r.taxAt && <div className="muted mono" style={{ fontSize: 10.5 }}>{fmt.date(r.taxAt)}</div>}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <div className="lt-list-foot muted">
            <Icon name="info" size={12} /> เลือกได้เฉพาะสัญญาที่ “พร้อมนำส่ง” — สัญญาที่ข้อมูลไม่ครบต้องแก้ที่หน้าวัตถุประสงค์การกู้หรือทะเบียนสมาชิกก่อน
            {selRows.length > 0 && <> · เลือกแล้ว {selRows.length} สัญญา / {selMembers} ราย · ดอกเบี้ยรวม {fmt.money(selInterest)} บาท</>}
          </div>
        </div>
      )}

      {phase === 'idle' && (
        <div className="search-card tcx-empty">
          <div className="tcx-empty-ic"><Icon name="report" size={22} /></div>
          <div className="tcx-empty-t">ยังไม่ได้ประมวลผล</div>
          <div className="muted" style={{ fontSize: 12 }}>เลือกปีภาษีและเงื่อนไข แล้วกด “ประมวลผล” เพื่อให้ระบบดึงข้อมูลสมาชิกและสัญญาที่ต้องนำส่งกรมสรรพากร</div>
        </div>
      )}

      {/* ── ประวัติการนำส่ง ── */}
      <div className="detail-section-head" style={{ marginTop: 16 }}>
        <div className="sh-icon"><Icon name="history" /></div>
        <div><div className="sh-title">ประวัติการนำส่งข้อมูลกรมสรรพากร</div></div>
      </div>
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}><div className="table-scroll">
        <table className="tbl" style={{ minWidth: 860 }}>
          <thead><tr>
            <th style={{ width: 130 }}>เลขที่นำส่ง</th><th className="center" style={{ width: 80 }}>ปีภาษี</th>
            <th style={{ minWidth: 220 }}>ช่องทางนำส่ง</th><th className="center" style={{ width: 90 }}>สมาชิก</th>
            <th className="center" style={{ width: 90 }}>สัญญา</th><th className="right" style={{ width: 140 }}>ดอกเบี้ยรวม</th>
            <th style={{ width: 130 }}>วันเวลานำส่ง</th><th className="center" style={{ width: 100 }}>สถานะ</th>
          </tr></thead>
          <tbody>
            {history.map(h => (
              <tr key={h.no}>
                <td className="mono" style={{ fontSize: 11.5 }}>{h.no}</td>
                <td className="center mono">{h.taxYear}</td>
                <td>{h.channel}<div className="muted" style={{ fontSize: 11 }}>ผู้นำส่ง {h.by}</div></td>
                <td className="center mono">{h.members}</td>
                <td className="center mono">{h.contracts}</td>
                <td className="right mono">{fmt.money(h.interest)}</td>
                <td className="mono" style={{ fontSize: 11.5 }}>{h.at}</td>
                <td className="center"><span className="pill ok">สำเร็จ</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      {/* ── Popup ยืนยันการนำส่ง ── */}
      {modal && (
        <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560, maxWidth: '94vw' }}>
            <div className="modal-head">
              <h2>ยืนยันการนำส่งข้อมูลกรมสรรพากร</h2>
              <button className="close-btn" onClick={() => setModal(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                ระบบจะนำส่งข้อมูลดอกเบี้ยเงินกู้ตามหนังสือรับรองที่ออกแล้ว ให้กรมสรรพากร และบันทึกสถานะ “นำส่งแล้ว” ให้สัญญาที่เลือก
              </div>
              <div className="lpc-tax-sum">
                <div><span className="muted">ปีภาษี</span><b className="mono">{year}</b></div>
                <div><span className="muted">จำนวนสมาชิก</span><b className="mono">{selMembers} ราย</b></div>
                <div><span className="muted">จำนวนสัญญา</span><b className="mono">{selRows.length} สัญญา</b></div>
                <div><span className="muted">ดอกเบี้ยรวม</span><b className="mono">{fmt.money(selInterest)} บาท</b></div>
              </div>
              <label className="tcx-fld" style={{ marginTop: 12 }}><span>ช่องทางนำส่ง</span>
                <select className="cfg-input" value={channel} onChange={e => setChannel(e.target.value)}>
                  {(window.LOAN_CERT_TAX_CHANNELS || ['ยื่นผ่านอินเทอร์เน็ต (e-Filing)']).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              {blockedRows.length > 0 && (
                <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
                  <Icon name="info" size={12} /> ยังมี {blockedRows.length} สัญญาที่ข้อมูลไม่ครบและจะไม่ถูกนำส่งในครั้งนี้
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setModal(false)}>ยกเลิก</button>
              <button className="btn primary" onClick={submit}><Icon name="upload" /> ยืนยันนำส่ง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { TaxCertSubmitPage });
