// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ดอกเบี้ย — เปลี่ยนแปลงอัตราดอกเบี้ย
//  เลือกประเภทเงินฝาก + ประเภทการใช้ + ช่วงวันที่มีผล →
//  กำหนดอัตราตามช่วงยอดเงิน (ตั้งแต่ >=) → บันทึกการเปลี่ยนแปลง
//  รองรับดอกเบี้ยโปรโมชัน (มีวันหมดอายุ) + ประวัติการเปลี่ยนแปลง
// ════════════════════════════════════════════════════════════════════

const RC_USER = 'จันทร์เพ็ญ มาลี';
const RC_USAGE = ['ทุกประเภท', 'สมาชิก', 'บุคคลภายนอก', 'นิติบุคคล'];

function rcLoad() {
  try { const s = localStorage.getItem('dep_rate_changes'); if (s) return JSON.parse(s); } catch (e) {}
  return [];
}
function rcSave(list) { try { localStorage.setItem('dep_rate_changes', JSON.stringify(list)); } catch (e) {} }

function DepRateChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const accTypes = (window.DEP_ACCTYPE_SEED || []).filter(t => t.enabled);
  const today = new Date().toISOString().slice(0, 10);

  const [typeCode, setTypeCode] = useState(accTypes[0]?.code || '');
  const [promo, setPromo] = useState(false);
  const [usage, setUsage] = useState('ทุกประเภท');
  const [effDate, setEffDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [rows, setRows] = useState([{ from: '', rate: '' }, { from: '', rate: '' }]);
  const [history, setHistory] = useState(rcLoad);

  const accType = accTypes.find(t => t.code === typeCode);

  const setRow = (i, k, v) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows(rs => [...rs, { from: '', rate: '' }]);
  const delRow = (i) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs);

  // ตรวจช่วงยอด "ตั้งแต่" ซ้ำ
  const dupFrom = useMemo(() => {
    const seen = {}; const bad = new Set();
    rows.forEach((r, i) => { const v = String(Number(r.from) || 0); if (seen[v] != null) { bad.add(i); bad.add(seen[v]); } else seen[v] = i; });
    return bad;
  }, [rows]);

  const validRows = rows.filter(r => r.rate !== '' && !isNaN(Number(r.rate)));
  const canSubmit = typeCode && validRows.length > 0 && dupFrom.size === 0 && (!promo || (endDate && endDate >= effDate));

  const submit = () => {
    const rec = {
      id: 'RC-2569-' + String(history.length + 1).padStart(4, '0'),
      code: typeCode, name: accType?.name || typeCode,
      promo, usage, effDate, endDate: promo ? endDate : '',
      rows: validRows.map(r => ({ from: Number(r.from) || 0, rate: Number(r.rate) })).sort((a, b) => a.from - b.from),
      by: RC_USER, savedAt: new Date().toISOString(),
    };
    const next = [rec, ...history];
    setHistory(next); rcSave(next);
    audit.log({ action: 'update', module: 'เงินฝาก — เปลี่ยนแปลงอัตราดอกเบี้ย',
      target: `${rec.code} · ${rec.name}`,
      summary: `เปลี่ยนอัตราดอกเบี้ย “${rec.name}” (${rec.rows.length} ช่วง)${promo ? ' · โปรโมชัน' : ''} มีผล ${fmt.date(effDate)}`,
      changes: rec.rows.map(r => ({ field: `ตั้งแต่ ${fmt.money(r.from, 2)}`, before: '—', after: r.rate.toFixed(3) + '%' })) });
    onToast && onToast(`บันทึกการเปลี่ยนแปลงอัตราดอกเบี้ย “${rec.name}” เรียบร้อย (${rec.rows.length} ช่วง)`);
    setRows([{ from: '', rate: '' }, { from: '', rate: '' }]);
  };

  return (
    <div data-screen-label="หน้าเปลี่ยนแปลงอัตราดอกเบี้ยเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปลี่ยนแปลงอัตราดอกเบี้ย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ปรับอัตราดอกเบี้ยเงินฝากตามช่วงยอดเงินและวันที่มีผล — รองรับดอกเบี้ยโปรโมชันที่มีวันหมดอายุ</div>
        </div>
      </div>

      <div className="search-card dat-section">
        <DepSecHead icon="money" title="ขอบเขตการเปลี่ยนแปลง" />
        <div className="dat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <DatFieldLite label="ประเภทเงินฝาก" required>
            <select className="cfg-input" value={typeCode} onChange={(e) => setTypeCode(e.target.value)}>
              {accTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="ประเภทการใช้">
            <select className="cfg-input" value={usage} onChange={(e) => setUsage(e.target.value)}>
              {RC_USAGE.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="ดอกเบี้ยโปรโมชัน">
            <label className={"rc-promo" + (promo ? ' on' : '')}>
              <input type="checkbox" checked={promo} onChange={(e) => setPromo(e.target.checked)} />
              <Icon name={promo ? 'check' : 'calendar'} size={14} />
              <span>ดอกเบี้ยโปรโมชัน — มีวันหมดอายุ</span>
            </label>
          </DatFieldLite>
          <DatFieldLite label="วันที่มีผล" required>
            <window.ThaiDateField value={effDate} onChange={(v) => setEffDate(v)} />
          </DatFieldLite>
          <DatFieldLite label="วันที่สิ้นสุด">
            <div style={!promo ? undefined : { opacity: .55, pointerEvents: 'none' }}><window.ThaiDateField value={endDate} onChange={(v) => setEndDate(v)} /></div>
          </DatFieldLite>
        </div>
        {promo && endDate < effDate && (
          <div style={{ padding: '0 16px 14px', color: 'var(--danger)', fontSize: 12 }}><Icon name="info" size={12} /> วันที่สิ้นสุดต้องไม่ก่อนวันที่มีผล</div>
        )}
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="sh-grid-head">
          <div>
            <div className="sh-grid-title">อัตราดอกเบี้ยตามช่วงยอดเงิน <span className="muted" style={{ fontWeight: 400 }}>· {rows.length} ช่วง</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>กำหนดอัตราต่อปีสำหรับยอดเงินคงเหลือ “ตั้งแต่ ( ≥ )” ที่ระบุ — ระบบใช้ช่วงที่สูงสุดซึ่งไม่เกินยอดคงเหลือ</div>
          </div>
          <button className="btn primary sm" onClick={addRow}><Icon name="plus" /> เพิ่มรายการ</button>
        </div>
        <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>ตั้งแต่ ( ≥ ) บาท</th>
                <th className="right" style={{ width: 200 }}>อัตราดอกเบี้ย (% ต่อปี)</th>
                <th className="center" style={{ width: 64 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={dupFrom.has(i) ? { background: 'var(--danger-50)' } : null}>
                  <td className="num-cell"><input className="sh-grid-input" type="number" step="0.01" value={r.from} onChange={(e) => setRow(i, 'from', e.target.value)} placeholder="0.00" style={{ textAlign: 'right', maxWidth: 'none' }} /></td>
                  <td className="num-cell"><input className="sh-grid-input" type="number" step="0.001" value={r.rate} onChange={(e) => setRow(i, 'rate', e.target.value)} placeholder="0.000" style={{ textAlign: 'right', maxWidth: 'none' }} /></td>
                  <td className="center"><button className="btn sm tt-del-btn" onClick={() => delRow(i)} disabled={rows.length <= 1} title="ลบรายการ" aria-label="ลบรายการ"><Icon name="trash" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="sh-grid-foot muted" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span><Icon name="info" size={12} /> {dupFrom.size > 0 ? <span style={{ color: 'var(--danger)' }}>มีช่วง “ตั้งแต่” ซ้ำกัน (แถวสีแดง) — กรุณาแก้ไขก่อนบันทึก</span> : 'เพิ่มได้หลายช่วงเพื่อคิดดอกเบี้ยแบบขั้นบันได'}</span>
          <button className="btn primary" disabled={!canSubmit} onClick={submit}><Icon name="check" /> บันทึกการเปลี่ยนแปลง</button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
          <div className="sh-grid-head"><div className="sh-grid-title">ประวัติการเปลี่ยนแปลงล่าสุด <span className="muted" style={{ fontWeight: 400 }}>· {history.length} รายการ</span></div></div>
          <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>เลขที่</th>
                  <th style={{ minWidth: 180 }}>ประเภทเงินฝาก</th>
                  <th className="center" style={{ width: 110 }}>ประเภทการใช้</th>
                  <th className="center" style={{ width: 130 }}>มีผล</th>
                  <th className="center" style={{ width: 100 }}>โปรโมชัน</th>
                  <th className="center" style={{ width: 80 }}>ช่วงอัตรา</th>
                  <th style={{ minWidth: 140 }}>ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="mono">{h.id}</td>
                    <td>{h.name}</td>
                    <td className="center">{h.usage}</td>
                    <td className="center mono">{fmt.date(h.effDate)}{h.promo && h.endDate ? <span className="muted"> → {fmt.date(h.endDate)}</span> : ''}</td>
                    <td className="center">{h.promo ? <span className="chip success"><span className="dot-c" />โปรโมชัน</span> : <span className="muted">ปกติ</span>}</td>
                    <td className="center">{h.rows.length}</td>
                    <td>{h.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DepRateChangePage });
