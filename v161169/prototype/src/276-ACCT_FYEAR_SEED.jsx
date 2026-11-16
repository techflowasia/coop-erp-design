// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — ปีบัญชี (Fiscal Year)
//  ตารางค่าคงที่ปีบัญชี · กำหนด ปีบัญชี / วันที่เริ่มต้น / วันที่สิ้นสุด /
//  สถานะการปิดปีบัญชี — เพิ่ม / แก้ไข / ลบ ได้ · สลับ ปิดแล้ว-ยังไม่ปิด จากตารางทันที
// ════════════════════════════════════════════════════════════════════

// ─── ค่าตั้งต้น (seed) ───────────────────────────────────────────────
window.ACCT_FYEAR_SEED = window.ACCT_FYEAR_SEED || [
  { id: 'FY-2565', year: '2565', start: '2564-10-01', end: '2565-09-30', closed: true  },
  { id: 'FY-2566', year: '2566', start: '2565-10-01', end: '2566-09-30', closed: true  },
  { id: 'FY-2567', year: '2567', start: '2566-10-01', end: '2567-09-30', closed: true  },
  { id: 'FY-2568', year: '2568', start: '2567-10-01', end: '2568-09-30', closed: false },
  { id: 'FY-2569', year: '2569', start: '2568-10-01', end: '2569-09-30', closed: false },
];

// ─── localStorage ───────────────────────────────────────────────────
function fyLoad() {
  try {
    const saved = localStorage.getItem('acct_fyear_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ACCT_FYEAR_SEED || []).map(c => ({ ...c }));
}
function fySave(list) {
  try { localStorage.setItem('acct_fyear_v1', JSON.stringify(list)); } catch (e) {}
}
let _fySeq = 0;
const fyUid = () => 'FY-' + Date.now().toString(36) + '-' + (++_fySeq);

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function FYearModal({ mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [year, setYear]     = useState(isEdit ? draft0.year : '');
  const [start, setStart]   = useState(isEdit ? (draft0.start || '') : '');
  const [end, setEnd]       = useState(isEdit ? (draft0.end || '') : '');
  const [closed, setClosed] = useState(isEdit ? !!draft0.closed : false);
  const [error, setError]   = useState('');

  const submit = (e) => {
    e.preventDefault();
    const y = String(year).trim();
    if (!y) { setError('กรุณาระบุปีบัญชี'); return; }
    if (!start) { setError('กรุณาระบุวันที่เริ่มต้นปีบัญชี'); return; }
    if (!end) { setError('กรุณาระบุวันที่สิ้นสุดปีบัญชี'); return; }
    if (end < start) { setError('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้นปีบัญชี'); return; }
    const dup = (existing || []).some(x => x.year === y && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`ปีบัญชี “${y}” มีอยู่แล้ว — กรุณาใช้ปีอื่น`); return; }
    onSubmit({ year: y, start, end, closed });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขปีบัญชี' : 'เพิ่มปีบัญชี'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              ปีบัญชีเป็นค่าคงที่ที่ระบบบัญชีใช้อ้างอิงงวดและสถานะการปิดบัญชี
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {/* ปีบัญชี */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">ปีบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={year} placeholder="เช่น 2568" disabled={isEdit}
                     maxLength={4} autoFocus={!isEdit}
                     onChange={(e) => { setYear(e.target.value.replace(/\D/g, '')); setError(''); }} />
              <div className="bud-fld-hint">ปีบัญชี (พ.ศ.)</div>
            </div>

            {/* วันที่เริ่มต้น */}
            <div className="bud-fld">
              <label className="lt-modal-label">วันที่เริ่มต้นปีบัญชี <span className="cfg-required">*</span></label>
              <ErpDate value={start} onChange={(v) => ((e) => { setStart(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
            </div>

            {/* วันที่สิ้นสุด */}
            <div className="bud-fld">
              <label className="lt-modal-label">วันที่สิ้นสุดปีบัญชี <span className="cfg-required">*</span></label>
              <ErpDate value={end} onChange={(v) => ((e) => { setEnd(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
            </div>

            {/* สถานะการปิดปีบัญชี */}
            <div className="bud-fld span2">
              <label className="lt-modal-label">สถานะการปิดปีบัญชี</label>
              <div className="ac-status-pick">
                <button type="button"
                        className={"ac-status-opt" + (!closed ? ' active' : '')}
                        onClick={() => setClosed(false)}>
                  <span className="ac-dot ok" /> ยังไม่ปิดปีบัญชี
                </button>
                <button type="button"
                        className={"ac-status-opt" + (closed ? ' active off' : '')}
                        onClick={() => setClosed(true)}>
                  <span className="ac-dot off" /> ปิดปีบัญชีแล้ว
                </button>
              </div>
              <div className="bud-fld-hint">ใช้แสดงผลว่าปีบัญชีนี้ได้ทำการปิดบัญชีประจำปีแล้วหรือยัง</div>
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกปีบัญชี'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Delete confirm modal
// ════════════════════════════════════════════════════════════════════
function FYearDeleteModal({ rec, onConfirm, onClose }) {
  return (
    <window.DepStatusDialog tone="danger" title="ยืนยันการลบปีบัญชี" desc={<>ต้องการลบปีบัญชี “<span className="mono">{rec.year}</span>” ใช่หรือไม่?</>}
      okLabel="ลบ" onOk={() => onConfirm(rec)} onClose={onClose} />
  );
}


// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
const FY_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

if (!document.getElementById('fy-tbl-style')) {
  const st = document.createElement('style');
  st.id = 'fy-tbl-style';
  st.textContent = '.ac-tbl .bud-acts { opacity: 1 !important; }'
    + '.ac-tbl .bud-act { border: 0 !important; background: transparent !important; color: var(--text-body, rgba(0,0,0,.65)); }'
    + '.ac-tbl .bud-act:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--primary) !important; }'
    + '.ac-tbl .bud-act.danger:hover { border: 1px solid var(--border) !important; background: #fff !important; color: var(--danger) !important; }'
    + '.ac-tbl td, .ac-tbl th { white-space: normal; word-break: break-word; }'
    + '.fy-switch { justify-content: flex-start; width: 120px; }';
  document.head.appendChild(st);
}

const FY_TH_MON = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
// start/end ถูกเก็บเป็น พ.ศ. อยู่แล้ว — จัดรูปแบบตรง ๆ ไม่ต้อง +543 ซ้ำ
const fyDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return iso || '—';
  return `${Number(m[3])} ${FY_TH_MON[Number(m[2]) - 1]} ${m[1]}`;
};

function FYearConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList]   = useState(fyLoad);
  const [modal, setModal] = useState(null);
  const [del, setDel]     = useState(null);

  const persist = (next) => { setList(next); fySave(next); };

  const sorted = React.useMemo(
    () => [...list].sort((a, b) => b.year.localeCompare(a.year)), [list]);

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({
        action: 'update', module: 'บัญชี — ค่าคงที่ปีบัญชี',
        target: `ปีบัญชี ${vals.year}`, summary: `แก้ไขปีบัญชี ${vals.year}`,
      });
      onToast && onToast(`บันทึกการแก้ไขปีบัญชี ${vals.year} เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: fyUid(), ...vals }]);
      audit.log({
        action: 'create', module: 'บัญชี — ค่าคงที่ปีบัญชี',
        target: `ปีบัญชี ${vals.year}`, summary: `เพิ่มปีบัญชี ${vals.year}`,
        changes: [
          { field: 'ปีบัญชี', before: '—', after: vals.year },
          { field: 'ช่วงปีบัญชี', before: '—', after: `${vals.start} ถึง ${vals.end}` },
        ],
      });
      onToast && onToast(`เพิ่มปีบัญชี ${vals.year} เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const toggleClosed = (c) => {
    persist(list.map(x => x.id === c.id ? { ...x, closed: !x.closed } : x));
    audit.log({
      action: 'update', module: 'บัญชี — ค่าคงที่ปีบัญชี',
      target: `ปีบัญชี ${c.year}`,
      summary: `${c.closed ? 'เปิดสถานะปีบัญชี (ยังไม่ปิด)' : 'ปิดปีบัญชี'} ${c.year}`,
      changes: [{ field: 'สถานะการปิดปีบัญชี', before: c.closed ? 'ปิดแล้ว' : 'ยังไม่ปิด', after: c.closed ? 'ยังไม่ปิด' : 'ปิดแล้ว' }],
    });
    onToast && onToast(`${c.closed ? 'เปลี่ยนปีบัญชี ' + c.year + ' เป็นยังไม่ปิด' : 'ปิดปีบัญชี ' + c.year + ' แล้ว'}`);
  };

  const confirmDelete = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ค่าคงที่ปีบัญชี',
      target: `ปีบัญชี ${c.year}`, summary: `ลบปีบัญชี ${c.year}`,
    });
    onToast && onToast(`ลบปีบัญชี ${c.year} เรียบร้อยแล้ว`);
    setDel(null);
  };

  const resetSeed = () => {
    const fresh = (window.ACCT_FYEAR_SEED || []).map(c => ({ ...c }));
    persist(fresh);
    onToast && onToast('คืนค่าปีบัญชีตั้งต้นเรียบร้อยแล้ว');
  };

  const closedCount = list.filter(c => c.closed).length;

  return (
    <div data-screen-label="หน้าค่าคงที่ปีบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปีบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            กำหนดปีบัญชีเป็นค่าคงที่ของระบบบัญชี — ระบุปีบัญชี วันที่เริ่มต้นและสิ้นสุดปีบัญชี
            พร้อมสถานะการปิดปีบัญชี เพื่อให้ระบบแสดงว่าปีบัญชีใดได้ทำการปิดบัญชีประจำปีแล้ว
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่มปีบัญชี
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="bud-toolbar" style={{ padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> คลิกสวิตช์ในคอลัมน์ “สถานะการปิดปีบัญชี” เพื่อสลับ ปิดแล้ว / ยังไม่ปิด ได้ทันที · กดไอคอนเพื่อแก้ไขหรือลบ
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>ปิดปีบัญชีแล้ว {closedCount} / {list.length} ปี</span>
        </div>

        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl ac-tbl" style={{ width: '100%', minWidth: 0, tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 56 }}>ลำดับ</th>
                <th className="center" style={{ width: 80 }}>ปีบัญชี</th>
                <th className="center" style={{ width: 105 }}>วันที่เริ่มต้นปีบัญชี</th>
                <th className="center" style={{ width: 105 }}>วันที่สิ้นสุดปีบัญชี</th>
                <th className="center" style={{ width: 145 }}>สถานะการปิดปีบัญชี</th>
                <th className="center" style={{ width: 90 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={6} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีข้อมูลปีบัญชี — กดปุ่ม “เพิ่มปีบัญชี” เพื่อเริ่มกำหนดค่าคงที่
                </td></tr>
              )}
              {sorted.map((c, i) => (
                <tr key={c.id} className={"ac-row" + (c.closed ? ' is-off' : '')}
                    style={c.closed ? { opacity: .55, background: '#FAFAFA' } : null}>
                  <td className="center mono ac-order-cell">{i + 1}</td>
                  <td className="center mono" style={{ fontWeight: 600 }}>{c.year}</td>
                  <td className="center mono">{fyDate(c.start)}</td>
                  <td className="center mono">{fyDate(c.end)}</td>
                  <td className="center">
                    <button className={"ac-switch fy-switch" + (c.closed ? ' on' : '')}
                            onClick={() => toggleClosed(c)}
                            title={c.closed ? 'คลิกเพื่อเปลี่ยนเป็นยังไม่ปิด' : 'คลิกเพื่อปิดปีบัญชี'}
                            aria-pressed={c.closed}>
                      <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
                      <span className="ac-switch-label">{c.closed ? 'ปิดปีบัญชีแล้ว' : 'ยังไม่ปิด'}</span>
                    </button>
                  </td>
                  <td className="bud-act-cell">
                    <div className="bud-acts" style={{ justifyContent: 'center' }}>
                      <button className="bud-act" title="แก้ไข" onClick={() => setModal({ mode: 'edit', rec: c })}>
                        <Icon name="edit" size={13} />
                      </button>
                      <button className="bud-act danger" title="ลบ" onClick={() => setDel(c)}
                              dangerouslySetInnerHTML={{ __html: FY_TRASH }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ปีบัญชีที่ “ปิดปีบัญชีแล้ว” จะไม่สามารถบันทึกรายการบัญชีย้อนหลังได้ — ใช้แสดงสถานะการปิดบัญชีประจำปีของสหกรณ์
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <FYearModal mode={modal.mode}
                    draft0={modal.mode === 'edit' ? modal.rec : null}
                    existing={list}
                    onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {del && <FYearDeleteModal rec={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </div>
  );
}

window.acctFYearLoad = fyLoad;
Object.assign(window, { FYearConfigPage });
