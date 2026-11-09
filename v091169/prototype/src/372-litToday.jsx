// ════════════════════════════════════════════════════════════════════
//  ทะเบียนสัญญาฟ้องคดี — บันทึกและติดตามงานฟ้องคดี (ดำเนินคดี)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน › ดำเนินคดี
// ════════════════════════════════════════════════════════════════════

const litToday = () => new Date().toISOString().slice(0, 10);

// ─── ฟิลด์ย่อย (label + control) ────────────────────────────────────
function LgField({ label, required, hint, children, span }) {
  const st = span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

// ─── Popup ค้นหาสมาชิก/ลูกหนี้ ──────────────────────────────────────
function LgMemberSearchModal({ onPick, onClose }) {
  const [q, setQ] = useState('');
  const results = window.litSearchMembers(q);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสมาชิก / ลูกหนี้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="search" style={{ marginBottom: 12 }}>
            <Icon name="search" size={14} />
            <input value={q} autoFocus onChange={(e) => setQ(e.target.value)}
                   placeholder="ค้นหารหัสสมาชิก, ชื่อ-สกุล, เลขบัตรประชาชน…" />
          </div>
          <div className="gc-sub-title" style={{ marginTop: 0 }}>
            รายชื่อสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>รหัสสมาชิก</th><th>ชื่อ-สกุล</th><th>เลขบัตรประชาชน</th>
                  <th className="center">สถานะ</th><th className="center">สัญญา</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map(m => (
                  <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                    <td className="mono">{m.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td className="mono">{m.citizenId}</td>
                    <td className="center"><span className={'pill ' + (m.status === 'พ้นสภาพ' || m.status === 'ลาออก' ? 'warn' : m.status === 'เสียชีวิต' ? 'bad' : 'ok')}>{m.status}</span></td>
                    <td className="center">{(m.contracts || []).length}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือก">
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

// ─── Modal: ยกเลิกคดีฟ้อง (ต้องระบุเหตุผล + ยืนยัน) ─────────────────
function LgCancelModal({ contracts, hasVerdict, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [date] = useState(litToday);
  const [ack, setAck] = useState(false);
  const blocked = hasVerdict && !ack;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--danger-50, #fef2f2)', color: 'var(--danger)' }}><Icon name="close" /></div>
          <h2>ยกเลิกคดีฟ้อง</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="muted" style={{ fontSize: 12, marginTop: 0, marginBottom: 12 }}>
            ยกเลิกสถานะการฟ้องคดีของสัญญา <b className="mono" style={{ color: 'var(--text)' }}>{contracts.join(', ')}</b> —
            ระบบจะเก็บข้อมูลคดีไว้เป็นประวัติ ไม่มีการลบทิ้ง
          </p>
          {hasVerdict && (
            <label className="lg-cancel-ack">
              <input type="checkbox" className="ch-box" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              <span><Icon name="info" size={12} /> คดีนี้มีคำพิพากษาแล้ว — ยืนยันว่าได้รับอนุมัติให้ยกเลิกการดำเนินคดีตามระเบียบ</span>
            </label>
          )}
          <LgField label="เหตุผลการยกเลิก" required>
            <textarea className="cfg-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="ระบุเหตุผล เช่น ลูกหนี้ชำระหนี้ครบถ้วน / ประนีประนอมนอกศาล / ถอนฟ้อง" />
          </LgField>
          <div className="lg-form-grid2" style={{ marginTop: 12 }}>
            <LgField label="วันที่ยกเลิก"><input className="cfg-input sr-readonly" type="date" value={date} readOnly /></LgField>
            <LgField label="ผู้ทำรายการ"><input className="cfg-input sr-readonly" value={window.LIT_USER} readOnly /></LgField>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn danger" disabled={!reason.trim() || blocked}
                  onClick={() => onConfirm({ reason: reason.trim(), date })}>
            <Icon name="check" /> ยืนยันยกเลิกคดี
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Modal: ออกรายงาน ───────────────────────────────────────────────
function LgReportModal({ onPick, onClose }) {
  const reports = [
    { id: 'r1', label: 'รายงานทะเบียนสัญญาฟ้องคดี', desc: 'ทะเบียนคดีทั้งหมดพร้อมเลขคดีดำ/คดีแดง' },
    { id: 'r2', label: 'รายงานรายละเอียดลูกหนี้ที่ถูกฟ้อง', desc: 'ข้อมูลสมาชิก ยอดหนี้ และสัญญาที่ฟ้อง' },
    { id: 'r3', label: 'รายงานสถานะคดี', desc: 'สถานะการดำเนินคดีและขั้นตอนปัจจุบัน' },
    { id: 'r4', label: 'รายงานข้อมูลศาล / คดีดำ / คดีแดง', desc: 'แยกตามศาลและเลขคดี' },
    { id: 'r5', label: 'รายงานสรุปผลคำพิพากษา', desc: 'ผลคำพิพากษาและการบังคับคดี' },
    { id: 'r6', label: 'รายงานประกอบการติดตามหนี้ทางกฎหมาย', desc: 'เอกสารประกอบสำนวนคดี' },
  ];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <h2>ออกรายงานข้อมูลคดี</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lg-report-list">
            {reports.map(r => (
              <button key={r.id} className="lg-report-row" onClick={() => onPick(r.label)}>
                <span className="lg-report-ico"><Icon name="receipt" size={15} /></span>
                <span className="lg-report-txt">
                  <span className="lg-report-title">{r.label}</span>
                  <span className="lg-report-desc">{r.desc}</span>
                </span>
                <Icon name="chevRight" size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ลำดับการดำเนินงาน (timeline) ───────────────────────────────────
function LgWorkflow({ workflow }) {
  const wf = workflow || {};
  // ขั้นตอนที่ทำแล้ว = มี date; ขั้น active = ขั้นถัดจากที่ทำล่าสุด
  let firstPending = window.LIT_WORKFLOW.findIndex(s => !wf[s.id] || !wf[s.id].date);
  if (firstPending === -1) firstPending = window.LIT_WORKFLOW.length;
  return (
    <div className="lg-timeline">
      {window.LIT_WORKFLOW.map((s, i) => {
        const rec = wf[s.id];
        const done = rec && rec.date;
        const active = i === firstPending;
        const cls = done ? 'done' : active ? 'active' : 'pending';
        return (
          <div key={s.id} className={'lg-tl-step ' + cls}>
            <div className="lg-tl-rail">
              <span className="lg-tl-dot">{done ? <Icon name="check" size={12} /> : i + 1}</span>
              {i < window.LIT_WORKFLOW.length - 1 && <span className="lg-tl-line" />}
            </div>
            <div className="lg-tl-body">
              <div className="lg-tl-head">
                <span className="lg-tl-label">{s.label}</span>
                {done ? <span className="chip success sm">เสร็จสิ้น</span>
                  : active ? <span className="chip warning sm">ดำเนินการอยู่</span>
                  : <span className="chip sm">รอดำเนินการ</span>}
              </div>
              <div className="lg-tl-desc">{s.desc}</div>
              {done && (
                <div className="lg-tl-meta">
                  <span><Icon name="calendar" size={11} /> {fmt.date(rec.date)}</span>
                  <span><Icon name="user" size={11} /> {rec.by}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function LitigationRegistryPage({ onToast }) {
  const audit = React.useContext(AuditContext);
  const [cases, setCases] = useState(() => window.litLoad());
  const [member, setMember] = useState(null);
  const [searchModal, setSearchModal] = useState(false);
  const [checked, setChecked] = useState([]);
  const [tab, setTab] = useState('detail');
  const [cancelModal, setCancelModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [error, setError] = useState('');

  // สัญญาที่กำลังบันทึก = สัญญาแรกที่ติ๊กเลือก
  const activeContract = checked[0] || null;

  const blankForm = (contractNo) => ({
    contractNo,
    receiveDate: litToday(), collectStatus: '', debtorClass: '', lastPayment: '',
    fileReason: '', sueBorrower: true, sueGuarantors: [],
    fileDate: '', court: '', lawyer: '', claimAmount: '', blackCaseNo: '',
    seizure: window.LIT_SEIZURE_TYPES[0], seizureDetail: '',
    judgmentType: '', verdictDate: '', caseReceiveDate: '', certFee: '', redCaseNo: '', judgmentResult: '',
    note: '', enforceDate: '', executor: '', caseStatus: 'รอดำเนินการ',
  });
  const caseToForm = (c) => ({ ...blankForm(c.contractNo), ...c });

  const [form, setForm] = useState(() => blankForm(null));

  // โหลดข้อมูลคดีของสัญญาที่ active เข้าฟอร์ม
  const loadCaseFor = (contractNo) => {
    if (!contractNo) return;
    const c = window.litFindCase(cases, member && member.code, contractNo);
    setForm(c ? caseToForm(c) : blankForm(contractNo));
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  // ── เลือกสมาชิกใหม่ ──
  const pickMember = (m) => {
    setMember(m); setSearchModal(false); setError('');
    const firstSel = (m.contracts || []).find(c => (window.LIT_CONTRACT_STATUS[c.status] || {}).selectable);
    const sel = firstSel ? [firstSel.no] : [];
    setChecked(sel);
    if (sel[0]) {
      const c = window.litFindCase(cases, m.code, sel[0]);
      setForm(c ? caseToForm(c) : blankForm(sel[0]));
    } else setForm(blankForm(null));
  };

  // ── ติ๊ก/ยกเลิกสัญญา ──
  const toggleContract = (c) => {
    const st = window.LIT_CONTRACT_STATUS[c.status] || {};
    if (!st.selectable) return;
    setError('');
    setChecked(prev => {
      const exists = prev.includes(c.no);
      const next = exists ? prev.filter(x => x !== c.no) : [...prev, c.no];
      // เปลี่ยนสัญญาที่ active → โหลดฟอร์มของสัญญาแรกใหม่
      const nextActive = next[0] || null;
      if (nextActive !== activeContract) {
        setTimeout(() => loadCaseFor(nextActive), 0);
      }
      return next;
    });
  };

  const checkedHasCase = checked.filter(no => window.litFindCase(cases, member && member.code, no));

  // ── Validation ──
  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก/ลูกหนี้ก่อนทำรายการ';
    if (checked.length === 0) return 'กรุณาเลือกสัญญาอย่างน้อย 1 รายการก่อนบันทึกข้อมูลฟ้องคดี';
    if (!form.receiveDate) return 'กรุณาระบุวันที่รับเรื่อง';
    if (form.receiveDate > litToday()) return 'วันที่รับเรื่องต้องไม่เกินวันที่ปัจจุบัน';
    if (form.fileDate && form.fileDate < form.receiveDate) return 'วันที่ฟ้องต้องไม่ก่อนวันที่รับเรื่อง';
    if (form.verdictDate && form.fileDate && form.verdictDate < form.fileDate) return 'วันที่ตัดสินต้องไม่ก่อนวันที่ฟ้อง';
    if (form.caseReceiveDate && form.verdictDate && form.caseReceiveDate < form.verdictDate) return 'วันที่รับสำนวนต้องไม่ก่อนวันที่ตัดสิน';
    if (form.enforceDate && form.verdictDate && form.enforceDate < form.verdictDate) return 'วันที่บังคับคดีต้องไม่ก่อนวันที่ตัดสิน';
    if (form.fileDate && !(Number(form.claimAmount) > 0)) return 'ทุนทรัพย์ฟ้องต้องเป็นตัวเลขมากกว่า 0';
    // เลขคดีดำ/แดง ไม่ซ้ำในศาลเดียวกัน
    const dupBlack = cases.find(c => c.blackCaseNo && c.blackCaseNo === form.blackCaseNo && c.court === form.court && c.contractNo !== form.contractNo);
    if (form.blackCaseNo && dupBlack) return `เลขคดีดำ ${form.blackCaseNo} ซ้ำกับคดีอื่นในศาลเดียวกัน`;
    const dupRed = cases.find(c => c.redCaseNo && c.redCaseNo === form.redCaseNo && c.court === form.court && c.contractNo !== form.contractNo);
    if (form.redCaseNo && dupRed) return `เลขคดีแดง ${form.redCaseNo} ซ้ำกับคดีอื่นในศาลเดียวกัน`;
    const seizeNeedsDetail = form.seizure && form.seizure !== 'ไม่มีการยึดทรัพย์';
    if (seizeNeedsDetail && !form.seizureDetail.trim()) return 'เมื่อเลือกการยึดทรัพย์ ต้องระบุรายละเอียดการยึดทรัพย์';
    return '';
  };

  const save = () => {
    const err = validate();
    if (err) { setError(err); return; }
    const activeC = (member && member.contracts || []).find(c => c.no === activeContract);
    const claim = window.litClaimTotal(activeC);
    const suedPersons = window.litPersonGuarantors(activeC).filter(g => (form.sueGuarantors || []).includes(g.id));
    const rec = {
      ...form,
      id: form.id || `LG-${new Date().getFullYear() + 543}-${form.contractNo.replace(/\D/g, '').slice(-6)}`,
      memberCode: member.code, contractNo: activeContract,
      claimAmount: Number(form.claimAmount) || claim, certFee: Number(form.certFee) || 0,
      lastPayment: Number(form.lastPayment) || 0,
      cancelled: form.cancelled || null,
      enteredBy: form.enteredBy || window.LIT_USER,
      enteredAt: form.enteredAt || new Date().toISOString().slice(0, 19),
    };
    setCases(prev => {
      const idx = prev.findIndex(c => c.memberCode === rec.memberCode && c.contractNo === rec.contractNo);
      const next = idx >= 0 ? prev.map((c, i) => i === idx ? rec : c) : [...prev, rec];
      window.litSaveLS(next);
      return next;
    });
    const defList = [member.name + ' (ผู้กู้)', ...suedPersons.map(g => g.name + ' (ผู้ค้ำ)')];
    audit && audit.log && audit.log({
      action: 'update', module: 'ดำเนินคดี — ทะเบียนสัญญาฟ้องคดี',
      target: `${member.code} · ${member.name} · ${activeContract}`,
      summary: `บันทึกข้อมูลจะฟ้อง ${defList.length} ราย: ${defList.join(', ')}`,
    });
    onToast && onToast(`บันทึกข้อมูลการฟ้องสัญญา ${activeContract} — จะฟ้อง ${defList.length} ราย (ผู้กู้${suedPersons.length ? ' + ผู้ค้ำ ' + suedPersons.length + ' ราย' : ''})`);
  };

  const confirmCancel = ({ reason, date }) => {
    const targets = checkedHasCase.length ? checkedHasCase : checked;
    setCases(prev => {
      const next = prev.map(c => (c.memberCode === (member && member.code) && targets.includes(c.contractNo))
        ? { ...c, cancelled: { reason, date, by: window.LIT_USER }, caseStatus: 'ยกเลิกคดี' } : c);
      window.litSaveLS(next);
      return next;
    });
    // อัปเดตสถานะสัญญาในหน้าจอ
    if (member) {
      member.contracts.forEach(c => { if (targets.includes(c.no)) c.status = 'ยกเลิกคดี'; });
    }
    setForm(f => ({ ...f, caseStatus: 'ยกเลิกคดี', cancelled: { reason, date, by: window.LIT_USER } }));
    setCancelModal(false);
    audit && audit.log && audit.log({
      action: 'cancel', module: 'ดำเนินคดี — ทะเบียนสัญญาฟ้องคดี',
      target: `${member.code} · ${targets.join(', ')}`,
      summary: `ยกเลิกคดีฟ้อง — เหตุผล: ${reason}`,
    });
    onToast && onToast('ยกเลิกคดีฟ้องเรียบร้อย — บันทึกเป็นประวัติแล้ว');
  };

  const resetForm = () => {
    loadCaseFor(activeContract);
    setError('');
    onToast && onToast('ล้างข้อมูลในแบบฟอร์มแล้ว');
  };
  const closeScreen = () => {
    setMember(null); setChecked([]); setForm(blankForm(null)); setError('');
  };

  const contracts = (member && member.contracts) || [];
  const activeHasVerdict = !!form.verdictDate;
  const sysDate = fmt.date(litToday());

  return (
    <div data-screen-label="ทะเบียนสัญญาฟ้องคดี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>ทะเบียนสัญญาฟ้องคดี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกและติดตามงานฟ้องคดี · ค้นหาลูกหนี้ เลือกสัญญา และบันทึกข้อมูลคดี ศาล คำพิพากษา และการบังคับคดี
          </div>
        </div>
        <span className="spacer" />
        <span className="lg-sysdate"><Icon name="calendar" size={13} /> วันที่ระบบ <b>{sysDate}</b></span>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ข้อมูลสมาชิก ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
          {member && (
            <div className="head-actions">
              <span className={'pill ' + (member.status === 'พ้นสภาพ' || member.status === 'ลาออก' ? 'warn' : member.status === 'เสียชีวิต' ? 'bad' : 'ok')}>
                สถานะสมาชิก: {member.status}
              </span>
            </div>
          )}
        </div>
        <div className="lg-mem-grid">
          <LgField label="รหัสสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <MemberSearchField member={member} onPick={pickMember}
                               source={window.LIT_MEMBERS} searchFn={window.litSearchMembers}
                               title="ค้นหาสมาชิก / ลูกหนี้ที่ต้องการฟ้องคดี"
                               placeholder="คลิกเพื่อค้นหาเลขสมาชิก / ชื่อ…" />
          </LgField>
          <LgField label="ชื่อ - นามสกุล">
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </LgField>
          <LgField label="เลขบัตร ปชช.">
            <input className="cfg-input mono sr-auto" value={member ? member.citizenId : ''} readOnly placeholder="—" />
          </LgField>
          <LgField label="อายุ">
            <input className="cfg-input sr-auto" value={member ? window.litAge(member.birthDate) + ' ปี' : ''} readOnly placeholder="—" />
          </LgField>
          <LgField label="ที่อยู่" span={3}>
            <input className="cfg-input sr-auto" value={member ? member.address : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </LgField>
          <LgField label="จังหวัด">
            <input className="cfg-input sr-auto" value={member ? member.province : ''} readOnly placeholder="—" />
          </LgField>
          <LgField label="ไปรษณีย์">
            <input className="cfg-input mono sr-auto" value={member ? member.postal : ''} readOnly placeholder="—" />
          </LgField>
          <LgField label="โทรศัพท์ (มือถือ)">
            <input className="cfg-input mono sr-auto" value={member ? member.mobile : ''} readOnly placeholder="—" />
          </LgField>
          <LgField label="วันที่พ้นสภาพ" hint="(หากมี)">
            <input className="cfg-input mono sr-auto" value={member && member.expireDate ? fmt.date(member.expireDate) : ''} readOnly placeholder="—" />
          </LgField>
        </div>
      </div>

      {/* ── รายการสัญญา ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการสัญญา</h3>
          <div className="head-actions">
            <button className="btn primary sm" onClick={() => setReportModal(true)}>
              <Icon name="report" size={13} /> ออกรายงาน
            </button>
            <button className="btn danger sm" disabled={checked.length === 0}
                    onClick={() => { if (!member) { setError('กรุณาเลือกสมาชิกก่อน'); return; } setCancelModal(true); }}>
              <Icon name="close" size={13} /> ยกเลิกคดีฟ้อง
            </button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lg-contract-tbl">
            <thead>
              <tr>
                <th style={{ width: 48 }} className="center">เลือก</th>
                <th>สัญญา</th>
                <th className="center">สถานะสัญญา</th>
                <th className="num">จำนวนเงินกู้</th>
                <th className="center">เริ่มสัญญา</th>
                <th className="num">ชำระ/งวด</th>
                <th className="center">งวดทั้งหมด</th>
                <th className="center">รับชำระล่าสุด<br /><span className="lg-th-sub">(งวด)</span></th>
                <th className="center">รับชำระล่าสุด<br /><span className="lg-th-sub">(วันที่)</span></th>
                <th className="num">คงเหลือ</th>
                <th className="num">ดอกเบี้ยค้าง</th>
                <th className="num">ดอกเบี้ยเกิน</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr><td colSpan="12" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  เลือกสมาชิกเพื่อแสดงรายการสัญญาเงินกู้
                </td></tr>
              ) : contracts.map(c => {
                const st = window.LIT_CONTRACT_STATUS[c.status] || { chip: 'neutral', selectable: true };
                const isChecked = checked.includes(c.no);
                const isActive = c.no === activeContract;
                return (
                  <tr key={c.no} className={(isActive ? 'selected ' : '') + (st.selectable ? 'clickable' : 'lg-row-locked')}
                      onClick={() => st.selectable && toggleContract(c)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="ch-box" checked={isChecked}
                             disabled={!st.selectable} onChange={() => toggleContract(c)} />
                    </td>
                    <td className="mono">{c.no}</td>
                    <td className="center">
                      <span className={'chip ' + st.chip} title={st.note || ''}>{c.status}</span>
                    </td>
                    <td className="num mono">{fmt.money(c.amount, 2)}</td>
                    <td className="center mono">{fmt.date(c.startDate)}</td>
                    <td className="num mono">{fmt.money(c.perInstallment, 2)}</td>
                    <td className="center mono">{c.totalTerms}</td>
                    <td className="center mono">{c.lastTerm}</td>
                    <td className="center mono">{fmt.date(c.lastPayDate)}</td>
                    <td className="num mono">{fmt.money(c.remaining, 2)}</td>
                    <td className="num mono">{fmt.money(c.interestDue, 2)}</td>
                    <td className="num mono">{fmt.money(c.interestOver, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <div className="lg-pager">
          <span className="muted">แสดง 1 ถึง {contracts.length} จาก {contracts.length} รายการ</span>
          <div className="lg-pager-right">
            <select className="cfg-input sm" defaultValue="10" style={{ width: 130 }}>
              <option value="10">10 รายการ/หน้า</option>
              <option value="20">20 รายการ/หน้า</option>
              <option value="50">50 รายการ/หน้า</option>
            </select>
            <div className="lg-pages">
              <button className="lg-page-btn" disabled><Icon name="chevLeft" size={13} /></button>
              <button className="lg-page-btn active">1</button>
              <button className="lg-page-btn" disabled><Icon name="chevRight" size={13} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── รายละเอียดการฟ้อง ── */}
      <div className="tabs-container" style={{ marginTop: 12 }}>
        <div className="tabs-bar">
          <button className="tab active">รายละเอียดงานฟ้องคดี</button>
        </div>
        <div className="tab-panel">
          {!activeContract ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div style={{ marginBottom: 6 }}><Icon name="receipt" size={24} /></div>
              เลือกสัญญาในตารางด้านบนเพื่อบันทึก/แก้ไขข้อมูลฟ้องคดี
            </div>
          ) : (
            <LgDetailForm form={form} set={set} activeContract={activeContract} multi={checked.length > 1}
                          contract={(contracts).find(c => c.no === activeContract)} member={member} />
          )}
        </div>
      </div>

      {/* ── แถบปุ่มล่าง ── */}
      <div className="lg-footer">
        <button className="btn primary lg" onClick={save} disabled={!member}><Icon name="check" /> บันทึก</button>
        <button className="btn lg" onClick={resetForm} disabled={!activeContract}><Icon name="refresh" /> ล้างข้อมูล</button>
        <button className="btn lg" onClick={closeScreen}><Icon name="close" /> ปิดหน้าจอ</button>
      </div>

      {searchModal && <LgMemberSearchModal onPick={pickMember} onClose={() => setSearchModal(false)} />}
      {cancelModal && (
        <LgCancelModal contracts={checked} hasVerdict={checkedHasCase.length > 0 && activeHasVerdict}
                       onConfirm={confirmCancel} onClose={() => setCancelModal(false)} />
      )}
      {reportModal && (
        <LgReportModal onClose={() => setReportModal(false)}
                       onPick={(label) => { setReportModal(false); onToast && onToast(`กำลังจัดเตรียม “${label}”`); }} />
      )}
    </div>
  );
}

// ─── แท็บ "รายละเอียดงานฟ้องคดี" — บันทึกว่าจะฟ้องใครบ้าง (ก่อนส่งฝ่ายกฎหมาย) ──
function LgDetailForm({ form, set, activeContract, multi, contract, member }) {
  const persons = window.litPersonGuarantors(contract);
  const securities = window.litSecurities(contract);
  const claimTotal = window.litClaimTotal(contract);
  const sued = form.sueGuarantors || [];

  const toggleGuar = (id) => {
    const next = sued.includes(id) ? sued.filter(x => x !== id) : [...sued, id];
    set('sueGuarantors', next);
  };

  // ลำดับจำเลย: จำเลยที่ 1 = ผู้กู้ · ผู้ค้ำที่ติ๊ก = จำเลยถัดไป (ตามลำดับในรายการ)
  const defendantNo = (id) => {
    let n = 2;
    for (const p of persons) { if (sued.includes(p.id)) { if (p.id === id) return n; n++; } }
    return null;
  };
  const totalDefendants = 1 + persons.filter(p => sued.includes(p.id)).length;

  return (
    <div className="lg-editor">
      {/* A. ข้อมูลการฟ้อง */}
      <div className="search-card lg-section">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="lg-sec-no">A</span>
          <h3>ข้อมูลการฟ้อง <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>(ข้อมูลทั่วไปก่อนส่งฝ่ายกฎหมาย)</span></h3>
          <div className="head-actions">
            <span className="chip info sm mono">สัญญา {activeContract}</span>
            {multi && <span className="chip warning sm">เลือกหลายสัญญา — บันทึกทีละสัญญา</span>}
          </div>
        </div>
        <div className="lg-grid-a">
          <LgField label="วันที่รับเรื่อง" required>
            <ErpDate value={form.receiveDate || ''} onChange={(v) => ((e) => set('receiveDate', e.target.value))({ target: { value: v } })} max={litToday()} className="cfg-input" />
          </LgField>
          <LgField label="สถานะเรียกเก็บ">
            <select className="cfg-input" value={form.collectStatus} onChange={(e) => set('collectStatus', e.target.value)}>
              <option value="">— เลือก —</option>
              {window.LIT_COLLECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </LgField>
          <LgField label="ชั้นลูกหนี้">
            <select className="cfg-input" value={form.debtorClass} onChange={(e) => set('debtorClass', Number(e.target.value) || '')}>
              <option value="">— เลือก —</option>
              {window.LIT_DEBTOR_CLASS.map(d => <option key={d.v} value={d.v}>{d.l}</option>)}
            </select>
          </LgField>
          <LgField label="เงินชำระล่าสุด" hint="(บาท)">
            <input className="cfg-input mono num-input" inputMode="decimal" value={form.lastPayment}
                   onChange={(e) => set('lastPayment', e.target.value)} placeholder="0.00" />
          </LgField>
        </div>

        {/* มูลหนี้ที่จะฟ้อง (คำนวณจากสัญญา) */}
        <div className="lg-claim-strip">
          <div className="lg-claim-item">
            <span className="lg-claim-k">เงินต้นคงเหลือ</span>
            <span className="lg-claim-v mono">{fmt.money(contract ? contract.remaining : 0, 2)}</span>
          </div>
          <span className="lg-claim-op">+</span>
          <div className="lg-claim-item">
            <span className="lg-claim-k">ดอกเบี้ยค้าง</span>
            <span className="lg-claim-v mono">{fmt.money(contract ? contract.interestDue : 0, 2)}</span>
          </div>
          <span className="lg-claim-op">+</span>
          <div className="lg-claim-item">
            <span className="lg-claim-k">ดอกเบี้ยเกิน</span>
            <span className="lg-claim-v mono">{fmt.money(contract ? contract.interestOver : 0, 2)}</span>
          </div>
          <span className="lg-claim-op">=</span>
          <div className="lg-claim-item total">
            <span className="lg-claim-k">มูลหนี้ที่จะฟ้อง (โดยประมาณ)</span>
            <span className="lg-claim-v mono">{fmt.money(claimTotal, 2)} บาท</span>
          </div>
        </div>

        <LgField label="เหตุผล / หมายเหตุการส่งฟ้อง" hint="(ข้อมูลประกอบสำหรับฝ่ายกฎหมาย)">
          <textarea className="cfg-input" rows={2} value={form.fileReason}
                    onChange={(e) => set('fileReason', e.target.value)}
                    placeholder="เช่น ผิดนัดชำระเกินกำหนด ติดตามแล้วไม่ชำระ — เสนอฟ้องผู้กู้และผู้ค้ำประกัน" />
        </LgField>
      </div>

      {/* B. ผู้ที่จะถูกฟ้อง + รายละเอียดการค้ำประกัน */}
      <div className="search-card lg-section">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="lg-sec-no">B</span>
          <h3>ผู้ที่จะถูกฟ้อง <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>(จำเลย) และรายละเอียดการค้ำประกัน</span></h3>
          <div className="head-actions">
            <span className="chip primary sm">ฟ้องรวม {totalDefendants} ราย</span>
          </div>
        </div>

        {/* ผู้ถูกฟ้อง */}
        <div className="lg-def-sub">ผู้ถูกฟ้อง</div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lg-def-tbl">
            <thead>
              <tr>
                <th style={{ width: 56 }} className="center">ฟ้อง</th>
                <th style={{ width: 92 }} className="center">ลำดับจำเลย</th>
                <th>ชื่อ - นามสกุล</th>
                <th className="center">ฐานะ</th>
                <th>เลขบัตรประชาชน</th>
                <th className="center">สังกัด / สถานะ</th>
                <th className="num">วงเงินรับผิด</th>
              </tr>
            </thead>
            <tbody>
              {/* จำเลยที่ 1 = ผู้กู้ (ฟ้องเสมอ) */}
              <tr className="lg-def-borrower">
                <td className="center"><input type="checkbox" className="ch-box" checked disabled title="ผู้กู้ต้องถูกฟ้องเสมอ" /></td>
                <td className="center"><span className="lg-def-badge">จำเลยที่ 1</span></td>
                <td>{member ? member.name : '—'}</td>
                <td className="center"><span className="chip info sm">ผู้กู้</span></td>
                <td className="mono">{member ? member.citizenId : '—'}</td>
                <td className="center">{member ? member.status : '—'}</td>
                <td className="num mono">{fmt.money(claimTotal, 2)}</td>
              </tr>
              {/* ผู้ค้ำประกัน (บุคคล) — เลือกฟ้องได้ */}
              {persons.map(g => {
                const on = sued.includes(g.id);
                const no = defendantNo(g.id);
                return (
                  <tr key={g.id} className={on ? 'lg-def-on' : ''}>
                    <td className="center">
                      <input type="checkbox" className="ch-box" checked={on} onChange={() => toggleGuar(g.id)} />
                    </td>
                    <td className="center">{no ? <span className="lg-def-badge">จำเลยที่ {no}</span> : <span className="muted">—</span>}</td>
                    <td>{g.name}</td>
                    <td className="center"><span className="chip sm">ผู้ค้ำประกัน</span></td>
                    <td className="mono">{g.citizenId}</td>
                    <td className="center">{g.dept ? `${g.dept} · ` : ''}{g.status || '—'}</td>
                    <td className="num mono">{fmt.money(g.guaranteeAmount, 2)}</td>
                  </tr>
                );
              })}
              {persons.length === 0 && (
                <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: '10px 0' }}>
                  สัญญานี้ไม่มีผู้ค้ำประกันเป็นบุคคล
                </td></tr>
              )}
            </tbody>
          </table>
        </div></div>
        <div className="lg-def-hint">
          <Icon name="info" size={13} />
          <span>ผู้กู้ถูกกำหนดเป็นจำเลยที่ 1 เสมอ · ติ๊กเลือกผู้ค้ำประกันที่ต้องการฟ้องร่วม ระบบจะจัดลำดับจำเลยให้อัตโนมัติ</span>
        </div>

        {/* หลักประกัน (สืบทรัพย์/บังคับคดี — ไม่ใช่จำเลย) */}
        <div className="lg-def-sub" style={{ marginTop: 18 }}>หลักประกัน / หลักทรัพย์ค้ำประกัน</div>
        {securities.length ? (
          <div className="lg-sec-list">
            {securities.map(s => (
              <div key={s.id} className="lg-sec-item">
                <span className="lg-sec-ico"><Icon name="bank" size={15} /></span>
                <div className="lg-sec-body">
                  <div className="lg-sec-type">{s.assetType}</div>
                  <div className="lg-sec-detail muted">{s.detail}</div>
                </div>
                <div className="lg-sec-appr">
                  <span className="muted">ราคาประเมิน</span>
                  <span className="mono">{fmt.money(s.appraisal, 2)}</span>
                </div>
              </div>
            ))}
            <div className="lg-def-hint">
              <Icon name="info" size={13} />
              <span>หลักประกันไม่ถือเป็นจำเลย — ใช้เป็นข้อมูลประกอบการสืบทรัพย์และบังคับคดีของฝ่ายกฎหมาย</span>
            </div>
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 12.5, padding: '4px 2px' }}>ไม่มีหลักทรัพย์ค้ำประกันในสัญญานี้</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LitigationRegistryPage, LgField, LgWorkflow, litToday });
