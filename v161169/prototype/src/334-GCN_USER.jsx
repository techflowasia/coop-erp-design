// ════════════════════════════════════════════════════════════════════
//  แจ้งเปลี่ยนผู้ค้ำประกัน — แบบฟอร์มบันทึกรายการ (GcnCreateForm)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน › ค้ำประกัน
// ════════════════════════════════════════════════════════════════════

const GCN_USER = 'น.ส. สุดารัตน์ จันทร์ดี';
const gcnToday = () => new Date().toISOString().slice(0, 10);
const gcnAddDays = (iso, days) => {
  const d = new Date(iso); d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};
const gcnBeYear = (iso) => new Date(iso || gcnToday()).getFullYear() + 543;

// ─── ฟิลด์ย่อย (label + control) ────────────────────────────────────
function GcnField({ label, required, hint, children, span }) {
  const st = span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="gcn-fld" style={st}>
      <span className="gcn-fld-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="gcn-fld-hint"> {hint}</span>}</span>
      {children}
    </div>
  );
}

// ─── Popup ค้นหาสมาชิก / ลูกหนี้ ─────────────────────────────────────
function GcnMemberSearchModal({ onPick, onClose }) {
  const [c, setC] = useState({ code: '', firstName: '', lastName: '', citizenId: '', unit: '' });
  const [results, setResults] = useState(() => window.GCN_MEMBERS);
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const run = () => { setResults(window.gcnSearchMembers(c)); setDirty(true); };
  const reset = () => { setC({ code: '', firstName: '', lastName: '', citizenId: '', unit: '' }); setResults(window.GCN_MEMBERS); setDirty(false); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสมาชิก / ลูกหนี้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. ทะเบียนสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น 050000" className="mono" autoFocus />
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
              <span>4. เลขที่บัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน" className="mono" />
            </label>
            <label className="gc-sf gc-sf-wide">
              <span>5. สังกัด</span>
              <input value={c.unit} onChange={(e) => set('unit', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="หน่วยงาน / รหัสสังกัด" />
            </label>
            <div className="gc-sf-actions">
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>
          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายชื่อสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ทะเบียนสมาชิก</th><th>ชื่อ-สกุล</th><th>สังกัด</th>
                  <th className="center">สัญญา</th><th className="num">หนี้คงค้าง</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">
                    {dirty ? 'ไม่พบสมาชิกที่ตรงกับเงื่อนไข' : 'ระบุเงื่อนไขแล้วกดค้นหา'}
                  </td></tr>
                ) : results.map(m => (
                  <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                    <td className="mono">{m.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td>{window.gcnDeptLabel(m.deptCode)}</td>
                    <td className="center">{(m.contracts || []).length}</td>
                    <td className="num">{m.outstanding > 0 ? fmt.money(m.outstanding, 2) : <span className="muted">0.00</span>}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือกสมาชิก">
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

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกรายการแจ้งเปลี่ยนผู้ค้ำประกัน
// ════════════════════════════════════════════════════════════════════
function GcnCreateForm({ list, initial, onSubmit, onCancel, onToast }) {
  const isEdit = !!initial;
  const [regDate, setRegDate] = useState(initial ? initial.regDate : gcnToday);
  const [dueDate, setDueDate] = useState(initial ? initial.dueDate : () => gcnAddDays(gcnToday(), 90));
  const [refNo, setRefNo] = useState(initial ? (initial.refNo || '') : '');
  const [notifyAhead, setNotifyAhead] = useState(initial ? !!initial.notifyAhead : false);

  const [signer, setSigner] = useState(initial ? initial.signer : window.GCN_SIGNERS[0].name);
  const [signerPosition, setSignerPosition] = useState(initial ? initial.signerPosition : window.GCN_SIGNERS[0].position);

  const [causeCode, setCauseCode] = useState(initial ? initial.causeCode : 'G02');
  const [causeDetail, setCauseDetail] = useState(initial ? (initial.causeDetail || '') : '');

  const [member, setMember] = useState(() => initial ? window.gcnMember(initial.memberCode) : null);
  const [deptCode, setDeptCode] = useState(initial ? initial.deptCode : '');

  const [contracts, setContracts] = useState(() => initial ? (initial.contracts || []).map(c => ({ ...c })) : []);
  const [note, setNote] = useState(initial ? (initial.note || '') : '');
  const [status, setStatus] = useState(initial ? initial.status : 'draft');
  const [statusDate, setStatusDate] = useState(initial ? (initial.statusDate || initial.regDate) : gcnToday);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error, setError] = useState('');

  const beYear = gcnBeYear(regDate);
  const trackingNo = useMemo(() => isEdit ? initial.id : window.gcnNextTracking(list, beYear), [list, beYear, isEdit, initial]);

  const totalAmount = window.gcnSumAmount(contracts);
  const totalRemaining = window.gcnSumRemaining(contracts);

  const pickMember = (m) => {
    if (!m) return;
    setMember(m); setDeptCode(m.deptCode); setError('');
    setContracts((m.contracts || []).map(c => ({ ...c })));
  };

  const pullFromLoanSystem = () => {
    if (!member) { setError('กรุณาเลือกสมาชิก/ลูกหนี้ก่อนดึงข้อมูล'); return; }
    setContracts((member.contracts || []).map(c => ({ ...c })));
    onToast && onToast('ดึงรายการสัญญาเงินกู้จากระบบเงินกู้แล้ว');
  };
  const addContractRow = () => {
    if (!member) { setError('กรุณาเลือกสมาชิก/ลูกหนี้ก่อนเพิ่มรายการสัญญา'); return; }
    setContracts(cs => [...cs, {
      contractNo: '', loanType: 'สามัญ', contractDate: regDate, amount: 0, remaining: 0,
      guarCode: '', guarName: '', guarType: 'ผู้ค้ำปกติ', guarDeptCode: member.deptCode,
    }]);
  };
  const setContract = (i, k, v) => setContracts(cs => cs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeContract = (i) => { setContracts(cs => cs.filter((_, idx) => idx !== i)); setConfirmDel(null); };

  const changeSigner = (name) => {
    setSigner(name);
    const s = window.GCN_SIGNERS.find(x => x.name === name);
    if (s) setSignerPosition(s.position);
  };

  const build = () => ({
    id: trackingNo, refNo: refNo.trim(), round: initial ? initial.round : 1,
    regDate, dueDate,
    signer, signerPosition,
    causeCode, causeDetail: causeDetail.trim(),
    notifyAhead,
    memberCode: member.code, memberName: member.name,
    deptCode, shares: member.shares, outstanding: member.outstanding,
    contracts: contracts.map(c => ({ ...c, amount: Number(c.amount) || 0, remaining: Number(c.remaining) || 0 })),
    note: note.trim(),
    totalAmount, totalRemaining,
    status, statusDate,
    printCount: initial ? (initial.printCount || 0) : 0,
    printedDate: initial ? initial.printedDate : null,
    attachments: initial ? (initial.attachments || []) : [],
    enteredBy: initial ? initial.enteredBy : GCN_USER,
    enteredAt: initial ? initial.enteredAt : new Date().toISOString().slice(0, 19),
  });

  const validate = () => {
    if (!member) { setError('กรุณาระบุทะเบียนสมาชิก'); return false; }
    if (!deptCode) { setError('กรุณาระบุสังกัด'); return false; }
    if (!causeCode) { setError('กรุณาระบุสาเหตุที่ติดตาม'); return false; }
    if (causeCode === 'G99' && !causeDetail.trim()) { setError('กรุณาระบุรายละเอียดสาเหตุ “เหตุผลอื่น ๆ”'); return false; }
    if (!regDate) { setError('กรุณาระบุวันที่ลงทะเบียน'); return false; }
    if (!dueDate) { setError('กรุณาระบุวันที่ครบกำหนด'); return false; }
    if (contracts.length === 0) { setError('ต้องมีรายการสัญญาเงินกู้อย่างน้อย 1 รายการ'); return false; }
    if (contracts.some(c => !String(c.contractNo).trim())) { setError('กรุณาระบุเลขที่สัญญาให้ครบทุกรายการ'); return false; }
    if (notifyAhead && !causeDetail.trim()) { setError('เลือก “แจ้งผู้ค้ำล่วงหน้า” — กรุณาระบุรายละเอียด/เงื่อนไขการแจ้งให้ครบถ้วน'); return false; }
    return true;
  };
  // print: false = บันทึกอย่างเดียว · true = บันทึกและพิมพ์หนังสือแจ้ง
  const submit = (print) => { if (validate()) onSubmit(build(), print); };

  const gcnCauseActive = window.GCN_CAUSES.filter(c => c.active);

  return (
    <div data-screen-label="หน้าบันทึกแจ้งเปลี่ยนผู้ค้ำประกัน">
      {/* ── แถบหัวเรื่อง + การกระทำ ── */}
      <div className="page-actions gcn-actions">
        <div className="gcn-title-wrap">
          <span className="gcn-title-ico"><Icon name="swap" size={18} /></span>
          <h1>แจ้งเปลี่ยนผู้ค้ำประกัน</h1>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => submit(false)}><Icon name="download" /> บันทึก</button>
        <button className="btn sm" onClick={() => submit(true)}><Icon name="print" /> พิมพ์หนังสือแจ้ง</button>
        <button className="btn sm" onClick={onCancel}><Icon name="history" /> ประวัติการดำเนินการ</button>
        <button className="btn sm" disabled><Icon name="refresh" /> รีเฟรช</button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── สามการ์ดบน: ผู้ลงนาม · ทะเบียนติดตาม · เหตุผลการติดตาม ── */}
      <div className="gcn-top-grid">
        {/* ผู้ลงนาม */}
        <div className="search-card gcn-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลผู้ลงนามในหนังสือแจ้ง</h3></div>
          <div className="gcn-form-col">
            <GcnField label="ผู้ลงนาม" required>
              <select className="cfg-input" value={signer} onChange={(e) => changeSigner(e.target.value)}>
                {window.GCN_SIGNERS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </GcnField>
            <GcnField label="ตำแหน่ง" required>
              <select className="cfg-input" value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)}>
                {window.GCN_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </GcnField>
          </div>
        </div>

        {/* ทะเบียนติดตาม */}
        <div className="search-card gcn-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลทะเบียนติดตาม</h3></div>
          <div className="gcn-track-grid">
            <GcnField label="เลขทะเบียนติดตาม">
              <input className="cfg-input mono gcn-auto" value={isEdit ? trackingNo : 'Auto'} readOnly title={trackingNo} />
            </GcnField>
            <GcnField label="เลขที่อ้างอิง">
              <input className="cfg-input" value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="—" />
            </GcnField>
            <GcnField label="วันที่ลงทะเบียน" required>
              <ErpDate value={regDate} onChange={(v) => ((e) => setRegDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </GcnField>
            <GcnField label="วันที่ครบกำหนด" required>
              <ErpDate value={dueDate} onChange={(v) => ((e) => setDueDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </GcnField>
          </div>
          <label className={'gcn-ahead' + (notifyAhead ? ' on' : '')}>
            <input type="checkbox" checked={notifyAhead} onChange={(e) => setNotifyAhead(e.target.checked)} />
            <span>แจ้งผู้ค้ำล่วงหน้า <b className="gcn-bang">!!!</b></span>
          </label>
          {notifyAhead && (
            <div className="gcn-ahead-note">
              <Icon name="info" size={13} />
              <span>รายการนี้ถูกกำหนดให้ <b>แจ้งเตือนผู้ค้ำ/ผู้เกี่ยวข้องล่วงหน้า</b> — เป็นรายการเร่งด่วน/มีเงื่อนไขพิเศษ โปรดระบุรายละเอียดการแจ้งในช่องรายละเอียดเพิ่มเติม</span>
            </div>
          )}
        </div>

        {/* เหตุผลการติดตาม */}
        <div className="search-card gcn-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลเหตุผลการติดตาม</h3></div>
          <div className="gcn-form-col">
            <GcnField label="สาเหตุที่ติดตาม" required>
              <select className="cfg-input" value={causeCode} onChange={(e) => { setCauseCode(e.target.value); setError(''); }}>
                {gcnCauseActive.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </GcnField>
            <GcnField label="รายละเอียดเพิ่มเติม" required={causeCode === 'G99' || notifyAhead}>
              <textarea className="cfg-input gcn-textarea" rows={3} value={causeDetail}
                        onChange={(e) => { setCauseDetail(e.target.value); setError(''); }}
                        placeholder="เช่น พ้นสภาพสมาชิกเมื่อวันที่ 15/06/2569" />
            </GcnField>
          </div>
        </div>
      </div>

      {/* ── ข้อมูลสมาชิก / ลูกหนี้ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิก / ลูกหนี้</h3></div>
        <div className="gcn-member-grid">
          <GcnField label="ทะเบียนสมาชิก" required>
            <MemberSearchField member={member} onPick={pickMember}
                               source={window.GCN_MEMBERS} searchFn={window.gcnSearchMembers}
                               title="ค้นหาสมาชิก / ลูกหนี้"
                               placeholder="คลิกเพื่อค้นหาเลขทะเบียนสมาชิก…" />
          </GcnField>
          <GcnField label="ชื่อ-สกุล">
            <input className="cfg-input gcn-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </GcnField>
          <GcnField label="สังกัด">
            <select className="cfg-input" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} disabled={!member}>
              {!deptCode && <option value="">—</option>}
              {window.GCN_DEPTS.map(d => <option key={d.code} value={d.code}>{d.code} - {d.name}</option>)}
            </select>
          </GcnField>
          <GcnField label="วันที่เป็นสมาชิก">
            <input className="cfg-input mono gcn-auto" value={member ? fmt.date(member.joinDate) : ''} readOnly placeholder="—" />
          </GcnField>
          <GcnField label="ทุนเรือนหุ้น">
            <input className="cfg-input mono gcn-auto gcn-num" value={member ? fmt.money(member.shares, 2) : ''} readOnly placeholder="—" />
          </GcnField>
          <GcnField label="หนี้คงค้าง">
            <input className="cfg-input mono gcn-auto gcn-num" value={member ? fmt.money(member.outstanding, 2) : ''} readOnly placeholder="—" />
          </GcnField>
        </div>
      </div>

      {/* ── รายการสัญญาเงินกู้ที่เกี่ยวข้อง ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการสัญญาเงินกู้ที่เกี่ยวข้อง</h3>
        </div>
        <div className="gcn-ct-actions">
          <button className="btn primary sm" onClick={addContractRow}><Icon name="plus" size={13} /> เพิ่มรายการสัญญา</button>
          <button className="btn sm" onClick={pullFromLoanSystem}><Icon name="refresh" size={13} /> ดึงข้อมูลจากระบบเงินกู้</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl gcn-ct-tbl">
            <thead>
              <tr>
                <th rowSpan="2" className="center" style={{ width: 44 }}>ลำดับ</th>
                <th rowSpan="2">เลขที่สัญญา</th>
                <th rowSpan="2">ประเภทเงินกู้</th>
                <th rowSpan="2" className="center">วันที่ทำสัญญา</th>
                <th rowSpan="2" className="num">จำนวนเงินกู้</th>
                <th rowSpan="2" className="num">ยอดหนี้คงเหลือ</th>
                <th colSpan="3" className="center gcn-guar-head">ข้อมูลผู้ค้ำประกันเดิม</th>
                <th rowSpan="2" className="center" style={{ width: 60 }}>จัดการ</th>
              </tr>
              <tr>
                <th className="center">รหัสผู้ค้ำ</th>
                <th>ชื่อ-สกุล</th>
                <th>สังกัด</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr><td colSpan="10" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  {member ? 'ยังไม่มีรายการสัญญา — กด “เพิ่มรายการสัญญา” หรือ “ดึงข้อมูลจากระบบเงินกู้”' : 'เลือกสมาชิก/ลูกหนี้เพื่อแสดงรายการสัญญาเงินกู้'}
                </td></tr>
              ) : contracts.map((c, i) => (
                <tr key={i}>
                  <td className="center">{i + 1}</td>
                  <td><input className="cfg-input mono sm" value={c.contractNo} onChange={(e) => setContract(i, 'contractNo', e.target.value)} placeholder="เลขที่สัญญา" style={{ width: 120 }} /></td>
                  <td>
                    <select className="cfg-input sm" value={c.loanType} onChange={(e) => setContract(i, 'loanType', e.target.value)} style={{ width: 100 }}>
                      <option value="สามัญ">สามัญ</option>
                      <option value="ฉุกเฉิน">ฉุกเฉิน</option>
                      <option value="พิเศษ">พิเศษ</option>
                    </select>
                  </td>
                  <td className="center"><ErpDate value={c.contractDate} onChange={(v) => ((e) => setContract(i, 'contractDate', e.target.value))({ target: { value: v } })} style={{ width: 140 }} className="cfg-input sm" /></td>
                  <td className="num"><input className="cfg-input sm num" type="number" value={c.amount} onChange={(e) => setContract(i, 'amount', e.target.value)} style={{ width: 118, textAlign: 'right' }} /></td>
                  <td className="num"><input className="cfg-input sm num" type="number" value={c.remaining} onChange={(e) => setContract(i, 'remaining', e.target.value)} style={{ width: 118, textAlign: 'right' }} /></td>
                  <td className="center"><input className="cfg-input mono sm" value={c.guarCode} onChange={(e) => setContract(i, 'guarCode', e.target.value)} placeholder="รหัส" style={{ width: 80 }} /></td>
                  <td><input className="cfg-input sm" value={c.guarName} onChange={(e) => setContract(i, 'guarName', e.target.value)} placeholder="ชื่อ-สกุลผู้ค้ำ" style={{ width: 150 }} /></td>
                  <td>
                    <select className="cfg-input sm" value={c.guarDeptCode} onChange={(e) => setContract(i, 'guarDeptCode', e.target.value)} style={{ width: 150 }}>
                      {window.GCN_DEPTS.map(d => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                    </select>
                  </td>
                  <td className="center">
                    <button className="bud-act gcn-del" title="ลบรายการสัญญา" onClick={() => setConfirmDel(i)}><Icon name="trash" size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            {contracts.length > 0 && (
              <tfoot>
                <tr className="gcn-ct-foot">
                  <td colSpan="4" className="left"><b>รวม {contracts.length} รายการ</b></td>
                  <td className="num mono"><b>{fmt.money(totalAmount, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(totalRemaining, 2)}</b></td>
                  <td colSpan="4" />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> การลบรายการออกจากหน้าจอเป็นเพียงการนำออกจากหนังสือแจ้งเปลี่ยนผู้ค้ำ ไม่กระทบสัญญาจริงในระบบเงินกู้
        </p>
      </div>

      {/* ── หมายเหตุ · ไฟล์เอกสารแนบ ── */}
      <div className="gcn-bottom-grid">
        <div className="search-card gcn-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หมายเหตุ</h3></div>
          <textarea className="cfg-input gcn-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="โปรดจัดหาผู้ค้ำประกันรายใหม่ให้เป็นไปตามระเบียบของสหกรณ์ และนำเอกสารมายื่นภายในวันที่ครบกำหนด" />
        </div>

        <div className="search-card gcn-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ไฟล์เอกสารแนบ</h3></div>
          <div className="gcn-attach">
            <div className="gcn-attach-left">
              <button className="btn sm"><Icon name="upload" size={13} /> แนบไฟล์</button>
              <span className="muted" style={{ fontSize: 12 }}>ยังไม่มีไฟล์แนบ</span>
            </div>
            <div className="gcn-drop">
              <Icon name="mail" size={26} />
              <span>ลากไฟล์มาวางที่นี่</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ปุ่มด้านล่าง ── */}
      <div className="gcn-footer-actions">
        <button className="btn primary lg" onClick={() => submit(false)}>บันทึก</button>
        <button className="btn lg" onClick={() => submit(true)}>บันทึกและพิมพ์หนังสือแจ้ง</button>
        <button className="btn danger text lg" onClick={onCancel}>ยกเลิก</button>
        <button className="btn lg" onClick={onCancel}>กลับหน้าค้นหา</button>
      </div>

      {confirmDel != null && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirmDel(null)} />
          <div className="modal-card" style={{ width: 400 }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={{ background: 'var(--danger-50, #fff1f0)', color: 'var(--danger)' }}><Icon name="trash" /></div>
              <h2>ยืนยันการลบรายการสัญญา</h2>
              <button className="close-btn" onClick={() => setConfirmDel(null)}><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '4px 0 16px' }}>
                ต้องการลบสัญญาเลขที่ <b className="mono">{(contracts[confirmDel] || {}).contractNo || '—'}</b> ออกจากรายการแจ้งเปลี่ยนผู้ค้ำหรือไม่?
                <br /><span className="muted" style={{ fontSize: 12 }}>ไม่กระทบข้อมูลสัญญาจริงในระบบเงินกู้</span>
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn" onClick={() => setConfirmDel(null)}>ยกเลิก</button>
                <button className="btn danger" onClick={() => removeContract(confirmDel)}><Icon name="trash" size={13} /> ลบรายการ</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { GcnCreateForm, GcnMemberSearchModal, GcnField, GCN_USER, gcnToday, gcnAddDays, gcnBeYear });
