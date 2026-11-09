// ─── หน้าเพิ่มสมาชิกใหม่ (Add member) ──────────────────────────────────
// โครงสร้างตามแบบฟอร์มใบสมัครสมาชิกสหกรณ์ออมทรัพย์ 8 ส่วน:
//   1. สร้างข้อมูลสมาชิก (ข้อมูลที่มาของการสมัคร — ส่วนใหญ่ Auto/Default)
//   2. ข้อมูลเบื้องต้นของผู้สมัคร (สังกัดหัวหน้า + popup ค้นหา, บัตร ปชช., ชื่อ-สกุล)
//   3. ข้อมูลที่อยู่   4. ข้อมูลการติดต่อ   5. ข้อมูลส่วนตัว
//   6. ข้อมูลการทำงานและสถานะการเงิน   7. ข้อมูลสำหรับสมาชิกเก่า   8. การส่งหุ้นและอื่นๆ

// ─── reusable controls ──────────────────────────────────────────────
function MFField({ label, required, children, hint, error, full, span }) {
  return (
    <div className={"mf-field" + (full ? " full" : "")} style={span ? { gridColumn: `span ${span}` } : undefined}>
      {(label || required) && label !== false && label !== '' && <label className="mf-label">
        {label}{required && <span className="cfg-required">*</span>}
      </label>}
      {children}
      {error && <div className="mf-err"><Icon name="info" size={11} /> {error}</div>}
      {hint && !error && <div className="cfg-hint">{hint}</div>}
    </div>
  );
}

function MFInput({ value, onChange, mono, error, danger, ...rest }) {
  return (
    <input className={"mf-input" + (mono ? " mono" : "") + (error ? " has-error" : "") + (danger ? " danger-text" : "")}
           value={value || ''} onChange={(e) => onChange(e.target.value)} {...rest} />
  );
}

function MFSelect({ value, onChange, options, placeholder, disabled }) {
  return (
    <select className="mf-input" value={value || ''} disabled={disabled}
            onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function MFRadioGroup({ value, onChange, options }) {
  return (
    <div className="mf-radio-group">
      {options.map(o => (
        <div key={o} className={"mf-radio" + (value === o ? " on" : "")}
             onClick={() => onChange(o)} role="radio" aria-checked={value === o}>
          <span className="dot" />{o}
        </div>
      ))}
    </div>
  );
}

function MFReadonly({ value, tag, mono, highlight }) {
  return (
    <div className={"mf-readonly" + (mono ? " mono" : "") + (highlight ? " auto-yellow" : "")}>
      <span>{value || <span className="muted">—</span>}</span>
      {tag && <span className="mf-auto-tag">{tag}</span>}
    </div>
  );
}

// อัปโหลดไฟล์รูป → dataURL
function readImageFile(file, cb) {
  if (!file) return;
  const r = new FileReader();
  r.onload = (e) => cb(e.target.result);
  r.readAsDataURL(file);
}

// แยกชื่อเต็ม "นางสาวพรพิมล ทองคำ" → { title, firstName, lastName }
function splitThaiName(full) {
  let title = '', rest = full || '';
  for (const t of ['นางสาว', 'นาง', 'นาย']) {
    if (rest.startsWith(t)) { title = t; rest = rest.slice(t.length).trim(); break; }
  }
  const sp = rest.indexOf(' ');
  return sp === -1
    ? { title, firstName: rest, lastName: '' }
    : { title, firstName: rest.slice(0, sp), lastName: rest.slice(sp + 1) };
}

// ─── popup ค้นหาสมาชิก (สำหรับคู่สมรสที่เป็นสมาชิก) ──────────────────
function MemberLookup({ members, onPick, selectedCode }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    let r = members;
    if (n) r = r.filter(m => m.code.toLowerCase().includes(n) || m.name.toLowerCase().includes(n) || m.citizenId.includes(n));
    return r.slice(0, 8);
  }, [q, members]);

  return (
    <div className="mf-lookup" ref={ref}>
      <div className="mf-input" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'text', padding: '0 10px' }}
           onClick={() => setOpen(true)}>
        <Icon name="search" size={14} />
        <input style={{ border: 0, outline: 0, flex: 1, background: 'transparent', font: 'inherit', color: 'inherit' }}
               placeholder="ค้นหารหัสสมาชิก / ชื่อ / เลขบัตร เพื่อดึงข้อมูล"
               value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
      </div>
      {open && (
        <div className="mf-lookup-list">
          {results.length === 0 ? (
            <div className="mf-lookup-item muted">ไม่พบสมาชิกที่ตรงกับการค้นหา</div>
          ) : results.map(m => (
            <div key={m.code} className="mf-lookup-item" onClick={() => { onPick(m); setOpen(false); setQ(''); }}>
              <span className="row-avatar">{m.name.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>{m.name}</div>
                <div className="code">{m.code} · {m.citizenId}</div>
              </div>
              {m.code === selectedCode && <Icon name="check" size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── popup ค้นหาสังกัด / หน่วยงาน (เลขสังกัด, ชื่อสังกัด, ชื่อหน่วยงาน) ──
function DepartmentSearchModal({ onPick, onClose }) {
  const [c, setC] = useState({ code: '', name: '', unit: '' });
  const [results, setResults] = useState(() => window.DEPARTMENTS);
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const run = () => setResults(window.searchDepartments(c));
  const reset = () => { setC({ code: '', name: '', unit: '' }); setResults(window.DEPARTMENTS); };

  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสังกัด / หน่วยงาน</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <label className="gc-sf">
              <span>1. เลขสังกัด</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น 0801" className="mono" />
            </label>
            <label className="gc-sf">
              <span>2. ชื่อสังกัด</span>
              <input value={c.name} onChange={(e) => set('name', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น กองคลัง" />
            </label>
            <label className="gc-sf">
              <span>3. ชื่อหน่วยงาน</span>
              <input value={c.unit} onChange={(e) => set('unit', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น กลุ่มงานบัญชี" />
            </label>
            <div className="gc-sf-actions" style={{ gridColumn: '1 / -1' }}>
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4, fontWeight: 600 }}>
            รายละเอียด <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>เลขสังกัด</th>
                  <th>ชื่อสังกัด</th>
                  <th>ชื่อหน่วยงาน</th>
                  <th>หัวหน้าสังกัด</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบสังกัดที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map((d) => (
                  <tr key={d.code} className="clickable" onClick={() => onPick(d)}>
                    <td className="mono">{d.code}</td>
                    <td>{d.name}</td>
                    <td>{d.unit}</td>
                    <td className="muted">{d.head}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(d); }} title="เลือกสังกัด">
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

// ─── ฟอร์มหลัก ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  // 1. สร้างข้อมูลสมาชิก
  applicationNo: '', recordDate: new Date().toISOString().slice(0, 10),
  applyCount: 'ครั้งที่ 1', joinDate: new Date().toISOString().slice(0, 10),
  // 2. ข้อมูลเบื้องต้น
  deptCode: '', deptName: '', deptUnit: '', deptHead: '',
  citizenId: '', title: 'นาย', firstName: '', lastName: '', nationality: 'ไทย',
  // 3. ที่อยู่
  addrNo: '', addrMoo: '', village: '', soi: '', road: '', zipcode: '',
  province: '', amphoe: '', tambon: '',
  // 4. ติดต่อ
  phoneHome: '', phoneWork: '', mobile: '', email: '',
  // 5. ส่วนตัว
  maritalStatus: 'โสด', gender: 'ชาย',
  spouse: { isMember: false, memberCode: null, name: '' },
  birthDate: '', retireDate: '',
  // 6. การทำงาน + สถานะการเงิน
  memberType: 'ไม่ระบุ', subsidiaryType: 'สมทบพนักงาน',
  employeeId: '', salary: '', entryDeposit: String(window.DEFAULT_ENTRY_DEPOSIT.toFixed(2)),
  // 7. สมาชิกเก่า
  isFormer: false, resignDate: '', prevCode: '', resignReason: '', resignReasonText: '',
  // 8. หุ้น + อื่นๆ
  shareValue: '', shareBaseSalary: '', note: '',
  signatureUrl: null, photoUrl: null,
};

function MemberFormPage({ members, onSave, onCancel }) {
  const [f, setF] = useState(() => JSON.parse(JSON.stringify(EMPTY_FORM)));
  const [errors, setErrors] = useState({});
  const [deptModal, setDeptModal] = useState(false);
  const photoRef = useRef(null);
  const sigRef = useRef(null);

  const memberCode = 'AUTO';
  const user = window.CURRENT_USER;
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const setSpouse = (k, v) => setF(s => ({ ...s, spouse: { ...s.spouse, [k]: v } }));

  const married = f.maritalStatus === 'สมรส';
  const isSubsidiary = f.memberType === 'สมาชิกสมทบ';

  // ── ที่อยู่: cascade จังหวัด → อำเภอ → ตำบล
  const amphoeOptions = useMemo(() => window.AMPHOES[f.province] || [], [f.province]);
  const tambonOptions = useMemo(() => window.TAMBONS[f.amphoe] || [], [f.amphoe]);
  const setProvince = (v) => setF(s => ({ ...s, province: v, amphoe: '', tambon: '' }));
  const setAmphoe   = (v) => setF(s => ({ ...s, amphoe: v, tambon: '' }));

  // ── สังกัดหัวหน้า: เลือกจาก popup
  const pickDept = (d) => {
    setF(s => ({ ...s, deptCode: d.code, deptName: d.name, deptUnit: d.unit, deptHead: d.head }));
    setDeptModal(false);
  };

  // ── คู่สมรสเป็นสมาชิก → ดึงชื่อมาเติม
  const pickSpouseMember = (m) =>
    setF(s => ({ ...s, spouse: { isMember: true, memberCode: m.code, name: m.name } }));
  const clearSpouseMember = () =>
    setF(s => ({ ...s, spouse: { isMember: false, memberCode: null, name: '' } }));

  // ── ตรวจสอบสมาชิกเก่าจากเลขบัตรประชาชน (เมื่อกรอกครบ 13 หลัก)
  const onCitizenId = (v) => {
    const former = window.lookupFormerMember(v);
    setF(s => ({
      ...s, citizenId: v,
      ...(former
        ? { isFormer: true, resignDate: former.resignDate, prevCode: former.prevCode,
            resignReason: former.reasonCode, resignReasonText: former.reasonText }
        : { isFormer: false }),
    }));
  };

  const onMoney = (k) => (v) => set(k, v.replace(/[^\d.]/g, ''));

  const validate = () => {
    const e = {};
    if (!f.applicationNo.trim()) e.applicationNo = 'กรุณาระบุเลขที่ใบสมัคร';
    if (!f.firstName.trim()) e.firstName = 'กรุณาระบุชื่อ';
    if (!f.lastName.trim()) e.lastName = 'กรุณาระบุนามสกุล';
    if (!/^[\d-]{13,17}$/.test(f.citizenId.replace(/\s/g, ''))) e.citizenId = 'เลขบัตรประชาชนต้องมี 13 หลัก';
    if (!f.birthDate) e.birthDate = 'กรุณาเลือกวันเกิด';
    if (!f.employeeId.trim()) e.employeeId = 'กรุณาระบุเลขพนักงาน';
    if (married && !f.spouse.name.trim()) e.spouseName = 'กรุณาระบุชื่อคู่สมรส';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector('.mf-input.has-error')?.focus();
      return;
    }
    const fullName = `${f.title}${f.firstName} ${f.lastName}`.trim();
    const finalType = isSubsidiary ? `สมาชิกสมทบ (${f.subsidiaryType})` : f.memberType;
    onSave({
      code: window.nextMemberCode(members), // ระบบ gen เลขจริงเมื่อบันทึก
      name: fullName,
      ...f,
      memberType: finalType,
      workDepartment: f.deptName ? `${f.deptName} · ${f.deptUnit}` : '',
      salary: Number(f.salary) || 0,
      spouseDisplay: married ? f.spouse.name : null,
    });
  };

  return (
    <div data-screen-label="หน้าเพิ่มสมาชิกใหม่">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}>
          <Icon name="chevLeft" /> กลับ
        </button>
        <div style={{ marginLeft: 4 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>เพิ่มสมาชิกใหม่</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กรอกใบสมัครเพื่อบันทึกข้อมูลสมาชิกเข้าทะเบียนสหกรณ์
          </div>
        </div>
        <span className="spacer" />
        <span className="chip primary"><Icon name="info" size={11} /> เลขสมาชิก: ระบบสร้างอัตโนมัติ</span>
      </div>

      <div className="search-card mf-compact" style={{ padding: 16 }}>

        {/* ── 1. สร้างข้อมูลสมาชิก ── */}
        <div className="section">
          <div className="section-head"><span className="head-bar" /><h3>สร้างข้อมูลสมาชิก</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="เลขที่ใบสมัคร" required error={errors.applicationNo}>
              <MFInput value={f.applicationNo} onChange={(v) => set('applicationNo', v)} mono
                       error={errors.applicationNo} placeholder="เช่น APP-2569-0148" />
            </MFField>
            <MFField label="วันที่บันทึก" hint="ค่าเริ่มต้น: วันปัจจุบัน">
              <MFInput type="date" value={f.recordDate} onChange={(v) => set('recordDate', v)} />
            </MFField>
            <MFField label="เลขสมาชิก">
              <MFReadonly value="AUTO" tag="Auto" mono highlight />
            </MFField>
            <MFField label="ครั้งที่สมัคร">
              <MFSelect value={f.applyCount} onChange={(v) => set('applyCount', v)} options={window.APPLY_COUNT_OPTIONS} />
            </MFField>
            <MFField label="วันที่เป็นสมาชิก">
              <MFInput type="date" value={f.joinDate} onChange={(v) => set('joinDate', v)} />
            </MFField>
            <MFField label="ผู้ทำรายการ" hint="ผู้ใช้งานที่ล็อกอินอยู่ขณะนี้">
              <div className="mf-readonly" style={{ minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span className="row-avatar">{user.initials}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
                </span>
                <span className="mf-auto-tag">{user.role}</span>
              </div>
            </MFField>
          </div>
        </div>

        {/* ── 2. ข้อมูลเบื้องต้นของผู้สมัคร ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลเบื้องต้นของผู้สมัคร</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="สังกัดหัวหน้า" span={3} hint={f.deptHead ? `หัวหน้าสังกัด: ${f.deptHead}` : 'คลิกเพื่อค้นหาจากเลขสังกัด / ชื่อสังกัด / ชื่อหน่วยงาน'}>
              <div className="mf-input mf-trigger" onClick={() => setDeptModal(true)} role="button" tabIndex={0}>
                {f.deptCode
                  ? <span className="mf-trigger-val"><span className="mono">{f.deptCode}</span> · {f.deptName} · {f.deptUnit}</span>
                  : <span className="muted">— เลือกสังกัด —</span>}
                <span className="mf-trigger-act"><Icon name="search" size={13} /> ค้นหา</span>
              </div>
            </MFField>

            <MFField label="เลขบัตรประชาชน" required error={errors.citizenId} span={3}>
              <div style={{ maxWidth: 320 }}>
                <MFInput value={f.citizenId} onChange={onCitizenId} mono error={errors.citizenId}
                         inputMode="numeric" maxLength={20} placeholder="x-xxxx-xxxxx-xx-x" />
              </div>
              {f.isFormer && (
                <span className="chip warning" style={{ marginTop: 8 }}>
                  <Icon name="history" size={11} /> พบประวัติสมาชิกเดิม — ดึงข้อมูลส่วนสมาชิกเก่าให้แล้ว
                </span>
              )}
            </MFField>

            <MFField label="คำนำหน้า" required>
              <MFSelect value={f.title} onChange={(v) => set('title', v)} options={window.TITLE_OPTIONS} />
            </MFField>
            <MFField label="ชื่อ" required error={errors.firstName}>
              <MFInput value={f.firstName} onChange={(v) => set('firstName', v)} error={errors.firstName} placeholder="ระบุชื่อ (First Name)" />
            </MFField>
            <MFField label="นามสกุล" required error={errors.lastName}>
              <MFInput value={f.lastName} onChange={(v) => set('lastName', v)} error={errors.lastName} placeholder="ระบุนามสกุล (Surname)" />
            </MFField>
          </div>
        </div>

        {/* ── 3. ข้อมูลที่อยู่ ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลที่อยู่</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="บ้านเลขที่ / หมู่">
              <div className="mf-inline-pair">
                <MFInput value={f.addrNo} onChange={(v) => set('addrNo', v)} placeholder="เลขที่" />
                <span className="mf-inline-sep">หมู่</span>
                <MFInput value={f.addrMoo} onChange={(v) => set('addrMoo', v)} inputMode="numeric" placeholder="—" />
              </div>
            </MFField>
            <MFField label="หมู่บ้าน / อาคาร">
              <MFInput value={f.village} onChange={(v) => set('village', v)} placeholder="ระบุหมู่บ้าน" />
            </MFField>
            <MFField label="ซอย">
              <MFInput value={f.soi} onChange={(v) => set('soi', v)} placeholder="ระบุซอย" />
            </MFField>
            <MFField label="ถนน">
              <MFInput value={f.road} onChange={(v) => set('road', v)} placeholder="ระบุถนน" />
            </MFField>
            <MFField label="จังหวัด">
              <MFSelect value={f.province} onChange={setProvince} options={window.PROVINCES} placeholder="— เลือกจังหวัด —" />
            </MFField>
            <MFField label="อำเภอ / เขต">
              <MFSelect value={f.amphoe} onChange={setAmphoe} options={amphoeOptions}
                        placeholder={f.province ? '— เลือกอำเภอ/เขต —' : 'เลือกจังหวัดก่อน'} disabled={!f.province} />
            </MFField>
            <MFField label="ตำบล / แขวง">
              <MFSelect value={f.tambon} onChange={(v) => set('tambon', v)} options={tambonOptions}
                        placeholder={f.amphoe ? '— เลือกตำบล/แขวง —' : 'เลือกอำเภอก่อน'} disabled={!f.amphoe} />
            </MFField>
            <MFField label="รหัสไปรษณีย์">
              <MFInput value={f.zipcode} onChange={(v) => set('zipcode', v.replace(/\D/g, '').slice(0, 5))}
                       mono inputMode="numeric" maxLength={5} placeholder="xxxxx" />
            </MFField>
          </div>
        </div>

        {/* ── 4. ข้อมูลการติดต่อ ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการติดต่อ</h3></div>
          <div className="mf-grid cols-2">
            <MFField label="โทรศัพท์ที่บ้าน">
              <MFInput value={f.phoneHome} onChange={(v) => set('phoneHome', v)} mono inputMode="tel" placeholder="0x-xxx-xxxx" />
            </MFField>
            <MFField label="โทรศัพท์ที่ทำงาน">
              <MFInput value={f.phoneWork} onChange={(v) => set('phoneWork', v)} mono inputMode="tel" placeholder="0x-xxx-xxxx ต่อ ..." />
            </MFField>
            <MFField label="โทรศัพท์มือถือ">
              <MFInput value={f.mobile} onChange={(v) => set('mobile', v)} mono inputMode="tel" placeholder="08x-xxx-xxxx" />
            </MFField>
            <MFField label="อีเมล (e-mail)">
              <MFInput type="email" value={f.email} onChange={(v) => set('email', v)} placeholder="name@example.com" />
            </MFField>
          </div>
        </div>

        {/* ── 5. ข้อมูลส่วนตัว ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลส่วนตัว</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="สถานภาพสมรส">
              <MFSelect value={f.maritalStatus} onChange={(v) => set('maritalStatus', v)} options={window.MARITAL_OPTIONS} />
            </MFField>
            <MFField label="เพศ">
              <MFSelect value={f.gender} onChange={(v) => set('gender', v)} options={window.GENDER_OPTIONS} />
            </MFField>
            <MFField label="สัญชาติ">
              <MFInput value={f.nationality} onChange={(v) => set('nationality', v)} placeholder="เช่น ไทย" />
            </MFField>
            <MFField label="วันเดือนปีเกิด" required error={errors.birthDate}>
              <MFInput type="date" value={f.birthDate} onChange={(v) => set('birthDate', v)} error={errors.birthDate} />
            </MFField>
            <MFField label="อายุ">
              <MFReadonly value={f.birthDate ? fmt.ageYM(f.birthDate) : '—'} tag="คำนวณ" />
            </MFField>
            <MFField label="วันที่เกษียณอายุ">
              <MFInput type="date" value={f.retireDate} onChange={(v) => set('retireDate', v)} />
            </MFField>

            {married && (
              <MFField label="คู่สมรส" required error={errors.spouseName} span={3}>
                <div className="mf-inline-pair" style={{ alignItems: 'stretch' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <MFInput value={f.spouse.name} onChange={(v) => setSpouse('name', v)}
                             readOnly={f.spouse.isMember} placeholder="ระบุชื่อ-นามสกุลคู่สมรส" />
                  </div>
                  <div className={"mf-radio" + (f.spouse.isMember ? " on" : "")} style={{ flex: 'none', height: 34 }}
                       onClick={() => f.spouse.isMember ? clearSpouseMember() : setSpouse('isMember', true)}>
                    <span className="dot" /> คู่สมรสเป็นสมาชิก
                  </div>
                </div>
                {f.spouse.isMember && (
                  <div style={{ marginTop: 8 }}>
                    <MemberLookup members={members} onPick={pickSpouseMember} selectedCode={f.spouse.memberCode} />
                    {f.spouse.memberCode && (
                      <span className="chip success" style={{ marginTop: 8 }}>
                        <Icon name="check" size={11} /> ดึงข้อมูลคู่สมรสจาก {f.spouse.memberCode} แล้ว
                      </span>
                    )}
                  </div>
                )}
              </MFField>
            )}
          </div>
        </div>

        {/* ── 6. ข้อมูลการทำงานและสถานะการเงิน ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการทำงานและสถานะการเงิน</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="ประเภทสมาชิก">
              <MFSelect value={f.memberType} onChange={(v) => set('memberType', v)} options={window.MEMBER_TYPE_FORM_OPTIONS} />
            </MFField>
            {isSubsidiary ? (
              <MFField label="ประเภทการสมทบ" span={2}>
                <MFRadioGroup value={f.subsidiaryType} onChange={(v) => set('subsidiaryType', v)} options={window.SUBSIDIARY_TYPE_OPTIONS} />
              </MFField>
            ) : (
              <MFField label="รหัสพนักงาน" required error={errors.employeeId}>
                <MFInput value={f.employeeId} onChange={(v) => set('employeeId', v)} mono error={errors.employeeId} placeholder="เช่น EMP-042189" />
              </MFField>
            )}
            {isSubsidiary && (
              <MFField label="รหัสพนักงาน" required error={errors.employeeId}>
                <MFInput value={f.employeeId} onChange={(v) => set('employeeId', v)} mono error={errors.employeeId} placeholder="เช่น EMP-042189" />
              </MFField>
            )}
            <MFField label="เงินเดือน" hint="บาท/เดือน · ทศนิยม 2 ตำแหน่ง">
              <MFInput value={f.salary} onChange={onMoney('salary')} onBlur={() => f.salary && set('salary', Number(f.salary).toFixed(2))}
                       mono inputMode="decimal" placeholder="0.00" />
            </MFField>
            <MFField label="เงินฝากแรกเข้า" hint="ค่าเริ่มต้น 500.00 บาท">
              <MFInput value={f.entryDeposit} onChange={onMoney('entryDeposit')}
                       onBlur={() => f.entryDeposit && set('entryDeposit', Number(f.entryDeposit).toFixed(2))}
                       mono inputMode="decimal" placeholder="500.00" />
            </MFField>
          </div>
        </div>

        {/* ── 7. ข้อมูลสำหรับสมาชิกเก่า ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head">
            <span className="head-bar" /><h3>ข้อมูลสำหรับสมาชิกเก่า</h3>
            <div className="head-actions">
              {f.isFormer
                ? <span className="chip warning"><Icon name="history" size={11} /> ตรวจพบประวัติเดิม</span>
                : <span className="chip"><Icon name="info" size={11} /> ระบบตรวจสอบจากเลขบัตรประชาชน</span>}
            </div>
          </div>
          <div className="mf-grid cols-3">
            <MFField label="วันที่ลาออก">
              <MFInput type="date" value={f.resignDate} onChange={(v) => set('resignDate', v)} />
            </MFField>
            <MFField label="ทะเบียนครั้งก่อน">
              <MFInput value={f.prevCode} onChange={(v) => set('prevCode', v)} mono placeholder="เช่น M-049217" />
            </MFField>
            <MFField label="สาเหตุลาออก" hint={f.resignReasonText || 'รหัสสาเหตุการลาออก'}>
              <MFInput value={f.resignReason} onChange={(v) => set('resignReason', v)}
                       mono danger placeholder="เช่น 08" />
            </MFField>
          </div>
        </div>

        {/* ── 8. การส่งหุ้นและอื่นๆ ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>การส่งหุ้นและอื่น ๆ</h3></div>
          <div className="config-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px' }}>
            <div>
              <div className="mf-grid cols-2">
                <MFField label="มูลค่าหุ้น / เดือน" hint="หักเงินซื้อหุ้นรายเดือน (บาท)">
                  <MFInput value={f.shareValue} onChange={onMoney('shareValue')}
                           onBlur={() => f.shareValue && set('shareValue', Number(f.shareValue).toFixed(2))}
                           mono inputMode="decimal" placeholder="0.00" />
                </MFField>
                <MFField label="หุ้นตามฐานเงินเดือน">
                  <MFInput value={f.shareBaseSalary} onChange={(v) => set('shareBaseSalary', v)} mono placeholder="ระบุตัวเลข/ข้อความ" />
                </MFField>
                <MFField label="หมายเหตุ" full>
                  <textarea className="mf-input" rows={3} value={f.note}
                            onChange={(e) => set('note', e.target.value)}
                            placeholder="บันทึกข้อมูลเพิ่มเติม เช่น เงื่อนไขพิเศษ หรือมติที่ประชุม" />
                </MFField>
              </div>
            </div>

            {/* แนบลายเซ็น */}
            <div>
              <div className="mf-label" style={{ marginBottom: 5 }}>ลายเซ็นสมาชิก</div>
              <div className="mf-sig" onClick={() => sigRef.current?.click()} style={{ cursor: 'pointer' }}>
                {f.signatureUrl
                  ? <img src={f.signatureUrl} alt="ลายเซ็น" />
                  : <div className="mf-upload-ph"><Icon name="edit" size={20} /><span>คลิกเพื่อแนบลายเซ็น</span></div>}
              </div>
              <input type="file" ref={sigRef} accept="image/*" style={{ display: 'none' }}
                     onChange={(e) => readImageFile(e.target.files?.[0], (u) => set('signatureUrl', u))} />
              {f.signatureUrl && (
                <button className="btn ghost sm" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                        onClick={() => set('signatureUrl', null)}><Icon name="close" size={12} /> ลบลายเซ็น</button>
              )}
              <div className="cfg-hint" style={{ marginTop: 6 }}>รองรับการแนบไฟล์ภาพลายเซ็น (PNG / JPG)</div>
            </div>
          </div>
        </div>

        {/* sticky footer */}
        <div className="mf-footer">
          <span className="muted" style={{ fontSize: 12 }}>
            <span className="cfg-required">*</span> ช่องที่จำเป็นต้องกรอก · เลขสมาชิกจะถูกสร้างอัตโนมัติเมื่อบันทึก · ระบบบันทึก Audit Log ให้อัตโนมัติ
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onCancel}>ยกเลิก</button>
          <button className="btn primary" onClick={handleSave}>
            <Icon name="check" /> บันทึกสมาชิกใหม่
          </button>
        </div>
      </div>

      {deptModal && <DepartmentSearchModal onPick={pickDept} onClose={() => setDeptModal(false)} />}
    </div>
  );
}

Object.assign(window, { MemberFormPage });
