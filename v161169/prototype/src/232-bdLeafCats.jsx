// ════════════════════════════════════════════════════════════════════
//  รายการเบิกจ่ายและตัดงบประมาณ — BudgetDisburseSection (ใช้ร่วมกัน)
//  คอมโพเนนต์ตารางลงรายการเบิกจ่ายตัดงบหมวดย่อย + ตรวจยอดบาลานซ์
//  รูปแบบเดียวกับใบสำคัญจ่าย (components-voucher-form.jsx) — นำไปใช้ในเมนู
//  คำขอทุนการศึกษา · งานอบรม/สัมมนา · เงินสงเคราะห์สมาชิก
// ════════════════════════════════════════════════════════════════════

// leaves (หมวดย่อยล่างสุดที่เปิดใช้งาน) + หมวดหลักสำหรับจัดกลุ่ม
function bdLeafCats(structure) {
  const out = [];
  const walk = (ns, top) => (ns || []).forEach(n => {
    const t = top || n.name;
    if (n.children && n.children.length) walk(n.children, t);
    else if (n.enabled) out.push({ id: n.id, code: n.code, name: n.name, gl: n.gl, top: t });
  });
  walk(structure, '');
  return out;
}
function bdLeafGroups(leaves) {
  const order = []; const by = {};
  leaves.forEach(l => { if (!by[l.top]) { by[l.top] = []; order.push(l.top); } by[l.top].push(l); });
  return order.map(t => ({ top: t, items: by[t] }));
}
// แถวเปล่าตั้งต้น
window.bdBlankLine = () => ({ cat: '', desc: '', amount: '', vat: 0, wht: '0' });

// ────────────────────────────────────────────────────────────────────
//  Section
//  props:
//   structure   — โครงสร้างงบประมาณ (window.budLoadStructure())
//   lines       — array ของ {cat, desc, amount, vat, wht}
//   onChange    — (nextLines) => void
//   target      — (option) ยอดเงินอ้างอิงเพื่อตรวจบาลานซ์
//   targetLabel — (option) ป้ายของ target ในแถบตรวจยอด
//   title / sub — (option) override หัวข้อ/คำอธิบาย
// ────────────────────────────────────────────────────────────────────
function BudgetDisburseSection({ structure, lines, onChange, target, targetLabel, title, sub }) {
  const leaves = React.useMemo(() => bdLeafCats(structure || []), [structure]);
  const leafGroups = React.useMemo(() => bdLeafGroups(leaves), [leaves]);
  const leafById = (id) => leaves.find(l => l.id === id);
  const rows = lines || [];

  const setLine = (i, k, v) => onChange(rows.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine = () => onChange([...rows, window.bdBlankLine()]);
  const removeLine = (i) => onChange(rows.filter((_, idx) => idx !== i));

  const totals = window.vchTotals(rows);
  const WHT = window.VCH_WHT || [{ v: '0', rate: 0 }];

  const hasTarget = target != null && targetLabel != null;
  const diff = hasTarget ? (Number(target) || 0) - totals.base : 0;
  const balanced = Math.abs(diff) < 0.005;

  return (
    <div className="search-card vch-card">
      <div className="vch-sec-head">
        <span className="head-bar" />
        <div style={{ minWidth: 0 }}>
          <h3>{title || 'รายการเบิกจ่ายและตัดงบประมาณ'}</h3>
          <div className="vch-sec-sub muted">
            {sub || 'เลือกหมวดงบประมาณระดับหมวดย่อย (อ้างอิงค่าคงที่โครงสร้างงบประมาณ) — ระบบดึงรหัสผังบัญชี (GL) ให้อัตโนมัติ'}
          </div>
        </div>
        <div className="vch-sec-right">
          <button className="btn primary sm" type="button" onClick={addLine}><Icon name="plus" /> เพิ่มรายการ</button>
        </div>
      </div>

      <div className="table-wrap" style={{ border: 0 }}>
        <table className="tbl vch-grid-tbl" style={{ minWidth: 940 }}>
          <thead>
            <tr>
              <th className="center" style={{ width: 36 }}>#</th>
              <th style={{ minWidth: 240 }}>หมวดงบประมาณ (หมวดย่อย)</th>
              <th style={{ width: 92 }}>GL</th>
              <th style={{ minWidth: 150 }}>คำอธิบายรายการ</th>
              <th className="right" style={{ width: 110 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 70 }}>VAT</th>
              <th style={{ width: 120 }}>หัก ณ ที่จ่าย</th>
              <th className="right" style={{ width: 110 }}>สุทธิ</th>
              <th style={{ width: 36 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan="9" className="center muted" style={{ padding: '22px 12px' }}>ยังไม่มีรายการ — กด “เพิ่มรายการ”</td></tr>
            )}
            {rows.map((l, i) => {
              const leaf = leafById(l.cat);
              const calc = window.vchLineCalc(l);
              return (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="vch-cell-input" value={l.cat} onChange={(e) => setLine(i, 'cat', e.target.value)}>
                      <option value="">— เลือกหมวดย่อย —</option>
                      {leafGroups.map(g => (
                        <optgroup key={g.top} label={g.top}>
                          {g.items.map(c => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{leaf && leaf.gl ? leaf.gl : <span className="muted">—</span>}</td>
                  <td><input className="vch-cell-input" value={l.desc} placeholder="รายละเอียด" onChange={(e) => setLine(i, 'desc', e.target.value)} /></td>
                  <td><input className="vch-cell-input num" type="number" inputMode="decimal" value={l.amount} placeholder="0.00" onChange={(e) => setLine(i, 'amount', e.target.value)} /></td>
                  <td className="center">
                    <select className="vch-cell-input center" value={l.vat} onChange={(e) => setLine(i, 'vat', Number(e.target.value))}>
                      <option value={0}>—</option><option value={7}>7%</option>
                    </select>
                  </td>
                  <td>
                    <select className="vch-cell-input" value={l.wht} onChange={(e) => setLine(i, 'wht', e.target.value)}>
                      {WHT.map(w => <option key={w.v} value={w.v}>{w.v === '0' ? 'ไม่หัก' : w.v + '%'}</option>)}
                    </select>
                  </td>
                  <td className="right mono vch-net">{fmt.money(calc.net, 2)}</td>
                  <td className="center"><button className="bud-act danger" type="button" title="ลบรายการ" onClick={() => removeLine(i)}><Icon name="close" size={13} /></button></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="vch-foot">
              <td colSpan="4" className="right">รวม</td>
              <td className="right mono">{fmt.money(totals.base, 2)}</td>
              <td className="center mono">{fmt.money(totals.vat, 0)}</td>
              <td className="right mono">−{fmt.money(totals.wht, 0)}</td>
              <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(totals.net, 2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {hasTarget && (
        <div className={"vch-balance " + (balanced ? 'ok' : 'warn')}>
          <Icon name={balanced ? 'check' : 'info'} size={14} />
          <span>{targetLabel} <b className="mono">{fmt.money(Number(target) || 0, 2)}</b></span>
          <span className="vch-bal-sep">เทียบกับ</span>
          <span>ยอดเบิกจ่าย (ก่อนภาษี) <b className="mono">{fmt.money(totals.base, 2)}</b></span>
          <span className="spacer" />
          {balanced
            ? <span className="vch-bal-tag ok">ยอดบาลานซ์</span>
            : <span className="vch-bal-tag warn">ผลต่าง {fmt.money(Math.abs(diff), 2)} — โปรดตรวจสอบ</span>}
        </div>
      )}
      <div className="vch-tax-note muted">
        <Icon name="info" size={12} /> ยอดสุทธิ = จำนวนเงิน + VAT − ภาษีหัก ณ ที่จ่าย · ตัดงบประมาณจากยอดก่อนภาษีของแต่ละหมวด
      </div>
    </div>
  );
}

// อ่าน "ป้ายหมวด" สำหรับมุมมองอ่านอย่างเดียว (รายละเอียด)
window.bdLineLabel = (structure, catId) => {
  const leaf = bdLeafCats(structure || []).find(l => l.id === catId);
  return leaf ? `${leaf.code} · ${leaf.name}` : (catId || '—');
};
window.bdLineGL = (structure, catId) => {
  const leaf = bdLeafCats(structure || []).find(l => l.id === catId);
  return leaf && leaf.gl ? leaf.gl : '';
};

// ────────────────────────────────────────────────────────────────────
//  มุมมองอ่านอย่างเดียว (หน้ารายละเอียด)
// ────────────────────────────────────────────────────────────────────
function BudgetDisburseDetail({ structure, lines, title }) {
  const rows = (lines || []).filter(l => l.cat || Number(l.amount));
  if (!rows.length) return null;
  const leaves = bdLeafCats(structure || []);
  const leafById = (id) => leaves.find(l => l.id === id);
  const totals = window.vchTotals(rows);
  return (
    <div className="search-card" style={{ marginBottom: 12 }}>
      <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>{title || 'รายการเบิกจ่ายและตัดงบประมาณ'}</h3></div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th className="center" style={{ width: 36 }}>#</th>
              <th>หมวดงบประมาณ (หมวดย่อย)</th>
              <th style={{ width: 92 }}>GL</th>
              <th>คำอธิบายรายการ</th>
              <th className="num">จำนวนเงิน</th>
              <th className="center">VAT</th>
              <th className="center">หัก ณ ที่จ่าย</th>
              <th className="num">สุทธิ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l, i) => {
              const leaf = leafById(l.cat);
              const calc = window.vchLineCalc(l);
              return (
                <tr key={i}>
                  <td className="center mono muted">{i + 1}</td>
                  <td>{leaf ? <><span className="mono" style={{ fontSize: 11 }}>{leaf.code}</span> · {leaf.name}</> : (l.cat || '—')}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{leaf && leaf.gl ? leaf.gl : <span className="muted">—</span>}</td>
                  <td>{l.desc || <span className="muted">—</span>}</td>
                  <td className="num mono">{fmt.money(Number(l.amount || 0), 2)}</td>
                  <td className="center mono">{Number(l.vat) ? l.vat + '%' : '—'}</td>
                  <td className="center mono">{window.vchWhtRate(l.wht) > 0 ? window.vchWhtRate(l.wht) + '%' : '—'}</td>
                  <td className="num mono">{fmt.money(calc.net, 2)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="num" style={{ fontWeight: 600 }}>รวม</td>
              <td className="num mono">{fmt.money(totals.base, 2)}</td>
              <td className="center mono">{fmt.money(totals.vat, 0)}</td>
              <td className="center mono">−{fmt.money(totals.wht, 0)}</td>
              <td className="num mono" style={{ fontWeight: 700 }}>{fmt.money(totals.net, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </div></div>
    </div>
  );
}

Object.assign(window, { BudgetDisburseSection, BudgetDisburseDetail, bdLeafCats, bdLeafGroups });
