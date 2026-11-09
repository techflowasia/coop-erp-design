// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — คอมโพเนนต์ใช้ร่วม
//  ตัวเลือกบัญชี · ตัวเลือกสมาชิก · การ์ดบัญชี · สลิป/ใบเสร็จ · พิมพ์
// ════════════════════════════════════════════════════════════════════

// ─── พิมพ์สลิป (ซ่อนทุกอย่างยกเว้น .dep-slip ขณะพิมพ์) ────────────────
function depPrintSlip(onToast) {
  document.documentElement.classList.add('dep-printing');
  const cleanup = () => { document.documentElement.classList.remove('dep-printing'); window.removeEventListener('afterprint', cleanup); };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์');
}

// ─── ตัวเลือกบัญชีเงินฝาก (ค้นหา accNo/รหัส/ชื่อ) ─────────────────────
function DepAccountPicker({ accounts, value, onSelect, placeholder, onlyActive = true, withButtons = false }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn);
  }, []);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = onlyActive ? accounts.filter(a => a.status === 'active') : accounts;
    if (s) r = r.filter(a => (a.accNo + ' ' + a.member + ' ' + a.name + ' ' + a.type).toLowerCase().includes(s));
    return r.slice(0, 8);
  }, [q, accounts, onlyActive]);

  if (withButtons) {
    return (
      <div className="dep-picker" ref={ref}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 8, alignItems: 'center' }}>
          <input className="cfg-input" value={q} onChange={(e) => setQ(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }}
                 placeholder={placeholder || 'ค้นหาเลขที่บัญชี / รหัสสมาชิก / ชื่อ'} />
          <button className="btn primary" style={{ height: 32 }} onClick={() => setOpen(true)}>ค้นหา</button>
          <button className="btn" style={{ height: 32 }} onClick={() => { setQ(''); setOpen(false); onSelect(null); }}>รีเซ็ต</button>
        </div>
        {open && (
          <div className="dep-picker-pop">
            {results.length === 0 ? (
              <div className="dep-picker-empty">ไม่พบบัญชีตามคำค้น</div>
            ) : results.map(a => (
              <button key={a.accNo} className="dep-picker-item" onClick={() => { onSelect(a); setOpen(false); setQ(a.accNo); }}>
                <span className="mono dep-pi-acc">{a.accNo}</span>
                <span className="dep-pi-name">{a.name} <span className="muted">· {a.member}</span></span>
                <span className="dep-pi-type">{a.type}</span>
                <span className="mono dep-pi-bal">{fmt.money(a.balance, 2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dep-picker" ref={ref}>
      <div className="dep-picker-input" onClick={() => setOpen(true)}>
        <Icon name="search" size={14} />
        <input value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
               placeholder={placeholder || 'ค้นหาเลขที่บัญชี / รหัสสมาชิก / ชื่อ'} />
        {value && <button className="dep-picker-clear" onClick={(e) => { e.stopPropagation(); onSelect(null); setQ(''); }} aria-label="ล้าง"><Icon name="close" size={13} /></button>}
      </div>
      {open && (
        <div className="dep-picker-pop">
          {results.length === 0 ? (
            <div className="dep-picker-empty">ไม่พบบัญชีตามคำค้น</div>
          ) : results.map(a => (
            <button key={a.accNo} className="dep-picker-item" onClick={() => { onSelect(a); setOpen(false); setQ(''); }}>
              <span className="mono dep-pi-acc">{a.accNo}</span>
              <span className="dep-pi-name">{a.name} <span className="muted">· {a.member}</span></span>
              <span className="dep-pi-type">{a.type}</span>
              <span className="mono dep-pi-bal">{fmt.money(a.balance, 2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ตัวเลือกสมาชิก (เปิดบัญชี) ──────────────────────────────────────
function DepMemberPicker({ members, value, onSelect }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn);
  }, []);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    let r = members;
    if (s) r = r.filter(m => (m.code + ' ' + m.name + ' ' + m.citizenId + ' ' + m.dept).toLowerCase().includes(s));
    return r.slice(0, 8);
  }, [q, members]);
  return (
    <div className="dep-picker" ref={ref}>
      <div className="dep-picker-input" onClick={() => setOpen(true)}>
        <Icon name="search" size={14} />
        <input value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
               placeholder="ค้นหารหัสสมาชิก / ชื่อ-นามสกุล / เลขบัตรประชาชน" />
      </div>
      {open && (
        <div className="dep-picker-pop">
          {results.length === 0 ? <div className="dep-picker-empty">ไม่พบสมาชิก</div> :
            results.map(m => (
              <button key={m.code} className="dep-picker-item" onClick={() => { onSelect(m); setOpen(false); setQ(''); }}>
                <span className="mono dep-pi-acc">{m.code}</span>
                <span className="dep-pi-name">{m.name}</span>
                <span className="dep-pi-type">{m.dept}</span>
                <span className={"pill " + (m.status === 'ปฏิบัติงาน' ? 'ok' : 'bad')} style={{ marginLeft: 'auto' }}>{m.status}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── การ์ดบัญชีที่เลือก ──────────────────────────────────────────────
function DepAccountCard({ acc, extra }) {
  if (!acc) return null;
  return (
    <div className="dep-acc-card">
      <div className="dep-acc-card-top">
        <div className="dep-acc-ico"><Icon name="wallet" size={18} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="dep-acc-no mono">{acc.accNo}</div>
          <div className="dep-acc-sub">{acc.name} <span className="muted">· {acc.member} · {acc.dept}</span></div>
        </div>
        <span className={"chip " + (acc.memberStatus === 'ปฏิบัติงาน' ? 'success' : 'danger')}><span className="dot-c" />{acc.memberStatus}</span>
      </div>
      <div className="dep-acc-grid">
        <div className="dep-acc-f"><span className="k">ประเภทบัญชี</span><span className="v">{acc.type}</span></div>
        <div className="dep-acc-f"><span className="k">อัตราดอกเบี้ย</span><span className="v mono">{acc.rate.toFixed(2)}%</span></div>
        <div className="dep-acc-f"><span className="k">ยอดคงเหลือ</span><span className="v mono" style={{ color: 'var(--primary-700)', fontWeight: 700 }}>{fmt.money(acc.balance, 2)}</span></div>
        <div className="dep-acc-f"><span className="k">ผูกหักเงินเดือน</span><span className="v">{acc.payrollLinked ? <span className="chip warning"><span className="dot-c" />ผูกอยู่</span> : <span className="muted">ไม่ผูก</span>}</span></div>
        {extra}
      </div>
    </div>
  );
}

// ─── สลิป/ใบเสร็จ (ใช้พิมพ์) ─────────────────────────────────────────
function DepSlip({ title, sub, rows, foot }) {
  return (
    <div className="dep-slip">
      <div className="dep-slip-head">
        <img src={window.__resources.logo} alt="" className="dep-slip-logo" />
        <div>
          <div className="dep-slip-org">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)</div>
          <div className="dep-slip-org-en">THE COMMUNICATIONS AUTHORITY OF THAILAND SAVINGS CO-OPERATIVE LTD.</div>
          <div className="dep-slip-title">{title}</div>
        </div>
      </div>
      {sub && <div className="dep-slip-sub">{sub}</div>}
      <table className="dep-slip-tbl"><tbody>
        {rows.map((r, i) => (
          <tr key={i} className={r.strong ? 'strong' : ''}>
            <td className="k">{r.k}</td>
            <td className={"v" + (r.mono ? ' mono' : '')}>{r.v}</td>
          </tr>
        ))}
      </tbody></table>
      {foot && <div className="dep-slip-foot">{foot}</div>}
      <div className="dep-slip-sign">
        <div><div className="sl-line" />ผู้ทำรายการ</div>
        <div><div className="sl-line" />ผู้รับเงิน / ผู้มีอำนาจ</div>
      </div>
    </div>
  );
}

Object.assign(window, { depPrintSlip, DepAccountPicker, DepMemberPicker, DepAccountCard, DepSlip });
