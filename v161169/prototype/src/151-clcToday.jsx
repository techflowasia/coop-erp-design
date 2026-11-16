// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — งานยกเลิก · ยกเลิกสัญญาเงินกู้ (CancelLoanContractPage)
//  ค้นหาสัญญา (ContractSearchField) → ดึงรายละเอียดสัญญา + ยอดเงินอนุมัติ +
//  รายละเอียดการชำระ + อัตราดอกเบี้ย →
//  • สัญญาที่ "ยังไม่มีการทำรายการ" (อนุมัติแล้ว/รอเบิก) → ยกเลิกได้
//  • สัญญาที่ "มีการชำระ/จ่ายแล้ว" → ล็อก + แสดง [PB] ให้ไปยกเลิกจ่ายเงินกู้ก่อน
//  ต้องระบุสาเหตุที่ยกเลิก → ยืนยัน → ปรับสถานะสัญญาเป็น "ยกเลิก"
//  ใช้รูปแบบกลาง: ContractSearchField · icr-*/src-* · DN_MEMBERS · fmt · audit
// ════════════════════════════════════════════════════════════════════

const clcToday = () => window.DEPOSIT_WORKING_DATE || '2026-07-24';
const clcHash = (s) => { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0; return h; };
const clcMoney = (v) => window.fmt.money(v || 0, 2);
const CLC_RATE_LINES = [
  { l: 'งวดที่ 1 – 12', v: '6.50% ต่อปี' },
  { l: 'งวดที่ 13 – 36', v: '6.75% ต่อปี' },
  { l: 'งวดที่ 37 เป็นต้นไป', v: '7.00% ต่อปี' },
  { l: 'อัตราผิดนัด', v: '+3.00% ต่อปี' },
];

// ── debtsOf: สัญญาจริงของสมาชิก (ล็อก) + สัญญาใหม่ที่ "รอเบิก" (ยกเลิกได้) ──
function clcDebtsOf(member) {
  const real = (member.debts || []).map(d => ({ ...d, _cancellable: false }));
  const h = clcHash('NEW' + member.code);
  const beYear = new Date(clcToday()).getFullYear() + 543;
  const approved = 50000 + (h % 40) * 10000;
  const fresh = {
    contractNo: `S${beYear}${String(100000 + (h % 899999)).padStart(6, '0')}`,
    type: (h % 2) ? 'เงินกู้สามัญ' : 'เงินกู้พิเศษ',
    status: 'อนุมัติแล้ว · รอเบิก',
    principalRemaining: approved, interestDue: 0, penalty: 0,
    overdueInstallments: 0, installment: Math.round(approved / 60 / 10) * 10,
    totalTerms: 60, paidTerms: 0, arrears: 0,
    _cancellable: true, _approved: approved, _pendingDisburse: approved,
  };
  return [fresh, ...real];
}

function ClcFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function ClcRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}
function ClcKv({ label, children, danger }) {
  return (
    <div className="src-sum-row">
      <span className="src-sum-l">{label}</span>
      <span className={'src-sum-v' + (danger ? '' : '')} style={danger ? { color: 'var(--danger)' } : null}>{children}</span>
    </div>
  );
}

function ClcConfirmModal({ contract, reason, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const submit = () => { setBusy(true); setTimeout(() => { setBusy(false); onConfirm(); }, 360); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="info" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการยกเลิกสัญญาเงินกู้</h2>
            <div className="muted" style={{ fontSize: 11 }}>สัญญา <span className="mono">{contract.contractNo}</span> · {contract.member.name}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ct-warnbox">
            <Icon name="shield" size={14} />
            <span>การยกเลิกสัญญาจะปรับสถานะเป็น “ยกเลิก” และปลดวงเงิน/สิทธิผู้ค้ำที่ผูกไว้ — บันทึกลง Audit Log และไม่สามารถย้อนกลับได้</span>
          </div>
          <div className="src-summary" style={{ marginBottom: 4 }}>
            <div className="src-sum-row"><span className="src-sum-l">เลขที่สัญญา</span><span className="src-sum-v mono">{contract.contractNo}</span></div>
            <div className="src-sum-row"><span className="src-sum-l">ประเภทเงินกู้</span><span className="src-sum-v">{contract.type}</span></div>
            <div className="src-sum-row"><span className="src-sum-l">ยอดอนุมัติ</span><span className="src-sum-v mono">{clcMoney(contract.approved)} บาท</span></div>
            <div className="src-sum-row"><span className="src-sum-l">สถานะใหม่</span><span className="src-sum-v">ยกเลิก</span></div>
          </div>
          <div className="src-confirm-reason">
            <span className="src-confirm-reason-l">สาเหตุที่ยกเลิก</span>
            <span className="src-confirm-reason-v">{reason}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ย้อนกลับ</button>
            <button type="button" className="btn danger" style={{ flex: 1, justifyContent: 'center' }} disabled={busy} onClick={submit}>
              {busy ? 'กำลังดำเนินการ...' : <><Icon name="check" /> ยืนยันการยกเลิกสัญญา</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CancelLoanContractScreen({ onToast, audit }) {
  const [contract, setContract] = useState(null);   // { member, debt } → flatten
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [blockMsg, setBlockMsg] = useState('');
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const c = contract;
  const cancellable = c && c._cancellable && !done;

  const pick = ({ member, debt }) => {
    const startH = clcHash(debt.contractNo);
    const sd = new Date(clcToday()); sd.setDate(sd.getDate() - (debt.paidTerms || 0) * 30 - 10);
    const flat = {
      member, contractNo: debt.contractNo, type: debt.type, status: debt.status,
      approved: debt._approved || (debt.principalRemaining + (debt.paidTerms || 0) * (debt.installment || 0)),
      pendingDisburse: debt._pendingDisburse || 0,
      remaining: debt.principalRemaining || 0,
      startDate: sd.toISOString().slice(0, 10),
      totalTerms: debt.totalTerms || 0, installment: debt.installment || 0,
      _cancellable: !!debt._cancellable,
    };
    setContract(flat); setReason(''); setNote(''); setDone(false); setError('');
    if (!debt._cancellable) {
      setBlockMsg(`[PB] สัญญาเลขที่ ${debt.contractNo} มีการทำรายการไปแล้ว ไม่สามารถทำการยกเลิกได้ กรุณาตรวจสอบที่เมนู "ยกเลิกจ่ายเงินประจำวัน" ก่อน`);
    } else { setBlockMsg(''); }
  };
  const clearScreen = () => { setContract(null); setReason(''); setNote(''); setError(''); setBlockMsg(''); setDone(false); };

  const openConfirm = () => {
    if (!c) { setError('กรุณาค้นหาและเลือกสัญญาก่อน'); return; }
    if (!c._cancellable) { setError('สัญญานี้มีการทำรายการไปแล้ว ไม่สามารถยกเลิกได้'); return; }
    if (reason.trim().length < 10) { setError('กรุณาระบุสาเหตุที่ยกเลิก (อย่างน้อย 10 ตัวอักษร)'); return; }
    setError(''); setConfirm(true);
  };
  const performCancel = () => {
    setConfirm(false); setDone(true);
    audit && audit.log && audit.log({
      action: 'delete', module: 'สินเชื่อ — ยกเลิกสัญญาเงินกู้',
      target: `${c.member.code} · ${c.member.name}`,
      summary: `ยกเลิกสัญญา ${c.contractNo} · ${c.type} · ยอดอนุมัติ ${clcMoney(c.approved)} บาท`,
      changes: [
        { field: 'เลขที่สัญญา', before: c.contractNo, after: 'ยกเลิกแล้ว' },
        { field: 'สถานะสัญญา', before: c.status, after: 'ยกเลิก' },
        { field: 'ยอดอนุมัติ', before: clcMoney(c.approved), after: '— (ปลดวงเงิน)' },
        { field: 'สาเหตุที่ยกเลิก', before: '—', after: reason.trim() },
      ],
    });
    onToast && onToast(`ยกเลิกสัญญาเงินกู้ ${c.contractNo} (${c.member.name}) เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="ยกเลิกสัญญาเงินกู้">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ยกเลิกสัญญาเงินกู้</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · งานยกเลิก — ยกเลิกสัญญาเงินกู้ที่อนุมัติแล้วแต่ยังไม่มีการเบิก/ชำระ</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn danger sm" onClick={openConfirm} disabled={!cancellable}><Icon name="close" size={13} /> ยกเลิกสัญญา</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
        </div>
      </div>

      {blockMsg && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {blockMsg}</div>)}
      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {done && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} /><span>ยกเลิกสัญญาเงินกู้เรียบร้อยแล้ว — สถานะสัญญาถูกปรับเป็น "ยกเลิก" และปลดวงเงินที่ผูกไว้</span>
        </div>
      )}

      {/* หัวสัญญา */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสัญญา</h3>
          {c && <span className={'pill ' + (c._cancellable ? 'ok' : 'bad')} style={{ marginLeft: 'auto' }}>{c._cancellable ? 'ยกเลิกได้' : 'มีรายการแล้ว'}</span>}
        </div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <ClcFld label="เลขที่สัญญา" fill span={2} required>
            <ContractSearchField contract={c ? c.contractNo : null} member={c ? c.member : null}
              onPick={pick} source={window.DN_MEMBERS} debtsOf={clcDebtsOf}
              title="ค้นหาสัญญา — ยกเลิกสัญญาเงินกู้" />
          </ClcFld>
          <ClcFld label="ประเภทเงินกู้" fill><ClcRO value={c ? c.type : ''} placeholder="—" /></ClcFld>
          <ClcFld label="เลขสมาชิก" fill><ClcRO value={c ? c.member.code : ''} mono placeholder="—" /></ClcFld>
          <ClcFld label="ชื่อ-นามสกุล" fill span={2}><ClcRO value={c ? c.member.name : ''} placeholder="—" /></ClcFld>
          <ClcFld label="สังกัด" fill><ClcRO value={c ? (c.member.deptCode ? c.member.deptCode + ' - ' + c.member.dept : c.member.dept) : ''} placeholder="—" /></ClcFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 16 }}>
          <ClcFld label="หมายเหตุ" grow w={400}>
            <input className="cfg-input" value={note} disabled={!c} placeholder="หมายเหตุประกอบ (ถ้ามี)" onChange={(e) => setNote(e.target.value)} />
          </ClcFld>
        </div>
      </div>

      {/* 3 การ์ด: ยอดเงินอนุมัติ · รายละเอียดการชำระ · อัตราดอกเบี้ย */}
      <div className="clc-grid">
        <div className="search-card icr-sec src-summary-card" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>ยอดเงินอนุมัติ</h3></div>
          <div className="src-summary">
            <ClcKv label="ยอดอนุมัติ"><span className="mono">{c ? clcMoney(c.approved) : '—'}</span></ClcKv>
            <ClcKv label="ยอดรอเบิก"><span className="mono">{c ? clcMoney(c.pendingDisburse) : '—'}</span></ClcKv>
            <ClcKv label="ยอดคงเหลือ"><span className="mono">{c ? clcMoney(c.remaining) : '—'}</span></ClcKv>
            <ClcKv label="สถานะสัญญา">{c ? <span className={'pill ' + (c._cancellable ? 'info' : 'bad')}>{c.status}</span> : '—'}</ClcKv>
          </div>
        </div>

        <div className="search-card icr-sec src-summary-card" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียดการชำระ</h3></div>
          <div className="src-summary">
            <ClcKv label="วันที่เริ่มสัญญา"><span className="mono">{c ? window.fmt.date(c.startDate) : '—'}</span></ClcKv>
            <ClcKv label="งวดทั้งหมด"><span className="mono">{c ? c.totalTerms + ' งวด' : '—'}</span></ClcKv>
            <ClcKv label="ชำระ/งวด"><span className="mono">{c ? clcMoney(c.installment) : '—'}</span></ClcKv>
            <ClcKv label="ชำระแล้ว"><span className="mono">{c ? (c._cancellable ? '0 งวด' : 'มีการชำระ') : '—'}</span></ClcKv>
          </div>
        </div>

        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>อัตราดอกเบี้ย</h3></div>
          {c ? (
            <div className="src-summary">
              {CLC_RATE_LINES.map((r, i) => (
                <div className="src-sum-row" key={i}><span className="src-sum-l">{r.l}</span><span className="src-sum-v mono">{r.v}</span></div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>—</div>
          )}
        </div>
      </div>

      {/* สาเหตุที่ยกเลิก */}
      <div className="search-card icr-sec" style={{ marginTop: 12, marginBottom: 0 }}>
        <div className="section-head"><span className="head-bar" /><h3>สาเหตุที่ยกเลิก</h3></div>
        <textarea className="cfg-input src-reason" rows={3} maxLength={500} disabled={!cancellable}
          placeholder={c && !c._cancellable
            ? 'สัญญานี้มีการทำรายการแล้ว — ต้องยกเลิกการจ่ายเงินกู้ก่อนจึงจะยกเลิกสัญญาได้'
            : 'ระบุสาเหตุที่ยกเลิกสัญญา (อย่างน้อย 10 ตัวอักษร) — เช่น อนุมัติผิดพลาด / สมาชิกขอถอนคำขอ / วงเงินซ้ำซ้อน'}
          value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} />
        <div className="src-reason-count">{reason.length} / 500</div>
      </div>

      {confirm && (
        <ClcConfirmModal contract={c} reason={reason.trim()} onClose={() => setConfirm(false)} onConfirm={performCancel} />
      )}
    </div>
  );
}

function CancelLoanContractPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb(window.crumb3('ยกเลิกสัญญาเงินกู้', 'list'), []);
  return <CancelLoanContractScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { CancelLoanContractPage, CancelLoanContractScreen });
