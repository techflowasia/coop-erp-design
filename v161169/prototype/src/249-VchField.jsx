// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่าย — ฟอร์มสร้าง/แก้ไข (VoucherForm)
//  · ผู้รับเงินหลายคน (เลือกทีละคน หรือแสตมป์จากเท็มเพลทคณะทำงาน) + ยอดรวม
//  · รายการเบิกจ่ายตัดงบหมวดย่อย (อ้างอิงค่าคงที่งบประมาณ) + ตรวจยอดบาลานซ์
// ════════════════════════════════════════════════════════════════════

function VchField({ label, hint, required, full, children }) {
  return (
    <div className={"vch-field" + (full ? ' full' : '')}>
      <label className="vch-label">
        {label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="vch-hint"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}
function VchSection({ title, sub, right, children }) {
  return (
    <div className="search-card vch-card">
      <div className="vch-sec-head">
        <span className="head-bar" />
        <div style={{ minWidth: 0 }}>
          <h3>{title}</h3>
          {sub && <div className="vch-sec-sub muted">{sub}</div>}
        </div>
        {right && <div className="vch-sec-right">{right}</div>}
      </div>
      {children}
    </div>
  );
}

// ผู้รับเงินรายบุคคล (ไม่รวม "คณะทำงาน" ซึ่งเป็นการแสตมป์)
const VCH_ROW_TYPES = (window.VCH_PAYEE_TYPES || []).filter(t => t.v !== 'group');

// leaves (หมวดย่อยล่างสุด) พร้อมหมวดหลักสำหรับจัดกลุ่ม
function vchLeafCats(structure) {
  const out = [];
  const walk = (ns, top) => ns.forEach(n => {
    const t = top || n.name;
    if (n.children && n.children.length) walk(n.children, t);
    else if (n.enabled) out.push({ id: n.id, code: n.code, name: n.name, gl: n.gl, nature: n.nature, type: n.type, top: t });
  });
  walk(structure, '');
  return out;
}
function vchLeafGroups(leaves) {
  const order = []; const by = {};
  leaves.forEach(l => { if (!by[l.top]) { by[l.top] = []; order.push(l.top); } by[l.top].push(l); });
  return order.map(t => ({ top: t, items: by[t] }));
}

// หมวด "ระดับกำหนดงบประมาณ" (entry level = 2) — เมนู "กำหนดงบประมาณ"
// กรอกตัวเลขที่ระดับ 2 ส่วนหมวดย่อยระดับ 3 อ้างอิงยอดงบจากระดับ 2
// map: id ของหมวดใด ๆ → หมวดระดับ 2 ที่คุมงบให้ (id, code, name)
const VCH_BUD_ENTRY_LEVEL = 2;
function vchEntryOf(structure) {
  const map = {};
  const walk = (ns, level, entry) => (ns || []).forEach(n => {
    const kids = n.children || [];
    let e = entry;
    if (level === VCH_BUD_ENTRY_LEVEL) e = { id: n.id, code: n.code, name: n.name };
    else if (level < VCH_BUD_ENTRY_LEVEL && !kids.length) e = { id: n.id, code: n.code, name: n.name };
    map[n.id] = e;
    if (kids.length) walk(kids, level + 1, e);
  });
  walk(structure, 1, null);
  return map;
}

function vchApprovedMap() {
  let plans = [];
  try {
    // ใช้คีย์เดียวกับเมนู "กำหนดงบประมาณ" (budget_plans_v2) เพื่อให้ล้อตามค่าคงที่ล่าสุด
    const s = localStorage.getItem('budget_plans_v2') || localStorage.getItem('budget_plans');
    plans = s ? JSON.parse(s) : (window.BUDGET_PLAN_SEED || []);
  }
  catch (e) { plans = window.BUDGET_PLAN_SEED || []; }
  if (!plans.length) return { map: {}, year: null };
  const active = plans.find(p => p.status === 'active') || plans.slice().sort((a, b) => b.year - a.year)[0];
  return { map: active.amounts || {}, year: active.year };
}

// ════════════════════════════════════════════════════════════════════
//  Popup — ค้นหาผู้รับเงิน (ตามประเภท)
// ════════════════════════════════════════════════════════════════════
function VchPayeeSearchModal({ payeeType, onPick, onClose }) {
  const [q, setQ] = useState('');
  const all = (window.VCH_PAYEES || []).filter(p => p.type === payeeType);
  const typeLabel = (window.VCH_PAYEE_TYPES.find(t => t.v === payeeType) || {}).l || '';
  const results = q.trim()
    ? all.filter(p => {
        const n = q.toLowerCase();
        return p.code.toLowerCase().includes(n) || p.name.toLowerCase().includes(n) || (p.dept || '').toLowerCase().includes(n);
      })
    : all;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาผู้รับเงิน — {typeLabel}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัส, ชื่อ, หน่วยงาน…" />
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr><th style={{ width: 110 }}>รหัส</th><th>ชื่อผู้รับเงิน</th><th>รายละเอียด</th>
                  <th>บัญชีรับเงิน</th><th style={{ width: 40 }} /></tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบผู้รับเงินที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map(p => (
                  <tr key={p.id} className="clickable" onClick={() => onPick(p)}>
                    <td className="mono">{p.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{p.name.replace(/^(นาย|นาง|นางสาว|บจก\.|หจก\.)\s*/, '').slice(0, 1)}</span>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="muted">{p.dept || '—'}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{p.bank} · {p.acctNo}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(p); }} title="เลือก"><Icon name="chevRight" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Popup — เลือกคณะทำงาน (เท็มเพลท) แล้วแสตมป์รายชื่อ
// ════════════════════════════════════════════════════════════════════
function VchGroupPickModal({ groups, onPick, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 640 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="members" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เลือกคณะทำงาน</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกแล้วระบบจะแสตมป์รายชื่อผู้รับเงินทั้งคณะลงในตารางผู้รับเงิน</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="vch-group-list">
            {groups.map(g => (
              <button key={g.id} className="vch-group-item" onClick={() => onPick(g)}>
                <div className="vch-group-ico"><Icon name="members" /></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="vch-group-name">{g.name}</div>
                  <div className="vch-group-meta muted">{g.members.length} คน · {g.note}</div>
                  <div className="vch-group-members">{g.members.map(m => m.name).join(' · ')}</div>
                </div>
                <Icon name="chevRight" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มหลัก
// ════════════════════════════════════════════════════════════════════
function VoucherForm({ voucher, structure, vouchers, groups, onSave, onCancel, onCerts, onToast, approvalActions }) {
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(voucher)));
  const [payeeModal, setPayeeModal] = useState(null);   // index ของแถวที่กำลังค้นหา
  const [groupModal, setGroupModal] = useState(false);
  const [refModal, setRefModal] = useState(false);       // ค้นหารายการรอจ่ายคืน (ค้างรับ)
  const [expanded, setExpanded] = useState({});          // { payeeIndex: true } — เปิดแจกแจงรายการย่อย
  const PvrRecvSearchModal = window.PvrRecvSearchModal;

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const leaves = React.useMemo(() => vchLeafCats(structure), [structure]);
  const leafGroups = React.useMemo(() => vchLeafGroups(leaves), [leaves]);
  const leafById = (id) => leaves.find(l => l.id === id);
  const postingAccts = React.useMemo(() => (window.pvrPostingAccounts ? window.pvrPostingAccounts() : []), []);
  const acctName = (c) => (window.pvrAcctName ? window.pvrAcctName(c) : '');
  // สลับโหมดของบรรทัด: ตัดงบ (budget) / อ้างผังบัญชี (account)
  const setLineMode = (i, mode) => setD(p => ({ ...p, lines: p.lines.map((l, idx) => idx === i ? { ...l, mode, cat: '', acct: '' } : l) }));

  // ── ผู้รับเงิน ──
  const payees = d.payees || [];
  const setPayee = (i, patch) => setD(p => ({ ...p, payees: p.payees.map((x, idx) => idx === i ? { ...x, ...patch } : x) }));
  const addPayee = () => setD(p => ({ ...p, payees: [...(p.payees || []), { type: 'vendor', payeeId: '', code: '', name: '', bank: '', branch: '', acctNo: '', amount: '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '' }] }));
  const removePayee = (i) => setD(p => ({ ...p, payees: p.payees.filter((_, idx) => idx !== i) }));
  const payeeTotal = window.vchPayeeTotal(payees);

  // ── รายการรอจ่ายคืน (ค้างรับ) ที่อ้างอิง ──
  const refs = d.refs || [];
  const refTotal = refs.reduce((s, r) => s + Number(r.amount || 0), 0);
  const applyRefs = (chosen) => {
    setD(prev => {
      const manual = (prev.payees || []).filter(p => !p.fromRef && (p.name || Number(p.amount)));
      const fromRefs = window.pvrPayeesFromRefs(chosen);
      const nextPayees = [...fromRefs, ...manual];
      return { ...prev, refs: chosen, payees: nextPayees.length ? nextPayees : prev.payees };
    });
    setRefModal(false);
    onToast && onToast(`อ้างอิงรายการรอจ่ายคืน ${chosen.length} รายการ — สร้างผู้รับเงินให้อัตโนมัติ`);
  };
  const removeRef = (id) => {
    setD(prev => {
      const nextRefs = (prev.refs || []).filter(r => r.id !== id);
      const manual = (prev.payees || []).filter(p => !p.fromRef);
      const fromRefs = window.pvrPayeesFromRefs(nextRefs);
      return { ...prev, refs: nextRefs, payees: [...fromRefs, ...manual] };
    });
  };

  // ── รายการย่อยของผู้รับเงินแต่ละราย (Items) → รวมเป็นยอดเงินของราย ──
  const toggleItems = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));
  const setPayeeItems = (i, items) => setD(p => ({
    ...p,
    payees: p.payees.map((x, idx) => idx === i
      ? { ...x, items, amount: items.length ? items.reduce((s, it) => s + Number(it.amount || 0), 0) : x.amount }
      : x),
  }));
  const addItem = (i) => {
    setPayeeItems(i, [...((payees[i] || {}).items || []), { label: '', amount: '' }]);
    setExpanded(e => ({ ...e, [i]: true }));
  };
  const setItem = (i, j, patch) => setPayeeItems(i, ((payees[i] || {}).items || []).map((it, k) => k === j ? { ...it, ...patch } : it));
  const removeItem = (i, j) => setPayeeItems(i, ((payees[i] || {}).items || []).filter((_, k) => k !== j));

  const pickPayee = (p) => {
    const i = payeeModal;
    setPayee(i, { payeeId: p.id, code: p.code, name: p.name, bank: p.bank, branch: p.branch, acctNo: p.acctNo });
    setPayeeModal(null);
  };
  // แสตมป์คณะทำงาน → ต่อท้ายรายชื่อในตารางผู้รับเงิน + เติมรายการเบิกจ่ายตั้งต้นให้บาลานซ์
  const pickGroup = (g) => {
    const stamped = g.members.map(m => ({
      type: 'member', payeeId: '', code: '', name: m.name, bank: m.bank || '', branch: '', acctNo: m.acctNo || '',
      amount: g.defaultAmount || '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '',
    }));
    setD(prev => {
      const existing = (prev.payees || []).filter(x => x.name || Number(x.amount));
      const nextPayees = [...existing, ...stamped];
      const total = window.vchPayeeTotal(nextPayees);
      const linesEmpty = !prev.lines.some(l => l.cat || Number(l.amount));
      const nextLines = linesEmpty
        ? [{ cat: g.defaultCat || '', desc: g.note || '', amount: total, vat: 0, wht: g.defaultWht || '0' }]
        : prev.lines;
      return { ...prev, payees: nextPayees, lines: nextLines };
    });
    setGroupModal(false);
    onToast && onToast(`แสตมป์รายชื่อคณะ “${g.name}” จำนวน ${g.members.length} คน ลงตารางผู้รับเงิน`);
  };

  // ── รายการเบิกจ่าย ──
  const setLine = (i, k, v) => setD(p => ({ ...p, lines: p.lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l) }));
  const addLine = () => setD(p => ({ ...p, lines: [...p.lines, { mode: 'budget', cat: '', acct: '', desc: '', amount: '', vat: 0, wht: '0' }] }));
  const removeLine = (i) => setD(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));
  const totals = window.vchTotals(d.lines);

  // ── ดึงยอดจากผู้รับเงินมาเป็นรายการเบิกจ่าย (กรณีหมวดเดียว) ──
  const balanceDiff = payeeTotal - totals.base;
  const balanced = Math.abs(balanceDiff) < 0.005;

  // ── ไฟล์แนบ ──
  const onFiles = (e) => {
    const names = Array.from(e.target.files || []).map(f => f.name);
    if (names.length) setD(p => ({ ...p, files: [...(p.files || []), ...names] }));
    e.target.value = '';
  };
  const removeFile = (i) => setD(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }));

  // ── สถานะงบประมาณ (เรียลไทม์) ──
  const approved = React.useMemo(() => vchApprovedMap(), []);
  const budgetRows = React.useMemo(() => {
    // งบคุมที่ระดับกำหนดงบประมาณ (ระดับ 2) — หมวดย่อยที่เลือกในบรรทัดจะถูกจัดกลุ่มขึ้นไปที่หมวดคุมงบ
    const entryOf = vchEntryOf(structure);
    const usedEntries = []; const seen = {};
    d.lines.forEach(l => {
      if (!l.cat) return;
      const e = entryOf[l.cat] || leafById(l.cat);
      if (!e) return;
      if (!seen[e.id]) { seen[e.id] = true; usedEntries.push(e); }
    });
    return usedEntries.map(entry => {
      const ap = Number(approved.map[entry.id] || 0);
      // เบิกจ่ายสะสม = ฐานตั้งต้นของทุกหมวดย่อยใต้หมวดคุมงบ + ใบที่ตัดงบแล้ว
      let spent = 0;
      Object.keys(window.VCH_SPENT_BASE || {}).forEach(leafId => {
        const e = entryOf[leafId];
        if (e && e.id === entry.id) spent += Number(window.VCH_SPENT_BASE[leafId] || 0);
      });
      (vouchers || []).forEach(v => {
        if (v.id !== d.id && window.VCH_COMMITTED.includes(v.status)) {
          (v.lines || []).forEach(l => { const e = entryOf[l.cat]; if (e && e.id === entry.id) spent += Number(l.amount || 0); });
        }
      });
      const thisV = d.lines.filter(l => { const e = entryOf[l.cat]; return e && e.id === entry.id; })
                           .reduce((s, l) => s + Number(l.amount || 0), 0);
      const avail = ap - spent;
      return { catId: entry.id, leaf: entry, ap, spent, thisV, avail, over: thisV > avail };
    });
  }, [d.lines, approved, vouchers, d.id, structure]);
  const anyOver = budgetRows.some(r => r.over);

  const validAndSave = (alsoPrint) => {
    if (!payees.some(p => p.name && Number(p.amount) > 0)) { onToast && onToast('กรุณาเพิ่มผู้รับเงินอย่างน้อย 1 คน พร้อมยอดเงิน'); return; }
    if (!refs.length && !d.lines.some(l => (l.cat || l.acct) && Number(l.amount) > 0)) { onToast && onToast('กรุณาเพิ่มรายการเบิกจ่ายอย่างน้อย 1 รายการ'); return; }
    onSave(d, alsoPrint);
  };

  const st = window.VCH_STATUS[d.status] || window.VCH_STATUS.draft;
  const methodBreakdown = window.vchMethodBreakdown(d);
  const hasWht = (d.lines || []).some(l => window.vchWhtRate(l.wht) > 0 && Number(l.amount) > 0);

  return (
    <div data-screen-label="หน้าสร้าง/แก้ไขใบสำคัญจ่าย">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="mono" style={{ fontWeight: 600, marginLeft: 4 }}>{d.id}</span>
        <span className={"pill " + st.pill}>{st.l}</span>
        <span className="spacer" />
        {approvalActions}
        {hasWht && onCerts && (
          <button className="btn sm" onClick={() => onCerts(d)} title="ออกหนังสือรับรองหักภาษี ณ ที่จ่าย (50 ทวิ)">
            <Icon name="receipt" /> หนังสือหัก ณ ที่จ่าย
          </button>
        )}
        <button className="btn sm" onClick={() => validAndSave(true)}><Icon name="print" /> บันทึกและพิมพ์</button>
        <button className="btn primary sm" onClick={() => validAndSave(false)}><Icon name="check" /> บันทึกใบสำคัญจ่าย</button>
      </div>

      {/* แถวบนเอกสาร (ไม่มีหัวข้อ) */}
      <div className="search-card vch-card">
        <div className="vch-grid g3">
          <VchField label="เลขที่ใบสำคัญจ่าย" hint="(สร้างอัตโนมัติ)">
            <input className="cfg-input mono" value={d.id} readOnly />
          </VchField>
          <VchField label="วันที่เอกสาร" required>
            <ErpDate value={d.docDate} onChange={(v) => ((e) => set('docDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </VchField>
          <VchField label="ผู้จัดทำเอกสาร" hint="(จาก User Login)">
            <input className="cfg-input" value={d.createdBy} readOnly />
          </VchField>
        </div>
      </div>

      {/* อ้างอิงใบสำคัญรับ — รายการรอจ่ายคืน */}
      <VchSection title="อ้างอิงใบสำคัญรับ — รายการรอจ่ายคืน"
                  sub="ค้นหาเลขสมาชิกที่ลงบัญชี “รายการค้างรับ” ไว้ผ่านใบสำคัญรับ — ดึงมาตั้งจ่ายคืนในใบสำคัญจ่ายนี้ (ไม่บังคับ)"
                  right={PvrRecvSearchModal && <button className="btn primary sm" onClick={() => setRefModal(true)}><Icon name="search" /> ค้นหารายการรอจ่ายคืน</button>}>
        {refs.length === 0 ? (
          <div className="pvr-ref-empty muted">
            <Icon name="info" size={13} /> ยังไม่ได้อ้างอิงรายการค้างรับ — กด “ค้นหารายการรอจ่ายคืน” เพื่อดึงเลขสมาชิกที่มียอดค้างรับมาตั้งจ่าย
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 0 }}>
            <table className="tbl vch-grid-tbl" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: 36 }}>#</th>
                  <th style={{ width: 150 }}>เลขสมาชิก</th>
                  <th style={{ minWidth: 220 }}>รายการค้างรับ</th>
                  <th style={{ width: 140 }}>อ้างอิงใบสำคัญรับ</th>
                  <th className="right" style={{ width: 120 }}>ยอดตั้งจ่าย</th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {refs.map((r, i) => {
                  const cat = window.pvrRecvCat(r.category);
                  return (
                    <tr key={r.id}>
                      <td className="center mono">{i + 1}</td>
                      <td><div className="lt-row-name mono">{r.memberNo}</div><div className="lt-row-note muted">{r.memberName}</div></td>
                      <td><div>{r.desc}</div>{cat && <span className={"chip " + cat.tone}>{cat.l}</span>}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.rvNo}<div className="muted">{fmt.date(r.rvDate)}</div></td>
                      <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(Number(r.amount || 0), 2)}</td>
                      <td className="center"><button className="bud-act danger" title="ลบการอ้างอิง" onClick={() => removeRef(r.id)}><Icon name="close" size={13} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="vch-foot">
                  <td colSpan="4" className="right">รวมยอดค้างรับที่ตั้งจ่าย ({refs.length} รายการ)</td>
                  <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(refTotal, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </VchSection>

      {/* ข้อมูลผู้รับเงิน — หลายคน */}
      <VchSection title="ข้อมูลผู้รับเงิน"
                  sub="เพิ่มผู้รับเงินได้มากกว่าหนึ่งคน — เลือกทีละบุคคล หรือแสตมป์จากเท็มเพลทคณะทำงาน"
                  right={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn sm" onClick={() => setGroupModal(true)}><Icon name="members" /> เลือกจากคณะทำงาน</button>
                      <button className="btn primary sm" onClick={addPayee}><Icon name="plus" /> เพิ่มผู้รับเงิน</button>
                    </div>
                  }>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 36 }}>#</th>
                <th style={{ width: 150 }}>ประเภทผู้รับเงิน</th>
                <th style={{ minWidth: 190 }}>รหัส / ชื่อ-สกุล ผู้รับเงิน</th>
                <th style={{ width: 240 }}>ธนาคาร / เลขบัญชีรับเงิน</th>
                <th style={{ width: 175 }}>วิธีรับเงิน</th>
                <th className="right" style={{ width: 120 }}>ยอดเงิน</th>
                <th className="center" style={{ width: 150 }}>หัก ณ ที่จ่าย (%)</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {payees.length === 0 && (
                <tr><td colSpan="8" className="center muted" style={{ padding: '22px 12px' }}>
                  ยังไม่มีผู้รับเงิน — กด “เพิ่มผู้รับเงิน” หรือ “เลือกจากคณะทำงาน”
                </td></tr>
              )}
              {payees.map((p, i) => {
                const hasItems = !!(p.items && p.items.length);
                return (
                <React.Fragment key={i}>
                <tr>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="vch-cell-input" value={p.type}
                            onChange={(e) => setPayee(i, { type: e.target.value, payeeId: '', code: '', name: '', bank: '', branch: '', acctNo: '' })}>
                      {VCH_ROW_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </td>
                  <td>
                    {p.type === 'vendor' ? (
                      <div className="vch-pick">
                        <input className="vch-cell-input"
                               value={p.name || ''}
                               placeholder="กรอกชื่อผู้รับเงิน / คู่ค้า"
                               onChange={(e) => setPayee(i, { name: e.target.value, payeeId: '', code: '' })} />
                        <button type="button" className="vch-pick-btn" title="ค้นหาจากข้อมูลคู่ค้าในระบบ (ถ้ามี)" onClick={() => setPayeeModal(i)}><Icon name="search" size={13} /></button>
                      </div>
                    ) : (
                      <div className="vch-pick" onClick={p.fromRef ? undefined : () => setPayeeModal(i)}>
                        <input className={"vch-cell-input" + (p.fromRef ? '' : ' vch-clickable')} readOnly
                               value={p.name ? (p.code ? `${p.code} · ${p.name}` : p.name) : ''}
                               placeholder="คลิกเพื่อค้นหา" />
                        {!p.fromRef && <Icon name="search" size={13} />}
                      </div>
                    )}
                    {p.fromRef && <span className="pvr-ref-tag"><Icon name="receipt" size={10} /> จากค้างรับ</span>}
                    <button type="button" className={"vch-item-toggle" + (hasItems ? ' has' : '')} onClick={() => toggleItems(i)}>
                      <Icon name="chevDown" size={12} style={{ transform: expanded[i] ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                      {hasItems ? `แจกแจง ${p.items.length} รายการ` : 'แจกแจงรายการย่อย'}
                    </button>
                  </td>
                  <td>
                    <div className="vch-bankacct">
                      <input className="vch-cell-input" value={p.bank ? `${p.bank} ${p.branch || ''}`.trim() : ''}
                             placeholder="ธนาคาร / สาขา" onChange={(e) => setPayee(i, { bank: e.target.value, branch: '' })} />
                      <span className="vch-bankacct-div" />
                      <input className="vch-cell-input mono" value={p.acctNo} placeholder="เลขที่บัญชี"
                             onChange={(e) => setPayee(i, { acctNo: e.target.value })} />
                    </div>
                  </td>
                  <td>
                    <select className="vch-cell-input" value={window.vchPayeeMethod(p, d)}
                            onChange={(e) => setPayee(i, { payMethod: e.target.value })}>
                      {window.VCH_PAYMENT.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={p.amount}
                             readOnly={hasItems} title={hasItems ? 'รวมจากรายการย่อยอัตโนมัติ' : ''}
                             placeholder="0.00" onChange={(e) => setPayee(i, { amount: e.target.value })} /></td>
                  <td className="center">
                    <div className="vch-wht-cell">
                      <label className="vch-wht-chk" title="เลือกหักภาษี ณ ที่จ่ายสำหรับผู้รับเงินรายนี้">
                        <input type="checkbox" checked={window.vchWhtRate(p.wht) > 0}
                               onChange={(e) => setPayee(i, e.target.checked
                                 ? { wht: '3', whtAmt: '' }
                                 : { wht: '0', whtAmt: '' })} />
                        <span>หัก</span>
                      </label>
                      {window.vchWhtRate(p.wht) > 0 && (
                        <span className="vch-wht-pct">
                          <input className="vch-cell-input num" type="number" inputMode="decimal" min="0" max="100" step="0.5"
                                 style={{ width: 62, height: 28 }}
                                 value={p.wht} placeholder="0"
                                 title="ระบุอัตราภาษีหัก ณ ที่จ่าย (%)"
                                 onChange={(e) => setPayee(i, { wht: e.target.value, whtAmt: '' })} />
                          <span className="vch-wht-pct-sfx">%</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="center">
                    <button className="bud-act danger" title="ลบผู้รับเงิน" onClick={() => removePayee(i)}><Icon name="close" size={13} /></button>
                  </td>
                </tr>
                {expanded[i] && (
                  <tr className="vch-items-row">
                    <td />
                    <td colSpan="7">
                      <div className="vch-items-box">
                        <div className="vch-items-head">
                          <span className="vch-items-title">แจกแจงรายการเบิกของ {p.name || 'ผู้รับเงินรายนี้'}</span>
                          <button type="button" className="btn text sm" onClick={() => addItem(i)}><Icon name="plus" size={12} /> เพิ่มรายการย่อย</button>
                        </div>
                        {(!p.items || p.items.length === 0) ? (
                          <div className="vch-items-empty muted">ยังไม่มีรายการย่อย — กด “เพิ่มรายการย่อย” เช่น ค่าเบี้ยประชุม · ค่าเดินทาง · ค่าอาหาร · ค่าที่พัก</div>
                        ) : (
                          <table className="vch-items-tbl">
                            <tbody>
                              {p.items.map((it, j) => (
                                <tr key={j}>
                                  <td className="vch-items-no mono">{i + 1}.{j + 1}</td>
                                  <td><input className="vch-cell-input" value={it.label} placeholder="รายการ เช่น ค่าเบี้ยประชุม / ค่าเดินทาง" onChange={(e) => setItem(i, j, { label: e.target.value })} /></td>
                                  <td style={{ width: 140 }}><input className="vch-cell-input num" type="number" inputMode="decimal" value={it.amount} placeholder="0.00" onChange={(e) => setItem(i, j, { amount: e.target.value })} /></td>
                                  <td style={{ width: 34 }} className="center"><button className="bud-act danger" title="ลบรายการย่อย" onClick={() => removeItem(i, j)}><Icon name="close" size={12} /></button></td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td />
                                <td className="right vch-items-suml">รวมยอดเงินของผู้รับเงินรายนี้</td>
                                <td className="right mono vch-items-sumv">{fmt.money(Number(p.amount || 0), 2)}</td>
                                <td />
                              </tr>
                            </tfoot>
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
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="5" className="right">รวมยอดผู้รับเงินทั้งหมด ({payees.length} คน)</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(payeeTotal, 2)}</td>
                <td className="center mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {payees.filter(p => window.vchWhtRate(p.wht) > 0).length} ราย
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="vch-tax-note muted">
          <Icon name="info" size={12} /> กด “แจกแจงรายการย่อย” เพื่อระบุ Item ของผู้รับเงินแต่ละราย (เช่น ค่าเบี้ยประชุม · ค่าเดินทาง · ค่าอาหาร · ค่าที่พัก) — ระบบรวมยอดไปที่ช่อง “ยอดเงิน” ให้อัตโนมัติ · ติ๊ก “หัก ณ ที่จ่าย” แล้วระบุอัตราภาษีเป็นเปอร์เซ็นต์ (%) — ระบบคำนวณจำนวนภาษีจากยอดเงินให้อัตโนมัติ · รายชื่อที่ติ๊กจะไปออกหนังสือรับรองฯ แยกตามรายบุคคล
        </div>
      </VchSection>

      {/* รายการเบิกจ่ายและตัดงบประมาณ */}
      <VchSection title="รายการเบิกจ่าย"
                  sub="แต่ละบรรทัดเลือกได้ว่าจะ “ตัดงบ” (เลือกหมวดงบประมาณระดับหมวดย่อย) หรือ “ผังบัญชี” (อ้างอิงหมวดบัญชีโดยไม่ตัดงบ)"
                  right={<button className="btn primary sm" onClick={addLine}><Icon name="plus" /> เพิ่มรายการ</button>}>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 36 }}>#</th>
                <th style={{ width: 170 }}>หมวดงบประมาณ / ผังบัญชี</th>
                <th style={{ width: 170 }}>GL</th>
                <th style={{ minWidth: 150 }}>คำอธิบายรายการ</th>
                <th className="right" style={{ width: 110 }}>จำนวนเงิน</th>
                <th className="center" style={{ width: 70 }}>VAT</th>
                <th style={{ width: 120 }}>หัก ณ ที่จ่าย</th>
                <th className="right" style={{ width: 110 }}>สุทธิ</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {d.lines.length === 0 && (
                <tr><td colSpan="9" className="center muted" style={{ padding: '22px 12px' }}>ยังไม่มีรายการ — กด “เพิ่มรายการ”</td></tr>
              )}
              {d.lines.map((l, i) => {
                const leaf = leafById(l.cat);
                const calc = window.vchLineCalc(l);
                return (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <select className="vch-cell-input" value={l.cat} onChange={(e) => setD(p => ({ ...p, lines: p.lines.map((ln, idx) => idx === i ? { ...ln, cat: e.target.value, acct: e.target.value ? '' : ln.acct } : ln) }))}>
                        <option value="">— ไม่เลือกหมวดงบประมาณ (เลือกผังบัญชีเอง) —</option>
                        {leafGroups.map(g => (
                          <optgroup key={g.top} label={g.top}>
                            {g.items.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td>
                      {l.cat ? (
                        <div className="vch-cell-input" style={{ background: 'var(--surface-muted, #f5f5f4)', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                          <span className="mono" style={{ fontSize: 12 }}>{leaf && leaf.gl ? leaf.gl : '—'}</span>
                        </div>
                      ) : (
                        <select className="vch-cell-input" value={l.acct || ''}
                                onChange={(e) => setLine(i, 'acct', e.target.value)}>
                          <option value="">— เลือกรหัสผังบัญชี —</option>
                          {postingAccts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td><input className="vch-cell-input" value={l.desc} placeholder="รายละเอียด" onChange={(e) => setLine(i, 'desc', e.target.value)} /></td>
                    <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={l.amount} placeholder="0.00" onChange={(e) => setLine(i, 'amount', e.target.value)} /></td>
                    <td className="center">
                      <select className="vch-cell-input center" value={l.vat} onChange={(e) => setLine(i, 'vat', Number(e.target.value))}>
                        <option value={0}>—</option><option value={7}>7%</option>
                      </select>
                    </td>
                    <td>
                      <select className="vch-cell-input" value={l.wht} onChange={(e) => setLine(i, 'wht', e.target.value)}>
                        {window.VCH_WHT.map(w => <option key={w.v} value={w.v}>{w.v === '0' ? 'ไม่หัก' : w.v + '%'}</option>)}
                      </select>
                    </td>
                    <td className="right mono vch-net">{fmt.money(calc.net, 2)}</td>
                    <td className="center"><button className="bud-act danger" title="ลบรายการ" onClick={() => removeLine(i)}><Icon name="close" size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="4" className="right">รวม</td>
                <td className="right mono">{fmt.money(totals.base, 2)}</td>
                <td className="center mono">{fmt.money(totals.vat, 0)}</td>
                <td className="right mono">−{fmt.money(totals.wht, 0)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totals.net, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* แถบตรวจยอดบาลานซ์ */}
        <div className={"vch-balance " + (balanced ? 'ok' : 'warn')}>
          <Icon name={balanced ? 'check' : 'info'} size={14} />
          <span>ยอดผู้รับเงินรวม <b className="mono">{fmt.money(payeeTotal, 2)}</b></span>
          <span className="vch-bal-sep">เทียบกับ</span>
          <span>ยอดเบิกจ่าย (ก่อนภาษี) <b className="mono">{fmt.money(totals.base, 2)}</b></span>
          <span className="spacer" />
          {balanced
            ? <span className="vch-bal-tag ok">ยอดบาลานซ์</span>
            : <span className="vch-bal-tag warn">ผลต่าง {fmt.money(Math.abs(balanceDiff), 2)} — โปรดตรวจสอบ</span>}
        </div>
        <div className="vch-tax-note muted">
          <Icon name="info" size={12} /> ยอดสุทธิ = จำนวนเงิน + VAT − ภาษีหัก ณ ที่จ่าย · ตัดงบประมาณจากยอดก่อนภาษีของแต่ละหมวด
        </div>
      </VchSection>

      {/* สถานะงบประมาณ */}
      <VchSection title="สถานะงบประมาณ (เรียลไทม์)"
                  sub={approved.year ? `เทียบกับงบประมาณที่อนุมัติ ปีงบประมาณ ${approved.year}` : 'ยังไม่มีปีงบประมาณที่ประกาศใช้'}>
        {budgetRows.length === 0 ? (
          <div className="muted" style={{ fontSize: 12.5, padding: '4px 2px' }}>เลือกหมวดงบประมาณในรายการเบิกจ่าย เพื่อแสดงยอดงบคงเหลือ</div>
        ) : (
          <>
            {anyOver && (
              <div className="vch-overbanner"><Icon name="info" size={14} /> มีบางหมวดที่ยอดเบิกเกินงบคงเหลือ — โปรดตรวจสอบก่อนเสนออนุมัติ</div>
            )}
            <div className="table-wrap" style={{ border: 0 }}>
              <table className="tbl" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>หมวดงบประมาณ</th>
                    <th className="right">งบอนุมัติทั้งปี</th>
                    <th className="right">เบิกจ่ายไปแล้ว</th>
                    <th className="right">คงเหลือเบิกได้</th>
                    <th className="right">ใบนี้</th>
                    <th className="center" style={{ width: 110 }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map(r => (
                    <tr key={r.catId}>
                      <td>{r.leaf ? <><span className="mono bud-code">{r.leaf.code}</span> {r.leaf.name}</> : r.catId}</td>
                      <td className="right mono">{fmt.money(r.ap, 0)}</td>
                      <td className="right mono">{fmt.money(r.spent, 0)}</td>
                      <td className={"right mono" + (r.avail < 0 ? ' vch-neg' : '')}>{fmt.money(r.avail, 0)}</td>
                      <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(r.thisV, 0)}</td>
                      <td className="center">
                        {r.over ? <span className="pill bad">เกินงบ</span>
                          : (r.avail - r.thisV) < r.ap * 0.1 ? <span className="pill warn">ใกล้เต็ม</span>
                          : <span className="pill ok">เพียงพอ</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </VchSection>

      {/* วิธีการรับเงิน — แจกแจงตามผู้รับเงินแต่ละราย */}
      <VchSection title="วิธีการรับเงิน (แจกแจงตามผู้รับเงิน)"
                  sub="ดึงข้อมูลการรับเงินของผู้รับเงินแต่ละราย — เลือกวิธีรับเงิน (โอน / เช็ค / เงินสด) ได้ที่ตารางข้อมูลผู้รับเงินด้านบน">
        <div className="vch-grid g3" style={{ marginBottom: 12 }}>
          <VchField label="บัญชีธนาคารสหกรณ์ (ฝั่งจ่าย)" hint="(ใช้กับรายการโอน / เช็ค)" full>
            <select className="cfg-input" value={d.coopBank} onChange={(e) => set('coopBank', e.target.value)}>
              <option value="">— เลือกบัญชี —</option>
              {window.VCH_COOP_BANKS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </VchField>
        </div>

        {/* สรุปยอดแยกตามวิธีรับเงิน */}
        {methodBreakdown.length > 0 && (
          <div className="vch-method-sum">
            {methodBreakdown.map(m => (
              <div key={m.v} className={"vch-method-pill vm-" + m.v}>
                <span className="vch-method-ico"><Icon name={m.v === 'cheque' ? 'receipt' : m.v === 'cash' ? 'money' : 'swap'} size={13} /></span>
                <span className="vch-method-l">{m.l}</span>
                <span className="vch-method-c">{m.count} ราย</span>
                <span className="vch-method-a mono">{fmt.money(m.amount, 2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 36 }}>#</th>
                <th style={{ minWidth: 200 }}>ผู้รับเงิน</th>
                <th style={{ width: 130 }}>วิธีรับเงิน</th>
                <th style={{ minWidth: 260 }}>รายละเอียดการรับเงิน</th>
                <th className="right" style={{ width: 120 }}>ยอดเงิน</th>
              </tr>
            </thead>
            <tbody>
              {payees.filter(p => p.name || Number(p.amount)).length === 0 && (
                <tr><td colSpan="5" className="center muted" style={{ padding: '20px 12px' }}>
                  ยังไม่มีผู้รับเงิน — เพิ่มผู้รับเงินในตารางด้านบนก่อน
                </td></tr>
              )}
              {payees.map((p, i) => {
                if (!(p.name || Number(p.amount))) return null;
                const method = window.vchPayeeMethod(p, d);
                const mLabel = window.vchPayMethodLabel(method);
                return (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <div className="lt-row-name">{p.name || <span className="muted">— ไม่ระบุชื่อ —</span>}</div>
                      {p.code && <div className="lt-row-note muted mono">{p.code}</div>}
                    </td>
                    <td><span className={"chip " + (method === 'cheque' ? 'warning' : method === 'cash' ? 'info' : 'primary')}>{mLabel}</span></td>
                    <td>
                      {method === 'transfer' && (
                        <div className="vch-recv-detail">
                          {(p.bank || p.acctNo)
                            ? <><span>{`${p.bank || ''} ${p.branch || ''}`.trim() || '—'}</span>
                                <span className="mono muted"> · {p.acctNo || '—'}</span></>
                            : <span className="muted">— ยังไม่ระบุบัญชีรับโอน —</span>}
                        </div>
                      )}
                      {method === 'cheque' && (
                        <div className="vch-recv-chq">
                          <input className="vch-cell-input mono" style={{ maxWidth: 130 }} value={p.chequeNo || ''}
                                 placeholder="เลขที่เช็ค" onChange={(e) => setPayee(i, { chequeNo: e.target.value })} />
                          <ErpDate value={p.chequeDate || ''} onChange={(v) => ((e) => setPayee(i, { chequeDate: e.target.value }))({ target: { value: v } })} style={{ maxWidth: 140 }} className="vch-cell-input" />
                        </div>
                      )}
                      {method === 'cash' && (
                        <div className="vch-recv-detail muted">รับเป็นเงินสด ณ ที่ทำการสหกรณ์</div>
                      )}
                    </td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(Number(p.amount || 0), 2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="4" className="right">รวมยอดจ่ายทั้งสิ้น ({payees.filter(p => p.name || Number(p.amount)).length} ราย)</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(payeeTotal, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="vch-tax-note muted">
          <Icon name="info" size={12} /> ระบบดึงข้อมูลการรับเงินรายบุคคลจากตารางผู้รับเงิน — รายการโอนใช้เลขบัญชีรับเงิน · รายการเช็คให้ระบุเลขที่/วันที่หน้าเช็คของแต่ละราย · รายการเงินสดจ่าย ณ ที่ทำการ
        </div>
      </VchSection>

      {/* หลักฐานและสายการอนุมัติ */}
      <VchSection title="หลักฐานและสายการอนุมัติ">
        <div className="vch-grid g2">
          <VchField label="ไฟล์แนบ" hint="(ใบแจ้งหนี้ / ใบเสร็จ / บันทึกขออนุมัติ)" full>
            <label className="sr-file-btn">
              <Icon name="attach" size={14} /> เลือกไฟล์เพื่อแนบ…
              <input type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={onFiles} />
            </label>
            {(d.files || []).length > 0 && (
              <div className="sr-file-list">
                {d.files.map((nm, i) => (
                  <span className="sr-file-chip" key={i}>
                    <Icon name="attach" size={11} /><span className="nm">{nm}</span>
                    <button type="button" onClick={() => removeFile(i)} title="ลบไฟล์"><Icon name="close" size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </VchField>
          <VchField label="หมายเหตุ" full>
            <input className="cfg-input" value={d.note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" onChange={(e) => set('note', e.target.value)} />
          </VchField>
        </div>

        <div className="vch-approval">
          {[
            { k: 'ผู้จัดทำ', name: d.createdBy, need: 0 },
            { k: 'ผู้ตรวจสอบ', name: 'นางสาวิตรี อินทรโชติ', need: 1 },
            { k: 'ผู้อนุมัติ', name: 'นายประสิทธิ์ คงทอง', need: 2 },
          ].map((s, i) => {
            const done = st.step >= 0 && st.step >= s.need;
            return (
              <div key={i} className={"vch-appr-step" + (done ? ' done' : '')}>
                <div className="vch-appr-role">{s.k}</div>
                <div className="vch-appr-name">{done ? s.name : '— รอดำเนินการ —'}</div>
                <div className="vch-appr-mark">{done ? <Icon name="check" size={13} /> : <span className="vch-appr-dot" />}</div>
              </div>
            );
          })}
        </div>
      </VchSection>

      {payeeModal != null && (
        <VchPayeeSearchModal payeeType={(payees[payeeModal] || {}).type || 'vendor'}
                             onPick={pickPayee} onClose={() => setPayeeModal(null)} />
      )}
      {groupModal && <VchGroupPickModal groups={groups} onPick={pickGroup} onClose={() => setGroupModal(false)} />}
      {refModal && PvrRecvSearchModal && <PvrRecvSearchModal current={refs} onApply={applyRefs} onClose={() => setRefModal(false)} />}
    </div>
  );
}

Object.assign(window, { VoucherForm, VchPayeeSearchModal });
