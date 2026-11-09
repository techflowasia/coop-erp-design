// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — โอนเงินระหว่างบัญชี
//  เลือกบัญชีต้นทาง/ปลายทาง · ตรวจยอด · โอน · พิมพ์สลิป · ส่งบัญชี
// ════════════════════════════════════════════════════════════════════

function DepTransferPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [src, setSrc] = useState(null);
  const [dst, setDst] = useState(null);
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [note, setNote] = useState('');
  const [slip, setSlip] = useState(null);

  const curSrc = src ? accounts.find(a => a.accNo === src.accNo) || src : null;
  const curDst = dst ? accounts.find(a => a.accNo === dst.accNo) || dst : null;
  const amtNum = Number(amount) || 0;
  const feeNum = Number(fee) || 0;
  const today = window.DEP_OPS_TODAY;

  const sameAcc = curSrc && curDst && curSrc.accNo === curDst.accNo;
  const crossMember = curSrc && curDst && curSrc.member !== curDst.member;
  const overBalance = curSrc && (amtNum + feeNum) > curSrc.balance;
  const canSubmit = curSrc && curDst && !sameAcc && amtNum > 0 && !overBalance;

  const reset = () => { setAmount(''); setFee(''); setNote(''); };

  const submit = () => {
    const srcNew = curSrc.balance - amtNum - feeNum;
    const dstNew = curDst.balance + amtNum;
    const next = accounts.map(a =>
      a.accNo === curSrc.accNo ? { ...a, balance: srcNew } :
      a.accNo === curDst.accNo ? { ...a, balance: dstNew } : a);
    setAccounts(next); window.depTxnSaveAccounts(next);

    const idOut = window.depTxnNextId();
    const idIn = window.depTxnNextId();
    const eOut = { id: idOut, date: today, accNo: curSrc.accNo, member: curSrc.member, type: 'transfer-out',
      channel: 'โอนระหว่างบัญชี', amount: amtNum, fee: feeNum, balance: srcNew, ref: curDst.accNo, by: window.DEP_OPS_USER };
    const eIn = { id: idIn, date: today, accNo: curDst.accNo, member: curDst.member, type: 'transfer-in',
      channel: 'โอนระหว่างบัญชี', amount: amtNum, fee: 0, balance: dstNew, ref: curSrc.accNo, by: window.DEP_OPS_USER };
    const nextL = [eIn, eOut, ...ledger];
    setLedger(nextL); window.depTxnSaveLedger(nextL);

    audit.log({ action: 'create', module: 'เงินฝาก — โอนระหว่างบัญชี', target: `${curSrc.accNo} → ${curDst.accNo}`,
      summary: `โอน ${fmt.money(amtNum, 2)} บาท จาก ${curSrc.accNo} ไป ${curDst.accNo}`,
      changes: [
        { field: `ยอด ${curSrc.accNo}`, before: fmt.money(curSrc.balance, 2), after: fmt.money(srcNew, 2) },
        { field: `ยอด ${curDst.accNo}`, before: fmt.money(curDst.balance, 2), after: fmt.money(dstNew, 2) },
      ] });

    setSlip({
      title: 'ใบโอนเงินระหว่างบัญชี', sub: `เลขที่รายการ ${idOut} · ${fmt.date(today)}`,
      rows: [
        { k: 'บัญชีต้นทาง', v: `${curSrc.accNo} · ${curSrc.type}`, mono: true },
        { k: 'บัญชีปลายทาง', v: `${curDst.accNo} · ${curDst.type}`, mono: true },
        { k: 'ชื่อสมาชิก', v: `${curSrc.name}` + (crossMember ? ` → ${curDst.name}` : '') },
        ...(note.trim() ? [{ k: 'หมายเหตุ', v: note.trim() }] : []),
        { k: 'จำนวนเงินโอน', v: fmt.money(amtNum, 2) + ' บาท', mono: true, strong: true },
        ...(feeNum ? [{ k: 'ค่าธรรมเนียม', v: fmt.money(feeNum, 2) + ' บาท', mono: true }] : []),
        { k: 'คงเหลือต้นทาง', v: fmt.money(srcNew, 2) + ' บาท', mono: true },
        { k: 'คงเหลือปลายทาง', v: fmt.money(dstNew, 2) + ' บาท', mono: true },
        { k: 'ผู้ทำรายการ', v: window.DEP_OPS_USER },
      ],
      foot: 'ส่งข้อมูลเข้าระบบบัญชีอัตโนมัติ · รายการโอนภายในสหกรณ์',
    });
    onToast && onToast(`โอน ${fmt.money(amtNum, 2)} บาท จาก ${curSrc.accNo} ไป ${curDst.accNo} เรียบร้อยแล้ว`);
    reset();
  };

  return (
    <div data-screen-label="หน้าโอนเงินระหว่างบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>โอนเงินระหว่างบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>โอนเงินระหว่างบัญชีเงินฝากภายในสหกรณ์ — บัญชีเดียวกันของสมาชิก หรือข้ามสมาชิก</div>
        </div>
      </div>

      <div className="dep-form-cols">
        <div className="dep-form-main">
          <div className="search-card dat-section">
            <DepSecHead icon="refresh" n="1" title="เลือกบัญชีต้นทางและปลายทาง" sub="ค้นหาด้วยเลขที่บัญชี รหัสสมาชิก หรือชื่อ" />
            <div style={{ padding: 16, display: 'grid', gap: 14 }}>
              <DatFieldLite label="บัญชีต้นทาง (โอนออก)">
                <DepAccountPicker accounts={accounts} value={src} onSelect={(a) => { setSrc(a); setSlip(null); }} placeholder="เลือกบัญชีต้นทาง" />
              </DatFieldLite>
              {curSrc && <DepAccountCard acc={curSrc} />}
              <div className="dep-transfer-arrow"><Icon name="chevDown" size={18} /></div>
              <DatFieldLite label="บัญชีปลายทาง (รับโอน)">
                <DepAccountPicker accounts={accounts} value={dst} onSelect={(a) => { setDst(a); setSlip(null); }} placeholder="เลือกบัญชีปลายทาง" />
              </DatFieldLite>
              {curDst && <DepAccountCard acc={curDst} />}
            </div>
          </div>

          {curSrc && curDst && (
            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <DepSecHead icon="money" n="2" title="จำนวนเงินที่โอน" sub="ระบุจำนวนเงินและค่าธรรมเนียม (ถ้ามี)" />
              <div className="dat-grid" style={{ padding: 16 }}>
                <DatFieldLite label="จำนวนเงินโอน (บาท)">
                  <input className="cfg-input mono" type="number" value={amount} autoFocus onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ fontSize: 16, fontWeight: 600 }} />
                </DatFieldLite>
                <DatFieldLite label="ค่าธรรมเนียม (ถ้ามี)">
                  <input className="cfg-input mono" type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" />
                </DatFieldLite>
                <DatFieldLite label="หมายเหตุ">
                  <input className="cfg-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น โอนเข้าฝากประจำ" />
                </DatFieldLite>
              </div>
              {sameAcc && <div className="dep-error" style={{ margin: '0 16px 14px' }}><Icon name="info" size={13} /> บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน</div>}
              {overBalance && <div className="dep-error" style={{ margin: '0 16px 14px' }}><Icon name="info" size={13} /> ยอดเงินในบัญชีต้นทางไม่เพียงพอ (รวมค่าธรรมเนียม {fmt.money(amtNum + feeNum, 2)} บาท)</div>}
              {crossMember && !sameAcc && <div className="dat-warn" style={{ margin: '0 16px 14px' }}><Icon name="info" size={14} /> <span>เป็นการโอน<b>ข้ามสมาชิก</b> ({curSrc.name} → {curDst.name}) — โปรดตรวจสอบความถูกต้องก่อนยืนยัน</span></div>}
            </div>
          )}
        </div>

        <div className="dep-form-side">
          <div className="dep-summary-card">
            <div className="dep-sum-row"><span>ต้นทาง คงเหลือเดิม</span><span className="mono">{curSrc ? fmt.money(curSrc.balance, 2) : '—'}</span></div>
            <div className="dep-sum-row"><span>จำนวนเงินโอน</span><span className="mono" style={{ color: 'var(--danger)' }}>- {fmt.money(amtNum, 2)}</span></div>
            {feeNum > 0 && <div className="dep-sum-row"><span>ค่าธรรมเนียม</span><span className="mono">- {fmt.money(feeNum, 2)}</span></div>}
            <div className="dep-sum-row total"><span>ต้นทาง คงเหลือใหม่</span><span className="mono">{curSrc ? fmt.money(curSrc.balance - amtNum - feeNum, 2) : '—'}</span></div>
            <div className="dep-sum-row" style={{ marginTop: 6 }}><span>ปลายทาง คงเหลือใหม่</span><span className="mono" style={{ color: 'var(--success)' }}>{curDst ? fmt.money(curDst.balance + amtNum, 2) : '—'}</span></div>
          </div>
          <div className="dep-submit-bar">
            <button className="btn block primary lg" disabled={!canSubmit} onClick={submit}><Icon name="check" /> บันทึกการโอน</button>
            {slip && <button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบโอน</button>}
          </div>
          <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
            <Icon name="info" size={11} /> รายการโอนสร้างคู่บัญชี โอนออก/โอนเข้า อัตโนมัติ และเก็บ Audit Trail ครบถ้วน
          </p>
        </div>
      </div>

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepTransferPage });
