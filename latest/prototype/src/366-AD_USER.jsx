// ═════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ค่าคงที่ — ข้อกำหนดรายละเอียดสังกัด
//  ตารางค่าคงที่หน่วยงาน/สังกัด : รหัสหน่วยงาน · ชื่อหน่วยงาน · รหัสเขต ·
//  ลูกหนี้ตัวแทน · ภูมิภาคสังกัด · แผ่นจัดเก็บ · รหัสที่อยู่ · การจ่ายปันผล
//  · เพิ่ม/แก้ไข/ดู ผ่าน drawer ขวา · เลือกเขตใช้งาน/ไม่ใช้งาน (เดี่ยว+ชุด)
//  · ตัวกรอง + การ์ดสรุป + ตาราง + แบ่งหน้า
//  โครงสร้าง/สไตล์อิงเมนู "สังกัดปันผลเฉลี่ยคืน" (ใช้คลาส da-* ร่วมกัน)
// ═════════════════════════════════════════════════════════════════

const AD_USER = 'ธารา ว.';

// ─── ป้ายการจ่ายปันผล ────────────────────────────────────────────────
function AdDivChip({ v }) {
  const t = window.adDividend(v);
  return <span className={'chip ' + t.chip}>{t.l}</span>;
}

// ════════════════════════════════════════════════════════════════════
//  Drawer — เพิ่ม / แก้ไข / ดูรายละเอียด สังกัด
// ════════════════════════════════════════════════════════════════════
function AdDrawer({ mode, record, existing, onClose, onSubmit }) {
  const view = mode === 'view';
  const isEdit = mode === 'edit';
  const [code, setCode]     = useState(record ? record.code : '');
  const [name, setName]     = useState(record ? record.name : '');
  const [zone, setZone]     = useState(record ? record.zone : '');
  const [agent, setAgent]   = useState(record ? (record.agent || '') : '');
  const [region, setRegion] = useState(record ? (record.region || '') : '');
  const [disk, setDisk]     = useState(record ? (record.disk || '') : '');
  const [addr, setAddr]     = useState(record ? (record.addr || '') : '');
  const [div, setDiv]       = useState(record ? (record.div || '') : '');
  const [on, setOn]         = useState(record ? !!record.on : true);
  const [note, setNote]     = useState(record ? (record.note || '') : '');
  const [error, setError]   = useState('');

  const validate = () => {
    const c = code.trim();
    if (!c) return 'กรุณาระบุรหัสหน่วยงาน';
    if (c.length < 3) return 'รหัสหน่วยงานต้องมีอย่างน้อย 3 หลัก';
    const dup = (existing || []).some(x => x.code === c && (!isEdit || x.id !== record.id));
    if (dup) return `รหัสหน่วยงาน “${c}” มีอยู่แล้วในระบบ — ห้ามซ้ำ`;
    if (!name.trim()) return 'กรุณาระบุชื่อหน่วยงาน';
    if (!zone.trim()) return 'กรุณาระบุรหัสเขต';
    if (!region) return 'กรุณาเลือกภูมิภาคสังกัด';
    if (!div) return 'กรุณาเลือกการจ่ายปันผล';
    return '';
  };

  const handle = (again) => {
    const err = validate();
    if (err) { setError(err); return; }
    onSubmit({
      vals: {
        code: code.trim(), name: name.trim(), zone: zone.trim(), agent: agent.trim(),
        region, disk: disk.trim(), addr: addr.trim(), div, on, note: note.trim(),
      },
      again,
    });
    if (again) {
      setCode(''); setName(''); setZone(''); setAgent(''); setRegion('');
      setDisk(''); setAddr(''); setDiv(''); setOn(true); setNote(''); setError('');
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer da-drawer">
        <div className="drawer-head">
          <div className="da-drawer-ico">
            <Icon name={view ? 'eye' : isEdit ? 'edit' : 'plus'} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2>{view ? 'รายละเอียดสังกัด' : isEdit ? 'แก้ไขข้อมูลสังกัด' : 'เพิ่มสังกัด'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {view ? 'ดูข้อกำหนดรายละเอียดสังกัด/หน่วยงาน' : 'ค่าคงที่หน่วยงานสำหรับประมวลผลเรียกเก็บและจัดเก็บข้อมูล'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="drawer-body da-form">
          {/* รหัสหน่วยงาน */}
          <div className="da-field">
            <label className="da-label">รหัสหน่วยงาน <span className="cfg-required">*</span></label>
            <input className="cfg-input mono" value={code} maxLength={6} readOnly={view || isEdit}
                   placeholder="ระบุรหัสหน่วยงาน เช่น 02010"
                   onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} />
            {isEdit && <div className="da-hint"><Icon name="info" size={11} /> รหัสหน่วยงานเป็นรหัสอ้างอิงหลัก แก้ไขไม่ได้หลังสร้าง</div>}
          </div>

          {/* ชื่อหน่วยงาน */}
          <div className="da-field">
            <label className="da-label">ชื่อหน่วยงาน <span className="cfg-required">*</span></label>
            <input className="cfg-input" value={name} maxLength={120} readOnly={view}
                   placeholder="ระบุชื่อหน่วยงาน เช่น สำนักงานเขตพระนคร"
                   onChange={(e) => { setName(e.target.value); setError(''); }} />
          </div>

          {/* รหัสเขต + ภูมิภาคสังกัด */}
          <div className="da-field-row">
            <div className="da-field">
              <label className="da-label">รหัสเขต <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={zone} maxLength={4} readOnly={view}
                     placeholder="เช่น 02"
                     onChange={(e) => { setZone(e.target.value.replace(/\D/g, '')); setError(''); }} />
            </div>
            <div className="da-field">
              <label className="da-label">ภูมิภาคสังกัด <span className="cfg-required">*</span></label>
              {view ? (
                <div style={{ paddingTop: 6 }}>{region ? window.adRegion(region).l : <span className="muted">—</span>}</div>
              ) : (
                <select className="filter-select" style={{ width: '100%' }} value={region}
                        onChange={(e) => { setRegion(e.target.value); setError(''); }}>
                  <option value="">เลือกภูมิภาคสังกัด</option>
                  {window.AD_REGIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* ลูกหนี้ตัวแทน */}
          <div className="da-field">
            <label className="da-label">ลูกหนี้ตัวแทน</label>
            <input className="cfg-input" value={agent} maxLength={80} readOnly={view}
                   placeholder="ระบุรหัส/ชื่อตัวแทนเรียกเก็บ เช่น ต.010 เขตพระนคร"
                   onChange={(e) => setAgent(e.target.value)} />
          </div>

          {/* แผ่นจัดเก็บ + รหัสที่อยู่ */}
          <div className="da-field-row">
            <div className="da-field">
              <label className="da-label">แผ่นจัดเก็บ</label>
              <input className="cfg-input mono" value={disk} maxLength={12} readOnly={view}
                     placeholder="เช่น D-02"
                     onChange={(e) => setDisk(e.target.value)} />
            </div>
            <div className="da-field">
              <label className="da-label">รหัสที่อยู่</label>
              <input className="cfg-input mono" value={addr} maxLength={10} readOnly={view}
                     placeholder="เช่น 10200"
                     onChange={(e) => setAddr(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>

          {/* การจ่ายปันผล */}
          <div className="da-field">
            <label className="da-label">การจ่ายปันผล <span className="cfg-required">*</span></label>
            {view ? (
              <div style={{ paddingTop: 2 }}>{div ? <AdDivChip v={div} /> : <span className="muted">—</span>}</div>
            ) : (
              <select className="filter-select" style={{ width: '100%' }} value={div}
                      onChange={(e) => { setDiv(e.target.value); setError(''); }}>
                <option value="">เลือกการจ่ายปันผล</option>
                {window.AD_DIVIDEND.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            )}
          </div>

          {/* สถานะเขต */}
          <div className="da-field">
            <label className="da-label">สถานะเขต <span className="cfg-required">*</span></label>
            {view ? (
              <div style={{ paddingTop: 2 }}>
                {on ? <span className="pill ok">ใช้งาน</span> : <span className="pill neutral">ไม่ใช้งาน</span>}
              </div>
            ) : (
              <div className="da-status-pick">
                <button type="button" className={'da-status-opt' + (on ? ' active' : '')} onClick={() => setOn(true)}>
                  <span className="da-dot ok" /> ใช้งาน
                </button>
                <button type="button" className={'da-status-opt' + (!on ? ' active off' : '')} onClick={() => setOn(false)}>
                  <span className="da-dot off" /> ไม่ใช้งาน
                </button>
              </div>
            )}
          </div>

          {/* หมายเหตุ */}
          <div className="da-field">
            <label className="da-label">หมายเหตุ</label>
            <textarea className="cfg-input" rows={2} value={note} maxLength={255} readOnly={view}
                      placeholder="ระบุหมายเหตุ (ถ้ามี)"
                      onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && <div className="dep-error" style={{ marginTop: 4 }}><Icon name="info" size={13} /> {error}</div>}
        </div>

        {!view && (
          <div className="da-drawer-foot">
            <button className="btn primary block" onClick={() => handle(false)}>
              <Icon name="download" size={14} /> บันทึก
            </button>
            {!isEdit && (
              <button className="btn block" onClick={() => handle(true)}>
                <Icon name="plus" size={14} /> บันทึกและเพิ่มต่อ
              </button>
            )}
            <button className="btn text block" onClick={onClose}>ยกเลิก</button>
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function AffilDetailConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.adLoad);
  const blank = { code: '', name: '', zone: '', region: 'all', div: 'all', status: 'all' };
  const [crit, setCrit] = useState(blank);
  const [applied, setApplied] = useState(blank);
  const [drawer, setDrawer] = useState(null);   // {mode, record}
  const [sel, setSel] = useState({});           // {id: true}
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const persist = (next) => { setList(next); window.adSave(next); };

  const MODULE = 'ประมวลผลและจัดเก็บ — ข้อกำหนดรายละเอียดสังกัด';

  // สรุปยอด
  const total = list.length;
  const onCnt = list.filter(r => r.on).length;
  const offCnt = total - onCnt;

  // กรอง + เรียงตามรหัส
  const filtered = useMemo(
    () => window.adFilter(list, applied).sort((a, b) => a.code.localeCompare(b.code)),
    [list, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  const runSearch = () => { setApplied(crit); setPage(1); };
  const clearSearch = () => { setCrit(blank); setApplied(blank); setPage(1); };
  const setC = (k, v) => setCrit(p => ({ ...p, [k]: v }));

  // ── CRUD ──
  const submit = ({ vals, again }) => {
    const m = drawer.mode;
    if (m === 'edit') {
      const rec = drawer.record;
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log && audit.log({
        action: 'update', module: MODULE,
        target: `${vals.code} · ${vals.name}`, summary: `แก้ไขสังกัด “${vals.name}”`,
      });
      onToast && onToast(`บันทึกการแก้ไขสังกัด “${vals.name}” เรียบร้อยแล้ว`);
      setDrawer(null);
    } else {
      const rec = { id: window.adUid(), ...vals, inUse: false };
      persist([...list, rec]);
      audit.log && audit.log({
        action: 'create', module: MODULE,
        target: `${vals.code} · ${vals.name}`, summary: `เพิ่มสังกัด “${vals.name}”`,
        changes: [
          { field: 'รหัสหน่วยงาน', before: '—', after: vals.code },
          { field: 'รหัสเขต', before: '—', after: vals.zone },
          { field: 'การจ่ายปันผล', before: '—', after: window.adDividend(vals.div).l },
        ],
      });
      onToast && onToast(`เพิ่มสังกัด “${vals.name}” (${vals.code}) เรียบร้อยแล้ว`);
      if (!again) setDrawer(null);
    }
  };

  const toggleEnabled = (r) => {
    persist(list.map(x => x.id === r.id ? { ...x, on: !x.on } : x));
    audit.log && audit.log({
      action: 'update', module: MODULE,
      target: `${r.code} · ${r.name}`,
      summary: `${r.on ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}เขตของสังกัด “${r.name}”`,
    });
    onToast && onToast(`${r.on ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}เขต “${r.name}” แล้ว`);
  };

  // ── เลือกหลายรายการ ──
  const selIds = Object.keys(sel).filter(k => sel[k]);
  const allOnPage = pageRows.length > 0 && pageRows.every(r => sel[r.id]);
  const toggleAll = () => {
    setSel(s => {
      const n = { ...s };
      if (allOnPage) pageRows.forEach(r => { delete n[r.id]; });
      else pageRows.forEach(r => { n[r.id] = true; });
      return n;
    });
  };
  const bulkSetEnabled = (val) => {
    persist(list.map(x => selIds.includes(x.id) ? { ...x, on: val } : x));
    onToast && onToast(`${val ? 'เปิด' : 'ปิด'}ใช้งานเขต ${selIds.length} รายการแล้ว`);
    setSel({});
  };

  const hasFilter = applied.code || applied.name || applied.zone ||
    applied.region !== 'all' || applied.div !== 'all' || applied.status !== 'all';
  const startN = filtered.length === 0 ? 0 : (curPage - 1) * pageSize + 1;
  const endN = Math.min(curPage * pageSize, filtered.length);

  const pageNums = useMemo(() => {
    const out = [];
    const span = 2;
    for (let p = 1; p <= pageCount; p++) {
      if (p === 1 || p === pageCount || (p >= curPage - span && p <= curPage + span)) out.push(p);
      else if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }, [pageCount, curPage]);

  return (
    <div data-screen-label="หน้าข้อกำหนดรายละเอียดสังกัด">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            ข้อกำหนดรายละเอียดสังกัด
            <span className="da-help" title="ค่าคงที่หน่วยงาน/สังกัดที่ระบบประมวลผลใช้ในการเรียกเก็บและจัดเก็บข้อมูล"><Icon name="info" size={14} /></span>
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            กำหนดหน่วยงาน/สังกัดสำหรับการประมวลผล — รหัสหน่วยงาน ชื่อหน่วยงาน รหัสเขต ลูกหนี้ตัวแทน ภูมิภาค แผ่นจัดเก็บ รหัสที่อยู่ และการจ่ายปันผล · เลือกได้ว่าเขตใดใช้งานอยู่หรือไม่ใช้งานแล้ว
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('นำเข้าข้อมูลสังกัด (สาธิต)')}><Icon name="upload" size={13} /> นำเข้า</button>
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกข้อมูลสังกัด (สาธิต)')}><Icon name="download" size={13} /> ส่งออก</button>
        <button className="btn primary sm" onClick={() => setDrawer({ mode: 'add', record: null })}>
          <Icon name="plus" size={13} /> เพิ่มสังกัด
        </button>
      </div>

      {/* ── ตัวกรอง ── */}
      <div className="search-card da-filter">
        <div className="da-filter-grid">
          <div className="da-ff">
            <label>รหัสหน่วยงาน</label>
            <input className="cfg-input mono" value={crit.code} placeholder="ระบุรหัสหน่วยงาน"
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   onChange={(e) => setC('code', e.target.value.replace(/\D/g, ''))} maxLength={6} />
          </div>
          <div className="da-ff">
            <label>ชื่อหน่วยงาน</label>
            <input className="cfg-input" value={crit.name} placeholder="ระบุชื่อหน่วยงาน"
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   onChange={(e) => setC('name', e.target.value)} />
          </div>
          <div className="da-ff">
            <label>รหัสเขต</label>
            <input className="cfg-input mono" value={crit.zone} placeholder="ระบุรหัสเขต"
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   onChange={(e) => setC('zone', e.target.value.replace(/\D/g, ''))} maxLength={4} />
          </div>
          <div className="da-ff">
            <label>ภูมิภาคสังกัด</label>
            <select className="filter-select" value={crit.region} onChange={(e) => setC('region', e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {window.AD_REGIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="da-ff">
            <label>การจ่ายปันผล</label>
            <select className="filter-select" value={crit.div} onChange={(e) => setC('div', e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {window.AD_DIVIDEND.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="da-ff">
            <label>สถานะเขต</label>
            <select className="filter-select" value={crit.status} onChange={(e) => setC('status', e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="on">ใช้งาน</option>
              <option value="off">ไม่ใช้งาน</option>
            </select>
          </div>
          <div className="da-ff-actions">
            <button className="btn primary" onClick={runSearch}><Icon name="search" size={13} /> ค้นหา</button>
            <button className="btn" onClick={clearSearch}><Icon name="refresh" size={13} /> ล้างค่า</button>
          </div>
        </div>
      </div>

      {/* ── ตาราง ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        {selIds.length > 0 && (
          <div className="da-bulkbar">
            <span><b>{selIds.length}</b> รายการที่เลือก</span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn sm" onClick={() => bulkSetEnabled(true)}><Icon name="check" size={12} /> เปิดใช้งานเขต</button>
            <button className="btn sm" onClick={() => bulkSetEnabled(false)}><Icon name="lock" size={12} /> ปิดใช้งานเขต</button>
            <button className="btn text sm" onClick={() => setSel({})}>ยกเลิกการเลือก</button>
          </div>
        )}
        <div className="table-wrap" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
          <table className="tbl da-tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>
                  <input type="checkbox" className="ct-check" checked={allOnPage} onChange={toggleAll}
                         aria-label="เลือกทั้งหน้า" />
                </th>
                <th style={{ width: 110 }}>รหัสหน่วยงาน</th>
                <th style={{ minWidth: 240 }}>ชื่อหน่วยงาน</th>
                <th className="center" style={{ width: 72 }}>รหัสเขต</th>
                <th style={{ minWidth: 160 }}>ลูกหนี้ตัวแทน</th>
                <th style={{ minWidth: 150 }}>ภูมิภาคสังกัด</th>
                <th className="center" style={{ width: 84 }}>แผ่นจัดเก็บ</th>
                <th className="center" style={{ width: 84 }}>รหัสที่อยู่</th>
                <th style={{ width: 130 }}>การจ่ายปันผล</th>
                <th className="center" style={{ width: 108 }}>สถานะเขต</th>
                <th className="center" style={{ width: 92 }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={11} className="empty-state" style={{ padding: '36px 12px' }}>
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  {hasFilter ? 'ไม่พบสังกัดที่ตรงกับเงื่อนไข' : 'ยังไม่มีข้อมูลสังกัด — กดปุ่ม “เพิ่มสังกัด” เพื่อเริ่มต้น'}
                </td></tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className={(sel[r.id] ? 'selected ' : '') + (r.on ? '' : 'da-off')}>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="ct-check" checked={!!sel[r.id]}
                           onChange={() => setSel(s => ({ ...s, [r.id]: !s[r.id] }))}
                           aria-label={'เลือก ' + r.code} />
                  </td>
                  <td><span className="da-code mono">{r.code}</span></td>
                  <td>
                    <div className="da-detail">{r.name}</div>
                    {r.note && <div className="da-row-note muted">{r.note}</div>}
                  </td>
                  <td className="center mono">{r.zone}</td>
                  <td style={{ fontSize: 12 }}>{r.agent || <span className="muted">—</span>}</td>
                  <td>{r.region ? window.adRegion(r.region).l : <span className="muted">—</span>}</td>
                  <td className="center mono">{r.disk || <span className="muted">—</span>}</td>
                  <td className="center mono">{r.addr || <span className="muted">—</span>}</td>
                  <td><AdDivChip v={r.div} /></td>
                  <td className="center">
                    <button className="da-status-toggle" onClick={() => toggleEnabled(r)}
                            title={r.on ? 'คลิกเพื่อปิดใช้งานเขต' : 'คลิกเพื่อเปิดใช้งานเขต'}>
                      {r.on ? <span className="pill ok">ใช้งาน</span> : <span className="pill neutral">ไม่ใช้งาน</span>}
                    </button>
                  </td>
                  <td className="center">
                    <div className="da-acts">
                      <button className="da-act" title="ดูรายละเอียด" onClick={() => setDrawer({ mode: 'view', record: r })}><Icon name="eye" size={14} /></button>
                      <button className="da-act" title="แก้ไข" onClick={() => setDrawer({ mode: 'edit', record: r })}><Icon name="edit" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── แบ่งหน้า ── */}
        <div className="da-pager">
          <span className="muted" style={{ fontSize: 12 }}>
            แสดง {startN}–{endN} จาก {fmt.int(filtered.length)} รายการ
          </span>
          <span className="da-pager-pp">
            <span className="muted" style={{ fontSize: 12 }}>แสดงต่อหน้า</span>
            <select className="filter-select sm" value={pageSize} style={{ width: 72 }}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <div className="da-pages">
            <button className="da-pg" disabled={curPage === 1} onClick={() => setPage(1)} aria-label="หน้าแรก">«</button>
            <button className="da-pg" disabled={curPage === 1} onClick={() => setPage(curPage - 1)} aria-label="ก่อนหน้า">‹</button>
            {pageNums.map((p, i) => p === '…'
              ? <span key={'e' + i} className="da-pg-dots">…</span>
              : <button key={p} className={'da-pg' + (p === curPage ? ' on' : '')} onClick={() => setPage(p)}>{p}</button>)}
            <button className="da-pg" disabled={curPage === pageCount} onClick={() => setPage(curPage + 1)} aria-label="ถัดไป">›</button>
            <button className="da-pg" disabled={curPage === pageCount} onClick={() => setPage(pageCount)} aria-label="หน้าสุดท้าย">»</button>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ค่าคงที่นี้ใช้ในการประมวลผลเรียกเก็บประจำเดือน · จัดเก็บข้อมูล (แผ่นจัดเก็บ) · และการจ่ายปันผลตามหน่วยงาน — คลิกป้ายสถานะเพื่อเปิด/ปิดใช้งานเขต หรือเลือกหลายรายการเพื่อปรับพร้อมกัน
      </div>

      {drawer && (
        <AdDrawer mode={drawer.mode} record={drawer.record} existing={list}
                  onClose={() => setDrawer(null)} onSubmit={submit} />
      )}
    </div>
  );
}

Object.assign(window, { AffilDetailConfigPage });
