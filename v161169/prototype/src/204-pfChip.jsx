// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — ทะเบียนพอร์ตลงทุน
//  รายการสินทรัพย์ลงทุนทั้งหมด ⇄ รายละเอียดรายการ (drill down)
//  ฟังก์ชัน: ค้นหา/กรองตามประเภท·ผู้ออก·แหล่งเงิน·สถานะ·วันครบกำหนด
//           · ดูประวัติ · Export Excel/PDF · Drill down
// ════════════════════════════════════════════════════════════════════

function pfChip(label, active, onClick, count) {
  return (
    <button className={"toolbar-filter filter-chip" + (active ? ' active' : '')} onClick={onClick}>
      {label}{count != null && <span className="count">{count}</span>}
    </button>
  );
}

// ป้าย % เติบโต/เปลี่ยนแปลง แบบมีสี (local — ใช้ในทะเบียนพอร์ต)
function PfDelta({ pct }) {
  const v = Number(pct || 0);
  const tone = v > 0.0001 ? 'success' : v < -0.0001 ? 'danger' : 'muted';
  const ar = v > 0.0001 ? '▲' : v < -0.0001 ? '▼' : '–';
  return <span className={"mp-delta " + tone}><span className="mp-delta-ar">{ar}</span>{Math.abs(v).toFixed(2)}%</span>;
}

// ─── รายละเอียดรายการลงทุน (drill down) ───────────────────────────────
function PortfolioDetail({ rec, returns, onBack, onToast }) {
  const t = window.ivAssetType(rec.assetTypeCode);
  const iss = window.ivIssuer(rec.issuerCode);
  const myReturns = (returns || []).filter(r => r.invId === rec.id)
    .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));
  const gain = (rec.currentValue || 0) - (rec.investAmount || 0);

  const Row = ({ k, v, mono }) => (
    <div className="dat-field"><label className="dat-label">{k}</label>
      <div className={"dat-read" + (mono ? ' mono' : '')}>{v}</div></div>
  );

  return (
    <div data-screen-label="หน้ารายละเอียดรายการลงทุน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่ทะเบียนพอร์ต</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('กำลังเตรียมเอกสารรายละเอียดการลงทุน')}><Icon name="print" /> พิมพ์</button>
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกข้อมูลรายการลงทุนเป็น Excel แล้ว')}><Icon name="download" /> Export</button>
      </div>

      {/* หัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shares" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{rec.securityName} <IvPortPill status={rec.status} /></h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span className="mono">{rec.securityCode}</span><span className="dot" />
              <IvAssetBadge code={rec.assetTypeCode} /><span className="dot" />
              <IvFundChip tag={rec.fundTag} />
            </div>
          </div>
        </div>
      </div>

      {/* สรุปมูลค่า */}
      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <IvStat label="เงินลงทุน" value={'฿ ' + fmt.money(rec.investAmount, 0)} sub={'ราคาซื้อ ' + (rec.buyPrice || '—')} accent />
        <IvStat label="มูลค่าปัจจุบัน" value={'฿ ' + fmt.money(rec.currentValue, 0)} sub={rec.status === 'sold' ? 'ขายแล้ว' : 'ประเมิน ณ ' + fmt.date(ivToday())} />
        <IvStat label="กำไร/ขาดทุนที่ยังไม่รับรู้" value={(gain >= 0 ? '+' : '−') + ' ฿ ' + fmt.money(Math.abs(gain), 0)}
                tone={gain >= 0 ? 'success' : 'danger'} sub={rec.investAmount ? ((gain / rec.investAmount) * 100).toFixed(2) + '%' : '—'} />
        <IvStat label="ดอกเบี้ยค้างรับ" value={'฿ ' + fmt.money(rec.accrued, 0)} sub={rec.couponFreq} tone="warning" />
      </div>

      <div className="dat-cols" style={{ marginTop: 12 }}>
        {/* ข้อมูลหลักทรัพย์ + เงินลงทุน */}
        <div className="search-card dat-section">
          <div className="dat-section-head"><span className="dat-section-ico"><Icon name="info" size={15} /></span>
            <div className="dat-section-title">ข้อมูลหลักทรัพย์และเงินลงทุน</div></div>
          <div className="dat-grid">
            <Row k="ประเภทสินทรัพย์" v={t ? t.name : rec.assetTypeCode} />
            <Row k="กลุ่มสินทรัพย์" v={t ? t.group : '—'} />
            <Row k="ชื่อหลักทรัพย์" v={rec.securityName} />
            <Row k="รหัสหลักทรัพย์" v={rec.securityCode} mono />
            <Row k="ผู้ออกหลักทรัพย์" v={iss ? iss.name : '—'} />
            <Row k="อันดับเครดิต (Rating)" v={rec.rating || '—'} />
            <Row k="มูลค่าหน้าตั๋ว" v={rec.faceValue ? fmt.money(rec.faceValue, 0) + ' บาท' : '—'} mono />
            <Row k="จำนวนหน่วย" v={rec.units ? fmt.int(rec.units) + ' หน่วย' : '—'} mono />
            <Row k="ราคาซื้อ" v={rec.buyPrice ? rec.buyPrice : '—'} mono />
            <Row k="ราคาตลาดล่าสุด" v={rec.marketPrice ? rec.marketPrice + (rec.marketAsOf ? '  (ณ ' + fmt.date(rec.marketAsOf) + ')' : '') : '—'} mono />
            <Row k="จำนวนเงินลงทุน" v={fmt.money(rec.investAmount, 2) + ' บาท'} mono />
          </div>
        </div>

        {/* ผลตอบแทน + วันสำคัญ */}
        <div className="search-card dat-section">
          <div className="dat-section-head"><span className="dat-section-ico"><Icon name="calendar" size={15} /></span>
            <div className="dat-section-title">ผลตอบแทนและวันสำคัญ</div></div>
          <div className="dat-grid">
            <Row k="อัตราดอกเบี้ย" v={rec.couponRate ? rec.couponRate + '%' : '—'} mono />
            <Row k="อัตราผลตอบแทน (Yield)" v={rec.yieldRate ? rec.yieldRate + '%' : '—'} mono />
            <Row k="รอบจ่ายดอกเบี้ย" v={rec.couponFreq} />
            <Row k="รับดอกเบี้ยครั้งถัดไป" v={rec.nextCouponDate ? fmt.date(rec.nextCouponDate) : '—'} />
            <Row k="วันที่เริ่มลงทุน" v={fmt.date(rec.startDate)} />
            <div className="dat-field"><label className="dat-label">วันที่ครบกำหนด</label>
              <div className="dat-read"><IvMaturityTag iso={rec.maturityDate} /></div></div>
            <Row k="แหล่งเงิน / Tag" v={rec.fundTag} />
            <Row k="ผู้รับผิดชอบ" v={rec.owner} />
            <Row k="ผู้อนุมัติ" v={rec.approver || '—'} />
          </div>
        </div>
      </div>

      {/* ตารางรับผลตอบแทนของรายการนี้ */}
      <IvSection icon="money" title="แผนรับผลตอบแทนของรายการนี้" count={myReturns.length + ' งวด'}>
        <div className="table-wrap" style={{ marginTop: 4 }}>
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead><tr>
              <th>เลขที่</th><th>ประเภท</th><th className="center">รอบวันที่รับ</th>
              <th className="right">คาดว่าจะรับ</th><th className="right">รับจริง</th><th className="center">สถานะ</th>
            </tr></thead>
            <tbody>
              {myReturns.length === 0 && <tr><td colSpan="6" className="center muted" style={{ padding: 22 }}>— ยังไม่มีแผนรับผลตอบแทน —</td></tr>}
              {myReturns.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.type}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.dueDate)}</td>
                  <td className="right mono">{fmt.money(r.expect, 0)}</td>
                  <td className="right mono">{r.actual != null ? fmt.money(r.actual, 0) : '—'}</td>
                  <td className="center">
                    {r.status === 'received' ? <span className="pill ok">รับแล้ว</span>
                      : r.status === 'overdue' ? <span className="pill bad">เกินกำหนด</span>
                      : <span className="pill warn">รอรับ</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </IvSection>

      {/* เอกสารแนบ */}
      <IvSection icon="attach" title="เอกสารประกอบ" count={(rec.docs || []).length}>
        <IvDocList docs={rec.docs} />
      </IvSection>
    </div>
  );
}

// ─── หน้าหลัก: ทะเบียนพอร์ต ───────────────────────────────────────────
function PortfolioRegisterPage({ onToast }) {
  const [port] = useState(window.ivLoadPort);
  const [returns] = useState(window.ivLoadReturns);
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState('');
  const [fType, setFType] = useState('all');
  const [fIssuer, setFIssuer] = useState('all');
  const [fFund, setFFund] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [fMaturity, setFMaturity] = useState('all');

  const openRec = port.find(p => p.id === openId);
  if (openRec) return <PortfolioDetail rec={openRec} returns={returns} onBack={() => setOpenId(null)} onToast={onToast} />;

  const filtered = port.filter(p => {
    if (fType !== 'all' && p.assetTypeCode !== fType) return false;
    if (fIssuer !== 'all' && p.issuerCode !== fIssuer) return false;
    if (fFund !== 'all' && p.fundTag !== fFund) return false;
    if (fStatus !== 'all' && p.status !== fStatus) return false;
    if (fMaturity !== 'all') {
      const d = window.ivDaysToMaturity(p.maturityDate);
      if (fMaturity === 'overdue' && !(d != null && d < 0)) return false;
      if (fMaturity === '30' && !(d != null && d >= 0 && d <= 30)) return false;
      if (fMaturity === '90' && !(d != null && d >= 0 && d <= 90)) return false;
    }
    if (q.trim()) {
      const n = q.toLowerCase();
      return p.id.toLowerCase().includes(n) || (p.securityName || '').toLowerCase().includes(n) ||
             (p.securityCode || '').toLowerCase().includes(n);
    }
    return true;
  });

  const active = port.filter(p => p.status === 'active');
  const totalInvest = active.reduce((a, p) => a + (p.investAmount || 0), 0);
  const totalValue = active.reduce((a, p) => a + (p.currentValue || 0), 0);
  const totalAccrued = active.reduce((a, p) => a + (p.accrued || 0), 0);
  const portGrowth = totalInvest ? ((totalValue - totalInvest) / totalInvest) * 100 : 0;
  const near = port.filter(p => { const d = window.ivDaysToMaturity(p.maturityDate); return p.status === 'active' && d != null && d >= 0 && d <= 30; }).length;

  return (
    <div data-screen-label="หน้าทะเบียนพอร์ตลงทุน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ทะเบียนพอร์ตลงทุน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            สินทรัพย์ลงทุนทั้งหมดของสหกรณ์ — กรองตามประเภท ผู้ออก แหล่งเงิน และวันครบกำหนด พร้อม Drill down รายการ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => { window.location.hash = '#invest/market-price'; }}><Icon name="report" /> อัปเดทราคาตลาด</button>
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกทะเบียนพอร์ตเป็น Excel แล้ว')}><Icon name="download" /> Excel</button>
        <button className="btn sm" onClick={() => onToast && onToast('กำลังเตรียมรายงานทะเบียนพอร์ต (PDF)')}><Icon name="print" /> PDF</button>
      </div>

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 0 }}>
        <IvStat label="มูลค่าพอร์ตปัจจุบัน" value={'฿ ' + fmt.money(totalValue, 0)} sub={active.length + ' รายการ Active'} accent />
        <IvStat label="เงินลงทุนรวม (ต้นทุน)" value={'฿ ' + fmt.money(totalInvest, 0)} sub={'กำไรสะสม ฿ ' + fmt.money(totalValue - totalInvest, 0)} />
        <div className="summary-card">
          <div className="label">% การเติบโตของพอร์ต</div>
          <div className="value" style={{ color: portGrowth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            <PfDelta pct={portGrowth} />
          </div>
          <div className="sub">มูลค่าตลาดเทียบต้นทุน</div>
        </div>
        <IvStat label="ดอกเบี้ยค้างรับรวม" value={'฿ ' + fmt.money(totalAccrued, 0)} sub="รอรับตามรอบจ่าย" tone="warning" />
        <IvStat label="ใกล้ครบกำหนด (≤30 วัน)" value={near + ' รายการ'} sub="ควรเตรียมประมวลผล" tone={near ? 'danger' : undefined} />
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap', padding: '10px 12px 0' }}>
          <div className="search" style={{ flex: '1 1 260px' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขที่ / ชื่อ / รหัสหลักทรัพย์…" />
          </div>
          <select className="filter-select" value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="all">ทุกประเภทสินทรัพย์</option>
            {(window.IV_ASSET_TYPE_SEED || []).map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
          <select className="filter-select" value={fIssuer} onChange={(e) => setFIssuer(e.target.value)}>
            <option value="all">ทุกผู้ออกหลักทรัพย์</option>
            {(window.IV_ISSUER_SEED || []).map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
          </select>
          <select className="filter-select" value={fFund} onChange={(e) => setFFund(e.target.value)}>
            <option value="all">ทุกแหล่งเงิน</option>
            {(window.IV_FUND_TAGS || []).map(f => <option key={f.tag} value={f.tag}>{f.tag}</option>)}
          </select>
          <select className="filter-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {window.IV_PORT_STATUS_ORDER.map(s => <option key={s} value={s}>{window.IV_PORT_STATUS[s].l}</option>)}
          </select>
        </div>
        <div className="toolbar" style={{ flexWrap: 'wrap', padding: '8px 12px', gap: 6 }}>
          <span className="muted" style={{ fontSize: 11, marginRight: 2 }}>วันครบกำหนด:</span>
          {pfChip('ทั้งหมด', fMaturity === 'all', () => setFMaturity('all'))}
          {pfChip('เลยกำหนด', fMaturity === 'overdue', () => setFMaturity('overdue'))}
          {pfChip('ภายใน 30 วัน', fMaturity === '30', () => setFMaturity('30'))}
          {pfChip('ภายใน 90 วัน', fMaturity === '90', () => setFMaturity('90'))}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11 }}>{filtered.length} รายการ</span>
        </div>

        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 1280 }}>
            <thead>
              <tr>
                <th style={{ width: 124 }}>เลขที่ลงทุน</th>
                <th style={{ width: 92 }}>ประเภท</th>
                <th style={{ minWidth: 200 }}>หลักทรัพย์</th>
                <th style={{ minWidth: 130 }}>ผู้ออก</th>
                <th className="right" style={{ width: 124 }}>เงินลงทุน</th>
                <th className="right" style={{ width: 124 }}>มูลค่าปัจจุบัน</th>
                <th className="right" style={{ width: 96 }}>% เติบโต</th>
                <th className="center" style={{ width: 80 }}>ดบ./ผลตอบแทน</th>
                <th className="right" style={{ width: 110 }}>ดบ.ค้างรับ</th>
                <th style={{ width: 150 }}>ครบกำหนด</th>
                <th style={{ width: 110 }}>แหล่งเงิน</th>
                <th className="center" style={{ width: 96 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="12" className="center muted" style={{ padding: 32 }}>ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>}
              {filtered.map(p => {
                const iss = window.ivIssuer(p.issuerCode);
                const growth = p.investAmount ? ((p.currentValue - p.investAmount) / p.investAmount) * 100 : 0;
                return (
                  <tr key={p.id} className="clickable" onClick={() => setOpenId(p.id)}>
                    <td className="mono">{p.id}</td>
                    <td><IvAssetBadge code={p.assetTypeCode} showName={false} /></td>
                    <td><div className="lt-row-name">{p.securityName}</div><div className="lt-row-note muted mono">{p.securityCode}</div></td>
                    <td><span style={{ fontSize: 12 }}>{iss ? iss.name : '—'}</span></td>
                    <td className="right mono">{fmt.money(p.investAmount, 0)}</td>
                    <td className="right mono">{p.currentValue ? fmt.money(p.currentValue, 0) : '—'}</td>
                    <td className="right">{p.currentValue ? <PfDelta pct={growth} /> : <span className="muted">—</span>}</td>
                    <td className="center mono">{p.couponRate ? p.couponRate + '%' : (p.yieldRate + '%')}</td>
                    <td className="right mono">{p.accrued ? fmt.money(p.accrued, 0) : '—'}</td>
                    <td>{p.maturityDate ? <IvMaturityTag iso={p.maturityDate} /> : <span className="muted">— ไม่มีกำหนด —</span>}</td>
                    <td><IvFundChip tag={p.fundTag} /></td>
                    <td className="center"><IvPortPill status={p.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> คลิกแถวเพื่อ Drill down ดูรายละเอียดหลักทรัพย์ แผนรับผลตอบแทน และเอกสารประกอบของแต่ละรายการ
      </div>
    </div>
  );
}

Object.assign(window, { PortfolioRegisterPage });
