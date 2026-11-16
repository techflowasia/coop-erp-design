// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — รับเข้าครุภัณฑ์ & เบิกครุภัณฑ์ (Stock)
//  ทำงานเชื่อมโยงกับ "ทะเบียนครุภัณฑ์" ผ่าน store เดียวกัน (astLoad/astSave):
//   • รับเข้า  → เพิ่มยอด received + คงเหลือในสต็อก
//   • เบิกออก  → เพิ่มยอด issued + ลดคงเหลือในสต็อก
//  ทุกรายการบันทึกเป็น movement เดียวกัน → แสดงในทะเบียนครุภัณฑ์
// ════════════════════════════════════════════════════════════════════

// ── ฟิลด์ในฟอร์ม (ใช้ภายในไฟล์นี้) ──
function SField({ label, hint, required, full, children }) {
  return (
    <div className={"vch-field" + (full ? ' full' : '')}>
      <label className="vch-label">
        {label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="vch-hint"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

// helper labels
const stkVendor = (v) => (window.AST_VENDORS.find(x => x.v === v) || {}).l || v || '—';
const stkDept = (v) => (window.AST_DEPARTMENTS.find(x => x.v === v) || {}).l || v || '—';
const stkCust = (v) => (window.AST_CUSTODIANS.find(x => x.v === v) || {}).l || v || '—';
const stkCat = (id) => (window.astCat(id) || {}).name || '—';

// ─── โมดัลทำรายการ รับเข้า / เบิกออก ────────────────────────────────
function StockMoveModal({ type, assets, onSubmit, onSubmitNew, onClose, onToast }) {
  const T = window.AST_MOVE_TYPES[type];
  const isReceive = type === 'receive';
  const opts = isReceive ? assets.filter(a => a.registered !== false) : assets.filter(a => window.astOnHand(a) > 0);

  // โหมดรับเข้า: 'new' (ครุภัณฑ์ใหม่) | 'existing' (ระบุรหัส). เบิกใช้ existing เสมอ
  const [rmode, setRmode] = useState('new');
  const newMode = isReceive && rmode === 'new';

  const [assetId, setAssetId] = useState(opts[0] ? opts[0].id : '');
  const sel = assets.find(a => a.id === assetId) || null;
  const onHand = sel ? window.astOnHand(sel) : 0;

  // ฟอร์มสำหรับ "ครุภัณฑ์ใหม่"
  const [nf, setNf] = useState({ name: '', category: 'it', unit: 'เครื่อง' });
  const setN = (k, v) => setNf(p => ({ ...p, [k]: v }));

  const [form, setForm] = useState({
    qty: 1, date: window.astToday(), doc: '',
    party: '', unitCost: '',
    dept: '', requester: '', purpose: '',
    note: '',
    images: [], docs: [],
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ไฟล์แนบ (รับเข้า) — รูปภาพ + เอกสารที่เกี่ยวข้อง
  const addFiles = (key, e) => {
    const names = Array.from(e.target.files || []).map(f => f.name);
    if (names.length) setForm(p => ({ ...p, [key]: [...(p[key] || []), ...names] }));
    e.target.value = '';
  };
  const removeFile = (key, i) => setForm(p => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));
  const fileGroup = (label, hint, key, icon) => (
    <SField label={label} hint={hint} full>
      <label className="sr-file-btn">
        <Icon name="attach" size={14} /> เลือกไฟล์เพื่ออัปโหลด…
        <input type="file" multiple style={{ display: 'none' }} onChange={(e) => addFiles(key, e)} />
      </label>
      {(form[key] || []).length > 0 && (
        <div className="sr-file-list">
          {form[key].map((nm, i) => (
            <span className="sr-file-chip" key={i}>
              <Icon name={icon} size={11} /><span className="nm">{nm}</span>
              <button type="button" onClick={() => removeFile(key, i)} title="ลบ"><Icon name="close" size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </SField>
  );

  // เติมค่าเริ่มต้นเมื่อเปลี่ยนครุภัณฑ์ที่เลือก (โหมด existing)
  React.useEffect(() => {
    if (!sel || newMode) return;
    setForm(p => ({
      ...p,
      party: isReceive ? (p.party || (sel.vendor && !p.party ? sel.vendor : p.party) || '') : p.party,
      unitCost: isReceive ? (p.unitCost === '' ? (sel.cost ?? '') : p.unitCost) : p.unitCost,
      dept: !isReceive ? (p.dept || sel.department || '') : p.dept,
    }));
    // eslint-disable-next-line
  }, [assetId, rmode]);

  const submit = () => {
    const qty = Number(form.qty);
    if (!(qty > 0)) { onToast && onToast('กรุณาระบุจำนวนให้ถูกต้อง'); return; }
    const by = 'นางจันทร์เพ็ญ มาลี';

    if (newMode) {
      if (!nf.name.trim()) { onToast && onToast('กรุณาระบุชื่อครุภัณฑ์'); return; }
      if (!nf.category) { onToast && onToast('กรุณาเลือกหมวดครุภัณฑ์'); return; }
      onSubmitNew && onSubmitNew({
        name: nf.name.trim(), category: nf.category, unit: nf.unit.trim() || 'หน่วย',
        qty, date: form.date, doc: form.doc.trim(), party: form.party.trim(),
        unitCost: Number(form.unitCost) || 0, note: form.note.trim(), by,
        images: form.images, docs: form.docs,
      });
      return;
    }

    if (!assetId || !sel) { onToast && onToast('กรุณาเลือกครุภัณฑ์'); return; }
    if (!isReceive && qty > onHand) {
      onToast && onToast(`เบิกได้ไม่เกินคงเหลือ ${onHand} ${sel.unit}`); return;
    }
    const id = window.astMoveNextId(assets, type, form.date);
    const mv = isReceive
      ? { id, type, date: form.date, qty, doc: form.doc.trim(), party: form.party.trim(), unitCost: Number(form.unitCost) || 0, note: form.note.trim(), images: form.images, docs: form.docs, by }
      : { id, type, date: form.date, qty, doc: form.doc.trim(), dept: form.dept, requester: form.requester, purpose: form.purpose.trim(), issueType, note: form.note.trim(), by };
    onSubmit(assetId, mv);
  };

  const [issueType, setIssueType] = useState('internal');
  const newOnHand = isReceive ? onHand + (Number(form.qty) || 0) : Math.max(0, onHand - (Number(form.qty) || 0));

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose} />
      <div className="modal-card stk-modal" role="dialog" aria-modal="true" style={{ zIndex: 1101, top: 'calc(50% + 32px)', maxHeight: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name={T.icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{isReceive ? 'รับครุภัณฑ์เข้าสต็อก' : 'ทำรายการเบิกครุภัณฑ์'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isReceive ? 'บันทึกการรับครุภัณฑ์เข้าจัดเก็บในคลังพัสดุ' : 'จ่ายครุภัณฑ์จากสต็อกให้หน่วยงาน/ผู้ขอเบิก'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body stk-modal-body" style={{ overflowY: 'auto', minHeight: 0 }}>
          {isReceive && (
            <div className="stk-mode-seg">
              <button type="button" className={"stk-mode-btn" + (rmode === 'new' ? ' active' : '')} onClick={() => setRmode('new')}>
                <span className="stk-mode-t">ครุภัณฑ์ใหม่</span>
                <span className="stk-mode-s">ยังไม่มีในระบบ — สร้างรายการใหม่</span>
              </button>
              <button type="button" className={"stk-mode-btn" + (rmode === 'existing' ? ' active' : '')} onClick={() => setRmode('existing')}>
                <span className="stk-mode-t">ครุภัณฑ์ในระบบ</span>
                <span className="stk-mode-s">รับเพิ่มด้วยรหัสครุภัณฑ์เดิม</span>
              </button>
            </div>
          )}

          {(!newMode && opts.length === 0) ? (
            <div className="stk-empty-note">
              <Icon name="info" size={14} /> ยังไม่มีครุภัณฑ์ที่มีคงเหลือให้เบิก — รับเข้าสต็อกก่อนทำรายการเบิก
            </div>
          ) : (
            <div className="vch-grid g2">
              {newMode ? (
                <>
                  <SField label="ชื่อครุภัณฑ์" required full>
                    <input className="cfg-input" value={nf.name} placeholder="เช่น คอมพิวเตอร์โน้ตบุ๊กสำหรับงานกราฟิก"
                           onChange={(e) => setN('name', e.target.value)} />
                  </SField>
                  <SField label="หมวดหมู่ (Category)" required>
                    <SearchSelect value={nf.category} onChange={(v) => setN('category', v)}
                      placeholder="— เลือกหมวดหมู่ —" searchPlaceholder="พิมพ์ชื่อหรือรหัสหมวด…"
                      options={window.AST_CATEGORIES.map(c => ({ value: c.id, label: c.name + (c.noDep ? ' (ไม่คิดค่าเสื่อม)' : ''), sub: c.prefix }))} />
                  </SField>
                  <SField label="หน่วยนับ (Unit)">
                    <input className="cfg-input" value={nf.unit} placeholder="เช่น เครื่อง, ชิ้น, ชุด, กล่อง"
                           onChange={(e) => setN('unit', e.target.value)} />
                  </SField>
                  <div className="stk-sel-banner full">
                    <div className="stk-sel-row">
                      <span className="chip">{stkCat(nf.category)}</span>
                      <span className="muted" style={{ fontSize: 12 }}>รับเข้าใหม่</span>
                      <Icon name="chevRight" size={13} />
                      <span className="muted" style={{ fontSize: 12 }}>คงเหลือเริ่มต้น</span>
                      <span className="stk-sel-onhand up">{Number(form.qty) || 0} <span className="u">{nf.unit || 'หน่วย'}</span></span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <SField label={isReceive ? 'ครุภัณฑ์ (ระบุรหัส)' : 'ครุภัณฑ์'} required full>
                    <select className="cfg-input" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                      <option value="">— เลือกครุภัณฑ์ —</option>
                      {opts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.id} · {a.name} — คงเหลือ {window.astOnHand(a)} {a.unit}
                        </option>
                      ))}
                    </select>
                  </SField>

                  {sel && (
                    <div className="stk-sel-banner full">
                      <div className="stk-sel-row">
                        <span className="chip">{stkCat(sel.category)}</span>
                        <span className="muted" style={{ fontSize: 12 }}>คงเหลือปัจจุบัน</span>
                        <span className="stk-sel-onhand">{onHand} <span className="u">{sel.unit}</span></span>
                        <Icon name="chevRight" size={13} />
                        <span className="muted" style={{ fontSize: 12 }}>หลังทำรายการ</span>
                        <span className={"stk-sel-onhand " + (isReceive ? 'up' : 'down')}>{newOnHand} <span className="u">{sel.unit}</span></span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <SField label="จำนวน" required hint={isReceive ? '' : `(เบิกได้ไม่เกิน ${onHand})`}>
                <div className="stk-qty">
                  <input className="cfg-input mono num" type="number" min="1" value={form.qty}
                         onChange={(e) => set('qty', e.target.value)} />
                  <span className="stk-qty-u">{newMode ? (nf.unit || 'หน่วย') : (sel ? sel.unit : 'หน่วย')}</span>
                </div>
              </SField>
              {isReceive ? <div className="full" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <SField label="วันที่รับเข้า" required>
                <window.ThaiDateField value={form.date} onChange={(v) => set('date', v)} />
              </SField>
              {(() => {
                const cat = (window.AST_CATEGORIES || []).find(c => c.id === (newMode ? nf.category : (sel && sel.category)));
                const life = cat && !cat.noDep ? Number(cat.life) || 0 : 0;
                if (!life || !form.date) return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .8fr) minmax(0, 1.2fr)', gap: 8, minWidth: 0 }}><SField label="อายุการใช้งาน">
                    <div className="cfg-input fbt-ro" style={{ display: 'flex', alignItems: 'center' }}>{cat && cat.noDep ? 'ไม่คิดค่าเสื่อม' : '— เลือกหมวดหมู่ —'}</div>
                  </SField>
                  <SField label="ค่าเสื่อมสิ้นสุด">
                    <div className="cfg-input fbt-ro" style={{ display: 'flex', alignItems: 'center' }}>—</div>
                  </SField></div>
                );
                const [y, m, d] = form.date.split('-').map(Number);
                const s = new Date(y, m - 1, d), e = new Date(y + life, m - 1, d - 1);
                const days = Math.round((e - s) / 86400000) + 1;
                const th = (dt) => String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0') + '/' + (dt.getFullYear() + 543);
                return (<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, .8fr) minmax(0, 1.2fr)', gap: 8, minWidth: 0 }}>
                  <SField label="อายุการใช้งาน">
                    <div className="cfg-input fbt-ro mono" style={{ display: 'flex', alignItems: 'center' }}>{life} ปี</div>
                  </SField>
                  <SField label="ค่าเสื่อมสิ้นสุด">
                    <div className="cfg-input fbt-ro" style={{ display: 'flex', alignItems: 'center', gap: 6 }} title={days.toLocaleString() + ' วัน'}>
                      <span className="mono">{th(e)}</span>
                      <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{days.toLocaleString()} วัน</span>
                    </div>
                  </SField>
                </div>);
              })()}
              </div> : (
              <SField label="วันที่เบิก" required>
                <window.ThaiDateField value={form.date} onChange={(v) => set('date', v)} />
              </SField>
              )}

              <SField label={isReceive ? 'เลขที่เอกสารรับ (GR / ใบส่งของ)' : 'เลขที่ใบเบิก'}
                      hint={isReceive ? '' : '(เว้นว่างเพื่อออกอัตโนมัติ)'}>
                <input className="cfg-input mono" value={form.doc} placeholder={isReceive ? 'GR / เลขที่ใบส่งของ' : 'ออกอัตโนมัติ'}
                       onChange={(e) => set('doc', e.target.value)} />
              </SField>

              {isReceive ? (
                <SField label="ชื่อ">
                  <input className="cfg-input" value={form.party} placeholder="ระบุชื่อผู้ส่งมอบ / ผู้ขาย"
                         onChange={(e) => set('party', e.target.value)} />
                </SField>
              ) : (
                <SField label="หน่วยงานผู้เบิก" required>
                  <select className="cfg-input" value={form.dept} onChange={(e) => set('dept', e.target.value)}>
                    <option value="">— เลือกหน่วยงาน —</option>
                    {window.AST_DEPARTMENTS.map(dp => <option key={dp.v} value={dp.v}>{dp.l}</option>)}
                  </select>
                </SField>
              )}

              {isReceive ? (
                <SField label="ราคาต่อหน่วย (ราคาทุน)" hint="(บาท)">
                  <div className="as-money-input">
                    <span className="as-baht">฿</span>
                    <input className="cfg-input mono num" type="number" value={form.unitCost} placeholder="0.00"
                           onChange={(e) => set('unitCost', e.target.value)} />
                  </div>
                </SField>
              ) : (
                <SField label="ผู้ขอเบิก / ผู้รับของ">
                  <select className="cfg-input" value={form.requester} onChange={(e) => set('requester', e.target.value)}>
                    <option value="">— เลือกผู้ขอเบิก —</option>
                    {window.AST_CUSTODIANS.map(c => <option key={c.v} value={c.v}>{c.v} · {c.l}</option>)}
                  </select>
                </SField>
              )}

              {!isReceive && (
                <SField label="ประเภทการเบิก" required full>
                  <select className="cfg-input" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                    {STK_ISSUE_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </SField>
              )}
              {!isReceive && (
                <SField label="วัตถุประสงค์การเบิก" full>
                  <input className="cfg-input" value={form.purpose} placeholder="เช่น เบิกไปใช้งานที่ฝ่าย / ทดแทนของเดิม"
                         onChange={(e) => set('purpose', e.target.value)} />
                </SField>
              )}

              <SField label="หมายเหตุ" full>
                <input className="cfg-input" value={form.note} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                       onChange={(e) => set('note', e.target.value)} />
              </SField>

              {isReceive && (
                <>
                  {fileGroup('รูปภาพครุภัณฑ์', '(.jpg, .png — ภาพขณะรับมอบ)', 'images', 'eye')}
                  {fileGroup('เอกสารที่เกี่ยวข้อง', '(.pdf — ใบส่งของ / ใบกำกับภาษี / ใบรับประกัน)', 'docs', 'receipt')}
                </>
              )}

              {isReceive && Number(form.qty) > 0 && Number(form.unitCost) > 0 && (
                <div className="as-vat-note muted full" style={{ marginTop: 0 }}>
                  <Icon name="info" size={12} /> มูลค่ารับเข้ารวม ≈ ฿ {fmt.money(Number(form.qty) * Number(form.unitCost), 2)}
                </div>
              )}

              {newMode && (
                <div className="as-vat-note muted full" style={{ marginTop: 0 }}>
                  <Icon name="info" size={12} /> หลังรับเข้า ระบบจะสร้างรายการ “รอขึ้นทะเบียน” — ไปขึ้นทะเบียนและออกเลขครุภัณฑ์ที่เมนูทะเบียนครุภัณฑ์
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stk-modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit} disabled={!newMode && opts.length === 0}>
            <Icon name={T.icon} /> {isReceive ? 'บันทึกรับเข้า' : 'บันทึกการเบิก'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── หน้าหลัก รับเข้า / เบิกออก (ใช้โครงเดียวกัน) ───────────────────
function StockMoveEditModal({ move, assets, onSave, onClose, onToast }) {
  const isReceive = move.type === 'receive';
  const asset = assets.find(a => a.id === move.assetId) || {};
  const [eType, setEType] = React.useState(move.issueType || 'internal');
  const [f, setF] = useState({
    qty: move.qty, date: move.date, doc: move.doc || '',
    party: move.party || '', unitCost: move.unitCost != null ? move.unitCost : '',
    dept: move.dept || '', requester: move.requester || '', purpose: move.purpose || '',
    note: move.note || '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const save = () => {
    const qty = Number(f.qty);
    if (!(qty > 0)) { onToast && onToast('กรุณาระบุจำนวนให้ถูกต้อง'); return; }
    const patch = isReceive
      ? { qty, date: f.date, doc: f.doc.trim(), party: f.party.trim(), unitCost: Number(f.unitCost) || 0, note: f.note.trim() }
      : { qty, date: f.date, doc: f.doc.trim(), dept: f.dept, requester: f.requester, issueType: eType, purpose: f.purpose.trim(), note: f.note.trim() };
    onSave(move.assetId, move, patch);
  };

  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={onClose} />
      <div className="modal-card stk-modal" role="dialog" aria-modal="true" style={{ zIndex: 1101, top: 'calc(50% + 32px)', maxHeight: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name="edit" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>แก้ไขรายการ{isReceive ? 'รับเข้า' : 'เบิก'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              <span className="mono">{move.id}</span> · {move.assetName} <span className="mono">({move.assetId})</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body stk-modal-body">
          <div className="as-vat-note muted full" style={{ marginTop: 0, marginBottom: 12 }}>
            <Icon name="info" size={12} /> แก้ไขย้อนหลัง — ระบบจะปรับยอดคงเหลือในทะเบียนครุภัณฑ์ให้อัตโนมัติ
          </div>
          <div className="vch-grid g2">
            <SField label="จำนวน" required hint={isReceive ? '' : `(รับเข้าสะสม ${asset.received || 0} ${move.unit})`}>
              <div className="stk-qty">
                <input className="cfg-input mono num" type="number" min="1" value={f.qty} onChange={(e) => set('qty', e.target.value)} />
                <span className="stk-qty-u">{move.unit}</span>
              </div>
            </SField>
            <SField label={isReceive ? 'วันที่รับเข้า' : 'วันที่เบิก'} required>
              <window.ThaiDateField value={f.date} onChange={(v) => set('date', v)} />
            </SField>
            {!isReceive && (
              <SField label="ประเภทการเบิก" required>
                <select className="cfg-input" value={eType} onChange={(e) => setEType(e.target.value)}>
                  {(window.STK_ISSUE_TYPES || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </SField>
            )}

            <SField label={isReceive ? 'เลขที่เอกสารรับ (GR / ใบส่งของ)' : 'เลขที่ใบเบิก'} full>
              <input className="cfg-input mono" value={f.doc} onChange={(e) => set('doc', e.target.value)} />
            </SField>

            {isReceive ? (
              <>
                <SField label="ผู้ส่งมอบ / ผู้ขาย">
                  <input className="cfg-input" value={f.party} onChange={(e) => set('party', e.target.value)} />
                </SField>
                <SField label="ราคาต่อหน่วย (ราคาทุน)" hint="(บาท)">
                  <div className="as-money-input">
                    <span className="as-baht">฿</span>
                    <input className="cfg-input mono num" type="number" value={f.unitCost} placeholder="0.00" onChange={(e) => set('unitCost', e.target.value)} />
                  </div>
                </SField>
              </>
            ) : (
              <>
                <SField label="หน่วยงานผู้เบิก" required>
                  <select className="cfg-input" value={f.dept} onChange={(e) => set('dept', e.target.value)}>
                    <option value="">— เลือกหน่วยงาน —</option>
                    {window.AST_DEPARTMENTS.map(dp => <option key={dp.v} value={dp.v}>{dp.l}</option>)}
                  </select>
                </SField>
                <SField label="ผู้ขอเบิก / ผู้รับของ">
                  <select className="cfg-input" value={f.requester} onChange={(e) => set('requester', e.target.value)}>
                    <option value="">— เลือกผู้ขอเบิก —</option>
                    {window.AST_CUSTODIANS.map(c => <option key={c.v} value={c.v}>{c.v} · {c.l}</option>)}
                  </select>
                </SField>
                <SField label="วัตถุประสงค์การเบิก" full>
                  <input className="cfg-input" value={f.purpose} onChange={(e) => set('purpose', e.target.value)} />
                </SField>
              </>
            )}

            <SField label="หมายเหตุ" full>
              <input className="cfg-input" value={f.note} onChange={(e) => set('note', e.target.value)} />
            </SField>
          </div>
        </div>

        <div className="stk-modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={save}><Icon name="check" /> บันทึกการแก้ไข</button>
        </div>
      </div>
    </>
  );
}

function StockMoveDeleteModal({ move, onConfirm, onClose }) {
  const isReceive = move.type === 'receive';
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}>
            <Icon name="close" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>ลบรายการ{isReceive ? 'รับเข้า' : 'เบิก'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>ระบบจะปรับยอดคงเหลือในทะเบียนให้อัตโนมัติ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '2px 0 14px', fontSize: 13.5, lineHeight: 1.6 }}>
            ต้องการลบรายการ <b className="mono">{move.id}</b><br />
            <span className="muted">{move.assetName} · จำนวน {move.qty} {move.unit}</span> ใช่หรือไม่?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => onConfirm(move)}>
              <Icon name="close" /> ลบรายการ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

if (!document.getElementById('as-kpi-align-style')) {
  const st = document.createElement('style');
  st.id = 'as-kpi-align-style';
  st.textContent = '.as-kpi-strip { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }'
    + '.as-toolbar-eq .search { height: 32px; align-items: center; }'
    + '.as-toolbar-eq .search input { height: 100%; min-width: 0; }'
    + '.as-toolbar-eq .filter-select { height: 32px; }'
    + '.as-kpi { border-radius: 6px; gap: 6px; box-shadow: none; }'
    + '.as-kpi-lbl { font-size: 12.5px; font-weight: 600; color: var(--text); text-transform: none; letter-spacing: 0; }'
    + '.as-kpi-val { font-size: 22px; line-height: 1; overflow-wrap: anywhere; }'
    + '.as-kpi-val .u { font-size: 11.5px; font-weight: 400; }'
    + '.as-kpi.accent { background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.as-kpi.accent .as-kpi-lbl, .as-kpi.accent .as-kpi-val { color: #237450; }'
    + '.as-kpi-sub { font-size: 11px; }'
    + '@media (max-width: 640px) { .as-kpi-strip { grid-template-columns: 1fr 1fr; } .as-kpi-val { font-size: 19px; } }';
  document.head.appendChild(st);
}

function StockWorkspace({ type, onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [assets, setAssets] = useState(window.astLoad);
  const [show, setShow] = useState(false);
  const [editMove, setEditMove] = useState(null);
  const [delMove, setDelMove] = useState(null);
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [qD, setQD] = useState('');
  const [catD, setCatD] = useState('all');
  const [typeD, setTypeD] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const applySearch = () => { setQ(qD); setCatFilter(catD); setTypeFilter(typeD); };
  const resetSearch = () => { setQD(''); setCatD('all'); setTypeD('all'); setQ(''); setCatFilter('all'); setTypeFilter('all'); };

  const isReceive = type === 'receive';
  const T = window.AST_MOVE_TYPES[type];
  const persist = (next) => { setAssets(next); window.astSave(next); };

  const handleSubmit = (assetId, mv) => {
    const next = window.astApplyMovement(assets, assetId, mv);
    persist(next);
    const a = next.find(x => x.id === assetId);
    audit.log({
      action: 'create', module: isReceive ? 'บัญชี — รับเข้าครุภัณฑ์' : 'บัญชี — เบิกครุภัณฑ์',
      target: `${mv.id} · ${assetId}`,
      summary: `${isReceive ? 'รับเข้า' : 'เบิก'}ครุภัณฑ์ ${assetId} จำนวน ${mv.qty} ${a ? a.unit : 'หน่วย'} (คงเหลือ ${window.astOnHand(a)} ${a ? a.unit : ''})`,
    });
    onToast && onToast(`${isReceive ? 'รับเข้า' : 'เบิก'}ครุภัณฑ์ ${assetId} จำนวน ${mv.qty} ${a ? a.unit : ''} เรียบร้อย · คงเหลือ ${window.astOnHand(a)}`);
    setShow(false);
  };

  // รับเข้า“ครุภัณฑ์ใหม่” — สร้างรายการรอขึ้นทะเบียน (registered:false) + ลงรายการรับเข้า
  const handleSubmitNew = (p) => {
    const today = p.date;
    const cat = window.astCat(p.category) || {};
    const pendingId = window.astPendingId(assets, today);
    const base = window.astNormalize({
      id: pendingId, registered: false,
      name: p.name, category: p.category, type: '', brand: '', model: '', serial: '',
      status: 'idle', detail: '',
      acquiredDate: today, vendor: '', poNo: p.doc, vat: 7, budget: '',
      warrantyStart: '', warrantyEnd: '',
      location: 'store', building: '', room: '', department: '', custodian: '',
      cost: Number(p.unitCost) || 0, life: cat.life || 5, salvage: 1, depStart: today, depMethod: cat.noDep ? 'none' : 'straight',
      pmCycle: '', serviceProvider: '', alertDays: 30,
      unit: p.unit, minQty: 0, received: 0, issued: 0,
      images: p.images || [], docs: [], taxInvoices: p.docs || [], repairDocs: [], history: [], movements: [],
    });
    const mvId = window.astMoveNextId([base], 'receive', today);
    const mv = { id: mvId, type: 'receive', date: today, qty: p.qty, doc: p.doc, party: p.party, unitCost: Number(p.unitCost) || 0, note: p.note, by: p.by };
    base.received = p.qty;
    base.movements = [mv];
    const next = [base, ...assets];
    persist(next);
    audit.log({
      action: 'create', module: 'บัญชี — รับเข้าครุภัณฑ์',
      target: `${mvId} · ${pendingId}`,
      summary: `รับเข้าครุภัณฑ์ใหม่ “${p.name}” จำนวน ${p.qty} ${p.unit} (รอขึ้นทะเบียน)`,
    });
    onToast && onToast(`รับเข้าครุภัณฑ์ใหม่ “${p.name}” จำนวน ${p.qty} ${p.unit} — รอขึ้นทะเบียนที่เมนูทะเบียนครุภัณฑ์`);
    setShow(false);
  };

  // แก้ไขรายการย้อนหลัง — ปรับยอด received/issued ตามส่วนต่างจำนวน
  const handleEditSave = (assetId, oldMv, patch) => {
    const a0 = assets.find(x => x.id === assetId);
    const dq = (Number(patch.qty) || 0) - (Number(oldMv.qty) || 0);
    if (!isReceive && a0) {
      const newIssued = (Number(a0.issued) || 0) + dq;
      if (newIssued > (Number(a0.received) || 0)) {
        onToast && onToast(`แก้ไขไม่ได้ — ยอดเบิกรวมจะเกินยอดรับเข้า (${a0.received} ${a0.unit})`);
        return;
      }
    }
    const next = assets.map(a => {
      if (a.id !== assetId) return a;
      const movements = (a.movements || []).map(mm => (mm.id === oldMv.id ? { ...mm, ...patch } : mm));
      const upd = { ...a, movements };
      if (oldMv.type === 'receive') upd.received = Math.max(0, (Number(a.received) || 0) + dq);
      else upd.issued = Math.max(0, (Number(a.issued) || 0) + dq);
      return upd;
    });
    persist(next);
    audit.log({
      action: 'update', module: isReceive ? 'บัญชี — รับเข้าครุภัณฑ์' : 'บัญชี — เบิกครุภัณฑ์',
      target: `${oldMv.id} · ${assetId}`,
      summary: `แก้ไขรายการ${isReceive ? 'รับเข้า' : 'เบิก'} ${oldMv.id} (จำนวน ${oldMv.qty} → ${patch.qty})`,
    });
    onToast && onToast(`แก้ไขรายการ ${oldMv.id} เรียบร้อยแล้ว`);
    setEditMove(null);
  };

  // ลบรายการย้อนหลัง — ปรับยอดกลับ
  const handleDeleteMove = (m) => {
    const next = assets.map(a => {
      if (a.id !== m.assetId) return a;
      const movements = (a.movements || []).filter(mm => mm.id !== m.id);
      const upd = { ...a, movements };
      if (m.type === 'receive') upd.received = Math.max(0, (Number(a.received) || 0) - (Number(m.qty) || 0));
      else upd.issued = Math.max(0, (Number(a.issued) || 0) - (Number(m.qty) || 0));
      return upd;
    });
    persist(next);
    audit.log({
      action: 'delete', module: isReceive ? 'บัญชี — รับเข้าครุภัณฑ์' : 'บัญชี — เบิกครุภัณฑ์',
      target: `${m.id} · ${m.assetId}`,
      summary: `ลบรายการ${isReceive ? 'รับเข้า' : 'เบิก'} ${m.id} (${m.assetName} จำนวน ${m.qty} ${m.unit})`,
    });
    onToast && onToast(`ลบรายการ ${m.id} ออกจากประวัติแล้ว`);
    setDelMove(null);
  };

  const moves = window.astMovements(assets, type);
  const filtered = moves.filter(m => {
    if (catFilter !== 'all' && m.category !== catFilter) return false;
    if (typeFilter !== 'all' && (m.issueType || 'internal') !== typeFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return [m.id, m.assetId, m.assetName, m.doc].some(x => (x || '').toLowerCase().includes(n));
    }
    return true;
  });

  // KPIs
  const totalQty = moves.reduce((s, m) => s + (Number(m.qty) || 0), 0);
  const inStock = assets.filter(a => window.astOnHand(a) > 0).length;
  const totalValue = moves.reduce((s, m) => s + (Number(m.qty) || 0) * (Number(m.unitCost) || 0), 0);
  const lowOut = assets.filter(a => { const s = window.astStockState(a).state; return s === 'low' || s === 'out'; }).length;

  return (
    <div data-screen-label={isReceive ? 'หน้ารับเข้าครุภัณฑ์' : 'หน้าเบิกครุภัณฑ์'}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{isReceive ? 'รับเข้าครุภัณฑ์' : 'เบิกครุภัณฑ์'}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {isReceive
              ? 'รับครุภัณฑ์เข้าจัดเก็บในสต็อก พร้อมปรับยอดคงเหลือในทะเบียนครุภัณฑ์อัตโนมัติ'
              : 'เบิกครุภัณฑ์จากสต็อกไปใช้งาน พร้อมตัดยอดคงเหลือในทะเบียนครุภัณฑ์อัตโนมัติ'}
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setShow(true)}>
          <Icon name={isReceive ? 'download' : 'upload'} /> {isReceive ? 'รับครุภัณฑ์เข้าสต็อก' : 'ทำรายการเบิก'}
        </button>
      </div>

      {/* KPI */}
      <div className="as-kpi-strip">
        <div className="as-kpi">
          <span className="as-kpi-lbl">{isReceive ? 'รายการรับเข้าทั้งหมด' : 'รายการเบิกทั้งหมด'}</span>
          <span className="as-kpi-val">{moves.length.toLocaleString()} <span className="u">รายการ</span></span>
          <span className="as-kpi-sub">{isReceive ? 'บันทึกการรับเข้าสะสม' : 'บันทึกการเบิกสะสม'}</span>
        </div>
        <div className="as-kpi">
          <span className="as-kpi-lbl">{isReceive ? 'จำนวนหน่วยรับเข้ารวม' : 'จำนวนหน่วยเบิกรวม'}</span>
          <span className="as-kpi-val">{totalQty.toLocaleString()} <span className="u">หน่วย</span></span>
          <span className="as-kpi-sub">รวมทุกครุภัณฑ์</span>
        </div>
        {isReceive ? (
          <div className="as-kpi accent">
            <span className="as-kpi-lbl">มูลค่ารับเข้ารวม</span>
            <span className="as-kpi-val">฿ {fmt.money(totalValue, 0)}</span>
            <span className="as-kpi-sub">ตามราคาทุนต่อหน่วย</span>
          </div>
        ) : (
          <div className="as-kpi accent">
            <span className="as-kpi-lbl">ครุภัณฑ์พร้อมเบิก</span>
            <span className="as-kpi-val">{inStock} <span className="u">รายการ</span></span>
            <span className="as-kpi-sub">มีคงเหลือในสต็อก</span>
          </div>
        )}
        <div className="as-kpi">
          <span className="as-kpi-lbl">{isReceive ? 'ครุภัณฑ์มีในสต็อก' : 'ใกล้หมด / หมดสต็อก'}</span>
          <span className="as-kpi-val">{isReceive ? inStock : lowOut} <span className="u">รายการ</span></span>
          <span className="as-kpi-sub">{isReceive ? 'มีคงเหลือมากกว่า 0' : 'ควรรับเข้าเพิ่ม'}</span>
        </div>
      </div>

      <div className="search-card fbt-card">
        <div className="toolbar as-toolbar-eq" style={{ flexWrap: 'wrap', padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}>
          <div className="search" style={{ flex: '1 1 280px', height: 32, boxSizing: 'border-box' }}>
            <Icon name="search" size={14} />
            <input value={qD} onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                   placeholder="ค้นหาเลขที่เอกสาร, รหัส/ชื่อครุภัณฑ์…" />
          </div>
          <select className="filter-select" style={{ width: 220, flex: '0 0 220px' }} value={catD} onChange={(e) => setCatD(e.target.value)}>
            <option value="all">ทุกหมวดหมู่</option>
            {window.AST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {!isReceive && (
            <select className="filter-select" style={{ width: 220, flex: '0 0 220px' }} value={typeD} onChange={(e) => setTypeD(e.target.value)}>
              <option value="all">ทุกประเภทการเบิก</option>
              {STK_ISSUE_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          )}
          <button className="btn primary" style={{ height: 32 }} onClick={applySearch}>ค้นหา</button>
          <button className="btn" style={{ height: 32 }} onClick={resetSearch}>รีเซ็ต</button>
        </div>

        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ width: 134 }}>{isReceive ? 'เลขที่รับเข้า' : 'เลขที่ใบเบิก'}</th>
                <th style={{ width: 104 }}>วันที่</th>
                <th style={{ minWidth: 230 }}>ครุภัณฑ์</th>
                <th className="right" style={{ width: 96 }}>จำนวน</th>
                {!isReceive && <th style={{ width: 150 }}>ประเภทการเบิก</th>}
                <th style={{ minWidth: 170 }}>{isReceive ? 'ผู้ส่งมอบ / ผู้ขาย' : 'หน่วยงานผู้เบิก'}</th>
                <th style={{ minWidth: 170 }}>{isReceive ? 'มูลค่า' : 'วัตถุประสงค์'}</th>
                <th style={{ width: 150 }}>ผู้ทำรายการ</th>
                <th className="center" style={{ width: 170 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={isReceive ? 8 : 9} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มี{isReceive ? 'การรับเข้า' : 'การเบิก'} — กดปุ่ม “{isReceive ? 'รับครุภัณฑ์เข้าสต็อก' : 'ทำรายการเบิก'}” เพื่อเริ่ม
                </td></tr>
              )}
              {filtered.map(m => (
                <tr key={m.id}>
                  <td className="mono">
                    {m.id}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{fmt.date(m.date)}</td>
                  <td>
                    <div className="lt-row-name">{m.assetName}</div>
                    <div className="lt-row-note muted"><span className="mono">{m.assetId}</span> · {stkCat(m.category)}</div>
                  </td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{m.qty} <span className="muted" style={{ fontWeight: 400 }}>{m.unit}</span></td>
                  {!isReceive && <td><span className="chip">{(STK_ISSUE_TYPES.find(o => o.v === (m.issueType || 'internal')) || {}).l}</span></td>}
                  <td>{isReceive ? stkVendor(m.party) : stkDept(m.dept)}</td>
                  <td>
                    {isReceive
                      ? <span className="mono">{m.unitCost ? '฿ ' + fmt.money(Number(m.qty) * Number(m.unitCost), 0) : '—'}</span>
                      : <span>{m.purpose || '—'}{m.requester ? <div className="lt-row-note muted">ผู้รับ: {stkCust(m.requester)}</div> : null}</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>{m.by || '—'}</td>
                  <td className="center">
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn sm ex-row-btn ex-edit-k" onClick={() => setEditMove(m)}><Icon name="edit" size={13} /> แก้ไข</button>
                      <button className="btn sm ex-row-btn del" onClick={() => setDelMove(m)}><Icon name="trash" size={13} /> ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ทุกรายการ{isReceive ? 'รับเข้า' : 'เบิก'}จะปรับยอดคงเหลือในทะเบียนครุภัณฑ์ทันที และแสดงเป็นประวัติการเคลื่อนไหวของครุภัณฑ์แต่ละรายการ
      </div>

      {show && <StockMoveModal type={type} assets={assets} onSubmit={handleSubmit} onSubmitNew={handleSubmitNew} onClose={() => setShow(false)} onToast={onToast} />}
      {editMove && <StockMoveEditModal move={editMove} assets={assets} onSave={handleEditSave} onClose={() => setEditMove(null)} onToast={onToast} />}
      {delMove && <StockMoveDeleteModal move={delMove} onConfirm={handleDeleteMove} onClose={() => setDelMove(null)} />}
    </div>
  );
}

const STK_ISSUE_TYPES = [
  { v: 'internal', l: 'เบิกใช้งานในองค์กร' },
  { v: 'donate',   l: 'บริจาค' },
  { v: 'destroy',  l: 'ทำลาย' },
];
window.STK_ISSUE_TYPES = STK_ISSUE_TYPES;
const AssetReceiveWorkspace = (props) => <StockWorkspace type="receive" {...props} />;
const AssetIssueWorkspace = (props) => <StockWorkspace type="issue" {...props} />;

Object.assign(window, { AssetReceiveWorkspace, AssetIssueWorkspace, StockWorkspace, StockMoveModal });
