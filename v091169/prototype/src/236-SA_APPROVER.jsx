// ════════════════════════════════════════════════════════════════════
//  อนุมัติคำขอทุนการศึกษา (สวัสดิการ) + อนุมัติจ่ายเงินทุนการศึกษา (การเงิน)
//  ทำงานบนใบคำขอทุนการศึกษา (scholarship_requests) โดยตรง
//  โฟลว์สถานะ: รอคัดเลือก → (คัดเลือก) รออนุมัติ(selected) →
//              (อนุมัติคำขอทุน) อนุมัติแล้ว(approved) →
//              (อนุมัติจ่ายเงิน) จ่ายแล้ว(paid)
//  รายการที่ "ไม่อนุมัติ" → ส่งกลับ (pending + returnedForReselect) ให้คัดเลือกใหม่
// ════════════════════════════════════════════════════════════════════

const SA_APPROVER = 'ผู้จัดการสหกรณ์ · วิโรจน์ ธำรงค์';
const SA_PAYER = 'นางจันทร์เพ็ญ มาลี';
const saToday = () => new Date().toISOString().slice(0, 10);

function saLoad() {
  if (window.schReqLoadStore) return window.schReqLoadStore();
  try { const s = localStorage.getItem('scholarship_requests'); if (s) return JSON.parse(s); } catch (e) {}
  return (window.SCHREQ_SEED || []).map(r => ({ ...r }));
}
function saSave(list) {
  try { localStorage.setItem('scholarship_requests', JSON.stringify(list)); } catch (e) {}
}
function saChildName(r) { return `${r.childTitle || ''}${r.childFirst || ''} ${r.childLast || ''}`.trim(); }
function saPayText(r) {
  const by = window.schReqLabel('payBy', r.payBy);
  return r.payAccount ? `${by} · ${r.payAccount}` : by;
}

// ─── Popup เลือกบัญชีงบประมาณที่จะลงตัดจ่าย (ตอนอนุมัติ) ───────────────
function SaBudgetModal({ items, onConfirm, onClose }) {
  const structure = React.useMemo(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])), []);
  const leaves = React.useMemo(() => (window.bdLeafCats ? window.bdLeafCats(structure) : []), [structure]);
  const groups = React.useMemo(() => (window.bdLeafGroups ? window.bdLeafGroups(leaves) : []), [leaves]);
  // ค่าเริ่มต้น — หมวดที่ GL ขึ้นต้น 5310 หรือชื่อเกี่ยวกับทุนการศึกษา
  const preferred = leaves.find(l => String(l.gl || '').startsWith('5310') || /ทุนการศึกษา/.test(l.name)) || leaves[0];
  const [catId, setCatId] = useState(preferred ? preferred.id : '');
  const [docDate, setDocDate] = useState(saToday);
  const [err, setErr] = useState('');

  const total = items.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const leaf = leaves.find(l => l.id === catId);

  const confirm = () => {
    if (!leaf) { setErr('กรุณาเลือกบัญชีงบประมาณที่จะลงตัดจ่าย'); return; }
    onConfirm({
      cat: leaf.id, label: `${leaf.code} · ${leaf.name}`, gl: leaf.gl || '', date: docDate,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เลือกบัญชีงบประมาณที่จะลงตัดจ่าย</h2>
            <div className="muted" style={{ fontSize: 11.5 }}>อนุมัติ {items.length} รายการ · รวม ฿ {fmt.money(total, 2)}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="sa-bud-summary">
            <div><span className="sa-bud-k">จำนวนรายการที่อนุมัติ</span><span className="sa-bud-v">{items.length} รายการ</span></div>
            <div><span className="sa-bud-k">มูลค่ารวม</span><span className="sa-bud-v mono hl">฿ {fmt.money(total, 2)}</span></div>
          </div>
          <div className="sr-field" style={{ marginTop: 14 }}>
            <label className="sr-label">บัญชีงบประมาณ (หมวดย่อย) <span className="cfg-required">*</span></label>
            {groups.length ? (
              <select className="cfg-input" value={catId} onChange={(e) => { setCatId(e.target.value); setErr(''); }}>
                <option value="">— เลือกหมวดงบประมาณ —</option>
                {groups.map(g => (
                  <optgroup key={g.top} label={g.top}>
                    {g.items.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}{c.gl ? ` (GL ${c.gl})` : ''}</option>)}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input className="cfg-input" value={window.SCHREQ_DEFAULT_BUDGET} readOnly />
            )}
          </div>
          <div className="sr-field" style={{ marginTop: 12 }}>
            <label className="sr-label">วันที่อนุมัติ</label>
            <ErpDate value={docDate} onChange={(v) => ((e) => setDocDate(e.target.value))({ target: { value: v } })} style={{ width: 180 }} className="cfg-input" />
          </div>
          {leaf && (
            <div className="sa-bud-gl"><Icon name="info" size={12} /> รายการที่อนุมัติทั้งหมดจะลงตัดจากบัญชี <b>{leaf.code} · {leaf.name}</b>{leaf.gl ? <> · ผังบัญชี GL <span className="mono">{leaf.gl}</span></> : null}</div>
          )}
          {err && <div className="sr-error" style={{ marginTop: 12, marginBottom: 0 }}><Icon name="info" size={14} /> {err}</div>}
        </div>
        <div className="ins-modal-foot" style={{ padding: '0 18px 16px' }}>
          <button className="btn sm" onClick={onClose}>ยกเลิก</button>
          <span className="spacer" />
          <button className="btn primary sm" onClick={confirm}><Icon name="check" /> ยืนยันอนุมัติ ({items.length})</button>
        </div>
      </div>
    </>
  );
}

// ─── Popup ระบุเหตุผลการไม่อนุมัติ (ส่งกลับคัดเลือกใหม่) ────────────────
function SaRejectModal({ items, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 500, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="modal-warnico" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}><Icon name="close" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ไม่อนุมัติคำขอทุนการศึกษา</h2>
            <div className="muted" style={{ fontSize: 11.5 }}>{items.length} รายการ — สิทธิจะถูกส่งกลับไปคัดเลือกใหม่</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="sa-reject-note"><Icon name="info" size={13} /> เมื่อไม่อนุมัติ ระบบจะส่งสิทธิของรายการเหล่านี้กลับไปยังเมนู “ประมวลผลคัดเลือกผู้รับทุน” เพื่อคัดเลือกมาอนุมัติใหม่</div>
          <div className="sr-field" style={{ marginTop: 12 }}>
            <label className="sr-label">เหตุผลการไม่อนุมัติ <span className="cfg-required">*</span></label>
            <textarea className="cfg-input" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }}
                      placeholder="ระบุเหตุผล เช่น เอกสารไม่ครบ / คุณสมบัติไม่ผ่าน — จะแสดงในเมนูคัดเลือก" />
            {err && <div className="sr-hint" style={{ color: 'var(--danger)', marginTop: 6 }}><Icon name="info" size={11} /> {err}</div>}
          </div>
        </div>
        <div className="ins-modal-foot" style={{ padding: '0 18px 16px' }}>
          <button className="btn sm" onClick={onClose}>ยกเลิก</button>
          <span className="spacer" />
          <button className="btn danger sm" onClick={() => { if (!reason.trim()) { setErr('กรุณาระบุเหตุผลการไม่อนุมัติ'); return; } onConfirm(reason.trim()); }}>
            <Icon name="close" size={13} /> ยืนยันไม่อนุมัติ &amp; ส่งกลับคัดเลือก
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าอนุมัติคำขอทุนการศึกษา (สวัสดิการ)
// ════════════════════════════════════════════════════════════════════
function ScholarshipApprovalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(saLoad);
  const [statusF, setStatusF] = useState('selected');
  const [typeF, setTypeF] = useState('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [budgetFor, setBudgetFor] = useState(null);   // items รออนุมัติ
  const [rejectFor, setRejectFor] = useState(null);

  const persist = (next) => { setList(next); saSave(next); };
  const clearSel = () => setSel(new Set());

  const rows = useMemo(() => {
    let r = list;
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    if (typeF !== 'all') r = r.filter(x => x.scholarType === typeF);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) || x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) || saChildName(x).toLowerCase().includes(n));
    }
    return [...r].sort((a, b) => (a.status === 'selected' ? 0 : 1) - (b.status === 'selected' ? 0 : 1) || b.id.localeCompare(a.id));
  }, [list, statusF, typeF, q]);

  const selectable = list.filter(x => x.status === 'selected');
  const selectableAmt = selectable.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const selItems = rows.filter(r => sel.has(r.id) && r.status === 'selected');
  const selAmt = selItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pendingRows = rows.filter(r => r.status === 'selected');

  // ── อนุมัติ (หลังเลือกงบประมาณ) ──
  const doApprove = (items, budget) => {
    const ids = new Set(items.map(i => i.id));
    const next = list.map(r => ids.has(r.id) ? {
      ...r, status: 'approved', approvedBy: SA_APPROVER, approvedDate: budget.date,
      budgetCat: budget.cat, budgetLabel: budget.label, budgetGL: budget.gl,
      returnedForReselect: false, rejectReason: '',
    } : r);
    persist(next); clearSel(); setBudgetFor(null);
    const total = items.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    audit.log && audit.log({
      action: 'approve', module: 'สวัสดิการ — อนุมัติคำขอทุนการศึกษา',
      target: `${items.length} รายการ`,
      summary: `อนุมัติคำขอทุนการศึกษา ${items.length} รายการ · รวม ${fmt.money(total, 2)} บาท · ลงบัญชีงบประมาณ ${budget.label}`,
      changes: items.map(it => ({ field: it.id, before: 'รออนุมัติ', after: `อนุมัติ · ${fmt.money(Number(it.amount) || 0, 2)} · งบ ${budget.label}` })),
    });
    onToast && onToast(`อนุมัติคำขอทุนการศึกษา ${items.length} รายการ (฿ ${fmt.money(total, 2)}) — ลงบัญชีงบ ${budget.label}`);
  };

  // ── ไม่อนุมัติ → ส่งกลับคัดเลือกใหม่ ──
  const doReject = (items, reason) => {
    const ids = new Set(items.map(i => i.id));
    const next = list.map(r => ids.has(r.id) ? {
      ...r, status: 'pending', returnedForReselect: true, rejectReason: reason,
      approvedBy: '', approvedDate: '', budgetCat: '', budgetLabel: '', budgetGL: '',
    } : r);
    persist(next); clearSel(); setRejectFor(null);
    audit.log && audit.log({
      action: 'reject', module: 'สวัสดิการ — อนุมัติคำขอทุนการศึกษา',
      target: `${items.length} รายการ`,
      summary: `ไม่อนุมัติคำขอทุนการศึกษา ${items.length} รายการ — ส่งสิทธิกลับเมนูคัดเลือก · เหตุผล: ${reason}`,
      changes: items.map(it => ({ field: it.id, before: 'รออนุมัติ', after: 'ไม่อนุมัติ — ส่งกลับคัดเลือก' })),
    });
    onToast && onToast(`ไม่อนุมัติ ${items.length} รายการ — แจ้งสิทธิกลับไปเมนูประมวลผลคัดเลือกแล้ว`);
  };

  const st = (v) => window.schReqStatus(v);

  return (
    <div data-screen-label="หน้าอนุมัติคำขอทุนการศึกษา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติคำขอทุนการศึกษา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            รายการที่ผ่านการคัดเลือกแล้ว — เลือกอนุมัติรายการที่เลือก / อนุมัติทั้งหมด หรือไม่อนุมัติ (ส่งกลับคัดเลือกใหม่) · เมื่ออนุมัติจะเลือกบัญชีงบประมาณที่ลงตัดจ่าย
          </div>
        </div>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>รออนุมัติ <b style={{ color: 'var(--warning)' }}>{fmt.int(selectable.length)}</b> · มูลค่า ฿ {fmt.money(selectableAmt, 0)}</span>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขใบคำขอ / สมาชิก / บุตร</span>
            <div className="search" style={{ flex: 'none', width: 280, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา…" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภททุน</span>
            <select className="filter-select" value={typeF} onChange={(e) => { setTypeF(e.target.value); clearSel(); }}>
              <option value="all">ทุกประเภททุน</option>
              {window.SCH_OPTS.scholarType.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => { setStatusF(e.target.value); clearSel(); }} style={{ width: 160 }}>
              <option value="selected">รออนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="paid">จ่ายแล้ว</option>
              <option value="all">ทุกสถานะ</option>
            </select>
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {/* แถบดำเนินการเมื่อเลือกรายการ */}
        {selItems.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selItems.length}</b> รายการรออนุมัติที่เลือก</span>
            <span className="muted">· รวม {fmt.money(selAmt, 2)} บาท</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setBudgetFor(selItems)}><Icon name="check" size={12} /> อนุมัติที่เลือก ({selItems.length})</button>
            <button className="btn danger sm" onClick={() => setRejectFor(selItems)}><Icon name="close" size={12} /> ไม่อนุมัติ</button>
            <button className="btn text sm" onClick={clearSel}>ยกเลิกการเลือก</button>
          </div>
        )}

        {/* ปุ่มอนุมัติทั้งหมด */}
        {selectable.length > 0 && (
          <div className="sa-allbar">
            <Icon name="info" size={13} />
            <span>มีรายการรออนุมัติทั้งหมด <b>{selectable.length}</b> รายการ · รวม <b>฿ {fmt.money(selectableAmt, 2)}</b></span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setBudgetFor(selectable)}><Icon name="check" size={12} /> อนุมัติทั้งหมด ({selectable.length})</button>
          </div>
        )}

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }} className="center">
                  <input type="checkbox" className="wa-chk"
                         checked={pendingRows.length > 0 && pendingRows.every(r => sel.has(r.id))}
                         onChange={(e) => setSel(e.target.checked ? new Set(pendingRows.map(r => r.id)) : new Set())} />
                </th>
                <th>เลขใบคำขอ</th>
                <th>ประเภททุน · ปี</th>
                <th>สมาชิก / บุตรผู้รับทุน</th>
                <th>วิธีรับเงิน</th>
                <th className="num">จำนวนเงิน (บาท)</th>
                <th>บัญชีงบประมาณ</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="check" size={24} /></div>
                  ไม่มีรายการที่ตรงกับเงื่อนไข — รายการรออนุมัติมาจากเมนู “ประมวลผลคัดเลือกผู้รับทุน”
                </td></tr>
              ) : rows.map(r => {
                const s = st(r.status);
                const canSel = r.status === 'selected';
                return (
                  <tr key={r.id} className={sel.has(r.id) ? 'wa-row-sel' : ''}>
                    <td className="center">
                      {canSel && <input type="checkbox" className="wa-chk" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} />}
                    </td>
                    <td className="mono">{r.id}</td>
                    <td style={{ fontSize: 12 }}>{window.schLabel('scholarType', r.scholarType)}<div className="muted" style={{ fontSize: 11 }}>{window.schLabel('eduLevel', r.eduLevel)} · ปี {r.schoolYear}</div></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{saChildName(r)}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.memberName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sa-pay-chip"><Icon name={r.payBy === 'cash' ? 'money' : r.payBy === 'bank' ? 'bank' : r.payBy === 'postal' ? 'mail' : 'wallet'} size={12} /> {window.schReqLabel('payBy', r.payBy)}</span>
                      {r.payAccount && <div className="muted mono" style={{ fontSize: 10, marginTop: 2 }}>{r.payAccount}</div>}
                    </td>
                    <td className="num mono"><b>{fmt.money(r.amount, 2)}</b></td>
                    <td style={{ fontSize: 11.5 }}>{r.budgetLabel ? <span className="mono">{r.budgetLabel}</span> : <span className="muted">—</span>}</td>
                    <td className="center">
                      <span className={"pill " + s.pill}>{s.l}</span>
                      {r.returnedForReselect && <div className="muted" style={{ fontSize: 9.5, marginTop: 2 }}>ส่งกลับคัดเลือก</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> ติ๊กเลือกรายการเพื่ออนุมัติ/ไม่อนุมัติเฉพาะที่เลือก หรือกด “อนุมัติทั้งหมด” · เมื่ออนุมัติ ระบบจะให้เลือกบัญชีงบประมาณที่ลงตัดจ่าย · รายการที่อนุมัติแล้วส่งต่อเมนู “อนุมัติจ่ายเงินทุนการศึกษา” (ระบบการเงิน)
        </p>
      </div>

      {budgetFor && <SaBudgetModal items={budgetFor} onConfirm={(b) => doApprove(budgetFor, b)} onClose={() => setBudgetFor(null)} />}
      {rejectFor && <SaRejectModal items={rejectFor} onConfirm={(reason) => doReject(rejectFor, reason)} onClose={() => setRejectFor(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าอนุมัติจ่ายเงินทุนการศึกษา (ระบบการเงิน)
// ════════════════════════════════════════════════════════════════════
function SaPayConfirmModal({ items, budgetGroups, total, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันอนุมัติจ่ายเงินทุนการศึกษา</h2>
            <div className="muted" style={{ fontSize: 11.5 }}>ตรวจสอบยอดรวมของรายการที่เลือกก่อนอนุมัติจ่าย</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="sa-pay-confirm">
            <div className="sa-pc-row"><span>จำนวนรายการที่จะจ่าย</span><b>{items.length} รายการ</b></div>
            <div className="sa-pc-row"><span>มูลค่ารวมที่ต้องจ่าย</span><b className="mono hl">฿ {fmt.money(total, 2)}</b></div>
          </div>
          <div className="sa-pc-budget">
            <div className="sa-pc-budget-h">ลงตัดบัญชีงบประมาณ</div>
            {budgetGroups.map(g => (
              <div className="sa-pc-budget-row" key={g.label} style={{ minWidth: 0, flexWrap: 'wrap' }}>
                <span className="mono" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{g.label}</span>
                <span className="muted">{g.count} รายการ</span>
                <span className="spacer" />
                <span className="mono"><b>฿ {fmt.money(g.total, 2)}</b></span>
              </div>
            ))}
          </div>
        </div>
        <div className="ins-modal-foot" style={{ padding: '0 18px 16px' }}>
          <button className="btn sm" onClick={onClose}>ยกเลิก</button>
          <span className="spacer" />
          <button className="btn primary sm" onClick={onConfirm}><Icon name="check" /> อนุมัติจ่าย</button>
        </div>
      </div>
    </>
  );
}

function ScholarshipPayApprovalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(saLoad);
  const [statusF, setStatusF] = useState('approved');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [picked, setPicked] = useState(() => new Set());

  const persist = (next) => { setList(next); saSave(next); };

  const approved = list.filter(r => r.status === 'approved');
  const approvedTotal = approved.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  // จัดกลุ่มตามบัญชีงบประมาณ
  const budgetGroups = useMemo(() => {
    const by = {}; const order = [];
    approved.forEach(r => {
      const key = r.budgetLabel || window.SCHREQ_DEFAULT_BUDGET;
      if (!by[key]) { by[key] = { label: key, count: 0, total: 0 }; order.push(key); }
      by[key].count += 1; by[key].total += Number(r.amount) || 0;
    });
    return order.map(k => by[k]);
  }, [list]);

  const selItems = approved.filter(r => picked.has(r.id));
  const selTotal = selItems.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const selGroups = (() => {
    const by = {}; const order = [];
    selItems.forEach(r => {
      const key = r.budgetLabel || window.SCHREQ_DEFAULT_BUDGET;
      if (!by[key]) { by[key] = { label: key, count: 0, total: 0 }; order.push(key); }
      by[key].count += 1; by[key].total += Number(r.amount) || 0;
    });
    return order.map(k => by[k]);
  })();
  const togglePick = (id) => setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const rows = useMemo(() => {
    let r = list;
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    else r = r.filter(x => x.status === 'approved' || x.status === 'paid');
    return [...r].sort((a, b) => (a.status === 'approved' ? 0 : 1) - (b.status === 'approved' ? 0 : 1) || b.id.localeCompare(a.id));
  }, [list, statusF]);

  const payAll = () => {
    if (!selItems.length) return;
    const voucherNo = window.schReqPayVoucherNo(list, 2569);
    const today = saToday();
    const ids = new Set(selItems.map(i => i.id));
    const next = list.map(r => ids.has(r.id) ? { ...r, status: 'paid', payDate: today, payVoucherNo: voucherNo, paidBy: SA_PAYER } : r);
    persist(next); setConfirmOpen(false); setPicked(new Set());
    audit.log && audit.log({
      action: 'approve', module: 'การเงิน — อนุมัติจ่ายเงินทุนการศึกษา',
      target: 'ใบสำคัญจ่าย ' + voucherNo,
      summary: `อนุมัติจ่ายเงินทุนการศึกษา ${selItems.length} รายการ · รวม ${fmt.money(selTotal, 2)} บาท · ${voucherNo}`,
      changes: selGroups.map(g => ({ field: g.label, before: '—', after: `${g.count} รายการ · ${fmt.money(g.total, 2)} บาท` })),
    });
    onToast && onToast(`อนุมัติจ่ายเงินทุนการศึกษา ${selItems.length} รายการ (฿ ${fmt.money(selTotal, 2)}) — ออกใบสำคัญจ่าย ${voucherNo}`);
  };

  const st = (v) => window.schReqStatus(v);

  return (
    <div data-screen-label="หน้าอนุมัติจ่ายเงินทุนการศึกษา (การเงิน)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติจ่ายเงินทุนการศึกษา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            รายการทุนการศึกษาที่อนุมัติแล้ว รอจ่ายเงิน — เลือกรายการที่ต้องการ แล้วกดอนุมัติจ่าย
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" disabled={!selItems.length} onClick={() => setConfirmOpen(true)}>
          <Icon name="check" /> อนุมัติจ่าย{selItems.length ? ` (${selItems.length})` : ''}
        </button>
      </div>

      {/* สรุปยอดที่ต้องจ่าย */}
      <div className="sa-pay-kpis">
        <div className="sa-kpi">
          <div className="sa-kpi-lab">รายการรอจ่าย</div>
          <div className="sa-kpi-val">{fmt.int(approved.length)} <span className="sa-kpi-unit">รายการ</span></div>
        </div>
        <div className="sa-kpi accent">
          <div className="sa-kpi-lab">มูลค่ารวมที่ต้องจ่าย</div>
          <div className="sa-kpi-val">฿ {fmt.money(approvedTotal, 2)}</div>
        </div>
        <div className="sa-kpi">
          <div className="sa-kpi-lab">บัญชีงบประมาณที่เกี่ยวข้อง</div>
          <div className="sa-kpi-val">{fmt.int(budgetGroups.length)} <span className="sa-kpi-unit">บัญชี</span></div>
        </div>
      </div>

      {/* สรุปตามบัญชีงบประมาณ */}
      {budgetGroups.length > 0 && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>สรุปยอดจ่ายตามบัญชีงบประมาณ</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>บัญชีงบประมาณ</th><th className="center">จำนวนรายการ</th><th className="num">มูลค่ารวม (บาท)</th></tr></thead>
              <tbody>
                {budgetGroups.map(g => (
                  <tr key={g.label}>
                    <td className="mono">{g.label}</td>
                    <td className="center">{g.count}</td>
                    <td className="num mono"><b>{fmt.money(g.total, 2)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td className="right"><b>รวมทั้งสิ้น</b></td><td className="center"><b>{approved.length}</b></td><td className="num mono"><b>{fmt.money(approvedTotal, 2)}</b></td></tr>
              </tfoot>
            </table>
          </div></div>
        </div>
      )}

      {/* รายการ */}
      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 160 }}>
              <option value="approved">รอจ่าย (อนุมัติแล้ว)</option>
              <option value="paid">จ่ายแล้ว</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>
          <span className="spacer" />
          {selItems.length > 0 && <span style={{ fontSize: 12 }}>เลือก <b>{selItems.length}</b> รายการ · ฿ <b className="mono">{fmt.money(selTotal, 2)}</b></span>}
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>{(() => { const pay = rows.filter(x => x.status === 'approved'); const all = pay.length > 0 && pay.every(x => picked.has(x.id));
                  return <input type="checkbox" checked={all} disabled={!pay.length} onChange={() => setPicked(all ? new Set() : new Set(pay.map(x => x.id)))} />; })()}</th>
                <th className="center" style={{ width: 60 }}>ลำดับ</th>
                <th>เลขใบคำขอ</th>
                <th>สมาชิก / บุตรผู้รับทุน</th>
                <th>วิธีรับเงิน</th>
                <th>บัญชีงบประมาณ</th>
                <th className="num">จำนวนเงิน (บาท)</th>
                <th className="center">สถานะ</th>
                <th>ใบสำคัญจ่าย</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="money" size={24} /></div>
                  ไม่มีรายการทุนการศึกษาที่รอจ่าย — รายการมาจากเมนู “อนุมัติคำขอทุนการศึกษา”
                </td></tr>
              ) : rows.map((r, i) => {
                const s = st(r.status);
                return (
                  <tr key={r.id} className={picked.has(r.id) ? 'selected' : undefined}>
                    <td className="center">{r.status === 'approved' ? <input type="checkbox" checked={picked.has(r.id)} onChange={() => togglePick(r.id)} /> : null}</td>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono">{r.id}</td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{saChildName(r)}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.memberName}</div>
                    </td>
                    <td>
                      <span className="sa-pay-chip"><Icon name={r.payBy === 'cash' ? 'money' : r.payBy === 'bank' ? 'bank' : r.payBy === 'postal' ? 'mail' : 'wallet'} size={12} /> {window.schReqLabel('payBy', r.payBy)}</span>
                      {r.payAccount && <div className="muted mono" style={{ fontSize: 10, marginTop: 2 }}>{r.payAccount}</div>}
                    </td>
                    <td style={{ fontSize: 11.5 }}>{r.budgetLabel ? <span className="mono">{r.budgetLabel}</span> : <span className="muted">—</span>}</td>
                    <td className="num mono"><b>{fmt.money(r.amount, 2)}</b></td>
                    <td className="center"><span className={"pill " + s.pill}>{s.l}</span></td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{r.payVoucherNo || <span className="muted">—</span>}{r.payDate && <div className="muted" style={{ fontSize: 10 }}>{fmt.date(r.payDate)}</div>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> เลือกรายการรอจ่าย แล้วกด “อนุมัติจ่าย” มุมขวาบน — ระบบออกเลขใบสำคัญจ่าย 1 ใบสำหรับรายการที่เลือก และบันทึกสถานะเป็น “จ่ายแล้ว”
        </p>
      </div>

      {confirmOpen && (
        <SaPayConfirmModal items={selItems} budgetGroups={selGroups} total={selTotal}
                           onConfirm={payAll} onClose={() => setConfirmOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { ScholarshipApprovalPage, ScholarshipPayApprovalPage });
