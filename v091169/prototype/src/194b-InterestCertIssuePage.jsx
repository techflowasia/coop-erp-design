// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: ออกหนังสือรับรองดอกเบี้ย (ล.ย.02)
//  ดึงสัญญาจากใบคำขอกู้ที่ติ๊ก “หนังสือรับรองดอกเบี้ย” + ตรวจกับค่าคงที่วัตถุประสงค์การกู้
//  สถานะ: ยังไม่ออก → ออกแล้ว·รอส่งสรรพากร → ส่งสรรพากรแล้ว
//  ออกทั้งชุดหลังสิ้นปีภาษี หรือออกรายสัญญาระหว่างปีเมื่อปิดสัญญา
// ════════════════════════════════════════════════════════════════════
const { useState: icUseState, useMemo: icUseMemo } = React;

const IC_CUR_YEAR = 2569;
const IC_YEARS = [2569, 2568, 2567];

// สัญญาจากใบคำขอกู้ที่ติ๊กหนังสือรับรองดอกเบี้ย · interest = ดอกเบี้ยที่ชำระจริงรายปีภาษี
const IC_SEED = [
  { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3', contract: 'L-2565-00841', project: 'พิเศษเคหะสงเคราะห์ ปี 2565', projectCode: '30 — พิเศษ', contractDate: '2022-03-14',
    principal: 1200000, terms: 359, rate: 5, purposeV: 'house', detail: 'ซื้ออาคารพร้อมที่ดิน',
    interest: { 2567: 52140.00, 2568: 48250.75, 2569: 39880.20 },
    certs: { 2567: { no: 'IC-2567-003960', at: '2025-01-22', by: 'สมหญิง ก.', tax: 'sent', taxAt: '2025-02-08' },
             2568: { no: 'IC-2568-004182', at: '2026-01-18', by: 'สมหญิง ก.', tax: 'sent', taxAt: '2026-02-05' } } },
  { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3', contract: 'L-2566-01120', project: 'พิเศษเคหะสงเคราะห์ ปี 2566', projectCode: '30 — พิเศษ', contractDate: '2023-06-02',
    principal: 350000, terms: 120, rate: 5.25, purposeV: 'house', detail: 'ซ่อมแซม ปรับปรุง ต่อเติม บ้านพักอาศัย',
    interest: { 2567: 15210.00, 2568: 12980.50, 2569: 9420.00 },
    certs: { 2567: { no: 'IC-2567-003961', at: '2025-01-22', by: 'สมหญิง ก.', tax: 'sent', taxAt: '2025-02-08' },
             2568: { no: 'IC-2568-004183', at: '2026-01-18', by: 'สมหญิง ก.', tax: 'wait' } } },
  { code: 'M-066238', name: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์', citizenId: '1-1018-00712-90-4', contract: 'L-2564-00620', project: 'พิเศษเคหะสงเคราะห์ ปี 2564', projectCode: '30 — พิเศษ', contractDate: '2021-09-20',
    principal: 1800000, terms: 300, rate: 5, purposeV: 'house', detail: 'ปลูกสร้างอาคารบนที่ดินของตนเอง',
    interest: { 2567: 74980.00, 2568: 71420.00, 2569: 60110.40 }, certs: {} },
  { code: 'M-065471', name: 'นายประเสริฐ มั่นคงดี', citizenId: '3-1006-00189-44-1', contract: 'L-2563-00318', project: 'พิเศษเคหะสงเคราะห์ (อัตราดอกเบี้ยพิเศษ) ปี 2563', projectCode: '30 — พิเศษ', contractDate: '2020-11-05',
    principal: 2400000, terms: 359, rate: 4.75, purposeV: 'redeem', detail: 'ไถ่ถอนจำนองที่ดินพร้อมบ้านพักอาศัย',
    interest: { 2567: 99870.00, 2568: 96310.25, 2569: 41250.00 }, closedAt: '2026-07-31',
    certs: { 2567: { no: 'IC-2567-003972', at: '2025-01-23', by: 'สมหญิง ก.', tax: 'sent', taxAt: '2025-02-08' } } },
  { code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', citizenId: '3-1012-00455-62-0', contract: 'L-2565-00733', project: 'พิเศษเคหะสงเคราะห์ ปี 2565', projectCode: '30 — พิเศษ', contractDate: '2022-05-18',
    principal: 1500000, terms: 300, rate: 5, purposeV: 'house', detail: 'ซื้อที่ดินพร้อมปลูกสร้างบ้าน',
    interest: { 2567: 61200.00, 2568: 58940.10, 2569: 47300.00 }, certs: {} },
  { code: 'M-058247', name: 'นางสาวกานต์ ศิริวงศ์', citizenId: '1-1099-00344-08-2', contract: 'L-2567-01188', project: 'สามัญเพื่อที่อยู่อาศัย ปี 2567', projectCode: '20 — สามัญปกติ', contractDate: '2024-02-09',
    principal: 650000, terms: 240, rate: 5.25, purposeV: 'house', detail: 'เช่าซื้ออาคารพร้อมที่ดิน',
    interest: { 2567: 19800.00, 2568: 21760.00, 2569: 18120.00 }, certs: {} },
  { code: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', citizenId: '3-1044-00611-77-5', contract: 'L-2562-00204', project: 'พิเศษเคหะสงเคราะห์ ปี 2562', projectCode: '30 — พิเศษ', contractDate: '2019-08-01',
    principal: 2800000, terms: 359, rate: 4.75, purposeV: 'house', detail: 'ซื้ออาคารพร้อมที่ดิน',
    interest: { 2567: 108400.00, 2568: 104270.85, 2569: 86900.00 }, certs: {} },
  { code: 'M-058250', name: 'นายธีรพงษ์ ขำเพชร', citizenId: '3-1044-00611-77-5', contract: 'L-2568-01655', project: 'สามัญเพื่อที่อยู่อาศัย ปี 2568', projectCode: '20 — สามัญปกติ', contractDate: '2025-04-11',
    principal: 180000, terms: 60, rate: 5.5, purposeV: 'house', detail: 'ซื้อห้องชุดในอาคารชุด',
    interest: { 2568: 5210.30, 2569: 6840.00 }, certs: {} },
  { code: 'M-058252', name: 'นางสาวจุฬาลักษณ์ ทองดี', citizenId: '1-1077-00458-19-3', contract: 'L-2566-01033', project: 'สามัญเพื่อที่อยู่อาศัย ปี 2566', projectCode: '20 — สามัญปกติ', contractDate: '2023-10-16',
    principal: 900000, terms: 300, rate: 5, purposeV: 'house', detail: 'ปลูกสร้างอาคารบนที่ดินเช่า',
    interest: { 2567: 0, 2568: 27505.60, 2569: 22410.00 }, certs: {} },
  { code: 'M-067012', name: 'นายวิรัตน์ ทองสุข', citizenId: '3-1020-00457-12-8', contract: 'L-2567-01402', project: 'พิเศษยานพาหนะ ปี 2567', projectCode: '30 — พิเศษ', contractDate: '2024-07-03',
    principal: 420000, terms: 180, rate: 5.5, purposeV: 'vehicle', detail: '',
    interest: { 2567: 9120.00, 2568: 8640.00, 2569: 6900.00 }, certs: {} },
];

const IC_STATES = [
  { v: 'all',  l: 'ทั้งหมด' },
  { v: 'none', l: 'ยังไม่ออก' },
  { v: 'wait', l: 'ออกแล้ว · รอส่งสรรพากร' },
  { v: 'sent', l: 'ส่งสรรพากรแล้ว' },
];
const IC_CB = { accentColor: 'var(--primary)' };

function icPurpose(v) {
  const list = window.lpuLoad ? window.lpuLoad() : [];
  return list.find(r => r.v === v) || null;
}

function icBuildRows(data, year) {
  const yearEndISO = `${year - 543}-12-31`;
  const yearStartISO = `${year - 543}-01-01`;
  return data.filter(c => c.interest[year] !== undefined).map(c => {
    const p = icPurpose(c.purposeV);
    const cert = c.certs[year] || null;
    const closedInYear = c.closedAt && c.closedAt >= yearStartISO && c.closedAt <= yearEndISO;
    const block = [];
    const info = [];
    if (!p || !p.taxCert) block.push(`วัตถุประสงค์ “${p ? p.name : c.purposeV}” ไม่อยู่ในกลุ่มที่ออกหนังสือรับรองได้`);
    if (!(c.interest[year] > 0)) block.push('ไม่มีดอกเบี้ยที่ชำระในปีภาษีนี้');
    if (year === IC_CUR_YEAR && !closedInYear) block.push('ปีภาษียังไม่สิ้นสุด — ออกระหว่างปีได้เฉพาะสัญญาที่ปิดแล้ว');
    if (closedInYear) info.push(`ปิดสัญญาเมื่อ ${window.fmt.date(c.closedAt)} — รับรองดอกเบี้ยถึงวันปิดสัญญา`);
    return {
      key: c.contract + '|' + year, src: c, year, purpose: p, cert,
      interest: c.interest[year] || 0,
      state: cert ? cert.tax : 'none',
      block: cert ? [] : block, info,
    };
  });
}

function InterestCertIssuePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const fmt = window.fmt;
  const workDate = window.DEPOSIT_WORKING_DATE;
  const [data, setData] = icUseState(() => IC_SEED.map(c => ({ ...c, certs: { ...c.certs } })));
  const [year, setYear] = icUseState(2568);
  const [q, setQ] = icUseState('');
  const [applied, setApplied] = icUseState({ year: 2568, q: '' });
  const [stateF, setStateF] = icUseState('all');
  const [sel, setSel] = icUseState(() => new Set());
  const [confirm, setConfirm] = icUseState(false);
  const [printCerts, setPrintCerts] = icUseState(null);
  const [okMsg, setOkMsg] = icUseState(null);

  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ออกหนังสือรับรองดอกเบี้ย', current: true }], []);

  const all = icUseMemo(() => icBuildRows(data, applied.year), [data, applied.year]);
  const searched = icUseMemo(() => {
    const k = applied.q.trim().toLowerCase();
    return k ? all.filter(r => [r.src.code, r.src.contract].some(s => s.toLowerCase().includes(k))) : all;
  }, [all, applied.q]);
  const counts = icUseMemo(() => ({
    all: searched.length,
    none: searched.filter(r => r.state === 'none').length,
    wait: searched.filter(r => r.state === 'wait').length,
    sent: searched.filter(r => r.state === 'sent').length,
  }), [searched]);
  const rows = stateF === 'all' ? searched : searched.filter(r => r.state === stateF);

  const selectable = (r) => r.state !== 'none' || r.block.length === 0;
  const selRows = rows.filter(r => sel.has(r.key));
  const toIssue = selRows.filter(r => r.state === 'none' && r.block.length === 0);
  const toPrint = selRows.filter(r => r.state !== 'none');
  const issueTotal = toIssue.reduce((s, r) => s + r.interest, 0);

  const doSearch = () => { setApplied({ year, q }); setSel(new Set()); };
  const doReset = () => { setYear(2568); setQ(''); setStateF('all'); setApplied({ year: 2568, q: '' }); setSel(new Set()); };

  const toggle = (r) => { if (!selectable(r)) return; setSel(s => { const n = new Set(s); n.has(r.key) ? n.delete(r.key) : n.add(r.key); return n; }); };
  const selKeys = rows.filter(selectable).map(r => r.key);
  const allOn = selKeys.length > 0 && selKeys.every(k => sel.has(k));
  const toggleAll = () => setSel(allOn ? new Set() : new Set(selKeys));

  const toCert = (r) => {
    const c = r.src;
    const cert = r.cert || c.certs[r.year];
    return {
      memberName: c.name, citizenId: c.citizenId, memberTaxId: '',
      address: window.lmMemberAddress ? window.lmMemberAddress(c.code) : '',
      contract: c.contract, contractDate: window.lyThaiLongDate(c.contractDate),
      principal: fmt.money(c.principal, 2), terms: c.terms + ' งวด', rate: c.rate + '%',
      mortgageTerms: c.terms + ' งวด', purpose: c.detail || (r.purpose ? r.purpose.name : ''),
      periodLabel: 'ประจำปี พ.ศ.', periodValue: String(r.year),
      interestText: fmt.money(r.interest, 2),
      issuedText: cert ? window.lyThaiLongDate(cert.at) : '',
    };
  };

  const issue = () => {
    const seqBase = 4300 + data.reduce((n, c) => n + Object.keys(c.certs).length, 0);
    const at = workDate || new Date().toISOString().slice(0, 10);
    const map = new Map(toIssue.map((r, i) => [r.src.contract, `IC-${r.year}-${String(seqBase + i + 1).padStart(6, '0')}`]));
    const yr = toIssue[0].year;
    setData(d => d.map(c => map.has(c.contract)
      ? { ...c, certs: { ...c.certs, [yr]: { no: map.get(c.contract), at, by: 'สมหญิง ก.', tax: 'wait' } } } : c));
    audit.log && audit.log({ action: 'create', module: 'ระบบสินเชื่อ — ออกหนังสือรับรองดอกเบี้ย',
      target: `ปีภาษี ${yr}`, summary: `ออกหนังสือรับรองดอกเบี้ย ${toIssue.length} ฉบับ · ดอกเบี้ยรวม ${fmt.money(issueTotal, 2)} บาท` });
    setOkMsg({ title: 'ออกหนังสือรับรองเรียบร้อยแล้ว',
      detail: `ออกหนังสือรับรองดอกเบี้ย ปีภาษี ${yr} จำนวน ${toIssue.length} ฉบับ — สถานะ “รอส่งสรรพากร” พร้อมพิมพ์และนำส่งที่เมนูส่งข้อมูลให้สรรพากร` });
    setConfirm(false);
    setSel(new Set());
  };

  const pill = (r) => r.state === 'sent' ? <span className="pill ok">ส่งแล้ว {r.cert.taxAt ? fmt.date(r.cert.taxAt) : ''}</span>
    : r.state === 'wait' ? <span className="pill info">รอส่งสรรพากร</span>
    : r.block.length ? <span className="pill">ออกไม่ได้</span>
    : <span className="pill warn">ยังไม่ออก</span>;

  const G = '#237450', SOFT = '#eafef2', LINE = '#f0f0f0';
  return (
    <div data-screen-label="ออกหนังสือรับรองดอกเบี้ย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ออกหนังสือรับรองดอกเบี้ย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ออกหนังสือรับรองดอกเบี้ยเงินกู้ยืม (ล.ย.02) ให้สัญญาที่ติ๊ก “หนังสือรับรองดอกเบี้ย” ในใบคำขอกู้ และวัตถุประสงค์การกู้ออกหนังสือรับรองได้
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, padding: '14px 16px 12px' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 1 320px', minWidth: 220 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', lineHeight: 1.2 }}>ค้นหา</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 2 }}>
              <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.35)' }}><Icon name="search" size={14} /></span>
              <input value={q} placeholder="เลขที่สัญญา / เลขสมาชิก" onChange={e => setQ(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && doSearch()}
                     style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent' }} />
            </label>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', lineHeight: 1.2 }}>ปีภาษี</span>
            <select className="cfg-input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 200 }}>
              {IC_YEARS.map(y => <option key={y} value={y}>{y}{y === IC_CUR_YEAR ? ' (ปีปัจจุบัน)' : ''}</option>)}
            </select>
          </span>
          <span style={{ flex: '1 1 auto' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button className="btn primary" onClick={doSearch}>ค้นหา</button>
            <button className="btn" onClick={doReset}>รีเซ็ต</button>
          </span>
        </div>
        {applied.year === IC_CUR_YEAR && (
          <div className="muted" style={{ fontSize: 12, padding: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="info" size={12} /> ปีภาษี {IC_CUR_YEAR} ยังไม่สิ้นสุด — ออกหนังสือได้เฉพาะสัญญาที่ปิดระหว่างปี (เช่น ปิดสัญญา/ไถ่ถอนไปสถาบันการเงินอื่น)
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 16px', borderBottom: '1px solid ' + LINE, flexWrap: 'wrap' }}>
          {IC_STATES.map(s => {
            const on = stateF === s.v;
            return (
              <button key={s.v} type="button" onClick={() => { setStateF(s.v); setSel(new Set()); }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 42, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: on ? 600 : 500, whiteSpace: 'nowrap', color: on ? G : 'rgba(0,0,0,.65)', borderBottom: '2px solid ' + (on ? G : 'transparent'), marginBottom: -1 }}>
                <span>{s.l}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, padding: '0 6px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: on ? SOFT : '#f5f5f5', color: on ? G : 'rgba(0,0,0,.45)' }}>{counts[s.v]}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 0', flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 12 }}>
            {selRows.length ? <>เลือก <b style={{ color: 'var(--text)' }}>{selRows.length}</b> รายการ</> : 'ยังไม่ได้เลือกรายการ'}
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm" disabled={!toPrint.length} onClick={() => setPrintCerts(toPrint.map(toCert))}>
            <Icon name="print" /> พิมพ์เอกสาร{toPrint.length ? ` (${toPrint.length})` : ''}
          </button>
          <button className="btn primary sm" disabled={!toIssue.length} onClick={() => setConfirm(true)}>
            <Icon name="check" /> ออกหนังสือรับรอง{toIssue.length ? ` (${toIssue.length})` : ''}
          </button>
        </div>

        <div style={{ padding: '12px 16px 0' }}>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1280 }}>
            <thead><tr>
              <th className="center" style={{ width: 40 }}>
                <input type="checkbox" style={IC_CB} checked={allOn} disabled={!selKeys.length} onChange={toggleAll} aria-label="เลือกทั้งหมด" />
              </th>
              <th style={{ width: 130 }}>เลขที่สัญญา</th>
              <th style={{ minWidth: 190 }}>สมาชิก</th>
              <th style={{ minWidth: 230 }}>โครงการเงินกู้</th>
              <th style={{ minWidth: 230 }}>วัตถุประสงค์การกู้</th>
              <th className="right" style={{ width: 130 }}>ดอกเบี้ยที่ชำระ</th>
              <th style={{ width: 150 }}>เลขที่หนังสือ</th>
              <th className="center" style={{ width: 150 }}>สถานะ</th>
              <th className="center" style={{ width: 130 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} className="center muted" style={{ padding: 28 }}>ไม่พบข้อมูล</td></tr>}
              {rows.map(r => (
                <tr key={r.key} className={sel.has(r.key) ? 'is-selected' : ''}>
                  <td className="center">
                    <input type="checkbox" style={IC_CB} checked={sel.has(r.key)} disabled={!selectable(r)} onChange={() => toggle(r)} aria-label="เลือกรายการ" />
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.src.contract}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.src.name}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>{r.src.code}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.src.project || '—'}</div>
                    {r.src.projectCode && <div className="muted" style={{ fontSize: 11 }}>{r.src.projectCode}</div>}
                  </td>
                  <td>
                    <div>{r.purpose ? r.purpose.name : '—'}</div>
                    {r.src.detail && <div className="muted" style={{ fontSize: 11 }}>{r.src.detail}</div>}
                    {r.block.map((b, i) => <div key={i} style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>· {b}</div>)}
                    {r.info.map((b, i) => <div key={i} style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>· {b}</div>)}
                  </td>
                  <td className="right mono">{fmt.money(r.interest, 2)}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {r.cert ? r.cert.no : <span className="muted">—</span>}
                    {r.cert && <div className="muted" style={{ fontSize: 10.5 }}>ออกเมื่อ {fmt.date(r.cert.at)}</div>}
                  </td>
                  <td className="center">{pill(r)}</td>
                  <td className="center">
                    {r.cert
                      ? <button className="btn sm" onClick={() => setPrintCerts([toCert(r)])}><Icon name="print" /> พิมพ์เอกสาร</button>
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        </div>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="info" size={12} /> หนังสือที่ออกแล้วจะมีสถานะ “รอส่งสรรพากร” จนกว่าจะนำส่งที่เมนู ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร · วัตถุประสงค์ที่ออกหนังสือได้ ตั้งค่าที่ ค่าคงที่วัตถุประสงค์การกู้
      </div>

      {confirm && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirm(false)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
            <div className="modal-head">
              <div className="modal-warnico"><Icon name="info" /></div>
              <h2>ยืนยันการออกหนังสือรับรอง</h2>
              <button className="close-btn" onClick={() => setConfirm(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <div className="dv-confirm-info">
                <div className="dv-ci-row"><span>ปีภาษี</span><b className="mono">{applied.year}</b></div>
                <div className="dv-ci-row"><span>จำนวนหนังสือ</span><b className="mono">{toIssue.length} ฉบับ</b></div>
                <div className="dv-ci-row"><span>ดอกเบี้ยรวม</span><b className="mono">{fmt.money(issueTotal, 2)} บาท</b></div>
                <div className="dv-ci-row"><span>วันที่ออก</span><b className="mono">{fmt.date(workDate)}</b></div>
              </div>
              <p className="muted" style={{ margin: '12px 0 16px', fontSize: 12, lineHeight: 1.5 }}>
                ระบบจะออกเลขที่หนังสือรับรองให้แต่ละสัญญา และบันทึกใน Audit Trail — ตรวจสอบรายการให้ถูกต้องก่อนกดตกลง
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirm(false)}>ยกเลิก</button>
                <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={issue}><Icon name="check" /> ตกลง</button>
              </div>
            </div>
          </div>
        </>
      )}

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail} onClose={() => setOkMsg(null)} />
      )}
      {printCerts && <LoanCertPrintOverlay certs={printCerts} onClose={() => setPrintCerts(null)} />}
    </div>
  );
}

Object.assign(window, { InterestCertIssuePage });
