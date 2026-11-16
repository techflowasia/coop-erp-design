// ═════════════════════════════════════════════════════════════════
//  ทะเบียนและติดตามหนี้ › งานประจำวัน › ติดตามหนี้  (DebtFollowPage)
//  โครงหน้าเดียวกับ "เรียกเก็บหนี้ตามคำพิพากษาตามยอม": list → detail → form
//  • list  : KPI + แบนเนอร์สรุป + ตัวกรอง + ตารางทุกสัญญา (ค่าเริ่ม = ค้างชำระ)
//  • detail: 6 แท็บ
//  • form  : บันทึกผลการติดตามรายสัญญา / ออกหนังสือเตือนเป็นชุด
// ═════════════════════════════════════════════════════════════════

const DF_TABS = [
  { id: 'contract', label: 'ข้อมูลสัญญา / ยอดหนี้' },
  { id: 'timeline', label: 'ประวัติการติดตาม' },
  { id: 'payments', label: 'ประวัติการชำระ' },
  { id: 'guarantors', label: 'ผู้ค้ำประกัน' },
  { id: 'letters', label: 'หนังสือ / เอกสารแนบ' },
  { id: 'appointment', label: 'นัดหมายติดตามครั้งต่อไป' },
];

function DfRow({ label, value, mono, danger }) {
  return (
    <div className="cl-drow">
      <span className="cl-drow-k">{label}</span>
      <span className={'cl-drow-v' + (mono ? ' mono' : '')} style={danger ? { color: 'var(--danger)' } : null}>{value}</span>
    </div>
  );
}

function DfField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="muted" style={{ fontSize: 11 }}>{label}{required && <b style={{ color: 'var(--danger)' }}> *</b>}</span>
      {children}
    </div>
  );
}

// ─── list ──────────────────────────────────────────────────────────
function DfListView({ rows, onOpen, onFollow, onBatch, onToast }) {
  const fmt = window.fmt;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [dept, setDept] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(true);   // ค่าเริ่มต้น = เฉพาะค้างชำระ
  const [sel, setSel] = useState([]);
  const [page, setPage] = useState(1);
  const PER = 10;

  const depts = Array.from(new Set(rows.map(r => r.dept))).sort();
  const filtered = rows.filter(r => {
    if (status !== 'all' && r.status !== status) return false;
    if (dept !== 'all' && r.dept !== dept) return false;
    if (overdueOnly && !r.overdueTerms) return false;
    if (q) {
      const s = (r.contractNo + ' ' + r.memberCode + ' ' + r.memberName + ' ' + r.typeName).toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pageCount);
  const paged = filtered.slice((cur - 1) * PER, cur * PER);

  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const totalArrears = rows.reduce((s, r) => s + r.interestArrears, 0);
  const overdueCnt = rows.filter(r => r.overdueTerms > 0).length;
  const severe = rows.filter(r => r.overdueTerms >= 3);
  const dueSoon = rows.filter(r => r.nextAppointment && r.nextAppointment <= '2026-06-20');

  const toggle = (id) => setSel(p => (p.includes(id) ? p.filter(x => x !== id) : p.concat(id)));
  const allOn = paged.length > 0 && paged.every(r => sel.includes(r.id));

  return (
    <>
      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">สัญญาทั้งหมด</div>
          <div className="stat-value">{fmt.int(rows.length)}</div>
          <div className="stat-sub">สัญญาในทะเบียน</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">ค้างชำระ</div>
          <div className="stat-value">{fmt.int(overdueCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>ต้องติดตาม</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">เงินต้นคงเหลือรวม</div>
          <div className="stat-value mono">{fmt.money(totalRemaining, 0)}</div>
          <div className="stat-sub">บาท</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">ดอกเบี้ยค้างรวม</div>
          <div className="stat-value mono">{fmt.money(totalArrears, 0)}</div>
          <div className="stat-sub">บาท</div>
        </div>
      </div>

      {(severe.length > 0 || dueSoon.length > 0) && (
        <div className="jc-alert">
          <span className="jc-alert-ico"><Icon name="info" size={16} /></span>
          <div className="jc-alert-body">
            <b>สรุปงานติดตามหนี้ ณ {fmt.date(window.dfToday())}</b>
            <div className="jc-alert-lines">
              <span>ค้างชำระตั้งแต่ 3 งวดขึ้นไป <b style={{ color: 'var(--danger)' }}>{severe.length}</b> สัญญา — ควรออกหนังสือเตือน/นัดเจรจา</span>
              <span className="jc-alert-sep">·</span>
              <span>นัดหมายติดตามภายใน 10 วัน <b>{dueSoon.length}</b> รายการ</span>
            </div>
          </div>
        </div>
      )}

      <div className="search-card" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <div className="toolbar" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="search" style={{ flex: '1 1 280px', maxWidth: 380 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เลขที่สัญญา / รหัสสมาชิก / ชื่อ / ประเภทเงินกู้" />
          </div>
          <select className="filter-select" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">ทุกสังกัด</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <label className="jc-check-inline" style={{ height: 34 }}>
            <input type="checkbox" className="ch-box" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
            <span>เฉพาะสัญญาที่ค้างชำระ</span>
          </label>
          <span className="spacer" />
          <button className="btn sm" disabled={!sel.length} onClick={() => onBatch(rows.filter(r => sel.includes(r.id)))}>
            <Icon name="report" /> ออกหนังสือเตือนเป็นชุด{sel.length ? ` (${sel.length})` : ''}
          </button>
          <button className="btn sm" onClick={() => onToast && onToast('ส่งออกทะเบียนติดตามหนี้เป็นไฟล์ Excel แล้ว')}>
            <Icon name="download" /> ส่งออก Excel
          </button>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>ทะเบียนสัญญาเพื่อติดตามหนี้</span>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11 }}>{fmt.int(filtered.length)} จาก {fmt.int(rows.length)} สัญญา</span>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1120 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }} className="center">
                    <input type="checkbox" className="ch-box" checked={allOn}
                      onChange={(e) => setSel(e.target.checked ? paged.map(r => r.id) : [])} />
                  </th>
                  <th>เลขที่รายการ</th>
                  <th>สมาชิกลูกหนี้</th>
                  <th className="center">กลุ่มสัญญา</th>
                  <th className="right">ยอดตามคำพิพากษา</th>
                  <th className="right">คงเหลือ</th>
                  <th className="center">ผิดนัด</th>
                  <th className="center">ติดตามล่าสุด</th>
                  <th className="center">สถานะ</th>
                  <th style={{ width: 34 }} />
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={10} className="center muted" style={{ padding: 28 }}>ไม่พบข้อมูล</td></tr>
                ) : paged.map((r, i) => {
                  const st = window.dfStatus(r.status);
                  return (
                    <tr key={r.id} className="row-click" onClick={() => onOpen(r)}>
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="ch-box" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td className="mono">{r.refNo}</td>
                      <td>
                        <b>{r.memberName}</b>
                        <div className="muted mono" style={{ fontSize: 11 }}>{r.memberCode} · {r.contractNo}</div>
                      </td>
                      <td className="center">
                        {(() => { const g = window.jcGroup ? window.jcGroup(r.group) : { short: '—', pill: 'neutral' };
                          return <span className={'pill ' + (g.pill === 'primary' ? 'ok' : g.pill === 'warning' ? 'warn' : g.pill)}>{g.short}</span>; })()}
                      </td>
                      <td className="right mono">{fmt.money(r.judgmentAmount, 0)}</td>
                      <td className="right mono" style={r.remaining > 0 ? null : { color: 'var(--primary)' }}>{fmt.money(r.remaining, 0)}</td>
                      <td className="center">
                        {r.overdueTerms
                          ? <span className={'pill ' + (r.overdueTerms >= 3 ? 'bad' : 'warn')}>{r.overdueTerms} งวด</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td className="center">{r.lastFollowDate ? fmt.date(r.lastFollowDate) : <span className="muted">—</span>}</td>
                      <td className="center"><span className={'pill ' + st.pill}>{st.label}</span></td>
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <button className="btn text sm" title="บันทึกผลการติดตาม" onClick={() => onFollow(r)}><Icon name="chevRight" size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pagination" style={{ padding: '10px 12px', borderTop: '1px solid var(--divider)' }}>
          <span className="muted" style={{ fontSize: 11, marginRight: 'auto' }}>
            แสดง {filtered.length ? (cur - 1) * PER + 1 : 0}–{Math.min(cur * PER, filtered.length)} จาก {fmt.int(filtered.length)} รายการ
          </span>
          <button className="btn sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><Icon name="chevLeft" /></button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 8).map(n => (
            <button key={n} className={'btn sm' + (n === cur ? ' primary' : '')} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="btn sm" disabled={cur >= pageCount} onClick={() => setPage(cur + 1)}><Icon name="chevRight" /></button>
        </div>
      </div>
    </>
  );
}

// ─── detail ────────────────────────────────────────────────────────
function DfDetailView({ rec, onBack, onFollow, onToast }) {
  const fmt = window.fmt;
  const [tab, setTab] = useState('contract');
  const st = window.dfStatus(rec.status);

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span style={{ fontWeight: 600, fontSize: 14 }} className="mono">{rec.contractNo}</span>
        <span className={'pill ' + st.pill}>{st.label}</span>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('กำลังเตรียมพิมพ์ใบติดตามหนี้ ' + rec.contractNo)}><Icon name="print" /> พิมพ์ใบติดตาม</button>
        <button className="btn primary sm" onClick={() => onFollow(rec)}><Icon name="plus" /> บันทึกผลการติดตาม</button>
      </div>

      <div className="search-stats" style={{ marginBottom: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-label">เงินต้นคงเหลือ</div><div className="stat-value mono">{fmt.money(rec.remaining, 0)}</div><div className="stat-sub">บาท</div></div>
        <div className="stat-card warn"><div className="stat-label">ดอกเบี้ยค้าง</div><div className="stat-value mono">{fmt.money(rec.interestArrears, 0)}</div><div className="stat-sub">บาท</div></div>
        <div className="stat-card"><div className="stat-label">งวดค้างชำระ</div><div className="stat-value">{rec.overdueTerms}</div><div className="stat-sub">{rec.overdueDays} วัน</div></div>
        <div className="stat-card"><div className="stat-label">ชำระ / งวด</div><div className="stat-value mono">{fmt.money(rec.installment, 0)}</div><div className="stat-sub">บาท</div></div>
      </div>

      <div className="tabs-container">
        <div className="tabs-bar" style={{ flexWrap: 'wrap' }}>
          {DF_TABS.map(t => (
            <button key={t.id} className={'tab' + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        {tab === 'contract' && (
          <>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ข้อมูลสัญญาและยอดหนี้</h3></div>
            <div className="cl-detail-grid">
              <DfRow label="เลขที่สัญญา" value={rec.contractNo} mono />
              <DfRow label="ประเภทเงินกู้" value={rec.typeName} />
              <DfRow label="อัตราดอกเบี้ย" value={rec.rate.toFixed(2) + '% ต่อปี'} />
              <DfRow label="วันทำสัญญา" value={fmt.date(rec.startDate)} />
              <DfRow label="วงเงินตามสัญญา" value={fmt.money(rec.principal, 0)} mono />
              <DfRow label="เงินต้นคงเหลือ" value={fmt.money(rec.remaining, 0)} mono />
              <DfRow label="ดอกเบี้ยค้าง" value={fmt.money(rec.interestArrears, 0)} mono danger={!!rec.interestArrears} />
              <DfRow label="ชำระต่องวด" value={fmt.money(rec.installment, 0)} mono />
              <DfRow label="สมาชิก" value={rec.memberCode + ' · ' + rec.memberName} />
              <DfRow label="สังกัด" value={rec.deptCode + ' · ' + rec.dept} />
              <DfRow label="สถานะสมาชิก" value={rec.memberStatus} />
              <DfRow label="เจ้าหน้าที่ผู้รับผิดชอบ" value={rec.owner} />
            </div>
            {rec.note && <div className="jc-note-box" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {rec.note}</div>}
          </>
        )}

        {tab === 'timeline' && (
          <>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ประวัติการติดตาม</h3></div>
            {rec.followLog.length === 0 ? (
              <div className="jc-note-box"><Icon name="info" size={13} /> ยังไม่มีประวัติการติดตามสำหรับสัญญานี้</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rec.followLog.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '104px 1fr', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--divider)' }}>
                    <div>
                      <b style={{ fontSize: 12 }}>{fmt.date(l.date)}</b>
                      <div className="muted" style={{ fontSize: 11 }}>{l.by}</div>
                    </div>
                    <div>
                      <span className="pill info">{window.dfKind(l.kind)}</span>
                      <div style={{ marginTop: 4, fontSize: 12.5 }}>{l.result}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'payments' && (
          <>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ประวัติการชำระ 6 งวดล่าสุด</h3></div>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 640 }}>
                <thead><tr><th>งวด</th><th className="center">ครบกำหนด</th><th className="right">ยอดที่ต้องชำระ</th><th className="right">ชำระจริง</th><th className="center">วันที่ชำระ</th><th className="center">ช่องทาง</th></tr></thead>
                <tbody>
                  {rec.payments.map((p, i) => (
                    <tr key={i}>
                      <td className="mono">{p.period}</td>
                      <td className="center">{fmt.date(p.due)}</td>
                      <td className="right mono">{fmt.money(p.amount, 0)}</td>
                      <td className="right mono" style={p.paid ? null : { color: 'var(--danger)' }}>{p.paid ? fmt.money(p.paid, 0) : 'ค้างชำระ'}</td>
                      <td className="center">{p.date ? fmt.date(p.date) : '—'}</td>
                      <td className="center">{p.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          </>
        )}

        {tab === 'guarantors' && (
          <>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ผู้ค้ำประกัน</h3></div>
            {rec.guarantors.length === 0 ? (
              <div className="jc-note-box"><Icon name="info" size={13} /> สัญญานี้ใช้หลักทรัพย์ค้ำประกัน ไม่มีบุคคลค้ำประกัน</div>
            ) : (
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl" style={{ minWidth: 560 }}>
                  <thead><tr><th style={{ width: 48 }} className="center">ลำดับ</th><th>ผู้ค้ำประกัน</th><th className="right">วงเงินค้ำ</th><th className="center">สถานะ</th></tr></thead>
                  <tbody>
                    {rec.guarantors.map((g, i) => (
                      <tr key={i}>
                        <td className="center">{i + 1}</td>
                        <td>{g}</td>
                        <td className="right mono">{fmt.money(rec.remaining / rec.guarantors.length, 0)}</td>
                        <td className="center"><span className="pill ok">ค้ำอยู่</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </>
        )}

        {tab === 'letters' && (
          <>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หนังสือและเอกสารแนบ</h3></div>
            {rec.letters.length === 0 ? (
              <div className="jc-note-box"><Icon name="info" size={13} /> ยังไม่มีหนังสือที่ออกสำหรับสัญญานี้</div>
            ) : (
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl" style={{ minWidth: 640 }}>
                  <thead><tr><th>เลขที่หนังสือ</th><th>ประเภท</th><th className="center">วันที่ออก</th><th className="center">สถานะ</th><th className="center" style={{ width: 80 }}>พิมพ์</th></tr></thead>
                  <tbody>
                    {rec.letters.map((l, i) => (
                      <tr key={i}>
                        <td className="mono">{l.no}</td>
                        <td>{l.kind}</td>
                        <td className="center">{fmt.date(l.date)}</td>
                        <td className="center"><span className={'pill ' + (l.sent ? 'ok' : 'warn')}>{l.sent ? 'ส่งแล้ว' : 'รอส่ง'}</span></td>
                        <td className="center"><button className="btn text sm" onClick={() => onToast && onToast('กำลังเตรียมพิมพ์ ' + l.no)}><Icon name="print" size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
            )}
          </>
        )}

        {tab === 'appointment' && (
          <>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>นัดหมายติดตามครั้งต่อไป</h3></div>
            {rec.nextAppointment ? (
              <div className="cl-detail-grid">
                <DfRow label="วันที่นัดหมาย" value={fmt.date(rec.nextAppointment)} />
                <DfRow label="ช่องทาง" value="โทรติดตาม / นัดพบที่สังกัด" />
                <DfRow label="ผู้รับผิดชอบ" value={rec.owner} />
                <DfRow label="เป้าหมาย" value={rec.overdueTerms >= 3 ? 'เสนอปรับโครงสร้างหนี้' : 'เร่งชำระงวดค้าง'} />
              </div>
            ) : (
              <div className="jc-note-box"><Icon name="check" size={13} /> ไม่มีนัดหมายค้างอยู่ — สัญญาชำระตามกำหนด</div>
            )}
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button className="btn sm" onClick={() => onFollow(rec)}><Icon name="edit" /> แก้ไข / ตั้งนัดหมายใหม่</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── form: บันทึกผลการติดตามรายสัญญา ───────────────────────────────
function DfFollowForm({ rec, onCancel, onSave }) {
  const [f, setF] = useState({
    date: window.dfToday(), kind: 'call', by: rec.owner,
    result: '', status: rec.status, next: rec.nextAppointment || '', issueLetter: false, note: rec.note || '',
  });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.result.trim()) { setErr('กรุณาบันทึกผลการติดตาม'); return; }
    setErr('');
    onSave(f);
  };

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> ยกเลิก</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>บันทึกผลการติดตามหนี้ · <span className="mono">{rec.contractNo}</span></span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={submit}><Icon name="check" /> บันทึก</button>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ผลการติดตาม</h3></div>
        <div className="cl-detail-grid">
          <DfField label="วันที่ติดตาม" required><ErpDate value={f.date} onChange={(v) => ((e) => set('date', e.target.value))({ target: { value: v } })} className="cfg-input" /></DfField>
          <DfField label="วิธีติดตาม" required>
            <select className="cfg-input" value={f.kind} onChange={(e) => set('kind', e.target.value)}>
              {window.DF_FOLLOW_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </DfField>
          <DfField label="ผู้ติดตาม"><input className="cfg-input" value={f.by} onChange={(e) => set('by', e.target.value)} /></DfField>
          <DfField label="สถานะติดตามหลังบันทึก">
            <select className="cfg-input" value={f.status} onChange={(e) => set('status', e.target.value)}>
              {window.DF_STATUSES.filter(s => s.id !== 'all').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </DfField>
          <DfField label="นัดหมายครั้งต่อไป"><ErpDate value={f.next} onChange={(v) => ((e) => set('next', e.target.value))({ target: { value: v } })} className="cfg-input" /></DfField>
          <DfField label="ออกหนังสือเตือนพร้อมกัน">
            <label className="jc-check-inline" style={{ height: 34 }}>
              <input type="checkbox" className="ch-box" checked={f.issueLetter} onChange={(e) => set('issueLetter', e.target.checked)} />
              <span>ออกหนังสือเตือนให้ชำระหนี้</span>
            </label>
          </DfField>
        </div>

        <div className="section-head" style={{ margin: '16px 0 10px' }}><span className="head-bar" /><h3>รายละเอียด</h3></div>
        <textarea className="cfg-input" rows={3} placeholder="ผลการติดตาม เช่น ติดต่อได้ ลูกหนี้ขอผ่อนผัน 2 งวด"
          value={f.result} onChange={(e) => set('result', e.target.value)} />
        <textarea className="cfg-input" rows={2} style={{ marginTop: 8 }} placeholder="หมายเหตุภายใน (ถ้ามี)"
          value={f.note} onChange={(e) => set('note', e.target.value)} />
        {err && <div className="jc-note-box" style={{ marginTop: 10, color: 'var(--danger)' }}><Icon name="warning" size={13} /> {err}</div>}
      </div>
    </>
  );
}

// ─── form: ออกหนังสือเตือนเป็นชุด ──────────────────────────────────
function DfBatchForm({ rows, onCancel, onSave }) {
  const fmt = window.fmt;
  const [date, setDate] = useState(window.dfToday());
  const [kind, setKind] = useState('หนังสือเตือนให้ชำระหนี้ ครั้งที่ 1');
  const [deadline, setDeadline] = useState('2026-06-30');
  const [copyDept, setCopyDept] = useState(true);

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> ยกเลิก</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>ออกหนังสือเตือนเป็นชุด · {fmt.int(rows.length)} สัญญา</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => onSave({ date, kind, deadline, copyDept })}><Icon name="check" /> ออกหนังสือ</button>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายละเอียดหนังสือ</h3></div>
        <div className="cl-detail-grid">
          <DfField label="วันที่ออกหนังสือ" required><ErpDate value={date} onChange={(v) => ((e) => setDate(e.target.value))({ target: { value: v } })} className="cfg-input" /></DfField>
          <DfField label="ประเภทหนังสือ" required>
            <select className="cfg-input" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option>หนังสือเตือนให้ชำระหนี้ ครั้งที่ 1</option>
              <option>หนังสือเตือนให้ชำระหนี้ ครั้งที่ 2</option>
              <option>หนังสือเตือนให้ชำระหนี้ ครั้งที่ 3</option>
              <option>หนังสือเชิญเจรจาปรับโครงสร้างหนี้</option>
            </select>
          </DfField>
          <DfField label="กำหนดชำระภายใน" required><ErpDate value={deadline} onChange={(v) => ((e) => setDeadline(e.target.value))({ target: { value: v } })} className="cfg-input" /></DfField>
          <DfField label="สำเนาถึงต้นสังกัด">
            <label className="jc-check-inline" style={{ height: 34 }}>
              <input type="checkbox" className="ch-box" checked={copyDept} onChange={(e) => setCopyDept(e.target.checked)} />
              <span>ส่งสำเนาถึงหน่วยงานต้นสังกัด</span>
            </label>
          </DfField>
        </div>

        <div className="section-head" style={{ margin: '16px 0 10px' }}><span className="head-bar" /><h3>สัญญาที่จะออกหนังสือ</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead><tr><th>เลขที่สัญญา</th><th>สมาชิก</th><th className="center">งวดค้าง</th><th className="right">เงินต้นคงเหลือ</th><th className="right">ดอกเบี้ยค้าง</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.contractNo}</td>
                  <td>{r.memberCode} · {r.memberName}</td>
                  <td className="center">{r.overdueTerms || '—'}</td>
                  <td className="right mono">{fmt.money(r.remaining, 0)}</td>
                  <td className="right mono">{fmt.money(r.interestArrears, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>
    </>
  );
}

// ─── หน้าจอหลัก ────────────────────────────────────────────────────
function DebtFollowPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [rows, setRows] = useState(window.dfPool);
  const [mode, setMode] = useState('list');       // list | detail | form | batch
  const [current, setCurrent] = useState(null);
  const [batchRows, setBatchRows] = useState([]);

  const persist = (next) => { setRows(next); window.dfSave(next); };

  const saveFollow = (f) => {
    const next = rows.map(r => {
      if (r.id !== current.id) return r;
      const log = [{ date: f.date, kind: f.kind, by: f.by, result: f.result }].concat(r.followLog);
      const letters = f.issueLetter
        ? [{ no: 'นส-2569/' + String(700 + Math.floor(Math.random() * 200)), date: f.date, kind: 'หนังสือเตือนให้ชำระหนี้', sent: false }].concat(r.letters)
        : r.letters;
      return { ...r, followLog: log, letters, status: f.status, nextAppointment: f.next || null, lastFollowDate: f.date, note: f.note };
    });
    persist(next);
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ติดตามหนี้',
      target: current.memberCode + ' · ' + current.memberName,
      summary: 'บันทึกผลการติดตาม สัญญา ' + current.contractNo + ' · ' + window.dfKind(f.kind) + (f.issueLetter ? ' · ออกหนังสือเตือน' : ''),
      changes: [{ field: 'สถานะติดตาม', before: window.dfStatus(current.status).label, after: window.dfStatus(f.status).label }],
    });
    onToast && onToast('บันทึกผลการติดตามสัญญา ' + current.contractNo + ' แล้ว');
    setCurrent(next.find(r => r.id === current.id));
    setMode('detail');
  };

  const saveBatch = (info) => {
    const ids = batchRows.map(r => r.id);
    const next = rows.map(r => (ids.includes(r.id)
      ? { ...r, letters: [{ no: 'นส-2569/ชุด-' + info.date.replace(/-/g, '').slice(4), date: info.date, kind: info.kind, sent: true }].concat(r.letters), status: r.status === 'normal' ? 'letter' : r.status }
      : r));
    persist(next);
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ติดตามหนี้',
      target: 'ออกหนังสือเป็นชุด ' + batchRows.length + ' สัญญา',
      summary: info.kind + ' · กำหนดชำระภายใน ' + info.deadline + (info.copyDept ? ' · สำเนาถึงต้นสังกัด' : ''),
      changes: [],
    });
    onToast && onToast('ออกหนังสือเตือน ' + batchRows.length + ' ฉบับแล้ว');
    setMode('list');
  };

  return (
    <div data-screen-label="ติดตามหนี้">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="guarantee" size={20} /></span>
          <div>
            <h1>ติดตามหนี้</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · งานประจำวัน — ทะเบียนสัญญาทั้งหมดเพื่อติดตามการชำระหนี้</div>
          </div>
        </div>
      </div>

      {mode === 'list' && (
        <DfListView rows={rows} onToast={onToast}
          onOpen={(r) => { setCurrent(r); setMode('detail'); }}
          onFollow={(r) => { setCurrent(r); setMode('form'); }}
          onBatch={(rs) => { setBatchRows(rs); setMode('batch'); }} />
      )}
      {mode === 'detail' && current && (
        <DfDetailView rec={current} onToast={onToast}
          onBack={() => setMode('list')}
          onFollow={(r) => { setCurrent(r); setMode('form'); }} />
      )}
      {mode === 'form' && current && (
        <DfFollowForm rec={current} onCancel={() => setMode(current ? 'detail' : 'list')} onSave={saveFollow} />
      )}
      {mode === 'batch' && (
        <DfBatchForm rows={batchRows} onCancel={() => setMode('list')} onSave={saveBatch} />
      )}
    </div>
  );
}
