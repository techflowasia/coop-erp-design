// ════════════════════════════════════════════════════════════════════
//  ทะเบียนอายัดเงิน — แบบฟอร์มบันทึก + หน้าหลัก (list / form / detail)
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  ใช้ DnField / DnMemberSearchModal ร่วมกับ แจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════

let SQ_ATT_SEQ = 1, SQ_PARTY_SEQ = 1;
const sqUid = (p) => p + '-' + (Date.now().toString(36)) + '-' + (p === 'a' ? SQ_ATT_SEQ++ : SQ_PARTY_SEQ++);

// ─── การ์ดสรุปยอด (ในฟอร์ม) ─────────────────────────────────────────
function SqFormSum({ outstanding, shares, seizure }) {
  return (
    <div className="sq-seize-bar">
      <div className="sq-seize-calc">
        <span className="sq-seize-term"><i>หนี้คงค้าง</i><b className="mono">{fmt.money(outstanding, 2)}</b></span>
        <span className="sq-seize-op">−</span>
        <span className="sq-seize-term"><i>ทุนเรือนหุ้น</i><b className="mono">{fmt.money(shares, 2)}</b></span>
        <span className="sq-seize-op">=</span>
      </div>
      <div className="sq-seize-result">
        <span className="sq-seize-label">ยอดเงินอายัด</span>
        <span className="sq-seize-value mono">{fmt.money(seizure, 2)}</span>
        <span className="sq-seize-unit">บาท</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกทะเบียนอายัดเงิน
// ════════════════════════════════════════════════════════════════════
function SqCreateForm({ list, onSubmit, onCancel, onToast }) {
  const [regDate, setRegDate] = useState(window.sqToday);
  const [effectiveTo, setEffectiveTo] = useState('');
  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');

  const [deptType, setDeptType] = useState('ส่วนกลาง');
  const [cause, setCause] = useState('');
  const [causeDate, setCauseDate] = useState('');
  const [notifyGuarantor, setNotifyGuarantor] = useState(false);
  const [signer, setSigner] = useState(() => window.sqManager().name);

  const [attachments, setAttachments] = useState([]);
  const [contracts, setContracts] = useState([]);      // [{contractNo, date, selected}]
  const [parties, setParties] = useState([]);          // [{id,type,memberCode,detail}]
  const [debts, setDebts] = useState([]);              // [{typeCode,contractNo,statusCode,amount}]

  const beYear = (new Date(regDate).getFullYear()) + 543;
  const seizureNo = useMemo(() => window.sqNextSeizureNo(list), [list]);

  const signerObj = window.SQ_SIGNERS.find(s => s.name === signer) || null;
  const signerPosition = signerObj ? signerObj.position : '';

  const shares = member ? (member.shares || 0) : 0;
  const outstanding = debts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const seizure = window.sqSeizureAmount(outstanding, shares);

  // ผู้ค้ำประกันของสัญญาที่เลือก (auto)
  const selectedNos = contracts.filter(c => c.selected).map(c => c.contractNo);
  const guarantors = member ? window.sqGuarantorsOf(member, selectedNos) : [];

  // ── เลือกสมาชิก → ดึงสัญญา/หนี้/ผู้เกี่ยวข้อง ──
  const pickMember = (m) => {
    setMember(m); setModal(false); setError('');
    setContracts((m.debts || []).map(d => ({ contractNo: d.contractNo, date: window.sqContractDate(d.contractNo), selected: true })));
    setDebts(window.sqBuildDebtRows(m));
    setParties([{ id: sqUid('p'), type: 'CCM', memberCode: m.code, detail: m.name }]);
  };

  // ── เอกสารแนบ ──
  const addAtt = () => setAttachments(a => [...a, { id: sqUid('a'), text: '' }]);
  const setAtt = (id, v) => setAttachments(a => a.map(x => x.id === id ? { ...x, text: v } : x));
  const delAtt = (id) => setAttachments(a => a.filter(x => x.id !== id));

  // ── สัญญาเงินกู้ (checkbox + วันที่) ──
  const toggleContract = (no) => setContracts(cs => cs.map(c => c.contractNo === no ? { ...c, selected: !c.selected } : c));
  const setContractDate = (no, v) => setContracts(cs => cs.map(c => c.contractNo === no ? { ...c, date: v } : c));
  const allSel = contracts.length > 0 && contracts.every(c => c.selected);
  const toggleAll = () => setContracts(cs => cs.map(c => ({ ...c, selected: !allSel })));

  // ── ผู้ที่เกี่ยวข้อง ──
  const addParty = () => setParties(p => [...p, { id: sqUid('p'), type: 'CCH', memberCode: '', detail: '' }]);
  const setParty = (id, k, v) => setParties(p => p.map(x => x.id === id ? { ...x, [k]: v } : x));
  const delParty = (id) => setParties(p => p.filter(x => x.id !== id));

  // ── หนี้ค้างชำระ ──
  const addDebt = () => setDebts(d => [...d, { typeCode: 'BPN', contractNo: '-', statusCode: '-', amount: 0 }]);
  const setDebt = (i, k, v) => setDebts(d => d.map((r, idx) => idx === i ? { ...r, [k]: (k === 'amount' ? (v === '' ? 0 : Number(v)) : v) } : r));
  const delDebt = (i) => setDebts(d => d.filter((_, idx) => idx !== i));

  const reset = () => {
    setMember(null); setEffectiveTo(''); setError(''); setDeptType('ส่วนกลาง');
    setCause(''); setCauseDate(''); setNotifyGuarantor(false); setSigner(window.sqManager().name);
    setAttachments([]); setContracts([]); setParties([]); setDebts([]);
  };

  const validate = () => {
    if (!signer) { setError('กรุณาเลือกผู้ลงนามในหนังสืออายัด'); return false; }
    if (!member) { setError('กรุณาระบุเลขทะเบียนสมาชิกที่ต้องการอายัดเงิน'); return false; }
    if (!(outstanding > 0)) { setError('สมาชิกรายนี้ไม่มีหนี้คงค้าง — ไม่สามารถบันทึกการอายัดได้'); return false; }
    if (!cause) { setError('กรุณาเลือกสาเหตุที่ติดตาม/อายัด'); return false; }
    if (selectedNos.length === 0) { setError('กรุณาเลือกสัญญาเงินกู้ที่เกี่ยวข้องอย่างน้อย 1 รายการ'); return false; }
    return true;
  };

  const build = () => ({
    id: window.sqNextTrackNo(list, beYear), seizureNo, regDate, effectiveTo,
    memberCode: member.code, memberName: member.name, dept: member.dept, deptCode: member.deptCode,
    deptType, shares, outstanding,
    cause, causeDate, notifyGuarantor,
    signer, signerPosition,
    attachments: attachments.filter(a => a.text.trim()).map(a => ({ ...a })),
    contracts: contracts.map(c => ({ ...c })),
    relatedParties: parties.filter(p => p.detail.trim() || p.memberCode.trim()).map(p => ({ ...p })),
    guarantors: guarantors.map(g => ({ ...g })),
    debts: debts.map(d => ({ ...d })),
    seizureAmount: seizure,
    status: 'recorded',
    enteredBy: window.SQ_USER,
    enteredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  const submit = () => { if (validate()) onSubmit(build()); };

  const noDebt = member && outstanding === 0;

  return (
    <div data-screen-label="หน้าบันทึกทะเบียนอายัดเงิน">
      <div className="page-actions">
        <div className="sq-head-title">
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ทะเบียนอายัดเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิก · ตรวจหนี้คงค้างและทุนเรือนหุ้น · เลือกสัญญา/ผู้ค้ำ · คำนวณยอดเงินอายัดและออกหนังสืออายัด
          </div>
        </div>
        <span className="spacer" />
        <div className="sq-action-group">
          <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
          <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" /> ค้นหาสมาชิก</button>
          <button className="btn sm" onClick={reset}><Icon name="close" size={13} /> ล้างค่า</button>
          <button className="btn sm" disabled><Icon name="print" /> พิมพ์อายัด</button>
          <button className="btn sm" disabled><Icon name="print" /> พิมพ์สำเนา</button>
          <button className="btn primary sm" onClick={submit}><Icon name="check" /> บันทึก</button>
        </div>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── A. ข้อมูลการอายัดเงิน / ข้อมูลหลัก ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลการอายัดเงิน / ข้อมูลหลัก</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>เลขที่อายัด <b className="mono" style={{ color: 'var(--text)' }}>{seizureNo}</b></span>
          </div>
        </div>

        {/* ผู้ลงนาม + แจ้งผู้ค้ำ */}
        <div className="form-grid cols-3">
          <DnField label="ผู้ลงนาม" required hint="(ผู้จัดการสหกรณ์ · ดึงอัตโนมัติ)">
            <input className="cfg-input sr-auto" value={signer} readOnly />
          </DnField>
          <DnField label="ตำแหน่ง">
            <input className="cfg-input sr-auto" value={signerPosition} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
          <DnField label="แจ้งผู้ค้ำล่วงหน้า" hint="(ออกหนังสือแจ้งผู้ค้ำ)">
            <label className="sq-check-inline">
              <input type="checkbox" checked={notifyGuarantor} onChange={(e) => setNotifyGuarantor(e.target.checked)} />
              <span>{notifyGuarantor ? 'แจ้งผู้ค้ำประกันล่วงหน้าแล้ว' : 'ไม่แจ้งผู้ค้ำล่วงหน้า'}</span>
            </label>
          </DnField>
        </div>

        {/* เลขที่เอกสาร + สมาชิก */}
        <div className="form-grid cols-3" style={{ marginTop: 14 }}>
          <DnField label="ทะเบียนติดตาม" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono ds-auto-field" value="Auto" readOnly />
          </DnField>
          <DnField label="เลขที่อายัด">
            <input className="cfg-input mono sr-auto" value={seizureNo} readOnly />
          </DnField>
          <DnField label="วันที่ลงทะเบียน" required>
            <ErpDate value={regDate} onChange={(v) => ((e) => setRegDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
        </div>

        <div className="form-grid cols-3" style={{ marginTop: 14 }}>
          <DnField label="ทะเบียนสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <button type="button" className="gc-member-trigger lb-trigger" onClick={() => setModal(true)}>
              {member ? (
                <>
                  <span className="row-avatar">{window.sqInitial(member.name)}</span>
                  <span className="gc-mt-code mono">{member.code}</span>
                  <span className="gc-mt-name">{member.name}</span>
                  <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
                </>
              ) : (
                <>
                  <Icon name="search" size={14} />
                  <span className="muted">คลิกเพื่อค้นหาเลขทะเบียน / ชื่อสมาชิก</span>
                  <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                </>
              )}
            </button>
          </DnField>
          <DnField label="ชื่อ-ชื่อสกุล">
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
          <DnField label="วันที่ ต/บ ถึง" hint="(สิ้นสุดการบังคับใช้)">
            <ErpDate value={effectiveTo} onChange={(v) => ((e) => setEffectiveTo(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
        </div>

        <div className="form-grid cols-3" style={{ marginTop: 14 }}>
          <DnField label="สังกัด">
            <input className="cfg-input sr-auto" value={member ? `${member.deptCode || ''} · ${member.dept || ''}` : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DnField>
          <DnField label="ประเภทสังกัด">
            <select className="cfg-input" value={deptType} onChange={(e) => setDeptType(e.target.value)} disabled={!member}>
              {window.SQ_DEPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </DnField>
          <DnField label="ทุนเรือนหุ้น">
            <input className="cfg-input mono sr-auto ds-money" value={member ? fmt.money(shares, 2) : ''} readOnly placeholder="—" />
          </DnField>
        </div>

        <div className="form-grid cols-3" style={{ marginTop: 14 }}>
          <DnField label="สาเหตุที่ติดตาม" required>
            <select className="cfg-input" value={cause} onChange={(e) => { setCause(e.target.value); setError(''); }}>
              <option value="">— กรุณาเลือก —</option>
              {window.SQ_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </DnField>
          <DnField label="เมื่อวันที่" hint="(วันที่เกิดเหตุ)">
            <ErpDate value={causeDate} onChange={(v) => ((e) => setCauseDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
          <DnField label="หนี้คงค้าง">
            <input className="cfg-input mono sr-auto ds-money" value={member ? fmt.money(outstanding, 2) : ''} readOnly placeholder="—" />
          </DnField>
        </div>

        <SqFormSum outstanding={outstanding} shares={shares} seizure={seizure} />

        {noDebt && (
          <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>สมาชิกรายนี้ไม่มีหนี้คงค้าง — ไม่สามารถบันทึกรายการอายัดเงินได้</span>
          </div>
        )}
      </div>

      {/* ── เอกสารแนบ + สัญญาเงินกู้ ── */}
      <div className="ds-bottom-grid" style={{ marginTop: 12 }}>
        {/* สิ่งที่ส่งมาด้วย (เอกสารอื่นๆ) */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" /><h3>สิ่งที่ส่งมาด้วย (เอกสารอื่นๆ)</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <button className="btn sm" onClick={addAtt}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th className="center" style={{ width: 52 }}>ลำดับ</th><th>รายการเอกสาร</th><th style={{ width: 90 }} className="center">จัดการ</th></tr></thead>
              <tbody>
                {attachments.length === 0 ? (
                  <tr><td colSpan="3" className="empty-state" style={{ padding: '16px 8px' }}>ยังไม่มีเอกสารแนบ — กด “เพิ่มรายการ” หรือเลือกจากรายการมาตรฐาน</td></tr>
                ) : attachments.map((a, i) => (
                  <tr key={a.id}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <input className="cfg-input" list="sq-att-presets" value={a.text}
                             onChange={(e) => setAtt(a.id, e.target.value)} placeholder="ระบุชื่อเอกสารแนบ" />
                    </td>
                    <td className="center">
                      <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delAtt(a.id)} title="ลบรายการ"><Icon name="trash" size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <datalist id="sq-att-presets">
            {window.SQ_ATTACHMENT_PRESETS.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        {/* สิ่งที่ส่งมาด้วย (สัญญาเงินกู้) */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" /><h3>สิ่งที่ส่งมาด้วย (สัญญาเงินกู้)</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <span className="muted" style={{ fontSize: 11.5 }}>เลือก {selectedNos.length}/{contracts.length} สัญญา</span>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 52 }}>
                    <input type="checkbox" checked={allSel} onChange={toggleAll} disabled={contracts.length === 0} aria-label="เลือกทั้งหมด" />
                  </th>
                  <th>สัญญาเลขที่</th>
                  <th className="center">ลงวันที่</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr><td colSpan="3" className="empty-state" style={{ padding: '16px 8px' }}>เลือกสมาชิกเพื่อดึงสัญญาเงินกู้</td></tr>
                ) : contracts.map((c) => (
                  <tr key={c.contractNo} className={c.selected ? 'sq-row-on' : ''}>
                    <td className="center"><input type="checkbox" checked={c.selected} onChange={() => toggleContract(c.contractNo)} /></td>
                    <td className="mono">{c.contractNo}</td>
                    <td className="center">
                      <ErpDate value={c.date} onChange={(v) => ((e) => setContractDate(c.contractNo, e.target.value))({ target: { value: v } })} className="cfg-input ds-cell" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
            <Icon name="info" size={11} /> เลือกสัญญาที่นำไปประกอบการอายัดเงิน · ผู้ค้ำประกันจะถูกดึงมาแสดงอัตโนมัติ
          </p>
        </div>
      </div>

      {/* ── สำเนาเรียนผู้เกี่ยวข้อง + ผู้ค้ำประกัน ── */}
      <div className="ds-bottom-grid" style={{ marginTop: 12 }}>
        {/* สำเนาเรียนผู้ที่เกี่ยวข้อง */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" /><h3>สำเนาเรียนผู้ที่เกี่ยวข้อง</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <button className="btn sm" onClick={addParty}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 52 }}>ลำดับ</th>
                  <th className="center" style={{ width: 120 }}>ประเภท</th>
                  <th className="center" style={{ width: 120 }}>เลขสมาชิก</th>
                  <th>รายละเอียด</th>
                  <th style={{ width: 56 }} className="center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {parties.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state" style={{ padding: '16px 8px' }}>ยังไม่มีผู้เกี่ยวข้อง — กด “เพิ่มรายการ”</td></tr>
                ) : parties.map((p, i) => (
                  <tr key={p.id}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      <select className="cfg-input ds-cell" value={p.type} onChange={(e) => setParty(p.id, 'type', e.target.value)}>
                        {window.SQ_PARTY_TYPES.map(t => <option key={t.v} value={t.v}>{t.v}</option>)}
                      </select>
                    </td>
                    <td><input className="cfg-input mono ds-cell" value={p.memberCode} onChange={(e) => setParty(p.id, 'memberCode', e.target.value)} placeholder="—" /></td>
                    <td><input className="cfg-input ds-cell" value={p.detail} onChange={(e) => setParty(p.id, 'detail', e.target.value)} placeholder="ชื่อหน่วยงาน / บุคคล" /></td>
                    <td className="center"><button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delParty(p.id)} title="ลบรายการ"><Icon name="trash" size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        {/* สำเนาเรียนผู้ค้ำประกัน (auto) */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" /><h3>สำเนาเรียนผู้ค้ำประกัน</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <span className="chip info"><Icon name="download" size={11} /> ดึงจากสัญญาที่เลือก</span>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th className="mono">สัญญา</th><th className="center">ผู้ค้ำประกัน</th><th>ชื่อ-ชื่อสกุล</th><th>สังกัด</th></tr></thead>
              <tbody>
                {guarantors.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state" style={{ padding: '16px 8px' }}>เลือกสัญญาเพื่อดึงรายชื่อผู้ค้ำประกัน</td></tr>
                ) : guarantors.map((g, i) => (
                  <tr key={i}>
                    <td className="mono">{g.contractNo}</td>
                    <td className="center mono">{g.memberCode}</td>
                    <td>{g.name}</td>
                    <td>{g.dept}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>

      {/* ── รายการหนี้ค้างชำระ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการหนี้ค้างชำระ</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={addDebt} disabled={!member}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 52 }}>ลำดับ</th>
                <th className="center" style={{ width: 130 }}>ประเภท</th>
                <th>สัญญาเลขที่</th>
                <th className="center" style={{ width: 150 }}>สถานะ</th>
                <th className="num" style={{ width: 200 }}>ยอดค้างชำระ (บาท)</th>
                <th style={{ width: 56 }} className="center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="6" className="empty-state" style={{ padding: '16px 8px' }}>เลือกสมาชิกเพื่อดึงรายการหนี้ค้างชำระ</td></tr>
              ) : debts.map((d, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="cfg-input ds-cell" value={d.typeCode} onChange={(e) => setDebt(i, 'typeCode', e.target.value)}>
                      {window.SQ_DEBT_TYPES.map(t => <option key={t.v} value={t.v}>{t.v}</option>)}
                    </select>
                  </td>
                  <td><input className="cfg-input mono ds-cell" value={d.contractNo} onChange={(e) => setDebt(i, 'contractNo', e.target.value)} placeholder="—" /></td>
                  <td>
                    <select className="cfg-input ds-cell" value={d.statusCode} onChange={(e) => setDebt(i, 'statusCode', e.target.value)}>
                      {window.SQ_DEBT_STATUS.map(s => <option key={s.v} value={s.v}>{s.v}</option>)}
                    </select>
                  </td>
                  <td className="num"><input className="cfg-input mono ds-cell num" type="number" step="0.01" value={d.amount} onChange={(e) => setDebt(i, 'amount', e.target.value)} /></td>
                  <td className="center"><button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delDebt(i)} title="ลบรายการ"><Icon name="trash" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="ds-sched-tot">
                <td colSpan="4" className="right">รวมยอดค้างชำระ</td>
                <td className="num mono">{fmt.money(outstanding, 2)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div></div>
        <div className="sq-seize-foot">
          <Icon name="info" size={12} />
          <span>ยอดเงินอายัด = หนี้คงค้าง <b>{fmt.money(outstanding, 2)}</b> − ทุนเรือนหุ้น <b>{fmt.money(shares, 2)}</b> = <b style={{ color: 'var(--primary)' }}>{fmt.money(seizure, 2)}</b> บาท</span>
        </div>
      </div>

      {modal && <DnMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
      <SqTodayBadge />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับ list / form / detail
// ════════════════════════════════════════════════════════════════════
function DebtSeizurePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.sqLoad);
  const [mode, setMode] = useState('list');
  const [current, setCurrent] = useState(null);
  const [histOpen, setHistOpen] = useState(false);

  const persist = (next) => { setList(next); window.sqSaveLS(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const submit = (rec) => {
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ทะเบียนอายัดเงิน',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `บันทึกอายัดเงิน ${rec.id} (อายัดเลขที่ ${rec.seizureNo}) · ยอดเงินอายัด ${fmt.money(rec.seizureAmount, 2)} บาท`,
      changes: [
        { field: 'หนี้คงค้าง', before: '—', after: fmt.money(rec.outstanding, 2) },
        { field: 'ทุนเรือนหุ้น', before: '—', after: fmt.money(rec.shares, 2) },
        { field: 'ยอดเงินอายัด', before: '—', after: fmt.money(rec.seizureAmount, 2) },
        { field: 'แจ้งผู้ค้ำล่วงหน้า', before: '—', after: rec.notifyGuarantor ? 'แจ้งแล้ว' : 'ไม่แจ้ง' },
      ],
    });
    onToast && onToast(`บันทึกทะเบียนอายัดเงิน ${rec.id} · ${rec.memberName} เรียบร้อยแล้ว`);
    setMode('list');
  };

  const markEffective = (rec) => {
    const updated = { ...rec, status: 'effective' };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ทะเบียนอายัดเงิน',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `รายการอายัดเงิน ${rec.id} มีผลบังคับใช้`,
      changes: [{ field: 'สถานะ', before: 'บันทึกแล้ว', after: 'อายัดแล้ว' }],
    });
    onToast && onToast(`รายการอายัดเงิน ${rec.id} มีผลบังคับใช้แล้ว`);
  };

  const cancelRec = (rec) => {
    const updated = { ...rec, status: 'cancelled' };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — ทะเบียนอายัดเงิน',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ยกเลิกรายการอายัดเงิน ${rec.id}`,
      changes: [{ field: 'สถานะ', before: 'บันทึกแล้ว', after: 'ยกเลิก' }],
    });
    onToast && onToast(`ยกเลิกรายการอายัดเงิน ${rec.id} แล้ว`);
  };

  return (
    <>
      {mode === 'list'
        ? <SqListView list={list} onCreate={() => setMode('form')} onOpen={openDetail}
                      onOpenHistory={() => setHistOpen(true)} />
        : mode === 'detail'
          ? <SqDetailView rec={current} onBack={() => setMode('list')} onMarkEffective={markEffective} onCancel={cancelRec} onToast={onToast} />
          : <SqCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} onToast={onToast} />}
      {histOpen && <SqHistoryDrawer onClose={() => setHistOpen(false)} />}
    </>
  );
}

Object.assign(window, { SqCreateForm, SqFormSum, DebtSeizurePage });
