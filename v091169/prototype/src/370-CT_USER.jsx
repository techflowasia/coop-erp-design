// ════════════════════════════════════════════════════════════════════
//  บอกเลิกสัญญา — แบบฟอร์มบันทึกรายการบอกเลิกสัญญา (CtCreateForm)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  เปิดจากรายการ "สัญญาผิดนัดชำระ" (worklist) — ดึงข้อมูลผู้กู้/สัญญา/ผู้ค้ำ
// ════════════════════════════════════════════════════════════════════

const CT_USER = 'จันทร์เพ็ญ มาลี';

// ─── Popup ค้นหาสัญญาผิดนัดชำระ ─────────────────────────────────────
function CtContractSearchModal({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const results = window.ctSearchContracts(q).filter(c => c.status !== 'issued');
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสัญญาผิดนัดชำระ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)}
                   placeholder="ค้นหาเลขที่สัญญา, รหัสสมาชิก, ชื่อ-สกุล, หน่วยงาน…" />
          </div>
          <div className="gc-sub-title" style={{ marginTop: 0 }}>
            สัญญาที่ผิดนัดชำระ <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>สัญญา</th><th>ผู้กู้ลูกหนี้</th><th>ประเภท</th>
                  <th className="center">งวดค้าง</th><th className="num">คงเหลือ</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่พบสัญญาที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map(c => {
                  const tot = window.ctContractTotal(c);
                  return (
                    <tr key={c.contractNo} className="clickable" onClick={() => onPick(c)}>
                      <td className="mono">{c.contractNo}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="row-avatar">{c.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ whiteSpace: 'nowrap' }}>{c.memberName}</div>
                            <div className="muted mono" style={{ fontSize: 10 }}>{c.memberCode} · {c.dept}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{c.loanType}</td>
                      <td className="center"><b style={{ color: 'var(--danger)' }}>{c.overdueInstallments}</b> งวด</td>
                      <td className="num">{fmt.money(tot, 0)}</td>
                      <td className="center">
                        <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                onClick={(e) => { e.stopPropagation(); onPick(c); }} title="เลือกสัญญา">
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
//  แบบฟอร์มบันทึกรายการบอกเลิกสัญญา
// ════════════════════════════════════════════════════════════════════
function CtCreateForm({ list, seedContract, onSubmit, onCancel }) {
  const [regDate, setRegDate] = useState(window.dnToday);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  // ผู้กู้ลูกหนี้ที่เลือก (อ้างอิงจากสัญญาแรกที่หยิบเข้ามา)
  const [member, setMember] = useState(null);
  // สัญญาผิดนัดของผู้กู้รายนี้ (selectable)
  const [contracts, setContracts] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [heirs, setHeirs] = useState([]);

  // กรณีบอกเลิก
  const [caseCode, setCaseCode] = useState('TC04');
  const [caseOther, setCaseOther] = useState('');
  const [collectStartDate, setCollectStartDate] = useState(window.dnToday);
  const [resolutionNo, setResolutionNo] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');

  // ที่อยู่จัดส่ง
  const [useOtherAddress, setUseOtherAddress] = useState(false);
  const [sendAddress, setSendAddress] = useState('');

  // ผู้ลงนาม
  const [signer, setSigner] = useState(window.CT_SIGNERS[0].name);
  const [signerPosition, setSignerPosition] = useState(window.CT_SIGNERS[0].position);
  const [emsNo, setEmsNo] = useState('');

  const beYear = window.dnBeYear(regDate);
  const trackingNo = useMemo(() => window.ctNextTracking(list, beYear), [list, beYear]);
  const docNo = useMemo(() => window.ctNextDocNo(list, beYear), [list, beYear]);

  const caseDef = window.ctCase(caseCode) || {};
  const selected = contracts.filter(c => c.selected);
  const totalOutstanding = selected.reduce((s, c) => s + window.ctContractTotal(c), 0);

  const guarantorsFromContracts = (cs) => {
    const out = [];
    cs.filter(c => c.selected).forEach(c => {
      (c.guarantors || []).forEach(g => out.push({ ...g, contractNo: c.contractNo }));
    });
    return out;
  };

  // หยิบสัญญาผิดนัด → ดึงผู้กู้ + สัญญาผิดนัดทั้งหมดของผู้กู้รายเดียวกัน
  const pickContract = (c) => {
    setModal(false); setError('');
    const sameMember = window.CT_DEFAULTED.filter(x => x.memberCode === c.memberCode && x.status !== 'issued');
    const cs = sameMember.map(x => ({ ...x, selected: x.contractNo === c.contractNo }));
    setMember(c);
    setContracts(cs);
    setGuarantors(guarantorsFromContracts(cs));
    setHeirs((c.heirs || []).map(h => ({ ...h })));
    // เลือกกรณี + ที่อยู่ตั้งต้นตามสถานะสมาชิก
    if (c.memberStatus === 'เสียชีวิต') setCaseCode('TC03');
    else if (c.memberStatus === 'ลาออก' || c.memberStatus === 'เกษียณ' || c.memberStatus === 'พ้นสภาพ') setCaseCode('TC02');
    else if (c.memberStatus === 'ถูกให้ออก') setCaseCode('TC08');
    else if (c.restructured) setCaseCode('TC07');
    else setCaseCode('TC04');
    setCollectStartDate(window.dnToday());
  };

  // โหลดสัญญาตั้งต้นจาก worklist (ถ้าเปิดฟอร์มผ่าน "ทำรายการบอกเลิก")
  useEffect(() => { if (seedContract) pickContract(seedContract); }, []); // eslint-disable-line

  const toggleContract = (no) => {
    setError('');
    setContracts(cs => cs.map(c => c.contractNo === no ? { ...c, selected: !c.selected } : c));
  };
  // ดึงผู้ค้ำใหม่จากรายละเอียดสัญญาที่เลือก (แก้ไขรายชื่อไม่ได้ — ดึงจากสัญญาเท่านั้น)
  const reloadGuarantors = () => setGuarantors(guarantorsFromContracts(contracts));
  // เปลี่ยนเฉพาะ “ฐานะ/คำนำหน้า” ของผู้ค้ำ (เพิ่ม/ลบแถวไม่ได้)
  const setGuarantor = (i, k, v) => setGuarantors(g => g.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const changeSigner = (name) => {
    setSigner(name);
    const s = window.CT_SIGNERS.find(x => x.name === name);
    if (s) setSignerPosition(s.position);
  };

  const ms = member ? (window.CT_MEMBER_STATUS[member.memberStatus] || { pill: 'neutral', warn: false }) : null;


  const build = () => ({
    id: trackingNo, docNo,
    regDate,
    memberCode: member.memberCode, memberName: member.memberName, citizenId: member.citizenId,
    dept: member.dept, deptCode: member.deptCode, shares: member.shares, memberStatus: member.memberStatus,
    caseCode, caseOther: caseCode === 'TC99' ? caseOther.trim() : '',
    collectStartDate,
    resolutionNo: caseDef.requiresResolution ? resolutionNo.trim() : resolutionNo.trim(),
    resolutionDate: caseDef.requiresResolution ? resolutionDate : resolutionDate,
    useOtherAddress, regAddress: member.regAddress || '',
    sendAddress: useOtherAddress ? sendAddress.trim() : '',
    signer, signerPosition,
    contracts: selected.map(c => ({
      contractNo: c.contractNo, loanType: c.loanType, contractDate: c.contractDate,
      principalRemaining: c.principalRemaining, interestDue: c.interestDue, penalty: c.penalty,
      overdueInstallments: c.overdueInstallments,
      guarantors: guarantors.filter(g => g.contractNo === c.contractNo && g.name.trim())
        .map(g => ({ ...g, name: g.name.trim() })),
    })),
    heirs: caseDef.heir ? heirs.filter(h => h.name.trim()).map(h => ({ ...h, name: h.name.trim(), prefix: 'ทายาท ' })) : [],
    totalOutstanding,
    status: 'draft', printCount: 0, printedDate: null, sentDate: null,
    emsNo: emsNo.trim(), closedDate: null,
    enteredBy: CT_USER, enteredAt: new Date().toISOString().slice(0, 19),
  });

  const validate = () => {
    if (!member) { setError('กรุณาเลือกสัญญาผิดนัดชำระจากรายการก่อนบันทึก'); return false; }
    if (selected.length === 0) { setError('กรุณาเลือกสัญญาที่จะบอกเลิกอย่างน้อย 1 รายการ (BR-01)'); return false; }
    if (totalOutstanding <= 0) { setError('ยอดหนี้คงเหลือต้องมากกว่า 0 จึงจะบอกเลิกสัญญาได้ (BR-02)'); return false; }
    if (caseCode === 'TC99' && !caseOther.trim()) { setError('กรุณาระบุรายละเอียดกรณีบอกเลิก “อื่น ๆ”'); return false; }
    if (caseDef.requiresResolution && (!resolutionNo.trim() || !resolutionDate)) {
      setError('กรณีบอกเลิกนี้ต้องอ้างอิงมติ คสอ. — กรุณากรอกเลขที่มติและวันที่มติ (BR-05)'); return false;
    }
    if (resolutionDate && resolutionDate > regDate) { setError('วันที่มติต้องไม่มากกว่าวันที่รายการ'); return false; }
    if (useOtherAddress && !sendAddress.trim()) { setError('เลือกใช้ที่อยู่อื่นนอกทะเบียน — กรุณากรอกที่อยู่จัดส่งให้ครบถ้วน (BR-04)'); return false; }
    if (!signer) { setError('กรุณาเลือกผู้ลงนามในหนังสือ'); return false; }
    return true;
  };
  const submit = (alsoPrint) => { if (validate()) onSubmit(build(), alsoPrint); };

  return (
    <div data-screen-label="หน้าบันทึกรายการบอกเลิกสัญญา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บอกเลิกสัญญา — บันทึกรายการ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เลือกสัญญาผิดนัดชำระ · ระบุกรณีบอกเลิก มติ คสอ. ที่อยู่จัดส่ง และผู้ลงนาม แล้วจัดทำหนังสือบอกเลิกสัญญา
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับรายการสัญญาผิดนัด</button>
        <button className="btn sm" onClick={() => submit(true)}><Icon name="print" /> บันทึก + พิมพ์หนังสือ</button>
        <button className="btn primary sm" onClick={() => submit(false)}><Icon name="check" /> บันทึกรายการ</button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ส่วนที่ 1: ข้อมูลเอกสาร ── */}
      <div className="search-card sr-sys">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลเอกสาร</h3>
        </div>
        <div className="dn-doc-grid">
          <DnField label="ทะเบียนติดตาม / บอกเลิก" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={trackingNo} readOnly />
          </DnField>
          <DnField label="เลขที่หนังสือ" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={docNo} readOnly />
          </DnField>
          <DnField label="สถานะรายการ">
            <input className="cfg-input sr-readonly" value="ร่าง" readOnly />
          </DnField>
          <DnField label="วันที่รายการ" required>
            <ErpDate value={regDate} onChange={(v) => ((e) => setRegDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
          <DnField label="ผู้บันทึก" hint="(ล็อกอิน)">
            <input className="cfg-input sr-readonly" value={CT_USER} readOnly />
          </DnField>
          <DnField label="ค้นหา / เปลี่ยนสัญญาผิดนัด">
            <div className="sr-pick-field" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.contractNo : ''} readOnly
                     placeholder="คลิกเพื่อค้นหาสัญญา" />
              <Icon name="search" size={14} />
            </div>
          </DnField>
        </div>
      </div>

      {/* ── ส่วนที่ 2 + 3: ผู้ลงนาม + ข้อมูลสมาชิก/ลูกหนี้ ── */}
      <div className="dn-two-col">
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ข้อมูลผู้กู้ / ลูกหนี้</h3>
            {member && (
              <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
                <span className={'pill ' + ms.pill}>สถานะสมาชิก: {member.memberStatus}</span>
              </div>
            )}
          </div>
          <div className="dn-member-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <DnField label="ทะเบียนสมาชิก">
              <input className="cfg-input mono sr-auto" value={member ? member.memberCode : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
            </DnField>
            <DnField label="ชื่อ-ชื่อสกุล">
              <input className="cfg-input sr-auto" value={member ? member.memberName : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
            </DnField>
            <DnField label="สังกัด">
              <input className="cfg-input sr-auto" value={member ? `${member.deptCode} · ${member.dept}` : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
            </DnField>
            <DnField label="เลขบัตรประชาชน">
              <input className="cfg-input mono sr-auto" value={member ? member.citizenId : ''} readOnly placeholder="—" />
            </DnField>
          </div>

          {/* ที่อยู่จัดส่ง (BR-04) */}
          <div className="ct-addr-block">
            <DnField label="ที่อยู่ตามทะเบียนสมาชิก" full>
              <textarea className="cfg-input sr-auto ct-addr-ta" rows="2" readOnly
                        value={member ? (member.regAddress || '—') : ''} placeholder="(ดึงอัตโนมัติจากทะเบียนสมาชิก)" />
            </DnField>
            <label className="ct-addr-check">
              <input type="checkbox" className="ch-box" checked={useOtherAddress}
                     onChange={(e) => { setUseOtherAddress(e.target.checked); setError(''); }} />
              <span>ที่อยู่อื่น นอกทะเบียนสมาชิก (สำหรับจัดส่งหนังสือ)</span>
            </label>
            {useOtherAddress && (
              <DnField label="รายละเอียดที่อยู่จัดส่ง" required full>
                <textarea className="cfg-input ct-addr-ta" rows="2" value={sendAddress}
                          onChange={(e) => { setSendAddress(e.target.value); setError(''); }}
                          placeholder="กรอกที่อยู่จัดส่งหนังสือบอกเลิกสัญญา" />
              </DnField>
            )}
          </div>

          {member && ms.warn && (
            <div className="dn-status-alert">
              <Icon name="info" size={15} />
              <span>ผู้กู้อยู่ในสถานะ <b>“{member.memberStatus}”</b> — ตรวจสอบเอกสาร ผู้ค้ำประกัน{caseDef.heir ? ' / ทายาท' : ''} และที่อยู่จัดส่งก่อนพิมพ์หนังสือ</span>
            </div>
          )}
        </div>

        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ผู้ลงนามในหนังสือ</h3>
          </div>
          <div className="dn-signer-grid">
            <DnField label="ผู้ลงนาม" required full>
              <select className="cfg-input" value={signer} onChange={(e) => changeSigner(e.target.value)}>
                {window.CT_SIGNERS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </DnField>
            <DnField label="ตำแหน่ง" hint="(แสดงอัตโนมัติ · แก้ไขได้)" full>
              <input className="cfg-input" value={signerPosition} onChange={(e) => setSignerPosition(e.target.value)} />
            </DnField>
          </div>
          <div className="dn-outstanding-box">
            <div className="dn-ob-label">หนี้คงเหลือรวม (สัญญาที่บอกเลิก)</div>
            <div className="dn-ob-value">฿ {fmt.money(totalOutstanding, 2)}</div>
            <div className="dn-ob-sub">เลือก {selected.length} สัญญา · ผู้ค้ำประกัน {guarantors.filter(g => g.name && g.name.trim()).length} ราย</div>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 4: ข้อมูลการบอกเลิก ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลการบอกเลิก</h3>
        </div>
        <div className="ct-case-grid">
          <DnField label="กรณีบอกเลิก" required>
            <select className="cfg-input" value={caseCode} onChange={(e) => { setCaseCode(e.target.value); setError(''); }}>
              {window.CT_CASES.filter(c => c.active).map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </DnField>
          <DnField label="วันที่เริ่มเก็บ" required hint="(เริ่มเรียกเก็บ/ดำเนินการ)">
            <ErpDate value={collectStartDate} onChange={(v) => ((e) => setCollectStartDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
          <DnField label={'มติ คสอ.' + (caseDef.requiresResolution ? '' : ' (ถ้ามี)')} required={caseDef.requiresResolution}>
            <input className="cfg-input" value={resolutionNo} onChange={(e) => { setResolutionNo(e.target.value); setError(''); }}
                   placeholder="เช่น คสอ. 4/2569" />
          </DnField>
          <DnField label={'วันที่มติ' + (caseDef.requiresResolution ? '' : ' (ถ้ามี)')} required={caseDef.requiresResolution}>
            <ErpDate value={resolutionDate} onChange={(v) => ((e) => { setResolutionDate(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
          </DnField>
          {caseCode === 'TC99' && (
            <DnField label="ระบุกรณีบอกเลิกเพิ่มเติม" required full>
              <input className="cfg-input" value={caseOther} onChange={(e) => { setCaseOther(e.target.value); setError(''); }}
                     placeholder="ระบุรายละเอียดกรณีบอกเลิกสัญญา" />
            </DnField>
          )}
        </div>
        {caseDef.requiresResolution && (
          <div className="dn-status-alert" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>กรณีบอกเลิกนี้ <b>ต้องอ้างอิงมติคณะกรรมการดำเนินการ (คสอ.)</b> — โปรดกรอกเลขที่มติและวันที่มติให้ครบถ้วน (BR-05)</span>
          </div>
        )}
      </div>

      {/* ── ส่วนที่ 5: ตารางสัญญาที่บอกเลิก ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>สัญญาเงินกู้ที่บอกเลิก</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              <Icon name="info" size={11} /> เลือกสัญญาที่ผิดนัดของผู้กู้รายนี้เพื่อบอกเลิก
            </span>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl dn-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th>ประเภทเงินกู้</th>
                <th>สัญญาเลขที่</th>
                <th className="center">วันที่ทำสัญญา</th>
                <th className="num">เงินต้นคงเหลือ</th>
                <th className="num">ดอกเบี้ยค้าง</th>
                <th className="num">ค่าปรับ</th>
                <th className="center">งวดค้าง</th>
                <th className="num">คงเหลือรวม</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  เลือกสัญญาผิดนัดชำระเพื่อแสดงรายการ
                </td></tr>
              ) : contracts.map(c => (
                <tr key={c.contractNo} className={c.selected ? 'dn-row-sel' : ''}>
                  <td className="center">
                    <input type="checkbox" className="ch-box" checked={c.selected} onChange={() => toggleContract(c.contractNo)} />
                  </td>
                  <td>{c.loanType}{c.restructured && <span className="chip warning" style={{ marginLeft: 6, fontSize: 10 }}>ปรับโครงสร้าง</span>}</td>
                  <td className="mono">{c.contractNo}</td>
                  <td className="center mono">{fmt.date(c.contractDate)}</td>
                  <td className="num mono">{fmt.money(c.principalRemaining, 2)}</td>
                  <td className="num mono">{fmt.money(c.interestDue, 2)}</td>
                  <td className="num mono">{fmt.money(c.penalty, 2)}</td>
                  <td className="center"><b style={{ color: 'var(--danger)' }}>{c.overdueInstallments}</b> งวด</td>
                  <td className="num mono"><b>{fmt.money(window.ctContractTotal(c), 2)}</b></td>
                </tr>
              ))}
            </tbody>
            {selected.length > 0 && (
              <tfoot>
                <tr><td colSpan="8" className="right"><b>รวมหนี้คงเหลือทั้งหมด (สัญญาที่เลือก)</b></td>
                  <td className="num mono"><b>{fmt.money(totalOutstanding, 2)}</b></td></tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ── ผู้ค้ำประกัน/ทายาท (ดึงจากรายละเอียดการทำสัญญา — เพิ่ม/ลดแถวไม่ได้ เลือกฐานะได้) ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ผู้ค้ำประกัน/ทายาท</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              <Icon name="info" size={11} /> ดึงจากรายละเอียดการทำสัญญา — เพิ่ม/ลดแถวไม่ได้ เลือกได้เฉพาะฐานะ
            </span>
            <button className="btn sm" onClick={reloadGuarantors} disabled={selected.length === 0}>
              <Icon name="refresh" size={12} /> ดึงข้อมูลจากสัญญา
            </button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl dn-guar-tbl">
            <thead>
              <tr>
                <th style={{ width: 44 }} className="center">ลำดับ</th>
                <th style={{ width: 130 }}>สัญญา</th>
                <th style={{ width: 120 }}>ทะเบียนสมาชิก</th>
                <th>ชื่อ-ชื่อสกุล</th>
                <th style={{ width: 180 }}>สังกัด</th>
                <th style={{ width: 150 }}>ฐานะ</th>
                <th style={{ width: 120 }} className="center">สถานะสมาชิก</th>
              </tr>
            </thead>
            <tbody>
              {guarantors.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  เลือกสัญญาเพื่อดึงผู้ค้ำประกันจากรายละเอียดการทำสัญญา
                </td></tr>
              ) : guarantors.map((g, i) => (
                <tr key={i}>
                  <td className="center">{i + 1}</td>
                  <td className="mono">{g.contractNo || '—'}</td>
                  <td className="mono">{g.memberCode || '—'}</td>
                  <td>{g.name}</td>
                  <td>{g.dept || '—'}</td>
                  <td>
                    <select className="cfg-input sm" value={g.prefix || ''} onChange={(e) => setGuarantor(i, 'prefix', e.target.value)}>
                      {window.CT_PREFIXES.map(p => <option key={p} value={p}>{p ? p.trim() : 'ผู้ค้ำประกัน'}</option>)}
                    </select>
                  </td>
                  <td className="center">
                    {g.status
                      ? <span className={'pill ' + window.ctMemberStatusPill(g.status)}>{g.status}</span>
                      : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      {modal && <CtContractSearchModal onPick={pickContract} onClose={() => setModal(false)} />}
    </div>
  );
}

Object.assign(window, { CtCreateForm, CtContractSearchModal, CT_USER });
