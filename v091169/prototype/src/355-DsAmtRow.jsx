// ════════════════════════════════════════════════════════════════════
//  ใบคำขอพักชำระหนี้ — แบบฟอร์มบันทึก + รายละเอียด + หน้าหลัก
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  ใช้ DnField / DnMemberSearchModal ร่วมกับ แจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════

// ─── แถวกรอกตัวเลข (เงินได้ / เงินหัก) ───────────────────────────────
function DsAmtRow({ field, value, onChange, readOnly }) {
  return (
    <div className="ds-amt-row">
      <span className={'ds-amt-label' + (field.hl ? ' hl' : '')}>
        {field.l}
        {field.note && <span className="ds-amt-note"> {field.note}</span>}
      </span>
      <input className="cfg-input mono ds-amt-input" type="number" min="0" step="0.01"
             value={value === 0 ? '0' : (value ?? '')}
             onChange={(e) => onChange(field.k, e.target.value)} readOnly={readOnly}
             placeholder="0.00" />
    </div>
  );
}

// ─── การ์ดสรุปผลคำนวณ ───────────────────────────────────────────────
function DsSumTile({ icon, label, value, tone }) {
  return (
    <div className={'ds-sum-tile' + (tone ? ' ' + tone : '')}>
      <div className="ds-sum-ico"><Icon name={icon} size={16} /></div>
      <div className="ds-sum-body">
        <span className="ds-sum-label">{label}</span>
        <span className="ds-sum-value mono">{fmt.money(value, 2)}</span>
      </div>
    </div>
  );
}

// ─── การ์ดบันทึกทันที (สัญญา R — ไม่ต้องคำนวณ) ──────────────────────
function DsImmediateCard({ contract, note, setNote }) {
  return (
    <div className="search-card" style={{ marginTop: 12 }}>
      <div className="section-head" style={{ marginBottom: 14 }}>
        <span className="head-bar" /><h3>พักชำระสัญญา R — บันทึกได้ทันที</h3>
      </div>
      <div className="dn-status-alert" style={{ marginTop: 0, background: 'var(--brand-soft, var(--primary-50))',
            color: 'var(--brand-700, var(--primary))', borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)' }}>
        <Icon name="info" size={15} />
        <span>สัญญาแปลงหนี้ผู้ค้ำ (R) — ไม่ต้องคำนวณความสามารถในการชำระ และไม่ต้องจัดตารางพักชำระ บันทึกพักชำระได้ทันที</span>
      </div>
      {contract && (
        <div className="form-grid cols-4" style={{ marginTop: 14 }}>
          <DnField label="เลขสัญญา (R)">
            <input className="cfg-input mono sr-auto" value={contract.contractNo} readOnly />
          </DnField>
          <DnField label="ประเภท">
            <input className="cfg-input sr-auto" value={contract.loanType} readOnly />
          </DnField>
          <DnField label="งวดชำระล่าสุด">
            <input className="cfg-input mono sr-auto" value={`${contract.lastTerm} / ${contract.totalTerms}`} readOnly />
          </DnField>
          <DnField label="ยอดคงเหลือ">
            <input className="cfg-input mono sr-auto ds-money" value={fmt.money(contract.remaining, 2)} readOnly />
          </DnField>
        </div>
      )}
      <DnField label="หมายเหตุ" full hint="(เหตุผลประกอบ)">
        <textarea className="cfg-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น พักชำระสัญญารับโอนผู้ค้ำ (R) ตามคำขอของสมาชิก" />
      </DnField>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกคำขอพักชำระหนี้
// ════════════════════════════════════════════════════════════════════
function DsCreateForm({ list, onSubmit, onCancel, onToast }) {
  const [recordDate, setRecordDate] = useState(dsToday);
  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);
  const [contractNo, setContractNo] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');

  const [income, setIncome] = useState(() => zeroMap(window.DS_INCOME_FIELDS));
  const [deduct, setDeduct] = useState(() => zeroMap(window.DS_DEDUCT_FIELDS));
  const [updatedDate, setUpdatedDate] = useState(null);

  const [months, setMonths] = useState(6);
  const [startMonth, setStartMonth] = useState('');
  const [payMode, setPayMode] = useState('waive-principal');
  const [perInstallment, setPerInstallment] = useState('');
  const [payTerms, setPayTerms] = useState('');
  const [note, setNote] = useState('');
  const [schedule, setSchedule] = useState([]);

  const monthOpts = useMemo(() => window.dsMonthOptions(recordDate), [recordDate]);
  const beYear = (new Date(recordDate).getFullYear()) + 543;
  const requestNo = useMemo(() => window.dsNextNo(list, beYear), [list, beYear]);

  // โครงการพักชำระหนี้ที่เปิดใช้งานและอยู่ในช่วงเวลา
  const projects = useMemo(() => window.dspActive(window.dspLoad(), recordDate), [recordDate]);
  const project = projects.find(p => p.id === projectId) || null;

  const contracts = member ? window.dsMemberContracts(member) : [];
  const contractRaw = contracts.find(d => d.contractNo === contractNo) || null;
  const contract = window.dsContractInfo(contractRaw);
  const isR = window.dsIsRContract(contractRaw);
  const skipCalc = isR;                                  // สัญญา R → บันทึกได้ทันที ไม่คำนวณ
  const defect = contractNo ? window.dsCollateralDefect(contractNo) : null;
  const mode = window.dsPayMode(payMode);
  // รูปแบบการชำระคืน — ยึดตามสัญญาเดิม (คงต้น/คงยอด) — อ่านอย่างเดียว
  const repayType = contract ? contract.repayType : '';
  const rmode = window.dsRepayType(repayType || 'คงยอด');

  // ── ผลคำนวณรายได้ ──
  const sumInc = window.dsSumIncome(income);
  const sumDed = window.dsSumDeduct(deduct);
  const netCalc = sumInc - sumDed;                              // รายได้คำนวณ
  const interestKeep = contract ? contract.interestDue : 0;     // ดอกเบี้ย (คงต้น)
  const perInterest = months > 0 ? Math.round(interestKeep / months) : 0;
  const perInstNum = Number(perInstallment) || 0;
  const newSend = perInstNum + perInterest; // ยอดส่งใหม่
  const capacityOk = netCalc >= newSend;

  // ── เงื่อนไขกั้น (guards) ตามโครงการ/หลักประกัน ──
  const ps = project ? project.settings : null;
  const collateralBlocked = !!defect && !isR;                              // หลักประกันบกพร่อง
  const projectUsed = !!(ps && ps.oncePerContract && contractNo &&
    window.dsContractUsedProject(list, contractNo, projectId));            // 1 ครั้ง/สัญญา
  const balanceNeg = !!(ps && ps.requireNonNegativeBalance && !skipCalc && netCalc < 0); // เงินเดือนคงเหลือติดลบ
  const hardBlocked = collateralBlocked || projectUsed || balanceNeg;

  // ── สร้างตารางการชำระหนี้อัตโนมัติเมื่อเลือกจำนวนเดือน (แก้ไขต่อได้) ──
  //  รีเจนเมื่อ เปลี่ยนสัญญา / จำนวนเดือน / รูปแบบพักชำระ — ค่าที่แก้ในตาราง
  //  จะคงอยู่จนกว่าจะเปลี่ยนตัวขับเหล่านี้
  const perRef = useRef(perInstallment);
  useEffect(() => { perRef.current = perInstallment; });
  useEffect(() => {
    if (!contract || !(Number(months) > 0)) { setSchedule([]); return; }
    const mNum = Number(months);
    const curPer = Number(perRef.current) || 0;
    const defPer = contract.installment; // ยึดงวดชำระตามสัญญาเดิม
    const per = curPer > 0 ? curPer : defPer;
    const schedInt = interestKeep;
    setPerInstallment(String(per));
    setPayTerms(String(mNum));
    setSchedule(window.dsBuildSchedule({ lastTerm: contract.lastTerm, months: mNum,
      perInstallment: per, interestDue: schedInt, date: recordDate }));
  }, [contractNo, months, payMode]); // eslint-disable-line

  // ── เลือกสมาชิก ──
  const pickMember = (m) => {
    setMember(m); setModal(false); setError('');
    const first = window.dsMemberContracts(m)[0];
    setContractNo(first ? first.contractNo : '');
    const pr = window.dsMemberPayroll(m.code);
    setIncome(pr.income); setDeduct(pr.deduct); setUpdatedDate(pr.updatedDate);
    setPerInstallment(''); setPayTerms('');
  };

  // ── เลือกสัญญา (จาก ContractSearchModal — ค้นหาด้วยเลขสัญญา/เลขสมาชิก) ──
  const pickContractRow = ({ member: m, debt }) => {
    setModal(false); setError('');
    setContractNo(debt.contractNo);
    if (!member || member.code !== m.code) {
      setMember(m);
      const pr = window.dsMemberPayroll(m.code);
      setIncome(pr.income); setDeduct(pr.deduct); setUpdatedDate(pr.updatedDate);
    }
    setPerInstallment(''); setPayTerms('');
  };

  const setInc = (k, v) => setIncome(s => ({ ...s, [k]: v === '' ? 0 : Number(v) }));
  const setDed = (k, v) => setDeduct(s => ({ ...s, [k]: v === '' ? 0 : Number(v) }));

  // ── คำนวณ: เติมยอด/งวด + สร้างตารางพักชำระ ──
  const compute = () => {
    if (!contract) { setError('กรุณาเลือกสมาชิกและสัญญาก่อนคำนวณ'); return; }
    setError('');
    const mNum = Number(months) || 0;
    const from = contract.lastTerm + 1;
    const to = contract.lastTerm + mNum;
    const defPer = contract.installment;
    const per = perInstNum > 0 ? perInstNum : defPer;
    const schedInt = interestKeep;
    setPerInstallment(String(per));
    setPayTerms(String(mNum));
    setSchedule(window.dsBuildSchedule({ lastTerm: contract.lastTerm, months: mNum,
      perInstallment: per, interestDue: schedInt, date: recordDate }));
    onToast && onToast(`คำนวณเงื่อนไขพักชำระแล้ว · ${mNum} เดือน (งวด ${from}–${to})`);
  };

  // ── จัดการตารางการชำระหนี้ ──
  const addRow = () => {
    const last = schedule[schedule.length - 1];
    const from = last ? last.from + 1 : (contract ? contract.lastTerm + 1 : 1);
    setSchedule([...schedule, { from, to: from + 1, perInstallment: perInstNum,
                                interestInstallment: 0, enteredDate: recordDate }]);
  };
  const setRow = (i, k, v) => setSchedule(s => s.map((r, idx) =>
    idx === i ? { ...r, [k]: (k === 'enteredDate' ? v : (v === '' ? 0 : Number(v))) } : r));
  const delRow = (i) => setSchedule(s => s.filter((_, idx) => idx !== i));

  const schedTotalPer = schedule.reduce((s, r) => s + (Number(r.perInstallment) || 0), 0);
  const schedTotalInt = schedule.reduce((s, r) => s + (Number(r.interestInstallment) || 0), 0);

  const noContracts = member && contracts.length === 0;
  const contractClosed = contract && /ปิดบัญชี/.test(contract.status);

  const build = () => ({
    id: requestNo, recordDate,
    memberCode: member.code, memberName: member.name,
    dept: member.dept, deptCode: member.deptCode,
    contractNo, loanType: contract.loanType,
    lastTerm: contract.lastTerm, approved: contract.approved,
    pendingDisburse: contract.pendingDisburse, remaining: contract.remaining,
    interestDue: contract.interestDue,
    projectId, projectName: project ? project.name : '', projectType: project ? project.type : '',
    isR, skipCalc, banNewLoans: !!(project && project.settings.banNewLoans),
    income: { ...income }, deduct: { ...deduct },
    months: skipCalc ? 0 : (Number(months) || 0), startMonth, payMode,
    perInstallment: perInstNum, payTerms: Number(payTerms) || 0,
    note: note.trim(),
    schedule: skipCalc ? [] : schedule.map(r => ({ ...r })),
    status: 'recorded',
    enteredBy: window.DS_USER, enteredAt: new Date().toISOString().slice(0, 19),
  });

  const validate = () => {
    if (!member) { setError('กรุณาระบุเลขทะเบียนสมาชิกก่อนบันทึก'); return false; }
    if (!contract) { setError('กรุณาเลือกเลขสัญญาเงินกู้ที่ต้องการพักชำระ'); return false; }
    if (!projectId) { setError('กรุณาเลือกโครงการพักชำระหนี้'); return false; }
    if (!(contract.remaining > 0)) { setError('สัญญานี้ไม่มียอดหนี้คงเหลือ — ไม่สามารถพักชำระได้'); return false; }
    if (contractClosed) { setError('สัญญานี้อยู่ในสถานะปิดบัญชี — ไม่สามารถพักชำระได้'); return false; }
    if (collateralBlocked) { setError('หลักประกันบกพร่อง — ต้องทำรายการผู้ค้ำให้เรียบร้อยก่อนพักชำระ'); return false; }
    if (projectUsed) { setError('สัญญานี้เคยใช้สิทธิโครงการนี้แล้ว — ใช้สิทธิได้ 1 ครั้งตลอดอายุสัญญา'); return false; }
    if (balanceNeg) { setError('ยอดเงินเดือนคงเหลือติดลบ — ไม่สามารถบันทึกได้ (โครงการบริหารจัดการหนี้)'); return false; }
    if (skipCalc) return true;                            // สัญญา R — บันทึกได้ทันที
    if (!(Number(months) > 0)) { setError('กรุณาเลือกจำนวนเดือนพักชำระ'); return false; }
    if (!startMonth) { setError('กรุณาระบุเดือน/งวดเริ่มต้นที่มีผลพักชำระ'); return false; }
    if (!payMode) { setError('กรุณาเลือกรูปแบบการพักชำระ'); return false; }
    if (schedule.length === 0) { setError('กรุณากด “คำนวณ” หรือเพิ่มอย่างน้อย 1 รายการในตารางการชำระหนี้'); return false; }
    return true;
  };
  const submit = () => { if (validate()) onSubmit(build()); };

  const reset = () => {
    setMember(null); setContractNo(''); setProjectId(''); setError('');
    setIncome(zeroMap(window.DS_INCOME_FIELDS)); setDeduct(zeroMap(window.DS_DEDUCT_FIELDS));
    setUpdatedDate(null); setMonths(6); setStartMonth(''); setPayMode('waive-principal');
    setPerInstallment(''); setPayTerms(''); setNote(''); setSchedule([]);
  };

  return (
    <div data-screen-label="หน้าบันทึกใบคำขอพักชำระหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ใบคำขอพักชำระหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิกและสัญญา · ตรวจรายได้/รายการหัก · กำหนดเงื่อนไขและตารางพักชำระหนี้
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" /> ค้นหาสัญญา</button>
        <button className="btn sm" onClick={compute}><Icon name="refresh" /> คำนวณ</button>
        <button className="btn sm" onClick={reset}><Icon name="close" size={13} /> ล้างค่า</button>
        <button className="btn sm" disabled><Icon name="print" /> พิมพ์</button>
        <button className="btn primary sm" onClick={submit} disabled={hardBlocked}><Icon name="check" /> บันทึก</button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── A. ข้อมูลคำขอ / รายละเอียดสมาชิกและสัญญา ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลคำขอ / รายละเอียดสมาชิกและสัญญา</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>เลขที่เปลี่ยนแปลง <b className="mono" style={{ color: 'var(--text)' }}>{requestNo}</b></span>
          </div>
        </div>

        <div className="form-grid cols-3">
          <DnField label="เลขที่เปลี่ยนแปลง" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono ds-auto-field" value="Auto" readOnly />
          </DnField>
          <DnField label="วันที่ขอเปลี่ยนแปลง" required>
            <ErpDate value={recordDate} onChange={(v) => ((e) => setRecordDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
          <DnField label="ผู้ป้อน" hint="(ล็อกอิน)">
            <input className="cfg-input sr-readonly" value={window.DS_USER} readOnly />
          </DnField>
        </div>

        <div className="form-grid cols-3" style={{ marginTop: 14 }}>
          <DnField label="เลขทะเบียน" required hint="(คลิกเพื่อค้นหา)">
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
                  <span className="muted">คลิกเพื่อค้นหาสัญญา / เลขสมาชิก</span>
                  <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                </>
              )}
            </button>
          </DnField>
          <DnField label="ชื่อ-ชื่อสกุล" span={2}>
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
        </div>

        <div className="form-grid cols-3" style={{ marginTop: 14 }}>
          <DnField label="เลขสัญญา" required>
            <select className="cfg-input mono" value={contractNo} onChange={(e) => { setContractNo(e.target.value); setError(''); }}
                    disabled={!member || noContracts}>
              {!member && <option value="">— เลือกสมาชิกก่อน —</option>}
              {noContracts && <option value="">— ไม่มีสัญญาเงินกู้ —</option>}
              {contracts.map(d => <option key={d.contractNo} value={d.contractNo}>{d.contractNo} · {d.type}</option>)}
            </select>
          </DnField>
          <DnField label="ประเภทเงินกู้">
            <input className="cfg-input sr-auto" value={contract ? contract.loanType : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
          <DnField label="งวดชำระล่าสุด">
            <input className="cfg-input mono sr-auto" value={contract ? `${contract.lastTerm} / ${contract.totalTerms}` : ''} readOnly placeholder="—" />
          </DnField>
        </div>

        <div className="form-grid cols-4" style={{ marginTop: 14 }}>
          <DnField label="ยอดอนุมัติ">
            <input className="cfg-input mono sr-auto ds-money" value={contract ? fmt.money(contract.approved, 2) : ''} readOnly placeholder="—" />
          </DnField>
          <DnField label="ยอดรอเบิก">
            <input className="cfg-input mono sr-auto ds-money" value={contract ? fmt.money(contract.pendingDisburse, 2) : ''} readOnly placeholder="—" />
          </DnField>
          <DnField label="ยอดคงเหลือ">
            <input className="cfg-input mono sr-auto ds-money" value={contract ? fmt.money(contract.remaining, 2) : ''} readOnly placeholder="—" />
          </DnField>
          <DnField label="ดอกเบี้ยค้าง">
            <input className="cfg-input mono sr-auto ds-money" value={contract ? fmt.money(contract.interestDue, 2) : ''} readOnly placeholder="—" />
          </DnField>
        </div>

        {noContracts && (
          <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>สมาชิกรายนี้ไม่มีสัญญาเงินกู้คงค้าง — ไม่สามารถบันทึกคำขอพักชำระหนี้ได้</span>
          </div>
        )}
        {contractClosed && (
          <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>สัญญานี้อยู่ในสถานะปิดบัญชี — ไม่สามารถพักชำระได้</span>
          </div>
        )}
      </div>

      {/* ── โครงการพักชำระหนี้ + เงื่อนไขการเข้าร่วม ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>โครงการพักชำระหนี้</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <a href="#debt/suspension-project" style={{ fontSize: 11.5, color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="cog" size={12} /> ตั้งค่าโครงการ</a>
          </div>
        </div>
        <div className="form-grid cols-2">
          <DnField label="เลือกโครงการ" required>
            <select className="cfg-input" value={projectId} onChange={(e) => { setProjectId(e.target.value); setError(''); }}>
              <option value="">— เลือกโครงการพักชำระหนี้ —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
            </select>
          </DnField>
          <DnField label="ประเภทโครงการ">
            <input className="cfg-input sr-auto" value={project ? window.dspType(project.type).l : ''} readOnly placeholder="(เลือกโครงการ)" />
          </DnField>
        </div>
        {project && (
          <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0' }}>
            <Icon name="info" size={11} /> {project.settings.description || window.dspType(project.type).desc}
          </p>
        )}
        {project && (
          <div className="ds-rule-chips">
            {project.settings.oncePerContract && <span className="chip warning">1 ครั้ง/สัญญาตลอดอายุ</span>}
            {project.settings.banNewLoans && <span className="chip warning">เข้าร่วมแล้วงดกู้ทุกประเภท</span>}
            {project.settings.requireNonNegativeBalance && <span className="chip warning">รายได้คงเหลือต้องไม่ติดลบ</span>}
            {project.settings.skipCalculation && <span className="chip primary">บันทึกได้ทันที (ไม่คำนวณ)</span>}
            {isR && <span className="chip primary">สัญญา R</span>}
          </div>
        )}
        {collateralBlocked && (
          <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>หลักประกันบกพร่อง: {defect.reason} · {defect.guarantor} — ต้องทำรายการให้เรียบร้อยก่อนพักชำระ ({defect.action})</span>
          </div>
        )}
        {projectUsed && (
          <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>สัญญา {contractNo} เคยใช้สิทธิ “{project.name}” แล้ว — โครงการนี้ใช้สิทธิได้ 1 ครั้งตลอดอายุสัญญา</span>
          </div>
        )}
        {project && project.settings.banNewLoans && !collateralBlocked && !projectUsed && (
          <div className="dn-status-alert" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>เมื่อบันทึกเข้าร่วมโครงการนี้ ระบบจะงดกู้ทุกประเภทให้สมาชิกโดยอัตโนมัติ</span>
          </div>
        )}
      </div>

      {/* ── B. รายละเอียดเงินเดือน / ความสามารถในการชำระ ── */}
      {!skipCalc && (
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>รายละเอียดเงินเดือน / ความสามารถในการชำระ</h3>
          {updatedDate && (
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <span className="chip info"><Icon name="download" size={11} /> ดึงข้อมูลรายได้ ณ {fmt.date(updatedDate)}</span>
            </div>
          )}
        </div>

        <div className="ds-payroll-grid">
          <div className="ds-payroll-col">
            <div className="ds-payroll-head income"><Icon name="wallet" size={14} /> รายการเงินได้</div>
            {window.DS_INCOME_FIELDS.map(f => (
              <DsAmtRow key={f.k} field={f} value={income[f.k]} onChange={setInc} readOnly={!member} />
            ))}
          </div>
          <div className="ds-payroll-col">
            <div className="ds-payroll-head deduct"><Icon name="receipt" size={14} /> รายการเงินหัก</div>
            {window.DS_DEDUCT_FIELDS.map(f => (
              <DsAmtRow key={f.k} field={f} value={deduct[f.k]} onChange={setDed} readOnly={!member} />
            ))}
          </div>
        </div>

        <div className="ds-sum-strip">
          <DsSumTile icon="wallet" label="รวมเงินได้" value={sumInc} tone="income" />
          <DsSumTile icon="receipt" label="รวมเงินหัก" value={sumDed} tone="deduct" />
          <DsSumTile icon="upload" label="ยอดส่งใหม่" value={newSend} tone="info" />
          <DsSumTile icon="money" label="ดอกเบี้ย (คงต้น)" value={interestKeep} tone="warn" />
          <DsSumTile icon="check" label="รายได้คำนวณ" value={netCalc} tone="net" />
        </div>
        {contract && (
          <div className={'ds-capacity ' + (capacityOk ? 'ok' : 'bad')}>
            <Icon name={capacityOk ? 'check' : 'info'} size={13} />
            <span>
              {capacityOk
                ? <>รายได้คำนวณ <b>{fmt.money(netCalc, 2)}</b> เพียงพอต่อยอดส่งใหม่ <b>{fmt.money(newSend, 2)}</b> บาท/เดือน</>
                : <>รายได้คำนวณ <b>{fmt.money(netCalc, 2)}</b> ไม่เพียงพอต่อยอดส่งใหม่ <b>{fmt.money(newSend, 2)}</b> บาท/เดือน — ควรพิจารณาเงื่อนไขเพิ่มเติม</>}
            </span>
          </div>
        )}
      </div>
      )}

      {/* ── C. เงื่อนไขพักชำระ + ตารางการชำระหนี้ ── */}
      {skipCalc ? (
        <DsImmediateCard contract={contract} note={note} setNote={setNote} />
      ) : (
      <div className="ds-bottom-grid" style={{ marginTop: 12 }}>
        {/* เงื่อนไข */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>รายละเอียดสัญญา (เงื่อนไขการพักชำระหนี้)</h3>
          </div>
          <div className="form-grid cols-3">
            <DnField label="จำนวนเดือน" required>
              <select className="cfg-input" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                {window.DS_MONTH_OPTIONS.map(m => <option key={m} value={m}>{m} เดือน</option>)}
              </select>
            </DnField>
            <DnField label="ตั้งแต่เดือน" required>
              <select className="cfg-input" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} disabled={!member}>
                <option value="">— เลือกเดือน —</option>
                {monthOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </DnField>
            <DnField label="ชำระแบบ" hint="(ตามสัญญาเดิม)">
              <input className="cfg-input sr-auto" value={repayType} readOnly placeholder="(ดึงตามสัญญา)" />
            </DnField>
          </div>
          <div className="form-grid cols-3" style={{ marginTop: 14 }}>
            <DnField label="สถานะ" hint="(รูปแบบการชำระคืน)">
              <input className="cfg-input mono sr-readonly ds-status-code" value={contract ? `${rmode.code} : ${rmode.l}` : ''} readOnly placeholder="—" />
            </DnField>
            <DnField label="ชำระ/งวด">
              <div className="icr-suffix">
                <input className="cfg-input mono" type="number" min="0" step="0.01" value={perInstallment}
                       onChange={(e) => setPerInstallment(e.target.value)} disabled={!contract} placeholder="0.00" />
                <span className="icr-suffix-u">บาท</span>
              </div>
            </DnField>
            <DnField label="งวดชำระ">
              <div className="icr-suffix">
                <input className="cfg-input mono" type="number" min="0" value={payTerms}
                       onChange={(e) => setPayTerms(e.target.value)} disabled={!contract} placeholder="0" />
                <span className="icr-suffix-u">งวด</span>
              </div>
            </DnField>
          </div>
          <DnField label="หมายเหตุ" full hint="(เหตุผลประกอบการอนุมัติ)">
            <textarea className="cfg-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="เช่น พักชำระต้นเงิน 6 เดือน คงชำระดอกเบี้ยตามปกติ · อ้างมติที่ประชุม คกก. ครั้งที่ …" />
          </DnField>
          <p className="muted" style={{ fontSize: 11.5, margin: '4px 0 0' }}>
            <Icon name="info" size={11} /> {rmode.desc}
          </p>
        </div>

        {/* ตารางการชำระหนี้ */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ตารางการชำระหนี้</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn sm" onClick={addRow} disabled={!contract}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
              <button className="btn sm danger" onClick={() => setSchedule([])} disabled={schedule.length === 0}><Icon name="close" size={12} /> ลบทั้งหมด</button>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ds-sched-tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 56 }}>ลำดับ</th>
                  <th className="center">ตั้งแต่งวด</th>
                  <th className="center">ถึงงวด</th>
                  <th className="num">ชำระต่องวด</th>
                  <th className="num">ผ่อนดอกเบี้ยค้าง</th>
                  <th className="center">วันที่ป้อน</th>
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {schedule.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state" style={{ padding: '20px 8px' }}>
                    เลือกสมาชิกและสัญญา แล้วระบุ“จำนวนเดือน” — ระบบจะสร้างตารางให้อัตโนมัติ
                  </td></tr>
                ) : schedule.map((r, i) => (
                  <tr key={i}>
                    <td className="center mono">{i + 1}</td>
                    <td className="center"><input className="cfg-input mono ds-cell" type="number" value={r.from} onChange={(e) => setRow(i, 'from', e.target.value)} /></td>
                    <td className="center"><input className="cfg-input mono ds-cell" type="number" value={r.to} onChange={(e) => setRow(i, 'to', e.target.value)} /></td>
                    <td className="num"><input className="cfg-input mono ds-cell num" type="number" step="0.01" value={r.perInstallment} onChange={(e) => setRow(i, 'perInstallment', e.target.value)} /></td>
                    <td className="num"><input className="cfg-input mono ds-cell num" type="number" step="0.01" value={r.interestInstallment} onChange={(e) => setRow(i, 'interestInstallment', e.target.value)} /></td>
                    <td className="center"><ErpDate value={r.enteredDate} onChange={(v) => ((e) => setRow(i, 'enteredDate', e.target.value))({ target: { value: v } })} className="cfg-input ds-cell" /></td>
                    <td className="center">
                      <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delRow(i)} title="ลบรายการ"><Icon name="close" size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {schedule.length > 0 && (
                <tfoot>
                  <tr className="ds-sched-tot">
                    <td colSpan="3" className="right">รวม</td>
                    <td className="num mono">{fmt.money(schedTotalPer, 2)}</td>
                    <td className="num mono">{fmt.money(schedTotalInt, 2)}</td>
                    <td colSpan="2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
            <Icon name="info" size={11} /> ระบบสร้างตารางให้อัตโนมัติตามจำนวนเดือนที่เลือก · แก้ไขช่วงงวด/ยอดในตารางได้โดยตรง · ต้องมีอย่างน้อย 1 รายการก่อนบันทึก
          </p>
        </div>
      </div>
      )}

      {modal && <ContractSearchModal onPick={pickContractRow}
        onClose={() => setModal(false)} debtsOf={window.dsMemberContracts} />}
      <DsTodayBadge />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับ list / form / detail
// ════════════════════════════════════════════════════════════════════
function DebtSuspensionPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.dsLoad);
  const [mode, setMode] = useState('list');
  const [current, setCurrent] = useState(null);
  const [histOpen, setHistOpen] = useState(false);

  const persist = (next) => { setList(next); window.dsSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const submit = (rec) => {
    persist([rec, ...list]);
    const pm = window.dsPayMode(rec.payMode);
    const summary = rec.skipCalc
      ? `บันทึกพักชำระหนี้สัญญา R ${rec.id} · สัญญา ${rec.contractNo} · บันทึกทันที (ไม่คำนวณ)`
      : `บันทึกคำขอพักชำระหนี้ ${rec.id} · สัญญา ${rec.contractNo} · ${pm.l} ${rec.months} เดือน`;
    audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ใบคำขอพักชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary,
      changes: [
        { field: 'โครงการ', before: '—', after: rec.projectName || '—' },
        { field: 'รูปแบบพักชำระ', before: '—', after: rec.skipCalc ? 'บันทึกทันที (สัญญา R)' : pm.l },
        ...(rec.skipCalc ? [] : [{ field: 'จำนวนเดือน', before: '—', after: `${rec.months} เดือน` },
           { field: 'เริ่มมีผล', before: '—', after: window.dsMonthLabel(rec.startMonth) }]),
        ...(rec.banNewLoans ? [{ field: 'สถานะการกู้', before: '—', after: 'งดกู้ทุกประเภท' }] : []),
      ],
    });
    onToast && onToast(`บันทึกคำขอพักชำระหนี้ ${rec.id} · ${rec.memberName} เรียบร้อยแล้ว`);
    setMode('list');
  };

  const markEffective = (rec) => {
    const updated = { ...rec, status: 'effective' };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ใบคำขอพักชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `คำขอพักชำระหนี้ ${rec.id} มีผลบังคับใช้`,
      changes: [{ field: 'สถานะคำขอ', before: 'บันทึกแล้ว', after: 'มีผลแล้ว' }],
    });
    onToast && onToast(`คำขอ ${rec.id} มีผลบังคับใช้แล้ว`);
  };

  const cancelRec = (rec) => {
    const updated = { ...rec, status: 'cancelled' };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ใบคำขอพักชำระหนี้',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ยกเลิกคำขอพักชำระหนี้ ${rec.id}`,
      changes: [{ field: 'สถานะคำขอ', before: 'บันทึกแล้ว', after: 'ยกเลิก' }],
    });
    onToast && onToast(`ยกเลิกคำขอ ${rec.id} แล้ว`);
  };

  return (
    <>
      {mode === 'list'
        ? <DsListView list={list} onCreate={() => setMode('form')} onOpen={openDetail}
                      onOpenHistory={() => setHistOpen(true)} />
        : mode === 'detail'
          ? <DsDetailView rec={current} onBack={() => setMode('list')} onMarkEffective={markEffective} onCancel={cancelRec} />
          : <DsCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} onToast={onToast} />}
      {histOpen && <DsHistoryDrawer onClose={() => setHistOpen(false)} />}
    </>
  );
}

Object.assign(window, { DsCreateForm, DsAmtRow, DsSumTile, DebtSuspensionPage });
