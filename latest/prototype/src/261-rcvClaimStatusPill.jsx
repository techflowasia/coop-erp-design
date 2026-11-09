// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญรับ — อ้างอิงทะเบียนขอสินไหม
//   · RcvClaimSearchModal — ค้นหา/เลือกคำขอสินไหมมาผูกกับใบสำคัญรับ
//   · RcvClaimReportModal — รายงานเทียบ "ยอดที่ขอสินไหม" กับ "ยอดรับจริง"
//  ใช้ทะเบียนขอสินไหม (window.crLoad / window.rcvClaimRefList / rcvClaimReport)
// ════════════════════════════════════════════════════════════════════

// ─── ป้ายสถานะคำขอสินไหม (ใช้ CR_STATUS ถ้ามี) ───────────────────────
function rcvClaimStatusPill(k) {
  const s = window.crStatus ? window.crStatus(k) : { l: k, pill: 'neutral' };
  return <span className={"pill " + s.pill}>{s.l}</span>;
}

// ════════════════════════════════════════════════════════════════════
//  Popup — ค้นหาทะเบียนขอสินไหม
// ════════════════════════════════════════════════════════════════════
function RcvClaimSearchModal({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const all = React.useMemo(() => (window.rcvClaimRefList ? window.rcvClaimRefList() : []), []);
  const results = q.trim()
    ? all.filter(c => (c.claimNo + c.memberCode + c.memberName + c.company).toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 720 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="guarantee" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>อ้างอิงทะเบียนขอสินไหม</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกคำขอสินไหมที่บริษัทประกันจ่ายเงินมาที่สหกรณ์ — ระบบจะผูกใบสำคัญรับกับเลขที่คำขอและตั้งยอดรับให้อัตโนมัติ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขที่คำขอ, เลขสมาชิก, ชื่อสมาชิก, บริษัทประกัน…" />
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 380 }}>
            <table className="tbl">
              <thead><tr>
                <th style={{ width: 128 }}>เลขที่คำขอ</th>
                <th style={{ minWidth: 190 }}>สมาชิก / บริษัทประกัน</th>
                <th className="right" style={{ width: 108 }}>ยอดที่ขอ</th>
                <th className="right" style={{ width: 108 }}>อนุมัติ / รับจริง</th>
                <th className="center" style={{ width: 128 }}>สถานะ</th>
                <th style={{ width: 40 }} />
              </tr></thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่พบคำขอสินไหมที่พร้อมอ้างอิง (สถานะตั้งแต่ “ส่งบริษัทประกัน” ขึ้นไป)</td></tr>
                ) : results.map(c => (
                  <tr key={c.claimNo} className="clickable" onClick={() => onPick(c)}>
                    <td className="mono">{c.claimNo}</td>
                    <td>
                      <div className="lt-row-name">{c.memberName}</div>
                      <div className="lt-row-note muted">{c.memberCode} · {c.company}</div>
                    </td>
                    <td className="right mono">{fmt.money(c.estimate, 0)}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(c.actual, 0)}</td>
                    <td className="center">{rcvClaimStatusPill(c.status)}</td>
                    <td className="center"><button className="btn ghost sm" style={{ padding: '0 6px' }}
                            onClick={(e) => { e.stopPropagation(); onPick(c); }}><Icon name="chevRight" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
            <Icon name="info" size={11} /> “ยอดที่ขอ” = วงเงินคุ้มครอง/ประมาณการที่ยื่นขอ · “อนุมัติ/รับจริง” = ยอดที่บริษัทประกันอนุมัติจ่าย
          </p>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Popup — รายงานสรุปการรับเงินสินไหม (ขอ vs รับจริง)
// ════════════════════════════════════════════════════════════════════
function RcvClaimReportModal({ receipts, onClose, onOpenReceipt }) {
  const [expanded, setExpanded] = useState(null);
  const rows = React.useMemo(() => (window.rcvClaimReport ? window.rcvClaimReport(receipts) : []), [receipts]);
  const totals = rows.reduce((t, r) => {
    t.estimate += r.estimate; t.actual += r.actual; t.received += r.received; return t;
  }, { estimate: 0, actual: 0, received: 0 });
  const outstanding = Math.max(0, totals.actual - totals.received);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 940, maxWidth: '96vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>รายงานการรับเงินสินไหม — ยอดที่ขอ vs ยอดรับจริง</h2>
            <div className="muted" style={{ fontSize: 11 }}>สรุปต่อคำขอสินไหม: ยอดที่ขอ · ยอดที่บริษัทประกันอนุมัติ · ยอดที่รับเข้าจริงผ่านใบสำคัญรับ · ผลต่างที่ยังต้องติดตาม</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="rcv-claim-kpi">
            <div className="rcv-claim-kpi-item"><span className="k">ยอดที่ขอสินไหมรวม</span><span className="v mono">{fmt.money(totals.estimate, 0)}</span></div>
            <div className="rcv-claim-kpi-item"><span className="k">ยอดอนุมัติรวม</span><span className="v mono">{fmt.money(totals.actual, 0)}</span></div>
            <div className="rcv-claim-kpi-item ok"><span className="k">รับเข้าจริงรวม</span><span className="v mono">{fmt.money(totals.received, 0)}</span></div>
            <div className={"rcv-claim-kpi-item" + (outstanding > 0 ? ' warn' : '')}><span className="k">คงเหลือรอรับ</span><span className="v mono">{fmt.money(outstanding, 0)}</span></div>
          </div>

          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 420 }}>
            <table className="tbl" style={{ minWidth: 880 }}>
              <thead><tr>
                <th style={{ width: 126 }}>เลขที่คำขอ</th>
                <th style={{ minWidth: 180 }}>สมาชิก / บริษัทประกัน</th>
                <th className="right" style={{ width: 110 }}>ยอดที่ขอ</th>
                <th className="right" style={{ width: 110 }}>อนุมัติ</th>
                <th className="right" style={{ width: 110 }}>รับเข้าจริง</th>
                <th className="right" style={{ width: 104 }}>ผลต่าง</th>
                <th className="center" style={{ width: 130 }}>สถานะรับเงิน</th>
              </tr></thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan="7" className="center muted" style={{ padding: '28px 12px' }}>ยังไม่มีคำขอสินไหมในทะเบียน</td></tr>
                )}
                {rows.map(r => {
                  const isOpen = expanded === r.claimNo;
                  return (
                    <React.Fragment key={r.claimNo}>
                      <tr className="clickable" onClick={() => setExpanded(isOpen ? null : r.claimNo)}>
                        <td className="mono">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon name={isOpen ? 'chevDown' : 'chevRight'} size={12} />{r.claimNo}
                          </span>
                        </td>
                        <td>
                          <div className="lt-row-name">{r.memberName}</div>
                          <div className="lt-row-note muted">{r.memberCode} · {r.company}</div>
                        </td>
                        <td className="right mono">{fmt.money(r.estimate, 0)}</td>
                        <td className="right mono">{fmt.money(r.actual, 0)}</td>
                        <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(r.received, 0)}</td>
                        <td className="right mono" style={{ color: r.diff > 0.005 ? 'var(--warning, #C77700)' : r.diff < -0.005 ? 'var(--danger)' : 'var(--ink-3, #6b6b6b)' }}>
                          {r.diff === 0 ? '—' : fmt.money(r.diff, 0)}
                        </td>
                        <td className="center"><span className={"pill " + ({ ok: 'ok', warn: 'warn', bad: 'bad', neutral: 'neutral' }[r.tone] || 'neutral')}>{r.statusLabel}</span></td>
                      </tr>
                      {isOpen && (
                        <tr className="rcv-claim-sub">
                          <td colSpan="7">
                            <div className="rcv-claim-sub-wrap">
                              <div className="rcv-claim-sub-head">ใบสำคัญรับที่ผูกกับคำขอนี้</div>
                              {r.rvs.length === 0 ? (
                                <div className="muted" style={{ fontSize: 12 }}>ยังไม่มีใบสำคัญรับที่ผูกกับคำขอสินไหมนี้</div>
                              ) : (
                                <table className="tbl" style={{ minWidth: 520 }}>
                                  <thead><tr>
                                    <th style={{ width: 150 }}>เลขที่ใบสำคัญรับ</th>
                                    <th style={{ width: 120 }}>วันที่</th>
                                    <th className="right" style={{ width: 130 }}>ยอดรับ (บาท)</th>
                                    <th className="center" style={{ width: 130 }}>สถานะ</th>
                                  </tr></thead>
                                  <tbody>
                                    {r.rvs.map(v => {
                                      const st = window.RCV_STATUS[v.status] || { l: v.status, pill: 'neutral' };
                                      return (
                                        <tr key={v.id} className={onOpenReceipt ? 'clickable' : ''} onClick={() => onOpenReceipt && onOpenReceipt(v.id)}>
                                          <td className="mono">{v.id}</td>
                                          <td className="mono" style={{ fontSize: 12 }}>{fmt.date(v.date)}</td>
                                          <td className="right mono">{fmt.money(v.amount, 2)}</td>
                                          <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
            <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูใบสำคัญรับที่ผูกกับคำขอ · ผลต่าง = ยอดอนุมัติ − ยอดรับเข้าจริง (นับเฉพาะใบสำคัญรับที่ยังไม่ยกเลิก)
          </p>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="muted" style={{ fontSize: 12 }}>{rows.length} คำขอสินไหม</span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { RcvClaimSearchModal, RcvClaimReportModal });

// ════════════════════════════════════════════════════════════════════
//  Popup — ค้นหาเอกสารอ้างอิงจากระบบ (รูปแบบเดียวกับ "ค้นหาสัญญา" ใน DS)
//  ค้นหาด้วย: รหัสสมาชิก · ชื่อ · นามสกุล · เลขบัตรประชาชน ·
//             ประเภทเอกสาร · เลขที่เอกสาร → ผลลัพธ์จัดกลุ่มตามสมาชิก
//  แหล่งเอกสาร: สัญญาเงินกู้ · บัญชีเงินฝาก · ลูกหนี้ตัวแทน · ทะเบียนขอสินไหม
// ════════════════════════════════════════════════════════════════════
const rcvNorm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
const rcvInitial = (name) => String(name || '?').replace(/^(นาย|นาง|นางสาว|บจก\.|หจก\.|บมจ\.)\s*/, '').slice(0, 1);

// หาข้อมูลสมาชิกจากรหัส (ชื่อ · เลขบัตร · หน่วยงาน) จากหลายแหล่ง
function rcvResolveMember(code) {
  if (!code) return { code: '', name: '', citizenId: '', unit: '' };
  const p = (window.RCV_PAYERS || []).find(x => x.code === code || x.memberNo === code);
  if (p) return { code: p.code, name: p.name, citizenId: String(p.taxId || '').replace(/\D/g, ''), unit: p.dept || '' };
  const m = (window.CL_MEMBERS || []).find(x => x.code === code);
  if (m) return { code: m.code, name: m.name, citizenId: String(m.citizenId || '').replace(/\D/g, ''), unit: m.dept || '' };
  const ml = (window.MEMBERS_LIST || []).find(x => x.code === code);
  if (ml) return { code: ml.code, name: ml.name, citizenId: String(ml.citizenId || '').replace(/\D/g, ''), unit: ml.dept || '' };
  return { code, name: '', citizenId: '', unit: '' };
}

// ประเภทเอกสารอ้างอิง
const RCV_REF_DOC_TYPES = [
  { key: 'loan',    label: 'สัญญาเงินกู้' },
  { key: 'deposit', label: 'บัญชีเงินฝาก' },
  { key: 'agent',   label: 'ลูกหนี้ตัวแทน' },
  { key: 'claim',   label: 'ทะเบียนขอสินไหม' },
];

// รวมเอกสารอ้างอิงทั้งหมด → แต่ละแถวผูกกับสมาชิก
function rcvRefDocRows() {
  const rows = [];
  (window.RCV_LOAN_DUE || []).forEach(c => {
    const m = rcvResolveMember(c.memberNo);
    rows.push({ id: c.contractNo, typeKey: 'loan', type: 'สัญญาเงินกู้', desc: 'เงินกู้ค้างชำระ',
      member: { code: c.memberNo, name: c.name || m.name, citizenId: m.citizenId, unit: m.unit }, note: '' });
  });
  (window.RCV_DEPOSIT_DUE || []).forEach(c => {
    const m = rcvResolveMember(c.memberNo);
    rows.push({ id: c.acctNo, typeKey: 'deposit', type: 'บัญชีเงินฝาก', desc: 'บัญชี' + c.kind,
      member: { code: c.memberNo, name: c.name || m.name, citizenId: m.citizenId, unit: m.unit }, note: '' });
  });
  (window.RCV_AGENT_DUE || []).forEach(a => {
    const ag = (window.RCV_PAYERS || []).find(p => p.code === a.agentCode) || {};
    rows.push({ id: a.ref, typeKey: 'agent', type: 'ลูกหนี้ตัวแทน', desc: a.label,
      member: { code: a.agentCode, name: ag.name || '', citizenId: String(ag.taxId || '').replace(/\D/g, ''), unit: ag.dept || '' }, note: '' });
  });
  (window.rcvClaimRefList ? window.rcvClaimRefList() : []).forEach(c => {
    const m = rcvResolveMember(c.memberCode);
    rows.push({ id: c.claimNo, typeKey: 'claim', type: 'ทะเบียนขอสินไหม', desc: 'สินไหม · ' + c.company,
      member: { code: c.memberCode, name: c.memberName || m.name, citizenId: m.citizenId, unit: m.unit },
      note: 'รับเงินค่าสินไหมจากบริษัทประกัน — สมาชิก ' + c.memberCode });
  });
  return rows;
}

function RcvRefDocModal({ current, onPick, onClose }) {
  const allRows = React.useMemo(rcvRefDocRows, []);
  const [c, setC] = useState({ docNo: '', docType: 'all', code: '', firstName: '', lastName: '', citizenId: '' });
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const filter = (crit) => {
    const dn = rcvNorm(crit.docNo), code = rcvNorm(crit.code), fn = rcvNorm(crit.firstName),
          ln = rcvNorm(crit.lastName), cid = rcvNorm(crit.citizenId), dt = crit.docType;
    return allRows.filter(r => {
      const name = rcvNorm(r.member.name);
      return (dt === 'all' || r.typeKey === dt)
        && (!dn || rcvNorm(r.id).includes(dn))
        && (!code || rcvNorm(r.member.code).includes(code))
        && (!fn || name.includes(fn))
        && (!ln || name.includes(ln))
        && (!cid || rcvNorm(r.member.citizenId).includes(cid));
    });
  };
  const [rows, setRows] = useState(() => allRows);
  const [dirty, setDirty] = useState(false);
  const run = () => { setRows(filter(c)); setDirty(true); };
  const reset = () => { setC({ docNo: '', docType: 'all', code: '', firstName: '', lastName: '', citizenId: '' }); setRows(allRows); setDirty(false); };

  // จัดกลุ่มตามสมาชิก
  const groups = []; const idx = {};
  rows.forEach(r => {
    const key = r.member.code || '—';
    let g = idx[key];
    if (!g) { g = idx[key] = { member: r.member, items: [] }; groups.push(g); }
    g.items.push(r);
  });

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 940, maxWidth: '96vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ค้นหาเอกสารอ้างอิง</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกเอกสารต้นทางจากระบบเพื่อผูกเป็นเลขที่เอกสารอ้างอิง</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. รหัสสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-058241" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. ชื่อ</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อจริง" />
            </label>
            <label className="gc-sf">
              <span>3. นามสกุล</span>
              <input value={c.lastName} onChange={(e) => set('lastName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="นามสกุล" />
            </label>
            <label className="gc-sf">
              <span>4. เลขบัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลข 13 หลัก" className="mono" />
            </label>
            <label className="gc-sf">
              <span>5. ประเภทเอกสาร</span>
              <select value={c.docType} onChange={(e) => set('docType', e.target.value)}>
                <option value="all">ทุกประเภท</option>
                {RCV_REF_DOC_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
            <label className="gc-sf">
              <span>6. เลขที่เอกสาร</span>
              <input value={c.docNo} onChange={(e) => set('docNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขที่เอกสาร" className="mono" />
            </label>
            <div className="gc-sf-actions">
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการเอกสารอ้างอิง{' '}
            <span className="muted" style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              · พบ {rows.length} เอกสาร{groups.length > 1 ? ` จาก ${groups.length} สมาชิก` : ''}
            </span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl cs-tbl">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>เลขที่เอกสาร</th>
                  <th style={{ width: 150 }}>ประเภทเอกสาร</th>
                  <th>รายละเอียด</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">
                    {dirty ? 'ไม่พบเอกสารที่ตรงกับเงื่อนไข' : 'ระบุเงื่อนไข แล้วกดค้นหา'}
                  </td></tr>
                ) : groups.map(g => (
                  <React.Fragment key={g.member.code}>
                    <tr className="cs-group">
                      <td colSpan="4">
                        <div className="cs-group-row">
                          <span className="row-avatar">{rcvInitial(g.member.name)}</span>
                          <span className="cs-group-code mono">{g.member.code}</span>
                          <span className="cs-group-name">{g.member.name || '—'}</span>
                          {g.member.unit && <span className="cs-group-unit muted">· {g.member.unit}</span>}
                          {g.member.citizenId && <span className="cs-group-unit muted mono">· {g.member.citizenId}</span>}
                          <span className="cs-group-count muted">{g.items.length} เอกสาร</span>
                        </div>
                      </td>
                    </tr>
                    {g.items.map(it => (
                      <tr key={g.member.code + '/' + it.id} className="clickable cs-crow" onClick={() => onPick(it)}>
                        <td className="mono"><span className="cs-indent" />{it.id}</td>
                        <td><span className="chip">{it.type}</span></td>
                        <td className="muted">{it.desc}</td>
                        <td className="center">
                          {current === it.id
                            ? <Icon name="check" size={14} />
                            : <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                      onClick={(e) => { e.stopPropagation(); onPick(it); }} title="เลือกเอกสาร"><Icon name="chevRight" /></button>}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { RcvRefDocModal });
