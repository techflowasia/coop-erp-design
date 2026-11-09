// ════════════════════════════════════════════════════════════════════
//  ย้าย "อัตราดอกเบี้ยเงินกู้" มากำหนดในเมนู ประเภทเงินกู้
//   • ตารางอัตราเป็นของผลิตภัณฑ์นั้นโดยตรง (1 ประเภท = 1 ตาราง)
//   • กำหนดผ่าน Modal จากแท็บ "ดอกเบี้ย" ในหน้ารายละเอียดผลิตภัณฑ์
//   • ไม่มีประวัติการเปลี่ยนอัตรา — เก็บเฉพาะตารางอัตราปัจจุบัน
//   • เมนู "อัตราดอกเบี้ยเงินกู้" เดิมยังคงอยู่ตามเดิม
//  ตารางของผลิตภัณฑ์ถูกผูกเข้ากับ window.irList() เป็นรหัส LT<code>
//  จึงทำงานร่วมกับการคำนวณคำขอกู้ (lrRateFor / irLatestRate) ได้ทันที
// ════════════════════════════════════════════════════════════════════

// ── เมนู “อัตราดอกเบี้ยเงินกู้” อยู่ในไซด์บาร์ ต่อจากโครงการเงินกู้ ──

window.lpRateCode = (rec) => 'LT' + (rec && rec.code ? rec.code : '');
window.lpIsOwnRateCode = (code) => typeof code === 'string' && code.slice(0, 2) === 'LT';

function lpAllProducts() {
  try {
    const s = localStorage.getItem('loan_types');
    if (s) return JSON.parse(s);
  } catch (e) {}
  return window.LP_SEED ? JSON.parse(JSON.stringify(window.LP_SEED)) : [];
}

// ตารางอัตราของผลิตภัณฑ์ → รูปแบบเดียวกับค่าคงที่ดอกเบี้ย (IR)
window.lpRateTables = function () {
  return lpAllProducts()
    .filter(p => (p.rateTiers || []).length)
    .map(p => ({
      id: 'LT-' + p.id, code: window.lpRateCode(p),
      name: window.lpRateCode(p) + '-' + p.name, enabled: !!p.enabled,
      ownedBy: p.code, rates: p.rateTiers.map(r => ({ ...r })),
    }));
};

// ── ผูกตารางของผลิตภัณฑ์เข้ากับรายการอัตราดอกเบี้ยของระบบ ──────────
(function () {
  const baseIrList = window.irList;
  window.irList = function () {
    const base = baseIrList ? baseIrList() : (window.IR_SEED || []);
    const own = window.lpRateTables();
    const codes = new Set(own.map(t => t.code));
    return own.concat(base.filter(t => !codes.has(t.code)));
  };
  const baseLabel = window.irTableLabel;
  window.irTableLabel = function (code) {
    const t = window.irList().find(r => r.code === code);
    if (t && t.ownedBy) {
      const p = lpAllProducts().find(x => x.code === t.ownedBy);
      return 'ตารางของ ' + t.ownedBy + (p ? ' · ' + p.name : '') + ' (' + t.code + ')';
    }
    return baseLabel ? baseLabel(code) : (code || '—');
  };
  // ให้การคำนวณคำขอกู้อ่านจาก irList (รวมตารางของผลิตภัณฑ์) แทน IR_SEED
  window.lrRateFor = function (rateTable, amount, asOf) {
    const ir = window.irList().find(r => r.code === rateTable);
    if (!ir || !ir.rates || !ir.rates.length) return null;
    const amt = Number(amount) || 0;
    const day = asOf || new Date().toISOString().slice(0, 10);
    const rows = ir.rates.filter(r =>
      (!r.effectiveDate || r.effectiveDate <= day) &&
      amt >= Number(r.loanFrom || 0) &&
      (!Number(r.loanTo) || amt <= Number(r.loanTo)));
    const pick = (rows.length ? rows : ir.rates)
      .reduce((mx, r) => (!mx || (r.effectiveDate || '') > (mx.effectiveDate || '')) ? r : mx, null);
    if (!pick) return null;
    return {
      rate: Number(pick.rate) || 0, code: ir.code, name: ir.name,
      effectiveDate: pick.effectiveDate, useAdjust: !!pick.useAdjust,
    };
  };
})();

const lpRateToday = () => new Date().toISOString().slice(0, 10);

// ตัวเลือกตารางอัตราในตารางดอกเบี้ยตามช่วงเวลา — ตารางของผลิตภัณฑ์นี้ + ตารางกลาง
//  (ไม่แสดงตารางของผลิตภัณฑ์อื่น กันเลือกข้ามผลิตภัณฑ์)
function LpRateSelCell({ used, label }) {
  // ตามฟิลด์ “ตารางอัตราที่ใช้” ของผลิตภัณฑ์ — อ่านอย่างเดียวทุกแถว
  return (
    <span style={{ color: 'rgba(0,0,0,.45)' }}>
      {used ? (label || used) : '—'}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — กำหนดตารางอัตราดอกเบี้ยของผลิตภัณฑ์
// ════════════════════════════════════════════════════════════════════
function LpRateTableModal({ record, editing, onClose, onSave }) {
  const seed = () => {
    if ((record.rateTiers || []).length) return record.rateTiers.map(r => ({ ...r }));
    // ยังไม่เคยกำหนด — คัดลอกจากตารางกลางที่ผลิตภัณฑ์อ้างอิงอยู่เดิม
    const src = (window.irList() || []).find(t => t.code === record.settings.rateTable);
    if (src && src.rates && src.rates.length) return src.rates.map(r => ({ ...r }));
    return [{ effectiveDate: lpRateToday(), loanFrom: 0, loanTo: 1000000, rate: 6, useAdjust: false }];
  };
  const [rows, setRows] = React.useState(seed);
  const [err, setErr] = React.useState('');

  const set = (i, k, v) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const add = () => setRows(rs => {
    const last = rs[rs.length - 1];
    return [...rs, {
      effectiveDate: lpRateToday(),
      loanFrom: last ? Number(last.loanTo || 0) + 1 : 0,
      loanTo: last ? Number(last.loanTo || 0) * 2 : 1000000,
      rate: last ? last.rate : 6, useAdjust: false,
    }];
  });
  const del = (i) => setRows(rs => rs.filter((_, idx) => idx !== i));

  const save = () => {
    if (!rows.length) { setErr('ต้องมีอัตราอย่างน้อย 1 ช่วง'); return; }
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.effectiveDate) { setErr(`แถวที่ ${i + 1} — ต้องระบุวันที่มีผล`); return; }
      if (Number(r.loanTo) <= Number(r.loanFrom)) { setErr(`แถวที่ ${i + 1} — วงเงิน "ถึง" ต้องมากกว่า "ตั้งแต่"`); return; }
      if (!(Number(r.rate) > 0)) { setErr(`แถวที่ ${i + 1} — อัตราดอกเบี้ยต้องมากกว่า 0`); return; }
    }
    const sorted = rows.slice().sort((a, b) => Number(a.loanFrom) - Number(b.loanFrom));
    for (let i = 1; i < sorted.length; i++) {
      if (Number(sorted[i].loanFrom) <= Number(sorted[i - 1].loanTo) &&
          sorted[i].effectiveDate === sorted[i - 1].effectiveDate) {
        setErr('ช่วงวงเงินซ้อนทับกันในวันที่มีผลเดียวกัน — กรุณาตรวจสอบ'); return;
      }
    }
    onSave(sorted.map(r => ({
      effectiveDate: r.effectiveDate,
      loanFrom: Number(r.loanFrom) || 0, loanTo: Number(r.loanTo) || 0,
      rate: Number(r.rate) || 0, useAdjust: !!r.useAdjust,
    })));
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 780, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>กำหนดอัตราดอกเบี้ยของผลิตภัณฑ์</h2>
            <div className="muted" style={{ fontSize: 11 }}>{record.code} · {record.name} — รหัสตาราง {window.lpRateCode(record)}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
            อัตราที่กำหนดที่นี่ใช้กับผลิตภัณฑ์นี้เท่านั้น — ระบบจะเลือกอัตราตามช่วงวงเงินขอกู้และวันที่มีผลล่าสุด
          </div>
          <div className="table-wrap">
            <table className="sh-grid" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>วันที่มีผล</th>
                  <th className="center">วงเงินตั้งแต่</th>
                  <th className="center">ถึง</th>
                  <th className="center" style={{ width: 110 }}>อัตรา (%)</th>
                  <th className="center" style={{ width: 120 }}>ใช้อัตราเพิ่ม/ลด</th>
                  {editing && <th className="center" style={{ width: 46 }} />}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {editing
                        ? <ErpDate value={r.effectiveDate || ''} onChange={(v) => ((e) => set(i, 'effectiveDate', e.target.value))({ target: { value: v } })} className="sh-grid-input" />
                        : <span>{fmt.date(r.effectiveDate)}</span>}
                    </td>
                    <td className="num-cell"><LpNumCell editing={editing} v={r.loanFrom} decimals={2} onChange={(v) => set(i, 'loanFrom', v)} /></td>
                    <td className="num-cell"><LpNumCell editing={editing} v={r.loanTo} decimals={2} onChange={(v) => set(i, 'loanTo', v)} /></td>
                    <td className="num-cell"><LpNumCell editing={editing} v={r.rate} decimals={2} onChange={(v) => set(i, 'rate', v)} /></td>
                    <td className="center">
                      <input type="checkbox" className="ct-check" checked={!!r.useAdjust} disabled={!editing}
                             onChange={(e) => set(i, 'useAdjust', e.target.checked)} />
                    </td>
                    {editing && (
                      <td className="center">
                        <button className="btn danger sm" onClick={() => del(i)} title="ลบแถว"><Icon name="close" size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {err && <div className="chip danger" style={{ marginTop: 10 }}><Icon name="info" size={11} /> {err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
            {editing && <button className="btn sm" onClick={add}><Icon name="plus" /> เพิ่มช่วงอัตรา</button>}
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn" onClick={onClose}>{editing ? 'ยกเลิก' : 'ปิด'}</button>
            {editing && <button className="btn primary" onClick={save}><Icon name="check" /> ใช้อัตรานี้</button>}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 3 — ดอกเบี้ย (แทนที่ของเดิม: เพิ่มการกำหนดอัตราในหน้านี้)
// ════════════════════════════════════════════════════════════════════
function LpTabInterest({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const rows = record.interestTiers;
  const ownCode = window.lpRateCode(record);
  const ownRates = record.rateTiers || [];
  const [rateModal, setRateModal] = React.useState(false);

  const setRow = (i, k, v) => onTable('interestTiers', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('interestTiers', [...rows, { dueType: 'day', monthFrom: 0, monthTo: 0, form: 'fixed', rateTable: ownRates.length ? ownCode : 'INT20', adjust: 0 }]);
  const delRow = (i) => onTable('interestTiers', rows.filter((_, idx) => idx !== i));
  // ── กำหนดการคิดดอกเบี้ยตามเงินกู้ (ช่วงมูลค่าเงินกู้) ──
  const aRows = record.amountInterestTiers || [];
  const setARow = (i, k, v) => onTable('amountInterestTiers', aRows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addARow = () => onTable('amountInterestTiers', [...aRows, { memberType: 'none', dueType: 'day', amountFrom: 0, amountTo: 0, form: 'fixed', rate: '', adjust: 0 }]);
  const delARow = (i) => onTable('amountInterestTiers', aRows.filter((_, idx) => idx !== i));

  const saveRates = (list) => {
    onTable('rateTiers', list);
    onSettings({ ...s, rateTable: ownCode });
    setRateModal(false);
  };

  const usingOwn = ownRates.length > 0 && s.rateTable === ownCode;
  const sysRate = usingOwn
    ? ownRates.reduce((mx, r) => (!mx || (r.effectiveDate || '') > (mx.effectiveDate || '')) ? r : mx, null)
    : window.irLatestRate(s.rateTable, s.maxLoanAmount);
  // อัตราล่าสุด — ทุกช่วงวงเงินของวันที่มีผลล่าสุด ตามตารางอัตราที่ใช้ (เมนูอัตราดอกเบี้ยเงินกู้)
  const latestRates = (() => {
    const src = usingOwn ? ownRates : (((window.irList ? window.irList() : []).find(t => t.code === s.rateTable) || {}).rates || []);
    if (!src.length) return [];
    const last = src.reduce((mx, r) => ((r.effectiveDate || '') > mx ? (r.effectiveDate || '') : mx), '');
    const vals = src.filter(r => (r.effectiveDate || '') === last).map(r => Number(r.rate) || 0);
    return [...new Set(vals)].sort((a, b) => a - b);
  })();
  const latestRateText = latestRates.length ? latestRates.map(v => fmt.money(v, 2) + '%').join(', ') : '— %';
  const span = usingOwn
    ? `${ownRates.length} ช่วงวงเงิน · ${fmt.money(Math.min(...ownRates.map(r => Number(r.rate) || 0)), 2)}–${fmt.money(Math.max(...ownRates.map(r => Number(r.rate) || 0)), 2)} %`
    : window.irTableLabel(s.rateTable);

  // ตัวเลือกตารางอัตรา — จากเมนูอัตราดอกเบี้ย (ที่ผูกกับประเภทนี้ + ตารางกลาง)
  // ตัวเลือก — ตารางอัตราดอกเบี้ยทั้งหมดที่สร้างไว้ (ตารางที่ผูกกับประเภทนี้มาก่อน)
  const allTables = React.useMemo(
    () => (window.irList ? window.irList() : []).filter(x => !x.ownedBy), [record.id]);
  const boundTable = allTables.find(x => ((x.loanTypeIds || []).indexOf(record.id) >= 0)) || null;
  const rateOpts = React.useMemo(() => {
    const bound = allTables.filter(x => ((x.loanTypeIds || []).indexOf(record.id) >= 0));
    const rest = allTables.filter(x => bound.indexOf(x) < 0);
    return bound.concat(rest).map(x => ({ v: x.code, l: window.irTableLabel(x.code) }));
  }, [allTables, record.id]);
  // ค่าตั้งต้น — ตารางที่ผูกกับประเภทนี้ (ถ้าค่าเดิมชี้ไปที่ตารางเก่าของผลิตภัณฑ์)
  const rateValue = rateOpts.some(o => o.v === s.rateTable)
    ? s.rateTable
    : (boundTable ? boundTable.code : (rateOpts[0] ? rateOpts[0].v : ''));

  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <LpGroup title="ข้อกำหนดอัตราดอกเบี้ย"
              action={
                editing ? null : (
                  <button className="btn primary sm" onClick={() => setRateModal(true)}>
                    <Icon name="search" /> ดูตารางอัตรา
                  </button>
                )
              }>
              <LpRow label="คิดดอกเบี้ยเป็นชั้น ให้ดูชั้นจาก"><LpSel group="interestTierBasis" v={s.interestTierBasis} editing={editing} onChange={(v) => set('interestTierBasis', v)} /></LpRow>
              <LpRow label="รูปแบบการคำนวณดอกเบี้ย"><LpSel group="interestCalcMode" v={s.interestCalcMode} editing={editing} onChange={(v) => set('interestCalcMode', v)} /></LpRow>
              <LpRow label="รูปแบบอัตราที่เรียกเก็บ"><LpSel group="interestRateForm" v={s.interestRateForm} editing={editing} onChange={(v) => set('interestRateForm', v)} /></LpRow>
              <LpRow label="ตารางอัตราที่ใช้">
                {editing ? (
                  <select className="l2-select" value={rateValue}
                          onChange={(e) => onSettings({ ...s, rateTable: e.target.value })}>
                    {rateOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : <LpDis v={window.irTableLabel(rateValue)} />}
              </LpRow>
              <LpRow label="อัตราที่กำหนดล่าสุด (ระบบกำหนด)"><LpDis v={latestRateText} /></LpRow>
              <LpRow label="อัตราดอกเบี้ยเพิ่ม/ลด ต่างหาก"><LpDis v={sysRate && sysRate.useAdjust ? 'ใช้อัตราเพิ่ม/ลด' : '0.00 %'} /></LpRow>
              {!usingOwn && !editing && (
                <div className="muted" style={{ fontSize: 11, padding: '2px 2px 6px' }}>
                  ยังใช้ตารางกลางอยู่ — อัตราเฉพาะของผลิตภัณฑ์นี้กำหนดจากหน้าตารางอัตราดอกเบี้ย
                </div>
              )}
            </LpGroup>

            <LpGroup title="ดอกเบี้ยผิดนัด / เกณฑ์พิจารณาเงินกู้">
              <LpCheckItem label="คิดดอกเบี้ยผิดนัดชำระ" checked={s.penaltyInterestOn} editing={editing} onChange={(v) => set('penaltyInterestOn', v)} />
              {s.penaltyInterestOn && (
                <LpRow label="อัตราดอกเบี้ยผิดนัด" indent><LpNum v={s.penaltyInterestRate} editing={editing} decimals={2} suffix="%" onChange={(v) => set('penaltyInterestRate', v)} /></LpRow>
              )}
              <LpRow label="เกณฑ์พิจารณาเงินกู้"><LpSel group="warnBasis" v={s.warnBasis} editing={editing} onChange={(v) => set('warnBasis', v)} /></LpRow>
              <LpRow label="ค่าเกณฑ์ที่ใช้เตือน"><LpNum v={s.warnThreshold} editing={editing} decimals={2} suffix={s.warnBasis === 'balance' ? 'บาท' : '%'} onChange={(v) => set('warnThreshold', v)} /></LpRow>
            </LpGroup>
          </div>
          <div className="l2-col">
            <LpGroup title="ข้อกำหนดดอกเบี้ยรายเดือน — การรับเงินกู้">
              <LpRow label="ช่วงเวลาไม่คิด ด/บ"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.recvCondition} editing={editing} onChange={(v) => set('recvCondition', v)} />
                <LpNum v={s.recvDays} editing={editing} suffix="วัน" onChange={(v) => set('recvDays', v)} /></div></LpRow>
              <LpRow label="ช่วงคิด ด/บ ครึ่งเดือน"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.recvHalfCondition} editing={editing} onChange={(v) => set('recvHalfCondition', v)} />
                <LpNum v={s.recvHalfDays} editing={editing} suffix="วัน" onChange={(v) => set('recvHalfDays', v)} /></div></LpRow>
            </LpGroup>
            <LpGroup title="ข้อกำหนดดอกเบี้ยรายเดือน — การชำระเงินกู้">
              <LpRow label="ช่วงเวลาไม่คิด ด/บ"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.payCondition} editing={editing} onChange={(v) => set('payCondition', v)} />
                <LpNum v={s.payDays} editing={editing} suffix="วัน" onChange={(v) => set('payDays', v)} /></div></LpRow>
              <LpRow label="ช่วงคิด ด/บ ครึ่งเดือน"><div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <LpSel group="monthlyInterestCond" v={s.payHalfCondition} editing={editing} onChange={(v) => set('payHalfCondition', v)} />
                <LpNum v={s.payHalfDays} editing={editing} suffix="วัน" onChange={(v) => set('payHalfDays', v)} /></div></LpRow>
            </LpGroup>
          </div>
        </div>
      </div>

      <LpTableShell title="กำหนดการคิดดอกเบี้ยตามช่วงเวลา" count={rows.length} editing={editing} onAdd={addRow} minWidth={1000}
        sub="คิดดอกเบี้ยแบบขั้นบันไดตามช่วงเวลา — แถวรูปแบบ “คงที่” กรอกอัตราดอกเบี้ย (%) ของแถวเอง · แถวลอยตัว/ขั้นบันไดใช้ “ตารางอัตราที่ใช้” · อัตราที่ใช้จริง = อัตราของแถว + เพิ่ม/ลด % (ไม่ต่ำกว่า 0)">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 190 }}>ประเภทสมาชิก</th>
            <th rowSpan={2} style={{ width: 120 }}>การครบกำหนด</th>
            <th colSpan={2} className="center group-col">ช่วงเวลา (เดือน)</th>
            <th colSpan={3} className="center group-col">การคิดดอกเบี้ย</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">ตั้งแต่</th><th className="center sub-col">ถึง</th>
            <th className="center sub-col">รูปแบบ</th><th className="center sub-col">อัตราดอกเบี้ย (%)</th><th className="center sub-col">เพิ่ม/ลด %</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 8 : 7} className="center muted" style={{ padding: '24px' }}>ยังไม่มีช่วงเวลา — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="memberTypeRight" v={(r.memberType && r.memberType !== 'regular' ? r.memberType : 'none')} onChange={(v) => setRow(i, 'memberType', v)} /></td>
              <td><LpSelCell editing={editing} group="dueType" v={(r.dueType === 'day' || r.dueType === 'month') ? r.dueType : 'day'} onChange={(v) => setRow(i, 'dueType', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.monthFrom} onChange={(v) => setRow(i, 'monthFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.monthTo} inf={999} onChange={(v) => setRow(i, 'monthTo', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="interestStepForm" v={r.form} onChange={(v) => setRow(i, 'form', v)} /></td>
              <td className="num-cell">{r.form === 'fixed'
                ? (editing
                    ? <input className="sh-grid-input" type="number" min="0" max="100" step="0.01" style={{ maxWidth: 'none', width: '100%' }}
                             value={r.rate ?? r.fixedRate ?? ''}
                             onChange={(e) => { let v = e.target.value; if (v !== '') { v = Math.min(100, Math.max(0, Number(v))); v = Math.round(v * 100) / 100; } setRow(i, 'rate', v); }} />
                    : <span className="sh-grid-num">{fmt.money(Number(r.rate ?? r.fixedRate ?? 0), 2)}</span>)
                : <span className="sh-grid-num muted" title="แถวลอยตัว/ขั้นบันได ใช้ “ตารางอัตราที่ใช้” ที่หัวแท็บ">–</span>}</td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.adjust} decimals={2} onChange={(v) => setRow(i, 'adjust', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>

      <LpTableShell title="กำหนดการคิดดอกเบี้ยตามเงินกู้" count={aRows.length} editing={editing} onAdd={addARow} minWidth={1000}
        sub="คิดดอกเบี้ยตามช่วงมูลค่าเงินกู้ — เทียบช่วงจาก “คิดดอกเบี้ยเป็นชั้น ให้ดูชั้นจาก” (ยอดอนุมัติ/ยอดคงเหลือ) · แถว “คงที่” ใช้อัตรา (%) ของแถว · แถวลอยตัว/ขั้นบันไดใช้ “ตารางอัตราที่ใช้” · อัตราที่ใช้จริง = อัตรา + เพิ่ม/ลด % ของตารางนี้ + เพิ่ม/ลด % ตามช่วงเวลา (ไม่ต่ำกว่า 0)">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 190 }}>ประเภทสมาชิก</th>
            <th rowSpan={2} style={{ width: 120 }}>การครบกำหนด</th>
            <th colSpan={2} className="center group-col">ช่วงมูลค่าเงินกู้ (บาท)</th>
            <th colSpan={3} className="center group-col">การคิดดอกเบี้ย</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="center sub-col">ตั้งแต่</th><th className="center sub-col">ถึง</th>
            <th className="center sub-col">รูปแบบ</th><th className="center sub-col">อัตราดอกเบี้ย (%)</th><th className="center sub-col">เพิ่ม/ลด %</th>
          </tr>
        </thead>
        <tbody>
          {aRows.length === 0 && <tr><td colSpan={editing ? 8 : 7} className="center muted" style={{ padding: '24px' }}>ยังไม่มีช่วงมูลค่าเงินกู้ — กด “เพิ่มแถว”</td></tr>}
          {aRows.map((r, i) => (
            <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="memberTypeRight" v={(r.memberType && r.memberType !== 'regular' ? r.memberType : 'none')} onChange={(v) => setARow(i, 'memberType', v)} /></td>
              <td><LpSelCell editing={editing} group="dueType" v={(r.dueType === 'day' || r.dueType === 'month') ? r.dueType : 'day'} onChange={(v) => setARow(i, 'dueType', v)} /></td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.amountFrom} decimals={2} onChange={(v) => setARow(i, 'amountFrom', v)} /></td>
              <td className="num-cell"><LpUnlCell editing={editing} v={r.amountTo} inf={999999999} decimals={2} onChange={(v) => setARow(i, 'amountTo', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><LpSelCell editing={editing} group="interestStepForm" v={r.form} onChange={(v) => setARow(i, 'form', v)} /></td>
              <td className="num-cell">{r.form === 'fixed'
                ? (editing
                    ? <input className="sh-grid-input" type="number" min="0" max="100" step="0.01" style={{ maxWidth: 'none', width: '100%' }}
                             value={r.rate ?? ''}
                             onChange={(e) => { let v = e.target.value; if (v !== '') { v = Math.min(100, Math.max(0, Number(v))); v = Math.round(v * 100) / 100; } setARow(i, 'rate', v); }} />
                    : <span className="sh-grid-num">{fmt.money(Number(r.rate ?? 0), 2)}</span>)
                : <span className="sh-grid-num muted" title="แถวลอยตัว/ขั้นบันได ใช้ “ตารางอัตราที่ใช้” ที่หัวแท็บ">–</span>}</td>
              <td className="num-cell"><LpNumCell editing={editing} v={r.adjust} decimals={2} onChange={(v) => setARow(i, 'adjust', v)} /></td>
              <LpDelCell editing={editing} onDel={() => delARow(i)} />
            </tr>
          ))}
        </tbody>
      </LpTableShell>

      {rateModal && (
        <LpRateTableModal record={record} editing={editing}
          onClose={() => setRateModal(false)} onSave={saveRates} />
      )}
    </>
  );
}

Object.assign(window, { LpTabInterest, LpRateTableModal, LpRateSelCell });

if (window.LP_OPTS && !window.LP_OPTS.dueType) {
  window.LP_OPTS.dueType = [
    { v: 'day',   l: 'ชนวัน' },
    { v: 'month', l: 'ชนเดือน' },
  ];
}
