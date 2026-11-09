// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญรับ — ฟอร์มสร้าง/แก้ไข (ReceiptForm)
//  หัวเอกสาร · ผู้ชำระเงิน · การรับเงิน · รายการรับเงิน (+ตัวดึงรายการค้าง)
//  · คู่บัญชีเดบิต/เครดิต (auto จาก Mapping) · สรุปยอด · แนบ · ใบเสร็จ · อนุมัติ
// ════════════════════════════════════════════════════════════════════

function RcvField({ label, hint, required, full, children }) {
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
function RcvSection({ title, sub, right, children }) {
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

// leaves (หมวดย่อยล่างสุด) พร้อมหมวดหลักสำหรับจัดกลุ่ม — ใช้ร่วมกับระบบใบสำคัญจ่าย
function rcvLeafCats(structure) {
  const out = [];
  const walk = (ns, top) => (ns || []).forEach(n => {
    const t = top || n.name;
    if (n.children && n.children.length) walk(n.children, t);
    else if (n.enabled) out.push({ id: n.id, code: n.code, name: n.name, gl: n.gl, nature: n.nature, type: n.type, top: t });
  });
  walk(structure, '');
  return out;
}
function rcvLeafGroups(leaves) {
  const order = []; const by = {};
  leaves.forEach(l => { if (!by[l.top]) { by[l.top] = []; order.push(l.top); } by[l.top].push(l); });
  return order.map(t => ({ top: t, items: by[t] }));
}

// ════════════════════════════════════════════════════════════════════
//  Popup — ค้นหาผู้ชำระเงิน (ตามประเภท)
// ════════════════════════════════════════════════════════════════════
function RcvPayerSearchModal({ payerType, onPick, onClose }) {
  const all = window.rcvPayersByType(payerType);
  const typeLabel = window.rcvPayerTypeLabel(payerType);
  const [c, setC] = useState({ code: '', name: '', dept: '' });
  const [rows, setRows] = useState(all);
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const norm = (s) => String(s ?? '').toLowerCase().replace(/\s/g, '');
  const run = () => {
    const cd = norm(c.code), nm = norm(c.name), dp = norm(c.dept);
    setRows(all.filter(p =>
      (!cd || norm(p.code).includes(cd) || norm(p.memberNo).includes(cd)) &&
      (!nm || norm(p.name).includes(nm)) &&
      (!dp || norm(p.dept).includes(dp))));
    setDirty(true);
  };
  const reset = () => { setC({ code: '', name: '', dept: '' }); setRows(all); setDirty(false); };
  const enter = (e) => e.key === 'Enter' && run();
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 900 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาผู้ชำระเงิน — {typeLabel}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid rcv-payer-grid">
            <label className="gc-sf">
              <span>1. รหัส / เลขทะเบียนสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)} onKeyDown={enter}
                     placeholder="เช่น 58241" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. ชื่อผู้ชำระเงิน</span>
              <input value={c.name} onChange={(e) => set('name', e.target.value)} onKeyDown={enter}
                     placeholder="ชื่อ-นามสกุล / ชื่อหน่วยงาน" />
            </label>
            <label className="gc-sf">
              <span>3. หน่วยงาน / สังกัด</span>
              <input value={c.dept} onChange={(e) => set('dept', e.target.value)} onKeyDown={enter}
                     placeholder="เช่น ฝ่ายบัญชี" />
            </label>
            <div className="gc-sf-actions">
              <button className="btn primary" onClick={run}>ค้นหา</button>
              <button className="btn" onClick={reset}>รีเซ็ต</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายชื่อผู้ชำระเงิน <span className="muted" style={{ fontWeight: 400 }}>· พบ {rows.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360 }}>
            <table className="tbl cs-tbl">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>รหัส</th>
                  <th>ชื่อผู้ชำระเงิน</th>
                  <th>หน่วยงาน / สังกัด</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">
                    {dirty ? 'ไม่พบผู้ชำระเงินที่ตรงกับเงื่อนไข' : 'ไม่พบข้อมูล'}
                  </td></tr>
                ) : rows.map(p => (
                  <tr key={p.id} className="clickable cs-crow" onClick={() => onPick(p)}>
                    <td className="mono">{p.code}</td>
                    <td>{p.name}</td>
                    <td className="muted">{p.dept || '—'}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }} title="เลือก"
                              onClick={(e) => { e.stopPropagation(); onPick(p); }}><Icon name="chevRight" /></button>
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
//  Popup — ดึงรายการค้างชำระจากระบบต้นทาง
// ════════════════════════════════════════════════════════════════════
function RcvPullModal({ source, payer, onApply, onClose }) {
  const memberNo = payer && payer.memberNo;
  const titleMap = {
    search: 'ค้นหารายการค้างชำระทั้งหมด', loan: 'ดึงรายการจากระบบเงินกู้',
    deposit: 'ดึงรายการจากระบบเงินฝาก', share: 'ดึงรายการจากระบบหุ้น', agent: 'ดึงรายการจากระบบลูกหนี้ตัวแทน',
  };
  // สร้างชุดรายการให้เลือก
  let items = [];
  if (source === 'loan' || source === 'search') {
    (window.RCV_LOAN_DUE || []).filter(c => !memberNo || c.memberNo === memberNo).forEach(c => {
      items.push({ key: 'loan-' + c.contractNo, kind: 'loan', title: c.contractNo + ' · ' + c.name,
        sub: 'เงินกู้ค้างชำระ — เงินต้น/ดอกเบี้ย/ค่าปรับ', total: c.parts.reduce((s, p) => s + p.due, 0), data: c });
    });
  }
  if (source === 'agent' || source === 'search') {
    (window.RCV_AGENT_DUE || []).filter(a => !payer || payer.type !== 'agent' || a.agentCode === payer.code).forEach(a => {
      items.push({ key: 'agent-' + a.ref, kind: 'agent', title: a.ref + ' · ' + a.label,
        sub: 'ลูกหนี้ตัวแทน ' + a.agentCode, total: a.outstanding, data: a });
    });
  }
  if (source === 'deposit') {
    (window.RCV_DEPOSIT_DUE || []).filter(c => !memberNo || c.memberNo === memberNo).forEach(c => {
      items.push({ key: 'dep-' + c.acctNo, kind: 'deposit', title: c.acctNo + ' · ' + c.name,
        sub: 'บัญชี' + c.kind + ' · ยอดคงเหลือ ' + fmt.money(c.balance, 0), total: 0, data: c });
    });
  }
  if (source === 'share') {
    (window.RCV_SHARE_DUE || []).filter(c => !memberNo || c.memberNo === memberNo).forEach(c => {
      items.push({ key: 'sh-' + c.memberNo, kind: 'share', title: c.memberNo + ' · ' + c.name,
        sub: c.desc, total: c.monthly, data: c });
    });
  }
  const [sel, setSel] = useState(() => new Set());
  const toggle = (k) => setSel(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const buildLines = () => {
    const out = [];
    items.filter(it => sel.has(it.key)).forEach(it => {
      const d = it.data;
      if (it.kind === 'loan') {
        d.parts.forEach(p => out.push({ recvType: p.type, srcSystem: 'loan', contractNo: d.contractNo, desc: p.desc,
          outstanding: p.outstanding, amount: p.due, discount: 0, budgetCode: '—', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: d.contractNo }));
      } else if (it.kind === 'agent') {
        const rt = /ARE|ดอกเบี้ย/.test(d.label) ? 'interest' : /CCL|ค่าธรรมเนียม/.test(d.label) ? 'fee' : 'agent';
        out.push({ recvType: rt, srcSystem: 'agent', contractNo: d.ref, desc: d.label, outstanding: d.outstanding,
          amount: d.outstanding, discount: 0, budgetCode: '—', costCenter: 'CC-02 ฝ่ายสินเชื่อ', refDoc: d.ref });
      } else if (it.kind === 'deposit') {
        out.push({ recvType: 'deposit', srcSystem: 'deposit', contractNo: d.acctNo, desc: 'รับฝากเข้าบัญชี' + d.kind,
          outstanding: 0, amount: '', discount: 0, budgetCode: '—', costCenter: 'CC-03 ฝ่ายเงินฝาก', refDoc: d.acctNo });
      } else if (it.kind === 'share') {
        out.push({ recvType: 'share', srcSystem: 'share', contractNo: '', desc: d.desc, outstanding: 0,
          amount: d.monthly, discount: 0, budgetCode: '—', costCenter: 'CC-01 ฝ่ายการเงิน', refDoc: '' });
      }
    });
    return out;
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 660 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{titleMap[source]}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {memberNo ? `กรองตามผู้ชำระเงิน ${payer.name}` : 'เลือกรายการที่ต้องการรับชำระ แล้วกดเพิ่มเข้าใบสำคัญรับ'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 12px' }}>ไม่พบรายการค้างชำระสำหรับเงื่อนไขนี้</div>
          ) : (
            <div className="vch-group-list">
              {items.map(it => (
                <button key={it.key} className={"vch-group-item" + (sel.has(it.key) ? ' sel' : '')} onClick={() => toggle(it.key)}>
                  <div className="vch-group-ico" style={sel.has(it.key) ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : null}>
                    <Icon name={sel.has(it.key) ? 'check' : 'receipt'} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="vch-group-name">{it.title}</div>
                    <div className="vch-group-meta muted">{it.sub}</div>
                  </div>
                  {it.total > 0 && <div className="mono" style={{ fontWeight: 600 }}>{fmt.money(it.total, 0)}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="muted" style={{ fontSize: 12 }}>เลือกแล้ว {sel.size} รายการ</span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!sel.size} onClick={() => onApply(buildLines())}>
            <Icon name="plus" /> เพิ่มเข้าใบสำคัญรับ
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มหลัก
// ════════════════════════════════════════════════════════════════════
function ReceiptForm({ receipt, receipts, structure, onSave, onCancel, onPrintReceipt, onPrintRv, onToast }) {
  const [d, setD] = useState(() => {
    const c = JSON.parse(JSON.stringify(receipt));
    if (!c.budget) c.budget = { mode: 'none', cats: [] };
    else if (!Array.isArray(c.budget.cats)) c.budget = { mode: c.budget.mode || 'none', cats: c.budget.catId ? [{ catId: c.budget.catId, amount: '' }] : [] };
    if (c.claimRef === undefined) c.claimRef = null;
    return c;
  });
  const [payerModal, setPayerModal] = useState(false);
  const [pullModal, setPullModal] = useState(null);   // source key
  const [claimModal, setClaimModal] = useState(false);
  const [refModal, setRefModal] = useState(false);

  const leaves = React.useMemo(() => rcvLeafCats(structure || []), [structure]);
  const leafGroups = React.useMemo(() => rcvLeafGroups(leaves), [leaves]);
  const leafById = (id) => leaves.find(l => l.id === id);
  // รหัสผังบัญชี (GL) สำหรับแถวที่ไม่เลือกหมวดงบประมาณ — เลือกจากผังบัญชีได้เอง
  const glOptions = React.useMemo(() => {
    const seen = {}; const out = [];
    leaves.forEach(l => { if (l.gl && !seen[l.gl]) { seen[l.gl] = 1; out.push({ gl: l.gl, name: l.name }); } });
    (window.RCV_ACCOUNTS || []).forEach(a => {
      const code = a.code || a.acct || a.v; const nm = a.name || a.l || '';
      if (code && !seen[code]) { seen[code] = 1; out.push({ gl: code, name: nm }); }
    });
    return out.sort((a, b) => String(a.gl).localeCompare(String(b.gl)));
  }, [leaves]);

  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  // วันที่บันทึกบัญชี → กำหนดปีบัญชี/งวดบัญชีตามรอบเดือนของวันที่นั้น
  const setPostDate = (iso) => setD(p => (iso
    ? { ...p, postDate: iso, docDate: iso, fiscalYear: window.rcvYearOf(iso), period: window.rcvPeriodOf(iso) }
    : { ...p, postDate: '' }));
  const setReceive = (patch) => setD(p => ({ ...p, receive: { ...p.receive, ...patch } }));
  const setReceipt = (patch) => setD(p => ({ ...p, receipt: { ...p.receipt, ...patch } }));
  // ── หมวดงบประมาณ (หลายหมวด + ระบุยอด) ──
  const budget = d.budget || { mode: 'none', cats: [] };
  const setBudgetMode = (mode) => setD(p => {
    const cur = p.budget || { mode: 'none', cats: [] };
    const cats = mode === 'budget' && (!cur.cats || !cur.cats.length) ? [{ catId: '', amount: '' }] : (cur.cats || []);
    return { ...p, budget: { mode, cats } };
  });
  const setBudgetCat = (i, patch) => setD(p => ({ ...p, budget: { ...p.budget, cats: p.budget.cats.map((c, idx) => idx === i ? { ...c, ...patch } : c) } }));
  const addBudgetCat = () => setD(p => ({ ...p, budget: { ...p.budget, cats: [...(p.budget.cats || []), { catId: '', amount: '' }] } }));
  const removeBudgetCat = (i) => setD(p => ({ ...p, budget: { ...p.budget, cats: p.budget.cats.filter((_, idx) => idx !== i) } }));
  const budgetAllocated = (budget.cats || []).reduce((s, c) => s + Number(c.amount || 0), 0);

  // ── ผู้ชำระเงิน ──
  const pickPayer = (p) => {
    setD(prev => ({ ...prev, payer: { ...prev.payer, payerId: p.id, code: p.code, name: p.name,
      memberNo: p.memberNo || '', dept: p.dept || '', taxId: p.taxId || '', address: p.address || '', phone: p.phone || '' } }));
    setPayerModal(false);
  };
  const setPayer = (patch) => setD(p => ({ ...p, payer: { ...p.payer, ...patch } }));

  // ── รายการรับเงิน ──
  const lines = d.lines || [];
  const setLine = (i, patch) => setD(p => ({ ...p, lines: p.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));
  const addLine = () => setD(p => ({ ...p, lines: [...p.lines, { recvType: 'other', srcSystem: 'income', contractNo: '', desc: '', outstanding: 0, amount: '', discount: 0, budgetCat: (p.budget && p.budget.mode === 'budget' && p.budget.cats && p.budget.cats[0]) ? (p.budget.cats[0].catId || '') : '', budgetCode: '—', costCenter: 'CC-01 ฝ่ายการเงิน', refDoc: '' }] }));
  const removeLine = (i) => setD(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));
  const applyPulled = (newLines) => {
    setD(prev => {
      const existing = (prev.lines || []).filter(l => l.desc || Number(l.amount) || l.contractNo);
      return { ...prev, lines: [...existing, ...newLines] };
    });
    setPullModal(null);
    onToast && onToast(`ดึงรายการ ${newLines.length} รายการเข้าใบสำคัญรับแล้ว`);
  };

  // ── อ้างอิงทะเบียนขอสินไหม ──
  const pickClaim = (c) => {
    setD(prev => {
      const existing = (prev.lines || []).filter(l => l.desc || Number(l.amount) || l.contractNo);
      const claimLine = {
        recvType: 'claim', srcSystem: 'claim', contractNo: c.claimNo,
        desc: `รับเงินสินไหม ${c.claimNo} — สมาชิก ${c.memberCode} (${c.memberName})`,
        outstanding: c.actual || 0, amount: c.actual || 0, discount: 0,
        budgetCat: '', budgetCode: '—', costCenter: 'CC-01 ฝ่ายการเงิน', refDoc: c.claimNo, claimNo: c.claimNo,
      };
      return {
        ...prev,
        docType: 'claim',
        refNo: c.claimNo,
        headerNote: prev.headerNote || `รับเงินค่าสินไหมจากบริษัทประกัน — สมาชิก ${c.memberCode}`,
        budget: prev.budget && prev.budget.mode === 'budget' ? prev.budget : { mode: 'none', cats: [] },
        claimRef: {
          claimNo: c.claimNo, memberCode: c.memberCode, memberName: c.memberName,
          company: c.company, policyNo: c.policyNo, estimate: c.estimate, actual: c.actual, offsetTotal: c.offsetTotal,
        },
        payer: { ...prev.payer, type: 'org', name: c.company, code: '', memberNo: c.memberCode, dept: 'ฝ่ายสินไหม', payerId: '' },
        lines: [...existing, claimLine],
      };
    });
    setClaimModal(false);
    onToast && onToast(`อ้างอิงคำขอสินไหม ${c.claimNo} — ตั้งยอดรับ ${fmt.money(c.actual || 0, 2)} บาท`);
  };
  const clearClaim = () => { setD(p => ({ ...p, claimRef: null })); onToast && onToast('ยกเลิกการอ้างอิงคำขอสินไหมแล้ว'); };

  // ── ยอดรวม ── (จำนวนเงินรับรวม กรอก/แก้ไขได้ — ถ้าเว้นว่างจะคำนวณจากรายการรับเงิน)
  const computedGross = window.rcvSumReceived(lines);
  const grossManual = d.receive.grossAmount;
  const gross = (grossManual !== '' && grossManual != null) ? Number(grossManual) : computedGross;
  const fee = Number(d.receive.bankFee || 0);
  const net = gross - fee;
  const outstandingAfter = window.rcvOutstandingAfter(lines);
  const overPaid = window.rcvOverPaid(lines);

  // ── คู่บัญชีเดบิต/เครดิต ──
  const entries = d.entries || [];
  const setEntry = (i, patch) => setD(p => ({ ...p, entries: p.entries.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));
  const addEntry = () => setD(p => ({ ...p, entries: [...(p.entries || []), { acct: '', desc: '', debit: 0, credit: 0, src: '', cc: d.dept || '' }] }));
  const removeEntry = (i) => setD(p => ({ ...p, entries: p.entries.filter((_, idx) => idx !== i) }));
  const regenEntries = (silent) => {
    setD(p => ({ ...p, entries: window.rcvBuildEntries(p) }));
    if (!silent) onToast && onToast('สร้างคู่บัญชีเดบิต/เครดิตจาก Mapping เรียบร้อยแล้ว');
  };
  React.useEffect(() => {
    if (!d.entries || d.entries.length === 0) {
      const gen = window.rcvBuildEntries(d);
      if (gen.length) setD(p => ({ ...p, entries: gen }));
    }
  }, []); // eslint-disable-line

  const eTotals = window.rcvEntryTotals(entries);
  const diff = eTotals.debit - eTotals.credit;
  const balanced = Math.abs(diff) < 0.005 && (eTotals.debit > 0 || eTotals.credit > 0);

  // ── ไฟล์แนบ ──
  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setD(p => ({ ...p, files: [...(p.files || []), ...files.map(f => ({
      name: f.name, type: window.RCV_FILE_TYPES[0], size: (f.size / 1024).toFixed(0) + ' KB',
      date: new Date().toISOString().slice(0, 10), by: d.createdBy })) ] }));
    e.target.value = '';
  };
  const setFile = (i, patch) => setD(p => ({ ...p, files: p.files.map((f, idx) => idx === i ? { ...f, ...patch } : f) }));
  const removeFile = (i) => setD(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }));

  // ── ตรวจสอบยอด ──
  const checkBalance = () => {
    const gen = window.rcvBuildEntries(d);
    setD(p => ({ ...p, entries: gen }));
    const t = window.rcvEntryTotals(gen);
    if (gross <= 0) { onToast && onToast('ยังไม่มีรายการรับเงิน — กรุณาเพิ่มอย่างน้อย 1 รายการ'); return; }
    if (Math.abs(t.debit - t.credit) < 0.005) onToast && onToast(`ยอดสมดุล ✓ เดบิต = เครดิต = ${fmt.money(t.debit, 2)} บาท`);
    else onToast && onToast(`ยอดไม่สมดุล — ผลต่าง ${fmt.money(Math.abs(t.debit - t.credit), 2)} บาท`);
  };

  // ── ใบเสร็จ ──
  const issueReceipt = () => {
    const no = d.receipt.no || window.rcvNextReceiptNo(receipts, d.docDate);
    setReceipt({ issue: true, no, date: d.receipt.date || d.docDate, status: 'issued',
      name: d.receipt.name || d.payer.name, address: d.receipt.address || d.payer.address });
    onToast && onToast(`ออกใบเสร็จรับเงินเลขที่ ${no} เรียบร้อยแล้ว`);
  };
  const cancelReceipt = () => { setReceipt({ status: 'cancelled' }); onToast && onToast('ยกเลิกใบเสร็จแล้ว — ต้องระบุเหตุผลในหมายเหตุ'); };

  const validAndSave = (alsoPrint) => {
    if (!d.payer.name) { onToast && onToast('กรุณาระบุผู้ชำระเงิน'); return; }
    if (!d.receive.coopAccount) { onToast && onToast('กรุณาเลือกบัญชีรับเงิน'); return; }
    if (!lines.some(l => Number(l.amount) > 0)) { onToast && onToast('กรุณาเพิ่มรายการรับเงินอย่างน้อย 1 รายการ พร้อมจำนวนเงิน'); return; }
    const gen = (d.entries && d.entries.length) ? d.entries : window.rcvBuildEntries(d);
    onSave({ ...d, entries: gen }, alsoPrint);
  };

  const st = window.RCV_STATUS[d.status] || window.RCV_STATUS.draft;
  const showBankFields = d.receive.method !== 'cash';
  const showCheque = d.receive.method === 'cheque';
  const periodOpts = window.rcvPeriodOptions(d.docDate);
  const isNewDoc = !(receipts || []).some(r => r.id === receipt.id);
  const receiptIssued = d.receipt.status === 'issued';
  const [editing, setEditing] = useState(isNewDoc && !receiptIssued);
  const d0 = React.useRef(null);
  if (d0.current === null) d0.current = JSON.stringify(d);
  const [askDiscard, setAskDiscard] = useState(false);
  const discardEdit = () => {
    setAskDiscard(false);
    if (isNewDoc) { onCancel && onCancel(); return; }
    setD(JSON.parse(d0.current)); setEditing(false);
  };
  const cancelEdit = () => { if (JSON.stringify(d) !== d0.current) setAskDiscard(true); else discardEdit(); };
  const rcpStatusLabel = { none: 'ยังไม่ออก', issued: 'ออกแล้ว', cancelled: 'ยกเลิก' }[d.receipt.status] || 'ยังไม่ออก';
  const rcpPill = { none: 'neutral', issued: 'ok', cancelled: 'bad' }[d.receipt.status] || 'neutral';

  return (
    <div data-screen-label="หน้าสร้าง/แก้ไขใบสำคัญรับ">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="mono" style={{ fontWeight: 600, marginLeft: 4 }}>{d.id}</span>
        <span className={"pill " + st.pill}>{st.l}</span>
        <span className="spacer" />
        {!editing && receiptIssued && (
          <span className="muted" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="lock" size={12} /> ออกใบเสร็จแล้ว — แก้ไขไม่ได้
          </span>
        )}
        <button className="btn sm" data-keep-top="" onClick={checkBalance}><Icon name="check" /> ตรวจสอบยอด</button>
        {!editing && onPrintRv && (
          <button className="btn sm" data-keep-top="" onClick={() => onPrintRv(d)}><Icon name="print" /> พิมพ์</button>
        )}
        {!editing && !receiptIssued && (
          <button className="btn primary sm" data-keep-top="" onClick={() => { d0.current = JSON.stringify(d); setEditing(true); }}><Icon name="edit" /> แก้ไข</button>
        )}
        {editing && <>
          <button className="btn sm" data-keep-top="" onClick={cancelEdit}>ยกเลิก</button>
          <button className="btn primary sm" data-keep-top="" onClick={() => validAndSave(false)}><Icon name="check" /> บันทึกใบสำคัญรับ</button>
        </>}
      </div>
      {askDiscard && window.DepDiscardConfirm && <window.DepDiscardConfirm onKeep={() => setAskDiscard(false)} onDiscard={discardEdit} />}

      <fieldset disabled={!editing} className={'rcv-form' + (editing ? '' : ' rcv-lock')}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

      {/* 1 — ข้อมูลใบสำคัญรับ */}
      <RcvSection title="ข้อมูลใบสำคัญรับ" sub="หัวเอกสารใบสำคัญรับ — ปี/งวดบัญชี ต้องอยู่ในงวดที่เปิดใช้งาน">
        <div className="vch-grid g4">
          <RcvField label="เลขที่ใบสำคัญรับ" hint="(อัตโนมัติ)"><input className="cfg-input mono" value={d.id} readOnly /></RcvField>
          <RcvField label="วันที่บันทึกบัญชี" required>
            <RcvThaiDate value={d.postDate} onChange={setPostDate} /></RcvField>
          <RcvField label="ผู้บันทึก" hint="(จาก Login)"><input className="cfg-input" value={d.createdBy} readOnly /></RcvField>
          <RcvField label="ปีบัญชี" hint="(ตามวันที่บันทึกบัญชี)">
            <input className="cfg-input mono" value={d.fiscalYear || '—'} readOnly /></RcvField>
          <RcvField label="งวดบัญชี" hint="(รอบเดือนของวันที่บันทึกบัญชี)">
            <input className="cfg-input mono" value={d.period || '—'} readOnly /></RcvField>
          <RcvField label="ประเภทใบสำคัญรับ" required>
            {d.docType === '__other' ? (
              <div style={{ display: 'flex', gap: 4 }}>
                <input className="cfg-input" autoFocus value={d.docTypeOther || ''} style={{ flex: 1, minWidth: 0 }}
                       placeholder="ระบุประเภทใบสำคัญรับ" onChange={(e) => set('docTypeOther', e.target.value)} />
                <button className="bud-act" type="button" title="เลือกจากรายการ"
                        onClick={() => setD(p => ({ ...p, docType: window.RCV_DOC_TYPES[0].v, docTypeOther: '' }))}>
                  <Icon name="unordered-list" size={13} />
                </button>
              </div>
            ) : (
              <RcvSelect className="cfg-input" value={d.docType} onChange={(e) => set('docType', e.target.value)}>
                {window.RCV_DOC_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                <option value="__other">อื่น ๆ (ระบุ)</option>
              </RcvSelect>
            )}</RcvField>
          <RcvField label="แผนก / หน่วยงาน" required>
            <RcvSelect className="cfg-input" value={d.dept} onChange={(e) => set('dept', e.target.value)}>
              {window.RCV_DEPTS.map(x => <option key={x} value={x}>{x}</option>)}
            </RcvSelect></RcvField>
          <RcvField label="เลขที่เอกสารอ้างอิง" hint="(ค้นหาจากระบบได้)">
            <div className="vch-pick">
              <input className="cfg-input" style={{ paddingRight: 32 }} value={d.refNo} placeholder="พิมพ์หรือค้นหาจากระบบ" onChange={(e) => set('refNo', e.target.value)} />
              <button type="button" className="vch-pick-btn" title="ค้นหาเอกสารอ้างอิงจากระบบ" onClick={() => setRefModal(true)}><Icon name="search" size={13} /></button>
            </div></RcvField>
          <RcvField label="หมายเหตุหัวเอกสาร" full>
            <input className="cfg-input" value={d.headerNote} placeholder="ไม่บังคับ" onChange={(e) => set('headerNote', e.target.value)} /></RcvField>
        </div>
      </RcvSection>

      {/* 2 — ข้อมูลผู้ชำระเงิน */}
      <RcvSection title="ข้อมูลผู้ชำระเงิน" sub="ระบุที่มาของเงินที่รับเข้า — ค้นหาจากทะเบียนสมาชิก/ตัวแทน/ลูกหนี้"
                  right={<button className="btn sm" onClick={() => setPayerModal(true)}><Icon name="search" /> ค้นหาผู้ชำระเงิน</button>}>
        <div className="vch-grid g4">
          <RcvField label="ประเภทผู้ชำระเงิน" required>
            <RcvSelect className="cfg-input" value={d.payer.type}
                    onChange={(e) => setPayer({ type: e.target.value, payerId: '', code: '', name: '', memberNo: '', dept: '', taxId: '', address: '', phone: '' })}>
              {window.RCV_PAYER_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </RcvSelect></RcvField>
          <RcvField label="เลขสมาชิก / รหัสผู้ชำระเงิน" required>
            <div className="vch-pick" onClick={() => setPayerModal(true)}>
              <input className="cfg-input vch-clickable mono" readOnly
                     value={d.payer.name ? `${d.payer.memberNo || d.payer.code || ''}${(d.payer.memberNo || d.payer.code) ? ' · ' : ''}${d.payer.name}` : ''}
                     placeholder="คลิกเพื่อค้นหา" />
              <Icon name="search" size={13} />
            </div></RcvField>
          <RcvField label="หน่วยงาน / สังกัด">
            <input className="cfg-input" value={d.payer.dept} placeholder="—" onChange={(e) => setPayer({ dept: e.target.value })} /></RcvField>
          <RcvField label="เลขบัตร ปชช. / ผู้เสียภาษี">
            <input className="cfg-input mono" value={d.payer.taxId} placeholder="—" onChange={(e) => setPayer({ taxId: e.target.value })} /></RcvField>
          <RcvField label="เบอร์โทรศัพท์">
            <input className="cfg-input" value={d.payer.phone} placeholder="—" onChange={(e) => setPayer({ phone: e.target.value })} /></RcvField>
          <div className="vch-field" style={{ gridColumn: 'span 3' }}>
            <label className="vch-label">ที่อยู่</label>
            <input className="cfg-input" value={d.payer.address} placeholder="—" onChange={(e) => setPayer({ address: e.target.value })} />
          </div>
        </div>
      </RcvSection>

      {/* 4 — รายละเอียดรายการรับเงิน */}
      <RcvSection title="รายละเอียดรายการรับเงิน"
                  sub="เพิ่มได้หลายรายการในใบเดียว — เลือกหมวดงบประมาณระดับหมวดย่อย (ระบบดึงรหัสผังบัญชี GL ให้อัตโนมัติ) และดึงรายการค้างชำระจากระบบต้นทางได้โดยตรง"
                  right={<button className="btn primary sm" onClick={addLine}><Icon name="plus" /> เพิ่มรายการ</button>}>
        <div className="rcv-pull-bar">
          <button className="btn sm dashed" onClick={() => setPullModal('search')}><Icon name="search" /> ค้นหารายการค้างชำระ</button>
          <button className="btn sm" onClick={() => setPullModal('loan')}>ดึงจากระบบเงินกู้</button>
          <button className="btn sm" onClick={() => setPullModal('deposit')}>ดึงจากระบบเงินฝาก</button>
          <button className="btn sm" onClick={() => setPullModal('share')}>ดึงจากระบบหุ้น</button>
          <button className="btn sm" onClick={() => setPullModal('agent')}>ดึงจากลูกหนี้ตัวแทน</button>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm text" onClick={() => onToast && onToast('นำเข้า Excel — รองรับไฟล์ .xlsx ตามเทมเพลตรายการรับเงิน')}><Icon name="download" /> นำเข้า Excel</button>
        </div>
        <div className="table-wrap rcv-lines-wrap" style={{ border: 0, overflowX: 'auto', maxWidth: '100%' }}>
          <table className="tbl vch-grid-tbl rcv-lines-tbl" style={{ minWidth: 1180, width: '100%' }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }}>#</th>
                <th style={{ width: 130 }}>ประเภทรายการรับ</th>
                <th style={{ width: 116 }}>ระบบต้นทาง</th>
                <th style={{ width: 130 }}>เลขสัญญา / บัญชี</th>
                <th style={{ minWidth: 170 }}>รายละเอียด</th>
                <th style={{ minWidth: 200 }}>หมวดงบประมาณ (หมวดย่อย)</th>
                <th style={{ width: 120 }}>GL</th>
                <th className="right" style={{ width: 110 }}>ยอดค้างก่อนชำระ</th>
                <th className="right" style={{ width: 110 }}>จำนวนเงินที่รับ</th>
                <th className="right" style={{ width: 92 }}>ส่วนลด/ปรับ</th>
                <th className="right" style={{ width: 110 }}>คงเหลือหลังชำระ</th>
                <th className="center" style={{ width: 96 }}>สถานะ</th>
                <th className="center" style={{ width: 84 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan="13" className="center muted" style={{ padding: '22px 12px' }}>ยังไม่มีรายการ — กด “เพิ่มรายการ” หรือดึงรายการค้างชำระ</td></tr>
              )}
              {lines.map((l, i) => {
                const stt = window.rcvLineStatus(l);
                const remain = window.rcvLineRemain(l);
                const leaf = leafById(l.budgetCat);
                return (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <RcvSelect className="vch-cell-input" value={l.recvType} onChange={(e) => setLine(i, { recvType: e.target.value })}>
                        {window.RCV_LINE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </RcvSelect></td>
                    <td>
                      <RcvSelect className="vch-cell-input" value={l.srcSystem} onChange={(e) => setLine(i, { srcSystem: e.target.value })}>
                        {window.RCV_SOURCES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                      </RcvSelect></td>
                    <td><input className="vch-cell-input mono" value={l.contractNo} placeholder="—" onChange={(e) => setLine(i, { contractNo: e.target.value })} /></td>
                    <td><input className="vch-cell-input" value={l.desc} placeholder="คำอธิบายรายการ" onChange={(e) => setLine(i, { desc: e.target.value })} /></td>
                    <td>
                      <RcvSelect className="vch-cell-input" value={l.budgetCat || ''} onChange={(e) => setLine(i, { budgetCat: e.target.value })}>
                        <option value="">— ไม่เลือกหมวดงบประมาณ —</option>
                        {leafGroups.map(g => (
                          <optgroup key={g.top} label={g.top}>
                            {g.items.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                          </optgroup>
                        ))}
                      </RcvSelect></td>
                    <td>
                      {leaf && leaf.gl
                        ? <span className="mono" style={{ fontSize: 12 }}>{leaf.gl}</span>
                        : (
                          <RcvSelect className="vch-cell-input mono" value={l.glManual || ''} onChange={(e) => setLine(i, { glManual: e.target.value })}>
                            <option value="">— เลือก GL —</option>
                            {glOptions.map(g => <option key={g.gl} value={g.gl}>{g.gl} · {g.name}</option>)}
                          </RcvSelect>
                        )}
                    </td>
                    <td><input className="vch-cell-input num" type="number" value={l.outstanding} placeholder="0.00" onChange={(e) => setLine(i, { outstanding: e.target.value })} /></td>
                    <td><input className="vch-cell-input num" type="number" value={l.amount} placeholder="0.00" onChange={(e) => setLine(i, { amount: e.target.value })} /></td>
                    <td><input className="vch-cell-input num" type="number" value={l.discount} placeholder="0" onChange={(e) => setLine(i, { discount: e.target.value })} /></td>
                    <td className="right mono vch-net">{Number(l.outstanding) > 0 ? fmt.money(remain, 2) : '—'}</td>
                    <td className="center"><span className={"pill " + stt.pill}>{stt.l}</span></td>
                    <td className="center"><button className="btn sm tt-del-btn" title="ลบรายการ" aria-label="ลบรายการ" onClick={() => removeLine(i)}><Icon name="trash" size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="8" className="right">รวมยอดรับเงิน ({lines.length} รายการ)</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(gross, 2)}</td>
                <td colSpan="4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </RcvSection>

      {/* 3 — ข้อมูลการรับเงิน */}
      <RcvSection title="ข้อมูลการรับเงิน" sub="วิธีที่สหกรณ์ได้รับเงิน และบัญชีปลายทางที่รับเข้า">
        <div className="vch-grid g4">
          <RcvField label="วิธีรับเงิน" required>
            <RcvSelect className="cfg-input" value={d.receive.method}
                    onChange={(e) => setReceive({ method: e.target.value })}>
              {window.RCV_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </RcvSelect></RcvField>
          <RcvField label="วันที่รับเงินจริง" required>
            <RcvThaiDate value={d.receive.receiveDate} onChange={(v) => setReceive({ receiveDate: v })} /></RcvField>
          <RcvField label="บัญชีรับเงิน" required>
            <RcvSelect className="cfg-input" value={d.receive.coopAccount} onChange={(e) => setReceive({ coopAccount: e.target.value })}>
              <option value="">— เลือกบัญชีรับเงิน —</option>
              {window.RCV_COOP_ACCOUNTS.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
            </RcvSelect></RcvField>
          {showBankFields && (
            <>
              <RcvField label="ธนาคาร" hint="(ผู้โอน/ผู้ออกเช็ค)">
                <RcvSelect className="cfg-input" value={d.receive.bank} onChange={(e) => setReceive({ bank: e.target.value })}>
                  <option value="">— เลือก —</option>
                  {window.RCV_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </RcvSelect></RcvField>
              <RcvField label="เลขที่อ้างอิงการโอน" hint="(Ref / Txn ID)">
                <input className="cfg-input mono" value={d.receive.transferRef} placeholder="—" onChange={(e) => setReceive({ transferRef: e.target.value })} /></RcvField>
            </>
          )}
          {showCheque && (
            <>
              <RcvField label="เลขที่เช็ค"><input className="cfg-input mono" value={d.receive.chequeNo} onChange={(e) => setReceive({ chequeNo: e.target.value })} /></RcvField>
              <RcvField label="วันที่เช็ค"><RcvThaiDate value={d.receive.chequeDate} onChange={(v) => setReceive({ chequeDate: v })} /></RcvField>
              <RcvField label="ธนาคารผู้ออกเช็ค">
                <RcvSelect className="cfg-input" value={d.receive.chequeBank} onChange={(e) => setReceive({ chequeBank: e.target.value })}>
                  <option value="">— เลือก —</option>
                  {window.RCV_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </RcvSelect></RcvField>
            </>
          )}
          <RcvField label="จำนวนเงินรับรวม" hint="(กรอก/แก้ไขได้)">
            <input className="cfg-input mono num" type="number" inputMode="decimal"
                   value={grossManual != null ? grossManual : ''}
                   placeholder={fmt.money(computedGross, 2)}
                   onChange={(e) => setReceive({ grossAmount: e.target.value })} />
            <span className="vch-hint" style={{ display: 'block', marginTop: 3 }}>คำนวณจากรายการ {fmt.money(computedGross, 2)} — เว้นว่างเพื่อใช้ยอดอัตโนมัติ</span></RcvField>
          <RcvField label="ค่าธรรมเนียมธนาคาร">
            <input className="cfg-input mono num" type="number" value={d.receive.bankFee} placeholder="0.00" onChange={(e) => setReceive({ bankFee: e.target.value })} /></RcvField>
          <RcvField label="ยอดเงินสุทธิ" hint="(รับรวม − ค่าธรรมเนียม)">
            <input className="cfg-input mono num" value={fmt.money(net, 2)} readOnly style={{ fontWeight: 600 }} /></RcvField>
        </div>
      </RcvSection>

      {/* 5 — รายการบัญชี เดบิต/เครดิต */}
      <RcvSection title="รายการบัญชี เดบิต / เครดิต"
                  sub="ระบบสร้างคู่บัญชีอัตโนมัติจาก Mapping — ผู้มีสิทธิ์ตรวจสอบ/แก้ไขได้"
                  right={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn sm" onClick={() => regenEntries(false)}><Icon name="refresh" /> สร้างจาก Mapping</button>
                      <button className="btn sm dashed" onClick={addEntry}><Icon name="plus" /> เพิ่มแถว</button>
                    </div>
                  }>
        <div className="table-wrap rcv-lines-wrap" style={{ border: 0, overflowX: 'auto', maxWidth: '100%' }}>
          <table className="tbl vch-grid-tbl rcv-lines-tbl" style={{ minWidth: 940, width: '100%' }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 34 }}>#</th>
                <th style={{ width: 96 }}>รหัสบัญชี</th>
                <th style={{ minWidth: 190 }}>ชื่อบัญชี</th>
                <th style={{ minWidth: 150 }}>คำอธิบาย</th>
                <th className="right" style={{ width: 120 }}>เดบิต</th>
                <th className="right" style={{ width: 120 }}>เครดิต</th>
                <th style={{ width: 150 }}>ศูนย์ต้นทุน</th>
                <th className="center" style={{ width: 84 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan="8" className="center muted" style={{ padding: '22px 12px' }}>ยังไม่มีคู่บัญชี — กด “สร้างจาก Mapping”</td></tr>
              )}
              {entries.map((e, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td><input className="vch-cell-input mono" value={e.acct} placeholder="—" onChange={(ev) => setEntry(i, { acct: ev.target.value })} /></td>
                  <td className="mono" style={{ fontSize: 12 }}>{window.rcvAcctName(e.acct) || <span className="muted">— ไม่พบในผังบัญชี —</span>}</td>
                  <td><input className="vch-cell-input" value={e.desc} placeholder="คำอธิบาย" onChange={(ev) => setEntry(i, { desc: ev.target.value })} /></td>
                  <td><input className="vch-cell-input num" type="number" value={e.debit || ''} placeholder="0.00" onChange={(ev) => setEntry(i, { debit: Number(ev.target.value || 0) })} /></td>
                  <td><input className="vch-cell-input num" type="number" value={e.credit || ''} placeholder="0.00" onChange={(ev) => setEntry(i, { credit: Number(ev.target.value || 0) })} /></td>
                  <td>
                    <RcvSelect className="vch-cell-input" value={e.cc || ''} onChange={(ev) => setEntry(i, { cc: ev.target.value })}>
                      <option value="">—</option>
                      {window.RCV_COST_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </RcvSelect></td>
                  <td className="center"><button className="btn sm tt-del-btn" title="ลบรายการบัญชี" aria-label="ลบรายการบัญชี" onClick={() => removeEntry(i)}><Icon name="trash" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="4" className="right">รวม</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(eTotals.debit, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(eTotals.credit, 2)}</td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className={"vch-balance " + (balanced ? 'ok' : 'warn')}>
          <Icon name={balanced ? 'check' : 'info'} size={14} />
          <span>รวมเดบิต <b className="mono">{fmt.money(eTotals.debit, 2)}</b></span>
          <span className="vch-bal-sep">เทียบกับ</span>
          <span>รวมเครดิต <b className="mono">{fmt.money(eTotals.credit, 2)}</b></span>
          <span className="spacer" />
          {balanced ? <span className="vch-bal-tag ok">สมดุล</span>
            : <span className="vch-bal-tag warn">ผลต่าง {fmt.money(Math.abs(diff), 2)} — ไม่สมดุล</span>}
        </div>
      </RcvSection>

      {/* 9 — สรุปยอด */}
      <RcvSection title="สรุปยอดก่อนบันทึก">
        <div className="rcv-summary-grid">
          <div className="rcv-sum-item"><span className="k">รวมยอดรับเงิน</span><span className="v mono">{fmt.money(gross, 2)}</span></div>
          <div className="rcv-sum-item"><span className="k">รวมค่าธรรมเนียม</span><span className="v mono">{fmt.money(fee, 2)}</span></div>
          <div className="rcv-sum-item accent"><span className="k">ยอดสุทธิรับเข้า</span><span className="v mono">{fmt.money(net, 2)}</span></div>
          <div className="rcv-sum-item"><span className="k">รวมเดบิต</span><span className="v mono">{fmt.money(eTotals.debit, 2)}</span></div>
          <div className="rcv-sum-item"><span className="k">รวมเครดิต</span><span className="v mono">{fmt.money(eTotals.credit, 2)}</span></div>
          <div className={"rcv-sum-item " + (balanced ? 'ok' : 'bad')}><span className="k">สถานะสมดุล</span>
            <span className="v">{balanced ? 'สมดุล ✓' : `ไม่สมดุล (${fmt.money(Math.abs(diff), 2)})`}</span></div>
          <div className="rcv-sum-item"><span className="k">ยอดคงค้างหลังชำระ</span><span className="v mono">{fmt.money(outstandingAfter, 2)}</span></div>
          <div className={"rcv-sum-item" + (overPaid > 0 ? ' warn' : '')}><span className="k">ยอดรับเกิน</span><span className="v mono">{fmt.money(overPaid, 2)}</span></div>
        </div>
      </RcvSection>

      {/* 10 — เอกสารแนบ */}
      <RcvSection title="เอกสารแนบ" sub="สลิปโอนเงิน / Statement / ใบแจ้งหนี้ / หนังสือแจ้งหักเงินเดือน"
                  right={<label className="btn sm"><Icon name="attach" /> แนบไฟล์
                    <input type="file" multiple accept="image/*,.pdf,.xlsx" style={{ display: 'none' }} onChange={onFiles} /></label>}>
        {(d.files || []).length === 0 ? (
          <div className="muted" style={{ fontSize: 12.5, padding: '4px 2px' }}>ยังไม่มีเอกสารแนบ — รองรับ PDF, JPG, PNG, XLSX</div>
        ) : (
          <div className="table-wrap rcv-lines-wrap" style={{ border: 0, overflowX: 'auto', maxWidth: '100%' }}>
            <table className="tbl rcv-lines-tbl rcv-docs-tbl" style={{ minWidth: 760, width: '100%' }}>
              <thead><tr><th>ชื่อไฟล์</th><th style={{ width: 200 }}>ประเภทเอกสาร</th><th style={{ width: 80 }}>ขนาด</th><th style={{ width: 110 }}>วันที่อัปโหลด</th><th style={{ width: 140 }}>ผู้อัปโหลด</th><th className="center" style={{ width: 100 }}>จัดการ</th></tr></thead>
              <tbody>
                {d.files.map((f, i) => (
                  <tr key={i}>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="attach" size={12} /> {f.name}</span></td>
                    <td>
                      <RcvSelect className="vch-cell-input" value={f.type} onChange={(e) => setFile(i, { type: e.target.value })}>
                        {window.RCV_FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </RcvSelect></td>
                    <td className="mono" style={{ fontSize: 12 }}>{f.size}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(f.date)}</td>
                    <td style={{ fontSize: 12 }}>{f.by}</td>
                    <td className="center">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn sm rcv-dl-btn" title="ดาวน์โหลด" onClick={() => onToast && onToast('ดาวน์โหลด ' + f.name)}><Icon name="download" size={13} /></button>
                        <button className="btn sm tt-del-btn" title="ลบไฟล์" onClick={() => removeFile(i)}><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RcvSection>

      </fieldset>

      {payerModal && <RcvPayerSearchModal payerType={d.payer.type} onPick={pickPayer} onClose={() => setPayerModal(false)} />}
      {pullModal && <RcvPullModal source={pullModal} payer={d.payer} onApply={applyPulled} onClose={() => setPullModal(null)} />}
      {claimModal && <RcvClaimSearchModal onPick={pickClaim} onClose={() => setClaimModal(false)} />}
      {refModal && <RcvRefDocModal current={d.refNo} onPick={(doc) => { setD(p => ({ ...p, refNo: doc.id, headerNote: p.headerNote || doc.note || '' })); setRefModal(false); onToast && onToast(`เลือกเอกสารอ้างอิง ${doc.id}`); }} onClose={() => setRefModal(false)} />}
    </div>
  );
}

Object.assign(window, { ReceiptForm });


// ═════════════════════════════════════════════════════════════════
//  ตัวเลือกวันที่แบบไทย (พ.ศ.) — ใช้กับวันที่บันทึกบัญชี
// ═════════════════════════════════════════════════════════════════
const RCV_TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const RCV_TH_DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];
function rcvIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function rcvThDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + (d.getFullYear() + 543);
}
function RcvThaiDate({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(() => { const b = value ? new Date(value) : new Date(); return new Date(b.getFullYear(), b.getMonth(), 1); });
  const wrap = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  React.useEffect(() => { if (value) { const b = new Date(value); if (!isNaN(b.getTime())) setCur(new Date(b.getFullYear(), b.getMonth(), 1)); } }, [value]);

  const y = cur.getFullYear(), m = cur.getMonth();
  const lead = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let i = 1; i <= days; i++) cells.push(i);
  const todayIso = rcvIso(new Date());
  const pick = (day) => { onChange(rcvIso(new Date(y, m, day))); setOpen(false); };
  const nav = { flex: '0 0 20px', width: 20, height: 22, display: 'grid', placeItems: 'center', border: 0, background: 'transparent',
                color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14, lineHeight: 1, borderRadius: 2, padding: 0 };
  const headSel = { appearance: 'none', width: '100%', minWidth: 0, border: '1px solid var(--border-strong)', borderRadius: 2,
                    background: '#fff', font: 'inherit', fontSize: 12.5, color: 'var(--text)', padding: '2px 13px 2px 5px', cursor: 'pointer' };
  const years = [];
  for (let i = y - 6; i <= y + 6; i++) years.push(i);

  return (
    <div ref={wrap} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input className="cfg-input mono" readOnly value={rcvThDisplay(value)} placeholder={placeholder || 'วว/ดด/ปปปป'}
               onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', paddingRight: 30 }} />
        <button type="button" onClick={() => setOpen(o => !o)} aria-label="เลือกวันที่"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent',
                         cursor: 'pointer', color: 'var(--text-faint)', display: 'grid', placeItems: 'center', padding: 0 }}>
          <Icon name="calendar" size={14} />
        </button>
      </div>
      {open && (
        <div style={{ position: 'absolute', zIndex: 4000, top: 'calc(100% + 4px)', left: 0, width: '100%', minWidth: 186, boxSizing: 'border-box',
                      padding: '8px 8px 4px', background: 'var(--surface-card, #fff)', border: '1px solid var(--border-strong)',
                      borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, paddingBottom: 6 }}>
            <button type="button" style={nav} onClick={() => setCur(new Date(y, m - 1, 1))} aria-label="เดือนก่อนหน้า">‹</button>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center', gap: 4 }}>
              <div style={{ position: 'relative', display: 'grid', flex: '1 1 auto', minWidth: 0 }}>
                <select style={headSel} value={m} onChange={(e) => setCur(new Date(y, Number(e.target.value), 1))}>
                  {RCV_TH_MONTHS.map((nm, i) => <option key={nm} value={i}>{nm}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
                               color: 'var(--text-faint)', fontSize: 8 }}>▾</span>
              </div>
              <div style={{ position: 'relative', display: 'grid', flex: '0 1 62px', minWidth: 0 }}>
                <select style={headSel} value={y} onChange={(e) => setCur(new Date(Number(e.target.value), m, 1))}>
                  {years.map(yy => <option key={yy} value={yy}>{yy + 543}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
                               color: 'var(--text-faint)', fontSize: 8 }}>▾</span>
              </div>
            </div>
            <button type="button" style={nav} onClick={() => setCur(new Date(y, m + 1, 1))} aria-label="เดือนถัดไป">›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {RCV_TH_DOW.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', padding: '2px 0 4px' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={'e' + i} />;
              const iso = rcvIso(new Date(y, m, day));
              const sel = iso === value;
              return (
                <button key={day} type="button" onClick={() => pick(day)}
                        onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                        onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                        style={{ aspectRatio: '1 / 1', width: '100%', border: 0, borderRadius: 2, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit',
                                 background: sel ? 'var(--brand-700)' : 'transparent',
                                 color: sel ? '#fff' : 'var(--text)', fontWeight: sel ? 600 : 400 }}>{day}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', marginTop: 6, borderTop: '1px solid var(--divider)' }}>
            <button type="button" onClick={() => { onChange(todayIso); setOpen(false); }}
                    style={{ flex: 1, border: 0, background: 'transparent', font: 'inherit', fontSize: 12.5,
                             color: 'var(--text)', padding: '7px 0', cursor: 'pointer' }}>วันนี้</button>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                    style={{ flex: 1, border: 0, background: 'transparent', font: 'inherit', fontSize: 12.5,
                             color: 'var(--text)', padding: '7px 0', cursor: 'pointer' }}>ล้างค่า</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  Dropdown ที่วางรายการตรงกับตำแหน่งช่อง — หน้าตาช่องเหมือนเดิม
//  children เป็น <option>/<optgroup> เหมือน select ปกติ
// ═════════════════════════════════════════════════════════════════
function RcvSelect({ value, onChange, className, style, disabled, children }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrap = React.useRef(null);
  const place = () => { if (wrap.current) setRect(wrap.current.getBoundingClientRect()); };
  React.useEffect(() => {
    if (!open) return;
    place();
    const h = () => place();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const items = [];
  const text = (n) => React.Children.toArray(n).map(c => (c && c.props ? text(c.props.children) : String(c == null ? '' : c))).join('');
  const walk = (nodes) => React.Children.forEach(nodes, (c) => {
    if (!c || !c.props) return;
    if (c.type === 'optgroup') { items.push({ group: c.props.label }); walk(c.props.children); }
    else if (c.type === 'option') items.push({ value: c.props.value !== undefined ? c.props.value : text(c.props.children), label: text(c.props.children) });
    else walk(c.props.children);
  });
  walk(children);
  const same = (a) => String(a == null ? '' : a) === String(value == null ? '' : value);

  return (
    <div ref={wrap} style={Object.assign({ position: 'relative', width: '100%' }, style || {})}>
      <select className={className} value={value == null ? '' : value} disabled={disabled} onChange={onChange}
              onMouseDown={(e) => { if (!disabled) { e.preventDefault(); document.dispatchEvent(new MouseEvent('mousedown', { bubbles: false })); place(); setOpen(o => !o); } }}
              onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(o => !o); } }}
              style={{ width: '100%' }}>
        {children}
      </select>
      {open && rect && ReactDOM.createPortal((
        <div style={{ position: 'fixed', zIndex: 4000,
                      top: (rect.bottom + 240 > window.innerHeight && rect.top > 260) ? undefined : rect.bottom + 4,
                      bottom: (rect.bottom + 240 > window.innerHeight && rect.top > 260) ? (window.innerHeight - rect.top + 4) : undefined,
                      left: rect.left, width: Math.max(rect.width, 180),
                      maxHeight: 300, overflowY: 'auto', boxSizing: 'border-box', background: 'var(--surface-card, #fff)',
                      border: '1px solid var(--border-strong)', borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,.10)', padding: 0 }}>
          {items.map((it, i) => it.group !== undefined ? (
            <div key={'g' + i} style={{ padding: '6px 8px 3px', fontSize: 11, fontWeight: 600, color: 'var(--text-faint)' }}>{it.group}</div>
          ) : (
            <div key={'o' + i}
                 onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); onChange && onChange({ target: { value: it.value } }); }}
                 style={{ padding: '6px 10px', fontSize: 13, lineHeight: 1.45, borderRadius: 0, cursor: 'pointer',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          background: same(it.value) ? '#1254CC' : 'transparent',
                          color: same(it.value) ? '#fff' : 'var(--text)',
                          fontWeight: same(it.value) ? 600 : 400 }}
                 onMouseEnter={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                 onMouseLeave={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'transparent'; }}>
              {it.label || '—'}
            </div>
          ))}
        </div>
      ), document.body)}
    </div>
  );
}

Object.assign(window, { RcvThaiDate, RcvSelect });
