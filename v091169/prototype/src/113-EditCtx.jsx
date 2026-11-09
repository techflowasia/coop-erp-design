// Info-group tabs: Details, Status, Deductions, Signature
// Render inside the .tab-panel wrapper (which provides padding)

// ─── Edit mode utility ──────────────────────────────────────────────
const EditCtx = React.createContext({ editing: false, setEditing: () => {} });

function Field({ label, value, type = "text", options, onChange, mono = false, muted = false, span = 1 }) {
  const { editing } = React.useContext(EditCtx);
  const cls = "value" + (mono ? " mono" : "") + (muted && !editing ? " muted" : "");
  return (
    <div className="field" style={span > 1 ? { gridColumn: `span ${span}` } : null}>
      <span className="label">{label}</span>
      {editing && onChange ? (
        type === "select" ? (
          <select className="value" value={value} onChange={e => onChange(e.target.value)}>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="value" type={type} value={value || ''} onChange={e => onChange(e.target.value)} />
        )
      ) : (
        <span className={cls}>{value ?? '—'}</span>
      )}
    </div>
  );
}

// ─── TAB: รายละเอียดสมาชิก ──────────────────────────────────────────
const FIELD_LABELS = {
  title: 'คำนำหน้า', gender: 'เพศ', nationality: 'สัญชาติ', memberType: 'ประเภทสมาชิก',
  birthDate: 'วันเดือนปีเกิด', citizenId: 'เลขบัตรประชาชน', maritalStatus: 'สถานภาพสมรส',
  spouse: 'ชื่อคู่สมรส', address: 'รายละเอียดที่อยู่', employeeId: 'รหัสพนักงาน',
  workDepartment: 'แผนกสังกัด', salary: 'เงินเดือน', workStatus: 'สถานะการทำงาน',
  retireDate: 'วันที่เกษียณอายุ', joinDate: 'วันที่เป็นสมาชิก', expireDate: 'วันที่พ้นสภาพ',
  resignDate: 'วันที่ลาออก', resignReason: 'สาเหตุลาออก', note: 'หมายเหตุ',
  addrNo: 'บ้านเลขที่', addrMoo: 'หมู่', village: 'หมู่บ้าน / อาคาร', soi: 'ซอย', road: 'ถนน',
  province: 'จังหวัด', amphoe: 'อำเภอ / เขต', tambon: 'ตำบล / แขวง', zipcode: 'รหัสไปรษณีย์',
  phoneHome: 'โทรศัพท์ที่บ้าน', phoneWork: 'โทรศัพท์ที่ทำงาน', phoneWorkExt: 'เบอร์ต่อ', mobile: 'โทรศัพท์มือถือ', email: 'อีเมล',
  departmentCode: 'สังกัดหัวหน้า',
};

// ─── ส่วนข้อมูลบุตร (อยู่ในแท็บรายละเอียดสมาชิก) ────────────────────
function ChildrenSection({ editing, kids, setKids }) {
  const eduOpts = (window.SCH_OPTS && window.SCH_OPTS.eduLevel) || [];
  const titleOpts = window.CHILD_TITLE_OPTS || [];
  const setKid = (id, k, v) => setKids(list => list.map(c => c.id === id ? { ...c, [k]: v } : c));
  const addKid = () => setKids(list => [...list, {
    id: window.childUid(), title: 'ด.ช.', firstName: '', lastName: '',
    citizenId: '', birthDate: '', eduLevel: '1', schoolYear: '2569', studying: true,
  }]);
  const delKid = (id) => setKids(list => list.filter(c => c.id !== id));

  return (
    <div className="section">
      <div className="section-head">
        <span className="head-bar" />
        <h3>ข้อมูลบุตร <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {kids.length} คน</span></h3>
        {editing && (
          <span className="head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn primary sm" onClick={addKid}><Icon name="plus" /> เพิ่มบุตร</button>
          </span>
        )}
      </div>

      {kids.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 12px' }}>
          ยังไม่มีข้อมูลบุตร{editing ? ' — กดปุ่ม “เพิ่มบุตร” เพื่อบันทึก' : ''}
        </div>
      ) : !editing ? (
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            <th style={{ width: 34 }} className="center">#</th>
            <th>ชื่อ-สกุล</th>
            <th>เลขบัตรประชาชน</th>
            <th>วันเกิด / อายุ</th>
            <th>ระดับชั้น</th>
            <th className="center">ปีการศึกษา</th>
            <th className="center">กำลังศึกษา</th>
          </tr></thead>
          <tbody>
            {kids.map((c, i) => (
              <tr key={c.id}>
                <td className="center muted mono">{i + 1}</td>
                <td>{window.childFullName(c)}</td>
                <td className="mono">{c.citizenId || '—'}</td>
                <td>{c.birthDate ? `${fmt.date(c.birthDate)} (${fmt.ageYM(c.birthDate)})` : '—'}</td>
                <td>{window.schLabel('eduLevel', c.eduLevel)}</td>
                <td className="center mono">{c.schoolYear || '—'}</td>
                <td className="center">
                  {c.studying
                    ? <span className="pill ok">กำลังศึกษา</span>
                    : <span className="pill neutral">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      ) : (
        <div className="table-wrap"><table className="tbl ch-edit">
          <thead><tr>
            <th style={{ width: 86 }}>คำนำหน้า</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th style={{ width: 170 }}>เลขบัตรประชาชน</th>
            <th style={{ width: 150 }}>วันเกิด</th>
            <th style={{ width: 180 }}>ระดับชั้น</th>
            <th style={{ width: 110 }}>ปีการศึกษา</th>
            <th style={{ width: 78 }} className="center">กำลังศึกษา</th>
            <th style={{ width: 56 }} />
          </tr></thead>
          <tbody>
            {kids.map(c => (
              <tr key={c.id}>
                <td>
                  <select className="cfg-input" value={c.title} onChange={(e) => setKid(c.id, 'title', e.target.value)}>
                    {titleOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input" value={c.firstName} onChange={(e) => setKid(c.id, 'firstName', e.target.value)} placeholder="ชื่อจริง" /></td>
                <td><input className="cfg-input" value={c.lastName} onChange={(e) => setKid(c.id, 'lastName', e.target.value)} placeholder="นามสกุล" /></td>
                <td><input className="cfg-input mono" value={c.citizenId} maxLength={20} onChange={(e) => setKid(c.id, 'citizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" /></td>
                <td><ErpDate value={c.birthDate} onChange={(v) => ((e) => setKid(c.id, 'birthDate', e.target.value))({ target: { value: v } })} className="cfg-input" /></td>
                <td>
                  <select className="cfg-input" value={c.eduLevel} onChange={(e) => setKid(c.id, 'eduLevel', e.target.value)}>
                    {eduOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input mono" type="number" inputMode="numeric" value={c.schoolYear || ''} onChange={(e) => setKid(c.id, 'schoolYear', e.target.value)} placeholder="2569" /></td>
                <td className="center">
                  <input type="checkbox" className="ch-box" checked={!!c.studying} onChange={(e) => setKid(c.id, 'studying', e.target.checked)} />
                </td>
                <td className="center">
                  <button className="btn danger sm icon-only" onClick={() => delKid(c.id)} title="ลบบุตร"><Icon name="close" size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {editing && (
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> ข้อมูลบุตรนี้จะถูกนำไปใช้ในการสร้างคำขอทุนสวัสดิการทุนการศึกษา
        </p>
      )}
    </div>
  );
}

// ─── ส่วนผู้รับผลประโยชน์ (อยู่ในแท็บรายละเอียดสมาชิก) ─────────────────
function BeneficiariesSection({ editing, bens, setBens }) {
  const titleOpts = window.BENEFICIARY_TITLE_OPTS || [];
  const relOpts = window.BENEFICIARY_RELATION_OPTS || [];
  const setBen = (id, k, v) => setBens(list => list.map(b => b.id === id ? { ...b, [k]: v } : b));
  const addBen = () => setBens(list => [...list, {
    id: window.benUid(), title: 'นาย', firstName: '', lastName: '',
    relation: 'บุตร', citizenId: '', share: 0,
  }]);
  const delBen = (id) => setBens(list => list.filter(b => b.id !== id));
  const totalShare = bens.reduce((a, b) => a + (Number(b.share) || 0), 0);

  return (
    <div className="section">
      <div className="section-head">
        <span className="head-bar" />
        <h3>ผู้รับผลประโยชน์ <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {bens.length} ราย</span></h3>
        {editing && (
          <span className="head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn primary sm" onClick={addBen}><Icon name="plus" /> เพิ่มผู้รับผลประโยชน์</button>
          </span>
        )}
      </div>

      {bens.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 12px' }}>
          ยังไม่มีข้อมูลผู้รับผลประโยชน์{editing ? ' — กดปุ่ม “เพิ่มผู้รับผลประโยชน์” เพื่อบันทึก' : ''}
        </div>
      ) : !editing ? (
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            <th style={{ width: 34 }} className="center">#</th>
            <th>ชื่อ-สกุล</th>
            <th style={{ width: 140 }}>ความสัมพันธ์</th>
            <th>เลขบัตรประชาชน</th>
            <th className="num" style={{ width: 120 }}>สัดส่วน</th>
          </tr></thead>
          <tbody>
            {bens.map((b, i) => (
              <tr key={b.id}>
                <td className="center muted mono">{i + 1}</td>
                <td>{window.benFullName(b)}</td>
                <td><span className="chip info">{b.relation || '—'}</span></td>
                <td className="mono">{b.citizenId || '—'}</td>
                <td className="num">{b.share != null ? b.share + '%' : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr>
            <td colSpan="4" className="right">รวมสัดส่วนผลประโยชน์</td>
            <td className="num"><b style={{ color: totalShare === 100 ? 'var(--success)' : 'var(--warning)' }}>{totalShare}%</b></td>
          </tr></tfoot>
        </table></div>
      ) : (
        <div className="table-wrap"><table className="tbl ch-edit">
          <thead><tr>
            <th style={{ width: 92 }}>คำนำหน้า</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th style={{ width: 150 }}>ความสัมพันธ์</th>
            <th style={{ width: 170 }}>เลขบัตรประชาชน</th>
            <th style={{ width: 110 }}>สัดส่วน (%)</th>
            <th style={{ width: 56 }} />
          </tr></thead>
          <tbody>
            {bens.map(b => (
              <tr key={b.id}>
                <td>
                  <select className="cfg-input" value={b.title} onChange={(e) => setBen(b.id, 'title', e.target.value)}>
                    {titleOpts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input" value={b.firstName} onChange={(e) => setBen(b.id, 'firstName', e.target.value)} placeholder="ชื่อจริง" /></td>
                <td><input className="cfg-input" value={b.lastName} onChange={(e) => setBen(b.id, 'lastName', e.target.value)} placeholder="นามสกุล" /></td>
                <td>
                  <select className="cfg-input" value={b.relation} onChange={(e) => setBen(b.id, 'relation', e.target.value)}>
                    {relOpts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input mono" value={b.citizenId} maxLength={20} onChange={(e) => setBen(b.id, 'citizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" /></td>
                <td><input className="cfg-input num" type="number" min="0" max="100" value={b.share} onChange={(e) => setBen(b.id, 'share', Number(e.target.value) || 0)} /></td>
                <td className="center">
                  <button className="btn danger sm icon-only" onClick={() => delBen(b.id)} title="ลบผู้รับผลประโยชน์"><Icon name="close" size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {editing && (
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> สัดส่วนผลประโยชน์รวมทุกรายควรเท่ากับ 100%
        </p>
      )}
    </div>
  );
}

function DetailsTab({ data, setData, editing, kids, setKids, bens, setBens }) {
  const m = data.member;
  const update = (k) => (v) => setData(d => ({ ...d, member: { ...d.member, [k]: v }}));

  return (
    <EditCtx.Provider value={{ editing }}>
      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลส่วนตัว</h3>
        </div>
        <div className="form-grid">
          <div className="name-row">
            <Field label="คำนำหน้า"        value={m.title} type="select"
                   options={["นาย", "นาง", "นางสาว"]}
                   onChange={update('title')} />
            <Field label="ชื่อ"             value={m.firstName} onChange={update('firstName')} />
            <Field label="นามสกุล"          value={m.lastName} onChange={update('lastName')} />
          </div>
          <Field label="ประเภทสมาชิก"     value={m.memberType} type="select"
                 options={window.MEMBER_TYPE_OPTIONS.includes(m.memberType) ? window.MEMBER_TYPE_OPTIONS : [...window.MEMBER_TYPE_OPTIONS, m.memberType]}
                 onChange={update('memberType')} />
          <Field label="เพศ"             value={m.gender} type="select"
                 options={["ชาย", "หญิง"]} onChange={update('gender')} />
          <Field label="สัญชาติ"          value={m.nationality} onChange={update('nationality')} />
          <Field label="วันเดือนปีเกิด"     value={editing ? m.birthDate : `${fmt.date(m.birthDate)} (${fmt.ageYM(m.birthDate)})`}
                 type={editing ? 'date' : 'text'} onChange={update('birthDate')} />
          <Field label="เลขประจำตัวประชาชน" value={m.citizenId} mono onChange={update('citizenId')} />
          <Field label="สถานภาพสมรส"      value={m.maritalStatus} type="select"
                 options={["โสด", "สมรส", "หย่าร้าง"]}
                 onChange={update('maritalStatus')} />
          <Field label="รายละเอียดที่อยู่"     value={m.address} onChange={update('address')} span={2} />
        </div>

        {m.maritalStatus === 'สมรส' && m.spouseInfo && (
          <div style={{ marginTop: 8 }}>
            <div className="mp-section-title" style={{ marginBottom: 4 }}>ข้อมูลคู่สมรส</div>
            <div className="spouse-card">
              <div className="sp-grid">
                <div><div className="sp-k">ชื่อ-สกุล</div><div className="sp-v">{m.spouseInfo.title}{m.spouseInfo.firstName} {m.spouseInfo.lastName}</div></div>
                <div><div className="sp-k">เลขบัตรประชาชน</div><div className="sp-v mono">{m.spouseInfo.citizenId}</div></div>
                <div><div className="sp-k">วันเกิด / อายุ</div><div className="sp-v">{fmt.date(m.spouseInfo.birthDate)} ({fmt.ageYM(m.spouseInfo.birthDate)})</div></div>
                <div><div className="sp-k">เพศ / สัญชาติ</div><div className="sp-v">{m.spouseInfo.gender} · {m.spouseInfo.nationality}</div></div>
              </div>
              {m.spouseInfo.isMember && (
                <span className="chip primary" title="คู่สมรสเป็นสมาชิกสหกรณ์">
                  <span className="dot-c" /> สมาชิก {m.spouseInfo.memberCode}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลการทำงาน</h3>
        </div>
        <div className="form-grid">
          <Field label="รหัสพนักงาน"   value={m.employeeId} mono onChange={update('employeeId')} />
          <div className="field">
            <span className="label">ต้นสังกัด</span>
            {editing ? (
              <select className="value" value={m.departmentCode || ''}
                      onChange={(e) => {
                        const d = window.affilByCode(e.target.value);
                        setData(dd => ({ ...dd, member: { ...dd.member, departmentCode: e.target.value,
                          department: d ? d.name : dd.member.department,
                          workDepartment: d && d.unit ? d.unit : dd.member.workDepartment } }));
                      }}>
                {(window.affilLoad ? window.affilLoad() : []).filter(d => d.enabled !== false)
                  .map(d => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}
              </select>
            ) : (
              <span className="value">{window.affilLabel ? window.affilLabel(m.departmentCode, m.department) : (m.department || '—')}</span>
            )}
          </div>
          <Field label="แผนกสังกัด"     value={m.workDepartment} onChange={update('workDepartment')} />
          <Field label="เงินเดือน"  value={editing ? m.salary : `฿ ${fmt.money(m.salary)} / เดือน`}
                 onChange={(v) => update('salary')(Number(v) || 0)} />
          <Field label="สถานะการทำงาน"  value={m.workStatus} type="select"
                 options={["พนักงานปกติ", "เกษียณ", "ลาออก", "ไล่ออก"]}
                 onChange={update('workStatus')} />
          <Field label="วันที่เกษียณอายุ" value={editing ? m.retireDate : `${fmt.date(m.retireDate)} (${fmt.retireCountdown(m.retireDate)})`}
                 type={editing ? 'date' : 'text'} onChange={update('retireDate')} span={2} />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลสมาชิกสหกรณ์</h3>
        </div>
        <div className="form-grid">
          <Field label="วันที่เป็นสมาชิก"  value={editing ? m.joinDate : fmt.date(m.joinDate)}
                 type={editing ? 'date' : 'text'} onChange={update('joinDate')} />
          <Field label="วันที่พ้นสภาพ"     value={m.expireDate ? fmt.date(m.expireDate) : '—'} muted onChange={update('expireDate')} />
          <Field label="วันที่ลาออก"      value={m.resignDate ? fmt.date(m.resignDate) : '—'} muted onChange={update('resignDate')} />
          <Field label="สาเหตุการลาออก"   value={m.resignReason || '—'} muted onChange={update('resignReason')} />
          <Field label="หมายเหตุ"   value={m.resolution} onChange={update('resolution')} span={2} />
        </div>
      </div>

      <BeneficiariesSection editing={editing} bens={bens} setBens={setBens} />

      <ChildrenSection editing={editing} kids={kids} setKids={setKids} />
    </EditCtx.Provider>
  );
}

// ─── TAB: สถานะภาพ ────────────────────────────────────────────────
function StatusTab({ data, setData, editing }) {
  const s = data.status;
  const m = data.member;
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));

  const appOpts  = window.APPLICATION_TYPE_OPTIONS;
  const collOpts = window.COLLECTION_STATUS_OPTIONS;
  const labelOf = (opts, v) => (opts.find(o => o.value === v) || {}).label || v;

  const setLoanReq = (k) => () =>
    setData(d => ({ ...d, status: { ...d.status, loanReqs: { ...d.status.loanReqs, [k]: !d.status.loanReqs[k] }}}));
  const setLoanGuar = (k) => () =>
    setData(d => ({ ...d, status: { ...d.status, loanGuarantee: { ...d.status.loanGuarantee, [k]: !d.status.loanGuarantee[k] }}}));
  const setDividend = (k) => () =>
    setData(d => ({ ...d, status: { ...d.status, dividend: { ...d.status.dividend, [k]: !d.status.dividend[k] }}}));
  const setRadio = (group, value) =>
    setData(d => ({ ...d, status: { ...d.status, [group]: value }}));

  // เปลี่ยนค่า Listbox + บันทึก audit (เฉพาะเมื่อค่าจริงเปลี่ยน)
  const changeListbox = (group, fieldLabel, opts) => (value) => {
    const before = labelOf(opts, s[group]);
    const after  = labelOf(opts, value);
    setRadio(group, value);
    if (before !== after) {
      audit.log({
        action: 'status', module: 'ทะเบียนสมาชิก',
        target: `${m.code} · ${m.name}`,
        summary: `เปลี่ยน${fieldLabel}`,
        changes: [{ field: fieldLabel, before, after }],
      });
    }
  };

  const Row = ({ on, label, hint, onClick }) => (
    <div className={"check-row" + (on ? " on" : "") + (editing ? "" : " disabled")}
         onClick={editing ? onClick : undefined} role="checkbox" aria-checked={on} aria-disabled={!editing}>
      <div className="box" />
      <span className="ck-label">{label}</span>
      {hint && <span className="ck-hint">{hint}</span>}
    </div>
  );
  const Radio = ({ on, label, onClick }) => (
    <div className={"radio-row" + (on ? " on" : "") + (editing ? "" : " disabled")}
         onClick={editing ? onClick : undefined} role="radio" aria-checked={on} aria-disabled={!editing}>
      <div className="dot" />
      <span>{label}</span>
    </div>
  );

  return (
    <div>
      <div className="page-actions">
        <span className="muted" style={{ fontSize: 12 }}>
          {editing
            ? 'ปรับเปลี่ยนสถานะจะมีผลต่อระบบเงินกู้/ปันผลเมื่อบันทึกข้อมูล'
            : 'กดปุ่ม “แก้ไขข้อมูลสมาชิก” ด้านบนเพื่อปรับเปลี่ยนสถานะ'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="section">
          <div className="section-head"><span className="head-bar" /><h3>ประเภทการสมัครสมาชิก</h3></div>
          <div className="lb-field">
            <label className="lb-label">ประเภทการสมัครสมาชิก</label>
            <div className="select-wrap">
              <select className="filter-select lb-select"
                      value={s.applicationType} disabled={!editing}
                      onChange={e => changeListbox('applicationType', 'ประเภทการสมัครสมาชิก', appOpts)(e.target.value)}>
                {appOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="select-caret"><Icon name="chevDown" size={14} /></span>
            </div>
          </div>
        </div>
        <div className="section">
          <div className="section-head"><span className="head-bar" /><h3>สถานะการเรียกเก็บ</h3></div>
          <div className="lb-field">
            <label className="lb-label">สถานะการเรียกเก็บ</label>
            <div className="select-wrap">
              <select className="filter-select lb-select"
                      value={s.collectionStatus} disabled={!editing}
                      onChange={e => changeListbox('collectionStatus', 'สถานะการเรียกเก็บ', collOpts)(e.target.value)}>
                {collOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="select-caret"><Icon name="chevDown" size={14} /></span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>สถานะประกอบการกู้</h3>
          <span className="muted" style={{ fontSize: 11 }}>เอกสารและประกันที่ต้องมีก่อนการอนุมัติเงินกู้</span>
        </div>
        <div className="status-grid">
          <Row on={s.loanReqs.providentFund} label="กองทุนสำรองเลี้ยงชีพ"  onClick={setLoanReq('providentFund')} />
          <Row on={s.loanReqs.assignmentDeed} label="หนังสือโอนสิทธิ์เรียกร้อง" onClick={setLoanReq('assignmentDeed')} />
          <Row on={s.loanReqs.spouseConsent}  label="ใบยินยอมคู่สมรส"        onClick={setLoanReq('spouseConsent')} />
          <Row on={s.loanReqs.lifeInsurance}  label="ประกันชีวิต"              onClick={setLoanReq('lifeInsurance')} />
          <Row on={s.loanReqs.beneficiary}    label="มีผู้รับโอนผลประโยชน์"  onClick={setLoanReq('beneficiary')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="section">
          <div className="section-head"><span className="head-bar" /><h3>สถานะการกู้/การค้ำ</h3></div>
          <div className="status-grid cols-1">
            <Row on={s.loanGuarantee.noGuarantee} label="งดค้ำประกันทุกประเภท" hint="สมาชิกจะไม่สามารถค้ำให้คนอื่นได้" onClick={setLoanGuar('noGuarantee')} />
            <Row on={s.loanGuarantee.noLoan}      label="งดกู้ทุกประเภท"        hint="สมาชิกจะไม่สามารถยื่นกู้ใหม่ได้" onClick={setLoanGuar('noLoan')} />
          </div>
        </div>
        <div className="section">
          <div className="section-head"><span className="head-bar" /><h3>สถานะปันผล/เฉลี่ยคืน</h3></div>
          <div className="status-grid cols-1">
            <Row on={s.dividend.freezeDividend} label="อายัด ปันผล/เฉลี่ยคืน" onClick={setDividend('freezeDividend')} />
            <Row on={s.dividend.noDividend}     label="งดปันผล"               onClick={setDividend('noDividend')} />
            <Row on={s.dividend.noRebate}       label="งดเฉลี่ยคืน"            onClick={setDividend('noRebate')} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: หักประจำเดือน ───────────────────────────────────────────
function DeductionsTab({ data }) {
  const rows = data.deductions;
  const [slipOpen, setSlipOpen] = useState(false);
  const sumP = rows.reduce((a, r) => a + r.principal, 0);
  const sumI = rows.reduce((a, r) => a + r.interest, 0);
  const sumT = sumP + sumI;

  return (
    <div>
      <div className="toolbar">
        <span style={{ fontWeight: 600, fontSize: 13 }}>รายการหักประจำงวด</span>
        <span className="chip primary">งวด 2569/04 · เม.ย. 2569</span>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setSlipOpen(true)}><Icon name="print" /> พิมพ์ใบหัก</button>
        <button className="btn sm"><Icon name="download" /> ส่งออก CSV</button>
      </div>

      {slipOpen && window.DeductionSlipOverlay && (
        <window.DeductionSlipOverlay data={data} onClose={() => setSlipOpen(false)} />
      )}

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>ลำดับ</th>
                <th>รายละเอียด</th>
                <th className="center" style={{ width: 140 }}>งวดที่ชำระมาแล้ว</th>
                <th className="num" style={{ width: 120 }}>ชำระต้น</th>
                <th className="num" style={{ width: 120 }}>ชำระดอกเบี้ย</th>
                <th className="num" style={{ width: 120 }}>รวมชำระ</th>
                <th className="num" style={{ width: 130 }}>คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.no}>
                  <td className="center muted">{r.no}</td>
                  <td>{r.detail}</td>
                  <td className="center mono">{r.term}</td>
                  <td className="num">{fmt.money(r.principal)}</td>
                  <td className="num">{r.interest ? fmt.money(r.interest) : <span className="muted">—</span>}</td>
                  <td className="num"><b>{fmt.money(r.principal + r.interest)}</b></td>
                  <td className="num">{r.remaining != null ? fmt.money(r.remaining) : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="right">รวมการหักชำระ</td>
                <td className="num">{fmt.money(sumP)}</td>
                <td className="num">{fmt.money(sumI)}</td>
                <td className="num">{fmt.money(sumT)}</td>
                <td className="num muted">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="summary-row">
        <div className="summary-card">
          <div className="label">รวมการหักชำระ</div>
          <div className="value">฿ {fmt.money(sumT)}</div>
          <div className="sub">ต้น ฿ {fmt.money(sumP)} + ดอกเบี้ย ฿ {fmt.money(sumI)}</div>
        </div>
        <div className="summary-card">
          <div className="label">ฉุกเฉินหักโอน</div>
          <div className="value">฿ {fmt.money(data.deductionSummary.emergencyTransfer)}</div>
          <div className="sub">1 สัญญาเงินกู้ฉุกเฉิน</div>
        </div>
        <div className="summary-card accent">
          <div className="label">ยอดเรียกเก็บสุทธิ</div>
          <div className="value">฿ {fmt.money(data.deductionSummary.net)}</div>
          <div className="sub">งวด 2569/04 — จัดเก็บ 25 เม.ย. 2569</div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: ลายเซ็นต์ ────────────────────────────────────────────────
// edit mode: hover กรอบลายเซ็น → ลายเซ็นจางลง + ดินสอซ้อนทับ + "คลิกเพื่อแนบลายเซ็น"
// คลิก = mock สลับเป็นลายเซ็นตัวอย่าง · ปุ่มลบเล็ก ๆ มุมขวาบน
const MockSignature = () => (
  <svg viewBox="0 0 400 100" width="320" height="80" style={{ color: 'var(--primary-700)' }}>
    <path d="M30 70 Q50 30 70 60 T 110 65 Q130 25 150 60 Q170 80 200 50 Q220 30 250 60 Q280 75 310 45 L 350 50"
          stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <path d="M70 75 L 200 78" stroke="currentColor" strokeWidth="1" fill="none" opacity=".4" />
  </svg>
);

function SignatureTab({ data, editing }) {
  const [hasSig, setHasSig] = useState(true);
  const [hover, setHover] = useState(false);
  const showOverlay = editing && (hover || !hasSig);

  return (
    <div>
      <div className="page-actions">
        <span className="muted" style={{ fontSize: 12 }}>
          ลายเซ็นต์ใช้สำหรับการตรวจสอบยืนยันตัวตนของสมาชิกในการทำธุรกรรม
        </span>
      </div>

      <div className="sig-card">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', fontWeight: 600 }}>
            ลายเซ็นต์สมาชิก
          </span>
          {editing && (
            <span className="muted" style={{ fontSize: 12 }}>
              คลิกที่กรอบลายเซ็นเพื่อแนบไฟล์ภาพลายเซ็น (PNG / JPG)
            </span>
          )}
        </div>

        <div className="sig-box"
             onMouseEnter={() => editing && setHover(true)}
             onMouseLeave={() => setHover(false)}
             onClick={() => editing && setHasSig(true)}
             style={{ position: 'relative', cursor: editing ? 'pointer' : 'default' }}>
          {hasSig && (
            <div style={{ opacity: showOverlay ? 0.18 : 1, transition: 'opacity .15s ease' }}>
              <MockSignature />
            </div>
          )}
          {!hasSig && !editing && (
            <span className="muted" style={{ fontSize: 12 }}>ยังไม่มีลายเซ็น</span>
          )}
          {showOverlay && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icon name="edit" size={22} />
              <span style={{ fontSize: 12, color: 'var(--primary-700)' }}>คลิกเพื่อแนบลายเซ็น</span>
            </div>
          )}
          {editing && hasSig && (
            <button className="btn ghost sm sig-clear" title="ลบลายเซ็น"
                    onClick={(e) => { e.stopPropagation(); setHasSig(false); }}
                    style={{ position: 'absolute', top: 6, right: 6, padding: '0 6px', minHeight: 24, zIndex: 2 }}>
              <Icon name="close" size={11} />
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 14, fontSize: 12 }}>
          <div>
            <div className="muted" style={{ marginBottom: 2 }}>ชื่อ–สกุล</div>
            <div style={{ fontWeight: 500 }}>{data.member.name}</div>
          </div>
          <div>
            <div className="muted" style={{ marginBottom: 2 }}>วันที่ลงทะเบียน</div>
            <div style={{ fontWeight: 500 }}>{fmt.date(data.member.joinDate)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DetailsTab, StatusTab, DeductionsTab, SignatureTab, BeneficiariesSection, EditCtx, FIELD_LABELS });
window.diffMemberFields = (before, after) => Object.keys(FIELD_LABELS)
  .filter(k => before[k] !== after[k] && (before[k] != null || after[k] != null))
  .map(k => ({ field: FIELD_LABELS[k], before: String(before[k] ?? '—'), after: String(after[k] ?? '—') }));
