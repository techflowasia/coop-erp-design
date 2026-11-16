// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — งานยกเลิก (แบบฟอร์ม)
//  ① ยกเลิกลาออก (CancelResignPage)
//     ค้นหาสมาชิกที่อยู่ในสถานะ "ลาออก" → ดึงวันที่ลาออก/ผู้ทำรายการ →
//     เลือกสาเหตุการยกเลิก + ระบุเหตุผล → ยืนยัน → คืนสถานะเป็น "ปกติ"
//  ② ยกเลิกคำขอกู้เงิน ฉ.โอน (CancelEmRequestPage)
//     ค้นหาสมาชิก → ดึงใบคำขอกู้ฉุกเฉินหักโอนที่รอดำเนินการ →
//     ตรวจแผนจ่ายรายเดือน + ผู้ค้ำ → ระบุสาเหตุยกเลิก → ยืนยัน
//  ใช้รูปแบบกลาง: MemberSearchField · icr-*/src-* · DN_MEMBERS · fmt · audit
// ════════════════════════════════════════════════════════════════════

const cxToday = () => window.DEPOSIT_WORKING_DATE || '2026-07-24';
const cxBE = (iso) => { const d = new Date(iso); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + (d.getFullYear() + 543); };
const cxHash = (s) => { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0; return h; };
const cxMoney = (v) => window.fmt.money(v || 0, 2);
const CX_RESIGN_OPERATORS = ['สุภาพร ทองใบ', 'มนตรี ศรีสุข', 'อารีย์ พูนสุข'];
const CX_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const CX_RESIGN_REASONS = [
  'ลาออกโดยเข้าใจผิด / ผิดพลาด',
  'สมาชิกประสงค์คงสมาชิกภาพต่อ',
  'เอกสารลาออกไม่ครบถ้วน',
  'ยกเลิกตามมติคณะกรรมการ',
  'บันทึกลาออกซ้ำซ้อน',
  'อื่น ๆ',
];

function CxFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function CxRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  โมดัลยืนยัน (ใช้ร่วมกัน)
// ════════════════════════════════════════════════════════════════════
function CxConfirmModal({ title, member, lines, reason, confirmLabel, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const submit = () => { setBusy(true); setTimeout(() => { setBusy(false); onConfirm(); }, 360); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            <div className="muted" style={{ fontSize: 11 }}>สมาชิก <span className="mono">{member.code}</span> · {member.name}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>ระบบจะบันทึกผู้ทำรายการ วันเวลา และเหตุผล ลงใน Audit Log — โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน</span>
          </div>
          <div className="src-summary" style={{ marginBottom: 4 }}>
            {lines.map((l, i) => (
              <div className="src-sum-row" key={i}><span className="src-sum-l">{l.l}</span><span className={'src-sum-v' + (l.mono ? ' mono' : '')}>{l.v}</span></div>
            ))}
          </div>
          <div className="src-confirm-reason">
            <span className="src-confirm-reason-l">เหตุผลการยกเลิก</span>
            <span className="src-confirm-reason-v">{reason}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ย้อนกลับ</button>
            <button type="button" className="btn danger" style={{ flex: 1, justifyContent: 'center' }} disabled={busy} onClick={submit}>
              {busy ? 'กำลังดำเนินการ...' : <><Icon name="check" /> {confirmLabel || 'ยืนยันการยกเลิก'}</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ① ยกเลิกลาออก
// ════════════════════════════════════════════════════════════════════
function CancelResignScreen({ onToast, audit }) {
  const [member, setMember] = useState(null);
  const [reasonType, setReasonType] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);   // เลือกสมาชิกที่ไม่ได้ลาออก
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // ข้อมูลการลาออก (derive) — เฉพาะสมาชิกสถานะ "ลาออก"
  const resignInfo = React.useMemo(() => {
    if (!member || member.status !== 'ลาออก') return null;
    const h = cxHash(member.code);
    const days = 15 + (h % 120);
    const t = new Date(cxToday()); t.setDate(t.getDate() - days);
    return { date: t.toISOString().slice(0, 10), operator: CX_RESIGN_OPERATORS[h % CX_RESIGN_OPERATORS.length] };
  }, [member]);

  const pickMember = (m) => {
    setMember(m); setReason(''); setReasonType(''); setDone(false);
    if (m.status !== 'ลาออก') { setBlocked(true); setError(`สมาชิก ${m.code} · ${m.name} อยู่ในสถานะ "${m.status}" — ไม่สามารถยกเลิกการลาออกได้`); }
    else { setBlocked(false); setError(''); }
  };
  const clearScreen = () => { setMember(null); setReason(''); setReasonType(''); setError(''); setBlocked(false); setDone(false); };

  const openConfirm = () => {
    if (!member) { setError('กรุณาค้นหาและเลือกสมาชิกก่อน'); return; }
    if (blocked || !resignInfo) { setError('สมาชิกรายนี้ไม่ได้อยู่ในสถานะลาออก — ไม่สามารถยกเลิกการลาออกได้'); return; }
    if (!reasonType) { setError('กรุณาเลือกสาเหตุการยกเลิก'); return; }
    if (reason.trim().length < 10) { setError('กรุณาระบุเหตุผลการยกเลิกลาออก (อย่างน้อย 10 ตัวอักษร)'); return; }
    setError(''); setConfirm(true);
  };
  const performCancel = () => {
    setConfirm(false); setDone(true);
    audit && audit.log && audit.log({
      action: 'update', module: 'สินเชื่อ — ยกเลิกลาออก',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกการลาออก · คืนสถานะสมาชิกเป็น "ปกติ" · ${reasonType}`,
      changes: [
        { field: 'สถานะสมาชิก', before: 'ลาออก', after: 'ปกติ' },
        { field: 'วันที่ลาออกเดิม', before: window.fmt.date(resignInfo.date), after: '—' },
        { field: 'สาเหตุการยกเลิก', before: '—', after: reasonType },
        { field: 'เหตุผล', before: '—', after: reason.trim() },
      ],
    });
    onToast && onToast(`ยกเลิกการลาออกของ ${member.name} เรียบร้อยแล้ว — คืนสถานะสมาชิกเป็น "ปกติ"`);
  };

  return (
    <div data-screen-label="ยกเลิกลาออก">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ยกเลิกการลาออก</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · งานยกเลิก — คืนสถานะสมาชิกที่บันทึกลาออกผิดพลาด หรือประสงค์คงสมาชิกภาพต่อ</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn danger sm" onClick={openConfirm} disabled={done}><Icon name="check" size={13} /> ยืนยันการยกเลิกลาออก</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {done && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} /><span>ยกเลิกการลาออกเรียบร้อยแล้ว — สถานะสมาชิกถูกคืนเป็น "ปกติ" และบันทึกประวัติไว้ตรวจสอบ</span>
        </div>
      )}

      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>การยกเลิกการลาออก</h3></div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <CxFld label="เลขสมาชิก" fill span={2} required>
            <MemberSearchField member={member} onPick={pickMember}
              source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
              title="ค้นหาสมาชิก — ยกเลิกการลาออก" changeLabel="เปลี่ยน"
              placeholder="เลขสมาชิก…" />
          </CxFld>
          <CxFld label="ชื่อ-นามสกุล" fill><CxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></CxFld>
          <CxFld label="สังกัด" fill><CxRO value={member ? (member.deptCode ? member.deptCode + ' - ' + member.dept : member.dept) : ''} placeholder="—" /></CxFld>
          <CxFld label="สถานะปัจจุบัน" fill><CxRO value={member ? member.status : ''} placeholder="—" /></CxFld>
          <CxFld label="วันที่ลาออก" fill><CxRO value={resignInfo ? window.fmt.date(resignInfo.date) : ''} mono placeholder="—" /></CxFld>
          <CxFld label="ผู้ทำรายการลาออก" fill><CxRO value={resignInfo ? resignInfo.operator : ''} placeholder="—" /></CxFld>
        </div>
      </div>

      <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
        <div className="section-head"><span className="head-bar" /><h3>สาเหตุและเหตุผลการยกเลิก</h3></div>
        <div className="icr-strip">
          <CxFld label="สาเหตุการยกเลิก" grow w={320} required>
            <select className="cfg-input" value={reasonType} disabled={!resignInfo}
              onChange={(e) => { setReasonType(e.target.value); setError(''); }}>
              <option value="">— เลือกสาเหตุการยกเลิก —</option>
              {CX_RESIGN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </CxFld>
        </div>
        <div style={{ marginTop: 14 }}>
          <span className="icr-fld-l" style={{ display: 'block', marginBottom: 6 }}>เหตุผลการยกเลิกลาออก <span className="cfg-required">*</span></span>
          <textarea className="cfg-input src-reason" rows={4} maxLength={500} disabled={!resignInfo}
            placeholder="ระบุเหตุผลการยกเลิกลาออกโดยละเอียด (อย่างน้อย 10 ตัวอักษร)"
            value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} />
          <div className="src-reason-count">{reason.length} / 500</div>
        </div>
      </div>

      {confirm && (
        <CxConfirmModal title="ยืนยันการยกเลิกการลาออก" member={member} reason={reason.trim()} confirmLabel="ยืนยัน คืนสถานะ"
          lines={[
            { l: 'สถานะเดิม', v: 'ลาออก' },
            { l: 'สถานะใหม่', v: 'ปกติ' },
            { l: 'วันที่ลาออกเดิม', v: window.fmt.date(resignInfo.date), mono: true },
            { l: 'สาเหตุการยกเลิก', v: reasonType },
          ]}
          onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ② ยกเลิกคำขอกู้เงิน ฉ.โอน
// ════════════════════════════════════════════════════════════════════
function cxEmRequestOf(member) {
  const h = cxHash('EMREQ' + member.code);
  if (h % 5 === 0) return null;                        // บางรายไม่มีคำขอค้าง
  const beYear = new Date(cxToday()).getFullYear() + 543;
  const amount = 20000 + (h % 40) * 5000;              // วงเงินขอกู้
  const startMonth = h % 12;                           // เดือนที่เริ่มต้น (0-11)
  const startDate = new Date(new Date(cxToday()).getFullYear(), startMonth, 1);
  // แผนจ่ายรายเดือน — ลงเฉพาะเดือนเริ่มต้น (ฉ.โอนจ่ายก้อนเดียว)
  const months = CX_MONTHS.map((m, i) => ({ month: m, amount: i === startMonth ? amount : 0 }));
  const guarantor = (member.debts || []).flatMap(d => d.guarantors || [])[0] || null;
  return {
    reqNo: `EMT-${beYear}-${String(10000 + (h % 89999)).padStart(5, '0')}`,
    loanType: 'ฉุกเฉินหักโอน',
    reqDate: cxToday(),
    contractNo: `S${String(667000000 + (h % 999999)).padStart(9, '0')}`,
    beYear, formType: '1 - จำนวนเงินเท่ากัน',
    amount, adjust: 0,
    startMonthName: CX_MONTHS[startMonth],
    startDate: startDate.toISOString().slice(0, 10),
    months,
    guarantorCode: guarantor ? guarantor.memberCode : '',
    guarantorName: guarantor ? guarantor.name : '',
  };
}

function CancelEmRequestScreen({ onToast, audit }) {
  const [member, setMember] = useState(null);
  const [req, setReq] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const pickMember = (m) => {
    const r = cxEmRequestOf(m);
    setMember(m); setReq(r); setReason(''); setDone(false);
    setNotFound(!r); setError('');
  };
  const clearScreen = () => { setMember(null); setReq(null); setReason(''); setError(''); setNotFound(false); setDone(false); };

  const openConfirm = () => {
    if (!member) { setError('กรุณาค้นหาและเลือกสมาชิกก่อน'); return; }
    if (!req) { setError('ไม่พบใบคำขอกู้ ฉ.โอน ที่รอดำเนินการของสมาชิกรายนี้'); return; }
    if (reason.trim().length < 10) { setError('กรุณาระบุสาเหตุการยกเลิก (อย่างน้อย 10 ตัวอักษร)'); return; }
    setError(''); setConfirm(true);
  };
  const performCancel = () => {
    setConfirm(false); setDone(true);
    audit && audit.log && audit.log({
      action: 'delete', module: 'สินเชื่อ — ยกเลิกคำขอกู้เงิน ฉ.โอน',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกใบคำขอกู้ ${req.reqNo} · ${req.loanType} · วงเงิน ${cxMoney(req.amount)} บาท`,
      changes: [
        { field: 'เลขที่ใบขอกู้', before: req.reqNo, after: 'ยกเลิกแล้ว' },
        { field: 'ประเภทเงินกู้', before: req.loanType, after: '—' },
        { field: 'วงเงินขอกู้', before: cxMoney(req.amount), after: '—' },
        { field: 'สาเหตุยกเลิก', before: '—', after: reason.trim() },
      ],
    });
    onToast && onToast(`ยกเลิกใบคำขอกู้ ฉ.โอน ${req.reqNo} (${member.name}) เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="ยกเลิกคำขอกู้เงิน ฉ.โอน">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ยกเลิกคำขอกู้เงิน ฉ.โอน</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · งานยกเลิก — ยกเลิกใบคำขอกู้ฉุกเฉินหักโอนที่ยังไม่ได้จ่ายเงิน</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn danger sm" onClick={openConfirm} disabled={done}><Icon name="close" size={13} /> ยกเลิกคำขอกู้</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
        </div>
      </div>

      {notFound && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> ไม่พบใบคำขอกู้ ฉ.โอน ที่รอดำเนินการของสมาชิกรายนี้</div>)}
      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {done && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} /><span>ยกเลิกใบคำขอกู้ ฉ.โอน เรียบร้อยแล้ว — คำขอถูกปิดและบันทึกประวัติไว้ตรวจสอบ</span>
        </div>
      )}

      {/* หัวใบคำขอ */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลใบคำขอกู้</h3></div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <CxFld label="เลขสมาชิก" fill span={2} required>
            <MemberSearchField member={member} onPick={pickMember}
              source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
              title="ค้นหาสมาชิก — ยกเลิกคำขอกู้เงิน ฉ.โอน" changeLabel="เปลี่ยน"
              placeholder="เลขสมาชิก…" />
          </CxFld>
          <CxFld label="เลขที่ใบขอกู้" fill>
            <div className="icr-ro icr-auto">{req ? req.reqNo : 'Auto'}</div>
          </CxFld>
          <CxFld label="ประเภทเงินกู้" fill><CxRO value={req ? req.loanType : 'ฉุกเฉินหักโอน'} /></CxFld>
          <CxFld label="วันที่ขอกู้" fill><CxRO value={req ? window.fmt.date(req.reqDate) : ''} mono placeholder="—" /></CxFld>
          <CxFld label="ชื่อ-นามสกุล" fill><CxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></CxFld>
          <CxFld label="สังกัด" fill><CxRO value={member ? (member.deptCode ? member.deptCode + ' - ' + member.dept : member.dept) : ''} placeholder="—" /></CxFld>
        </div>
        <div style={{ marginTop: 14 }}>
          <span className="icr-fld-l" style={{ display: 'block', marginBottom: 6 }}>สาเหตุยกเลิก <span className="cfg-required">*</span></span>
          <input className="cfg-input" disabled={!req} value={reason}
            placeholder="ระบุสาเหตุการยกเลิกใบคำขอกู้ (อย่างน้อย 10 ตัวอักษร)"
            onChange={(e) => { setReason(e.target.value); setError(''); }} />
        </div>
      </div>

      {/* การขอกู้ */}
      <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
        <div className="section-head"><span className="head-bar" /><h3>การขอกู้</h3></div>
        {!req ? (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            ค้นหาสมาชิกเพื่อแสดงรายละเอียดใบคำขอกู้ ฉ.โอน
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 16 }}>
              <CxFld label="เลขที่สัญญา" fill><CxRO value={req.contractNo} mono /></CxFld>
              <CxFld label="ปีบัญชี" fill><CxRO value={req.beYear} mono num /></CxFld>
              <CxFld label="เดือนที่เริ่มต้น" fill><CxRO value={`${req.startMonthName} · ${window.fmt.date(req.startDate)}`} /></CxFld>
              <CxFld label="รูปแบบขอกู้" fill span={2}><CxRO value={req.formType} /></CxFld>
              <CxFld label="ขอกู้ (บาท)" fill><CxRO value={cxMoney(req.amount)} mono num /></CxFld>
              <CxFld label="เพิ่ม/ลด (บาท)" fill><CxRO value={cxMoney(req.adjust)} mono num /></CxFld>
            </div>

            <div className="ldc-subhead">แผนการจ่ายเงินกู้รายเดือน · {req.beYear}</div>
            <div className="cx-month-grid">
              {req.months.map((m, i) => (
                <div key={i} className={'cx-month' + (m.amount > 0 ? ' on' : '')}>
                  <span className="cx-month-l">เงินกู้ {req.beYear} {m.month}</span>
                  <span className="cx-month-v mono">{cxMoney(m.amount)}</span>
                </div>
              ))}
            </div>

            <div className="icr-strip" style={{ marginTop: 16 }}>
              <CxFld label="เลขสมาชิกคนค้ำ" w={200}><CxRO value={req.guarantorCode} mono placeholder="— ไม่มีผู้ค้ำ —" /></CxFld>
              <CxFld label="ชื่อผู้ค้ำ" grow w={280}><CxRO value={req.guarantorName} placeholder="—" /></CxFld>
            </div>
          </>
        )}
      </div>

      {confirm && (
        <CxConfirmModal title="ยืนยันการยกเลิกใบคำขอกู้ ฉ.โอน" member={member} reason={reason.trim()} confirmLabel="ยืนยันยกเลิกคำขอ"
          lines={[
            { l: 'เลขที่ใบขอกู้', v: req.reqNo, mono: true },
            { l: 'ประเภทเงินกู้', v: req.loanType },
            { l: 'เลขที่สัญญา', v: req.contractNo, mono: true },
            { l: 'วงเงินขอกู้', v: cxMoney(req.amount) + ' บาท', mono: true },
          ]}
          onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

// ─── Page wrappers ──────────────────────────────────────────────────
function CancelResignPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb(window.crumb3('ยกเลิกลาออก', 'list'), []);
  return <CancelResignScreen onToast={onToast} audit={audit} />;
}
function CancelEmRequestPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb(window.crumb3('ยกเลิกคำขอกู้เงิน ฉ.โอน', 'list'), []);
  return <CancelEmRequestScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, {
  CancelResignPage, CancelEmRequestPage,
  CancelResignScreen, CancelEmRequestScreen,
});
