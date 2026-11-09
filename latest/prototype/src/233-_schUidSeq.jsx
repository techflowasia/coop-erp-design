// ════════════════════════════════════════════════════════════════════
//  กำหนดจำนวนทุนการศึกษา — ScholarshipQuotaPage
//  ระบบงานสวัสดิการสมาชิก › ค่าคงที่
//  ส่วนเงื่อนไข (ปี / ประเภททุน) + ตารางกำหนดรายละเอียดทุนแต่ละระดับชั้น
// ════════════════════════════════════════════════════════════════════

let _schUidSeq = 0;
const schUid = () => 'SCH-N' + String(++_schUidSeq).padStart(3, '0');
const SCH_USER = 'จันทร์เพ็ญ มาลี';

function schLoad() {
  try {
    const saved = localStorage.getItem('scholarship_quota');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.SCH_SEED.map(r => ({ ...r }));
}
function schSaveLS(list) {
  try { localStorage.setItem('scholarship_quota', JSON.stringify(list)); } catch (e) {}
}

// ── dropdown เซลล์ในตาราง ─────────────────────────────────────────────
function SchSelectCell({ group, value, onChange, width, options }) {
  const opts = options || window.SCH_OPTS[group];
  return (
    <select className="l2-select" style={{ height: 28, minWidth: width || 150, width: '100%' }}
            value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function ScholarshipQuotaPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(schLoad);
  const [year, setYear] = useState('2569');           // ประจำปี (พ.ศ.)
  const [filterType, setFilterType] = useState('all'); // ประเภททุน (คัดกรอง + ค่าตั้งต้นแถวใหม่)
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [docCodes, setDocCodes] = useState(window.schDocCodeLoad);   // รหัสเลขเอกสารต่อประเภททุน

  const persist = (next) => { setList(next); schSaveLS(next); };
  const setDocCode = (type, v) => {
    setDirty(true);
    setDocCodes(m => ({ ...m, [type]: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) }));
  };

  // แถวที่แสดงในตาราง: ตรงปี + (ตรงประเภททุน หรือ ทั้งหมด)
  const rows = list.filter(r =>
    String(r.year) === String(year) &&
    (filterType === 'all' || r.scholarType === filterType));

  const totalQuota  = rows.reduce((s, r) => s + (Number(r.quota) || 0), 0);
  const totalBudget = rows.reduce((s, r) => s + (Number(r.quota) || 0) * (Number(r.amountEach) || 0), 0);

  const setRow = (id, k, v) => {
    setDirty(true);
    setList(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r));
  };

  // เกณฑ์ผลการเรียน — กรอกช่องใด อีกช่องคำนวณตามอัตโนมัติ (เกรดเต็ม 4 ↔ ร้อยละ)
  const setCriterion = (id, kind, v) => {
    setDirty(true);
    setList(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (kind === 'gpa') return { ...r, minGpa: v, minPercent: window.schGradeToPct(v) };
      return { ...r, minPercent: v, minGpa: window.schPctToGrade(v) };
    }));
  };

  const addRow = () => {
    setDirty(true);
    const seedType = filterType === 'all' ? '1' : filterType;
    // เริ่มลำดับล่าสุด ต่อจากค่าสูงสุดที่มีในปี+ประเภทนี้
    const sameGroup = list.filter(r => String(r.year) === String(year) && r.scholarType === seedType);
    const nextSeq = sameGroup.reduce((mx, r) => Math.max(mx, Number(r.lastSeq) || 0), 0);
    const newRow = {
      id: schUid(), year: Number(year) || 2569, scholarType: seedType,
      eduLevel: '1', quota: 0, amountEach: 0, minGpa: 0, minPercent: 0, lastSeq: nextSeq,
    };
    setList(prev => [...prev, newRow]);
  };

  const delRow = (id) => {
    setDirty(true);
    setList(prev => prev.filter(r => r.id !== id));
  };

  const save = () => {
    schSaveLS(list);
    window.schDocCodeSave(docCodes);
    setDirty(false);
    setSavedAt(new Date());
    audit.log({
      action: 'update', module: 'สวัสดิการ — กำหนดจำนวนทุนการศึกษา',
      target: `ประจำปี ${year}${filterType === 'all' ? '' : ' · ' + window.schLabel('scholarType', filterType)}`,
      summary: `บันทึกจำนวนทุนการศึกษา ประจำปี ${year} (${rows.length} ระดับชั้น · ${totalQuota} ทุน)`,
      changes: [
        { field: 'จำนวนระดับชั้น', before: '—', after: String(rows.length) },
        { field: 'จำนวนทุนรวม',  before: '—', after: `${totalQuota} ทุน` },
        { field: 'งบประมาณรวม',  before: '—', after: `${fmt.money(totalBudget, 2)} บาท` },
      ],
    });
    onToast && onToast(`บันทึกจำนวนทุนการศึกษา ประจำปี ${year} เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="หน้ากำหนดจำนวนทุนการศึกษา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดจำนวนทุนการศึกษา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดจำนวนผู้รับทุนและจำนวนเงินต่อทุน แยกตามปีการศึกษา ประเภททุน และระดับชั้น
          </div>
        </div>
        <span className="spacer" />
        {savedAt && !dirty && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        <button className="btn primary sm" onClick={save} disabled={!dirty}>
          <Icon name="check" /> บันทึกข้อมูล
        </button>
      </div>

      {/* ── ส่วนกำหนดเงื่อนไขและสร้างแบบฟอร์ม ───────────────────────── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">กำหนดเงื่อนไขและสร้างแบบฟอร์ม</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              ระบุปีการศึกษาและประเภททุน เพื่อคัดกรองและสร้างตารางข้อมูลทุนตั้งต้น
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', padding: '14px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="lt-modal-label">ประจำปี (พ.ศ.) <span className="cfg-required">*</span></label>
            <input className="cfg-input mono" type="number" inputMode="numeric" value={year}
                   style={{ width: 140, textAlign: 'center' }} placeholder="เช่น 2569"
                   onChange={(e) => setYear(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="lt-modal-label">ประเภททุน</label>
            <select className="filter-select" style={{ width: 280, height: 32 }}
                    value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">— ทุกประเภททุน —</option>
              {window.SCH_OPTS.scholarType.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── กำหนดรหัสเลขเอกสารคำขอ แยกตามประเภททุน ─────────────────── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">กำหนดรหัสเลขเอกสารคำขอทุนการศึกษา</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              กำหนดรหัสนำหน้าเลขใบคำขอของแต่ละประเภททุน — ระบบสร้างเลขใบคำขอเป็น <span className="mono">รหัส-ปีการศึกษา-ลำดับ</span> โดยไล่ลำดับแยกตามรหัสและปี
            </div>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl sh-grid" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 320 }}>ประเภททุนการศึกษา</th>
                <th className="center" style={{ width: 160 }}>รหัสเลขเอกสาร</th>
                <th>ตัวอย่างเลขใบคำขอ</th>
              </tr>
            </thead>
            <tbody>
              {window.SCH_OPTS.scholarType.map(o => {
                const code = (docCodes[o.v] || 'WS').toUpperCase();
                return (
                  <tr key={o.v}>
                    <td>{o.l}</td>
                    <td className="num-cell">
                      <input className="sh-grid-input mono" style={{ textAlign: 'center', textTransform: 'uppercase' }}
                             value={docCodes[o.v] || ''} maxLength={6} placeholder="WS"
                             onChange={(e) => setDocCode(o.v, e.target.value)} />
                    </td>
                    <td className="mono muted">{code}-{year || '2569'}-0001</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> รหัสใช้ตัวอักษร A–Z และตัวเลข ไม่เกิน 6 ตัว · เลขใบคำขอที่สร้างแล้วจะไม่เปลี่ยนย้อนหลัง — อย่าลืมกด “บันทึกข้อมูล”
        </div>
      </div>

      {/* ── แบนเนอร์สรุป ────────────────────────────────────────────── */}
      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="shield" /></div>
        <div>
          <div className="lt-ab-label">สรุปทุนการศึกษา ประจำปี {year}{filterType === 'all' ? '' : ' · ' + window.schLabel('scholarType', filterType)}</div>
          <div className="lt-ab-name">{totalQuota} ทุน · {rows.length} ระดับชั้น
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · งบประมาณรวม {fmt.money(totalBudget, 2)} บาท</span>
          </div>
        </div>
      </div>

      {/* ── ส่วนตารางกำหนดรายละเอียดทุน ─────────────────────────────── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">ตารางกำหนดรายละเอียดทุน <span className="muted" style={{ fontWeight: 400 }}>· {rows.length} ระดับชั้น</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              ระบุจำนวนผู้รับทุนและจำนวนเงินต่อทุนของแต่ละระดับชั้น — เพิ่มหรือลบแถวได้ตามต้องการ
            </div>
          </div>
          <button className="btn primary sm" onClick={addRow}><Icon name="plus" /> เพิ่ม</button>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl sh-grid" style={{ minWidth: 1140 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 90 }}>ประจำปี</th>
                <th style={{ width: 220 }}>ประเภททุน</th>
                <th style={{ width: 200 }}>ระดับชั้น</th>
                <th className="center" style={{ width: 100 }}>จำนวนทุน</th>
                <th className="center" style={{ width: 130 }}>ทุนละ (บาท)</th>
                <th className="center sh-crit-col" style={{ width: 116 }}>เกรดขั้นต่ำ<div className="sh-th-sub">(เต็ม 4)</div></th>
                <th className="center sh-crit-col" style={{ width: 116 }}>ร้อยละขั้นต่ำ<div className="sh-th-sub">(%)</div></th>
                <th className="center" style={{ width: 100 }}>ลำดับล่าสุด</th>
                <th className="center" style={{ width: 70 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="center muted" style={{ padding: '26px 12px' }}>
                  ยังไม่มีรายการทุนสำหรับเงื่อนไขนี้ — กดปุ่ม “เพิ่ม” ที่มุมขวาบนเพื่อสร้างแถวใหม่
                </td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="center mono">{r.year}</td>
                  <td>
                    <SchSelectCell group="scholarType" value={r.scholarType} width={200}
                                   onChange={(v) => setRow(r.id, 'scholarType', v)} />
                  </td>
                  <td>
                    <SchSelectCell group="eduLevel" value={r.eduLevel} width={180}
                                   options={window.SCH_EDU_LEVEL_CONFIG}
                                   onChange={(v) => setRow(r.id, 'eduLevel', v)} />
                  </td>
                  <td className="num-cell">
                    <input className="sh-grid-input" type="number" inputMode="numeric" min="0" value={r.quota}
                           onChange={(e) => setRow(r.id, 'quota', e.target.value)} />
                  </td>
                  <td className="num-cell">
                    <input className="sh-grid-input" type="number" inputMode="decimal" step="0.01" min="0" value={r.amountEach}
                           onChange={(e) => setRow(r.id, 'amountEach', e.target.value)} />
                  </td>
                  <td className="num-cell sh-crit-col">
                    <input className="sh-grid-input sh-crit-gpa" type="number" inputMode="decimal" step="0.01" min="0" max="4"
                           value={r.minGpa} placeholder="0.00"
                           onChange={(e) => setCriterion(r.id, 'gpa', e.target.value)} />
                  </td>
                  <td className="num-cell sh-crit-col">
                    <input className="sh-grid-input sh-crit-pct" type="number" inputMode="decimal" step="0.01" min="0" max="100"
                           value={r.minPercent} placeholder="0.00"
                           onChange={(e) => setCriterion(r.id, 'pct', e.target.value)} />
                  </td>
                  <td className="num-cell">
                    <input className="sh-grid-input" type="number" inputMode="numeric" min="0" value={r.lastSeq}
                           onChange={(e) => setRow(r.id, 'lastSeq', e.target.value)} />
                  </td>
                  <td className="center">
                    <button className="btn danger sm" onClick={() => delRow(r.id)} title="ลบรายการ">
                      <Icon name="close" size={13} /> ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="sh-grid-total">
                  <td colSpan={3} className="right"><b>รวมทั้งหมด</b></td>
                  <td className="num-cell"><span className="sh-grid-num"><b>{fmt.money(totalQuota, 0)}</b></span></td>
                  <td className="num-cell"><span className="sh-grid-num muted" style={{ fontSize: 11 }}>งบประมาณ</span></td>
                  <td className="num-cell" colSpan={4}><span className="sh-grid-num"><b>{fmt.money(totalBudget, 2)}</b></span></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> งบประมาณรวม = จำนวนทุน × ทุนละ ของทุกระดับชั้น · เกณฑ์ผลการเรียน — กรอกเกรดขั้นต่ำหรือร้อยละขั้นต่ำช่องใดช่องหนึ่ง อีกช่องจะคำนวณให้อัตโนมัติ — อย่าลืมกด “บันทึกข้อมูล” เพื่อจัดเก็บการเปลี่ยนแปลง
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScholarshipQuotaPage });
