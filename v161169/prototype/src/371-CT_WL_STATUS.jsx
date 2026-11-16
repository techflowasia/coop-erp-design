// ════════════════════════════════════════════════════════════════════
//  บอกเลิกสัญญา — รายการสัญญาผิดนัด (worklist) + ทะเบียนหนังสือ + รายละเอียด
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
// ════════════════════════════════════════════════════════════════════

// สถานะของแถวใน worklist (รอบอกเลิก / อยู่ระหว่างทำรายการ / ออกหนังสือแล้ว)
const CT_WL_STATUS = {
  eligible:   { l: 'รอบอกเลิก',          pill: 'warn' },
  processing: { l: 'อยู่ระหว่างทำรายการ', pill: 'info' },
  issued:     { l: 'ออกหนังสือแล้ว',     pill: 'ok' },
};

// ─── แท็บสลับมุมมอง (worklist / register) ───────────────────────────
function CtViewTabs({ tab, onTab, wlCount, regCount }) {
  return (
    <div className="tabs-bar" style={{ marginBottom: 14 }}>
      <button className={'tab' + (tab === 'worklist' ? ' active' : '')} onClick={() => onTab('worklist')}>
        สัญญาผิดนัดชำระ <span className="count">{wlCount}</span>
      </button>
      <button className={'tab' + (tab === 'register' ? ' active' : '')} onClick={() => onTab('register')}>
        ทะเบียนหนังสือบอกเลิกสัญญา <span className="count">{regCount}</span>
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  มุมมองที่ 1 — รายการสัญญาผิดนัดชำระ (worklist)
// ════════════════════════════════════════════════════════════════════
function CtWorklistView({ contracts, records, onProcess }) {
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [typeF, setTypeF] = useState('all');

  const types = useMemo(() => [...new Set(contracts.map(c => c.loanType))], [contracts]);

  // ทำเครื่องหมายสัญญาที่ออกหนังสือแล้ว (ผูกกับ record)
  const issuedMap = useMemo(() => {
    const m = {};
    records.forEach(r => (r.contracts || []).forEach(c => { if (r.status !== 'cancelled') m[c.contractNo] = r; }));
    return m;
  }, [records]);

  const rows = useMemo(() => {
    let r = contracts.map(c => ({ ...c, _rec: issuedMap[c.contractNo] || null,
      _status: issuedMap[c.contractNo] ? 'issued' : c.status }));
    if (q.trim()) {
      const n = q.toLowerCase().replace(/[\s-]/g, '');
      const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
      r = r.filter(x => norm(x.contractNo).includes(n) || norm(x.memberCode).includes(n) ||
                        norm(x.memberName).includes(n) || norm(x.dept).includes(n));
    }
    if (statusF !== 'all') r = r.filter(x => x._status === statusF);
    if (typeF !== 'all') r = r.filter(x => x.loanType === typeF);
    return r.sort((a, b) => b.overdueInstallments - a.overdueInstallments);
  }, [contracts, issuedMap, q, statusF, typeF]);

  const hasFilter = q || statusF !== 'all' || typeF !== 'all';
  const clear = () => { setQ(''); setStatusF('all'); setTypeF('all'); };

  const totalOutstanding = contracts.reduce((s, c) => s + window.ctContractTotal(c), 0);
  const eligibleCnt = contracts.filter(c => !issuedMap[c.contractNo] && c.status === 'eligible').length;
  const issuedCnt = contracts.filter(c => issuedMap[c.contractNo]).length;

  return (
    <>
      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">สัญญาผิดนัดชำระ</div>
          <div className="stat-value">{fmt.int(contracts.length)}</div>
          <div className="stat-sub">สัญญา</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">รอบอกเลิก</div>
          <div className="stat-value">{fmt.int(eligibleCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>ยังไม่ได้ทำรายการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ออกหนังสือแล้ว</div>
          <div className="stat-value">{fmt.int(issuedCnt)}</div>
          <div className="stat-sub">มีหนังสือบอกเลิก</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่สัญญา / สมาชิก / ชื่อ / สังกัด</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น L-2021-0332, M-066238" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทเงินกู้</span>
            <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ width: 200 }}>
              <option value="all">ทุกประเภท</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 180 }}>
              <option value="all">ทุกสถานะ</option>
              {Object.entries(CT_WL_STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
            </select>
          </div>
          {hasFilter && <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> สัญญา</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>สัญญา</th>
                <th>ประเภทเงินกู้</th>
                <th>ผู้กู้ลูกหนี้</th>
                <th className="center">งวดค้าง</th>
                <th className="center">ชำระล่าสุด</th>
                <th className="num">คงเหลือ</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 150 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบสัญญาผิดนัดที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(c => {
                const wl = CT_WL_STATUS[c._status] || CT_WL_STATUS.eligible;
                const tot = window.ctContractTotal(c);
                return (
                  <tr key={c.contractNo}>
                    <td className="mono">{c.contractNo}</td>
                    <td style={{ fontSize: 12 }}>
                      {c.loanType}
                      {c.restructured && <div><span className="chip warning" style={{ fontSize: 10 }}>ปรับโครงสร้าง</span></div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{c.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{c.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{c.memberCode} · {c.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td className="center"><span className="chip danger">{c.overdueInstallments} งวด</span></td>
                    <td className="center mono" style={{ fontSize: 12 }}>{fmt.date(c.lastPayDate)}</td>
                    <td className="num"><b>{fmt.money(tot, 2)}</b></td>
                    <td className="center"><span className={'pill ' + wl.pill}>{wl.l}</span></td>
                    <td className="center">
                      {c._rec ? (
                        <span className="muted mono" style={{ fontSize: 11 }}>{c._rec.id}</span>
                      ) : (
                        <button className="btn primary sm" onClick={() => onProcess(c)}>
                          <Icon name="edit" size={12} /> ทำรายการบอกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> ระบบแสดงเฉพาะสัญญาที่ผิดนัดชำระและยังมีหนี้คงเหลือ — สัญญาที่ปิดแล้วจะไม่ปรากฏ (BR-02)
        </p>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  มุมมองที่ 2 — ทะเบียนหนังสือบอกเลิกสัญญา
// ════════════════════════════════════════════════════════════════════
function CtRegisterView({ list, onOpen, onPrint, onEmsScan, onEmsQuick }) {
  const [q, setQ] = useState('');
  const [caseF, setCaseF] = useState('all');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) || x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) || (x.docNo || '').toLowerCase().includes(n));
    }
    if (caseF !== 'all') r = r.filter(x => x.caseCode === caseF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.regDate.localeCompare(a.regDate) || b.id.localeCompare(a.id));
  }, [list, q, caseF, statusF]);

  const hasFilter = q || caseF !== 'all' || statusF !== 'all';
  const clear = () => { setQ(''); setCaseF('all'); setStatusF('all'); };

  return (
    <div className="search-card">
      <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="muted" style={{ fontSize: 11 }}>ทะเบียนบอกเลิก / เลขหนังสือ / สมาชิก / ชื่อ</span>
          <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น BOL-2569-000001" style={{ height: 30 }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="muted" style={{ fontSize: 11 }}>กรณีบอกเลิก</span>
          <select className="filter-select" value={caseF} onChange={(e) => setCaseF(e.target.value)} style={{ width: 220 }}>
            <option value="all">ทุกกรณี</option>
            {window.CT_CASES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
          <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 160 }}>
            <option value="all">ทุกสถานะ</option>
            {window.CT_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>
        {hasFilter && <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>}
        <span className="spacer" />
        <button className="btn sm" onClick={onEmsScan}><Icon name="barcode" /> อัปเดตเลข EMS (สแกน)</button>
        <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
      </div>

      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>ทะเบียนบอกเลิก</th>
              <th>เลขที่หนังสือ</th>
              <th>ผู้กู้ลูกหนี้</th>
              <th>กรณีบอกเลิก</th>
              <th className="center">วันที่รายการ</th>
              <th className="num">หนี้คงเหลือ</th>
              <th className="center">สถานะ</th>
              <th>เลขนำส่ง EMS</th>
              <th className="center" style={{ width: 130 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan="9" className="empty-state">
                <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                ยังไม่มีหนังสือบอกเลิกสัญญาที่ตรงกับเงื่อนไข
              </td></tr>
            ) : rows.map(r => {
              const st = window.ctStatus(r.status);
              const c = window.ctCase(r.caseCode) || {};
              return (
                <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                  <td className="mono">{r.id}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.docNo}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                        <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.dept}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{r.caseCode === 'TC99' ? (r.caseOther || c.label) : c.label}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{fmt.date(r.regDate)}</td>
                  <td className="num"><b>{fmt.money(r.totalOutstanding, 2)}</b></td>
                  <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.emsNo || <span className="muted">—</span>}</td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', gap: 2 }}>
                      <button className="bud-act" title="ดูรายละเอียด" onClick={() => onOpen(r)}><Icon name="eye" size={13} /></button>
                      <button className="bud-act" title="อัปเดตเลข EMS" onClick={() => onEmsQuick(r)}><Icon name="barcode" size={13} /></button>
                      <button className="bud-act" title="พิมพ์หนังสือ" onClick={() => onPrint(r)}><Icon name="print" size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}

// ─── แถวรายละเอียด ──────────────────────────────────────────────────
function CtDetailRow({ label, value, mono }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}

// ─── Modal บันทึก/แก้ไขเลขนำส่ง EMS (หลังจัดทำหนังสือเรียบร้อยแล้ว) ───
function CtEmsModal({ rec, onSave, onClose }) {
  const [ems, setEms] = useState(rec.emsNo || '');
  const save = () => { onSave(rec, ems.trim().toUpperCase()); onClose(); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <h2>บันทึกเลขนำส่ง EMS</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 12 }}>
            หนังสือบอกเลิกสัญญา <b className="mono" style={{ color: 'var(--text)' }}>{rec.id}</b> — กรอกเลขพัสดุลงทะเบียน/EMS หลังนำส่งไปรษณีย์ ระบบจะบันทึกวันที่ส่งและปรับสถานะเป็น “ส่งหนังสือแล้ว” ให้อัตโนมัติ
          </p>
          <DnField label="เลขนำส่ง EMS" full>
            <input className="cfg-input mono" autoFocus value={ems}
                   onChange={(e) => setEms(e.target.value.toUpperCase())}
                   onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
                   placeholder="เช่น EI778812345TH" />
          </DnField>
        </div>
        <div className="modal-foot">
          <button className="btn sm" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดหนังสือบอกเลิกสัญญา (อ่านอย่างเดียว)
// ════════════════════════════════════════════════════════════════════
function CtDetailView({ rec, onBack, onPrint, onAdvance, onSaveEms }) {
  const [emsModal, setEmsModal] = useState(false);
  if (!rec) return null;
  const st = window.ctStatus(rec.status);
  const c = window.ctCase(rec.caseCode) || {};
  const caseTxt = rec.caseCode === 'TC99' ? (rec.caseOther || c.label) : c.label;
  const ms = window.CT_MEMBER_STATUS[rec.memberStatus] || { pill: 'neutral' };
  const allGuar = (rec.contracts || []).flatMap(ct => (ct.guarantors || []).map(g => ({ ...g, contractNo: ct.contractNo })));
  // แสดงเฉพาะผู้ค้ำประกัน (ดึงจากรายละเอียดการทำสัญญา) — ฐานะตามคำนำหน้าที่เลือก
  const totalPrincipal = rec.contracts.reduce((s, d) => s + (Number(d.principalRemaining) || 0), 0);
  // ขั้นตอนถัดไปในกระบวนงาน
  const order = ['draft', 'review', 'approve', 'approved', 'printed', 'sent', 'awaiting', 'paid'];
  const idx = order.indexOf(rec.status);
  const nextStatus = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  // หนังสือจัดทำเรียบร้อยแล้ว → เพิ่ม/แก้ไขเลขนำส่ง EMS ได้
  const letterDone = (rec.printCount || 0) > 0 || ['approved', 'printed', 'sent', 'awaiting', 'partial', 'paid', 'legal'].includes(rec.status);

  return (
    <div data-screen-label="หน้ารายละเอียดหนังสือบอกเลิกสัญญา">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        {letterDone && (
          <button className="btn sm" onClick={() => setEmsModal(true)}>
            <Icon name="receipt" /> {rec.emsNo ? 'แก้ไขเลขนำส่ง EMS' : 'บันทึกเลขนำส่ง EMS'}
          </button>
        )}
        {nextStatus && rec.status !== 'cancelled' && (
          <button className="btn sm" onClick={() => onAdvance(rec, nextStatus)}>
            <Icon name="check" /> ปรับเป็น “{window.ctStatus(nextStatus).l}”
          </button>
        )}
        <button className="btn primary sm" onClick={() => onPrint(rec)}><Icon name="print" /> พิมพ์หนังสือ</button>
      </div>

      {/* การ์ดหัวเรื่อง — รูปแบบ DS เดียวกับหน้ารายละเอียดอื่น */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="guarantee" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">หนังสือบอกเลิกสัญญาเงินกู้</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>เลขที่หนังสือ {rec.docNo}</span><span className="dot" />
              <span>บันทึกโดย {rec.enteredBy}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            {rec.printCount > 0 && <span className="chip info"><Icon name="print" size={11} /> พิมพ์แล้ว {rec.printCount} ครั้ง</span>}
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">ผู้กู้ลูกหนี้</span>
            <span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">หนี้คงเหลือที่บอกเลิก</span>
            <span className="lt-date-v" style={{ color: 'var(--danger)', fontWeight: 700 }}>฿ {fmt.money(rec.totalOutstanding, 2)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">กรณีบอกเลิก</span>
            <span className="lt-date-v">{caseTxt}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">สถานะสมาชิก</span>
            <span className="lt-date-v"><span className={'pill ' + ms.pill}>{rec.memberStatus}</span></span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลเอกสาร และการบอกเลิก</h3></div>
        <div className="form-grid">
          <CtDetailRow label="ทะเบียนบอกเลิก" value={rec.id} mono />
          <CtDetailRow label="เลขที่หนังสือ" value={rec.docNo} mono />
          <CtDetailRow label="วันที่รายการ" value={fmt.date(rec.regDate)} />
          <CtDetailRow label="กรณีบอกเลิก" value={caseTxt} />
          <CtDetailRow label="วันที่เริ่มเก็บ" value={rec.collectStartDate ? fmt.date(rec.collectStartDate) : '—'} />
          <CtDetailRow label="มติ คสอ." value={rec.resolutionNo || '—'} />
          <CtDetailRow label="วันที่มติ" value={rec.resolutionDate ? fmt.date(rec.resolutionDate) : '—'} />
          <CtDetailRow label="เลขนำส่ง EMS" value={rec.emsNo || '—'} mono />
          <CtDetailRow label="วันที่ส่งหนังสือ" value={rec.sentDate ? fmt.date(rec.sentDate) : '—'} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลผู้กู้ และที่อยู่จัดส่ง</h3></div>
        <div className="form-grid">
          <CtDetailRow label="ทะเบียนสมาชิก" value={rec.memberCode} mono />
          <CtDetailRow label="ชื่อ-ชื่อสกุล" value={rec.memberName} />
          <CtDetailRow label="สังกัด" value={`${rec.deptCode} · ${rec.dept}`} />
          <CtDetailRow label="เลขบัตรประชาชน" value={rec.citizenId} mono />
          <CtDetailRow label="ทุนเรือนหุ้น" value={'฿ ' + fmt.money(rec.shares, 2)} />
          <CtDetailRow label="ผู้ลงนาม" value={`${rec.signer} · ${rec.signerPosition}`} />
        </div>
        <div className="ct-addr-detail">
          <div className="ct-addr-detail-row">
            <span className="muted">ที่อยู่ตามทะเบียน</span>
            <span>{rec.regAddress || '—'}</span>
          </div>
          <div className="ct-addr-detail-row">
            <span className="muted">ที่อยู่จัดส่งหนังสือ</span>
            <span>
              {rec.useOtherAddress && rec.sendAddress
                ? <>{rec.sendAddress} <span className="chip info" style={{ marginLeft: 4 }}>ที่อยู่อื่นนอกทะเบียน</span></>
                : <>{rec.regAddress || '—'} <span className="chip neutral" style={{ marginLeft: 4 }}>ตามทะเบียน</span></>}
            </span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สัญญาเงินกู้ที่บอกเลิก</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>ประเภท</th><th>สัญญาเลขที่</th><th className="center">วันที่ทำสัญญา</th>
                <th className="num">เงินต้นคงเหลือ</th><th className="num">ดอกเบี้ยค้าง</th>
                <th className="num">ค่าปรับ</th><th className="center">งวดค้าง</th><th className="num">รวมต่อสัญญา</th>
              </tr>
            </thead>
            <tbody>
              {rec.contracts.map((d, i) => (
                <tr key={i}>
                  <td>{d.loanType}</td>
                  <td className="mono">{d.contractNo}</td>
                  <td className="center mono">{fmt.date(d.contractDate)}</td>
                  <td className="num mono">{fmt.money(d.principalRemaining, 2)}</td>
                  <td className="num mono">{fmt.money(d.interestDue, 2)}</td>
                  <td className="num mono">{fmt.money(d.penalty, 2)}</td>
                  <td className="center">{d.overdueInstallments} งวด</td>
                  <td className="num mono"><b>{fmt.money(window.ctContractTotal(d), 2)}</b></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan="3" className="right"><b>รวม</b></td>
                <td className="num mono"><b>{fmt.money(totalPrincipal, 2)}</b></td>
                <td colSpan="3" /><td className="num mono"><b>{fmt.money(rec.totalOutstanding, 2)}</b></td></tr>
            </tfoot>
          </table>
        </div></div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ผู้ค้ำประกัน/ทายาท</h3></div>
        {allGuar.length === 0 ? (
          <div className="empty-state">ไม่มีผู้ค้ำประกันในรายการนี้</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr><th style={{ width: 40 }} className="center">ลำดับ</th><th>สัญญา</th><th>ทะเบียนสมาชิก</th><th>ชื่อ-ชื่อสกุล</th><th>สังกัด</th><th style={{ width: 130 }}>ฐานะ</th><th className="center" style={{ width: 120 }}>สถานะสมาชิก</th></tr>
              </thead>
              <tbody>
                {allGuar.map((g, i) => (
                  <tr key={i}>
                    <td className="center">{i + 1}</td>
                    <td className="mono">{g.contractNo}</td>
                    <td className="mono">{g.memberCode || '—'}</td>
                    <td>{g.name}</td>
                    <td>{g.dept || '—'}</td>
                    <td>{g.prefix ? g.prefix.trim() : 'ผู้ค้ำประกัน'}</td>
                    <td className="center">{g.status ? <span className={'pill ' + window.ctMemberStatusPill(g.status)}>{g.status}</span> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      {emsModal && <CtEmsModal rec={rec} onSave={onSaveEms} onClose={() => setEmsModal(false)} />}
    </div>
  );
}

// ─── ประวัติการทำรายการ ─────────────────────────────────────────────
function CtHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('บอกเลิกสัญญา'))]
    .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)',
                        color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>ประวัติการทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>บอกเลิกสัญญา</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>
              ยังไม่มีประวัติการทำรายการ
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map(e => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="tx-mod">{e.module}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span><span className="sep">·</span><span>{e.role}</span>
                        <span className="sep">·</span><span className="mono muted">{e.id}</span>
                      </div>
                      {e.changes && e.changes.length > 0 && (
                        <div className="tx-changes">
                          {e.changes.map((c, i) => (
                            <div className="tx-change" key={i}>
                              <span className="fld">{c.field}</span>
                              <span className="before">{c.before}</span>
                              <span className="arr">→</span>
                              <span className="after">{c.after}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — worklist / register / form / detail
// ════════════════════════════════════════════════════════════════════
function ContractTerminationPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.ctLoad);
  const [mode, setMode] = useState('list');        // 'list' | 'form' | 'detail'
  const [tab, setTab] = useState('worklist');       // 'worklist' | 'register'
  const [current, setCurrent] = useState(null);
  const [seedContract, setSeedContract] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const [emsScan, setEmsScan] = useState(false);
  const [emsQuick, setEmsQuick] = useState(null);

  const persist = (next) => { setList(next); window.ctSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const doPrint = (rec) => {
    setPrintDoc(rec);
    const updated = {
      ...rec,
      printCount: (rec.printCount || 0) + 1,
      printedDate: window.dnToday(),
      status: ['draft', 'review', 'approve', 'approved'].includes(rec.status) ? 'printed' : rec.status,
    };
    const next = list.map(r => r.id === rec.id ? updated : r);
    persist(next);
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log({
      action: 'print', module: 'ทะเบียนและติดตามหนี้ — บอกเลิกสัญญา',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `พิมพ์หนังสือบอกเลิกสัญญา ${rec.id} (พิมพ์ครั้งที่ ${updated.printCount})`,
      changes: [{ field: 'จำนวนครั้งที่พิมพ์', before: String(rec.printCount || 0), after: String(updated.printCount) }],
    });
    setTimeout(() => window.printContractTermination(onToast), 80);
  };

  const advance = (rec, nextStatus) => {
    const extra = nextStatus === 'sent' ? { sentDate: window.dnToday() }
      : nextStatus === 'paid' ? { closedDate: window.dnToday() } : {};
    const updated = { ...rec, status: nextStatus, ...extra };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — บอกเลิกสัญญา',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ปรับสถานะรายการบอกเลิก ${rec.id} → ${window.ctStatus(nextStatus).l}`,
      changes: [{ field: 'สถานะรายการ', before: window.ctStatus(rec.status).l, after: window.ctStatus(nextStatus).l }],
    });
    onToast && onToast(`ปรับสถานะ ${rec.id} เป็น “${window.ctStatus(nextStatus).l}” แล้ว`);
  };

  const processContract = (c) => { setSeedContract(c); setMode('form'); };

  // บันทึก/แก้ไขเลขนำส่ง EMS หลังจัดทำหนังสือเรียบร้อยแล้ว
  const saveEms = (rec, emsNo) => {
    const before = rec.emsNo || '';
    const setSent = ['draft', 'review', 'approve', 'approved', 'printed'].includes(rec.status);
    const updated = {
      ...rec, emsNo,
      sentDate: rec.sentDate || (emsNo ? window.dnToday() : rec.sentDate),
      status: emsNo && setSent ? 'sent' : rec.status,
    };
    persist(list.map(r => r.id === rec.id ? updated : r));
    if (current && current.id === rec.id) setCurrent(updated);
    audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — บอกเลิกสัญญา',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `บันทึกเลขนำส่ง EMS หนังสือบอกเลิก ${rec.id}${emsNo ? ` · ${emsNo}` : ''}`,
      changes: [{ field: 'เลขนำส่ง EMS', before: before || '—', after: emsNo || '—' }],
    });
    onToast && onToast(emsNo ? `บันทึกเลขนำส่ง EMS ${emsNo} แล้ว` : `ล้างเลขนำส่ง EMS ของ ${rec.id} แล้ว`);
  };

  const submit = (rec, alsoPrint) => {
    persist([rec, ...list]);
    const c = window.ctCase(rec.caseCode) || {};
    audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — บอกเลิกสัญญา',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `บันทึกรายการบอกเลิกสัญญา ${rec.id} · ${rec.memberName} · หนี้คงเหลือ ${fmt.money(rec.totalOutstanding, 2)} บาท`,
      changes: [
        { field: 'ทะเบียนบอกเลิก', before: '—', after: rec.id },
        { field: 'เลขที่หนังสือ', before: '—', after: rec.docNo },
        { field: 'กรณีบอกเลิก', before: '—', after: rec.caseCode === 'TC99' ? rec.caseOther : c.label },
        { field: 'หนี้คงเหลือรวม', before: '—', after: `${fmt.money(rec.totalOutstanding, 2)} บาท` },
      ],
    });
    onToast && onToast(`บันทึกรายการบอกเลิก ${rec.id} · ${rec.memberName} เรียบร้อยแล้ว`);
    setSeedContract(null);
    setMode('list');
    setTab('register');
    if (alsoPrint) doPrint(rec);
  };

  return (
    <>
      {mode === 'form' ? (
        <CtCreateForm list={list} seedContract={seedContract}
                      onSubmit={submit} onCancel={() => { setSeedContract(null); setMode('list'); }} />
      ) : mode === 'detail' ? (
        <CtDetailView rec={current} onBack={() => setMode('list')} onPrint={doPrint} onAdvance={advance} onSaveEms={saveEms} />
      ) : (
        <div data-screen-label="หน้าบอกเลิกสัญญา — รายการสัญญาผิดนัด">
          <div className="page-actions">
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บอกเลิกสัญญา</h1>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                ทะเบียนและติดตามหนี้ · รายการสัญญาที่ผิดนัดชำระ — เลือกสัญญาเพื่อจัดทำหนังสือบอกเลิกสัญญา
              </div>
            </div>
            <span className="spacer" />
            <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติการทำรายการ</button>
          </div>

          <CtViewTabs tab={tab} onTab={setTab} wlCount={window.CT_DEFAULTED.length} regCount={list.length} />

          {tab === 'worklist'
            ? <CtWorklistView contracts={window.CT_DEFAULTED} records={list} onProcess={processContract} />
            : <CtRegisterView list={list} onOpen={openDetail} onPrint={doPrint}
                              onEmsScan={() => setEmsScan(true)} onEmsQuick={(r) => setEmsQuick(r)} />}
        </div>
      )}

      {histOpen && <CtHistoryDrawer onClose={() => setHistOpen(false)} />}
      {emsScan && <EmsScanStation records={list} docNoOf={(r) => r.docNo} docLabel="เลขที่หนังสือ"
                                  onSaveEms={saveEms} onClose={() => setEmsScan(false)} />}
      {emsQuick && <EmsQuickModal rec={emsQuick} docNoOf={(r) => r.docNo} docLabel="เลขที่หนังสือ"
                                  onSaveEms={saveEms} onClose={() => setEmsQuick(null)} />}
      <ContractTerminationPrintSheet rec={printDoc} />
    </>
  );
}

Object.assign(window, { ContractTerminationPage });
