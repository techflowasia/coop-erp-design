// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ข้อมูลพื้นฐาน — ตั้งค่าการหักเงิน ฌปท / ฌาปนกิจ
//  ตั้งค่าหักอัตโนมัติแยกกองทุน · แก้ไขยอดรายสมาชิก · ประมวลผลหัก/แจ้งเตือน
// ════════════════════════════════════════════════════════════════════

const FNL_USER = 'จันทร์เพ็ญ มาลี';
function fnlLoad() {
  try { const s = localStorage.getItem('dep_funeral'); if (s) return JSON.parse(s); } catch (e) {}
  return window.DEP_FUNERAL_SEED.map(r => ({ ...r }));
}
function fnlSaveLS(list) { try { localStorage.setItem('dep_funeral', JSON.stringify(list)); } catch (e) {} }

const FNL_STATUS = {
  active: { label: 'หักอยู่',   pill: 'ok' },
  paused: { label: 'พักการหัก', pill: 'neutral' },
};

// ─── แก้ไขยอดเฉพาะราย ────────────────────────────────────────────────
function FnlEditModal({ rec, onClose, onSubmit }) {
  const [amount, setAmount] = useState(rec.amount);
  const [reason, setReason] = useState(rec.editedReason || '');
  const [approver, setApprover] = useState(rec.approver || '');
  const [status, setStatus] = useState(rec.status);
  const [error, setError] = useState('');
  const FUNDS = window.DEP_FUNERAL_FUNDS;
  const changed = Number(amount) !== Number(rec.baseAmount);
  const submit = (e) => {
    e.preventDefault();
    if (changed && !reason.trim()) return setError('การแก้ไขยอดต่างจากค่ามาตรฐานต้องระบุเหตุผล');
    if (changed && !approver.trim()) return setError('การแก้ไขยอดต้องระบุผู้อนุมัติ');
    onSubmit({ ...rec, amount: Number(amount), editedReason: changed ? reason.trim() : '', approver: changed ? approver.trim() : '', status });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="edit" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>แก้ไขยอดนำส่งรายสมาชิก</h2>
            <div className="muted" style={{ fontSize: 11 }}>{rec.member} · {rec.name} · {FUNDS[rec.fund]?.code}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div className="fee-form-grid">
            <div>
              <label className="lt-modal-label">ยอดมาตรฐานกองทุน</label>
              <div className="cfg-display mono">{fmt.money(rec.baseAmount, 2)} ฿</div>
            </div>
            <div>
              <label className="lt-modal-label">ยอดที่หักจริง (บาท) <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" type="number" step="0.01" value={amount} autoFocus onChange={(e) => { setAmount(e.target.value); setError(''); }} />
            </div>
          </div>
          {changed && (
            <>
              <label className="lt-modal-label" style={{ marginTop: 12 }}>เหตุผลการแก้ไขยอด <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder="เช่น ปรับเพิ่มตามมติที่ประชุม" />
              <label className="lt-modal-label" style={{ marginTop: 12 }}>ผู้อนุมัติ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={approver} onChange={(e) => { setApprover(e.target.value); setError(''); }} placeholder="ชื่อผู้อนุมัติ" />
            </>
          )}
          <label className="lt-modal-label" style={{ marginTop: 12 }}>สถานะการหัก</label>
          <div className="seg">
            {Object.entries(FNL_STATUS).map(([k, v]) => (
              <button key={k} type="button" className={"seg-btn" + (status === k ? ' active' : '')} onClick={() => setStatus(k)}>{v.label}</button>
            ))}
          </div>
          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> บันทึก</button>
          </div>
        </form>
      </div>
    </>
  );
}

function DepFuneralConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(fnlLoad);
  const [fund, setFund] = useState('all');
  const [editRec, setEditRec] = useState(null);
  const persist = (next) => { setList(next); fnlSaveLS(next); };
  const FUNDS = window.DEP_FUNERAL_FUNDS;

  const rows = fund === 'all' ? list : list.filter(r => r.fund === fund);
  const activeRows = list.filter(r => r.status === 'active');
  const totalAmount = activeRows.reduce((a, r) => a + r.amount, 0);
  const successCount = activeRows.filter(r => r.lastResult === 'success').length;
  const failCount = activeRows.filter(r => r.lastResult === 'fail').length;

  const submitEdit = (rec) => {
    persist(list.map(r => r.id === rec.id ? rec : r));
    audit.log({ action: 'update', module: 'เงินฝาก — หักเงิน ฌปท/ฌาปนกิจ', target: `${rec.member} · ${rec.name}`,
      summary: `แก้ไขยอดหัก ${FUNDS[rec.fund]?.code} เป็น ${fmt.money(rec.amount, 2)} บาท`,
      changes: [{ field: 'ยอดหัก', before: fmt.money(rec.baseAmount, 2), after: fmt.money(rec.amount, 2) }] });
    onToast && onToast(`บันทึกยอดหักของ ${rec.name} เรียบร้อยแล้ว`);
    setEditRec(null);
  };

  // ประมวลผลการหักรอบนี้ — จำลองผลหักสำเร็จ/ไม่สำเร็จ
  const runDeduction = () => {
    const next = list.map(r => {
      if (r.status !== 'active') return r;
      // จำลอง: สมาชิกที่ยอดบัญชีไม่พอ (ตัวอย่าง 60112 ฌาปนกิจ, 61580 ฌปท) → fail
      const fail = (r.member === '60112' && r.fund === 'CHAPA') || (r.member === '61580' && r.fund === 'CHPT');
      return { ...r, lastResult: fail ? 'fail' : 'success' };
    });
    persist(next);
    const ok = next.filter(r => r.status === 'active' && r.lastResult === 'success').length;
    const ng = next.filter(r => r.status === 'active' && r.lastResult === 'fail').length;
    audit.log({ action: 'process', module: 'เงินฝาก — หักเงิน ฌปท/ฌาปนกิจ', target: 'รอบประมวลผลการหัก',
      summary: `ประมวลผลการหักกองทุน — สำเร็จ ${ok} ราย, ไม่สำเร็จ ${ng} ราย`,
      changes: [{ field: 'ผลการหัก', before: '—', after: `สำเร็จ ${ok} / ไม่สำเร็จ ${ng}` }] });
    onToast && onToast(`ประมวลผลการหักเสร็จสิ้น — สร้างรายการนำฝากเข้ากองทุน ${ok} ราย${ng ? `, แจ้งเตือนหักไม่สำเร็จ ${ng} ราย` : ''}`);
  };

  return (
    <div data-screen-label="หน้าตั้งค่าการหักเงิน ฌปท/ฌาปนกิจ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตั้งค่าการหักเงิน ฌปท / ฌาปนกิจ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>หักเงินจากบัญชีเงินฝากเข้ากองทุนสวัสดิการอัตโนมัติ — แก้ไขยอดรายสมาชิกได้ กรณีหักไม่ได้จะแจ้งเตือนและไม่หักเงิน</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={runDeduction}>ประมวลผลการหักรอบนี้</button>
      </div>

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <IvStat label="ยอดหักรวมต่อรอบ" value={fmt.money(totalAmount, 2)} sub={'บาท · ' + activeRows.length + ' รายการหักที่ใช้งาน'} accent />
        <IvStat label="หักสำเร็จล่าสุด" value={successCount} sub="รายการ · สร้างรายการนำฝากเข้ากองทุนแล้ว" tone="success" />
        <IvStat label="หักไม่สำเร็จ" value={failCount} sub="รายการ · ยอดเงินไม่พอ — แจ้งเตือนและไม่หักเงิน" tone={failCount ? 'danger' : undefined} />
      </div>

      <div className="section" style={{ marginTop: 16 }}>
        <div className="toolbar" style={{ marginTop: 0 }}>
          {[['all', 'ทั้งหมด'], ['CHPT', 'ฌปท.'], ['CHAPA', 'ฌาปนกิจ']].map(([v, label]) => (
            <button key={v} className={"filter-chip" + (fund === v ? ' active' : '')} onClick={() => setFund(v)}>{label}</button>
          ))}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>{rows.length} รายการ</span>
        </div>

        <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
            <table className="tbl" style={{ width: '100%', minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>กองทุน</th>
                  <th style={{ width: 90 }}>รหัสสมาชิก</th>
                  <th style={{ minWidth: 160 }}>ชื่อสมาชิก</th>
                  <th style={{ width: 130 }}>บัญชีที่ใช้หัก</th>
                  <th className="right" style={{ width: 110 }}>ยอดหัก</th>
                  <th className="center" style={{ width: 90 }}>ความถี่</th>
                  <th className="center" style={{ width: 100 }}>สถานะ</th>
                  <th className="center" style={{ width: 110 }}>ผลหักล่าสุด</th>
                  <th className="center" style={{ width: 100 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const st = FNL_STATUS[r.status] || FNL_STATUS.active;
                  const edited = Number(r.amount) !== Number(r.baseAmount);
                  return (
                    <tr key={r.id}>
                      <td><span className="chip info"><span className="dot-c" />{FUNDS[r.fund]?.code}</span></td>
                      <td className="mono">{r.member}</td>
                      <td>{r.name}</td>
                      <td className="mono">{r.accNo}</td>
                      <td className="right mono">
                        <b>{fmt.money(r.amount, 2)}</b>
                        {edited && <span className="chip warning" style={{ marginLeft: 6 }} title={r.editedReason}>แก้ไข</span>}
                      </td>
                      <td className="center">{r.freq}</td>
                      <td className="center"><span className={"pill " + st.pill}>{st.label}</span></td>
                      <td className="center">
                        {r.status !== 'active' ? <span className="muted">—</span>
                          : r.lastResult === 'success' ? <span className="pill ok">สำเร็จ</span>
                          : <span className="pill bad">ไม่สำเร็จ</span>}
                      </td>
                      <td className="center"><button className="btn sm ex-row-btn" onClick={() => setEditRec(r)}><Icon name="edit" size={13} /> แก้ไข</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lt-list-foot muted">
          <Icon name="info" size={12} /> ระบบหักอัตโนมัติแยกตามประเภทกองทุน — กรณีหักไม่ได้จะแจ้งเตือนและไม่หักเงินเลย จากนั้นออกรายงานสมาชิกที่หักสำเร็จ/ไม่สำเร็จ
        </div>
      </div>

      {editRec && <FnlEditModal rec={editRec} onClose={() => setEditRec(null)} onSubmit={submitEdit} />}
    </div>
  );
}

Object.assign(window, { DepFuneralConfigPage });
