// ════════════════════════════════════════════════════════════════════
//  คำขอเปลี่ยนแปลงงวดชำระ — ทะเบียน (list) + แบบฟอร์ม + รายละเอียด
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  ใช้บันทึก: (1) การเปลี่ยนแปลงงวดชำระ  (2) การปรับเพิ่มส่งรายปี
// ════════════════════════════════════════════════════════════════════

const icrToday = () => new Date().toISOString().slice(0, 10);

// ─── ป้ายวันที่ปัจจุบัน — มุมขวาล่างของหน้าจอ ────────────────────────
function IcrTodayBadge() {
  const today = icrToday();
  return (
    <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
      <Icon name="calendar" size={13} />
      <span>วันที่ปัจจุบัน</span>
      <b className="mono">{fmt.date(today)}</b>
    </div>
  );
}

// ─── ตัวเลือกประเภทการเปลี่ยนแปลง (segmented) ───────────────────────
function IcrTypeToggle({ value, onChange }) {
  return (
    <div className="icr-type-toggle">
      {window.ICR_CHANGE_TYPES.map(t => (
        <button key={t.v} type="button"
                className={'icr-type-opt' + (value === t.v ? ' active' : '')}
                onClick={() => onChange(t.v)}>
          <span className="icr-type-ico"><Icon name={t.icon} size={16} /></span>
          <span className="icr-type-txt">
            <b>{t.l}</b>
            <span className="icr-type-desc">{t.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนคำขอเปลี่ยนแปลงงวดชำระ (list)
// ════════════════════════════════════════════════════════════════════
function IcrListView({ list, onCreate, onOpen, onOpenHistory }) {
  const [q, setQ] = useState('');
  const [typeF, setTypeF] = useState('all');
  const [catF, setCatF] = useState('all');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) ||
                        (x.contractNo || '').toLowerCase().includes(n));
    }
    if (typeF !== 'all') r = r.filter(x => x.changeType === typeF);
    if (catF !== 'all') r = r.filter(x => x.noteCategory === catF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.recordDate.localeCompare(a.recordDate) || b.id.localeCompare(a.id));
  }, [list, q, typeF, catF, statusF]);

  const hasFilter = q || typeF !== 'all' || catF !== 'all' || statusF !== 'all';
  const clear = () => { setQ(''); setTypeF('all'); setCatF('all'); setStatusF('all'); };

  const instCnt = list.filter(r => r.changeType === 'installment').length;
  const annualCnt = list.filter(r => r.changeType === 'annual').length;
  const effCnt = list.filter(r => r.status === 'effective').length;

  return (
    <div data-screen-label="หน้าทะเบียนคำขอเปลี่ยนแปลงงวดชำระ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>คำขอเปลี่ยนแปลงงวดชำระ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · บันทึกการเปลี่ยนแปลงยอด/งวดชำระ และการปรับเพิ่มส่งรายปี ต่อสัญญาเงินกู้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> บันทึกคำขอ</button>
      </div>

      {/* KPI */}
      <div className="search-stats" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-label">คำขอทั้งหมด</div>
          <div className="stat-value">{fmt.int(list.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">เปลี่ยนแปลงงวดชำระ</div>
          <div className="stat-value">{fmt.int(instCnt)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">ปรับเพิ่มส่งรายปี</div>
          <div className="stat-value">{fmt.int(annualCnt)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">มีผลบังคับแล้ว</div>
          <div className="stat-value">{fmt.int(effCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>effective</div>
        </div>
      </div>

      <div className="search-card">
        {/* ── ตัวกรอง ── */}
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขสมาชิก / ชื่อ / เลขที่สัญญา / เลขที่คำขอ</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น M-067012, L-2022-0455" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทการเปลี่ยนแปลง</span>
            <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ width: 180 }}>
              <option value="all">ทุกประเภท</option>
              {window.ICR_CHANGE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>หัวข้อหมายเหตุ</span>
            <select className="filter-select" value={catF} onChange={(e) => setCatF(e.target.value)} style={{ width: 200 }}>
              <option value="all">ทุกหัวข้อ</option>
              {window.ICR_NOTE_CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 150 }}>
              <option value="all">ทุกสถานะ</option>
              {window.ICR_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>
          )}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {/* ── ตาราง ── */}
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่คำขอ</th>
                <th>สมาชิก</th>
                <th>สัญญา / ประเภท</th>
                <th className="center">ประเภทการเปลี่ยนแปลง</th>
                <th className="num">งวด/ยอดเดิม</th>
                <th className="num">งวด/ยอดใหม่</th>
                <th className="center">เริ่มมีผล</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.icrStatus(r.status);
                const ct = window.icrChangeType(r.changeType);
                const cat = window.icrNoteCat(r.noteCategory);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="mono">{r.contractNo}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{r.loanType}</div>
                    </td>
                    <td className="center">
                      <span className={'chip ' + (r.changeType === 'annual' ? 'primary' : 'info')}>{ct.short}</span>
                      {cat && <div style={{ marginTop: 3 }}><span className="muted" style={{ fontSize: 10.5 }}>{cat.l}</span></div>}
                    </td>
                    <td className="num">
                      <div className="mono">{r.oldTerm} งวด</div>
                      <div className="muted mono" style={{ fontSize: 11 }}>{fmt.money(r.oldAmount, 0)}</div>
                    </td>
                    <td className="num">
                      <div className="mono"><b>{r.newTerm} งวด</b></div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--primary)' }}>{fmt.money(r.newAmount, 0)}{r.changeType === 'annual' && r.annualIncrease > 0 ? ` +${fmt.money(r.annualIncrease, 0)}/ปี` : ''}</div>
                    </td>
                    <td className="center mono">{fmt.date(r.effectiveDate)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดคำขอ · ยอด/งวดใหม่จะมีผลตามวันที่เริ่มมีผลของแต่ละรายการ
        </p>
      </div>

      <IcrTodayBadge />
    </div>
  );
}

Object.assign(window, { IcrListView, IcrTodayBadge, IcrTypeToggle, icrToday });
