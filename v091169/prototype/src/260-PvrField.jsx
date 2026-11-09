// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่ายเงินรอจ่ายคืน (Payment Voucher / Receivable) — Workspace + Form
//  · ทำงานเหมือนใบสำคัญจ่าย แต่ใช้ "รายการบัญชี" (เดบิต/เครดิต) แทนการตัดงบ
//  · Ref ใบสำคัญรับ ของเลขสมาชิกที่ลงบัญชี "รายการค้างรับ" ไว้ → ตั้งจ่าย
// ════════════════════════════════════════════════════════════════════

// ─── ฟิลด์/หัวข้อ (ใช้คลาสร่วมกับใบสำคัญจ่าย) ────────────────────────
function PvrField({ label, hint, required, full, children }) {
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
function PvrSection({ title, sub, right, children }) {
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

const PVR_ROW_TYPES = (window.VCH_PAYEE_TYPES || []).filter(t => t.v !== 'group');

// รวมผู้รับเงินจากรายการค้างรับที่อ้างอิง (จัดกลุ่มตามเลขสมาชิก)
function pvrBudCatOfGl(gl) {
  let hit = '';
  const walk = (ns) => (ns || []).forEach(n => { if (!hit && n.gl && String(n.gl) === String(gl) && !(n.children || []).length) hit = n.id; walk(n.children); });
  walk(window.BUDGET_SEED);
  return hit;
}
function pvrPayeesFromRefs(refs) {
  const by = {};
  (refs || []).forEach(r => {
    const key = r.memberNo || r.name;
    if (!by[key]) {
      by[key] = {
        type: 'member', code: r.memberNo || '', name: r.memberName || '',
        bank: r.bank || '', branch: r.branch || '', acctNo: r.acctNo || '',
        amount: 0, wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '', fromRef: true,
      };
    }
    by[key].amount += Number(r.amount || 0);
    (by[key].items = by[key].items || []).push({
      label: r.desc || '', amount: Number(r.amount || 0),
      cat: pvrBudCatOfGl(r.acct), acct: r.acct || '', refId: r.id,
    });
  });
  return Object.values(by);
}

// ════════════════════════════════════════════════════════════════════
//  Popup — Ref ใบสำคัญรับ (ค้นหาเลขสมาชิกที่มีรายการค้างรับ)
// ════════════════════════════════════════════════════════════════════
function PvrRecvSearchModal({ current, onApply, onClose }) {
  const [picked, setPicked] = useState(() => {
    const s = {}; (current || []).forEach(r => { s[r.id] = true; }); return s;
  });
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const allRecv = window.pvrRecvItems().filter(it => it.remain > 0.005);

  // — ค้นหาแบบมีเงื่อนไข (รูปแบบเดียวกับ Contract Search ใน Design System) —
  const [c, setC] = useState({ code: '', firstName: '', lastName: '', citizenId: '', itemNo: '' });
  const filterRecv = (crit) => {
    const code = norm(crit.code), fn = norm(crit.firstName), ln = norm(crit.lastName),
          cid = norm(crit.citizenId), itn = norm(crit.itemNo);
    if (!code && !fn && !ln && !cid && !itn) return allRecv;
    return allRecv.filter(it => {
      const name = norm(it.memberName);
      return (!code || norm(it.memberNo).includes(code))
        && (!fn || name.includes(fn))
        && (!ln || name.includes(ln))
        && (!cid || norm(it.citizenId).includes(cid))
        && (!itn || norm(it.id).includes(itn) || norm(it.desc).includes(itn));
    });
  };
  const [rows, setRows] = useState(() => allRecv);
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const run = () => { setRows(filterRecv(c)); setDirty(true); };
  const reset = () => { setC({ code: '', firstName: '', lastName: '', citizenId: '', itemNo: '' }); setRows(allRecv); setDirty(false); };

  // จัดกลุ่มรายการค้างรับตามสมาชิก (เหมือนสัญญาจัดกลุ่มใต้หัวสมาชิก)
  const groups = [];
  const gidx = {};
  rows.forEach(it => {
    let g = gidx[it.memberNo];
    if (!g) { g = gidx[it.memberNo] = { memberNo: it.memberNo, name: it.memberName, citizenId: it.citizenId, dept: it.dept, items: [] }; groups.push(g); }
    g.items.push(it);
  });
  const toggle = (id) => setPicked(p => ({ ...p, [id]: !p[id] }));

  const allItems = window.pvrRecvItems();
  const chosen = allItems.filter(it => picked[it.id] && it.remain > 0.005);
  const chosenTotal = chosen.reduce((s, it) => s + it.remain, 0);

  const apply = () => {
    onApply(chosen.map(it => ({
      id: it.id, rvNo: it.rvNo, rvDate: it.rvDate, memberNo: it.memberNo, memberName: it.memberName,
      dept: it.dept, bank: it.bank, branch: it.branch, acctNo: it.acctNo,
      acct: it.acct, category: it.category, desc: it.desc, amount: it.remain,
    })));
  };

  return ReactDOM.createPortal((
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1990 }} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true"
           style={{ width: 900, maxWidth: '94vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', zIndex: 2000 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ค้นหารายการค้างรับ</h2>
            <div className="muted" style={{ fontSize: 11 }}>ค้นหาเลขสมาชิกที่ลงบัญชี “รายการค้างรับ” ไว้ผ่านใบสำคัญรับ แล้วเลือกรายการมาตั้งจ่าย</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. รหัสสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-058241" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. ชื่อ</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อจริง" />
            </label>
            <label className="gc-sf">
              <span>3. นามสกุล</span>
              <input value={c.lastName} onChange={(e) => set('lastName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="นามสกุล" />
            </label>
            <label className="gc-sf">
              <span>4. เลขบัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน" className="mono" />
            </label>
            <label className="gc-sf gc-sf-wide">
              <span>5. รหัสรายการค้างรับ</span>
              <input value={c.itemNo} onChange={(e) => set('itemNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น AR-001" className="mono" />
            </label>
            <div className="gc-sf-actions">
              <button className="btn primary" onClick={run}>ค้นหา</button>
              <button className="btn" onClick={reset}>รีเซ็ต</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการค้างรับ{' '}
            <span className="muted" style={{ fontWeight: 400 }}>
              · พบ {rows.length} รายการ{groups.length > 1 ? ` จาก ${groups.length} สมาชิก` : ''}
            </span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl cs-tbl">
              <thead>
                <tr>
                  <th style={{ width: 34 }} />
                  <th>รายการค้างรับ</th>
                  <th style={{ width: 150 }}>อ้างอิงใบสำคัญรับ</th>
                  <th className="num" style={{ width: 120 }}>คงค้าง (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">
                    {dirty ? 'ไม่พบรายการค้างรับที่ตรงกับเงื่อนไข' : 'ระบุเงื่อนไข แล้วกดค้นหา'}
                  </td></tr>
                ) : groups.map(g => (
                  <React.Fragment key={g.memberNo}>
                    <tr className="cs-group">
                      <td colSpan="4">
                        <div className="cs-group-row">
                          <span className="row-avatar">{(g.name || '?').replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                          <span className="cs-group-code mono">{g.memberNo}</span>
                          <span className="cs-group-name">{g.name}</span>
                          {g.citizenId && <span className="cs-group-unit muted mono">· {g.citizenId}</span>}
                          <span className="cs-group-count muted">{g.items.length} รายการ</span>
                        </div>
                      </td>
                    </tr>
                    {g.items.map(it => {
                      const cat = window.pvrRecvCat(it.category);
                      return (
                        <tr key={it.id} className="clickable cs-crow" onClick={() => toggle(it.id)}>
                          <td className="center"><input type="checkbox" checked={!!picked[it.id]} readOnly style={{ accentColor: 'var(--brand, #237450)', width: 15, height: 15 }} /></td>
                          <td>
                            <div className="lt-row-name"><span className="cs-indent" />{it.desc} <span className="muted mono" style={{ fontSize: 11, fontWeight: 400 }}>({it.id})</span></div>
                            <div className="lt-row-note"><span className={"chip " + cat.tone}>{cat.l}</span>
                              <span className="muted mono" style={{ marginLeft: 6 }}>{it.acct} · {window.pvrAcctName(it.acct)}</span></div>
                          </td>
                          <td className="mono" style={{ fontSize: 12 }}>{it.rvNo}<div className="muted">{fmt.date(it.rvDate)}</div></td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(it.remain, 2)}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <div className="muted" style={{ fontSize: 12 }}>
            เลือกแล้ว <b>{chosen.length}</b> รายการ · รวม <b className="mono">{fmt.money(chosenTotal, 2)}</b> บาท
          </div>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={apply}>อ้างอิง {chosen.length} รายการ</button>
        </div>
      </div>
    </>
  ), document.body);
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มหลัก
// ════════════════════════════════════════════════════════════════════
function PvrForm({ voucher, onSave, onCancel, onToast }) {
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(voucher)));
  const [refModal, setRefModal] = useState(false);
  const [payeeModal, setPayeeModal] = useState(null);
  const [certOpen, setCertOpen] = useState(false);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const VchPayeeSearchModal = window.VchPayeeSearchModal;
  const WhtCertModal = window.WhtCertModal;

  const postingAccts = React.useMemo(() => window.pvrPostingAccounts(), []);
  const acctName = (c) => window.pvrAcctName(c);

  // ── ผู้รับเงิน ──
  const payees = d.payees || [];
  const setPayee = (i, patch) => setD(p => ({ ...p, payees: p.payees.map((x, idx) => idx === i ? { ...x, ...patch } : x) }));
  const addPayee = () => setD(p => ({ ...p, payees: [...(p.payees || []), { type: 'member', code: '', name: '', bank: '', branch: '', acctNo: '', amount: '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '' }] }));
  const removePayee = (i) => setD(p => ({ ...p, payees: p.payees.filter((_, idx) => idx !== i) }));
  const pickPayee = (p) => {
    const i = payeeModal;
    setPayee(i, { payeeId: p.id, code: p.code, name: p.name, bank: p.bank, branch: p.branch, acctNo: p.acctNo });
    setPayeeModal(null);
  };
  const payeeTotal = window.vchPayeeTotal(payees);

  // ── รายการบัญชี (เดบิต/เครดิต) ──
  const entries = d.entries || [];
  const setEntry = (i, patch) => setD(p => ({ ...p, entries: p.entries.map((x, idx) => idx === i ? { ...x, ...patch } : x) }));
  const addEntry = () => setD(p => ({ ...p, entries: [...(p.entries || []), { acct: '', desc: '', ref: '', dr: '', cr: '' }] }));
  const removeEntry = (i) => setD(p => ({ ...p, entries: p.entries.filter((_, idx) => idx !== i) }));
  const eTotals = window.pvrEntryTotals(entries);
  const eBalanced = window.pvrBalanced(entries);

  // ── รายการค้างรับที่อ้างอิง ──
  const refs = d.refs || [];
  const refTotal = refs.reduce((s, r) => s + Number(r.amount || 0), 0);

  const applyRefs = (chosen) => {
    setD(prev => {
      // ผู้รับเงินที่ผู้ใช้เพิ่มเองไว้ (ไม่ได้มาจาก ref)
      const manual = (prev.payees || []).filter(p => !p.fromRef && (p.name || Number(p.amount)));
      const fromRefs = pvrPayeesFromRefs(chosen);
      const nextPayees = [...fromRefs, ...manual];
      const nextDoc = { ...prev, refs: chosen, payees: nextPayees.length ? nextPayees : prev.payees };
      nextDoc.entries = window.pvrAutoEntries(nextDoc);
      if (!nextDoc.entries.length) nextDoc.entries = prev.entries;
      return nextDoc;
    });
    setRefModal(false);
    onToast && onToast(`อ้างอิงรายการค้างรับ ${chosen.length} รายการ — สร้างผู้รับเงินและรายการบัญชีให้อัตโนมัติ`);
  };
  const removeRef = (id) => {
    setD(prev => {
      const nextRefs = (prev.refs || []).filter(r => r.id !== id);
      const manual = (prev.payees || []).filter(p => !p.fromRef);
      const fromRefs = pvrPayeesFromRefs(nextRefs);
      const nextDoc = { ...prev, refs: nextRefs, payees: [...fromRefs, ...manual] };
      nextDoc.entries = window.pvrAutoEntries(nextDoc);
      if (!nextDoc.entries.length) nextDoc.entries = [{ acct: '', desc: '', ref: '', dr: '', cr: '' }];
      return nextDoc;
    });
  };
  const regenEntries = () => {
    setD(prev => {
      const auto = window.pvrAutoEntries(prev);
      return { ...prev, entries: auto.length ? auto : prev.entries };
    });
    onToast && onToast('สร้างรายการบัญชีอัตโนมัติจากรายการค้างรับและผู้รับเงินแล้ว');
  };

  // ── ไฟล์แนบ ──
  const onFiles = (e) => {
    const names = Array.from(e.target.files || []).map(f => f.name);
    if (names.length) setD(p => ({ ...p, files: [...(p.files || []), ...names] }));
    e.target.value = '';
  };
  const removeFile = (i) => setD(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }));

  const st = window.PVR_STATUS[d.status] || window.PVR_STATUS.draft;
  const methodBreakdown = window.vchMethodBreakdown(d);
  const hasWht = (d.payees || []).some(p => window.vchWhtRate(p.wht) > 0 && Number(p.amount) > 0);

  // แจ้งเตือนยอด: ผู้รับเงินรวม เทียบ เดบิตรวม
  const balanceDiff = payeeTotal - eTotals.dr;
  const payMatch = Math.abs(balanceDiff) < 0.005;

  const validAndSave = (alsoPrint) => {
    if (!payees.some(p => p.name && Number(p.amount) > 0)) { onToast && onToast('กรุณาเพิ่มผู้รับเงินอย่างน้อย 1 คน พร้อมยอดเงิน'); return; }
    if (!entries.some(l => l.acct && (Number(l.dr) > 0 || Number(l.cr) > 0))) { onToast && onToast('กรุณาเพิ่มรายการบัญชีอย่างน้อย 1 บรรทัด'); return; }
    if (!eBalanced) { onToast && onToast('รายการบัญชีไม่สมดุล — เดบิตและเครดิตต้องเท่ากัน'); return; }
    onSave(d, alsoPrint);
  };

  return (
    <div data-screen-label="หน้าสร้าง/แก้ไขใบสำคัญจ่ายเงินรอจ่ายคืน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="mono" style={{ fontWeight: 600, marginLeft: 4 }}>{d.id}</span>
        <span className={"pill " + st.pill}>{st.l}</span>
        <span className="spacer" />
        {hasWht && WhtCertModal && (
          <button className="btn sm" onClick={() => setCertOpen(true)} title="ออกหนังสือรับรองหักภาษี ณ ที่จ่าย (50 ทวิ)">
            <Icon name="receipt" /> หนังสือหัก ณ ที่จ่าย
          </button>
        )}
        <button className="btn sm" onClick={() => validAndSave(true)}><Icon name="print" /> บันทึกและพิมพ์</button>
        <button className="btn primary sm" onClick={() => validAndSave(false)}><Icon name="check" /> บันทึกใบสำคัญจ่ายเงินรอจ่ายคืน</button>
      </div>

      {/* แถวบนเอกสาร */}
      <div className="search-card vch-card">
        <div className="vch-grid g3">
          <PvrField label="เลขที่ใบสำคัญจ่ายเงินรอจ่ายคืน" hint="(สร้างอัตโนมัติ)">
            <input className="cfg-input mono" value={d.id} readOnly />
          </PvrField>
          <PvrField label="วันที่เอกสาร" required>
            <ErpDate value={d.docDate} onChange={(v) => ((e) => set('docDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PvrField>
          <PvrField label="ผู้จัดทำเอกสาร" hint="(จาก User Login)">
            <input className="cfg-input" value={d.createdBy} readOnly />
          </PvrField>
        </div>
      </div>

      {/* Ref ใบสำคัญรับ (รายการค้างรับ) */}
      <PvrSection title="อ้างอิงใบสำคัญรับ — รายการค้างรับ"
                  sub="Ref ใบสำคัญรับของเลขสมาชิกที่ลงบัญชี “รายการค้างรับ” ไว้ — ระบบดึงผู้รับเงินและตั้งรายการบัญชีให้อัตโนมัติ"
                  right={<button className="btn primary sm" onClick={() => setRefModal(true)}><Icon name="search" /> ค้นหารายการค้างรับ</button>}>
        {refs.length === 0 ? (
          <div className="pvr-ref-empty muted">
            <Icon name="info" size={13} /> ยังไม่ได้อ้างอิงรายการค้างรับ — กด “ค้นหารายการค้างรับ” เพื่อค้นหาเลขสมาชิกที่มียอดค้างรับ
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
                  <th style={{ width: 120 }}>บัญชีค้างรับ</th>
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
                      <td><div>{r.desc}</div><span className={"chip " + cat.tone}>{cat.l}</span></td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.rvNo}<div className="muted">{fmt.date(r.rvDate)}</div></td>
                      <td className="mono" style={{ fontSize: 12 }}>{r.acct}<div className="muted">{acctName(r.acct)}</div></td>
                      <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(Number(r.amount || 0), 2)}</td>
                      <td className="center"><button className="bud-act danger" title="ลบการอ้างอิง" onClick={() => removeRef(r.id)}><Icon name="close" size={13} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="vch-foot">
                  <td colSpan="5" className="right">รวมยอดค้างรับที่ตั้งจ่าย ({refs.length} รายการ)</td>
                  <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(refTotal, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </PvrSection>

      {/* ผู้รับเงิน */}
      <PvrSection title="ข้อมูลผู้รับเงิน"
                  sub="ดึงจากเลขสมาชิกที่อ้างอิงรายการค้างรับ — เพิ่ม/แก้ไขบัญชีรับเงินและวิธีรับเงินได้"
                  right={<button className="btn sm" onClick={addPayee}><Icon name="plus" /> เพิ่มผู้รับเงิน</button>}>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 36 }}>#</th>
                <th style={{ width: 140 }}>ประเภทผู้รับเงิน</th>
                <th style={{ minWidth: 200 }}>รหัส / ชื่อ-สกุล ผู้รับเงิน</th>
                <th style={{ width: 240 }}>ธนาคาร / เลขบัญชีรับเงิน</th>
                <th style={{ width: 170 }}>วิธีรับเงิน</th>
                <th className="right" style={{ width: 120 }}>ยอดเงิน</th>
                <th className="center" style={{ width: 150 }}>หัก ณ ที่จ่าย (%)</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {payees.length === 0 && (
                <tr><td colSpan="8" className="center muted" style={{ padding: '22px 12px' }}>ยังไม่มีผู้รับเงิน — อ้างอิงรายการค้างรับ หรือกด “เพิ่มผู้รับเงิน”</td></tr>
              )}
              {payees.map((p, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="vch-cell-input" value={p.type}
                            onChange={(e) => setPayee(i, { type: e.target.value, payeeId: '', code: '', name: '', bank: '', branch: '', acctNo: '', fromRef: false })}>
                      {PVR_ROW_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </td>
                  <td>
                    {p.type === 'vendor' ? (
                      <div className="vch-pick">
                        <input className="vch-cell-input" value={p.name || ''}
                               placeholder="กรอกชื่อผู้รับเงิน / คู่ค้า"
                               onChange={(e) => setPayee(i, { name: e.target.value, payeeId: '', code: '', fromRef: false })} />
                        <button type="button" className="vch-pick-btn" title="ค้นหาจากข้อมูลคู่ค้าในระบบ (ถ้ามี)" onClick={() => setPayeeModal(i)}><Icon name="search" size={13} /></button>
                      </div>
                    ) : (
                      <div className="vch-pick" onClick={p.fromRef ? undefined : () => setPayeeModal(i)}>
                        <input className={"vch-cell-input" + (p.fromRef ? '' : ' vch-clickable')} readOnly
                               value={p.name ? (p.code ? `${p.code} · ${p.name}` : p.name) : ''}
                               placeholder="คลิกเพื่อค้นหาสมาชิก / พนักงาน" />
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
                    <select className="vch-cell-input" value={window.vchPayeeMethod(p, d)} onChange={(e) => setPayee(i, { payMethod: e.target.value })}>
                      {window.VCH_PAYMENT.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={p.amount}
                             title={p.fromRef ? 'ตั้งต้นจากยอดรายการค้างรับ — แก้ไขได้ (เช่น จ่ายให้ทายาท/ผู้จัดการมรดก)' : ''}
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
                                 style={{ width: 62, height: 28 }} value={p.wht} placeholder="0"
                                 title="ระบุอัตราภาษีหัก ณ ที่จ่าย (%)"
                                 onChange={(e) => setPayee(i, { wht: e.target.value, whtAmt: '' })} />
                          <span className="vch-wht-pct-sfx">%</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="center"><button className="bud-act danger" title="ลบผู้รับเงิน" onClick={() => removePayee(i)}><Icon name="close" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="5" className="right">รวมยอดผู้รับเงินทั้งหมด ({payees.filter(p => p.name || Number(p.amount)).length} ราย)</td>
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
          <Icon name="info" size={12} /> ผู้รับเงินประเภท“สมาชิก/พนักงาน” คลิกช่องชื่อเพื่อค้นหาจากทะเบียน · ประเภท“บุคคลภายนอก/คู่ค้า” กรอกรายละเอียดได้เองโดยไม่ต้องเลือกจากระบบ · ติ๊ก “หัก ณ ที่จ่าย” เพื่อออกหนังสือรับรองฯ (50 ทวิ)
        </div>
      </PvrSection>

      {/* รายการบัญชี (เดบิต/เครดิต) — แทนรายการเบิกจ่ายงบประมาณ */}
      <PvrSection title="รายการบัญชี (เดบิต / เครดิต)"
                  sub="ตั้งคู่บัญชีล้างยอดค้างรับ (เดบิต) กับเงินสด/ธนาคารฝั่งจ่าย (เครดิต) — อ้างอิงผังบัญชี"
                  right={<div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn sm" onClick={regenEntries} title="สร้างรายการบัญชีจากค้างรับ + ผู้รับเงิน"><Icon name="refresh" /> สร้างอัตโนมัติ</button>
                    <button className="btn primary sm" onClick={addEntry}><Icon name="plus" /> เพิ่มบรรทัด</button>
                  </div>}>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl vch-grid-tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 36 }}>#</th>
                <th style={{ width: 250 }}>รหัสบัญชี</th>
                <th style={{ minWidth: 180 }}>คำอธิบายรายการ</th>
                <th style={{ width: 130 }}>อ้างอิง</th>
                <th className="right" style={{ width: 120 }}>เดบิต</th>
                <th className="right" style={{ width: 120 }}>เครดิต</th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan="7" className="center muted" style={{ padding: '22px 12px' }}>ยังไม่มีรายการบัญชี — กด “เพิ่มบรรทัด” หรือ “สร้างอัตโนมัติ”</td></tr>
              )}
              {entries.map((l, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="vch-cell-input" value={l.acct}
                            onChange={(e) => setEntry(i, { acct: e.target.value, desc: l.desc || acctName(e.target.value) })}>
                      <option value="">— เลือกบัญชี —</option>
                      {postingAccts.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                    </select>
                  </td>
                  <td><input className="vch-cell-input" value={l.desc} placeholder="คำอธิบาย" onChange={(e) => setEntry(i, { desc: e.target.value })} /></td>
                  <td><input className="vch-cell-input mono" value={l.ref} placeholder="เลขที่อ้างอิง" onChange={(e) => setEntry(i, { ref: e.target.value })} /></td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={l.dr}
                             placeholder="0.00" onChange={(e) => setEntry(i, { dr: e.target.value, cr: Number(e.target.value) ? '' : l.cr })} /></td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={l.cr}
                             placeholder="0.00" onChange={(e) => setEntry(i, { cr: e.target.value, dr: Number(e.target.value) ? '' : l.dr })} /></td>
                  <td className="center"><button className="bud-act danger" title="ลบบรรทัด" onClick={() => removeEntry(i)}><Icon name="close" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="vch-foot">
                <td colSpan="4" className="right">รวม</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(eTotals.dr, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(eTotals.cr, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={"vch-balance " + (eBalanced ? 'ok' : 'warn')}>
          <Icon name={eBalanced ? 'check' : 'info'} size={14} />
          <span>เดบิตรวม <b className="mono">{fmt.money(eTotals.dr, 2)}</b></span>
          <span className="vch-bal-sep">เทียบกับ</span>
          <span>เครดิตรวม <b className="mono">{fmt.money(eTotals.cr, 2)}</b></span>
          <span className="spacer" />
          {eBalanced
            ? <span className="vch-bal-tag ok">รายการบัญชีสมดุล</span>
            : <span className="vch-bal-tag warn">ไม่สมดุล ผลต่าง {fmt.money(Math.abs(eTotals.dr - eTotals.cr), 2)}</span>}
        </div>
        {!payMatch && (
          <div className="vch-tax-note muted">
            <Icon name="info" size={12} /> ยอดผู้รับเงินรวม {fmt.money(payeeTotal, 2)} ไม่ตรงกับเดบิตค้างรับ {fmt.money(eTotals.dr, 2)} — โปรดตรวจสอบ
          </div>
        )}
      </PvrSection>

      {/* วิธีการรับเงิน */}
      <PvrSection title="วิธีการรับเงิน (แจกแจงตามผู้รับเงิน)"
                  sub="ดึงข้อมูลการรับเงินของผู้รับเงินแต่ละราย — เลือกวิธีรับเงิน (โอน / เช็ค / เงินสด) ได้ที่ตารางข้อมูลผู้รับเงินด้านบน">
        <div className="vch-grid g3" style={{ marginBottom: 12 }}>
          <PvrField label="บัญชีธนาคารสหกรณ์ (ฝั่งจ่าย)" hint="(ใช้กับรายการโอน / เช็ค)" full>
            <select className="cfg-input" value={d.coopBank} onChange={(e) => set('coopBank', e.target.value)}>
              <option value="">— เลือกบัญชี —</option>
              {window.VCH_COOP_BANKS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </PvrField>
        </div>
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
      </PvrSection>

      {/* หลักฐานและสายการอนุมัติ */}
      <PvrSection title="หลักฐานและสายการอนุมัติ">
        <div className="vch-grid g2">
          <PvrField label="ไฟล์แนบ" hint="(ใบสำคัญรับต้นทาง / หลักฐานประกอบ)" full>
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
          </PvrField>
          <PvrField label="สถานะเอกสาร" full>
            <select className="cfg-input" value={d.status} onChange={(e) => set('status', e.target.value)}>
              {window.PVR_STATUS_ORDER.map(k => <option key={k} value={k}>{window.PVR_STATUS[k].l}</option>)}
            </select>
          </PvrField>
          <PvrField label="หมายเหตุ" full>
            <input className="cfg-input" value={d.note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" onChange={(e) => set('note', e.target.value)} />
          </PvrField>
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
      </PvrSection>

      {refModal && <PvrRecvSearchModal current={refs} onApply={applyRefs} onClose={() => setRefModal(false)} />}
      {payeeModal != null && VchPayeeSearchModal && (
        <VchPayeeSearchModal payeeType={(payees[payeeModal] || {}).type || 'member'}
                             onPick={pickPayee} onClose={() => setPayeeModal(null)} />
      )}
      {certOpen && WhtCertModal && <WhtCertModal voucher={d} onClose={() => setCertOpen(false)} onToast={onToast} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก: รายการ ⇄ ฟอร์ม
// ════════════════════════════════════════════════════════════════════
function PvrWorkspace({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [vouchers, setVouchers] = useState(() => window.pvrLoad());
  const [mode, setMode] = useState('list');
  const [editDoc, setEditDoc] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const persist = (next) => { setVouchers(next); window.pvrSave(next); };

  const doPrint = (v) => { setPrintDoc(v); setTimeout(() => window.printVoucherRecv(onToast), 80); };

  const newVoucher = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditDoc({
      id: window.pvrNextNo(vouchers, today), docDate: today, createdBy: 'นางจันทร์เพ็ญ มาลี',
      status: 'draft', note: '', refs: [],
      payees: [{ type: 'member', code: '', name: '', bank: '', branch: '', acctNo: '', amount: '', wht: '0', payMethod: 'transfer', chequeNo: '', chequeDate: '' }],
      entries: [{ acct: '29101', desc: 'เงินรอจ่ายคืน', ref: '', dr: '', cr: '' }],
      coopBank: '', payMethod: 'transfer', files: [], _new: true,
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
    const net = window.pvrEntryTotals(clean.entries).dr;
    audit.log({
      action: exists ? 'update' : 'create', module: 'บัญชี — ใบสำคัญจ่ายเงินรอจ่ายคืน',
      target: `${clean.id} · ${payeeName}`,
      summary: `${exists ? 'แก้ไข' : 'สร้าง'}ใบสำคัญจ่ายเงินรอจ่ายคืน ${clean.id} (${window.fmt.money(net, 2)} บาท)`,
      changes: exists ? [] : [{ field: 'เลขที่ใบสำคัญจ่ายเงินรอจ่ายคืน', before: '—', after: clean.id }],
    });
    onToast && onToast(`บันทึกใบสำคัญจ่ายเงินรอจ่ายคืน ${clean.id} เรียบร้อยแล้ว`);
    if (alsoPrint) doPrint(clean);
    setMode('list'); setEditDoc(null);
  };

  if (mode === 'form' && editDoc) {
    return (
      <>
        <PvrForm voucher={editDoc} onSave={handleSave} onCancel={() => { setMode('list'); setEditDoc(null); }} onToast={onToast} />
        <VoucherRecvPrintSheet voucher={printDoc} />
      </>
    );
  }

  const filtered = vouchers.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      const inPayee = (v.payees || []).some(p => (p.name || '').toLowerCase().includes(n) || (p.code || '').toLowerCase().includes(n));
      const inRef = (v.refs || []).some(r => (r.rvNo || '').toLowerCase().includes(n) || (r.memberNo || '').toLowerCase().includes(n));
      return v.id.toLowerCase().includes(n) || inPayee || inRef;
    }
    return true;
  });

  return (
    <div data-screen-label="หน้ารายการใบสำคัญจ่ายเงินรอจ่ายคืน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ใบสำคัญจ่ายเงินรอจ่ายคืน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ตั้งจ่ายรายการค้างรับที่ลงบัญชีไว้ผ่านใบสำคัญรับ — บันทึกเป็นรายการบัญชีเดบิต/เครดิต
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={newVoucher}><Icon name="plus" /> สร้างใบสำคัญจ่ายเงินรอจ่ายคืน</button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 300px' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขที่, ผู้รับเงิน, เลขสมาชิก, ใบสำคัญรับ…" />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {window.PVR_STATUS_ORDER.map(k => <option key={k} value={k}>{window.PVR_STATUS[k].l}</option>)}
          </select>
        </div>

        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 960 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>เลขที่</th>
                <th style={{ width: 110 }}>วันที่เอกสาร</th>
                <th style={{ minWidth: 220 }}>ผู้รับเงิน</th>
                <th style={{ width: 130 }}>อ้างอิงใบสำคัญรับ</th>
                <th className="right" style={{ width: 130 }}>ยอดจ่าย (บาท)</th>
                <th className="center" style={{ width: 150 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบใบสำคัญจ่ายเงินรอจ่ายคืนที่ตรงกับเงื่อนไข</td></tr>
              )}
              {filtered.map(v => {
                const stt = window.PVR_STATUS[v.status] || window.PVR_STATUS.draft;
                const net = window.pvrEntryTotals(v.entries).dr;
                const plist = v.payees || [];
                const first = plist[0] ? plist[0].name : '—';
                const rvs = [...new Set((v.refs || []).map(r => r.rvNo))];
                return (
                  <tr key={v.id} className="clickable" onClick={() => openVoucher(v)}>
                    <td className="mono">{v.id}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(v.docDate)}</td>
                    <td>
                      <div className="lt-row-name">{first}{plist.length > 1 ? <span className="muted"> +{plist.length - 1} ราย</span> : ''}</div>
                      <div className="lt-row-note muted">{(v.refs || []).length} รายการค้างรับ</div>
                    </td>
                    <td className="mono" style={{ fontSize: 11.5 }}>
                      {rvs.length ? (<>{rvs[0]}{rvs.length > 1 ? <span className="muted"> +{rvs.length - 1}</span> : ''}</>) : <span className="muted">—</span>}
                    </td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(net, 2)}</td>
                    <td className="center"><span className={"pill " + stt.pill}>{stt.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 2 }}>
                        <button className="bud-act" title="เปิด/แก้ไข" onClick={() => openVoucher(v)}><Icon name="edit" size={13} /></button>
                        <button className="bud-act" title="พิมพ์ใบสำคัญจ่ายเงินรอจ่ายคืน" onClick={() => doPrint(v)}><Icon name="print" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ใบสำคัญจ่ายเงินรอจ่ายคืนอ้างอิงรายการค้างรับที่ลงบัญชีไว้ผ่านใบสำคัญรับ — เมื่อจ่ายแล้วยอดค้างรับของสมาชิกจะลดลงตามยอดที่ตั้งจ่าย
      </div>

      <VoucherRecvPrintSheet voucher={printDoc} />
    </div>
  );
}

Object.assign(window, { PvrWorkspace, PvrRecvSearchModal, pvrPayeesFromRefs });
