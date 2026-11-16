// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — รับฝากเงิน
//  หลายช่องทาง (เงินสด/เช็ค/โอน/Counter/Bill/เงินกู้/ตัวแทน)
//  ตรวจการผูกบัญชี · พิมพ์ใบรับฝาก/สมุด · ส่งระบบบัญชี · ประวัติภายในวัน
// ════════════════════════════════════════════════════════════════════

const DEP_USER = 'จันทร์เพ็ญ มาลี';

function DepDepositPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [acc, setAcc] = useState(null);
  const [channel, setChannel] = useState('cash');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [ref, setRef] = useState('');
  const [srcBank, setSrcBank] = useState('');
  const [slip, setSlip] = useState(null);

  const CH = window.DEP_DEPOSIT_CHANNELS;
  const ch = CH.find(c => c.id === channel);
  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const amtNum = Number(amount) || 0;
  const feeNum = Number(fee) || 0;
  const newBal = cur ? cur.balance + amtNum : 0;
  const today = new Date().toISOString().slice(0, 10);
  const todays = cur ? ledger.filter(l => l.accNo === cur.accNo && l.date === today) : [];

  const noAcc = !cur;
  const needBankWarn = cur && ['transfer', 'counter', 'bill'].includes(channel) && cur.bankLinkStatus !== 'linked';
  const canSubmit = cur && amtNum > 0 && (!ch.needRef || ref.trim());

  const reset = () => { setAmount(''); setFee(''); setRef(''); setSrcBank(''); };

  const submit = () => {
    const nb = cur.balance + amtNum;
    const nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, balance: nb } : a);
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    const txId = window.depTxnNextId();
    const entry = { id: txId, date: today, accNo: cur.accNo, member: cur.member, type: 'deposit', channel: ch.label, amount: amtNum, fee: feeNum, balance: nb, ref: ref.trim() || '—', srcBank, by: DEP_USER };
    const nextLedger = [entry, ...ledger];
    setLedger(nextLedger); window.depTxnSaveLedger(nextLedger);

    audit.log({ action: 'create', module: 'เงินฝาก — รับฝาก', target: `${cur.member} · ${cur.name}`,
      summary: `รับฝาก ${ch.label} ${fmt.money(amtNum, 2)} บาท เข้าบัญชี ${cur.accNo}`,
      changes: [{ field: 'ยอดคงเหลือ', before: fmt.money(cur.balance, 2), after: fmt.money(nb, 2) }] });

    setSlip({
      title: 'ใบรับฝากเงิน', sub: `เลขที่รายการ ${txId} · ${fmt.date(today)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ชื่อสมาชิก', v: `${cur.member} · ${cur.name}` },
        { k: 'ประเภทบัญชี', v: cur.type },
        { k: 'ช่องทางฝาก', v: ch.label },
        ...(ref.trim() ? [{ k: 'เลขที่อ้างอิง', v: ref.trim(), mono: true }] : []),
        ...(srcBank ? [{ k: 'ธนาคารต้นทาง', v: srcBank }] : []),
        { k: 'จำนวนเงินฝาก', v: fmt.money(amtNum, 2) + ' บาท', mono: true, strong: true },
        ...(feeNum ? [{ k: 'ค่าธรรมเนียม', v: fmt.money(feeNum, 2) + ' บาท', mono: true }] : []),
        { k: 'ยอดคงเหลือ', v: fmt.money(nb, 2) + ' บาท', mono: true, strong: true },
        { k: 'ผู้ทำรายการ', v: DEP_USER },
      ],
      foot: 'ส่งข้อมูลเข้าระบบบัญชีอัตโนมัติ · สถานะรายการ: สมบูรณ์',
    });
    onToast && onToast(`รับฝาก ${fmt.money(amtNum, 2)} บาท เข้าบัญชี ${cur.accNo} เรียบร้อยแล้ว`);
    reset();
  };

  return (
    <div data-screen-label="หน้ารับฝากเงิน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับฝากเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>รับฝากหลายช่องทาง — เงินสด เช็ค เงินโอน Counter Service Bill Payment และโอนจากระบบอื่น</div>
        </div>
        <span className="spacer" />
        <div style={{ minWidth: 360 }}><DepAccountPicker accounts={accounts} value={acc} onSelect={(a) => { setAcc(a); reset(); setSlip(null); }} /></div>
      </div>

      <div className="dep-form-cols">
          <div className="dep-form-main">
            {cur ? <DepAccountCard acc={cur} /> : (
              <div className="search-card" style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="dat-section-ico"><Icon name="wallet" size={16} /></span>
                <div>
                  <div style={{ fontWeight: 600 }}>ยังไม่ได้เลือกบัญชีเงินฝาก</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>ค้นหาและเลือกบัญชีจากช่องค้นหาด้านบน เพื่อเริ่มทำรายการรับฝาก</div>
                </div>
              </div>
            )}
            {needBankWarn && (
              <div className="dat-warn" style={{ marginTop: 12 }}>
                <Icon name="info" size={14} />
                <span>บัญชีธนาคารของสมาชิกยัง<b>ไม่ได้ผูกในระบบ</b> (สถานะ: {cur.bankLinkStatus === 'pending' ? 'รอตรวจสอบ' : 'ยังไม่ผูก'}) — ตรวจสอบการผูกบัญชีก่อนรับฝากผ่านช่องทางโอน</span>
              </div>
            )}

            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <DepSecHead icon="download" n="1" title="รายละเอียดการฝาก" sub="เลือกช่องทางและจำนวนเงิน" />
              <div style={{ padding: 16 }}>
                <label className="dat-label" style={{ marginBottom: 6, display: 'block' }}>ช่องทางฝาก</label>
                <div className="dep-chan-grid">
                  {CH.map(c => (
                    <button key={c.id} className={"dep-chan" + (channel === c.id ? ' active' : '')} disabled={noAcc} onClick={() => { setChannel(c.id); if (!c.needRef) { setRef(''); setSrcBank(''); } }}>{c.label}</button>
                  ))}
                </div>
                <div className="dat-grid" style={{ padding: 0, marginTop: 14 }}>
                  <DatFieldLite label="จำนวนเงินฝาก (บาท)"><input className="cfg-input mono" type="number" value={amount} autoFocus={!noAcc} disabled={noAcc} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ fontSize: 16, fontWeight: 600 }} /></DatFieldLite>
                  <DatFieldLite label="ค่าธรรมเนียม (ถ้ามี)"><input className="cfg-input mono" type="number" value={fee} disabled={noAcc} onChange={(e) => setFee(e.target.value)} placeholder="0.00" /></DatFieldLite>
                  {ch.needRef && <DatFieldLite label="เลขที่อ้างอิงการโอน"><input className="cfg-input mono" value={ref} disabled={noAcc} onChange={(e) => setRef(e.target.value)} placeholder="REF / เลขที่เช็ค" /></DatFieldLite>}
                  {(channel === 'transfer' || channel === 'counter' || channel === 'bill') && (
                    <DatFieldLite label="ธนาคารต้นทาง">
                      <select className="cfg-input" value={srcBank} disabled={noAcc} onChange={(e) => setSrcBank(e.target.value)}>
                        <option value="">— เลือกธนาคาร —</option>{window.DEP_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </DatFieldLite>
                  )}
                </div>
              </div>
            </div>

            {/* ประวัติภายในวัน */}
            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <div className="dat-section-head"><span className="dat-section-ico"><Icon name="history" size={15} /></span><div><div className="dat-section-title">รายการฝากภายในวันของบัญชีนี้</div><div className="muted" style={{ fontSize: 11.5 }}>{todays.length} รายการ · {fmt.date(today)}</div></div></div>
              <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
                <table className="tbl"><thead><tr><th>เลขที่รายการ</th><th>ช่องทาง</th><th className="num">จำนวนเงิน</th><th className="num">คงเหลือ</th><th>ผู้ทำรายการ</th></tr></thead>
                  <tbody>
                    {todays.length === 0 ? <tr><td colSpan="5" className="center muted" style={{ padding: 18 }}>ยังไม่มีรายการภายในวัน</td></tr> :
                      todays.map(l => <tr key={l.id}><td className="mono">{l.id}</td><td>{l.channel}</td><td className="num" style={{ color: 'var(--success)', fontWeight: 600 }}>+ {fmt.money(l.amount, 2)}</td><td className="num mono">{fmt.money(l.balance, 2)}</td><td>{l.by}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── ขวา: สรุป + ปุ่ม ── */}
          <div className="dep-form-side">
            <div className="dep-summary-card">
              <div className="dep-sum-row"><span>ยอดคงเหลือเดิม</span><span className="mono">{fmt.money(cur ? cur.balance : 0, 2)}</span></div>
              <div className="dep-sum-row"><span>จำนวนเงินฝาก</span><span className="mono" style={{ color: 'var(--success)' }}>+ {fmt.money(amtNum, 2)}</span></div>
              {feeNum > 0 && <div className="dep-sum-row"><span>ค่าธรรมเนียม</span><span className="mono">{fmt.money(feeNum, 2)}</span></div>}
              <div className="dep-sum-row total"><span>ยอดคงเหลือใหม่</span><span className="mono">{fmt.money(newBal, 2)}</span></div>
            </div>
            <div className="dep-submit-bar">
              <button className="btn block primary lg" disabled={!canSubmit} onClick={submit}><Icon name="check" /> บันทึกรับฝาก</button>
              {slip && <><button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบรับฝาก</button>
                <button className="btn block" onClick={() => onToast && onToast('พิมพ์สมุดคู่ฝาก — เฉพาะรายการที่ยังไม่ได้พิมพ์')}><Icon name="print" /> พิมพ์สมุดคู่ฝาก</button></>}
            </div>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
              <Icon name="info" size={11} /> หากทำรายการผิด ให้ยกเลิกรายการแล้วทำรายการใหม่ที่เมนู “ยกเลิกการทำรายการ” — ระบบเก็บ Audit Trail ครบถ้วน
            </p>
          </div>
        </div>

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepDepositPage });
