// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › บัญชีและธุรกรรม — อายัดบัญชี (รวม ATM)
//  ปรับรูปแบบการเข้าใช้งานให้เหมือนหน้าจอรายละเอียดสมาชิก:
//  แสดงโครงหน้าจอ (ฟิลด์ว่าง) ทั้งหมดก่อน แล้วจึงค้นหาเลขบัญชี/เลขสมาชิก
//  รองรับการอายัดวงเงิน และการอายัดบัตร ATM ในหน้าจอเดียวกัน
//  override ของ DepFreezePage (306)
// ════════════════════════════════════════════════════════════════════

const FRZ_USER2 = 'จันทร์เพ็ญ มาลี';
const FRZ_MACHINE2 = 'CNT-01';

const FRZ_DEP_TYPES = [
  { code: '1', label: 'อายัดจำนวนเงิน',       pill: 'bad'  },
  { code: '2', label: 'อายัดการเคลื่อนไหว',    pill: 'bad'  },
  { code: '3', label: 'อายัดรอปิดบัญชี',       pill: 'warn' },
  { code: '4', label: 'อายัดห้ามถอน/ปิดบัญชี', pill: 'bad'  },
  { code: '5', label: 'อายัดห้ามฝากเงิน',      pill: 'warn' },
];
const FRZ_ATM_TYPES = [
  { code: '00', label: 'อายัดยอดเงิน',       pill: 'bad'  },
  { code: '01', label: 'อายัดอื่นๆ',          pill: 'warn' },
  { code: '02', label: 'บัตรหาย',             pill: 'warn' },
  { code: '03', label: 'ธนาคารอายัด',         pill: 'bad'  },
  { code: '04', label: 'อายัดยอดติดลบ',       pill: 'bad'  },
  { code: '05', label: 'ศาลสั่งอายัด',         pill: 'bad'  },
  { code: '06', label: 'กรมบังคับคดีอายัด',    pill: 'bad'  },
];
const frzDepType = (c) => FRZ_DEP_TYPES.find(t => t.code === c);
const frzAtmType = (c) => FRZ_ATM_TYPES.find(t => t.code === c);

const FRZ_SCOPES = [
  { v: 'deposit', label: 'บัญชีเงินฝาก' },
  { v: 'atm',     label: 'บัญชีเงินฝาก ATM' },
  { v: 'both',    label: 'บัญชีเงินฝาก + บัญชีเงินฝาก ATM' },
];

const FRZ_OTHER = '__other__';
function frzDmy(iso) {
  const [y, m, d] = String(iso || '').split('-');
  return y ? d + '/' + m + '/' + (Number(y) + 543) : '';
}
const FRZ_TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function frzThaiDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.getDate() + ' ' + FRZ_TH_MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543);
}

function frzLoadMap(key) {
  try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch (e) {}
  return {};
}
function frzSaveMap(key, map) { try { localStorage.setItem(key, JSON.stringify(map)); } catch (e) {} }

// ── ช่องแสดงผลแบบอ่านอย่างเดียว (ว่างเมื่อยังไม่เลือกบัญชี) ──
function FrzBox({ value, mono }) {
  return <div className={'cfg-display-box' + (mono ? ' mono' : '')}>{value || '—'}</div>;
}

// ── ช่องค้นหาเลขที่บัญชี — เมื่อเลือกแล้วแสดงเพียง“เลขที่บัญชี” ──
function FrzAccountField({ accounts, value, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="gc-member-trigger lb-trigger" onClick={() => setOpen(true)}
              style={{ width: '100%', height: 32, minHeight: 32, boxSizing: 'border-box' }}>
        {value ? (
          <>
            <Icon name="wallet" size={14} />
            <span className="gc-mt-code mono">{value.accNo}</span>
            <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
          </>
        ) : (
          <>
            <Icon name="search" size={14} />
            <span className="muted">ค้นหาเลขที่บัญชี…</span>
            <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
          </>
        )}
      </button>
      {open && <DepAccountSearchModal accounts={accounts} onlyActive={false}
                                     onPick={(a) => { onPick(a); setOpen(false); }}
                                     onClose={() => setOpen(false)} />}
    </>
  );
}

function DepFreezePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [depFrz, setDepFrz] = useState(() => frzLoadMap('dep_freezes'));
  const [atmFrz, setAtmFrz] = useState(() => frzLoadMap('dep_atm_freezes'));
  const [acc, setAcc] = useState(null);

  const [action, setAction] = useState('freeze');      // freeze | release
  const [scope, setScope] = useState('deposit');       // deposit | atm | both
  const [txnDate] = useState(new Date().toISOString().slice(0, 10));
  const [reasonList] = useState(() => (window.depFreezeReasonLoad ? window.depFreezeReasonLoad() : []));
  const [reasonCode, setReasonCode] = useState('');
  const [reasonOther, setReasonOther] = useState('');
  const [depType, setDepType] = useState('');
  const [atmType, setAtmType] = useState('');
  const [amtMode, setAmtMode] = useState('full');      // full | partial
  const [amount, setAmount] = useState('');
  const [approver, setApprover] = useState('');
  const [slip, setSlip] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const curDep = cur ? depFrz[cur.accNo] : null;
  const curAtm = cur ? atmFrz[cur.accNo] : null;
  const balance = cur ? cur.balance : 0;
  const frozenNow = curDep && curDep.amount ? Number(curDep.amount) : (curDep ? balance : 0);
  const withdrawable = cur ? Math.max(0, (cur.withdrawable != null ? Number(cur.withdrawable) : balance) - frozenNow) : 0;
  const bookBal = cur ? (cur.bookBalance != null ? Number(cur.bookBalance) : cur.passbookBalance != null ? Number(cur.passbookBalance) : balance) : 0;
  const amtNum = Number(amount) || 0;
  const wantDep = scope === 'deposit' || scope === 'both';
  const wantAtm = scope === 'atm' || scope === 'both';
  const reasonRow = reasonList.find(r => r.code === reasonCode);
  const isOther = reasonCode === FRZ_OTHER || (reasonRow && /อื่น/.test(reasonRow.name || ''));
  const reason = isOther ? reasonOther : (reasonRow ? reasonRow.name : '');
  const reasonHasOther = reasonList.some(r => /อื่น/.test(r.name || ''));
  const depAmtType = depType === '1';
  const atmCard = cur ? (cur.atmCard || '5061-XX' + String(cur.accNo).replace(/\D/g, '').slice(-4)) : '';

  const reset = () => {
    setAction('freeze'); setScope('deposit'); setDepType(''); setAtmType('');
    setAmtMode('full'); setAmount(''); setReasonCode(''); setReasonOther(''); setApprover(''); setSlip(null);
  };

  const reqNo = useMemo(() => {
    const n = Object.keys(depFrz).length + Object.keys(atmFrz).length + 1;
    return 'FRZ-2569-' + String(n).padStart(4, '0');
  }, [depFrz, atmFrz]);

  const amountValid = amtMode === 'full' || (amtNum > 0 && amtNum <= balance);
  const canSubmit = !!cur && reason.trim() && (
    action === 'release'
      ? ((wantDep && curDep) || (wantAtm && curAtm))
      : (amountValid && (!wantDep || depType) && (!wantAtm || atmType))
  );

  const submit = () => {
    const nextDep = { ...depFrz };
    const nextAtm = { ...atmFrz };
    const prevDep = curDep ? curDep.label : 'ปกติ (ไม่มีอายัด)';
    const prevAtm = curAtm ? curAtm.label : 'ปกติ (ไม่มีอายัด)';
    const dt = frzDepType(depType);
    const at = frzAtmType(atmType);
    const frozenAmt = amtMode === 'partial' ? amtNum : 0;

    if (action === 'release') {
      if (wantDep) delete nextDep[cur.accNo];
      if (wantAtm) delete nextAtm[cur.accNo];
    } else {
      if (wantDep) nextDep[cur.accNo] = {
        type: depType, label: dt.label, reason: reason.trim(), mode: amtMode,
        amount: frozenAmt, date: txnDate, by: FRZ_USER2,
        approveStatus: 'pending', approver: approver.trim(), reqNo,
      };
      if (wantAtm) nextAtm[cur.accNo] = {
        type: atmType, label: at.label, reason: reason.trim(), mode: amtMode,
        amount: frozenAmt, date: txnDate, by: FRZ_USER2, reqId: reqNo,
      };
    }
    setDepFrz(nextDep); frzSaveMap('dep_freezes', nextDep);
    setAtmFrz(nextAtm); frzSaveMap('dep_atm_freezes', nextAtm);

    const scopeLabel = FRZ_SCOPES.find(s => s.v === scope).label;
    const changes = [];
    if (wantDep) changes.push({ field: 'สถานะอายัดบัญชีเงินฝาก', before: prevDep, after: action === 'release' ? 'ปกติ (ไม่มีอายัด)' : dt.label });
    if (wantAtm) changes.push({ field: 'สถานะอายัดบัญชีเงินฝาก ATM', before: prevAtm, after: action === 'release' ? 'ปกติ (ไม่มีอายัด)' : at.label });

    audit.log({
      action: action === 'release' ? 'update' : 'create',
      module: 'เงินฝาก — อายัดบัญชี',
      target: `${cur.member} · ${cur.name}`,
      summary: `${action === 'release' ? 'ยกเลิกอายัด' : 'อายัด'} ${scopeLabel} บัญชี ${cur.accNo}` +
        (action === 'freeze' && amtMode === 'partial' ? ` วงเงิน ${fmt.money(amtNum, 2)} บาท` : '') +
        ` — เหตุผล: ${reason.trim()}`,
      changes,
    });

    setSlip({
      title: action === 'release' ? 'ใบคำขอยกเลิกอายัดบัญชีเงินฝาก' : 'ใบคำขออายัดบัญชีเงินฝาก',
      sub: `เลขที่คำขอ ${reqNo} · ${frzThaiDate(txnDate)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ชื่อบัญชี / สมาชิก', v: `${cur.name} · ${cur.member}` },
        { k: 'ประเภทเงินฝาก', v: cur.type },
        { k: 'ยอดเงินคงเหลือ', v: fmt.money(balance, 2), mono: true },
        { k: 'ขอบเขตการอายัด', v: scopeLabel },
        ...(wantDep ? [{ k: 'ประเภทรายการ (เงินฝาก)', v: action === 'release' ? 'ยกเลิกอายัด' : `${dt.code}-${dt.label}`, strong: true }] : []),
        ...(wantAtm ? [{ k: 'ประเภทการอายัด (ATM)', v: action === 'release' ? 'ยกเลิกอายัด' : `${at.code}-${at.label}`, strong: true }] : []),
        ...(wantAtm ? [{ k: 'เลขบัตร ATM', v: atmCard, mono: true }] : []),
        { k: 'รูปแบบวงเงิน', v: action === 'release' ? '—' : (amtMode === 'partial' ? 'อายัดเฉพาะวงเงินที่ระบุ' : 'อายัดทั้งบัญชี') },
        ...(action === 'freeze' && amtMode === 'partial' ? [
          { k: 'วงเงินที่อายัด', v: fmt.money(amtNum, 2) + ' บาท', mono: true, strong: true },
          { k: 'ยอดถอนได้คงเหลือ', v: fmt.money(Math.max(0, balance - amtNum), 2) + ' บาท', mono: true },
        ] : []),
        { k: 'เหตุผล', v: reason.trim() },
        { k: 'สถานะอนุมัติ', v: 'รออนุมัติ' },
        { k: 'ผู้อนุมัติ', v: approver.trim() || '—' },
      ],
      foot: action === 'release'
        ? 'คำขอยกเลิกการอายัด — รอผู้มีอำนาจอนุมัติก่อนมีผลบังคับ'
        : 'ส่งคำขออายัด — รอผู้มีอำนาจอนุมัติก่อนมีผลบังคับ',
    });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกคำขอ' + (action === 'release' ? 'ยกเลิกอายัด' : 'อายัด') + ' ' + scopeLabel + ' บัญชี “' + cur.accNo + '” เรียบร้อยแล้ว', next: 'รอหัวหน้าอนุมัติที่เมนูอนุมัติทำรายการ' });
  };

  return (
    <div data-screen-label="หน้าอายัดบัญชีเงินฝาก" className="dep-open">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อายัดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 840 }}>
            ค้นหาที่ช่อง “เลขที่บัญชี” ระบุขอบเขตการอายัด (บัญชีเงินฝาก / บัญชีเงินฝาก ATM)
            และวงเงินที่ต้องการอายัด — ระบบบันทึกผู้ทำรายการและส่งขออนุมัติก่อนมีผลบังคับ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" data-keep-top="" disabled={!cur} onClick={() => { setAcc(null); reset(); }}>
          ล้างหน้าจอ
        </button>
        <button className="btn sm" data-keep-top="" disabled={!slip} onClick={() => depPrintSlip(onToast)}>
          <Icon name="print" size={13} /> พิมพ์ใบคำขอ
        </button>
      </div>

      <div className="dep-form-cols">
        <div className="dep-form-main">
          {/* ── 1. ข้อมูลบัญชีและสมาชิก ── */}
          <div className="search-card dat-section">
            <DepSecHead icon="wallet" title="ข้อมูลบัญชีเงินฝากและสมาชิก" sub="ค้นหาที่ช่องเลขที่บัญชี — ข้อมูลอื่นดึงอัตโนมัติ" />
            <div className="dat-grid g3">
              <DatFieldLite label="เลขที่บัญชี" required>
                <FrzAccountField accounts={accounts} value={cur}
                                 onPick={(a) => { setAcc(a); reset(); }} />
              </DatFieldLite>
              <DatFieldLite label="ประเภทเงินฝาก"><FrzBox value={cur ? cur.type : ''} /></DatFieldLite>
              <DatFieldLite label="เลขทะเบียนสมาชิก"><FrzBox value={cur ? cur.member : ''} mono /></DatFieldLite>
              <DatFieldLite label="ชื่อ - นามสกุล" span={2}><FrzBox value={cur ? cur.name : ''} /></DatFieldLite>
              <DatFieldLite label="สังกัด"><FrzBox value={cur ? cur.dept : ''} /></DatFieldLite>
              <DatFieldLite label="ยอดเงินคงเหลือ"><FrzBox value={cur ? fmt.money(balance, 2) : ''} mono /></DatFieldLite>
              <DatFieldLite label="ยอดถอนได้"><FrzBox value={cur ? fmt.money(withdrawable, 2) : ''} mono /></DatFieldLite>
              <DatFieldLite label="ยอดในสมุด"><FrzBox value={cur ? fmt.money(bookBal, 2) : ''} mono /></DatFieldLite>
              <DatFieldLite label="เลขบัตร ATM"><FrzBox value={atmCard} mono /></DatFieldLite>
              <DatFieldLite label="สถานะบัญชี"><FrzBox value={cur ? (cur.status === 'active' ? 'ใช้งาน' : 'ปิดบัญชี') : ''} /></DatFieldLite>
            </div>
            {cur && (curDep || curAtm) && (
              <div style={{ padding: '0 16px 16px', display: 'grid', gap: 8 }}>
                {curDep && <div className="dat-warn" style={curDep
                  ? { background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }
                  : { background: 'var(--success-50)', borderColor: 'color-mix(in srgb, var(--success) 28%, transparent)', color: 'var(--success)' }}>
                  <Icon name={curDep ? 'lock' : 'check'} size={14} />
                  <span>บัญชีเงินฝาก: {curDep
                    ? <>ถูกอายัดอยู่ — <b>{curDep.label}</b>{curDep.amount ? ` (วงเงิน ${fmt.money(curDep.amount, 2)} บาท)` : ''} · เหตุผล: {curDep.reason} · เมื่อ {fmt.date(curDep.date)}</>
                    : <>สถานะ<b>ปกติ</b> — ไม่มีการอายัด</>}</span>
                </div>}
                {curAtm && <div className="dat-warn" style={curAtm
                  ? { background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }
                  : { background: 'var(--success-50)', borderColor: 'color-mix(in srgb, var(--success) 28%, transparent)', color: 'var(--success)' }}>
                  <Icon name={curAtm ? 'lock' : 'check'} size={14} />
                  <span>บัญชีเงินฝาก ATM: {curAtm
                    ? <>ถูกอายัดอยู่ — <b>{curAtm.label}</b>{curAtm.amount ? ` (วงเงิน ${fmt.money(curAtm.amount, 2)} บาท)` : ''} · เมื่อ {fmt.date(curAtm.date)}</>
                    : <>สถานะ<b>ปกติ</b> — ทำรายการผ่านบัตรได้</>}</span>
                </div>}
              </div>
            )}
          </div>

          {/* ── 2. ผู้ทำรายการ ── */}
          <div className="search-card dat-section" style={{ marginTop: 0 }}>
            <DepSecHead icon="user" title="รายละเอียดผู้ทำรายการ" sub="เจ้าหน้าที่ เครื่อง และวันที่ทำรายการ" />
            <div className="dat-grid g3">
              <DatFieldLite label="ผู้ทำรายการ">
                <input className="cfg-input" value={FRZ_USER2} readOnly style={{ background: 'var(--surface-2, #f5f5f5)' }} />
              </DatFieldLite>
              <DatFieldLite label="วันทำรายการ">
                <input className="cfg-input mono" value={frzDmy(txnDate)} readOnly disabled style={{ background: 'var(--surface-2, #f5f5f5)', cursor: 'not-allowed' }} />
              </DatFieldLite>
              <DatFieldLite label="เครื่องที่ทำรายการ">
                <input className="cfg-input mono" value={FRZ_MACHINE2} readOnly style={{ background: 'var(--surface-2, #f5f5f5)' }} />
              </DatFieldLite>
            </div>
          </div>

          {/* ── 3. รายละเอียดการอายัด ── */}
          <div className="search-card dat-section" style={{ marginTop: 0 }}>
            <DepSecHead icon="lock" title="รายละเอียดการอายัด" sub="เลือกขอบเขต ประเภทรายการ และวงเงินที่ต้องการอายัด" />
            <div className="dat-grid g2">
              <DatFieldLite label="ประเภทการทำรายการ" required>
                <select className="cfg-input" value={action} disabled={!cur}
                        onChange={(e) => { setAction(e.target.value); setDepType(''); setAtmType(''); setAmtMode('full'); setAmount(''); setReasonCode(''); setReasonOther(''); }}>
                  <option value="freeze">อายัด</option>
                  <option value="release">ยกเลิกอายัด</option>
                </select>
              </DatFieldLite>
              <DatFieldLite label="ขอบเขตการอายัด" required>
                <select className="cfg-input" value={scope} disabled={!cur} onChange={(e) => setScope(e.target.value)}>
                  {FRZ_SCOPES.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
              </DatFieldLite>

              {action === 'freeze' && wantDep && (
                <DatFieldLite label="ประเภทรายการ (บัญชีเงินฝาก)" required>
                  <select className="cfg-input" value={depType} disabled={!cur}
                          onChange={(e) => { setDepType(e.target.value); setAmount(''); setAmtMode(e.target.value === '1' ? 'partial' : 'full'); }}>
                    <option value="">— เลือกประเภทการอายัด —</option>
                    {FRZ_DEP_TYPES.map(t => <option key={t.code} value={t.code}>{t.code}-{t.label}</option>)}
                  </select>
                </DatFieldLite>
              )}
              {action === 'freeze' && wantAtm && (
                <DatFieldLite label="ประเภทการอายัด (บัญชีเงินฝาก ATM)" required>
                  <select className="cfg-input" value={atmType} disabled={!cur} onChange={(e) => setAtmType(e.target.value)}>
                    <option value="">— เลือกประเภทการอายัด ATM —</option>
                    {FRZ_ATM_TYPES.map(t => <option key={t.code} value={t.code}>{t.code}-{t.label}</option>)}
                  </select>
                </DatFieldLite>
              )}

              {action === 'freeze' && !(wantDep && depAmtType) && (
                <DatFieldLite label="รูปแบบวงเงินที่อายัด" required>
                  <select className="cfg-input" value={amtMode} disabled={!cur} onChange={(e) => { setAmtMode(e.target.value); setAmount(''); }}>
                    <option value="full">อายัดทั้งบัญชี</option>
                    <option value="partial">ระบุวงเงินที่อายัด</option>
                  </select>
                </DatFieldLite>
              )}
              {action === 'freeze' && amtMode === 'partial' && (
                <DatFieldLite label={wantDep && depAmtType ? 'จำนวนเงินที่อายัด (บาท)' : 'วงเงิน / ยอดเงินที่อายัด (บาท)'} required>
                  <input className="cfg-input mono" type="number" step="0.01" value={amount} disabled={!cur}
                         onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ textAlign: 'right' }} />
                </DatFieldLite>
              )}
              {action === 'freeze' && amtMode === 'partial' && !(wantDep && depAmtType) && (
                <DatFieldLite label="ยอดถอนได้คงเหลือ">
                  <FrzBox value={cur ? fmt.money(Math.max(0, balance - amtNum), 2) : ''} mono />
                </DatFieldLite>
              )}

              <DatFieldLite label={action === 'release' ? 'เหตุผลการยกเลิกอายัด' : 'เหตุผลการอายัด'} required>
                <select className="cfg-input" value={reasonCode} disabled={!cur} onChange={(e) => { setReasonCode(e.target.value); setReasonOther(''); }}>
                  <option value="">— เลือกเหตุผล —</option>
                  {reasonList.map(r => <option key={r.id || r.code} value={r.code}>{r.code}-{r.name}</option>)}
                  {!reasonHasOther && <option value={FRZ_OTHER}>อื่นๆ</option>}
                </select>
              </DatFieldLite>
              {isOther && (
                <DatFieldLite label="ระบุเหตุผลอื่นๆ" required>
                  <input className="cfg-input" value={reasonOther} disabled={!cur} onChange={(e) => setReasonOther(e.target.value)}
                         placeholder="ระบุเหตุผลการอายัด" />
                </DatFieldLite>
              )}
            </div>
            {cur && action === 'freeze' && amtMode === 'partial' && amtNum > balance && (
              <div style={{ padding: '0 16px 14px', color: 'var(--danger)', fontSize: 12 }}>
                <Icon name="info" size={12} /> วงเงินที่อายัดต้องไม่เกินยอดคงเหลือ ({fmt.money(balance, 2)} บาท)
              </div>
            )}
            {cur && action === 'release' && !curDep && !curAtm && (
              <div style={{ padding: '0 16px 14px', color: 'var(--danger)', fontSize: 12 }}>
                <Icon name="info" size={12} /> บัญชีนี้ไม่มีรายการอายัดที่ต้องยกเลิก
              </div>
            )}
          </div>
        </div>

        {/* ── ขวา: สถานะ + ปุ่ม ── */}
        <div className="dep-form-side">
          <div className="search-card dat-section">
            <DepSecHead icon="info" title="เพิ่มเติม" sub="หมายเหตุประกอบการอายัด" />
            <div style={{ padding: '4px 16px 16px', display: 'grid', gap: 12 }}>
              <div>
                <div className="dat-label">เลขที่คำขอ</div>
                <div className="mono" style={{ fontWeight: 600 }}>
                  {cur ? reqNo : '—'} <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>(อัตโนมัติ)</span>
                </div>
              </div>
              <div>
                <div className="dat-label">สถานะเดิม — บัญชีเงินฝาก</div>
                {!cur ? <span className="muted" style={{ fontSize: 12 }}>—</span>
                  : curDep ? <span className={'pill ' + (frzDepType(curDep.type)?.pill || 'bad')}>{curDep.label}</span>
                  : <span className="pill ok">ปกติ</span>}
              </div>
              <div>
                <div className="dat-label">สถานะเดิม — บัญชีเงินฝาก ATM</div>
                {!cur ? <span className="muted" style={{ fontSize: 12 }}>—</span>
                  : curAtm ? <span className={'pill ' + (frzAtmType(curAtm.type)?.pill || 'bad')}>{curAtm.label}</span>
                  : <span className="pill ok">ปกติ</span>}
              </div>
              <div>
                <div className="dat-label">สถานะอนุมัติ</div>
                <span className="pill warn">รออนุมัติ</span>
              </div>
              <DatFieldLite label="ผู้อนุมัติ">
                <input className="cfg-input" value={approver} disabled={!cur} onChange={(e) => setApprover(e.target.value)} placeholder="ชื่อผู้มีอำนาจอนุมัติ" />
              </DatFieldLite>
            </div>
          </div>
          <div className="dep-submit-bar">
            <button className="btn block primary lg" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
              <Icon name={action === 'release' ? 'unlock' : 'lock'} /> {action === 'release' ? 'บันทึกคำขอยกเลิกอายัด' : 'บันทึกคำขออายัด'}
            </button>
            {slip && <button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบคำขอ</button>}
          </div>
          <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
            <Icon name="info" size={11} /> คำขออายัด / ยกเลิกอายัดจะมีผลบังคับหลังผู้มีอำนาจอนุมัติ — ระบบบันทึกประวัติผู้ทำรายการทุกครั้ง
          </p>
        </div>
      </div>

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
      {confirmOpen && cur && (
        <window.DepConfirmModal tone={action === 'release' ? undefined : 'danger'}
          title={action === 'release' ? 'ยืนยันบันทึกคำขอยกเลิกอายัด' : 'ยืนยันบันทึกคำขออายัด'}
          okLabel={action === 'release' ? 'ยืนยันยกเลิกอายัด' : 'ยืนยันอายัด'}
          tint={action === 'release' ? undefined : 'var(--danger, #cf1322)'}
          lines={[
            ['เลขที่บัญชี', cur.accNo],
            ['ชื่อบัญชี', cur.name],
            ['ขอบเขต', (FRZ_SCOPES.find(s => s.v === scope) || {}).label || '—'],
            ['เหตุผล', reason || '—'],
            ...(action === 'freeze' && amount ? [['จำนวนเงินที่อายัด', fmt.money(Number(amount) || 0, 2) + ' บาท']] : []),
          ]}
          onClose={() => setConfirmOpen(false)}
          onOk={() => { setConfirmOpen(false); submit(); }} />
      )}
    </div>
  );
}

Object.assign(window, { DepFreezePage });
