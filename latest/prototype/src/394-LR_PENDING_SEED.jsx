// ════════════════════════════════════════════════════════════════════
//  ใบคำขอกู้เงิน › Popup "Open" — รายการคำขอกู้รอจ่ายเงิน
//  เลือกรายการเพื่อดึงข้อมูลกลับไปแก้ไขในฟอร์มหลัก
// ════════════════════════════════════════════════════════════════════
window.LR_PENDING_SEED = window.LR_PENDING_SEED || [
  { reqNo: '04812', productId: 'LP-61', typeCode: '61', typeName: 'สอ-สามัญเพื่อแก้ไขปัญหาเศรษฐกิจ',
    reqDate: '2026-07-28', amount: 350000, agentDeduct: 12480.75, by: 'จันทร์เพ็ญ มาลี' },
  { reqNo: '04815', productId: 'LP-20', typeCode: '20', typeName: 'สามัญปกติ',
    reqDate: '2026-08-03', amount: 780000, agentDeduct: 0, by: 'จันทร์เพ็ญ มาลี' },
  { reqNo: '04818', productId: 'LP-10', typeCode: '10', typeName: 'ฉุกเฉินเงินสด',
    reqDate: '2026-08-10', amount: 50000, agentDeduct: 2350, by: 'ธนพล ศรีสุข' },
  { reqNo: '04820', productId: 'LP-30', typeCode: '30', typeName: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย',
    reqDate: '2026-08-12', amount: 1850000, agentDeduct: 45900.5, by: 'ธนพล ศรีสุข' },
];

function PendingLoanReqModal({ currentTypeCode, rows, onPick, onClose }) {
  const list = rows && rows.length ? rows : (window.LR_PENDING_SEED || []);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dmy = (v) => {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d)) return v;
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true"
           style={{ width: 940, maxWidth: '96vw', maxHeight: '84vh', marginTop: 28, display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <h2 style={{ margin: 0 }}>กำลังป้อนคำขอกู้ประเภท : {currentTypeCode || '-'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          <div className="mp-note" style={{ marginBottom: 12 }}>
            <div className="mp-note-title">รายการคำขอกู้รอจ่ายเงิน</div>
            เลือกรายการที่ต้องการ เพื่อแก้ไขข้อมูลที่ป้อนไว้
          </div>

          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>เลขที่ใบคำขอ</th>
                  <th style={{ minWidth: 260 }}>ประเภท</th>
                  <th style={{ width: 118 }}>วันที่ขอกู้</th>
                  <th className="right" style={{ width: 130 }}>ยอดขอกู้</th>
                  <th className="right" style={{ width: 122 }}>หักตัวแทน</th>
                  <th style={{ width: 150 }}>ผู้ทำรายการ</th>
                  <th className="center" style={{ width: 64 }} />
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr><td colSpan="7" className="center muted" style={{ padding: 18 }}>- ไม่มีคำขอกู้รอจ่ายเงิน -</td></tr>
                )}
                {list.map((r) => (
                  <tr key={r.reqNo} className="clickable" onClick={() => onPick(r)}>
                    <td className="mono">{r.reqNo}</td>
                    <td>{r.typeCode}-{r.typeName}</td>
                    <td className="mono">{dmy(r.reqDate)}</td>
                    <td className="num">{fmt.money(r.amount, 2)}</td>
                    <td className="num">{fmt.money(r.agentDeduct || 0, 2)}</td>
                    <td>{r.by || '-'}</td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn ghost sm" title="ดึงรายการนี้กลับไปแก้ไขในฟอร์ม"
                              onClick={() => onPick(r)}
                              style={{ position: 'relative', paddingRight: 14 }}>
                        <Icon name="edit" size={13} />
                        <span style={{ position: 'absolute', right: 3, top: 2, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>+</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { PendingLoanReqModal });
