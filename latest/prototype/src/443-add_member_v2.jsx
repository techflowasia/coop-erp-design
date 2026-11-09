// ─── ปรับหน้าเพิ่มสมาชิกใหม่ (v2) ────────────────────────────────────────
//  · ตัดฟิลด์ "ครั้งที่สมัคร" ออกจากหน้า (ยังเก็บค่า applyCount เบื้องหลัง)
//  · ทุกช่องวันที่ใช้ปฏิทินไทย พ.ศ. (ThaiDateInput) แทน input type=date
//  · สาเหตุลาออก = dropdown (ลาออก / ไล่ออก / ให้ออก / ปลดออก)
//  · ติด * แดงตามกลุ่มฟิลด์จำเป็น + ตรวจทันทีเมื่อออกจากช่อง (blur)
//  · placeholder ชื่อ/นามสกุล/โทรศัพท์ ตามที่กำหนด + เพิ่ม "โทรศัพท์ที่ทำงาน(ต่อ)"

// ── ใช้คอมโพเนนต์ร่วมจาก shared/erp-components.jsx ──
//    ThaiDateInput · SearchPickerField · isoToTh · thToIso · maskCitizenId · maskPhone
const ThaiDateInput = window.ThaiDateInput;
const maskCitizenId = window.maskCitizenId;
const maskPhone = window.maskPhone;
const isoToTh = window.isoToTh;
const thToIso = window.thToIso;

// ─── รหัสไปรษณีย์ตามตำบล / แขวง (ชุดตัวอย่าง) ───────────────────────────
window.ZIP_BY_TAMBON = window.ZIP_BY_TAMBON || {
  'จตุจักร':'10900','จอมพล':'10900','จันทรเกษม':'10900','ลาดยาว':'10900','เสนานิคม':'10900',
  'ดินแดง':'10400','รัชดาภิเษก':'10400','บางซื่อ':'10800','วงศ์สว่าง':'10800','สามเสนใน':'10400',
  'บางกระสอ':'11000','ตลาดขวัญ':'11000','สวนใหญ่':'11000','บางเขน':'11000',
  'บางม่วง':'11140','บางใหญ่':'11140','เสาธงหิน':'11140',
  'ปากเกร็ด':'11120','บางตลาด':'11120','คลองเกลือ':'11120',
  'บางปรอก':'12000','บ้านกลาง':'12000','บ้านฉาง':'12000',
  'คลองหนึ่ง':'12120','คลองสอง':'12120','คลองสาม':'12120',
  'ประชาธิปัตย์':'12130','รังสิต':'12130','บึงยี่โถ':'12130',
  'ปากน้ำ':'10270','สำโรงเหนือ':'10270','บางเมือง':'10270',
  'บางพลีใหญ่':'10540','บางแก้ว':'10540','ราชาเทวะ':'10540',
  'ตลาด':'10130','บางพึ่ง':'10130','บางครุ':'10130',
};



// ─── เกณฑ์เกษียณอายุตามสังกัด ────────────────────────────────────────
//  mode: 'fiscal'   = 30 ก.ย. ของปีงบประมาณที่อายุครบ (เกิด 1 ต.ค. ขึ้นไป → ปีถัดไป)
//        'birthday' = วันที่อายุครบ
//        'monthEnd' = สิ้นเดือนเกิดของปีที่อายุครบ
//  ถ้าค่าคงที่ต้นสังกัด (affilByCode) มี retireAge / retireMode จะใช้ค่านั้นก่อน
window.AFFIL_RETIRE_RULES = window.AFFIL_RETIRE_RULES || {
  '0501': { age: 60, mode: 'fiscal' },
  '0601': { age: 60, mode: 'fiscal' },
  '0901': { age: 55, mode: 'monthEnd' },
};
window.AFFIL_RETIRE_DEFAULT = window.AFFIL_RETIRE_DEFAULT || { age: 60, mode: 'fiscal' };
const RETIRE_MODE_TXT = { fiscal: '30 ก.ย. ปีงบประมาณที่ครบ', birthday: 'วันที่อายุครบ', monthEnd: 'สิ้นเดือนเกิด' };
window.retireRuleFor = function (deptCode) {
  const rec = window.affilByCode ? window.affilByCode(deptCode) : null;
  const r = (rec && rec.retireAge) ? { age: +rec.retireAge, mode: rec.retireMode || 'fiscal' }
          : (window.AFFIL_RETIRE_RULES[String(deptCode || '')] || window.AFFIL_RETIRE_DEFAULT);
  return { age: r.age || 60, mode: r.mode || 'fiscal' };
};
window.calcRetireDate = function (birthIso, deptCode) {
  if (!birthIso || !/^\d{4}-\d{2}-\d{2}$/.test(birthIso)) return '';
  const [y, m, d] = birthIso.split('-').map(Number);
  const { age, mode } = window.retireRuleFor(deptCode);
  const pad = (n) => String(n).padStart(2, '0');
  const ry = y + age;
  if (mode === 'birthday') return `${ry}-${pad(m)}-${pad(d)}`;
  if (mode === 'monthEnd') return `${ry}-${pad(m)}-${pad(new Date(ry, m, 0).getDate())}`;
  // fiscal: เกิด 2 ต.ค. เป็นต้นไปเกษียณปีถัดไป (1 ต.ค. นับอายุครบ 30 ก.ย.)
  const fy = (m > 10 || (m === 10 && d >= 2)) ? ry + 1 : ry;
  return `${fy}-09-30`;
};

// ─── ช่องค้นหา: ใช้ SearchPickerField จาก shared/erp-components.jsx ─────
const SearchPickerField = window.SearchPickerField;


// ─── ฟอร์มหลัก (แทนที่ของเดิม) ──────────────────────────────────────────
function MemberFormPage({ members, onSave, onCancel }) {
  const [f, setF] = useState(() => Object.assign(JSON.parse(JSON.stringify(window.EMPTY_FORM || {
    applicationNo: '', recordDate: new Date().toISOString().slice(0, 10),
    applyCount: 'ครั้งที่ 1', joinDate: new Date().toISOString().slice(0, 10),
    deptCode: '', deptName: '', deptUnit: '', deptHead: '', workDepartment: '',
    citizenId: '', title: '', firstName: '', lastName: '', nationality: 'ไทย',
    addrNo: '', addrMoo: '', village: '', soi: '', road: '', zipcode: '',
    province: '', amphoe: '', tambon: '',
    phoneHome: '', phoneWork: '', phoneWorkExt: '', mobile: '', email: '',
    maritalStatus: '', gender: '',
    spouse: { isMember: false, memberCode: null, name: '', title: '', firstName: '', lastName: '' },
    birthDate: '', retireDate: '',
    memberType: '', subsidiaryType: 'สมทบพนักงาน',
    employeeId: '', salary: '', entryDeposit: String((window.DEFAULT_ENTRY_DEPOSIT || 500).toFixed(2)),
    isFormer: false, resignDate: '', prevCode: '', prevApplyCount: 0, resignReason: '', resignReasonText: '',
    shareValue: '', shareBaseSalary: '', note: '',
    signatureUrl: null, photoUrl: null,
  })), { gender: '', memberType: '', maritalStatus: '', phoneWorkExt: '', resignReason: '', title: '' }));
  const [errors, setErrors] = useState({});
  const [deptModal, setDeptModal] = useState(false);
  const [spouseModal, setSpouseModal] = useState(false);
  const [spouseErr, setSpouseErr] = useState(null);
  const sigRef = useRef(null);
  const [retireManual, setRetireManual] = useState(false);
  const retireAuto = window.calcRetireDate(f.birthDate, f.deptCode);
  const retireRule = window.retireRuleFor(f.deptCode);
  React.useEffect(() => {
    if (!retireManual && retireAuto !== f.retireDate) setF(s => ({ ...s, retireDate: retireAuto }));
  }, [retireAuto, retireManual]);

  const user = window.CURRENT_USER;
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const setSpouse = (k, v) => setF(s => ({ ...s, spouse: { ...s.spouse, [k]: v } }));

  const married = f.maritalStatus === 'สมรส';
  const isSubsidiary = f.memberType === 'สมาชิกสมทบ';

  const amphoeOptions = useMemo(() => window.AMPHOES[f.province] || [], [f.province]);
  const tambonOptions = useMemo(() => window.TAMBONS[f.amphoe] || [], [f.amphoe]);
  const setProvince = (v) => setF(s => ({ ...s, province: v, amphoe: '', tambon: '' }));
  const setAmphoe   = (v) => setF(s => ({ ...s, amphoe: v, tambon: '' }));
  // เลือกตำบล → เติมรหัสไปรษณีย์ทับให้ทุกครั้ง (ยังพิมพ์แก้เองได้)
  const setTambon = (v) => setF(s => ({ ...s, tambon: v, zipcode: (window.ZIP_BY_TAMBON || {})[v] || s.zipcode }));

  const pickDept = (d) => {
    setF(s => ({ ...s, deptCode: d.code, deptName: d.name, deptUnit: d.unit, deptHead: d.head, workDepartment: d.unit || '' }));
    setErrors(e => { const n = { ...e }; delete n.deptCode; return n; });
    setDeptModal(false);
  };

  const splitThaiName = (full) => {
    const raw = String(full || '').trim();
    const t = (window.TITLE_OPTIONS || []).find(x => raw.startsWith(x)) || '';
    const rest = raw.slice(t.length).trim().split(/\s+/);
    return { title: t, firstName: rest[0] || '', lastName: rest.slice(1).join(' ') };
  };
  const pickSpouseMember = (m) => {
    const n = splitThaiName(m.name);
    setF(s => ({ ...s, spouse: { isMember: true, memberCode: m.code, name: m.name, ...n } }));
    setErrors(e => { const x = { ...e }; delete x.spTitle; delete x.spFirstName; delete x.spLastName; return x; });
  };
  const clearSpouseMember = () =>
    setF(s => ({ ...s, spouse: { isMember: false, memberCode: null, name: '', title: '', firstName: '', lastName: '' } }));

  const onCitizenId = (raw) => {
    const v = maskCitizenId(raw);
    const former = window.lookupFormerMember(v);
    setF(s => ({
      ...s, citizenId: v,
      prevApplyCount: former ? (former.applyCount || 1) : 0,
      ...(former
        ? { isFormer: true, resignDate: former.resignDate, prevCode: former.prevCode,
            resignReason: window.RESIGN_REASON_OPTIONS && window.RESIGN_REASON_OPTIONS.includes(former.reasonText) ? former.reasonText : (s.resignReason || ''),
            resignReasonText: former.reasonText }
        : { isFormer: false }),
    }));
  };

  const onMoney = (k) => (v) => set(k, v.replace(/[^\d.]/g, ''));

  // ── กฎฟิลด์จำเป็น (ตรวจทันทีเมื่อออกจากช่อง) ──
  const RULES = {
    applicationNo: (v) => !String(v || '').trim() && 'กรุณาระบุเลขที่ใบสมัคร',
    deptCode:      (v) => !String(v || '').trim() && 'กรุณาเลือกสังกัด / หน่วยงาน',
    citizenId:     (v) => !/^[\d-]{13,17}$/.test(String(v || '').replace(/\s/g, '')) && 'เลขบัตรประชาชนต้องมี 13 หลัก',
    title:         (v) => !String(v || '').trim() && 'กรุณาเลือกคำนำหน้า',
    firstName:     (v) => !String(v || '').trim() && 'กรุณาระบุชื่อ',
    lastName:      (v) => !String(v || '').trim() && 'กรุณาระบุนามสกุล',
    addrNo:        (v) => !String(v || '').trim() && 'กรุณาระบุบ้านเลขที่',
    province:      (v) => !String(v || '').trim() && 'กรุณาเลือกจังหวัด',
    amphoe:        (v) => !String(v || '').trim() && 'กรุณาเลือกอำเภอ / เขต',
    tambon:        (v) => !String(v || '').trim() && 'กรุณาเลือกตำบล / แขวง',
    zipcode:       (v) => !/^\d{5}$/.test(String(v || '')) && 'รหัสไปรษณีย์ต้องมี 5 หลัก',
    mobile:        (v) => !String(v || '').trim() && 'กรุณาระบุโทรศัพท์มือถือ',
    maritalStatus: (v) => !String(v || '').trim() && 'กรุณาเลือกสถานภาพสมรส',
    gender:        (v) => !String(v || '').trim() && 'กรุณาเลือกเพศ',
    memberType:    (v) => !String(v || '').trim() && 'กรุณาเลือกประเภทสมาชิก',
    nationality:   (v) => !String(v || '').trim() && 'กรุณาระบุสัญชาติ',
    birthDate:     (v) => !v && 'กรุณาเลือกวันเดือนปีเกิด',
    joinDate:      (v) => !v && 'กรุณาเลือกวันที่เป็นสมาชิก',
    employeeId:    (v) => !String(v || '').trim() && 'กรุณาระบุเลขพนักงาน',
    salary:        (v) => !String(v || '').trim() && 'กรุณาระบุเงินเดือน',
    shareValue:    (v) => !String(v || '').trim() && 'กรุณาระบุมูลค่าหุ้นรายเดือน',
  };

  const checkField = (k, val) => {
    const fn = RULES[k];
    if (!fn) return;
    const msg = fn(val !== undefined ? val : f[k]) || null;
    setErrors(e => { const n = { ...e }; if (msg) n[k] = msg; else delete n[k]; return n; });
  };
  const blur = (k) => () => checkField(k);

  const validate = () => {
    const e = {};
    Object.keys(RULES).forEach(k => {
      if (k === 'employeeId' && false) return;
      const msg = RULES[k](f[k]);
      if (msg) e[k] = msg;
    });
    if (married) {
      if (!String(f.spouse.title || '').trim()) e.spTitle = 'กรุณาเลือกคำนำหน้าคู่สมรส';
      if (!String(f.spouse.firstName || '').trim()) e.spFirstName = 'กรุณาระบุชื่อคู่สมรส';
      if (!String(f.spouse.lastName || '').trim()) e.spLastName = 'กรุณาระบุนามสกุลคู่สมรส';
    }
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
      code: window.nextMemberCode(members),
      name: fullName,
      ...f,
      memberType: finalType,
      departmentCode: f.deptCode,
      department: f.deptName,
      workDepartment: f.workDepartment,
      salary: Number(f.salary) || 0,
      spouseDisplay: married ? f.spouse.name : null,
    });
  };

  return (
    <div data-screen-label="หน้าเพิ่มสมาชิกใหม่">
      <div className="page-actions">
        <button className="btn icon" onClick={onCancel} title="กลับ" aria-label="กลับ">
          <Icon name="chevLeft" />
        </button>
        <div style={{ marginLeft: 4 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>เพิ่มสมาชิกใหม่</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กรอกใบสมัครเพื่อบันทึกข้อมูลสมาชิกเข้าทะเบียนสหกรณ์
          </div>
        </div>
        <span className="spacer" />
        <span className="chip primary"><Icon name="info" size={11} /> เลขสมาชิก: ระบบสร้างอัตโนมัติ</span>
        <button className="btn" onClick={onCancel}>ยกเลิก</button>
        <button className="btn primary" onClick={handleSave}>
          <Icon name="check" /> บันทึกสมาชิกใหม่
        </button>
      </div>

      <div className="search-card mf-compact" style={{ padding: 16 }}>

        {/* ── 1. ข้อมูลการสมัคร ── */}
        <div className="section">
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการสมัคร</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="เลขที่ใบสมัคร" required error={errors.applicationNo}>
              <MFInput value={f.applicationNo} onChange={(v) => set('applicationNo', v)} mono
                       onBlur={blur('applicationNo')}
                       error={errors.applicationNo} placeholder="เช่น APP-2569-0148" />
            </MFField>
            <MFField label="วันที่บันทึก" hint="ค่าเริ่มต้น: วันปัจจุบัน">
              <ThaiDateInput value={f.recordDate} onChange={(v) => set('recordDate', v)} />
            </MFField>
            <MFField label="เลขสมาชิก">
              <MFReadonly value="AUTO" tag="Auto" mono highlight />
            </MFField>
            <MFField label="วันที่เป็นสมาชิก" required error={errors.joinDate}>
              <ThaiDateInput value={f.joinDate} onChange={(v) => set('joinDate', v)}
                             error={errors.joinDate} onBlur={blur('joinDate')} />
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

        {/* ── 2. ข้อมูลส่วนตัว ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลส่วนตัว</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="เลขบัตรประชาชน" required error={errors.citizenId}>
              <MFInput value={f.citizenId} onChange={onCitizenId} mono error={errors.citizenId}
                       onBlur={blur('citizenId')}
                       inputMode="numeric" maxLength={17} placeholder="1-2345-67890-12-3" />
              {f.isFormer && (
                <span className="chip warning" style={{ marginTop: 8 }}>
                  <Icon name="history" size={11} /> พบประวัติสมาชิกเดิม — ดึงข้อมูลส่วนสมาชิกเก่าให้แล้ว
                </span>
              )}
            </MFField>
          </div>
          <div className="mf-grid cols-3" style={{ marginTop: 12 }}>
            <MFField label="คำนำหน้า" required error={errors.title}>
              <MFSelect value={f.title} onChange={(v) => { set('title', v); checkField('title', v); }} options={window.TITLE_OPTIONS} placeholder="ระบุคำนำหน้า" />
            </MFField>
            <MFField label="ชื่อ" required error={errors.firstName}>
              <MFInput value={f.firstName} onChange={(v) => set('firstName', v)} error={errors.firstName}
                       onBlur={blur('firstName')} placeholder="ระบุชื่อ" />
            </MFField>
            <MFField label="นามสกุล" required error={errors.lastName}>
              <MFInput value={f.lastName} onChange={(v) => set('lastName', v)} error={errors.lastName}
                       onBlur={blur('lastName')} placeholder="ระบุนามสกุล" />
            </MFField>
            <MFField label="เพศ" required error={errors.gender}>
              <MFSelect value={f.gender} onChange={(v) => { set('gender', v); checkField('gender', v); }}
                        options={['ชาย', 'หญิง']} placeholder="ระบุเพศ" />
            </MFField>
            <MFField label="สัญชาติ" required error={errors.nationality}>
              <MFInput value={f.nationality} onChange={(v) => set('nationality', v)} error={errors.nationality}
                       onBlur={blur('nationality')} placeholder="เช่น ไทย" />
            </MFField>
            <MFField label="วันเดือนปีเกิด" required error={errors.birthDate}>
              <ThaiDateInput value={f.birthDate} onChange={(v) => set('birthDate', v)}
                             error={errors.birthDate} onBlur={blur('birthDate')} />
            </MFField>
            <MFField label="อายุ">
              <MFReadonly value={f.birthDate ? fmt.ageYM(f.birthDate) : '—'} tag="คำนวณ" />
            </MFField>
            <MFField label="สถานภาพสมรส" required error={errors.maritalStatus}>
              <MFSelect value={f.maritalStatus} onChange={(v) => { set('maritalStatus', v); checkField('maritalStatus', v); }} options={window.MARITAL_OPTIONS} placeholder="ระบุสถานภาพสมรส" />
            </MFField>
          </div>
        </div>

        {married && (
          <div className="section" style={{ marginTop: 16 }}>
            <div className="section-head"><span className="head-bar" /><h3>ข้อมูลคู่สมรส</h3></div>
              <MFField label="">
                <div className="mf-grid cols-3" style={{ rowGap: 0, alignItems: 'start' }}>
                  <div className={"mf-radio" + (f.spouse.isMember ? " on" : "")}
                       style={{ display: 'inline-flex', height: 34, alignSelf: 'center' }}
                       onClick={() => { setSpouseErr(null); f.spouse.isMember ? clearSpouseMember() : setSpouse('isMember', true); }}>
                    <span className="dot" /> คู่สมรสเป็นสมาชิก
                  </div>
                  {f.spouse.isMember && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 'none', width: '100%', maxWidth: '100%' }}>
                        <SearchPickerField value={f.spouse.memberCode} items={members}
                                           onPick={(m) => { setSpouseErr(null); pickSpouseMember(m); }}
                                           onOpenModal={() => setSpouseModal(true)}
                                           notFoundText="ไม่พบเลขทะเบียนนี้ในระบบ"
                                           placeholder="เลขทะเบียนสมาชิก…" />
                      </div>
                      {f.spouse.memberCode && (
                        <span className="chip success" style={{ flex: 'none', whiteSpace: 'nowrap' }}>
                          <Icon name="check" size={11} /> ดึงข้อมูลคู่สมรสจาก {f.spouse.memberCode} แล้ว
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mf-grid cols-3" style={{ rowGap: 0, marginTop: 8 }}>
                  <MFField label="คำนำหน้า" required error={errors.spTitle}>
                    <MFSelect value={f.spouse.title || ''} onChange={(v) => { setSpouse('title', v); if (v) setErrors(e => { const n = { ...e }; delete n.spTitle; return n; }); }}
                              options={window.TITLE_OPTIONS} placeholder="ระบุคำนำหน้า"
                              disabled={f.spouse.isMember} />
                  </MFField>
                  <MFField label="ชื่อคู่สมรส" required error={errors.spFirstName}>
                    <MFInput value={f.spouse.firstName || ''} onChange={(v) => { setSpouse('firstName', v); if (String(v).trim()) setErrors(e => { const n = { ...e }; delete n.spFirstName; return n; }); }}
                             readOnly={f.spouse.isMember} placeholder="ระบุชื่อคู่สมรส" />
                  </MFField>
                  <MFField label="นามสกุลคู่สมรส" required error={errors.spLastName}>
                    <MFInput value={f.spouse.lastName || ''} onChange={(v) => { setSpouse('lastName', v); if (String(v).trim()) setErrors(e => { const n = { ...e }; delete n.spLastName; return n; }); }}
                             readOnly={f.spouse.isMember} placeholder="ระบุนามสกุลคู่สมรส" />
                  </MFField>
                </div>
              </MFField>
          </div>
        )}

        {/* ── 4. ข้อมูลการทำงาน ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการทำงาน</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="ประเภทสมาชิก" required error={errors.memberType}>
              <MFSelect value={f.memberType} onChange={(v) => { set('memberType', v); checkField('memberType', v); }}
                        options={['สมาชิกสามัญ', 'สมาชิกสมทบ']} placeholder="ระบุประเภทสมาชิก" />
            </MFField>
            {isSubsidiary ? (
              <MFField label="ประเภทการสมทบ" span={2}>
                <MFRadioGroup value={f.subsidiaryType} onChange={(v) => set('subsidiaryType', v)} options={window.SUBSIDIARY_TYPE_OPTIONS} />
              </MFField>
            ) : (
              <MFField label="รหัสพนักงาน" required error={errors.employeeId}>
                <MFInput value={f.employeeId} onChange={(v) => set('employeeId', v)} mono error={errors.employeeId}
                         onBlur={blur('employeeId')} placeholder="เช่น EMP-042189" />
              </MFField>
            )}
            {isSubsidiary && (
              <MFField label="รหัสพนักงาน" required error={errors.employeeId}>
                <MFInput value={f.employeeId} onChange={(v) => set('employeeId', v)} mono error={errors.employeeId}
                         onBlur={blur('employeeId')} placeholder="เช่น EMP-042189" />
              </MFField>
            )}
            <MFField label="สังกัดหัวหน้า" required error={errors.deptCode}
                     hint={f.deptCode ? '' : 'พิมพ์เลขสังกัด แล้วกด Enter หรือกดแว่นขยายเพื่อค้นหา'}>
              <SearchPickerField value={f.deptCode}
                                 items={window.DEPARTMENTS || window.DEPTS || []}
                                 labelOf={(d) => `${d.code} · ${d.name}`}
                                 onPick={pickDept}
                                 onOpenModal={() => setDeptModal(true)}
                                 notFoundText="ไม่พบเลขสังกัดนี้ในระบบ"
                                 placeholder="เลขสังกัด…" />
            </MFField>
            <MFField label="หัวหน้าสังกัด">
              <MFInput value={f.deptHead || ''} readOnly placeholder="แสดงอัตโนมัติเมื่อเลือกสังกัด" />
            </MFField>
            <MFField label="ชื่อหน่วยงาน">
              <MFInput value={f.workDepartment} onChange={(v) => set('workDepartment', v)} placeholder="ระบุชื่อหน่วยงาน" />
            </MFField>
            <MFField label="เงินเดือน" required error={errors.salary} hint="บาท/เดือน · ทศนิยม 2 ตำแหน่ง">
              <MFInput value={f.salary} onChange={onMoney('salary')} error={errors.salary}
                       onBlur={() => { if (f.salary) set('salary', Number(f.salary).toFixed(2)); checkField('salary'); }}
                       mono inputMode="decimal" placeholder="0.00" />
            </MFField>
            <MFField label="วันที่เกษียณอายุ"
                     hint={!f.birthDate ? 'คำนวณอัตโนมัติเมื่อระบุวันเกิด'
                       : retireManual ? <span>แก้ไขเอง · ค่าคำนวณ {isoToTh(retireAuto)} <a href="#" onClick={(e) => { e.preventDefault(); setRetireManual(false); }}>ใช้ค่าคำนวณ</a></span>
                       : `คำนวณจาก${f.deptCode ? 'สังกัด ' + f.deptCode : 'เกณฑ์มาตรฐาน'} · อายุ ${retireRule.age} ปี · ${RETIRE_MODE_TXT[retireRule.mode]}`}>
              <ThaiDateInput value={f.retireDate} onChange={(v) => { setRetireManual(!!v && v !== retireAuto); set('retireDate', v); }} />
            </MFField>

          </div>
        </div>

        {/* ── 5. ข้อมูลที่อยู่ ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลที่อยู่</h3></div>
          <div className="mf-grid cols-3">
            <MFField label="บ้านเลขที่ / หมู่" required error={errors.addrNo}>
              <div className="mf-inline-pair">
                <MFInput value={f.addrNo} onChange={(v) => set('addrNo', v)} error={errors.addrNo}
                         onBlur={blur('addrNo')} placeholder="เลขที่" />
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
            <MFField label="จังหวัด" required error={errors.province}>
              <MFSelect value={f.province} onChange={(v) => { setProvince(v); checkField('province', v); }} options={window.PROVINCES} placeholder="— เลือกจังหวัด —" />
            </MFField>
            <MFField label="อำเภอ / เขต" required error={errors.amphoe}>
              <MFSelect value={f.amphoe} onChange={(v) => { setAmphoe(v); checkField('amphoe', v); }} options={amphoeOptions}
                        placeholder={f.province ? '— เลือกอำเภอ/เขต —' : 'เลือกจังหวัดก่อน'} disabled={!f.province} />
            </MFField>
            <MFField label="ตำบล / แขวง" required error={errors.tambon}>
              <MFSelect value={f.tambon} onChange={(v) => { setTambon(v); checkField('tambon', v); checkField('zipcode', (window.ZIP_BY_TAMBON || {})[v] || f.zipcode); }} options={tambonOptions}
                        placeholder={f.amphoe ? '— เลือกตำบล/แขวง —' : 'เลือกอำเภอก่อน'} disabled={!f.amphoe} />
            </MFField>
            <MFField label="รหัสไปรษณีย์" required error={errors.zipcode}>
              <MFSelect value={f.zipcode} onChange={(v) => { set('zipcode', v); checkField('zipcode', v); }}
                        options={(() => { const m = window.ZIP_BY_TAMBON || {}; const z = m[f.tambon]; const all = z ? [z] : Array.from(new Set(Object.values(m))).sort(); return f.zipcode && all.indexOf(f.zipcode) < 0 ? [f.zipcode, ...all] : all; })()}
                        placeholder={f.tambon ? '— เลือกรหัสไปรษณีย์ —' : 'เลือกตำบลก่อน'} disabled={!f.tambon} />
            </MFField>
          </div>
        </div>

        {/* ── 6. ข้อมูลการติดต่อ ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการติดต่อ</h3></div>
          <div className="mf-grid cols-2">
            <MFField label="โทรศัพท์ที่บ้าน">
              <MFInput value={f.phoneHome} onChange={(v) => set('phoneHome', maskPhone(v))} mono inputMode="tel" maxLength={12} placeholder="xx-xxx-xxxx" />
            </MFField>
            <MFField label="โทรศัพท์ที่ทำงาน">
              <div className="mf-inline-pair">
                <MFInput value={f.phoneWork} onChange={(v) => set('phoneWork', maskPhone(v))} mono inputMode="tel" maxLength={12} placeholder="xx-xxx-xxxx" />
                <span className="mf-inline-sep">ต่อ</span>
                <MFInput value={f.phoneWorkExt} onChange={(v) => set('phoneWorkExt', v)} mono inputMode="tel" placeholder="หมายเลขต่อ" />
              </div>
            </MFField>
            <MFField label="โทรศัพท์มือถือ" required error={errors.mobile}>
              <MFInput value={f.mobile} onChange={(v) => set('mobile', maskPhone(v))} error={errors.mobile}
                       onBlur={blur('mobile')} mono inputMode="tel" maxLength={12} placeholder="xxx-xxx-xxxx" />
            </MFField>
            <MFField label="อีเมล (e-mail)">
              <MFInput type="email" value={f.email} onChange={(v) => set('email', v)} placeholder="name@example.com" />
            </MFField>
          </div>
        </div>

        {/* ── 7. การส่งหุ้นและเงินฝาก ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>การส่งหุ้นและเงินฝาก</h3></div>
          <div className="config-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px' }}>
            <div>
              <div className="mf-grid cols-2">
                <MFField label="เงินฝากแรกเข้า" hint="ค่าเริ่มต้น 500.00 บาท">
                  <MFInput value={f.entryDeposit} onChange={onMoney('entryDeposit')}
                           onBlur={() => f.entryDeposit && set('entryDeposit', Number(f.entryDeposit).toFixed(2))}
                           mono inputMode="decimal" placeholder="500.00" />
                </MFField>
                <MFField label="มูลค่าหุ้น / เดือน" required error={errors.shareValue} hint="หักเงินซื้อหุ้นรายเดือน (บาท)">
                  <MFInput value={f.shareValue} onChange={onMoney('shareValue')} error={errors.shareValue}
                           onBlur={() => { if (f.shareValue) set('shareValue', Number(f.shareValue).toFixed(2)); checkField('shareValue'); }}
                           mono inputMode="decimal" placeholder="0.00" />
                </MFField>
                <MFField label="หุ้นตามฐานเงินเดือน">
                  <MFInput value={f.shareBaseSalary} onChange={(v) => set('shareBaseSalary', v)} mono placeholder="ระบุตัวเลข/ข้อความ" />
                </MFField>
              </div>
            </div>

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

        {/* ── 8. ข้อมูลการลาออก / สมาชิกเก่า ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head">
            <span className="head-bar" /><h3>ข้อมูลการลาออก / สมาชิกเก่า</h3>
            <div className="head-actions">
              {f.isFormer
                ? <span className="chip warning"><Icon name="history" size={11} /> ตรวจพบประวัติเดิม</span>
                : <span className="chip"><Icon name="info" size={11} /> ระบบตรวจสอบจากเลขบัตรประชาชน</span>}
            </div>
          </div>
          <div className="mf-grid cols-3">
            <MFField label="วันที่ลาออก">
              <ThaiDateInput value={f.resignDate} onChange={(v) => set('resignDate', v)} />
            </MFField>
            <div style={{ display: 'grid', gridTemplateColumns: '70fr 30fr', gap: 12 }}>
              <MFField label="เลขสมาชิกครั้งล่าสุด">
                <MFInput value={f.prevCode} onChange={(v) => set('prevCode', v)} mono placeholder="เช่น M-049217" />
              </MFField>
              <MFField label="จำนวนครั้งที่เคยสมัคร">
                <MFReadonly value={String(f.prevApplyCount || 0)} />
              </MFField>
            </div>
            <MFField label="สาเหตุลาออก">
              <MFSelect value={f.resignReason} onChange={(v) => set('resignReason', v)}
                        options={window.RESIGN_REASON_OPTIONS} placeholder="ระบุสาเหตุลาออก" />
            </MFField>
          </div>
        </div>

        {/* ── 9. หมายเหตุ ── */}
        <div className="section" style={{ marginTop: 16 }}>
          <div className="section-head"><span className="head-bar" /><h3>หมายเหตุ</h3></div>
          <div className="mf-grid cols-2">
                <MFField label="หมายเหตุ" full>
                  <textarea className="mf-input" rows={3} value={f.note}
                            onChange={(e) => set('note', e.target.value)}
                            placeholder="บันทึกข้อมูลเพิ่มเติม เช่น เงื่อนไขพิเศษ หรือมติที่ประชุม" />
                </MFField>
          </div>
        </div>

        <div className="muted" style={{ fontSize: 12, marginTop: 16 }}>
          <span className="cfg-required">*</span> ช่องที่จำเป็นต้องกรอก · วันที่ทุกช่องเป็น พ.ศ. · เลขสมาชิกจะถูกสร้างอัตโนมัติเมื่อบันทึก
        </div>
      </div>

      {deptModal && <DepartmentSearchModal onPick={pickDept} onClose={() => setDeptModal(false)} />}
      {spouseModal && window.MemberSearchModal && (
        React.createElement(window.MemberSearchModal, {
          source: members, title: 'ค้นหาสมาชิก',
          onClose: () => setSpouseModal(false),
          onPick: (m) => { setSpouseModal(false); setSpouseErr(null); pickSpouseMember(m); },
        })
      )}
    </div>
  );
}

window.RESIGN_REASON_OPTIONS = ['ลาออก', 'ให้ออก', 'ปลดออก', 'ไล่ออก', 'เสียชีวิต'];
Object.assign(window, { MemberFormPage });
