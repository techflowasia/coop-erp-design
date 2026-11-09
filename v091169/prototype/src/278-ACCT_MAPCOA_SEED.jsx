// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › Map คู่บัญชี (Account Mapping)
//  ตารางจับคู่บัญชีอัตโนมัติต่อ "ประเภทการทำรายการ" ของแต่ละระบบงาน:
//   ระบบ · รหัสทำรายการ · ประเภท · Shrlontype Status ·
//   Account Id · Accint Id · Accintarr Id · Acctax Id ·
//   Sortacc/Sortint/Sortintarr/Sorttax Order
//  แก้ไขได้ทั้งตาราง · เพิ่มแถว / ลบแถว · บันทึกลง localStorage
// ════════════════════════════════════════════════════════════════════

// ─── ค่าตั้งต้น (seed) ───────────────────────────────────────────────
window.ACCT_MAPCOA_SEED = window.ACCT_MAPCOA_SEED || [
  { sys: 'DEP', txn: 'DEP', type: '10', status: '1', account: '214101', accint: '510010', accintarr: '219707', acctax: '',       sortAcc: '4020', sortInt: '4021', sortIntarr: '4022', sortTax: '4999' },
  { sys: 'DEP', txn: 'DEP', type: '11', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '0',    sortInt: '0',    sortIntarr: '0',    sortTax: '0' },
  { sys: 'DEP', txn: 'DEP', type: '12', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '4040', sortInt: '4041', sortIntarr: '4042', sortTax: '0' },
  { sys: 'DEP', txn: 'DEP', type: '13', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '4050', sortInt: '4051', sortIntarr: '4052', sortTax: '0' },
  { sys: 'DEP', txn: 'DEP', type: '14', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '15', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '16', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '17', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '18', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '19', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '20', status: '1', account: '214201', accint: '510010', accintarr: '219708', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '21', status: '1', account: '214301', accint: '510010', accintarr: '219703', acctax: '219301', sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '24', status: '1', account: '214301', accint: '510010', accintarr: '219703', acctax: '219301', sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '31', status: '1', account: '214301', accint: '510010', accintarr: '219703', acctax: '219301', sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '36', status: '1', account: '214301', accint: '510010', accintarr: '219703', acctax: '219301', sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '48', status: '1', account: '214301', accint: '510010', accintarr: '219703', acctax: '219301', sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '50', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '52', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '53', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
  { sys: 'DEP', txn: 'DEP', type: '54', status: '1', account: '214302', accint: '510010', accintarr: '219702', acctax: '',       sortAcc: '',     sortInt: '',     sortIntarr: '',     sortTax: '' },
];

const MAP_COLS = [
  { key: 'txn',        label: 'รหัสทำรายการ', w: 120, mono: true },
  { key: 'type',       label: 'ประเภท',        w: 84,  mono: true, center: true },
  { key: 'status',     label: 'Shrlontype Status', w: 130, mono: true, center: true },
  { key: 'account',    label: 'Account Id',    w: 150, mono: true, acct: true },
  { key: 'accint',     label: 'Accint Id',     w: 150, mono: true, acct: true },
  { key: 'accintarr',  label: 'Accintarr Id',  w: 150, mono: true, acct: true },
  { key: 'acctax',     label: 'Acctax Id',     w: 150, mono: true, acct: true },
  { key: 'sortAcc',    label: 'Sortacc Order', w: 120, mono: true, right: true },
  { key: 'sortInt',    label: 'Sortint Order', w: 120, mono: true, right: true },
  { key: 'sortIntarr', label: 'Sortintarr Order', w: 132, mono: true, right: true },
  { key: 'sortTax',    label: 'Sorttax Order', w: 120, mono: true, right: true },
];

const MAP_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">' + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />' + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />' + '<path d="M10 10.5v6M14 10.5v6" /></svg>';
if (!document.getElementById('map-trash-style')) {
  const st = document.createElement('style');
  st.id = 'map-trash-style';
  st.textContent = '[data-screen-label="หน้า Map คู่บัญชี"] .bud-act.danger:hover { border-color: var(--border) !important; }';
  document.head.appendChild(st);
}
function mapLoad() {
  try {
    const saved = localStorage.getItem('acct_mapcoa_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.ACCT_MAPCOA_SEED || []).map(r => ({ ...r }));
}
function mapSave(list) {
  try { localStorage.setItem('acct_mapcoa_v1', JSON.stringify(list)); } catch (e) {}
}
let _mapSeq = 0;
const mapUid = () => 'mp-' + Date.now().toString(36) + '-' + (++_mapSeq);
// ชื่อบัญชีจากรหัส (อ้างอิงผังบัญชี)
const mapAcctName = (code) => (code && window.coaAccountName) ? (window.coaAccountName(String(code)) || '') : '';
const mapBlank = (sys) => ({
  _id: mapUid(), sys: sys || 'DEP', txn: sys || 'DEP', type: '', status: '1',
  account: '', accint: '', accintarr: '', acctax: '',
  sortAcc: '', sortInt: '', sortIntarr: '', sortTax: '',
});

// ════════════════════════════════════════════════════════════════════
//  Delete confirm
// ════════════════════════════════════════════════════════════════════
function MapDeleteModal({ row, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
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
            ต้องการลบคู่บัญชีระบบ <b className="mono">{row.sys}</b> · ประเภท <b className="mono">{row.type || '—'}</b> · บัญชี <b className="mono">{row.account || '—'}</b> ใช่หรือไม่?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onConfirm(row)}>
              <Icon name="trash" size={13} /> ยืนยันการลบ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function MapCoaPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(() => mapLoad().map(r => ({ _id: r._id || mapUid(), ...r })));
  const [del, setDel]   = useState(null);
  const [dirty, setDirty] = useState(false);

  // ระบบ (ชื่อย่อระบบ) จากค่าคงที่ "กำหนดชื่อระบบ"
  const systems = React.useMemo(() => {
    const codes = (window.acctSysCodeLoad ? window.acctSysCodeLoad() : [])
      .filter(s => s.enabled !== false).map(s => s.code);
    const seen = new Set(codes);
    list.forEach(r => { if (r.sys && !seen.has(r.sys)) { seen.add(r.sys); codes.push(r.sys); } });
    if (!codes.length) codes.push('DEP');
    return codes;
  }, [list]);

  const [fSys, setFSys] = useState('all');
  const [defSys, setDefSys] = useState(systems[0] || 'DEP');
  const [q, setQ] = useState('');

  // บัญชีที่ลงรายการได้ (posting) — ใช้เป็น datalist + ตรวจสอบความถูกต้อง
  const postingAccts = React.useMemo(
    () => (window.coaFlatAccounts ? window.coaFlatAccounts() : []).filter(a => a.kind === 'posting' && a.enabled !== false), []);
  const validCodes = React.useMemo(() => new Set(postingAccts.map(a => String(a.code))), [postingAccts]);

  window.useBreadcrumb && window.useBreadcrumb([{ label: 'Map คู่บัญชี', current: true }], []);

  const persist = (next) => { setList(next); mapSave(next); };
  const setCell = (id, key, val) => {
    const next = list.map(r => r._id === id ? { ...r, [key]: val } : r);
    setList(next); setDirty(true);
  };

  const addRow = () => {
    const sys = fSys !== 'all' ? fSys : defSys;
    const next = [...list, mapBlank(sys)];
    persist(next); setDirty(false);
    onToast && onToast('เพิ่มแถวคู่บัญชีใหม่แล้ว — กรอกรายละเอียดแล้วบันทึก');
  };

  const confirmDelete = (row) => {
    persist(list.filter(r => r._id !== row._id));
    audit.log && audit.log({ action: 'delete', module: 'บัญชี — Map คู่บัญชี',
      target: `${row.sys} · ประเภท ${row.type}`, summary: `ลบคู่บัญชี ${row.sys} ประเภท ${row.type} (บัญชี ${row.account})` });
    onToast && onToast('ลบแถวคู่บัญชีเรียบร้อยแล้ว');
    setDel(null);
  };

  const saveAll = () => {
    mapSave(list); setDirty(false);
    audit.log && audit.log({ action: 'update', module: 'บัญชี — Map คู่บัญชี',
      target: `${list.length} รายการ`, summary: `บันทึกการจับคู่บัญชี ${list.length} รายการ` });
    onToast && onToast(`บันทึก Map คู่บัญชี ${list.length} รายการเรียบร้อยแล้ว`);
  };

  const resetSeed = () => {
    const fresh = (window.ACCT_MAPCOA_SEED || []).map(r => ({ _id: mapUid(), ...r }));
    persist(fresh); setDirty(false);
    onToast && onToast('คืนค่า Map คู่บัญชีตั้งต้นเรียบร้อยแล้ว');
  };

  const shown = React.useMemo(() => {
    let rows = fSys === 'all' ? list : list.filter(r => r.sys === fSys);
    const term = q.trim().toLowerCase();
    if (term) rows = rows.filter(r =>
      [r.txn, r.type, r.account, r.accint, r.accintarr, r.acctax]
        .some(v => String(v || '').toLowerCase().includes(term))
      || mapAcctName(r.account).toLowerCase().includes(term));
    return rows;
  }, [list, fSys, q]);

  // นับรหัสบัญชีที่ยังไม่มีในผังบัญชี (soft hint — ไม่ใช่ข้อผิดพลาด)
  const unmatchedCount = React.useMemo(() => {
    let n = 0;
    list.forEach(r => ['account', 'accint', 'accintarr', 'acctax'].forEach(k => {
      if (r[k] && !validCodes.has(String(r[k]))) n++;
    }));
    return n;
  }, [list, validCodes]);

  return (
    <div data-screen-label="หน้า Map คู่บัญชี">
      <datalist id="map-acct-list">
        {postingAccts.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
      </datalist>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Map คู่บัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            จับคู่บัญชีอัตโนมัติของแต่ละประเภทการทำรายการในแต่ละระบบงาน — กำหนดบัญชีเงินต้น (Account),
            ดอกเบี้ย (Accint), ดอกเบี้ยค้าง (Accintarr), ภาษี (Acctax) และลำดับการจัดเรียง เพื่อให้ระบบสร้างรายการบัญชีให้อัตโนมัติ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
        <button className={"btn primary sm" + (dirty ? '' : '')} onClick={saveAll}>
          <Icon name="check" size={13} /> บันทึก{dirty ? ' *' : ''}
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <span className="head-bar" /><h3>ตารางจับคู่บัญชี</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            {unmatchedCount > 0 && (
              <span className="pill neutral" title="รหัสบัญชีที่ยังไม่มีในผังบัญชีชุดนี้ — กรอกได้แต่จะยังไม่แสดงชื่อบัญชี">
                <Icon name="info" size={11} /> ยังไม่มีในผังบัญชี {unmatchedCount}
              </span>
            )}
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {shown.length} / {list.length} รายการ</span>
          </div>
        </div>
        <div className="bud-toolbar map-toolbar" style={{ padding: 0, border: 0, marginBottom: 10 }}>
          <button className="btn accent sm" onClick={addRow}>
            <Icon name="plus" size={13} /> เพิ่มแถว
          </button>
          <span style={{ width: 1, height: 20, background: 'var(--divider)' }} />
          <label className="map-filter">
            <span className="muted" style={{ fontSize: 12 }}>ระบบ</span>
            <select className="cfg-input sm" value={fSys} onChange={e => setFSys(e.target.value)} style={{ minWidth: 120 }}>
              <option value="all">ทั้งหมด</option>
              {systems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          {fSys === 'all' && (
            <label className="map-filter">
              <span className="muted" style={{ fontSize: 12 }}>เพิ่มแถวสำหรับระบบ</span>
              <select className="cfg-input sm" value={defSys} onChange={e => setDefSys(e.target.value)} style={{ minWidth: 100 }}>
                {systems.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          <label className="map-filter">
            <span className="muted" style={{ fontSize: 12 }}>ค้นหา</span>
            <input className="cfg-input sm" value={q} onChange={e => setQ(e.target.value)}
                   placeholder="รหัส/ประเภท/บัญชี/ชื่อบัญชี" style={{ minWidth: 190 }} />
          </label>
        </div>

        <div className="table-wrap map-table-wrap" style={{ border: 0 }}>
          <table className="tbl map-tbl">
            <thead>
              <tr>
                <th className="center map-sys-col">ระบบ</th>
                {MAP_COLS.map(c => (
                  <th key={c.key} className={c.center ? 'center' : c.right ? 'right' : ''} style={{ width: c.w }}>{c.label}</th>
                ))}
                <th className="center" style={{ width: 56 }}>ลบ</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={MAP_COLS.length + 2} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีคู่บัญชี — กด “เพิ่มแถว” เพื่อเริ่มจับคู่บัญชี
                </td></tr>
              )}
              {shown.map(r => (
                <tr key={r._id}>
                  <td className="map-sys-col">
                    <select className="cfg-input map-cell map-sys-sel" value={r.sys}
                            onChange={e => setCell(r._id, 'sys', e.target.value)}>
                      {systems.map(s => <option key={s} value={s}>{s}</option>)}
                      {!systems.includes(r.sys) && <option value={r.sys}>{r.sys}</option>}
                    </select>
                  </td>
                  {MAP_COLS.map(c => {
                    const val = r[c.key] || '';
                    if (c.acct) {
                      const nm = mapAcctName(val);
                      const unmatched = val && !validCodes.has(String(val));
                      return (
                        <td key={c.key} className="map-acct-cell">
                          <input
                            className="cfg-input map-cell mono"
                            list="map-acct-list" value={val}
                            title={nm || (unmatched ? 'รหัสนี้ยังไม่มีในผังบัญชีของปีนี้' : '')}
                            onChange={e => setCell(r._id, c.key, e.target.value)} />
                          <span className={"map-acct-name" + (unmatched ? ' unmatched' : '')}>
                            {nm || (unmatched ? 'ยังไม่มีในผังบัญชี' : '\u00a0')}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={c.key} className={c.right ? 'right' : c.center ? 'center' : ''}>
                        <input
                          className={"cfg-input map-cell" + (c.mono ? ' mono' : '') + (c.right ? ' ta-r' : c.center ? ' ta-c' : '')}
                          value={val}
                          onChange={e => setCell(r._id, c.key, e.target.value)} />
                      </td>
                    );
                  })}
                  <td className="center">
                    <button className="bud-act danger" title="ลบแถว" onClick={() => setDel(r)}
                            dangerouslySetInnerHTML={{ __html: MAP_TRASH }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ระบบ (ชื่อย่อระบบ) อ้างอิงจากค่าคงที่ “กำหนดชื่อระบบ” · ช่องบัญชีเลือกจากผังบัญชีได้ (พิมพ์รหัสหรือชื่อบัญชีเพื่อค้นหา) · รหัสที่ไม่มีในผังบัญชีจะถูกทำเครื่องหมายสีแดง · แก้ค่าในตารางได้โดยตรง แล้วกด “บันทึก”
      </div>

      {del && <MapDeleteModal row={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </div>
  );
}

window.acctMapCoaLoad = mapLoad;
Object.assign(window, { MapCoaPage });
