// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — ราคาตลาดประจำวัน
//  อัปเดทราคาตลาดของสินทรัพย์ลงทุน (ตั๋วเงินคลัง · พันธบัตร · กองทุนส่วนบุคคล ·
//  กองทุนรวม · หุ้นสามัญ · บริษัทเอกชนในตลาดหลักทรัพย์) แล้วคำนวณมูลค่าตลาด
//  · % เปลี่ยนแปลงรายวัน · % การเติบโต (เทียบต้นทุน) แบบ Real-time
// ════════════════════════════════════════════════════════════════════

// ป้าย % แบบมีสี (เขียวขึ้น/แดงลง)
function MpDelta({ pct, size }) {
  const v = Number(pct || 0);
  const tone = v > 0.0001 ? 'success' : v < -0.0001 ? 'danger' : 'muted';
  const arrow = v > 0.0001 ? '▲' : v < -0.0001 ? '▼' : '–';
  return (
    <span className={"mp-delta " + tone} style={size ? { fontSize: size } : undefined}>
      <span className="mp-delta-ar">{arrow}</span>{Math.abs(v).toFixed(2)}%
    </span>
  );
}

const mpFmtPrice = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

function MarketPricePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [port, setPort] = useState(window.ivLoadPort);
  const [store, setStore] = useState(window.ivLoadMarket);
  const [asOf, setAsOf] = useState(store.asOf || window.ivMarketDefaultDate());
  const [cat, setCat] = useState('all');
  const [savedAt, setSavedAt] = useState(null);

  // รายการที่ต้องอ้างอิงราคาตลาด: ถือครองอยู่ (active) และอยู่ในหมวดราคาตลาด
  const rows = port.filter(p => p.status === 'active' && window.ivMarketCatOf(p.assetTypeCode));

  const [prices, setPrices] = useState(() => {
    const o = {};
    rows.forEach(r => { o[r.securityCode] = String(window.ivMarketPriceOf(store, r).price); });
    return o;
  });
  const setPrice = (code, v) => { setPrices(p => ({ ...p, [code]: v })); setSavedAt(null); };

  const cats = window.IV_MARKET_CATEGORIES || [];
  const shown = cat === 'all' ? rows : rows.filter(r => (window.ivMarketCatOf(r.assetTypeCode) || {}).key === cat);

  const metric = (r) => {
    const mk = window.ivMarketPriceOf(store, r);
    const raw = prices[r.securityCode];
    const price = Number(raw === '' || raw == null ? mk.price : raw) || 0;
    const prevClose = mk.prevClose;
    const mv = window.ivMarketValue(r, price);
    const prevValue = window.ivMarketValue(r, prevClose);
    const day = window.ivMarketDayChange(price, prevClose);
    const growth = window.ivGrowthPct(r, mv);
    return { price, prevClose, mv, prevValue, day, growth, basis: window.ivMarketBasis(r) };
  };

  // สรุปยอดของรายการที่แสดง
  const tot = shown.reduce((a, r) => {
    const m = metric(r);
    a.mv += m.mv; a.prev += m.prevValue; a.cost += (r.investAmount || 0);
    return a;
  }, { mv: 0, prev: 0, cost: 0 });
  const dayValue = tot.mv - tot.prev;
  const dayPct = tot.prev ? (dayValue / tot.prev) * 100 : 0;
  const unreal = tot.mv - tot.cost;
  const growthPct = tot.cost ? (unreal / tot.cost) * 100 : 0;
  const dirty = !savedAt;

  const countByCat = (k) => rows.filter(r => (window.ivMarketCatOf(r.assetTypeCode) || {}).key === k).length;

  const save = () => {
    const next = JSON.parse(JSON.stringify(port));
    const nstore = { asOf, prices: { ...(store.prices || {}) } };
    rows.forEach(r => {
      const m = metric(r);
      nstore.prices[r.securityCode] = { price: +m.price.toFixed(4), prevClose: m.prevClose, asOf };
      const rec = next.find(x => x.id === r.id);
      if (rec) { rec.currentValue = Math.round(m.mv); rec.marketPrice = +m.price.toFixed(4); rec.marketAsOf = asOf; }
    });
    window.ivSavePort(next); setPort(next);
    window.ivSaveMarket(nstore); setStore(nstore);
    setSavedAt(new Date());
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ราคาตลาดประจำวัน',
      target: `ราคาตลาด ณ ${asOf}`, summary: `อัปเดทราคาตลาดประจำวัน ${rows.length} หลักทรัพย์ (มูลค่าตลาดรวม ${fmt.money(tot.mv, 0)} บาท)`,
      changes: [{ field: 'มูลค่าตลาดรวม', before: fmt.money(tot.prev, 0), after: fmt.money(tot.mv, 0) }] });
    onToast && onToast(`บันทึกราคาตลาดประจำวัน ณ ${fmt.date(asOf)} เรียบร้อย — อัปเดท ${rows.length} หลักทรัพย์`);
  };

  return (
    <div data-screen-label="หน้าราคาตลาดประจำวัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ราคาตลาดประจำวัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            อัปเดทราคาตลาดของสินทรัพย์ลงทุน เพื่อคำนวณมูลค่าตลาดและ % การเติบโตของพอร์ตแบบ Real-time
          </div>
        </div>
        <span className="spacer" />
        <div className="mp-asof">
          <label className="mp-asof-k">ราคา ณ วันที่</label>
          <ErpDate value={asOf} onChange={(v) => ((e) => { setAsOf(e.target.value); setSavedAt(null); })({ target: { value: v } })} style={{ width: 150 }} className="cfg-input" />
        </div>
        <button className="btn primary sm" onClick={save} disabled={!dirty}><Icon name="check" /> บันทึกราคาตลาด</button>
      </div>

      {/* สรุป */}
      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
        <IvStat label="มูลค่าตลาดรวม" value={'฿ ' + fmt.money(tot.mv, 0)} sub={shown.length + ' หลักทรัพย์'} accent />
        <IvStat label="ต้นทุนรวม" value={'฿ ' + fmt.money(tot.cost, 0)} sub="เงินลงทุน (ราคาทุน)" />
        <div className="summary-card">
          <div className="label">เปลี่ยนแปลงวันนี้</div>
          <div className="value" style={{ color: dayValue >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {(dayValue >= 0 ? '+' : '−') + ' ฿ ' + fmt.money(Math.abs(dayValue), 0)}
          </div>
          <div className="sub"><MpDelta pct={dayPct} /> เทียบราคาปิดก่อนหน้า</div>
        </div>
        <div className="summary-card">
          <div className="label">กำไร/ขาดทุนที่ยังไม่รับรู้</div>
          <div className="value" style={{ color: unreal >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {(unreal >= 0 ? '+' : '−') + ' ฿ ' + fmt.money(Math.abs(unreal), 0)}
          </div>
          <div className="sub"><MpDelta pct={growthPct} /> % การเติบโต (เทียบต้นทุน)</div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap', padding: '10px 12px', gap: 6 }}>
          <button className={"filter-chip" + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>
            ทุกหมวด <span className="count">{rows.length}</span>
          </button>
          {cats.map(c => (
            <button key={c.key} className={"filter-chip" + (cat === c.key ? ' active' : '')} onClick={() => setCat(cat === c.key ? 'all' : c.key)}>
              {c.label} <span className="count">{countByCat(c.key)}</span>
            </button>
          ))}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11 }}>{shown.length} รายการ</span>
        </div>

        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl mp-tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>หลักทรัพย์</th>
                <th style={{ width: 170 }}>หมวด</th>
                <th className="right" style={{ width: 110 }}>ราคาปิดก่อนหน้า (บาท/หน่วย)</th>
                <th className="center" style={{ width: 156 }}>ราคาตลาดวันนี้ (บาท/หน่วย)</th>
                <th className="right" style={{ width: 104 }}>เปลี่ยนแปลง</th>
                <th className="right" style={{ width: 140 }}>มูลค่าตลาด</th>
                <th className="right" style={{ width: 120 }}>ต้นทุน</th>
                <th className="right" style={{ width: 110 }}>% เติบโต</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: 32 }}>— ไม่มีหลักทรัพย์ในหมวดนี้ —</td></tr>}
              {shown.map(r => {
                const c = window.ivMarketCatOf(r.assetTypeCode);
                const m = metric(r);
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="lt-row-name">{r.securityName}</div>
                      <div className="lt-row-note muted mono">{r.securityCode} · {r.id}</div>
                    </td>
                    <td><span className="chip info"><span className="dot-c" />{c ? c.label : '—'}</span></td>
                    <td className="right mono">{mpFmtPrice(m.prevClose)}</td>
                    <td className="center">
                      <div className="mp-price-wrap">
                        <input className="cfg-input mono mp-price-in" type="number" inputMode="decimal"
                               value={prices[r.securityCode] ?? ''} onChange={(e) => setPrice(r.securityCode, e.target.value)} />
                        <span className="mp-price-unit">{m.basis === 'unit' ? '฿' : '%'}</span>
                      </div>
                    </td>
                    <td className="right"><MpDelta pct={m.day} /></td>
                    <td className="right mono"><b>{fmt.money(m.mv, 0)}</b></td>
                    <td className="right mono">{fmt.money(r.investAmount, 0)}</td>
                    <td className="right"><MpDelta pct={m.growth} /></td>
                  </tr>
                );
              })}
            </tbody>
            {shown.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="5" className="right">รวมมูลค่าตลาด ({shown.length} หลักทรัพย์)</td>
                  <td className="right mono"><b>{fmt.money(tot.mv, 0)}</b></td>
                  <td className="right mono"><b>{fmt.money(tot.cost, 0)}</b></td>
                  <td className="right"><MpDelta pct={growthPct} /></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ราคาตลาดระบุเป็นราคาต่อ 1 หน่วย (บาท/หน่วย) · มูลค่าตลาด = จำนวนหน่วย × ราคาต่อหน่วย — เมื่อบันทึกแล้วมูลค่าตลาดจะอัปเดทเข้าทะเบียนพอร์ตลงทุนทันที
      </div>
    </div>
  );
}

Object.assign(window, { MarketPricePage, MpDelta });
