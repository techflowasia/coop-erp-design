// ═══════════════════════════════════════════════════════════════════════
//  ERP สหกรณ์ — Shared components (ใช้ร่วมทุกโปรเจกต์ย่อย)
//  ตาม สอ.กสท. Cooperative Design System · ต้องโหลด shared/erp-core.css
//
//  วิธีใช้ในโปรเจกต์อื่น:
//    <link rel="stylesheet" href="shared/erp-core.css">
//    <script type="text/babel" src="shared/erp-components.jsx"></script>
//  แล้วเรียกใช้ผ่าน window: ThaiDateInput, SearchPickerField,
//  maskCitizenId, maskPhone, isoToTh, thToIso
//
//  ไม่พึ่งพา global อื่นของระบบใด ๆ (ไอคอนฝังเป็น SVG ในตัว)
// ═══════════════════════════════════════════════════════════════════════

(function () {
  const { useState, useEffect, useRef } = React;

  // ─── ไอคอนขนาดเล็ก (ฝังในตัว ไม่พึ่ง Icon ของระบบ) ─────────────────
  const Svg = ({ size = 14, children }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         style={{ display: 'block', flex: 'none' }}>{children}</svg>
  );
  const IcoSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
  const IcoCalendar = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Svg>;
  const IcoLeft = (p) => <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>;
  const IcoRight = (p) => <Svg {...p}><path d="M9 5l7 7-7 7" /></Svg>;

  // ─── วันที่ไทย พ.ศ. ────────────────────────────────────────────────
  const TH_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const TH_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const pad2 = (n) => String(n).padStart(2, '0');
  const isoOf = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;

  function isoToTh(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!m) return '';
    return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
  }
  function thToIso(txt) {
    const m = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(String(txt || '').trim());
    if (!m) return null;
    const d = Number(m[1]), mo = Number(m[2]);
    let y = Number(m[3]);
    if (y > 2300) y -= 543;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  // ─── ปฏิทินไทย: ช่องกรอก วว/ดด/ปปปป (พ.ศ.) + ป๊อปอัพเลือกวัน ───────
  function ThaiDateInput({ value, onChange, error, onBlur, disabled, placeholder }) {
    const [txt, setTxt] = useState(() => isoToTh(value));
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(null);
    const popRef = React.useRef(null);
    const [view, setView] = useState(() => {
      const base = value ? new Date(value) : new Date();
      return { y: base.getFullYear(), m: base.getMonth() };
    });
    const wrapRef = useRef(null);

    useEffect(() => { setTxt(isoToTh(value)); }, [value]);
    useEffect(() => {
      if (!open) return;
      const inside = (t) => (wrapRef.current && wrapRef.current.contains(t)) || (popRef.current && popRef.current.contains(t));
      const fn = (e) => { if (!inside(e.target)) setOpen(false); };
      const esc = (e) => e.key === 'Escape' && setOpen(false);
      const onScroll = (e) => { if (!inside(e.target)) setOpen(false); };
      document.addEventListener('mousedown', fn);
      document.addEventListener('keydown', esc);
      window.addEventListener('scroll', onScroll, true);
      return () => { document.removeEventListener('mousedown', fn); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', onScroll, true); };
    }, [open]);

    const nowY = new Date().getFullYear();
    const years = [];
    for (let y = nowY + 50; y >= nowY - 100; y--) years.push(y);

    const commit = (raw) => {
      const iso = thToIso(raw);
      if (iso) onChange(iso);
      else if (!String(raw || '').trim()) onChange('');
      else setTxt(isoToTh(value));
      onBlur && onBlur();
    };

    const openCal = () => {
      if (disabled) return;
      // ป๊อปอัปแบบ fixed — ไม่ถูกตัดโดยกรอบที่ overflow:hidden/auto (เช่น ตารางใน modal)
      if (wrapRef.current) {
        const r = wrapRef.current.getBoundingClientRect();
        setPos({ left: Math.min(r.left, window.innerWidth - 258), top: r.bottom + 4 });
      }
      const base = value ? new Date(value) : new Date();
      setView({ y: base.getFullYear(), m: base.getMonth() });
      setOpen(o => !o);
    };

    const shift = (delta) => setView(v => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

    const lead = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    const todayIso = isoOf(new Date());

    const cellBtn = (d) => {
      const iso = `${view.y}-${pad2(view.m + 1)}-${pad2(d)}`;
      const on = iso === value;
      const isToday = iso === todayIso;
      return (
        <button key={d} type="button" className="thdp-day"
                onClick={() => { onChange(iso); setOpen(false); onBlur && onBlur(); }}
                style={{
                  height: 28, border: on ? '1px solid var(--brand, #237450)' : '1px solid transparent',
                  borderRadius: 4, cursor: 'pointer', font: 'inherit', fontSize: 12.5,
                  background: on ? 'var(--brand, #237450)' : (isToday ? 'var(--brand-100, #EAFEF2)' : 'transparent'),
                  color: on ? '#fff' : 'inherit',
                }}>{d}</button>
      );
    };

    return (
      <div ref={wrapRef} style={{ position: 'relative' }}>
        <div className={"mf-input" + (error ? " has-error" : "")}
             style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px 0 10px' }}>
          <input value={txt} disabled={disabled} inputMode="numeric"
                 placeholder={placeholder || 'วว/ดด/ปปปป (พ.ศ.)'}
                 onChange={(e) => setTxt(e.target.value)}
                 onBlur={(e) => commit(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') commit(e.currentTarget.value); }}
                 style={{ border: 0, outline: 0, flex: 1, minWidth: 0, background: 'transparent', font: 'inherit', color: 'inherit' }} />
          <button type="button" onClick={openCal} disabled={disabled} title="เปิดปฏิทิน"
                  style={{ border: 0, background: 'transparent', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', padding: 2, color: 'inherit' }}>
            <IcoCalendar size={14} />
          </button>
        </div>

        {open && ((node) => (pos && window.ReactDOM && ReactDOM.createPortal) ? ReactDOM.createPortal(node, document.body) : node)(
          <div ref={popRef} style={{
            ...(pos ? { position: 'fixed', top: pos.top, left: pos.left } : { position: 'absolute', top: 'calc(100% + 4px)', left: 0 }),
            zIndex: 1200, width: 250,
            background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,.15)', padding: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <button type="button" className="btn ghost sm" style={{ padding: '0 6px' }} onClick={() => shift(-1)} title="เดือนก่อน"><IcoLeft size={12} /></button>
              <select className="mf-input" value={view.m} onChange={(e) => setView(v => ({ ...v, m: Number(e.target.value) }))}
                      style={{ flex: 1, minWidth: 0, height: 28, fontSize: 12.5 }}>
                {TH_MONTHS_FULL.map((mn, i) => <option key={mn} value={i}>{mn}</option>)}
              </select>
              <select className="mf-input" value={view.y} onChange={(e) => setView(v => ({ ...v, y: Number(e.target.value) }))}
                      style={{ width: 74, height: 28, fontSize: 12.5 }}>
                {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
              </select>
              <button type="button" className="btn ghost sm" style={{ padding: '0 6px' }} onClick={() => shift(1)} title="เดือนถัดไป"><IcoRight size={12} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
              {TH_DOW.map(d => <div key={d} className="muted" style={{ fontSize: 11, padding: '2px 0' }}>{d}</div>)}
              {cells.map((d, i) => d === null ? <div key={'e' + i} /> : cellBtn(d))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button type="button" className="btn ghost sm" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => { onChange(todayIso); setOpen(false); onBlur && onBlur(); }}>วันนี้</button>
              <button type="button" className="btn ghost sm" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => { onChange(''); setTxt(''); setOpen(false); onBlur && onBlur(); }}>ล้างค่า</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── ช่องค้นหาแบบพิมพ์เอง + ไอคอนแว่นขยายขวาสุด ───────────────────
  //  ใช้ได้กับทุกชนิดข้อมูล: สมาชิก / สังกัด / สัญญา / บัญชี …
  //  props:
  //    value        ค่าที่แสดงในช่อง (เลข/รหัสที่เลือกแล้ว)
  //    items        รายการค้นหา (array)
  //    keyOf        (item) => รหัสที่ใช้เทียบ            · ค่าเริ่มต้น item.code
  //    labelOf      (item) => ข้อความที่แสดงหลังเลือก    · ค่าเริ่มต้น = รหัส
  //    onPick       (item) => เมื่อเจอรายการเดียว
  //    onOpenModal  () => เปิด modal ค้นหาแบบเต็ม (กดแว่นขยาย / ช่องว่าง)
  //    notFoundText ข้อความแดงใต้ช่องเมื่อไม่พบ
  //    className    คลาสของ input (mf-input | cfg-input | input)
  function SearchPickerField({
    value, items, keyOf, labelOf, onPick, onOpenModal,
    notFoundText = 'ไม่พบรายการนี้ในระบบ', placeholder = 'พิมพ์รหัสเพื่อค้นหา…',
    className = 'mf-input', mono = true, disabled, style,
  }) {
    const key = keyOf || ((it) => it && it.code);
    const label = labelOf || key;
    const display = (() => {
      if (!value) return '';
      const hit = (items || []).find(it => String(key(it)) === String(value));
      return hit ? String(label(hit)) : String(value);
    })();

    const [text, setText] = useState(display);
    const [err, setErr] = useState('');
    useEffect(() => { setText(display); setErr(''); }, [value, display]);
    // คลิกเข้าพิมพ์ใหม่ — เหลือเฉพาะรหัส/เลขที่ (ตัดชื่อท้ายออก)
    const codeOnly = (t) => String(t || '').split(' - ')[0].trim();

    const submit = () => {
      const raw = codeOnly(String(text || '').trim().split(/[—·]/)[0]);
      if (!raw) { onOpenModal && onOpenModal(); return; }
      const norm = (x) => String(x || '').toLowerCase().replace(/[\s-]/g, '');
      const q = norm(raw);
      const list = items || [];
      let hits = list.filter(it => norm(key(it)) === q);
      if (!hits.length) hits = list.filter(it => norm(key(it)).endsWith(q) || norm(key(it)).includes(q));
      if (hits.length === 1) { setErr(''); onPick && onPick(hits[0]); return; }
      if (hits.length > 1) { setErr(''); onOpenModal && onOpenModal(); return; }
      setErr(notFoundText);
    };

    return (
      <div style={{ ...style }}>
        <div style={{ position: 'relative' }}>
          <input className={className + (mono ? ' mono' : '') + (err ? ' has-error' : '')}
                 value={text} disabled={disabled} placeholder={placeholder}
                 onChange={(e) => { setText(e.target.value); setErr(''); }}
                 onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                 style={{ width: '100%', paddingRight: 32, textOverflow: 'ellipsis', borderColor: err ? 'var(--danger)' : undefined }} />
          <button type="button" onClick={() => onOpenModal && onOpenModal()} disabled={disabled} title="ค้นหา"
                  style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 30,
                           display: 'grid', placeItems: 'center', border: 0, background: 'transparent',
                           cursor: disabled ? 'default' : 'pointer', color: 'var(--text-muted)' }}>
            <IcoSearch size={13} />
          </button>
        </div>
        {err && <div style={{ color: 'var(--danger)', fontSize: 'var(--font-xs)', marginTop: 4 }}>{err}</div>}
      </div>
    );
  }

  // ─── ใส่ขีดอัตโนมัติ ──────────────────────────────────────────────
  const maskCitizenId = (v) => {                     // 1-2345-67890-12-3
    const d = String(v || '').replace(/\D/g, '').slice(0, 13);
    return [d.slice(0, 1), d.slice(1, 5), d.slice(5, 10), d.slice(10, 12), d.slice(12, 13)]
      .filter(Boolean).join('-');
  };
  const maskPhone = (v) => {                         // 9 หลัก xx-xxx-xxxx · 10 หลัก xxx-xxx-xxxx
    const d = String(v || '').replace(/\D/g, '').slice(0, 10);
    if (d.length <= 2) return d;
    if (d.length <= 9) return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join('-');
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join('-');
  };

  Object.assign(window, {
    ThaiDateInput, SearchPickerField,
    isoToTh, thToIso, maskCitizenId, maskPhone,
    ERP_SHARED: { ThaiDateInput, SearchPickerField, isoToTh, thToIso, maskCitizenId, maskPhone },
  });
})();
