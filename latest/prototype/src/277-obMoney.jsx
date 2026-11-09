// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ยอดยกมาต้นปี — บันทึกแก้ยอดยกมาต้นปี (Opening Balance)
//  หน้าจอ workspace หน้าเดียว:
//   ┌ ข้อมูลเอกสาร (หัวเอกสาร + ดึงยอดปีก่อน / สร้างรายการบัญชี) ──┐
//   ├ ค้นหา (กรองบัญชี) ─────────────────────────────────────────┤
//   ├ ตารางยอดยกมา (แก้ไขยอดยกมา ด้านลูกหนี้/เจ้าหนี้ รายบัญชี) ──┤
//   └ สรุปยอด (นับบัญชี + ยอดรวม DR/CR + สมดุล) ─────────────────┘
// ════════════════════════════════════════════════════════════════════
const obMoney = (n) => window.fmt.money(Number(n || 0), 2);
const obNum = (v) => Number(String(v).replace(/[^\d.-]/g, '')) || 0;

// ปีบัญชี / สาขา (ค่าคงที่ประกอบหัวเอกสาร)
const OB_YEARS = ['2569', '2568', '2567', '2566'];
const OB_BRANCHES = ['สำนักงานใหญ่', 'สาขาย่อยที่ 1', 'สาขาย่อยที่ 2', 'หน่วยบริการเคลื่อนที่'];
const OB_USER = 'น.ส.วราภรณ์ เอี่ยมสกุล';

// หมวดบัญชี (จากค่าคงที่) → ด้านปกติ (debit/credit)
const OB_DEBIT_SIDE = { asset: true, expense: true, liability: false, equity: false, revenue: false };

// hash เลขบัญชี → ยอดปิดปีก่อน (deterministic, ~40% เป็น 0)
function obSeedClosing(code) {
  let h = 0; const s = String(code);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  if (h % 5 < 2) return 0;
  return Math.round((((h % 9000000) / 100) + 500) * 100) / 100;
}

// สร้างชุดบัญชี + ยอดปิดปีก่อน (เดบิต/เครดิต) แบบสมดุล
function obBuildRows() {
  const flat = (window.coaFlatAccounts ? window.coaFlatAccounts() : [])
    .filter(a => a.enabled !== false);
  const rows = flat.map(a => {
    const amt = obSeedClosing(a.code);
    const debitSide = OB_DEBIT_SIDE[a.catType] !== false;
    return {
      code: a.code, name: a.name, catType: a.catType,
      kind: a.kind === 'control' ? 'control' : 'posting',
      closeDr: debitSide ? amt : 0,
      closeCr: debitSide ? 0 : amt,
    };
  });
  // บังคับให้สมดุล — ปรับส่วนต่างเข้าบัญชีทุน (equity) รายการแรก
  const dr = rows.reduce((s, r) => s + r.closeDr, 0);
  const cr = rows.reduce((s, r) => s + r.closeCr, 0);
  const diff = Math.round((dr - cr) * 100) / 100;
  if (diff !== 0) {
    const eq = rows.find(r => r.catType === 'equity') || rows.find(r => r.closeCr > 0);
    if (eq) {
      if (diff > 0) eq.closeCr = Math.round((eq.closeCr + diff) * 100) / 100;
      else {
        const as = rows.find(r => r.catType === 'asset') || rows.find(r => r.closeDr > 0);
        if (as) as.closeDr = Math.round((as.closeDr - diff) * 100) / 100;
      }
    }
  }
  return rows;
}

// ── หัวเอกสาร: ฟิลด์ label บน / control ล่าง ─────────────────────────
if (!document.getElementById('ob-page-style')) {
  const st = document.createElement('style');
  st.id = 'ob-page-style';
  st.textContent = '[data-screen-label="หน้าบันทึกแก้ยอดยกมาต้นปี"] .section-head > .head-bar { display: none !important; }'
    + '[data-screen-label="หน้าบันทึกแก้ยอดยกมาต้นปี"] .ob-search-actions { display: flex; gap: 8px; align-items: flex-end; }'
    + '[data-screen-label="หน้าบันทึกแก้ยอดยกมาต้นปี"] .ob-search-actions .btn { height: 32px; min-width: 96px; padding: 0 12px; justify-content: center; font-weight: 600; }';
  document.head.appendChild(st);
}

function ObField({ label, required, children, className }) {
  return (
    <div className={"ob-fld" + (className ? ' ' + className : '')}>
      <label className="ob-fld-lab">{label}{required && <span className="req"> *</span>}</label>
      {children}
    </div>
  );
}

// ── การ์ดสรุปยอดรวม (ล่างสุด) ───────────────────────────────────────
function ObTotalBox({ tone, label, value }) {
  return (
    <div className={"ob-total-box " + tone}>
      <div className="ob-total-lab">{label}</div>
      <div className="ob-total-val mono">{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
function OpeningBalanceEditPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));

  // หัวเอกสาร
  const [year, setYear]     = useState('2569');
  const [obDate, setObDate] = useState('2026-01-01');
  const [branch, setBranch] = useState(OB_BRANCHES[0]);
  const [refDoc, setRefDoc] = useState('OB-2568-00045');
  const [refDate, setRefDate] = useState('2025-12-31');
  const [desc, setDesc]     = useState('บันทึกแก้ไขยอดยกมาต้นปีบัญชี 2569');
  const [status, setStatus] = useState('draft');   // draft | posted
  const [version, setVersion] = useState(1);
  const [generated, setGenerated] = useState(false);

  // ตารางบัญชี
  const [rows] = useState(obBuildRows);
  // ค่ายกมาที่แก้ไขได้ + เหตุผล/หมายเหตุ — เก็บ override รายบัญชี
  const [edits, setEdits] = useState({});   // { [code]: { dr, cr, reason } }

  // ตัวกรอง
  const [qCode, setQCode] = useState('');
  const [qName, setQName] = useState('');
  const [fCat, setFCat]   = useState('all');
  const [fKind, setFKind] = useState('all');
  const [fStatus, setFStatus] = useState('active');
  const [onlyWithBal, setOnlyWithBal] = useState(false);
  const [onlyEdited, setOnlyEdited]   = useState(false);

  window.useBreadcrumb && window.useBreadcrumb(
    [{ label: 'ยอดยกมาต้นปี' }, { label: 'บันทึกแก้ยอดยกมาต้นปี', current: true }], []);

  // ค่ายกมาปัจจุบันของแต่ละบัญชี (ถ้าไม่แก้ = ยอดปิดปีก่อน)
  const carryOf = (r) => {
    const e = edits[r.code];
    return {
      dr: e && e.dr != null ? e.dr : r.closeDr,
      cr: e && e.cr != null ? e.cr : r.closeCr,
      reason: (e && e.reason) || '',
    };
  };
  const isEdited = (r) => {
    const c = carryOf(r);
    return Math.abs(c.dr - r.closeDr) > 0.005 || Math.abs(c.cr - r.closeCr) > 0.005;
  };

  const setCarry = (code, patch) =>
    setEdits(prev => ({ ...prev, [code]: { ...(prev[code] || {}), ...patch } }));

  // ── ตัวกรองแถว ─────────────────────────────────────────────────
  const shown = React.useMemo(() => rows.filter(r => {
    if (qCode && !r.code.includes(qCode.trim())) return false;
    if (qName && !r.name.includes(qName.trim())) return false;
    if (fCat !== 'all' && r.catType !== fCat) return false;
    if (fKind !== 'all' && r.kind !== fKind) return false;
    const c = carryOf(r);
    if (onlyWithBal && c.dr === 0 && c.cr === 0) return false;
    if (onlyEdited && !isEdited(r)) return false;
    return true;
  }), [rows, qCode, qName, fCat, fKind, onlyWithBal, onlyEdited, edits]);

  // ── ยอดรวม (จากค่ายกมาทั้งหมด ไม่ใช่เฉพาะที่กรอง) ───────────────
  const totals = React.useMemo(() => {
    let dr = 0, cr = 0, withBal = 0, edited = 0, abnormal = 0;
    rows.forEach(r => {
      const c = carryOf(r);
      dr += c.dr; cr += c.cr;
      if (c.dr !== 0 || c.cr !== 0) withBal++;
      if (isEdited(r)) edited++;
      if (c.dr !== 0 && c.cr !== 0) abnormal++;   // ทั้งสองด้านมียอด = ผิดปกติ
    });
    dr = Math.round(dr * 100) / 100; cr = Math.round(cr * 100) / 100;
    return { dr, cr, diff: Math.round((dr - cr) * 100) / 100, withBal, edited, abnormal, total: rows.length };
  }, [rows, edits]);

  const balanced = Math.abs(totals.diff) < 0.005;

  // ── ปุ่ม: ดึงยอดจากปีก่อน (รีเซ็ต carry = closing) ───────────────
  const pullPrevYear = () => {
    setEdits({});
    setGenerated(false);
    onToast && onToast(`ดึงยอดปิดปีบัญชี ${Number(year) - 1} มาเป็นยอดยกมาต้นปี ${year} เรียบร้อยแล้ว`);
    audit.log({ action: 'update', module: 'บัญชี — บันทึกแก้ยอดยกมาต้นปี',
      target: `ปีบัญชี ${year}`, summary: `ดึงยอดจากปีก่อนเข้ายอดยกมาต้นปี ${year}` });
  };

  // ── ปุ่ม: สร้างรายการบัญชี (Generate) ───────────────────────────
  const generate = () => {
    if (!balanced) { onToast && onToast('ยอดยกมาไม่สมดุล — ด้านลูกหนี้ต้องเท่ากับด้านเจ้าหนี้ก่อนสร้างรายการบัญชี'); return; }
    setGenerated(true);
    setStatus('posted');
    onToast && onToast(`สร้างรายการบัญชียอดยกมาต้นปี ${year} เรียบร้อยแล้ว (${totals.withBal} บัญชีที่มียอด)`);
    audit.log({ action: 'create', module: 'บัญชี — บันทึกแก้ยอดยกมาต้นปี',
      target: `ปีบัญชี ${year}`,
      summary: `สร้างรายการบัญชียอดยกมาต้นปี ${year} · รวม ${obMoney(totals.dr)} บาท (สมดุล)`,
      changes: [
        { field: 'ยอดรวมด้านลูกหนี้', before: '—', after: obMoney(totals.dr) },
        { field: 'ยอดรวมด้านเจ้าหนี้', before: '—', after: obMoney(totals.cr) },
      ] });
  };

  const catLabel = (t) => (window.acctCatLabel ? window.acctCatLabel('type', t) : t);
  const catTone = (t) => ({ asset: 'primary', liability: 'warning', equity: 'info', revenue: 'success', expense: 'danger' }[t] || 'neutral');

  const clearFilters = () => {
    setQCode(''); setQName(''); setFCat('all'); setFKind('all'); setFStatus('active');
    setOnlyWithBal(false); setOnlyEdited(false);
  };

  return (
    <div data-screen-label="หน้าบันทึกแก้ยอดยกมาต้นปี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกแก้ยอดยกมาต้นปี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            ปรับปรุงยอดยกมาต้นปีบัญชีรายบัญชี — ดึงยอดปิดจากปีก่อน แก้ไขยอดยกมาด้านลูกหนี้ (เดบิต) / ด้านเจ้าหนี้ (เครดิต)
            ให้สมดุล แล้วสร้างรายการบัญชียอดยกมาเข้าสมุดบัญชี
          </div>
        </div>
      </div>

      {/* ── ข้อมูลเอกสาร ────────────────────────────────────────── */}
      <div className="search-card ob-doc-card">
        <div className="section-head">
          <span className="head-bar" /><h3>ข้อมูลเอกสาร</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn accent sm" onClick={pullPrevYear}>
              <Icon name="download" size={13} /> ดึงยอดจากปีก่อน
            </button>
            <button className="btn primary sm" onClick={generate}>
              <Icon name="refresh" size={13} /> สร้างรายการบัญชี (Generate)
            </button>
          </div>
        </div>

        <div className="ob-doc-grid">
          <ObField label="ปีบัญชี" required>
            <select className="cfg-input" value={year} onChange={e => setYear(e.target.value)}>
              {OB_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </ObField>
          <ObField label="วันที่ยอดยกมา" required>
            <window.ThaiDateField value={obDate} onChange={setObDate} />
          </ObField>
          <ObField label="สาขา/หน่วยงาน" required>
            <select className="cfg-input" value={branch} onChange={e => setBranch(e.target.value)}>
              {OB_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </ObField>
          <ObField label="เลขที่เอกสาร">
            <input className="cfg-input mono" value={`OB-${year}-00001`} readOnly />
          </ObField>
          <ObField label="สถานะ">
            <span className={"pill " + (status === 'posted' ? 'ok' : 'warn')} style={{ alignSelf: 'flex-start' }}>
              {status === 'posted' ? 'สร้างรายการแล้ว' : 'ร่าง'}
            </span>
          </ObField>

          <ObField label="ประเภทการบันทึก" required>
            <select className="cfg-input" defaultValue="edit">
              <option value="edit">แก้ไขยอดยกมาต้นปี</option>
              <option value="new">บันทึกยอดยกมาต้นปีใหม่</option>
            </select>
          </ObField>
          <ObField label="อ้างอิงจาก">
            <input className="cfg-input mono" value={refDoc} onChange={e => setRefDoc(e.target.value)} />
          </ObField>
          <ObField label="วันที่อ้างอิง">
            <window.ThaiDateField value={refDate} onChange={setRefDate} />
          </ObField>
          <ObField label="ผู้บันทึก">
            <input className="cfg-input" value={OB_USER} readOnly />
          </ObField>
          <ObField label="เวอร์ชัน">
            <input className="cfg-input mono" value={version} readOnly style={{ width: 80 }} />
          </ObField>

          <ObField label="คำอธิบายรายการ" className="ob-span-full">
            <input className="cfg-input" value={desc} onChange={e => setDesc(e.target.value)}
                   placeholder="คำอธิบายเอกสารยอดยกมาต้นปี" />
          </ObField>
        </div>
      </div>

      {/* ── ค้นหา ───────────────────────────────────────────────── */}
      <div className="search-card ob-search-card">
        <div className="section-head">
          <span className="head-bar" /><h3>ค้นหา</h3>
        </div>
        <div className="ob-search-grid">
          <ObField label="รหัสบัญชี">
            <input className="cfg-input mono" value={qCode} placeholder="ค้นหารหัสบัญชี"
                   onChange={e => setQCode(e.target.value)} />
          </ObField>
          <ObField label="ชื่อบัญชี">
            <input className="cfg-input" value={qName} placeholder="ค้นหาชื่อบัญชี"
                   onChange={e => setQName(e.target.value)} />
          </ObField>
          <ObField label="หมวดบัญชี">
            <select className="cfg-input" value={fCat} onChange={e => setFCat(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="asset">สินทรัพย์</option>
              <option value="liability">หนี้สิน</option>
              <option value="equity">ส่วนของทุน</option>
              <option value="revenue">รายได้</option>
              <option value="expense">ค่าใช้จ่าย</option>
            </select>
          </ObField>
          <ObField label="กลุ่มบัญชี">
            <select className="cfg-input" value={fKind} onChange={e => setFKind(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="control">บัญชีคุม</option>
              <option value="posting">บัญชีย่อย (ลงรายการ)</option>
            </select>
          </ObField>
          <ObField label="สถานะบัญชี">
            <select className="cfg-input" value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="active">ใช้งาน</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </ObField>

          <div className="ob-search-checks">
            <label className="ob-check">
              <input type="checkbox" checked={onlyWithBal} onChange={e => setOnlyWithBal(e.target.checked)} />
              <span>แสดงเฉพาะบัญชีที่มียอด</span>
            </label>
            <label className="ob-check">
              <input type="checkbox" checked={onlyEdited} onChange={e => setOnlyEdited(e.target.checked)} />
              <span>แสดงเฉพาะที่มีการแก้ไข</span>
            </label>
          </div>
          <div className="ob-search-actions">
            <button className="btn primary">ค้นหา</button>
            <button className="btn" onClick={clearFilters}>ล้าง</button>
          </div>
        </div>
      </div>

      {/* ── ตารางยอดยกมา ────────────────────────────────────────── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <h3>ตารางยอดยกมาต้นปี</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>แสดง {shown.length} / {rows.length} บัญชี</span>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
          <Icon name="info" size={12} /> แก้ไขยอดในช่อง <b>ยกมา ด้านลูกหนี้ (เดบิต)</b> และ <b>ยกมา ด้านเจ้าหนี้ (เครดิต)</b> ได้โดยตรง · ผลต่างเทียบกับยอดปิดปีก่อนจะคำนวณให้อัตโนมัติ
        </div>

        <div className="table-wrap ob-table-wrap" style={{ border: 0 }}>
          <table className="tbl ob-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 54 }}>ลำดับ</th>
                <th style={{ width: 92 }}>รหัสบัญชี</th>
                <th style={{ minWidth: 240 }}>ชื่อบัญชี</th>
                <th style={{ width: 104 }}>หมวดบัญชี</th>
                <th style={{ width: 92 }}>ประเภทบัญชี</th>
                <th className="right ob-col-close" style={{ width: 130 }}>ยอดปิดปีก่อน<br/>(เดบิต)</th>
                <th className="right ob-col-close" style={{ width: 130 }}>ยอดปิดปีก่อน<br/>(เครดิต)</th>
                <th className="right ob-col-dr" style={{ width: 150 }}>ยกมา ด้านลูกหนี้<br/>(เดบิต)</th>
                <th className="right ob-col-cr" style={{ width: 150 }}>ยกมา ด้านเจ้าหนี้<br/>(เครดิต)</th>
                <th className="right" style={{ width: 100 }}>ผลต่าง<br/>(เดบิต)</th>
                <th className="right" style={{ width: 100 }}>ผลต่าง<br/>(เครดิต)</th>
                <th style={{ minWidth: 150 }}>เหตุผลการแก้ไข</th>
                <th className="center" style={{ width: 96 }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={13} className="center muted" style={{ padding: '32px 12px' }}>
                  ไม่พบบัญชีตามเงื่อนไขการค้นหา
                </td></tr>
              )}
              {shown.map((r, i) => {
                const c = carryOf(r);
                const diffDr = Math.round((c.dr - r.closeDr) * 100) / 100;
                const diffCr = Math.round((c.cr - r.closeCr) * 100) / 100;
                const edited = isEdited(r);
                const abnormal = c.dr !== 0 && c.cr !== 0;
                return (
                  <tr key={r.code} className={edited ? 'ob-row-edited' : ''}>
                    <td className="center mono ob-order">{i + 1}</td>
                    <td className="mono">{r.code}</td>
                    <td className="ob-name">{r.name}</td>
                    <td><span className={"chip " + catTone(r.catType)}>{catLabel(r.catType)}</span></td>
                    <td className="muted" style={{ fontSize: 12 }}>{r.kind === 'control' ? 'บัญชีคุม' : 'บัญชีย่อย'}</td>
                    <td className="right mono ob-col-close">{obMoney(r.closeDr)}</td>
                    <td className="right mono ob-col-close">{obMoney(r.closeCr)}</td>
                    <td className="ob-col-dr ob-edit-cell">
                      <input className="cfg-input ob-amt mono" value={c.dr === 0 ? '' : c.dr}
                             placeholder="0.00" inputMode="decimal"
                             onChange={e => setCarry(r.code, { dr: obNum(e.target.value) })} />
                    </td>
                    <td className="ob-col-cr ob-edit-cell">
                      <input className="cfg-input ob-amt mono" value={c.cr === 0 ? '' : c.cr}
                             placeholder="0.00" inputMode="decimal"
                             onChange={e => setCarry(r.code, { cr: obNum(e.target.value) })} />
                    </td>
                    <td className={"right mono " + (diffDr ? 'ob-diff-dr' : 'muted')}>{obMoney(diffDr)}</td>
                    <td className={"right mono " + (diffCr ? 'ob-diff-cr' : 'muted')}>{obMoney(diffCr)}</td>
                    <td className="ob-edit-cell">
                      <input className="cfg-input ob-reason" value={c.reason}
                             placeholder={edited ? 'ระบุเหตุผล' : '—'}
                             disabled={!edited}
                             onChange={e => setCarry(r.code, { reason: e.target.value })} />
                    </td>
                    <td className="center">
                      {abnormal
                        ? <span className="pill bad">ผิดปกติ</span>
                        : edited
                          ? <span className="pill info">มีการแก้ไข</span>
                          : <span className="ob-note-normal">ยอดปกติ</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── สรุปยอด ─────────────────────────────────────────────── */}
      <div className="search-card ob-summary">
        <div className="ob-sum-counts">
          <div className="section-head" style={{ marginBottom: 8 }}>
            <span className="head-bar" /><h3>สรุปยอด</h3>
          </div>
          <div className="ob-count-row">
            <div className="ob-count"><div className="ob-count-lab">จำนวนบัญชีทั้งหมด</div><div className="ob-count-val">{totals.total.toLocaleString()}</div></div>
            <div className="ob-count"><div className="ob-count-lab">จำนวนบัญชีที่มียอด</div><div className="ob-count-val ob-c-info">{totals.withBal}</div></div>
            <div className="ob-count"><div className="ob-count-lab">จำนวนบัญชีที่แก้ไข</div><div className="ob-count-val ob-c-warn">{totals.edited}</div></div>
            <div className="ob-count"><div className="ob-count-lab">จำนวนบัญชีผิดปกติ</div><div className={"ob-count-val " + (totals.abnormal ? 'ob-c-bad' : '')}>{totals.abnormal}</div></div>
          </div>
        </div>
        <div className="ob-sum-totals">
          <ObTotalBox tone="dr"  label="ยอดรวมด้านลูกหนี้ (เดบิต)"  value={obMoney(totals.dr)} />
          <ObTotalBox tone="cr"  label="ยอดรวมด้านเจ้าหนี้ (เครดิต)" value={obMoney(totals.cr)} />
          <ObTotalBox tone="net" label="ผลต่าง (เดบิต − เครดิต)"      value={obMoney(totals.diff)} />
          <div className="ob-balance-flag">
            <div className="ob-total-lab">สถานะ</div>
            <div className={"ob-balance-val " + (balanced ? 'ok' : 'bad')}>
              <Icon name={balanced ? 'check' : 'info'} size={15} /> {balanced ? 'สมดุล' : 'ไม่สมดุล'}
            </div>
            <div className="ob-balance-sub">(เดบิต = เครดิต)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OpeningBalanceEditPage });
