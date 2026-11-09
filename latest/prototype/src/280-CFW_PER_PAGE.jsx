// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ค่าคงที่ — สูตรกระดาษทำการงบการเงินกระแสเงินสด
//  (Cash Flow Statement Working-Paper Formula)
//
//  แก้ไขสูตรแบบตาราง (spreadsheet) · เพิ่ม/ลบ/จัดเลขลำดับแถว ·
//  ดึงข้อมูล (สร้างสูตร เดบิต/เครดิต จากรหัสยกมาตามประเภททำการ) ·
//  ตรวจสอบสูตร · แสดงกระดาษทำการที่ประมวลผลจริง · บันทึก
// ════════════════════════════════════════════════════════════════════
const CFW_PER_PAGE = 20;
const CFW_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';
const cfwMoney = (n) => window.fmt.money(Number(n || 0), 2);

// ─── Modal: ผลการตรวจสอบสูตร ────────────────────────────────────────
function CfwValidateModal({ results, onClose }) {
  const bad = results.filter(r => r.issues.length);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className={"gc-modal-ico" + (bad.length ? '' : '')}><Icon name={bad.length ? 'info' : 'check'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ผลการตรวจสอบสูตร</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              ตรวจ {results.length} รายการ · {bad.length ? `พบปัญหา ${bad.length} รายการ` : 'ไม่พบข้อผิดพลาด'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {bad.length === 0 ? (
            <div className="cfw-valid-ok"><Icon name="check" size={15} /> ทุกสูตรถูกต้อง — รหัสบัญชีอ้างอิงครบและรูปแบบสูตรสมบูรณ์</div>
          ) : (
            <div className="cfw-valid-list">
              {bad.map(r => (
                <div key={r.id} className="cfw-valid-item">
                  <div className="cfw-valid-name"><span className="mono">{r.order}</span> {r.name}</div>
                  <ul>{r.issues.map((s, i) => <li key={i}><Icon name="info" size={11} /> {s}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', marginTop: 16 }}>
            <span className="spacer" />
            <button className="btn primary" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Modal: กระดาษทำการที่ประมวลผลแล้ว ──────────────────────────────
function CfwPreviewModal({ rows, onClose }) {
  const computed = rows.map((r, i) => ({ order: i + 1, name: r.name, ...window.cfwComputeRow(r) }));
  const tot = computed.reduce((a, c) => ({
    opening: a.opening + c.opening, debit: a.debit + c.debit,
    credit: a.credit + c.credit, change: a.change + c.change, ending: a.ending + c.ending,
  }), { opening: 0, debit: 0, credit: 0, change: 0, ending: 0 });
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 'min(1080px, 96vw)' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>กระดาษทำการงบกระแสเงินสด (ประมวลผล)</h2>
            <div className="muted" style={{ fontSize: 11 }}>ทดลองประมวลผลสูตรจากยอดเคลื่อนไหวบัญชีของงวด — เดบิต/เครดิต/ยกมา และการเปลี่ยนแปลงสุทธิ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '72vh', overflow: 'auto' }}>
          <table className="tbl cfw-preview-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 54 }}>ลำดับ</th>
                <th style={{ minWidth: 240 }}>ชื่อบัญชี / รายการ</th>
                <th className="right">ยอดยกมา</th>
                <th className="right">เดบิต</th>
                <th className="right">เครดิต</th>
                <th className="right">เปลี่ยนแปลงสุทธิ</th>
                <th className="right">ยอดปลายงวด</th>
              </tr>
            </thead>
            <tbody>
              {computed.map(c => (
                <tr key={c.order}>
                  <td className="center mono">{c.order}</td>
                  <td>{c.name}</td>
                  <td className="right mono">{cfwMoney(c.opening)}</td>
                  <td className="right mono">{cfwMoney(c.debit)}</td>
                  <td className="right mono">{cfwMoney(c.credit)}</td>
                  <td className={"right mono " + (c.change >= 0 ? 'cfw-pos' : 'cfw-neg')}>
                    {(c.change >= 0 ? '' : '(') + cfwMoney(Math.abs(c.change)) + (c.change >= 0 ? '' : ')')}
                  </td>
                  <td className="right mono">{cfwMoney(c.ending)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="cfw-tot-row">
                <td colSpan={2} className="right"><b>รวมทั้งสิ้น</b></td>
                <td className="right mono"><b>{cfwMoney(tot.opening)}</b></td>
                <td className="right mono"><b>{cfwMoney(tot.debit)}</b></td>
                <td className="right mono"><b>{cfwMoney(tot.credit)}</b></td>
                <td className={"right mono " + (tot.change >= 0 ? 'cfw-pos' : 'cfw-neg')}>
                  <b>{(tot.change >= 0 ? '' : '(') + cfwMoney(Math.abs(tot.change)) + (tot.change >= 0 ? '' : ')')}</b>
                </td>
                <td className="right mono"><b>{cfwMoney(tot.ending)}</b></td>
              </tr>
            </tfoot>
          </table>
          <div className="cfw-preview-note">
            <Icon name="info" size={12} /> เดบิต/เครดิต ประมวลผลจากสูตร drcr/crdr/dr/cr ของแต่ละแถว · เปลี่ยนแปลงสุทธิ = เดบิต − เครดิต · ยอดปลายงวด = ยอดยกมา + เปลี่ยนแปลงสุทธิ
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Modal: ยืนยันลบแถว ─────────────────────────────────────────────
function CfwDeleteModal({ rows, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="trash" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการลบแถว</h2>
            <div className="muted" style={{ fontSize: 11 }}>การลบไม่สามารถย้อนกลับได้</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '2px 0 16px', fontSize: 13.5, lineHeight: 1.6 }}>
            ต้องการลบ <b>{rows.length}</b> แถวที่เลือกใช่หรือไม่?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
              <Icon name="trash" size={13} /> ยืนยันการลบ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
function CfWorksheetFormulaPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [rows, setRows]     = useState(window.cfwLoad);
  const [txnType, setTxnType] = useState('เดบิต,เครดิต');
  const [carrySide, setCarrySide] = useState('เดบิต');
  const [sel, setSel]       = useState(() => new Set());
  const [page, setPage]     = useState(1);
  const [dirty, setDirty]   = useState(false);
  const [modal, setModal]   = useState(null);   // 'validate' | 'preview' | 'delete'
  const [valResults, setValResults] = useState([]);

  const persist = (next) => { setRows(next); window.cfwSave(next); };
  const markDirty = (next) => { setRows(next); setDirty(true); };

  const pageCount = Math.max(1, Math.ceil(rows.length / CFW_PER_PAGE));
  const curPage = Math.min(page, pageCount);
  const start = (curPage - 1) * CFW_PER_PAGE;
  const pageRows = rows.slice(start, start + CFW_PER_PAGE);

  const setField = (id, field, value) =>
    markDirty(rows.map(r => r.id === id ? { ...r, [field]: value } : r));

  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPageSelected = pageRows.length > 0 && pageRows.every(r => sel.has(r.id));
  const toggleSelAllPage = () => setSel(s => {
    const n = new Set(s);
    if (allOnPageSelected) pageRows.forEach(r => n.delete(r.id));
    else pageRows.forEach(r => n.add(r.id));
    return n;
  });

  const addRow = () => {
    const nr = { id: window.cfwUid(), name: '', debit: '', credit: '', carry: '' };
    // แทรกหลังแถวที่เลือกล่าสุด ถ้ามี ไม่งั้นต่อท้าย
    let next;
    const lastSel = [...sel].pop();
    const idx = lastSel ? rows.findIndex(r => r.id === lastSel) : -1;
    if (idx >= 0) { next = [...rows]; next.splice(idx + 1, 0, nr); }
    else next = [...rows, nr];
    markDirty(next);
    setPage(Math.ceil((idx >= 0 ? idx + 2 : next.length) / CFW_PER_PAGE));
    onToast && onToast('เพิ่มแถวใหม่แล้ว');
  };

  const doDelete = () => {
    const next = rows.filter(r => !sel.has(r.id));
    markDirty(next);
    setSel(new Set());
    setModal(null);
    onToast && onToast('ลบแถวที่เลือกแล้ว');
  };

  const renumber = () => {
    // จัดเรียงเลขลำดับใหม่ (id คงเดิม, ลำดับ = ตำแหน่งในตาราง) — reindex id ให้ต่อเนื่อง
    const next = rows.map((r, i) => ({ ...r, id: r.id }));
    markDirty(next);
    onToast && onToast('จัดเลขลำดับใหม่เรียบร้อยแล้ว');
  };

  const fetchDerive = () => {
    let filled = 0;
    const next = rows.map(r => {
      const d = window.cfwDerive(r.carry, txnType);
      const patch = {};
      if (d.debit != null && d.debit !== r.debit) { patch.debit = d.debit; filled++; }
      if (d.credit != null && d.credit !== r.credit) { patch.credit = d.credit; filled++; }
      return Object.keys(patch).length ? { ...r, ...patch } : r;
    });
    markDirty(next);
    onToast && onToast(filled ? `ดึงข้อมูล/สร้างสูตรจากรหัสยกมา (${txnType}) แล้ว` : 'สูตรตรงกับรหัสยกมาอยู่แล้ว');
  };

  const validateAll = () => {
    const results = rows.map((r, i) => ({ id: r.id, order: i + 1, name: r.name || '(ไม่มีชื่อ)', issues: window.cfwValidateRow(r) }));
    setValResults(results);
    setModal('validate');
    const bad = results.filter(r => r.issues.length).length;
    onToast && onToast(bad ? `ตรวจพบปัญหา ${bad} รายการ` : 'ตรวจสอบสูตรเรียบร้อย — ไม่พบข้อผิดพลาด');
  };

  const saveAll = () => {
    window.cfwSave(rows);
    setDirty(false);
    audit.log && audit.log({ action: 'update', module: 'บัญชี — สูตรกระดาษทำการงบกระแสเงินสด',
      target: `${rows.length} รายการ`, summary: `บันทึกสูตรกระดาษทำการงบกระแสเงินสด (${rows.length} รายการ)` });
    onToast && onToast('บันทึกสูตรกระดาษทำการงบกระแสเงินสดแล้ว');
  };

  const resetSeed = () => {
    const fresh = (window.CFW_ROWS_SEED || []).map(r => ({ ...r }));
    persist(fresh); setSel(new Set()); setDirty(false); setPage(1);
    onToast && onToast('คืนค่าสูตรตั้งต้นเรียบร้อยแล้ว');
  };

  return (
    <div className="cfw-page" data-screen-label="หน้าสูตรกระดาษทำการงบกระแสเงินสด">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกสูตรกระดาษทำการงบกระแสเงินสด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            กำหนดว่ากระดาษทำการงบกระแสเงินสดแต่ละรายการจะดึงยอดเคลื่อนไหวบัญชีมาลงด้านเดบิต/เครดิต และบัญชีใดเป็นยอดยกมาต้นงวด — ใช้ประมวลผลงบกระแสเงินสดแบบวิธีทางอ้อม
          </div>
        </div>
        <span className="spacer" />
        <button className={"btn primary sm" + (dirty ? '' : '')} onClick={saveAll} disabled={!dirty}>
          <Icon name="check" size={13} /> บันทึก{dirty ? ' *' : ''}
        </button>
      </div>

      {/* ── ประเภททำการ ── */}
      <div className="search-card cfw-select-card">
        <div className="cfw-select-row">
          <label className="cfw-select-lbl">ประเภททำการ :</label>
          <select className="cfg-input cfw-select" value={txnType} onChange={e => setTxnType(e.target.value)}>
            {window.CFW_TXN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="cfg-input cfw-select" value={carrySide} onChange={e => setCarrySide(e.target.value)}
                  title="ด้านของยอดยกมา">
            {window.CFW_CARRY_SIDES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn" style={{ height: 32, padding: '0 12px' }} onClick={fetchDerive} title="สร้างสูตรเดบิต/เครดิตจากรหัสยกมาตามประเภททำการ">
            <Icon name="download" size={13} /> ดึงข้อมูล
          </button>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>{rows.length} รายการ</span>
        </div>
      </div>

      {/* ── แถบเครื่องมือ ── */}
      <div className="cfw-toolbar">
        <button className="cfw-tool" onClick={() => setModal('preview')}><Icon name="report" size={13} /> รายการ</button>
        <button className="cfw-tool add" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มแถว</button>
        <button className="cfw-tool del" onClick={() => sel.size ? setModal('delete') : (onToast && onToast('เลือกแถวที่ต้องการลบก่อน'))}
                disabled={!sel.size}><span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: CFW_TRASH }} /> ลบแถว{sel.size ? ` (${sel.size})` : ''}</button>
        <button className="cfw-tool" onClick={renumber}><Icon name="sort" size={13} /> จัดเลขลำดับใหม่</button>
        <span className="spacer" />
        <button className="cfw-tool" onClick={validateAll}><Icon name="check" size={13} /> ตรวจสอบสูตร</button>
      </div>

      {/* ── ตารางสูตร ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <span className="head-bar" /><h3>ตารางสูตรกระดาษทำการ</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {rows.length} รายการ</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl cfw-tbl">
            <thead>
              <tr>
                <th className="center cfw-c-sel">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelAllPage} aria-label="เลือกทั้งหน้า" />
                </th>
                <th className="center cfw-c-ord">ลำดับ</th>
                <th className="cfw-c-name">ชื่อบัญชี</th>
                <th className="cfw-c-fml">เดบิต</th>
                <th className="cfw-c-fml">เครดิต</th>
                <th className="cfw-c-carry">ยกมา</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={6} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีรายการ — กด “เพิ่มแถว” เพื่อเริ่มกำหนดสูตร
                </td></tr>
              )}
              {pageRows.map((r, i) => {
                const order = start + i + 1;
                const checked = sel.has(r.id);
                return (
                  <tr key={r.id} className={"cfw-row" + (checked ? ' is-sel' : '')}>
                    <td className="center cfw-c-sel">
                      <input type="checkbox" checked={checked} onChange={() => toggleSel(r.id)} aria-label={`เลือกแถว ${order}`} />
                    </td>
                    <td className="center mono cfw-c-ord">{order}</td>
                    <td className="cfw-c-name">
                      <input className="cfw-in" value={r.name} placeholder="ชื่อบัญชี / รายการ"
                             onChange={e => setField(r.id, 'name', e.target.value)} />
                    </td>
                    <td className="cfw-c-fml">
                      <input className="cfw-in mono" value={r.debit} placeholder="+drcr(รหัส)"
                             onChange={e => setField(r.id, 'debit', e.target.value)} />
                    </td>
                    <td className="cfw-c-fml">
                      <input className="cfw-in mono" value={r.credit} placeholder="+crdr(รหัส)"
                             onChange={e => setField(r.id, 'credit', e.target.value)} />
                    </td>
                    <td className="cfw-c-carry">
                      <input className="cfw-in mono" value={r.carry} placeholder="รหัส, ช่วงรหัส"
                             onChange={e => setField(r.id, 'carry', e.target.value)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── แถบล่าง: หน้า ── */}
        <div className="cfw-foot">
          <div className="cfw-pager">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
              <button key={p} className={"cfw-page-btn" + (p === curPage ? ' active' : '')} onClick={() => setPage(p)}>[{p}]</button>
            ))}
          </div>
          <span className="cfw-goto">Go To:
            <select className="cfg-input" value={curPage} onChange={e => setPage(Number(e.target.value))}>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </span>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>แสดง {start + 1}–{Math.min(start + CFW_PER_PAGE, rows.length)} จาก {rows.length}</span>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> สูตรเหล่านี้ใช้ประมวลผลงบกระแสเงินสด (วิธีทางอ้อม) โดยอ้างอิงยอดเคลื่อนไหวบัญชีจากบัญชีแยกประเภทของงวด
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal === 'validate' && <CfwValidateModal results={valResults} onClose={() => setModal(null)} />}
      {modal === 'preview' && <CfwPreviewModal rows={rows} onClose={() => setModal(null)} />}
      {modal === 'delete' && <CfwDeleteModal rows={[...sel]} onConfirm={doDelete} onClose={() => setModal(null)} />}
    </div>
  );
}

Object.assign(window, { CfWorksheetFormulaPage });
