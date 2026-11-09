// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่รวมทุกระบบ — SystemConstantsHubPage
//  ระบบงานผู้ดูแลระบบ › ค่าคงที่
//  หน้ารวมลิงก์ตั้งค่าคงที่ของทุกระบบงาน + ตั้งค่าเลขที่เอกสารอัตโนมัติ
// ════════════════════════════════════════════════════════════════════

const SCH_DOCNO_DEFAULT = [
  { key: 'loan',    label: 'ใบคำขอกู้เงิน',        prefix: 'LR', digits: 4, reset: 'year', sample: 'LR-2569-0001' },
  { key: 'receipt', label: 'ใบเสร็จรับเงิน',        prefix: 'RC', digits: 5, reset: 'year', sample: 'RC-2569-00001' },
  { key: 'voucher', label: 'ใบสำคัญจ่าย',          prefix: 'PV', digits: 5, reset: 'year', sample: 'PV-2569-00001' },
  { key: 'notice',  label: 'หนังสือแจ้งชำระหนี้',   prefix: 'DN', digits: 4, reset: 'year', sample: 'DN-2569-0001' },
  { key: 'welfare', label: 'คำขอสวัสดิการ',         prefix: 'WS', digits: 4, reset: 'year', sample: 'WS-2569-0001' },
];

function SystemConstantsHubPage({ onToast, onNav }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [docno, setDocno] = useState(() => {
    try { const s = localStorage.getItem('admin_docno'); if (s) return JSON.parse(s); } catch (e) {}
    return SCH_DOCNO_DEFAULT.map(d => ({ ...d }));
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(docno);

  const readyCount = window.ADM_CONST_GROUPS.reduce((a, g) => a + g.items.filter(i => i.ready).length, 0);
  const totalCount = window.ADM_CONST_GROUPS.reduce((a, g) => a + g.items.length, 0);

  const go = (route) => { if (route && onNav) onNav(route); };

  const buildSample = (d) => `${d.prefix}-2569-${'1'.padStart(d.digits, '0')}`;
  const saveDoc = () => {
    setDocno(draft); setEditing(false);
    try { localStorage.setItem('admin_docno', JSON.stringify(draft)); } catch (e) {}
    audit.log({ action: 'update', module: 'ผู้ดูแลระบบ — ค่าคงที่รวมทุกระบบ', target: 'เลขที่เอกสารอัตโนมัติ',
      summary: `แก้ไขรูปแบบเลขที่เอกสารอัตโนมัติ (${draft.length} ประเภท)`,
      changes: draft.filter((d, i) => JSON.stringify(d) !== JSON.stringify(docno[i])).map(d => ({ field: d.label, before: '—', after: buildSample(d) })) });
    onToast && onToast('บันทึกรูปแบบเลขที่เอกสารเรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="หน้าค่าคงที่รวมทุกระบบ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่รวมทุกระบบ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ศูนย์รวมการตั้งค่าคงที่ของทุกระบบงาน — คลิกแต่ละรายการเพื่อไปยังหน้าตั้งค่า
          </div>
        </div>
        <span className="spacer" />
        <span className="chip primary">{readyCount}/{totalCount} หน้าจอพร้อมใช้งาน</span>
      </div>

      {/* การ์ดลิงก์ค่าคงที่รายระบบ */}
      {window.ADM_CONST_GROUPS.map((g, gi) => (
        <div key={gi} className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>{g.sys}</h3></div>
          <div className="const-grid">
            {g.items.map((it, i) => (
              <button key={i} type="button" className={"const-tile" + (it.ready ? '' : ' disabled')}
                      onClick={() => it.ready && go(it.route)} disabled={!it.ready}>
                <span className="const-ico"><Icon name="cog" size={16} /></span>
                <span className="const-main">
                  <span className="const-label">{it.label}</span>
                  <span className="const-desc">{it.desc}</span>
                </span>
                {it.ready ? <span className="const-go"><Icon name="chevRight" size={14} /></span>
                          : <span className="chip" style={{ height: 18, fontSize: 9 }}>ยังไม่มีหน้าจอ</span>}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* ตั้งค่าเลขที่เอกสารอัตโนมัติ */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">เลขที่เอกสารอัตโนมัติ <span className="muted" style={{ fontWeight: 400 }}>· {docno.length} ประเภท</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>กำหนดคำนำหน้า จำนวนหลัก และรอบรีเซ็ตเลขที่ของเอกสารแต่ละประเภท</div>
          </div>
          {!editing ? (
            <button className="btn ghost sm" onClick={() => { setDraft(docno.map(d => ({ ...d }))); setEditing(true); }}><Icon name="edit" size={12} /> แก้ไข</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn sm" onClick={() => setEditing(false)}>ยกเลิก</button>
              <button className="btn primary sm" onClick={saveDoc}><Icon name="check" /> บันทึก</button>
            </div>
          )}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr><th>ประเภทเอกสาร</th><th className="center" style={{ width: 120 }}>คำนำหน้า</th><th className="center" style={{ width: 110 }}>จำนวนหลัก</th><th className="center" style={{ width: 150 }}>รีเซ็ตเลข</th><th style={{ width: 180 }}>ตัวอย่าง</th></tr></thead>
            <tbody>
              {(editing ? draft : docno).map((d, i) => (
                <tr key={d.key}>
                  <td style={{ fontWeight: 500 }}>{d.label}</td>
                  <td className="center">
                    {editing ? <input className="sh-grid-input mono" style={{ textAlign: 'center', width: 80 }} value={d.prefix}
                                      onChange={(e) => setDraft(p => p.map((x, j) => j === i ? { ...x, prefix: e.target.value.toUpperCase().slice(0, 4) } : x))} />
                             : <span className="mono">{d.prefix}</span>}
                  </td>
                  <td className="center">
                    {editing ? <input className="sh-grid-input mono" type="number" min="2" max="8" style={{ textAlign: 'center', width: 70 }} value={d.digits}
                                      onChange={(e) => setDraft(p => p.map((x, j) => j === i ? { ...x, digits: Number(e.target.value) || 4 } : x))} />
                             : <span className="mono">{d.digits} หลัก</span>}
                  </td>
                  <td className="center">
                    {editing ? <select className="l2-select" style={{ height: 28 }} value={d.reset}
                                      onChange={(e) => setDraft(p => p.map((x, j) => j === i ? { ...x, reset: e.target.value } : x))}>
                                 <option value="year">รายปี</option><option value="month">รายเดือน</option><option value="never">ไม่รีเซ็ต</option>
                               </select>
                             : <span>{d.reset === 'year' ? 'รายปี' : d.reset === 'month' ? 'รายเดือน' : 'ไม่รีเซ็ต'}</span>}
                  </td>
                  <td><span className="mono" style={{ color: 'var(--primary)' }}>{buildSample(editing ? draft[i] : d)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> รูปแบบเลข = คำนำหน้า + ปี พ.ศ. + เลขลำดับ (เติมศูนย์หน้าตามจำนวนหลัก) — ใช้ร่วมกันทุกระบบที่ออกเอกสารประเภทนั้น
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SystemConstantsHubPage });
