// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — Export File ธนาคาร
//  ดึงรายการรอโอน (ดอกเบี้ย/ถอนเข้าบัญชี) → สร้างไฟล์โอน → Export →
//  บันทึกผลการโอน สำเร็จ/รออัปโหลด
// ════════════════════════════════════════════════════════════════════

const DBF_TYPES = ['KTB iPay Direct', 'SCB Business Net', 'BBL iCash', 'Krungsri Cash Connect'];
const dbfTotal = (items) => items.reduce((a, x) => a + (x.amount || 0), 0);
const dbfBankName = (id) => {
  const b = (window.COOP_BANK_ACCOUNTS || []).find(x => x.id === id);
  return b ? b.bank : id;
};
const dbfStatusPill = (s) => {
  const st = window.DEP_BANKFILE_STATUS[s] || window.DEP_BANKFILE_STATUS.draft;
  return <span className={"pill " + st.pill}>{st.l}</span>;
};

// ─── โมดัลสร้างไฟล์โอน ────────────────────────────────────────────────
function DbfCreateModal({ onClose, onCreate }) {
  const [purpose, setPurpose] = useState('โอนดอกเบี้ยเงินฝาก');
  const [transferType, setTransferType] = useState(DBF_TYPES[0]);
  const [bankId, setBankId] = useState(window.COOP_BANK_ACCOUNTS[0].id);
  const [transferDate, setTransferDate] = useState(window.DEP_OPS_TODAY);
  const pending = window.DEP_BANKFILE_PENDING || [];
  const [picked, setPicked] = useState(() => new Set(pending.map(p => p.id)));

  const toggle = (id) => setPicked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const sel = pending.filter(p => picked.has(p.id));

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="upload" /></div>
          <div style={{ minWidth: 0 }}><h2>สร้างไฟล์โอนธนาคาร (เงินฝาก)</h2>
            <div className="muted" style={{ fontSize: 11 }}>ดึงรายการรอโอนดอกเบี้ย/ถอนเข้าบัญชีสมาชิก แล้วสร้างไฟล์โอนเข้าระบบธนาคาร</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="iv-form-grid c2">
            <IvField label="วัตถุประสงค์" required>
              <select className="cfg-input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option>โอนดอกเบี้ยเงินฝาก</option>
                <option>โอนเงินถอนเข้าบัญชีสมาชิก</option>
                <option>โอนเงินปิดบัญชี</option>
              </select>
            </IvField>
            <IvField label="ประเภทการโอน" required>
              <select className="cfg-input" value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                {DBF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </IvField>
            <IvField label="บัญชีต้นทาง (สหกรณ์)" required>
              <select className="cfg-input" value={bankId} onChange={(e) => setBankId(e.target.value)}>
                {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.bank} · {b.accountNo}</option>)}
              </select>
            </IvField>
            <IvField label="วันที่โอน" required><ErpDate value={transferDate} onChange={(v) => ((e) => setTransferDate(e.target.value))({ target: { value: v } })} className="cfg-input" /></IvField>
          </div>

          <div className="toolbar" style={{ margin: '12px 0 6px' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>รายการรอโอน</span>
            <span className="gc-count">{sel.length}/{pending.length} เลือก</span>
            <span className="spacer" />
            <button className="btn ghost sm" onClick={() => setPicked(new Set(pending.map(p => p.id)))}>เลือกทั้งหมด</button>
            <button className="btn ghost sm" onClick={() => setPicked(new Set())}>ล้าง</button>
          </div>
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead><tr><th style={{ width: 36 }} /><th>ผู้รับเงิน</th><th>วัตถุประสงค์</th><th>ธนาคาร</th><th className="mono">เลขบัญชี</th><th className="right">จำนวนเงิน</th></tr></thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p.id} className={picked.has(p.id) ? 'selected' : ''} style={{ cursor: 'pointer' }} onClick={() => toggle(p.id)}>
                    <td className="center"><input type="checkbox" className="ct-check" checked={picked.has(p.id)} readOnly /></td>
                    <td><div className="lt-row-name">{p.name}</div><div className="lt-row-note muted mono">{p.member}</div></td>
                    <td style={{ fontSize: 12 }}>{p.purpose}</td>
                    <td style={{ fontSize: 12 }}>{p.bank}</td>
                    <td className="mono">{p.acctNo}</td>
                    <td className="right mono">{fmt.money(p.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="iv-net-box" style={{ marginTop: 12 }}>
            <div className="iv-net-row"><span>จำนวนรายการที่เลือก</span><span className="mono">{sel.length} รายการ</span></div>
            <div className="iv-net-row strong" style={{ borderTop: '1px solid var(--divider)', paddingTop: 6 }}><span>ยอดโอนรวม</span><span className="mono"><b>{fmt.money(dbfTotal(sel), 2)}</b></span></div>
          </div>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={sel.length === 0}
                  onClick={() => onCreate({ purpose, transferType, bankId, transferDate,
                    items: sel.map(p => ({ name: p.name, member: p.member, bank: p.bank, acctNo: p.acctNo, amount: p.amount })) })}>
            <Icon name="download" /> สร้างไฟล์โอน {sel.length} รายการ
          </button>
        </div>
      </div>
    </>
  );
}

function DepBankFilePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [files, setFiles] = useState(window.depBankFileLoad);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  const persist = (next) => { setFiles(next); window.depBankFileSave(next); };
  const openFile = files.find(f => f.id === openId);

  const handleCreate = (data) => {
    const n = files.reduce((m, f) => Math.max(m, parseInt(String(f.id).slice(-4), 10) || 0), 6) + 1;
    const rec = { id: 'DBF-2569-' + String(n).padStart(4, '0'), ...data, createdBy: window.DEP_OPS_USER, status: 'generated' };
    persist([rec, ...files]);
    audit.log({ action: 'create', module: 'เงินฝาก — Export File ธนาคาร', target: rec.id,
      summary: `สร้างไฟล์โอน ${rec.items.length} รายการ ยอดรวม ${fmt.money(dbfTotal(rec.items), 0)} บาท (${rec.purpose})`,
      changes: [{ field: 'ยอดโอนรวม', before: '—', after: fmt.money(dbfTotal(rec.items), 0) }] });
    setCreating(false); setOpenId(rec.id);
    onToast && onToast(`สร้างไฟล์โอน ${rec.id} เรียบร้อย (${rec.items.length} รายการ)`);
  };
  const updateStatus = (id, status) => {
    persist(files.map(f => f.id === id ? { ...f, status } : f));
    onToast && onToast(`อัปเดตสถานะไฟล์โอนเป็น "${window.DEP_BANKFILE_STATUS[status].l}" แล้ว`);
  };

  if (openFile) {
    return (
      <div data-screen-label="หน้ารายละเอียดไฟล์โอนเงินฝาก">
        <div className="page-actions">
          <button className="btn ghost sm" onClick={() => setOpenId(null)}><Icon name="chevLeft" /> กลับสู่รายการไฟล์โอน</button>
          <span className="spacer" />
          <button className="btn sm" onClick={() => onToast && onToast('Export Bank File ' + openFile.id + ' (.txt) แล้ว')}><Icon name="download" /> Export Bank File</button>
          <button className="btn sm" onClick={() => onToast && onToast('กำลังพิมพ์รายงานประกอบการโอน')}><Icon name="print" /> พิมพ์รายงาน</button>
        </div>
        <div className="search-card lt-head-card">
          <div className="lt-head-main">
            <div className="lt-head-ico"><Icon name="upload" size={20} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1 className="lt-head-title">ไฟล์โอน <span className="mono">{openFile.id}</span> {dbfStatusPill(openFile.status)}</h1>
              <div className="lt-head-meta"><span>{openFile.purpose}</span><span className="dot" /><span>{openFile.transferType}</span><span className="dot" /><span>ต้นทาง {dbfBankName(openFile.bankId)}</span><span className="dot" /><span>วันที่โอน {fmt.date(openFile.transferDate)}</span></div>
            </div>
          </div>
        </div>
        <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <IvStat label="ยอดโอนรวม" value={'฿ ' + fmt.money(dbfTotal(openFile.items), 2)} sub={openFile.items.length + ' รายการ'} accent />
          <IvStat label="วัตถุประสงค์" value={openFile.purpose} />
          <IvStat label="สถานะไฟล์" value={window.DEP_BANKFILE_STATUS[openFile.status].l} tone={openFile.status === 'completed' ? 'success' : undefined} />
        </div>
        <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
          <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead><tr><th>ผู้รับเงิน</th><th>ธนาคาร</th><th className="mono">เลขบัญชี</th><th className="right">จำนวนเงิน</th></tr></thead>
              <tbody>
                {openFile.items.map((it, i) => (
                  <tr key={i}>
                    <td><div className="lt-row-name">{it.name}</div><div className="lt-row-note muted mono">{it.member}</div></td>
                    <td style={{ fontSize: 12 }}>{it.bank}</td>
                    <td className="mono">{it.acctNo}</td>
                    <td className="right mono">{fmt.money(it.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan="3" className="right">รวมทั้งสิ้น</td><td className="right mono"><b>{fmt.money(dbfTotal(openFile.items), 2)}</b></td></tr></tfoot>
            </table>
          </div>
        </div>
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>บันทึกผลการโอน</h3></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" disabled={openFile.status !== 'generated'} onClick={() => updateStatus(openFile.id, 'uploaded')}><Icon name="upload" /> อัปโหลดเข้าธนาคารแล้ว</button>
            <button className="btn primary" disabled={openFile.status === 'completed'} onClick={() => updateStatus(openFile.id, 'completed')}><Icon name="check" /> บันทึกโอนสำเร็จ</button>
          </div>
        </div>
      </div>
    );
  }

  const pendingTotal = dbfTotal(window.DEP_BANKFILE_PENDING || []);
  return (
    <div data-screen-label="หน้า Export File ธนาคารเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Export File ธนาคาร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>สร้างไฟล์โอนเงินดอกเบี้ย/เงินถอนเข้าบัญชีธนาคารสมาชิก และ Export เข้าระบบ Direct Credit ของธนาคาร</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setCreating(true)}><Icon name="plus" /> สร้างไฟล์โอนใหม่</button>
      </div>

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="รายการรอโอน" value={(window.DEP_BANKFILE_PENDING || []).length + ' รายการ'} sub={'฿ ' + fmt.money(pendingTotal, 0)} accent />
        <IvStat label="ไฟล์โอนทั้งหมด" value={files.length + ' ไฟล์'} sub={files.filter(f => f.status === 'completed').length + ' โอนสำเร็จ'} />
        <IvStat label="รอดำเนินการ" value={files.filter(f => f.status === 'generated' || f.status === 'uploaded').length + ' ไฟล์'} tone="warning" />
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 920 }}>
            <thead><tr>
              <th style={{ width: 130 }}>เลขที่ไฟล์</th><th style={{ minWidth: 170 }}>วัตถุประสงค์</th><th>ประเภทการโอน</th>
              <th className="center" style={{ width: 95 }}>วันที่โอน</th><th className="center" style={{ width: 70 }}>รายการ</th>
              <th className="right" style={{ width: 130 }}>ยอดโอนรวม</th><th className="center" style={{ width: 110 }}>สถานะ</th>
            </tr></thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} className="clickable" onClick={() => setOpenId(f.id)}>
                  <td className="mono">{f.id}</td>
                  <td><div className="lt-row-name">{f.purpose}</div><div className="lt-row-note muted">ต้นทาง: {dbfBankName(f.bankId)}</div></td>
                  <td style={{ fontSize: 12 }}>{f.transferType}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(f.transferDate)}</td>
                  <td className="center mono">{f.items.length}</td>
                  <td className="right mono"><b>{fmt.money(dbfTotal(f.items), 2)}</b></td>
                  <td className="center">{dbfStatusPill(f.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> คลิกไฟล์โอนเพื่อดูรายการ ตรวจสอบเลขบัญชี Export ไฟล์ และบันทึกผลการโอน</div>

      {creating && <DbfCreateModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { DepBankFilePage });
