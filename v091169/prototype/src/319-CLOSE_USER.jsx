// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ปิดบัญชีเงินฝาก
//  ตรวจบัญชีผูกหักเงินเดือน (ปิดได้เฉพาะวันที่ 1–10 + ยืนยัน) ·
//  คำนวณดอกเบี้ยถึงวันปิด · หักภาษี ณ ที่จ่าย · ใบปิดบัญชี · ส่ง GL
// ════════════════════════════════════════════════════════════════════

const CLOSE_USER = 'จันทร์เพ็ญ มาลี';

function DepCloseAccountPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [acc, setAcc] = useState(null);
  const [closeDate, setCloseDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [method, setMethod] = useState('cash');
  const [confirmPayroll, setConfirmPayroll] = useState(false);
  const [approver, setApprover] = useState('');
  const [slip, setSlip] = useState(null);

  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const accType = cur ? (window.DEP_ACCTYPE_SEED || []).find(t => t.code === cur.typeCode) : null;

  // คำนวณดอกเบี้ยค้างรับถึงวันปิด (จากต้นปีถึงวันปิด)
  const accrued = useMemo(() => {
    if (!cur) return 0;
    const cd = new Date(closeDate);
    const yStart = new Date(cd.getFullYear(), 0, 1);
    const days = Math.max(0, Math.round((cd - yStart) / 86400000));
    return Math.round(cur.balance * (cur.rate / 100) * days / 365 * 100) / 100;
  }, [cur, closeDate]);
  const isFixed = cur && cur.typeCode.startsWith('F');
  const wht = isFixed ? Math.round(accrued * 0.15 * 100) / 100 : 0;
  const isFixedEarly = cur && isFixed && cur.maturityDate && cur.maturityDate > closeDate;
  const closeFee = isFixedEarly ? Math.round(cur.balance * 0.005 * 100) / 100 : 0;
  const netPay = cur ? cur.balance + accrued - wht - closeFee : 0;

  // กฎวันปิดบัญชีกรณีผูกหักเงินเดือน (เฉพาะวันที่ 1–10)
  const dom = new Date(closeDate).getDate();
  const payrollBlock = cur && cur.payrollLinked && (dom < 1 || dom > 10);
  const needConfirm = cur && cur.payrollLinked;
  const canSubmit = cur && reason.trim() && !payrollBlock && (!needConfirm || confirmPayroll);

  const submit = () => {
    const nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, status: 'closed', balance: 0 } : a);
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    const ledger = window.depTxnLoadLedger();
    const txId = window.depTxnNextId();
    window.depTxnSaveLedger([{ id: txId, date: closeDate, accNo: cur.accNo, member: cur.member, type: 'withdraw', channel: 'ปิดบัญชี', amount: netPay, balance: 0, ref: 'CLOSE', by: CLOSE_USER }, ...ledger]);

    audit.log({ action: 'update', module: 'เงินฝาก — ปิดบัญชี', target: `${cur.member} · ${cur.name}`,
      summary: `ปิดบัญชี ${cur.accNo} (${cur.type}) จ่ายสุทธิ ${fmt.money(netPay, 2)} บาท`,
      changes: [{ field: 'สถานะบัญชี', before: 'ใช้งาน', after: 'ปิดบัญชี' }, { field: 'ยอดจ่ายสุทธิ', before: '—', after: fmt.money(netPay, 2) }] });

    setSlip({
      title: 'ใบปิดบัญชีเงินฝาก', sub: `เลขที่รายการ ${txId} · ${fmt.date(closeDate)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ชื่อสมาชิก', v: `${cur.member} · ${cur.name}` },
        { k: 'ประเภทบัญชี', v: cur.type },
        { k: 'วันที่เปิด / ปิดบัญชี', v: `${fmt.date(cur.openDate)} → ${fmt.date(closeDate)}` },
        { k: 'ยอดเงินคงเหลือ', v: fmt.money(cur.balance, 2), mono: true },
        { k: 'ดอกเบี้ยค้างรับ', v: fmt.money(accrued, 2), mono: true },
        ...(wht ? [{ k: 'หักภาษี ณ ที่จ่าย (15%)', v: '− ' + fmt.money(wht, 2), mono: true }] : []),
        ...(closeFee ? [{ k: 'ค่าธรรมเนียมปิดก่อนกำหนด', v: '− ' + fmt.money(closeFee, 2), mono: true }] : []),
        { k: 'ยอดจ่ายสุทธิ', v: fmt.money(netPay, 2) + ' บาท', mono: true, strong: true },
        { k: 'ช่องทางจ่ายเงิน', v: window.DEP_WITHDRAW_METHODS.find(m => m.id === method)?.label },
        { k: 'เหตุผลการปิดบัญชี', v: reason.trim() },
      ],
      foot: 'เปลี่ยนสถานะบัญชีเป็น “ปิด” และส่งข้อมูลบัญชีไป GL แล้ว',
    });
    onToast && onToast(`ปิดบัญชี ${cur.accNo} เรียบร้อย — จ่ายสุทธิ ${fmt.money(netPay, 2)} บาท`);
    setAcc(null);
  };

  return (
    <div data-screen-label="หน้าปิดบัญชีเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปิดบัญชีเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>คำนวณดอกเบี้ยถึงวันปิด หักภาษี ณ ที่จ่าย และจ่ายยอดสุทธิ — บัญชีหักเงินเดือนปิดได้เฉพาะวันที่ 1–10</div>
        </div>
        <span className="spacer" />
        <div style={{ minWidth: 360 }}><DepAccountPicker accounts={accounts} value={acc} onSelect={(a) => { setAcc(a); setReason(''); setConfirmPayroll(false); setSlip(null); }} /></div>
      </div>

      {!cur ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 6 }}><Icon name="wallet" size={26} /></div>
          ค้นหาและเลือกบัญชีเงินฝากที่ต้องการปิด
        </div>
      ) : (
        <div className="dep-form-cols">
          <div className="dep-form-main">
            <DepAccountCard acc={cur} extra={<>
              <div className="dep-acc-f"><span className="k">วันที่เปิดบัญชี</span><span className="v mono">{fmt.date(cur.openDate)}</span></div>
              <div className="dep-acc-f"><span className="k">ดอกเบี้ยค้างรับ</span><span className="v mono">{fmt.money(accrued, 2)}</span></div>
            </>} />

            {cur.payrollLinked && (
              <div className="dat-warn" style={{ marginTop: 12, background: payrollBlock ? 'var(--danger-50)' : 'var(--warning-50)', borderColor: payrollBlock ? 'color-mix(in srgb, var(--danger) 28%, transparent)' : undefined, color: payrollBlock ? 'var(--danger)' : undefined }}>
                <Icon name="info" size={14} />
                <span>บัญชีนี้<b>มีการหักบัญชีรายเดือน (ผูกหักเงินเดือน)</b> — {payrollBlock ? <>ปิดบัญชีได้เฉพาะวันที่ 1–10 ของเดือนเท่านั้น (วันที่เลือก: {dom}) กรุณาเปลี่ยนวันที่ปิด</> : 'ต้องการยืนยันปิดบัญชีหรือไม่ — โปรดติ๊กยืนยันก่อนทำรายการ'}</span>
              </div>
            )}

            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <DepSecHead icon="edit" n="1" title="รายละเอียดการปิดบัญชี" />
              <div className="dat-grid">
                <DatFieldLite label="วันที่ปิดบัญชี"><ErpDate value={closeDate} onChange={(v) => ((e) => setCloseDate(e.target.value))({ target: { value: v } })} className="cfg-input mono" /></DatFieldLite>
                <DatFieldLite label="ช่องทางจ่ายเงิน">
                  <select className="cfg-input" value={method} onChange={(e) => setMethod(e.target.value)}>{window.DEP_WITHDRAW_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
                </DatFieldLite>
                <DatFieldLite label="เหตุผลการปิดบัญชี"><input className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น สมาชิกขอปิดบัญชี / ลาออก" /></DatFieldLite>
                <DatFieldLite label="ผู้อนุมัติ"><input className="cfg-input" value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="ชื่อผู้อนุมัติ" /></DatFieldLite>
              </div>
              {needConfirm && !payrollBlock && (
                <div style={{ padding: '0 16px 14px' }}>
                  <label className="dep-check"><input type="checkbox" checked={confirmPayroll} onChange={(e) => setConfirmPayroll(e.target.checked)} /><span><b>ยืนยัน</b> ปิดบัญชีที่มีการหักบัญชีรายเดือน</span></label>
                </div>
              )}
            </div>
          </div>

          {/* ── ขวา: สรุปจ่ายสุทธิ + ปุ่ม ── */}
          <div className="dep-form-side">
            <div className="dep-summary-card">
              <div className="dep-sum-row"><span>ยอดเงินคงเหลือ</span><span className="mono">{fmt.money(cur.balance, 2)}</span></div>
              <div className="dep-sum-row"><span>ดอกเบี้ยค้างรับ</span><span className="mono" style={{ color: 'var(--success)' }}>+ {fmt.money(accrued, 2)}</span></div>
              {wht > 0 && <div className="dep-sum-row"><span>ภาษีหัก ณ ที่จ่าย (15%)</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(wht, 2)}</span></div>}
              {closeFee > 0 && <div className="dep-sum-row"><span>ค่าธรรมเนียมปิดก่อนกำหนด</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(closeFee, 2)}</span></div>}
              <div className="dep-sum-row total"><span>ยอดจ่ายสุทธิ</span><span className="mono">{fmt.money(netPay, 2)}</span></div>
            </div>
            <div className="dep-submit-bar">
              <button className="btn block primary lg" disabled={!canSubmit} onClick={submit}><Icon name="lock" /> ปิดบัญชีและจ่ายเงิน</button>
              {slip && <button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบปิดบัญชี</button>}
            </div>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}><Icon name="info" size={11} /> ระบบคำนวณดอกเบี้ยถึงวันปิด หักภาษี ณ ที่จ่าย เปลี่ยนสถานะบัญชีเป็น “ปิด” และส่งข้อมูลไป GL อัตโนมัติ</p>
          </div>
        </div>
      )}

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepCloseAccountPage });
