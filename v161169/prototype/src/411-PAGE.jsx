// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › รับชำระแบบกลุ่ม — เวอร์ชันปรับปรุง (override 364)
//  · วันที่ทำรายการ: ปฏิทินไทย วว/ดด/ปปปป
//  · ช่วงข้อมูล: ตามทะเบียนสมาชิก / สังกัดสมาชิก / สังกัดตัวแทน / หุ้นพูลทวี
//  · ตารางทั้งสองฝั่ง: การ์ดหัวข้อแบบเดียวกับรายการรับ–จ่ายจากระบบอื่น
//  · ค้นหาใช้ได้ทั้งสองตาราง · คอลัมน์ sort ได้ · คลิกหัวคอลัมน์ “ยอดคงเหลือ” เพื่อเรียงมาก–น้อย · แสดง 20 ลำดับต่อหน้า
// ════════════════════════════════════════════════════════════════════
(function () {
const { useState: abrUseState, useMemo: abrUseMemo } = React;
const PAGE = 20;

const ABR_TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const ABR_TH_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function isoToDmy(iso) {
  const p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  return p[2] + '/' + p[1] + '/' + (parseInt(p[0], 10) + 543);
}
function dmyToIso(s) {
  const d = String(s || '').replace(/[^0-9]/g, '');
  if (d.length < 8) return null;
  let year = parseInt(d.slice(4, 8), 10);
  if (year > 2400) year -= 543;
  return year + '-' + d.slice(2, 4) + '-' + d.slice(0, 2);
}

function AbrDate({ value, onChange }) {
  const [txt, setTxt] = abrUseState(isoToDmy(value));
  const [open, setOpen] = abrUseState(false);
  const base = abrUseMemo(() => {
    const p = String(value || '').split('-');
    return p.length === 3 ? new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])) : new Date();
  }, [value]);
  const [view, setView] = abrUseState({ y: base.getFullYear(), m: base.getMonth() });
  const wrapRef = React.useRef(null);

  React.useEffect(() => { setTxt(isoToDmy(value)); }, [value]);
  React.useEffect(() => { setView({ y: base.getFullYear(), m: base.getMonth() }); }, [base]);
  React.useEffect(() => {
    if (!open) return;
    const off = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);

  const handle = (raw) => {
    const d = raw.replace(/[^0-9]/g, '').slice(0, 8);
    let out = d;
    if (d.length > 4) out = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    else if (d.length > 2) out = d.slice(0, 2) + '/' + d.slice(2);
    setTxt(out);
    const iso = dmyToIso(out);
    if (iso) onChange(iso);
  };
  const pick = (day) => {
    onChange(view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'));
    setOpen(false);
  };
  const shift = (n) => setView(v => {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const selIso = String(value || '');

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input className="cfg-input mono" value={txt} placeholder="วว/ดด/ปปปป" inputMode="numeric"
        style={{ width: '100%', paddingRight: 34 }} onChange={e => handle(e.target.value)} />
      <button type="button" title="เลือกวันที่" onClick={() => setOpen(o => !o)}
        style={{
          position: 'absolute', right: 1, bottom: 1, height: 'calc(100% - 2px)', width: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0,
          background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 0,
        }}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.5" y="3" width="13" height="12" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1.5 6.4h13" stroke="currentColor" strokeWidth="2.2" />
          <path d="M4.8 1.4v3M11.2 1.4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0, width: 268,
          background: '#fff', border: '1px solid var(--line, #d9d9d9)', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,.14)', padding: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ABR_TH_MONTHS[view.m]} {view.y + 543}</div>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn sm" style={{ padding: '0 8px' }} onClick={() => shift(-1)}>‹</button>
            <button type="button" className="btn sm" style={{ padding: '0 8px', marginLeft: 4 }} onClick={() => shift(1)}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 2 }}>
            {ABR_TH_DOW.map(d => <div key={d} style={{ padding: '2px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
            {cells.map((d, i) => {
              if (!d) return <div key={'e' + i} />;
              const iso = view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
              const on = iso === selIso;
              return (
                <button key={d} type="button" onClick={() => pick(d)}
                  style={{
                    height: 30, border: on ? '1px solid var(--brand-700)' : '1px solid transparent',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: on ? 'var(--brand-700)' : 'transparent',
                    color: on ? '#fff' : 'inherit', fontWeight: on ? 700 : 400,
                  }}>{d}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--divider)' }}>
            <button type="button" className="btn sm" onClick={() => { onChange(''); setTxt(''); setOpen(false); }}>ล้าง</button>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn sm primary" onClick={() => {
              const n = new Date();
              onChange(n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'));
              setOpen(false);
            }}>วันนี้</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AbrField({ label, children, hint }) {
  return (
    <label className="ap-field">
      <span className="ap-label">{label}{hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>{hint}</span>}</span>
      {children}
    </label>
  );
}

const ABR_COLS = [
  { key: 'reg', label: 'ทะเบียน', width: 92 },
  { key: 'name', label: 'ชื่อ – สกุล', minWidth: 190 },
  { key: 'memberDeptCode', label: 'สังกัดสมาชิก', width: 110, align: 'center' },
  { key: 'agentDeptCode', label: 'สังกัดตัวแทน', width: 108, align: 'center' },
  { key: 'agentAmt', label: 'ยอดตัวแทน', width: 120, align: 'right', num: true },
  { key: 'remaining', label: 'ยอดคงเหลือ', width: 120, align: 'right', num: true },
  { key: 'pay', label: 'ยอดชำระ', width: 132, align: 'right', num: true },
];

function AbrTable({ rows, editable, onToggle, onToggleAll, onPay, emptyText, minWidth, page, onPage, sortDir, onSort }) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const cur = Math.min(page || 1, pages);
  const shown = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const allChecked = shown.length > 0 && shown.every(r => r.checked);
  const selCount = rows.filter(r => r.checked).length;
  const totAgent = rows.reduce((s, r) => s + r.agentAmt, 0);
  const totRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const totPay = rows.reduce((s, r) => s + (Number(r.pay) || 0), 0);

  const th = (c) => {
    if (c.key !== 'remaining') {
      return (
        <th key={c.key} className={c.align === 'center' ? 'center' : c.align === 'right' ? 'right' : ''}
          style={{ width: c.width, minWidth: c.minWidth, whiteSpace: 'nowrap' }}>{c.label}</th>
      );
    }
    return (
      <th key={c.key} className="right" title="คลิกเพื่อเรียงยอดคงเหลือ"
        style={{ width: c.width, whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
        onClick={onSort}>
        {c.label}
        <span style={{ marginLeft: 4, fontSize: 10, opacity: sortDir ? 1 : .3 }}>
          {sortDir === 'asc' ? '▲' : '▼'}
        </span>
      </th>
    );
  };

  return (
    <React.Fragment>
      <div className="table-wrap" style={{ border: 0 }}>
        <table className="tbl" style={{ minWidth: minWidth || 960 }}>
          <thead><tr>
            <th className="center" style={{ width: 40 }}>
              <input type="checkbox" className="ct-check" checked={!!allChecked} disabled={shown.length === 0}
                onChange={e => onToggleAll(e.target.checked, shown)} />
            </th>
            {ABR_COLS.map(th)}
          </tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 26 }}>{emptyText}</td></tr>}
            {shown.map(r => {
              const over = (Number(r.pay) || 0) - r.remaining > 0.005;
              return (
                <tr key={r.reg} className={r.checked ? 'selected' : ''}>
                  <td className="center"><input type="checkbox" className="ct-check" checked={!!r.checked}
                    onChange={e => onToggle(r.reg, e.target.checked)} /></td>
                  <td className="mono">{r.reg}</td>
                  <td>{r.name}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.memberDeptCode}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.agentDeptCode}</td>
                  <td className="right mono">{window.fmt.money(r.agentAmt, 2)}</td>
                  <td className="right mono">{window.fmt.money(r.remaining, 2)}</td>
                  <td className="right">
                    {editable ? (
                      <input className="cfg-input mono num" type="number" step="0.01" min="0" value={r.pay}
                        style={{ height: 30, textAlign: 'right', maxWidth: 112, color: over ? 'var(--danger)' : undefined }}
                        onChange={e => onPay(r.reg, e.target.value)} />
                    ) : (
                      <span className="mono" style={{ fontWeight: 600, color: (Number(r.pay) || 0) > 0 ? 'var(--brand-700)' : undefined }}>
                        {window.fmt.money(Number(r.pay) || 0, 2)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {total > 0 && (
            <tfoot><tr className="vch-foot">
              <td colSpan={5} className="right">รวม ({selCount} เลือก / {total} ราย)</td>
              <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totAgent, 2)}</td>
              <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(totRemaining, 2)}</td>
              <td className="right mono" style={{ fontWeight: 700, color: 'var(--brand-700)' }}>{window.fmt.money(totPay, 2)}</td>
            </tr></tfoot>
          )}
        </table>
      </div>
      {total > PAGE && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 2px 0', borderTop: '1px solid var(--divider)', marginTop: 10 }}>
          <span className="muted" style={{ fontSize: 12 }}>
            แสดง {(cur - 1) * PAGE + 1}–{Math.min(cur * PAGE, total)} จาก {total} ราย
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn sm" disabled={cur === 1} onClick={() => onPage(cur - 1)}>ก่อนหน้า</button>
          <span className="muted" style={{ fontSize: 12 }}>หน้า {cur} / {pages}</span>
          <button className="btn sm" disabled={cur === pages} onClick={() => onPage(cur + 1)}>ถัดไป</button>
        </div>
      )}
    </React.Fragment>
  );
}

function AgentBatchReceivePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'รับชำระแบบกลุ่ม', current: true }], []);

  const slipId = React.useRef(window.abrNextSlip()).current;
  const [year, setYear] = abrUseState('2569');
  const [month, setMonth] = abrUseState('07');
  const [txnDate, setTxnDate] = abrUseState(window.abrToday());
  const [rangeMode, setRangeMode] = abrUseState('member');
  const [rangeText, setRangeText] = abrUseState('');
  const [payType, setPayType] = abrUseState('');
  const [payDetail, setPayDetail] = abrUseState('');
  const [query, setQuery] = abrUseState('');
  const [applied, setApplied] = abrUseState('');
  const [queryB, setQueryB] = abrUseState('');
  const [appliedB, setAppliedB] = abrUseState('');
  const [avail, setAvail] = abrUseState(null);
  const [batch, setBatch] = abrUseState([]);
  const [pageA, setPageA] = abrUseState(1);
  const [pageB, setPageB] = abrUseState(1);
  const [sortA, setSortA] = abrUseState(null);
  const [sortB, setSortB] = abrUseState(null);

  const period = `${year}${month}`;
  const RANGE_MODES = [
    { v: 'member', l: 'ตามทะเบียนสมาชิก', ph: 'เช่น 00123, 00450 - 00470' },
    { v: 'memberDept', l: 'ตามสังกัดสมาชิก', ph: 'เช่น 110, 120, 140 - 150' },
    { v: 'agentDept', l: 'ตามสังกัดตัวแทน', ph: 'เช่น 0107 หรือ 0106 - 0108' },
    { v: 'poolShare', l: 'หุ้นพูลทวี', ph: 'ระบุเลขที่สัญญาหุ้นพูลทวี' },
  ];
  const curMode = RANGE_MODES.find(m => m.v === rangeMode) || RANGE_MODES[0];

  const pull = () => {
    const found = window.abrPull(rangeText.trim() ? 'range' : 'all', rangeText);
    if (found.length === 0) { onToast && onToast('ไม่พบข้อมูลตามช่วงที่ระบุ'); return; }
    setAvail(found.map(r => ({ ...r, checked: false, pay: 0 })));
    setBatch([]); setQuery(''); setApplied(''); setQueryB(''); setAppliedB(''); setPageA(1); setPageB(1);
    onToast && onToast(`ดึงข้อมูลรับชำระลูกหนี้ตัวแทน งวด ${period} (${curMode.l}) — ${found.length} ราย`);
  };

  const matchWith = (q) => (r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (r.reg + ' ' + r.name + ' ' + r.memberDeptCode + ' ' + r.agentDeptCode).toLowerCase().includes(s);
  };
  const matches = matchWith(applied);

  const byRemaining = (dir) => (a, b) => (a.remaining - b.remaining) * (dir === 'asc' ? 1 : -1);
  const availView = abrUseMemo(() => {
    const rs = !avail ? [] : avail.filter(matches);
    return sortA ? [...rs].sort(byRemaining(sortA)) : rs;
  }, [avail, applied, sortA]);
  const batchView = abrUseMemo(() => {
    const rs = batch.filter(matchWith(appliedB));
    return sortB ? [...rs].sort(byRemaining(sortB)) : rs;
  }, [batch, appliedB, sortB]);
  const flip = (set) => () => set(d => d === 'desc' ? 'asc' : 'desc');

  const toggleAvail = (reg, v) => setAvail(rs => rs.map(r => r.reg === reg ? { ...r, checked: v } : r));
  const toggleAvailAll = (v, shown) => setAvail(rs => rs.map(r => shown.some(f => f.reg === r.reg) ? { ...r, checked: v } : r));
  const payAvail = (reg, v) => setAvail(rs => rs.map(r => r.reg === reg ? { ...r, pay: v } : r));
  const toggleBatch = (reg, v) => setBatch(rs => rs.map(r => r.reg === reg ? { ...r, checked: v } : r));
  const toggleBatchAll = (v, shown) => setBatch(rs => rs.map(r => shown.some(f => f.reg === r.reg) ? { ...r, checked: v } : r));
  const payBatch = (reg, v) => setBatch(rs => rs.map(r => r.reg === reg ? { ...r, pay: v } : r));

  const moveIn = () => {
    const picked = (avail || []).filter(r => r.checked);
    if (picked.length === 0) { onToast && onToast('กรุณาเลือกรายการที่ต้องการนำเข้าอย่างน้อย 1 ราย'); return; }
    const moved = picked.map(r => ({ ...r, checked: false, pay: (Number(r.pay) || 0) > 0 ? r.pay : r.remaining }));
    setBatch(b => [...b, ...moved]);
    setAvail(rs => rs.filter(r => !r.checked));
    onToast && onToast(`นำเข้า ${picked.length} ราย เข้ารายการที่จะรับชำระ`);
  };
  const moveOut = () => {
    const picked = batch.filter(r => r.checked);
    if (picked.length === 0) { onToast && onToast('กรุณาเลือกรายการที่ต้องการนำออกอย่างน้อย 1 ราย'); return; }
    const moved = picked.map(r => ({ ...r, checked: false }));
    setAvail(rs => [...(rs || []), ...moved]);
    setBatch(b => b.filter(r => !r.checked));
    onToast && onToast(`นำออก ${picked.length} ราย กลับไปยังรายการที่ดึงมา`);
  };

  const batchPayTotal = abrUseMemo(() => batch.reduce((s, r) => s + (Number(r.pay) || 0), 0), [batch]);
  const overpay = batch.some(r => (Number(r.pay) || 0) - r.remaining > 0.005);
  const canSave = batch.length > 0 && batchPayTotal > 0 && !overpay && !!payType;

  const save = () => {
    if (batch.length === 0) { onToast && onToast('ยังไม่มีรายการที่จะรับชำระ — กรุณานำเข้ารายการก่อน'); return; }
    if (!payType) { onToast && onToast('กรุณาเลือกประเภทเงินที่รับชำระ'); return; }
    if (overpay) { onToast && onToast('ยอดชำระบางรายเกินยอดคงเหลือ — กรุณาตรวจสอบ'); return; }
    if (batchPayTotal <= 0) { onToast && onToast('กรุณาระบุยอดชำระ'); return; }
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — รับชำระแบบกลุ่ม',
      target: `${slipId} งวด ${period}`,
      summary: `รับชำระลูกหนี้ตัวแทนแบบกลุ่ม ${batch.length} ราย รวม ${window.fmt.money(batchPayTotal, 2)} บาท (${window.abrPayLabel(payType)})`,
    });
    onToast && onToast(`บันทึกรับชำระแบบกลุ่ม ${slipId} — ${batch.length} ราย รวม ${window.fmt.money(batchPayTotal, 2)} บาท เรียบร้อย`);
    setBatch([]); setAvail(null); setQuery(''); setApplied('');
  };

  return (
    <div data-screen-label="หน้ารับชำระแบบกลุ่ม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับชำระแบบกลุ่ม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ดึงรายการลูกหนี้ตัวแทนตามเงื่อนไขเป็นชุด เลือกและระบุยอดชำระ นำเข้าเป็นรายการที่จะรับชำระ แล้วบันทึกรับชำระเป็นกลุ่ม
          </div>
        </div>
        <span className="spacer" />
        <span className="mono muted" style={{ fontSize: 12 }}>ใบทำรายการ {slipId}</span>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เงื่อนไขการดึงข้อมูลรับชำระลูกหนี้ตัวแทน</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AbrField label="ประจำปี">
            <input className="cfg-input mono" value={year} maxLength={4}
              onChange={e => { setYear(e.target.value.replace(/\D/g, '').slice(0, 4)); setAvail(null); setBatch([]); }} />
          </AbrField>
          <AbrField label="ประจำเดือน">
            <select className="cfg-input" value={month} onChange={e => { setMonth(e.target.value); setAvail(null); setBatch([]); }}>
              {window.ABR_MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </AbrField>
          <AbrField label="วันที่ทำรายการ">
            <ThaiDateField value={txnDate} onChange={setTxnDate} />
          </AbrField>

          <AbrField label="ช่วงข้อมูล">
            <select className="cfg-input" value={rangeMode}
              onChange={e => { setRangeMode(e.target.value); setRangeText(''); setAvail(null); setBatch([]); }}>
              {RANGE_MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </AbrField>
          <AbrField label="ระบุช่วงข้อมูล">
            <input className="cfg-input mono" value={rangeText} placeholder={curMode.ph}
              onChange={e => setRangeText(e.target.value)} />
          </AbrField>
          <div className="ap-field" style={{ justifyContent: 'flex-end' }}>
            <button className="btn primary block" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
          </div>
        </div>
        <div className="ap-hint muted">
          <Icon name="info" size={13} /> ใส่ข้อมูลหรือช่วงข้อมูลที่ต้องการประมวลผลและคั่นด้วยเครื่องหมาย , หรือ - เช่น 110, 120, 140 - 150 · เว้นว่างเพื่อดึงทั้งหมด
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ประเภทการชำระ</h3></div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: '220px 1fr' }}>
          <AbrField label="ประเภทเงิน">
            <select className="cfg-input" value={payType} onChange={e => setPayType(e.target.value)}>
              {window.ABR_PAY_TYPES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </AbrField>
          <AbrField label="รายละเอียดการชำระ">
            <input className="cfg-input" value={payDetail} placeholder="เช่น เลขที่เช็ค / บัญชีที่โอน / อ้างอิงการนำส่ง"
              onChange={e => setPayDetail(e.target.value)} />
          </AbrField>
        </div>
      </div>

      {/* ── รายการที่ดึงมา ── */}
      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="head-bar" /><h3>รายการลูกหนี้ตัวแทนที่ดึงมา</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <input className="cfg-input" value={query} style={{ width: 260 }}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setApplied(query); setPageA(1); setPageB(1); } }}
              placeholder="ค้นหาทะเบียน / ชื่อ / สังกัด…" />
            <button className="btn sm" onClick={() => { setApplied(query); setPageA(1); setPageB(1); }}>ค้น</button>
            {applied && <button className="btn text sm" onClick={() => { setQuery(''); setApplied(''); }}>ล้าง</button>}
            {avail && <span className="muted" style={{ fontSize: 11.5 }}>เลือก {avail.filter(r => r.checked).length} / {avail.length} ราย</span>}
          </div>
        </div>
        <AbrTable rows={availView} editable minWidth={960} page={pageA} onPage={setPageA}
          sortDir={sortA} onSort={flip(setSortA)}
          onToggle={toggleAvail} onToggleAll={toggleAvailAll} onPay={payAvail}
          emptyText={avail ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'กำหนดเงื่อนไขแล้วกด “ดึงข้อมูล” เพื่อแสดงรายการลูกหนี้ตัวแทน'} />
      </div>

      <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'center', gap: 10 }}>
        <button className="btn primary" onClick={moveIn} disabled={!avail}><Icon name="download" /> นำเข้า</button>
        <button className="btn" onClick={moveOut} disabled={batch.length === 0}><Icon name="upload" /> นำออก</button>
      </div>

      {/* ── รายการที่จะรับชำระ ── */}
      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="head-bar" /><h3>รายการที่จะรับชำระ</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <input className="cfg-input" value={queryB} style={{ width: 260 }}
              onChange={e => setQueryB(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setAppliedB(queryB); setPageB(1); } }}
              placeholder="ค้นหาทะเบียน / ชื่อ / สังกัด…" />
            <button className="btn sm" onClick={() => { setAppliedB(queryB); setPageB(1); }}>ค้น</button>
            {appliedB && <button className="btn text sm" onClick={() => { setQueryB(''); setAppliedB(''); }}>ล้าง</button>}
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {batch.length} ราย</span>
            {batch.length > 0 && <span className="muted mono" style={{ fontSize: 11.5 }}>รวมยอดชำระ {window.fmt.money(batchPayTotal, 2)} บาท</span>}
          </div>
        </div>
        <AbrTable rows={batchView} editable minWidth={960} page={pageB} onPage={setPageB}
          sortDir={sortB} onSort={flip(setSortB)}
          onToggle={toggleBatch} onToggleAll={toggleBatchAll} onPay={payBatch}
          emptyText={appliedB && batch.length > 0 ? 'ไม่พบรายการที่ตรงกับคำค้นหา' : 'ยังไม่มีรายการ — เลือกรายการด้านบนแล้วกด “นำเข้า”'} />
      </div>

      {overpay && (
        <div className="ap-hint" style={{ color: 'var(--danger)' }}>
          <Icon name="info" size={13} /> ยอดชำระบางรายเกินยอดคงเหลือ — กรุณาตรวจสอบก่อนบันทึก
        </div>
      )}

      <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end', gap: 10 }}>
        <button className="btn primary" onClick={save} disabled={!canSave}><Icon name="check" /> บันทึกรับชำระ</button>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เลือกรายการจาก “รายการที่ดึงมา” แล้วกด “นำเข้า” เพื่อย้ายมาเป็น “รายการที่จะรับชำระ” · คลิกหัวคอลัมน์ “ยอดคงเหลือ” เพื่อเรียงมาก–น้อย · แสดง 20 ลำดับต่อหน้า
      </div>
    </div>
  );
}

Object.assign(window, { AgentBatchReceivePage });
})();
