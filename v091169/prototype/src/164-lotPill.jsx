// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: กำหนด Lot จ่ายเงินกู้
//  จัดกลุ่มรายการคำขอกู้ที่อนุมัติแล้ว เพื่อเตรียมโอน/จ่ายเงินกู้เป็นรอบ (Lot)
//  1) ตัวกรอง+ดึงข้อมูล  2) กำหนด Lot ให้รายการที่เลือก
//  3) ส่งออกเอกสาร/รายงาน  4) ตารางคำขอกู้  5) สรุปผลท้ายหน้าจอ
// ════════════════════════════════════════════════════════════════════

// pill แสดงค่า Lot ปัจจุบันของรายการ
const lotPill = (v) => {
  if (v == null || v === '' || v === 'unassigned' || v === 'clear' || v === 'pending') return <span className="pill warn">รอจ่าย</span>;
  return <span className="pill info">{window.lotLabel(v)}</span>;
};

function LoanPayLotPage({ onToast }) {
  const workDate = window.DEPOSIT_WORKING_DATE;
  const PROJECTS = window.lotProjects();
  const LOTS = window.LOT_RANGE_OPTIONS;

  // ── ส่วนที่ 1: ตัวกรอง ──
  const [payDate, setPayDate]   = useState(workDate);
  const [lotFrom, setLotFrom]   = useState('');
  const [lotTo, setLotTo]       = useState('');
  const [payMethod, setPayMethod] = useState('transfer');
  const [typeFrom, setTypeFrom] = useState((PROJECTS[0] || {}).id || '');
  const [typeTo, setTypeTo]     = useState((PROJECTS[PROJECTS.length - 1] || {}).id || '');

  // ── ตาราง / การเลือก ──
  const [rows, setRows]       = useState([]);   // ว่างจนกว่าจะกดดึงข้อมูล
  const [pulled, setPulled]   = useState(false);
  const [checked, setChecked] = useState({});   // { [reqNo]: true }
  const [setLot, setSetLot]   = useState('pending');
  const [okMsg, setOkMsg]     = useState(null);
  const [report, setReport]   = useState(null);   // 'deposit' | 'cbt'

  const payMethodLabel = (window.LOT_PAY_METHODS.find(o => o.v === payMethod) || {}).l || '';

  // ── ดึงข้อมูลตามเงื่อนไขตัวกรอง ──
  const pull = () => {
    const pIdx = (id) => PROJECTS.findIndex(p => p.id === id);
    const pa = pIdx(typeFrom), pb = pIdx(typeTo);
    const lIdx = (v) => LOTS.findIndex(o => o.v === v);
    const la = lotFrom ? lIdx(lotFrom) : 0, lb = lotTo ? lIdx(lotTo) : LOTS.length - 1;
    const fromApproval = window.laApprovedForLot ? window.laApprovedForLot() : [];
    const seen = new Set(fromApproval.map(r => r.reqNo));
    const list = [...fromApproval, ...window.LOT_REQUESTS.filter(r => !seen.has(r.reqNo))].filter(r => {
      if (r.payMethod !== payMethod) return false;
      const pj = r.projectId || window.LOT_TYPE_PROJECT[r.typeCode];
      const pi = pIdx(pj);
      // โครงการที่ปิดใช้งานแล้ว (ไม่อยู่ในรายการ) — ยังแสดงรายการที่อนุมัติไว้ เพื่อให้จัดจ่ายได้
      if (pi >= 0 && pa >= 0 && pb >= 0 && (pi < Math.min(pa, pb) || pi > Math.max(pa, pb))) return false;
      const li = lIdx(r.lot && !['clear', 'unassigned'].includes(r.lot) ? r.lot : 'pending');
      return li >= Math.min(la, lb) && li <= Math.max(la, lb);
    }).map((r, i) => ({ ...r, projectId: r.projectId || window.LOT_TYPE_PROJECT[r.typeCode], seq: i + 1 }));
    setRows(list);
    setChecked({});
    setPulled(true);
  };

  const allChecked = rows.length > 0 && rows.every(r => checked[r.reqNo]);
  const someChecked = rows.some(r => checked[r.reqNo]);
  const selectedCount = rows.filter(r => checked[r.reqNo]).length;

  const toggleAll = () => {
    if (allChecked) { setChecked({}); }
    else { const n = {}; rows.forEach(r => { n[r.reqNo] = true; }); setChecked(n); }
  };
  const toggleOne = (reqNo) => setChecked(p => {
    const n = { ...p }; if (n[reqNo]) delete n[reqNo]; else n[reqNo] = true; return n;
  });

  // ── ส่วนที่ 2: กำหนด Lot ให้รายการที่เลือก ──
  const applySet = () => {
    if (selectedCount === 0) { onToast && onToast('กรุณาเลือกรายการคำขอกู้ในตารางก่อนกดตั้งค่า Lot'); return; }
    const newLot = setLot;
    setRows(prev => prev.map(r => checked[r.reqNo] ? { ...r, lot: newLot } : r));
    const approvedIds = rows.filter(r => checked[r.reqNo] && r.fromApproval).map(r => r.reqNo);
    if (approvedIds.length && window.laReqSetLot) window.laReqSetLot(approvedIds, newLot);
    setOkMsg({
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: `ตั้งค่า “${window.lotLabel(setLot)}” ให้รายการคำขอกู้ ${selectedCount} รายการ เรียบร้อยแล้ว`,
    });
  };

  // ── ส่วนที่ 3: ส่งออกเอกสาร / รายงาน ──
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);
  const guardExport = (label) => {
    if (rows.length === 0) { onToast && onToast('ยังไม่มีรายการ — กรุณากดดึงข้อมูลก่อนออกเอกสาร'); return false; }
    onToast && onToast(label);
    return true;
  };

  const TypeSelect = ({ value, onChange }) => (
    <select className="filter-select lot-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {PROJECTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
  const LotSelect = ({ value, onChange }) => (
    <select className="cfg-input" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, minWidth: 0 }}>
      <option value="">ทุก Lot</option>
      {LOTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  return (
    <div data-screen-label="หน้ากำหนด Lot จ่ายเงินกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            กำหนด Lot จ่ายเงินกู้
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            จัดกลุ่มรายการคำขอกู้ที่อนุมัติแล้ว เพื่อเตรียมโอน/จ่ายเงินกู้ออกเป็นรอบ (Lot)
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{fmt.date(workDate)}</span>
        </div>
      </div>

      {/* ── ส่วนที่ 1: ตัวกรองและดึงข้อมูล ── */}
      <div className="search-card icr-sec">
        <div className="icr-strip" style={{ alignItems: 'flex-end' }}>
          <div className="icr-fld" style={{ width: 160 }}>
            <span className="icr-fld-l">วันที่จ่ายเงินกู้</span>
            <ErpDate value={payDate} onChange={(v) => setPayDate(v)} className="cfg-input mono" />
          </div>
          <div className="icr-fld" style={{ width: 170 }}>
            <span className="icr-fld-l">วิธีรับเงินกู้</span>
            <select className="cfg-input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {window.LOT_PAY_METHODS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="icr-fld" style={{ width: 260 }}>
            <span className="icr-fld-l">ช่วง Lot</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LotSelect value={lotFrom} onChange={setLotFrom} />
              <span className="muted">–</span>
              <LotSelect value={lotTo} onChange={setLotTo} />
            </div>
          </div>
          <div className="icr-fld" style={{ flex: '1 1 0', minWidth: 300 }}>
            <span className="icr-fld-l">โครงการเงินกู้ (ตั้งแต่ – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}><TypeSelect value={typeFrom} onChange={setTypeFrom} /></div>
              <span className="muted">–</span>
              <div style={{ flex: 1, minWidth: 0 }}><TypeSelect value={typeTo} onChange={setTypeTo} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={pull}><Icon name="search" size={13} /> ค้นหา</button>
            <button className="btn" onClick={() => { setPayDate(workDate); setPayMethod('transfer'); setLotFrom(''); setLotTo(''); setTypeFrom((PROJECTS[0] || {}).id || ''); setTypeTo((PROJECTS[PROJECTS.length - 1] || {}).id || ''); }}><Icon name="refresh" size={13} /> รีเซ็ต</button>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 2 + 3 + 4 + 5 ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" />
          <h3>รายการคำขอกู้เพื่อจัดจ่าย</h3>
        </div>

        {/* ส่วนที่ 2: กำหนด Lot จ่าย + Set / ส่วนที่ 3: ส่งออกข้อมูลและรายงาน */}
        <div className="lot-toolbar">
          <div className="lot-set-group">
            <span className="lot-set-label">กำหนด Lot จ่าย</span>
            <select className="filter-select" value={setLot} onChange={(e) => setSetLot(e.target.value)}>
              {window.LOT_SET_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <button className="btn primary" onClick={applySet} disabled={selectedCount === 0}>
              <Icon name="check" /> Set
            </button>
            <span className="lot-sel-note muted">
              {selectedCount > 0 ? `เลือกแล้ว ${selectedCount} รายการ` : 'ยังไม่ได้เลือกรายการ'}
            </span>
          </div>

          <span className="spacer" />

          <div className="lot-exports">
            <button className="btn sm" onClick={() => guardExport('กำลังพิมพ์รายงานจ่ายตาม Lot…')}>
              <Icon name="print" /> รายงานจ่ายตาม Lot
            </button>
            <button className="btn sm" onClick={() => { if (rows.length === 0) guardExport(''); else setReport('cbt'); }}>
              <Icon name="print" /> รายงาน CBT ตามสาขาธนาคาร
            </button>
            <button className="btn sm" onClick={() => guardExport('กำลังสร้างไฟล์ Export KTB สำหรับอัปโหลดเข้าระบบโอนเงินแบบกลุ่ม…')}>
              <Icon name="download" /> Export KTB
            </button>
            <button className="btn sm" onClick={() => { if (rows.length === 0) guardExport(''); else setReport('deposit'); }}>
              <Icon name="print" /> รายงานเงินฝากตาม Lot
            </button>
          </div>
        </div>

        {/* ส่วนที่ 4: ตารางรายการคำขอกู้ */}
        {!pulled ? (
          <div className="gc-placeholder lot-placeholder">
            <div className="gc-ph-ico"><Icon name="filter" size={24} /></div>
            <div className="gc-ph-title">ยังไม่ได้ดึงข้อมูล</div>
            <div className="gc-ph-sub">
              กำหนดเงื่อนไขในส่วนตัวกรองด้านบน แล้วกด “ดึงข้อมูล” เพื่อแสดงรายการคำขอกู้ที่อนุมัติแล้ว
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">ไม่พบรายการคำขอกู้ที่ตรงกับเงื่อนไขที่กำหนด</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 36 }}>
                    <input type="checkbox" className="ct-check" checked={allChecked}
                           ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                           onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                  </th>
                  <th className="center" style={{ width: 96 }}>Lot</th>
                  <th className="center" style={{ width: 52 }}>ลำดับ</th>
                  <th>เลขที่คำขอกู้</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>สังกัด</th>
                  <th className="num">จำนวนเงิน</th>
                  <th>ผู้ป้อนคำขอ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const on = !!checked[r.reqNo];
                  return (
                    <tr key={r.reqNo} className={"clickable" + (on ? ' selected' : '')}
                        onClick={() => toggleOne(r.reqNo)}>
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="ct-check" checked={on}
                               onChange={() => toggleOne(r.reqNo)} />
                      </td>
                      <td className="center">{lotPill(r.lot)}</td>
                      <td className="center mono">{r.seq}</td>
                      <td className="mono">{r.reqNo}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="row-avatar">{r.name.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td>{r.dept}</td>
                      <td className="num">{fmt.money(r.amount, 2)}</td>
                      <td>{r.enteredBy}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'right' }}>รวมทั้งสิ้น {rows.length} รายการ</td>
                  <td className="num">{fmt.money(totalAmount, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div></div>
        )}

        {/* ส่วนที่ 5: สรุปผลท้ายหน้าจอ */}
        <div className="lot-summary">
          <div className="summary-card">
            <div className="label">จำนวนรายการ</div>
            <div className="value">{fmt.int(rows.length)}</div>
            <div className="sub">รายการคำขอกู้ที่ดึงขึ้นมา</div>
          </div>
          <div className="summary-card accent">
            <div className="label">ยอดรวม</div>
            <div className="value">{fmt.money(totalAmount, 2)}</div>
            <div className="sub">บาท · ยอดเงินกู้ทุกรายการในตาราง</div>
          </div>
        </div>
      </div>

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => setOkMsg(null)} />
      )}
      {report && window.LotReportModal && <window.LotReportModal kind={report} rows={rows} onClose={() => setReport(null)} />}
    </div>
  );
}

Object.assign(window, { LoanPayLotPage });
