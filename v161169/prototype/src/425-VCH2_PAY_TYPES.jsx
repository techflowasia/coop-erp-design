// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่าย — ฟอร์มสร้าง/แก้ไข (VoucherForm) — ปรับปรุง
//  · เพิ่ม "ประเภทการเบิกจ่าย": ทั่วไป / เบิกเงินรอจ่ายคืน / เบิกจ่ายการคณะทำงาน
//  · แจกแจงรายการเบิกของผู้รับเงิน: เลือกหมวดงบประมาณ + GL ได้
//  · การ์ด "รายการเบิกจ่าย" อ่านอย่างเดียว (ดึงจากรายการย่อยของผู้รับเงิน)
//  · เลขที่ใบสำคัญจ่ายแสดงเมื่อบันทึกแล้วเท่านั้น (ระบบ run เลขอัตโนมัติ)
//  โหลดหลังไฟล์ 235 — override window.VoucherForm
// ════════════════════════════════════════════════════════════════════

const VCH2_PAY_TYPES = [
  { v: 'general',   l: 'ทั่วไป',                  desc: 'เบิกจ่ายทั่วไป' },
  { v: 'refund',    l: 'เบิกเงินรอจ่ายคืน',        desc: 'อ้างอิงใบสำคัญรับ — รายการรอจ่ายคืน' },
  { v: 'committee', l: 'เบิกจ่ายการคณะทำงาน',      desc: 'ระบุชื่อคณะทำงานเพื่อใช้ออกรายงาน' },
];


// ── helper ท้องถิ่น (ไม่พึ่ง scope ของไฟล์ 235) ──────────────────────
function V2Field({ label, hint, required, full, children }) {
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
function V2Section({ title, sub, right, children }) {
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

function V2GroupPickModal({ groups, onPick, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 640 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="members" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เลือกคณะทำงาน</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกแล้วระบบจะแสตมป์รายชื่อผู้รับเงินทั้งคณะ และจัดเก็บชื่อคณะทำงานไว้ใช้ออกรายงาน</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="vch-group-list">
            {(groups || []).map(g => (
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

function v2RowTypes() { return (window.VCH_PAYEE_TYPES || []).filter(t => t.v !== 'group'); }
function v2LeafCats(structure) {
  const out = [];
  const walk = (ns, top) => (ns || []).forEach(n => {
    const t = top || n.name;
    if (n.children && n.children.length) walk(n.children, t);
    else if (n.enabled) out.push({ id: n.id, code: n.code, name: n.name, gl: n.gl, nature: n.nature, type: n.type, top: t });
  });
  walk(structure, '');
  return out;
}
function v2LeafGroups(leaves) {
  const order = []; const by = {};
  leaves.forEach(l => { if (!by[l.top]) { by[l.top] = []; order.push(l.top); } by[l.top].push(l); });
  return order.map(t => ({ top: t, items: by[t] }));
}
function v2EntryOf(structure) {
  const LEVEL = 2; const map = {};
  const walk = (ns, level, entry) => (ns || []).forEach(n => {
    const kids = n.children || [];
    let e = entry;
    if (level === LEVEL) e = { id: n.id, code: n.code, name: n.name };
    else if (level < LEVEL && !kids.length) e = { id: n.id, code: n.code, name: n.name };
    map[n.id] = e;
    if (kids.length) walk(kids, level + 1, e);
  });
  walk(structure, 1, null);
  return map;
}
function v2ApprovedMap() {
  let plans = [];
  try {
    const s = localStorage.getItem('budget_plans_v2') || localStorage.getItem('budget_plans');
    plans = s ? JSON.parse(s) : (window.BUDGET_PLAN_SEED || []);
  } catch (e) { plans = window.BUDGET_PLAN_SEED || []; }
  if (!plans.length) return { map: {}, year: null };
  const active = plans.find(p => p.status === 'active') || plans.slice().sort((a, b) => b.year - a.year)[0];
  return { map: active.amounts || {}, year: active.year };
}

function VoucherForm({ voucher, structure, vouchers, groups, onSave, onCancel, onCerts, onToast, approvalActions }) {
  const [d, setD] = useState(() => {
    const base = JSON.parse(JSON.stringify(voucher));
    if (!base.payType) base.payType = (base.refs && base.refs.length) ? 'refund' : 'general';
    if (base.committeeName == null) base.committeeName = '';
    if (base.committeeId == null) base.committeeId = '';
    return base;
  });
  const [payeeModal, setPayeeModal] = useState(null);
  const [groupModal, setGroupModal] = useState(false);
  const [refModal, setRefModal] = useState(false);
  const [expanded, setExpanded] = useState({});
  const PvrRecvSearchModal = window.PvrRecvSearchModal;
  const PayeeSearch = window.VchPayeeSearchModal;
  const GroupPick = V2GroupPickModal;

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const leaves = React.useMemo(() => v2LeafCats(structure), [structure]);
  const leafGroups = React.useMemo(() => v2LeafGroups(leaves), [leaves]);
  const leafById = (id) => leaves.find(l => l.id === id);
  const postingAccts = React.useMemo(() => (window.pvrPostingAccounts ? window.pvrPostingAccounts() : []), []);

  // เลขที่เอกสาร: แสดงเมื่อบันทึกลงระบบแล้วเท่านั้น
  const isSaved = !!(vouchers || []).some(v => v.id === voucher.id);
  const [editing, setEditing] = useState(!isSaved);
  const locked = !editing;
  const isClosed = d.status === 'paid' || d.status === 'cancelled';
  const d0 = React.useRef(null);
  if (d0.current === null) d0.current = JSON.stringify(d);
  const isDirty = JSON.stringify(d) !== d0.current;
  const [askDiscard, setAskDiscard] = useState(false);
  const [askSave, setAskSave] = useState(null); // { alsoPrint, rec } — popup ยืนยันก่อนบันทึก
  const [printV, setPrintV] = useState(null);
  const printSelf = () => { setPrintV(d); setTimeout(() => window.printVoucher && window.printVoucher(onToast), 80); };
  const discardEdit = () => {
    setAskDiscard(false);
    if (!isSaved) { onCancel && onCancel(); return; }
    setD(JSON.parse(d0.current)); setExpanded({}); setEditing(false);
  };
  const cancelEdit = () => { if (isDirty) setAskDiscard(true); else discardEdit(); };

  // ── ผู้รับเงิน ──
  const payees = d.payees || [];
  const setPayee = (i, patch) => setD(p => ({ ...p, payees: p.payees.map((x, idx) => idx === i ? { ...x, ...patch } : x) }));
  const addPayee = () => setD(p => ({ ...p, payees: [...(p.payees || []), { type: 'vendor', payeeId: '', code: '', name: '', bank: '', branch: '', acctNo: '', amount: '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '', items: [] }] }));
  const removePayee = (i) => setD(p => ({ ...p, payees: p.payees.filter((_, idx) => idx !== i) }));
  const payeeTotal = window.vchPayeeTotal(payees);

  // ── รายการรอจ่ายคืน (ค้างรับ) ──
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

  // ── รายการย่อยของผู้รับเงินแต่ละราย ──
  const blankItem = (prev) => ({ label: '', amount: '', cat: prev ? prev.cat || '' : '', acct: prev ? prev.acct || '' : '' });
  const toggleItems = (i) => {
    const open = !expanded[i];
    const cur = payees[i] || {};
    if (open && !locked && !(cur.items || []).length && !(Number(cur.amount) > 0)) setPayeeItems(i, [blankItem()]);
    setExpanded(e => ({ ...e, [i]: open }));
  };
  const itemBlank = (it) => !String(it.label || '').trim() && !(Number(it.amount) > 0);
  const itemIncomplete = (it) => !itemBlank(it) && (!String(it.label || '').trim() || !(Number(it.amount) > 0));
  const itemStatus = (p) => {
    const its = (p.items || []).filter(it => !itemBlank(it));
    if (!its.length) return { cls: 'none', text: 'ยังไม่แจกแจง' };
    const bad = its.filter(itemIncomplete).length;
    if (bad) return { cls: 'warn', text: 'กรอกไม่ครบ ' + bad + ' รายการ' };
    return { cls: 'ok', text: 'แจกแจง ' + its.length + ' รายการ' };
  };
  const copyItemsToOthers = (i) => {
    const src = ((payees[i] || {}).items || []).map(it => ({ ...it }));
    if (!src.length) return;
    const total = src.reduce((s, it) => s + Number(it.amount || 0), 0);
    setD(p => ({ ...p, payees: p.payees.map((x, idx) => idx === i ? x : { ...x, items: src.map(it => ({ ...it })), amount: total }) }));
    onToast && onToast('คัดลอกรายการแจกแจงไปผู้รับเงินอีก ' + (payees.length - 1) + ' คนแล้ว');
  };
  const itemRefs = React.useRef({});
  const setPayeeItems = (i, items) => setD(p => ({
    ...p,
    payees: p.payees.map((x, idx) => idx === i
      ? { ...x, items, amount: items.length ? items.reduce((s, it) => s + Number(it.amount || 0), 0) : x.amount }
      : x),
  }));
  const addItem = (i) => {
    const cur = (payees[i] || {}).items || [];
    setPayeeItems(i, [...cur, blankItem(cur[cur.length - 1])]);
    setExpanded(e => ({ ...e, [i]: true }));
    setTimeout(() => { const el = itemRefs.current[i + '.' + cur.length]; if (el) el.focus(); }, 30);
  };
  const setItem = (i, j, patch) => setPayeeItems(i, ((payees[i] || {}).items || []).map((it, k) => k === j ? { ...it, ...patch } : it));
  const removeItem = (i, j) => setPayeeItems(i, ((payees[i] || {}).items || []).filter((_, k) => k !== j));

  const pickPayee = (p) => {
    const i = payeeModal;
    setPayee(i, { payeeId: p.id, code: p.code, name: p.name, bank: p.bank, branch: p.branch, acctNo: p.acctNo });
    setPayeeModal(null);
  };
  // แสตมป์คณะทำงาน → ต่อท้ายรายชื่อ + จัดเก็บชื่อคณะทำงานไว้ใช้ออกรายงาน
  const pickGroup = (g) => {
    const stamped = g.members.map(m => ({
      type: 'member', payeeId: '', code: '', name: m.name, bank: m.bank || '', branch: '', acctNo: m.acctNo || '',
      amount: g.defaultAmount || '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '',
      items: g.defaultAmount ? [{ label: g.note || 'ค่าเบี้ยประชุม', amount: g.defaultAmount, cat: g.defaultCat || '', acct: '' }] : [],
    }));
    setD(prev => {
      const existing = (prev.payees || []).filter(x => x.name || Number(x.amount));
      return {
        ...prev,
        payType: 'committee',
        committeeId: g.id,
        committeeName: g.name,
        payees: [...existing, ...stamped],
      };
    });
    setGroupModal(false);
    onToast && onToast(`แสตมป์รายชื่อคณะ “${g.name}” จำนวน ${g.members.length} คน — จัดเก็บชื่อคณะทำงานให้อัตโนมัติ`);
  };

  // ── รายการเบิกจ่าย (อ่านอย่างเดียว) — ดึงจากรายการย่อยของผู้รับเงินทุกราย ──
  const derived = React.useMemo(() => {
    const out = [];
    payees.forEach((p, pi) => (p.items || []).filter(it => String(it.label || '').trim() || Number(it.amount) > 0).forEach((it, j) => out.push({
      key: pi + '.' + j, no: (pi + 1) + '.' + (j + 1), payeeName: p.name,
      cat: it.cat || '', acct: it.acct || '', desc: it.label || '', amount: it.amount || '',
    })));
    return out;
  }, [payees]);

  React.useEffect(() => {
    const next = derived.map(r => ({ mode: r.cat ? 'budget' : 'account', cat: r.cat, acct: r.acct, desc: r.desc, amount: r.amount, vat: 0, wht: '0' }));
    if (JSON.stringify(next) !== JSON.stringify(d.lines || [])) setD(p => ({ ...p, lines: next }));
  }, [derived]);

  const totals = window.vchTotals(d.lines || []);
  const whtTotal = payees.reduce((s, p) => s + Number(p.amount || 0) * (window.vchWhtRate(p.wht) || 0) / 100, 0);
  const netPay = payeeTotal - whtTotal;
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
  const approved = React.useMemo(() => v2ApprovedMap(), []);
  const budgetRows = React.useMemo(() => {
    const entryOf = v2EntryOf(structure);
    const lines = d.lines || [];
    const usedEntries = []; const seen = {};
    lines.forEach(l => {
      if (!l.cat) return;
      const e = entryOf[l.cat] || leafById(l.cat);
      if (!e) return;
      if (!seen[e.id]) { seen[e.id] = true; usedEntries.push(e); }
    });
    return usedEntries.map(entry => {
      const ap = Number(approved.map[entry.id] || 0);
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
      const thisV = lines.filter(l => { const e = entryOf[l.cat]; return e && e.id === entry.id; })
                         .reduce((s, l) => s + Number(l.amount || 0), 0);
      const avail = ap - spent;
      return { catId: entry.id, leaf: entry, ap, spent, thisV, avail, over: thisV > avail };
    });
  }, [d.lines, approved, vouchers, d.id, structure]);
  const anyOver = budgetRows.some(r => r.over);

  const validAndSave = (alsoPrint) => {
    if (!payees.some(p => p.name && Number(p.amount) > 0)) { onToast && onToast('กรุณาเพิ่มผู้รับเงินอย่างน้อย 1 คน พร้อมยอดเงิน'); return; }
    if (!derived.some(r => Number(r.amount) > 0)) { onToast && onToast('กรุณาแจกแจงรายการเบิกของผู้รับเงินอย่างน้อย 1 รายการ'); return; }
    const badPayees = payees.map((p, i) => ({ p, i })).filter(({ p }) => (p.items || []).some(itemIncomplete));
    if (badPayees.length) {
      onToast && onToast('ผู้รับเงิน ' + badPayees.length + ' คนกรอกรายการแจกแจงไม่ครบ: ' + badPayees.map(b => b.p.name || ('ลำดับ ' + (b.i + 1))).join(', '));
      setExpanded(e => { const n = { ...e }; badPayees.forEach(b => { n[b.i] = true; }); return n; });
      return;
    }
    if (d.payType === 'committee' && !String(d.committeeName || '').trim()) { onToast && onToast('กรุณาระบุชื่อคณะทำงาน'); return; }
    // ไม่มีสถานะ“ร่าง” — กดบันทึกแล้วเข้าสถานะรออนุมัติทันที
    const nextStatus = (!d.status || d.status === 'draft' || d.status === 'pending_check')
      ? (window.vchNoDraftStatus || 'pending_appr') : d.status;
    const cleanedPayees = payees.map(p => {
      const items = (p.items || []).filter(it => !itemBlank(it));
      return (p.items || []).length === items.length ? p
        : { ...p, items, amount: items.length ? items.reduce((s, it) => s + Number(it.amount || 0), 0) : p.amount };
    });
    setAskSave({ alsoPrint, rec: { ...d, payees: cleanedPayees, status: nextStatus } });
  };

  const st = window.VCH_STATUS[d.status] || window.VCH_STATUS.draft;
  const methodBreakdown = window.vchMethodBreakdown(d);
  const hasWht = payees.some(p => (window.vchWhtRate(p.wht) || 0) > 0 && Number(p.amount) > 0);
  const groupList = groups || window.VCH_GROUPS || [];
  const committeeOpts = groupList.map(g => ({ value: g.name, label: g.name, sub: (g.members || []).length + ' คน' }));
  const [manualCommittee, setManualCommittee] = useState(false);

  // เซลล์เลือกหมวดงบประมาณ / GL ของรายการย่อย (เงื่อนไขเดียวกับรายการเบิกจ่าย)
  const ItemCatCell = ({ i, j, it }) => (
    <V2Select className="vch-cell-input" value={it.cat || ''}
            onChange={(e) => setItem(i, j, { cat: e.target.value, acct: e.target.value ? '' : (it.acct || '') })}>
      <option value="">— ไม่เลือกหมวดงบประมาณ (เลือกผังบัญชีเอง) —</option>
      {leafGroups.map(g => (
        <optgroup key={g.top} label={g.top}>
          {g.items.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
        </optgroup>
      ))}
    </V2Select>
  );
  const ItemGlCell = ({ i, j, it }) => {
    const leaf = leafById(it.cat);
    if (it.cat) {
      return (
        <div className="vch-cell-input" style={{ background: 'var(--surface-muted, #f5f5f4)', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: 12 }}>{leaf && leaf.gl ? leaf.gl : '—'}</span>
        </div>
      );
    }
    return (
      <V2Select className="vch-cell-input" value={it.acct || ''} onChange={(e) => setItem(i, j, { acct: e.target.value })}>
        <option value="">— เลือกรหัสผังบัญชี —</option>
        {postingAccts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
      </V2Select>
    );
  };

  return (
    <div data-screen-label="หน้าสร้าง/แก้ไขใบสำคัญจ่าย" className="vch-form">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        {isSaved
          ? <span className="mono" style={{ fontWeight: 600, marginLeft: 4 }}>{d.id}</span>
          : <span className="muted" style={{ fontSize: 11.5, marginLeft: 4 }}>ยังไม่ออกเลขที่ — ระบบจะ run เลขให้เมื่อบันทึก</span>}
        <span className={"pill " + st.pill}>{st.l}</span>
        <span className="spacer" />
        {!editing && <>
          <button className="btn sm" data-keep-top="" onClick={printSelf}><Icon name="print" /> พิมพ์</button>
          {hasWht && onCerts && isSaved && (
            <button className="btn sm" data-keep-top="" onClick={() => onCerts(d)} title="ออกหนังสือรับรองหักภาษี ณ ที่จ่าย (50 ทวิ)">
              <Icon name="receipt" /> หนังสือหัก ณ ที่จ่าย
            </button>
          )}
          {approvalActions}
          {!isClosed && (
            <button className="btn primary sm" data-keep-top="" onClick={() => { d0.current = JSON.stringify(d); setEditing(true); }}>
              <Icon name="edit" /> แก้ไข
            </button>
          )}
        </>}
        {editing && <>
          <button className="btn sm" data-keep-top="" onClick={cancelEdit}>ยกเลิก</button>
          <button className="btn primary sm" data-keep-top="" onClick={() => validAndSave(false)}><Icon name="check" /> บันทึกใบสำคัญจ่าย</button>
        </>}
      </div>

      <div className={locked ? 'fb-readonly vch-view' : undefined}
           onFocusCapture={locked ? (e) => { const t = e.target; if (t && t.matches && t.matches('input, select, textarea, [contenteditable]') && !t.closest('[data-view-ok]')) t.blur(); } : undefined}
           onClickCapture={locked ? (e) => { const t = e.target; if (t.closest && t.closest('button, input, select, textarea, label, [role="button"], [role="combobox"], .ssel-control, .vch-pick-btn') && !t.closest('[data-view-ok]')) { e.preventDefault(); e.stopPropagation(); } } : undefined}
           onMouseDownCapture={locked ? (e) => { const t = e.target; if (t.closest && t.closest('button, select, [role="button"], [role="combobox"], .ssel-control, .vch-pick-btn') && !t.closest('[data-view-ok]')) { e.preventDefault(); e.stopPropagation(); } } : undefined}
           onKeyDownCapture={locked ? (e) => { const t = e.target; if (t.closest && t.closest('[data-view-ok]')) return;
             if ((t.matches && t.matches('input, select, textarea')) || ((e.key === 'Enter' || e.key === ' ') && t.closest && t.closest('button, [role="button"], [role="combobox"]'))) { e.preventDefault(); e.stopPropagation(); } } : undefined}>

      {/* แถวบนเอกสาร */}
      <div className="search-card vch-card">
        <div className="vch-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))' }}>
          <V2Field label="เลขที่ใบสำคัญจ่าย">
            {isSaved
              ? <input className="cfg-input mono" value={d.id} readOnly />
              : <input className="cfg-input" value="" placeholder="(ออกเลขเมื่อบันทึก)" readOnly />}
          </V2Field>
          <V2Field label="วันที่เอกสาร" required>
            <window.ThaiDateField value={d.docDate} onChange={(v) => set('docDate', v)} />
          </V2Field>
          <V2Field label="ผู้จัดทำเอกสาร">
            <input className="cfg-input" value={d.createdBy} readOnly title="จาก User Login" />
          </V2Field>
          <V2Field label="ประเภทการเบิกจ่าย" required>
            <div title={(VCH2_PAY_TYPES.find(t => t.v === d.payType) || {}).desc}>
              <V2Select className="cfg-input" value={d.payType}
                      onChange={(e) => setD(p => ({ ...p, payType: e.target.value }))}>
                {VCH2_PAY_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </V2Select>
            </div>
          </V2Field>
        </div>

        <div className="vch-grid" style={{ marginTop: 4, gridTemplateColumns: 'minmax(0, 1fr)' }}>

        {d.payType === 'committee' && (
          <>
            <V2Field label="ชื่อคณะทำงาน" required
                      hint={manualCommittee ? '(กรอกชื่อคณะทำงานเอง — จัดเก็บเพื่อใช้ออกรายงาน)' : '(ค้นหาจากคณะทำงานในระบบ — จัดเก็บเพื่อใช้ออกรายงาน)'}>
              {manualCommittee ? (
                <input className="cfg-input" value={d.committeeName || ''} autoFocus
                       placeholder="เช่น คณะทำงานพิจารณาเงินกู้"
                       onChange={(e) => setD(p => ({ ...p, committeeId: '', committeeName: e.target.value }))} />
              ) : (
                <SearchSelect value={d.committeeName || ''} allowClear
                              options={committeeOpts}
                              placeholder="— เลือกคณะทำงานที่ขอเบิกเบี้ยประชุม —"
                              searchPlaceholder="พิมพ์ชื่อคณะทำงาน…"
                              onChange={(v) => {
                                const g = groupList.find(x => x.name === v);
                                setD(p => ({ ...p, committeeId: g ? g.id : '', committeeName: v || '' }));
                              }} />
              )}
              <button type="button" className="btn text sm" style={{ marginTop: 4, padding: 0 }}
                      onClick={() => { setManualCommittee(m => !m); setD(p => ({ ...p, committeeId: '', committeeName: '' })); }}>
                {manualCommittee ? 'เลือกจากคณะทำงานในระบบ' : 'ไม่อยู่ในรายการ — กรอกชื่อเอง'}
              </button>
            </V2Field>
          </>
        )}
        </div>
      </div>

      {/* อ้างอิงใบสำคัญรับ — แสดงเฉพาะประเภท "เบิกเงินรอจ่ายคืน" */}
      {d.payType === 'refund' && (
      <V2Section title="อ้างอิงใบสำคัญรับ — รายการรอจ่ายคืน"
                  sub="ค้นหาเลขสมาชิกที่ลงบัญชี “รายการค้างรับ” ไว้ผ่านใบสำคัญรับ — ดึงมาตั้งจ่ายคืนในใบสำคัญจ่ายนี้"
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
                  <th style={{ width: 36 }}>#</th>
                  <th style={{ width: 150 }}>เลขสมาชิก</th>
                  <th style={{ minWidth: 220 }}>รายการค้างรับ</th>
                  <th style={{ width: 140 }}>อ้างอิงใบสำคัญรับ</th>
                  <th style={{ width: 120 }}>ยอดตั้งจ่าย</th>
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
                      <td className="center"><button className="btn sm tt-del-btn" title="ลบการอ้างอิง" aria-label="ลบการอ้างอิง" onClick={() => removeRef(r.id)}><Icon name="trash" size={13} /></button></td>
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
      </V2Section>
      )}

      {/* ข้อมูลผู้รับเงิน */}
      <V2Section title="ข้อมูลผู้รับเงิน"
                  sub="เพิ่มผู้รับเงินได้มากกว่าหนึ่งคน — เลือกทีละบุคคล หรือแสตมป์จากเท็มเพลทคณะทำงาน"
                  right={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn sm" onClick={() => setGroupModal(true)}><Icon name="members" /> เลือกจากคณะทำงาน</button>
                      <button className="btn primary sm" onClick={addPayee}><Icon name="plus" /> เพิ่มผู้รับเงิน</button>
                    </div>
                  }>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto', maxWidth: '100%' }}>
          <table className="tbl vch-grid-tbl vch-payee-tbl" style={{ minWidth: 1250, width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th style={{ width: 130 }}>ประเภทผู้รับเงิน</th>
                <th style={{ width: 230 }}>รหัส / ชื่อ-สกุล ผู้รับเงิน</th>
                <th style={{ width: 240 }}>ธนาคาร / เลขบัญชีรับเงิน</th>
                <th style={{ width: 155 }}>วิธีรับเงิน</th>
                <th style={{ width: 120 }}>ยอดเงิน</th>
                <th style={{ width: 130 }}>หัก ณ ที่จ่าย (%)</th>
                <th style={{ width: 140 }}>รายการแจกแจง</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {payees.length === 0 && (
                <tr><td colSpan="9" className="center muted" style={{ padding: '22px 12px' }}>
                  ยังไม่มีผู้รับเงิน — กด “เพิ่มผู้รับเงิน” หรือ “เลือกจากคณะทำงาน”
                </td></tr>
              )}
              {payees.map((p, i) => {
                const hasItems = !!(p.items && p.items.length);
                return (
                <React.Fragment key={i}>
                <tr className={expanded[i] ? 'vch-payee-open' : undefined}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <V2Select className="vch-cell-input" value={p.type}
                            onChange={(e) => setPayee(i, { type: e.target.value, payeeId: '', code: '', name: '', bank: '', branch: '', acctNo: '' })}>
                      {v2RowTypes().map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </V2Select>
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
                    <V2Select className="vch-cell-input" value={window.vchPayeeMethod(p, d)}
                            onChange={(e) => setPayee(i, { payMethod: e.target.value })}>
                      {window.VCH_PAYMENT.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </V2Select>
                  </td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={p.amount}
                             readOnly={hasItems} title={hasItems ? 'รวมจากรายการย่อยอัตโนมัติ' : ''}
                             placeholder="0.00" onChange={(e) => setPayee(i, { amount: e.target.value })} /></td>
                  <td className="center">
                    <div className="vch-wht-cell">
                      <label className="vch-wht-chk" title="เลือกหักภาษี ณ ที่จ่ายสำหรับผู้รับเงินรายนี้">
                        <input type="checkbox" checked={window.vchWhtRate(p.wht) > 0}
                               onChange={(e) => setPayee(i, e.target.checked ? { wht: '3', whtAmt: '' } : { wht: '0', whtAmt: '' })} />
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
                    {(() => { const st = itemStatus(p); return (
                      <div className="vch-itm-cell">
                        <button type="button" data-view-ok="" className={'btn sm vch-itm-btn' + (expanded[i] ? ' open' : '')} onClick={() => toggleItems(i)}>
                          <Icon name="menu" size={13} /> {expanded[i] ? 'ซ่อนรายการ' : 'แจกแจงรายการ'}
                          <Icon name="chevDown" size={11} style={{ transform: expanded[i] ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                        </button>
                        <span className={'vch-itm-st st-' + st.cls}>{st.cls === 'ok' && <Icon name="check" size={10} />} {st.text}</span>
                      </div>); })()}
                  </td>
                  <td className="center">
                    <button className="btn sm tt-del-btn" title="ลบผู้รับเงิน" aria-label="ลบผู้รับเงิน" onClick={() => removePayee(i)}><Icon name="trash" size={13} /></button>
                  </td>
                </tr>
                {expanded[i] && (
                  <tr className="vch-items-row">
                    <td />
                    <td colSpan="8">
                      <div className="vch-items-box child">
                        <div className="vch-items-head">
                          <span className="vch-items-tag">รายการแจกแจง</span>
                          <span className="vch-items-title">ของ {p.name || 'ผู้รับเงินรายนี้'}</span>
                          <span className="spacer" style={{ flex: 1 }} />
                          {payees.length > 1 && hasItems && (
                            <button type="button" className="btn sm" onClick={() => copyItemsToOthers(i)}><Icon name="copy" size={12} /> คัดลอกไปผู้รับเงินคนอื่น</button>
                          )}
                          <button type="button" className="btn sm" onClick={() => addItem(i)}><Icon name="plus" size={12} /> เพิ่มรายการแจกแจง</button>
                        </div>
                        {(!p.items || p.items.length === 0) ? (
                          <div className="vch-items-empty muted">ยังไม่มีรายการ — กด “เพิ่มรายการแจกแจง” เช่น ค่าเบี้ยประชุม · ค่าเดินทาง · ค่าอาหาร</div>
                        ) : (
                          <table className="vch-items-tbl">
                            <thead>
                              <tr>
                                <th style={{ width: 64 }}>ลำดับ</th>
                                <th>รายการ</th>
                                <th style={{ width: 210 }}>หมวดงบประมาณ</th>
                                <th style={{ width: 170 }}>GL</th>
                                <th style={{ width: 130 }}>จำนวนเงิน</th>
                                <th style={{ width: 34 }} />
                              </tr>
                            </thead>
                            <tbody>
                              {p.items.map((it, j) => (
                                <tr key={j} className={itemIncomplete(it) ? 'is-incomplete' : undefined}>
                                  <td className="vch-items-no mono"><span className="vch-items-branch">└</span>{i + 1}.{j + 1}</td>
                                  <td><input ref={(el) => { itemRefs.current[i + '.' + j] = el; }} className="vch-cell-input" value={it.label} placeholder="รายการ เช่น ค่าเบี้ยประชุม / ค่าเดินทาง" onChange={(e) => setItem(i, j, { label: e.target.value })} /></td>
                                  <td style={{ width: 210 }}><ItemCatCell i={i} j={j} it={it} /></td>
                                  <td style={{ width: 170 }}><ItemGlCell i={i} j={j} it={it} /></td>
                                  <td style={{ width: 130 }}><input className="vch-cell-input num" type="number" inputMode="decimal" value={it.amount} placeholder="0.00"
                                             onChange={(e) => setItem(i, j, { amount: e.target.value })}
                                             onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (j === p.items.length - 1) addItem(i); else { const el = itemRefs.current[i + '.' + (j + 1)]; if (el) el.focus(); } } }} /></td>
                                  <td style={{ width: 34 }} className="center"><button className="btn sm tt-del-btn" title="ลบรายการย่อย" aria-label="ลบรายการย่อย" onClick={() => removeItem(i, j)}><Icon name="trash" size={13} /></button></td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td />
                                <td colSpan="3" className="right vch-items-suml">รวมรายการแจกแจง ({p.items.length} รายการ) = ยอดเงินของผู้รับเงินรายนี้</td>
                                <td className="right mono vch-items-sumv">{fmt.money(Number(p.amount || 0), 2)}</td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        )}
                        <div className="vch-tax-note muted" style={{ marginTop: 8 }}>
                          <Icon name="info" size={12} /> กด Enter ที่ช่องจำนวนเงินเพื่อเพิ่มแถวถัดไป · เลือก “หมวดงบประมาณ” เพื่อตัดงบและใช้ GL ของหมวดนั้น — หากไม่เลือกหมวดงบประมาณ ให้เลือกรหัสผังบัญชี (GL) เอง
                        </div>
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
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="vch-tax-note muted">
          <Icon name="info" size={12} /> กดปุ่ม “แจกแจงรายการ” ท้ายแถวผู้รับเงินเพื่อระบุ Item ของผู้รับเงินแต่ละราย พร้อมหมวดงบประมาณ/GL — ระบบรวมยอดไปที่ช่อง “ยอดเงิน” และสร้าง “รายการเบิกจ่าย” ให้อัตโนมัติ · ติ๊ก “หัก ณ ที่จ่าย” แล้วระบุอัตราภาษี (%) — รายชื่อที่ติ๊กจะไปออกหนังสือรับรองฯ แยกตามรายบุคคล
        </div>
      </V2Section>

      {/* รายการเบิกจ่าย — อ่านอย่างเดียว */}
      <V2Section title="รายการเบิกจ่าย"
                  sub="ดึงจากการแจกแจงรายการเบิกของผู้รับเงินแต่ละราย — แก้ไขรายละเอียดได้ที่ตารางผู้รับเงินด้านบน"
                  right={<span className="chip">อ่านอย่างเดียว</span>}>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th style={{ width: 46 }}>#</th>
                <th style={{ minWidth: 170 }}>ผู้รับเงิน</th>
                <th style={{ minWidth: 190 }}>หมวดงบประมาณ / ผังบัญชี</th>
                <th style={{ width: 150 }}>GL</th>
                <th style={{ minWidth: 150 }}>คำอธิบายรายการ</th>
                <th style={{ width: 120 }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {derived.length === 0 && (
                <tr><td colSpan="6" className="center muted" style={{ padding: '22px 12px' }}>
                  ยังไม่มีรายการ — แจกแจงรายการย่อยของผู้รับเงินในตารางด้านบน
                </td></tr>
              )}
              {derived.map(r => {
                const leaf = leafById(r.cat);
                return (
                  <tr key={r.key}>
                    <td className="center mono">{r.no}</td>
                    <td>{r.payeeName || <span className="muted">— ไม่ระบุชื่อ —</span>}</td>
                    <td>
                      {leaf
                        ? <><span className="mono bud-code">{leaf.code}</span> {leaf.name}</>
                        : (r.acct
                            ? <span className="mono" style={{ fontSize: 12 }}>{r.acct} · {(window.pvrAcctName ? window.pvrAcctName(r.acct) : '')}</span>
                            : <span className="muted">— ยังไม่เลือกหมวด/ผังบัญชี —</span>)}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{leaf && leaf.gl ? leaf.gl : (r.acct || '—')}</td>
                    <td>{r.desc || <span className="muted">—</span>}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(Number(r.amount || 0), 2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="5" className="right">รวมยอดเบิกจ่าย ({derived.length} รายการ)</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totals.base, 2)}</td>
              </tr>
              <tr className="vch-foot">
                <td colSpan="5" className="right">หัก ณ ที่จ่าย (จากข้อมูลผู้รับเงิน)</td>
                <td className="right mono">−{fmt.money(whtTotal, 2)}</td>
              </tr>
              <tr className="vch-foot">
                <td colSpan="5" className="right">ยอดจ่ายสุทธิ</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(netPay, 2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={"vch-balance " + (balanced ? 'ok' : 'warn')}>
          <Icon name={balanced ? 'check' : 'info'} size={14} />
          <span>ยอดผู้รับเงินรวม <b className="mono">{fmt.money(payeeTotal, 2)}</b></span>
          <span className="vch-bal-sep">เทียบกับ</span>
          <span>ยอดเบิกจ่ายที่แจกแจง <b className="mono">{fmt.money(totals.base, 2)}</b></span>
          <span className="spacer" />
          {balanced
            ? <span className="vch-bal-tag ok">ยอดบาลานซ์</span>
            : <span className="vch-bal-tag warn">ผลต่าง {fmt.money(Math.abs(balanceDiff), 2)} — โปรดตรวจสอบ</span>}
        </div>
        <div className="vch-tax-note muted">
          <Icon name="info" size={12} /> ตัดงบประมาณจากยอดของรายการที่เลือกหมวดงบประมาณ · ภาษีหัก ณ ที่จ่ายดึงจากข้อมูลผู้รับเงินรายบุคคล
        </div>
      </V2Section>

      {/* สถานะงบประมาณ */}
      <V2Section title="สถานะงบประมาณ (เรียลไทม์)"
                  sub={approved.year ? `เทียบกับงบประมาณที่อนุมัติ ปีงบประมาณ ${approved.year}` : 'ยังไม่มีปีงบประมาณที่ประกาศใช้'}>
        {budgetRows.length === 0 ? (
          <div className="muted" style={{ fontSize: 12.5, padding: '4px 2px' }}>เลือกหมวดงบประมาณในรายการย่อยของผู้รับเงิน เพื่อแสดงยอดงบคงเหลือ</div>
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
                    <th>งบอนุมัติทั้งปี</th>
                    <th>เบิกจ่ายไปแล้ว</th>
                    <th>คงเหลือเบิกได้</th>
                    <th>ใบนี้</th>
                    <th style={{ width: 110 }}>สถานะ</th>
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
      </V2Section>

      {/* วิธีการรับเงิน */}
      <V2Section title="วิธีการรับเงิน (แจกแจงตามผู้รับเงิน)"
                  sub="ดึงข้อมูลการรับเงินของผู้รับเงินแต่ละราย — เลือกวิธีรับเงิน (โอน / เช็ค / เงินสด) ได้ที่ตารางข้อมูลผู้รับเงินด้านบน">
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
                <th style={{ width: 36 }}>#</th>
                <th style={{ minWidth: 200 }}>ผู้รับเงิน</th>
                <th style={{ width: 130 }}>วิธีรับเงิน</th>
                <th style={{ minWidth: 260 }}>รายละเอียดการรับเงิน</th>
                <th style={{ width: 120 }}>ยอดเงิน</th>
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
                          <div style={{ width: 150, flex: '0 0 150px' }}>
                            <window.ThaiDateField value={p.chequeDate || ''} onChange={(v) => setPayee(i, { chequeDate: v })} />
                          </div>
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
      </V2Section>

      {/* หลักฐานและสายการอนุมัติ */}
      <V2Section title="หลักฐานและสายการอนุมัติ">
        <div className="vch-grid g2">
          <V2Field label="ไฟล์แนบ" hint="(ใบแจ้งหนี้ / ใบเสร็จ / บันทึกขออนุมัติ)" full>
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
          </V2Field>
          <V2Field label="หมายเหตุ" full>
            <input className="cfg-input" value={d.note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" onChange={(e) => set('note', e.target.value)} />
          </V2Field>
        </div>

        <div className="vch-approval">
          {[
            { k: 'ผู้จัดทำ', name: d.createdBy, need: 0 },
            { k: 'ผู้อนุมัติ', name: isSaved ? 'นายประสิทธิ์ คงทอง' : '', need: 2 },
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
      </V2Section>

      </div>

      {window.VoucherPrintSheet && <window.VoucherPrintSheet voucher={printV} />}
      {askSave && (window.DepConfirmModal
        ? <window.DepConfirmModal title={isSaved ? 'ยืนยันการบันทึกการแก้ไขใบสำคัญจ่าย' : 'ยืนยันการบันทึกใบสำคัญจ่าย'} okLabel="ยืนยันบันทึก"
            lines={[
              ['เลขที่ใบสำคัญจ่าย', isSaved ? d.id : 'ระบบจะ run เลขให้เมื่อบันทึก'],
              ['ประเภทการเบิกจ่าย', (VCH2_PAY_TYPES.find(t => t.v === d.payType) || VCH2_PAY_TYPES[0]).l],
              ['ผู้รับเงิน', payees.filter(p => p.name && Number(p.amount) > 0).length + ' คน'],
              ['จำนวนเงินสุทธิที่จ่าย', fmt.money(netPay, 2) + ' บาท'],
            ]}
            onOk={() => { const s = askSave; setAskSave(null); onSave(s.rec, s.alsoPrint); }}
            onClose={() => setAskSave(null)} />
        : (window.confirm('ยืนยันการบันทึกใบสำคัญจ่าย?') ? (() => { const s = askSave; setTimeout(() => { setAskSave(null); onSave(s.rec, s.alsoPrint); }, 0); return null; })() : (setTimeout(() => setAskSave(null), 0), null)))}
      {askDiscard && window.DepDiscardConfirm && <window.DepDiscardConfirm onKeep={() => setAskDiscard(false)} onDiscard={discardEdit} />}

      {payeeModal != null && PayeeSearch && (
        <PayeeSearch payeeType={(payees[payeeModal] || {}).type || 'vendor'}
                             onPick={pickPayee} onClose={() => setPayeeModal(null)} />
      )}
      {groupModal && GroupPick && <GroupPick groups={groupList} onPick={pickGroup} onClose={() => setGroupModal(false)} />}
      {refModal && PvrRecvSearchModal && <PvrRecvSearchModal current={refs} onApply={applyRefs} onClose={() => setRefModal(false)} />}
    </div>
  );
}

Object.assign(window, { VoucherForm, VCH2_PAY_TYPES });


// ═════════════════════════════════════════════════════════════════
//  Dropdown ที่วางรายการตรงกับช่อง — หน้าตาเหมือนช่องเดิม
//  children เป็น <option>/<optgroup> เหมือน select ปกติ
// ═════════════════════════════════════════════════════════════════
function V2Select({ value, onChange, className, style, disabled, children }) {
  // ใช้รายการเลือกมาตรฐานของระบบ — ไม่ถูกตัด/ซ้อนโดยกรอบการ์ดหรือตาราง
  return (
    <select className={className} value={value == null ? '' : value} disabled={disabled} onChange={onChange}
            style={Object.assign({ width: '100%' }, style || {})}>
      {children}
    </select>
  );
}
