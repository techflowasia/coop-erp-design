// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › รับ–จ่ายเงิน — จ่ายเงินด้วยเช็ค
//  เลือกเลขเช็คว่าง → บันทึกการจ่าย → พิมพ์เช็ค → ยกเลิก →
//  Reconcile กับ Bank Statement → ส่งบัญชี
// ════════════════════════════════════════════════════════════════════

const CHQ_PAY_PILL = {
  issued:  { l: 'รอขึ้นเงิน', pill: 'warn' },
  cleared: { l: 'ขึ้นเงินแล้ว', pill: 'ok' },
  void:    { l: 'ยกเลิก', pill: 'neutral' },
};

// ─── โมดัลบันทึกจ่ายเช็ค ──────────────────────────────────────────────
function PayChequeModal({ freeLeaves, onClose, onSave }) {
  const [chequeNo, setChequeNo] = useState(freeLeaves[0] ? freeLeaves[0].no : '');
  const [payDate, setPayDate] = useState(ivToday());
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [detail, setDetail] = useState('');
  const [ref, setRef] = useState('');
  const leaf = freeLeaves.find(l => l.no === chequeNo);
  const ba = leaf ? window.COOP_BANK_ACCOUNTS.find(b => b.accountNo === leaf.accountNo) : null;
  const canSave = chequeNo && payee.trim() && Number(amount) > 0;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 540 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}><h2>บันทึกการจ่ายเช็ค</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกเลขเช็คที่ยังไม่ใช้และบันทึกรายละเอียดการจ่าย</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="iv-form-grid c2">
            <IvField label="เลขที่เช็ค (ใบว่าง)" required>
              <select className="cfg-input mono" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)}>
                {freeLeaves.length === 0 && <option value="">— ไม่มีใบเช็คว่าง —</option>}
                {freeLeaves.map(l => <option key={l.no} value={l.no}>{l.no}</option>)}
              </select>
            </IvField>
            <IvField label="วันที่จ่าย" required><ErpDate value={payDate} onChange={(v) => ((e) => setPayDate(e.target.value))({ target: { value: v } })} className="cfg-input" /></IvField>
            <IvField label="บัญชีธนาคาร" span={2}>
              <input className="cfg-input" value={ba ? ba.bank + ' · ' + ba.accountNo : '—'} disabled style={{ background: 'var(--bg-subtle)' }} />
            </IvField>
            <IvField label="ผู้รับเงิน" required span={2}>
              <input className="cfg-input" value={payee} placeholder="เช่น บมจ. ปตท." onChange={(e) => setPayee(e.target.value)} />
            </IvField>
            <IvField label="จำนวนเงิน" required><IvMoneyInput value={amount} onChange={setAmount} /></IvField>
            <IvField label="เอกสารอ้างอิง"><input className="cfg-input mono" value={ref} placeholder="เช่น INV-2569-00xx" onChange={(e) => setRef(e.target.value)} /></IvField>
            <IvField label="รายละเอียดการจ่าย" span={2}>
              <input className="cfg-input" value={detail} placeholder="เช่น ชำระค่าซื้อหลักทรัพย์" onChange={(e) => setDetail(e.target.value)} />
            </IvField>
          </div>
          {Number(amount) > 0 && (
            <div className="iv-net-box"><div className="iv-net-row strong"><span>จำนวนเงินตามเช็ค</span><span className="mono"><b>{fmt.money(Number(amount), 2)}</b></span></div></div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!canSave}
                    onClick={() => onSave({
                      id: 'CHQ-2569-' + String(Math.floor(Math.random() * 9000) + 1000),
                      chequeNo, bookId: leaf.bookId, accountNo: leaf.accountNo, bank: ba ? ba.bank : '',
                      payDate, payee: payee.trim(), amount: Number(amount), detail: detail.trim(),
                      ref: ref.trim() || '—', voucherNo: '—', status: 'issued', clearDate: null,
                    })}>
              <Icon name="check" /> บันทึก & พิมพ์เช็ค
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ChequePayPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [pays, setPays] = useState(window.chqLoadPays);
  const [usedNos, setUsedNos] = useState([]);   // เลขเช็คที่เพิ่งจ่ายในเซสชันนี้
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [fStatusQ, setFStatusQ] = useState('all');
  const doSearch = () => { setQuery(q); setFStatusQ(fStatus); };
  const doReset = () => { setQ(''); setQuery(''); setFStatus('all'); setFStatusQ('all'); };

  const freeLeaves = (window.CHQ_LEAF_SEED || []).filter(l => l.status === 'free' && !usedNos.includes(l.no));
  const persist = (next) => { setPays(next); window.chqSavePays(next); };

  const handleSave = (rec) => {
    persist([rec, ...pays]);
    setUsedNos([...usedNos, rec.chequeNo]);
    audit.log({ action: 'create', module: 'การเงินการลงทุน — จ่ายเช็ค',
      target: `${rec.id} · เช็ค ${rec.chequeNo}`, summary: `จ่ายเช็ค ${rec.chequeNo} ให้ ${rec.payee} ${fmt.money(rec.amount, 0)} บาท`,
      changes: [{ field: 'จำนวนเงิน', before: '—', after: fmt.money(rec.amount, 0) }] });
    setAdding(false);
    onToast && onToast(`บันทึกจ่ายเช็ค ${rec.chequeNo} เรียบร้อย · กำลังพิมพ์เช็ค · ส่งบัญชีแล้ว`);
  };
  const reconcile = (p) => { persist(pays.map(x => x.id === p.id ? { ...x, status: 'cleared', clearDate: ivToday() } : x)); onToast && onToast(`Reconcile เช็ค ${p.chequeNo} กับ Bank Statement — ขึ้นเงินแล้ว`); };
  const voidChq = (p) => { persist(pays.map(x => x.id === p.id ? { ...x, status: 'void' } : x)); onToast && onToast(`ยกเลิกเช็ค ${p.chequeNo} เรียบร้อย`); };

  const filtered = pays.filter(p => {
    if (fStatusQ !== 'all' && p.status !== fStatusQ) return false;
    if (query.trim()) { const n = query.toLowerCase(); return p.chequeNo.includes(n) || (p.payee || '').toLowerCase().includes(n) || p.id.toLowerCase().includes(n); }
    return true;
  });
  const issuedSum = pays.filter(p => p.status === 'issued').reduce((a, p) => a + p.amount, 0);

  return (
    <div data-screen-label="หน้าจ่ายเงินด้วยเช็ค">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>จ่ายเงินด้วยเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกการจ่ายเช็คจากเลขที่ยังไม่ใช้ · พิมพ์เช็ค · ยกเลิก · Reconcile กับ Bank Statement
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" disabled={freeLeaves.length === 0} onClick={() => setAdding(true)}><Icon name="plus" /> จ่ายเช็คใหม่</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="รอขึ้นเงิน (ยังไม่ Reconcile)" value={pays.filter(p => p.status === 'issued').length + ' ใบ'} sub={'฿ ' + fmt.money(issuedSum, 0)} accent />
        <IvStat label="ขึ้นเงินแล้ว" value={pays.filter(p => p.status === 'cleared').length + ' ใบ'} tone="success" />
        <IvStat label="เช็คว่างพร้อมใช้" value={freeLeaves.length + ' ใบ'} sub="ในเล่มที่ใช้งาน" tone="info" />
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายการจ่ายเช็ค</h3></div>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }} placeholder="ค้นหาเลขเช็ค / ผู้รับเงิน" />
          </div>
          <select className="cfg-input" style={{ width: 180, flex: '0 0 180px', height: 32, minHeight: 32, boxSizing: 'border-box' }} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {Object.keys(CHQ_PAY_PILL).map(k => <option key={k} value={k}>{CHQ_PAY_PILL[k].l}</option>)}
          </select>
          <button className="btn primary pa-tb-btn" onClick={doSearch}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={doReset}>รีเซ็ต</button>
          <span className="spacer" /><span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ width: 100 }}>เลขที่เช็ค</th>
              <th className="center" style={{ width: 100 }}>วันที่จ่าย</th>
              <th style={{ minWidth: 220 }}>ผู้รับเงิน / รายละเอียด</th>
              <th style={{ width: 130 }}>ธนาคาร</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 110 }}>สถานะ</th>
              <th className="center" style={{ width: 250 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {filtered.map((p, i) => {
                const st = CHQ_PAY_PILL[p.status];
                return (
                  <tr key={p.id} className={p.status === 'void' ? 'iv-void-row' : ''}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono"><b>{p.chequeNo}</b></td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(p.payDate)}</td>
                    <td><div className="lt-row-name">{p.payee}</div><div className="lt-row-note muted">{p.detail}</div></td>
                    <td><span style={{ fontSize: 12 }}>{p.bank}</span></td>
                    <td className="right mono"><b>{fmt.money(p.amount, 2)}</b></td>
                    <td className="center"><span className={window.chqChip(st.pill)}>{st.l}</span>{p.clearDate && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{fmt.date(p.clearDate)}</div>}</td>
                    <td className="center">
                      <div className="ex-act-row">
                        <button className="btn sm ex-row-btn" onClick={() => onToast && onToast('กำลังพิมพ์เช็ค ' + p.chequeNo)}><Icon name="print" size={13} /> พิมพ์</button>
                        {p.status === 'issued' && <button className="btn sm ex-row-btn" title="Reconcile กับ Bank Statement" onClick={() => reconcile(p)}><Icon name="check" size={13} /> ขึ้นเงิน</button>}
                        {p.status !== 'void' && p.status !== 'cleared' && <button className="btn sm ex-row-btn del" onClick={() => voidChq(p)}><Icon name="close" size={13} /> ยกเลิก</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เช็คที่บันทึกจ่ายจะถูกส่งเข้าระบบบัญชีอัตโนมัติ — ใช้ Reconcile เพื่อจับคู่กับ Bank Statement เมื่อเช็คขึ้นเงิน
      </div>

      {adding && <PayChequeModal freeLeaves={freeLeaves} onClose={() => setAdding(false)} onSave={handleSave} />}
    </div>
  );
}

Object.assign(window, { ChequePayPage });
