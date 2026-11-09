// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่กำหนดวงเงินค้ำประกัน — GuaranteeLimitConfigPage
//  รายการกลุ่มการค้ำ → รายละเอียดข้อกำหนด (form + matrix tiers)
//  ระบบงานสินเชื่อ › ค่าคงที่
// ════════════════════════════════════════════════════════════════════

let _ggUidSeq = 0;
const ggUid = () => 'GG-N' + (++_ggUidSeq);
const ggToday = () => new Date().toISOString().slice(0, 10);

function ggLoad() {
  try {
    const saved = localStorage.getItem('guar_limits');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.GG_SEED.map(r => ({ ...r, tiers: r.tiers.map(t => ({ ...t })) }));
}
function ggSaveLS(list) {
  try { localStorage.setItem('guar_limits', JSON.stringify(list)); } catch (e) {}
}

// ─── form primitives (l2 classes) ───────────────────────────────────
function GgRow({ label, required, children }) {
  return (
    <div className="l2-row">
      <div className="l2-label">{label}{required && <span className="cfg-required"> *</span>}</div>
      <div className="l2-ctrl">{children}</div>
    </div>
  );
}
function GgSel({ group, v, editing, onChange }) {
  if (!editing) return <div className="l2-val">{window.ggLabel(group, v)}</div>;
  return (
    <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>
      {window.GG_OPTS[group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function GgTierCell({ editing, v, onChange, decimals }) {
  return editing
    ? <input className="sh-grid-input" type="number" value={v} onChange={(e) => onChange(e.target.value)} />
    : <span className="sh-grid-num">{decimals != null ? fmt.money(Number(v || 0), decimals) : v}</span>;
}

// ช่อง "<" + checkbox ไม่จำกัด (เก็บเป็นค่าเพดาน inf เพื่อให้คำนวณได้)
function GgToCell({ editing, v, onChange, decimals, inf }) {
  const unl = Number(v) >= inf;
  if (!editing) return <span className="sh-grid-num">{unl ? 'ไม่จำกัด' : (decimals != null ? fmt.money(Number(v || 0), decimals) : v)}</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <input className="sh-grid-input" type="number" value={unl ? '' : v} disabled={unl} placeholder={unl ? 'ไม่จำกัด' : ''}
             style={{ width: '100%', maxWidth: 'none', background: unl ? '#FAFAFA' : undefined }}
             onChange={(e) => onChange(e.target.value)} />
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <input type="checkbox" checked={unl} onChange={(e) => onChange(e.target.checked ? inf : '')} style={{ accentColor: 'var(--brand, #237450)', margin: 0 }} />
        ไม่จำกัด
      </label>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail — รายละเอียดข้อกำหนด + ตาราง Matrix
// ════════════════════════════════════════════════════════════════════
// ── driver columns available for proportional (บัญญัติไตรยางศ์) generation ──
const GG_DRIVERS = [
  { v: 'share',  l: 'ทุนเรือนหุ้น (บาท)', from: 'shareFrom',  to: 'shareTo',  decimals: 0 },
  { v: 'month',  l: 'ระยะเวลา (เดือน)',   from: 'monthFrom',  to: 'monthTo',  decimals: null },
  { v: 'salary', l: 'เงินเดือน (บาท)',     from: 'salaryFrom', to: 'salaryTo', decimals: 0 },
];

function GgDetail({ record, onBack, onSave, startEditing, onMode }) {
  const [editing, setEditing] = useState(!!startEditing);
  useEffect(() => { onMode && onMode(editing ? 'edit' : 'view'); }, [editing]);
  const [draft, setDraft] = useState(record);
  const [savedAt, setSavedAt] = useState(null);
  const [triyang, setTriyang] = useState(false);

  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel    = () => { setDraft(record); setEditing(false); };
  const save = () => { onSave(draft); setSavedAt(new Date()); setEditing(false); };

  const cur = editing ? draft : record;
  const setHdr = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const tiers = cur.tiers;
  const setTier = (i, k, v) => setDraft(d => ({ ...d, tiers: d.tiers.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));
  const addTier = () => setDraft(d => ({ ...d, tiers: [...d.tiers, { memberType: 'regular', shareFrom: 0, shareTo: 0, monthFrom: 0, monthTo: 999, salaryFrom: 0, salaryTo: 0, pctShare: 0, pctSalary: 0, maxAmount: 0 }] }));
  const delTier = (i) => setDraft(d => ({ ...d, tiers: d.tiers.filter((_, idx) => idx !== i) }));
  const appendTiers = (rows) => setDraft(d => ({ ...d, tiers: [...d.tiers, ...rows] }));

  return (
    <div data-screen-label="หน้ารายละเอียดวงเงินค้ำประกัน">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {savedAt && !editing && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อกำหนด</button>
        ) : (
          <>
            <button className="btn sm" data-discard="1" onClick={cancel}>ละทิ้ง</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกข้อกำหนด</button>
          </>
        )}
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="guarantee" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                <div>
                  <label className="lt-modal-label">รหัสกลุ่มการค้ำ <span className="cfg-required">*</span></label>
                  <input className="cfg-input mono" value={draft.code} disabled style={{ background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                </div>
                <div>
                  <label className="lt-modal-label">ชื่อกลุ่มการค้ำ <span className="cfg-required">*</span></label>
                  <input className="cfg-input" value={draft.name} onChange={(e) => setHdr('name', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="lt-modal-label">หมายเหตุ</label>
                  <input className="cfg-input" style={{ width: '100%' }} value={draft.note || ''} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                         onChange={(e) => setHdr('note', e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
                <div className="lt-head-meta">
                  <span>หมายเหตุ: {record.note || '—'}</span>
                </div>
              </>
            )}
          </div>
          {!editing && (record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>)}
        </div>
      </div>

      {/* รูปแบบการคำนวณ */}
      <div className="search-card l2-card">
        <div className="l2-gh"><span className="l2-gh-t">รูปแบบการคำนวณ</span></div>
        <div className="l2-cols">
          <div className="l2-col">
            <div className="l2-group">
              <GgRow label="การคำนวณสิทธิ"><GgSel group="calcMethod" v={cur.calcMethod} editing={editing} onChange={(v) => setHdr('calcMethod', v)} /></GgRow>
            </div>
          </div>
          <div className="l2-col">
            <div className="l2-group">
              <GgRow label="ดูระยะเวลาจาก"><GgSel group="periodRef" v={cur.periodRef} editing={editing} onChange={(v) => setHdr('periodRef', v)} /></GgRow>
            </div>
          </div>
        </div>
      </div>

      {/* ตาราง Matrix เงื่อนไขวงเงินการค้ำ */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">เงื่อนไขวงเงินการค้ำประกัน <span className="muted" style={{ fontWeight: 400 }}>· {tiers.length} ระดับ</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
              ตารางขั้นบันได (Matrix) ประเมินวงเงินค้ำสูงสุดรายบุคคล จาก ทุนเรือนหุ้น / ระยะเวลา / เงินเดือน
            </div>
          </div>
          {editing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary sm" onClick={addTier}><Icon name="plus" /> เพิ่มแถว</button>
            </div>
          )}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
          <table className="tbl sh-grid" style={{ minWidth: 1150 }}>
            <thead>
              <tr>
                <th rowSpan={2} className="center" style={{ width: 50 }}>ลำดับ</th>
                <th rowSpan={2} className="center" style={{ width: 170 }}>ประเภทสมาชิก</th>
                <th colSpan={2} className="center group-col">ทุนเรือนหุ้น (บาท)</th>
                <th colSpan={2} className="center group-col">ระยะเวลา (เดือน)</th>
                <th colSpan={2} className="center group-col">เงินเดือน</th>
                <th rowSpan={2} className="center group-col" style={{ width: 80 }}>%หุ้น</th>
                <th rowSpan={2} className="center" style={{ width: 90 }}>%เงินเดือน</th>
                <th rowSpan={2} className="center group-col" style={{ width: 140 }}>วงเงินค้ำสูงสุด</th>
                {editing && <th rowSpan={2} className="center" style={{ width: 56 }} />}
              </tr>
              <tr>
                <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
                <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
                <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
              </tr>
            </thead>
            <tbody>
              {tiers.length === 0 && (
                <tr><td colSpan={editing ? 12 : 11} className="center muted" style={{ padding: '26px 12px' }}>
                  ยังไม่มีเงื่อนไข — กดปุ่ม “เพิ่มแถว” เพื่อสร้างขั้นบันได
                </td></tr>
              )}
              {tiers.map((t, i) => (
                <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
                  <td className="center mono">{i + 1}</td>
                  <td style={{ textAlign: 'left' }}>
                    {editing
                      ? <select className="sh-grid-input" style={{ textAlign: 'left' }} value={t.memberType || 'regular'} onChange={(e) => setTier(i, 'memberType', e.target.value)}>
                          {window.LP_OPTS.memberTypeRight.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      : <span>{(window.LP_OPTS.memberTypeRight.find(o => o.v === (t.memberType || 'regular')) || {}).l}</span>}
                  </td>
                  <td className="num-cell"><GgTierCell editing={editing} v={t.shareFrom} decimals={0} onChange={(v) => setTier(i, 'shareFrom', v)} /></td>
                  <td className="num-cell"><GgToCell editing={editing} v={t.shareTo} decimals={0} inf={9999999} onChange={(v) => setTier(i, 'shareTo', v)} /></td>
                  <td className="num-cell"><GgTierCell editing={editing} v={t.monthFrom} onChange={(v) => setTier(i, 'monthFrom', v)} /></td>
                  <td className="num-cell"><GgToCell editing={editing} v={t.monthTo} inf={999} onChange={(v) => setTier(i, 'monthTo', v)} /></td>
                  <td className="num-cell"><GgTierCell editing={editing} v={t.salaryFrom} decimals={0} onChange={(v) => setTier(i, 'salaryFrom', v)} /></td>
                  <td className="num-cell"><GgToCell editing={editing} v={t.salaryTo} decimals={0} inf={999999} onChange={(v) => setTier(i, 'salaryTo', v)} /></td>
                  <td className="num-cell"><GgTierCell editing={editing} v={t.pctShare} onChange={(v) => setTier(i, 'pctShare', v)} /></td>
                  <td className="num-cell"><GgTierCell editing={editing} v={t.pctSalary} onChange={(v) => setTier(i, 'pctSalary', v)} /></td>
                  <td className="num-cell"><GgTierCell editing={editing} v={t.maxAmount} decimals={0} onChange={(v) => setTier(i, 'maxAmount', v)} /></td>
                  {editing && (
                    <td className="center">
                      <button className="btn sm act-del" onClick={() => delTier(i)} title="ลบเงื่อนไข"
                              style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)',
                                       width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}><Icon name="trash" size={13} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> วงเงินค้ำสูงสุดที่สมาชิกมีสิทธิ = ค่าที่น้อยที่สุดระหว่างผลคำนวณ %หุ้น, %เงินเดือน และเพดานในช่อง “วงเงินค้ำสูงสุด”
        </div>
      </div>

      {triyang && <GgTriyangModal onClose={() => setTriyang(false)} onApply={(rows) => { appendTiers(rows); setTriyang(false); }} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  บัญญัติไตรยางศ์ — สร้างแถวขั้นบันไดจากการเทียบสัดส่วนเชิงเส้น
//  ระบุจุดอ้างอิง 2 จุด (ค่าตัวแปร → วงเงินค้ำ) แล้วแบ่งช่วงเป็น n แถว
// ════════════════════════════════════════════════════════════════════
function GgTriyangModal({ onClose, onApply }) {
  const [driver, setDriver] = useState('salary');
  const [aVal, setAVal] = useState('');
  const [aMax, setAMax] = useState('');
  const [bVal, setBVal] = useState('');
  const [bMax, setBMax] = useState('');
  const [rows, setRows] = useState('5');
  const [pctShare, setPctShare] = useState('');
  const [pctSalary, setPctSalary] = useState('');
  const [error, setError] = useState('');

  const drv = GG_DRIVERS.find(d => d.v === driver);
  const n = Math.max(1, Math.min(50, parseInt(rows, 10) || 0));
  const a1 = parseFloat(aVal), m1 = parseFloat(aMax), a2 = parseFloat(bVal), m2 = parseFloat(bMax);
  const valid = [a1, m1, a2, m2].every(x => !isNaN(x)) && a2 !== a1;

  // สร้างพรีวิวแถว: แบ่งช่วง driver a1→a2 เป็น n แถว, วงเงินค้ำเทียบสัดส่วนเชิงเส้น (บัญญัติไตรยางศ์)
  const preview = React.useMemo(() => {
    if (!valid) return [];
    const out = [];
    const lo = Math.min(a1, a2), hi = Math.max(a1, a2);
    const step = (hi - lo) / n;
    const lerpMax = (x) => m1 + (m2 - m1) * (x - a1) / (a2 - a1);
    for (let i = 0; i < n; i++) {
      const from = lo + step * i;
      const to = i === n - 1 ? hi : lo + step * (i + 1);
      const mid = (from + to) / 2;
      out.push({
        from: Math.round(from), to: Math.round(to),
        max: Math.max(0, Math.round(lerpMax(mid))),
      });
    }
    return out;
  }, [valid, a1, m1, a2, m2, n]);

  const submit = (e) => {
    e.preventDefault();
    if (!valid) { setError('กรุณาระบุจุดอ้างอิง A และ B ให้ครบ (ค่าตัวแปรทั้งสองจุดต้องไม่เท่ากัน)'); return; }
    const ps = parseFloat(pctShare) || 0, psal = parseFloat(pctSalary) || 0;
    const tiers = preview.map(p => {
      const base = { shareFrom: 0, shareTo: 9999999, monthFrom: 0, monthTo: 999, salaryFrom: 0, salaryTo: 999999, pctShare: ps, pctSalary: psal, maxAmount: p.max };
      base[drv.from] = p.from; base[drv.to] = p.to;
      return base;
    });
    onApply(tiers);
  };

  const fmtNum = (x) => drv.decimals != null ? fmt.money(x, drv.decimals) : String(x);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="swap" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มแถวแบบบัญญัติไตรยางศ์</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างขั้นบันไดจากการเทียบสัดส่วนเชิงเส้นระหว่างจุดอ้างอิง 2 จุด</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">ตัวแปรอ้างอิง (คอลัมน์ตั้งต้น)</label>
          <select className="filter-select" style={{ width: '100%' }} value={driver} onChange={(e) => { setDriver(e.target.value); setError(''); }}>
            {GG_DRIVERS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div className="gg-anchor">
              <div className="gg-anchor-h">จุดอ้างอิง A (ต่ำสุด)</div>
              <label className="lt-modal-label">ค่า {drv.l} <span className="cfg-required">*</span></label>
              <input className="cfg-input" type="number" value={aVal} placeholder="เช่น 15000" onChange={(e) => { setAVal(e.target.value); setError(''); }} />
              <label className="lt-modal-label" style={{ marginTop: 8 }}>วงเงินค้ำ ณ จุด A (บาท) <span className="cfg-required">*</span></label>
              <input className="cfg-input" type="number" value={aMax} placeholder="เช่น 500000" onChange={(e) => { setAMax(e.target.value); setError(''); }} />
            </div>
            <div className="gg-anchor">
              <div className="gg-anchor-h">จุดอ้างอิง B (สูงสุด)</div>
              <label className="lt-modal-label">ค่า {drv.l} <span className="cfg-required">*</span></label>
              <input className="cfg-input" type="number" value={bVal} placeholder="เช่น 60000" onChange={(e) => { setBVal(e.target.value); setError(''); }} />
              <label className="lt-modal-label" style={{ marginTop: 8 }}>วงเงินค้ำ ณ จุด B (บาท) <span className="cfg-required">*</span></label>
              <input className="cfg-input" type="number" value={bMax} placeholder="เช่น 3000000" onChange={(e) => { setBMax(e.target.value); setError(''); }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label className="lt-modal-label">จำนวนแถว (ขั้น)</label>
              <input className="cfg-input" type="number" min="1" max="50" value={rows} onChange={(e) => setRows(e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">%หุ้น (ทุกแถว)</label>
              <input className="cfg-input" type="number" value={pctShare} placeholder="0" onChange={(e) => setPctShare(e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">%เงินเดือน (ทุกแถว)</label>
              <input className="cfg-input" type="number" value={pctSalary} placeholder="0" onChange={(e) => setPctSalary(e.target.value)} />
            </div>
          </div>

          {valid && (
            <div className="gg-preview">
              <div className="gg-preview-h"><Icon name="info" size={12} /> ตัวอย่างแถวที่จะเพิ่ม ({preview.length} แถว)</div>
              <div className="table-wrap" style={{ maxHeight: 190, overflow: 'auto' }}>
                <table className="tbl" style={{ minWidth: 380 }}>
                  <thead><tr>
                    <th className="center" style={{ width: 44 }}>ลำดับ</th>
                    <th className="center">{drv.l} ≥</th>
                    <th className="center">{drv.l} &lt;</th>
                    <th className="center">วงเงินค้ำสูงสุด</th>
                  </tr></thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i}>
                        <td className="center mono">{i + 1}</td>
                        <td className="num-cell mono">{fmtNum(p.from)}</td>
                        <td className="num-cell mono">{fmtNum(p.to)}</td>
                        <td className="num-cell mono">{fmt.money(p.max, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!valid}>
              <Icon name="plus" /> เพิ่ม {valid ? preview.length : ''} แถวลงตาราง
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal — รหัส + ชื่อ
// ════════════════════════════════════════════════════════════════════
function GgAddModal({ list, onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [calcMethod, setCalcMethod] = useState('2');
  const [periodRef, setPeriodRef] = useState('0');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณาระบุรหัสกลุ่มการค้ำ'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อกลุ่มการค้ำ'); return; }
    if (list.some(r => r.code === code.trim())) { setError('รหัสกลุ่มการค้ำนี้ถูกใช้แล้ว'); return; }
    onCreate({
      id: ggUid(), code: code.trim(), name: name.trim(),
      enabled: false, createdDate: ggToday(), createdBy: 'จันทร์เพ็ญ มาลี',
      note: '', calcMethod, periodRef, tiers: [],
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มกลุ่มการค้ำประกัน</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างกลุ่มสิทธิการค้ำใหม่ — ปิดใช้งานไว้จนกว่าจะเปิดสถานะ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัสกลุ่มการค้ำ <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} autoFocus placeholder="01"
                     onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อกลุ่มการค้ำ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} placeholder="เช่น GR-วงเงินค้ำสามัญ"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>การคำนวณสิทธิ</label>
          <select className="filter-select" style={{ width: '100%' }} value={calcMethod} onChange={(e) => setCalcMethod(e.target.value)}>
            {window.GG_OPTS.calcMethod.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>ดูระยะเวลาจาก</label>
          <select className="filter-select" style={{ width: '100%' }} value={periodRef} onChange={(e) => setPeriodRef(e.target.value)}>
            {window.GG_OPTS.periodRef.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> สร้างกลุ่มการค้ำ
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Toggle confirm modal
// ════════════════════════════════════════════════════════════════════
function GgToggleModal({ target, turningOn, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการใช้งานกลุ่มการค้ำ' : 'ปิดการใช้งานกลุ่มการค้ำ'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">
            {turningOn
              ? <>เปิดใช้งานกลุ่มการค้ำ <b>“{target.name}”</b> — ระบบจะนำเงื่อนไขวงเงินการค้ำของกลุ่มนี้ไปประเมินสิทธิการค้ำประกัน</>
              : <>ปิดใช้งานกลุ่มการค้ำ <b>“{target.name}”</b> — กลุ่มนี้จะไม่แสดงเป็นตัวเลือกในเมนูประเภทเงินกู้</>}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className={"btn " + (turningOn ? 'primary' : 'danger')} style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
              <Icon name="check" /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function GuaranteeLimitConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ggLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [blocked, setBlocked] = useState(null);
  // ประเภทเงินกู้ที่เลือกกลุ่มนี้ใน “กลุ่มสิทธิวงเงินการค้ำ” — นับแม้ไม่ติ๊ก “ใช้บุคคลค้ำประกันได้”
  const usedBy = (r) => window.lpTypesUsing ? window.lpTypesUsing(s => s.guarLimitGroup && s.guarLimitGroup === window.lpGuarLimitKeyOf(r)) : [];

  const persist = (next) => { setList(next); ggSaveLS(next); };
  const openRec = list.find(r => r.id === openId);
  const activeCount = list.filter(r => r.enabled).length;
  const [dMode, setDMode] = useState('view');
  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3('กำหนดวงเงินค้ำประกัน', openRec ? dMode : 'list',
      () => { setOpenId(null); setStartEditing(false); }),
    [openId, dMode]
  );

  const handleCreate = (rec) => {
    persist([rec, ...list]);
    audit.log({
      action: 'create', module: 'สินเชื่อ — ค่าคงที่กำหนดวงเงินค้ำประกัน',
      target: `${rec.code} · ${rec.name}`, summary: `เพิ่มกลุ่มการค้ำประกัน “${rec.name}”`,
      changes: [{ field: 'รหัสกลุ่มการค้ำ', before: '—', after: rec.code }],
    });
    setAdding(false);
    onToast && onToast(`สร้างกลุ่มการค้ำ “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true); setOpenId(rec.id);
  };

  const handleSaveDetail = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่กำหนดวงเงินค้ำประกัน',
      target: `${draft.code} · ${draft.name}`, summary: `แก้ไขข้อกำหนดวงเงินค้ำ “${draft.name}” (${draft.tiers.length} ระดับ)`,
    });
    onToast && onToast(`บันทึกข้อกำหนด “${draft.name}” เรียบร้อยแล้ว`);
  };

  const applyToggle = () => {
    const { rec, turningOn } = toggleTarget;
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: turningOn } : r));
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่กำหนดวงเงินค้ำประกัน',
      target: `${rec.code} · ${rec.name}`,
      summary: turningOn ? `เปิดใช้งานกลุ่มการค้ำ “${rec.name}”` : `ปิดใช้งานกลุ่มการค้ำ “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }],
    });
    onToast && onToast(turningOn ? `เปิดใช้งาน “${rec.name}” แล้ว` : `ปิดใช้งาน “${rec.name}” แล้ว`);
    setToggleTarget(null);
  };

  // ─── Detail ───────────────────────────────────────────────────────
  if (openRec) {
    return (
      <GgDetail record={openRec} startEditing={startEditing} onMode={setDMode}
                onBack={() => { setOpenId(null); setStartEditing(false); }}
                onSave={handleSaveDetail} />
    );
  }

  // ─── List ─────────────────────────────────────────────────────────
  return (
    <div data-screen-label="หน้าค่าคงที่กำหนดวงเงินค้ำประกัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่กำหนดวงเงินค้ำประกัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            สร้างและจัดหมวดหมู่กลุ่มสิทธิการค้ำประกัน — กำหนดรูปแบบการคำนวณและเงื่อนไขวงเงินค้ำแบบขั้นบันได
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}>
          <Icon name="plus" /> เพิ่มกลุ่มการค้ำ
        </button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="guarantee" /></div>
        <div>
          <div className="lt-ab-label">กลุ่มการค้ำประกันทั้งหมด</div>
          <div className="lt-ab-name">{list.length} กลุ่ม
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>รหัส</th>
                <th style={{ minWidth: 240 }}>ชื่อกลุ่มการค้ำ</th>
                <th style={{ width: 220 }}>การคำนวณสิทธิ</th>
                <th className="center" style={{ width: 90 }}>เงื่อนไข</th>
                <th className="center" style={{ width: 100 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className={"clickable" + (r.enabled ? ' selected' : '')}
                    onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                  <td className="mono">{r.code}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td>{window.ggLabel('calcMethod', r.calcMethod)}</td>
                  <td className="center mono">{r.tiers.length} ระดับ</td>
                  <td className="center">
                    {r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            onClick={() => {
                              const used = r.enabled ? usedBy(r) : [];
                              if (used.length) return setBlocked({ title: 'ปิดการใช้งานกลุ่มการค้ำ', subtitle: r.code + ' · ' + r.name,
                                detail: `ปิดใช้งานไม่ได้ — กลุ่มการค้ำ “${r.name}” ถูกใช้อยู่ใน ${used.length} ประเภทเงินกู้: ${used.join(' · ')} · กรุณาเปลี่ยนกลุ่มการค้ำของประเภทเงินกู้เหล่านี้ก่อน` });
                              setToggleTarget({ rec: r, turningOn: !r.enabled });
                            }}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn sm" onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                      <Icon name="eye" size={13} /> ดู
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> กลุ่มการค้ำประกันใช้อ้างอิงในแท็บ “หลักประกัน” ของแต่ละประเภทเงินกู้ — กำหนดสิทธิวงเงินการค้ำของผู้ค้ำประกัน
      </div>

      {adding && <GgAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
      {toggleTarget && <GgToggleModal target={toggleTarget.rec} turningOn={toggleTarget.turningOn}
                                      onClose={() => setToggleTarget(null)} onConfirm={applyToggle} />}
      {blocked && window.ConstBlockedModal && <window.ConstBlockedModal {...blocked} onClose={() => setBlocked(null)} />}
    </div>
  );
}

Object.assign(window, { GuaranteeLimitConfigPage });
