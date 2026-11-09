// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน › ค่าคงที่ — ข้อกำหนดระบบการเงิน (Finance Terms / Rates)
//  เลือกรายการข้อกำหนด → แก้ไขรหัส/คำอธิบาย/อัตรา/แบบ ภ.ง.ด. ในตาราง
//  เพิ่มแถว · ลบแถว · บันทึก · อ้างอิงประเภทภาษี
// ════════════════════════════════════════════════════════════════════

const FT_WHT_FORMS = ['ภ.ง.ด. 1', 'ภ.ง.ด. 1ก', 'ภ.ง.ด. 3', 'ภ.ง.ด. 53', 'ไม่หักภาษี'];

const FT_TAX_TYPES = [
  { form: 'ภ.ง.ด. 1', name: 'ภาษีเงินได้บุคคลธรรมดา หัก ณ ที่จ่าย (เงินเดือน/ค่าจ้าง)', payee: 'บุคคลธรรมดา', due: 'ภายในวันที่ 7 ของเดือนถัดไป' },
  { form: 'ภ.ง.ด. 1ก', name: 'สรุปการจ่ายเงินได้ประเภทเงินเดือนประจำปี', payee: 'บุคคลธรรมดา', due: 'ภายในเดือนกุมภาพันธ์ของปีถัดไป' },
  { form: 'ภ.ง.ด. 3', name: 'ภาษีหัก ณ ที่จ่าย — ผู้รับเป็นบุคคลธรรมดา (ค่าบริการ/ค่าเช่า)', payee: 'บุคคลธรรมดา', due: 'ภายในวันที่ 7 ของเดือนถัดไป' },
  { form: 'ภ.ง.ด. 53', name: 'ภาษีหัก ณ ที่จ่าย — ผู้รับเป็นนิติบุคคล', payee: 'นิติบุคคล', due: 'ภายในวันที่ 7 ของเดือนถัดไป' },
  { form: 'ไม่หักภาษี', name: 'รายการที่ได้รับยกเว้น / ไม่ต้องหักภาษี ณ ที่จ่าย', payee: '—', due: '—' },
];

const FT_SETS = [
  {
    id: 'wht', label: 'อัตราภาษีหัก ณ ที่จ่าย',
    note: 'อัตราที่ระบบนำไปคำนวณภาษีหัก ณ ที่จ่ายอัตโนมัติ เมื่อบันทึกใบสำคัญจ่าย/จ่ายเงินตามหมวด',
    rows: [
      { id: 'w1', code: '1', desc: 'ค่าจ้างทำของ', rate: 3, forms: ['ภ.ง.ด. 3', 'ภ.ง.ด. 53'] },
      { id: 'w2', code: '2', desc: 'ค่าเช่า', rate: 5, forms: ['ภ.ง.ด. 3', 'ภ.ง.ด. 53'] },
      { id: 'w3', code: '3', desc: 'ค่าใช้บริการ 3%', rate: 3, form: 'ภ.ง.ด. 53' },
      { id: 'w4', code: '4', desc: 'มูลนิธิไม่แสวงหารายได้', rate: 5, form: 'ภ.ง.ด. 1ก' },
      { id: 'w5', code: '5', desc: 'สมาคม', rate: 0, form: 'ภ.ง.ด. 1ก' },
      { id: 'w6', code: '6', desc: 'คณะบุคคล', rate: 0, form: 'ภ.ง.ด. 1ก' },
      { id: 'w7', code: '7', desc: 'ประกัน', rate: 1, form: 'ภ.ง.ด. 53' },
      { id: 'w8', code: '8', desc: 'ค่าขนส่ง', rate: 1, form: 'ภ.ง.ด. 53' },
      { id: 'w10', code: '10', desc: 'ค่าใช้จ่ายในการประชุม 5%', rate: 5, form: 'ภ.ง.ด. 1' },
      { id: 'w14', code: '14', desc: 'นิติบุคคล', rate: 0, form: 'ภ.ง.ด. 53' },
      { id: 'w31', code: '31', desc: 'ค่าตอบแทนแรงงาน 5%', rate: 5, form: 'ภ.ง.ด. 1' },
      { id: 'w32', code: '32', desc: 'ค่าตอบแทนแรงงาน 10%', rate: 10, form: 'ภ.ง.ด. 1' },
      { id: 'w33', code: '33', desc: 'ค่าตอบแทนแรงงาน 15%', rate: 15, form: 'ภ.ง.ด. 1' },
      { id: 'w34', code: '34', desc: 'ค่าตอบแทนแรงงาน 20%', rate: 20, form: 'ภ.ง.ด. 1' },
      { id: 'w35', code: '35', desc: 'ค่าตอบแทนแรงงาน 25%', rate: 25, form: 'ภ.ง.ด. 1' },
      { id: 'w11', code: '11', desc: 'ค่าใช้จ่ายในการประชุม 10%', rate: 10, form: 'ภ.ง.ด. 1' },
      { id: 'w12', code: '12', desc: 'โบนัส 5%', rate: 5, form: 'ภ.ง.ด. 1' },
      { id: 'w13', code: '13', desc: 'โบนัส 10%', rate: 10, form: 'ภ.ง.ด. 1' },
    ],
  },
  {
    id: 'vat', label: 'ภาษีมูลค่าเพิ่ม / ภาษีอื่น',
    note: 'อัตราภาษีมูลค่าเพิ่มและภาษีอื่นที่ใช้ประกอบการบันทึกรายการรับ–จ่าย',
    rows: [
      { id: 'v1', code: '1', desc: 'ภาษีมูลค่าเพิ่ม 7%', rate: 7, forms: ['ไม่หักภาษี'] },
      { id: 'v2', code: '2', desc: 'ภาษีมูลค่าเพิ่ม 0% (ยกเว้น)', rate: 0, forms: ['ไม่หักภาษี'] },
      { id: 'v3', code: '3', desc: 'ภาษีธุรกิจเฉพาะ', rate: 3.3, forms: ['ไม่หักภาษี'] },
    ],
  },
  {
    id: 'fee', label: 'ค่าธรรมเนียมการเงิน',
    note: 'อัตราค่าธรรมเนียมที่เรียกเก็บจากสมาชิกในงานรับ–จ่ายเงิน',
    rows: [
      { id: 'f1', code: '1', desc: 'ค่าธรรมเนียมโอนเงินต่างธนาคาร', rate: 0.5, forms: ['ไม่หักภาษี'] },
      { id: 'f2', code: '2', desc: 'ค่าธรรมเนียมออกเช็ค', rate: 0.25, forms: ['ไม่หักภาษี'] },
      { id: 'f3', code: '3', desc: 'ค่าธรรมเนียมธนาณัติ', rate: 1, forms: ['ไม่หักภาษี'] },
    ],
  },
];

const FT_KEY = 'coop.finTerms.v1';
const ftLoad = () => { try { const s = JSON.parse(localStorage.getItem(FT_KEY)); if (s) return s; } catch (e) {} return FT_SETS.reduce((a, s) => (a[s.id] = s.rows, a), {}); };
const ftSave = (d) => { try { localStorage.setItem(FT_KEY, JSON.stringify(d)); } catch (e) {} };
let _ftSeq = 0;
const ftUid = () => 'ft' + Date.now().toString(36) + (++_ftSeq);
const ftPct = (n) => (Number(n) || 0).toFixed(2) + '%';
// ประเภทภาษีของหนึ่งข้อกำหนด — เก็บเป็นรายการ เลือกได้มากกว่าหนึ่งแบบ
const ftForms = (r) => (Array.isArray(r.forms) ? r.forms : (r.form ? [r.form] : []));
const FT_FORM_PAYEE = FT_TAX_TYPES.reduce((a, t) => (a[t.form] = t.payee, a), {});

// ── ช่องเลือกประเภทภาษีได้หลายแบบ ──────────────────────────────────
function FtFormPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrap = React.useRef(null);
  const pop = React.useRef(null);
  const place = () => { if (wrap.current) setRect(wrap.current.getBoundingClientRect()); };
  React.useEffect(() => {
    if (!open) return;
    place();
    const h = () => place();
    const out = (e) => {
      if (wrap.current && wrap.current.contains(e.target)) return;
      if (pop.current && pop.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', out);
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { document.removeEventListener('mousedown', out); window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open]);

  const toggle = (f) => {
    const next = value.includes(f) ? value.filter(x => x !== f) : FT_WHT_FORMS.filter(x => value.includes(x) || x === f);
    onChange(next);
  };

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%' }}>
      <div className="cfg-input sm" role="button" tabIndex={0}
           onClick={() => { place(); setOpen(o => !o); }}
           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(); setOpen(o => !o); } }}
           style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', cursor: 'pointer', minHeight: 26, paddingRight: 22, position: 'relative' }}>
        {value.length === 0
          ? <span className="muted">— เลือกประเภทภาษี —</span>
          : value.map(f => <span key={f} className="chip info" style={{ fontSize: 10.5 }}>{f}</span>)}
        <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none', display: 'grid' }}>
          <Icon name="down" size={10} />
        </span>
      </div>
      {open && rect && ReactDOM.createPortal((
        <div ref={pop} onMouseDown={(e) => e.stopPropagation()} style={{ position: 'fixed', zIndex: 4000,
                      top: (rect.bottom + 190 > window.innerHeight && rect.top > 210) ? undefined : rect.bottom + 1,
                      bottom: (rect.bottom + 190 > window.innerHeight && rect.top > 210) ? (window.innerHeight - rect.top + 1) : undefined,
                      left: rect.left, width: Math.max(rect.width, 230), boxSizing: 'border-box',
                      background: 'var(--surface-card, #fff)', border: '1px solid var(--border-strong)', borderRadius: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,.08)', padding: 0 }}>
          {FT_WHT_FORMS.map(f => {
            const on = value.includes(f);
            return (
              <div key={f} onClick={() => toggle(f)}
                   style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', fontSize: 12.5, cursor: 'pointer',
                            background: on ? 'var(--brand-100)' : 'transparent', color: 'var(--text)' }}
                   onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                   onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width: 13, height: 13, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 2,
                               border: '1px solid ' + (on ? 'var(--brand-700)' : 'var(--border-strong)'),
                               background: on ? 'var(--brand-700)' : '#fff', color: '#fff' }}>
                  {on && <Icon name="check" size={9} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{f}</span>
                <span className="muted" style={{ fontSize: 10.5 }}>{FT_FORM_PAYEE[f] || ''}</span>
              </div>
            );
          })}
        </div>
      ), document.body)}
    </div>
  );
}

// ── ประเภทภาษี reference modal ──────────────────────────────────────
function FinTaxTypeModal({ onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 700 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ประเภทภาษี</h2>
            <div className="muted" style={{ fontSize: 11 }}>แบบยื่นภาษีหัก ณ ที่จ่าย ที่เลือกได้ในคอลัมน์ “ภ.ง.ด.”</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th style={{ width: 100 }}>แบบ</th><th>รายละเอียด</th><th style={{ width: 110 }}>ผู้รับเงิน</th><th style={{ width: 190 }}>กำหนดยื่น</th></tr></thead>
              <tbody>
                {FT_TAX_TYPES.map(t => (
                  <tr key={t.form}>
                    <td><span className="chip primary">{t.form}</span></td>
                    <td>{t.name}</td>
                    <td className="muted">{t.payee}</td>
                    <td className="muted">{t.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────────
function FinTermsConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [data, setData] = React.useState(ftLoad);
  const [setId, setSetId] = React.useState(FT_SETS[0].id);
  const [taxOpen, setTaxOpen] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [form, setForm] = React.useState(null); // { mode:'add'|'edit', id, code, desc, rate, forms }
  const [formErr, setFormErr] = React.useState('');
  React.useEffect(() => { setForm(null); }, [setId]);
  const openEdit = (r) => { setFormErr(''); setForm({ mode: 'edit', id: r.id, code: r.code, desc: r.desc, rate: r.rate, forms: ftForms(r) }); };
  const submitForm = () => {
    const code = String(form.code || '').trim();
    if (!code) return setFormErr('กรุณาระบุรหัส');
    if (!String(form.desc || '').trim()) return setFormErr('กรุณาระบุคำอธิบาย');
    if (rows.some(x => x.id !== form.id && String(x.code) === code)) return setFormErr('รหัส “' + code + '” มีอยู่แล้วในรายการนี้');
    const rec = { code, desc: form.desc.trim(), rate: Number(form.rate) || 0, forms: form.forms || [] };
    if (form.mode === 'add') {
      update([...rows, { id: ftUid(), ...rec }], { action: 'create', summary: 'เพิ่มข้อกำหนด “' + rec.desc + '” (' + rec.code + ')',
        changes: [{ field: 'รหัส', before: '—', after: rec.code }, { field: 'อัตรา', before: '—', after: rec.rate + ' %' }] });
    } else {
      const old = rows.find(x => x.id === form.id) || {};
      const ch = [];
      if (String(old.code) !== rec.code) ch.push({ field: 'รหัส', before: old.code, after: rec.code });
      if ((old.desc || '') !== rec.desc) ch.push({ field: 'คำอธิบาย', before: old.desc || '—', after: rec.desc });
      if (Number(old.rate || 0) !== rec.rate) ch.push({ field: 'อัตรา', before: Number(old.rate || 0) + ' %', after: rec.rate + ' %' });
      if (ftForms(old).join(',') !== rec.forms.join(',')) ch.push({ field: 'ภ.ง.ด.', before: ftForms(old).join(', ') || '—', after: rec.forms.join(', ') || '—' });
      update(rows.map(x => x.id === form.id ? { ...x, ...rec } : x), { action: 'update', summary: 'แก้ไขข้อกำหนด “' + rec.desc + '”', changes: ch });
    }
    onToast && onToast((form.mode === 'add' ? 'เพิ่ม' : 'บันทึกการแก้ไข') + 'ข้อกำหนด “' + rec.desc + '” เรียบร้อยแล้ว');
    setForm(null);
  };

  const set = FT_SETS.find(s => s.id === setId);
  const rows = data[setId] || [];
  const update = (next, logEntry) => {
    setData(d => { const nd = { ...d, [setId]: next }; ftSave(nd); return nd; });
    if (logEntry && audit.log) audit.log({ module: 'การเงิน — ข้อกำหนดระบบการเงิน', target: set.label, ...logEntry });
  };
  const patch = (id, k, v) => update(rows.map(r => r.id === id ? { ...r, [k]: v } : r));

  const addRow = () => {
    const maxCode = rows.reduce((m, r) => Math.max(m, parseInt(r.code, 10) || 0), 0);
    setFormErr('');
    setForm({ mode: 'add', id: null, code: String(maxCode + 1), desc: '', rate: 0, forms: [FT_WHT_FORMS[0]] });
  };

  const doDelete = (r) => {
    update(rows.filter(x => x.id !== r.id), { action: 'delete', summary: 'ลบข้อกำหนด “' + (r.desc || r.code) + '” (' + r.code + ')' });
    setConfirmDel(null);
    onToast && onToast(`ลบข้อกำหนด “${r.desc || r.code}” เรียบร้อยแล้ว`);
  };


  const reset = () => { const d = FT_SETS.reduce((a, s) => (a[s.id] = s.rows, a), {}); setData(d); ftSave(d);
    audit.log && audit.log({ action: 'update', module: 'การเงิน — ข้อกำหนดระบบการเงิน', target: 'ทุกรายการ', summary: 'คืนค่าข้อกำหนดเป็นค่าตั้งต้น' });
    onToast && onToast('คืนค่าข้อกำหนดเป็นค่าตั้งต้นแล้ว'); };

  return (
    <div data-screen-label="หน้าข้อกำหนดระบบการเงิน">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ข้อกำหนดระบบการเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดรหัส คำอธิบาย และอัตราของข้อกำหนดที่ระบบการเงินนำไปคำนวณ พร้อมระบุแบบ ภ.ง.ด. ที่เกี่ยวข้อง
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setTaxOpen(true)}><Icon name="receipt" size={13} /> ประเภทภาษี</button>
        <button className="btn primary sm" data-keep-top="" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มข้อกำหนด</button>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head"><Icon name="cog" size={14} /> เลือกรายการข้อกำหนด</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {FT_SETS.map(s => (
            <button key={s.id} className={"btn sm ft-tab" + (s.id === setId ? ' primary active' : '')}
                    aria-pressed={s.id === setId} onClick={() => setSetId(s.id)}>
              <Icon name="report" size={13} /> {s.label}
            </button>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{set.note}</div>
      </div>

      <div className="search-card">
        <div className="section-head">
          <h3>{set.label}</h3>
          <span className="spacer" style={{ flex: 1 }} />
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 820 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 74 }}>รหัส</th>
                <th style={{ minWidth: 300 }}>คำอธิบาย</th>
                <th className="center" style={{ width: 120 }}>อัตรา</th>
                <th className="center" style={{ width: 230 }}>ภ.ง.ด.</th>
                <th className="center" style={{ width: 170 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const ed = false;
                return (
                <tr key={r.id}>
                  <td className="center">
                    {ed
                      ? <input className="cfg-input mono sm" style={{ width: 58, textAlign: 'center' }} value={r.code}
                               onChange={(e) => patch(r.id, 'code', e.target.value)} />
                      : <span className="mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{r.code}</span>}
                  </td>
                  <td>
                    {ed
                      ? <input className="cfg-input sm" value={r.desc} placeholder="ระบุคำอธิบายข้อกำหนด"
                               onChange={(e) => patch(r.id, 'desc', e.target.value)} />
                      : <span>{r.desc || '—'}</span>}
                  </td>
                  <td className="center">
                    {ed
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <input className="cfg-input mono sm" type="number" step="0.01" min="0" style={{ width: 74, textAlign: 'right' }}
                                 value={r.rate} onChange={(e) => patch(r.id, 'rate', e.target.value)} />
                          <span className="muted">%</span>
                        </div>
                      : <span className="mono">{Number(r.rate || 0).toFixed(2)} %</span>}
                  </td>
                  <td>
                    {ed
                      ? <FtFormPicker value={ftForms(r)} onChange={(v) => patch(r.id, 'forms', v)} />
                      : <span>{ftForms(r).join(', ') || '—'}</span>}
                  </td>
                  <td className="center">
                    <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'center' }}>
                      <button className="btn sm ex-row-btn" title="แก้ไขข้อกำหนด" onClick={() => openEdit(r)}>
                        <Icon name="edit" size={13} /> แก้ไข
                      </button>
                      <button className="btn sm ex-row-btn del" aria-label="ลบแถว" title="ลบข้อกำหนด" onClick={() => setConfirmDel(r)}>
                        <Icon name="trash" size={13} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan="5" className="empty-state" style={{ padding: 28 }}>— ยังไม่มีข้อกำหนดในรายการนี้ —</td></tr>
              )}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> อัตราที่แก้ไขจะมีผลกับรายการที่บันทึกใหม่เท่านั้น — รายการที่บันทึกไปแล้วยังคงใช้อัตราเดิม
        <button className="btn ghost sm" style={{ marginLeft: 8, border: 0 }} onClick={reset}>คืนค่าตั้งต้น</button>
      </div>

      {taxOpen && <FinTaxTypeModal onClose={() => setTaxOpen(false)} />}
      {form && (
        <>
          <div className="modal-backdrop" onClick={() => setForm(null)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560, maxWidth: '94vw', overflow: 'visible' }}>
            <div className="modal-head">
              <div className="gc-modal-ico"><Icon name={form.mode === 'add' ? 'plus' : 'edit'} /></div>
              <div style={{ minWidth: 0 }}>
                <h2>{form.mode === 'add' ? 'เพิ่มข้อกำหนด' : 'แก้ไขข้อกำหนด'}</h2>
                <div className="muted" style={{ fontSize: 12 }}>{set.label}</div>
              </div>
              <button className="close-btn" onClick={() => setForm(null)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body" style={{ overflow: 'visible' }}>
              {formErr && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {formErr}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', gap: 12 }}>
                <div className="dat-field">
                  <label className="dat-label">รหัส <span className="cfg-required">*</span></label>
                  <input className="cfg-input mono" value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value }); setFormErr(''); }} />
                </div>
                <div className="dat-field">
                  <label className="dat-label">คำอธิบาย <span className="cfg-required">*</span></label>
                  <input className="cfg-input" value={form.desc} placeholder="ระบุคำอธิบายข้อกำหนด"
                         onChange={(e) => { setForm({ ...form, desc: e.target.value }); setFormErr(''); }} />
                </div>
                <div className="dat-field">
                  <label className="dat-label">อัตรา (%)</label>
                  <input className="cfg-input mono" type="number" step="0.01" min="0" style={{ textAlign: 'right' }}
                         value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                </div>
                <div className="dat-field">
                  <label className="dat-label">ภ.ง.ด.</label>
                  <FtFormPicker value={form.forms} onChange={(v) => setForm({ ...form, forms: v })} />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setForm(null)}>ยกเลิก</button>
              <button className="btn primary" onClick={submitForm}><Icon name="check" /> บันทึก</button>
            </div>
          </div>
        </>
      )}
      {confirmDel && window.DepStatusDialog && (
        <window.DepStatusDialog tone="danger" title="ยืนยันการลบข้อกำหนด"
          desc={<>ต้องการลบข้อกำหนด <b className="mono">{confirmDel.code || '—'}</b> · {confirmDel.desc || '—'} ใช่หรือไม่?</>}
          okLabel="ลบ" onOk={() => doDelete(confirmDel)} onClose={() => setConfirmDel(null)} />
      )}
    </div>
  );
}

Object.assign(window, { FinTermsConfigPage, FinTaxTypeModal });
