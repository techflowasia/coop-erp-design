// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ใบสำคัญจ่าย (หน้าหลัก)
//  รายการใบสำคัญจ่าย + สถานะ → เปิด/แก้ไข/พิมพ์ · สร้างใหม่
//  + ตัวจัดการเท็มเพลทคณะทำงาน (สร้างชุดข้อมูลบุคคล/คณะทำงาน)
// ════════════════════════════════════════════════════════════════════

function vchLoad() {
  return window.vchLoadVouchers ? window.vchLoadVouchers() : JSON.parse(JSON.stringify(window.VCH_SEED || []));
}
function vchSave(list) { try { localStorage.setItem('vouchers', JSON.stringify(list)); } catch (e) {} }
function vchGroupsLoad() {
  try { const s = localStorage.getItem('voucher_groups'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.VCH_GROUPS_SEED || []));
}
function vchGroupsSave(list) { try { localStorage.setItem('voucher_groups', JSON.stringify(list)); } catch (e) {} }

const vchToday = () => new Date().toISOString().slice(0, 10);
const vchPlusDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// ════════════════════════════════════════════════════════════════════
//  ตัวจัดการเท็มเพลทคณะทำงาน
// ════════════════════════════════════════════════════════════════════
function VchGroupManagerModal({ groups, structure, onClose, onSave, onToast }) {
  const [list, setList] = useState(() => JSON.parse(JSON.stringify(groups)));
  const [editing, setEditing] = useState(null);   // index หรือ 'new'

  const leaves = [];
  const walk = (ns) => ns.forEach(n => (n.children && n.children.length) ? walk(n.children) : (n.enabled && leaves.push(n)));
  walk(structure);

  const blank = () => ({ id: 'WG-' + Date.now().toString(36), name: '', note: '', defaultCat: leaves[0] ? leaves[0].id : '', defaultAmount: 0, defaultWht: '0', members: [{ name: '', role: '', bank: '', acctNo: '' }] });
  const [draft, setDraft] = useState(blank);

  const startNew = () => { setDraft(blank()); setEditing('new'); };
  const startEdit = (i) => { setDraft(JSON.parse(JSON.stringify(list[i]))); setEditing(i); };
  const setDF = (k, v) => setDraft(p => ({ ...p, [k]: v }));
  const setMember = (i, k, v) => setDraft(p => ({ ...p, members: p.members.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }));
  const addMember = () => setDraft(p => ({ ...p, members: [...p.members, { name: '', role: '', bank: '', acctNo: '' }] }));
  const rmMember = (i) => setDraft(p => ({ ...p, members: p.members.filter((_, idx) => idx !== i) }));

  const commitDraft = () => {
    if (!draft.name.trim()) { onToast && onToast('กรุณาระบุชื่อคณะทำงาน'); return; }
    const clean = { ...draft, name: draft.name.trim(), members: draft.members.filter(m => m.name.trim()) };
    if (editing === 'new') setList(l => [...l, clean]);
    else setList(l => l.map((g, idx) => idx === editing ? clean : g));
    setEditing(null);
  };
  const removeGroup = (i) => setList(l => l.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 720, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="members" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เท็มเพลทคณะทำงาน / ชุดข้อมูลบุคคล</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างชุดรายชื่อไว้ล่วงหน้า เพื่อแสตมป์ลงใบสำคัญจ่ายได้รวดเร็ว</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {editing === null ? (
            <>
              <div style={{ display: 'flex', marginBottom: 10 }}>
                <span className="spacer" style={{ flex: 1 }} />
                <button className="btn primary sm" onClick={startNew}><Icon name="plus" /> สร้างคณะทำงานใหม่</button>
              </div>
              <div className="vch-group-list">
                {list.map((g, i) => (
                  <div key={g.id} className="vch-group-item static">
                    <div className="vch-group-ico"><Icon name="members" /></div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="vch-group-name">{g.name}</div>
                      <div className="vch-group-meta muted">{g.members.length} คน · {g.note || '—'}</div>
                      <div className="vch-group-members">{g.members.map(m => m.name).join(' · ')}</div>
                    </div>
                    <button className="btn ghost sm" onClick={() => startEdit(i)}><Icon name="edit" size={13} /></button>
                    <button className="bud-act danger" onClick={() => removeGroup(i)} title="ลบ"><Icon name="close" size={13} /></button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="vch-grp-editor">
              <div className="vch-grid g2">
                <VchField label="ชื่อคณะทำงาน" required full>
                  <input className="cfg-input" value={draft.name} autoFocus placeholder="เช่น คณะกรรมการดำเนินการ ชุดที่ 26"
                         onChange={(e) => setDF('name', e.target.value)} />
                </VchField>
                <VchField label="หมายเหตุ / ลักษณะการจ่าย" full>
                  <input className="cfg-input" value={draft.note} placeholder="เช่น เบี้ยประชุมกรรมการ"
                         onChange={(e) => setDF('note', e.target.value)} />
                </VchField>
                <VchField label="หมวดงบประมาณตั้งต้น">
                  <select className="cfg-input" value={draft.defaultCat} onChange={(e) => setDF('defaultCat', e.target.value)}>
                    {leaves.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                  </select>
                </VchField>
                <VchField label="จำนวนเงินตั้งต้น/คน">
                  <input className="cfg-input mono" type="number" value={draft.defaultAmount}
                         onChange={(e) => setDF('defaultAmount', Number(e.target.value || 0))} />
                </VchField>
              </div>

              <div className="vch-sec-sub" style={{ margin: '10px 0 6px', fontWeight: 600 }}>รายชื่อสมาชิกในคณะ</div>
              <table className="tbl" style={{ minWidth: 560 }}>
                <thead><tr><th>ชื่อ-สกุล</th><th>ตำแหน่ง</th><th>ธนาคาร</th><th>เลขที่บัญชี</th><th style={{ width: 36 }} /></tr></thead>
                <tbody>
                  {draft.members.map((m, i) => (
                    <tr key={i}>
                      <td><input className="vch-cell-input" value={m.name} onChange={(e) => setMember(i, 'name', e.target.value)} /></td>
                      <td><input className="vch-cell-input" value={m.role} onChange={(e) => setMember(i, 'role', e.target.value)} /></td>
                      <td><input className="vch-cell-input" value={m.bank} onChange={(e) => setMember(i, 'bank', e.target.value)} /></td>
                      <td><input className="vch-cell-input mono" value={m.acctNo} onChange={(e) => setMember(i, 'acctNo', e.target.value)} /></td>
                      <td className="center"><button className="bud-act danger" onClick={() => rmMember(i)}><Icon name="close" size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={addMember}><Icon name="plus" /> เพิ่มรายชื่อ</button>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditing(null)}>ยกเลิก</button>
                <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={commitDraft}>
                  <Icon name="check" /> บันทึกคณะทำงาน
                </button>
              </div>
            </div>
          )}
        </div>
        {editing === null && (
          <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn" onClick={onClose}>ปิด</button>
            <button className="btn primary" onClick={() => { onSave(list); }}><Icon name="check" /> บันทึกทั้งหมด</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะใบสำคัญจ่าย) ───────────────────────────
function VchHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('ใบสำคัญจ่าย'))].sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>ประวัติการทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>ใบสำคัญจ่าย</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {rows.length === 0 ? (
            <div className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>ยังไม่มีประวัติการทำรายการ</div>
          ) : (
            <div className="tx-timeline">
              {rows.map((e, idx) => {
                const ac = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id || idx}>
                    <div className={'tx-dot ' + ac.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + ac.pill}>{ac.label}</span>
                        <span className="tx-mod">{e.module}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span>{e.role && <><span className="sep">·</span><span>{e.role}</span></>}
                        {e.target && <><span className="sep">·</span><span className="mono muted">{e.target}</span></>}
                      </div>
                      {e.changes && e.changes.length > 0 && (
                        <div className="tx-changes">
                          {e.changes.map((c, i) => (
                            <div className="tx-change" key={i}>
                              <span className="fld">{c.field}</span><span className="before">{c.before}</span>
                              <span className="arr">→</span><span className="after">{c.after}</span>
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
//  หน้าหลัก: รายการ ⇄ ฟอร์ม
// ════════════════════════════════════════════════════════════════════
function VoucherWorkspace({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [vouchers, setVouchers] = useState(vchLoad);
  const [groups, setGroups] = useState(vchGroupsLoad);
  const [structure] = useState(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])));
  const [mode, setMode] = useState('list');       // 'list' | 'form'
  const [editDoc, setEditDoc] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [certVoucher, setCertVoucher] = useState(null);
  const [grpMgr, setGrpMgr] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [qD, setQD] = useState('');
  const [statusD, setStatusD] = useState('all');
  const applySearch = () => { setQ(qD); setStatusFilter(statusD); };
  const resetSearch = () => { setQD(''); setStatusD('all'); setQ(''); setStatusFilter('all'); };

  const persist = (next) => { setVouchers(next); vchSave(next); };

  const doPrint = (v) => {
    setPrintDoc(v);
    setTimeout(() => window.printVoucher(onToast), 80);
  };
  const openCerts = (v) => setCertVoucher(v);

  const newVoucher = () => {
    const today = vchToday();
    setEditDoc({
      id: window.vchNextNo(vouchers, today), docDate: today, dueDate: vchPlusDays(today, 7),
      createdBy: 'นางจันทร์เพ็ญ มาลี',
      payees: [{ type: 'vendor', payeeId: '', code: '', name: '', bank: '', branch: '', acctNo: '', amount: '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '', items: [] }],
      payMethod: 'transfer', coopBank: '', chequeNo: '', chequeBank: '', chequeDate: '',
      status: 'draft', note: '', files: [],
      lines: [],
      _new: true,
    });
    setMode('form');
  };
  const openVoucher = (v) => { setEditDoc(JSON.parse(JSON.stringify(v))); setMode('form'); };

  const handleSave = (doc, alsoPrint) => {
    const clean = { ...doc }; delete clean._new;
    const exists = vouchers.some(v => v.id === clean.id);
    const next = exists ? vouchers.map(v => v.id === clean.id ? clean : v) : [clean, ...vouchers];
    persist(next);
    const payeeName = (clean.payees && clean.payees[0]) ? clean.payees[0].name + (clean.payees.length > 1 ? ' และคณะ' : '') : '—';
    audit.log({
      action: exists ? 'update' : 'create', module: 'บัญชี — ใบสำคัญจ่าย',
      target: `${clean.id} · ${payeeName}`,
      summary: `${exists ? 'แก้ไข' : 'สร้าง'}ใบสำคัญจ่าย ${clean.id} (${window.fmt.money(window.vchTotals(clean.lines).net, 2)} บาท)`,
      changes: exists ? [] : [{ field: 'เลขที่ใบสำคัญจ่าย', before: '—', after: clean.id }],
    });
    setMode('list'); setEditDoc(null);
    const tot = (clean.payees || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    if (window.depSuccess) {
      window.depSuccess({ title: 'บันทึกใบสำคัญจ่ายเรียบร้อยแล้ว', desc: 'เลขที่ ' + clean.id,
        onPrint: () => doPrint(clean), printLabel: 'พิมพ์ใบสำคัญจ่าย' });
    } else { onToast && onToast(`บันทึกใบสำคัญจ่าย ${clean.id} เรียบร้อยแล้ว`); }
    if (alsoPrint) { doPrint(clean); }
  };

  const saveGroups = (list) => {
    setGroups(list); vchGroupsSave(list); setGrpMgr(false);
    onToast && onToast('บันทึกเท็มเพลทคณะทำงานเรียบร้อยแล้ว');
  };

  // ─── ฟอร์ม ────────────────────────────────────────────────────────
  if (mode === 'form' && editDoc) {
    return (
      <>
        <VoucherForm voucher={editDoc} structure={structure} vouchers={vouchers} groups={groups}
                     onSave={handleSave} onCancel={() => { setMode('list'); setEditDoc(null); }}
                     onCerts={openCerts} onToast={onToast} />
        <VoucherPrintSheet voucher={printDoc} />
        {certVoucher && <WhtCertModal voucher={certVoucher} onClose={() => setCertVoucher(null)} onToast={onToast} />}
      </>
    );
  }

  // ─── รายการ ──────────────────────────────────────────────────────
  const filtered = vouchers.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      const inPayee = (v.payees || []).some(p => (p.name || '').toLowerCase().includes(n) || (p.code || '').toLowerCase().includes(n));
      return v.id.toLowerCase().includes(n) || inPayee;
    }
    return true;
  });

  return (
    <div data-screen-label="หน้ารายการใบสำคัญจ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ใบสำคัญจ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            สร้างและติดตามสถานะใบสำคัญจ่าย — ตัดงบประมาณตามหมวดและส่งต่อระบบบัญชี
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={newVoucher}><Icon name="plus" /> สร้างใบสำคัญจ่าย</button>
      </div>

      <div className="search-card">
        <div className="rcv-list-toolbar" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>ค้นหา</span>
            <div className="dep-input" style={{ width: '100%', minWidth: 0, height: 32, boxSizing: 'border-box', background: '#fff' }}>
              <Icon name="search" size={14} />
              <input value={qD} onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                     placeholder="เลขที่ / ผู้รับเงิน" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusD} onChange={(e) => setStatusD(e.target.value)} style={{ width: '100%' }}>
              <option value="all">ทุกสถานะ</option>
              {window.VCH_STATUS_ORDER.map(k => <option key={k} value={k}>{window.VCH_STATUS[k].l}</option>)}
            </select>
          </div>
          <button className="btn primary rcv-tb-btn" onClick={applySearch}>ค้นหา</button>
          <button className="btn rcv-tb-btn" onClick={resetSearch}>รีเซ็ต</button>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>เลขที่</th>
                <th style={{ width: 110 }}>วันที่เอกสาร</th>
                <th style={{ minWidth: 220 }}>ผู้รับเงิน</th>
                <th className="right" style={{ width: 130 }}>ยอดสุทธิ (บาท)</th>
                <th className="center" style={{ width: 150 }}>สถานะ</th>
                <th className="center" style={{ width: 260, whiteSpace: 'nowrap' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบใบสำคัญจ่ายที่ตรงกับเงื่อนไข</td></tr>
              )}
              {filtered.map(v => {
                const st = window.VCH_STATUS[v.status] || window.VCH_STATUS.draft;
                const net = window.vchTotals(v.lines).net;
                const plist = v.payees || [];
                const first = plist[0] ? plist[0].name : '—';
                const hasWht = window.vchBuildCerts(v).length > 0;
                return (
                  <tr key={v.id} className="clickable" onClick={() => openVoucher(v)}>
                    <td className="mono">{v.id}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(v.docDate)}</td>
                    <td>
                      <div className="lt-row-name">{first}{plist.length > 1 ? <span className="muted"> +{plist.length - 1} ราย</span> : ''}</div>
                      <div className="lt-row-note muted">
                        {plist.length > 1 ? `ผู้รับเงิน ${plist.length} ราย` : ((window.VCH_PAYEE_TYPES.find(t => t.v === (plist[0] || {}).type) || {}).l || '')}
                      </div>
                    </td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(net, 2)}</td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'nowrap' }}>
                        <button className="btn sm" onClick={() => openVoucher(v)}><Icon name="eye" size={12} /> ดู</button>
                        <button className="btn sm" onClick={() => doPrint(v)}><Icon name="print" size={12} /> พิมพ์</button>
                        <button className="btn sm" disabled={!hasWht}
                                title={hasWht ? 'หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)' : 'ใบนี้ไม่มีรายการหักภาษี ณ ที่จ่าย'}
                                onClick={() => openCerts(v)}><Icon name="receipt" size={12} /> 50 ทวิ</button>
                      </div>
                    </td>
                  </tr>
                );
                })}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ใบสำคัญจ่ายที่บันทึกสามารถกดพิมพ์ออกจากระบบได้ทันที — สถานะจะกำกับขั้นตอนการตรวจสอบและอนุมัติของแต่ละใบ
      </div>

      {certVoucher && <WhtCertModal voucher={certVoucher} onClose={() => setCertVoucher(null)} onToast={onToast} />}
      {histOpen && <VchHistoryDrawer onClose={() => setHistOpen(false)} />}
      <VoucherPrintSheet voucher={printDoc} />
    </div>
  );
}

Object.assign(window, { VoucherWorkspace });
