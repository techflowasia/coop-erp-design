// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › ยกเลิกใบทำรายการ
//  ค้นหาใบทำรายการรับ/จ่ายเงินที่ผ่านเคาน์เตอร์การเงินตามวันทำการ —
//  กรองด้วย สมาชิก/เลขที่ใบรายการ · สถานะรายการ · ประเภทเงิน · ประเภททำรายการ
//  → เลือกใบทำรายการ + ระบุสาเหตุ → ยืนยันด้วยรหัสผู้มีสิทธิ์ (กลับรายการ)
// ════════════════════════════════════════════════════════════════════
const { useState: fctUseState, useMemo: fctUseMemo } = React;

const fctToday = () => window.DEPOSIT_WORKING_DATE || '2026-06-02';
const fctThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};

// ─── ตัวเลือกตัวกรอง ────────────────────────────────────────────────
const FCT_STATUSES = [
  { v: 'posted',  l: 'ผ่านรายการ แล้ว' },
  { v: 'pending', l: 'รอผ่านรายการ' },
  { v: 'all',     l: 'ทั้งหมด' },
];
const FCT_MONEY_TYPES = [
  { v: 'cash',     l: 'เงินสด' },
  { v: 'cheque',   l: 'เช็ค' },
  { v: 'transfer', l: 'เงินโอน' },
];
const FCT_TXN_KINDS = [
  { v: 'all',     l: 'ทั้งหมด' },
  { v: 'receive', l: 'รับเงิน' },
  { v: 'pay',     l: 'จ่ายเงิน' },
];
const FCT_SEARCH_MODES = [
  { v: 'member', l: 'สมาชิก / บุคคลภายนอก', placeholder: 'คลิกเพื่อค้นหาสมาชิกหรือบุคคลภายนอก…' },
  { v: 'slip',   l: 'เลขที่ใบรายการ', placeholder: 'เช่น RC6906-11824' },
];

// ─── รายการงานเคาน์เตอร์การเงิน (แยกตามระบบ) ────────────────────────
const FCT_OPERATORS = ['สุนิสา ทองแท้', 'วิสุทธิ์ เจริญพร', 'นารี กมล', 'ประยุทธ มานะ', 'กนก ธนทรัพย์'];
const FCT_DESCS = [
  { kind: 'receive', sys: 'หุ้น',      desc: 'รับชำระค่าหุ้นรายเดือน',        pre: 'RC' },
  { kind: 'receive', sys: 'เงินฝาก',   desc: 'รับฝากเงินออมทรัพย์',           pre: 'RC' },
  { kind: 'receive', sys: 'เงินกู้',    desc: 'รับชำระหนี้เงินกู้สามัญ',        pre: 'RC' },
  { kind: 'receive', sys: 'ค่าธรรมเนียม', desc: 'รับค่าธรรมเนียมแรกเข้า',        pre: 'RC' },
  { kind: 'pay',     sys: 'เงินกู้',    desc: 'จ่ายเงินกู้สามัญ',              pre: 'PV' },
  { kind: 'pay',     sys: 'เงินฝาก',   desc: 'ถอนเงินฝากออมทรัพย์',          pre: 'PV' },
  { kind: 'pay',     sys: 'หุ้น',      desc: 'จ่ายคืนค่าหุ้น',                pre: 'PV' },
];
const fctMoneyLabel = (v) => (FCT_MONEY_TYPES.find(m => m.v === v) || {}).l || v;
const fctKindLabel = (v) => (v === 'receive' ? 'รับเงิน' : 'จ่ายเงิน');

// LCG อย่างง่าย — deterministic ต่อ seed
function fctRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// บุคคลภายนอก (ไม่ใช่สมาชิก) ที่ทำรายการผ่านเคาน์เตอร์การเงิน
const FCT_EXT_PERSONS = [
  { code: 'E00001', title: 'นาย', firstName: 'ประสิทธิ์', lastName: 'มั่นคง', citizenId: '3100500123456', dept: 'บุคคลภายนอก', deptCode: 'EXT', external: true },
  { code: 'E00002', title: 'นาง', firstName: 'สุดา', lastName: 'ใจงาม', citizenId: '3100500234567', dept: 'บุคคลภายนอก', deptCode: 'EXT', external: true },
  { code: 'E00003', title: 'นางสาว', firstName: 'พิมพ์ชนก', lastName: 'ทองดี', citizenId: '1100500345678', dept: 'บุคคลภายนอก', deptCode: 'EXT', external: true },
];
const fctPeople = () => [...(window.DN_MEMBERS || []), ...FCT_EXT_PERSONS];

// ─── สร้างชุดใบทำรายการสาธิตตามวันทำการ (deterministic) ─────────────
function fctBuildSlips(workDate) {
  const members = (window.DN_MEMBERS || []).length ? fctPeople() : [];
  if (!members.length) return [];
  const be = String(Number(workDate.slice(0, 4)) + 543).slice(2);   // ปี พ.ศ. ย่อ
  const mm = workDate.slice(5, 7);
  const rows = [];
  let running = 11800;
  members.forEach((m, mi) => {
    const digits = String(m.code).replace(/\D/g, '');
    const seed = digits.split('').reduce((a, c) => a + Number(c) * 7, 17) + mi * 53;
    const rnd = fctRng(seed || 99);
    const n = 3 + Math.floor(rnd() * 3);                            // 3–5 ใบต่อสมาชิก
    for (let i = 0; i < n; i++) {
      const d = FCT_DESCS[Math.floor(rnd() * FCT_DESCS.length)];
      const money = rnd() < 0.72 ? 'cash' : (rnd() < 0.6 ? 'cheque' : 'transfer');
      const amount = Math.round((1500 + rnd() * 148000) * 100) / 100;
      running += 1 + Math.floor(rnd() * 40);
      const posted = rnd() > 0.28;                                  // ส่วนใหญ่ผ่านรายการแล้ว
      rows.push({
        slip: `${d.pre}${be}${mm}-${String(running).padStart(5, '0')}`,
        memberCode: m.code,
        memberName: window.msFullName(m),
        dept: `${m.deptCode || ''} · ${m.dept || ''}`,
        kind: d.kind,
        sys: d.sys,
        desc: d.desc,
        money,
        amount,
        by: FCT_OPERATORS[Math.floor(rnd() * FCT_OPERATORS.length)],
        status: posted ? 'posted' : 'pending',
        // ยกเลิกได้เฉพาะรายการที่ยังไม่ปิดงวด (สาธิต: รายการที่ผ่านรายการในวันเดียวกัน)
        cancellable: rnd() > 0.22,
        cancelled: false,
      });
    }
  });
  return rows;
}

function FinanceCancelTxnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ยกเลิกใบทำรายการ', current: true }], []);

  const workDate = fctToday();
  const reasons = window.CANCEL_REASONS || ['บันทึกรายการผิดพลาด'];

  const [all, setAll]         = fctUseState(() => fctBuildSlips(workDate));
  const [dataDate, setDate]   = fctUseState(workDate);
  const [mode, setMode]       = fctUseState('member');
  const [query, setQuery]     = fctUseState('');
  const [person, setPerson]   = fctUseState(null);
  const [status, setStatus]   = fctUseState('posted');
  const [byMoney, setByMoney] = fctUseState(false);
  const [money, setMoney]     = fctUseState('cash');
  const [kind, setKind]       = fctUseState('all');

  const [searched, setSearched] = fctUseState(false);
  const [results, setResults]   = fctUseState([]);      // slip[]
  const [selected, setSel]      = fctUseState({});      // slip -> reasonText
  const [confirmOpen, setConfirm] = fctUseState(false);

  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');

  const runSearch = () => {
    setSearched(true);
    setSel({});
    const nq = norm(query.trim());
    const rows = all.filter(r => {
      if (status !== 'all' && r.status !== status) return false;
      if (byMoney && r.money !== money) return false;
      if (kind !== 'all' && r.kind !== kind) return false;
      if (nq) {
        if (mode === 'member') { if (norm(r.memberCode) !== nq) return false; }
        else { if (!norm(r.slip).includes(nq)) return false; }
      }
      return true;
    });
    setResults(rows.map(r => r.slip));
  };

  const resetSearch = () => {
    setQuery(''); setPerson(null); setStatus('posted'); setByMoney(false); setMoney('cash'); setKind('all');
    setSearched(false); setResults([]); setSel({});
  };

  const rowsFor = fctUseMemo(
    () => results.map(s => all.find(r => r.slip === s)).filter(Boolean),
    [results, all]);

  const selectableSlips = rowsFor.filter(r => r.cancellable && !r.cancelled).map(r => r.slip);
  const selectedSlips = Object.keys(selected);
  const allSelected = selectableSlips.length > 0 && selectableSlips.every(s => selected[s] !== undefined);

  const toggleSel = (slip) => setSel(prev => {
    const next = { ...prev };
    if (next[slip] !== undefined) delete next[slip];
    else next[slip] = reasons[0];
    return next;
  });
  const toggleAll = () => setSel(() => {
    if (allSelected) return {};
    const next = {};
    selectableSlips.forEach(s => { next[s] = reasons[0]; });
    return next;
  });
  const setReason = (slip, r) => setSel(prev => ({ ...prev, [slip]: r }));
  // สาเหตุ "อื่น ๆ" — เก็บข้อความที่กรอกแยกไว้ ใช้แทนสาเหตุเมื่อยืนยัน
  const OTHER = reasons.find(r => /^อื่น/.test(r)) || 'อื่น ๆ';
  const reasonOpts = reasons.includes(OTHER) ? reasons : [...reasons, OTHER];
  const [otherTxt, setOtherTxt] = fctUseState({});
  const reasonText = (slip) => selected[slip] === OTHER ? (otherTxt[slip] || '').trim() : selected[slip];

  const selectedTxns = rowsFor.filter(r => selected[r.slip] !== undefined);
  const totalAmount = selectedTxns.reduce((a, t) => a + t.amount, 0);
  const missingReason = selectedTxns.some(t => !reasonText(t.slip));

  const performCancel = ({ authorizer }) => {
    setAll(prev => prev.map(r =>
      selected[r.slip] !== undefined
        ? { ...r, cancelled: true, cancelReason: selected[r.slip],
            cancelInfo: { by: authorizer.name, ts: new Date().toISOString().slice(0, 19) } }
        : r));

    selectedTxns.forEach(t => {
      audit.log && audit.log({
        action: 'delete', module: 'การเงิน — ยกเลิกใบทำรายการ',
        target: `${t.memberCode} · ${t.memberName}`,
        summary: `ยกเลิกใบทำรายการ ${t.slip} — ${t.desc} (${t.sys})`,
        user: authorizer.name, role: authorizer.role,
        changes: [
          { field: 'เลขที่ใบทำรายการ', before: t.slip, after: 'ยกเลิกแล้ว' },
          { field: 'ประเภททำรายการ', before: fctKindLabel(t.kind), after: '— (กลับรายการ)' },
          { field: 'ประเภทเงิน', before: fctMoneyLabel(t.money), after: '—' },
          { field: 'จำนวนเงิน', before: window.fmt.money(t.amount, 2), after: '— (กลับรายการ)' },
          { field: 'สาเหตุการยกเลิก', before: '—', after: reasonText(t.slip) },
          { field: 'อนุมัติโดย', before: '—', after: `${authorizer.name} (${authorizer.role})` },
        ],
      });
    });

    const n = selectedTxns.length;
    onToast && onToast(`ยกเลิกใบทำรายการเรียบร้อย ${n} รายการ · อนุมัติโดย ${authorizer.name}`);
    setSel({});
    setConfirm(false);
  };

  const modeDef = FCT_SEARCH_MODES.find(m => m.v === mode);

  return (
    <div data-screen-label="หน้ายกเลิกใบทำรายการ (การเงิน)">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกใบทำรายการ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ค้นหาใบทำรายการรับ/จ่ายเงินที่ผ่านเคาน์เตอร์การเงินตามวันทำการ แล้วเลือกใบที่ต้องการยกเลิก — ระบุสาเหตุและยืนยันด้วยรหัสผู้มีสิทธิ์
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{fctThaiDate(workDate)}</span>
        </div>
        <button className={'btn sm' + (selectedTxns.length > 0 ? ' primary danger' : '')} data-keep-top=""
                disabled={selectedTxns.length === 0 || missingReason} onClick={() => setConfirm(true)}>
          <Icon name="close" /> ยกเลิกใบทำรายการที่เลือก{selectedTxns.length > 0 ? ` (${selectedTxns.length})` : ''}
        </button>
      </div>

      {/* ── การ์ดค้นหา ── */}
      <div className="search-card">

        <div className="fct-filter-grid">
          <label className="ap-field">
            <span className="ap-label">ข้อมูลวันที่</span>
            <ErpDate value={dataDate} onChange={(v) => (e => setDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </label>
          <label className="ap-field">
            <span className="ap-label">ค้นหาด้วย</span>
            <select className="cfg-input" value={mode} onChange={e => { setMode(e.target.value); setQuery(''); setPerson(null); }}>
              {FCT_SEARCH_MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </label>
          <div className="ap-field fct-col-wide">
            <span className="ap-label">{modeDef.l}</span>
            {mode === 'member' ? (
              <MemberSearchField member={person} source={fctPeople()} title="ค้นหาสมาชิก / บุคคลภายนอก"
                                 placeholder={modeDef.placeholder}
                                 onPick={(m) => { setPerson(m); setQuery(m.code); }} />
            ) : (
            <div className="dep-input">
              <Icon name="search" size={14} />
              <input value={query} placeholder={modeDef.placeholder}
                     onChange={e => setQuery(e.target.value)}
                     onKeyDown={e => { if (e.key === 'Enter') runSearch(); }} />
              {query && <button className="dep-eye" onClick={() => setQuery('')} aria-label="ล้างคำค้นหา"><Icon name="close" size={14} /></button>}
            </div>
            )}
          </div>
          <label className="ap-field">
            <span className="ap-label">สถานะรายการ</span>
            <select className="cfg-input" value={status} onChange={e => setStatus(e.target.value)}>
              {FCT_STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
          <div className="ap-field">
            <div className="fct-lab-row">
              <span className="ap-label">ประเภทเงิน</span>
              <label className="fbt-chk fct-lab-chk">
                <input type="checkbox" checked={byMoney} onChange={e => setByMoney(e.target.checked)} />
                <span>ระบุประเภทเงิน</span>
              </label>
            </div>
            <select className="cfg-input" value={money} disabled={!byMoney}
                    onChange={e => setMoney(e.target.value)}
                    style={!byMoney ? { background: 'var(--surface-muted)', color: 'var(--text-faint)' } : undefined}>
              {FCT_MONEY_TYPES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <label className="ap-field">
            <span className="ap-label fct-lab-pad">ประเภททำรายการ</span>
            <select className="cfg-input" value={kind} onChange={e => setKind(e.target.value)}>
              {FCT_TXN_KINDS.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
            </select>
          </label>
          <div className="ap-field fct-searchbtns">
            <button className="btn primary pa-tb-btn" onClick={runSearch}>ค้นหา</button>
            <button className="btn pa-tb-btn" onClick={resetSearch}>รีเซ็ต</button>
          </div>
        </div>
      </div>

      {/* ── สถานะเริ่มต้น ── */}
      {!searched && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="money" size={26} /></div>
            กำหนดเงื่อนไขแล้วกด “ค้นหา” เพื่อแสดงใบทำรายการที่ยกเลิกได้
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              ค้นหาได้ทั้งหมด หรือระบุสมาชิก/เลขที่ใบรายการเพื่อจำกัดผลลัพธ์
            </div>
          </div>
        </div>
      )}

      {/* ── ผลการค้นหา (ว่าง) ── */}
      {searched && rowsFor.length === 0 && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="search" size={26} /></div>
            ไม่พบใบทำรายการที่ตรงกับเงื่อนไข
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              ปรับสถานะ/ประเภทเงิน/ประเภททำรายการ หรือแก้คำค้นหาแล้วลองอีกครั้ง
            </div>
          </div>
        </div>
      )}

      {/* ── ตารางรายการ ── */}
      {searched && rowsFor.length > 0 && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head">
            <span className="head-bar" /><h3>รายการ</h3>
            <span className="muted" style={{ fontSize: 11 }}>
              พบ {rowsFor.length} ใบทำรายการ · เลือกใบที่ต้องการยกเลิกแล้วระบุสาเหตุในแต่ละรายการ
            </span>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ct-tbl" style={{ minWidth: 1180 }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: 40 }}>
                    <input type="checkbox" className="ct-check" checked={allSelected}
                           disabled={selectableSlips.length === 0} onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                  </th>
                  <th style={{ minWidth: 210 }}>สาเหตุยกเลิก</th>
                  <th style={{ width: 130 }}>เลขที่ใบรายการ</th>
                  <th style={{ width: 96 }}>เลขสมาชิก</th>
                  <th style={{ minWidth: 180 }}>ชื่อ – สกุล</th>
                  <th style={{ minWidth: 220 }}>รายการ</th>
                  <th className="center" style={{ width: 76 }}>ประเภทเงิน</th>
                  <th className="num" style={{ width: 128 }}>จำนวนเงิน</th>
                  <th className="center" style={{ width: 40 }}>พิมพ์</th>
                  <th className="center" style={{ width: 100 }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {rowsFor.map(t => {
                  const sel = selected[t.slip] !== undefined;
                  const canPick = t.cancellable && !t.cancelled;
                  return (
                    <tr key={t.slip} className={(t.cancelled ? 'cancelled ' : '') + (sel ? 'sel' : '')}>
                      <td className="center">
                        {canPick ? (
                          <input type="checkbox" className="ct-check" checked={sel}
                                 onChange={() => toggleSel(t.slip)} aria-label={`เลือก ${t.slip}`} />
                        ) : (
                          <span className="ct-lockcell" title={t.cancelled ? 'ยกเลิกแล้ว' : 'ยกเลิกไม่ได้ (ปิดงวดแล้ว)'}>
                            <Icon name="lock" size={12} />
                          </span>
                        )}
                      </td>
                      <td>
                        {t.cancelled ? (
                          <span style={{ fontSize: 12 }}>{t.cancelReason}</span>
                        ) : sel ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select className="cfg-input" style={{ height: 30, fontSize: 12 }}
                                    value={selected[t.slip]} onChange={e => setReason(t.slip, e.target.value)}>
                              {reasonOpts.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {selected[t.slip] === OTHER && (
                              <input className={'cfg-input' + (reasonText(t.slip) ? '' : ' error')} style={{ height: 30, fontSize: 12 }}
                                     value={otherTxt[t.slip] || ''} placeholder="ระบุสาเหตุการยกเลิก" autoFocus
                                     onChange={e => setOtherTxt(p => ({ ...p, [t.slip]: e.target.value }))} />
                            )}
                          </div>
                        ) : (
                          <span className="muted" style={{ fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td className="mono">{t.slip}</td>
                      <td className="mono">{t.memberCode}</td>
                      <td>
                        <div className="lt-row-name">{t.memberName}</div>
                        <div className="lt-row-note muted">{t.dept}</div>
                      </td>
                      <td>
                        <div>{t.desc}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          <span className={"chip " + (t.kind === 'receive' ? 'success' : 'warning')} style={{ marginRight: 6 }}>
                            {fctKindLabel(t.kind)}
                          </span>
                          ระบบ{t.sys}
                        </div>
                      </td>
                      <td className="center" style={{ fontSize: 12 }}>{fctMoneyLabel(t.money)}</td>
                      <td className="num mono" style={{ fontWeight: 600,
                            color: t.cancelled ? 'var(--text-faint)' : (t.kind === 'pay' ? 'var(--danger)' : 'var(--success)') }}>
                        {t.kind === 'pay' ? '−' : '+'} {window.fmt.money(t.amount, 2)}
                      </td>
                      <td className="center">
                        <button className="bud-act" title="พิมพ์ใบทำรายการ"
                                onClick={() => onToast && onToast(`สั่งพิมพ์ใบทำรายการ ${t.slip}`)}>
                          <Icon name="print" size={14} />
                        </button>
                      </td>
                      <td className="center">
                        {t.cancelled
                          ? <span className="pill bad">ยกเลิกแล้ว</span>
                          : t.status === 'posted'
                            ? <span className="pill ok">ผ่านรายการแล้ว</span>
                            : <span className="pill warn">รอผ่านรายการ</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>

          {/* action bar */}
          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>
              {selectedTxns.length > 0
                ? <>เลือก <b style={{ color: 'var(--text)' }}>{selectedTxns.length}</b> รายการ · รวม{' '}
                    <b className="mono" style={{ color: 'var(--text)' }}>฿ {window.fmt.money(totalAmount, 2)}</b>
                    {missingReason && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>· ยังมีรายการที่ยังไม่ได้ระบุสาเหตุ</span>}</>
                : 'ยังไม่ได้เลือกใบทำรายการที่จะยกเลิก'}
            </span>
          </div>
        </div>
      )}

      {confirmOpen && (
        <FinanceConfirmCancelModal
          txns={selectedTxns} reasonOf={reasonText}
          onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ── โมดัลยืนยันการยกเลิก — ใส่รหัสผู้มีสิทธิ์ ────────────────────────
function FinanceConfirmCancelModal({ txns, reasonOf, onClose, onConfirm }) {
  const [code, setCode]   = fctUseState('');
  const [error, setError] = fctUseState('');
  const [busy, setBusy]   = fctUseState(false);
  const total = txns.reduce((a, t) => a + t.amount, 0);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณากรอกรหัสผู้มีสิทธิ์ยกเลิก'); return; }
    setBusy(true); setError('');
    setTimeout(() => {
      const authorizer = (window.CANCEL_AUTHORIZERS || []).find(a => a.code === code.trim());
      if (!authorizer) { setBusy(false); setError('รหัสผู้มีสิทธิ์ไม่ถูกต้อง หรือไม่มีสิทธิ์อนุมัติการยกเลิก'); return; }
      setBusy(false);
      onConfirm({ authorizer });
    }, 400);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการยกเลิกใบทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>ระบบงานการเงิน · เคาน์เตอร์รับ–จ่ายเงิน</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกจะกลับรายการรับ/จ่ายเงินและปรับยอดที่เกี่ยวข้องทันที การกระทำนี้จะถูกบันทึกใน Audit Log และไม่สามารถย้อนกลับได้</span>
          </div>

          <div className="ct-confirm-list">
            {txns.map(t => (
              <div className="ct-confirm-row" key={t.slip}>
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{t.slip}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{t.memberName} · {t.desc} · {reasonOf(t.slip)}</div>
                </div>
                <div className="mono" style={{ fontWeight: 600, color: t.kind === 'pay' ? 'var(--danger)' : 'var(--success)' }}>
                  {t.kind === 'pay' ? '−' : '+'} {window.fmt.money(t.amount, 2)}
                </div>
              </div>
            ))}
            <div className="ct-confirm-total">
              <span>รวม {txns.length} รายการ</span>
              <span className="mono">฿ {window.fmt.money(total, 2)}</span>
            </div>
          </div>

          <form className="dep-form" onSubmit={submit}>
            <label className="lb-label">รหัสผู้มีสิทธิ์ยกเลิก <span style={{ color: 'var(--danger)' }}>*</span></label>
            <div className="dep-input">
              <Icon name="lock" size={14} />
              <input type="password" value={code} autoComplete="off" inputMode="numeric"
                     placeholder="รหัสยืนยันของผู้มีสิทธิ์"
                     onChange={e => { setCode(e.target.value); setError(''); }} autoFocus />
            </div>

            {error && <div className="dep-error"><Icon name="info" size={13} /> {error}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
              <button type="submit" className="btn danger" style={{ flex: 1, justifyContent: 'center' }} disabled={busy}>
                {busy ? 'กำลังตรวจสอบสิทธิ์...' : <><Icon name="check" /> ยืนยันการยกเลิก</>}
              </button>
            </div>
          </form>

          <div className="dep-hint">
            <Icon name="shield" size={13} />
            <span>ตัวอย่างสำหรับสาธิต — รหัสผู้มีสิทธิ์: <b className="mono">491205</b> (อภิชาติ ศรีสุข) หรือ <b className="mono">770318</b> (ประเสริฐ วัฒนชัย)</span>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { FinanceCancelTxnPage });
