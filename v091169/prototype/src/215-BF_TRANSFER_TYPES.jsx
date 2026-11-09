// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › รับ–จ่ายเงิน — สร้างไฟล์โอนธนาคาร
//  ดึงรายการรอโอน → ตรวจเลขบัญชี → จัดกลุ่มตามรหัสคู่บัญชี →
//  Export Bank File → พิมพ์รายงาน → บันทึกสถานะโอน สำเร็จ/ไม่สำเร็จ
// ════════════════════════════════════════════════════════════════════

const BF_TRANSFER_TYPES = ['KTB iPay Direct', 'SCB Business Net', 'BBL iCash', 'Krungsri Cash Connect'];
const bfTotal = (items) => items.reduce((a, x) => a + (x.amount || 0), 0);
const bfValidAcct = (no) => /^\d{10,12}$/.test(String(no || '').replace(/-/g, ''));

// ─── รายละเอียดไฟล์โอน ───────────────────────────────────────────────
function BankFileDetail({ file, onBack, onUpdate, onToast }) {
  const groups = {};
  file.items.forEach(it => { (groups[it.coCode] = groups[it.coCode] || []).push(it); });
  const st = window.BANK_FILE_STATUS[file.status];

  return (
    <div data-screen-label="หน้ารายละเอียดไฟล์โอนธนาคาร">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการไฟล์โอน</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('Export Bank File ' + file.id + ' (.txt) แล้ว')}><Icon name="download" /> Export Bank File</button>
        <button className="btn sm" onClick={() => onToast && onToast('กำลังพิมพ์รายงานประกอบการโอน')}><Icon name="print" /> พิมพ์รายงาน</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="upload" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">ไฟล์โอน <span className="mono">{file.id}</span> <span className={"pill " + st.pill}>{st.l}</span></h1>
            <div className="lt-head-meta">
              <span>{file.transferType}</span><span className="dot" />
              <span>ปลายทาง: {file.destBankScope}</span><span className="dot" />
              <span>วันที่โอน {fmt.date(file.transferDate)}</span><span className="dot" />
              <span>โดย {file.createdBy}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <IvStat label="ยอดโอนรวม" value={'฿ ' + fmt.money(bfTotal(file.items), 2)} sub={file.items.length + ' รายการ'} accent />
        <IvStat label="จำนวนรหัสคู่บัญชี" value={Object.keys(groups).length + ' กลุ่ม'} />
        <IvStat label="สถานะไฟล์" value={st.l} tone={file.status === 'completed' ? 'success' : file.status === 'failed' ? 'danger' : undefined} />
      </div>

      {Object.keys(groups).map(co => (
        <IvSection key={co} icon="wallet" title={'รหัสคู่บัญชี: ' + co} count={groups[co].length + ' รายการ'}>
          <div className="table-wrap" style={{ marginTop: 4 }}>
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead><tr><th>ผู้รับเงิน</th><th>ธนาคาร</th><th className="mono">เลขบัญชี</th><th className="right">จำนวนเงิน</th><th className="center">ตรวจสอบ</th></tr></thead>
              <tbody>
                {groups[co].map((it, i) => (
                  <tr key={i}>
                    <td>{it.name}</td>
                    <td><span style={{ fontSize: 12 }}>{it.bank}</span></td>
                    <td className="mono">{it.acctNo}</td>
                    <td className="right mono">{fmt.money(it.amount, 2)}</td>
                    <td className="center">{bfValidAcct(it.acctNo) ? <span className="pill ok">ถูกต้อง</span> : <span className="pill bad">เลขบัญชีผิด</span>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan="3" className="right">รวมกลุ่ม {co}</td><td className="right mono"><b>{fmt.money(bfTotal(groups[co]), 2)}</b></td><td /></tr></tfoot>
            </table>
          </div>
        </IvSection>
      ))}

      {/* สถานะการโอน */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>บันทึกผลการโอน</h3></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" disabled={file.status !== 'generated'} onClick={() => onUpdate(file.id, 'uploaded')}><Icon name="upload" /> อัปโหลดเข้าธนาคารแล้ว</button>
          <button className="btn primary" disabled={file.status === 'completed'} onClick={() => onUpdate(file.id, 'completed')}><Icon name="check" /> บันทึกโอนสำเร็จ</button>
          <button className="btn danger" disabled={file.status === 'completed'} onClick={() => onUpdate(file.id, 'failed')}><Icon name="close" /> โอนไม่สำเร็จ</button>
        </div>
      </div>
    </div>
  );
}

// ─── โมดัลสร้างไฟล์โอน ────────────────────────────────────────────────
function CreateBankFileModal({ onClose, onCreate }) {
  const [transferType, setTransferType] = useState(BF_TRANSFER_TYPES[0]);
  const [bankId, setBankId] = useState(window.COOP_BANK_ACCOUNTS[0].id);
  const [transferDate, setTransferDate] = useState(ivToday());
  const [picked, setPicked] = useState(() => new Set((window.BANK_PENDING_SEED || []).map(p => p.id)));
  const pending = window.BANK_PENDING_SEED || [];

  const toggle = (id) => setPicked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selItems = pending.filter(p => picked.has(p.id));
  const invalid = selItems.filter(p => !bfValidAcct(p.acctNo)).length;
  const ba = window.COOP_BANK_ACCOUNTS.find(b => b.id === bankId);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="upload" /></div>
          <div style={{ minWidth: 0 }}><h2>สร้างไฟล์โอนธนาคาร</h2>
            <div className="muted" style={{ fontSize: 11 }}>ดึงรายการรอโอน เลือกประเภท และจัดกลุ่มตามรหัสคู่บัญชี</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="iv-form-grid c3">
            <IvField label="ประเภทการโอน" required>
              <select className="cfg-input" value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                {BF_TRANSFER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
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
            <span className="gc-count">{selItems.length}/{pending.length} เลือก</span>
            <span className="spacer" />
            <button className="btn ghost sm" onClick={() => setPicked(new Set(pending.map(p => p.id)))}>เลือกทั้งหมด</button>
            <button className="btn ghost sm" onClick={() => setPicked(new Set())}>ล้าง</button>
          </div>
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 720 }}>
              <thead><tr>
                <th style={{ width: 36 }} /><th>ผู้รับเงิน</th><th>ประเภท</th><th>ธนาคาร</th>
                <th className="mono">เลขบัญชี</th><th className="center">รหัส</th><th className="right">จำนวนเงิน</th><th className="center">ตรวจ</th>
              </tr></thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p.id} className={picked.has(p.id) ? 'selected' : ''} style={{ cursor: 'pointer' }} onClick={() => toggle(p.id)}>
                    <td className="center"><input type="checkbox" className="ct-check" checked={picked.has(p.id)} readOnly /></td>
                    <td><div className="lt-row-name">{p.name}</div><div className="lt-row-note muted mono">{p.memberCode}</div></td>
                    <td style={{ fontSize: 12 }}>{p.type}</td>
                    <td style={{ fontSize: 12 }}>{p.bank}</td>
                    <td className="mono">{p.acctNo}</td>
                    <td className="center"><span className="chip" style={{ height: 18 }}>{p.coCode}</span></td>
                    <td className="right mono">{fmt.money(p.amount, 2)}</td>
                    <td className="center">{bfValidAcct(p.acctNo) ? <Icon name="check" size={13} /> : <span style={{ color: 'var(--danger)' }}><Icon name="close" size={13} /></span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="iv-net-box" style={{ marginTop: 12 }}>
            <div className="iv-net-row"><span>จำนวนรายการที่เลือก</span><span className="mono">{selItems.length} รายการ</span></div>
            {invalid > 0 && <div className="iv-net-row"><span style={{ color: 'var(--danger)' }}>เลขบัญชีไม่ถูกต้อง</span><span className="mono iv-neg">{invalid} รายการ</span></div>}
            <div className="iv-net-row strong" style={{ borderTop: '1px solid var(--divider)', paddingTop: 6 }}><span>ยอดโอนรวม</span><span className="mono"><b>{fmt.money(bfTotal(selItems), 2)}</b></span></div>
          </div>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={selItems.length === 0 || invalid > 0}
                  onClick={() => onCreate({
                    transferType, bankId, destBankScope: 'ทุกธนาคาร', transferDate,
                    items: selItems.map(p => ({ name: p.name, bank: p.bank, acctNo: p.acctNo, amount: p.amount, coCode: p.coCode })),
                  })}>
            <Icon name="download" /> สร้างไฟล์โอน {selItems.length} รายการ
          </button>
        </div>
      </div>
    </>
  );
}

function BankFilePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [files, setFiles] = useState(window.bankLoadFiles);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  const persist = (next) => { setFiles(next); window.bankSaveFiles(next); };
  const openFile = files.find(f => f.id === openId);

  const handleCreate = (data) => {
    const rec = { id: 'BF-2569-' + String(25 + (files.length - window.BANK_FILE_SEED.length)).padStart(4, '0'),
      ...data, createdBy: IV_USER, status: 'generated' };
    persist([rec, ...files]);
    audit.log({ action: 'create', module: 'การเงินการลงทุน — ไฟล์โอนธนาคาร',
      target: rec.id, summary: `สร้างไฟล์โอน ${rec.items.length} รายการ ยอดรวม ${fmt.money(bfTotal(rec.items), 0)} บาท`,
      changes: [{ field: 'ยอดโอนรวม', before: '—', after: fmt.money(bfTotal(rec.items), 0) }] });
    setCreating(false); setOpenId(rec.id);
    onToast && onToast(`สร้างไฟล์โอน ${rec.id} เรียบร้อย (${rec.items.length} รายการ)`);
  };
  const updateStatus = (id, status) => {
    persist(files.map(f => f.id === id ? { ...f, status } : f));
    const l = window.BANK_FILE_STATUS[status].l;
    onToast && onToast(`อัปเดตสถานะไฟล์โอนเป็น "${l}" แล้ว`);
  };

  if (openFile) return <BankFileDetail file={openFile} onBack={() => setOpenId(null)} onUpdate={updateStatus} onToast={onToast} />;

  const pendingTotal = bfTotal(window.BANK_PENDING_SEED || []);

  return (
    <div data-screen-label="หน้าสร้างไฟล์โอนธนาคาร">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สร้างไฟล์โอนธนาคาร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ดึงรายการรอโอน ตรวจสอบเลขบัญชี จัดกลุ่มตามรหัสคู่บัญชี และ Export ไฟล์โอนเข้าระบบธนาคาร
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setCreating(true)}><Icon name="plus" /> สร้างไฟล์โอนใหม่</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}>
        <IvStat label="รายการรอโอน" value={(window.BANK_PENDING_SEED || []).length + ' รายการ'} sub={'฿ ' + fmt.money(pendingTotal, 0)} accent />
        <IvStat label="ไฟล์โอนทั้งหมด" value={files.length + ' ไฟล์'} sub={files.filter(f => f.status === 'completed').length + ' โอนสำเร็จ'} />
        <IvStat label="รอดำเนินการ" value={files.filter(f => f.status === 'generated' || f.status === 'uploaded').length + ' ไฟล์'} tone="warning" />
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 920 }}>
            <thead><tr>
              <th style={{ width: 130 }}>เลขที่ไฟล์</th>
              <th style={{ minWidth: 160 }}>ประเภทการโอน</th>
              <th className="center" style={{ width: 100 }}>วันที่โอน</th>
              <th className="center" style={{ width: 80 }}>รายการ</th>
              <th className="right" style={{ width: 140 }}>ยอดโอนรวม</th>
              <th>ผู้สร้าง</th>
              <th className="center" style={{ width: 110 }}>สถานะ</th>
            </tr></thead>
            <tbody>
              {files.map(f => {
                const st = window.BANK_FILE_STATUS[f.status];
                return (
                  <tr key={f.id} className="clickable" onClick={() => setOpenId(f.id)}>
                    <td className="mono">{f.id}</td>
                    <td><div className="lt-row-name">{f.transferType}</div><div className="lt-row-note muted">ปลายทาง: {f.destBankScope}</div></td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(f.transferDate)}</td>
                    <td className="center mono">{f.items.length}</td>
                    <td className="right mono"><b>{fmt.money(bfTotal(f.items), 2)}</b></td>
                    <td><span style={{ fontSize: 12 }}>{f.createdBy}</span></td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> คลิกไฟล์โอนเพื่อดูรายการแยกตามรหัสคู่บัญชี ตรวจสอบเลขบัญชี และบันทึกผลการโอน สำเร็จ/ไม่สำเร็จ
      </div>

      {creating && <CreateBankFileModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { BankFilePage });
