// ════════════════════════════════════════════════════════════════════
//  บันทึกทะเบียนขอสินไหม — ClaimRegisterForm (แบบฟอร์ม 6 แท็บ)
//  ใช้คู่กับ components-claim-register.jsx · ฐานสมาชิก window.CL_MEMBERS
// ════════════════════════════════════════════════════════════════════

const CRF_USER = 'จันทร์เพ็ญ มาลี';
const crfToday = () => (window.DEPOSIT_WORKING_DATE || '2026-07-04');

// ─── ฟิลด์ (label เล็กด้านบน) ─────────────────────────────────────────
function CrfField({ label, required, hint, children, span, auto }) {
  return (
    <div className="sr-field" style={span ? { gridColumn: `span ${span}` } : null}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

let _crfBenSeq = 0;
const crfBenKey = () => 'b' + (++_crfBenSeq) + Date.now().toString().slice(-3);
function crfBlankBen(ov) {
  return { key: crfBenKey(), name: '', relation: 'คู่สมรส', citizenId: '', phone: '',
           bank: 'ktb', accountNo: '', pct: '', docStatus: 'pending', ...ov };
}

const CRF_TABS = [
  { id: 'ins',   label: 'ข้อมูลประกัน' },
  { id: 'req',   label: 'ข้อมูลคำขอ' },
  { id: 'ben',   label: 'ผู้รับผลประโยชน์' },
  { id: 'debt',  label: 'หนี้และการตัดชำระ' },
  { id: 'doc',   label: 'เอกสารแนบ' },
  { id: 'hist',  label: 'ประวัติดำเนินการ' },
];

function ClaimRegisterForm({ list, initial, onSubmit, onCancel, onToast }) {
  const editing = !!initial;
  const initMember = editing ? (window.CL_MEMBERS || []).find(x => x.code === initial.memberCode) : null;

  const [tab, setTab] = useState('ins');
  const [error, setError] = useState('');
  const [member, setMember] = useState(initMember || null);

  const [meta, setMeta] = useState(() => editing
    ? { reqDate: initial.reqDate, reqType: initial.reqType, status: initial.status, orgUnit: initial.orgUnit, sentDate: initial.sentDate || '', note: initial.note || '' }
    : { reqDate: crfToday(), reqType: 'death', status: 'draft', orgUnit: 'งานประกันสมาชิก', sentDate: '', note: '' });
  const setM = (k, v) => { setMeta(s => ({ ...s, [k]: v })); setError(''); };

  const [policyId, setPolicyId] = useState(editing ? initial.policyId : (initMember && initMember.policies[0] ? initMember.policies[0].id : null));
  const [death, setDeath] = useState(() => editing ? { ...initial.death }
    : { date: '', cause: 'เจ็บป่วย / โรคประจำตัว', place: '', certNo: '', certDate: '', issuer: '' });
  const setD = (k, v) => { setDeath(s => ({ ...s, [k]: v })); setError(''); };

  const [estimate, setEstimate] = useState(editing ? initial.estimate : 0);
  const [actual, setActual] = useState(editing ? initial.actual : 0);

  const [bens, setBens] = useState(() => editing
    ? initial.beneficiaries.map(b => crfBlankBen(b))
    : [crfBlankBen({ pct: 100 })]);
  const setBen = (key, patch) => { setBens(bs => bs.map(x => x.key === key ? { ...x, ...patch } : x)); setError(''); };
  const addBen = () => setBens(bs => [...bs, crfBlankBen()]);
  const removeBen = (key) => setBens(bs => bs.length > 1 ? bs.filter(x => x.key !== key) : bs);

  const [debts, setDebts] = useState(() => editing ? initial.debts.map(d => ({ ...d })) : []);
  const setDebt = (i, patch) => { setDebts(ds => ds.map((x, idx) => idx === i ? { ...x, ...patch } : x)); };

  const [docs, setDocs] = useState(() => editing
    ? initial.docs.map(d => ({ ...d }))
    : window.CR_DOC_TEMPLATE.map(d => ({ ...d, status: 'none', recvDate: '', checker: '', file: '', note: '' })));
  const setDoc = (i, patch) => setDocs(ds => ds.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const [files, setFiles] = useState(() => editing
    ? (initial.files || (initial.docs || []).filter(d => d.file).map(d => ({ name: d.file, size: '—' })))
    : []);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = React.useRef(null);
  const fmtSize = (b) => b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(1) + ' KB';
  const addFiles = (list) => setFiles(fs => [...fs, ...Array.from(list).map(x => ({ name: x.name, size: fmtSize(x.size) }))]);

  // ── เลือกสมาชิก → ดึงข้อมูล ──
  const pick = (mm) => {
    const m = (window.CL_MEMBERS || []).find(x => x.code === mm.code) || mm;
    setMember(m); setError('');
    const p0 = m.policies && m.policies[0] ? m.policies[0] : null;
    setPolicyId(p0 ? p0.id : null);
    setEstimate(p0 ? p0.coverage : 0); setActual(p0 ? p0.coverage : 0);
    setDeath(s => ({ ...s, date: m.deathDate || '' }));
    // ดึงหนี้คงเหลือ (เฉพาะสัญญายังมีภาระ · ไม่ปิดสัญญา)
    setDebts(window.crDebtsOf(m.code).filter(d => d.status !== 'closed')
      .map(d => ({ ...d, offset: d.total })));
    onToast && onToast(`ดึงข้อมูลสมาชิก ${m.code} · ประกัน ${m.policies.length} · หนี้ ${window.crDebtsOf(m.code).length} สัญญา`);
  };

  const reqTypeDef = window.CR_REQ_TYPES.find(t => t.v === meta.reqType) || {};
  const lockedInsType = reqTypeDef.insType || null;
  const shownPolicies = member ? (lockedInsType ? (member.policies || []).filter(p => p.insType === lockedInsType) : (member.policies || [])) : [];
  React.useEffect(() => {
    if (!member || !lockedInsType) return;
    const p = (member.policies || []).find(x => x.insType === lockedInsType);
    setPolicyId(p ? p.id : null);
    setEstimate(p ? p.coverage : 0); setActual(p ? p.coverage : 0);
  }, [meta.reqType, member && member.code]);

  const policy = useMemo(() => member && policyId ? (member.policies || []).find(p => p.id === policyId) : null, [member, policyId]);
  const cov = window.crCoverageStatus(policy, death.date);
  const age = window.crAgeAt(member && member.birthDate, death.date);
  const offsetTotal = debts.reduce((s, d) => s + (Number(d.offset) || 0), 0);
  const debtTotal = debts.reduce((s, d) => s + d.principal + d.interest + d.penalty, 0);
  const fin = window.crFinance(actual, offsetTotal);
  const pctSum = bens.reduce((s, b) => s + (Number(b.pct) || 0), 0);
  const pctOk = Math.abs(pctSum - 100) < 0.001;

  // ── การแจ้งเตือนอัตโนมัติ ──
  const warnings = useMemo(() => {
    if (!member) return [];
    const w = [];
    if (member.deathStatus !== 'deceased') w.push({ tone: 'bad', text: 'สมาชิกยังไม่มีสถานะเสียชีวิตในระบบทะเบียน' });
    if (!death.date) w.push({ tone: 'warn', text: 'ยังไม่ระบุวันที่เสียชีวิต — จำเป็นต่อการตรวจสอบสิทธิ' });
    if (!member.policies || member.policies.length === 0) w.push({ tone: 'bad', text: 'สมาชิกไม่มีข้อมูลการเข้าโครงการประกัน' });
    if (cov.key === 'expired') w.push({ tone: 'bad', text: 'สมาชิกพ้นระยะความคุ้มครองก่อน/หลังวันที่เสียชีวิต' });
    if (!member.citizenId || member.citizenId.replace(/\D/g, '').length !== 13) w.push({ tone: 'warn', text: 'ข้อมูลเลขบัตรประชาชนไม่ครบถ้วน' });
    const dup = list.some(r => r.memberCode === member.code && r.policyId === policyId &&
      r.death && death.date && r.death.date === death.date && (!editing || r.id !== initial.id) &&
      !['rejected'].includes(r.status));
    if (dup) w.push({ tone: 'bad', text: 'พบคำขอสินไหมของสมาชิก/โครงการ/วันเสียชีวิตเดียวกันอยู่แล้ว' });
    return w;
  }, [member, death.date, cov.key, policyId, list, editing, initial]);

  // ── สร้าง record ──
  const buildRec = (status) => {
    const id = editing ? initial.id : window.crNextNo(list);
    const prevStatus = editing ? initial.status : null;
    let history = editing ? initial.history.map(h => ({ ...h })) : [{ date: meta.reqDate, status: 'draft', detail: 'บันทึกร่างคำขอ', by: CRF_USER, note: '' }];
    if (status !== prevStatus) {
      history = [...history, { date: crfToday(), status, detail: window.crStatus(status).l, by: CRF_USER, note: '' }];
    }
    return {
      id, reqDate: meta.reqDate, sentDate: meta.sentDate, reqType: meta.reqType, status,
      orgUnit: meta.orgUnit, enteredBy: editing ? initial.enteredBy : CRF_USER, note: meta.note,
      memberCode: member.code, policyId,
      death: { ...death }, estimate: Number(estimate) || 0, actual: Number(actual) || 0,
      beneficiaries: bens.filter(b => b.name.trim()).map(b => ({
        name: b.name.trim(), relation: b.relation, citizenId: b.citizenId.trim(), phone: b.phone.trim(),
        bank: b.bank, accountNo: b.accountNo.trim(), pct: Number(b.pct) || 0, docStatus: b.docStatus })),
      debts: debts.map(d => ({ ...d, offset: Number(d.offset) || 0 })),
      docs: docs.map(d => ({ ...d })),
      files: files.map(x => ({ ...x })),
      history,
    };
  };

  const [okMsg, setOkMsg] = React.useState(null);

  const validate = (forSubmit) => {
    if (!member) return 'กรุณาเลือกสมาชิกก่อนบันทึกคำขอ';
    if (forSubmit) {
      if (!death.date) return 'กรุณาระบุวันที่เสียชีวิต';
      if (!policyId) return 'กรุณาเลือกโครงการประกันที่ยื่นขอสินไหม';
      const valid = bens.filter(b => b.name.trim());
      if (valid.length === 0) return 'ต้องมีผู้รับผลประโยชน์หรือทายาทอย่างน้อย 1 ราย';
      if (!pctOk) return `ผลรวมสัดส่วนผู้รับผลประโยชน์ต้องเท่ากับ 100% (ปัจจุบัน ${pctSum}%)`;
    }
    return '';
  };

  const saveDraft = () => {
    const e = validate(false); if (e) return setError(e);
    const rec = buildRec('draft');
    onSubmit(rec, true);
    setOkMsg({ title: 'บันทึกร่างคำขอเรียบร้อย', detail: `คำขอสินไหมเลขที่ ${rec.id} · สถานะ ร่าง — สามารถแก้ไขและบันทึกต่อได้` });
  };
  const saveFull = () => {
    const e = validate(true); if (e) { setError(e); setTab(e.includes('ผู้รับผลประโยชน์') ? 'ben' : e.includes('ประกัน') ? 'ins' : 'req'); return; }
    const rec = buildRec(meta.status === 'draft' ? 'doccheck' : meta.status);
    onSubmit(rec, true);
    setOkMsg({ title: 'บันทึกคำขอสินไหมเรียบร้อย', detail: `คำขอสินไหมเลขที่ ${rec.id} · สถานะ ${window.crStatus(rec.status).l}` });
  };

  const pullDebt = () => {
    if (!member) return setError('เลือกสมาชิกก่อนดึงข้อมูลหนี้');
    const next = window.crDebtsOf(member.code).filter(d => d.status !== 'closed').map(d => ({ ...d, offset: d.total }));
    setDebts(next);
    setTab('debt');
    setOkMsg({ title: 'ดึงข้อมูลหนี้เรียบร้อย', detail: `พบสัญญาคงเหลือ ${next.length} รายการ — ระบบตั้งยอดตัดชำระเท่ากับยอดหนี้คงเหลือให้อัตโนมัติ` });
  };

  return (
    <div data-screen-label="หน้าบันทึกทะเบียนขอสินไหม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{editing ? 'แก้ไขคำขอสินไหม' : 'บันทึกทะเบียนขอสินไหม'}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {editing ? <span className="mono">{initial.id}</span> : 'เลขที่คำขอสร้างอัตโนมัติเมื่อบันทึก'} · ค้นหาสมาชิก · ตรวจสิทธิ · ดึงหนี้ · คำนวณยอดตัดชำระ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}>ยกเลิก</button>
        <button className="btn sm" onClick={saveDraft}><Icon name="edit" size={13} /> บันทึกแบบร่าง</button>
        <button className="btn primary sm" onClick={saveFull}><Icon name="check" /> บันทึก</button>
      </div>

      {error && <div className="sr-error"><Icon name="info" size={14} /> {error}</div>}

      {/* ── ส่วนหัวข้อมูลเอกสารขอสินไหม ── */}
      <div className="search-card sr-sys" style={{ background: '#fff' }}>
        <div className="cr-sys-grid">
          <CrfField label="เลขที่คำขอสินไหม" hint="(อัตโนมัติ)">
            <input className="cfg-input mono sr-readonly" value={editing ? initial.id : 'Auto'} readOnly />
          </CrfField>
          <CrfField label="วันที่บันทึกคำขอ">
            <ErpDate value={meta.reqDate} onChange={(v) => ((e) => setM('reqDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </CrfField>
          <CrfField label="ประเภทคำขอสินไหม">
            <select className="cfg-input" value={meta.reqType} onChange={(e) => setM('reqType', e.target.value)}>
              {window.CR_REQ_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </CrfField>
          <CrfField label="สมาชิกผู้เอาประกัน" required>
            <div className="reg-member-search crf-member-search" style={{ width: '100%', maxWidth: 'none' }}>
              <MemberSearchField member={member} onPick={pick} source={window.CL_MEMBERS}
                                 title="ค้นหาสมาชิกผู้เอาประกัน" changeLabel="เปลี่ยน"
                                 placeholder="คลิกเพื่อค้นหาสมาชิก…" />
            </div>
          </CrfField>
          <CrfField label="เจ้าหน้าที่ผู้บันทึก" hint="(จากล็อกอิน)">
            <input className="cfg-input sr-readonly" value={editing ? initial.enteredBy : CRF_USER} readOnly />
          </CrfField>
        </div>
      </div>

      {!member ? (
        <div className="search-card">
          <div className="cl-empty" style={{ padding: '32px 16px' }}><Icon name="member" size={16} /> เลือกสมาชิกเพื่อเริ่มบันทึกคำขอสินไหม — ระบบจะดึงข้อมูลสมาชิก ประกัน และหนี้คงเหลืออัตโนมัติ</div>
        </div>
      ) : (
        <>
          {/* ── การแจ้งเตือน ── */}
          {warnings.length > 0 && (
            <div className="cr-warn-box">
              <div className="cr-warn-head"><Icon name="info" size={13} /> ตรวจพบเงื่อนไขที่ควรระวัง ({warnings.length})</div>
              <ul>{warnings.map((w, i) => <li key={i} className={"cr-warn-" + w.tone}><Icon name={w.tone === 'bad' ? 'close' : 'info'} size={11} /> {w.text}</li>)}</ul>
            </div>
          )}

          {/* ── แถบสรุปยอด (ติดตาม) ── */}
          <div className={"cr-sum-strip tone-" + fin.tone}>
            <div className="cr-sum-cell"><span className="k">ทุนประกัน</span><span className="v mono">฿{fmt.money(estimate, 0)}</span></div>
            <div className="cr-sum-cell"><span className="k">สินไหมที่ได้รับ</span><span className="v mono">฿{fmt.money(fin.actual, 0)}</span></div>
            <div className="cr-sum-cell"><span className="k">ตัดชำระหนี้</span><span className="v mono" style={{ color: 'var(--danger)' }}>฿{fmt.money(fin.offsetTotal, 0)}</span></div>
            <div className="cr-sum-cell hl"><span className="k">{fin.shortfall > 0 ? 'ยอดขาดต้องติดตาม' : 'คงเหลือคืนทายาท'}</span><span className="v mono">฿{fmt.money(fin.shortfall > 0 ? fin.shortfall : fin.refund, 0)}</span></div>
            <span className="spacer" />
            <span className={"pill " + (fin.tone === 'ok' ? 'ok' : fin.tone === 'bad' ? 'bad' : fin.tone === 'info' ? 'info' : 'neutral')}>{fin.statusLabel}</span>
          </div>

          {/* ── แท็บ ── */}
          <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
            <div className="tabs-bar" style={{ borderRadius: 0, flexWrap: 'wrap' }}>
              {CRF_TABS.map(t => (
                <button key={t.id} className={"tab" + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
              ))}
            </div>

            <div className="tab-panel">
              {/* ═══ TAB 1: ข้อมูลคำขอ ═══ */}
              {tab === 'req' && (
                <>
                  <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
                    <span className="spacer" /><span className={"pill " + (member.deathStatus === 'deceased' ? 'bad' : 'ok')}>{member.deathStatus === 'deceased' ? 'เสียชีวิตแล้ว' : 'ยังไม่เสียชีวิต'}</span></div>
                  <div className="form-grid">
                    <CrRow label="เลขสมาชิก" value={member.code} mono />
                    <CrRow label="ชื่อ – นามสกุล" value={member.name} />
                    <CrRow label="เลขบัตรประชาชน" value={member.citizenId} mono />
                    <CrRow label="วันเกิด" value={fmt.date(member.birthDate)} />
                    <CrRow label="สังกัด" value={member.dept} />
                    <CrRow label="ประเภท / สถานะสมาชิก" value={member.memberStatus} />
                    <CrRow label="วันที่เข้าเป็นสมาชิก" value={fmt.date(member.joinDate)} />
                    <CrRow label="วันที่พ้นสภาพ" value={member.resignDate ? fmt.date(member.resignDate) : '—'} />
                    <CrRow label="สถานะการทำงาน" value={member.workStatus} />
                  </div>

                  <div className="dxc-subhead" style={{ marginTop: 18 }}>ข้อมูลการเสียชีวิต</div>
                  <div className="cr-form-grid">
                    <CrfField label="วันที่เสียชีวิต" required>
                      <ErpDate value={death.date} onChange={(v) => ((e) => setD('date', e.target.value))({ target: { value: v } })} className="cfg-input" />
                    </CrfField>
                    <CrfField label="อายุ ณ วันที่เสียชีวิต" hint="(คำนวณ)">
                      <input className="cfg-input mono sr-auto" value={age != null ? age + ' ปี' : ''} readOnly placeholder="—" />
                    </CrfField>
                    <CrfField label="สาเหตุการเสียชีวิต">
                      <select className="cfg-input" value={death.cause} onChange={(e) => setD('cause', e.target.value)}>
                        {window.CR_DEATH_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </CrfField>
                    <CrfField label="สถานที่เสียชีวิต">
                      <input className="cfg-input" value={death.place} onChange={(e) => setD('place', e.target.value)} placeholder="เช่น โรงพยาบาล / ที่พัก" />
                    </CrfField>
                    <CrfField label="เลขที่ใบมรณบัตร">
                      <input className="cfg-input mono" value={death.certNo} onChange={(e) => setD('certNo', e.target.value)} placeholder="มบ.xxxx-xxxx" />
                    </CrfField>
                    <CrfField label="วันที่ออกใบมรณบัตร">
                      <ErpDate value={death.certDate} onChange={(v) => ((e) => setD('certDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
                    </CrfField>
                    <CrfField label="หน่วยงานที่ออกเอกสาร">
                      <input className="cfg-input" value={death.issuer} onChange={(e) => setD('issuer', e.target.value)} placeholder="สำนักงานเขต / อำเภอ" />
                    </CrfField>
                  </div>
                  <CrfField label="หมายเหตุคำขอ" span={1} hint="(ไม่บังคับ)">
                    <textarea className="cfg-input" rows={2} value={meta.note} onChange={(e) => setM('note', e.target.value)} placeholder="หมายเหตุเพิ่มเติม" style={{ marginTop: 4 }} />
                  </CrfField>
                </>
              )}

              {/* ═══ TAB 2: ข้อมูลประกัน ═══ */}
              {tab === 'ins' && (
                <>
                  <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เลือกโครงการประกันที่ยื่นขอสินไหม</h3>
                    <span className="spacer" /><span className="muted" style={{ fontSize: 11.5 }}>{shownPolicies.length} โครงการ</span></div>
                  {lockedInsType && <div className="cr-hint-line" style={{ marginTop: 0, marginBottom: 10 }}><Icon name="info" size={12} /> ประเภทคำขอ "{reqTypeDef.l}" — ระบบเลือกโครงการประเภท {lockedInsType} ให้อัตโนมัติ</div>}
                  {shownPolicies.length === 0 ? (
                    <div className="cl-empty"><Icon name="info" size={14} /> {lockedInsType ? `สมาชิกไม่มีโครงการประเภท ${lockedInsType}` : 'สมาชิกไม่มีข้อมูลเข้าโครงการประกัน — ไม่สามารถส่งเรื่องบริษัทประกันได้'}</div>
                  ) : (
                    <div className="table-wrap" style={{ marginBottom: 14 }}><div className="table-scroll">
                      <table className="tbl" style={{ minWidth: 1080 }}>
                        <thead><tr>
                          <th style={{ width: 44 }} className="center">เลือก</th><th style={{ minWidth: 200 }}>โครงการ</th><th>ประเภท</th>
                          <th style={{ minWidth: 150 }}>บริษัทประกัน</th><th>เลขกรมธรรม์</th><th className="center">เริ่ม</th><th className="center">สิ้นสุด</th>
                          <th className="num">ทุนประกัน</th><th className="center">ความคุ้มครอง</th>
                        </tr></thead>
                        <tbody>
                          {shownPolicies.map(p => {
                            const pcov = window.crCoverageStatus(p, death.date);
                            const sel = p.id === policyId;
                            return (
                              <tr key={p.id} className={(lockedInsType ? '' : 'clickable') + (sel ? ' cl-row-sel' : '')} onClick={() => { if (lockedInsType) return; setPolicyId(p.id); setEstimate(p.coverage); setActual(p.coverage); }}>
                                <td className="center"><input type="radio" checked={sel} readOnly disabled={!!lockedInsType} style={{ accentColor: 'var(--primary)', width: 15, height: 15, cursor: lockedInsType ? 'not-allowed' : 'pointer' }} /></td>
                                <td>{p.projName}<div className="muted mono" style={{ fontSize: 10 }}>{p.projCode}</div></td>
                                <td>{p.insType}</td><td>{p.company}</td><td className="mono">{p.policyNo}</td>
                                <td className="center mono">{fmt.date(p.startDate)}</td><td className="center mono">{fmt.date(p.endDate)}</td>
                                <td className="num mono">{fmt.money(p.coverage, 0)}</td>
                                <td className="center"><span className={"pill " + pcov.pill}>{pcov.l}</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div></div>
                  )}

                  {policy && (
                    <>
                      <div className="dxc-subhead">รายละเอียดกรมธรรม์ · <span className="mono">{policy.policyNo}</span></div>
                      <div className="form-grid">
                        <CrRow label="ชื่อโครงการประกัน" value={policy.projName} />
                        <CrRow label="ประเภทประกัน" value={policy.insType} />
                        <CrRow label="บริษัทประกัน" value={policy.company} />
                        <CrRow label="ผู้รับผลประโยชน์ตามกรมธรรม์" value={policy.beneficiary} />
                        <CrRow label="ระยะคุ้มครอง" value={`${fmt.date(policy.startDate)} – ${fmt.date(policy.endDate)}`} />
                        <CrRow label="สถานะความคุ้มครอง ณ วันเสียชีวิต" value={cov.l} tone={cov.pill === 'bad' ? 'danger' : ''} />
                      </div>
                      <div className="cl-cond" style={{ marginTop: 12 }}><Icon name="info" size={12} /> <b>เงื่อนไขการเคลม:</b> {policy.claimCond}</div>

                      <div className="cr-form-grid" style={{ marginTop: 14 }}>
                        <CrfField label="ทุนประกัน / วงเงินคุ้มครอง">
                          <input className="cfg-input mono sr-auto" value={'฿ ' + fmt.money(policy.coverage, 0)} readOnly />
                        </CrfField>
                        <CrfField label="ยอดสินไหมที่คาดว่าจะได้รับ" hint="(ประมาณการ)">
                          <input className="cfg-input mono" type="number" value={estimate} onChange={(e) => { setEstimate(e.target.value); setError(''); }} />
                        </CrfField>
                        <CrfField label="วันที่ยื่นเรื่องต่อบริษัทประกัน">
                          <ErpDate value={meta.sentDate} onChange={(v) => ((e) => setM('sentDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
                        </CrfField>
                        <CrfField label="ยอดสินไหมที่ได้รับจริง">
                          <input className="cfg-input mono" type="number" value={actual} onChange={(e) => { setActual(e.target.value); setError(''); }} />
                        </CrfField>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ═══ TAB 3: ผู้รับผลประโยชน์ ═══ */}
              {tab === 'ben' && (
                <>
                  <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ผู้รับผลประโยชน์ / ทายาท</h3>
                    <span className="spacer" /><span className={"chip " + (pctOk ? 'success' : 'danger')}>รวมสัดส่วน {pctSum}%</span></div>
                  <div className="dxc-ben-list">
                    {bens.map((b, idx) => {
                      const amt = fin.refund * (Number(b.pct) || 0) / 100;
                      return (
                        <div className="dxc-ben-card" key={b.key}>
                          <div className="dxc-ben-head">
                            <span className="dxc-ben-no"><Icon name="user" size={12} /> รายที่ {idx + 1}</span>
                            <span className="spacer" /><span className="dxc-ben-amt mono">฿ {fmt.money(amt, 0)}</span>
                            {bens.length > 1 && <button className="btn sm" style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }} onClick={() => removeBen(b.key)} title="นำออก"><Icon name="trash" size={13} /></button>}
                          </div>
                          <div className="cr-form-grid">
                            <CrfField label="ชื่อ – นามสกุล" required span={2}>
                              <input className="cfg-input" value={b.name} onChange={(e) => setBen(b.key, { name: e.target.value })} placeholder="ชื่อผู้รับผลประโยชน์" />
                            </CrfField>
                            <CrfField label="ความสัมพันธ์">
                              <select className="cfg-input" value={b.relation} onChange={(e) => setBen(b.key, { relation: e.target.value })}>
                                {window.CR_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </CrfField>
                            <CrfField label="เลขบัตรประชาชน">
                              <input className="cfg-input mono" value={b.citizenId} onChange={(e) => setBen(b.key, { citizenId: e.target.value })} placeholder="x-xxxx-xxxxx-xx-x" />
                            </CrfField>
                            <CrfField label="เบอร์โทรศัพท์">
                              <input className="cfg-input mono" value={b.phone} onChange={(e) => setBen(b.key, { phone: e.target.value })} placeholder="08x-xxx-xxxx" />
                            </CrfField>
                            <CrfField label="ธนาคาร">
                              <select className="cfg-input" value={b.bank} onChange={(e) => setBen(b.key, { bank: e.target.value })}>
                                {window.CR_BANKS.map(bk => <option key={bk.v} value={bk.v}>{bk.l}</option>)}
                              </select>
                            </CrfField>
                            <CrfField label="เลขที่บัญชี">
                              <input className="cfg-input mono" value={b.accountNo} onChange={(e) => setBen(b.key, { accountNo: e.target.value })} placeholder="xxx-x-xxxxx-x" />
                            </CrfField>
                            <CrfField label="สัดส่วน" hint="(%)">
                              <input className="cfg-input mono" type="number" min="0" max="100" value={b.pct} onChange={(e) => setBen(b.key, { pct: e.target.value })} placeholder="0" />
                            </CrfField>
                            <CrfField label="สถานะตรวจสอบเอกสาร">
                              <select className="cfg-input" value={b.docStatus} onChange={(e) => setBen(b.key, { docStatus: e.target.value })}>
                                {Object.entries(window.CR_BEN_DOC).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
                              </select>
                            </CrfField>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="btn dashed sm" style={{ marginTop: 12 }} onClick={addBen}><Icon name="plus" size={13} /> เพิ่มผู้รับผลประโยชน์</button>
                  <div className={"dxc-pct-bar" + (pctOk ? ' ok' : '')} style={{ marginTop: 12 }}>
                    <div className="dxc-pct-track"><div className="dxc-pct-fill" style={{ width: Math.min(100, pctSum) + '%' }} /></div>
                    <span className="dxc-pct-label">
                      {pctOk ? <><Icon name="check" size={12} /> สัดส่วนครบ 100% · แบ่งยอดคงเหลือ ฿{fmt.money(fin.refund, 0)}</>
                             : <><Icon name="info" size={12} /> ผลรวมสัดส่วนต้องเท่ากับ 100% (ปัจจุบัน {pctSum}%)</>}
                    </span>
                  </div>
                  <div className="cr-hint-line"><Icon name="info" size={12} /> หากไม่มีผู้รับผลประโยชน์ที่ระบุ ให้บันทึกเป็น "ทายาทโดยธรรม" · กรณีมีการคืนเงินต้องมีข้อมูลบัญชีธนาคารครบถ้วน</div>
                </>
              )}

              {/* ═══ TAB 4: หนี้และการตัดชำระ ═══ */}
              {tab === 'debt' && (
                <>
                  <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หนี้คงเหลือของสมาชิก</h3>
                    <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={pullDebt}><Icon name="refresh" size={13} /> ดึงข้อมูลหนี้ใหม่</button></div>
                  {debts.length === 0 ? (
                    <div className="cl-empty"><Icon name="info" size={14} /> ไม่มีหนี้คงเหลือ — ยอดสินไหมทั้งหมดเป็นยอดคืนให้ผู้รับผลประโยชน์ / ทายาท</div>
                  ) : (
                    <div className="table-wrap"><div className="table-scroll">
                      <table className="tbl" style={{ minWidth: 1000 }}>
                        <thead><tr>
                          <th>เลขที่สัญญา</th><th>ประเภท</th><th className="num">เงินต้น</th><th className="num">ดอกเบี้ยค้าง</th>
                          <th className="num">ค่าปรับ</th><th className="num">ยอดหนี้รวม</th><th className="center">สถานะ</th><th className="num" style={{ width: 150 }}>ยอดตัดชำระ</th>
                        </tr></thead>
                        <tbody>
                          {debts.map((d, i) => {
                            const cs = window.crContractTag(d.status);
                            const tot = d.principal + d.interest + d.penalty;
                            return (
                              <tr key={i} className={['litigate', 'transfer'].includes(d.status) ? 'cr-row-alert' : ''}>
                                <td className="mono">{d.no}{['litigate', 'transfer'].includes(d.status) && <div className="cr-alert-tag"><Icon name="info" size={10} /> ต้องตรวจสอบพิเศษ</div>}</td>
                                <td>{d.type}</td>
                                <td className="num mono">{fmt.money(d.principal, 0)}</td>
                                <td className="num mono">{fmt.money(d.interest, 0)}</td>
                                <td className="num mono">{d.penalty ? fmt.money(d.penalty, 0) : '—'}</td>
                                <td className="num mono">{fmt.money(tot, 0)}</td>
                                <td className="center"><span className={"pill " + cs.pill}>{cs.l}</span></td>
                                <td className="num mono">{fmt.money(Number(d.offset) || 0, 0)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot><tr className="sh-grid-total">
                          <td colSpan="5" className="right"><b>รวม</b></td>
                          <td className="num mono"><b>{fmt.money(debtTotal, 0)}</b></td><td></td>
                          <td className="num mono"><b>{fmt.money(offsetTotal, 0)}</b></td>
                        </tr></tfoot>
                      </table>
                    </div></div>
                  )}

                  <div className="dxc-subhead" style={{ marginTop: 18 }}>สรุปยอดสินไหมและการตัดชำระ</div>
                  <div className="dxc-calc-wrap">
                    <div className="sem-cost-list">
                      <div className="sem-cost-row"><span>ยอดสินไหมที่คาดว่าจะได้รับ</span><b className="mono">{fmt.money(estimate, 0)}</b></div>
                      <div className="sem-cost-row total"><span>ยอดสินไหมที่ได้รับจริง</span><b className="mono">฿ {fmt.money(fin.actual, 0)}</b></div>
                      <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>ยอดหนี้ที่ต้องตัดชำระ</span><b className="mono">− {fmt.money(fin.offsetTotal, 0)}</b></div>
                      {fin.shortfall > 0
                        ? <div className="sem-cost-row sub" style={{ color: 'var(--danger)' }}><span>ยอดขาดที่ยังต้องติดตาม</span><b className="mono">{fmt.money(fin.shortfall, 0)}</b></div>
                        : <div className="sem-cost-row sub"><span>ยอดคงเหลือที่ต้องคืน</span><b className="mono">{fmt.money(fin.refund, 0)}</b></div>}
                    </div>
                    <div className={"sr-amount-box" + (fin.shortfall > 0 ? ' dxc-zero' : '')}>
                      <div className="sr-amount-label">{fin.shortfall > 0 ? 'ยอดขาดต้องติดตาม' : 'ยอดคงเหลือคืนทายาท'}</div>
                      <div className="sr-amount-value">฿ {fmt.money(fin.shortfall > 0 ? fin.shortfall : fin.refund, 0)}</div>
                      <div className="sr-amount-sub">{fin.statusLabel}</div>
                    </div>
                  </div>
                </>
              )}

              {/* ═══ TAB 5: เอกสารแนบ ═══ */}
              {tab === 'doc' && (
                <>
                  <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เอกสารประกอบการขอสินไหม</h3>
                    <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{files.length} ไฟล์</span></div>
                  <div className="lrq-dropzone" style={{ cursor: 'pointer', ...(dragOver ? { borderColor: 'var(--primary)', background: 'var(--brand-100, #EAFEF2)' } : null) }}
                    onClick={() => fileRef.current && fileRef.current.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}>
                    <Icon name="upload" size={16} />
                    <span>คลิก หรือ ลากไฟล์มาที่นี่ เพื่ออัปโหลด</span>
                    <input ref={fileRef} type="file" multiple hidden onChange={(e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; }} />
                  </div>
                  {files.length > 0 && (
                    <div className="lrq-filelist">
                      {files.map((fl, i) => (
                        <div key={i} className="lrq-file">
                          <span className="lrq-file-ico"><Icon name="attach" size={14} /></span>
                          <span className="lrq-file-name">{fl.name}</span>
                          <span className="lrq-file-size muted">{fl.size}</span>
                          <button className="lrq-eyebtn lrq-eyebtn-g" onClick={() => onToast && onToast('เปิดไฟล์ ' + fl.name)} title="ดูข้อมูล" style={{ background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={14} /></button>
                          <button className="btn sm" style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} title="ลบรายการ"><Icon name="trash" size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ═══ TAB 6: ประวัติดำเนินการ ═══ */}
              {tab === 'hist' && (
                <>
                  <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ประวัติการดำเนินการ</h3></div>
                  {editing && initial.history && initial.history.length ? (
                    <div className="cr-timeline">
                      {initial.history.slice().reverse().map((h, i) => {
                        const hs = window.crStatus(h.status);
                        return (
                          <div className="cr-tl-item" key={i}>
                            <div className={"cr-tl-dot " + hs.pill} />
                            <div className="cr-tl-body">
                              <div className="cr-tl-top"><span className="cr-tl-title">{h.detail}</span><span className="cr-tl-date mono">{fmt.date(h.date)}</span></div>
                              <div className="cr-tl-meta">โดย {h.by}{h.note ? ' · ' + h.note : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="cl-empty"><Icon name="history" size={14} /> ระบบจะบันทึกประวัติอัตโนมัติทุกครั้งที่มีการเปลี่ยนสถานะคำขอ · ประวัติจะแสดงหลังบันทึกคำขอ</div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail} onClose={() => setOkMsg(null)} />
      )}
    </div>
  );
}

Object.assign(window, { ClaimRegisterForm });
