// ════════════════════════════════════════════════════════════════════
//  ขอให้ชำระหนี้ (แจ้งหน่วยงานต้นสังกัด) — แบบฟอร์มบันทึกรายการ (OrqCreateForm)
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  ใช้ DnField / DnMemberSearchModal / DN_* ร่วมกับ "แจ้งให้ชำระหนี้"
//
//  ต่างจากแจ้งให้ชำระหนี้:
//   • มีส่วน "หน่วยงานต้นสังกัด (ผู้รับหนังสือ)" — ดึงหัวหน้าสังกัดอัตโนมัติ
//   • เอกสารพิมพ์เป็น "สำเนา" แจ้งต้นสังกัด
//   • หนึ่งสัญญาแจ้งได้ครั้งเดียว — สัญญาที่เคยแจ้งแล้วจะถูกล็อกไม่ให้เลือกซ้ำ
// ════════════════════════════════════════════════════════════════════

function OrqCreateForm({ list, onSubmit, onCancel }) {
  const [regDate, setRegDate] = useState(window.dnToday);
  const [round, setRound] = useState(1);
  const [duePreset, setDuePreset] = useState(30);
  const [dueDate, setDueDate] = useState(() => window.dnAddDays(window.dnToday(), 30));
  const [dueTouched, setDueTouched] = useState(false);

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');

  const [org, setOrg] = useState({ code: '', name: '', unit: '', head: '' });

  const [causeCode, setCauseCode] = useState('C02');
  const [causeOther, setCauseOther] = useState('');
  const [occurredDate, setOccurredDate] = useState('');
  const [signer, setSigner] = useState(window.DN_SIGNERS[0].name);
  const [signerPosition, setSignerPosition] = useState(window.DN_SIGNERS[0].position);
  const [emsNo, setEmsNo] = useState('');

  const [debts, setDebts] = useState([]);
  const [guarantors, setGuarantors] = useState([]);

  const beYear = window.dnBeYear(regDate);
  const trackingNo = useMemo(() => window.orqNextTracking(list, beYear), [list, beYear]);
  const docNo = useMemo(() => window.orqNextDocNo(list, beYear), [list, beYear]);

  // กฎ: หนึ่งสัญญาแจ้งต้นสังกัดได้ครั้งเดียว
  const notifiedMap = useMemo(() => window.orqNotifiedContracts(list), [list]);

  const selectedDebts = debts.filter(d => d.selected);
  const totalOutstanding = selectedDebts.reduce((s, d) => s + window.dnContractTotal(d), 0);
  const totalArrears = selectedDebts.reduce((s, d) => s + (Number(d.arrears) || 0), 0);

  useEffect(() => {
    if (!dueTouched) setDueDate(window.dnAddDays(regDate, duePreset));
  }, [regDate, duePreset, dueTouched]);

  const guarantorsFromDebts = (ds) => {
    const out = [];
    ds.filter(d => d.selected).forEach(d => {
      (d.guarantors || []).forEach(g => out.push({ ...g, contractNo: d.contractNo }));
    });
    return out;
  };

  const pickMember = (m) => {
    setMember(m); setModal(false); setError('');
    setOrg(window.orqOrgOf(m));
    // สัญญาที่เคยแจ้งต้นสังกัดแล้ว → ไม่เลือกให้อัตโนมัติ (locked)
    const ds = (m.debts || []).map(d => ({ ...d, selected: !notifiedMap[d.contractNo] }));
    setDebts(ds);
    setGuarantors(guarantorsFromDebts(ds));
    setOccurredDate(ds[0] ? ds[0].dueDate : '');
    if (m.status === 'ลาออก') setCauseCode('C05');
    else if (m.status === 'เสียชีวิต') setCauseCode('C07');
    else if (m.status === 'ถูกให้ออก') setCauseCode('C06');
    else if (m.status === 'พ้นสภาพ') setCauseCode('C04');
    else setCauseCode('C02');
  };

  const toggleDebt = (contractNo) => {
    if (notifiedMap[contractNo]) return; // ล็อก — เคยแจ้งแล้ว
    setError('');
    setDebts(ds => ds.map(d => d.contractNo === contractNo ? { ...d, selected: !d.selected } : d));
  };

  const reloadGuarantors = () => setGuarantors(guarantorsFromDebts(debts));
  const addGuarantor = () =>
    setGuarantors(g => [...g, { contractNo: selectedDebts[0] ? selectedDebts[0].contractNo : '', memberCode: '', name: '', dept: '', prefix: '' }]);
  const removeGuarantor = (i) => setGuarantors(g => g.filter((_, idx) => idx !== i));
  const setGuarantor = (i, k, v) => setGuarantors(g => g.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
  const setOrgField = (k, v) => setOrg(o => ({ ...o, [k]: v }));

  const changeSigner = (name) => {
    setSigner(name);
    const s = window.DN_SIGNERS.find(x => x.name === name);
    if (s) setSignerPosition(s.position);
  };

  const ms = member ? (window.DN_MEMBER_STATUS[member.status] || { pill: 'neutral', warn: false }) : null;
  const noDebt = member && (member.debts || []).length === 0;
  const lockedSelected = selectedDebts.some(d => notifiedMap[d.contractNo]);

  const build = () => ({
    id: trackingNo, docNo, round: Number(round) || 1,
    regDate, dueDate,
    memberCode: member.code, memberName: member.name,
    dept: member.dept, deptCode: member.deptCode, shares: member.shares, memberStatus: member.status,
    org: { ...org },
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
    enteredBy: window.DN_USER, enteredAt: new Date().toISOString().slice(0, 19),
  });

  const validate = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกลูกหนี้ก่อนบันทึก'); return false; }
    if (noDebt) { setError('ไม่พบรายการหนี้ค้างชำระของสมาชิกรายนี้ — ไม่สามารถออกหนังสือแจ้งต้นสังกัดได้'); return false; }
    if (selectedDebts.length === 0) { setError('กรุณาเลือกสัญญาที่จะแจ้งต้นสังกัดอย่างน้อย 1 รายการ'); return false; }
    if (lockedSelected) { setError('มีสัญญาที่เคยแจ้งต้นสังกัดแล้วถูกเลือกอยู่ — หนึ่งสัญญาแจ้งได้เพียงครั้งเดียว'); return false; }
    if (totalOutstanding <= 0) { setError('ยอดหนี้คงค้างต้องมากกว่า 0 จึงจะออกหนังสือได้'); return false; }
    if (!org.name.trim()) { setError('กรุณาระบุชื่อหน่วยงานต้นสังกัด (ผู้รับหนังสือ)'); return false; }
    if (causeCode === 'C99' && !causeOther.trim()) { setError('กรุณาระบุรายละเอียดสาเหตุ “อื่น ๆ”'); return false; }
    if (!signer) { setError('กรุณาเลือกผู้ลงนามในหนังสือ'); return false; }
    return true;
  };
  // printType: null = บันทึกอย่างเดียว · 'copy' = บันทึก + พิมพ์สำเนาแจ้งต้นสังกัด
  const submit = (printType) => { if (validate()) onSubmit(build(), printType); };

  return (
    <div data-screen-label="หน้าบันทึกรายการขอให้ชำระหนี้ (แจ้งต้นสังกัด)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ขอให้ชำระหนี้ — บันทึกรายการแจ้งต้นสังกัด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิกลูกหนี้ · เลือกสัญญาค้างชำระ · ระบุหน่วยงานต้นสังกัดและผู้ลงนาม แล้วจัดทำสำเนาหนังสือแจ้งต้นสังกัด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียนหนังสือ</button>
        <button className="btn sm" onClick={() => submit('copy')}><Icon name="print" /> บันทึก + พิมพ์สำเนา</button>
        <button className="btn primary sm" onClick={() => submit(null)}><Icon name="check" /> บันทึกรายการ</button>
      </div>

      <div className="orq-mode-note">
        <Icon name="info" size={14} />
        <span>
          หนังสือฉบับนี้ใช้ <b>แจ้งหน่วยงานต้นสังกัด</b> ของสมาชิก และพิมพ์ออกเป็น <b>“สำเนา”</b> —{' '}
          หนึ่งสัญญาแจ้งได้เพียงครั้งเดียว โดยครอบคลุมทั้งผู้กู้และผู้ค้ำประกันในหนังสือฉบับเดียว
          (ต่างจากเมนู “แจ้งให้ชำระหนี้” ที่ใช้แจ้งผู้กู้และผู้ค้ำโดยตรง)
        </span>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ข้อมูลเอกสาร ── */}
      <div className="search-card sr-sys">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลเอกสาร</h3>
        </div>
        <div className="dn-doc-grid">
          <DnField label="ทะเบียนขอให้ชำระหนี้" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={trackingNo} readOnly />
          </DnField>
          <DnField label="เลขที่หนังสือ (แจ้งต้นสังกัด)" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={docNo} readOnly />
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
            <input className="cfg-input sr-readonly" value={window.DN_USER} readOnly />
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
            <span>ไม่พบรายการหนี้ค้างชำระของสมาชิกรายนี้ — ไม่สามารถออกหนังสือแจ้งต้นสังกัดได้</span>
          </div>
        )}
      </div>

      {/* ── หน่วยงานต้นสังกัด (ผู้รับหนังสือ) ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>หน่วยงานต้นสังกัด (ผู้รับหนังสือ)</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 11 }}>
              <Icon name="info" size={11} /> ดึงจากค่าคงที่ต้นสังกัดตามรหัสสังกัดสมาชิก — แก้ไขได้
            </span>
          </div>
        </div>
        <div className="dn-member-grid">
          <DnField label="ชื่อหน่วยงานต้นสังกัด" required full>
            <input className="cfg-input" value={org.name} onChange={(e) => setOrgField('name', e.target.value)}
                   placeholder={member ? '' : '(เลือกสมาชิกเพื่อดึงอัตโนมัติ)'} />
          </DnField>
          <DnField label="รหัสสังกัด" hint="(อ้างอิง)">
            <input className="cfg-input mono sr-auto" value={org.code} readOnly placeholder="—" />
          </DnField>
          <DnField label="หน่วยงาน / กลุ่มงาน">
            <input className="cfg-input" value={org.unit} onChange={(e) => setOrgField('unit', e.target.value)} placeholder="—" />
          </DnField>
        </div>
        <div className="dn-member-row1" style={{ marginTop: 14 }}>
          <div />
          <DnField label="เรียน (หัวหน้าหน่วยงานต้นสังกัด)" hint="(ปรากฏในหัวหนังสือ)">
            <input className="cfg-input" value={org.head} onChange={(e) => setOrgField('head', e.target.value)}
                   placeholder="ชื่อหัวหน้าสังกัด / ผู้บังคับบัญชา" />
          </DnField>
        </div>
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
              <Icon name="info" size={11} /> เลือกสัญญาที่จะแจ้งต้นสังกัด · สัญญาที่เคยแจ้งแล้วถูกล็อก
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
              ) : debts.map(d => {
                const locked = !!notifiedMap[d.contractNo];
                return (
                  <tr key={d.contractNo} className={(d.selected ? 'dn-row-sel' : '') + (locked ? ' is-disabled' : '')}>
                    <td className="center">
                      <input type="checkbox" className="ch-box" checked={d.selected} disabled={locked}
                             onChange={() => toggleDebt(d.contractNo)} />
                    </td>
                    <td>{d.type}</td>
                    <td className="mono">
                      {d.contractNo}
                      {locked && <div><span className="chip neutral" style={{ fontSize: 10 }} title={'เคยแจ้งต้นสังกัดแล้ว: ' + notifiedMap[d.contractNo]}>แจ้งแล้ว · {notifiedMap[d.contractNo]}</span></div>}
                    </td>
                    <td className="center"><span className={'chip ' + (d.status === 'ผิดนัดชำระ' || d.status === 'ดำเนินคดี' ? 'danger' : 'warning')}>{d.status}</span></td>
                    <td className="num mono">{fmt.money(d.principalRemaining, 2)}</td>
                    <td className="num mono">{fmt.money(d.interestDue, 2)}</td>
                    <td className="num mono">{fmt.money(d.penalty, 2)}</td>
                    <td className="center"><b style={{ color: 'var(--danger)' }}>{d.overdueInstallments}</b> งวด</td>
                    <td className="center mono">{fmt.date(d.dueDate)}</td>
                    <td className="num mono">{fmt.money(d.arrears, 2)}</td>
                    <td className="num mono"><b>{fmt.money(window.dnContractTotal(d), 2)}</b></td>
                  </tr>
                );
              })}
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

      {/* ── ผู้กู้และผู้ค้ำประกันที่แจ้งในหนังสือฉบับเดียว ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ผู้ค้ำประกันที่แจ้งในหนังสือฉบับเดียว</h3>
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
          <Icon name="info" size={11} /> รายชื่อผู้กู้และผู้ค้ำประกันจะถูกแจ้งรวมในสำเนาหนังสือแจ้งต้นสังกัดฉบับเดียวกัน (แจ้งครั้งเดียวต่อสัญญา)
        </p>
      </div>

      {modal && <DnMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

Object.assign(window, { OrqCreateForm });
