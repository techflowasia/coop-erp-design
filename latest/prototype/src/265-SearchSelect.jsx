// ════════════════════════════════════════════════════════════════════
//  SearchSelect — ช่องเลือกแบบค้นหาได้ (combobox)
//  ใช้แทน <select> เมื่อรายการตัวเลือกยาว/ต้องการพิมพ์ค้นหา
//  options: [{ value, label, sub }] · value/onChange เหมือน select ทั่วไป
//  ใช้ร่วมกับสไตล์ .ssel-* ใน styles.css — หน้าตาเข้ากับ .cfg-input
// ════════════════════════════════════════════════════════════════════
function SearchSelect({ value, onChange, options = [], placeholder = '— เลือก —',
                        searchPlaceholder = 'พิมพ์เพื่อค้นหา…', disabled = false,
                        allowClear = false, className = '' }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [hi, setHi] = React.useState(0);
  const wrapRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const selected = options.find(o => o.value === value) || null;

  const norm = (s) => (s || '').toString().toLowerCase();
  const filtered = q.trim()
    ? options.filter(o => norm(o.label).includes(norm(q)) || norm(o.sub).includes(norm(q)) || norm(o.value).includes(norm(q)))
    : options;

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  React.useEffect(() => {
    if (open) { setQ(''); setHi(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 10); }
  }, [open]);

  const pick = (o) => { onChange(o.value); setOpen(false); };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(filtered.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[hi]) pick(filtered[hi]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  return (
    <div className={"ssel" + (open ? ' open' : '') + (disabled ? ' disabled' : '')} ref={wrapRef}>
      <button type="button" className={"cfg-input ssel-control " + className} disabled={disabled}
              onClick={() => !disabled && setOpen(o => !o)}>
        <span className={"ssel-value" + (selected ? '' : ' placeholder')}>
          {selected ? selected.label : placeholder}
        </span>
        {allowClear && selected && !disabled && (
          <span className="ssel-clear" role="button" title="ล้างค่า"
                onClick={(e) => { e.stopPropagation(); onChange(''); }}>
            <Icon name="close" size={11} />
          </span>
        )}
        <span className="ssel-caret"><Icon name="chevDown" size={13} /></span>
      </button>
      {open && (
        <div className="ssel-pop">
          <div className="ssel-search">
            <Icon name="search" size={13} />
            <input ref={inputRef} value={q} placeholder={searchPlaceholder}
                   onChange={(e) => { setQ(e.target.value); setHi(0); }} onKeyDown={onKey} />
          </div>
          <div className="ssel-list">
            {filtered.length === 0 && <div className="ssel-empty">ไม่พบรายการที่ค้นหา</div>}
            {filtered.map((o, i) => (
              <button type="button" key={o.value}
                      className={"ssel-opt" + (o.value === value ? ' selected' : '') + (i === hi ? ' hi' : '')}
                      onMouseEnter={() => setHi(i)} onClick={() => pick(o)}>
                <span className="ssel-opt-main">{o.label}</span>
                {o.sub && <span className="ssel-opt-sub">{o.sub}</span>}
                {o.value === value && <Icon name="check" size={13} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SearchSelect });
