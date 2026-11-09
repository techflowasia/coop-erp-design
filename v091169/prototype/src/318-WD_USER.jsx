// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ถอนเงิน
//  ตรวจยอดคงเหลือ/เงื่อนไขถอน · คิดค่าธรรมเนียมถอนเกินครั้ง · ค่าปรับ
//  ยกเว้นค่าธรรมเนียม (ถอนหลายรายการ) · พิมพ์ใบถอน/สมุด · ส่งบัญชี
// ════════════════════════════════════════════════════════════════════

const WD_USER = 'จันทร์เพ็ญ มาลี';

function DepWithdrawPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [acc, setAcc] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [exempt, setExempt] = useState(false);
  const [exemptReason, setExemptReason] = useState('');
  const [slip, setSlip] = useState(null);

  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const accType = cur ? (window.DEP_ACCTYPE_SEED || []).find(t => t.code === cur.typeCode) : null;
  const amtNum = Number(amount) || 0;

  // ค่าธรรมเนียมถอนเกินจำนวนครั้ง
  const overFree = cur ? cur.freeUsed >= (accType?.withdraw?.freeCount ?? cur.freeQuota ?? 0) : false;
  const feeBase = accType?.withdraw?.feeOver || 0;
  const fee = overFree && !exempt ? feeBase : 0;
  // ค่าปรับ (ถอนฝากประจำก่อนครบกำหนด)
  const isFixedEarly = cur && cur.typeCode.startsWith('F') && cur.maturityDate && cur.maturityDate > new Date().toISOString().slice(0, 10);
  const penalty = isFixedEarly ? Math.round(amtNum * 0.005 * 100) / 100 : 0;

  const newBal = cur ? cur.balance - amtNum - fee - penalty : 0;
  const minBal = accType?.cond?.minBalance || 0;
  const today = new Date().toISOString().slice(0, 10);

  const errors = [];
  if (cur && amtNum > cur.balance) errors.push('จำนวนเงินที่ถอนเกินยอดคงเหลือ');
  if (cur && amtNum > 0 && newBal < minBal && newBal >= 0) errors.push(`ถอนแล้วยอดคงเหลือต่ำกว่าขั้นต่ำ ${fmt.money(minBal, 0)} บาท`);
  if (cur && newBal < 0) errors.push('ยอดคงเหลือหลังหักค่าธรรมเนียม/ค่าปรับติดลบ');
  if (exempt && !exemptReason.trim()) errors.push('การยกเว้นค่าธรรมเนียมต้องระบุเหตุผล');
  const canSubmit = cur && amtNum > 0 && errors.length === 0;

  const reset = () => { setAmount(''); setExempt(false); setExemptReason(''); };

  const submit = () => {
    const nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, balance: newBal, freeUsed: a.freeUsed + 1 } : a);
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    const txId = window.depTxnNextId();
    const entry = { id: txId, date: today, accNo: cur.accNo, member: cur.member, type: 'withdraw', channel: window.DEP_WITHDRAW_METHODS.find(m => m.id === method)?.label, amount: amtNum, fee, penalty, balance: newBal, ref: 'WD', by: WD_USER };
    const nextLedger = [entry, ...ledger];
    setLedger(nextLedger); window.depTxnSaveLedger(nextLedger);

    audit.log({ action: 'create', module: 'เงินฝาก — ถอนเงิน', target: `${cur.member} · ${cur.name}`,
      summary: `ถอนเงิน ${fmt.money(amtNum, 2)} บาท จากบัญชี ${cur.accNo}` + (fee ? ` (ค่าธรรมเนียม ${fmt.money(fee, 2)})` : '') + (exempt ? ' · ยกเว้นค่าธรรมเนียม' : ''),
      changes: [{ field: 'ยอดคงเหลือ', before: fmt.money(cur.balance, 2), after: fmt.money(newBal, 2) },
                ...(exempt ? [{ field: 'ยกเว้นค่าธรรมเนียม', before: '—', after: exemptReason.trim() }] : [])] });

    setSlip({
      title: 'ใบถอนเงิน', sub: `เลขที่รายการ ${txId} · ${fmt.date(today)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ชื่อสมาชิก', v: `${cur.member} · ${cur.name}` },
        { k: 'ยอดคงเหลือก่อนถอน', v: fmt.money(cur.balance, 2), mono: true },
        { k: 'จำนวนเงินที่ถอน', v: fmt.money(amtNum, 2) + ' บาท', mono: true, strong: true },
        ...(fee ? [{ k: 'ค่าธรรมเนียมถอนเกินครั้ง', v: fmt.money(fee, 2), mono: true }] : []),
        ...(penalty ? [{ k: 'ค่าปรับถอนก่อนกำหนด', v: fmt.money(penalty, 2), mono: true }] : []),
        ...(exempt ? [{ k: 'ยกเว้นค่าธรรมเนียม', v: exemptReason.trim() }] : []),
        { k: 'ช่องทางการจ่าย', v: window.DEP_WITHDRAW_METHODS.find(m => m.id === method)?.label },
        { k: 'ยอดคงเหลือหลังถอน', v: fmt.money(newBal, 2) + ' บาท', mono: true, strong: true },
        { k: 'ผู้ทำรายการ', v: WD_USER },
      ],
      foot: (fee || penalty) ? 'ค่าธรรมเนียม/ค่าปรับแสดงเป็น Transaction แยกในสมุดคู่ฝาก · ส่งข้อมูลเข้าระบบบัญชีแล้ว' : 'ส่งข้อมูลเข้าระบบบัญชีแล้ว',
    });
    onToast && onToast(`ถอนเงิน ${fmt.money(amtNum, 2)} บาท จากบัญชี ${cur.accNo} เรียบร้อยแล้ว`);
    reset();
  };

  return (
    <div data-screen-label="หน้าถอนเงิน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ถอนเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ตรวจสอบยอดและเงื่อนไขการถอนตามประเภทบัญชี คำนวณค่าธรรมเนียม/ค่าปรับ และแสดงแยกในสมุดคู่ฝาก</div>
        </div>
        <span className="spacer" />
        <div style={{ minWidth: 360 }}><DepAccountPicker accounts={accounts} value={acc} onSelect={(a) => { setAcc(a); reset(); setSlip(null); }} /></div>
      </div>

      {!cur ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 6 }}><Icon name="wallet" size={26} /></div>
          ค้นหาและเลือกบัญชีเงินฝากเพื่อเริ่มถอนเงิน
        </div>
      ) : (
        <div className="dep-form-cols">
          <div className="dep-form-main">
            <DepAccountCard acc={cur} extra={<>
              <div className="dep-acc-f"><span className="k">ถอนฟรีคงเหลือ</span><span className="v mono">{Math.max(0, (accType?.withdraw?.freeCount ?? 0) - cur.freeUsed)} / {accType?.withdraw?.freeCount ?? 0} ครั้ง</span></div>
              <div className="dep-acc-f"><span className="k">ยอดคงเหลือขั้นต่ำ</span><span className="v mono">{fmt.money(minBal, 0)}</span></div>
            </>} />

            {isFixedEarly && (
              <div className="dat-warn" style={{ marginTop: 12 }}>
                <Icon name="info" size={14} />
                <span>บัญชีฝากประจำนี้<b>ยังไม่ครบกำหนด</b> (ครบ {fmt.date(cur.maturityDate)}) — การถอนก่อนกำหนดจะคิดค่าปรับเป็นส่วนต่างดอกเบี้ยและแสดงแยกในสมุดคู่ฝาก</span>
              </div>
            )}

            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <DepSecHead icon="upload" n="1" title="รายละเอียดการถอน" sub="จำนวนเงินและช่องทางการจ่าย" />
              <div style={{ padding: 16 }}>
                <div className="dat-grid" style={{ padding: 0 }}>
                  <DatFieldLite label="จำนวนเงินที่ถอน (บาท)"><input className="cfg-input mono" type="number" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ fontSize: 16, fontWeight: 600 }} /></DatFieldLite>
                  <DatFieldLite label="ช่องทางการจ่าย">
                    <div className="seg">{window.DEP_WITHDRAW_METHODS.map(m => <button key={m.id} type="button" className={"seg-btn" + (method === m.id ? ' active' : '')} onClick={() => setMethod(m.id)}>{m.label}</button>)}</div>
                  </DatFieldLite>
                </div>
                {overFree && (
                  <div className="dep-exempt">
                    <label className="dep-check"><input type="checkbox" checked={exempt} onChange={(e) => setExempt(e.target.checked)} /><span>ยกเว้นค่าธรรมเนียมถอนเกินครั้ง (กรณีถอนหลายรายการในคราวเดียว)</span></label>
                    {exempt && <input className="cfg-input" style={{ marginTop: 8 }} value={exemptReason} onChange={(e) => setExemptReason(e.target.value)} placeholder="เหตุผลการยกเว้น (บันทึก Audit Log)" />}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── ขวา: สรุปคำนวณ + ปุ่ม ── */}
          <div className="dep-form-side">
            <div className="dep-summary-card">
              <div className="dep-sum-row"><span>ยอดคงเหลือก่อนถอน</span><span className="mono">{fmt.money(cur.balance, 2)}</span></div>
              <div className="dep-sum-row"><span>จำนวนเงินที่ถอน</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(amtNum, 2)}</span></div>
              <div className="dep-sum-row"><span>ค่าธรรมเนียมถอนเกินครั้ง</span><span className="mono">{fee ? '− ' + fmt.money(fee, 2) : (overFree ? 'ยกเว้น' : '—')}</span></div>
              <div className="dep-sum-row"><span>ค่าปรับ</span><span className="mono">{penalty ? '− ' + fmt.money(penalty, 2) : '—'}</span></div>
              <div className="dep-sum-row total"><span>ยอดคงเหลือหลังถอน</span><span className="mono">{fmt.money(newBal, 2)}</span></div>
            </div>

            {errors.length > 0 && (
              <div className="dat-warn" style={{ marginTop: 0, background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
                <Icon name="info" size={14} /><div>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
              </div>
            )}

            <div className="dep-submit-bar">
              <button className="btn block primary lg" disabled={!canSubmit} onClick={submit}><Icon name="check" /> บันทึกการถอน</button>
              {slip && <><button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบถอน</button>
                <button className="btn block" onClick={() => onToast && onToast('พิมพ์สมุดคู่ฝาก — แสดงค่าปรับแยกชัดเจน')}><Icon name="print" /> พิมพ์สมุดคู่ฝาก</button></>}
            </div>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}><Icon name="info" size={11} /> หากทำรายการผิด ให้ยกเลิกรายการแล้วทำรายการใหม่ที่เมนู “ยกเลิกการทำรายการ”</p>
          </div>
        </div>
      )}

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepWithdrawPage });
