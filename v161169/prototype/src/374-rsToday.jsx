// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — อายัดหนี้ผู้เกษียณ / เกษียณก่อนกำหนด (6.10)
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี › อายัดหนี้ผู้เกษียณ
//  โครงสร้าง: ทะเบียนรวม (list + filter + alert) · รายละเอียด · ฟอร์มบันทึก
// ════════════════════════════════════════════════════════════════════

const rsToday = () => window.RS_TODAY;

function RsField({ label, required, hint, children, span, full }) {
  const st = full ? { gridColumn: '1 / -1' } : span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}
function RsRow({ label, value, mono, strong, tone }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '') + (tone ? ' ' + tone : '')} style={strong ? { fontWeight: 700 } : null}>{value || '—'}</span>
    </div>
  );
}
function rsGroupChip(v) {
  const g = window.rsGroupMeta(v);
  return <span className={'chip ' + (g.pill === 'warning' ? 'warning' : g.pill === 'primary' ? 'primary' : 'info')}>{g.short}</span>;
}

// ─── Modal: ออกรายงาน ───────────────────────────────────────────────
function RsReportModal({ onPick, onClose }) {
  const reports = [
    { id: 'g0', label: 'รายงานผู้เกษียณ — ทุกกลุ่ม', desc: 'ทะเบียนผู้เกษียณทั้งหมด แยกประเภทหนี้' },
    { id: 'g1', label: 'รายงานผู้เกษียณ — มีหุ้นอย่างเดียว', desc: 'ไม่มีภาระหนี้ · เตรียมคืนค่าหุ้น' },
    { id: 'g2', label: 'รายงานผู้เกษียณ — มีหุ้นมากกว่าหนี้', desc: 'โอนหุ้นชำระหนี้ได้ครบ' },
    { id: 'g3', label: 'รายงานผู้เกษียณ — มีหนี้มากกว่าหุ้น', desc: 'ต้องแจ้งชำระ/ขอหักบำเหน็จ' },
    { id: 'f1', label: 'พิมพ์แบบฟอร์มตามประเภทหนี้ (3 ประเภท)', desc: 'พิมพ์ตามแบบฟอร์มของแต่ละกลุ่ม' },
  ];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <h2>ออกรายงานผู้เกษียณ</h2>
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
function RsListView({ list, onOpen, onCreate, onToast }) {
  const [group, setGroup] = useState('all');
  const [retireType, setRetireType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState([]);
  const [reportModal, setReportModal] = useState(false);

  const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');
  const rows = list.filter(r => {
    if (group !== 'all' && r.group !== group) return false;
    if (retireType !== 'all' && r.retireType !== retireType) return false;
    if (dateFrom && (r.retireDate || '') < dateFrom) return false;
    if (dateTo && (r.retireDate || '') > dateTo) return false;
    if (q.trim()) {
      const hay = norm(r.memberCode) + norm(r.memberName) + norm(r.no) + norm(r.dept);
      if (!hay.includes(norm(q))) return false;
    }
    return true;
  });

  const cShareOnly = list.filter(r => r.group === 'share-only').length;
  const cShareGt = list.filter(r => r.group === 'share-gt').length;
  const cDebtGt = list.filter(r => r.group === 'debt-gt').length;
  const needChange = list.filter(r => (r.guaranteeingOthers || []).some(g => !g.changed));

  const toggleAll = () => setChecked(checked.length === rows.length ? [] : rows.map(r => r.id));
  const toggle = (id) => setChecked(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  const doExport = () => {
    const sel = checked.length ? rows.filter(r => checked.includes(r.id)) : rows;
    onToast && onToast(`ส่งออก Excel ${sel.length} รายการ (สาธิต)`);
  };

  return (
    <div data-screen-label="ทะเบียนอายัดหนี้ผู้เกษียณ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>อายัดหนี้ผู้เกษียณ / เกษียณก่อนกำหนด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 3, maxWidth: 820 }}>
            ทะเบียนผู้เกษียณ แยกกลุ่มตามสัดส่วนหุ้น-หนี้ · คำนวณดอกเบี้ยทุกสัญญา · ออกหนังสือและติดตามการอายัด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={() => setReportModal(true)}><Icon name="print" /> พิมพ์/รายงาน</button>
        <button className="btn" onClick={doExport}><Icon name="download" /> ส่งออก Excel</button>
        <button className="btn primary" onClick={onCreate}><Icon name="plus" /> เพิ่มผู้เกษียณ</button>
      </div>

      <div className="dxc-stat-row" style={{ marginBottom: 12 }}>
        <div className="dxc-stat"><span className="k">ผู้เกษียณทั้งหมด</span><span className="v mono">{list.length}</span></div>
        <div className="dxc-stat"><span className="k">มีหุ้นอย่างเดียว</span><span className="v mono" style={{ color: 'var(--info, #2a6fdb)' }}>{cShareOnly}</span></div>
        <div className="dxc-stat"><span className="k">หุ้น &gt; หนี้</span><span className="v mono" style={{ color: 'var(--primary)' }}>{cShareGt}</span></div>
        <div className="dxc-stat"><span className="k">หนี้ &gt; หุ้น</span><span className="v mono" style={{ color: 'var(--warning)' }}>{cDebtGt}</span></div>
      </div>

      {needChange.length > 0 && (
        <div className="jc-alert">
          <span className="jc-alert-ico"><Icon name="info" size={16} /></span>
          <div className="jc-alert-body">
            <b>ผู้เกษียณที่ติดค้ำสมาชิกอื่น</b>
            <div className="jc-alert-lines">
              <span>มี <b style={{ color: 'var(--warning)' }}>{needChange.length}</b> รายที่ยังต้องแจ้งให้สมาชิกที่ถูกค้ำเปลี่ยนผู้ค้ำประกัน (ผ่าน CMS)</span>
            </div>
          </div>
        </div>
      )}

      <div className="search-card" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <div className="toolbar" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทหนี้ (กลุ่ม)</span>
            <select className="filter-select" value={group} onChange={(e) => setGroup(e.target.value)} style={{ minWidth: 200 }}>
              <option value="all">— ทุกกลุ่ม —</option>
              {window.RS_GROUPS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทเกษียณ</span>
            <select className="filter-select" value={retireType} onChange={(e) => setRetireType(e.target.value)}>
              <option value="all">— ทั้งหมด —</option>
              {window.RS_RETIRE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>วันเกษียณ (จาก – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
            </div>
          </div>
          <span className="spacer" style={{ flex: 1 }} />
          <div className="search" style={{ minWidth: 220 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาสมาชิก / สังกัด / เลขที่รายการ" />
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 38 }}>
                  <input type="checkbox" className="ch-box" checked={rows.length > 0 && checked.length === rows.length} onChange={toggleAll} />
                </th>
                <th style={{ width: 116 }}>เลขที่รายการ</th>
                <th style={{ minWidth: 190 }}>สมาชิกผู้เกษียณ</th>
                <th style={{ width: 118 }}>กลุ่ม</th>
                <th className="center" style={{ width: 96 }}>วันเกษียณ</th>
                <th className="num" style={{ width: 100 }}>หุ้นรวม</th>
                <th className="num" style={{ width: 108 }}>หนี้รวม</th>
                <th className="num" style={{ width: 100 }}>คงเหลือสุทธิ</th>
                <th className="center" style={{ width: 70 }}>ติดค้ำ</th>
                <th className="center" style={{ width: 118 }}>สถานะอายัด</th>
                <th className="center" style={{ width: 46 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="11" className="empty-state" style={{ padding: '22px 8px' }}>ไม่พบรายการตามเงื่อนไข</td></tr>
              ) : rows.map(r => {
                const st = window.rsSeizeStatus(r.seizeStatus);
                const debt = window.rsDebtTotal(r);
                const net = window.rsNetShare(r);
                const gcount = (r.guaranteeingOthers || []).length;
                const gpending = (r.guaranteeingOthers || []).filter(g => !g.changed).length;
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
                          <div className="muted mono" style={{ fontSize: 11 }}>{r.memberCode} · {r.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td>{rsGroupChip(r.group)}</td>
                    <td className="center">
                      <div>{fmt.date(r.retireDate)}</div>
                      {r.retireType === 'early' && <div className="muted" style={{ fontSize: 10.5 }}>ก่อนกำหนด</div>}
                    </td>
                    <td className="num mono">{fmt.money(r.shareTotal, 0)}</td>
                    <td className="num mono">{debt > 0 ? fmt.money(debt, 0) : '—'}</td>
                    <td className="num mono" style={{ color: net >= 0 ? 'var(--primary)' : 'var(--danger)' }}>{fmt.money(net, 0)}</td>
                    <td className="center">
                      {gcount > 0
                        ? <span className={'chip ' + (gpending > 0 ? 'warning' : 'success')}>{gcount} ราย</span>
                        : <span className="muted">—</span>}
                    </td>
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

      {reportModal && <RsReportModal onPick={(l) => { setReportModal(false); onToast && onToast(`ออกรายงาน: ${l} (สาธิต)`); }} onClose={() => setReportModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียด (detail)
// ════════════════════════════════════════════════════════════════════
function RsDetailView({ rec, onBack, onEdit, onNotifyGuarantor, onPrintLetter, onToast }) {
  const st = window.rsSeizeStatus(rec.seizeStatus);
  const debt = window.rsDebtTotal(rec);
  const interest = window.rsDebtInterest(rec);
  const net = window.rsNetShare(rec);
  const rt = window.rsRetireType(rec.retireType);

  const letterDefs = [
    { key: 'continueMembership', label: 'แจ้งความประสงค์การเป็นสมาชิกต่อ', when: 'ทุกกลุ่ม' },
    { key: 'demand', label: 'แจ้งให้ชำระหนี้ (กรณีหนี้มากกว่าหุ้น)', when: 'หนี้ > หุ้น' },
    { key: 'deductRequest', label: 'แจ้งต้นสังกัด ขอหักเงินบำเหน็จฯ', when: 'หนี้ > หุ้น' },
  ];

  return (
    <div data-screen-label="รายละเอียดอายัดหนี้ผู้เกษียณ">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('พิมพ์รายละเอียดผู้เกษียณ (สาธิต)')}><Icon name="print" size={13} /> พิมพ์</button>
        <button className="btn primary sm" onClick={() => onEdit(rec)}><Icon name="edit" size={13} /> แก้ไข</button>
      </div>

      {/* ── การ์ดหัวเรื่อง ── */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="user" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{rec.memberName} <span className="muted mono" style={{ fontSize: 13, fontWeight: 400 }}>· {rec.memberCode}</span></h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.no}</span><span className="dot" />
              <span>{rec.dept}</span><span className="dot" />
              <span>อายุ {rec.age} ปี</span><span className="dot" />
              <span>{rt.l} · {fmt.date(rec.retireDate)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className={'pill ' + st.pill}>{st.l}</span>
            {rsGroupChip(rec.group)}
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">ทุนเรือนหุ้น</span><span className="lt-date-v mono">฿ {fmt.money(rec.shareTotal, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">หนี้รวม (ทุกสัญญา)</span><span className="lt-date-v mono">{debt > 0 ? '฿ ' + fmt.money(debt, 0) : '— ไม่มีหนี้'}</span></div>
          <div className="lt-date"><span className="lt-date-k">ดอกเบี้ยสะสม</span><span className="lt-date-v mono">{interest > 0 ? '฿ ' + fmt.money(interest, 0) : '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">คงเหลือสุทธิ (หุ้น − หนี้)</span><span className="lt-date-v mono" style={{ color: net >= 0 ? 'var(--primary)' : 'var(--danger)', fontWeight: 700 }}>฿ {fmt.money(net, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ช่องทางรับเงิน</span><span className="lt-date-v">{rec.payChannel}</span></div>
        </div>
      </div>

      {/* ── ข้อมูลการเกษียณ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลการเกษียณ</h3></div>
        <div className="form-grid cols-3">
          <RsRow label="ประเภทเกษียณ" value={rt.l} />
          <RsRow label="วันที่เกษียณ" value={fmt.date(rec.retireDate)} />
          <RsRow label="อายุ" value={rec.age + ' ปี'} />
          <RsRow label="สังกัด" value={rec.dept} />
          <RsRow label="สถานะการอายัด" value={st.l} />
          <RsRow label="ช่องทางรับเงิน" value={rec.payChannel} />
        </div>
      </div>

      {/* ── หุ้น vs หนี้ (ทุกสัญญา + ดอกเบี้ย) ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>หุ้น เทียบ หนี้คงเหลือ (ทุกสัญญา)</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>{rsGroupChip(rec.group)}</div>
        </div>
        {(rec.contracts || []).length === 0 ? (
          <div className="jc-note-box"><Icon name="check" size={13} /> ไม่มีภาระหนี้ — ทุนเรือนหุ้น ฿ {fmt.money(rec.shareTotal, 0)} พร้อมคืนค่าหุ้นเมื่อพ้นสภาพ</div>
        ) : (
          <>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl">
                <thead><tr><th>เลขที่สัญญา</th><th>ประเภท</th><th className="num">เงินต้นคงเหลือ</th><th className="num">ดอกเบี้ยสะสม</th><th className="center">อัตรา</th><th className="num">รวมต่อสัญญา</th></tr></thead>
                <tbody>
                  {rec.contracts.map((c, i) => (
                    <tr key={i}>
                      <td className="mono">{c.contractNo}</td>
                      <td>{c.type}</td>
                      <td className="num mono">{fmt.money(c.principal, 0)}</td>
                      <td className="num mono">{fmt.money(c.interestAccrued, 0)}</td>
                      <td className="center mono">{c.rate}%</td>
                      <td className="num mono">{fmt.money((c.principal || 0) + (c.interestAccrued || 0), 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, background: 'var(--bg-subtle, var(--bg-hover))' }}>
                    <td colSpan="2">รวมหนี้ทุกสัญญา</td>
                    <td className="num mono">{fmt.money(window.rsDebtPrincipal(rec), 0)}</td>
                    <td className="num mono">{fmt.money(interest, 0)}</td>
                    <td />
                    <td className="num mono">{fmt.money(debt, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div></div>
            <div className="rs-balance">
              <div className="rs-bal-cell"><span className="k">ทุนเรือนหุ้น</span><span className="v mono">฿ {fmt.money(rec.shareTotal, 0)}</span></div>
              <div className="rs-bal-op">−</div>
              <div className="rs-bal-cell"><span className="k">หนี้รวมทุกสัญญา</span><span className="v mono" style={{ color: 'var(--danger)' }}>฿ {fmt.money(debt, 0)}</span></div>
              <div className="rs-bal-op">=</div>
              <div className="rs-bal-cell">
                <span className="k">{net >= 0 ? 'หุ้นคงเหลือหลังชำระหนี้' : 'หนี้ส่วนที่เกินหุ้น'}</span>
                <span className="v mono" style={{ color: net >= 0 ? 'var(--primary)' : 'var(--danger)', fontWeight: 800 }}>฿ {fmt.money(Math.abs(net), 0)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── การติดค้ำสมาชิกอื่น ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>การติดค้ำประกันสมาชิกอื่น</h3></div>
        {(rec.guaranteeingOthers || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '14px 8px' }}>ผู้เกษียณรายนี้ไม่ได้ค้ำประกันสมาชิกอื่น</div>
        ) : (
          <>
            {(rec.guaranteeingOthers || []).some(g => !g.changed) && (
              <div className="jc-alert" style={{ marginBottom: 10 }}>
                <span className="jc-alert-ico"><Icon name="info" size={16} /></span>
                <div className="jc-alert-body"><b>ต้องแจ้งเปลี่ยนผู้ค้ำประกัน</b>
                  <div className="jc-alert-lines"><span>ผู้เกษียณติดค้ำสมาชิกอื่น — แจ้งให้สมาชิกที่ถูกค้ำเปลี่ยนผู้ค้ำผ่าน CMS</span></div>
                </div>
              </div>
            )}
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl">
                <thead><tr><th>สมาชิกที่ถูกค้ำ</th><th>เลขที่สัญญา</th><th className="center">สถานะการแจ้ง</th><th className="center" style={{ width: 150 }}>จัดการ</th></tr></thead>
                <tbody>
                  {rec.guaranteeingOthers.map((g, i) => (
                    <tr key={i}>
                      <td>{g.name} <span className="muted mono" style={{ fontSize: 11 }}>({g.memberCode})</span></td>
                      <td className="mono">{g.contractNo}</td>
                      <td className="center">{g.changed ? <span className="pill ok">แจ้งเปลี่ยนแล้ว</span> : <span className="pill warn">รอแจ้งเปลี่ยน</span>}</td>
                      <td className="center">
                        {g.changed
                          ? <span className="muted" style={{ fontSize: 11 }}>—</span>
                          : <button className="btn sm" onClick={() => onNotifyGuarantor(rec, i)}><Icon name="bell" size={12} /> แจ้งเปลี่ยนผู้ค้ำ</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          </>
        )}
      </div>

      {/* ── หนังสือที่ออก ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หนังสือแจ้งผู้เกษียณ</h3></div>
        <div className="rs-letters">
          {letterDefs.map(ld => {
            const issued = rec.letters && rec.letters[ld.key];
            return (
              <div key={ld.key} className="rs-letter-row">
                <div className="rs-letter-info">
                  <span className="rs-letter-title">{ld.label}</span>
                  <span className="rs-letter-when">{ld.when}</span>
                </div>
                {issued
                  ? <span className="chip success"><Icon name="check" size={11} /> ออกแล้ว</span>
                  : <span className="chip">ยังไม่ออก</span>}
                <button className="btn sm" onClick={() => onPrintLetter(rec, ld.key, ld.label)}><Icon name="print" size={12} /> พิมพ์หนังสือ</button>
              </div>
            );
          })}
        </div>
      </div>

      {rec.note && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>หมายเหตุ</h3></div>
          <div className="muted" style={{ fontSize: 13 }}>{rec.note}</div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มบันทึก (create / edit)
// ════════════════════════════════════════════════════════════════════
function RsForm({ current, onSave, onCancel, onToast }) {
  const editing = !!current;
  const [member, setMember] = useState(() => current ? {
    code: current.memberCode, name: current.memberName, dept: current.dept, deptCode: current.deptCode || '', status: 'ปกติ',
  } : null);
  const [codeInput, setCodeInput] = useState(current ? current.memberCode : '');
  const [modal, setModal] = useState(false);
  const [f, setF] = useState(() => current ? { ...window.rsBlankForm(), ...current } : window.rsBlankForm());
  const [error, setError] = useState('');
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setError(''); };
  const setLetter = (k, v) => setF(p => ({ ...p, letters: { ...p.letters, [k]: v } }));

  const pickMember = (m) => { setMember(m); setCodeInput(m.code); setModal(false); setError(''); };
  const resolveCode = () => {
    const q = codeInput.trim();
    if (!q) { setModal(true); return; }
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');
    const hit = (window.DN_MEMBERS || []).find(m => norm(m.code) === norm(q) || norm(m.code).endsWith(norm(q)));
    if (hit) pickMember(hit); else setModal(true);
  };

  // สัญญา
  const addContract = () => setF(p => ({ ...p, contracts: [...(p.contracts || []), { contractNo: '', type: 'สามัญ', principal: 0, interestAccrued: 0, rate: 6.0 }] }));
  const setContract = (i, k, v) => setF(p => ({ ...p, contracts: p.contracts.map((c, j) => j === i ? { ...c, [k]: (k === 'contractNo' || k === 'type') ? v : Number(v) || 0 } : c) }));
  const delContract = (i) => setF(p => ({ ...p, contracts: p.contracts.filter((_, j) => j !== i) }));

  // ผู้ที่ถูกค้ำ
  const addGuar = () => setF(p => ({ ...p, guaranteeingOthers: [...(p.guaranteeingOthers || []), { memberCode: '', name: '', contractNo: '', changed: false }] }));
  const setGuar = (i, k, v) => setF(p => ({ ...p, guaranteeingOthers: p.guaranteeingOthers.map((g, j) => j === i ? { ...g, [k]: v } : g) }));
  const delGuar = (i) => setF(p => ({ ...p, guaranteeingOthers: p.guaranteeingOthers.filter((_, j) => j !== i) }));

  const rec = { ...f, shareTotal: Number(f.shareTotal) || 0 };
  const debt = window.rsDebtTotal(rec);
  const interest = window.rsDebtInterest(rec);
  const net = window.rsNetShare(rec);
  const groupPreview = window.rsClassify(rec);

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิกผู้เกษียณ';
    if (!f.retireDate) return 'กรุณาระบุวันที่เกษียณ';
    if (!(Number(f.shareTotal) >= 0) || f.shareTotal === '') return 'กรุณาระบุยอดทุนเรือนหุ้น';
    return '';
  };
  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    onSave({
      ...f,
      memberCode: member.code, memberName: member.name, dept: member.dept, deptCode: member.deptCode || '',
      age: Number(f.age) || 0, shareTotal: Number(f.shareTotal) || 0,
    }, editing);
  };

  return (
    <div data-screen-label="ฟอร์มบันทึกอายัดหนี้ผู้เกษียณ">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── สมาชิก + การเกษียณ ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สมาชิกผู้เกษียณ</h3></div>
        <div className="form-grid cols-4">
          <RsField label="เลขสมาชิก" required hint="(ค้นหาจากทะเบียน)">
            <div className="cs-code-wrap">
              <input className="cfg-input mono" value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && resolveCode()} placeholder="เช่น 041220" />
              <button className="btn primary cs-code-btn" onClick={resolveCode} title="ค้นหาสมาชิก"><Icon name="search" /></button>
            </div>
          </RsField>
          <RsField label="ชื่อ - สกุล"><input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(แสดงอัตโนมัติ)" /></RsField>
          <RsField label="สังกัด"><input className="cfg-input sr-auto" value={member ? member.dept : ''} readOnly placeholder="(แสดงอัตโนมัติ)" /></RsField>
          <RsField label="อายุ (ปี)"><input className="cfg-input mono" type="number" value={f.age} onChange={(e) => set('age', e.target.value)} placeholder="เช่น 60" /></RsField>
          <RsField label="ประเภทเกษียณ">
            <select className="cfg-input" value={f.retireType} onChange={(e) => set('retireType', e.target.value)}>
              {window.RS_RETIRE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </RsField>
          <RsField label="วันที่เกษียณ" required><ErpDate value={f.retireDate} onChange={(v) => ((e) => set('retireDate', e.target.value))({ target: { value: v } })} className="cfg-input" /></RsField>
          <RsField label="สถานะการอายัด">
            <select className="cfg-input" value={f.seizeStatus} onChange={(e) => set('seizeStatus', e.target.value)}>
              {window.RS_SEIZE_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </RsField>
          <RsField label="ช่องทางรับเงิน">
            <select className="cfg-input" value={f.payChannel} onChange={(e) => set('payChannel', e.target.value)}>
              {window.RS_PAY_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </RsField>
        </div>
      </div>

      {/* ── หุ้น + สัญญาหนี้ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ทุนเรือนหุ้น และหนี้ทุกสัญญา</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn sm" onClick={() => onToast && onToast(`ดอกเบี้ยสะสมทุกสัญญา ฿ ${fmt.money(interest, 0)} · หนี้รวม ฿ ${fmt.money(debt, 0)}`)}><Icon name="money" size={13} /> คำนวณดอกเบี้ยทุกสัญญา</button>
            <button className="btn sm" onClick={addContract}><Icon name="plus" size={13} /> เพิ่มสัญญา</button>
          </div>
        </div>
        <div className="form-grid cols-3" style={{ marginBottom: 12 }}>
          <RsField label="ทุนเรือนหุ้นรวม (บาท)" required><input className="cfg-input mono" type="number" value={f.shareTotal} onChange={(e) => set('shareTotal', e.target.value)} placeholder="0" /></RsField>
          <RsField label="กลุ่ม (คำนวณอัตโนมัติ)"><div style={{ height: 34, display: 'flex', alignItems: 'center' }}>{rsGroupChip(groupPreview)}</div></RsField>
          <RsField label="คงเหลือสุทธิ (หุ้น − หนี้)"><input className="cfg-input mono sr-auto" readOnly value={fmt.money(net, 0)} /></RsField>
        </div>
        {(f.contracts || []).length === 0 ? (
          <div className="jc-note-box"><Icon name="info" size={13} /> ยังไม่มีสัญญาหนี้ — หากไม่เพิ่ม ระบบจะจัดเป็นกลุ่ม “มีหุ้นอย่างเดียว”</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th style={{ minWidth: 150 }}>เลขที่สัญญา</th><th style={{ width: 110 }}>ประเภท</th><th className="num" style={{ width: 130 }}>เงินต้นคงเหลือ</th><th className="num" style={{ width: 130 }}>ดอกเบี้ยสะสม</th><th className="num" style={{ width: 80 }}>อัตรา%</th><th style={{ width: 46 }} /></tr></thead>
              <tbody>
                {f.contracts.map((c, i) => (
                  <tr key={i}>
                    <td><input className="cfg-input mono" value={c.contractNo} onChange={(e) => setContract(i, 'contractNo', e.target.value)} placeholder="ป1-…" /></td>
                    <td>
                      <select className="cfg-input" value={c.type} onChange={(e) => setContract(i, 'type', e.target.value)}>
                        <option>สามัญ</option><option>พิเศษ</option><option>ฉุกเฉิน</option>
                      </select>
                    </td>
                    <td><input className="cfg-input mono" type="number" value={c.principal} onChange={(e) => setContract(i, 'principal', e.target.value)} /></td>
                    <td><input className="cfg-input mono" type="number" value={c.interestAccrued} onChange={(e) => setContract(i, 'interestAccrued', e.target.value)} /></td>
                    <td><input className="cfg-input mono" type="number" value={c.rate} onChange={(e) => setContract(i, 'rate', e.target.value)} /></td>
                    <td className="center"><button className="btn ghost sm danger" onClick={() => delContract(i)} title="ลบ"><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: 'var(--bg-subtle, var(--bg-hover))' }}>
                  <td colSpan="2">รวมหนี้ทุกสัญญา</td>
                  <td className="num mono">{fmt.money(window.rsDebtPrincipal(rec), 0)}</td>
                  <td className="num mono">{fmt.money(interest, 0)}</td>
                  <td colSpan="2" className="mono">รวม ฿ {fmt.money(debt, 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div></div>
        )}
      </div>

      {/* ── ติดค้ำสมาชิกอื่น ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>การติดค้ำประกันสมาชิกอื่น</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={addGuar}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
          </div>
        </div>
        {(f.guaranteeingOthers || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '14px 8px' }}>ยังไม่มีข้อมูลการติดค้ำ</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th style={{ width: 120 }}>เลขสมาชิก</th><th>ชื่อสมาชิกที่ถูกค้ำ</th><th style={{ width: 160 }}>เลขที่สัญญา</th><th style={{ width: 46 }} /></tr></thead>
              <tbody>
                {f.guaranteeingOthers.map((g, i) => (
                  <tr key={i}>
                    <td><input className="cfg-input mono" value={g.memberCode} onChange={(e) => setGuar(i, 'memberCode', e.target.value)} placeholder="รหัส" /></td>
                    <td><input className="cfg-input" value={g.name} onChange={(e) => setGuar(i, 'name', e.target.value)} placeholder="ชื่อ-สกุล" /></td>
                    <td><input className="cfg-input mono" value={g.contractNo} onChange={(e) => setGuar(i, 'contractNo', e.target.value)} placeholder="เลขสัญญา" /></td>
                    <td className="center"><button className="btn ghost sm danger" onClick={() => delGuar(i)} title="ลบ"><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      {/* ── หนังสือ + หมายเหตุ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หนังสือแจ้งผู้เกษียณ</h3></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="jc-check-inline"><input type="checkbox" className="ch-box" checked={!!f.letters.continueMembership} onChange={(e) => setLetter('continueMembership', e.target.checked)} /><span>แจ้งความประสงค์การเป็นสมาชิกต่อ</span></label>
          <label className="jc-check-inline"><input type="checkbox" className="ch-box" checked={!!f.letters.demand} onChange={(e) => setLetter('demand', e.target.checked)} /><span>แจ้งให้ชำระหนี้ (กรณีหนี้มากกว่าหุ้น)</span></label>
          <label className="jc-check-inline"><input type="checkbox" className="ch-box" checked={!!f.letters.deductRequest} onChange={(e) => setLetter('deductRequest', e.target.checked)} /><span>แจ้งต้นสังกัด ขอหักเงินบำเหน็จฯ</span></label>
        </div>
        <div className="section-head" style={{ margin: '16px 0 10px' }}><span className="head-bar" /><h3>หมายเหตุ</h3></div>
        <textarea className="cfg-input" rows={3} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="ระบุหมายเหตุ (ถ้ามี)" />
      </div>

      {modal && <DnMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function RetireeSeizurePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.rsLoad);
  const [mode, setMode] = useState('list');
  const [current, setCurrent] = useState(null);
  const persist = (next) => { setList(next); window.rsSaveLS(next); };

  window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'อายัดหนี้ผู้เกษียณ', onClick: () => setMode('list') }, { label: current ? 'แก้ไขรายการ' : 'เพิ่มผู้เกษียณ', current: true }]
      : mode === 'detail'
        ? [{ label: 'อายัดหนี้ผู้เกษียณ', onClick: () => setMode('list') }, { label: 'รายละเอียด', current: true }]
        : [{ label: 'อายัดหนี้ผู้เกษียณ', current: true }],
    [mode, current && current.id]
  );

  const withGroup = (rec) => ({ ...rec, group: window.rsClassify(rec) });

  const save = (formData, editing) => {
    if (editing) {
      const updated = list.map(r => r.id === current.id ? withGroup({ ...r, ...formData }) : r);
      persist(updated);
      const rec = updated.find(r => r.id === current.id);
      audit.log && audit.log({ action: 'update', module: 'ทะเบียนและติดตามหนี้ — อายัดหนี้ผู้เกษียณ',
        target: `${rec.memberCode} · ${rec.memberName}`, summary: `แก้ไขรายการ ${rec.no}` });
      onToast && onToast(`บันทึกการแก้ไข ${rec.no} เรียบร้อยแล้ว`);
      setCurrent(rec); setMode('detail');
    } else {
      const no = window.rsNextNo(list);
      const rec = withGroup({ id: 'rs-' + Date.now().toString(36), no, ...formData,
        enteredBy: window.RS_USER, enteredAt: new Date().toISOString().slice(0, 16) });
      persist([rec, ...list]);
      audit.log && audit.log({ action: 'create', module: 'ทะเบียนและติดตามหนี้ — อายัดหนี้ผู้เกษียณ',
        target: `${rec.memberCode} · ${rec.memberName}`, summary: `เพิ่มผู้เกษียณ ${rec.no}` });
      onToast && onToast(`บันทึกผู้เกษียณ ${no} เรียบร้อยแล้ว`);
      setCurrent(rec); setMode('detail');
    }
  };

  const notifyGuarantor = (rec, idx) => {
    const gos = (rec.guaranteeingOthers || []).map((g, i) => i === idx ? { ...g, changed: true } : g);
    const updatedRec = withGroup({ ...rec, guaranteeingOthers: gos });
    persist(list.map(r => r.id === rec.id ? updatedRec : r));
    const g = rec.guaranteeingOthers[idx];
    audit.log && audit.log({ action: 'update', module: 'ทะเบียนและติดตามหนี้ — อายัดหนี้ผู้เกษียณ',
      target: `${g.memberCode} · ${g.name}`, summary: `แจ้งเปลี่ยนผู้ค้ำผ่าน CMS (ผู้เกษียณ ${rec.memberName} พ้นสภาพ)` });
    onToast && onToast(`แจ้งให้ ${g.name} เปลี่ยนผู้ค้ำประกันผ่าน CMS แล้ว`);
    setCurrent(updatedRec);
  };

  const printLetter = (rec, key, label) => {
    const letters = { ...(rec.letters || {}), [key]: true };
    const updatedRec = { ...rec, letters };
    persist(list.map(r => r.id === rec.id ? updatedRec : r));
    onToast && onToast(`พิมพ์หนังสือ: ${label} (สาธิต) — บันทึกสถานะออกหนังสือแล้ว`);
    setCurrent(updatedRec);
  };

  if (mode === 'form') return <RsForm current={current} onSave={save} onCancel={() => setMode('list')} onToast={onToast} />;
  if (mode === 'detail' && current) {
    const rec = list.find(r => r.id === current.id) || current;
    return <RsDetailView rec={rec} onBack={() => setMode('list')} onEdit={(r) => { setCurrent(r); setMode('form'); }}
                         onNotifyGuarantor={notifyGuarantor} onPrintLetter={printLetter} onToast={onToast} />;
  }
  return <RsListView list={list} onOpen={(r) => { setCurrent(r); setMode('detail'); }} onCreate={() => { setCurrent(null); setMode('form'); }} onToast={onToast} />;
}

Object.assign(window, { RetireeSeizurePage });
