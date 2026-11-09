// ════════════════════════════════════════════════════════════════════
//  ย้ายสังกัดสมาชิก — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง: ① ข้อมูลคำขอและสมาชิก ② สังกัดใหม่ (+ งวดที่มีผล)
//             ③ หมายเหตุ ④ ประวัติการโอนย้าย
//  คำขอย้ายสังกัดจะถูกส่งเข้าคิว "อนุมัติใบคำขอ" ให้หัวหน้าพิจารณาอนุมัติ
//  ใช้ CSS รูปแบบ .icr-* ร่วมกับหน้าจอ "ใบคำขอเปลี่ยนแปลงยอดชำระหนี้"
// ════════════════════════════════════════════════════════════════════

// ─── หัวข้อ section พร้อมเลขลำดับ (วงกลมเขียว) ───────────────────────
function MtSecHead({ title, children }) {
  return (
    <div className="section-head" style={{ marginBottom: 14 }}>
      <span className="head-bar" />
      <h3>{title}</h3>
      {children && <div className="head-actions">{children}</div>}
    </div>
  );
}

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function MtFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 140 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function MtRO({ value, mono, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── ป้ายสถานะแบบกล่อง (จุดสี + ข้อความ) ────────────────────────────
function MtStatusBox({ pill, label }) {
  const color = { ok: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)', neutral: 'var(--text-faint, #9aa3ab)' }[pill] || 'var(--text-faint, #9aa3ab)';
  return (
    <div className="icr-statusbox">
      <span className="icr-dot" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

// ─── popup ค้นหาสังกัด/หน่วยงาน (สังกัดปลายทาง) ─────────────────────
function MtDeptSearchModal({ onPick, onClose, excludeCode }) {
  const [c, setC] = useState({ code: '', name: '', unit: '' });
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const results = window.searchDepartments(c);
  const reset = () => setC({ code: '', name: '', unit: '' });
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="bank" /></div>
          <h2>ค้นหาสังกัด / หน่วยงาน</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <label className="gc-sf">
              <span>รหัสสังกัด</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)} placeholder="เช่น 0801" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>ชื่อสังกัด</span>
              <input value={c.name} onChange={(e) => set('name', e.target.value)} placeholder="เช่น กองคลัง" />
            </label>
            <label className="gc-sf">
              <span>หน่วยงาน / กลุ่มงาน</span>
              <input value={c.unit} onChange={(e) => set('unit', e.target.value)} placeholder="เช่น งานบัญชี" />
            </label>
            <div className="gc-sf-actions" style={{ gridColumn: 'span 3' }}>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>
          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการสังกัด <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 320 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 96 }}>รหัสสังกัด</th>
                  <th>ชื่อสังกัด</th>
                  <th>หน่วยงาน / กลุ่มงาน</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">ไม่พบสังกัดที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map((d) => {
                  const same = d.code === excludeCode;
                  return (
                    <tr key={d.code} className={same ? '' : 'clickable'} onClick={() => !same && onPick(d)}
                        style={same ? { opacity: .5, cursor: 'not-allowed' } : undefined}>
                      <td className="mono">{d.code}</td>
                      <td>{d.name}</td>
                      <td>{d.unit}</td>
                      <td className="center">
                        {same ? <span className="chip" style={{ fontSize: 10 }}>สังกัดเดิม</span>
                          : <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                    onClick={(e) => { e.stopPropagation(); onPick(d); }} title="เลือกสังกัด"><Icon name="chevRight" /></button>}
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
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function MtFormScreen({ onToast, audit }) {
  const today = window.mtToday();
  const beYear = window.mtBeYear(today);

  const [member, setMember] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [deptModal, setDeptModal] = useState(false);

  const [reqDate, setReqDate] = useState(today);
  const [newDept, setNewDept] = useState(null);          // {code,name,unit,head}
  const [period, setPeriod] = useState(window.mtCurrentPeriod(today));
  const [note, setNote] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [reqStatus, setReqStatus] = useState('draft');   // draft | pending
  const [error, setError] = useState('');

  const active = member ? window.mtIsActive(member.status) : true;
  const history = member ? window.mtHistory(member.code, member) : [];

  const pickMember = (m) => {
    setMemberModal(false);
    setMember(m);
    setError('');
    setNewDept(null);
    setNote('');
    setSavedNo(''); setReqStatus('draft');
  };

  const clearScreen = () => {
    setMember(null); setNewDept(null);
    setReqDate(today);
    setPeriod(window.mtCurrentPeriod(today));
    setNote(''); setSavedNo(''); setReqStatus('draft'); setError('');
  };

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!active) return `สมาชิกรายนี้มีสถานะ “${member.status}” — ไม่สามารถทำรายการย้ายสังกัดได้`;
    if (!reqDate) return 'กรุณาระบุวันที่คำขอ';
    if (!newDept) return 'กรุณาเลือกสังกัดใหม่ที่จะโอนย้าย';
    if (newDept.code === member.deptCode) return 'สังกัดใหม่ต้องไม่ซ้ำกับสังกัดเดิมของสมาชิก';
    if (!period || !/^\d{6}$/.test(period)) return 'กรุณาระบุงวดที่มีผล 6 หลัก (พ.ศ. + เดือน) เช่น 256907';
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); onToast && onToast(err); return; }
    setError('');
    const no = savedNo || window.mtNextDocNo(beYear);
    setSavedNo(no);
    setReqStatus('pending');
    // ── ส่งคำขอไปยังเมนู “อนุมัติใบคำขอ” ให้หัวหน้าพิจารณา ──
    const reqId = window.dbaNextReqNo(beYear);
    window.dbaPush && window.dbaPush({
      id: reqId, type: 'transfer-dept', docNo: no,
      memberCode: member.code, memberName: member.name, dept: member.dept,
      contractNo: '—', loanType: 'ย้ายสังกัดสมาชิก', amount: 0,
      requestedBy: window.MT_USER, requestDate: reqDate,
      meetingRef: '', priority: 'normal',
      summary: `ย้ายสังกัด ${member.dept} (${member.deptCode}) → ${newDept.name} · ${newDept.unit} (${newDept.code}) · มีผลงวด ${period}`,
      fields: [
        { k: 'สังกัดเดิม', v: `${member.dept} (${member.deptCode})` },
        { k: 'สังกัดใหม่', v: `${newDept.name} · ${newDept.unit} (${newDept.code})`, hl: true },
        { k: 'งวดที่มีผล', v: period },
        { k: 'หมายเหตุ', v: note || '—' },
      ],
      status: 'pending',
    });
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ย้ายสังกัดสมาชิก',
      target: `${member.code} · ${member.name}`,
      summary: `ส่งคำขอย้ายสังกัด ${no} · ${member.dept} (${member.deptCode}) → ${newDept.name} · ${newDept.unit} (${newDept.code}) · มีผลงวด ${period} — รอหัวหน้าอนุมัติ`,
      changes: [
        { field: 'สังกัด', before: `${member.dept} (${member.deptCode})`, after: `${newDept.name} · ${newDept.unit} (${newDept.code})` },
        { field: 'งวดที่มีผล', before: '—', after: period },
        { field: 'สถานะคำขอ', before: 'ร่าง', after: 'รอหัวหน้าอนุมัติ' },
      ],
    });
    onToast && onToast(`ส่งคำขอย้ายสังกัด ${no} · ${member.name} — ส่งไปที่เมนูอนุมัติใบคำขอแล้ว`);
  };

  const doPrint = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบคำขอย้ายสังกัดสมาชิก…');
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="ย้ายสังกัดสมาชิก">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="swap" size={20} /></span>
          <div>
            <h1>ย้ายสังกัดสมาชิก</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · บันทึกคำขอย้ายสังกัดสมาชิก ส่งให้หัวหน้าพิจารณาอนุมัติ</div>
          </div>
          {reqStatus === 'pending' && <span className="pill warn" style={{ marginLeft: 10, alignSelf: 'center' }}>รออนุมัติ</span>}
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={clearScreen}><Icon name="plus" size={13} /> เพิ่มใหม่</button>
          <button className="btn sm" onClick={() => setMemberModal(true)}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> ส่งอนุมัติ</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {member && !active && !error && (
        <div className="dn-status-alert warn" style={{ marginBottom: 12 }}>
          <Icon name="info" size={15} /><span>สมาชิกรายนี้มีสถานะ <b>{member.status}</b> — ระบบไม่อนุญาตให้ทำรายการย้ายสังกัด</span>
        </div>
      )}

      {/* ── ข้อมูลคำขอและสมาชิก ── */}
      <div className="search-card icr-sec">
        <MtSecHead title="ข้อมูลคำขอและสมาชิก" />
        <div className="icr-strip">
          <MtFld label="เลขที่ย้ายสังกัด" w={170}>
            {savedNo ? <MtRO value={savedNo} mono /> : <div className="icr-ro icr-auto">Auto</div>}
          </MtFld>
          <MtFld label="วันที่คำขอ" w={160} required>
            <ErpDate value={reqDate} onChange={(v) => ((e) => setReqDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </MtFld>
          <MtFld label="ผู้ป้อน" grow w={200}><MtRO value={window.MT_USER} /></MtFld>
          <MtFld label="สถานะสมาชิก" w={150}>
            {member ? <MtStatusBox pill={(window.DN_MEMBER_STATUS[member.status] || {}).pill || 'neutral'} label={member.status} /> : <MtRO value="" />}
          </MtFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 14 }}>
          <MtFld label="ทะเบียน" w={170} required>
            <div className="icr-search-box" onClick={() => setMemberModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </MtFld>
          <MtFld label="ชื่อ - สกุล" grow w={240}><MtRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></MtFld>
          <MtFld label="สังกัดก่อนย้าย (รหัส)" w={150}><MtRO value={member ? member.deptCode : ''} mono placeholder="(ดึงอัตโนมัติ)" /></MtFld>
          <MtFld label="ชื่อสังกัดเดิม" grow w={240}><MtRO value={member ? member.dept : ''} placeholder="(ดึงอัตโนมัติ)" /></MtFld>
        </div>
      </div>

      {/* ── ③ สังกัดใหม่ ── */}
      <div className="search-card icr-sec">
        <MtSecHead title="สังกัดใหม่" />
        <div className="icr-strip">
          <MtFld label="สังกัดที่จะโอนย้าย (รหัส)" w={210} required>
            <div className="icr-search-box" onClick={() => member && active && setDeptModal(true)}>
              <input className="cfg-input mono sr-clickable" value={newDept ? newDept.code : ''} readOnly
                     placeholder={member && active ? 'เลือกสังกัด…' : 'เลือกสมาชิกก่อน'} disabled={!member || !active} />
              <button className="icr-search-btn" type="button" disabled={!member || !active}><Icon name="bank" size={14} /></button>
            </div>
          </MtFld>
          <MtFld label="ชื่อสังกัด" grow w={260} required><MtRO value={newDept ? newDept.name : ''} placeholder="(เลือกจากรายการ)" /></MtFld>
          <MtFld label="หน่วยงาน / กลุ่มงาน" grow w={240}><MtRO value={newDept ? newDept.unit : ''} placeholder="—" /></MtFld>
          <MtFld label="งวดที่มีผล" w={150} required>
            <input className="cfg-input mono" value={period} onChange={(e) => setPeriod(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="เช่น 256907" />
          </MtFld>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
          <Icon name="info" size={11} /> งวดที่มีผลใช้กำหนดจุดเริ่มต้นที่ระบบนำสังกัดใหม่ไปใช้กับการคิดหนี้ หุ้น และเงินเดือนหักชำระรายเดือน
        </p>
        {newDept && member && (
          <div className="icr-restruct-note" style={{ marginTop: 12 }}>
            <Icon name="swap" size={13} />
            <span>ย้ายจาก <b>{member.dept} ({member.deptCode})</b> ไปยัง <b>{newDept.name} · {newDept.unit} ({newDept.code})</b> — มีผลตั้งแต่งวด {period}</span>
          </div>
        )}
      </div>

      {/* ── ④ หมายเหตุ ── */}
      <div className="search-card icr-sec">
        <MtSecHead title="หมายเหตุ" />
        <div className="icr-note-wrap">
          <textarea className="cfg-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500}
                    placeholder="บันทึกเหตุผลการย้ายสังกัด รายละเอียดประกอบการอนุมัติ หรือหมายเหตุจากเจ้าหน้าที่" />
          <span className="icr-note-count">{note.length}/500</span>
        </div>
      </div>

      {/* ── ⑥ ประวัติการโอนย้าย ── */}
      <div className="search-card icr-sec">
        <MtSecHead title="ประวัติการโอนย้าย">
          <span className="muted" style={{ fontSize: 11.5 }}>{member ? `${member.code} · ${member.name}` : '— เลือกสมาชิกเพื่อแสดงประวัติ —'}</span>
        </MtSecHead>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 130 }}>วันที่ย้าย</th>
                <th>ประวัติการย้ายสังกัด</th>
                <th style={{ width: 240 }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {!member ? (
                <tr><td colSpan="3" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>เลือกสมาชิกเพื่อแสดงประวัติการย้ายสังกัดย้อนหลัง</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="3" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>ยังไม่มีประวัติการย้ายสังกัดสำหรับสมาชิกรายนี้</td></tr>
              ) : history.map((h, i) => (
                <tr key={i}>
                  <td className="center mono">{window.fmt.date(h.date)}</td>
                  <td>{h.detail}</td>
                  <td className="muted">{h.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        <div className="icr-hist-foot">
          <span className="muted">{member && history.length > 0 ? `แสดง 1 – ${history.length} จาก ${history.length} รายการ` : ''}</span>
          <div className="icr-pager">
            <button className="icr-pg" disabled>«</button>
            <button className="icr-pg" disabled>‹</button>
            <button className="icr-pg active">1</button>
            <button className="icr-pg" disabled>›</button>
            <button className="icr-pg" disabled>»</button>
          </div>
        </div>
      </div>

      {memberModal && <DnMemberSearchModal onPick={pickMember} onClose={() => setMemberModal(false)} />}
      {deptModal && <MtDeptSearchModal onPick={(d) => { setNewDept(d); setDeptModal(false); setError(''); }}
                                       onClose={() => setDeptModal(false)} excludeCode={member ? member.deptCode : ''} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function MemberTransferPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <MtFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { MemberTransferPage, MtFormScreen, MtDeptSearchModal });
