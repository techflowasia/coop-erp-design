// ════════════════════════════════════════════════════════════════════
//  ทะเบียนครุภัณฑ์ — ฟอร์มบันทึก/แก้ไข (AssetForm)
//  บันทึกข้อมูลในหน้าจอเดียว (popup) — ทุกส่วนเรียงต่อกันในโมดัล:
//   ข้อมูลทั่วไป · การได้มาและมูลค่า · สถานที่และผู้รับผิดชอบ
//   · ค่าเสื่อมและบัญชี · ประกันและบำรุงรักษา · เอกสารแนบ
//  รองรับหมวด "ใช้แล้วหมดไป" และ "Software" ที่ไม่คิดค่าเสื่อมราคา
// ════════════════════════════════════════════════════════════════════

function AsField({ label, hint, required, full, wide, children }) {
  return (
    <div className={"vch-field" + (full ? ' full' : '') + (wide ? ' as-wide' : '')}>
      <label className="vch-label">
        {label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="vch-hint"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function AsTabCard({ title, sub, right, children }) {
  return (
    <div className="search-card vch-card">
      <div className="vch-sec-head">
        <span className="head-bar" />
        <div style={{ minWidth: 0 }}>
          <h3>{title}</h3>
          {sub && <div className="vch-sec-sub muted">{sub}</div>}
        </div>
        {right && <div className="vch-sec-right">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function AsWarrantyBadge({ asset }) {
  const w = window.astWarranty(asset);
  if (w.state === 'none') return null;
  if (w.state === 'expired') return <span className="pill bad">หมดประกันแล้ว {Math.abs(w.days)} วัน</span>;
  if (w.state === 'soon') return <span className="pill warn">ใกล้หมดประกัน · เหลือ {w.days} วัน</span>;
  return <span className="pill ok">อยู่ในประกัน · เหลือ {w.days} วัน</span>;
}

function AssetForm({ asset, assets, onSave, onCancel, onToast }) {
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(asset)));
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  const isNew = !!d._new;
  const isReg = !!d._registering;   // โหมดขึ้นทะเบียนครุภัณฑ์ที่รับเข้า
  const regBulk = window.astCatBulk(d.category);
  const regQty = isReg ? Math.max(1, Number(d.received) || 1) : 1;
  const regSplit = isReg && !regBulk && regQty > 1;   // จะแยกรหัสต่อชิ้น
  const cat = window.astCat(d.category);
  const noDep = !!(cat && cat.noDep);
  const onHand = window.astOnHand(d);
  const ss = window.astStockState(d);
  const vlabel = (v) => (window.AST_VENDORS.find(x => x.v === v) || {}).l || v || '—';
  const dlabel = (v) => (window.AST_DEPARTMENTS.find(x => x.v === v) || {}).l || v || '—';

  // เปลี่ยนหมวดหมู่: อัปเดตรหัส (เฉพาะรายการใหม่) + Auto-fill อายุ/วิธีค่าเสื่อม
  const changeCategory = (catId) => {
    setD(prev => {
      const newCat = window.astCat(catId);
      const oldCat = window.astCat(prev.category);
      const lifeAuto = !prev.life || (oldCat && Number(prev.life) === oldCat.life);
      const next = { ...prev, category: catId };
      if (newCat && newCat.noDep) {
        next.depMethod = 'none'; next.life = 0;
      } else if (newCat) {
        if (lifeAuto) next.life = newCat.life;
        if (prev.depMethod === 'none') next.depMethod = 'straight';
      }
      if (prev._new && newCat) next.id = window.astNextId(assets, catId, prev.acquiredDate);
      return next;
    });
  };

  const changeAcquired = (iso) => {
    setD(prev => {
      const next = { ...prev, acquiredDate: iso };
      if (!prev._depTouched) next.depStart = iso;
      if (prev._new && prev.category) next.id = window.astNextId(assets, prev.category, iso);
      return next;
    });
  };

  const dep = window.astDepreciation(d);

  // ── ไฟล์แนบ (4 กลุ่ม) ──
  const addFiles = (key, e) => {
    const names = Array.from(e.target.files || []).map(f => f.name);
    if (names.length) setD(p => ({ ...p, [key]: [...(p[key] || []), ...names] }));
    e.target.value = '';
  };
  const removeFile = (key, i) => setD(p => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }));

  const validAndSave = () => {
    if (!d.name || !d.name.trim()) { onToast && onToast('กรุณาระบุชื่อครุภัณฑ์'); return; }
    if (!d.category) { onToast && onToast('กรุณาเลือกหมวดหมู่ครุภัณฑ์'); return; }
    if (assets.some(a => a.id === d.id && a !== asset)) {
      onToast && onToast(`รหัสครุภัณฑ์ ${d.id} ซ้ำกับรายการอื่น — โปรดแก้ไข`); return;
    }
    if (!(Number(d.cost) > 0)) { onToast && onToast('กรุณาระบุราคาทุนของครุภัณฑ์'); return; }
    onSave(d);
  };

  const stt = window.AST_STATUS[d.status] || window.AST_STATUS.in_use;
  const fileGroup = (label, hint, key, icon) => (
    <AsField label={label} hint={hint} full>
      <label className="sr-file-btn">
        <Icon name="attach" size={14} /> เลือกไฟล์เพื่ออัปโหลด…
        <input type="file" multiple style={{ display: 'none' }} onChange={(e) => addFiles(key, e)} />
      </label>
      {(d[key] || []).length > 0 && (
        <div className="sr-file-list">
          {d[key].map((nm, i) => (
            <span className="sr-file-chip" key={i}>
              <Icon name={icon} size={11} /><span className="nm">{nm}</span>
              <button type="button" onClick={() => removeFile(key, i)} title="ลบ"><Icon name="close" size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </AsField>
  );

  return (
    <div data-screen-label="หน้าบันทึก/แก้ไขครุภัณฑ์">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-card as-form-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name={isNew ? 'plus' : 'edit'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{isReg ? 'ขึ้นทะเบียนครุภัณฑ์' : (isNew ? 'เพิ่มครุภัณฑ์ใหม่' : 'แก้ไขครุภัณฑ์')}</h2>
            <div className="muted as-form-subhead">
              <span className="mono">{d.id}</span>
              <span className={"pill " + stt.pill}>{stt.l}</span>
              {noDep && <span className="chip info" style={{ fontSize: 10.5 }}>ไม่คิดค่าเสื่อม</span>}
            </div>
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body as-form-body">

      {isReg && (
        <div className={"as-reg-note" + (regSplit ? ' split' : '')}>
          <Icon name={regSplit ? 'column' : 'info'} size={15} />
          <div>
            {regSplit ? (
              <><b>รับเข้า {regQty} ชิ้น</b> — ระบบจะออกเลขทะเบียนให้ <b>{regQty} เลข (ชิ้นละ 1 เลข)</b> โดยใช้ข้อมูลชุดนี้ร่วมกัน — แก้ไขรายตัวภายหลังได้</>
            ) : (
              <>ดึงข้อมูลจากการรับเข้ามาขึ้นทะเบียน — ระบบออกเลขทะเบียนให้อัตโนมัติ โปรดกรอกข้อมูลที่เกี่ยวข้องให้ครบ{regBulk ? ' (หมวดใช้แล้วหมดไป — ขึ้นทะเบียนรวมรายการเดียว)' : ''}</>
            )}
          </div>
        </div>
      )}

      {/* ── ข้อมูลทั่วไป ── */}
        <AsTabCard title="ข้อมูลทั่วไป" sub="ระบุตัวตนและลักษณะของครุภัณฑ์">
          <div className="vch-grid g3">
            <AsField label="เลขทะเบียนครุภัณฑ์" required hint={regSplit ? `(ระบบออกเลข ${regQty} เลข — ชิ้นละ 1 เลข)` : (isReg ? '(ระบบออกเลขให้อัตโนมัติ)' : (isNew ? '(สร้างอัตโนมัติ — แก้ไขได้)' : ''))}>
              <input className="cfg-input mono" value={regSplit ? (d.id + ' …') : d.id} disabled={regSplit} onChange={(e) => set('id', e.target.value)} />
            </AsField>
            <AsField label="หมวดหมู่ (Category)" required>
              <SearchSelect value={d.category} onChange={changeCategory}
                placeholder="— เลือกหมวดหมู่ —" searchPlaceholder="พิมพ์ชื่อหรือรหัสหมวด…"
                options={window.AST_CATEGORIES.map(c => ({ value: c.id, label: c.name + (c.noDep ? ' (ไม่คิดค่าเสื่อม)' : ''), sub: c.prefix }))} />
            </AsField>
            <AsField label="สถานะครุภัณฑ์">
              <select className="cfg-input" value={d.status} onChange={(e) => set('status', e.target.value)}>
                {window.AST_STATUS_ORDER.map(k => <option key={k} value={k}>{window.AST_STATUS[k].l}</option>)}
              </select>
            </AsField>
            <AsField label="ชื่อครุภัณฑ์ (Asset Name)" required full>
              <input className="cfg-input" value={d.name} placeholder="เช่น คอมพิวเตอร์โน้ตบุ๊กสำหรับงานกราฟิก"
                     onChange={(e) => set('name', e.target.value)} />
            </AsField>
            <AsField label="ประเภท / ชนิด (Type)" hint="(เช่น โน้ตบุ๊ก, เซิร์ฟเวอร์, ลิขสิทธิ์การใช้งาน)">
              <input className="cfg-input" value={d.type} placeholder="ระบุประเภทย่อย"
                     onChange={(e) => set('type', e.target.value)} />
            </AsField>
            <AsField label="ยี่ห้อ (Brand)">
              <input className="cfg-input" value={d.brand} placeholder="เช่น Dell, Canon" onChange={(e) => set('brand', e.target.value)} />
            </AsField>
            <AsField label="รุ่น (Model)">
              <input className="cfg-input" value={d.model} placeholder="เช่น Precision 5680" onChange={(e) => set('model', e.target.value)} />
            </AsField>
            <AsField label="หมายเลขเครื่อง (Serial No.)"
                     hint={regSplit ? '(เพิ่มรายตัวได้หลังขึ้นทะเบียน)' : (isReg ? '(ระบุได้เลย หรือเพิ่มภายหลัง)' : '')}>
              <input className="cfg-input mono" value={d.serial || ''} disabled={regSplit}
                     placeholder={regSplit ? 'เพิ่มภายหลังเป็นรายตัว' : 'ระบุ Serial No. ของเครื่อง'}
                     onChange={(e) => set('serial', e.target.value)} />
            </AsField>
            <AsField label="รายละเอียดเพิ่มเติม" hint="(สเปค / หมายเหตุ)" full>
              <textarea className="cfg-input as-textarea" rows="2" value={d.detail}
                        placeholder="สเปคเพิ่มเติมหรือหมายเหตุประกอบ" onChange={(e) => set('detail', e.target.value)} />
            </AsField>
          </div>
        </AsTabCard>

      {/* ── การได้มาและมูลค่า ── */}
        <AsTabCard title="การได้มาและมูลค่า" sub="อ้างอิงที่มาของครุภัณฑ์ ราคาทุน ภาษี และแหล่งงบประมาณ">
          <div className="vch-grid g3">
            <AsField label="วันที่รับเข้า (Acquired Date)" required>
              <ErpDate value={d.acquiredDate} onChange={(v) => ((e) => changeAcquired(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </AsField>
            <AsField label="เอกสารซื้อ (PO / Invoice)">
              <input className="cfg-input mono" value={d.poNo} placeholder="PO / เลขที่ใบแจ้งหนี้" onChange={(e) => set('poNo', e.target.value)} />
            </AsField>
            <AsField label="ผู้ขาย / ผู้จัดจำหน่าย (Vendor)">
              <input className="cfg-input" value={d.vendor} placeholder="ระบุชื่อผู้ขาย / ผู้จัดจำหน่าย"
                     onChange={(e) => set('vendor', e.target.value)} />
            </AsField>
            <AsField label="ราคาทุน (Asset Cost)" required hint="(ฐานคิดค่าเสื่อม)">
              <div className="as-money-input">
                <span className="as-baht">฿</span>
                <input className="cfg-input mono num" type="number" inputMode="decimal" value={d.cost}
                       placeholder="0.00" onChange={(e) => set('cost', e.target.value)} />
              </div>
            </AsField>
            <AsField label="ภาษีมูลค่าเพิ่ม (VAT %)" hint="(รวมในราคาทุนแล้ว)">
              <select className="cfg-input" value={d.vat} onChange={(e) => set('vat', Number(e.target.value))}>
                <option value={0}>ไม่มี VAT</option>
                <option value={7}>7%</option>
              </select>
            </AsField>
            <AsField label="แหล่งงบประมาณ (Budget)">
              <select className="cfg-input" value={d.budget} onChange={(e) => set('budget', e.target.value)}>
                {window.AST_BUDGETS.map(b => <option key={b.v} value={b.v}>{b.l}</option>)}
              </select>
            </AsField>
          </div>
          {Number(d.cost) > 0 && Number(d.vat) > 0 && (
            <div className="as-vat-note muted">
              <Icon name="info" size={12} /> มูลค่าก่อน VAT ≈ ฿ {fmt.money(Number(d.cost) / (1 + Number(d.vat) / 100), 2)} ·
              VAT ≈ ฿ {fmt.money(Number(d.cost) - Number(d.cost) / (1 + Number(d.vat) / 100), 2)}
            </div>
          )}
        </AsTabCard>

      {/* ── สถานที่และผู้รับผิดชอบ ── */}
        <AsTabCard title="สถานที่และผู้รับผิดชอบ" sub="ติดตามว่าครุภัณฑ์อยู่ที่ไหนและใครเป็นผู้ถือครอง">
          <div className="vch-grid g3">
            <AsField label="หน่วยงาน / แผนก (Department)" required>
              <select className="cfg-input" value={d.department} onChange={(e) => set('department', e.target.value)}>
                <option value="">— เลือกหน่วยงาน —</option>
                {window.AST_DEPARTMENTS.map(dp => <option key={dp.v} value={dp.v}>{dp.l}</option>)}
              </select>
            </AsField>
            <AsField label="สาขา / สถานที่ตั้ง (Location)" required>
              <select className="cfg-input" value={d.location} onChange={(e) => set('location', e.target.value)}>
                <option value="">— เลือกสาขา/สถานที่ —</option>
                {window.AST_LOCATIONS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
              </select>
            </AsField>
            <AsField label="อาคาร (Building)">
              <input className="cfg-input" value={d.building} placeholder="เช่น อาคารอำนวยการ" onChange={(e) => set('building', e.target.value)} />
            </AsField>
            <AsField label="ห้อง (Room)">
              <input className="cfg-input" value={d.room} placeholder="ระบุห้อง/จุดติดตั้ง" onChange={(e) => set('room', e.target.value)} />
            </AsField>
            <AsField label="ผู้ถือครอง / ผู้รับผิดชอบ (Custodian)" full>
              <select className="cfg-input" value={d.custodian} onChange={(e) => set('custodian', e.target.value)}>
                <option value="">— เลือกผู้ถือครอง —</option>
                {window.AST_CUSTODIANS.map(c => <option key={c.v} value={c.v}>{c.v} · {c.l}</option>)}
              </select>
            </AsField>
          </div>
        </AsTabCard>

      {/* ── ค่าเสื่อมและบัญชี ── */}
        <AsTabCard title="ค่าเสื่อมราคาและบัญชี"
                   sub={noDep ? 'หมวดนี้เป็นประเภทไม่คิดค่าเสื่อมราคา — บันทึกเป็นค่าใช้จ่าย/สินทรัพย์ตามมูลค่าเต็ม' : 'คำนวณมูลค่าทางบัญชีตามวิธีและอายุการใช้งานที่กำหนด'}>
          <div className="as-acct-layout">
            <div className="vch-grid g2 as-acct-fields">
              <AsField label="ราคาทุน (Asset Cost)" required hint="(ฐานคิดค่าเสื่อม)">
                <div className="as-money-input">
                  <span className="as-baht">฿</span>
                  <input className="cfg-input mono num" type="number" value={d.cost} placeholder="0.00" onChange={(e) => set('cost', e.target.value)} />
                </div>
              </AsField>
              <AsField label="วิธีคิดค่าเสื่อมราคา">
                <select className="cfg-input" value={noDep ? 'none' : d.depMethod} disabled={noDep}
                        onChange={(e) => set('depMethod', e.target.value)}>
                  {window.AST_DEP_METHODS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </AsField>
              <AsField label="อายุการใช้งาน (ปี)" required={!noDep}
                       hint={noDep ? '(ไม่ใช้กับหมวดนี้)' : (cat ? `(ผูกกับหมวด: ${cat.life} ปี)` : '')}>
                <input className="cfg-input mono" type="number" value={noDep ? 0 : d.life} disabled={noDep}
                       placeholder="0" onChange={(e) => set('life', e.target.value)} />
              </AsField>
              <AsField label="ราคาซาก (Salvage Value)" hint="(ค่าเริ่มต้น 1.00 บาท)">
                <div className="as-money-input">
                  <span className="as-baht">฿</span>
                  <input className="cfg-input mono num" type="number" value={d.salvage} disabled={noDep}
                         placeholder="1.00" onChange={(e) => set('salvage', e.target.value)} />
                </div>
              </AsField>
              <AsField label="วันที่เริ่มคิดค่าเสื่อม" full>
                <ErpDate value={d.depStart} onChange={(v) => ((e) => setD(p => ({ ...p, depStart: e.target.value, _depTouched: true })))({ target: { value: v } })} disabled={noDep} className="cfg-input" />
              </AsField>
            </div>

            {noDep ? (
              <div className="as-dep-card as-nodep-card">
                <div className="as-dep-head"><Icon name="info" size={14} /><span>ไม่คิดค่าเสื่อมราคา</span></div>
                <p style={{ margin: '6px 0 10px', fontSize: 12.5, lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  ครุภัณฑ์หมวด <b>{cat ? cat.name : '—'}</b> ไม่นำเข้าสู่กระบวนการคิดค่าเสื่อมราคา
                  {d.category === 'consumable' ? ' — บันทึกเป็นวัสดุสิ้นเปลือง/ค่าใช้จ่ายเมื่อเบิกใช้' : ' — บันทึกตามมูลค่าสิทธิการใช้งาน'}
                </p>
                <div className="as-dep-grid">
                  <div className="as-dep-cell accent">
                    <span className="lbl">มูลค่าตามบัญชี</span>
                    <span className="val">฿ {fmt.money(Number(d.cost) || 0, 2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="as-dep-card">
                <div className="as-dep-head">
                  <Icon name="report" size={14} /><span>ประมาณการค่าเสื่อมราคา (ณ ปัจจุบัน)</span>
                </div>
                <div className="as-dep-grid">
                  <div className="as-dep-cell"><span className="lbl">ค่าเสื่อม/ปี</span><span className="val">฿ {fmt.money(dep.annual, 2)}</span></div>
                  <div className="as-dep-cell"><span className="lbl">ค่าเสื่อม/เดือน</span><span className="val">฿ {fmt.money(dep.monthly, 2)}</span></div>
                  <div className="as-dep-cell"><span className="lbl">ค่าเสื่อมสะสม</span><span className="val">฿ {fmt.money(dep.accumulated, 2)}</span></div>
                  <div className="as-dep-cell accent"><span className="lbl">มูลค่าตามบัญชี (สุทธิ)</span><span className="val">฿ {fmt.money(dep.bookValue, 2)}</span></div>
                </div>
                <div className="as-dep-bar"><div className="as-dep-bar-fill" style={{ width: Math.min(100, dep.pct) + '%' }} /></div>
                <div className="as-dep-foot muted">
                  {dep.done ? <><Icon name="info" size={11} /> คิดค่าเสื่อมครบอายุการใช้งานแล้ว · คงเหลือมูลค่าซาก</>
                    : <>เสื่อมแล้ว {dep.pct.toFixed(1)}% · ใช้งานมา {Math.floor(dep.monthsElapsed / 12)} ปี {dep.monthsElapsed % 12} เดือน</>}
                </div>
              </div>
            )}
          </div>
        </AsTabCard>

      {/* ── ประกันและบำรุงรักษา ── */}
        <AsTabCard title="ประกันและบำรุงรักษา" sub="เงื่อนไขการรับประกัน รอบบำรุงรักษา และการแจ้งเตือน"
                   right={<AsWarrantyBadge asset={d} />}>
          <div className="vch-grid g3">
            <AsField label="วันเริ่มรับประกัน">
              <ErpDate value={d.warrantyStart} onChange={(v) => ((e) => set('warrantyStart', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </AsField>
            <AsField label="วันสิ้นสุดรับประกัน" hint="(ระบบแจ้งเตือนเมื่อใกล้หมด)">
              <ErpDate value={d.warrantyEnd} onChange={(v) => ((e) => set('warrantyEnd', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </AsField>
            <AsField label="รอบบำรุงรักษา (PM Cycle)">
              <select className="cfg-input" value={d.pmCycle} onChange={(e) => set('pmCycle', e.target.value)}>
                {window.AST_PM_CYCLES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
            </AsField>
            <AsField label="ผู้ให้บริการ (Service Provider)">
              <select className="cfg-input" value={d.serviceProvider} onChange={(e) => set('serviceProvider', e.target.value)}>
                <option value="">— เลือกผู้ให้บริการ —</option>
                {window.AST_VENDORS.map(v => <option key={v.v} value={v.v}>{v.l}</option>)}
              </select>
            </AsField>
            <AsField label="แจ้งเตือนล่วงหน้า (วัน)" hint="(ก่อนหมดประกัน/ถึงรอบ PM)">
              <input className="cfg-input mono" type="number" value={d.alertDays} placeholder="30" onChange={(e) => set('alertDays', e.target.value)} />
            </AsField>
          </div>
        </AsTabCard>

      {/* ── สต็อกและการเคลื่อนไหว ── */}
        <AsTabCard title="สต็อกและการเคลื่อนไหว"
                   sub="ยอดคงเหลือคำนวณจากการรับเข้า/เบิกออก — ทำรายการได้ที่เมนู “รับเข้าครุภัณฑ์” และ “เบิกครุภัณฑ์”"
                   right={<span className={"pill " + ss.pill}>{ss.l}</span>}>
          <div className="as-stock-summary">
            <div className="as-stock-box"><span className="lbl">รับเข้าสะสม</span><span className="val">{Number(d.received) || 0} <i>{d.unit}</i></span></div>
            <div className="as-stock-box"><span className="lbl">เบิกออกสะสม</span><span className="val">{Number(d.issued) || 0} <i>{d.unit}</i></span></div>
            <div className="as-stock-box accent"><span className="lbl">คงเหลือในสต็อก</span><span className="val">{onHand} <i>{d.unit}</i></span></div>
          </div>
          <div className="vch-grid g3" style={{ marginTop: 12 }}>
            <AsField label="หน่วยนับ (Unit)">
              <input className="cfg-input" value={d.unit} placeholder="เช่น เครื่อง, ชิ้น, ชุด, กล่อง" onChange={(e) => set('unit', e.target.value)} />
            </AsField>
            <AsField label="จุดแจ้งเตือนขั้นต่ำ (Min)" hint="(แจ้งใกล้หมดเมื่อคงเหลือ ≤ ค่านี้)">
              <input className="cfg-input mono" type="number" value={d.minQty} placeholder="0" onChange={(e) => set('minQty', e.target.value)} />
            </AsField>
          </div>
          <div className="table-wrap" style={{ border: 0, marginTop: 12 }}>
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead><tr>
                <th style={{ width: 122 }}>เลขที่</th>
                <th style={{ width: 100 }}>วันที่</th>
                <th style={{ width: 92 }}>ประเภท</th>
                <th className="right" style={{ width: 86 }}>จำนวน</th>
                <th>รายละเอียด</th>
              </tr></thead>
              <tbody>
                {(!d.movements || d.movements.length === 0) && (
                  <tr><td colSpan="5" className="center muted" style={{ padding: '20px 12px' }}>ยังไม่มีการเคลื่อนไหว — รับเข้า/เบิกได้จากเมนูที่เกี่ยวข้อง</td></tr>
                )}
                {(d.movements || []).map(m => {
                  const mt = window.AST_MOVE_TYPES[m.type] || {};
                  return (
                    <tr key={m.id}>
                      <td className="mono" style={{ fontSize: 12 }}>{m.id}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{fmt.date(m.date)}</td>
                      <td><span className={"pill " + mt.pill}>{mt.l}</span></td>
                      <td className="right mono" style={{ fontWeight: 600 }}>{mt.sign > 0 ? '+' : '−'}{m.qty}</td>
                      <td style={{ fontSize: 12.5 }}>
                        {m.type === 'receive'
                          ? (m.note || (m.party ? 'ผู้ส่งมอบ: ' + vlabel(m.party) : '—'))
                          : ((m.purpose || '—') + (m.dept ? ' · ' + dlabel(m.dept) : ''))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsTabCard>

      {/* ── เอกสารแนบ ── */}
        <AsTabCard title="เอกสารแนบ" sub="รูปภาพครุภัณฑ์ และเอกสารหลักฐาน (ใบกำกับภาษี / ใบรับประกัน / เอกสารซ่อม)">
          <div className="vch-grid g2">
            {fileGroup('รูปภาพครุภัณฑ์', '(.jpg, .png)', 'images', 'eye')}
            {fileGroup('ใบกำกับภาษี', '(.pdf — หลักฐานการซื้อ)', 'taxInvoices', 'receipt')}
            {fileGroup('ใบรับประกัน', '(.pdf — เงื่อนไขการรับประกัน)', 'docs', 'shield')}
            {fileGroup('เอกสารการซ่อม / บำรุงรักษา', '(.pdf — ใบแจ้งซ่อม/รายงาน PM)', 'repairDocs', 'cog')}
          </div>
        </AsTabCard>

        </div>

        <div className="as-form-foot">
          <button className="btn" onClick={onCancel}>ยกเลิก</button>
          <button className="btn primary" onClick={validAndSave}>
            <Icon name="check" /> {isReg ? (regSplit ? `ยืนยันขึ้นทะเบียน ${regQty} รายการ` : 'ยืนยันขึ้นทะเบียน') : (isNew ? 'บันทึกครุภัณฑ์' : 'บันทึกการแก้ไข')}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AssetForm, AsWarrantyBadge });
