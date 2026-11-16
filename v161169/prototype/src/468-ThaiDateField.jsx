// ════════════════════════════════════════════════════════════════════
//  ช่องวันที่แบบไทย (วว/ดด/ปปปป พ.ศ.) + ปฏิทินภาษาไทย — ใช้ร่วมทุกเมนู
//  window.ThaiDateField({ value: 'YYYY-MM-DD', onChange })
// ════════════════════════════════════════════════════════════════════
(function () {
const { useState, useMemo, useRef, useEffect } = React;

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

const isoToDmy = (iso) => {
  const p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  return p[2] + '/' + p[1] + '/' + (parseInt(p[0], 10) + 543);
};
const dmyToIso = (s) => {
  const d = String(s || '').replace(/[^0-9]/g, '');
  if (d.length < 8) return null;
  let y = parseInt(d.slice(4, 8), 10);
  if (y > 2400) y -= 543;
  return y + '-' + d.slice(2, 4) + '-' + d.slice(0, 2);
};
const todayIso = () => {
  const n = new Date();
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
};

function ThaiDateField({ value, onChange, min, max }) {
  const inRange = (iso) => !iso || ((!min || iso >= min) && (!max || iso <= max));
  const [txt, setTxt] = useState(isoToDmy(value));
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const base = useMemo(() => {
    const p = String(value || '').split('-');
    return p.length === 3 ? new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])) : new Date();
  }, [value]);
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const wrapRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => { setTxt(isoToDmy(value)); }, [value]);
  useEffect(() => { setView({ y: base.getFullYear(), m: base.getMonth() }); }, [base]);
  useEffect(() => {
    if (!open) return;
    const off = (e) => {
      const inWrap = wrapRef.current && wrapRef.current.contains(e.target);
      const inPop = popRef.current && popRef.current.contains(e.target);
      if (!inWrap && !inPop) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', off);
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', off);
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const handle = (raw) => {
    const d = raw.replace(/[^0-9]/g, '').slice(0, 8);
    let out = d;
    if (d.length > 4) out = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    else if (d.length > 2) out = d.slice(0, 2) + '/' + d.slice(2);
    setTxt(out);
    const iso = dmyToIso(out);
    if (iso && inRange(iso)) onChange(iso);
  };
  const pick = (day) => {
    const iso = view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    if (!inRange(iso)) return;
    onChange(iso);
    setOpen(false);
  };
  const shift = (n) => setView(v => {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  useEffect(() => {
    if (!open || !wrapRef.current || !popRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const h = popRef.current.offsetHeight;
    const vh = document.documentElement.clientHeight;
    const vw = document.documentElement.clientWidth;
    const w = popRef.current.offsetWidth || 268;
    // วางใต้ช่อง · พลิกขึ้นเมื่อด้านล่างไม่พอ · บีบให้อยู่ในจอเสมอ (ช่องในตารางที่เลื่อนได้อาจอยู่นอกจอ)
    const below = r.bottom + 4;
    const top = Math.max(8, Math.min(
      (below + h > vh && r.top - 4 - h >= 8) ? r.top - 4 - h : below,
      Math.max(8, vh - h - 8)));
    const left = Math.max(8, Math.min(r.left, Math.max(8, vw - w - 8)));
    setPos(p => (p && Math.abs(p.top - top) < 1 && Math.abs(p.left - left) < 1 ? p : { left, top }));
  }, [open]);

  const selIso = String(value || '');

  return (
    <div ref={wrapRef} className="thd-field" style={{ position: 'relative' }}>
      <input className="cfg-input mono" value={txt} placeholder="วว/ดด/ปปปป" inputMode="numeric"
        style={{ width: '100%', paddingRight: 34 }} onChange={e => handle(e.target.value)} />
      <button type="button" title="เลือกวันที่" onClick={(e) => {
          e.preventDefault();
          if (open) { setOpen(false); return; }
          const r = wrapRef.current.getBoundingClientRect();
          const vw = document.documentElement.clientWidth;
          setPos({ left: Math.max(8, Math.min(r.left, vw - 268 - 8)), top: r.bottom + 4 });
          setOpen(true);
        }}
        style={{
          position: 'absolute', right: 1, bottom: 1, height: 'calc(100% - 2px)', width: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0,
          background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 0,
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.8" y="3.2" width="12.4" height="11.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.8 6.3h12.4" stroke="currentColor" strokeWidth="2" />
          <path d="M4.9 1.7v2.8M11.1 1.7v2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && ReactDOM.createPortal((
        <div ref={popRef} style={{
          position: 'fixed', zIndex: 2000, top: (pos ? pos.top : 0), left: (pos ? pos.left : 0), width: 268,
          background: '#fff', border: '1px solid var(--line, #d9d9d9)', borderRadius: 8,
          boxShadow: '0 4px 14px rgba(0,0,0,.12)', padding: '10px 12px 8px',
        }}>
          <div className="thd-head">
            <button type="button" className="thd-nav" onClick={(e) => { e.preventDefault(); shift(-1); }}>‹</button>
            <select className="thd-sel" value={view.m} onChange={(e) => setView(v => ({ ...v, m: Number(e.target.value) }))}>
              {TH_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select className="thd-sel" value={view.y} onChange={(e) => setView(v => ({ ...v, y: Number(e.target.value) }))}>
              {Array.from({ length: 17 }, (_, i) => view.y - 8 + i).map(y => <option key={y} value={y}>{y + 543}</option>)}
            </select>
            <button type="button" className="thd-nav" onClick={(e) => { e.preventDefault(); shift(1); }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 2 }}>
            {TH_DOW.map(d => <div key={d} style={{ padding: '2px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
            {cells.map((d, i) => {
              if (!d) return <div key={'e' + i} />;
              const iso = view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
              const on = iso === selIso;
              const off = !inRange(iso);
              return (
                <button key={d} type="button" disabled={off} title={off ? 'อยู่นอกช่วงที่เลือกได้' : undefined}
                  onClick={(e) => { e.preventDefault(); pick(d); }}
                  style={{
                    aspectRatio: '1 / 1', width: '100%', padding: 0, border: on ? '1px solid var(--brand-700)' : '1px solid transparent',
                    borderRadius: 6, cursor: off ? 'not-allowed' : 'pointer', fontSize: 13,
                    background: on ? 'var(--brand-700)' : 'transparent',
                    color: on ? '#fff' : off ? 'var(--text-disabled, rgba(0,0,0,.25))' : 'inherit',
                    fontWeight: on ? 700 : 400,
                  }}>{d}</button>
              );
            })}
          </div>
          <div className="thd-foot">
            <button type="button" className="thd-act" disabled={!inRange(todayIso())} onClick={(e) => { e.preventDefault(); if (!inRange(todayIso())) return; onChange(todayIso()); setOpen(false); }}>วันนี้</button>
            <button type="button" className="thd-act" onClick={(e) => { e.preventDefault(); onChange(''); setTxt(''); setOpen(false); }}>ล้างค่า</button>
          </div>
        </div>
      ), (document.getElementById('root') || document.body))}
    </div>
  );
}

Object.assign(window, { ThaiDateField });
})();
