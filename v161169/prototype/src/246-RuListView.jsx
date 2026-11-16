// ════════════════════════════════════════════════════════════════════
//  เงินสงเคราะห์สมาชิก — ทะเบียนคำขอ (list) + รายละเอียด + ประวัติ
//  + หน้าหลัก ReliefRequestPage (สลับ list / form / detail)
// ════════════════════════════════════════════════════════════════════

// ─── ทะเบียน / ติดตามคำขอ ───────────────────────────────────────────
function RuListView({ list, onCreate, onOpenHistory, onOpen, onPrint }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('all');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (dateFrom) r = r.filter(x => x.reqDate >= dateFrom);
    if (dateTo) r = r.filter(x => x.reqDate <= dateTo);
    if (code.trim()) {
      const n = code.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) ||
                        (x.deceasedName || '').toLowerCase().includes(n));
    }
    if (type !== 'all') r = r.filter(x => x.typeCode === type);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.reqDate.localeCompare(a.reqDate) || b.id.localeCompare(a.id));
  }, [list, dateFrom, dateTo, code, type, statusF]);

  const hasFilter = dateFrom || dateTo || code || type !== 'all' || statusF !== 'all';
  const clear = () => { setDateFrom(''); setDateTo(''); setCode(''); setType('all'); setStatusF('all'); };

  const totalAmount = rows.reduce((s, r) => s + (Number(r.requested) || 0), 0);
  const pendingCnt = rows.filter(r => r.status !== 'paid').length;

  return (
    <div data-screen-label="หน้าทะเบียนคำขอเงินสงเคราะห์สมาชิก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เงินสงเคราะห์สมาชิก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            สวัสดิการและเงินสงเคราะห์สมาชิก · รายการคำขอที่ยื่นเข้ามา — ดูรายละเอียดและพิมพ์ใบคำขอย้อนหลังได้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> เพิ่มคำขอ</button>
      </div>

      <div className="search-card">
        {/* ── ตัวกรองค้นหา ── */}
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>วันยื่นคำขอ (จาก – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขสมาชิก / ชื่อ / เลขใบคำขอ / ผู้เสียชีวิต</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น M-058241, DS-2569-0001" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภท</span>
            <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">ทุกประเภท</option>
              {window.RELIEF_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} - {t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 150 }}>
              <option value="all">ทุกสถานะ</option>
              {window.RELIEF_STATUS.map(s => <option key={s.v} value={s.v}>{s.step} : {s.l}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>
          )}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {/* ── ตารางคำขอ ── */}
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขใบคำขอ</th>
                <th className="center">วันยื่นคำขอ</th>
                <th>สมาชิกผู้ขอ</th>
                <th>ประเภท</th>
                <th>ผู้เสียชีวิต / รายละเอียด</th>
                <th className="num">ยอดที่ขอ</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 96 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.reliefStatus(r.status);
                const t = window.reliefType(r.typeCode) || {};
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="center mono">{fmt.date(r.reqDate)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono" style={{ fontSize: 11 }}>{t.code}</span> · {t.label}</td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.deceasedName || r.disasterKind || r.disabType || r.reqDetail || '—'}</div>
                      <div className="muted" style={{ fontSize: 10 }}>{(r.deceasedDeathDate || r.disasterDate || r.disabDate || r.eventDate) ? fmt.date(r.deceasedDeathDate || r.disasterDate || r.disabDate || r.eventDate) : '—'}</div>
                    </td>
                    <td className="num"><b>{fmt.money(r.requested, 2)}</b></td>
                    <td className="center"><span className={"pill " + st.pill}>{st.step} : {st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 2 }}>
                        <button className="bud-act" title="ดูรายละเอียด" onClick={() => onOpen(r)}><Icon name="eye" size={13} /></button>
                        <button className="bud-act" title="พิมพ์ใบคำขอ" onClick={() => onPrint(r)}><Icon name="print" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียด · ปุ่มพิมพ์ในคอลัมน์จัดการเพื่อพิมพ์ใบคำขอ/ใบสำคัญรับเงินย้อนหลัง
        </p>
      </div>
    </div>
  );
}

// ─── รายละเอียดคำขอ (อ่านอย่างเดียว) ─────────────────────────────────
function RuDetailRow({ label, value, mono }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={"value" + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}
function RuDetailView({ rec, onBack, onPrint }) {
  if (!rec) return null;
  const structure = (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || []));
  const st = window.reliefStatus(rec.status);
  const t = window.reliefType(rec.typeCode) || {};
  const welfareName = rec.welfareName || window.reliefWelfareName(rec.welfareCode || window.reliefWelfareOfType(rec.typeCode)) || window.RELIEF_WELFARE_NAME;
  const m = (window.MEMBERS_LIST || []).find(x => x.code === rec.memberCode) || {};
  const memberYears = window.reliefMemberYears(m.joinDate);
  const paid = rec.status === 'paid';
  const cat = window.reliefCatOf(rec.welfareCode || window.reliefWelfareOfType(rec.typeCode));
  return (
    <div data-screen-label="หน้ารายละเอียดคำขอเงินสงเคราะห์สมาชิก">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => onPrint(rec)}><Icon name="print" /> พิมพ์ใบคำขอ</button>
      </div>

      {/* การ์ดหัวเรื่อง — รูปแบบเดียวกับหน้ารายละเอียดค่าคงที่ข้อกำหนดสินเชื่อ */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">รายละเอียดคำขอเงินสงเคราะห์</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{welfareName}</span><span className="dot" />
              <span>ยื่นเมื่อ {fmt.date(rec.reqDate)}</span><span className="dot" />
              <span>โดย {rec.enteredBy}</span>
            </div>
          </div>
          <span className={"pill " + st.pill} style={{ height: 24 }}>{st.step} : {st.l}</span>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">สมาชิกผู้ขอ</span>
            <span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ประเภท</span>
            <span className="lt-date-v">{t.code} · {t.label}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ยอดเงินสงเคราะห์ที่ขอ</span>
            <span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>฿ {fmt.money(rec.requested, 2)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">สถานะการจ่าย</span>
            <span className="lt-date-v">{paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลส่วนหัวของคำขอ</h3></div>
        <div className="form-grid">
          <RuDetailRow label="สวัสดิการ" value={welfareName} />
          <RuDetailRow label="ประเภท" value={`${t.code} · ${t.label}`} />
          <RuDetailRow label="เลขใบคำขอ" value={rec.id} mono />
          <RuDetailRow label="วันยื่นคำขอ" value={fmt.date(rec.reqDate)} />
          <RuDetailRow label="ผู้ป้อนคำขอ" value={rec.enteredBy} />
          <RuDetailRow label="เลขติดตามงาน" value={rec.trackingNo} mono />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สมาชิกผู้ขอใช้สิทธิ</h3></div>
        <div className="form-grid">
          <RuDetailRow label="เลขสมาชิก" value={rec.memberCode} mono />
          <RuDetailRow label="ชื่อ-สกุล" value={rec.memberName} />
          <RuDetailRow label="เป็นสมาชิก (วันที่สมัคร)" value={m.joinDate ? fmt.date(m.joinDate) : '—'} />
          <RuDetailRow label="งวดหุ้นที่ส่ง" value={window.reliefShareTerms(m.joinDate) + ' งวด'} />
          <RuDetailRow label="อายุสมาชิก" value={memberYears.toFixed(2) + ' ปี'} />
          <RuDetailRow label="สังกัด" value={m.deptCode ? `${m.deptCode} · ${m.dept}` : (m.dept || '—')} />
        </div>
      </div>

      {cat === 'death' && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดผู้เสียชีวิต</h3></div>
          <div className="form-grid">
            <RuDetailRow label="ชื่อผู้เสียชีวิต" value={rec.deceasedName} />
            <RuDetailRow label="ความสัมพันธ์" value={t.relation} />
            <RuDetailRow label="เลขบัตรประชาชน" value={rec.deceasedCitizenId} mono />
            <RuDetailRow label="วันเสียชีวิต" value={rec.deceasedDeathDate ? fmt.date(rec.deceasedDeathDate) : '—'} />
            <RuDetailRow label="อายุผู้เสียชีวิต" value={rec.deceasedAge ? rec.deceasedAge + ' ปี' : '—'} />
            <RuDetailRow label="สาเหตุการเสียชีวิต" value={rec.deceasedCause} />
            <RuDetailRow label="เลขที่ใบมรณบัตร" value={rec.deathCertNo} mono />
            <RuDetailRow label="หน่วยงานที่ออกเอกสาร" value={rec.deathCertOrg} />
          </div>
        </div>
      )}

      {rec.benefName && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ผู้รับผลประโยชน์ / ผู้รับเงิน</h3></div>
          <div className="form-grid">
            <RuDetailRow label="ชื่อผู้รับเงิน" value={rec.benefName} />
            <RuDetailRow label="ความสัมพันธ์" value={window.reliefLabel('relation', rec.benefRelation)} />
            <RuDetailRow label="เลขบัตรประชาชนผู้รับเงิน" value={rec.benefCitizenId} mono />
            <RuDetailRow label="เบอร์โทรศัพท์" value={rec.benefPhone} mono />
            <RuDetailRow label="ที่อยู่ผู้รับเงิน" value={rec.benefAddr} />
          </div>
        </div>
      )}

      {cat === 'disaster' && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดภัยพิบัติ และบ้านที่ประสบภัย</h3></div>
          <div className="form-grid">
            <RuDetailRow label="ประเภทภัยพิบัติ" value={rec.disasterKind} />
            <RuDetailRow label="วันประสบภัย" value={rec.disasterDate ? fmt.date(rec.disasterDate) : '—'} />
            <RuDetailRow label="ระดับความเสียหาย" value={window.reliefLabel('damage', rec.damage)} />
            <RuDetailRow label="หน่วยงานรับรอง" value={rec.certOrg} />
            <RuDetailRow label="สาเหตุ / รายละเอียดเหตุการณ์" value={rec.disasterDetail} />
            <RuDetailRow label="สถานะที่พักอาศัย" value={window.reliefLabel('residence', rec.residence)} />
            <RuDetailRow label="ที่อยู่บ้านที่ประสบภัย" value={[rec.houseNo, rec.moo && 'หมู่ ' + rec.moo, rec.tambon, rec.amphoe, rec.province, rec.postal].filter(Boolean).join(' ')} />
            <RuDetailRow label="รหัสทะเบียนบ้าน" value={rec.houseRegNo} mono />
          </div>
        </div>
      )}

      {cat === 'disability' && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดทุพพลภาพ</h3></div>
          <div className="form-grid">
            <RuDetailRow label="ผู้ทุพพลภาพ" value={rec.memberName} />
            <RuDetailRow label="ประเภททุพพลภาพ" value={rec.disabType} />
            <RuDetailRow label="ระดับทุพพลภาพ" value={window.reliefLabel('disab', rec.disabLevel)} />
            <RuDetailRow label="วันที่ทุพพลภาพ" value={rec.disabDate ? fmt.date(rec.disabDate) : '—'} />
            <RuDetailRow label="สาเหตุ" value={rec.disabCause} />
            <RuDetailRow label="โรงพยาบาล / หน่วยแพทย์" value={rec.hospital} />
            <RuDetailRow label="เลขที่ใบรับรองแพทย์" value={rec.medCertNo} mono />
            {rec.renewDate && <RuDetailRow label="วันครบกำหนดต่ออายุ" value={fmt.date(rec.renewDate)} />}
          </div>
        </div>
      )}

      {cat === 'general' && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดคำขอ (สวัสดิการทั่วไป)</h3></div>
          <div className="form-grid">
            <RuDetailRow label="วันที่เกิดเหตุ" value={rec.eventDate ? fmt.date(rec.eventDate) : '—'} />
            <RuDetailRow label="อ้างอิงมติกรรมการ" value={rec.boardRef} />
            <RuDetailRow label="รายละเอียดคำขอ" value={rec.reqDetail} />
            <RuDetailRow label="เหตุผลการขอ" value={rec.reqReason} />
          </div>
        </div>
      )}

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สิทธิสวัสดิการ และหมายเหตุ</h3></div>
        <div className="form-grid">
          <RuDetailRow label="สิทธิ" value={'฿ ' + fmt.money(rec.eligible, 2)} />
          <RuDetailRow label="ยอดที่ขอ" value={'฿ ' + fmt.money(rec.requested, 2)} />
          <RuDetailRow label="ยื่นเอกสารเกินกว่า 120 วัน" value={rec.over120 ? 'ใช่' : 'ไม่ใช่'} />
          {rec.over120 && <RuDetailRow label="เหตุผลกรณียื่นเกิน 120 วัน" value={rec.over120Reason || '—'} />}
          <RuDetailRow label="หมายเหตุ" value={rec.note || '—'} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดการรับเงิน</h3></div>
        <div className="form-grid">
          <RuDetailRow label="รับเงินโดย" value={window.reliefLabel('payBy', rec.payBy)} />
          <RuDetailRow label="ธนาคาร" value={rec.bank ? window.reliefLabel('bank', rec.bank) : '—'} />
          <RuDetailRow label="เลขที่บัญชี" value={rec.payAccount || rec.coopAccount || '—'} mono />
          <RuDetailRow label="ชื่อบัญชี / ผู้รับ" value={rec.accName || rec.cashName || rec.moName || rec.coopAccName || '—'} />
          <RuDetailRow label="เลขที่ธนาณัติ" value={rec.moNo || '—'} mono />
          <RuDetailRow label="วันที่จ่าย" value={rec.payDate ? fmt.date(rec.payDate) : '—'} />
          <RuDetailRow label="สถานะการจ่าย" value={paid ? 'PAID — จ่ายแล้ว' : 'UNPAID — ยังไม่จ่าย'} />
        </div>
      </div>

      {rec.docs && rec.docs.length > 0 && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เอกสารแนบ</h3></div>
          <div className="ru-doc-list">
            {rec.docs.map((d, i) => {
              const ds = (window.RELIEF_DOC_STATUS || []).find(x => x.v === d.status) || { l: '—', pill: 'neutral' };
              return (
                <div className={"ru-doc-row" + (d.attached ? ' attached' : '')} key={i}>
                  <div className="ru-doc-type"><Icon name="attach" size={14} /> {d.type}</div>
                  <span className="muted" style={{ fontSize: 12 }}>{d.attached ? 'แนบแล้ว' : 'ยังไม่แนบ'}</span>
                  <span className={"pill " + ds.pill}>{ds.l}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {rec.disburse && rec.disburse.length > 0 && (
        <BudgetDisburseDetail structure={structure} lines={rec.disburse} />
      )}
    </div>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะโมดูลเงินสงเคราะห์) ────────────────────
function RuHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('เงินสงเคราะห์'))]
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
            <div className="muted" style={{ fontSize: 11 }}>เงินสงเคราะห์สมาชิก</div>
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
                    <div className={"tx-dot " + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={"pill " + a.pill}>{a.label}</span>
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
//  หน้าหลัก — สลับ list / form / detail + จัดการพิมพ์
// ════════════════════════════════════════════════════════════════════
function ReliefRequestPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ruLoad);
  const [mode, setMode] = useState('list');     // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [histOpen, setHistOpen] = useState(false);

  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const doPrint = (rec) => {
    setPrintDoc(rec);
    setTimeout(() => window.printRelief(onToast), 80);
  };

  const submit = (rec, alsoPrint) => {
    const next = [rec, ...list];
    setList(next);
    ruSaveLS(next);
    const t = window.reliefType(rec.typeCode) || {};
    const subj = rec.deceasedName ? `ผู้เสียชีวิต ${rec.deceasedName}`
      : rec.disasterKind ? `ภัยพิบัติ ${rec.disasterKind}`
      : rec.disabType ? `ทุพพลภาพ ${rec.disabType}` : 'สวัสดิการทั่วไป';
    audit.log({
      action: 'create', module: 'สวัสดิการ — เงินสงเคราะห์สมาชิก',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ยื่นคำขอเงินสงเคราะห์ ${rec.id} · ${t.label} · ${subj} · ${fmt.money(rec.requested, 2)} บาท`,
      changes: [
        { field: 'เลขใบคำขอ', before: '—', after: rec.id },
        { field: 'ประเภท', before: '—', after: `${t.code} · ${t.label}` },
        { field: 'รายละเอียด', before: '—', after: subj },
        { field: 'ยอดที่ขอ', before: '—', after: `${fmt.money(rec.requested, 2)} บาท` },
      ],
    });
    onToast && onToast(`บันทึกคำขอ ${rec.id} · ${rec.memberName} เรียบร้อยแล้ว`);
    setMode('list');
    if (alsoPrint) doPrint(rec);
  };

  return (
    <>
      {mode === 'list'
        ? <RuListView list={list} onCreate={() => setMode('form')} onOpenHistory={() => setHistOpen(true)}
                      onOpen={openDetail} onPrint={doPrint} />
        : mode === 'detail'
          ? <RuDetailView rec={current} onBack={() => setMode('list')} onPrint={doPrint} />
          : <RuCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} />}
      {histOpen && <RuHistoryDrawer onClose={() => setHistOpen(false)} />}
      <ReliefPrintSheet rec={printDoc} />
    </>
  );
}

Object.assign(window, { ReliefRequestPage });
