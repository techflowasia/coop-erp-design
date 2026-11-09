// ════════════════════════════════════════════════════════════════════
//  ข้อกำหนดประเภทเงินกู้ — 7 แท็บ + form/table primitives
//  ทั่วไป · วงเงินกู้ · ดอกเบี้ย · หลักประกัน · หักชำระ · งวดชำระ · จำกัดกู้
// ════════════════════════════════════════════════════════════════════

// ─── Dense two-column form primitives (view/edit aware) ──────────────
function LpGroup({ title, action, children }) {
  return (
    <div className="l2-group">
      <div className="l2-gh"><span className="l2-gh-t">{title}</span>{action}</div>
      {children}
    </div>
  );
}
function LpRow({ label, hint, indent, stack, children }) {
  return (
    <div className={"l2-row" + (indent ? ' indent' : '') + (stack ? ' stack' : '')}>
      <div className="l2-label">{label}
        {hint && <div className="muted" style={{ fontSize: 10.5, fontWeight: 400, lineHeight: 1.45, marginTop: 2 }}>({hint})</div>}
      </div>
      <div className="l2-ctrl">{children}</div>
    </div>
  );
}
function LpNum({ v, editing, onChange, decimals, suffix, disabled }) {
  if (!editing || disabled) {
    return (
      <div className={"l2-val num" + (disabled ? ' dis-val' : '')}>
        {v === '' || v == null ? '—' : (decimals != null ? fmt.money(Number(v || 0), decimals) : v)}
        {suffix ? <span className="l2-suf"> {suffix}</span> : null}
      </div>
    );
  }
  return (
    <div className="l2-inwrap">
      <input className="l2-input num" type="number" inputMode="decimal"
             step={decimals ? '0.01' : '1'} value={v}
             onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="l2-suf">{suffix}</span>}
    </div>
  );
}
function LpSel({ group, v, editing, onChange }) {
  const isRate = group === 'rateTable';
  const isLimitGroup = group === 'limitGroup';
  const opts = isRate ? window.irTableOptions(v) : (isLimitGroup ? window.lgOptions(v) : window.LP_OPTS[group]);
  const label = isRate ? window.irTableLabel(v)
    : (isLimitGroup ? ((window.lgFind(v) || {}).name || window.lpLabel(group, v)) : window.lpLabel(group, v));
  if (!editing) return <div className="l2-val">{label}</div>;
  return (
    <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function LpTxt({ v, editing, onChange, center, right, placeholder, mono }) {
  const al = right ? { textAlign: 'right' } : undefined;
  if (!editing) return <div className={"l2-val" + (mono ? ' mono' : '') + (center ? ' center' : '')} style={al}>{v || '—'}</div>;
  return (
    <input className={"l2-input" + (mono ? ' mono' : '') + (center ? ' center' : '')} value={v || ''} style={al}
           placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}
function LpDis({ v }) {
  return <div className="l2-input dis" title="ระบบกำหนดอัตโนมัติ — แก้ไขไม่ได้">{v || '—'}</div>;
}
// checkbox row (full-width clickable label)
function LpCheckItem({ label, checked, editing, onChange }) {
  return (
    <label className={"l2-check lp-check-item" + (editing ? '' : ' ro')}>
      <input type="checkbox" className="ct-check" checked={!!checked} disabled={!editing}
             onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
// radio row (เลือกได้ 1 ตัวเลือกในกลุ่ม)
function LpRadioItem({ name, label, value, checked, editing, onChange }) {
  return (
    <label className={"l2-check lp-check-item" + (editing ? '' : ' ro')}>
      <input type="radio" name={name} className="ct-check" checked={checked} disabled={!editing}
             onChange={() => onChange(value)} />
      <span>{label}</span>
    </label>
  );
}
// checkbox + numeric (เช่น ตรวจเงินเดือนคงเหลือ)
function LpCheckNum({ label, on, v, suffix, editing, selGroup, selVal, onToggle, onValue, onSel, keepValue }) {
  return (
    <div className="l2-row">
      <div className="l2-label">
        <label className="l2-check">
          <input type="checkbox" className="ct-check" checked={!!on} disabled={!editing}
                 onChange={(e) => onToggle(e.target.checked)} />
          <span>{label}</span>
        </label>
      </div>
      <div className="l2-ctrl">
        <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
          {selGroup && (
            editing
              ? <select className="l2-select" style={{ maxWidth: 140 }} value={selVal} disabled={!on}
                        onChange={(e) => onSel(e.target.value)}>
                  {window.LP_OPTS[selGroup].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              : <span className="l2-suf">{window.lpLabel(selGroup, selVal)}</span>
          )}
          {editing
            ? <input className="l2-input num" type="number" style={{ maxWidth: 100, background: on ? undefined : '#f5f5f5', color: on ? undefined : 'rgba(0,0,0,.35)' }} disabled={!on}
                     value={v} onChange={(e) => onValue(e.target.value)} />
            : <span className="l2-val num" style={{ width: 'auto', color: on ? undefined : 'rgba(0,0,0,.35)' }}>{on || keepValue ? v : '—'}</span>}
          {suffix && <span className="l2-suf">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Table primitives ────────────────────────────────────────────────
function LpTableShell({ title, sub, count, editing, onAdd, addLabel, children, minWidth }) {
  return (
    <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
      <div className="sh-grid-head">
        <div>
          <div className="sh-grid-title">{title}{count != null && <span className="muted" style={{ fontWeight: 400 }}> · {count} แถว</span>}</div>
          {sub && <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{sub}</div>}
        </div>
        {editing && onAdd && (
          <button className="btn primary sm" onClick={onAdd}><Icon name="plus" /> {addLabel || 'เพิ่มแถว'}</button>
        )}
      </div>
      <div className="table-wrap" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
        <table className="tbl sh-grid" style={{ minWidth: minWidth || 760 }}>{children}</table>
      </div>
    </div>
  );
}
function lpPurposeList() {
  let l = null;
  try { const s = localStorage.getItem('loan_purpose_const_v2'); if (s) l = JSON.parse(s); } catch (e) {}
  if (!l) l = window.lpuLoad ? window.lpuLoad() : [];
  return (l || []).filter(p => p.active !== false);
}
function LpPurposeCell({ editing, v, onChange }) {
  const list = lpPurposeList();
  const hit = list.find(p => p.code === v || p.name === v);
  if (!editing) return <span>{hit ? hit.name : (v || '—')}</span>;
  return (
    <select className="sh-grid-input" style={{ maxWidth: 'none', width: '100%', textAlign: 'left', textAlignLast: 'left' }} value={hit ? hit.code : ''}
            onChange={(e) => onChange(e.target.value)}>
      <option value="">— เลือกวัตถุประสงค์ —</option>
      {list.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
    </select>
  );
}
function LpTxtCell({ editing, v, onChange, align }) {
  return editing
    ? <input className="sh-grid-input" style={{ textAlign: align || 'left', maxWidth: 'none' }} value={v || ''}
             onChange={(e) => onChange(e.target.value)} />
    : <span style={{ display: 'block', textAlign: align || 'left' }}>{v || <span className="muted">—</span>}</span>;
}
function LpNumCell({ editing, v, onChange, decimals, full }) {
  return editing
    ? <input className="sh-grid-input" type="number" value={v} style={full ? { maxWidth: 'none', width: '100%' } : undefined} onChange={(e) => onChange(e.target.value)} />
    : <span className="sh-grid-num">{decimals != null ? fmt.money(Number(v || 0), decimals) : (v ?? '—')}</span>;
}
// ช่องค่าสูงสุด + checkbox "ไม่จำกัด" (เก็บเป็นค่าเพดาน inf เพื่อให้คำนวณได้)
function LpUnlCell({ editing, v, onChange, inf, decimals, text, center, inline }) {
  const unl = v !== '' && v != null && Number(v) >= Number(inf);
  const align = center ? 'center' : 'right';
  if (!editing) {
    if (unl) return <span className="sh-grid-num" style={{ display: 'block', textAlign: align }}>ไม่จำกัด</span>;
    return text ? <LpTxtCell editing={false} v={v} align={align} /> : <LpNumCell editing={false} v={v} decimals={decimals} />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: inline ? 'row-reverse' : 'column', alignItems: inline ? 'center' : 'stretch', gap: inline ? 8 : 4 }}>
      <input className="sh-grid-input" type={text ? 'text' : 'number'} value={unl ? '' : (v ?? '')} disabled={unl} placeholder={unl ? 'ไม่จำกัด' : ''}
             style={{ width: '100%', minWidth: 0, flex: inline ? 1 : undefined, maxWidth: 'none', textAlign: align, background: unl ? '#FAFAFA' : undefined }}
             onChange={(e) => onChange(e.target.value)} />
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap', justifyContent: 'flex-start', flexShrink: 0 }}>
        <input type="checkbox" checked={unl} onChange={(e) => onChange(e.target.checked ? inf : '')} style={{ accentColor: 'var(--brand, #237450)', margin: 0 }} />
        ไม่จำกัด
      </label>
    </div>
  );
}
window.LpUnlCell = LpUnlCell;
// ช่องเปอร์เซ็นต์ + checkbox เลือกใช้คอลัมน์
function LpPctUseCell({ editing, v, onChange, max = 100 }) {
  const on = true;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
      {editing
        ? <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <input className="sh-grid-input" type="number" min="0" max={max} step="0.01" value={on ? (v ?? '') : ''} disabled={!on}
                   placeholder="0.00"
                   style={{ textAlign: 'right', width: '100%', maxWidth: 'none', paddingRight: 26, background: on ? undefined : '#FAFAFA' }}
                   onChange={(e) => { const t = e.target.value; if (t === '') return onChange(''); const n = Math.min(max, Math.max(0, Number(t))); onChange(String(n)); }} />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: on ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.25)', pointerEvents: 'none' }}>%</span>
          </div>
        : <span className="sh-grid-num">{on ? fmt.money(Number(v || 0), 2) + ' %' : <span className="muted">—</span>}</span>}
    </div>
  );
}
function LpRoCell({ v }) {
  return <input className="sh-grid-input" readOnly tabIndex={-1} value={v || ''}
                style={{ maxWidth: 'none', textAlign: 'left', background: 'var(--bg-soft, #FAFAFA)', color: 'var(--text-muted, rgba(0,0,0,.65))', cursor: 'default' }} />;
}
function LpSelCell({ editing, group, v, onChange }) {
  const isRate = group === 'rateTable';
  const opts = isRate ? window.irTableOptions(v) : window.LP_OPTS[group];
  return editing
    ? <select className="l2-select" style={{ height: 28, minWidth: 120, width: group === 'collateralType' ? '100%' : undefined }} value={v ?? ''} onChange={(e) => onChange(e.target.value)}>
        {group === 'collateralType' && <option value="">— เลือก —</option>}
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    : <span>{isRate ? window.irTableLabel(v) : (group === 'collateralType' && !v ? <span className="muted">—</span> : window.lpLabel(group, v))}</span>;
}
function LpDelCell({ editing, onDel }) {
  if (!editing) return null;
  return (
    <td className="center">
      <button className="btn sm act-del" onClick={onDel} title="ลบแถว"
              style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)',
                       width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}><Icon name="trash" size={13} /></button>
    </td>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 1 — ทั่วไป
// ════════════════════════════════════════════════════════════════════
function LpSalaryRuleModal({ onClose, onSaved }) {
  const mkSet = (o) => ({ noRange: !!(o && o.noRange), from: (o && o.from) || '', to: (o && o.to) || '', type: (o && o.type) || 'amount', value: (o && o.value != null) ? o.value : 0 });
  const [rows, setRows] = useState(() => window.lpSalaryRules().filter(o => o.l !== 'เลิกใช้').map(o => {
    let sets = o.sets && o.sets.length ? o.sets.map(mkSet) : null;
    if (!sets) {
      const rg = (o.ranges || []).filter(x => x.from !== '' || x.to !== '');
      sets = rg.length ? rg.map(x => mkSet({ from: x.from, to: x.to, type: o.type, value: o.value }))
                       : [mkSet({ noRange: true, type: o.type, value: o.value })];
    }
    return { v: o.v, l: o.l, check: o.check !== false, sets };
  }));
  const [warn, setWarn] = useState(null);
  const [err, setErr] = useState('');
  const upd = (i, fn) => { setErr(''); setRows(rs => rs.map((r, idx) => idx === i ? fn(r) : r)); };
  const setLabel = (i, v) => upd(i, r => ({ ...r, l: v }));
  const setSet = (i, j, k, v) => upd(i, r => ({ ...r, sets: r.sets.map((x, jj) => jj === j ? { ...x, [k]: v } : x) }));
  const addSet = (i) => upd(i, r => ({ ...r, sets: [...r.sets, mkSet()] }));
  const delSet = (i, j) => upd(i, r => ({ ...r, sets: r.sets.filter((_, jj) => jj !== j) }));
  const add = () => setRows(rs => [...rs, { v: 'r' + Date.now().toString(36), l: '', check: true, sets: [mkSet({ noRange: true })] }]);
  const del = (i) => {
    const r = rows[i];
    const used = window.lpSalaryRuleUsedBy ? window.lpSalaryRuleUsedBy(r.v) : [];
    if (used.length) { setWarn({ rule: r, used }); return; }
    setWarn(null);
    setRows(rs => rs.filter((_, idx) => idx !== i));
  };
  const save = () => {
    const bad = rows.findIndex(r => !String(r.l || '').trim());
    if (bad >= 0) return setErr('กรุณาระบุชื่อเงื่อนไขให้ครบทุกรายการ');
    if (rows.some(r => r.sets.some(x => !x.noRange && (x.from === '' || x.to === ''))))
      return setErr('กรุณาระบุช่วงเลขสมาชิกให้ครบ หรือเลือก “ไม่กำหนดช่วงสมาชิก”');
    const clean = rows.map(r => {
      const sets = r.sets.map(x => ({ ...x, value: Number(x.value) || 0, from: x.noRange ? '' : x.from, to: x.noRange ? '' : x.to }));
      const first = sets[0] || { type: 'amount', value: 0 };
      return { v: r.v, l: String(r.l).trim(), check: r.check, type: first.type, value: first.value, sets,
               ranges: sets.filter(x => !x.noRange).map(x => ({ from: x.from, to: x.to })) };
    });
    window.lpSalaryRulesSave(clean); onSaved && onSaved(clean.length); onClose();
  };
  const selStyle = { maxWidth: 'none', width: '100%', textAlign: 'left', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    padding: '0 24px 0 8px', fontFamily: 'inherit',
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%238C8C8C' stroke-width='1.5'><path d='m3 5 3 3 3-3'/></svg>\")",
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' };
  const trashBtn = (onClick, title, disabled) => (
    <button className="btn act-del" onClick={onClick} title={title} disabled={disabled}
            style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)', opacity: disabled ? .4 : 1,
                     width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <Icon name="trash" size={13} />
    </button>
  );

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 880, maxWidth: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="edit" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เงื่อนไขเงินเดือนคงเหลือ ไม่ต่ำกว่า</h2>
            <div className="muted" style={{ fontSize: 11 }}>รายการนี้ใช้ร่วมกันทุกประเภทเงินกู้ · 1 เงื่อนไขมีได้หลายชุด (ช่วงเลขสมาชิก + ประเภท + ค่า)</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="muted" style={{ fontSize: 11.5, flex: 1 }}>{rows.length} เงื่อนไข</span>
            <button className="btn primary sm" onClick={add}><Icon name="plus" /> เพิ่มเงื่อนไข</button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {rows.map((r, i) => (
              <div key={r.v} style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label className="lt-modal-label">ชื่อเงื่อนไข <span className="cfg-required">*</span></label>
                    <input className="cfg-input" style={{ width: '100%' }} value={r.l} placeholder="เช่น ไม่ต่ำกว่า 3,000 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า 30%"
                           onChange={(e) => setLabel(i, e.target.value)} />
                  </div>
                  {trashBtn(() => del(i), 'ลบเงื่อนไข')}
                </div>
                <table className="tbl sh-grid" style={{ minWidth: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th className="center" style={{ width: 56 }}>ลำดับที่</th>
                      <th>ช่วงเลขสมาชิก (ตั้งแต่ – ถึง)</th>
                      <th className="center" style={{ width: 130 }}>ประเภท</th>
                      <th className="center" style={{ width: 120 }}>ค่า</th>
                      <th className="center" style={{ width: 48 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {r.sets.map((x, j) => (
                      <tr key={j} style={{ verticalAlign: 'top' }}>
                        <td className="center mono muted" style={{ paddingTop: 12 }}>{j + 1}</td>
                        <td>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', gap: 6, alignItems: 'center' }}>
                            <input className="sh-grid-input mono" disabled={x.noRange} placeholder="ตั้งแต่"
                                   style={{ maxWidth: 'none', width: '100%', textAlign: 'center', background: x.noRange ? '#fafafa' : '#fff' }}
                                   value={x.noRange ? '' : x.from} onChange={(e) => setSet(i, j, 'from', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                            <span className="muted">–</span>
                            <input className="sh-grid-input mono" disabled={x.noRange} placeholder="ถึง"
                                   style={{ maxWidth: 'none', width: '100%', textAlign: 'center', background: x.noRange ? '#fafafa' : '#fff' }}
                                   value={x.noRange ? '' : x.to} onChange={(e) => setSet(i, j, 'to', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                          </div>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, cursor: 'pointer', color: 'rgba(0,0,0,.65)' }}>
                            <input type="checkbox" className="ct-check" checked={x.noRange} onChange={(e) => setSet(i, j, 'noRange', e.target.checked)} />
                            ไม่กำหนดช่วงสมาชิก
                          </label>
                        </td>
                        <td>
                          <select className="sh-grid-input" value={x.type} onChange={(e) => setSet(i, j, 'type', e.target.value)} style={selStyle}>
                            <option value="amount">บาท</option>
                            <option value="percent">เปอร์เซ็นต์</option>
                          </select>
                        </td>
                        <td className="num-cell">
                          <input className="sh-grid-input" type="number" value={x.value} onChange={(e) => setSet(i, j, 'value', e.target.value)} />
                        </td>
                        <td className="center">{trashBtn(() => delSet(i, j), 'ลบชุดข้อมูล', r.sets.length <= 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '8px 12px' }}>
                  <button className="btn sm" onClick={() => addSet(i)} style={{ background: '#fff', border: '1px dashed #d9d9d9', color: 'var(--brand, #237450)' }}>
                    <Icon name="plus" size={12} /> เพิ่มข้อมูล
                  </button>
                </div>
              </div>
            ))}
          </div>

          {warn && (
            <div className="dep-error" style={{ marginTop: 10 }}>
              <Icon name="info" size={13} /> ลบไม่ได้ — เงื่อนไข “{warn.rule.l}” ถูกใช้อยู่ใน {warn.used.length} ประเภทเงินกู้: {warn.used.join(' · ')}
            </div>
          )}
          {err && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {err}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={save}>
              <Icon name="check" /> บันทึกเงื่อนไข
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function LpTabGeneral({ record, editing, onSettings }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const elig = s.eligibleMemberTypes || [];
  const toggleElig = (v, on) => set('eligibleMemberTypes', on ? [...elig, v] : elig.filter(x => x !== v));
  const [ruleModal, setRuleModal] = useState(false);
  const [, forceTick] = useState(0);
  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <LpGroup title="ข้อมูลพื้นฐาน">
            <LpRow label="กลุ่มเงินกู้"><LpSel group="loanGroup" v={s.loanGroup} editing={editing} onChange={(v) => set('loanGroup', v)} /></LpRow>
            <LpRow label="เลขที่สัญญาอ้างอิงจากรหัส"><LpTxt v={s.contractRefCode} editing={editing} mono right onChange={(v) => set('contractRefCode', v)} /></LpRow>
          </LpGroup>

          <LpGroup title="การตรวจสอบตอนกู้และประเภทสัญญา">
            <LpCheckNum label="ต้องเป็นสมาชิกแล้ว" on={s.checkMembership !== false} v={s.minMembershipMonths} suffix="เดือน" editing={editing} keepValue
                        onToggle={(on) => set('checkMembership', on)}
                        onValue={(v) => set('minMembershipMonths', v === '' ? '' : Math.min(1200, Math.max(1, Math.round(Number(v)))))} />
            <LpCheckItem label="สมาชิกเกษียณกู้ได้" checked={s.retiredCanLoan} editing={editing} onChange={(v) => set('retiredCanLoan', v)} />
            <LpCheckItem label="เป็นสัญญา OD (วงเงินเบิกเกินบัญชี)" checked={s.isOD} editing={editing} onChange={(v) => set('isOD', v)} />
            <LpRow label="อายุสัญญา">
              {editing
                ? <LpNum v={s.contractMonths} editing suffix="เดือน" onChange={(v) => set('contractMonths', v)} />
                : <div className="l2-val num">{Number(s.contractMonths) > 0 ? <>{s.contractMonths}<span className="l2-suf"> เดือน</span></> : 'ไม่จำกัด'}</div>}
            </LpRow>
            <LpRow label="เตือนล่วงหน้าก่อนครบกำหนด"><LpNum v={s.warnDays} editing={editing} suffix="วัน" onChange={(v) => set('warnDays', v)} /></LpRow>

            <div style={{ padding: '10px 2px 2px', borderTop: '1px solid var(--divider)', marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,.88)', flex: 1 }}>ตรวจเงินเดือนคงเหลือ ไม่ต่ำกว่า</div>
              </div>
              {editing ? (
                <select className="l2-select" style={{ width: '100%', maxWidth: 'none' }} value={window.lpSalaryRemainRuleOf(s)}
                        onChange={(e) => onSettings(window.lpApplySalaryRemainRule(s, e.target.value))}>
                  {window.lpSalaryRuleOptions(window.lpSalaryRemainRuleOf(s)).map((o, i) => (
                    <option key={o.v + i} value={o.v} disabled={o.enabled === false}>{o.l}{o.enabled === false ? ' (ปิดใช้งาน)' : ''}</option>
                  ))}
                </select>
              ) : (() => {
                const o = window.lpSalaryRules().find(x => x.v === window.lpSalaryRemainRuleOf(s));
                return <div className="l2-val" style={{ textAlign: 'left' }}>{o ? o.l : window.lpLabel('salaryRemainRule', window.lpSalaryRemainRuleOf(s))}{o && o.enabled === false ? ' (ปิดใช้งาน)' : ''}</div>;
              })()}
              {window.lpSalaryRuleSummary && window.lpSalaryRuleSummary(window.lpSalaryRemainRuleOf(s)) && (
                <div className="muted" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.6 }}>{window.lpSalaryRuleSummary(window.lpSalaryRemainRuleOf(s))}</div>
              )}
            </div>
          </LpGroup>

          <LpGroup title="ผู้มีสิทธิกู้ (ประเภทสมาชิก)">
            {window.LP_OPTS.memberEligType.map(o => (
              <LpCheckItem key={o.v} label={o.l} checked={elig.includes(o.v)} editing={editing}
                           onChange={(on) => toggleElig(o.v, on)} />
            ))}
          </LpGroup>
        </div>

        <div className="l2-col">
          <LpGroup title="การปัดเศษ">
            <LpRow label="การปัดยอดขอกู้">
              <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="roundMode" v={s.roundLoanMode} editing={editing} onChange={(v) => set('roundLoanMode', v)} />
                {s.roundLoanMode !== 'none' && <LpSel group="roundPlace" v={s.roundLoanFactor} editing={editing} onChange={(v) => set('roundLoanFactor', v)} />}
              </div>
            </LpRow>
            <LpRow label="การปัดยอดชำระ">
              <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="roundMode" v={s.roundPayMode} editing={editing} onChange={(v) => set('roundPayMode', v)} />
                {s.roundPayMode !== 'none' && <LpSel group="roundPlace" v={s.roundPayFactor} editing={editing} onChange={(v) => set('roundPayFactor', v)} />}
              </div>
            </LpRow>
          </LpGroup>

          <LpGroup title="เอกสารประกอบสัญญา">
            <LpCheckItem label="สัญญานี้รองรับการขอหนังสือรับรองดอกเบี้ย" checked={s.interestCertSupported} editing={editing} onChange={(v) => set('interestCertSupported', v)} />
          </LpGroup>

          <LpGroup title="อื่นๆ">
            <LpRow label="ค่าตั้งต้นของประเภทการจ่ายเงินกู้"><LpSel group="defaultPayType" v={s.defaultPayType} editing={editing} onChange={(v) => set('defaultPayType', v)} /></LpRow>
            <LpRow label="ค่าตั้งต้นของวัตถุประสงค์การกู้"><LpSel group="loanPurpose" v={s.defaultPurpose} editing={editing} onChange={(v) => set('defaultPurpose', v)} /></LpRow>
            <LpRow label="การอนุมัติทันที"><LpSel group="instantApprove" v={s.instantApprove} editing={editing} onChange={(v) => set('instantApprove', v)} /></LpRow>
          </LpGroup>

          <LpGroup title="จำกัดจำนวนครั้งกู้ระดับกลุ่มเงินกู้">
            <div className="l2-hint muted" style={{ fontSize: 11, padding: '0 0 4px' }}>นับรวมทุกผลิตภัณฑ์ในกลุ่ม “{window.lpLabel('loanGroup', s.loanGroup)}” — คุมไม่ให้กู้บ่อยเกินกำหนดรวมข้ามผลิตภัณฑ์</div>
            <LpRow label="รวมทั้งกลุ่ม — ต่อปี (0 = ไม่จำกัด)"><LpNum v={s.maxTimesPerYearGroup} editing={editing} suffix="ครั้ง/ปี" onChange={(v) => set('maxTimesPerYearGroup', v)} /></LpRow>
            <LpRow label="รวมทั้งกลุ่ม — ตลอดอายุสมาชิก (0 = ไม่จำกัด)"><LpNum v={s.maxTimesTotalGroup} editing={editing} suffix="ครั้ง" onChange={(v) => set('maxTimesTotalGroup', v)} /></LpRow>
          </LpGroup>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 2 — วงเงินกู้
// ════════════════════════════════════════════════════════════════════
function LpTabLimit({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const rows = record.limitRights;
  const setRow = (i, k, v) => onTable('limitRights', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('limitRights', [...rows, { memberType: 'none', monthFrom: 0, monthTo: 999, shareFrom: 0, shareTo: 0, salaryFrom: 0, salaryTo: 0, mult: 0, multBase: 'period', maxAmount: 0, memberFrom: '000000', memberTo: '999999' }]);
  const delRow = (i) => onTable('limitRights', rows.filter((_, idx) => idx !== i));

  // สิทธิจากหลักประกัน — ตารางขั้นบันไดตามทุนเรือนหุ้น / เงินฝาก / หลักทรัพย์
  const cRows = record.limitCollateral || [];
  const setCRow = (i, k, v) => onTable('limitCollateral', cRows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addCRow = () => onTable('limitCollateral', [...cRows, { useShare: true, useDeposit: false, useAsset: false, shareValue: 0, deposit: 0, asset: 0, maxAmount: 0 }]);
  const delCRow = (i) => onTable('limitCollateral', cRows.filter((_, idx) => idx !== i));

  // ล้อกับค่าคงที่ “วงเงินกู้กลุ่ม”
  const grp = window.lgFind(s.limitGroup);
  const grpCap = grp ? Number(grp.maxAmount) || 0 : 0;
  const overGrpCap = grpCap > 0 && Number(s.maxLoanAmount || 0) > grpCap;


  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <LpGroup title="กำหนดวงเงินกู้">
              <LpRow label="วงเงินกู้กลุ่ม"><LpSel group="limitGroup" v={s.limitGroup} editing={editing} onChange={(v) => set('limitGroup', v)} /></LpRow>
              <LpRow label="เพดานรวมของกลุ่ม (ค่าคงที่วงเงินกู้กลุ่ม)">
                <LpDis v={<span style={{ fontStyle: 'italic' }}>{grpCap ? fmt.money(grpCap, 2) + ' บาท' : '—'}</span>} />
              </LpRow>
              <LpRow label="วงเงินกู้สูงสุด"><LpNum v={s.maxLoanAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('maxLoanAmount', v)} /></LpRow>
              {overGrpCap && (
                <div className="dep-error" style={{ marginTop: 4 }}>
                  <Icon name="info" size={13} /> วงเงินกู้สูงสุดของผลิตภัณฑ์สูงกว่าเพดานรวมของกลุ่ม — ระบบจะใช้เพดานกลุ่ม {fmt.money(grpCap, 2)} บาท เป็นเกณฑ์
                </div>
              )}
              <LpRow label="วิธีกำหนดสิทธิ"><LpSel group="limitMethod" v={s.limitMethod} editing={editing} onChange={(v) => set('limitMethod', v)} /></LpRow>
              <LpRow label="ดูช่วงเวลาจาก"><LpSel group="periodRef" v={s.periodRef} editing={editing} onChange={(v) => set('periodRef', v)} /></LpRow>
            </LpGroup>
          </div>
          <div className="l2-col">
            <LpGroup title="เงื่อนไขเพิ่มเติม">
              <LpCheckItem label="ขอกู้ได้ไม่เกินวงเงินกู้กลุ่มที่กำหนดไว้" checked={s.limitNotExceedGroup} editing={editing} onChange={(v) => set('limitNotExceedGroup', v)} />
              <LpCheckItem label="วงเงินกู้กลุ่มไม่นับยอดรอเรียกเก็บประจำเดือน" checked={s.limitGroupExcludePending} editing={editing} onChange={(v) => set('limitGroupExcludePending', v)} />
              <LpCheckItem label="ขอกู้ได้ไม่เกินหุ้นที่มี" checked={s.limitNotExceedShares} editing={editing} onChange={(v) => set('limitNotExceedShares', v)} />
              <LpCheckItem label="แสดงสิทธิกู้ตอนขอกู้" checked={s.showRightAtRequest} editing={editing} onChange={(v) => set('showRightAtRequest', v)} />
              <div className="l2-subhead">คิดวงเงินกู้ได้จาก</div>
              <LpRadioItem name="limitCalcBasis" label="ยอดคงเหลือ (วงเงินอนุมัติ − ยอดที่จ่ายไปแล้ว)" value="remaining" checked={(s.limitCalcBasis || 'remaining') === 'remaining'} editing={editing} onChange={(v) => set('limitCalcBasis', v)} />
              <LpRadioItem name="limitCalcBasis" label="ยอดอนุมัติ (ไม่หักยอดที่จ่ายไปแล้ว)" value="approved" checked={s.limitCalcBasis === 'approved'} editing={editing} onChange={(v) => set('limitCalcBasis', v)} />
            </LpGroup>

            <LpGroup title="วงเงินสมาชิกใกล้เกษียณ">
              <LpCheckItem label="จำกัดวงเงินกู้สำหรับสมาชิกใกล้เกษียณ" checked={s.nearRetireLimitOn} editing={editing} onChange={(v) => set('nearRetireLimitOn', v)} />
              {s.nearRetireLimitOn && (
                <>
                  <LpRow label="เมื่อเหลือเวลาก่อนเกษียณไม่เกิน" indent><LpNum v={s.nearRetireMonths} editing={editing} suffix="เดือน" onChange={(v) => set('nearRetireMonths', v)} /></LpRow>
                  <LpRow label="วงเงินไม่เกิน (เท่าของเงินเดือน)" indent><LpNum v={s.nearRetireSalaryMult} editing={editing} suffix="เท่า" onChange={(v) => set('nearRetireSalaryMult', v)} /></LpRow>
                  <LpRow label="เพดานวงเงินกู้สูงสุด" indent><LpNum v={s.nearRetireMaxAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('nearRetireMaxAmount', v)} /></LpRow>
                </>
              )}
            </LpGroup>
          </div>
        </div>
      </div>

      {/* ── สิทธิจากหลักประกัน (วิธีกำหนดวงเงิน = 1) ── */}
      <div style={{ marginTop: 12 }}>
        <LpTableShell title="สิทธิจากหลักประกัน" count={cRows.length} editing={editing} onAdd={addCRow} minWidth={720}
          sub="ติ๊กเลือกหลักประกันที่ต้องการใช้ในแต่ละแถว แล้วกำหนดเป็นเปอร์เซ็นต์ของมูลค่าหลักประกันนั้น (ทุนเรือนหุ้น + เงินฝาก + หลักทรัพย์ รวมกันไม่เกิน 90%) พร้อมเพดานวงเงินกู้สูงสุด">
          <thead>
            <tr>
              <th className="center">ทุนเรือนหุ้น (%)</th>
              <th className="center">เงินฝาก (%)</th>
              <th className="center">หลักทรัพย์ (%)</th>
              <th className="center">วงเงินกู้สูงสุด (฿)</th>
              {editing && <th className="center" style={{ width: 46 }} />}
            </tr>
          </thead>
          <tbody>
            {cRows.length === 0 && <tr><td colSpan={editing ? 5 : 4} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงื่อนไข — กด “เพิ่มแถว” เพื่อกำหนดวงเงินตามหลักประกัน</td></tr>}
            {cRows.map((r, i) => {
              const pv = (use, val) => (use !== false ? (Number(val) || 0) : 0);
              const sh = pv(r.useShare, r.shareValue), dp = pv(r.useDeposit, r.deposit), as = pv(r.useAsset, r.asset);
              const total = sh + dp + as;
              const over = total > 90;
              const cap = (self) => Math.max(0, +(90 - (total - self)).toFixed(2));
              return (
              <React.Fragment key={i}>
              <tr>
                <td className="num-cell"><LpPctUseCell editing={editing} on={r.useShare !== false} v={r.shareValue} max={cap(sh)} onToggle={(b) => setCRow(i, 'useShare', b)} onChange={(v) => setCRow(i, 'shareValue', v)} /></td>
                <td className="num-cell"><LpPctUseCell editing={editing} on={r.useDeposit !== false} v={r.deposit} max={cap(dp)} onToggle={(b) => setCRow(i, 'useDeposit', b)} onChange={(v) => setCRow(i, 'deposit', v)} /></td>
                <td className="num-cell"><LpPctUseCell editing={editing} on={r.useAsset !== false} v={r.asset} max={cap(as)} onToggle={(b) => setCRow(i, 'useAsset', b)} onChange={(v) => setCRow(i, 'asset', v)} /></td>
                <td className="num-cell"><LpNumCell editing={editing} v={r.maxAmount} decimals={2} onChange={(v) => setCRow(i, 'maxAmount', v)} /></td>
                <LpDelCell editing={editing} onDel={() => delCRow(i)} />
              </tr>
              {editing && (
                <tr>
                  <td colSpan={3} style={{ padding: '4px 12px 8px', borderTop: 'none', fontSize: 12, textAlign: 'left', color: over ? '#CF1322' : 'rgba(0,0,0,.45)' }}>
                    ทุนเรือนหุ้น + เงินฝาก + หลักทรัพย์ ต้องรวมกันไม่เกิน 90% · รวม {total.toFixed(2)}%{over ? ' — เกินกำหนด กรุณาปรับลด' : ''}
                  </td>
                  <td colSpan={2} style={{ borderTop: 'none' }} />
                </tr>
              )}
              </React.Fragment>
              );
            })}
          </tbody>
        </LpTableShell>
      </div>

      <div style={{ marginTop: 12 }}>
      <LpTableShell title="สิทธิแบบกำหนดเอง" count={rows.length} editing={editing} onAdd={addRow} minWidth={1250}
        sub="ตารางขั้นบันได (Matrix) ประเมินวงเงินกู้สูงสุดรายบุคคล ตามระยะเวลา / หุ้น / เงินเดือน">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 170 }}>ประเภทสมาชิก</th>
            <th colSpan={2} className="center group-col">ระยะเวลา (เดือน)</th>
            <th colSpan={2} className="center group-col">มีหุ้น (บาท)</th>
            <th colSpan={2} className="center group-col">เงินเดือน</th>
            <th colSpan={2} className="center group-col">สิทธิการกู้</th>
            <th rowSpan={2} className="center" style={{ width: 130 }}>วงเงินกู้สูงสุด</th>
            <th colSpan={2} className="center group-col">ช่วงสมาชิก</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
            <th className="center sub-col">เท่า</th><th className="center sub-col">อ้างอิง</th>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&le;</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 13 : 12} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงื่อนไข — กด “เพิ่มแถว” เพื่อสร้างขั้นบันได</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="memberTypeRight" v={(r.memberType && r.memberType !== 'regular' ? r.memberType : 'none')} onChange={(v) => setRow(i, 'memberType', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.monthFrom} onChange={(v) => setRow(i, 'monthFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.monthTo} inf={999} onChange={(v) => setRow(i, 'monthTo', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.shareFrom} onChange={(v) => setRow(i, 'shareFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.shareTo} inf={999999999} onChange={(v) => setRow(i, 'shareTo', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.salaryFrom} onChange={(v) => setRow(i, 'salaryFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.salaryTo} inf={9999999} onChange={(v) => setRow(i, 'salaryTo', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.mult} onChange={(v) => setRow(i, 'mult', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="rightMultBase" v={r.multBase} onChange={(v) => setRow(i, 'multBase', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.maxAmount} decimals={0} onChange={(v) => setRow(i, 'maxAmount', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpTxtCell editing={editing} v={(r.memberFrom == null || /^0*$/.test(String(r.memberFrom))) ? '0' : r.memberFrom} align="center" onChange={(v) => setRow(i, 'memberFrom', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpUnlCell editing={editing} text center v={r.memberTo} inf="999999" onChange={(v) => setRow(i, 'memberTo', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 3 — ดอกเบี้ย
// ════════════════════════════════════════════════════════════════════
function LpTabInterest({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const rows = record.interestTiers;
  const setRow = (i, k, v) => onTable('interestTiers', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('interestTiers', [...rows, { memberType: 'none', dueType: 'ปกติ', monthFrom: 0, monthTo: 0, form: 'fixed', rate: '', adjust: 0 }]);
  const delRow = (i) => onTable('interestTiers', rows.filter((_, idx) => idx !== i));

  // อัตราที่มีผลจริงจากตารางดอกเบี้ยที่อ้างอิง (sync กับหน้าอัตราดอกเบี้ยเงินกู้)
  const sysRate = window.irLatestRate(s.rateTable, s.maxLoanAmount);

  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <LpGroup title="ข้อกำหนดอัตราดอกเบี้ย">
              <LpRow label="คิดดอกเบี้ยเป็นชั้น ให้ดูชั้นจาก"><LpSel group="interestTierBasis" v={s.interestTierBasis} editing={editing} onChange={(v) => set('interestTierBasis', v)} /></LpRow>
              <LpRow label="รูปแบบการคำนวณดอกเบี้ย"><LpSel group="interestCalcMode" v={s.interestCalcMode} editing={editing} onChange={(v) => set('interestCalcMode', v)} /></LpRow>
              <LpRow label="รูปแบบอัตราที่เรียกเก็บ"><LpSel group="interestRateForm" v={s.interestRateForm} editing={editing} onChange={(v) => set('interestRateForm', v)} /></LpRow>
              <LpRow label="ดอกเบี้ยคงที่ดูอัตราจากตาราง"><LpSel group="rateTable" v={s.rateTable} editing={editing} onChange={(v) => set('rateTable', v)} /></LpRow>
              <LpRow label="ดอกเบี้ยจากตาราง (ระบบกำหนด)"><LpDis v={sysRate ? fmt.money(Number(sysRate.rate), 2) + ' %' : '— %'} /></LpRow>
              <LpRow label="อัตราดอกเบี้ยเพิ่ม/ลด ต่างหาก"><LpDis v={sysRate && sysRate.useAdjust ? 'ใช้อัตราเพิ่ม/ลด' : '0.00 %'} /></LpRow>
            </LpGroup>

            <LpGroup title="ดอกเบี้ยผิดนัด / เกณฑ์พิจารณาเงินกู้">
              <LpCheckItem label="คิดดอกเบี้ยผิดนัดชำระ" checked={s.penaltyInterestOn} editing={editing} onChange={(v) => set('penaltyInterestOn', v)} />
              {s.penaltyInterestOn && (
                <LpRow label="อัตราดอกเบี้ยผิดนัด" indent><LpNum v={s.penaltyInterestRate} editing={editing} decimals={2} suffix="%" onChange={(v) => set('penaltyInterestRate', v)} /></LpRow>
              )}
              <LpRow label="เกณฑ์พิจารณาเงินกู้"><LpSel group="warnBasis" v={s.warnBasis} editing={editing} onChange={(v) => set('warnBasis', v)} /></LpRow>
              <LpRow label="ค่าเกณฑ์ที่ใช้เตือน"><LpNum v={s.warnThreshold} editing={editing} decimals={2} suffix={s.warnBasis === 'balance' ? 'บาท' : '%'} onChange={(v) => set('warnThreshold', v)} /></LpRow>
            </LpGroup>
          </div>
          <div className="l2-col">
            <LpGroup title="ข้อกำหนดดอกเบี้ยรายเดือน — การรับเงินกู้">
              <LpRow label="ช่วงเวลาไม่คิด ด/บ"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.recvCondition} editing={editing} onChange={(v) => set('recvCondition', v)} />
                <LpNum v={s.recvDays} editing={editing} suffix="วัน" onChange={(v) => set('recvDays', v)} /></div></LpRow>
              <LpRow label="ช่วงคิด ด/บ ครึ่งเดือน"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.recvHalfCondition} editing={editing} onChange={(v) => set('recvHalfCondition', v)} />
                <LpNum v={s.recvHalfDays} editing={editing} suffix="วัน" onChange={(v) => set('recvHalfDays', v)} /></div></LpRow>
            </LpGroup>
            <LpGroup title="ข้อกำหนดดอกเบี้ยรายเดือน — การชำระเงินกู้">
              <LpRow label="ช่วงเวลาไม่คิด ด/บ"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.payCondition} editing={editing} onChange={(v) => set('payCondition', v)} />
                <LpNum v={s.payDays} editing={editing} suffix="วัน" onChange={(v) => set('payDays', v)} /></div></LpRow>
              <LpRow label="ช่วงคิด ด/บ ครึ่งเดือน"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.payHalfCondition} editing={editing} onChange={(v) => set('payHalfCondition', v)} />
                <LpNum v={s.payHalfDays} editing={editing} suffix="วัน" onChange={(v) => set('payHalfDays', v)} /></div></LpRow>
            </LpGroup>
          </div>
        </div>
      </div>

      <LpTableShell title="กำหนดการคิดดอกเบี้ยตามช่วงเวลา" count={rows.length} editing={editing} onAdd={addRow} minWidth={1000}
        sub="คิดดอกเบี้ยแบบขั้นบันไดตามช่วงเวลา — กำหนดรูปแบบ, ตารางอัตรา และส่วนเพิ่ม/ลด">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 190 }}>ประเภทสมาชิก</th>
            <th rowSpan={2} style={{ width: 120 }}>การครบกำหนด</th>
            <th colSpan={2} className="center group-col">ช่วงเวลา (เดือน)</th>
            <th colSpan={3} className="center group-col">การคิดดอกเบี้ย</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">ตั้งแต่</th><th className="center sub-col">ถึง</th>
            <th className="center sub-col">รูปแบบ</th><th className="center sub-col">อัตราดอกเบี้ย (%)</th><th className="center sub-col">เพิ่ม/ลด %</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 8 : 7} className="center muted" style={{ padding: '24px' }}>ยังไม่มีช่วงเวลา — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="memberTypeRight" v={(r.memberType && r.memberType !== 'regular' ? r.memberType : 'none')} onChange={(v) => setRow(i, 'memberType', v)} /></td>
              <td><LpTxtCell editing={editing} v={r.dueType} onChange={(v) => setRow(i, 'dueType', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.monthFrom} onChange={(v) => setRow(i, 'monthFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.monthTo} inf={999} onChange={(v) => setRow(i, 'monthTo', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="interestStepForm" v={r.form} onChange={(v) => setRow(i, 'form', v)} /></td>
              <td className="num-cell">{r.form === 'fixed'
                ? (editing
                    ? <input className="sh-grid-input" type="number" min="0" max="100" step="0.01" style={{ maxWidth: 'none', width: '100%' }}
                             value={r.rate ?? r.fixedRate ?? ''}
                             onChange={(e) => { let v = e.target.value; if (v !== '') { v = Math.min(100, Math.max(0, Number(v))); v = Math.round(v * 100) / 100; } setRow(i, 'rate', v); }} />
                    : <span className="sh-grid-num">{fmt.money(Number(r.rate ?? r.fixedRate ?? 0), 2)}</span>)
                : <span className="sh-grid-num muted" title="แถวลอยตัว/ขั้นบันได ใช้ “ตารางอัตราที่ใช้” ที่หัวแท็บ">–</span>}</td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.adjust} decimals={2} onChange={(v) => setRow(i, 'adjust', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 4 — หลักประกัน
// ════════════════════════════════════════════════════════════════════
function LpTabCollateral({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const checks = [
    ['needCollateral', 'ขอกู้ต้องใช้หลักประกัน'],
    ['allowPersonGuar', 'ใช้บุคคลค้ำประกันได้'],
    ['lockShareIfPerson', 'Lock หุ้นไว้ในกรณีใช้คนค้ำประกัน'],
    ['checkShareLock', 'ใช้หุ้นค้ำต้องตรวจว่าหุ้นมีการ Lock ไว้หรือไม่'],
    ['checkGuarRetire', 'ตรวจเกษียณคนค้ำประกันด้วย'],
    ['pvdInsuranceGuar', 'ผู้กู้เป็น กสล.+ทำประกัน เลือกใช้สิทธิผู้ค้ำได้'],
    ['notExceedShareValue', 'กู้ได้ไม่เกินค่าหุ้น'],
    ['countTransferAsGuar', 'นับสัญญารับโอนเป็นการค้ำประกัน'],
    ['countResignAsGuar', 'นับสัญญาที่ผู้กู้ลาออกเป็นการค้ำประกัน'],
    ['countDebtAckAsGuar', 'นับสัญญารับสภาพหนี้เป็นการค้ำประกัน'],
  ];
  const rows = record.collateralValues || [];
  const setRow = (i, k, v) => onTable('collateralValues', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('collateralValues', [...rows, { group: '01', type: '', name: 'คนค้ำประกัน', percent: 100 }]);
  const assetOfGroup = { '01': 'คนค้ำประกัน', '02': 'หุ้นค้ำประกัน', '03': 'เงินฝากค้ำประกัน', '04': 'หลักทรัพย์ค้ำประกัน', '05': 'พันธบัตร' };
  // ประเภท — เงินฝากค้ำ (03) ดึงจากค่าคงที่ระบบเงินฝาก › กลุ่มประเภทเงินฝาก · หลักทรัพย์ค้ำ (04) ใช้ประเภทหลักทรัพย์
  const depGroups = (() => {
    let list = null;
    try { const raw = localStorage.getItem('dep_const_depgroup'); if (raw) list = JSON.parse(raw); } catch (e) {}
    if (!Array.isArray(list) || !list.length) list = [
      { code: '01', name: 'เงินฝากรายวัน' }, { code: '02', name: 'เงินฝากประจำ' },
      { code: '03', name: 'เงินฝากพิเศษ' }, { code: '04', name: 'เงินฝากเพื่อสวัสดิการ' }];
    return list.filter(d => d && d.code);
  })();
  // "ทั้งหมด" อยู่ท้ายรายการ · เลขนำหน้าต่อจากรายการสุดท้าย
  const withAll = (list) => [...list, { v: 'ALL', l: String(list.length + 1).padStart(2, '0') + ' ทั้งหมด', n: 'ทั้งหมด' }];
  const typeOpts = {
    '03': withAll(depGroups.map(d => ({ v: d.code, l: d.code + ' ' + d.name, n: d.name }))),
    '04': withAll((window.LP_OPTS.collateralSecurityType || []).map(o => ({ ...o, n: o.l.replace(/^\S+\s+/, '') }))),
  };
  const typeOf = (r) => {
    const opts = typeOpts[r.group];
    if (!opts) return '';
    return opts.some(o => o.v === r.type) ? r.type : opts[0].v;
  };
  const assetName = (r) => {
    const g = assetOfGroup[r.group] || r.name || '';
    const opts = typeOpts[r.group];
    if (!opts) return g;
    const hit = opts.find(o => o.v === typeOf(r));
    return hit ? g + '-' + (hit.n || hit.l) : g;
  };
  const setGroup = (i, v) => onTable('collateralValues', rows.map((r, idx) => idx === i
    ? { ...r, group: v, name: assetOfGroup[v] || r.name, type: typeOpts[v] ? typeOpts[v][0].v : '' }
    : r));
  const delRow = (i) => onTable('collateralValues', rows.filter((_, idx) => idx !== i));

  const gRows = record.guaranteeRules || [];
  const setGRow = (i, k, v) => onTable('guaranteeRules', gRows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addGRow = () => onTable('guaranteeRules', [...gRows, { loanFrom: 0, loanTo: 0, useShare: '1', allowType: '1', count: 0, normal: 0, cond: 0, assoc: 0 }]);
  const delGRow = (i) => onTable('guaranteeRules', gRows.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <LpGroup title="ข้อกำหนดหลักประกัน">
              {checks.map(([k, label]) => <LpCheckItem key={k} label={label} checked={s[k]} editing={editing} onChange={(v) => set(k, v)} />)}
            </LpGroup>
          </div>
          <div className="l2-col">
            <LpGroup title="เงื่อนไขการตรวจสอบคนค้ำประกัน">
              <LpRow label="กลุ่มสิทธิวงเงินการค้ำ" hint="ค่าคงที่ › กำหนดวงเงินค้ำประกัน"><LpSel group="guarLimitGroup" v={s.guarLimitGroup} editing={editing} onChange={(v) => set('guarLimitGroup', v)} /></LpRow>
              <LpRow label="การนับยอดค้ำประกัน" hint="ค่าคงที่ › ข้อกำหนดสินเชื่อ — วิธีนับยอดค้ำ"><LpSel group="guarCountMode" v={s.guarCountMode} editing={editing} onChange={(v) => set('guarCountMode', v)} /></LpRow>
              <LpRow label="กลุ่มสิทธิจำนวนคนค้ำ" hint="ค่าคงที่ › กำหนดจำนวนคนค้ำประกัน"><LpSel group="guarPersonGroup" v={s.guarPersonGroup} editing={editing} onChange={(v) => set('guarPersonGroup', v)} /></LpRow>
              <LpRow label="การนับคนค้ำประกัน" hint="ค่าคงที่ › ข้อกำหนดสินเชื่อ — วิธีนับคนค้ำ"><LpSel group="guarPersonCountMode" v={s.guarPersonCountMode} editing={editing} onChange={(v) => set('guarPersonCountMode', v)} /></LpRow>
              <LpRow label="นำหุ้นผู้กู้มาลดยอดค้ำ" hint="ค่าคงที่ › ข้อกำหนดสินเชื่อ — การหักหุ้นจากยอดค้ำ"><LpSel group="useShareReduceGuar" v={s.useShareReduceGuar} editing={editing} onChange={(v) => set('useShareReduceGuar', v)} /></LpRow>
              <LpRow label="การทำประกันชีวิต" hint="ค่าคงที่ › บริษัทประกันภัย (ระบบขอสินไหม/ประกันสมาชิก)"><LpSel group="loanInsurance" v={s.loanInsurance} editing={editing} onChange={(v) => set('loanInsurance', v)} /></LpRow>
              {s.loanInsurance === '1' && (
                <LpRow label="บังคับทำประกันชีวิตเมื่อยอดกู้ตั้งแต่"><LpNum v={s.loanInsuranceMinAmount} editing={editing} decimals={2} suffix="บาทขึ้นไป" onChange={(v) => set('loanInsuranceMinAmount', v)} /></LpRow>
              )}
              <LpRow label="การทำประกันหนีหนี้" hint="ค่าคงที่ › บริษัทประกันภัย (ระบบขอสินไหม/ประกันสมาชิก)"><LpSel group="loanInsurance" v={s.escapeDebtInsurance} editing={editing} onChange={(v) => set('escapeDebtInsurance', v)} /></LpRow>
              {s.escapeDebtInsurance === '1' && (
                <LpRow label="บังคับทำประกันหนีหนี้เมื่อยอดกู้ตั้งแต่"><LpNum v={s.escapeDebtInsuranceMinAmount} editing={editing} decimals={2} suffix="บาทขึ้นไป" onChange={(v) => set('escapeDebtInsuranceMinAmount', v)} /></LpRow>
              )}
            </LpGroup>
          </div>
        </div>
      </div>

      <LpTableShell title="มูลค่าหลักประกันที่ใช้ค้ำได้" count={rows.length} editing={editing} onAdd={addRow} minWidth={680}
        sub="กำหนดสัดส่วน (%) ของหลักทรัพย์แต่ละประเภทที่นำมาใช้ค้ำประกันได้จริง">
        <thead>
          <tr>
            <th style={{ width: 200 }}>กลุ่ม</th>
            <th style={{ width: 170 }}>ประเภท</th>
            <th>หลักทรัพย์</th>
            <th className="center" style={{ width: 140 }}>% การค้ำได้</th>
            {editing && <th className="center" style={{ width: 46 }} />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 5 : 4} className="center muted" style={{ padding: '24px' }}>ยังไม่มีหลักทรัพย์ — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>
              <td><LpSelCell editing={editing} group="collateralGroup" v={r.group} onChange={(v) => setGroup(i, v)} /></td>
              <td style={{ textAlign: 'left' }}>{typeOpts[r.group]
                ? (editing
                    ? <select className="l2-select" style={{ height: 28, width: '100%' }} value={typeOf(r)} onChange={(e) => setRow(i, 'type', e.target.value)}>
                        {typeOpts[r.group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    : <LpRoCell v={(typeOpts[r.group].find(o => o.v === typeOf(r)) || typeOpts[r.group][0]).l} />)
                : <LpRoCell v="-" />}</td>
              <td style={{ textAlign: 'left' }}><LpRoCell v={assetName(r)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.percent} decimals={2} onChange={(v) => setRow(i, 'percent', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 5 — หักชำระ
// ════════════════════════════════════════════════════════════════════
function LpTabOffset({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const rows = record.offsetLoans;
  const setRow = (i, k, v) => onTable('offsetLoans', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('offsetLoans', [...rows, { loanType: '', zeroInt: false, normal: true, refi: false }]);
  const delRow = (i) => onTable('offsetLoans', rows.filter((_, idx) => idx !== i));

  const bRows = record.banLoans || [];
  const setBRow = (i, k, v) => onTable('banLoans', bRows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addBRow = () => onTable('banLoans', [...bRows, { loanType: '', paidPeriods: 0, paidPercent: 0 }]);
  const delBRow = (i) => onTable('banLoans', bRows.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <LpGroup title="เงื่อนไขการหักกลบเบื้องต้น">
              <LpCheckItem label="หักกลบเฉพาะการจ่ายเงินกู้งวดแรกเท่านั้น" checked={s.offsetFirstOnly} editing={editing} onChange={(v) => set('offsetFirstOnly', v)} />
              <LpCheckItem label="หักกลบต้องยกเลิกกระดาษทำการ" checked={s.offsetCancelWorksheet} editing={editing} onChange={(v) => set('offsetCancelWorksheet', v)} />
            </LpGroup>
          </div>
          <div className="l2-col">
            <LpGroup title="เงื่อนไขอื่นๆ">
              <LpRow label="หุ้นขั้นต่ำเทียบกับ"><LpSel group="minShareCompare" v={s.minShareCompare} editing={editing} onChange={(v) => set('minShareCompare', v)} /></LpRow>
              <LpRow label="หักดอกเบี้ยล่วงหน้า"><LpSel group="prepayInterest" v={s.prepayInterestOnOffset} editing={editing} onChange={(v) => set('prepayInterestOnOffset', v)} /></LpRow>
            </LpGroup>
          </div>
        </div>
      </div>

      <LpTableShell title="เงินกู้ที่ต้องหักกลบ" count={rows.length} editing={editing} onAdd={addRow} minWidth={720}
        sub="ระบุประเภทเงินกู้เดิมที่อนุญาตให้หักกลบ (ปิดยอด) ด้วยเงินกู้ประเภทนี้">
        <thead>
          <tr>
            <th rowSpan={2} style={{ minWidth: 200 }}>เงินกู้ที่ต้องหักกลบ</th>
            <th colSpan={3} className="center group-col">อนุญาตหักกลบ</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">ดอกเบี้ยศูนย์</th><th className="center sub-col">สัญญาตัวเอง</th><th className="center sub-col">สัญญาค้ำประกัน</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 5 : 4} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงินกู้ที่ต้องหักกลบ — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>
              <td><LpTxtCell editing={editing} v={r.loanType} onChange={(v) => setRow(i, 'loanType', v)} /></td>
              {['zeroInt', 'normal', 'refi'].map(k => (
                <td key={k} className="center" style={{ borderLeft: '1px solid var(--divider)' }}>
                  <input type="checkbox" className="ct-check" checked={!!r[k]} disabled={!editing} onChange={(e) => setRow(i, k, e.target.checked)} />
                </td>
              ))}
              <LpDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>

      <div style={{ marginTop: 12 }}>
        <LpTableShell title="เงินกู้ที่ห้ามกู้" count={bRows.length} editing={editing} onAdd={addBRow} minWidth={720}
          sub="ระบุประเภทเงินกู้ที่ห้ามมีสัญญาค้างอยู่ขณะขอกู้ประเภทนี้ — เว้นแต่ชำระมาแล้วตามเกณฑ์ที่กำหนด">
          <thead>
            <tr>
              <th rowSpan={2} style={{ minWidth: 200 }}>เงินกู้ที่ห้ามกู้</th>
              <th colSpan={2} className="center group-col">ชำระมาแล้ว</th>
              {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
            </tr>
            <tr>
              <th className="center sub-col">จำนวนงวด</th><th className="center sub-col">จำนวนเปอร์เซ็นต์</th>
            </tr>
          </thead>
          <tbody>
            {bRows.length === 0 && <tr><td colSpan={editing ? 4 : 3} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงินกู้ที่ห้ามกู้ — กด “เพิ่มแถว”</td></tr>}
            {bRows.map((r, i) => (
              <tr key={i}>
                <td><LpTxtCell editing={editing} v={r.loanType} onChange={(v) => setBRow(i, 'loanType', v)} /></td>
                <td className="num-cell lp-offset-cell" style={{ borderLeft: '1px solid var(--divider)', width: '22%' }}><LpNumCell editing={editing} v={r.paidPeriods} full onChange={(v) => setBRow(i, 'paidPeriods', v)} /></td>
                <td className="num-cell lp-offset-cell" style={{ width: '22%' }}><LpNumCell editing={editing} v={r.paidPercent} full onChange={(v) => setBRow(i, 'paidPercent', v)} /></td>
                <LpDelCell editing={editing} onDel={() => delBRow(i)} />
              </tr>
            ))}
          </tbody>
        </LpTableShell>
      </div>
      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> เกณฑ์ “ชำระมาแล้ว” ของตารางเงินกู้ที่ห้ามกู้ — ถ้าชำระถึงเกณฑ์จึงจะขอกู้ประเภทนี้ได้
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 6 — งวดชำระ
// ════════════════════════════════════════════════════════════════════
function LpTabInstallment({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const rows = record.installmentLimits;
  const setRow = (i, k, v) => onTable('installmentLimits', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('installmentLimits', [...rows, { loanFrom: 0, loanTo: 0, ageFrom: 0, ageTo: 720, pvd: '-1', maxPeriods: 0, notExceedRetire: true, purpose: '' }]);
  const delRow = (i) => onTable('installmentLimits', rows.filter((_, idx) => idx !== i));

  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <LpGroup title="กำหนดการชำระ">
              <LpRow label="รูปแบบการชำระคืน"><LpSel group="repayMode" v={s.repayMode} editing={editing} onChange={(v) => set('repayMode', v)} /></LpRow>
              {s.repayMode === '4' && (
                <>
                  <LpRow label="งวดท้าย (บอลลูน) คิดจาก" indent><LpSel group="balloonBase" v={s.balloonBase} editing={editing} onChange={(v) => set('balloonBase', v)} /></LpRow>
                  <LpRow label={s.balloonBase === 'percent' ? 'งวดท้ายคิดเป็น' : 'จำนวนเงินงวดท้าย'} indent>
                    <LpNum v={s.balloonValue} editing={editing} decimals={s.balloonBase === 'percent' ? 2 : 2}
                           suffix={s.balloonBase === 'percent' ? '%' : 'บาท'} onChange={(v) => set('balloonValue', v)} /></LpRow>
                </>
              )}
              <LpRow label="การคำนวณงวด"><LpSel group="periodCalc" v={s.periodCalc} editing={editing} onChange={(v) => set('periodCalc', v)} /></LpRow>
              <LpRow label="ผ่อนชำระขั้นต่ำ"><LpNum v={s.minPayment} editing={editing} suffix="บาท/เดือน" onChange={(v) => set('minPayment', v)} /></LpRow>
              <LpRow label="การชำระงวดสุดท้าย"><LpSel group="lastInstallment" v={s.lastInstallment} editing={editing} onChange={(v) => set('lastInstallment', v)} /></LpRow>
            </LpGroup>
          </div>
          <div className="l2-col">
            <LpGroup title="เงื่อนไขพิเศษ">
              <LpRow label="ตัวช่วยยืดงวดชำระ"><LpSel group="extendHelper" v={s.extendHelper} editing={editing} onChange={(v) => set('extendHelper', v)} /></LpRow>
              <LpRow label="งวดชำระหลังเกษียณ"><LpNum v={s.postRetirePeriods} editing={editing} suffix="งวด" onChange={(v) => set('postRetirePeriods', v)} /></LpRow>
              <LpCheckItem label="งดเรียกเก็บเงินต้นถ้ายังเบิกเงินกู้ไม่ครบ" checked={s.waivePrincipalIfIncomplete} editing={editing} onChange={(v) => set('waivePrincipalIfIncomplete', v)} />
              <LpCheckItem label="คำนวณงวดส่งให้ดูสถานะกองทุนสำรองเลี้ยงชีพด้วย" checked={s.checkPVDOnCalc} editing={editing} onChange={(v) => set('checkPVDOnCalc', v)} />
            </LpGroup>

            {s.periodCalc === '5' && (
              <LpGroup title="ไม่ผ่อนรายเดือน (ชำระจากปันผล/เฉลี่ยคืน)">
                <LpRow label="ตัดชำระจาก"><LpSel group="dividendRepayBase" v={s.dividendRepayBase} editing={editing} onChange={(v) => set('dividendRepayBase', v)} /></LpRow>
                <LpRow label="กำหนด % การจ่ายจากปันผล/เฉลี่ยคืน"><LpNum v={s.rebatePayPercent} editing={editing} decimals={2} suffix="%" onChange={(v) => set('rebatePayPercent', v)} /></LpRow>
                <LpCheckItem label="สะสมดอกเบี้ยรายเดือนจนถึงรอบจ่าย" checked={s.accrueInterestMonthly} editing={editing} onChange={(v) => set('accrueInterestMonthly', v)} />
                <LpCheckItem label="อนุญาตจ่ายเฉพาะดอกเบี้ย (ไม่ต้องจ่ายเงินต้น)" checked={s.interestOnlyAllowed} editing={editing} onChange={(v) => set('interestOnlyAllowed', v)} />
                <LpCheckItem label="ตรวจยอดเงินเฉลี่ยคืนย้อนหลังก่อนจ่าย" checked={s.checkRebateHistory} editing={editing} onChange={(v) => set('checkRebateHistory', v)} />
              </LpGroup>
            )}
          </div>
        </div>
      </div>

      <LpTableShell title="ตารางจำนวนงวดการส่งชำระ" count={rows.length} editing={editing} onAdd={addRow} minWidth={1120}
        sub="กำหนดเพดานจำนวนงวดชำระสูงสุดตามวงเงินกู้ / ระยะเวลา / สถานะกองทุน">
        <thead>
          <tr>
            <th colSpan={2} className="center group-col">วงเงินกู้</th>
            <th colSpan={2} className="center group-col">ระยะเวลา (เดือน)</th>
            <th rowSpan={2} className="center" style={{ width: 130 }}>กองทุนสำรองฯ</th>
            <th rowSpan={2} className="center" style={{ width: 90 }}>งวดสูงสุด</th>
            <th rowSpan={2} className="center" style={{ minWidth: 180 }}>ประเภทหลักประกัน</th>
            <th rowSpan={2} className="center" style={{ width: 90 }}>ไม่เกินเกษียณ</th>
            <th rowSpan={2} style={{ minWidth: 130 }}>วัตถุประสงค์</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&lt;</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 12 : 11} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงื่อนไขงวด — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
              <td className="num-cell"><LpNumCell editing={editing} v={r.loanFrom} decimals={0} onChange={(v) => setRow(i, 'loanFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.loanTo} decimals={0} inf={999999999} onChange={(v) => setRow(i, 'loanTo', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.ageFrom} onChange={(v) => setRow(i, 'ageFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.ageTo} inf={999} onChange={(v) => setRow(i, 'ageTo', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="pvdCheck" v={r.pvd} onChange={(v) => setRow(i, 'pvd', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.maxPeriods} onChange={(v) => setRow(i, 'maxPeriods', v)} /></td>
              <td className="num-cell"><LpSelCell editing={editing} group="collateralType" v={r.collateralType} onChange={(v) => setRow(i, 'collateralType', v)} /></td>
              <td className="center" style={{ borderLeft: '1px solid var(--divider)' }}>
                <input type="checkbox" className="ct-check" checked={!!r.notExceedRetire} disabled={!editing} onChange={(e) => setRow(i, 'notExceedRetire', e.target.checked)} />
              </td>
              <td><LpPurposeCell editing={editing} v={r.purpose} onChange={(v) => setRow(i, 'purpose', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 7 — จำกัดกู้
// ════════════════════════════════════════════════════════════════════
function LpTabRestrict({ record, editing, onTable }) {
  const bans = record.banRules;
  const reds = record.reduceRules;
  const setBan = (i, k, v) => onTable('banRules', bans.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addBan = () => onTable('banRules', [...bans, { loanType: '', minPeriods: '' }]);
  const banN = (r) => r.minPeriods != null ? r.minPeriods : (r.periodTo != null && r.periodTo !== 999 ? r.periodTo : '');
  const delBan = (i) => onTable('banRules', bans.filter((_, idx) => idx !== i));
  const setRed = (i, k, v) => onTable('reduceRules', reds.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRed = () => onTable('reduceRules', [...reds, { loanType: '', periodFrom: 0, periodTo: 999, salaryMult: 0, maxAmount: 0 }]);
  const delRed = (i) => onTable('reduceRules', reds.filter((_, idx) => idx !== i));
  // โครงการเงินกู้ — แสดงโครงการย่อยทั้งหมดเรียงต่อกัน (ไม่มีหัวข้อโครงการใหญ่)
  const projects = (window.lpjLoad ? window.lpjLoad() : (window.LPJ_SEED || []));
  const subOpts = projects.flatMap(p => (p.rounds || []).map(r => ({ v: r.id, l: r.name })));
  const subLabel = (v) => {
    const hit = subOpts.find(o => o.v === v);
    if (hit) return hit.l;
    const par = projects.find(p => p.id === v);
    return par ? par.name : v;
  };
  const SubSel = ({ rows, i, v, onChange }) => {
    if (!editing) return <span style={{ display: 'block' }}>{v ? subLabel(v) : <span className="muted">—</span>}</span>;
    const taken = rows.map((r, idx) => idx !== i && r.loanType).filter(Boolean);
    return (
      <select className="sh-grid-input" style={{ textAlign: 'left', width: '100%', maxWidth: 'none' }} value={v || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">— เลือกโครงการเงินกู้ —</option>
        {v && !subOpts.some(o => o.v === v) && <option value={v}>{subLabel(v)}</option>}
        {subOpts.map(o => <option key={o.v} value={o.v} disabled={taken.includes(o.v)}>{o.l}</option>)}
      </select>
    );
  };

  return (
    <>
      <LpTableShell title="ห้ามกู้โครงการนี้ ถ้ายังมีหนี้เดิมต่อไปนี้ค้างอยู่" count={bans.length} editing={editing} onAdd={addBan} minWidth={680}
        sub="กฎสกัดกั้น — หากมีหนี้เดิมที่กำหนด และยังผ่อนชำระไม่ถึงเกณฑ์ จะกู้โครงการนี้ไม่ได้">
        <thead>
          <tr>
            <th style={{ minWidth: 240 }}>โครงการเงินกู้ที่ห้ามกู้</th>
            <th className="center group-col" style={{ width: 200 }}>ผ่อน &lt; N งวด กู้ไม่ได้</th>
            {editing && <th className="center" style={{ width: 46 }} />}
          </tr>
        </thead>
        <tbody>
          {bans.length === 0 && <tr><td colSpan={editing ? 3 : 2} className="center muted" style={{ padding: '20px' }}>ไม่มีเงื่อนไขห้ามกู้</td></tr>}
          {bans.map((r, i) => (
            <tr key={i}>
              <td><SubSel rows={bans} i={i} v={r.loanType} onChange={(v) => setBan(i, 'loanType', v)} /></td>
              <td className="num-cell">{editing
                ? <input className="sh-grid-input" type="number" min="1" max="999" step="1" placeholder="N" style={{ maxWidth: 'none', width: '100%' }}
                         value={banN(r)} onChange={(e) => { const v = e.target.value; setBan(i, 'minPeriods', v === '' ? '' : Math.min(999, Math.max(1, Math.round(Number(v))))); }} />
                : <span className="sh-grid-num">{banN(r) === '' ? '—' : '< ' + banN(r) + ' งวด'}</span>}</td>
              <LpDelCell editing={editing} onDel={() => delBan(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>

      <LpTableShell title="ลดสิทธิ์วงเงินกู้ ถ้ามีหนี้เดิมต่อไปนี้" count={reds.length} editing={editing} onAdd={addRed} minWidth={900}
        sub="ยืดหยุ่นกว่ากฎห้ามกู้ — อนุญาตให้กู้ได้แต่ลดเพดานวงเงินตามจำนวนงวดที่ผ่อนสัญญาเดิมมาแล้ว">
        <thead>
          <tr>
            <th rowSpan={2} style={{ minWidth: 200 }}>โครงการเงินกู้ที่มีแล้ว</th>
            <th colSpan={2} className="center group-col">จำนวนงวดที่ส่ง</th>
            <th colSpan={2} className="center group-col">สิทธิ์กู้ลดเหลือ</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">&ge;</th><th className="center sub-col">&le;</th>
            <th className="center sub-col">เท่าของเงินเดือน</th><th className="center sub-col">ไม่เกิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {reds.length === 0 && <tr><td colSpan={editing ? 6 : 5} className="center muted" style={{ padding: '20px' }}>ไม่มีเงื่อนไขลดสิทธิ์</td></tr>}
          {reds.map((r, i) => (
            <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
              <td><SubSel rows={reds} i={i} v={r.loanType} onChange={(v) => setRed(i, 'loanType', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} full v={r.periodFrom} onChange={(v) => setRed(i, 'periodFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.periodTo} inf={999} onChange={(v) => setRed(i, 'periodTo', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} full v={r.salaryMult} onChange={(v) => setRed(i, 'salaryMult', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} full v={r.maxAmount} decimals={0} onChange={(v) => setRed(i, 'maxAmount', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delRed(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 8 — เอกสารประกอบ
//  รายการประเภทเอกสารที่ใช้พิจารณาคำขอกู้ของผลิตภัณฑ์นี้ — กำหนดลำดับได้
//  (ลำดับนี้ถูกใช้แสดงในใบคำขอกู้ และในปุ่ม "ขอเอกสารเพิ่มเติม")
// ════════════════════════════════════════════════════════════════════
function LpTabDocs({ record, editing, onTable }) {
  const docs = record.docRequirements || [];
  const setDocs = (next) => onTable('docRequirements', next);
  const setDoc = (i, k, v) => setDocs(docs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addDoc = () => setDocs([...docs, { name: '', required: true, note: '' }]);
  const delDoc = (i) => setDocs(docs.filter((_, idx) => idx !== i));
  const moveDoc = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= docs.length) return;
    const next = [...docs];
    [next[i], next[j]] = [next[j], next[i]];
    setDocs(next);
  };

  return (
    <LpTableShell title="รายการประเภทเอกสาร" count={docs.length} editing={editing} onAdd={addDoc} addLabel="เพิ่มเอกสาร" minWidth={720}
      sub="แสดงในใบคำขอกู้ของผลิตภัณฑ์นี้ตามลำดับที่กำหนด — ใช้อ้างอิงเมื่อกดปุ่ม “ขอเอกสารเพิ่มเติม”">
      <thead>
        <tr>
          <th style={{ width: 40 }} className="center">ลำดับ</th>
          <th style={{ minWidth: 240 }}>ชื่อเอกสาร</th>
          <th className="center" style={{ width: 100 }}>บังคับ</th>
          <th style={{ minWidth: 220 }}>หมายเหตุ</th>
          {editing && <th className="center" style={{ width: 80 }} />}
        </tr>
      </thead>
      <tbody>
        {docs.length === 0 && <tr><td colSpan={editing ? 5 : 4} className="center muted" style={{ padding: '20px' }}>ยังไม่มีรายการเอกสาร</td></tr>}
        {docs.map((r, i) => (
          <tr key={i}>
            <td className="center mono">{i + 1}</td>
            <td><LpTxtCell editing={editing} v={r.name} onChange={(v) => setDoc(i, 'name', v)} /></td>
            <td className="center">
              <input type="checkbox" className="ct-check" checked={!!r.required} disabled={!editing} onChange={(e) => setDoc(i, 'required', e.target.checked)} />
            </td>
            <td><LpTxtCell editing={editing} v={r.note} onChange={(v) => setDoc(i, 'note', v)} /></td>
            {editing && (
              <td className="center">
                <div className="fs-row-acts">
                  <button className="bud-act fs-up" title="เลื่อนขึ้น" disabled={i === 0} onClick={() => moveDoc(i, -1)}><Icon name="chevDown" size={12} /></button>
                  <button className="bud-act" title="เลื่อนลง" disabled={i === docs.length - 1} onClick={() => moveDoc(i, 1)}><Icon name="chevDown" size={12} /></button>
                  <button className="bud-act danger act-del" title="ลบ" onClick={() => delDoc(i)}><Icon name="trash" size={12} /></button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </LpTableShell>
  );
}

Object.assign(window, {
  LpTabGeneral, LpTabLimit, LpTabInterest, LpTabCollateral,
  LpTabOffset, LpTabInstallment, LpTabRestrict, LpTabDocs,
});
