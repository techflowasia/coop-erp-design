// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — บันทึกเบี้ยประกัน
//  แสดง/บันทึกข้อมูลเบี้ยประกันของสมาชิกสหกรณ์ (บันทึกได้หลายกรมธรรม์)
//  ค้นหาสมาชิก → กดบันทึกเบี้ยประกัน → กรอกกรมธรรม์/ค่าเบี้ย → บันทึก
// ════════════════════════════════════════════════════════════════════

// pill วิธีการชำระ
const insPayPill = (v) => {
  const def = (window.INSURANCE_PAY_METHODS || []).find((m) => m.value === v);
  const label = def ? def.label : v;
  if (v === 'collect')  return <span className="pill info">{label}</span>;
  if (v === 'deduct')   return <span className="pill warn">{label}</span>;
  if (v === 'cash')     return <span className="pill ok">{label}</span>;
  return <span className="pill neutral">{label}</span>;
};

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// ใช้คอมโพเนนต์กลางจาก Design System (components-member-search.jsx)
const InsMemberSearchModal = window.MemberSearchModal;

// ─── Popup ค้นหาสัญญาเงินกู้ (อ้างอิงสัญญา) ─────────────────────────
function InsContractSearchModal({ member, onPick, onClose }) {
  const all = window.memberLoanContracts(member.code);
  const [q, setQ] = useState('');
  const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');
  const results = q ? all.filter((c) => norm(c.contractNo).includes(norm(q))) : all;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="loans" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ค้นหาสัญญาเงินกู้</h2>
            <div className="muted" style={{ fontSize: 11 }}>{member.code} · {member.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-sf" style={{ marginBottom: 12 }}>
            <span>เลขที่สัญญา</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
                   placeholder="พิมพ์เลขที่สัญญาเพื่อค้นหา…" className="mono" />
          </div>
          <div className="gc-sub-title">
            สัญญาเงินกู้ของสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่สัญญา</th>
                  <th>ประเภทเงินกู้</th>
                  <th className="num">เงินต้น</th>
                  <th>วันที่สัญญา</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบสัญญาเงินกู้ของสมาชิกรายนี้</td></tr>
                ) : results.map((c) => (
                  <tr key={c.contractNo} className="clickable" onClick={() => onPick(c)}>
                    <td className="mono">{c.contractNo}</td>
                    <td>{c.loanType}</td>
                    <td className="num">{fmt.money(c.principal, 0)}</td>
                    <td className="mono">{fmt.date(c.startDate)}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(c); }} title="เลือกสัญญา">
                        <Icon name="chevRight" />
                      </button>
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

// ─── Modal: ฟอร์มบันทึก/แก้ไขเบี้ยประกัน ─────────────────────────────
const INS_EMPTY = () => ({
  policyNo: '', contractRef: '', policyName: window.INSURANCE_POLICY_NAMES[0],
  company: window.INSURANCE_COMPANIES[0],
  entryDate: window.DEPOSIT_WORKING_DATE, startDate: window.DEPOSIT_WORKING_DATE, expireDate: '',
  premium: '', stamp: '', vatPct: '7', discountPct: '0', coordPct: '0',
  payMethod: 'collect',
});

function InsPremiumModal({ member, initial, onSave, onClose }) {
  const isEdit = !!initial;
  const [f, setF] = useState(() => initial ? { ...initial } : INS_EMPTY());
  const [error, setError] = useState('');
  const [contractModal, setContractModal] = useState(false);
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setError(''); };

  const calc = window.calcInsurance(f);
  const money = (n) => fmt.money(n, 2);

  const submit = () => {
    if (!f.contractRef.trim()) { setError('กรุณาระบุ/เลือกสัญญาอ้างอิง'); return; }
    if (!(Number(f.premium) > 0)) { setError('กรุณากรอกจำนวนเบี้ยประกัน'); return; }
    if (!f.startDate) { setError('กรุณาระบุวันเริ่มคุ้มครอง'); return; }
    onSave({
      ...f,
      premium: Number(f.premium) || 0,
      stamp: Number(f.stamp) || 0,
      vatPct: Number(f.vatPct) || 0,
      discountPct: Number(f.discountPct) || 0,
      coordPct: Number(f.coordPct) || 0,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card ins-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="shield" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขเบี้ยประกัน' : 'บันทึกเบี้ยประกัน'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{member.code} · {member.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body ins-body">
          {/* ── ข้อมูลทั่วไปของกรมธรรม์ ── */}
          <div className="ins-sec">
            <div className="section-head"><span className="head-bar" /><h3>ข้อมูลทั่วไปของกรมธรรม์</h3></div>
            <div className="ins-grid">
              <div className="lb-field">
                <label className="lb-label">เลขที่กรมธรรม์</label>
                <input className="cfg-input mono" value={f.policyNo}
                       placeholder="เลขที่กรมธรรม์ (ถ้ามี)"
                       onChange={(e) => set('policyNo', e.target.value)} />
              </div>
              <div className="lb-field">
                <label className="lb-label">อ้างอิงสัญญา <span className="cfg-required">*</span></label>
                <button type="button" className="gc-member-trigger lb-trigger"
                        onClick={() => setContractModal(true)}>
                  {f.contractRef ? (
                    <>
                      <Icon name="loans" size={14} />
                      <span className="gc-mt-code mono">{f.contractRef}</span>
                      <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
                    </>
                  ) : (
                    <>
                      <Icon name="search" size={14} />
                      <span className="muted">คลิกเพื่อค้นหาสัญญาเงินกู้…</span>
                      <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                    </>
                  )}
                </button>
              </div>
              <div className="lb-field">
                <label className="lb-label">ชื่อกรมธรรม์</label>
                <select className="cfg-input" value={f.policyName}
                        onChange={(e) => set('policyName', e.target.value)}>
                  {window.INSURANCE_POLICY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="lb-field">
                <label className="lb-label">บริษัท/สมาคมประกัน</label>
                <select className="cfg-input" value={f.company}
                        onChange={(e) => set('company', e.target.value)}>
                  {window.INSURANCE_COMPANIES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="lb-field">
                <label className="lb-label">วันที่ป้อนรายการ</label>
                <ErpDate value={f.entryDate} onChange={(v) => ((e) => set('entryDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </div>
              <div className="lb-field">
                <label className="lb-label">วันเริ่มคุ้มครอง <span className="cfg-required">*</span></label>
                <ErpDate value={f.startDate} onChange={(v) => ((e) => set('startDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </div>
              <div className="lb-field">
                <label className="lb-label">วันที่หมดอายุ</label>
                <ErpDate value={f.expireDate} onChange={(v) => ((e) => set('expireDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </div>
            </div>
          </div>

          {/* ── ค่าเบี้ยประกัน + สมาชิกต้องชำระ + สุทธิจ่ายให้บริษัท ── */}
          <div className="ins-calc-cols">
            {/* ค่าเบี้ยประกัน */}
            <div className="ins-sec ins-calc-card">
              <div className="section-head"><span className="head-bar" /><h3>ค่าเบี้ยประกัน</h3></div>
              <div className="ins-line">
                <label>เบี้ยประกัน</label>
                <input type="number" step="0.01" className="cfg-input ins-num" value={f.premium}
                       placeholder="0.00" onChange={(e) => set('premium', e.target.value)} />
              </div>
              <div className="ins-line">
                <label>อากรแสตมป์</label>
                <input type="number" step="0.01" className="cfg-input ins-num" value={f.stamp}
                       placeholder="0.00" onChange={(e) => set('stamp', e.target.value)} />
              </div>
              <div className="ins-line">
                <label>VAT</label>
                <div className="ins-pct-pair">
                  <div className="ins-pct">
                    <input type="number" step="0.01" className="cfg-input ins-num" value={f.vatPct}
                           onChange={(e) => set('vatPct', e.target.value)} />
                    <span className="ins-suffix">%</span>
                  </div>
                  <span className="ins-amt mono">{money(calc.vatAmount)}</span>
                </div>
              </div>
              <div className="ins-line ins-total-line">
                <label>รวม</label>
                <span className="ins-amt mono strong">{money(calc.total)}</span>
              </div>
            </div>

            {/* สมาชิกต้องชำระ */}
            <div className="ins-sec ins-calc-card">
              <div className="section-head"><span className="head-bar" /><h3>สมาชิกต้องชำระ</h3></div>
              <div className="ins-line">
                <label>ส่วนลด</label>
                <div className="ins-pct-pair">
                  <div className="ins-pct">
                    <input type="number" step="0.01" className="cfg-input ins-num" value={f.discountPct}
                           onChange={(e) => set('discountPct', e.target.value)} />
                    <span className="ins-suffix">%</span>
                  </div>
                  <span className="ins-amt mono">{money(calc.discountAmt)}</span>
                </div>
              </div>
              <div className="ins-line ins-total-line">
                <label>สมาชิกชำระ</label>
                <span className="ins-amt mono strong accent">{money(calc.memberPay)}</span>
              </div>
              <div className="lb-field" style={{ marginTop: 10 }}>
                <label className="lb-label">วิธีชำระ</label>
                <select className="cfg-input" value={f.payMethod}
                        onChange={(e) => set('payMethod', e.target.value)}>
                  {window.INSURANCE_PAY_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {/* สุทธิจ่ายให้บริษัท */}
            <div className="ins-sec ins-calc-card">
              <div className="section-head"><span className="head-bar" /><h3>สุทธิจ่ายให้บริษัท</h3></div>
              <div className="ins-line">
                <label>ค่าประสานงาน</label>
                <div className="ins-pct-pair">
                  <div className="ins-pct">
                    <input type="number" step="0.01" className="cfg-input ins-num" value={f.coordPct}
                           onChange={(e) => set('coordPct', e.target.value)} />
                    <span className="ins-suffix">%</span>
                  </div>
                  <span className="ins-amt mono">{money(calc.coordAmt)}</span>
                </div>
              </div>
              <div className="ins-line ins-total-line">
                <label>สุทธิจ่ายให้บริษัท</label>
                <span className="ins-amt mono strong">{money(calc.netToCompany)}</span>
              </div>
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 12 }}><Icon name="info" size={13} /> {error}</div>}
        </div>

        <div className="ins-modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit}>
            <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกเบี้ยประกัน'}
          </button>
        </div>
      </div>

      {contractModal && (
        <InsContractSearchModal member={member}
          onPick={(c) => { set('contractRef', c.contractNo); setContractModal(false); }}
          onClose={() => setContractModal(false)} />
      )}
    </>
  );
}

// ─── โมดัลยืนยันการลบ ────────────────────────────────────────────────
function InsDeleteModal({ rec, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}><Icon name="close" /></div>
          <h2>ลบเบี้ยประกัน</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '0 0 14px', fontSize: 'var(--font-sm)', lineHeight: 1.5 }}>
            ต้องการลบรายการเบี้ยประกัน <b className="mono">{rec.policyNo || rec.contractRef}</b> ({rec.policyName}) ใช่หรือไม่?
            การลบไม่สามารถย้อนกลับได้
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onConfirm(rec)}>
              <Icon name="close" /> ยืนยันการลบ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── หน้าหลัก: บันทึกเบี้ยประกัน ─────────────────────────────────────
function InsurancePremiumPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const workDate = window.DEPOSIT_WORKING_DATE;

  const [member, setMember] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [records, setRecords] = useState([]);   // เบี้ยประกันของสมาชิกที่เลือก
  const [formOpen, setFormOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [delRec, setDelRec] = useState(null);
  const [cancelFrom, setCancelFrom] = useState('');
  const [cancelTo, setCancelTo] = useState('');

  const pick = (m) => {
    setMember(m); setMemberModal(false);
    setRecords((window.INSURANCE_SEED[m.code] || []).map((r) => ({ ...r })));
  };

  const openAdd = () => { setEditRec(null); setFormOpen(true); };
  const openEdit = (rec) => { setEditRec(rec); setFormOpen(true); };

  const saveRecord = (data) => {
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (editRec) {
      setRecords((prev) => prev.map((r) => r.id === editRec.id ? { ...editRec, ...data } : r));
      audit.log({ action: 'update', module: 'สินเชื่อ — บันทึกเบี้ยประกัน',
        target: `${member.code} · ${member.name}`,
        summary: `แก้ไขเบี้ยประกัน ${data.policyNo || data.contractRef} (${data.policyName})`,
        changes: [{ field: 'อ้างอิงสัญญา', before: editRec.contractRef, after: data.contractRef },
                  { field: 'เบี้ยประกัน', before: String(editRec.premium), after: String(data.premium) }] });
      onToast && onToast(`แก้ไขเบี้ยประกัน ${data.policyNo || data.contractRef} เรียบร้อยแล้ว`);
    } else {
      const policyNo = data.policyNo || window.nextInsurancePolicyNo();
      const rec = { id: window.nextInsuranceUid(), ...data, policyNo, by: 'จันทร์เพ็ญ มาลี', ts };
      setRecords((prev) => [rec, ...prev]);
      audit.log({ action: 'create', module: 'สินเชื่อ — บันทึกเบี้ยประกัน',
        target: `${member.code} · ${member.name}`,
        summary: `เพิ่มเบี้ยประกัน ${policyNo} (${data.policyName}) อ้างอิงสัญญา ${data.contractRef}`,
        changes: [{ field: 'เลขที่กรมธรรม์', before: '—', after: policyNo },
                  { field: 'อ้างอิงสัญญา', before: '—', after: data.contractRef },
                  { field: 'เบี้ยประกัน', before: '—', after: window.fmt.money(data.premium) }] });
      onToast && onToast(`บันทึกเบี้ยประกัน ${policyNo} · ${member.name} เรียบร้อยแล้ว`);
    }
    setFormOpen(false); setEditRec(null);
  };

  const confirmDelete = (rec) => {
    setRecords((prev) => prev.filter((r) => r.id !== rec.id));
    audit.log({ action: 'delete', module: 'สินเชื่อ — บันทึกเบี้ยประกัน',
      target: `${member.code} · ${member.name}`,
      summary: `ลบเบี้ยประกัน ${rec.policyNo || rec.contractRef} (${rec.policyName})`,
      changes: [{ field: 'เลขที่กรมธรรม์', before: rec.policyNo, after: '—' }] });
    onToast && onToast(`ลบเบี้ยประกัน ${rec.policyNo || rec.contractRef} เรียบร้อยแล้ว`);
    setDelRec(null);
  };

  const totalMemberPay = records.reduce((s, r) => s + window.calcInsurance(r).memberPay, 0);

  return (
    <div data-screen-label="หน้าบันทึกเบี้ยประกัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            บันทึกเบี้ยประกัน
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกข้อมูลเบี้ยประกันของสมาชิก — บันทึกได้มากกว่า 1 กรมธรรม์ต่อสมาชิก
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันที่ทำรายการ</span>
          <span className="ct-workdate-value mono">{fmt.date(workDate)}</span>
        </div>
      </div>

      {/* ── การ์ดหัวเอกสาร: ข้อมูลสมาชิก ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" />
          <h3>ข้อมูลสมาชิก</h3>
        </div>

        <div className="lb-header-grid">
          <div className="field">
            <span className="label">เลขที่สมาชิก</span>
            <span className="value">
              <button className="gc-member-trigger lb-trigger" onClick={() => setMemberModal(true)}>
                {member ? (
                  <>
                    <span className="row-avatar">{member.firstName.slice(0, 1)}</span>
                    <span className="gc-mt-code mono">{member.code}</span>
                    <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
                  </>
                ) : (
                  <>
                    <Icon name="search" size={14} />
                    <span className="muted">คลิกเพื่อค้นหาเลขสมาชิก…</span>
                    <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                  </>
                )}
              </button>
            </span>
          </div>
          <div className="field">
            <span className="label">ชื่อสมาชิก</span>
            <span className={"value" + (member ? '' : ' muted')}>{member ? member.name : '—'}</span>
          </div>
          <div className="field">
            <span className="label">สังกัด</span>
            <span className={"value" + (member ? '' : ' muted')}>{member ? member.unit : '—'}</span>
          </div>
          <div className="field">
            <span className="label">ทุนเรือนหุ้น</span>
            <span className={"value num-value" + (member ? '' : ' muted')}>
              {member ? '฿ ' + fmt.money(member.share.capital, 0) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── ตารางเบี้ยประกันของสมาชิก ── */}
      {member ? (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" />
            <h3>รายการเบี้ยประกันของสมาชิก</h3>
            <span className="head-actions">
              <button className="btn primary sm" onClick={openAdd}>
                <Icon name="plus" /> บันทึกเบี้ยประกัน
              </button>
            </span>
          </div>

          <div className="ins-cancel-range">
            <span className="ins-cancel-range-label">ช่วงวันที่ต้องการยกเลิกรายการ</span>
            <div className="ins-cancel-range-fields">
              <label className="ins-crf">
                <span>วันที่เริ่มต้น</span>
                <ErpDate value={cancelFrom} onChange={(v) => ((e) => setCancelFrom(e.target.value))({ target: { value: v } })} className="cfg-input" />
              </label>
              <span className="ins-crf-dash">—</span>
              <label className="ins-crf">
                <span>วันที่สิ้นสุด</span>
                <ErpDate value={cancelTo} onChange={(v) => ((e) => setCancelTo(e.target.value))({ target: { value: v } })} className="cfg-input" />
              </label>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="gc-empty">— ยังไม่มีรายการเบี้ยประกันของสมาชิกรายนี้ —</div>
          ) : (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>เลขที่กรมธรรม์</th>
                    <th>เลขที่สัญญา</th>
                    <th>ชื่อกรมธรรม์</th>
                    <th className="center">วันที่เริ่มคุ้มครอง</th>
                    <th className="num">จำนวนเงิน</th>
                    <th className="center">การชำระ</th>
                    <th className="center" style={{ width: 150 }}>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const c = window.calcInsurance(r);
                    return (
                      <tr key={r.id}>
                        <td className="mono">{r.policyNo || '—'}</td>
                        <td className="mono">{r.contractRef}</td>
                        <td style={{ whiteSpace: 'normal', maxWidth: 240 }}>{r.policyName}</td>
                        <td className="center mono">{fmt.date(r.startDate)}</td>
                        <td className="num"><b>{fmt.money(c.memberPay)}</b></td>
                        <td className="center">{insPayPill(r.payMethod)}</td>
                        <td className="center">
                          <div className="ins-row-actions">
                            <button className="btn ghost sm" onClick={() => openEdit(r)} title="แก้ไขข้อมูล">
                              <Icon name="edit" size={13} /> แก้ข้อมูล
                            </button>
                            <button className="btn ghost sm ins-del-btn" onClick={() => setDelRec(r)} title="ลบ">
                              <Icon name="close" size={13} /> ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {records.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'left', fontWeight: 600 }}>รวมสมาชิกชำระทั้งหมด</td>
                      <td className="num"><b>{fmt.money(totalMemberPay)}</b></td>
                      <td colSpan="2" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div></div>
          )}
        </div>
      ) : (
        <MemberSearchEmptyState
          icon="shield"
          description="ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อบันทึก/แสดงรายการเบี้ยประกัน"
          examples={window.GUAR_MEMBERS}
          onPick={pick}
          style={{ marginTop: 12 }} />
      )}

      {memberModal && <InsMemberSearchModal onPick={pick} onClose={() => setMemberModal(false)} />}
      {formOpen && member && (
        <InsPremiumModal member={member} initial={editRec}
                         onSave={saveRecord} onClose={() => { setFormOpen(false); setEditRec(null); }} />
      )}
      {delRec && <InsDeleteModal rec={delRec} onConfirm={confirmDelete} onClose={() => setDelRec(null)} />}
    </div>
  );
}

Object.assign(window, { InsurancePremiumPage });
