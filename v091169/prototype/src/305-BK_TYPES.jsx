// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › เอกสาร — ลงทะเบียนสมุด / ยกเลิกสมุด (เล่ม & ใบ Cert.)
//  • เลือกโหมด: ลงทะเบียน หรือ ยกเลิก เล่ม/ใบ Cert.
//  • เลือกประเภทเล่ม · เลือกกลุ่มเล่ม · กำหนด Lot · จำนวนที่เพิ่ม · เลขเริ่มต้น
//  • ทะเบียน Lot ทั้งหมด + ตรวจเลขซ้ำ + ยกเลิกทั้ง Lot หรือช่วงเลข
// ════════════════════════════════════════════════════════════════════

// ── ประเภทเล่ม (kind: 'book' = เล่ม, 'cert' = ใบ Cert.) ──
const BK_TYPES = [
  { code: 'PB-SAV',  kind: 'book', label: 'สมุดเงินฝากออมทรัพย์',  prefix: 'SAV' },
  { code: 'PB-FIX',  kind: 'book', label: 'สมุดเงินฝากประจำ',      prefix: 'FIX' },
  { code: 'PB-LOAN', kind: 'book', label: 'สมุดคู่สัญญาเงินกู้',    prefix: 'LON' },
  { code: 'CT-SHR',  kind: 'cert', label: 'ใบหุ้น (Share Cert.)',   prefix: 'SHR' },
  { code: 'CT-DEP',  kind: 'cert', label: 'ใบรับเงินฝาก (Cert.)',   prefix: 'DEP' },
];
const BK_GROUPS = [
  { code: 'G-HQ',  label: 'สำนักงานใหญ่' },
  { code: 'G-BKN', label: 'สาขาบางเขน' },
  { code: 'G-NTB', label: 'สาขานนทบุรี' },
  { code: 'G-STK', label: 'คลังกลาง (สต๊อกสำรอง)' },
];
const bkType  = (c) => BK_TYPES.find(t => t.code === c) || BK_TYPES[0];
const bkGroup = (c) => (BK_GROUPS.find(g => g.code === c) || BK_GROUPS[0]).label;
const bkUnit  = (c) => bkType(c).kind === 'cert' ? 'ใบ' : 'เล่ม';

const BK_SEED = [
  { id: 'LOT-2569-0007', typeCode: 'PB-SAV',  group: 'G-HQ',  startNo: '069000501', count: 200, cancelled: 0,  regDate: '2026-05-12', by: 'จันทร์เพ็ญ มาลี', status: 'active' },
  { id: 'LOT-2569-0006', typeCode: 'CT-SHR',  group: 'G-HQ',  startNo: '000012001', count: 500, cancelled: 0,  regDate: '2026-04-28', by: 'จันทร์เพ็ญ มาลี', status: 'active' },
  { id: 'LOT-2569-0005', typeCode: 'PB-SAV',  group: 'G-BKN', startNo: '069000301', count: 200, cancelled: 12, regDate: '2026-03-30', by: 'สมชาย ทองดี',    status: 'active' },
  { id: 'LOT-2569-0004', typeCode: 'PB-FIX',  group: 'G-HQ',  startNo: '022000101', count: 100, cancelled: 0,  regDate: '2026-03-04', by: 'สมชาย ทองดี',    status: 'active' },
  { id: 'LOT-2569-0003', typeCode: 'CT-DEP',  group: 'G-NTB', startNo: '000004501', count: 300, cancelled: 300,regDate: '2026-02-11', by: 'จันทร์เพ็ญ มาลี', status: 'cancelled', cancelDate: '2026-05-02', cancelReason: 'พิมพ์ผิดรูปแบบ — ส่งคืนโรงพิมพ์ทั้ง Lot' },
  { id: 'LOT-2569-0002', typeCode: 'PB-LOAN', group: 'G-HQ',  startNo: '015000201', count: 150, cancelled: 0,  regDate: '2026-01-20', by: 'สมชาย ทองดี',    status: 'active' },
];

function bkLoad() {
  try { const s = localStorage.getItem('dep_book_lots'); if (s) return JSON.parse(s); } catch (e) {}
  return BK_SEED.map(r => ({ ...r }));
}
function bkSave(rows) { try { localStorage.setItem('dep_book_lots', JSON.stringify(rows)); } catch (e) {} }

// เลขสิ้นสุดจากเลขเริ่มต้น + จำนวน (คงความกว้าง/เลขศูนย์นำหน้า)
function bkEndNo(startNo, count) {
  if (!/^\d+$/.test(String(startNo)) || !count) return '';
  const w = String(startNo).length;
  return String(parseInt(startNo, 10) + Number(count) - 1).padStart(w, '0');
}
// ช่วงสองชุดทับซ้อนกันหรือไม่ (ตรวจเลขซ้ำภายในประเภทเดียวกัน)
function bkOverlap(aS, aC, bS, bC) {
  const a0 = parseInt(aS, 10), a1 = a0 + aC - 1;
  const b0 = parseInt(bS, 10), b1 = b0 + bC - 1;
  return !(a1 < b0 || a0 > b1);
}

// ─── โมดัลยกเลิกเล่ม / ใบ Cert. ───────────────────────────────────────
function BkCancelModal({ lot, onClose, onCancel }) {
  const t = bkType(lot.typeCode);
  const unit = bkUnit(lot.typeCode);
  const remain = lot.count - (lot.cancelled || 0);
  const [scope, setScope] = useState('all');           // all | range
  const [fromNo, setFromNo] = useState(lot.startNo);
  const [toNo, setToNo] = useState(bkEndNo(lot.startNo, lot.count));
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');

  const lotStart = parseInt(lot.startNo, 10);
  const lotEnd = lotStart + lot.count - 1;
  const rangeQty = (/^\d+$/.test(fromNo) && /^\d+$/.test(toNo))
    ? (parseInt(toNo, 10) - parseInt(fromNo, 10) + 1) : 0;
  const qty = scope === 'all' ? remain : rangeQty;

  const submit = () => {
    if (!reason.trim()) return setErr('กรุณาระบุเหตุผลการยกเลิก');
    if (scope === 'range') {
      if (!/^\d+$/.test(fromNo) || !/^\d+$/.test(toNo)) return setErr('ระบุช่วงเลขเป็นตัวเลข');
      const f = parseInt(fromNo, 10), tno = parseInt(toNo, 10);
      if (tno < f) return setErr('เลขสิ้นสุดต้องไม่น้อยกว่าเลขเริ่มต้น');
      if (f < lotStart || tno > lotEnd) return setErr(`ช่วงเลขต้องอยู่ภายใน ${lot.startNo}–${bkEndNo(lot.startNo, lot.count)}`);
    }
    onCancel(lot, qty, reason.trim(), scope);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 500 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}><Icon name="close" /></div>
          <div style={{ minWidth: 0 }}><h2>ยกเลิก{unit} — {t.label}</h2>
            <div className="muted" style={{ fontSize: 11 }}>Lot <span className="mono">{lot.id}</span> · {bkGroup(lot.group)} · คงเหลือ {remain} {unit}</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="iv-form-grid c2">
            <IvField label="ขอบเขตการยกเลิก" span={2}>
              <div className="seg" role="tablist" style={{ width: '100%' }}>
                <button className={"seg-btn" + (scope === 'all' ? ' active' : '')} onClick={() => setScope('all')}>ทั้ง Lot ({remain} {unit})</button>
                <button className={"seg-btn" + (scope === 'range' ? ' active' : '')} onClick={() => setScope('range')}>ระบุช่วงเลข</button>
              </div>
            </IvField>
            {scope === 'range' && <>
              <IvField label="เลขเริ่มต้น" required>
                <input className="cfg-input mono" value={fromNo} onChange={(e) => { setFromNo(e.target.value); setErr(''); }} />
              </IvField>
              <IvField label="เลขสิ้นสุด" required>
                <input className="cfg-input mono" value={toNo} onChange={(e) => { setToNo(e.target.value); setErr(''); }} />
              </IvField>
            </>}
            <IvField label="เหตุผลการยกเลิก" required span={2}>
              <input className="cfg-input" value={reason} placeholder="เช่น เล่มชำรุด / พิมพ์ผิด / ส่งคืนโรงพิมพ์" onChange={(e) => { setReason(e.target.value); setErr(''); }} />
            </IvField>
          </div>
          <div className="lt-num-note" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">จำนวนที่จะยกเลิก</span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--danger)' }}>{qty} {unit}</span>
          </div>
          {err && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ปิด</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={submit}><Icon name="close" /> ยืนยันยกเลิก</button>
          </div>
        </div>
      </div>
    </>
  );
}

function BookRegisterPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [lots, setLots] = useState(bkLoad);
  const [mode, setMode] = useState('register');   // register | cancel

  // ── ฟอร์มลงทะเบียน ──
  const [typeCode, setTypeCode] = useState(BK_TYPES[0].code);
  const [group, setGroup] = useState(BK_GROUPS[0].code);
  const [lotNo, setLotNo] = useState('');
  const [count, setCount] = useState('');
  const [startNo, setStartNo] = useState('');
  const [err, setErr] = useState('');

  const [cancelLot, setCancelLot] = useState(null);

  const unit = bkUnit(typeCode);
  const endNo = bkEndNo(startNo, count);
  const nextLotNo = 'LOT-2569-' + String(8 + (lots.length - BK_SEED.length)).padStart(4, '0');

  const resetForm = () => { setLotNo(''); setCount(''); setStartNo(''); setErr(''); };

  const register = () => {
    const lot = (lotNo.trim() || nextLotNo);
    const c = parseInt(count, 10);
    if (!/^\d+$/.test(String(count)) || c <= 0) return setErr('ระบุจำนวนที่เพิ่มเป็นตัวเลขมากกว่า 0');
    if (!/^\d+$/.test(startNo)) return setErr('ระบุเลขเริ่มต้นเป็นตัวเลข');
    if (lots.some(l => l.id === lot)) return setErr(`เลข Lot ${lot} มีอยู่แล้วในทะเบียน`);
    // ตรวจเลขซ้ำภายในประเภทเล่มเดียวกัน
    const dup = lots.find(l => l.typeCode === typeCode && l.status !== 'cancelled' && bkOverlap(l.startNo, l.count, startNo, c));
    if (dup) return setErr(`ช่วงเลขนี้ซ้ำกับ Lot ${dup.id} (${dup.startNo}–${bkEndNo(dup.startNo, dup.count)})`);
    const rec = { id: lot, typeCode, group, startNo, count: c, cancelled: 0, regDate: ivToday(), by: IV_USER, status: 'active' };
    const next = [rec, ...lots];
    setLots(next); bkSave(next);
    audit.log({ action: 'create', module: 'เงินฝาก — ลงทะเบียนสมุด/ใบ Cert.',
      target: lot, summary: `ลงทะเบียน ${bkType(typeCode).label} ${c} ${unit} (Lot ${lot})`,
      changes: [
        { field: 'ประเภทเล่ม', before: '—', after: bkType(typeCode).label },
        { field: 'ช่วงเลข', before: '—', after: `${startNo}–${bkEndNo(startNo, c)}` },
        { field: 'จำนวน', before: '—', after: `${c} ${unit}` },
      ] });
    onToast && onToast(`ลงทะเบียน ${bkType(typeCode).label} Lot ${lot} เรียบร้อย (${c} ${unit})`);
    resetForm();
  };

  const doCancel = (lot, qty, reason, scope) => {
    const cancelledTotal = scope === 'all' ? lot.count : (lot.cancelled || 0) + qty;
    const status = cancelledTotal >= lot.count ? 'cancelled' : 'active';
    const next = lots.map(l => l.id === lot.id
      ? { ...l, cancelled: cancelledTotal, status, cancelDate: ivToday(), cancelReason: reason } : l);
    setLots(next); bkSave(next);
    audit.log({ action: 'delete', module: 'เงินฝาก — ลงทะเบียนสมุด/ใบ Cert.',
      target: lot.id, summary: `ยกเลิก ${bkType(lot.typeCode).label} ${qty} ${bkUnit(lot.typeCode)} (Lot ${lot.id})`,
      changes: [{ field: 'เหตุผล', before: '—', after: reason }] });
    setCancelLot(null);
    onToast && onToast(`ยกเลิก ${qty} ${bkUnit(lot.typeCode)} ใน Lot ${lot.id} เรียบร้อย`);
  };

  // ── สรุปตัวเลข ──
  const totalBooks = lots.reduce((a, l) => a + l.count, 0);
  const totalCancelled = lots.reduce((a, l) => a + (l.cancelled || 0), 0);
  const totalRemain = totalBooks - totalCancelled;
  const activeLots = lots.filter(l => l.status === 'active');

  return (
    <div data-screen-label="หน้าลงทะเบียนสมุด / ยกเลิกสมุด">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ลงทะเบียนสมุด / ยกเลิกสมุด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนสต๊อกเล่มสมุดคู่ฝากและใบ Cert. — ลงทะเบียนรับเข้าเป็น Lot หรือยกเลิกเล่ม/ใบที่ชำรุด
          </div>
        </div>
      </div>

      <div className="bk-kpis">
        <div className="bk-kpi">
          <div className="bk-kpi-l">รวมในทะเบียน</div>
          <div className="bk-kpi-v">{totalBooks.toLocaleString()} <small>เล่ม/ใบ · {lots.length} Lot</small></div>
        </div>
        <div className="bk-kpi">
          <div className="bk-kpi-l">คงเหลือพร้อมใช้</div>
          <div className="bk-kpi-v mono ok">{totalRemain.toLocaleString()}</div>
          <div className="bk-kpi-s">เล่ม/ใบ</div>
        </div>
        <div className="bk-kpi">
          <div className="bk-kpi-l">ยกเลิกแล้ว</div>
          <div className="bk-kpi-v mono bad">{totalCancelled.toLocaleString()}</div>
          <div className="bk-kpi-s">เล่ม/ใบ</div>
        </div>
        <div className="bk-kpi">
          <div className="bk-kpi-l">Lot ใช้งานอยู่</div>
          <div className="bk-kpi-v mono">{activeLots.length}</div>
          <div className="bk-kpi-s">Lot · มีเล่ม/ใบคงเหลือ</div>
        </div>
      </div>

      {/* ── สลับโหมด ── */}
      <div className="seg" role="tablist" style={{ marginTop: 12, maxWidth: 420 }}>
        <button className={"seg-btn" + (mode === 'register' ? ' active' : '')} onClick={() => setMode('register')}>
          <Icon name="plus" size={13} /> ลงทะเบียนเล่ม / ใบ Cert.
        </button>
        <button className={"seg-btn" + (mode === 'cancel' ? ' active' : '')} onClick={() => setMode('cancel')}>
          <Icon name="close" size={13} /> ยกเลิกเล่ม / ใบ Cert.
        </button>
      </div>

      {mode === 'register' && (
        <div className="search-card" style={{ marginTop: 12, padding: 18 }}>
          <div className="dat-section-head" style={{ marginBottom: 12 }}>
            <span className="dat-section-ico"><Icon name="plus" size={15} /></span>
            <div><div className="dat-section-title">ลงทะเบียนรับเข้าเล่ม / ใบ Cert.</div>
              <div className="muted" style={{ fontSize: 11.5 }}>บันทึกเล่มสมุดหรือใบ Cert. ที่รับเข้าคลังเป็น Lot</div></div>
          </div>
          <div className="iv-form-grid c3">
            <IvField label="ประเภทเล่ม" required>
              <select className="cfg-input" value={typeCode} onChange={(e) => { setTypeCode(e.target.value); setErr(''); }}>
                {BK_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </IvField>
            <IvField label="กลุ่มเล่ม" required>
              <select className="cfg-input" value={group} onChange={(e) => setGroup(e.target.value)}>
                {BK_GROUPS.map(g => <option key={g.code} value={g.code}>{g.label}</option>)}
              </select>
            </IvField>
            <IvField label="เลขที่ Lot" hint="เว้นว่างเพื่อออกอัตโนมัติ">
              <input className="cfg-input mono" value={lotNo} placeholder={nextLotNo} onChange={(e) => { setLotNo(e.target.value); setErr(''); }} />
            </IvField>
            <IvField label={`จำนวนที่เพิ่ม (${unit})`} required>
              <div className="lt-num-wrap"><input className="cfg-input mono" type="number" min="1" value={count} placeholder="เช่น 200" onChange={(e) => { setCount(e.target.value); setErr(''); }} /><span className="lt-suffix">{unit}</span></div>
            </IvField>
            <IvField label="เลขเริ่มต้น" required hint="รองรับเลขศูนย์นำหน้า">
              <input className="cfg-input mono" value={startNo} placeholder="เช่น 069000701" onChange={(e) => { setStartNo(e.target.value); setErr(''); }} />
            </IvField>
            <IvField label="เลขสิ้นสุด (คำนวณอัตโนมัติ)">
              <input className="cfg-input mono" value={endNo} disabled style={{ background: 'var(--bg-subtle)' }} />
            </IvField>
          </div>
          {err && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {err}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {count && startNo && /^\d+$/.test(startNo) && /^\d+$/.test(String(count))
                ? <>จะลงทะเบียน <b>{bkType(typeCode).label}</b> · ช่วงเลข <span className="mono">{startNo}–{endNo}</span> · {Number(count)} {unit}</>
                : 'กรอกจำนวนและเลขเริ่มต้นเพื่อดูช่วงเลข'}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn" onClick={resetForm}>ล้างฟอร์ม</button>
            <button className="btn primary" onClick={register}><Icon name="check" /> ลงทะเบียน Lot</button>
          </div>
        </div>
      )}

      {mode === 'cancel' && (
        <div className="lt-list-foot muted" style={{ marginTop: 12, marginBottom: -4 }}>
          <Icon name="info" size={12} /> เลือก Lot ที่ต้องการยกเลิกจากปุ่ม “ยกเลิก” ในตารางด้านล่าง — ยกเลิกได้ทั้ง Lot หรือระบุช่วงเลข
        </div>
      )}

      {/* ── ทะเบียน Lot ── */}
      <div className="search-card dat-section" style={{ padding: 0, marginTop: 12 }}>
        <div className="table-wrap" style={{ margin: 16 }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1040 }}>
            <thead><tr>
              <th style={{ width: 132 }}>เลขที่ Lot</th>
              <th style={{ minWidth: 170 }}>ประเภทเล่ม</th>
              <th style={{ width: 140 }}>กลุ่มเล่ม</th>
              <th className="center" style={{ width: 168 }}>ช่วงเลข</th>
              <th className="center" style={{ width: 78 }}>จำนวน</th>
              <th className="center" style={{ width: 78 }}>คงเหลือ</th>
              <th className="center" style={{ width: 96 }}>วันลงทะเบียน</th>
              <th className="center" style={{ width: 92 }}>สถานะ</th>
              {mode === 'cancel' && <th className="center" style={{ width: 84 }}>จัดการ</th>}
            </tr></thead>
            <tbody>
              {lots.map(l => {
                const t = bkType(l.typeCode);
                const remain = l.count - (l.cancelled || 0);
                const u = bkUnit(l.typeCode);
                return (
                  <tr key={l.id}>
                    <td className="mono">{l.id}</td>
                    <td>
                      <div className="lt-row-name">{t.label}</div>
                      <div className="lt-row-note muted"><span className={"chip " + (t.kind === 'cert' ? 'info' : 'primary')} style={{ height: 16, fontSize: 10 }}>{t.kind === 'cert' ? 'ใบ Cert.' : 'เล่ม'}</span></div>
                    </td>
                    <td>{bkGroup(l.group)}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{l.startNo}–{bkEndNo(l.startNo, l.count)}</td>
                    <td className="center mono">{l.count}</td>
                    <td className="center mono" style={{ color: remain > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>{remain}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(l.regDate)}</td>
                    <td className="center">
                      {l.status === 'cancelled'
                        ? <span className="pill bad" title={l.cancelReason || ''}>ยกเลิกแล้ว</span>
                        : (l.cancelled ? <span className="pill warn" title={l.cancelReason || ''}>ยกเลิกบางส่วน</span> : <span className="pill ok">ใช้งาน</span>)}
                    </td>
                    {mode === 'cancel' && <td className="center">
                      {l.status !== 'cancelled'
                        ? <button className="btn text danger sm" onClick={() => setCancelLot(l)}>ยกเลิก</button>
                        : <span className="muted" style={{ fontSize: 11 }}>—</span>}
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ระบบตรวจเลขซ้ำภายในประเภทเล่มเดียวกันขณะลงทะเบียน — เล่ม/ใบที่ยกเลิกแล้วจะถูกกันออกจากยอดคงเหลือพร้อมใช้
      </div>

      {cancelLot && <BkCancelModal lot={cancelLot} onClose={() => setCancelLot(null)} onCancel={doCancel} />}
    </div>
  );
}

Object.assign(window, { BookRegisterPage });
