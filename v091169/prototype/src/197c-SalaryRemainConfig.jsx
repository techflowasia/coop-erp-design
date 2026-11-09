// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ — กำหนดเงินเดือนคงเหลือ (SalaryRemainConfigPage)
//  รายการเงื่อนไข → หน้ารายละเอียด (ข้อมูลเงื่อนไข + ชุดข้อมูล + ประวัติ)
//  เก็บใน master list เดียวกับ dropdown “ตรวจเงินเดือนคงเหลือ ไม่ต่ำกว่า”
//  ในแท็บทั่วไป เมนูประเภทเงินกู้ (window.lpSalaryRules)
// ════════════════════════════════════════════════════════════════════

const SR_USER = 'จันทร์เพ็ญ มาลี';
const SR_MODULE = 'สินเชื่อ — ค่าคงที่กำหนดเงินเดือนคงเหลือ';
const SR_G = '#237450';
const SR_LINE = '#f0f0f0';
const srNow = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const SR_TH = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12,
                color: 'rgba(0,0,0,.65)', borderBottom: '1px solid ' + SR_LINE, whiteSpace: 'nowrap' };
const SR_TD = { padding: '11px 12px', borderBottom: '1px solid ' + SR_LINE, verticalAlign: 'top' };
const SR_MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12.5 };
const srBtn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px',
  border: '1px solid ' + (primary ? SR_G : '#d9d9d9'), background: primary ? SR_G : '#fff',
  color: primary ? '#fff' : 'rgba(0,0,0,.65)', borderRadius: 4, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
});
const srMkSet = (o) => ({ noRange: !!(o && o.noRange), from: (o && o.from) || '', to: (o && o.to) || '',
  type: (o && o.type) || 'amount', value: (o && o.value != null) ? o.value : 0, cap: (o && o.cap != null) ? o.cap : '' });
const SR_TYPE_LABEL = { amount: 'บาท', percent: 'เปอร์เซ็นต์', min: 'ร้อยละหรือบาท แล้วแต่จำนวนใดน้อยกว่า' };
// ── ตรวจข้อมูลเงื่อนไข (ก-02 · ก-03 · ก-05) — คืน { key: ข้อความ } ──
const SR_CODE_RE = /^[A-Za-z0-9-]+$/;
function srValidateHead(code, name, list, selfV) {
  const e = {};
  const c = String(code || '').trim();
  if (!c) e.code = 'กรุณาระบุรหัสเงื่อนไข';
  else if (c.length > 20) e.code = 'รหัสเงื่อนไขต้องไม่เกิน 20 ตัวอักษร';
  else if (!SR_CODE_RE.test(c)) e.code = 'รหัสใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมาย -';
  else if (list.some(r => r.v !== selfV && String(r.code).trim() === c)) e.code = 'รหัสนี้ถูกใช้แล้ว';
  if (!String(name || '').trim()) e.l = 'กรุณาระบุชื่อเงื่อนไข';
  return e;
}
function srValidateSets(sets) {
  const e = {};
  if (!sets.length) e.sets = 'ต้องมีชุดข้อมูลอย่างน้อย 1 ชุด';
  sets.forEach((x, j) => {
    const v = Number(x.value);
    if (x.value === '' || !(v > 0)) e['v' + j] = 'ค่าขั้นต่ำต้องมากกว่า 0';
    else if ((x.type === 'percent' || x.type === 'min') && v > 100) e['v' + j] = 'ร้อยละต้องไม่เกิน 100';
    else if ((x.type === 'percent' || x.type === 'min') && !/^\d+(\.\d{1,2})?$/.test(String(x.value))) e['v' + j] = 'ร้อยละทศนิยมไม่เกิน 2 ตำแหน่ง';
    if (x.type === 'min' && !(Number(x.cap) > 0)) e['c' + j] = 'กรุณาระบุจำนวนเงินสูงสุด (บาท) ให้มากกว่า 0';
    if (!x.noRange) {
      if (x.from === '' || x.to === '') e['r' + j] = 'กรุณาระบุช่วงเลขสมาชิกให้ครบ หรือเลือก “ไม่กำหนดช่วงสมาชิก”';
      else if (Number(x.from) > Number(x.to)) e['r' + j] = 'เลขสมาชิก ตั้งแต่ ต้องไม่มากกว่า ถึง';
    }
  });
  if (sets.filter(x => x.noRange).length > 1) e.sets = 'มีชุด “ไม่กำหนดช่วงสมาชิก” ได้ไม่เกิน 1 ชุด';
  if (!e.sets) {
    const rg = sets.map((x, j) => ({ j, x })).filter(o => !o.x.noRange && o.x.from !== '' && o.x.to !== '' && !e['r' + o.j]);
    outer: for (let a = 0; a < rg.length; a++) for (let b = a + 1; b < rg.length; b++) {
      const A = rg[a].x, B = rg[b].x;
      if (Number(A.from) <= Number(B.to) && Number(B.from) <= Number(A.to)) {
        e.sets = `ช่วงเลขสมาชิกของชุดที่ ${rg[a].j + 1} และชุดที่ ${rg[b].j + 1} ซ้อนกัน`; break outer;
      }
    }
  }
  return e;
}
const SrErr = ({ msg }) => msg ? <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: 11.5, marginTop: 4, textAlign: 'left', whiteSpace: 'normal' }}>{msg}</div> : null;

// แปลง master list → เรกคอร์ดของหน้า (เติม code / enabled / sets / history)
function srNormalize(o, i) {
  let sets = o.sets && o.sets.length ? o.sets.map(srMkSet) : null;
  if (!sets) {
    const rg = (o.ranges || []).filter(x => x.from !== '' || x.to !== '');
    sets = rg.length ? rg.map(x => srMkSet({ from: x.from, to: x.to, type: o.type, value: o.value }))
                     : [srMkSet({ noRange: true, type: o.type, value: o.value })];
  }
  return { ...o, code: o.code || ('SR' + String(i + 1).padStart(2, '0')), enabled: o.enabled !== false,
           note: o.note || '', history: o.history || [], createdDate: o.createdDate || '2024-09-20 10:24',
           createdBy: o.createdBy || 'ประภาส ทองสุข', sets };
}
function srLoadAll() { return window.lpSalaryRules().map(srNormalize); }
// เก็บกลับ — คงรายการระบบ (check:false) ไว้ และคำนวณ type/value/ranges จากชุดแรก
function srSaveAll(list) {
  const clean = list.map(r => {
    const sets = (r.sets || []).map(x => ({ ...x, value: Number(x.value) || 0, cap: x.type === 'min' ? (Number(x.cap) || 0) : '', from: x.noRange ? '' : x.from, to: x.noRange ? '' : x.to }));
    const first = sets[0] || { type: 'amount', value: 0 };
    return { ...r, type: first.type, value: first.value, sets, ranges: sets.filter(x => !x.noRange).map(x => ({ from: x.from, to: x.to })) };
  });
  window.lpSalaryRulesSave(clean);
}
const srPct = (v) => fmt.money(Number(v) || 0, 2).replace(/\.00$/, '') + '%';
const srSetText = (x) => (x.type === 'percent' ? srPct(x.value)
    : x.type === 'min' ? srPct(x.value) + ' / สูงสุด ' + fmt.money(Number(x.cap) || 0, 0) + ' บาท'
    : '฿' + fmt.money(Number(x.value) || 0, 0))
  + (x.noRange ? '' : ` (${x.from}–${x.to})`);

const srSelStyle = { maxWidth: 'none', width: '100%', textAlign: 'left', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
  padding: '0 24px 0 8px', fontFamily: 'inherit',
  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%238C8C8C' stroke-width='1.5'><path d='m3 5 3 3 3-3'/></svg>\")",
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' };
const srTrash = (onClick, title, disabled) => (
  <button className="btn act-del" onClick={onClick} title={title} disabled={disabled}
          style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)', opacity: disabled ? .4 : 1,
                   width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}>
    <Icon name="trash" size={13} />
  </button>
);

// ════════════════════════════════════════════════════════════════════
//  Detail
// ════════════════════════════════════════════════════════════════════
function SrDetail({ record, list, onBack, onSave, startEditing, onHistory }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [draft, setDraft] = useState(record);
  const [err, setErr] = useState('');
  const [errs, setErrs] = useState({});
  const [askUsed, setAskUsed] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const cur = editing ? draft : record;
  const usedBy = window.lpSalaryRuleUsedBy ? window.lpSalaryRuleUsedBy(record.v) : [];
  const setHdr = (k, v) => { setErr(''); setErrs(e => ({ ...e, [k]: '' })); setDraft(d => ({ ...d, [k]: v })); };
  const setSet = (j, k, v) => { setErr(''); setErrs({}); setDraft(d => ({ ...d, sets: d.sets.map((x, jj) => {
    if (jj !== j) return x;
    const n = { ...x, [k]: v };
    if (k === 'type' && v !== 'min') n.cap = '';   // ล้างช่องที่ไม่ใช้
    return n;
  }) })); };
  const addSet = () => setDraft(d => ({ ...d, sets: [...d.sets, srMkSet()] }));
  const delSet = (j) => setDraft(d => ({ ...d, sets: d.sets.filter((_, jj) => jj !== j) }));
  const startEdit = () => { setDraft(record); setErr(''); setErrs({}); setEditing(true); };
  const cancel = () => { setDraft(record); setErr(''); setErrs({}); setEditing(false); };
  const commit = () => { setAskUsed(false); onSave({ ...draft, code: draft.code.trim(), l: draft.l.trim() }); setSavedAt(new Date()); setEditing(false); };
  const save = () => {
    const e = { ...srValidateHead(draft.code, draft.l, list || [], record.v), ...srValidateSets(draft.sets) };
    setErrs(e);
    if (Object.keys(e).length) return setErr(e.sets || 'กรุณาตรวจสอบข้อมูลที่ระบุ');
    // ก-02 ข้อ 7 — แก้ชื่อหรือชุดข้อมูลของเงื่อนไขที่ประเภทเงินกู้ใช้อยู่ → ถามก่อน
    const setsChanged = JSON.stringify(record.sets) !== JSON.stringify(draft.sets);
    if (usedBy.length && (setsChanged || String(record.l).trim() !== String(draft.l).trim())) return setAskUsed(true);
    commit();
  };
  const badge = window.savedBadgeLabel && window.savedBadgeLabel(
    savedAt ? savedAt.toISOString().slice(0, 16).replace('T', ' ') : String(((record.history || [])[0] || {}).ts || record.createdDate));

  return (
    <div data-screen-label="หน้ารายละเอียดกำหนดเงินเดือนคงเหลือ">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {!editing && badge && <span className="saved-badge">{badge}</span>}
        {!editing && <button className="btn sm" onClick={onHistory}><Icon name="history" /> ประวัติ</button>}
        {!editing
          ? <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อมูล</button>
          : <>
              <button className="btn sm" data-discard="1" onClick={cancel}>ละทิ้ง</button>
              <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกข้อมูล</button>
            </>}
      </div>

      <div className="search-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div className="lt-head-ico"><Icon name="report" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label className="lt-modal-label">รหัสเงื่อนไข <span className="cfg-required">*</span></label>
                    <input className="cfg-input mono" value={draft.code} disabled style={{ width: '100%', background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                    <SrErr msg={errs.code} />
                  </div>
                  <div>
                    <label className="lt-modal-label">ชื่อเงื่อนไข <span className="cfg-required">*</span></label>
                    <input className="cfg-input" style={{ width: '100%' }} value={draft.l} placeholder="เช่น ไม่ต่ำกว่า 3,000 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า 30%"
                           onChange={(e) => setHdr('l', e.target.value)} />
                    <SrErr msg={errs.l} />
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label className="lt-modal-label">หมายเหตุ</label>
                  <input className="cfg-input" style={{ width: '100%' }} value={draft.note || ''} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                         onChange={(e) => setHdr('note', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.l}</h1>
                <div className="lt-head-meta">{record.note && <span>หมายเหตุ: {record.note}</span>}</div>
              </>
            )}
          </div>
          {!editing && (record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>)}
        </div>
        {err && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {err}</div>}
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">ชุดข้อมูลเงินเดือนคงเหลือ <span className="muted" style={{ fontWeight: 400 }}>· {cur.sets.length} ชุด</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>แต่ละชุดกำหนดช่วงเลขสมาชิก + ประเภท (บาท / เปอร์เซ็นต์) + ค่าขั้นต่ำ · ช่วงเลขสมาชิกห้ามซ้อนกัน</div>
          </div>
          {editing && <button className="btn primary sm" onClick={addSet}><Icon name="plus" /> เพิ่มแถว</button>}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl sh-grid" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 64 }}>ลำดับที่</th>
                <th className="center">ช่วงเลขสมาชิก (ตั้งแต่ – ถึง)</th>
                <th className="center" style={{ width: 200 }}>ประเภท</th>
                <th className="center" style={{ width: 200 }}>ค่า</th>
                {editing && <th className="center" style={{ width: 52 }} />}
              </tr>
            </thead>
            <tbody>
              {cur.sets.map((x, j) => (
                <tr key={j} style={{ verticalAlign: 'top' }}>
                  <td className="center mono muted" style={editing ? { paddingTop: 12 } : undefined}>{j + 1}</td>
                  <td className={editing ? undefined : 'center mono'}>
                    {editing ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 6, alignItems: 'center' }}>
                          <input className="sh-grid-input mono" disabled={x.noRange} placeholder="ตั้งแต่"
                                 style={{ maxWidth: 'none', width: '100%', textAlign: 'center', background: x.noRange ? '#fafafa' : '#fff' }}
                                 value={x.noRange ? '' : x.from} onChange={(e) => setSet(j, 'from', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                          <span className="muted">–</span>
                          <input className="sh-grid-input mono" disabled={x.noRange} placeholder="ถึง"
                                 style={{ maxWidth: 'none', width: '100%', textAlign: 'center', background: x.noRange ? '#fafafa' : '#fff' }}
                                 value={x.noRange ? '' : x.to} onChange={(e) => setSet(j, 'to', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                        </div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, cursor: 'pointer', color: 'rgba(0,0,0,.65)' }}>
                          <input type="checkbox" className="ct-check" checked={x.noRange} onChange={(e) => setSet(j, 'noRange', e.target.checked)} />
                          ไม่กำหนดช่วงสมาชิก
                        </label>
                        <SrErr msg={errs['r' + j]} />
                      </>
                    ) : (x.noRange ? <span className="muted" style={{ fontFamily: 'inherit' }}>ทุกเลขสมาชิก</span> : `${x.from} – ${x.to}`)}
                  </td>
                  <td className="center">
                    {editing
                      ? <select className="sh-grid-input" value={x.type} onChange={(e) => setSet(j, 'type', e.target.value)} style={srSelStyle}>
                          <option value="amount">บาท</option>
                          <option value="percent">เปอร์เซ็นต์</option>
                          {x.type === 'min' && <option value="min" disabled>ร้อยละหรือบาท แล้วแต่จำนวนใดน้อยกว่า (เลิกใช้)</option>}
                        </select>
                      : (SR_TYPE_LABEL[x.type] || 'บาท')}
                  </td>
                  <td className="num-cell">
                    {editing
                      ? (x.type === 'min'
                        ? <div style={{ display: 'grid', gap: 6 }}>
                            <label style={{ display: 'grid', gridTemplateColumns: '68px minmax(0,1fr)', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(0,0,0,.65)' }}>ร้อยละ
                              <input className="sh-grid-input" style={{ width: '100%', maxWidth: 'none' }} type="number" step="0.01" value={x.value} onChange={(e) => setSet(j, 'value', e.target.value)} /></label>
                            <SrErr msg={errs['v' + j]} />
                            <label style={{ display: 'grid', gridTemplateColumns: '68px minmax(0,1fr)', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(0,0,0,.65)' }}>สูงสุด (บาท)
                              <input className="sh-grid-input" style={{ width: '100%', maxWidth: 'none' }} type="number" value={x.cap} onChange={(e) => setSet(j, 'cap', e.target.value)} /></label>
                            <SrErr msg={errs['c' + j]} />
                          </div>
                        : <><input className="sh-grid-input" style={{ width: '100%', maxWidth: 'none' }} type="number" step={x.type === 'percent' ? '0.01' : '1'} value={x.value} onChange={(e) => setSet(j, 'value', e.target.value)} />
                            <SrErr msg={errs['v' + j]} /></>)
                      : <span className="sh-grid-num" style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                          {x.type === 'min' ? srSetText({ ...x, noRange: true }) : fmt.money(Number(x.value) || 0, x.type === 'percent' ? 2 : 0)}
                        </span>}
                  </td>
                  {editing && <td className="center">{srTrash(() => delSet(j), 'ลบชุดข้อมูล', cur.sets.length <= 1)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> ตอนตรวจคำขอกู้ ระบบใช้ชุดที่ช่วงเลขสมาชิกตรงกับผู้กู้ก่อน หากไม่ตรงจะใช้ชุด “ไม่กำหนดช่วงสมาชิก” · ถ้าไม่มีชุดที่ตรงและไม่มีชุด “ไม่กำหนดช่วงสมาชิก” ระบบจะไม่ตรวจเงินเดือนคงเหลือ
        </div>
      </div>
      {askUsed && window.ToggleConfirmModal && (
        <window.ToggleConfirmModal next title="ยืนยันแก้ไขเงื่อนไข" subtitle={record.code + ' · ' + record.l}
          detail={`ชุดนี้ใช้กับ ${usedBy.length} ประเภทเงินกู้ ยืนยันแก้ไข?\n${usedBy.join(' · ')}`}
          onCancel={() => setAskUsed(false)} onConfirm={commit} />
      )}

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal
// ════════════════════════════════════════════════════════════════════
function SrAddModal({ list, onClose, onCreate }) {
  const code0 = 'SR' + String(list.length + 1).padStart(2, '0');
  const [code, setCode] = useState(code0);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [errs, setErrs] = useState({});
  const [askDiscard, setAskDiscard] = useState(false);
  const dirty = code !== code0 || name.trim() !== '' || note.trim() !== '';
  const tryClose = () => (dirty ? setAskDiscard(true) : onClose());
  const submit = (e) => {
    e.preventDefault();
    const er = srValidateHead(code, name, list, null);
    setErrs(er);
    if (Object.keys(er).length) return;
    onCreate({ v: 'r' + Date.now().toString(36), code: code.trim(), l: name.trim(), note: note.trim(), check: true,
               enabled: false, createdDate: srNow(), createdBy: SR_USER, history: [], sets: [srMkSet({ noRange: true })] });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={tryClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มเงื่อนไขเงินเดือนคงเหลือ</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกใช้กับประเภทเงินกู้ได้ที่แท็บทั่วไป เมนูประเภทเงินกู้</div>
          </div>
          <button className="close-btn" onClick={tryClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 150px' }}>
              <label className="lt-modal-label">รหัสเงื่อนไข <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" style={{ width: '100%' }} value={code} onChange={(e) => { setCode(e.target.value); setErrs(x => ({ ...x, code: '' })); }} />
              <SrErr msg={errs.code} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="lt-modal-label">ชื่อเงื่อนไข <span className="cfg-required">*</span></label>
              <input className="cfg-input" style={{ width: '100%' }} value={name} placeholder="เช่น ไม่ต่ำกว่า 30%"
                     onChange={(e) => { setName(e.target.value); setErrs(x => ({ ...x, l: '' })); }} />
              <SrErr msg={errs.l} />
            </div>
          </div>
          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" style={{ width: '100%' }} value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" onChange={(e) => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={tryClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> สร้างเงื่อนไข</button>
          </div>
        </form>
      </div>
      {askDiscard && window.LpDiscardModal && <window.LpDiscardModal onKeep={() => setAskDiscard(false)} onDiscard={onClose} />}
    </>
  );
}

function SrToggleModal({ target, turningOn, usedBy, onClose, onConfirm }) {
  const blocked = !turningOn && usedBy.length > 0;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : blocked ? { background: 'var(--danger-50, #fff1f0)', color: 'var(--danger, #ff4d4f)' } : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการใช้งานเงื่อนไข' : 'ปิดการใช้งานเงื่อนไข'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.l}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">
            {blocked
              ? <>ปิดใช้งานไม่ได้ — เงื่อนไข <b>“{target.l}”</b> ถูกใช้อยู่ใน {usedBy.length} ประเภทเงินกู้: {usedBy.join(' · ')}</>
              : turningOn
                ? <>เปิดใช้งานเงื่อนไข <b>“{target.l}”</b> — จะปรากฏเป็นตัวเลือก “ตรวจเงินเดือนคงเหลือ ไม่ต่ำกว่า” ในเมนูประเภทเงินกู้</>
                : <>ปิดใช้งานเงื่อนไข <b>“{target.l}”</b> — จะ<b>ไม่ปรากฏเป็นตัวเลือก</b>ในเมนูประเภทเงินกู้</>}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>{blocked ? 'ปิด' : 'ยกเลิก'}</button>
            {!blocked && (
              <button className={"btn " + (turningOn ? 'primary' : 'danger')} style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
                <Icon name="check" /> ยืนยัน
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function SalaryRemainConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [all, setAll] = useState(srLoadAll);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [hist, setHist] = useState(null);
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');

  const list = all.filter(r => r.check !== false);   // ไม่แสดงตัวเลือกระบบ “ไม่เช็คเงินเดือนคงเหลือ”
  const persist = (next) => { setAll(next); srSaveAll(next); };
  const openRec = list.find(r => r.v === openId);
  const activeCount = list.filter(r => r.enabled).length;

  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3 ? window.crumb3('กำหนดเงินเดือนคงเหลือ', openRec ? 'view' : 'list', () => setOpenId(null)) : null,
    [openId]
  );

  const filtered = React.useMemo(() => {
    const k = applied.trim().toLowerCase();
    if (!k) return list;
    return list.filter(r => [r.code, r.l, r.note].filter(Boolean).some(x => String(x).toLowerCase().indexOf(k) >= 0));
  }, [all, applied]);

  const handleCreate = (rec) => {
    const changes = [{ field: 'รหัสเงื่อนไข', before: '—', after: rec.code }];
    const entry = { ts: srNow(), user: SR_USER, action: 'create', summary: `สร้างเงื่อนไข “${rec.l}”`, changes };
    const sysIdx = all.findIndex(r => r.check === false);
    const next = all.slice();
    next.splice(sysIdx >= 0 ? sysIdx : next.length, 0, { ...rec, history: [entry] });
    persist(next);
    audit.log({ action: 'create', module: SR_MODULE, target: `${rec.code} · ${rec.l}`, summary: `เพิ่มเงื่อนไขเงินเดือนคงเหลือ “${rec.l}”`, changes });
    setAdding(false);
    onToast && onToast(`สร้างเงื่อนไข “${rec.l}” เรียบร้อยแล้ว`);
    setStartEditing(true); setOpenId(rec.v);
  };

  const handleSave = (draft) => {
    const before = all.find(r => r.v === draft.v) || {};
    const changes = [];
    if (before.code !== draft.code) changes.push({ field: 'รหัสเงื่อนไข', before: before.code, after: draft.code });
    if (before.l !== draft.l) changes.push({ field: 'ชื่อเงื่อนไข', before: before.l, after: draft.l });
    const bs = (before.sets || []).map(srSetText).join(', '), ds = draft.sets.map(srSetText).join(', ');
    if (bs !== ds) changes.push({ field: 'ชุดข้อมูล', before: bs || '—', after: ds });
    const summary = changes.length ? changes.map(c => `${c.field}: ${c.before} → ${c.after}`).join(' · ') : 'บันทึกเงื่อนไข (ไม่มีการเปลี่ยนแปลง)';
    const entry = { ts: srNow(), user: SR_USER, action: 'update', summary, changes };
    persist(all.map(r => r.v === draft.v ? { ...draft, history: [entry, ...(r.history || [])] } : r));
    audit.log({ action: 'update', module: SR_MODULE, target: `${draft.code} · ${draft.l}`, summary, changes });
    onToast && onToast(`บันทึกเงื่อนไข “${draft.l}” เรียบร้อยแล้ว`);
  };

  const applyToggle = () => {
    const { rec, turningOn } = toggleTarget;
    // ก-06 — ตรวจซ้ำตอนกดยืนยัน: ถ้ามีประเภทเงินกู้ใช้อยู่ ไม่บันทึก
    if (!turningOn && window.lpSalaryRuleUsedBy && window.lpSalaryRuleUsedBy(rec.v).length) { setToggleTarget(null); return; }
    const changes = [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }];
    const entry = { ts: srNow(), user: SR_USER, action: 'toggle', summary: turningOn ? 'เปิดใช้งานเงื่อนไข' : 'ปิดใช้งานเงื่อนไข', changes };
    persist(all.map(r => r.v === rec.v ? { ...r, enabled: turningOn, history: [entry, ...(r.history || [])] } : r));
    audit.log({ action: 'update', module: SR_MODULE, target: `${rec.code} · ${rec.l}`,
                summary: (turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + `เงื่อนไข “${rec.l}”`, changes });
    onToast && onToast(turningOn ? `เปิดใช้งาน “${rec.l}” แล้ว` : `ปิดใช้งาน “${rec.l}” แล้ว`);
    setToggleTarget(null);
  };

  if (openRec) {
    return (
      <>
        <SrDetail record={openRec} list={list} startEditing={startEditing}
                  onBack={() => { setOpenId(null); setStartEditing(false); }}
                  onSave={handleSave}
                  onHistory={() => setHist({ title: 'ประวัติ', subtitle: openRec.code + ' · ' + openRec.l, entries: openRec.history || [] })} />
        {hist && window.LpjHistoryModal && <window.LpjHistoryModal {...hist} onClose={() => setHist(null)} />}
      </>
    );
  }

  return (
    <div data-screen-label="หน้าค่าคงที่กำหนดเงินเดือนคงเหลือ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดเงินเดือนคงเหลือ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            สร้างเงื่อนไขเงินเดือนคงเหลือขั้นต่ำ — 1 เงื่อนไขมีได้หลายชุด (ช่วงเลขสมาชิก + ประเภท + ค่า) ใช้ร่วมกันทุกประเภทเงินกู้ (เลือกใช้ที่แท็บทั่วไป เมนูประเภทเงินกู้)
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มเงื่อนไข</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="report" /></div>
        <div>
          <div className="lt-ab-label">เงื่อนไขเงินเดือนคงเหลือทั้งหมด</div>
          <div className="lt-ab-name">{list.length} เงื่อนไข
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '14px 16px 12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff',
                          border: '1px solid #d9d9d9', borderRadius: 2, minWidth: 300, flex: '0 1 340px' }}>
            <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.35)' }}><Icon name="search" size={14} /></span>
            <input value={q} placeholder="ค้นหารหัส, ชื่อเงื่อนไข..." onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') setApplied(q); }}
                   style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent' }} />
          </label>
          <button type="button" style={srBtn(true)} onClick={() => setApplied(q)}>ค้นหา</button>
          <button type="button" style={srBtn(false)} onClick={() => { setQ(''); setApplied(''); }}>รีเซ็ต</button>
        </div>

        <div style={{ padding: '4px 16px 0', borderTop: '1px solid ' + SR_LINE }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ ...SR_TH, width: 100 }}>รหัส</th>
                  <th style={{ ...SR_TH, minWidth: 240 }}>ชื่อเงื่อนไข</th>
                  <th style={{ ...SR_TH, minWidth: 200 }}>ค่าขั้นต่ำ (ช่วงเลขสมาชิก)</th>
                  <th style={{ ...SR_TH, width: 110, textAlign: 'center' }}>ประเภทเงินกู้ที่ใช้</th>
                  <th style={{ ...SR_TH, width: 108, textAlign: 'center' }}>สถานะ</th>
                  <th style={{ ...SR_TH, width: 70, textAlign: 'center' }}>ใช้งาน</th>
                  <th style={{ ...SR_TH, width: 76, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const used = window.lpSalaryRuleUsedBy ? window.lpSalaryRuleUsedBy(r.v).length : 0;
                  return (
                    <tr key={r.v} style={r.enabled ? undefined : { background: '#fafafa', opacity: .72 }}>
                      <td style={{ ...SR_TD, ...SR_MONO, color: 'rgba(0,0,0,.65)' }}>{r.code}</td>
                      <td style={SR_TD}>
                        <span style={{ display: 'block', fontWeight: 600 }}>{r.l}</span>
                        {r.note && <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3 }}>{r.note}</span>}
                      </td>
                      <td style={{ ...SR_TD, ...SR_MONO }}>
                        {r.sets.map((x, j) => <span key={j} style={{ display: 'block' }}>{srSetText(x)}</span>)}
                      </td>
                      <td style={{ ...SR_TD, ...SR_MONO, textAlign: 'center' }}>{used || <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}</td>
                      <td style={{ ...SR_TD, textAlign: 'center' }}>
                        <span className={'pill ' + (r.enabled ? 'ok' : 'neutral')}>{r.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
                      </td>
                      <td style={{ ...SR_TD, textAlign: 'center' }}>
                        <button type="button" role="switch" aria-checked={!!r.enabled} aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                onClick={() => setToggleTarget({ rec: r, turningOn: !r.enabled })}
                                style={{ position: 'relative', width: 44, height: 22, border: 'none', borderRadius: 9999, cursor: 'pointer', padding: 0,
                                         transition: 'background .18s', background: r.enabled ? SR_G : 'rgba(0,0,0,.25)' }}>
                          <span style={{ position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18, borderRadius: 9999,
                                         background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
                        </button>
                      </td>
                      <td style={{ ...SR_TD, textAlign: 'center' }}>
                        <button type="button" onClick={() => { setStartEditing(false); setOpenId(r.v); }} title="ดูรายละเอียดเงื่อนไข"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', border: '1px solid #d9d9d9',
                                         background: '#fff', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer' }}>
                          <Icon name="eye" size={14} /> ดู
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ ...SR_TD, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 0', borderTop: '1px solid ' + SR_LINE, fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
            {filtered.length} รายการ
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เงื่อนไขที่เปิดใช้งานจะปรากฏเป็นตัวเลือก “ตรวจเงินเดือนคงเหลือ ไม่ต่ำกว่า” ในแท็บทั่วไป เมนูประเภทเงินกู้
      </div>

      {adding && <SrAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
      {toggleTarget && <SrToggleModal target={toggleTarget.rec} turningOn={toggleTarget.turningOn}
                                      usedBy={window.lpSalaryRuleUsedBy ? window.lpSalaryRuleUsedBy(toggleTarget.rec.v) : []}
                                      onClose={() => setToggleTarget(null)} onConfirm={applyToggle} />}
    </div>
  );
}

Object.assign(window, { SalaryRemainConfigPage });
