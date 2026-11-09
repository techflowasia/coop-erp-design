// ════════════════════════════════════════════════════════════════════
//  คำขอทุนสวัสดิการทุนการศึกษา — ScholarshipRequestPage
//  ระบบงานสวัสดิการสมาชิก › ส่วนการทำงาน
//  โหมด list = ทะเบียน/ติดตามคำขอ · โหมด form = สร้างคำขอของสมาชิก
// ════════════════════════════════════════════════════════════════════

const SR_USER = 'จันทร์เพ็ญ มาลี';
const srToday = () => new Date().toISOString().slice(0, 10);

let _srUidSeq = 0;
const srUid = () => 'SRX-' + String(++_srUidSeq).padStart(4, '0');

function srLoad() {
  if (window.schReqLoadStore) return window.schReqLoadStore();
  try {
    const saved = localStorage.getItem('scholarship_requests');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.SCHREQ_SEED.map(r => ({ ...r }));
}
function srSaveLS(list) {
  try { localStorage.setItem('scholarship_requests', JSON.stringify(list)); } catch (e) {}
}
function srNextDocNo(list, year, scholarType) {
  const yr = String(year || 2569);
  const prefix = window.schDocCode ? window.schDocCode(scholarType) : 'WS';
  const head = `${prefix}-${yr}`;
  const nums = list.filter(r => String(r.id).startsWith(head + '-'))
    .map(r => parseInt(String(r.id).split('-')[2], 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${head}-${String(next).padStart(4, '0')}`;
}

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// ใช้คอมโพเนนต์กลางของ Design System (components-member-search.jsx)
function SrMemberSearchModal({ onPick, onClose }) {
  return (
    <MemberSearchModal onPick={(m) => onPick(window.schReqMember(m.code))} onClose={onClose}
                       source={window.MEMBERS_LIST} />
  );
}

// ─── Popup ค้นหา/เลือกบัญชีรับเงิน ───────────────────────────────────
function SrAccountSearchModal({ member, kind, onPick, onClose }) {
  const [q, setQ] = useState('');
  const accounts = window.memberAccounts(member.code, kind);
  const kindLabel = kind === 'coop' ? 'เงินฝากสหกรณ์' : 'บัญชีธนาคาร';
  const results = q.trim()
    ? accounts.filter(a => a.accNo.includes(q.trim()) || (a.type || '').includes(q.trim()) || (a.label || '').includes(q.trim()))
    : accounts;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="wallet" /></div>
          <h2>ค้นหาบัญชีรับเงิน — {kindLabel}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            สมาชิก <b style={{ color: 'var(--text)' }}>{member.name}</b> <span className="mono">({member.code})</span>
          </div>
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)}
                   placeholder="ค้นหาเลขบัญชี หรือประเภทบัญชี…" />
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr><th>เลขที่บัญชี</th><th>ประเภท</th><th>รายละเอียด</th><th style={{ width: 40 }} /></tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">ไม่พบบัญชีที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map((a, i) => (
                  <tr key={a.accNo} className="clickable" onClick={() => onPick(a.accNo)}>
                    <td className="mono">{a.accNo}{i === 0 && <span className="chip primary" style={{ marginLeft: 8 }}>บัญชีหลัก</span>}</td>
                    <td>{a.type}</td>
                    <td className="muted">{a.label}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(a.accNo); }}><Icon name="chevRight" /></button>
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
//  ฟิลด์ย่อยของแบบฟอร์ม
// ════════════════════════════════════════════════════════════════════
function SrField({ label, required, hint, children, full, span }) {
  const st = full ? { gridColumn: '1 / -1' } : (span ? { gridColumn: `span ${span}` } : null);
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}
function SrSelect({ group, value, onChange, placeholder }) {
  return (
    <select className="cfg-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {window.SCHREQ_OPTS[group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มสร้างคำขอ — รองรับหลายบุตร (สร้างใบคำขอรายบุตรอัตโนมัติ)
// ════════════════════════════════════════════════════════════════════
let _srKidSeq = 0;
const srKidKey = () => 'k' + (++_srKidSeq) + '-' + Date.now().toString().slice(-4);
function srBlankKid(ov) {
  return {
    key: srKidKey(), srcId: '__manual', title: 'ด.ช.', firstName: '', lastName: '',
    citizenId: '', birthDate: '', eduLevel: '1', gpa: '', percent: '', ...ov,
  };
}

function SrCreateForm({ list, onSubmit, onCancel }) {
  const [reqDate, setReqDate] = useState(srToday);
  const [member, setMember] = useState(null);
  const [acctModal, setAcctModal] = useState(false);
  const [error, setError] = useState('');
  const [registryKids, setRegistryKids] = useState([]);  // บุตรในทะเบียนสมาชิก
  const [files, setFiles] = useState([]);

  // ข้อมูลร่วมของทั้งคำขอ (ใช้กับบุตรทุกราย)
  const [f, setF] = useState({
    schoolYear: '2569', scholarType: '1', childrenStudying: '1',
    payBy: 'coop', payAccount: '', moneyOrder: '', payAddress: '',
  });
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };

  // รายการบุตรผู้รับทุน — 1 แถว = 1 ใบคำขอ
  const [kids, setKids] = useState([srBlankKid()]);

  const memberAge = member ? window.schReqMemberAge(member.joinDate) : 0;
  const salaryVal = member ? Number(member.salary) || 0 : 0;
  const studyingVal = Number(f.childrenStudying) || 0;

  // คำนวณค่าต่อบุตร (จำนวนเงิน · เกณฑ์ · สัมประสิทธิ์ · อายุ · สิทธิปีเว้นปี)
  const kidCalc = (k) => {
    const amount = window.schReqAmount(f.schoolYear, f.scholarType, k.eduLevel);
    const crit = window.schReqCriteria(f.schoolYear, f.scholarType, k.eduLevel);
    const grade = parseFloat(k.gpa) || 0;
    const coef = (salaryVal > 0 && grade > 0 && studyingVal > 0) ? (salaryVal / grade) / studyingVal : 0;
    const age = window.schReqAge(k.birthDate);
    const elig = member
      ? window.schReqEligibility(list, { memberCode: member.code, childCitizenId: k.citizenId, year: f.schoolYear })
      : { ok: true, reasons: [], memberBlocked: false, childBlocked: false };
    const gradeBelow = crit.minGpa > 0 && grade > 0 && grade < crit.minGpa;
    return { amount, crit, coef, age, elig, grade, gradeBelow };
  };

  const totalAmount = kids.reduce((s, k) => s + (kidCalc(k).amount || 0), 0);
  const memberElig = member
    ? window.schReqEligibility(list, { memberCode: member.code, year: f.schoolYear })
    : null;

  // ── เลือกสมาชิก → ดึงบุตรทั้งหมดเป็นแถวคำขอ + stamp เลขบัญชี ──
  const pick = (m) => {
    setMember(m); setError('');
    const ch = window.loadMemberChildren(m.code);
    setRegistryKids(ch);
    setF(s => {
      let acc = s.payAccount;
      if (s.payBy === 'coop') acc = window.memberPrimaryAccount(m.code, 'coop');
      else if (s.payBy === 'bank') acc = window.memberPrimaryAccount(m.code, 'bank');
      const studying = ch.filter(c => c.studying !== false).length || ch.length || 1;
      return { ...s, payAccount: acc, childrenStudying: String(studying) };
    });
    if (ch.length) {
      setKids(ch.map(c => srBlankKid({
        srcId: c.id, title: c.title, firstName: c.firstName, lastName: c.lastName,
        citizenId: c.citizenId, birthDate: c.birthDate, eduLevel: c.eduLevel,
      })));
    } else {
      setKids([srBlankKid({ lastName: m.lastName })]);
    }
  };

  // ── การจัดการแถวบุตร ──
  const setKid = (key, patch) => { setKids(ks => ks.map(x => x.key === key ? { ...x, ...patch } : x)); setError(''); };
  const setKidGpa = (key, v) => setKid(key, { gpa: v, percent: window.schGradeToPct(v) });
  const setKidPct = (key, v) => setKid(key, { percent: v, gpa: window.schPctToGrade(v) });
  const pickKidSrc = (key, id) => {
    if (id === '__manual') { setKid(key, { srcId: '__manual', firstName: '', lastName: member ? member.lastName : '', citizenId: '', birthDate: '' }); return; }
    const c = registryKids.find(x => x.id === id);
    if (c) setKid(key, { srcId: id, title: c.title, firstName: c.firstName, lastName: c.lastName, citizenId: c.citizenId, birthDate: c.birthDate, eduLevel: c.eduLevel });
  };
  const addKid = () => { setKids(ks => [...ks, srBlankKid({ lastName: member ? member.lastName : '' })]); setError(''); };
  const removeKid = (key) => setKids(ks => ks.length > 1 ? ks.filter(x => x.key !== key) : ks);

  // เปลี่ยนวิธีจ่าย → stamp เลขบัญชี / เปิด-ปิดช่องอัตโนมัติ
  const changePayBy = (v) => {
    setError('');
    setF(s => {
      let acc = s.payAccount, mo = s.moneyOrder, addr = s.payAddress;
      if (v === 'coop') { acc = member ? window.memberPrimaryAccount(member.code, 'coop') : ''; mo = ''; addr = ''; }
      else if (v === 'bank') { acc = member ? window.memberPrimaryAccount(member.code, 'bank') : ''; mo = ''; addr = ''; }
      else if (v === 'cash') { acc = ''; mo = ''; addr = ''; }
      else if (v === 'postal') { acc = ''; }
      return { ...s, payBy: v, payAccount: acc, moneyOrder: mo, payAddress: addr };
    });
  };
  const pickAccount = (accNo) => { setF(s => ({ ...s, payAccount: accNo })); setAcctModal(false); };

  // แนบไฟล์หลักฐานผลการศึกษา
  const onFiles = (e) => {
    const names = [...e.target.files].map(x => x.name);
    if (names.length) setFiles(prev => [...prev, ...names]);
    e.target.value = '';
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const isPostal = f.payBy === 'postal';
  const acctDisabled = f.payBy === 'cash' || f.payBy === 'postal';
  const acctSearchable = f.payBy === 'coop' || f.payBy === 'bank';

  const submit = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกผู้ขอทุนก่อนบันทึก'); return; }
    if (!f.schoolYear.trim()) { setError('กรุณากรอกปีการศึกษา'); return; }
    const valid = kids.filter(k => k.firstName.trim());
    if (!valid.length) { setError('กรุณากรอกชื่อบุตรผู้รับทุนอย่างน้อย 1 ราย'); return; }
    if (isPostal && !f.payAddress.trim()) { setError('จ่ายโดยธนาณัติ — กรุณาระบุที่อยู่จัดส่งธนาณัติ'); return; }

    // ตรวจสิทธิปีเว้นปี (สมาชิก + บุตร)
    if (memberElig && memberElig.memberBlocked) { setError(memberElig.reasons[0]); return; }
    for (const k of valid) {
      const c = kidCalc(k);
      if (c.elig.childBlocked) { setError(`${k.title}${k.firstName} ${k.lastName}: ${c.elig.reasons.find(r => true) || 'ไม่มีสิทธิ์ขอทุนปีนี้'}`); return; }
      if (c.amount <= 0) { setError(`ไม่พบจำนวนเงินทุนสำหรับ ${k.firstName} (${window.schLabel('eduLevel', k.eduLevel)}) — ตรวจสอบเมนูกำหนดจำนวนทุนการศึกษา`); return; }
    }

    // สร้างใบคำขอรายบุตร — เลขเอกสารไล่ลำดับต่อเนื่อง
    let working = [...list];
    const records = [];
    valid.forEach((k, i) => {
      const c = kidCalc(k);
      const id = srNextDocNo(working, f.schoolYear, f.scholarType);
      const rec = {
        id, reqDate, enteredBy: SR_USER,
        memberCode: member.code, memberName: member.name,
        schoolYear: Number(f.schoolYear) || 0, seq: i + 1,
        scholarType: f.scholarType, eduLevel: k.eduLevel,
        childTitle: k.title, childFirst: k.firstName.trim(), childLast: k.lastName.trim(),
        childCitizenId: k.citizenId.trim(), childBirth: k.birthDate, childAge: c.age,
        childrenStudying: Number(f.childrenStudying) || 0,
        gpa: Number(k.gpa) || 0, percent: Number(k.percent) || 0, coefficient: c.coef,
        payBy: f.payBy, payAccount: (f.payAccount || '').trim(),
        moneyOrder: (f.moneyOrder || '').trim(), payAddress: (f.payAddress || '').trim(),
        attachments: [...files],
        amount: c.amount, status: 'pending',
      };
      records.push(rec);
      working = [rec, ...working];
    });
    onSubmit(records);
  };

  return (
    <div data-screen-label="หน้าสร้างคำขอทุนการศึกษา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สร้างคำขอทุนสวัสดิการทุนการศึกษา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กรอกข้อมูลสมาชิกผู้ขอทุน · ข้อมูลบุตรและผลการเรียน · วิธีรับเงิน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <button className="btn primary sm" onClick={submit}><Icon name="check" /> บันทึกคำขอ</button>
      </div>

      {error && (
        <div className="sr-error"><Icon name="info" size={14} /> {error}</div>
      )}

      {/* ── ส่วนข้อมูลระบบคำขอ ─────────────────────────────────────── */}
      <div className="search-card sr-sys">
        <div className="sr-sys-grid">
          <SrField label="วันยื่นคำขอ">
            <ErpDate value={reqDate} onChange={(v) => ((e) => setReqDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </SrField>
          <SrField label="เลขใบคำขอ" hint="(สร้างอัตโนมัติเมื่อบันทึก)">
            <input className="cfg-input mono sr-readonly" value="Auto" readOnly />
          </SrField>
          <SrField label="ผู้ป้อนคำขอ" hint="(จากการล็อกอิน)">
            <input className="cfg-input sr-readonly" value={SR_USER} readOnly />
          </SrField>
        </div>
      </div>

      {/* ── รายละเอียดสมาชิกผู้ขอทุน ───────────────────────────────── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>รายละเอียดสมาชิกผู้ขอทุน (บิดา / มารดา)</h3>
        </div>
        <div className="sr-member-3">
          <SrField label="เลขสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <MemberSearchField member={member} onPick={(m) => pick(window.schReqMember(m.code))}
                               source={window.MEMBERS_LIST} title="ค้นหาสมาชิก" />
          </SrField>
          <SrField label="ชื่อ-สกุล">
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </SrField>
          <SrField label="สังกัด">
            <input className="cfg-input sr-auto" value={member ? member.deptCode + ' · ' + member.dept : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </SrField>
          <SrField label="เป็นสมาชิกตั้งแต่">
            <input className="cfg-input sr-auto mono" value={member ? fmt.date(member.joinDate) : ''} readOnly placeholder="—" />
          </SrField>
          <SrField label="อายุสมาชิก" hint="(ปี)">
            <input className="cfg-input sr-auto mono" value={member ? memberAge.toFixed(2) : ''} readOnly placeholder="—" />
          </SrField>
          <SrField label="เงินเดือน">
            <input className="cfg-input sr-auto mono" value={member ? '฿ ' + fmt.money(member.salary, 0) : ''} readOnly placeholder="—" />
          </SrField>
        </div>
        {memberElig && memberElig.memberBlocked && (
          <div className="sr-elig-warn" style={{ marginTop: 12 }}>
            <Icon name="info" size={14} /> {memberElig.reasons[0]}
          </div>
        )}
      </div>

      {/* ── ข้อมูลบุตรผู้รับทุน และผลการเรียน (รองรับหลายราย) ──────── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลบุตรผู้รับทุน และผลการเรียน</h3>
          <span className="spacer" />
          <span className="chip primary">{kids.filter(k => k.firstName.trim()).length || 0} ใบคำขอ</span>
        </div>

        {/* เงื่อนไขร่วมของบุตรทุกราย */}
        <div className="sr-shared-grid">
          <SrField label="ปีการศึกษา (พ.ศ.)" required>
            <input className="cfg-input mono" type="number" inputMode="numeric" value={f.schoolYear}
                   onChange={(e) => set('schoolYear', e.target.value)} placeholder="2569" />
          </SrField>
          <SrField label="ประเภททุน">
            <select className="cfg-input" value={f.scholarType} onChange={(e) => set('scholarType', e.target.value)}>
              {window.SCH_OPTS.scholarType.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </SrField>
          <SrField label="จำนวนบุตรที่กำลังศึกษาอยู่" hint="(ใช้คำนวณสัมประสิทธิ์)">
            <input className="cfg-input mono sr-in-orange" type="number" inputMode="numeric" min="0"
                   value={f.childrenStudying} onChange={(e) => set('childrenStudying', e.target.value)} />
          </SrField>
        </div>

        {/* แถวรายบุตร */}
        <div className="sr-kid-list">
          {kids.map((k, idx) => {
            const c = kidCalc(k);
            const blocked = c.elig.childBlocked;
            const manualName = (
              <div className="sr-name-row">
                <select className="cfg-input" style={{ flex: '0 0 84px' }} value={k.title}
                        onChange={(e) => setKid(k.key, { title: e.target.value })}>
                  {window.SCHREQ_OPTS.titlePrefix.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <input className="cfg-input" style={{ flex: 1 }} value={k.firstName}
                       onChange={(e) => setKid(k.key, { firstName: e.target.value })} placeholder="ชื่อจริง" />
                <input className="cfg-input" style={{ flex: 1 }} value={k.lastName}
                       onChange={(e) => setKid(k.key, { lastName: e.target.value })} placeholder="นามสกุล" />
              </div>
            );
            return (
              <div className={"sr-kid-card" + (blocked ? ' blocked' : '')} key={k.key}>
                <div className="sr-kid-card-head">
                  <span className="sr-kid-no"><Icon name="user" size={12} /> บุตรคนที่ {idx + 1}</span>
                  {member && (blocked
                    ? <span className="chip danger">ไม่มีสิทธิ์ปีนี้</span>
                    : (k.firstName.trim() && <span className="chip success">มีสิทธิ์ขอทุน</span>))}
                  <span className="spacer" />
                  {kids.length > 1 && (
                    <button className="btn text sm danger" onClick={() => removeKid(k.key)} title="นำบุตรออก">
                      <Icon name="close" size={12} /> นำออก
                    </button>
                  )}
                </div>
                <div className="sr-kid-grid">
                  <SrField label="ชื่อบุตรผู้รับทุน" required span={2}
                           hint={registryKids.length > 0 ? '· เลือกจากทะเบียนบุตร (แสดงอายุต่อท้าย)' : (member ? '· ไม่พบบุตรในทะเบียน — กรอกเอง' : '')}>
                    {registryKids.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <select className="cfg-input sr-kid-select" value={k.srcId} onChange={(e) => pickKidSrc(k.key, e.target.value)}>
                          {registryKids.map(rc => (
                            <option key={rc.id} value={rc.id}>
                              {window.childFullName(rc)} · {window.schReqAgeLabel(rc.birthDate) || '—'} · {window.schLabel('eduLevel', rc.eduLevel)}
                            </option>
                          ))}
                          <option value="__manual">อื่น ๆ (กรอกข้อมูลเอง)</option>
                        </select>
                        {k.srcId === '__manual' && manualName}
                      </div>
                    ) : manualName}
                  </SrField>
                  <SrField label="ระดับชั้น" span={2}>
                    <select className="cfg-input" value={k.eduLevel} onChange={(e) => setKid(k.key, { eduLevel: e.target.value })}>
                      {window.SCH_OPTS.eduLevel.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </SrField>
                  <SrField label="เลขบัตรประชาชนบุตร" span={2}>
                    <input className="cfg-input mono" value={k.citizenId} maxLength={20}
                           onChange={(e) => setKid(k.key, { citizenId: e.target.value })} placeholder="x-xxxx-xxxxx-xx-x" />
                  </SrField>
                  <SrField label="วันเกิด">
                    <ErpDate value={k.birthDate} onChange={(v) => ((e) => setKid(k.key, { birthDate: e.target.value }))({ target: { value: v } })} className="cfg-input" />
                  </SrField>
                  <SrField label="อายุ" hint="(คำนวณอัตโนมัติ)">
                    <input className="cfg-input mono sr-auto" readOnly value={c.age != null ? c.age + ' ปี' : ''} placeholder="—" />
                  </SrField>
                  <SrField label="เกรดเฉลี่ย (GPA)" hint="(% คำนวณให้)">
                    <input className="cfg-input mono sr-in-green" type="number" inputMode="decimal" step="0.01" min="0" max="4"
                           value={k.gpa} onChange={(e) => setKidGpa(k.key, e.target.value)} placeholder="0.00" />
                  </SrField>
                  <SrField label="เปอร์เซ็นต์ (%)" hint="(GPA คำนวณให้)">
                    <input className="cfg-input mono" type="number" inputMode="decimal" step="0.01" min="0" max="100"
                           value={k.percent} onChange={(e) => setKidPct(k.key, e.target.value)} placeholder="0.00" />
                  </SrField>
                  <SrField label="สัมประสิทธิ์" hint="(อัตโนมัติ)">
                    <input className="cfg-input mono sr-auto" readOnly value={c.coef ? c.coef.toFixed(2) : ''} placeholder="—" />
                  </SrField>
                  <SrField label="ทุนที่จะได้รับ">
                    <input className="cfg-input mono sr-auto" readOnly
                           value={c.amount > 0 ? '฿ ' + fmt.money(c.amount, 2) : ''} placeholder="—" />
                  </SrField>
                </div>
                {(c.crit.minGpa > 0 || blocked) && (
                  <div className={"sr-kid-foot" + (blocked || c.gradeBelow ? ' warn' : '')}>
                    <Icon name="info" size={11} />
                    {blocked
                      ? <span>{c.elig.reasons[0]}</span>
                      : c.gradeBelow
                        ? <span>เกรด {c.grade.toFixed(2)} ต่ำกว่าเกณฑ์ขั้นต่ำ {c.crit.minGpa.toFixed(2)} ({c.crit.minPercent.toFixed(0)}%) — อาจไม่ผ่านการพิจารณา</span>
                        : <span>เกณฑ์ผลการเรียนขั้นต่ำ {c.crit.minGpa.toFixed(2)} (≥ {c.crit.minPercent.toFixed(0)}%)</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn dashed sm sr-add-kid" onClick={addKid}><Icon name="plus" size={13} /> เพิ่มบุตร</button>

        {/* แนบไฟล์หลักฐาน (ใช้ร่วมทุกใบคำขอ) */}
        <SrField label="แนบไฟล์หลักฐานผลการศึกษา" full hint="(รองรับรูปภาพ / PDF · แนบครั้งเดียวใช้กับทุกใบคำขอ)">
          <label className="sr-file-btn">
            <Icon name="attach" size={14} /> เลือกไฟล์เพื่อแนบ…
            <input type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={onFiles} />
          </label>
          {files.length > 0 && (
            <div className="sr-file-list">
              {files.map((nm, i) => (
                <span className="sr-file-chip" key={i}>
                  <Icon name="attach" size={11} />
                  <span className="nm">{nm}</span>
                  <button type="button" onClick={() => removeFile(i)} title="ลบไฟล์"><Icon name="close" size={10} /></button>
                </span>
              ))}
            </div>
          )}
        </SrField>
        <div className="sr-grade-note muted">
          <Icon name="info" size={12} /> กรอกเกรดเฉลี่ยหรือเปอร์เซ็นต์ช่องใดช่องหนึ่ง อีกช่องจะคำนวณให้อัตโนมัติ · ระบบสร้างใบคำขอแยกตามรายบุตร · สมาชิก/บุตรขอทุนได้ปีเว้นปี (ตรวจสิทธิอัตโนมัติ)
        </div>
      </div>

      {/* ── ข้อมูลการรับเงิน ───────────────────────────────────────── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลการรับเงิน</h3>
        </div>
        <div className="sr-pay-wrap">
          <div className="sr-pay-grid">
            <SrField label="จ่ายโดย">
              <SrSelect group="payBy" value={f.payBy} onChange={changePayBy} />
            </SrField>
            <SrField label="เลขบัญชี" hint={acctDisabled ? '(ปิดใช้งานสำหรับวิธีนี้)' : '(คลิกเพื่อค้นหา)'}>
              {acctSearchable ? (
                <div className="sr-pick-field" onClick={() => member && setAcctModal(true)}>
                  <input className="cfg-input mono sr-clickable" value={f.payAccount} readOnly
                         placeholder={member ? 'คลิกเพื่อค้นหาบัญชี' : 'เลือกสมาชิกก่อน'} />
                  <Icon name="search" size={14} />
                </div>
              ) : (
                <input className="cfg-input mono" value="" disabled placeholder="ปิดใช้งาน" />
              )}
            </SrField>
            <SrField label="เลขที่ธนาณัติ" hint={isPostal ? '' : '(เฉพาะจ่ายทางไปรษณีย์)'}>
              <input className="cfg-input mono" value={f.moneyOrder} disabled={!isPostal}
                     onChange={(e) => set('moneyOrder', e.target.value)}
                     placeholder={isPostal ? 'เลขที่ธนาณัติ' : 'ปิดใช้งาน'} />
            </SrField>
            <SrField label="ที่อยู่จัดส่งธนาณัติ" required={isPostal} span={3}
                     hint={isPostal ? '(บ้านเลขที่ · ถนน · ตำบล/แขวง · อำเภอ/เขต · จังหวัด · รหัสไปรษณีย์)' : '(เปิดใช้งานเมื่อจ่ายโดยธนาณัติ)'}>
              <textarea className="cfg-input sr-addr" rows={2} value={f.payAddress} disabled={!isPostal}
                        onChange={(e) => set('payAddress', e.target.value)}
                        placeholder={isPostal ? 'ระบุที่อยู่สำหรับจัดส่งธนาณัติ' : 'ปิดใช้งาน — เลือกจ่ายโดยธนาณัติเพื่อระบุที่อยู่'} />
            </SrField>
          </div>
          <div className="sr-amount-box">
            <div className="sr-amount-label">รวมทุนการศึกษาที่จะจ่าย</div>
            <div className="sr-amount-value">฿ {fmt.money(totalAmount, 2)}</div>
            <div className="sr-amount-sub">
              {totalAmount > 0
                ? <>{kids.filter(k => k.firstName.trim()).length} ใบคำขอ · {window.schLabel('scholarType', f.scholarType)} · ปี {f.schoolYear}</>
                : <>ยังไม่พบอัตราทุนสำหรับเงื่อนไขที่เลือก</>}
            </div>
          </div>
        </div>
      </div>

      {acctModal && member && (
        <SrAccountSearchModal member={member} kind={f.payBy}
                              onPick={pickAccount} onClose={() => setAcctModal(false)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียน / ติดตามคำขอ (list)
// ════════════════════════════════════════════════════════════════════
function SrListView({ list, onCreate, onOpenHistory, onOpen }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('all');
  const [yearF, setYearF] = useState('all');

  const years = [...new Set(list.map(r => r.schoolYear))].sort((a, b) => b - a);

  const rows = useMemo(() => {
    let r = list;
    if (dateFrom) r = r.filter(x => x.reqDate >= dateFrom);
    if (dateTo) r = r.filter(x => x.reqDate <= dateTo);
    if (code.trim()) {
      const n = code.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n));
    }
    if (type !== 'all') r = r.filter(x => x.scholarType === type);
    if (yearF !== 'all') r = r.filter(x => String(x.schoolYear) === String(yearF));
    return [...r].sort((a, b) => b.reqDate.localeCompare(a.reqDate) || b.id.localeCompare(a.id));
  }, [list, dateFrom, dateTo, code, type, yearF]);

  const hasFilter = dateFrom || dateTo || code || type !== 'all' || yearF !== 'all';
  const clear = () => { setDateFrom(''); setDateTo(''); setCode(''); setType('all'); setYearF('all'); };

  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const pendingCnt = rows.filter(r => r.status === 'pending').length;

  return (
    <div data-screen-label="หน้าทะเบียนคำขอทุนการศึกษา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>คำขอทุนสวัสดิการทุนการศึกษา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาและติดตามสถานะคำขอที่ยื่นเข้ามา · สร้างคำขอของสมาชิกเพิ่มเติม
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onOpenHistory}><Icon name="history" /> ประวัติการทำรายการ</button>
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> สร้างคำขอ</button>
      </div>

      <div className="search-card">
        {/* ── ตัวกรองค้นหา ── */}
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>วันยื่นคำขอ (จาก – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ErpDate value={dateFrom} onChange={(v) => ((e) => setDateFrom(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => ((e) => setDateTo(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="filter-select" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขสมาชิก / ชื่อ / เลขใบคำขอ</span>
            <div className="search" style={{ flex: 'none', width: 280, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น M-058241" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภททุน</span>
            <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">ทุกประเภททุน</option>
              {window.SCH_OPTS.scholarType.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ปีทุนการศึกษา</span>
            <select className="filter-select" value={yearF} onChange={(e) => setYearF(e.target.value)} style={{ width: 130 }}>
              <option value="all">ทุกปี</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {hasFilter && (
            <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>
          )}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {/* ── ตารางคำขอ ── */}
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขใบคำขอ</th>
                <th className="center">วันยื่นคำขอ</th>
                <th>สมาชิกผู้ขอ</th>
                <th>ประเภททุน</th>
                <th>ระดับชั้น</th>
                <th>ชื่อบุตร</th>
                <th className="center">ปีทุน</th>
                <th className="num">จำนวนเงิน</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบคำขอที่ตรงกับเงื่อนไขการค้นหา
                </td></tr>
              ) : rows.map(r => {
                const st = window.schReqStatus(r.status);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="center mono">{fmt.date(r.reqDate)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>{window.schLabel('scholarType', r.scholarType)}</td>
                    <td>{window.schLabel('eduLevel', r.eduLevel)}</td>
                    <td>{r.childTitle}{r.childFirst} {r.childLast}</td>
                    <td className="center mono">{r.schoolYear}</td>
                    <td className="num"><b>{fmt.money(r.amount, 2)}</b></td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวรายการเพื่อดูรายละเอียดคำขอ · คลิก “สร้างคำขอ” เพื่อยื่นคำขอของสมาชิกรายใหม่
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Popup สรุปเลขใบคำขอที่ระบบสร้าง (แสดงเมื่อกดบันทึก) — จัดกลุ่มตามประเภททุน
// ════════════════════════════════════════════════════════════════════
function SrSaveSummaryModal({ records, onClose }) {
  if (!records || !records.length) return null;
  // จัดกลุ่มตามประเภทคำขอทุน
  const groups = {};
  records.forEach(r => { (groups[r.scholarType] = groups[r.scholarType] || []).push(r); });
  const groupList = Object.keys(groups).map(t => ({
    type: t, label: window.schLabel('scholarType', t), rows: groups[t],
    sum: groups[t].reduce((s, r) => s + (Number(r.amount) || 0), 0),
  }));
  const total = records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const member = records[0];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="modal-warnico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}><Icon name="check" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>บันทึกคำขอเรียบร้อยแล้ว</h2>
            <div className="muted" style={{ fontSize: 11.5 }}>
              ระบบสร้างเลขใบคำขอ {records.length} รายการ · {member.memberName} <span className="mono">({member.memberCode})</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '62vh', overflowY: 'auto' }}>
          <div className="sr-sum-groups">
            {groupList.map(g => (
              <div className="sr-sum-group" key={g.type}>
                <div className="sr-sum-group-head">
                  <span className="chip primary">{g.label}</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>{g.rows.length} ใบคำขอ</span>
                  <span className="spacer" />
                  <span className="sr-sum-group-total mono">฿ {fmt.money(g.sum, 2)}</span>
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 150 }}>เลขใบคำขอ</th>
                      <th>บุตรผู้รับทุน</th>
                      <th>ระดับชั้น</th>
                      <th className="num" style={{ width: 120 }}>จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map(r => (
                      <tr key={r.id}>
                        <td className="mono"><b>{r.id}</b></td>
                        <td>{r.childTitle}{r.childFirst} {r.childLast}</td>
                        <td>{window.schLabel('eduLevel', r.eduLevel)}</td>
                        <td className="num"><b>{fmt.money(r.amount, 2)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="sr-sum-total">
            <span>รวมทุนการศึกษาทั้งหมด</span>
            <span className="spacer" />
            <span className="sr-sum-total-val">฿ {fmt.money(total, 2)}</span>
          </div>
        </div>
        <div className="ins-modal-foot" style={{ padding: '0 18px 16px' }}>
          <span className="muted" style={{ fontSize: 11 }}><Icon name="info" size={11} /> คำขอถูกบันทึกในทะเบียนแล้ว สถานะเริ่มต้น “รออนุมัติ”</span>
          <span className="spacer" />
          <button className="btn primary sm" onClick={onClose}><Icon name="check" /> เสร็จสิ้น</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับระหว่าง list / form
// ════════════════════════════════════════════════════════════════════
function ScholarshipRequestPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(srLoad);
  const [mode, setMode] = useState('list');   // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const [saveSummary, setSaveSummary] = useState(null);   // รายการที่เพิ่งสร้าง → popup สรุป

  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const submit = (recs) => {
    const records = Array.isArray(recs) ? recs : [recs];
    if (!records.length) return;
    const next = [...records.slice().reverse(), ...list];
    setList(next);
    srSaveLS(next);
    const total = records.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const first = records[0];
    audit.log({
      action: 'create', module: 'สวัสดิการ — คำขอทุนการศึกษา',
      target: `${first.memberCode} · ${first.memberName}`,
      summary: records.length > 1
        ? `ยื่นคำขอทุนการศึกษา ${records.length} ใบ (บุตร ${records.length} ราย) · ${first.memberName} · รวม ${fmt.money(total, 2)} บาท`
        : `ยื่นคำขอทุนการศึกษา ${first.id} · ${window.schLabel('scholarType', first.scholarType)} · บุตร ${first.childFirst} ${first.childLast} · ${fmt.money(first.amount, 2)} บาท`,
      changes: records.map(r => ({
        field: 'ใบคำขอ ' + r.id,
        before: '—',
        after: `${r.childTitle}${r.childFirst} ${r.childLast} · ${window.schLabel('eduLevel', r.eduLevel)} · ${fmt.money(r.amount, 2)} บาท`,
      })),
    });
    onToast && onToast(records.length > 1
      ? `บันทึกคำขอ ${records.length} ใบ · ${first.memberName} เรียบร้อยแล้ว`
      : `บันทึกคำขอ ${first.id} · ${first.memberName} เรียบร้อยแล้ว`);
    setSaveSummary(records);
    setMode('list');
  };

  return (
    <>
      {mode === 'list'
        ? <SrListView list={list} onCreate={() => setMode('form')} onOpenHistory={() => setHistOpen(true)} onOpen={openDetail} />
        : mode === 'detail'
          ? <SrDetailView rec={current} onBack={() => setMode('list')} />
          : <SrCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} />}
      {histOpen && (
        <SrHistoryDrawer onClose={() => setHistOpen(false)} />
      )}
      {saveSummary && (
        <SrSaveSummaryModal records={saveSummary} onClose={() => setSaveSummary(null)} />
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดคำขอ (อ่านอย่างเดียว)
// ════════════════════════════════════════════════════════════════════
function SrDetailRow({ label, value, mono }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={"value" + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}
function SrDetailView({ rec, onBack }) {
  if (!rec) return null;
  const st = window.schReqStatus(rec.status);
  const childName = `${rec.childTitle || ''}${rec.childFirst || ''} ${rec.childLast || ''}`.trim();
  const payByLabel = window.schReqLabel('payBy', rec.payBy);
  return (
    <div data-screen-label="หน้ารายละเอียดคำขอทุนการศึกษา">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <span className="spacer" />
      </div>

      {/* การ์ดหัวเรื่อง — รูปแบบเดียวกับหน้ารายละเอียดค่าคงที่ข้อกำหนดสินเชื่อ */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">รายละเอียดคำขอทุนการศึกษา</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{window.schLabel('scholarType', rec.scholarType)}</span><span className="dot" />
              <span>ยื่นเมื่อ {fmt.date(rec.reqDate)}</span><span className="dot" />
              <span>โดย {rec.enteredBy}</span>
            </div>
          </div>
          <span className={"pill " + st.pill} style={{ height: 24 }}>{st.l}</span>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">สมาชิกผู้ขอ</span>
            <span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">บุตรผู้รับทุน</span>
            <span className="lt-date-v">{childName}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">จำนวนเงินทุนการศึกษา</span>
            <span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>฿ {fmt.money(rec.amount, 2)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">ระดับ / ปีการศึกษา</span>
            <span className="lt-date-v">{window.schLabel('eduLevel', rec.eduLevel)} · {rec.schoolYear}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลคำขอ</h3></div>
        <div className="form-grid">
          <SrDetailRow label="เลขใบคำขอ" value={rec.id} mono />
          <SrDetailRow label="วันยื่นคำขอ" value={fmt.date(rec.reqDate)} />
          <SrDetailRow label="ผู้ป้อนคำขอ" value={rec.enteredBy} />
          <SrDetailRow label="ประเภททุน" value={window.schLabel('scholarType', rec.scholarType)} />
          <SrDetailRow label="ปีการศึกษา" value={rec.schoolYear} />
          <SrDetailRow label="ลำดับที่" value={rec.seq} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สมาชิกผู้ขอทุน</h3></div>
        <div className="form-grid">
          <SrDetailRow label="เลขสมาชิก" value={rec.memberCode} mono />
          <SrDetailRow label="ชื่อ-สกุล" value={rec.memberName} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลบุตรผู้รับทุน และผลการเรียน</h3></div>
        <div className="form-grid">
          <SrDetailRow label="ชื่อบุตร" value={childName} />
          <SrDetailRow label="เลขบัตรประชาชนบุตร" value={rec.childCitizenId} mono />
          <SrDetailRow label="วันเกิด" value={rec.childBirth ? fmt.date(rec.childBirth) : '—'} />
          <SrDetailRow label="อายุ" value={(rec.childAge != null ? rec.childAge : window.schReqAge(rec.childBirth)) != null ? ((rec.childAge != null ? rec.childAge : window.schReqAge(rec.childBirth)) + ' ปี') : '—'} />
          <SrDetailRow label="ระดับชั้น" value={window.schLabel('eduLevel', rec.eduLevel)} />
          <SrDetailRow label="จำนวนบุตรที่กำลังศึกษา" value={rec.childrenStudying} />
          <SrDetailRow label="เกรดเฉลี่ย (GPA)" value={rec.gpa ? rec.gpa.toFixed(2) : '—'} />
          <SrDetailRow label="เปอร์เซ็นต์" value={rec.percent ? rec.percent.toFixed(2) + '%' : '—'} />
          <SrDetailRow label="สัมประสิทธิ์" value={rec.coefficient ? rec.coefficient.toFixed(2) : '—'} />
          <SrDetailRow label="ไฟล์แนบหลักฐาน" value={rec.attachments && rec.attachments.length ? rec.attachments.join(' · ') : '—'} />
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลการรับเงิน</h3></div>
        <div className="form-grid">
          <SrDetailRow label="จ่ายโดย" value={payByLabel} />
          <SrDetailRow label="เลขบัญชี" value={rec.payAccount || '—'} mono />
          <SrDetailRow label="เลขที่ธนาณัติ" value={rec.moneyOrder || '—'} mono />
          {rec.payBy === 'postal' && <SrDetailRow label="ที่อยู่จัดส่งธนาณัติ" value={rec.payAddress || '—'} />}
          <SrDetailRow label="จำนวนเงินที่ได้รับ" value={'฿ ' + fmt.money(rec.amount, 2)} />
        </div>
      </div>
    </div>
  );
}

// ─── ประวัติการทำรายการ (เฉพาะโมดูลคำขอทุนการศึกษา) ───────────────────
function SrHistoryDrawer({ onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  const rows = [...all.filter(e => (e.module || '').includes('คำขอทุนการศึกษา'))]
    .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)',
                        color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
            <Icon name="history" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>ประวัติการทำรายการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>คำขอทุนสวัสดิการทุนการศึกษา</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {rows.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>
              ยังไม่มีประวัติการทำรายการ
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map(e => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={"tx-dot " + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={"pill " + a.pill}>{a.label}</span>
                        <span className="tx-mod">{e.module}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span><span className="sep">·</span><span>{e.role}</span>
                        <span className="sep">·</span><span className="mono muted">{e.id}</span>
                      </div>
                      {e.changes && e.changes.length > 0 && (
                        <div className="tx-changes">
                          {e.changes.map((c, i) => (
                            <div className="tx-change" key={i}>
                              <span className="fld">{c.field}</span>
                              <span className="before">{c.before}</span>
                              <span className="arr">→</span>
                              <span className="after">{c.after}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ScholarshipRequestPage });
