// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน — ตัวช่วยใช้ร่วมกัน (shared helpers)
//  ใช้โดยหน้าจอ: พอร์ตลงทุน · บันทึกลงทุน · นำเข้า · รับผลตอบแทน ·
//               ครบกำหนด · ขายก่อนครบ · cashflow · ตรวจวงเงิน · เช็ค · โอน
// ════════════════════════════════════════════════════════════════════

const ivToday = () => '2026-06-14';
const ivNow = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const IV_USER = 'จันทร์เพ็ญ มาลี';

// จำนวนวันระหว่างวันที่ (b - a) เป็นจำนวนวัน
const ivDaysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
// วัน ครบกำหนด - วันนี้
const ivDaysToMaturity = (iso) => iso ? ivDaysBetween(ivToday(), iso) : null;

// ─── สถานะรายการลงทุน → pill ──────────────────────────────────────────
function IvPortPill({ status }) {
  const st = window.IV_PORT_STATUS[status] || window.IV_PORT_STATUS.draft;
  return <span className={"pill " + st.pill}>{st.l}</span>;
}

// ─── ป้ายประเภทสินทรัพย์ (รหัส + ชื่อ + กลุ่ม) ────────────────────────
function IvAssetBadge({ code, showName = true }) {
  const t = window.ivAssetType(code);
  if (!t) return <span className="muted">{code}</span>;
  return (
    <span className="iv-asset-badge" title={t.name}>
      <span className="iv-asset-code">{t.code}</span>
      {showName && <span className="iv-asset-name">{t.name}</span>}
    </span>
  );
}

// ─── ป้ายความเสี่ยง ───────────────────────────────────────────────────
function IvRiskPill({ risk }) {
  const r = (window.IV_RISK || {})[risk];
  if (!r) return null;
  return <span className={"pill " + r.pill}>{r.label}</span>;
}

// ─── ป้ายแหล่งเงิน (Tag) ──────────────────────────────────────────────
function IvFundChip({ tag }) {
  const f = (window.IV_FUND_TAGS || []).find(x => x.tag === tag);
  return <span className={"chip " + (f ? f.color : '')}><span className="dot-c" />{tag}</span>;
}

// ─── การ์ดสรุปตัวเลข (KPI) ────────────────────────────────────────────
function IvStat({ label, value, sub, accent, tone }) {
  return (
    <div className={"summary-card" + (accent ? ' accent' : '')}>
      <div className="label">{label}</div>
      <div className="value" style={tone ? { color: 'var(--' + tone + ')' } : undefined}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

// ─── หัวข้อส่วน (section header) ───────────────────────────────────────
function IvSection({ icon, title, count, right, children }) {
  return (
    <div className="search-card iv-section">
      <div className="section-head">
        <span className="head-bar" />
        <h3>{title}</h3>
        {count != null && <span className="gc-count">{count}</span>}
        {right && <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── ช่องกรอกจำนวนเงิน (ขวา, mono) พร้อม suffix ───────────────────────
function IvMoneyInput({ value, onChange, suffix = 'บาท', placeholder = '0.00', disabled }) {
  return (
    <div className="lt-num-wrap">
      <input className="cfg-input mono" type="number" inputMode="decimal" value={value} disabled={disabled}
             style={{ textAlign: 'right' }} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
      <span className="lt-suffix">{suffix}</span>
    </div>
  );
}

// ─── ป้ายวันครบกำหนด (สีตามจำนวนวันที่เหลือ) ──────────────────────────
function IvMaturityTag({ iso }) {
  if (!iso) return <span className="muted">— ไม่มีกำหนด —</span>;
  const d = ivDaysToMaturity(iso);
  let cls = 'ok', txt = '';
  if (d < 0) { cls = 'bad'; txt = `เลยกำหนด ${Math.abs(d)} วัน`; }
  else if (d === 0) { cls = 'bad'; txt = 'ครบกำหนดวันนี้'; }
  else if (d <= 30) { cls = 'warn'; txt = `อีก ${d} วัน`; }
  else if (d <= 90) { cls = 'warn'; txt = `อีก ${d} วัน`; }
  else { cls = 'ok'; txt = `อีก ${d} วัน`; }
  return (
    <span className="iv-mat">
      <span className="iv-mat-date">{fmt.date(iso)}</span>
      <span className={"pill " + cls} style={{ height: 18, padding: '0 6px' }}>{txt}</span>
    </span>
  );
}

// ─── แถบเปอร์เซ็นต์ (reuse แนวเดียวกับ IvlBar) ────────────────────────
function IvBar({ pct, tone }) {
  const w = Math.max(0, Math.min(100, pct));
  const color = tone || (pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)');
  return (
    <div className="iv-bar-track">
      <div className="iv-bar-fill" style={{ width: w + '%', background: color }} />
    </div>
  );
}

// ─── กราฟแท่งแนวตั้งอย่างง่าย (สำหรับ cashflow) ───────────────────────
//  series: [{ label, value }] — value อาจติดลบ; baseline = 0
function IvColumnChart({ series, height = 200, fmtVal }) {
  const max = Math.max(1, ...series.map(s => Math.abs(s.value)));
  const fmtFn = fmtVal || ((v) => fmt.money(v / 1000000, 1) + ' ล.');
  const hasNeg = series.some(s => s.value < 0);
  const zone = hasNeg ? height / 2 : height;
  return (
    <div className="iv-chart" style={{ height: height + 28 }}>
      <div className="iv-chart-plot" style={{ height }}>
        {hasNeg && <div className="iv-chart-zero" style={{ top: height / 2 }} />}
        {series.map((s, i) => {
          const h = (Math.abs(s.value) / max) * zone;
          const pos = s.value >= 0;
          return (
            <div key={i} className="iv-chart-col" title={s.label + ': ' + fmtFn(s.value)}>
              <div className="iv-chart-bar-wrap" style={{ height }}>
                <div className={"iv-chart-bar " + (pos ? 'pos' : 'neg')}
                     style={{ height: Math.max(2, h), [pos ? 'bottom' : 'top']: hasNeg ? height / 2 : 0 }}>
                  <span className="iv-chart-val">{fmtFn(s.value)}</span>
                </div>
              </div>
              <div className="iv-chart-label">{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── รายการเอกสารแนบ (อ่านอย่างเดียว / แก้ไขได้) ──────────────────────
function IvDocList({ docs, onAdd, onRemove, editable }) {
  return (
    <div className="iv-doclist">
      {(docs || []).length === 0 && <div className="iv-doc-empty">— ยังไม่มีเอกสารแนบ —</div>}
      {(docs || []).map((d, i) => (
        <div key={i} className="iv-doc-item">
          <span className="iv-doc-ico"><Icon name="attach" size={13} /></span>
          <span className="iv-doc-name">{d}</span>
          {editable && <button className="iv-doc-x" onClick={() => onRemove(i)} title="ลบ"><Icon name="close" size={12} /></button>}
        </div>
      ))}
      {editable && (
        <button className="btn dashed sm iv-doc-add" onClick={onAdd}><Icon name="upload" size={13} /> แนบเอกสาร</button>
      )}
    </div>
  );
}

// ─── ฟิลด์ในฟอร์ม (label + control) ───────────────────────────────────
function IvField({ label, required, span, children, hint }) {
  return (
    <div className="iv-field" style={span ? { gridColumn: 'span ' + span } : undefined}>
      <label className="iv-flabel">{label}{required && <span className="cfg-required"> *</span>}</label>
      {children}
      {hint && <div className="iv-fhint">{hint}</div>}
    </div>
  );
}

// ─── โมดัลค้นหา/เลือกรายการลงทุนจากพอร์ต ──────────────────────────────
function IvPortPicker({ port, filter, title, onPick, onClose }) {
  const [q, setQ] = useState('');
  const list = (port || []).filter(p => {
    if (filter && !filter(p)) return false;
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return p.id.toLowerCase().includes(n) || (p.securityName || '').toLowerCase().includes(n) || (p.securityCode || '').toLowerCase().includes(n);
  });
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 760, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title || 'เลือกรายการลงทุน'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>ค้นหาจากเลขที่รายการ ชื่อหลักทรัพย์ หรือรหัสหลักทรัพย์</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="toolbar" style={{ marginBottom: 10 }}>
            <div className="search" style={{ flex: '1 1 auto' }}>
              <Icon name="search" size={14} />
              <input value={q} autoFocus onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา…" />
            </div>
          </div>
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 640 }}>
              <thead>
                <tr><th>เลขที่</th><th>ประเภท</th><th>หลักทรัพย์</th><th className="right">เงินลงทุน</th><th className="center">ครบกำหนด</th><th /></tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan="6" className="center muted" style={{ padding: 28 }}>ไม่พบรายการ</td></tr>}
                {list.map(p => (
                  <tr key={p.id} className="clickable" onClick={() => onPick(p)}>
                    <td className="mono">{p.id}</td>
                    <td><IvAssetBadge code={p.assetTypeCode} showName={false} /></td>
                    <td><div className="lt-row-name">{p.securityName}</div><div className="lt-row-note muted mono">{p.securityCode}</div></td>
                    <td className="right mono">{fmt.money(p.investAmount, 0)}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{p.maturityDate ? fmt.date(p.maturityDate) : '—'}</td>
                    <td className="center"><button className="btn ghost sm">เลือก <Icon name="chevRight" size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  ivToday, ivNow, IV_USER, ivDaysBetween, ivDaysToMaturity,
  IvPortPill, IvAssetBadge, IvRiskPill, IvFundChip, IvStat, IvSection,
  IvMoneyInput, IvMaturityTag, IvBar, IvColumnChart, IvDocList, IvField, IvPortPicker,
});
