// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — เรียกเก็บหนี้ตามคำพิพากษาตามยอม (6.8)
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี › เรียกเก็บหนี้ตามคำพิพากษา
//  โครงสร้าง: ทะเบียนรวม (list + filter + alert) · รายละเอียด · ฟอร์มบันทึก
//  ใช้ DnMemberSearchModal / DN_MEMBERS ร่วมกับหน้าจ่ออื่นในระบบ
// ════════════════════════════════════════════════════════════════════

const jcToday = () => window.JC_TODAY;

// ─── ฟิลด์ย่อย ──────────────────────────────────────────────────────
function JcField({ label, required, hint, children, span, full }) {
  const st = full ? { gridColumn: '1 / -1' } : span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

// ─── Modal: ออกรายงาน ───────────────────────────────────────────────
function JcReportModal({ onPick, onClose }) {
  const reports = [
    { id: 'r1', label: 'รายงานทะเบียนติดตามหนี้ตามคำพิพากษา', desc: 'ทะเบียนลูกหนี้ตามคำพิพากษาตามยอมทั้งหมด พร้อมยอดคงเหลือ' },
    { id: 'r2', label: 'รายงานลูกหนี้ผิดนัดตามคำพิพากษา', desc: 'เฉพาะลูกหนี้ที่ผิดนัด — เลือกช่วงจำนวนงวดที่ผิดนัดได้' },
    { id: 'r3', label: 'รายงานสรุปผู้ผิดนัดรอบวันที่ 10', desc: 'สรุปจำนวนคำร้อง/บุคคลที่ผิดนัดงวดในแต่ละรอบเดือน' },
    { id: 'r4', label: 'รายงานเก็บหนี้ตามคำพิพากษา (ฟอร์ม Excel)', desc: 'ส่งออกตามฟอร์ม Excel ที่ใช้งานเดิม' },
  ];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <h2>ออกรายงานติดตามหนี้ตามคำพิพากษา</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lg-report-list">
            {reports.map(r => (
              <button key={r.id} className="lg-report-row" onClick={() => onPick(r.label)}>
                <span className="lg-report-ico"><Icon name="receipt" size={15} /></span>
                <span className="lg-report-txt">
                  <span className="lg-report-title">{r.label}</span>
                  <span className="lg-report-desc">{r.desc}</span>
                </span>
                <Icon name="chevRight" size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนรวม (list)
// ════════════════════════════════════════════════════════════════════
function JcListView({ list, onOpen, onCreate, onToast }) {
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minOverdue, setMinOverdue] = useState('0');
  const [adjustedOnly, setAdjustedOnly] = useState(false);
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState([]);
  const [reportModal, setReportModal] = useState(false);

  const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');

  const rows = list.filter(r => {
    if (group !== 'all' && r.group !== group) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (adjustedOnly && !r.adjusted) return false;
    if (Number(minOverdue) > 0 && window.jcOverdueTerms(r) < Number(minOverdue)) return false;
    if (dateFrom && (r.judgmentDate || '') < dateFrom) return false;
    if (dateTo && (r.judgmentDate || '') > dateTo) return false;
    if (q.trim()) {
      const hay = norm(r.memberCode) + norm(r.memberName) + norm(r.no) + norm(r.redCaseNo) + norm(r.blackCaseNo);
      if (!hay.includes(norm(q))) return false;
    }
    return true;
  });

  // สถิติภาพรวม (จากทั้งทะเบียน ไม่ขึ้นกับตัวกรอง)
  const overdueList = list.filter(r => window.jcOverdueTerms(r) > 0);
  const over3 = list.filter(r => window.jcOverdueTerms(r) >= 3);
  const remainSum = list.reduce((s, r) => s + window.jcRemaining(r), 0);
  // ผู้ผิดนัดรอบวันที่ 10 เดือนปัจจุบัน — งวดที่ครบกำหนดในเดือนนี้และยังไม่จ่าย
  const ym = jcToday().slice(0, 7);
  const dueThisMonth = list.filter(r =>
    (r.schedule || []).some(s => !s.paid && s.dueDate.slice(0, 7) === ym && s.dueDate <= jcToday()));

  const toggleAll = () => setChecked(checked.length === rows.length ? [] : rows.map(r => r.id));
  const toggle = (id) => setChecked(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  const doExport = () => {
    const sel = checked.length ? rows.filter(r => checked.includes(r.id)) : rows;
    onToast && onToast(`ส่งออก Excel ${sel.length} รายการ (สาธิต)`);
  };

  return (
    <div data-screen-label="ทะเบียนเรียกเก็บหนี้ตามคำพิพากษา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>เรียกเก็บหนี้ตามคำพิพากษาตามยอม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 3, maxWidth: 820 }}>
            ทะเบียนลูกหนี้ตามคำพิพากษาตามยอม แยกกลุ่มตามช่วงปรับโครงสร้างหนี้ · ติดตามการชำระรายงวด และแจ้งเตือนการผิดนัด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={() => setReportModal(true)}><Icon name="print" /> พิมพ์</button>
        <button className="btn" onClick={doExport}><Icon name="download" /> ส่งออก Excel</button>
        <button className="btn primary" onClick={onCreate}><Icon name="plus" /> เพิ่มรายการ</button>
      </div>

      {/* ── สถิติ ── */}
      <div className="dxc-stat-row" style={{ marginBottom: 12 }}>
        <div className="dxc-stat"><span className="k">ลูกหนี้ตามคำพิพากษา</span><span className="v mono">{list.length}</span></div>
        <div className="dxc-stat"><span className="k">ผิดนัดชำระ</span><span className="v mono" style={{ color: 'var(--danger)' }}>{overdueList.length}</span></div>
        <div className="dxc-stat"><span className="k">ผิดนัดเกิน 3 งวด</span><span className="v mono" style={{ color: 'var(--danger)' }}>{over3.length}</span></div>
        <div className="dxc-stat"><span className="k">ยอดคงเหลือรวม</span><span className="v mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(remainSum, 0)}</span></div>
      </div>

      {/* ── แบนเนอร์แจ้งเตือน ── */}
      {(dueThisMonth.length > 0 || over3.length > 0) && (
        <div className="jc-alert">
          <span className="jc-alert-ico"><Icon name="info" size={16} /></span>
          <div className="jc-alert-body">
            <b>สรุปการติดตามรอบวันที่ 10 ({fmt.date(jcToday())})</b>
            <div className="jc-alert-lines">
              <span>มีลูกหนี้ผิดนัดงวดในเดือนนี้ <b>{dueThisMonth.length}</b> ราย</span>
              <span className="jc-alert-sep">·</span>
              <span>ผิดนัดสะสมเกิน 3 งวด <b style={{ color: 'var(--danger)' }}>{over3.length}</b> ราย — ควรพิจารณาบังคับคดี</span>
            </div>
          </div>
          {over3.length > 0 && (
            <button className="btn sm" onClick={() => { setMinOverdue('3'); setStatus('overdue'); }}>
              ดูรายชื่อผิดนัดเกิน 3 งวด
            </button>
          )}
        </div>
      )}

      {/* ── ตัวกรอง ── */}
      <div className="search-card" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <div className="toolbar" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>กลุ่มสัญญา</span>
            <select className="filter-select" value={group} onChange={(e) => setGroup(e.target.value)} style={{ minWidth: 210 }}>
              <option value="all">— ทุกกลุ่ม —</option>
              {window.JC_GROUPS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">— ทุกสถานะ —</option>
              {window.JC_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>วันพิพากษา (จาก – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ผิดนัดตั้งแต่ (งวด)</span>
            <select className="filter-select" value={minOverdue} onChange={(e) => setMinOverdue(e.target.value)} style={{ width: 110 }}>
              <option value="0">— ทั้งหมด —</option>
              <option value="1">≥ 1 งวด</option>
              <option value="2">≥ 2 งวด</option>
              <option value="3">≥ 3 งวด</option>
              <option value="6">≥ 6 งวด</option>
            </select>
          </div>
          <label className="jc-check-inline">
            <input type="checkbox" className="ch-box" checked={adjustedOnly} onChange={(e) => setAdjustedOnly(e.target.checked)} />
            <span>เฉพาะที่ปรับรายการงวดแล้ว</span>
          </label>
          <span className="spacer" style={{ flex: 1 }} />
          <div className="search" style={{ minWidth: 220 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาสมาชิก / เลขคดี / เลขที่รายการ" />
          </div>
        </div>
      </div>

      {/* ── ตาราง ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 38 }}>
                  <input type="checkbox" className="ch-box" checked={rows.length > 0 && checked.length === rows.length} onChange={toggleAll} />
                </th>
                <th style={{ width: 118 }}>เลขที่รายการ</th>
                <th style={{ minWidth: 190 }}>สมาชิกลูกหนี้</th>
                <th style={{ width: 120 }}>กลุ่มสัญญา</th>
                <th>เลขคดีแดง / ศาล</th>
                <th className="num" style={{ width: 110 }}>ยอดตามคำพิพากษา</th>
                <th className="num" style={{ width: 100 }}>คงเหลือ</th>
                <th className="center" style={{ width: 78 }}>ผิดนัด</th>
                <th className="center" style={{ width: 62 }}>ปรับงวด</th>
                <th className="center" style={{ width: 96 }}>สถานะ</th>
                <th className="center" style={{ width: 54 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="11" className="empty-state" style={{ padding: '22px 8px' }}>ไม่พบรายการตามเงื่อนไข</td></tr>
              ) : rows.map(r => {
                const g = window.jcGroup(r.group);
                const st = window.jcStatus(r.status);
                const od = window.jcOverdueTerms(r);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="ch-box" checked={checked.includes(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="mono">{r.no}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{r.memberCode} · {r.contractNo}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={'chip ' + (g.pill === 'warning' ? 'warning' : g.pill === 'primary' ? 'primary' : 'info')}>{g.short}</span></td>
                    <td>
                      <div className="mono" style={{ fontSize: 12 }}>{r.redCaseNo || '—'}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{r.court || '—'}</div>
                    </td>
                    <td className="num mono">{fmt.money(r.judgmentAmount, 0)}</td>
                    <td className="num mono" style={{ color: window.jcRemaining(r) > 0 ? 'var(--text)' : 'var(--primary)' }}>{fmt.money(window.jcRemaining(r), 0)}</td>
                    <td className="center">
                      {od > 0 ? <span className={'chip ' + (od >= 3 ? 'danger' : 'warning')}>{od} งวด</span> : <span className="muted">—</span>}
                    </td>
                    <td className="center">{r.adjusted ? <Icon name="check" size={14} /> : <span className="muted">—</span>}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="center"><button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); onOpen(r); }} title="ดูรายละเอียด"><Icon name="chevRight" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
      <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
        แสดง {rows.length} จาก {list.length} รายการ{checked.length ? ` · เลือก ${checked.length} รายการ` : ''}
      </div>

      {reportModal && <JcReportModal onPick={(l) => { setReportModal(false); onToast && onToast(`ออกรายงาน: ${l} (สาธิต)`); }} onClose={() => setReportModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียด (detail)
// ════════════════════════════════════════════════════════════════════
function JcDetailView({ rec, onBack, onEdit, onRecordPay, onToast }) {
  const g = window.jcGroup(rec.group);
  const st = window.jcStatus(rec.status);
  const od = window.jcOverdueTerms(rec);
  const remain = window.jcRemaining(rec);
  const paidTerms = (rec.schedule || []).filter(s => s.paid).length;
  const nextDue = window.jcNextDue(rec);

  return (
    <div data-screen-label="รายละเอียดเรียกเก็บหนี้ตามคำพิพากษา">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('พิมพ์รายละเอียด (สาธิต)')}><Icon name="print" size={13} /> พิมพ์</button>
        {rec.status !== 'closed' && nextDue && (
          <button className="btn sm accent" onClick={() => onRecordPay(rec)}><Icon name="money" size={13} /> บันทึกรับชำระงวด</button>
        )}
        <button className="btn primary sm" onClick={() => onEdit(rec)}><Icon name="edit" size={13} /> แก้ไข</button>
      </div>

      {/* ── การ์ดหัวเรื่อง ── */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="guarantee" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{rec.memberName} <span className="muted mono" style={{ fontSize: 13, fontWeight: 400 }}>· {rec.memberCode}</span></h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.no}</span><span className="dot" />
              <span>{rec.dept}</span><span className="dot" />
              <span>สัญญา <span className="mono">{rec.contractNo}</span></span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className={'pill ' + st.pill}>{st.l}</span>
            <span className={'chip ' + (g.pill === 'warning' ? 'warning' : g.pill === 'primary' ? 'primary' : 'info')}>{g.l}</span>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">ยอดตามคำพิพากษา</span><span className="lt-date-v mono">฿ {fmt.money(rec.judgmentAmount, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ชำระแล้ว</span><span className="lt-date-v mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(rec.paidAmount, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">คงเหลือ</span><span className="lt-date-v mono" style={{ color: remain > 0 ? 'var(--danger)' : 'var(--primary)' }}>฿ {fmt.money(remain, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">งวดที่ผิดนัด</span><span className="lt-date-v" style={{ color: od > 0 ? 'var(--danger)' : 'var(--text)' }}>{od > 0 ? od + ' งวด' : '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">งวดถัดไปครบกำหนด</span><span className="lt-date-v">{nextDue ? fmt.date(nextDue) : 'ครบแล้ว'}</span></div>
        </div>
      </div>

      {/* ── ข้อมูลคดี ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลคำพิพากษา</h3></div>
        <div className="form-grid cols-3">
          <JcRow label="เลขคดีดำ" value={rec.blackCaseNo} mono />
          <JcRow label="เลขคดีแดง" value={rec.redCaseNo} mono />
          <JcRow label="ศาล" value={rec.court} />
          <JcRow label="วันที่พิพากษาตามยอม" value={rec.judgmentDate ? fmt.date(rec.judgmentDate) : '—'} />
          <JcRow label="ค่างวดตามคำพิพากษา" value={'฿ ' + fmt.money(rec.installmentAmount, 0) + ' /งวด'} mono />
          <JcRow label="ปรับรายการงวดชำระแล้ว" value={rec.adjusted ? 'ปรับแล้ว' : 'ยังไม่ปรับ'} />
        </div>
        {rec.note && <div className="jc-note-box"><Icon name="info" size={13} /> {rec.note}</div>}
      </div>

      {/* ── ผู้เกี่ยวข้อง ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ผู้กู้ / ผู้ค้ำที่เกี่ยวข้อง</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr><th style={{ width: 60 }}>ลำดับ</th><th>ชื่อ - สกุล</th><th style={{ width: 150 }}>ฐานะ</th><th>สังกัด</th></tr></thead>
            <tbody>
              <tr>
                <td className="center">1</td>
                <td>{rec.memberName} <span className="muted mono" style={{ fontSize: 11 }}>({rec.memberCode})</span></td>
                <td><span className="chip primary">{rec.role}</span></td>
                <td>{rec.dept}</td>
              </tr>
              {(rec.relatedParties || []).map((p, i) => (
                <tr key={i}>
                  <td className="center">{i + 2}</td>
                  <td>{p.name}{p.memberCode && <span className="muted mono" style={{ fontSize: 11 }}> ({p.memberCode})</span>}</td>
                  <td><span className="chip">{p.role}</span></td>
                  <td>{p.dept}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      {/* ── ตารางงวดชำระ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ตารางงวดชำระตามคำพิพากษา</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ชำระแล้ว {paidTerms}/{(rec.schedule || []).length} งวด</span>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360 }}>
          <table className="tbl">
            <thead>
              <tr><th className="center" style={{ width: 60 }}>งวดที่</th><th className="center">วันครบกำหนด</th><th className="num">ค่างวด</th><th className="center">สถานะ</th><th className="center">วันที่ชำระ</th></tr>
            </thead>
            <tbody>
              {(rec.schedule || []).map(s => {
                const overdue = !s.paid && s.dueDate <= jcToday();
                return (
                  <tr key={s.term} style={{ background: overdue ? 'rgba(214,77,87,0.07)' : undefined }}>
                    <td className="center mono">{s.term}</td>
                    <td className="center">{fmt.date(s.dueDate)}</td>
                    <td className="num mono">{fmt.money(s.amount, 0)}</td>
                    <td className="center">
                      {s.paid ? <span className="pill ok">ชำระแล้ว</span>
                        : overdue ? <span className="pill bad">ผิดนัด</span>
                        : <span className="pill neutral">รอชำระ</span>}
                    </td>
                    <td className="center">{s.paidDate ? fmt.date(s.paidDate) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

function JcRow({ label, value, mono, strong }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '')} style={strong ? { fontWeight: 700 } : null}>{value || '—'}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มบันทึก (create / edit)
// ════════════════════════════════════════════════════════════════════
function JcForm({ current, onSave, onCancel, onToast }) {
  const editing = !!current;
  const [member, setMember] = useState(() => current ? {
    code: current.memberCode, name: current.memberName, dept: current.dept, deptCode: '', status: 'ปกติ',
  } : null);
  const [f, setF] = useState(() => current
    ? { ...window.jcBlankForm(), ...current }
    : window.jcBlankForm());
  const [error, setError] = useState('');
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setError(''); };

  // เลือกสัญญา (ค้นหาด้วยเลขที่สัญญา หรือเลขทะเบียน/ชื่อสมาชิก) — รูปแบบกลาง DS
  // เมื่อเลือกสัญญา ระบบดึงผู้ค้ำประกันตามสัญญาขึ้นมาแสดง (คงผู้เกี่ยวข้องที่เพิ่มเองไว้)
  const pickContract = ({ member: m, debt }) => {
    setMember(m);
    setF(p => ({
      ...p,
      contractNo: debt.contractNo,
      loanType: debt.type || '',
      relatedParties: [
        ...(debt.guarantors || []).map(g => ({
          name: g.name, role: 'ผู้ค้ำประกัน', dept: g.dept, memberCode: g.memberCode, fromContract: true,
        })),
        ...(p.relatedParties || []).filter(x => !x.fromContract),
      ],
    }));
    setError('');
  };

  const genSchedule = () => {
    const amt = Number(f.installmentAmount);
    const total = Number(f.judgmentAmount);
    if (!(amt > 0) || !(total > 0)) { setError('กรุณาระบุยอดตามคำพิพากษาและค่างวดก่อนสร้างตาราง'); return; }
    if (!f.judgmentDate) { setError('กรุณาระบุวันที่พิพากษาก่อนสร้างตารางงวด'); return; }
    const n = Math.ceil(total / amt);
    // เริ่มงวดถัดจากเดือนพิพากษา
    const jd = new Date(f.judgmentDate);
    const startIso = new Date(jd.getFullYear(), jd.getMonth() + 1, 1).toISOString().slice(0, 10).slice(0, 7);
    const paidTerms = Math.floor(Number(f.paidAmount || 0) / amt);
    const sched = [];
    const [y, m] = startIso.split('-').map(Number);
    for (let i = 0; i < n; i++) {
      const dt = new Date(y, (m - 1) + i, 10);
      const dueIso = dt.toISOString().slice(0, 10);
      const paid = i < paidTerms;
      sched.push({ term: i + 1, dueDate: dueIso, amount: amt, paid, paidDate: paid ? dueIso : null });
    }
    setF(p => ({ ...p, schedule: sched }));
    onToast && onToast(`สร้างตารางงวดชำระ ${n} งวดแล้ว`);
  };

  const addParty = () => setF(p => ({ ...p, relatedParties: [...(p.relatedParties || []), { memberCode: '', name: '', role: 'ผู้ค้ำประกัน', dept: '' }] }));
  const setParty = (i, k, v) => setF(p => ({ ...p, relatedParties: p.relatedParties.map((x, j) => j === i ? { ...x, [k]: v } : x) }));
  const delParty = (i) => setF(p => ({ ...p, relatedParties: p.relatedParties.filter((_, j) => j !== i) }));

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิกลูกหนี้';
    if (!f.group) return 'กรุณาเลือกกลุ่มสัญญา';
    if (!f.redCaseNo.trim() && !f.blackCaseNo.trim()) return 'กรุณาระบุเลขคดี (ดำ หรือ แดง)';
    if (!f.judgmentDate) return 'กรุณาระบุวันที่พิพากษาตามยอม';
    if (!(Number(f.judgmentAmount) > 0)) return 'กรุณาระบุยอดตามคำพิพากษา';
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({
      ...f,
      memberCode: member.code, memberName: member.name, dept: member.dept,
      judgmentAmount: Number(f.judgmentAmount) || 0,
      paidAmount: Number(f.paidAmount) || 0,
      installmentAmount: Number(f.installmentAmount) || 0,
    }, editing);
  };

  return (
    <div data-screen-label="ฟอร์มบันทึกเรียกเก็บหนี้ตามคำพิพากษา">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── สมาชิก / สัญญา ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สมาชิกลูกหนี้ / สัญญาเงินกู้</h3></div>
        <div className="form-grid cols-4">
          <JcField label="เลขที่สัญญา / เลขสมาชิก" required hint="(ค้นหาสัญญา)" span={2}>
            <ContractSearchField contract={f.contractNo} member={member}
                                 onPick={pickContract} source={window.DN_MEMBERS}
                                 title="ค้นหาสัญญาเงินกู้ — เรียกเก็บหนี้ตามคำพิพากษา"
                                 placeholder="ค้นหาด้วยเลขที่สัญญา หรือเลขสมาชิก…" />
          </JcField>
          <JcField label="ประเภทเงินกู้"><input className="cfg-input sr-auto" value={f.loanType || ''} readOnly placeholder="(แสดงอัตโนมัติ)" /></JcField>
          <JcField label="ฐานะลูกหนี้">
            <select className="cfg-input" value={f.role} onChange={(e) => set('role', e.target.value)}>
              <option>ผู้กู้</option><option>ผู้ค้ำประกัน</option>
            </select>
          </JcField>
          <JcField label="ชื่อ - สกุล" span={2}><input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(แสดงอัตโนมัติ)" /></JcField>
          <JcField label="สังกัด" span={2}><input className="cfg-input sr-auto" value={member ? member.dept : ''} readOnly placeholder="(แสดงอัตโนมัติ)" /></JcField>
        </div>
      </div>

      {/* ── ข้อมูลคดี ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลคำพิพากษาตามยอม</h3></div>
        <div className="form-grid cols-3">
          <JcField label="กลุ่มสัญญา" required span={3}>
            <select className="cfg-input" value={f.group} onChange={(e) => set('group', e.target.value)}>
              {window.JC_GROUPS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </JcField>
          <JcField label="เลขคดีดำ"><input className="cfg-input mono" value={f.blackCaseNo} onChange={(e) => set('blackCaseNo', e.target.value)} placeholder="ผบ …/…" /></JcField>
          <JcField label="เลขคดีแดง"><input className="cfg-input mono" value={f.redCaseNo} onChange={(e) => set('redCaseNo', e.target.value)} placeholder="ผบ …/…" /></JcField>
          <JcField label="ศาล"><input className="cfg-input" list="jc-courts" value={f.court} onChange={(e) => set('court', e.target.value)} placeholder="เลือก/พิมพ์ศาล" /></JcField>
          <JcField label="วันที่พิพากษาตามยอม" required><ErpDate value={f.judgmentDate} onChange={(v) => ((e) => set('judgmentDate', e.target.value))({ target: { value: v } })} className="cfg-input" /></JcField>
          <JcField label="ปรับรายการงวดชำระแล้ว">
            <label className="jc-check-inline" style={{ height: 34 }}>
              <input type="checkbox" className="ch-box" checked={!!f.adjusted} onChange={(e) => set('adjusted', e.target.checked)} />
              <span>ปรับรายการงวดชำระแล้ว</span>
            </label>
          </JcField>
        </div>
        <datalist id="jc-courts">{window.JC_COURTS.map(c => <option key={c} value={c} />)}</datalist>
      </div>

      {/* ── ยอดและงวด ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ยอดหนี้และตารางงวดชำระ</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={genSchedule}><Icon name="calendar" size={13} /> สร้างตารางงวด</button>
          </div>
        </div>
        <div className="form-grid cols-3">
          <JcField label="ยอดตามคำพิพากษา (บาท)" required><input className="cfg-input mono" type="number" value={f.judgmentAmount} onChange={(e) => set('judgmentAmount', e.target.value)} placeholder="0" /></JcField>
          <JcField label="ชำระแล้ว (บาท)"><input className="cfg-input mono" type="number" value={f.paidAmount} onChange={(e) => set('paidAmount', e.target.value)} placeholder="0" /></JcField>
          <JcField label="ค่างวด/งวด (บาท)"><input className="cfg-input mono" type="number" value={f.installmentAmount} onChange={(e) => set('installmentAmount', e.target.value)} placeholder="0" /></JcField>
        </div>
        {(f.schedule || []).length > 0 && (
          <div className="jc-note-box" style={{ marginTop: 10 }}>
            <Icon name="check" size={13} /> สร้างตารางแล้ว {f.schedule.length} งวด · คงเหลือ ฿ {fmt.money(Math.max(0, Number(f.judgmentAmount) - Number(f.paidAmount || 0)), 0)}
          </div>
        )}
      </div>

      {/* ── ผู้เกี่ยวข้อง ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ผู้ค้ำ / ผู้เกี่ยวข้อง</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={addParty}><Icon name="plus" size={13} /> เพิ่มผู้เกี่ยวข้อง</button>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="info" size={12} /> ระบบดึงผู้ค้ำประกันตามสัญญาที่เลือกขึ้นมาแสดงให้อัตโนมัติ — เพิ่มผู้เกี่ยวข้องรายอื่น (ผู้กู้ร่วม / ทายาท) ได้ด้วยปุ่ม “เพิ่มผู้เกี่ยวข้อง”
        </div>
        {(f.relatedParties || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '14px 8px' }}>{member ? 'สัญญานี้ไม่มีผู้ค้ำประกัน — เพิ่มผู้เกี่ยวข้องได้ด้วยปุ่มด้านบน' : 'เลือกสัญญาเพื่อดึงผู้ค้ำประกัน หรือเพิ่มผู้เกี่ยวข้องเอง'}</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th style={{ width: 112 }}>เลขสมาชิก</th><th>ชื่อ - สกุล</th><th style={{ width: 150 }}>ฐานะ</th><th>สังกัด</th><th className="center" style={{ width: 92 }}>ที่มา</th><th style={{ width: 50 }} /></tr></thead>
              <tbody>
                {f.relatedParties.map((p, i) => (
                  <tr key={i}>
                    <td><input className="cfg-input mono" value={p.memberCode || ''} onChange={(e) => setParty(i, 'memberCode', e.target.value)} placeholder="—" readOnly={p.fromContract} /></td>
                    <td><input className="cfg-input" value={p.name} onChange={(e) => setParty(i, 'name', e.target.value)} placeholder="ชื่อ-สกุล" readOnly={p.fromContract} /></td>
                    <td>
                      <select className="cfg-input" value={p.role} onChange={(e) => setParty(i, 'role', e.target.value)}>
                        <option>ผู้ค้ำประกัน</option><option>ผู้กู้ร่วม</option><option>ทายาท</option>
                      </select>
                    </td>
                    <td><input className="cfg-input" value={p.dept} onChange={(e) => setParty(i, 'dept', e.target.value)} placeholder="สังกัด" readOnly={p.fromContract} /></td>
                    <td className="center"><span className={'chip ' + (p.fromContract ? 'info' : 'primary')}>{p.fromContract ? 'จากสัญญา' : 'เพิ่มเอง'}</span></td>
                    <td className="center"><button className="btn ghost sm danger" onClick={() => delParty(i)} title="ลบ"><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      {/* ── หมายเหตุ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หมายเหตุ</h3></div>
        <textarea className="cfg-input" rows={3} value={f.note} onChange={(e) => set('note', e.target.value)}
                  placeholder="ระบุหมายเหตุ เช่น เงื่อนไขการประนีประนอมยอมความ ข้อสังเกตของเจ้าหน้าที่" />
      </div>

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก — จัดการโหมด list / detail / form
// ════════════════════════════════════════════════════════════════════
function JudgmentCollectionPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.jcLoad);
  const [mode, setMode] = useState('list');     // list | detail | form
  const [current, setCurrent] = useState(null);

  const persist = (next) => { setList(next); window.jcSaveLS(next); };

  window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'เรียกเก็บหนี้ตามคำพิพากษา', onClick: () => setMode('list') }, { label: current ? 'แก้ไขรายการ' : 'เพิ่มรายการ', current: true }]
      : mode === 'detail'
        ? [{ label: 'เรียกเก็บหนี้ตามคำพิพากษา', onClick: () => setMode('list') }, { label: 'รายละเอียด', current: true }]
        : [{ label: 'เรียกเก็บหนี้ตามคำพิพากษา', current: true }],
    [mode, current && current.id]
  );

  const openDetail = (r) => { setCurrent(r); setMode('detail'); };
  const openCreate = () => { setCurrent(null); setMode('form'); };
  const openEdit = (r) => { setCurrent(r); setMode('form'); };

  const recompute = (rec) => {
    const remaining = Math.max(0, (rec.judgmentAmount || 0) - (rec.paidAmount || 0));
    rec.status = remaining <= 0 ? 'closed' : (window.jcOverdueTerms(rec) > 0 ? 'overdue' : 'normal');
    return rec;
  };

  const save = (formData, editing) => {
    if (editing) {
      const updated = list.map(r => r.id === current.id ? recompute({ ...r, ...formData }) : r);
      persist(updated);
      const rec = updated.find(r => r.id === current.id);
      audit.log && audit.log({ action: 'update', module: 'ทะเบียนและติดตามหนี้ — เรียกเก็บหนี้ตามคำพิพากษา',
        target: `${rec.memberCode} · ${rec.memberName}`, summary: `แก้ไขรายการ ${rec.no}` });
      onToast && onToast(`บันทึกการแก้ไข ${rec.no} เรียบร้อยแล้ว`);
      setCurrent(rec); setMode('detail');
    } else {
      const no = window.jcNextNo(list);
      const rec = recompute({ id: 'jc-' + Date.now().toString(36), no, ...formData,
        enteredBy: window.JC_USER, enteredAt: new Date().toISOString().slice(0, 16) });
      persist([rec, ...list]);
      audit.log && audit.log({ action: 'create', module: 'ทะเบียนและติดตามหนี้ — เรียกเก็บหนี้ตามคำพิพากษา',
        target: `${rec.memberCode} · ${rec.memberName}`, summary: `เพิ่มรายการ ${rec.no}` });
      onToast && onToast(`บันทึกรายการ ${no} เรียบร้อยแล้ว`);
      setCurrent(rec); setMode('detail');
    }
  };

  const recordPay = (rec) => {
    const sched = (rec.schedule || []).map(s => ({ ...s }));
    const next = sched.find(s => !s.paid);
    if (!next) { onToast && onToast('ชำระครบทุกงวดแล้ว'); return; }
    next.paid = true; next.paidDate = jcToday();
    const paidAmount = (rec.paidAmount || 0) + next.amount;
    const updatedRec = recompute({ ...rec, schedule: sched, paidAmount });
    const updated = list.map(r => r.id === rec.id ? updatedRec : r);
    persist(updated);
    audit.log && audit.log({ action: 'update', module: 'ทะเบียนและติดตามหนี้ — เรียกเก็บหนี้ตามคำพิพากษา',
      target: `${rec.memberCode} · ${rec.memberName}`, summary: `รับชำระงวดที่ ${next.term} · ฿ ${fmt.money(next.amount, 0)}` });
    onToast && onToast(`บันทึกรับชำระงวดที่ ${next.term} · ฿ ${fmt.money(next.amount, 0)} แล้ว`);
    setCurrent(updatedRec);
  };

  if (mode === 'form') return <JcForm current={current} onSave={save} onCancel={() => setMode('list')} onToast={onToast} />;
  if (mode === 'detail' && current) {
    const rec = list.find(r => r.id === current.id) || current;
    return <JcDetailView rec={rec} onBack={() => setMode('list')} onEdit={openEdit} onRecordPay={recordPay} onToast={onToast} />;
  }
  return <JcListView list={list} onOpen={openDetail} onCreate={openCreate} onToast={onToast} />;
}

Object.assign(window, { JudgmentCollectionPage });
