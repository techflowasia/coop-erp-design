// ════════════════════════════════════════════════════════════════════
//  รับโอนเลขสัญญาผู้ค้ำประกัน — หน้าทำรายการโอนหนี้
//  โอนหนี้ให้ผู้ค้ำ (TRN) / โอนกลับผู้กู้ (RTN)
//  ค้นหาสัญญา → ดึงยอดก่อนทำรายการ → คำนวณเงินต้น/ดอกเบี้ยโอน →
//  เลือกผู้ค้ำรับโอน + สัดส่วน → ตรวจสอบ → บันทึก
// ════════════════════════════════════════════════════════════════════

// รอบบัญชีที่ปิดแล้ว (วันที่โอนต้องไม่ย้อนหลังก่อนวันนี้)
window.GT_CLOSED_PERIOD_END = '2026-03-31';

function gtFieldRow({ label, value, mono, strong, color }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={'value' + (mono ? ' mono' : '')} style={{ fontWeight: strong ? 700 : undefined, color }}>{value ?? '—'}</span>
    </div>
  );
}

// ─── popup ค้นหาเลขสัญญาผู้กู้ (ค้นได้จริงด้วยเลขสัญญา/รหัสสมาชิก/ชื่อ) ──
//  • แสดงเลขสัญญาของสมาชิก พร้อมสถานะการออกจากระบบทะเบียนสมาชิก
//  • เลือกได้เฉพาะสมาชิกสถานะ ตาย/ให้ออก/ไล่ออก/ปลดออก/ลาออก/พ้นสภาพ
function GtContractSearchModal({ onPick, onClose }) {
  const [c, setC] = useState({ contractNo: '', code: '', name: '', citizenId: '' });
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const filt = (cr) => {
    const cn = norm(cr.contractNo), cd = norm(cr.code), nm = (cr.name || '').trim().toLowerCase(), cid = norm(cr.citizenId);
    return window.GT_LOAN_CONTRACTS.filter(x => {
      if (cn && !norm(x.contractNo).includes(cn)) return false;
      if (cd && !norm(x.borrowerCode).includes(cd)) return false;
      if (nm && !String(x.borrowerName).toLowerCase().includes(nm)) return false;
      if (cid && !norm(x.citizenId).includes(cid)) return false;
      return true;
    });
  };
  const [rows, setRows] = useState(() => window.GT_LOAN_CONTRACTS);
  const run = () => setRows(filt(c));
  const reset = () => { setC({ contractNo: '', code: '', name: '', citizenId: '' }); setRows(window.GT_LOAN_CONTRACTS); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาเลขสัญญาผู้กู้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. เลขที่สัญญา</span>
              <input value={c.contractNo} onChange={(e) => set('contractNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น L-2021-0332" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. รหัสสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-066238" className="mono" />
            </label>
            <label className="gc-sf">
              <span>3. ชื่อ – นามสกุลผู้กู้</span>
              <input value={c.name} onChange={(e) => set('name', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อ / นามสกุล" />
            </label>
            <label className="gc-sf">
              <span>4. เลขที่บัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน" className="mono" />
            </label>
            <div className="gc-sf-actions" style={{ gridColumn: 'span 4' }}>
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>
          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            สัญญาเงินกู้ <span className="muted" style={{ fontWeight: 400 }}>· พบ {rows.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่สัญญา</th>
                  <th>ผู้กู้</th>
                  <th>ประเภท</th>
                  <th className="num">ต้นคงเหลือ</th>
                  <th className="center">สถานะสมาชิก</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">ไม่พบสัญญาที่ตรงกับเงื่อนไข</td></tr>
                ) : rows.map((x) => {
                  const eligible = window.gtIsEligibleStatus(x.borrowerStatus);
                  const blocked = x.closed || x.pendingTransfer || !eligible;
                  const reason = x.closed ? 'ปิดบัญชีแล้ว' : x.pendingTransfer ? 'รออนุมัติโอน' : !eligible ? 'สถานะไม่เข้าเงื่อนไข' : '';
                  return (
                    <tr key={x.contractNo} className={blocked ? 'gt-row-disabled' : 'clickable'}
                        onClick={() => !blocked && onPick(x)} title={blocked ? reason : ''}>
                      <td className="mono">{x.contractNo}</td>
                      <td>
                        <div style={{ whiteSpace: 'nowrap' }}>{x.borrowerName}</div>
                        <div className="muted mono" style={{ fontSize: 10 }}>{x.borrowerCode} · {x.borrowerDept}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{x.loanType}</td>
                      <td className="num">{fmt.money(x.principalRemaining, 0)}</td>
                      <td className="center">
                        {eligible ? <span className="pill warn">{x.borrowerStatus}</span> : <span className="pill ok">{x.borrowerStatus}</span>}
                        {blocked && <div className="muted" style={{ fontSize: 9, marginTop: 2 }}>{reason}</div>}
                      </td>
                      <td className="center">
                        {blocked
                          ? <Icon name="lock" size={13} />
                          : <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                    onClick={(e) => { e.stopPropagation(); onPick(x); }} title="เลือก"><Icon name="chevRight" /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
            <Icon name="info" size={11} /> เลือกทำรายการได้เฉพาะสมาชิกที่มีสถานะ ตาย / ให้ออก / ไล่ออก / ปลดออก / ลาออก / พ้นสภาพสมาชิก (ดึงจากระบบทะเบียนสมาชิก)
          </p>
        </div>
      </div>
    </>
  );
}

// ─── หน้าทำรายการโอนหนี้ ─────────────────────────────────────────────
function GtTransferWorkspace({ list, onSubmit, onCancel, onToast }) {
  const beYear = 2569;
  const today = window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10);

  const [contract, setContract] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [transferType, setTransferType] = useState('TRN');
  const [transferDate, setTransferDate] = useState(today);
  const [accrueToDate, setAccrueToDate] = useState(today);
  const [exitReasonCode, setExitReasonCode] = useState('');
  const [exitReasonOther, setExitReasonOther] = useState('');
  const [rateMode, setRateMode] = useState('orig');
  const [allowEdit, setAllowEdit] = useState(false);   // สิทธิ์พิเศษแก้ไขยอด
  const [principalOverride, setPrincipalOverride] = useState(null);
  const [interestOverride, setInterestOverride] = useState(null);
  const [rows, setRows] = useState([]);  // {code,name,dept,relation,checked,percent,accrueDate}

  const isTRN = transferType === 'TRN';

  // ── เหตุที่ผู้กู้ออก — ดึงจากสถานะสมาชิก (ระบบทะเบียนสมาชิก) — ──
  const exitInfo = useMemo(() => contract ? window.gtStatusToExit(contract.borrowerStatus) : null, [contract]);

  // อัตราดอกเบี้ยที่ใช้
  const appliedRate = useMemo(() => {
    if (!contract) return 0;
    if (!isTRN || rateMode === 'orig') return contract.intRate;
    return (window.gtRateMode(rateMode).rate) || contract.intRate;
  }, [contract, rateMode, isTRN]);

  // เงินต้นที่จะโอน
  const transferPrincipal = useMemo(() => {
    if (principalOverride != null) return Number(principalOverride) || 0;
    return contract ? contract.principalRemaining : 0;
  }, [contract, principalOverride]);

  // ดอกเบี้ยที่จะโอน (คำนวณถึงวันที่ตั้งดอกเบี้ยค้าง)
  const calcInterest = useMemo(() => {
    if (!contract) return 0;
    return window.gtAccruedInterest(transferPrincipal, appliedRate, contract.lastInterestDate, accrueToDate);
  }, [contract, transferPrincipal, appliedRate, accrueToDate]);
  const transferInterest = interestOverride != null ? (Number(interestOverride) || 0) : calcInterest;

  const remainingTerms = contract ? Math.max(1, contract.totalTerms - contract.paidTerms) : 1;

  // เลือกสัญญา → เตรียมรายการผู้ค้ำ + ดึงเหตุที่ผู้กู้ออกจากสถานะสมาชิก
  const pickContract = (c) => {
    if (!c) return;
    const exit = window.gtStatusToExit(c.borrowerStatus);
    setContract(c);
    setPrincipalOverride(null);
    setInterestOverride(null);
    setExitReasonCode(exit ? exit.code : '');
    setExitReasonOther('');
    setRateMode(exit && exit.special ? 'special' : 'orig');
    setAccrueToDate(today);
    const shares = window.gtReturnShares(c.contractNo);
    const gs = (c.guarantors || []).map(g => {
      const sh = shares && shares.find(s => s.code === g.code);
      return { ...g, checked: !!sh, percent: sh ? sh.sharePct : 0, accrueDate: today, sendType: 'principal',
               ratePct: c.intRate, intPerPeriodEdit: null, perPeriodEdit: null };
    });
    setRows(gs);
  };

  // ล้างค่าทั้งฟอร์ม
  const resetForm = () => {
    setContract(null);
    setTransferType('TRN');
    setTransferDate(today);
    setAccrueToDate(today);
    setExitReasonCode(''); setExitReasonOther('');
    setRateMode('orig');
    setPrincipalOverride(null); setInterestOverride(null);
    setRows([]);
    onToast && onToast('ล้างค่าฟอร์มแล้ว');
  };

  // คำนวณดอกเบี้ยใหม่— ล้างค่าที่แก้ไขเอง ให้ระบบคำนวณใหม่จากยอดสัญญา
  const recalcInterest = () => {
    if (!contract) { onToast && onToast('กรุณาค้นหาและเลือกสัญญาผู้กู้ก่อน'); return; }
    setPrincipalOverride(null); setInterestOverride(null);
    onToast && onToast('คำนวณดอกเบี้ยใหม่จากยอดสัญญาแล้ว');
  };

  // เลือก/ยกเลิกผู้ค้ำ — แบ่ง % เท่ากันอัตโนมัติ
  const toggleRow = (i) => {
    setRows(prev => {
      const next = prev.map((r, idx) => idx === i ? { ...r, checked: !r.checked } : r);
      const checked = next.filter(r => r.checked);
      const even = checked.length ? Math.floor((100 / checked.length) * 100) / 100 : 0;
      let acc = 0;
      next.forEach((r) => {
        if (r.checked) { r.percent = even; acc += even; }
        else r.percent = 0;
      });
      // ปัดเศษให้รวมเท่ากับ 100 ที่รายสุดท้าย
      const lastChecked = [...next].reverse().find(r => r.checked);
      if (lastChecked) lastChecked.percent = Math.round((lastChecked.percent + (100 - acc)) * 100) / 100;
      return [...next];
    });
  };
  const setPercent = (i, v) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, percent: v === '' ? '' : Number(v) } : r));
  };
  const setRowAccrue = (i, v) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, accrueDate: v } : r));
  };
  const setRowSend = (i, v) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, sendType: v } : r));
  };
  const setRatePct = (i, v) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ratePct: v === '' ? '' : Number(v), intPerPeriodEdit: null } : r));
  };
  const setIntPerPeriod = (i, v) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, intPerPeriodEdit: v === '' ? '' : Number(v) } : r));
  };
  const setPerPeriodEdit = (i, v) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, perPeriodEdit: v === '' ? '' : Number(v) } : r));
  };

  // คำนวณยอดโอนต่อผู้ค้ำ (ปัดเศษให้รายสุดท้ายรับส่วนต่าง)
  const computed = useMemo(() => {
    const checkedIdx = rows.map((r, i) => r.checked ? i : -1).filter(i => i >= 0);
    let accP = 0, accI = 0;
    const out = rows.map(r => ({ ...r, principal: 0, interest: 0, perPeriod: 0 }));
    checkedIdx.forEach((idx, k) => {
      const pct = Number(out[idx].percent) || 0;
      let p, ii;
      if (k === checkedIdx.length - 1) { p = Math.round((transferPrincipal - accP) * 100) / 100; ii = Math.round((transferInterest - accI) * 100) / 100; }
      else { p = Math.round(transferPrincipal * pct / 100 * 100) / 100; ii = Math.round(transferInterest * pct / 100 * 100) / 100; accP += p; accI += ii; }
      out[idx].principal = p;
      out[idx].interest = ii;
      const basePer = Math.round((contract ? contract.installment : 0) * pct / 100);
      out[idx].perPeriod = (out[idx].perPeriodEdit != null && out[idx].perPeriodEdit !== '')
        ? Number(out[idx].perPeriodEdit) : basePer;
      const rate = Number(out[idx].ratePct) || 0;
      const baseIntPer = Math.round(p * rate / 100 / 12);
      out[idx].intPerPeriod = (out[idx].intPerPeriodEdit != null && out[idx].intPerPeriodEdit !== '')
        ? Number(out[idx].intPerPeriodEdit) : baseIntPer;
    });
    return out;
  }, [rows, transferPrincipal, transferInterest, contract]);

  const checkedRows = computed.filter(r => r.checked);
  const sumPct = checkedRows.reduce((s, r) => s + (Number(r.percent) || 0), 0);
  const sumP = checkedRows.reduce((s, r) => s + r.principal, 0);
  const sumI = checkedRows.reduce((s, r) => s + r.interest, 0);

  // ─── ตรวจสอบก่อนบันทึก ──────────────────────────────────────────
  const checks = useMemo(() => {
    const list2 = [];
    list2.push({ ok: !!contract, label: 'ระบุเลขที่สัญญาผู้กู้' });
    list2.push({ ok: !!transferType, label: 'เลือกประเภทการโอน' });
    list2.push({ ok: !!transferDate, label: 'ระบุวันที่โอน' });
    list2.push({ ok: !!accrueToDate, label: 'ระบุวันที่ตั้งดอกเบี้ยค้างถึงวันที่' });
    list2.push({ ok: (transferPrincipal > 0 || transferInterest > 0), label: 'มีเงินต้นคงเหลือ หรือดอกเบี้ยค้างให้โอน' });
    list2.push({ ok: !!contract && !contract.closed, label: 'สัญญายังไม่ถูกปิดบัญชี' });
    list2.push({ ok: !!contract && !contract.pendingTransfer, label: 'สัญญาไม่มีรายการโอนที่รออนุมัติ' });
    list2.push({ ok: !!transferDate && transferDate > window.GT_CLOSED_PERIOD_END, label: 'วันที่โอนไม่ย้อนหลังเข้ารอบบัญชีที่ปิดแล้ว' });
    if (isTRN) {
      list2.push({ ok: !!exitReasonCode, label: 'ผู้กู้มีสถานะออกจากระบบ (ดึงจากทะเบียนสมาชิก)' });
      list2.push({ ok: (contract ? (contract.guarantors || []).length > 0 : false), label: 'สัญญามีผู้ค้ำประกันอย่างน้อย 1 ราย' });
      list2.push({ ok: checkedRows.length > 0, label: 'เลือกผู้ค้ำที่ต้องรับโอนหนี้' });
      list2.push({ ok: Math.abs(sumPct - 100) < 0.01 && checkedRows.length > 0, label: 'สัดส่วน (%) รวมของผู้ค้ำเท่ากับ 100' });
      list2.push({ ok: Math.abs(sumP - transferPrincipal) < 0.01 && checkedRows.length > 0, label: 'ยอดเงินต้นโอนรวมเท่ากับเงินต้นที่ต้องโอน' });
      list2.push({ ok: Math.abs(sumI - transferInterest) < 0.01 && checkedRows.length > 0, label: 'ยอดดอกเบี้ยโอนรวมเท่ากับดอกเบี้ยที่ต้องโอน' });
    }
    return list2;
  }, [contract, transferType, transferDate, accrueToDate, transferPrincipal, transferInterest, isTRN, exitReasonCode, exitReasonOther, checkedRows.length, sumPct, sumP, sumI]);

  const firstFail = checks.find(c => !c.ok);
  const canSave = !firstFail;

  // เลขสัญญารับโอน (preview) — ออกตามลำดับผู้ค้ำที่เลือก
  const ctrPrefix = contract && contract.loanType === 'เงินกู้ฉุกเฉิน' ? 'GE' : 'GS';
  const baseSeq = window.gtNextContractSeq(list, beYear, ctrPrefix);

  const save = () => {
    if (!canSave) {
      const missing = checks.filter(c => !c.ok);
      onToast && onToast(`กรอกข้อมูลไม่ครบถ้วน — ${firstFail.label}`
        + (missing.length > 1 ? ` (และอีก ${missing.length - 1} รายการ)` : ''));
      return;
    }
    const exit = window.gtExitReason(exitReasonCode) || {};
    let seq = baseSeq;
    const allocations = (isTRN ? checkedRows : [{
      code: contract.borrowerCode, name: contract.borrowerName, dept: contract.borrowerDept,
      percent: 100, principal: transferPrincipal, interest: transferInterest,
      perPeriod: contract.installment, accrueDate: accrueToDate, ratePct: contract.intRate,
      intPerPeriod: Math.round(transferPrincipal * contract.intRate / 100 / 12),
    }]).map(r => {
      seq += 1;
      return {
        code: r.code, name: r.name, dept: r.dept,
        transferredContractNo: window.gtMakeContractNo(ctrPrefix, beYear, seq),
        accrueDate: r.accrueDate || accrueToDate,
        percent: r.percent, principal: r.principal, interest: r.interest,
        perPeriod: r.perPeriod, ratePct: r.ratePct, intPerPeriod: r.intPerPeriod,
        type: transferType, sendType: r.sendType || 'principal',
      };
    });
    const rec = {
      id: window.gtNextId(list, beYear), transferType,
      transferDate, accrueToDate,
      contractNo: contract.contractNo,
      borrowerCode: contract.borrowerCode, borrowerName: contract.borrowerName,
      borrowerDept: contract.borrowerDept, borrowerStatus: contract.borrowerStatus,
      loanType: contract.loanType, contractType: contract.contractType,
      legalStatus: contract.legalStatus, intRate: contract.intRate, lastInterestDate: contract.lastInterestDate,
      principalRemaining: contract.principalRemaining, interestAccrued: calcInterest,
      installment: contract.installment, lastPeriod: contract.lastPeriod,
      exitReasonCode: isTRN ? exitReasonCode : '', exitReasonOther: isTRN ? exitReasonOther : '',
      rateMode: isTRN ? rateMode : 'orig', appliedRate,
      transferPrincipal, transferInterest,
      allocations,
      docStatus: 'draft', collectStatus: 'pending',
      noticeRef: '—', dueDate: transferDate,
      history: [
        { date: transferDate, event: 'บันทึกโอนหนี้',
          detail: `${isTRN ? 'โอนหนี้ให้ผู้ค้ำ' : 'โอนกลับผู้กู้'} เงินต้น ${fmt.money(transferPrincipal, 2)} + ดอกเบี้ย ${fmt.money(transferInterest, 2)}` +
                  (isTRN ? ` · เหตุ: ${exitReasonCode === 'E99' ? exitReasonOther : exit.label} · อัตรา ${appliedRate.toFixed(2)}%` : ''),
          by: 'จันทร์เพ็ญ มาลี' },
      ],
      enteredBy: 'จันทร์เพ็ญ มาลี', enteredAt: new Date().toISOString().slice(0, 19),
    };
    onSubmit(rec);
  };

  const moneyOrDash = (n) => n ? '฿ ' + fmt.money(n, 2) : '—';

  return (
    <div data-screen-label="หน้าทำรายการโอนหนี้ให้ผู้ค้ำ / โอนกลับผู้กู้">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <label className="gt-right-toggle" title="ผู้มีสิทธิ์พิเศษจึงแก้ไขยอดเงินต้น/ดอกเบี้ยได้">
          <input type="checkbox" checked={allowEdit} onChange={(e) => setAllowEdit(e.target.checked)} />
          แก้ไขยอด (สิทธิ์พิเศษ)
        </label>
        <button className="btn sm" onClick={() => setSearchOpen(true)}><Icon name="search" /> ค้นหาสัญญา</button>
        <button className="btn sm" onClick={recalcInterest}><Icon name="money" /> คำนวณดอกเบี้ย</button>
        <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
        <button className="btn sm" onClick={resetForm}><Icon name="refresh" /> ล้างค่า</button>
        <button className="btn sm" onClick={() => window.print()}><Icon name="print" /> พิมพ์</button>
      </div>

      {/* ── รายละเอียดสัญญาที่จะโอนหนี้ ── */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายละเอียดสัญญาที่จะทำการโอนหนี้</h3></div>
        <div className="gt-detail-grid">
          {/* แถว 1 */}
          <label className="gt-fld">
            <span className="label">เลขสัญญาผู้กู้ *</span>
            <div className="gt-search-input">
              <input className="cfg-input mono" readOnly value={contract ? contract.contractNo : ''}
                     placeholder="ค้นหาสัญญาผู้กู้…" onClick={() => setSearchOpen(true)} />
              <button type="button" className="gt-search-btn" onClick={() => setSearchOpen(true)} title="ค้นหาสัญญา"><Icon name="search" size={15} /></button>
            </div>
          </label>
          <label className="gt-fld">
            <span className="label">ประเภทการโอน *</span>
            <select className="cfg-input" value={transferType} onChange={(e) => setTransferType(e.target.value)} disabled={!contract}>
              {window.GT_TRANSFER_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </label>
          <label className="gt-fld">
            <span className="label">วันที่โอน *</span>
            <ErpDate value={transferDate} onChange={(v) => ((e) => setTransferDate(e.target.value))({ target: { value: v } })} disabled={!contract} className="cfg-input" />
          </label>
          <label className="gt-fld">
            <span className="label">สถานะกฎหมาย</span>
            <input className="cfg-input" readOnly tabIndex={-1} placeholder="—"
                   style={contract && contract.legalStatus === 'ดำเนินคดี' ? { color: 'var(--danger)', fontWeight: 600 } : undefined}
                   value={contract ? contract.legalStatus : ''} />
          </label>

          {/* แถว 2 */}
          <label className="gt-fld">
            <span className="label">รหัสสมาชิก *</span>
            <input className="cfg-input mono" readOnly tabIndex={-1} value={contract ? contract.borrowerCode : ''} placeholder="—" />
          </label>
          <label className="gt-fld">
            <span className="label">ประเภทเงินกู้ *</span>
            <input className="cfg-input" readOnly tabIndex={-1} value={contract ? contract.loanType : ''} placeholder="—" />
          </label>
          <label className="gt-fld">
            <span className="label">ประเภทสัญญา *</span>
            <input className="cfg-input" readOnly tabIndex={-1} value={contract ? contract.contractType : ''} placeholder="—" />
          </label>
          <label className="gt-fld">
            <span className="label">คิด ด/บ ล่าสุด</span>
            <input className="cfg-input mono" readOnly tabIndex={-1} value={contract ? fmt.date(contract.lastInterestDate) : ''} placeholder="—" />
          </label>

          {/* แถว 3 */}
          <label className="gt-fld">
            <span className="label">ชื่อ – นามสกุล *</span>
            <input className="cfg-input" readOnly tabIndex={-1} value={contract ? contract.borrowerName : ''} placeholder="—" />
          </label>
          <label className="gt-fld">
            <span className="label">โอนเงินต้น (P) <Icon name="info" size={11} /></span>
            <input type="number" className="cfg-input num" disabled={!contract || !allowEdit}
                   value={contract ? (principalOverride != null ? principalOverride : contract.principalRemaining) : ''}
                   onChange={(e) => setPrincipalOverride(e.target.value)} />
          </label>
          <label className="gt-fld">
            <span className="label">โอนดอกเบี้ย (I) <Icon name="info" size={11} /></span>
            <input type="number" className="cfg-input num" disabled={!contract || !allowEdit}
                   value={contract ? (interestOverride != null ? interestOverride : calcInterest) : ''}
                   onChange={(e) => setInterestOverride(e.target.value)} />
          </label>
          <label className="gt-fld">
            <span className="label">สถานะใบทำรายการ</span>
            <input className="cfg-input" readOnly tabIndex={-1} value={contract ? 'รอทำรายการ' : ''} placeholder="—" />
          </label>

          {/* แถว 4 */}
          <label className="gt-fld">
            <span className="label">ตั้งดอกเบี้ยค้างถึงวันที่ *</span>
            <ErpDate value={accrueToDate} onChange={(v) => ((e) => setAccrueToDate(e.target.value))({ target: { value: v } })} disabled={!contract} className="cfg-input" />
          </label>
          {isTRN ? (
            <div className="gt-fld gt-fld-span2">
              <span className="label">เหตุที่ผู้กู้ออก <span className="muted" style={{ fontWeight: 400 }}>(ดึงจากระบบทะเบียนสมาชิก)</span></span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="cfg-input" readOnly tabIndex={-1}
                       style={contract ? { fontWeight: 600, color: 'var(--brand-700, var(--primary))' } : undefined}
                       value={contract ? (exitInfo ? `${exitInfo.label} — สถานะสมาชิก: ${contract.borrowerStatus}` : `ไม่เข้าเงื่อนไข — สถานะ: ${contract.borrowerStatus}`) : ''}
                       placeholder="—" />
                {contract && exitInfo && exitInfo.special && <span className="chip warning" style={{ whiteSpace: 'nowrap' }}>สิทธิอัตราพิเศษ 3.50%</span>}
              </div>
            </div>
          ) : (
            <div className="gt-fld gt-fld-span2">
              <span className="label">เหตุที่ผู้กู้ออก</span>
              <input className="cfg-input" readOnly tabIndex={-1} value={contract ? '— ไม่ต้องระบุ (RTN โอนกลับผู้กู้) —' : ''} placeholder="—" />
            </div>
          )}
          <label className="gt-fld">
            <span className="label">อัตราดอกเบี้ย <Icon name="info" size={11} /></span>
            {isTRN ? (
              <select className="cfg-input" value={rateMode} onChange={(e) => setRateMode(e.target.value)} disabled={!contract}
                      style={(contract && rateMode !== 'orig') ? { color: 'var(--brand-700, var(--primary))', fontWeight: 600 } : undefined}>
                {window.GT_RATE_MODES.map(m => <option key={m.v} value={m.v}>{m.l}{m.v === 'orig' && contract ? ` (${contract.intRate.toFixed(2)}%)` : ''}</option>)}
              </select>
            ) : (
              <input className="cfg-input mono" readOnly tabIndex={-1} value={contract ? appliedRate.toFixed(2) + ' %' : ''} placeholder="—" />
            )}
          </label>
        </div>
      </div>

      {contract && (
        <>
          {/* ── ยอดก่อนทำรายการ ── */}
          <div className="search-card" style={{ marginBottom: 12 }}>
            <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ยอดก่อนทำรายการ</h3></div>
            <div className="summary-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', marginTop: 0 }}>
              <div className="summary-card">
                <div className="label">ต้นคงเหลือ</div>
                <div className="value">฿ {fmt.money(contract.principalRemaining, 2)}</div>
              </div>
              <div className="summary-card">
                <div className="label">ด/บ ค้าง (ถึงวันที่ตั้ง)</div>
                <div className="value">฿ {fmt.money(calcInterest, 2)}</div>
              </div>
              <div className="summary-card">
                <div className="label">ยอดชำระ / งวด</div>
                <div className="value">฿ {fmt.money(contract.installment, 2)}</div>
              </div>
              <div className="summary-card">
                <div className="label">งวดล่าสุด</div>
                <div className="value">{contract.lastPeriod} <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>({contract.paidTerms}/{contract.totalTerms})</span></div>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
              <Icon name="info" size={11} /> ระบบดึงยอดอัตโนมัติจากสัญญาเงินกู้ที่เลือก — ปรับแก้ได้เฉพาะผู้มีสิทธิ์พิเศษ
            </p>
          </div>

          {/* ── แจ้งเตือนเฉพาะ TRN ── */}
          {isTRN && (
            <div className="gt-warn-banner">
              <span className="gt-warn-ico"><Icon name="info" size={20} /></span>
              <div className="gt-warn-body">
                <h4>เฉพาะ TRN — ระบบดึง “เหตุที่ผู้กู้ออก” จากสถานะสมาชิกอัตโนมัติ</h4>
                <p>การโอนหนี้ให้ผู้ค้ำ (TRN) กรณีผู้กู้ <b>ตาย / ให้ออก / ไล่ออก / ปลดออก</b> ผู้ค้ำประกัน (สามี/ภรรยา/บุตร) จะได้รับอัตราดอกเบี้ย <b>3.50%</b></p>
                <p className="muted">(ประกาศอัตราดอกเบี้ยเงินกู้สำหรับผู้ค้ำประกันที่รับภาระชำระหนี้แทนผู้กู้ มีผล 01/07/2560)</p>
              </div>
            </div>
          )}
          {!isTRN && (
            <div className="gt-rate-note" style={{ marginBottom: 12 }}>
              <Icon name="info" size={13} />
              <span>ประเภท <b>RTN — โอนกลับผู้กู้</b>: ภาระหนี้จะถูกโอนกลับไปยังผู้กู้เดิม ({contract.borrowerName}) ไม่ต้องเลือกผู้ค้ำหรือระบุเหตุที่ผู้กู้ออก</span>
            </div>
          )}

          {/* ── รายการสัญญาผู้ค้ำประกัน ── */}
          {isTRN && (
            <div className="search-card" style={{ marginBottom: 12 }}>
              <div className="section-head" style={{ marginBottom: 12 }}>
                <span className="head-bar" /><h3>รายการสัญญาผู้ค้ำประกัน</h3>
                <span className="gc-count">{(contract.guarantors || []).length} ราย</span>
              </div>
              {(contract.guarantors || []).length === 0 ? (
                <div className="empty-state">ไม่มีผู้ค้ำประกันผูกกับสัญญานี้</div>
              ) : (
                <div className="table-wrap"><div className="table-scroll">
                  <table className="tbl gt-guar-tbl">
                    <thead>
                      <tr>
                        <th className="center" style={{ width: 44 }}>เลือก</th>
                        <th>เลขผู้ค้ำ</th>
                        <th>ชื่อผู้ค้ำ</th>
                        <th>เลขที่สัญญารับโอน</th>
                        <th className="center">วันที่คิดดอกเบี้ย</th>
                        <th className="num" style={{ width: 90 }}>%</th>
                        <th className="num">เงินต้นโอน</th>
                        <th className="num" style={{ width: 96 }}>อัตรา ด/บ %</th>
                        <th className="num" style={{ width: 110 }}>ดอกเบี้ย/งวด</th>
                        <th className="num" style={{ width: 110 }}>ชำระ / งวด</th>
                        <th className="center">ประเภทการส่ง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {computed.map((r, i) => {
                        const seqNo = r.checked
                          ? window.gtMakeContractNo(ctrPrefix, beYear, baseSeq + computed.slice(0, i + 1).filter(x => x.checked).length)
                          : '—';
                        return (
                          <tr key={r.code} className={r.checked ? 'selected' : ''}>
                            <td className="center">
                              <input type="checkbox" checked={r.checked} onChange={() => toggleRow(i)} />
                            </td>
                            <td className="mono">{r.code}</td>
                            <td>
                              <div style={{ whiteSpace: 'nowrap' }}>{r.name}</div>
                              <div className="muted" style={{ fontSize: 10 }}>{r.dept}{r.relation ? ` · ${r.relation}` : ''}</div>
                            </td>
                            <td className="mono" style={{ color: r.checked ? 'var(--brand-700, var(--primary))' : 'var(--text-muted)', fontWeight: r.checked ? 600 : 400 }}>{seqNo}</td>
                            <td className="center">
                              <ErpDate value={r.accrueDate} onChange={(v) => ((e) => setRowAccrue(i, e.target.value))({ target: { value: v } })} disabled={!r.checked} style={{ height: 28, width: 140 }} className="cfg-input" />
                            </td>
                            <td className="num">
                              <input type="number" className="cfg-input" style={{ height: 28, width: 72, textAlign: 'right' }} disabled={!r.checked}
                                     value={r.percent} onChange={(e) => setPercent(i, e.target.value)} />
                            </td>
                            <td className="num mono">{r.checked ? fmt.money(r.principal, 2) : '—'}</td>
                            <td className="num">
                              <input type="number" step="0.01" className="cfg-input" style={{ height: 28, width: 78, textAlign: 'right' }} disabled={!r.checked}
                                     value={r.ratePct} onChange={(e) => setRatePct(i, e.target.value)} />
                            </td>
                            <td className="num">
                              <input type="number" className="cfg-input mono" style={{ height: 28, width: 96, textAlign: 'right' }} disabled={!r.checked}
                                     value={r.checked ? r.intPerPeriod : ''} onChange={(e) => setIntPerPeriod(i, e.target.value)} />
                            </td>
                            <td className="num">
                              <input type="number" className="cfg-input mono" style={{ height: 28, width: 96, textAlign: 'right' }} disabled={!r.checked}
                                     value={r.checked ? r.perPeriod : ''} onChange={(e) => setPerPeriodEdit(i, e.target.value)} />
                            </td>
                            <td className="center">
                              <select className="cfg-input" style={{ height: 28, width: 92 }} disabled={!r.checked}
                                      value={r.sendType || 'principal'} onChange={(e) => setRowSend(i, e.target.value)}>
                                {window.GT_SEND_TYPES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5" className="right"><b>รวมผู้ค้ำที่เลือก {checkedRows.length} ราย</b></td>
                        <td className="num"><b style={{ color: Math.abs(sumPct - 100) < 0.01 ? undefined : 'var(--danger)' }}>{fmt.money(sumPct, 2)}%</b></td>
                        <td className="num mono"><b style={{ color: Math.abs(sumP - transferPrincipal) < 0.01 ? undefined : 'var(--danger)' }}>{fmt.money(sumP, 2)}</b></td>
                        <td colSpan="4" />
                      </tr>
                    </tfoot>
                  </table>
                </div></div>
              )}
              <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                <Icon name="info" size={11} /> ติ๊กเลือกผู้ค้ำที่ต้องรับโอนหนี้ แล้วกำหนดสัดส่วน (%) — ยอดเงินต้นและดอกเบี้ยจะถูกแบ่งตามสัดส่วน รวมต้องเท่ากับยอดที่โอน
              </p>
            </div>
          )}

          {/* ── การคำนวณดอกเบี้ยโอน ── */}
          {isTRN && checkedRows.length > 0 && (
            <div className="search-card" style={{ marginBottom: 12 }}>
              <div className="section-head" style={{ marginBottom: 12 }}>
                <span className="head-bar" /><h3>การคำนวณดอกเบี้ยโอน</h3>
                <span className="gc-count">{checkedRows.length} ราย</span>
              </div>
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl gt-int-tbl">
                  <thead>
                    <tr>
                      <th>ผู้ค้ำรับโอน</th>
                      <th className="center">ประเภทการส่ง</th>
                      <th className="center">วันที่คิดดอกเบี้ย</th>
                      <th className="num">ด/บ ปกติ</th>
                      <th className="num">ด/บ ค้าง</th>
                      <th className="num">ผ่อน ด/บ ค้าง</th>
                      <th className="num">รวม ด/บ</th>
                      <th className="center" style={{ width: 108 }}>Compute</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.filter(r => r.checked).map((r) => {
                      const normal = r.interest;
                      const arrears = 0;
                      const payArrears = 0;
                      const totalInt = Math.round((normal + arrears) * 100) / 100;
                      return (
                        <tr key={r.code}>
                          <td>
                            <div style={{ whiteSpace: 'nowrap' }}>{r.name}</div>
                            <div className="muted mono" style={{ fontSize: 10 }}>{r.code}</div>
                          </td>
                          <td className="center"><span className="chip">{window.gtSendType(r.sendType).l}</span></td>
                          <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(contract.lastInterestDate)} – {fmt.date(r.accrueDate || accrueToDate)}</td>
                          <td className="num mono">{fmt.money(normal, 2)}</td>
                          <td className="num mono">{fmt.money(arrears, 2)}</td>
                          <td className="num mono">{fmt.money(payArrears, 2)}</td>
                          <td className="num mono"><b>{fmt.money(totalInt, 2)}</b></td>
                          <td className="center"><span className="gt-compute">{fmt.money(totalInt, 2)}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="right"><b>รวมดอกเบี้ยที่ต้องโอน</b></td>
                      <td className="num mono"><b>{fmt.money(sumI, 2)}</b></td>
                      <td className="num mono"><b>0.00</b></td>
                      <td className="num mono"><b>0.00</b></td>
                      <td className="num mono"><b style={{ color: Math.abs(sumI - transferInterest) < 0.01 ? undefined : 'var(--danger)' }}>{fmt.money(sumI, 2)}</b></td>
                      <td className="center"><span className="gt-compute total">{fmt.money(sumI, 2)}</span></td>
                    </tr>
                  </tfoot>
                </table>
              </div></div>
              <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
                <Icon name="info" size={11} /> ดอกเบี้ยโอน = เงินต้นโอน × อัตรา {appliedRate.toFixed(2)}% × จำนวนวัน ({window.gtDaysBetween(contract.lastInterestDate, accrueToDate)} วัน) ÷ 365 — แยกให้ผู้ค้ำแต่ละรายตามยอดเงินต้นที่รับโอน
              </p>
            </div>
          )}

        </>
      )}

      {searchOpen && (
        <GtContractSearchModal
          onPick={(x) => { pickContract(window.gtContract(x.contractNo)); setSearchOpen(false); }}
          onClose={() => setSearchOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { GtTransferWorkspace, GtContractSearchModal });
