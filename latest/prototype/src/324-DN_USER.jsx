// ════════════════════════════════════════════════════════════════════
//  แจ้งให้ชำระหนี้ — แบบฟอร์มบันทึกรายการติดตามหนี้ (DnCreateForm)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
// ════════════════════════════════════════════════════════════════════

const DN_USER = 'จันทร์เพ็ญ มาลี';
const dnToday = () => new Date().toISOString().slice(0, 10);
const dnAddDays = (iso, days) => {
  const d = new Date(iso); d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};
const dnBeYear = (iso) => new Date(iso || dnToday()).getFullYear() + 543;

// ─── ฟิลด์ย่อย (label + control) ────────────────────────────────────
function DnField({ label, required, hint, children, full, span }) {
  const st = full ? { gridColumn: '1 / -1' } : (span ? { gridColumn: `span ${span}` } : null);
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

// ─── Popup ค้นหาสมาชิกลูกหนี้ ────────────────────────────────────────
function DnMemberSearchModal({ onPick, onClose }) {
  const all = window.DN_MEMBERS || [];
  const [c, setC] = useState({ code: '', firstName: '', lastName: '', citizenId: '', unit: '' });
  const [results, setResults] = useState(() => all);
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const run = () => setResults(window.msSearchMembers(all, c));
  const reset = () => { setC({ code: '', firstName: '', lastName: '', citizenId: '', unit: '' }); setResults(all); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสมาชิกลูกหนี้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. ทะเบียน</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-067012" className="mono" autoFocus />
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
              <span>5. หน่วย</span>
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
                  <th>รหัสสมาชิก</th><th>ชื่อ-สกุล</th><th>หน่วยงาน</th>
                  <th className="center">สถานะ</th><th className="num">หนี้คงค้าง</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map(m => {
                  const ms = window.DN_MEMBER_STATUS[m.status] || { pill: 'neutral' };
                  const tot = (m.debts || []).reduce((s, d) => s + window.dnContractTotal(d), 0);
                  return (
                    <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                      <td className="mono">{m.code}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td>{m.dept}</td>
                      <td className="center"><span className={'pill ' + ms.pill}>{m.status}</span></td>
                      <td className="num">{tot > 0 ? fmt.money(tot, 0) : <span className="muted">—</span>}</td>
                      <td className="center">
                        <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือกสมาชิก">
                          <Icon name="chevRight" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกรายการแจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════
function DnCreateForm({ list, onSubmit, onCancel }) {
  const [regDate, setRegDate] = useState(dnToday);
  const [round, setRound] = useState(1);
  const [duePreset, setDuePreset] = useState(30);
  const [dueDate, setDueDate] = useState(() => dnAddDays(dnToday(), 30));
  const [dueTouched, setDueTouched] = useState(false);

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');

  const [causeCode, setCauseCode] = useState('C02');
  const [causeOther, setCauseOther] = useState('');
  const [occurredDate, setOccurredDate] = useState('');
  const [signer, setSigner] = useState(window.DN_SIGNERS[0].name);
  const [signerPosition, setSignerPosition] = useState(window.DN_SIGNERS[0].position);
  const [emsNo, setEmsNo] = useState('');

  const [debts, setDebts] = useState([]);        // {..d, selected}
  const [guarantors, setGuarantors] = useState([]); // {contractNo, memberCode, name, dept, prefix}

  const beYear = dnBeYear(regDate);
  const trackingNo = useMemo(() => window.dnNextTracking(list, beYear), [list, beYear]);
  const seizeNo = useMemo(() => window.dnNextDocNo(list, beYear), [list, beYear]);

  const selectedDebts = debts.filter(d => d.selected);
  const totalOutstanding = selectedDebts.reduce((s, d) => s + window.dnContractTotal(d), 0);
  const totalArrears = selectedDebts.reduce((s, d) => s + (Number(d.arrears) || 0), 0);

  // กำหนดวันครบกำหนดอัตโนมัติจากวันลงทะเบียน + preset (BR-04)
  useEffect(() => {
    if (!dueTouched) setDueDate(dnAddDays(regDate, duePreset));
  }, [regDate, duePreset, dueTouched]);

  // ดึงผู้ค้ำจากสัญญาที่เลือก
  const guarantorsFromDebts = (ds) => {
    const out = [];
    ds.filter(d => d.selected).forEach(d => {
      (d.guarantors || []).forEach(g => out.push({ ...g, contractNo: d.contractNo }));
    });
    return out;
  };

  const pickMember = (m) => {
    setMember(m); setModal(false); setError('');
    const ds = (m.debts || []).map(d => ({ ...d, selected: true }));
    setDebts(ds);
    setGuarantors(guarantorsFromDebts(ds));
    setOccurredDate(ds[0] ? ds[0].dueDate : '');
    // เลือกสาเหตุอัตโนมัติตามสถานะสมาชิก
    if (m.status === 'ลาออก') setCauseCode('C05');
    else if (m.status === 'เสียชีวิต') setCauseCode('C07');
    else if (m.status === 'ถูกให้ออก') setCauseCode('C06');
    else if (m.status === 'พ้นสภาพ') setCauseCode('C04');
    else setCauseCode('C02');
  };

  const toggleDebt = (contractNo) => {
    setError('');
    setDebts(ds => ds.map(d => d.contractNo === contractNo ? { ...d, selected: !d.selected } : d));
  };

  const reloadGuarantors = () => setGuarantors(guarantorsFromDebts(debts));
  const addGuarantor = () =>
    setGuarantors(g => [...g, { contractNo: selectedDebts[0] ? selectedDebts[0].contractNo : '', memberCode: '', name: '', dept: '', prefix: '' }]);
  const removeGuarantor = (i) => setGuarantors(g => g.filter((_, idx) => idx !== i));
  const setGuarantor = (i, k, v) => setGuarantors(g => g.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const changeSigner = (name) => {
    setSigner(name);
    const s = window.DN_SIGNERS.find(x => x.name === name);
    if (s) setSignerPosition(s.position);
  };

  const ms = member ? (window.DN_MEMBER_STATUS[member.status] || { pill: 'neutral', warn: false }) : null;
  const noDebt = member && (member.debts || []).length === 0;

  const build = () => ({
    id: trackingNo, seizeNo, round: Number(round) || 1,
    regDate, dueDate,
    memberCode: member.code, memberName: member.name,
    dept: member.dept, deptCode: member.deptCode, shares: member.shares, memberStatus: member.status,
    causeCode, causeOther: causeCode === 'C99' ? causeOther.trim() : '',
    occurredDate,
    signer, signerPosition,
    debts: selectedDebts.map(d => ({
      type: d.type, contractNo: d.contractNo, status: d.status,
      principalRemaining: d.principalRemaining, interestDue: d.interestDue, penalty: d.penalty,
      overdueInstallments: d.overdueInstallments, dueDate: d.dueDate, arrears: d.arrears,
    })),
    guarantors: guarantors.filter(g => g.name.trim()).map(g => ({ ...g, name: g.name.trim() })),
    totalOutstanding,
    status: 'draft', printCount: 0, printedDate: null, closedDate: null,
    emsNo: emsNo.trim(),
    enteredBy: DN_USER, enteredAt: new Date().toISOString().slice(0, 19),
  });

  const validate = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกลูกหนี้ก่อนบันทึก'); return false; }
    if (noDebt) { setError('ไม่พบรายการหนี้ค้างชำระของสมาชิกรายนี้ — ไม่สามารถออกหนังสือแจ้งชำระหนี้ได้'); return false; }
    if (selectedDebts.length === 0) { setError('กรุณาเลือกสัญญาที่จะนำไปออกหนังสืออย่างน้อย 1 รายการ'); return false; }
    if (totalOutstanding <= 0) { setError('ยอดหนี้คงค้างต้องมากกว่า 0 จึงจะออกหนังสือได้ (BR-05)'); return false; }
    if (causeCode === 'C99' && !causeOther.trim()) { setError('กรุณาระบุรายละเอียดสาเหตุ “อื่น ๆ”'); return false; }
    if (!signer) { setError('กรุณาเลือกผู้ลงนามในหนังสือ'); return false; }
    return true;
  };
  // printType: null = บันทึกอย่างเดียว · 'notice' = พิมพ์หนังสือ · 'copy' = พิมพ์สำเนา
  const submit = (printType) => { if (validate()) onSubmit(build(), printType); };

  return (
    <div data-screen-label="หน้าบันทึกรายการแจ้งให้ชำระหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>แจ้งให้ชำระหนี้ — บันทึกรายการติดตาม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิกลูกหนี้ · เลือกสัญญาค้างชำระ · กำหนดสาเหตุ ผู้ค้ำ และผู้ลงนาม แล้วจัดทำหนังสือแจ้งให้ชำระหนี้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียนหนังสือ</button>
        <button className="btn sm" onClick={() => submit('notice')}><Icon name="print" /> บันทึก + พิมพ์หนังสือ</button>
        <button className="btn primary sm" onClick={() => submit(null)}><Icon name="check" /> บันทึกรายการ</button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ข้อมูลเอกสาร ── */}
      <div className="search-card sr-sys">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลเอกสาร</h3>
        </div>
        <div className="dn-doc-grid">
          <DnField label="ทะเบียนติดตาม" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={trackingNo} readOnly />
          </DnField>
          <DnField label="เลขที่หนังสือ" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={seizeNo} readOnly />
          </DnField>
          <DnField label="วันที่ลงทะเบียน" required>
            <ErpDate value={regDate} onChange={(v) => ((e) => { setRegDate(e.target.value); })({ target: { value: v } })} className="cfg-input" />
          </DnField>
          <DnField label="คิดดอกเบี้ยล่วงหน้า" required hint="(นับจากวันลงทะเบียน)">
            <div className="dn-due-wrap">
              {window.DN_DUE_PRESETS.map(p => (
                <button key={p} type="button"
                        className={'dn-due-chip' + (!dueTouched && duePreset === p ? ' active' : '')}
                        onClick={() => { setDuePreset(p); setDueTouched(false); }}>{p} วัน</button>
              ))}
              <ErpDate value={dueDate} onChange={(v) => ((e) => { setDueDate(e.target.value); setDueTouched(true); })({ target: { value: v } })} style={{ width: 150 }} className="cfg-input" />
            </div>
          </DnField>
          <DnField label="ผู้บันทึก" hint="(ล็อกอิน)">
            <input className="cfg-input sr-readonly" value={DN_USER} readOnly />
          </DnField>
        </div>
      </div>

      {/* ── ข้อมูลสมาชิกลูกหนี้ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลสมาชิกลูกหนี้</h3>
          {member && (
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <span className={'pill ' + ms.pill}>สถานะสมาชิก: {member.status}</span>
            </div>
          )}
        </div>

        <div className="dn-member-row1">
          <DnField label="ทะเบียนสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <button type="button" className="gc-member-trigger lb-trigger" onClick={() => setModal(true)}>
              {member ? (
                <>
                  <span className="row-avatar">{window.msInitial(member)}</span>
                  <span className="gc-mt-code mono">{member.code}</span>
                  <span className="gc-mt-name">{window.msFullName(member)}</span>
                  <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
                </>
              ) : (
                <>
                  <Icon name="search" size={14} />
                  <span className="muted">คลิกเพื่อค้นหาสมาชิก</span>
                  <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                </>
              )}
            </button>
          </DnField>
          <DnField label="ชื่อ-ชื่อสกุล">
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
        </div>
        <div className="dn-member-grid" style={{ marginTop: 14 }}>
          <DnField label="สังกัด" full>
            <input className="cfg-input sr-auto" value={member ? `${member.deptCode} · ${member.dept}` : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
          <DnField label="ทุนเรือนหุ้น" hint="(บาท)">
            <input className="cfg-input mono sr-auto" value={member ? fmt.money(member.shares, 2) : ''} readOnly placeholder="—" />
          </DnField>
          <DnField label="เลขบัตรประชาชน">
            <input className="cfg-input mono sr-auto" value={member ? member.citizenId : ''} readOnly placeholder="—" />
          </DnField>
        </div>

        {member && ms.warn && (
          <div className="dn-status-alert">
            <Icon name="info" size={15} />
            <span>สมาชิกอยู่ในสถานะ <b>“{member.status}”</b> — ตรวจสอบเอกสารและผู้ค้ำประกัน/ทายาทให้ครบถ้วนก่อนพิมพ์หนังสือ</span>
          </div>
        )}
        {noDebt && (
          <div className="dn-status-alert bad">
            <Icon name="info" size={15} />
            <span>ไม่พบรายการหนี้ค้างชำระของสมาชิกรายนี้ — ไม่สามารถออกหนังสือแจ้งให้ชำระหนี้ได้</span>
          </div>
        )}
      </div>

      {/* ── ข้อมูลติดตามหนี้ + ผู้ลงนาม ── */}
      <div className="dn-two-col">
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ข้อมูลติดตามหนี้</h3>
          </div>
          <div className="dn-track-grid">
            <DnField label="สาเหตุที่ติดตาม" required full>
              <select className="cfg-input" value={causeCode} onChange={(e) => { setCauseCode(e.target.value); setError(''); }}>
                {window.DN_CAUSES.filter(c => c.active).map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </DnField>
            {causeCode === 'C99' && (
              <DnField label="ระบุสาเหตุเพิ่มเติม" required full>
                <input className="cfg-input" value={causeOther} onChange={(e) => { setCauseOther(e.target.value); setError(''); }}
                       placeholder="ระบุรายละเอียดสาเหตุการติดตาม" />
              </DnField>
            )}
            <DnField label="เมื่อวันที่" hint="(วันที่อ้างอิงการติดตาม)">
              <ErpDate value={occurredDate} onChange={(v) => ((e) => setOccurredDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </DnField>
            <DnField label="สถานะรายการ">
              <input className="cfg-input sr-readonly" value="บันทึกแล้ว — รอพิมพ์" readOnly />
            </DnField>
            <DnField label="เลขนำส่ง EMS" hint="(ถ้ามี)" full>
              <input className="cfg-input mono" value={emsNo} onChange={(e) => setEmsNo(e.target.value)} placeholder="เช่น EH123456789TH" />
            </DnField>
          </div>
        </div>

        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ผู้ลงนามในหนังสือ</h3>
          </div>
          <div className="dn-signer-grid">
            <DnField label="ผู้ลงนาม" required full>
              <select className="cfg-input" value={signer} onChange={(e) => changeSigner(e.target.value)}>
                {window.DN_SIGNERS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </DnField>
            <DnField label="ตำแหน่ง" hint="(แสดงอัตโนมัติ · แก้ไขได้)" full>
              <input className="cfg-input" value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)} />
            </DnField>
          </div>
          <div className="dn-outstanding-box">
            <div className="dn-ob-label">หนี้คงค้างรวม (ตามสัญญาที่เลือก)</div>
            <div className="dn-ob-value">฿ {fmt.money(totalOutstanding, 2)}</div>
            <div className="dn-ob-sub">
              เลือก {selectedDebts.length} สัญญา · ยอดค้างชำระ (เฉพาะงวดค้าง) {fmt.money(totalArrears, 2)} บาท
            </div>
          </div>
        </div>
      </div>

      {/* ── ตารางหนี้ค้างชำระ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>หนี้ค้างชำระ</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              <Icon name="info" size={11} /> เลือกสัญญาที่จะนำไปออกหนังสือแจ้งชำระหนี้
            </span>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl dn-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th>ประเภท</th>
                <th>สัญญาเลขที่</th>
                <th className="center">สถานะ</th>
                <th className="num">เงินต้นคงเหลือ</th>
                <th className="num">ดอกเบี้ยค้าง</th>
                <th className="num">ค่าปรับ</th>
                <th className="center">งวดค้าง</th>
                <th className="center">วันครบกำหนด</th>
                <th className="num">ยอดค้างชำระ</th>
                <th className="num">รวมต่อสัญญา</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="11" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  {member ? 'ไม่พบรายการหนี้ค้างชำระของสมาชิกรายนี้' : 'เลือกสมาชิกเพื่อแสดงรายการหนี้ค้างชำระ'}
                </td></tr>
              ) : debts.map(d => (
                <tr key={d.contractNo} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center">
                    <input type="checkbox" className="ch-box" checked={d.selected}
                           onChange={() => toggleDebt(d.contractNo)} />
                  </td>
                  <td>{d.type}</td>
                  <td className="mono">{d.contractNo}</td>
                  <td className="center"><span className={'chip ' + (d.status === 'ผิดนัดชำระ' || d.status === 'ดำเนินคดี' ? 'danger' : 'warning')}>{d.status}</span></td>
                  <td className="num mono">{fmt.money(d.principalRemaining, 2)}</td>
                  <td className="num mono">{fmt.money(d.interestDue, 2)}</td>
                  <td className="num mono">{fmt.money(d.penalty, 2)}</td>
                  <td className="center"><b style={{ color: 'var(--danger)' }}>{d.overdueInstallments}</b> งวด</td>
                  <td className="center mono">{fmt.date(d.dueDate)}</td>
                  <td className="num mono">{fmt.money(d.arrears, 2)}</td>
                  <td className="num mono"><b>{fmt.money(window.dnContractTotal(d), 2)}</b></td>
                </tr>
              ))}
            </tbody>
            {selectedDebts.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="9" className="right"><b>รวมหนี้คงค้างทั้งหมด (สัญญาที่เลือก)</b></td>
                  <td className="num mono">{fmt.money(totalArrears, 2)}</td>
                  <td className="num mono"><b>{fmt.money(totalOutstanding, 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ── ตารางสำเนาเรียนผู้ค้ำประกัน ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>สำเนาเรียนผู้ค้ำประกัน</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn sm" onClick={reloadGuarantors} disabled={selectedDebts.length === 0}>
              <Icon name="refresh" size={12} /> ดึงผู้ค้ำจากสัญญา
            </button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl dn-guar-tbl">
            <thead>
              <tr>
                <th style={{ width: 150 }}>สัญญา</th>
                <th style={{ width: 120 }}>ผู้ค้ำประกัน</th>
                <th>ชื่อ-ชื่อสกุล</th>
                <th style={{ width: 200 }}>สังกัด</th>
                <th style={{ width: 110 }}>คำนำหน้า</th>
                <th style={{ width: 44 }} className="center">ลบ</th>
              </tr>
            </thead>
            <tbody>
              {guarantors.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">
                  ยังไม่มีผู้ค้ำประกัน — กด “ดึงผู้ค้ำจากสัญญา” หรือ “เพิ่มแถว”
                </td></tr>
              ) : guarantors.map((g, i) => (
                <tr key={i}>
                  <td>
                    <select className="cfg-input mono sm" value={g.contractNo} onChange={(e) => setGuarantor(i, 'contractNo', e.target.value)}>
                      {selectedDebts.length === 0 && <option value="">—</option>}
                      {selectedDebts.map(d => <option key={d.contractNo} value={d.contractNo}>{d.contractNo}</option>)}
                    </select>
                  </td>
                  <td><input className="cfg-input mono sm" value={g.memberCode} onChange={(e) => setGuarantor(i, 'memberCode', e.target.value)} placeholder="เลขสมาชิก" /></td>
                  <td><input className="cfg-input sm" value={g.name} onChange={(e) => setGuarantor(i, 'name', e.target.value)} placeholder="ชื่อ-สกุลผู้ค้ำ" /></td>
                  <td><input className="cfg-input sm" value={g.dept} onChange={(e) => setGuarantor(i, 'dept', e.target.value)} placeholder="สังกัด" /></td>
                  <td>
                    <select className="cfg-input sm" value={g.prefix} onChange={(e) => setGuarantor(i, 'prefix', e.target.value)}>
                      <option value="">— ไม่มี —</option>
                      <option value="ทายาท ">ทายาท</option>
                      <option value="ผู้แทน ">ผู้แทน</option>
                      <option value="ผู้รับมอบอำนาจ ">ผู้รับมอบอำนาจ</option>
                    </select>
                  </td>
                  <td className="center">
                    <button className="bud-act" title="ลบแถว" onClick={() => removeGuarantor(i)}><Icon name="close" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> รายชื่อในตารางนี้จะถูกนำไปแสดงในส่วน “สำเนาเรียน” ของหนังสือ และใช้พิมพ์หนังสือแจ้งให้ชำระหนี้ (สำเนา) ถึงผู้ค้ำประกัน
        </p>
      </div>

      {modal && <DnMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

Object.assign(window, { DnCreateForm, DnMemberSearchModal, DnField, DN_USER, dnToday, dnAddDays, dnBeYear });
