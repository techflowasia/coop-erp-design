// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — ประมวลผลวันครบกำหนด
//  รายการครบกำหนดรายวัน/รายเดือน + คำนวณเงินต้น+ผลตอบแทน +
//  บันทึกการไถ่ถอน + ปิดสถานะการลงทุน + บันทึกกำไร/ขาดทุน + ส่งบัญชี
// ════════════════════════════════════════════════════════════════════

// คำนวณดอกเบี้ยงวดสุดท้าย (ประมาณ) จากเงินต้น × อัตรา × สัดส่วนงวด
function mtLastCoupon(p) {
  if (p.accrued) return p.accrued;
  const principal = p.faceValue || p.investAmount || 0;
  const months = p.couponFreq === 'รายเดือน' ? 1 : p.couponFreq === 'ราย 3 เดือน' ? 3 : p.couponFreq === 'ราย 6 เดือน' ? 6 : 12;
  return Math.round(principal * (p.couponRate / 100) * (months / 12));
}

// ─── โมดัลบันทึกการไถ่ถอน ─────────────────────────────────────────────
function RedeemModal({ p, onClose, onSave }) {
  const principal = p.faceValue || p.investAmount || 0;
  const coupon0 = mtLastCoupon(p);
  const [coupon, setCoupon] = useState(String(coupon0));
  const [tax, setTax] = useState('0');
  const [fee, setFee] = useState('0');
  const [method, setMethod] = useState('โอนเข้าบัญชี');
  const [bank, setBank] = useState(window.COOP_BANK_ACCOUNTS[0].short + ' ' + window.COOP_BANK_ACCOUNTS[0].accountNo);
  const [note, setNote] = useState('');

  const c = Number(coupon || 0), tx = Number(tax || 0), f = Number(fee || 0);
  const net = principal + c - tx - f;
  const gain = (principal + c) - (p.investAmount || 0) - f - tx;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="calendar" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>บันทึกการไถ่ถอน (ครบกำหนด)</h2>
            <div className="muted" style={{ fontSize: 11 }}>{p.id} · {p.securityName}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="iv-recv-head">
            <div><span className="iv-recv-k">วันที่ครบกำหนด</span><span className="iv-recv-v">{fmt.date(p.maturityDate)}</span></div>
            <div><span className="iv-recv-k">เงินต้น (มูลค่าหน้าตั๋ว)</span><span className="iv-recv-v mono">{fmt.money(principal, 2)}</span></div>
          </div>
          <div className="iv-form-grid c2" style={{ marginTop: 10 }}>
            <IvField label="ดอกเบี้ยงวดสุดท้าย"><IvMoneyInput value={coupon} onChange={setCoupon} /></IvField>
            <IvField label="ภาษีหัก ณ ที่จ่าย"><IvMoneyInput value={tax} onChange={setTax} /></IvField>
            <IvField label="ค่าธรรมเนียม"><IvMoneyInput value={fee} onChange={setFee} /></IvField>
            <IvField label="วิธีรับเงิน">
              <select className="cfg-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>โอนเข้าบัญชี</option><option>เช็ค</option><option>ลงทุนต่อ (Roll over)</option>
              </select>
            </IvField>
            <IvField label="บัญชีธนาคารรับเงิน" span={2}>
              <select className="cfg-input" value={bank} onChange={(e) => setBank(e.target.value)}>
                {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.short + ' ' + b.accountNo}>{b.bank} · {b.accountNo}</option>)}
              </select>
            </IvField>
            <IvField label="หมายเหตุ" span={2}>
              <input className="cfg-input" value={note} placeholder="เช่น ไถ่ถอนครบกำหนดตามปกติ" onChange={(e) => setNote(e.target.value)} />
            </IvField>
          </div>
          <div className="iv-net-box">
            <div className="iv-net-row"><span>ยอดรับสุทธิ</span><span className="mono"><b>{fmt.money(net, 2)}</b></span></div>
            <div className="iv-net-row"><span>กำไร/ขาดทุนจากการลงทุน</span>
              <span className={"mono " + (gain >= 0 ? 'iv-pos' : 'iv-neg')}>{(gain >= 0 ? '+' : '−') + ' ' + fmt.money(Math.abs(gain), 2)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => onSave(p, { principal, coupon: c, tax: tx, fee: f, net, gain, method, bank, note })}>
              <Icon name="check" /> บันทึกไถ่ถอน & ปิดสถานะ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MaturityProcessPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [port, setPort] = useState(window.ivLoadPort);
  const [redeem, setRedeem] = useState(null);
  const [period, setPeriod] = useState('90');   // '30' | '90' | 'month' | 'all'
  const [month, setMonth] = useState('2026-06');

  const matItems = port.filter(p => p.maturityDate && (p.status === 'active' || p.status === 'matured'))
    .sort((a, b) => (a.maturityDate < b.maturityDate ? -1 : 1));

  const inPeriod = matItems.filter(p => {
    if (period === 'all') return true;
    if (period === 'month') return p.maturityDate.startsWith(month);
    const d = window.ivDaysToMaturity(p.maturityDate);
    if (period === '30') return d <= 30;
    if (period === '90') return d <= 90;
    return true;
  });

  const persist = (next) => { setPort(next); window.ivSavePort(next); };
  const handleRedeem = (p, calc) => {
    const next = port.map(x => x.id === p.id ? { ...x, status: 'matured', currentValue: calc.net, accrued: 0 } : x);
    persist(next);
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ประมวลผลครบกำหนด',
      target: `${p.id} · ${p.securityName}`,
      summary: `ไถ่ถอนครบกำหนด รับสุทธิ ${fmt.money(calc.net, 0)} บาท (กำไร/ขาดทุน ${fmt.money(calc.gain, 0)})`,
      changes: [{ field: 'สถานะ', before: 'Active', after: 'ครบกำหนด' }] });
    setRedeem(null);
    onToast && onToast(`ไถ่ถอน ${p.id} เรียบร้อย · ปิดสถานะการลงทุน · ส่งรายการบัญชีแล้ว`);
  };

  const activeMat = inPeriod.filter(p => p.status === 'active');
  const principalSum = activeMat.reduce((a, p) => a + (p.faceValue || p.investAmount || 0), 0);
  const couponSum = activeMat.reduce((a, p) => a + mtLastCoupon(p), 0);
  const overdueCnt = activeMat.filter(p => window.ivDaysToMaturity(p.maturityDate) < 0).length;

  return (
    <div data-screen-label="หน้าประมวลผลวันครบกำหนด">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลวันครบกำหนด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            รายการลงทุนที่ครบกำหนด — คำนวณเงินต้นและผลตอบแทน บันทึกการไถ่ถอน ปิดสถานะ และส่งรายการบัญชี
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายการครบกำหนดเป็น Excel แล้ว')}><Icon name="download" /> Export</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
        <IvStat label="รายการรอไถ่ถอน" value={activeMat.length + ' รายการ'} sub={'ในช่วงที่เลือก'} accent />
        <IvStat label="เงินต้นรวม" value={'฿ ' + fmt.money(principalSum, 0)} sub="ที่จะได้รับคืน" />
        <IvStat label="ดอกเบี้ยงวดสุดท้ายรวม" value={'฿ ' + fmt.money(couponSum, 0)} sub="ประมาณการ" tone="warning" />
        <IvStat label="เลยกำหนดแล้ว" value={overdueCnt + ' รายการ'} sub="ต้องเร่งประมวลผล" tone={overdueCnt ? 'danger' : undefined} />
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="seg">
            <button className={"seg-btn" + (period === '30' ? ' active' : '')} onClick={() => setPeriod('30')}>ภายใน 30 วัน</button>
            <button className={"seg-btn" + (period === '90' ? ' active' : '')} onClick={() => setPeriod('90')}>ภายใน 90 วัน</button>
            <button className={"seg-btn" + (period === 'month' ? ' active' : '')} onClick={() => setPeriod('month')}>รายเดือน</button>
            <button className={"seg-btn" + (period === 'all' ? ' active' : '')} onClick={() => setPeriod('all')}>ทั้งหมด</button>
          </div>
          {period === 'month' && <input className="filter-select" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11 }}>{inPeriod.length} รายการ</span>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1120 }}>
            <thead><tr>
              <th style={{ width: 124 }}>เลขที่</th>
              <th style={{ minWidth: 200 }}>หลักทรัพย์</th>
              <th style={{ width: 150 }}>วันครบกำหนด</th>
              <th className="right" style={{ width: 130 }}>เงินต้น</th>
              <th className="right" style={{ width: 130 }}>ดบ.งวดสุดท้าย</th>
              <th className="right" style={{ width: 130 }}>ยอดรับสุทธิ (ประมาณ)</th>
              <th className="center" style={{ width: 100 }}>สถานะ</th>
              <th className="center" style={{ width: 120 }} />
            </tr></thead>
            <tbody>
              {inPeriod.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 30 }}>ไม่มีรายการครบกำหนดในช่วงที่เลือก</td></tr>}
              {inPeriod.map(p => {
                const principal = p.faceValue || p.investAmount || 0;
                const coupon = mtLastCoupon(p);
                return (
                  <tr key={p.id} className={p.status === 'matured' ? '' : 'clickable'} onClick={() => p.status === 'active' && setRedeem(p)}>
                    <td className="mono">{p.id}</td>
                    <td><div className="lt-row-name">{p.securityName}</div><div className="lt-row-note muted mono">{p.securityCode}</div></td>
                    <td><IvMaturityTag iso={p.maturityDate} /></td>
                    <td className="right mono">{fmt.money(principal, 0)}</td>
                    <td className="right mono">{fmt.money(coupon, 0)}</td>
                    <td className="right mono"><b>{fmt.money(principal + coupon, 0)}</b></td>
                    <td className="center">{p.status === 'matured' ? <span className="pill neutral">ไถ่ถอนแล้ว</span> : <span className="pill warn">รอไถ่ถอน</span>}</td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {p.status === 'matured'
                        ? <span className="muted" style={{ fontSize: 11 }}>ปิดสถานะแล้ว</span>
                        : <button className="btn primary sm" onClick={() => setRedeem(p)}><Icon name="check" size={12} /> ไถ่ถอน</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> การบันทึกไถ่ถอนจะคำนวณเงินต้น+ดอกเบี้ยงวดสุดท้าย หักภาษี/ค่าธรรมเนียม บันทึกกำไร/ขาดทุน ปิดสถานะการลงทุน และส่งรายการเข้าบัญชี
      </div>

      {redeem && <RedeemModal p={redeem} onClose={() => setRedeem(null)} onSave={handleRedeem} />}
    </div>
  );
}

Object.assign(window, { MaturityProcessPage });
