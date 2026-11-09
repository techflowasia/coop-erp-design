// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — บันทึกขายเงินลงทุนก่อนครบกำหนด
//  เลือกหลักทรัพย์ที่ถืออยู่ → คำนวณกำไร/ขาดทุน → ตรวจสอบสิทธิ์การขาย →
//  แนบเอกสารอนุมัติ → เปลี่ยนสถานะสินทรัพย์ → ส่งบัญชีอัตโนมัติ
// ════════════════════════════════════════════════════════════════════

function slSaleValue(p, sellPrice) {
  const sp = Number(sellPrice || 0);
  if (p.faceValue) return p.faceValue * sp / 100;     // ตราสารหนี้: ราคา = % ของมูลค่าหน้าตั๋ว
  return (p.units || 0) * sp;                          // หุ้น/กองทุน: ราคา × หน่วย
}

// ─── โมดัลบันทึกการขาย ────────────────────────────────────────────────
function SellModal({ p, onClose, onSave }) {
  const [sellDate, setSellDate] = useState(ivToday());
  const [sellPrice, setSellPrice] = useState(String(p.buyPrice || ''));
  const [tax, setTax] = useState('0');
  const [fee, setFee] = useState('0');
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('');
  const [docs, setDocs] = useState([]);

  const saleValue = slSaleValue(p, sellPrice);
  const cost = p.investAmount || 0;
  const gainLoss = saleValue - cost;
  const net = saleValue - Number(tax || 0) - Number(fee || 0);
  const canSave = Number(sellPrice) > 0 && reason.trim() && approver.trim();

  const addDoc = () => { const n = prompt('ชื่อไฟล์เอกสารอนุมัติ'); if (n) setDocs([...docs, n]); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 580, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="shares" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>บันทึกขายเงินลงทุนก่อนครบกำหนด</h2>
            <div className="muted" style={{ fontSize: 11 }}>{p.id} · {p.securityName}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {/* ตรวจสอบสิทธิ์การขาย */}
          <div className="iv-check-line ok" style={{ marginBottom: 12 }}>
            <Icon name="shield" size={15} />
            <div><b>ตรวจสอบสิทธิ์การขาย</b>
              <div className="muted" style={{ fontSize: 11 }}>สถานะ Active · อยู่ในอำนาจอนุมัติของคณะกรรมการดำเนินการ — สามารถขายได้</div></div>
          </div>

          <div className="iv-recv-head">
            <div><span className="iv-recv-k">ต้นทุนการลงทุน</span><span className="iv-recv-v mono">{fmt.money(cost, 2)}</span></div>
            <div><span className="iv-recv-k">ราคาซื้อเดิม</span><span className="iv-recv-v mono">{p.buyPrice || '—'}</span></div>
          </div>

          <div className="iv-form-grid c2" style={{ marginTop: 10 }}>
            <IvField label="วันที่ขาย" required><ErpDate value={sellDate} onChange={(v) => ((e) => setSellDate(e.target.value))({ target: { value: v } })} className="cfg-input" /></IvField>
            <IvField label={p.faceValue ? 'ราคาขาย (% หน้าตั๋ว)' : 'ราคาขาย (ต่อหน่วย)'} required>
              <input className="cfg-input mono" type="number" value={sellPrice} style={{ textAlign: 'right' }} onChange={(e) => setSellPrice(e.target.value)} />
            </IvField>
            <IvField label="ภาษี"><IvMoneyInput value={tax} onChange={setTax} /></IvField>
            <IvField label="ค่าธรรมเนียม"><IvMoneyInput value={fee} onChange={setFee} /></IvField>
            <IvField label="เหตุผลการขาย" required span={2}>
              <input className="cfg-input" value={reason} placeholder="เช่น ปรับพอร์ตเพื่อเพิ่มสภาพคล่อง" onChange={(e) => setReason(e.target.value)} />
            </IvField>
            <IvField label="ผู้อนุมัติ" required span={2}>
              <input className="cfg-input" value={approver} placeholder="เช่น คณะกรรมการดำเนินการ ชุดที่ 48" onChange={(e) => setApprover(e.target.value)} />
            </IvField>
          </div>

          <div style={{ marginTop: 10 }}>
            <label className="iv-flabel">เอกสารอนุมัติ</label>
            <IvDocList docs={docs} editable onAdd={addDoc} onRemove={(i) => setDocs(docs.filter((_, x) => x !== i))} />
          </div>

          <div className="iv-net-box">
            <div className="iv-net-row"><span>มูลค่าขายรวม</span><span className="mono">{fmt.money(saleValue, 2)}</span></div>
            <div className="iv-net-row"><span>กำไร/ขาดทุนจากการขาย</span>
              <span className={"mono " + (gainLoss >= 0 ? 'iv-pos' : 'iv-neg')}>{(gainLoss >= 0 ? '+' : '−') + ' ' + fmt.money(Math.abs(gainLoss), 2)}</span></div>
            <div className="iv-net-row strong" style={{ borderTop: '1px solid var(--divider)', paddingTop: 6 }}><span>ยอดรับสุทธิ</span><span className="mono"><b>{fmt.money(net, 2)}</b></span></div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!canSave}
                    onClick={() => onSave(p, { sellDate, sellPrice: Number(sellPrice), saleValue, costValue: cost, gainLoss,
                      tax: Number(tax || 0), fee: Number(fee || 0), net, reason: reason.trim(), approver: approver.trim(), docs })}>
              <Icon name="check" /> บันทึกการขาย & ปิดสถานะ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SellInvestmentPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [port, setPort] = useState(window.ivLoadPort);
  const [sales, setSales] = useState(window.ivLoadSales);
  const [picking, setPicking] = useState(false);
  const [sellRec, setSellRec] = useState(null);

  const sellable = port.filter(p => p.status === 'active' && p.maturityDate);

  const handleSell = (p, calc) => {
    const sale = {
      id: 'SL-2569-' + String(8 + (sales.length - window.IV_SALE_SEED.length)).padStart(4, '0'),
      invId: p.id, ...calc, status: 'processed',
    };
    const nextSales = [sale, ...sales];
    setSales(nextSales); window.ivSaveSales(nextSales);
    const nextPort = port.map(x => x.id === p.id ? { ...x, status: 'sold', currentValue: calc.net } : x);
    setPort(nextPort); window.ivSavePort(nextPort);
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ขายก่อนครบกำหนด',
      target: `${p.id} · ${p.securityName}`,
      summary: `ขายก่อนครบกำหนด รับสุทธิ ${fmt.money(calc.net, 0)} (กำไร/ขาดทุน ${fmt.money(calc.gainLoss, 0)})`,
      changes: [{ field: 'สถานะ', before: 'Active', after: 'ขายแล้ว' }] });
    setSellRec(null);
    onToast && onToast(`บันทึกการขาย ${p.id} เรียบร้อย · เปลี่ยนสถานะเป็นขายแล้ว · ส่งบัญชีอัตโนมัติ`);
  };

  const realized = sales.reduce((a, s) => a + (s.gainLoss || 0), 0);
  const gainCnt = sales.filter(s => s.gainLoss >= 0).length;

  return (
    <div data-screen-label="หน้าบันทึกขายก่อนครบกำหนด">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกขายเงินลงทุนก่อนครบกำหนด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ขายหลักทรัพย์ก่อนครบกำหนด — คำนวณกำไร/ขาดทุน ตรวจสอบสิทธิ์การขาย และส่งบัญชีอัตโนมัติ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setPicking(true)}><Icon name="plus" /> บันทึกการขาย</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="กำไร/ขาดทุนสะสมจากการขาย" value={(realized >= 0 ? '+' : '−') + ' ฿ ' + fmt.money(Math.abs(realized), 0)}
                tone={realized >= 0 ? 'success' : 'danger'} sub={sales.length + ' รายการ'} accent />
        <IvStat label="รายการขายกำไร" value={gainCnt + ' รายการ'} sub="Realized gain" tone="success" />
        <IvStat label="หลักทรัพย์ที่ขายได้" value={sellable.length + ' รายการ'} sub="สถานะ Active มีวันครบกำหนด" />
      </div>

      <IvSection icon="history" title="ประวัติการขายก่อนครบกำหนด" count={sales.length}>
        <div className="table-wrap" style={{ marginTop: 4 }}>
          <table className="tbl" style={{ minWidth: 1000 }}>
            <thead><tr>
              <th style={{ width: 124 }}>เลขที่ขาย</th>
              <th style={{ minWidth: 190 }}>รายการลงทุน</th>
              <th className="center" style={{ width: 100 }}>วันที่ขาย</th>
              <th className="right" style={{ width: 120 }}>มูลค่าต้นทุน</th>
              <th className="right" style={{ width: 120 }}>กำไร/ขาดทุน</th>
              <th className="right" style={{ width: 120 }}>ยอดรับสุทธิ</th>
              <th className="center" style={{ width: 90 }}>สถานะ</th>
            </tr></thead>
            <tbody>
              {sales.length === 0 && <tr><td colSpan="7" className="center muted" style={{ padding: 28 }}>— ยังไม่มีรายการขาย —</td></tr>}
              {sales.map(s => {
                const p = window.ivPortById(s.invId);
                return (
                  <tr key={s.id}>
                    <td className="mono">{s.id}</td>
                    <td><div className="lt-row-name">{p ? p.securityName : s.invId}</div><div className="lt-row-note muted">{s.reason}</div></td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(s.sellDate)}</td>
                    <td className="right mono">{fmt.money(s.costValue, 0)}</td>
                    <td className="right mono"><span className={s.gainLoss >= 0 ? 'iv-pos' : 'iv-neg'}>{(s.gainLoss >= 0 ? '+' : '−') + ' ' + fmt.money(Math.abs(s.gainLoss), 0)}</span></td>
                    <td className="right mono"><b>{fmt.money(s.net, 0)}</b></td>
                    <td className="center"><span className="pill ok">ขายแล้ว</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </IvSection>

      {picking && (
        <IvPortPicker port={sellable} title="เลือกหลักทรัพย์ที่จะขาย"
                      onPick={(p) => { setPicking(false); setSellRec(p); }} onClose={() => setPicking(false)} />
      )}
      {sellRec && <SellModal p={sellRec} onClose={() => setSellRec(null)} onSave={handleSell} />}
    </div>
  );
}

Object.assign(window, { SellInvestmentPage });
