// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › ค่าคงที่ — กำหนดวงเงินลงทุนประจำปี
//  รายการปีงบประมาณ ⇄ รายละเอียดวงเงิน (รวม + แยกตามประเภทสินทรัพย์)
//  ฟังก์ชัน: ตั้งวงเงิน · ตรวจสอบวงเงินก่อนบันทึก · แจ้งเตือนเกินวงเงิน
//           · แสดงใช้ไป/คงเหลือแบบ Real-time · ประวัติการแก้ไขวงเงิน
// ════════════════════════════════════════════════════════════════════

const ivlToday = () => new Date().toISOString().slice(0, 10);
const ivlNow = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const IVL_USER = 'จันทร์เพ็ญ มาลี';

function ivlLoad() {
  try { const s = localStorage.getItem('invest_limits'); if (s) return JSON.parse(s).map(ivlNorm); } catch (e) {}
  return window.IV_LIMIT_SEED.map(r => ({ ...r, breakdown: r.breakdown.map(b => ({ ...b })), history: r.history.map(h => ({ ...h })) })).map(ivlNorm);
}
// รองรับข้อมูลเก่าที่ยังไม่มีฟิลด์มติ คสอ.
const ivlNorm = (r) => ({ ...r, resolution: r.resolution || { meetingNo: '', meetingDate: '', agenda: '', detail: '' } });
function ivlSaveLS(list) { try { localStorage.setItem('invest_limits', JSON.stringify(list)); } catch (e) {} }

const ivlSum = (bd, key) => bd.reduce((a, b) => a + Number(b[key] || 0), 0);
const ivlStatusPill = (s) => {
  if (s === 'อนุมัติ') return <span className="pill ok">อนุมัติแล้ว</span>;
  if (s === 'ร่าง')    return <span className="pill warn">ร่าง</span>;
  if (s === 'ปิดปี')   return <span className="pill neutral">ปิดปี</span>;
  return <span className="pill info">{s}</span>;
};
// สีตามระดับการใช้วงเงิน
const ivlUtilColor = (pct) => pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--primary)';
const ivlUtilPill = (pct) => {
  if (pct >= 100) return <span className="pill bad">เต็ม/เกินวงเงิน</span>;
  if (pct >= 90)  return <span className="pill warn">ใกล้เต็ม</span>;
  if (pct >= 80)  return <span className="pill warn">เฝ้าระวัง</span>;
  return <span className="pill ok">ปกติ</span>;
};

// ─── แถบวัดการใช้วงเงิน ───────────────────────────────────────────────
function IvlBar({ pct }) {
  const w = Math.min(100, pct);
  return (
    <div style={{ height: 7, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ height: '100%', width: w + '%', background: ivlUtilColor(pct), transition: 'width .3s' }} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ป๊อบอัพ: ตรวจสอบวงเงินก่อนบันทึกการลงทุน (Real-time)
// ════════════════════════════════════════════════════════════════════
function IvlCheckModal({ record, onClose }) {
  const [typeCode, setTypeCode] = useState(record.breakdown[0]?.typeCode || '');
  const [amount, setAmount] = useState('');
  const cat = record.breakdown.find(b => b.typeCode === typeCode);
  const amt = Number(amount || 0);

  const totalLimit = record.totalLimit;
  const totalUsed = ivlSum(record.breakdown, 'used');
  const totalRemain = totalLimit - totalUsed;
  const catRemain = cat ? (cat.limit - cat.used) : 0;

  const overCat = cat && amt > catRemain;
  const overTotal = amt > totalRemain;
  const ok = amt > 0 && !overCat && !overTotal;
  const closed = record.status === 'ปิดปี';

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="shield" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ตรวจสอบวงเงินก่อนบันทึกการลงทุน</h2>
            <div className="muted" style={{ fontSize: 11 }}>ปีงบประมาณ {record.year} · ตรวจสอบวงเงินคงเหลือแบบ Real-time</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {closed && (
            <div className="dat-warn" style={{ marginTop: 0, marginBottom: 12 }}>
              <Icon name="info" size={14} /><span>ปีงบประมาณนี้<b>ปิดปีแล้ว</b> — ไม่สามารถบันทึกการลงทุนเพิ่มได้</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">ประเภทสินทรัพย์</label>
              <select className="cfg-input" value={typeCode} onChange={(e) => setTypeCode(e.target.value)}>
                {record.breakdown.map(b => <option key={b.typeCode} value={b.typeCode}>{b.typeCode} · {b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="lt-modal-label">จำนวนเงินที่จะลงทุน (บาท)</label>
              <input className="cfg-input mono" type="number" inputMode="decimal" value={amount} autoFocus
                     style={{ textAlign: 'right' }} placeholder="0.00" onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="ivl-check-grid">
            <div className="ivl-check-row">
              <span className="ivl-ck-k">วงเงินคงเหลือ — {cat ? cat.name : '—'}</span>
              <span className={"ivl-ck-v mono" + (overCat ? ' bad' : '')}>{fmt.money(catRemain, 0)}</span>
            </div>
            <div className="ivl-check-row">
              <span className="ivl-ck-k">วงเงินคงเหลือรวมทั้งปี</span>
              <span className={"ivl-ck-v mono" + (overTotal ? ' bad' : '')}>{fmt.money(totalRemain, 0)}</span>
            </div>
            <div className="ivl-check-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 9 }}>
              <span className="ivl-ck-k">จำนวนที่ขอลงทุน</span>
              <span className="ivl-ck-v mono"><b>{fmt.money(amt, 0)}</b></span>
            </div>
          </div>

          {amt > 0 && (
            ok ? (
              <div className="ivl-result ok">
                <Icon name="check" size={16} />
                <div>
                  <b>ผ่าน — อยู่ในวงเงิน</b>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    หลังบันทึกจะเหลือวงเงินประเภทนี้ {fmt.money(catRemain - amt, 0)} บาท · คงเหลือรวม {fmt.money(totalRemain - amt, 0)} บาท
                  </div>
                </div>
              </div>
            ) : (
              <div className="ivl-result bad">
                <Icon name="info" size={16} />
                <div>
                  <b>เกินวงเงิน — ไม่สามารถบันทึกได้</b>
                  <div className="muted" style={{ fontSize: 11.5 }}>
                    {overCat && <>เกินวงเงินประเภท {cat.name} {fmt.money(amt - catRemain, 0)} บาท</>}
                    {overCat && overTotal && <br />}
                    {overTotal && <>เกินวงเงินคงเหลือรวมทั้งปี {fmt.money(amt - totalRemain, 0)} บาท</>}
                  </div>
                </div>
              </div>
            )
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ปิด</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={!ok || closed}>
              <Icon name="check" /> ผ่าน — ไปบันทึกการลงทุน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ป๊อบอัพ: เพิ่มปีงบประมาณ
// ════════════════════════════════════════════════════════════════════
function IvlAddYearModal({ list, onClose, onCreate }) {
  const nextYear = Math.max(...list.map(r => r.year)) + 1;
  const [year, setYear] = useState(String(nextYear));
  const [total, setTotal] = useState('1000000000');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const y = Number(year);
    if (!y || y < 2560) return setError('กรุณาระบุปีงบประมาณ (พ.ศ.) ที่ถูกต้อง');
    if (list.some(r => r.year === y)) return setError('มีวงเงินลงทุนของปีนี้อยู่แล้ว');
    if (Number(total) <= 0) return setError('กรุณาระบุวงเงินลงทุนรวม');
    // เริ่มจากประเภทสินทรัพย์ที่ “นับรวมวงเงิน” และเปิดใช้งาน
    const types = (window.IV_ASSET_TYPE_SEED || []).filter(t => t.countLimit && t.enabled).slice(0, 6);
    onCreate({
      id: 'IVL-' + y, year: y, totalLimit: Number(total),
      announceDate: ivlToday(), docRef: '', approver: '', status: 'ร่าง',
      note: 'ร่างวงเงินลงทุนประจำปี ' + y,
      resolution: { meetingNo: '', meetingDate: '', agenda: '', detail: '' },
      breakdown: types.map(t => ({ typeCode: t.code, name: t.name, limit: 0, used: 0 })),
      history: [{ ts: ivlNow(), user: IVL_USER, action: 'ตั้งวงเงิน', detail: `สร้างร่างวงเงินลงทุนประจำปี ${y} รวม ${fmt.money(Number(total), 0)} บาท` }],
    });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มวงเงินลงทุนประจำปี</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างร่างวงเงินสำหรับปีงบประมาณใหม่</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">ปีงบประมาณ (พ.ศ.) <span className="cfg-required">*</span></label>
          <input className="cfg-input mono" value={year} autoFocus onChange={(e) => { setYear(e.target.value); setError(''); }} />
          <label className="lt-modal-label" style={{ marginTop: 12 }}>วงเงินลงทุนรวม <span className="cfg-required">*</span></label>
          <div className="lt-num-wrap">
            <input className="cfg-input mono" type="number" value={total} style={{ textAlign: 'right' }}
                   onChange={(e) => { setTotal(e.target.value); setError(''); }} />
            <span className="lt-suffix">บาท</span>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>≈ {fmt.money(Number(total || 0) / 1000000, 0)} ล้านบาท</div>
          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> สร้างร่างวงเงิน</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดวงเงินลงทุนรายปี
// ════════════════════════════════════════════════════════════════════
function IvlDetail({ record, onBack, onSave, onToast }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record);
  const [checking, setChecking] = useState(false);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const cur = editing ? draft : record;
  const totalUsed = ivlSum(cur.breakdown, 'used');
  const allocated = ivlSum(cur.breakdown, 'limit');
  const totalRemain = cur.totalLimit - totalUsed;
  const totalPct = cur.totalLimit > 0 ? (totalUsed / cur.totalLimit) * 100 : 0;
  const overCats = record.breakdown.filter(b => b.used >= b.limit && b.limit > 0);

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setReso = (k, v) => setDraft(d => ({ ...d, resolution: { ...(d.resolution || {}), [k]: v } }));
  const setCat = (i, k, v) => setDraft(d => ({ ...d, breakdown: d.breakdown.map((b, idx) => idx === i ? { ...b, [k]: Number(v || 0) } : b) }));

  const startEdit = () => { setDraft(record); setEditing(true); };
  const cancel = () => { setDraft(record); setEditing(false); };
  const save = () => {
    const entry = { ts: ivlNow(), user: IVL_USER, action: 'แก้ไข',
      detail: `ปรับวงเงินลงทุนประจำปี ${draft.year} — รวม ${fmt.money(draft.totalLimit, 0)} บาท (จัดสรร ${fmt.money(ivlSum(draft.breakdown, 'limit'), 0)} บาท)` };
    onSave({ ...draft, history: [entry, ...(draft.history || [])] });
    setEditing(false);
  };

  return (
    <div data-screen-label="หน้ารายละเอียดวงเงินลงทุนประจำปี">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {!editing ? (
          <>
            <button className="btn sm" onClick={() => setChecking(true)}><Icon name="shield" /> ตรวจสอบวงเงินก่อนบันทึก</button>
            {record.status !== 'ปิดปี' && <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> ตั้ง / แก้ไขวงเงิน</button>}
          </>
        ) : (
          <>
            <button className="btn sm" onClick={cancel}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกวงเงิน</button>
          </>
        )}
      </div>

      {/* หัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="money" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">วงเงินลงทุนประจำปี <span className="mono">{record.year}</span> {ivlStatusPill(cur.status)}</h1>
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span><span className="dot" />
              <span>ประกาศ {record.announceDate ? fmt.date(record.announceDate) : '—'}</span><span className="dot" />
              <span>{record.docRef || 'ยังไม่มีเอกสารอ้างอิง'}</span>
              {(record.resolution || {}).meetingNo && <><span className="dot" /><span>มติ {(record.resolution || {}).meetingNo}</span></>}
            </div>
          </div>
        </div>
      </div>

      {/* แจ้งเตือนเกินวงเงิน / ใกล้เต็ม */}
      {overCats.length > 0 && (
        <div className="dat-warn">
          <Icon name="info" size={14} />
          <span>มี <b>{overCats.length} ประเภทสินทรัพย์</b>ที่ใช้วงเงินเต็มหรือเกินเพดานที่จัดสรร: {overCats.map(c => c.name).join(', ')} — ควรทบทวนการจัดสรรวงเงินก่อนบันทึกการลงทุนเพิ่ม</span>
        </div>
      )}

      {/* สรุปวงเงิน Real-time */}
      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="summary-card accent">
          <div className="label">วงเงินลงทุนรวม{editing ? ' (แก้ไขได้)' : ''}</div>
          {editing
            ? <div className="lt-num-wrap" style={{ marginTop: 4 }}>
                <input className="cfg-input mono" type="number" value={draft.totalLimit} style={{ textAlign: 'right', maxWidth: 200 }}
                       onChange={(e) => setField('totalLimit', Number(e.target.value || 0))} />
                <span className="lt-suffix">บาท</span>
              </div>
            : <div className="value">฿ {fmt.money(cur.totalLimit, 0)}</div>}
          <div className="sub">จัดสรรแล้ว ฿ {fmt.money(allocated, 0)} ({cur.totalLimit > 0 ? Math.round(allocated / cur.totalLimit * 100) : 0}%)</div>
        </div>
        <div className="summary-card">
          <div className="label">วงเงินที่ใช้ไป (Real-time)</div>
          <div className="value" style={{ color: ivlUtilColor(totalPct) }}>฿ {fmt.money(totalUsed, 0)}</div>
          <div className="sub">{totalPct.toFixed(1)}% ของวงเงินรวม</div>
        </div>
        <div className="summary-card">
          <div className="label">วงเงินคงเหลือ</div>
          <div className="value">฿ {fmt.money(totalRemain, 0)}</div>
          <div className="sub">พร้อมลงทุนเพิ่ม</div>
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 6 }}><span className="head-bar" /><h3>การใช้วงเงินรวมทั้งปี</h3>
          <span className="spacer" style={{ flex: 1 }} />{ivlUtilPill(totalPct)}</div>
        <IvlBar pct={totalPct} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          <span>ใช้ไป ฿ {fmt.money(totalUsed, 0)}</span>
          <span>วงเงินรวม ฿ {fmt.money(cur.totalLimit, 0)}</span>
        </div>
      </div>

      {/* วงเงินแยกตามประเภทสินทรัพย์ */}
      <div className="search-card" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
        <div className="section-head" style={{ padding: '12px 16px 0' }}><span className="head-bar" /><h3>วงเงินแยกตามประเภทสินทรัพย์</h3>
          <span className="gc-count">{cur.breakdown.length} ประเภท</span></div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0, marginTop: 10 }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 84 }}>รหัส</th>
                <th style={{ minWidth: 200 }}>ประเภทสินทรัพย์</th>
                <th className="right" style={{ width: 150 }}>วงเงินจัดสรร</th>
                <th className="right" style={{ width: 150 }}>ใช้ไป</th>
                <th className="right" style={{ width: 150 }}>คงเหลือ</th>
                <th style={{ width: 200 }}>% การใช้วงเงิน</th>
                <th className="center" style={{ width: 110 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {cur.breakdown.map((b, i) => {
                const remain = b.limit - b.used;
                const pct = b.limit > 0 ? (b.used / b.limit) * 100 : 0;
                return (
                  <tr key={b.typeCode}>
                    <td className="mono">{b.typeCode}</td>
                    <td>{b.name}</td>
                    <td className="right mono">
                      {editing
                        ? <input className="cfg-input mono" type="number" value={b.limit} style={{ textAlign: 'right', maxWidth: 130, marginLeft: 'auto' }}
                                 onChange={(e) => setCat(i, 'limit', e.target.value)} />
                        : <b>{fmt.money(b.limit, 0)}</b>}
                    </td>
                    <td className="right mono">{fmt.money(b.used, 0)}</td>
                    <td className="right mono" style={{ color: remain < 0 ? 'var(--danger)' : undefined }}>{fmt.money(remain, 0)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}><IvlBar pct={pct} /></div>
                        <span className="mono" style={{ fontSize: 11, minWidth: 42, textAlign: 'right', color: ivlUtilColor(pct) }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="center">{ivlUtilPill(pct)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="right">รวมจัดสรร</td>
                <td className="right mono"><b>{fmt.money(allocated, 0)}</b></td>
                <td className="right mono"><b>{fmt.money(totalUsed, 0)}</b></td>
                <td className="right mono"><b>{fmt.money(allocated - totalUsed, 0)}</b></td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
        {editing && allocated !== cur.totalLimit && (
          <div className="lt-list-foot muted" style={{ borderTop: '1px solid var(--divider)' }}>
            <Icon name="info" size={12} /> ยอดจัดสรรรวม ({fmt.money(allocated, 0)}) {allocated > cur.totalLimit ? 'เกิน' : 'ยังไม่เท่ากับ'}วงเงินลงทุนรวม ({fmt.money(cur.totalLimit, 0)}) — ส่วนต่าง {fmt.money(Math.abs(cur.totalLimit - allocated), 0)} บาท
          </div>
        )}
      </div>

      {/* ข้อมูลประกาศ + ผู้อนุมัติ */}
      <div className="dat-cols" style={{ marginTop: 12 }}>
        <div className="search-card dat-section">
          <div className="dat-section-head"><span className="dat-section-ico"><Icon name="receipt" size={15} /></span>
            <div className="dat-section-title">ข้อมูลประกาศ</div></div>
          <div className="dat-grid">
            <div className="dat-field"><label className="dat-label">วันที่ประกาศ</label>
              {editing ? <ErpDate value={draft.announceDate} onChange={(v) => ((e) => setField('announceDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
                       : <div className="dat-read">{cur.announceDate ? fmt.date(cur.announceDate) : '—'}</div>}</div>
            <div className="dat-field"><label className="dat-label">สถานะ</label>
              {editing ? <select className="cfg-input" value={draft.status} onChange={(e) => setField('status', e.target.value)}>
                  {['ร่าง', 'อนุมัติ', 'ปิดปี'].map(s => <option key={s} value={s}>{s}</option>)}
                </select> : <div className="dat-read">{ivlStatusPill(cur.status)}</div>}</div>
            <div className="dat-field" style={{ gridColumn: 'span 2' }}><label className="dat-label">เอกสารอ้างอิง</label>
              {editing ? <input className="cfg-input" value={draft.docRef} placeholder="เช่น ประกาศ สอ.กสท. ที่ .../..." onChange={(e) => setField('docRef', e.target.value)} />
                       : <div className="dat-read">{cur.docRef || '—'}</div>}</div>
            <div className="dat-field" style={{ gridColumn: 'span 2' }}><label className="dat-label">ผู้อนุมัติ</label>
              {editing ? <input className="cfg-input" value={draft.approver} placeholder="เช่น คณะกรรมการดำเนินการ ชุดที่ ..." onChange={(e) => setField('approver', e.target.value)} />
                       : <div className="dat-read">{cur.approver || '—'}</div>}</div>
          </div>
        </div>

        <div className="search-card dat-section">
          <div className="dat-section-head"><span className="dat-section-ico"><Icon name="history" size={15} /></span>
            <div className="dat-section-title">ประวัติการแก้ไขวงเงิน</div></div>
          <div style={{ padding: 14 }}>
            {(cur.history || []).length === 0
              ? <div className="empty-state">— ยังไม่มีประวัติ —</div>
              : <div className="ivl-history">
                  {(cur.history || []).map((h, i) => (
                    <div key={i} className="ivl-hist-item">
                      <div className="ivl-hist-dot" />
                      <div className="ivl-hist-body">
                        <div className="ivl-hist-top">
                          <span className={"chip " + (h.action === 'ตั้งวงเงิน' ? 'primary' : h.action === 'ปิดปี' ? 'neutral' : 'info')}><span className="dot-c" />{h.action}</span>
                          <span className="mono muted" style={{ fontSize: 11 }}>{h.ts}</span>
                        </div>
                        <div style={{ fontSize: 12.5, marginTop: 3 }}>{h.detail}</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>
        </div>
      </div>

      {/* มติคณะกรรมการดำเนินการ (มติ คสอ.) */}
      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <div className="dat-section-head">
          <span className="dat-section-ico"><Icon name="receipt" size={15} /></span>
          <div>
            <div className="dat-section-title">มติคณะกรรมการดำเนินการ (มติ คสอ.)</div>
            <div className="muted" style={{ fontSize: 11.5 }}>รายละเอียดมติที่อนุมัติวงเงินลงทุนประจำปี</div>
          </div>
        </div>
        <div className="dat-grid">
          <div className="dat-field"><label className="dat-label">ครั้งที่ประชุม</label>
            {editing ? <input className="cfg-input" value={(cur.resolution || {}).meetingNo || ''} placeholder="เช่น ครั้งที่ 9/2568" onChange={(e) => setReso('meetingNo', e.target.value)} />
                     : <div className="dat-read">{(cur.resolution || {}).meetingNo || '—'}</div>}</div>
          <div className="dat-field"><label className="dat-label">วันที่มีมติ</label>
            {editing ? <ErpDate value={(cur.resolution || {}).meetingDate || ''} onChange={(v) => ((e) => setReso('meetingDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
                     : <div className="dat-read">{(cur.resolution || {}).meetingDate ? fmt.date((cur.resolution || {}).meetingDate) : '—'}</div>}</div>
          <div className="dat-field"><label className="dat-label">วาระที่</label>
            {editing ? <input className="cfg-input" value={(cur.resolution || {}).agenda || ''} placeholder="เช่น วาระที่ 4.2" onChange={(e) => setReso('agenda', e.target.value)} />
                     : <div className="dat-read">{(cur.resolution || {}).agenda || '—'}</div>}</div>
          <div className="dat-field" style={{ gridColumn: 'span 2' }}><label className="dat-label">รายละเอียดมติ</label>
            {editing ? <textarea className="cfg-input" rows={2} style={{ resize: 'vertical', minHeight: 60 }} value={(cur.resolution || {}).detail || ''} placeholder="สรุปสาระสำคัญของมติ เช่น อนุมัติแผนและวงเงินลงทุนประจำปี ..." onChange={(e) => setReso('detail', e.target.value)} />
                     : <div className="dat-read" style={{ whiteSpace: 'pre-wrap' }}>{(cur.resolution || {}).detail || '—'}</div>}</div>
        </div>
      </div>

      {checking && <IvlCheckModal record={record} onClose={() => setChecking(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — รายการปีงบประมาณ
// ════════════════════════════════════════════════════════════════════
function InvestLimitConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ivlLoad);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const persist = (next) => { setList(next); ivlSaveLS(next); };
  const openRec = list.find(r => r.id === openId);

  const handleSave = (draft) => {
    persist(list.map(r => r.id === draft.id ? draft : r));
    audit.log({ action: 'update', module: 'การเงินการลงทุน — ค่าคงที่วงเงินลงทุนประจำปี',
      target: `ปีงบประมาณ ${draft.year}`, summary: `แก้ไขวงเงินลงทุนประจำปี ${draft.year} (รวม ${fmt.money(draft.totalLimit, 0)} บาท)`,
      changes: [{ field: 'วงเงินลงทุนรวม', before: '—', after: fmt.money(draft.totalLimit, 0) }] });
    onToast && onToast(`บันทึกวงเงินลงทุนประจำปี ${draft.year} เรียบร้อยแล้ว`);
  };
  const handleCreate = (rec) => {
    persist([rec, ...list].sort((a, b) => b.year - a.year));
    audit.log({ action: 'create', module: 'การเงินการลงทุน — ค่าคงที่วงเงินลงทุนประจำปี',
      target: `ปีงบประมาณ ${rec.year}`, summary: `สร้างร่างวงเงินลงทุนประจำปี ${rec.year}`,
      changes: [{ field: 'วงเงินลงทุนรวม', before: '—', after: fmt.money(rec.totalLimit, 0) }] });
    setAdding(false); onToast && onToast(`สร้างร่างวงเงินลงทุนประจำปี ${rec.year} เรียบร้อยแล้ว`);
    setOpenId(rec.id);
  };

  if (openRec) return <IvlDetail record={openRec} onBack={() => setOpenId(null)} onSave={handleSave} onToast={onToast} />;

  const curYear = Math.max(...list.map(r => r.year));

  return (
    <div data-screen-label="หน้าค่าคงที่วงเงินลงทุนประจำปี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่วงเงินลงทุนประจำปี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดวงเงินการลงทุนประจำปีตามประกาศ — แยกตามประเภทสินทรัพย์ พร้อมตรวจสอบวงเงินใช้ไป/คงเหลือแบบ Real-time
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มวงเงินประจำปี</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="money" /></div>
        <div>
          <div className="lt-ab-label">วงเงินลงทุนประจำปีปัจจุบัน · {curYear}</div>
          <div className="lt-ab-name">฿ {fmt.money(list.find(r => r.year === curYear)?.totalLimit || 0, 0)}
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · ทั้งหมด {list.length} ปีงบประมาณ</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 90 }}>ปีงบประมาณ</th>
                <th className="right" style={{ width: 160 }}>วงเงินลงทุนรวม</th>
                <th className="right" style={{ width: 150 }}>ใช้ไป</th>
                <th className="right" style={{ width: 150 }}>คงเหลือ</th>
                <th style={{ minWidth: 180 }}>การใช้วงเงิน</th>
                <th className="center" style={{ width: 100 }}>สถานะ</th>
                <th style={{ minWidth: 180 }}>เอกสารอ้างอิง</th>
                <th className="center" style={{ width: 64 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => {
                const used = ivlSum(r.breakdown, 'used');
                const remain = r.totalLimit - used;
                const pct = r.totalLimit > 0 ? (used / r.totalLimit) * 100 : 0;
                return (
                  <tr key={r.id} className={"clickable" + (r.year === curYear ? ' selected' : '')} onClick={() => setOpenId(r.id)}>
                    <td className="center mono"><b>{r.year}</b></td>
                    <td className="right mono"><b>{fmt.money(r.totalLimit, 0)}</b></td>
                    <td className="right mono">{fmt.money(used, 0)}</td>
                    <td className="right mono">{fmt.money(remain, 0)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}><IvlBar pct={pct} /></div>
                        <span className="mono" style={{ fontSize: 11, minWidth: 42, textAlign: 'right', color: ivlUtilColor(pct) }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="center">{ivlStatusPill(r.status)}</td>
                    <td><span className="muted" style={{ fontSize: 12 }}>{r.docRef || '—'}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn ghost sm" onClick={() => setOpenId(r.id)}>เปิด <Icon name="chevRight" size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ระบบจะตรวจสอบวงเงินคงเหลือก่อนบันทึกการลงทุนทุกครั้ง และแจ้งเตือนอัตโนมัติเมื่อยอดลงทุนจะเกินเพดานที่ประกาศไว้
      </div>

      {adding && <IvlAddYearModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { InvestLimitConfigPage });
