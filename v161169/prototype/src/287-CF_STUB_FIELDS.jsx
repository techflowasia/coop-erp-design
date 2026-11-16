// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › ตั้งค่า — จัดการแบบเช็ค
//  ทะเบียนแบบฟอร์มเช็คของแต่ละธนาคาร (เลเซอร์ / ดอทเมทริกซ์)
//  กำหนดขนาดเช็คและพิกัดการพิมพ์แต่ละช่อง (ต้นขั้ว / หน้าเช็ค)
//  แก้พิกัดได้ทั้งจากช่องตัวเลขและการลากบนตัวอย่างเช็ค
// ════════════════════════════════════════════════════════════════════
const { useState: cfUseState, useRef: cfUseRef, useMemo: cfUseMemo } = React;

const CF_STUB_FIELDS = [
  { k: 'sDate',   l: 'วันที่',      sample: '02/06/2569' },
  { k: 'sAmount', l: 'จำนวนเงิน',   sample: '125,400.00' },
  { k: 'sName',   l: 'ชื่อ',        sample: 'นายสมชาย ใจดี' },
  { k: 'sAcct',   l: 'สกอ.',        sample: '050123' },
  { k: 'sNote',   l: 'หมายเหตุ',    sample: 'จ่ายเงินกู้สามัญ' },
];
const CF_FACE_FIELDS = [
  { k: 'fDate',   l: 'วันที่',                    sample: '02  06  2569' },
  { k: 'fPayee',  l: 'สั่งจ่าย',                  sample: 'นายสมชาย ใจดี' },
  { k: 'fNumber', l: 'จำนวนเงินตัวเลข',           sample: '**125,400.00' },
  { k: 'fText',   l: 'จำนวนเงินตัวอักษร',         sample: 'หนึ่งแสนสองหมื่นห้าพันสี่ร้อยบาทถ้วน' },
  { k: 'fBearer', l: 'ตัวขีดฆ่า “หรือผู้ถือ”',    sample: '━━━━━━' },
];
const CF_ALL_FIELDS = [...CF_STUB_FIELDS, ...CF_FACE_FIELDS];

const CF_BANKS = [
  { code: 'BBL',  name: 'ธ.กรุงเทพ (BBL)' },
  { code: 'KBNK', name: 'ธ.กสิกรไทย' },
  { code: 'KTB',  name: 'ธ.กรุงไทย' },
  { code: 'SCB',  name: 'ธ.ไทยพาณิชย์' },
  { code: 'SCIB', name: 'ธ.นครหลวงไทย' },
  { code: 'BT',   name: 'ธ.ไทยธนาคาร' },
  { code: 'GSB',  name: 'ธ.ออมสิน' },
];

// พิกัดตั้งต้น (มม. วัดจากมุมบนซ้ายของเช็ค)
const CF_BASE_POS = {
  sDate:   { x: 12,  y: 16 },
  sAmount: { x: 12,  y: 26 },
  sName:   { x: 12,  y: 36 },
  sAcct:   { x: 12,  y: 46 },
  sNote:   { x: 12,  y: 56 },
  fDate:   { x: 138, y: 18 },
  fPayee:  { x: 68,  y: 31 },
  fNumber: { x: 140, y: 31 },
  fText:   { x: 68,  y: 43 },
  fBearer: { x: 118, y: 31 },
};

function cfMakeTemplates() {
  const list = [];
  CF_BANKS.forEach((b, i) => {
    ['LAS', 'DOT'].forEach(mode => {
      const off = mode === 'DOT' ? 1.5 : 0;
      list.push({
        id: `${mode}-${b.code}-L`,
        mode, bank: b.name, bankCode: b.code, size: 'ใหญ่',
        width: 175, height: 80, stubWidth: 58,
        updated: `2569-0${(i % 6) + 1}-1${(i % 8) + 1}`,
        pos: Object.fromEntries(Object.entries(CF_BASE_POS).map(([k, v]) => [k, { x: v.x + off, y: v.y + off }])),
      });
    });
  });
  return list;
}

// แบบเช็คที่ถูกต้องต้องมี mode / bank / pos — ข้อมูลอื่นที่หลุดมาในคีย์นี้ (เช่น ตั้งยอดยกไป) จะถูกคัดออก
const chqfValid = (t) => t && typeof t.mode === 'string' && typeof t.bank === 'string' && t.pos && typeof t.pos === 'object';
function chqfLoad() {
  try {
    const raw = localStorage.getItem('coop.chequeFormats.v1');
    if (raw) {
      const all = JSON.parse(raw);
      if (Array.isArray(all)) {
        const ok = all.filter(chqfValid);
        const bad = all.filter(t => !chqfValid(t));
        if (bad.length) {
          // คืนรายการตั้งยอดยกไปที่หลุดมา กลับไปคีย์เดิม (ถ้าคีย์เดิมยังว่าง)
          try { if (!localStorage.getItem('coop_carry_forward_v1')) localStorage.setItem('coop_carry_forward_v1', JSON.stringify(bad)); } catch (e) {}
          const fixed = ok.length ? ok : cfMakeTemplates();
          try { localStorage.setItem('coop.chequeFormats.v1', JSON.stringify(fixed)); } catch (e) {}
          return fixed;
        }
        if (ok.length) return ok;
      }
    }
  } catch (e) { /* ignore */ }
  return cfMakeTemplates();
}
const chqfSave = (list) => { try { localStorage.setItem('coop.chequeFormats.v1', JSON.stringify(list)); } catch (e) { /* ignore */ } };

const chqfNum = (v) => (Number.isFinite(+v) ? +v : 0);
const chqfFix = (n) => (Math.round(n * 100) / 100).toFixed(2);

// ─── ตัวอย่างเช็ค (ลากช่องเพื่อกำหนดตำแหน่ง) ─────────────────────────
function ChequeCanvas({ tpl, scale, active, onActive, onMove, showGuide }) {
  const ref = cfUseRef(null);
  const drag = cfUseRef(null);

  const down = (k) => (e) => {
    e.preventDefault();
    onActive(k);
    const box = ref.current.getBoundingClientRect();
    const p = tpl.pos[k];
    drag.current = { k, dx: e.clientX - box.left - p.x * scale, dy: e.clientY - box.top - p.y * scale };
    const move = (ev) => {
      const d = drag.current; if (!d) return;
      const b = ref.current.getBoundingClientRect();
      const nx = Math.max(0, Math.min(tpl.width, (ev.clientX - b.left - d.dx) / scale));
      const ny = Math.max(0, Math.min(tpl.height, (ev.clientY - b.top - d.dy) / scale));
      onMove(d.k, Math.round(nx * 10) / 10, Math.round(ny * 10) / 10);
    };
    const up = () => { drag.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <div className="cf-canvas-wrap">
      <div className="cf-sheet" ref={ref}
           style={{ width: tpl.width * scale, height: tpl.height * scale, backgroundSize: `${5 * scale}px ${5 * scale}px`, backgroundImage: showGuide ? undefined : 'none' }}>
        <div className="cf-stub-line" style={{ left: tpl.stubWidth * scale }} />
        <div className="cf-sheet-tag stub" style={{ width: tpl.stubWidth * scale }}>ต้นขั้ว</div>
        <div className="cf-sheet-tag face" style={{ left: tpl.stubWidth * scale }}>หน้าเช็ค</div>
        {CF_ALL_FIELDS.map(f => {
          const p = tpl.pos[f.k];
          const isStub = f.k[0] === 's';
          return (
            <div key={f.k} onPointerDown={down(f.k)}
                 className={'cf-chip' + (isStub ? ' stub' : '') + (active === f.k ? ' active' : '')}
                 style={{ left: p.x * scale, top: p.y * scale }}
                 title={`${f.l} — X ${chqfFix(p.x)} · Y ${chqfFix(p.y)}`}>
              {f.sample}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── โมดัลตัวอย่างก่อนพิมพ์ ──────────────────────────────────────────
function ChequePreviewModal({ tpl, onClose, onPrint }) {
  const scale = 3.4;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: tpl.width * scale + 66, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ตัวอย่างการพิมพ์เช็ค</h2>
            <div className="muted" style={{ fontSize: 11 }}>{tpl.bank} · {tpl.mode === 'LAS' ? 'เลเซอร์' : 'ดอทเมทริกซ์'} · ขนาด{tpl.size} {tpl.width}×{tpl.height} มม.</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="cf-preview-scroll">
            <div className="cf-sheet preview" style={{ width: tpl.width * scale, height: tpl.height * scale }}>
              <div className="cf-stub-line" style={{ left: tpl.stubWidth * scale }} />
              {CF_ALL_FIELDS.map(f => (
                <div key={f.k} className="cf-print-text" style={{ left: tpl.pos[f.k].x * scale, top: tpl.pos[f.k].y * scale }}>{f.sample}</div>
              ))}
            </div>
          </div>
          <div className="ap-hint" style={{ marginTop: 10 }}>
            <Icon name="info" size={13} /> ข้อความที่แสดงเป็นข้อมูลตัวอย่าง ใช้ตรวจตำแหน่งการพิมพ์เทียบกับแบบเช็คจริงก่อนใช้งาน
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ปิด</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onPrint}><Icon name="print" /> พิมพ์ทดสอบ</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── หน้าจอหลัก ──────────────────────────────────────────────────────
function ChequeFormatPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'จัดการแบบเช็ค', current: true }], []);
  const [list, setList] = cfUseState(chqfLoad);
  const [selId, setSelId] = cfUseState(() => (list[0] || {}).id);
  const [q, setQ] = cfUseState('');
  const [mode, setMode] = cfUseState('all');
  const [active, setActive] = cfUseState('fPayee');
  const [dirty, setDirty] = cfUseState(false);
  const [preview, setPreview] = cfUseState(false);

  const tpl = list.find(t => t.id === selId) || list[0];
  const filtered = list.filter(t => (mode === 'all' || t.mode === mode) && (!q.trim() || ((t.bank || '') + (t.bankCode || '')).toLowerCase().includes(q.trim().toLowerCase())));

  const patch = (fn) => { setList(ls => ls.map(t => (t.id === tpl.id ? fn(t) : t))); setDirty(true); };
  const setPos = (k, x, y) => patch(t => ({ ...t, pos: { ...t.pos, [k]: { x, y } } }));
  const setField = (key, v) => patch(t => ({ ...t, [key]: v }));

  const save = () => {
    const next = list.map(t => (t.id === tpl.id ? { ...t, updated: '2569-06-02' } : t));
    setList(next); chqfSave(next); setDirty(false);
    onToast && onToast(`บันทึกแบบเช็ค ${tpl.bank} (${tpl.mode}) เรียบร้อย`);
  };
  const reset = () => {
    patch(t => ({ ...t, pos: JSON.parse(JSON.stringify(CF_BASE_POS)) }));
    onToast && onToast('คืนค่าพิกัดเริ่มต้นของแบบเช็คนี้แล้ว');
  };

  const scale = 3.1;

  const posRow = (f) => {
    const p = tpl.pos[f.k];
    return (
      <div key={f.k} className={'cf-pos-row' + (active === f.k ? ' active' : '')} onClick={() => setActive(f.k)}>
        <span className="cf-pos-label">{f.l}</span>
        <label className="cf-pos-cell">
          <span>X</span>
          <input className="cfg-input mono sm" type="number" step="0.1" value={p.x}
                 onFocus={() => setActive(f.k)} onChange={e => setPos(f.k, chqfNum(e.target.value), p.y)} />
        </label>
        <label className="cf-pos-cell">
          <span>Y</span>
          <input className="cfg-input mono sm" type="number" step="0.1" value={p.y}
                 onFocus={() => setActive(f.k)} onChange={e => setPos(f.k, p.x, chqfNum(e.target.value))} />
        </label>
      </div>
    );
  };

  return (
    <div data-screen-label="หน้าจัดการแบบเช็ค">
      <div className="page-actions dep-open-sticky" ref={(el) => {
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
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>จัดการแบบเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 780 }}>
            กำหนดขนาดแบบฟอร์มเช็คของแต่ละธนาคาร และพิกัดการพิมพ์ของทุกช่องทั้งด้านต้นขั้วและหน้าเช็ค (หน่วยเป็นมิลลิเมตร วัดจากมุมบนซ้าย)
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" data-keep-top="" onClick={() => setPreview(true)}><Icon name="receipt" /> ตัวอย่าง</button>
        <button className="btn primary sm" data-keep-top="" disabled={!dirty} onClick={save}><Icon name="check" /> บันทึกแบบเช็ค</button>
      </div>

      <div className="cf-layout">
        {/* ── รายการแบบเช็ค ── */}
        <div className="search-card cf-list-card">
          <div className="section-head"><h3>รายการ</h3>
            <span className="muted" style={{ fontSize: 11 }}>{filtered.length} แบบ</span></div>
          <div className="dep-picker-input" style={{ margin: '10px 0 8px', height: 32, boxSizing: 'border-box' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาธนาคาร…" />
            {q && <button className="dep-picker-clear" onClick={() => setQ('')} aria-label="ล้าง"><Icon name="close" size={13} /></button>}
          </div>
          <div className="cf-mode-tabs">
            {[{ v: 'all', l: 'ทั้งหมด' }, { v: 'LAS', l: 'เลเซอร์' }, { v: 'DOT', l: 'ดอทเมทริกซ์' }].map(m => (
              <button key={m.v} className={'tab' + (mode === m.v ? ' active' : '')} onClick={() => setMode(m.v)}>{m.l}</button>
            ))}
          </div>
          <div className="cf-list">
            {filtered.map(t => (
              <button key={t.id} className={'cf-item' + (t.id === tpl.id ? ' sel' : '')} onClick={() => { setSelId(t.id); setActive('fPayee'); }}>
                <span className={'cf-mode-tag ' + String(t.mode || '').toLowerCase()}>{t.mode}</span>
                <span className="cf-item-name">{t.bank}</span>
                <span className="cf-item-size muted">{t.size}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="empty-state" style={{ padding: 20 }}>ไม่พบแบบเช็คตามเงื่อนไข</div>}
          </div>
        </div>

        {/* ── ตัวแก้ไข ── */}
        <div className="cf-editor">
          <div className="search-card">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <h3>ข้อมูลแบบเช็ค</h3>
              {dirty && <span className="chip warning" style={{ marginLeft: 'auto' }}>ยังไม่บันทึก</span>}
            </div>
            <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <label className="ap-field" style={{ gridColumn: 'span 2' }}>
                <span className="ap-label">ธนาคาร</span>
                <CfSelect className="cfg-input" value={tpl.bankCode}
                        onChange={e => { const b = CF_BANKS.find(x => x.code === e.target.value); patch(t => ({ ...t, bankCode: b.code, bank: b.name })); }}>
                  {CF_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </CfSelect>
              </label>
              <label className="ap-field">
                <span className="ap-label">ประเภทเครื่องพิมพ์</span>
                <CfSelect className="cfg-input" value={tpl.mode} onChange={e => setField('mode', e.target.value)}>
                  <option value="LAS">เลเซอร์ (LAS)</option>
                  <option value="DOT">ดอทเมทริกซ์ (DOT)</option>
                </CfSelect>
              </label>
              <label className="ap-field">
                <span className="ap-label">ขนาดเช็ค</span>
                <CfSelect className="cfg-input" value={tpl.size} onChange={e => setField('size', e.target.value)}>
                  <option value="ใหญ่">ใหญ่</option>
                  <option value="เล็ก">เล็ก</option>
                </CfSelect>
              </label>
              <label className="ap-field">
                <span className="ap-label">ความกว้าง (มม.)</span>
                <input className="cfg-input mono" type="number" step="0.5" value={tpl.width} onChange={e => setField('width', chqfNum(e.target.value))} />
              </label>
              <label className="ap-field">
                <span className="ap-label">ความสูง (มม.)</span>
                <input className="cfg-input mono" type="number" step="0.5" value={tpl.height} onChange={e => setField('height', chqfNum(e.target.value))} />
              </label>
              <label className="ap-field">
                <span className="ap-label">ความกว้างต้นขั้ว (มม.)</span>
                <input className="cfg-input mono" type="number" step="0.5" value={tpl.stubWidth} onChange={e => setField('stubWidth', chqfNum(e.target.value))} />
              </label>
              <div className="ap-field">
                <span className="ap-label">แก้ไขล่าสุด</span>
                <div className="cfg-display-box mono">{String(tpl.updated || '').split('-').reverse().join('/') || '—'}</div>
              </div>
            </div>
          </div>

          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head">
              <h3>ตำแหน่งการพิมพ์</h3>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn text sm" onClick={reset}><Icon name="refresh" /> คืนค่าเริ่มต้น</button>
            </div>

            <ChequeCanvas tpl={tpl} scale={scale} active={active} onActive={setActive} onMove={setPos} showGuide />
            <div className="cf-canvas-hint muted">
              <Icon name="info" size={12} /> ลากช่องข้อมูลบนตัวอย่างเพื่อกำหนดตำแหน่ง หรือพิมพ์ค่าพิกัดด้านล่าง · ตารางกริด 5 มม.
            </div>

            <div className="cf-pos-cols">
              <div className="cf-pos-group">
                <div className="cf-pos-head">ค่าคงที่ — ต้นขั้ว</div>
                {CF_STUB_FIELDS.map(posRow)}
              </div>
              <div className="cf-pos-group">
                <div className="cf-pos-head">ค่าคงที่ — หน้าเช็ค</div>
                {CF_FACE_FIELDS.map(posRow)}
              </div>
            </div>
          </div>

          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>
              {dirty ? 'มีการแก้ไขที่ยังไม่ได้บันทึก' : 'ข้อมูลแบบเช็คเป็นปัจจุบัน'}
            </span>
          </div>
        </div>
      </div>

      {preview && (
        <ChequePreviewModal tpl={tpl} onClose={() => setPreview(false)}
          onPrint={() => { setPreview(false); onToast && onToast('ส่งพิมพ์เช็คทดสอบไปยังเครื่องพิมพ์แล้ว'); }} />
      )}
    </div>
  );
}

// ─── Dropdown ที่วางรายการตรงกับช่อง (hover เขียวอ่อน) ─────────────
function CfSelect({ value, onChange, className, style, disabled, children }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrap = React.useRef(null);
  const place = () => { if (wrap.current) setRect(wrap.current.getBoundingClientRect()); };
  React.useEffect(() => {
    if (!open) return;
    place();
    const h = () => place();
    const out = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', out);
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { document.removeEventListener('mousedown', out); window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open]);

  const text = (n) => React.Children.toArray(n).map(x => (x && x.props ? text(x.props.children) : String(x == null ? '' : x))).join('');
  const opts = [];
  React.Children.forEach(children, (c) => {
    if (!c) return;
    if (Array.isArray(c)) c.forEach(o => o && o.props && opts.push({ value: o.props.value !== undefined ? o.props.value : text(o.props.children), label: text(o.props.children) }));
    else if (c.props) opts.push({ value: c.props.value !== undefined ? c.props.value : text(c.props.children), label: text(c.props.children) });
  });
  const same = (a) => String(a == null ? '' : a) === String(value == null ? '' : value);

  return (
    <div ref={wrap} style={Object.assign({ position: 'relative', width: '100%', minWidth: 0 }, style || {})}>
      <select className={className} value={value == null ? '' : value} disabled={disabled} onChange={onChange}
              onMouseDown={(e) => { if (!disabled) { e.preventDefault(); place(); setOpen(o => !o); } }}
              onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); place(); setOpen(o => !o); } }}
              style={{ width: '100%' }}>
        {children}
      </select>
      {open && rect && ReactDOM.createPortal((
        <div style={{ position: 'fixed', zIndex: 4000,
                      top: (rect.bottom + 250 > window.innerHeight && rect.top > 270) ? undefined : rect.bottom + 1,
                      bottom: (rect.bottom + 250 > window.innerHeight && rect.top > 270) ? (window.innerHeight - rect.top + 1) : undefined,
                      left: rect.left, width: rect.width, maxHeight: 250, overflowY: 'auto', boxSizing: 'border-box',
                      background: 'var(--surface-card, #fff)', border: '1px solid var(--border-strong)', borderRadius: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,.08)', padding: 0 }}>
          {opts.map((it, i) => (
            <div key={i} onClick={() => { setOpen(false); onChange && onChange({ target: { value: it.value } }); }}
                 style={{ padding: '5px 8px', fontSize: 13, lineHeight: 1.5, cursor: 'pointer', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          background: same(it.value) ? '#1254CC' : 'transparent',
                          color: same(it.value) ? '#fff' : 'var(--text)',
                          fontWeight: same(it.value) ? 600 : 400 }}
                 onMouseEnter={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                 onMouseLeave={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'transparent'; }}>
              {it.label || '—'}
            </div>
          ))}
        </div>
      ), document.body)}
    </div>
  );
}

Object.assign(window, { ChequeFormatPage });
