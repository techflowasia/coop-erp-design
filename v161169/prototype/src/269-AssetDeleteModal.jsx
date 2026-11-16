// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ทะเบียนครุภัณฑ์ (หน้าหลัก)
//  รายการครุภัณฑ์ + ค้นหา/กรอง + สรุปมูลค่า → บันทึก/แก้ไข/เรียกดู/ลบ
// ════════════════════════════════════════════════════════════════════

function AssetDeleteModal({ asset, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}>
            <Icon name="close" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการลบครุภัณฑ์</h2>
            <div className="muted" style={{ fontSize: 11 }}>การลบจะนำรายการออกจากทะเบียนถาวร</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '2px 0 14px', fontSize: 13.5, lineHeight: 1.6 }}>
            ต้องการลบครุภัณฑ์ <b className="mono">{asset.id}</b><br />
            <span className="muted">{asset.name}</span> ออกจากทะเบียนใช่หรือไม่?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => onConfirm(asset)}>
              <Icon name="close" /> ลบครุภัณฑ์
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── โมดัลนำเข้าข้อมูล (Bulk Import) ─────────────────────────────────
function AssetImportModal({ onClose, onToast }) {
  const [file, setFile] = useState(null);
  const pick = (e) => { const f = (e.target.files || [])[0]; if (f) setFile(f.name); e.target.value = ''; };
  const doImport = () => {
    if (!file) { onToast && onToast('กรุณาเลือกไฟล์ที่ต้องการนำเข้า'); return; }
    onToast && onToast(`กำลังนำเข้าข้อมูลจากไฟล์ ${file} …`);
    onClose();
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name="upload" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>นำเข้าข้อมูลครุภัณฑ์</h2>
            <div className="muted" style={{ fontSize: 11 }}>อัปโหลดไฟล์ Excel / CSV เพื่อเพิ่มครุภัณฑ์เข้าทะเบียนจำนวนมาก</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <label className="as-import-drop">
            <Icon name="upload" size={22} />
            <span className="as-import-drop-t">{file || 'เลือกไฟล์เพื่ออัปโหลด'}</span>
            <span className="as-import-drop-s">รองรับไฟล์ .xlsx, .csv (ขนาดไม่เกิน 10 MB)</span>
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={pick} />
          </label>
          <div className="as-vat-note muted" style={{ marginTop: 12 }}>
            <Icon name="info" size={12} /> ไฟล์ต้องมีคอลัมน์: รหัสครุภัณฑ์ · ชื่อ · หมวดหมู่ · วันที่รับเข้า · ราคาทุน ·
            <button className="btn link sm" style={{ padding: '0 2px', height: 'auto' }}
                    onClick={() => onToast && onToast('กำลังดาวน์โหลดเทมเพลตนำเข้าข้อมูล…')}>
              <Icon name="download" size={12} /> ดาวน์โหลดเทมเพลต
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={doImport}>
              <Icon name="upload" /> นำเข้าข้อมูล
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function AssetWorkspace({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [assets, setAssets] = useState(window.astLoad);
  const [mode, setMode] = useState('list');     // 'list' | 'form'
  const [editDoc, setEditDoc] = useState(null);
  const [detailDoc, setDetailDoc] = useState(null);   // ดูรายละเอียด (อ่านอย่างเดียว)
  const [stickerDoc, setStickerDoc] = useState(null); // พิมพ์สติกเกอร์บาร์โค้ด
  const [delDoc, setDelDoc] = useState(null);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const cycle = (k) => setSortBy(s => s === k + '_desc' ? k + '_asc' : s === k + '_asc' ? 'none' : k + '_desc');
  const SortTh = ({ k, label, cls, w }) => {
    const on = sortBy.startsWith(k + '_');
    return (
      <th className={cls} style={{ width: w, cursor: 'pointer', userSelect: 'none', color: on ? 'var(--brand, #237450)' : undefined, whiteSpace: 'nowrap' }}
          title="คลิกเพื่อเรียงลำดับ" onClick={() => cycle(k)}>
        {label} <span style={{ color: on ? 'var(--brand, #237450)' : 'rgba(0,0,0,.3)' }}>{sortBy === k + '_desc' ? '↓' : sortBy === k + '_asc' ? '↑' : '⇅'}</span>
      </th>
    );
  };
  const [qD, setQD] = useState('');
  const [catD, setCatD] = useState('all');
  const [stD, setStD] = useState('all');
  const applySearch = () => { setQ(qD); setCatFilter(catD); setStatusFilter(stD); };
  const resetSearch = () => { setQD(''); setCatD('all'); setStD('all'); setQ(''); setCatFilter('all'); setStatusFilter('all'); };
  const [showBatch, setShowBatch] = useState(false);

  const persist = (next) => { setAssets(next); window.astSave(next); };

  // ขึ้นทะเบียนครุภัณฑ์ที่รับเข้าไว้ — ดึงข้อมูล + ออกเลขทะเบียนจริงให้กรอกรายละเอียด
  const registerPending = (a) => {
    const formalId = window.astNextId(assets, a.category, a.acquiredDate);
    setDetailDoc(null);
    setEditDoc({ ...JSON.parse(JSON.stringify(a)), id: formalId, _registering: true, _pendingId: a.id });
    setMode('form');
  };
  const openAsset = (a) => { setDetailDoc(null); setEditDoc(JSON.parse(JSON.stringify(a))); setMode('form'); };
  const openDetail = (a) => setDetailDoc(a);

  const handleSave = (doc) => {
    const clean = { ...doc }; delete clean._new; delete clean._depTouched; delete clean._registering; delete clean._pendingId;
    let next;
    let regCount = 1;
    if (doc._new) {
      clean.registered = true;
      next = [clean, ...assets];
    } else if (doc._registering) {
      const isBulk = window.astCatBulk(clean.category);
      const qty = Math.max(1, Number(doc.received) || 1);
      if (!isBulk && qty > 1) {
        // ครุภัณฑ์ทั่วไป (ไม่ใช่หมวดใช้แล้วหมดไป) — แยกรหัสต่อชิ้น (N ชิ้น = N เลข)
        const rest = assets.filter(a => a.id !== doc._pendingId);
        const baseMv = (doc.movements && doc.movements[0]) || null;
        const created = [];
        for (let i = 0; i < qty; i++) {
          const nid = window.astNextId([...rest, ...created], clean.category, clean.acquiredDate);
          const mv = baseMv ? {
            ...baseMv,
            id: window.astMoveNextId([...rest, ...created], 'receive', baseMv.date || clean.acquiredDate),
            qty: 1,
            note: (baseMv.note ? baseMv.note + ' · ' : '') + `ชิ้นที่ ${i + 1}/${qty}`,
          } : null;
          created.push({ ...clean, id: nid, registered: true, received: 1, issued: 0, movements: mv ? [mv] : [] });
        }
        next = [...created, ...rest];
        clean.id = created[0].id;
        clean._lastId = created[created.length - 1].id;
        clean.received = 1;
        regCount = qty;
      } else {
        clean.registered = true;   // ขึ้นทะเบียนรวมรายการเดียว (หมวดใช้แล้วหมดไป / รับเข้า 1 ชิ้น)
        next = assets.map(a => (a.id === doc._pendingId ? clean : a));
      }
    } else {
      next = assets.map(a => (a.id === editDoc.id ? clean : a));
    }
    persist(next);
    const lastId = regCount > 1 ? clean._lastId : clean.id;
    const regWord = doc._registering ? (regCount > 1 ? `ขึ้นทะเบียน ${regCount} รายการ` : 'ขึ้นทะเบียน') : (doc._new ? 'บันทึก' : 'แก้ไข');
    audit.log({
      action: (doc._new || doc._registering) ? 'create' : 'update', module: 'บัญชี — ทะเบียนครุภัณฑ์',
      target: `${clean.id} · ${clean.name}`,
      summary: `${regWord}ทะเบียนครุภัณฑ์ ${regCount > 1 ? `${clean.id} – ${lastId}` : clean.id} (${clean.name})`,
      changes: (doc._new || doc._registering) ? [
        { field: 'รหัสครุภัณฑ์', before: doc._pendingId || '—', after: regCount > 1 ? `${clean.id} – ${lastId} (${regCount} รายการ)` : clean.id },
        { field: 'ชื่อครุภัณฑ์', before: '—', after: clean.name },
      ] : [],
    });
    onToast && onToast(regCount > 1
      ? `ขึ้นทะเบียนครุภัณฑ์ ${regCount} รายการ (${clean.id} – ${lastId}) เรียบร้อยแล้ว`
      : `${regWord}ครุภัณฑ์ ${clean.id} เรียบร้อยแล้ว`);
    setMode('list'); setEditDoc(null);
  };

  const handleDelete = (a) => {
    persist(assets.filter(x => x.id !== a.id));
    audit.log({
      action: 'delete', module: 'บัญชี — ทะเบียนครุภัณฑ์',
      target: `${a.id} · ${a.name}`, summary: `ลบครุภัณฑ์ ${a.id} ออกจากทะเบียน`,
    });
    onToast && onToast(`ลบครุภัณฑ์ ${a.id} เรียบร้อยแล้ว`);
    setDelDoc(null);
  };

  // ─── แยกรายการที่ขึ้นทะเบียนแล้ว / รอขึ้นทะเบียน ───
  const pending = assets.filter(a => a.registered === false);
  const regAssets = assets.filter(a => a.registered !== false);

  // ─── สรุปภาพรวม (เฉพาะที่ขึ้นทะเบียนแล้ว) ───────────────────────────
  const active = regAssets.filter(a => a.status !== 'disposed');
  const totalCost = active.reduce((s, a) => s + (Number(a.cost) || 0), 0);
  const totalBook = active.reduce((s, a) => s + window.astDepreciation(a).bookValue, 0);
  const totalOnHand = regAssets.reduce((s, a) => s + window.astOnHand(a), 0);
  const attention = regAssets.filter(a => {
    if (a.status === 'repair') return true;
    const w = window.astWarranty(a);
    return w.state === 'soon' || w.state === 'expired';
  }).length;

  // ─── กรอง (เฉพาะรายการที่ขึ้นทะเบียนแล้ว) ───
  const filtered = regAssets.filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return [a.id, a.name, a.brand, a.model].some(x => (x || '').toLowerCase().includes(n));
    }
    return true;
  });
  const yearOf = (x) => Number(String(x.acquiredDate || '').slice(0, 4)) || 0;
  const valOf = (x) => Number(x.cost) || 0;
  const sorted = sortBy === 'none' ? filtered : [...filtered].sort((p, q2) =>
    sortBy === 'year_desc' ? yearOf(q2) - yearOf(p) : sortBy === 'year_asc' ? yearOf(p) - yearOf(q2)
    : sortBy === 'val_desc' ? valOf(q2) - valOf(p) : valOf(p) - valOf(q2));

  const custName = (v) => (window.AST_CUSTODIANS.find(c => c.v === v) || {}).l;
  const locName = (v) => (window.AST_LOCATIONS.find(l => l.v === v) || {}).l;
  const deptName = (v) => (window.AST_DEPARTMENTS.find(dp => dp.v === v) || {}).l;

  return (
    <div data-screen-label="หน้าทะเบียนครุภัณฑ์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ทะเบียนครุภัณฑ์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึก แก้ไข และเรียกดูครุภัณฑ์ พร้อมคำนวณค่าเสื่อมราคาและมูลค่าตามบัญชี
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setShowBatch(true)}><Icon name="print" /> พิมพ์บาร์โค้ด</button>
      </div>

      {/* คิวรอขึ้นทะเบียน — ครุภัณฑ์ใหม่ที่รับเข้าแล้วแต่ยังไม่ออกเลขทะเบียน */}
      {pending.length > 0 && (
        <div className="as-pending-panel">
          <div className="as-pending-head">
            <span className="as-pending-ico"><Icon name="info" size={14} /></span>
            <div style={{ minWidth: 0 }}>
              <div className="as-pending-title">รอขึ้นทะเบียน · {pending.length} รายการ</div>
              <div className="as-pending-sub muted">ครุภัณฑ์ใหม่ที่รับเข้าสต็อกแล้ว — กด“ขึ้นทะเบียน” เพื่อออกเลขทะเบียนและกรอกข้อมูลให้ครบ</div>
            </div>
          </div>
          <div className="as-pending-list">
            {pending.map(a => {
              const cat = window.astCat(a.category);
              return (
                <div className="as-pending-row" key={a.id}>
                  <div className="as-pending-info">
                    <span className="chip warning" style={{ fontSize: 10.5 }}>รอขึ้นทะเบียน</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="lt-row-name">{a.name}</div>
                      <div className="lt-row-note muted">
                        {cat ? cat.name : '—'} · รับเข้า {window.astOnHand(a)} {a.unit}
                        {a.acquiredDate ? <span> · {fmt.date(a.acquiredDate)}</span> : null}
                        <span className="mono"> · {a.id}</span>
                      </div>
                    </div>
                  </div>
                  <button className="btn primary sm" onClick={() => registerPending(a)}>
                    <Icon name="plus" /> ขึ้นทะเบียน
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* สรุปมูลค่า */}
      <div className="as-kpi-strip">
        <div className="as-kpi">
          <span className="as-kpi-lbl">ครุภัณฑ์ในทะเบียน</span>
          <span className="as-kpi-val">{regAssets.length.toLocaleString()} <span className="u">รายการ</span></span>
          <span className="as-kpi-sub">ใช้งานอยู่ {active.length} · คงเหลือในสต็อก {totalOnHand.toLocaleString()}</span>
        </div>
        <div className="as-kpi">
          <span className="as-kpi-lbl">มูลค่าราคาทุนรวม</span>
          <span className="as-kpi-val">฿ {fmt.money(totalCost, 0)}</span>
          <span className="as-kpi-sub">เฉพาะที่ยังใช้งาน</span>
        </div>
        <div className="as-kpi accent">
          <span className="as-kpi-lbl">มูลค่าตามบัญชี (สุทธิ)</span>
          <span className="as-kpi-val">฿ {fmt.money(totalBook, 0)}</span>
          <span className="as-kpi-sub">หลังหักค่าเสื่อมสะสม</span>
        </div>
        <div className="as-kpi">
          <span className="as-kpi-lbl">ต้องติดตาม</span>
          <span className="as-kpi-val">{attention} <span className="u">รายการ</span></span>
          <span className="as-kpi-sub">ส่งซ่อม / ใกล้หมดประกัน</span>
        </div>
      </div>

      <div className="search-card fbt-card">
        <div className="toolbar as-toolbar-eq" style={{ flexWrap: 'wrap', padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
          <div className="search" style={{ flex: '1 1 300px', height: 32, boxSizing: 'border-box' }}>
            <Icon name="search" size={14} />
            <input value={qD} onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }} placeholder="ค้นหารหัส, ชื่อ, ยี่ห้อ, รุ่น…" />
          </div>
          <select className="filter-select" value={catD} onChange={(e) => setCatD(e.target.value)}>
            <option value="all">ทุกหมวดหมู่</option>
            {window.AST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="filter-select" value={stD} onChange={(e) => setStD(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {window.AST_STATUS_ORDER.map(k => <option key={k} value={k}>{window.AST_STATUS[k].l}</option>)}
          </select>
          <button className="btn primary" style={{ height: 32 }} onClick={applySearch}>ค้นหา</button>
          <button className="btn" style={{ height: 32 }} onClick={resetSearch}>รีเซ็ต</button>
        </div>

        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th style={{ width: 124 }}>รหัสครุภัณฑ์</th>
                <th style={{ minWidth: 240 }}>ชื่อครุภัณฑ์ / รุ่น</th>
                <th style={{ width: 150 }}>หมวดหมู่</th>
                <SortTh k="year" label="ปีที่ซื้อ" cls="center" w={96} />
                <th style={{ minWidth: 180 }}>สถานที่ / ผู้รับผิดชอบ</th>
                <th className="center" style={{ width: 128 }}>คงเหลือสต็อก</th>
                <SortTh k="val" label="ราคาทุน" cls="right" w={120} />
                <th className="center" style={{ width: 130 }}>ระยะเวลาค่าเสื่อม</th>
                <th className="right" style={{ width: 130 }}>มูลค่าตามบัญชี</th>
                <th className="center" style={{ width: 120 }}>สถานะ</th>
                <th className="center" style={{ width: 96 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="11" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบครุภัณฑ์ที่ตรงกับเงื่อนไข</td></tr>
              )}
              {sorted.map(a => {
                const st = window.AST_STATUS[a.status] || window.AST_STATUS.in_use;
                const cat = window.astCat(a.category);
                const dep = window.astDepreciation(a);
                const w = window.astWarranty(a);
                const onHand = window.astOnHand(a);
                const ss = window.astStockState(a);
                return (
                  <tr key={a.id} className="clickable" onClick={() => openDetail(a)}>
                    <td className="mono">{a.id}</td>
                    <td>
                      <div className="lt-row-name">{a.name}</div>
                      <div className="lt-row-note muted">
                        {[a.brand, a.model].filter(Boolean).join(' ') || '—'}
                      </div>
                    </td>
                    <td>{cat ? cat.name : '—'}</td>
                    <td className="center mono">{a.acquiredDate ? Number(String(a.acquiredDate).slice(0, 4)) + 543 : '—'}</td>
                    <td>
                      <div className="lt-row-name" style={{ fontSize: 12.5 }}>{locName(a.location) || '—'}</div>
                      <div className="lt-row-note muted">{custName(a.custodian) || deptName(a.department) || '—'}</div>
                    </td>
                    <td className="center">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{onHand} <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{a.unit}</span></span>
                        <span className={"pill " + ss.pill} style={{ fontSize: 11 }} title={'รับ ' + a.received + ' · เบิก ' + a.issued}>{ss.l}</span>
                      </div>
                    </td>
                    <td className="right mono">{fmt.money(a.cost, 0)}</td>
                    <td className="center mono" style={{ fontSize: 12 }}>{(() => {
                      const c = (window.AST_CATEGORIES || []).find(x => x.id === a.category) || {};
                      const life = Number(a.lifeYears || c.lifeYears || c.life || 0);
                      if (c.noDep || !life) return <span className="muted">ไม่คิดค่าเสื่อม</span>;
                      return <span>{life} ปี</span>;
                    })()}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(dep.bookValue, 0)}</td>
                    <td className="center">
                      <span className={"pill " + st.pill}>{st.l}</span>
                      {(w.state === 'soon' || w.state === 'expired') && (
                        <div style={{ marginTop: 4, fontSize: 11, color: w.state === 'expired' ? 'var(--danger, #cf1322)' : '#d46b08' }}>
                          {w.state === 'expired' ? 'หมดประกันแล้ว' : 'ใกล้หมดประกัน'}
                        </div>
                      )}
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 2 }}>
                        <button className="bud-act" title="ดูรายละเอียด" onClick={() => openDetail(a)}><Icon name="eye" size={13} /></button>
                        <button className="bud-act as-act-edit" title="แก้ไข" onClick={() => openAsset(a)}><Icon name="edit" size={13} /></button>
                        <button className="bud-act" title="พิมพ์สติกเกอร์บาร์โค้ด" onClick={() => setStickerDoc(a)}><Icon name="print" size={13} /></button>
                        <button className="bud-act danger" title="ลบครุภัณฑ์" onClick={() => setDelDoc(a)}><Icon name="close" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> มูลค่าตามบัญชีคำนวณแบบเส้นตรง (Straight-line) จากราคาทุน หักค่าเสื่อมสะสมตามอายุการใช้งานและวันที่เริ่มคิดค่าเสื่อม
      </div>

      {delDoc && <AssetDeleteModal asset={delDoc} onConfirm={handleDelete} onClose={() => setDelDoc(null)} />}

      {detailDoc && (
        <AssetDetail asset={detailDoc}
                     onEdit={(a) => openAsset(a)}
                     onSticker={(a) => setStickerDoc(a)}
                     onClose={() => setDetailDoc(null)} />
      )}

      {stickerDoc && <AssetStickerModal asset={stickerDoc} onClose={() => setStickerDoc(null)} onToast={onToast} />}

      {showBatch && <AssetBatchStickerModal assets={assets} onClose={() => setShowBatch(false)} onToast={onToast} />}

      {mode === 'form' && editDoc && (
        <AssetForm asset={editDoc} assets={assets}
                   onSave={handleSave} onCancel={() => { setMode('list'); setEditDoc(null); }} onToast={onToast} />
      )}
    </div>
  );
}

Object.assign(window, { AssetWorkspace });
