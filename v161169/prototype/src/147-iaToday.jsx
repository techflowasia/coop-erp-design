// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — บันทึกเบี้ยประกันค้าง / ตั้งดอกเบี้ยค้าง
//  (บันทึกข้อมูลเบี้ยประกัน/ตั้งดอกเบี้ยค้าง — ใบปรับปรุงต่อสัญญาเงินกู้)
//  เลือกสมาชิก+สัญญา → เลือกประเภทปรับปรุง → ระบุยอดปรับปรุง (เงินต้น/ดอกเบี้ย)
//  ต่อรายการสัญญา → รวมเป็น "ยอดปรับปรุง" → บันทึกใบปรับปรุง
//  ใช้รูปแบบกลาง: ContractSearchField · ccdContractInfo · DN_MEMBERS
// ════════════════════════════════════════════════════════════════════

const iaToday = () => window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10);

// ประเภทการปรับปรุง
const IA_ADJ_TYPES = [
  { v: 'INS', l: 'INS-ปรับเบี้ยประกัน' },
  { v: 'INT', l: 'INT-ตั้งดอกเบี้ยค้าง' },
  { v: 'PRN', l: 'PRN-ปรับเงินต้นค้าง' },
  { v: 'FEE', l: 'FEE-ปรับค่าธรรมเนียมค้าง' },
];
// โหมดปรับยอดอนุมัติ
const IA_APPROVE_MODES = [
  { v: 'none', l: 'ไม่ปรับยอดอนุมัติ' },
  { v: 'add',  l: 'ปรับเพิ่มยอดอนุมัติ' },
  { v: 'sub',  l: 'ปรับลดยอดอนุมัติ' },
];
// ชุดข้อมูล (งวดบัญชี)
const IA_DATASETS = ['2569 – ปีบัญชีปัจจุบัน', '2568 – ปีบัญชีก่อน', '2567 – ปีบัญชีย้อนหลัง'];

// เลขที่ใบปรับปรุง (auto) — IA-{พ.ศ.ย่อ}-{running 5 หลัก}
const iaNextNo = (beYear) => {
  const yy = String(beYear).slice(-2);
  const n = 100 + Math.floor(Math.random() * 900);
  return `IA-${yy}-${String(n).padStart(5, '0')}`;
};

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function IaFld({ label, w, grow, span, required, children }) {
  const style = span ? { gridColumn: 'span ' + span, minWidth: 0 } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function IaRO({ value, mono, num, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ใบปรับปรุงที่บันทึกแล้วต่อสมาชิก (บันทึกใบใหม่ทุกครั้ง) — ใช้แสดง badge บันทึกล่าสุด
window.IA_RECORDS = window.IA_RECORDS || {
  'M-067012': [{ no: 'IA-69-00412', contractNo: 'L-2022-0455', docDate: '2026-05-28', txnDate: '2026-05-28', adjType: 'INS',
    dataset: '2569 – ปีบัญชีปัจจุบัน', approveMode: 'none', reason: 'ตั้งเบี้ยประกันอัคคีภัยค้างชำระ งวด 2569',
    xferFire: true, xferProject: false, savedAt: '2026-05-28T14:23',
    lines: { 'L-2022-0455': { principal: '1250', interest: '0', selected: true } } }],
};
const iaStamp = (iso) => (window.savedBadgeLabel && window.savedBadgeLabel(iso)) || ('บันทึกล่าสุด: ' + iso);

const iaNum = (v) => Number(String(v).replace(/[^0-9.-]/g, '')) || 0;

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function IaFormScreen({ onToast, audit }) {
  const today = iaToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember]       = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [docDate, setDocDate]     = useState(today);   // วันที่ใบปรับปรุง
  const [txnDate, setTxnDate]     = useState(today);   // วันที่รายการ
  const [adjType, setAdjType]     = useState('INS');
  const [dataset, setDataset]     = useState(IA_DATASETS[0]);
  const [approveMode, setApproveMode] = useState('none');
  const [reason, setReason]       = useState('');
  const [xferFire, setXferFire]   = useState(false);
  const [xferProject, setXferProject] = useState(false);
  const [rows, setRows]           = useState([]);       // [{code, contractNo, loanType, principal, interest, outstanding, selected}]
  const [savedNo, setSavedNo]     = useState('');
  const [error, setError]         = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [histOpen, setHistOpen]   = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [okMsg, setOkMsg]         = useState(null);

  const loaded = rows.length > 0;
  const ro = !member;

  // ── โหลดสัญญาทั้งหมดของสมาชิก แล้วเลือกสัญญาที่กดมาเป็นค่าตั้งต้น ──
  const loadContract = (m, debt) => {
    const debts = (m.debts || []);
    const built = debts.map((d) => {
      const info = window.ccdContractInfo(d);
      return {
        code: 'LON',
        contractNo: d.contractNo,
        loanType: d.type,
        outstanding: info ? info.outstanding : (d.principalRemaining || 0),
        principal: '',
        interest: '',
        selected: d.contractNo === debt.contractNo,
      };
    });
    const recs = window.IA_RECORDS[m.code] || [];
    setMember(m);
    setContractNo(debt.contractNo);
    setRows(built);
    setSavedNo('');
    setError('');
    setLastSaved(recs.length ? recs[recs.length - 1].savedAt : null);
  };

  // ── เพิ่มใหม่ = ล้างหน้าจอ เพื่อค้นหาสมาชิกรายถัดไป ──
  const clearScreen = () => {
    setMember(null); setContractNo(''); setRows([]); setReason('');
    setAdjType('INS'); setApproveMode('none'); setDataset(IA_DATASETS[0]);
    setXferFire(false); setXferProject(false);
    setDocDate(today); setTxnDate(today); setSavedNo(''); setError(''); setLastSaved(null);
  };
  const askClear = () => { if (member) setClearOpen(true); else clearScreen(); };

  const updateRow = (i, patch) => setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const rowAdjust = (r) => iaNum(r.principal) + iaNum(r.interest);
  const totalAdjust = rows.reduce((s, r) => s + (r.selected ? rowAdjust(r) : 0), 0);


  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก / สัญญาก่อนบันทึกใบปรับปรุง';
    const picked = rows.filter((r) => r.selected);
    if (picked.length === 0) return 'กรุณาเลือกรายการสัญญาที่ต้องการปรับปรุงอย่างน้อย 1 รายการ';
    if (!(totalAdjust !== 0)) return 'ยอดปรับปรุงต้องไม่เป็นศูนย์ — กรุณาระบุยอดเงินต้น/ดอกเบี้ยที่ต้องการปรับปรุง';
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const no = iaNextNo(beYear);
    setSavedNo(no);
    const savedAt = today + 'T' + new Date().toTimeString().slice(0, 5);
    window.IA_RECORDS[member.code] = [...(window.IA_RECORDS[member.code] || []), { no, contractNo, docDate, txnDate, adjType, dataset, approveMode, reason, xferFire, xferProject, savedAt,
      lines: Object.fromEntries(rows.filter(r => r.selected).map(r => [r.contractNo, { principal: r.principal, interest: r.interest, selected: true }])) }];
    setLastSaved(savedAt);
    setOkMsg({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', detail: `บันทึกใบปรับปรุง ${no} · ${member.name} — ยอดปรับปรุง ${window.fmt.money(totalAdjust, 2)} บาท เรียบร้อยแล้ว` });
    const typeLabel = (IA_ADJ_TYPES.find((t) => t.v === adjType) || {}).l || adjType;
    audit && audit.log && audit.log({
      action: 'create', module: 'สินเชื่อ — บันทึกเบี้ยประกันค้าง / ตั้งดอกเบี้ยค้าง',
      target: `${member.code} · ${member.name}`,
      summary: `ใบปรับปรุง ${no} · ${typeLabel} · สัญญา ${contractNo} · ยอดปรับปรุง ${window.fmt.money(totalAdjust, 2)} บาท`,
      changes: [
        { field: 'ประเภทปรับปรุง', before: '—', after: typeLabel },
        { field: 'ยอดปรับปรุง', before: '—', after: window.fmt.money(totalAdjust, 2) },
        ...(reason ? [{ field: 'เหตุผลที่ปรับปรุง', before: '—', after: reason }] : []),
      ],
    });
  };

  const doPrint = () => {
    if (!loaded) { setError('กรุณาเลือกสัญญาก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบปรับปรุงเบี้ยประกันค้าง / ดอกเบี้ยค้าง…');
    setTimeout(() => window.print(), 80);
  };

  const totalOk = totalAdjust !== 0;

  return (
    <div data-screen-label="บันทึกเบี้ยประกันค้าง / ตั้งดอกเบี้ยค้าง">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>บันทึกข้อมูลเบี้ยประกัน / ตั้งดอกเบี้ยค้าง</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · บันทึกใบปรับปรุงเบี้ยประกันค้าง และตั้งดอกเบี้ย/เงินต้นค้างของสัญญาเงินกู้</div>
          </div>
        </div>
        <div className="icr-form-actions">
          {member && lastSaved && <span className="saved-badge">{iaStamp(lastSaved)}</span>}
          <button className="btn sm" disabled={!member} onClick={() => setHistOpen(true)}><Icon name="history" size={13} /> ประวัติ</button>
          <button className="btn sm" disabled={!member} onClick={doPrint}><Icon name="print" size={13} /> พิมพ์เอกสาร</button>
          <button className="btn sm" disabled={!member} onClick={askClear}><Icon name="plus" size={13} /> เพิ่มใหม่</button>
          <button className="btn primary sm" disabled={!member} onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}


      {/* ── ① ข้อมูลใบปรับปรุง ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลใบปรับปรุง</h3></div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', alignItems: 'flex-start' }}>
          <IaFld label="เลขที่ใบปรับปรุง" span={1}>
            {savedNo ? <IaRO value={savedNo} mono /> : <div className="icr-ro icr-auto">Auto</div>}
          </IaFld>
          <IaFld label="เลขทะเบียน / เลขที่สัญญา" span={2} required>
            {(
              <ContractSearchField contract={contractNo} member={member}
                                   onPick={({ member: m, debt }) => loadContract(m, debt)}
                                   source={window.DN_MEMBERS}
                                   title="ค้นหาสัญญาเงินกู้ — บันทึกเบี้ยประกันค้าง / ตั้งดอกเบี้ยค้าง"
                                   placeholder="ค้นหาด้วยเลขที่สัญญา หรือเลขสมาชิก…" />
            )}
          </IaFld>
          <IaFld label="เลขสมาชิก" span={1}><IaRO value={member ? member.code : ''} mono placeholder="(เลือกสมาชิก)" /></IaFld>
          <IaFld label="ชื่อ-นามสกุล" span={3}><IaRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></IaFld>
        </div>

        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', alignItems: 'flex-start', marginTop: 16 }}>
          <IaFld label="วันที่ใบปรับปรุง" span={1}>
            <ErpDate value={docDate} disabled={ro} onChange={(v) => setDocDate(v)} className="cfg-input" />
          </IaFld>
          <IaFld label="วันที่รายการ" span={1}>
            <ErpDate value={txnDate} disabled={ro} onChange={(v) => setTxnDate(v)} className="cfg-input" />
          </IaFld>
          <IaFld label="ประเภทปรับปรุง" span={2}>
            <select className="cfg-input" disabled={ro} value={adjType} onChange={(e) => setAdjType(e.target.value)}>
              {IA_ADJ_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </IaFld>
          <IaFld label="ชุดข้อมูลที่" span={1}>
            <select className="cfg-input" disabled={ro} value={dataset} onChange={(e) => setDataset(e.target.value)}>
              {IA_DATASETS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </IaFld>
          <IaFld label="ยอดปรับปรุง" span={2}>
            <div className={'ia-total-box' + (totalOk ? '' : ' zero')}>{window.fmt.money(totalAdjust, 2)}</div>
          </IaFld>
        </div>

        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', alignItems: 'flex-start', marginTop: 16 }}>
          <IaFld label="เหตุผลที่ปรับปรุง" span={5}>
            <input className="cfg-input" disabled={ro} value={reason} onChange={(e) => setReason(e.target.value)}
                   placeholder="ระบุเหตุผลการปรับปรุง เช่น ตั้งเบี้ยประกันอัคคีภัยค้างชำระ งวด 2569" />
          </IaFld>
          <IaFld label="การปรับยอดอนุมัติ" span={2}>
            <select className="cfg-input" disabled={ro} value={approveMode} onChange={(e) => setApproveMode(e.target.value)}>
              {IA_APPROVE_MODES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </IaFld>
        </div>

        <div className="ia-xfer">
          <label className="ia-check">
            <input type="checkbox" disabled={ro} checked={xferFire} onChange={(e) => setXferFire(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            <span>โอนเบี้ยประกันอัคคีภัย</span>
          </label>
          <label className="ia-check">
            <input type="checkbox" disabled={ro} checked={xferProject} onChange={(e) => setXferProject(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
            <span>โอนเบี้ยประกันโครงการประกัน</span>
          </label>
        </div>
      </div>

      {/* ── ② รายการปรับปรุง ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>รายการปรับปรุง</h3>
          <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>
            {loaded ? `เลือก ${rows.filter((r) => r.selected).length} จาก ${rows.length} สัญญา` : '— เลือกสมาชิก/สัญญาเพื่อแสดงรายการ —'}
          </span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl ia-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }} />
                <th style={{ width: 64 }}>รหัส</th>
                <th>รายการ</th>
                <th className="center" style={{ width: 150 }}>ตั้ง ต.บ ถึงวันที่</th>
                <th className="num" style={{ width: 150 }}>เงินต้น</th>
                <th className="num" style={{ width: 150 }}>ดอกเบี้ย</th>
                <th className="num" style={{ width: 150 }}>รวมปรับปรุง</th>
                <th className="num" style={{ width: 150 }}>คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                <tr><td colSpan="8" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>เลือกสมาชิก/สัญญาเพื่อแสดงรายการปรับปรุง</td></tr>
              ) : rows.map((r, i) => {
                const adj = rowAdjust(r);
                return (
                  <tr key={r.contractNo} className={r.selected ? 'ia-row-on' : ''}>
                    <td className="center">
                      <input type="checkbox" disabled={ro} checked={r.selected} onChange={(e) => updateRow(i, { selected: e.target.checked })} aria-label="เลือกรายการ" style={{ accentColor: 'var(--primary)' }} />
                    </td>
                    <td><span className="chip">{r.code}</span></td>
                    <td className="mono">{r.contractNo} <span className="muted">({r.loanType})</span></td>
                    <td className="center mono">{window.fmt.date(txnDate)}</td>
                    <td className="num">
                      <input className="cfg-input mono ia-in" type="number" step="0.01" value={r.principal}
                             disabled={ro || !r.selected} placeholder="0.00"
                             onChange={(e) => updateRow(i, { principal: e.target.value })} />
                    </td>
                    <td className="num">
                      <input className="cfg-input mono ia-in" type="number" step="0.01" value={r.interest}
                             disabled={ro || !r.selected} placeholder="0.00"
                             onChange={(e) => updateRow(i, { interest: e.target.value })} />
                    </td>
                    <td className={'num mono' + (r.selected && adj === 0 ? ' ia-adj-zero' : '')}>{window.fmt.money(adj, 2)}</td>
                    <td className="num mono">{window.fmt.money(r.outstanding, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
            {loaded && (
              <tfoot>
                <tr className="ia-total-row">
                  <td colSpan="6" className="ia-total-label">รวมยอดปรับปรุง (รายการที่เลือก)</td>
                  <td className={'num mono' + (totalOk ? '' : ' ia-adj-zero')}>{window.fmt.money(totalAdjust, 2)}</td>
                  <td className="num mono">{window.fmt.money(rows.reduce((s, r) => s + r.outstanding, 0), 2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        {loaded && (
          <div className="icr-restruct-note" style={{ marginTop: 10 }}>
            <Icon name="info" size={13} />
            <span>ระบุยอด <b>เงินต้น</b> และ/หรือ <b>ดอกเบี้ย</b> ที่ต้องการตั้งค้างในแต่ละสัญญาที่เลือก — ระบบจะรวมเป็น “ยอดปรับปรุง” และบันทึกเป็นใบปรับปรุงต่อสัญญา</span>
          </div>
        )}
      </div>

      {clearOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setClearOpen(false)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
            <button className="close-btn" onClick={() => setClearOpen(false)} aria-label="ปิด" style={{ position: 'absolute', top: 14, right: 14, background: '#fff', border: 'none', boxShadow: 'none', color: 'var(--text-muted)' }}><Icon name="close" /></button>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: 34, paddingBottom: 26 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--warning-50)', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name="info" size={26} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>ล้างหน้าจอ?</h2>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>ข้อมูลที่กรอกไว้ทั้งหมดในหน้านี้จะถูกล้าง และไม่ถูกบันทึก</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
                <button className="btn" style={{ minWidth: 120, justifyContent: 'center' }} onClick={() => setClearOpen(false)}>ยกเลิก</button>
                <button className="btn primary" style={{ minWidth: 140, justifyContent: 'center' }} onClick={() => { setClearOpen(false); clearScreen(); }}>ล้างหน้าจอ</button>
              </div>
            </div>
          </div>
        </>
      )}
      {okMsg && window.StatusModal && <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail} onClose={() => { setOkMsg(null); clearScreen(); }} />}
      {histOpen && window.CcdHistoryModal && <window.CcdHistoryModal title={`ใบปรับปรุง · ${member ? member.code + ' ' + member.name : ''}`} onClose={() => setHistOpen(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function InsuranceArrearsPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <IaFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { InsuranceArrearsPage, IaFormScreen });
