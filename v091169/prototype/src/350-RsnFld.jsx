// ════════════════════════════════════════════════════════════════════
//  บันทึกข้อมูลลาออก — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง (ไม่มีหมายเลขหัวข้อ):
//    • รายละเอียดคำร้องลาออก (ฟอร์ม + ค้นหาสมาชิก)
//    • การ์ดสรุป หุ้น / เงินฝาก / สัญญาเงินกู้ / การค้ำประกัน
//    • แถบตรวจสอบเงื่อนไขก่อนอนุมัติ
//    • แท็บรายละเอียด หุ้น / เงินฝาก / สัญญาเงินกู้ / การค้ำประกัน
//  ใช้สมาชิกจาก RSN_MEMBERS · MemberSearchField (รูปแบบกลาง)
// ════════════════════════════════════════════════════════════════════

// ─── ฟิลด์ (label เล็กด้านบน + control) ─────────────────────────────
function RsnFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 140 } : { width: w || 160 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว ──────────────────────────────────────────────
function RsnRO({ value, mono, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── การ์ดสรุปภาระผูกพัน ────────────────────────────────────────────
function RsnCard({ icon, tone, title, rows, active, onView, alert, locked }) {
  return (
    <div className={'rsn-card' + (active ? ' active' : '')}>
      <div className="rsn-card-head">
        <span className={'shc-stat-ico ' + tone}><Icon name={icon} size={18} /></span>
        <span className="rsn-card-title">{title}</span>
        {locked ? <span className="rsn-card-flag" title="ต้องยืนยันตัวตนก่อนดูข้อมูล"><Icon name="lock" size={13} /></span>
               : (alert && <span className="rsn-card-flag" title={alert}><Icon name="info" size={13} /></span>)}
      </div>
      <div className="rsn-card-rows">
        {rows.map((r, i) => (
          <div className="rsn-card-row" key={i}>
            <span className="rsn-card-k">{r.k}</span>
            <span className={'rsn-card-v' + (r.danger ? ' danger' : '') + (locked ? ' masked' : '')}>{r.v} <span className="rsn-card-u">{r.u}</span></span>
          </div>
        ))}
      </div>
      <button className={'rsn-card-foot' + (active ? ' on' : '')} onClick={onView}>
        {locked ? <><Icon name="lock" size={13} /> ยืนยันตัวตนเพื่อดู</> : <>ดูรายละเอียด <Icon name="chevRight" size={13} /></>}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function RsnFormScreen({ onToast, audit }) {
  const { useState } = React;
  const today = window.rsnToday();
  const fmt = window.fmt;

  const [member, setMember] = useState(null);
  const [reqDate, setReqDate] = useState(today);
  const [reason, setReason] = useState('voluntary');
  const [deathDate, setDeathDate] = useState('');
  const [resolution, setResolution] = useState('');
  const [workReason, setWorkReason] = useState('none');
  const [workDate, setWorkDate] = useState('');
  const [note, setNote] = useState('');
  const [approved, setApproved] = useState(false);
  const [approveDate, setApproveDate] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [tab, setTab] = useState('shares');
  const [error, setError] = useState('');
  const [depositAuth, setDepositAuth] = useState(null); // สิทธิ์เข้าถึงข้อมูลเงินฝาก (รีเซ็ตเมื่อเปลี่ยนสมาชิก)
  const [precheckOpen, setPrecheckOpen] = useState(true); // หุบ-ขยาย แถบตรวจสอบเงื่อนไข
  const [reqSent, setReqSent] = useState(false); // ส่งคำขอเข้าคิวอนุมัติแล้วหรือยัง

  const sum = window.rsnSummary(member);
  const statusV = approved ? 'approved' : 'pending';
  const status = window.rsnStatus(statusV);
  const locked = approved; // ล็อกข้อมูลสำคัญหลังอนุมัติ (ยกเว้นผู้มีสิทธิ์พิเศษ)

  // เงื่อนไขตรวจสอบก่อนอนุมัติ
  const checks = member ? [
    { ok: sum.loanOutstanding <= 0, danger: true,
      label: sum.loanOutstanding > 0
        ? `มีหนี้เงินกู้คงเหลือ ${fmt.money(sum.loanOutstanding, 2)} บาท — ต้องชำระ/หักกลบก่อนอนุมัติ`
        : 'ไม่มีหนี้เงินกู้คงเหลือ' },
    { ok: sum.guarCount === 0, danger: true,
      label: sum.guarCount > 0
        ? `ยังเป็นผู้ค้ำประกัน ${sum.guarCount} สัญญา (${fmt.money(sum.guarTotal, 2)} บาท) — ต้องเปลี่ยนตัวผู้ค้ำก่อน`
        : 'ไม่มีภาระค้ำประกันคงเหลือ' },
    { ok: sum.depositTotal <= 0,
      label: sum.depositTotal > 0
        ? `มีเงินฝากคงเหลือ ${fmt.money(sum.depositTotal, 2)} บาท ใน ${sum.depositCount} บัญชี — ดำเนินการปิดบัญชี/โอนคืน`
        : 'ไม่มีเงินฝากคงเหลือ' },
    { ok: reason !== 'death' || !!deathDate, danger: true,
      label: reason === 'death' && !deathDate
        ? 'ลาออกกรณีเสียชีวิต — ต้องระบุวันที่เสียชีวิต'
        : (reason === 'death' ? `บันทึกวันที่เสียชีวิต ${fmt.date(deathDate)} แล้ว` : 'ไม่ใช่กรณีเสียชีวิต') },
  ] : [];
  const blockers = checks.filter(c => c.danger && !c.ok).length;

  const pickMember = (m) => {
    setMember(m); setError('');
    setReason(m.status === 'เสียชีวิต' ? 'death' : 'voluntary');
    setDeathDate(m.deathDate || '');
    setWorkReason('none'); setWorkDate('');
    setResolution(''); setNote('');
    setApproved(false); setApproveDate(''); setSavedNo('');
    setDepositAuth(null); setReqSent(false);
    setTab('shares');
  };

  const clearScreen = () => {
    setMember(null); setReqDate(today); setReason('voluntary'); setDeathDate('');
    setResolution(''); setWorkReason('none'); setWorkDate(''); setNote('');
    setApproved(false); setApproveDate(''); setSavedNo(''); setError(''); setDepositAuth(null); setReqSent(false); setTab('shares');
  };

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนทำรายการ';
    if (!reqDate) return 'กรุณาระบุวันที่ขอลาออก';
    if (!reason) return 'กรุณาเลือกสาเหตุการลาออกก่อนบันทึก';
    if (reason === 'death' && !deathDate) return 'ลาออกกรณีเสียชีวิต — กรุณาระบุวันที่เสียชีวิต';
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); onToast && onToast(err); return; }
    setError('');
    const no = savedNo || window.rsnNextDocNo(window.rsnBeYear(reqDate));
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — บันทึกข้อมูลลาออก',
      target: `${member.code} · ${member.name}`,
      summary: `บันทึกคำร้องลาออก ${no} · สาเหตุ ${(window.RSN_REASONS.find(r => r.v === reason) || {}).l}`,
    });
    // ── ส่งคำร้องลาออกไปยังเมนู “อนุมัติใบคำขอ” ──
    let reqNote = '';
    if (!reqSent && window.dbaPush) {
      const rid = window.dbaNextReqNo(window.rsnBeYear(reqDate));
      window.dbaPush(buildResignReq(no, rid));
      setReqSent(true);
      reqNote = ' — ส่งไปที่เมนูอนุมัติใบคำขอแล้ว';
    }
    onToast && onToast(`บันทึกคำร้องลาออก ${no} · ${member.name} เรียบร้อยแล้ว${reqNote}`);
  };

  // ── สร้างเรกคอร์ดใบคำขอสำหรับคิวอนุมัติ (เมนูอนุมัติใบคำขอ) ──
  const buildResignReq = (no, rid) => {
    const reasonLabel = (window.RSN_REASONS.find(r => r.v === reason) || {}).l || '—';
    const workLabel = (window.RSN_WORK_REASONS.find(r => r.v === workReason) || {}).l || '—';
    const guarRows = (member.guarantees || []).map((g, i) => ([
      { v: String(i + 1), align: 'center' },
      { v: g.contractNo, mono: true },
      { v: g.debtorName },
      { v: fmt.money(g.outstanding, 2), align: 'num', mono: true },
      { v: fmt.money(g.guaranteed, 2), align: 'num', mono: true, bold: true },
    ]));
    return {
      id: rid, type: 'resign', docNo: no,
      memberCode: member.code, memberName: member.name, dept: `${member.dept} (${member.deptCode})`,
      contractNo: '', loanType: '', amount: sum ? sum.loanOutstanding : 0,
      requestedBy: window.RSN_USER, requestDate: reqDate,
      meetingRef: resolution || '—', priority: (sum && (sum.loanOutstanding > 0 || sum.guarCount > 0)) ? 'urgent' : 'normal',
      summary: `ลาออก (${reasonLabel}) · หุ้น ${fmt.money(sum ? sum.shareCapital : 0, 2)} · หนี้คงเหลือ ${fmt.money(sum ? sum.loanOutstanding : 0, 2)} · ค้ำ ${sum ? sum.guarCount : 0} สัญญา`,
      fields: [
        { k: 'สาเหตุลาออก', v: reasonLabel, hl: true },
        { k: 'ทุนเรือนหุ้น', v: `${fmt.money(sum ? sum.shareCapital : 0, 2)} บาท` },
        { k: 'หนี้เงินกู้คงเหลือ', v: `${fmt.money(sum ? sum.loanOutstanding : 0, 2)} บาท`, hl: sum && sum.loanOutstanding > 0 },
        { k: 'ภาระค้ำประกัน', v: `${sum ? sum.guarCount : 0} สัญญา (${fmt.money(sum ? sum.guarTotal : 0, 2)} บาท)` },
        { k: 'เงินฝากคงเหลือ', v: `${fmt.money(sum ? sum.depositTotal : 0, 2)} บาท` },
      ],
      detail: {
        title: 'คำร้องขอลาออกจากการเป็นสมาชิก', badge: 'ลาออก', badgeChip: 'warning',
        head: [
          { k: 'สมาชิก', v: `${member.name} (${member.code})` },
          { k: 'สาเหตุลาออก', v: reasonLabel },
          { k: 'หนี้เงินกู้คงเหลือ', v: `฿ ${fmt.money(sum ? sum.loanOutstanding : 0, 2)}`, danger: sum && sum.loanOutstanding > 0 },
          { k: 'สถานะสมาชิก', v: member.status, pill: (window.DN_MEMBER_STATUS[member.status] || {}).pill || 'neutral' },
        ],
        sections: [
          { kind: 'grid', title: 'ข้อมูลคำร้องลาออก', rows: [
            { k: 'ทะเบียนคำร้อง', v: rid, mono: true },
            { k: 'เลขที่คำร้อง', v: no, mono: true },
            { k: 'วันที่ขอลาออก', v: fmt.date(reqDate) },
            { k: 'สาเหตุลาออก', v: reasonLabel },
            { k: 'วันที่เสียชีวิต', v: reason === 'death' && deathDate ? fmt.date(deathDate) : '—' },
            { k: 'มติที่ประชุม', v: resolution || '—' },
            { k: 'สาเหตุลาออกจากงาน', v: workLabel },
            { k: 'วันที่ลาออกจากงาน', v: workDate ? fmt.date(workDate) : '—' },
          ] },
          { kind: 'grid', title: 'ภาระทางการเงินของสมาชิก', cols4: true, rows: [
            { k: 'ค่าหุ้น/เดือน', v: fmt.money(sum ? sum.shareMonthly : 0, 2), mono: true },
            { k: 'ทุนเรือนหุ้น', v: fmt.money(sum ? sum.shareCapital : 0, 2), mono: true },
            { k: 'เงินฝากรวม', v: fmt.money(sum ? sum.depositTotal : 0, 2), mono: true },
            { k: 'หนี้เงินกู้คงเหลือ', v: fmt.money(sum ? sum.loanOutstanding : 0, 2), mono: true },
          ] },
          ...(guarRows.length ? [{ kind: 'table', title: 'ภาระการค้ำประกันคงเหลือ',
            cols: [{ label: 'ลำดับ', align: 'center', w: 44 }, { label: 'เลขที่สัญญา' }, { label: 'ชื่อผู้กู้' }, { label: 'เงินคงเหลือ', align: 'num' }, { label: 'เงินที่ค้ำประกัน', align: 'num' }],
            rows: guarRows,
            foot: [{ v: 'รวม', colSpan: 4, align: 'right', bold: true }, { v: fmt.money(sum ? sum.guarTotal : 0, 2), align: 'num', mono: true, bold: true }] }] : []),
          ...(note ? [{ kind: 'note', title: 'หมายเหตุ', text: note }] : []),
        ],
      },
      status: 'pending',
    };
  };

  const doApprove = () => {
    if (approved) {
      const msg = 'คำร้องนี้ได้รับการอนุมัติแล้ว — ไม่สามารถอนุมัติซ้ำได้';
      setError(msg); onToast && onToast(msg); return;
    }
    const err = validate();
    if (err) { setError(err); onToast && onToast(err); return; }
    const apDate = approveDate || today;
    if (apDate < reqDate) {
      const msg = 'วันที่อนุมัติต้องไม่ก่อนวันที่ขอลาออก';
      setError(msg); onToast && onToast(msg); return;
    }
    if (blockers > 0) {
      const msg = 'ไม่สามารถอนุมัติได้ — ยังมีภาระผูกพันที่ต้องดำเนินการก่อน (ดูแถบตรวจสอบเงื่อนไข)';
      setError(msg); onToast && onToast(msg); return;
    }
    setError('');
    const no = savedNo || window.rsnNextDocNo(window.rsnBeYear(reqDate));
    setSavedNo(no);
    setApproved(true);
    setApproveDate(approveDate || today);
    onToast && onToast(`อนุมัติคำร้องลาออก ${no} · ${member.name} เรียบร้อยแล้ว`);
  };

  const doPrint = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบคำร้องลาออก…');
    setTimeout(() => window.print(), 80);
  };

  const TABS = [
    { id: 'shares',  label: 'รายละเอียดหุ้น',         count: member ? member.shares.length : null },
    { id: 'deposits',label: 'รายละเอียดเงินฝาก',      count: member ? member.deposits.length : null },
    { id: 'loans',   label: 'รายละเอียดสัญญาเงินกู้',  count: member ? member.loans.length : null },
    { id: 'guar',    label: 'รายละเอียดการค้ำประกัน',  count: member ? member.guarantees.length : null },
  ];

  return (
    <div data-screen-label="บันทึกข้อมูลลาออก">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="logout" size={20} /></span>
          <div>
            <h1>บันทึกข้อมูลลาออก</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · บันทึกคำร้องขอลาออกของสมาชิก พร้อมตรวจสอบภาระหุ้น เงินฝาก หนี้เงินกู้ และการค้ำประกันก่อนอนุมัติ</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={clearScreen}><Icon name="plus" size={13} /> เพิ่มใหม่</button>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn danger sm" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── รายละเอียดคำร้องลาออก ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายละเอียดคำร้องลาออก</h3></div>
        <div className="icr-strip">
          <RsnFld label="เลขที่คำร้อง" w={180}>
            {savedNo ? <RsnRO value={savedNo} mono /> : <div className="icr-ro icr-auto">Auto</div>}
          </RsnFld>
          <RsnFld label="วันที่ขอลาออก" w={160} required>
            <ErpDate value={reqDate} onChange={(v) => ((e) => setReqDate(e.target.value))({ target: { value: v } })} disabled={locked} className="cfg-input" />
          </RsnFld>
          <RsnFld label="สถานะใบคำร้อง" w={150}>
            <div className="icr-ro" style={{ padding: '0 8px' }}><span className={'pill ' + status.pill}>{status.l}</span></div>
          </RsnFld>
          <RsnFld label="การอนุมัติ" w={130}>
            <label className="rsn-approve-check">
              <input type="checkbox" className="ct-check" checked={approved} disabled={locked || !member}
                     onChange={(e) => { if (e.target.checked) doApprove(); }} />
              <span>อนุมัติแล้ว</span>
            </label>
          </RsnFld>
          <RsnFld label="วันที่อนุมัติ" w={160}>
            <ErpDate value={approveDate} onChange={(v) => ((e) => setApproveDate(e.target.value))({ target: { value: v } })} disabled={!approved || locked} className="cfg-input" />
          </RsnFld>
          <RsnFld label="สังกัด" grow w={200}><RsnRO value={member ? `${member.dept} (${member.deptCode})` : ''} placeholder="(ดึงอัตโนมัติ)" /></RsnFld>
        </div>

        <div className="icr-strip" style={{ marginTop: 14 }}>
          <RsnFld label="ทะเบียนสมาชิก" w={250} required>
            <MemberSearchField member={member} onPick={pickMember}
                               source={window.RSN_MEMBERS} searchFn={window.rsnSearchMembers}
                               title="ค้นหาสมาชิกที่ขอลาออก" placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />
          </RsnFld>
          <RsnFld label="ชื่อ - ชื่อสกุล" grow w={240}><RsnRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></RsnFld>
          <RsnFld label="สถานะสมาชิก" w={150}>
            {member
              ? <div className="icr-ro" style={{ padding: '0 8px' }}><span className={'pill ' + ((window.DN_MEMBER_STATUS[member.status] || {}).pill || 'neutral')}>{member.status}</span></div>
              : <RsnRO value="" />}
          </RsnFld>
        </div>

        <div className="icr-strip" style={{ marginTop: 14 }}>
          <RsnFld label="สาเหตุลาออก" grow w={240} required>
            <select className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)} disabled={!member || locked}>
              {window.RSN_REASONS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </RsnFld>
          <RsnFld label="วันที่เสียชีวิต" w={160}>
            <ErpDate value={deathDate} onChange={(v) => ((e) => setDeathDate(e.target.value))({ target: { value: v } })} disabled={reason !== 'death' || locked} className="cfg-input" />
          </RsnFld>
          <RsnFld label="มติที่ประชุม" grow w={220}>
            <input className="cfg-input" value={resolution} onChange={(e) => setResolution(e.target.value)} disabled={!member || locked} placeholder="เช่น มติที่ 7/2569 ลงวันที่ …" />
          </RsnFld>
        </div>

        <div className="icr-strip" style={{ marginTop: 14 }}>
          <RsnFld label="สาเหตุลาออกจากงาน" grow w={240}>
            <select className="cfg-input" value={workReason} onChange={(e) => setWorkReason(e.target.value)} disabled={!member || locked}>
              {window.RSN_WORK_REASONS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
            </select>
          </RsnFld>
          <RsnFld label="วันที่ลาออกจากงาน" w={160}>
            <ErpDate value={workDate} onChange={(v) => ((e) => setWorkDate(e.target.value))({ target: { value: v } })} disabled={!member || locked} className="cfg-input" />
          </RsnFld>
          <RsnFld label="หมายเหตุ" grow w={260}>
            <div className="icr-note-wrap">
              <textarea className="cfg-input" rows={1} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500}
                        disabled={!member || locked} placeholder="ระบุหมายเหตุ / รายละเอียดเพิ่มเติม (ถ้ามี)" />
              <span className="icr-note-count">{note.length}/500</span>
            </div>
          </RsnFld>
        </div>
      </div>

      {/* ── การ์ดสรุปภาระผูกพัน ── */}
      <div className="rsn-cards">
        <RsnCard icon="shares" tone="a-green" title="หุ้น" active={tab === 'shares'} onView={() => setTab('shares')}
                 rows={[
                   { k: 'ค่าหุ้น/เดือน', v: fmt.money(sum ? sum.shareMonthly : 0, 2), u: 'บาท' },
                   { k: 'ทุนเรือนหุ้น',  v: fmt.money(sum ? sum.shareCapital : 0, 2), u: 'บาท' },
                 ]} />
        <RsnCard icon="bank" tone="a-blue" title="เงินฝาก" active={tab === 'deposits'} onView={() => setTab('deposits')}
                 locked={member && !depositAuth}
                 alert={sum && sum.depositTotal > 0 ? 'มีเงินฝากคงเหลือ' : null}
                 rows={[
                   { k: 'บัญชีเงินฝาก', v: (member && !depositAuth) ? '••' : (sum ? sum.depositCount : 0), u: 'บัญชี' },
                   { k: 'เงินฝากรวม',   v: (member && !depositAuth) ? '••••••' : fmt.money(sum ? sum.depositTotal : 0, 2), u: 'บาท' },
                 ]} />
        <RsnCard icon="loans" tone="a-amber" title="สัญญาเงินกู้" active={tab === 'loans'} onView={() => setTab('loans')}
                 alert={sum && sum.loanOutstanding > 0 ? 'มีหนี้คงเหลือ' : null}
                 rows={[
                   { k: 'จำนวนสัญญา', v: sum ? sum.loanCount : 0, u: 'สัญญา' },
                   { k: 'หนี้คงเหลือ', v: fmt.money(sum ? sum.loanOutstanding : 0, 2), u: 'บาท', danger: sum && sum.loanOutstanding > 0 },
                 ]} />
        <RsnCard icon="shield" tone="a-violet" title="การค้ำประกัน" active={tab === 'guar'} onView={() => setTab('guar')}
                 alert={sum && sum.guarCount > 0 ? 'ยังเป็นผู้ค้ำประกัน' : null}
                 rows={[
                   { k: 'สัญญาค้ำ',  v: sum ? sum.guarCount : 0, u: 'สัญญา' },
                   { k: 'ค้ำทั้งสิ้น', v: fmt.money(sum ? sum.guarTotal : 0, 2), u: 'บาท', danger: sum && sum.guarCount > 0 },
                 ]} />
      </div>

      {/* ── แถบตรวจสอบเงื่อนไขก่อนอนุมัติ ── */}
      {member && (
        <div className={'rsn-precheck' + (blockers > 0 ? ' bad' : ' ok') + (precheckOpen ? '' : ' collapsed')}>
          <button type="button" className="rsn-precheck-head" onClick={() => setPrecheckOpen(v => !v)} aria-expanded={precheckOpen}>
            <Icon name={blockers > 0 ? 'info' : 'check'} size={15} />
            <span>{blockers > 0
              ? `ตรวจพบ ${blockers} เงื่อนไขที่ต้องดำเนินการก่อนอนุมัติการลาออก`
              : 'ผ่านเงื่อนไขการตรวจสอบ — สามารถพิจารณาอนุมัติการลาออกได้'}</span>
            <span className="spacer" />
            <span className={'rsn-precheck-chev' + (precheckOpen ? ' open' : '')}><Icon name="chevDown" size={15} /></span>
          </button>
          {precheckOpen && (
            <div className="rsn-precheck-list">
              {checks.map((c, i) => (
                <div className={'rsn-check' + (c.ok ? ' ok' : (c.danger ? ' bad' : ' warn'))} key={i}>
                  <Icon name={c.ok ? 'check' : 'info'} size={13} />
                  <span>{c.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── แท็บรายละเอียด ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tabs-bar">
          {TABS.map(t => (
            <button key={t.id} className={'tab' + (t.id === tab ? ' active' : '')} onClick={() => setTab(t.id)}>
              {t.label}{t.count != null && <span className="count">{t.count}</span>}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {!member ? (
            <div className="empty-state" style={{ padding: '36px 0' }}>
              <div style={{ marginBottom: 6 }}><Icon name="search" size={24} /></div>
              เลือกสมาชิกเพื่อแสดงรายละเอียด{TABS.find(t => t.id === tab).label.replace('รายละเอียด', '')}
            </div>
          ) : tab === 'shares' ? (
            <RsnSharesTable member={member} sum={sum} fmt={fmt} />
          ) : tab === 'deposits' ? (
            <DepositAccessGate member={member} auth={depositAuth} onAuth={setDepositAuth}>
              <RsnDepositsTable member={member} sum={sum} fmt={fmt} />
            </DepositAccessGate>
          ) : tab === 'loans' ? (
            <RsnLoansTable member={member} sum={sum} fmt={fmt} />
          ) : (
            <RsnGuarTable member={member} sum={sum} fmt={fmt} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ตาราง: รายละเอียดหุ้น ──────────────────────────────────────────
function RsnSharesTable({ member, sum, fmt }) {
  const rows = member.shares;
  return (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl">
        <thead><tr>
          <th className="center" style={{ width: 60 }}>ลำดับ</th>
          <th>ประเภทหุ้น</th>
          <th className="num">มูลค่า/หุ้น (บาท)</th>
          <th className="num">จำนวนหุ้น (หุ้น)</th>
          <th className="num">ทุนเรือนหุ้น (บาท)</th>
          <th className="num">ค่าหุ้น/เดือน (บาท)</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="6" className="empty-state">ไม่มีข้อมูลหุ้น</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i}>
              <td className="center mono">{i + 1}</td>
              <td>{r.type}</td>
              <td className="num mono">{fmt.money(r.valuePerShare, 2)}</td>
              <td className="num mono">{fmt.money(r.units, 0)}</td>
              <td className="num mono">{fmt.money(r.capital, 2)}</td>
              <td className="num mono">{fmt.money(r.monthly, 2)}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot><tr className="rsn-total-row">
            <td colSpan="3" className="rsn-total-label">รวมทั้งสิ้น</td>
            <td className="num mono">{fmt.money(sum.shareUnits, 0)}</td>
            <td className="num mono">{fmt.money(sum.shareCapital, 2)}</td>
            <td className="num mono">{fmt.money(sum.shareMonthly, 2)}</td>
          </tr></tfoot>
        )}
      </table>
    </div></div>
  );
}

// ─── ตาราง: รายละเอียดเงินฝาก ───────────────────────────────────────
function RsnDepositsTable({ member, sum, fmt }) {
  const rows = member.deposits;
  return (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl">
        <thead><tr>
          <th className="center" style={{ width: 64 }}>ลำดับ</th>
          <th>เลขที่บัญชี</th>
          <th>ชื่อบัญชี</th>
          <th className="num">จำนวนเงิน (บาท)</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="4" className="empty-state">ไม่มีบัญชีเงินฝาก</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i}>
              <td className="center mono">{i + 1}</td>
              <td className="mono">{r.accNo}</td>
              <td>{member.name}</td>
              <td className="num mono">{fmt.money(r.balance, 2)}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot><tr className="rsn-total-row">
            <td colSpan="3" className="rsn-total-label">รวม · {sum.depositCount} บัญชี</td>
            <td className="num mono">{fmt.money(sum.depositTotal, 2)}</td>
          </tr></tfoot>
        )}
      </table>
    </div></div>
  );
}

// ─── ตาราง: รายละเอียดสัญญาเงินกู้ ──────────────────────────────────
function RsnLoansTable({ member, sum, fmt }) {
  const rows = member.loans;
  const pill = (s) => s === 'ปกติ' ? 'ok' : s === 'ค้างชำระ' ? 'warn' : 'bad';
  return (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl">
        <thead><tr>
          <th className="center" style={{ width: 60 }}>ลำดับ</th>
          <th>เลขที่สัญญา</th>
          <th>ประเภทเงินกู้</th>
          <th className="center">วันที่ทำสัญญา</th>
          <th className="num">วงเงินอนุมัติ (บาท)</th>
          <th className="num">ชำระ/งวด (บาท)</th>
          <th className="num">ดอกเบี้ย (%)</th>
          <th className="num">ดอกเบี้ยค้าง (บาท)</th>
          <th className="center">สถานะ</th>
          <th className="num">หนี้คงเหลือ (บาท)</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="10" className="empty-state">ไม่มีสัญญาเงินกู้คงค้าง</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i}>
              <td className="center mono">{i + 1}</td>
              <td className="mono">{r.contractNo}</td>
              <td>{r.type}</td>
              <td className="center mono">{fmt.date(r.startDate)}</td>
              <td className="num mono">{fmt.money(r.approvedAmount, 2)}</td>
              <td className="num mono">{fmt.money(r.installment, 2)}</td>
              <td className="num mono">{r.rate != null ? r.rate.toFixed(2) : '—'}</td>
              <td className="num mono" style={{ color: r.interestDue > 0 ? 'var(--danger)' : 'inherit', fontWeight: r.interestDue > 0 ? 600 : 400 }}>{fmt.money(r.interestDue || 0, 2)}</td>
              <td className="center"><span className={'pill ' + pill(r.status)}>{r.status}</span></td>
              <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(r.outstanding, 2)}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot><tr className="rsn-total-row">
            <td colSpan="6" className="rsn-total-label">รวมทั้งสิ้น · {sum.loanCount} สัญญา</td>
            <td className="num mono" />
            <td className="num mono" style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt.money(rows.reduce((s, r) => s + (Number(r.interestDue) || 0), 0), 2)}</td>
            <td />
            <td className="num mono">{fmt.money(sum.loanOutstanding, 2)}</td>
          </tr></tfoot>
        )}
      </table>
    </div></div>
  );
}

// ─── ตาราง: รายละเอียดการค้ำประกัน ──────────────────────────────────
function RsnGuarTable({ member, sum, fmt }) {
  const rows = member.guarantees;
  return (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl">
        <thead><tr>
          <th className="center" style={{ width: 96 }}>สถานะอนุมัติ</th>
          <th style={{ width: 200 }}>เลขที่สัญญา / เลขที่ใบขอกู้</th>
          <th>ชื่อผู้กู้</th>
          <th className="num">เงินคงเหลือ (บาท)</th>
          <th className="num" style={{ width: 100 }}>% ที่ค้ำ</th>
          <th className="num">เงินที่ค้ำประกัน (บาท)</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan="6" className="empty-state">ไม่มีภาระการค้ำประกัน</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i}>
              <td className="center"><span className="pill ok"><Icon name="check" size={11} /> {r.status || 'อนุมัติ'}</span></td>
              <td className="mono">
                <div style={{ fontWeight: 600 }}>{r.contractNo}</div>
                {r.reqNo && <div className="muted" style={{ fontSize: 11 }}>เลขที่ใบขอกู้ {r.reqNo}</div>}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="row-avatar">{window.msInitial({ name: r.debtorName })}</span>
                  <div>
                    <div>{r.debtorName}</div>
                    <div className="muted mono" style={{ fontSize: 11 }}>{r.debtorCode}</div>
                  </div>
                </div>
              </td>
              <td className="num mono">{fmt.money(r.outstanding, 2)}</td>
              <td className="num mono">{fmt.money(r.guarPct != null ? r.guarPct : 0, 2)}</td>
              <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(r.guaranteed, 2)}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot><tr className="rsn-total-row">
            <td colSpan="5" className="rsn-total-label">รวมเงินที่ค้ำประกันทั้งสิ้น · {sum.guarCount} สัญญา</td>
            <td className="num mono">{fmt.money(sum.guarTotal, 2)}</td>
          </tr></tfoot>
        )}
      </table>
    </div></div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ResignPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <RsnFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { ResignPage, RsnFormScreen });
