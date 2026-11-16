// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — บันทึกรับผลตอบแทน
//  ตารางรับดอกเบี้ย/เงินปันผล + บันทึกรับจริง + เทียบคาด vs จริง +
//  แจ้งเตือนใกล้กำหนด + ส่งข้อมูลเข้าบัญชี
// ════════════════════════════════════════════════════════════════════

function rcPortName(invId) {
  const p = window.ivPortById(invId);
  return p ? p.securityName : invId;
}

// ─── โมดัลบันทึกรับจริง ───────────────────────────────────────────────
function ReceiveModal({ row, onClose, onSave, onToast }) {
  const p = window.ivPortById(row.invId);
  const [actual, setActual] = useState(String(row.expect));
  const [wht, setWht] = useState(String(row.wht || 0));
  const [fee, setFee] = useState(String(row.fee || 0));
  const [receivedDate, setReceivedDate] = useState(ivToday());
  const [bank, setBank] = useState(window.COOP_BANK_ACCOUNTS[0].short + ' ' + window.COOP_BANK_ACCOUNTS[0].accountNo);
  const [ref, setRef] = useState('');

  const a = Number(actual || 0), w = Number(wht || 0), f = Number(fee || 0);
  const net = a - w - f;
  const diff = a - row.expect;

  const submit = () => {
    onSave({ ...row, actual: a, wht: w, fee: f, net, receivedDate, bank,
      ref: ref || ('CR-IN-' + receivedDate.replace(/-/g, '').slice(2)), status: 'received' });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 540 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>บันทึกรับผลตอบแทนจริง</h2>
            <div className="muted" style={{ fontSize: 11 }}>{row.id} · {row.type} · {p ? p.securityName : row.invId}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="iv-recv-head">
            <div><span className="iv-recv-k">รอบวันที่รับ</span><span className="iv-recv-v">{fmt.date(row.dueDate)}</span></div>
            <div><span className="iv-recv-k">จำนวนที่คาดว่าจะรับ</span><span className="iv-recv-v mono">{fmt.money(row.expect, 2)}</span></div>
          </div>

          <div className="iv-form-grid c2" style={{ marginTop: 10 }}>
            <IvField label="จำนวนเงินที่รับจริง" required><IvMoneyInput value={actual} onChange={setActual} /></IvField>
            <IvField label="วันที่รับเงิน" required><ErpDate value={receivedDate} onChange={(v) => ((e) => setReceivedDate(e.target.value))({ target: { value: v } })} className="cfg-input" /></IvField>
            <IvField label="ภาษีหัก ณ ที่จ่าย"><IvMoneyInput value={wht} onChange={setWht} /></IvField>
            <IvField label="ค่าธรรมเนียม"><IvMoneyInput value={fee} onChange={setFee} /></IvField>
            <IvField label="ธนาคารที่รับเงิน" span={2}>
              <select className="cfg-input" value={bank} onChange={(e) => setBank(e.target.value)}>
                {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.short + ' ' + b.accountNo}>{b.bank} · {b.accountNo}</option>)}
              </select>
            </IvField>
            <IvField label="เอกสารอ้างอิง" span={2}>
              <input className="cfg-input mono" value={ref} placeholder="อัตโนมัติหากเว้นว่าง" onChange={(e) => setRef(e.target.value)} />
            </IvField>
          </div>

          <div className="iv-net-box">
            <div className="iv-net-row"><span>ยอดสุทธิที่รับ</span><span className="mono"><b>{fmt.money(net, 2)}</b></span></div>
            <div className="iv-net-row"><span>ส่วนต่างจากที่คาด</span>
              <span className={"mono " + (diff === 0 ? '' : diff > 0 ? 'iv-pos' : 'iv-neg')}>{diff === 0 ? '0.00' : (diff > 0 ? '+' : '−') + ' ' + fmt.money(Math.abs(diff), 2)}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={a <= 0} onClick={submit}><Icon name="check" /> บันทึกรับเงิน</button>
          </div>
        </div>
      </div>
    </>
  );
}

function ReceiveReturnPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [returns, setReturns] = useState(window.ivLoadReturns);
  const [recv, setRecv] = useState(null);
  const [fStatus, setFStatus] = useState('all');
  const [fType, setFType] = useState('all');

  const persist = (next) => { setReturns(next); window.ivSaveReturns(next); };
  const handleSave = (row) => {
    const next = returns.map(r => r.id === row.id ? row : r);
    persist(next);
    audit.log({ action: 'update', module: 'การเงินการลงทุน — รับผลตอบแทน',
      target: `${row.id} · ${rcPortName(row.invId)}`,
      summary: `บันทึกรับ${row.type} ${fmt.money(row.net, 0)} บาท`,
      changes: [{ field: 'ยอดรับสุทธิ', before: '—', after: fmt.money(row.net, 2) }] });
    setRecv(null);
    onToast && onToast(`บันทึกรับ${row.type} ${row.id} เรียบร้อย · ส่งข้อมูลเข้าระบบบัญชีแล้ว`);
  };

  const filtered = returns.filter(r => {
    if (fStatus !== 'all' && r.status !== fStatus) return false;
    if (fType !== 'all' && r.type !== fType) return false;
    return true;
  }).sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));

  const pending = returns.filter(r => r.status === 'pending');
  const overdue = returns.filter(r => r.status === 'overdue');
  const pendingSum = pending.reduce((a, r) => a + r.expect, 0) + overdue.reduce((a, r) => a + r.expect, 0);
  const recvThisMonth = returns.filter(r => r.status === 'received' && (r.receivedDate || '').startsWith('2026-06'));
  const recvSum = recvThisMonth.reduce((a, r) => a + (r.net || 0), 0);
  const near = returns.filter(r => { const d = window.ivDaysToMaturity(r.dueDate); return r.status === 'pending' && d != null && d >= 0 && d <= 15; });

  return (
    <div data-screen-label="หน้าบันทึกรับผลตอบแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกรับผลตอบแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ดอกเบี้ย · เงินปันผล · กำไรจากการขาย — บันทึกรับจริง เทียบกับยอดที่คาดไว้ และส่งข้อมูลเข้าบัญชี
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('สร้างตารางรับดอกเบี้ยล่วงหน้าจากพอร์ตลงทุนแล้ว')}><Icon name="calendar" /> สร้างตารางรับล่วงหน้า</button>
        <button className="btn sm" onClick={() => onToast && onToast('กำลังออกรายงานผลตอบแทน (PDF)')}><Icon name="report" /> รายงานผลตอบแทน</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
        <IvStat label="รอรับทั้งหมด" value={'฿ ' + fmt.money(pendingSum, 0)} sub={(pending.length + overdue.length) + ' งวด'} accent />
        <IvStat label="เกินกำหนดรับ" value={overdue.length + ' งวด'} sub={'฿ ' + fmt.money(overdue.reduce((a, r) => a + r.expect, 0), 0)} tone={overdue.length ? 'danger' : undefined} />
        <IvStat label="รับแล้วเดือนนี้ (สุทธิ)" value={'฿ ' + fmt.money(recvSum, 0)} sub={recvThisMonth.length + ' งวด'} tone="success" />
        <IvStat label="ใกล้ถึงกำหนด (≤15 วัน)" value={near.length + ' งวด'} sub="ควรเตรียมรับ" tone={near.length ? 'warning' : undefined} />
      </div>

      {near.length > 0 && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="bell" size={14} /><span>มี <b>{near.length} งวด</b>ที่ใกล้ถึงกำหนดรับภายใน 15 วัน: {near.map(r => rcPortName(r.invId)).join(', ')}</span>
        </div>
      )}

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <select className="filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอรับ</option>
            <option value="overdue">เกินกำหนด</option>
            <option value="received">รับแล้ว</option>
          </select>
          <select className="filter-select" value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="all">ทุกประเภท</option>
            <option value="ดอกเบี้ย">ดอกเบี้ย</option>
            <option value="เงินปันผล">เงินปันผล</option>
            <option value="กำไรจากการขาย">กำไรจากการขาย</option>
          </select>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11 }}>{filtered.length} รายการ</span>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th style={{ width: 120 }}>เลขที่</th>
              <th style={{ minWidth: 190 }}>รายการลงทุน</th>
              <th style={{ width: 92 }}>ประเภท</th>
              <th className="center" style={{ width: 110 }}>รอบวันที่รับ</th>
              <th className="right" style={{ width: 120 }}>คาดว่าจะรับ</th>
              <th className="right" style={{ width: 120 }}>รับจริง (สุทธิ)</th>
              <th className="right" style={{ width: 110 }}>ส่วนต่าง</th>
              <th className="center" style={{ width: 96 }}>สถานะ</th>
              <th className="center" style={{ width: 110 }} />
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: 30 }}>ไม่พบรายการ</td></tr>}
              {filtered.map(r => {
                const diff = r.actual != null ? (r.actual - r.expect) : null;
                return (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td><div className="lt-row-name">{rcPortName(r.invId)}</div><div className="lt-row-note muted mono">{r.invId}</div></td>
                    <td>{r.type}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.dueDate)}</td>
                    <td className="right mono">{fmt.money(r.expect, 0)}</td>
                    <td className="right mono">{r.net != null ? fmt.money(r.net, 0) : '—'}</td>
                    <td className="right mono">{diff == null ? '—' : <span className={diff === 0 ? '' : diff > 0 ? 'iv-pos' : 'iv-neg'}>{(diff > 0 ? '+' : diff < 0 ? '−' : '') + fmt.money(Math.abs(diff), 0)}</span>}</td>
                    <td className="center">
                      {r.status === 'received' ? <span className="pill ok">รับแล้ว</span>
                        : r.status === 'overdue' ? <span className="pill bad">เกินกำหนด</span>
                        : <span className="pill warn">รอรับ</span>}
                    </td>
                    <td className="center">
                      {r.status === 'received'
                        ? <span className="muted" style={{ fontSize: 11 }}>{fmt.date(r.receivedDate)}</span>
                        : <button className="btn primary sm" onClick={() => setRecv(r)}><Icon name="check" size={12} /> บันทึกรับ</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เมื่อบันทึกรับจริง ระบบจะเปรียบเทียบกับยอดที่คาดไว้ และส่งรายการเข้าระบบบัญชีโดยอัตโนมัติ
      </div>

      {recv && <ReceiveModal row={recv} onClose={() => setRecv(null)} onSave={handleSave} onToast={onToast} />}
    </div>
  );
}

Object.assign(window, { ReceiveReturnPage });
