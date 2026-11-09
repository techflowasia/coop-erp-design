// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ข้อมูลพื้นฐาน — ค่าคงที่อัตราดอกเบี้ยเงินฝาก
//  รายการประเภทบัญชี ⇄ ตารางอัตราตามช่วงยอดเงิน + ประวัติ + สถานะอนุมัติ
// ════════════════════════════════════════════════════════════════════

let _drUidSeq = 0;
const drUid = () => 'DR-N' + (++_drUidSeq);
const drToday = () => new Date().toISOString().slice(0, 10);
const DR_USER = 'จันทร์เพ็ญ มาลี';

function drLoad() {
  try { const s = localStorage.getItem('dep_rates'); if (s) return JSON.parse(s); } catch (e) {}
  return window.DEP_RATE_SEED.map(r => ({ ...r, rates: r.rates.map(x => ({ ...x })) }));
}
function drSaveLS(list) { try { localStorage.setItem('dep_rates', JSON.stringify(list)); } catch (e) {} }

// ─── ตรวจช่วงวันที่ซ้ำ (เฉพาะ band เดียวกัน) ─────────────────────────
function drOverlap(rates) {
  const bad = new Set();
  for (let i = 0; i < rates.length; i++) {
    for (let j = i + 1; j < rates.length; j++) {
      const a = rates[i], b = rates[j];
      const sameBand = Number(a.balFrom) === Number(b.balFrom) && Number(a.balTo) === Number(b.balTo);
      if (!sameBand) continue;
      const aEnd = a.endDate || '9999-12-31', bEnd = b.endDate || '9999-12-31';
      if (a.effectiveDate <= bEnd && b.effectiveDate <= aEnd) { bad.add(i); bad.add(j); }
    }
  }
  return bad;
}

function DrDetail({ record, onBack, onSave, startEditing }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const cur = editing ? draft : record;
  const rows = cur.rates;
  const AP = window.DEP_RATE_APPROVE;
  const IM = window.DEP_INT_METHODS;
  const overlap = useMemo(() => drOverlap(rows), [rows]);

  const setHdr = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setRow = (i, k, v) => setDraft(d => ({ ...d, rates: d.rates.map((t, idx) => idx === i ? { ...t, [k]: v, user: DR_USER, date: drToday() } : t) }));
  const addRow = () => setDraft(d => {
    const last = d.rates[0];
    return { ...d, rates: [{
      effectiveDate: drToday(), endDate: '',
      balFrom: last ? Number(last.balTo) + 1 : 0, balTo: 999999999,
      rate: last ? last.rate : 1.5, method: last ? last.method : 'daily', dayBase: 365,
      approve: 'draft', user: DR_USER, date: drToday(),
    }, ...d.rates] };
  });
  const delRow = (i) => setDraft(d => ({ ...d, rates: d.rates.filter((_, idx) => idx !== i) }));

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save      = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  return (
    <div data-screen-label="หน้ารายละเอียดอัตราดอกเบี้ยเงินฝาก">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {savedAt && !editing && <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>}
        {!editing
          ? <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ข้อมูล</button>
          : <>
              <button className="btn sm" onClick={cancel}>ยกเลิก</button>
              <button className="btn primary sm" onClick={save} disabled={overlap.size > 0}><Icon name="check" /> บันทึกข้อมูล</button>
            </>}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="money" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span><span className="dot" />
              <span>{rows.length} เงื่อนไข/ประวัติ</span>
            </div>
          </div>
          {record.enabled ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span> : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>}
        </div>
      </div>

      {editing && overlap.size > 0 && (
        <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
          <Icon name="info" size={14} />
          <span>พบช่วงวันที่มีผลซ้ำกันในช่วงยอดเงินเดียวกัน (แถวที่ไฮไลต์สีแดง) — กรุณาปรับวันที่เริ่ม/สิ้นสุดก่อนบันทึก</span>
        </div>
      )}

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">ตารางอัตราดอกเบี้ยตามช่วงยอดเงิน <span className="muted" style={{ fontWeight: 400 }}>· {rows.length} รายการ</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>คิดดอกเบี้ยตามช่วงยอดเงินคงเหลือและวันที่มีผล — ฐานคำนวณ 365 วัน · ระบบบันทึกผู้ทำรายการและตรวจช่วงวันที่ซ้ำอัตโนมัติ</div>
          </div>
          {editing && <button className="btn primary sm" onClick={addRow}><Icon name="plus" /> เพิ่มแถว</button>}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl sh-grid" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th rowSpan={2} className="center" style={{ width: 116 }}>วันที่เริ่มใช้</th>
                <th rowSpan={2} className="center" style={{ width: 116 }}>วันที่สิ้นสุด</th>
                <th colSpan={2} className="center group-col">ช่วงยอดเงิน (บาท)</th>
                <th rowSpan={2} className="center group-col" style={{ width: 110 }}>อัตรา/ปี (%)</th>
                <th rowSpan={2} className="center" style={{ width: 110 }}>วิธีคำนวณ</th>
                <th rowSpan={2} className="center" style={{ width: 70 }}>ฐานวัน</th>
                <th rowSpan={2} className="center group-col" style={{ width: 110 }}>สถานะ</th>
                <th rowSpan={2} className="group-col" style={{ width: 160 }}>ผู้บันทึก</th>
                {editing && <th rowSpan={2} className="center" style={{ width: 52 }} />}
              </tr>
              <tr><th className="center sub-col">ตั้งแต่</th><th className="center sub-col">ถึง</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={editing ? 10 : 9} className="center muted" style={{ padding: '26px 12px' }}>ยังไม่มีอัตราดอกเบี้ย — กดปุ่ม “เพิ่มแถว”</td></tr>
              )}
              {rows.map((t, i) => {
                const ap = AP[t.approve] || AP.draft;
                return (
                  <tr key={i} style={overlap.has(i) ? { background: 'var(--danger-50)' } : null}>
                    <td className="center mono">{editing
                      ? <ErpDate value={t.effectiveDate} onChange={(v) => ((e) => setRow(i, 'effectiveDate', e.target.value))({ target: { value: v } })} style={{ textAlign: 'center', maxWidth: 'none' }} className="sh-grid-input" />
                      : fmt.date(t.effectiveDate)}</td>
                    <td className="center mono">{editing
                      ? <ErpDate value={t.endDate} onChange={(v) => ((e) => setRow(i, 'endDate', e.target.value))({ target: { value: v } })} style={{ textAlign: 'center', maxWidth: 'none' }} className="sh-grid-input" />
                      : (t.endDate ? fmt.date(t.endDate) : <span className="muted">ปัจจุบัน</span>)}</td>
                    <td className="num-cell">{editing ? <input className="sh-grid-input" type="number" value={t.balFrom} onChange={(e) => setRow(i, 'balFrom', e.target.value)} /> : <span className="sh-grid-num">{fmt.money(Number(t.balFrom || 0), 0)}</span>}</td>
                    <td className="num-cell">{editing ? <input className="sh-grid-input" type="number" value={t.balTo} onChange={(e) => setRow(i, 'balTo', e.target.value)} /> : <span className="sh-grid-num">{Number(t.balTo) >= 999999999 ? 'ขึ้นไป' : fmt.money(Number(t.balTo || 0), 0)}</span>}</td>
                    <td className="num-cell">{editing ? <input className="sh-grid-input" type="number" step="0.0001" value={t.rate} onChange={(e) => setRow(i, 'rate', e.target.value)} /> : <span className="sh-grid-num"><b>{fmt.money(Number(t.rate || 0), 4)}</b></span>}</td>
                    <td className="center">{editing
                      ? <select className="cfg-input sm" style={{ minWidth: 96 }} value={t.method} onChange={(e) => setRow(i, 'method', e.target.value)}>{Object.entries(IM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                      : <span className={"pill " + (IM[t.method]?.pill || 'neutral')}>{IM[t.method]?.label}</span>}</td>
                    <td className="center mono">{t.dayBase}</td>
                    <td className="center">{editing
                      ? <select className="cfg-input sm" style={{ minWidth: 96 }} value={t.approve} onChange={(e) => setRow(i, 'approve', e.target.value)}>{Object.entries(AP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                      : <span className={"pill " + ap.pill}>{ap.label}</span>}</td>
                    <td style={{ borderLeft: '1px solid var(--divider)' }}>
                      <div style={{ fontSize: 12.5 }}>{t.user}</div>
                      <div className="muted mono" style={{ fontSize: 11 }}>{fmt.date(t.date)}</div>
                    </td>
                    {editing && <td className="center"><button className="btn danger sm" onClick={() => delRow(i)} title="ลบรายการ"><Icon name="close" size={13} /></button></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> เพิ่มแถวใหม่เพื่อเก็บประวัติอัตราที่มีผลคนละวัน — รองรับการคำนวณย้อนหลังตามวันที่เริ่มใช้ · ตรวจไม่ให้ช่วงวันที่ในช่วงยอดเดียวกันซ้ำกัน
        </div>
      </div>
    </div>
  );
}

function DepRateConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(drLoad);
  const [openId, setOpenId] = useState(null);
  const persist = (next) => { setList(next); drSaveLS(next); };
  const openRec = list.find(r => r.id === openId);
  const activeCount = list.filter(r => r.enabled).length;

  const latest = (r) => r.rates && r.rates.length ? r.rates.reduce((mx, x) => (!mx || x.effectiveDate > mx.effectiveDate) ? x : mx, null) : null;

  const handleSave = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({ action: 'update', module: 'เงินฝาก — ค่าคงที่อัตราดอกเบี้ยเงินฝาก',
      target: `${draft.code} · ${draft.name}`, summary: `แก้ไขอัตราดอกเบี้ย “${draft.name}” (${draft.rates.length} รายการ)` });
    onToast && onToast(`บันทึกอัตราดอกเบี้ย “${draft.name}” เรียบร้อยแล้ว`);
  };
  const toggle = (rec) => {
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + `ใช้งาน “${rec.name}” แล้ว`);
  };

  if (openRec) return <DrDetail record={openRec} onBack={() => setOpenId(null)} onSave={handleSave} />;

  return (
    <div data-screen-label="หน้าค่าคงที่อัตราดอกเบี้ยเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่อัตราดอกเบี้ยเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กำหนดอัตราดอกเบี้ยของแต่ละประเภทบัญชี ตามช่วงยอดเงินและวันที่มีผล พร้อมเก็บประวัติการเปลี่ยนแปลง</div>
        </div>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="money" /></div>
        <div>
          <div className="lt-ab-label">อัตราดอกเบี้ยเงินฝาก</div>
          <div className="lt-ab-name">{list.length} ประเภทบัญชี<span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span></div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>รหัส</th>
                <th style={{ minWidth: 220 }}>ประเภทบัญชี</th>
                <th className="right" style={{ width: 130 }}>อัตราล่าสุด</th>
                <th className="center" style={{ width: 130 }}>มีผลตั้งแต่</th>
                <th className="center" style={{ width: 120 }}>ขั้นบันได</th>
                <th className="center" style={{ width: 100 }}>สถานะ</th>
                <th className="center" style={{ width: 80 }}>ใช้งาน</th>
                <th className="center" style={{ width: 70 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const lr = latest(r);
                const bands = new Set(r.rates.map(x => x.balFrom + '-' + x.balTo)).size;
                return (
                  <tr key={r.id} className={"clickable" + (r.enabled ? ' selected' : '')} onClick={() => setOpenId(r.id)}>
                    <td className="mono">{r.code}</td>
                    <td><div className="lt-row-name">{r.name}</div>{r.note && <div className="lt-row-note muted">{r.note}</div>}</td>
                    <td className="right mono"><b>{lr ? fmt.money(Number(lr.rate), 4) + '%' : '—'}</b></td>
                    <td className="center mono">{lr ? fmt.date(lr.effectiveDate) : '—'}</td>
                    <td className="center">{bands > 1 ? <span className="chip info"><span className="dot-c" />{bands} ขั้น</span> : <span className="muted">อัตราเดียว</span>}</td>
                    <td className="center">{r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}</td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled} onClick={() => toggle(r)}><span className="lt-switch-knob" /></button>
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}><button className="btn ghost sm" onClick={() => setOpenId(r.id)}>เปิด <Icon name="chevRight" size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> อัตราดอกเบี้ยอ้างอิงตามรหัสประเภทบัญชี — ระบบใช้แถวที่วันที่เริ่มใช้ล่าสุดและตรงช่วงยอดเงินในการคำนวณ
      </div>
    </div>
  );
}

Object.assign(window, { DepRateConfigPage });


// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ › อัตราดอกเบี้ยเงินฝาก — ตารางอัตรา (รหัส INTD..)
//  ประเภทเงินฝากเลือกตารางนี้ที่แท็บ “กำหนดอัตรา Int./Div.”
// ════════════════════════════════════════════════════════════════════
const DIT_KEY = 'dep_int_tables_v3';
const DIT_USER = 'จันทร์เพ็ญ มาลี';
const ditToday = () => new Date().toISOString().slice(0, 10);
const DIT_MT = [{ v: 'all', l: 'ทุกประเภท' }, { v: 'regular', l: 'สมาชิกปกติ' }, { v: 'associate', l: 'สมาชิกสมทบ' },
  { v: 'ext-person', l: 'บุคคลภายนอก' }, { v: 'ext-juristic', l: 'นิติบุคคลภายนอก' }];
const DIT_SEED = [
  { code: 'INTD01', name: 'INTD01-ออมทรัพย์', note: 'อัตราดอกเบี้ยเงินฝากออมทรัพย์', enabled: true, rows: [
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 0, balTo: 50000, rate: 1.25 },
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 50000.01, balTo: 200000, rate: 1.5 },
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 200000.01, balTo: 99999999, rate: 1.75 },
    { effectiveDate: '2024-01-01', endDate: '2024-12-31', memberType: 'all', balFrom: 0, balTo: 99999999, rate: 1.5 } ] },
  { code: 'INTD02', name: 'INTD02-ออมทรัพย์พิเศษ', note: 'คิดตามช่วงยอดเงินฝาก', enabled: true, rows: [
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 0, balTo: 100000, rate: 2.5 },
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 100000.01, balTo: 500000, rate: 2.75 },
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 500000.01, balTo: 99999999, rate: 3 } ] },
  { code: 'INTD03', name: 'INTD03-ประจำ 12 เดือน', note: 'เงินฝากประจำ ยอดขั้นต่ำ 50,000 บาท', enabled: true, rows: [
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 50000, balTo: 1000000, rate: 3.1 },
    { effectiveDate: '2025-01-01', endDate: '2026-12-31', memberType: 'all', balFrom: 1000000.01, balTo: 99999999, rate: 3.25 } ] },
  { code: 'INTD04', name: 'INTD04-ออมทรัพย์พิเศษ สินเพิ่มพูน', note: '', enabled: false, rows: [] },
  { code: 'INTD05', name: 'INTD05-ประจำ 2 ปี', note: '', enabled: false, rows: [] },
];
function ditLoad() {
  try { const s = localStorage.getItem(DIT_KEY); if (s) { const v = JSON.parse(s); if (Array.isArray(v)) return v.map(t => ({ ...t, rows: (t.rows || []).map((r, i) => r.id ? r : { ...r, id: t.code + '-' + (i + 1) }) })); } } catch (e) {}
  return DIT_SEED.map(t => ({ ...t, rows: t.rows.map((r, i) => ({ ...r, id: t.code + '-' + (i + 1), user: DIT_USER, date: '2025-01-01' })),
    history: [{ ts: '2025-01-01T09:00', user: DIT_USER, action: 'create', summary: 'สร้างตารางอัตราดอกเบี้ย ' + t.code }] }));
}
function ditSave(list) { try { localStorage.setItem(DIT_KEY, JSON.stringify(list)); } catch (e) {} }
const ditNowTs = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };
const ditHist = (t, action, summary, changes) => ({ ...t, history: [{ ts: ditNowTs(), user: DIT_USER, action, summary, changes }, ...(t.history || [])] });
const ditLatest = (t) => (t.rows || []).reduce((m, r) => (!m || (r.effectiveDate || '') > m) ? r.effectiveDate : m, '');
const ditRange = (t) => {
  const rs = (t.rows || []).map(r => Number(r.rate)).filter(n => !isNaN(n));
  if (!rs.length) return '—';
  return fmt.money(Math.min(...rs), 2) + '–' + fmt.money(Math.max(...rs), 2) + '%';
};
window.depIntTables = () => ditLoad();
window.depIntTableLabel = (code) => { const t = ditLoad().find(x => x.code === code); return t ? (t.code + ' · ' + t.name.replace(new RegExp('^' + t.code + '-'), '')) : (code || '—'); };

function DitNumIn({ v, onChange, dec }) {
  return <input className="sh-grid-input mono" inputMode="decimal" style={{ textAlign: 'right' }} value={v == null ? '' : v}
                onChange={(e) => { const s = e.target.value.replace(/[^0-9.]/g, ''); onChange(s); }}
                onBlur={(e) => { const n = Number(e.target.value); if (e.target.value !== '' && !isNaN(n)) onChange(dec != null ? Number(n.toFixed(dec)) : n); }} />;
}
function DitDateIn({ v, onChange, min }) {
  if (window.ThaiDateField) return <window.ThaiDateField value={v} onChange={onChange} />;
  return <input className="sh-grid-input mono" type="date" value={v || ''} min={min} onChange={(e) => onChange(e.target.value)} />;
}

function DitDetail({ record, onBack, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record);
  const [askSave, setAskSave] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);
  const cur = editing ? draft : record;
  const rows = cur.rows || [];
  const setHdr = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setRow = (i, k, v) => setDraft(d => ({ ...d, rows: d.rows.map((r, idx) => idx === i ? { ...r, [k]: v, user: DIT_USER, date: ditToday() } : r) }));
  const addRow = () => setDraft(d => { const l = d.rows[0] || {}; return { ...d, rows: [{ id: d.code + '-N' + Date.now().toString(36), effectiveDate: ditToday(), endDate: ditToday(), memberType: 'all',
    balFrom: l.balTo && l.balTo < 99999999 ? Math.round((Number(l.balTo) + 0.01) * 100) / 100 : 0, balTo: 99999999, rate: l.rate || 1, user: DIT_USER, date: ditToday() }, ...d.rows] }; });
  const delRow = (i) => setDraft(d => ({ ...d, rows: d.rows.filter((_, idx) => idx !== i) }));
  const overlap = useMemo(() => {
    const bad = new Set();
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      if (Number(a.balFrom) !== Number(b.balFrom) || Number(a.balTo) !== Number(b.balTo)) continue;
      if ((a.effectiveDate || '') <= (b.endDate || '9999-12-31') && (b.effectiveDate || '') <= (a.endDate || '9999-12-31')) { bad.add(i); bad.add(j); }
    }
    return bad;
  }, [rows]);
  const nameErr = editing && !String(draft.name || '').trim();
  const doSave = () => {
    setAskSave(false); onSave(draft); setEditing(false);
    if (window.depSuccess) window.depSuccess({ title: 'บันทึกข้อมูลสำเร็จ', desc: 'บันทึกตารางอัตราดอกเบี้ย ' + draft.code + ' เรียบร้อยแล้ว' });
  };
  const hist = record.history || [];
  const lastAt = hist.length ? hist[0].ts : '';
  const stickyRef = (el) => {
    if (!el || el.__stk) return; el.__stk = true;
    const sc = el.closest('.main') || window;
    const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
    const topPx = (bc ? bc.offsetHeight : 0) - 16;
    el.style.top = topPx + 'px';
    const on = () => {
      const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
      el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
    };
    sc.addEventListener('scroll', on, { passive: true }); on();
  };
  return (
    <div data-screen-label="หน้ารายละเอียดอัตราดอกเบี้ยเงินฝาก" className="dit-page">
      <div className="page-actions dep-open-sticky" ref={stickyRef}>
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <Icon name="clock-circle" size={11} /> บันทึกล่าสุด: {lastAt ? fmt.date(lastAt.slice(0, 10)) + ' ' + lastAt.slice(11, 16) + ' น.' : 'ยังไม่มีการบันทึก'}
        </span>
        <button className="btn sm" data-keep-top="" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติ ({hist.length})</button>
        {!editing
          ? <button className="btn primary sm" data-keep-top="" onClick={() => { setDraft(record); setEditing(true); }}><Icon name="edit" /> แก้ไขข้อมูล</button>
          : <>
              <button className="btn sm" data-keep-top="" onClick={() => { setDraft(record); setEditing(false); }}>ละทิ้ง</button>
              <button className="btn primary sm" data-keep-top="" disabled={nameErr || overlap.size > 0} onClick={() => setAskSave(true)}><Icon name="check" /> บันทึกข้อมูล</button>
            </>}
      </div>

      <div className="search-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div className="lt-head-ico" style={{ flex: '0 0 auto' }}><Icon name="report" size={20} /></div>
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: '12px 12px' }}>
          <div>
            <label className="lt-modal-label">รหัสตาราง <span className="cfg-required">*</span></label>
            <input className="cfg-input mono" value={cur.code} readOnly disabled style={{ background: 'var(--surface-disabled, #f5f5f5)' }} />
          </div>
          <div>
            <label className="lt-modal-label">ชื่อตาราง <span className="cfg-required">*</span></label>
            <input className={'cfg-input' + (nameErr ? ' error' : '')} value={cur.name} readOnly={!editing} onChange={(e) => setHdr('name', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="lt-modal-label">หมายเหตุ</label>
            <input className="cfg-input" value={cur.note || ''} readOnly={!editing} placeholder={editing ? 'หมายเหตุประกอบ (ไม่บังคับ)' : '—'} onChange={(e) => setHdr('note', e.target.value)} />
          </div>
        </div>
      </div>

      {editing && overlap.size > 0 && (
        <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'var(--danger-border)', color: 'var(--danger)', marginTop: 12 }}>
          <Icon name="info" size={14} /><span>พบช่วงวันที่มีผลซ้ำกันในช่วงยอดเงินเดียวกัน (แถวไฮไลต์สีแดง) — ปรับวันที่ก่อนบันทึก</span>
        </div>
      )}

      <DtTableShell title={'ตารางช่วงอัตราดอกเบี้ย · ' + rows.length + ' แถว'} count={rows.length} editing={editing} onAdd={addRow} minWidth={1040}
        sub="คิดดอกเบี้ยตามช่วงยอดเงินฝาก — แต่ละแถวมีวันที่มีผลของตัวเอง · ระบบใช้แถวที่วันที่มีผลล่าสุดและตรงช่วงยอดเงินฝากของบัญชี">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 160 }}>วันที่มีผล</th>
            <th rowSpan={2} className="center group-col" style={{ width: 160 }}>วันที่สิ้นสุด</th>
            <th colSpan={2} className="center group-col">ยอดเงินฝากคงเหลือ (บาท)</th>
            <th rowSpan={2} className="center group-col" style={{ width: 130 }}>อัตรา (%)</th>
            <th rowSpan={2} className="center group-col" style={{ width: 150 }}>ผู้บันทึก</th>
            {editing && <th rowSpan={2} className="center group-col" style={{ width: 62 }}>จัดการ</th>}
          </tr>
          <tr><th className="center sub-col" style={{ width: 150 }}>ตั้งแต่</th><th className="center sub-col" style={{ width: 150 }}>ถึง</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 7 : 6} className="center muted" style={{ padding: '24px' }}>ไม่พบข้อมูล{editing ? ' — กด “เพิ่มแถว”' : ''}</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} style={editing && overlap.has(i) ? { background: 'var(--danger-50)' } : null}>
              <td className="num-cell"><DtDateCell editing={editing} v={r.effectiveDate} onChange={(v) => setRow(i, 'effectiveDate', v)} /></td>
              <td className="num-cell">{editing
                ? <DtDateCell editing v={r.endDate} onChange={(v) => setRow(i, 'endDate', v)} />
                : (r.endDate ? <span className="mono">{fmt.date(r.endDate)}</span> : <span className="muted">—</span>)}</td>
              <td className="num-cell dt-bal-cell"><DtNumCell editing={editing} v={r.balFrom} decimals={2} onChange={(v) => setRow(i, 'balFrom', v)} /></td>
              <td className="num-cell dt-bal-cell">{editing
                ? <DtNumCell editing v={r.balTo} decimals={2} onChange={(v) => setRow(i, 'balTo', v)} />
                : <span className="sh-grid-num">{fmt.money(Number(r.balTo || 0), 2)}</span>}</td>
              <td className="num-cell">{editing
                ? <DtNumCell editing v={r.rate} decimals={4} onChange={(v) => setRow(i, 'rate', v)} />
                : <span className="sh-grid-num"><b>{fmt.money(Number(r.rate || 0), 4)}</b></span>}</td>
              <td style={{ borderLeft: '1px solid var(--divider)' }}>
                <div style={{ fontSize: 12.5 }}>{r.user || '—'}</div>
                <div className="muted mono" style={{ fontSize: 11 }}>{r.date ? fmt.date(r.date) : ''}</div>
              </td>
              <DtDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </DtTableShell>

      {askSave && window.DepConfirmModal && (
        <window.DepConfirmModal title="ยืนยันการบันทึกข้อมูล" okLabel="ยืนยันบันทึก"
          lines={[['รหัสตาราง', draft.code], ['ชื่อตาราง', draft.name], ['จำนวนช่วงอัตรา', draft.rows.length + ' แถว']]}
          onOk={doSave} onClose={() => setAskSave(false)} />
      )}
      {histOpen && <DatHistoryModal record={record} title="ประวัติการเพิ่ม/แก้ไขตารางอัตราดอกเบี้ย" onClose={() => setHistOpen(false)} />}
    </div>
  );
}

function DitAddModal({ list, onClose, onCreate }) {
  const next = 'INTD' + String(list.reduce((m, t) => Math.max(m, Number((t.code.match(/^INTD(\d+)$/) || [0, 0])[1])), 0) + 1).padStart(2, '0');
  const [code, setCode] = useState(next);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return setErr('กรุณาระบุรหัสตาราง');
    if (!/^INTD/.test(c)) return setErr('รหัสตารางเงินฝากต้องขึ้นต้นด้วย INTD');
    if (!name.trim()) return setErr('กรุณาระบุชื่อตาราง');
    if (list.some(t => t.code === c)) return setErr('รหัสนี้ถูกใช้แล้ว');
    onCreate({ code: c, name: name.trim(), note: note.trim(), enabled: false, rows: [] });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มตารางอัตราดอกเบี้ย</h2>
            <div className="muted" style={{ fontSize: 11 }}>ประเภทเงินฝากเลือกตารางนี้ได้ที่แท็บกำหนดอัตรา Int./Div. เมนูประเภทเงินฝาก</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '170px minmax(0, 1fr)', gap: 12 }}>
            <div>
              <label className="lt-modal-label">รหัสตาราง <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} placeholder="INTD06" onChange={(e) => { setCode(e.target.value); setErr(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อตาราง <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} autoFocus placeholder="เช่น อัตราออมทรัพย์ 2569" onChange={(e) => { setName(e.target.value); setErr(''); }} />
            </div>
          </div>
          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" onChange={(e) => setNote(e.target.value)} />
          {err && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> สร้างตารางอัตรา</button>
          </div>
        </form>
      </div>
    </>
  );
}

function DepIntRateTablePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ditLoad);
  const [openCode, setOpenCode] = useState(null);
  const [adding, setAdding] = useState(false);
  const [tg, setTg] = useState(null);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  if (window.useBreadcrumb) window.useBreadcrumb(openCode ? [{ label: 'อัตราดอกเบี้ยเงินฝาก' }, { label: 'รายละเอียด' }] : [{ label: 'อัตราดอกเบี้ยเงินฝาก' }]);
  const persist = (n) => { setList(n); ditSave(n); };
  const open = list.find(t => t.code === openCode);
  const on = list.filter(t => t.enabled).length;
  const qn = query.trim().toLowerCase();
  const shown = qn ? list.filter(t => (t.code + ' ' + t.name + ' ' + (t.note || '')).toLowerCase().includes(qn)) : list;
  const MOD = 'เงินฝาก — ค่าคงที่อัตราดอกเบี้ยเงินฝาก';
  const create = (t) => {
    t = ditHist(t, 'create', 'สร้างตารางอัตราดอกเบี้ย ' + t.code + ' · ' + t.name);
    persist([...list, t]); setAdding(false);
    audit.log && audit.log({ action: 'create', module: MOD, target: t.code, summary: 'เพิ่มตารางอัตราดอกเบี้ย ' + t.code + ' · ' + t.name });
    if (window.depSuccess) window.depSuccess({ title: 'สร้างตารางอัตราสำเร็จ', desc: 'สร้างตาราง ' + t.code + ' แล้ว — เพิ่มช่วงอัตราและเปิดใช้งานก่อนนำไปใช้' });
    setOpenCode(t.code);
  };
  const saveRec = (d0) => {
    const old = list.find(t => t.code === d0.code) || {};
    const ch = [];
    if (old.name !== d0.name) ch.push({ field: 'ชื่อตาราง', before: old.name || '—', after: d0.name });
    if ((old.note || '') !== (d0.note || '')) ch.push({ field: 'หมายเหตุ', before: old.note || '—', after: d0.note || '—' });
    if (JSON.stringify((old.rows || []).map(r => [r.effectiveDate, r.endDate, r.balFrom, r.balTo, r.rate])) !== JSON.stringify((d0.rows || []).map(r => [r.effectiveDate, r.endDate, r.balFrom, r.balTo, r.rate])))
      ch.push({ field: 'ช่วงอัตราดอกเบี้ย', before: (old.rows || []).length + ' แถว · ' + ditRange(old), after: d0.rows.length + ' แถว · ' + ditRange(d0) });
    const d = ditHist(d0, 'update', 'แก้ไขตารางอัตราดอกเบี้ย ' + d0.code, ch);
    persist(list.map(t => t.code === d.code ? d : t)); audit.log && audit.log({ action: 'update', module: MOD, target: d.code, summary: 'แก้ไขตารางอัตราดอกเบี้ย ' + d.code + ' (' + d.rows.length + ' แถว)' }); };
  const applyTg = (arg) => {
    const { t, to } = (arg && arg.t) ? arg : tg; persist(list.map(x => x.code === t.code ? ditHist({ ...x, enabled: to }, 'update', (to ? 'เปิด' : 'ปิด') + 'ใช้งานตารางอัตรา ' + t.code,
      [{ field: 'การใช้งาน', before: to ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: to ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }]) : x));
    audit.log && audit.log({ action: 'update', module: MOD, target: t.code, summary: (to ? 'เปิด' : 'ปิด') + 'ใช้งานตารางอัตรา ' + t.code,
      changes: [{ field: 'การใช้งาน', before: to ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: to ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }] });
    setTg(null); onToast && onToast((to ? 'เปิด' : 'ปิด') + 'ใช้งาน ' + t.code + ' แล้ว');
  };
  if (open) return <DitDetail record={open} onBack={() => setOpenCode(null)} onSave={saveRec} />;
  return (
    <div data-screen-label="หน้าอัตราดอกเบี้ยเงินฝาก">
      <div className="page-actions">
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อัตราดอกเบี้ยเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>สร้างตารางอัตราดอกเบี้ย — แต่ละตารางกำหนดอัตราตามช่วงยอดเงินฝาก พร้อมเก็บประวัติการเปลี่ยนแปลง (ประเภทเงินฝากเลือกตารางนี้ได้ที่แท็บกำหนดอัตรา Int./Div. เมนูประเภทเงินฝาก)</div>
        </div>
        <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มตารางอัตรา</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="report" /></div>
        <div>
          <div className="lt-ab-label">ตารางอัตราดอกเบี้ยทั้งหมด</div>
          <div className="lt-ab-name">{list.length} ตาราง<span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {on} · ปิดใช้งาน {list.length - on}</span></div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center' }}>
          <div className="dep-input" style={{ flex: '1 1 auto', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') setQuery(q); }} placeholder="ค้นหารหัส, ชื่อ, หมายเหตุ…" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={() => setQuery(q)}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={() => { setQ(''); setQuery(''); }}>รีเซ็ต</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 960 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ width: 110 }}>รหัสตาราง</th>
              <th style={{ minWidth: 240 }}>ชื่อตาราง</th>
              <th className="center" style={{ width: 90 }}>ช่วงอัตรา</th>
              <th className="right" style={{ width: 140 }}>อัตรา (ต่ำ–สูง)</th>
              <th className="center" style={{ width: 130 }}>วันที่มีผลล่าสุด</th>
              <th className="center" style={{ width: 100 }}>สถานะ</th>
              <th className="center" style={{ width: 80 }}>ใช้งาน</th>
              <th className="center" style={{ width: 90 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={9} className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {shown.map((t, i) => (
                <tr key={t.code} className={t.enabled ? undefined : 'dat-off'}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{t.code}</td>
                  <td><div className="lt-row-name">{t.name}</div>{t.note && <div className="lt-row-note muted">{t.note}</div>}</td>
                  <td className="center mono">{(t.rows || []).length}</td>
                  <td className="right mono"><b>{ditRange(t)}</b></td>
                  <td className="center mono">{ditLatest(t) ? fmt.date(ditLatest(t)) : '—'}</td>
                  <td className="center">{t.enabled ? <span className="chip success">เปิดใช้งาน</span> : <span className="chip">ปิดใช้งาน</span>}</td>
                  <td className="center">
                    <button className={'lt-switch' + (t.enabled ? ' on' : '')} role="switch" aria-checked={t.enabled} aria-label="ใช้งาน"
                            onClick={() => window.depConfirmOff
                              ? window.depConfirmOff(!!t.enabled, t.code + ' · ' + t.name.replace(new RegExp('^' + t.code + '-'), ''), () => applyTg({ t, to: !t.enabled }),
                                  'ประเภทเงินฝากที่เลือกตารางนี้จะไม่ได้อัตราจากตารางนี้ และเลือกตารางนี้เพิ่มไม่ได้', 'ปิดการใช้งานตารางอัตรา')
                              : setTg({ t, to: !t.enabled })}><span className="lt-switch-knob" /></button>
                  </td>
                  <td className="center"><button className="btn sm ex-row-btn" onClick={() => setOpenCode(t.code)}><Icon name="eye" size={13} /> ดู</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      {adding && <DitAddModal list={list} onClose={() => setAdding(false)} onCreate={create} />}
      {tg && window.DepConfirmModal && (
        <window.DepConfirmModal title={tg.to ? 'ยืนยันเปิดใช้งานตารางอัตรา' : 'ยืนยันปิดใช้งานตารางอัตรา'} okLabel="ยืนยัน" tone={tg.to ? undefined : 'warn'}
          lines={[['รหัสตาราง', tg.t.code], ['ชื่อตาราง', tg.t.name], ['ผลกระทบ', tg.to ? 'ประเภทเงินฝากเลือกตารางนี้ได้' : 'ประเภทเงินฝากที่เลือกตารางนี้จะไม่ได้อัตราจากตารางนี้']]}
          onOk={applyTg} onClose={() => setTg(null)} />
      )}
    </div>
  );
}
Object.assign(window, { DepIntRateTablePage });
