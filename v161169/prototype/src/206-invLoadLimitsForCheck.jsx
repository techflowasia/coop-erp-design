// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — บันทึกการลงทุนใหม่
//  ฟอร์มบันทึกรายการลงทุน + ตรวจสอบวงเงินประจำปี (real-time) +
//  ตรวจสอบประเภทสินทรัพย์ตามประกาศ + แนบเอกสาร + ส่งอนุมัติ +
//  สร้างแผนรับดอกเบี้ย/ปันผล + สร้างรายการบัญชีอัตโนมัติ
// ════════════════════════════════════════════════════════════════════

function invLoadLimitsForCheck() {
  try { const s = localStorage.getItem('invest_limits'); if (s) return JSON.parse(s); } catch (e) {}
  return window.IV_LIMIT_SEED || [];
}

function NewInvestmentPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [port, setPort] = useState(window.ivLoadPort);
  const [limits] = useState(invLoadLimitsForCheck);
  const curLimit = limits.find(r => r.status !== 'ปิดปี') || limits[0];

  const blank = () => ({
    id: window.ivNextInvNo(port), investDate: ivToday(), assetTypeCode: '',
    securityName: '', securityCode: '', issuerCode: '', rating: '',
    investAmount: '', buyPrice: '', units: '', faceValue: '',
    marketPrice: '', marketAsOf: ivToday(),
    couponRate: '', yieldRate: '', couponFreq: 'ราย 6 เดือน',
    startDate: ivToday(), maturityDate: '', nextCouponDate: '',
    fundTag: 'ทุนดำเนินงาน', owner: IV_USER, docs: [],
    genSchedule: true, genJournal: true,
  });
  const [d, setD] = useState(blank);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));

  const t = window.ivAssetType(d.assetTypeCode);
  const isUnit = !!(t && t.valuationMode === 'unit');

  // ── คำนวณจำนวนเงินลงทุนให้สอดคล้องกัน ──
  //  • แบบมูลค่า : กรอกจำนวนเงินลงทุนโดยตรง
  //  • แบบหน่วย : จำนวนเงินลงทุน = ราคาซื้อต่อหน่วย × จำนวนหน่วย + ต้องระบุราคาตลาด
  const buyP = Number(d.buyPrice || 0);
  const unitsN = Number(d.units || 0);
  const mktPrice = Number(d.marketPrice || 0);
  const amt = isUnit ? buyP * unitsN : Number(d.investAmount || 0);
  const marketValue = isUnit ? unitsN * mktPrice : amt;
  const needMarket = isUnit;
  const marketOk = !needMarket || mktPrice > 0;

  // ── ตรวจสอบประเภทสินทรัพย์ตามประกาศ ──
  const typeAllowed = t ? (t.enabled && t.countLimit) : null;

  // ── ตรวจสอบวงเงินประจำปี ──
  const cat = curLimit && t ? curLimit.breakdown.find(b => b.typeCode === t.code) : null;
  const catRemain = cat ? cat.limit - cat.used : null;
  const totalUsed = curLimit ? curLimit.breakdown.reduce((a, b) => a + b.used, 0) : 0;
  const totalRemain = curLimit ? curLimit.totalLimit - totalUsed : null;
  const overCat = cat ? amt > catRemain : false;
  const overTotal = totalRemain != null ? amt > totalRemain : false;
  const limitOk = amt > 0 && cat && !overCat && !overTotal;

  const requiredOk = d.assetTypeCode && d.securityName.trim() && d.issuerCode &&
                     (!t || !t.needMaturity || d.maturityDate) &&
                     (isUnit ? (buyP > 0 && unitsN > 0 && mktPrice > 0) : amt > 0);

  const addDoc = () => {
    const name = prompt('ชื่อไฟล์เอกสารแนบ (เช่น สัญญาซื้อขาย.pdf)');
    if (name) set('docs', [...d.docs, name]);
  };
  const rmDoc = (i) => set('docs', d.docs.filter((_, idx) => idx !== i));

  const finalize = (status) => {
    const rec = {
      id: d.id, investDate: d.investDate, assetTypeCode: d.assetTypeCode,
      securityName: d.securityName.trim(), securityCode: d.securityCode.trim(),
      issuerCode: d.issuerCode, rating: d.rating || (window.ivIssuer(d.issuerCode) || {}).rating || '—',
      faceValue: 0, buyPrice: isUnit ? +buyP.toFixed(4) : 0, units: isUnit ? unitsN : 0,
      investAmount: Math.round(amt), currentValue: Math.round(marketValue),
      marketPrice: isUnit ? +mktPrice.toFixed(4) : null, marketAsOf: isUnit ? d.investDate : null,
      couponRate: Number(d.couponRate || 0), yieldRate: Number(d.yieldRate || 0), couponFreq: d.couponFreq,
      startDate: d.startDate, maturityDate: d.maturityDate || null, nextCouponDate: d.nextCouponDate || null,
      fundTag: d.fundTag, accrued: 0, owner: d.owner,
      status, approver: '', docs: d.docs,
    };
    const next = [rec, ...port];
    setPort(next); window.ivSavePort(next);
    // บันทึกราคาตลาด ณ วันที่ลงทุนเข้าคลังราคาตลาด (ให้สอดคล้องกับราคาตลาดประจำวัน)
    if (isUnit && mktPrice > 0 && rec.securityCode) {
      const ms = window.ivLoadMarket();
      ms.prices = ms.prices || {};
      ms.prices[rec.securityCode] = { price: +mktPrice.toFixed(4), prevClose: +mktPrice.toFixed(4), asOf: d.investDate };
      window.ivSaveMarket(ms);
    }
    audit.log({ action: 'create', module: 'การเงินการลงทุน — บันทึกการลงทุน',
      target: `${rec.id} · ${rec.securityName}`,
      summary: `${status === 'pending' ? 'ส่งอนุมัติ' : 'บันทึกร่าง'}รายการลงทุน ${rec.id} (${fmt.money(amt, 0)} บาท)`,
      changes: [{ field: 'จำนวนเงินลงทุน', before: '—', after: fmt.money(amt, 0) }] });
    const extras = [];
    if (d.genSchedule && d.couponRate) extras.push('สร้างแผนรับผลตอบแทนแล้ว');
    if (d.genJournal) extras.push('สร้างรายการบัญชีอัตโนมัติแล้ว');
    onToast && onToast(`${status === 'pending' ? 'ส่งอนุมัติ' : 'บันทึกร่าง'}รายการลงทุน ${rec.id} เรียบร้อย${extras.length ? ' · ' + extras.join(' · ') : ''}`);
    setD(blank());
  };

  return (
    <div data-screen-label="หน้าบันทึกการลงทุนใหม่">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกการลงทุนใหม่</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกรายการลงทุนพร้อมตรวจสอบวงเงินประจำปีและประเภทสินทรัพย์ตามประกาศ ก่อนส่งอนุมัติ
          </div>
        </div>
        <span className="spacer" />
        <span className="lb-docno"><span className="lb-docno-k">เลขที่รายการลงทุน</span><span className="lb-docno-v">{d.id}</span></span>
      </div>

      <div className="iv-form-layout">
        {/* ── ฟอร์ม ── */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <IvSection icon="info" title="ข้อมูลรายการและหลักทรัพย์">
            <div className="iv-form-grid c3">
              <IvField label="วันที่ลงทุน" required>
                <ErpDate value={d.investDate} onChange={(v) => ((e) => set('investDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </IvField>
              <IvField label="ประเภทสินทรัพย์" required>
                <select className="cfg-input" value={d.assetTypeCode} onChange={(e) => { const v = e.target.value; set('assetTypeCode', v); const at = window.ivAssetType(v); if (at && !at.needMaturity) set('maturityDate', ''); }}>
                  <option value="">— เลือก —</option>
                  {(window.IV_ASSET_TYPE_SEED || []).map(a => <option key={a.code} value={a.code} disabled={!a.enabled}>{a.name}{!a.enabled ? ' (ปิดใช้งาน)' : ''}</option>)}
                </select>
              </IvField>
              <IvField label="ผู้ออกหลักทรัพย์ / คู่สัญญา" required>
                <select className="cfg-input" value={d.issuerCode} onChange={(e) => { const v = e.target.value; set('issuerCode', v); const is = window.ivIssuer(v); if (is) set('rating', is.rating); }}>
                  <option value="">— เลือก —</option>
                  {(window.IV_ISSUER_SEED || []).filter(i => i.enabled).map(i => <option key={i.code} value={i.code}>{i.name}</option>)}
                </select>
              </IvField>
              <IvField label="ชื่อหลักทรัพย์" required span={2}>
                <input className="cfg-input" value={d.securityName} placeholder="เช่น พันธบัตรรัฐบาล LB29DA" onChange={(e) => set('securityName', e.target.value)} />
              </IvField>
              <IvField label="รหัสหลักทรัพย์">
                <input className="cfg-input mono" value={d.securityCode} placeholder="เช่น LB29DA" onChange={(e) => set('securityCode', e.target.value)} />
              </IvField>
            </div>
          </IvSection>

          <IvSection icon="money" title="ข้อมูลเงินลงทุนและผลตอบแทน"
                     right={t ? <span className={"chip " + (isUnit ? 'primary' : 'info')}><span className="dot-c" />ลงทุนแบบ{isUnit ? 'หน่วยลงทุน' : 'มูลค่า'}</span> : null}>
            <div className="iv-form-grid c4">
              {isUnit ? (
                <>
                  <IvField label="ราคาซื้อต่อหน่วย" required>
                    <div className="mp-price-wrap">
                      <input className="cfg-input mono mp-price-in" type="number" inputMode="decimal" value={d.buyPrice} placeholder="0.00" onChange={(e) => set('buyPrice', e.target.value)} />
                      <span className="mp-price-unit">฿</span>
                    </div>
                  </IvField>
                  <IvField label="จำนวนหน่วย" required>
                    <input className="cfg-input mono" type="number" value={d.units} style={{ textAlign: 'right' }} placeholder="0" onChange={(e) => set('units', e.target.value)} />
                  </IvField>
                  <IvField label="ราคาตลาด/หน่วย" required hint={mktPrice > 0 && unitsN > 0 ? `มูลค่าตลาด ≈ ${fmt.money(marketValue, 0)} บาท` : 'ราคาตลาด ณ วันที่ลงทุน'}>
                    <div className="mp-price-wrap">
                      <input className="cfg-input mono mp-price-in" type="number" inputMode="decimal" value={d.marketPrice} placeholder="0.00" onChange={(e) => set('marketPrice', e.target.value)} />
                      <span className="mp-price-unit">฿</span>
                    </div>
                  </IvField>
                  <IvField label="จำนวนเงินลงทุน" hint="ราคาซื้อ × จำนวนหน่วย">
                    <div className="lt-num-wrap">
                      <input className="cfg-input mono" readOnly value={amt ? fmt.money(amt, 2) : ''} style={{ textAlign: 'right', background: 'var(--bg-subtle)' }} placeholder="0.00" />
                      <span className="lt-suffix">บาท</span>
                    </div>
                  </IvField>
                </>
              ) : (
                <IvField label="จำนวนเงินลงทุน" required span={2}
                         hint={d.assetTypeCode ? 'ลงทุนแบบมูลค่า — กรอกจำนวนเงินลงทุนโดยตรง' : 'เลือกประเภทสินทรัพย์ก่อน'}>
                  <IvMoneyInput value={d.investAmount} onChange={(v) => set('investAmount', v)} />
                </IvField>
              )}
              <IvField label="อัตราดอกเบี้ย (%)">
                <input className="cfg-input mono" type="number" value={d.couponRate} style={{ textAlign: 'right' }} placeholder="0.00" onChange={(e) => set('couponRate', e.target.value)} />
              </IvField>
              <IvField label="อัตราผลตอบแทน (Yield %)">
                <input className="cfg-input mono" type="number" value={d.yieldRate} style={{ textAlign: 'right' }} placeholder="0.00" onChange={(e) => set('yieldRate', e.target.value)} />
              </IvField>
              <IvField label="รอบจ่ายดอกเบี้ย">
                <select className="cfg-input" value={d.couponFreq} onChange={(e) => set('couponFreq', e.target.value)}>
                  {window.IV_COUPON_FREQ.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </IvField>
            </div>
          </IvSection>

          <IvSection icon="calendar" title="วันสำคัญ">
            <div className="iv-form-grid c3">
              <IvField label="วันที่เริ่มลงทุน" required>
                <ErpDate value={d.startDate} onChange={(v) => ((e) => set('startDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </IvField>
              <IvField label="วันที่ครบกำหนด" required={t && t.needMaturity} hint={t && !t.needMaturity ? 'ประเภทนี้ไม่มีวันครบกำหนด' : ''}>
                <ErpDate value={d.maturityDate} onChange={(v) => ((e) => set('maturityDate', e.target.value))({ target: { value: v } })} disabled={t && !t.needMaturity} className="cfg-input" />
              </IvField>
              <IvField label="วันที่รับดอกเบี้ยครั้งถัดไป">
                <ErpDate value={d.nextCouponDate} onChange={(v) => ((e) => set('nextCouponDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </IvField>
            </div>
          </IvSection>

          <IvSection icon="wallet" title="แหล่งเงินและผู้รับผิดชอบ">
            <div className="iv-form-grid c2">
              <IvField label="แหล่งเงิน / Tag" required>
                <select className="cfg-input" value={d.fundTag} onChange={(e) => set('fundTag', e.target.value)}>
                  {(window.IV_FUND_TAGS || []).map(f => <option key={f.tag} value={f.tag}>{f.tag}</option>)}
                </select>
              </IvField>
              <IvField label="ผู้รับผิดชอบ">
                <input className="cfg-input" value={d.owner} onChange={(e) => set('owner', e.target.value)} />
              </IvField>
            </div>
          </IvSection>

          <IvSection icon="attach" title="เอกสารประกอบ" count={d.docs.length}>
            <IvDocList docs={d.docs} editable onAdd={addDoc} onRemove={rmDoc} />
            <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>แนบสัญญา · ใบยืนยันการซื้อ · เอกสารอนุมัติ</div>
          </IvSection>
        </div>

        {/* ── แผงตรวจสอบ (sticky) ── */}
        <div className="iv-side">
          <div className="search-card iv-check-card">
            <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>ตรวจสอบก่อนบันทึก</h3></div>

            {/* ตรวจประเภทสินทรัพย์ตามประกาศ */}
            <div className={"iv-check-line " + (typeAllowed == null ? 'none' : typeAllowed ? 'ok' : 'bad')}>
              <Icon name={typeAllowed ? 'check' : typeAllowed == null ? 'info' : 'close'} size={15} />
              <div>
                <b>ประเภทสินทรัพย์ตามประกาศ</b>
                <div className="muted" style={{ fontSize: 11 }}>
                  {typeAllowed == null ? 'เลือกประเภทสินทรัพย์เพื่อตรวจสอบ'
                    : typeAllowed ? `${t.name} — ลงทุนได้ตามประกาศ (ความเสี่ยง${t.risk})`
                    : `${t.name} — ปิดใช้งาน / ไม่นับวงเงิน ไม่สามารถลงทุนได้`}
                </div>
              </div>
            </div>

            {/* ตรวจราคาตลาด ณ วันที่ลงทุน */}
            <div className={"iv-check-line " + (!d.assetTypeCode ? 'none' : !needMarket ? 'ok' : marketOk ? 'ok' : 'bad')}>
              <Icon name={!d.assetTypeCode ? 'info' : (!needMarket || marketOk) ? 'check' : 'close'} size={15} />
              <div>
                <b>ราคาตลาด ณ วันที่ลงทุน</b>
                <div className="muted" style={{ fontSize: 11 }}>
                  {!d.assetTypeCode ? 'เลือกประเภทสินทรัพย์เพื่อตรวจสอบ'
                    : !needMarket ? 'ลงทุนแบบมูลค่า — บันทึกตามจำนวนเงินลงทุน ไม่บังคับราคาตลาด'
                    : marketOk ? `ระบุแล้ว ${mktPrice} บาท/หน่วย · มูลค่าตลาด ${fmt.money(marketValue, 0)} บาท`
                    : 'ลงทุนแบบหน่วย — ต้องระบุราคาตลาด/หน่วย ณ วันที่ลงทุน (บังคับ)'}
                </div>
              </div>
            </div>

            {/* ตรวจวงเงินประจำปี */}
            <div className="iv-limit-box">
              <div className="iv-limit-head">
                <span>วงเงินลงทุนประจำปี {curLimit ? curLimit.year : '—'}</span>
                {cat && <span className="mono">{t.code}</span>}
              </div>
              {cat ? (
                <>
                  <div className="iv-limit-row"><span>วงเงินจัดสรร</span><span className="mono">{fmt.money(cat.limit, 0)}</span></div>
                  <div className="iv-limit-row"><span>ใช้ไปแล้ว</span><span className="mono">{fmt.money(cat.used, 0)}</span></div>
                  <div className="iv-limit-row strong"><span>คงเหลือประเภทนี้</span><span className={"mono" + (overCat ? ' bad' : '')}>{fmt.money(catRemain, 0)}</span></div>
                  <div style={{ margin: '8px 0 4px' }}><IvBar pct={cat.limit ? (cat.used / cat.limit) * 100 : 0} /></div>
                  <div className="iv-limit-row" style={{ borderTop: '1px solid var(--divider)', paddingTop: 6, marginTop: 4 }}>
                    <span>คงเหลือรวมทั้งปี</span><span className={"mono" + (overTotal ? ' bad' : '')}>{fmt.money(totalRemain, 0)}</span></div>
                </>
              ) : (
                <div className="muted" style={{ fontSize: 11.5, padding: '6px 0' }}>เลือกประเภทสินทรัพย์ที่นับวงเงินเพื่อตรวจสอบวงเงินคงเหลือ</div>
              )}
            </div>

            {/* ผลตรวจวงเงิน */}
            {amt > 0 && cat && (
              limitOk ? (
                <div className="ivl-result ok"><Icon name="check" size={16} />
                  <div><b>อยู่ในวงเงิน</b><div className="muted" style={{ fontSize: 11 }}>หลังบันทึกเหลือประเภทนี้ {fmt.money(catRemain - amt, 0)} บาท</div></div>
                </div>
              ) : (
                <div className="ivl-result bad"><Icon name="info" size={16} />
                  <div><b>เกินวงเงิน</b><div className="muted" style={{ fontSize: 11 }}>
                    {overCat && <>เกินประเภทนี้ {fmt.money(amt - catRemain, 0)} บาท</>}
                    {overCat && overTotal && <br />}
                    {overTotal && <>เกินวงเงินรวม {fmt.money(amt - totalRemain, 0)} บาท</>}
                  </div></div>
                </div>
              )
            )}

            {/* ตัวเลือกอัตโนมัติ */}
            <div className="iv-auto-opts">
              <label className={"check-row" + (d.genSchedule ? ' on' : '')} onClick={() => set('genSchedule', !d.genSchedule)}>
                <span className="box" /><span className="ck-label">สร้างแผนรับดอกเบี้ย / เงินปันผล</span>
              </label>
              <label className={"check-row" + (d.genJournal ? ' on' : '')} onClick={() => set('genJournal', !d.genJournal)}>
                <span className="box" /><span className="ck-label">สร้างรายการบัญชีอัตโนมัติ</span>
              </label>
            </div>

            {/* สรุปยอด */}
            <div className="iv-side-total">
              <span className="iv-side-total-k">จำนวนเงินลงทุน</span>
              <span className="iv-side-total-v">฿ {fmt.money(amt, 0)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button className="btn block" disabled={!requiredOk} onClick={() => finalize('draft')}><Icon name="check" /> บันทึกร่าง</button>
              <button className="btn primary block" disabled={!requiredOk || !limitOk || !typeAllowed}
                      onClick={() => finalize('pending')}><Icon name="upload" /> บันทึกและส่งอนุมัติ</button>
              {!requiredOk && <div className="muted" style={{ fontSize: 11, textAlign: 'center' }}>กรอกข้อมูลที่จำเป็น (*) ให้ครบก่อน</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NewInvestmentPage });
