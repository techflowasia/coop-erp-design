// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — ตรวจสอบวงเงินลงทุน
//  วงเงินประจำปี (ใช้ไป/คงเหลือ) + สัดส่วนการลงทุน แยกตามประเภท ·
//  ผู้ออกหลักทรัพย์ · Rating · แหล่งเงิน + ตรวจวงเงินก่อนลงทุน +
//  แจ้งเตือนเกิน/กระจุกตัว + เปรียบเทียบกับประกาศ
// ════════════════════════════════════════════════════════════════════

function lcLoadLimits() {
  try { const s = localStorage.getItem('invest_limits'); if (s) return JSON.parse(s); } catch (e) {}
  return window.IV_LIMIT_SEED || [];
}

// รวมยอดตาม key จากพอร์ต active
function lcGroupBy(port, keyFn, labelFn) {
  const map = {};
  port.filter(p => p.status === 'active').forEach(p => {
    const k = keyFn(p);
    if (!map[k]) map[k] = { key: k, label: labelFn(p), amount: 0, count: 0 };
    map[k].amount += p.investAmount || 0; map[k].count += 1;
  });
  return Object.values(map).sort((a, b) => b.amount - a.amount);
}

function LcBarRow({ label, sub, amount, total, limit, warnPctOfPort }) {
  const portPct = total ? (amount / total) * 100 : 0;
  const limitPct = limit ? (amount / limit) * 100 : null;
  const over = limit != null && amount > limit;
  const concentrated = warnPctOfPort && portPct > warnPctOfPort;
  return (
    <tr>
      <td><div className="lt-row-name">{label}</div>{sub && <div className="lt-row-note muted">{sub}</div>}</td>
      <td className="right mono">{fmt.money(amount, 0)}</td>
      <td style={{ minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}><IvBar pct={limitPct != null ? limitPct : portPct} tone={limit ? undefined : 'var(--primary)'} /></div>
          <span className="mono" style={{ fontSize: 11, minWidth: 40, textAlign: 'right' }}>{portPct.toFixed(1)}%</span>
        </div>
      </td>
      <td className="right mono">{limit != null ? fmt.money(limit, 0) : '—'}</td>
      <td className="center">
        {over ? <span className="pill bad">เกินวงเงิน</span>
          : concentrated ? <span className="pill warn">กระจุกตัว</span>
          : limitPct != null && limitPct >= 90 ? <span className="pill warn">ใกล้เต็ม</span>
          : <span className="pill ok">ปกติ</span>}
      </td>
    </tr>
  );
}

function InvestLimitCheckPage({ onToast }) {
  const [port] = useState(window.ivLoadPort);
  const [limits] = useState(lcLoadLimits);
  const [tab, setTab] = useState('type');
  const cur = limits.find(r => r.status !== 'ปิดปี') || limits[0];

  // quick check
  const [chkType, setChkType] = useState(cur ? cur.breakdown[0].typeCode : '');
  const [chkAmt, setChkAmt] = useState('');

  const totalLimit = cur ? cur.totalLimit : 0;
  const totalUsed = cur ? cur.breakdown.reduce((a, b) => a + b.used, 0) : 0;
  const totalRemain = totalLimit - totalUsed;
  const portTotal = port.filter(p => p.status === 'active').reduce((a, p) => a + (p.investAmount || 0), 0);

  const cat = cur ? cur.breakdown.find(b => b.typeCode === chkType) : null;
  const amt = Number(chkAmt || 0);
  const catRemain = cat ? cat.limit - cat.used : 0;
  const overCat = cat && amt > catRemain;
  const overTotal = amt > totalRemain;
  const chkOk = amt > 0 && cat && !overCat && !overTotal;

  const byIssuer = lcGroupBy(port, p => p.issuerCode, p => (window.ivIssuer(p.issuerCode) || {}).name || p.issuerCode);
  const byRating = lcGroupBy(port, p => p.rating || '—', p => p.rating || '—');
  const byFund = lcGroupBy(port, p => p.fundTag, p => p.fundTag);

  const overCats = cur ? cur.breakdown.filter(b => b.used > b.limit && b.limit > 0) : [];
  const concIssuer = byIssuer.filter(g => portTotal && (g.amount / portTotal) > 0.25);

  return (
    <div data-screen-label="หน้าตรวจสอบวงเงินลงทุน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตรวจสอบวงเงินลงทุน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            วงเงินลงทุนประจำปีและสัดส่วนการลงทุน — แยกตามประเภท ผู้ออก Rating และแหล่งเงิน เทียบกับประกาศของสหกรณ์
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายงานสัดส่วนการลงทุนเสนอผู้บริหารแล้ว')}><Icon name="download" /> Export รายงาน</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
        <IvStat label={'วงเงินประจำปี ' + (cur ? cur.year : '')} value={'฿ ' + fmt.money(totalLimit, 0)} sub={cur ? cur.docRef : ''} accent />
        <IvStat label="ใช้ไปแล้ว" value={'฿ ' + fmt.money(totalUsed, 0)} sub={(totalLimit ? (totalUsed / totalLimit * 100).toFixed(1) : 0) + '% ของวงเงิน'} tone="warning" />
        <IvStat label="คงเหลือลงทุนได้" value={'฿ ' + fmt.money(totalRemain, 0)} sub="พร้อมลงทุนเพิ่ม" tone="success" />
        <IvStat label="แจ้งเตือน" value={(overCats.length + concIssuer.length) + ' รายการ'} sub="เกินวงเงิน / กระจุกตัว" tone={(overCats.length + concIssuer.length) ? 'danger' : undefined} />
      </div>

      {(overCats.length > 0 || concIssuer.length > 0) && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="info" size={14} />
          <span>
            {overCats.length > 0 && <>มี <b>{overCats.length} ประเภท</b>ใช้วงเงินเกินเพดาน ({overCats.map(c => c.name).join(', ')}). </>}
            {concIssuer.length > 0 && <>การลงทุนกระจุกตัวในผู้ออก <b>{concIssuer.map(g => g.label).join(', ')}</b> เกิน 25% ของพอร์ต — ควรกระจายความเสี่ยง</>}
          </span>
        </div>
      )}

      {/* ตรวจวงเงินก่อนลงทุน */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>ตรวจสอบวงเงินก่อนลงทุน</h3></div>
        <div className="iv-quickcheck">
          <div style={{ flex: '1 1 220px' }}>
            <label className="iv-flabel">ประเภทสินทรัพย์</label>
            <select className="cfg-input" value={chkType} onChange={(e) => setChkType(e.target.value)}>
              {cur && cur.breakdown.map(b => <option key={b.typeCode} value={b.typeCode}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="iv-flabel">จำนวนเงินที่จะลงทุน</label>
            <IvMoneyInput value={chkAmt} onChange={setChkAmt} />
          </div>
          <div className="iv-quickcheck-result">
            {amt > 0 && cat ? (
              chkOk ? (
                <div className="ivl-result ok" style={{ margin: 0 }}><Icon name="check" size={16} />
                  <div><b>ผ่าน — อยู่ในวงเงิน</b><div className="muted" style={{ fontSize: 11 }}>เหลือประเภทนี้ {fmt.money(catRemain - amt, 0)} · รวม {fmt.money(totalRemain - amt, 0)}</div></div></div>
              ) : (
                <div className="ivl-result bad" style={{ margin: 0 }}><Icon name="info" size={16} />
                  <div><b>เกินวงเงิน</b><div className="muted" style={{ fontSize: 11 }}>{overCat ? 'เกินประเภทนี้ ' + fmt.money(amt - catRemain, 0) : 'เกินวงเงินรวม ' + fmt.money(amt - totalRemain, 0)}</div></div></div>
              )
            ) : <div className="muted" style={{ fontSize: 12 }}>กรอกจำนวนเงินเพื่อตรวจสอบวงเงินคงเหลือแบบ Real-time</div>}
          </div>
        </div>
      </div>

      {/* สัดส่วนการลงทุน */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="tabs-bar" style={{ borderRadius: 0 }}>
          {[['type', 'ตามประเภทสินทรัพย์'], ['issuer', 'ตามผู้ออกหลักทรัพย์'], ['rating', 'ตาม Rating'], ['fund', 'ตามแหล่งเงิน']].map(([k, l]) => (
            <button key={k} className={"tab" + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead><tr>
              <th style={{ minWidth: 220 }}>{tab === 'type' ? 'ประเภทสินทรัพย์' : tab === 'issuer' ? 'ผู้ออกหลักทรัพย์' : tab === 'rating' ? 'อันดับเครดิต' : 'แหล่งเงิน / Tag'}</th>
              <th className="right" style={{ width: 140 }}>เงินลงทุน</th>
              <th style={{ width: 180 }}>สัดส่วน</th>
              <th className="right" style={{ width: 140 }}>วงเงินเพดาน</th>
              <th className="center" style={{ width: 110 }}>สถานะ</th>
            </tr></thead>
            <tbody>
              {tab === 'type' && cur && cur.breakdown.map(b => (
                <LcBarRow key={b.typeCode} label={b.name} sub={b.typeCode} amount={b.used} total={totalUsed} limit={b.limit} />
              ))}
              {tab === 'issuer' && byIssuer.map(g => {
                const iss = window.ivIssuer(g.key);
                return <LcBarRow key={g.key} label={g.label} sub={iss ? iss.issuerType + ' · ' + g.count + ' รายการ' : g.count + ' รายการ'} amount={g.amount} total={portTotal} warnPctOfPort={25} />;
              })}
              {tab === 'rating' && byRating.map(g => (
                <LcBarRow key={g.key} label={g.label} sub={g.count + ' รายการ'} amount={g.amount} total={portTotal} warnPctOfPort={40} />
              ))}
              {tab === 'fund' && byFund.map(g => (
                <LcBarRow key={g.key} label={g.label} sub={g.count + ' รายการ'} amount={g.amount} total={portTotal} warnPctOfPort={50} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="lt-list-foot muted" style={{ borderTop: '1px solid var(--divider)' }}>
          <Icon name="info" size={12} />
          {tab === 'type'
            ? ' เพดานวงเงินอ้างอิงจากประกาศวงเงินลงทุนประจำปี — แถบแสดง % การใช้วงเงินแต่ละประเภท'
            : ' ระบบเฝ้าระวังการกระจุกตัว: ผู้ออกรายเดียวไม่ควรเกิน 25% และ Rating กลุ่มเดียวไม่ควรเกิน 40% ของพอร์ต'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InvestLimitCheckPage });
