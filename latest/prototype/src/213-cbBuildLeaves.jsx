// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › รับ–จ่ายเงิน — นำเข้าเล่มเช็ค
//  ทะเบียนเล่มเช็ค ⇄ รายละเอียดใบเช็คในเล่ม
//  คีย์/Import เล่มเช็ค · ตรวจเลขซ้ำ · กำหนดสถานะ (ว่าง/ใช้/ยกเลิก/เสีย) ·
//  ค้นหา · รายงานสถานะเช็ค
// ════════════════════════════════════════════════════════════════════

// สร้างรายการใบเช็คจากข้อมูลเล่ม
function cbBuildLeaves(book) {
  const start = parseInt(book.startNo, 10);
  const width = book.startNo.length;
  const leaves = [];
  for (let i = 0; i < book.count; i++) {
    const no = String(start + i).padStart(width, '0');
    let status = 'free';
    if (i < book.used) status = 'used';
    if (book.voided && i === book.used) status = 'void';
    if (book.damaged && i === book.used + (book.voided ? 1 : 0)) status = 'damaged';
    leaves.push({ no, status });
  }
  return leaves;
}

// ─── รายละเอียดเล่มเช็ค (ใบเช็คในเล่ม) ────────────────────────────────
function ChequeBookDetail({ book, onBack, onToast }) {
  const [leaves, setLeaves] = useState(() => cbBuildLeaves(book));
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('all');

  const cycle = (no) => setLeaves(ls => ls.map(l => {
    if (l.no !== no) return l;
    if (l.status === 'used') return l;   // ใช้แล้วเปลี่ยนไม่ได้
    const order = ['free', 'void', 'damaged'];
    const nx = order[(order.indexOf(l.status) + 1) % order.length];
    return { ...l, status: nx };
  }));

  const counts = leaves.reduce((a, l) => { a[l.status] = (a[l.status] || 0) + 1; return a; }, {});
  const filtered = leaves.filter(l => (fStatus === 'all' || l.status === fStatus) && (!q.trim() || l.no.includes(q.trim())));

  return (
    <div data-screen-label="หน้ารายละเอียดเล่มเช็ค">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่ทะเบียนเล่มเช็ค</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ออกรายงานสถานะเช็คของเล่ม ' + book.id + ' แล้ว')}><Icon name="print" /> รายงานสถานะเช็ค</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="receipt" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">เล่มเช็ค <span className="mono">{book.id}</span></h1>
            <div className="lt-head-meta">
              <span>{book.bank} · {book.branch}</span><span className="dot" />
              <span className="mono">{book.accountNo}</span><span className="dot" />
              <span className="mono">{book.startNo}–{book.endNo}</span><span className="dot" />
              <span>รับเล่ม {fmt.date(book.receiveDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <IvStat label="ว่าง" value={(counts.free || 0) + ' ใบ'} tone="success" accent />
        <IvStat label="ใช้แล้ว" value={(counts.used || 0) + ' ใบ'} tone="info" />
        <IvStat label="ยกเลิก" value={(counts.void || 0) + ' ใบ'} />
        <IvStat label="เสีย" value={(counts.damaged || 0) + ' ใบ'} tone="danger" />
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 200px' }}><Icon name="search" size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขเช็ค…" /></div>
          <select className="filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {Object.keys(window.CHQ_STATUS).map(k => <option key={k} value={k}>{window.CHQ_STATUS[k].l}</option>)}
          </select>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11 }}>คลิกใบเช็คเพื่อสลับสถานะ ว่าง → ยกเลิก → เสีย</span>
        </div>
        <div className="chq-leaf-grid">
          {filtered.map(l => {
            const st = window.CHQ_STATUS[l.status];
            return (
              <button key={l.no} className={"chq-leaf " + l.status} disabled={l.status === 'used'} onClick={() => cycle(l.no)} title={st.l}>
                <span className="chq-leaf-no mono">{l.no}</span>
                <span className={"pill " + st.pill} style={{ height: 16, padding: '0 5px', fontSize: 10 }}>{st.l}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── โมดัลเพิ่มเล่มเช็ค (คีย์ข้อมูล) ───────────────────────────────────
function AddChequeBookModal({ books, onClose, onCreate }) {
  const [bankId, setBankId] = useState(window.COOP_BANK_ACCOUNTS[0].id);
  const [startNo, setStartNo] = useState('');
  const [endNo, setEndNo] = useState('');
  const [receiveDate, setReceiveDate] = useState(ivToday());
  const [err, setErr] = useState('');

  const ba = window.COOP_BANK_ACCOUNTS.find(b => b.id === bankId);
  const count = (startNo && endNo && /^\d+$/.test(startNo) && /^\d+$/.test(endNo))
    ? (parseInt(endNo, 10) - parseInt(startNo, 10) + 1) : 0;

  const submit = () => {
    if (!/^\d+$/.test(startNo) || !/^\d+$/.test(endNo)) return setErr('กรุณาระบุเลขเช็คเริ่มต้น–สิ้นสุดเป็นตัวเลข');
    if (count <= 0) return setErr('เลขเช็คสิ้นสุดต้องมากกว่าเลขเริ่มต้น');
    // ตรวจซ้ำกับเล่มเดิมในบัญชีเดียวกัน
    const s = parseInt(startNo, 10), e = parseInt(endNo, 10);
    const dup = books.some(b => b.accountNo === ba.accountNo && !(e < parseInt(b.startNo, 10) || s > parseInt(b.endNo, 10)));
    if (dup) return setErr('ช่วงเลขเช็คนี้ซ้ำกับเล่มที่มีอยู่แล้วในบัญชี ' + ba.accountNo);
    onCreate({
      id: 'CB-2569-' + String(7 + (books.length - window.CHQ_BOOK_SEED.length)).padStart(3, '0'),
      bankId, bank: ba.bank, branch: ba.branch, accountNo: ba.accountNo,
      startNo, endNo, count, receiveDate, by: IV_USER, status: 'active', used: 0, free: count, voided: 0, damaged: 0,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 500 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}><h2>คีย์ข้อมูลเล่มเช็ค</h2>
            <div className="muted" style={{ fontSize: 11 }}>บันทึกเล่มเช็คใหม่ที่รับจากธนาคาร</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="iv-form-grid c2">
            <IvField label="บัญชีธนาคาร" required span={2}>
              <select className="cfg-input" value={bankId} onChange={(e) => setBankId(e.target.value)}>
                {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.bank} · {b.branch} · {b.accountNo}</option>)}
              </select>
            </IvField>
            <IvField label="เลขที่เช็คเริ่มต้น" required>
              <input className="cfg-input mono" value={startNo} placeholder="เช่น 06700175" onChange={(e) => { setStartNo(e.target.value); setErr(''); }} />
            </IvField>
            <IvField label="เลขที่เช็คสิ้นสุด" required>
              <input className="cfg-input mono" value={endNo} placeholder="เช่น 06700224" onChange={(e) => { setEndNo(e.target.value); setErr(''); }} />
            </IvField>
            <IvField label="จำนวนใบเช็ค">
              <input className="cfg-input mono" value={count || ''} disabled style={{ background: 'var(--bg-subtle)' }} />
            </IvField>
            <IvField label="วันที่รับเล่ม" required>
              <ErpDate value={receiveDate} onChange={(v) => ((e) => setReceiveDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </IvField>
          </div>
          {err && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={submit}><Icon name="check" /> บันทึกเล่มเช็ค</button>
          </div>
        </div>
      </div>
    </>
  );
}

window.chqChip = (p) => 'chip ' + ({ ok: 'success', neutral: '', warning: 'warn' }[p] ?? p);
function ChequeBookPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [books, setBooks] = useState(window.chqLoadBooks);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);

  const openBook = books.find(b => b.id === openId);
  if (openBook) return <ChequeBookDetail book={openBook} onBack={() => setOpenId(null)} onToast={onToast} />;

  const handleCreate = (rec) => {
    const next = [rec, ...books];
    setBooks(next); window.chqSaveBooks(next);
    audit.log({ action: 'create', module: 'การเงินการลงทุน — เล่มเช็ค',
      target: rec.id, summary: `นำเข้าเล่มเช็ค ${rec.startNo}–${rec.endNo} (${rec.count} ใบ)`,
      changes: [{ field: 'จำนวนใบเช็ค', before: '—', after: String(rec.count) }] });
    setAdding(false);
    onToast && onToast(`บันทึกเล่มเช็ค ${rec.id} เรียบร้อย (${rec.count} ใบ)`);
  };

  const totalFree = books.reduce((a, b) => a + b.free, 0);

  return (
    <div data-screen-label="หน้านำเข้าเล่มเช็ค">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>นำเข้าเล่มเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนเล่มเช็คของสหกรณ์ — คีย์ข้อมูลหรือนำเข้าไฟล์ ตรวจเลขซ้ำ และกำหนดสถานะใบเช็ค
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('นำเข้าไฟล์เล่มเช็ค (.xlsx) — ตรวจสอบเลขซ้ำเรียบร้อย')}><Icon name="upload" /> Import File</button>
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> คีย์เล่มเช็ค</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="เล่มเช็คทั้งหมด" value={books.length + ' เล่ม'} sub={books.filter(b => b.status === 'active').length + ' เล่มใช้งานอยู่'} accent />
        <IvStat label="ใบเช็คคงเหลือ (ว่าง)" value={totalFree + ' ใบ'} sub="พร้อมใช้จ่าย" tone="success" />
        <IvStat label="ใช้ไปแล้ว" value={books.reduce((a, b) => a + b.used, 0) + ' ใบ'} sub="ทุกเล่ม" tone="info" />
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ทะเบียนเล่มเช็ค</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ width: 124 }}>เลขที่เล่ม</th>
              <th style={{ minWidth: 180 }}>ธนาคาร / สาขา</th>
              <th className="mono" style={{ width: 130 }}>เลขที่บัญชี</th>
              <th className="center" style={{ width: 160 }}>ช่วงเลขเช็ค</th>
              <th className="center" style={{ width: 70 }}>ว่าง</th>
              <th className="center" style={{ width: 70 }}>ใช้แล้ว</th>
              <th className="center" style={{ width: 100 }}>วันรับเล่ม</th>
              <th className="center" style={{ width: 100 }}>สถานะ</th>
              <th className="center" style={{ width: 110 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {books.map((b, i) => (
                <tr key={b.id}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{b.id}</td>
                  <td><div className="lt-row-name">{b.bank}</div><div className="lt-row-note muted">{b.branch}</div></td>
                  <td className="mono" style={{ fontSize: 12 }}>{b.accountNo}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{b.startNo}–{b.endNo}</td>
                  <td className="center mono" style={{ color: 'var(--success)', fontWeight: 600 }}>{b.free}</td>
                  <td className="center mono">{b.used}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(b.receiveDate)}</td>
                  <td className="center">{b.status === 'active' ? <span className="chip success">ใช้งาน</span> : <span className="chip">ใช้หมดแล้ว</span>}</td>
                  <td className="center"><button className="btn sm ex-row-btn" onClick={() => setOpenId(b.id)}><Icon name="eye" size={13} /> ดู</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> กด “ดู” เพื่อดูใบเช็คในเล่มและกำหนดสถานะ (ว่าง / ใช้แล้ว / ยกเลิก / เสีย)
      </div>

      {adding && <AddChequeBookModal books={books} onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { ChequeBookPage });
