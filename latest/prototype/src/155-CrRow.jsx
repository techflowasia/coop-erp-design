// ════════════════════════════════════════════════════════════════════
//  ระบบงานขอสินไหม / งานขอสินไหม
//  บันทึกทะเบียนขอสินไหม — ClaimRegisterPage (list · form · detail)
//  ทะเบียนกลางเชื่อมข้อมูลสมาชิก · ประกัน · หนี้ · ผู้รับผลประโยชน์ · เอกสาร
//  form อยู่ในไฟล์ components-claim-register-form.jsx (ClaimRegisterForm)
// ════════════════════════════════════════════════════════════════════

// ─── แถวข้อมูลอ่านอย่างเดียว ───────────────────────────────────────────
function CrRow({ label, value, mono, tone, strong }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={"value" + (mono ? ' mono' : '') + (tone ? ' ' + tone : '')}
            style={strong ? { fontWeight: 700 } : null}>{value ?? '—'}</span>
    </div>
  );
}
window.CrRow = CrRow;

// ═════════════════════════════════════════════════════════════════════
//  ทะเบียนคำขอสินไหม (list)
// ═════════════════════════════════════════════════════════════════════
function CrListView({ list, onCreate, onOpen, onReject, onToast }) {
  const [q, setQ] = useState('');
  const [rejectRec, setRejectRec] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [draft, setDraft] = useState({ q: '', statusF: 'all' });
  const doSearch = () => { setQ(draft.q); setStatusF(draft.statusF); setPage(1); };
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);
  const doReset = () => { setDraft({ q: '', statusF: 'all' }); setQ(''); setStatusF('all'); setPage(1); };

  const rows = useMemo(() => {
    let r = list.map(rec => {
      const m = (window.CL_MEMBERS || []).find(x => x.code === rec.memberCode) || {};
      return { rec, m };
    });
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(({ rec, m }) =>
        String(rec.id).toLowerCase().includes(n) ||
        (m.name || '').toLowerCase().includes(n) ||
        (rec.memberCode || '').toLowerCase().includes(n) ||
        (m.citizenId || '').includes(n));
    }
    if (statusF !== 'all') r = r.filter(({ rec }) => rec.status === statusF);
    return r.sort((a, b) => String(b.rec.reqDate).localeCompare(String(a.rec.reqDate)) || String(b.rec.id).localeCompare(String(a.rec.id)));
  }, [list, q, statusF]);

  const inProgress = list.filter(r => !['closed', 'rejected', 'refunded'].includes(r.status)).length;
  const totalActual = list.reduce((s, r) => s + (Number(r.actual) || 0), 0);
  const offsetTotal = (rec) => (rec.debts || []).reduce((s, d) => s + (Number(d.offset) || 0), 0);

  return (
    <div data-screen-label="หน้าทะเบียนคำขอสินไหม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกทะเบียนขอสินไหม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 860 }}>
            ทะเบียนกลางคำขอสินไหมประกัน · ค้นหาสมาชิก ตรวจสอบสิทธิความคุ้มครอง ดึงหนี้คงเหลือ
            คำนวณยอดตัดชำระ และคืนเงินให้ผู้รับผลประโยชน์ / ทายาท
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออก Excel (สาธิต)')}><Icon name="download" size={13} /> ส่งออก Excel</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> เพิ่มคำขอใหม่</button>
      </div>

      <div className="dxc-stat-row">
        <div className="dxc-stat"><span className="k">คำขอทั้งหมด</span><span className="v mono">{list.length}</span></div>
        <div className="dxc-stat"><span className="k">อยู่ระหว่างดำเนินการ</span><span className="v mono" style={{ color: 'var(--warning)' }}>{inProgress}</span></div>
        <div className="dxc-stat"><span className="k">รับเงินสินไหมสะสม</span><span className="v mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(totalActual, 0)}</span></div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, padding: '14px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>ค้นหา</span>
            <div className="gcc-search-input" style={{ flex: 'none', width: 340, maxWidth: 'none' }}>
              <Icon name="search" size={14} />
              <input className="cfg-input" value={draft.q} onChange={(e) => setDraft(d => ({ ...d, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                     placeholder="เลขคำขอ / ชื่อสมาชิก / เลขสมาชิก / บัตรประชาชน…" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>สถานะคำขอ</span>
            <select className="cfg-input" style={{ width: 180 }} value={draft.statusF} onChange={(e) => setDraft(d => ({ ...d, statusF: e.target.value }))}>
              <option value="all">ทั้งหมด</option>
              {Object.entries(window.CR_STATUS).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn primary" onClick={doSearch}>ค้นหา</button>
            <button type="button" className="btn" onClick={doReset}>รีเซ็ต</button>
          </div>
        </div>
        <div style={{ padding: 16 }}>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1040 }}>
            <thead><tr>
              <th style={{ width: 130 }}>เลขที่คำขอ</th>
              <th className="center" style={{ width: 92 }}>วันที่ยื่น</th>
              <th style={{ minWidth: 200 }}>สมาชิกผู้เอาประกัน</th>
              <th style={{ width: 96 }}>ประเภท</th>
              <th className="center" style={{ width: 92 }}>วันเสียชีวิต</th>
              <th className="num" style={{ width: 120 }}>ยอดสินไหม</th>
              <th className="num" style={{ width: 120 }}>ตัดชำระหนี้</th>
              <th className="center" style={{ width: 150 }}>สถานะคำขอ</th>
              <th className="center" style={{ width: 200 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.slice((Math.min(page, Math.max(1, Math.ceil(rows.length / per))) - 1) * per, Math.min(page, Math.max(1, Math.ceil(rows.length / per))) * per).map(({ rec, m }) => {
                const st = window.crStatus(rec.status);
                const amt = Number(rec.actual) || Number(rec.estimate) || 0;
                return (
                  <tr key={rec.id} className="clickable" onClick={() => onOpen(rec)}>
                    <td className="mono">{rec.id}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(rec.reqDate)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{(m.name || '?').replace(/^(นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{m.name || '—'}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{rec.memberCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>{window.crReqTypeLabel(rec.reqType)}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{rec.death && rec.death.date ? fmt.date(rec.death.date) : '—'}</td>
                    <td className="num mono">{amt ? fmt.money(amt, 0) : '—'}</td>
                    <td className="num mono" style={{ color: offsetTotal(rec) ? 'var(--danger)' : 'inherit' }}>{offsetTotal(rec) ? fmt.money(offsetTotal(rec), 0) : '—'}</td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                    <td className="center"><div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button className="btn sm" style={{ background: '#fff' }} onClick={(e) => { e.stopPropagation(); onOpen(rec); }}><Icon name="eye" size={12} /> ดู</button>
                      {!['rejected', 'closed', 'received', 'offset', 'refunded'].includes(rec.status) &&
                        <button className="btn danger sm" onClick={(e) => { e.stopPropagation(); setRejectNote(''); setRejectRec(rec); }}><Icon name="close" size={12} /> ปฏิเสธการจ่าย</button>}
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        {(() => {
          const total = rows.length, pages = Math.max(1, Math.ceil(total / per)), curPage = Math.min(page, pages);
          const from = total ? (curPage - 1) * per + 1 : 0, to = Math.min(curPage * per, total);
          const pgStyle = (active, disabled) => ({
            minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
            cursor: disabled ? 'default' : 'pointer',
            border: '1px solid ' + (active ? '#237450' : '#d9d9d9'),
            background: active ? '#237450' : '#fff',
            color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)'),
          });
          let st = Math.max(1, curPage - 2); const en = Math.min(pages, st + 4); st = Math.max(1, en - 4);
          const nums = []; for (let i = st; i <= en; i++) nums.push(i);
          return (
            <div style={{ padding: '12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>{total === 0 ? '0 รายการ' : from + '-' + to + ' จาก ' + total + ' รายการ'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button style={pgStyle(false, curPage <= 1)} disabled={curPage <= 1} onClick={() => setPage(curPage - 1)} aria-label="ก่อนหน้า">‹</button>
                {nums.map(i => <button key={i} style={pgStyle(i === curPage, false)} onClick={() => setPage(i)}>{i}</button>)}
                <button style={pgStyle(false, curPage >= pages)} disabled={curPage >= pages} onClick={() => setPage(curPage + 1)} aria-label="ถัดไป">›</button>
                <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }} aria-label="จำนวนต่อหน้า"
                        style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                  {[20, 50, 100].map(n => <option key={n} value={n}>{n} / หน้า</option>)}
                </select>
              </div>
            </div>
          );
        })()}
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อเปิดรายละเอียดคำขอ · "เพิ่มคำขอใหม่" เพื่อบันทึกทะเบียนขอสินไหมรายใหม่
        </p>
        </div>
      </div>

      {rejectRec && (
        <>
          <div className="modal-backdrop" onClick={() => setRejectRec(null)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480, maxWidth: '94vw' }}>
            <div className="modal-head">
              <h2>ปฏิเสธการจ่ายเงินสินไหม</h2>
              <button className="close-btn" onClick={() => setRejectRec(null)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                คุณต้องการบันทึกว่าบริษัทประกันไม่อนุมัติจ่ายคำขอ <b className="mono">{rejectRec.id}</b> ใช่หรือไม่?
                <div className="muted" style={{ fontSize: 12 }}>สถานะคำขอจะเปลี่ยนเป็น "ปฏิเสธสินไหม" และบันทึกในประวัติดำเนินการ</div>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                <span>เหตุผลที่บริษัทประกันแจ้ง <span style={{ color: 'var(--danger)' }}>*</span></span>
                <textarea className="cfg-input" rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="เช่น อยู่ในข้อยกเว้นของกรมธรรม์" />
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setRejectRec(null)}>ยกเลิก</button>
              <button className="btn danger" disabled={!rejectNote.trim()} onClick={() => { onReject && onReject(rejectRec, rejectNote.trim()); setRejectRec(null); }}><Icon name="close" size={13} /> ยืนยันปฏิเสธการจ่าย</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  รายละเอียดคำขอ (อ่านอย่างเดียว) — รูปแบบ detail header card ของ DS
// ═════════════════════════════════════════════════════════════════════
const CR_MODULE = 'ขอสินไหม — ทะเบียนขอสินไหม';

// ── Modal ประวัติการดำเนินการ — ไทม์ไลน์ (rec.history + Audit Trail ของคำขอนี้) ──
function CrHistoryModal({ rec, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = (ctx && ctx.entries) || window.AUDIT_SEED || [];
  const auditRows = all
    .filter((e) => e.module === CR_MODULE && String(e.summary || '').includes(rec.id))
    .map((e) => ({ action: e.action, ts: e.ts, summary: e.summary, user: e.user, changes: e.changes }));
  const histRows = (rec.history || []).map((h) => ({
    action: h.status === 'draft' ? 'create' : 'status', ts: String(h.date).slice(0, 10) + 'T00:00',
    summary: h.detail, user: h.by, note: h.note,
    changes: [{ field: 'สถานะคำขอ', before: '—', after: window.crStatus(h.status).l }],
  }));
  const hist = [...auditRows, ...histRows].sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  const actionMeta = (a) => a === 'create'
    ? { label: 'บันทึกคำขอ', color: 'var(--success)', icon: 'plus' }
    : a === 'status' ? { label: 'เปลี่ยนสถานะคำขอ', color: 'var(--warning)', icon: 'refresh' }
    : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการเพิ่ม/แก้ไขคำขอสินไหม</h2>
            <div className="muted" style={{ fontSize: 11 }}>{rec.id} · {rec.memberCode} — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hist.map((h, i) => {
              const mt = actionMeta(h.action);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < hist.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + mt.color + ' 14%, transparent)', color: mt.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={mt.icon} size={14} />
                    </div>
                    {i < hist.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{mt.label}</span>
                      <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
                        {fmt.date(String(h.ts).slice(0, 10))}{String(h.ts).slice(11, 16) && String(h.ts).slice(11, 16) !== '00:00' ? ' · ' + String(h.ts).slice(11, 16) + ' น.' : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{h.summary}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}{h.note ? ' · ' + h.note : ''}</div>
                    {h.changes && h.changes.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {h.changes.map((c, ci) => (
                          <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span className="muted" style={{ minWidth: 110 }}>{c.field}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                            <Icon name="chevRight" size={11} />
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

function CrDetailView({ rec, onBack, onEdit, onToast }) {
  const [histOpen, setHistOpen] = React.useState(false);
  if (!rec) return null;
  const m = (window.CL_MEMBERS || []).find(x => x.code === rec.memberCode) || {};
  const policy = (m.policies || []).find(p => p.id === rec.policyId) || null;
  const st = window.crStatus(rec.status);
  const cov = window.crCoverageStatus(policy, rec.death && rec.death.date);
  const age = window.crAgeAt(m.birthDate, rec.death && rec.death.date);
  const offsetTotal = (rec.debts || []).reduce((s, d) => s + (Number(d.offset) || 0), 0);
  const debtTotal = (rec.debts || []).reduce((s, d) => s + d.principal + d.interest + d.penalty, 0);
  const fin = window.crFinance(rec.actual, offsetTotal);
  const pctSum = (rec.beneficiaries || []).reduce((s, b) => s + (Number(b.pct) || 0), 0);
  const lastHist = (rec.history || [])[(rec.history || []).length - 1];
  const savedBadge = lastHist && lastHist.date
    ? ((window.savedBadgeLabel && window.savedBadgeLabel(String(lastHist.date))) || ('บันทึกล่าสุด: ' + fmt.date(lastHist.date)))
    : null;

  return (
    <div data-screen-label="หน้ารายละเอียดคำขอสินไหม">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <span className="spacer" />
        {savedBadge && <span className="saved-badge">{savedBadge}</span>}
        <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" size={13} /> ประวัติ</button>
        <button className="btn sm" onClick={() => setTimeout(() => window.print(), 60)}><Icon name="print" size={13} /> พิมพ์ทะเบียน</button>
        {!['closed'].includes(rec.status) && <button className="btn primary sm" onClick={onEdit}><Icon name="edit" size={13} /> แก้ไขคำขอ</button>}
      </div>

      {histOpen && <CrHistoryModal rec={rec} onClose={() => setHistOpen(false)} />}

      <CrPrintSheet rec={rec} m={m} policy={policy} fin={fin} debtTotal={debtTotal} offsetTotal={offsetTotal} age={age} />

      {/* หัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{m.name || '—'}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>ขอสินไหม{window.crReqTypeLabel(rec.reqType)}</span><span className="dot" />
              <span>ยื่นเมื่อ {fmt.date(rec.reqDate)}</span><span className="dot" />
              <span>โดย {rec.enteredBy}</span>
            </div>
          </div>
          <span className={"pill " + st.pill} style={{ height: 24 }}>{st.l}</span>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">สมาชิกผู้เอาประกัน</span><span className="lt-date-v">{m.name} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span></div>
          <div className="lt-date"><span className="lt-date-k">วันที่เสียชีวิต</span><span className="lt-date-v">{rec.death && rec.death.date ? fmt.date(rec.death.date) : '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">สถานะความคุ้มครอง</span><span className="lt-date-v"><span className={"pill " + cov.pill}>{cov.l}</span></span></div>
          <div className="lt-date"><span className="lt-date-k">ยอดสินไหมที่ได้รับ</span><span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>{rec.actual ? '฿ ' + fmt.money(rec.actual, 0) : '—'}</span></div>
        </div>
      </div>

      {/* สรุปการเงิน */}
      <div className={"search-card cr-fin-card tone-" + fin.tone} style={{ marginBottom: 12 }}>
        <div className="cr-fin-grid">
          <div className="cr-fin-cell"><span className="k">ยอดสินไหมที่ได้รับจริง</span><span className="v mono">฿ {fmt.money(fin.actual, 0)}</span></div>
          <div className="cr-fin-op">−</div>
          <div className="cr-fin-cell"><span className="k">ยอดหนี้ที่ต้องตัดชำระ</span><span className="v mono" style={{ color: 'var(--danger)' }}>฿ {fmt.money(fin.offsetTotal, 0)}</span></div>
          <div className="cr-fin-op">=</div>
          <div className="cr-fin-cell">
            <span className="k">{fin.shortfall > 0 ? 'ยอดขาดที่ต้องติดตาม' : 'ยอดคงเหลือที่ต้องคืน'}</span>
            <span className="v mono" style={{ color: fin.shortfall > 0 ? 'var(--danger)' : 'var(--primary)', fontWeight: 800 }}>฿ {fmt.money(fin.shortfall > 0 ? fin.shortfall : fin.refund, 0)}</span>
          </div>
          <div className="cr-fin-badge"><span className={"pill " + (fin.tone === 'ok' ? 'ok' : fin.tone === 'bad' ? 'bad' : fin.tone === 'info' ? 'info' : 'neutral')}>{fin.statusLabel}</span></div>
        </div>
      </div>

      {/* สมาชิก + การเสียชีวิต */}
      <div className="sr-two-col" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3></div>
          <div className="form-grid">
            <CrRow label="เลขสมาชิก" value={rec.memberCode} mono />
            <CrRow label="เลขบัตรประชาชน" value={m.citizenId} mono />
            <CrRow label="สังกัด" value={m.dept} />
            <CrRow label="ประเภทสมาชิก" value={m.memberStatus} />
            <CrRow label="วันที่เข้าเป็นสมาชิก" value={m.joinDate ? fmt.date(m.joinDate) : '—'} />
            <CrRow label="สถานะการทำงาน" value={m.workStatus} />
          </div>
        </div>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลการเสียชีวิต</h3></div>
          <div className="form-grid">
            <CrRow label="วันที่เสียชีวิต" value={rec.death && rec.death.date ? fmt.date(rec.death.date) : '—'} tone="danger" />
            <CrRow label="อายุ ณ วันที่เสียชีวิต" value={age != null ? age + ' ปี' : '—'} />
            <CrRow label="สาเหตุการเสียชีวิต" value={rec.death && rec.death.cause} />
            <CrRow label="สถานที่เสียชีวิต" value={rec.death && rec.death.place} />
            <CrRow label="เลขที่ใบมรณบัตร" value={rec.death && rec.death.certNo} mono />
            <CrRow label="วันที่ออกใบมรณบัตร" value={rec.death && rec.death.certDate ? fmt.date(rec.death.certDate) : '—'} />
          </div>
        </div>
      </div>

      {/* ประกัน */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลโครงการประกันที่ยื่นขอสินไหม</h3>
          <span className="spacer" /><span className={"pill " + cov.pill}>{cov.l}</span></div>
        {policy ? (
          <div className="form-grid">
            <CrRow label="รหัสโครงการประกัน" value={policy.projCode} mono />
            <CrRow label="ชื่อโครงการประกัน" value={policy.projName} />
            <CrRow label="ประเภทประกัน" value={policy.insType} />
            <CrRow label="บริษัทประกัน" value={policy.company} />
            <CrRow label="เลขที่กรมธรรม์" value={policy.policyNo} mono />
            <CrRow label="ระยะคุ้มครอง" value={`${fmt.date(policy.startDate)} – ${fmt.date(policy.endDate)}`} />
            <CrRow label="ทุนประกัน" value={'฿ ' + fmt.money(policy.coverage, 0)} mono />
            <CrRow label="ยอดสินไหมที่คาดว่าจะได้รับ" value={'฿ ' + fmt.money(rec.estimate, 0)} mono strong />
          </div>
        ) : <div className="cl-empty"><Icon name="info" size={14} /> ไม่พบข้อมูลกรมธรรม์ที่อ้างอิง</div>}
      </div>

      {/* ผู้รับผลประโยชน์ */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div className="sh-grid-head">
          <div><div className="sh-grid-title">ผู้รับผลประโยชน์ / ทายาท</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>รวมสัดส่วน {pctSum}% · แบ่งยอดคงเหลือ ฿{fmt.money(fin.refund, 0)}</div></div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 940 }}>
            <thead><tr>
              <th style={{ width: 40 }} className="center">#</th><th style={{ minWidth: 170 }}>ชื่อ-นามสกุล</th><th>ความสัมพันธ์</th>
              <th>เลขบัตรประชาชน</th><th>บัญชีรับเงิน</th><th className="center">สัดส่วน</th><th className="num">จำนวนเงิน</th><th className="center">เอกสาร</th>
            </tr></thead>
            <tbody>
              {(rec.beneficiaries || []).map((b, i) => {
                const ds = window.CR_BEN_DOC[b.docStatus] || window.CR_BEN_DOC.pending;
                return (
                  <tr key={i}>
                    <td className="center muted">{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{b.name}</td>
                    <td>{b.relation}</td>
                    <td className="mono">{b.citizenId || '—'}</td>
                    <td>{b.accountNo ? `${window.crBankLabel(b.bank)} · ${b.accountNo}` : <span className="muted">—</span>}</td>
                    <td className="center mono">{b.pct}%</td>
                    <td className="num mono"><b>{fmt.money(fin.refund * (Number(b.pct) || 0) / 100, 0)}</b></td>
                    <td className="center"><span className={"pill " + ds.pill}>{ds.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* หนี้ + การตัดชำระ */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div className="sh-grid-head">
          <div><div className="sh-grid-title">ข้อมูลหนี้และการตัดชำระ</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>ดึงจากระบบเงินกู้ / ทะเบียนและติดตามหนี้ ณ วันบันทึกคำขอ</div></div>
        </div>
        {(rec.debts || []).length === 0 ? (
          <div className="cl-empty"><Icon name="info" size={14} /> ไม่มีหนี้คงเหลือ — คำนวณสินไหมทั้งหมดเป็นยอดคืนให้ผู้รับผลประโยชน์</div>
        ) : (
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl" style={{ minWidth: 980 }}>
              <thead><tr>
                <th>เลขที่สัญญา</th><th>ประเภท</th><th className="num">เงินต้นคงเหลือ</th><th className="num">ดอกเบี้ยค้าง</th>
                <th className="num">ค่าปรับ</th><th className="num">ยอดหนี้รวม</th><th className="center">สถานะ</th><th className="num">ยอดตัดชำระ</th>
              </tr></thead>
              <tbody>
                {rec.debts.map((d, i) => {
                  const cs = window.crContractTag(d.status);
                  const tot = d.principal + d.interest + d.penalty;
                  return (
                    <tr key={i}>
                      <td className="mono">{d.no}</td><td>{d.type}</td>
                      <td className="num mono">{fmt.money(d.principal, 0)}</td>
                      <td className="num mono">{fmt.money(d.interest, 0)}</td>
                      <td className="num mono">{d.penalty ? fmt.money(d.penalty, 0) : '—'}</td>
                      <td className="num mono">{fmt.money(tot, 0)}</td>
                      <td className="center"><span className={"pill " + cs.pill}>{cs.l}</span></td>
                      <td className="num mono"><b>{fmt.money(d.offset, 0)}</b></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="sh-grid-total">
                <td colSpan="5" className="right"><b>รวม</b></td>
                <td className="num mono"><b>{fmt.money(debtTotal, 0)}</b></td>
                <td></td>
                <td className="num mono"><b>{fmt.money(offsetTotal, 0)}</b></td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </div>

      {/* เอกสาร + ประวัติ */}
      <div className="sr-two-col" style={{ marginBottom: 12 }}>
        <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-head cl-card-head"><span className="head-bar" /><h3>เอกสารประกอบ</h3>
            <span className="spacer" /><span className="muted" style={{ fontSize: 11.5 }}>{(rec.docs || []).filter(d => d.status === 'complete').length}/{(rec.docs || []).length} ครบ</span></div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl">
              <thead><tr><th>ประเภทเอกสาร</th><th className="center" style={{ width: 70 }}>จำเป็น</th><th className="center" style={{ width: 100 }}>สถานะ</th></tr></thead>
              <tbody>
                {(rec.docs || []).map((d, i) => {
                  const ds = window.crDocTag(d.status);
                  return (
                    <tr key={i}>
                      <td>{d.type}{d.file && <div className="muted mono" style={{ fontSize: 10 }}><Icon name="attach" size={10} /> {d.file}</div>}</td>
                      <td className="center">{d.required ? <span className="chip danger">จำเป็น</span> : <span className="chip">ไม่บังคับ</span>}</td>
                      <td className="center"><span className={"pill " + ds.pill}>{ds.l}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ประวัติการดำเนินการ</h3></div>
          <div className="cr-timeline">
            {(rec.history || []).slice().reverse().map((h, i) => {
              const hs = window.crStatus(h.status);
              return (
                <div className="cr-tl-item" key={i}>
                  <div className={"cr-tl-dot " + hs.pill} />
                  <div className="cr-tl-body">
                    <div className="cr-tl-top"><span className="cr-tl-title">{h.detail}</span><span className="cr-tl-date mono">{fmt.date(h.date)}</span></div>
                    <div className="cr-tl-meta">โดย {h.by}{h.note ? ' · ' + h.note : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  Main
// ═════════════════════════════════════════════════════════════════════
function ClaimRegisterPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.crLoad);
  const [mode, setMode] = useState('list');   // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const persist = (next) => { setList(next); window.crSave(next); };

  window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'บันทึกทะเบียนขอสินไหม', onClick: () => setMode('list') }, { label: current ? 'แก้ไขคำขอ' : 'เพิ่มคำขอใหม่', current: true }]
      : mode === 'detail'
        ? [{ label: 'บันทึกทะเบียนขอสินไหม', onClick: () => setMode('list') }, { label: 'รายละเอียดคำขอ', current: true }]
        : [{ label: 'บันทึกทะเบียนขอสินไหม', current: true }],
    [mode, current && current.id]
  );

  const save = (rec, stay) => {
    const exists = list.some(r => r.id === rec.id);
    const next = exists ? list.map(r => r.id === rec.id ? rec : r) : [rec, ...list];
    persist(next);
    const m = (window.CL_MEMBERS || []).find(x => x.code === rec.memberCode) || {};
    audit.log({ action: exists ? 'update' : 'create', module: 'ขอสินไหม — ทะเบียนขอสินไหม',
      target: `${rec.memberCode} · ${m.name || ''}`,
      summary: `${exists ? 'แก้ไข' : 'บันทึก'}คำขอสินไหม ${rec.id} · ${window.crReqTypeLabel(rec.reqType)} · สถานะ ${window.crStatus(rec.status).l}`,
      changes: [{ field: 'เลขที่คำขอ', before: exists ? rec.id : '—', after: rec.id },
                { field: 'สถานะ', before: '—', after: window.crStatus(rec.status).l }] });
    setCurrent(rec);
    if (!stay) setMode('detail');
  };

  return (
    <>
      {mode === 'list' && <CrListView list={list} onCreate={() => { setCurrent(null); setMode('form'); }} onOpen={(r) => { setCurrent(r); setMode('detail'); }} onReject={(r, note) => {
        const today = new Date().toISOString().slice(0, 10);
        save({ ...r, status: 'rejected', history: [...(r.history || []), { date: today, status: 'rejected', detail: 'บริษัทประกันปฏิเสธการจ่ายสินไหม', by: window.CRF_USER || 'เจ้าหน้าที่', note }] }, true);
        onToast && onToast(`บันทึกปฏิเสธการจ่ายคำขอ ${r.id} เรียบร้อย`);
      }} onToast={onToast} />}
      {mode === 'form' && <ClaimRegisterForm list={list} initial={current} onSubmit={save} onCancel={() => setMode(current ? 'detail' : 'list')} onToast={onToast} />}
      {mode === 'detail' && <CrDetailView rec={current} onBack={() => setMode('list')} onEdit={() => setMode('form')} onToast={onToast} />}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  แบบฟอร์มทะเบียนขอสินไหม (A4) — แสดงเฉพาะตอนพิมพ์
// ═════════════════════════════════════════════════════════════════════
(function injectCrPrintCss() {
  if (document.getElementById('cr-print-css')) return;
  const s = document.createElement('style');
  s.id = 'cr-print-css';
  s.textContent = [
    '.cr-print-sheet{display:none;}',
    '@media print{',
    '  @page{size:A4 portrait;margin:14mm 12mm;}',
    '  body:has(.cr-print-sheet) *{visibility:hidden;}',
    '  body:has(.cr-print-sheet) .cr-print-sheet,body:has(.cr-print-sheet) .cr-print-sheet *{visibility:visible;}',
    '  .cr-print-sheet{display:block;position:absolute;left:0;top:0;width:100%;',
    '    font-family:inherit;color:#111;font-size:11pt;line-height:1.5;}',
    '  .cr-ph{display:flex;align-items:flex-start;gap:12px;border-bottom:2.5px solid var(--primary);padding-bottom:8px;margin-bottom:12px;}',
    '  .cr-ph-org{font-size:15pt;font-weight:700;color:var(--primary);margin:0;}',
    '  .cr-ph-doc{font-size:12.5pt;font-weight:600;margin:2px 0 0;}',
    '  .cr-ph-meta{margin-left:auto;text-align:right;font-size:10pt;line-height:1.6;}',
    '  .cr-ps{margin:0 0 10px;break-inside:avoid;}',
    '  .cr-ps-h{font-size:11.5pt;font-weight:700;color:var(--primary);border-bottom:1px solid #bbb;padding-bottom:3px;margin-bottom:6px;}',
    '  .cr-pg{display:grid;grid-template-columns:1fr 1fr;gap:2px 18px;}',
    '  .cr-pr{display:flex;gap:6px;font-size:10.5pt;}',
    '  .cr-pr .k{color:#555;min-width:130px;}',
    '  .cr-pr .v{font-weight:600;}',
    '  .cr-pt{width:100%;border-collapse:collapse;font-size:10pt;}',
    '  .cr-pt th,.cr-pt td{border:1px solid #999;padding:3px 5px;text-align:left;}',
    '  .cr-pt th{background:#eee;font-weight:600;}',
    '  .cr-pt td.n,.cr-pt th.n{text-align:right;}',
    '  .cr-pt td.c,.cr-pt th.c{text-align:center;}',
    '  .cr-sum{width:58%;margin-left:auto;}',
    '  .cr-sum .cr-pr{justify-content:space-between;border-bottom:1px dotted #bbb;padding:2px 0;}',
    '  .cr-sign{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:26px;break-inside:avoid;}',
    '  .cr-sign div{text-align:center;font-size:10pt;}',
    '  .cr-sign .line{border-top:1px dotted #555;margin:34px 6px 4px;}',
    '}',
  ].join('\n');
  document.head.appendChild(s);
})();

function CrPrintSheet({ rec, m, policy, fin, debtTotal, offsetTotal, age }) {
  const d = rec.death || {};
  const row = (k, v) => <div className="cr-pr"><span className="k">{k}</span><span className="v">{v || '—'}</span></div>;
  return (
    <div className="cr-print-sheet">
      <div className="cr-ph">
        <div>
          <p className="cr-ph-org">สหกรณ์ออมทรัพย์ กสท จำกัด</p>
          <p className="cr-ph-doc">แบบฟอร์มทะเบียนขอรับเงินสินไหม</p>
        </div>
        <div className="cr-ph-meta">
          <div>เลขที่คำขอ <b className="mono">{rec.id}</b></div>
          <div>วันที่ยื่น {fmt.date(rec.reqDate)}</div>
          <div>สถานะ {window.crStatus(rec.status).l}</div>
        </div>
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๑. ข้อมูลสมาชิก</div>
        <div className="cr-pg">
          {row('ชื่อ-นามสกุล', m.name)}{row('เลขสมาชิก', rec.memberCode)}
          {row('เลขบัตรประชาชน', m.citizenId)}{row('สังกัด', m.dept)}
          {row('ประเภทสมาชิก', m.memberStatus)}{row('วันที่เข้าเป็นสมาชิก', m.joinDate ? fmt.date(m.joinDate) : '')}
        </div>
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๒. ข้อมูลการเสียชีวิต</div>
        <div className="cr-pg">
          {row('วันที่เสียชีวิต', d.date ? fmt.date(d.date) : '')}{row('อายุ ณ วันที่เสียชีวิต', age != null ? age + ' ปี' : '')}
          {row('สาเหตุ', d.cause)}{row('สถานที่', d.place)}
          {row('เลขที่ใบมรณบัตร', d.certNo)}{row('วันที่ออกใบมรณบัตร', d.certDate ? fmt.date(d.certDate) : '')}
        </div>
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๓. โครงการประกัน / กรมธรรม์</div>
        {policy ? (
          <div className="cr-pg">
            {row('รหัสโครงการ', policy.projCode)}{row('ชื่อโครงการ', policy.projName)}
            {row('บริษัทประกัน', policy.company)}{row('เลขที่กรมธรรม์', policy.policyNo)}
            {row('ระยะคุ้มครอง', fmt.date(policy.startDate) + ' – ' + fmt.date(policy.endDate))}
            {row('ทุนประกัน', '฿ ' + fmt.money(policy.coverage, 0))}
          </div>
        ) : <div className="cr-pr"><span className="v">ไม่พบข้อมูลกรมธรรม์ที่อ้างอิง</span></div>}
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๔. ผู้รับผลประโยชน์ / ทายาท</div>
        <table className="cr-pt">
          <thead><tr><th className="c" style={{ width: 24 }}>#</th><th>ชื่อ-นามสกุล</th><th>ความสัมพันธ์</th><th>เลขบัตรประชาชน</th><th>บัญชีรับเงิน</th><th className="c">สัดส่วน</th><th className="n">จำนวนเงิน</th></tr></thead>
          <tbody>
            {(rec.beneficiaries || []).map((b, i) => (
              <tr key={i}>
                <td className="c">{i + 1}</td><td>{b.name}</td><td>{b.relation}</td><td>{b.citizenId || '—'}</td>
                <td>{b.accountNo ? window.crBankLabel(b.bank) + ' · ' + b.accountNo : '—'}</td>
                <td className="c">{b.pct}%</td>
                <td className="n">{fmt.money(fin.refund * (Number(b.pct) || 0) / 100, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๕. หนี้คงเหลือและการตัดชำระ</div>
        {(rec.debts || []).length === 0 ? (
          <div className="cr-pr"><span className="v">ไม่มีหนี้คงเหลือ</span></div>
        ) : (
          <table className="cr-pt">
            <thead><tr><th>เลขที่สัญญา</th><th>ประเภท</th><th className="n">เงินต้นคงเหลือ</th><th className="n">ดอกเบี้ยค้าง</th><th className="n">ค่าปรับ</th><th className="n">ยอดหนี้รวม</th><th className="n">ยอดตัดชำระ</th></tr></thead>
            <tbody>
              {rec.debts.map((x, i) => (
                <tr key={i}>
                  <td>{x.no}</td><td>{x.type}</td>
                  <td className="n">{fmt.money(x.principal, 0)}</td>
                  <td className="n">{fmt.money(x.interest, 0)}</td>
                  <td className="n">{x.penalty ? fmt.money(x.penalty, 0) : '—'}</td>
                  <td className="n">{fmt.money(x.principal + x.interest + x.penalty, 0)}</td>
                  <td className="n">{fmt.money(x.offset, 0)}</td>
                </tr>
              ))}
              <tr><td colSpan="5" style={{ textAlign: 'right', fontWeight: 700 }}>รวม</td>
                <td className="n"><b>{fmt.money(debtTotal, 0)}</b></td>
                <td className="n"><b>{fmt.money(offsetTotal, 0)}</b></td></tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๖. สรุปยอดเงิน</div>
        <div className="cr-sum">
          {row('ยอดสินไหมที่คาดว่าจะได้รับ', fmt.money(rec.estimate, 0) + ' บาท')}
          {row('ยอดสินไหมที่ได้รับจริง', fmt.money(fin.actual, 0) + ' บาท')}
          {row('ยอดหนี้ที่ต้องตัดชำระ', '− ' + fmt.money(fin.offsetTotal, 0) + ' บาท')}
          {row(fin.shortfall > 0 ? 'ยอดขาดที่ต้องติดตาม' : 'ยอดคงเหลือคืนผู้รับผลประโยชน์',
            fmt.money(fin.shortfall > 0 ? fin.shortfall : fin.refund, 0) + ' บาท')}
        </div>
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๗. เอกสารประกอบ</div>
        <table className="cr-pt">
          <thead><tr><th>ประเภทเอกสาร</th><th className="c" style={{ width: 70 }}>จำเป็น</th><th className="c" style={{ width: 90 }}>สถานะ</th></tr></thead>
          <tbody>
            {(rec.docs || []).map((x, i) => (
              <tr key={i}><td>{x.type}</td><td className="c">{x.required ? 'จำเป็น' : 'ไม่บังคับ'}</td><td className="c">{window.crDocTag(x.status).l}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cr-ps">
        <div className="cr-ps-h">๘. ประวัติการดำเนินการ</div>
        <table className="cr-pt">
          <thead><tr><th style={{ width: 90 }}>วันที่</th><th style={{ width: 110 }}>สถานะ</th><th>รายละเอียด</th><th style={{ width: 110 }}>ผู้ดำเนินการ</th></tr></thead>
          <tbody>
            {(rec.history || []).map((h, i) => (
              <tr key={i}><td>{fmt.date(h.date)}</td><td>{window.crStatus(h.status).l}</td><td>{h.detail}{h.note ? ' · ' + h.note : ''}</td><td>{h.by}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cr-sign">
        <div><div className="line" />ผู้จัดทำ<div>(...................................)</div></div>
        <div><div className="line" />หัวหน้าฝ่าย<div>(...................................)</div></div>
        <div><div className="line" />ผู้จัดการ<div>(...................................)</div></div>
      </div>
    </div>
  );
}

Object.assign(window, { ClaimRegisterPage, CrListView, CrDetailView, CrHistoryModal, CrPrintSheet });
