// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — ผ่านรายการรายวันไปแยกประเภท (Post Journals → GL)
//  รวบรวม Voucher (RV/PV/JV) ที่รอผ่านบัญชี ตรวจสอบความสมดุล
//  และผ่านรายการเข้าสู่บัญชีแยกประเภท (General Ledger)
// ════════════════════════════════════════════════════════════════════
const { useState: plgUseState, useMemo: plgUseMemo } = React;

// ── ข้อมูลตัวอย่าง Voucher รอผ่านบัญชี ────────────────────────────────
// status: pending = รอผ่านรายการ · posted = ผ่านรายการแล้ว · unbalanced = ไม่สมดุล
const PLG_SEED = [
  // เงินสดรับ (RV)
  { id: 'RV69070160', type: 'RV', date: '2026-07-10', desc: 'รับชำระเงินกู้สามัญประจำวัน', by: 'GUNLANAN', dr: 250000, cr: 250000, lines: 3, status: 'pending' },
  { id: 'RV69070161', type: 'RV', date: '2026-07-10', desc: 'รับฝากเงินสมาชิกประจำวัน', by: 'GUNLANAN', dr: 480000, cr: 480000, lines: 4, status: 'pending' },
  { id: 'RV69070159', type: 'RV', date: '2026-07-09', desc: 'รับค่าธรรมเนียมแรกเข้าสมาชิก', by: 'SUNISA', dr: 3200, cr: 3200, lines: 2, status: 'posted' },
  // เงินสดจ่าย (PV)
  { id: 'PV69070160', type: 'PV', date: '2026-07-10', desc: 'จ่ายเงินกู้สามัญประจำวัน', by: 'GUNLANAN', dr: 125000, cr: 125000, lines: 2, status: 'pending' },
  { id: 'PV69070161', type: 'PV', date: '2026-07-10', desc: 'จ่ายค่าใช้จ่ายสำนักงานประจำวัน', by: 'GUNLANAN', dr: 18500, cr: 18500, lines: 5, status: 'pending' },
  { id: 'PV69070162', type: 'PV', date: '2026-07-10', desc: 'คืนค่าหุ้นสมาชิกลาออก', by: 'PIYADA', dr: 62000, cr: 62000, lines: 3, status: 'pending' },
  // รายวันทั่วไป / โอน (JV)
  { id: 'JV69070273', type: 'JV', date: '2026-07-10', desc: 'รายการโอนระหว่างบัญชีธนาคาร', by: 'GUNLANAN', dr: 350000, cr: 350000, lines: 2, status: 'pending' },
  { id: 'JV69070274', type: 'JV', date: '2026-07-10', desc: 'ปรับปรุงดอกเบี้ยค้างรับเงินให้กู้', by: 'GUNLANAN', dr: 75000, cr: 75000, lines: 3, status: 'pending' },
  { id: 'JV69070275', type: 'JV', date: '2026-07-10', desc: 'ตั้งค่าเผื่อหนี้สงสัยจะสูญ', by: 'GUNLANAN', dr: 12500, cr: 12500, lines: 2, status: 'pending' },
  { id: 'JV69070276', type: 'JV', date: '2026-07-10', desc: 'บันทึกค่าเสื่อมราคาครุภัณฑ์ประจำเดือน', by: 'GUNLANAN', dr: 28400, cr: 28400, lines: 4, status: 'pending' },
  { id: 'JV69070271', type: 'JV', date: '2026-07-10', desc: 'ตั้งลูกหนี้ค่าปรับชำระล่าช้า', by: 'SUNISA', dr: 9800, cr: 9800, lines: 2, status: 'pending' },
  { id: 'JV69070270', type: 'JV', date: '2026-07-08', desc: 'ปิดยอดปรับปรุงสิ้นเดือนมิถุนายน', by: 'PIYADA', dr: 145000, cr: 145000, lines: 6, status: 'posted' },
];

const PLG_GROUPS = [
  { type: 'RV', icon: 'download', tone: 'primary', label: 'เงินสดรับ (Receipt Voucher)' },
  { type: 'PV', icon: 'upload',   tone: 'danger',  label: 'เงินสดจ่าย (Payment Voucher)' },
  { type: 'JV', icon: 'swap',     tone: 'info',    label: 'รายวันทั่วไป / โอน / สมุดรายวัน (Journal Voucher)' },
];

const PLG_STATUS = {
  pending:    { pill: 'info',    label: 'รอผ่านรายการ' },
  posted:     { pill: 'ok',      label: 'ผ่านรายการแล้ว' },
  cancelled:  { pill: '',        label: 'ยกเลิกแล้ว' },
  reversed:   { pill: 'warn',    label: 'กลับรายการแล้ว' },
};
const PLG_CANCEL_REASONS = ['บันทึกรายการผิด', 'รายการซ้ำ', 'ยอดเงินไม่ถูกต้อง', 'ผังบัญชีไม่ถูกต้อง', 'อื่นๆ'];

const plgCanPost = (v) => v.status === 'pending' && v.dr === v.cr;

if (!document.getElementById('plg-card-style')) {
  const st = document.createElement('style');
  st.id = 'plg-card-style';
  st.textContent = '.plg-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }'
    + '.plg-kpi { background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; min-width: 0; box-shadow: none; }'
    + '.plg-kpi > div { display: flex; flex-direction: column; gap: 6px; min-width: 0; }'
    + '.plg-kpi > div > span { font-size: 12.5px; font-weight: 600; color: var(--text); order: -1; }'
    + '.plg-kpi > div > b { font-size: 22px; font-weight: 700; line-height: 1; }'
    + '@media (max-width: 640px) { .plg-kpis { grid-template-columns: 1fr 1fr; } .plg-kpi > div > b { font-size: 19px; } }';
  document.head.appendChild(st);
}

function PlgSummaryRow({ label, value, unit, tone }) {
  return (
    <div className="plg-sum-row">
      <div className="plg-sum-lab">{label}</div>
      <div className={"plg-sum-val" + (tone ? ' ' + tone : '')}>
        {value} {unit && <span className="plg-sum-unit">{unit}</span>}
      </div>
    </div>
  );
}

function PostToLedgerPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [from, setFrom] = plgUseState('2026-07-01');
  const [to, setTo] = plgUseState('2026-07-10');
  const [vtype, setVtype] = plgUseState('all');
  const [statusF, setStatusF] = plgUseState('all');
  const [vcNo, setVcNo] = plgUseState('');

  const [rows, setRows] = plgUseState(() => PLG_SEED.map(r => ({ ...r })));
  const [sel, setSel] = plgUseState(() => new Set());
  const [collapsed, setCollapsed] = plgUseState(() => new Set());
  const [confirm, setConfirm] = plgUseState(false);
  const [batchNo, setBatchNo] = plgUseState('');
  const [cancelAsk, setCancelAsk] = plgUseState(null);
  const [cReason, setCReason] = plgUseState('');
  const [cNote, setCNote] = plgUseState('');
  const [viewV, setViewV] = plgUseState(null);
  const [revV, setRevV] = plgUseState(null);
  const doReverse = () => {
    const v = revV;
    // สร้าง JV กลับรายการ (สลับเดบิต/เครดิต) — รอผ่านรายการเข้าแยกประเภท
    const maxJv = rows.filter(r => r.type === 'JV').reduce((m, r) => Math.max(m, Number(String(r.id).replace(/\D/g, '')) || 0), 0);
    const jvId = 'JV' + String(maxJv + 1).padStart(8, '0');
    const today = postDate || new Date().toISOString().slice(0, 10);
    const rev = { id: jvId, type: 'JV', date: today, desc: 'กลับรายการ ' + v.id + ' — ' + v.desc, by: 'น.ส.กัญญารณี',
                  dr: v.cr, cr: v.dr, lines: v.lines, status: 'pending', reverseOf: v.id };
    setRows(rs => [...rs.map(r => r.id === v.id ? { ...r, status: 'reversed', reversedBy: jvId } : r), rev]);
    audit.log && audit.log({ action: 'create', module: 'บัญชี — ผ่านรายการไปแยกประเภท', target: jvId,
      summary: 'สร้าง ' + jvId + ' กลับรายการ ' + v.id + ' ยอด ' + window.fmt.money(v.dr) + ' บาท' });
    setRevV(null);
    window.depSuccess ? window.depSuccess({ title: 'สร้างรายการกลับเรียบร้อยแล้ว',
      desc: jvId + ' รอผ่านรายการเข้าแยกประเภท', lines: [['กลับรายการของ', v.id], ['ยอด', window.fmt.money(v.dr) + ' บาท']] })
      : (onToast && onToast('สร้าง ' + jvId + ' กลับรายการ ' + v.id + ' แล้ว'));
  };
  const askCancel = (ids) => { setCReason(''); setCNote(''); setCancelAsk({ ids }); };
  const doCancel = () => {
    const ids = new Set(cancelAsk.ids);
    const why = cReason === 'อื่นๆ' ? cNote.trim() : cReason;
    setRows(rs => {
      // ยกเลิก JV กลับรายการ → คืนรายการต้นฉบับเป็น "ผ่านรายการแล้ว"
      const origIds = new Set(rs.filter(r => ids.has(r.id) && r.reverseOf).map(r => r.reverseOf));
      return rs.map(r => {
        if (ids.has(r.id)) return { ...r, status: 'cancelled', cancelReason: why };
        if (origIds.has(r.id)) { const { reversedBy, ...rest } = r; return { ...rest, status: 'posted' }; }
        return r;
      });
    });
    setSel(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; });
    audit.log && audit.log({ action: 'update', module: 'บัญชี — ผ่านรายการไปแยกประเภท', target: [...ids].join(', '),
      summary: 'ยกเลิก Voucher ที่ยังไม่ผ่านรายการ ' + ids.size + ' รายการ', changes: [{ field: 'เหตุผล', before: '—', after: why }] });
    setCancelAsk(null);
    onToast && onToast('ยกเลิก ' + ids.size + ' Voucher แล้ว — รายการไม่ถูกผ่านไปแยกประเภท');
  };

  // นับสถิติภาพรวม
  const kpi = plgUseMemo(() => ({
    total: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    posted: rows.filter(r => r.status === 'posted').length,
    cancelled: rows.filter(r => r.status === 'cancelled').length,
    unbalanced: rows.filter(r => r.status === 'unbalanced').length,
  }), [rows]);

  const live = rows.filter(r => r.status !== 'cancelled');
  const grandDr = live.reduce((s, r) => s + r.dr, 0);
  const grandCr = live.reduce((s, r) => s + r.cr, 0);

  // รายการที่ผ่านเงื่อนไข checkbox "เลือกทั้งหมด"
  const selectable = rows.filter(plgCanPost);

  const toggleRow = (v) => {
    if (!plgCanPost(v)) return;
    setSel(s => { const n = new Set(s); n.has(v.id) ? n.delete(v.id) : n.add(v.id); return n; });
  };
  const selectAll = () => setSel(new Set(selectable.map(v => v.id)));
  const clearSel = () => setSel(new Set());
  const toggleGroup = (t) => setCollapsed(s => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });

  // ยอดสรุปของรายการที่เลือก
  const chosen = rows.filter(r => sel.has(r.id));
  const sum = chosen.reduce((a, r) => { a.vc += 1; a.lines += r.lines; a.dr += r.dr; a.cr += r.cr; return a; },
    { vc: 0, lines: 0, dr: 0, cr: 0 });
  const sumDiff = sum.dr - sum.cr;

  const doFetch = () => {
    setSel(new Set());
    onToast && onToast('ดึงข้อมูล Voucher รอผ่านบัญชีเรียบร้อย');
  };
  const doVerify = () => {
    if (!sum.vc) { onToast && onToast('กรุณาเลือกรายการที่ต้องการตรวจสอบ'); return; }
    onToast && onToast(sumDiff === 0
      ? `ตรวจสอบแล้ว — เดบิตและเครดิตสมดุล (${sum.vc} Voucher)`
      : `พบผลต่าง ${window.fmt.money(Math.abs(sumDiff))} บาท — ไม่สามารถผ่านรายการได้`);
  };
  const openConfirm = () => { if (sum.vc && sumDiff === 0) setConfirm(true); };
  const doPost = () => {
    const bn = 'PB' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 900) + 100);
    setBatchNo(bn);
    setRows(rs => rs.map(r => sel.has(r.id) ? { ...r, status: 'posted' } : r));
    audit.log && audit.log({ action: 'create', module: 'บัญชี — ผ่านรายการไปแยกประเภท', target: bn, summary: `ผ่านรายการ ${sum.vc} Voucher เข้าบัญชีแยกประเภท ยอด ${window.fmt.money(sum.dr)} บาท` });
    setSel(new Set());
    setConfirm(false);
    onToast && onToast(`ผ่านรายการสำเร็จ ${sum.vc} Voucher — ชุดผ่านรายการ ${bn}`);
  };
  const [postDate, setPostDate] = plgUseState('2026-07-10');

  const resetFilters = () => {
    setFrom('2026-07-01'); setTo('2026-07-10'); setVtype('all'); setStatusF('pending'); setVcNo('');
    setSel(new Set()); onToast && onToast('ล้างเงื่อนไขการค้นหาแล้ว');
  };

  const dateInvalid = from && to && from > to;

  return (
    <div data-screen-label="หน้าผ่านรายการไปแยกประเภท">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ผ่านรายการไปแยกประเภท</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>รวบรวมรายการ Voucher และผ่านรายการเข้าสู่บัญชีแยกประเภท (General Ledger)</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn sm" data-keep-top="" onClick={() => onToast && onToast('เตรียมพิมพ์รายงานผลการผ่านรายการ')}>พิมพ์รายงาน</button>
        <button className="btn sm" data-keep-top="" onClick={() => onToast && onToast('ส่งออกรายการเป็น Excel')}>ส่งออก Excel</button>
        <button className="btn primary sm" data-keep-top="" disabled={!sum.vc || sumDiff !== 0} onClick={openConfirm}>
          ผ่านรายการ{sum.vc ? ' (' + sum.vc + ' Voucher)' : ''}
        </button>
      </div>

      {/* ── เงื่อนไขค้นหา ── */}
      <div className="search-card plg-search">
        <div className="plg-filter-grid">
          <div className="plg-field plg-daterange">
            <label className="cfg-label">ช่วงวันที่รายการ <span className="req">*</span></label>
            <div className="plg-daterow">
              <div className="plg-dfield">
                <span className="plg-dlab">เริ่มวันที่</span>
                <window.ThaiDateField value={from} onChange={setFrom} />
              </div>
              <div className="plg-dfield">
                <span className="plg-dlab">ถึงวันที่</span>
                <window.ThaiDateField value={to} onChange={setTo} />
              </div>
            </div>
          </div>
          <div className="plg-field">
            <label className="cfg-label">ประเภท Voucher</label>
            <select className="cfg-input" value={vtype} onChange={e => setVtype(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="RV">RV — เงินสดรับ</option>
              <option value="PV">PV — เงินสดจ่าย</option>
              <option value="JV">JV — รายวันทั่วไป / โอน</option>
            </select>
          </div>
          <div className="plg-field">
            <label className="cfg-label">สถานะ</label>
            <select className="cfg-input" value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอผ่านรายการ</option>
              <option value="posted">ผ่านรายการแล้ว</option>
              <option value="cancelled">ยกเลิกแล้ว</option>
            </select>
          </div>
          <div className="plg-field">
            <label className="cfg-label">เลขที่ Voucher</label>
            <input className="cfg-input mono" value={vcNo} placeholder="ระบุเลขที่ VC" onChange={e => setVcNo(e.target.value)} />
          </div>
          <div className="plg-field plg-fetch">
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={doFetch} disabled={dateInvalid}>ดึงข้อมูล</button>
              <button className="btn" onClick={resetFilters}>รีเซ็ต</button>
            </div>
          </div>
        </div>
        {dateInvalid && <div className="plg-warn"><Icon name="info" size={12} /> วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด</div>}
      </div>

      {/* ── รายการ Voucher + สรุปยอด ── */}
      <div className="plg-body">
        <div className="plg-main">
          <div className="page-actions" style={{ marginTop: 0, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>รายการ Voucher แยกตามประเภท</h2>
            <span className="spacer" />
            <button className="btn sm" onClick={selectAll}>เลือกทั้งหมด</button>
            <button className="btn sm" onClick={clearSel}>ล้างการเลือก</button>
          </div>

          {/* KPI strip */}
          <div className="plg-kpis">
            <div className="plg-kpi"><span className="plg-kpi-ic neutral"><Icon name="report" size={15} /></span><div><b>{kpi.total}</b> <span>ทั้งหมด</span></div></div>
            <div className="plg-kpi"><span className="plg-kpi-ic info"><Icon name="history" size={15} /></span><div><b>{kpi.pending}</b> <span>รอผ่านรายการ</span></div></div>
            <div className="plg-kpi"><span className="plg-kpi-ic ok"><Icon name="check" size={15} /></span><div><b>{kpi.posted}</b> <span>ผ่านรายการแล้ว</span></div></div>
            <div className="plg-kpi"><span className="plg-kpi-ic neutral"><Icon name="close" size={15} /></span><div><b>{kpi.cancelled}</b> <span>ยกเลิกแล้ว</span></div></div>
          </div>

          <div className="search-card fbt-card">
            <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
              <table className="tbl plg-tbl" style={{ minWidth: 940 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 46 }}>เลือก</th>
                    <th style={{ width: 104 }}>วันที่รายการ</th>
                    <th style={{ width: 116 }}>เลขที่ VC</th>
                    <th className="center" style={{ width: 62 }}>ประเภท</th>
                    <th style={{ minWidth: 220 }}>รายละเอียด</th>
                    <th style={{ width: 110 }}>ผู้บันทึก</th>
                    <th className="right" style={{ width: 118 }}>เดบิต (บาท)</th>
                    <th className="right" style={{ width: 118 }}>เครดิต (บาท)</th>
                    <th className="right" style={{ width: 92 }}>ผลต่าง</th>
                    <th className="center" style={{ width: 96 }}>สถานะ</th>
                    <th className="center" style={{ width: 140 }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {PLG_GROUPS.map(g => {
                    const gr = rows.filter(r => r.type === g.type
                      && (vtype === 'all' || vtype === g.type)
                      && (statusF === 'all' || (statusF === 'pending' ? r.status === 'pending' : r.status === statusF))
                      && (!vcNo || r.id.toLowerCase().includes(vcNo.toLowerCase())));
                    if (!gr.length) return null;
                    const isCol = collapsed.has(g.type);
                    return (
                      <React.Fragment key={g.type}>
                        <tr className="plg-grouprow" onClick={() => toggleGroup(g.type)}>
                          <td colSpan={11}>
                            <div className="plg-group">
                              <Icon name={isCol ? 'chevRight' : 'chevDown'} size={13} />
                              <span className={"plg-group-ic " + g.tone}><Icon name={g.icon} size={14} /></span>
                              <span className="plg-group-name">{g.label}</span>
                              <span className={"chip " + g.tone}>{gr.length} รายการ</span>
                            </div>
                          </td>
                        </tr>
                        {!isCol && gr.map(v => {
                          const st = PLG_STATUS[v.status];
                          const diff = v.dr - v.cr;
                          const can = plgCanPost(v);
                          return (
                            <tr key={v.id} className={sel.has(v.id) ? 'plg-selrow' : v.status === 'cancelled' ? 'dat-off' : ''}>
                              <td className="center">
                                <input type="checkbox" className="plg-cb" checked={sel.has(v.id)} disabled={!can}
                                       onChange={() => toggleRow(v)} title={can ? '' : 'ไม่สามารถเลือกได้'} />
                              </td>
                              <td className="mono" style={{ fontSize: 11.5 }}>{window.fmt.date(v.date)}</td>
                              <td><span className="plg-vc">{v.id}</span></td>
                              <td className="center"><span className="chip">{v.type}</span></td>
                              <td>{v.desc}
                                {v.reversedBy && <div className="muted" style={{ fontSize: 11.5 }}>กลับรายการโดย <span className="mono">{v.reversedBy}</span></div>}
                                {v.reverseOf && <div style={{ fontSize: 11.5 }}><span className="chip warning">รายการกลับ</span></div>}
                              </td>
                              <td style={{ fontSize: 12 }}>{v.by}</td>
                              <td className="right mono">{window.fmt.money(v.dr)}</td>
                              <td className="right mono">{window.fmt.money(v.cr)}</td>
                              <td className={"right mono" + (diff !== 0 ? ' plg-diff-bad' : '')}>{window.fmt.money(diff)}</td>
                              <td className="center"><span className={"pill " + st.pill} title={v.cancelReason || undefined}>{st.label}</span></td>
                              <td className="center">
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button className="btn sm ex-row-btn" onClick={() => setViewV(v)}><Icon name="eye" size={13} /> ดู</button>
                                  {v.status === 'pending' && (
                                    <button className="btn sm ex-row-btn del" title="ยกเลิกรายการ (ยังไม่ผ่านไปแยกประเภท)" onClick={() => askCancel([v.id])}>ยกเลิก</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="plg-foot">
                    <td colSpan={6} className="right">รวมทั้งหมด ({live.length} รายการ)</td>
                    <td className="right mono">{window.fmt.money(grandDr)}</td>
                    <td className="right mono">{window.fmt.money(grandCr)}</td>
                    <td className="right mono">{window.fmt.money(grandDr - grandCr)}</td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ── สรุปยอดที่เลือก ── */}
        <aside className="plg-aside">
          <div className="search-card plg-sum-card">
            <div className="plg-sum-head">สรุปยอดที่เลือก</div>
            <PlgSummaryRow label="จำนวน Voucher" value={sum.vc} unit="รายการ" />
            <PlgSummaryRow label="จำนวนรายการบัญชี" value={sum.lines} unit="รายการ" />
            <div className="plg-sum-div" />
            <PlgSummaryRow label="เดบิตรวม" value={window.fmt.money(sum.dr)} unit="บาท" tone="dr" />
            <PlgSummaryRow label="เครดิตรวม" value={window.fmt.money(sum.cr)} unit="บาท" tone="cr" />
            <PlgSummaryRow label="ผลต่างรวม" value={window.fmt.money(sumDiff)} unit="บาท" tone={sumDiff === 0 ? 'ok' : 'bad'} />
            {sum.vc > 0 && sumDiff !== 0 && (
              <div className="plg-sum-warn"><Icon name="info" size={12} /> เดบิตและเครดิตไม่สมดุล ไม่สามารถผ่านรายการได้</div>
            )}
          </div>
        </aside>
      </div>

      {/* ── ข้อมูลการผ่านรายการ ── */}
      <div className="search-card" style={{ marginTop: 14, padding: 18 }}>
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการผ่านรายการ</h3></div>
        <div className="plg-post-grid">
          <div className="plg-field">
            <label className="cfg-label">งวดบัญชี</label>
            <input className="cfg-input" value="07/2569 (เดือนกรกฎาคม 2569)" readOnly />
          </div>
          <div className="plg-field">
            <label className="cfg-label">วันที่ผ่านรายการ</label>
            <window.ThaiDateField value={postDate} onChange={setPostDate} />
          </div>
          <div className="plg-field">
            <label className="cfg-label">เลขที่ชุดผ่านรายการ (Batch No.)</label>
            <input className="cfg-input mono" value={batchNo} placeholder="ระบบจะกำหนดให้อัตโนมัติ" readOnly />
          </div>
          <div className="plg-field">
            <label className="cfg-label">ผู้ผ่านรายการ</label>
            <input className="cfg-input" value="น.ส.กัญญารณี" readOnly />
          </div>
          <div className="plg-field plg-note">
            <label className="cfg-label">หมายเหตุ</label>
            <input className="cfg-input" placeholder="ระบุหมายเหตุ (ถ้ามี)" maxLength={200} />
          </div>
        </div>
      </div>

      {viewV && (() => {
        const st = PLG_STATUS[viewV.status];
        return (
          <>
            <div className="modal-backdrop" onClick={() => setViewV(null)} />
            <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520, maxWidth: '94vw' }}>
              <div className="modal-head">
                <div style={{ minWidth: 0 }}>
                  <h2>Voucher <span className="mono">{viewV.id}</span></h2>
                  <div className="muted" style={{ fontSize: 11 }}>{(PLG_GROUPS.find(g => g.type === viewV.type) || {}).label}</div>
                </div>
                <button className="close-btn" onClick={() => setViewV(null)} aria-label="ปิด"><Icon name="close" /></button>
              </div>
              <div className="modal-body">
                <div className="plg-cf-grid">
                  <div><span>วันที่รายการ</span><b className="mono">{window.fmt.date(viewV.date)}</b></div>
                  <div><span>สถานะ</span><b><span className={'pill ' + st.pill}>{st.label}</span></b></div>
                  <div style={{ gridColumn: '1 / -1' }}><span>รายละเอียด</span><b>{viewV.desc}</b></div>
                  <div><span>ผู้บันทึก</span><b>{viewV.by}</b></div>
                  <div><span>จำนวนรายการบัญชี</span><b>{viewV.lines} รายการ</b></div>
                  <div><span>เดบิต</span><b className="mono">{window.fmt.money(viewV.dr)} บาท</b></div>
                  <div><span>เครดิต</span><b className="mono">{window.fmt.money(viewV.cr)} บาท</b></div>
                  {viewV.cancelReason && <div style={{ gridColumn: '1 / -1' }}><span>เหตุผลการยกเลิก</span><b>{viewV.cancelReason}</b></div>}
                  {viewV.reversedBy && <div style={{ gridColumn: '1 / -1' }}><span>กลับรายการโดย</span><b className="mono">{viewV.reversedBy}</b></div>}
                  {viewV.reverseOf && <div style={{ gridColumn: '1 / -1' }}><span>กลับรายการของ</span><b className="mono">{viewV.reverseOf}</b></div>}
                </div>
              </div>
              <div className="modal-foot"><button className="btn" onClick={() => setViewV(null)}>ปิด</button></div>
            </div>
          </>
        );
      })()}

      {cancelAsk && (() => {
        const list = rows.filter(r => cancelAsk.ids.includes(r.id));
        const ok = cReason && (cReason !== 'อื่นๆ' || cNote.trim());
        return (
          <>
            <div className="modal-backdrop" onClick={() => setCancelAsk(null)} />
            <div className="dep-dlg danger" role="dialog" aria-modal="true">
              <button className="dep-dlg-x" onClick={() => setCancelAsk(null)} aria-label="ปิด"><Icon name="close" size={16} /></button>
              <div className="dep-dlg-ico"><Icon name="info" size={30} /></div>
              <h2 className="dep-dlg-t">ยืนยันการยกเลิกรายการ</h2>
              <div className="dep-dlg-d">ต้องการยกเลิก {list.length === 1 ? <b className="mono">{list[0].id}</b> : <b>{list.length} Voucher</b>} ใช่หรือไม่? — รายการยังไม่ผ่านไปแยกประเภท จึงยกเลิกได้โดยไม่ต้องกลับรายการ</div>
              <div className="dep-dlg-body" style={{ textAlign: 'left' }}>
                <label className="cfg-label">เหตุผลการยกเลิก <span className="cfg-required">*</span></label>
                <select className="cfg-input" value={cReason} onChange={e => setCReason(e.target.value)}>
                  <option value="">— เลือกเหตุผล —</option>
                  {PLG_CANCEL_REASONS.map(x => <option key={x}>{x}</option>)}
                </select>
                {cReason === 'อื่นๆ' && <input className="cfg-input" style={{ marginTop: 8 }} value={cNote} onChange={e => setCNote(e.target.value)} placeholder="ระบุเหตุผล" />}
              </div>
              <div className="dep-dlg-foot">
                <button className="btn" onClick={() => setCancelAsk(null)}>ไม่ยกเลิก</button>
                <button className="btn danger" disabled={!ok} onClick={doCancel}>ยกเลิกรายการ</button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── หน้าต่างยืนยันการผ่านรายการ ── */}
      {confirm && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirm(false)} />
          <div className="modal-card plg-confirm" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div className="modal-warnico" style={{ background: 'var(--brand-soft)', color: 'var(--brand-700)' }}><Icon name="check" size={20} /></div>
              <div style={{ minWidth: 0 }}>
                <h2>ยืนยันการผ่านรายการไปแยกประเภท</h2>
                <div className="muted" style={{ fontSize: 11 }}>ตรวจสอบข้อมูลสรุปก่อนบันทึกเข้าบัญชีแยกประเภท</div>
              </div>
              <button className="close-btn" onClick={() => setConfirm(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <div className="plg-cf-lead">
                ต้องการผ่านรายการจำนวน <b>{sum.vc} Voucher</b> ไปยังบัญชีแยกประเภทใช่หรือไม่
              </div>
              <div className="plg-cf-grid">
                <div><span>ช่วงวันที่รายการ</span><b className="mono">{window.fmt.date(from)} – {window.fmt.date(to)}</b></div>
                <div><span>งวดบัญชี</span><b>07/2569</b></div>
                <div><span>จำนวน Voucher</span><b>{sum.vc} รายการ</b></div>
                <div><span>จำนวนรายการบัญชี</span><b>{sum.lines} รายการ</b></div>
                <div><span>ยอดเดบิตรวม</span><b className="mono">{window.fmt.money(sum.dr)} บาท</b></div>
                <div><span>ยอดเครดิตรวม</span><b className="mono">{window.fmt.money(sum.cr)} บาท</b></div>
                <div><span>ผลต่างรวม</span><b className="mono" style={{ color: 'var(--success, #237450)' }}>{window.fmt.money(sumDiff)} บาท</b></div>
                <div><span>ผู้ดำเนินการ</span><b>น.ส.กัญญารณี</b></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setConfirm(false)}>ยกเลิก</button>
              <button className="btn primary" onClick={doPost}><Icon name="check" size={13} /> ยืนยันผ่านรายการ</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { PostToLedgerPage });
